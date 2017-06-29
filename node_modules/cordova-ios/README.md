<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

[![Build status](https://ci.appveyor.com/api/projects/status/github/apache/cordova-ios?branch=master)](https://ci.appveyor.com/project/Humbedooh/cordova-ios)
[![Build Status](https://travis-ci.org/apache/cordova-ios.svg?branch=master)](https://travis-ci.org/apache/cordova-ios)
[![codecov.io](https://codecov.io/github/apache/cordova-ios/coverage.svg?branch=master)](https://codecov.io/github/apache/cordova-ios?branch=master)

Cordova iOS
=============================================================
Cordova iOS is an iOS application library that allows for Cordova-based projects to be built for the iOS Platform. Cordova based applications are, at the core, applications written with web technology: HTML, CSS and JavaScript.

<a href="http://cordova.apache.org">Apache Cordova</a> is a project of <a href="http://apache.org">The Apache Software Foundation (ASF)</a>.

Requires:

* Xcode 8.x or greater. Download it at [http://developer.apple.com/downloads](http://developer.apple.com/downloads) or the [Mac App Store](http://itunes.apple.com/us/app/xcode/id497799835?mt=12).
* [node.js](https://nodejs.org)

:warning: Report issues on the [Apache Cordova issue tracker](https://issues.apache.org/jira/issues/?jql=project%20%3D%20CB%20AND%20status%20in%20%28Open%2C%20%22In%20Progress%22%2C%20Reopened%29%20AND%20resolution%20%3D%20Unresolved%20AND%20component%20%3D%20%22iOS%22%20ORDER%20BY%20priority%20DESC%2C%20summary%20ASC%2C%20updatedDate%20DESC)

Create a Cordova project
-------------------------------------------------------------

Follow the instructions in the [**Command-Line Usage** section](http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface) of [http://docs.cordova.io](http://docs.cordova.io)

To use a **shared CordovaLib**, for example in development, link the appropriate cordova-ios platform folder path:

    cordova platform add --link /path/to/cordova-ios

Updating a Cordova project
-------------------------------------------------------------

When you install a new cordova-cli version that comes with a new iOS platform version, from within your project:

    cordova platform rm ios
    cordova platform add ios

Tests
--------------------------------------------------------------------

1. Run `npm install`
2. Run `npm test`

Futher reading
-----
* [http://cordova.apache.org/](http://cordova.apache.org/)
* [http://wiki.apache.org/cordova/](http://wiki.apache.org/cordova/)
