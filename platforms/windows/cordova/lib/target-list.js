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

var devices = require('./package'),
    args = process.argv.slice(2);

// help/usage function
function help() {
    console.log('');
    console.log('Usage: node target-list.js  [ --emulators | --devices | --started_emulators | --all ]');
    console.log('    --emulators         : List the possible target emulators availible.');
    console.log('    --devices           : List the possible target devices availible. *NOT IMPLEMENTED YET*');
    console.log('    --started_emulators : List any started emulators availible. *NOT IMPLEMENTED YET*');
    console.log('    --all               : List all available devices');
    console.log('examples:');
    console.log('    node target-list.js --emulators');
    console.log('    node target-list.js --devices');
    console.log('    node target-list.js --started_emulators');
    console.log('    node target-list.js --all');
    console.log('');
}

// Handle help flag
if (['--help', '/?', '-h', 'help', '-help', '/help'].indexOf(args[0]) > -1) {
    help();
} else {
    devices.listDevices()
    .then(function (deviceList) {
        deviceList.forEach(function (device) {
            console.log(device);
        });
    });
}