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
import androidx.core.app.RemoteInput;

import org.json.JSONException;
import org.json.JSONObject;

import de.appplant.cordova.plugin.localnotification.LocalNotification;
import de.appplant.cordova.plugin.localnotification.Manager;
import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.Options;
import de.appplant.cordova.plugin.localnotification.Request;
import de.appplant.cordova.plugin.localnotification.action.Action;

/**
 * The receiver activity is triggered when a notification is clicked by a user.
 * The activity calls the background callback and brings the launch intent
 * up to foreground.
 */
public class ClickHandlerActivity extends Activity {

    /**
     * Activity started when local notification was clicked by the user.
     * @param notification Wrapper around the local notification.
     * @param bundle The bundled extras.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int notificationId = getIntent().getExtras().getInt(Notification.EXTRA_ID);
        Notification notification = new Manager(getApplicationContext()).getNotification(notificationId);
        finish();

        if (notification == null) return;

        String action = getIntent().getExtras().getString(Action.EXTRA_ID, Action.CLICK_ACTION_ID);
        JSONObject data = new JSONObject();
        setTextInput(action, data);
        launchAppIf();

        LocalNotification.fireEvent(action, notification, data);

        if (notification.getOptions().isAndroidOngoing()) return;

        if (isLast()) {
            notification.cancel();
        } else {
            notification.clear();
        }
    }

    /**
     * Set the text if any remote input is given.
     * @param action The action where to look for.
     * @param data The object to extend.
     */
    private void setTextInput(String action, JSONObject data) {
        Bundle input = RemoteInput.getResultsFromIntent(getIntent());
        if (input == null) return;

        try {
            data.put("text", input.getCharSequence(action));
        } catch (JSONException jsonException) {
            jsonException.printStackTrace();
        }
    }

    /**
     * Launch app if requested by user.
     */
    private void launchAppIf() {
        boolean doLaunch = getIntent().getBooleanExtra(Options.EXTRA_LAUNCH, true);
        if (!doLaunch) return;
        launchApp();
    }

    /**
     * Launch main intent from package.
     */
    private void launchApp() {
        Context context = getApplicationContext();

        Intent intent = context
            .getPackageManager()
            .getLaunchIntentForPackage(context.getPackageName());

        if (intent == null) return;

        intent.addFlags(
              Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(intent);
    }

    /**
     * If the notification was the last scheduled one by request.
     */
    private boolean isLast() {
        return getIntent().getBooleanExtra(Request.EXTRA_LAST, false);
    }
}
