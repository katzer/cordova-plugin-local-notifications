/*
 * Copyright (c) 2014-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
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
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.localnotification;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.trigger.DateTrigger;
import de.appplant.cordova.plugin.localnotification.trigger.DateTrigger.Unit;
import de.appplant.cordova.plugin.localnotification.trigger.IntervalTrigger;
import de.appplant.cordova.plugin.localnotification.trigger.MatchTrigger;

import static de.appplant.cordova.plugin.localnotification.trigger.IntervalTrigger.Unit;

/**
 * An object you use to specify a notification’s content and the condition
 * that triggers its delivery.
 */
public final class Request {

    // Key name for bundled extras
    static final String EXTRA_OCCURRENCE = "NOTIFICATION_OCCURRENCE";

    // Key name for bundled extras
    public static final String EXTRA_LAST = "NOTIFICATION_LAST";

    // The options spec
    private final Options options;

    /**
     * DateTrigger for the every-option.
     * Can be {@link IntervalTrigger} or {@link MatchTrigger}.
     */
    private final DateTrigger trigger;

    // How often the trigger shall occur
    private final int count;

    // The trigger spec
    private final JSONObject spec;

    // The current trigger date
    private Date triggerDate;

    /**
     * Create a request with a base date specified through the passed options.
     *
     * @param options The options spec.
     */
    public Request(Options options) {
        this(options, getBaseDate(options));
    }

    /**
     * Create a request with a base date specified via base argument.
     *
     * @param options The options spec.
     * @param base    The base date from where to calculate the next trigger.
     */
    public Request(Options options, Date base) {
        this.options = options;
        this.spec = options.getTrigger();
        this.count = Math.max(spec.optInt("count"), 1);
        this.trigger = buildDateTrigger();
        this.triggerDate = trigger.getNextTriggerDate(base);
    }

    /**
     * Gets the options spec.
     */
    public Options getOptions() {
        return options;
    }

    /**
     * The identifier for the request in the form
     * {notification-id}-{occurrence} e.g. "1173-2"
     * @return The notification ID as the string
     */
    String getIdentifier() {
        return options.getId().toString() + "-" + getOccurrence();
    }

    /**
     * The value of the internal occurrence counter.
     */
    int getOccurrence() {
        return trigger.getOccurrence();
    }

    /**
     * If there's one more trigger date to calculate.
     */
    private boolean hasNext() {
        return triggerDate != null && getOccurrence() <= count;
    }

    /**
     * Moves the internal occurrence counter by one.
     */
    boolean moveNext() {
        triggerDate = hasNext() ? trigger.getNextTriggerDate(triggerDate) : null;
        return triggerDate != null;
    }

    /**
     * Gets the current trigger date.
     *
     * @return null if there's no trigger date.
     */
    public Date getTriggerDate() {
        if (triggerDate == null) return null;

        long triggerTime = triggerDate.getTime();

        // trigger date lays more then 60 seconds in the past, return null
        if ((System.currentTimeMillis() - triggerTime) > 60000) return null;

        if (triggerTime >= spec.optLong("before", triggerTime + 1)) return null;

        return triggerDate;
    }

    /**
     * Build a {@link DateTrigger} specified by options.
     * If option {@code every} is an object, like
     * <pre>
     *   every: { month: 10, day: 27, hour: 9, minute: 0 }
     * </pre>
     * a {@link MatchTrigger} will be created, otherwise an {@link IntervalTrigger}.
     */
    private DateTrigger buildDateTrigger() {
        return spec.opt("every") instanceof JSONObject ?
            new MatchTrigger(getMatchingComponents(), getSpecialMatchingComponents()) :
            new IntervalTrigger(getTicks(), getUnit());
    }

    /**
     * Gets the unit value.
     */
    private Unit getUnit() {
        Object every = spec.opt("every");
        String unit  = "SECOND";

        if (spec.has("unit")) {
            unit = spec.optString("unit", "second");
        } else
        if (every instanceof String) {
            unit = spec.optString("every", "second");
        }

        return Unit.valueOf(unit.toUpperCase());
    }

    /**
     * Gets the tick value.
     */
    private int getTicks() {
        if (spec.has("at")) return 0;
        if (spec.has("in")) return spec.optInt("in", 0);
        if (spec.opt("every") instanceof String) return 1;
        if (!(spec.opt("every") instanceof JSONObject)) return spec.optInt("every", 0);
        return 0;
    }

    /**
     * Gets an array of all date parts to construct a datetime instance.
     *
     * @return [min, hour, day, month, year]
     */
    private List<Integer> getMatchingComponents() {
        JSONObject every = spec.optJSONObject("every");

        return Arrays.asList(
                (Integer) every.opt("minute"),
                (Integer) every.opt("hour"),
                (Integer) every.opt("day"),
                (Integer) every.opt("month"),
                (Integer) every.opt("year")
        );
    }

    /**
     * Gets an array of all date parts to construct a datetime instance.
     *
     * @return [min, hour, day, month, year]
     */
    private List<Integer> getSpecialMatchingComponents() {
        JSONObject every = spec.optJSONObject("every");

        return Arrays.asList(
                (Integer) every.opt("weekday"),
                (Integer) every.opt("weekdayOrdinal"),
                (Integer) every.opt("weekOfMonth"),
                (Integer) every.opt("quarter")
        );
    }

    /**
     * Gets the base date from where to calculate the next trigger date.
     */
    private static Date getBaseDate(Options options) {
        JSONObject trigger = options.getTrigger();
        if (trigger.has("at")) return new Date(trigger.optLong("at", 0));
        if (trigger.has("firstAt")) return new Date(trigger.optLong("firstAt", 0));
        if (trigger.has("after")) return new Date(trigger.optLong("after", 0));
        return new Date();
    }

}
