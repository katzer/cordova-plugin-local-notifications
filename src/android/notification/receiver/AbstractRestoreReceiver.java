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

package de.appplant.cordova.plugin.localnotification.notification.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import org.json.JSONObject;

import java.util.List;

import de.appplant.cordova.plugin.localnotification.notification.Builder;
import de.appplant.cordova.plugin.localnotification.notification.Manager;
import de.appplant.cordova.plugin.localnotification.notification.Notification;
import de.appplant.cordova.plugin.localnotification.notification.Options;
import de.appplant.cordova.plugin.localnotification.notification.Request;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
abstract public class AbstractRestoreReceiver extends BroadcastReceiver {

    public static final String TAG = "AbstractRestoreReceiver";

    /**
     * Called on device reboot.
     *
     * @param context Application context
     * @param intent  Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received action: " + intent.getAction());

        // The device was booted and is unlocked
        if (intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED) ||
            // The app was updated
            intent.getAction().equals(Intent.ACTION_MY_PACKAGE_REPLACED)) {
            List<JSONObject> notificationsOptionsJSON = Manager.getInstance(context).getOptions();

            Log.d(TAG, "Restoring notifications, count: " + notificationsOptionsJSON.size());
            for (JSONObject notificationOptionsJSON : notificationsOptionsJSON) {
                Options notificationOptions = new Options(context, notificationOptionsJSON);
                onRestore(new Request(notificationOptions), buildNotification(new Builder(notificationOptions)));
            }
        }
    }

    /**
     * Called when a local notification need to be restored.
     *
     * @param request Set of notification options.
     * @param toast   Wrapper around the local notification.
     */
    abstract public void onRestore(Request request, Notification toast);

    /**
     * Build notification specified by options.
     *
     * @param builder Notification builder.
     */
    abstract public Notification buildNotification(Builder builder);

}
