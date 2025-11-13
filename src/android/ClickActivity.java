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

package de.appplant.cordova.plugin.localnotification;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.action.Action;

/**
 * Handle notification or action click.
 * To be able to launch the app on Android 12 and newer, an Activity must be used,
 * instead of a BroadcastReceiver, otherwise a trampoline error would occur,
 * if the app is in background or killed, see:
 * https://developer.android.com/about/versions/12/behavior-changes-12#notification-trampolines
 */
public class ClickActivity extends Activity {

    private static final String TAG = "ClickActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int notificationId = getIntent().getExtras().getInt(Notification.EXTRA_ID);
        // Get the clicked action id, if an action was clicked, otherwise it is null
        String actionId = getIntent().getStringExtra(Action.EXTRA_ID);
        Notification notification = Notification.getFromSharedPreferences(getApplicationContext(), notificationId);
        
        Log.d(TAG, "Notification clicked, id=" + notificationId + ", actionId=" + actionId);

        // Check if the notification data is available
        // Normally it should be available, but in some cases it isn't
        if (notification != null) {
            // Handle action click
            if (actionId != null) {
                notification.handleActionClick(getIntent(), actionId);

                // Handle notification click
            } else {
                notification.handleClick();
            }
        } else {
            Log.w(TAG, "Notification data not found, id=" + notificationId);
        }

        finish();
    }
}
