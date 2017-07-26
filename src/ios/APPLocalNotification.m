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

#import "APPLocalNotification.h"
#import "APPNotificationOptions.h"
#import "UNUserNotificationCenter+APPLocalNotification.h"
#import "UNNotificationRequest+APPLocalNotification.h"
#import "APPNotificationContent.h"

@interface APPLocalNotification ()

@property (strong, nonatomic) UIApplication* app;
@property (strong, nonatomic) UNUserNotificationCenter* center;
@property (readwrite, assign) BOOL deviceready;
@property (readonly, nonatomic, retain) NSArray* launchDetails;
@property (readonly, nonatomic, retain) NSMutableArray* eventQueue;

@end

@implementation APPLocalNotification

@synthesize deviceready, eventQueue;

#pragma mark -
#pragma mark Interface

/**
 * Set launchDetails object.
 *
 * @return [ Void ]
 */
- (void) launchDetails:(CDVInvokedUrlCommand*)command
{
    if (!_launchDetails)
        return;

    NSString* js;

    js = [NSString stringWithFormat:
          @"cordova.plugins.notification.local.launchDetails = {id:%@, action:'%@'}",
          _launchDetails[0], _launchDetails[1]];

    [self.commandDelegate evalJs:js];

    _launchDetails = NULL;
}

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
//                notification = [_center getNotificationWithId:id];
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
//                notification = [_app localNotificationWithId:id];
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

/**
 * Clear notifications by id.
 *
 * @param [ Array<Int> ] The IDs of the notifications to clear.
 *
 * @return [ Void ]
 */
- (void) clear:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        for (NSNumber* id in command.arguments) {
            UNNotificationRequest* notification;

            notification = [_center getNotificationWithId:id];

            if (!notification)
                continue;

            [_center clearNotification:notification];
            [self fireEvent:@"clear" notification:notification];
        }

        [self execCallback:command];
    }];
}

/**
 * Clear all local notifications.
 *
 * @return [ Void ]
 */
- (void) clearAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        [_center clearAllNotifications];
        [_app setApplicationIconBadgeNumber:0];
        [self fireEvent:@"clearall"];
        [self execCallback:command];
    }];
}

/**
 * Cancel notifications by id.
 *
 * @param [ Array<Int> ] The IDs of the notifications to clear.
 *
 * @return [ Void ]
 */
- (void) cancel:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        for (NSNumber* id in command.arguments) {
            UNNotificationRequest* notification;

            notification = [_center getNotificationWithId:id];

            if (!notification)
                continue;

            [_center cancelNotification:notification];
            [self fireEvent:@"cancel" notification:notification];
        }

        [self execCallback:command];
    }];
}

/**
 * Cancel all local notifications.
 *
 * @return [ Void ]
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        [_center cancelAllNotifications];
        [_app setApplicationIconBadgeNumber:0];
        [self fireEvent:@"cancelall"];
        [self execCallback:command];
    }];
}

/**
 * If a notification by ID is present.
 *
 * @param [ Number ]id The ID of the notification.
 *
 * @return [ Void ]
 */
- (void) isPresent:(CDVInvokedUrlCommand *)command
{
    [self exist:command byType:NotifcationTypeAll];
}

/**
 * If a notification by ID is scheduled.
 *
 * @param [ Number ]id The ID of the notification.
 *
 * @return [ Void ]
 */
- (void) isScheduled:(CDVInvokedUrlCommand*)command
{
    [self exist:command byType:NotifcationTypeScheduled];
}

/**
 * Check if a notification with an ID is triggered.
 *
 * @param [ Number ]id The ID of the notification.
 *
 * @return [ Void ]
 */
- (void) isTriggered:(CDVInvokedUrlCommand*)command
{
    [self exist:command byType:NotifcationTypeTriggered];
}

/**
 * Check if a notification exists by ID and type.
 *
 * @param [ APPNotificationType ] type The type of notifications to look for.
 *
 * @return [ Void ]
 */
- (void) exist:(CDVInvokedUrlCommand*)command
        byType:(APPNotificationType)type;
{
    [self.commandDelegate runInBackground:^{
        NSNumber* id = [command argumentAtIndex:0];
        BOOL exist   = [_center notificationExist:id type:type];

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                     messageAsBool:exist];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List of all notification IDs.
 *
 * @return [ Void ]
 */
- (void) ids:(CDVInvokedUrlCommand*)command
{
    [self ids:command byType:NotifcationTypeAll];
}

/**
 * List of all scheduled notification IDs.
 *
 * @return [ Void ]
 */
- (void) scheduledIds:(CDVInvokedUrlCommand*)command
{
    [self ids:command byType:NotifcationTypeScheduled];
}

/**
 * List of all triggered notification IDs.
 *
 * @return [ Void ]
 */
- (void) triggeredIds:(CDVInvokedUrlCommand*)command
{
    [self ids:command byType:NotifcationTypeTriggered];
}

/**
 * List of ids for given local notifications.
 *
 * @param [ APPNotificationType ] type The type of notifications to look for.
 *
 * @return [ Void ]
 */
- (void) ids:(CDVInvokedUrlCommand*)command
      byType:(APPNotificationType)type;
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = [_center getNotificationIdsByType:type];

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:ids];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Notification by id.
 *
 * @param [ Number ] id The id of the notification to return.
 *
 * @return [ Void ]
 */
- (void) notification:(CDVInvokedUrlCommand*)command
{
    [self notification:command byType:NotifcationTypeAll];
}

/**
 * Scheduled notification by id.
 *
 * @param [ Number ] id The id of the notification to return.
 *
 * @return [ Void ]
 */
- (void) scheduledNotification:(CDVInvokedUrlCommand*)command
{
    [self notification:command byType:NotifcationTypeScheduled];
}

/**
 * Triggered notification by id.
 *
 * @param [ Number ] id The id of the notification to return.
 *
 * @return [ Void ]
 */
- (void) triggeredNotification:(CDVInvokedUrlCommand*)command
{
    [self notification:command byType:NotifcationTypeTriggered];
}

/**
 * Notification by type and id.
 *
 * @param [ APPNotificationType ] type The type of notifications to look for.
 *
 * @return [ Void ]
 */
- (void) notification:(CDVInvokedUrlCommand*)command
               byType:(APPNotificationType)type;
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;

        NSArray* notifications;
        notifications = [_center getNotificationOptionsByType:type andId:ids];

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                               messageAsDictionary:[notifications firstObject]];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List of notifications by id.
 *
 * @param [ Array<Number> ] ids The ids of the notifications to return.
 *
 * @return [ Void ]
 */
- (void) notifications:(CDVInvokedUrlCommand*)command
{
    [self notifications:command byType:NotifcationTypeAll];
}

/**
 * List of scheduled notifications by id.
 *
 * @param [ Array<Number> ] ids The ids of the notifications to return.
 *
 * @return [ Void ]
 */
- (void) scheduledNotifications:(CDVInvokedUrlCommand*)command
{
    [self notifications:command byType:NotifcationTypeScheduled];
}

/**
 * List of triggered notifications by id.
 *
 * @param [ Array<Number> ] ids The ids of the notifications to return.
 *
 * @return [ Void ]
 */
- (void) triggeredNotifications:(CDVInvokedUrlCommand *)command
{
    [self notifications:command byType:NotifcationTypeTriggered];
}

/**
 * List of notifications by type and id.
 *
 * @param [ APPNotificationType ] type The type of notifications to look for.
 *
 * @return [ Void ]
 */
- (void) notifications:(CDVInvokedUrlCommand*)command
                byType:(APPNotificationType)type;
{
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;
        NSArray* notifications;

        if (type == NotifcationTypeAll && ids.count == 0) {
            notifications = [_center getNotificationOptions];
        }
        else if (type == NotifcationTypeAll) {
            notifications = [_center getNotificationOptionsById:ids];
        }
        else if (ids.count == 0) {
            notifications = [_center getNotificationOptionsByType:type];
        }
        else {
            notifications = [_center getNotificationOptionsByType:type
                                                            andId:ids];
        }

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:notifications];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * Check for permission to show notifications.
 *
 * @return [ Void ]
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
 *
 * @return [ Void ]
 */
- (void) request:(CDVInvokedUrlCommand*)command
{
    UNAuthorizationOptions options =
    (UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert);

    [_center requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError* e) {
        [self check:command];
    }];
}

/**
 * Register/update an action group.
 *
 * @return [ Void ]
 */
- (void) registerCategory:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        NSDictionary* options = command.arguments[0];
        APPNotificationContent* notification;

        notification = [[APPNotificationContent alloc]
                        initWithOptions:options];

        [_center addNotificationCategory:notification.category];
        [self execCallback:command];
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

    [_center addNotificationCategory:notification.category];

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
    NSMutableDictionary* data           = [[NSMutableDictionary alloc] init];
    NSString* action                    = response.actionIdentifier;
    NSString* event                     = action;

    completionHandler();

    if ([action isEqualToString:UNNotificationDefaultActionIdentifier]) {
        event = @"click";
    } else
    if ([action isEqualToString:UNNotificationDismissActionIdentifier]) {
        event = @"clear";
    }

    if (!deviceready && [event isEqualToString:@"click"]) {
        _launchDetails = @[notification.options.id, event];
    }

    if (![event isEqualToString:@"clear"]) {
        [self fireEvent:@"clear" notification:notification];
    }

    if ([response isKindOfClass:UNTextInputNotificationResponse.class]) {
        [data setObject:((UNTextInputNotificationResponse*) response).userText
                 forKey:@"text"];
    }

    [self fireEvent:event notification:notification data:data];
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
    [_center registerGeneralNotificationCategory];
}

#pragma mark -
#pragma mark Helper

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
    NSMutableDictionary* data = [[NSMutableDictionary alloc] init];

    [self fireEvent:event notification:NULL data:data];
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
      notification:(UNNotificationRequest*)notitification
{
    NSMutableDictionary* data = [[NSMutableDictionary alloc] init];

    [self fireEvent:event notification:notitification data:data];
}

/**
 * Fire event for about a local notification.
 *
 * @param [ NSString* ] event The name of the event to fire.
 * @param [ APPNotificationRequest* ] notification The local notification.
 * @param [ NSMutableDictionary* ] data Event object with additional data.
 *
 * @return [ Void ]
 */
- (void) fireEvent:(NSString*)event
      notification:(UNNotificationRequest*)request
              data:(NSMutableDictionary*)data
{
    BOOL isActive = [_app applicationState] == UIApplicationStateActive;
    NSString *js, *params, *notiAsJSON, *dataAsJSON;
    NSData* dataAsData;

    [data setObject:event       forKey:@"event"];
    [data setObject:@(isActive) forKey:@"foreground"];

    if (request) {
        notiAsJSON = [request encodeToJSON];
        [data setObject:request.options.id forKey:@"notification"];
    }

    dataAsData =
    [NSJSONSerialization dataWithJSONObject:data options:0 error:NULL];

    dataAsJSON =
    [[NSString alloc] initWithData:dataAsData encoding:NSUTF8StringEncoding];

    if (request) {
        params = [NSString stringWithFormat:@"%@,%@", notiAsJSON, dataAsJSON];
    } else {
        params = [NSString stringWithFormat:@"%@", dataAsJSON];
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
