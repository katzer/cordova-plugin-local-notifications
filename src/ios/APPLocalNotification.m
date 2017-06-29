/*
 * Copyright (c) 2013 by appPlant GmbH. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
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
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

#import "APPLocalNotification.h"
#import "APPNotificationOptions.h"
#import "UNUserNotificationCenter+APPLocalNotification.h"
#import "UNNotificationRequest+APPLocalNotification.h"
#import "APPNotificationContent.h"

@interface APPLocalNotification ()

@property (strong, nonatomic) UIApplication* app;
@property (strong, nonatomic) UNUserNotificationCenter* center;
@property (readwrite, assign) BOOL deviceready;
@property (readonly, nonatomic, retain) NSMutableArray* eventQueue;

@end

@implementation APPLocalNotification

@synthesize deviceready, eventQueue;

#pragma mark -
#pragma mark Interface

/**
 * Execute all queued events.
 *
 * @return [ Void ]
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
 * Schedule notifications.
 *
 * @param [Array<Hash>] properties A list of key-value properties.
 *
 * @return [ Void ]
 */
- (void) schedule:(CDVInvokedUrlCommand*)command
{
    NSArray* notifications = command.arguments;

    [self.commandDelegate runInBackground:^{
        for (NSDictionary* options in notifications) {
            APPNotificationContent* notification;

            notification = [[APPNotificationContent alloc]
                            initWithOptions:options];

            [self scheduleNotification:notification];
        }

        [self execCallback:command];
     }];
}

///**
// * Update a set of notifications.
// *
// * @param properties
// *      A dict of properties for each notification
// */
//- (void) update:(CDVInvokedUrlCommand*)command
//{
//    NSArray* notifications = command.arguments;
//
//    [self.commandDelegate runInBackground:^{
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            for (NSDictionary* options in notifications) {
//                NSNumber* id = [options objectForKey:@"id"];
//                UNNotificationRequest* notification;
//
//                notification = [self.center getNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                //            [self updateNotification:[notification copy]
//                //                         withOptions:options];
//                //
//                //            [self fireEvent:@"update" notification:notification];
//                //
//                //            if (notifications.count > 1) {
//                //                [NSThread sleepForTimeInterval:0.01];
//                //            }
//            }
//        } else {
//            for (NSDictionary* options in notifications) {
//                NSNumber* id = [options objectForKey:@"id"];
//                UILocalNotification* notification;
//
//                notification = [self.app localNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                [self updateLocalNotification:[notification copy]
//                                  withOptions:options];
//
//                [self fireEvent:@"update" localnotification:notification];
//
//                if (notifications.count > 1) {
//                    [NSThread sleepForTimeInterval:0.01];
//                }
//            }
//        }
//
//        [self execCallback:command];
//    }];
//}
//
///**
// * Cancel a set of notifications.
// *
// * @param ids
// *      The IDs of the notifications
// */
//- (void) cancel:(CDVInvokedUrlCommand*)command
//{
//    [self.commandDelegate runInBackground:^{
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            for (NSNumber* id in command.arguments) {
//                UNNotificationRequest* notification;
//
//                notification = [self.center getNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                [self.center cancelNotification:notification];
//                [self fireEvent:@"cancel" notification:notification];
//            }
//        } else {
//            for (NSNumber* id in command.arguments) {
//                UILocalNotification* notification;
//
//                notification = [self.app localNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                [self.app cancelLocalNotification:notification];
//                [self fireEvent:@"cancel" localnotification:notification];
//            }
//        }
//
//        [self execCallback:command];
//    }];
//}
//
///**
// * Cancel all local notifications.
// */
//- (void) cancelAll:(CDVInvokedUrlCommand*)command
//{
//    [self.commandDelegate runInBackground:^{
//        [self cancelAllNotifications];
//        [self fireEvent:@"cancelall"];
//        [self execCallback:command];
//    }];
//}
//
///**
// * Clear a set of notifications.
// *
// * @param ids
// *      The IDs of the notifications
// */
//- (void) clear:(CDVInvokedUrlCommand*)command
//{
//    [self.commandDelegate runInBackground:^{
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            for (NSNumber* id in command.arguments) {
//                UNNotificationRequest* notification;
//
//                notification = [self.center getNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                [self.center clearNotification:notification];
//                [self fireEvent:@"clear" notification:notification];
//            }
//        } else {
//            for (NSNumber* id in command.arguments) {
//                UILocalNotification* notification;
//
//                notification = [self.app localNotificationWithId:id];
//
//                if (!notification)
//                    continue;
//
//                [self.app clearLocalNotification:notification];
//                [self fireEvent:@"clear" localnotification:notification];
//            }
//        }
//
//        [self execCallback:command];
//    }];
//}
//
///**
// * Clear all local notifications.
// */
//- (void) clearAll:(CDVInvokedUrlCommand*)command
//{
//    [self.commandDelegate runInBackground:^{
//        [self clearAllNotifications];
//        [self fireEvent:@"clearall"];
//        [self execCallback:command];
//    }];
//}
//
///**
// * If a notification by ID is present.
// *
// * @param id
// *      The ID of the notification
// */
//- (void) isPresent:(CDVInvokedUrlCommand *)command
//{
//    [self isPresent:command type:NotifcationTypeAll];
//}
//
///**
// * If a notification by ID is scheduled.
// *
// * @param id
// *      The ID of the notification
// */
//- (void) isScheduled:(CDVInvokedUrlCommand*)command
//{
//    [self isPresent:command type:NotifcationTypeScheduled];
//}
//
///**
// * Check if a notification with an ID is triggered.
// *
// * @param id
// *      The ID of the notification
// */
//- (void) isTriggered:(CDVInvokedUrlCommand*)command
//{
//    [self isPresent:command type:NotifcationTypeTriggered];
//}
//
///**
// * Check if a notification with an ID exists.
// *
// * @param type
// *      The notification life cycle type
// */
//- (void) isPresent:(CDVInvokedUrlCommand*)command
//              type:(APPNotificationType)type;
//{
//    [self.commandDelegate runInBackground:^{
//        NSNumber* id = [command argumentAtIndex:0];
//        BOOL exist;
//
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            exist = [self.center notificationExist:id type:type];
//        } else {
//            if (type == NotifcationTypeAll) {
//                exist = [self.app localNotificationExist:id];
//            } else {
//                exist = [self.app localNotificationExist:id type:type];
//            }
//        }
//
//        CDVPluginResult* result;
//        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
//                                     messageAsBool:exist];
//
//        [self.commandDelegate sendPluginResult:result
//                                    callbackId:command.callbackId];
//    }];
//}
//
///**
// * List all ids from all local notifications.
// */
//- (void) getAllIds:(CDVInvokedUrlCommand*)command
//{
//    [self getIds:command byType:NotifcationTypeAll];
//}
//
///**
// * List all ids from all pending notifications.
// */
//- (void) getScheduledIds:(CDVInvokedUrlCommand*)command
//{
//    [self getIds:command byType:NotifcationTypeScheduled];
//}
//
///**
// * List all ids from all triggered notifications.
// */
//- (void) getTriggeredIds:(CDVInvokedUrlCommand*)command
//{
//    [self getIds:command byType:NotifcationTypeTriggered];
//}
//
///**
// * List of ids for given local notifications.
// *
// * @param type
// *      Notification life cycle type
// * @param ids
// *      The IDs of the notifications
// */
//- (void) getIds:(CDVInvokedUrlCommand*)command
//         byType:(APPNotificationType)type;
//{
//    [self.commandDelegate runInBackground:^{
//        NSArray* ids;
//
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            ids = [self.center getNotificationIdsByType:type];
//        } else {
//            if (type == NotifcationTypeAll) {
//                ids = [self.app localNotificationIds];
//            } else {
//                ids = [self.app localNotificationIdsByType:type];
//            }
//        }
//
//        CDVPluginResult* result;
//        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
//                                    messageAsArray:ids];
//
//        [self.commandDelegate sendPluginResult:result
//                                    callbackId:command.callbackId];
//    }];
//}
//
///**
// * Propertys for given local notification.
// */
//- (void) getSingle:(CDVInvokedUrlCommand*)command
//{
//    [self getOption:command byType:NotifcationTypeAll];
//}
//
///**
// * Propertya for given scheduled notification.
// */
//- (void) getSingleScheduled:(CDVInvokedUrlCommand*)command
//{
//    [self getOption:command byType:NotifcationTypeScheduled];
//}
//
//// Propertys for given triggered notification
//- (void) getSingleTriggered:(CDVInvokedUrlCommand*)command
//{
//    [self getOption:command byType:NotifcationTypeTriggered];
//}
//
///**
// * Property list for given local notifications.
// *
// * @param ids
// *      The IDs of the notifications
// */
//- (void) getAll:(CDVInvokedUrlCommand*)command
//{
//    [self getOptions:command byType:NotifcationTypeAll];
//}
//
///**
// * Property list for given scheduled notifications.
// *
// * @param ids
// *      The IDs of the notifications
// */
//- (void) getScheduled:(CDVInvokedUrlCommand*)command
//{
//    [self getOptions:command byType:NotifcationTypeScheduled];
//}
//
///**
// * Property list for given triggered notifications.
// *
// * @param ids
// *      The IDs of the notifications
// */
//- (void) getTriggered:(CDVInvokedUrlCommand *)command
//{
//    [self getOptions:command byType:NotifcationTypeTriggered];
//}
//
///**
// * Propertys for given triggered notification.
// *
// * @param type
// *      Notification life cycle type
// * @param ids
// *      The ID of the notification
// */
//- (void) getOption:(CDVInvokedUrlCommand*)command
//            byType:(APPNotificationType)type;
//{
//    [self.commandDelegate runInBackground:^{
//        NSArray* ids = command.arguments;
//        NSArray* notifications;
//
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            notifications = [self.center getNotificationOptionsByType:type
//                                                                andId:ids];
//        } else {
//            if (type == NotifcationTypeAll) {
//                notifications = [self.app localNotificationOptionsById:ids];
//            }
//            else {
//                notifications = [self.app localNotificationOptionsByType:type
//                                                                   andId:ids];
//            }
//        }
//
//        CDVPluginResult* result;
//        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
//                               messageAsDictionary:[notifications firstObject]];
//
//        [self.commandDelegate sendPluginResult:result
//                                    callbackId:command.callbackId];
//    }];
//}
//
///**
// * Property list for given triggered notifications.
// *
// * @param type
// *      Notification life cycle type
// * @param ids
// *      The IDs of the notifications
// */
//- (void) getOptions:(CDVInvokedUrlCommand*)command
//             byType:(APPNotificationType)type;
//{
//    [self.commandDelegate runInBackground:^{
//        NSArray* ids = command.arguments;
//        NSArray* notifications;
//
//        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//            if (type == NotifcationTypeAll && ids.count == 0) {
//                notifications = [self.center getNotificationOptions];
//            }
//            else if (type == NotifcationTypeAll) {
//                notifications = [self.center getNotificationOptionsById:ids];
//            }
//            else if (ids.count == 0) {
//                notifications = [self.center getNotificationOptionsByType:type];
//            }
//            else {
//                notifications = [self.center getNotificationOptionsByType:type
//                                                                    andId:ids];
//            }
//        } else {
//            if (type == NotifcationTypeAll && ids.count == 0) {
//                notifications = [self.app localNotificationOptions];
//            }
//            else if (type == NotifcationTypeAll) {
//                notifications = [self.app localNotificationOptionsById:ids];
//            }
//            else if (ids.count == 0) {
//                notifications = [self.app localNotificationOptionsByType:type];
//            }
//            else {
//                notifications = [self.app localNotificationOptionsByType:type
//                                                                   andId:ids];
//            }
//        }
//
//        CDVPluginResult* result;
//        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
//                                    messageAsArray:notifications];
//
//        [self.commandDelegate sendPluginResult:result
//                                    callbackId:command.callbackId];
//    }];
//}

/**
 * Check for permission to show notifications.
 */
- (void) check:(CDVInvokedUrlCommand*)command
{
    [_center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings* settings) {
        BOOL authorized = settings.authorizationStatus == UNAuthorizationStatusAuthorized;
        BOOL enabled = settings.notificationCenterSetting == UNNotificationSettingEnabled;
        BOOL permitted = authorized && enabled;

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:permitted];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Request for permission to show notifcations.
 */
- (void) request:(CDVInvokedUrlCommand*)command
{
    UNAuthorizationOptions options =
    (UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert);

    [self.center requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError* e) {
        [self check:command];
    }];
}

#pragma mark -
#pragma mark Private

/**
 * Schedule the local notification.
 */
- (void) scheduleNotification:(APPNotificationContent*)notification
{
    __weak APPLocalNotification* weakSelf  = self;
    UNNotificationRequest* request = notification.request;

    [_center addNotificationRequest:request withCompletionHandler:^(NSError* e) {
        __strong APPLocalNotification* strongSelf = weakSelf;
        [strongSelf fireEvent:@"add" notification:request];
    }];
}

///**
// * Update the local notification.
// */
//- (void) updateNotification:(UILocalNotification*)notification
//                withOptions:(NSDictionary*)newOptions
//{APPNotificationRequest*
//    NSMutableDictionary* options = [notification.userInfo mutableCopy];
//
//    [options addEntriesFromDictionary:newOptions];
//    [options setObject:[NSDate date] forKey:@"updatedAt"];
//
////    notification = [[UILocalNotification alloc]
////                    initWithOptions:options];
////
////    [self scheduleLocalNotification:notification];
//}
//
///**
// * Cancel all local notifications.
// */
//- (void) cancelAllNotifications
//{
//    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//        [self.center cancelAllNotifications];
//    } else {
//        [self.app cancelAllLocalNotifications];
//    }
//
//    [self.app setApplicationIconBadgeNumber:0];
//}
//
///**
// * Clear all local notifications.
// */
//- (void) clearAllNotifications
//{
//    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"10.0")) {
//        [self.center clearAllNotifications];
//    } else {
//        [self.app clearAllLocalNotifications];
//    }
//
//    [self.app setApplicationIconBadgeNumber:0];
//}

#pragma mark -
#pragma mark UNUserNotificationCenterDelegate

/**
 * Called when a notification is delivered to the app while being in foreground.
 */
- (void) userNotificationCenter:(UNUserNotificationCenter *)center
        willPresentNotification:(UNNotification *)notification
          withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
    [self fireEvent:@"trigger" notification:notification.request];
    completionHandler(UNNotificationPresentationOptionBadge|UNNotificationPresentationOptionSound|UNNotificationPresentationOptionAlert);
}

/**
 * Called to let your app know which action was selected by the user for a given
 * notification.
 */
- (void) userNotificationCenter:(UNUserNotificationCenter *)center
 didReceiveNotificationResponse:(UNNotificationResponse *)response
          withCompletionHandler:(void (^)())completionHandler
{
    UNNotificationRequest* notification = response.notification.request;
    NSString* action = response.actionIdentifier;
    NSString* event  = action;

    if ([action isEqualToString:UNNotificationDefaultActionIdentifier]) {
        event = @"click";
    }
    
    if ([action isEqualToString:UNNotificationDismissActionIdentifier]) {
        event = @"clear";
    }

    [self fireEvent:event notification:notification];

    completionHandler();
}

#pragma mark -
#pragma mark Life Cycle

/**
 * Registers obervers after plugin was initialized.
 */
- (void) pluginInitialize
{
    eventQueue = [[NSMutableArray alloc] init];
    _app       = [UIApplication sharedApplication];
    _center    = [UNUserNotificationCenter currentNotificationCenter];

    _center.delegate = self;
    
    UNNotificationCategory* generalCategory = [UNNotificationCategory
                                               categoryWithIdentifier:@"GENERAL"
                                               actions:@[]
                                               intentIdentifiers:@[]
                                               options:UNNotificationCategoryOptionCustomDismissAction];
    
    // Register the notification categories.
    [_center setNotificationCategories:[NSSet setWithObjects:generalCategory, nil]];
}

#pragma mark -
#pragma mark Helper

/**
 * Retrieve the state of the application.
 *
 * @return "background" or "foreground"
 */
- (NSString*) applicationState
{
    UIApplicationState state = [_app applicationState];

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
 *
 * @param [ NSString* ] event The name of the event to fire.
 *
 * @return [ Void ]
 */
- (void) fireEvent:(NSString*)event
{
    [self fireEvent:event notification:NULL];
}

/**
 * Fire event for about a local notification.
 *
 * @param [ NSString* ] event The name of the event to fire.
 * @param [ APPNotificationRequest* ] notification The local notification.
 *
 * @return [ Void ]
 */
- (void) fireEvent:(NSString*)event
      notification:(UNNotificationRequest*)request
{
    NSString* js;
    NSString* appState = [self applicationState];
    NSString* params   = [NSString stringWithFormat:@"\"%@\"", appState];

    if (request) {
        NSString* args = [request encodeToJSON];
        params = [NSString stringWithFormat:@"%@,'%@'", args, appState];
    }

    js = [NSString stringWithFormat:
          @"cordova.plugins.notification.local.core.fireEvent('%@', %@)",
          event, params];

    if (deviceready) {
        [self.commandDelegate evalJs:js];
    } else {
        [self.eventQueue addObject:js];
    }
}

@end
