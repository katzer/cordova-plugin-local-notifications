/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package de.appplant.cordova.plugin.localnotification;

import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    protected final static String PLUGIN_NAME      = "LocalNotification";

    private   static CordovaWebView webView        = null;
    protected static Context context               = null;

    private   static ArrayList<String> callbackQueue = new ArrayList<String>();

    @Override
    public void initialize (CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        LocalNotification.webView = super.webView;
        LocalNotification.context = super.cordova.getActivity().getApplicationContext();

        execPendingCallbacks();
    }

    @Override
    public boolean execute (String action, final JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equalsIgnoreCase("add")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    JSONObject arguments = args.optJSONObject(0);
                    Options options      = new Options(context).parse(arguments);

                    persist(options.getId(), args);
                    add(options, true);
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("cancel")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    String id = args.optString(0);

                    cancel(id);
                    unpersist(id);
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("cancelAll")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    cancelAll();
                    unpersistAll();
                }
            });

            return true;
        }

        if (action.equalsIgnoreCase("isScheduled")) {
            String id = args.optString(0);

            isScheduled(id, callbackContext);

            return true;
        }

        if (action.equalsIgnoreCase("getScheduledIds")) {
            getScheduledIds(callbackContext);

            return true;
        }
        
        if(action.equalsIgnoreCase("clearall")){
        	clearAll();
        	return true;
        }
        if(action.equalsIgnoreCase("clear")){
        	String id = args.optString(0);
        	clear(id);
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
     * @param doFireEvent
     *            If the onadd callback shall be called.
     */
    public static void add (Options options, boolean doFireEvent) {
        long triggerTime = options.getDate();

        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + options.getId())
            .putExtra(Receiver.OPTIONS, options.getJSONObject().toString());

        AlarmManager am  = getAlarmManager();
        PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        if (doFireEvent) {
            fireEvent("add", options.getId(), options.getJSON());
        }

        am.set(AlarmManager.RTC_WAKEUP, triggerTime, pi);
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
        Intent intent = new Intent(context, Receiver.class)
            .setAction("" + notificationId);

        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager am        = getAlarmManager();

        am.cancel(pi);

        clear(notificationId);

        fireEvent("cancel", notificationId, "");
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
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            cancel(alarmId);
        }
        clearAll();
    }
    
    /**
     * Clear all notifications that were created by this plugin.
     * 
     * This will not remove future pending alarms.  It will only 
     * clear alarms that are in the notification area.
     * 
     */
    public static void clearAll(){
    	NotificationManager nc     = getNotificationManager();
    	nc.cancelAll();
    }
    
    /**
     * Clear notification that was created by this plugin.
     * 
     * This will not remove future pending alarms.  It will only 
     * clear alarms that are in the notification area.
     * 
     * @param id
     *          The notification ID to be check.
     * 
     */
    public static void clear(String id){
    	NotificationManager nc = getNotificationManager();
    	try {
            nc.cancel(Integer.parseInt(id));
        } catch (Exception e) {}
    }

    /**
     * Checks wether a notification with an ID is scheduled.
     *
     * @param id
     *          The notification ID to be check.
     * @param callbackContext
     */
    public static void isScheduled (String id, CallbackContext callbackContext) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        PluginResult result        = new PluginResult(PluginResult.Status.OK, isScheduled);

        callbackContext.sendPluginResult(result);
    }

    /**
     * Retrieves a list with all currently pending notifications.
     *
     * @param callbackContext
     */
    public static void getScheduledIds (CallbackContext callbackContext) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray pendingIds       = new JSONArray(alarmIds);

        callbackContext.success(pendingIds);
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
    public static void persist (String alarmId, JSONArray args) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.putString(alarmId, args.toString());
            editor.apply();
        }
    }

    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    public static void unpersist (String alarmId) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.remove(alarmId);
            editor.apply();
        }
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public static void unpersistAll () {
        Editor editor = getSharedPreferences().edit();

        editor.clear();
        editor.apply();
    }

    /**
     * Fires the given event.
     *
     * @param {String} event The Name of the event
     * @param {String} id    The ID of the notification
     * @param {String} json  A custom (JSON) string
     */
    public static void fireEvent (String event, String id, String json) {
        String state  = isInBackground() ? "background" : "foreground";
        String params = "\"" + id + "\",\"" + state + "\",\\'" + JSONObject.quote(json) + "\\'.replace(/(^\"|\"$)/g, \\'\\')";
        String js     = "setTimeout('plugin.notification.local.on" + event + "(" + params + ")',0)";

        // after reboot, LocalNotification.webView is always be null
        // call background callback later
        if (webView == null) {
            callbackQueue.add(js);
        } else {
            webView.sendJavascript(js);
        }
    }

    /**
     * Set the application context if not already set.
     */
    protected static void setContext (Context context) {
        if (LocalNotification.context == null) {
            LocalNotification.context = context;
        }
    }

    /**
     * The Local storage for the application.
     */
    protected static SharedPreferences getSharedPreferences () {
        return context.getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);
    }

    /**
     * The alarm manager for the application.
     */
    protected static AlarmManager getAlarmManager () {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    /**
     * The notification manager for the application.
     */
    protected static NotificationManager getNotificationManager () {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    /**
     * Gibt an, ob die App im Hintergrund läuft.
     */
    private static boolean isInBackground () {
        try {
            return !context.getPackageName().equalsIgnoreCase(((ActivityManager)context.getSystemService(Context.ACTIVITY_SERVICE)).getRunningTasks(1).get(0).topActivity.getPackageName());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Calls all pending callbacks after the webview was created.
     */
    private void execPendingCallbacks () {
        for (String js : callbackQueue) {
            webView.sendJavascript(js);
        }

        callbackQueue.clear();
    }
}