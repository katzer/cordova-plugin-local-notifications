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

var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('cordova-common').events;
var CordovaError = require('cordova-common').CordovaError;

PodsJson.FILENAME = 'pods.json';

function PodsJson (podsJsonPath) {
    this.path = podsJsonPath;
    this.contents = null;
    this.__dirty = false;

    var filename = this.path.split(path.sep).pop();
    if (filename !== PodsJson.FILENAME) {
        throw new CordovaError(util.format('PodsJson: The file at %s is not `%s`.', this.path, PodsJson.FILENAME));
    }

    if (!fs.existsSync(this.path)) {
        events.emit('verbose', util.format('pods.json: The file at %s does not exist.', this.path));
        events.emit('verbose', 'Creating new pods.json in platforms/ios');
        this.clear();
        this.write();
    } else {
        events.emit('verbose', 'pods.json found in platforms/ios');
        // load contents
        this.contents = fs.readFileSync(this.path, 'utf8');
        this.contents = JSON.parse(this.contents);
    }
}

PodsJson.prototype.get = function (name) {
    return this.contents[name];
};

PodsJson.prototype.remove = function (name) {
    if (this.contents[name]) {
        delete this.contents[name];
        this.__dirty = true;
        events.emit('verbose', util.format('Remove from pods.json for `%s`', name));
    }
};

PodsJson.prototype.clear = function () {
    this.contents = {};
    this.__dirty = true;
};

PodsJson.prototype.destroy = function () {
    fs.unlinkSync(this.path);
    events.emit('verbose', util.format('Deleted `%s`', this.path));
};

PodsJson.prototype.write = function () {
    if (this.contents) {
        fs.writeFileSync(this.path, JSON.stringify(this.contents, null, 4));
        this.__dirty = false;
        events.emit('verbose', 'Wrote to pods.json.');
    }
};

PodsJson.prototype.set = function (name, type, spec, count) {
    this.setJson(name, { name: name, type: type, spec: spec, count: count });
};

PodsJson.prototype.increment = function (name) {
    var val = this.get(name);
    if (val) {
        val.count++;
        this.setJson(val);
    }
};

PodsJson.prototype.decrement = function (name) {
    var val = this.get(name);
    if (val) {
        val.count--;
        if (val.count <= 0) {
            this.remove(name);
        } else {
            this.setJson(val);
        }
    }
};

PodsJson.prototype.setJson = function (name, json) {
    this.contents[name] = json;
    this.__dirty = true;
    events.emit('verbose', util.format('Set pods.json for `%s`', name));
};

PodsJson.prototype.isDirty = function () {
    return this.__dirty;
};

module.exports.PodsJson = PodsJson;
