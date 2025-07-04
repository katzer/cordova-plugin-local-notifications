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
import android.os.Bundle;
import android.util.Log;

import de.appplant.cordova.plugin.localnotification.Notification;

/**
 * The clear intent receiver is triggered when the user clears a
 * notification manually. It removes the notification from the
 * SharedPreferences if it was the last onex to trigger.
 */
public class ClearReceiver extends BroadcastReceiver {

    public static final String TAG = "ClearReceiver";

    /**
     * Called when the notification was cleared from the notification center.
     * @param context Application context
     * @param intent Received intent with content data
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        Notification notification = Notification.getFromSharedPreferences(context, intent.getExtras().getInt(Notification.EXTRA_ID));

        // Notification not found for id in SharedPreferences
        if (notification == null) {
            Log.w(TAG, "Notification not found for id, doing nothing, id=" + intent.getExtras().getInt(Notification.EXTRA_ID));
            return;
        }

        // Will remove the notification from SharedPreferences if it is the last one
        notification.clear();
    }
}
