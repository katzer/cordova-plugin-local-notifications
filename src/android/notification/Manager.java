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

// codebeat:disable[TOO_MANY_FUNCTIONS]

package de.appplant.cordova.plugin.notification;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.service.notification.StatusBarNotification;
import android.support.v4.app.NotificationManagerCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import de.appplant.cordova.plugin.badge.BadgeImpl;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.M;
import static android.os.Build.VERSION_CODES.O;
import static android.support.v4.app.NotificationCompat.PRIORITY_MIN;
import static android.support.v4.app.NotificationCompat.PRIORITY_LOW;
import static android.support.v4.app.NotificationCompat.PRIORITY_DEFAULT;
import static android.support.v4.app.NotificationCompat.PRIORITY_HIGH;
import static android.support.v4.app.NotificationCompat.PRIORITY_MAX;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_MIN;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_LOW;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_DEFAULT;
import static android.support.v4.app.NotificationManagerCompat.IMPORTANCE_HIGH;
import static de.appplant.cordova.plugin.notification.Notification.PREF_KEY_ID;
import static de.appplant.cordova.plugin.notification.Notification.Type.TRIGGERED;
import de.appplant.cordova.plugin.notification.Options;

/**
 * Central way to access all or single local notifications set by specific
 * state like triggered or scheduled. Offers shortcut ways to schedule,
 * cancel or clear local notifications.
 */
public final class Manager {

    static final String DEFAULT_CHANNEL_ID = "default-channel-id";

    static final String DEFAULT_CHANNEL_DESCRIPTION = "Default channel";

    // The application context
    private Context context;

    /**
     * Constructor
     *
     * @param context Application context
     */
    private Manager(Context context) {
        this.context = context;
        //createDefaultChannel();
    }

    /**
     * Static method to retrieve class instance.
     *
     * @param context Application context
     */
    public static Manager getInstance(Context context) {
        return new Manager(context);
    }

    /**
     * Check if app has local notification permission.
     */
    public boolean hasPermission () {
        return getNotCompMgr().areNotificationsEnabled();
    }

    /**
     * Schedule local notification specified by request.
     *
     * @param request Set of notification options.
     * @param receiver Receiver to handle the trigger event.
     */
    public Notification schedule (Request request, Class<?> receiver) {
        Options options    = request.getOptions();
        Notification toast = new Notification(context, options);

        toast.schedule(request, receiver);

        return toast;
    }

    /**
     * TODO: temporary
     */
    @SuppressLint("WrongConstant")
    public void createChannel(Options options) {
        NotificationManager mgr = getNotMgr();
        int importance = IMPORTANCE_DEFAULT;

        if (SDK_INT < O)
            return;

        NotificationChannel channel = mgr.getNotificationChannel(options.getChannel());

        if (channel != null)
            return;

        switch (options.getPrio()) {
            case PRIORITY_MIN:
                importance = IMPORTANCE_MIN;
                break;
            case PRIORITY_LOW:
                importance = IMPORTANCE_LOW;
                break;
            case PRIORITY_DEFAULT:
                importance = IMPORTANCE_DEFAULT;
                break;
            case PRIORITY_HIGH:
                importance = IMPORTANCE_HIGH;
                break;
            case PRIORITY_MAX:
                importance = IMPORTANCE_HIGH;
                break;
        }

        channel = new NotificationChannel(
                options.getChannel(), options.getChannelDescription(), importance);
		if(!options.isSilent() && importance > IMPORTANCE_DEFAULT) channel.setBypassDnd(true);
		if(!options.isWithoutLights()) channel.enableLights(true);
		if(options.isWithVibration()) {
			channel.enableVibration(true);
		} else {
			channel.setVibrationPattern(new long[]{ 0 });
			channel.enableVibration(true);
		}
		channel.setLightColor(options.getLedColor());
        if(options.isWithoutSound()) {
			channel.setSound(null, null);
		} else {
			AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION).build();
			
			if(options.isWithDefaultSound()) {
				channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), audioAttributes);
			} else {
				channel.setSound(options.getSound(), audioAttributes);
			}
		}

        mgr.createNotificationChannel(channel);
    }

    /**
     * Update local notification specified by ID.
     *
     * @param id       The notification ID.
     * @param updates  JSON object with notification options.
     * @param receiver Receiver to handle the trigger event.
     */
    public Notification update (int id, JSONObject updates, Class<?> receiver) {
        Notification notification = get(id);

        if (notification == null)
            return null;

        notification.update(updates, receiver);

        return notification;
    }

    /**
     * Clear local notification specified by ID.
     *
     * @param id The notification ID.
     */
    public Notification clear (int id) {
        Notification toast = get(id);

        if (toast != null) {
            toast.clear();
        }

        return toast;
    }

    /**
     * Clear all local notifications.
     */
    public void clearAll () {
        List<Notification> toasts = getByType(TRIGGERED);

        for (Notification toast : toasts) {
            toast.clear();
        }

        getNotCompMgr().cancelAll();
        setBadge(0);
    }

    /**
     * Clear local notification specified by ID.
     *
     * @param id The notification ID
     */
    public Notification cancel (int id) {
        Notification toast = get(id);

        if (toast != null) {
            toast.cancel();
        }

        return toast;
    }

    /**
     * Cancel all local notifications.
     */
    public void cancelAll () {
        List<Notification> notifications = getAll();

        for (Notification notification : notifications) {
            notification.cancel();
        }

        getNotCompMgr().cancelAll();
        setBadge(0);
    }

    /**
     * All local notifications IDs.
     */
    public List<Integer> getIds() {
        Set<String> keys = getPrefs().getAll().keySet();
        List<Integer> ids = new ArrayList<Integer>();

        for (String key : keys) {
            try {
                ids.add(Integer.parseInt(key));
            } catch (NumberFormatException e) {
                e.printStackTrace();
            }
        }

        return ids;
    }

    /**
     * All local notification IDs for given type.
     *
     * @param type The notification life cycle type
     */
    public List<Integer> getIdsByType(Notification.Type type) {

        if (type == Notification.Type.ALL)
            return getIds();

        StatusBarNotification[] activeToasts = getActiveNotifications();
        List<Integer> activeIds              = new ArrayList<Integer>();

        for (StatusBarNotification toast : activeToasts) {
            activeIds.add(toast.getId());
        }

        if (type == TRIGGERED)
            return activeIds;

        List<Integer> ids = getIds();
        ids.removeAll(activeIds);

        return ids;
    }

    /**
     * List of local notifications with matching ID.
     *
     * @param ids Set of notification IDs.
     */
    private List<Notification> getByIds(List<Integer> ids) {
        List<Notification> toasts = new ArrayList<Notification>();

        for (int id : ids) {
            Notification toast = get(id);

            if (toast != null) {
                toasts.add(toast);
            }
        }

        return toasts;
    }

    /**
     * List of all local notification.
     */
    public List<Notification> getAll() {
        return getByIds(getIds());
    }

    /**
     * List of local notifications from given type.
     *
     * @param type The notification life cycle type
     */
    private List<Notification> getByType(Notification.Type type) {

        if (type == Notification.Type.ALL)
            return getAll();

        List<Integer> ids = getIdsByType(type);

        return getByIds(ids);
    }

    /**
     * List of properties from all local notifications.
     */
    public List<JSONObject> getOptions() {
        return getOptionsById(getIds());
    }

    /**
     * List of properties from local notifications with matching ID.
     *
     * @param ids Set of notification IDs
     */
    public List<JSONObject> getOptionsById(List<Integer> ids) {
        List<JSONObject> toasts = new ArrayList<JSONObject>();

        for (int id : ids) {
            Options options = getOptions(id);

            if (options != null) {
                toasts.add(options.getDict());
            }
        }

        return toasts;
    }

    /**
     * List of properties from all local notifications from given type.
     *
     * @param type
     *      The notification life cycle type
     */
    public List<JSONObject> getOptionsByType(Notification.Type type) {
        ArrayList<JSONObject> options = new ArrayList<JSONObject>();
        List<Notification> notifications = getByType(type);

        for (Notification notification : notifications) {
            options.add(notification.getOptions().getDict());
        }

        return options;
    }

    /**
     * Get local notification options.
     *
     * @param id Notification ID.
     *
     * @return null if could not found.
     */
    public Options getOptions(int id) {
        SharedPreferences prefs = getPrefs();
        String toastId          = Integer.toString(id);

        if (!prefs.contains(toastId))
            return null;

        try {
            String json     = prefs.getString(toastId, null);
            JSONObject dict = new JSONObject(json);

            return new Options(context, dict);
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Get existent local notification.
     *
     * @param id Notification ID.
     *
     * @return null if could not found.
     */
    public Notification get(int id) {
        Options options = getOptions(id);

        if (options == null)
            return null;

        return new Notification(context, options);
    }

    /**
     * Set the badge number of the app icon.
     *
     * @param badge The badge number.
     */
    public void setBadge (int badge) {
        if (badge == 0) {
            new BadgeImpl(context).clearBadge();
        } else {
            new BadgeImpl(context).setBadge(badge);
        }
    }

    /**
     * Get all active status bar notifications.
     */
    StatusBarNotification[] getActiveNotifications() {
        if (SDK_INT >= M) {
            return getNotMgr().getActiveNotifications();
        } else {
            return new StatusBarNotification[0];
        }
    }

    /**
     * Shared private preferences for the application.
     */
    private SharedPreferences getPrefs () {
        return context.getSharedPreferences(PREF_KEY_ID, Context.MODE_PRIVATE);
    }

    /**
     * Notification manager for the application.
     */
    private NotificationManager getNotMgr() {
        return (NotificationManager) context.getSystemService(
                Context.NOTIFICATION_SERVICE);
    }

    /**
     * Notification compat manager for the application.
     */
    public NotificationManagerCompat getNotCompMgr() {
        return NotificationManagerCompat.from(context);
    }
}

// codebeat:enable[TOO_MANY_FUNCTIONS]
