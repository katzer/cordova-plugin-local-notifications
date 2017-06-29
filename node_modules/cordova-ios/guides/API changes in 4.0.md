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

# API Changes in cordova-ios-4.0

* CDVViewController.h (_updated_)
* CDVPlugin.h (_updated_)
* CDVPluginResult.h (_updated_)
* NSData+Base64.h (_removed_)
* CDVAppDelegate.h (_new_) 
* CDVJSON.h (_removed_)
* CDVJSON\_private.h (_removed_)
* CDVWebViewEngineProtocol.h (_new_)
* CDVURLRequestFilter.h (_new_)
* NSDictionary+CordovaPreferences.h (_new_)
* CDVWebViewDelegate.h (_removed_)
* NSDictionary+Extensions.h (_removed_)
* NSArray+Comparisons.h (_removed_)
* CDVHandleOpenURL.h (_removed_)
* CDVLocalStorage.h (_removed_)
* UIDevice+Extensions.h (_removed_)
* CDVShared.h (_removed_)
* CDVDebug.h (_removed_)
* Conditional Compilation

- - -

## CDVViewController.h (_updated_)


### Removed:

Methods:

    + (NSDictionary*)getBundlePlist:(NSString*)
    + (NSString*)applicationDocumentsDirectory
    - (void)javascriptAlert:(NSString*)
    - (void)printMultitaskingInfo
    - createGapView
    - (BOOL)URLisAllowed:(NSURL*)url

Properties:

    @property BOOL loadFromString

### Added:

Properties:

    @property id<CDVWebViewEngineProtocol> webViewEngine
    @property NSInteger* userAgentLockToken

### Modified:

Methods:

    - (UIView*)newCordovaViewWithFrame:(CGRect)bounds

Properties:

    @property UIView* webView

### Upgrade Notes:

The `webView` property is a `UIView` now, to take into account the different type of WebView engines that might be installed. 

To test and cast the `webView` property to `UIWebView`:

    if ([self.webView isKindOfClass:[UIWebView class]) {
        // call a UIWebView specific method here, for example
        [((UIWebView*)self.webView) goBack];
    }

- - -

## CDVPlugin.h (_updated_)

### Removed:

Methods:

    - (CDVPlugin*)initWithWebView:(UIWebView*)
    - (NSString*)writeJavascript:(NSString*)
    - (NSString*)success:(CDVPluginResult*) callbackId:(NSString*)
    - (NSString*)error:(CDVPluginResult*) callbackId:(NSString*)

Properties:

    @property CDVWhitelist* whitelist

### Added:

Methods:

    - (NSURL*)errorURL;
    - (BOOL)shouldOverrideLoadWithRequest:(NSURLRequest*) navigationType:(UIWebViewNavigationType)

Properties:

    @property id<CDVWebViewEngineProtocol> webViewEngine


### Deprecated:

    const CDVLocalNotification
    const CDVRemoteNotification
    const CDVRemoteNotificationError

These constants were unfortunately not removed in 4.0, but will be removed in 5.0. Local and remote push notification functionality was removed in the core in 4.0.

### Modified:

    @property UIView* webView


### Optional:

Methods:

    - (BOOL)shouldOverrideLoadWithRequest:(NSURLRequest*) navigationType:(UIWebViewNavigationType)

### Upgrade Notes:

Put your initialization code from `initWithWebView` into `pluginInitialize`. `pluginInitialize` is backwards-compatible, it has been there since cordova-ios-2.x. 

For example, if you have this:

    - (CDVPlugin*) initWithWebView:(UIWebView*)webView {
        self = [super initWithWebView:webView];
        if (self) {
            // Initialization code here
        }
        return self;
    }
 
 Move your initialization code to:
 
    - (void) pluginInitialize {
        // Initialization code here
    }

- - -

## CDVPluginResult.h (_updated_)

### Added:

Methods:

    + (CDVPluginResult*)resultWithStatus:(CDVCommandStatus)statusOrdinal messageAsNSInteger:(NSInteger)theMessage;
    + (CDVPluginResult*)resultWithStatus:(CDVCommandStatus)statusOrdinal messageAsNSUInteger:(NSUInteger)theMessage;


- - -

## NSData+Base64.h (_removed_)

This class has been removed.

### Removed:

Methods:

    + (NSData*)dataFromBase64String:(NSString*)aString CDV_DEPRECATED(3.8 .0, "Use cdv_dataFromBase64String");
    - (NSString*)base64EncodedString CDV_DEPRECATED(3.8 .0, "Use [NSData cdv_base64EncodedString]");
    + (NSData*)cdv_dataFromBase64String:(NSString*)aString;
    - (NSString*)cdv_base64EncodedString;
    
### Upgrade Notes:

Plugin authors are encouraged to use the (iOS 7+) base64 encoding and decoding methods available in [NSData](https://developer.apple.com/library/ios/documentation/Cocoa/Reference/Foundation/Classes/NSData_Class/) instead.

    // Decode a Base64 encoded string
    NSData* data = [[NSData alloc] initWithBase64EncodedString:encodedString options:0]
    
    // Encode a string to Base64
    NSString* encodedString = [data base64EncodedStringWithOptions:0];

- - -

## CDVAppDelegate.h (_new_)

This class is new. The default template's `AppDelegate` class inherits from this now for you to override.
    
### Upgrade Notes:

Apps that add code in the default template's old `AppDelegate.m` should add the appropriate function override in the new `AppDelegate.m`. Don't forget to call the superclass' implementation as well in your override.

- - -

## CDVJSON.h (_removed_)

These Objective-C Categories have been **removed**. 

### Upgrade Notes:

To convert from an NSArray/NSDictionary object to a JSON string:

    id object; // this is the NSArray/NSDictionary to convert from
    NSError* error = nil;
    NSString* jsonString = nil;
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject:object
                                                       options:NSJSONWritingPrettyPrinted
                                                         error:&error];
                                                         
    if (error == nil) {
        jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }

To convert from an NSString to an NSArray/NSDictionary object:

    NSString* jsonString; // this is the JSON to convert from
    NSError* error = nil;
    id object = [NSJSONSerialization JSONObjectWithData:[jsonString dataUsingEncoding:NSUTF8StringEncoding]
                                                options:NSJSONReadingMutableContainers
                                                  error:&error];

    if (error != nil) {
        NSLog(@"NSString can't be converted to an NSArray/NSDictionary error: %@", [error localizedDescription]);
    }

- - -

## CDVJSON\_private.h (_removed_)

These Objective-C Categories have been **removed** from the public API, and is private to CordovaLib.

- - -

## CDVWebViewEngineProtocol.h (_new_)

This is new in cordova-ios-4.0. An Objective-C protocol for plugins to implement, if they want to be an alternative WebView engine.

- - -

## NSDictionary+CordovaPreferences.h (_new_)

This is new in cordova-ios-4.0. An Objective-C Category helper for NSDictionary to get/set preferences.

- - -

## CDVWebViewDelegate.h (_removed_)

This protocol has been **removed** from the public API, and is part of a private plugin to CordovaLib (CDVUIWebViewEngine).

- - -

## NSDictionary+Extensions.h (_removed_)

This Objective-C Category has been **removed**.

- - -

## NSArray+Comparisons.h (_removed_)

This Objective-C category has been **removed**. 

### Upgrade Notes:

The Objective-C Category method was used as a helper for the `arguments` property of a `CDVInvokedURLCommand` object. Use the `argumentAtIndex` [methods provided](https://github.com/apache/cordova-ios/blob/master/CordovaLib/Classes/Public/CDVInvokedUrlCommand.h) in the `CDVInvokedURLCommand` object instead. 

- - -

## CDVHandleOpenURL.h (_removed_)

This plugin has been **removed** from the public API, and is now private to CordovaLib.

- - -

## CDVLocalStorage.h (_removed_)

This plugin has been **removed** from the public API, and is now private to CordovaLib.

- - -

## UIDevice+Extensions.h (_removed_)

This implementation has been **removed** and is part of the core plugin `cordova-plugin-device`.

- - -

## CDVShared.h (_removed_)

This legacy header has been **removed**; it was for core plugin compatibility that has been not been needed [since the Aug 2014 core plugin release](https://cordova.apache.org/news/2014/08/11/plugins-release.html).

- - -

## CDVDebug.h (_removed_)

This file has been **removed** from the public API, and is private to CordovaLib.

- - -

## Conditional Compilation

You can conditionally compile code based on the cordova-ios platform version that is installed. This might be for API calls that have no backwards-compatible equivalents. 

    // this import below must be declared first
    #import <Cordova/CDVAvailability.h>
    
    #ifdef __CORDOVA_4_0_0
        // Execute/declare code on cordova-ios-4.x or newer 
    #else
        // Execute/declare code for cordova-ios versions *less than* 4.x 
    #endif
 
 OR

    #ifndef __CORDOVA_4_0_0
        // Execute/declare code for cordova-ios versions *less than* 4.x 
    #endif
