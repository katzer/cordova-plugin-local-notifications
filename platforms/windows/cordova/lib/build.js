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
var nopt  = require('nopt');
var shell = require('shelljs');
var utils = require('./utils');
var prepare = require('./prepare');
var package = require('./package');
var Version = require('./Version');
var MSBuildTools = require('./MSBuildTools');
var AppxManifest = require('./AppxManifest');
var ConfigParser = require('./ConfigParser');
var fs = require('fs');

var events = require('cordova-common').events;
var CordovaError = require('cordova-common').CordovaError;

var projFiles = {
    phone: 'CordovaApp.Phone.jsproj',
    win: 'CordovaApp.Windows.jsproj',
    win10: 'CordovaApp.Windows10.jsproj'
};
var projFilesToManifests = {
    'CordovaApp.Phone.jsproj': 'package.phone.appxmanifest',
    'CordovaApp.Windows.jsproj': 'package.windows.appxmanifest',
    'CordovaApp.Windows10.jsproj': 'package.windows10.appxmanifest'
};

var ROOT = path.resolve(__dirname, '../..');

// builds cordova-windows application with parameters provided.
// See 'help' function for args list
module.exports.run = function run (buildOptions) {

    ROOT = this.root || ROOT;

    if (!utils.isCordovaProject(this.root)){
        return Q.reject(new CordovaError('Could not find project at ' + this.root));
    }

    var buildConfig = parseAndValidateArgs(buildOptions);

    return MSBuildTools.findAllAvailableVersions()
    .then(function(msbuildTools) {
        // Apply build related configs
        prepare.updateBuildConfig(buildConfig);

        if (buildConfig.publisherId) {
            updateManifestWithPublisher(msbuildTools, buildConfig);
        }

        cleanIntermediates();
        return buildTargets(msbuildTools, buildConfig);
    })
    .then(function(pkg) {
        events.emit('verbose', ' BUILD OUTPUT: ' + pkg.appx);
        return pkg;
    });
};

// returns list of projects to be built based on config.xml and additional parameters (-appx)
module.exports.getBuildTargets  = function(isWinSwitch, isPhoneSwitch, projOverride) {

    // apply build target override if one was specified
    if (projOverride) {
        switch (projOverride.toLowerCase()) {
            case '8.1-phone':
                return [projFiles.phone];
            case '8.1-win':
                return [projFiles.win];
            case 'uap':
                return [projFiles.win10];
            default:
                events.emit('warn', 'Ignoring unrecognized --appx parameter passed to build: "' + projOverride + '"');
                break;
        }
    }

    var configXML = new ConfigParser(path.join(ROOT, 'config.xml'));
    var targets = [];
    var noSwitches = !(isPhoneSwitch || isWinSwitch);

    // Windows
    if (isWinSwitch || noSwitches) { // if --win or no arg
        var windowsTargetVersion = configXML.getWindowsTargetVersion();
        switch(windowsTargetVersion.toLowerCase()) {
            case '8':
            case '8.0':
                throw new CordovaError('windows8 platform is deprecated. To use windows-target-version=8.0 you must downgrade to cordova-windows@4.');
            case '8.1':
                targets.push(projFiles.win);
                break;
            case '10.0':
            case 'uap':
                targets.push(projFiles.win10);
                break;
            default:
                throw new CordovaError('Unsupported windows-target-version value: ' + windowsTargetVersion);
        }
    }

    // Windows Phone
    if (isPhoneSwitch || noSwitches) { // if --phone or no arg
        var windowsPhoneTargetVersion = configXML.getWindowsPhoneTargetVersion();
        switch(windowsPhoneTargetVersion.toLowerCase()) {
            case '8.1':
                targets.push(projFiles.phone);
                break;
            case '10.0':
            case 'uap':
                if (targets.indexOf(projFiles.win10) < 0) {
                    // Already built due to --win or no switches
                    // and since the same thing can be run on Phone as Windows,
                    // we can skip this one.
                    targets.push(projFiles.win10);
                }
                break;
            default:
                throw new Error('Unsupported windows-phone-target-version value: ' + windowsPhoneTargetVersion);
        }
    }

    return targets;
};

/**
 * Parses and validates buildOptions object and platform-specific CLI arguments,
 *   provided via argv field
 *
 * @param   {Object}  [options]  An options object. If not specified, result
 *   will be populated with default values.
 *
 * @return  {Object}             Build configuration, used by other methods
 */
function parseAndValidateArgs(options) {
    // parse and validate args
    var args = nopt({
        'archs': [String],
        'appx': String,
        'phone': Boolean,
        'win': Boolean,
        'bundle': Boolean,
        'packageCertificateKeyFile': String,
        'packageThumbprint': String,
        'publisherId': String,
        'buildConfig': String,
        'buildFlag': [String, Array]
    }, {}, options.argv, 0);

    var config = {};
    var buildConfig = {};

    // Validate args
    if (options.debug && options.release) {
        throw new CordovaError('Cannot specify "debug" and "release" options together.');
    }

    if (args.phone && args.win) {
        throw new CordovaError('Cannot specify "phone" and "win" options together.');
    }

    // get build options/defaults
    config.buildType = options.release ? 'release' : 'debug';

    var archs = options.archs || args.archs;
    config.buildArchs = archs ? archs.toLowerCase().split(' ') : ['anycpu'];

    config.phone = args.phone ? true : false;
    config.win = args.win ? true : false;
    config.projVerOverride = args.appx;
    // only set config.bundle if architecture is not anycpu
    if (args.bundle) {
        if (config.buildArchs.length > 1 && (config.buildArchs.indexOf('anycpu') > -1 || config.buildArchs.indexOf('any cpu') > -1)) {
            // Not valid to bundle anycpu with cpu-specific architectures.  warn, then don't bundle
            events.emit('warn', '"anycpu" and CPU-specific architectures were selected. ' +
                'This is not valid when enabling bundling with --bundle. Disabling bundling for this build.');
        } else {
            config.bundle = true;
        }
    }

    // if build.json is provided, parse it
    var buildConfigPath = options.buildConfig || args.buildConfig;
    if (buildConfigPath) {
        buildConfig = parseBuildConfig(buildConfigPath, config.buildType);
        for (var prop in buildConfig) { config[prop] = buildConfig[prop]; }
    }

    // Merge buildFlags from build config and CLI arguments into
    // single array ensuring that ones from CLI take a precedence
    config.buildFlags = [].concat(buildConfig.buildFlag || [], args.buildFlag || []);

    // CLI arguments override build.json config
    if (args.packageCertificateKeyFile) {
        args.packageCertificateKeyFile = path.resolve(process.cwd(), args.packageCertificateKeyFile);
        config.packageCertificateKeyFile = args.packageCertificateKeyFile;
    }

    config.packageThumbprint = config.packageThumbprint || args.packageThumbprint;
    config.publisherId = config.publisherId || args.publisherId;

    return config;
}

function parseBuildConfig(buildConfigPath, buildType) {
    var buildConfig, result = {};
    events.emit('verbose', 'Reading build config file: '+ buildConfigPath);
    try {
        var contents = fs.readFileSync(buildConfigPath, 'utf8');
        buildConfig = JSON.parse(contents.replace(/^\ufeff/, '')); // Remove BOM
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new CordovaError('Specified build config file does not exist: ' + buildConfigPath);
        }
        else {
            throw e;
        }
    }

    if (!(buildConfig.windows && buildConfig.windows[buildType])) return {};

    var windowsInfo = buildConfig.windows[buildType];

    // If provided assume it's a relative path
    if(windowsInfo.packageCertificateKeyFile) {
        var buildPath = path.dirname(fs.realpathSync(buildConfigPath));
        result.packageCertificateKeyFile = path.resolve(buildPath, windowsInfo.packageCertificateKeyFile);
    }

    if(windowsInfo.packageThumbprint) {
        result.packageThumbprint = windowsInfo.packageThumbprint;
    }

    if(windowsInfo.publisherId) {
        // Quickly validate publisherId
        var publisherRegexStr = '(CN|L|O|OU|E|C|S|STREET|T|G|I|SN|DC|SERIALNUMBER|(OID\\.(0|[1-9][0-9]*)(\\.(0|[1-9][0-9]*))+))=' +
                                '(([^,+="<>#;])+|".*")(, (' +
                                '(CN|L|O|OU|E|C|S|STREET|T|G|I|SN|DC|SERIALNUMBER|(OID\\.(0|[1-9][0-9]*)(\\.(0|[1-9][0-9]*))+))=' +
                                '(([^,+="<>#;])+|".*")))*';

        var publisherRegex = new RegExp(publisherRegexStr);

        if (!publisherRegex.test(windowsInfo.publisherId)) {
            throw new CordovaError('Invalid publisher id: ' + windowsInfo.publisherId);
        }

        result.publisherId = windowsInfo.publisherId;
    }

    if (windowsInfo.buildFlag) {
        result.buildFlag = windowsInfo.buildFlag;
    }

    return result;
}

// Note: This function is very narrow and only writes to the app manifest if an update is done.  See CB-9450 for the
// reasoning of why this is the case.
function updateManifestWithPublisher(allMsBuildVersions, config) {
    if (!config.publisherId) return;

    var selectedBuildTargets = getBuildTargets(config);
    var msbuild = getLatestMSBuild(allMsBuildVersions);
    var myBuildTargets = filterSupportedTargets(selectedBuildTargets, msbuild);
    var manifestFiles = myBuildTargets.map(function(proj) {
        return projFilesToManifests[proj];
    });
    manifestFiles.forEach(function(file) {
        var manifest = AppxManifest.get(path.join(ROOT, file));
        manifest.getIdentity().setPublisher(config.publisherId);
        manifest.write();
    });
}

function buildTargets(allMsBuildVersions, config) {
    // filter targets to make sure they are supported on this development machine
    var selectedBuildTargets = getBuildTargets(config);
    var msbuild = getLatestMSBuild(allMsBuildVersions);
    if (!msbuild) {
        return Q.reject(new CordovaError('No valid MSBuild was detected for the selected target.'));
    }
    events.emit('verbose', 'Using MSBuild v' + msbuild.version + ' from ' + msbuild.path);
    var myBuildTargets = filterSupportedTargets(selectedBuildTargets, msbuild);

    var buildConfigs = [];
    var bundleTerms = '';
    var hasAnyCpu = false;
    var shouldBundle = !!config.bundle;

    // collect all build configurations (pairs of project to build and target architecture)
    myBuildTargets.forEach(function(buildTarget) {
        config.buildArchs.forEach(function(buildArch) {
            buildConfigs.push({
                target:buildTarget,
                arch: buildArch
            });

            if (buildArch === 'anycpu' || buildArch === 'any cpu') {
                hasAnyCpu = true;
                bundleTerms = 'neutral';
            }

            if (!hasAnyCpu) {
                if (bundleTerms.length > 0) {
                    bundleTerms += '|';
                }
                bundleTerms += buildArch;
            }
        });
    });

    // run builds serially
    var buildsCompleted = buildConfigs.reduce(function (promise, build, index, configsArray) {
         return promise.then(function () {
            // support for "any cpu" specified with or without space
            if (build.arch == 'any cpu') {
                build.arch = 'anycpu';
            }

            // Send build flags to MSBuild
            var otherProperties = [].concat(config.buildFlags);

            if (shouldBundle) {
                // Only add the CordovaBundlePlatforms argument when on the last build step
                var bundleArchs = (index === configsArray.length - 1) ? bundleTerms : build.arch;
                otherProperties.push('/p:CordovaBundlePlatforms=' + bundleArchs);
            } else {
                // https://issues.apache.org/jira/browse/CB-12416
                // MSBuild uses AppxBundle=Always by default which leads to a bundle created even if
                // --bundle was not passed - override that:
                otherProperties.push('/p:AppxBundle=Never');
            }

            // https://issues.apache.org/jira/browse/CB-12298
            if (config.targetProject === 'windows10' && config.buildType === 'release') {
                otherProperties.push('/p:UapAppxPackageBuildMode=StoreUpload');
            }

            return msbuild.buildProject(path.join(ROOT, build.target), config.buildType,  build.arch, otherProperties);
         });
    }, Q());

    if (shouldBundle) {
        return buildsCompleted.then(function() {
            return clearIntermediatesAndGetPackage(bundleTerms, config, hasAnyCpu);
        });
    } else {
        return buildsCompleted.then(function() {
            return package.getPackage(config.targetProject, config.buildType, config.buildArchs[0]);
        });
    }
}

function clearIntermediatesAndGetPackage(bundleTerms, config, hasAnyCpu) {
    // msbuild isn't capable of generating bundles unless you enable bundling for each individual arch
    // However, that generates intermediate bundles, like "CordovaApp.Windows10_0.0.1.0_x64.appxbundle"
    // We need to clear the intermediate bundles, or else "cordova run" will fail because of too
    // many .appxbundle files.
    events.emit('verbose', 'Clearing intermediates...');
    var appPackagesPath = path.join(ROOT, 'AppPackages');
    var childDirectories = shell.ls(path.join(appPackagesPath, '*')).map(function(pathName) {
        return { path: pathName, stats: fs.statSync(pathName) };
    }).filter(function(fileInfo) {
        return fileInfo.stats.isDirectory();
    });

    if (childDirectories.length === 0) {
        throw new Error('Could not find a completed app package directory.');
    }

    // find the most-recently-modified directory
    childDirectories.sort(function(a, b) { return b.stats.mtime - a.stats.mtime; });
    var outputDirectory = childDirectories[0];

    var finalFile = '';
    var archSearchString = bundleTerms.replace(/\|/g, '_') + (config.buildType === 'debug' ? '_debug' : '') + '.appxbundle';
    if (hasAnyCpu) {
        archSearchString = 'AnyCPU' + (config.buildType === 'debug' ? '_debug' : '') + '.appxbundle';
    }

    var filesToDelete = shell.ls(path.join(outputDirectory.path, '*.appx*')).filter(function(appxbundle) {
        var isMatch = appxbundle.indexOf(archSearchString) === -1;
        if (!isMatch) {
            finalFile = appxbundle;
        }
        return isMatch;
    });
    filesToDelete.forEach(function(file) {
        shell.rm(file);
    });

    return package.getPackageFileInfo(finalFile);
}

// Can update buildConfig in the following ways:
//  * Sets targetProject property, the project to launch when complete
function getBuildTargets(buildConfig) {
    var configXML = new ConfigParser(path.join(ROOT, 'config.xml'));
    var targets = [];
    var noSwitches = !(buildConfig.phone || buildConfig.win);

    // Windows
    if (buildConfig.win || noSwitches) { // if --win or no arg
        var windowsTargetVersion = configXML.getWindowsTargetVersion();
        switch(windowsTargetVersion) {
            case '8':
            case '8.0':
                throw new CordovaError('windows8 platform is deprecated. To use windows-target-version=8.0 you must downgrade to cordova-windows@4.');
            case '8.1':
                targets.push(projFiles.win);
                break;
            case '10.0':
            case 'UAP':
                targets.push(projFiles.win10);
                break;
            default:
                throw new Error('Unsupported windows-target-version value: ' + windowsTargetVersion);
        }
    }

    // Windows Phone
    if (buildConfig.phone || noSwitches) { // if --phone or no arg
        var windowsPhoneTargetVersion = configXML.getWindowsPhoneTargetVersion();
        switch(windowsPhoneTargetVersion) {
            case '8.1':
                targets.push(projFiles.phone);
                break;
            case '10.0':
            case 'UAP':
                if (!buildConfig.win && !noSwitches) {
                    // Already built due to --win or no switches
                    // and since the same thing can be run on Phone as Windows,
                    // we can skip this one.
                    targets.push(projFiles.win10);
                }
                break;
            default:
                throw new Error('Unsupported windows-phone-target-version value: ' + windowsPhoneTargetVersion);
        }
    }

    // apply build target override if one was specified
    if (buildConfig.projVerOverride) {
        switch (buildConfig.projVerOverride) {
            case '8.1-phone':
                targets = [projFiles.phone];
                break;
            case '8.1-win':
                targets = [projFiles.win];
                break;
            case 'uap':
                targets = [projFiles.win10];
                break;
            default:
                events.emit('warn', 'Ignoring unrecognized --appx parameter passed to build: "' + buildConfig.projVerOverride + '"');
                break;
        }
    }

    // As part of reworking how build and package determine the winning project, set the 'target type' project
    // as part of build configuration.  This will be used for determining the binary to 'run' after build is done.
    if (targets.length > 0) {
        switch (targets[0]) {
            case projFiles.phone:
                buildConfig.targetProject = 'phone';
                break;
            case projFiles.win10:
                buildConfig.targetProject = 'windows10';
                break;
            case projFiles.win:
                /* falls through */
            default:
                buildConfig.targetProject = 'windows';
                break;
        }
    }

    return targets;
}

function getLatestMSBuild(allMsBuildVersions) {
    var availableVersions = allMsBuildVersions
    .filter(function (buildTools) {
        // Sanitize input - filter out tools w/ invalid versions
        return Version.tryParse(buildTools.version);
    })
    .sort(function (a, b) {
        // Sort tools list - use parsed Version objects for that
        // to respect both major and minor versions segments
        var parsedA = Version.fromString(a.version);
        var parsedB = Version.fromString(b.version);

        if (parsedA.gt(parsedB)) return -1;
        if (parsedA.eq(parsedB)) return 0;
        return 1;
    });

    if (availableVersions.length > 0) {
        // After sorting the first item will be the highest version available
        return availableVersions[0];
    }
}

// TODO: Fix this so that it outlines supported versions based on version criteria:
// - v14: Windows 8.1, Windows 10
// - v12: Windows 8.1
function msBuild12TargetsFilter(target) {
    return target === projFiles.win || target === projFiles.phone;
}

function msBuild14TargetsFilter(target) {
    return target === projFiles.win || target === projFiles.phone || target === projFiles.win10;
}

function msBuild15TargetsFilter(target) {
    return target === projFiles.win || target === projFiles.phone || target === projFiles.win10;
}

function filterSupportedTargets (targets, msbuild) {
    if (!targets || targets.length === 0) {
        events.emit('warn', 'No build targets specified');
        return [];
    }

    var targetFilters = {
        '12.0': msBuild12TargetsFilter,
        '14.0': msBuild14TargetsFilter,
        '15.x': msBuild15TargetsFilter,
        get: function (version) {
            // Apart from exact match also try to get filter for version range
            // so we can find for example targets for version '15.1'
            return this[version] || this[version.replace(/\.\d+$/, '.x')];
        }
    };

    var filter = targetFilters.get(msbuild.version);
    if (!filter) {
        events.emit('warn', 'MSBuild v' + msbuild.version + ' is not supported, aborting.');
        return [];
    }

    var supportedTargets = targets.filter(filter);
    // unsupported targets have been detected
    if (supportedTargets.length !== targets.length) {
        events.emit('warn', 'Not all desired build targets are compatible with the current build environment. ' +
            'Please install Visual Studio 2015 for Windows 8.1 and Windows 10, ' +
            'or Visual Studio 2013 Update 2 for Windows 8.1.');
    }
    return supportedTargets;
}

function cleanIntermediates() {
    var buildPath = path.join(ROOT, 'build');
    if (shell.test('-e', buildPath)) {
        shell.rm('-rf', buildPath);
    }
}

// cleans the project, removes AppPackages and build folders.
module.exports.clean = function () {
    var projectPath = this.root;
    ['AppPackages', 'build']
    .forEach(function(dir) {
        shell.rm('-rf', path.join(projectPath, dir));
    });
    return Q.resolve();
};
