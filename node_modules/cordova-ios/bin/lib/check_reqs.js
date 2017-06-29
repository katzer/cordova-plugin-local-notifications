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

var Q     = require('q'),
    shell = require('shelljs'),
    util = require('util'),
    versions = require('./versions');

var XCODEBUILD_MIN_VERSION = '7.0.0';
var XCODEBUILD_NOT_FOUND_MESSAGE =
    'Please install version ' + XCODEBUILD_MIN_VERSION + ' or greater from App Store';

var IOS_DEPLOY_MIN_VERSION = '1.9.0';
var IOS_DEPLOY_NOT_FOUND_MESSAGE =
    'Please download, build and install version ' + IOS_DEPLOY_MIN_VERSION + ' or greater' +
    ' from https://github.com/phonegap/ios-deploy into your path, or do \'npm install -g ios-deploy\'';

var COCOAPODS_MIN_VERSION = '1.0.1';
var COCOAPODS_NOT_FOUND_MESSAGE =
    'Please install version ' + COCOAPODS_MIN_VERSION + ' or greater from https://cocoapods.org/';
var COCOAPODS_NOT_SYNCED_MESSAGE =
    'The CocoaPods repo has not been synced yet, this will take a long time (approximately 500MB as of Sept 2016). Please run `pod setup` first to sync the repo.';
var COCOAPODS_SYNCED_MIN_SIZE = 475; // in megabytes
var COCOAPODS_SYNC_ERROR_MESSAGE =
    'The CocoaPods repo has been created, but there appears to be a sync error. The repo size should be at least ' + COCOAPODS_SYNCED_MIN_SIZE + '. Please run `pod setup --verbose` to sync the repo.';
var COCOAPODS_REPO_NOT_FOUND_MESSAGE = 'The CocoaPods repo at ~/.cocoapods was not found.';

/**
 * Checks if xcode util is available
 * @return {Promise} Returns a promise either resolved with xcode version or rejected
 */
module.exports.run = module.exports.check_xcodebuild = function () {
    return checkTool('xcodebuild', XCODEBUILD_MIN_VERSION, XCODEBUILD_NOT_FOUND_MESSAGE);
};

/**
 * Checks if ios-deploy util is available
 * @return {Promise} Returns a promise either resolved with ios-deploy version or rejected
 */
module.exports.check_ios_deploy = function () {
    return checkTool('ios-deploy', IOS_DEPLOY_MIN_VERSION, IOS_DEPLOY_NOT_FOUND_MESSAGE);
};

module.exports.check_os = function () {
    // Build iOS apps available for OSX platform only, so we reject on others platforms
    return process.platform === 'darwin' ?
        Q.resolve(process.platform) :
        Q.reject('Cordova tooling for iOS requires Apple OS X');
};

function check_cocoapod_tool() {
    return checkTool('pod', COCOAPODS_MIN_VERSION, COCOAPODS_NOT_FOUND_MESSAGE, 'CocoaPods');
}

/**
 * Checks if cocoapods repo size is what is expected
 * @return {Promise} Returns a promise either resolved or rejected
 */
module.exports.check_cocoapods_repo_size = function () {
    return check_cocoapod_tool()
    .then(function() {
        // check size of ~/.cocoapods repo
        var commandString = util.format('du -sh %s/.cocoapods', process.env.HOME);
        var command = shell.exec(commandString,  { silent:true });
        if (command.code !== 0) { // error, perhaps not found 
            return Q.reject(util.format('%s (%s)', COCOAPODS_REPO_NOT_FOUND_MESSAGE, command.output));
        } else { // success, parse output
            // command.output is e.g "750M   path/to/.cocoapods", we just scan the number
            return Q.resolve(parseFloat(command.output));
        }
    })
    .then(function(repoSize) {
        if (COCOAPODS_SYNCED_MIN_SIZE > repoSize) {
            return Q.reject(COCOAPODS_SYNC_ERROR_MESSAGE);
        } else {
            return Q.resolve();
        }
    });
};

/**
 * Checks if cocoapods is available, and whether the repo is synced (because it takes a long time to download)
 * @return {Promise} Returns a promise either resolved or rejected
 */
module.exports.check_cocoapods = function () {
    return check_cocoapod_tool()
    // check whether the cocoapods repo has been synced through `pod repo` command
    // a value of '0 repos' means it hasn't been synced
    .then(function() {
        var code = shell.exec('pod repo | grep -e "^0 repos"',  { silent:true }).code;
        return Q.resolve(code !== 0); // non-zero means it is synced (has 1 repo at least)
    })
    .then(function(repoIsSynced) {
        if (repoIsSynced) {
            // return check_cocoapods_repo_size();
            // we could check the repo size above, but it takes too long.
            return Q.resolve();
        } else {
            return Q.reject(COCOAPODS_NOT_SYNCED_MESSAGE);
        }
    });
};

/**
 * Checks if specific tool is available.
 * @param  {String} tool       Tool name to check. Known tools are 'xcodebuild' and 'ios-deploy'
 * @param  {Number} minVersion Min allowed tool version.
 * @param  {String} message    Message that will be used to reject promise.
 * @param  {String} toolFriendlyName  Friendly name of the tool, to report to the user. Optional.
 * @return {Promise}           Returns a promise either resolved with tool version or rejected
 */
function checkTool (tool, minVersion, message, toolFriendlyName) {
    toolFriendlyName = toolFriendlyName || tool;

    // Check whether tool command is available at all
    var tool_command = shell.which(tool);
    if (!tool_command) {
        return Q.reject(toolFriendlyName + ' was not found. ' + (message || ''));
    }
    // check if tool version is greater than specified one
    return versions.get_tool_version(tool).then(function (version) {
        version = version.trim();
        return versions.compareVersions(version, minVersion) >= 0 ?
            Q.resolve(version) :
            Q.reject('Cordova needs ' + toolFriendlyName + ' version ' + minVersion +
              ' or greater, you have version ' + version + '. ' + (message || ''));
    });
}

/**
 * Object that represents one of requirements for current platform.
 * @param {String}  id        The unique identifier for this requirements.
 * @param {String}  name      The name of requirements. Human-readable field.
 * @param {Boolean} isFatal   Marks the requirement as fatal. If such requirement will fail
 *                            next requirements' checks will be skipped.
 */
var Requirement = function (id, name, isFatal) {
    this.id = id;
    this.name = name;
    this.installed = false;
    this.metadata = {};
    this.isFatal = isFatal || false;
};

/**
 * Methods that runs all checks one by one and returns a result of checks
 * as an array of Requirement objects. This method intended to be used by cordova-lib check_reqs method
 *
 * @return Promise<Requirement[]> Array of requirements. Due to implementation, promise is always fulfilled.
 */
module.exports.check_all = function() {

    var requirements = [
        new Requirement('os', 'Apple OS X', true),
        new Requirement('xcode', 'Xcode'),
        new Requirement('ios-deploy', 'ios-deploy'),
        new Requirement('CocoaPods', 'CocoaPods')
    ];

    var result = [];
    var fatalIsHit = false;

    var checkFns = [
        module.exports.check_os,
        module.exports.check_xcodebuild,
        module.exports.check_ios_deploy,
        module.exports.check_cocoapods
    ];

    // Then execute requirement checks one-by-one
    return checkFns.reduce(function (promise, checkFn, idx) {
        return promise.then(function () {
            // If fatal requirement is failed,
            // we don't need to check others
            if (fatalIsHit) return Q();

            var requirement = requirements[idx];
            return checkFn()
            .then(function (version) {
                requirement.installed = true;
                requirement.metadata.version = version;
                result.push(requirement);
            }, function (err) {
                if (requirement.isFatal) fatalIsHit = true;
                requirement.metadata.reason = err;
                result.push(requirement);
            });
        });
    }, Q())
    .then(function () {
        // When chain is completed, return requirements array to upstream API
        return result;
    });
};
