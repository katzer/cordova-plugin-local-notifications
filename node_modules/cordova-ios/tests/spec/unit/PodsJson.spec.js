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

var path = require('path'),
	util = require('util'),
	CordovaError = require('cordova-common').CordovaError;

var PodsJson = require(path.resolve(path.join(__dirname, '..', '..', '..', 'bin', 'templates', 'scripts', 'cordova', 'lib', 'PodsJson.js'))).PodsJson;
var fixturePodsJson = path.resolve(__dirname, 'fixtures', 'testProj', 'platforms', 'ios', 'pods.json');

// tests are nested in a describe to ensure clean up happens after all unit tests are run
describe('unit tests for Podfile module', function () {
	var podsjson = new PodsJson(fixturePodsJson);

	describe('tests', function () {

		it ('Test 001 : throws CordovaError when the path filename is not named pods.json', function () {
			var dummyPath = 'NotPodsJson';
			expect( function () { 
				new PodsJson(dummyPath);	 
			})
			.toThrow(new CordovaError(util.format('PodsJson: The file at %s is not `%s`.', dummyPath, PodsJson.FILENAME)));
		});

		it ('Test 002 : sets and gets pod test', function () {
			var val0 = {
				name: 'Foo',
				type: 'podspec',
				spec: '1.0',
				count: 1
			};
			podsjson.set(val0.name, val0.type, val0.spec, val0.count);
			var val1 = podsjson.get(val0.name);

			expect(val1).toBeTruthy();
			expect(val1.name).toEqual(val0.name);
			expect(val1.type).toEqual(val0.type);
			expect(val1.spec).toEqual(val0.spec);
			expect(val1.count).toEqual(val0.count);
		});

		it ('Test 003 : setsJson and remove pod test', function () {
			var val0 = {
				name: 'Bar',
				type: 'podspec',
				spec: '2.0',
				count: 2
			};
			podsjson.setJson(val0.name, val0);
			var val1 = podsjson.get(val0.name);

			expect(val1).toBeTruthy();
			expect(val1.name).toEqual(val0.name);
			expect(val1.type).toEqual(val0.type);
			expect(val1.spec).toEqual(val0.spec);
			expect(val1.count).toEqual(val0.count);

			podsjson.remove(val0.name);
			val1 = podsjson.get(val0.name);
			expect(val1).toBeFalsy();
		});
		
		it ('Test 004 : clears all pods', function () {
			var val0 = {
				name: 'Baz',
				type: 'podspec',
				spec: '3.0',
				count: 3
			};
			podsjson.setJson(val0.name, val0);
			podsjson.clear();

			expect(podsjson.get(val0.name)).toBeFalsy();
			expect(podsjson.get('Foo')).toBeFalsy();
			expect(podsjson.get('Bar')).toBeFalsy();
		});

		it ('Test 005 : isDirty tests', function () {
			var val0 = {
				name: 'Foo',
				type: 'podspec',
				spec: '1.0',
				count: 1
			};

			podsjson.setJson(val0.name, val0);
			expect(podsjson.isDirty()).toBe(true);

			podsjson.write();
			expect(podsjson.isDirty()).toBe(false);

			podsjson.remove(val0.name);
			expect(podsjson.isDirty()).toBe(true);
			
			podsjson.clear();
			expect(podsjson.isDirty()).toBe(true);

			podsjson.write();
			expect(podsjson.isDirty()).toBe(false);
		});

		it ('Test 006 : increment and decrement count test', function () {
			var val0 = {
				name: 'Bla',
				type: 'podspec',
				spec: '4.0',
				count: 4
			};
			
			podsjson.setJson(val0.name, val0);
			expect(podsjson.get(val0.name).count).toBe(4);

			podsjson.increment(val0.name);
			expect(podsjson.get(val0.name).count).toBe(5);

			podsjson.decrement(val0.name);
			expect(podsjson.get(val0.name).count).toBe(4);
			podsjson.decrement(val0.name);
			expect(podsjson.get(val0.name).count).toBe(3);
			podsjson.decrement(val0.name);
			expect(podsjson.get(val0.name).count).toBe(2);
			podsjson.decrement(val0.name);
			expect(podsjson.get(val0.name).count).toBe(1);
			
			// this next decrement takes it down to zero, where the pod will just be removed
			podsjson.decrement(val0.name);
			expect(podsjson.get(val0.name)).toBeFalsy();
		});

		it ('Test 007 : writes pods to the pods.json', function () {
			podsjson.clear();

			var vals = {
				'Foo': { name: 'Foo', type: 'podspec', spec: '1.0', count: 1 },
				'Bar': { name: 'Bar', type: 'podspec', spec: '2.0', count: 2 },
				'Baz': { name: 'Baz', type: 'podspec', spec: '3.0', count: 3 }
			};
			
			podsjson.setJson('Foo', vals.Foo);
			podsjson.setJson('Bar', vals.Bar);
			podsjson.setJson('Baz', vals.Baz);

			podsjson.write();

			// verify by reading it back in a new PodsJson 
			var newPodsJson = new PodsJson(fixturePodsJson);
			expect(newPodsJson.get('Foo')).toBeTruthy();
			expect(newPodsJson.get('Bar')).toBeTruthy();
			expect(newPodsJson.get('Baz')).toBeTruthy();

			function podEqual(a, b) {
				return (
					a.name === b.name &&
					a.type === b.type &&
					a.spec === b.spec &&
					a.count === b.count
				);
			}

			expect(podEqual(podsjson.get('Foo'), newPodsJson.get('Foo'))).toBe(true);
			expect(podEqual(podsjson.get('Bar'), newPodsJson.get('Bar'))).toBe(true);
			expect(podEqual(podsjson.get('Baz'), newPodsJson.get('Baz'))).toBe(true);
		});

	});

	it('Test 008 : tear down', function () {
		podsjson.destroy();
	});
});

