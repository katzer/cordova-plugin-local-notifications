/**
 *  LocalNotificationRestore.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin;

import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
public class LocalNotificationRestore extends BroadcastReceiver {

	@Override
	public void onReceive(Context context, Intent intent) {
		String pluginName = LocalNotification.PLUGIN_NAME;

		if (LocalNotification.cordova == null) {
			return;
		}

		// Obtain alarm details form Shared Preferences
		SharedPreferences alarms = context.getSharedPreferences(pluginName, Context.MODE_PRIVATE);
		Set<String> alarmIds     = alarms.getAll().keySet();

		/*
		 * For each alarm, parse its alarm options and register is again with
		 * the Alarm Manager
		 */
		for (String alarmId : alarmIds) {
			LocalNotificationOptions options;
			JSONObject args;

			try {
				args    = new JSONObject(alarms.getString(alarmId, ""));
				options = new LocalNotificationOptions(args);

				LocalNotification.add(options);
			} catch (JSONException e) {}
		}
	}
}
