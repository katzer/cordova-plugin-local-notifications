/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var exec    = require('cordova/exec'),
    channel = require('cordova/channel');


// Called after 'deviceready' event
channel.deviceready.subscribe( function () {
    // Device is ready now, the listeners are registered
    // and all queued events can be executed.
    exec(null, null, 'LocalNotification', 'deviceready', []);
});

// Called before 'deviceready' event
channel.onCordovaReady.subscribe( function () {
    // The cordova device plugin is ready now
    channel.onCordovaInfoReady.subscribe( function () {
        if (device.platform == 'Android') {
            channel.onPause.subscribe( function () {
                // Necessary to set the state to `background`
                exec(null, null, 'LocalNotification', 'pause', []);
            });

            channel.onResume.subscribe( function () {
                // Necessary to set the state to `foreground`
                exec(null, null, 'LocalNotification', 'resume', []);
            });

            // Necessary to set the state to `foreground`
            exec(null, null, 'LocalNotification', 'resume', []);
        }

        // Merges the platform specific properties into the default properties
        exports.applyPlatformSpecificOptions();
    });
});


/**
 * @private
 *
 * Default values.
 */
exports._defaults = {
    message:    '',
    title:      '',
    autoCancel: false,
    badge:      -1,
    id:         '0',
    json:       '',
    repeat:     '',
    date:       undefined
};


/**
 * Returns the default settings
 *
 * @return {Object}
 */
exports.getDefaults = function () {
    return this._defaults;
};

/**
 * Overwrite default settings
 *
 * @param {Object} defaults
 */
exports.setDefaults = function (newDefaults) {
    var defaults = this.getDefaults();

    for (var key in defaults) {
        if (newDefaults[key] !== undefined) {
            defaults[key] = newDefaults[key];
        }
    }
};

/**
 * Add a new entry to the registry
 *
 * @param {Object} opts
 *      The notification properties
 * @param {Function} callback
 *      A function to be called after the notification has been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.add = function (opts, callback, scope) {
    this.registerPermission(function(granted) {

        if (!granted)
            return;

        var notifications = Array.isArray(opts) ? opts : [opts];

        for (var i = 0; i < notifications.length; i++) {
            var properties = notifications[i];

            this.mergeWithDefaults(properties);
            this.convertProperties(properties);
        }

        this.exec('add', notifications, callback, scope);
    }, this);
};

/**
 * Update existing notifications specified by IDs in options.
 *
 * @param {Object} options
 *      The notification properties to update
 * @param {Function} callback
 *      A function to be called after the notification has been updated
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.update = function (opts, callback, scope) {
    var notifications = Array.isArray(opts) ? opts : [opts];

    for (var i = 0; i < notifications.length; i++) {
        var properties = notifications[i];

        this.convertUpdateProperties(properties);
    }

    this.exec('update', notifications, callback, scope);
};

/**
 * Clear the specified notification.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A function to be called after the notification has been cleared
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.clear = function (ids, callback, scope) {
    ids = Array.isArray(ids) ? ids : [ids];

    ids = this.convertIds(ids);

    this.exec('clear', ids, callback, scope);
};

/**
 * Clear all previously sheduled notifications.
 *
 * @param {Function} callback
 *      A function to be called after all notifications have been cleared
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.clearAll = function (callback, scope) {
    this.exec('clearAll', null, callback, scope);
};

/**
 * Cancel the specified notifications.
 *
 * @param {String[]} ids
 *      The IDs of the notifications
 * @param {Function} callback
 *      A function to be called after the notifications has been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.cancel = function (ids, callback, scope) {

    ids = Array.isArray(ids) ? ids : [ids];

    ids = this.convertIds(ids);

    this.exec('cancel', ids, callback, scope);
};

/**
 * Remove all previously registered notifications.
 *
 * @param {Function} callback
 *      A function to be called after all notifications have been canceled
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.cancelAll = function (callback, scope) {
    this.exec('cancelAll', null, callback, scope);
};

/**
 * Check if a notification with an ID exists.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.exist = function (id, callback, scope) {
    var notId = (id || '0').toString();

    this.exec('exist', notId, callback, scope);
};

/**
 * Alias for `exist`.
 */
exports.exists = function () {
    this.exist.apply(this, arguments);
};

/**
 * Check if a notification with an ID is scheduled.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.isScheduled = function (id, callback, scope) {
    var notId = (id || '0').toString();

    this.exec('isScheduled', notId, callback, scope);
};

/**
 * Check if a notification with an ID was triggered.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.isTriggered = function (id, callback, scope) {
    var notId = (id || '0').toString();

    this.exec('isTriggered', notId, callback, scope);
};

/**
 * List all local notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllIds = function (callback, scope) {
    this.exec('getAllIds', null, callback, scope);
};

/**
 * Alias for `getAllIds`.
 */
exports.getIds = function () {
    this.getAllIds.apply(this, arguments);
};

/**
 * List all scheduled notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getScheduledIds = function (callback, scope) {
    this.exec('getScheduledIds', null, callback, scope);
};

/**
 * List all triggered notification IDs.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getTriggeredIds = function (callback, scope) {
    this.exec('getTriggeredIds', null, callback, scope);
};

/**
 * Property list for given local notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.get = function () {
    var args = Array.apply(null, arguments);

    if (typeof args[0] == 'function') {
        args.unshift([]);
    }

    var ids      = args[0],
        callback = args[1],
        scope    = args[2];

    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    ids = this.convertIds(ids);

    this.exec('getAll', ids, callback, scope);
};

/**
 * Property list for all local notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAll = function (callback, scope) {
    this.exec('getAll', null, callback, scope);
};

/**
 * Property list for given scheduled notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getScheduled = function () {
    var args = Array.apply(null, arguments);

    if (typeof args[0] == 'function') {
        args.unshift([]);
    }

    var ids      = args[0],
        callback = args[1],
        scope    = args[2];

    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    ids = this.convertIds(ids);

    this.exec('getScheduled', ids, callback, scope);
};

/**
 * Retrieve the properties for all scheduled notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllScheduled = function (callback, scope) {
    this.exec('getScheduled', null, callback, scope);
};

/**
 * Property list for given triggered notifications.
 * If called without IDs, all notification will be returned.
 *
 * @param {Number[]?} ids
 *      Set of notification IDs
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getTriggered = function () {
    var args = Array.apply(null, arguments);

    if (typeof args[0] == 'function') {
        args.unshift([]);
    }

    var ids      = args[0],
        callback = args[1],
        scope    = args[2];

    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    ids = this.convertIds(ids);

    this.exec('getTriggered', ids, callback, scope);
};

/**
 * Retrieve the properties for all triggered notifications.
 *
 * @param {Function} callback
 *      A callback function to be called with the list
 * @param {Object?} scope
 *      The scope for the callback function
 */
exports.getAllTriggered = function (callback, scope) {
    this.exec('getTriggered', null, callback, scope);
};

/**
 * Informs if the app has the permission to show notifications.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.hasPermission = function (callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    if (device.platform != 'iOS') {
        fn(true);
        return;
    }

    exec(fn, null, 'LocalNotification', 'hasPermission', []);
};

/**
 * Register permission to show notifications if not already granted.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.registerPermission = function (callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    if (device.platform != 'iOS') {
        fn(true);
        return;
    }

    exec(fn, null, 'LocalNotification', 'registerPermission', []);
};

/**
 * @deprecated
 *
 * Register permission to show notifications if not already granted.
 *
 * @param {Function} callback
 *      The function to be exec as the callback
 * @param {Object?} scope
 *      The callback function's scope
 */
exports.promptForPermission = function (callback, scope) {
    console.warn('Depreated: Please use `notification.local.registerPermission` instead.');

    exports.registerPermission.apply(this, arguments);
};

/**
 * Occurs when a notification was added.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.onadd = function (id, state, json, data) {};

/**
 * Occurs when the notification is triggered.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.ontrigger = function (id, state, json, data) {};

/**
 * Fires after the notification was clicked.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.onclick = function (id, state, json, data) {};

/**
 * Fires if the notification was canceled.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.oncancel = function (id, state, json, data) {};

/**
 * Get fired when the notification was cleared.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.onclear = function (id, state, json, data) {};

/**
 * Get fired when a repeating notification should be updated.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 * @return {Object} JSONObject with updatevalues
 */
exports.onupdate = function (id, state, json, data) {
	return null;
};
	
/**
 * Is called from the native part to receive the onupdate resultarray and send it back to native.
 *
 * @param {String} id
 *      The ID of the notification
 * @param {String} state
 *      Either "foreground" or "background"
 * @param {String} json
 *      A custom (JSON) string
 * @param {Object} data
 *      The notification properties
 */
exports.onupdateCall = function (id, state, json, data) {
	var updates = exports.onupdate(id, state, json, data);
	if (updates != null){
		updates.id = id;
		update(updates,null,null);
	};
};

/**
 * @private
 *
 * Merges custom properties with the default values.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @retrun {Object}
 *      The merged property list
 */
exports.mergeWithDefaults = function (options) {
    var defaults = this.getDefaults();

    options.date    = this.getValueFor(options, 'date', 'at', 'firstAt');
    options.repeat  = this.getValueFor(options, 'repeat', 'every');
    options.message = this.getValueFor(options, 'message', 'text');

    for (var key in defaults) {
        if (options[key] === null || options[key] === undefined) {
            options[key] = defaults[key];
        }
    }

    for (key in options) {
        if (!defaults.hasOwnProperty(key)) {
            delete options[key];
        }
    }

    return options;
};

/**
 * @private
 *
 * Convert the passed values to their required type.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @retrun {Object}
 *      The converted property list
 */
exports.convertProperties = function (options) {

    options.id         = options.id.toString();
    options.title      = options.title.toString();
    options.message    = options.message.toString();
    options.autoCancel = options.autoCancel === true;

    if (isNaN(options.id)) {
        options.id = this.getDefaults().id;
    }

    if (isNaN(options.badge)) {
        options.badge = this.getDefaults().badge;
    }

    options.badge = Number(options.badge);

    if (options.date === undefined || options.date === null) {
        options.date = new Date();
    }

    if (typeof options.date == 'object') {
        options.date = Math.round(options.date.getTime()/1000);
    }

    if (typeof options.json == 'object') {
        options.json = JSON.stringify(options.json);
    }

    return options;
};

/**
 * @private
 *
 * Convert the passed values to their required type only for update function.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @retrun {Object}
 *      The converted property list
 */
exports.convertUpdateProperties = function (options) {

    options.id         = options.id.toString();
    options.title      = options.title.toString();
    options.message    = options.message.toString();
    options.autoCancel = options.autoCancel === true;

    if (isNaN(options.id)) {
        options.id = this.getDefaults().id;
    }

    if (isNaN(options.badge)) {
        options.badge = this.getDefaults().badge;
    }

    options.badge = Number(options.badge);

    if (typeof options.date == 'object') {
        options.date = Math.round(options.date.getTime()/1000);
    }

    if (typeof options.json == 'object') {
        options.json = JSON.stringify(options.json);
    }

    return options;
};

/**
 * @private
 *
 * Merges the platform specific properties into the default properties.
 *
 * @return {Object}
 *      The default properties for the platform
 */
exports.applyPlatformSpecificOptions = function () {
    var defaults = this._defaults;

    switch (device.platform) {
    case 'Android':
        defaults.icon       = 'icon';
        defaults.smallIcon  = null;
        defaults.ongoing    = false;
        defaults.led        = 'FFFFFF'; /*RRGGBB*/
        defaults.sound      = 'TYPE_NOTIFICATION'; break;
    case 'iOS':
        defaults.sound      = ''; break;
    case 'WinCE': case 'Win32NT':
        defaults.smallImage = null;
        defaults.image      = null;
        defaults.wideImage  = null;
    }

    return defaults;
};

/**
 * @private
 *
 * Creates a callback, which will be executed within a specific scope.
 *
 * @param {Function} callbackFn
 *      The callback function
 * @param {Object} scope
 *      The scope for the function
 *
 * @return {Function}
 *      The new callback function
 */
exports.createCallbackFn = function (callbackFn, scope) {
    if (typeof callbackFn != 'function')
        return;

    return function () {
        callbackFn.apply(scope || this, arguments);
    };
};

/**
 * @private
 *
 * Convert the IDs to Strings.
 *
 * @param {String/Number[]} ids
 *
 * @return Array of Strings
 */
exports.convertIds = function (ids) {
    var convertedIds = [];

    for (var i = 0; i < ids.length; i++) {
        convertedIds.push(ids[i].toString());
    }

    return convertedIds;
};

/**
 * @private
 *
 * Return the first found value for the given keys.
 *
 * @param {Object} options
 *      Object with key-value properties
 *
 * @param {String[]} keys*
 *      Key list
 */
exports.getValueFor = function (options) {
    var keys = Array.apply(null, arguments).slice(1);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (options.hasOwnProperty(key)) {
            return options[key];
        }
    }
};

/**
 * @private
 *
 * Executes the native counterpart.
 *
 * @param {String} action
 *      The name of the action
 * @param args[]
 *      Array of arguments
 * @param {Function} callback
 *      The callback function
 * @param {Object} scope
 *      The scope for the function
 */
exports.exec = function (action, args, callback, scope) {
    var fn = this.createCallbackFn(callback, scope),
        params = [];

    if (Array.isArray(args)) {
        params = args;
    } else if (args) {
        params.push(args);
    }

    exec(fn, null, 'LocalNotification', action, params);
};
