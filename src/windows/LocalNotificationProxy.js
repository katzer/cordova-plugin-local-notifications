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
    ActivationKind    = Windows.ApplicationModel.Activation.ActivationKind;

var impl  = new LocalNotificationProxy.LocalNotificationProxy();

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

    success();
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
        e     = { event: event };

    if (input && input.size > 0) {
        var it = input.first();

        e.text = it.current.value;

        while (it.hasCurrent) {
            e[it.current.key] = it.current.value;
            it.moveNext();
        }
    }

    cordova.plugins.notification.local.core.fireEvent(event, toast, e);
};

// Handle onclick event
document.addEventListener('activated', function (e) {
    if (e.kind == ActivationKind.toastNotification) {
        exports.clicked(e.raw.argument, e.raw.userInput);
    }
}, false);

cordova.commandProxy.add('LocalNotification', exports);
