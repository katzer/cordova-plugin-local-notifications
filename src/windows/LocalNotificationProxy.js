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

var LocalNotification = LocalNotificationProxy.LocalNotification,
       ActivationKind = Windows.ApplicationModel.Activation.ActivationKind;

var impl = new LocalNotificationProxy.LocalNotificationProxy();

/**
 * Check permission to show notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.check = function (success, error) {
    var granted = impl.hasPermission();

    success(granted);
};

/**
 * Request permission to show notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.request = function (success, error) {
    exports.check(success, error);
};

/**
 * Schedule notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 * @param [ Array ]    args    Interface arguments
 *
 * @return [ Void ]
 */
exports.schedule = function (success, error, args) {
    var options = [], actions = [];

    for (var i = 0, props, opts; i < args.length; i++) {
        props = args[i];
        opts  = new LocalNotification.Options();

        for (var prop in opts) {
            if (prop != 'actions' && props[prop]) opts[prop] = props[prop];
        }

        for (var j = 0, action, btn; j < props.actions.length; j++) {
            action = props.actions[j];

            if (!action.type || action.type == 'button') {
                btn = new LocalNotification.Button();
            } else
            if (action.type == 'input') {
                btn = new LocalNotification.Input();
            }

            for (prop in btn) {
                if (action[prop]) btn[prop] = action[prop];
            }

            actions.push(btn);
        }

        opts.actions = actions;

        options.push(opts);
    }

    impl.schedule(options);

    for (i = 0; i < options.length; i++) {
        exports.fireEvent('add', options[i]);
    }

    success();
};

/**
 * Clear all notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.clearAll = function (success, error) {
    impl.clearAll();
    exports.fireEvent('clearall');
    success();
};

/**
 * Cancel all notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.cancelAll = function (success, error) {
    impl.cancelAll();
    exports.fireEvent('cancelall');
    success();
};

/**
 * Get the type of notification.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 * @param [ Array ]    args    Interface arguments
 *
 * @return [ Void ]
 */
exports.type = function (success, error, args) {
    var type = impl.type(args[0]);

    success(type);
};

/**
 * List of all notification ids.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.ids = function (success, error) {
    var ids = impl.ids() || [];

    success(Array.from(ids));
};

/**
 * List of all scheduled notification ids.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.scheduledIds = function (success, error) {
    var ids = impl.scheduledIds() || [];

    success(Array.from(ids));
};

/**
 * List of all triggered notification ids.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.triggeredIds = function (success, error) {
    var ids = impl.triggeredIds() || [];

    success(Array.from(ids));
};

/**
 * Get a single notification by id.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 * @param [ Array ]    args    Interface arguments
 *
 * @return [ Void ]
 */
exports.notification = function (success, error, args) {
    var obj = impl.notification(args[0]);

    success(exports.clone(obj));
};

/**
 * List of (all) notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 * @param [ Array ]    args    Interface arguments
 *
 * @return [ Void ]
 */
exports.notifications = function (success, error, args) {
    var objs = impl.notifications(args) || [];

    success(exports.cloneAll(objs));
};

/**
 * List of all scheduled notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.scheduledNotifications = function (success, error) {
    var objs = impl.scheduledNotifications() || [];

    success(exports.cloneAll(objs));
};

/**
 * List of all triggered notifications.
 *
 * @param [ Function ] success Success callback
 * @param [ Function ] error   Error callback
 *
 * @return [ Void ]
 */
exports.triggeredNotifications = function (success, error) {
    var objs = impl.triggeredNotifications() || [];

    success(exports.cloneAll(objs));
};

/**
 * Inform the user through the click event that a notification was clicked.
 *
 * @param [ String ] xml The launch identifier.
 *
 * @return [ Void ]
 */
exports.clicked = function (xml, input) {
    var toast = LocalNotification.Options.parse(xml),
        event = toast.action || 'click',
        meta  = Object.assign({}, input);

    if (input && input.size > 0) {
        meta.text = input.first().current.value;
    }

    exports.fireEvent(event, toast, meta);
};

/**
 * Invoke listeners for the given event.
 *
 * @param [ String ] event The name of the event.
 * @param [ Object ] toast Optional notification object.
 * @param [ Object ] data  Optional meta data about the event.
 *
 * @return [ Void ]
 */
exports.fireEvent = function (event, toast, data) {
    var meta   = Object.assign({ event: event }, data),
        plugin = cordova.plugins.notification.local.core;

    if (toast) {
        plugin.fireEvent(event, exports.clone(toast), meta);
    } else {
        plugin.fireEvent(event, meta);
    }
};

/**
 * Clone the objects and delete internal properties.
 *
 * @param [ Array<Object> ] objs The objects to clone for.
 *
 * @return [ Array<Object> ]
 */
exports.cloneAll = function (objs) {
    var clones = [];

    for (var i = 0; i < objs.length; i++) {
        clones.push(exports.clone(objs[i]));
    }

    return clones;
};

/**
 * Clone the object and delete internal properties.
 *
 * @param [ Object ] obj The object to clone for.
 *
 * @return [ Object ]
 */
exports.clone = function (obj) {
    var ignore = ['action'],
        clone  = {};

    for (var prop in obj) {
        if (ignore.includes(prop) || typeof obj[prop] === 'function')
            continue;

        try {
            clone[prop] = obj[prop];
        } catch (e) {
            clone[prop] = null;
        }
    }

    return clone;
};

// Handle onclick event
document.addEventListener('activated', function (e) {
    if (e.kind == ActivationKind.toastNotification) {
        exports.clicked(e.raw.argument, e.raw.userInput);
    }
}, false);

cordova.commandProxy.add('LocalNotification', exports);
