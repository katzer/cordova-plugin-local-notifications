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
var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    rewire = require('rewire'),
    platformRoot = '../../template',
    testPath = 'testpath',
    buildPath = path.join(platformRoot, 'cordova', 'build'),
    prepare = require(platformRoot + '/cordova/lib/prepare.js'),
    build = rewire(platformRoot + '/cordova/lib/build.js');

var utils = require(platformRoot + '/cordova/lib/utils');
var package = require(platformRoot + '/cordova/lib/package');
var AppxManifest = require(platformRoot + '/cordova/lib/AppxManifest');
var MSBuildTools = require(platformRoot + '/cordova/lib/MSBuildTools');

function createFindAvailableVersionMock(version, path, buildSpy) {
    build.__set__('MSBuildTools.findAvailableVersion', function() {
        return Q.resolve({
            version: version,
            path: path,
            buildProject: function (solutionFile, buildType, buildArch) {
                if (typeof buildSpy === 'function') {
                    buildSpy(solutionFile, buildType, buildArch);
                }
                return Q.reject(); // rejecting here to stop build process
            }
        });
    });
}

function createFindAllAvailableVersionsMock(versionSet) {
    build.__set__('MSBuildTools.findAllAvailableVersions', function() {
        return Q.resolve(versionSet);
    });
}

function createConfigParserMock(winVersion, phoneVersion) {
    build.__set__('ConfigParser', function() {
        return {
            getPreference: function(prefName) {
                switch (prefName) {
                    case 'windows-target-version':
                        return winVersion;
                    case 'windows-phone-target-version':
                        return phoneVersion;
                }
            },
            getWindowsTargetVersion: function() {
                return winVersion;
            },
            getWindowsPhoneTargetVersion: function() {
                return phoneVersion;
            }
        };
    });
}

describe('run method', function() {
    var findAvailableVersionOriginal,
        findAllAvailableVersionsOriginal,
        configParserOriginal;

    beforeEach(function () {
        findAvailableVersionOriginal = build.__get__('MSBuildTools.findAvailableVersion');
        findAllAvailableVersionsOriginal = build.__get__('MSBuildTools.findAllAvailableVersions');
        configParserOriginal = build.__get__('ConfigParser');

        var originalBuildMethod = build.run;
        spyOn(build, 'run').andCallFake(function () {
            // Bind original build to custom 'this' object to mock platform's locations property
            return originalBuildMethod.apply({locations: {www: 'some/path'}}, arguments);
        });

        spyOn(utils, 'isCordovaProject').andReturn(true);
        spyOn(prepare, 'applyPlatformConfig');
        spyOn(prepare, 'updateBuildConfig');
        spyOn(package, 'getPackage').andReturn(Q({}));

        spyOn(AppxManifest, 'get').andReturn({
            getIdentity: function () {
                return  { setPublisher: function () {} };
            },
            write: function () {}
        });
    });

    afterEach(function() {
        build.__set__('MSBuildTools.findAvailableVersion', findAvailableVersionOriginal);
        build.__set__('MSBuildTools.findAllAvailableVersions', findAllAvailableVersionsOriginal);
        build.__set__('ConfigParser', configParserOriginal);
    });

    it('spec.1 should reject if not launched from project directory', function(done) {
        var rejectSpy = jasmine.createSpy(),
            buildSpy = jasmine.createSpy();

        // utils.isCordovaProject is a spy, so we can call andReturn directly on it
        utils.isCordovaProject.andReturn(false);
        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);

        build.run([ 'node', buildPath, '--release', '--debug' ])
        .fail(rejectSpy)
        .finally(function() {
            expect(rejectSpy).toHaveBeenCalled();
            expect(buildSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('spec.2 should throw if both debug and release args specified', function() {
        var buildSpy = jasmine.createSpy();

        createFindAvailableVersionMock('14.0', testPath, buildSpy);

        expect(function () {
            build.run({release: true, debug: true});
        }).toThrow();
    });

    it('spec.3 should throw if both phone and win args specified', function() {
        var buildSpy = jasmine.createSpy();

        createFindAvailableVersionMock('14.0', testPath, buildSpy);

        expect(function () {
            build.run({argv: [ '--phone', '--win' ]});
        }).toThrow();
    });

    it('should respect build configuration from \'buildConfig\' option', function (done) {

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: jasmine.createSpy(), path: testPath }]);
        var buildConfigPath = path.resolve(__dirname, 'fixtures/fakeBuildConfig.json');

        build.run({ buildConfig: buildConfigPath })
        .finally(function() {
            expect(prepare.updateBuildConfig).toHaveBeenCalled();

            var buildOpts = prepare.updateBuildConfig.calls[0].args[0];
            var buildConfig = require(buildConfigPath).windows.debug;

            expect(buildOpts.packageCertificateKeyFile).toBeDefined();
            expect(buildOpts.packageCertificateKeyFile)
                .toEqual(path.resolve(path.dirname(buildConfigPath), buildConfig.packageCertificateKeyFile));

            ['packageThumbprint', 'publisherId'].forEach(function (key) {
                expect(buildOpts[key]).toBeDefined();
                expect(buildOpts[key]).toEqual(buildConfig[key]);
            });

            done();
        });
    });

    it('spec.4 should call buildProject of MSBuildTools with buildType = "release" if called with --release argument', function(done) {
        var buildSpy = jasmine.createSpy().andCallFake(function (solutionFile, buildType, buildArch) {
            expect(buildType).toBe('release');
        });

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);

        build.run({ release: true })
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.5 should call buildProject of MSBuildTools with buildType = "debug" if called without arguments', function(done) {
        var buildSpy = jasmine.createSpy().andCallFake(function (solutionFile, buildType, buildArch) {
            expect(buildType).toBe('debug');
        });

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);

        build.run([ 'node', buildPath ])
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.6 should call buildProject of MSBuildTools with buildArch = "arm" if called with --archs="arm" argument', function(done) {
        var buildSpy = jasmine.createSpy().andCallFake(function (solutionFile, buildType, buildArch) {
            expect(buildArch).toBe('arm');
        });

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);

        build.run({ archs: 'arm' })
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.7 should call buildProject of MSBuildTools once for all architectures if called with --archs="arm x86 x64 anycpu" argument', function(done) {
        var armBuild = jasmine.createSpy(),
            x86Build = jasmine.createSpy(),
            x64Build = jasmine.createSpy(),
            anyCpuBuild = jasmine.createSpy();

        createFindAllAvailableVersionsMock([
            {
                version: '14.0',
                path: testPath,
                buildProject: function(solutionFile, buildType, buildArch) {
                    expect(buildArch).toMatch(/^arm$|^any\s?cpu$|^x86$|^x64$/);
                    switch (buildArch) {
                        case 'arm':
                            armBuild();
                            return Q();
                        case 'x86':
                            x86Build();
                            return Q();
                        case 'anycpu':
                        case 'any cpu':
                            anyCpuBuild();
                            return Q();
                        case 'x64':
                            x64Build();
                            return Q();
                        default:
                            return Q.reject();
                    }
                }
             }]);

        build.run({ archs: 'arm x86 x64 anycpu', argv: ['--phone'] })
        .finally(function() {
            expect(armBuild).toHaveBeenCalled();
            expect(x86Build).toHaveBeenCalled();
            expect(x64Build).toHaveBeenCalled();
            expect(anyCpuBuild).toHaveBeenCalled();
            done();
        });
    });

    it('spec.8 should fail buildProject if built with MSBuildTools version 4.0', function(done) {
        var buildSpy = jasmine.createSpy(),
            errorSpy = jasmine.createSpy();

        createFindAllAvailableVersionsMock([{version: '4.0', buildProject: buildSpy, path: testPath }]);
        createConfigParserMock('8.0');

        build.run({argv: ['--win']})
        .fail(function(error) {
            errorSpy();
            expect(error).toBeDefined();
        })
        .finally(function() {
            expect(errorSpy).toHaveBeenCalled();
            expect(buildSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('spec.9 should call buildProject of MSBuildTools if built for windows 8.1', function(done) {
        var buildSpy = jasmine.createSpy();

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);
        createConfigParserMock('8.1');

        build.run({argv: ['--win']})
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.10 should throw an error if windows-target-version has unsupported value', function(done) {
        var buildSpy = jasmine.createSpy(),
            errorSpy = jasmine.createSpy();

        createFindAvailableVersionMock('14.0', testPath, buildSpy);
        createConfigParserMock('unsupported value here');

        build.run({argv: ['--win']})
        .fail(function(error) {
            errorSpy();
            expect(error).toBeDefined();
        })
        .finally(function() {
            expect(errorSpy).toHaveBeenCalled();
            expect(buildSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('spec.11 should call buildProject of MSBuildTools if built for windows phone 8.1', function(done) {
        var buildSpy = jasmine.createSpy();

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);
        createConfigParserMock(null, '8.1');

        build.run({argv: ['--phone']})
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.12 should throw an error if windows-phone-target-version has unsupported value', function(done) {
        var buildSpy = jasmine.createSpy(),
            errorSpy = jasmine.createSpy();

        createFindAvailableVersionMock('14.0', testPath, buildSpy);
        createConfigParserMock(null, 'unsupported value here');

        build.run({argv: ['--phone']})
        .fail(function(error) {
            errorSpy();
            expect(error).toBeDefined();
        })
        .finally(function() {
            expect(errorSpy).toHaveBeenCalled();
            expect(buildSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('spec.13 should be able to override target via --appx parameter', function(done) {
        var buildSpy = jasmine.createSpy().andCallFake(function(solutionFile, buildType, buildArch) {
                // check that we build Windows 10 and not Windows 8.1
                expect(solutionFile.toLowerCase()).toMatch('cordovaapp.windows10.jsproj');
            });

        createFindAllAvailableVersionsMock([{version: '14.0', buildProject: buildSpy, path: testPath }]);
        // provision config to target Windows 8.1
        createConfigParserMock('8.1', '8.1');
        // explicitly specify Windows 10 as target
        build.run({argv: ['--appx=uap']})
        .finally(function() {
            expect(buildSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec.14 should use user-specified msbuild if VSINSTALLDIR variable is set', function (done) {
        var customMSBuildPath = '/some/path';
        var msBuildBinPath = path.join(customMSBuildPath, 'MSBuild/15.0/Bin');
        var customMSBuildVersion = '15.0';
        process.env.VSINSTALLDIR = customMSBuildPath;

        spyOn(MSBuildTools, 'getMSBuildToolsAt')
            .andReturn(Q({
                path: customMSBuildPath,
                version: customMSBuildVersion,
                buildProject: jasmine.createSpy('buildProject').andReturn(Q())
            }));

        var fail = jasmine.createSpy('fail');

        build.run({})
        .fail(fail)
        .finally(function() {
            expect(fail).not.toHaveBeenCalled();
            expect(MSBuildTools.getMSBuildToolsAt).toHaveBeenCalledWith(msBuildBinPath);
            delete process.env.VSINSTALLDIR;
            done();
        });
    });

    it('spec.15 should choose latest version if there are multiple versions available with minor version difference', function(done) {
        var fail = jasmine.createSpy('fail');
        var buildTools14 = {version: '14.0', buildProject: jasmine.createSpy('buildTools14'), path: testPath };
        var buildTools15 = {version: '15.0', buildProject: jasmine.createSpy('buildTools15'), path: testPath };
        var buildTools151 = {version: '15.1', buildProject: jasmine.createSpy('buildTools151'), path: testPath };

        createFindAllAvailableVersionsMock([buildTools14, buildTools15, buildTools151]);
        // explicitly specify Windows 10 as target
        build.run({argv: ['--appx=uap']})
        .fail(fail)
        .finally(function() {
            expect(fail).not.toHaveBeenCalled();
            expect(buildTools151.buildProject).toHaveBeenCalled();
            done();
        });
    });
});

describe('buildFlags', function () {

    describe('parseAndValidateArgs method', function () {
        var parseAndValidateArgs;
        var readFileSync;

        beforeEach(function () {
            parseAndValidateArgs = build.__get__('parseAndValidateArgs');
            readFileSync = spyOn(fs, 'readFileSync');
        });

        it('should handle build flags from both CLI and buildConfig.json', function () {
            readFileSync.andReturn(JSON.stringify({
                windows: { debug: { buildFlag: 'baz="quux"' } }
            }));

            var buildOptions = {
                argv: ['--buildFlag', 'foo=bar', '--buildFlag', 'bar=baz', '--buildConfig', 'buildConfig.json']
            };

            expect(parseAndValidateArgs(buildOptions).buildFlags).toEqual([ 'baz="quux"', 'foo=bar', 'bar=baz' ]);
        });
    });

    describe('build', function () {
        beforeEach(function () {
            spyOn(utils, 'isCordovaProject').andReturn(true);
            spyOn(prepare, 'applyPlatformConfig');
            spyOn(prepare, 'updateBuildConfig');
            spyOn(package, 'getPackage').andReturn(Q({}));

            spyOn(AppxManifest, 'get').andReturn({
                getIdentity: function () {
                    return  { setPublisher: function () {} };
                },
                write: function () {}
            });
        });

        it('should pass buildFlags directly to MSBuild', function(done) {
            var fail = jasmine.createSpy('fail');
            var buildTools = {version: '14.0', buildProject: jasmine.createSpy('buildProject').andReturn(Q()), path: testPath };
            var buildOptions = {
                argv: ['--buildFlag', 'foo=bar']
            };

            createFindAllAvailableVersionsMock([buildTools]);

            build.run(buildOptions)
            .fail(fail)
            .finally(function() {
                expect(fail).not.toHaveBeenCalled();
                // CB-12416 AppxBundle=Never is present because we are not building a bundle
                expect(buildTools.buildProject).toHaveBeenCalledWith(jasmine.any(String),
                    jasmine.any(String), jasmine.any(String), [ 'foo=bar', '/p:AppxBundle=Never' ]);

                done();
            });
        });
    });
});
