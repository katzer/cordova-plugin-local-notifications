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

var rewire     = require('rewire'),
    deployment = rewire('../../template/cordova/lib/deployment'),
    Q          = require('q'),
    path       = require('path'),
    AppDeployCmdTool = deployment.__get__('AppDeployCmdTool'),
    WinAppDeployCmdTool = deployment.__get__('WinAppDeployCmdTool');

var TEST_APP_PACKAGE_NAME = '"c:\\testapppackage.appx"',
    TEST_APP_PACKAGE_ID   = '12121212-3434-3434-3434-567856785678';

describe('The correct version of the app deployment tool is obtained.', function() {

    var mockedProgramFiles = process.env['ProgramFiles(x86)'];

    beforeEach(function() {
        process.env['ProgramFiles(x86)'] = path.join('c:/Program Files (x86)');
    });

    afterEach(function() {
        if (mockedProgramFiles) {
            process.env['ProgramFiles(x86)'] = mockedProgramFiles;
        } else {
            delete process.env['ProgramFiles(x86)'];
        }
    });

    it('Provides an AppDeployCmdTool when 8.1 is requested.', function() {

        var tool = deployment.getDeploymentTool('8.1');
        expect(tool instanceof AppDeployCmdTool).toBe(true);

    });

    it('Provides a WinAppDeployCmdTool when 10.0 is requested.', function() {

        var tool = deployment.getDeploymentTool('10.0');
        expect(tool instanceof WinAppDeployCmdTool).toBe(true);

    });
});

describe('Windows 10 deployment interacts with the file system as expected.', function() {

    function fakeSpawn(cmd, args, cwd) {
        expect(cmd).toBe(path.join('c:/Program Files (x86)/Windows Kits/10/bin/x86/WinAppDeployCmd.exe'));
        switch (args[0]) {
            case 'devices':
                var output = 'Windows App Deployment Tool\r\nVersion 10.0.0.0\r\nCopyright (c) Microsoft Corporation. All rights reserved.\r\n\r\nDiscovering devices...\r\nIP Address      GUID                                    Model/Name\r\n127.0.0.1   00000015-b21e-0da9-0000-000000000000    Lumia 1520 (RM-940)\r\n10.120.70.172   00000000-0000-0000-0000-00155d619532    00155D619532\r\n10.120.68.150   00000000-0000-0000-0000-00155d011765    00155D011765\r\nDone.';
                return Q(output);

            case 'update':
            case 'install':
                expect(args[2]).toBe(TEST_APP_PACKAGE_NAME);
                expect(args[4]).toBe('127.0.0.1');
                return Q('');

            case 'uninstall':
                expect(args[2]).toBe(TEST_APP_PACKAGE_ID);
                expect(args[4]).toBe('10.120.68.150');
                return Q('');

        }
    }

    var mockedSpawn = deployment.__get__('spawn');
    var mockedProgramFiles = process.env['ProgramFiles(x86)'];

    beforeEach(function() {
        deployment.__set__('spawn', fakeSpawn);
        process.env['ProgramFiles(x86)'] = path.join('c:/Program Files (x86)');
    });

    afterEach(function() {
        deployment.__set__('spawn', mockedSpawn);
        if (mockedProgramFiles) {
            process.env['ProgramFiles(x86)'] = mockedProgramFiles;
        } else {
            delete process.env['ProgramFiles(x86)'];
        }
    });

    it('enumerateDevices returns a valid set of objects', function() {
        var deploymentTool = deployment.getDeploymentTool('10.0');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {

            expect(deviceList.length).toBe(3);
            expect(deviceList[0].name).toBe('Lumia 1520 (RM-940)');
            expect(deviceList[0].index).toBe(0);
            expect(deviceList[0].type).toBe('device');

            done = true;

        });

        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters', function() {
        var deploymentTool = deployment.getDeploymentTool('10.0');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ false, /*shouldUpdate*/ false).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });

        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters when updating', function() {
        var deploymentTool = deployment.getDeploymentTool('10.0');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ false, /*shouldUpdate*/ true).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });

        waitsFor(function() { return done; });
    });

    it('uninstallAppPackage passes the correct set of parameters', function() {
        var deploymentTool = deployment.getDeploymentTool('10.0');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.uninstallAppPackage(TEST_APP_PACKAGE_ID, deviceList[2]).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });

        waitsFor(function() { return done; });
    });
});

describe('Windows 8.1 deployment interacts with the file system as expected.', function() {

    function fakeSpawn(cmd, args, cwd) {
        expect(cmd).toBe(path.join('c:/Program Files (x86)/Microsoft SDKs/Windows Phone/v8.1/Tools/AppDeploy/AppDeployCmd.exe'));
        switch (args[0]) {
            case '/EnumerateDevices':
                var output = '\r\nDevice Index    Device Name\r\n------------    -------------------------------\r\n 0              Device\r\n 1              Mobile Emulator 10.0.10150.0 WVGA 4 inch 512MB\r\n 2              Mobile Emulator 10.0.10150.0 WVGA 4 inch 1GB\r\n 3              Mobile Emulator 10.0.10150.0 WXGA 4.5 inch 1GB\r\n 4              Mobile Emulator 10.0.10150.0 720p 5 inch 1GB\r\n 5              Mobile Emulator 10.0.10150.0 1080p 6 inch 2GB\r\n 6              Emulator 8.1 WVGA 4 inch 512MB\r\n 7              Emulator 8.1 WVGA 4 inch\r\n 8              Emulator 8.1 WXGA 4.5 inch\r\n 9              Emulator 8.1 720P 4.7 inch\r\n 10             Emulator 8.1 1080P 5.5 inch\r\n 11             Emulator 8.1 1080P 6 inch\r\nDone.\r\n';
                return Q(output);

            case '/update':
            case '/install':
            case '/updatelaunch':
            case '/installlaunch':
                expect(args[1]).toBe(TEST_APP_PACKAGE_NAME);
                expect(args[2]).toBe('/targetdevice:de');
                return Q('');

            case '/uninstall':
                expect(args[1]).toBe(TEST_APP_PACKAGE_ID);
                expect(args[2]).toBe('/targetdevice:5');
                return Q('');

            default:
                throw new Error('Unrecognized AppDeployCmd parameter "' + args[0] + '"');

        }
    }

    var mockedSpawn = deployment.__get__('spawn');
    var mockedProgramFiles = process.env['ProgramFiles(x86)'];

    beforeEach(function() {
        deployment.__set__('spawn', fakeSpawn);
        process.env['ProgramFiles(x86)'] = path.join('c:/Program Files (x86)');
    });

    afterEach(function() {
        deployment.__set__('spawn', mockedSpawn);
        if (mockedProgramFiles) {
            process.env['ProgramFiles(x86)'] = mockedProgramFiles;
        } else {
            delete process.env['ProgramFiles(x86)'];
        }
    });

    it('enumerateDevices returns a valid set of objects', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {

            expect(deviceList.length).toBe(12);
            expect(deviceList[0].name).toBe('Device');
            expect(deviceList[0].index).toBe(0);
            expect(deviceList[0].type).toBe('device');

            expect(deviceList[5].name).toBe('Mobile Emulator 10.0.10150.0 1080p 6 inch 2GB');
            expect(deviceList[5].index).toBe(5);
            expect(deviceList[5].type).toBe('emulator');

            done = true;

        });
        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ false, /*shouldUpdate*/ false).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });
        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters when updating', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ false, /*shouldUpdate*/ true).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });
        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters when launching', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ true, /*shouldUpdate*/ false).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });
        waitsFor(function() { return done; });
    });

    it('installAppPackage passes the correct set of parameters when updating and launching', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.installAppPackage(TEST_APP_PACKAGE_NAME, deviceList[0], /*shouldLaunch*/ true, /*shouldUpdate*/ true).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });
        waitsFor(function() { return done; });
    });

    it('uninstallAppPackage passes the correct set of parameters', function() {
        var deploymentTool = deployment.getDeploymentTool('8.1');
        var done = false;
        deploymentTool.enumerateDevices().then(function(deviceList) {
            deploymentTool.uninstallAppPackage(TEST_APP_PACKAGE_ID, deviceList[5]).then(function() {

                // expect() calls are in the fakeSpawn function
                done = true;

            });
        });
        waitsFor(function() { return done; });
    });
});
