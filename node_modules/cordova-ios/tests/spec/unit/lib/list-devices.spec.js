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

var list_devices = require('../../../../bin/templates/scripts/cordova/lib/list-devices');
var Q = require('q');

describe('cordova/lib/list-devices', function () {
    describe('run method', function () {
        beforeEach(function () {
            spyOn(Q, 'all').and.returnValue(Q.resolve());
            spyOn(Q, 'nfcall');
        });
        it('should invoke proper system calls to retrieve connected devices', function () {
            list_devices.run();
            expect(Q.nfcall).toHaveBeenCalledWith(jasmine.any(Function), jasmine.stringMatching(/system_profiler.*iPad/g));
            expect(Q.nfcall).toHaveBeenCalledWith(jasmine.any(Function), jasmine.stringMatching(/system_profiler.*iPod/g));
            expect(Q.nfcall).toHaveBeenCalledWith(jasmine.any(Function), jasmine.stringMatching(/system_profiler.*iPhone/g));
        });
        it('should trim and split standard output and return as array', function (done) {
            Q.all.and.returnValue(Q.resolve([['   this is\nmy sweet\nstdout\n    ']]));
            list_devices.run()
                .then(function (results) {
                    expect(results).toContain('this is');
                    expect(results).toContain('my sweet');
                    expect(results).toContain('stdout');
                }).fail(function (err) {
                    fail('list-devices fail handler unexpectedly invoked');
                    console.error(err);
                }).done(done);
        });
    });
});
