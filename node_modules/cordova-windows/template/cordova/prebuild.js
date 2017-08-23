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

// https://issues.apache.org/jira/browse/CB-11658 activated event is not fired on Windows 10 RS1
// Patching start page to include WinJS/base.js reference to HTML as a workaround

module.exports = function patch(platform) {
    console.log('Patching ' + platform + ' in prebuild event...');

    var shell = require('shelljs');
    var path = require('path');
    var url = require('url');

    var basejsSrcMap = {
        '10': '/www/WinJS/js/base.js',
        '8.1': '//Microsoft.WinJS.2.0/js/base.js',
        'phone-8.1': '//Microsoft.Phone.WinJS.2.1/js/base.js'
    };
    var escapedBasejsSrcMap = {
        '10': '\/www\/WinJS\/js\/base\.js',
        '8.1': '\/\/Microsoft\.WinJS\.2\.0\/js\/base\.js',
        'phone-8.1': '\/\/Microsoft\.Phone\.WinJS\.2\.1\/js\/base\.js'
    };
    var basejsSrc = basejsSrcMap[platform];

    var appxmanifestMap = {
        '10': 'package.windows10.appxmanifest',
        '8.1': 'package.windows.appxmanifest',
        'phone-8.1': 'package.phone.appxmanifest'
    };

    // 1. Find start page path in appxmanifest
    var AppxManifest = require('./lib/AppxManifest');
    var appxmanifest = AppxManifest.get(path.join(__dirname, '..', appxmanifestMap[platform]));
    var startPage = url.parse(appxmanifest.getApplication().getStartPage());

    if (startPage.protocol && startPage.protocol.indexOf('http') === 0) {
        console.warn('Warning: Can\'t modify external content.src. You should update your server-side pages to reference WinJS directly in HTML.');
        return;
    }

    // Discard scheme and identity name (host)
    startPage = startPage.pathname;

    // 2. Check if start page HTML contains base.js reference
    var startPageFilePath = shell.ls(path.join(__dirname, '..', startPage))[0];
    var reBaseJs = new RegExp(escapedBasejsSrcMap[platform], 'i');

    if (!startPageFilePath) {
        console.warn('Warning: Start page is missing on the disk. The build must go on but note that this will cause WACK failures.');
        return;
    }

    if (shell.grep(reBaseJs, startPageFilePath).length === 0) {
        // 3. If it doesn't - patch page to include base.js ref before cordova.js
        var appendBaseJsRe = /( *)(<script\s+(?:type="text\/javascript"\s+)?src="(.*\/)?cordova\.js">\s*<\/script>)/;
        var subst = '$1<script type="text/javascript" src="' + basejsSrc + '"></script>\n$1$2';

        shell.sed('-i', appendBaseJsRe, subst, startPageFilePath);
        console.log('Injected base.js reference to the ' + startPage);

        // 4. Remove all 'wrong' base.js references, which might left from another project type build:
        for (var plat in basejsSrcMap) {
            if (plat !== platform) {
                var wrongBaseJsRe = new RegExp('( *)(<script\\s+(?:type="text\\/javascript"\\s+)?src="' + escapedBasejsSrcMap[plat] + '">\\s*<\\/script>)(\\s*)');
                console.log('Removing ' + wrongBaseJsRe + ' from ' + startPage);
                shell.sed('-i', wrongBaseJsRe, '$1', startPageFilePath);
            }
        }
    }
};
