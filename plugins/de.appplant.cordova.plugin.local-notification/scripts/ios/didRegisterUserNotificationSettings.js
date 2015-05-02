#!/usr/bin/env node

/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */


// Hook inserts the UIApplicationRegisterUserNotificationSettings constant
// and the didRegisterUserNotificationSettings method to AppDelegate.


var fs = require('fs'),
    path = require('path'),
    rootdir = process.argv[2];

if (!rootdir)
    return;

module.exports = function (context) {

    var cordova_util = context.requireCordovaModule('cordova-lib/src/cordova/util'),
        ConfigParser = context.requireCordovaModule('cordova-lib/src/configparser/ConfigParser'),
        projectRoot = cordova_util.isCordova(),
        xml = cordova_util.projectConfig(projectRoot),
        cfg = new ConfigParser(xml);
    // Cordova moved the platforms stuff; try both locations so we'll work for new and old file layouts.
    var platforms;
    try {
        platforms = context.requireCordovaModule('cordova-lib/src/cordova/platforms');
    } catch(e) {
        platforms = context.requireCordovaModule('cordova-lib/src/platforms/platforms');
    }

    /**
     * The absolute path for the file.
     *
     * @param {String} platform
     *      The name of the platform like 'ios'.
     * @param {String} relPath
     *      The relative path from the platform root directory.
     *
     * @return String
     */
    function getAbsPath(platform, relPath) {
        var platform_path = path.join(projectRoot, 'platforms', platform),
            parser = new platforms[platform].parser(platform_path);

        return path.join(parser.cordovaproj, relPath);
    }

    /**
     * Replaces a string with another one in a file.
     *
     * @param {String} path
     *      Absolute or relative file path from cordova root project.
     * @param {String} to_replace
     *      The string to replace.
     * @param {String}
     *      The string to replace with.
     */
    function replace (path, to_replace, replace_with) {
        var data = fs.readFileSync(path, 'utf8'),
            result;

        if (data.indexOf(replace_with) > -1)
            return;

        result = data.replace(new RegExp(to_replace, 'g'), replace_with);

        fs.writeFileSync(path, result, 'utf8');
    }

    // Absolute paths for AppDelegate's header and member
    var h_path = getAbsPath('ios', 'Classes/AppDelegate.h'),
        m_path = getAbsPath('ios', 'Classes/AppDelegate.m');

    // Decleration of UIApplicationRegisterUserNotificationSettings
    var h_UIApplicationRegisterUserNotificationSettings =
        "extern NSString* const UIApplicationRegisterUserNotificationSettings;\n";

    // Implementation of UIApplicationRegisterUserNotificationSettings
    var m_UIApplicationRegisterUserNotificationSettings =
        "NSString* const UIApplicationRegisterUserNotificationSettings = @\"UIApplicationRegisterUserNotificationSettings\";\n";

    // Implementation for didRegisterUserNotificationSettings
    var didRegisterUserNotificationSettings =
        "#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000\n" +
        "\n" +
        "- (void)                    application:(UIApplication*)application\n" +
        "    didRegisterUserNotificationSettings:(UIUserNotificationSettings*)settings\n" +
        "{\n" +
        "    NSNotificationCenter* center = [NSNotificationCenter\n" +
        "                                    defaultCenter];\n" +
        "\n" +
        "    // re-post (broadcast)\n" +
        "    [center postNotificationName:UIApplicationRegisterUserNotificationSettings\n" +
        "                          object:settings];\n" +
        "}\n" +
        "#endif\n";

    // Inserts the constant decleration
    replace(h_path, '@interface AppDelegate', h_UIApplicationRegisterUserNotificationSettings + "\n@interface AppDelegate");
    // Inserts the constant implementation
    replace(m_path, '@implementation AppDelegate', m_UIApplicationRegisterUserNotificationSettings + "\n@implementation AppDelegate");
    // Inserts the didRegisterUserNotificationSettings implementation
    replace(m_path, '@end', didRegisterUserNotificationSettings + "\n@end");

};
