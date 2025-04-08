/*
 * Apache 2.0 License
 *
 * Copyright (c) Manuel Beck 2025
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

package de.appplant.cordova.plugin.localnotification;

import org.json.JSONObject;

public class OptionsTrigger {
    
    private JSONObject triggerJSON;

    public OptionsTrigger(JSONObject triggerJSON) {
        this.triggerJSON = triggerJSON;
    }

    public boolean has(String key) {
        return triggerJSON.has(key);
    }

    public long getAt() {
        return triggerJSON.optLong("at", 0);
    }

    public int getIn() {
        return triggerJSON.optInt("in", 0);
    }

    public String getUnit() {
        return triggerJSON.optString("unit", null);
    }

    /**
     * Only for repeating notifications, when the first notification should be triggered.
     */
    public long getFirstAt() {
        return triggerJSON.optLong("firstAt", 0);
    }

    /**
     * Only for repeating notifications, when the first notification should be triggered.
     */
    public long getAfter() {
        return triggerJSON.optLong("after", 0);
    }

    /**
     * If a repeating notification should be stopped after some occurrences. -1 means infinite.
     * @return
     */
    public int getCount() {
        return triggerJSON.optInt("count", -1);
    }

    /**
     * Can be a {@link String} or {@link JSONObject}.
     */
    public Object getEvery() {
        return triggerJSON.opt("every");
    }

    /**
     * Gets trigger.every as {@link String}. If trigger.every is a {@link JSONObject}, it returns null
     */
    public String getEveryAsString() {
        return getEvery() instanceof String ? (String) getEvery() : null;
    }

    /**
     * Gets trigger.every as {@link JSONObject}. If trigger.every is a {@link String}, it returns null
     */
    public JSONObject getEveryAsJSONObject() {
        return getEvery() instanceof JSONObject ? (JSONObject) getEvery() : null;
    }

    public long getBefore() {
        return triggerJSON.optLong("before", 0);
    }

    public JSONObject getJSON() {
        return triggerJSON;
    }

    public String toString() {
        return triggerJSON.toString();
    }
}