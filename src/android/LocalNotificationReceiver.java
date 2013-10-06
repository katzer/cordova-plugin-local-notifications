/**
 *  LocalNotificationReceiver.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin;

import java.util.Calendar;

import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.Notification.Builder;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

/**
 * The alarm receiver is triggered when a scheduled alarm is fired. This class
 * reads the information in the intent and displays this information in the
 * Android notification bar. The notification uses the default notification
 * sound and it vibrates the phone.
 */
public class LocalNotificationReceiver extends BroadcastReceiver {

	public static final String OPTIONS = "LOCAL_NOTIFICATION_OPTIONS";

	private Context context;
	private LocalNotificationOptions options;

	@Override
	public void onReceive (Context context, Intent intent) {
		LocalNotificationOptions options = null;
		Bundle bundle                    = intent.getExtras();
		JSONObject args;

		try {
			args    = new JSONObject(bundle.getString(OPTIONS));
			options = new LocalNotificationOptions(args);
		} catch (JSONException e) {}

		this.context = context;
		this.options = options;

		if (options.getInterval() == 0) {
			LocalNotification.unpersist(options.getId());
		} else if (isFirstAlarmInFuture()) {
			return;
		}

		Builder notification = buildNotification();

		if (!isInBackground(context)) {
			// exec foreground callback
			invokeForegroundCallback(options);
		}

		showNotification(notification);
	}

	/*
	 * If you set a repeating alarm at 11:00 in the morning and it
	 * should trigger every morning at 08:00 o'clock, it will
	 * immediately fire. E.g. Android tries to make up for the
	 * 'forgotten' reminder for that day. Therefore we ignore the event
	 * if Android tries to 'catch up'.
	 */
	private Boolean isFirstAlarmInFuture () {
		if (options.getInterval() > 0) {
			Calendar now    = Calendar.getInstance();
			Calendar alarm  = options.getCalendar();

			int alarmHour   = alarm.get(Calendar.HOUR_OF_DAY);
			int alarmMin    = alarm.get(Calendar.MINUTE);
			int currentHour = now.get(Calendar.HOUR_OF_DAY);
			int currentMin  = now.get(Calendar.MINUTE);

			if (currentHour != alarmHour && currentMin != alarmMin) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Erstellt die Notification.
	 */
	private Builder buildNotification () {
		Builder notification = new Notification.Builder(context)
		.setContentTitle(options.getTitle())
		.setContentText(options.getSubTitle())
		.setNumber(options.getBadge())
		.setTicker(options.getTitle())
		.setSmallIcon(options.getIcon());

		try {
			if (isInBackground(context)) {
				// app is in background
				notification.setDefaults(Notification.DEFAULT_SOUND);
			}
		} catch (Exception e) {
			// missing GET_TASKS permission
			notification.setDefaults(Notification.DEFAULT_SOUND);
		}

		setClickEvent(notification);

		return notification;
	}

	/**
	 * Fügt der Notification einen onclick Handler hinzu.
	 */
	private Builder setClickEvent (Builder notification) {
		String packageName          = context.getPackageName();
		Intent launchIntent         = context.getPackageManager().getLaunchIntentForPackage(packageName);
		PendingIntent contentIntent = PendingIntent.getActivity(context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);

		return notification.setContentIntent(contentIntent);
	}

	/**
	 * Zeigt die Notification an.
	 */
	@SuppressWarnings("deprecation")
	@SuppressLint("NewApi")
	private void showNotification (Builder notification) {
		NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
		int id                  = 0;

		try {
			id = Integer.parseInt(options.getId());
		} catch (Exception e) {}

        if (Build.VERSION.SDK_INT<16) {
            // build notification for HoneyComb to ICS
        	mgr.notify(id, notification.getNotification());
        } else if (Build.VERSION.SDK_INT>15) {
            // Notification for Jellybean and above
        	mgr.notify(id, notification.build());
        }
	}

	/**
	 * Gibt an, ob die App im Hintergrund läuft.
	 */
	private boolean isInBackground (Context context) {
		return !context.getPackageName().equalsIgnoreCase(((ActivityManager)context.getSystemService(Context.ACTIVITY_SERVICE)).getRunningTasks(1).get(0).topActivity.getPackageName());
	}

	/**
	 * Ruft die `foreground` Callback Funktion auf.
	 */
	private void invokeForegroundCallback (LocalNotificationOptions options) {
		String function = options.getForeground();

		if (function != null) {
			LocalNotification.webView.sendJavascript(function + "(" + options.getId() + ")");
		}
	}

	/**
	 * Ruft die `background` Callback Funktion auf.
	 */
	private void invokeBackgroundCallback (LocalNotificationOptions options) {
		String function = options.getBackground();

		if (function != null) {
			LocalNotification.webView.sendJavascript(function + "(" + options.getId() + ")");
		}
	}
}