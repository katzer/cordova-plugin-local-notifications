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


// Hook sets ToastCapable on true to enable local-notifications


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

    if (data.indexOf('ToastCapable') > -1)
        return;

    result = data.replace(new RegExp(to_replace, 'g'), replace_with);

    fs.writeFileSync(filename, result, 'utf8');
}

// Set ToastCapable for Windows Phone
replace('platforms/windows/package.phone.appxmanifest', '<m3:VisualElements', '<m3:VisualElements ToastCapable="true"');
// Set ToastCapable for Windows 8.1
replace('platforms/windows/package.windows.appxmanifest', '<m2:VisualElements', '<m2:VisualElements ToastCapable="true"');
// Set ToastCapable for Windows 8.0
replace('platforms/windows/package.windows80.appxmanifest', '<VisualElements', '<VisualElements ToastCapable="true"');
