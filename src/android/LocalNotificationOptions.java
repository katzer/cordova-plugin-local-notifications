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

import org.json.JSONObject;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class LocalNotificationOptions {

    /*
     * Options that can be set when this plugin is invoked
     */
    private Calendar calendar = Calendar.getInstance();
    private String title      = null;
    private String subTitle   = null;
    private String sound      = null;
    private long interval     = 0;
    private String foreground = null;
    private String background = null;
    private int icon          = -1;
    private int badge         = 0;
    private String id         = null;

    /**
     * Parse options passed from javascript part of this plugin.
     */
    public void parse (JSONObject options) {
        String date    = options.optString("date");
        String message = options.optString("message");

        if (!"".equals(date)) {
            calendar.setTimeInMillis(1000*Long.parseLong(date));
        }

        if (!"".equals(message)) {
            String lines[] = message.split("\\r?\\n");

            title = lines[0];

            if (lines.length > 1)
                subTitle = lines[1];
        }

        sound      = options.optString("sound");
        icon       = options.optInt("icon");
        //interval   = options.optString("repeat");
        foreground = options.optString("foreground");
        background = options.optString("background");
        badge      = options.optInt("badge");
        id         = options.optString("id");
    }

    /**
     * Gibt den Kalender mit dem Datum der nächsten Notification an.
     */
    public Calendar getCalendar() {
       return calendar;
    }

    /**
     * Gibt den Titel der Notification an.
     */
    public String getTitle () {
       return title;
    }

    /**
     * Gibt den Untertitel der Notification an.
     */
    public String getSubTitle () {
       return subTitle;
    }

    /**
     * Gibt den Pfad zum Sound der Notification an.
     */
    public String getSound () {
       return sound;
    }

    /**
     * Gibt den Pfad zum Icon der Notification an.
     */
    public int getIcon () {
       return icon;
    }

    /**
     * Gibt den Pfad zur Callback-Funktion der Notification an.
     */
    public String getForeground () {
       return foreground;
    }

    /**
     * Gibt den Pfad zur Callback-Funktion der Notification an.
     */
    public String getBackground () {
       return background;
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
       return badge;
    }

    /**
     * Gibt die Callback-ID des PluginResults an.
     */
    public String getId () {
       return id;
    }
}