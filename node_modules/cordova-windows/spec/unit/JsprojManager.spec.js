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

var et = require('elementtree');
var shell = require('shelljs');
var rewire = require('rewire');
var xml = require('cordova-common').xmlHelpers;
var AppxManifest = require('../../template/cordova/lib/AppxManifest');
var JsprojManager = rewire('../../template/cordova/lib/JsprojManager');

var PROJECT_PATH = 'spec/unit/fixtures/DummyProject';
var INVALID_PROJECT_PATH = 'spec/unit/fixtures/FakeProject';
var FAKE_MANIFEST = new et.ElementTree(et.XML(
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Package>' +
        '<Properties>' +
            '<DisplayName>HelloCordova</DisplayName>'+
        '</Properties>' +
    '</Package>'));

describe('JsprojManager', function () {

    var project;
    var origProj = JsprojManager.__get__('proj');

    beforeEach(function () {

        JsprojManager.__set__('proj', jasmine.createSpy('proj'));

        spyOn(shell, 'ls').andReturn([PROJECT_PATH + '/CordovaApp.projitems']);
        spyOn(xml, 'parseElementtreeSync').andReturn(FAKE_MANIFEST);
        spyOn(AppxManifest, 'get').andCallThrough();

        project = JsprojManager.getProject(PROJECT_PATH);
    });

    afterEach(function () {
        JsprojManager.__set__('proj', origProj);
    });

    it('should throw if project is not a windows project', function () {
        shell.ls.andCallThrough();
        expect(function () {
            JsprojManager.getProject(INVALID_PROJECT_PATH);
        }).toThrow();
    });

    it('should use AppxManifest class to get package name', function () {
        expect(project.getPackageName()).toBe('HelloCordova');
        expect(AppxManifest.get).toHaveBeenCalled();
        // Should pass 'ignoreCache' option to 'get' method
        expect(AppxManifest.get.calls[0].args[1]).toBe(true);
    });
});
