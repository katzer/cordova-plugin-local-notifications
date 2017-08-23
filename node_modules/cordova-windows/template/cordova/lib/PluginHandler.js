/*
 *
 * Copyright 2013 Jesse MacFadyen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

/* jshint sub:true */

var fs   = require('fs');
var path = require('path');
var shell = require('shelljs');
var events = require('cordova-common').events;
var CordovaError = require('cordova-common').CordovaError;

// returns relative file path for a file in the plugin's folder that can be referenced
// from a project file.
function getPluginFilePath(plugin, pluginFile, targetDir) {
    var src = path.resolve(plugin.dir, pluginFile);
    return '$(ProjectDir)' + path.relative(targetDir, src);
}

var handlers = {
    'source-file': {
        install:function(obj, plugin, project, options) {
            var dest = path.join('plugins', plugin.id, obj.targetDir || '', path.basename(obj.src));
            if (options && options.force) {
                copyFile(plugin.dir, obj.src, project.root, dest);
            } else {
                copyNewFile(plugin.dir, obj.src, project.root, dest);
            }
            // add reference to this file to jsproj.
            project.addSourceFile(dest);
        },
        uninstall:function(obj, plugin, project, options) {
            var dest = path.join('plugins', plugin.id, obj.targetDir || '', path.basename(obj.src));
            removeFile(project.root, dest);
            // remove reference to this file from csproj.
            project.removeSourceFile(dest);
        }
    },
    'resource-file':{
        install:function(obj, plugin, project, options) {
            if (obj.reference) {
                // do not copy, but reference the file in the plugin folder. This allows to
                // have multiple source files map to the same target and select the appropriate
                // one based on the current build settings, e.g. architecture.
                // also, we don't check for existence. This allows to insert build variables
                // into the source file name, e.g.
                // <resource-file src="$(Platform)/My.dll" target="My.dll" />
                var relativeSrcPath = getPluginFilePath(plugin, obj.src, project.projectFolder);
                project.addResourceFileToProject(relativeSrcPath, obj.target, getTargetConditions(obj));
            } else {
                // if target already exists, emit warning to consider using a reference instead of copying
                if (fs.existsSync(path.resolve(project.root, obj.target))) {
                    events.emit('warn', '<resource-file> with target ' + obj.target + ' already exists and will be overwritten ' +
                    'by a <resource-file> with the same target. Consider using the attribute reference="true" in the ' +
                    '<resource-file> tag to avoid overwriting files with the same target. Using reference will not copy files ' +
                    'to the destination, instead will create a reference to the source path.');
                }
                // as per specification resource-file target is specified relative to platform root
                copyFile(plugin.dir, obj.src, project.root, obj.target);
                project.addResourceFileToProject(obj.target, obj.target, getTargetConditions(obj));
            }
        },
        uninstall:function(obj, plugin, project, options) {
            if (obj.reference) {
                var relativeSrcPath = getPluginFilePath(plugin, obj.src, project.projectFolder);
                project.removeResourceFileFromProject(relativeSrcPath, getTargetConditions(obj));
            } else {
                removeFile(project.root, obj.target);
                project.removeResourceFileFromProject(obj.target, getTargetConditions(obj));
            }
        }
    },
    'lib-file': {
        install:function(obj, plugin, project, options) {
            var inc  = obj.Include || obj.src;
            project.addSDKRef(inc, getTargetConditions(obj));
        },
        uninstall:function(obj, plugin, project, options) {
            events.emit('verbose', 'windows lib-file uninstall :: ' + plugin.id);
            var inc = obj.Include || obj.src;
            project.removeSDKRef(inc, getTargetConditions(obj));
        }
    },
    'framework': {
        install:function(obj, plugin, project, options) {
            events.emit('verbose', 'windows framework install :: ' + plugin.id);

            var src = obj.src;
            var dest = src;
            var type = obj.type;
            var targetDir = obj.targetDir || '';
            var implementPath = obj.implementation;

            if(type === 'projectReference') {
                dest = path.join(path.relative(project.projectFolder, plugin.dir), targetDir, src);
                project.addProjectReference(dest, getTargetConditions(obj));
            } else {
                // path.join ignores empty paths passed so we don't check whether targetDir is not empty
                dest = path.join('plugins', plugin.id, targetDir, path.basename(src));
                copyFile(plugin.dir, src, project.root, dest);
                if (implementPath) {
                    copyFile(plugin.dir, implementPath, project.root, path.join(path.dirname(dest), path.basename(implementPath)));
                }
                project.addReference(dest, getTargetConditions(obj), implementPath);
            }

        },
        uninstall:function(obj, plugin, project, options) {
            events.emit('verbose', 'windows framework uninstall :: ' + plugin.id  );

            var src = obj.src;
            var type = obj.type;

            if(type === 'projectReference') {
                project.removeProjectReference(path.join(path.relative(project.projectFolder, plugin.dir), src), getTargetConditions(obj));
            }
            else {
                var targetPath = path.join('plugins', plugin.id);
                removeFile(project.root, targetPath);
                project.removeReference(src, getTargetConditions(obj));
            }
        }
    },
    asset:{
        install:function(obj, plugin, project, options) {
            if (!obj.src) {
                throw new CordovaError(generateAttributeError('src', 'asset', plugin.id));
            }
            if (!obj.target) {
                throw new CordovaError(generateAttributeError('target', 'asset', plugin.id));
            }

            copyFile(plugin.dir, obj.src, project.www, obj.target);
            if (options && options.usePlatformWww) copyFile(plugin.dir, obj.src, project.platformWww, obj.target);
        },
        uninstall:function(obj, plugin, project, options) {
            var target = obj.target || obj.src;

            if (!target) throw new CordovaError(generateAttributeError('target', 'asset', plugin.id));

            removeFile(project.www, target);
            removeFile(project.www, path.join('plugins', plugin.id));
            if (options && options.usePlatformWww) {
                removeFile(project.platformWww, target);
                removeFile(project.platformWww, path.join('plugins', plugin.id));
            }
        }
    },
    'js-module': {
        install: function (obj, plugin, project, options) {
            // Copy the plugin's files into the www directory.
            var moduleSource = path.resolve(plugin.dir, obj.src);
            var moduleName = plugin.id + '.' + (obj.name || path.basename(obj.src, path.extname (obj.src)));

            // Read in the file, prepend the cordova.define, and write it back out.
            var scriptContent = fs.readFileSync(moduleSource, 'utf-8').replace(/^\ufeff/, ''); // Window BOM
            if (moduleSource.match(/.*\.json$/)) {
                scriptContent = 'module.exports = ' + scriptContent;
            }
            scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) {\n' + scriptContent + '\n});\n';

            var moduleDestination = path.resolve(project.www, 'plugins', plugin.id, obj.src);
            shell.mkdir('-p', path.dirname(moduleDestination));
            fs.writeFileSync(moduleDestination, scriptContent, 'utf-8');
            if (options && options.usePlatformWww) {
                var platformWwwDestination = path.resolve(project.platformWww, 'plugins', plugin.id, obj.src);
                shell.mkdir('-p', path.dirname(platformWwwDestination));
                fs.writeFileSync(platformWwwDestination, scriptContent, 'utf-8');
            }
        },
        uninstall: function (obj, plugin, project, options) {
            var pluginRelativePath = path.join('plugins', plugin.id, obj.src);
            removeFileAndParents(project.www, pluginRelativePath);
            if (options && options.usePlatformWww) removeFileAndParents(project.platformWww, pluginRelativePath);
        }
    }
};

// Helpers from common

module.exports.getInstaller = function (type) {
    if (handlers[type] && handlers[type].install) {
        return handlers[type].install;
    }

    events.emit('verbose', '<' + type + '> is not supported for Windows plugins');
};

module.exports.getUninstaller = function(type) {
    if (handlers[type] && handlers[type].uninstall) {
        return handlers[type].uninstall;
    }

    events.emit('verbose', '<' + type + '> is not supported for Windows plugins');
};

function getTargetConditions(obj) {
    return { versions: obj.versions, deviceTarget: obj.deviceTarget, arch: obj.arch };
}

function copyFile (plugin_dir, src, project_dir, dest, link) {
    src = path.resolve(plugin_dir, src);
    if (!fs.existsSync(src)) throw new CordovaError('"' + src + '" not found!');

    // check that src path is inside plugin directory
    var real_path = fs.realpathSync(src);
    var real_plugin_path = fs.realpathSync(plugin_dir);
    if (real_path.indexOf(real_plugin_path) !== 0)
        throw new CordovaError('File "' + src + '" is located outside the plugin directory "' + plugin_dir + '"');

    dest = path.resolve(project_dir, dest);

    // check that dest path is located in project directory
    if (dest.indexOf(path.resolve(project_dir)) !== 0)
        throw new CordovaError('Destination "' + dest + '" for source file "' + src + '" is located outside the project');

    shell.mkdir('-p', path.dirname(dest));

    if (link) {
        fs.symlinkSync(path.relative(path.dirname(dest), src), dest);
    } else if (fs.statSync(src).isDirectory()) {
        // XXX shelljs decides to create a directory when -R|-r is used which sucks. http://goo.gl/nbsjq
        shell.cp('-Rf', src+'/*', dest);
    } else {
        shell.cp('-f', src, dest);
    }
}

// Same as copy file but throws error if target exists
function copyNewFile (plugin_dir, src, project_dir, dest, link) {
    var target_path = path.resolve(project_dir, dest);
    if (fs.existsSync(target_path))
        throw new CordovaError('"' + target_path + '" already exists!');

    copyFile(plugin_dir, src, project_dir, dest, !!link);
}

// checks if file exists and then deletes. Error if doesn't exist
function removeFile (project_dir, src) {
    var file = path.resolve(project_dir, src);
    shell.rm('-Rf', file);
}

function removeFileAndParents (baseDir, destFile, stopper) {
    stopper = stopper || '.';
    var file = path.resolve(baseDir, destFile);
    if (!fs.existsSync(file)) return;

    shell.rm('-rf', file);

    // check if directory is empty
    var curDir = path.dirname(file);

    while(curDir !== path.resolve(baseDir, stopper)) {
        if(fs.existsSync(curDir) && fs.readdirSync(curDir).length === 0) {
            fs.rmdirSync(curDir);
            curDir = path.resolve(curDir, '..');
        } else {
            // directory not empty...do nothing
            break;
        }
    }
}

function generateAttributeError(attribute, element, id) {
    return 'Required attribute "' + attribute + '" not specified in <' + element + '> element from plugin: ' + id;
}
