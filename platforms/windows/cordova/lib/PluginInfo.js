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

var semver = require('semver');
var CommonPluginInfo = require('cordova-common').PluginInfo;

var MANIFESTS = {
    'windows': {
        '8.1.0': 'package.windows.appxmanifest',
        '10.0.0': 'package.windows10.appxmanifest'
    },
    'phone': {
        '8.1.0': 'package.phone.appxmanifest',
        '10.0.0': 'package.windows10.appxmanifest'
    },
    'all': {
        '8.1.0': ['package.windows.appxmanifest', 'package.phone.appxmanifest'],
        '10.0.0': 'package.windows10.appxmanifest'
    }
};

var SUBSTS = ['package.phone.appxmanifest', 'package.windows.appxmanifest', 'package.windows10.appxmanifest'];
var TARGETS = ['windows', 'phone', 'all'];

function processChanges(changes) {
    var hasManifestChanges  = changes.some(function(change) {
        return change.target === 'package.appxmanifest';
    });

    if (!hasManifestChanges) {
        return changes;
    }

    // Demux 'package.appxmanifest' into relevant platform-specific appx manifests.
    // Only spend the cycles if there are version-specific plugin settings
    var oldChanges = changes;
    changes = [];

    oldChanges.forEach(function(change) {
        // Only support semver/device-target demux for package.appxmanifest
        // Pass through in case something downstream wants to use it
        if (change.target !== 'package.appxmanifest') {
            changes.push(change);
            return;
        }

        var manifestsForChange = getManifestsForChange(change);
        changes = changes.concat(demuxChangeWithSubsts(change, manifestsForChange));
    });

    return changes;
}

function demuxChangeWithSubsts(change, manifestFiles) {
    return manifestFiles.map(function(file) {
         return createReplacement(file, change);
    });
}

function getManifestsForChange(change) {
    var hasTarget = (typeof change.deviceTarget !== 'undefined');
    var hasVersion = (typeof change.versions !== 'undefined');

    var targetDeviceSet = hasTarget ? change.deviceTarget : 'all';

    if (TARGETS.indexOf(targetDeviceSet) === -1) {
        // target-device couldn't be resolved, fix it up here to a valid value
        targetDeviceSet = 'all';
    }

    // No semver/device-target for this config-file, pass it through
    if (!(hasTarget || hasVersion)) {
        return SUBSTS;
    }

    var knownWindowsVersionsForTargetDeviceSet = Object.keys(MANIFESTS[targetDeviceSet]);
    return knownWindowsVersionsForTargetDeviceSet.reduce(function(manifestFiles, winver) {
        if (hasVersion && !semver.satisfies(winver, change.versions)) {
            return manifestFiles;
        }
        return manifestFiles.concat(MANIFESTS[targetDeviceSet][winver]);
    }, []);
}

// This is a local function that creates the new replacement representing the
// mutation.  Used to save code further down.
function createReplacement(manifestFile, originalChange) {
    var replacement = {
        target:         manifestFile,
        parent:         originalChange.parent,
        after:          originalChange.after,
        xmls:           originalChange.xmls,
        versions:       originalChange.versions,
        deviceTarget:   originalChange.deviceTarget
    };
    return replacement;
}


/*
A class for holidng the information currently stored in plugin.xml
It's inherited from cordova-common's PluginInfo class
In addition it overrides getConfigFiles, getEditConfigs, getFrameworks methods to use windows-specific logic
 */
function PluginInfo(dirname) {
    //  We're not using `util.inherit' because original PluginInfo defines
    //  its' methods inside of constructor
    CommonPluginInfo.apply(this, arguments);
    var parentGetConfigFiles = this.getConfigFiles;
    var parentGetEditConfigs = this.getEditConfigs;

    this.getEditConfigs = function(platform) {
        var editConfigs = parentGetEditConfigs(platform);
        return processChanges(editConfigs);
    };

    this.getConfigFiles = function(platform) {
        var configFiles = parentGetConfigFiles(platform);
        return processChanges(configFiles);
    };
}

exports.PluginInfo = PluginInfo;
