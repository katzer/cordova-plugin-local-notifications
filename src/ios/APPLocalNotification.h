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

// Execute all queued events
- (void) deviceready:(CDVInvokedUrlCommand*)command;

// Inform if the app has the permission to show notifications
- (void) hasPermission:(CDVInvokedUrlCommand*)command;
// Register permission to show notifications
- (void) registerPermission:(CDVInvokedUrlCommand*)command;

// Schedule a new notification
- (void) add:(CDVInvokedUrlCommand*)command;
// Update a notification
- (void) update:(CDVInvokedUrlCommand*)command;
// Cancel a given notification
- (void) cancel:(CDVInvokedUrlCommand*)command;
// Cancel all currently scheduled notifications
- (void) cancelAll:(CDVInvokedUrlCommand*)command;

// If a notification with an ID exists
- (void) exist:(CDVInvokedUrlCommand*)command;
// If a notification with an ID was scheduled
- (void) isScheduled:(CDVInvokedUrlCommand*)command;
// If a notification with an ID was triggered
- (void) isTriggered:(CDVInvokedUrlCommand*)command;

// List all ids from all local notifications
- (void) getAllIds:(CDVInvokedUrlCommand*)command;
// List all ids from all pending notifications
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command;
// List all ids from all triggered notifications
- (void) getTriggeredIds:(CDVInvokedUrlCommand*)command;

// Property list for given local notifications
- (void) getAll:(CDVInvokedUrlCommand*)command;
// Property list for given scheduled notifications
- (void) getScheduled:(CDVInvokedUrlCommand*)command;
// Property list for given triggered notifications
- (void) getTriggered:(CDVInvokedUrlCommand*)command;

@end
