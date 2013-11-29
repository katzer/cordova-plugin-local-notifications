/**
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer).
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  LGPL v2.1 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;

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

    public static CordovaWebView webView   = null;
    public static Context context          = null;

    @Override
    public boolean execute (String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        rememberCordovaVarsForStaticUse();

        if (action.equalsIgnoreCase("add")) {
            JSONObject arguments  = args.optJSONObject(0);
            final Options options = new Options(context).parse(arguments);

            persist(options.getId(), args);

            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    add(options);
                }
            });

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

    /**
     * Set an alarm.
     *
     * @param options
     *            The options that can be specified per alarm.
     */
    public static void add (Options options) {
        Helper helper = new Helper(context);

        helper.add(options);
    }

    /**
     * Cancel a specific notification that was previously registered.
     *
     * @param notificationId
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public static void cancel (String notificationId) {
        Helper helper = new Helper(context);

        helper.cancel(notificationId);
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
        Helper helper = new Helper(context);

        helper.cancelAll();
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
        Helper helper = new Helper(context);

        helper.persist(alarmId, args);
    }

    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    public static void unpersist (String alarmId) {
        Helper helper = new Helper(context);

        helper.unpersist(alarmId);
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public static void unpersistAll () {
        Helper helper = new Helper(context);

        helper.unpersistAll();
    }

    /**
     * Save required Cordova specific variables for later use.
     */
    private void rememberCordovaVarsForStaticUse () {
        LocalNotification.webView = super.webView;
        LocalNotification.context = super.cordova.getActivity();
    }
}