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
    this._defaults = {
        message:    '',
        title:      '',
        autoCancel: false,
        badge:      0,
        id:         '0',
        json:       '',
        repeat:     ''
    };
};

LocalNotification.prototype = {
    /**
     * Gibt alle Standardeinstellungen an.
     *
     * @return {Object}
     */
    getDefaults: function () {
        return this._defaults;
    },

    /**
     * Überschreibt die Standardeinstellungen.
     *
     * @param {Object} defaults
     */
    setDefaults: function (newDefaults) {
        var defaults = this.getDefaults();

        for (var key in defaults) {
            if (newDefaults[key] !== undefined) {
                defaults[key] = newDefaults[key];
            }
        }
    },

    /**
     * @private
     * Merged die Eigenschaften mit den Standardwerten.
     *
     * @param {Object} options
     * @retrun {Object}
     */
    mergeWithDefaults: function (options) {
        var defaults = this.getDefaults();

        for (var key in defaults) {
            if (options[key] === undefined) {
                options[key] = defaults[key];
            }
        }

        return options;
    },

    /**
     * @private
     */
    applyPlatformSpecificOptions: function () {
        var defaults = this._defaults;

        switch (device.platform) {
        case 'Android':
            defaults.icon       = 'icon';
            defaults.smallIcon  = null;
            defaults.ongoing    = false;
            defaults.sound      = 'TYPE_NOTIFICATION'; break;
        case 'iOS':
            defaults.sound      = ''; break;
        case 'WinCE': case 'Win32NT':
            defaults.smallImage = null;
            defaults.image      = null;
            defaults.wideImage  = null;
        };
    },

    /**
     * Fügt einen neuen Eintrag zur Registry hinzu.
     *
     * @param {Object} options
     * @return {Number} Die ID der Notification
     */
    add: function (options) {
        var options    = this.mergeWithDefaults(options),
            callbackFn = null;

        if (options.id) {
            options.id = options.id.toString();
        }

        if (options.date === undefined) {
            options.date = new Date();
        }

        if (typeof options.date == 'object') {
            options.date = Math.round(options.date.getTime()/1000);
        }

        if (['WinCE', 'Win32NT'].indexOf(device.platform)) {
            callbackFn = function (cmd) {
                eval(cmd);
            };
        }

        cordova.exec(callbackFn, null, 'LocalNotification', 'add', [options]);

        return options.id;
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
     * @async
     *
     * Retrieves a list with all currently pending notifications.
     *
     * @param {Function} callback
     */
    getScheduledIds: function (callback) {
        cordova.exec(callback, null, 'LocalNotification', 'getScheduledIds', []);
    },

    /**
     * @async
     *
     * Checks wether a notification with an ID is scheduled.
     *
     * @param {String}   id
     * @param {Function} callback
     */
    isScheduled: function (id, callback) {
        cordova.exec(callback, null, 'LocalNotification', 'isScheduled', [id.toString()]);
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

document.addEventListener('deviceready', function () {
    plugin.applyPlatformSpecificOptions();
}, false);

module.exports = plugin;
