/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2024
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

package de.appplant.cordova.plugin.localnotification;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.MessagingStyle;
import androidx.core.app.NotificationCompat.MessagingStyle.Message;
import androidx.core.graphics.drawable.IconCompat;
import android.service.notification.StatusBarNotification;
import android.os.Build;

import java.io.IOException;
import java.util.List;
import java.util.Random;

import de.appplant.cordova.plugin.localnotification.action.Action;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

import static android.app.PendingIntent.FLAG_UPDATE_CURRENT;
import static de.appplant.cordova.plugin.localnotification.Notification.EXTRA_UPDATE;
import static de.appplant.cordova.plugin.localnotification.Options.LARGE_ICON_TYPE_CIRCLE;

/**
 * Builder class for local notifications. Build fully configured local
 * notification specified by JSON object passed from JS side.
 */
public final class Builder {

    // Application context passed by constructor
    private final Context context;

    // Notification options passed by JS
    private final Options options;

    // To generate unique request codes
    private final Random random = new Random();

    // Receiver to handle the clear event
    private Class<?> clearReceiver;

    // Activity to handle the click event
    private Class<?> clickActivity;

    // Additional extras to merge into each intent
    private Bundle extras;

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
     * Set bundle extras.
     *
     * @param extras The bundled extras to merge into.
     */
    public Builder setExtras(Bundle extras) {
        this.extras = extras;
        return this;
    }

    /**
     * Creates the notification with all its options passed through JS.
     *
     * @return The final notification to display.
     */
    public Notification build() {
        // TODO: Does this work, when no builder is created?
        if (options.isSilent()) return new Notification(context, options);

        Bundle extras = new Bundle();
        extras.putInt(Notification.EXTRA_ID, options.getId());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, options.getAndroidChannelId())
            .setExtras(extras)
            .setOnlyAlertOnce(options.isOnlyAlertOnce())
            .setContentTitle(options.getTitle())
            .setContentText(options.getText())
            // Text that summarizes this notification for accessibility services.
            // Since Android 5, this text is no longer shown on screen, but it is
            // still useful to accessibility services (where it serves as an audible announcement
            // of the notification's appearance).
            .setTicker(options.getText())
            // Since Android 8 shows as a badge count for Launchers that support badging
            // prior to 8 it could be shown in the header
            .setNumber(options.getBadgeNumber())
            .setAutoCancel(options.isAndroidAutoCancel())
            .setOngoing(options.isAndroidOngoing())
            .setColor(options.getColor())
            .setVisibility(options.getVisibility())
            // Show the Notification when date
            .setShowWhen(options.isAndroidShowWhen())
            // Show the Notification#when field as a stopwatch. Instead of presenting when as a timestamp,
            // the notification will show an automatically updating display of the minutes and seconds since
            // when
            .setUsesChronometer(options.isAndroidUsesChronometer())
            .setGroup(options.getGroup())
            .setGroupSummary(options.isGroupSummary());

        // Specify the duration in milliseconds after which this notification should be canceled
        if (options.getAndroidTimeoutAfter() >= 0) builder.setTimeoutAfter(options.getAndroidTimeoutAfter());

        // Settings for Android older than 8
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setDefaults(options.getDefaults());
            builder.setPriority(options.getPriorityByImportance());
            builder.setLights(options.getLedColor(), options.getLedOn(), options.getLedOff());

            Uri soundUri = options.getSoundUri();

            if (soundUri != Uri.EMPTY && !isUpdate()) {
                // Grant permission to the system to play the sound, needed in Android 7 and 8
                new Manager(context).grantUriPermission(soundUri);
                builder.setSound(soundUri);
            }
        }

        if (options.getProgressBar() != null) {
            builder.setProgress(
                options.getProgressMaxValue(),
                options.getProgressValue(),
                options.isProgressIndeterminate());
        }

        // Get smallIcon from resources only
        //
        // There exists also a setSmallIcon(IconCompat icon) method, but tested on Android 15, when multiple notifications with the
        // same icon are posted, the app icon will be shown in statusbar instead of the small icon. This does not happen,
        // when using the setSmallIcon(int icon) method.
        builder.setSmallIcon(options.getSmallIcon());

        Bitmap largeIcon = options.getAndroidLargeIcon();
        
        if (largeIcon != null) {
            if (options.getAndroidLargeIconType().equals(LARGE_ICON_TYPE_CIRCLE)) {
                largeIcon = AssetUtil.getCircleBitmap(largeIcon);
            }

            builder.setLargeIcon(largeIcon);
        }

        applyStyle(builder);
        applyActions(builder);
        applyDeleteReceiver(builder);
        applyContentReceiver(builder);

        return new Notification(context, options, builder);
    }

    /**
     * Find out and set the notification style.
     * @param builder Notification builder instance.
     */
    private void applyStyle(NotificationCompat.Builder builder) {
        if (applyMessagingStyle(builder)) return;
        if (applyBigPictureStyle(builder)) return;
        if (applyInboxStyle(builder)) return;
        if (applyBigTextStyle(builder)) return;
    }

    /**
     * Apply messaging style
     * @param builder Notification builder instance
     * @return true if the messaging style was applied
     */
    private boolean applyMessagingStyle(NotificationCompat.Builder builder) {
        Message[] messages = options.getAndroidMessages();
        if (messages == null) return false;

        // Find if there is a notification already displayed with this ID.
        StatusBarNotification activeNotification = new Manager(context).getActiveNotification(options.getId());

        MessagingStyle style = activeNotification != null ?
            // If the notification was already displayed, extract the MessagingStyle to add the message
            MessagingStyle.extractMessagingStyleFromNotification(activeNotification.getNotification()) :
            // No active notification, create a new style
            new NotificationCompat.MessagingStyle("");

        // Add the new messages to the style
        for (Message message : messages) {
            style.addMessage(message);
        }

        String title = options.getTitle();

        // Add the count of messages to the title if there is more than 1.
        Integer messagesCount = style.getMessages().size();

        if (messagesCount > 1 && options.getTitleCount() != null && !options.getTitleCount().trim().isEmpty()) {
            title += " " + options.getTitleCount().replace("%n%", "" + messagesCount);
        }

        style.setConversationTitle(title);

        // Use the style.
        builder.setStyle(style);

        return true; // style applied
    }

    /**
     * Apply big picture style. Only uses the first attachment.
     * @param builder Notification builder instance
     * @return true if the big picture style was applied
     */
    private boolean applyBigPictureStyle(NotificationCompat.Builder builder) {
        List<Bitmap> attachmentsPictures = options.getAttachments();
        if (attachmentsPictures == null || attachmentsPictures.size() == 0) return false;

        builder.setStyle(new NotificationCompat.BigPictureStyle(builder)
            .setSummaryText(options.getSummary() != null ? options.getSummary() : options.getText())
            .bigPicture(attachmentsPictures.get(0))
        );

        return true; // style applied
    }

    /**
     * Apply inbox style
     * @param builder Notification builder instance
     * @return true if the inbox style was applied
     */
    private boolean applyInboxStyle(NotificationCompat.Builder builder) {
        if (!options.getText().contains("\n")) return false;

        NotificationCompat.InboxStyle style = new NotificationCompat.InboxStyle(builder)
            .setSummaryText(options.getSummary());

        for (String line : options.getText().split("\n")) {
            style.addLine(line);
        }

        builder.setStyle(style);
        return true; // style applied
    }

    /**
     * Apply big text style
     * @param builder Notification builder instance
     * @return true if the big text style was applied
     */
    private boolean applyBigTextStyle(NotificationCompat.Builder builder) {
        if (options.getSummary() == null && options.getText().length() < 45) return false;
        builder.setStyle(new NotificationCompat.BigTextStyle(builder)
            .setSummaryText(options.getSummary())
            .bigText(options.getText()));
        return true; // style applied
    }

    /**
     * Set intent to handle the delete event. Will clean up some persisted
     * preferences.
     *
     * @param builder Local notification builder instance.
     */
    private void applyDeleteReceiver(NotificationCompat.Builder builder) {

        if (clearReceiver == null)
            return;

        Intent intent = new Intent(context, clearReceiver)
                .setAction(options.getIdentifier())
                .putExtra(Notification.EXTRA_ID, options.getId());

        if (extras != null) {
            intent.putExtras(extras);
        }

        int reqCode = random.nextInt();

        builder.setDeleteIntent(PendingIntent.getBroadcast(
            context, reqCode, intent, PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT));
    }

    /**
     * Set intent to handle the click event. Will bring the app to
     * foreground.
     *
     * @param builder Local notification builder instance.
     */
    private void applyContentReceiver(NotificationCompat.Builder builder) {
        if (clickActivity == null) return;

        Intent intent = new Intent(context, clickActivity)
            .putExtra(Notification.EXTRA_ID, options.getId())
            .putExtra(Action.EXTRA_ID, Action.CLICK_ACTION_ID)
            .putExtra(Options.EXTRA_LAUNCH, options.isLaunch())
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_HISTORY);

        if (extras != null) {
            intent.putExtras(extras);
        }

        int reqCode = random.nextInt();
        
        builder.setContentIntent(PendingIntent.getActivity(
            context, reqCode, intent, PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT));
    }

    /**
     * Add all actions to the builder if there are any actions.
     *
     * @param builder Local notification builder instance.
     */
    private void applyActions(NotificationCompat.Builder builder) {
        Action[] actions = options.getActions();
        NotificationCompat.Action.Builder btn;

        if (actions == null || actions.length == 0)
            return;

        for (Action action : actions) {
             btn = new NotificationCompat.Action.Builder(
                     action.getIcon(), action.getTitle(),
                     getPendingIntentForAction(action));

            if (action.isWithInput()) {
                btn.addRemoteInput(action.getInput());
            }

            builder.addAction(btn.build());
        }
    }

    /**
     * Returns a new PendingIntent for a notification action, including the
     * action's identifier.
     *
     * @param action Notification action needing the PendingIntent
     */
    private PendingIntent getPendingIntentForAction(Action action) {
        Intent intent = new Intent(context, clickActivity)
                .putExtra(Notification.EXTRA_ID, options.getId())
                .putExtra(Action.EXTRA_ID, action.getId())
                .putExtra(Options.EXTRA_LAUNCH, action.isLaunchingApp())
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_HISTORY);

        if (extras != null) {
            intent.putExtras(extras);
        }

        int reqCode = random.nextInt();

        return PendingIntent.getActivity(context, reqCode, intent, PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT);
    }

    /**
     * If the builder shall build an notification or an updated version.
     *
     * @return true in case of an updated version.
     */
    private boolean isUpdate() {
        return extras != null && extras.getBoolean(EXTRA_UPDATE, false);
    }
}
