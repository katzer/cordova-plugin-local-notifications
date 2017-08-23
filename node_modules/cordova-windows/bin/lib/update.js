/*
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

var Q      = require('q');
var fs     = require('fs');
var path   = require('path');
var shell   = require('shelljs');
var create = require('./create');
var events = require('cordova-common').events;
var ConfigParser = require('cordova-common').ConfigParser;
var CordovaError = require('cordova-common').CordovaError;
var AppxManifest = require('../../template/cordova/lib/AppxManifest');

// updates the cordova.js in project along with the cordova tooling.
module.exports.update = function (destinationDir, options) {
    if (!fs.existsSync(destinationDir)){
        // if specified project path is not valid then reject promise
        return Q.reject(new CordovaError('The given path to the project does not exist: ' + destinationDir));
    }

    var projectConfig = path.join(destinationDir, 'config.xml');
    if (!fs.existsSync(projectConfig)){
        return Q.reject(new CordovaError('Can\'t update project at ' + destinationDir +
            '. config.xml does not exist in destination directory'));
    }

    var guid;
    var config = new ConfigParser(projectConfig);

    // guid param is used only when adding a platform, and isn't saved anywhere.
    // The only place, where it is being persisted - phone/win10 appxmanifest file,
    // but since win10 introduced just recently, we can't rely on its manifest
    // for old platform versions.
    var manifestPath = path.join(destinationDir, 'package.phone.appxmanifest');
    try {
        guid = AppxManifest.get(manifestPath).getPhoneIdentity().getPhoneProductId();
    } catch (e) { /*ignore IO errors */ }

    shell.rm('-rf', destinationDir);
    return create.create(destinationDir, config, {guid: guid}, events);
};

