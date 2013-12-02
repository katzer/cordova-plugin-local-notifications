/**
 *  locale-notification.js
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 10/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

var LocalNotification = function () {

};

LocalNotification.prototype = {
    /**
     * Fügt einen neuen Eintrag zur Registry hinzu.
     *
     * @param {Object} options
     * @return {Number} Die ID der Notification
     */
    add: function (options) {
        var defaults = {
            date:       new Date(),
            message:    '',
            title:      '',
            badge:      0,
            id:         0,
            repeat:     '',
            background: undefined,
            foreground: undefined
        };

        switch (device.platform) {
            case 'Android':
                defaults.icon = 'icon';
                defaults.sound = 'TYPE_NOTIFICATION'; break;
            case 'iOS':
                defaults.sound = ''; break;
            case 'WinCE': case 'Win32NT':
                defaults.smallImage = null;
                defaults.image = null;
                defaults.wideImage = null;
        };

        var callbackFn = function (cmd) {
            eval(cmd);
        };

        for (var key in defaults) {
            if (options[key] !== undefined) {
                defaults[key] = options[key];
            }
        }

        if (defaults.id) {
            defaults.id = defaults.id.toString();
        }

        if (typeof defaults.date == 'object') {
            defaults.date = Math.round(defaults.date.getTime()/1000);
        }

        cordova.exec(callbackFn, null, 'LocalNotification', 'add', [defaults]);

        return defaults.id;
    },

    /**
     * Entfernt die angegebene Notification.
     *
     * @param {String} id
     */
    cancel: function (id) {
        cordova.exec(null, null, 'LocalNotification', 'cancel', [id.toString()]);
    },

    /**
     * Entfernt alle registrierten Notifications.
     */
    cancelAll: function () {
        cordova.exec(null, null, 'LocalNotification', 'cancelAll', []);
    }
};

var plugin = new LocalNotification();

module.exports = plugin;
