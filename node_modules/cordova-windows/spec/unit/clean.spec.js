var shell                = require('shelljs'),
    path                 = require('path'),
    fs                   = require('fs'),
    prepareModule        = require('../../template/cordova/lib/prepare'),
    DUMMY_PROJECT_PATH   = path.join(__dirname, '/fixtures/DummyProject'),
    iconPath, currentProject;

describe('Cordova clean command', function() {
    beforeEach(function() {
        shell.cp('-rf', DUMMY_PROJECT_PATH, __dirname);
        currentProject = path.join(__dirname, 'DummyProject');
        iconPath = path.join(currentProject, 'images/SplashScreen.scale-100.png');

        var fsExistsSyncOrig = fs.existsSync;
        spyOn(fs, 'existsSync').andCallFake(function (filePath) {
            if (/config\.xml$/.test(filePath)) return true;
            return fsExistsSyncOrig(filePath);
        });
        var fsStatSyncOrig = fs.statSync;
        spyOn(fs, 'statSync').andCallFake(function (filePath) {
            if (/SplashScreen\.scale-100\.png$/.test(filePath)) {
                // Use absolute path:
                return fsStatSyncOrig(iconPath);
            } 

            return fsStatSyncOrig(filePath);
        });
    });

    afterEach(function() {
        shell.rm('-rf', currentProject);
    });

    it('spec 1. should remove icons when ran inside Cordova project', function(done) {
        var config = {
            platform: 'windows',
            root: currentProject,
            locations: {
                root: currentProject,
                configXml: path.join(currentProject, 'config.xml'),
                www: path.join(currentProject, 'www')
            }
        };

        var rejected = jasmine.createSpy().andCallFake(function(err) {
            // Log error:
            expect(err).not.toBeDefined();
        });
        prepareModule.clean.call(config)
        .then(function() {
            expect(fs.existsSync(iconPath)).toBeFalsy();
        }, rejected)
        .finally(function() {
            expect(rejected).not.toHaveBeenCalled();
            done();
        });
    });
});
