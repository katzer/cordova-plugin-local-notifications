/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

package de.appplant.cordova.plugin.notification;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.support.v4.app.NotificationCompat;

import java.util.Random;

import de.appplant.cordova.plugin.notification.activity.ClickActivity;
import de.appplant.cordova.plugin.notification.receiver.ClearReceiver;

/**
 * Builder class for local notifications. Build fully configured local
 * notification specified by JSON object passed from JS side.
 */
public class Builder {

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    // Receiver to handle the clear event
    private Class<?> clearReceiver = ClearReceiver.class;

    // Activity to handle the click event
    private Class<?> clickActivity = ClickActivity.class;

    /**
     * Constructor
     *
     * @param options Notification options
     */
    public Builder(Options options) {
        this.context = options.getContext();
        this.options = options;
    }

    /**
     * Set clear receiver.
     *
     * @param receiver Broadcast receiver for the clear event.
     */
    public Builder setClearReceiver(Class<?> receiver) {
        this.clearReceiver = receiver;
        return this;
    }

    /**
     * Set click activity.
     *
     * @param activity The activity to handler the click event.
     */
    public Builder setClickActivity(Class<?> activity) {
        this.clickActivity = activity;
        return this;
    }

    /**
     * Creates the notification with all its options passed through JS.
     *
     * @return The final notification to display.
     */
    public Notification build() {
        int smallIcon = options.getSmallIcon();
        NotificationCompat.Builder builder;

        builder = new NotificationCompat.Builder(context, "group")
                .setDefaults(options.getDefaults())
                .setContentTitle(options.getTitle())
                .setContentText(options.getText())
                .setNumber(options.getBadgeNumber())
                .setAutoCancel(options.isAutoClear())
                .setOngoing(options.isSticky())
                .setColor(options.getColor())
                .setSound(options.getSound())
                .setVisibility(options.getVisibility())
                .setPriority(options.getPriority())
                .setShowWhen(options.getShowWhen())
                .setUsesChronometer(options.isWithProgressBar())
                .setLights(options.getLedColor(), options.getLedOn(), options.getLedOff());

        if (options.isWithProgressBar()) {
            builder.setProgress(
                    options.getProgressMaxValue(),
                    options.getProgressValue(),
                    options.isIndeterminateProgress());
        }

        if (smallIcon != 0) {
            builder.setSmallIcon(smallIcon);
            builder.setLargeIcon(options.getLargeIcon());
        } else {
            builder.setSmallIcon(options.getIcon());
        }

        applyStyle(builder);
        applyDeleteReceiver(builder);
        applyContentReceiver(builder);

        return new Notification(context, options, builder);
    }

    /**
     * Find out and set the notification style.
     *
     * @param builder Local notification builder instance
     */
    private void applyStyle(NotificationCompat.Builder builder) {
        String summary = options.getSummary();
        String text    = options.getText();

        if (summary == null && text == null)
            return;

        if (text.contains("\n")) {
            NotificationCompat.InboxStyle style =
                    new NotificationCompat.InboxStyle(builder)
                            .setBigContentTitle(options.getTitle());

            if (summary != null) {
                style.setSummaryText(summary);
            }

            for (String line : text.split("\n")) {
                style.addLine(line);
            }

            builder.setStyle(style);
            return;
        }

        if (summary == null && text.length() < 45)
            return;

        NotificationCompat.BigTextStyle style =
                new NotificationCompat.BigTextStyle(builder)
                        .setBigContentTitle(options.getTitle())
                        .bigText(text);

        if (summary != null) {
            style.setSummaryText(summary);
        }

        builder.setStyle(style);
    }

    /**
     * Set intent to handle the delete event. Will clean up some persisted
     * preferences.
     *
     * @param builder Local notification builder instance
     */
    private void applyDeleteReceiver(NotificationCompat.Builder builder) {

        if (clearReceiver == null)
            return;

        Intent intent = new Intent(context, clearReceiver)
                .setAction(options.getIdentifier())
                .putExtra(Options.EXTRA, options.toString());

        PendingIntent deleteIntent = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        builder.setDeleteIntent(deleteIntent);
    }

    /**
     * Set intent to handle the click event. Will bring the app to
     * foreground.
     *
     * @param builder Local notification builder instance
     */
    private void applyContentReceiver(NotificationCompat.Builder builder) {

        if (clickActivity == null)
            return;

        Intent intent = new Intent(context, clickActivity)
                .putExtra(Options.EXTRA, options.toString())
                .setFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);

        int reqCode = new Random().nextInt();

        PendingIntent contentIntent = PendingIntent.getActivity(
                context, reqCode, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        builder.setContentIntent(contentIntent);
    }

}
