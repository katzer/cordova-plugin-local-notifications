#!/usr/bin/env node

/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements. See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership. The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License. You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied. See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var shell = require('shelljs'),
    Q = require ('q'),
    path = require('path'),
    fs = require('fs'),
    plist = require('plist'),
    xmlescape = require('xml-escape'),
    ROOT = path.join(__dirname, '..', '..'),
    events = require('cordova-common').events;

function updateSubprojectHelp() {
    console.log('Updates the subproject path of the CordovaLib entry to point to this script\'s version of Cordova.');
    console.log('Usage: CordovaVersion/bin/update_cordova_project path/to/your/app.xcodeproj [path/to/CordovaLib.xcodeproj]');
}

function setShellFatal(value, func) {
    var oldVal = shell.config.fatal;
    shell.config.fatal = value;
    func();
    shell.config.fatal = oldVal;
}

function copyJsAndCordovaLib(projectPath, projectName, use_shared) {
    shell.cp('-f', path.join(ROOT, 'CordovaLib', 'cordova.js'), path.join(projectPath, 'www'));
    shell.cp('-rf', path.join(ROOT, 'cordova-js-src'), path.join(projectPath, 'platform_www'));
    shell.cp('-f', path.join(ROOT, 'CordovaLib', 'cordova.js'), path.join(projectPath, 'platform_www'));

    fs.lstat(path.join(projectPath, 'CordovaLib'), function(err, stats) {
        if (!err) {
            if (stats.isSymbolicLink()) {
                fs.unlinkSync(path.join(projectPath, 'CordovaLib'));
            } else {
                shell.rm('-rf', path.join(projectPath, 'CordovaLib'));
            }
        }

        if (use_shared) {
            update_cordova_subproject([path.join(projectPath, projectName +'.xcodeproj', 'project.pbxproj')]);
            // Symlink not used in project file, but is currently required for plugman because
            // it reads the VERSION file from it (instead of using the cordova/version script
            // like it should).
            fs.symlinkSync(path.join(ROOT, 'CordovaLib'), path.join(projectPath, 'CordovaLib'));
        } else {
            var r = path.join(projectPath, projectName);
            shell.mkdir('-p', path.join(projectPath, 'CordovaLib', 'CordovaLib.xcodeproj'));
            shell.cp('-f', path.join(r, '.gitignore'), projectPath);
            shell.cp('-rf',path.join(ROOT, 'CordovaLib', 'Classes'), path.join(projectPath, 'CordovaLib'));
            shell.cp('-f', path.join(ROOT, 'CordovaLib', 'VERSION'), path.join(projectPath, 'CordovaLib'));
            shell.cp('-f', path.join(ROOT, 'CordovaLib', 'cordova.js'), path.join(projectPath, 'CordovaLib'));
            shell.cp('-f', path.join(ROOT, 'CordovaLib', 'CordovaLib_Prefix.pch'), path.join(projectPath, 'CordovaLib'));
            shell.cp('-f', path.join(ROOT, 'CordovaLib', 'CordovaLib.xcodeproj', 'project.pbxproj'), path.join(projectPath, 'CordovaLib', 'CordovaLib.xcodeproj'));
            update_cordova_subproject([path.join(r+'.xcodeproj', 'project.pbxproj'), path.join(projectPath, 'CordovaLib', 'CordovaLib.xcodeproj', 'project.pbxproj')]);
        }
    });
}

function copyScripts(projectPath, projectName) {
    var srcScriptsDir = path.join(ROOT, 'bin', 'templates', 'scripts', 'cordova');
    var destScriptsDir = path.join(projectPath, 'cordova');

    // Delete old scripts directory.
    shell.rm('-rf', destScriptsDir);

    // Copy in the new ones.
    var binDir = path.join(ROOT, 'bin');
    shell.cp('-r', srcScriptsDir, projectPath);
    shell.cp('-r', path.join(ROOT, 'node_modules'), destScriptsDir);

    // Copy the check_reqs script
    shell.cp(path.join(binDir, 'check_reqs*'), destScriptsDir);
    shell.cp(path.join(binDir, 'lib', 'check_reqs.js'), path.join(destScriptsDir, 'lib'));

    // Copy the version scripts
    shell.cp(path.join(binDir, 'apple_ios_version'), destScriptsDir);
    shell.cp(path.join(binDir, 'apple_osx_version'), destScriptsDir);
    shell.cp(path.join(binDir, 'apple_xcode_version'), destScriptsDir);
    shell.cp(path.join(binDir, 'lib', 'versions.js'),  path.join(destScriptsDir, 'lib'));

    // CB-11792 do a token replace for __PROJECT_NAME__ in .xcconfig
    var project_name_esc = projectName.replace(/&/g, '\\&');
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(destScriptsDir, 'build-debug.xcconfig'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(destScriptsDir, 'build-release.xcconfig'));

    // Make sure they are executable (sometimes zipping them can remove executable bit)
    shell.find(destScriptsDir).forEach(function(entry) {
        shell.chmod(755, entry);
    });
}

/*
 * Copy project template files into cordova project.
 *
 * @param {String} project_path         path to cordova project
 * @param {String} project_name         name of cordova project
 * @param {String} project_template_dir path to cordova-ios template directory
 * @parm  {BOOL}   use_cli              true if cli project
 */
function copyTemplateFiles(project_path, project_name, project_template_dir, package_name) {
    var r = path.join(project_path, project_name);

    shell.rm('-rf', path.join(r+'.xcodeproj'));
    shell.cp('-rf', path.join(project_template_dir, '__TEMP__.xcodeproj'), project_path);
    shell.mv('-f', path.join(project_path, '__TEMP__.xcodeproj'), path.join(r+'.xcodeproj'));

    shell.rm('-rf', path.join(project_path, project_name+'.xcworkspace'));
    shell.cp('-rf', path.join(project_template_dir, '__TEMP__.xcworkspace'), project_path);
    shell.mv('-f', path.join(project_path, '__TEMP__.xcworkspace'), path.join(r+'.xcworkspace'));
    shell.mv('-f', path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', '__PROJECT_NAME__.xcscheme'), path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', project_name+'.xcscheme'));

    shell.rm('-rf', r);
    shell.cp('-rf', path.join(project_template_dir, '__PROJECT_NAME__'), project_path);
    shell.mv('-f', path.join(project_path, '__PROJECT_NAME__'), r);

    shell.mv('-f', path.join(r, '__PROJECT_NAME__-Info.plist'), path.join(r, project_name+'-Info.plist'));
    shell.mv('-f', path.join(r, '__PROJECT_NAME__-Prefix.pch'), path.join(r, project_name+'-Prefix.pch'));
    shell.mv('-f', path.join(r, 'gitignore'), path.join(r, '.gitignore'));

    /*replace __PROJECT_NAME__ and --ID-- with ACTIVITY and ID strings, respectively, in:
     *
     * - ./__PROJECT_NAME__.xcodeproj/project.pbxproj
     * - ./__PROJECT_NAME__/Classes/AppDelegate.h
     * - ./__PROJECT_NAME__/Classes/AppDelegate.m
     * - ./__PROJECT_NAME__/Classes/MainViewController.h
     * - ./__PROJECT_NAME__/Classes/MainViewController.m
     * - ./__PROJECT_NAME__/Resources/main.m
     * - ./__PROJECT_NAME__/Resources/__PROJECT_NAME__-info.plist
     * - ./__PROJECT_NAME__/Resources/__PROJECT_NAME__-Prefix.plist
     */

    // https://issues.apache.org/jira/browse/CB-12402 - Encode XML characters properly
    var project_name_xml_esc = xmlescape(project_name);
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_xml_esc, path.join(r+'.xcworkspace', 'contents.xcworkspacedata'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_xml_esc, path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', project_name +'.xcscheme'));

    var project_name_esc = project_name.replace(/&/g, '\\&');
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r+'.xcodeproj', 'project.pbxproj'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'Classes', 'AppDelegate.h'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'Classes', 'AppDelegate.m'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'Classes', 'MainViewController.h'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'Classes', 'MainViewController.m'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'main.m'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, project_name+'-Info.plist'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, project_name+'-Prefix.pch'));
    shell.sed('-i', /--ID--/g, package_name, path.join(r, project_name+'-Info.plist'));
}

function detectProjectName(projectDir) {
    var files = fs.readdirSync(projectDir);
    for (var i = 0; i < files.length; ++i) {
        var m = /(.*)\.xcodeproj$/.exec(files[i]);
        if (m) {
            return m[1];
        }
    }
    throw new Error('Could not find an .xcodeproj directory within ' + projectDir);
}

function AbsParentPath(_path) {
    return path.resolve(path.dirname(_path));
}

function AbsProjectPath(relative_path) {
    var absolute_path = path.resolve(relative_path);
    if (/.pbxproj$/.test(absolute_path)) {
        absolute_path = AbsParentPath(absolute_path);
    }
    else if (!(/.xcodeproj$/.test(absolute_path))) {
        throw new Error('The following is not a valid path to an Xcode project: ' + absolute_path);
    }
    return absolute_path;
}

function relpath(_path, start) {
    start = start || process.cwd();
    return path.relative(path.resolve(start), path.resolve(_path));
}

/*
 * Creates a new iOS project with the following options:
 *
 * - --link (optional): Link directly against the shared copy of the CordovaLib instead of a copy of it
 * - --cli (optional): Use the CLI-project template
 * - <path_to_new_project>: Path to your new Cordova iOS project
 * - <package_name>: Package name, following reverse-domain style convention
 * - <project_name>: Project name
 * - <project_template_dir>: Path to a project template (override)
 *
 */
exports.createProject = function(project_path, package_name, project_name, opts) {
    package_name = package_name || 'my.cordova.project';
    project_name = project_name || 'CordovaExample';
    var use_shared = !!opts.link;
    var bin_dir = path.join(ROOT, 'bin'),
        project_parent = path.dirname(project_path);
    var project_template_dir = opts.customTemplate || path.join(bin_dir, 'templates', 'project');

    //check that project path doesn't exist
    if (fs.existsSync(project_path)) {
        return Q.reject('Project already exists');
    }

    //check that parent directory does exist so cp -r will not fail
    if (!fs.existsSync(project_parent)) {
        return Q.reject('Parent directory "' + project_parent + '" of given project path does not exist');
    }

    events.emit('log', 'Creating Cordova project for the iOS platform:');
    events.emit('log', '\tPath: ' + path.relative(process.cwd(), project_path));
    events.emit('log', '\tPackage: ' + package_name);
    events.emit('log', '\tName: ' + project_name);

    events.emit('verbose', 'Copying iOS template project to ' + project_path);

    // create the project directory and copy over files
    shell.mkdir(project_path);
    shell.cp('-rf', path.join(project_template_dir, 'www'), project_path);

    //Copy project template files
    copyTemplateFiles(project_path, project_name, project_template_dir, package_name);

    // Copy xcconfig files
    shell.cp('-rf', path.join(project_template_dir, '*.xcconfig'), project_path);

    //CordovaLib stuff
    copyJsAndCordovaLib(project_path, project_name, use_shared);
    copyScripts(project_path, project_name);

    events.emit('log', generateDoneMessage('create', use_shared));
    return Q.resolve();
};

exports.updateProject = function(projectPath, opts) {
    var projectName = detectProjectName(projectPath);
    var project_template_dir = path.join(ROOT, 'bin', 'templates', 'project');
    //Get package_name from existing projectName-Info.plist file
    var package_name = plist.parse(fs.readFileSync(path.join(projectPath, projectName, projectName+'-Info.plist'), 'utf8')).CFBundleIdentifier;
    setShellFatal(true, function() {
        copyTemplateFiles(projectPath, projectName, project_template_dir, package_name);
        copyJsAndCordovaLib(projectPath, projectName, opts.link);
        copyScripts(projectPath, projectName);
        events.emit('log',generateDoneMessage('update', opts.link));
    });
    return Q.resolve();
};

function generateDoneMessage(type, link) {
    var pkg = require('../../package');
    var msg = 'iOS project ' + (type == 'update' ? 'updated ' : 'created ') + 'with ' + pkg.name + '@' + pkg.version;
    if (link) {
        msg += ' and has a linked CordovaLib';
    }
    return msg;
}

function update_cordova_subproject(argv) {
    if (argv.length < 1 || argv.length > 2)
    {
        updateSubprojectHelp();
        throw new Error('Usage error for update_cordova_subproject');
    }

    var projectPath = AbsProjectPath(argv[0]),
        cordovaLibXcodePath;
    if (argv.length < 2) {
        cordovaLibXcodePath = path.join(ROOT, 'CordovaLib', 'CordovaLib.xcodeproj');
    }
    else {
        cordovaLibXcodePath = AbsProjectPath(argv[1]);
    }

    var parentProjectPath = AbsParentPath(projectPath),
        subprojectPath = relpath(cordovaLibXcodePath, parentProjectPath),
        REGEX = /(.+PBXFileReference.+wrapper.pb-project.+)(path = .+?;)(.*)(sourceTree.+;)(.+)/,
        newLine,
        lines = shell.grep('CordovaLib.xcodeproj', path.join(projectPath, 'project.pbxproj')),
        found = false;

    subprojectPath = subprojectPath.replace(/\\/g, '/');
    lines = lines.split('\n');
    for (var i = 0; i < lines.length; ++i) {
        if (lines[i].match(REGEX)) {
            found = true;
            newLine = lines[i].replace(/path = .+?;/, 'path = ' + subprojectPath + ';');
            newLine = newLine.replace(/sourceTree.+?;/, 'sourceTree = \"<group>\";');
            if (!newLine.match('name')) {
                newLine = newLine.replace('path = ', 'name = CordovaLib.xcodeproj; path = ');
            }
            shell.sed('-i', lines[i], newLine, path.join(projectPath, 'project.pbxproj'));
        }
    }

    // Patching pbxproj to replace copy www shell script with nodejs
    // Don't forget to duplicate this in templates/__CLI__.xcodeproj/project.pbxproj and templates/__NON-CLI__.xcodeproj/project.pbxproj on later changes
    var copyWwwSh = 'cordova\/lib\/copy-www-build-step\.sh';
    var copyWwwJs = 'NODEJS_PATH=\/usr\/local\/bin; NVM_NODE_PATH=~\/\.nvm\/versions\/node\/`nvm version 2>\/dev\/null`\/bin; N_NODE_PATH=`find \/usr\/local\/n\/versions\/node\/\* -maxdepth 0 -type d 2>\/dev\/null \| tail -1`\/bin; XCODE_NODE_PATH=`xcode-select --print-path`\/usr\/share\/xcs\/Node\/bin; PATH=\$NODEJS_PATH:\$NVM_NODE_PATH:\$N_NODE_PATH:\$XCODE_NODE_PATH:\$PATH && node cordova\/lib\/copy-www-build-step\.js';
    shell.sed('-i', copyWwwSh, copyWwwJs, path.join(projectPath, 'project.pbxproj'));

    if (!found) {
        throw new Error('Entry not found in project file for sub-project: ' + subprojectPath);
    }
}

exports.updateSubprojectHelp = updateSubprojectHelp;
exports.update_cordova_subproject = update_cordova_subproject;
