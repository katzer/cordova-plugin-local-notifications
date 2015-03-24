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


// Includes a snippet into the cordova-core js file
// to fire the activated event after device is ready


var fs = require('fs'),
    rootdir = process.argv[2];

if (!rootdir)
    return;

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
function replace (filename, to_replace, replace_with) {
    var data = fs.readFileSync(filename, 'utf8'),
        result;

    if (data.indexOf(replace_with) > -1)
        return;

    result = data.replace(to_replace, replace_with);
    fs.writeFileSync(filename, result, 'utf8');
}

// Fires the activated event again after device is ready
var snippet =
    "var activatedHandler = function (args) {" +
        "channel.deviceready.subscribe(function () {" +
            "app.queueEvent(args);" +
        "});" +
    "};" +
    "app.addEventListener('activated', activatedHandler, false);" +
    "document.addEventListener('deviceready', function () {" +
        "app.removeEventListener('activated', activatedHandler);" +
    "}, false);\n" +
    "            app.start();";

// Path to cordova-core js files where the snippet needs to be included
var files = [
    'platforms/windows/www/cordova.js',
    'platforms/windows/platform_www/cordova.js'
];

// Includes the snippet before app.start() is called
for (var i = 0; i < files.length; i++) {
    replace(files[i], 'app.start();', snippet);
}
