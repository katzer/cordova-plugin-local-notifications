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

var exec = require('cordova/exec');

/**
 * Check permission to show notifications.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.hasPermission = function (callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    exec(fn, null, 'LocalNotification', 'check', []);
};

/**
 * Request permission to show notifications.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.requestPermission = function (callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    exec(fn, null, 'LocalNotification', 'request', []);
};

/**
 * Schedule notifications.
 *
 * @param [ Array ]    notifications The notifications to schedule.
 * @param [ Function ] callback      The function to be exec as the callback.
 * @param [ Object ]   scope         The callback function's scope.
 * @param [ Object ]   args          Optional flags how to schedule.
 *
 * @return [ Void ]
 */
exports.schedule = function (msgs, callback, scope, args) {
    var fn = function (granted) {

        if (!granted) return;

        var notifications = Array.isArray(msgs) ? msgs : [msgs];

        for (var i = 0; i < notifications.length; i++) {
            var notification = notifications[i];

            this.mergeWithDefaults(notification);
            this.convertProperties(notification);
        }

        this.exec('schedule', notifications, callback, scope);
    };

    if (args && args.skipPermission) {
        fn.call(this, true);
    } else {
        this.requestPermission(fn, this);
    }
};

/**
 * Schedule notifications.
 *
 * @param [ Array ]    notifications The notifications to schedule.
 * @param [ Function ] callback      The function to be exec as the callback.
 * @param [ Object ]   scope         The callback function's scope.
 * @param [ Object ]   args          Optional flags how to schedule.
 *
 * @return [ Void ]
 */
exports.update = function (msgs, callback, scope, args) {
    var fn = function(granted) {

        if (!granted) return;

        var notifications = Array.isArray(msgs) ? msgs : [msgs];

        for (var i = 0; i < notifications.length; i++) {
            var notification = notifications[i];

            this.convertProperties(notification);
        }

        this.exec('update', notifications, callback, scope);
    };

    if (args && args.skipPermission) {
        fn.call(this, true);
    } else {
        this.requestPermission(fn, this);
    }
};

/**
 * Clear the specified notifications by id.
 *
 * @param [ Array<Int> ] ids      The IDs of the notifications.
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.clear = function (ids, callback, scope) {
    ids = Array.isArray(ids) ? ids : [ids];
    ids = this.convertIds(ids);

    this.exec('clear', ids, callback, scope);
};

/**
 * Clear all triggered notifications.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.clearAll = function (callback, scope) {
    this.exec('clearAll', null, callback, scope);
};

/**
 * Clear the specified notifications by id.
 *
 * @param [ Array<Int> ] ids      The IDs of the notifications.
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.cancel = function (ids, callback, scope) {
    ids = Array.isArray(ids) ? ids : [ids];
    ids = this.convertIds(ids);

    this.exec('cancel', ids, callback, scope);
};

/**
 * Cancel all scheduled notifications.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.cancelAll = function (callback, scope) {
    this.exec('cancelAll', null, callback, scope);
};

/**
 * Check if a notification is present.
 *
 * @param [ Int ]      id       The ID of the notification.
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.isPresent = function (id, callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    this.getType(id, function (type) {
        fn(type != 'unknown');
    });
};

/**
 * Check if a notification has a given type.
 *
 * @param [ Int ]      id       The ID of the notification.
 * @param [ String ]   type     The type of the notification.
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.hasType = function (id, type, callback, scope) {
    var fn = this.createCallbackFn(callback, scope);

    this.getType(id, function (type2) {
        fn(type == type2);
    });
};

/**
 * Get the type (triggered, scheduled) for the notification.
 *
 * @param [ Int ]      id       The ID of the notification.
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.getType = function (id, callback, scope) {
    this.exec('type', id, callback, scope);
};

/**
 * List of all notification ids.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.getIds = function (callback, scope) {
    this.exec('ids', null, callback, scope);
};

/**
 * List of all scheduled notification IDs.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.getScheduledIds = function (callback, scope) {
    this.exec('scheduledIds', null, callback, scope);
};

/**
 * List of all triggered notification IDs.
 *
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.getTriggeredIds = function (callback, scope) {
    this.exec('triggeredIds', null, callback, scope);
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

    var ids      = args[0],
        callback = args[1],
        scope    = args[2];

    if (!Array.isArray(ids)) {
        this.exec('notification', Number(ids), callback, scope);
        return;
    }

    ids = this.convertIds(ids);

    this.exec('notifications', ids, callback, scope);
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
    this.exec('notifications', null, callback, scope);
};

/**
 * List of all scheduled notifications.
 *
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 */
exports.getScheduled = function (callback, scope) {
    this.exec('scheduledNotifications', null, callback, scope);
};

/**
 * List of all triggered notifications.
 *
 * @param [ Function ]   callback The function to be exec as the callback.
 * @param [ Object ]     scope    The callback function's scope.
 */
exports.getTriggered = function (callback, scope) {
    this.exec('triggeredNotifications', null, callback, scope);
};

/**
 * Register an group of actions by id.
 *
 * @param [ String ]   id       The Id of the group.
 * @param [ Array]     actions  The action config settings.
 * @param [ Function ] callback The function to be exec as the callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.addActionGroup = function (id, actions, callback, scope) {
    var config = { actionGroupId: id, actions: actions };
    this.exec('registerCategory', config, callback, scope);
};

/**
 * The (platform specific) default settings.
 *
 * @return [ Object ]
 */
exports.getDefaults = function () {
    return this._defaults;
};

/**
 * Overwrite default settings.
 *
 * @param [ Object ] newDefaults New default values.
 *
 * @return [ Void ]
 */
exports.setDefaults = function (newDefaults) {
    var defaults = this.getDefaults();

    for (var key in defaults) {
        if (newDefaults.hasOwnProperty(key)) {
            defaults[key] = newDefaults[key];
        }
    }
};

/**
 * Register callback for given event.
 *
 * @param [ String ]   event    The name of the event.
 * @param [ Function ] callback The function to be exec as callback.
 * @param [ Object ]   scope    The callback function's scope.
 *
 * @return [ Void ]
 */
exports.on = function (event, callback, scope) {

    if (typeof callback !== "function")
        return;

    if (!this._listener[event]) {
        this._listener[event] = [];
    }

    var item = [callback, scope || window];

    this._listener[event].push(item);
};

/**
 * Unregister callback for given event.
 *
 * @param [ String ]   event    The name of the event.
 * @param [ Function ] callback The function to be exec as callback.
 *
 * @return [ Void ]
 */
exports.un = function (event, callback) {
    var listener = this._listener[event];

    if (!listener)
        return;

    for (var i = 0; i < listener.length; i++) {
        var fn = listener[i][0];

        if (fn == callback) {
            listener.splice(i, 1);
            break;
        }
    }
};
