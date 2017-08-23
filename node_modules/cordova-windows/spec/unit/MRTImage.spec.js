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

var MRTImage = require('../../template/cordova/lib/MRTImage');

describe('MRTImage class', function () {

    it('should be constructable', function () {
        expect(new MRTImage('some/path/Image.scale-240.png')).toBeDefined();
    });

    it('should detect base name and qualifiers properly', function () {
        expect(new MRTImage('some/path/Image.scale-240.png').basename).toBe('Image');
        expect(new MRTImage('some/path/Basename.with.dots.scale-240.png').basename).toBe('Basename.with.dots');
        expect(new MRTImage('some/path/Basename.with.dots.png').basename).toBe('Basename.with');

        expect(new MRTImage('some/path/Image.png').qualifiers).toBe('scale-100');
        expect(new MRTImage('some/path/Image.scale-240.png').qualifiers).toBe('scale-240');
        expect(new MRTImage('some/path/Image.targetsize-20_altform-unplated.png').qualifiers).toBe('targetsize-20_altform-unplated');
    });

    describe('matchesTo method', function () {
        it('should compare MRTImage instances properly', function () {
            var testImage = new MRTImage('some/path/Basename.scale-240.png');

            expect(new MRTImage('some/path/Basename.png').matchesTo(testImage)).toBe(true);
            expect(new MRTImage('some/path/Basename.scale-240.png').matchesTo(testImage)).toBe(true);
            expect(new MRTImage('some/path/Basename.targetsize-20_scale-240.png').matchesTo(testImage)).toBe(true);

            expect(testImage.matchesTo('')).toBe(false);
            expect(testImage.matchesTo({})).toBe(false);
            expect(testImage.matchesTo(undefined)).toBe(false);

            expect(new MRTImage('some/path/Basename.jpg').matchesTo(testImage)).toBe(false);
            expect(new MRTImage('some/path/Basename.with.dots.scale-240.png').matchesTo(testImage)).toBe(false);
        });
    });

    describe('generateFilenameFrom method', function () {
        it('should use baseName argument to construct new filename', function () {
            var testImage = new MRTImage('some/path/Basename.scale-240.png');

            expect(testImage.generateFilenameFrom('NewName')).toMatch(/^NewName(.*)\.png/);
            expect(testImage.generateFilenameFrom('NewName')).not.toMatch(/Basename/);
        });

        it('should leave qualifiers unchanged', function () {
            var testImage = new MRTImage('some/path/Basename.scale-240.png');

            expect(testImage.generateFilenameFrom('NewName')).toMatch(/\.scale-240\.png$/);
            expect(testImage.generateFilenameFrom('NewName.with.dots-and-dashes')).toMatch(/\.scale-240\.png$/);
        });
    });
});
