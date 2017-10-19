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

import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.RemoteInput;

import org.json.JSONException;
import org.json.JSONObject;

import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;
import de.appplant.cordova.plugin.notification.activity.AbstractClickActivity;

/**
 * The receiver activity is triggered when a notification is clicked by a user.
 * The activity calls the background callback and brings the launch intent
 * up to foreground.
 */
public class ClickActivity extends AbstractClickActivity {

    /**
     * Called when local notification was clicked by the user.
     *
     * @param action       The name of the action.
     * @param notification Wrapper around the local notification.
     */
    @Override
    public void onClick(String action, Notification notification) {
        JSONObject data  = new JSONObject();
        Intent intent    = getIntent();
        Bundle bundle    = intent.getExtras();
        Bundle input     = RemoteInput.getResultsFromIntent(intent);
        boolean doLaunch = bundle.getBoolean(Options.EXTRA_LAUNCH, true);

        if (input != null) {
            try {
                data.put("text", input.getString(action, ""));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        if (doLaunch) {
            launchApp();
        }

        LocalNotification.fireEvent(action, notification, data);

        if (notification.getOptions().isSticky())
            return;

        if (notification.isRepeating()) {
            notification.clear();
        } else {
            notification.cancel();
        }
    }

}
