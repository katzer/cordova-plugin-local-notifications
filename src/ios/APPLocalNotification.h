/*
 Copyright 2013-2014 appPlant UG

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

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface APPLocalNotification : CDVPlugin

// Executes all queued events
- (void) deviceready:(CDVInvokedUrlCommand*)command;
// Schedules a new local notification
- (void) add:(CDVInvokedUrlCommand*)command;
// Cancels a given local notification
- (void) cancel:(CDVInvokedUrlCommand*)command;
// Cancels all currently scheduled notifications
- (void) cancelAll:(CDVInvokedUrlCommand*)command;
// Checks wether a notification with an ID is scheduled
- (void) isScheduled:(CDVInvokedUrlCommand*)command;
// Retrieves a list of ids from all currently pending notifications
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command;
// Informs if the app has the permission to show notifications
- (void) hasPermission:(CDVInvokedUrlCommand *)command;
// Ask for permission to show notifications
- (void) promptForPermission:(CDVInvokedUrlCommand *)command;
// Informs which permissions the user has granted
- (void) didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;

@end
