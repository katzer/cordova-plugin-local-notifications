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
    path  = require('path'),
    exec  = require('./exec'),
    shell = require('shelljs'),
    spawn  = require('./spawn'),
    Version = require('./Version');

function MSBuildTools (version, path) {
    this.version = version;
    this.path = path;
}

MSBuildTools.prototype.buildProject = function(projFile, buildType, buildarch, otherConfigProperties) {
    console.log('Building project: ' + projFile);
    console.log('\tConfiguration : ' + buildType);
    console.log('\tPlatform      : ' + buildarch);

    var args = ['/clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal', '/nologo',
    '/p:Configuration=' + buildType,
    '/p:Platform=' + buildarch];

    if (otherConfigProperties) {
        var keys = Object.keys(otherConfigProperties);
        keys.forEach(function(key) {
            args.push('/p:' + key + '=' + otherConfigProperties[key]);
        });
    }

    return spawn(path.join(this.path, 'msbuild'), [projFile].concat(args));
};

// returns full path to msbuild tools required to build the project and tools version
module.exports.findAvailableVersion = function () {
    var versions = ['14.0', '12.0', '4.0'];

    return Q.all(versions.map(checkMSBuildVersion)).then(function (versions) {
        // select first msbuild version available, and resolve promise with it
        var msbuildTools = versions[0] || versions[1] || versions[2];

        return msbuildTools ? Q.resolve(msbuildTools) : Q.reject('MSBuild tools not found');
    });
};

module.exports.findAllAvailableVersions = function () {
    var versions = ['14.0', '12.0', '4.0'];

    return Q.all(versions.map(checkMSBuildVersion)).then(function(unprocessedResults) {
        return unprocessedResults.filter(function(item) {
            return !!item;
        });
    });
};

function checkMSBuildVersion(version) {
    var deferred = Q.defer();
    exec('reg query HKLM\\SOFTWARE\\Microsoft\\MSBuild\\ToolsVersions\\' + version + ' /v MSBuildToolsPath')
    .then(function(output) {
        // fetch msbuild path from 'reg' output
        var path = /MSBuildToolsPath\s+REG_SZ\s+(.*)/i.exec(output);
        if (path) {
            path = path[1];
            // CB-9565: Windows 10 invokes .NET Native compiler, which only runs on x86 arch,
            // so if we're running an x64 Node, make sure to use x86 tools.
            if (version === '14.0' && path.indexOf('amd64') > -1) {
                path = require('path').join(path, '..');
            }
            deferred.resolve(new MSBuildTools(version, path));
            return;
        }
        deferred.resolve(null); // not found
    }, function (err) {
        // if 'reg' exits with error, assume that registry key not found
        deferred.resolve(null);
    });
    return deferred.promise;
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
