/*
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
var util = require('util');
var fs = require('fs');
var CordovaError = require('cordova-common').CordovaError;

var PROJECT_NAME = 'testProj';
var Podfile = require(path.resolve(path.join(__dirname, '..', '..', '..', 'bin', 'templates', 'scripts', 'cordova', 'lib', 'Podfile.js'))).Podfile;
var fixturePodfile = path.resolve(__dirname, 'fixtures', PROJECT_NAME, 'platforms', 'ios', 'Podfile');
var fixturePodXcconfigDebug = path.resolve(__dirname, 'fixtures', PROJECT_NAME, 'platforms', 'ios', 'pods-debug.xcconfig');
var fixturePodXcconfigRelease = path.resolve(__dirname, 'fixtures', PROJECT_NAME, 'platforms', 'ios', 'pods-release.xcconfig');

// tests are nested in a describe to ensure clean up happens after all unit tests are run
describe('unit tests for Podfile module', function () {
    var podfile = new Podfile(fixturePodfile, PROJECT_NAME);

    describe('tests', function () {

        it('Test 001 : throws CordovaError when the path filename is not named Podfile', function () {
            var dummyPath = 'NotAPodfile';
            expect(function () {
                new Podfile(dummyPath); /* eslint no-new : 0 */
            }).toThrow(new CordovaError(util.format('Podfile: The file at %s is not `%s`.', dummyPath, Podfile.FILENAME)));
        });

        it('Test 002 : throws CordovaError when no projectName provided when creating a Podfile', function () {
            expect(function () {
                new Podfile(fixturePodfile); /* eslint no-new : 0 */
            }).toThrow(new CordovaError('Podfile: The projectName was not specified in the constructor.'));
        });

        it('Test 003 : throws CordovaError when no pod name provided when adding a spec', function () {
            expect(function () {
                podfile.addSpec(null);
            }).toThrow(new CordovaError('Podfile addSpec: name is not specified.'));
        });

        it('Test 004 : adds the spec', function () {
            expect(podfile.existsSpec('Foo')).toBe(false);
            podfile.addSpec('Foo', '1.0');
            expect(podfile.existsSpec('Foo')).toBe(true);
        });

        it('Test 005 : removes the spec', function () {
            podfile.addSpec('Baz', '3.0');
            expect(podfile.existsSpec('Baz')).toBe(true);
            podfile.removeSpec('Baz');
            expect(podfile.existsSpec('Baz')).toBe(false);
        });

        it('Test 006 : clears all specs', function () {
            podfile.addSpec('Bar', '2.0');
            podfile.clear();

            expect(podfile.existsSpec('Foo')).toBe(false);
            expect(podfile.existsSpec('Bar')).toBe(false);
        });

        it('Test 007 : isDirty tests', function () {
            podfile.addSpec('Foo', '1.0');
            expect(podfile.isDirty()).toBe(true);

            podfile.write();
            expect(podfile.isDirty()).toBe(false);

            podfile.removeSpec('Foo');
            expect(podfile.isDirty()).toBe(true);

            podfile.clear();
            expect(podfile.isDirty()).toBe(true);

            podfile.write();
            expect(podfile.isDirty()).toBe(false);
        });

        it('Test 008 : writes specs to the Podfile', function () {
            podfile.clear();

            podfile.addSpec('Foo', '1.0');
            podfile.addSpec('Bar', '2.0');
            podfile.addSpec('Baz', '3.0');
            podfile.addSpec('Foo-Baz', '4.0');
            podfile.addSpec('Foo~Baz@!%@!%!', '5.0');
            podfile.addSpec('Bla', ':configurations => [\'Debug\', \'Beta\']');

            podfile.write();

            // verify by reading it back in a new Podfile
            var newPodfile = new Podfile(fixturePodfile, PROJECT_NAME + '2');
            expect(newPodfile.existsSpec('Foo')).toBe(true);
            expect(newPodfile.existsSpec('Bar')).toBe(true);
            expect(newPodfile.existsSpec('Baz')).toBe(true);
            expect(newPodfile.existsSpec('Foo-Baz')).toBe(true);
            expect(newPodfile.existsSpec('Foo~Baz@!%@!%!')).toBe(true);
            expect(newPodfile.existsSpec('Bla')).toBe(true);

            expect(newPodfile.getSpec('Foo')).toBe(podfile.getSpec('Foo'));
            expect(newPodfile.getSpec('Bar')).toBe(podfile.getSpec('Bar'));
            expect(newPodfile.getSpec('Baz')).toBe(podfile.getSpec('Baz'));
            expect(newPodfile.getSpec('Foo-Baz')).toBe(podfile.getSpec('Foo-Baz'));
            expect(newPodfile.getSpec('Foo~Baz@!%@!%!')).toBe(podfile.getSpec('Foo~Baz@!%@!%!'));
            expect(newPodfile.getSpec('Bla')).toBe(podfile.getSpec('Bla'));
        });

        it('Test 009 : runs before_install to install xcconfig paths', function () {
            podfile.before_install();

            // Template tokens in order: project name, project name, debug | release
            var template =
            '// DO NOT MODIFY -- auto-generated by Apache Cordova\n' +
            '#include "Pods/Target Support Files/Pods-%s/Pods-%s.%s.xcconfig"';

            var expectedDebugContents = util.format(template, PROJECT_NAME, PROJECT_NAME, 'debug');
            var expectedReleaseContents = util.format(template, PROJECT_NAME, PROJECT_NAME, 'release');

            var actualDebugContents = fs.readFileSync(fixturePodXcconfigDebug, 'utf8');
            var actualReleaseContents = fs.readFileSync(fixturePodXcconfigRelease, 'utf8');

            expect(actualDebugContents).toBe(expectedDebugContents);
            expect(actualReleaseContents).toBe(expectedReleaseContents);
        });

        it('Test 010 : escapes single quotes in project name when writing a Podfile', function () {
            podfile.before_install();

            var projectName = 'This project\'s name';

            var expectedProjectName = 'This project\\\'s name';
            var actualProjectName = podfile.escapeSingleQuotes(projectName);

            expect(actualProjectName).toBe(expectedProjectName);
        });

    });

    it('Test 011 : tear down', function () {
        podfile.destroy();

        var text = '// DO NOT MODIFY -- auto-generated by Apache Cordova\n';

        fs.writeFileSync(fixturePodXcconfigDebug, text, 'utf8');
        fs.writeFileSync(fixturePodXcconfigRelease, text, 'utf8');
    });
});
