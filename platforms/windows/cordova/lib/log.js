/*
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

// requires
var path         = require('path');
var et           = require('elementtree');
var ConfigParser = require('./ConfigParser.js');
var nopt         = require('nopt');

var spawn        = require('cordova-common').superspawn.spawn;
var execSync     = require('child_process').execSync;

// paths
var platformRoot = path.join(__dirname, '..', '..');
var projectRoot  = path.join(platformRoot, '..', '..');
var configPath   = path.join(projectRoot, 'config.xml');

//constants
var APP_TRACING_LOG = 'Microsoft-Windows-AppHost/ApplicationTracing';
var ADMIN_LOG       = 'Microsoft-Windows-AppHost/Admin';
var ONE_MINUTE      = 60 * 1000;

// variables
var appTracingInitialState = null;
var appTracingCurrentState = null;
var adminInitialState      = null;
var adminCurrentState      = null;
var timers                 = [];
var timeDiff               = 10 * ONE_MINUTE; // show last 10 minutes by default
var appName;

/*
 * Gets windows AppHost/ApplicationTracing and AppHost/Admin logs
 * and prints them to console
 */
module.exports.run = function(args) {
    var knownOpts  = { 'minutes' : Number, 'dump' : Boolean, 'help' : Boolean };
    var shortHands = { 'mins' : ['--minutes'], 'h' : ['--help'] };
    var parsedOpts = nopt(knownOpts, shortHands, args, 0);

    if (parsedOpts.help) {
        module.exports.help();
        return;
    }
    if (parsedOpts.dump) {
        if (parsedOpts.minutes) {
            timeDiff = parsedOpts.minutes * ONE_MINUTE;
        }
        dumpLogs(timeDiff);
        return;
    }

    getLogState(ADMIN_LOG).then(function (state) {
        adminInitialState = adminCurrentState = state;
        return getLogState(APP_TRACING_LOG);
    }).then(function (state) {
        appTracingInitialState = appTracingCurrentState = state;
        if (!adminCurrentState) {
            return enableChannel(ADMIN_LOG).then(function () {
                return getLogState(ADMIN_LOG);
            }).then(function (state) {
                adminCurrentState = state;
            });
        }
    }).then(function () {
        if (!appTracingCurrentState) {
            return enableChannel(APP_TRACING_LOG).then(function () {
                return getLogState(APP_TRACING_LOG);
            }).then(function (state) {
                appTracingCurrentState = state;
            });
        }
    }).then(function () {
        if (!adminCurrentState && !appTracingCurrentState) {
            throw 'No log channels enabled. Exiting...';
        }
        try {
            var config = new ConfigParser(configPath);
            appName = config.name();
        } catch (err) {
            console.warn('Unable to read app name from config, showing logs for all applications.');
        }
    }).then(function () {
        console.log('Now printing logs. To stop, press Ctrl+C once.');
        startLogging(ADMIN_LOG);
        startLogging(APP_TRACING_LOG);
    }).catch(function (error) {
        console.error(error);
    });

    // Catch Ctrl+C message and exit gracefully
    process.once('SIGINT', function () {
        exitGracefully(0);
    });

    // Catch SIGTERM message and exit gracefully
    process.once('SIGTERM', function () {
        exitGracefully(0);
    });

    // Catch uncaught exceptions, print trace, then exit gracefully
    process.once('uncaughtException', function(e) {
        console.log(e.stack);
        exitGracefully(1);
    });
};

module.exports.help = function() {
    console.log();
    console.log('Usage: ' + path.relative(process.cwd(), path.join(platformRoot, 'cordova', 'log [options]')));
    console.log('Continuously prints your app logs to the command line.');
    console.log('Please run with Administrator privileges or manually enable Microsoft-Windows-AppHost/ApplicationTracing channel in Event Viewer.');
    console.log();
    console.log('Options:');
    console.log('  --dump: Dumps logs to console instead of continuous output.');
    console.log('  --mins <minutes>: Used only with --dump. Dumps logs starting from this much minutes back.');
    console.log();
    console.log('  Example: ' + path.relative(process.cwd(), path.join(platformRoot, 'cordova', 'log --dump --mins 5')));
    process.exit(0);
};

function exitGracefully(exitCode) {
    if (appTracingInitialState === false && appTracingCurrentState === true) {
        disableChannel(APP_TRACING_LOG);
    }
    if (adminInitialState === false && adminCurrentState === true) {
        disableChannel(ADMIN_LOG);
    }
    timers.forEach(function (timer) {
        clearInterval(timer);
    });
    // give async call some time to execute
    console.log('Exiting in 2 seconds. Do not interrupt the process!');
    setTimeout(function() {
        process.exit(exitCode);
    }, 2000);
}

function startLogging(channel) {
    var lastPollDate = new Date();
    timers.push(setInterval(function() {
        timeDiff = (new Date()).getTime() - lastPollDate.getTime();
        var events = getEvents(channel, timeDiff);
        events.forEach(function (evt) {
            console.log(stringifyEvent(evt));
        });
        lastPollDate = new Date();
    }, 1000));
}

function dumpLogs(timeDiff) {
    console.log('Dumping logs dating back ' + msToHumanReadable(timeDiff));
    var appTracingEvents = getEvents(APP_TRACING_LOG, timeDiff);
    var adminEvents = getEvents(ADMIN_LOG, timeDiff);
    appTracingEvents.concat(adminEvents)
        .sort(function(evt1, evt2) {
            if (evt1.timeCreated < evt2.timeCreated) {
                return -1;
            } else if (evt1.timeCreated > evt2.timeCreated) {
                return 1;
            }
            return 0;
        })
        .forEach(function(evt) {
            console.log(stringifyEvent(evt));
        });
}

function getEvents(channel, timeDiff) {
    var command = 'wevtutil';
    var args    = ['qe', channel, '/q:"*[System [TimeCreated[timediff(@SystemTime)<=' + timeDiff + ']]]"', '/e:root'];
    command     = command + ' ' + args.join(' ');
    var events  = execSync(command);
    return parseEvents(events.toString());
}

function getElementValue(et, element, attribute) {
    var result;

    var found = et.findall(element);
    if (found.length > 0) {
        if (!!attribute) {
            result = found[0].get(attribute);
        } else {
            result = found[0].text;
        }
    }

    return result;
}

function parseEvents(output) {
    var etree = et.parse(output);
    var events = etree.getroot().findall('./Event');
    var results = [];

    events.forEach(function (event) {
        // Get only informative logs
        if ((getElementValue(event, './System/Channel') === ADMIN_LOG) &&
            (typeof getElementValue(event, './UserData/WWAUnhandledApplicationException') === 'undefined') &&
            (typeof getElementValue(event, './UserData/WWATerminateApplication') === 'undefined')) {
            return;
        }
        if ((getElementValue(event, './System/Channel') === APP_TRACING_LOG) &&
            (typeof getElementValue(event, './UserData/WWADevToolBarLog') === 'undefined')) {
            return;
        }

        var result = {
            channel:          getElementValue(event, './System/Channel'),
            timeCreated:      getElementValue(event, './System/TimeCreated', 'SystemTime'),
            pid:              getElementValue(event, './System/Execution', 'ProcessID'),
            source:           getElementValue(event, './UserData/WWADevToolBarLog/Source'),
            documentFile:     getElementValue(event, './UserData/WWADevToolBarLog/DocumentFile') ||
                              getElementValue(event, './UserData/WWAUnhandledApplicationException/DocumentFile') ||
                              getElementValue(event, './UserData/WWATerminateApplication/DocumentFile'),
            displayName:      getElementValue(event, './UserData/WWADevToolBarLog/DisplayName') ||
                              getElementValue(event, './UserData/WWAUnhandledApplicationException/DisplayName') ||
                              getElementValue(event, './UserData/WWATerminateApplication/DisplayName'),
            line:             getElementValue(event, './UserData/WWADevToolBarLog/Line'),
            column:           getElementValue(event, './UserData/WWADevToolBarLog/Column'),
            sourceFile:       getElementValue(event, './UserData/WWAUnhandledApplicationException/SourceFile'),
            sourceLine:       getElementValue(event, './UserData/WWAUnhandledApplicationException/SourceLine'),
            sourceColumn:     getElementValue(event, './UserData/WWAUnhandledApplicationException/SourceColumn'),
            message:          getElementValue(event, './UserData/WWADevToolBarLog/Message'),
            appName:          getElementValue(event, './UserData/WWAUnhandledApplicationException/ApplicationName'),
            errorType:        getElementValue(event, './UserData/WWAUnhandledApplicationException/ErrorType'),
            errorDescription: getElementValue(event, './UserData/WWAUnhandledApplicationException/ErrorDescription') ||
                              getElementValue(event, './UserData/WWATerminateApplication/ErrorDescription'),
            stackTrace:       getElementValue(event, './UserData/WWAUnhandledApplicationException/StackTrace') ||
                              getElementValue(event, './UserData/WWATerminateApplication/StackTrace'),
        };

        // filter out events from other applications
        if (typeof result.displayName !== 'undefined' && typeof appName !== 'undefined' && result.displayName !== appName) {
            return;
        }

        // do not show Process ID, App Name and Display Name for filtered events
        if (typeof appName !== 'undefined') {
            result.pid = undefined;
            result.appName = undefined;
            result.displayName = undefined;
        }

        // cut out uninformative fields
        if ((result.line === '0') && (result.column === '0')) {
            result.line = undefined;
            result.column = undefined;
        }

        // trim whitespace
        if (typeof result.errorDescription !== 'undefined') {
            result.errorDescription = result.errorDescription.trim();
        }
        if (typeof result.message !== 'undefined') {
            result.message = result.message.trim();
        }

        results.push(result);
    });

    return results;
}

function formatField(event, fieldName, fieldShownName, offset) {
    var whitespace = '', // to align all field values
        multiLineWhitespace = ' '; // to align multiline fields (i.e. Stack Trace) correctly
    for (var i = 0; i < offset; i++) {
        if (i >= fieldShownName.length) {
            whitespace += ' ';
        }
        multiLineWhitespace += ' ';
    }

    if (event.hasOwnProperty(fieldName) && (typeof event[fieldName] !== 'undefined')) {
        event[fieldName] = event[fieldName].replace(/\n\s*/g, '\n' + multiLineWhitespace);
        return ('\n' + fieldShownName + ':' + whitespace + event[fieldName]).replace(/\n$/m, '');
    }
    return '';
}

function stringifyEvent(event) {
    if (typeof event === 'undefined') {
        return;
    }

    var result = '',
        offset = 18;

    result += formatField(event, 'channel', 'Channel', offset);
    result += formatField(event, 'timeCreated', 'Time Created', offset);
    result += formatField(event, 'pid', 'Process ID', offset);
    result += formatField(event, 'source', 'Source', offset);
    result += formatField(event, 'documentFile', 'Document File', offset);
    result += formatField(event, 'displayName', 'Display Name', offset);
    result += formatField(event, 'line', 'Line', offset);
    result += formatField(event, 'column', 'Column', offset);
    result += formatField(event, 'message', 'Message', offset);
    result += formatField(event, 'appName', 'App Name', offset);
    result += formatField(event, 'errorType', 'Error Type', offset);
    result += formatField(event, 'errorDescription', 'Error Description', offset);
    result += formatField(event, 'sourceFile', 'Source File', offset);
    result += formatField(event, 'sourceLine', 'Source Line', offset);
    result += formatField(event, 'sourceColumn', 'Source Column', offset);
    result += formatField(event, 'stackTrace', 'Stack Trace', offset);

    return result;
}

function getLogState(channel) {
    return spawn('wevtutil', ['get-log', channel])
    .then(function(output) {
        return output.indexOf('enabled: true') != -1;
    });
}

function enableChannel(channel) {
    console.log('Enabling channel ' + channel);
    return spawn('wevtutil', ['set-log', channel, '/e:false', '/q:true'])
    .then(function() {
        return spawn('wevtutil', ['set-log', channel, '/e:true', '/rt:true', '/ms:4194304','/q:true']);
    }, function() {
        console.warn('Cannot enable log channel: ' + channel);
        console.warn('Try running the script with administrator privileges.');
    });
}

function disableChannel(channel) {
    console.log('Disabling channel ' + channel);
    spawn('wevtutil', ['set-log', channel, '/e:false', '/q:true']);
}

function msToHumanReadable(ms) {
    var m = Math.floor(ms / 60000);
    ms -= m * 60000;
    var s = ms / 1000;
    return m + 'm ' + s + 's';
}
