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

package de.appplant.cordova.plugin.notification.trigger;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

import static de.appplant.cordova.plugin.notification.trigger.DateTrigger.Unit.DAY;
import static de.appplant.cordova.plugin.notification.trigger.DateTrigger.Unit.HOUR;
import static de.appplant.cordova.plugin.notification.trigger.DateTrigger.Unit.MINUTE;
import static de.appplant.cordova.plugin.notification.trigger.DateTrigger.Unit.MONTH;
import static de.appplant.cordova.plugin.notification.trigger.DateTrigger.Unit.YEAR;

/**
 * Trigger for date matching components.
 */
public class MatchTrigger extends IntervalTrigger {

    // Used to determine the interval
    private static Unit[] INTERVALS = { null, MINUTE, HOUR, DAY, MONTH, YEAR };

    // The date matching components
    private final List<Integer> matchers;

    /**
     * Date matching trigger from now.
     *
     * @param matchers Describes the date matching parts.
     *                 { day: 15, month: ... }
     */
    public MatchTrigger(List<Integer> matchers) {
        super(1, INTERVALS[1 + matchers.indexOf(null)]);
        this.matchers = matchers;
    }

    /**
     * Gets the date from where to start calculating the initial trigger date.
     */
    private Calendar getBaseTriggerDate(Date date) {
        Calendar cal = getCal(date);

        cal.set(Calendar.SECOND, 0);

        if (matchers.get(0) != null) {
            cal.set(Calendar.MINUTE, matchers.get(0));
        } else {
            cal.set(Calendar.MINUTE, 0);
        }

        if (matchers.get(1) != null) {
            cal.set(Calendar.HOUR_OF_DAY, matchers.get(1));
        } else {
            cal.set(Calendar.HOUR_OF_DAY, 0);
        }

        if (matchers.get(2) != null) {
            cal.set(Calendar.DAY_OF_MONTH, matchers.get(2));
        }

        if (matchers.get(3) != null) {
            cal.set(Calendar.MONTH, matchers.get(3));
        }

        if (matchers.get(4) != null) {
            cal.set(Calendar.YEAR, matchers.get(4));
        }

        return cal;
    }

    /**
     * Gets the first trigger date.
     *
     * @param base The date from where to calculate the trigger date.
     *
     * @return null if there's none trigger date.
     */
    private Date getTriggerDate (Date base) {
        Calendar date = getBaseTriggerDate(base);
        Calendar now  = getCal(base);

        if (date.compareTo(now) >= 0)
            return date.getTime();

        if (unit == null || date.get(Calendar.YEAR) < now.get(Calendar.YEAR))
            return null;

        if (date.get(Calendar.MONTH) < now.get(Calendar.MONTH)) {
            switch (unit) {
                case MINUTE:
                case HOUR:
                case DAY:
                    if (matchers.get(4) == null) {
                        return addToDate(date, now, Calendar.YEAR, 1);
                    } else break;
                case YEAR:
                    return addToDate(date, now, Calendar.YEAR, 1);
            }
        } else
        if (date.get(Calendar.DAY_OF_YEAR) < now.get(Calendar.DAY_OF_YEAR)) {
            switch (unit) {
                case MINUTE:
                case HOUR:
                    if (matchers.get(3) == null) {
                        return addToDate(date, now, Calendar.MONTH, 1);
                    } else
                    if (matchers.get(4) == null) {
                        return addToDate(date, now, Calendar.YEAR, 1);
                    }
                    else break;
                case MONTH:
                    return addToDate(date, now, Calendar.MONTH, 1);
                case YEAR:
                    return addToDate(date, now, Calendar.YEAR, 1);
            }
        } else
        if (date.get(Calendar.HOUR_OF_DAY) < now.get(Calendar.HOUR_OF_DAY)) {
            switch (unit) {
                case MINUTE:
                    if (matchers.get(2) == null) {
                        return addToDate(date, now, Calendar.DAY_OF_YEAR, 1);
                    } else
                    if (matchers.get(3) == null) {
                        return addToDate(date, now, Calendar.MONTH, 1);
                    }
                    else break;
                case HOUR:
                    return addToDate(date, now, Calendar.HOUR_OF_DAY, 0);
                case DAY:
                    return addToDate(date, now, Calendar.DAY_OF_YEAR, 1);
                case MONTH:
                    return addToDate(date, now, Calendar.MONTH, 1);
                case YEAR:
                    return addToDate(date, now, Calendar.YEAR, 1);
            }
        } else
        if (date.get(Calendar.MINUTE) < now.get(Calendar.MINUTE)) {
            switch (unit) {
                case MINUTE:
                    return addToDate(date, now, Calendar.MINUTE, 1);
                case HOUR:
                    return addToDate(date, now, Calendar.HOUR_OF_DAY, 1);
                case DAY:
                    return addToDate(date, now, Calendar.DAY_OF_YEAR, 1);
                case MONTH:
                    return addToDate(date, now, Calendar.MONTH, 1);
                case YEAR:
                    return addToDate(date, now, Calendar.YEAR, 1);
            }
        }

        return null;
    }

    /**
     * Gets the next trigger date.
     *
     * @param base The date from where to calculate the trigger date.
     *
     * @return null if there's none next trigger date.
     */
    @Override
    public Date getNextTriggerDate (Date base) {
        Date date = base;

        if (getOccurrence() > 1) {
            Calendar cal = getCal(base);
            addInterval(cal);
            date = cal.getTime();
        }

        incOccurrence();

        return getTriggerDate(date);
    }

    /**
     * Sets the field value of now to date and adds by count.
     *
     * @return The new date.
     */
    private Date addToDate(Calendar date, Calendar now, int field, int count) {
        date.set(field, now.get(field));
        date.add(field, count);
        return date.getTime();
    }

}