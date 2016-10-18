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

/*jshint node: true*/

var Q = require('q');
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');

var CordovaError = require('cordova-common').CordovaError;
var ActionStack = require('cordova-common').ActionStack;

var configMunger = require('../configMunger');
var projectFile = require('../projectFile');
var pluginHandlers = require('./pluginHandlers');

function Plugman(locations) {
    this.locations = locations;

    this._munger = configMunger.get(this.locations.root);
    this._platformJson = this._munger.platformJson;
    this.platform = 'ios';
}

// shared Plugman instance
var _instance = null;

Plugman.get = function(locations) {

    if (!_instance) {
        _instance = new Plugman(locations);
    }
    // we use singleton Plugman instance so we don't inistantiate all helper classes
    // for each plugin add or rm
    return _instance;
};

module.exports = Plugman;

Plugman.prototype.addPlugin = function (plugin, installOptions) {

    if (!plugin || plugin.constructor.name !== 'PluginInfo')
        return Q.reject(new CordovaError('The parameter is incorrect. The first parameter to addPlugin should be a PluginInfo instance'));

    installOptions = installOptions || {};
    installOptions.variables = installOptions.variables || {};

    var self = this;
    var actions = new ActionStack();

    var project = projectFile.parse(this.locations);

    // gather all files needs to be handled during install
    plugin.getFilesAndFrameworks(this.platform)
        .concat(plugin.getAssets(this.platform))
        .concat(plugin.getJsModules(this.platform))
    .forEach(function(item) {
        actions.push(actions.createAction(
            pluginHandlers.getInstaller(item.itemType), [item, plugin, project, installOptions],
            pluginHandlers.getUninstaller(item.itemType), [item, plugin, project, installOptions]));
    });

    // run through the action stack
    return actions.process(this.platform)
    .then(function () {
        if (project) {
            project.write();
        }

        // Add PACKAGE_NAME variable into vars
        if (!installOptions.variables.PACKAGE_NAME) {
            installOptions.variables.PACKAGE_NAME = project.getPackageName();
        }

        self._munger
            // Ignore passed `is_top_level` option since platform itself doesn't know
            // anything about managing dependencies - it's responsibility of caller.
            .add_plugin_changes(plugin, installOptions.variables, /*is_top_level=*/true, /*should_increment=*/true)
            .save_all();

        var targetDir = installOptions.usePlatformWww ?
            self.locations.platformWww :
            self.locations.www;

        self._addModulesInfo(plugin, targetDir);
    });
};

Plugman.prototype.removePlugin = function (plugin, uninstallOptions) {
    if (!plugin || plugin.constructor.name !== 'PluginInfo')
        return Q.reject(new CordovaError('The parameter is incorrect. The first parameter to addPlugin should be a PluginInfo instance'));

    var self = this;
    var actions = new ActionStack();
    var project = projectFile.parse(this.locations);

    // queue up plugin files
    plugin.getFilesAndFrameworks(this.platform)
        .concat(plugin.getAssets(this.platform))
        .concat(plugin.getJsModules(this.platform))
    .forEach(function(item) {
        actions.push(actions.createAction(
            pluginHandlers.getUninstaller(item.itemType), [item, plugin, project, uninstallOptions],
            pluginHandlers.getInstaller(item.itemType), [item, plugin, project, uninstallOptions]));
    });

    // run through the action stack
    return actions.process(this.platform)
    .then(function() {
        if (project) {
            project.write();
        }

        self._munger
            // Ignore passed `is_top_level` option since platform itself doesn't know
            // anything about managing dependencies - it's responsibility of caller.
            .remove_plugin_changes(plugin, /*is_top_level=*/true)
            .save_all();

        var targetDir = uninstallOptions.usePlatformWww ?
            self.locations.platformWww :
            self.locations.www;

        self._removeModulesInfo(plugin, targetDir);
    });
};

/**
 * Removes the specified modules from list of installed modules and updates
 *   platform_json and cordova_plugins.js on disk.
 *
 * @param   {PluginInfo}  plugin  PluginInfo instance for plugin, which modules
 *   needs to be added.
 * @param   {String}  targetDir  The directory, where updated cordova_plugins.js
 *   should be written to.
 */
Plugman.prototype._addModulesInfo = function(plugin, targetDir) {
    var installedModules = this._platformJson.root.modules || [];

    var installedPaths = installedModules.map(function (installedModule) {
        return installedModule.file;
    });

    var modulesToInstall = plugin.getJsModules(this.platform)
    .filter(function (moduleToInstall) {
        return installedPaths.indexOf(moduleToInstall.file) === -1;
    }).map(function (moduleToInstall) {
        var moduleName = plugin.id + '.' + ( moduleToInstall.name || moduleToInstall.src.match(/([^\/]+)\.js/)[1] );
        var obj = {
            file: ['plugins', plugin.id, moduleToInstall.src].join('/'),
            id: moduleName,
            pluginId: plugin.id
        };
        if (moduleToInstall.clobbers.length > 0) {
            obj.clobbers = moduleToInstall.clobbers.map(function(o) { return o.target; });
        }
        if (moduleToInstall.merges.length > 0) {
            obj.merges = moduleToInstall.merges.map(function(o) { return o.target; });
        }
        if (moduleToInstall.runs) {
            obj.runs = true;
        }

        return obj;
    });

    this._platformJson.root.modules = installedModules.concat(modulesToInstall);
    if (!this._platformJson.root.plugin_metadata) {
        this._platformJson.root.plugin_metadata = {};
    }
    this._platformJson.root.plugin_metadata[plugin.id] = plugin.version;
    this._writePluginModules(targetDir);
    this._platformJson.save();
};

/**
 * Fetches all installed modules, generates cordova_plugins contents and writes
 *   it to file.
 *
 * @param   {String}  targetDir  Directory, where write cordova_plugins.js to.
 *   Ususally it is either <platform>/www or <platform>/platform_www
 *   directories.
 */
Plugman.prototype._writePluginModules = function (targetDir) {
    // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
    var final_contents = 'cordova.define(\'cordova/plugin_list\', function(require, exports, module) {\n';
    final_contents += 'module.exports = ' + JSON.stringify(this._platformJson.root.modules, null, '    ') + ';\n';
    final_contents += 'module.exports.metadata = \n';
    final_contents += '// TOP OF METADATA\n';

    final_contents += JSON.stringify(this._platformJson.root.plugin_metadata, null, 4) + '\n';
    final_contents += '// BOTTOM OF METADATA\n';
    final_contents += '});'; // Close cordova.define.

    shell.mkdir('-p', targetDir);
    fs.writeFileSync(path.join(targetDir, 'cordova_plugins.js'), final_contents, 'utf-8');
};

/**
 * Removes the specified modules from list of installed modules and updates
 *   platform_json and cordova_plugins.js on disk.
 *
 * @param   {PluginInfo}  plugin  PluginInfo instance for plugin, which modules
 *   needs to be removed.
 * @param   {String}  targetDir  The directory, where updated cordova_plugins.js
 *   should be written to.
 */
Plugman.prototype._removeModulesInfo = function(plugin, targetDir) {
    var installedModules = this._platformJson.root.modules || [];
    var modulesToRemove = plugin.getJsModules(this.platform)
    .map(function (jsModule) {
        return  ['plugins', plugin.id, jsModule.src].join('/');
    });

    var updatedModules = installedModules
    .filter(function (installedModule) {
        return (modulesToRemove.indexOf(installedModule.file) === -1);
    });

    this._platformJson.root.modules = updatedModules;
    if (this._platformJson.root.plugin_metadata) {
        delete this._platformJson.root.plugin_metadata[plugin.id];
    }
    this._writePluginModules(targetDir);
    this._platformJson.save();
};
