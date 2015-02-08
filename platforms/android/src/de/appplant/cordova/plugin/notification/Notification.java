/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
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
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.notification;


import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.support.v4.app.NotificationCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Date;

/**
 * Wrapper class around OS notification class. Handles basic operations
 * like show, delete, cancel for a single local notification instance.
 */
public class Notification {

    // Used to differ notifications by their life cycle state
    public static enum Type {
        SCHEDULED, TRIGGERED
    }

    // Default receiver to handle the trigger event
    private static Class<?> defaultReceiver = TriggerReceiver.class;

    // Key for private preferences
    static final String PREF_KEY = "LocalNotification";

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    // Builder with full configuration
    private final NotificationCompat.Builder builder;

    // Receiver to handle the trigger event
    private Class<?> receiver = defaultReceiver;

    /**
     * Constructor
     *
     * @param context
     *      Application context
     * @param options
     *      Parsed notification options
     * @param builder
     *      Pre-configured notification builder
     */
    protected Notification (Context context, Options options,
                    NotificationCompat.Builder builder, Class<?> receiver) {

        this.context = context;
        this.options = options;
        this.builder = builder;

        this.receiver = receiver != null ? receiver : defaultReceiver;
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
        return options.getIdAsInt();
    }

    /**
     * If it's a repeating notification.
     */
    public boolean isRepeating () {
        return getOptions().getRepeatInterval() > 0;
    }

    /**
     * If the notification was in the past.
     */
    public boolean wasInThePast () {
        return new Date().after(options.getTriggerDate());
    }

    /**
     * If the notification is scheduled.
     */
    public boolean isScheduled () {
        return isRepeating() || !wasInThePast();
    }

    /**
     * If the notification is triggered.
     */
    public boolean isTriggered () {
        return wasInThePast();
    }

    /**
     * If the notification is an update.
     */
    protected boolean isUpdate () {

        if (!options.getDict().has("updatedAt"))
            return false;

        long now = new Date().getTime();

        long updatedAt = options.getDict().optLong("updatedAt", now);

        return (now - updatedAt) < 1000;
    }

    /**
     * Notification type can be one of pending or scheduled.
     */
    public Type getType () {
        return isTriggered() ? Type.TRIGGERED : Type.SCHEDULED;
    }

    /**
     * Schedule the local notification.
     */
    public void schedule() {
        long triggerTime = getNextTriggerTime();

        persist();

        // Intent gets called when the Notification gets fired
        Intent intent = new Intent(context, receiver)
                .setAction(options.getId())
                .putExtra(Options.EXTRA, options.toString());

        PendingIntent pi = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        getAlarmMgr().set(AlarmManager.RTC_WAKEUP, triggerTime, pi);
    }

    /**
     * Re-schedule the local notification if repeating.
     */
    void reschedule () {
        if (isRepeating()) {
            schedule();
        }
    }

    /**
     * Clear the local notification without canceling repeating alarms.
     *
     */
    public void clear () {
        if (!isRepeating() && wasInThePast()) {
            unpersist();
        } else {
            getNotMgr().cancel(getId());
        }
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
        Intent intent = new Intent(context, receiver)
                .setAction(options.getId());

        PendingIntent pi = PendingIntent.
                getBroadcast(context, 0, intent, 0);

        getAlarmMgr().cancel(pi);
        getNotMgr().cancel(options.getIdAsInt());

        unpersist();
    }

    /**
     * Present the local notification to user.
     */
    public void show () {
        // TODO Show dialog when in foreground
        showNotification();
    }

    /**
     * Show as local notification when in background.
     */
    @SuppressWarnings("deprecation")
    private void showNotification () {
        int id = getOptions().getIdAsInt();

        if (Build.VERSION.SDK_INT <= 15) {
            // Notification for HoneyComb to ICS
            getNotMgr().notify(id, builder.getNotification());
        } else {
            // Notification for Jellybean and above
            getNotMgr().notify(id, builder.build());
        }
    }

    /**
     * Show as modal dialog when in foreground.
     */
    private void showDialog () {
        // TODO
    }

    /**
     * Next trigger time.
     */
    public long getNextTriggerTime() {
        long triggerTime = options.getTriggerTime();

        if (!isRepeating() || !isTriggered())
            return triggerTime;

        long interval    = options.getRepeatInterval();
        int triggerCount = getTriggerCountSinceSchedule();

        return triggerTime + (triggerCount + 1) * interval;
    }

    /**
     * Count of triggers since schedule.
     */
    public int getTriggerCountSinceSchedule() {
        long now = System.currentTimeMillis();
        long initTriggerTime = options.getTriggerTime();

        if (!wasInThePast())
            return 0;

        if (!isRepeating())
            return 1;

        return (int) ((now - initTriggerTime) / options.getRepeatInterval());
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

        json.remove("updatedAt");
        json.remove("soundUri");
        json.remove("iconUri");

        return json.toString();
    }

    /**
     * Persist the information of this notification to the Android Shared
     * Preferences. This will allow the application to restore the notification
     * upon device reboot, app restart, retrieve notifications, aso.
     */
    private void persist () {
        SharedPreferences.Editor editor = getPrefs().edit();

        editor.putString(options.getId(), options.toString());

        if (Build.VERSION.SDK_INT < 9) {
            editor.commit();
        } else {
            editor.apply();
        }
    }

    /**
     * Remove the notification from the Android shared Preferences.
     */
    private void unpersist () {
        SharedPreferences.Editor editor = getPrefs().edit();

        editor.remove(options.getId());

        if (Build.VERSION.SDK_INT < 9) {
            editor.commit();
        } else {
            editor.apply();
        }
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

    /**
     * Set default receiver to handle the trigger event.
     *
     * @param receiver
     *      broadcast receiver
     */
    public static void setDefaultTriggerReceiver (Class<?> receiver) {
        defaultReceiver = receiver;
    }

}
