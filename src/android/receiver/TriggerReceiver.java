/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2024
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

package de.appplant.cordova.plugin.localnotification.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import de.appplant.cordova.plugin.localnotification.Notification;

/**
 * The alarm receiver is triggered when a scheduled alarm is fired. This class
 * reads the information in the intent and displays this information in the
 * Android notification bar. The notification uses the default notification
 * sound and it vibrates the phone.
 */
public class TriggerReceiver extends BroadcastReceiver {

    public static final String TAG = "TriggerReceiver";

    /**
     * Called when an alarm was triggered.
     * @param context Application context
     * @param intent Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received action: " + (intent != null ? intent.getAction() : "null"));

        if (intent == null || intent.getExtras() == null) {
            Log.e(TAG, "Intent or extras is null");
            return;
        }

        int notificationId = intent.getExtras().getInt(Notification.EXTRA_ID, -1);
        Notification notification = Notification.getFromSharedPreferences(context, notificationId);

        if (notification == null) {
            Log.e(TAG, "Notification not found in shared preferences for ID: " + notificationId);
            return;
        }

        // Safe to use now
        notification.show(false);
        notification.scheduleNext();
    }
}
