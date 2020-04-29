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

import android.content.Context;
import android.os.Bundle;
import android.os.PowerManager;

import java.util.Calendar;

import de.appplant.cordova.plugin.notification.Builder;
import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;
import de.appplant.cordova.plugin.notification.Request;
import de.appplant.cordova.plugin.notification.receiver.AbstractTriggerReceiver;
import de.appplant.cordova.plugin.notification.util.LaunchUtils;

import static android.content.Context.POWER_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.LOLLIPOP;
import static android.os.Build.VERSION_CODES.O;
import static de.appplant.cordova.plugin.localnotification.LocalNotification.fireEvent;
import static de.appplant.cordova.plugin.localnotification.LocalNotification.isAppRunning;
import static java.util.Calendar.MINUTE;

import static android.os.Build.VERSION_CODES.P;

/**
 * The alarm receiver is triggered when a scheduled alarm is fired. This class
 * reads the information in the intent and displays this information in the
 * Android notification bar. The notification uses the default notification
 * sound and it vibrates the phone.
 */
public class TriggerReceiver extends AbstractTriggerReceiver {

    /**
     * Called when a local notification was triggered. Does present the local
     * notification, re-schedule the alarm if necessary and fire trigger event.
     *
     * @param notification Wrapper around the local notification.
     * @param bundle       The bundled extras.
     */
    @Override
    public void onTrigger(Notification notification, Bundle bundle) {
        boolean isUpdate = bundle.getBoolean(Notification.EXTRA_UPDATE, false);
        boolean didShowNotification = false;
        Context context = notification.getContext();
        Options options = notification.getOptions();
        Manager manager = Manager.getInstance(context);
        PowerManager pm = (PowerManager) context.getSystemService(POWER_SERVICE);
        boolean autoLaunch = options.isAutoLaunchingApp() && SDK_INT <= P && !options.useFullScreenIntent();

        // Check device sleep status here (not after wake)
        // If device is asleep in this moment, waking it up with our wakelock
        // is not enough to allow the app to have CPU to trigger an event
        // in Android 8+
        boolean isInteractive = pm.isInteractive();
        int badge = options.getBadgeNumber();

        if (badge > 0) {
            manager.setBadge(badge);
        }

        if (options.shallWakeUp()) {
            wakeUp(notification);
        }

        if (autoLaunch) {
            LaunchUtils.launchApp(context);
        }

        // Show notification if we should (triggerInApp is false)
        // or if we can't trigger in the app due to:
        //   1.  No autoLaunch configured/supported and app is not running.
        //   2.  Any SDK >= Oreo is asleep (must be triggered here)
        if (!options.triggerInApp() ||
            (!autoLaunch && !isAppRunning())
            || (SDK_INT >= O && !isInteractive)
        ) {
            didShowNotification = true;
            notification.show();
        }

        // run trigger function if triggerInApp() is true
        // and we did not send a notification.
        if (options.triggerInApp() && !didShowNotification) {
            // wake up even if we didn't set it to
            if (!options.shallWakeUp()) {
                wakeUp(notification);
            }

            fireEvent("trigger", notification);
        }

        if (!options.isInfiniteTrigger())
            return;

        Calendar cal = Calendar.getInstance();
        cal.add(MINUTE, 1);
        Request req = new Request(options, cal.getTime());

        manager.schedule(req, this.getClass());
    }

    /**
     * Wakeup the device.
     *
     * @param context The application context.
     */
    private void wakeUp(Notification notification) {
        Context context = notification.getContext();
        Options options = notification.getOptions();
        String wakeLockTag = context.getApplicationInfo().name + ":LocalNotification";
        PowerManager pm = (PowerManager) context.getSystemService(POWER_SERVICE);

        if (pm == null)
            return;

        int level = PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE;

        PowerManager.WakeLock wakeLock = pm.newWakeLock(level, wakeLockTag);

        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(options.getWakeLockTimeout());
    }

    /**
     * Build notification specified by options.
     *
     * @param builder Notification builder.
     * @param bundle  The bundled extras.
     */
    @Override
    public Notification buildNotification(Builder builder, Bundle bundle) {
        return builder.setClickActivity(ClickReceiver.class).setClearReceiver(ClearReceiver.class).setExtras(bundle)
                .build();
    }

}
