#!/usr/bin/env node

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

var shell = require('shelljs');

function killSimulator (processName) {
    var result;
    var return_code = 0;
    // check iOS Simulator if running
    var command = 'pgrep -x "' + processName + '" > /dev/null';
    return_code = shell.exec(command).code;

    // if iOS Simulator is running, kill it
    if (return_code === 0) { // found
        shell.echo('iOS Simulator is running as ("' + processName + '"), we\'re going to kill it.');
        result = shell.exec('killall "' + processName + '"');
        if (result.code !== 0) {
            shell.echo('Failed to kill process: ' + processName);
        } else {
            shell.echo('Process was killed: ' + processName);
        }
    }
}

killSimulator('iOS Simulator'); // XCode 6
killSimulator('Simulator'); // XCode 7
