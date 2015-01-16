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

package de.appplant.cordova.plugin.notification;

import java.util.Date;
import java.util.Map;
import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Build;
import android.support.v4.app.NotificationCompat.Builder;
import android.util.Log;
import android.widget.Toast;

/**
 * Wrapper class to schedule, cancel, clear, and update notifications.
 *
 */
public class NotificationWrapper {
    //---------------Global Parameter------------------------------------------------------------
	private Context context;
	private Class<?> receiver;
	private final String PLUGIN_NAME;
	private final String OPTIONS;
	
    //---------------Constructor-----------------------------------------------------------------
	/**
	 * Constructor of NotificationWrapper-Class
	 */
	public NotificationWrapper(Context context, Class<?> receiver,String PluginName, String OPTIONS){
		this.context = context;
		this.receiver = receiver;
		this.PLUGIN_NAME = PluginName;
		this.OPTIONS = OPTIONS;
	}
	
	
	//---------------public functions------------------------------------------------------------
	/**
	 * Schedule new notification
	 */
	public void schedule(Options options){
        long triggerTime = options.getDate();

        persist(options.getId(), options.getJSONObject());
        
        //Intent is called when the Notification gets fired
        Intent intent = new Intent(context, receiver)
            .setAction("" + options.getId())
            .putExtra(OPTIONS, options.getJSONObject().toString());

        AlarmManager am  = getAlarmManager();
        PendingIntent pi = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        am.set(AlarmManager.RTC_WAKEUP, triggerTime, pi);
	}

	/**
	 * Cancel existing notification
	 */
	public void cancel(String notificationId){
		/*
         * Create an intent that looks similar, to the one that was registered
         * using add. Making sure the notification id in the action is the same.
         * Now we can search for such an intent using the 'getService' method
         * and cancel it.
         */
        Intent intent = new Intent(context, receiver)
            .setAction("" + notificationId);

        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, 0);
        AlarmManager am        = getAlarmManager();
        NotificationManager nc = getNotificationManager();

        am.cancel(pi);

        try {
            nc.cancel(Integer.parseInt(notificationId));
        } catch (Exception e) {}
        unpersist(notificationId);
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
     * Update an existing notification 
     * 
     * @param updates JSONObject with update-content
     */
	public void update(JSONObject updates){
		String id = updates.optString("id", "0");
    	
    	// update shared preferences
    	SharedPreferences settings = getSharedPreferences();
    	Map<String, ?> alarms      = settings.getAll();
    	JSONObject arguments;
		try {
			arguments = new JSONObject(alarms.get(id).toString());
		} catch (JSONException e) {
			Log.e("NotificationWrapper", "Update failed. No Notification available for the given id: " + id );
			return;
		}
		arguments = updateArguments(arguments, updates);
		    	
    	// cancel existing alarm
        Intent intent = new Intent(context, receiver)
        	.setAction("" + id);
        PendingIntent pi       = PendingIntent.getBroadcast(context, 0, intent, 0);
        AlarmManager am        = getAlarmManager();
        am.cancel(pi);
        
        //add new alarm
        Options options      = new Options(context).parse(arguments);
        schedule(options);		
	}
	
    /**
     * Clear a specific notification without canceling repeating alarms
     * 
     * @param notificationID
     *            The original ID of the notification that was used when it was
     *            registered using add()
     */
    public void clear (String notificationId){
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
			unpersist(notificationId);
			e.printStackTrace();
			return;
		}
    }
    
    /**
     * Clear all notifications without canceling repeating alarms
     */
    public void clearAll (){
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
     * Shows the notification
     */
    @SuppressWarnings("deprecation")
    public void showNotification (Builder notification, Options options) {
        NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        int id                  = 0;

        try {
            id = Integer.parseInt(options.getId());
        } catch (Exception e) {}

        if (Build.VERSION.SDK_INT<16) {
            // build notification for HoneyComb to ICS
            mgr.notify(id, notification.getNotification());
        } else if (Build.VERSION.SDK_INT>15) {
            // Notification for Jellybean and above
            mgr.notify(id, notification.build());
        }
    }
    
    /**
     * Show a notification as a Toast when App is runing in foreground
     * @param title Title of the notification
     * @param notification Notification to show
     */
    public void showNotificationToast(Options options){
    	String title = options.getTitle();
    	String message = options.getMessage();
       	int duration = Toast.LENGTH_LONG;
       	if(title.equals("")){
       		title = "Notification";
       	}
       	String text = title + " \n " + message;
       	
    	Toast notificationToast = Toast.makeText(context, text, duration);
    	notificationToast.show();
   }
	
    //---------------Manage Shared Preferences---------------------------------------------------
    
    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences () {
        return context.getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);
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
    public void persist (String alarmId, JSONObject args) {
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
    public void unpersist (String alarmId) {
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
    
    //---------------private functions-----------------------------------------------------------
    
    /**
     * The alarm manager for the application.
     */
    private AlarmManager getAlarmManager () {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }
    
    /**
     * The notification manager for the application.
     */
    private NotificationManager getNotificationManager () {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }
    
    /**
     * Update the Arguments Input with content from updates-input
     * 
     * @param arguments The notifications optionArray
     * @param updates	The content you like to change 
     * 
     * @return The updated value
     */
    private JSONObject updateArguments(JSONObject arguments,JSONObject updates){
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
    		if(!updates.isNull("date")){
    			arguments.put("date", updates.get("date"));
    		}
    		if(!updates.isNull("repeat")){
    			arguments.put("repeat", updates.get("repeat"));
    		}
    		if(!updates.isNull("json")){
    			arguments.put("json", updates.get("json"));
    		}
    		if(!updates.isNull("autoCancel")){
    			arguments.put("autoCancel", updates.get("autoCancel"));
    		}
    		if(!updates.isNull("ongoing")){
    			arguments.put("ongoing", updates.get("ongoing"));
    		}
    	} catch (JSONException jse){
    		jse.printStackTrace();
    	}
    	
    	return arguments;
    }
    
    /**
     * Function to set the value of "initialDate" in the JSONArray
     * @param args The given JSONArray
     * @return A new JSONArray with the parameter "initialDate" set.
     */
    private JSONObject setInitDate(JSONObject arguments){
    	long initialDate = arguments.optLong("date", 0) * 1000;
    	try {
    		arguments.put("initialDate", initialDate);
		} catch (JSONException e) {
			e.printStackTrace();
		}
    	return arguments;
    }

}
