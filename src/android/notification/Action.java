/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
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

package de.appplant.cordova.plugin.notification;

import java.util.HashMap;

/**
 * Holds the icon and title components that would be used in a NotificationCompat.Action object.
 * Does not include the PendingIntent so that it may be generated each time the notification is built.
 * Necessary to compensate for missing functionality in the support library.
 */
public class Action {
    
    // Icon shown on action button
    private int icon;

    // Title shown on action button
    private CharSequence title;

    // Used to locate existing actions
    private String identifier;

    // Persistant map of all action categories
    private static HashMap<String, Action[]> allNotificationActionCategories = new HashMap<String, Action[]>();

    // Persistant map of all actions used
    private static HashMap<String, Action> allNotificationActions = new HashMap<String, Action>();

    /**
     * Constructor
     *
     * @param context
     *      Icon to be shown
     * @param options
     *      Title to be shown
     * @param identifier
     *      Used to pull action if existing and added to PendingIntent
     */
    public Action(int icon, CharSequence title, String identifier) {
        this.icon = icon;
        this.title = title;
        this.identifier = identifier;
    }

    /**
     * Icon for the local notification action.
     */
    public int getIcon() {
        return icon;
    }

    /**
     * Title for the local notification action.
     */
    public CharSequence getTitle() {
        return title;
    }

    /**
     * Identifier for the local notification action.
     */
    public String getIdentifier() {
        return identifier;
    }

    /**
     * Returns an action if it already exists.
     *
     * @param actionIdentifier
     *     Identifier of action to be returned
     */
    public static Action getNotificationAction(String actionIdentifier) {
        return allNotificationActions.get(actionIdentifier);
    } 

    /**
     * Returns an array of actions for a category if the category already exists.
     *
     * @param actionCategoryIdentifier
     *      Identifier of category to be returned
     */
    public static Action[] getNotificationActionsForCategory(String actionCategoryIdentifier) {
        return allNotificationActionCategories.get(actionCategoryIdentifier);
    }

    /**
     * Persists a new local notification action.
     *
     * @param action
     *      New action to be added
     */
    public static void addNotificationAction(Action action) {
        allNotificationActions.put(action.getIdentifier(), action);
    }

    /**
     * Persists an array of actions for a new category.
     *
     * @param actionCategoryIdentifier
     *      Identifier of new category to be added
     * @param actions
     *      Array of actions to be associated with new category
     */
    public static void addNotificationActionCategory(String actionCategoryIdentfier, Action[] actions) {
        allNotificationActionCategories.put(actionCategoryIdentfier, actions);
    }
}