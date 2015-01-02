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
import java.util.Date;
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

import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Build;
import android.widget.Toast;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    protected final static String PLUGIN_NAME = "LocalNotification";

    private   static CordovaWebView webView = null;
    private   static Boolean deviceready = false;
    protected static Context context = null;
    protected static Boolean isInBackground = true;
    private   static ArrayList<String> eventQueue = new ArrayList<String>();
    static Activity activity;

    @Override
    public void initialize (CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        LocalNotification.webView = super.webView;
        LocalNotification.context = super.cordova.getActivity().getApplicationContext();
        LocalNotification.activity = super.cordova.getActivity();
    }

    @Override
    public boolean execute (String action, final JSONArray args, final CallbackContext command) throws JSONException {
        if (action.equalsIgnoreCase("add")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {               	
                    JSONObject arguments = setInitDate(args.optJSONObject(0));
                    Options options      = new Options(context).parse(arguments);
                    add(options, true);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("addMultiple")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {    
                	JSONArray notifications = args.optJSONArray(0);
                	for (int i =0; i<notifications.length();i++){
                		JSONObject arguments = setInitDate(notifications.optJSONObject(i));
                		Options options      = new Options(context).parse(arguments);
                		add(options, true);
                	}
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("update")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	JSONObject updates = args.optJSONObject(0);
                	
                	update(updates);
                	command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("clear")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	String id = args.optString(0);

                    clear(id);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("clearMultiple")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	JSONArray ids = args.optJSONArray(0);
                	for (int i =0; i<ids.length();i++){
                        clear(ids.optString(i));
                	}
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("clearAll")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	clearAll();
                    command.success();
                }
            });
        }

        if (action.equalsIgnoreCase("cancel")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    String id = args.optString(0);

                    cancel(id);
                    unpersist(id);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("cancelMultiple")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	JSONArray ids = args.optJSONArray(0);
                	for (int i =0; i<ids.length();i++){
                        cancel(ids.optString(i));
                	}
                    command.success();
                }
            });
        }

        if (action.equalsIgnoreCase("cancelAll")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    cancelAll();
                    unpersistAll();
                    command.success();
                }
            });
        }

        if (action.equalsIgnoreCase("isScheduled")) {
            String id = args.optString(0);

            isScheduled(id, command);
        }

        if (action.equalsIgnoreCase("getScheduledIds")) {
            getScheduledIds(command);
        }

        if (action.equalsIgnoreCase("isTriggered")) {
            String id = args.optString(0);

            isTriggered(id, command);
        }

        if (action.equalsIgnoreCase("getTriggeredIds")) {
            getTriggeredIds(command);
        }

        if (action.equalsIgnoreCase("deviceready")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                    deviceready();
                }
            });
        }

        if (action.equalsIgnoreCase("pause")) {
            isInBackground = true;
        }

        if (action.equalsIgnoreCase("resume")) {
            isInBackground = false;
        }

        return true;
    }

    /**
     * Calls all pending callbacks after the deviceready event has been fired.
     */
    private static void deviceready () {
        deviceready = true;

        for (String js : eventQueue) {
            webView.sendJavascript(js);
        }

        eventQueue.clear();
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
        
        persist(options.getId(), options.getJSONObject());

        //Intent is called when the Notification gets fired
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
     * Update an existing notification 
     * 
     * @param updates JSONObject with update-content
     */
    public static void update (JSONObject updates){
    	String id = updates.optString("id", "0");
    	
    	// update shared preferences
    	SharedPreferences settings = getSharedPreferences();
    	Map<String, ?> alarms      = settings.getAll();
    	JSONObject arguments;
		try {
			arguments = new JSONObject(alarms.get(id).toString());
		} catch (JSONException e) {
			e.printStackTrace();
			return;
		}
		arguments = updateArguments(arguments, updates);
		    	
    	// cancel existing alarm
        Intent intent = new Intent(context, Receiver.class)
        	.setAction("" + id);
        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, 0);
        AlarmManager am        = getAlarmManager();
        am.cancel(pi);
        
        //add new alarm
        Options options      = new Options(context).parse(arguments);
        add(options,false);        
    }
    
    /**
     * Clear a specific notification without canceling repeating alarms
     * 
     * @param notificationID
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public static void clear (String notificationId){
    	SharedPreferences settings = getSharedPreferences();
    	Map<String, ?> alarms      = settings.getAll();
        NotificationManager nc = getNotificationManager();

        try {
            nc.cancel(Integer.parseInt(notificationId));
        } catch (Exception e) {}
        
        JSONObject arguments;
		try {
			arguments = new JSONObject(alarms.get(notificationId).toString());
			Options options      = new Options(context).parse(arguments);
			Date now = new Date();
			if ((options.getInterval()!=0)){
				persist(notificationId, setInitDate(arguments));
			}
			else if((new Date(options.getDate()).before(now))){
				unpersist(notificationId);
			}
		} catch (JSONException e) {
			e.printStackTrace();
			return;
		}
		
        fireEvent("clear", notificationId, "");
    }
    
    /**
     * Clear all notifications without canceling repeating alarms
     */
    public static void clearAll (){
        SharedPreferences settings = getSharedPreferences();
        NotificationManager nc     = getNotificationManager();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            clear(alarmId);
        }

        nc.cancelAll();
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

        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, 0);
        AlarmManager am        = getAlarmManager();
        NotificationManager nc = getNotificationManager();

        am.cancel(pi);

        try {
            nc.cancel(Integer.parseInt(notificationId));
        } catch (Exception e) {}

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
        NotificationManager nc     = getNotificationManager();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();

        for (String alarmId : alarmIds) {
            cancel(alarmId);
        }

        nc.cancelAll();
    }

    /**
     * Checks if a notification with an ID is scheduled.
     *
     * @param id
     *          The notification ID to be check.
     * @param callbackContext
     */
    public static void isScheduled (String id, CallbackContext command) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        boolean isNotTriggered	   = false;
        
        if (isScheduled) {
        	JSONObject arguments;
			try {
				arguments = new JSONObject(alarms.get(id).toString());
	        	Options options      = new Options(context).parse(arguments);
	        	Date fireDate        = new Date(options.getDate());
	        	isNotTriggered = new Date().before(fireDate);
			} catch (JSONException e) {
				isNotTriggered = false;
				e.printStackTrace();
			}
        	
        }
        
        PluginResult result        = new PluginResult(PluginResult.Status.OK, (isScheduled && isNotTriggered));

        command.sendPluginResult(result);
    }

    /**
     * Retrieves a list with all currently pending notifications.
     *
     * @param callbackContext
     */
    public static void getScheduledIds (CallbackContext command) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray scheduledIds     = new JSONArray();
        
        for (String id : alarmIds) {
        	boolean isScheduled;
        	JSONObject arguments;
 			try {
 				arguments = new JSONObject(alarms.get(id).toString());
 	        	Options options      = new Options(context).parse(arguments);
 	        	Date fireDate        = new Date(options.getDate());
 	        	isScheduled = new Date().before(fireDate);
 			} catch (JSONException e) {
 				isScheduled = false;
 				e.printStackTrace();
 			}
 			if (isScheduled){
 				scheduledIds.put(id);
 			}
        }

        
        
        command.success(scheduledIds);
    }

    /**
     * Checks if a notification with an ID was triggered.
     *
     * @param id
     *          The notification ID to be check.
     * @param callbackContext
     */
    public static void isTriggered (String id, CallbackContext command) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        boolean isTriggered        = isScheduled;

        if (isScheduled) {
        	JSONObject arguments;
			try {
				arguments = new JSONObject(alarms.get(id).toString());
	        	Options options      = new Options(context).parse(arguments);
	        	Date fireDate        = new Date(options.getInitialDate());
	        	isTriggered = new Date().after(fireDate);
			} catch (JSONException e) {
				isTriggered = false;
				e.printStackTrace();
			}
        	
        }
        	
        PluginResult result = new PluginResult(PluginResult.Status.OK, isTriggered);

        command.sendPluginResult(result);
    }

    /**
     * Retrieves a list with all currently triggered notifications.
     *
     * @param callbackContext
     */
    public static void getTriggeredIds (CallbackContext command) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray triggeredIds     = new JSONArray();
        Date now                   = new Date();

        for (String id : alarmIds) {
        	boolean isTriggered;
        	JSONObject arguments;
        	try{
        		arguments = new JSONObject(alarms.get(id).toString());
        		Options options      = new Options(context).parse(arguments);
        		Date fireDate        = new Date(options.getInitialDate());
        		isTriggered  = now.after(fireDate);
            } catch(ClassCastException cce) {
            	cce.printStackTrace();
            	isTriggered = false;
            }
        	catch(JSONException jse) {
        		jse.printStackTrace();
            	isTriggered = false;
            }

            if (isTriggered == true) {
                triggeredIds.put(id);
            }
        }

        command.success(triggeredIds);
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
    public static void persist (String alarmId, JSONObject args) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.putString(alarmId, args.toString());
            if (Build.VERSION.SDK_INT<9) {
                editor.commit();
            } else {
                editor.apply();
            }
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
            if (Build.VERSION.SDK_INT<9) {
                editor.commit();
            } else {
                editor.apply();
            }
        }
    }

    /**
     * Clear all alarms from the Android shared Preferences.
     */
    public static void unpersistAll () {
        Editor editor = getSharedPreferences().edit();

        editor.clear();
        if (Build.VERSION.SDK_INT<9) {
            editor.commit();
        } else {
            editor.apply();
        }
    }

    /**
     * Fires the given event.
     *
     * @param {String} event The Name of the event
     * @param {String} id    The ID of the notification
     * @param {String} json  A custom (JSON) string
     */
    public static void fireEvent (String event, String id, String json) {
        String state  = getApplicationState();
        String params = "\"" + id + "\",\"" + state + "\",\\'" + JSONObject.quote(json) + "\\'.replace(/(^\"|\"$)/g, \\'\\')";
        String js     = "setTimeout('plugin.notification.local.on" + event + "(" + params + ")',0)";

        // webview may available, but callbacks needs to be executed
        // after deviceready
        if (deviceready == false) {
            eventQueue.add(js);
        } else {
            webView.sendJavascript(js);
        }
    }

    /**
     * Retrieves the application state
     *
     * @return {String}
     *      Either "background" or "foreground"
     */
    protected static String getApplicationState () {
        return isInBackground ? "background" : "foreground";
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
     * Function to set the value of "initialDate" in the JSONArray
     * @param args The given JSONArray
     * @return A new JSONArray with the parameter "initialDate" set.
     */
    private static JSONObject setInitDate(JSONObject arguments){
    	long initialDate = arguments.optLong("date", 0) * 1000;
    	try {
    		arguments.put("initialDate", initialDate);
		} catch (JSONException e) {
			e.printStackTrace();
		}
    	return arguments;
    }
    
    private static JSONObject updateArguments(JSONObject arguments,JSONObject updates){
    	try	{
    		if(!updates.isNull("message")){
    			arguments.put("message", updates.get("message"));
    		}
    		if(!updates.isNull("title")){
    			arguments.put("title", updates.get("title"));
    		}
    		if(!updates.isNull("badge")){
    			arguments.put("badge", updates.get("badge"));
    		}
    		if(!updates.isNull("sound")){
    			arguments.put("sound", updates.get("sound"));
    		}
    		if(!updates.isNull("icon")){
    			arguments.put("icon", updates.get("icon"));
    		}
    	} catch (JSONException jse){
    		jse.printStackTrace();
    	}
    	
    	return arguments;
    }
    
    public static void showNotification(String title,String notification){
       	int duration = Toast.LENGTH_LONG;
       	if(title.equals("")){
       		title = "Notification";
       	}
       	String text = title + " \n " + notification;
       	
    	Toast notificationToast = Toast.makeText(context, text, duration);
    	notificationToast.show();
   }
    
  
}
