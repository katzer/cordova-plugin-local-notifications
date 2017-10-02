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

var path = require('path');
var fs = require('fs');
var PluginManager = require('cordova-common').PluginManager;
var events = require('cordova-common').events;
var Api = require('../../../bin/templates/scripts/cordova/Api');
var check_reqs = require('../../../bin/templates/scripts/cordova/lib/check_reqs');

// The lib/run module pulls in ios-sim, which has a hard requirement that it
// be run on a Mac OS - simply requiring the module is enough to trigger the
// environment checks. These checks will blow up on Windows + Linux.
// So, conditionally pull in the module, and conditionally test the `run`
// method (more below).
var run_mod;
if (process.platform === 'darwin') {
    run_mod = require('../../../bin/templates/scripts/cordova/lib/run');
}

var projectFile = require('../../../bin/templates/scripts/cordova/lib/projectFile');
var Podfile_mod = require('../../../bin/templates/scripts/cordova/lib/Podfile');
var PodsJson_mod = require('../../../bin/templates/scripts/cordova/lib/PodsJson');
var Q = require('q');
var FIXTURES = path.join(__dirname, 'fixtures');
var iosProjectFixture = path.join(FIXTURES, 'ios-config-xml');

describe('Platform Api', function () {

    describe('constructor', function () {
        it('Test 001 : should throw if provided directory does not contain an xcodeproj file', function () {
            expect(function () { new Api('ios', path.join(FIXTURES, '..')); }).toThrow(); /* eslint no-new : 0 */
        });
        it('Test 002 : should create an instance with path, pbxproj, xcodeproj, originalName and cordovaproj properties', function () {
            expect(function () {
                var p = new Api('ios', iosProjectFixture);
                expect(p.locations.root).toEqual(iosProjectFixture);
                expect(p.locations.pbxproj).toEqual(path.join(iosProjectFixture, 'SampleApp.xcodeproj', 'project.pbxproj'));
                expect(p.locations.xcodeProjDir).toEqual(path.join(iosProjectFixture, 'SampleApp.xcodeproj'));
                expect(p.locations.www).toEqual(path.join(iosProjectFixture, 'www'));
                expect(p.locations.configXml).toEqual(path.join(iosProjectFixture, 'SampleApp', 'config.xml'));
            }).not.toThrow();
        });
        it('Test 003 : test cocoapods check_reqs, on darwin (macOS)', function (done) {
            // the purpose of this test is not to actually test whether CocoaPods is installed
            // it is to test check_reqs can run and be covered (we mock the actual checking, simple check)

            check_reqs.check_os()
                .then(function (message) {
                    // supported os
                    function fail () {
                        done.fail('check_reqs fail (' + message + ')');
                    }
                    function success () {
                        done();
                    }
                    var toolsChecker = {
                        success: function () {
                            return Q.resolve('CocoaPods found');
                        },
                        fail: function () {
                            return Q.reject('CocoaPods NOT found');
                        }
                    };

                    // success expected
                    check_reqs.check_cocoapods(toolsChecker.success)
                        .then(success, fail)
                        .catch(fail);

                    // fail expected
                    check_reqs.check_cocoapods(toolsChecker.fail)
                        .then(fail, success)
                        .catch(success);

                }, function () {
                    // unsupported os, do nothing
                    done();
                });
        });
        it('Test 004 : test cocoapods check_reqs, expected success on non-darwin (macOS)', function (done) {
            // the purpose of this test is not to actually test whether CocoaPods is installed
            // it is to test check_reqs can run and be covered (we mock the actual checking, simple check)
            check_reqs.check_os()
                .then(function () {
                    // supported os, do nothing
                    done();
                }, function (message) {
                    // unsupported os, check_reqs should be ignored
                    function fail () {
                        done.fail('check_reqs fail (' + message + ')');
                    }
                    function success (toolOptions) {
                        expect(toolOptions.ignore).toBeDefined();
                        expect(toolOptions.ignoreMessage).toBeDefined();
                        done();
                    }
                    var toolsChecker = function () {
                        done.fail(); // this function should not ever be called if non-darwin
                        return Q.reject('CocoaPods NOT found');
                    };

                    // success expected
                    check_reqs.check_cocoapods(toolsChecker)
                        .then(success, fail)
                        .catch(fail);
                });

        });
    });

    describe('.prototype', function () {
        var api;
        var projectRoot = '/some/path';
        beforeEach(function () {
            spyOn(fs, 'readdirSync').and.returnValue([projectRoot + '/cordova.xcodeproj']);
            spyOn(projectFile, 'parse').and.returnValue({
                getPackageName: function () { return 'ios.cordova.io'; }
            });
            api = new Api('ios', projectRoot);
        });

        // See the comment at the top of this file, in the list of requires,
        // for information on why we conditionall run this test.
        // tl;dr run_mod requires the ios-sim module, which requires mac OS.
        if (process.platform === 'darwin') {
            describe('run', function () {
                beforeEach(function () {
                    spyOn(check_reqs, 'run').and.returnValue(Q.resolve());
                });
                it('should call into lib/run module', function (done) {
                    spyOn(run_mod, 'run');
                    api.run().then(function () {
                        expect(run_mod.run).toHaveBeenCalled();
                    }).fail(function (err) {
                        fail('run fail handler unexpectedly invoked');
                        console.error(err);
                    }).done(done);
                });
            });
        }

        describe('addPlugin', function () {
            var my_plugin = {
                getFrameworks: function () {}
            };
            beforeEach(function () {
                spyOn(PluginManager, 'get').and.returnValue({
                    addPlugin: function () { return Q(); }
                });
                spyOn(Podfile_mod, 'Podfile');
                spyOn(PodsJson_mod, 'PodsJson');
            });
            it('should assign a package name to plugin variables if one is not explicitly provided via options', function () {
                var opts = {};
                api.addPlugin('my cool plugin', opts);
                expect(opts.variables.PACKAGE_NAME).toEqual('ios.cordova.io');
            });
            describe('with frameworks of `podspec` type', function () {
                var podsjson_mock;
                var podfile_mock;
                var my_pod_json = {
                    type: 'podspec',
                    src: 'podsource!',
                    spec: 'podspec!'
                };
                beforeEach(function () {
                    podsjson_mock = jasmine.createSpyObj('podsjson mock', ['get', 'increment', 'write', 'setJson']);
                    podfile_mock = jasmine.createSpyObj('podfile mock', ['isDirty', 'addSpec', 'write', 'install']);
                    spyOn(my_plugin, 'getFrameworks').and.returnValue([my_pod_json]);
                    PodsJson_mod.PodsJson.and.callFake(function () {
                        return podsjson_mock;
                    });
                    Podfile_mod.Podfile.and.callFake(function () {
                        return podfile_mock;
                    });
                });
                // TODO: a little help with clearly labeling / describing the tests below? :(
                it('should warn if Pods JSON contains name/src but differs in spec', function (done) {
                    podsjson_mock.get.and.returnValue({
                        spec: 'something different from ' + my_pod_json.spec
                    });
                    spyOn(events, 'emit');
                    api.addPlugin(my_plugin)
                        .then(function () {
                            expect(events.emit).toHaveBeenCalledWith('warn', jasmine.stringMatching(/which conflicts with another plugin/g));
                        }).fail(function (err) {
                            fail('unexpected addPlugin fail handler invoked');
                            console.error(err);
                        }).done(done);
                });
                it('should increment Pods JSON file if pod name/src already exists in file', function (done) {
                    podsjson_mock.get.and.returnValue({
                        spec: my_pod_json.spec
                    });
                    api.addPlugin(my_plugin)
                        .then(function () {
                            expect(podsjson_mock.increment).toHaveBeenCalledWith('podsource!');
                        }).fail(function (err) {
                            fail('unexpected addPlugin fail handler invoked');
                            console.error(err);
                        }).done(done);
                });
                it('on a new framework/pod name/src/key, it should add a new json to podsjson and add a new spec to podfile', function (done) {
                    api.addPlugin(my_plugin)
                        .then(function () {
                            expect(podsjson_mock.setJson).toHaveBeenCalledWith(my_pod_json.src, jasmine.any(Object));
                            expect(podfile_mock.addSpec).toHaveBeenCalledWith(my_pod_json.src, my_pod_json.spec);
                        }).fail(function (err) {
                            fail('unexpected addPlugin fail handler invoked');
                            console.error(err);
                        }).done(done);
                });
                it('should write out podfile and install if podfile was changed', function (done) {
                    podfile_mock.isDirty.and.returnValue(true);
                    api.addPlugin(my_plugin)
                        .then(function () {
                            expect(podfile_mock.write).toHaveBeenCalled();
                            expect(podfile_mock.install).toHaveBeenCalled();
                        }).fail(function (err) {
                            fail('unexpected addPlugin fail handler invoked');
                            console.error(err);
                        }).done(done);
                });
                it('if two frameworks with the same name are added, should honour the spec of the first-installed plugin', function (done) {
                    spyOn(events, 'emit');
                    podsjson_mock.get.and.returnValue({
                        spec: 'something different from ' + my_pod_json.spec
                    });
                    api.addPlugin(my_plugin)
                        .then(function () {
                            // Increment will non-destructively set the spec to keep it as it was...
                            expect(podsjson_mock.increment).toHaveBeenCalledWith(my_pod_json.src);
                            // ...whereas setJson would overwrite it completely.
                            expect(podsjson_mock.setJson).not.toHaveBeenCalled();
                        }).fail(function (err) {
                            fail('unexpected addPlugin fail handler invoked');
                            console.error(err);
                        }).done(done);
                });
            });
        });
    });
});
