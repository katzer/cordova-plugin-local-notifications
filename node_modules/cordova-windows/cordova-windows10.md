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

*This document contains information about an experimental branch of cordova-windows with support for 
Windows 10 Technical Preview 2 released at the Build conference in April 2015.  Information is subject 
to change with later revisions of the software.*

# What’s New in Windows 10 for Cordova #
Windows 10 has a number of new platform features that make it easier to share code across Cordova 
applications, as well as bringing forward support for hosted web apps.  This document outlines what 
app developers and plugin developers need to know about Windows 10 when building support for Windows.

## Getting Started with Windows 10 ##
Adding Windows 10 support to your app is as easy as setting your Windows target platform version to 
10.0:

    <preference name="windows-target-version" value="10.0" />

To develop apps for Windows 10, you require:

* Windows 8.1 or Windows 10 Technical Preview 2, 32-bit or 64-bit
* Visual Studio 2015 RC

### Web Context and Windows Runtime Access ###

In Windows 8.1, loading your app into the web context (using `ms-appx-web://`) would allow 
developers freedom of certain kinds of document manipulation (such as inline script) but would 
prevent Windows Runtime (WinRT) access.  In Windows 10, many of these restrictions have been lifted; 
web applications have access to WinRT APIs as long as the page’s origin has been whitelisted in the 
app manifest.
  
To prevent malicious scripts injection, developers are encouraged to:

* Whitelist only authorized and protected origins using the allow-navigation tag in config.xml
* Apply a [Content Security Policy](http://content-security-policy.com/) meta tag to all pages 
viewed in a Cordova app

These are good practices in all cases.

### Remote Access and Capabilities ###

When the app manifest declares remote URIs or Web Context to have access to WinRT, then the 
public Windows Store will prevent on-boarding of apps that have the following capabilities 
declared:

* Enterprise Authentication (`enterpriseAuthentication`)
* Shared User Certificates (`sharedUserCertificates`)
* Documents Library (`documentsLibrary`)
* Music Library (`musicLibrary`)
* Pictures Library (`picturesLibrary`)
* Videos Library (`videosLibrary`)
* Removable Storage (`removableStorage`)
* Internet client/server (`internetClientServer`) - note that `internetClient` is 
still permitted
* Private network client/server (`privateNetworkClientServer`)

Each of the library restrictions may be worked around by requesting that the user interact 
with the file system via a file picker.  This prevents malicious injected code from arbitrarily 
accessing (for example) the file system.

The network-related restrictions must be worked around by either using an API that doesn't use 
capability checks or by brokering communication via standard internet communication channels, 
such as `XMLHttpRequest` or Web Sockets.

The Enterprise Authentication and Shared User Certificates capabilities are specifically 
targeted at Enterprise scenarios. These capabilities are supported for private/enterprise-enabled 
App Stores, so if you are building apps which are going to be deployed to an internal deployment 
mechanism, you can still support these. 

Whenever you build targeting Windows 10, if one of these capabilities is detected in your app 
manifest, a warning will be displayed.

## Reference ##

### config.xml Preferences ###

#### windows-target-version, windows-phone-target-version ####

    <preference name="windows-target-version" value="10.0" />
    <preference name="windows-phone-target-version" value="10.0" />

*The default value is 8.1 for both platforms*

These preferences identify the version of Windows or Windows Phone you would like your app 
package to target.

**Valid Values**

* 10.0, UAP: Builds for Windows 10 Universal Windows Platform
* 8.1: Builds for Windows 8.1 or Windows Phone 8.1 (the default)

**Scenarios**

If you are targeting Windows 8.1 or Windows 10 only, you only need to have a single 
`windows-target-version` setting in your config.xml file.  Explicitly setting 
`windows-target-version` to specify Windows 10 will push the Phone setting to 10 as well.

#### WindowsDefaultUriPrefix ####
    <preference name="WindowsDefaultUriPrefix" value="ms-appx://|ms-appx-web://" />

This preference identifies whether you want your app to target the local context or web 
context as its startup URI. When building for Windows 10, the default is the web context 
(`ms-appx-web://`).

In order to have a local-context application that is not impacted by web-context capability 
restrictions, you must set this preference to `ms-appx://` and not declare any 
`<allow-navigation>` elements with remote URIs.

**Valid Values**

* `ms-appx://` (Default for Windows 8.1): The start page runs in the local context
* `ms-appx-web://` (Default for Windows 10): The start page runs in the web context

#### {SDK}-MinVersion, {SDK}-MaxVersionTested ####
*Optional*

    <preference name="Windows.Universal-MinVersion" value="10.0.0.0" />
    <preference name="Windows.Mobile-MinVersion" value="10.0.9927.0" />
    <preference name="Windows.Mobile-MaxVersionTested" value="10.0.10031.0" />
    <preference name="Microsoft.Northwind-MinVersion" value="10.0.11.0" />

These preferences identify which ecosystems or required Extension SDKs (including but not 
limited to Windows Universal, Windows Mobile, or Xbox) and the min/max versions they are 
compatible with. They still require that the platforms have support for the Universal 
Windows Platform (with Windows 10 as the base OS). However, these may indicate that the 
application is aware of particular functionality that may only be available on certain 
devices.

**Valid Values**

There are three parts to each value: the **SDK**, the **version restriction**, and the 
**version value**. These preferences are detected by beginning with `Windows` or 
`Microsoft` and ending in `-MinVersion` or `-MaxVersionTested`:

* The **SDK** defines what platform or Extension SDK you want to target. The default is 
`Windows.Universal`. Valid values for these are defined in the AppxManifest schema, 
in thePackage/Dependencies/TargetPlatform elements.
* The **version restriction** defines application compatibility rules. For example, if the 
`-MinVersion` is set to `10.1.0.0`, then OS versions which don't support at least 10.1.0.0 
of the corresponding SDK won't be able to load it.
 * `-MinVersion` specifies the minimum version of the SDK required
 * `-MaxVersionTested` specifies the highest-tested version of the SDK. If a new version of 
 the corresponding SDK is released, it will run in compatibility mode for the specified version.
* The **version value** is a 4-integer tuple in the form of *major.minor.build.qfe*.

If no preferences of these types are specified in your config.xml file, then 
`Windows.Universal` version 10.0.0.0 will be chosen by default.

### The allow-navigation Element ###
    <allow-navigation href="http://www.contoso.com/" />

This preference identifies origins which will have access to Windows APIs.  Effectively, this 
means that origins which are whitelisted with allow-navigation elements can be top-level 
navigation targets, and will have full access to Cordova plugins that target Windows.

This aligns with the behavior of the `allow-navigation` element in 
[cordova-plugin-whitelist](https://github.com/apache/cordova-plugin-whitelist), but is built 
into the platform.  Both the top-level page, as well as webviews, will have access based on 
the origin of the URI.  It is recommended that, when using this element, that any pages loaded 
into the frame have a Content Security Policy applied.
