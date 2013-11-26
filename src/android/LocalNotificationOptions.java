/**
 *  LocalNotificationOptions.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin.localnotification;

import java.util.Calendar;
import java.util.Date;

import org.json.JSONObject;

import android.app.AlarmManager;
import android.content.Context;
import android.media.RingtoneManager;
import android.net.Uri;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class LocalNotificationOptions {

    /*
     * Options that can be set when this plugin is invoked
     */
    private JSONObject options = new JSONObject();
    private String id          = null;
    private String packageName = null;
    private long interval      = 0;
    private long date          = 0;

    /**
     * Parse options passed from javascript part of this plugin.
     */
    LocalNotificationOptions (JSONObject options) {
        packageName = LocalNotification.cordova.getActivity().getPackageName();

        parse(options);
    }

    /**
     * Parse options passed from javascript part of this plugin.
     */
    LocalNotificationOptions (JSONObject options, Context context) {
        packageName = context.getPackageName();

        parse(options);
    }

    /**
     * Parst die übergebenen Eigenschaften.
     */
    private void parse (JSONObject options) {
        String repeat = options.optString("repeat");

        this.options = options;
        date         = options.optLong("date") * 1000;
        id           = options.optString("id");

        if (repeat.equalsIgnoreCase("daily")) {
            interval = AlarmManager.INTERVAL_DAY;
        } else if (repeat.equalsIgnoreCase("weekly")) {
            interval = AlarmManager.INTERVAL_DAY*7;
        } else if (repeat.equalsIgnoreCase("monthly")) {
            interval = AlarmManager.INTERVAL_DAY*31; // 31 days
        } else if (repeat.equalsIgnoreCase("yearly")) {
            interval = AlarmManager.INTERVAL_DAY*365;
        }
    }

    /**
     * Gibt die Eigenschaften als JSONObjekt an.
     */
    public JSONObject getJSONObject() {
        return options;
    }

    /**
     * Gibt die Zeit in Sekunden an, wann die Notification aufpoppen soll.
     */
    public long getDate() {
        return date;
    }

    /**
     * Gibt die Zeit als Kalender an.
     */
    public Calendar getCalendar () {
        Calendar calendar = Calendar.getInstance();

        calendar.setTime(new Date(getDate()));

        return calendar;
    }

    /**
     * Gibt die Nachricht der Notification an.
     */
    public String getMessage () {
        return options.optString("message");
    }

    /**
     * Gibt den Titel der Notification an.
     */
    public String getTitle () {
        return options.optString("title");
    }

    /**
     * Gibt den Pfad zum Sound der Notification an.
     */
    public Uri getSound () {
        String sound = options.optString("sound", null);

        if (sound != null) {
            try {
                int soundId = (Integer) RingtoneManager.class.getDeclaredField(sound).get(Integer.class);

                return RingtoneManager.getDefaultUri(soundId);
            } catch (Exception e) {
                return Uri.parse(sound);
            }
        }

        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    /**
     * Gibt den Pfad zum Icon der Notification an.
     */
    public int getIcon () {
        int icon        = 0;
        String iconName = options.optString("icon", "icon");

        icon = getIconValue(packageName, iconName);

        if (icon == 0) {
            icon = getIconValue("android", iconName);
        }

        if (icon == 0) {
            icon = android.R.drawable.ic_menu_info_details;
        }

        return options.optInt("icon", icon);
    }

    /**
     * Gibt den Pfad zur Callback-Funktion der Notification an.
     */
    public String getForeground () {
        return options.optString("foreground", null);
    }

    /**
     * Gibt den Pfad zur Callback-Funktion der Notification an.
     */
    public String getBackground () {
        return options.optString("background", null);
    }

    /**
     * Gibt das Intervall an, in dem die Notification aufpoppen soll (daily, weekly, monthly, yearly)
     */
    public long getInterval () {
        return interval;
    }

    /**
     * Gibt die Badge-Nummer der Notification an.
     */
    public int getBadge () {
        return options.optInt("badge", 0);
    }

    /**
     * Gibt die Callback-ID des PluginResults an.
     */
    public String getId () {
        return id;
    }

    /**
     * Gibt den Zahlwert des Icons an.
     *
     * @param {String} className
     * @param {String} iconName
     */
    private int getIconValue (String className, String iconName) {
        int icon = 0;

        try {
            Class<?> klass  = Class.forName(className + ".R$drawable");

            icon = (Integer) klass.getDeclaredField(iconName).get(Integer.class);
        } catch (Exception e) {}

        return icon;
    }
}