/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2024
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

package de.appplant.cordova.plugin.localnotification;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.collection.ArraySet;
import androidx.core.util.Pair;
import android.util.Log;
import android.util.SparseArray;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import static android.app.PendingIntent.FLAG_CANCEL_CURRENT;
import static android.os.Build.VERSION.SDK_INT;

import de.appplant.cordova.plugin.localnotification.receiver.TriggerReceiver;
import de.appplant.cordova.plugin.localnotification.trigger.OptionsTrigger;
import de.appplant.cordova.plugin.localnotification.trigger.IntervalTrigger;
import de.appplant.cordova.plugin.localnotification.trigger.MatchTrigger;

/**
 * Wrapper class around OS notification class. Handles basic operations
 * like show, delete, cancel for a single local notification instance.
 */
public final class Notification {

    private static final String TAG = "Notification";

    // Used to differ notifications by their life cycle state
    public enum Type {
        ALL, SCHEDULED, TRIGGERED
    }

    // Extra key for the id
    public static final String EXTRA_ID = "NOTIFICATION_ID";

    // Extra key for the update flag
    public static final String EXTRA_UPDATE = "NOTIFICATION_UPDATE";

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    /**
     * trigger property, can be {@link IntervalTrigger} or {@link MatchTrigger}.
     */
    private OptionsTrigger optionsTrigger;

    /**
     * Notification builder instance. Can be {@code null}.
     */
    private NotificationCompat.Builder builder;

    /**
     * Constructor
     * @param context Application context.
     * @param options Parsed notification options.
     */
    public Notification(Context context, Options options) {
        this(context, options, null);
    }

    /**
     * Constructor
     * @param context Application context.
     * @param options Parsed notification options.
     * @param builder Pre-configured notification builder.
     */
    Notification(Context context, Options options, NotificationCompat.Builder builder) {
        this.context = context;
        this.builder = builder;
        this.options = options;
        this.optionsTrigger = options.getTrigger();
    }

    public void setBuilder(NotificationCompat.Builder builder) {
        this.builder = builder;
    }

    /**
     * Get application context.
     */
    public Context getContext() {
        return context;
    }

    /**
     * Get notification options.
     */
    public Options getOptions() {
        return options;
    }

    /**
     * Get notification ID.
     */
    public int getId() {
        return options.getId();
    }

    /**
     * The action identifier in the form NOTIFICATION_ID{notification-id}-{occurrence} like "NOTIFICATION_ID1173-1"
     */
    String getIntentActionIdentifier() {
        return Manager.PREF_KEY_ID + options.getId();
    }


    /**
     * Notification type can be one of triggered or scheduled.
     */
    public Type getType() {
        for (StatusBarNotification statusBarNotification : new Manager(context).getActiveNotifications()) {
            if (statusBarNotification.getId() == getId()) {
                return Type.TRIGGERED;
            }
        }

        return Type.SCHEDULED;
    }

    /**
     * Schedules the first or next occurrence of the notification. This has also to be called
     * when the notification is scheduled for the first time, so the first occurrence
     * can be calculated.
     * @return true if the notification was scheduled, false otherwise, which can happen,
     * if the notification was triggered directly, an error occured or there is no next trigger date.
     */
    public boolean scheduleNext() {
        Date triggerDate = optionsTrigger.getNextTriggerDate();

        // No next trigger date available, all triggers are done
        // The notification will not be removed from SharedPreferences.
        // This will always do the ClearReceiver and ClickHandlerActivity
        if (triggerDate == null) {
            Log.d(TAG, "No next trigger date available" +
                ", notificationId=" + options.getId() +
                ", occurrence=" + optionsTrigger.getOccurrence() +
                ", triggerBaseDate=" + optionsTrigger.getBaseDate() +
                ", triggerDate=" + optionsTrigger.getTriggerDate() +
                ", options=" + options);
            
            return false;
        }

        return schedule();
    }

    /**
     * Schedules the notification with the current state of the dateTrigger.
     * If the triggerDate is in the past, the notification will be triggered directly.
     * @return true if the notification was scheduled, false otherwise, which can happen,
     * if the notification was triggered directly or an error occured.
     */
    public boolean schedule() {
        Date triggerDate = optionsTrigger.getTriggerDate();

        if (triggerDate == null) {
            Log.e(TAG, "schedule was wrongly called with triggerDate = null, options=" + options);
            return false;
        }

        // Create channel if not exists
        Manager.createChannel(getContext(), options);

        Intent intent = new Intent(context, TriggerReceiver.class)
            // action identifier for the intent like "NOTIFICATION_ID1173"
            .setAction(getIntentActionIdentifier())
            // Notification-ID
            .putExtra(EXTRA_ID, options.getId());

        // Store notification data for restoration
        storeInSharedPreferences();

        // Date is in the past, trigger directly
        if (!triggerDate.after(new Date())) {
            trigger(intent);
            return false;
        }

        boolean canScheduleExactAlarms = Manager.canScheduleExactAlarms(context);

        Log.d(TAG, "Schedule notification" +
            ", notificationId: " + options.getId() +
            ", canScheduleExactAlarms: " + canScheduleExactAlarms +
            ", intentAction=" + intent.getAction() +
            ", occurrence: " + optionsTrigger.getOccurrence() +
            ", triggerDate: " + triggerDate +
            ", options=" + options);
        
        // AlarmManager.set: If there is already an alarm scheduled for the same IntentSender,
        // that previous alarm will first be canceled.
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        // A maximum of 500 alarms can be scheduled, catch exception
        try {
            // Execute alarm even when the system is in low-power idle (a.k.a. doze) modes.
            if (options.isAndroidAllowWhileIdle()) {
                if (canScheduleExactAlarms) {
                    getAlarmManager().setExactAndAllowWhileIdle(
                        options.getAndroidAlarmType(), triggerDate.getTime(), pendingIntent);
                } else {
                    getAlarmManager().setAndAllowWhileIdle(
                        options.getAndroidAlarmType(), triggerDate.getTime(), pendingIntent);
                }

                // Execute alarm by RTC or RTC_WAKEUP
            } else {
                if (canScheduleExactAlarms) {
                    getAlarmManager().setExact(
                        options.getAndroidAlarmType(), triggerDate.getTime(), pendingIntent);
                } else {
                    getAlarmManager().set(
                        options.getAndroidAlarmType(), triggerDate.getTime(), pendingIntent);
                }
            }

            return true;

            // Maximum 500 alarms can be scheduled.
            // If more are scheduled, an exception will be thrown.
        } catch (Exception exception) {
            Log.d(TAG, "Exception occurred during scheduling notification", exception);
            return false;
        }
    }

    /**
     * Trigger local notification specified by intent.
     * @param intent The intent to broadcast.
     */
    private void trigger(Intent intent) {
        new TriggerReceiver().onReceive(context, intent);
    }

    /**
     * Present the local notification to user.
     */
    public void show() {
        if (builder == null) return;
        Log.d(TAG, "Show notification, options=" + options);
        NotificationManagerCompat.from(context).notify(
            LocalNotification.getAppName(context),
            getId(), builder.build());
    }

    /**
     * Update the notification properties.
     * @param updates The properties to update.
     */
    void update(JSONObject updates) {
        // Update options of notification
        mergeJSONObjects(updates);
        Log.d(TAG, "Update notification, options=" + options);

        // Store notification data
        storeInSharedPreferences();

        // Update already triggered notification in status bar
        if (getType() == Type.TRIGGERED) {
            Intent intent = new Intent(context, TriggerReceiver.class)
                    .setAction(Manager.PREF_KEY_ID + options.getId())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Notification.EXTRA_UPDATE, true);

            trigger(intent);
        }
    }

    /**
     * Clears the notification from Statusbar. If the notification was the last one,
     * the notification will be removed from SharedPreferences.
     * The WebView will receive a clear event, if the app is running.
     */
    public void clear() {
        Log.d(TAG, "Clear notification, options=" + options);

        // Clear the notification from the statusbar if posted
        NotificationManagerCompat.from(context).cancel(LocalNotification.getAppName(context), getId());

        // If it is the last occurrence remove the notification from SharedPreferences
        if (options.getTrigger().isLastOccurrence()) {
            removeFromSharedPreferences();
        }

        // Inform WebView about the clearing
        if (LocalNotification.isAppRunning()) LocalNotification.fireEvent("clear", this);
    }

    /**
     * Cancels the notification and removes it from SharedPreferences.
     * The WebView will receive a cancel event, if the app is running.
     */
    public void cancel() {
        Log.d(TAG, "Cancel notification, options=" + options);

        cancelScheduledAlarm();

        // Remove saved notification data from the app
        removeFromSharedPreferences();

        // Clear the notification from the status bar if posted
        NotificationManagerCompat.from(context).cancel(LocalNotification.getAppName(context), getId());

        // Inform WebView about the canceling
        if (LocalNotification.isAppRunning()) LocalNotification.fireEvent("cancel", this);
    }

    /**
     * Cancel all alarms for this notification. If the notification is repeating, it can
     * have multiple alarms.
     */
    private void cancelScheduledAlarm() {
        String intentActionId = getIntentActionIdentifier();
        Log.d(TAG, "Cancel PendingIntent, intentActionId=" + intentActionId);

        // Create similar PendingIntent to cancel the alarm
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 0,
            // The intent have to be build with the same context, class and action
            new Intent(context, TriggerReceiver.class).setAction(intentActionId),
            // If the PendingIntent could not be found, null will be returned (configured by FLAG_NO_CREATE)
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_NO_CREATE);

        // PendingIntent could not be found
        if (pendingIntent == null) {
            Log.d(TAG, "Could not cancel PendingIntent, intentActionId=" + intentActionId + ", PendingIntent not found");
            return;
        }

        // Remove any alarms with a matching Intent. Any alarm, of any type, whose Intent matches this one
        // (as defined by Intent#filterEquals), will be canceled.
        // Intent#filterEquals: That is, if their action, data, type, identity, class, and categories are the same.
        // This does not compare any extra data included in the intents.
        getAlarmManager().cancel(pendingIntent);
    }

    /**
     * Stores the information of this notification in the SharedPreferences.
     * This will allow the application to restore the notification upon device reboot,
     * app restart, retrieve notifications, etc.
     */
    private void storeInSharedPreferences() {
        Log.d(TAG, "Store notification in SharedPreferences" +
            ", notificationId=" + options.getId() +
            ", occurrence=" + optionsTrigger.getOccurrence() +
            ", triggerBaseDate=" + optionsTrigger.getBaseDate() +
            ", triggerDate=" + optionsTrigger.getTriggerDate() +
            ", options=" + options);
        
        Manager.getSharedPreferences(context).edit()
        // options as JSON string
        .putString(getSharedPreferencesKeyOptions(), options.toString())
        // occurrence for restoration
        .putInt(getSharedPreferencesKeyOccurrence(), optionsTrigger.getOccurrence())
        // trigger base date for restoration
        .putLong(getSharedPreferencesKeyTriggerBaseDate(), optionsTrigger.getBaseDate().getTime())
        // calculated triggerDate for restoration
        .putLong(getSharedPreferencesKeyTriggerDate(), optionsTrigger.getTriggerDate().getTime())
        .apply();
    }

    /**
     * Removes the notification data from the SharedPreferences.
     */
    private void removeFromSharedPreferences() {
        Log.d(TAG, "Remove notification from SharedPreferences" +
            ", notificationId=" + options.getId() +
            ", occurrence=" + optionsTrigger.getOccurrence() +
            ", triggerBaseDate=" + optionsTrigger.getBaseDate() +
            ", triggerDate=" + optionsTrigger.getTriggerDate() +
            ", options=" + options);

        Manager.getSharedPreferences(context).edit()
        .remove(getSharedPreferencesKeyOptions())
        .remove(getSharedPreferencesKeyOccurrence())
        .remove(getSharedPreferencesKeyTriggerBaseDate())
        .remove(getSharedPreferencesKeyTriggerDate())
        .apply();
    }

    /**
     * Gets a stored notification from the {@link SharedPreferences} by id.
     * If the notification does not exists, null will be returned.
     */
    public static Notification getFromSharedPreferences(Context context, int notificationId) {
        String optionsJSONString = Manager.getSharedPreferences(context).getString(
            getSharedPreferencesKeyOptions(notificationId), null);

        Log.d(TAG, "Restoring notification from SharedPreferences" +
            ", notificationId=" + notificationId +
            ", options=" + optionsJSONString);
        
        // Notification does not exists
        if (optionsJSONString == null) {
            Log.w(TAG, "Could not restore notification from SharedPreferences, options are null" +
                ", notificationId=" + notificationId);
            return null;
        }
        
        try {
            // Parse options string to JSONObject
            Notification notification = new Notification(context, new Options(context, new JSONObject(optionsJSONString)));

            // Restore state of dateTrigger
            // Get occurrence
            int occurrence = Manager.getSharedPreferences(context).getInt(
                notification.getSharedPreferencesKeyOccurrence(), 0);
            
            // Get triger base date
            long triggerBaseTime = Manager.getSharedPreferences(context).getLong(
                notification.getSharedPreferencesKeyTriggerBaseDate(), 0);

            // Get triggerDate
            long triggerTime = Manager.getSharedPreferences(context).getLong(
                notification.getSharedPreferencesKeyTriggerDate(), 0);
            
            OptionsTrigger optionsTrigger = notification.getOptions().getTrigger();

            // The saving of occurrence, triggerBaseDate and triggerDate exists since version 1.1.4
            // Before only the options were saved
            // Just caclulate the next trigger from the current time
            // Durring the development of version 1.1.4, first only the occurrence was saved,
            // later also the triggerBaseDate and triggerDate, so check this also
            if (occurrence == 0 || triggerBaseTime == 0 || triggerTime == 0) {
                optionsTrigger.getNextTriggerDate();

                // Restore the state of the trigger date
            } else {
                optionsTrigger.restoreState(occurrence, new Date(triggerBaseTime), new Date(triggerTime));
            }
            
            Log.d(TAG, "Restored trigger date" +
                ", notificationId=" + notificationId +
                ", occurrence=" + optionsTrigger.getOccurrence() +
                ", triggerBaseDate=" + optionsTrigger.getBaseDate() +
                ", triggerDate=" + optionsTrigger.getTriggerDate());

            return notification;
        } catch (JSONException exception) {
            Log.e(TAG, "Could not parse stored notification options to JSON" + 
                ", notificationId=" + notificationId +
                ", jsonString=" + optionsJSONString,
                exception);
            return null;
        }
    }

    /**
     * Update options
     */
    private void mergeJSONObjects(JSONObject updates) {
        Iterator keys = updates.keys();

        while (keys.hasNext()) {
            try {
                String key = (String) keys.next();
                options.getJSON().put(key, updates.opt(key));
            } catch (JSONException jsonException) {
                jsonException.printStackTrace();
            }
        }
    }

    public String getSharedPreferencesKeyOccurrence() {
        return options.getId() + "_occurrence";
    }

    public String getSharedPreferencesKeyTriggerBaseDate() {
        return options.getId() + "_triggerBaseDate";
    }

    public String getSharedPreferencesKeyTriggerDate() {
        return options.getId() + "_triggerDate";
    }

    /**
     * Get the SharedPreferences key for the notification options.
     * @return
     */
    public String getSharedPreferencesKeyOptions() {
        return "" + getSharedPreferencesKeyOptions(options.getId());
    }

    /**
     * Static version of {@link #getSharedPreferencesKeyOptions()}.
     * To use, when there is no notification instance available.
     * @param notificationId
     * @return
     */
    public static String getSharedPreferencesKeyOptions(int notificationId) {
        return "" + notificationId;
    }

    /**
     * Alarm manager for the application.
     */
    private AlarmManager getAlarmManager() {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }
}
