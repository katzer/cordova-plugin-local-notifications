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

var Q = require('q');
var nopt  = require('nopt');
var build = require('./build');
var utils = require('./utils');
var packages = require('./package');
var execSync = require('child_process').execSync;
var CordovaError = require('cordova-common').CordovaError;
var events = require('cordova-common').events;

module.exports.run = function (options) {
    if (!utils.isCordovaProject(this.root)){
        return Q.reject(new CordovaError('Could not find project at ' + this.root));
    }

    // Check if ran from admin prompt and fail quickly if CLI has administrative permissions
    // http://stackoverflow.com/a/11995662/64949
    if (ranWithElevatedPermissions())
        return Q.reject(new CordovaError('Can not run this platform with administrative ' +
            'permissions. Must be run from a non-admin prompt.'));

    // parse arg
    var args  = nopt({
        'archs': [String],
        'phone': Boolean,
        'win': Boolean,
        'appx': String,
        'win10tools': Boolean
    }, {'r' : '--release'}, options.argv, 0);

    // Validate args
    if (options.debug && options.release) {
        return Q.reject(new CordovaError('Only one of "debug"/"release" options should be specified'));
    }
    if ((options.device && options.emulator) || ((options.device || options.emulator) && options.target)) {
        return Q.reject(new CordovaError('Only one of "device"/"emulator"/"target" options should be specified'));
    }
    if (args.phone && args.win) {
        return Q.reject(new CordovaError('Only one of "phone"/"win" options should be specified'));
    }

    // Get build/deploy options
    var buildType    = options.release ? 'release' : 'debug';
    // CB-11478 Allow to specify 'archs' parameter as either cli or platform
    // option i.e. 'cordova run --archs' vs. 'cordova run -- --archs'
    var archs = options.archs || args.archs || ['anycpu'];
    if (typeof archs === 'string') { archs = archs.split(' '); }

    var buildArchs = archs.map(function (arch) { return arch.toLowerCase(); });
    var deployTarget = options.target ? options.target : (options.emulator ? 'emulator' : 'device');

     var buildTargets = build.getBuildTargets(args.win, args.phone, args.appx);

     if (!buildTargets || buildTargets.length <= 0) {
         return Q.reject(new CordovaError('Unable to determine deploy target.'));
     }

     // we deploy the first build target so we use buildTargets[0] to determine
     // what project type we should deploy
     var projectType = projFileToType(buildTargets[0]);

    // if --nobuild isn't specified then build app first
    var buildPackages = options.nobuild ? packages.getPackage(projectType, buildType, buildArchs[0]) : build.run.call(this, options);

    // buildPackages also deploys bundles
    return buildPackages
    .then(function(pkg) {
        events.emit('log', 'Deploying ' + pkg.type + ' package to ' + deployTarget + ':\n' + pkg.appx);
        switch (pkg.type) {
            case 'phone':
                return packages.deployToPhone(pkg, deployTarget, args.win10tools)
                .catch(function(e) {
                    if (options.target || options.emulator || options.device) {
                        return Q.reject(e); // Explicit target, carry on
                    }
                    // 'device' was inferred initially, because no target was specified
                    return packages.deployToPhone(pkg, 'emulator', args.win10tools);
                });
            case 'windows10':
                if (args.phone) {
                    // Win10 emulator launch is not currently supported, always force device
                    if (options.emulator || options.target === 'emulator') {
                        events.emit('warn', 'Windows 10 Phone emulator is currently not supported. ' +
                            'If you want to deploy to emulator, use Visual Studio instead. ' +
                            'Attempting to deploy to device...');
                    }
                    return packages.deployToPhone(pkg, deployTarget, true);
                } else {
                    return packages.deployToDesktop(pkg, deployTarget, projectType);
                }
                break;
            default: // 'windows'
                return packages.deployToDesktop(pkg, deployTarget, projectType);
        }
    });
};

// Retrieves project type for the project file specified.
// @param   {String}  projFile Project file, for example 'CordovaApp.Windows10.jsproj'
// @returns {String}  Proejct type, for example 'windows10'
function projFileToType(projFile)
{
    return projFile.replace(/CordovaApp|jsproj|\./gi, '').toLowerCase();
}

/**
 * Checks if current process is an with administrative permissions (e.g. from
 *   elevated command prompt).
 *
 * @return  {Boolean}  true if elevated permissions detected, otherwise false
 */
function ranWithElevatedPermissions () {
    try {
        // Check if ran from admin prompt and fail quickly if CLI has administrative permissions
        // http://stackoverflow.com/a/11995662/64949
        execSync('net session', {'stdio': 'ignore'});
        return true;
    } catch (e) {
        return false;
    }
}
