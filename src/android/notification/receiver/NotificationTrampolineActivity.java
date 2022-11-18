package de.appplant.cordova.plugin.notification.receiver;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;


/**
 * To satisfy the new android 12 requirement, the broadcast receiver used
 * to handle click action on a notification, is replaced with a trampoline activity
 * Note: to handle correctly the case where the application is running in background 
 * while the action is clicked, set 
 *  <preference name="AndroidLaunchMode" value="singleInstance"/>
 *  in the config.xml file.
 * If you don't add this line, the app is restarted
 */
public class NotificationTrampolineActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String packageName = this.getPackageName();
        Intent launchIntent = this.getPackageManager().getLaunchIntentForPackage(packageName);
        String mainActivityClassName = launchIntent.getComponent().getClassName();
        Class mainActivityClass = null;
        try {
          mainActivityClass = Class.forName(mainActivityClassName);
        } catch (ClassNotFoundException e) {
          e.printStackTrace();
          return;
        }

        Intent intent = new Intent(this, mainActivityClass);

        //pull activity from stack or create instance if it doesn't exist
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(intent);
    }
}
