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

// codebeat:disable[TOO_MANY_FUNCTIONS]

package de.appplant.cordova.plugin.localnotification;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PermissionInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Pair;
import android.view.View;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

import javax.security.auth.callback.Callback;

import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;
import de.appplant.cordova.plugin.notification.Request;
import de.appplant.cordova.plugin.notification.action.ActionGroup;

import static android.Manifest.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;
import static android.content.Context.POWER_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.M;
import static de.appplant.cordova.plugin.notification.Notification.Type.SCHEDULED;
import static de.appplant.cordova.plugin.notification.Notification.Type.TRIGGERED;

/**
 * This plugin utilizes the Android AlarmManager in combination with local
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android notification center and status bar.
 */
@SuppressWarnings({ "Convert2Diamond", "Convert2Lambda" })
public class LocalNotification extends CordovaPlugin {

    // Reference to the web view for static access
    private static WeakReference<CordovaWebView> webView = null;

    // Indicates if the device is ready (to receive events)
    private static Boolean deviceready = false;

    // Queues all events before deviceready
    private static ArrayList<String> eventQueue = new ArrayList<String>();

    // Launch details
    private static Pair<Integer, String> launchDetails;

    private static int REQUEST_PERMISSIONS_CALL = 10;

    private static int REQUEST_IGNORE_BATTERY_CALL = 20;

    private CallbackContext callbackContext;

    /**
     * Called after plugin construction and fields have been initialized. Prefer to
     * use pluginInitialize instead since there is no value in having parameters on
     * the initialize() function.
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        LocalNotification.webView = new WeakReference<CordovaWebView>(webView);
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking Flag indicating if multitasking is turned on for app.
     */
    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        deviceready();
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    @Override
    public void onDestroy() {
        deviceready = false;
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial amount of
     * work, use: cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use: cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action  The action to execute.
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     *
     * @return Whether the action was valid.
     */
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext command)
            throws JSONException {

        if (action.equals("launch")) {
            launch(command);
            return true;
        }

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (action.equals("ready")) {
                    deviceready();
                } else if (action.equals("check")) {
                    check(command);
                } else if (action.equals("request")) {
                    request(command);
                } else if (action.equals("actions")) {
                    actions(args, command);
                } else if (action.equals("schedule")) {
                    schedule(args, command);
                } else if (action.equals("update")) {
                    update(args, command);
                } else if (action.equals("cancel")) {
                    cancel(args, command);
                } else if (action.equals("cancelAll")) {
                    cancelAll(command);
                } else if (action.equals("clear")) {
                    clear(args, command);
                } else if (action.equals("clearAll")) {
                    clearAll(command);
                } else if (action.equals("type")) {
                    type(args, command);
                } else if (action.equals("ids")) {
                    ids(args, command);
                } else if (action.equals("notification")) {
                    notification(args, command);
                } else if (action.equals("notifications")) {
                    notifications(args, command);
                } else if (action.equals("hasDoNotDisturbPermissions")) {
                    hasDoNotDisturbPermissions(command);
                } else if (action.equals("requestDoNotDisturbPermissions")) {
                    requestDoNotDisturbPermissions(command);
                } else if (action.equals("isIgnoringBatteryOptimizations")) {
                    isIgnoringBatteryOptimizations(command);
                } else if (action.equals("requestIgnoreBatteryOptimizations")) {
                    requestIgnoreBatteryOptimizations(command);
                }
            }
        });

        return true;
    }

    /**
     * Determine if do not disturb permissions have been granted
     *
     * @return true if we still need to acquire do not disturb permissions.
     */
    private boolean needsDoNotDisturbPermissions() {
        Context mContext = this.cordova.getActivity().getApplicationContext();

        NotificationManager mNotificationManager = (NotificationManager) mContext
                .getSystemService(Context.NOTIFICATION_SERVICE);

        return SDK_INT >= M && !mNotificationManager.isNotificationPolicyAccessGranted();
    }

    /**
     * Determine if we have do not disturb permissions.
     *
     * @param command callback context. Returns with true if the we have
     *                permissions, false if we do not.
     */
    private void hasDoNotDisturbPermissions(CallbackContext command) {
        success(command, !needsDoNotDisturbPermissions());
    }

    /**
     * Launch an activity to request do not disturb permissions
     *
     * @param command callback context. Returns with results of
     *                hasDoNotDisturbPermissions after the activity is closed.
     */
    private void requestDoNotDisturbPermissions(CallbackContext command) {
        if (needsDoNotDisturbPermissions()) {
            this.callbackContext = command;

            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true); // Keep callback
            command.sendPluginResult(pluginResult);

            Intent intent = new Intent(android.provider.Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);

            cordova.startActivityForResult(this, intent, REQUEST_PERMISSIONS_CALL);
            return;
        }
        success(command, true);
    }

    /**
     * Determine if do not battery optimization permissions have been granted
     *
     * @return true if we are succcessfully ignoring battery permissions.
     */
    private boolean ignoresBatteryOptimizations() {
        Context mContext = this.cordova.getActivity().getApplicationContext();
        PowerManager pm = (PowerManager) mContext.getSystemService(POWER_SERVICE);

        return SDK_INT <= M || pm.isIgnoringBatteryOptimizations(mContext.getPackageName());
    }

    /**
     * Determine if we have do not disturb permissions.
     *
     * @param command callback context. Returns with true if the we have
     *                permissions, false if we do not.
     */
    private void isIgnoringBatteryOptimizations(CallbackContext command) {
        success(command, ignoresBatteryOptimizations());
    }

    /**
     * Launch an activity to request do not disturb permissions
     *
     * @param command callback context. Returns with results of
     *                hasDoNotDisturbPermissions after the activity is closed.
     */
    private void requestIgnoreBatteryOptimizations(CallbackContext command) {
        if (!ignoresBatteryOptimizations()) {
            this.callbackContext = command;

            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true); // Keep callback
            command.sendPluginResult(pluginResult);

            String packageName = this.cordova.getContext().getPackageName();
            String action = Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS;

            // use the generic intent if we don't have access to request ignore permissions
            // directly
            // User can add "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" to the manifest, but
            // risks having the app banned.
            try {
                PackageManager packageManager = this.cordova.getContext().getPackageManager();
                PackageInfo pi = packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);

                for (int i = 0; i < pi.requestedPermissions.length; ++i) {
                    if (pi.requestedPermissions[i].equals(REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)) {
                        action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;
                    }
                }
            } catch (PackageManager.NameNotFoundException e) {
                // leave action as default if package not found
            }

            try {
                Intent intent = new Intent(action);

                intent.setData(Uri.parse("package:" + packageName));

                cordova.startActivityForResult(this, intent, REQUEST_IGNORE_BATTERY_CALL);
            } catch (ActivityNotFoundException e) {
                // could not find the generic ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
                // and did not have access to launch REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                // Fallback to just figuring out if battery optimizations are removed (probably
                // not)
                // since we can't ask the user to set it, because we can't launch an activity.
                isIgnoringBatteryOptimizations(command);
                this.callbackContext = null;
            }

            return;
        }
        success(command, true);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_PERMISSIONS_CALL && this.callbackContext != null) {
            hasDoNotDisturbPermissions(this.callbackContext);

            // clean up callback context.
            this.callbackContext = null;
        } else if (requestCode == REQUEST_IGNORE_BATTERY_CALL && this.callbackContext != null) {
            isIgnoringBatteryOptimizations(this.callbackContext);

            this.callbackContext = null;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /**
     * Set launchDetails object.
     *
     * @param command The callback context used when calling back into JavaScript.
     */
    @SuppressLint("DefaultLocale")
    private void launch(CallbackContext command) {
        if (launchDetails == null)
            return;

        JSONObject details = new JSONObject();

        try {
            details.put("id", launchDetails.first);
            details.put("action", launchDetails.second);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        command.success(details);

        launchDetails = null;
    }

    /**
     * Ask if user has enabled permission for local notifications.
     *
     * @param command The callback context used when calling back into JavaScript.
     */
    private void check(CallbackContext command) {
        boolean allowed = getNotMgr().hasPermission();
        success(command, allowed);
    }

    /**
     * Request permission for local notifications.
     *
     * @param command The callback context used when calling back into JavaScript.
     */
    private void request(CallbackContext command) {
        check(command);
    }

    /**
     * Register action group.
     *
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void actions(JSONArray args, CallbackContext command) {
        int task = args.optInt(0);
        String id = args.optString(1);
        JSONArray list = args.optJSONArray(2);
        Context context = cordova.getActivity();

        switch (task) {
        case 0:
            ActionGroup group = ActionGroup.parse(context, id, list);
            ActionGroup.register(group);
            command.success();
            break;
        case 1:
            ActionGroup.unregister(id);
            command.success();
            break;
        case 2:
            boolean found = ActionGroup.isRegistered(id);
            success(command, found);
            break;
        }
    }

    /**
     * Schedule multiple local notifications.
     *
     * @param toasts  The notifications to schedule.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void schedule(JSONArray toasts, CallbackContext command) {
        Manager mgr = getNotMgr();

        for (int i = 0; i < toasts.length(); i++) {
            JSONObject dict = toasts.optJSONObject(i);
            Options options = new Options(dict);
            Request request = new Request(options);
            Notification toast = mgr.schedule(request, TriggerReceiver.class);

            if (toast != null) {
                fireEvent("add", toast);
            }
        }

        check(command);
    }

    /**
     * Update multiple local notifications.
     *
     * @param updates Notification properties including their IDs.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void update(JSONArray updates, CallbackContext command) {
        Manager mgr = getNotMgr();

        for (int i = 0; i < updates.length(); i++) {
            JSONObject update = updates.optJSONObject(i);
            int id = update.optInt("id", 0);
            Notification toast = mgr.update(id, update, TriggerReceiver.class);

            if (toast == null)
                continue;

            fireEvent("update", toast);
        }

        check(command);
    }

    /**
     * Cancel multiple local notifications.
     *
     * @param ids     Set of local notification IDs.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void cancel(JSONArray ids, CallbackContext command) {
        Manager mgr = getNotMgr();

        for (int i = 0; i < ids.length(); i++) {
            int id = ids.optInt(i, 0);
            Notification toast = mgr.cancel(id);

            if (toast == null)
                continue;

            fireEvent("cancel", toast);
        }

        command.success();
    }

    /**
     * Cancel all scheduled notifications.
     *
     * @param command The callback context used when calling back into JavaScript.
     */
    private void cancelAll(CallbackContext command) {
        getNotMgr().cancelAll();
        fireEvent("cancelall");
        command.success();
    }

    /**
     * Clear multiple local notifications without canceling them.
     *
     * @param ids     Set of local notification IDs.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void clear(JSONArray ids, CallbackContext command) {
        Manager mgr = getNotMgr();

        for (int i = 0; i < ids.length(); i++) {
            int id = ids.optInt(i, 0);
            Notification toast = mgr.clear(id);

            if (toast == null)
                continue;

            fireEvent("clear", toast);
        }

        command.success();
    }

    /**
     * Clear all triggered notifications without canceling them.
     *
     * @param command The callback context used when calling back into JavaScript.
     */
    private void clearAll(CallbackContext command) {
        getNotMgr().clearAll();
        fireEvent("clearall");
        command.success();
    }

    /**
     * Get the type of the notification (unknown, scheduled, triggered).
     *
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void type(JSONArray args, CallbackContext command) {
        int id = args.optInt(0);
        Notification toast = getNotMgr().get(id);

        if (toast == null) {
            command.success("unknown");
            return;
        }

        switch (toast.getType()) {
        case SCHEDULED:
            command.success("scheduled");
            break;
        case TRIGGERED:
            command.success("triggered");
            break;
        default:
            command.success("unknown");
            break;
        }
    }

    /**
     * Set of IDs from all existent notifications.
     *
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void ids(JSONArray args, CallbackContext command) {
        int type = args.optInt(0);
        Manager mgr = getNotMgr();
        List<Integer> ids;

        switch (type) {
        case 0:
            ids = mgr.getIds();
            break;
        case 1:
            ids = mgr.getIdsByType(SCHEDULED);
            break;
        case 2:
            ids = mgr.getIdsByType(TRIGGERED);
            break;
        default:
            ids = new ArrayList<Integer>(0);
            break;
        }

        command.success(new JSONArray(ids));
    }

    /**
     * Options from local notification.
     *
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void notification(JSONArray args, CallbackContext command) {
        int id = args.optInt(0);
        Options opts = getNotMgr().getOptions(id);

        if (opts != null) {
            command.success(opts.getDict());
        } else {
            command.success();
        }
    }

    /**
     * Set of options from local notification.
     *
     * @param args    The exec() arguments in JSON form.
     * @param command The callback context used when calling back into JavaScript.
     */
    private void notifications(JSONArray args, CallbackContext command) {
        int type = args.optInt(0);
        JSONArray ids = args.optJSONArray(1);
        Manager mgr = getNotMgr();
        List<JSONObject> options;

        switch (type) {
        case 0:
            options = mgr.getOptions();
            break;
        case 1:
            options = mgr.getOptionsByType(SCHEDULED);
            break;
        case 2:
            options = mgr.getOptionsByType(TRIGGERED);
            break;
        case 3:
            options = mgr.getOptionsById(toList(ids));
            break;
        default:
            options = new ArrayList<JSONObject>(0);
            break;
        }

        command.success(new JSONArray(options));
    }

    /**
     * Call all pending callbacks after the deviceready event has been fired.
     */
    private static synchronized void deviceready() {
        deviceready = true;

        for (String js : eventQueue) {
            sendJavascript(js);
        }

        eventQueue.clear();
    }

    /**
     * Invoke success callback with a single boolean argument.
     *
     * @param command The callback context used when calling back into JavaScript.
     * @param arg     The single argument to pass through.
     */
    private void success(CallbackContext command, boolean arg) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, arg);
        command.sendPluginResult(result);
    }

    /**
     * Fire given event on JS side. Does inform all event listeners.
     *
     * @param event The event name.
     */
    private void fireEvent(String event) {
        fireEvent(event, null, new JSONObject());
    }

    /**
     * Fire given event on JS side. Does inform all event listeners.
     *
     * @param event        The event name.
     * @param notification Optional notification to pass with.
     */
    static void fireEvent(String event, Notification notification) {
        fireEvent(event, notification, new JSONObject());
    }

    /**
     * Fire given event on JS side. Does inform all event listeners.
     *
     * @param event The event name.
     * @param toast Optional notification to pass with.
     * @param data  Event object with additional data.
     */
    static void fireEvent(String event, Notification toast, JSONObject data) {
        String params, js;

        try {
            data.put("event", event);
            data.put("foreground", isInForeground());
            data.put("queued", !deviceready);

            if (toast != null) {
                data.put("notification", toast.getId());
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (toast != null) {
            params = toast.toString() + "," + data.toString();
        } else {
            params = data.toString();
        }

        js = "cordova.plugins.notification.local.fireEvent(" + "\"" + event + "\"," + params + ")";

        if (launchDetails == null && !deviceready && toast != null) {
            launchDetails = new Pair<Integer, String>(toast.getId(), event);
        }

        sendJavascript(js);
    }

    /**
     * Use this instead of deprecated sendJavascript
     *
     * @param js JS code snippet as string.
     */
    private static synchronized void sendJavascript(final String js) {

        if (!deviceready || webView == null) {
            eventQueue.add(js);
            return;
        }

        final CordovaWebView view = webView.get();

        ((Activity) (view.getContext())).runOnUiThread(new Runnable() {
            public void run() {
                view.loadUrl("javascript:" + js);
            }
        });
    }

    /**
     * If the app is running in foreground.
     */
    private static boolean isInForeground() {

        if (!deviceready || webView == null)
            return false;

        CordovaWebView view = webView.get();

        KeyguardManager km = (KeyguardManager) view.getContext().getSystemService(Context.KEYGUARD_SERVICE);

        // noinspection SimplifiableIfStatement
        if (km != null && km.isKeyguardLocked())
            return false;

        return view.getView().getWindowVisibility() == View.VISIBLE;
    }

    /**
     * If the app is running.
     */
    static boolean isAppRunning() {
        return webView != null;
    }

    /**
     * Convert JSON array of integers to List.
     *
     * @param ary Array of integers.
     */
    private List<Integer> toList(JSONArray ary) {
        List<Integer> list = new ArrayList<Integer>();

        for (int i = 0; i < ary.length(); i++) {
            list.add(ary.optInt(i));
        }

        return list;
    }

    /**
     * Notification manager instance.
     */
    private Manager getNotMgr() {
        return Manager.getInstance(cordova.getActivity());
    }

}

// codebeat:enable[TOO_MANY_FUNCTIONS]
