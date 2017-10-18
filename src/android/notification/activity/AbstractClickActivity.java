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

package de.appplant.cordova.plugin.notification.activity;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import org.json.JSONException;
import org.json.JSONObject;

import de.appplant.cordova.plugin.notification.Action;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;

import static de.appplant.cordova.plugin.notification.Action.CLICK_ACTION_ID;

/**
 * Abstract content receiver activity for local notifications. Creates the
 * local notification and calls the event functions for further proceeding.
 */
abstract public class AbstractClickActivity extends Activity {

    /**
     * Called when local notification was clicked to launch the main intent.
     *
     * @param state Saved instance state
     */
    @Override
    public void onCreate (Bundle state) {
        super.onCreate(state);

        Intent intent   = getIntent();
        Bundle bundle   = intent.getExtras();
        Context context = getApplicationContext();

        try {
            String action   = bundle.getString(Action.EXTRA, CLICK_ACTION_ID);
            String data     = bundle.getString(Options.EXTRA);
            JSONObject dict = new JSONObject(data);
            Options options = new Options(context, dict);

            Notification notification =
                    new Notification(context, options);

            onClick(action, notification);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Fixes "Unable to resume activity" error.
     * Theme_NoDisplay: Activities finish themselves before being resumed.
     */
    @Override
    protected void onResume() {
        super.onResume();
        finish();
    }

    /**
     * Called when local notification was clicked by the user.
     *
     * @param action       The name of the action.
     * @param notification Wrapper around the local notification.
     */
    abstract public void onClick (String action, Notification notification);

    /**
     * Launch main intent from package.
     */
    public void launchApp() {
        Context context = getApplicationContext();
        String pkgName  = context.getPackageName();

        Intent intent = context
                .getPackageManager()
                .getLaunchIntentForPackage(pkgName);

        intent.addFlags(
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(intent);
    }

}
