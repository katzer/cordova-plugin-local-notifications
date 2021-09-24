package de.appplant.cordova.plugin.notification.receiver;

import static android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT;
import static android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP;
import static android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP;
import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;
import static de.appplant.cordova.plugin.notification.action.Action.CLICK_ACTION_ID;
import static de.appplant.cordova.plugin.notification.action.Action.EXTRA_ID;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import de.appplant.cordova.plugin.notification.Manager;
import de.appplant.cordova.plugin.notification.Notification;

abstract public class AbstractClickActivity extends Activity {


    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        Intent newIntent = getIntent();

        Bundle newBundle = newIntent.getExtras();

        Context context = getApplicationContext();

        if (newBundle == null)
            return;

        int notificationId = newBundle.getInt(Notification.EXTRA_ID);
        Notification notification = Manager.getInstance(context).get(notificationId);

        if (notification == null)
            return;

        onClick(notification);
        finish();
    }

    abstract public void onClick (Notification notification);

    /**
     * The invoked action.
     */
    protected String getAction() {
        return getIntent().getExtras().getString(EXTRA_ID, CLICK_ACTION_ID);
    }

    /**
     * Launch main intent from package.
     */
    protected void launchApp() {
        Context context = getApplicationContext();
        String pkgName  = context.getPackageName();

        Intent intent = context
                .getPackageManager()
                .getLaunchIntentForPackage(pkgName);

        if (intent == null)
            return;

        intent.addFlags(FLAG_ACTIVITY_REORDER_TO_FRONT | FLAG_ACTIVITY_SINGLE_TOP | FLAG_ACTIVITY_CLEAR_TOP | FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

}
