package de.appplant.cordova.plugin.notification.util;

import android.content.Context;
import android.content.Intent;

import static android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT;
import static android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP;

public final class LaunchUtils {

    /***
     * Launch main intent from package.
     */
    public static void launchApp(Context context) {
        String pkgName  = context.getPackageName();

        Intent intent = context
            .getPackageManager()
            .getLaunchIntentForPackage(pkgName);

        if (intent == null)
            return;

        intent.addFlags(
            FLAG_ACTIVITY_REORDER_TO_FRONT
                | FLAG_ACTIVITY_SINGLE_TOP);

        context.startActivity(intent);
    }

}
