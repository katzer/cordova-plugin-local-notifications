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

/*jshint -W069 */

var Q     = require('q'),
    fs    = require('fs'),
    path  = require('path');
var spawn = require('cordova-common').superspawn.spawn;
var events = require('cordova-common').events;

var E_INVALIDARG = 2147942487;

function DeploymentTool() {
}

/**
 * Determines whether the requested version of the deployment tool is available.
 * @returns True if the deployment tool can function; false if not.
 */
DeploymentTool.prototype.isAvailable = function() {
    return fs.existsSync(this.path);
};

/**
 * Enumerates devices attached to the development machine.
 * @returns A Promise for an array of objects, which should be passed into other functions to represent the device.
 * @remarks The returned objects contain 'index', 'name', and 'type' properties indicating basic information about them, 
 *    which is limited to the information provided by the system.  Other properties may also be included, but they are 
 *    specific to the deployment tool which created them and are likely used internally.
 */
DeploymentTool.prototype.enumerateDevices = function() {
    return Q.reject('May not use DeploymentTool directly, instead get an instance from DeploymentTool.getDeploymentTool()');
};

/**
 * Installs an app package to the target device.
 * @returns A Promise which will be fulfilled on success or rejected on failure.
 * @param pathToAppxPackage The path to the .appx package to install.
 * @param targetDevice An object returned from a successful call to enumerateDevices.
 * @shouldLaunch Indicates whether to launch the app after installing it.
 * @shouldUpdate Indicates whether to explicitly update the app, or install clean.
 * @pin Optionally provided if the device requires pairing for deployment.
 */
DeploymentTool.prototype.installAppPackage = function(pathToAppxPackage, targetDevice, shouldLaunch, shouldUpdate, pin) {
    return Q.reject('May not use DeploymentTool directly, instead get an instance from DeploymentTool.getDeploymentTool()');
};

/**
 * Uninstalls an app package from the target device.
 * @returns A Promise which will be fulfilled on success or rejected on failure.
 * @param packageInfo The app package name or Phone GUID representing the app.
 * @param targetDevice An object returned from a successful call to enumerateDevices.
 */
DeploymentTool.prototype.uninstallAppPackage = function(packageInfo, targetDevice) {
    return Q.reject('Unable to uninstall any app packages because that feature is not supported.');
};

/**
 * Gets a list of installed apps on the target device.  This function is not supported for
 * Windows Phone 8.1.
 * @param targetDevice {Object} An object returned from a successful call to enumerateDevices.
 * @returns A Promise for an array of app names.
 */
DeploymentTool.prototype.getInstalledApps = function(targetDevice) {
    return Q.reject('Unable to get installed apps because that feature is not supported.');
};

/**
 * Launches an app on the target device.  This function is not supported for Windows 10.
 * @param packageInfo {String} The app package name or Phone GUID representing the app.
 * @param targetDevice {Object} An object returned from a successful call to enumerateDevices.
 * @returns A Promise for when the app is launched.
 */
DeploymentTool.prototype.launchApp = function(packageInfo, targetDevice) {
    return Q.reject('Unable to launch an app because that feature is not supported.');
};

/**
 * Gets a DeploymentTool to deploy to devices or emulators.
 * @param targetOsVersion {String} The version of the 
 */
DeploymentTool.getDeploymentTool = function(targetOsVersion) {
    if (targetOsVersion === '8.1') {
        return new AppDeployCmdTool(targetOsVersion);
    }
    else {
        return new WinAppDeployCmdTool(targetOsVersion);
    }
};

// DeviceInfo is an opaque object passed to install/uninstall.
// Implementations of DeploymentTool can populate it with any additional
//  information required for accessing them.
function DeviceInfo(deviceIndex, deviceName, deviceType) {
    this.index = deviceIndex;
    this.name = deviceName;
    this.type = deviceType;
}

DeviceInfo.prototype.toString = function() {
    return this.index + '. ' + this.name + ' (' + this.type + ')';
};

function AppDeployCmdTool(targetOsVersion) {
    if (!(this instanceof AppDeployCmdTool))
        throw new ReferenceError('Only create an AppDeployCmdTool as an instance object.');

    DeploymentTool.call(this);
    this.targetOsVersion = targetOsVersion;

    var programFilesPath = process.env['ProgramFiles(x86)'] || process.env['ProgramFiles'];
    this.path = path.join(programFilesPath, 'Microsoft SDKs', 'Windows Phone', 'v' + this.targetOsVersion, 'Tools', 'AppDeploy', 'AppDeployCmd.exe');
}

AppDeployCmdTool.prototype = Object.create(DeploymentTool.prototype);
AppDeployCmdTool.prototype.constructor = AppDeployCmdTool;

AppDeployCmdTool.prototype.enumerateDevices = function() {
    var that = this;
    //  9              Emulator 8.1 720P 4.7 inch\r\n
    //    maps to
    // [(line), 9, 'Emulator 8.1 720P 4.7 inch']
    // Expansion is: space, index, spaces, name
    var LINE_TEST = /^\s(\d+?)\s+(.+?)$/m;
    return spawn(that.path, ['/EnumerateDevices']).then(function(result) {
        var lines = result.split('\n');
        var matchedLines = lines.filter(function(line) {
            return LINE_TEST.test(line);
        });

        var devices = matchedLines.map(function(line, arrayIndex) {
            var match = line.match(LINE_TEST);
            var index = parseInt(match[1], 10);
            var name = match[2];

            var shorthand = '';
            var type = 'emulator';

            if (name === 'Device') {
                shorthand = 'de';
                type = 'device';
            } else if (arrayIndex === 1) {
                shorthand = 'xd';
            } else {
                shorthand = index;
            }
            var deviceInfo = new DeviceInfo(index, name, type);
            deviceInfo.__sourceLine = line;
            deviceInfo.__shorthand = shorthand;
            return deviceInfo;
        });

        return devices;
    });
};

// Note: To account for CB-9482, we pass an extra parameter when retrying the call.  Be forwarned to check for that
// if additional parameters are added in the future.
AppDeployCmdTool.prototype.installAppPackage = function(pathToAppxPackage, targetDevice, shouldLaunch, shouldUpdate, pin) {
    var command = shouldUpdate ? '/update' : '/install';
    if (shouldLaunch) {
        command += 'launch';
    }

    var that = this;
    var result = spawn(this.path, [command, pathToAppxPackage, '/targetdevice:' + targetDevice.__shorthand]);
    if (targetDevice.type === 'emulator') {
        result = result.then(null, function(e) {
            // CB-9482: AppDeployCmd also reports E_INVALIDARG during this process.  If so, try to repeat.
            if (e.code === E_INVALIDARG) {
                return spawn(that.path, [command, pathToAppxPackage, '/targetdevice:' + targetDevice.__shorthand]);
            }

            throw e;
        });
    }

    return result;
};

AppDeployCmdTool.prototype.uninstallAppPackage = function(packageInfo, targetDevice) {
    // CB-9482: AppDeployCmd reports failure when targeting an emulator, but actually succeeds
    //  Further calls in the promise chain then are not executed (such as installAppPackage) because
    //  of the failure reported here.  By ensuring that this function always reports a success
    //  state, it allows install to proceed.  (Install will fail if there is a legitimate 
    //  uninstall failure such as due to no device).  
    var assureSuccess = function() {};
    return spawn(this.path, ['/uninstall', packageInfo, '/targetdevice:' + targetDevice.__shorthand]).then(assureSuccess, assureSuccess);
};

AppDeployCmdTool.prototype.launchApp = function(packageInfo, targetDevice) {
    return spawn(this.path, ['/launch', packageInfo, '/targetdevice:' + targetDevice.__shorthand]);
};

function WinAppDeployCmdTool(targetOsVersion) {
    if (!(this instanceof WinAppDeployCmdTool))
        throw new ReferenceError('Only create a WinAppDeployCmdTool as an instance object.');

    DeploymentTool.call(this);
    this.targetOsVersion = targetOsVersion;
    var programFilesPath = process.env['ProgramFiles(x86)'] || process.env['ProgramFiles'];
    this.path = path.join(programFilesPath, 'Windows Kits', '10', 'bin', 'x86', 'WinAppDeployCmd.exe');
}

WinAppDeployCmdTool.prototype = Object.create(DeploymentTool.prototype);
WinAppDeployCmdTool.prototype.constructor = WinAppDeployCmdTool;

WinAppDeployCmdTool.prototype.enumerateDevices = function() {
    var that = this;
    // 127.0.0.1   00000015-b21e-0da9-0000-000000000000    Lumia 1520 (RM-940)\r
    //  maps to
    // [(line), '127.0.0.1', '00000015-b21e-0da9-0000-000000000000', 'Lumia 1520 (RM-940)']
    // The expansion is: IP address, spaces, GUID, spaces, text name
    var LINE_TEST = /^([\d\.]+?)\s+([\da-fA-F\-]+?)\s+(.+)$/m;

    return spawn(that.path, ['devices']).then(function(result) {
        var lines = result.split('\n');
        var matchedLines = lines.filter(function(line) {
            return LINE_TEST.test(line);
        });

        var devices = matchedLines.map(function(line, arrayIndex) {
            var match = line.match(LINE_TEST);
            var ip = match[1];
            var guid = match[2];
            var name = match[3];
            var type = 'device';

            var deviceInfo = new DeviceInfo(arrayIndex, name, type);
            deviceInfo.__ip = ip;
            deviceInfo.__guid = guid;

            return deviceInfo;
        });

        return devices;
    });
};

WinAppDeployCmdTool.prototype.installAppPackage = function(pathToAppxPackage, targetDevice, shouldLaunch, shouldUpdate, pin) {
    if (shouldLaunch) {
        events.emit('warn', 'Cannot launch app with current version of Windows 10 SDK tools. ' +
            'You will have to launch the app after installation is completed.');
    }

    var args = [shouldUpdate ? 'update' : 'install', '-file', pathToAppxPackage, '-ip', targetDevice.__ip];
    if (pin) {
        args.push('-pin');
        args.push(pin);
    }

    return spawn(this.path, args).then(function() {
        events.emit('log', 'Deployment completed successfully.');
    });
};

WinAppDeployCmdTool.prototype.uninstallAppPackage = function(packageInfo, targetDevice) {
    return spawn(this.path, ['uninstall', '-package', packageInfo, '-ip', targetDevice.__ip]);
};

// usage: require('deployment').getDeploymentTool('8.1');
module.exports = DeploymentTool;
