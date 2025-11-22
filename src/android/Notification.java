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
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.MessagingStyle;
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

import de.appplant.cordova.plugin.localnotification.action.Action;
import de.appplant.cordova.plugin.localnotification.action.ActionGroup;
import de.appplant.cordova.plugin.localnotification.receiver.ClearReceiver;
import de.appplant.cordova.plugin.localnotification.receiver.TriggerReceiver;
import de.appplant.cordova.plugin.localnotification.trigger.TriggerHandler;
import de.appplant.cordova.plugin.localnotification.trigger.TriggerHandlerAt;
import de.appplant.cordova.plugin.localnotification.trigger.TriggerHandlerIn;
import de.appplant.cordova.plugin.localnotification.trigger.TriggerHandlerEvery;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

/**
 * Wrapper class around OS notification class. Handles basic operations
 * like show, delete, cancel for a single local notification instance.
 */
public class Notification {

    private static final String TAG = "Notification";

    // Used to differ notifications by their life cycle state
    public enum Type {
        ALL, SCHEDULED, TRIGGERED
    }

    // Extra key for the id
    public static String EXTRA_ID = "NOTIFICATION_ID";

    // Application context passed by constructor
    private Context context;

    // Notification options passed by JS
    private Options options;

    /**
     * Trigger handler for trigger.at/in/every
     */
    private TriggerHandler triggerhandler;

    /**
     * Constructor
     * @param context Application context.
     * @param options Parsed notification options.
     * @param builder Pre-configured notification builder.
     */
    public Notification(Context context, JSONObject options) {
        this.context = context;
        this.options = new Options(context, options);
        OptionsTrigger optionsTrigger = this.options.getOptionsTrigger();

        // Handle trigger.at
        // Example: trigger: { at: new Date(2017, 10, 27, 15) }
        if (optionsTrigger.getJSON().has("at")) {
            this.triggerhandler = new TriggerHandlerAt(this.options);

            // Handle trigger.in
            // Example: trigger: { in: 1, unit: 'hour' }
        } else if (optionsTrigger.getJSON().has("in")) {
            this.triggerhandler = new TriggerHandlerIn(this.options);

            // Handle trigger.every
            // Example:
            // trigger: { every: 'day', count: 5 }
            // trigger: { every: { month: 10, day: 27, hour: 9, minute: 0 } }
        } else if (optionsTrigger.getJSON().has("every")) {
            this.triggerhandler = new TriggerHandlerEvery(this.options);

        } else {
            throw new IllegalArgumentException("Trigger not property set");
        }
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
        Date triggerDate = triggerhandler.getNextTriggerDate();

        // No next trigger date available, all triggers are done
        // The notification will not be removed from SharedPreferences.
        // This will always do the ClearReceiver and ClickActivity
        if (triggerDate == null) {
            Log.d(TAG, "No next trigger date available" +
                ", notificationId=" + options.getId() +
                ", occurrence=" + triggerhandler.getOccurrence() +
                ", triggerDate=" + triggerhandler.getTriggerDate() +
                ", triggerBaseDate=" + triggerhandler.getBaseDate() +
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
        Date triggerDate = triggerhandler.getTriggerDate();

        if (triggerDate == null) {
            Log.e(TAG, "schedule was wrongly called with triggerDate = null, options=" + options);
            return false;
        }

        // Create channel if not exists
        Manager.createChannel(context, options);

        // Store notification data for restoration
        // Needed for ClickActivity and ClearReceiver
        storeInSharedPreferences();

        // Date is in the past, show directly
        if (!triggerDate.after(new Date())) {
            show(false);
            scheduleNext();
            return false;
        }

        boolean canScheduleExactAlarms = Manager.canScheduleExactAlarms(context);

        // Intent when the alarm goes off
        Intent alarmFiresIntent = new Intent(context, TriggerReceiver.class)
            // action identifier for the intent like "NOTIFICATION_ID1173"
            .setAction(getIntentActionIdentifier())
            // Notification-ID
            .putExtra(EXTRA_ID, options.getId());
        
        Log.d(TAG, "Schedule notification" +
            ", notificationId: " + options.getId() +
            ", canScheduleExactAlarms: " + canScheduleExactAlarms +
            ", intentAction=" + alarmFiresIntent.getAction() +
            ", occurrence: " + triggerhandler.getOccurrence() +
            ", triggerDate: " + triggerDate +
            ", options=" + options);
        
        // AlarmManager.set: If there is already an alarm scheduled for the same IntentSender,
        // that previous alarm will first be canceled.
        PendingIntent alarmFiresPendingIntent = PendingIntent.getBroadcast(context, 0, alarmFiresIntent, PendingIntent.FLAG_IMMUTABLE);

        // A maximum of 500 alarms can be scheduled, catch exception
        try {
            // Execute alarm even when the system is in low-power idle (a.k.a. doze) modes.
            if (options.isAndroidAllowWhileIdle()) {
                if (canScheduleExactAlarms) {
                    getAlarmManager().setExactAndAllowWhileIdle(
                        options.getAndroidAlarmType(), triggerDate.getTime(), alarmFiresPendingIntent);
                } else {
                    getAlarmManager().setAndAllowWhileIdle(
                        options.getAndroidAlarmType(), triggerDate.getTime(), alarmFiresPendingIntent);
                }

                // Execute alarm by RTC or RTC_WAKEUP
            } else {
                if (canScheduleExactAlarms) {
                    getAlarmManager().setExact(
                        options.getAndroidAlarmType(), triggerDate.getTime(), alarmFiresPendingIntent);
                } else {
                    getAlarmManager().set(
                        options.getAndroidAlarmType(), triggerDate.getTime(), alarmFiresPendingIntent);
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
     * Present the notification to the user
     */
    public void show(boolean isUpdate) {
        Log.d(TAG, "Show notification, options=" + options + ", isUpdate=" + isUpdate);

        NotificationCompat.Builder builder = getBuilder(isUpdate);

        // Notification should be silent
        if (builder == null) {
            Log.d(TAG, "Notification is silent, don't show it");
            return;
        }

        // Turn the screen on
        PowerManager.WakeLock wakeLock = options.isAndroidWakeUpScreen() ? Manager.wakeUpScreen(context) : null;

        NotificationManagerCompat.from(context).notify(
            LocalNotification.getAppName(context), options.getId(), builder.build());

        // The wake lock has to be released after the notification was shown
        if (wakeLock != null) wakeLock.release();

        // Fire trigger event if it's not an update and the app is running
        if (!isUpdate && LocalNotification.isAppRunning()) {
            LocalNotification.fireEvent("trigger", this);
        }
    }

    /**
     * Update the notification properties.
     * @param updates The properties to update.
     */
    public void update(JSONObject updates) {
        Log.d(TAG, "Update notification, options=" + options + ", updates=" + updates);

        // Update options of notification
        mergeJSONObjects(updates);

        // Store notification data
        storeInSharedPreferences();

        // Update triggered notification in status bar
        if (getType() == Type.TRIGGERED) show(true);
    }

    /**
     * Handle when the notification was clicked.
     */
    public void handleClick() {
        Log.d(TAG, "Handle click, options=" + options);
        
        // Fire notification click event to JS
        LocalNotification.fireEvent("click", this);

        // Clear notification from statusbar if it should not be ongoing
        // This will also remove the notification from the SharedPreferences
        // if it is the last one
        if (!options.isAndroidOngoing()) clear();

        // Launch the app if required
        if (options.isLaunch()) LocalNotification.launchApp(context);
    }

    public void handleActionClick(Intent intent, String actionId) {
        options.getActionsGroup().getActionById(actionId).handleClick(intent, this);
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
        if (triggerhandler.isLastOccurrence()) {
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
            ", occurrence=" + triggerhandler.getOccurrence() +
            ", triggerDate=" + triggerhandler.getTriggerDate() +
            ", triggerBaseDate=" + triggerhandler.getBaseDate() +
            ", options=" + options);
        
        Manager.getSharedPreferences(context).edit()
        // options as JSON string
        .putString(getSharedPreferencesKeyOptions(), options.toString())
        // occurrence for restoration
        .putInt(getSharedPreferencesKeyOccurrence(), triggerhandler.getOccurrence())
        // trigger base date for restoration
        .putLong(getSharedPreferencesKeyTriggerBaseDate(), triggerhandler.getBaseDate().getTime())
        // calculated triggerDate for restoration
        .putLong(getSharedPreferencesKeyTriggerDate(), triggerhandler.getTriggerDate().getTime())
        .apply();
    }

    /**
     * Removes the notification data from the SharedPreferences.
     */
    private void removeFromSharedPreferences() {
        Log.d(TAG, "Remove notification from SharedPreferences" +
            ", notificationId=" + options.getId() +
            ", occurrence=" + triggerhandler.getOccurrence() +
            ", triggerDate=" + triggerhandler.getTriggerDate() +
            ", triggerBaseDate=" + triggerhandler.getBaseDate() +
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
            Notification notification = new Notification(context, new JSONObject(optionsJSONString));

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
            
            TriggerHandler triggerHandler = notification.getTriggerHandler();

            // The saving of occurrence, triggerBaseDate and triggerDate exists since version 1.1.4
            // Before only the options were saved
            // Just caclulate the next trigger from the current time
            // Durring the development of version 1.1.4, first only the occurrence was saved,
            // later also the triggerBaseDate and triggerDate, so check this also
            if (occurrence == 0 || triggerBaseTime == 0 || triggerTime == 0) {
                triggerHandler.getNextTriggerDate();

                // Restore the state of the trigger date
            } else {
                triggerHandler.restoreState(occurrence, new Date(triggerBaseTime), new Date(triggerTime));
            }
            
            Log.d(TAG, "Restored trigger date" +
                ", notificationId=" + notificationId +
                ", occurrence=" + triggerHandler.getOccurrence() +
                ", triggerDate=" + triggerHandler.getTriggerDate() +
                ", triggerBaseDate=" + triggerHandler.getBaseDate());

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

    public TriggerHandler getTriggerHandler() {
        return triggerhandler;
    }

    /**
     * Alarm manager for the application.
     */
    private AlarmManager getAlarmManager() {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    /**
     * Creates a {@link NotificationCompat.Builder} from options
     * @return The builder instance or null if the notification is silent.
     */
    public NotificationCompat.Builder getBuilder(boolean isUpdate) {
        if (options.isSilent()) return null;

        Bundle extras = new Bundle();
        extras.putInt(Notification.EXTRA_ID, options.getId());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, options.getAndroidChannelId())
            .setExtras(extras)
            .setOnlyAlertOnce(options.isOnlyAlertOnce())
            .setContentTitle(options.getTitle())
            .setContentText(options.getText())
            // Text that summarizes this notification for accessibility services.
            // Since Android 5, this text is no longer shown on screen, but it is
            // still useful to accessibility services (where it serves as an audible announcement
            // of the notification's appearance).
            .setTicker(options.getText())
            // Since Android 8 shows as a badge count for Launchers that support badging
            // prior to 8 it could be shown in the header
            .setNumber(options.getBadgeNumber())
            .setAutoCancel(options.isAndroidAutoCancel())
            .setOngoing(options.isAndroidOngoing())
            .setColor(options.getColor())
            .setVisibility(options.getVisibility())
            // Show the Notification when date
            .setShowWhen(options.isAndroidShowWhen())
            // Show the Notification#when field as a stopwatch. Instead of presenting when as a timestamp,
            // the notification will show an automatically updating display of the minutes and seconds since
            // when
            .setUsesChronometer(options.isAndroidUsesChronometer())
            .setGroup(options.getGroup())
            .setGroupSummary(options.isGroupSummary());

        // Specify the duration in milliseconds after which this notification should be canceled
        if (options.getAndroidTimeoutAfter() >= 0) builder.setTimeoutAfter(options.getAndroidTimeoutAfter());

        // Settings for Android older than 8
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setDefaults(options.getDefaults());
            builder.setPriority(options.getPriorityByImportance());
            builder.setLights(options.getLedColor(), options.getLedOn(), options.getLedOff());

            Uri soundUri = options.getSoundUri();

            // Set sound only, if the notification should not be updated
            if (soundUri != Uri.EMPTY && !isUpdate) {
                // Grant permission to the system to play the sound, needed in Android 7 and 8
                Manager.grantUriPermission(context, soundUri);
                builder.setSound(soundUri);
            }
        }

        if (options.getProgressBar() != null) {
            builder.setProgress(
                options.getProgressMaxValue(),
                options.getProgressValue(),
                options.isProgressIndeterminate());
        }

        // Get smallIcon from resources only
        //
        // There exists also a setSmallIcon(IconCompat icon) method, but tested on Android 15, when multiple notifications with the
        // same icon are posted, the app icon will be shown in statusbar instead of the small icon. This does not happen,
        // when using the setSmallIcon(int icon) method.
        builder.setSmallIcon(options.getSmallIcon());

        Bitmap largeIcon = new AssetUtil(context).getBitmap(options.getAndroidLargeIcon());
        
        if (largeIcon != null) {
            if (options.getAndroidLargeIconType().equals(Options.LARGE_ICON_TYPE_CIRCLE)) {
                largeIcon = AssetUtil.getCircleBitmap(largeIcon);
            }

            builder.setLargeIcon(largeIcon);
        }

        applyStyle(builder);
        addActions(builder);

        // Supply a PendingIntent to send when the notification is cleared by the user directly from the notification panel
        setDeleteIntent(builder);

        // Supply a PendingIntent to send when the notification is clicked
        setContentIntent(builder);

        return builder;
    }

    /**
     * Find out and set the notification style.
     * @param builder Notification builder instance.
     */
    private void applyStyle(NotificationCompat.Builder builder) {
        if (applyMessagingStyle(builder)) return;
        if (applyBigPictureStyle(builder)) return;
        if (applyInboxStyle(builder)) return;
        if (applyBigTextStyle(builder)) return;
    }

    /**
     * Apply messaging style
     * @param builder Notification builder instance
     * @return true if the messaging style was applied
     */
    private boolean applyMessagingStyle(NotificationCompat.Builder builder) {
        MessagingStyle.Message[] messages = options.getAndroidMessages();
        if (messages == null) return false;

        // Find if there is a notification already displayed with this ID.
        StatusBarNotification activeNotification = new Manager(context).getActiveNotification(options.getId());

        MessagingStyle style = activeNotification != null ?
            // If the notification was already displayed, extract the MessagingStyle to add the message
            MessagingStyle.extractMessagingStyleFromNotification(activeNotification.getNotification()) :
            // No active notification, create a new style
            new NotificationCompat.MessagingStyle("");

        // Add the new messages to the style
        for (MessagingStyle.Message message : messages) {
            style.addMessage(message);
        }

        String title = options.getTitle();

        // Add the count of messages to the title if there is more than 1.
        Integer messagesCount = style.getMessages().size();

        if (messagesCount > 1 && options.getTitleCount() != null && !options.getTitleCount().trim().isEmpty()) {
            title += " " + options.getTitleCount().replace("%n%", "" + messagesCount);
        }

        style.setConversationTitle(title);

        // Use the style.
        builder.setStyle(style);

        return true; // style applied
    }

    /**
     * Apply big picture style. Only uses the first attachment.
     * @param builder Notification builder instance
     * @return true if the big picture style was applied
     */
    private boolean applyBigPictureStyle(NotificationCompat.Builder builder) {
        List<Bitmap> attachmentsPictures = options.getAttachments();
        if (attachmentsPictures == null || attachmentsPictures.size() == 0) return false;

        builder.setStyle(new NotificationCompat.BigPictureStyle(builder)
            .setSummaryText(options.getSummary() != null ? options.getSummary() : options.getText())
            .bigPicture(attachmentsPictures.get(0))
        );

        return true; // style applied
    }

    /**
     * Apply inbox style
     * @param builder Notification builder instance
     * @return true if the inbox style was applied
     */
    private boolean applyInboxStyle(NotificationCompat.Builder builder) {
        if (!options.getText().contains("\n")) return false;

        NotificationCompat.InboxStyle style = new NotificationCompat.InboxStyle(builder)
            .setSummaryText(options.getSummary());

        for (String line : options.getText().split("\n")) {
            style.addLine(line);
        }

        builder.setStyle(style);
        return true; // style applied
    }

    /**
     * Apply big text style
     * @param builder Notification builder instance
     * @return true if the big text style was applied
     */
    private boolean applyBigTextStyle(NotificationCompat.Builder builder) {
        if (options.getSummary() == null && options.getText().length() < 45) return false;
        builder.setStyle(new NotificationCompat.BigTextStyle(builder)
            .setSummaryText(options.getSummary())
            .bigText(options.getText()));
        return true; // style applied
    }

    /**
     * Supply a PendingIntent to send when the notification is cleared by the user directly
     * from the notification panel. For example, this intent is sent when the user clicks the
     * "Clear all" button, or the individual "X" buttons on notifications.
     * This intent is not sent when the application calls NotificationManager.cancel(int).
     */
    private void setDeleteIntent(NotificationCompat.Builder builder) {
        Intent intent = new Intent(context, ClearReceiver.class)
            .setAction(options.getId().toString())
            .putExtra(Notification.EXTRA_ID, options.getId());

        builder.setDeleteIntent(PendingIntent.getBroadcast(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
    }

    /**
     * Supply a PendingIntent to send when the notification is clicked.
     * Will bring the app to foreground.
     */
    private void setContentIntent(NotificationCompat.Builder builder) {
        // Route content tap to a transparent activity to avoid trampoline and still run plugin logic
        Intent clickIntent = new Intent(context, ClickActivity.class)
            .putExtra(Notification.EXTRA_ID, options.getId())
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            context,
            Manager.getRandomRequestCode(),
            clickIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        builder.setContentIntent(contentPendingIntent);
    }

    /**
     * Add actions to the builder if there are any.
     */
    private void addActions(NotificationCompat.Builder builder) {
        ActionGroup actionGroup = options.getActionsGroup();
        if (actionGroup == null) return;

        for (Action action : actionGroup.getActions()) {
            addAction(builder, action);
        }
    }

    /**
     * Add an action to the builder.
     */
    private void addAction(NotificationCompat.Builder builder, Action action) {
        // Route content tap to a transparent activity to avoid trampoline and still run plugin logic
        Intent actionClickIntent = new Intent(context, ClickActivity.class)
            .putExtra(Notification.EXTRA_ID, options.getId())
            .putExtra(Action.EXTRA_ID, action.getId())
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent actionClickPendingIntent = PendingIntent.getActivity(
            context,
            Manager.getRandomRequestCode(),
            actionClickIntent,
            // Input actions need FLAG_MUTABLE, otherwise it would give the error
            // "PendingIntents attached to actions with remote inputs must be mutable"
            (action.isInput() ? PendingIntent.FLAG_MUTABLE : PendingIntent.FLAG_IMMUTABLE) | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(
                action.getIcon(), action.getTitle(), actionClickPendingIntent);

        if (action.isInput()) actionBuilder.addRemoteInput(action.buildRemoteInput());

        builder.addAction(actionBuilder.build());
    }
}
