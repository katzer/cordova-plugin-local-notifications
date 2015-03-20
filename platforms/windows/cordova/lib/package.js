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
    fs    = require('fs'),
    path  = require('path'),
    exec  = require('./exec'),
    spawn = require('./spawn'),
    utils = require('./utils');

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

    for (var dir in pkgDirs) {
        var packageFiles = fs.readdirSync(pkgDirs[dir]).filter(function(e) {
            return e.match('.*.(appx|appxbundle)$');
        });

        for (var pkgFile in packageFiles) {
            var packageFile = path.join(pkgDirs[dir], packageFiles[pkgFile]);
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

// returns package info object or null if it is not valid package
module.exports.getPackageFileInfo = function (packageFile) {
    var pkgName = path.basename(packageFile);
    // CordovaApp.Windows_0.0.1.0_anycpu_debug.appx
    // CordovaApp.Phone_0.0.1.0_x86_debug.appxbundle
    var props = /.*\.(Phone|Windows|Windows80)_((?:\d*\.)*\d*)_(AnyCPU|x64|x86|ARM)(?:_(Debug))?.(appx|appxbundle)$/i.exec(pkgName);
    if (props) {
        return {type      : props[1].toLowerCase(),
            arch      : props[3].toLowerCase(),
            buildtype : props[4] ? props[4].toLowerCase() : 'release',
            file      : props[1].toLowerCase() != 'phone' ?
                path.join(packageFile, '..', 'Add-AppDevPackage.ps1') :
                packageFile
        };
    }
    return null;
};

// return package app ID fetched from appxmanifest
// return rejected promise if appxmanifest not valid
module.exports.getAppId = function (platformPath) {
    var manifest = path.join(platformPath, 'package.phone.appxmanifest');
    try {
        return Q.resolve(/PhoneProductId="(.*?)"/gi.exec(fs.readFileSync(manifest, 'utf8'))[1]);
    } catch (e) {
        return Q.reject('Can\'t read appId from phone manifest' + e);
    }
};

// return package name fetched from appxmanifest
// return rejected promise if appxmanifest not valid
module.exports.getPackageName = function (platformPath) {
    var manifest = path.join(platformPath, 'package.windows.appxmanifest');
    try {
        return Q.resolve(/Application Id="(.*?)"/gi.exec(fs.readFileSync(manifest, 'utf8'))[1]);
    } catch (e) {
        return Q.reject('Can\'t read package name from manifest ' + e);
    }
};

// returns one of available devices which name match with provided string
// return rejected promise if device with name specified not found
module.exports.findDevice = function (target) {
    target = target.toLowerCase();
    return module.exports.listDevices().then(function(deviceList) {
        // CB-7617 since we use partial match shorter names should go first,
        // example case is ['Emulator 8.1 WVGA 4 inch 512MB', 'Emulator 8.1 WVGA 4 inch']
        var sortedList = deviceList.concat().sort(function (l, r) { return l.length > r.length; });
        for (var idx in sortedList){
            if (sortedList[idx].toLowerCase().indexOf(target) > -1) {
                // we should return index based on original list
                return Q.resolve(deviceList.indexOf(sortedList[idx]));
            }
        }
        return Q.reject('Specified device not found');
    });
};

// returns array of available devices names
module.exports.listDevices = function () {
    return utils.getAppDeployUtils().then(function(appDeployUtils) {
        return exec('"' + appDeployUtils + '" /enumeratedevices').then(function(output) {
            return Q.resolve(output.split('\n').map(function(line) {
                var match = /\s*(\d)+\s+(.*)/.exec(line);
                return match && match[2];
            }).filter(function (line) {
                return line;
            }));
        });
    });
};

// deploys specified phone package to device/emulator
module.exports.deployToPhone = function (appxPath, deployTarget) {
    var getTarget = deployTarget == 'device' ? Q('de') :
        deployTarget == 'emulator' ? Q('xd') : module.exports.findDevice(deployTarget);

    // /installlaunch option sometimes fails with 'Error: The parameter is incorrect.'
    // so we use separate steps to /install and then /launch
    return getTarget.then(function(target) {
        return utils.getAppDeployUtils().then(function(appDeployUtils) {
            console.log('Installing application');
            return spawn(appDeployUtils, ['/install', appxPath, '/targetdevice:' + target]).then(function() {
                // TODO: resolve AppId without specifying project root;
                return module.exports.getAppId(path.join(__dirname, '..', '..'));
            }).then(function(appId) {
                console.log('Running application');
                return spawn(appDeployUtils, ['/launch', appId, '/targetdevice:' + target]);
            });
        });
    });
};

// deploys specified package to desktop
module.exports.deployToDesktop = function (appxScript, deployTarget) {
    if (deployTarget != 'device' && deployTarget != 'emulator') {
        return Q.reject('Deploying desktop apps to specific target not supported');
    }

    return utils.getAppStoreUtils().then(function(appStoreUtils) {
        return module.exports.getPackageName(path.join(__dirname, '..', '..')).then(function(pkgname) {
            // uninstalls previous application instance (if exists)
            console.log('Attempt to uninstall previous application version...');
            return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned', 'Import-Module "' + appStoreUtils + '"; Uninstall-App ' + pkgname])
            .then(function() {
                console.log('Attempt to install application...');
                return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned', 'Import-Module "' + appStoreUtils + '"; Install-App', utils.quote(appxScript)]);
            }).then(function() {
                console.log('Starting application...');
                return spawn('powershell', ['-ExecutionPolicy', 'RemoteSigned', 'Import-Module "' + appStoreUtils + '"; Start-Locally', pkgname]);
            });
        });
    });
};
