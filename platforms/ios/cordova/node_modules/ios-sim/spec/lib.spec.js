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
var lib = require('../src/lib');

describe('lib end-to-end', function() {

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe('when parsing env variables', function() {
        it("should return empty map on null value", function() {
            expect(lib._parseEnvironmentVariables(null)).toEqual({});
        });
        it("should return empty map on undefined value", function() {
            expect(lib._parseEnvironmentVariables(undefined)).toEqual({});
        });
        describe('without simctl fix', function() {
            it("should return valid map for valid env variable", function() {
                expect(lib._parseEnvironmentVariables(["KEY=VALUE"], false)).toEqual({"KEY":"VALUE"});
            });
        });
        describe('with simctl fix', function() {
            it("should add SIMCTL_CHILD_ prefix to all keys", function() {
                expect(lib._parseEnvironmentVariables(["KEY=VALUE", "KEY2=VALUE2"], true))
                .toEqual(
                    {
                        "SIMCTL_CHILD_KEY":"VALUE",
                        "SIMCTL_CHILD_KEY2":"VALUE2"
                    }
                );
            });
        });
    })

    it('init should not process.exit when called as a lib', function() {
        var code = lib.init();
        expect(!isNaN(code)).toBe(true);
    });
});