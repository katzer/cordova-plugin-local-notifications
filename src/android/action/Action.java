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

package de.appplant.cordova.plugin.localnotification.action;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.RemoteInput;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import de.appplant.cordova.plugin.localnotification.LocalNotification;
import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

/**
 * Holds the icon and title components that would be used in a
 * NotificationCompat.Action object. Does not include the PendingIntent so
 * that it may be generated each time the notification is built. Necessary to
 * compensate for missing functionality in the support library.
 */
public class Action {

    private static final String TAG = "Action";

    // Key name for bundled extras
    public static final String EXTRA_ID = "NOTIFICATION_ACTION_ID";

    private Context context;

    private JSONObject actionOptionsJSON;

    /**
     * Structure to encapsulate a named action that can be shown as part of
     * this notification.
     *
     * @param context The application context.
     * @param actionOptionsJSON The action options.
     */
    public Action(Context context, JSONObject actionOptionsJSON) {
        this.context = context;
        this.actionOptionsJSON = actionOptionsJSON;
    }

    /**
     * Gets the ID for the action.
     */
    public String getId() {
        return actionOptionsJSON.optString("id", getTitle());
    }

    public String getType() {
        return actionOptionsJSON.optString("type", "button");
    }

    /**
     * Gets the Title for the action.
     */
    public String getTitle() {
        return actionOptionsJSON.optString("title", "unknown");
    }

    /**
     * Gets the icon for the action. Since Android 7 (Nougat) icons for actions
     * are not shown anymore. They would only be used on Android Wear.
     * See: https://android-developers.googleblog.com/2016/06/notifications-in-android-n.html
     */
    public int getIcon() {
        String iconPath = actionOptionsJSON.optString("icon");

        // Get icon from the app resources or system resources
        int resId = new AssetUtil(context).getResourceId(iconPath, AssetUtil.RESOURCE_TYPE_DRAWABLE);

        // Fallback, nothing found
        if (resId == 0) resId = android.R.drawable.screen_background_dark;

        return resId;
    }

    /**
     * If the app shpould be launched when the action is clicked.
     * Default is <code>false</code>.
     */
    public boolean isLaunch() {
        return actionOptionsJSON.optBoolean("launch", false);
    }

    /**
     * Returns true if the action is of type input.
     */
    public boolean isInput() {
        return getType().equals("input");
    }

    /**
     * Gets the input config in case of the action is of type input.
     */
    public RemoteInput buildRemoteInput() {
        return new RemoteInput.Builder(getId())
                .setLabel(actionOptionsJSON.optString("emptyText"))
                // Specifies whether the user can provide arbitrary text values
                // The default is true. If you specify false, you must either provide a non-null and
                // non-empty array to setChoices, or enable a data result in setAllowDataType.
                // Otherwise an IllegalArgumentException is thrown
                .setAllowFreeFormInput(actionOptionsJSON.optBoolean("editable", true))
                .setChoices(getChoices())
                .build();
    }

    /**
     * List of possible choices for input actions.
     */
    private String[] getChoices() {
        JSONArray opts = actionOptionsJSON.optJSONArray("choices");

        if (opts == null)
            return null;

        String[] choices = new String[opts.length()];

        for (int i = 0; i < choices.length; i++) {
            choices[i] = opts.optString(i);
        }

        return choices;
    }

    public void handleClick(Intent intent, Notification notification) {
        Log.d(TAG, "Handle action click, options=" + actionOptionsJSON);

        // Fire action click event to JS
        LocalNotification.fireEvent(
            getId(),
            notification,
            // Get input data for action, if it is an input action
            getRemoteInputData(intent));

        // Clear notification from statusbar if it should not be ongoing
        // This will also remove the notification from the SharedPreferences
        // if it is the last one
        if (!notification.getOptions().isAndroidOngoing()) {
            // A clear does not work on notifications with input fields:
            // https://stackoverflow.com/questions/54219914/cancel-notification-with-remoteinput-not-working
            // Google recommends after a reply to update the notificiation without the input action:
            // https://developer.android.com/develop/ui/views/notifications/build-notification#retrieve-user-reply
            // We update the notification without actions and cancel it after a timeout
            if (isInput()) {
                try {
                    notification.update(new JSONObject("{\"actions\": null}"));
                    // Clear the notification after a delay, because the update needs a little bit time to complete
                    // To be compatible with Android 7, this is done with a Handler
                    // Since Android 8, this could be handled with the property androidTimeoutAfter
                    new android.os.Handler(Looper.getMainLooper()).postDelayed(
                        new Runnable() {
                            public void run() {
                                notification.clear();
                            }
                        }, 
                    500);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to update notification", e);
                }
            } else {
                notification.clear();
            }
        }

        // Launch the app if required
        if (isLaunch()) LocalNotification.launchApp(context);
    }

    /**
     * Gets the input data for an action, if available.
     * @param intent The received intent.
     * @param actionId The action where to look for.
     */
    private JSONObject getRemoteInputData(Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput == null) return null;

        try {
            JSONObject data = new JSONObject();
            data.put("text", remoteInput.getCharSequence(getId()).toString());
            return data;
        } catch (JSONException jsonException) {
            Log.e(TAG, "Failed to build remote input JSON", jsonException);
            return null;
        }
    }
}