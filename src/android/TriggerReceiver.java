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
import static de.appplant.cordova.plugin.localnotification.LocalNotification.isInForeground;
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
        performNotification(notification);
    }

    @Override
    public void dispatchAppEvent(String key, Notification notification) {
        fireEvent(key, notification);
    }

    @Override
    public boolean checkAppRunning() {
        return isAppRunning();
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
