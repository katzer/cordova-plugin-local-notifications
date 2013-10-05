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

import android.annotation.TargetApi;
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
@TargetApi(Build.VERSION_CODES.JELLY_BEAN)
public class LocalNotificationReceiver extends BroadcastReceiver {

	public static final String OPTIONS = "LOCAL_NOTIFICATION_OPTIONS";

	@Override
	public void onReceive (Context context, Intent intent) {
		NotificationManager notificationMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
		LocalNotificationOptions options    = null;
		Bundle bundle                       = intent.getExtras();
		int id                              = 0;
		JSONObject args;

		try {
			args    = new JSONObject(bundle.getString(OPTIONS));
			options = new LocalNotificationOptions(args);
		} catch (JSONException e) {}

		try {
			id = Integer.parseInt(options.getId());
		} catch (Exception e) {}

		/*
		 * If you set a repeating alarm at 11:00 in the morning and it
		 * should trigger every morning at 08:00 o'clock, it will
		 * immediately fire. E.g. Android tries to make up for the
		 * 'forgotten' reminder for that day. Therefore we ignore the event
		 * if Android tries to 'catch up'.
		 */
		if (options.getInterval() > 0) {
			Calendar now    = Calendar.getInstance();
			Calendar alarm  = options.getCalendar();

			int alarmHour   = alarm.get(Calendar.HOUR_OF_DAY);
			int alarmMin    = alarm.get(Calendar.MINUTE);
			int currentHour = now.get(Calendar.HOUR_OF_DAY);
			int currentMin  = now.get(Calendar.MINUTE);

			if (currentHour != alarmHour && currentMin != alarmMin) {
				return;
			}
		} else {
			LocalNotification.unpersist(options.getId());
		};

		String packageName          = context.getPackageName();
		Intent launchIntent         = context.getPackageManager().getLaunchIntentForPackage(packageName);
		PendingIntent contentIntent = PendingIntent.getActivity(context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);

		Builder notification = new Notification.Builder(context)
		.setContentTitle(options.getTitle())
		.setContentText(options.getSubTitle())
		.setNumber(options.getBadge())
		.setContentIntent(contentIntent)
		.setTicker(options.getTitle())
		.setSmallIcon(options.getIcon());

		try {
			if (!context.getPackageName().equalsIgnoreCase(((ActivityManager)context.getSystemService(Context.ACTIVITY_SERVICE)).getRunningTasks(1).get(0).topActivity.getPackageName())) {
				// app is in background
				notification.setDefaults(Notification.DEFAULT_SOUND);
			}
		} catch (Exception e) {
			// missing GET_TASKS permission
			notification.setDefaults(Notification.DEFAULT_SOUND);
		}

		/*
		 * If you want all reminders to stay in the notification bar, you should
		 * generate a random ID. If you want do replace an existing
		 * notification, make sure the ID below matches the ID that you store in
		 * the alarm intent.
		 */
		notificationMgr.notify(id, notification.build());
	}
}