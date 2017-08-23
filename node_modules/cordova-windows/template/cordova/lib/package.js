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

var Q     = require('q');
var fs    = require('fs');
var path  = require('path');
var utils = require('./utils');
var AppxManifest = require('./AppxManifest');
var events = require('cordova-common').events;
var spawn = require('cordova-common').superspawn.spawn;
var CordovaError = require('cordova-common').CordovaError;

// returns folder that contains package with chip architecture,
// build and project types specified by script parameters
module.exports.getPackage = function (projectType, buildtype, buildArch) {
    var appPackages = path.resolve(path.join(__dirname, '..', '..', 'AppPackages'));
    // reject promise if apppackages folder doesn't exists
    if (!fs.existsSync(appPackages)) {
        return Q.reject('AppPackages doesn\'t exists');
    }
    // find out and resolve paths for all folders inside AppPackages
    var pkgDirs = fs.readdirSync(appPackages).map(function(relative) {
        // resolve path to folder
        return path.join(appPackages, relative);
    }).filter(function(pkgDir) {
        // check that it is a directory
        return fs.statSync(pkgDir).isDirectory();
    });

    for (var dirIndex = 0; dirIndex < pkgDirs.length; dirIndex++) {
        var dir = pkgDirs[dirIndex];
        var packageFiles = fs.readdirSync(dir).filter(function(e) {
            return e.match('.*.(appx|appxbundle)$');
        });

        for (var pkgIndex = 0; pkgIndex < packageFiles.length; pkgIndex++) {
            var pkgFile = packageFiles[pkgIndex];

            var packageFile = path.join(dir, pkgFile);
            var pkgInfo = module.exports.getPackageFileInfo(packageFile);

            if (pkgInfo && pkgInfo.type == projectType &&
                pkgInfo.arch == buildArch && pkgInfo.buildtype == buildtype) {
                // if package's properties are corresponds to properties provided
                // resolve the promise with this package's info
                return Q.resolve(pkgInfo);
            }
        }
    }

    // reject because seems that no corresponding packages found
    return Q.reject('Package with specified parameters not found in AppPackages folder');
};

function getPackagePhoneProductId(packageFile) {
    var windowsPlatformPath = path.join(packageFile, '..', '..', '..');
    return module.exports.getAppId(windowsPlatformPath);
}

// returns package info object or null if it is not valid package
module.exports.getPackageFileInfo = function (packageFile) {
    var pkgName = path.basename(packageFile);

    // CordovaApp.Windows_0.0.1.0_anycpu_debug.appx
    // CordovaApp.Phone_0.0.1.0_x86_debug.appxbundle
    // CordovaApp.Windows10_0.0.1.0_x64_x86_arm.appxbundle

    var props = /.*\.(Phone|Windows|Windows10)_((?:\d*\.)*\d*)*((?:_(AnyCPU|x86|x64|ARM)){1,4})(?:(_Debug))?.(appx|appxbundle)$/i.exec(pkgName);
    if (props) {
        return {
            type      : props[1].toLowerCase(),
            arch      : props[3].toLowerCase().substring(1),
            archs     : props[3].toLowerCase().substring(1).split('_'),
            buildtype : props[5] ? props[5].substring(1).toLowerCase() : 'release',
            appx      : packageFile,
            script    : path.join(packageFile, '..', 'Add-AppDevPackage.ps1'),
            phoneId   : getPackagePhoneProductId(packageFile)
        };
    }
    return null;
};

// return package app ID fetched from appxmanifest
// return rejected promise if appxmanifest not valid
module.exports.getAppId = function (platformPath) {
    try {
        return AppxManifest.get(path.join(platformPath, 'package.phone.appxmanifest'))
            .getPhoneIdentity().getPhoneProductId();
    } catch (e) {
        throw new Error('Can\'t read appId from phone manifest', e);
    }
};

// return package name fetched from appxmanifest
// return rejected promise if appxmanifest not valid
function getPackageName(platformPath) {
    // Can reliably read from package.windows.appxmanifest even if targeting Windows 10
    // because the function is only used for desktop deployment, which always has the same
    // package name when uninstalling / reinstalling
    try {
        return Q.when(AppxManifest.get(path.join(platformPath, 'package.windows.appxmanifest'))
            .getIdentity().getName());
    } catch (e) {
        return Q.reject('Can\'t read package name from manifest ' + e);
    }
}

// returns one of available devices which name match with provided string
// return rejected promise if device with name specified not found
module.exports.findDevice = function (deploymentTool, target) {
    target = target.toLowerCase();
    return deploymentTool.enumerateDevices().then(function(deviceList) {
        // CB-7617 since we use partial match shorter names should go first,
        // example case is ['Emulator 8.1 WVGA 4 inch 512MB', 'Emulator 8.1 WVGA 4 inch']
        // In CB-9283, we need to differentiate between emulator, device, and target.
        // So, for emulators to honor the above CB-7617, we preserve the original behavior.
        // Else, we choose either the target by ID (DeviceInfo.index) or if it's just device,
        // we choose the default (aka first) device.
        if (target === 'emulator') {
            var sortedList = deviceList.concat().sort(function (l, r) { return l.toString().length > r.toString().length; });
            for (var idx in sortedList){
                if (sortedList[idx].toString().toLowerCase().indexOf(target) > -1) {
                    // we should return index based on original list
                    return Q.resolve(sortedList[idx]);
                }
            }
        } else if (target === 'device') {
            return Q.resolve(deviceList[0]);
        } else {
            var candidateList = deviceList.filter(function(device) {
                return device.index === parseInt(target, 10);
            });

            if (candidateList.length > 0) {
                return candidateList[0];
            }
        }
        return Q.reject('Specified device not found');
    });
};

// returns array of available devices names
module.exports.listDevices = function (deploymentTool) {

    return deploymentTool.enumerateDevices().then(function(deviceList) {
        return deviceList.map(function(device) {
            return device.toString();
        });

    }, function(e) {
        events.emit('error', new Error('Failed to list devices: ' + e));
    });
};


function uninstallAppFromPhone(appDeployUtils, package, target) {
    events.emit('log', 'Attempting to remove previously installed application...');
    return appDeployUtils.uninstallAppPackage(package.phoneId, target);
}

// deploys specified phone package to device/emulator and launches it
module.exports.deployToPhone = function (package, deployTarget, targetWindows10, deploymentTool) {
    var deployment;
    if (deploymentTool) {
        deployment = Q(deploymentTool);
    }
    else {
        deployment = utils.getAppDeployUtils(targetWindows10);
    }

    return deployment.then(function(deploymentTool) {
        return module.exports.findDevice(deploymentTool, deployTarget).then(function(target) {
            return uninstallAppFromPhone(deploymentTool, package, target)
            .then(function() {}, function() {})
            .then(function() {
                // shouldUpdate = false because we've already uninstalled
                events.emit('log', 'Deploying app package...');
                return deploymentTool.installAppPackage(package.appx, target, /*shouldLaunch*/ true, /*shouldUpdate*/ false);
            })
            .then(function() { }, function(error) {
                if (error.message.indexOf('Error code 2148734208 for command') === 0) {
                    return deploymentTool.installAppPackage(package.appx, target, /*shouldLaunch*/ true, /*shouldUpdate*/ true);
                } else if (error.message.indexOf('Error code -2146233088') === 0) {
                    throw new CordovaError('No Windows Phone device was detected.');
                } else {
                    throw new CordovaError('Unexpected error from installation: ' + error.message +
                        ' You may have previously installed the app with an earlier version of cordova-windows.' +
                        ' Ensure the app is uninstalled from the phone and then try to run again.');
                }
            });
        });
    });
};

// deploys specified package to desktop
module.exports.deployToDesktop = function (package, deployTarget) {
    if (deployTarget != 'device' && deployTarget != 'emulator') {
        return Q.reject('Deploying desktop apps to specific target not supported');
    }

    return utils.getAppStoreUtils().then(function(appStoreUtils) {
        return getPackageName(path.join(__dirname, '..', '..')).then(function(pkgname) {

            var oldArch;
            // uninstalls previous application instance (if exists)
            events.emit('log', 'Attempting to uninstall previous application version...');
            return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned',
                'Import-Module "' + appStoreUtils + '"; Uninstall-App ' + pkgname],
                { stdio: 'inherit' })
            .then(function() {
                events.emit('log', 'Attempting to install application...');
                oldArch = process.env.PROCESSOR_ARCHITECTURE;
                if (package.arch === 'x64') {
                    process.env.PROCESSOR_ARCHITECTURE = 'AMD64';
                }
                return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned',
                    'Import-Module "' + appStoreUtils + '"; Install-App', utils.quote(package.script)],
                    { stdio: 'inherit' });
            }).then(function() {
                process.env.PROCESSOR_ARCHITECTURE = oldArch;
                events.emit('log', 'Starting application...');
                return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned',
                    'Import-Module "' + appStoreUtils + '"; Start-Locally', pkgname],
                    { stdio: 'inherit' });
            }, function (error) {
                process.env.PROCESSOR_ARCHITECTURE = oldArch;
                throw error;
            });
        });
    });
};
