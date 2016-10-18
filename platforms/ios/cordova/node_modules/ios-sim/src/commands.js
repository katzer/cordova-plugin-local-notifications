/*
The MIT License (MIT)

Copyright (c) 2014 Shazron Abdullah

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

var path = require('path'),
    fs = require('fs'),
    help = require('./help'),
    lib = require('./lib'),
    util = require('util');
    
var command_lib = {
    
    init : function() {
        lib.init();
    },
    
    showsdks : function(args) {
        lib.showsdks();
    },
    
    showdevicetypes : function(args) {
        lib.showdevicetypes();
    },
    
    launch : function(args) {
        var wait_for_debugger = false,
            app_path;
        
        if (args.argv.remain.length < 2) {
            help();
            process.exit(1);
        }
        
        app_path = args.argv.remain[1];
        
        lib.launch(app_path, args.devicetypeid, args.log, args.exit, args.args);
    },

    install : function(args) {
        var app_identifier,
            argv,
            app_path,
            info_plist_path;

        if (args.argv.remain.length < 2) {
            help();
            process.exit(1);
        }
        
        app_path = args.argv.remain[1];

        lib.install(app_path, args.devicetypeid, args.log, args.exit);
    },
    
    start : function(args) {
        lib.start(args.devicetypeid);
    }
};

module.exports = command_lib;

