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

var exec    = require('cordova/exec'),
    channel = require('cordova/channel');

// Options for every platform
exports._commonOptions = {
    actions: [],
    attachments: [],
    // Custom data for the notification. Can be used, when the notification
    // is send back to the app, e.g. by clicking on it.
    data: null,
    id: 1,
    launch: true,
    silent: false,
    text: "",
    // In Android 7, this sets the sound uri of a notification.
    // Since Android 8, it sets the sound uri of a notification channel.
    // The string 'default' represents the default notification sound and is not a path.
    sound: 'default',
    // If empty, the app name will be used
    title: "",
    // Default will be set on _prepareTrigger if nothing is set
    trigger: null,
    meta: {
        plugin:  'cordova-plugin-local-notification',
        version: '1.2.2'
    }
}

exports._androidAlarmTypes = {
    RTC_WAKEUP: 0,
    RTC: 1,
    ELAPSED_REALTIME_WAKEUP: 2, // Not supported
    ELAPSED_REALTIME: 3, // Not supported
}

exports._androidChannelImportanceTypes = {
    IMPORTANCE_NONE: 0,
    IMPORTANCE_MIN: 1,
    IMPORTANCE_LOW: 2,
    IMPORTANCE_DEFAULT: 3,
    IMPORTANCE_HIGH: 4,
    IMPORTANCE_MAX: 5
}

exports.androidUnusedAppRestrictionsStatusCodes = {
    // The status of Unused App Restrictions could not be retrieved from this app e.g. 
    // if the app's target SDK version <30 or the user is in locked device boot mode
    // Check the logs for the reason
    ERROR: 0,

    // There are no available Unused App Restrictions for this app (would only happen on Devices older then Android 7)
    FEATURE_NOT_AVAILABLE: 1,

    // Any available Unused App Restrictions on the device are disabled for this app.
    // In other words, this app is exempt from having its permissions automatically removed or being hibernated.
    DISABLED: 2,

    // Unused App Restrictions introduced by Android API 30, and since made available on earlier (API 23-29) devices
    // are enabled for this app: permission auto-reset. Note: This value is only used on API 29 or earlier devices.
    API_30_BACKPORT: 3,

    // Unused App Restrictions introduced by Android API 30 are enabled for this app: permission auto-reset.
    // Note: This value is only used on API 30 or later devices.
    API_30: 4,

    // Unused App Restrictions introduced by Android API 31 are enabled for this app:
    // permission auto-reset and app hibernation.
    // Note: This value is only used on API 31 or later devices.
    API_31: 5
}

// Options only available on Android
exports._androidSpecificOptions = {
    androidAlarmType: exports._androidAlarmTypes.RTC_WAKEUP,
    // Alarm will be allowed to execute even when the system is in low-power idle (a.k.a. doze) modes.
    androidAllowWhileIdle: false,
    // Make this notification automatically dismissed when the user touches it
    androidAutoCancel : true,
    androidChannelEnableLights: false,
    androidChannelDescription: null,
    androidChannelEnableVibration: false,
    androidChannelId: "default_channel",
    androidChannelImportance: exports._androidChannelImportanceTypes.IMPORTANCE_DEFAULT,
    androidChannelName: "Default channel",
    // soundUsage of a channel. Default is USAGE_NOTIFICATION
    androidChannelSoundUsage: 5,
    // The notification background color for the small icon
    androidColor: null,
    // Android 7 only: Sets the default notification options
    androidDefaults: 0,
    androidGroup: null,
    androidGroupSummary: false,
    androidMessages: null,
    androidLargeIcon : null,
    // Can be square or circle
    androidLargeIconType: "square",
    androidLockscreen: true,
    androidOngoing: false,
    androidOnlyAlertOnce: false,
    androidProgressBar: null,
    // If the Notification should show the when date
    androidShowWhen: true,
    androidSmallIcon: 'res://ic_popup_reminder',
    androidSummary: null,
    // Specifies a duration in milliseconds after which this notification should be canceled,
    // if it is not already canceled.
    androidTimeoutAfter: 0,
    androidTitleCount: "%n%",
    // Show the Notification#when field as a stopwatch. Instead of presenting when as a timestamp,
    // the notification will show an automatically updating display of the minutes and seconds since when
    androidUsesChronometer: false,
    androidWakeUpScreen: true,
    // Overwrites default
    // Increments the badge by the specified number for that notification
    badgeNumber: 1,
    // Only for Android 7
    led: false
}

// Options only available on iOS
exports._iOSSpecificOptions = {
    // Overwrites default
    // Set the badge directly.
    // -1: The badge will not be changed
    // 0: The badge will be cleared
    badgeNumber: -1,
    // Displays notification in foreground, when app is active.
    iOSForeground : true
}

exports._deprecatedProperties = {
    // Changes since version 1.1.0
    autoClear: {newPropertyKey: 'androidAutoCancel', since: "1.1.0"},
    badge: {newPropertyKey: 'badgeNumber', since: "1.1.0"},
    channelDescription: {newPropertyKey: 'androidChannelDescription', since: "1.1.0"},
    channelId: {newPropertyKey: 'androidChannelId', since: "1.1.0"},
    channelImportance: {newPropertyKey: 'androidChannelImportance', since: "1.1.0"},
    channelName: {newPropertyKey: 'androidChannelName', since: "1.1.0"},
    clock: {message: "Use for 'clock: true' = 'androidShowWhen' and clock: 'chronometer' = 'androidUsesChronometer'", since: "1.1.0"},
    color: {newPropertyKey: 'androidColor', since: "1.1.0"},
    description: {newPropertyKey: 'androidChannelDescription', since: "1.1.0"},
    defaults: {newPropertyKey: 'androidDefaults', since: "1.1.0"},
    foreground: {newPropertyKey: 'iOSForeground', since: "1.1.0"},
    group: {newPropertyKey: 'androidGroup', since: "1.1.0"},
    groupSummary: {newPropertyKey: 'androidGroupSummary', since: "1.1.0"},
    icon: {newPropertyKey: 'androidLargeIcon', since: "1.1.0"},
    iconType: {renanewPropertyKeymedTo: 'androidLargeIconType', since: "1.1.0"},
    importance: {newPropertyKey: 'androidChannelImportance', since: "1.1.0"},
    lockscreen: {newPropertyKey: 'androidLockscreen', since: "1.1.0"},
    mediaSession: {removed: true, since: "1.1.0", additionalMessage: "Not supported anymore."},
    onlyAlertOnce: {newPropertyKey: 'androidOnlyAlertOnce', since: "1.1.0"},
    prio: {additionalMessage: 'Use androidChannelImportance, androidAlarmType and androidAllowWhileIdle instead.', since: "1.1.0"},
    priority: {additionalMessage: 'Use androidChannelImportance, androidAlarmType and androidAllowWhileIdle instead.', since: "1.1.0"},
    progressBar: {newPropertyKey: 'androidProgressBar', since: "1.1.0"},
    smallIcon: {newPropertyKey: 'androidSmallIcon', since: "1.1.0"},
    soundUsage: {newPropertyKey: 'androidChannelSoundUsage', since: "1.1.0"},
    sticky: {newPropertyKey: 'androidOngoing', since: "1.1.0"},
    ongoing: {newPropertyKey: 'androidOngoing', since: "1.1.0"},
    summary: {newPropertyKey: 'androidSummary', since: "1.1.0"},
    timeoutAfter: {newPropertyKey: 'androidTimeoutAfter', since: "1.1.0"},
    titleCount: {newPropertyKey: 'androidTitleCount', since: "1.1.0"},
    vibrate: {newPropertyKey: 'androidChannelEnableVibration', since: "1.1.1"},
    wakeup: {newPropertyKey: 'androidWakeUpScreen', since: "1.1.0"},
}

/**
 * Setting some things before 'deviceready' event has fired.
 */
channel.onCordovaReady.subscribe(function () {
    channel.onCordovaInfoReady.subscribe(function () {
        console.log("LocalNotification: onCordovaInfoReady");

        // Set defaults
        exports._defaults = {
            ...exports._commonOptions,
            // Platform specific defaults
            ...(device.platform == 'Android' ? exports._androidSpecificOptions : exports._iOSSpecificOptions)
        };

        exports._setLaunchDetails();
    });
});

// Called after 'deviceready' event
channel.deviceready.subscribe(function () {
    console.log("LocalNotification: deviceready");
    if (!window.skipLocalNotificationReady) {
        exports.fireQueuedEvents();
    }
});

/**
 * Set the launch details if the app was launched by clicking on a toast.
 */
exports._setLaunchDetails = function () {
    exports._exec('launch', null, function (details) {
        if (details) {
            exports.launchDetails = details;
        }
    });
};

/**
 * ====================
 * Plugin methods
 * ====================
 **/

/**
 * Fire queued events once the device is ready and all listeners are registered.
 */
exports.fireQueuedEvents = function() {
    exports._exec('ready');
};

// Event listeners
// For an event, multiple listeners can be added.
exports._listeners = {};

/**
 * Overwrite default settings.
 * @param {Object} newDefaults
 */
exports.setDefaults = function (newDefaults) {
    Object.assign(this._defaults, newDefaults);
};

/**
 * Gets the default settings.
 */
exports.getDefaults = function () {
    return this._defaults;
};

/**
 * Android only: Create notification channel
 * @param {Object} options channel options
 * @param {Function} callback The function to be exec as the callback
 * @param {Object} scope The callback function's scope
 */
exports.createChannel = function (options, callback, scope) {
    options = exports._optionsWithDefaults(options)
    exports._prepareOptions(options);
    exports._exec('createChannel', options, callback, scope);
};

/**
 * Android only: Deletes a notification channel.
 * If you create a new channel with this same id, the deleted channel will be un-deleted
 * with all of the same settings it had before it was deleted
 * See: https://developer.android.com/reference/androidx/core/app/NotificationManagerCompat#deleteNotificationChannel(java.lang.String)
 *
 * @param {string} channelId Channel ID to delete. Has to be a string like "my_channel_id"
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope  The callback function's scope.
 */
exports.deleteChannel = function (channelId, callback, scope) {
    exports._exec('deleteChannel', channelId, callback, scope);
};

/**
 * Check permission to show notifications.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.hasPermission = function (callback, scope) {
    exports._exec('hasPermission', null, callback, scope);
};

/**
 * Request permission to show notifications.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.requestPermission = function (callback, scope) {
    console.log("Requesting permission");
    exports._exec('requestPermission', null, callback, scope);
};

/**
 * Android only: Check permission to schedule exact alarms.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.canScheduleExactAlarms = function (callback, scope) {
    exports._exec('canScheduleExactAlarms', null, callback, scope);
};

/**
 * Schedule notifications
 * @param {Object|Array} optionsArg The notifications to schedule
 * @param {Function} callback
 * @param {Object} scope The callback function's scope.
 * @param {Object} args Optional, can be {skipPermission: true} to skip the permission check
 */
exports.schedule = function (optionsArg, callback, scope, args) {
    let optionsList = exports._toArray(optionsArg);

    for (let i = 0; i < optionsList.length; i++) {
        let options = exports._optionsWithDefaults(optionsList[i])
        exports._prepareOptions(options);
        // Store back the prepared options
        optionsList[i] = options;
    }

    // Filter out notifications where the trigger time is in the past
    // On iOS notifications are ignored if the trigger time is in the past, so filter
    // them already here out
    optionsList = optionsList.filter((options) => {

        // Don't filter out, if trigger.at is not set
        if (!options.trigger || !options.trigger.at) {
            return true;
        }

        // Calculate difference to now
        const triggerAtDiff = options.trigger.at - new Date().getTime();

        // Trigger time is in the future don't filter out
        if (triggerAtDiff > 0) return true;

        // Trigger time is in the past, filter out
        console.warn("Notification trigger time is in the past, ignoring it, options=", JSON.stringify(options));

        return false;
    });

    // Skip permission check if requested and schedule directly
    if (args && args.skipPermission) {
        console.log("Skip permission check");
        exports._exec('schedule', optionsList, callback, scope);

        // Ask for permission
    } else {
        exports.requestPermission((granted) => {
            console.log("Permission granted=" + granted);

            if (!granted) {
                if (callback) callback.call(scope || this, false);
                return;
            }

            exports._exec('schedule', optionsList, callback, scope);
        }, this);
    }
};

/**
 * Update notifications
 * @param {Object|Array} options The notifications to update
 * @param {Function} callback
 * @param {Object} scope The callback function's scope.
 * @param {Object} args Optional, can be {skipPermission: true} to skip the permission check
 */
exports.update = function (options, callback, scope, args) {
    const optionsList = exports._toArray(options);

    for (const options of optionsList) {
        // Correct renamed properties and don't merge defaults
        // The defaults are not merged, because otherwise, some values
        // could be set back to a default value
        exports._prepareOptions(options);
    }

    // Skip permission check if requested and update directly
    if (args && args.skipPermission) {
        exports._exec('update', optionsList, callback, scope);

        // Ask for permission
    } else {
        exports.requestPermission((granted) => {
            if (!granted) {
                if (callback) callback.call(scope || this, false);
                return;
            }
    
            exports._exec('update', optionsList, callback, scope);
        }, this);
    }
};

/**
 * Clear one or multiple notifications by id/ids
 * @param {Array<number>|number} ids One Id or an array of Ids
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.clear = function (ids, callback, scope) {
    exports._exec('clear', exports._convertIdsToNumbers(ids), callback, scope);
};

/**
 * Clear all triggered notifications.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.clearAll = function (callback, scope) {
    exports._exec('clearAll', null, callback, scope);
};

/**
 * Clear one or multiple notifications by id/ids
 * @param {Array<number>|number} ids One Id or an array of Ids
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.cancel = function (ids, callback, scope) {
    exports._exec('cancel', exports._convertIdsToNumbers(ids), callback, scope);
};

/**
 * Cancel all scheduled notifications.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.cancelAll = function (callback, scope) {
    exports._exec('cancelAll', null, callback, scope);
};

/**
 * Check if a notification is present.
 * @param {number} id The ID of the notification.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.isPresent = function (id, callback, scope) {
    exports.getType(id, function (type) {
        exports._callbackWithScope(callback, scope)(type != 'unknown');
    });
};

/**
 * Check if a notification is scheduled.
 * @param {Int} id The ID of the notification.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.isScheduled = function (id, callback, scope) {
    exports.hasType(id, 'scheduled', callback, scope);
};

/**
 * Check if a notification was triggered.
 * @param {Int} id The ID of the notification.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.isTriggered = function (id, callback, scope) {
    exports.hasType(id, 'triggered', callback, scope);
};

/**
 * Check if a notification has a given type.
 * @param {number} id The ID of the notification.
 * @param {string} type The type of the notification.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.hasType = function (id, type, callback, scope) {
    exports.getType(id, function (type2) {
        exports._callbackWithScope(callback, scope)(type == type2);
    });
};

/**
 * Get the type (triggered, scheduled) for the notification.
 * @param {number} id The ID of the notification.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.getType = function (id, callback, scope) {
    exports._exec('type', id, callback, scope);
};

/**
 * List of all notification ids.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.getIds = function (callback, scope) {
    exports._exec('ids', 0, callback, scope);
};

/**
 * List of all scheduled notification IDs.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.getScheduledIds = function (callback, scope) {
    exports._exec('ids', 1, callback, scope);
};

/**
 * List of all triggered notification IDs.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.getTriggeredIds = function (callback, scope) {
    exports._exec('ids', 2, callback, scope);
};

/**
 * List of local notifications specified by id.
 * If called without IDs, all notification will be returned.
 *
 * @param [ Array<Int> ] ids      The IDs of the notifications.
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.get = function () {
    var args = Array.apply(null, arguments);

    if (typeof args[0] == 'function') {
        args.unshift([]);
    }

    var ids = args[0], callback = args[1], scope = args[2];

    if (!Array.isArray(ids)) {
        this._exec('notification', Number(ids), callback, scope);
        return;
    }

    this._exec('notifications', [3, exports._convertIdsToNumbers(ids)], callback, scope);
};

/**
 * List for all notifications.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.getAll = function (callback, scope) {
    this._exec('notifications', 0, callback, scope);
};

/**
 * List of all scheduled notifications.
 *
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 */
exports.getScheduled = function (callback, scope) {
    this._exec('notifications', 1, callback, scope);
};

/**
 * List of all triggered notifications.
 *
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 */
exports.getTriggered = function (callback, scope) {
    this._exec('notifications', 2, callback, scope);
};

/**
 * Adds an action group with actions.
 * @param {string} actionsGroupId
 * @param {Array} actions The actions to add for the groupId
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.addActions = function (actionsGroupId, actions, callback, scope) {
    this._exec('actions', [0, actionsGroupId, actions], callback, scope);
};

/**
 * Remove an actions group.
 * @param {string} actionsGroupId
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.removeActions = function (actionsGroupId, callback, scope) {
    this._exec('actions', [1, actionsGroupId], callback, scope);
};

/**
 * Check if a group of actions is defined.
 * @param {string} actionsGroupId
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.hasActions = function (actionsGroupId, callback, scope) {
    this._exec('actions', [2, actionsGroupId], callback, scope);
};

/**
 * Open native settings to enable notifications.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.openNotificationSettings = function (callback, scope) {
    this._exec('openNotificationSettings', null, callback, scope);
};

/**
 * Android only: Open native settings to enable alarms & reminders.
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.openAlarmSettings = function (callback, scope) {
    this._exec('openAlarmSettings', null, callback, scope);
};

/**
 * iOS only: Clear the badge of the app icon.
 * @param {Function} callback 
 * @param {Object} scope 
 */
exports.iOSClearBadge = function (callback, scope) {
    this._exec('clearBadge', null, callback, scope);
}

/**
 * Android only: Returns the status of Unused App Restrictions.
 * @param {Function} successCallback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.getUnusedAppRestrictionsStatus = function (successCallback, scope) {
    exports._exec('getUnusedAppRestrictionsStatus', null, successCallback, scope);
}

/**
 * Android only: Redirects the user to manage their unused app restriction settings.
 * @param {Function} successCallback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 */
exports.openManageUnusedAppRestrictions = function (successCallback, scope) {
    exports._exec('openManageUnusedAppRestrictions', null, successCallback, scope);
}

/**
 * Register callback for a given event.
 * @param {string} event The name of the event.
 * @param {Function|string} callback The function to be exec as callback or the
 * method name on the scope, which should be called.
 * @param {Object} scope The callback function's scope.
 */
exports.on = function (event, callback, scope) {
    // If callback is a string, a method on the scope schould be called
    if (typeof callback !== 'function' && typeof callback !== 'string') return;

    // Create empty array, if there are no listeners already
    if (!this._listeners[event]) this._listeners[event] = [];

    this._listeners[event].push([callback, scope || window]);
};

/**
 * Unregister callback for given event
 * @param {string} event The name of the event
 * @param {Function|string} callback Callback or method name for the scope, which should be unregistered
 */
exports.un = function (event, callback) {
    // No listeners added to this event
    if (!this._listeners[event]) return;
    // Remove all listeners by callback or method name
    this._listeners[event] = this._listeners[event].filter((listener) => listener[0] != callback);
};

/**
 * Fire the event with given arguments.
 * @param {string} event The event's name.
 * @param {...Object} args The callback's arguments. The first element, can be the options of a notification.
 */
exports.fireEvent = function (event, ...args) {
    // No listeners added for this event
    if (!this._listeners[event]) return;

    // Convert custom notification data to object
    if (args[0] && typeof args[0].data === 'string') {
        args[0].data = JSON.parse(args[0].data);
    }

    for (const listener of this._listeners[event]) {
        const callback = listener[0];
        const scope = listener[1];

        // If callback is a string, a method on the scope schould be called
        if (typeof callback === 'string') callback = scope[callback];

        callback.apply(scope, args);
    }
};

/**
 * Helper method to return the key for a value in an object.
 * @param {Object} object 
 * @param {*} value 
 * @returns {string} The key of the value in the object or {@link undefined} if not found.
 */
exports.getKey = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

/**
 * ====================
 * Internal JS Methods for handling options etc.
 * ====================
 **/

/**
 * Adds defaults to options if not present.
 * This will not merge options objects like trigger.
 * They will just be overwritten by the user options and not merged.
 * @param {*} options
 * @returns {Object} User options with defaults
 */
exports._optionsWithDefaults = function (options) {
    // Create a deep copy of defaults, so objects like trigger
    // are copied and not referenced and changes on them would
    // not impact the defaults
    return {...exports._deepCopy(exports._defaults), ...options}
}

/**
 * - Correct renamed properties
 * - Correct options to their required type
 * - Warn about wrong smallIcon uri
 * - Log unknown and deprecated properties
 * - Remove null values, because of a Android bug
 * @param {Object} options The options to convert
 */
exports._prepareOptions = function (options) {
    exports._handleDeprecatedProperties(options)

    // Convert custom data to string
    options.data = JSON.stringify(options.data)

    // No auto cancelling, if the notification is ongoing
    if (options.androidOngoing) options.androidAutoCancel = false

    exports._prepareTrigger(options);
    exports._prepareActions(options);
    exports._prepareAndroidProgressBar(options);

    // Convert Enums
    // Android: alarmType string to integer
    if (typeof options.androidAlarmType === 'string') {
        options.androidAlarmType = exports._androidAlarmTypes[options.androidAlarmType]
    }

    // Android: channelImportance string to integer
    if (typeof options.androidChannelImportance === 'string') {
        options.androidChannelImportance = exports._androidChannelImportanceTypes[options.androidChannelImportance]
    }

    // Due to a Android bug, null values have to be removed
    exports._removeNullValues(options);
    exports._logUnknownProperties(options);
};

/**
 * Corrects renamed properties since Plugin version 1.1.0
 * @param {Oject} options 
 */
exports._handleDeprecatedProperties = function (options) {
    if (device.platform == "Android") {

        // text as Array to androidMessages, since 1.1.0
        if (Array.isArray(options.text)) {
            options.androidMessages = options.text
            console.log("Property 'text' as array is deprecated since version 1.1.0. Use 'androidMessages' instead.")
        }

        // clock: boolean to androidShowWhen: boolean, since 1.1.0
        if (typeof options.clock === 'boolean') {
            options.androidShowWhen = options.clock
            console.log("Property 'clock: boolean' is deprecated since version 1.1.0. Use 'androidShowWhen: boolean' instead.")
        }

        // "clock: 'chronometer'" to androidUsesChronometer: true, since 1.1.0
        if (options.clock == "chronometer") {
            options.androidUsesChronometer = true
            console.log("Property 'clock: 'chronometer'' is deprecated since version 1.1.0. Use 'androidUsesChronometer: true' instead.")
        }

        // led replaced by androidChannelEnableLights, since Android 8
        if (options.led) options.androidChannelEnableLights = true

        // priority changed to androidChannelImportance, androidAlarmType and androidAllowWhileIdle
        this._androidHandleOldPropertyPriority(options)
    }

    // sound: true changed to sound: "default", since 1.1.0
    if (options.sound === true) {
        options.sound = "default"
        console.log(`Property "sound: true" is deprecated since version 1.1.0. Use "sound: 'default'" instead.`)
    }

    // sound: false changed to sound: null, since 1.1.0
    if (options.sound === false) {
        options.sound = null
        console.log(`Property "sound: false" is deprecated since version 1.1.0. Use "sound: null" instead`)
    }

    // Handle renamed and removed properties
    // Log deprecated properties
    for (const key in options) {

        // Check if the property is deprecated
        const deprecatedProperty = this._deprecatedProperties[key];

        // Property not deprecated
        if (!deprecatedProperty) continue

        let message;

        // Check if propert is renamed
        if (deprecatedProperty.newPropertyKey) {
            message = `Use "${deprecatedProperty.newPropertyKey}" instead.`
            // Set deprecated property value to new property
            options[deprecatedProperty.newPropertyKey] = options[key]

            // Property was removed
        } else if (deprecatedProperty.removed) {
            message = `Property removed`
        }

        if (deprecatedProperty.additionalMessage) {
            message += ` ${deprecatedProperty.additionalMessage}`
        }

        console.warn(`Property "${key}" is deprecated since version ${deprecatedProperty.since}. ${message}`)
    }
}

/**
 * Android: Backward compatibility for property priority.
 * Replaced by androidChannelImportance, androidAlarmType and androidAllowWhileIdle
 * Removed in plugin version 1.1.0
 * If priority is present, it will set androidAlarmType and androidAllowWhileIdle, but not androidChannelImportance.
 * @param {Object} options
 */
exports._androidHandleOldPropertyPriority = function (options) {
    let priority = options.priority || options.prio;

    // Old property not found
    if (priority === undefined) return

    if (typeof priority === 'string') {
        priority = { min: -2, low: -1, high: 1, max: 2 }[priority] || 0;
    }

    if (options.foreground === true) {
        priority = Math.max(priority, 1);
    }

    if (options.foreground === false) {
        priority = Math.min(priority, 0);
    }

    // PRIORITY_MIN and PRIORITY_LOW
    if (priority < 0) {
        options.androidAlarmType = "RTC"
        options.androidAllowWhileIdle = false

        // PRIORITY_DEFAULT and PRIORITY_HIGH
    } else if (priority < 2) {
        options.androidAlarmType = "RTC_WAKEUP"
        options.androidAllowWhileIdle = false

        // PRIORITY_MAX
    } else {
        options.androidAlarmType = "RTC_WAKEUP"
        options.androidAllowWhileIdle = true
    }

    options.priority = priority;
};

/**
 * Convert the passed values to their required type, modifying them
 * directly for Android and passing the converted list back for iOS.
 *
 * @param [ Map ] options Set of custom values.
 *
 * @return [ Map ] Interaction object with category & actions.
 */
exports._prepareActions = function (options) {
    // options.actions is a string or not set
    if (!options.actions || typeof options.actions === 'string') return options;

    let actions = [];

    for (const action of options.actions) {
        if (!action.id) {
            console.warn('Action with title ' + action.title + ' ' +
                         'has no id and will not be added.');
            continue;
        }

        action.id = action.id.toString();
        actions.push(action);
    }

    options.actions = actions;

    return options;
};

/**
 * Convert the passed values for the trigger to their required type.
 * @param {Object} options
 * @return {Object} Converted options
 */
exports._prepareTrigger = function (options) {
    let trigger = options.trigger || {};

    // Set trigger type
    if (!trigger.type) trigger.type = trigger.center ? "location" : "calendar";

    if (trigger.type == "calendar") {
        // Set default trigger time at now if nothing is set
        if (!trigger.at && !trigger.in && !trigger.every) trigger.at = new Date().getTime();

        // Convert dates to numbers
        if (trigger.at) trigger.at = exports._dateToNumber(trigger.at);
        if (trigger.firstAt) trigger.firstAt = exports._dateToNumber(trigger.firstAt);
        if (trigger.before) trigger.before = exports._dateToNumber(trigger.before);
        if (trigger.after) trigger.after = exports._dateToNumber(trigger.after);

        // On iOS notifications will be ignored if the trigger time is in the past
        // Correct trigger.at if trigger time is maximum 5 seconds in the past
        if (trigger.at) {
            // Calculate the difference to now
            const triggerAtDiff = trigger.at - new Date().getTime();

            // Only correct if maximum 5 seconds in the past
            if (triggerAtDiff > -5000 && triggerAtDiff <= 0) {
                // Set it a little bit in the future so it will be definitely triggered
                trigger.at = new Date().getTime() + 5000;
                console.log("Correct trigger.at 5 seconds in the future because it was a bit in the past, new trigger.at=" + trigger.at);
            }
        }

        //  Warning that trigger.count is not supported on iOS
        if (device.platform == 'iOS' && trigger.count) {
            console.warn('trigger.count is not supported on iOS.');
        }

        // Location trigger, set defaults
    } else {
        trigger.notifyOnEntry = !!trigger.notifyOnEntry;
        trigger.notifyOnExit = trigger.notifyOnExit === true;
        trigger.radius = trigger.radius || 5;
        trigger.single = !!trigger.single;
    }

    options.trigger = trigger;

    return options;
};

/**
 * Convert the passed values for the progressBar to their required type.
 * @param {Object} options
 */
exports._prepareAndroidProgressBar = function (options) {
    if (!options.androidProgressBar) return

    let progressBar = options.androidProgressBar
    progressBar.value = progressBar.value || 0;
    progressBar.maxValue = progressBar.maxValue || 100;
    progressBar.indeterminate = progressBar.indeterminate || false;

    // Show the Notification#when field as a stopwatch
    if (options.androidShowWhen) options.androidUsesChronometer = true;
};

/**
 * On Android exists the bug, that when using JSONObject.optString("key", null),
 * it will return "NULL" as string and not plain null. This function removes
 * all null values, to workaround this. If this is also a problem on iOS, is not known.
 * 
 * See: https://stackoverflow.com/questions/18226288/json-jsonobject-optstring-returns-string-null
 * @param {Object} options 
 */
exports._removeNullValues = function (options) {
    for (const key in options) {
        if (options[key] === null) delete options[key];
    }
}

/**
 * Warns about unknown properties in options
 * @param {Object} options
 */
exports._logUnknownProperties = function (options) {
    for (const key in options) {
        // Check if property is missing in defaults and is not a deprecated property
        if (this._defaults[key] === undefined &&  this._deprecatedProperties[key] === undefined) {
            console.warn('Unknown property: ' + key);
        }
    }
}

/**
 * Create a callback function to get executed within a specific scope.
 *
 * @param {Function} callback The function to be exec as the callback.
 * @param {Object} scope The callback function's scope.
 * @return {Function} The callback function.
 */
exports._callbackWithScope = function (callback, scope) {
    if (typeof callback != 'function') return;

    return function () {
        callback.apply(scope || this, arguments);
    };
};

/**
 * Convert the IDs to numbers.
 * @param {Array|Object} ids Will be turned into an array, if it's not already.
 * @return {Array<Number>}
 */
exports._convertIdsToNumbers = function (ids) {
    return exports._toArray(ids).map((id) => Number(id))
};

/**
 * Execute the native counterpart.
 *
 * @param [ String ]  action   The name of the action.
 * @param [ Array ]   args     Array of arguments.
 * @param [ Function] callback The callback function.
 * @param [ Object ] scope     The scope for the function.
 *
 * @return [ Void ]
 */
exports._exec = function (action, options, callback, scope) {
    exec(
        exports._callbackWithScope(callback, scope),
        null,
        'LocalNotification',
        action,
        // Convert options to array, if not already
        options === null ? [] : this._toArray(options)
    );
};

/**
 * First found value for the given keys.
 * @param {Object} options
 * @param {...string} findkeys Keys to find
 * @returns {*|void} The first found value or undefined
 */
exports._getValueFor = function (options, ...findKeys) {
    for (const findKey of findKeys) {
        if (options.hasOwnProperty(findKey)) return options[findKey];
    }

    return undefined;
};

/**
 * Convert a value to an array, if it is not already an array.
 *
 * @param {Object|Array} object Any kind of object, or an array.
 * @return {Array} An array with the object as first item or the object itself, if it's already an array.
 */
exports._toArray = function (object) {
    return Array.isArray(object) ? object : [object];
};

exports._deepCopy = function (object) {
    return JSON.parse(JSON.stringify(object));
};

exports._dateToNumber = function (date) {
    return date instanceof Date ? date.getTime() : date;
};