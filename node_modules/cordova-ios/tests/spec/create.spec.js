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
var spec = __dirname;
var path = require('path');
var util = require('util');

var cordova_bin = path.join(spec, '../..', 'bin');
var tmp = require('tmp').dirSync().name;

function createAndBuild (projectname, projectid) {
    var return_code = 0;
    var command;

    // remove existing folder
    command = path.join(tmp, projectname);
    shell.rm('-rf', command);

    // create the project
    command = util.format('"%s/create" "%s/%s" %s "%s"', cordova_bin, tmp, projectname, projectid, projectname);
    shell.echo(command);
    return_code = shell.exec(command).code;
    expect(return_code).toBe(0);

    // build the project
    command = util.format('"%s/cordova/build" --emulator', path.join(tmp, projectname));
    shell.echo(command);
    return_code = shell.exec(command, { silent: true }).code;
    expect(return_code).toBe(0);

    // clean-up
    command = path.join(tmp, projectname);
    shell.rm('-rf', command);
}

describe('create', function () {

    it('Test#001 : create project with ascii name, no spaces', function () {
        var projectname = 'testcreate';
        var projectid = 'com.test.app1';

        createAndBuild(projectname, projectid);
    });

    it('Test#002 : create project with ascii name, and spaces', function () {
        var projectname = 'test create';
        var projectid = 'com.test.app2';

        createAndBuild(projectname, projectid);
    });

    it('Test#003 : create project with unicode name, no spaces', function () {
        var projectname = '応応応応用用用用';
        var projectid = 'com.test.app3';

        createAndBuild(projectname, projectid);
    });

    it('Test#004 : create project with unicode name 2, no spaces', function () {
        var projectname = 'إثرا';
        var projectid = 'com.test.app3.2';

        createAndBuild(projectname, projectid);
    });

    it('Test#005 : create project with unicode name, and spaces', function () {
        var projectname = '応応応応 用用用用';
        var projectid = 'com.test.app4';

        createAndBuild(projectname, projectid);
    });

    it('Test#006 : create project with ascii+unicode name, no spaces', function () {
        var projectname = '応応応応hello用用用用';
        var projectid = 'com.test.app5';

        createAndBuild(projectname, projectid);
    });

    it('Test#007 : create project with ascii+unicode name, and spaces', function () {
        var projectname = '応応応応 hello 用用用用';
        var projectid = 'com.test.app6';

        createAndBuild(projectname, projectid);
    });

    it('Test#008 : create project with ascii name, and spaces, ampersand(&)', function () {
        var projectname = 'hello & world';
        var projectid = 'com.test.app7';

        createAndBuild(projectname, projectid);
    });
});
