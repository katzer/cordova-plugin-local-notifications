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

'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');
var shell = require('shelljs');
var plist = require('plist');
var xcode = require('xcode');
var rewire = require('rewire');
var EventEmitter = require('events').EventEmitter;
var Api = require('../../../bin/templates/scripts/cordova/Api');
var prepare = rewire('../../../bin/templates/scripts/cordova/lib/prepare');
var projectFile = require('../../../bin/templates/scripts/cordova/lib/projectFile');
var FileUpdater = require('cordova-common').FileUpdater;

var FIXTURES = path.join(__dirname, 'fixtures');

var iosProjectFixture = path.join(FIXTURES, 'ios-config-xml');
var iosProject = path.join(os.tmpdir(), 'prepare');
var iosPlatform = path.join(iosProject, 'platforms/ios');

shell.config.silent = true;

var ConfigParser = require('cordova-common').ConfigParser;

// Create a real config object before mocking out everything.
var cfg = new ConfigParser(path.join(FIXTURES, 'test-config.xml'));
var cfg2 = new ConfigParser(path.join(FIXTURES, 'test-config-2.xml'));


function wrapper(p, done, post) {
    p.then(post, function(err) {
        expect(err.stack).toBeUndefined();
    }).fin(done);
}

function wrapperError(p, done, post) {
    p.then(post, function(err) {
        expect(err.stack).toBeDefined();
    }).fin(done);
}

describe('prepare', function() {
    var p;
    beforeEach(function() {
        shell.mkdir('-p', iosPlatform);
        shell.cp('-rf', iosProjectFixture + '/*', iosPlatform);
        p = new Api('ios', iosPlatform, new EventEmitter());
    });

    afterEach(function () {
        shell.rm('-rf', path.join(__dirname, 'some'));
    });

    describe('launch storyboard feature (CB-9762)', function() {
        function makeSplashScreenEntry(src, width, height) {
            return {
                src: src,
                width: width,
                height: height
            };
        }

        var noLaunchStoryboardImages = [];

        var singleLaunchStoryboardImage = [makeSplashScreenEntry('res/splash/ios/Default@2x~universal~anyany.png')];

        var singleLaunchStoryboardImageWithLegacyLaunchImage = [
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/another-image.png', 1024, 768)
        ];

        var typicalLaunchStoryboardImages = [
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~comany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~comcom.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~universal~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~universal~anycom.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~universal~comany.png')
        ];

        var multiDeviceLaunchStoryboardImages = [
            makeSplashScreenEntry('res/splash/ios/Default@2x~ipad~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~ipad~comany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~ipad~comcom.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~comany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@2x~universal~comcom.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~iphone~anyany.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~iphone~anycom.png'),
            makeSplashScreenEntry('res/splash/ios/Default@3x~iphone~comany.png')
        ];

        describe('#mapLaunchStoryboardContents', function() {
            var mapLaunchStoryboardContents = prepare.__get__('mapLaunchStoryboardContents');

            it('should return an array with no mapped storyboard images', function() {
                var result = mapLaunchStoryboardContents(noLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-map/empty-map'));
            });

            it('should return an array with one mapped storyboard image', function() {
                var result = mapLaunchStoryboardContents(singleLaunchStoryboardImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-map/single-2xanyany-map'));
            });

            it('should return an array with one mapped storyboard image, even with legacy images', function() {
                var result = mapLaunchStoryboardContents(singleLaunchStoryboardImageWithLegacyLaunchImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-map/single-2xanyany-map'));
            });

            it('should return an array with several mapped storyboard images', function() {
                var result = mapLaunchStoryboardContents(typicalLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-map/typical-universal-map'));
            });

            it('should return an array with several mapped storyboard images across device classes', function() {
                var result = mapLaunchStoryboardContents(multiDeviceLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-map/varied-device-map'));
            });
        });

        describe('#mapLaunchStoryboardResources', function() {
            var mapLaunchStoryboardResources = prepare.__get__('mapLaunchStoryboardResources');

            it('should return an empty object with no mapped storyboard images', function () {
                var result = mapLaunchStoryboardResources(noLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual({});
            });

            it('should return an object with one mapped storyboard image', function() {
                var result = mapLaunchStoryboardResources(singleLaunchStoryboardImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual({
                    'Default@2x~universal~anyany.png' : 'res/splash/ios/Default@2x~universal~anyany.png'
                });
            });

            it('should return an object with one mapped storyboard image, even with legacy images', function() {
                var result = mapLaunchStoryboardResources(singleLaunchStoryboardImageWithLegacyLaunchImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual({
                    'Default@2x~universal~anyany.png' : 'res/splash/ios/Default@2x~universal~anyany.png'
                });
            });

            it('should return an object with several mapped storyboard images', function() {
                var result = mapLaunchStoryboardResources(typicalLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual({
                    'Default@2x~universal~anyany.png' : 'res/splash/ios/Default@2x~universal~anyany.png',
                    'Default@2x~universal~comany.png' : 'res/splash/ios/Default@2x~universal~comany.png',
                    'Default@2x~universal~comcom.png' : 'res/splash/ios/Default@2x~universal~comcom.png',
                    'Default@3x~universal~anyany.png' : 'res/splash/ios/Default@3x~universal~anyany.png',
                    'Default@3x~universal~anycom.png' : 'res/splash/ios/Default@3x~universal~anycom.png',
                    'Default@3x~universal~comany.png' : 'res/splash/ios/Default@3x~universal~comany.png'
                });
            });

            it('should return an object with several mapped storyboard images across device classes', function() {
                var result = mapLaunchStoryboardResources(multiDeviceLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual({
                    'Default@2x~universal~anyany.png' : 'res/splash/ios/Default@2x~universal~anyany.png',
                    'Default@2x~universal~comany.png' : 'res/splash/ios/Default@2x~universal~comany.png',
                    'Default@2x~universal~comcom.png' : 'res/splash/ios/Default@2x~universal~comcom.png',
                    'Default@2x~ipad~anyany.png' : 'res/splash/ios/Default@2x~ipad~anyany.png',
                    'Default@2x~ipad~comany.png' : 'res/splash/ios/Default@2x~ipad~comany.png',
                    'Default@2x~ipad~comcom.png' : 'res/splash/ios/Default@2x~ipad~comcom.png',
                    'Default@3x~iphone~anyany.png' : 'res/splash/ios/Default@3x~iphone~anyany.png',
                    'Default@3x~iphone~anycom.png' : 'res/splash/ios/Default@3x~iphone~anycom.png',
                    'Default@3x~iphone~comany.png' : 'res/splash/ios/Default@3x~iphone~comany.png'
                });
            });
        });

        describe('#getLaunchStoryboardContentsJSON', function() {
            var getLaunchStoryboardContentsJSON = prepare.__get__('getLaunchStoryboardContentsJSON');

            it('should return contents.json with no mapped storyboard images', function () {
                var result = getLaunchStoryboardContentsJSON(noLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/empty'));
            });

            it('should return contents.json with one mapped storyboard image', function() {
                var result = getLaunchStoryboardContentsJSON(singleLaunchStoryboardImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/single-2xanyany'));
            });

            it('should return contents.json with one mapped storyboard image, even with legacy images', function() {
                var result = getLaunchStoryboardContentsJSON(singleLaunchStoryboardImageWithLegacyLaunchImage, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/single-2xanyany'));
            });

            it('should return contents.json with several mapped storyboard images', function() {
                var result = getLaunchStoryboardContentsJSON(typicalLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/typical-universal'));
            });

            it('should return contents.json with several mapped storyboard images across device classes', function() {
                var result = getLaunchStoryboardContentsJSON(multiDeviceLaunchStoryboardImages, '');
                expect(result).toBeDefined();
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/varied-device'));
            });
        });

        describe('#getLaunchStoryboardImagesDir', function() {
            var getLaunchStoryboardImagesDir = prepare.__get__('getLaunchStoryboardImagesDir');
            var projectRoot = iosProject;

            it('should find the Images.xcassets file in a project with an asset catalog', function() {
                var platformProjDir = path.join('platforms', 'ios', 'SampleApp');
                var assetCatalogPath = path.join(iosProject, platformProjDir, 'Images.xcassets');
                var expectedPath = path.join(platformProjDir, 'Images.xcassets', 'LaunchStoryboard.imageset/');

                var fileExists = shell.test('-e', assetCatalogPath);
                expect(fileExists).toEqual(true);

                var returnPath = getLaunchStoryboardImagesDir(projectRoot, platformProjDir);
                expect(returnPath).toEqual(expectedPath);
            });

            it('should NOT find the Images.xcassets file in a project with no asset catalog', function() {
                var platformProjDir = path.join('platforms', 'ios', 'SamplerApp');
                var assetCatalogPath = path.join(iosProject, platformProjDir, 'Images.xcassets');

                var fileExists = shell.test('-e', assetCatalogPath);
                expect(fileExists).toEqual(false);

                var returnPath = getLaunchStoryboardImagesDir(projectRoot, platformProjDir);
                expect(returnPath).toBeNull();
            });
        });

        describe ('#platformHasLaunchStoryboardImages', function() {
            var platformHasLaunchStoryboardImages = prepare.__get__('platformHasLaunchStoryboardImages');
            var cfgs = ['none', 'legacy-only', 'modern-only', 'modern-and-legacy'].reduce(function (p,c) {
                p[c] = new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', c + '.xml'));
                return p;
            }, {});

            it('should be false with no launch images', function() {
                expect(platformHasLaunchStoryboardImages(cfgs.none)).toEqual(false);
            });
            it('should be false with only legacy images', function() {
                expect(platformHasLaunchStoryboardImages(cfgs['legacy-only'])).toEqual(false);
            });
            it('should be true with typical launch storyboard images', function() {
                expect(platformHasLaunchStoryboardImages(cfgs['modern-only'])).toEqual(true);
            });
            it('should be true with typical and legacy launch storyboard images', function() {
                expect(platformHasLaunchStoryboardImages(cfgs['modern-and-legacy'])).toEqual(true);
            });
        });

        describe ('#platformHasLegacyLaunchImages', function() {
            var platformHasLegacyLaunchImages = prepare.__get__('platformHasLegacyLaunchImages');
            var cfgs = ['none', 'legacy-only', 'modern-only', 'modern-and-legacy'].reduce(function (p,c) {
                p[c] = new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', c + '.xml'));
                return p;
            }, {});

            it('should be false with no launch images', function() {
                expect(platformHasLegacyLaunchImages(cfgs.none)).toEqual(false);
            });
            it('should be true with only legacy images', function() {
                expect(platformHasLegacyLaunchImages(cfgs['legacy-only'])).toEqual(true);
            });
            it('should be false with typical launch storyboard images', function() {
                expect(platformHasLegacyLaunchImages(cfgs['modern-only'])).toEqual(false);
            });
            it('should be true with typical and legacy launch storyboard images', function() {
                expect(platformHasLegacyLaunchImages(cfgs['modern-and-legacy'])).toEqual(true);
            });

        });

        describe('#updateProjectPlistForLaunchStoryboard', function() {
            var updateProjectPlistForLaunchStoryboard = prepare.__get__('updateProjectPlistForLaunchStoryboard');
            var plistFile = path.join(iosPlatform, 'SampleApp', 'SampleApp-Info.plist');
            var cfgs;
            it('setup', function () {
                cfgs = ['none', 'legacy-only', 'modern-only', 'modern-and-legacy'].reduce(function (p,c) {
                    p[c] = {
                        config: new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', c + '.xml')),
                        plist: plist.parse(fs.readFileSync(plistFile, 'utf8'))
                    };
                    return p;
                }, {});
            });

            it('should not change the info plist when no launch images are supplied', function() {
                var plist = cfgs.none.plist;
                updateProjectPlistForLaunchStoryboard(cfgs.none.config, plist);
                expect(plist.UILaunchStoryboardName).toBeUndefined();
            });
            it('should not change the info plist when only legacy launch images are supplied', function() {
                var plist = cfgs['legacy-only'].plist;
                updateProjectPlistForLaunchStoryboard(cfgs['legacy-only'].config, plist);
                expect(plist.UILaunchStoryboardName).toBeUndefined();
            });
            it('should change the info plist when only modern launch images are supplied', function() {
                var plist = cfgs['modern-only'].plist;
                updateProjectPlistForLaunchStoryboard(cfgs['modern-only'].config, plist);
                expect(plist.UILaunchStoryboardName).toEqual('CDVLaunchScreen');
            });
            it('should change the info plist when both legacy and modern launch images are supplied', function() {
                var plist = cfgs['modern-and-legacy'].plist;
                updateProjectPlistForLaunchStoryboard(cfgs['modern-and-legacy'].config, plist);
                expect(plist.UILaunchStoryboardName).toEqual('CDVLaunchScreen');
            });
            it('should remove the setting when no launch images are supplied but storyboard setting configured', function() {
                var plist = cfgs.none.plist;
                plist.UILaunchStoryboardName = 'CDVLaunchScreen';
                updateProjectPlistForLaunchStoryboard(cfgs.none.config, plist);
                expect(plist.UILaunchStoryboardName).toBeUndefined();
            });
            it('should remove the setting when only legacy images are supplied but storyboard setting configured', function() {
                var plist = cfgs['legacy-only'].plist;
                plist.UILaunchStoryboardName = 'CDVLaunchScreen';
                updateProjectPlistForLaunchStoryboard(cfgs['legacy-only'].config, plist);
                expect(plist.UILaunchStoryboardName).toBeUndefined();
            });
            it('should maintain the launch storyboard setting over multiple calls when modern images supplied', function() {
                var plist = cfgs['modern-only'].plist;
                delete plist.UILaunchStoryboardName;
                updateProjectPlistForLaunchStoryboard(cfgs['modern-and-legacy'].config, plist);
                expect(plist.UILaunchStoryboardName).toEqual('CDVLaunchScreen');
                updateProjectPlistForLaunchStoryboard(cfgs['modern-and-legacy'].config, plist);
                expect(plist.UILaunchStoryboardName).toEqual('CDVLaunchScreen');
            });
            it('should not attempt to override launch storyboard setting if not set to our storyboard', function() {
                var plist = cfgs['modern-and-legacy'].plist;
                plist.UILaunchStoryboardName = 'AnotherStoryboard';
                updateProjectPlistForLaunchStoryboard(cfgs['modern-and-legacy'].config, plist);
                expect(plist.UILaunchStoryboardName).toEqual('AnotherStoryboard');
            });

        });

        describe ('#updateLaunchStoryboardImages', function() {
            var getLaunchStoryboardImagesDir = prepare.__get__('getLaunchStoryboardImagesDir');
            var updateLaunchStoryboardImages = prepare.__get__('updateLaunchStoryboardImages');
            var logFileOp = prepare.__get__('logFileOp');

            it('should clean storyboard launch images and update contents.json', function() {
                // spy!
                var updatePaths = spyOn(FileUpdater, 'updatePaths');

                // get appropriate paths
                var projectRoot = iosProject;
                var platformProjDir = path.join('platforms', 'ios', 'SampleApp');
                var storyboardImagesDir = getLaunchStoryboardImagesDir(projectRoot, platformProjDir);

                // create a suitable mock project for our method
                var project = {
                    root: iosProject,
                    locations: p.locations,
                    projectConfig: new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', 'modern-only.xml'))
                };

                // copy the splash screen fixtures to the iOS project
                shell.cp('-rf', path.join(FIXTURES, 'launch-storyboard-support', 'res'), iosProject);

                // copy splash screens and update Contents.json
                updateLaunchStoryboardImages(project, p.locations);

                // verify that updatePaths was called as we expect
                var expectedResourceMap = {
                    'Default@2x~universal~comcom.png' : 'res/screen/ios/Default@2x~universal~comcom.png',
                    'Default@2x~universal~comany.png' : 'res/screen/ios/Default@2x~universal~comany.png',
                    'Default@2x~universal~anyany.png' : 'res/screen/ios/Default@2x~universal~anyany.png',
                    'Default@3x~universal~comany.png' : 'res/screen/ios/Default@3x~universal~comany.png',
                    'Default@3x~universal~anycom.png' : 'res/screen/ios/Default@3x~universal~anycom.png',
                    'Default@3x~universal~anyany.png' : 'res/screen/ios/Default@3x~universal~anyany.png' };
                // update keys with path to storyboardImagesDir
                for (var k in expectedResourceMap) {
                    if (expectedResourceMap.hasOwnProperty(k)) {
                        expectedResourceMap[storyboardImagesDir + k] = expectedResourceMap[k];
                        delete expectedResourceMap[k];
                    }
                }
                expect(updatePaths).toHaveBeenCalledWith( expectedResourceMap, {
                        rootDir: project.root
                    }, logFileOp
                );

                // verify that that Contents.json is as we expect
                var result = JSON.parse(fs.readFileSync(path.join(project.root, storyboardImagesDir, 'Contents.json')));
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/typical-universal')); 
            });
        });

        describe ('#cleanLaunchStoryboardImages', function() {
            var getLaunchStoryboardImagesDir = prepare.__get__('getLaunchStoryboardImagesDir');
            var updateLaunchStoryboardImages = prepare.__get__('updateLaunchStoryboardImages');
            var cleanLaunchStoryboardImages = prepare.__get__('cleanLaunchStoryboardImages');
            var logFileOp = prepare.__get__('logFileOp');

            it('should move launch images and update contents.json', function() {

                var projectRoot = iosProject;
                var platformProjDir = path.join('platforms', 'ios', 'SampleApp');
                var storyboardImagesDir = getLaunchStoryboardImagesDir(projectRoot, platformProjDir);
                var project = {
                    root: iosProject,
                    locations: p.locations,
                    projectConfig: new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', 'modern-only.xml'))
                };

                shell.cp('-rf', path.join(FIXTURES, 'launch-storyboard-support', 'res'), iosProject);
                updateLaunchStoryboardImages(project, p.locations);

                // now, clean the images
                var updatePaths = spyOn(FileUpdater, 'updatePaths');
                cleanLaunchStoryboardImages(projectRoot, project.projectConfig, p.locations);

                // verify that updatePaths was called as we expect
                var expectedResourceMap = {
                    'Default@2x~universal~comcom.png' : null,
                    'Default@2x~universal~comany.png' : null,
                    'Default@2x~universal~anyany.png' : null, 
                    'Default@3x~universal~comany.png' : null,
                    'Default@3x~universal~anycom.png' : null,
                    'Default@3x~universal~anyany.png' : null };
                // update keys with path to storyboardImagesDir
                for (var k in expectedResourceMap) {
                    if (expectedResourceMap.hasOwnProperty(k)) {
                        expectedResourceMap[storyboardImagesDir + k] = null;
                        delete expectedResourceMap[k];
                    }
                }
                expect(updatePaths).toHaveBeenCalledWith( expectedResourceMap, {
                        rootDir: project.root,
                        all: true
                    }, logFileOp
                );

                // verify that that Contents.json is as we expect
                var result = JSON.parse(fs.readFileSync(path.join(project.root, storyboardImagesDir, 'Contents.json')));
                expect(result).toEqual(require('./fixtures/launch-storyboard-support/contents-json/empty')); 
            });
        });

        describe ('#checkIfBuildSettingsNeedUpdatedForLaunchStoryboard', function() {
            var checkIfBuildSettingsNeedUpdatedForLaunchStoryboard = prepare.__get__('checkIfBuildSettingsNeedUpdatedForLaunchStoryboard');
            var updateProjectPlistForLaunchStoryboard = prepare.__get__('updateProjectPlistForLaunchStoryboard');
            var plistFile = path.join(iosPlatform, 'SampleApp', 'SampleApp-Info.plist');
            var cfgs; 
            it ('setup', function() {
                cfgs = ['none', 'legacy-only', 'modern-only', 'modern-and-legacy'].reduce(function (p,c) {
                    p[c] = {
                        config: new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', c + '.xml')),
                        plist: plist.parse(fs.readFileSync(plistFile, 'utf8'))
                    };
                    return p;
                }, {});
            });

            it('should return false with no launch images', function () {
                var cfg = cfgs.none;
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                expect(checkIfBuildSettingsNeedUpdatedForLaunchStoryboard(cfg.config, cfg.plist)).toEqual(false);
            });
            it('should return true with only legacy images', function () {
                // why? because legacy images require Xcode to compile launch image assets
                // and we may have previously removed that setting
                var cfg = cfgs['legacy-only'];
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                expect(checkIfBuildSettingsNeedUpdatedForLaunchStoryboard(cfg.config, cfg.plist)).toEqual(true);
            });
            it('should return true with only storyboard images', function () {
                var cfg = cfgs['modern-only'];
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                expect(checkIfBuildSettingsNeedUpdatedForLaunchStoryboard(cfg.config, cfg.plist)).toEqual(true);
            });
            it('should return false with storyboard and legacy images', function () {
                // why? because we assume that the build settings will still build the asset catalog
                // the user has specified both legacy and modern images, so why question it?
                var cfg = cfgs['modern-and-legacy'];
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                expect(checkIfBuildSettingsNeedUpdatedForLaunchStoryboard(cfg.config, cfg.plist)).toEqual(false);
            });

        });

        describe ('#updateBuildSettingsForLaunchStoryboard', function() {
            var updateBuildSettingsForLaunchStoryboard = prepare.__get__('updateBuildSettingsForLaunchStoryboard');
            var updateProjectPlistForLaunchStoryboard = prepare.__get__('updateProjectPlistForLaunchStoryboard');
            var plistFile = path.join(iosPlatform, 'SampleApp', 'SampleApp-Info.plist');
            var cfgs;
            it('setup', function () {
                cfgs = ['legacy-only', 'modern-only'].reduce(function (p,c) {
                    p[c] = {
                        config: new ConfigParser(path.join(FIXTURES, 'launch-storyboard-support', 'configs', c + '.xml')),
                        plist: plist.parse(fs.readFileSync(plistFile, 'utf8'))
                    };
                    return p;
                }, {});
            });

            it('should update build property with only legacy images', function () {
                var cfg = cfgs['legacy-only'];
                var proj = new xcode.project(p.locations.pbxproj);
                proj.parseSync();
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                updateBuildSettingsForLaunchStoryboard(proj, cfg.config, cfg.plist);
                expect(proj.getBuildProperty('ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME')).toEqual('LaunchImage');
            });
            it('should remove build property with only storyboard images', function () {
                var cfg = cfgs['modern-only'];
                var proj = new xcode.project(p.locations.pbxproj);
                proj.parseSync();
                // set a value for our asset catalog to make sure it really goes away
                proj.updateBuildProperty('ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME','LaunchImage');
                updateProjectPlistForLaunchStoryboard(cfg.config, cfg.plist);
                updateBuildSettingsForLaunchStoryboard(proj, cfg.config, cfg.plist);
                expect(proj.getBuildProperty('ASSETCATALOG_COMPILER_LAUNCHIMAGE_NAME')).toBeUndefined();
            });
        });


    });

    describe('updateProject method', function() {
        var mv;
        var update_name;
        var xcOrig = xcode.project;
        var writeFileSyncSpy;

        var updateProject = prepare.__get__('updateProject');

        beforeEach(function() {
            mv = spyOn(shell, 'mv');
            writeFileSyncSpy = spyOn(fs, 'writeFileSync');

            spyOn(plist, 'parse').and.returnValue({});
            spyOn(plist, 'build').and.returnValue('');
            spyOn(xcode, 'project').and.callFake(function (pbxproj) {

                var xc = new xcOrig(pbxproj);
                update_name = spyOn(xc, 'updateProductName').and.callThrough();
                return xc;
            });
            cfg.name = function() { return 'SampleApp'; }; // this is to match p's original project name (based on .xcodeproj)
            cfg.packageName = function() { return 'testpkg'; };
            cfg.version = function() { return 'one point oh'; };

            spyOn(cfg, 'getPreference');
        });

        it('Test#001 : should not update the app name in pbxproj', function(done) {
            var cfg2OriginalName = cfg2.name;

            // originalName here will be `SampleApp` (based on the xcodeproj basename) from p
            cfg2.name = function() { return 'NotSampleApp'; };  // new config has name change            
            wrapperError(updateProject(cfg2, p.locations), done); // since the name has changed it *should* error

            // originalName here will be `SampleApp` (based on the xcodeproj basename) from p
            cfg2.name = function() { return 'SampleApp'; }; // new config does *not* have a name change
            wrapper(updateProject(cfg2, p.locations), done); // since the name has not changed it *should not* error

            // restore cfg2 original name
            cfg2.name = cfg2OriginalName;
        });

        it('should write target-device preference', function(done) {
            var cfg2OriginalName = cfg2.name;
            cfg2.name = function() { return 'SampleApp'; }; // new config does *not* have a name change
            writeFileSyncSpy.and.callThrough();

            wrapper(updateProject(cfg2, p.locations), done, function() {
                var xcode = require('xcode');
                var proj = new xcode.project(p.locations.pbxproj);
                proj.parseSync();
                var prop = proj.getBuildProperty('TARGETED_DEVICE_FAMILY');
                expect(prop).toEqual('"1"'); // 1 is handset

                // restore cfg2 original name
                cfg2.name = cfg2OriginalName;
            });
        });
        it('should write deployment-target preference', function(done) {
            var cfg2OriginalName = cfg2.name;
            cfg2.name = function() { return 'SampleApp'; }; // new config does *not* have a name change
            writeFileSyncSpy.and.callThrough();

            wrapper(updateProject(cfg2, p.locations), done, function() {
                var xcode = require('xcode');
                var proj = new xcode.project(p.locations.pbxproj);
                proj.parseSync();
                var prop = proj.getBuildProperty('IPHONEOS_DEPLOYMENT_TARGET'); 
                expect(prop).toEqual('8.0');

                // restore cfg2 original name
                cfg2.name = cfg2OriginalName;
            });
        });

        it('Test#002 : should write out the app id to info plist as CFBundleIdentifier', function(done) {
            var orig = cfg.getAttribute;
            cfg.getAttribute = function(name) {
                if (name == 'ios-CFBundleIdentifier') {
                    return null;
                }
                return orig.call(this, name);
            };

            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].CFBundleIdentifier).toEqual('testpkg');
            });
        });
        it('Test#003 : should write out the app id to info plist as CFBundleIdentifier with ios-CFBundleIdentifier', function(done) {
            var orig = cfg.getAttribute;
            cfg.getAttribute = function(name) {
                if (name == 'ios-CFBundleIdentifier') {
                    return 'testpkg_ios';
                }
                return orig.call(this, name);
            };

            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].CFBundleIdentifier).toEqual('testpkg_ios');
            });
        });
        it('Test#004 : should write out the app version to info plist as CFBundleVersion', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].CFBundleShortVersionString).toEqual('one point oh');
            });
        });
        it('Test#005 : should write out the orientation preference value', function(done) {
            cfg.getPreference.and.callThrough();
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown' ]);
                expect(plist.build.mostRecentCall.args[0]['UISupportedInterfaceOrientations~ipad']).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toEqual([ 'UIInterfaceOrientationPortrait' ]);
            });
        });
        it('Test#006 : should handle no orientation', function(done) {
            cfg.getPreference.and.returnValue('');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toBeUndefined();
                expect(plist.build.mostRecentCall.args[0]['UISupportedInterfaceOrientations~ipad']).toBeUndefined();
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toBeUndefined();
            });
        });
        it('Test#007 : should handle default orientation', function(done) {
            cfg.getPreference.and.returnValue('default');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0]['UISupportedInterfaceOrientations~ipad']).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toBeUndefined();
            });
        });
        it('Test#008 : should handle portrait orientation', function(done) {
            cfg.getPreference.and.returnValue('portrait');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toEqual([ 'UIInterfaceOrientationPortrait' ]);
            });
        });
        it('Test#009 : should handle landscape orientation', function(done) {
            cfg.getPreference.and.returnValue('landscape');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toEqual([ 'UIInterfaceOrientationLandscapeLeft' ]);
            });
        });
        it('Test#010 : should handle all orientation on ios', function(done) {
            cfg.getPreference.and.returnValue('all');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toEqual([ 'UIInterfaceOrientationPortrait' ]);
            });
        });
        it('Test#011 : should handle custom orientation', function(done) {
            cfg.getPreference.and.returnValue('some-custom-orientation');
            wrapper(updateProject(cfg, p.locations), done, function() {
                expect(plist.build.mostRecentCall.args[0].UISupportedInterfaceOrientations).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0]['UISupportedInterfaceOrientations~ipad']).toEqual([ 'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight' ]);
                expect(plist.build.mostRecentCall.args[0].UIInterfaceOrientation).toBeUndefined();
            });
        });

        ///// App Transport Security Tests /////////////////////////////
        // NOTE: if an ATS value is equal to "null", it means that it was not written, 
        // thus it will use the default (check the default for the key).
        // This is to prevent the Info.plist to be too verbose.  
        it('Test#012 : <access> - should handle wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });

        it('<access> - should handle wildcard, with NSAllowsArbitraryLoadsInWebContent', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<access origin="*" allows-arbitrary-loads-in-web-content="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });

        it('<access> - should handle wildcard, with NSAllowsArbitraryLoadsInMedia', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<access origin="*" allows-arbitrary-loads-in-media="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(true);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });

        it('<access> - should handle wildcard, with NSAllowsLocalNetworking', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<access origin="*" allows-local-networking="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(true);
            });
        });

        it('<access> - should handle wildcard, with NSAllowsArbitraryLoadsInWebContent, NSAllowsArbitraryLoadsInMedia, NSAllowsLocalNetworking', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<access origin="*" allows-arbitrary-loads-in-web-content="true" allows-arbitrary-loads-in-media="true" allows-local-networking="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(true);
                expect(ats.NSAllowsLocalNetworking).toEqual(true);
            });
        });
        it('<access> - sanity check - no wildcard but has NSAllowsArbitraryLoadsInWebContent, NSAllowsArbitraryLoadsInMedia, NSAllowsLocalNetworking', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<access origin="http://cordova.apache.org" allows-arbitrary-loads-in-web-content="true" allows-arbitrary-loads-in-media="true" allows-local-networking="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });
        
        it('Test#13 : <access> - https, subdomain wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server01.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server02.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server02-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server02-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
                
                d = exceptionDomains['server03.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server04.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server04-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server04-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
            });
        });

        it('Test#014 : <access> - http, no wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server05.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server06.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server06-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server06-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server07.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server08.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server08-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server08-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

            });
        });
        it('Test#015 : <access> - https, no wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server09.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server10.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server10-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server10-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server11.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server12.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server12-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server12-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
            });
        });
        //////////////////////////////////////////////////
        it('Test#016 : <access>, <allow-navigation> - http and https, no clobber', function(done) {
            var cfg2OriginalName = cfg2.name;
            // original name here is 'SampleApp' based on p
            // we are not testing a name change here, but testing a new config being used (name change test is above)
            // so we set it to the name expected
            cfg2.name = function() { return 'SampleApp'; }; // new config does *not* have a name change

            wrapper(updateProject(cfg2, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['apache.org'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                // restore cfg2 original name
                cfg2.name = cfg2OriginalName;
            });
        });
        //////////////////////////////////////////////////

        it('<allow-navigation> - should handle wildcard', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<allow-navigation href="*" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(true);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });

        it('<allow-navigation> - sanity check - no wildcard but has NSAllowsArbitraryLoadsInWebContent, NSAllowsArbitraryLoadsInMedia, NSAllowsLocalNetworking', function(done) {

            var readFile = spyOn(fs, 'readFileSync');
            var configXml = '<?xml version="1.0" encoding="UTF-8"?><widget id="io.cordova.hellocordova" ios-CFBundleIdentifier="io.cordova.hellocordova.ios" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"><name>SampleApp</name>' +
            '<allow-navigation href="http://cordova.apache.org" allows-arbitrary-loads-in-web-content="true" allows-arbitrary-loads-in-media="true" allows-local-networking="true" />' +
            '</widget>';
            readFile.and.returnValue(configXml);

            var my_config = new ConfigParser('fake/path');

            wrapper(updateProject(my_config, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                expect(ats.NSAllowsArbitraryLoads).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInWebContent).toEqual(null);
                expect(ats.NSAllowsArbitraryLoadsInMedia).toEqual(null);
                expect(ats.NSAllowsLocalNetworking).toEqual(null);
            });
        });
        
        it('<allow-navigation> - https, subdomain wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server21.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server22.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false); 
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server22-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server22-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
                
                d = exceptionDomains['server23.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server24.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server24-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server24-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
            });
        });

        it('<allow-navigation> - http, no wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server25.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server26.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server26-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server26-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server27.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server28.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server28-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server28-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

            });
        });

        it('<allow-navigation> - https, no wildcard', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server29.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server30.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server30-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server30-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server31.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server32.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server32-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server32-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(null);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
            });
        });

        it('Test#017 : <allow-navigation> - wildcard scheme, wildcard subdomain', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server33.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server34.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server34-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server34-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server35.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server36.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server36-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server36-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(true);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
                
            });
        });
        it('Test#018 : <allow-navigation> - wildcard scheme, no subdomain', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                var d;

                expect(exceptionDomains).toBeTruthy();

                d = exceptionDomains['server37.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server38.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server38-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server38-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual(null);
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server39.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server40.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(null);

                d = exceptionDomains['server40-1.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(null);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);

                d = exceptionDomains['server40-2.com'];
                expect(d).toBeTruthy();
                expect(d.NSIncludesSubdomains).toEqual(null);
                expect(d.NSExceptionAllowsInsecureHTTPLoads).toEqual(true);
                expect(d.NSExceptionMinimumTLSVersion).toEqual('TLSv1.1');
                expect(d.NSExceptionRequiresForwardSecrecy).toEqual(false);
                expect(d.NSRequiresCertificateTransparency).toEqual(true);
                
            });
        });
        it('Test#019 : <allow-navigation> - should ignore wildcards like data:*, https:*, https://*', function(done) {
            wrapper(updateProject(cfg, p.locations), done, function() {
                var ats = plist.build.mostRecentCall.args[0].NSAppTransportSecurity;
                var exceptionDomains = ats.NSExceptionDomains;
                expect(exceptionDomains['']).toBeUndefined();
                expect(exceptionDomains['null']).toBeUndefined();
                expect(exceptionDomains['undefined']).toBeUndefined();
            });
        });   
    });

    describe('<resource-file> tests', function() {
        // image-8888.png target attribute is missing in config.xml as a test
        const images = [
            {
                'src': 'image-5678.png',
                'target': 'image-5678.png'
            },
            {
                'src': 'image-1234.png',
                'target': path.join('images', 'image-3456.png')
            },
            {
                'src': 'image-8888.png',
                'target': 'image-8888.png'
            }
        ];
        const projectRoot = path.join(FIXTURES, 'resource-file-support');
        const updateFileResources = prepare.__get__('updateFileResources');
        const cleanFileResources = prepare.__get__('cleanFileResources');
        const cfgResourceFiles = new ConfigParser(path.join(FIXTURES, 'resource-file-support', 'config.xml'));

        function findImageFileRef(pbxproj, imageFileName) {
            const buildfiles = pbxproj.pbxBuildFileSection();
            return Object.keys(buildfiles).filter(function(uuid) {
                var filename = buildfiles[uuid].fileRef_comment;
                return (filename === imageFileName);
            });
        }

        function findResourcesBuildPhaseRef(pbxproj, ref) {
            const resBuildPhase = pbxproj.buildPhaseObject('PBXResourcesBuildPhase', 'Resources');
            let resBuildPhaseFileRefs = [];
            if (resBuildPhase) {
                resBuildPhaseFileRefs = resBuildPhase.files.filter(function(item){
                    return item.value === ref;
                });
            }

            return resBuildPhaseFileRefs;
        }

        it('<resource-file> prepare - copy', function() {
            const cordovaProject = {
                root: projectRoot,
                projectConfig: cfgResourceFiles,
                locations: {
                    plugins: path.join(projectRoot, 'plugins'),
                    www: path.join(projectRoot, 'www')
                }
            };

            updateFileResources(cordovaProject, p.locations);
            const project = projectFile.parse(p.locations);

            for (let image of images) {
                // check whether the file is copied to the target location
                let copiedImageFile = path.join(project.resources_dir, image.target);
                expect(fs.existsSync(copiedImageFile)).toEqual(true);

                // find PBXBuildFile file reference
                let imagefileRefs = findImageFileRef(project.xcode, path.basename(image.target));
                expect(imagefileRefs.length).toEqual(1);
                // find file reference in PBXResourcesBuildPhase
                let resBuildPhaseFileRefs = findResourcesBuildPhaseRef(project.xcode, imagefileRefs[0]);
                expect(resBuildPhaseFileRefs.length).toEqual(1);
            }
        });

        it('<resource-file> clean - remove', function() {
            cleanFileResources(projectRoot, cfgResourceFiles, p.locations);
            const project = projectFile.parse(p.locations);

            for (let image of images) {
                // check whether the file is removed from the target location
                let copiedImageFile = path.join(project.resources_dir, image.target);
                expect(fs.existsSync(copiedImageFile)).toEqual(false);

                // find PBXBuildFile file reference
                let imagefileRefs = findImageFileRef(project.xcode, path.basename(image.target));
                expect(imagefileRefs.length).toEqual(0);
                // find file reference in PBXResourcesBuildPhase
                let resBuildPhaseFileRefs = findResourcesBuildPhaseRef(project.xcode, imagefileRefs[0]);
                expect(resBuildPhaseFileRefs.length).toEqual(0);
            }
        }); 
    });

    describe('updateWww method', function() {
        var updateWww = prepare.__get__('updateWww');
        var logFileOp = prepare.__get__('logFileOp');

        beforeEach(function () {
            spyOn(FileUpdater, 'mergeAndUpdateDir').and.returnValue(true);
        });

        var project = {
            root: iosProject,
            locations: { www: path.join(iosProject, 'www') }
        };

        it('Test#020 : should update project-level www and with platform agnostic www and merges', function() {
            var merges_path = path.join(project.root, 'merges', 'ios');
            shell.mkdir('-p', merges_path);
            updateWww(project, p.locations);
            expect(FileUpdater.mergeAndUpdateDir).toHaveBeenCalledWith(
                [ 'www', path.join('platforms', 'ios', 'platform_www'), path.join('merges','ios') ],
                path.join('platforms', 'ios', 'www'),
                { rootDir : iosProject },
                logFileOp);
        });
        it('Test#021 : should skip merges if merges directory does not exist', function() {
            var merges_path = path.join(project.root, 'merges', 'ios');
            shell.rm('-rf', merges_path);
            updateWww(project, p.locations);
            expect(FileUpdater.mergeAndUpdateDir).toHaveBeenCalledWith(
                [ 'www', path.join('platforms', 'ios', 'platform_www') ],
                path.join('platforms', 'ios', 'www'),
                { rootDir : iosProject },
                logFileOp);
        });
    });
});
