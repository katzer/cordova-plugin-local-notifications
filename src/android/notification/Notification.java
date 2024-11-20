/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
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

package de.appplant.cordova.plugin.localnotification.notification;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
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

import static android.app.AlarmManager.RTC;
import static android.app.AlarmManager.RTC_WAKEUP;
import static android.app.PendingIntent.FLAG_CANCEL_CURRENT;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.M;
import static androidx.core.app.NotificationCompat.PRIORITY_HIGH;
import static androidx.core.app.NotificationCompat.PRIORITY_MAX;
import static androidx.core.app.NotificationCompat.PRIORITY_MIN;

import de.appplant.cordova.plugin.localnotification.TriggerReceiver;

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

    // Cache for the builder instances
    private static SparseArray<NotificationCompat.Builder> cache = null;

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    // Builder with full configuration
    private final NotificationCompat.Builder builder;

    /**
     * Constructor
     *
     * @param context Application context.
     * @param options Parsed notification options.
     * @param builder Pre-configured notification builder.
     */
    Notification (Context context, Options options, NotificationCompat.Builder builder) {
        this.context  = context;
        this.options  = options;
        this.builder  = builder;
    }

    /**
     * Constructor
     *
     * @param context Application context.
     * @param options Parsed notification options.
     */
    public Notification(Context context, Options options) {
        this.context  = context;
        this.options  = options;
        this.builder  = null;
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
     * If the notifications priority is high or above.
     */
    public boolean isHighPrio() {
        return getOptions().getPrio() >= PRIORITY_HIGH;
    }

    /**
     * Notification type can be one of triggered or scheduled.
     */
    public Type getType() {
        Manager mgr                    = Manager.getInstance(context);
        StatusBarNotification[] toasts = mgr.getActiveNotifications();
        int id                         = getId();

        for (StatusBarNotification toast : toasts) {
            if (toast.getId() == id) {
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
        List<Pair<Date, Intent>> intents = new ArrayList<Pair<Date, Intent>>();
        Set<String> intentActionIds = new ArraySet<String>();
        AlarmManager mgr = getAlarmMgr();

        cancelScheduledAlarms();

        // Loop all occurrences specified by the trigger option
        do {
            Date date = request.getTriggerDate();
            if (date == null) continue;

            Intent intent = new Intent(context, TriggerReceiver.class)
                    // action identifier like "NOTIFICATION_ID1173-2"
                    .setAction(PREF_KEY_ID + request.getIdentifier())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Request.EXTRA_OCCURRENCE, request.getOccurrence());
            
            intents.add(new Pair<Date, Intent>(date, intent));

            // Save action identifier for occurrence
            intentActionIds.add(intent.getAction());

        // Move to next occurrence
        } while (request.moveNext());

        // Nothing to schedule, return
        if (intents.isEmpty()) {
            unpersist();
            return;
        }
        
        boolean canScheduleExactAlarms = Manager.getInstance(context).canScheduleExactAlarms();
        persist(intentActionIds);

        if (!options.isInfiniteTrigger()) {
            Intent last = intents.get(intents.size() - 1).second;
            last.putExtra(Request.EXTRA_LAST, true);
        }

        for (Pair<Date, Intent> pair : intents) {
            Date date     = pair.first;
            long time     = date.getTime();
            Intent intent = pair.second;

            // Date is in the past and must not be scheduled, trigger directly
            if (!date.after(new Date())) {
                trigger(intent);
                continue;
            }

            // AlarmManager#set: If there is already an alarm scheduled for the same IntentSender,
            // that previous alarm will first be canceled.
            PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);

            Log.d(TAG, "Schedule notification" +
                ", trigger-date: " + date + 
                ", prio: " + options.getPrio() +
                ", canScheduleExactAlarms: " + canScheduleExactAlarms +
                ", intentAction=" + intent.getAction());

            try {
                switch (options.getPrio()) {
                    case PRIORITY_MIN:
                        if (canScheduleExactAlarms) {
                            mgr.setExact(RTC, time, pi);
                        } else {
                            mgr.set(RTC, time, pi);
                        }
                        break;
                    case PRIORITY_MAX:
                        // Since Android 6 (SDK Level 23)
                        if (SDK_INT >= M) {
                            // Allow alarm to be executed even when the system is in low-power idle (a.k.a. doze) modes.
                            //
                            // A reasonable example would be for a calendar notification that should make a sound so the user is aware of it.
                            // When the alarm is dispatched, the app will also be added to the system's temporary power exemption list for
                            // approximately 10 seconds to allow that application to acquire further wake locks in which to complete its work.
                            //
                            // To reduce abuse, there are restrictions on how frequently these alarms will go off for a particular application.
                            // Under normal system operation, it will not dispatch these alarms more than about every minute
                            // (at which point every such pending alarm is dispatched);
                            // when in low-power idle modes this duration may be significantly longer, such as 15 minutes.
                            //
                            // See for informations the Android Developer documentation.
                            if (canScheduleExactAlarms) {
                                mgr.setExactAndAllowWhileIdle(RTC_WAKEUP, time, pi);
                            } else {
                                mgr.setAndAllowWhileIdle(RTC_WAKEUP, time, pi);
                            }
                        } else {
                            if (canScheduleExactAlarms) {
                                mgr.setExact(RTC, time, pi);
                            } else {
                                mgr.set(RTC, time, pi);
                            }
                        }
                        break;
                    // Default priority
                    default:
                        if (canScheduleExactAlarms) {
                            mgr.setExact(RTC_WAKEUP, time, pi);
                        } else {
                            mgr.set(RTC_WAKEUP, time, pi);
                        }
                        break;
                    }

                    // Samsung devices have a known bug where a 500 alarms limit
                    // can crash the app
                } catch (Exception exception) {
                    Log.d(TAG, "Exception occurred during scheduling notification", exception);
                }
        }
    }

    /**
     * Trigger local notification specified by intent.
     * @param intent The intent to broadcast.
     */
    private void trigger (Intent intent) {
        new TriggerReceiver().onReceive(context, intent);
    }

    /**
     * Clear the local notification without canceling repeating alarms.
     */
    public void clear() {
        // Clear the notification from the statusbar if posted
        getNotMgr().cancel(getAppName(), getId());

        // If the notification is not repeating, remove notification data from the app
        if (!isRepeating()) {
          unpersist();
        }
    }

    /**
     * Cancel the local notification.
     */
    public void cancel() {
        // Cancel all alarms for this notification. If the notification is repeating, it can
        // have multiple alarms
        cancelScheduledAlarms();

        // Remove saved notification data from the app
        unpersist();

        // Clear the notification from the status bar if posted
        getNotMgr().cancel(getAppName(), getId());
        clearCache();
    }

    /**
     * Cancel all alarms for this notification. If the notification is repeating, it can
     * have multiple alarms.
     */
    private void cancelScheduledAlarms() {
        Set<String> intentActionIds = getPrefs(PREF_KEY_PID).getStringSet(options.getIdentifier(), null);

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
            getAlarmMgr().cancel(pendingIntent);
        }
    }

    /**
     * Present the local notification to user.
     */
    public void show() {
        if (builder == null) return;

        if (options.showChronometer()) {
            cacheBuilder();
        }

        grantPermissionToPlaySoundFromExternal();
        getNotMgr().notify(getAppName(), getId(), builder.build());
    }

    /**
     * Get the app name.
     *
     * @return String App name.
     */
    private String getAppName() {
        CharSequence appName = context.getPackageManager().getApplicationLabel(context.getApplicationInfo());

        return (String) appName;
    }

    /**
     * Update the notification properties.
     * @param updates The properties to update.
     */
    void update (JSONObject updates) {
        // Update options of notification
        mergeJSONObjects(updates);
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
     * Encode options to JSON.
     */
    public String toString() {
        JSONObject dict = options.getDict();
        JSONObject json = new JSONObject();

        try {
            json = new JSONObject(dict.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return json.toString();
    }

    /**
     * Persist the information of this notification to the Android Shared
     * Preferences. This will allow the application to restore the notification
     * upon device reboot, app restart, retrieve notifications, aso.
     *
     * @param intentActionIds List of intent actions to persist.
     */
    private void persist (Set<String> intentActionIds) {
        // Save options for this notification
        getPrefs(PREF_KEY_ID).edit()
        .putString(options.getIdentifier(), options.toString())
        .apply();

        // Save intent action identifiers for this notification
        if (intentActionIds != null) {
            getPrefs(PREF_KEY_PID).edit()
            .putStringSet(options.getIdentifier(), intentActionIds)
            .apply();
        }
    }

    /**
     * Remove the notification from the Android shared Preferences.
     */
    private void unpersist () {
        String[] keys = { PREF_KEY_ID, PREF_KEY_PID };
        String id     = options.getIdentifier();
        SharedPreferences.Editor editor;

        for (String key : keys) {
            editor = getPrefs(key).edit();
            editor.remove(id);
            editor.apply();
        }
    }

    /**
     * Since Android 7 the app will crash if an external process has no
     * permission to access the referenced sound file.
     */
    private void grantPermissionToPlaySoundFromExternal() {
        if (builder == null)
            return;

        String sound = builder.getExtras().getString(Options.EXTRA_SOUND);
        Uri soundUri = Uri.parse(sound);

        context.grantUriPermission(
                "com.android.systemui", soundUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }

    /**
     * Update options
     */
    private void mergeJSONObjects (JSONObject updates) {
        JSONObject dict = options.getDict();
        Iterator it     = updates.keys();

        while (it.hasNext()) {
            try {
                String key = (String)it.next();
                dict.put(key, updates.opt(key));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Caches the builder instance so it can be used later.
     */
    private void cacheBuilder() {

        if (cache == null) {
            cache = new SparseArray<NotificationCompat.Builder>();
        }

        cache.put(getId(), builder);
    }

    /**
     * Find the cached builder instance.
     *
     * @param key The key under where to look for the builder.
     *
     * @return null if no builder instance could be found.
     */
    static NotificationCompat.Builder getCachedBuilder (int key) {
        return (cache != null) ? cache.get(key) : null;
    }

    /**
     * Caches the builder instance so it can be used later.
     */
    private void clearCache () {
        if (cache != null) {
            cache.delete(getId());
        }
    }

    /**
     * Shared private preferences for the application.
     */
    private SharedPreferences getPrefs (String key) {
        return context.getSharedPreferences(key, Context.MODE_PRIVATE);
    }

    /**
     * Notification manager for the application.
     */
    private NotificationManager getNotMgr () {
        return (NotificationManager) context
                .getSystemService(Context.NOTIFICATION_SERVICE);
    }

    /**
     * Alarm manager for the application.
     */
    private AlarmManager getAlarmMgr () {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

}
