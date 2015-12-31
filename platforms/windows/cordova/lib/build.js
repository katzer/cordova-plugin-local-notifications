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
    nopt  = require('nopt'),
    shell = require('shelljs'),
    utils = require('./utils'),
    et    = require('elementtree'),
    prepare = require('./prepare'),
    package = require('./package'),
    MSBuildTools = require('./MSBuildTools'),
    ConfigParser = require('./ConfigParser'),
    fs = require('fs');

// Platform project root folder
var ROOT = path.join(__dirname, '..', '..');
var projFiles = {
    phone: 'CordovaApp.Phone.jsproj',
    win: 'CordovaApp.Windows.jsproj',
    win80: 'CordovaApp.Windows80.jsproj',
    win10: 'CordovaApp.Windows10.jsproj'
};
var projFilesToManifests = {
    'CordovaApp.Phone.jsproj': 'package.phone.appxmanifest',
    'CordovaApp.Windows.jsproj': 'package.windows.appxmanifest',
    'CordovaApp.Windows80.jsproj': 'package.windows80.appxmanifest',
    'CordovaApp.Windows10.jsproj': 'package.windows10.appxmanifest'
};

// builds cordova-windows application with parameters provided.
// See 'help' function for args list
module.exports.run = function run (argv) {

    if (!utils.isCordovaProject(ROOT)){
        return Q.reject('Could not find project at ' + ROOT);
    }

    return Q.all([parseAndValidateArgs(argv), MSBuildTools.findAllAvailableVersions()])
        .spread(function(buildConfig, msbuildTools) {
            // Apply build related configs
            prepare.updateBuildConfig(buildConfig);
            if (buildConfig.publisherId) {
                updateManifestWithPublisher(msbuildTools, buildConfig);
            }
            // bug: Windows 8 build fails on a system with MSBuild 14 on it.
            // Don't regress, make sure MSBuild 4 is selected for a Windows 8 build.
            cleanIntermediates();
            return buildTargets(msbuildTools, buildConfig).then(function(pkg) {
                console.log(' BUILD OUTPUT: ' + pkg.appx);
                return pkg;
            });
        }, function(error) {
            return Q.reject(error);
        });
};

// help/usage function
module.exports.help = function help() {
    console.log('');
    console.log('Usage: build [--debug | --release] [--phone | --win] [--bundle]');
    console.log('             [--archs="<list of architectures...>"');
    console.log('             [--packageCertificateKeyFile="key path"]');
    console.log('             [--packageThumbprint="thumbprint"] [--publisherId]');
    console.log('             [--buildConfig="file path"]');
    console.log('    --help                      : Displays this dialog.');
    console.log('    --debug                     : Builds project in debug mode. (Default).');
    console.log('    --release  (-r)             : Builds project in release mode.');
    console.log('    --phone, --win              : Specifies, what type of project to build.');
    console.log('    --bundle                    : Tells the compiler to create a .appxbundle.');
    console.log('                                  Bundling is disabled when `anycpu` is built.');
    console.log('    --archs                     : Builds project binaries for specific chip');
    console.log('                                  architectures (`anycpu`, `arm`, `x86`, `x64`).');
    console.log('                                  Separate multiple choices with spaces and if');
    console.log('                                  passing multiple choices, enclose with " ".');
    console.log('    --appx=<8.1-win|8.1-phone|uap>');
    console.log('                                : Overrides windows-target-version to build');
    console.log('                                  Windows 8.1, Windows Phone 8.1, or');
    console.log('                                  Windows 10 Universal.');
    console.log('    --packageCertificateKeyFile : Builds the project using provided certificate.');
    console.log('    --packageThumbprint         : Thumbprint associated with the certificate.');
    console.log('    --publisherId               : Sets publisher id field in manifest.');
    console.log('    --buildConfig               : Sets build settings from configuration file.');
    console.log('');
    console.log('examples:');
    console.log('    build ');
    console.log('    build --debug');
    console.log('    build --release');
    console.log('    build --release --archs="arm x86" --bundle');
    console.log('    build --appx=8.1-phone -r');
    console.log('    build --packageCertificateKeyFile="CordovaApp_TemporaryKey.pfx"');
    console.log('    build --publisherId="CN=FakeCorp, C=US"');
    console.log('    build --buildConfig="build.json"');
    console.log('');

    process.exit(0);
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
                console.warn('Unrecognized --appx parameter passed to build: "' + projOverride + '", ignoring.');
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
            targets.push(projFiles.win80);
            break;
        case '8.1':
            targets.push(projFiles.win);
            break;
        case '10.0':
        case 'uap':
            targets.push(projFiles.win10);
            break;
        default:
            throw new Error('Unsupported windows-target-version value: ' + windowsTargetVersion);
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

function parseAndValidateArgs(argv) {
    return Q.promise(function(resolve, reject) {
        // parse and validate args
        var args = nopt({
            'debug': Boolean,
            'release': Boolean,
            'archs': [String],
            'appx': String,
            'phone': Boolean,
            'win': Boolean,
            'bundle': Boolean,
            'packageCertificateKeyFile': String,
            'packageThumbprint': String,
            'publisherId': String,
            'buildConfig': String
            }, {'-r': '--release'}, argv);

        var config = {};
        var buildConfig = {};

        // Validate args
        if (args.debug && args.release) {
            reject('Only one of "debug"/"release" options should be specified');
            return;
        }
        if (args.phone && args.win) {
            reject('Only one of "phone"/"win" options should be specified');
            return;
        }

        // get build options/defaults
        config.buildType = args.release ? 'release' : 'debug';
        config.buildArchs = args.archs ? args.archs.split(' ') : ['anycpu'];
        config.phone = args.phone ? true : false;
        config.win = args.win ? true : false;
        config.projVerOverride = args.appx;
        // only set config.bundle if architecture is not anycpu
        if (args.bundle) {
            if ((config.buildArchs.indexOf('anycpu') > -1 || config.buildArchs.indexOf('any cpu') > -1) && config.buildArchs.length > 1) {
                // Not valid to bundle anycpu with cpu-specific architectures.  warn, then don't bundle
                console.warn('Warning: anycpu and CPU-specific architectures were selected. This is not valid');
                console.warn(' when enabling bundling with --bundle.  Disabling bundling for this build.');
            } else {
                config.bundle = true;
            }
        }

        // if build.json is provided, parse it
        var buildConfigPath = args.buildConfig;
        if (buildConfigPath) {
            buildConfig = parseBuildConfig(buildConfigPath, config);
            for (var prop in buildConfig) { config[prop] = buildConfig[prop]; }
        }

        // CLI arguments override build.json config
        if (args.packageCertificateKeyFile) {
            args.packageCertificateKeyFile = path.resolve(process.cwd(), args.packageCertificateKeyFile);
            config.packageCertificateKeyFile = args.packageCertificateKeyFile;
        }

        config.packageThumbprint = config.packageThumbprint || args.packageThumbprint;
        config.publisherId = config.publisherId || args.publisherId;
        resolve(config);
    });
}

function parseBuildConfig(buildConfigPath, config) {
    var buildConfig, result = {};
    console.log('Reading build config file: '+ buildConfigPath);
    try {
        var contents = fs.readFileSync(buildConfigPath, 'utf8');
        buildConfig = JSON.parse(contents);
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw Error('Specified build config file does not exist: ' + buildConfigPath);
        } else {
            throw e;
        }
    }

    if (buildConfig.windows && buildConfig.windows[config.buildType]) {
        var windowsInfo = buildConfig.windows[config.buildType];

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
                throw Error('Invalid publisher id: ' + windowsInfo.publisherId);
            }

            result.publisherId = windowsInfo.publisherId;
        }
    }

    return result;
}

// Note: This function is very narrow and only writes to the app manifest if an update is done.  See CB-9450 for the 
// reasoning of why this is the case.
function updateManifestWithPublisher(allMsBuildVersions, config) {
    var selectedBuildTargets = getBuildTargets(config);
    var msbuild = getMsBuildForTargets(selectedBuildTargets, config, allMsBuildVersions);
    var myBuildTargets = filterSupportedTargets(selectedBuildTargets, msbuild);
    var manifestFiles = myBuildTargets.map(function(proj) {
        return projFilesToManifests[proj];
    });
    manifestFiles.forEach(function(file) {
        var manifestPath = path.join(ROOT, file);
        var contents = fs.readFileSync(manifestPath, 'utf-8');
        if (!contents) {
            return;
        }

        // Skip BOM
        contents = contents.substring(contents.indexOf('<'));
        var manifest =  new et.ElementTree(et.XML(contents));
        var identityNode = manifest.find('.//Identity');
        if (config.publisherId && config.publisherId !== identityNode.attrib.Publisher) {
            identityNode.attrib.Publisher = config.publisherId;
            fs.writeFileSync(manifestPath, manifest.write({indent: 4}), 'utf-8');
        }
    });
}

function buildTargets(allMsBuildVersions, config) {
    // filter targets to make sure they are supported on this development machine
    var selectedBuildTargets = getBuildTargets(config);
    var msbuild = getMsBuildForTargets(selectedBuildTargets, config, allMsBuildVersions); 
    if (!msbuild) {
        return Q.reject('No valid MSBuild was detected for the selected target.');
    }
    console.log('MSBuildToolsPath: ' + msbuild.path);
    var myBuildTargets = filterSupportedTargets(selectedBuildTargets, msbuild);

    var buildConfigs = [];
    var bundleTerms = '';
    var hasAnyCpu = false;
    var shouldBundle = !!config.bundle;
    if (myBuildTargets.indexOf(projFiles.win80) > -1) {
        if (shouldBundle) {
            console.warn('Warning: Bundling is disabled because a Windows 8 project was detected.');
        }
        shouldBundle = false;
    }

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
            // msbuild 4.0 requires .sln file, we can't build jsproj
            if (msbuild.version == '4.0' && build.target == projFiles.win80) {
                build.target = 'CordovaApp.vs2012.sln';
            }

            var otherProperties = { };
            // Only add the CordovaBundlePlatforms argument when on the last build step
            if (shouldBundle && index === configsArray.length - 1) {
                otherProperties.CordovaBundlePlatforms = bundleTerms;
            } else if (shouldBundle) {
                otherProperties.CordovaBundlePlatforms = build.arch;
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

    console.log('Clearing intermediates...');
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
            targets.push(projFiles.win80);
            break;
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
                console.warn('Unrecognized --appx parameter passed to build: "' + buildConfig.projVerOverride + '", ignoring.');
                break;
        }
    }

    // As part of reworking how build and package determine the winning project, set the 'target type' project
    // as part of build configuration.  This will be used for determining the binary to 'run' after build is done.
    if (targets.length > 0) {
        switch (targets[0]) {
            case projFiles.win80:
                buildConfig.targetProject = 'windows80';
                break;
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

function getMsBuildForTargets(selectedTargets, buildConfig, allMsBuildVersions) {
    var availableVersions = allMsBuildVersions.reduce(function(obj, msbuildVersion) {
        obj[msbuildVersion.version] = msbuildVersion;
        return obj;
    }, {});

    var result = null;

    if (selectedTargets.indexOf(projFiles.win80) > -1) {
        // building Windows 8; prefer 4.0, unless phone is also present, in which case prefer 12
        // prefer 12.  If not present, can't build this; error in the filterSupportedTargets function
        result = availableVersions['12.0'] || availableVersions['4.0']; 
    } else {
        // 14 can build Windows 10, Windows 8.1, and Windows Phone 8.1, so resolve to 14 if available, else 12
        result = (availableVersions['14.0'] || availableVersions['12.0']);
    }

    return result;
}

// TODO: Fix this so that it outlines supported versions based on version criteria:
// - v14: Windows 8.1, Windows 10
// - v12: Windows 8.1, Windows 8.0
// - v4:  Windows 8.0
function msBuild4TargetsFilter(target) {
    return target === projFiles.win80;
}

function msBuild12TargetsFilter(target) {
    return target === projFiles.win80 || target === projFiles.win || target === projFiles.phone;
}

function msBuild14TargetsFilter(target) {
    return target === projFiles.win || target === projFiles.phone || target === projFiles.win10;
}

function filterSupportedTargets (targets, msbuild) {
    if (!targets || targets.length === 0) {
        console.warn('\r\nNo build targets are specified.');
        return [];
    }

    var targetFilters = {
        '4.0': msBuild4TargetsFilter,
        '12.0': msBuild12TargetsFilter,
        '14.0': msBuild14TargetsFilter
    };

    var filter = targetFilters[msbuild.version];
    if (!filter) {
        console.warn('Unsupported msbuild version "' + msbuild.version + '", aborting.');
        return [];
    }

    var supportedTargets = targets.filter(filter);
    // unsupported targets have been detected
    if (supportedTargets.length !== targets.length) {
        console.warn('Warning: Not all desired build targets are compatible with the current build environment.');
        console.warn('Please install Visual Studio 2015 for Windows 8.1 and Windows 10, or Visual Studio 2013 Update 2 for Windows 8 and 8.1.');
    }
    return supportedTargets;
}

function cleanIntermediates() {
    var buildPath = path.join(ROOT, 'build');
    if (shell.test('-e', buildPath)) {
        shell.rm('-rf', buildPath);
    }
}
