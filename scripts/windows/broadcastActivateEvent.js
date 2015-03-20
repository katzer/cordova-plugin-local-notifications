#!/usr/bin/env node

// This Plugin-Hook sets ToastCapable on true to allow windows-platform
// cordova apps displaing local-notifications

var fs = require('fs'),
    rootdir = process.argv[2];

if (!rootdir)
    return;

function replace_string_in_file (filename, to_replace, replace_with) {
    var data = fs.readFileSync(filename, 'utf8'),
        result;

    // if (data.indexOf(replace_with) > -1)
        // return;

    result = data.replace(new RegExp(to_replace, 'g'), replace_with);

    fs.writeFileSync(filename, result, 'utf8');
}

var snippet =
    "var activatedHandler = function (args) {" +
        "channel.deviceready.subscribe(function () {" +
            "WinJS.Application.queueEvent(args);" +
        "});" +
    "};" +
    "WinJS.Application.addEventListener('activated', activatedHandler, false);" +
    "document.addEventListener('deviceready', function () {" +
        "WinJS.Application.removeEventListener('activated', activatedHandler);" +
    "}, false);" +
    "app.start();";


var files = [
    'platforms/windows/www/cordova.js',
    'platforms/windows/platform_www/cordova.js'
];

setTimeout(function () {
    for (var i = 0; i < files.length; i++) {
        replace_string_in_file(files[i], 'app.start();', '123app.start();');
    }
}, 1000);

console.log(123);
