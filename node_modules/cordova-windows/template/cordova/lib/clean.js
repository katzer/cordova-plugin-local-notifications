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

var Q     = require('q'),
    path  = require('path'),
    shell = require('shelljs');

var ROOT = path.join(__dirname, '..', '..');

// cleans the project, removes AppPackages and build folders.
module.exports.run = function (argv) {
    var projectPath = ROOT;
    ['AppPackages', 'build'].forEach(function(dir) {
        shell.rm('-rf', path.join(projectPath, dir));
    });
    return Q.resolve();
};