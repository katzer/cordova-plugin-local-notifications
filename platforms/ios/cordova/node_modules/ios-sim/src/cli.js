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
    command_lib = require('./commands'),
    help = require('./help'),
    nopt;

/*
 * init
 *
 * initializes nopt and simctl
 * nopt, and simctl are require()d in try-catch below to print a nice error
 * message if one of them is not installed.
 */
function init() {
    try {
        nopt = require('nopt');
        command_lib.init();
    } catch (e) {
        console.error(
            'Please run npm install from this directory:\n\t' +
            path.dirname(__dirname)
        );
        process.exit(2);
    }
}

function cli(inputArgs) {
    
    var knownOpts =
        {
            'version' : Boolean,
            'help' : Boolean,
            'verbose' : Boolean,
            'exit' : Boolean,
            'use-gdb' : Boolean,
            'uuid' : String,
            'env' : String,
            'setenv' : String,
            'stdout' : path,
            'stderr' : path,
            'timeout' : Number,
            'args' : Array,
            'devicetypeid' : String
    };

    var shortHands = null;

    // If no inputArgs given, use process.argv.
    inputArgs = inputArgs || process.argv;
    
    init();

    var args = nopt(knownOpts, shortHands, inputArgs);

    process.on('uncaughtException', function(err){
        if (!args.verbose) {
            console.error(err.message);
        } else {
            console.error(err.stack);
        }
        process.exit(1);
    });
    
    var cmd = args.argv.remain[0];
    
    // some options do *not* need commands and can be run
    if (args.help) {
        help();
    } else if (args.version) {
        console.log(require('../package').version);
    } else if (cmd && command_lib[cmd]) { // command found
        command_lib[cmd](args);
    } else {
        help();
        process.exit(1);
    }
}

module.exports = cli;

