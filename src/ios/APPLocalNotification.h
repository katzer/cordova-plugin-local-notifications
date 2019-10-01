/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

#import <Cordova/CDVPlugin.h>

@import UserNotifications;

@interface APPLocalNotification : CDVPlugin <UNUserNotificationCenterDelegate>

- (void) launch:(CDVInvokedUrlCommand*)command;
- (void) ready:(CDVInvokedUrlCommand*)command;

- (void) actions:(CDVInvokedUrlCommand*)command;

- (void) check:(CDVInvokedUrlCommand*)command;
- (void) request:(CDVInvokedUrlCommand*)command;

- (void) schedule:(CDVInvokedUrlCommand*)command;
- (void) update:(CDVInvokedUrlCommand*)command;

- (void) clear:(CDVInvokedUrlCommand*)command;
- (void) clearAll:(CDVInvokedUrlCommand*)command;

- (void) cancel:(CDVInvokedUrlCommand*)command;
- (void) cancelAll:(CDVInvokedUrlCommand*)command;

- (void) type:(CDVInvokedUrlCommand*)command;

- (void) ids:(CDVInvokedUrlCommand*)command;

- (void) notification:(CDVInvokedUrlCommand*)command;
- (void) notifications:(CDVInvokedUrlCommand*)command;

@end
