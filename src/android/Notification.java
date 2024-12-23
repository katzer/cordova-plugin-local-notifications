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

    // Key for private preferences
    static final String PREF_KEY_ID = "NOTIFICATION_ID";

    // Key for private preferences
    private static final String PREF_KEY_PID = "NOTIFICATION_PID";

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    /**
     * Notification builder instance. Can be {@code null}.
     */
    private final NotificationCompat.Builder builder;

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
        this.options = options;
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
     * If it's a repeating notification.
     */
    public boolean isRepeating() {
        return getOptions().getTrigger().has("every");
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
     * Schedule the local notification.
     * @param request Set of notification options.
     */
    public void schedule(Request request) {
        // Cancel notification, if it was already scheduled or triggered
        cancel();

        List<Pair<Date, Intent>> intents = new ArrayList<Pair<Date, Intent>>();
        Set<String> intentActionIds = new ArraySet<String>();

        // Loop all occurrences specified by the trigger option
        do {
            Date triggerDate = request.getTriggerDate();
            if (triggerDate == null) continue;

            Intent intent = new Intent(context, TriggerReceiver.class)
                    // action identifier like "NOTIFICATION_ID1173-2"
                    .setAction(PREF_KEY_ID + request.getIdentifier())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Request.EXTRA_OCCURRENCE, request.getOccurrence());
            
            intents.add(new Pair<Date, Intent>(triggerDate, intent));

            // Save action identifier for occurrence
            intentActionIds.add(intent.getAction());

        // Move to next occurrence
        } while (request.moveNext());

        // Nothing to schedule
        if (intents.isEmpty()) {
            unpersist();
            return;
        }
        
        if (!options.isInfiniteTrigger()) {
            Intent last = intents.get(intents.size() - 1).second;
            last.putExtra(Request.EXTRA_LAST, true);
        }

        persist(intentActionIds);

        boolean canScheduleExactAlarms = new Manager(context).canScheduleExactAlarms();

        for (Pair<Date, Intent> pair : intents) {
            Date triggerDate = pair.first;
            Intent intent = pair.second;

            // Date is in the past and must not be scheduled, trigger directly
            if (!triggerDate.after(new Date())) {
                trigger(intent);
                continue;
            }

            Log.d(TAG, "Schedule notification" +
                ", notificationId: " + options.getId() +
                ", intentAction=" + intent.getAction() +
                ", trigger-date: " + triggerDate + 
                ", options=" + options +
                ", canScheduleExactAlarms: " + canScheduleExactAlarms);
            
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

                // Maximum 500 alarms can be scheduled.
                // If more are scheduled, an exception will be thrown.
            } catch (Exception exception) {
                Log.d(TAG, "Exception occurred during scheduling notification", exception);
            }
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
        NotificationManagerCompat.from(context).notify(getAppName(), getId(), builder.build());
    }

    /**
     * Update the notification properties.
     * @param updates The properties to update.
     */
    void update(JSONObject updates) {
        // Update options of notification
        mergeJSONObjects(updates);
        Log.d(TAG, "Update notification, options=" + options);

        // Store the options
        persist(null);

        // Update already triggered notification in status bar
        if (getType() == Type.TRIGGERED) {
            Intent intent = new Intent(context, TriggerReceiver.class)
                    .setAction(PREF_KEY_ID + options.getId())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Notification.EXTRA_UPDATE, true);

            trigger(intent);
        }
    }

    /**
     * Clear the local notification without canceling repeating alarms.
     */
    public void clear() {
        Log.d(TAG, "Clear notification, options=" + options);
        // Clear the notification from the statusbar if posted
        NotificationManagerCompat.from(context).cancel(getAppName(), getId());

        // If the notification is not repeating, remove notification data from the app
        if (!isRepeating()) {
          unpersist();
        }
    }

    /**
     * Cancel the local notification.
     */
    public void cancel() {
        Log.d(TAG, "Cancel notification, options=" + options);
        // Cancel all alarms for this notification. If the notification is repeating, it can
        // have multiple alarms
        cancelScheduledAlarms();

        // Remove saved notification data from the app
        unpersist();

        // Clear the notification from the status bar if posted
        NotificationManagerCompat.from(context).cancel(getAppName(), getId());
    }

    /**
     * Cancel all alarms for this notification. If the notification is repeating, it can
     * have multiple alarms.
     */
    private void cancelScheduledAlarms() {
        Set<String> intentActionIds = getSharedPreferences(PREF_KEY_PID).getStringSet(options.getIdentifier(), null);

        if (intentActionIds == null) return;

        for (String intentActionId : intentActionIds) {
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
                continue;
            }

            // Remove any alarms with a matching Intent. Any alarm, of any type, whose Intent matches this one
            // (as defined by Intent#filterEquals), will be canceled.
            // Intent#filterEquals: That is, if their action, data, type, identity, class, and categories are the same.
            // This does not compare any extra data included in the intents.
            getAlarmManager().cancel(pendingIntent);
        }
    }

    /**
     * Get the app name.
     * @return String App name.
     */
    private String getAppName() {
        return (String) context.getPackageManager().getApplicationLabel(context.getApplicationInfo());
    }

    /**
     * Encode options to JSON.
     */
    public String toString() {
        return options.getDict().toString();
    }

    /**
     * Persist the information of this notification to the Android Shared
     * Preferences. This will allow the application to restore the notification
     * upon device reboot, app restart, retrieve notifications, aso.
     *
     * @param intentActionIds List of intent actions to persist.
     */
    private void persist(Set<String> intentActionIds) {
        // Save options for this notification
        getSharedPreferences(PREF_KEY_ID).edit()
        .putString(options.getIdentifier(), options.toString())
        .apply();

        // Save intent action identifiers for this notification
        if (intentActionIds != null) {
            getSharedPreferences(PREF_KEY_PID).edit()
            .putStringSet(options.getIdentifier(), intentActionIds)
            .apply();
        }
    }

    /**
     * Remove the notification from the Android shared Preferences.
     */
    private void unpersist() {
        getSharedPreferences(PREF_KEY_ID).edit().remove(options.getIdentifier()).apply();
        getSharedPreferences(PREF_KEY_PID).edit().remove(options.getIdentifier()).apply();
    }

    /**
     * Update options
     */
    private void mergeJSONObjects(JSONObject updates) {
        Iterator keys = updates.keys();

        while (keys.hasNext()) {
            try {
                String key = (String) keys.next();
                options.getDict().put(key, updates.opt(key));
            } catch (JSONException jsonException) {
                jsonException.printStackTrace();
            }
        }
    }

    /**
     * Shared private preferences for the application.
     */
    private SharedPreferences getSharedPreferences(String key) {
        return context.getSharedPreferences(key, Context.MODE_PRIVATE);
    }

    /**
     * Alarm manager for the application.
     */
    private AlarmManager getAlarmManager() {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }
}
