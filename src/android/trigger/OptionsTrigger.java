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

package de.appplant.cordova.plugin.localnotification.trigger;

import android.util.Log;
import java.util.Calendar;
import java.util.Date;
import org.json.JSONObject;

import de.appplant.cordova.plugin.localnotification.Options;

public abstract class OptionsTrigger {

    public static final String TAG = "OptionsTrigger";
    
    Options options;
    JSONObject triggerJSON;

    int occurrence = 0;

    /**
     * The base date from where to calculate the next trigger
     */
    Date baseDate;

    /**
     * trigger date calculated by {@link #getNextTriggerDate()}
     */
    Date triggerDate;

    /**
     * @param options Notification options
     */
    public OptionsTrigger(Options options) {
        this.options = options;
        this.triggerJSON = options.getTriggerJSON();
        // Set the base date from where to calculate the next trigger
        // This can be set by config or is set to the current date
        this.baseDate = getFirstTriggerFromConfig() > 0 ? new Date(getFirstTriggerFromConfig()) : new Date();
    }

    /**
     * Only for repeating triggers, when the first trigger should occur by config.
     * @return 0 if there is nothing set in the config
     */
    private long getFirstTriggerFromConfig() {
        if (triggerJSON.has("at")) return getTriggerFirstAt();
        if (triggerJSON.has("after")) return getTriggerAfter();
        return 0;
    }

    public abstract boolean isLastOccurrence();

    /**
     * Calculates the next trigger. Can return null if there's no next trigger.
     * @param baseCalendar The base calendar from where to calculate the next trigger.
     */
    public abstract Date calculateNextTrigger(Calendar baseCalendar);

    /**
     * Gets the next trigger date.
     * @param base The date from where to calculate the trigger date.
     * @return null if there's none next trigger date.
     */
    public Date getNextTriggerDate() {
        // Use last trigger date as base date for calculating the next trigger
        if (triggerDate != null) baseDate = triggerDate;

        // Clear the last trigger date, so it's reflecting the current status of this date trigger
        triggerDate = null;

        // All occurrences have been run through
        if (isLastOccurrence()) return null;

        Date nextTriggerDate = calculateNextTrigger(dateToCalendar(baseDate));

        Log.d(TAG, "Next trigger date: " + nextTriggerDate + ", notificaitonId=" + options.getId());
        
        if (nextTriggerDate == null) return null;

        // Count occurrence
        occurrence++;

        // Remember trigger date
        triggerDate = nextTriggerDate;

        return nextTriggerDate;
    }

    /**
     * Restores the state of the trigger, when the notification is loaded from the SharedPreferences
     * @param occurrence
     * @param baseDate
     * @param triggerDate
     */
    public void restoreState(int occurrence, Date baseDate, Date triggerDate) {
        this.occurrence = occurrence;
        this.baseDate = baseDate;
        this.triggerDate = triggerDate;
    }

    public Date getTriggerDate() {
        return triggerDate;
    }

    public Date getBaseDate() {
        return baseDate;
    }

    /**
     * The value of the occurrence.
     */
    public int getOccurrence() {
        return occurrence;
    }

    /**
     * Converts a {@link Date} to {@link Calendar}.
     */
    Calendar dateToCalendar(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar;
    }

    public long getTriggerAt() {
        return triggerJSON.optLong("at", 0);
    }

    public int getTriggerIn() {
        return triggerJSON.optInt("in", 0);
    }

    public String getTriggerUnit() {
        return triggerJSON.optString("unit", null);
    }

    /**
     * Only for repeating notifications, when the first notification should be triggered.
     */
    public long getTriggerFirstAt() {
        return triggerJSON.optLong("firstAt", 0);
    }

    /**
     * Only for repeating notifications, when the first notification should be triggered.
     */
    public long getTriggerAfter() {
        return triggerJSON.optLong("after", 0);
    }

    /**
     * If a repeating notification should be stopped after some occurrences. -1 means infinite.
     * @return
     */
    public int getTriggerCount() {
        return triggerJSON.optInt("count", -1);
    }

    /**
     * Gets trigger.every as string. If trigger.every is an object, it returns null
     */
    public String getTriggerEveryAsString() {
        return triggerJSON.opt("every") instanceof String ? triggerJSON.optString("every") : null;
    }

    /**
     * Gets trigger.every as object. If trigger.every is a String, it returns null
     */
    public JSONObject getTriggerEveryAsObject() {
        return triggerJSON.optJSONObject("every");
    }

    public long getTriggerBefore() {
        return triggerJSON.optLong("before", 0);
    }

    /**
     * Checks if the trigger date is within the trigger before option, if present
     */
    public boolean isWithinTriggerbefore(Calendar calendar) {
        // Return true, if there is no trigger before option, otherwise compare against it
        return !triggerJSON.has("before") || calendar.getTimeInMillis() < getTriggerBefore();
    }

    /**
     * If it's a repeating notification. It must not be endless, when it has a count property.
     */
    public boolean isRepeating() {
        return triggerJSON.has("every");
    }

    /**
     * If the trigger shall be infinite.
     */
    public boolean isRepeatingInfinite() {
        return isRepeating() && !triggerJSON.has("count");
    }
}