package de.appplant.cordova.plugin.notification;

import android.content.Context;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;


import de.appplant.cordova.plugin.localnotification.ClearReceiver;
import de.appplant.cordova.plugin.localnotification.ClickReceiver;
import de.appplant.cordova.plugin.localnotification.LocalNotification;

import static android.content.Context.POWER_SERVICE;
import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.LOLLIPOP;

public class NotificationWorker extends Worker {
    public NotificationWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        int toastId     = getInputData().getInt(Notification.EXTRA_ID, 0);
        Options options = Manager.getInstance(getApplicationContext()).getOptions(toastId);

        if (options == null)
            return Result.failure();

        Builder builder    = new Builder(options);
        Notification toast = buildNotification(builder, getInputData());

        if (toast == null)
            return Result.failure();

        boolean isUpdate = getInputData().getBoolean(Notification.EXTRA_UPDATE, false);

        triggerNotification(toast, isUpdate);

        return Result.success();
    }

    private void triggerNotification(Notification notification, boolean isUpdate) {
        Context context  = notification.getContext();
        Options options  = notification.getOptions();
        Manager manager  = Manager.getInstance(context);
        int badge        = options.getBadgeNumber();

        if (badge > 0) {
            manager.setBadge(badge);
        }

        if (options.shallWakeUp()) {
            wakeUp(context);
        }

        notification.show();

        if (options.isInfiniteTrigger()) {
            manager.schedule(new Request(options), this.getClass());
        }

        if (!isUpdate) {
            LocalNotification.fireEvent("trigger", notification);
        }
    }

    /**
     * Wakeup the device.
     *
     * @param context The application context.
     */
    private void wakeUp (Context context) {
        PowerManager pm = (PowerManager) context.getSystemService(POWER_SERVICE);

        if (pm == null)
            return;

        int level =   PowerManager.SCREEN_DIM_WAKE_LOCK
                | PowerManager.ACQUIRE_CAUSES_WAKEUP;

        PowerManager.WakeLock wakeLock = pm.newWakeLock(
                level, "LocalNotification");

        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(1000);

        if (SDK_INT >= LOLLIPOP) {
            wakeLock.release(PowerManager.RELEASE_FLAG_WAIT_FOR_NO_PROXIMITY);
        } else {
            wakeLock.release();
        }
    }

    public Notification buildNotification (Builder builder, Data data) {
        Bundle bundle = new Bundle();
        bundle.putInt(Notification.EXTRA_ID, data.getInt(Notification.EXTRA_ID, 0));
        bundle.putInt(Request.EXTRA_OCCURRENCE, data.getInt(Request.EXTRA_OCCURRENCE, 0));
        return builder
                .setClickActivity(ClickReceiver.class)
                .setClearReceiver(ClearReceiver.class)
                .setExtras(bundle)
                .build();
    }


}
