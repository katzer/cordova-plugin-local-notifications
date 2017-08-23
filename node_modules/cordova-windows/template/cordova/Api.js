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

var path = require('path');
var events = require('cordova-common').events;
var JsprojManager = require('./lib/JsprojManager');
var PluginManager = require('cordova-common').PluginManager;
var CordovaLogger = require('cordova-common').CordovaLogger;
var PlatformMunger = require('./lib/ConfigChanges.js').PlatformMunger;
var PlatformJson = require('cordova-common').PlatformJson;
var PluginInfo = require('./lib/PluginInfo').PluginInfo;
var PluginInfoProvider = require('cordova-common').PluginInfoProvider;

var PLATFORM = 'windows';

function setupEvents(externalEventEmitter) {
    if (externalEventEmitter) {
        // This will make the platform internal events visible outside
        events.forwardEventsTo(externalEventEmitter);
        return;
    }

    // There is no logger if external emitter is not present,
    // so attach a console logger
    CordovaLogger.get().subscribe(events);
}

/**
 * Class, that acts as abstraction over particular platform. Encapsulates the
 *   platform's properties and methods.
 *
 * Platform that implements own PlatformApi instance _should implement all
 *   prototype methods_ of this class to be fully compatible with cordova-lib.
 *
 * The PlatformApi instance also should define the following field:
 *
 * * platform: String that defines a platform name.
 */
function Api(platform, platformRootDir, eventEmitter) {
    this.platform = PLATFORM;
    this.root = path.resolve(__dirname, '..');

    setupEvents(eventEmitter);

    var self = this;
    this.locations = {
        root: self.root,
        www: path.join(self.root, 'www'),
        platformWww: path.join(self.root, 'platform_www'),
        configXml: path.join(self.root, 'config.xml'),
        defaultConfigXml: path.join(self.root, 'cordova/defaults.xml'),
        // NOTE: Due to platformApi spec we need to return relative paths here
        cordovaJs: 'template/www/cordova.js',
        cordovaJsSrc: 'cordova-js-src'
    };
}

/**
 * Installs platform to specified directory and creates a platform project.
 *
 * @param  {String}  destinationDir  A directory, where platform should be
 *   created/installed.
 * @param  {ConfigParser} [projectConfig] A ConfigParser instance, used to get
 *   some application properties for new platform like application name, package
 *   id, etc. If not defined, this means that platform is used as standalone
 *   project and is not a part of cordova project, so platform will use some
 *   default values.
 * @param  {Object}   [options]  An options object. The most common options are:
 * @param  {String}   [options.customTemplate]  A path to custom template, that
 *   should override the default one from platform.
 * @param  {Boolean}  [options.link=false]  Flag that indicates that platform's
 *   sources will be linked to installed platform instead of copying.
 *
 * @return {Promise<PlatformApi>} Promise either fulfilled with PlatformApi
 *   instance or rejected with CordovaError.
 */
Api.createPlatform = function (destinationDir, projectConfig, options, events) {
    setupEvents(events);
    var result;

    try {
        result = require('../../bin/lib/create')
        .create(destinationDir, projectConfig, options)
        .then(function () {
            var PlatformApi = require(path.resolve(destinationDir, 'cordova/Api'));
            return new PlatformApi(PLATFORM, destinationDir, events);
        });
    }
    catch(e) {
        events.emit('error','createPlatform is not callable from the windows project API.');
        throw(e);
    }

    return result;
};

/**
 * Updates already installed platform.
 *
 * @param  {String}  destinationDir  A directory, where existing platform
 *   installed, that should be updated.
 * @param  {Object}  [options]  An options object. The most common options are:
 * @param  {String}  [options.customTemplate]  A path to custom template, that
 *   should override the default one from platform.
 * @param  {Boolean}  [options.link=false]  Flag that indicates that platform's sources
 *   will be linked to installed platform instead of copying.
 * @param {EventEmitter} [events] The emitter that will be used for logging
 *
 * @return {Promise<PlatformApi>} Promise either fulfilled with PlatformApi
 *   instance or rejected with CordovaError.
 */
Api.updatePlatform = function (destinationDir, options, events) {
    setupEvents(events);
    try {
        return require('../../bin/lib/update')
        .update(destinationDir, options)
        .then(function () {
            var PlatformApi = require(path.resolve(destinationDir, 'cordova/Api'));
            return new PlatformApi(PLATFORM, destinationDir, events);
        });
    }
    catch(e) {
        events.emit('error','updatePlatform is not callable from the windows project API.');
        throw(e);
    }
};

/**
 * Gets a CordovaPlatform object, that represents the platform structure.
 *
 * @return  {CordovaPlatform}  A structure that contains the description of
 *   platform's file structure and other properties of platform.
 */
Api.prototype.getPlatformInfo = function () {

    var result = {};
    result.locations = this.locations;
    result.root = this.root;
    result.name = this.platform;
    result.version = require('./version');
    result.projectConfig = this._config;

    return result;
};

/**
 * Updates installed platform with provided www assets and new app
 *   configuration. This method is required for CLI workflow and will be called
 *   each time before build, so the changes, made to app configuration and www
 *   code, will be applied to platform.
 *
 * @param {CordovaProject} cordovaProject A CordovaProject instance, that defines a
 *   project structure and configuration, that should be applied to platform
 *   (contains project's www location and ConfigParser instance for project's
 *   config).
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.prepare = function (cordovaProject, prepareOptions) {
    return require('./lib/prepare').prepare.call(this, cordovaProject, prepareOptions);
};

/**
 * Installs a new plugin into platform. This method only copies non-www files
 *   (sources, libs, etc.) to platform. It also doesn't resolves the
 *   dependencies of plugin. Both of handling of www files, such as assets and
 *   js-files and resolving dependencies are the responsibility of caller.
 *
 * @param  {PluginInfo}  plugin  A PluginInfo instance that represents plugin
 *   that will be installed.
 * @param  {Object}  installOptions  An options object. Possible options below:
 * @param  {Boolean}  installOptions.link: Flag that specifies that plugin
 *   sources will be symlinked to app's directory instead of copying (if
 *   possible).
 * @param  {Object}  installOptions.variables  An object that represents
 *   variables that will be used to install plugin. See more details on plugin
 *   variables in documentation:
 *   https://cordova.apache.org/docs/en/4.0.0/plugin_ref_spec.md.html
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.addPlugin = function (plugin, installOptions) {

    var self = this;

    // We need to use custom PluginInfo to trigger windows-specific processing
    // of changes in .appxmanifest files. See PluginInfo.js for details
    var pluginInfo = new PluginInfo(plugin.dir);
    var jsProject = JsprojManager.getProject(this.root);
    installOptions = installOptions || {};
    installOptions.variables = installOptions.variables || {};
    // Add PACKAGE_NAME variable into vars
    if (!installOptions.variables.PACKAGE_NAME) {
        installOptions.variables.PACKAGE_NAME = jsProject.getPackageName();
    }

    var platformJson = PlatformJson.load(this.root, this.platform);
    var pluginManager = PluginManager.get(this.platform, this.locations, jsProject);
    pluginManager.munger = new PlatformMunger(this.platform, this.locations.root, platformJson, new PluginInfoProvider());
    return pluginManager
        .addPlugin(pluginInfo, installOptions)
        .then(function () {
            // CB-11657 Add BOM to www files here because files added by plugin
            // probably don't have it. Prepare would add BOM but it might not be called
            return require('./lib/prepare').addBOMSignature(self.locations.www);
        })
        // CB-11022 return non-falsy value to indicate
        // that there is no need to run prepare after
        .thenResolve(true);
};

/**
 * Removes an installed plugin from platform.
 *
 * Since method accepts PluginInfo instance as input parameter instead of plugin
 *   id, caller shoud take care of managing/storing PluginInfo instances for
 *   future uninstalls.
 *
 * @param  {PluginInfo}  plugin  A PluginInfo instance that represents plugin
 *   that will be installed.
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.removePlugin = function (plugin, uninstallOptions) {
    var self = this;

    // We need to use custom PluginInfo to trigger windows-specific processing
    // of changes in .appxmanifest files. See PluginInfo.js for details
    var pluginInfo = new PluginInfo(plugin.dir);
    var jsProject = JsprojManager.getProject(this.root);
    var platformJson = PlatformJson.load(this.root, this.platform);
    var pluginManager = PluginManager.get(this.platform, this.locations, jsProject);
    //  CB-11933 We override this field by windows specific one because windows has special logic
    //  for appxmanifest's capabilities removal (see also https://issues.apache.org/jira/browse/CB-11066)
    pluginManager.munger = new PlatformMunger(this.platform, this.locations.root, platformJson, new PluginInfoProvider());
    return pluginManager
        .removePlugin(pluginInfo, uninstallOptions)
        .then(function () {
            // CB-11657 Add BOM to cordova_plugins, since it is was
            // regenerated after plugin uninstallation and does not have BOM
            return require('./lib/prepare').addBOMToFile(path.resolve(self.locations.www, 'cordova_plugins.js'));
        })
        // CB-11022 return non-falsy value to indicate
        // that there is no need to run prepare after
        .thenResolve(true);
};

/**
 * Builds an application package for current platform.
 *
 * @param  {Object}  buildOptions  A build options. This object's structure is
 *   highly depends on platform's specific. The most common options are:
 * @param  {Boolean}  buildOptions.debug  Indicates that packages should be
 *   built with debug configuration. This is set to true by default unless the
 *   'release' option is not specified.
 * @param  {Boolean}  buildOptions.release  Indicates that packages should be
 *   built with release configuration. If not set to true, debug configuration
 *   will be used.
 * @param   {Boolean}  buildOptions.device  Specifies that built app is intended
 *   to run on device
 * @param   {Boolean}  buildOptions.emulator: Specifies that built app is
 *   intended to run on emulator
 * @param   {String}  buildOptions.target  Specifies the device id that will be
 *   used to run built application.
 * @param   {Boolean}  buildOptions.nobuild  Indicates that this should be a
 *   dry-run call, so no build artifacts will be produced.
 * @param   {String[]}  buildOptions.archs  Specifies chip architectures which
 *   app packages should be built for. List of valid architectures is depends on
 *   platform.
 * @param   {String}  buildOptions.buildConfig  The path to build configuration
 *   file. The format of this file is depends on platform.
 * @param   {String[]} buildOptions.argv Raw array of command-line arguments,
 *   passed to `build` command. The purpose of this property is to pass a
 *   platform-specific arguments, and eventually let platform define own
 *   arguments processing logic.
 *
 * @return {Promise<Object[]>} A promise either fulfilled with an array of build
 *   artifacts (application packages) if package was built successfully,
 *   or rejected with CordovaError. The resultant build artifact objects is not
 *   strictly typed and may conatin arbitrary set of fields as in sample below.
 *
 *     {
 *         architecture: 'x86',
 *         buildType: 'debug',
 *         path: '/path/to/build',
 *         type: 'app'
 *     }
 *
 * The return value in most cases will contain only one item but in some cases
 *   there could be multiple items in output array, e.g. when multiple
 *   arhcitectures is specified.
 */
Api.prototype.build = function(buildOptions) {
    // TODO: Should we run check_reqs first? Android does this, but Windows appears doesn't.
    return require('./lib/build').run.call(this, buildOptions)
    .then(function (result) {
        // Wrap result into array according to PlatformApi spec
        return [result];
    });
};

/**
 * Builds an application package for current platform and runs it on
 *   specified/default device. If no 'device'/'emulator'/'target' options are
 *   specified, then tries to run app on default device if connected, otherwise
 *   runs the app on emulator.
 *
 * @param   {Object}  runOptions  An options object. The structure is the same
 *   as for build options.
 *
 * @return {Promise} A promise either fulfilled if package was built and ran
 *   successfully, or rejected with CordovaError.
 */
Api.prototype.run = function(runOptions) {
    // TODO: Should we run check_reqs first? Android does this, but Windows appears doesn't.
    return require('./lib/run').run.call(this, runOptions);
};

/**
 * Cleans out the build artifacts from platform's directory.
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError.
 */
Api.prototype.clean = function(cleanOpts) {
    var self = this;
    return require('./lib/build').clean.call(this, cleanOpts)
    .then(function () {
        return require('./lib/prepare').clean.call(self, cleanOpts);
    });
};

/**
 * Performs a requirements check for current platform. Each platform defines its
 *   own set of requirements, which should be resolved before platform can be
 *   built successfully.
 *
 * @return  {Promise<Requirement[]>}  Promise, resolved with set of Requirement
 *   objects for current platform.
 */
Api.prototype.requirements = function() {
    return require('./lib/check_reqs').check_all();
};

module.exports = Api;
