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
            autoCancel: false,
            ongoing:    false,
            badge:      0,
            id:         '0',
            json:       '',
            repeat:     ''
        };

        switch (device.platform) {
            case 'Android':
                defaults.icon = 'icon';
                defaults.smallIcon = null;
                defaults.sound = 'TYPE_NOTIFICATION'; break;
            case 'iOS':
                defaults.sound = ''; break;
            case 'WinCE': case 'Win32NT':
                defaults.smallImage = null;
                defaults.image = null;
                defaults.wideImage = null;
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

        cordova.exec(null, null, 'LocalNotification', 'add', [defaults]);

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
    },

    /**
     * Occurs when a notification was added.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    onadd: function (id, state, json) {},

    /**
     * Occurs when the notification is triggered.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    ontrigger: function (id, state, json) {},

    /**
     * Fires after the notification was clicked.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    onclick: function (id, state, json) {},

    /**
     * Fires if the notification was canceled.
     *
     * @param {String} id    The ID of the notification
     * @param {String} state Either "foreground" or "background"
     * @param {String} json  A custom (JSON) string
     */
    oncancel: function (id, state, json) {}
};

var plugin = new LocalNotification();

module.exports = plugin;
