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

// config.xml and AppxManifest.xml wrapper (non-node ConfigParser analogue)
var configCache = {};
var utils = require("cordova/utils");

var isPhone = (cordova.platformId == 'windows') && WinJS.Utilities.isPhone;
var isWin10UWP = navigator.appVersion.indexOf('MSAppHost/3.0') !== -1;
var splashScreenTagName = isWin10UWP ? "SplashScreen" : (isPhone ? "m3:SplashScreen" : "m2:SplashScreen");

function XmlFile(text) {
    this.text = text;
}

XmlFile.prototype.loadTags = function (tagName) {
    var parser;
    if (!this.doc) {
        parser = new DOMParser();
        this.doc = parser.parseFromString(this.text, "application/xml");
    }

    var tags = this.doc.getElementsByTagName(tagName);
    return Array.prototype.slice.call(tags);
}

function Config(text) {
    XmlFile.apply(this, arguments);
    this.preferences = this.loadTags("preference");
}

function Manifest(text) {
    XmlFile.apply(this, arguments);
    this.splashScreen = this.loadTags(splashScreenTagName)[0];
}

utils.extend(Config, XmlFile);
utils.extend(Manifest, XmlFile);

function requestFile(filePath, success, error) {
    var xhr;

    if (typeof configCache[filePath] != 'undefined') {
        success(configCache[filePath]);
    }

    function fail(msg) {
        console.error(msg);

        if (error) {
            error(msg);
        }
    }

    var xhrStatusChangeHandler = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 304 || xhr.status == 0 /* file:// */) {
                configCache[filePath] = xhr.responseText;
                success(xhr.responseText);
            }
            else {
                fail('[Windows][cordova.js][xhrStatusChangeHandler] Could not XHR ' + filePath + ': ' + xhr.statusText);
            }
        }
    };

    xhr = new XMLHttpRequest();
    xhr.addEventListener("load", xhrStatusChangeHandler);

    try {
        xhr.open("get", filePath, true);
        xhr.send();
    } catch (e) {
        fail('[Windows][cordova.js][xhrFile] Could not XHR ' + filePath + ': ' + JSON.stringify(e));
    }
}

function readConfig(success, error) {
    requestFile("/config.xml", function (contents) {
        success(new Config(contents));
    }, error);
}

function readManifest(success, error) {
    requestFile("/AppxManifest.xml", function (contents) {
        success(new Manifest(contents));
    }, error);
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function (preferenceName) {
    var preferenceItem = this.preferences && this.preferences.filter(function (item) {
        return item.attributes['name'].value === preferenceName;
    });

    if (preferenceItem && preferenceItem[0] && preferenceItem[0].attributes && preferenceItem[0].attributes['value']) {
        return preferenceItem[0].attributes['value'].value;
    }
}

/**
 * Reads SplashScreen image path
 */
Manifest.prototype.getSplashScreenImagePath = function () {
    return this.splashScreen.attributes['Image'].value;
}

exports.readConfig = readConfig;
exports.readManifest = readManifest;
