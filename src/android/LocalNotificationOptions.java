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
    private Calendar calender     = Calendar.getInstance();
    private String title          = "";
    private String subTitle       = "";
    private String ticker         = "";
    private boolean repeatDaily   = false;
    private String notificationId = "";

    /**
     * Parse options passed from javascript part of this plugin.
     */
    public void parse (JSONObject options) {
	    // Parse string representing the date
        String date    = options.optString("date");
        String message = options.optString("message");

	    if (!"".equals(date)) {
    		String[] dateParts = date.split("/");

            int month = Integer.parseInt(dateParts[0]);
            int day   = Integer.parseInt(dateParts[1]);
            int year  = Integer.parseInt(dateParts[2]);
            int hour  = Integer.parseInt(dateParts[3]);
            int min   = Integer.parseInt(dateParts[4]);

    		calender.set(year, month, day, hour, min);
	    }

	    if (!"".equals(message)) {
    		String lines[] = message.split("\\r?\\n");

    		title = lines[0];

    		if (lines.length > 1)
    		    subTitle = lines[1];
	    }

        ticker         = options.optString("ticker");
        repeatDaily    = options.optBoolean("repeatDaily");
        notificationId = options.optString("id");
    }

    /**
     * Gibt den Kalender mit dem Datum der nächsten Notification an.
     */
    public Calendar getCalender() {
	   return calender;
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
     * Gibt den Ticker der Notification an.
     */
    public String getTicker () {
	   return ticker;
    }

    public boolean isRepeatDaily () {
	   return repeatDaily;
    }

    /**
     * Gibt die Callback-ID des PluginResults an.
     */
    public String getNotificationId () {
	   return notificationId;
    }
}