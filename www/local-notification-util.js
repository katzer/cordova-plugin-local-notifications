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

var exec    = require('cordova/exec'),
    channel = require('cordova/channel');


/***********
 * MEMBERS *
 ***********/

// Default values
exports._defaults = {
    text:  '',
    title: '',
    sound: 'res://platform_default',
    badge: 0,
    id:    0,
    data:  undefined,
    every: undefined,
    at:    undefined,
    actions: undefined,
    category: undefined
};

// listener
exports._listener = {};


/********
 * UTIL *
 ********/

/**
 * Merge platform specific properties into the default ones.
 *
 * @return {Object}
 *      The default properties for the platform
 */
exports.applyPlatformSpecificOptions = function () {
    var defaults = this._defaults;

    switch (device.platform) {
    case 'Android':
        defaults.icon      = 'res://icon';
        defaults.smallIcon = 'res://ic_popup_reminder';
        defaults.ongoing   = false;
        defaults.autoClear = true;
        defaults.led       = 'FFFFFF';
        break;
    }

    return defaults;
};

/**
 * Merge custom properties with the default values.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @retrun {Object}
 *      The merged property list
 */
exports.mergeWithDefaults = function (options) {
    var defaults = this.getDefaults();

    options.at   = this.getValueFor(options, 'at', 'firstAt', 'date');
    options.text = this.getValueFor(options, 'text', 'message');
    options.data = this.getValueFor(options, 'data', 'json');

    if (defaults.hasOwnProperty('autoClear')) {
        options.autoClear = this.getValueFor(options, 'autoClear', 'autoCancel');
    }

    if (options.autoClear !== true && options.ongoing) {
        options.autoClear = false;
    }

    if (options.at === undefined || options.at === null) {
        options.at = new Date();
    }

    for (var key in defaults) {
        if (options[key] === null || options[key] === undefined) {
            if (options.hasOwnProperty(key) && ['data','sound'].indexOf(key) > -1) {
                options[key] = undefined;
            } else {
                options[key] = defaults[key];
            }
        }
    }

    for (key in options) {
        if (!defaults.hasOwnProperty(key)) {
            delete options[key];
            console.warn('Unknown property: ' + key);
        }
    }

    return options;
};

/**
 * Convert the passed values to their required type.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @retrun {Object}
 *      The converted property list
 */
exports.convertProperties = function (options) {

    if (options.id) {
        if (isNaN(options.id)) {
            options.id = this.getDefaults().id;
            console.warn('Id is not a number: ' + options.id);
        } else {
            options.id = Number(options.id);
        }
    }

    if (options.title) {
        options.title = options.title.toString();
    }

    if (options.text) {
        options.text  = options.text.toString();
    }

    if (options.badge) {
        if (isNaN(options.badge)) {
            options.badge = this.getDefaults().badge;
            console.warn('Badge number is not a number: ' + options.id);
        } else {
            options.badge = Number(options.badge);
        }
    }

    if (options.at) {
        if (typeof options.at == 'object') {
            options.at = options.at.getTime();
        }

        options.at = Math.round(options.at/1000);
    }

    if (typeof options.data == 'object') {
        options.data = JSON.stringify(options.data);
    }

    return options;
};

/**
 * Convert the passed values to their required type, modifying them
 * directly for Android and passing the converted list back for iOS.
 *
 * @param {Object} options
 *      Set of custom values
 *
 * @return {Object}
 *      The prepared interaction object w/ category & actions
 */
exports.prepareActions = function (options) {
    var MAX_ACTIONS;

    if (device.platform === 'iOS') {
        MAX_ACTIONS = 4;
    } else {
        MAX_ACTIONS = 3;
    }

    if (options.category && options.actions) {
        var interaction = { 
            category: options.category, 
            actions: [] 
        };

        for (var i = 0; i < options.actions.length && MAX_ACTIONS > 0; i++) {
            if (options.actions[i].identifier) {
                interaction.actions.push(options.actions[i]);
                MAX_ACTIONS--;
            } else {
                console.warn('Action with title ' + options.actions[i].title 
                    + ' has no identifier and will not be added.');
            }
        }

        options.actions = interaction.actions;
        return interaction;
    }
};

/**
 * Create callback, which will be executed within a specific scope.
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
 * Convert the IDs to numbers.
 *
 * @param {String/Number[]} ids
 *
 * @return Array of Numbers
 */
exports.convertIds = function (ids) {
    var convertedIds = [];

    for (var i = 0; i < ids.length; i++) {
        convertedIds.push(Number(ids[i]));
    }

    return convertedIds;
};

/**
 * First found value for the given keys.
 *
 * @param {Object} options
 *      Object with key-value properties
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
 * Fire event with given arguments.
 *
 * @param {String} event
 *      The event's name
 * @param {args*}
 *      The callback's arguments
 */
exports.fireEvent = function (event) {
    var args     = Array.apply(null, arguments).slice(1),
        listener = this._listener[event];

    if (!listener)
        return;

    for (var i = 0; i < listener.length; i++) {
        var fn    = listener[i][0],
            scope = listener[i][1];

        fn.apply(scope, args);
    }
};

/**
 * Execute the native counterpart.
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


/*********
 * HOOKS *
 *********/

// Called after 'deviceready' event
channel.deviceready.subscribe(function () {
    // Device is ready now, the listeners are registered
    // and all queued events can be executed.
    exec(null, null, 'LocalNotification', 'deviceready', []);
});

// Called before 'deviceready' event
channel.onCordovaReady.subscribe(function () {
    // Device plugin is ready now
    channel.onCordovaInfoReady.subscribe(function () {
        // Merge platform specifics into defaults
        exports.applyPlatformSpecificOptions();
    });
});
