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

function Version(major, minor, build, qfe) {
    this.major = major;
    this.minor = zeroIfUndefined(minor);
    this.build = zeroIfUndefined(build);
    this.qfe   = zeroIfUndefined(qfe);
}

function zeroIfUndefined(val) {
    if (typeof val === 'undefined')
        return 0;

    return val;
}

Version.Expression = /^\d{1,8}(\.\d{1,8}){0,3}$/;
Version.fromString = function(str) {
    var result = Version.tryParse(str);
    if (!result)
        throw new RangeError('Could not parse a version from the provided value "' + str + '".');

    return result;
};

Version.tryParse = function(str) {
    if (Version.Expression.test(str)) {
        var parts = str.split('.').map(function(part) {
            return parseInt(part, 10);
        });

        var result = new Version(parts[0], parts[1], parts[2], parts[3]);
        return result;
    }

    return false;
};

Version.comparer = function(a, b) {
    if (a.constructor !== Version || b.constructor !== Version) 
        throw new TypeError('Must compare only Versions');

    if (a.gt(b))
        return 1;
    else if (a.eq(b))
        return 0;

    return -1;
};

Version.prototype.gt = function(other) {
    if (other.constructor !== Version)
        throw new TypeError('other is not a Version.');

    if (this.major > other.major) return true;
    if (this.major < other.major) return false;
    if (this.minor > other.minor) return true;
    if (this.minor < other.minor) return false;
    if (this.build > other.build) return true;
    if (this.build < other.build) return false;
    if (this.qfe > other.qfe) return true;
    if (this.qfe < other.qfe) return false;

    return false;
};

Version.prototype.gte = function(other) {
    if (other.constructor !== Version)
        throw new TypeError('other is not a Version.');

    if (this.major > other.major) return true;
    if (this.major < other.major) return false;
    if (this.minor > other.minor) return true;
    if (this.minor < other.minor) return false;
    if (this.build > other.build) return true;
    if (this.build < other.build) return false;
    if (this.qfe > other.qfe) return true;
    if (this.qfe < other.qfe) return false;

    return true;
};

Version.prototype.eq = function(other) {
    if (other.constructor !== Version)
        throw new TypeError('other is not a Version.');

    if (this.major === other.major && this.minor === other.minor && this.build === other.build && this.qfe === other.qfe)
        return true;

    return false;
};

Version.prototype.toString = function() {
    return this.major + '.' + this.minor + '.' + this.build + '.' + this.qfe;
};

module.exports = Version;
