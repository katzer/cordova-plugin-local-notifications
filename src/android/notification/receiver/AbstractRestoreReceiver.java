/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
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
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.notification.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

import java.util.List;

import de.appplant.cordova.plugin.notification.Builder;
import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;
import de.appplant.cordova.plugin.notification.Request;

import static android.content.Intent.ACTION_BOOT_COMPLETED;
import static android.os.Build.VERSION.SDK_INT;

/**
 * This class is triggered upon reboot of the device. It needs to re-register
 * the alarms with the AlarmManager since these alarms are lost in case of
 * reboot.
 */
abstract public class AbstractRestoreReceiver extends BroadcastReceiver {

    /**
     * Called on device reboot.
     *
     * @param context Application context
     * @param intent  Received intent with content data
     */
    @Override
    public void onReceive (Context context, Intent intent) {
        String action = intent.getAction();

        if (action.equals(ACTION_BOOT_COMPLETED) && SDK_INT >= 24)
            return;

        Manager mgr               = Manager.getInstance(context);
        List<JSONObject> toasts = mgr.getOptions();

        for (JSONObject data : toasts) {
            Options options    = new Options(context, data);
            Request request    = new Request(options);
            Builder builder    = new Builder(options);
            Notification toast = buildNotification(builder);

            onRestore(request, toast);
        }
    }

    /**
     * Called when a local notification need to be restored.
     *
     * @param request Set of notification options.
     * @param toast   Wrapper around the local notification.
     */
    abstract public void onRestore (Request request, Notification toast);

    /**
     * Build notification specified by options.
     *
     * @param builder Notification builder.
     */
    abstract public Notification buildNotification (Builder builder);

}
