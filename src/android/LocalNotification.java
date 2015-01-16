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
import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Build;
import android.annotation.TargetApi;

import de.appplant.cordova.plugin.notification.*;

/**
 * This plugin utilizes the Android AlarmManager in combination with StatusBar
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android status bar.
 */
public class LocalNotification extends CordovaPlugin {

    protected final static String PLUGIN_NAME = "LocalNotification";
    static protected final String STORAGE_FOLDER = "/localnotification";
    private   static CordovaWebView webView = null;
    private   static Boolean deviceready = false;
    protected static Context context = null;
    protected static Boolean isInBackground = true;
    private   static ArrayList<String> eventQueue = new ArrayList<String>();
    static Activity activity;
    Asset asset;
    Manager manager;
    NotificationWrapper nWrapper;
    
    @Override
    public void initialize (CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        LocalNotification.webView = super.webView;
        LocalNotification.context = super.cordova.getActivity().getApplicationContext();
        LocalNotification.activity = super.cordova.getActivity();
        this.asset = new Asset(activity,STORAGE_FOLDER);
        this.manager = new Manager(context, PLUGIN_NAME);
        this.nWrapper = new NotificationWrapper(context,Receiver.class,PLUGIN_NAME,Receiver.OPTIONS);
    }
    @Override
    public boolean execute (String action, final JSONArray args, final CallbackContext command) throws JSONException {
    	
        if (action.equalsIgnoreCase("add")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() { 
                	add(args);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("update")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	update(args);
                	command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("cancel")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	cancel(args);
                    command.success();
                    
                }
            });
        }

        if (action.equalsIgnoreCase("cancelAll")) {
            cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	cancelAll(args);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("clear")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	clear(args);
                    command.success();
                }
            });
        }
        
        if (action.equalsIgnoreCase("clearAll")) {
        	cordova.getThreadPool().execute( new Runnable() {
                public void run() {
                	clearAll(args);
                    command.success();
                }
            });
        }

        if (action.equalsIgnoreCase("isScheduled")) {
            String id = args.optString(0);
        	boolean isScheduled = manager.isScheduled(id);        
            PluginResult result        = new PluginResult(PluginResult.Status.OK, (isScheduled));
            command.sendPluginResult(result);
        }
        
        if (action.equalsIgnoreCase("isTriggered")) {
            String id = args.optString(0);
            boolean isTriggered        = manager.isTriggered(id);
            PluginResult result = new PluginResult(PluginResult.Status.OK, isTriggered);
            command.sendPluginResult(result);
        }
        
        if (action.equalsIgnoreCase("exist")) {
            String id = args.optString(0);
            boolean exist        = manager.exist(id);
            PluginResult result = new PluginResult(PluginResult.Status.OK, exist);
            command.sendPluginResult(result);
        }

        if (action.equalsIgnoreCase("getScheduledIds")) {
        	JSONArray scheduledIds     = manager.getScheduledIds();
            command.success(scheduledIds);
        }

        if (action.equalsIgnoreCase("getTriggeredIds")) {
            JSONArray triggeredIds     = manager.getTriggeredIds();
            command.success(triggeredIds);
        }
        
        if (action.equalsIgnoreCase("getAllIds")) {
            JSONArray allIds     = manager.getAllIds();
            command.success(allIds);
        }
        
        if (action.equalsIgnoreCase("getAll")) {
        	JSONArray ids;
        	JSONArray all;
        	try{
        		ids = args.getJSONArray(0);
        		all = manager.getAll(ids);
        	} catch (JSONException jse){
        		all = manager.getAll();
        	}
        	command.success(all);
        }
        
        if (action.equalsIgnoreCase("getTriggered")) {
        	JSONArray ids;
        	JSONArray triggered;
        	try{
        		ids = args.getJSONArray(0);
        		triggered = manager.getTriggered(ids);
        	} catch (JSONException jse){
        		triggered = manager.getTriggered();
        	}
        	command.success(triggered);
        }
        
        if (action.equalsIgnoreCase("getScheduled")) {
        	JSONArray ids;
        	JSONArray scheduled;
        	try{
        		ids = args.getJSONArray(0);
        		scheduled = manager.getScheduled(ids);
        	} catch (JSONException jse){
        		scheduled = manager.getScheduled();
        	}
        	command.success(scheduled);
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
    
    
    //------------------------------------------------exec-Functions-----------------------------------------------
    /**
     * Schedule notifications contained in the args-Array
     * @param args
     */
    private void add(JSONArray args){
    	JSONArray notifications = args;
    	JSONObject arguments;
    	for(int i=0;i<notifications.length();i++){
    		arguments = notifications.optJSONObject(i);
    		arguments = asset.parseURIs(arguments);
    		Options options      = new Options(context).parse(arguments);
    		options.setInitDate();
        	nWrapper.schedule(options);
        	JSONArray fireData= new JSONArray().put(options.getJSONObject());
        	fireEvent("add", options.getId(),options.getJSON(), fireData);
    	}     	
    }
    
    /**
     * Update existing notifications
     * @param args
     */
    private void update(JSONArray args){
    	JSONArray updates = args;
    	JSONObject updateContent;
    	for(int i=0;i<updates.length();i++){
    		updateContent = args.optJSONObject(i);
    	
    		nWrapper.update(updateContent);
    	}
    }
    
    /**
     * Cancel scheduled Notifications
     * @param args
     */
    private void cancel(JSONArray args){
    	JSONArray ids = args;
    	String id;
    	for(int i=0;i<ids.length();i++){
    		id = args.optString(i);
    		nWrapper.cancel(id);
        	JSONArray managerId = new JSONArray().put(id);
        	JSONArray data = manager.getAll(managerId);
            fireEvent("cancel", id, "",data);
    	}
    }
    
    /**
     * Cancel all scheduled notifications
     * @param args
     */
    public void cancelAll(JSONArray args){
    	JSONArray options = manager.getAll();
        nWrapper.cancelAll();
    	String id;
    	JSONObject arguments;
        for(int i=0;i<options.length();i++){
        	arguments= (JSONObject) options.opt(i);
          	JSONArray data = new JSONArray().put(arguments);
          	id = arguments.optString("id");
          	fireEvent("cancel", id, "",data);
        }
    }
    
    /**
     * Clear triggered notifications without cancel repeating.
     * @param args
     */
    public void clear(JSONArray args){
    	JSONArray ids = args;
    	String id;
    	for(int i=0;i<ids.length();i++){
    		id = args.optString(i);
    		nWrapper.clear(id);
        	JSONArray managerId = new JSONArray().put(id);
        	JSONArray data = manager.getAll(managerId);
            fireEvent("clear", id, "",data);
    	}
    }
    
    /**
     * Clear all triggered notifications without cancel repeating.
     * @param args
     */
    public void clearAll(JSONArray args){
    	JSONArray options = manager.getAll();
    	nWrapper.clearAll();
    	String id;
    	JSONObject arguments;
        for(int i=0;i<options.length();i++){
        	arguments= (JSONObject) options.opt(i);
          	JSONArray data = new JSONArray().put(arguments);
          	id = arguments.optString("id");
          	fireEvent("clear", id, "",data);
        }
    }
    

    
    
    
    //-------------------------------------------------------------------------------------------------------------
    /**
     * Calls all pending callbacks after the deviceready event has been fired.
     */
    private static void deviceready () {
        deviceready = true;

        for (String js : eventQueue) {
            sendJavascript(js);
        }

        eventQueue.clear();
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

    // 
    /**
     * Fires the given event (Only one Callback also for multiple notifications in one action).
     *
     * @param {String} event The Name of the event
     * @param ids    The IDs of the notifications as JSONArray
     * @param json  The notifications JSONObjects in a JSONArray
     */
    public static void fireEvent (String event, JSONArray ids, JSONArray json) {
        String state  = getApplicationState();
        String params = ids + ",\"" + state + "\"," + json;
        String js     = "setTimeout('plugin.notification.local.on" + event + "(" + params + ")',0)";

        // webview may available, but callbacks needs to be executed
        // after deviceready
        if (deviceready == false) {
            eventQueue.add(js);
        } else {
            sendJavascript(js);
        }
    }

    //
    /**
     * Fires the given event. (Standard-method)
     *
     * @param {String} event The Name of the event
     * @param {String} id The ID of the notification
     * @param {String} json A custom (JSON) string
     * @param data	The notifications as JSONObject
     */
    public static void fireEvent (String event, String id, String json, JSONArray data) {
    	String state = getApplicationState();
    	String params = "\"" + id + "\",\"" + state + "\"," + JSONObject.quote(json)+","+ data;
    	String js = "setTimeout('plugin.notification.local.on" + event + "(" + params + ")',0)";
    
    	// webview may available, but callbacks needs to be executed
    	// after deviceready
    	if (deviceready == false) {
    		eventQueue.add(js);
    	} else {
    		sendJavascript(js);
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
    * Use this instead of deprecated sendJavascript
    */
   @TargetApi(Build.VERSION_CODES.KITKAT)
   private static void sendJavascript(final String js){
	   webView.post(new Runnable(){
		   public void run(){
			   if(Build.VERSION.SDK_INT>= Build.VERSION_CODES.KITKAT){
				   webView.evaluateJavascript(js, null);
			   } else {
				   webView.loadUrl("javascript:" + js);
			   }
		   }
	   });
   }
    
  
}
