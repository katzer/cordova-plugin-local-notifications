/*
    Copyright 2013 appPlant UG

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
            badge:      0,
            id:         '0',
            json:       '',
            repeat:     '',
            background: '',
            foreground: ''
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
