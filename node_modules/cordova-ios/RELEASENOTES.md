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
## Release Notes for Cordova (iOS) ##

Cordova is a static library that enables developers to include the Cordova API in their iOS application projects easily, and also create new Cordova-based iOS application projects through the command-line.

### 4.4.0 (Apr 22, 2017)
* [CB-12009](https://issues.apache.org/jira/browse/CB-12009) - <resource-file> target attribute ignored on iOS when installing a Cordova plugin
* [CB-12673](https://issues.apache.org/jira/browse/CB-12673) - ios platform does not build on Xcode 8.3.2
* [CB-12665](https://issues.apache.org/jira/browse/CB-12665) - removing engineStrict as it is no longer supported
* [CB-8980](https://issues.apache.org/jira/browse/CB-8980) - Adding resource-file element to config.xml for iOS
* [CB-11895](https://issues.apache.org/jira/browse/CB-11895) - openURL: is deprecated on iOS 10
* [CB-10026](https://issues.apache.org/jira/browse/CB-10026) - Fix warnings in Objective-C tests
* [CB-12617](https://issues.apache.org/jira/browse/CB-12617) - added engine strict for users with older node versions
* [CB-11233](https://issues.apache.org/jira/browse/CB-11233) - Support installing frameworks into "Embedded Binaries" section of the Xcode project
* [CB-12577](https://issues.apache.org/jira/browse/CB-12577) - Fix module import warnings when using Cordova.framework (Carthage)
* [CB-12571](https://issues.apache.org/jira/browse/CB-12571) - Podfile gets overwritten and some dependencies disappear.
* [CB-12050](https://issues.apache.org/jira/browse/CB-12050) - ios: Create shared scheme for framework target, for Carthage support
* [CB-12384](https://issues.apache.org/jira/browse/CB-12384) - ios: Add Cocoa Touch Framework target for CordovaLib functionality
* [CB-12309](https://issues.apache.org/jira/browse/CB-12309) - Missing CLI help for --developmentTeam
* [CB-12405](https://issues.apache.org/jira/browse/CB-12405) - .ipa is uncompressed in preparation for 'run' command during a 'build', resulting in slow builds
* [CB-12523](https://issues.apache.org/jira/browse/CB-12523) - Remove iOS 8 support
* [CB-12522](https://issues.apache.org/jira/browse/CB-12522) - Remove node 0.x support in CI
* [CB-12377](https://issues.apache.org/jira/browse/CB-12377) - Fix bug with updating platform
* [CB-12473](https://issues.apache.org/jira/browse/CB-12473) - Delete the correct build output folder
* [CB-12402](https://issues.apache.org/jira/browse/CB-12402) [CB-12206](https://issues.apache.org/jira/browse/CB-12206) - Properly encode app name to generate XML files
* [CB-12388](https://issues.apache.org/jira/browse/CB-12388) - Fix memory leak due to strong reference
* [CB-12287](https://issues.apache.org/jira/browse/CB-12287) - Remove hardcoded sim build destination
* [CB-12018](https://issues.apache.org/jira/browse/CB-12018) - updated pkg.json with jasmine changes to work with jasmine instead of jasmine-node and rebased off of master branch.
* [CB-12018](https://issues.apache.org/jira/browse/CB-12018) - updated tests to function with jasmine instead of jasmine-node
* [CB-12341](https://issues.apache.org/jira/browse/CB-12341) - Possible crash in [CDVUserAgentUtil releaseLock:]
* [CB-12247](https://issues.apache.org/jira/browse/CB-12247) - Symlinking resource files leads to inability to install app on iOS 10
* [CB-6274](https://issues.apache.org/jira/browse/CB-6274) - Added support for BackgroundColor preference
* [CB-12098](https://issues.apache.org/jira/browse/CB-12098) - Update supportedInterfaceOrientations return type (removed spaces)
* [CB-11810](https://issues.apache.org/jira/browse/CB-11810) - (ios) fix unable to load index page from frameworkpath
* Removed no-longer-working and generally-unused `diagnose_project` script

### 4.3.1 (Dec 01, 2016)

* [CB-12203](https://issues.apache.org/jira/browse/CB-12203) - Updated checked-in node_modules
* [CB-12190](https://issues.apache.org/jira/browse/CB-12190) - create.spec tests fail when a device is connected
* [CB-12155](https://issues.apache.org/jira/browse/CB-12155) - Create tests for launch storyboards
* [CB-12084](https://issues.apache.org/jira/browse/CB-12084) - Update project build settings & plist
* [CB-12130](https://issues.apache.org/jira/browse/CB-12130) - Launch storyboard images are not updated or cleaned
* [CB-11243](https://issues.apache.org/jira/browse/CB-11243) - target-device and deployment-target were being ignored
* [CB-12127](https://issues.apache.org/jira/browse/CB-12127) - Add buildFlag support in build.json
* [CB-12125](https://issues.apache.org/jira/browse/CB-12125) - Unable to emulate on iPad pro iOS 10
* [CB-12118](https://issues.apache.org/jira/browse/CB-12118) - Cordova run ios does not automatically deploy to device
* [CB-12049](https://issues.apache.org/jira/browse/CB-12049) - user-agent string has a unique number appended
* [CB-12098](https://issues.apache.org/jira/browse/CB-12098) - Update supportedInterfaceOrientations return type
* [CB-9762](https://issues.apache.org/jira/browse/CB-9762) - Fix mobilespec 'cordova build' exception.
* Updated bundled ios-sim to version 5.0.12

### 4.3.0 (Oct 21, 2016)

* [CB-12054](https://issues.apache.org/jira/browse/CB-12054) - Remove npm absolute paths in node_modules/package.json (using removeNPMAbsolutePaths utility)
* [CB-12054](https://issues.apache.org/jira/browse/CB-12054) - Updated checked-in node_modules
* Update bundled ios-sim to 5.0.9
* [CB-12003](https://issues.apache.org/jira/browse/CB-12003) - Updated node_modules for cordova-common 1.5.1
* [CB-11999](https://issues.apache.org/jira/browse/CB-11999) - platformAPIs contain js code that is deceptively uncallable
* [CB-11936](https://issues.apache.org/jira/browse/CB-11936) - Support four new App Transport Security (ATS) keys
* [CB-11952](https://issues.apache.org/jira/browse/CB-11952) - Introduce buildFlag option - adds buildFlag option for passing args to xcodebuild 
* [CB-11970](https://issues.apache.org/jira/browse/CB-11970) - Support CocoaPod pod specification other than version
* [CB-11729](https://issues.apache.org/jira/browse/CB-11729) - template file MainViewController.m has deprecated override shouldAutorotateToInterfaceOrientation
* [CB-11957](https://issues.apache.org/jira/browse/CB-11957) - Update docs for remote/local notifications removed in cordova-ios-4.0
* [CB-11920](https://issues.apache.org/jira/browse/CB-11920) - Add github pull request template
* [CB-11860](https://issues.apache.org/jira/browse/CB-11860) - Update packaging strategy for Xcode 8
* [CB-11771](https://issues.apache.org/jira/browse/CB-11771) - Deep symlink directories to target project instead of linking the directory itself
* [CB-10078](https://issues.apache.org/jira/browse/CB-10078) - Refresh cached userAgent on version bump
* [CB-9762](https://issues.apache.org/jira/browse/CB-9762)   - Add launch storyboard support
* [CB-11792](https://issues.apache.org/jira/browse/CB-11792) - Fixed configuration file could not be parsed due to preprocessing errors
* [CB-11854](https://issues.apache.org/jira/browse/CB-11854) - Create Entitlements.plist file (one each for Debug and Release configurations)
* [CB-11863](https://issues.apache.org/jira/browse/CB-11863) - Update README
* [CB-11863](https://issues.apache.org/jira/browse/CB-11863) - Update travis.yml to xcode 7.3 image
* [CB-11863](https://issues.apache.org/jira/browse/CB-11863) - Update xcodebuild minimum version to 7.0.0
* [CB-11862](https://issues.apache.org/jira/browse/CB-11862) - Update ios-deploy minimum version required to 1.9.0
* [CB-11831](https://issues.apache.org/jira/browse/CB-11831) - Add missing LD_RUNPATH_SEARCH_PATHS setting to the Release build configuration
* [CB-11845](https://issues.apache.org/jira/browse/CB-11845) - Add developmentTeam flag to cordova build and 'developmentTeam' key in build.json buildConfig file
* [CB-11811](https://issues.apache.org/jira/browse/CB-11811) - CocoaPods error in cordova-lib tests
* [CB-11790](https://issues.apache.org/jira/browse/CB-11790) - Check that Cocoapods is installed by checking `pod install` return code, show help text
* [CB-11791](https://issues.apache.org/jira/browse/CB-11791) - 'pod install' should pass in the '--verbose' flag, if set
* [CB-11789](https://issues.apache.org/jira/browse/CB-11789) - Generated Podfile should not have an absolute path to .xcodeproj
* [CB-11792](https://issues.apache.org/jira/browse/CB-11792) - Add Cocoapods .xcconfig includes to build.xcconfig files in template, modify create script
* [CB-11712](https://issues.apache.org/jira/browse/CB-11712) - <name> changes in config.xml does a 'search and replace all' for occurrences of the old name with the new name in the pbxproj
* [CB-11788](https://issues.apache.org/jira/browse/CB-11788) - Change create and build scripts to use .xcworkspace
* [CB-11731](https://issues.apache.org/jira/browse/CB-11731) - Re-read ios.json on every prepare
* [CB-11705](https://issues.apache.org/jira/browse/CB-11705) - Adding CordovaDefaultWebViewEngine configuration option to be able to use a different WebView as default and/or fallback
* [CB-11725](https://issues.apache.org/jira/browse/CB-11725) - Update appveyor node versions to 4 and 6, so they will always use the latest versions
* [CB-9789](https://issues.apache.org/jira/browse/CB-9789) - Allow setting the default locale
* [CB-11703](https://issues.apache.org/jira/browse/CB-11703) - travis ci setup is still using 0.10.32 node (specify specific version, using LTS version)
* [CB-11706](https://issues.apache.org/jira/browse/CB-11706) - travis ci setup is not running unit-tests
* [CB-11238](https://issues.apache.org/jira/browse/CB-11238) - Expose supportedOrientations methods so native code can override the current behavior
* [CB-11648](https://issues.apache.org/jira/browse/CB-11648) - Make CDVViewController send notifications when UIViewController methods are called
* [CB-9825](https://issues.apache.org/jira/browse/CB-9825) - Cocoapod integration for plugins
* [CB-11528](https://issues.apache.org/jira/browse/CB-11528) - Remove verbose mode from xcrun in build.js to prevent logging of environment variables.
* [CB-11270](https://issues.apache.org/jira/browse/CB-11270) - Handle JavaScript onclick handler navigation
* [CB-11535](https://issues.apache.org/jira/browse/CB-11535) [CB-10361](https://issues.apache.org/jira/browse/CB-10361) - ios: fix bug with remove frameworks


### 4.2.1 (Jul 26, 2016)
* [CB-11627](https://issues.apache.org/jira/browse/CB-11627) updated `CDVAvailability.h` with new version
* [CB-11627](https://issues.apache.org/jira/browse/CB-11627) added missing license header
* [CB-11627](https://issues.apache.org/jira/browse/CB-11627) Updated checked-in `node_modules`
* [CB-9371](https://issues.apache.org/jira/browse/CB-9371) Fix how prepare handles orientation on **ios**
* [CB-11431](https://issues.apache.org/jira/browse/CB-11431) Document ways to update delegates, preferences and script message handlers in `WebViewEngines`
* [CB-11475](https://issues.apache.org/jira/browse/CB-11475) Ignore unsupported 60x60 icon
* [CB-11426](https://issues.apache.org/jira/browse/CB-11426) Hardcoded path should not be in tests project.

### 4.2.0 (Jun 16, 2016)
* `cordova-ios` now supports node 6!
* [CB-11445](https://issues.apache.org/jira/browse/CB-11445) Updated checked-in `node_modules`
* [CB-11424](https://issues.apache.org/jira/browse/CB-11424) `AppVeyor` test failures (path separator) on `cordova-ios` platform
* [CB-11375](https://issues.apache.org/jira/browse/CB-11375) - onReset method of CDVPlugin is never called
* [CB-11366](https://issues.apache.org/jira/browse/CB-11366) Break out obj-c tests so they are not called from jasmine - Fix for `mktemp` variants (Linux vs Darwin)
* [CB-11117](https://issues.apache.org/jira/browse/CB-11117) Optimize prepare for **iOS** platform, clean prepared files
* [CB-11265](https://issues.apache.org/jira/browse/CB-11265) Remove target checking for `cordova-ios`
* [CB-11259](https://issues.apache.org/jira/browse/CB-11259) Improving build output
* [CB-10695](https://issues.apache.org/jira/browse/CB-10695) Fix issue with unable to deploy to the **iOS** Simulator using `cordova emulate ios`
* [CB-10695](https://issues.apache.org/jira/browse/CB-10695) Replacing `SDK/ARCH` parameters by new destination parameter. Fixes issues when project has targets using different `SDKs`, i.e.: **watchOS** vs **iOS**
* [CB-11069](https://issues.apache.org/jira/browse/CB-11069) `CDVViewController` `appURL` is `nil` if `wwwFolderName` is the path to a framework
* [CB-11200](https://issues.apache.org/jira/browse/CB-11200) Bump `node-xcode` version
* [CB-11235](https://issues.apache.org/jira/browse/CB-11235) `NSInternalInconsistencyException` when running **iOS** unit tests
* [CB-11161](https://issues.apache.org/jira/browse/CB-11161) Reuse `PluginManager` from `cordova-common` to `add/rm` plugins
* [CB-11161](https://issues.apache.org/jira/browse/CB-11161) Bump `cordova-common` to `1.3.0`.
* [CB-11019](https://issues.apache.org/jira/browse/CB-11019) Update tests to validate project name updates
* [CB-11019](https://issues.apache.org/jira/browse/CB-11019) Handle changes of app name gracefully
* [CB-11022](https://issues.apache.org/jira/browse/CB-11022) Duplicate `www` files on plugin installtion/removal
* [CB-6992](https://issues.apache.org/jira/browse/CB-6992) Fix non-working create case, add new test
* [CB-10957](https://issues.apache.org/jira/browse/CB-10957) Remove `build*.xconfig` from build outputs: `*.ipa`, `*.app`
* [CB-10964](https://issues.apache.org/jira/browse/CB-10964) Handle `build.json` file starting with a `BOM`
* [CB-10942](https://issues.apache.org/jira/browse/CB-10942) - Cannot `<allow-navigation href="https://foo.bar" />` for links in that site, if you have `<allow-intent href="https://*" />`

### 4.1.1 (Apr 01, 2016)
* [CB-11006](https://issues.apache.org/jira/browse/CB-11006) Updated CDV version macro to 4.1.1
* [CB-11006](https://issues.apache.org/jira/browse/CB-11006) Added license to loggingHelper.js
* [CB-11006](https://issues.apache.org/jira/browse/CB-11006) Updated checked-in node_modules
* [CB-10320](https://issues.apache.org/jira/browse/CB-10320) Fixes corrupted logo.png
* [CB-10918](https://issues.apache.org/jira/browse/CB-10918) Travis tests are failing sometimes for cordova-ios
* [CB-10912](https://issues.apache.org/jira/browse/CB-10912) Bundling ios-sim 5.0.7 to fix 'Invalid Device State' errors
* [CB-10912](https://issues.apache.org/jira/browse/CB-10912) update ios-sim to 5.0.7 to fix 'Invalid Device State' errors
* [CB-10888](https://issues.apache.org/jira/browse/CB-10888) Enable coverage reports collection via codecov
* [CB-10840](https://issues.apache.org/jira/browse/CB-10840) Use cordova-common.CordovaLogger in cordova-ios
* [CB-10846](https://issues.apache.org/jira/browse/CB-10846) Add status badges for Travis and AppVeyor
* [CB-10846](https://issues.apache.org/jira/browse/CB-10846) Add AppVeyor configuration
* [CB-10773](https://issues.apache.org/jira/browse/CB-10773) Update path delimiters in tests
* [CB-10769](https://issues.apache.org/jira/browse/CB-10769) Update specs according to actual implementation
* [CB-10769](https://issues.apache.org/jira/browse/CB-10769) Copy raw pluginHandler tests from cordova-lib
* revert bad fix for [CB-10828](https://issues.apache.org/jira/browse/CB-10828) I blame node 5.7.0
* [CB-10828](https://issues.apache.org/jira/browse/CB-10828) TypeError: Cannot read property 'indexOf' of null when allow-navigation using scheme:*
* [CB-10773](https://issues.apache.org/jira/browse/CB-10773) Correct FRAMEWORKS_SEARCH_PATHS on win32
* [CB-10673](https://issues.apache.org/jira/browse/CB-10673) fixed conflicting plugin install issue with overlapped <source-file> tag using --force option. This closes #199.

### 4.1.0 (Feb 24, 2016)
* [CB-10693](https://issues.apache.org/jira/browse/CB-10693) added missing header license
* [CB-10530](https://issues.apache.org/jira/browse/CB-10530) Updated `cordova.js`. 
* [CB-10530](https://issues.apache.org/jira/browse/CB-10530) App freezes sometimes directly after starting on **iOS**
* [CB-10668](https://issues.apache.org/jira/browse/CB-10668) checked in `node_modules`
* [CB-10668](https://issues.apache.org/jira/browse/CB-10668) removed `bin/node_modules`
* [CB-10668](https://issues.apache.org/jira/browse/CB-10668) updated `create.js` to grab `node_modules` from root, updated `package.json`
* [CB-10138](https://issues.apache.org/jira/browse/CB-10138)  Adds missing plugin metadata to `plugin_list` module
* [CB-10493](https://issues.apache.org/jira/browse/CB-10493) **iOS** Missing `icon.png`
* [CB-10184](https://issues.apache.org/jira/browse/CB-10184) `Images.xcassets`: A 83.5x83.5@2x app icon is required for iPad apps targeting **iOS 9.0** and later
* Disable `ios-deploy` wifi mode when deploying to a device
* [CB-10272](https://issues.apache.org/jira/browse/CB-10272) Improve `<allow-intent>` and `<allow-navigation>` error logs
* Updated bundled `iso-sim` to `5.0.6`
* [CB-10233](https://issues.apache.org/jira/browse/CB-10233) Support different `config.xml` file per `CDVViewController` instance
* Add additional valid targets for simulation
* Updated CDV version macro to 4.0.1
* [CB-10185](https://issues.apache.org/jira/browse/CB-10185) Update `CordovaLib.xcodeproj` to recommended settings in **Xcode 7.2**
* [CB-10171](https://issues.apache.org/jira/browse/CB-10171) `WebKit` Error after migration to **iOS@4.0.0**
* [CB-10155](https://issues.apache.org/jira/browse/CB-10155) `DisallowOverscroll` not working
* [CB-10168](https://issues.apache.org/jira/browse/CB-10168) `CDVViewController` `appURL` is `nil` if `wwwFolderName` is the path to a resource bundle
* [CB-10162](https://issues.apache.org/jira/browse/CB-10162) update reference url for icon images
* [CB-10162](https://issues.apache.org/jira/browse/CB-10162) correct the paths for **iOS** icon and splashscreen resources

### 4.0.0 (Dec 04, 2015)

* [CB-10136](https://issues.apache.org/jira/browse/CB-10136) - error in cordova prepare (Platform API)
* [CB-10048](https://issues.apache.org/jira/browse/CB-10048) - clobbering of <access> tags to ATS directives [CB-10057](https://issues.apache.org/jira/browse/CB-10057) - removing <access> tag does not remove ATS entry
* [CB-10106](https://issues.apache.org/jira/browse/CB-10106) - added bridge proxy
* [CB-9827](https://issues.apache.org/jira/browse/CB-9827) fixed version file to be requireable
* [CB-9827](https://issues.apache.org/jira/browse/CB-9827) Implement and expose PlatformApi for iOS
* [CB-10106](https://issues.apache.org/jira/browse/CB-10106) - iOS bridges need to take into account bridge changes
* [CB-10072](https://issues.apache.org/jira/browse/CB-10072) - Add SWIFT\_OBJC\_BRIDGING_HEADER value in build.xcconfig, remove from pbxproj
* [CB-10004](https://issues.apache.org/jira/browse/CB-10004) - Rename CDVSystemSchemes plugin name to something more appropriate
* [CB-10001](https://issues.apache.org/jira/browse/CB-10001) [CB-10003](https://issues.apache.org/jira/browse/CB-10003) Handle <allow-navigation> and <allow-intent>
* [CB-10025](https://issues.apache.org/jira/browse/CB-10025) - CDVWhiteList can't parse URIs that don't have double slashes after the scheme
* [CB-9972](https://issues.apache.org/jira/browse/CB-9972) - Remove iOS whitelist
* [CB-9883](https://issues.apache.org/jira/browse/CB-9883) [CB-9948](https://issues.apache.org/jira/browse/CB-9948) Update cordova.js
* [CB-9948](https://issues.apache.org/jira/browse/CB-9948) - Remove deprecated command format from exec.js
* [CB-9883](https://issues.apache.org/jira/browse/CB-9883) - Remove unused iOS bridges
* [CB-9836](https://issues.apache.org/jira/browse/CB-9836) Add .gitattributes to prevent CRLF line endings in repos
* [CB-9787](https://issues.apache.org/jira/browse/CB-9787) - [CDVStartPageTest testParametersInStartPage] unit-test failure
* [CB-9917](https://issues.apache.org/jira/browse/CB-9917) - refix. Order matters in .gitattributes
* [CB-9917](https://issues.apache.org/jira/browse/CB-9917) - Failure: cordova platform add https://github.com/apache/cordova-ios.git#tagOrBranch
* [CB-9870](https://issues.apache.org/jira/browse/CB-9870) updated hello world template
* [CB-9609](https://issues.apache.org/jira/browse/CB-9609) - Cordova run popts don't make it through to ios-deploy on real device
* [CB-9893](https://issues.apache.org/jira/browse/CB-9893) - removed unused line in guide
* [CB-9893](https://issues.apache.org/jira/browse/CB-9893) - Update API changes doc with more upgrade examples
* [CB-9638](https://issues.apache.org/jira/browse/CB-9638) - Typo fix
* [CB-9638](https://issues.apache.org/jira/browse/CB-9638) - Cordova/NSData+Base64.h missing from cordova-ios - updated API Changes doc
* [CB-9836](https://issues.apache.org/jira/browse/CB-9836) Add .gitattributes to prevent CRLF line endings in repos
* [CB-9685](https://issues.apache.org/jira/browse/CB-9685) A fix for the magnifying glass popping up on iOS9 when longpressing the webview. 
* [CB-9800](https://issues.apache.org/jira/browse/CB-9800) Fixing contribute link.
* Updated bundled ios-sim to 5.0.3
* [CB-9500](https://issues.apache.org/jira/browse/CB-9500) Documentation Added
* [CB-9500](https://issues.apache.org/jira/browse/CB-9500) Added no sign argument to iOS build
* [CB-9787](https://issues.apache.org/jira/browse/CB-9787) - [CDVStartPageTest testParametersInStartPage] unit-test failure (improved fix)
* [CB-9787](https://issues.apache.org/jira/browse/CB-9787) - [CDVStartPageTest testParametersInStartPage] unit-test failure
* [CB-9754](https://issues.apache.org/jira/browse/CB-9754) Icon and launch image warnings
* [CB-9719](https://issues.apache.org/jira/browse/CB-9719) set allow_non_modular_includes to yes
* [CB-8789](https://issues.apache.org/jira/browse/CB-8789) - This closes #148
* [CB-9685](https://issues.apache.org/jira/browse/CB-9685) A fix for the magnifying glass popping up on iOS9 when longpressing the webview
* [CB-9552](https://issues.apache.org/jira/browse/CB-9552) Updating linked platform removes original files
* [CB-6992](https://issues.apache.org/jira/browse/CB-6992) - can't deploy app if display name contains unicode characters
* [CB-9726](https://issues.apache.org/jira/browse/CB-9726) - Update minimum Deployment Target to iOS 8.0
* [CB-9679](https://issues.apache.org/jira/browse/CB-9679) - Resource rules issue with iOS 9
* [CB-9721](https://issues.apache.org/jira/browse/CB-9721) Set ENABLE_BITCODE to NO in build.xcconfig
* [CB-9698](https://issues.apache.org/jira/browse/CB-9698) Add rsync error handling in ios copy-www-build-step.js
* [CB-9671](https://issues.apache.org/jira/browse/CB-9671) - Remove installation of ios-sim from travis.yml
* [CB-9693](https://issues.apache.org/jira/browse/CB-9693) Fix www copy with spaces in project name
* [CB-9690](https://issues.apache.org/jira/browse/CB-9690) Can't submit iPad apps to the App Store for iOS 9
* [CB-9328](https://issues.apache.org/jira/browse/CB-9328) Use ios-sim as a node module, not a CLI utility
* [CB-9558](https://issues.apache.org/jira/browse/CB-9558) - Add blob: to allowedSchemes used by CDVUIWebViewDelegate::shouldLoadRequest (closes #163)
* [CB-9558](https://issues.apache.org/jira/browse/CB-9558) - Blob schemes won't load in iframes
* [CB-9667](https://issues.apache.org/jira/browse/CB-9667) - create tests failing in cordova-ios 4.x (related to [CB-8789](https://issues.apache.org/jira/browse/CB-8789) pull request that didn't test for projects with spaces in the name)
* [CB-9650](https://issues.apache.org/jira/browse/CB-9650) - Update API compatibility doc in cordova-ios for AppDelegate.m template change
* [CB-9638](https://issues.apache.org/jira/browse/CB-9638) - Cordova/NSData+Base64.h missing from cordova-ios 4.x
* [CB-8789](https://issues.apache.org/jira/browse/CB-8789) - Support Asset Catalog for App icons and splashscreens
* [CB-8789](https://issues.apache.org/jira/browse/CB-8789) Asset Catalog support
* [CB-9642](https://issues.apache.org/jira/browse/CB-9642) - Integrate 3.9.0, 3.9.1, 3.9.2 version updates in CDVAvailability.h into master
* [CB-9261](https://issues.apache.org/jira/browse/CB-9261) - localizations broken in Xcode template
* [CB-9261](https://issues.apache.org/jira/browse/CB-9261) - localizations broken in Xcode template
* [CB-9656](https://issues.apache.org/jira/browse/CB-9656) - Xcode can't find CDVViewController.h when archiving in Xcode 7.1 beta
* [CB-9254](https://issues.apache.org/jira/browse/CB-9254) - update_cordova_subproject command for cordova-ios 4.0.0-dev results in a build error
* [CB-9636](https://issues.apache.org/jira/browse/CB-9636) - only load a WebView engine if the url to load passes the engine's canLoadRequest filter
* [CB-9610](https://issues.apache.org/jira/browse/CB-9610) Fix warning in cordova-ios under Xcode 7
* [CB-9613](https://issues.apache.org/jira/browse/CB-9613) - CDVWhitelist::matches crashes when there is no hostname in a URL
* [CB-9485](https://issues.apache.org/jira/browse/CB-9485) Use absoluteString method of NSURL
* [CB-8365](https://issues.apache.org/jira/browse/CB-8365) Add NSInteger, NSUInteger factory methods to CDVPluginResult
* [CB-9266](https://issues.apache.org/jira/browse/CB-9266) "cordova run" for iOS does not see non-running emulators
* [CB-9462](https://issues.apache.org/jira/browse/CB-9462) iOS 3.9.0 breaks npm link modules
* [CB-9463](https://issues.apache.org/jira/browse/CB-9463) updated RELEASENOTES
* [CB-9453](https://issues.apache.org/jira/browse/CB-9453) Updating to iOS@3.9.0 not building
* [CB-9406](https://issues.apache.org/jira/browse/CB-9406) updated RELEASENOTES
* [CB-9273](https://issues.apache.org/jira/browse/CB-9273) "Copy www build phase" node is not found
* [CB-9266](https://issues.apache.org/jira/browse/CB-9266) - changed target default to iPhone-5s in the interim
* [CB-9266](https://issues.apache.org/jira/browse/CB-9266) - changed target default to iPhone-5 in the interim
* [CB-8197](https://issues.apache.org/jira/browse/CB-8197) Switch to nodejs for ios platform scripts
* [CB-9203](https://issues.apache.org/jira/browse/CB-9203) - iOS unit-tests should use tmp instead of same folder
* [CB-8468](https://issues.apache.org/jira/browse/CB-8468) - Application freezes if breakpoint hits JavaScript callback invoked from native
* [CB-8812](https://issues.apache.org/jira/browse/CB-8812) - moved system schemes handler into its own plugin (CDVSystemSchemes)
* [CB-8812](https://issues.apache.org/jira/browse/CB-8812) - protocol hander raises error on second firing
* [CB-9050](https://issues.apache.org/jira/browse/CB-9050) - cordova run --list does not show that you have an outdated ios-sim
* [CB-8730](https://issues.apache.org/jira/browse/CB-8730) - Can't deploy to device
* [CB-8788](https://issues.apache.org/jira/browse/CB-8788) - Drop armv7s from default iOS Cordova build to align with Xcode 6
* [CB-9046](https://issues.apache.org/jira/browse/CB-9046) - cordova run ios --emulator --target "iPhone-5, 7.1" (target with runtime) does not work
* [CB-8906](https://issues.apache.org/jira/browse/CB-8906) - cordova run ios --target doesn't work
* Incremented ios-sim version to 4.0.0
* Incremented ios-deploy version to 1.7.0
* Incremented xcodebuild version to 6.0.0
* [CB-8895](https://issues.apache.org/jira/browse/CB-8895) - Change CDVStartPageTests::testParametersInStartPage into an async test
* [CB-8047](https://issues.apache.org/jira/browse/CB-8047) - [WKWebView][iOS8] wkwebview / local webserver plugin orientation issue
* [CB-8838](https://issues.apache.org/jira/browse/CB-8838) - Moved commandQueue push into non-WK_WEBVIEW_BINDING branch. (closes #136)
* [CB-8868](https://issues.apache.org/jira/browse/CB-8868) - ios 4.0.x cannot archive
* [CB-7767](https://issues.apache.org/jira/browse/CB-7767) - Removed NSData+Base64 files, updated unit tests.
* [CB-8710](https://issues.apache.org/jira/browse/CB-8710) - cordova-ios jasmine tests do not clean up build products, tests can only be run once
* [CB-7767](https://issues.apache.org/jira/browse/CB-7767) - Remove usage of NSData+Base64
* [CB-8709](https://issues.apache.org/jira/browse/CB-8709) - Remove usage of obsolete CDVLocalStorage fix in CDVViewController.m (plus style fix-ups)
* [CB-8270](https://issues.apache.org/jira/browse/CB-8270) - Update Objective-C unit tests for JSON serialization. Cleaned up unit test workspace as well.
* [CB-8690](https://issues.apache.org/jira/browse/CB-8690) -  Exported headers were not in Public section, but Project. Moved.
* [CB-8690](https://issues.apache.org/jira/browse/CB-8690) - Group files into folders in CordovaLib/Classes
* [CB-8697](https://issues.apache.org/jira/browse/CB-8697) - Remove obsolete "merges" folder reference in default template(s)
* [CB-5520](https://issues.apache.org/jira/browse/CB-5520) - Remove all frameworks specified in the templates. Rely on implicit Clang Module loading.
* [CB-5520](https://issues.apache.org/jira/browse/CB-5520) - Removed most Build Settings from .pbxproj to .xcconfig
* [CB-5520](https://issues.apache.org/jira/browse/CB-5520) - Added cordova/build*.xcconfig support in the default template (IDE use)
* [CB-8678](https://issues.apache.org/jira/browse/CB-8678) - Mismatched case typo in startup plugin name in config.xml
* [CB-7428](https://issues.apache.org/jira/browse/CB-7428) Add bridging header.  Make sure all deployment targets are 7.0 Add swift runtime to search path (closes #133)
* [CB-7826](https://issues.apache.org/jira/browse/CB-7826) - Add CDVPlugin support for getting items from plugin resource bundles
* [CB-8640](https://issues.apache.org/jira/browse/CB-8640) - Template-ize CDVAvailability.h for coho release tool
* [CB-8678](https://issues.apache.org/jira/browse/CB-8678) - Included core plugins should be added through configuration, not code
* [CB-8643](https://issues.apache.org/jira/browse/CB-8643) - Drop iOS 6 support, minimum iOS 7
* [CB-8677](https://issues.apache.org/jira/browse/CB-8677) - Remove conditional IsAtLeastIosVersion code (plus style fix-ups)
* Update version to 4.0.0 in CDVAvailability.h
* [CB-8556](https://issues.apache.org/jira/browse/CB-8556) - handleOpenURL functionality to be removed to a plugin
* [CB-8474](https://issues.apache.org/jira/browse/CB-8474) - Remove local/remote push notification delegates from CDVAppDelegate
* [CB-8464](https://issues.apache.org/jira/browse/CB-8464) - Remove non-ARC code in AppDelegate
* [CB-8473](https://issues.apache.org/jira/browse/CB-8473) - Remove AppDelegate code from template (includes uncrustify style fix-ups)
* [CB-8664](https://issues.apache.org/jira/browse/CB-8664) - Make CDVPlugin initializer private
* [CB-7753](https://issues.apache.org/jira/browse/CB-7753) - Remove CDV_IsIPad and CDV_IsIPhone5 macros in CDVAvailabiltyDeprecated.h
* [CB-7000](https://issues.apache.org/jira/browse/CB-7000) - Remove deprecated CDVPlugin and CDVPluginResult methods
* Make webView property dynamic in CDVViewController and CDVPlugin (from CDVWebViewEngineProtocol reference). Added scrollView category to UIView for backwards compatibility reasons.
* [CB-8032](https://issues.apache.org/jira/browse/CB-8032) - Added a typedef for block definition.
* [CB-8032](https://issues.apache.org/jira/browse/CB-8032) - Add new property in CDVCommandDelegate (urlTransformer), plus style fixups.
* [CB-6884](https://issues.apache.org/jira/browse/CB-6884) - Support new Cordova bridge under iOS 8 WKWebView (typo fix)
* [CB-7184](https://issues.apache.org/jira/browse/CB-7184) - Implement support for mediaPlaybackAllowsAirPlay in UIWebView and WKWebView
* [CB-7047](https://issues.apache.org/jira/browse/CB-7047) - typo fix
* [CB-7047](https://issues.apache.org/jira/browse/CB-7047) - Support config.xml preferences for WKWebView
* [CB-7182](https://issues.apache.org/jira/browse/CB-7182) - Running mobile-spec in an iOS 8 project but using UIWebView results in an exception
* [CB-6884](https://issues.apache.org/jira/browse/CB-6884) - Support new Cordova bridge under iOS 8 WKWebView (typo fix)
* [CB-7047](https://issues.apache.org/jira/browse/CB-7047) - Support config.xml preferences for WKWebView
* [CB-7182](https://issues.apache.org/jira/browse/CB-7182) - Running mobile-spec in an iOS 8 project but using UIWebView results in an exception
* Split into Public and Private headers more clearly. Delete most deprectated symbols.

### 3.9.2 (Oct 30, 2015)

* Adds deprecation warnings for upcoming 4.0.0 release
* [CB-9721](https://issues.apache.org/jira/browse/CB-9721) Set ENABLE_BITCODE to NO in build.xcconfig
* Enable NSAllowsArbitraryLoads by default
* [CB-9679](https://issues.apache.org/jira/browse/CB-9679) Resource rules issue with iOS 9
* [CB-9656](https://issues.apache.org/jira/browse/CB-9656) Xcode can't find CDVViewController.h when archiving in Xcode 7.1 beta
* [CB-9610](https://issues.apache.org/jira/browse/CB-9610) Fix warning in cordova-ios under Xcode 7
* [CB-9690](https://issues.apache.org/jira/browse/CB-9690) Can't submit iPad apps to the App Store for iOS 9
* [CB-9046](https://issues.apache.org/jira/browse/CB-9046) cordova run ios --emulator --target "iPhone-5, 7.1" (target with runtime) does not work
* Blob schemes won't load in iframes

### 3.9.1 (20150805) ###

* [CB-9453](https://issues.apache.org/jira/browse/CB-9453) Fixed Updating to iOS@3.9.0 not building 

### 3.9.0 (20150728) ###

* [CB-8586](https://issues.apache.org/jira/browse/CB-8586) Update ios-deploy minimum version to 1.4.0
* [CB-8485](https://issues.apache.org/jira/browse/CB-8485) Support for signed archive for iOS
* [CB-8197](https://issues.apache.org/jira/browse/CB-8197) Switch to nodejs for ios platform scripts
* [CB-7747](https://issues.apache.org/jira/browse/CB-7747) Update project template with new whitelist settings
* [CB-8954](https://issues.apache.org/jira/browse/CB-8954) Adds `requirements` command support to check_reqs module
* [CB-8907](https://issues.apache.org/jira/browse/CB-8907) Cordova ios emulate --list it shows duplicates when ios simulators are present for 7.x and 8.x
* [CB-9013](https://issues.apache.org/jira/browse/CB-9013) Fix listing of multiple devices in list-devices for iOS
* [CB-3360](https://issues.apache.org/jira/browse/CB-3360) Set custom User-Agent
* [CB-8710](https://issues.apache.org/jira/browse/CB-8710) Cordova-ios jasmine tests do not clean up build products, tests can only be run once
* [CB-8785](https://issues.apache.org/jira/browse/CB-8785) Add try/catch for evalJS
* [CB-8948](https://issues.apache.org/jira/browse/CB-8948) Clipboard fix for iOS Safari copy
* [CB-8855](https://issues.apache.org/jira/browse/CB-8855) Fix display ios devices with --list
* [CB-8295](https://issues.apache.org/jira/browse/CB-8295) Update app template with fix to CSP string
* [CB-8965](https://issues.apache.org/jira/browse/CB-8965) Copy cordova-js-src directory to platform folder during create
* [CB-9273](https://issues.apache.org/jira/browse/CB-9273) "Copy www build phase" node is not found
* [CB-9088](https://issues.apache.org/jira/browse/CB-9088) Sms urls won't open in iframe
* [CB-8621](https://issues.apache.org/jira/browse/CB-8621) Fix Q require in list-devices (Q -> q)

### 3.8.0 (201502XX) ###

* [CB-8436](https://issues.apache.org/jira/browse/CB-8436) Remove more bad quotes from build command
* [CB-8436](https://issues.apache.org/jira/browse/CB-8436) Remove unneeded "" when composing xcodebuild arguments (closes #130)
* [CB-8084](https://issues.apache.org/jira/browse/CB-8084) Allow for a way to disable push notification delegate methods (through xcconfig). Style fixup using uncrustify.
* [CB-7606](https://issues.apache.org/jira/browse/CB-7606) handleOpenURL not working correctly on cold start (handler not evaluated yet) and warm start
* [CB-8435](https://issues.apache.org/jira/browse/CB-8435) Enable jshint for iOS platform
* [CB-8417](https://issues.apache.org/jira/browse/CB-8417) moved platform specific js into platform
* [CB-8336](https://issues.apache.org/jira/browse/CB-8336) Remove plugin prefs from iOS defaults.xml
* [CB-8254](https://issues.apache.org/jira/browse/CB-8254) Enable use of .xcconfig when building for emulator
* [CB-8351](https://issues.apache.org/jira/browse/CB-8351) Deprecate all non-prefixed class extensions
* [CB-8358](https://issues.apache.org/jira/browse/CB-8358) Make --link an alias for --shared plus some code simplification.
* [CB-8197](https://issues.apache.org/jira/browse/CB-8197) Convert all bash scripts to node.js (closes #126)
* [CB-8314](https://issues.apache.org/jira/browse/CB-8314) Speed up Travis CI (close #125)
* [CB-8036](https://issues.apache.org/jira/browse/CB-8036) Don't exclude bin/node_modules from npm pack (via .gitignore)
* [CB-7872](https://issues.apache.org/jira/browse/CB-7872) Fix CODE_SIGN_RESOURCE_RULES_PATH being set wrong in xcconfig (closes #120)
* [CB-8168](https://issues.apache.org/jira/browse/CB-8168) `cordova/run --list` support for iOS (closes #122)
* [CB-8044](https://issues.apache.org/jira/browse/CB-8044) support for --nobuild flag in run script
* [CB-6637](https://issues.apache.org/jira/browse/CB-6637) Removed - request:isFragmentIdentifierToRequest: deprecated method in CDVWebViewDelegate (closes #121)
* [CB-8002](https://issues.apache.org/jira/browse/CB-8002) (CB-7735) Update cordova.js to include bridge fix
* [CB-5706](https://issues.apache.org/jira/browse/CB-5706) convert some of the bash scripts to nodejs (closes #118)
* [CB-8506](https://issues.apache.org/jira/browse/CB-8506) Use npm version of uncrustify in cordova-ios (devDependency only)
* Have CordovaLib classes import CDVJSON_private.h rather than CDVJSON.h
* Trim down checked-in node_module files to minimal set

### 3.7.0 (20141106) ###

* [CB-7882](https://issues.apache.org/jira/browse/CB-7882) - viewDidUnload instance method is missing [super viewDidUnload] call
* [CB-7872](https://issues.apache.org/jira/browse/CB-7872) - XCode 6.1's xcrun PackageApplication fails at packaging / resigning Cordova applications (closes #115)
* [CB-6510](https://issues.apache.org/jira/browse/CB-6510) - Support for ErrorUrl preference on iOS
* [CB-7857](https://issues.apache.org/jira/browse/CB-7857) - Load appURL after plugins have loaded
* [CB-7606](https://issues.apache.org/jira/browse/CB-7606) - handleOpenURL handler firing more than necessary
* [CB-7597](https://issues.apache.org/jira/browse/CB-7597) - Localizable.strings for Media Capture are in the default template, it should be in the plugin
* [CB-7818](https://issues.apache.org/jira/browse/CB-7818) - CLI builds ignore Distribution certificates (closes #114)
* [CB-7729](https://issues.apache.org/jira/browse/CB-7729) - Support ios-sim 3.0 (Xcode 6) and new targets (iPhone 6/6+) (closes #107)
* [CB-7813](https://issues.apache.org/jira/browse/CB-7813) - Added unit test
* [CB-7813](https://issues.apache.org/jira/browse/CB-7813) - CDVWebViewDelegate fails to update the webview state properly in iOS
* [CB-7812](https://issues.apache.org/jira/browse/CB-7812) - cordova-ios xcode unit-tests are failing from npm test, in Xcode it is fine
* [CB-7643](https://issues.apache.org/jira/browse/CB-7643) - made isValidCallbackId threadsafe
* [CB-7735](https://issues.apache.org/jira/browse/CB-7735) - Update cordova.js snapshot with the bridge fix
* [CB-2520](https://issues.apache.org/jira/browse/CB-2520) - built interim js from cordova-js for custom user agent support
* [CB-2520](https://issues.apache.org/jira/browse/CB-2520) - iOS - "original" user agent needs to be overridable (closes #112)
* [CB-7777](https://issues.apache.org/jira/browse/CB-7777) - In AppDelegate, before calling handleOpenURL check whether it exists first to prevent exceptions (closes #109)
* [CB-7775](https://issues.apache.org/jira/browse/CB-7775) - Add component.json for component and duo package managers (closes #102)
* [CB-7493](https://issues.apache.org/jira/browse/CB-7493) - Add e2e test for 'space-in-path' and 'unicode in path/name' for core platforms (moved from root folder).
* [CB-7493](https://issues.apache.org/jira/browse/CB-7493) - Adds test-build command to package.json
* [CB-7630](https://issues.apache.org/jira/browse/CB-7630) - Deprecate CDV_IsIPhone5 and CDV_IsIPad macro in CDVAvailability.h
* [CB-7727](https://issues.apache.org/jira/browse/CB-7727) - add resolution part to 'backup to icloud' warning message
* [CB-7627](https://issues.apache.org/jira/browse/CB-7627) - Remove duplicate reference to the same libCordova.a.
* [CB-7648](https://issues.apache.org/jira/browse/CB-7648) - [iOS 8] Add iPhone 6 Plus icon to default template
* [CB-7632](https://issues.apache.org/jira/browse/CB-7632) - [iOS 8] Add launch image definitions to Info.plist
* [CB-7631](https://issues.apache.org/jira/browse/CB-7631) - CDVUrlProtocol - the iOS 8 NSHttpUrlResponse is not initialized with the statuscode
* [CB-7596](https://issues.apache.org/jira/browse/CB-7596) - [iOS 8] CDV_IsIPhone5() Macro needs to be updated because screen size is now orientation dependent
* [CB-7560](https://issues.apache.org/jira/browse/CB-7560) - Tel and Mailto links don't work in iframe
* [CB-7450](https://issues.apache.org/jira/browse/CB-7450) - Fix deprecations in cordova-ios unit tests
* [CB-7546](https://issues.apache.org/jira/browse/CB-7546) - [Contacts][iOS] Prevent exception when index is out of range
* [CB-7450](https://issues.apache.org/jira/browse/CB-7450) - Fix deprecations in cordova-ios unit tests (interim checkin)
* [CB-7502](https://issues.apache.org/jira/browse/CB-7502) - iOS default template is missing CFBundleShortVersionString key in Info.plist, prevents iTunes Connect submission
* Changed CordovaLibTests to run in a xcworkspace, and runnable from the command line
* Move CordovaLibTests into tests/
* Add ios-sim version check (3.0) to cordova/lib/list-emulator-images
* Fix cordova/lib/install-emulator to pass in the correct prefix for ios-sim --devicetypeid
* Fix cordova/lib/list-started-emulators for Xcode 6
* Remove non-working applescript to start emulator, use Instruments to start iOS Simulator now.
* Add support for the iPod in cordova/lib/list-devices script.
* Remove "Valid values for --target" in script headers. Use "cordova/lib/list-emulator-images" to get the list.
* Update cordova/lib/list-emulator-images for ios-sim 3.0
* Increment ios-deploy min version to 1.2.0 and ios-sim min version to 3.0
* Updated cordova/build script to use specific SHARED_PRECOMPS_DIR variable.
* Update .gitignore to not ignore .xcworkspace files


### 3.6.3 (20140908) ###

* Updated default template.
* [CB-7432](https://issues.apache.org/jira/browse/CB-7432) - iOS - Version script should be updated by coho at release time
* [CB-5535](https://issues.apache.org/jira/browse/CB-5535) - ignore unused arguments in bin/create (e.g --arc), remove --arc references in bin/create
* [CB-6897](https://issues.apache.org/jira/browse/CB-6897) - nil callbackId in isValidCallbackId() causes regex match to throw exception
* [CB-6897](https://issues.apache.org/jira/browse/CB-6897) - Added unit test
* [CB-7169](https://issues.apache.org/jira/browse/CB-7169) Fix __PROECT_NAME__ replacing code in create script
* Remove trailing whitespace from project template's .plist, .pch
* [CB-7187](https://issues.apache.org/jira/browse/CB-7187) Delete CDVShared.m & remove dependency on CoreLocation
* Fix warning in MainViewController.m (spurious semi-colon)
* [CB-7162](https://issues.apache.org/jira/browse/CB-7162) - cordova-ios pre-commit hook can't find uncrustify in path in Git GUI apps
* [CB-7134](https://issues.apache.org/jira/browse/CB-7134) - Deprecate CDVPluginResult methods
* [CB-7043](https://issues.apache.org/jira/browse/CB-7043) - property "statusCode" of CDVHTTPURLResponse conflicts with superclass property statusCode of NSHTTPURLResponse
* [CB-6165](https://issues.apache.org/jira/browse/CB-6165) - Removing the "OK" String from success callback
* Update version of NSData+Base64 to get a more normal license on it
* Minor uncrustification of a few files
* Update LICENSE to include shelljs's license
* Remove LICENSE entries for files that we no longer use
* [CB-6579](https://issues.apache.org/jira/browse/CB-6579) - update deprecation to use CDV_DEPRECATED macro
* [CB-6998](https://issues.apache.org/jira/browse/CB-6998) - Remove CDVCommandDelegate::execute deprecated call (deprecated since 2.2)
* [CB-6997](https://issues.apache.org/jira/browse/CB-6997) - Deprecate obsolete CDVPlugin methods
* Fix minor grammar in CDVLocalStorage iCloud warning.
* [CB-6785](https://issues.apache.org/jira/browse/CB-6785) - Add license to CONTRIBUTING.md
* [CB-6729](https://issues.apache.org/jira/browse/CB-6729) - Update printDeprecationNotice to new name, and new warning for iOS < 6.0
* [CB-5651](https://issues.apache.org/jira/browse/CB-5651) - [iOS] make visible the version of the Cordova native lib


### 3.5.0 (20140522) ###

* [CB-6638](https://issues.apache.org/jira/browse/CB-6638) - Convert CordovaLibTests to XCTests
* [CB-6579](https://issues.apache.org/jira/browse/CB-6579) - CDVWebViewDelegateTests are failing
* [CB-6580](https://issues.apache.org/jira/browse/CB-6580) - CDVWhitelistTests are failing
* [CB-6578](https://issues.apache.org/jira/browse/CB-6578) - Fix CordovaLibTests not building
* [CB-6553](https://issues.apache.org/jira/browse/CB-6553) added top-level package.json file
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* [CB-6500](https://issues.apache.org/jira/browse/CB-6500) - Cordova requires arm64 architecture.
* [CB-6383](https://issues.apache.org/jira/browse/CB-6383) Fix copy-www-build-step.sh when user has macports installed
* [CB-6327](https://issues.apache.org/jira/browse/CB-6327) Allow '.' in plugin feature names (and therefore callback ids)
* [CB-6287](https://issues.apache.org/jira/browse/CB-6287) - Add build script support for arm64
* [CB-6340](https://issues.apache.org/jira/browse/CB-6340) - Adding rebroadcast capabilities to remote notification registration within AppDelegate (closes #94)
* [CB-6217](https://issues.apache.org/jira/browse/CB-6217) iOS simulator targets not consistent across scripts
* [CB-5286](https://issues.apache.org/jira/browse/CB-5286) - Fix warnings when compiled under arm64
* [CB-4863](https://issues.apache.org/jira/browse/CB-4863) - Drop iOS 5.0 support, and support arm64 (closes #90)
* [CB-6149](https://issues.apache.org/jira/browse/CB-6149) - AppDelegate uses deprecated handleOpenURL
* [CB-6150](https://issues.apache.org/jira/browse/CB-6150) - objc_msgSend causes EXC_BAD_ACCESS with plugins on arm64
* [CB-5018](https://issues.apache.org/jira/browse/CB-5018) - bin/create on iOS should use --arc by default
* [CB-5943](https://issues.apache.org/jira/browse/CB-5943) - Update/remove obsolete items in cordova-ios repo
* [CB-5395](https://issues.apache.org/jira/browse/CB-5395) Make scheme and host (but not path) case-insensitive in whitelist
* [CB-5991](https://issues.apache.org/jira/browse/CB-5991) Fix whitelist path matching for trailing slashes
* [CB-5967](https://issues.apache.org/jira/browse/CB-5967) Fix isTopLevelNavigation not being set correctly in rare cases.
* Validate that callback IDs are always well-formed
* Removed obsolete .gitmodules
* Update Xcode .pbxproj files according to Xcode 5.1 recommendations
* Added NSLog notification for beginning backup to iCloud (closes #96)
 
### 3.4.1 (201403XX) ###
 
* Update Xcode .pbxproj files according to Xcode 5.1 recommendations
* [CB-6327](https://issues.apache.org/jira/browse/CB-6327) Allow '.' in plugin feature names (and therefore callback ids)
* [CB-6287](https://issues.apache.org/jira/browse/CB-6287) - Add build script support for arm64
* [CB-6217](https://issues.apache.org/jira/browse/CB-6217) iOS simulator targets not consistent across scripts
* [CB-5286](https://issues.apache.org/jira/browse/CB-5286) - Fix warnings when compiled under arm64
* [CB-4863](https://issues.apache.org/jira/browse/CB-4863) - Drop iOS 5.0 support, and support arm64
* [CB-6150](https://issues.apache.org/jira/browse/CB-6150) - objc\_msgSend causes EXC\_BAD\_ACCESS with plugins on arm64
* Validate that callback IDs are always well-formed
* [CB-5018](https://issues.apache.org/jira/browse/CB-5018) - bin/create on iOS should use --arc by default

### 3.4.0 (201402XX) ###

* [CB-5794](https://issues.apache.org/jira/browse/CB-5794) iOS build script: 1. don't clean 2. recognize --emulator vs --device
* [CB-4910](https://issues.apache.org/jira/browse/CB-4910) Update CLI project template to point to config.xml at the root now that it's not in www/ by default.
* Fix create script copying project template twice.
* [CB-5740](https://issues.apache.org/jira/browse/CB-5740) Use UIScrollViewDecelerationRateNormal by default.
* [CB-5420](https://issues.apache.org/jira/browse/CB-5420) Add device model to User-Agent cache key.
* Copy config.xml within copy-www-build-step.sh instead of in Copy Resources step
* [CB-5397](https://issues.apache.org/jira/browse/CB-5397) Add a --cli option to bin/create that has ../../www/ ../../merges/ within the project
* [CB-5697](https://issues.apache.org/jira/browse/CB-5697) Fix location.reload() not firing deviceready.
* [CB-4330](https://issues.apache.org/jira/browse/CB-4330) Fix hash changes being treated as top-level navigations
* [CB-3359](https://issues.apache.org/jira/browse/CB-3359) Parse large JSON payloads on a background thread, and yield when executing multiple commands is taking too long.
* [CB-5134](https://issues.apache.org/jira/browse/CB-5134) Add location.hash based exec() bridge.
* [CB-5658](https://issues.apache.org/jira/browse/CB-5658) Fix whitelist crash when URL path has a space.
* [CB-5583](https://issues.apache.org/jira/browse/CB-5583) WebView doesn't properly initialize when instantiated from a xib
* [CB-5046](https://issues.apache.org/jira/browse/CB-5046) Adding a defaults.xml template
* [CB-5290](https://issues.apache.org/jira/browse/CB-5290) templates: Updated launch images sizes to include the status bar region
* [CB-5276](https://issues.apache.org/jira/browse/CB-5276) Add ability to load start page from a place other then the bundle folder
* [CB-5298](https://issues.apache.org/jira/browse/CB-5298) Have bin/create run bin/check_reqs.
* [CB-5328](https://issues.apache.org/jira/browse/CB-5328) Fix .gitignore from cordova-ios excludes `platforms/cordova/build` file

### 3.3.0 (20131214) ###

* No significant changes.

### 3.2.0 (20131120) ###

* [CB-5124](https://issues.apache.org/jira/browse/CB-5124) - Remove splashscreen config.xml values from iOS Configuration Docs, move to plugin docs
* [CB-5229](https://issues.apache.org/jira/browse/CB-5229) - cordova/emulate important improvements (stderr, check ios-sim before build)
* [CB-5058](https://issues.apache.org/jira/browse/CB-5058) - CordovaLib xcode project gets assigned problematic Build Active Architecture Only settings.
* [CB-5217](https://issues.apache.org/jira/browse/CB-5217) - cordova emulate ios doesn't exit
* [CB-4805](https://issues.apache.org/jira/browse/CB-4805) - Update cordova/run and cordova/lib/install-device to use latest ios-deploy for iOS 7
* [CB-5103](https://issues.apache.org/jira/browse/CB-5103) - Fix cordova/run: --emulate should be --emulator (fix CLI usage)
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) - added iOS sdk version scripts
* [CB-5099](https://issues.apache.org/jira/browse/CB-5099) - Add missing icons especially iOS 7 120x120 icon to default template
* [CB-5037](https://issues.apache.org/jira/browse/CB-5037) - Fix bridge sometimes not resetting properly during page transitions
* [CB-4990](https://issues.apache.org/jira/browse/CB-4990) - Can't run emulator from cordova cli
* [CB-4978](https://issues.apache.org/jira/browse/CB-4978) - iOS - Remove HideKeyboardFormAccessoryBar and KeyboardShrinksView preferences in config.xml
* [CB-4935](https://issues.apache.org/jira/browse/CB-4935) - iOS - Remove Keyboard preferences code into its own plugin
* Make CDVWebViewDelegate able to load pages after a failed load.
* Prevented automatic logging of whitelist failures.

### 3.1.0 (20131001) ###

* [CB-3020](https://issues.apache.org/jira/browse/CB-3020) HideKeyboardFormAccessoryBar and KeyboardShrinksView show white bar instead of removing it
* [CB-4799](https://issues.apache.org/jira/browse/CB-4799) Add update script for iOS.
* [CB-4829](https://issues.apache.org/jira/browse/CB-4829) Xcode 5 simulated device names are different (and includes a new 64-bit device)
* [CB-4827](https://issues.apache.org/jira/browse/CB-4827) iOS project/cordova/check\_reqs script should be used by all the scripts
* [CB-4530](https://issues.apache.org/jira/browse/CB-4530) iOS bin/check\_reqs script should check for xcode 4.6 as minimum, and exit with code 2 if error occurs
* [CB-4537](https://issues.apache.org/jira/browse/CB-4537) iOS bin/create script should copy check\_reqs script into project/cordova folder
* [CB-4803](https://issues.apache.org/jira/browse/CB-4803) Set new iOS 7 preferences for the UIWebView in CDVViewController
* [CB-4801](https://issues.apache.org/jira/browse/CB-4801) Add new iOS 7 properties for UIWebView in the config.xml &lt;preferences&gt;
* [CB-4687](https://issues.apache.org/jira/browse/CB-4687) Fix Xcode 5 static analyzer issues
* [CB-4469](https://issues.apache.org/jira/browse/CB-4469) Move copy-build-www-step.sh into scripts template
* [CB-4539](https://issues.apache.org/jira/browse/CB-4539) Cannot create CDVViewController in Storyboard
* [CB-4654](https://issues.apache.org/jira/browse/CB-4654) Wherein it is discovered that cp is too smart for its own good
* [CB-4469](https://issues.apache.org/jira/browse/CB-4469) Move copy\_www.sh to cordova/lib/copy-www-build-step.sh
* [CB-4654](https://issues.apache.org/jira/browse/CB-4654) Exclude platform scripts from template directory; copy those separately
* [CB-4654](https://issues.apache.org/jira/browse/CB-4654) Allow default project template to be overridden on create
* [CB-4706](https://issues.apache.org/jira/browse/CB-4706) Update compiler in CordovaLib.xcodeproj to "default compiler"
* [CB-4707](https://issues.apache.org/jira/browse/CB-4707) Update compiler in default template xcodeproj to "default compiler"
* [CB-4689](https://issues.apache.org/jira/browse/CB-4689) Update default template xcodeproj to Xcode 5 project settings
* [CB-4688](https://issues.apache.org/jira/browse/CB-4688) CordovaLib.xcodeproj - update to Xcode 5 project settings
* [CB-4691](https://issues.apache.org/jira/browse/CB-4691) Fix Xcode 5 warnings
* [CB-4567](https://issues.apache.org/jira/browse/CB-4567) fix issue: "Benchmarks" ->"AutoBench" crashed on iOS
* [CB-4469](https://issues.apache.org/jira/browse/CB-4469) Flip executable bit for copy_www.sh
* [CB-4469](https://issues.apache.org/jira/browse/CB-4469) move copy resource script out of project file
* [CB-4486](https://issues.apache.org/jira/browse/CB-4486) Give iOS plugins the ability to override URL loading
* [CB-4408](https://issues.apache.org/jira/browse/CB-4408) Update cordova/emulate for new emulator build folder
* [Cb-4336] modify cordova/run and cordova/install-device scripts to use ios-deploy (npm)
* [CB-4408](https://issues.apache.org/jira/browse/CB-4408) Modify cordova/build script to build for device (armv7/armv7s)
* [CB-4409](https://issues.apache.org/jira/browse/CB-4409) Remove build artifact folder on cordova/clean
* [CB-4405](https://issues.apache.org/jira/browse/CB-4405) Increase Xcode minimum version to 4.6 in cordova/* scripts
* [CB-4334](https://issues.apache.org/jira/browse/CB-4334) modify cordova/emulate and cordova/run scripts help text for ios-sim (available as npm module)
* [CB-4331](https://issues.apache.org/jira/browse/CB-4331) require ios-sim version 1.7 in command line scripts
* [CB-4355](https://issues.apache.org/jira/browse/CB-4355) Localstorage plugin handles options incorrectly (the settings key is specified with upper case chars)
* [CB-4358](https://issues.apache.org/jira/browse/CB-4358) Trim amount of frameworks (18) in default template to minimum needed (4)
* [CB-4095](https://issues.apache.org/jira/browse/CB-4095) Unify whitelist implementations
* [CB-4281](https://issues.apache.org/jira/browse/CB-4281) Remove Echo files from Xcode project
* [CB-4281](https://issues.apache.org/jira/browse/CB-4281) Moving echo to a plugin in MobileSpec
* [CB-4277](https://issues.apache.org/jira/browse/CB-4277) Revert deleting of &lt;param name="onload" value="true" /&gt; support
* [CB-3005](https://issues.apache.org/jira/browse/CB-3005) Add support for query parameters in StartPage url
* CordovaTests project was missing the CordovaLib dependency: added
* Update iOS whitelist tests
* Fix ARC issue in start page tests (critical for Xcode5)

### 3.0.0 (20130718) ###

* [CB-3999](https://issues.apache.org/jira/browse/CB-3999) Video Capture ignores duration option [iOS]
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-3681](https://issues.apache.org/jira/browse/CB-3681) Remove Contact plugin unit tests
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-3653](https://issues.apache.org/jira/browse/CB-3653) Remove EXIF (Camera plugin) unit tests
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-3726](https://issues.apache.org/jira/browse/CB-3726) Remove File Transfer plugin unit tests
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-3973](https://issues.apache.org/jira/browse/CB-3973) Remove unit test dependency on Dialogs plugin
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-1107](https://issues.apache.org/jira/browse/CB-1107) Remove unit tests for old plugin signature
* [CB-4202](https://issues.apache.org/jira/browse/CB-4202) [CB-4145](https://issues.apache.org/jira/browse/CB-4145) Remove use of useSplashScreen property by unit tests
* [CB-4095](https://issues.apache.org/jira/browse/CB-4095) Add some additional whitelist unit tests
* [CB-2608](https://issues.apache.org/jira/browse/CB-2608) Remove deprecate EnableLocation key from the config.xml file
* [CB-4104](https://issues.apache.org/jira/browse/CB-4104) Made config parameters case-insensitive.
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) PhoneGap app crashes on iOS with error "CDVWebViewDelegate: Navigation started when state=1" (for navigation to an anchor on the same page)
* [CB-3701](https://issues.apache.org/jira/browse/CB-3701) Removed Capture.bundle from default project template for 3.0.0
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) Updated unit tests
* [CB-4025](https://issues.apache.org/jira/browse/CB-4025) iOS emulate command broken when run inside the cordova folder
* [CB-4037](https://issues.apache.org/jira/browse/CB-4037) Unable to Archive iOS projects for upload to App Store in 2.9
* [CB-4088](https://issues.apache.org/jira/browse/CB-4088) `cordova emulate ios` replaces spaces in project name with underscores, conflicting with `cordova build ios` behavior
* [CB-4145](https://issues.apache.org/jira/browse/CB-4145) Remove CDVViewController.useSplashScreen property
* [CB-3175](https://issues.apache.org/jira/browse/CB-3175) Change <plugin> to <feature> in config.xml and remove deprecation notice in iOS
* [CB-1107](https://issues.apache.org/jira/browse/CB-1107) Remove old plugin signature, update Plugin Dev Guide
* [CB-2180](https://issues.apache.org/jira/browse/CB-2180) Convert iOS project template to use ARC
* [CB-3448](https://issues.apache.org/jira/browse/CB-3448) bin/diagnose_project script fails if CORDOVALIB variable not in prefs plist
* [CB-4199](https://issues.apache.org/jira/browse/CB-4199) iOS Platform Script `run --device` uses Simulator
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) PhoneGap app crashes on iOS with error "CDVWebViewDelegate: Navigation started when state=1" (for navigation to an anchor on the same page)
* [CB-3567](https://issues.apache.org/jira/browse/CB-3567) Redirect initiated in JavaScript fails the app from loading
* Removed iphone/beep.wav since it is already contained in the dialogs core plugin
* Have create script include .gitignore file.
* Removed all core plugins (including console logger) to their own repos (install them using cordova-cli or plugman)

### 2.9.0 (201306XX) ###

* [CB-3469](https://issues.apache.org/jira/browse/CB-3469) Add a version macro for 2.8.0.
* [CB-3469](https://issues.apache.org/jira/browse/CB-3469) Adding missing license found by RAT
* [CB-2200](https://issues.apache.org/jira/browse/CB-2200) Remove device.name (deprecated)
* [CB-3031](https://issues.apache.org/jira/browse/CB-3031) Fix for emulate script when project name has a space
* [CB-3420](https://issues.apache.org/jira/browse/CB-3420) add hidden option to InAppBrowser
* [CB-2840](https://issues.apache.org/jira/browse/CB-2840) Nil checks to avoid crash when network disconnected
* [CB-3514](https://issues.apache.org/jira/browse/CB-3514) Remove partially-downloaded files when FileTransfer fails
* [CB-2406](https://issues.apache.org/jira/browse/CB-2406) Add ArrayBuffer support to FileWriter.write
* [CB-3757](https://issues.apache.org/jira/browse/CB-3757) camera.getPicture from photolib fails on iOS
* [CB-3524](https://issues.apache.org/jira/browse/CB-3524) cordova/emulate and cordova/run silently fails when ios-sim is not installed
* [CB-3526](https://issues.apache.org/jira/browse/CB-3526) typo in cordova/lib/install-emulator - does not check for ios-sim
* [CB-3490](https://issues.apache.org/jira/browse/CB-3490) Update CordovaLib iOS Deployment Target in Project Setting to 5.0
* [CB-3528](https://issues.apache.org/jira/browse/CB-3528) Update Plugin Upgrade Guide for iOS
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) PhoneGap app crashes on iOS with error "CDVWebViewDelegate: Navigation started when state=1"
* [CB-3768](https://issues.apache.org/jira/browse/CB-3768) Build to phone failing on Xcode 5 DP1 (OS X Mavericks)
* [CB-3833](https://issues.apache.org/jira/browse/CB-3833) Deprecation plugin tag upgrade step has malformed xml
* [CB-3743](https://issues.apache.org/jira/browse/CB-3743) Remove compatibility headers folder
* [CB-3619](https://issues.apache.org/jira/browse/CB-3619) ./cordova/run script does not always call ./cordova/build first
* [CB-3463](https://issues.apache.org/jira/browse/CB-3463) bin/create should copy cordova.js into the project's CordovaLib
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) PhoneGap app crashes on iOS with error "CDVWebViewDelegate: Navigation started when state=1" (for navigation to an anchor on the same page)
* [CB-3507](https://issues.apache.org/jira/browse/CB-3507) Wrong Linker Flag for project template
* [CB-3458](https://issues.apache.org/jira/browse/CB-3458) remove all_load dependency. Use force load instead
* Removing "build" from gitignore as one of our cli scripts is named build :)
* Added/renamed CDVExifTests to test project.

<br />

### 2.8.0 (201305XX) ###

* [CB-2840](https://issues.apache.org/jira/browse/CB-2840) Nil checks to avoid crash when network disconnected
* [CB-3416](https://issues.apache.org/jira/browse/CB-3416) adding empty <plugins> element during deprecation window.
* [CB-3006](https://issues.apache.org/jira/browse/CB-3006) Customize InAppBrowser location bar
* [CB-3405](https://issues.apache.org/jira/browse/CB-3405) InAppBrowser option to hide bottom bar with Done/History buttons
* [CB-3394](https://issues.apache.org/jira/browse/CB-3394) Cordova iOS crashes when multiple access elements in config.xml
* [CB-3166](https://issues.apache.org/jira/browse/CB-3166) Add deprecation notice for use of <plugin> in config.xml in iOS
* [CB-2905](https://issues.apache.org/jira/browse/CB-2905) Exif geolocation meta data tag writing
* [CB-3307](https://issues.apache.org/jira/browse/CB-3307) Rename cordova-ios.js -> cordova.js
* [CB-1108](https://issues.apache.org/jira/browse/CB-1108) Convert <plugin> -> <feature> with <param>
* [CB-3321](https://issues.apache.org/jira/browse/CB-3321) Fix bogus "failed whitelist" log messages
* [CB-3311](https://issues.apache.org/jira/browse/CB-3311) add default textbox for notification prompt
* [CB-2846](https://issues.apache.org/jira/browse/CB-2846) SplashScreen crashes app when image not available
* [CB-2789](https://issues.apache.org/jira/browse/CB-2789) Remove CaptureOptions.mode support.
* [CB-3295](https://issues.apache.org/jira/browse/CB-3295) Send InAppBrowser loadstart events when redirects occur
* [CB-2896](https://issues.apache.org/jira/browse/CB-2896) added ImageIO and OpenAL system frameworks to support new exif functionality in CDVCamera
* [CB-2896](https://issues.apache.org/jira/browse/CB-2896) writing data to object through CGImageDestinationRef, enables multipart exif tag writing
* [CB-2958](https://issues.apache.org/jira/browse/CB-2958) simple fix, moved write to photealbum code and sourced from modified data. Photo data returned by cordova will match photo on cameraroll
* [CB-3339](https://issues.apache.org/jira/browse/CB-3339) add version to command line scripts
* [CB-3377](https://issues.apache.org/jira/browse/CB-3377) Remove cordova/release script
* [CB-2974](https://issues.apache.org/jira/browse/CB-2974) Add a ./cordova/lib/list-devices project-level helper script to iOS
* [CB-2951](https://issues.apache.org/jira/browse/CB-2951) Add a ./cordova/lib/list-emulator-images project-level helper script to iOS
* [CB-2974](https://issues.apache.org/jira/browse/CB-2974) Add a ./cordova/lib/list-devices project-level helper script to iOS
* [CB-2966](https://issues.apache.org/jira/browse/CB-2966) Add a ./cordova/lib/list-started-emulators as project-level helper script to iOS
* [CB-2990](https://issues.apache.org/jira/browse/CB-2990) Add a ./cordova/lib/install-device project-level helper script to iOS
* [CB-2982](https://issues.apache.org/jira/browse/CB-2982) Add a ./cordova/lib/install-emulator project-level helper script to iOS
* [CB-2998](https://issues.apache.org/jira/browse/CB-2998) Add a ./cordova/lib/start-emulator project-level helper script to iOS
* [CB-2916](https://issues.apache.org/jira/browse/CB-2916) Add a ./cordova/clean project-level script for iOS
* [CB-2053](https://issues.apache.org/jira/browse/CB-2053) Update UIImagePickerController label to reflect video media type in CDVCamera
* [CB-3530](https://issues.apache.org/jira/browse/CB-3530) PhoneGap app crashes on iOS with error "CDVWebViewDelegate: Navigation started when state=1"

<br />

### 2.7.0 (201304XX) ###

* Fix NPE in InAppBrowser's error callback.
* [CB-2849](https://issues.apache.org/jira/browse/CB-2849) Fix bin/create when CordovaLib parent dir has a space
* [CB-3069](https://issues.apache.org/jira/browse/CB-3069) Fix InAppBrowser load events (for non-redirecting pages)
* InAppBrowser: Don't inject iframe bridge until necessary.
* Fix FileTransfer unit test. HTTP Method was being set to null.
* [CB-2305](https://issues.apache.org/jira/browse/CB-2305) Add InAppBrowser injectScriptCode command to support InAppBrowser.executeScript and InAppBrowser.insertCSS APIs
* [CB-2653](https://issues.apache.org/jira/browse/CB-2653) Simplify InAppBrowser.injectScriptCode.
* [CB-2537](https://issues.apache.org/jira/browse/CB-2537) Implement streaming downloads for FileTransfer
* [CB-2190](https://issues.apache.org/jira/browse/CB-2190) Allow FileTransfer uploads to continue in background
* [CB-1518](https://issues.apache.org/jira/browse/CB-1518) Request content length in parallel with download for gzipped content
* [CB-2653](https://issues.apache.org/jira/browse/CB-2653) Delay executeScript/insertCSS callback until resources have loaded; pass JS results to callback
* [CB-2824](https://issues.apache.org/jira/browse/CB-2824) Remove DebugConsole plugin
* [CB-3066](https://issues.apache.org/jira/browse/CB-3066) Fire onNativeReady from JS, as bridge is available immediately
* [CB-2725](https://issues.apache.org/jira/browse/CB-2725) Fix www deploy issues with symlinks
* [CB-2725](https://issues.apache.org/jira/browse/CB-2725) follow links in www copy script
* [CB-3039](https://issues.apache.org/jira/browse/CB-3039) iOS Exif date length mismatch
* [CB-3052](https://issues.apache.org/jira/browse/CB-3052) iOS Exif SubIFD offsets incorrect
* [CB-51](https://issues.apache.org/jira/browse/CB-51) Added httpMethod for file transfer options (defaults to POST)
* [CB-2732](https://issues.apache.org/jira/browse/CB-2732) Only set camera device when allowed.
* [CB-2911](https://issues.apache.org/jira/browse/CB-2911) Updated resolveLocalFileSystemURI.
* [CB-3032](https://issues.apache.org/jira/browse/CB-3032) Add whitelist support for custom schemes.
* [CB-3048](https://issues.apache.org/jira/browse/CB-3048) Add --arc flag to create script, support arc in template.
* [CB-3067]: fixing ios5 whitelist of file url
* [CB-3067](https://issues.apache.org/jira/browse/CB-3067) Revert CDVURLProtocol to not whitelist file urls
* [CB-2788](https://issues.apache.org/jira/browse/CB-2788) add ./bin/check_reqs script to iOS
* [CB-2587](https://issues.apache.org/jira/browse/CB-2587) Added plugin timing for plugins that are loaded on startup (plugin 'onload' attribute)
* [CB-2848](https://issues.apache.org/jira/browse/CB-2848) ShowSplashScreenSpinner not used
* [CB-2960](https://issues.apache.org/jira/browse/CB-2960) Changing the volume of a sound already playing
* [CB-3021](https://issues.apache.org/jira/browse/CB-3021) Can no longer import CDVPlugin.h from plugin Objective-C++ code
* [CB-2790](https://issues.apache.org/jira/browse/CB-2790) added splice function to header writer: accepts jpeg as NSData, and splices in exif data specified by a string
* [CB-2790](https://issues.apache.org/jira/browse/CB-2790) removed old splice code, replaced with JpegHeaderWriter api calls
* [CB-2896](https://issues.apache.org/jira/browse/CB-2896) split writing of working tags off here, multipart tags not supported
* [CB-2896](https://issues.apache.org/jira/browse/CB-2896) fixed error in exif subifd offset calculation for tag 8769
* [CB-2902](https://issues.apache.org/jira/browse/CB-2902) re-added long/short tags to template dict, fixed subExifIFD offset
* [CB-2698](https://issues.apache.org/jira/browse/CB-2698) Fix load detection when pages have redirects.
* [CB-3295](https://issues.apache.org/jira/browse/CB-3295) Send InAppBrowser loadstart events when redirects occur

<br />

### 2.6.0 (20130401) ###

* [CB-2732](https://issues.apache.org/jira/browse/CB-2732) Only set camera device when allowed.
* [CB-2848](https://issues.apache.org/jira/browse/CB-2848) ShowSplashScreenSpinner not used
* [CB-2790](https://issues.apache.org/jira/browse/CB-2790) added splice function to header writer: accepts jpeg as NSData, 
* [CB-2790](https://issues.apache.org/jira/browse/CB-2790) removed old splice code, replaced with JpegHeaderWriter api call
* [CB-1547](https://issues.apache.org/jira/browse/CB-1547) Scope notifications to WebViews
* [CB-2461](https://issues.apache.org/jira/browse/CB-2461) Distinguish sub-frame from top-level loads in InAppBrowser.
* [CB-2523](https://issues.apache.org/jira/browse/CB-2523) Add setting to shrink webview when keyboard pops up
* [CB-2220](https://issues.apache.org/jira/browse/CB-2220) Fix splashscreen origin when status bar is present
* [CB-2220](https://issues.apache.org/jira/browse/CB-2220) Size the splash screen in the same way as the launch image
* [CB-2389](https://issues.apache.org/jira/browse/CB-2389) Fix page load detection for late-loaded iframes
* [CB-2220](https://issues.apache.org/jira/browse/CB-2220) Fix splash screen positioning when image is the size of device
* [CB-2631](https://issues.apache.org/jira/browse/CB-2631) Fix crash when bad url given to FT.upload
* [CB-2652](https://issues.apache.org/jira/browse/CB-2652) Make FileReader.readAs*() functions run on a background thread
* [CB-2633](https://issues.apache.org/jira/browse/CB-2633) Add FileReader.readAsBinaryString()
* [CB-2308](https://issues.apache.org/jira/browse/CB-2308) Correctly delegate to CDVInAppBrowser webView:didFailLoadWithError
* [CB-2308](https://issues.apache.org/jira/browse/CB-2308) [ios] Report errors when InAppBrowser fails to load page
* [CB-2527](https://issues.apache.org/jira/browse/CB-2527) Update iPad splash images to correct sizes
* [CB-1452](https://issues.apache.org/jira/browse/CB-1452) Media position incorrect after being set beyond duration
* [CB-2436](https://issues.apache.org/jira/browse/CB-2436) Wrong splashscreen is displayed when UILaunchImageFile is set
* [CB-2634](https://issues.apache.org/jira/browse/CB-2634) Copy www fails w spaces in filenames
* [CB-2618](https://issues.apache.org/jira/browse/CB-2618) xcode build from Network Drive Fails
* [CB-2638](https://issues.apache.org/jira/browse/CB-2638) Fix iOS project warnings on Retina imgs
* [CB-2491](https://issues.apache.org/jira/browse/CB-2491) Deprecate current Connection cell setting
* [CB-2674](https://issues.apache.org/jira/browse/CB-2674) Add prompt to Notification API for iOS
* [CB-2691](https://issues.apache.org/jira/browse/CB-2691) Splashscreen should block user interaction
* [CB-2502](https://issues.apache.org/jira/browse/CB-2502) Fixing CDVViewController.commandDelegate property declaration
* [CB-1933](https://issues.apache.org/jira/browse/CB-1933) Changed button labels to an array.
* [CB-1688](https://issues.apache.org/jira/browse/CB-1688) Added a camera direction option.
* [CB-2732](https://issues.apache.org/jira/browse/CB-2732) Only set camera device when allowed.
* [CB-2530](https://issues.apache.org/jira/browse/CB-2530) [CB-2239](https://issues.apache.org/jira/browse/CB-2239) Multipart plugin result
* [CB-2605](https://issues.apache.org/jira/browse/CB-2605) icon-72@2x.png not included in xcode project template
* [CB-2545](https://issues.apache.org/jira/browse/CB-2545) Deprecate "EnableLocation" Project Setting - use the "onload" attribute of the <plugin> element
* [CB-2384](https://issues.apache.org/jira/browse/CB-2384) Add new iOS Project Setting to suppress the form accessory bar above the keyboard
* [CB-2195](https://issues.apache.org/jira/browse/CB-2195) Remove deprecated - iOS - BackupWebStorage Cordova.plist property change from boolean to string
* [CB-2194](https://issues.apache.org/jira/browse/CB-2194) Remove deprecated - iOS - CDVCommandDelegate registerPlugin method
* [CB-2699](https://issues.apache.org/jira/browse/CB-2699) Bug in dynamic loading of a plugin at CDVViewController's registerPlugin method
* [CB-2384](https://issues.apache.org/jira/browse/CB-2384) Re-fix - Add new iOS Project Setting to suppress the form accessory bar above the keyboard
* [CB-2759](https://issues.apache.org/jira/browse/CB-2759) Update www/ Application for iOS
* [CB-2672](https://issues.apache.org/jira/browse/CB-2672) InAppBrowserBug fixed (not reporting actual URL after redirect)
* [CB-861](https://issues.apache.org/jira/browse/CB-861) Header support for FileTransfer download
* Add a define that turns on logging of exec() bridge
* Sort preferences in project template.
* Add KeyboardShrinksView preference to project template
* Revert accidentally change in PluginResult that broke threading.
* Remove NSLogs accidentally checked in.
* Use noCopy versions of NSString init in Base64 code.
* Add an associatedObject field to CDVPluginResult.
* Uncrustified with v0.60 of the tool (up from 0.59).
* Make sure version of uncrustify is correct in the pre-commit hook
* Remove some unnecessary argument checks in CDVNotification
* Implement readAsArrayBuffer
* Changed UIWebViewBounce to DisallowOverscroll.
* Retain cycle fix
* Fixed static analyzer issues.
* Interim .js for [CB-52](https://issues.apache.org/jira/browse/CB-52) FileTransfer Basic Auth
* Added KeyboardShrinksView preference to CordovaLibTest config.xml
* Added \__CORDOVA_IOS\__ macro

< br />

### 2.5.0 (20130301) ###

* [CB-2395](https://issues.apache.org/jira/browse/CB-2395) Fix CDVViewController UserAgent lock
* [CB-2207](https://issues.apache.org/jira/browse/CB-2207) Use a custom script for www/ copying.
* [CB-2275](https://issues.apache.org/jira/browse/CB-2275) Add NSURLCache to app template.
* [CB-2433](https://issues.apache.org/jira/browse/CB-2433) Deprecation notice for window.Settings
* [CB-2276](https://issues.apache.org/jira/browse/CB-2276) Add whitelist method to CommandDelegate
* [CB-2276](https://issues.apache.org/jira/browse/CB-2276) Remove CDVViewController from CDVLocation
* [CB-2276](https://issues.apache.org/jira/browse/CB-2276) Remove CDVViewController from CDVSound
* [CB-2276](https://issues.apache.org/jira/browse/CB-2276) Remove CDVViewController CDVCapture
* [CB-1547](https://issues.apache.org/jira/browse/CB-1547) Ignore iframe navigations in webview delegate methods
* [CB-1547](https://issues.apache.org/jira/browse/CB-1547) Take two: Ignore iframe navigations in webview delegate methods
* [CB-2443](https://issues.apache.org/jira/browse/CB-2443) Add pluginInitialize method to CDVPlugin.
* [CB-2443](https://issues.apache.org/jira/browse/CB-2443) Removed classSettings initializer from CDVPlugin
* [CB-1693](https://issues.apache.org/jira/browse/CB-1693) Allow plugins to be loaded on start-up.
* [CB-2276](https://issues.apache.org/jira/browse/CB-2276) Move Splashscreen logic out of CDVViewController
* [CB-2389](https://issues.apache.org/jira/browse/CB-2389) Distinguish top-level from sub-frame navigations.
* [CB-571](https://issues.apache.org/jira/browse/CB-571) Media updates
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to getFileMetadata.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to readAsDataURL.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to getMetadata.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to three methods.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added the AssetsLibrary framework.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to copyTo and moveTo.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Updated errors for write and truncate.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Updated a NATIVE_URI error (getParent).
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added NATIVE_URI to FileTransfer.upload.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Skipped image scaling when possible.
* [CB-2213](https://issues.apache.org/jira/browse/CB-2213) Added native URI request handling.
* [CB-2411](https://issues.apache.org/jira/browse/CB-2411) Added camera popover repositioning.
* [CB-2379](https://issues.apache.org/jira/browse/CB-2379) Update CordovaLib Project Settings according to Xcode 4.6 recommendations
* [CB-2334](https://issues.apache.org/jira/browse/CB-2334) Add "body" property to FileTransferError object on iOS
* [CB-2342](https://issues.apache.org/jira/browse/CB-2342) Media API allows non-whitelisted audio to be played
* [CB-2324](https://issues.apache.org/jira/browse/CB-2324) iOS config.xml document should use <widget> instead of <cordova>
* [CB-2469](https://issues.apache.org/jira/browse/CB-2469) Update JavaScript for iOS (2.5.0rc1)
* CDVWebViewDelegate header was not public.
* [CB-2516](https://issues.apache.org/jira/browse/CB-2516) Additional Plugin Note on Upgrading from 2.3.0 to 2.4.0
* [CB-2510](https://issues.apache.org/jira/browse/CB-2510) [1/2] Updated Plugin Upgrade Guide for 2.4.0 -> 2.5.0
* [CB-2544](https://issues.apache.org/jira/browse/CB-2544) Document "onload" attribute of <plugin> element in Plugin Upgrade Guide
* [CB-2280, CB-2281] SplashScreen fade and rotation
* Run uncrustify on CDVPlugin.m
* Uncrustify CDVFile and CDVFileTransfer
* Use correct MIME-type for asset-library responses.
* Add option for ipad/iphone in cordova/emulate
* Make CDVLocalStorage use onReset
* Add a notification so plugins will know when page loads occur.
* Change default value of splash screen fade to be quicker.
* Implement useSplashScreen without using a setting
* Don't call onReset for iframe navigation
* function name was wrong (case sensitive)
* Fix /bin/create script to work with GNU sed in path

<br />

### 2.4.0 (20130205) ###

* Make cordova_plist_to_config_xml able to handle binary plist files
* Ran splashscreen images through ImageOptim.
* [ios] Remove %-escaping version of FileReader.readAsText()
* Fix trying to mutate an immutable NSArray in CDVInvokedUrlCommand.
* Fix FileTransfer.download failing for file: URLs.
* Fix setting of _nativeReady when cordova.js is lazy-loaded.
* Fix NPE when PDF is opened in InAppBrowser.
* Refactor User-Agent logic into a helper class.
* Fix for [CB-2225](https://issues.apache.org/jira/browse/CB-2225)
* Remove a debugging log statement.
* Add a code comment that points to the PDF/User-Agent JIRA issue.
* Disable broken test.
* Don't send callbacks when there are no listeners.
* Fix InAppBrowser on iOS 5.
* Fix [CB-2271](https://issues.apache.org/jira/browse/CB-2271) - Multiple Cordova Views.
* Fix usage message of update_cordova_subproject.
* Delete obsolete instructions in bin/README.md
* Fixes [CB-2209](https://issues.apache.org/jira/browse/CB-2209) Contact ARC issues
* including a manual relpath function
* Add slice() support to readAsText.
* Add slice() support to readAsDataURL.
* Move start page to be specified in <content> tag.
* Separate the echoArrayBuffer call from normal echo
* Adding bool plugin result message, tests
* iOS fix slow contact access due to photos temp file generation
* [CB-2235](https://issues.apache.org/jira/browse/CB-2235) Fixed file transfer whitelisting.
* [ios]CB-2189: support ArrayBuffer over exec bridge
* [ios] [CB-2215](https://issues.apache.org/jira/browse/CB-2215) - Implement ArrayBuffer native->js.
* [ios] [CB-2215](https://issues.apache.org/jira/browse/CB-2215) - Implement ArrayBuffer native->js.
* CordovaLibTests - update project file for iOS 5 support.
* cordova/run and cordova/emulate refer to old 'debug' script which has been renamed to 'build'
* [CB-1495](https://issues.apache.org/jira/browse/CB-1495) iOS default splash screen images take up several megabytes
* [CB-1849](https://issues.apache.org/jira/browse/CB-1849) Remove iOS 4/5 conditional code block, put in main block
* [CB-2193](https://issues.apache.org/jira/browse/CB-2193) Remove deprecated - iOS - CDVViewController invokeString property
* Fixed [CB-2191](https://issues.apache.org/jira/browse/CB-2191) and [CB-2192](https://issues.apache.org/jira/browse/CB-2192) (removal of deprecated methods)
* [CB-1832](https://issues.apache.org/jira/browse/CB-1832) iOS: CDVCordovaView should not inherit from UIWebView
* [CB-1946](https://issues.apache.org/jira/browse/CB-1946) iOS: Switch JSON serialization to NSJSONSerialization
* Fixes static analyzer error for using mktemp (substituted with mkstemp)
* [CB-2159](https://issues.apache.org/jira/browse/CB-2159) handleOpenURL not called on iOS
* [CB-2063](https://issues.apache.org/jira/browse/CB-2063) InAppBrowser - support iPad presentation style, iOS transition styles
* [CB-478](https://issues.apache.org/jira/browse/CB-478) FileTransfer upload - handle "trustAllHosts" parameter
* Interim js patch for [CB-2094](https://issues.apache.org/jira/browse/CB-2094) issue
* [CB-2071](https://issues.apache.org/jira/browse/CB-2071) InAppBrowser: allow UIWebView settings like main CordovaWebView
* Added interim js for latest changes.
* Added whitelist unit test to check for query param matches
* [CB-2290](https://issues.apache.org/jira/browse/CB-2290) iOS: 'CDVJSON.h' file not found when adding a plugin
* Added a native uri option to DestinationType.
* Added a namespace prefix to a constant.

<br />

### 2.3.0 (20130107) ###

* [CB-1550](https://issues.apache.org/jira/browse/CB-1550) iOS build, debug, emulate scripts should check xcode version
* [CB-1669](https://issues.apache.org/jira/browse/CB-1669) Issue an error when media.startRecord() is failing.
* [CB-1695](https://issues.apache.org/jira/browse/CB-1695) CDVURLProtocol should not apply whitelist to non-Cordova view controllers/requests
* [CB-1802](https://issues.apache.org/jira/browse/CB-1802) ./cordova set of CLI tools need audit to work with paths with spaces
* [CB-1824](https://issues.apache.org/jira/browse/CB-1824) SIGABRT when view loads - reason: -[NSCFBoolean isEqualToString:]: unrecognized selector
* [CB-1836](https://issues.apache.org/jira/browse/CB-1836) Device core plugin - device.platform should return "iOS"
* [CB-1837](https://issues.apache.org/jira/browse/CB-1837) Device core plugin - device.name should return the actual device string (eg iPod Touch, iPhone)
* [CB-1850](https://issues.apache.org/jira/browse/CB-1850) Add device.model to the Device API
* [CB-1889](https://issues.apache.org/jira/browse/CB-1889) Added userAgent property to CDVViewController (systemVersion and locale dependent, cached)
* [CB-1890](https://issues.apache.org/jira/browse/CB-1890) InAppBrowser: location bar url text needs indentation
* [CB-1949][iOS] InAppBrowser - support events (loadstart, loadstop, exit)
* [CB-1957](https://issues.apache.org/jira/browse/CB-1957) InAppBrowser - video/audio does not stop playing when browser is closed
* [CB-1962](https://issues.apache.org/jira/browse/CB-1962) Video Capture not compressing video after capture - partial revert of [CB-1499](https://issues.apache.org/jira/browse/CB-1499)
* [CB-1970](https://issues.apache.org/jira/browse/CB-1970) MainViewController cannot override pathForResource
* Fix unit tests not working due to lack of a command delegate.
* Fix not being able to seek to position 0.
* Move cordova-VERSION.js from bin/templates to CordovaLib.
* Add version number to cordova.ios.js in create script.
* Add argument fetching helpers to CDVInvokedUrlCommand.
* Fix InAppBrowser handling of NSNull relative URLS.
* Use the VC's address in the User-Agent instead of a GUID.
* Have the InAppBrowser not use a GUID in its UA.
* Update cordova.ios.js with change to not require cordova.iOSVCAddr
* Fix invalidating of cached UA when Locale changes with the app closed.
* Add a helper script to convert Cordova.plist to config.xml.
* Rename plist2xml.py -> cordova_plist_to_config_xml.
* Mention cordova_plist_to_config_xml in the NSAssert for config.xml
* Allow any scheme when specifying start page as a URL.
* Rename cordova commands, added 'release' command for iOS
* Remove template Cordova.plist, add config.xml.
* Remove Cordova.plist from resources, add config.xml
* Migrate unit tests to use config.xml.
* Make whitelist rejection string configurable
* Remove setWantsFullScreenLayout from CDVViewController, simplified viewWillAppear in template app.
* Remove forced status bar rotation logic
* Fix autoresizingMask of imageView
* Support startPage as URL.
* Update __bin/diagnose_project__ to print out conditional ARCHs build settings.
* Update deprecation notice for our minimum iOS 5.0 support
* Fix deprecated [AVAsset naturalSize] usage in Capture API (getFormatData)
* Add CDVInAppBrowser implementation.
* InAppBrowser - pass on window options for \_self if url is not in the whitelist (which is kicked out to the InAppBrowser)
* CordovaLibAppTest -- Added Globalization, InAppBrowser plugins to Cordova.plist
* Default project template -- Added InAppBrowser plugin to Cordova.plist
* InAppBrowser - append GUID to the UIWebView UserAgent to differentiate the different instances (for the white-list)
* Update fix to [CB-1695](https://issues.apache.org/jira/browse/CB-1695) - the main Cordova UIWebView has a unique User-Agent now.
* Update default project template to include config.xml, removed Cordova.plist
* Rename references of Cordova.plist to config.xml (plus uncrustify)
* Add new CDVInvokedUrlCommand argumentAtIndex method to ensure proper object type returned (if not, default is returned)
* Fix non-mp3 files not being able to be played using the Media API
* Remove usage of deprecated CDVViewController.invokeString in the default project template files.
* Change unsafe_unretained to weak since we are supporting iOS 5.0 and up only now
* Update doc references to Cordova.plist, use new config.xml
* Remove incubator website links to TLP http://cordova.apache.org/
* Add URLisAllowed method abstraction for Plugins to query (easier if we decide to make the whitelist a singleton in the future)
* Add local notification #define, and stubbed method in AppDelegate.m
* Add appdelegate method didReceiveLocalNotification and repost to NSNotification defaultCenter

<br />

### 2.2.0 (20121031) ###

* [CB-622](https://issues.apache.org/jira/browse/CB-622) FileTransfer interface should provide progress monitoring
* [CB-622](https://issues.apache.org/jira/browse/CB-622) Progress events for downloads
* [CB-625](https://issues.apache.org/jira/browse/CB-625) bin/uncrustify.sh --all
* [CB-836](https://issues.apache.org/jira/browse/CB-836) Abort functionality added to FileTransfer
* [CB-836](https://issues.apache.org/jira/browse/CB-836) Storing connection delegates for aborting connections quicker
* [CB-836](https://issues.apache.org/jira/browse/CB-836) Readonly property, duplicate activeTransfer, send pluginResult on abort
* [CB-902](https://issues.apache.org/jira/browse/CB-902) iOS 6 - deal with new Privacy functionality in Contacts (ABAddressBook:: ABAddressBookCreateWithOptions)
* [CB-1145](https://issues.apache.org/jira/browse/CB-1145) Require minimum Xcode 4.5 thus iOS 4.3 (Lion and Mountain Lion only - LLVM Compiler 4.0)
* [CB-1360](https://issues.apache.org/jira/browse/CB-1360) Conditionally add architectures based on iOS version in CordovaLib
* [CB-1390](https://issues.apache.org/jira/browse/CB-1390) Add onReset() to plugins on iOS.
* [CB-1404](https://issues.apache.org/jira/browse/CB-1404) EXC\_BAD\_ACCESS when using XHR\_WITH\_PAYLOAD bridge mode
* [CB-1456](https://issues.apache.org/jira/browse/CB-1456) bin/diagnose\_project script prints Build Settings from the project settings, not the target settings
* [CB-1461](https://issues.apache.org/jira/browse/CB-1461) Add the two new iOS 6 UIWebView properties as Cordova.plist settings
* [CB-1465](https://issues.apache.org/jira/browse/CB-1465) WebView too small after closing of a ChildBrowser in landscape orientation
* [CB-1470](https://issues.apache.org/jira/browse/CB-1470) add iOS implementation for globalization
* [CB-1476](https://issues.apache.org/jira/browse/CB-1476) Failed to load resource: file:///!gap_exec (Change XHR bridge mode to succeed instead of fail)
* [CB-1479](https://issues.apache.org/jira/browse/CB-1479) Cordova 2.1 Capture Problem if no options provided
* [CB-1482](https://issues.apache.org/jira/browse/CB-1482) Add splash screen image for iPhone 5's 4" display.
* [CB-1486](https://issues.apache.org/jira/browse/CB-1486) Added missing apache source headers
* [CB-1499](https://issues.apache.org/jira/browse/CB-1499) use of Camera in Cordova video mode results in field of view different than in native video mode
* [CB-1502](https://issues.apache.org/jira/browse/CB-1502) Update Capture Audio images for iPhone 5
* [CB-1511](https://issues.apache.org/jira/browse/CB-1511) Cordova 2.1/2.2 Audio Capture iOS6 CDVAudioRecorderViewController wrong orientation
* [CB-1512](https://issues.apache.org/jira/browse/CB-1512) Change FileTransfer's form boundary from *** to +++
* [CB-1514](https://issues.apache.org/jira/browse/CB-1514) Xcode 4.5 - Static Analyzer Issues in CordovaLib and default template
* [CB-1515](https://issues.apache.org/jira/browse/CB-1515) Update Cordova.plist docs for new iOS 6 settings (KeyboardDisplayRequiresUserAction, SuppressesIncrementalRendering)
* [CB-1520](https://issues.apache.org/jira/browse/CB-1520) InvalidArgumentException when EnableLocation is Yes on Cordova.plist
* [CB-1524](https://issues.apache.org/jira/browse/CB-1524) No such a file or directory libCordova.a error when running app on device
* [CB-1526](https://issues.apache.org/jira/browse/CB-1526) Putting CordovaLib in source control requires bin/update\_cordova\_subproject (Change create script to copy CordovaLib into new projects)
* [CB-1558](https://issues.apache.org/jira/browse/CB-1558) LocalStorage is lost after upgrade to cordova 2.1 and ios6 up from from ios5
* [CB-1561](https://issues.apache.org/jira/browse/CB-1561) Using Storage API - rejected by Apple
* [CB-1569](https://issues.apache.org/jira/browse/CB-1569) Fatal crash after upgraded from 2.0 to 2.1
* [CB-1571](https://issues.apache.org/jira/browse/CB-1571) FileTransfer escapes callback arguments on iOS
* [CB-1578](https://issues.apache.org/jira/browse/CB-1578) App crash (while stopping) caused by an unregistered notification handler in CDVConnection
* [CB-1579](https://issues.apache.org/jira/browse/CB-1579) Optimize exec() calls made from plugin callbacks on iOS
* [CB-1587](https://issues.apache.org/jira/browse/CB-1587) Wrong splash screen shown on iPhone 5
* [CB-1595](https://issues.apache.org/jira/browse/CB-1595) Do not prompt user about whether to build from the emulate script.
* [CB-1597](https://issues.apache.org/jira/browse/CB-1597) Running ./cordova/debug / cordova/emulate causes errors
* [CB-1600](https://issues.apache.org/jira/browse/CB-1600) crash in MobileSpec under 4.3 during file transfer (check class before casting URLResponse)
* [CB-1604](https://issues.apache.org/jira/browse/CB-1604) navigator.connection not implemented correctly on iOS
* [CB-1617](https://issues.apache.org/jira/browse/CB-1617) update CDVGlobalization for ARC, remove iOS5 only api
* [CB-1619](https://issues.apache.org/jira/browse/CB-1619) Camera shutter remains closed when returning to app
* [CB-1694](https://issues.apache.org/jira/browse/CB-1694) View controller not properly unregistered in CDVURLProtocol
* [CB-1698](https://issues.apache.org/jira/browse/CB-1698) Remove WebScriptDebugDelegate.h
* [CB-1746](https://issues.apache.org/jira/browse/CB-1746) IOS events onAppWillResignActive and onAppDidEnterBackground do not execute JS until after app is launched again.
* [GH-PR-54]Update CDVDebug.h with better logging tools (https://github.com/apache/cordova-ios/pull/54 )
* [GH-PR-55] Removing useless NSLog (https://github.com/apache/cordova-ios/pull/55)
* [GH-PR-59] Fixed two bugs in CDVFileTransfer concerning file uploads (https://github.com/apache/cordova-ios/pull/59)
* Added CDV\_IsIPhone5 macro
* Add uncrustify config and script for auto-formatting code.
* Add git hook that runs uncrustify before commits.
* Add a comment explaining what the statements in the nativeReady eval do.
* Updating JS with default bridge now XHR\_OPTIONAL\_PAYLOAD.
* Delete unused CordovaBuildSettings.xcconfig from project template.
* Move test lib and test app out of CordovaLib.
* Tweak pre-commit message to make command more copy&paste-able.
* Convert unit tests to ARC.
* Add --shared optional parameter to bin/create script
* Update uncrustify rules for ternary operators.
* Refactor most of the command queue logic into a separate class.
* Add a method to CDVCommandDelegate for executing JS.
* Make plugins and CommandQueue use weak refs for CDVViewController.
* Adds CDVCommandDelegateImpl.
* Remove deprecated methods in CDVSound
* Delete deprecated method "closePicker" from CDVCamera.
* Remove deprecated methods in CDVFile.
* Remove CDVDeprecated.h. 7 months old.
* Add a macro for deprecating symbols and use it in a couple of places.
* Deprecate CDVCommandDelegate's execute and registerPlugin methods.
* Add a method to CDVCommandDelegate for executing on a background thread.
* Fix alert dead-lock in contacts mobile-spec test.
* Fix commandDelegate.evalJs to actually bundle exec() calls.
* Removed Cordova Settings File guide, added web shortcut to online doc.
* Changed Cordova.plist BackupWebStorage setting from boolean to string (cloud, local, none)

<br />

### 2.1.0 (20120913) ###

* [CB-45](https://issues.apache.org/jira/browse/CB-45) Add support for full urls in white-list, extract hostname
* [CB-274](https://issues.apache.org/jira/browse/CB-274) iOS Cordova Template Project is not compilable with default Apple's ARC compiler 3.0
* [CB-593](https://issues.apache.org/jira/browse/CB-593) Click and touch events do not fire after using scroll CSS
* [CB-675](https://issues.apache.org/jira/browse/CB-675) Allow multiple versions of PhoneGap to be installed in Xcode (added bin/update_cordova_subproject script)
* [CB-828](https://issues.apache.org/jira/browse/CB-828) iOS contact.save() stops the UI from updating on heavy load & has memory leaks.
* [CB-903](https://issues.apache.org/jira/browse/CB-903) iOS 6 - add setting to set WebKitStoreWebDataForBackup for user defaults from Cordova.plist/config.xml
* [CB-904](https://issues.apache.org/jira/browse/CB-904) iOS 6 - turn off CDVLocalStorage core plugin when on iOS 6
* [CB-994](https://issues.apache.org/jira/browse/CB-994) CDVLocalStorage core plugin does not fully backup when app setting "Application does not run in background" is YES
* [CB-1000](https://issues.apache.org/jira/browse/CB-1000) Namespace issue of JSONKit and other external libraries
* [CB-1091](https://issues.apache.org/jira/browse/CB-1091) Removed installer and related dependencies. Moved original post-install script into makefile under "install" target (which is default target).
* [CB-1091](https://issues.apache.org/jira/browse/CB-1091) Added check for if xcode is running, and throw error if it is.
* [CB-1105](https://issues.apache.org/jira/browse/CB-1105) Add JSONKit doc issue for iOS Plugin Upgrade Guide
* [CB-1106](https://issues.apache.org/jira/browse/CB-1106) Deprecate old plugin signature
* [CB-1122](https://issues.apache.org/jira/browse/CB-1122) Diagnostic tool for Cordova iOS Xcode projects
* [CB-1124](https://issues.apache.org/jira/browse/CB-1124) "create" script (and possibly others) provided in bin directory do not escape arguments
* [CB-1136](https://issues.apache.org/jira/browse/CB-1136) symlink to bin/create script fails
* [CB-1137](https://issues.apache.org/jira/browse/CB-1137) emulate and log script failure when launched from external working directory
* [CB-1138](https://issues.apache.org/jira/browse/CB-1138) Default logging level for file access should not log file contents.
* [CB-1149](https://issues.apache.org/jira/browse/CB-1149) hello-world sample web app is missing lib folder, in a newly created app
* [CB-1164](https://issues.apache.org/jira/browse/CB-1164) Fix warnings and analyzer issues reported with the newer LLVM in Xcode 4.4
* [CB-1166](https://issues.apache.org/jira/browse/CB-1166) Remove dependency on VERSION file
* [CB-1173](https://issues.apache.org/jira/browse/CB-1173) Clean up default project template
* [CB-1182](https://issues.apache.org/jira/browse/CB-1182) Fixing IOS6 screen orientation/rotation without breaking ios5.1 or xcode 4.4 build.
* [CB-1186](https://issues.apache.org/jira/browse/CB-1186) Update README.md, FirstRun.md for new install method
* [CB-1187](https://issues.apache.org/jira/browse/CB-1187) Move the Objective-C unit-tests out of CordovaLib.xcodeproj, into its own .xcodeproj
* [CB-1188](https://issues.apache.org/jira/browse/CB-1188) Update Plugin Upgrade Guide for new iOS plugin signature (old one still supported, but deprecated)
* [CB-1190](https://issues.apache.org/jira/browse/CB-1190) Crash when contacts are edited (mass edit)
* [CB-1192](https://issues.apache.org/jira/browse/CB-1192) Update template to set GCC_THUMB_SUPPORT=NO in Build Settings
* [CB-1204](https://issues.apache.org/jira/browse/CB-1204) CDVViewController-loaded view doesn't respect applicationFrame
* [CB-1209](https://issues.apache.org/jira/browse/CB-1209) CDVViewController.supportedOrientations not set in a timely fashion
* [CB-1223](https://issues.apache.org/jira/browse/CB-1223) CORDOVALIB Xcode variable - allow this to be read in from xcodebuild cli
* [CB-1237](https://issues.apache.org/jira/browse/CB-1237) CDVDebugWebView no longer works since the ARC changes.
* [CB-1258](https://issues.apache.org/jira/browse/CB-1258) Add documentation for the new logic to toggle between different exec() techniques on 
* [CB-1296](https://issues.apache.org/jira/browse/CB-1296) Update .js with fix for broken bridge on 4.2
* [CB-1315](https://issues.apache.org/jira/browse/CB-1315) Setting the view controller's view size in viewWillAppear, use rootViewController
* [CB-1385](https://issues.apache.org/jira/browse/CB-1385) Fix executing legacy plugins when callbackId is null.
* [CB-1380](https://issues.apache.org/jira/browse/CB-1380) Fix data uri from being blocked
* [CB-1384](https://issues.apache.org/jira/browse/CB-1384) Online .wav files cannot be played, but ones local to www can
* [CB-1385](https://issues.apache.org/jira/browse/CB-1385) 2.1.0rc2 - breaks certain plugins on iOS due to added "null" argument using FORMAT TWO in iOSExec
* [CB-1402](https://issues.apache.org/jira/browse/CB-1402) Media API - wrong JavaScript callback is called for onStatus (typo)
* [CB-1412](https://issues.apache.org/jira/browse/CB-1412) 2.1.0rc2 - iOS Whitelist is never used, all urls will pass the whitelist
* [CB-1453](https://issues.apache.org/jira/browse/CB-1453) Namespace issue of JSONKit (JSONKitSerializingBlockAdditions)
* [CB-1457](https://issues.apache.org/jira/browse/CB-1457) Remove unused CDVMotion core plugin - causes Apple App Store upload rejection
* [GH-PR 34] Refactor chooseContact() to retrieve contact information instead of just a contactId.
* [GH-PR 35] Enhances iOS FileTransfer's support for upload headers
* Change default wire format of exec handler (was iframe, now xhr) see [CB-593].
* Update all core plugins to new exec format (new plugin signature, old one deprecated per deprecation policy)
* Split out CordovaLibApp and CordovaTests into a separate Xcode project.
* Add a benchmark into CordovaLibApp for measuring exec() speed.
* Added Echo plugin (for benchmarking) into CordovaLib
* Support JS->Native messages via an XHR & URL Protocol see [CB-593](https://issues.apache.org/jira/browse/CB-593)
* Refactor peoplePickerNavigationControllerDidCancel, always return dictionary with id kABRecordInvalidID.
* Deployment target for CordovaLib was not updated to 4.2 (we changed it in the template, but not the lib)
* Fixed null dereference in FileTransfer upload when URL is invalid.

<br />

### 2.0.0 (20120720) ###

* [CB-38](https://issues.apache.org/jira/browse/CB-38) Add support for chunked uploads to FileTransfer plugin.
* [CB-93](https://issues.apache.org/jira/browse/CB-93)  Only support iOS 4.2 and greater
* [CB-382](https://issues.apache.org/jira/browse/CB-382) Added unit tests for CDVLocalStorage
* [CB-758](https://issues.apache.org/jira/browse/CB-758) Updated bin/create template to use sub-project based Xcode project template.
* [CB-758](https://issues.apache.org/jira/browse/CB-758) Removed folders "Cordova-based Application" and "Cordova-based Application.xctemplate" - the Xcode 3/4 templates
* [CB-853](https://issues.apache.org/jira/browse/CB-853) Deprecate window.invokeString - use window.handleOpenURL(url) instead
* [CB-886](https://issues.apache.org/jira/browse/CB-886) Change Xcode CordovaLib (sub)project format to support easy header inclusion
* [CB-907](https://issues.apache.org/jira/browse/CB-907) Reverted for cross-platform consistency (and backwards compatibility). A doc issue should suffice [CB-1083](https://issues.apache.org/jira/browse/CB-1083)
* [CB-997](https://issues.apache.org/jira/browse/CB-997) [CB-976](https://issues.apache.org/jira/browse/CB-976) remove Organization
* [CB-989](https://issues.apache.org/jira/browse/CB-989) dyld: Symbol not found: _NSURLIsExcludedFromBackupKey
* [CB-1000](https://issues.apache.org/jira/browse/CB-1000) Namespace issue of JSONKit and other external libraries
* [CB-1001](https://issues.apache.org/jira/browse/CB-1001) Added Base64 unit tests.
* [CB-1004](https://issues.apache.org/jira/browse/CB-1004) $PROJECT_NAME is never set in iOS command line cordova/debug tool
* [CB-1010](https://issues.apache.org/jira/browse/CB-1010) End background task for LocalStorage backup if iOS terminate app before job is completed
* [CB-1015](https://issues.apache.org/jira/browse/CB-1015) Fixed FileTransfer upload params
* [CB-1025](https://issues.apache.org/jira/browse/CB-1025) Failure to save contact results in a crash when printing the error
* [CB-1028](https://issues.apache.org/jira/browse/CB-1028) Add tests for CDVFileTransfer.
* [CB-1028](https://issues.apache.org/jira/browse/CB-1028) Properly escape URLs within FileTransfer that end with slash.
* [CB-1030](https://issues.apache.org/jira/browse/CB-1030) Add FAQ issue for NSURLIsExcludedFromBackupKey linker issue for archived builds in iOS 5.0.1 devices
* [CB-1030](https://issues.apache.org/jira/browse/CB-1030) add "-weak-framework CoreFoundation" to linker settings
* [CB-1036](https://issues.apache.org/jira/browse/CB-1036) factored device info into its own plugin
* [CB-1036](https://issues.apache.org/jira/browse/CB-1036) Updated cordova-js to latest to support new common device module.
* [CB-1036](https://issues.apache.org/jira/browse/CB-1036) Updating plist to include new device plugin.
* Added bin subfolder (command line scripts) to .dmg distribution package
* [CB-1075](https://issues.apache.org/jira/browse/CB-1075) - Cordova 2.0 installer - rename old Xcode project templates to minimize confusion
* [CB-1082](https://issues.apache.org/jira/browse/CB-1082) Add url shortcut in .dmg for "Create a New Project"
* [CB-1095](https://issues.apache.org/jira/browse/CB-1095) Added "Hello Cordova" sample app as default
* [CB-1099](https://issues.apache.org/jira/browse/CB-1099) Remove deprecated functions in CDVPlugin (verifyArguments, appViewController)

<br />

### 1.9.0 (20120629) ###

* Fixes [CB-915](https://issues.apache.org/jira/browse/CB-915) - Pause/resume events get fired twice
* Fixes [CB-877](https://issues.apache.org/jira/browse/CB-877) - Opening a .doc file under iOS causes the file system API to break (and any other plugins that may use NSMutableArray pop)
* Fixes [CB-864](https://issues.apache.org/jira/browse/CB-864) - Failure in writing a large file blocks Cordova
* Fixes [CB-907](https://issues.apache.org/jira/browse/CB-907) - Wrong URL encoding when downloading/uploading files from/to URLs with Unicode characters in the path
* Fixes [CB-906](https://issues.apache.org/jira/browse/CB-906) - Hardware mute button doesn't effect Media API playback
* Fixes [CB-879](https://issues.apache.org/jira/browse/CB-879) - Support to set the volume when playing short sounds
* Enhanced [CB-471](https://issues.apache.org/jira/browse/CB-471) - LocalFileSystem.PERSISTENT "do not back up" file attribute iOS. Supports new iOS 5.1 iCloud Backup attribute (the old way is deprecated, and only for iOS 5.0.1)
* Fixed [CB-748](https://issues.apache.org/jira/browse/CB-748) - refactored-UUID is broken and changes over time (changed according to Apple's guidelines for this)
* Fixes [CB-647](https://issues.apache.org/jira/browse/CB-647) - Prefix/Namespace common native libraries
* Fixes [CB-961](https://issues.apache.org/jira/browse/CB-961) - Can not remove contact property values anymore
* Fixes [CB-977](https://issues.apache.org/jira/browse/CB-977) - MediaFile.getFormatData failing
* [CB-943](https://issues.apache.org/jira/browse/CB-943) decrease accelerometer interval from 100ms to 40ms
* [CB-982](https://issues.apache.org/jira/browse/CB-982) add usage help to create script, remove unnecessary parameters from debug project-level script
* Removing component guide; going into the docs
* Fixes [CB-957](https://issues.apache.org/jira/browse/CB-957) - (iOS) iOS Upgrade Guide Migration
* Updated [CB-957](https://issues.apache.org/jira/browse/CB-957) - Include Xcode 4 requirement
* Fixes [CB-914](https://issues.apache.org/jira/browse/CB-914) - Deactivate CDVLocalStorage (Backup/Restore, safari web preferences update)
* [CB-914](https://issues.apache.org/jira/browse/CB-914) Added BackupWebStorage setting in cli template
* Enhanced [CB-471](https://issues.apache.org/jira/browse/CB-471) - LocalFileSystem.PERSISTENT "do not back up" file attribute iOS. Supports new iOS 5.1 iCloud Backup attribute (the old way is deprecated, and only for iOS 5.0.1)
* Fixed [CB-748](https://issues.apache.org/jira/browse/CB-748) - refactored-UUID is broken and changes over time (changed according to Apple's guidelines for this)
* Fixes [CB-647](https://issues.apache.org/jira/browse/CB-647) - Prefix/Namespace common native libraries
* Fixes [CB-942](https://issues.apache.org/jira/browse/CB-942) - iOS failing FileTransfer malformed URL tests
* Updated [CB-957](https://issues.apache.org/jira/browse/CB-957) - Include Xcode 4 requirement
* Fixes [CB-914](https://issues.apache.org/jira/browse/CB-914) - Deactivate CDVLocalStorage (Backup/Restore, safari web preferences update)
* [CB-765](https://issues.apache.org/jira/browse/CB-765) Header Support iOS FileTransfer upload
* Removed Upgrade Guide and Cleaver Guide from repo - they are all in http://docs.cordova.io now
* [CB-863](https://issues.apache.org/jira/browse/CB-863) Splash screen on iOS not using localized UILaunchImageFile value
  
<br />

### 1.8.1 (20120612) ###

* Fixes [CB-885](https://issues.apache.org/jira/browse/CB-885) - Crash when sliding the notification tray and/or tel link confirm dialog
* Fixed [CB-506](https://issues.apache.org/jira/browse/CB-506) - images taken via Camera.getPicture do not get deleted
* Implemented [CB-857](https://issues.apache.org/jira/browse/CB-857) - Add deprecation notice if user is running iOS lesser than 4.2

<br />

### 1.8.0 (20120605) ###

* Fixes [CB-819](https://issues.apache.org/jira/browse/CB-819) fail callback not invoked
* [CB-794](https://issues.apache.org/jira/browse/CB-794) Add HTTP status code to FileTransferError object for iOS
* [CB-359](https://issues.apache.org/jira/browse/CB-359) Updates to adhere to W3C spec for geolocation. Changing actions based on changes incorporated into cordova-js
* [CB-683](https://issues.apache.org/jira/browse/CB-683) pause/resume events now should pass in event object into handlers
* [CB-464](https://issues.apache.org/jira/browse/CB-464) rewrite of accel plugin, simplified accel to start/stop actions.
* [CB-623](https://issues.apache.org/jira/browse/CB-623) added Logger plugin
* Fixed [CB-513](https://issues.apache.org/jira/browse/CB-513) - Remove cast functionality from CDVPluginResult, obsolete
* Fixed [CB-594](https://issues.apache.org/jira/browse/CB-594) - Remove checks for retainCount
* Fixed [CB-637](https://issues.apache.org/jira/browse/CB-637) - Add a doc on how to update the template project in the bin subfolder
* Updated bin folder scripts.
* Fixed [CB-669](https://issues.apache.org/jira/browse/CB-669) - verify.sh file in a new Cordova-based application project should not be included in the .app bundle
* Fixes [CB-471](https://issues.apache.org/jira/browse/CB-471) - LocalFileSystem.PERSISTENT "do not back up" file attribute iOS
* Fixed typo in File.getMetadata - error callback had OK instead of ERROR status
* Fixes [CB-610](https://issues.apache.org/jira/browse/CB-610) - Capture.bundle missing microphone image resources for retina iPad results in mis-drawn recording interface
* Fixes [CB-751](https://issues.apache.org/jira/browse/CB-751) - Undefined function is called when orientation change
* Fixes [CB-754](https://issues.apache.org/jira/browse/CB-754) - Use of -weak_library in 'other library flags' of generated template XCode app causes crashes in Simulator when Obj-C Blocks are used
* Fixes [CB-628](https://issues.apache.org/jira/browse/CB-628) - Scrub installation process, document artifacts of Xcode 3 support, mention no ARC
* Fixed [CB-628](https://issues.apache.org/jira/browse/CB-628) - Scrub installation process, document artifacts of Xcode 3 support, mention no ARC
* Fixes [CB-684](https://issues.apache.org/jira/browse/CB-684) - Not enough time for background execution of WebSQL/LocalStorage backup (when app goes to the background)
* Fixes [CB-766](https://issues.apache.org/jira/browse/CB-766) - Update bin/debug shell script to point to Homebrew ios-sim 1.4 download
* Fixes [CB-464](https://issues.apache.org/jira/browse/CB-464) - Refactor accelerometer native code in iOS
* Fixes [CB-760](https://issues.apache.org/jira/browse/CB-760) - Camera returns incorrect image size
* Fixed warning in CDVLocation
* Fixed EXC_BAD_ACCESS error in CDVAccelerometer
* Fixes [CB-818](https://issues.apache.org/jira/browse/CB-818) - Make CDVViewController also implement initWithNibName
* Fixes [CB-825](https://issues.apache.org/jira/browse/CB-825) - Makefile: remove direct download of Markdown and wkhtmltopdf (uses homebrew to download)
* Fixes [CB-328](https://issues.apache.org/jira/browse/CB-328) - Cordova crashes on iOS 3.x devices
* Fixes [CB-851](https://issues.apache.org/jira/browse/CB-851) - guide for using url schemes in iOS

<br />

### 1.7.0 (20120430) ###

* Fixed CB-183, [CB-54](https://issues.apache.org/jira/browse/CB-54) - ios camera targetWidth/Height don't match the documentation Fixes [CB-183](https://issues.apache.org/jira/browse/CB-183) and [CB-54](https://issues.apache.org/jira/browse/CB-54)
* Fixed [CB-511](https://issues.apache.org/jira/browse/CB-511) Changed deviceproperties version to "cordova" property
* Fixed [CB-483](https://issues.apache.org/jira/browse/CB-483) - FileTransfer - unknown property attribute 'atomic' when building from source (Xcode 3 only)
* Fixed [CB-507](https://issues.apache.org/jira/browse/CB-507) - Remove excessive debug logging in execute delegate method in CDVViewController
* Implemented [CB-536](https://issues.apache.org/jira/browse/CB-536) - Add new selector to CDVViewController to create a new CDVCordovaView, so subclasses can override it
* Workaround for [CB-509](https://issues.apache.org/jira/browse/CB-509) - geolocation.clearWatch doesn't shut the GPS down under iOS
* Fixed [CB-537](https://issues.apache.org/jira/browse/CB-537) - media.seekTo fails with NSRangeException
* Fixed [CB-544](https://issues.apache.org/jira/browse/CB-544) - iOS Geolocation fails if Cordova.plist EnableLocation = YES
* Fixed [CB-543](https://issues.apache.org/jira/browse/CB-543) - FileTransfer.upload WebKit discarded an uncaught exception
* Fixed [CB-391](https://issues.apache.org/jira/browse/CB-391) - camera.getPicture crash
* Implemented [CB-535](https://issues.apache.org/jira/browse/CB-535) - Add a way to log JavaScript exceptions, parse errors, and get JS stack frame events (with line numbers, etc)
* Fixed [CB-494](https://issues.apache.org/jira/browse/CB-494) - Move Cordova.plist section from "How to use Cordova as a Component Guide" to its own doc
* Fixed [CB-571](https://issues.apache.org/jira/browse/CB-571) - stubbed out create method to remove error when creating Media objects, also added another check if file does not exist.
* Fixed [CB-386](https://issues.apache.org/jira/browse/CB-386) - added retina iPad splash screens. made sure retina ipad icon files shows up during load.
* Re-fix [CB-347](https://issues.apache.org/jira/browse/CB-347) - localStorage / SQLDatabase Error after App update (timing issue for applying fix)
* Adjust splash screen position based on orientation and status bar size

<br />

### 1.6.1 (20120416) ###

* Fixed [CB-496](https://issues.apache.org/jira/browse/CB-496) - Camera.getPicture - will always return FILE\_URI even though DATA\_URL specified
* Fixed [CB-497](https://issues.apache.org/jira/browse/CB-497) - online and offline events are not being fired in 1.6.0
* Fixed [CB-501](https://issues.apache.org/jira/browse/CB-501) - orientationchange event is not being fired in 1.6.0
* Fixed [CB-302](https://issues.apache.org/jira/browse/CB-302) - orientation change event fired off twice on iOS 5.x
* Fixed [CB-507](https://issues.apache.org/jira/browse/CB-507) - Remove excessive debug logging in execute delegate method in CDVViewController

<br/>

### 1.6.0 (20120409) ###
* Updates for Media API
* Contacts updates for Unified JavaScript
* Fixed Contacts.save return value and Notification.confirm
* Changed Device initialization to use a require-based pattern
* Added require syntax for firing events in ios
* Added a getConnectionInfo method for compatibility
* Added require in pluginresult helper funcs
* Updated plist of plugin names -> classes to adhere to common labels in other platforms
* Rewrite of accelerometer code and removed DeviceInfo old init approach
* Added warning about changing compiler settings in xcode
* Changed Accel values to doubles
* Tweaked battery plugin for cordova-js use
* Updated interface to get Camera working. 
* Rewrote Location class to use cordova-js unified approach.
* Updated refs from require("cordova") to just "cordova", and other require calls to cordova.require
* Updated sub-project cordovalib steps
* Fixed Compass, Location for cordova-js integration
* Added unification of accelerometer values on ios (based on android values)
* Removed old JS, added cordova-js version
* Changes to CordovaLib makefile for generating JS
* Fixed [CB-260](https://issues.apache.org/jira/browse/CB-260) Can't install PhoneGap with new Xcode 4.3
* Fixed Xcode app detection (using Spotlight) in Makefile
* Fixed [CB-306](https://issues.apache.org/jira/browse/CB-306) - Remove extra template App delegate methods
* Fixes [CB-255](https://issues.apache.org/jira/browse/CB-255) - iOS: a parameter with value 'null' is not passed to 'arguments' array
* Fixed [CB-236](https://issues.apache.org/jira/browse/CB-236) - Add ContentLength Header in Upload request
* Fixed [CB-300](https://issues.apache.org/jira/browse/CB-300) - CDVFileTransfer crashes with 303 and empty response
* Fixed CB-148, [CB-316](https://issues.apache.org/jira/browse/CB-316) Playing HTTP / HTTPS urls using the Media API is not working
* Improved Makefile for mixed Xcode 4.2 and Xcode 4.3.1 environment.
* Fixed [CB-329](https://issues.apache.org/jira/browse/CB-329) - Add warning if multi-tasking is not supported on an iOS device (to console log)
* Fixed [CB-317](https://issues.apache.org/jira/browse/CB-317) : Xcode: Shell Script Invocation Error when directory has spaces in name
* Fixed [CB-330](https://issues.apache.org/jira/browse/CB-330) - localStorage / SQLDatabase no longer persistent after iOS 5.01 update
* Fixed [CB-347](https://issues.apache.org/jira/browse/CB-347) - iOS 5.1 localStorage / SQLDatabase error after upgrading an app
* Fixed shell script error - picks up new location of cordova.js (unified) now
* Fixed NOTICE file with correct project name
* Fixed [CB-49](https://issues.apache.org/jira/browse/CB-49) - UUID replacement
* Fixed [CB-361](https://issues.apache.org/jira/browse/CB-361) & use timeout to turn off compass sensor
* Fixed [CB-427](https://issues.apache.org/jira/browse/CB-427) - add back iOS only getPicture options
* Fixed [CB-349](https://issues.apache.org/jira/browse/CB-349) - Remove sessionKey usage (unused) in CDVViewController
* Fixed [CB-237](https://issues.apache.org/jira/browse/CB-237) - Updated splash screen assets
* Fixed [CB-387](https://issues.apache.org/jira/browse/CB-387) - try/catch wrapper in native iOS code for cordova-js initialization firing alerts when page without cordova.js is loaded in
* Fixed [CB-425](https://issues.apache.org/jira/browse/CB-425) - Notification buttons and title are not working for confirm and alert
* Fixed [CB-440](https://issues.apache.org/jira/browse/CB-440) - (LLVM-GCC only) Wrong number of arguments specified for 'deprecated' attribute
* Fixed [CB-441](https://issues.apache.org/jira/browse/CB-441) - make fails if PackageMaker.app installed at a path with spaces in a folder name.
* Fixed [CB-444](https://issues.apache.org/jira/browse/CB-444) - Xcode template new project - AppDelegate's self.invokeString usage was removed
* Fixed [CB-380](https://issues.apache.org/jira/browse/CB-380) - Update Cordova Upgrade Guide for 1.6.0
* Fixed [CB-445](https://issues.apache.org/jira/browse/CB-445) - Update "How to use Cordova as Component" Guide for 1.6.0
* Fixed [CB-381](https://issues.apache.org/jira/browse/CB-381) - Update Cordova Plugin Upgrade Guide for 1.6.0
* Fixed [CB-406](https://issues.apache.org/jira/browse/CB-406) - Update README.md
* Fixed [CB-433](https://issues.apache.org/jira/browse/CB-433) - CDVFileTransfer.m methods - convert use of "options" object into "arguments" array
* Fixed [CB-377](https://issues.apache.org/jira/browse/CB-377) - add a check for PM_APP,  XC_APP, and DEVELOPER in the Makefile
* REMOVED: navigator.splashscreen JavaScript interface (was unofficial) - use **cordova.exec(null, null, "SplashScreen", "hide", [])** OR **cordova.exec(null, null, "SplashScreen", "show", [])**

<br/>

### 1.5.0 (20120302) ###

* Fix NSLog crash in CDVWhitelist.m - parameter order reversed
* Updated the Upgrade Guide for 1.4.1
* Added UIWebViewBounce key to PhoneGap.plist (default is YES) (originally from an @alunny pull request)
* Updated README.md FAQ item #5 (upgrades)
* Added the German and Swedish resources to the Xcode templates
* Fixes [CB-149](https://issues.apache.org/jira/browse/CB-149) - Black Bar visible after landscape video
* Fixes [CB-221](https://issues.apache.org/jira/browse/CB-221) - On an orientation change, the orientationchange event not fired on iOS 3 and 4 
* Rename PhoneGap to Cordova.
* Completed Cordova Guides for 1.5.0
* Fixed [CB-253](https://issues.apache.org/jira/browse/CB-253) - Xcode 4 Cordova-based Application - DEBUG macro not defined
* Default GCC_VERSION is com.apple.compilers.llvm.clang.1_0 now
* Removed Xcode and iOS SDK checks in the installer (for the Xcode 4.3 install which goes under the /Applications folder)

<br/>

### 1.4.1 (20120201) ###
* Fixed [CB-212](https://issues.apache.org/jira/browse/CB-212) - iOS orientation switch broken in 1.4.0

<br/>

### 1.4.0 (20120130) ###
* Fixed [CB-143](https://issues.apache.org/jira/browse/CB-143) - Removing address from iOS contact causes crash
* Fixed [CB-153](https://issues.apache.org/jira/browse/CB-153) - Camera default destination should be FILE_URI
* Fixed [CB-7](https://issues.apache.org/jira/browse/CB-7) - Update source headers to apache license
* Fixed [CB-42](https://issues.apache.org/jira/browse/CB-42) - MediaPlaybackRequiresUserAction can now be set to NO
* Added stand-alone PGViewController (Cleaver - PhoneGap as a Component)
* Fixed iOS 5 quirks with presenting/dismissing modal viewcontrollers.
* Added 'How to Use PhoneGap as a Component' doc to the .dmg  (as a PDF)
* Added 'PhoneGap Upgrade Guide' doc to the .dmg  (as a PDF)
* Added for legacy support of deprecated PhoneGapDelegate - in core plugins.
* Removed PhoneGapLibTest project and folder
* Updated the app icons, splash-screens, and template icons for the Xcode template to Cordova ones.
* Added Battery core plugin to PhoneGap.plist

<br />

### 1.3.0 (20111219) ###
* added battery into PhoneGap framework compilation
* Fixes [CB-101](https://issues.apache.org/jira/browse/CB-101) can't access media in documents://subDir
* Added download method to filetransfer, interface is the same like on Android
* When playing audio from remote URL, stop as soon as download fails and make loading cacheable.
* Fixed #197 errors on repeated getCurrentPosition calls. If the location services were off when getCurrentPosition was called, turn them off again after the position is received.
* Don't force an orientation change unless the current orientation is unsupported
* Fixed callback/callback-ios#15 - Xcode 3.2.6 Linker error when Build for Active Architecture Only = YES
* Fixed callback/callback-ios#23 - on app resume, it always throws either an offline/online event even though the online state never changed
* Fixed warning - implicit conversion of UIInterfaceOrientation to UIDeviceOrientation (which are equivalent, for the two Portraits and two Landscape orientations)
* Fixed callback/callback-ios#22 - Removed unused DetectPhoneNumber and EnableAcceleration values in PhoneGap.plist
* Fixed [CB-96](https://issues.apache.org/jira/browse/CB-96) PGWhitelist does not handle IPv4 host addresses with wild-cards
* Added 'resign' and 'active' lifecycle events.

<br />

### 1.2.0 (20111103) ###

* Update for iOS 5 - Switched to using LLVM Compiler and fixed associated warnings. Added armv6 to architectures so can use devices running < iOS5
* Fixed phonegap/phonegap-iphone#313 - return MediaError in error callback
* Added documentation for correctOrientation and saveToAlbum options of camera.getPicture
* Fixed phonegap/phonegap-iphone#302 Compiler warnings in PGMotion
* Fixed phonegap/phonegap-iphone#296 iFrames open in Mobile Safari
* Fixed callback/callback-ios#5 - Optimization: If white-list contains "*" (wildcard), do not do URL processing
* Fixed callback/callback-ios#3 - UniversalFramework target of PhoneGapLib does not compile under Xcode 4.2
* Fixed callback/callback-ios#2 - Convert SBJson library use to JSONKit use
* Fixed problem where deploying to device using PhoneGap.framework, the armv7 slice is missing from the fat binary 
* Connection plugin (Reachability) - stop/start notifier on pause/resume of app (attempt at Reachability crash fix)
* Added OpenAllWhitelistURLsInWebView setting in PhoneGap.plist (to open all white-listed URLs in the PhoneGap webview)

<br />

### 1.1.0 (20110930) ###
  
* fixes issue #212 media play not always calling success callback
* added support for W3C battery status events
* fix audio view sizing on iPad when built for iPhone
* refs #277 regression in camera due to PluginResult changes
* fix broken file tests in mobile-spec
* fix #265 display contact not restoring after pause
* issue #230 Update compass implementation
* fixes #271 Implemented selecting picture type when getting images from library.
* fix #289 update contact to deal with an address with no type specified
* fix #293  Now clearing callback function when battery events stopped
* fix #232 Allow media playback to work when device locked or       add correctOrientation option to rotate images before returning them  
* add option for saving photo to the album
* add success,error method sugar to PGPlugin
* moved `device.js` before `capture.js` because `Capture`'s install function depends on `Device`'s constructor.
* fix, simplify, and extend PluginResult's toJSONString function.
* add unit-test target/product to PhoneGapLib.
* update Capture, Contacts, and File to not rely on PluginResult's previous bug.
* allow for using a custom UIWebView object. Just set self.webView in application:didFinishLaunchingWithOptions: before calling super.
* rework PhoneGap.exec() to execute commands much faster.
* fix a race condition in PhoneGap.exec().
* put the PhoneGap.exec() before deviceready warning in the right place.
* fixed issue #219: geolocation.watchposition() delayed
* fixes #207 iOS 3.x crash: NSConcreteGlobalBlock symbol not found
* fixed #228 getPicture crashes when getting picture from photobook on iPad
* added failing unit-tests for PGContacts.
* updated sample index.html with notes about the white-list.
* fixed #290 regression - modalViewController does not retain the UINavigationController as expected. This will still cause a static analyzer issue though
* restructuring for cli scripts, first pass at test automation, mobile-spec automation
* fixed #215 Add sha1 checksum for the .dmg file
* PhoneGapLib: Re-applied IPHONEOS_DEPLOYMENT_TARGET = 3.0 setting that was clobbered in a pull-request
* fixes #202 PhoneGapViewController code cleanup
* updated PhoneGapLibTest for 1.0.0 release, updated test submodule to latest
* fixed #221 Add linker flags for weak-linking frameworks, to templates
* fixed #225 Xcode 4 www folder warning - add additional help text
* fixed #224 make the default projects universal
* fixed #201 README.pdf - links from converted README.md not clickable, plus re-structure
* converted installer docs to markdown
* updated Makefile for new markdown docs.
* fixed #241 navigator.notification.alert - cannot set empty title
* fixed #199 Unnecessary warnings in console (about:blank)
* fixed #194 Enable white listing of domains that an application can access. All http and https urls MUST be in PhoneGap.plist/ExternalHosts or they will not be handled.
* fixed #233 wildcard support for ACL
* set properties to readonly in the AppDelegate, and removed some of the properties from the public interface.
* fixed #243 Splash screen spinner not visible
Removed GetFunctionName.js (unused)
* fixed #246 Add whitelist capability that includes XMLHttpRequest calls
* usage of VERIFY_ARGUMENTS macro in File plugin - related to #244
* fixed #259: PluginResult toJSONString does not quote strings in arrays
* added ability so that unhanded URLs (i.e. custom schemes in a web-page) will notify PhoneGap plugins of this custom url so that the plugins can handle it themselves. This would give the ability to handle callbacks for OAuth logins (Twitter/Facebook) in the main PhoneGap UIWebview, and not require the ChildBrowser plugin.
* fixes #263 Phone call - tel: scheme handling hides default behavior
* fixes #269 - Add Obj-C unit-tests for whitelist implementation
* fixed #256 PhoneGapDelegate (UIApplicationDelegate) property hides new property in iOS 5
* fixed #254 Prefix the SBJSON classes included in PhoneGap with 'PG'
* updated README FAQ to be up to date, and numbered the questions for easy reference.
* removed user cruft in .xcodeproj - project.workspace and xcuserdata folders.
* fixed geolocation authorizationStatus on first use. Changes to help debug issue #197
* fixed #197 navigator.geolocation.getCurrentPosition timeouts when native app works
* fixed #255 ability to play inline videos

<br />

### 1.0.0 (20110728) ###
  
* **CHANGED:** Update media implementation to match documentation. Significant modifications to match documentation. Using media.js from Android so significant changes to the code to match that architecture.  Created wrapper for AVAudioPlayer and Recorder to store the mediaId. Kept iOS only prepare() method but removed downloadCompleteCallback. Added seekTo method. 
* **CHANGED:** Default-Landscape.png width increased to 1024px for #185 fix below 
* **FIX:** #188 Xcode 3 Template does not weak-link UIKit, AVFoundation and CoreMedia by default 
* **FIX:** #183 make fails when a user's Developer (Xcode) folder has spaces in it 
* **FIX:** #180 Add README.md to the installer package 
* **FIX:** #186 return null when no organization information. iOS was incorrectly returning an organization object with all null values when there was no organization information. It now correctly returns null. 
* **FIX:** #182 updated getCurrentPosition to update _position variable. Fixed bug where seekTo was setting the _position value in milliseconds rather than seconds. getCurrentPosition was not setting _position to -1 when media was not playing. 
* **FIX:** #191 (CRASH) PhoneGap app re-suspends when resumed after Airplane Mode toggled 
* **FIX:** #196 PhoneGapInstaller.pkg should be signed 
* **FIX:** #185 splash screen ignores supported device orientations (fixed for Universal only - iPhone only on iPad has an iOS bug) 
* **REMOVED:** Installer readme.html is now generated from README.md markdown in the root 
* **REMOVED:** Default~ipad.png is removed from the project templates 
* **ADDED:** Prevents iframes from executing PhoneGap calls via gap urls 
* **ADDED:** Added warning log if splash-screen image is missing. 
* **NOTE:** 1.0.0rc3 tagged in the repo is essentially this release 

<br />

### 1.0.0rc2 (20110719) ###
  
* **FIX:** #167 Generated (by script) Xcode 3 template file fails in Xcode 4 
* **FIX:** #162 better accessibility for timed audio  
* **FIX:** #168 Warning in Xcode 3 project that you haven't added phonegap.*.js, warning never goes away 
* **FIX:** iPhone splash screen not showing (no issue #, fixed in splash screen new feature below) 
* **ADDED:** New PhoneGap.plist options: AutoHideSplashScreen (bool=true), ShowSplashScreenSpinner (bool=true). If AutoHideSplashScreen is false, you can control hiding the splash screen in JavaScript by calling navigator.splashscreen.hide(). 
* **ADDED:** #164 Add phonegap version inside the JavaScript file itself 
* **ADDED:** #166 Create uninstaller for PhoneGapInstaller  
* **ADDED:** #6 implemented Camera.EncodingType to return images as jpg or png from getPicture. 
* **CHANGED:** Sample splash screen images are annotated 
* **REMOVED:** #165 Remove minification of phonegap.*.js file 

<br />

### 1.0.0rc1 (20110712) ###
  
* **FIX:** Splash screen fixes for iPad 
* **REMOVED:** Deprecated items **REMOVED:** Notification activityStart/activityStop, Notification loadingStart/loadingStop, Network.isReachable, debug.log, File.writeAsText, PhoneGapCommand base class for Plugins, unused Image and Movie plugins removed 
* **RESTORED:** Camera core plugin has been un-deprecated until a suitable replacement can be found to grab photos from the Camera Roll/Photo Library. 
* **NEW:** phonegap.js naming convention: now phonegap-1.0.0rc.js, was phonegap.1.0.0rc1.js 
* **NEW:** Camera core plugin supports image scaling 
* **NEW:** Contacts core plugin updated to W3C June 2011 Spec 
* **NEW:** Contacts core plugin supports display and edit contact 
* **NEW:** Capture core plugin supports localized files for a11y prompt in Audio capture. 
* **NEW:** EnableViewportScale key in PhoneGap.plist (to enable viewport initial-scale metadata tag) 
* **NEW:** Plugins: PhoneGap.exec supports service names in Reverse Domain Name (RDN) notation i.e "com.phonegap.MyPlugin" 
* **NEW:** Plugins: PhoneGap.exec should support new signature: PhoneGap.exec(successCallback, failCallback, serviceName, action, [arg0, arg1]) 
* **NEW:** Plugins: Ability to override onMemoryWarning() to handle app memory warnings 
* **NEW:** Plugins: Ability to override onAppTerminate() to handle app termination 
* **NEW:** Plugins: Ability to override handleOpenURL:(NSNotification*) to handle launch of the app from a custom URL 
* **UPGRADERS:** Create a new project, and copy in the new phonegap-1.0.0rc1.*.js and PhoneGap.plist into your existing project 

<br />

### 0.9.6 (20110628) ###
  
* Xcode 3 Template includes the CoreMedia framework (as a weak reference for iOS 3.x) for the W3C Media Capture API 
* Xcode 4 Template includes the CoreMedia framework (as a required reference, template spec limitation) for the W3C Network API. You must change this to an 'optional' reference to target iOS 3.x devices, if not they will crash. 
* **UPGRADERS:** add the existing framework "CoreMedia" to your project, set it to weak/optional in your Target, copy the new phonegap.*.js files in manually to your www folder, and update your script references. Copy the .js files from /Users/Shared/PhoneGap/Frameworks/PhoneGap.framework/www. Copy the "Capture.bundle" from /Users/Shared/PhoneGap/Frameworks/PhoneGap.framework and add it to your project as well (or copy from a new project) 
* **UPGRADERS:** set the existing frameworks "UIKit" and "AVFoundation" to weak/optional (for iOS 3.x support) 
* CoreTelephony.framework can be removed in all projects, it is not needed anymore for the W3C Network Information API 
* Plugins **MUST** add their plugin mapping to *PhoneGap.plist* Plugins key, if not they will not work. 
* **DEPRECATED:** Camera.getPicture will be removed in 1.0 and put in the plugins repo, use the Media Capture API instead 
* **DEPRECATED:** Network.isReachable will be removed in 1.0, use the Network Information API instead 
* **DEPRECATED:** Notification activityStart, activityStop, loadingStart, loadingStop core plugin functions will be removed in 1.0 and put in the plugins repo 
* **DEPRECATED:** Plugin base class 'PhoneGapCommand' will be removed in 1.0, use the base class 'PGPlugin' instead

<br />

### 0.9.5.1 (20110524) ###
  
* Xcode 3 Template includes the CoreTelephony framework (as a weak reference for iOS 3.x) for the W3C Network Information API 
* Xcode 4 Template includes the CoreTelephony framework (as a required reference, template spec limitation) for the W3C Network Information API. You must change this to an 'optional' reference to target iOS 3.x devices, if not they will crash. 
* **UPGRADERS:** add the existing framework "CoreTelephony" to your project, set it to weak/optional in your Target, copy the new phonegap.*.js files in manually to your www folder, and update your script references. Copy the .js files from */Users/Shared/PhoneGap/Frameworks/PhoneGap.framework/www* 
* Xcode 3 Template does not copy the PhoneGap javascript files anymore into your www folder, the javascript files are now part of the template (**Xcode 3 UPGRADERS:** you will need to grab the .js files manually from *~/Documents/PhoneGapLib/javascripts* after building your project at least once) 
* PhoneGapLib use is considered deprecated, for a future installer the Xcode 3 Template will use the PhoneGap.framework exclusively 
* Xcode 4 Template has an improved build script - it will detect whether the 'www' folder reference was added and will warn you if it has not been added (**Xcode 4 UPGRADERS:** you will need to grab the .js files manually from */Users/Shared/PhoneGap/Frameworks/PhoneGap.framework/www*) 
* Added Xcode 4 Template (need to add in www folder reference manually - sample 'www' folder created after first run) 
* Added PhoneGap static framework generation (as the UniversalFramework target in PhoneGapLib xcodeproj) 
* Modified Xcode 3 Template (for compatibility with the Xcode 4 template) 
* Installed PhoneGap static framework in */Users/Shared/PhoneGap/Frameworks/PhoneGap.framework* (for non-admin privilege users, this may change in further updates) 

<br />

### 0.9.5 (20110427) ### 
  
* Updated PhoneGap application template to handle project and PhoneGapLib locations with spaces in it 
* Removed iPad template 
* Updated compiler of application template and PhoneGapLib to LLVM GCC 4.2 
* Cleaned up static analyzer warnings. 
* Updated PhoneGap application template to handle project and PhoneGapLib locations with spaces in it 
* Removed iPad template 
* Updated compiler of application template and PhoneGapLib to LLVM GCC 4.2 
* Cleaned up static analyzer warnings. 

<br />

### 0.9.4 (20110203) ###
  
* phonegap.js is minified using the YUI compressor, and also renamed to phonegap.{ver}.min.js where {ver} is the version number of PhoneGapLib from the VERSION file 
* the PhoneGap template is changed as well, at build time it will replace any references to 'src="phonegap.js"' to the new versioned js file (and copy the new phonegap.{ver}.min.js file). This replacement will look in all files in the 'www' folder. 
* note that with the new PhoneGapLib phonegap.{ver}.min.js renaming, existing PhoneGap templates must copy the new "Copy PhoneGap JavaScript" post-build script from the new template (in Xcode, under Targets/[ProjectName]) 

<br />

### 20101102 ###
  
* Updated the Base SDK to "Latest iOS" (iOS 4.2 is the minimum to submit to the App Store) for the project files. This setting requires the latest Xcode 3.2.5 (included with the iOS 4.2 SDK) 

<br />

### 20101019 ### 
  
* Updated the Base SDK to iOS 4.1 (the minimum to submit to the App Store) for the project files 

<br />

### 20100902 ###  
  
* Updated the Base SDK to iOS 4.0 (the minimum to submit to the App Store) for the project files 
* Added PhoneGapBuildSettings.xcconfig to the template. To override your PHONEGAPLIB folder on a project by project basis, modify the PHONEGAPLIB value in this file. 

<br />

### 20100416 ###
  
* Removed keys from PhoneGap.plist (AutoRotate, StartOrientation, RotateOrientation). 
* To support orientation in your app: edit/add the UISupportedInterfaceOrientations (iPhone) or UISupportedInterfaceOrientations~ipad (iPad) key into your app's [appname]-Info.plist, with an array of strings that show what orientation your app supports. The supported values are: UIInterfaceOrientationPortrait, UIInterfaceOrientationLandscapeLeft, UIInterfaceOrientationPortraitUpsideDown, UIInterfaceOrientationLandscapeRight.  
* The first value in the array is the orientation that your app starts in. If you have more than one value in the array, it will autorotate (to the other supported orientations). 

<br />

### 20100406 ###
  
* added iPad universal xcodeproj file (3.2 OS required) 

<br />

### 20091103  
  
* fixed permissions and initial run problems 

<br />

### 20091030 ### 
  
* initial release 
  
<br />
