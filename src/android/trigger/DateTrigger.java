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

import de.appplant.cordova.plugin.localnotification.Options;

public abstract class DateTrigger {

    public static final String TAG = "DateTrigger";

    // Default unit is SECOND
    public enum Unit { SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR }
    
    public Options options;

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
    public DateTrigger(Options options) {
        this.options = options;
        // Set the base date from where to calculate the next trigger
        // This can be set by config or is set to the current date
        this.baseDate = getFirstTriggerFromConfig() > 0 ? new Date(getFirstTriggerFromConfig()) : new Date();
    }

    /**
     * Only for repeating triggers, when the first trigger should occur by config.
     * @return 0 if there is nothing set in the config
     */
    private long getFirstTriggerFromConfig() {
        if (options.getTriggerFirstAt() > 0) return options.getTriggerFirstAt();
        if (options.getTriggerAfter() > 0) return options.getTriggerAfter();
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

    /**
     * Adds the amount of {@link Unit} to the calendar.
     * @param calendar The calendar to manipulate.
     */
    void addInterval(Calendar calendar, Unit unit, int amount) {
        switch (unit) {
            case SECOND:
                calendar.add(Calendar.SECOND, amount);
                break;
            case MINUTE:
                calendar.add(Calendar.MINUTE, amount);
                break;
            case HOUR:
                calendar.add(Calendar.HOUR_OF_DAY, amount);
                break;
            case DAY:
                calendar.add(Calendar.DAY_OF_YEAR, amount);
                break;
            case WEEK:
                calendar.add(Calendar.WEEK_OF_YEAR, amount);
                break;
            case MONTH:
                calendar.add(Calendar.MONTH, amount);
                break;
            case QUARTER:
                calendar.add(Calendar.MONTH, amount * 3);
                break;
            case YEAR:
                calendar.add(Calendar.YEAR, amount);
                break;
        }
    }

    /**
     * Checks if the trigger date is within the trigger before option, if present
     */
    public boolean isWithinTriggerbefore(Calendar calendar) {
        // Return true, if there is no trigger before option, otherwise compare against it
        return !options.getTrigger().has("before") || calendar.getTimeInMillis() < options.getTriggerBefore();
    }
}