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

    if (data.indexOf(replace_with) > -1)
        return;

    result = data.replace(new RegExp(to_replace, 'g'), replace_with);

    fs.writeFileSync(filename, result, 'utf8');
}


var manifests = [
    'platforms/windows/package.phone.appxmanifest',
    'platforms/windows/package.windows.appxmanifest',
    'platforms/windows/package.windows80.appxmanifest'
];

for (var i = 0; i < manifests.length; i++) {
    replace_string_in_file(manifests[i], '<m3:VisualElements ', '<m3:VisualElements ToastCapable="true" ');
}
