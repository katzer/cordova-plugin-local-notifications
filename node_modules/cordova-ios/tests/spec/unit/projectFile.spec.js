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

var os = require('os');
var path = require('path');
var shell = require('shelljs');
var projectFile = require('../../../bin/templates/scripts/cordova/lib/projectFile');

var iosProject = path.join(os.tmpdir(), 'plugman/projectFile');
var iosProjectFixture = path.join(__dirname, 'fixtures/ios-config-xml/*');

var locations = {
    root: iosProject,
    pbxproj: path.join(iosProject, 'SampleApp.xcodeproj/project.pbxproj')
};

describe('projectFile', function () {
    beforeEach(function () {
        shell.cp('-rf', iosProjectFixture, iosProject);
    });

    afterEach(function () {
        shell.rm('-rf', iosProject);
    });

    describe('parse method', function () {
        it('Test#001 : should throw if project is not an xcode project', function () {
            shell.rm('-rf', path.join(iosProject, 'SampleApp', 'SampleApp.xcodeproj'));
            expect(function () { projectFile.parse(); }).toThrow();
        });
        it('Test#002 : should throw if project does not contain an appropriate config.xml file', function () {
            shell.rm(path.join(iosProject, 'SampleApp', 'config.xml'));
            expect(function () { projectFile.parse(locations); })
                .toThrow(new Error('Could not find *-Info.plist file, or config.xml file.'));
        });
        it('Test#003 : should throw if project does not contain an appropriate -Info.plist file', function () {
            shell.rm(path.join(iosProject, 'SampleApp', 'SampleApp-Info.plist'));
            expect(function () { projectFile.parse(locations); })
                .toThrow(new Error('Could not find *-Info.plist file, or config.xml file.'));
        });
        it('Test#004 : should return right directory when multiple .plist files are present', function () {
            // Create a folder named A with config.xml and .plist files in it
            var pathToFolderA = path.join(iosProject, 'A');
            shell.mkdir(pathToFolderA);
            shell.cp('-rf', path.join(iosProject, 'SampleApp/*'), pathToFolderA);

            var parsedProjectFile = projectFile.parse(locations);
            var pluginsDir = parsedProjectFile.plugins_dir;
            var resourcesDir = parsedProjectFile.resources_dir;
            var xcodePath = parsedProjectFile.xcode_path;

            var pluginsDirParent = path.dirname(pluginsDir);
            var resourcesDirParent = path.dirname(resourcesDir);
            var sampleAppDir = path.join(iosProject, 'SampleApp');

            expect(pluginsDirParent).toEqual(sampleAppDir);
            expect(resourcesDirParent).toEqual(sampleAppDir);
            expect(xcodePath).toEqual(sampleAppDir);
        });
    });

    describe('other methods', function () {
        it('Test#005 : getPackageName method should return the CFBundleIdentifier from the project\'s Info.plist file', function () {
            expect(projectFile.parse(locations).getPackageName()).toEqual('com.example.friendstring');
        });
    });
});
