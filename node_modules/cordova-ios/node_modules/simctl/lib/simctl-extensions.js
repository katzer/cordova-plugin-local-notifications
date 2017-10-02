/*
The MIT License (MIT)

Copyright (c) 2014 Shazron Abdullah.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    Tail = require('tail').Tail;

var extensions = {
    start: function(deviceid) {
        var is_at_least_xcode_9 = false;

        var command = 'killall Simulator';
        shell.exec(command, { silent: true });

        command = 'xcodebuild -version';
        var output = shell.exec(command, { silent: true }).output;

        // parse output for Xcode version
        var versionMatch = /Xcode (.*)/.exec(output);
        if (!versionMatch) {
            console.log('Unable to parse xcodebuild version.');
            return;
        } else {
            is_at_least_xcode_9 = (parseInt(versionMatch[1]) >= 9);
        }

        if (is_at_least_xcode_9) {
            // Xcode 9 or greater
            command = util.format('xcrun simctl boot "%s"', deviceid);
            shell.exec(command, { silent: true });
            command = 'open `xcode-select -p`/Applications/Simulator.app';
            return shell.exec(command, { silent: true });
        } else {
            // Xcode 8 or older
            command = util.format('xcrun simctl shutdown booted');
            shell.exec(command, { silent: true });
            command = util.format('xcrun instruments -w "%s"', deviceid);
            return shell.exec(command, { silent: true });
        }
    },

    log: function(deviceid, filepath) {
        var tail = new Tail(
            path.join(process.env.HOME, 'Library/Logs/CoreSimulator', deviceid, 'system.log')
        );

        tail.on('line', function(data) {
            if (filepath) {
                fs.appendFile(filepath, data + '\n', function(error) {
                    if (error) {
                        console.error('ERROR: ', error);
                        throw error;
                    }
                });
            } else {
                console.log(data);
            }
        });

        tail.on('error', function(error) {
            console.error('ERROR: ', error);
        });

        return tail;
    }
};

exports = module.exports = extensions;
