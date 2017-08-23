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

var rewire  = require('rewire'),
    prepare = rewire('../../template/cordova/lib/prepare'),
    AppxManifest = require('../../template/cordova/lib/AppxManifest'),
    ConfigParser = require('../../template/cordova/lib/ConfigParser'),
    fs      = require('fs'),
    et      = require('elementtree'),
    events  = require('cordova-common').events,
    path    = require('path'),
    xml     = require('cordova-common').xmlHelpers,
    FileUpdater = require('cordova-common').FileUpdater,
    updateManifestFile              = prepare.__get__('updateManifestFile'),
    applyCoreProperties             = prepare.__get__('applyCoreProperties'),
    applyAccessRules                = prepare.__get__('applyAccessRules'),
    applyNavigationWhitelist        = prepare.__get__('applyNavigationWhitelist'),
    applyStartPage                  = prepare.__get__('applyStartPage');

var Win10ManifestPath = 'template/package.windows10.appxmanifest',
    Win81ManifestPath = 'template/package.windows.appxmanifest',
    WP81ManifestPath = 'template/package.phone.appxmanifest';

var Win10ManifestName = path.basename(Win10ManifestPath),
    Win81ManifestName = path.basename(Win81ManifestPath),
    WP81ManifestName = path.basename(WP81ManifestPath);

/***
  * Unit tests for validating default ms-appx-web:// URI scheme in Win10
  * (for the function applyCoreProperties) from prepare.js.
  **/

var PreferencesBaseline = {
    Orientation: null,
    WindowsDefaultUriPrefix: null,
    WindowsStoreDisplayName: null,
    WindowsStorePublisherName: null,
    WindowsStoreIdentityName: null
};

function createMockConfigAndManifestForApplyCoreProperties(startPage, preferences, win10, winPackageVersion) {
    if (!preferences) {
        preferences = { };
    }
    /* jshint proto: true */
    preferences.__proto__ = PreferencesBaseline;
    /* jshint proto: false */
    var config = {
        version: function() { return '1.0.0.0'; },
        description: function () { return 'CordovaApp'; },
        windows_packageVersion: function() { return winPackageVersion; },
        name: function() { return 'HelloCordova'; },
        packageName: function() { return 'org.apache.cordova.HelloCordova'; },
        author: function() { return 'Apache'; },
        startPage: function() { return startPage; },
        getPreference: function(preferenceName) {
            if (typeof preferences[preferenceName] !== 'undefined') {
                return preferences[preferenceName];
            } else {
                throw new RangeError('Unexpected call to config.getPreference with "' + preferenceName + '" in unit test.');
            }
        }
    };

    var filePath = win10 ? Win10ManifestPath : Win81ManifestPath;
    var manifest = AppxManifest.get(filePath);
    spyOn(fs, 'writeFileSync');

    return { config: config, manifest: manifest };
}

function addCapabilityDeclarationToMockManifest(manifest, capability) {
    var capRoot = manifest.doc.find('.//Capabilities');
    var cap = new et.Element('Capability');
    cap.attrib.Name = capability;
    capRoot.append(cap);
}

describe('Windows 8.1 project', function() {

    it('should not have an HTTP or HTTPS scheme for its startup URI.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('index.html', { 'WindowsDefaultUriPrefix': 'http://' }, false);

        // act
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'm2:', false);

        var app = mockConfig.manifest.doc.find('.//Application');
        expect(app.attrib.StartPage).toBe('www/index.html');
    });

    it('should not have any scheme for its startup URI.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('index.html', { 'WindowsDefaultUriPrefix': 'ms-appx://' }, false);

        // act
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'm2:', false);

        var app = mockConfig.manifest.doc.find('.//Application');
        expect(app.attrib.StartPage).toBe('www/index.html');
    });
});

describe('Windows 10 project', function() {
    it('should default to ms-appx-web for its startup URI.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('index.html', { }, true);

        // act
        applyStartPage(mockConfig.config, mockConfig.manifest, true);

        var app = mockConfig.manifest.doc.find('.//Application');

        // Workaround to avoid WWAHost.exe bug: https://issues.apache.org/jira/browse/CB-10446
        var isAppxWebStartupUri = app.attrib.StartPage === 'ms-appx-web:///www/index.html' ||
            app.attrib.StartPage === 'ms-appx-web://' + mockConfig.config.packageName().toLowerCase() + '/www/index.html';
        expect(isAppxWebStartupUri).toBe(true);
    });

    it ('should allow ms-appx as its startup URI, and it gets removed from the final output.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('index.html', { 'WindowsDefaultUriPrefix': 'ms-appx://' }, true);

        // act
        applyStartPage(mockConfig.config, mockConfig.manifest, true);

        var app = mockConfig.manifest.doc.find('.//Application');
        expect(app.attrib.StartPage).toBe('www/index.html');
    });

    it('should allow an HTTP or HTTPS scheme for its startup URI.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('www.contoso.com/', { 'WindowsDefaultUriPrefix': 'http://' }, true);

        // act
        applyStartPage(mockConfig.config, mockConfig.manifest, true);

        var app = mockConfig.manifest.doc.find('.//Application');
        expect(app.attrib.StartPage).toBe('http://www.contoso.com/');
    });
});


describe('Windows Store preference', function () {

    it('"WindowsStoreDisplayName" should be reflected in the manifest.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('www.contoso.com/', { 'WindowsDefaultUriPrefix': 'http://', 'WindowsStoreDisplayName': 'ContosoApp' }, true);

        // act
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);

        var app = mockConfig.manifest.doc.find('.//Properties/DisplayName');
        expect(app.text).toBe('ContosoApp');
    });

    it('"WindowsStorePublisherName" should be reflected in the manifest.', function() {

        // arrange
        var mockConfig = createMockConfigAndManifestForApplyCoreProperties('www.contoso.com/', { 'WindowsDefaultUriPrefix': 'http://', 'WindowsStorePublisherName': 'Contoso Inc' }, true);

        // act
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);

        var app = mockConfig.manifest.doc.find('.//Properties/PublisherDisplayName');
        expect(app.text).toBe('Contoso Inc');
    });
});

describe('A Windows 10 project should warn if it supports remote mode and restricted capabilities.', function() {

    // arrange
    var mockConfig;
    var stringFound     = false,
        searchStr       = 'documentsLibrary';

    beforeEach(function() {
        mockConfig = createMockConfigAndManifestForApplyAccessRules(true, 'http://www.bing.com/*');
        addCapabilityDeclarationToMockManifest(mockConfig.manifest, 'documentsLibrary');

        spyOn(AppxManifest, 'get').andReturn(mockConfig.manifest);

        stringFound = false;
        events.on('warn', function (msg) {
            if (msg.indexOf(searchStr) >= 0)
                stringFound = true;
        });
    });

    it('asserts that the documentsLibrary capability is restricted', function() {
        // act
        updateManifestFile(mockConfig.config, '/manifest/path');

        // assert
        expect(stringFound).toBe(true);
    });
});

/***
  * Unit tests for validating that access rules get correctly applied
  * (for the function applyAccessRules) from prepare.js.
  **/

function createMockConfigAndManifestForApplyAccessRules(isWin10) {
    var rules = [];
    for (var i = 1; i < arguments.length; i++) {
        rules.push(arguments[i]);
    }

    var TEST_XML = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<widget xmlns     = "http://www.w3.org/ns/widgets"\n' +
    '        xmlns:cdv = "http://cordova.apache.org/ns/1.0"\n' +
    '        id        = "org.apache.cordova.HelloCordova"\n' +
    '        version   = "1.0.0.0">\n' +
    '    <name>HelloCordova</name>\n' +
    '    <author href="http://cordova.io" email="dev@cordova.apache.org">\n' +
    '        Apache\n' +
    '    </author>\n' +
    '    <content src="index.html" />\n' +
    '</widget>\n';

    var origParseElementtreeSync = xml.parseElementtreeSync;
    spyOn(xml, 'parseElementtreeSync').andCallFake(function(path) {
        if (path ==='config.xml') return new et.ElementTree(et.XML(TEST_XML));
        return origParseElementtreeSync(path);
    });

    var config = new ConfigParser('config.xml');

    var origGetPreference = config.getPreference;
    spyOn(config, 'getPreference').andCallFake(function (prefName) {
        if (prefName === 'WindowsDefaultUriPrefix') {
            return isWin10 ? 'ms-appx-web://' : 'ms-appx://';
        }

        return origGetPreference.call(config, prefName);
    });

    config.getAccesses = function() {
        if (isWin10) {
            return [];
        }

        return rules.map(function (rule) {
            return { 'origin': rule };
        });
    };

    config.getAllowNavigations = function() {
        if (isWin10) {
            return rules.map(function (rule) {
                return { 'href': rule };
            });
        }

        return [];
    };

    var filePath = isWin10 ? Win10ManifestPath : Win81ManifestPath;
    var manifest = AppxManifest.get(filePath);
    spyOn(fs, 'writeFileSync');

    return { config: config, manifest: manifest };
}

describe('Access rules management', function () {
    // body...
    it('A Windows 8.1 project should not have WindowsRuntimeAccess attributes in access rules.', function() {

        var mockConfig = createMockConfigAndManifestForApplyAccessRules(false, 'https://www.contoso.com');

        applyAccessRules(mockConfig.config, mockConfig.manifest);

        var app         = mockConfig.manifest.doc.find('.//Application'),
            accessRules = app.find('.//ApplicationContentUriRules');

        expect(accessRules).toBeDefined();
        expect(accessRules.len()).toBe(1);

        var rule = accessRules.getItem(0);
        expect(rule).toBeDefined();
        expect(rule.attrib.WindowsRuntimeAccess).toBeUndefined();

    });

    it('A Windows 10 project should have WindowsRuntimeAccess attributes in access rules.', function() {

        var mockConfig = createMockConfigAndManifestForApplyAccessRules(true, 'https://www.contoso.com');

        applyNavigationWhitelist(mockConfig.config, mockConfig.manifest, true);

        var app         = mockConfig.manifest.doc.find('.//Application'),
            accessRules = app.find('.//uap:ApplicationContentUriRules');

        expect(accessRules).toBeDefined();
        expect(accessRules.len()).toBe(2);

        var rule = accessRules.getItem(0);
        expect(rule).toBeDefined();
        expect(rule.attrib.WindowsRuntimeAccess).toBeDefined();
        expect(rule.attrib.WindowsRuntimeAccess).toBe('all');

    });

    describe('A Windows 8.1 project should reject http:// URI scheme rules.', function() {

        var stringIndex     = -1,
            searchStr       = 'Access rules must begin with "https://", the following rule will be ignored: ';

        beforeEach(function() {
            require('cordova-common').events.on('warn', function (evt) {
                stringIndex = evt.indexOf(searchStr);
            });
        });

        it('applies access rules and verifies at least one was rejected', function() {
            var mockConfig = createMockConfigAndManifestForApplyAccessRules(false, 'http://www.contoso.com');
            applyAccessRules(mockConfig.config, mockConfig.manifest, false);

            expect(stringIndex).toBe(0);
        });
    });

    describe('A Windows 10 project should accept http:// URI access rules.', function() {

        var stringIndex     = -1,
            searchStr       = 'The following navigation rule had an invalid URI scheme and is ignored:';
        beforeEach(function() {
            require('cordova-common').events.on('warn', function (evt) {
                stringIndex = evt.indexOf(searchStr);
            });
        });

        it('applies access rules and verifies they were accepted', function() {
            var mockConfig = createMockConfigAndManifestForApplyAccessRules(true, 'http://www.contoso.com');
            applyAccessRules(mockConfig.config, mockConfig.manifest, true);

            expect(stringIndex).toBe(-1);
        });
    });
});

describe('A Windows 10 project should apply the uap: namespace prefix to certain capabilities.', function() {

    var manifest;

    beforeEach(function() {
        manifest = createMockConfigAndManifestForApplyAccessRules(true, 'https://www.contoso.com').manifest;
        var element = manifest.doc.find('.//Capabilities');
        element.clear();
        element.append(new et.Element('Capability', { Name: 'internetClient' }));
        element.append(new et.Element('Capability', { Name: 'documentsLibrary' }));
        element.append(new et.Element('DeviceCapability', { Name: 'location' }));
        manifest.write();
    });

    it('Applies the uap: prefix to the documentsLibrary capability.', function() {
        var testResults = {};
        // map capabilities to tag
        manifest.getCapabilities().forEach(function(child) {
            testResults[child.name] = child.type;
        });

        expect(testResults.internetClient).toBe('Capability');
        expect(testResults.documentsLibrary).toBe('uap:Capability');
        expect(testResults.location).toBe('DeviceCapability');
    });
});

function createMockConfigAndManifestForDescription(description) {
    var config = {
        version: function() { return '1.0.0.0'; },
        name: function() { return 'HelloCordova'; },
        description: function () { return description; },
        packageName: function() { return 'org.apache.cordova.HelloCordova'; },
        author: function() { return 'Apache'; },
        startPage: function() { return 'index.html'; },
        windows_packageVersion: function() { return; },
        getPreference: function () { return; }
    };

    var manifest = AppxManifest.get(Win81ManifestPath, /*ignoreCache=*/true);
    spyOn(fs, 'writeFileSync');

    return { config: config, manifest: manifest };
}

describe('Package description', function () {
    it('should be applied to both Properties and VisualElements nodes', function () {
        var mockConfig = createMockConfigAndManifestForDescription('My custom description');
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);

        var desc = mockConfig.manifest.doc.find('.//Properties/Description');
        expect(desc.text).toBe('My custom description');

        desc = mockConfig.manifest.doc.find('.//Application/m2:VisualElements');
        expect(desc.attrib.Description).toBe('My custom description');
    });

    it('should not be removed from  VisualElements node', function () {
        var mockConfig = createMockConfigAndManifestForDescription();
        applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);

        var desc = mockConfig.manifest.doc.find('.//Properties/Description');
        expect(desc).toBe(null);

        desc = mockConfig.manifest.doc.find('.//Application/m2:VisualElements');
        expect(desc.attrib.Description).toEqual(prepare.__get__('DEFAULT_DESCRIPTION'));
    });

    it('should be stripped to 2048 symbols before adding to manifest', function () {
        var veryLongDescription = (new Array(3*1024)).join('x');
        var mockConfig = createMockConfigAndManifestForDescription(veryLongDescription);

        expect(function () {
            applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);
        }).not.toThrow();

        var desc = mockConfig.manifest.doc.find('.//Properties/Description');
        expect(desc.text.length).toBe(2048);

        desc = mockConfig.manifest.doc.find('.//Application/m2:VisualElements');
        expect(desc.attrib.Description.length).toBe(2048);
    });

    it('should be validated before adding to manifest', function () {
        var mockConfig = createMockConfigAndManifestForDescription('My description with \t and \n symbols');

        expect(function () {
            applyCoreProperties(mockConfig.config, mockConfig.manifest, 'fake-path', 'uap:', true);
        }).not.toThrow();

        var desc = mockConfig.manifest.doc.find('.//Properties/Description');
        expect(desc).not.toMatch(/\n|\t/);

        desc = mockConfig.manifest.doc.find('.//Application/m2:VisualElements');
        expect(desc.attrib.Description).not.toMatch(/\n|\t/);
    });
});

describe('copyIcons method', function () {
    var copyImages = prepare.__get__('copyImages');
    var logFileOp = prepare.__get__('logFileOp');

    var PROJECT = '/some/path';

    function createMockConfig(images, splashScreens) {
        var result = jasmine.createSpyObj('config', ['getIcons', 'getSplashScreens']);
        result.getIcons.andReturn(images);
        result.getSplashScreens.andReturn(splashScreens || []);

        return result;
    }

    beforeEach(function () {
        spyOn(FileUpdater, 'updatePaths');
    });

    it('should guess target filename based on icon size', function () {
        var images = [
            {src: 'res/Windows/Square44x44Logo_100.png', width: '44', height: '44' },
            {src: 'res/Windows/Square44x44Logo_240.png', width: '106', height: '106' }
        ];

        var project = { projectConfig: createMockConfig(images), root: PROJECT };
        var locations = { root: PROJECT };

        copyImages(project, locations);

        var expectedPathMap = {};
        expectedPathMap['images' + path.sep + 'Square44x44Logo.scale-100.png'] = 'res/Windows/Square44x44Logo_100.png';
        expectedPathMap['images' + path.sep + 'Square44x44Logo.scale-240.png'] = 'res/Windows/Square44x44Logo_240.png';
        expect(FileUpdater.updatePaths).toHaveBeenCalledWith(expectedPathMap, { rootDir: PROJECT }, logFileOp);
    });

    it('should ignore unknown icon sizes and emit a warning', function () {
        var config = createMockConfig([
            {src: 'res/Windows/UnknownImage.png', width: '999', height: '999' },
        ]);
        var project = { projectConfig: config, root: PROJECT };
        var locations = { root: PROJECT };

        var warnSpy = jasmine.createSpy('warn');
        events.on('warn', warnSpy);
        copyImages(project, locations);
        expect(FileUpdater.updatePaths).toHaveBeenCalledWith({}, { rootDir: PROJECT }, logFileOp);
        expect(warnSpy.calls[0].args[0]).toMatch('image was skipped');
    });

    describe('when "target" attribute is specified for the image', function () {
        it('should copy all images with the same base name and extension to destination dir', function () {
            var matchingFiles = [
                'Square44x44.scale-100.png',
                'Square44x44.targetsize-16.png',
                'Square44x44.scale-150_targetsize-16.png',
                'Square44x44.targetsize-16_scale-200.png',
                'Square44x44.targetsize-16_altform-unplated_scale-200.png'
            ];

            var nonMatchingFiles = [
                'Square55x55.scale-100.png',
                'Square44x44.targetsize-16.jpg'
            ];

            spyOn(fs, 'readdirSync').andReturn(matchingFiles.concat(nonMatchingFiles));

            var images = [{src: 'res/Windows/Square44x44.png', target: 'SmallIcon' }];
            var project = { projectConfig: createMockConfig(images), root: PROJECT };
            var locations = { root: PROJECT };

            copyImages(project, locations);

            var expectedPathMap = {};
            expectedPathMap[path.join('images', 'SmallIcon.scale-100.png')] =
                    path.join('res', 'Windows', 'Square44x44.scale-100.png');
            expectedPathMap[path.join('images','SmallIcon.targetsize-16.png')] =
                    path.join('res', 'Windows', 'Square44x44.targetsize-16.png');
            expectedPathMap[path.join('images', 'SmallIcon.scale-150_targetsize-16.png')] =
                    path.join('res', 'Windows', 'Square44x44.scale-150_targetsize-16.png');
            expectedPathMap[path.join('images', 'SmallIcon.targetsize-16_scale-200.png')] =
                    path.join('res', 'Windows', 'Square44x44.targetsize-16_scale-200.png');
            expectedPathMap[path.join('images', 'SmallIcon.targetsize-16_altform-unplated_scale-200.png')] =
                    path.join('res', 'Windows', 'Square44x44.targetsize-16_altform-unplated_scale-200.png');
            expect(FileUpdater.updatePaths).toHaveBeenCalledWith(expectedPathMap, { rootDir: PROJECT }, logFileOp);
        });
    });

    it('should ignore splashScreens for Windows 10 project with size >200K and emit a warning', function () {
        var size300K = 300 * 1024;
        var warnSpy = jasmine.createSpy('warn');
        events.on('warn', warnSpy);

        var splashScreens = [
            {src: 'res/Windows/splashscreen.png', target: 'SplashScreen' },                         // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-180.png', width: '1116', height: '540' },         // targetProject: 8.1
            {src: 'res/Windows/splashscreen.scale-200.png', width: '1240', height: '600' },         // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-400.png', width: '2480', height: '1200' },        // targetProject: 10
            {src: 'res/Windows/splashscreenphone.scale-240.png', width: '1152', height: '1920' },   // targetProject: WP 8.1
            {src: 'res/Windows/splashscreenphone.png', target: 'SplashScreenPhone' },               // targetProject: WP 8.1
        ];

        var splashScreensFiles = splashScreens.map(function(splash) {
            return path.basename(splash.src);
        });
        spyOn(fs, 'readdirSync').andReturn(splashScreensFiles);

        spyOn(fs, 'statSync').andReturn({
            size: size300K
        });

        var project = { projectConfig: createMockConfig([], splashScreens), root: PROJECT };
        var locations = { root: PROJECT };

        copyImages(project, locations);

        var expectedPathMap = {};
        expectedPathMap['images' + path.sep + 'SplashScreen.scale-180.png'] = 'res/Windows/splashscreen.scale-180.png';
        expectedPathMap['images' + path.sep + 'SplashScreenPhone.scale-240.png'] = path.join('res', 'Windows', 'splashscreenphone.scale-240.png');
        expectedPathMap['images' + path.sep + 'SplashScreenPhone.scale-100.png'] = path.join('res', 'Windows', 'splashscreenphone.png');
        expect(FileUpdater.updatePaths).toHaveBeenCalledWith(expectedPathMap, { rootDir: PROJECT }, logFileOp);
        expect(warnSpy.calls[0].args[0]).toMatch('file size exceeds the limit');
    });

    it('should ignore splashScreens with unsupported extensions and emit a warning', function () {
        var warnSpy = jasmine.createSpy('warn');
        events.on('warn', warnSpy);

        var splashScreens = [
            {src: 'res/Windows/splashscreen.gif', target: 'SplashScreen' },                         // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-180.bmp', width: '1116', height: '540' },         // targetProject: 8.1
            {src: 'res/Windows/splashscreenphone.tga', target: 'SplashScreenPhone' },               // targetProject: WP 8.1
        ];

        var splashScreensFiles = splashScreens.map(function(splash) {
            return path.basename(splash.src);
        });
        spyOn(fs, 'readdirSync').andReturn(splashScreensFiles);

        spyOn(fs, 'statSync').andReturn({
            size: 0
        });

        var project = { projectConfig: createMockConfig([], splashScreens), root: PROJECT };
        var locations = { root: PROJECT };

        copyImages(project, locations);

        var extensionNotSupportedMsg = 'extension is not supported';
        var expectedPathMap = {};
        expect(FileUpdater.updatePaths).toHaveBeenCalledWith(expectedPathMap, { rootDir: PROJECT }, logFileOp);
        expect(warnSpy.calls[0].args[0]).toMatch(extensionNotSupportedMsg);
        expect(warnSpy.calls[1].args[0]).toMatch(extensionNotSupportedMsg);
        expect(warnSpy.calls[2].args[0]).toMatch(extensionNotSupportedMsg);
    });

    it('should warn about mixed splashscreen extensions used for non-MRT syntax', function () {
        var updateSplashScreenImageExtensions = prepare.__get__('updateSplashScreenImageExtensions');
        spyOn(fs, 'writeFileSync');
        spyOn(AppxManifest, 'get').andReturn({
            getVisualElements: function() {
                return {
                    getSplashScreenExtension: function() {
                        return '.png';
                    },
                    setSplashScreenExtension: function() {}
                };
            },
            write: function() {}
        });
        var warnSpy = jasmine.createSpy('warn');
        events.on('warn', warnSpy);

        var splashScreens = [
            {src: 'res/Windows/splashscreen.png', width: '620', height: '300' },                    // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-180.jpg', width: '1116', height: '540' },         // targetProject: 8.1
            {src: 'res/Windows/splashscreen.scale-200.png', width: '1240', height: '600' },         // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-400.jpg', width: '2480', height: '1200' },        // targetProject: 10
            {src: 'res/Windows/splashscreenphone.scale-240.png', width: '1152', height: '1920' },   // targetProject: WP 8.1
            {src: 'res/Windows/splashscreenphone.jpg', width: '480', height: '800' },               // targetProject: WP 8.1
        ];

        var splashScreensFiles = splashScreens.map(function(splash) {
            return path.basename(splash.src);
        });
        spyOn(fs, 'readdirSync').andReturn(splashScreensFiles);

        spyOn(fs, 'statSync').andReturn({
            size: 0
        });

        var project = { projectConfig: createMockConfig([], splashScreens), root: PROJECT };
        var locations = { root: PROJECT };

        updateSplashScreenImageExtensions(project, locations);

        var mixedExtensionsMsg = 'splash screens have mixed file extensions';
        expect(warnSpy.calls[0].args[0]).toMatch(mixedExtensionsMsg);
        expect(warnSpy.calls[1].args[0]).toMatch(mixedExtensionsMsg);
    });

    it('should update manifests with proper splashscreen image extension', function () {
        // 1. Set manifest with SplashScreen.Image = "image.png" (this is default)
        // 2. Set config.xml with splash src="image.jpg"
        // 3. updateSplashScreenImageExtensions should call getSplashScreenExtension, setSplashScreenExtension('.jpg')

        var updateSplashScreenImageExtensions = prepare.__get__('updateSplashScreenImageExtensions');
        spyOn(fs, 'writeFileSync');

        var win10Manifest = AppxManifest.get(Win10ManifestPath),
            win81Manifest = AppxManifest.get(Win81ManifestPath),
            wp81Manifest = AppxManifest.get(WP81ManifestPath);

        spyOn(AppxManifest, 'get').andCallFake(function(manifestPath) {
            if (manifestPath.indexOf(Win10ManifestName) !== -1) {
                return win10Manifest;
            }

            if (manifestPath.indexOf(Win81ManifestName) !== -1) {
                return win81Manifest;
            }

            if (manifestPath.indexOf(WP81ManifestName) !== -1) {
                return wp81Manifest;
            }
        });

        var splashScreens = [
            {src: 'res/Windows/splashscreen.jpg', width: '620', height: '300' },                    // targetProject: 10
            {src: 'res/Windows/splashscreen.scale-180.jpg', width: '1116', height: '540' },         // targetProject: 8.1
            {src: 'res/Windows/splashscreenphone.jpg', width: '480', height: '800' },               // targetProject: WP 8.1
        ];

        var splashScreensFiles = splashScreens.map(function(splash) {
            return path.basename(splash.src);
        });
        spyOn(fs, 'readdirSync').andReturn(splashScreensFiles);

        spyOn(fs, 'statSync').andReturn({
            size: 0
        });

        var project = { projectConfig: createMockConfig([], splashScreens), root: PROJECT };
        var locations = { root: PROJECT };

        updateSplashScreenImageExtensions(project, locations);

        expect(win10Manifest.getVisualElements().getSplashScreenExtension()).toBe('.jpg');
        expect(win81Manifest.getVisualElements().getSplashScreenExtension()).toBe('.jpg');
        expect(wp81Manifest.getVisualElements().getSplashScreenExtension()).toBe('.jpg');
    });
});
