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

var rewire = require('rewire');
var et = require('elementtree');
var xml = require('cordova-common').xmlHelpers;
var ConfigParser = require('../../template/cordova/lib/ConfigParser');
var ConfigParserOrig = require('cordova-common').ConfigParser;

var TEST_XML = '<?xml version="1.0" encoding="UTF-8"?><widget/>';

describe('Windows ConfigParser', function () {
    it('should extend ConfigParser from cordova-common', function () {
        expect(ConfigParser.prototype instanceof ConfigParserOrig).toBe(true);
    });
});

/***
 * Unit tests for validating that min/max versions are correctly obtained
 * (for the function getAllMinMaxUAPVersions) from prepare.js.
 **/

describe('getAllMinMaxUAPVersions method', function () {

    var mockConfig;
    beforeEach(function () {
        spyOn(xml, 'parseElementtreeSync').andReturn(new et.ElementTree(et.XML(TEST_XML)));

        mockConfig = new ConfigParser('/some/file');
    });

    it('should correctly transform all versions as a baseline.', function() {
        spyOn(mockConfig, 'getMatchingPreferences').andReturn([
            { name: 'Windows.Universal-MinVersion', value: '10.0.9910.0' },
            { name: 'Windows.Universal-MaxVersionTested', value: '10.0.9917.0' },
            { name: 'Windows.Desktop-MinVersion', value: '10.0.9910.0' },
            { name: 'Microsoft.Xbox-MaxVersionTested', value: '10.0.9917.0' }
        ]);

        var versionSet = mockConfig.getAllMinMaxUAPVersions();
        var ver9910 = '10.0.9910.0';
        var ver9917 = '10.0.9917.0';

        expect(versionSet.length).toBe(3);

        expect(versionSet[0].Name).toBe('Windows.Universal');
        expect(versionSet[0].MinVersion).toBe(ver9910);
        expect(versionSet[0].MaxVersionTested).toBe(ver9917);

        expect(versionSet[1].Name).toBe('Windows.Desktop');
        expect(versionSet[1].MinVersion).toBe(ver9910);
        expect(versionSet[1].MaxVersionTested).toBe(ver9910);

        expect(versionSet[2].Name).toBe('Microsoft.Xbox');
        expect(versionSet[2].MinVersion).toBe(ver9917);
        expect(versionSet[2].MaxVersionTested).toBe(ver9917);
    });

    it('should produce versions correctly even when the config file has no settings.', function() {
        spyOn(mockConfig, 'getMatchingPreferences').andReturn([]);

        var versionSet = mockConfig.getAllMinMaxUAPVersions();
        var verBaseline = rewire('../../template/cordova/lib/ConfigParser')
            .__get__('BASE_UAP_VERSION').toString();

        expect(versionSet.length).toBe(1);
        expect(versionSet[0].Name).toBe('Windows.Universal');
        expect(versionSet[0].MinVersion).toBe(verBaseline);
        expect(versionSet[0].MaxVersionTested).toBe(verBaseline);

    });

    it('should fail with a RangeError if version specified incorrectly', function() {
        spyOn(mockConfig, 'getMatchingPreferences')
        .andReturn([
            { name: 'Windows.Universal-MinVersion', value: '10.0.9910.f' },
            { name: 'Windows.Universal-MaxVersionTested', value: '10.0.9917.0' },
        ]);

        try {
            mockConfig.getAllMinMaxUAPVersions();
            expect(false).toBe(true);
        }
        catch (ex) {
            expect(ex.constructor).toBe(RangeError);
        }
    });
});
