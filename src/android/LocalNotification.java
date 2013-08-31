/**
 *  LocalNotification.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    public static final String PLUGIN_NAME = "LocalNotification";

    /**
     * Delegate object that does the actual alarm registration. Is reused by the
     * AlarmRestoreOnBoot class.
     */
    private AlarmHelper alarm = null;

    @Override
    public boolean execute (String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        JSONObject arguments             = args.getJSONObject(0);
        LocalNotificationOptions options = new LocalNotificationOptions();

        options.parse(arguments);

        String alarmId = options.getNotificationId();

        alarm = new AlarmHelper(cordova.getActivity());

        if (action.equalsIgnoreCase("add")) {
            persist(alarmId, args);
            add(options);

            return true;
        }

        if (action.equalsIgnoreCase("cancel")) {
            unpersist(alarmId);
            cancel(alarmId);

            return true;

        }

        if (action.equalsIgnoreCase("cancelall")) {
            unpersistAll();
            cancelAll();

            return true;
        }

        // Returning false results in a "MethodNotFound" error.
        return false;
    }

    /**
     * Set an alarm
     *
     * @param repeatDaily
     *            If true, the alarm interval will be set to one day.
     * @param title
     *            The title of the alarm as shown in the Android notification
     *            panel
     * @param subTitle
     *            The subtitle of the alarm
     * @param alarmId
     *            The unique ID of the notification
     * @param calender
     *            A calendar object that represents the time at which the alarm
     *            should first be started
     */
    public void add(LocalNotificationOptions options) {
        alarm.add(options);
    }

    /**
     * Cancel a specific notification that was previously registered.
     *
     * @param notificationId
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public void cancel (String notificationId) {
        alarm.cancel(notificationId);
    }

    /**
     * Cancel all notifications that were created by this plugin.
     */
    public void cancelAll() {
        /*
         * Android can only unregister a specific alarm. There is no such thing
         * as cancelAll. Therefore we rely on the Shared Preferences which holds
         * all our alarms to loop through these alarms and unregister them one
         * by one.
         */
        SharedPreferences settings = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);

        alarm.cancelAll(settings);
    }

    /**
     * Persist the information of this alarm to the Android Shared Preferences.
     * This will allow the application to restore the alarm upon device reboot.
     * Also this is used by the cancelAll method.
     *
     * @see #cancelAllNotifications()
     *
     * @param optionsArr
     *            The assumption is that parse has been called already.
     *
     * @return true when successfull, otherwise false
     */
    private void persist (String alarmId, JSONArray optionsArr) {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

        editor.putString(alarmId, optionsArr.toString());
        editor.commit();
    }

    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    private void unpersist (String alarmId) {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

        editor.remove(alarmId);
        editor.commit();
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    private void unpersistAll () {
        Editor editor = cordova.getActivity().getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE).edit();

        editor.clear();
        editor.commit();
    }
}