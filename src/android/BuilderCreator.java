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
import de.appplant.cordova.plugin.localnotification.receiver.ClearReceiver;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

import static android.app.PendingIntent.FLAG_UPDATE_CURRENT;
import static de.appplant.cordova.plugin.localnotification.Notification.EXTRA_UPDATE;
import static de.appplant.cordova.plugin.localnotification.Options.LARGE_ICON_TYPE_CIRCLE;

/**
 * Builds a NotificationCompat.Builder from notification options.
 */
public final class BuilderCreator {

    private final Context context;

    // Notification options passed by JS
    private final Options options;

    // To generate unique request codes
    private final Random random = new Random();

    // Additional extras to merge into each intent
    private Bundle intentExtras;

    public BuilderCreator(Notification notification) {
        this.context = notification.getContext();
        this.options = notification.getOptions();
    }

    /**
     * Set extras to merge into each intent
     */
    public BuilderCreator setIntentExtras(Bundle intentExtras) {
        this.intentExtras = intentExtras;
        return this;
    }

    /**
     * Creates a {@link NotificationCompat.Builder} from options
     * @return The builder instance or null if the notification is silent.
     */
    public NotificationCompat.Builder create() {
        // TODO: Does this work, when no builder is created?
        if (options.isSilent()) return null;

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

            // Set sound only, if the notification should not be updated
            if (soundUri != Uri.EMPTY && !(intentExtras != null && intentExtras.getBoolean(EXTRA_UPDATE, false))) {
                // Grant permission to the system to play the sound, needed in Android 7 and 8
                Manager.grantUriPermission(context, soundUri);
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

        Bitmap largeIcon = new AssetUtil(context).getBitmap(options.getAndroidLargeIcon());
        
        if (largeIcon != null) {
            if (options.getAndroidLargeIconType().equals(LARGE_ICON_TYPE_CIRCLE)) {
                largeIcon = AssetUtil.getCircleBitmap(largeIcon);
            }

            builder.setLargeIcon(largeIcon);
        }

        applyStyle(builder);
        addActions(builder);

        // Supply a PendingIntent to send when the notification is cleared by the user directly from the notification panel
        setDeleteIntent(builder);

        // Supply a PendingIntent to send when the notification is clicked
        setContentIntent(builder);

        return builder;
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
     * Supply a PendingIntent to send when the notification is cleared by the user directly
     * from the notification panel. For example, this intent is sent when the user clicks the
     * "Clear all" button, or the individual "X" buttons on notifications.
     * This intent is not sent when the application calls NotificationManager.cancel(int).
     */
    private void setDeleteIntent(NotificationCompat.Builder builder) {
        Intent intent = new Intent(context, ClearReceiver.class)
            .setAction(options.getId().toString())
            .putExtra(Notification.EXTRA_ID, options.getId());

        if (intentExtras != null) intent.putExtras(intentExtras);

        builder.setDeleteIntent(PendingIntent.getBroadcast(
            context, random.nextInt(), intent, PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT));
    }

    /**
     * Supply a PendingIntent to send when the notification is clicked.
     * Will bring the app to foreground.
     */
    private void setContentIntent(NotificationCompat.Builder builder) {
        Intent intent = new Intent(context, ClickHandlerActivity.class)
            .putExtra(Notification.EXTRA_ID, options.getId())
            .putExtra(Action.EXTRA_ID, Action.CLICK_ACTION_ID)
            .putExtra(Options.EXTRA_LAUNCH, options.isLaunch())
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_HISTORY);

        if (intentExtras != null) intent.putExtras(intentExtras);

        builder.setContentIntent(PendingIntent.getActivity(
            context, random.nextInt(), intent, PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT));
    }

    /**
     * Add all actions to the builder if there are any actions.
     */
    private void addActions(NotificationCompat.Builder builder) {
        Action[] actions = options.getActions();
        if (actions == null) return;

        for (Action action : actions) {
            NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(
                action.getIcon(), action.getTitle(), getPendingIntentForAction(action));

            if (action.isWithInput()) {
                actionBuilder.addRemoteInput(action.getInput());
            }

            builder.addAction(actionBuilder.build());
        }
    }

    /**
     * Returns a new PendingIntent for a notification action, including the
     * action's identifier.
     *
     * @param action Notification action needing the PendingIntent
     */
    private PendingIntent getPendingIntentForAction(Action action) {
        Intent intent = new Intent(context, ClickHandlerActivity.class)
                .putExtra(Notification.EXTRA_ID, options.getId())
                .putExtra(Action.EXTRA_ID, action.getId())
                .putExtra(Options.EXTRA_LAUNCH, action.isLaunchingApp())
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_HISTORY);

        if (intentExtras != null) intent.putExtras(intentExtras);

        return PendingIntent.getActivity(context, random.nextInt(), intent, PendingIntent.FLAG_MUTABLE | FLAG_UPDATE_CURRENT);
    }
}
