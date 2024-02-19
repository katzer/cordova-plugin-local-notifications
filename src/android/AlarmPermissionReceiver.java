/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
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
 */

package de.appplant.cordova.plugin.localnotification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.List;
import android.app.AlarmManager;

import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Request;

import static de.appplant.cordova.plugin.notification.Notification.Type.SCHEDULED;

/**
 * Receiver to detect changes in the Alarms and reminders permission.
 */
public class AlarmPermissionReceiver extends BroadcastReceiver {

    /**
     * Called when the alarms and reminder permission changes.
     *
     * @param context Application context
     * @param intent  Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action.equalsIgnoreCase(AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED)) {
            // Permission has been granted, reschedule all notifications to use exact time.
            List<Notification> notifications = Manager.getInstance(context).getByType(SCHEDULED);

            for (Notification notification : notifications) {
                notification.schedule(new Request(notification.getOptions()), TriggerReceiver.class);
            }
        }
    }


}
