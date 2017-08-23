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
var os = require('os');
var et = require('elementtree');
var path = require('path');
var shell = require('shelljs');
var rewire = require('rewire');

var PluginHandler = rewire('../../../template/cordova/lib/PluginHandler');
var JsprojManager = require('../../../template/cordova/lib/JsprojManager');
var cordovaProjectDir = path.join(os.tmpdir(), 'plugman');
var testProjectWindowsPlatformDir = path.join(__dirname, '../fixtures/testProj', 'platforms', 'windows');

var cordovaProjectWindowsPlatformDir = path.join(cordovaProjectDir, 'platforms', 'windows');
var cordovaProjectPluginsDir = path.join(cordovaProjectDir, 'plugins');
var PluginInfo = require('cordova-common').PluginInfo;
var pluginInfo = require('../../../template/cordova/lib/PluginInfo').PluginInfo;

var dummyplugin = path.join(__dirname, '../fixtures/testProj/plugins/org.test.plugins.dummyplugin');
var testPlugin = path.join(__dirname, '../fixtures/testProj/plugins/testPlugin');
var dummyPluginInfo = new PluginInfo(dummyplugin);
var testPluginInfo = new pluginInfo(testPlugin);
var valid_source = dummyPluginInfo.getSourceFiles('windows');
var valid_resourceFiles = dummyPluginInfo.getResourceFiles('windows');
var valid_libfiles = dummyPluginInfo.getLibFiles('windows');
var valid_frameworks = dummyPluginInfo.getFrameworks('windows');
var test_frameworks = testPluginInfo.getFrameworks('windows');

var faultyplugin = path.join(__dirname, '../fixtures/org.test.plugins.faultyplugin');
var faultyPluginInfo = new PluginInfo(faultyplugin);
var invalid_source = faultyPluginInfo.getSourceFiles('windows');
var invalid_resourceFiles = faultyPluginInfo.getResourceFiles('windows');
var invalid_libfiles = faultyPluginInfo.getLibFiles('windows');

var resourcereferenceplugin = path.join(__dirname, '../fixtures/org.test.plugins.resourcereferenceplugin');
var resourcePluginInfo = new PluginInfo(resourcereferenceplugin);
var valid_resourcereferenceFiles = resourcePluginInfo.getResourceFiles('windows');


function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}

function winJoin() {
    // use Node API when possible
    if (path.win32) return path.win32.join.apply(path, arguments);
    return copyArray(arguments).join('\\').replace(/\//g, '\\');
}

beforeEach(function () {
    this.addMatchers({
        toContainXmlPath: function (xpath) {
            var xml = this.actual;
            var notText = this.isNot ? 'not ' : '';
            this.message = function () {
                return 'Expected xml \'' + et.tostring(xml) + '\' ' + notText + 'to contain elements matching \'' + xpath + '\'.';
            };

            return xml.find(xpath) !== null;
        }
    });
});

var getPluginFilePath = PluginHandler.__get__('getPluginFilePath');
var computeResourcePath = function(resourceFile) {
    return getPluginFilePath(dummyPluginInfo, resourceFile.src, cordovaProjectWindowsPlatformDir);
};

var PLATFORM_PROJECTS = {
    all: 'CordovaApp.projitems',
    phone: 'CordovaApp.Phone.jsproj',
    windows: 'CordovaApp.Windows.jsproj',
    windows8: 'CordovaApp.Windows80.jsproj',
    windows10: 'CordovaApp.Windows10.jsproj'
};

describe('windows project handler', function () {
    var dummyProject;
    beforeEach(function () {
        shell.mkdir('-p', cordovaProjectWindowsPlatformDir);
        shell.cp('-rf', path.join(__dirname, '../fixtures/DummyProject/*'), cordovaProjectWindowsPlatformDir);
        dummyProject = JsprojManager.getProject(cordovaProjectWindowsPlatformDir);
        shell.mkdir('-p', cordovaProjectPluginsDir);
        shell.cp('-rf', dummyplugin, cordovaProjectPluginsDir);
        // CB-11558 Reinitialize plugin.dir to become project_root/plugins/plugin.id to avoid
        // different drives issue resulting in absolute path in projectReferences.
        dummyPluginInfo = new PluginInfo(path.join(cordovaProjectPluginsDir, dummyPluginInfo.id));
    });

    afterEach(function () {
        shell.rm('-rf', cordovaProjectDir);
    });

    describe('installation', function () {
        var copyFileOrig = PluginHandler.__get__('copyFile');
        var copyFileSpy = jasmine.createSpy('copyFile');

        beforeEach(function () {
            PluginHandler.__set__('copyFile', copyFileSpy.andCallFake(copyFileOrig));
        });

        afterEach(function() {
            PluginHandler.__set__('copyFile', copyFileOrig);
        });

        function validateInstalledProjects(tag, elementToInstall, xpath, supportedPlatforms) {
            jasmine.getEnv().currentSpec.removeAllSpies();

            var projects = copyArray(dummyProject.projects);
            projects.push(dummyProject.master);

            // Check that installed framework reference is properly added to project.
            var checkInstalledFrameworkReference = function (tag, elementToInstall, xml) {
                var frameworkCustomPathElement = xml.find(xpath);
                expect(frameworkCustomPathElement).not.toBe(null);
                var frameworkCustomPath = frameworkCustomPathElement.text;
                expect(frameworkCustomPath).not.toBe(null);
                var targetDir = elementToInstall.targetDir || '';
                var frameworkCustomExpectedPath = path.join('plugins', dummyPluginInfo.id, targetDir,
                    path.basename(elementToInstall.src));
                expect(frameworkCustomPath).toEqual(frameworkCustomExpectedPath);
            };

            // Check that framework file was copied to correct path
            var checkInstalledFrameworkPath = function (framework) {
                var targetDir = framework.targetDir || '';
                var dest = path.join(cordovaProjectWindowsPlatformDir, 'plugins', dummyPluginInfo.id, targetDir, path.basename(framework.src));
                var copiedSuccessfully = fs.existsSync(path.resolve(dest));
                expect(copiedSuccessfully).toBe(true);
            };

            var appendToRootFake = function (itemGroup) {
                // In case we install framework with 'custom' attribute set to 'true'
                // we verify that file is copied to correct dir and reference is added properly.
                // This is not required in case of 'projectReference' attribute is used.
                if (tag === 'framework' && elementToInstall.type !== 'projectReference') {
                    checkInstalledFrameworkReference(tag, elementToInstall, itemGroup);
                    checkInstalledFrameworkPath(elementToInstall);
                    return;
                }

                expect(itemGroup).toContainXmlPath(xpath);
            };

            var projectsAddedToSpies = [];
            var projectsNotAddedToSpies = [];

            var projectsAddedTo = [];
            supportedPlatforms.forEach(function (platform) {
                var platformProject = PLATFORM_PROJECTS[platform];
                if (platformProject) {
                    projectsAddedTo.push(PLATFORM_PROJECTS[platform]);
                }
            });

            projects.forEach(function (project) {
                if (projectsAddedTo.indexOf(path.basename(project.location)) > -1) {
                    projectsAddedToSpies.push(spyOn(project, 'appendToRoot').andCallFake(appendToRootFake));
                } else {
                    projectsNotAddedToSpies.push(spyOn(project, 'appendToRoot'));
                }
            });

            PluginHandler.getInstaller(tag)(elementToInstall, dummyPluginInfo, dummyProject);

            projectsAddedToSpies.forEach(function (spy) {
                expect(spy).toHaveBeenCalled();
            });

            projectsNotAddedToSpies.forEach(function (spy) {
                expect(spy).not.toHaveBeenCalled();
            });
        }

        describe('of <source-file> elements', function () {

            var install = PluginHandler.getInstaller('source-file');

            it('should copy stuff from one location to another by calling common.copyFile', function () {
                var source = copyArray(valid_source);
                install(source[0], dummyPluginInfo, dummyProject);
                expect(copyFileSpy).toHaveBeenCalledWith(dummyPluginInfo.dir, 'src/windows/dummer.js', cordovaProjectWindowsPlatformDir, path.join('plugins', 'org.test.plugins.dummyplugin', 'dummer.js'), false);
            });
            it('should throw if source-file src cannot be found', function () {
                var source = copyArray(invalid_source);
                copyFileSpy.andCallFake(copyFileOrig);
                expect(function () {
                    install(source[1], faultyPluginInfo, dummyProject);
                }).toThrow('"' + path.resolve(faultyplugin, 'src/windows/NotHere.js') + '" not found!');
            });
            it('should throw if source-file target already exists', function () {
                var source = copyArray(valid_source);
                var target = path.join(cordovaProjectWindowsPlatformDir, 'plugins', dummyPluginInfo.id, 'dummer.js');
                shell.mkdir('-p', path.dirname(target));
                fs.writeFileSync(target, 'some bs', 'utf-8');
                expect(function () {
                    install(source[0], dummyPluginInfo, dummyProject);
                }).toThrow('"' + target + '" already exists!');
            });
        });

        describe('of <resource-file> elements', function () {
            var resourceFiles = copyArray(valid_resourceFiles);
            var resourcereferenceFiles = copyArray(valid_resourcereferenceFiles);
            var invalidResourceFiles = copyArray(invalid_resourceFiles);
            var install = PluginHandler.getInstaller('resource-file');

            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should write to correct project files when conditions are specified', function () {

                var xpath = 'Content[@Include="' + resourceFiles[0].target + '"][@Condition="\'$(Platform)\'==\'x86\'"]';
                validateInstalledProjects('resource-file', resourceFiles[0], xpath, ['all']);

                xpath = 'Content[@Include="' + resourceFiles[1].target + '"]';
                validateInstalledProjects('resource-file', resourceFiles[1], xpath, ['windows', 'phone', 'windows10']);

                xpath = 'Content[@Include="' + resourceFiles[2].target + '"]';
                validateInstalledProjects('resource-file', resourceFiles[2], xpath, ['phone']);

                xpath = 'Content[@Include="' + resourceFiles[3].target + '"][@Condition="\'$(Platform)\'==\'x64\'"]';
                validateInstalledProjects('resource-file', resourceFiles[3], xpath, ['windows8']);
            });

            it('should write to correct project files when conditions are specified with reference', function () {

                var xpath = 'Content[@Include="' + computeResourcePath(resourcereferenceFiles[0]) + '"][@Condition="\'$(Platform)\'==\'x86\'"]';
                validateInstalledProjects('resource-file', resourcereferenceFiles[0], xpath, ['all']);

                xpath = 'Content[@Include="' + computeResourcePath(resourcereferenceFiles[1]) + '"]';
                validateInstalledProjects('resource-file', resourcereferenceFiles[1], xpath, ['windows', 'phone', 'windows10']);

                xpath = 'Content[@Include="' + computeResourcePath(resourcereferenceFiles[2]) + '"]';
                validateInstalledProjects('resource-file', resourcereferenceFiles[2], xpath, ['phone']);

                xpath = 'Content[@Include="' + computeResourcePath(resourcereferenceFiles[3]) + '"][@Condition="\'$(Platform)\'==\'x64\'"]';
                validateInstalledProjects('resource-file', resourcereferenceFiles[3], xpath, ['windows8']);
            });

            it('should throw if conditions are invalid', function () {
                expect(function () {
                    install(invalidResourceFiles[0], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid arch attribute (must be "x86", "x64" or "ARM"): x85');

                expect(function () {
                    install(invalidResourceFiles[1], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid versions attribute (must be a valid semantic version range): 8.0a');

                expect(function () {
                    install(invalidResourceFiles[2], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid device-target attribute (must be "all", "phone", "windows" or "win"): daphne');
            });
        });

        describe('of <lib-file> elements', function () {
            var libfiles = copyArray(valid_libfiles);
            var invalidLibFiles = copyArray(invalid_libfiles);
            var install = PluginHandler.getInstaller('lib-file');

            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should write to correct project files when conditions are specified', function () {
                var xpath = 'SDKReference[@Include="TestSDK1, Version=1.0"][@Condition="\'$(Platform)\'==\'x86\'"]';
                validateInstalledProjects('lib-file', libfiles[0], xpath, ['all']);

                xpath = 'SDKReference[@Include="TestSDK2, Version=1.0"]';
                validateInstalledProjects('lib-file', libfiles[1], xpath, ['windows', 'phone', 'windows10']);

                xpath = 'SDKReference[@Include="TestSDK3, Version=1.0"]';
                validateInstalledProjects('lib-file', libfiles[2], xpath, ['phone']);

                xpath = 'SDKReference[@Include="TestSDK4, Version=1.0"]';
                validateInstalledProjects('lib-file', libfiles[3], xpath, ['windows8']);
            });

            it('should throw if conditions are invalid', function () {
                expect(function () {
                    install(invalidLibFiles[0], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid arch attribute (must be "x86", "x64" or "ARM"): x85');

                expect(function () {
                    install(invalidLibFiles[1], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid versions attribute (must be a valid semantic version range): 8.0a');

                expect(function () {
                    install(invalidLibFiles[2], faultyPluginInfo, dummyProject);
                }).toThrow('Invalid device-target attribute (must be "all", "phone", "windows" or "win"): daphne');
            });
        });

        describe('of <framework> elements', function () {
            var frameworks = copyArray(valid_frameworks);

            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should write to correct project files when conditions are specified', function () {
                var xpath = 'Reference[@Include="dummy1"][@Condition="\'$(Platform)\'==\'x64\'"]/HintPath';
                validateInstalledProjects('framework', frameworks[0], xpath, ['all']);

                xpath = 'Reference[@Include="dummy2"]/HintPath';
                validateInstalledProjects('framework', frameworks[1], xpath, ['all']);

                xpath = 'Reference[@Include="dummy3"]/HintPath';
                validateInstalledProjects('framework', frameworks[2], xpath, ['windows', 'windows8', 'windows10']);

                xpath = 'Reference[@Include="dummy4"][@Condition="\'$(Platform)\'==\'ARM\'"]/HintPath';
                validateInstalledProjects('framework', frameworks[3], xpath, ['phone']);

                xpath = 'Reference[@Include="dummy5"]/HintPath';
                validateInstalledProjects('framework', frameworks[4], xpath, ['phone']);

                xpath = 'Reference[@Include="dummy6"]/HintPath';
                validateInstalledProjects('framework', frameworks[5], xpath, ['windows', 'windows10', 'phone']);
            });

            it('with .winmd and .dll files', function() {
               var frameworks = copyArray(test_frameworks);
               var install = PluginHandler.getInstaller('framework');
               var uninstall = PluginHandler.getUninstaller('framework');
               var testProject = JsprojManager.getProject(testProjectWindowsPlatformDir);

               frameworks.forEach(function(framework) {
                   install(framework, testPluginInfo, testProject);
                   var dest = path.join('plugins', 'testPlugin', framework.targetDir || '', path.basename(framework.src));
                   if (framework.implementation) {
                       expect(copyFileSpy).toHaveBeenCalledWith(testPlugin, framework.implementation, testProjectWindowsPlatformDir, path.join(path.dirname(dest), path.basename(framework.implementation)));
                   }
               });

               var jsProjFileFromPlatform = path.join(testProjectWindowsPlatformDir, 'CordovaApp.Windows10.jsproj');
               var searchProjects = testProject._projects.filter(function(project) {
                   return path.normalize(project.location) === jsProjFileFromPlatform;
               });

               expect(searchProjects.length).toBe(1);
               var projectXmlTree = searchProjects[0].xml;

               var refHintPaths = projectXmlTree.findall('./ItemGroup/Reference/HintPath');
               var pathsEqual = refHintPaths.every(function(hintPath, index) {
                    return path.basename(hintPath.text) === path.basename(frameworks[index].src);
               });

               expect(pathsEqual).toBeTruthy();

               var refWinMdStatus = projectXmlTree.findall('./ItemGroup/Reference/IsWinMDFile');
               var allReferencesHaveMetadata = refWinMdStatus.every(function(isWinMd) {
                   return isWinMd.text === 'true';
               });

               expect(allReferencesHaveMetadata).toBeTruthy();

               var refImplements = projectXmlTree.findall('./ItemGroup/Reference/Implementation');
               expect(refImplements.length).toBe(1);
               expect(refImplements[0].text).toBe(path.basename(frameworks[1].implementation));

               frameworks.forEach(function(framework) {
                   uninstall(framework, testPluginInfo, testProject);
               });
            });
        });

        describe('of <framework> elements of type \'projectReference\'', function () {
            var frameworks = copyArray(valid_frameworks);

            it('should write to correct project files when conditions are specified', function () {
                var curDir;
                var xpath;

                curDir = __dirname;
                process.chdir(path.join(curDir, '..', 'fixtures', 'testProj'));

                xpath = 'ProjectReference[@Include="' + winJoin('..', '..', 'plugins', 'org.test.plugins.dummyplugin', 'src', 'windows', 'dummy1.vcxproj') + '"][@Condition="\'$(Platform)\'==\'x64\'"]';
                validateInstalledProjects('framework', frameworks[6], xpath, ['all']);

                xpath = 'ProjectReference[@Include="' + winJoin('..', '..', 'plugins', 'org.test.plugins.dummyplugin', 'src', 'windows', 'dummy2.vcxproj') + '"]';
                validateInstalledProjects('framework', frameworks[7], xpath, ['windows8']);

                xpath = 'ProjectReference[@Include="' + winJoin('..', '..', 'plugins', 'org.test.plugins.dummyplugin', 'src', 'windows', 'dummy3.vcxproj') + '"]';
                validateInstalledProjects('framework', frameworks[8], xpath, ['windows', 'windows8', 'windows10']);

                xpath = 'ProjectReference[@Include="' + winJoin('..', '..', 'plugins', 'org.test.plugins.dummyplugin', 'src', 'windows', 'dummy4.vcxproj') + '"]';
                validateInstalledProjects('framework', frameworks[9], xpath, ['windows', 'phone']);

                process.chdir(path.join(curDir, '..', '..', '..'));
            });
        });

        describe('of <js-module> elements', function() {
            var jsModule = {src: 'www/dummyplugin.js'};
            var wwwDest, platformWwwDest;

            var install = PluginHandler.getInstaller('js-module');

            beforeEach(function () {
                spyOn(fs, 'writeFileSync');
                wwwDest = path.resolve(dummyProject.www, 'plugins', dummyPluginInfo.id, jsModule.src);
                platformWwwDest = path.resolve(dummyProject.platformWww, 'plugins', dummyPluginInfo.id, jsModule.src);
            });

            it('should put module to both www and platform_www when options.usePlatformWww flag is specified', function () {
                install(jsModule, dummyPluginInfo, dummyProject, {usePlatformWww: true});
                expect(fs.writeFileSync).toHaveBeenCalledWith(wwwDest, jasmine.any(String), 'utf-8');
                expect(fs.writeFileSync).toHaveBeenCalledWith(platformWwwDest, jasmine.any(String), 'utf-8');
            });

            it('should put module to www only when options.usePlatformWww flag is not specified', function () {
                install(jsModule, dummyPluginInfo, dummyProject);
                expect(fs.writeFileSync).toHaveBeenCalledWith(wwwDest, jasmine.any(String), 'utf-8');
                expect(fs.writeFileSync).not.toHaveBeenCalledWith(platformWwwDest, jasmine.any(String), 'utf-8');
            });
        });

        describe('of <asset> elements', function() {
            var asset = {src: 'www/dummyplugin.js', target: 'foo/dummy.js'};
            var wwwDest, platformWwwDest;
            var install = PluginHandler.getInstaller('asset');

            beforeEach(function () {
                copyFileSpy.reset();
                wwwDest = path.resolve(dummyProject.www, asset.target);
                platformWwwDest = path.resolve(dummyProject.platformWww, asset.target);
            });

            it('should put asset to both www and platform_www when options.usePlatformWww flag is specified', function () {
                install(asset, dummyPluginInfo, dummyProject, {usePlatformWww: true});
                expect(copyFileSpy).toHaveBeenCalledWith(dummyPluginInfo.dir, asset.src, dummyProject.www, asset.target);
                expect(copyFileSpy).toHaveBeenCalledWith(dummyPluginInfo.dir, asset.src, dummyProject.platformWww, asset.target);
            });

            it('should put asset to www only when options.usePlatformWww flag is not specified', function () {
                install(asset, dummyPluginInfo, dummyProject);
                expect(copyFileSpy).toHaveBeenCalledWith(dummyPluginInfo.dir, asset.src, dummyProject.www, asset.target);
                expect(copyFileSpy).not.toHaveBeenCalledWith(dummyPluginInfo.dir, asset.src, dummyProject.platformWww, asset.target);
            });
        });
    });

    describe('uninstallation', function () {
        var removeFileOrig = PluginHandler.__get__('removeFile');
        var removeFileSpy = jasmine.createSpy('removeFile');

        beforeEach(function () {
            PluginHandler.__set__('removeFile', removeFileSpy.andCallFake(removeFileOrig));
        });

        afterEach(function () {
            PluginHandler.__set__('removeFile', removeFileOrig);
        });

        function validateUninstalledProjects(tag, elementToUninstall, xmlPath, incText, targetConditions, supportedPlatforms) {
            jasmine.getEnv().currentSpec.removeAllSpies();

            var projects = copyArray(dummyProject.projects);
            projects.push(dummyProject.master);

            var projectsAddedToSpies = [];
            var projectsNotAddedToSpies = [];

            var projectsAddedTo = [];
            supportedPlatforms.forEach(function (platform) {
                var platformProject = PLATFORM_PROJECTS[platform];
                if (platformProject) {
                    projectsAddedTo.push(PLATFORM_PROJECTS[platform]);
                }
            });

            projects.forEach(function (project) {
                var spy = spyOn(project, 'removeItemGroupElement');
                if (projectsAddedTo.indexOf(path.basename(project.location)) > -1) {
                    projectsAddedToSpies.push(spy);
                } else {
                    projectsNotAddedToSpies.push(spy);
                }
            });

            PluginHandler.getUninstaller(tag)(elementToUninstall, dummyPluginInfo, dummyProject);

            projectsAddedToSpies.forEach(function (spy) {
                expect(spy).toHaveBeenCalledWith(xmlPath, incText, targetConditions);
            });

            projectsNotAddedToSpies.forEach(function (spy) {
                expect(spy).not.toHaveBeenCalled();
            });
        }

        describe('of <source-file> elements', function () {
            var install = PluginHandler.getInstaller('source-file');
            var uninstall = PluginHandler.getUninstaller('source-file');

            it('should remove stuff by calling common.removeFile', function () {
                var source = copyArray(valid_source);
                install(source[0], dummyPluginInfo, dummyProject);
                uninstall(source[0], dummyPluginInfo, dummyProject);
                expect(removeFileSpy).toHaveBeenCalledWith(cordovaProjectWindowsPlatformDir, path.join('plugins', 'org.test.plugins.dummyplugin', 'dummer.js'));
            });
        });

        describe('of <resource-file> elements', function () {
            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            var install = PluginHandler.getInstaller('resource-file');

            it('should remove from correct project files when conditions specified', function () {
                var resourcefiles = copyArray(valid_resourceFiles);

                resourcefiles.forEach(function(resourceFile) {
                    install(resourceFile, dummyPluginInfo, dummyProject);
                });
                var path = 'ItemGroup/Content';
                var incText = resourcefiles[0].target;
                var targetConditions = {versions: undefined, deviceTarget: undefined, arch: 'x86'};
                validateUninstalledProjects('resource-file', resourcefiles[0], path, incText, targetConditions, ['all']);

                incText = resourcefiles[1].target;
                targetConditions = {versions: '>=8.1', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('resource-file', resourcefiles[1], path, incText, targetConditions, ['windows', 'phone', 'windows10']);

                incText = resourcefiles[2].target;
                targetConditions = {versions: undefined, deviceTarget: 'phone', arch: undefined};
                validateUninstalledProjects('resource-file', resourcefiles[2], path, incText, targetConditions, ['phone']);

                incText = resourcefiles[3].target;
                targetConditions = {versions: '8.0', deviceTarget: 'windows', arch: 'x64'};
                validateUninstalledProjects('resource-file', resourcefiles[3], path, incText, targetConditions, ['windows8']);
            });

            it('should remove from correct project files when conditions specified with reference', function () {
                var resourcereferencefiles = copyArray(valid_resourcereferenceFiles);

                resourcereferencefiles.forEach(function(resourceFile) {
                    install(resourceFile, resourcePluginInfo, dummyProject);
                });
                var path = 'ItemGroup/Content';
                var incText = computeResourcePath(resourcereferencefiles[0]);
                var targetConditions = {versions: undefined, deviceTarget: undefined, arch: 'x86'};
                validateUninstalledProjects('resource-file', resourcereferencefiles[0], path, incText, targetConditions, ['all']);

                incText = computeResourcePath(resourcereferencefiles[1]);
                targetConditions = {versions: '>=8.1', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('resource-file', resourcereferencefiles[1], path, incText, targetConditions, ['windows', 'phone', 'windows10']);

                incText = computeResourcePath(resourcereferencefiles[2]);
                targetConditions = {versions: undefined, deviceTarget: 'phone', arch: undefined};
                validateUninstalledProjects('resource-file', resourcereferencefiles[2], path, incText, targetConditions, ['phone']);

                incText = computeResourcePath(resourcereferencefiles[3]);
                targetConditions = {versions: '8.0', deviceTarget: 'windows', arch: 'x64'};
                validateUninstalledProjects('resource-file', resourcereferencefiles[3], path, incText, targetConditions, ['windows8']);
            });
        });

        describe('of <lib-file> elements', function () {
            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should remove from correct project files when conditions specified', function () {
                var libfiles = copyArray(valid_libfiles);

                libfiles.forEach(function(libfile) {
                    PluginHandler.getInstaller('lib-file')(libfile, dummyPluginInfo, dummyProject);
                });

                var path = 'ItemGroup/SDKReference';
                var incText = 'TestSDK1, Version=1.0';
                var targetConditions = {versions: undefined, deviceTarget: undefined, arch: 'x86'};
                validateUninstalledProjects('lib-file', libfiles[0], path, incText, targetConditions, ['all']);

                incText = 'TestSDK2, Version=1.0';
                targetConditions = {versions: '>=8.1', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('lib-file', libfiles[1], path, incText, targetConditions, ['windows', 'phone', 'windows10']);

                incText = 'TestSDK3, Version=1.0';
                targetConditions = {versions: undefined, deviceTarget: 'phone', arch: undefined};
                validateUninstalledProjects('lib-file', libfiles[2], path, incText, targetConditions, ['phone']);

                incText = 'TestSDK4, Version=1.0';
                targetConditions = {versions: '8.0', deviceTarget: 'windows', arch: 'x86'};
                validateUninstalledProjects('lib-file', libfiles[3], path, incText, targetConditions, ['windows8']);
            });
        });

       describe('of <framework> elements', function () {
            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should remove from correct project files when conditions specified', function () {
                var curDir;
                curDir = __dirname;
                process.chdir(path.join(curDir, '..', 'fixtures', 'testProj'));

                var frameworks = copyArray(valid_frameworks);

                frameworks.forEach(function(framework) {
                    PluginHandler.getInstaller('framework')(framework, dummyPluginInfo, dummyProject);
                });


                var path2 = 'ItemGroup/Reference';
                var incText = 'dummy1';
                var targetConditions = {versions: undefined, deviceTarget: undefined, arch: 'x64'};
                validateUninstalledProjects('framework', frameworks[0], path2, incText, targetConditions, ['all']);

                incText = 'dummy2';
                targetConditions = {versions: '>=8.0', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('framework', frameworks[1], path2, incText, targetConditions, ['all']);

                incText = 'dummy3';
                targetConditions = {versions: undefined, deviceTarget: 'windows', arch: undefined};
                validateUninstalledProjects('framework', frameworks[2], path2, incText, targetConditions, ['windows', 'windows8', 'windows10']);

                incText = 'dummy4';
                targetConditions = {versions: '8.1', deviceTarget: 'phone', arch: 'ARM'};
                validateUninstalledProjects('framework', frameworks[3], path2, incText, targetConditions, ['phone']);

                incText = 'dummy5';
                targetConditions = {versions: undefined, deviceTarget: 'phone', arch: undefined};
                validateUninstalledProjects('framework', frameworks[4], path2, incText, targetConditions, ['phone']);

                incText = 'dummy6';
                targetConditions = {versions: '>=8.1', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('framework', frameworks[5], path2, incText, targetConditions, ['windows', 'windows10', 'phone']);

                process.chdir(path.join(curDir, '..', '..', '..'));
            });
        });

        describe('of <framework> elements of type \'projectReference\'', function () {
            // This could be separated into individual specs, but that results in a lot of copying and deleting the
            // project files, which is not needed.
            it('should remove from correct project files when conditions specified', function () {
                var curDir;
                curDir = __dirname;
                process.chdir(path.join(curDir, '..', 'fixtures', 'testProj'));

                var frameworks = copyArray(valid_frameworks);

                frameworks.forEach(function(framework) {
                    PluginHandler.getInstaller('framework')(framework, dummyPluginInfo, dummyProject);
                });

                var xmlPath = 'ItemGroup/ProjectReference';
                var incText = winJoin('..', '..', 'plugins', dummyPluginInfo.id, frameworks[6].src);
                var targetConditions = {versions: undefined, deviceTarget: undefined, arch: 'x64'};
                validateUninstalledProjects('framework', frameworks[6], xmlPath, incText, targetConditions, ['all']);

                incText = winJoin('..', '..', 'plugins', dummyPluginInfo.id, frameworks[7].src);
                targetConditions = {versions: '<8.1', deviceTarget: undefined, arch: undefined};
                validateUninstalledProjects('framework', frameworks[7], xmlPath, incText, targetConditions, ['windows8']);

                incText = winJoin('..', '..', 'plugins', dummyPluginInfo.id, frameworks[8].src);
                targetConditions = {versions: undefined, deviceTarget: 'win', arch: undefined};
                validateUninstalledProjects('framework', frameworks[8], xmlPath, incText, targetConditions, ['windows', 'windows8', 'windows10']);

                incText = winJoin('..', '..', 'plugins', dummyPluginInfo.id, frameworks[9].src);
                targetConditions = {versions: '8.1', deviceTarget: 'all', arch: 'x86'};
                validateUninstalledProjects('framework', frameworks[9], xmlPath, incText, targetConditions, ['windows', 'phone']);

                process.chdir(path.join(curDir, '..', '..', '..'));
            });
        });

        describe('of <js-module> elements', function() {
            var jsModule = {src: 'www/dummyPlugin.js'};
            var wwwDest, platformWwwDest;

            var uninstall = PluginHandler.getUninstaller('js-module');

            beforeEach(function () {
                wwwDest = path.resolve(dummyProject.www, 'plugins', dummyPluginInfo.id, jsModule.src);
                platformWwwDest = path.resolve(dummyProject.platformWww, 'plugins', dummyPluginInfo.id, jsModule.src);

                spyOn(shell, 'rm');

                var existsSyncOrig = fs.existsSync;
                spyOn(fs, 'existsSync').andCallFake(function (file) {
                    if ([wwwDest, platformWwwDest].indexOf(file) >= 0 ) return true;
                    return existsSyncOrig.call(fs, file);
                });
            });

            it('should put module to both www and platform_www when options.usePlatformWww flag is specified', function () {
                uninstall(jsModule, dummyPluginInfo, dummyProject, {usePlatformWww: true});
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), wwwDest);
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), platformWwwDest);
            });

            it('should put module to www only when options.usePlatformWww flag is not specified', function () {
                uninstall(jsModule, dummyPluginInfo, dummyProject);
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), wwwDest);
                expect(shell.rm).not.toHaveBeenCalledWith(jasmine.any(String), platformWwwDest);
            });
        });

        describe('of <asset> elements', function() {
            var asset = {src: 'www/dummyPlugin.js', target: 'foo/dummy.js'};
            var wwwDest, platformWwwDest;
            var uninstall = PluginHandler.getUninstaller('asset');

            beforeEach(function () {
                wwwDest = path.resolve(dummyProject.www, asset.target);
                platformWwwDest = path.resolve(dummyProject.platformWww, asset.target);

                spyOn(shell, 'rm');

                var existsSyncOrig = fs.existsSync;
                spyOn(fs, 'existsSync').andCallFake(function (file) {
                    if ([wwwDest, platformWwwDest].indexOf(file) >= 0 ) return true;
                    return existsSyncOrig.call(fs, file);
                });
            });

            it('should put module to both www and platform_www when options.usePlatformWww flag is specified', function () {
                uninstall(asset, dummyPluginInfo, dummyProject, {usePlatformWww: true});
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), wwwDest);
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), platformWwwDest);
            });

            it('should put module to www only when options.usePlatformWww flag is not specified', function () {
                uninstall(asset, dummyPluginInfo, dummyProject);
                expect(shell.rm).toHaveBeenCalledWith(jasmine.any(String), wwwDest);
                expect(shell.rm).not.toHaveBeenCalledWith(jasmine.any(String), platformWwwDest);
            });
        });
    });
});
