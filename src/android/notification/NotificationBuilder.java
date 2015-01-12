/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
package de.appplant.cordova.plugin.notification;

import java.util.Random;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationCompat.Builder;

public class NotificationBuilder {
	private Options options;
	private Context context;
	private Builder notification;
	private final String OPTIONS;
	private Class<?> deleteIntentReceiver;
	private Class<?> receiverActivity;
	
	/**
	 * Constructor of NotificationBuilder
	 * @param options
	 * @param context
	 * @param OPTIONS
	 * @param deleteIntentReceiver
	 * @param receiverActivity
	 */
	public NotificationBuilder(Options options,Context context, String OPTIONS,	
			Class<?> deleteIntentReceiver, Class<?> receiverActivity){
		this.options = options;
		this.context = context;
		this.OPTIONS = OPTIONS;
		this.deleteIntentReceiver = deleteIntentReceiver;
		this.receiverActivity = receiverActivity;
		}
	
    /**
     * Creates the notification.
     */
    @SuppressLint("NewApi")
    public Builder buildNotification () {
        Uri sound = options.getSound();
        
        //DeleteIntent is called when the user clears a notification manually
        Intent deleteIntent = new Intent(context, deleteIntentReceiver)
        	.setAction("" + options.getId())
        	.putExtra(OPTIONS, options.getJSONObject().toString());
        PendingIntent dpi = PendingIntent.getBroadcast(context, 0, deleteIntent, PendingIntent.FLAG_CANCEL_CURRENT);
        
        notification = new NotificationCompat.Builder(context)
            .setDefaults(0) // Do not inherit any defaults
            .setContentTitle(options.getTitle())
            .setContentText(options.getMessage())
            .setNumber(options.getBadge())
            .setTicker(options.getMessage())
            .setSmallIcon(options.getSmallIcon())
            .setLargeIcon(options.getIcon())
            .setAutoCancel(options.getAutoCancel())
            .setOngoing(options.getOngoing())
            .setLights(options.getColor(), 500, 500)
            .setDeleteIntent(dpi);

        if (sound != null) {
            notification.setSound(sound);
        }

        if (Build.VERSION.SDK_INT > 16) {
            notification.setStyle(new NotificationCompat.BigTextStyle()
                .bigText(options.getMessage()));
        }

        setClickEvent(notification);
        
        return notification;
    }

    /**
     * Adds an onclick handler to the notification
     */
    private Builder setClickEvent (Builder notification) {
        Intent intent = new Intent(context, receiverActivity)
            .putExtra(OPTIONS, options.getJSONObject().toString())
            .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

        int requestCode = new Random().nextInt();

        PendingIntent contentIntent = PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        return notification.setContentIntent(contentIntent);
    }
	
}
