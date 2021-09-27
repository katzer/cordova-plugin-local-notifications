package de.appplant.cordova.plugin.localnotification;

import static de.appplant.cordova.plugin.localnotification.LocalNotification.fireEvent;
import static de.appplant.cordova.plugin.notification.Options.EXTRA_LAUNCH;
import static de.appplant.cordova.plugin.notification.Request.EXTRA_LAST;

import android.os.Bundle;

import androidx.core.app.RemoteInput;

import org.json.JSONException;
import org.json.JSONObject;

import de.appplant.cordova.plugin.notification.Notification;
import de.appplant.cordova.plugin.notification.receiver.AbstractClickActivity;

public class ClickActivity extends AbstractClickActivity {


    @Override
    public void onClick(Notification notification) {
        String action   = getAction();
        JSONObject data = new JSONObject();

        setTextInput(action, data);
        launchAppIf();

        fireEvent(action, notification, data);

        if (notification.getOptions().isSticky())
            return;

        if (isLast()) {
            notification.cancel();
        } else {
            notification.clear();
        }
    }

    /**
     * Set the text if any remote input is given.
     *
     * @param action The action where to look for.
     * @param data   The object to extend.
     */
    private void setTextInput(String action, JSONObject data) {
        Bundle input = RemoteInput.getResultsFromIntent(getIntent());

        if (input == null)
            return;

        try {
            data.put("text", input.getCharSequence(action));
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Launch app if requested by user.
     */
    private void launchAppIf() {
        boolean doLaunch = getIntent().getBooleanExtra(EXTRA_LAUNCH, true);

        if (!doLaunch)
            return;

        launchApp();
    }

    /**
     * If the notification was the last scheduled one by request.
     */
    private boolean isLast() {
        return getIntent().getBooleanExtra(EXTRA_LAST, false);
    }

}
