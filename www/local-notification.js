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
     */
    add: function (options) {
        var defaults = {
            date:       false,
            message:    '',
            title:      '',
            badge:      0,
            id:         0,
            sound:      '', // nur iOS
            background: '',
            foreground: ''
        };

        for (var key in defaults) {
            if (options[key] !== undefined) {
                defaults[key] = options[key];
            }
        }

        if (typeof defaults.date == 'object') {
            defaults.date = Math.round(defaults.date.getTime()/1000);
        }

        cordova.exec(null, null, 'LocalNotification','add', [defaults]);
    },

    /**
     * Entfernt die angegebene Notification.
     *
     * @param {String} id
     */
    cancel: function (id) {
        cordova.exec(null, null, 'LocalNotification', 'cancel', [id]);
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