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

// Requiring ios-sim below has some side effects, mainly,
// it ends up requiring the specific macOS environment bits that
// allow for interacting with iOS Simulators. On Windows+Linux we are
// bound to not-have-that.
if (process.platform === 'darwin') {
    var list_emus = require('../../../../bin/templates/scripts/cordova/lib/list-emulator-images');
    var iossim = require('ios-sim');

    describe('cordova/lib/list-emulator-images', function () {
        describe('run method', function () {
            beforeEach(function () {
                spyOn(iossim, 'getdevicetypes');
            });
            it('should delegate to the ios-sim getdevicetypes method', function () {
                list_emus.run();
                expect(iossim.getdevicetypes).toHaveBeenCalled();
            });
        });
    });
}
