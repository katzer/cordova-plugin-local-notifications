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

package de.appplant.cordova.plugin.localnotification.action;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

import de.appplant.cordova.plugin.localnotification.Manager;

public class ActionGroup {

    private static final String TAG = "ActionGroup";

    // Action group id
    private String id;

    // Actions JSON array, needed for storage
    private JSONArray actionsJSONArray;

    // List of actions
    private List<Action> actions;

    private Context context;
    
    public ActionGroup(Context context, String actionGroupId, JSONArray actionsJSONArray) {
        this.context = context;
        this.id = actionGroupId;
        this.actionsJSONArray = actionsJSONArray;
        this.actions = new ArrayList<Action>(actionsJSONArray.length());

        for (int i = 0; i < actionsJSONArray.length(); i++) {
            this.actions.add(new Action(context, actionsJSONArray.optJSONObject(i)));
        }
    }

    /**
     * Gets the action group id.
     */
    public String getId() {
        return id;
    }

    /**
     * Gets the action list.
     */
    public List<Action> getActions() {
        return actions;
    }

    /**
     * Gets the action by id.
     * @param actionId The id of the action to get.
     * @return The action with the specified id or <code>null</code> if not found.
     */
    public Action getActionById(String actionId) {
        for (Action action : actions) {
            if (action.getId().equals(actionId)) {
                return action;
            }
        }
        
        Log.w(TAG, "Action not found, id=" + actionId);
        return null;
    }

    /**
     * Stores this action group in the {@link SharedPreferences}.
     */
    public void store() {
        Manager.getSharedPreferences(context).edit()
            .putString("ACTION_GROUP_" + id, actionsJSONArray.toString())
            .apply();
    }

    /**
     * Removes the action group from the {@link SharedPreferences}.
     * @param context
     * @param actionGroupId
     */
    public static void remove(Context context, String actionGroupId) {
        Manager.getSharedPreferences(context).edit()
            .remove("ACTION_GROUP_" + actionGroupId)
            .apply();
    }

    /**
     * Gets the action group with the specified actionGroupId from the
     * {@link SharedPreferences}.
     *
     * @param context The application context.
     * @param actionGroupId The id of the action group to get.
     *
     * @return The restored action group from {@link SharedPreferences} or <code>null</code> if not found.
     */
    public static ActionGroup get(Context context, String actionGroupId) {
        String actionsJSON = Manager.getSharedPreferences(context)
            .getString("ACTION_GROUP_" + actionGroupId, null);

        if (actionsJSON == null) return null;

        try {
            JSONArray actionsJSONArray = new JSONArray(actionsJSON);
            return new ActionGroup(context, actionGroupId, actionsJSONArray);
        } catch (JSONException jsonException) {
            Log.e(TAG, "Failed to restore action group: " + actionGroupId, jsonException);
            return null;
        }
    }
}