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
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.RemoteInput;

import org.json.JSONException;
import org.json.JSONObject;

import de.appplant.cordova.plugin.localnotification.LocalNotification;
import de.appplant.cordova.plugin.localnotification.Manager;
import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.Options;
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
        // If the app should be launched
        boolean launch = getIntent().getBooleanExtra(Options.EXTRA_LAUNCH, true);
        Notification notification = Notification.getFromSharedPreferences(getApplicationContext(), notificationId);
        
        Log.d(TAG, "Notification clicked, id=" + notificationId + ", actionId=" + actionId + ", launch=" + launch);

        // Check if the notification data is available
        // Normally it should be available, but in some cases it isn't
        if (notification != null) {
            // Handle action click
            if (actionId != null) {
                // Fire action click event to JS
                LocalNotification.fireEvent(
                    actionId,
                    notification,
                    // Get input data for action, if it is an input action
                    getRemoteInputData(getIntent(), actionId));

                // Handle notification click
            } else {
                // Fire notification click event to JS
                LocalNotification.fireEvent("click", notification);
            }

            // Clear notification from statusbar if it should not be ongoing
            // This will also remove the notification from the SharedPreferences
            // if it is the last one
            if (!notification.getOptions().isAndroidOngoing()) {
                notification.clear();
            }
        } else {
            Log.w(TAG, "Notification data not found, id=" + notificationId);
        }

        // Launch the app if required
        if (launch) LocalNotification.launchApp(getApplicationContext());

        finish();
    }

    /**
     * Gets the input data for an action, if available.
     * @param intent The received intent.
     * @param actionId The action where to look for.
     */
    private JSONObject getRemoteInputData(Intent intent, String actionId) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput == null) return null;

        try {
            JSONObject data = new JSONObject();
            data.put("text", remoteInput.getCharSequence(actionId).toString());
            return data;
        } catch (JSONException jsonException) {
            Log.e(TAG, "Failed to build remote input JSON", jsonException);
            return null;
        }
    }
}
