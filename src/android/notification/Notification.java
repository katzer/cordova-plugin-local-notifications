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

package de.appplant.cordova.plugin.notification;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
import androidx.collection.ArraySet;
import androidx.core.util.Pair;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.Operation;
import androidx.work.WorkManager;

import android.util.Log;
import android.util.SparseArray;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import de.appplant.cordova.plugin.notification.action.Action;

import static androidx.core.app.NotificationCompat.PRIORITY_HIGH;


/**
 * Wrapper class around OS notification class. Handles basic operations
 * like show, delete, cancel for a single local notification instance.
 */
public final class Notification {

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
    public Context getContext () {
        return context;
    }

    /**
     * Get notification options.
     */
    public Options getOptions () {
        return options;
    }

    /**
     * Get notification ID.
     */
    public int getId () {
        return options.getId();
    }

    /**
     * If it's a repeating notification.
     */
    public boolean isRepeating () {
        return getOptions().getTrigger().has("every");
    }


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
     *
     * @param request Set of notification options.
     * @param receiver Receiver to handle the trigger event.
     */
    void schedule(Request request, Class<?> receiver) {
        List<Pair<Date, Data>> datas = new ArrayList<Pair<Date, Data>>();
        Set<String> ids                  = new ArraySet<String>();
        List <OneTimeWorkRequest> workRequests = new ArrayList<>();
        do {
            Date date = request.getTriggerDate();

            if (date == null)
                continue;

            Intent intent = new Intent(context, receiver)
                    .setAction(PREF_KEY_ID + request.getIdentifier())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Request.EXTRA_OCCURRENCE, request.getOccurrence());

            ids.add(intent.getAction());
            Data data = new Data.Builder()
                    .putInt(Notification.EXTRA_ID, options.getId())
                    .putInt(Request.EXTRA_OCCURRENCE, request.getOccurrence())
                    .build();

            long time     = date.getTime();


            if (!date.after(new Date()))
                continue;

            try {
                long duration = time - System.currentTimeMillis();
                Log.i("Notification", " date " + date + " action " + intent.getAction());
                workRequests.add(createRequest(duration, data, intent.getAction()));
            } catch (Exception ignore) {
                ignore.printStackTrace();
            }


            datas.add(new Pair<>(date, data));

        }
        while (request.moveNext());

        if (ids.isEmpty()) {
            unpersist();
            return;
        }

        WorkManager instance = WorkManager.getInstance(context);
        instance.enqueue(workRequests);

        persist(ids);
    }

    public OneTimeWorkRequest createRequest(long duration, Data data, String tag) {
        return new OneTimeWorkRequest.Builder(NotificationWorker.class)
                .setInitialDelay(duration, TimeUnit.MILLISECONDS).addTag(tag)
                .setInputData(data).build();
    }

    public void scheduleReminder(long duration, Data data, String tag) {
        OneTimeWorkRequest notificationWork = new OneTimeWorkRequest.Builder(NotificationWorker.class)
                .setInitialDelay(duration, TimeUnit.MILLISECONDS).addTag(tag)
                .setInputData(data).build();

        WorkManager instance = WorkManager.getInstance(context);
        instance.enqueue(notificationWork);
    }

    /**
     * Trigger local notification specified by options.
     *
     * @param intent The intent to broadcast.
     * @param cls    The broadcast class.
     *
     * @return false if the receiver could not be invoked.
     */
    private boolean trigger (Intent intent, Class<?> cls) {
        BroadcastReceiver receiver;

        try {
            receiver = (BroadcastReceiver) cls.newInstance();
        } catch (InstantiationException e) {
            return false;
        } catch (IllegalAccessException e) {
            return false;
        }

        receiver.onReceive(context, intent);
        return true;
    }

    /**
     * Clear the local notification without canceling repeating alarms.
     */
    public void clear() {
        getNotMgr().cancel(getId());
        if (isRepeating()) return;
        unpersist();
    }

    /**
     * Cancel the local notification.
     */
    public void cancel() {
        cancelScheduledAlarms();
        unpersist();
        getNotMgr().cancel(getId());
        clearCache();
    }

    /**
     * Cancel the scheduled future local notification.
     *
     * Create an intent that looks similar, to the one that was registered
     * using schedule. Making sure the notification id in the action is the
     * same. Now we can search for such an intent using the 'getService'
     * method and cancel it.
     */
    private void cancelScheduledAlarms() {
        SharedPreferences prefs = getPrefs(PREF_KEY_PID);
        String id               = options.getIdentifier();
        Set<String> actions     = prefs.getStringSet(id, null);

        if (actions == null)
            return;

        for (String action : actions) {
            WorkManager.getInstance(context).cancelAllWorkByTag(action);
        }
    }

    /**
     * Present the local notification to user.
     */
    public void show() {
        if (builder == null) return;

        if (options.isWithProgressBar()) {
            cacheBuilder();
        }

        grantPermissionToPlaySoundFromExternal();
        getNotMgr().notify(getId(), builder.build());
    }

    /**
     * Update the notification properties.
     *
     * @param updates  The properties to update.
     * @param receiver Receiver to handle the trigger event.
     */
    void update (JSONObject updates, Class<?> receiver) {
        mergeJSONObjects(updates);
        persist(null);

        if (getType() != Type.TRIGGERED)
            return;

        Intent intent = new Intent(context, receiver)
                .setAction(PREF_KEY_ID + options.getId())
                .putExtra(Notification.EXTRA_ID, options.getId())
                .putExtra(Notification.EXTRA_UPDATE, true);

        trigger(intent, receiver);
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
     * @param ids List of intent actions to persist.
     */
    private void persist (Set<String> ids) {
        String id = options.getIdentifier();
        SharedPreferences.Editor editor;

        editor = getPrefs(PREF_KEY_ID).edit();
        editor.putString(id, options.toString());
        editor.apply();

        if (ids == null)
            return;

        editor = getPrefs(PREF_KEY_PID).edit();
        editor.putStringSet(id, ids);
        editor.apply();
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
     * Merge two JSON objects.
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
    private void cacheBuilder () {

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
