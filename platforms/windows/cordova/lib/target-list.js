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

var deploy  = require('./deployment'),
    args = process.argv.slice(2);

// help/usage function
function help() {
    console.log('');
    console.log('Usage: node target-list.js [--win10] [ --emulators | --devices | --started_emulators | --all ]');
    console.log('    --win10             : Chooses to list Windows 10 devices (Windows 8.1 is default).');
    console.log('    --emulators         : List the possible target emulators availible.');
    console.log('    --devices           : List the possible target devices availible.');
    console.log('    --started_emulators : List any started emulators availible. *NOT IMPLEMENTED YET*');
    console.log('    --all               : List all available devices');
    console.log('examples:');
    console.log('    node target-list.js --emulators');
    console.log('    node target-list.js --win10 --devices');
    console.log('    node target-list.js --started_emulators');
    console.log('    node target-list.js --all');
    console.log('');
}

// Handle help flag
if (['--help', '/?', '-h', 'help', '-help', '/help'].indexOf(args[0]) > -1) {
    help();
} else {

    var version = '8.1';
    if (args.indexOf('--win10') >= 0) {
        version = '10.0';
    }

    var onlyDevices = false;
    if (args.indexOf('--devices') >= 0) {
        onlyDevices = true;
    }

    var onlyEmulators = false;
    if (args.indexOf('--emulators') >= 0) {
        onlyEmulators = true;
    }

    if (onlyDevices && onlyEmulators) {
        console.error('Cannot specify both --emulators and --devices');
        help();
        return;
    }

    var deploymentTool = deploy.getDeploymentTool(version);
    deploymentTool.enumerateDevices().then(function (deviceList) {
        if (onlyDevices || onlyEmulators) {
            deviceList = deviceList.filter(function(device) {
                return (onlyDevices && device.type === 'device') || (onlyEmulators && device.type === 'emulator');
            });
        }

        deviceList.forEach(function (device) {
            console.log(device.toString());
        });

        if (deviceList.length === 0) {
            console.error('No devices found matching the specified criteria.');
        }
    });
}
