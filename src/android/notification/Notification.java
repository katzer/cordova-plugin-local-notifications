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
import android.support.v4.app.NotificationCompat;
import android.support.v4.util.ArraySet;
import android.support.v4.util.Pair;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;

import static android.app.AlarmManager.RTC;
import static android.app.AlarmManager.RTC_WAKEUP;
import static android.app.PendingIntent.FLAG_CANCEL_CURRENT;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_MAX;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_MIN;

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

    // Key for private preferences
    static final String PREF_KEY = "LocalNotification";

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
    private boolean isRepeating () {
        return getOptions().getTrigger().has("every");
    }

    // /**
    //  * If the notification is scheduled.
    //  */
    // public boolean isScheduled () {
    //     return isRepeating() || !wasInThePast();
    // }

    // /**
    //  * If the notification is triggered.
    //  */
    // public boolean isTriggered () {
    //     return wasInThePast();
    // }

    // /**
    //  * If the notification is an update.
    //  *
    //  * @param keepFlag
    //  *      Set to false to remove the flag from the option map
    //  */
    // protected boolean isUpdate (boolean keepFlag) {
    //     boolean updated = options.getDict().optBoolean("updated", false);

    //     if (!keepFlag) {
    //         options.getDict().remove("updated");
    //     }

    //     return updated;
    // }

    // /**
    //  * Notification type can be one of pending or scheduled.
    //  */
    // public Type getType () {
    //     return isScheduled() ? Type.SCHEDULED : Type.TRIGGERED;
    // }

    /**
     * Schedule the local notification.
     *
     * @param request Set of notification options.
     * @param receiver Receiver to handle the trigger event.
     */
    void schedule(Request request, Class<?> receiver) {
        List<Pair<Date, Intent>> intents = new ArrayList<Pair<Date, Intent>>();
        Set<String> ids = new ArraySet<String>();
        AlarmManager mgr = getAlarmMgr();

        do {
            Date date = request.getTriggerDate();

            if (date == null)
                continue;

            Intent intent = new Intent(context, receiver)
                    .setAction(PREF_KEY + "#" + request.getIdentifier())
                    .putExtra(Notification.EXTRA_ID, options.getId())
                    .putExtra(Request.EXTRA_OCCURRENCE, request.getOccurrence());

            intents.add(new Pair<Date, Intent>(date, intent));
        }
        while (request.moveNext());

        if (intents.isEmpty())
            return;

        Intent last = intents.get(intents.size() - 1).second;
        last.putExtra(Request.EXTRA_LAST, true);

        for (Pair<Date, Intent> pair : intents) {
            Date date     = pair.first;
            long time     = date.getTime();
            Intent intent = pair.second;

            if (!date.after(new Date()) && trigger(intent, receiver))
                continue;

            PendingIntent pi = PendingIntent.getBroadcast(
                    context, 0, intent, FLAG_CANCEL_CURRENT);

            try {
                switch (options.getPriority()) {
                    case IMPORTANCE_MIN:
                        mgr.setExact(RTC, time, pi);
                        break;
                    case IMPORTANCE_MAX:
                        mgr.setExactAndAllowWhileIdle(RTC_WAKEUP, time, pi);
                        break;
                    default:
                        mgr.setExact(RTC_WAKEUP, time, pi);
                        break;
                }
                ids.add(intent.getAction());
            } catch (Exception ignore) {
                // Samsung devices have a known bug where a 500 alarms limit
                // can crash the app
            }
        }

        persist(ids);
    }

    /**
     * Trigger local notification specified by options.
     *
     * @param intent The intent to broadcast.
     * @param cls    The broadcast class.
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
    public void clear () {
        getNotMgr().cancel(getId());

        if (isRepeating())
            return;

        unpersist();
    }

    /**
     * Cancel the local notification.
     *
     * Create an intent that looks similar, to the one that was registered
     * using schedule. Making sure the notification id in the action is the
     * same. Now we can search for such an intent using the 'getService'
     * method and cancel it.
     */
    public void cancel() {
        Set<String> actions = getPrefs().getStringSet(
                "#" + options.getIdentifier(), null);

        unpersist();
        getNotMgr().cancel(options.getId());

        if (actions == null)
            return;

        for (String action : actions) {
            Intent intent = new Intent(action);

            PendingIntent pi = PendingIntent.getBroadcast(
                    context, 0, intent, 0);

            if (pi != null) {
                getAlarmMgr().cancel(pi);
            }
        }
    }

    /**
     * Present the local notification to user.
     */
    public void show () {

        if (builder == null)
            return;

        grantPermissionToPlaySoundFromExternal();
        getNotMgr().notify(getId(), builder.build());
    }

    // /**
    //  * Count of triggers since schedule.
    //  */
    // public int getTriggerCountSinceSchedule() {
    //     long now = System.currentTimeMillis();
    //     long triggerTime = options.getTriggerTime();

    //     if (!wasInThePast())
    //         return 0;

    //     if (!isRepeating())
    //         return 1;

    //     return (int) ((now - triggerTime) / options.getRepeatInterval());
    // }

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
        SharedPreferences.Editor editor = getPrefs().edit();
        String id = options.getIdentifier();

        editor.putString(id, options.toString());
        editor.putStringSet("#" + id, ids);
        editor.apply();
    }

    /**
     * Remove the notification from the Android shared Preferences.
     */
    private void unpersist () {
        SharedPreferences.Editor editor = getPrefs().edit();
        String id = options.getIdentifier();

        editor.remove(id);
        editor.remove("#" + id);
        editor.apply();
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
     * Shared private preferences for the application.
     */
    private SharedPreferences getPrefs () {
        return context.getSharedPreferences(PREF_KEY, Context.MODE_PRIVATE);
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
