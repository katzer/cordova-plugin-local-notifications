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

/* jshint node:true, bitwise:true, undef:true, trailing:true, quotmark:true,
          indent:4, unused:vars, latedef:nofunc,
          sub:true
*/

var et = require('elementtree'),
    fs = require('fs');

/** Wraps a config.xml file */
function ConfigParser(path) {
    this.path = path;
    try {
        var contents = fs.readFileSync(path, 'utf-8');
        if(contents) {
            //Windows is the BOM. Skip the Byte Order Mark.
            contents = contents.substring(contents.indexOf('<'));
        }
        this.doc = new et.ElementTree(et.XML(contents));

    } catch (e) {
        console.error('Parsing '+path+' failed');
        throw e;
    }
    var r = this.doc.getroot();
    if (r.tag !== 'widget') {
        throw new Error(path + ' has incorrect root node name (expected "widget", was "' + r.tag + '")');
    }
}

function getNodeTextSafe(el) {
    return el && el.text && el.text.trim();
}

function findOrCreate(doc, name) {
    var ret = doc.find(name);
    if (!ret) {
        ret = new et.Element(name);
        doc.getroot().append(ret);
    }
    return ret;
}

ConfigParser.prototype = {
    packageName: function(id) {
        return this.doc.getroot().attrib['id'];
    },
    setPackageName: function(id) {
        this.doc.getroot().attrib['id'] = id;
    },
    name: function() {
        return getNodeTextSafe(this.doc.find('name'));
    },
    setName: function(name) {
        var el = findOrCreate(this.doc, 'name');
        el.text = name;
    },
    startPage: function() {
        var content = this.doc.find('content');
        if (content) {
            return content.attrib.src;
        }
        return null;
    },
    description: function() {
        return this.doc.find('description').text.trim();
    },
    setDescription: function(text) {
        var el = findOrCreate(this.doc, 'description');
        el.text = text;
    },
    version: function() {
        return this.doc.getroot().attrib['version'];
    },
    windows_packageVersion: function() {
        return this.doc.getroot().attrib['windows-packageVersion'];
    },
    android_versionCode: function() {
        return this.doc.getroot().attrib['android-versionCode'];
    },
    ios_CFBundleVersion: function() {
        return this.doc.getroot().attrib['ios-CFBundleVersion'];
    },
    setVersion: function(value) {
        this.doc.getroot().attrib['version'] = value;
    },
    author: function() {
        return getNodeTextSafe(this.doc.find('author'));
    },
    getPreference: function(name) {
        var preferences = this.doc.findall('preference');
        var ret = null;
        preferences.forEach(function (preference) {
            // Take the last one that matches.
            if (preference.attrib.name.toLowerCase() === name.toLowerCase()) {
                ret = preference.attrib.value;
            }
        });
        return ret;
    },
    getMatchingPreferences: function(regexp) {
        var preferences = this.doc.findall('preference');
        var result = [];
        preferences.forEach(function(preference) {
            if (regexp.test(preference.attrib.name)) {
                result.push({ name: preference.attrib.name, value: preference.attrib.value });
            }
        });

        return result;
    },
    /**
     * Returns all resources.
     * @param {string}  resourceName Type of static resources to return.
     *                               "icon" and "splash" currently supported.
     * @return {Array}               Resources for the platform specified.
     */
    getStaticResources: function(resourceName) {
        return this.doc.findall(resourceName).map(function (elt) {
            var res = {};
            res.src = elt.attrib.src;
            res.target = elt.attrib.target;
            res.density = elt.attrib['density'] || elt.attrib['cdv:density'] || elt.attrib['gap:density'];
            res.platform = elt.platform || null; // null means icon represents default icon (shared between platforms)
            res.width = elt.attrib.width;
            res.height = elt.attrib.height;

            return res;
        });
    },

    /**
     * Returns all defined icons.
     * @return {Resource[]}      Array of icon objects.
     */
    getIcons: function() {
        return this.getStaticResources('icon');
    },

    /**
     * Returns all defined splash images.
     * @return {Resource[]}      Array of Splash objects.
     */
    getSplashScreens: function() {
        return this.getStaticResources('splash');
    },

    /**
     * Returns all access rules.
     * @return {string[]}      Array of access rules.
     */
    getAccessRules: function() { 
        var rules = this.doc.getroot().findall('access'); 
        var ret = []; 
        rules.forEach(function (rule) { 
         if (rule.attrib.origin) {
             ret.push(rule.attrib.origin); 
         } 
        }); 
        return ret; 
    },
    
    /**
     * Returns all <allow-navigation> rules.
     * @return {string[]} Array of allow-navigation rules.
     */
    getNavigationWhitelistRules: function() {
        var rules = this.doc.getroot().findall('allow-navigation');
        var result = [];
        rules.forEach(function(rule) {
            if (rule.attrib.href) {
                result.push(rule.attrib.href);
            }
        });

        return result;
    },

    getWindowsTargetVersion: function() {
        var preference = this.getPreference('windows-target-version');

        if (!preference) 
            preference = '8.1'; // default is 8.1.

        return preference;
    },

    getWindowsPhoneTargetVersion: function() {
        // This is a little more complicated than the previous one.
        // 1. Check for an explicit preference.  If the preference is set explicitly, return that, irrespective of whether it is valid
        // 2. Get the Windows baseline version.  If it's equivalent to 8.0, bump it to 8.1.
        // 3. Return the Windows baseline version.
        var explicitPreference = this.getPreference('windows-phone-target-version');
        if (explicitPreference)
            return explicitPreference;

        var windowsTargetVersion = this.getWindowsTargetVersion();
        if (windowsTargetVersion === '8' || windowsTargetVersion === '8.0')
            windowsTargetVersion = '8.1';

        return windowsTargetVersion;

    },
    
    // Returns the widget defaultLocale
    defaultLocale: function() {
        return this.doc.getroot().attrib['defaultlocale'];
    }
};

module.exports = ConfigParser;
