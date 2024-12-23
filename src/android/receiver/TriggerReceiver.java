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
import android.os.PowerManager;
import android.util.Log;

import java.util.Calendar;

import de.appplant.cordova.plugin.localnotification.ClickHandlerActivity;
import de.appplant.cordova.plugin.localnotification.LocalNotification;
import de.appplant.cordova.plugin.localnotification.Builder;
import de.appplant.cordova.plugin.localnotification.Manager;
import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.Options;
import de.appplant.cordova.plugin.localnotification.Request;

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
        Log.d(TAG, "Received action: " + intent.getAction());

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        int notificationId = bundle.getInt(Notification.EXTRA_ID, 0);
        Options options = new Manager(context).getOptions(notificationId);
        if (options == null) return;

        Notification notification = new Builder(options)
            .setClickActivity(ClickHandlerActivity.class)
            .setClearReceiver(ClearReceiver.class)
            .setExtras(bundle)
            .build();

        if (notification == null) return;

        trigger(context, notification, bundle);
    }

    /**
     * Called when a local notification was triggered. Does present the local
     * notification, re-schedule the alarm if necessary and fire trigger event.
     * @param notification Wrapper around the local notification.
     * @param bundle The bundled extras.
     */
    public void trigger(Context context, Notification notification, Bundle bundle) {
        Log.d(TAG, "trigger, notificationId=" + notification.getId());

        PowerManager.WakeLock wakeLock = null;
        Options options = notification.getOptions();

        // Turn the screen on
        if (options.isAndroidWakeUpScreen()) {
            wakeLock = new Manager(context).wakeUpScreen();
        }

        // Show the notification
        notification.show();

        // The wake lock has to be released after the notification was shown
        if (wakeLock != null) wakeLock.release();

        boolean isUpdate = bundle.getBoolean(Notification.EXTRA_UPDATE, false);
        if (!isUpdate && LocalNotification.isAppRunning()) LocalNotification.fireEvent("trigger", notification);

        // Schedule next notification, if notification is endless repeating
        if (options.isInfiniteTrigger()) {
            Calendar calendar = Calendar.getInstance();
            calendar.add(Calendar.MINUTE, 1);
            new Manager(context).schedule(new Request(options, calendar.getTime()));
        }
    }
}
