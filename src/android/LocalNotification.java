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

// codebeat:disable[TOO_MANY_FUNCTIONS]

package de.appplant.cordova.plugin.localnotification;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.util.Pair;
import android.view.View;
import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import android.content.Intent;
import android.provider.Settings;
import android.net.Uri;
import android.os.Build;
import android.content.IntentFilter;
import androidx.core.app.NotificationManagerCompat;

import androidx.core.content.ContextCompat;
import androidx.core.content.IntentCompat;
import androidx.core.content.PackageManagerCompat;
import androidx.core.content.UnusedAppRestrictionsConstants;

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
import java.util.Arrays;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.Manager;
import de.appplant.cordova.plugin.localnotification.Notification;
import de.appplant.cordova.plugin.localnotification.Options;
import de.appplant.cordova.plugin.localnotification.action.ActionGroup;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;
import de.appplant.cordova.plugin.localnotification.util.CallbackContextUtil;

import com.google.common.util.concurrent.ListenableFuture;

import static de.appplant.cordova.plugin.localnotification.Notification.Type.SCHEDULED;
import static de.appplant.cordova.plugin.localnotification.Notification.Type.TRIGGERED;

/**
 * This plugin utilizes the Android AlarmManager in combination with local
 * notifications. When a local notification is scheduled the alarm manager takes
 * care of firing the event. When the event is processed, a notification is put
 * in the Android notification center and status bar.
 */
@SuppressWarnings({"Convert2Diamond", "Convert2Lambda"})
public class LocalNotification extends CordovaPlugin {

    public static final String TAG = "LocalNotification";

    // Reference to the web view for static access
    private static WeakReference<CordovaWebView> weakReferenceCordovaWebView = null;

    // Indicates if the device is ready (to receive events)
    private static Boolean deviceready = false;

    // Queues all events before deviceready
    private static ArrayList<String> eventQueue = new ArrayList<String>();

    // Launch details
    private static Pair<Integer, String> launchDetails;

    private static int REQUEST_CODE_MANAGE_UNUSED_APP_RESTRICTIONS = 1005;

    /**
     * Called after plugin construction and fields have been initialized.
     */
    @Override
    protected void pluginInitialize() {
        LocalNotification.weakReferenceCordovaWebView = new WeakReference<CordovaWebView>(webView);
        // Create shared direcotry for assets
        new AssetUtil(getContext()).getSharedDirectory().mkdir();
    }

    /**
     * Called when the activity will start interacting with the user.
     *
     * @param multitasking Flag indicating if multitasking is turned on for app.
     */
    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        Log.d(TAG, "onResume");
        deviceready();
    }

    /**
     * The final call you receive before your activity is destroyed.
     */
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
        deviceready = false;
    }

    /**
     * Executes the request.
     *
     * This method is called from the WebView thread. To do a non-trivial
     * amount of work, use:
     *      cordova.getThreadPool().execute(runnable);
     *
     * To run on the UI thread, use:
     *     cordova.getActivity().runOnUiThread(runnable);
     *
     * @param action  The action to execute.
     * @param args    The exec() arguments in JSON form.
     * @param callbackContext The callback context used when calling back into JavaScript.
     *
     * @return Whether the action was valid.
     */
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        Log.d(TAG, "execute, action=" + action + ", args=" + args);

        if (action.equals("launch")) {
            launch(callbackContext);
            return true;
        }

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (action.equals("ready")) {
                    deviceready();
                } else if (action.equals("createChannel")) {
                    createChannel(args, callbackContext);
                } else if (action.equals("deleteChannel")) {
                    deleteChannel(args, callbackContext);
                } else if (action.equals("hasPermission")) {
                    hasPermission(callbackContext);
                } else if (action.equals("requestPermission")) {
                    requestPermission(callbackContext);
                } else if (action.equals("actions")) {
                    actions(args, callbackContext);
                } else if (action.equals("schedule")) {
                    schedule(args, callbackContext);
                } else if (action.equals("update")) {
                    update(args, callbackContext);
                } else if (action.equals("cancel")) {
                    cancel(args, callbackContext);
                } else if (action.equals("cancelAll")) {
                    cancelAll(callbackContext);
                } else if (action.equals("clear")) {
                    clear(args, callbackContext);
                } else if (action.equals("clearAll")) {
                    clearAll(callbackContext);
                } else if (action.equals("type")) {
                    type(args, callbackContext);
                } else if (action.equals("ids")) {
                    ids(args, callbackContext);
                } else if (action.equals("notification")) {
                    notification(args, callbackContext);
                } else if (action.equals("notifications")) {
                    notifications(args, callbackContext);
                } else if (action.equals("canScheduleExactAlarms")) {
                    canScheduleExactAlarms(callbackContext);
                } else if (action.equals("openNotificationSettings")) {
                    openNotificationSettings(callbackContext);
                } else if (action.equals("openAlarmSettings")) {
                    openAlarmSettings(callbackContext);
                } else if (action.equals("getUnusedAppRestrictionsStatus")) {
                    getUnusedAppRestrictionsStatus(callbackContext);
                } else if (action.equals("openManageUnusedAppRestrictions")) {
                    openManageUnusedAppRestrictions(callbackContext);
                }
            }
        });

        return true; // Action was found
    }

    /**
     * Set launchDetails object.
     */
    @SuppressLint("DefaultLocale")
    private void launch(CallbackContext callbackContext) {
        if (launchDetails == null) return;

        JSONObject details = new JSONObject();

        try {
            details.put("id", launchDetails.first);
            details.put("action", launchDetails.second);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        callbackContext.success(details);

        launchDetails = null;
    }

    /**
     * Ask if user has enabled permission to post notifications.
     */
    private void hasPermission(CallbackContext callbackContext) {
        successBoolean(callbackContext, NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
    }

    /**
     * Ask if if the setting to schedule exact alarms is enabled.
     */
    private void canScheduleExactAlarms(CallbackContext callbackContext) {
        successBoolean(callbackContext, Manager.canScheduleExactAlarms(getContext()));
    }

    /**
     * Request permission for local notifications.
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    private void requestPermission(CallbackContext callbackContext) {
        // Permission is granted.
        if (NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            successBoolean(callbackContext, true);
            return;
        }

        // If Notifications are disabled and POST_NOTIFICATIONS runtime permission is not supported
        // we can't ask the user to enable notifications, so we return false.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            successBoolean(callbackContext, false);
            return;
        }

        // Store the callback context for later use in onRequestPermissionResult
        // and get a random request code to identify the context later
        int randomRequestCode = CallbackContextUtil.storeContext(callbackContext);

        // Request the runtime permission.
        cordova.requestPermission(this, randomRequestCode, Manifest.permission.POST_NOTIFICATIONS);
    }

    /**
     * Called by {@link CordovaActivity#onRequestPermissionsResult} when the user grants permissions, which
     * was called by Android.
     * 
     * @deprecated In the future {@link #onRequestPermissionsResult} should be used, but cordova calls still the old
     * method: https://github.com/apache/cordova-android/issues/1388
     * @see Android method onRequestPermissionsResult: https://developer.android.com/reference/android/app/Activity#onRequestPermissionsResult(int,%20java.lang.String[],%20int[])
     */
    @Override
    @Deprecated
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) {
        Log.d(TAG, "onRequestPermissionResult" + 
            ", requestCode=" + requestCode +
            ", permissions=" + Arrays.toString(permissions) +
            ", grantResults=" + Arrays.toString(grantResults));

        // It is possible that the permissions request interaction with the user is interrupted.
        // In this case the permissions and grantResults array is empty, which should be treated as a cancellation.
        boolean permissionGranted = grantResults.length > 0 ? grantResults[0] == PackageManager.PERMISSION_GRANTED : false;
        CallbackContext callbackContext = CallbackContextUtil.getCallbackContext(requestCode);

        if (callbackContext != null) successBoolean(callbackContext, permissionGranted);

        // Remove the saved context
        CallbackContextUtil.clearContext(requestCode);
    }

    /**
     * Register, removes or checks for an action group
     * @param args The exec() arguments in JSON form.
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    private void actions(JSONArray args, CallbackContext callbackContext) {
        String actionGroupId = args.optString(1);

        // The first agrument defines, which method was called
        switch (args.optInt(0)) {
            // addActions was called
            case 0:
                ActionGroup group = ActionGroup.parse(getContext(), actionGroupId, args.optJSONArray(2));
                ActionGroup.register(group);
                callbackContext.success();
                break;
            // removeActions was called
            case 1:
                ActionGroup.unregister(actionGroupId);
                callbackContext.success();
                break;
            // hasActions was called
            case 2:
                successBoolean(callbackContext, ActionGroup.isRegistered(actionGroupId));
                break;
        }
    }

    /**
     * Schedule one or multiple local notifications
     * @param optionsJSONList The notifications to schedule.
     */
    private void schedule(JSONArray optionsJSONList, CallbackContext callbackContext) {
        for (int index = 0; index < optionsJSONList.length(); index++) {
            Notification notification = new Notification(getContext(), optionsJSONList.optJSONObject(index));
            if (notification.scheduleNext()) fireEvent("add", notification);
        }

        hasPermission(callbackContext);
    }    
    
    /**
     * Create Notification channel with options.
     *
     * @param args  The channel options.
     * @param callbackContext The callback context used when calling back into
     *                JavaScript.
     */
    private void createChannel(JSONArray args, CallbackContext callbackContext) {
        Manager.createChannel(getContext(), new Options(getContext(), args.optJSONObject(0)));
        callbackContext.success();
    }

    /**
     * Deletes a notification channel by an id.
     * @param args Contains the channel id as a String.
     */
    private void deleteChannel(JSONArray args, CallbackContext callbackContext) {
        getManager().deleteChannel(args.optString(0));
        callbackContext.success();
    }

    /**
     * Update multiple notifications.
     * @param optionsList Notification properties including their IDs.
     * @param callbackContext
     */
    private void update(JSONArray optionsList, CallbackContext callbackContext) {
        for (int index = 0; index < optionsList.length(); index++) {

            JSONObject updateOptions = optionsList.optJSONObject(index);
            int notificationId = updateOptions.optInt("id", 0);
            Notification notification = getManager().update(notificationId, updateOptions);
            
            // Notification didn't exist and couldn't be updated
            if (notification == null) continue;

            // Inform webView about the update
            fireEvent("update", notification);
        }

        hasPermission(callbackContext);
    }

    /**
     * Cancel multiple local notifications.
     */
    private void cancel(JSONArray args, CallbackContext callbackContext) {
        for (int argsIndex = 0; argsIndex < args.length(); argsIndex++) {
            Notification notification = Notification.getFromSharedPreferences(getContext(), args.optInt(argsIndex, 0));
            if (notification != null) notification.cancel();
        }

        callbackContext.success();
    }

    /**
     * Cancel all scheduled notifications.
     */
    private void cancelAll(CallbackContext callbackContext) {
        getManager().cancelAll();
        fireEvent("cancelall");
        callbackContext.success();
    }

    /**
     * Clear multiple local notifications without canceling them.
     * @param args Set of local notification IDs.
     */
    private void clear(JSONArray args, CallbackContext callbackContext) {
        for (int argsIndex = 0; argsIndex < args.length(); argsIndex++) {
            Notification notification = Notification.getFromSharedPreferences(getContext(), args.optInt(argsIndex, 0));
            if (notification != null) notification.clear();
        }

        callbackContext.success();
    }

    /**
     * Clear all triggered notifications without canceling them.
     */
    private void clearAll(CallbackContext callbackContext) {
        getManager().clearAll();
        fireEvent("clearall");
        callbackContext.success();
    }

    /**
     * Get the type of the notification (unknown, scheduled, triggered).
     */
    private void type(JSONArray args, CallbackContext callbackContext) {
        Notification notification = Notification.getFromSharedPreferences(getContext(), args.optInt(0));

        if (notification == null) {
            callbackContext.success("unknown");
            return;
        }

        switch (notification.getType()) {
            case SCHEDULED:
                callbackContext.success("scheduled");
                break;
            case TRIGGERED:
                callbackContext.success("triggered");
                break;
            default:
                callbackContext.success("unknown");
                break;
        }
    }

    /**
     * Set of IDs from all existent notifications.
     * @param args Type of notifications to get IDs from.
     */
    private void ids(JSONArray args, CallbackContext callbackContext) {
        int type    = args.optInt(0);
        Manager mgr = getManager();
        List<Integer> ids;

        switch (type) {
            case 0:
                ids = mgr.getNotificationIds();
                break;
            case 1:
                ids = mgr.getNotificationIdsByType(SCHEDULED);
                break;
            case 2:
                ids = mgr.getNotificationIdsByType(TRIGGERED);
                break;
            default:
                ids = new ArrayList<Integer>(0);
                break;
        }

        callbackContext.success(new JSONArray(ids));
    }

    /**
     * Sends options from a notification to WebView
     */
    private void notification(JSONArray args, CallbackContext callbackContext) {
        Notification notification = Notification.getFromSharedPreferences(getContext(), args.optInt(0));

        if (notification != null) {
            callbackContext.success(notification.getOptions().getJSON());
        } else {
            callbackContext.success();
        }
    }

    /**
     * Set of options from local notification.
     */
    private void notifications(JSONArray args, CallbackContext callbackContext) {
        int type = args.optInt(0);
        JSONArray ids = args.optJSONArray(1);
        List<Notification> notifications = new ArrayList<Notification>();

        switch (type) {
            case 0:
                notifications = getManager().getNotificationsFromSharedPreferences();
                break;
            case 1:
                notifications = getManager().getByType(SCHEDULED);
                break;
            case 2:
                notifications = getManager().getByType(TRIGGERED);
                break;
            case 3:
                notifications = getManager().getNotificationsFromSharedPreferences(toList(ids));
                break;
        }

        ArrayList<JSONObject> options = new ArrayList<JSONObject>();

        for (Notification notification : notifications) {
            options.add(notification.getOptions().getJSON());
        }

        callbackContext.success(new JSONArray(options));
    }
    /**
     * Open the Android Notification settings for current app.
     */
    private void openNotificationSettings(CallbackContext callbackContext) {
        String packageName = cordova.getActivity().getPackageName();
        Intent intent = new Intent();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName);
        } else {
            // In old Android versions it's not possible to view notification settings, open app settings.
            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + packageName));
        }

        cordova.getActivity().startActivity(intent);
        callbackContext.success();
    }

    /**
     * Open the Alarms & Reminders setting for the current app.
     * This setting is available since Android 12 (SDK 31). If this method is called on
     * Android 11 (SDK 30) or older, the method will just call callbackContext.success().
     */
    private void openAlarmSettings(CallbackContext callbackContext) {
        // Setting available since Android 12 (SDK 31)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            cordova.getActivity().startActivity(new Intent(
                Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:" + cordova.getActivity().getPackageName())));
        }

        callbackContext.success();
    }

    /**
     * Returns the status of Unused App Restrictions, which was introduced in Android 11 and
     * backported to Android 6 to 10 through the Google Play Store.
     * @return int @see UnusedAppRestrictionsConstants
     * @see https://developer.android.com/topic/performance/app-hibernation
     */
    private void getUnusedAppRestrictionsStatus(CallbackContext callbackContext) {
        ListenableFuture<Integer> listenableFuture = PackageManagerCompat.getUnusedAppRestrictionsStatus(getContext());
        listenableFuture.addListener(new Runnable() {
            public void run() {
                try {
                    callbackContext.success(listenableFuture.get());
                } catch (Exception exception) {
                    callbackContext.success(UnusedAppRestrictionsConstants.ERROR);
                }
            }
          }, ContextCompat.getMainExecutor(getContext()));
    }

    /**
     * Starts an Intent to redirect the user to manage their unused app restriction settings.
     */
    private void openManageUnusedAppRestrictions(CallbackContext callbackContext) {
        Intent intent = IntentCompat.createManageUnusedAppRestrictionsIntent(
            getContext(), cordova.getActivity().getApplicationContext().getPackageName());
        
        // Store the callback context for later use in onActivityResult to inform the webview
        CallbackContextUtil.storeContext(callbackContext, REQUEST_CODE_MANAGE_UNUSED_APP_RESTRICTIONS);

        // Start the activity
        this.cordova.startActivityForResult(this, intent, REQUEST_CODE_MANAGE_UNUSED_APP_RESTRICTIONS);
    }

    /**
     * Called when an activity launched exits, giving the requestCode started it with,
     * the resultCode it returned, and any additional data from it.
     * @param requestCode The request code originally supplied to startActivityForResult(), allowing you to
     * identify who this result came from.
     * @param resultCode The integer result code returned by the child activity through its setResult().
     * @param intent An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        Log.d(TAG, "onActivityResult" + 
            ", requestCode=" + requestCode +
            ", resultCode=" + resultCode +
            ", intent=" + intent);

        // Get the saved CallbackContext for the request code
        CallbackContext callbackContext = CallbackContextUtil.getCallbackContext(requestCode);

        if (callbackContext != null) callbackContext.success(resultCode);

        // Remove the saved CallbackContext
        CallbackContextUtil.clearContext(requestCode);
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
     * Helper method to invoke the {@link CallbackContext} with a boolean argument,
     * because there does not exists a success method with a boolean in {@link CallbackContext}.
     */
    private void successBoolean(CallbackContext callbackContext, boolean success) {
        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, success));
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
    public static void fireEvent(String event, Notification notification) {
        fireEvent(event, notification, new JSONObject());
    }

    /**
     * Fire given event on JS side. Does inform all event listeners.
     *
     * @param event The event name.
     * @param notification Optional notification to pass with.
     * @param data Event object with additional data.
     */
    static void fireEvent(String event, Notification notification, JSONObject data) {
        try {
            data.put("event", event);
            data.put("foreground", isInForeground());
            data.put("queued", !deviceready);

            if (notification != null) {
                data.put("notification", notification.getId());
            }
        } catch (JSONException exception) {
            exception.printStackTrace();
        }

        if (launchDetails == null && !deviceready && notification != null) {
            launchDetails = new Pair<Integer, String>(notification.getId(), event);
        }

        sendJavascript(String.format(
            "cordova.plugins.notification.local.fireEvent('%s', %s)",
            event,
            // params
            (notification != null ? notification.getOptions().toString() + ", " : "") + data.toString()));
    }

    /**
     * Use this instead of deprecated sendJavascript
     *
     * @param js JS code snippet as string.
     */
    private static synchronized void sendJavascript(final String js) {

        if (!deviceready || weakReferenceCordovaWebView == null) {
            eventQueue.add(js);
            return;
        }

        final CordovaWebView cordovaWebView = weakReferenceCordovaWebView.get();

        ((Activity)(cordovaWebView.getContext())).runOnUiThread(new Runnable() {
            public void run() {
                cordovaWebView.loadUrl("javascript:" + js);
            }
        });
    }

    /**
     * If the app is running in foreground.
     */
    private static boolean isInForeground() {
        if (!deviceready || weakReferenceCordovaWebView == null) return false;

        CordovaWebView cordovaWebView = weakReferenceCordovaWebView.get();

        // Class to manage and query the state of the lock screen (also known as Keyguard).
        KeyguardManager km = (KeyguardManager) cordovaWebView.getContext().getSystemService(Context.KEYGUARD_SERVICE);

        // - km can be null if running as an instant app
        // - Only true, if lock screen is not visible and the app is visible.
        return (km == null || (km != null && !km.isKeyguardLocked())) && cordovaWebView.getView().getWindowVisibility() == View.VISIBLE;
    }

    /**
     * If the app is running.
     */
    public static boolean isAppRunning() {
        return weakReferenceCordovaWebView != null;
    }

    /**
     * Launch main intent from package.
     */
    public static void launchApp(Context context) {
        Log.d(TAG, "Launching the app");
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());

        if (launchIntent == null) return;
        
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        context.startActivity(launchIntent);
    }

    /**
     * Get the app name.
     * @return String App name.
     */
    public static String getAppName(Context context) {
        return (String) context.getPackageManager().getApplicationLabel(context.getApplicationInfo());
    }

    /**
     * Convert JSON array of integers to List.
     *
     * @param jsonArray Array of integers.
     */
    private List<Integer> toList(JSONArray jsonArray) {
        List<Integer> list = new ArrayList<Integer>();

        for (int index = 0; index < jsonArray.length(); index++) {
            list.add(jsonArray.optInt(index));
        }

        return list;
    }

    /**
     * Notification manager instance.
     */
    private Manager getManager() {
        return new Manager(getContext());
    }

    private Context getContext() {
        return cordova.getActivity();
    }
}

// codebeat:enable[TOO_MANY_FUNCTIONS]
