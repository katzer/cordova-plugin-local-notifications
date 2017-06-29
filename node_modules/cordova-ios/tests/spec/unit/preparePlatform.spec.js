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

/* jshint jasmine: true */

var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var EventEmitter = require('events').EventEmitter;
var ConfigParser = require('cordova-common').ConfigParser;
var PluginInfo = require('cordova-common').PluginInfo;
var ConfigParser = require('cordova-common').ConfigParser;
var Api = require('../../../bin/templates/scripts/cordova/Api');

var FIXTURES = path.join(__dirname, 'fixtures');
var DUMMY_PLUGIN = 'org.test.plugins.dummyplugin';

var iosProjectFixture = path.join(FIXTURES, 'ios-config-xml');
var iosProject = path.join(FIXTURES, 'dummyProj');
var iosPlatform = path.join(iosProject, 'platforms/ios');
var dummyPlugin = path.join(FIXTURES, DUMMY_PLUGIN);

shell.config.silent = true;

describe('prepare after plugin add', function() {
    var api;
    beforeEach(function() {
        shell.mkdir('-p', iosPlatform);
        shell.cp('-rf', iosProjectFixture + '/*', iosPlatform);
        api = new Api('ios', iosPlatform, new EventEmitter());

        jasmine.addMatchers({
            'toBeInstalledIn': function () {
                return {
                    compare: function(actual, expected) {
                        var result = {};
                        var content;
                        try {
                            content = fs.readFileSync(path.join(expected, 'ios.json'));
                            var cfg = JSON.parse(content);
                            result.pass = Object.keys(cfg.installed_plugins).indexOf(actual) > -1;
                        } catch (e) {
                            result.pass = false;
                        }

                        if(result.pass) {
                            result.message = 'Expected '+ actual + ' to be installed in '+ expected+'.';
                        } else {
                            result.message = 'Expected '+ actual + ' to not be installed in '+ expected+'.';
                        }
                        return result;
                    }
                };
            }
        });
    });

    afterEach(function() {
        shell.rm('-rf', iosPlatform);
    });

    it('Test 001 : should not overwrite plugin metadata added by "addPlugin"', function(done) {
        var project = {
            root: iosProject,
            projectConfig: new ConfigParser(path.join(iosProject, 'config.xml')),
            locations: {
                plugins: path.join(iosProject, 'plugins'),
                www: path.join(iosProject, 'www')
            }
        };

        var fail = jasmine.createSpy('fail')
        .and.callFake(function (err) {
            console.error(err);
        });

        api.prepare(project, {})
        .then(function() {
            expect(fs.existsSync(path.join(iosPlatform, 'ios.json'))).toBe(true);
            expect(DUMMY_PLUGIN).not.toBeInstalledIn(iosProject);
            return api.addPlugin(new PluginInfo(dummyPlugin), {});
        })
        .then(function() {
            expect(DUMMY_PLUGIN).toBeInstalledIn(iosPlatform);
            return api.prepare(project, {});
        })
        .then(function() {
            expect(DUMMY_PLUGIN).toBeInstalledIn(iosPlatform);
        })
        .catch(fail)
        .finally(function() {
            expect(fail).not.toHaveBeenCalled();
            done();
        });
    });
});
