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
import org.json.JSONObject;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.Options;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.DAY;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.HOUR;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.MINUTE;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.MONTH;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.WEEK;
import static de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit.YEAR;
import static java.util.Calendar.DAY_OF_WEEK;
import static java.util.Calendar.WEEK_OF_MONTH;
import static java.util.Calendar.WEEK_OF_YEAR;

/**
 * Trigger for date matching components.
 */
public class MatchTrigger extends DateTrigger {

    // Used to determine the interval
    private static Unit[] INTERVALS = { null, MINUTE, HOUR, DAY, MONTH, YEAR };

    // Maps these crap where Sunday is the 1st day of the week
    private static int[] WEEKDAYS = { 0, 2, 3, 4, 5, 6, 7, 1 };

    // Maps these crap where Sunday is the 1st day of the week
    private static int[] WEEKDAYS_REV = { 0, 7, 1, 2, 3, 4, 5, 6 };

    private static int MATCHER_INDEX_MINUTE = 0;
    private static int MATCHER_INDEX_HOUR = 1;
    private static int MATCHER_INDEX_DAY = 2;
    private static int MATCHER_INDEX_MONTH = 3;
    private static int MATCHER_INDEX_YEAR = 4;

    private static int SPECIALS_INDEX_WEEKDAY = 0;
    // Not implemented yet
    private static int SPECIALS_INDEX_WEEKDAY_ORDINAL = 1;
    private static int SPECIALS_INDEX_WEEK_OF_MONTH = 2;
    // Not implemented yet
    private static int SPECIALS_INDEX_QUARTER = 3;

    private Unit unit;

    // The date matching components
    private final List<Integer> matchers;

    // The special matching components
    private final List<Integer> specials;

    /**
     * Date matching trigger from now.
     */
    public MatchTrigger(Options options) {
        super(options);
        this.matchers = getMatchingComponents();
        this.specials = getSpecialMatchingComponents();
        this.unit = getUnit();
    }

    /**
     * Gets an array of all date parts to construct a datetime instance.
     * @return [minute, hour, day, month, year]
     */
    private List<Integer> getMatchingComponents() {
        JSONObject triggerEvery = options.getTriggerEveryAsObject();
        
        return Arrays.asList(
            (Integer) triggerEvery.opt("minute"),
            (Integer) triggerEvery.opt("hour"),
            (Integer) triggerEvery.opt("day"),
            (Integer) triggerEvery.opt("month"),
            (Integer) triggerEvery.opt("year")
        );
    }

    /**
     * Gets an array of all date parts to construct a datetime instance.
     * @return [weekday, weekdayOrdinal, weekOfMonth, quarter]
     */
    private List<Integer> getSpecialMatchingComponents() {
        JSONObject triggerEvery = options.getTriggerEveryAsObject();

        List<Integer> specials = Arrays.asList(
            (Integer) triggerEvery.opt("weekday"),
            (Integer) triggerEvery.opt("weekdayOrdinal"),
            (Integer) triggerEvery.opt("weekOfMonth"),
            (Integer) triggerEvery.opt("quarter")
        );

        if (specials.get(SPECIALS_INDEX_WEEKDAY) != null) {
            specials.set(SPECIALS_INDEX_WEEKDAY, WEEKDAYS[specials.get(SPECIALS_INDEX_WEEKDAY)]);
        }

        return specials;
    }

    private Unit getUnit() {
        // Use the next higher unit as the last one defined in matchers
        // If minute and hour is defined but not day, matchers.indexOf(null) will return 2, which would
        // use the 3rd element of INTERVALS, which is DAY
        Unit unit1 = INTERVALS[1 + matchers.indexOf(null)];
        Unit unit2 = null;

        if (specials.get(SPECIALS_INDEX_WEEKDAY) != null) unit2 = WEEK;
        if (unit2 == null) return unit1;

        return (unit1.compareTo(unit2) < 0) ? unit2 : unit1;
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
            ", count=" + options.getTriggerCount());

        Calendar nextCalendar = (Calendar) baseCalendar.clone();

        // Add unit to base calendar, if it's not the first occurrence
        if (occurrence > 0) addInterval(nextCalendar, unit, 1);

        Calendar calendarWithMatchers = getCalendarWithMatchers(nextCalendar);

        if (calendarWithMatchers.compareTo(nextCalendar) >= 0) return applySpecials(calendarWithMatchers);

        if (unit == null || calendarWithMatchers.get(Calendar.YEAR) < nextCalendar.get(Calendar.YEAR)) return null;

        if (calendarWithMatchers.get(Calendar.MONTH) <  nextCalendar.get(Calendar.MONTH)) {
            switch (unit) {
                case MINUTE:
                case HOUR:
                case DAY:
                case WEEK:
                    if (matchers.get(MATCHER_INDEX_YEAR) == null) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                        break;
                    } else
                        return null;
                case YEAR:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                    break;
            }
        } else
        if (calendarWithMatchers.get(Calendar.DAY_OF_YEAR) < nextCalendar.get(Calendar.DAY_OF_YEAR)) {
            switch (unit) {
                case MINUTE:
                case HOUR:
                    if (matchers.get(MATCHER_INDEX_MONTH) == null) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.MONTH, 1);
                        break;
                    } else
                    if (matchers.get(MATCHER_INDEX_YEAR) == null) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                        break;
                    }
                    else
                        return null;
                case MONTH:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.MONTH, 1);
                    break;
                case YEAR:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                    break;
            }
        } else
        if (calendarWithMatchers.get(Calendar.HOUR_OF_DAY) < nextCalendar.get(Calendar.HOUR_OF_DAY)) {
            switch (unit) {
                case MINUTE:
                    if (matchers.get(MATCHER_INDEX_DAY) == null) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.DAY_OF_YEAR, 1);
                        break;
                    } else
                    if (matchers.get(MATCHER_INDEX_MONTH) == null) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.MONTH, 1);
                        break;
                    }
                    else
                        return null;
                case HOUR:
                    if (calendarWithMatchers.get(Calendar.MINUTE) < nextCalendar.get(Calendar.MINUTE)) {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.HOUR_OF_DAY, 1);
                    } else {
                        addToDate(calendarWithMatchers, nextCalendar, Calendar.HOUR_OF_DAY, 0);
                    }
                    break;
                case DAY:
                case WEEK:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.DAY_OF_YEAR, 1);
                    break;
                case MONTH:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.MONTH, 1);
                    break;
                case YEAR:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                    break;
            }
        } else
        if (calendarWithMatchers.get(Calendar.MINUTE) < nextCalendar.get(Calendar.MINUTE)) {
            switch (unit) {
                case MINUTE:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.MINUTE, 1);
                    break;
                case HOUR:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.HOUR_OF_DAY, 1);
                    break;
                case DAY:
                case WEEK:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.DAY_OF_YEAR, 1);
                    break;
                case MONTH:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.MONTH, 1);
                    break;
                case YEAR:
                    addToDate(calendarWithMatchers, nextCalendar, Calendar.YEAR, 1);
                    break;
            }
        }

        return applySpecials(calendarWithMatchers);
    }

    /**
     * Gets a new calendar based on a given calendar and sets the matcher values from config
     */
    private Calendar getCalendarWithMatchers(Calendar baseCalendar) {
        Calendar newCalendar = (Calendar) baseCalendar.clone();
        newCalendar.set(Calendar.SECOND, 0);

        // Set matcher minute, set to 0 if not present
        Integer matcherMinute = matchers.get(MATCHER_INDEX_MINUTE) == null ? 0 : matchers.get(MATCHER_INDEX_MINUTE);
        newCalendar.set(Calendar.MINUTE, matcherMinute);

        // Set matcher hour, set to 0 if not present
        Integer matcherHour = matchers.get(MATCHER_INDEX_HOUR) == null ? 0 : matchers.get(MATCHER_INDEX_HOUR);
        newCalendar.set(Calendar.HOUR_OF_DAY, matcherHour);
        
        // Set matcher day, month, year, if present
        if (matchers.get(MATCHER_INDEX_DAY) != null) newCalendar.set(Calendar.DAY_OF_MONTH, matchers.get(MATCHER_INDEX_DAY));
        if (matchers.get(MATCHER_INDEX_MONTH) != null) newCalendar.set(Calendar.MONTH, matchers.get(MATCHER_INDEX_MONTH) - 1);
        if (matchers.get(MATCHER_INDEX_YEAR) != null) newCalendar.set(Calendar.YEAR, matchers.get(MATCHER_INDEX_YEAR));

        return newCalendar;
    }

    private Date applySpecials(Calendar calendar) {
        if (specials.get(SPECIALS_INDEX_WEEK_OF_MONTH) != null && !setWeekOfMonth(calendar)) return null;
        if (specials.get(SPECIALS_INDEX_WEEKDAY) != null && !setDayOfWeek(calendar)) return null;
        return calendar.getTime();
    }

    /**
     * Sets the field value of now to date and adds by count.
     */
    private void addToDate(Calendar calendar, Calendar now, int field, int count) {
        calendar.set(field, now.get(field));
        calendar.add(field, count);
    }

    /**
     * Set the day of the year but ensure that the calendar does point to a
     * date in future.
     *
     * @param calendar   The calendar to manipulate.
     *
     * @return true if the operation could be made.
     */
    private boolean setDayOfWeek(Calendar calendar) {
        calendar.setFirstDayOfWeek(Calendar.MONDAY);
        int day = WEEKDAYS_REV[calendar.get(DAY_OF_WEEK)];
        int month = calendar.get(Calendar.MONTH);
        int year = calendar.get(Calendar.YEAR);
        int dayToSet = WEEKDAYS_REV[specials.get(SPECIALS_INDEX_WEEKDAY)];

        if (matchers.get(MATCHER_INDEX_DAY) != null) return false;

        if (day > dayToSet) {
            if (specials.get(SPECIALS_INDEX_WEEK_OF_MONTH) == null) {
                calendar.add(WEEK_OF_YEAR, 1);
            } else if (matchers.get(MATCHER_INDEX_MONTH) == null) {
                calendar.add(Calendar.MONTH, 1);
            } else if (matchers.get(MATCHER_INDEX_YEAR) == null) {
                calendar.add(Calendar.YEAR, 1);
            } else
                return false;
        }

        calendar.set(Calendar.SECOND, 0);
        calendar.set(DAY_OF_WEEK, specials.get(SPECIALS_INDEX_WEEKDAY));

        if (matchers.get(MATCHER_INDEX_MONTH) != null && calendar.get(Calendar.MONTH) != month) return false;
        if (matchers.get(MATCHER_INDEX_YEAR) != null && calendar.get(Calendar.YEAR) != year) return false;

        return true;
    }

    /**
     * Set the week of the month but ensure that the calendar does point to a
     * date in future.
     *
     * @param calendar The calendar to manipulate.
     *
     * @return true if the operation could be made.
     */
    private boolean setWeekOfMonth(Calendar calendar) {
        int week = calendar.get(WEEK_OF_MONTH);
        int year = calendar.get(Calendar.YEAR);
        int weekToSet = specials.get(SPECIALS_INDEX_WEEK_OF_MONTH);

        if (week > weekToSet) {
            if (matchers.get(MATCHER_INDEX_MONTH) == null) {
                calendar.add(Calendar.MONTH, 1);
            } else if (matchers.get(MATCHER_INDEX_YEAR) == null) {
                calendar.add(Calendar.YEAR, 1);
            } else
                return false;

            if (matchers.get(MATCHER_INDEX_YEAR) != null && calendar.get(Calendar.YEAR) != year) return false;
        }

        int month = calendar.get(Calendar.MONTH);

        calendar.set(WEEK_OF_MONTH, weekToSet);

        if (calendar.get(Calendar.MONTH) != month) {
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.MONTH, month);
        } else
        if (matchers.get(MATCHER_INDEX_DAY) == null && week != weekToSet) {
            calendar.set(DAY_OF_WEEK, 2);
        }

        return true;
    }
}