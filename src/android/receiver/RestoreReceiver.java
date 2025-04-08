/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
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

package de.appplant.cordova.plugin.localnotification.receiver;

import android.app.AlarmManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import java.util.List;

import de.appplant.cordova.plugin.localnotification.Manager;
import de.appplant.cordova.plugin.localnotification.Notification;

/**
 * This class is triggered, when the system has cleared the alarms and notifications,
 * e.g. because of a device reboot, app update or granting the SCHEDULE_EXACT_ALARM permission.
 * The alarms and notifications needs to be restored.
 */
public class RestoreReceiver extends BroadcastReceiver {

    public static final String TAG = "RestoreReceiver";

    /**
     * Called when alarms and notifications need to be restored.
     * @param context Application context
     * @param intent Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received action: " + intent.getAction());

        // The device was booted and is unlocked
        if (intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED) ||
            // The app was updated
            intent.getAction().equals(Intent.ACTION_MY_PACKAGE_REPLACED) ||
            // The app is granted the SCHEDULE_EXACT_ALARM permission
            intent.getAction().equals(AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED)) {

            List<Notification> notifications = new Manager(context).getNotificationsFromSharedPreferences();
            Log.d(TAG, "Restoring notifications, count: " + notifications.size());

            for (Notification notification : notifications) {
                notification.schedule();
            }
        }
    }
}
