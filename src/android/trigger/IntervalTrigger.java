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
public class IntervalTrigger extends DateTrigger {

    public static final String TAG = "IntervalTrigger";

    public IntervalTrigger(Options options) {
        super(options);
    }

    /**
     * Calculates the next trigger.
     * @param baseCalendar The base calendar from where to calculate the next trigger.
     */
    public Date calculateNextTrigger(Calendar baseCalendar) {
        Log.d(TAG, "Calculating next trigger" +
            ", baseCalendar=" + baseCalendar.getTime() +
            ", occurrence=" + occurrence +
            ", unit=" + getUnit() +
            ", amount=" + getUnitAmount() +
            ", count=" + options.getTriggerCount());

        // trigger.at only triggers once
        if (options.getTriggerAt() > 0) {
            if (occurrence > 0) return null;
            return new Date(options.getTriggerAt());
        }

        // trigger.in or trigger.every
        // trigger.in should only calculated once
        if (options.getTriggerIn() > 0 && occurrence > 0) return null;

        addInterval(baseCalendar, getUnit(), getUnitAmount());

        Log.d(TAG, "Next trigger calculated, triggerDate=" + baseCalendar.getTime());
        return baseCalendar.getTime();
    }

    /**
     * Gets a {@link Unit} enum determined from the trigger option.
     * Examples:
     *   trigger: { in: 1, unit: 'hour' } resolves to Unit.HOUR
     *   trigger: { every: 'day', count: 5 } resolves to Unit.DAY
     * Defaults to Unit.SECOND, when nothing set
     */
    private Unit getUnit() {
        // When nothing given or input is invalid
        Unit defaultUnit = Unit.MINUTE;

        // First, try unit option, if available
        String unit = options.getTriggerUnit();

        // If unit not available, try every option
        if (unit == null) unit = options.getTriggerEveryAsString();

        // If every option not available, set default
        if (unit == null) unit = defaultUnit.toString();

        // Convert string to enum
        try {
            return Unit.valueOf(unit.toUpperCase());
        } catch (Exception exception) {
            Log.e(TAG, "Could not convert unit to Enum, using default of '" + defaultUnit + "', value=" + unit, exception);
            return defaultUnit;
        }
    }

    /**
     * How often a {@link Unit} should be added
     */
    private int getUnitAmount() {
        // trigger: { in: 1, unit: 'hour' }
        // Add amount by in option
        if (options.getTriggerIn() > 0) return options.getTriggerIn();

        // trigger: { every: 'day', count: 5 }
        // Amount should be added by one
        if (options.getTriggerEveryAsString() != null) return 1;

        return 0;
    }
}