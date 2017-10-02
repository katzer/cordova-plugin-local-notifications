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
    util = require('util'),
    Tail = require('tail').Tail,
    SimCtlExtensions = require('./lib/simctl-extensions');

exports = module.exports = {

    set noxpc(b) {
        this._noxpc = b;
    },

    get noxpc() {
        return this._noxpc;
    },

    extensions: SimCtlExtensions,

    check_prerequisites: function() {
        var command = util.format('xcrun simctl help');
        var obj = shell.exec(command, {silent: true});

        if (obj.code !== 0) {
            obj.output  = 'simctl was not found.\n';
            obj.output += 'Check that you have Xcode 8.x installed:\n';
            obj.output += '\txcodebuild --version';
            obj.output += 'Check that you have Xcode 8.x selected:\n';
            obj.output += '\txcode-select --print-path';
        }

        return obj;
    },

    create: function(name, device_type_id, runtime_id) {
        var command = util.format('xcrun simctl create "%s" "%s" "%s"', name, device_type_id, runtime_id);
        return shell.exec(command);
    },

    del: function(device) {
        var command = util.format('xcrun simctl delete "%s"', device);
        return shell.exec(command);
    },

    erase: function(device) {
        var command = util.format('xcrun simctl erase "%s"', device);
        return shell.exec(command);
    },

    boot: function(device) {
        var command = util.format('xcrun simctl boot "%s"', device);
        return shell.exec(command);
    },

    shutdown: function(device) {
        var command = util.format('xcrun simctl shutdown "%s"', device);
        return shell.exec(command);
    },

    rename: function(device, name) {
        var command = util.format('xcrun simctl rename "%s" "%s"', device, name);
        return shell.exec(command);
    },

    getenv: function(device, variable_name) {
        var command = util.format('xcrun simctl getenv "%s" "%s"', device, variable_name);
        return shell.exec(command);
    },

    openurl: function(device, url) {
        var command = util.format('xcrun simctl openurl "%s" "%s"', device, url);
        return shell.exec(command);
    },

    addphoto: function(device, path) {
        var command = util.format('xcrun simctl addphoto "%s" "%s"', device, path);
        return shell.exec(command);
    },

    install: function(device, path) {
        var command = util.format('xcrun simctl install "%s" "%s"', device, path);
        return shell.exec(command);
    },

    uninstall: function(device, app_identifier) {
        var command = util.format('xcrun simctl uninstall "%s" "%s"', device, app_identifier);
        return shell.exec(command);
    },

    launch: function(wait_for_debugger, device, app_identifier, argv) {
        var wait_flag = '';
        if (wait_for_debugger) {
            wait_flag = '--wait-for-debugger';
        }

        var argv_expanded = '';
        if (argv.length > 0) {
            argv_expanded = argv.map(function(arg) {
                return '\'' + arg + '\'';
            }).join(' ');
        }

        var command = util.format('xcrun simctl launch %s "%s" "%s" %s',
        wait_flag, device, app_identifier, argv_expanded);
        return shell.exec(command);
    },

    spawn: function(wait_for_debugger, arch, device, path_to_executable, argv) {
        var wait_flag = '';
        if (wait_for_debugger) {
            wait_flag = '--wait-for-debugger';
        }

        var arch_flag = '';
        if (arch) {
            arch_flag = util.format('--arch="%s"', arch);
        }

        var argv_expanded = '';
        if (argv.length > 0) {
            argv_expanded = argv.map(function(arg) {
                return '\'' + arg + '\'';
            }).join(' ');
        }

        var command = util.format('xcrun simctl spawn %s %s "%s" "%s" %s',
        wait_flag, arch_flag, device, path_to_executable, argv_expanded);
        return shell.exec(command);
    },

    list: function(options) {
        var sublist = '';
        options = options || {};

        if (options.devices) {
            sublist = 'devices';
        } else if (options.devicetypes) {
            sublist = 'devicetypes';
        } else if (options.runtimes) {
            sublist = 'runtimes';
        } else if (options.pairs) {
            sublist = 'pairs';
        }

        var command = util.format('xcrun simctl list %s --json', sublist);
        var obj = shell.exec(command, { silent: options.silent });

        if (obj.code === 0) {
            try {
                obj.json = JSON.parse(obj.output);
            } catch (err) {
                console.error(err.stack);
            }
        }

        return obj;
    },

    notify_post: function(device, notification_name) {
        var command = util.format('xcrun simctl notify_post "%s" "%s"', device, notification_name);
        return shell.exec(command);
    },

    icloud_sync: function(device) {
        var command = util.format('xcrun simctl icloud_sync "%s"', device);
        return shell.exec(command);
    },

    help: function(subcommand) {
        var command = util.format('xcrun simctl help "%s"', subcommand);
        return shell.exec(command);
    }
};
