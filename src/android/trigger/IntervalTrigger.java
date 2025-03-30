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

/**
 * Trigger class for interval based notification.
 * Trigger by a fixed interval from now.
 * 
 * Examples:
 *   trigger: { at: new Date(2017, 10, 27, 15) }
 *   trigger: { in: 1, unit: 'hour' }
 *   trigger: { every: 'day', count: 5 }
 */
public class IntervalTrigger extends OptionsTrigger {

    public static final String TAG = "IntervalTrigger";

    public IntervalTrigger(Options options) {
        super(options);
    }

    public boolean isLastOccurrence() {
        // trigger.at and trigger.in have maximum 1 occurrence 
        return ((triggerJSON.has("at") || triggerJSON.has("in")) && occurrence == 1) ||
            // trigger.every: Check if trigger.count is exceeded if set
           (triggerJSON.has("count") && occurrence >= getTriggerCount());
    }

    /**
     * Calculates the next trigger.
     * @param baseCalendar The base calendar from where to calculate the next trigger.
     */
    public Date calculateNextTrigger(Calendar baseCalendar) {
        Log.d(TAG, "Calculating next trigger" +
            ", baseCalendar=" + baseCalendar.getTime() +
            ", triggerOptions=" + triggerJSON.toString() +
            ", occurrence=" + occurrence);

        // All occurrences are done
        if (isLastOccurrence()) return null;

        // trigger: { at: new Date(2017, 10, 27, 15) }
        if (triggerJSON.has("at")) return new Date(getTriggerAt());

        // trigger: { in: 1, unit: 'hour' }
        // trigger: { every: 'day', count: 5 }
        // Catch wrong trigger units
        try {
            // trigger: { in: 1, unit: 'hour' }
            if (triggerJSON.has("in")) {
                addInterval(baseCalendar, getTriggerUnit(), getTriggerIn());

                // trigger: { every: 'day', count: 5 }
            } else if (triggerJSON.has("every")) {
                addInterval(baseCalendar, getTriggerEveryAsString(), 1);

                // Check if the trigger is within the before option
                if (!isWithinTriggerbefore(baseCalendar)) return null;
            }

            Log.d(TAG, "Next trigger calculated, triggerDate=" + baseCalendar.getTime());
            return baseCalendar.getTime();
        } catch (IllegalArgumentException exception) {
            Log.e(TAG, "Error calculating next trigger, trigger unit is wrong: " + exception.getMessage());
            return null;
        }
    }

    /**
     * Adds the amount of triggerUnit to the calendar.
     * @param calendar The calendar to manipulate.
     */
    private void addInterval(Calendar calendar, String triggerUnit, int amount) {
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