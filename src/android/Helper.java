/**
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer).
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  LGPL v2.1 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import java.util.Map;
import java.util.Set;

import org.json.JSONArray;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

public class Helper {

    private Context context;

    public Helper(Context context) {
        this.context = context;
    }

    /**
     * Set an alarm.
     *
     * @param options
     *            The options that can be specified per alarm.
     */
    public void add (Options options) {
        long triggerTime = options.getDate();

        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + options.getId())
            .putExtra(Receiver.OPTIONS, options.getJSONObject().toString());

        AlarmManager am  = getAlarmManager();
        PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        if (options.getInterval() > 0) {
            am.setRepeating(AlarmManager.RTC_WAKEUP, triggerTime, options.getInterval(), pi);
        } else {
            am.set(AlarmManager.RTC_WAKEUP, triggerTime, pi);
        }
    }

    /**
     * Cancel a specific notification that was previously registered.
     *
     * @param notificationId
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public void cancel (String notificationId) {
        /*
         * Create an intent that looks similar, to the one that was registered
         * using add. Making sure the notification id in the action is the same.
         * Now we can search for such an intent using the 'getService' method
         * and cancel it.
         */

        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + notificationId);

        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager am        = getAlarmManager();
        NotificationManager nc = getNotificationManager();

        am.cancel(pi);
        nc.cancel(Integer.parseInt(notificationId));
    }

    /**
     * Cancel all notifications that were created by this plugin.
     *
     * Android can only unregister a specific alarm. There is no such thing
     * as cancelAll. Therefore we rely on the Shared Preferences which holds
     * all our alarms to loop through these alarms and unregister them one
     * by one.
     */
    public void cancelAll() {
        SharedPreferences settings = LocalNotification.getSharedPreferences();
        NotificationManager nc     = getNotificationManager();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            cancel(alarmId);
        }

        nc.cancelAll();
    }

    /**
     * Persist the information of this alarm to the Android Shared Preferences.
     * This will allow the application to restore the alarm upon device reboot.
     * Also this is used by the cancelAll method.
     *
     * @param alarmId
     *            The Id of the notification that must be persisted.
     * @param args
     *            The assumption is that parse has been called already.
     */
    public void persist (String alarmId, JSONArray args) {
        Editor editor = LocalNotification.getSharedPreferences().edit();

        if (alarmId != null) {
            editor.putString(alarmId, args.toString());
            editor.commit();
        }
    }

    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    public void unpersist (String alarmId) {
        Editor editor = LocalNotification.getSharedPreferences().edit();

        if (alarmId != null) {
            editor.remove(alarmId);
            editor.commit();
        }
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public void unpersistAll () {
        Editor editor = LocalNotification.getSharedPreferences().edit();

        editor.clear();
        editor.commit();
    }

    private AlarmManager getAlarmManager () {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    private NotificationManager getNotificationManager () {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }
}