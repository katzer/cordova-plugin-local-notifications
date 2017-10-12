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

package de.appplant.cordova.plugin.notification;

import android.content.Context;

import org.json.JSONObject;

import de.appplant.cordova.plugin.notification.util.AssetUtil;

/**
 * Holds the icon and title components that would be used in a
 * NotificationCompat.Action object. Does not include the PendingIntent so
 * that it may be generated each time the notification is built. Necessary to
 * compensate for missing functionality in the support library.
 */
final class Action {

    // Key name for bundled extras
    static final String EXTRA = "NOTIFICATION_ACTION_ID";

    // The ID of the action
    private final String id;

    // The title for the action
    private final String title;

    // The icon for the action
    private final int icon;

    // The launch flag for the action
    private final boolean launch;

    /**
     * Structure to encapsulate a named action that can be shown as part of
     * this notification.
     *
     * @param context The application context.
     * @param options The action options.
     */
    Action (Context context, JSONObject options) {
        this.icon  = parseIcon(context, options.optString("icon"));
        this.title = options.optString("title");
        this.id    = options.optString("id", title);
        this.launch = options.optBoolean("launch", false);
    }

    /**
     * Gets the ID for the action.
     */
    public String getId() {
        return id;
    }

    /**
     * Gets the Title for the action.
     */
    public String getTitle() {
        return title;
    }

    /**
     * Gets the icon for the action.
     */
    public int getIcon() {
        return icon;
    }

    /**
     * Gets the value of the launch flag.
     */
    public boolean isLaunchingApp() {
        return launch;
    }

    /**
     * Parse the uri into a resource id.
     *
     * @param context The application context.
     * @param resPath The resource path.
     *
     * @return The resource id.
     */
    private int parseIcon(Context context, String resPath) {
        AssetUtil assets = AssetUtil.getInstance(context);
        int resId        = assets.getResId(resPath);

        if (resId == 0) {
            resId = android.R.drawable.screen_background_dark;
        }

        return resId;
    }

}