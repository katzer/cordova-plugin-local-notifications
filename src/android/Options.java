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

// codebeat:disable[TOO_MANY_FUNCTIONS]

package de.appplant.cordova.plugin.localnotification;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.media.AudioAttributes;
import android.media.RingtoneManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.MessagingStyle.Message;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.action.Action;
import de.appplant.cordova.plugin.localnotification.action.ActionGroup;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

import static android.app.AlarmManager.RTC_WAKEUP;
import static androidx.core.app.NotificationCompat.DEFAULT_LIGHTS;
import static androidx.core.app.NotificationCompat.DEFAULT_SOUND;
import static androidx.core.app.NotificationCompat.DEFAULT_VIBRATE;
import static androidx.core.app.NotificationCompat.PRIORITY_MIN;
import static androidx.core.app.NotificationCompat.PRIORITY_LOW;
import static androidx.core.app.NotificationCompat.PRIORITY_DEFAULT;
import static androidx.core.app.NotificationCompat.PRIORITY_MAX;
import static androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC;
import static androidx.core.app.NotificationCompat.VISIBILITY_SECRET;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_NONE;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_MIN;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_LOW;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_DEFAULT;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_HIGH;
import static androidx.core.app.NotificationManagerCompat.IMPORTANCE_MAX;

/**
 * Wrapper around the JSON object passed through JS which contains all
 * possible option values. Class provides simple readers and more advanced
 * methods to convert independent values into platform specific values.
 */
public final class Options {

    // Key name for bundled launch extra
    public static final String EXTRA_LAUNCH = "NOTIFICATION_LAUNCH";

    public static final String LARGE_ICON_TYPE_SQUARE = "square";
    public static final String LARGE_ICON_TYPE_CIRCLE = "circle";

    // The original JSON object
    private final JSONObject options;

    // The application context
    private final Context context;

    // Asset util instance
    private final AssetUtil assetUtil;

    /**
     * Constructor
     *
     * @param context The application context.
     * @param options The options dict map.
     */
    public Options(Context context, JSONObject options) {
        this.context = context;
        this.options = options;
        this.assetUtil = new AssetUtil(context);
    }

    /**
     * Application context.
     */
    public Context getContext () {
        return context;
    }

    /**
     * Wrapped JSON object.
     */
    public JSONObject getDict() {
        return options;
    }

    /**
     * JSON object as string.
     */
    public String toString() {
        return options.toString();
    }

    /**
     * Gets the ID for the local notification.
     *
     * @return 0 if the user did not specify.
     */
    public Integer getId() {
        return options.optInt("id");
    }

    /**
     * The identifier for the local notification.
     *
     * @return The notification ID as the string
     */
    String getIdentifier() {
        return getId().toString();
    }

    /**
     * Badge number for the notification
     * 0 hides the badge number, -1 leaves the badge number unchanged
     */
    public int getBadgeNumber() {
        return options.optInt("badgeNumber");
    }

    /**
     * Set whether this is an "ongoing" notification. Ongoing notifications cannot be dismissed by the user
     * on locked devices, or by notification listeners, and some notifications (call, device management, media)
     * cannot be dismissed on unlocked devices, so your application or service must take care of canceling them.
     * They are typically used to indicate a background task that the user is actively engaged with
     * (e.g., playing music) or is pending in some way and therefore occupying the device
     * (e.g., a file download, sync operation, active network connection).
     */
    public Boolean isAndroidOngoing() {
        return options.optBoolean("androidOngoing", false);
    }

    /**
     * Make this notification automatically dismissed when the user touches it.
     */
    Boolean isAndroidAutoCancel() {
        return options.optBoolean("androidAutoCancel", false);
    }

    /**
     * Gets the raw trigger spec as provided by the user.
     */
    public JSONObject getTrigger() {
        return options.optJSONObject("trigger");
    }

    /**
     * If the trigger shall be infinite.
     */
    public boolean isInfiniteTrigger() {
        return getTrigger().has("every") && getTrigger().optInt("count", -1) < 0;
    }

    /**
     * Gets the value of the silent flag.
     */
    boolean isSilent() {
        return options.optBoolean("silent", false);
    }

    /**
     * Set this notification to be part of a group of notifications sharing the same key.
     * Grouped notifications may display in a cluster or stack on devices which support such rendering.
     * To make this notification the summary for its group, also call setGroupSummary(boolean).
     * A sort order can be specified for group members by using setSortKey(String).
     */
    String getGroup() {
        return options.optString("androidGroup", null);
    }

    /**
     * Set this notification to be the group summary for a group of notifications.
     * Grouped notifications may display in a cluster or stack on devices which
     * support such rendering. Requires a group key also be set using setGroup(String).
     * The group summary may be suppressed if too few notifications are included in the group.
     */
    boolean isGroupSummary() {
        return options.optBoolean("androidGroupSummary", false);
    }

    /**
     * Should a click on the notification launch the app.
     */
    boolean isLaunch() {
        return options.optBoolean("launch", true);
    }

    /**
     * Specifies a duration in milliseconds after which this notification should be canceled,
     * if it is not already canceled.
     */
    long getAndroidTimeoutAfter() {
        return options.optLong("androidTimeoutAfter", 0);
    }

    /**
     * Since Android 8. The channel id of that notification.
     */
    String getAndroidChannelId() {
        return options.optString("androidChannelId", "default_channel");
    }

    /**
     * Since Android 8
     * @return
     */
    String getAndroidChannelName() {
        return options.optString("androidChannelName", "Default channel");
    }

    /**
     * Since Android 8
     * @return
     */
    int getImportance() {
        return options.optInt("androidChannelImportance", IMPORTANCE_DEFAULT);
    }

    /**
     * Since Android 8. Channel description.
     * @return
     */
    String getAndroidChannelDescription() {
        return options.optString("androidChannelDescription", null);
    }

    /**
     * Text for the notification.
     */
    public String getText() {
        return options.optString("text", "");
    }

    /**
     * Title for the local notification. If empty, the app name will be used.
     */
    public String getTitle() {
        String title = options.optString("title", "");

        if (title.isEmpty()) {
            title = context.getApplicationInfo().loadLabel(
                    context.getPackageManager()).toString();
        }

        return title;
    }

    /**
     * The notification background color for the small icon.
     *
     * @return null, if no color is given.
     */
    public int getColor() {
        String hex = options.optString("androidColor", null);

        if (hex == null) return NotificationCompat.COLOR_DEFAULT;

        try {
            hex = stripHex(hex);

            // Matches a field in Color.class like BLACK, BLUE, etc.
            if (hex.matches("[^0-9]*")) {
                return Color.class
                        .getDeclaredField(hex.toUpperCase())
                        .getInt(null);
            }

            int aRGB = Integer.parseInt(hex, 16);
            return aRGB + 0xFF000000;
        } catch (NumberFormatException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }

        return NotificationCompat.COLOR_DEFAULT;
    }

    String getSound() {
        return options.optString("sound", null);
    }

    /**
     * Sound file path for the local notification.
     */
    Uri getSoundUri() {
        String soundName = getSound();

        if (soundName == null || soundName.isEmpty()) return Uri.EMPTY;

        if (soundName.equals("default")) {
            return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        } else {
            return assetUtil.getUri(soundName, AssetUtil.RESOURCE_TYPE_RAW);
        }
    }

    int getSoundUsage() {
        return options.optInt("androidChannelSoundUsage", AudioAttributes.USAGE_NOTIFICATION);
    }

    Bitmap getAndroidLargeIcon() {
        String largeIconPath = options.optString("androidLargeIcon", null);
        if (largeIconPath == null) return null;

        try {
            return assetUtil.getIconFromUri(assetUtil.getUri(largeIconPath, AssetUtil.RESOURCE_TYPE_DRAWABLE));
        } catch (Exception e){
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Type of the large icon.
     */
    String getAndroidLargeIconType() {
        return options.optString("androidLargeIconType", LARGE_ICON_TYPE_SQUARE);
    }

    /**
     * Gets the small icon resource, which will be used to represent the notification in the status bar.
     * The platform template for the expanded view will draw this icon in the left, unless a large icon
     * has also been specified, in which case the small icon will be moved to the right-hand side.
     */
    int getSmallIcon() {
        String smallIconPath = options.optString("androidSmallIcon");

        // Try to get the resource from the app resources or system resources
        int resId = assetUtil.getResourceId(smallIconPath, AssetUtil.RESOURCE_TYPE_DRAWABLE);

        // Fallback to a system icon, which should exists
        if (resId == 0) resId = assetUtil.getResourceId("ic_popup_reminder", AssetUtil.RESOURCE_TYPE_DRAWABLE);

        return resId;
    }

    boolean isVibrate() {
        return options.optBoolean("vibrate", false);
    }

    /**
     * Only prior to Android 8. Can be a Hex-String like `#FF00FF` or
     * `{color: '#FF00FF', on: 500, off: 500}' and sets the led of a notification.
     */
    Object getLed() {
        return options.opt("led");
    }

    /**
     * Only prior to Android 8. The notification color for LED.
     */
    int getLedColor() {
        String hex = null;

        if (getLed() instanceof String) hex = (String) getLed();
        if (getLed() instanceof JSONArray) hex = ((JSONArray) getLed()).optString(0);
        if (getLed() instanceof JSONObject) hex = ((JSONObject) getLed()).optString("color");

        if (hex == null) return 0;

        try {
            return Integer.parseInt(stripHex(hex), 16) + 0xFF000000;
        } catch (NumberFormatException e) {
            e.printStackTrace();
        }

        return 0;
    }

    /**
     * Only prior to Android 8.
     */
    int getLedOn() {
        int defaultValue = 1000;

        if (getLed() instanceof JSONArray) return ((JSONArray) getLed()).optInt(1, defaultValue);
        if (getLed() instanceof JSONObject) return ((JSONObject) getLed()).optInt("on", defaultValue);

        return defaultValue;
    }

    /**
     * Only prior to Android 8.
     */
    int getLedOff() {
        int defaultValue = 1000;

        if (getLed() instanceof JSONArray) return ((JSONArray) getLed()).optInt(2, defaultValue);
        if (getLed() instanceof JSONObject) return ((JSONObject) getLed()).optInt("off", defaultValue);

        return defaultValue;
    }

    /**
     * Only since Android 8. Sets whether notifications posted to a channel
     * should display notification lights, on devices that support that feature.
     */
    boolean getAndroidChannelEnableLights() {
        return options.optBoolean("androidChannelEnableLights", false);
    }

    /**
     * Only for Android older than 8.
     * Set the default notification options that will be used.
     * The value should be one or more of the following fields combined with
     * bitwise-or: DEFAULT_SOUND, DEFAULT_VIBRATE, DEFAULT_LIGHTS.
     */
    int getDefaults() {
        int defaults = options.optInt("androidDefaults");

        if (isVibrate()) {
            defaults |= DEFAULT_VIBRATE;
        } else {
            defaults &= DEFAULT_VIBRATE;
        }

        if (getSound() == null) {
            defaults |= DEFAULT_SOUND;

            // No default sound
        } else {
            defaults &= DEFAULT_SOUND;
        }

        if (getLed() == null) {
            defaults |= DEFAULT_LIGHTS;

            // No default led
        } else {
            defaults &= DEFAULT_LIGHTS;
        }

        return defaults;
    }

    /**
     * Gets the visibility for the notification.
     *
     * @return VISIBILITY_PUBLIC or VISIBILITY_SECRET
     */
    int getVisibility() {
        if (options.optBoolean("androidLockscreen", true)) {
            return VISIBILITY_PUBLIC;
        } else {
            return VISIBILITY_SECRET;
        }
    }

    /**
     * For Android 7 backward compatibility. Gets the notifications priority
     * based on {@link #getImportance()}
     */
    int getPriorityByImportance() {
        switch(getImportance()){
            case IMPORTANCE_NONE: // 0
                return PRIORITY_MIN;

            case IMPORTANCE_MIN: // 1
                return PRIORITY_MIN;

            case IMPORTANCE_LOW: // 2
                return PRIORITY_LOW;

            case IMPORTANCE_DEFAULT: // 3
                return PRIORITY_DEFAULT;

            case IMPORTANCE_MAX: // 5
                return PRIORITY_MAX;
        }

        return PRIORITY_DEFAULT;
    }

    /**
     * If the Notification should show the when date.
     */
    boolean isAndroidShowWhen() {
        return options.optBoolean("androidShowWhen", true);
    }

    /**
     * Show the Notification#when field as a stopwatch. Instead of presenting when as a timestamp,
     * the notification will show an automatically updating display of the minutes and seconds since
     * when. Useful when showing an elapsed time (like an ongoing phone call). The counter can also
     * be set to count down to when when using setChronometerCountDown(boolean).
     */
    boolean isAndroidUsesChronometer() {
        return options.optBoolean("androidUsesChronometer", false);
    }

    /**
     * If the notification shall display a progress bar.
     */
    JSONObject getProgressBar() {
        return options.optJSONObject("androidProgressBar");
    }

    /**
     * Gets the progress value.
     *
     * @return 0 by default.
     */
    int getProgressValue() {
        return getProgressBar().optInt("value", 0);
    }

    /**
     * Gets the progress value.
     *
     * @return 100 by default.
     */
    int getProgressMaxValue() {
        return getProgressBar().optInt("maxValue", 100);
    }

    /**
     * Gets the progress indeterminate value.
     * @return false by default.
     */
    boolean isProgressIndeterminate() {
        return getProgressBar().optBoolean("indeterminate", false);
    }

    /**
     * The summary for
     * - NotificationCompat.InboxStyle
     * - NotificationCompat.BigPictureStyle
     * - NotificationCompat.BigTextStyle
     */
    String getSummary() {
        return options.optString("androidSummary", null);
    }

    /**
     * Image attachments for image style notifications. Only returns the first item,
     * as Android does not support multiple attachments like iOS.
     * @return null if there are no attachments.
     */
    List<Bitmap> getAttachments() {
        JSONArray attachments = options.optJSONArray("attachments");
        if (attachments == null) return null;

        List<Bitmap> pics = new ArrayList<Bitmap>();

        for (int attachmentIndex = 0; attachmentIndex < attachments.length(); attachmentIndex++) {
            Uri assetUri = assetUtil.getUri(attachments.optString(attachmentIndex), AssetUtil.RESOURCE_TYPE_DRAWABLE);

            if (assetUri == Uri.EMPTY) continue;

            try {
                pics.add(assetUtil.getIconFromUri(assetUri));
                // Only use the first pic
                break;
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return pics;
    }

    /**
     * Gets the list of actions to display.
     */
    Action[] getActions() {
        Object value      = options.opt("actions");
        String groupId    = null;
        JSONArray actions = null;
        ActionGroup group = null;

        if (value instanceof String) {
            groupId = (String) value;
        } else
        if (value instanceof JSONArray) {
            actions = (JSONArray) value;
        }

        if (groupId != null) {
            group = ActionGroup.lookup(groupId);
        } else
        if (actions != null && actions.length() > 0) {
            group = ActionGroup.parse(context, actions);
        }

        return (group != null) ? group.getActions() : null;
    }

    /**
     * Gets the list of messages to display. Only returns something, if option text is filled
     * with a JSONArray. If it is filled with a String, the method will return null.
     *
     * @return null if there are no messages, or option text contains a String.
     */
    Message[] getAndroidMessages() {
        JSONArray messagesJSONArray = options.optJSONArray("androidMessages");
        if (messagesJSONArray == null) return null;

        Message[] messages = new Message[messagesJSONArray.length()];

        for (int i = 0; i < messages.length; i++) {
            JSONObject messageJSON = messagesJSONArray.optJSONObject(i);
            String personIconString = messageJSON.optString("personIcon", null);

            IconCompat personIcon = null;

            if (personIconString != null) {
                try {
                    personIcon = IconCompat.createWithBitmap(
                        AssetUtil.getCircleBitmap(assetUtil.getIconFromUri(assetUtil.getUri(personIconString, AssetUtil.RESOURCE_TYPE_DRAWABLE))));
                } catch (Exception e){
                    e.printStackTrace();
                }
            }

            messages[i] = new Message(
                messageJSON.optString("message"),
                messageJSON.optLong("date", System.currentTimeMillis()),
                new Person.Builder()
                    .setName(messageJSON.optString("person", null))
                    .setIcon(personIcon).build()
            );
        }

        return messages;
    }

    /**
     * Additional text added to the title for displaying the number of messages
     * if there is more than one. Only used if using MessagingStyle.
     */
    String getTitleCount() {
        return options.optString("androidTitleCount");
    }

    /**
     * Gets if the notification shall only alert once.
     *
     * @return true if the notification shall only alert once.
     */
    public boolean isOnlyAlertOnce(){
        return options.optBoolean("androidOnlyAlertOnce", false);
    }

    /**
     * Strips the hex code #FF00FF => FF00FF
     *
     * @param hex The hex code to strip.
     *
     * @return The stripped hex code without a leading #
     */
    private String stripHex(String hex) {
        return (hex.charAt(0) == '#') ? hex.substring(1) : hex;
    }

    public int getAndroidAlarmType() {
        return options.optInt("androidAlarmType", RTC_WAKEUP);
    }

    public boolean isAndroidAllowWhileIdle() {
        return options.optBoolean("androidAllowWhileIdle", false);
    }

    public boolean isAndroidWakeUpScreen() {
        return options.optBoolean("androidWakeUpScreen", true);
    }
}

// codebeat:enable[TOO_MANY_FUNCTIONS]
