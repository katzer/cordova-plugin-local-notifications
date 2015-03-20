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

var Q     = require('Q'),
    fs    = require('fs'),
    path  = require('path'),
    exec  = require('./exec'),
    spawn = require('./spawn');

// returns full path to msbuild tools required to build the project and tools version
module.exports.getMSBuildTools = function () {
    var versions = ['12.0', '4.0'];
    // create chain of promises, which returns specific msbuild version object
    // or null, if specific msbuild path not found in registry
    return Q.all(versions.map(function (version) {
        return exec(
            'reg query HKLM\\SOFTWARE\\Microsoft\\MSBuild\\ToolsVersions\\' + version + ' /v MSBuildToolsPath'
        ).then(function(output) {
            // fetch msbuild path from 'reg' output
            var msbPath = /MSBuildToolsPath\s+REG_SZ\s+(.*)/i.exec(output);
            if (msbPath) {
                return {version: version, path: msbPath[1]};
            }
            return null;
        });
    })).then(function (versions) {
        // select first msbuild version available, and resolve promise with it
        return versions[0] || versions[1] ?
            Q.resolve(versions[0] || versions[1]) :
            // Reject promise if no msbuild versions found
            Q.reject('MSBuild tools not found');
    });
};

// unblocks and returns path to WindowsStoreAppUtils.ps1
// which provides helper functions to install/unistall/start Windows Store app
module.exports.getAppStoreUtils = function () {
    var appStoreUtils = path.join(__dirname, 'WindowsStoreAppUtils.ps1');
    if (!fs.existsSync (appStoreUtils)) {
        return Q.reject('Can\'t unblock AppStoreUtils script');
    }
    //console.log("Removing execution restrictions from AppStoreUtils...");
    return spawn('powershell', ['Unblock-File', module.exports.quote(appStoreUtils)]).then(function () {
        return Q.resolve(appStoreUtils);
    }).fail(function (err) {
        return Q.reject(err);
    });
};

// returns path to AppDeploy util from Windows Phone 8.1 SDK
module.exports.getAppDeployUtils = function () {
    var appDeployUtils = path.join((process.env['ProgramFiles(x86)'] || process.env['ProgramFiles']),
        'Microsoft SDKs', 'Windows Phone', 'v8.1', 'Tools', 'AppDeploy', 'AppDeployCmd.exe');
    // Check if AppDeployCmd is exists
    if (!fs.existsSync(appDeployUtils)) {
        console.warn('WARNING: AppDeploy tool (AppDeployCmd.exe) didn\'t found. Assume that it\'s in %PATH%');
        return Q.resolve('AppDeployCmd');
    }
    return Q.resolve(appDeployUtils);
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
