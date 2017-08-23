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

/* jshint sub:true */

var Q     = require('q');
var fs    = require('fs');
var path  = require('path');
var spawn = require('cordova-common').superspawn.spawn;
var DeploymentTool = require('./deployment');

// unblocks and returns path to WindowsStoreAppUtils.ps1
// which provides helper functions to install/unistall/start Windows Store app
module.exports.getAppStoreUtils = function () {
    var appStoreUtils = path.join(__dirname, 'WindowsStoreAppUtils.ps1');
    if (!fs.existsSync (appStoreUtils)) {
        return Q.reject('Can\'t unblock AppStoreUtils script');
    }
    return spawn('powershell', ['Unblock-File', module.exports.quote(appStoreUtils)], {stdio: 'ignore'})
    .thenResolve(appStoreUtils);
};

// returns path to AppDeploy util from Windows Phone 8.1 SDK
module.exports.getAppDeployUtils = function (targetWin10) {
    var version = targetWin10 ? '10.0' : '8.1';
    var tool = DeploymentTool.getDeploymentTool(version);

    if (!tool.isAvailable()) {
        return Q.reject('App deployment utilities: "' + tool.path + '", not found.  Ensure the Windows SDK is installed.');
    }

    return Q.resolve(tool);
};

// checks to see if a .jsproj file exists in the project root
module.exports.isCordovaProject = function (platformpath) {
    if (fs.existsSync(platformpath)) {
        var files = fs.readdirSync(platformpath);
        for (var i in files){
            if (path.extname(files[i]) == '.shproj'){
                return true;
            }
        }
    }
    return false;
};

module.exports.quote = function(str) {
    return '"' + str + '"';
};
