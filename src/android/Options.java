/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2024,2025
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

import android.app.AlarmManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.MessagingStyle;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.OptionsTrigger;
import de.appplant.cordova.plugin.localnotification.action.Action;
import de.appplant.cordova.plugin.localnotification.action.ActionGroup;
import de.appplant.cordova.plugin.localnotification.util.AssetUtil;

/**
 * Wrapper around the JSON object passed through JS which contains all
 * possible option values. Class provides simple readers and more advanced
 * methods to convert independent values into platform specific values.
 */
public final class Options {

    private static final String TAG = "Options";

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

        // Workaround: Correct properties in Java instead in JavaScript
        // when the app was updated. {@link RestoreReceiver} will be called
        // and there is no WebView at this point because no Activity will be started.
        try {
            // Check meta.version
            JSONObject meta = options.getJSONObject("meta");
            String metaVersion = meta.getString("version");

            // Update properties for older versions
            if (isVersionOlder(metaVersion, "1.1.0")) convertPropertiesForVersion110(options);
            if (isVersionOlder(metaVersion, "1.1.1")) convertPropertiesForVersion111(options);
            if (isVersionOlder(metaVersion, "1.1.8")) convertPropertiesForVersion118(options);

            // Update meta.version to current plugin version
            if (!metaVersion.equals("1.2.3")) {
                meta.put("version", "1.2.3");
                options.put("meta", meta);
            }
        } catch (JSONException exception) {
            Log.e(TAG, "Could not convert properties for current plugin version", exception);
        }

        this.options = options;
        this.assetUtil = new AssetUtil(context);
    }

    /**
     * Converts properties for version 1.1.0. There have been some properties renamed.
     * This removes old properties and sets it under the new name.
     */
    public void convertPropertiesForVersion110(JSONObject options) throws JSONException {
        Log.d(TAG, "Converting properties for version 1.1.0");
        
        // autoClear to androidAutoCancel
        if (options.has("autoClear")) {
            options.put("androidAutoCancel", options.opt("autoClear"));
            options.remove("autoClear");
        }

        // badge to badgeNumber
        if (options.has("badge")) {
            options.put("badgeNumber", options.opt("badge"));
            options.remove("badge");
        }

        // description to androidChannelDescription
        if (options.has("description")) {
            options.put("androidChannelDescription", options.opt("description"));
            options.remove("description");
        }

        // channelDescription to androidChannelDescription
        if (options.has("channelDescription")) {
            options.put("androidChannelDescription", options.opt("channelDescription"));
            options.remove("channelDescription");
        }

        // channelId to androidChannelId
        if (options.has("channelId")) {
            options.put("androidChannelId", options.opt("channelId"));
            options.remove("channelId");
        }

        // importance to androidChannelImportance
        if (options.has("importance")) {
            options.put("androidChannelImportance", options.opt("importance"));
            options.remove("importance");
        }

        // channelImportance to androidChannelImportance
        if (options.has("channelImportance")) {
            options.put("androidChannelImportance", options.opt("channelImportance"));
            options.remove("channelImportance");
        }

        // channelName to androidChannelName
        if (options.has("channelName")) {
            options.put("androidChannelName", options.opt("channelName"));
            options.remove("channelName");
        }

        // clock to androidShowWhen or androidUsesChronometer
        if (options.has("clock")) {
            // Can be boolean or string
            Object clock = options.opt("clock");

            // clock: boolean to androidShowWhen: boolean
            if (clock instanceof Boolean) {
                options.put("androidShowWhen", clock);

                // clock: 'chronometer' to androidUsesChronometer: true
            } else if (clock instanceof String) {
                options.put("androidUsesChronometer", (String) clock == "chronometer");
            }

            options.remove("clock");
        }

        // color to androidColor
        if (options.has("color")) {
            options.put("androidColor", options.opt("color"));
            options.remove("color");
        }

        // defaults to androidDefaults
        if (options.has("defaults")) {
            options.put("androidDefaults", options.opt("defaults"));
            options.remove("defaults");
        }

        // group to androidGroup
        if (options.has("group")) {
            options.put("androidGroup", options.opt("group"));
            options.remove("group");
        }

        // groupSummary to androidGroupSummary
        if (options.has("groupSummary")) {
            options.put("androidGroupSummary", options.opt("groupSummary"));
            options.remove("groupSummary");
        }

        // icon to androidLargeIcon
        if (options.has("icon")) {
            options.put("androidLargeIcon", options.opt("icon"));
            options.remove("icon");
        }

        // iconType to androidLargeIconType
        if (options.has("iconType")) {
            options.put("androidLargeIconType", options.opt("iconType"));
            options.remove("iconType");
        }

        // lockscreen to androidLockscreen
        if (options.has("lockscreen")) {
            options.put("androidLockscreen", options.opt("lockscreen"));
            options.remove("lockscreen");
        }

        // onlyAlertOnce to androidOnlyAlertOnce
        if (options.has("onlyAlertOnce")) {
            options.put("androidOnlyAlertOnce", options.opt("onlyAlertOnce"));
            options.remove("onlyAlertOnce");
        }

        // progressBar to androidProgressBar
        if (options.has("progressBar")) {
            JSONObject progressBar = options.optJSONObject("progressBar");

            if (progressBar != null) {
                // In plugin version prior to 1.1.0 a progressBar object was always set with enabled: false
                // Only set if property enabled does not exists or is true
                if (!progressBar.has("enabled") || progressBar.optBoolean("enabled")) {
                    // Remove enabled property
                    progressBar.remove("enabled");
                    options.put("androidProgressBar", progressBar);
                }
            }

            options.remove("progressBar");
        }

        // smallIcon to androidSmallIcon
        if (options.has("smallIcon")) {
            options.put("androidSmallIcon", options.opt("smallIcon"));
            options.remove("smallIcon");
        }

        // sticky to androidOngoing
        if (options.has("sticky")) {
            options.put("androidOngoing", options.opt("sticky"));
            options.remove("sticky");
        }

        // ongoing to androidOngoing
        if (options.has("ongoing")) {
            options.put("androidOngoing", options.opt("ongoing"));
            options.remove("ongoing");
        }

        // sound boolean to sound string
        // sound: true to sound: 'default'
        // sound: false to sound: null
        if (options.opt("sound") instanceof Boolean) {
            options.put("sound", (Boolean) options.opt("sound") ? "default" : null);
        }

        // soundUsage to androidChannelSoundUsage
        if (options.has("soundUsage")) {
            options.put("androidChannelSoundUsage", options.opt("soundUsage"));
            options.remove("soundUsage");
        }

        // summary to androidSummary
        if (options.has("summary")) {
            options.put("androidSummary", options.opt("summary"));
            options.remove("summary");
        }

        // text Array to androidMessages
        if (options.optJSONArray("text") != null) {
            options.put("androidMessages", options.opt("text"));
            options.remove("text");
        }

        // timeoutAfter to androidMessages
        if (options.has("timeoutAfter")) {
            options.put("androidTimeoutAfter", options.opt("timeoutAfter"));
            options.remove("timeoutAfter");
        }

        // titleCount to androidTitleCount
        if (options.has("titleCount")) {
            options.put("androidTitleCount", options.opt("titleCount"));
            options.remove("titleCount");
        }

        // wakeup to androidWakeUpScreen
        if (options.has("wakeup")) {
            options.put("androidWakeUpScreen", options.opt("wakeup"));
            options.remove("wakeup");
        }
    }

    /**
     *  Converts properties for version 1.1.0
     */
    public void convertPropertiesForVersion111(JSONObject options) throws JSONException {
        Log.d(TAG, "Converting properties for version 1.1.1");

        // vibrate to androidChannelEnableVibration
        if (options.has("vibrate")) {
            options.put("androidChannelEnableVibration", options.opt("vibrate"));
            options.remove("vibrate");
        }
    }

    /**
     *  Converts properties for version 1.1.8
     */
    public void convertPropertiesForVersion118(JSONObject options) throws JSONException {
        Log.d(TAG, "Converting properties for version 1.1.8");

        // Ensure, there is minimum a trigger.at otherwise it would schedule notifications endless
        JSONObject trigger = options.getJSONObject("trigger");

        if (!trigger.has("at") && !trigger.has("in") && !trigger.has("every")) {
            trigger.put("at", new Date().getTime());
        }
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
    public JSONObject getJSON() {
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
     * Badge number for the notification. 0 hides the badge number, -1 leaves the badge number unchanged.
     * Defaults to 1 if not set.
     */
    public int getBadgeNumber() {
        return options.optInt("badgeNumber", 1);
    }

    /**
     * Set whether this is an "ongoing" notification. Ongoing notifications cannot be dismissed by the user
     * on locked devices, or by notification listeners, and some notifications (call, device management, media)
     * cannot be dismissed on unlocked devices, so your application or service must take care of canceling them.
     * They are typically used to indicate a background task that the user is actively engaged with
     * (e.g., playing music) or is pending in some way and therefore occupying the device
     * (e.g., a file download, sync operation, active network connection).
     * 
     * Defaults to false if not set.
     */
    public Boolean isAndroidOngoing() {
        return options.optBoolean("androidOngoing", false);
    }

    /**
     * Make this notification automatically dismissed when the user touches it.
     * Defaults to true if not set.
     */
    Boolean isAndroidAutoCancel() {
        return options.optBoolean("androidAutoCancel", true);
    }

    /**
     * Gets the trigger property as an Object.
     */
    public OptionsTrigger getOptionsTrigger() {
        return new OptionsTrigger(getTriggerJSON());
    }

    public JSONObject getTriggerJSON() {
        return options.optJSONObject("trigger");
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
     * 
     * Defaults to null if not set.
     */
    String getGroup() {
        return options.optString("androidGroup", null);
    }

    /**
     * Set this notification to be the group summary for a group of notifications.
     * Grouped notifications may display in a cluster or stack on devices which
     * support such rendering. Requires a group key also be set using setGroup(String).
     * The group summary may be suppressed if too few notifications are included in the group.
     * 
     * Defaults to false if not set.
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
     * 
     * Defaults to 0 if not set.
     */
    long getAndroidTimeoutAfter() {
        return options.optLong("androidTimeoutAfter", 0);
    }

    /**
     * Since Android 8. The channel id of that notification.
     * Defaults to 'default_channel' if not set.
     */
    public String getAndroidChannelId() {
        return options.optString("androidChannelId", "default_channel");
    }

    /**
     * Since Android 8.
     * Defaults to 'Default channel' if not set.
     * @return
     */
    String getAndroidChannelName() {
        return options.optString("androidChannelName", "Default channel");
    }

    /**
     * Since Android 8. The importance of a notification.
     * Defaults to {@link NotificationManagerCompat.IMPORTANCE_DEFAULT} if not set.
     * @return
     */
    int getAndroidChannelImportance() {
        return options.optInt("androidChannelImportance", NotificationManagerCompat.IMPORTANCE_DEFAULT);
    }

    /**
     * Channel description. Only for Android 8 and higher.
     * Defaults to null if not set.
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
            title = context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
        }

        return title;
    }

    /**
     * The notification background color for the small icon.
     * Defaults to {@link NotificationCompat.COLOR_DEFAULT} if not set or invalid.
     */
    public int getColor() {
        String androidColor = options.optString("androidColor", null);
        
        if (androidColor == null) return NotificationCompat.COLOR_DEFAULT;

        try {
            // Remove leading hash from hex, convert to int, add alpha channel
            return Integer.parseInt(hexWithoutHash(androidColor), 16) + 0xFF000000;
        } catch (NumberFormatException exception) {
            Log.e(TAG, "Could not parse androidColor hex to int: " + androidColor, exception);
            return NotificationCompat.COLOR_DEFAULT;
        }
    }

    /**
     * Since Android 8, this sets the sound of a notification channel.
     * Prior to Android 8, this sets the sound directly of a notification.
     * 
     * Defaults to 'default' if not set, which represents the default notification sound.
     */
    String getSound() {
        return options.optString("sound", "default");
    }

    /**
     * Sound file path for the local notification.
     * @return Uri of the sound file or {@link Uri.EMPTY} if not set.
     */
    public Uri getSoundUri() {
        String soundName = getSound();

        if (soundName == null || soundName.isEmpty()) return Uri.EMPTY;

        if (soundName.equals("default")) {
            return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        } else {
            return assetUtil.getUri(soundName, AssetUtil.RESOURCE_TYPE_RAW);
        }
    }

    /**
     * The sound usage for the notification.
     * Defaults to {@link AudioAttributes.USAGE_NOTIFICATION} if not set.
     */
    int getSoundUsage() {
        return options.optInt("androidChannelSoundUsage", AudioAttributes.USAGE_NOTIFICATION);
    }

    /**
     * Defaults to null if not set.
     */
    public String getAndroidLargeIcon() {
        return options.optString("androidLargeIcon", null);
    }

    /**
     * Type of the large icon.
     * Defaults to {@link #LARGE_ICON_TYPE_SQUARE} if not set.
     */
    public String getAndroidLargeIconType() {
        return options.optString("androidLargeIconType", LARGE_ICON_TYPE_SQUARE);
    }

    /**
     * Gets the small icon resource, which will be used to represent the notification in the status bar.
     * The platform template for the expanded view will draw this icon in the left, unless a large icon
     * has also been specified, in which case the small icon will be moved to the right-hand side.
     * 
     * Defaults to 'ic_popup_reminder' if not set, or wrongly set.
     */
    int getSmallIcon() {
        String smallIconPath = options.optString("androidSmallIcon");

        // Try to get the resource from the app resources or system resources
        int resId = assetUtil.getResourceId(smallIconPath, AssetUtil.RESOURCE_TYPE_DRAWABLE);

        // Log error, if no icon is found and fallback to a system icon, which should exists
        if (resId == 0) {
            Log.e(TAG, "androidSmallIcon not found, using system icon 'ic_popup_reminder', androidSmallIcon=" + smallIconPath);
            // Fallback to a system icon, which should exists
            resId = assetUtil.getResourceId("ic_popup_reminder", AssetUtil.RESOURCE_TYPE_DRAWABLE);
        }

        return resId;
    }

    /**
     * Defaults to false if not set.
     */
    boolean isAndroidChannelEnableVibration() {
        return options.optBoolean("androidChannelEnableVibration", false);
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
            return Integer.parseInt(hexWithoutHash(hex), 16) + 0xFF000000;
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
     * Only for Android 7. Defaults for notification, which are bitwise or linked:
     * {@link NotificationCompat.DEFAULT_SOUND},
     * {@link NotificationCompat.DEFAULT_VIBRATE},
     * {@link NotificationCompat.DEFAULT_LIGHTS}.
     */
    int getDefaults() {
        int defaults = options.optInt("androidDefaults");

        if (isAndroidChannelEnableVibration()) {
            defaults |= NotificationCompat.DEFAULT_VIBRATE;
        } else {
            defaults &= NotificationCompat.DEFAULT_VIBRATE;
        }

        if (getSound() == null) {
            defaults |= NotificationCompat.DEFAULT_SOUND;

            // No default sound
        } else {
            defaults &= NotificationCompat.DEFAULT_SOUND;
        }

        if (getLed() == null) {
            defaults |= NotificationCompat.DEFAULT_LIGHTS;

            // No default led
        } else {
            defaults &= NotificationCompat.DEFAULT_LIGHTS;
        }

        return defaults;
    }

    /**
     * Gets the visibility for the notification.
     * Defaults to {@link NotificationCompat.VISIBILITY_PUBLIC} if not set.
     * @return {@link NotificationCompat.VISIBILITY_PUBLIC} or {@link NotificationCompat.VISIBILITY_SECRET}
     */
    int getVisibility() {
        return options.optBoolean("androidLockscreen", true) ? NotificationCompat.VISIBILITY_PUBLIC : NotificationCompat.VISIBILITY_SECRET;
    }

    /**
     * For Android 7 backward compatibility. Gets the notifications priority
     * based on {@link #getAndroidChannelImportance()}
     */
    int getPriorityByImportance() {
        switch(getAndroidChannelImportance()){
            case NotificationManagerCompat.IMPORTANCE_NONE: // 0
            case NotificationManagerCompat.IMPORTANCE_MIN: // 1
                return NotificationCompat.PRIORITY_MIN;

            case NotificationManagerCompat.IMPORTANCE_LOW: // 2
                return NotificationCompat.PRIORITY_LOW;

            case NotificationManagerCompat.IMPORTANCE_DEFAULT: // 3
                return NotificationCompat.PRIORITY_DEFAULT;

            case NotificationManagerCompat.IMPORTANCE_HIGH: // 4
            case NotificationManagerCompat.IMPORTANCE_MAX: // 5
                return NotificationCompat.PRIORITY_MAX;
        }

        return NotificationCompat.PRIORITY_DEFAULT;
    }

    /**
     * If the Notification should show the when date.
     * Defaults to true.
     */
    boolean isAndroidShowWhen() {
        return options.optBoolean("androidShowWhen", true);
    }

    /**
     * Show the Notification#when field as a stopwatch. Instead of presenting when as a timestamp,
     * the notification will show an automatically updating display of the minutes and seconds since
     * when. Useful when showing an elapsed time (like an ongoing phone call). The counter can also
     * be set to count down to when when using setChronometerCountDown(boolean).
     * 
     * Defaults to false if not set.
     */
    boolean isAndroidUsesChronometer() {
        return options.optBoolean("androidUsesChronometer", false);
    }

    /**
     * If the notification shall display a progress bar.
     * Defaults to null if not set.
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
     * 
     * Defaults to null if not set.
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

        List<Bitmap> bitmaps = new ArrayList<Bitmap>();

        for (int index = 0; index < attachments.length(); index++) {
            Bitmap assetBitmap = assetUtil.getBitmap(attachments.optString(index));

            if (assetBitmap == null) continue;

            // Only use the first attachment
            bitmaps.add(assetBitmap);
            break;
        }

        return bitmaps;
    }

    /**
     * Gets the actions group id or null if not set.
     */
    public ActionGroup getActionsGroup() {
        return ActionGroup.get(context, options.optString("actions", null));
    }

    /**
     * Gets the list of messages to display.
     * @return null if there are no messages
     */
    MessagingStyle.Message[] getAndroidMessages() {
        JSONArray messagesJSONArray = options.optJSONArray("androidMessages");

        // Nothing is set
        if (messagesJSONArray == null) return null;

        MessagingStyle.Message[] messages = new MessagingStyle.Message[messagesJSONArray.length()];

        for (int i = 0; i < messages.length; i++) {
            JSONObject messageJSON = messagesJSONArray.optJSONObject(i);

            // Use person icon if available
            Bitmap personBitmap = assetUtil.getBitmap(messageJSON.optString("personIcon", null));
            IconCompat personIcon = personBitmap != null ? IconCompat.createWithBitmap(AssetUtil.getCircleBitmap(personBitmap)) : null;

            messages[i] = new MessagingStyle.Message(
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
     * if there is more than one. Only used if using {@link NotificationCompat.MessagingStyle}.
     * 
     * Defaults to null if not set.
     */
    String getTitleCount() {
        return options.optString("androidTitleCount", null);
    }

    /**
     * If the notification shall only alert once.
     * Defaults to false if not set.
     */
    public boolean isOnlyAlertOnce(){
        return options.optBoolean("androidOnlyAlertOnce", false);
    }

    /**
     * Defaults to {@link AlarmManager.RTC_WAKEUP} if not set.
     */
    public int getAndroidAlarmType() {
        return options.optInt("androidAlarmType", AlarmManager.RTC_WAKEUP);
    }

    public boolean isAndroidAllowWhileIdle() {
        return options.optBoolean("androidAllowWhileIdle", false);
    }

    /**
     * If the display should be turned on when the notification is triggered.
     * Defaults to true if not set.
     */
    public boolean isAndroidWakeUpScreen() {
        return options.optBoolean("androidWakeUpScreen", true);
    }

    /**
     * @return Returns the hex code without a leading #
     */
    private String hexWithoutHash(String hex) {
        return (hex.charAt(0) == '#') ? hex.substring(1) : hex;
    }

    /**
     * Converts a version string to a comparable int. The version
     * must have two or three digits separated by dots.
     * Pre-release identifiers like "-dev" or "-beta" will be removed before.
     * 
     * The calculation of the int will be as follows:
     * MAJOR * 10000 + MINOR * 100 + PATCH
     * 
     * Examples:
     * - 1.1.1-dev to 10101
     * - 1.2.1-dev to 10201
     * - 0.9-beta.3 to 903
     *
     * Version calculation taken from:
     * https://cordova.apache.org/docs/en/12.x-2025.01/guide/platforms/android/index.html#setting-the-version-code
     *
     * @param version
     * @return
     */
    public static int versionStringToInt(String version) {
        // Remove pre-release identifiers -dev and -beta, split by dot
        String[] parts = version.replaceAll("-dev|-beta", "").split("\\.");

        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);
        // Optional patch version
        int patch = parts.length > 2 ? Integer.parseInt(parts[2]) : 0;

        return major * 10000 + minor * 100 + patch;
    }

    /**
     * Compares two version strings. The strings will be converted to int and
     * compared by {@link Integer#compare(int, int)}.
     * @param version1
     * @param version2
     * @return -1 if version1 is older than version2, 0 if they are equal and 1 if
     * version1 is newer than version2.
     */
    public static int compareVersion(String version1, String version2) {
        return Integer.compare(versionStringToInt(version1), versionStringToInt(version2));
    }

    /**
     * Compares two version strings.
     * @param version1
     * @param version2
     * @return true if version1 is older than version2.
     */
    public static boolean isVersionOlder(String version1, String version2) {
        return compareVersion(version1, version2) < 0;
    }
}