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

// codebeat:disable[TOO_MANY_FUNCTIONS]

package de.appplant.cordova.plugin.localnotification;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import androidx.core.app.NotificationManagerCompat;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.service.notification.StatusBarNotification;
import android.media.AudioAttributes;
import android.net.Uri;
import android.util.Log;
import android.os.PowerManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Set;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.O;
import static android.os.Build.VERSION_CODES.P;
import static android.os.Build.VERSION_CODES.S;
import static de.appplant.cordova.plugin.localnotification.Notification.PREF_KEY_ID;
import static de.appplant.cordova.plugin.localnotification.Notification.Type.TRIGGERED;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

/**
 * Central way to access all or single local notifications set by specific
 * state like triggered or scheduled. Offers shortcut ways to schedule,
 * cancel or clear local notifications.
 */
public final class Manager {

    public static final String TAG = "Manager";
    
    private Context context;

    public Manager(Context context) {
        this.context = context;
    }

    /**
     * Check if the setting to schedule exact alarms is enabled.
     */
    public boolean canScheduleExactAlarms() {
        // Supported since Android 12
        if (SDK_INT < S) return true;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager.canScheduleExactAlarms();
    }

    /**
     * Schedule local notification specified by request.
     *
     * @param request Set of notification options.
     */
    public Notification schedule(Request request) {
        Notification notification = new Notification(context, request.getOptions());
        // Create channel if not exists
        createChannel(request.getOptions());
        notification.schedule(request);
        return notification;
    }

    /**
     * Create Notification channel with options
     * @param options Set of channel options.
     * 
     */
    public void createChannel(Options options) {
        // Channels are only supported since Android 8
        if (SDK_INT < O) return;

        // Check if channel exists
        NotificationChannel channel = NotificationManagerCompat.from(context).getNotificationChannel(options.getAndroidChannelId());
        
        // Channel already created
        if (channel != null) return;

        Log.d(TAG, "Create channel" + 
            ", id=" + options.getAndroidChannelId() +
            ", name=" + options.getAndroidChannelName() +
            ", options=" + options);

        // Create new channel
        channel = new NotificationChannel(
            options.getAndroidChannelId(),
            options.getAndroidChannelName(), options.getImportance());

        channel.setDescription(options.getAndroidChannelDescription());
        channel.enableVibration(options.isVibrate());
        channel.enableLights(options.getAndroidChannelEnableLights());

        Uri soundUri = options.getSoundUri();
        Log.d(TAG, "sound uri: " + soundUri);

        // Grant permission to the system to play the sound, needed only in Android 8
        if (soundUri != Uri.EMPTY && SDK_INT < P) {
            grantUriPermission(soundUri);
        }
        
        // If options.getSoundUri() is Uri.EMPTY, an empty sound will be set, which means no sound
        channel.setSound(soundUri, new AudioAttributes.Builder().setUsage(options.getSoundUsage()).build());

        NotificationManagerCompat.from(context).createNotificationChannel(channel);
    }

    /**
     * Deletes a notification channel by an id. If you create a new channel with this same id,
     * the deleted channel will be un-deleted with all of the same settings it had before it was deleted.
     * @param channelId Like "my_channel_01"
     */
    public void deleteChannel(String channelId) {
        // Channels are supported since Android 8
        if (SDK_INT < O) return;

        Log.d(TAG, "Delete channel, id=" + channelId);

        // Cancel all notifications regarding this channel
        for (Notification notification : new Manager(context).getNotifications()) {
            if (notification.getOptions().getAndroidChannelId().equals(channelId)) {
                notification.cancel();
            }
        }

        NotificationManagerCompat.from(context).deleteNotificationChannel(channelId);
    }

    /**
     * Update local notification specified by ID.
     * @param notificationId The ID of the notification.
     * @param updates JSON object with notification options.
     */
    public Notification update(int notificationId, JSONObject updates) {
        Notification notification = getNotification(notificationId);
        if (notification == null) return null;

        notification.update(updates);

        return notification;
    }

    /**
     * Clear local notification specified by ID.
     */
    public Notification clear(int notificationId) {
        Notification notification = getNotification(notificationId);
        if (notification != null) notification.clear();
        return notification;
    }

    /**
     * Clear all local notifications.
     */
    public void clearAll() {
        for (Notification notification : getByType(TRIGGERED)) {
            notification.clear();
        }

        NotificationManagerCompat.from(context).cancelAll();
    }

    /**
     * Clear local notification specified by ID.
     */
    public Notification cancel(int notificationId) {
        Notification notification = getNotification(notificationId);
        if (notification != null) notification.cancel();
        return notification;
    }

    /**
     * Cancel all local notifications.
     */
    public void cancelAll() {
        for (Notification notification : getNotifications()) {
            notification.cancel();
        }

        NotificationManagerCompat.from(context).cancelAll();
    }

    /**
     * Check if a saved notification exists.
     */
    public boolean notificationExists(int notificationId) {
        return getSharedPreferences().contains(Integer.toString(notificationId));
    }

    /**
     * Get saved notification ids
     */
    public List<Integer> getNotificationIds() {
        List<Integer> notificationIds = new ArrayList<Integer>();

        // The keys are the notification IDs
        for (String key : getSharedPreferences().getAll().keySet()) {
            try {
                notificationIds.add(Integer.parseInt(key));
            } catch (NumberFormatException exception) {
                exception.printStackTrace();
            }
        }

        return notificationIds;
    }

    /**
     * Get saved notification ids for a given type.
     * @param type The notification life cycle type
     */
    public List<Integer> getNotificationIdsByType(Notification.Type type) {
        // Returns triggered and scheduled notifications
        if (type == Notification.Type.ALL) return getNotificationIds();

        List<Integer> activeIds = new ArrayList<Integer>();

        for (StatusBarNotification statusBarNotification : getActiveNotifications()) {
            activeIds.add(statusBarNotification.getId());
        }

        if (type == TRIGGERED) return activeIds;

        // Return scheduled notifications
        List<Integer> notificationIds = getNotificationIds();
        // Remove triggered notifications
        notificationIds.removeAll(activeIds);

        return notificationIds;
    }

    /**
     * List of all local notification.
     */
    public List<Notification> getNotifications() {
        return getNotifications(getNotificationIds());
    }

    /**
     * List of local notifications with matching ID.
     */
    private List<Notification> getNotifications(List<Integer> notificationIds) {
        List<Notification> notifications = new ArrayList<Notification>();

        for (int notificationId : notificationIds) {
            if (notificationExists(notificationId)) notifications.add(getNotification(notificationId));
        }

        return notifications;
    }

    /**
     * List of local notifications from given type.
     *
     * @param type The notification life cycle type
     */
    public List<Notification> getByType(Notification.Type type) {
        return type == Notification.Type.ALL ? getNotifications() : getNotifications(getNotificationIdsByType(type));
    }

    /**
     * List of properties from all local notifications.
     */
    public List<JSONObject> getOptions() {
        return getOptionsById(getNotificationIds());
    }

    /**
     * List of properties from local notifications with matching ID.
     *
     * @param ids Set of notification IDs
     */
    public List<JSONObject> getOptionsById(List<Integer> ids) {
        List<JSONObject> toasts = new ArrayList<JSONObject>();

        for (int id : ids) {
            Options options = getOptions(id);

            if (options != null) {
                toasts.add(options.getDict());
            }
        }

        return toasts;
    }

    /**
     * List of properties from all local notifications from given type.
     *
     * @param type
     *      The notification life cycle type
     */
    public List<JSONObject> getOptionsByType(Notification.Type type) {
        ArrayList<JSONObject> options = new ArrayList<JSONObject>();
        List<Notification> notifications = getByType(type);

        for (Notification notification : notifications) {
            options.add(notification.getOptions().getDict());
        }

        return options;
    }

    /**
     * Get local notification options.
     * @param notificationId
     * @return null if could not found.
     */
    public Options getOptions(int notificationId) {
        if (!notificationExists(notificationId)) return null;

        try {
            return new Options(
                context,
                new JSONObject(
                    getSharedPreferences().getString(Integer.toString(notificationId), null)));
        } catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }
    }

    /**
     * Get existent local notification.
     * @return null if could not found.
     */
    public Notification getNotification(int notificationId) {
        return notificationExists(notificationId) ? new Notification(context, getOptions(notificationId)) : null;
    }

    /**
     * Returns the active status bar notification with the specified notificationId.
     * If there is no active status bar notification, null will be returned.
     * @param notificationId
     */
    StatusBarNotification getActiveNotification(int notificationId) {
        for (StatusBarNotification statusBarNotification : getActiveNotifications()) {
            if (statusBarNotification.getId() == notificationId) {
                return statusBarNotification;
            }
        }

        return null;
    }

    /**
     * Shared private preferences for the application.
     */
    private SharedPreferences getSharedPreferences() {
        return context.getSharedPreferences(PREF_KEY_ID, Context.MODE_PRIVATE);
    }

    /**
     * Get all active status bar notifications.
     */
    public List<StatusBarNotification> getActiveNotifications() {
        return NotificationManagerCompat.from(context).getActiveNotifications();
    }

    /**
     * Wake up the screen and returns a WakeLock, which have to be release, after the work is done.
     * @return WakeLock, which have to be release, after the work is done.
     */
    public PowerManager.WakeLock wakeUpScreen() {
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLook = powerManager.newWakeLock(
            PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "LocalNotification");
        wakeLook.acquire();
        return wakeLook;
    }

    /**
     * In Android 7 and 8, the app will crash if an external process has no
     * permission to access content:// Uris, which are used for shared files in [App path]/files/shared_files.
     * This was fixed in Android 9.
     * See: https://stackoverflow.com/questions/39359465/android-7-0-notification-sound-from-file-provider-uri-not-playing
     */
    public void grantUriPermission(Uri uri) {
        context.grantUriPermission("com.android.systemui", uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }
}

// codebeat:enable[TOO_MANY_FUNCTIONS]
