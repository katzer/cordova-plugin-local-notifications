/**
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer).
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  LGPL v2.1 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class ReceiverActivity extends Activity {

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = this.getIntent();
        Bundle bundle = intent.getExtras();

        try {
            JSONObject args = new JSONObject(bundle.getString(Receiver.OPTIONS));
            Options options = new Options(getApplicationContext()).parse(args);

            invokeBackgroundCallback(options);
            launchMainIntent();
        } catch (JSONException e) {}
    }

    /**
     * Launch main intent for package.
     */
    private void launchMainIntent () {
        Context context     = getApplicationContext();
        String packageName  = context.getPackageName();
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(launchIntent);
    }

    /**
     * Ruft die `background` Callback Funktion auf.
     */
    private void invokeBackgroundCallback (Options options) {
        String function = options.getBackground();

        // after reboot, LocalNotification.webView is always null
        // may be call background callback later
        if (function != null && LocalNotification.webView != null) {
            LocalNotification.webView.sendJavascript(function + "(" + options.getId() + ")");
        }
    }
}
