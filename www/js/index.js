/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        app.pluginInitialize();
        app.bindNotificationEvents();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    // Initialize plugin
    pluginInitialize: function() {
        document.getElementById('granted').onclick         = app.hasPermission;
        document.getElementById('request').onclick         = app.askPermission;
        document.getElementById('sched_single').onclick    = app.scheduleSingle;
        document.getElementById('sched_multi').onclick     = app.scheduleMultiple;
        document.getElementById('sched_delayed').onclick   = app.scheduleDelayed;
        document.getElementById('sched_interval').onclick  = app.scheduleInterval;
        document.getElementById('sched_actions').onclick   = app.scheduleActions;
        document.getElementById('update_text').onclick     = app.update;
        document.getElementById('update_interval').onclick = app.updateInterval;
        document.getElementById('clear_single').onclick    = app.clearSingle;
        document.getElementById('clear_multi').onclick     = app.clearMulti;
        document.getElementById('clear_all').onclick       = app.clearAll;
        document.getElementById('cancel_single').onclick   = app.cancelSingle;
        document.getElementById('cancel_multi').onclick    = app.cancelMulti;
        document.getElementById('cancel_all').onclick      = app.cancelAll;
        document.getElementById('present?').onclick        = app.isPresent;
        document.getElementById('scheduled?').onclick      = app.isScheduled;
        document.getElementById('triggered?').onclick      = app.isTriggered;
        document.getElementById('type').onclick            = app.type;
        document.getElementById('ids').onclick             = app.ids;
        document.getElementById('scheduled_ids').onclick   = app.scheduledIds;
        document.getElementById('triggered_ids').onclick   = app.triggeredIds;
        document.getElementById('scheduled_nots').onclick  = app.scheduledNots;
        document.getElementById('triggered_nots').onclick  = app.triggeredNots;
        document.getElementById('notification').onclick    = app.notification;
        document.getElementById('multiple_nots').onclick   = app.multipleNots;
        document.getElementById('notifications').onclick   = app.notifications;
        document.getElementById('defaults').onclick        = app.setDefaultTitle;

        var details = cordova.plugins.notification.local.launchDetails;

        if (details) {
            alert('Launched by notification with ID ' + details.id);
        }
    },
    // Check permissions to read accounts
    hasPermission: function () {
        cordova.plugins.notification.local.hasPermission(function (granted) {
            showToast(granted ? 'Yes' : 'No');
        });
    },
    // Request permissions to read accounts
    askPermission: function () {
        cordova.plugins.notification.local.requestPermission(function (granted) {
            showToast(granted ? 'Yes' : 'No');
        });
    },
    // Schedule a single notification
    scheduleSingle: function () {
        cordova.plugins.notification.local.schedule({
            id: 1,
            title: 'Test Message',
            text: 'My first notification',
            icon: 'http://3.bp.blogspot.com/-Qdsy-GpempY/UU_BN9LTqSI/AAAAAAAAAMA/LkwLW2yNBJ4/s1600/supersu.png',
            smallIcon: 'res://cordova',
            sound: null,
            badge: 1,
            data: { test: 1 }
        });
    },
    // Schedule multiple notifications at once
    scheduleMultiple: function () {
        cordova.plugins.notification.local.schedule([{
            id: 1,
            text: 'Multi Message 1',
            icon: 'res://cordova'
        }, {
            id: 2,
            text: 'Multi Message 2',
            icon: 'res://icon',
            smallIcon: 'ic_media_play'
        }, {
            id: 3,
            text: 'Multi Message 3',
            icon: 'res://icon',
            smallIcon: 'ic_media_pause'
        }]);
    },
    // Schedule a delayed notification
    scheduleDelayed: function () {
        var sound = device.platform != 'iOS' ? 'file://sound.mp3' : 'file://beep.caf';

        cordova.plugins.notification.local.schedule({
            id: 1,
            title: 'Scheduled with delay',
            text: 'Test Message 1',
            trigger: { in: 5, unit: 'second' },
            sound: sound,
            badge: 12
        });
    },
    // Schedule a repeating notification
    scheduleInterval: function () {
        var sound = device.platform != 'iOS' ? 'file://sound.mp3' : 'file://beep.caf';

        cordova.plugins.notification.local.schedule({
            id: 1,
            text: 'Scheduled every minute',
            trigger: { every: 'minute' },
            sound: sound,
            icon: 'res://icon',
            smallIcon: 'res://ic_popup_sync'
        });
    },
    // Schedule with actions
    scheduleActions: function () {
        cordova.plugins.notification.local.schedule({
            title: 'Local Notification Plugin',
            text: 'Made by appPlant from Leipzig/Germany',
            icon: 'file://img/avatar.jpg?crop=cirlce',
            attachments: ['file://img/logo.png'],
            actionGroupId: 'like-dislike',
            actions: [{
                id: 'like',
                type: 'button',
                title: 'Like',
                launch: true
            },{
                id: 'dislike',
                type: 'button',
                title: 'Dislike',
                ui: 'decline'
            },{
                id: 'feedback',
                type: 'input',
                title: device.platform != 'windows' ? 'Feedback' : '',
                emptyText: 'Enter feedback',
                submitTitle: 'Send'
            }]
        });
    },
    // Update notification text
    update: function () {
        cordova.plugins.notification.local.update({
            id: 1,
            title: 'Updated Message 1',
            text: 'New icon :)',
            icon: 'res://icon',
            color: 'FF0000',
            attachments: ['file://img/logo.png'],
            data: { updated: true }
        });
    },
    // Update trigger interval
    updateInterval: function () {
        cordova.plugins.notification.local.update({
            id: 1,
            title: 'Updated Message 1',
            text: 'Triggeres every minute',
            every: 'minute'
        });
    },
    // Clear a single notification
    clearSingle: function () {
        cordova.plugins.notification.local.clear(1, app.ids);
    },
    // Clear multiple notifications
    clearMulti: function () {
        cordova.plugins.notification.local.clear([2, 3], app.ids);
    },
    // Clear all notifications
    clearAll: function () {
        cordova.plugins.notification.local.clearAll(app.ids);
    },
    // Clear a single notification
    cancelSingle: function () {
        cordova.plugins.notification.local.cancel(1, app.ids);
    },
    // Clear multiple notifications
    cancelMulti: function () {
        cordova.plugins.notification.local.cancel([2, 3], app.ids);
    },
    // Cancel all notifications
    cancelAll: function () {
        cordova.plugins.notification.local.cancelAll(app.ids);
    },
    // If the notifcation is scheduled or triggered
    isPresent: function () {
        cordova.plugins.notification.local.isPresent(1, function (present) {
            showToast(present ? 'Yes' : 'No');
        });
    },
    // If the notifcation is scheduled
    isScheduled: function () {
        cordova.plugins.notification.local.isScheduled(1, function (scheduled) {
            showToast(scheduled ? 'Yes' : 'No');
        });
    },
    // If the notifcation is triggered
    isTriggered: function () {
        cordova.plugins.notification.local.isTriggered(1, function (triggered) {
            showToast(triggered ? 'Yes' : 'No');
        });
    },
    // Get the type of the notification
    type: function () {
        cordova.plugins.notification.local.getType(1, function (type) {
            showToast(type);
        });
    },
    // Get all notification ids
    ids: function () {
        cordova.plugins.notification.local.getIds(function (ids) {
            console.log(ids);
            showToast(ids.length === 0 ? '- none -' : ids.join(' ,'));
        });
    },
    // Get all notification ids
    scheduledIds: function () {
        cordova.plugins.notification.local.getScheduledIds(function (ids) {
            console.log(ids);
            showToast(ids.length === 0 ? '- none -' : ids.join(' ,'));
        });
    },
    // Get all notification ids
    triggeredIds: function () {
        cordova.plugins.notification.local.getTriggeredIds(function (ids) {
            console.log(ids);
            showToast(ids.length === 0 ? '- none -' : ids.join(' ,'));
        });
    },
    // Get all scheduled notifications
    scheduledNots: function () {
        cordova.plugins.notification.local.getScheduled(function (nots) {
            console.log(nots);
            showToast(nots.length === 0 ? '- none -' : nots.join(' ,'));
        });
    },
    // Get all triggered notifications
    triggeredNots: function () {
        cordova.plugins.notification.local.getTriggered(function (nots) {
            console.log(nots);
            showToast(nots.length === 0 ? '- none -' : nots.join(' ,'));
        });
    },
    // Get a single notification
    notification: function () {
        cordova.plugins.notification.local.get(1, function (obj) {
            console.log(obj);
            showToast(obj ? obj.toString() : '- none -');
        });
    },
    // Get multiple notifications
    multipleNots: function () {
        cordova.plugins.notification.local.get([1, 2], function (nots) {
            console.log(nots);
            showToast(nots.length === 0 ? '- none -' : nots.join(' ,'));
        });
    },
    // Get all notifications
    notifications: function () {
        cordova.plugins.notification.local.getAll(function (nots) {
            console.log(nots);
            showToast(nots.length === 0 ? '- none -' : nots.join(' ,'));
        });
    },
    // Set another default title
    setDefaultTitle: function () {
        cordova.plugins.notification.local.setDefaults({ title: 'New Default Title' });
        showToast('New Default Title');
    },
    // Listen for events
    bindNotificationEvents: function () {
        cordova.plugins.notification.local.on('schedule', function (obj) {
            console.log('schedule', arguments);
            // showToast('scheduled: ' + obj.id);
        });
        cordova.plugins.notification.local.on('update', function (obj) {
            console.log('update', arguments);
            showToast('updated: ' + obj.id);
        });
        cordova.plugins.notification.local.on('trigger', function (obj) {
            console.log('trigger', arguments);
            showToast('triggered: ' + obj.id);
        });
        cordova.plugins.notification.local.on('click', function (obj) {
            console.log('click', arguments);
            showToast('clicked: ' + obj.id);
        });
        cordova.plugins.notification.local.on('cancel', function (obj) {
            console.log('cancel', arguments);
            // showToast('canceled: ' + obj.id);
        });
        cordova.plugins.notification.local.on('clear', function (obj) {
            console.log('clear', arguments);
            showToast('cleared: ' + obj.id);
        });
        cordova.plugins.notification.local.on('cancelall', function () {
            console.log('cancelall', arguments);
            // showToast('canceled all');
        });
        cordova.plugins.notification.local.on('clearall', function () {
            console.log('clearall', arguments);
            // showToast('cleared all');
        });
        cordova.plugins.notification.local.on('like', function () {
            console.log('like', arguments);
            showToast('liked');
        });
        cordova.plugins.notification.local.on('dislike', function () {
            console.log('dislike', arguments);
            showToast('disliked');
        });
        cordova.plugins.notification.local.on('feedback', function (obj, e) {
            console.log('feedback', arguments);
            showToast('Feedback: ' + e.text);
        });
    }
};

var dialog;

showToast = function (text) {
    var isMac = navigator.userAgent.toLowerCase().includes('macintosh');

    setTimeout(function () {
        if (window.Windows !== undefined) {
            showWinDialog(text);
        } else
        if (!isMac && window.plugins && window.plugins.toast) {
            window.plugins.toast.showShortBottom(String(text));
        }
        else {
            alert(text);
        }
    }, 500);
};

showWinDialog = function (text) {
    if (dialog) {
        dialog.content = text;
        return;
    }

    dialog = new Windows.UI.Popups.MessageDialog(text);

    dialog.showAsync().done(function () {
        dialog = null;
    });
};

if (window.hasOwnProperty('Windows')) {
    alert = showWinDialog;
}

app.initialize();
