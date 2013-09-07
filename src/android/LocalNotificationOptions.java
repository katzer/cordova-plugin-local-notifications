/**
 *  LocalNotificationOptions.java
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 31/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

package de.appplant.cordova.plugin;

import java.util.Calendar;
import java.util.Date;

import org.json.JSONObject;

import android.R;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class LocalNotificationOptions {

    /*
     * Options that can be set when this plugin is invoked
     */
    private JSONObject options = new JSONObject();
    private String id          = null;
    private long interval      = 0;
    private long date          = 0;

    /**
     * Parse options passed from javascript part of this plugin.
     */
    LocalNotificationOptions (JSONObject options) {
        this.options = options;
        date         = options.optLong("date") * 1000;
        //interval   = options.optString("repeat");
        id           = options.optString("id");
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
        return getMessage().split("\\r?\\n")[0];
    }

    /**
     * Gibt den Untertitel der Notification an.
     */
    public String getSubTitle () {
        String[] lines = getMessage().split("\\r?\\n");

        return (lines.length > 1) ? lines[1] : "";
    }

    /**
     * Gibt den Pfad zum Sound der Notification an.
     */
    public String getSound () {
        return options.optString("sound", null);
    }

    /**
     * Gibt den Pfad zum Icon der Notification an.
     */
    public int getIcon () {
        return options.optInt("icon", R.drawable.ic_menu_info_details);
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
}