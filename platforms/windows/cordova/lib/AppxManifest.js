/**
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

var fs = require('fs');
var util = require('util');
var et = require('elementtree');
var path = require('path');
var xml= require('cordova-common').xmlHelpers;

var UAP_RESTRICTED_CAPS = ['enterpriseAuthentication', 'sharedUserCertificates',
                           'documentsLibrary', 'musicLibrary', 'picturesLibrary',
                           'videosLibrary', 'removableStorage', 'internetClientClientServer',
                           'privateNetworkClientServer'];

// UAP namespace capabilities come from the XSD type ST_Capability_Uap from AppxManifestTypes.xsd
var CAPS_NEEDING_UAPNS  = ['documentsLibrary', 'picturesLibrary', 'videosLibrary',
                           'musicLibrary', 'enterpriseAuthentication', 'sharedUserCertificates',
                           'removableStorage', 'appointments', 'contacts', 'userAccountInformation',
                           'phoneCall', 'blockedChatMessages', 'objects3D'];

var KNOWN_ORIENTATIONS = {
    'default':   ['portrait', 'landscape', 'landscapeFlipped'],
    'portrait':  ['portrait'],
    'landscape': ['landscape', 'landscapeFlipped']
};

/**
 * Store to cache appxmanifest files based on file location
 * @type  {Object}
 */
var manifestCache = {};

/**
 * @constructor
 * @constructs AppxManifest
 *
 * Wraps an AppxManifest file. Shouldn't be instantiated directly.
 *   AppxManifest.get should be used instead to select proper manifest type
 *   (AppxManifest for Win 8/8.1/Phone 8.1, Win10AppxManifest for Win 10)
 *
 * @param  {string}  path    Path to appxmanifest to wrap
 * @param  {string}  prefix  A namespace prefix used to prepend some elements.
 *   Depends on manifest type.
 */
function AppxManifest(path, prefix) {
    this.path = path;
    // Append ':' to prefix if needed
    prefix = prefix || '';
    this.prefix = (prefix.indexOf(':') === prefix.length - 1) ? prefix : prefix + ':';
    this.doc = xml.parseElementtreeSync(path);
    if (this.doc.getroot().tag !== 'Package') {
        // Some basic validation
        throw new Error(path + ' has incorrect root node name (expected "Package")');
    }

    // Indicates that this manifest is for phone application (either WinPhone 8.1 or Universal Windows 10)
    this.hasPhoneIdentity = this.prefix === 'uap:' || this.prefix === 'm3:';
}

//  Static read-only property to get capabilities which need to be prefixed with uap
Object.defineProperty(AppxManifest, 'CapsNeedUapPrefix', {
    writable: false,
    configurable: false,
    value: CAPS_NEEDING_UAPNS
});

/**
 * @static
 * @constructs AppxManifest|Win10AppxManifest
 *
 * Instantiates a new AppxManifest/Win10AppxManifest class. Chooses which
 *   constructor to use based on xmlns attributes of Package node
 *
 * @param   {String}  fileName  File to create manifest for
 * @param   {Boolean} [ignoreCache=false]  Specifies, whether manifest cache will be
 *   used to return resultant object
 *
 * @return  {AppxManifest|Win10AppxManifest}  Manifest instance
 */
AppxManifest.get = function (fileName, ignoreCache) {

    if (!ignoreCache && manifestCache[fileName]) {
        return manifestCache[fileName];
    }

    var root = xml.parseElementtreeSync(fileName).getroot();
    var prefixes = Object.keys(root.attrib)
    .reduce(function (result, attrib) {
        if (attrib.indexOf('xmlns') === 0 && attrib !== 'xmlns:mp') {
            result.push(attrib.replace('xmlns', '').replace(':', ''));
        }

        return result;
    }, []).sort();

    var prefix = prefixes[prefixes.length - 1];
    var Manifest = prefix === 'uap' ? Win10AppxManifest : AppxManifest;
    var result = new Manifest(fileName, prefix);

    if (!ignoreCache) {
        manifestCache[fileName] = result;
    }

    return result;
};

/**
 * Removes manifests from cache to prevent using stale entries
 *
 * @param {String|String[]} [cacheKeys] The keys to delete from cache. If not
 *   specified, the whole cache will be purged
 */
AppxManifest.purgeCache = function (cacheKeys) {
    if (!cacheKeys) {
        // if no arguments passed, remove all entries
        manifestCache = {};
        return;
    }

    var keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
    keys.forEach(function (key) {
        delete manifestCache[key];
    });
};

AppxManifest.prototype.getPhoneIdentity = function () {
    var phoneIdentity = this.doc.getroot().find('./mp:PhoneIdentity');
    if (!phoneIdentity)
        throw new Error('Failed to find PhoneIdentity element in appxmanifest at ' + this.path);

    return {
        getPhoneProductId: function () {
            return phoneIdentity.attrib.PhoneProductId;
        },
        setPhoneProductId: function (id) {
            if (!id) throw new Error('Argument for "setPhoneProductId" must be defined in appxmanifest at ' + this.path);
            phoneIdentity.attrib.PhoneProductId = id;
            return this;
        }
    };
};

AppxManifest.prototype.getIdentity = function () {
    var identity = this.doc.getroot().find('./Identity');
    if (!identity)
        throw new Error('Failed to find "Identity" node. The appxmanifest at ' + this.path + ' is invalid');

    return {
        getName: function () {
            return identity.attrib.Name;
        },
        setName: function (name) {
            if (!name) throw new TypeError('Identity.Name attribute must be non-empty in appxmanifest at ' + this.path);
            identity.attrib.Name = name;
            return this;
        },
        getPublisher: function () {
            return identity.attrib.Publisher;
        },
        setPublisher: function (publisherId) {
            if (!publisherId) throw new TypeError('Identity.Publisher attribute must be non-empty in appxmanifest at ' + this.path);
            identity.attrib.Publisher = publisherId;
            return this;
        },
        getVersion: function () {
            return identity.attrib.Version;
        },
        setVersion: function (version) {
            if (!version) throw new TypeError('Identity.Version attribute must be non-empty in appxmanifest at ' + this.path );

            // Adjust version number as per CB-5337 Windows8 build fails due to invalid app version
            if(version && version.match(/\.\d/g)) {
                var numVersionComponents = version.match(/\.\d/g).length + 1;
                while (numVersionComponents++ < 4) {
                    version += '.0';
                }
            }

            identity.attrib.Version = version;
            return this;
        }
    };
};

AppxManifest.prototype.getProperties = function () {
    var properties = this.doc.getroot().find('./Properties');

    if (!properties)
        throw new Error('Failed to find "Properties" node. The appxmanifest at ' + this.path + ' is invalid');

    return {
        getDisplayName: function () {
            var displayName = properties.find('./DisplayName');
            return displayName && displayName.text;
        },
        setDisplayName: function (name) {
            if (!name) throw new TypeError('Properties.DisplayName elements must be non-empty in appxmanifest at ' + this.path);
            var displayName = properties.find('./DisplayName');

            if (!displayName) {
                displayName = new et.Element('DisplayName');
                properties.append(displayName);
            }

            displayName.text = name;

            return this;
        },
        getPublisherDisplayName: function () {
            var publisher = properties.find('./PublisherDisplayName');
            return publisher && publisher.text;
        },
        setPublisherDisplayName: function (name) {
            if (!name) throw new TypeError('Properties.PublisherDisplayName elements must be non-empty in appxmanifest at ' + this.path);
            var publisher = properties.find('./PublisherDisplayName');

            if (!publisher) {
                publisher = new et.Element('PublisherDisplayName');
                properties.append(publisher);
            }

            publisher.text = name;

            return this;
        },
        getDescription: function () {
            var description = properties.find('./Description');
            return description && description.text;
        },
        setDescription: function (text) {

            var description = properties.find('./Description');

            if (!text || text.length === 0) {
                if (description) properties.remove(description);
                return this;
            }

            if (!description) {
                description = new et.Element('Description');
                properties.append(description);
            }

            description.text = processDescription(text);

            return this;
        },
    };
};

AppxManifest.prototype.getApplication = function () {
    var application = this.doc.getroot().find('./Applications/Application');
    if (!application)
        throw new Error('Failed to find "Application" element. The appxmanifest at ' + this.path + ' is invalid');

    var self = this;

    return {
        _node: application,
        getVisualElements: function () {
            return self.getVisualElements();
        },
        getId: function () {
            return application.attrib.Id;
        },
        setId: function (id) {
            if (!id) throw new TypeError('Application.Id attribute must be defined in appxmanifest at ' + this.path);
            // 64 symbols restriction goes from manifest schema definition
            // http://msdn.microsoft.com/en-us/library/windows/apps/br211415.aspx
            var appId = id.length <= 64 ? id : id.substr(0, 64);
            application.attrib.Id = appId;
            return this;
        },
        getStartPage: function () {
            return application.attrib.StartPage;
        },
        setStartPage: function (page) {
            if (!page) page = 'www/index.html'; // Default valur is always index.html
            application.attrib.StartPage = page;
            return this;
        },
        getAccessRules: function () {
            return application
                .findall('./ApplicationContentUriRules/Rule')
                .map(function (rule) {
                    return rule.attrib.Match;
                });
        },
        setAccessRules: function (rules) {
            var appUriRules = application.find('ApplicationContentUriRules');
            if (appUriRules) {
                application.remove(appUriRules);
            }

            // No rules defined
            if (!rules || rules.length === 0) {
                return;
            }

            appUriRules = new et.Element('ApplicationContentUriRules');
            application.append(appUriRules);

            rules.forEach(function(rule) {
                appUriRules.append(new et.Element('Rule', {Match: rule, Type: 'include'}));
            });

            return this;
        }
    };
};

AppxManifest.prototype.getVisualElements = function () {
    var self = this;
    var visualElements = this.doc.getroot().find('./Applications/Application/' +
        this.prefix  + 'VisualElements');

    if (!visualElements)
        throw new Error('Failed to find "VisualElements" node. The appxmanifest at ' + this.path + ' is invalid');

    return {
        _node: visualElements,
        getDisplayName: function () {
            return visualElements.attrib.DisplayName;
        },
        setDisplayName: function (name) {
            if (!name) throw new TypeError('VisualElements.DisplayName attribute must be defined in appxmanifest at ' + this.path);
            visualElements.attrib.DisplayName = name;
            return this;
        },
        getOrientation: function () {
            return visualElements.findall(self.prefix + 'Rotation')
                .map(function (element) {
                    return element.attrib.Preference;
                });
        },
        setOrientation: function (orientation) {
            if (!orientation || orientation === ''){
                orientation = 'default';
            }

            var rotationPreferenceRootName = self.prefix + 'InitialRotationPreference';
            var rotationPreferenceRoot = visualElements.find('./' + rotationPreferenceRootName);

            if (!orientation && rotationPreferenceRoot) {
                // Remove InitialRotationPreference root element to revert to defaults
                visualElements.remove(rotationPreferenceRoot);
                return this;
            }

            if(!rotationPreferenceRoot) {
                rotationPreferenceRoot = new et.Element(rotationPreferenceRootName);
                visualElements.append(rotationPreferenceRoot);
            }

            rotationPreferenceRoot.clear();

            var orientations = KNOWN_ORIENTATIONS[orientation] || orientation.split(',');
            orientations.forEach(function(orientation) {
                var el = new et.Element(self.prefix + 'Rotation', {Preference: orientation} );
                rotationPreferenceRoot.append(el);
            });

            return this;
        },
        getBackgroundColor: function () {
            return visualElements.attrib.BackgroundColor;
        },
        setBackgroundColor: function (color) {
            if (!color)
                throw new TypeError('VisualElements.BackgroundColor attribute must be defined in appxmanifest at ' + this.path);

            visualElements.attrib.BackgroundColor = refineColor(color);
            return this;
        },
        trySetBackgroundColor: function (color) {
            try {
                return this.setBackgroundColor(color);
            } catch (e) { return this; }
        },
        getForegroundText: function () {
            return visualElements.attrib.ForegroundText;
        },
        setForegroundText: function (color) {
            // If color is not set, fall back to 'light' by default
            visualElements.attrib.ForegroundText = color || 'light';

            return this;
        },
        getSplashBackgroundColor: function () {
            var splashNode = visualElements.find('./' + self.prefix + 'SplashScreen');
            return splashNode && splashNode.attrib.BackgroundColor;
        },
        setSplashBackgroundColor: function (color) {
            var splashNode = visualElements.find('./' + self.prefix + 'SplashScreen');
            if (splashNode) {
                if (color) {
                    splashNode.attrib.BackgroundColor = refineColor(color);
                } else {
                    delete splashNode.attrib.BackgroundColor;
                }
            }
            return this;
        },
        getSplashScreenExtension: function (extension) {
            var splashNode = visualElements.find('./' + self.prefix + 'SplashScreen');
            return splashNode && splashNode.attrib.Image && path.extname(splashNode.attrib.Image);
        },
        setSplashScreenExtension: function (extension) {
            var splashNode = visualElements.find('./' + self.prefix + 'SplashScreen');
            if (splashNode) {
                var oldPath = splashNode.attrib.Image; 
                splashNode.attrib.Image = path.dirname(oldPath) + '\\' + path.basename(oldPath, path.extname(oldPath)) + extension;
            }
            return this;
        },
        getToastCapable: function () {
            return visualElements.attrib.ToastCapable;
        },
        setToastCapable: function (isToastCapable) {
            if (isToastCapable === true || isToastCapable.toString().toLowerCase() === 'true') {
                visualElements.attrib.ToastCapable = 'true';
            } else {
                delete visualElements.attrib.ToastCapable;
            }

            return this;
        },
        getDescription: function () {
            return visualElements.attrib.Description;
        },
        setDescription: function (description) {
            if (!description || description.length === 0)
                throw new TypeError('VisualElements.Description attribute must be defined and non-empty in appxmanifest at ' + this.path);

            visualElements.attrib.Description = processDescription(description);
            return this;
        },
    };
};

AppxManifest.prototype.getCapabilities = function () {
    var capabilities = this.doc.find('./Capabilities');
    if (!capabilities) return [];

    return capabilities.getchildren()
    .map(function (element) {
        return { type: element.tag, name: element.attrib.Name };
    });
};

function isCSSColorName(color) {
    return color.indexOf('0x') === -1 && color.indexOf('#') === -1;
}

function refineColor(color) {
    if (isCSSColorName(color)) {
        return color;
    }

    // return three-byte hexadecimal number preceded by "#" (required for Windows)
    color = color.replace('0x', '').replace('#', '');
    if (color.length == 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    // alpha is not supported, so we remove it
    if (color.length == 8) { // AArrggbb
        color = color.slice(2);
    }
    return '#' + color;
}

function processDescription(text) {
    var result = text;

    // Description value limitations: https://msdn.microsoft.com/en-us/library/windows/apps/br211429.aspx
    // value should be no longer than 2048 characters
    if (text.length > 2048) {
        result = text.substr(0, 2048);
    }

    // value should not contain newlines and tabs
    return result.replace(/(\n|\r)/g, ' ').replace(/\t/g, '    ');
}

// Shortcut for getIdentity.setName
AppxManifest.prototype.setPackageName = function (name) {
    this.getIdentity().setName(name);
    return this;
};

// Shortcut for multiple inner methods calls
AppxManifest.prototype.setAppName = function (name) {
    this.getProperties().setDisplayName(name);
    this.getVisualElements().setDisplayName(name);

    return this;
};

/**
 * Writes manifest to disk syncronously. If filename is specified, then manifest
 *   will be written to that file
 *
 * @param   {String}  [destPath]  File to write manifest to. If omitted,
 *   manifest will be written to file it has been read from.
 */
AppxManifest.prototype.write = function(destPath) {
    // sort Capability elements as per CB-5350 Windows8 build fails due to invalid 'Capabilities' definition
    sortCapabilities(this.doc);
    fs.writeFileSync(destPath || this.path, this.doc.write({indent: 4}), 'utf-8');
};

/**
 * Sorts 'capabilities' elements in manifest in ascending order
 * @param   {Elementtree.Document}  manifest  An XML document that represents
 *   appxmanifest
 */
function sortCapabilities(manifest) {

    // removes namespace prefix (m3:Capability -> Capability)
    // this is required since elementtree returns qualified name with namespace
    function extractLocalName(tag) {
        return tag.split(':').pop(); // takes last part of string after ':'
    }

    var capabilitiesRoot = manifest.find('.//Capabilities'),
        capabilities = capabilitiesRoot.getchildren() || [];
    // to sort elements we remove them and then add again in the appropriate order
    capabilities.forEach(function(elem) { // no .clear() method
        capabilitiesRoot.remove(elem);
        // CB-7601 we need local name w/o namespace prefix to sort capabilities correctly
        elem.localName = extractLocalName(elem.tag);
    });
    capabilities.sort(function(a, b) {
        return (a.localName > b.localName) ? 1: -1;
    });
    capabilities.forEach(function(elem) {
        capabilitiesRoot.append(elem);
    });
}


function Win10AppxManifest(path) {
    AppxManifest.call(this, path, /*prefix=*/'uap');
}

util.inherits(Win10AppxManifest, AppxManifest);

Win10AppxManifest.prototype.getApplication = function () {
    // Call overridden method
    var result = AppxManifest.prototype.getApplication.call(this);
    var application = result._node;

    result.getAccessRules = function () {
        return application
            .findall('./uap:ApplicationContentUriRules/uap:Rule')
            .map(function (rule) {
                return rule.attrib.Match;
            });
    };

    result.setAccessRules = function (rules) {
        var appUriRules = application.find('./uap:ApplicationContentUriRules');
        if (appUriRules) {
            application.remove(appUriRules);
        }

        // No rules defined
        if (!rules || rules.length === 0) {
            return;
        }

        appUriRules = new et.Element('uap:ApplicationContentUriRules');
        application.append(appUriRules);

        rules.forEach(function(rule) {
            appUriRules.append(new et.Element('uap:Rule', { Match: rule, Type: 'include', WindowsRuntimeAccess: 'all' }));
        });

        return this;
    };

    return result;
};

Win10AppxManifest.prototype.getVisualElements = function () {
    // Call base method and extend its results
    var result = AppxManifest.prototype.getVisualElements.call(this);
    var defaultTitle = result._node.find('./uap:DefaultTile');

    result.getDefaultTitle = function () {
        return {
            getShortName: function () {
                return defaultTitle.attrib.ShortName;
            },
            setShortName: function (name) {
                if (!name) throw new TypeError('Argument for "setDisplayName" must be defined in appxmanifest at ' + this.path);
                defaultTitle.attrib.ShortName = name;
                return this;
            }
        };
    };

    // ToastCapable attribute was removed in Windows 10.
    // See https://msdn.microsoft.com/ru-ru/library/windows/apps/dn423310.aspx
    result.getToastCapable = function () {};
    result.setToastCapable = function () { return this; };

    // ForegroundText was removed in Windows 10 as well
    result.getForegroundText = function () {};
    result.setForegroundText = function () { return this; };

    return result;
};

// Shortcut for multiple inner methods calls
Win10AppxManifest.prototype.setAppName = function (name) {
    // Call base method
    AppxManifest.prototype.setAppName.call(this, name);
    this.getVisualElements().getDefaultTitle().setShortName(name);

    return this;
};

/**
 * Checks for capabilities which are Restricted in Windows 10 UAP.
 * @return {string[]|false} An array of restricted capability names, or false.
 */
Win10AppxManifest.prototype.getRestrictedCapabilities = function () {
    var restrictedCapabilities = this.getCapabilities()
    .filter(function (capability) {
        return UAP_RESTRICTED_CAPS.indexOf(capability.name) >= 0;
    });

    return restrictedCapabilities.length === 0 ? false : restrictedCapabilities;
};

/**
 * Sets up a Dependencies section for appxmanifest. If no arguments provided,
 *   deletes Dependencies section.
 *
 * @param  {Object[]}  dependencies  Array of arbitrary object, which fields
 *   will be used to set each dependency attributes.
 *
 * @returns {Win10AppxManifest}  self instance
 */
Win10AppxManifest.prototype.setDependencies = function (dependencies) {
    var dependenciesElement = this.doc.find('./Dependencies');

    if ((!dependencies || dependencies.length === 0) && dependenciesElement) {
        this.doc.remove(dependenciesElement);
        return this;
    }

    if (!dependenciesElement) {
        dependenciesElement = new et.Element('Dependencies');
        this.doc.append(dependenciesElement);
    }

    if (dependenciesElement.len() > 0) {
        dependenciesElement.clear();
    }

    dependencies.forEach(function (uapVersionInfo) {
        dependenciesElement.append(new et.Element('TargetDeviceFamily', uapVersionInfo));
    });
};

/**
 * Writes manifest to disk syncronously. If filename is specified, then manifest
 *   will be written to that file
 *
 * @param   {String}  [destPath]  File to write manifest to. If omitted,
 *   manifest will be written to file it has been read from.
 */
Win10AppxManifest.prototype.write = function(destPath) {
    fs.writeFileSync(destPath || this.path, this.writeToString(), 'utf-8');
};

Win10AppxManifest.prototype.writeToString = function() {
    ensureUapPrefixedCapabilities(this.doc.find('.//Capabilities'));
    ensureUniqueCapabilities(this.doc.find('.//Capabilities'));
    // sort Capability elements as per CB-5350 Windows8 build fails due to invalid 'Capabilities' definition
    sortCapabilities(this.doc);
    return this.doc.write({indent: 4});
};

/**
 * Checks for capabilities which require the uap: prefix in Windows 10.
 * @param capabilities {ElementTree.Element} The appx manifest element for <capabilities>
 */
function ensureUapPrefixedCapabilities(capabilities) {
    capabilities.getchildren()
    .forEach(function(el) {
        if (CAPS_NEEDING_UAPNS.indexOf(el.attrib.Name) > -1 && el.tag.indexOf('uap:') !== 0) {
            el.tag = 'uap:' + el.tag;
        }
    });
}

/**
 * Cleans up duplicate capability declarations that were generated during the prepare process
 * @param capabilities {ElementTree.Element} The appx manifest element for <capabilities>
 */
function ensureUniqueCapabilities(capabilities) {
    var uniqueCapabilities = [];
    capabilities.getchildren()
    .forEach(function(el) {
        var name = el.attrib.Name;
        if (uniqueCapabilities.indexOf(name) !== -1) {
            capabilities.remove(el);
        } else {
            uniqueCapabilities.push(name);
        }
    });
}

module.exports = AppxManifest;
