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
## Release Notes for Cordova (Windows) ##

Update these notes using: git log --pretty=format:'* %s' --topo-order --no-merges *remote*/3.5.x...HEAD

cordova-windows is a library that enables developers to create Windows 8/8.1/10 and WP8.1 application projects that support Cordova APIs.

### 5.0.0 (Jan 27, 2017)
* [CB-12415](https://issues.apache.org/jira/browse/CB-12415) Windows build fails if start page is missing
* [CB-12416](https://issues.apache.org/jira/browse/CB-12416) (Windows) Built bundles are misplaced when building for multiple archs
* [CB-12298](https://issues.apache.org/jira/browse/CB-12298) [Windows] bundle.appxupload not generated for Windows 10 target Generate appxupload for non-bundle builds as well This closes #227
* Remove duplicate logic after upgrading cordova-common
* [CB-12163](https://issues.apache.org/jira/browse/CB-12163) Add resource-file reference functionality through a flag
* [CB-12163](https://issues.apache.org/jira/browse/CB-12163) Make resource-file copy files again
* Upgrade cordova-common to 2.0.0
* [CB-12298](https://issues.apache.org/jira/browse/CB-12298) [Windows] bundle.appxupload not generated for Windows 10 target
* [CB-12189](https://issues.apache.org/jira/browse/CB-12189) Add support for WinMD and DLL combination
* [CB-12238](https://issues.apache.org/jira/browse/CB-12238) [Windows] Colorize titlebar to match splash bg color
* [CB-11177](https://issues.apache.org/jira/browse/CB-11177) SplashScreen gets shifted on Windows devices with soft navbar
* [CB-12239](https://issues.apache.org/jira/browse/CB-12239) Add buildFlag option similar to iOS
* [CB-12193](https://issues.apache.org/jira/browse/CB-12193) cordova.js crashes windows app if there is no CoreWindow Also made confighelper to load after WinJS as it depends on it
* [CB-11751](https://issues.apache.org/jira/browse/CB-11751) 'extendedSplashScreen' is undefined
* [CB-12192](https://issues.apache.org/jira/browse/CB-12192) - No SplashScreen on Windows when content.src is subpage
* [CB-9287](https://issues.apache.org/jira/browse/CB-9287) Not enough Icons and Splashscreens for Windows 8.1 and Windows Phone 8.1
* Do not ignore already prefixed capabilities at plugin add/rm
* Fix pattern for extracting capabilities names
* [CB-12142](https://issues.apache.org/jira/browse/CB-12142) Move windows-specific logic from cordova-common
* [CB-12147](https://issues.apache.org/jira/browse/CB-12147) (windows) Fix typo in verbose output
* [CB-12124](https://issues.apache.org/jira/browse/CB-12124) Make available device capabilities in package.windows10.appxmanifest
* [CB-12071](https://issues.apache.org/jira/browse/CB-12071) Fix for [CB-11825](https://issues.apache.org/jira/browse/CB-11825) breaks usage of InProcessServer in Cordova Windows
* [CB-12036](https://issues.apache.org/jira/browse/CB-12036) Fix setSplashBgColor exception when no splashscreen is found

### 4.4.3 (Oct 19, 2016)
* [CB-12044](https://issues.apache.org/jira/browse/CB-12044) Fix splashscreen image path for ms-appx on Windows
* [CB-12042](https://issues.apache.org/jira/browse/CB-12042) Copy base.js to www directory at create
* [CB-11933](https://issues.apache.org/jira/browse/CB-11933) Add uap prefixes for capabilities at plugin install
* [CB-12003](https://issues.apache.org/jira/browse/CB-12003) updated node_modules
* [CB-11933](https://issues.apache.org/jira/browse/CB-11933) Remove capabilities from manifest
* [CB-11993](https://issues.apache.org/jira/browse/CB-11993) - windows platform doesn't test all node versions on appveyor and travis
* [CB-11825](https://issues.apache.org/jira/browse/CB-11825) Windows dll file won't be copied as resource while adding custom plugin to a UWP project
* output message, catch exception if require fails, change eventEmitter to events to be consistent with ios+android
* [CB-11922](https://issues.apache.org/jira/browse/CB-11922) - Add github pull request template
* [CB-11522](https://issues.apache.org/jira/browse/CB-11522) [windows] Make cordova-js handle 'unknown' type
* [CB-11857](https://issues.apache.org/jira/browse/CB-11857) Fixed VS 2015 detection on Windows 10 Anniversary
* [CB-10738](https://issues.apache.org/jira/browse/CB-10738) Use hardcoded Id attribute in Win10 manifest
* Add missing license headers to prebuild scripts
* Update bundled cordova-common dependency to 1.4.1
* [CB-11658](https://issues.apache.org/jira/browse/CB-11658) activated event is not fired on Windows 10 RS1
* [CB-11657](https://issues.apache.org/jira/browse/CB-11657) Add bom to www after plugin operations
* [CB-11478](https://issues.apache.org/jira/browse/CB-11478) Parse --archs option consistently
* [CB-11558](https://issues.apache.org/jira/browse/CB-11558) Make windows plugin rm remove ProjectReference items
* [CB-11579](https://issues.apache.org/jira/browse/CB-11579) windows: fix bug with 'cordova clean windows'

### 4.4.2 (Jul 25, 2016)
* [CB-11548](https://issues.apache.org/jira/browse/CB-11548) Fix issues where MSBuild cannot be found
* [CB-11241](https://issues.apache.org/jira/browse/CB-11241) Return adding BOM to www back to prepare
* [CB-11582](https://issues.apache.org/jira/browse/CB-11582) Remove duplicate capabilities when writing the appxmanifest

### 4.4.1 (Jul 11, 2016)
* [CB-11522](https://issues.apache.org/jira/browse/CB-11522) Save raw 'detail' object to activation context
* [CB-11538](https://issues.apache.org/jira/browse/CB-11538) Update README with information about logging
* [CB-11537](https://issues.apache.org/jira/browse/CB-11537) Do not duplicate log entries when printing logs
* [CB-11548](https://issues.apache.org/jira/browse/CB-11548) windows: Respect user-specified msbuild location
* [CB-11516](https://issues.apache.org/jira/browse/CB-11516) windows: Preparing icons w/ target fails
* [CB-11470](https://issues.apache.org/jira/browse/CB-11470) App crashes when trying to open from another app using Custom URL (Protocol)
* [CB-11443](https://issues.apache.org/jira/browse/CB-11443) Splashscreen is created the second time on resume on Windows

### 4.4.0 (May 30, 2016)
* [CB-11117](https://issues.apache.org/jira/browse/CB-11117): Optimize prepare for windows platform, clean prepared files
* [CB-11259](https://issues.apache.org/jira/browse/CB-11259): Improving build output
* [CB-11204](https://issues.apache.org/jira/browse/CB-11204): Catch when SDK not present on build and give appropriate error message
* [CB-11156](https://issues.apache.org/jira/browse/CB-11156) Change default FadeSplashScreenDuration value
* [CB-11176](https://issues.apache.org/jira/browse/CB-11176) Fix windows-splashscreen compatibility with older plugin versions
* [CB-11139](https://issues.apache.org/jira/browse/CB-11139) Use PluginManager from common to install/uninstall plugins
* [CB-10653](https://issues.apache.org/jira/browse/CB-10653) Making the windows activation context complete
* [CB-11150](https://issues.apache.org/jira/browse/CB-11150) CI Error - Windows Platform - Could not find XHR config file
* [CB-8056](https://issues.apache.org/jira/browse/CB-8056) Implement splashscreen for Windows platform
* [CB-11066](https://issues.apache.org/jira/browse/CB-11066) Remove uap prefixed capabilities along with regular ones
* [CB-11022](https://issues.apache.org/jira/browse/CB-11022) Duplicate www files on plugin installation
* [CB-10964](https://issues.apache.org/jira/browse/CB-10964) Handle build.json file starting with a BOM. This closes #166
* [CB-11024](https://issues.apache.org/jira/browse/CB-11024): Add preference to set the min UAP target version in the JSProj File

### 4.3.2 (Mar 31, 2016)
* [CB-10622](https://issues.apache.org/jira/browse/CB-10622) Upgrade cordova-common to work with 'target'-defined icons
* [CB-10927](https://issues.apache.org/jira/browse/CB-10927) Framework references in plugin.xml file prevent Windows Universal projects from being used on other machines
* [CB-10845](https://issues.apache.org/jira/browse/CB-10845) Invalidate manifest cache in prepare
* [CB-10714](https://issues.apache.org/jira/browse/CB-10714) Ignore case for --archs
* [CB-10138](https://issues.apache.org/jira/browse/CB-10138) Adds missing plugin metadata to plugin_list module for Windows

[4.3.1]
* [CB-10487](https://issues.apache.org/jira/browse/CB-10487) WindowsStoreIdentityName should be lowercased in Application.StartPage
* [CB-10446](https://issues.apache.org/jira/browse/CB-10446) Windows 10 Cordova Application restart instead of resume
* [CB-10440](https://issues.apache.org/jira/browse/CB-10440) Add CSS color names support for BackgroundColor on Windows
* [CB-10394](https://issues.apache.org/jira/browse/CB-10394) Do not cache manifest file while getting package name
* [CB-10299](https://issues.apache.org/jira/browse/CB-10299) Updated RELEASENOTES for release 4.3.0
* [CB-10381](https://issues.apache.org/jira/browse/CB-10381) fix the bug when removing a plugin with a `<frame>` tag
* [CB-10234](https://issues.apache.org/jira/browse/CB-10234) Better error message when Windows10 requires 'arch' flag
* [CB-10344](https://issues.apache.org/jira/browse/CB-10344) Fixed icons and splashscreens parsing
* [CB-10356](https://issues.apache.org/jira/browse/CB-10356) "npm install" fails for cordova-windows

[4.3.0]
* [CB-10193](https://issues.apache.org/jira/browse/CB-10193) Add BOM to www files at build stage instead of prepare
* [CB-10303](https://issues.apache.org/jira/browse/CB-10303) Fixes build arguments parsing
* [CB-10292](https://issues.apache.org/jira/browse/CB-10292) Windows platform support for next version of VS/MSBuild
* [CB-10224](https://issues.apache.org/jira/browse/CB-10224) Removes duplicated/incorrect console line
* [CB-9828](https://issues.apache.org/jira/browse/CB-9828) Implement and expose PlatformApi for Windows

[4.2.0]

* [CB-8481](https://issues.apache.org/jira/browse/CB-8481) Add backbutton support on Windows 10 and Windows Phone 8.1
* [CB-9565](https://issues.apache.org/jira/browse/CB-9565) Fixed build failure for Windows 10 when using Node x64.
* Changed output path of windows platforms to support cumulative build in VS.
* Created new solution file for dev14 and renaming old to vs2013.sln
* [CB-9870](https://issues.apache.org/jira/browse/CB-9870) Updated hello world template
* Fixed `internetClientServer` capability name in prepare and docs
* [CB-9800](https://issues.apache.org/jira/browse/CB-9800) Fixing contribute link.
* [CB-9836](https://issues.apache.org/jira/browse/CB-9836) Add .gitattributes to prevent CRLF line endings in repos
* [CB-9632](https://issues.apache.org/jira/browse/CB-9632) Fixed tests not to fail on Travis-CI
* [CB-8936](https://issues.apache.org/jira/browse/CB-8936) Introduced --dump arg to log script.
* Fix the case of Q requires.
* Fixed up "resport" to "report".
* Adds Travis badge

** Known Issues with 4.2.0 and Windows 10**

* The Windows 10 SDK includes a tool which can deploy to Windows 10 Phone, but not to a Windows 10 Phone Emulator.  To deploy to an emulator, open your solution file in Visual Studio.

[4.1.0]
* [CB-9499](https://issues.apache.org/jira/browse/CB-9499) Run failure targeting x64 with an x86 version of Node
* [CB-8936](https://issues.apache.org/jira/browse/CB-8936) Logs: Stability and formatting improvements
* [CB-8936](https://issues.apache.org/jira/browse/CB-8936) Windows logs: Improvements
* [CB-9482](https://issues.apache.org/jira/browse/CB-9482) Mobile deployment failure
* [CB-9482](https://issues.apache.org/jira/browse/CB-9482) Mobile emulator deployment failure
* [CB-8936](https://issues.apache.org/jira/browse/CB-8936) Added logging functionality
* [CB-9458](https://issues.apache.org/jira/browse/CB-9458) Updated the baseline version of Universal Windows to 10240.
* [CB-9456](https://issues.apache.org/jira/browse/CB-9456) Fixed windows app crash on startup
* [CB-9450](https://issues.apache.org/jira/browse/CB-9450) `WindowsStoreIdentityName` preference for Store publishing
* [CB-9455](https://issues.apache.org/jira/browse/CB-9455) Fixed requirements check failure
* [CB-8965](https://issues.apache.org/jira/browse/CB-8965) Wait for project creation before adding to it.
* [CB-8965](https://issues.apache.org/jira/browse/CB-8965) Copy cordova-js-src directory to platform folder during create
* [CB-9359](https://issues.apache.org/jira/browse/CB-9359) Adds support for .appxbundle creation
* [CB-9410](https://issues.apache.org/jira/browse/CB-9410) Added preferences for Windows Store ingestion.
* [CB-9408](https://issues.apache.org/jira/browse/CB-9408) Added a `windows-packageVersion` attribute to the `<widget>` element
* [CB-9283](https://issues.apache.org/jira/browse/CB-9283) Add support for Windows 10 WinAppDeployCmd for deployment to remote devices.
* [CB-9239](https://issues.apache.org/jira/browse/CB-9239) Fixes issue with windows prepare on posix platforms.
* [CB-9235](https://issues.apache.org/jira/browse/CB-9235) Adds more checks based on the windows-target-version
* [CB-9159](https://issues.apache.org/jira/browse/CB-9159) Fix WP8.1 deploy when 'window-target-version' is 10.0.
* [CB-9335](https://issues.apache.org/jira/browse/CB-9335) Windows quality-of-life improvements.
* put channel in its proper place, and removed comment. Removed extra )
* add same activated channel and activationContext for non-browserify workflows
* add activationContext + activated channel to windows
* [CB-9271](https://issues.apache.org/jira/browse/CB-9271) Removed the unnecessary device capabilities from the Windows 10 app manifest.
* [CB-9252](https://issues.apache.org/jira/browse/CB-9252) Migrate WinJS to an NPM dependency
* Adding .ratignore file.
* [CB-9164](https://issues.apache.org/jira/browse/CB-9164) Better error message when deploying to Windows10 phone emulator
* [CB-9097](https://issues.apache.org/jira/browse/CB-9097) fail with a more descriptive error if run as admin

** Known Issues with 4.1.0 and Windows 10**

* The Windows 10 SDK includes a tool which can deploy to Windows 10 Phone, but not to a Windows 10 Phone Emulator.  To deploy to an emulator, open your solution file in Visual Studio.

[4.0.0]
* [CB-8954](https://issues.apache.org/jira/browse/CB-8954) Adds `requirements` command support to check_reqs module
* [CB-9073](https://issues.apache.org/jira/browse/CB-9073) Fixes build error when path to project contains `&` symbol
* [CB-8889](https://issues.apache.org/jira/browse/CB-8889) Persist app/package name and product ID during platform update.
* Updating appx manifest to a large extent now happens in the `prepare` step as opposed to the `build` step. This change implies that cordova-windows 4.0.0 can only work with with cordova CLI > 5.0
* [CB-8486](https://issues.apache.org/jira/browse/CB-8486) Support for creating signed package and build.json for Windows
* Add preview support for Windows 10 Universal Apps. To target Windows 10, add `<preference name="windows-target-version" value="10.0" />` to config.xml.
* The default windows target version is now 8.1.
* Support for `--appx` command line argument to override the windows target version
* [CB-8946](https://issues.apache.org/jira/browse/CB-8946) Added the `WindowsToastCapable` preference to indicate that the app can support toasts.  This is to support the Local Notifications plugin.
* [CB-8856](https://issues.apache.org/jira/browse/CB-8856) Fix 'Id' attribute is invalid when creating Windows Store submission build
* [CB-8307](https://issues.apache.org/jira/browse/CB-8307) Adding a 25-year expiration temporary certificate.
* [CB-8760](https://issues.apache.org/jira/browse/CB-8760) platform list doesn't show version for windows platform.

**Known Issues with 4.0.0 and Windows 10**

* Windows 10 Technical Preview 2 does not have a command-line compatible emulator deployment scenario.  To deploy to an emulator, open your solution file in Visual Studio.
* The Windows SDK included with Visual Studio 2015 RC does not include a tool to deploy to a Windows 10 Phone.  To deploy to a phone, open your solution file in Visual Studio.
* WinJS is included inline in the package.  In the future, it will be migrated to an NPM dependency. WinJS UI functionality is not included and should be add by you. (see [WinJS on Github](http://github.com/winjs/winjs)).

[3.8.2]
* Update cordova.js with a fix that causes Ripple emulation to fail.

[3.8.1]

* [CB-8796](https://issues.apache.org/jira/browse/CB-8796) updated package.json version manually
* [CB-8796](https://issues.apache.org/jira/browse/CB-8796) updated version file manually
* Removed verbose strict inequality tests
* Added check for undefined
* Fix for callback invocation with NO_RESULT
* Fixed wording of warning + removed a commented out line
* make bin scripts executable
* Update JS snapshot to version 3.8.1 (via coho)

[3.8.0]

* Update JS snapshot to version 3.8.0 (via coho)
* [CB-7985](https://issues.apache.org/jira/browse/CB-7985) windows platform does not build with Visual Studio 14 CTP tools
* [CB-8515](https://issues.apache.org/jira/browse/CB-8515) Support DefaultLanguage selection for Windows
* [CB-8321](https://issues.apache.org/jira/browse/CB-8321) Add supported orientations config.xml preference handling for `windows` platform
* [CB-8525](https://issues.apache.org/jira/browse/CB-8525) Fix audit-license-headers check on Windows
* [CB-8400](https://issues.apache.org/jira/browse/CB-8400) Enable jshint for Windows platform and fix all jshint issues
* [CB-8417](https://issues.apache.org/jira/browse/CB-8417) moved platform specific js into platform
* [CB-8330](https://issues.apache.org/jira/browse/CB-8330) Added new unit tests
* [CB-8136](https://issues.apache.org/jira/browse/CB-8136) Implemented prototype for end to end and unit tests via Jasmine
* Fixed regex used in getPackageFileInfo().

[3.7.1]

* Updated expired temporary certificate

[3.7.0]

* Update JS snapshot to version 3.7.0 (via coho)
* [CB-7731](https://issues.apache.org/jira/browse/CB-7731) catch obvious missing args error
* [CB-7493](https://issues.apache.org/jira/browse/CB-7493) Adds `space-in-path` and `unicode in name` tests for CI
* [CB-7656](https://issues.apache.org/jira/browse/CB-7656) Fixes `list-devices` and `list-emulators` commands
* Fixes `msbuild` failure after **Windows** project creation
* [CB-7617](https://issues.apache.org/jira/browse/CB-7617) partial match support for `--target`
* [CB-7666](https://issues.apache.org/jira/browse/CB-7666) Merge `node_modules` and move to package root
* [CB-7666](https://issues.apache.org/jira/browse/CB-7666) Move stuff outside of **Windows** subdir
* updated release notes for `3.6.4`
* [CB-7617](https://issues.apache.org/jira/browse/CB-7617) Deploy on WP8.1 incorrectly handles `--target` name
* [CB-7601](https://issues.apache.org/jira/browse/CB-7601) Build fails due to capabilities with m: prefixes are incorrectly sorted
* [CB-7520](https://issues.apache.org/jira/browse/CB-7520) copy MRT images defined in config.xml
* [CB-7520](https://issues.apache.org/jira/browse/CB-7520) `.appxbundle` package format support
* [CB-7520](https://issues.apache.org/jira/browse/CB-7520) refine image names, use wildcard to include MRT images
* [CB-7494](https://issues.apache.org/jira/browse/CB-7494) Fixes wrong replacements in `*.appxmanifest` files
* [CB-7452](https://issues.apache.org/jira/browse/CB-7452) Windows. Rewrite `ApplyPlatformConfig.ps1` using NodeJS
* [CB-7377](https://issues.apache.org/jira/browse/CB-7377) Removes unnecessary rules tracing which is also incorrectly handled by PS

[3.6.4]

* Set VERSION to 3.6.4 (via coho)
* Update JS snapshot to version 3.6.4 (via coho)
* [CB-7617](https://issues.apache.org/jira/browse/CB-7617) partial match support for --target
* [CB-7617](https://issues.apache.org/jira/browse/CB-7617) Deploy on WP8.1 incorrectly handles --target name
* bundledDependencies + fixed some whitespace

[3.6.0]

* [CB-7377](https://issues.apache.org/jira/browse/CB-7377) Removes unnecessary rules tracing which is also incorrectly handled by PS
* update cordova.js
* Removed un-needed files, multiple cordova.js files can only cause confusion
* [CB-7377](https://issues.apache.org/jira/browse/CB-7377) Whitelist. Windows build error due to 'invalid URI rules in config.xml'
* [CB-7333](https://issues.apache.org/jira/browse/CB-7333) Makes default platform template files overridable
* Add appveyor badge
* [CB-7129](https://issues.apache.org/jira/browse/CB-7129) VS2012 solution now accepts "anycpu" target instead of "any cpu"
* [CB-7129](https://issues.apache.org/jira/browse/CB-7129) Fixes issue when project isn't built if msbuild v12.0 is not found.
* updated repo README
* updated repo README
* add appveyor file for ci
* add basic npm test of create+build project
* ignore node_modules
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) Reflect new switch name to project structure
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) Changes switch name from '--store' to '--win'
* Moves node_modules to bin to correctly work under npm
* Adds missing ExecutionPolicy option for powershell
* Configurable target version for store and phone targets.
* [CB-7129](https://issues.apache.org/jira/browse/CB-7129) spellcheck
* Rewrite tooling/platform scripts from WSH to NodeJS
* [CB-7243](https://issues.apache.org/jira/browse/CB-7243) VERSION file is copied over in create platform script.
* Using wildcard ** glob to include www folder items [CB-6699](https://issues.apache.org/jira/browse/CB-6699) #32 #10
* [CB-7144](https://issues.apache.org/jira/browse/CB-7144) Windows8 run fails if replace default certificate
* [CB-6787](https://issues.apache.org/jira/browse/CB-6787) Windows8 - Fix header licenses (Apache RAT report)
* updated cordova.js
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) support for new splash screen and icon images
* fixes potential perf issue inside exec_verbose method
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) fixes deploy error when --nobuild option specified
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) replaces new template icons and splash screens
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) fixes deploy error on WP8.1 emulator
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) fixes run/emulate error when it runs for the first time
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) fixes deploy when target type is not specified
* Adds support for build archs to run command  + small cleanup and refactoring  + fix jshint issues
* [CB-6976](https://issues.apache.org/jira/browse/CB-6976) Add support for Windows Universal apps (Windows 8.1 and WP 8.1)
* Cleanup. This closes #10
* Removed Windows7 which is now in it\'s own branch. This closes #29
* Added list of supported architectures in help text
* Adds support for target architectures to build command
* Closing merged pull requests. close #31, close #30
* Close stale pull-reqs, close #22, close #21, close #19
* [CB-6686](https://issues.apache.org/jira/browse/CB-6686) [3.5.0rc][Windows8] Build  error if path contains whitespaces
* [CB-6684](https://issues.apache.org/jira/browse/CB-6684) [3.5.0rc][Windows8] Splash screen setting breaks the build
* [CB-6787](https://issues.apache.org/jira/browse/CB-6787) Add license to windows8/CONTRIBUTING.md
* [CB-6684](https://issues.apache.org/jira/browse/CB-6684) [3.5.0rc][Windows8] Splash screen setting breaks the build
* [CB-6686](https://issues.apache.org/jira/browse/CB-6686) [3.5.0rc][Windows8] Build  error if path contains whitespaces


[3.5.0]

* [CB-6557](https://issues.apache.org/jira/browse/CB-6557) added pacakge.json to windows8
* [CB-6491](https://issues.apache.org/jira/browse/CB-6491) add CONTRIBUTING.md
* [CB-6309](https://issues.apache.org/jira/browse/CB-6309) Windows8. Add Splash Screen img support via config.xml preference, [CB-6544](https://issues.apache.org/jira/browse/CB-6544) SplashScreenBackgroundColor, [CB-6545](https://issues.apache.org/jira/browse/CB-6545) support multiple preferences
* moved PlatformConfig functionality to pre-build project level so running outside of cli will still work
* Fix for when background-color and/or content-src aren\'t specified in config.xml
* Background color now applied to windows 8 project config during build process. * Added logic to convert hexadecimal color to windows 8 specific format
* Fix build/deploy errors when path to project contains spaces
* Version files updated to 3.5.0-dev
* [CB-6435](https://issues.apache.org/jira/browse/CB-6435) ./VERSION & /template/VERSION updated
* Modify execution policy restrictions removal logic. Using PS native cmdlet to remove restrictions.
* [CB-6397](https://issues.apache.org/jira/browse/CB-6397) [windows8] Use the latest version of MSBuild Tools installed to build the app
* [CB-6256](https://issues.apache.org/jira/browse/CB-6256) [CB-6266](https://issues.apache.org/jira/browse/CB-6266) Add support for domain whitelist and start page settings to Windows8
* [CB-2970](https://issues.apache.org/jira/browse/CB-2970) [CB-2953](https://issues.apache.org/jira/browse/CB-2953) log unsupported methods and exit with code 1
* [CB-2978](https://issues.apache.org/jira/browse/CB-2978) list-devices not supported on windows 8
* [CB-6091](https://issues.apache.org/jira/browse/CB-6091) [windows] Build fails if application path contains whitespaces
* [CB-6083](https://issues.apache.org/jira/browse/CB-6083) [windows8] Use registry to read msbuild tools path
* [CB-6042](https://issues.apache.org/jira/browse/CB-6042) [windows8] Cordova emulate fails if no developer certificate is installed
* [CB-5951](https://issues.apache.org/jira/browse/CB-5951) Added namespace to config.xml
* Remove template file after create by name
* [CB-4533](https://issues.apache.org/jira/browse/CB-4533) return error code 2 on fail, [CB-5359](https://issues.apache.org/jira/browse/CB-5359) get tools version from the registry
* update to 3.4.0 js and increment version num
* [CB-5951](https://issues.apache.org/jira/browse/CB-5951) Added namespace to config.xml
* Remove template file after create by name
* [CB-4533](https://issues.apache.org/jira/browse/CB-4533) return error code 2 on fail, [CB-5359](https://issues.apache.org/jira/browse/CB-5359) get tools version from the registry
* update cordova-js and VERSION
