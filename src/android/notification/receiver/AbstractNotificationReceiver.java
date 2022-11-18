package de.appplant.cordova.plugin.notification.receiver;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.os.PowerManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

import de.appplant.cordova.plugin.localnotification.LocalNotification;
import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.Options;
import de.appplant.cordova.plugin.notification.Request;
import de.appplant.cordova.plugin.notification.util.LaunchUtils;

import static android.content.Context.POWER_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.O;
import static android.os.Build.VERSION_CODES.P;
import static java.util.Calendar.MINUTE;

/**
 * The base class for any receiver that is trying to display a notification.
 */
abstract public class AbstractNotificationReceiver extends BroadcastReceiver {
    private final String TAG = "AbstractNotification";

    /**
     * Perform a notification.  All notification logic is here.
     * Determines whether to dispatch events, autoLaunch the app, use fullScreenIntents, etc.
     * @param notification reference to the notification to be fired
     */
    public void performNotification(Notification notification) {
        Context context = notification.getContext();
        Options options = notification.getOptions();
        Manager manager = Manager.getInstance(context);
        PowerManager pm = (PowerManager) context.getSystemService(POWER_SERVICE);
        boolean autoLaunch = options.isAutoLaunchingApp() && SDK_INT <= P && !options.useFullScreenIntent();

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
        boolean didShowNotification = false;
        if      (!options.triggerInApp()
            || (checkAppRunning() &&  !LocalNotification.isInForeground() )
            || (!checkAppRunning() && !autoLaunch )
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

            dispatchAppEvent("trigger", notification);
        }

        if (!options.isInfiniteTrigger())
            return;

        Calendar cal = Calendar.getInstance();
        cal.add(MINUTE, 1);

        Request req = new Request(
            getOptionsWithBaseDate(options, cal.getTimeInMillis()),
            cal.getTime()
        );

        manager.schedule(req, this.getClass());
    }

    /**
     * Clone options with base date attached to trigger.
     * Used so that persisted objects know the last execution time.
     * @param baseDateMillis base date represented in milliseconds
     * @return new Options object with base time set in requestBaseDate.
     */
    private Options getOptionsWithBaseDate(Options options, long baseDateMillis) {
        JSONObject optionsDict = options.getDict();
        try {
            JSONObject triggerDict = optionsDict.getJSONObject("trigger");
            triggerDict.put("requestBaseDate", baseDateMillis);
            optionsDict.remove("trigger");
            optionsDict.put("trigger", triggerDict);
        } catch (JSONException e) {
            Log.e(TAG, "Unexpected error adding requestBaseDate to JSON structure: " + e.toString());
        }
        return new Options(optionsDict);
    }

    /**
     * Send the application an event using our notification
     * @param key key for our event in the app
     * @param notification reference to the notification
     */
    abstract public void dispatchAppEvent(String key, Notification notification);

    /**
     * Check if the application is running.
     * Should be developed in local class, which has access to things needed for this.
     * @return whether or not app is running
     */
    abstract public boolean checkAppRunning();

    /**
     * Wakeup the device.
     *
     * @param notification The notification used to wakeup the device.
     *                     contains context and timeout.
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

}
