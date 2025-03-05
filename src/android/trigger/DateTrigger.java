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

        // Check if the trigger is within the before option (only for repeating triggers)
        if (!isWithinTriggerbefore(options, nextTriggerDate)) return null;

        // Count occurrence
        occurrence++;

        // Remember trigger date
        triggerDate = nextTriggerDate;

        return nextTriggerDate;
    }

    /**
     * To restore the triggerDate, when the notification is loaded from the SharedPreferences.
     * @param date
     */
    public void setTriggerDate(Date date) {
        this.triggerDate = date;
    }

    public Date getTriggerDate() {
        return triggerDate;
    }

    /**
     * Sets the base date from where to calculate the next trigger. This is initially set by
     * {@link #getFirstBaseDate()} but can be overwritten.
     */
    public void setBaseDate(Date baseDate) {
        this.baseDate = baseDate;
    }

    /**
     * Sets the occurrence of the trigger.
     * @param occurence
     */
    public void setOccurrence(int occurence) {
        this.occurrence = occurence;
    }

    /**
     * The value of the occurrence.
     */
    public int getOccurrence() {
        return occurrence;
    }

    public boolean isLastOccurrence() {
        // trigger is not repeating like it is for trigger.at and trigger.in
        // there can only be 1 occurrence 
        if (!options.isRepeating() && occurrence == 1) return true;

        // Repeating trigger: All occurrences have been run through specified by the count option
        if (options.getTriggerCount() > 0 && occurrence >= options.getTriggerCount()) return true;

        // It's not the last occurrence
        return false;
    }

    /**
     * Converts {@link Date} to {@link Calendar}.
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
     * @param options
     * @param triggerDate
     * @return
     */
    public boolean isWithinTriggerbefore(Options options, Date triggerDate) {
        // Return true, if there is no trigger before option, otherwise compare against it
        return !options.getTrigger().has("before") || triggerDate.getTime() < options.getTriggerBefore();
    }
}