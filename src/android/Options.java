/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package de.appplant.cordova.plugin.localnotification;

import java.util.Calendar;
import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.AlarmManager;
import android.content.Context;
import android.media.RingtoneManager;
import android.net.Uri;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class Options {

    private JSONObject options = new JSONObject();
    private String packageName = null;
    private long interval      = 0;

    Options (Activity activity) {
        packageName = activity.getPackageName();
    }

    Options (Context context) {
        packageName = context.getPackageName();
    }

    /**
     * Parst die übergebenen Eigenschaften.
     */
    public Options parse (JSONObject options) {
        String repeat = options.optString("repeat");

        this.options = options;

        if (repeat.equalsIgnoreCase("hourly")) {
            interval = AlarmManager.INTERVAL_HOUR;
        } if (repeat.equalsIgnoreCase("daily")) {
            interval = AlarmManager.INTERVAL_DAY;
        } else if (repeat.equalsIgnoreCase("weekly")) {
            interval = AlarmManager.INTERVAL_DAY*7;
        } else if (repeat.equalsIgnoreCase("monthly")) {
            interval = AlarmManager.INTERVAL_DAY*31; // 31 days
        } else if (repeat.equalsIgnoreCase("yearly")) {
            interval = AlarmManager.INTERVAL_DAY*365;
        } else {
            try {
                interval = Integer.parseInt(repeat) * 60000;
            } catch (Exception e) {};
        }

        return this;
    }

    /**
     * Setzt die neue Zeit an Hand des Intervalls.
     */
    public Options moveDate () {
        try {
            options.put("date", (getDate() + interval) / 1000);
        } catch (JSONException e) {}

        return this;
    }

    /**
     * Gibt die Eigenschaften als JSONObjekt an.
     */
    public JSONObject getJSONObject() {
        return options;
    }

    /**
     * Gibt die Zeit in Millisekunden an, wann die Notification aufpoppen soll.
     */
    public long getDate() {
        return options.optLong("date", 0) * 1000;
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
        return options.optString("message", "");
    }

    /**
     * Gibt den Titel der Notification an.
     */
    public String getTitle () {
        return options.optString("title", "");
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
     * Gibt den ID Code des Bildes an.
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
     * Gibt den ID Code des kleinen Bildes an.
     */
    public int getSmallIcon () {
        int resId       = 0;
        String iconName = options.optString("smallIcon", "");

        resId = getIconValue(packageName, iconName);

        if (resId == 0) {
            resId = getIconValue("android", iconName);
        }

        if (resId == 0) {
            resId = getIcon();
        }

        return options.optInt("smallIcon", resId);
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
        return options.optString("id", "0");
    }

    /**
     * Gibt an, ob die Notification automatisch geschlossen werden soll, wenn der Benutzer darauf klickt.
     */
    public Boolean getAutoCancel () {
        return options.optBoolean("autoCancel", false);
    }

    /*
        If we want to display the android notification as a bigview
     */
    public String getBigView () {
        return options.optString("bigview");
    }

    /**
     *
     */
    public Boolean getOngoing () {
        return options.optBoolean("ongoing", false);
    }

    /**
     * Gibt die zusätzlichen Daten als String an.
     */
    public String getJSON () {
        return options.optString("json", "");
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
