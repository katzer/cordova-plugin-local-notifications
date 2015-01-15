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

#import "APPLocalNotification.h"
#import "APPLocalNotificationOptions.h"
#import "AppDelegate+APPLocalNotification.h"
#import "UIApplication+APPLocalNotification.h"
#import "UILocalNotification+APPLocalNotification.h"

#import <Availability.h>

@interface APPLocalNotification ()

// Retrieves the application state
@property (readonly, getter=applicationState) NSString* applicationState;
// All events will be queued until deviceready has been fired
@property (readwrite, assign) BOOL deviceready;
// Event queue
@property (readonly, nonatomic, retain) NSMutableArray* eventQueue;
// Needed when calling `registerPermission`
@property (nonatomic, retain) CDVInvokedUrlCommand* command;

@end

@implementation APPLocalNotification

@synthesize deviceready, eventQueue;

#pragma mark -
#pragma mark Interface

/**
 * Execute all queued events.
 */
- (void) deviceready:(CDVInvokedUrlCommand*)command
{
    deviceready = YES;

    for (NSString* js in eventQueue) {
        [self.commandDelegate evalJs:js];
    }

    [eventQueue removeAllObjects];
}

/**
 * Schedule a set of notifications.
 *
 * @param properties
 *      A dict of properties for each notification
 */
- (void) add:(CDVInvokedUrlCommand*)command
{
    NSArray* notifications = command.arguments;

    [self.commandDelegate runInBackground:^{
        for (NSDictionary* options in notifications) {
            UILocalNotification* notification;

            notification = [[UILocalNotification alloc]
                            initWithOptions:options];

            [self scheduleLocalNotification:[notification copy]];
            [self fireEvent:@"add" localNotification:notification];

            if (notifications.count > 1) {
                [NSThread sleepForTimeInterval:0.01];
            }
        }

        [self execCallback:command];
    }];
}

/**
 * Update a set of notifications.
 *
 * @param properties
 *      A dict of properties for each notification
 */
- (void) update:(CDVInvokedUrlCommand*)command
{
    NSArray* notifications = command.arguments;

    [self.commandDelegate runInBackground:^{
        for (NSDictionary* options in notifications) {
            NSString* id = [options objectForKey:@"id"];
            UILocalNotification* notification;

            notification = [[UIApplication sharedApplication]
                            scheduledLocalNotificationWithId:id];

            if (!notification)
                continue;

            [self updateLocalNotification:[notification copy]
                              withOptions:options];

            if (notifications.count > 1) {
                [NSThread sleepForTimeInterval:0.01];
            }
        }

        [self execCallback:command];
    }];
}

/**
 * Cancel a set of notifications.
 *
 * @param ids
 *      The IDs of the notifications
 */
- (void) cancel:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        for (NSString* id in command.arguments) {
            UILocalNotification* notification;

            notification = [[UIApplication sharedApplication]
                            scheduledLocalNotificationWithId:id];

            if (!notification)
                continue;

            [self cancelLocalNotification:notification];
            [self fireEvent:@"cancel" localNotification:notification];
        }

        [self execCallback:command];
    }];
}

/**
 * Cancel all currently scheduled notifications.
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        [self cancelAllLocalNotifications];
        [self fireEvent:@"cancelall"];
        [self execCallback:command];
    }];
}

/**
 * If a notification by ID exists.
 *
 * @param id
 *      The ID of the notification
 */
- (void) exist:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        NSString* id = [[command arguments]
                        objectAtIndex:0];

        CDVPluginResult* result;
        UILocalNotification* notification;

        notification = [[UIApplication sharedApplication]
                        localNotificationWithId:id];

        bool exists = notification != NULL;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:exists];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * If a notification by ID is scheduled.
 *
 * @param id
 *      The ID of the notification
 */
- (void) isScheduled:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSString* id = [[command arguments]
                        objectAtIndex:0];

        CDVPluginResult* result;
        UILocalNotification* notification;

        notification = [[UIApplication sharedApplication]
                        scheduledLocalNotificationWithId:id];

        bool isScheduled = notification != NULL;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:isScheduled];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Check if a notification with an ID was triggered.
 *
 * @param id
 *      The ID of the notification
 */
- (void) isTriggered:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSString* id = [[command arguments]
                        objectAtIndex:0];

        CDVPluginResult* result;
        UILocalNotification* notification;

        notification = [[UIApplication sharedApplication]
                        triggeredLocalNotificationWithId:id];

        bool isTriggered = notification != NULL;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:isTriggered];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List all ids from all local notifications.
 */
- (void) getAllIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        NSArray* notIds;

        notIds = [[UIApplication sharedApplication]
                  localNotificationIds];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:notIds];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List all ids from all pending notifications.
 */
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        NSArray* scheduledIds;

        scheduledIds = [[UIApplication sharedApplication]
                        scheduledLocalNotificationIds];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:scheduledIds];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List all ids from all triggered notifications.
 */
- (void) getTriggeredIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        NSArray* triggeredIds;

        triggeredIds = [[UIApplication sharedApplication]
                        triggeredLocalNotificationIds];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:triggeredIds];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Property list for given local notifications.
 *
 * @param ids
 *      The IDs of the notifications
 */
- (void) getAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;
        NSArray* notifications;
        CDVPluginResult* result;

        if (ids.count == 0) {
            notifications = [[UIApplication sharedApplication]
                             localNotificationOptions];
        } else {
            notifications = [[UIApplication sharedApplication]
                             localNotificationOptions:ids];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:notifications];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Property list for given scheduled notifications.
 *
 * @param ids
 *      The IDs of the notifications
 */
- (void) getScheduled:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;
        NSArray* notifications;
        CDVPluginResult* result;

        if (ids.count == 0) {
            notifications = [[UIApplication sharedApplication]
                             scheduledLocalNotificationOptions];
        } else {
            notifications = [[UIApplication sharedApplication]
                             scheduledLocalNotificationOptions:ids];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:notifications];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Property list for given triggered notifications.
 *
 * @param ids
 *      The IDs of the notifications
 */
- (void) getTriggered:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;
        NSArray* notifications;
        CDVPluginResult* result;

        if (ids.count == 0) {
            notifications = [[UIApplication sharedApplication]
                             triggeredLocalNotificationOptions];
        } else {
            notifications = [[UIApplication sharedApplication]
                             triggeredLocalNotificationOptions:ids];
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:notifications];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Inform if the app has the permission to show
 * badges and local notifications.
 */
- (void) hasPermission:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        BOOL hasPermission;

        hasPermission = [[UIApplication sharedApplication]
                         hasPermissionToScheduleLocalNotifications];

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:hasPermission];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Ask for permission to show badges.
 */
- (void) registerPermission:(CDVInvokedUrlCommand*)command
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000

    _command = command;

    [self.commandDelegate runInBackground:^{
        [[UIApplication sharedApplication]
         registerPermissionToScheduleLocalNotifications];
    }];
#else
    [self hasPermission:command];
#endif
}

#pragma mark -
#pragma mark Core Logic

/**
 * Schedule the local notification.
 */
- (void) scheduleLocalNotification:(UILocalNotification*)notification
{
    [self cancelForerunnerLocalNotification:notification];

    [[UIApplication sharedApplication]
     scheduleLocalNotification:notification];
}

/**
 * Update the local notification.
 */
- (void) updateLocalNotification:(UILocalNotification*)notification
                     withOptions:(NSDictionary*)newOptions
{
    NSMutableDictionary* options = [notification.userInfo mutableCopy];

    [options addEntriesFromDictionary:newOptions];
    [options setObject:[NSDate date] forKey:@"updatedAt"];

    notification = [[UILocalNotification alloc]
                    initWithOptions:options];

    [self scheduleLocalNotification:notification];

}

/**
 * Cancel the local notification.
 */
- (void) cancelLocalNotification:(UILocalNotification*)notification
{
    [[UIApplication sharedApplication]
     cancelLocalNotification:notification];

    [UIApplication sharedApplication]
    .applicationIconBadgeNumber -= 1;
}

/**
 * Cancel all currently scheduled notifications.
 */
- (void) cancelAllLocalNotifications
{
    [[UIApplication sharedApplication]
     cancelAllLocalNotifications];

    [[UIApplication sharedApplication]
     setApplicationIconBadgeNumber:0];
}

/**
 * Cancel a maybe given forerunner with the same ID.
 */
- (void) cancelForerunnerLocalNotification:(UILocalNotification*)notification
{
    NSString* id = notification.options.id;
    UILocalNotification* forerunner;

    forerunner = [[UIApplication sharedApplication]
                  scheduledLocalNotificationWithId:id];

    if (!forerunner)
        return;

    [self cancelLocalNotification:forerunner];
}

/**
 * Cancels all local notification with are older then
 * a specific amount of seconds
 */
- (void) cancelAllNotificationsWhichAreOlderThen:(float)seconds
{
    NSArray* notifications;

    notifications = [[UIApplication sharedApplication]
                     scheduledLocalNotifications];

    for (UILocalNotification* notification in notifications)
    {
        if (notification && [notification isRepeating]
            && notification.timeIntervalSinceFireDate > seconds)
        {
            [self cancelLocalNotification:notification];
            [self fireEvent:@"cancel" localNotification:notification];
        }
    }
}

#pragma mark -
#pragma mark Delegates

/**
 * Calls the cancel or trigger event after a local notification was received.
 * Cancels the local notification if autoCancel was set to true.
 */
- (void) didReceiveLocalNotification:(NSNotification*)localNotification
{
    UILocalNotification* notification = [localNotification object];

    if ([notification wasUpdated])
        return;

    BOOL autoCancel = notification.options.autoCancel;
    NSTimeInterval timeInterval = [notification timeIntervalSinceFireDate];

    NSString* event = (timeInterval <= 1 && deviceready) ? @"trigger" : @"click";

    if ([event isEqualToString:@"click"]) {
        [UIApplication sharedApplication]
        .applicationIconBadgeNumber -= 1;
    }

    [self fireEvent:event localNotification:notification];

    if (autoCancel && [event isEqualToString:@"click"]) {
        [self cancelLocalNotification:notification];
        [self fireEvent:@"cancel" localNotification:notification];
    }
}

/**
 * Called when app has started
 * (by clicking on a local notification).
 */
- (void) didFinishLaunchingWithOptions:(NSNotification*)notification
{
    NSDictionary* launchOptions = [notification userInfo];

    UILocalNotification* localNotification;

    localNotification = [launchOptions objectForKey:
                         UIApplicationLaunchOptionsLocalNotificationKey];

    if (localNotification) {
        [self didReceiveLocalNotification:
         [NSNotification notificationWithName:CDVLocalNotification
                                       object:localNotification]];
    }
}

/**
 * Called on otification settings registration is completed.
 */
- (void) didRegisterUserNotificationSettings:(UIUserNotificationSettings*)settings
{
    if (_command)
    {
        [self hasPermission:_command];
        _command = NULL;
    }
}

#pragma mark -
#pragma mark Life Cycle

/**
 * Registers obervers after plugin was initialized.
 */
- (void) pluginInitialize
{
    NSNotificationCenter* center = [NSNotificationCenter
                                    defaultCenter];

    eventQueue = [[NSMutableArray alloc] init];

    [center addObserver:self
               selector:@selector(didReceiveLocalNotification:)
                   name:CDVLocalNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(didFinishLaunchingWithOptions:)
                   name:UIApplicationDidFinishLaunchingNotification
                 object:nil];

    [center addObserver:self
               selector:@selector(didRegisterUserNotificationSettings:)
                   name:UIApplicationRegisterUserNotificationSettings
                 object:nil];
}

/**
 * Clears all single repeating notifications which are older then 5 days
 * before the app terminates.
 */
- (void) onAppTerminate
{
    [self cancelAllNotificationsWhichAreOlderThen:432000];
}

#pragma mark -
#pragma mark Helper

/**
 * Retrieves the application state
 *
 * @return
 *      Either "background" or "foreground"
 */
- (NSString*) applicationState
{
    UIApplicationState state = [[UIApplication sharedApplication]
                                applicationState];

    bool isActive = state == UIApplicationStateActive;

    return isActive ? @"foreground" : @"background";
}

/**
  * Simply invokes the callback without any parameter.
  */
- (void) execCallback:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult *result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK];

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
}

/**
 * Fire general event.
 */
- (void) fireEvent:(NSString*)event
{
    [self fireEvent:event localNotification:NULL];
}

/**
 * Fire event for local notification.
 */
- (void) fireEvent:(NSString*)event localNotification:(UILocalNotification*)notification
{
    NSString* js;
    NSString* params = [NSString stringWithFormat:
                        @"\"%@\"", self.applicationState];

    if (notification) {
        NSString* id = notification.options.id;
        NSString* json = notification.options.json;
        NSString* args = [notification encodeToJSON];

        json = [json stringByReplacingOccurrencesOfString:@"'"
                                               withString:@"\\\\\\'"];

        params = [NSString stringWithFormat:
                  @"\"%@\",\"%@\",\\'%@\\',JSON.parse(\\'%@\\')",
                  id, self.applicationState, json, args];
    }

    js = [NSString stringWithFormat:
          @"setTimeout('cordova.plugins.notification.local.on%@(%@)',0)",
          event, params];

    if (deviceready) {
        [self.commandDelegate evalJs:js];
    } else {
        [self.eventQueue addObject:js];
    }
}

@end
