/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var util = require('util');
var path = require('path');
var CommonMunger = require('cordova-common').ConfigChanges.PlatformMunger;
var CapsNeedUapPrefix = require(path.join(__dirname, 'AppxManifest')).CapsNeedUapPrefix;

var CAPS_SELECTOR = '/Package/Capabilities';
var WINDOWS10_MANIFEST = 'package.windows10.appxmanifest';

function PlatformMunger(platform, project_dir, platformJson, pluginInfoProvider) {
    CommonMunger.apply(this, arguments);
}

util.inherits(PlatformMunger, CommonMunger);

/**
 * This is an override of apply_file_munge method from cordova-common's PlatformMunger class.
 * In addition to parent's method logic also removes capabilities with 'uap:' prefix that were
 * added by AppxManifest class
 *
 * @param {String}  file   A file name to apply munge to
 * @param {Object}  munge  Serialized changes that need to be applied to the file
 * @param {Boolean} [remove=false] Flag that specifies whether the changes
 *   need to be removed or added to the file
 */
PlatformMunger.prototype.apply_file_munge = function (file, munge, remove) {

    // Create a copy to avoid modification of original munge
    var mungeCopy = cloneObject(munge);
    var capabilities = mungeCopy.parents[CAPS_SELECTOR];

    if (capabilities) {
        // Add 'uap' prefixes for windows 10 manifest
        if (file === WINDOWS10_MANIFEST) {
            capabilities = generateUapCapabilities(capabilities);
        }

        // Remove duplicates and sort capabilities when installing plugin
        if (!remove) {
            capabilities = getUniqueCapabilities(capabilities).sort(compareCapabilities);
        }

        // Put back capabilities into munge's copy
        mungeCopy.parents[CAPS_SELECTOR] = capabilities;
    }

    PlatformMunger.super_.prototype.apply_file_munge.call(this, file, mungeCopy, remove);
};

// Recursive function to clone an object
function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    var copy = obj.constructor();
    Object.keys(obj).forEach(function(key) {
        copy[key] = cloneObject(obj[key]);
    });

    return copy;
}

/**
 * Retrieve capabality name from xml field
 * @param {Object} capability with xml field like <Capability Name="CapabilityName">
 * @return {String} name of capability
 */
function getCapabilityName(capability) {
    var reg = /Name\s*=\s*"(.*?)"/;
    return capability.xml.match(reg)[1];
}

/**
 * Remove capabilities with same names
 * @param {Object} an array of capabilities
 * @return {Object} an unique array of capabilities
 */
function getUniqueCapabilities(capabilities) {
    return capabilities.reduce(function(uniqueCaps, currCap) {

        var isRepeated = uniqueCaps.some(function(cap) {
            return getCapabilityName(cap) === getCapabilityName(currCap);
        });

        return isRepeated ? uniqueCaps : uniqueCaps.concat([currCap]);
    }, []);
}

/**
 * Comparator function to pass to Array.sort
 * @param {Object} firstCap first capability
 * @param {Object} secondCap second capability
 * @return {Number} either -1, 0 or 1
 */
function compareCapabilities(firstCap, secondCap) {
    var firstCapName = getCapabilityName(firstCap);
    var secondCapName = getCapabilityName(secondCap);

    if (firstCapName < secondCapName) {
        return -1;
    }

    if (firstCapName > secondCapName) {
        return 1;
    }

    return 0;
}


/**
 * Generates a new munge that contains <uap:Capability> elements created based on
 * corresponding <Capability> elements from base munge. If there are no such elements
 * found in base munge, the empty munge is returned (selectors might be present under
 * the 'parents' key, but they will contain no changes).
 *
 * @param {Object} capabilities A list of capabilities
 * @return {Object} A list with 'uap'-prefixed capabilities
 */
function generateUapCapabilities(capabilities) {

    function hasCapabilityChange(change) {
        return /^\s*<(\w+:)?(Device)?Capability\s/.test(change.xml);
    }

    function createPrefixedCapabilityChange(change) {
        if (CapsNeedUapPrefix.indexOf(getCapabilityName(change)) < 0) {
            return change;
        }

        //  If capability is already prefixed, avoid adding another prefix
        var replaceXML = change.xml.indexOf('uap:') > 0 ? change.xml : change.xml.replace(/Capability/, 'uap:Capability');
        return {
            xml: replaceXML,
            count: change.count,
            before: change.before
        };
    }

    return capabilities
     // For every xml change check if it adds a <Capability> element ...
    .filter(hasCapabilityChange)
    // ... and create a duplicate with 'uap:' prefix
    .map(createPrefixedCapabilityChange);

}

exports.PlatformMunger = PlatformMunger;
