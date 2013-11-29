/**
 *  LocalNotification.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.content.Context;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaWebView;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    public static final String PLUGIN_NAME = "LocalNotification";

    public static CordovaInterface cordova = null;
    public static CordovaWebView webView   = null;

    @Override
    public boolean execute (String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        rememberCordovaVarsForStaticUse();

        if (action.equalsIgnoreCase("add")) {
            addWithoutBlocking(args);

            return true;
        }

        if (action.equalsIgnoreCase("cancel")) {
            String id = args.optString(0);

            cancel(id);
            unpersist(id);

            return true;
        }

        if (action.equalsIgnoreCase("cancelAll")) {
            cancelAll();
            unpersistAll();

            return true;
        }

        // Returning false results in a "MethodNotFound" error.
        return false;
    }

    private static void addWithoutBlocking (final JSONArray args) {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                JSONObject arguments             = args.optJSONObject(0);
                Activity activity                = cordova.getActivity();
                LocalNotificationOptions options = new LocalNotificationOptions(activity).parse(arguments);

                persist(options.getId(), args);
                add(options);
            }
        });
    }

    /**
     * Set an alarm
     *
     * @param options
     *            The options that can be specified per alarm.
     */
    public static void add (LocalNotificationOptions options) {
        long triggerTime = options.getDate();
        Intent intent    = new Intent(cordova.getActivity(), LocalNotificationReceiver.class);

        intent.setAction("" + options.getId());
        intent.putExtra(LocalNotificationReceiver.OPTIONS, options.getJSONObject().toString());

        AlarmManager am  = getAlarmManager();
        PendingIntent pi = PendingIntent.getBroadcast(cordova.getActivity(), 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

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
    public static void cancel (String notificationId) {
        /*
         * Create an intent that looks similar, to the one that was registered
         * using add. Making sure the notification id in the action is the same.
         * Now we can search for such an intent using the 'getService' method
         * and cancel it.
         */
        Intent intent = new Intent(cordova.getActivity(), LocalNotificationReceiver.class);

        intent.setAction("" + notificationId);

        PendingIntent pi = PendingIntent.getBroadcast(cordova.getActivity(), 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager am  = getAlarmManager();

        try {
            am.cancel(pi);
        } catch (Exception e) {}
    }

    /**
     * Cancel all notifications that were created by this plugin.
     *
     * Android can only unregister a specific alarm. There is no such thing
     * as cancelAll. Therefore we rely on the Shared Preferences which holds
     * all our alarms to loop through these alarms and unregister them one
     * by one.
     */
    public static void cancelAll() {
        SharedPreferences settings = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            cancel(alarmId);
        }
    }

    /**
     * Persist the information of this alarm to the Android Shared Preferences.
     * This will allow the application to restore the alarm upon device reboot.
     * Also this is used by the cancelAll method.
     *
     * @param args
     *            The assumption is that parse has been called already.
     */
    public static void persist (String alarmId, JSONArray args) {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

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
    public static void unpersist (String alarmId) {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

        if (alarmId != null) {
            editor.remove(alarmId);
            editor.commit();
        }
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public static void unpersistAll () {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

        editor.clear();
        editor.commit();
    }

    private static AlarmManager getAlarmManager () {
        return (AlarmManager) cordova.getActivity().getSystemService(Context.ALARM_SERVICE);
    }

    /**
     * Save required Cordova specific variables for later use.
     */
    private void rememberCordovaVarsForStaticUse () {
        LocalNotification.cordova = super.cordova;
        LocalNotification.webView = super.webView;
    }
}