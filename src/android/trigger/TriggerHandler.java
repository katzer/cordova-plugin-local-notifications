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
import de.appplant.cordova.plugin.localnotification.OptionsTrigger;

public abstract class TriggerHandler {

    public static final String TAG = "TriggerHandler";

    Options options;
    
    /** Helper for trigger property */
    OptionsTrigger optionsTrigger;

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
    public TriggerHandler(Options options) {
        this.options = options;
        this.optionsTrigger = options.getOptionsTrigger();
        // Set the base date from where to calculate the next trigger
        // This can be set by config or is set to the current date
        this.baseDate = new Date();
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

        Log.d(TAG, "Get next trigger date" +
            ", baseDate=" + baseDate +
            ", triggerOptions=" + optionsTrigger.toString() +
            ", occurrence=" + occurrence);

        // All occurrences have been run through
        if (isLastOccurrence()) return null;

        Date nextTriggerDate = calculateNextTrigger(dateToCalendar(baseDate));

        Log.d(TAG, "Next trigger date: " + nextTriggerDate + ", notificationId=" + options.getId());
        
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

    /**
     * Checks if the trigger date is within the trigger before option, if present
     */
    public boolean isWithinTriggerbefore(Calendar calendar) {
        // Return true, if there is no trigger before option, otherwise compare against it
        return !optionsTrigger.has("before") || calendar.getTimeInMillis() < optionsTrigger.getBefore();
    }

    /**
     * Adds the amount of triggerUnit to the calendar.
     * @param calendar The calendar to manipulate.
     */
    public void addInterval(Calendar calendar, String triggerUnit, int amount) {
        switch (triggerUnit) {
            case "second":
                calendar.add(Calendar.SECOND, amount);
                break;

            case "minute":
                calendar.add(Calendar.MINUTE, amount);
                break;

            case "hour":
                calendar.add(Calendar.HOUR_OF_DAY, amount);
                break;

            case "day":
                calendar.add(Calendar.DAY_OF_YEAR, amount);
                break;

            case "week":
                calendar.add(Calendar.WEEK_OF_YEAR, amount);
                break;

            case "month":
                calendar.add(Calendar.MONTH, amount);
                break;

            case "quarter":
                calendar.add(Calendar.MONTH, amount * 3);
                break;

            case "year":
                calendar.add(Calendar.YEAR, amount);
                break;

            default:
                throw new IllegalArgumentException("Unknown trigger unit: " + triggerUnit);
        }
    }
}