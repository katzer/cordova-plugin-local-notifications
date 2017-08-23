/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

module.exports = {
    id: 'windows',
    bootstrap:function() {
        var cordova = require('cordova'),
            exec = require('cordova/exec'),
            channel = cordova.require('cordova/channel'),
            platform = require('cordova/platform'),
            modulemapper = require('cordova/modulemapper'),
            utils = require('cordova/utils');

        modulemapper.clobbers('cordova/exec/proxy', 'cordova.commandProxy');

        // we will make sure we get this channel
        // TODO: remove this once other platforms catch up.
        if(!channel.onActivated) {
            channel.onActivated = cordova.addDocumentEventHandler('activated');
        }
        channel.onNativeReady.fire();

        var onWinJSReady = function () {
            var app = WinJS.Application,
                splashscreen = require('cordova/splashscreen'),
                configHelper = require('cordova/confighelper');

            modulemapper.clobbers('cordova/splashscreen', 'navigator.splashscreen');

            var checkpointHandler = function checkpointHandler() {
                cordova.fireDocumentEvent('pause',null,true);
            };

            var resumingHandler = function resumingHandler() {
                cordova.fireDocumentEvent('resume',null,true);
            };

            // activation args are available via the activated event
            // OR cordova.require('cordova/platform').activationContext
            // activationContext:{type: actType, args: args};
            var activationHandler = function (e) {
                // Making all the details available as activationContext
                platform.activationContext = utils.clone(e.detail);         /* CB-10653 to avoid losing detail properties for some activation kinds */
                platform.activationContext.raw = e.detail;                  /* CB-11522 to preserve types */
                platform.activationContext.args = e.detail.arguments;       /* for backwards compatibility */

                function makePromise(fn) {
                    return new WinJS.Promise(function init(completeDispatch, errorDispatch) {
                        fn(function successCb(results) {
                            completeDispatch(results);
                        }, function errorCb(error) {
                            errorDispatch(error);
                        });
                    });
                }

                if (e.detail.previousExecutionState === Windows.ApplicationModel.Activation.ApplicationExecutionState.running
                        || e.detail.previousExecutionState === Windows.ApplicationModel.Activation.ApplicationExecutionState.suspended) {
                    cordova.fireDocumentEvent('activated', platform.activationContext, true);
                    return;
                }

                var manifest;

                e.setPromise(makePromise(configHelper.readManifest).then(function (manifestTmp) {
                    manifest = manifestTmp;
                    return makePromise(configHelper.readConfig);
                })
                .then(function (config) {
                    splashscreen.firstShow(config, manifest, e);
                }).then(function () {
                    // Avoids splashimage flicker on Windows Phone 8.1/10
                    return WinJS.Promise.timeout();
                }).then(function () {
                    cordova.fireDocumentEvent('activated', platform.activationContext, true);
                }));
            };

            // CB-12193 CoreWindow and some WinRT APIs are not available in webview
            var isCoreWindowAvailable = false;
            try {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                isCoreWindowAvailable = true;
            } catch (e) { }

            if (isCoreWindowAvailable) {
                app.addEventListener("checkpoint", checkpointHandler);
                app.addEventListener("activated", activationHandler, false);
                Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", resumingHandler, false);

                injectBackButtonHandler();

                app.start();
            }
        };

        function appendScript(scriptElem, loadedCb) {
            scriptElem.addEventListener("load", loadedCb);
            document.head.appendChild(scriptElem);
        }

        if (!window.WinJS) {
            var scriptElem = document.createElement("script");

            if (navigator.appVersion.indexOf('MSAppHost/3.0') !== -1) {
                // Windows 10 UWP
                scriptElem.src = '/www/WinJS/js/base.js';
            } else if (navigator.appVersion.indexOf("Windows Phone 8.1;") !== -1) {
                // windows phone 8.1 + Mobile IE 11
                scriptElem.src = "//Microsoft.Phone.WinJS.2.1/js/base.js";
            } else if (navigator.appVersion.indexOf("MSAppHost/2.0;") !== -1) {
                // windows 8.1 + IE 11
                scriptElem.src = "//Microsoft.WinJS.2.0/js/base.js";
            }
            scriptElem.addEventListener("load", onWinJSReady);
            document.head.appendChild(scriptElem);
        }
        else {
            onWinJSReady();
        }
    }
};

function injectBackButtonHandler() {

    var app = WinJS.Application;

    // create document event handler for backbutton
    var backButtonChannel = cordova.addDocumentEventHandler('backbutton');

    // preserve reference to original backclick implementation
    // `false` as a result will trigger system default behaviour
    var defaultBackButtonHandler = app.onbackclick || function () { return false; };

    var backRequestedHandler = function backRequestedHandler(evt) {
        // check if listeners are registered, if yes use custom backbutton event
        // NOTE: On Windows Phone 8.1 backbutton handlers have to throw an exception in order to exit the app
        if (backButtonChannel.numHandlers >= 1) {
            try {
                cordova.fireDocumentEvent('backbutton', evt, true);
                evt.handled = true; // Windows Mobile requires handled to be set as well;
                return true;
            }
            catch (e) {
                return false;
            }
        }
        // if not listeners are active, use default implementation (backwards compatibility)
        else {
            return defaultBackButtonHandler.apply(app, arguments);
        }
    };

    // Only load this code if we're running on Win10 in a non-emulated app frame, otherwise crash \o/
    if (navigator.appVersion.indexOf('MSAppHost/3.0') !== -1) { // Windows 10 UWP (PC/Tablet/Phone)
        var navigationManager = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
        // Inject a listener for the backbutton on the document.
        backButtonChannel.onHasSubscribersChange = function () {
            // If we just attached the first handler or detached the last handler,
            // let native know we need to override the back button.
            navigationManager.appViewBackButtonVisibility = (this.numHandlers > 0) ?
                Windows.UI.Core.AppViewBackButtonVisibility.visible :
                Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
        };

        navigationManager.addEventListener("backrequested", backRequestedHandler, false);
    } else { // Windows 8.1 Phone
        // inject new back button handler
        app.onbackclick = backRequestedHandler;
    }
}
