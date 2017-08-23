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

var Q = require('q');
var path = require('path');
var rewire = require('rewire');
var binPath = '../../bin';
var et = require('elementtree');
var xml = require('cordova-common').xmlHelpers;
var TEST_XML = '<?xml version="1.0" encoding="UTF-8"?><widget/>';
var ConfigParser = require('../../template/cordova/lib/ConfigParser');
var check_reqs = rewire(path.join(binPath, 'lib/check_reqs.js'));

describe('check_reqs module', function () {

    describe('has Requirement object', function () {
        var Requirement;
        beforeEach(function () {
            Requirement = check_reqs.__get__('Requirement');
        });

        it('that should be constructable', function () {
            var requirement = new Requirement('someId', 'Some Name');
            expect(requirement instanceof Requirement).toBeTruthy();
        });

        it('that should have fields defined', function () {
            var requirement = new Requirement('someId', 'Some Name');
            expect(requirement.id).toBe('someId');
            expect(requirement.name).toBe('Some Name');
            expect(requirement.installed).toBe(false);
            expect(requirement.metadata).toBeDefined();
            expect(requirement.isFatal).toBe(false);
            var fatalReq = new Requirement('someId', 'Some Name', true);
            expect(fatalReq.isFatal).toBe(true);
        });
    });

    describe('has check_all method', function() {
        // var consoleLogOriginal;

        var Requirement,
            originalrequirements, originalcheckFns, originalconfig,
            fakeRequirements, fakeCheckFns, fakeConfig,
            checkSpy;

        beforeEach(function () {
            Requirement = check_reqs.__get__('Requirement');
            originalrequirements = check_reqs.__get__('requirements');
            originalcheckFns = check_reqs.__get__('checkFns');
            originalconfig = check_reqs.__get__('config');

            fakeRequirements = [
                new Requirement('1', 'First requirement'),
                // Mark the second as fatal
                new Requirement('2', 'Second requirement', true),
                new Requirement('3', 'Third requirement')
            ];

            checkSpy = jasmine.createSpy('checkSpy');
            fakeCheckFns = [
                checkSpy.andReturn(Q('1.0')),
                checkSpy.andReturn(Q('2.0')),
                checkSpy.andReturn(Q('3.0'))
            ];
            spyOn(xml, 'parseElementtreeSync').andReturn(new et.ElementTree(et.XML(TEST_XML)));
            fakeConfig = new ConfigParser('/some/file');
        });

        afterEach(function() {
            check_reqs.__set__('requirements', originalrequirements);
            check_reqs.__set__('checkFns', originalcheckFns);
            check_reqs.__set__('config', originalconfig);
        });

        it('that should return a promise, fulfilled with an array of Requirements', function (done) {
            check_reqs.__set__('requirements', fakeRequirements);
            check_reqs.__set__('checkFns', fakeCheckFns);
            check_reqs.__set__('config', fakeConfig);
            var checkResult = check_reqs.check_all();
            expect(Q.isPromise(checkResult)).toBeTruthy();
            checkResult.then(function (result) {
                expect(result instanceof Array).toBeTruthy();
                expect(result.length).toBe(3);
                result.forEach(function (resultItem) {
                    expect(resultItem instanceof Requirement).toBeTruthy();
                    expect(resultItem.installed).toBeTruthy();
                });
                done();
            });
        });

        it('that should not reject if one of requirements is not installed', function  (done) {
            check_reqs.__set__('requirements', fakeRequirements);
            fakeCheckFns[0] = function () { return Q.reject('Error message'); };
            check_reqs.__set__('checkFns', fakeCheckFns);
            check_reqs.__set__('config', fakeConfig);

            check_reqs.check_all()
            .then(function (requirements) {
                expect(requirements.length).toBe(3);
                expect(requirements[0].installed).toBeFalsy();
                done();
            })
            .catch(function  (error) {
                expect(error).not.toBeDefined();
                done();
            });
        });

        it('that should reject if one of checks has internal erorrs', function  (done) {
            check_reqs.__set__('requirements', fakeRequirements);
            fakeCheckFns[0] = checkSpy.andThrow('Fatal error');
            check_reqs.__set__('checkFns', fakeCheckFns);
            check_reqs.__set__('config', fakeConfig);

            check_reqs.check_all()
            .then(function (requirements) {
                expect(requirements).not.toBeDefined();
                done();
            })
            .catch(function  (error) {
                expect(error).toBe('Fatal error');
                done();
            });
        });

        it('that should not run other requirements checks if `fatal` requirement isn\'t installed', function  (done) {
            check_reqs.__set__('requirements', fakeRequirements);
            // The second requirement is fatal, so we're setting up second check to fail
            fakeCheckFns[1] = checkSpy.andReturn(Q.reject('Error message'));
            check_reqs.__set__('checkFns', fakeCheckFns);
            check_reqs.__set__('config', fakeConfig);

            check_reqs.check_all()
            .then(function (requirements) {
                expect(requirements.length).toBe(2);
                expect(requirements[1].isFatal).toBeTruthy();
                expect(checkSpy.calls.length).toBe(2);
                done();
            })
            .catch(function  (error) {
                expect(error).not.toBeDefined();
                done();
            });
        });
    });

});
