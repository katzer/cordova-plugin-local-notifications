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

var Version = require('../../template/cordova/lib/Version.js');

describe('Version constructor', function () {

    it('should behave correctly', function () {
        var v1 = new Version(1);
        expect(v1.major).toBe(1);
        expect(v1.minor).toBe(0);
        expect(v1.build).toBe(0);
        expect(v1.qfe).toBe(0);
        var v2 = new Version(1, 2);
        expect(v2.major).toBe(1);
        expect(v2.minor).toBe(2);
        expect(v2.build).toBe(0);
        expect(v2.qfe).toBe(0);
        var v3 = new Version(1, 2, 4);
        expect(v3.major).toBe(1);
        expect(v3.minor).toBe(2);
        expect(v3.build).toBe(4);
        expect(v3.qfe).toBe(0);
        var v4 = new Version(1, 2, 4, 7);
        expect(v4.major).toBe(1);
        expect(v4.minor).toBe(2);
        expect(v4.build).toBe(4);
        expect(v4.qfe).toBe(7);
    });
});

describe('Version parse functions work as expected.', function() {

    var version = Version.fromString('1.2.4.7');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(2);
    expect(version.build).toBe(4);
    expect(version.qfe).toBe(7);

    it('should parse incomplete version string.', function() {
        var version = Version.fromString('1.5.3');
        expect(version.major).toBe(1);
        expect(version.minor).toBe(5);
        expect(version.build).toBe(3);
        expect(version.qfe).toBe(0);
    });

    it('should produce an error as the version string is invalid', function() {
        try {
            Version.fromString('This is invalid.');

            expect(false).toBe(true);
        }
        catch (ex) {
            expect(ex.constructor).toBe(RangeError);
        }
    });

    it('should produce an error as the string is too long.', function() {
        try {
            Version.fromString('1.5.3.2.7');

            expect(false).toBe(true);
        }
        catch (ex) {
            expect(ex.constructor).toBe(RangeError);
        }
    });

    expect(Version.tryParse('This is invalid')).toBe(false);

});

describe('Version equality functions work as expected.', function() {

    var v1Base = new Version(1, 1, 2, 3);
    // equal to v1Base
    var v1Copy = new Version(1, 1, 2, 3);
    // greater than v1Base by QFE
    var gtV1ByQfe = new Version(1, 1, 2, 4);
    // greater than v1Base by Build
    var gtV1ByBuild = new Version(1, 1, 3, 3);
    // greater than v1Base by Minor
    var gtV1ByMinor = new Version(1, 2, 2, 3);
    // greater than v1Base by Major
    var gtV1ByMajor = new Version(2, 1, 2, 3);

    expect(v1Copy.eq(v1Base)).toBe(true);
    expect(v1Copy.gte(v1Base)).toBe(true);
    expect(v1Copy.gt(v1Base)).toBe(false);

    expect(gtV1ByQfe.eq(v1Base)).toBe(false);
    expect(gtV1ByQfe.gte(v1Base)).toBe(true);
    expect(gtV1ByQfe.gt(v1Base)).toBe(true);

    expect(gtV1ByBuild.eq(v1Base)).toBe(false);
    expect(gtV1ByBuild.gte(v1Base)).toBe(true);
    expect(gtV1ByBuild.gt(v1Base)).toBe(true);

    expect(gtV1ByMinor.eq(v1Base)).toBe(false);
    expect(gtV1ByMinor.gte(v1Base)).toBe(true);
    expect(gtV1ByMinor.gt(v1Base)).toBe(true);

    expect(gtV1ByMajor.eq(v1Base)).toBe(false);
    expect(gtV1ByMajor.gte(v1Base)).toBe(true);
    expect(gtV1ByMajor.gt(v1Base)).toBe(true);
});

describe('Version equality tests integrate with Array sort and toString() as expected.', function() {

    var v1Base = new Version(1, 1, 2, 3);
    // equal to v1Base
    var v1Copy = new Version(1, 1, 2, 3);
    // greater than v1Base by QFE
    var gtV1ByQfe = new Version(1, 1, 2, 4);
    // greater than v1Base by Build
    var gtV1ByBuild = new Version(1, 1, 3, 3);
    // greater than v1Base by Minor
    var gtV1ByMinor = new Version(1, 2, 2, 3);
    // greater than v1Base by Major
    var gtV1ByMajor = new Version(2, 1, 2, 3);

    var toTest = [gtV1ByBuild, gtV1ByMajor, v1Copy, gtV1ByMinor, gtV1ByQfe, v1Base];
    toTest.sort(Version.comparer);

    expect(toTest.join(',')).toBe('1.1.2.3,1.1.2.3,1.1.2.4,1.1.3.3,1.2.2.3,2.1.2.3');
});
