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
import de.appplant.cordova.plugin.localnotification.OptionsTrigger;

/**
 * Handles trigger.in
 * 
 * Example:
 *   trigger: { in: 1, unit: 'hour' }
 */
public class TriggerHandlerIn extends TriggerHandler {

    public static final String TAG = "TriggerHandlerIn";

    public TriggerHandlerIn(Options options) {
        super(options);
    }

    public boolean isLastOccurrence() {
        // trigger.in can only be scheduled one time
        return occurrence == 1;
    }

    /**
     * Calculates the next trigger.
     * @param baseCalendar The base calendar from where to calculate the next trigger.
     */
    public Date calculateNextTrigger(Calendar baseCalendar) {
        // All occurrences are done
        if (isLastOccurrence()) return null;

        // trigger: { in: 1, unit: 'hour' }
        // Catch wrong trigger units
        try {
            addInterval(baseCalendar, optionsTrigger.getUnit(), optionsTrigger.getIn());
            return baseCalendar.getTime();
        } catch (IllegalArgumentException exception) {
            Log.e(TAG, "Error calculating trigger, trigger unit is wrong: " + exception.getMessage());
            return null;
        }
    }
}