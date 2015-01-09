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

package de.appplant.cordova.plugin.localnotification;

import java.util.Calendar;
import java.util.ArrayList;
import java.util.Random;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationCompat.*;
import android.support.v4.app.RemoteInput;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

/**
 * The alarm receiver is triggered when a scheduled alarm is fired. This class
 * reads the information in the intent and displays this information in the
 * Android notification bar. The notification uses the default notification
 * sound and it vibrates the phone.
 */
public class Receiver extends BroadcastReceiver {

    public static final String OPTIONS = "LOCAL_NOTIFICATION_OPTIONS";
    public static final String VOICE_REPLY = "voice_reply";

    private Context context;
    private Options options;

    @Override
    public void onReceive (Context context, Intent intent) {
        Options options = null;
        Bundle bundle   = intent.getExtras();
        JSONObject args;

        try {
            args    = new JSONObject(bundle.getString(OPTIONS));
            options = new Options(context).parse(args);
        } catch (JSONException e) {
            return;
        }

        this.context = context;
        this.options = options;

        // The context may got lost if the app was not running before
        LocalNotification.setContext(context);

        fireTriggerEvent();

        if (options.getInterval() == 0) {
        } else if (isFirstAlarmInFuture()) {
            return;
        } else {
            LocalNotification.add(options.moveDate(), false);
        }
        if (!LocalNotification.isInBackground && options.getForegroundMode()){
        	if (options.getInterval() == 0) {
        		LocalNotification.unpersist(options.getId());
        	}
        	LocalNotification.showNotification(options.getTitle(), options.getMessage());
        	fireTriggerEvent();
        } else {
        	Builder notification = buildNotification();

        	showNotification(notification);
        }
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
     * Creates the notification.
     */
    @SuppressLint("NewApi")
    private Builder buildNotification () {
        Uri sound = options.getSound();
        
        //DeleteIntent is called when the user clears a notification manually
        Intent deleteIntent = new Intent(context, DeleteIntentReceiver.class)
        	.setAction("" + options.getId())
        	.putExtra(Receiver.OPTIONS, options.getJSONObject().toString());
        PendingIntent dpi = PendingIntent.getBroadcast(context, 0, deleteIntent, PendingIntent.FLAG_CANCEL_CURRENT);
        
        Builder notification = new NotificationCompat.Builder(context)
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
        String [] sa = {options.getJSONObject().toString(), "defaultAction"};
        Intent intent = new Intent(context, ReceiverActivity.class)
                //.putExtra(OPTIONS, options.getJSONObject().toString())
                .putExtra(OPTIONS, sa)
                .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

        int requestCode = new Random().nextInt();
        PendingIntent contentIntent = PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        try {
            JSONArray actions = options.getJSONObject().getJSONArray("actions");
            Intent intentA;
            PendingIntent contentIntentA;
            WearableExtender wearableExtender = new WearableExtender();

            for(int i =0; i< actions.length(); i++) {
                JSONObject action = actions.getJSONObject(i);
                String title = action.getString("title");
                String icon = action.getString("icon");
                String type = action.optString("type");
                sa[1] = title;
                intentA = new Intent(context, ReceiverActivity.class)
                        .putExtra(OPTIONS, sa)
                        .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

                requestCode = new Random().nextInt();
                contentIntentA = PendingIntent.getActivity(context, requestCode, intentA, PendingIntent.FLAG_CANCEL_CURRENT);
                if(type.equals("") || type.equalsIgnoreCase("handheld") || type.equalsIgnoreCase("all")) { // add the action button for the handheld
                    notification.addAction(options.getIconValue(context.getPackageName(), icon), title, contentIntentA);
                    // Note: If there's not at least one wearable action, all action buttons will be shown on both handheld and wearable
                }
                if(type.equals("") || type.equalsIgnoreCase("wearable") || type.equalsIgnoreCase("all")) {  // add the action button for wearable
                    NotificationCompat.Action.Builder actionBuilder = new Action.Builder(options.getIconValue(context.getPackageName(), icon), title, contentIntentA);
                    JSONObject voice = action.optJSONObject("voice");
                    if(voice != null) {
                        String replyLabel = voice.optString("label");
                        RemoteInput.Builder remoteInputBuilder = new RemoteInput.Builder(VOICE_REPLY).setLabel(replyLabel); // set label
                        JSONArray choices = voice.optJSONArray("choices");
                        if(choices.length()>0) {
                            ArrayList<String> aList = new ArrayList<String>();
                            for(int j=0; j<choices.length(); j++)
                                aList.add(choices.optString(j));
                            String[] stArray = aList.toArray(new String[choices.length()]);
                            remoteInputBuilder.setChoices(stArray);  // set choices
                            boolean freeForm = voice.optBoolean("freeform", true);
                            remoteInputBuilder.setAllowFreeFormInput(freeForm);
                        }
                        actionBuilder.addRemoteInput(remoteInputBuilder.build());
                    }
                    wearableExtender.addAction(actionBuilder.build());
                }
            }
            notification.extend(wearableExtender);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return notification.setContentIntent(contentIntent);
    }

    /**
     * Shows the notification
     */
    @SuppressWarnings("deprecation")
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
     * Fires ontrigger event.
     */
    private void fireTriggerEvent () {
        LocalNotification.fireEvent("trigger", options.getId(), options.getJSON());
    }
}
