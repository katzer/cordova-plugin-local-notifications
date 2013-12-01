/**
 *  LocalNotificationRestore.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  LGPL v2.1 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
public class Restore extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // Obtain alarm details form Shared Preferences
        SharedPreferences alarms = LocalNotification.getSharedPreferences();
        Set<String> alarmIds     = alarms.getAll().keySet();

        /*
         * For each alarm, parse its alarm options and register is again with
         * the Alarm Manager
         */
        for (String alarmId : alarmIds) {
            try {
                JSONArray args  = new JSONArray(alarms.getString(alarmId, ""));
                Options options = new Options(context).parse(args.getJSONObject(0));

                LocalNotification.add(options);

            } catch (JSONException e) {}
        }
    }
}
