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
var path  = require('path');
var shell = require('shelljs');
var Version = require('./Version');
var events = require('cordova-common').events;
var spawn = require('cordova-common').superspawn.spawn;

function MSBuildTools (version, path) {
    this.version = version;
    this.path = path;
}

MSBuildTools.prototype.buildProject = function(projFile, buildType, buildarch, buildFlags) {
    events.emit('log', 'Building project: ' + projFile);
    events.emit('log', '\tConfiguration : ' + buildType);
    events.emit('log', '\tPlatform      : ' + buildarch);

    var checkWinSDK = function (target_platform) {
        return require('./check_reqs').isWinSDKPresent(target_platform);
    };

    var checkPhoneSDK = function () {
        return require('./check_reqs').isPhoneSDKPresent();
    };

    var args = ['/clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal', '/nologo',
    '/p:Configuration=' + buildType,
    '/p:Platform=' + buildarch];

    if (buildFlags) {
        args = args.concat(buildFlags);
    }

    var that = this;
    var promise;

    // Check if SDK required to build the respective platform is present. If not present, return with corresponding error, else call msbuild.
    if (projFile.indexOf('CordovaApp.Phone.jsproj') > -1) {
        promise = checkPhoneSDK();
    }
    else if (projFile.indexOf('CordovaApp.Windows.jsproj') > -1) {
        promise = checkWinSDK('8.1');
    }
    else {
        promise = checkWinSDK('10.0');
    }

    return promise.then(function () {
        return spawn(path.join(that.path, 'msbuild'), [projFile].concat(args), { stdio: 'inherit' });
    });
};

// returns full path to msbuild tools required to build the project and tools version
module.exports.findAvailableVersion = function () {
    var versions = ['15.0', '14.0', '12.0', '4.0'];

    return Q.all(versions.map(checkMSBuildVersion)).then(function (versions) {
        // select first msbuild version available, and resolve promise with it
        var msbuildTools = versions[0] || versions[1] || versions[2] || versions[3];

        return msbuildTools ? Q.resolve(msbuildTools) : Q.reject('MSBuild tools not found');
    });
};

function findAllAvailableVersionsFallBack() {
    var versions = ['15.0', '14.0', '12.0', '4.0'];
    events.emit('verbose', 'Searching for available MSBuild versions...');

    return Q.all(versions.map(checkMSBuildVersion)).then(function(unprocessedResults) {
        return unprocessedResults.filter(function(item) {
            return !!item;
        });
    });
}

module.exports.findAllAvailableVersions = function () {
    // CB-11548 use VSINSTALLDIR environment if defined to find MSBuild. If VSINSTALLDIR
    // is not specified or doesn't contain the MSBuild path we are looking for - fall back
    // to default discovery mechanism.
    if (process.env.VSINSTALLDIR) {
        var msBuildPath = path.join(process.env.VSINSTALLDIR, 'MSBuild/15.0/Bin');
        return module.exports.getMSBuildToolsAt(msBuildPath)
        .then(function (msBuildTools) {
            return [msBuildTools];
        }).catch(findAllAvailableVersionsFallBack);
    }

    return findAllAvailableVersionsFallBack();
};

/**
 * Gets MSBuildTools instance for user-specified location
 *
 * @param {String}  location  FS location where to search for MSBuild
 * @returns  Promise<MSBuildTools>  The MSBuildTools instance at specified location
 */
module.exports.getMSBuildToolsAt = function (location) {
    var msbuildExe = path.resolve(location, 'msbuild');

    // TODO: can we account on these params availability and printed version format?
    return spawn(msbuildExe, ['-version', '-nologo'])
    .then(function (output) {
        // MSBuild prints its' version as 14.0.25123.0, so we pick only first 2 segments
        var version = output.match(/^(\d+\.\d+)/)[1];
        return new MSBuildTools(version, location);
    });
};

function checkMSBuildVersion(version) {
    return spawn('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\MSBuild\\ToolsVersions\\' + version, '/v', 'MSBuildToolsPath'])
    .then(function(output) {
        // fetch msbuild path from 'reg' output
        var toolsPath = /MSBuildToolsPath\s+REG_SZ\s+(.*)/i.exec(output);
        if (toolsPath) {
            toolsPath = toolsPath[1];
            // CB-9565: Windows 10 invokes .NET Native compiler, which only runs on x86 arch,
            // so if we're running an x64 Node, make sure to use x86 tools.
            if ((version === '15.0' || version === '14.0') && toolsPath.indexOf('amd64') > -1) {
                toolsPath = path.resolve(toolsPath, '..');
            }
            events.emit('verbose', 'Found MSBuild v' + version + ' at ' + toolsPath);
            return new MSBuildTools(version, toolsPath);
        }
    })
    .catch(function (err) {
        // if 'reg' exits with error, assume that registry key not found
        return;
    });
}

/// returns an array of available UAP Versions
function getAvailableUAPVersions() {
    /*jshint -W069 */
    var programFilesFolder = process.env['ProgramFiles(x86)'] || process.env['ProgramFiles'];
    // No Program Files folder found, so we won't be able to find UAP SDK
    if (!programFilesFolder) return [];

    var uapFolderPath = path.join(programFilesFolder, 'Windows Kits', '10', 'Platforms', 'UAP');
    if (!shell.test('-e', uapFolderPath)) {
        return []; // No UAP SDK exists on this machine
    }

    var result = [];
    shell.ls(uapFolderPath).filter(function(uapDir) {
        return shell.test('-d', path.join(uapFolderPath, uapDir));
    }).map(function(folder) {
        return Version.tryParse(folder);
    }).forEach(function(version, index) {
        if (version) {
            result.push(version);
        }
    });

    return result;
}

module.exports.getAvailableUAPVersions = getAvailableUAPVersions;
