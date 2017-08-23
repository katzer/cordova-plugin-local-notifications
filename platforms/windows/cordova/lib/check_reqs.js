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

/*jshint node:true*/

var Q     = require('q');
var os    = require('os');
var path  = require('path');
var shell = require('shelljs');
var spawn = require('cordova-common').superspawn.spawn;
var CordovaError = require('cordova-common').CordovaError;

var ConfigParser, MSBuildTools, Version;
try {
    ConfigParser = require('../../template/cordova/lib/ConfigParser');
    MSBuildTools = require('../../template/cordova/lib/MSBuildTools');
    Version = require('../../template/cordova/lib/Version');
} catch (ex) {
    // If previous import fails, we're probably running this script
    // from installed platform and the module location is different.
    ConfigParser = require('./ConfigParser');
    MSBuildTools = require('./MSBuildTools');
    Version = require('./Version');
}

// The constant for VS2013 Upd2 PackageVersion. See MSDN for
// reference: https://msdn.microsoft.com/en-us/library/bb164659(v=vs.120).aspx
var VS2013_UPDATE2_RC = new Version(12, 0, 30324);
var REQUIRED_VERSIONS = {
    '8.1': {
        os: '6.3',
        msbuild: '12.0',
        visualstudio: '12.0',
        windowssdk: '8.1',
        phonesdk: '8.1'
    },
    '10.0': {
        // Note that Windows 10 target is also supported on Windows 7, so this should look
        // like '6.1 || >=6.3', but due to Version module restricted functionality we handle
        // this case separately in checkOS function below.
        os: '6.3',
        msbuild: '14.0',
        visualstudio: '14.0',
        windowssdk: '10.0',
        phonesdk: '10.0'
    }
};

function getMinimalRequiredVersionFor (requirement, windowsTargetVersion, windowsPhoneTargetVersion) {

    if (windowsTargetVersion === '8' || windowsTargetVersion === '8.0') {
        throw new CordovaError('windows8 platform is deprecated. To use windows-target-version=8.0 you may downgrade to cordova-windows@4.');
    }

    if (windowsPhoneTargetVersion === '8' || windowsPhoneTargetVersion === '8.0') {
        throw new CordovaError('8.0 is not a valid version for windows-phone-target-version (use the wp8 Cordova platform instead)');
    }
    var windowsReqVersion = Version.tryParse(REQUIRED_VERSIONS[windowsTargetVersion][requirement]);
    var phoneReqVersion = Version.tryParse(REQUIRED_VERSIONS[windowsPhoneTargetVersion][requirement]);

    // If we're searching for Windows SDK, we're not
    // interested in Phone's version and and vice versa.
    if (requirement === 'windowssdk') return windowsReqVersion;
    if (requirement === 'phonesdk') return phoneReqVersion;

    // If both windowsReqVersion and phoneReqVersion is valid Versions, choose the max one
    if (windowsReqVersion && phoneReqVersion) {
        return windowsReqVersion.gt(phoneReqVersion) ?
            windowsReqVersion :
            phoneReqVersion;
    }

    // Otherwise return that one which is defined and valid
    return windowsReqVersion || phoneReqVersion;
}

function getHighestAppropriateVersion (versions, requiredVersion) {
    return versions.map(function (version) {
        return Version.tryParse(version);
    })
    .sort(Version.comparer)
    .filter(function (toolVersion) {
        return toolVersion.gte(requiredVersion);
    })[0];
}

/**
 * Return Version object for current Windows version. User 'ver' binary or
 *   os.release() in case of errors.
 *
 * @return  {Version}  Version information for current OS.
 */
function getWindowsVersion() {
    return spawn('ver').then(function (output) {
        var match = /\[Version (.*)\]\s*$/.exec(output);
        return Version.fromString(match[1]);
    }).fail(function () {
        return Version.fromString(os.release());
    });
}

/**
 * Lists all Visual Studio versions insalled. For VS 2013 if it present, also
 *   checks if Update 2 is installed.
 *
 * @return  {String[]}  List of installed Visual Studio versions.
 */
function getInstalledVSVersions() {
    // Query all keys with Install value equal to 1, then filter out
    // those, which are not related to VS itself
    return spawn('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\DevDiv\\vs\\Servicing', '/s', '/v', 'Install', '/f', '1', '/d', '/e', '/reg:32'])
    .fail(function () { return ''; })
    .then(function (output) {
        return output.split('\n')
        .reduce(function (installedVersions, line) {
            var match = /(\d+\.\d+)\\(ultimate|professional|premium|community)/.exec(line);
            if (match && match[1] && installedVersions.indexOf(match[1]) === -1)
                installedVersions.push(match[1]);
            return installedVersions;
        }, []);
    })
    .then(function (installedVersions) {
        // If there is no VS2013 installed, the we have nothing to do
        if (installedVersions.indexOf('12.0') === -1) return installedVersions;

        // special case for VS 2013. We need to check if VS2013 update 2 is installed
        return spawn('reg', ['query','HKLM\\SOFTWARE\\Microsoft\\Updates\\Microsoft Visual Studio 2013\\vsupdate_KB2829760','/v','PackageVersion','/reg:32'])
        .then(function (output) {
            var updateVer = Version.fromString(/PackageVersion\s+REG_SZ\s+(.*)/i.exec(output)[1]);
            // if update version is lover than Update2, reject the promise
            if (VS2013_UPDATE2_RC.gte(updateVer)) return Q.reject();
            return installedVersions;
        })
        .fail(function () {
            // if we got any errors on previous steps, we're assuming that
            // required VS update is not installed.
            installedVersions.splice(installedVersions.indexOf('12.0'), 1);
            return installedVersions;
        });
    });
}

/**
 * Gets list of installed Windows SDKs
 *
 * @return  {Version[]}  List of installed SDKs' versions
 */
function getInstalledWindowsSdks () {
    var installedSdks = [];
    return spawn('reg', ['query','HKLM\\SOFTWARE\\Microsoft\\Microsoft SDKs\\Windows','/s','/v','InstallationFolder','/reg:32'])
    .fail(function () { return ''; })
    .then(function (output) {
        var re = /\\Microsoft SDKs\\Windows\\v(\d+\.\d+)\s*InstallationFolder\s+REG_SZ\s+(.*)/gim;
        var match;
        while ((match = re.exec(output))){
            var sdkPath = match[2];
            // Verify that SDKs is really installed by checking SDKManifest file at SDK root
            if (shell.test('-e', path.join(sdkPath, 'SDKManifest.xml'))) {
                installedSdks.push(Version.tryParse(match[1]));
            }
        }
    })
    .thenResolve(installedSdks);
}

/**
 * Gets list of installed Windows Phone SDKs. Separately searches for 8.1 Phone
 *   SDK and Windows 10 SDK, because the latter is needed for both Windows and
 *   Windows Phone applications.
 *
 * @return  {Version[]}  List of installed Phone SDKs' versions.
 */
function getInstalledPhoneSdks () {
    var installedSdks = [];
    return spawn('reg', ['query','HKLM\\SOFTWARE\\Microsoft\\Microsoft SDKs\\Windows Phone\\v8.1','/v','InstallationFolder','/reg:32'])
    .fail(function () { return ''; })
    .then(function (output) {
        var match = /\\Microsoft SDKs\\Windows Phone\\v(\d+\.\d+)\s*InstallationFolder\s+REG_SZ\s+(.*)/gim.exec(output);
        if (match && shell.test('-e', path.join(match[2], 'SDKManifest.xml'))) {
            installedSdks.push(Version.tryParse(match[1]));
        }
    })
    .then(function () {
        return spawn('reg', ['query','HKLM\\SOFTWARE\\Microsoft\\Microsoft SDKs\\Windows\\v10.0','/v','InstallationFolder','/reg:32']);
    })
    .fail(function () { return ''; })
    .then(function (output) {
        var match = /\\Microsoft SDKs\\Windows\\v(\d+\.\d+)\s*InstallationFolder\s+REG_SZ\s+(.*)/gim.exec(output);
        if (match && shell.test('-e', path.join(match[2], 'SDKManifest.xml'))) {
            installedSdks.push(Version.tryParse(match[1]));
        }
    })
    .thenResolve(installedSdks);
}

/**
 * Shortens version string or Version object by leaving only first two segments
 *   (major and minor).
 * @param   {String|Version}  version  The version identifier. Either Version
 *   object or string that looks like "12.5.6"
 * @return  {String}          Shortened version, or undefined if provided
 *   parameter is not a valid version
 */
function shortenVersion (version) {
    return /^(\d+(?:\.\d+)?)/.exec(version.toString())[1];
}

function mapWindowsVersionToName(version) {
    var map = {
        '6.2': 'Windows 8',
        '6.3': 'Windows 8.1',
        '10.0': 'Windows 10'
    };
    var majorMinor = shortenVersion(version);
    return map[majorMinor];
}

function mapVSVersionToName(version) {
    var map = {
        '11.0': '2012 Express for Windows',
        '12.0': '2013 Express for Windows Update2',
        '14.0': '2015 Community'
    };
    var majorMinor = shortenVersion(version);
    return map[majorMinor];
}

/**
 * Check if current OS is supports building windows platform
 * @return {Promise} Promise either fullfilled or rejected with error message.
 */
var checkOS = function (windowsTargetVersion, windowsPhoneTargetVersion) {
    if (process.platform !== 'win32') {
        // Build Universal windows apps available for windows platform only, so we reject on others platforms
        return Q.reject('Cordova tooling for Windows requires Windows OS to build project');
    }

    return getWindowsVersion().then(function (actualVersion) {
        var requiredOsVersion = getMinimalRequiredVersionFor('os', windowsTargetVersion, windowsPhoneTargetVersion);
        if (actualVersion.gte(requiredOsVersion) ||
            // Special case for Windows 10/Phone 10  targets which can be built on Windows 7 (version 6.1)
            actualVersion.major === 6 && actualVersion.minor === 1 && getConfig().getWindowsTargetVersion() === '10.0') {
            return mapWindowsVersionToName(actualVersion);
        }

        return Q.reject('Current Windows version doesn\'t support building this project. ' +
            'Consider upgrading your OS to ' + mapWindowsVersionToName(requiredOsVersion));
    });
};

/**
 * Checks if MSBuild tools is available.
 * @return {Promise} Promise either fullfilled with MSBuild version
 *                           or rejected with error message.
 */
var checkMSBuild = function (windowsTargetVersion, windowsPhoneTargetVersion) {
    return MSBuildTools.findAllAvailableVersions()
    .then(function (msbuildToolsVersions) {
        var msbuildRequiredVersion = getMinimalRequiredVersionFor('msbuild', windowsTargetVersion, windowsPhoneTargetVersion);
        msbuildToolsVersions = msbuildToolsVersions.map(function (msbuildToolsVersion) {
            return msbuildToolsVersion.version;
        });

        var appropriateVersion = getHighestAppropriateVersion(msbuildToolsVersions, msbuildRequiredVersion);
        return appropriateVersion ?
            shortenVersion(appropriateVersion) :
            Q.reject('MSBuild tools v.' + shortenVersion(msbuildRequiredVersion) + ' not found. ' +
                'Please install Visual Studio ' + mapVSVersionToName(getMinimalRequiredVersionFor('visualstudio', windowsTargetVersion, windowsPhoneTargetVersion)) +
                ' from https://www.visualstudio.com/downloads/download-visual-studio-vs');
    });
};

var checkVS = function (windowsTargetVersion, windowsPhoneTargetVersion) {
    var vsRequiredVersion = getMinimalRequiredVersionFor('visualstudio', windowsTargetVersion, windowsPhoneTargetVersion);

    return getInstalledVSVersions()
    .then(function (installedVersions) {
        var appropriateVersion = getHighestAppropriateVersion(installedVersions, vsRequiredVersion);
        return appropriateVersion ?
            shortenVersion(appropriateVersion) :
            Q.reject('Required version of Visual Studio not found. Please install Visual Studio ' +
                mapVSVersionToName(vsRequiredVersion) +
                ' from https://www.visualstudio.com/downloads/download-visual-studio-vs');
    });
};

var checkWinSdk = function (windowsTargetVersion, windowsPhoneTargetVersion) {
    return getInstalledWindowsSdks()
    .then(function (installedSdks) {
        var requiredVersion = getMinimalRequiredVersionFor('windowssdk', windowsTargetVersion, windowsPhoneTargetVersion);
        var hasSdkInstalled = installedSdks.some(function (installedSdk) {
            return installedSdk.eq(requiredVersion);
        });
        if (!hasSdkInstalled) {
            return Q.reject('Windows SDK not found. Ensure that you have installed ' +
                'Windows ' + shortenVersion(requiredVersion) + ' SDK along with Visual Studio or install ' +
                'Windows ' + shortenVersion(requiredVersion) + ' SDK separately from ' +
                'https://dev.windows.com/en-us/downloads');
        }

        return shortenVersion(requiredVersion);
    });
};

var checkPhoneSdk = function (windowsTargetVersion, windowsPhoneTargetVersion) {
    var requiredVersion = getMinimalRequiredVersionFor('phonesdk', windowsTargetVersion, windowsPhoneTargetVersion);
    return getInstalledPhoneSdks()
    .then(function (installedSdks) {
        var hasSdkInstalled = installedSdks.some(function (installedSdk) {
            return installedSdk.eq(requiredVersion);
        });

        return hasSdkInstalled ?
            shortenVersion(requiredVersion) :
            Q.reject();
    })
    .fail(function () {
        return Q.reject('Windows Phone SDK not found. Ensure that you have installed ' +
            'Windows Phone ' + shortenVersion(requiredVersion) + ' SDK along with Visual Studio or install ' +
            'Windows Phone ' + shortenVersion(requiredVersion) + ' SDK separately from ' +
            'https://dev.windows.com/develop/download-phone-sdk');
    });
};

module.exports.run = function () {
    return checkOS().then(function () {
        return MSBuildTools.findAvailableVersion();
    });
};

/** Checks if Windows SDK required to build the target_platform is present
 * @param {String}  target_platorm        Target platform ('8.1' or '10.0')
 */
module.exports.isWinSDKPresent = function (target_platform) {
    return checkWinSdk(target_platform, '8.1');
};

// Checks if min SDK required to build Windows Phone 8.1 project is present
module.exports.isPhoneSDKPresent = function () {
    return checkPhoneSdk('8.1', '8.1');
};

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

var requirements = [
    new Requirement('os', 'Windows OS', true),
    new Requirement('msbuild', 'MSBuild Tools'),
    new Requirement('visualstudio', 'Visual Studio'),
    new Requirement('windowssdk', 'Windows SDK'),
    new Requirement('phonesdk', 'Windows Phone SDK')
];

// Define list of checks needs to be performed
var checkFns = [checkOS, checkMSBuild, checkVS, checkWinSdk, checkPhoneSdk];

var config = null;
function getConfig() {
    try {
        config = config || new ConfigParser(path.join(__dirname, '../../config.xml'));
        return Q(config);
    } catch (e) {
        return Q.reject(new CordovaError('Can\'t check requirements for Windows platform.' +
            'The config.xml file is either missing or malformed.'));
    }
}

/**
 * Methods that runs all checks one by one and returns a result of checks
 * as an array of Requirement objects. This method intended to be used by cordova-lib check_reqs method.
 * @return Promise<Requirement[]> Array of requirements. Due to implementation, promise is always fulfilled.
 */
module.exports.check_all = function() {

    var result = [];
    var fatalIsHit = false;

    // Then execute requirement checks one-by-one
    return checkFns.reduce(function (promise, checkFn, idx) {
        return promise.then(function () {
            // If fatal requirement is failed,
            // we don't need to check others
            if (fatalIsHit) return Q();
            var requirement = requirements[idx];
            return getConfig()
            .then(function (config) {
                return checkFn(config.getWindowsTargetVersion(), config.getWindowsPhoneTargetVersion())
                .then(function (version) {
                    requirement.installed = true;
                    requirement.metadata.version = version;
                    result.push(requirement);
                }).catch( function (err) {
                    if (requirement.isFatal) fatalIsHit = true;
                    requirement.metadata.reason = err;
                    result.push(requirement);
                });
            });

        });
    }, Q())
    .then(function () {
        // When chain is completed, return requirements array to upstream API
        return result;
    });
};

module.exports.help = function () {
    console.log('Usage: check_reqs or node check_reqs');
};
