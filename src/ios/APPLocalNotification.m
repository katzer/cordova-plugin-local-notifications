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

// codebeat:disable[TOO_MANY_FUNCTIONS]

#import "APPLocalNotification.h"
#import "APPNotificationContent.h"
#import "APPNotificationOptions.h"
#import "APPNotificationCategory.h"
#import "UNUserNotificationCenter+APPLocalNotification.h"
#import "UNNotificationRequest+APPLocalNotification.h"

@interface APPLocalNotification ()

@property (strong, nonatomic) UNUserNotificationCenter* center;
@property (NS_NONATOMIC_IOSONLY, nullable, weak) id <UNUserNotificationCenterDelegate> delegate;
@property (readwrite, assign) BOOL deviceready;
@property (readwrite, assign) BOOL isActive;
@property (readonly, nonatomic, retain) NSArray* launchDetails;
@property (readonly, nonatomic, retain) NSMutableArray* eventQueue;

@end

@implementation APPLocalNotification

UNNotificationPresentationOptions const OptionNone  = UNNotificationPresentationOptionNone;
UNNotificationPresentationOptions const OptionBadge = UNNotificationPresentationOptionBadge;
UNNotificationPresentationOptions const OptionSound = UNNotificationPresentationOptionSound;
UNNotificationPresentationOptions const OptionAlert = UNNotificationPresentationOptionAlert;

@synthesize deviceready, isActive, eventQueue;

#pragma mark -
#pragma mark Interface

/**
 * Set launchDetails object.
 *
 * @return [ Void ]
 */
- (void) launch:(CDVInvokedUrlCommand*)command
{
    NSString* js;

    if (!_launchDetails)
        return;

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
- (void) ready:(CDVInvokedUrlCommand*)command
{
    deviceready = YES;

    [self.commandDelegate runInBackground:^{
        for (NSString* js in eventQueue) {
            [self.commandDelegate evalJs:js];
        }
        [eventQueue removeAllObjects];
    }];
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

        [self check:command];
    }];
}

/**
 * Update notifications.
 *
 * @param [Array<Hash>] properties A list of key-value properties.
 *
 * @return [ Void ]
 */
- (void) update:(CDVInvokedUrlCommand*)command
{
    NSArray* notifications = command.arguments;

    [self.commandDelegate runInBackground:^{
        for (NSDictionary* options in notifications) {
            NSNumber* id = [options objectForKey:@"id"];
            UNNotificationRequest* notification;

            notification = [_center getNotificationWithId:id];

            if (!notification)
                continue;

            [self updateNotification:[notification copy]
                         withOptions:options];

            [self fireEvent:@"update" notification:notification];
        }

        [self check:command];
    }];
}

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
        [_center clearNotifications];
        [self clearApplicationIconBadgeNumber];
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
        [_center cancelNotifications];
        [self clearApplicationIconBadgeNumber];
        [self fireEvent:@"cancelall"];
        [self execCallback:command];
    }];
}

/**
 * Get type of notification.
 *
 * @param [ Int ] id The ID of the notification.
 *
 * @return [ Void ]
 */
- (void) type:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSNumber* id = [command argumentAtIndex:0];
        NSString* type;

        switch ([_center getTypeOfNotificationWithId:id]) {
            case NotifcationTypeScheduled:
                type = @"scheduled";
                break;
            case NotifcationTypeTriggered:
                type = @"triggered";
                break;
            default:
                type = @"unknown";
        }

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                   messageAsString:type];

        [self.commandDelegate sendPluginResult:result
                                    callbackId:command.callbackId];
    }];
}

/**
 * List of notification IDs by type.
 *
 * @return [ Void ]
 */
- (void) ids:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        int code                 = [command.arguments[0] intValue];
        APPNotificationType type = NotifcationTypeUnknown;

        switch (code) {
            case 0:
                type = NotifcationTypeAll;
                break;
            case 1:
                type = NotifcationTypeScheduled;
                break;
            case 2:
                type = NotifcationTypeTriggered;
                break;
        }

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
    [self.commandDelegate runInBackground:^{
        NSArray* ids = command.arguments;

        NSArray* notifications;
        notifications = [_center getNotificationOptionsById:ids];

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
    [self.commandDelegate runInBackground:^{
        int code                 = [command.arguments[0] intValue];
        APPNotificationType type = NotifcationTypeUnknown;
        NSArray* toasts;
        NSArray* ids;

        switch (code) {
            case 0:
                type = NotifcationTypeAll;
                break;
            case 1:
                type = NotifcationTypeScheduled;
                break;
            case 2:
                type = NotifcationTypeTriggered;
                break;
            case 3:
                ids    = command.arguments[1];
                toasts = [_center getNotificationOptionsById:ids];
                break;
        }

        if (toasts == nil) {
            toasts = [_center getNotificationOptionsByType:type];
        }

        CDVPluginResult* result;
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:toasts];

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
        BOOL enabled    = settings.notificationCenterSetting == UNNotificationSettingEnabled;
        BOOL permitted  = authorized && enabled;

        [self execCallback:command arg:permitted];
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
- (void) actions:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        int code             = [command.arguments[0] intValue];
        NSString* identifier = [command argumentAtIndex:1];
        NSArray* actions     = [command argumentAtIndex:2];
        UNNotificationCategory* group;
        BOOL found;

        switch (code) {
            case 0:
                group = [APPNotificationCategory parse:actions withId:identifier];
                [_center addActionGroup:group];
                [self execCallback:command];
                break;
            case 1:
                [_center removeActionGroup:identifier];
                [self execCallback:command];
                break;
            case 2:
                found = [_center hasActionGroup:identifier];
                [self execCallback:command arg:found];
                break;
        }
    }];
}

#pragma mark -
#pragma mark Private

/**
 * Schedule the local notification.
 *
 * @param [ APPNotificationContent* ] notification The notification to schedule.
 *
 * @return [ Void ]
 */
- (void) scheduleNotification:(APPNotificationContent*)notification
{
    __weak APPLocalNotification* weakSelf = self;
    UNNotificationRequest* request        = notification.request;
    NSString* event                       = [request wasUpdated] ? @"update" : @"add";

    [_center addNotificationRequest:request withCompletionHandler:^(NSError* e) {
        __strong APPLocalNotification* strongSelf = weakSelf;
        [strongSelf fireEvent:event notification:request];
    }];
}

/**
 * Update the local notification.
 *
 * @param [ UNNotificationRequest* ] notification The notification to update.
 * @param [ NSDictionary* ] options The options to update.
 *
 * @return [ Void ]
 */
- (void) updateNotification:(UNNotificationRequest*)notification
                withOptions:(NSDictionary*)newOptions
{
    NSMutableDictionary* options = [notification.content.userInfo mutableCopy];

    [options addEntriesFromDictionary:newOptions];
    [options setObject:[NSDate date] forKey:@"updatedAt"];

    APPNotificationContent*
    newNotification = [[APPNotificationContent alloc] initWithOptions:options];

    [self scheduleNotification:newNotification];
}

#pragma mark -
#pragma mark UNUserNotificationCenterDelegate

/**
 * Called when a notification is delivered to the app while being in foreground.
 */
- (void) userNotificationCenter:(UNUserNotificationCenter *)center
        willPresentNotification:(UNNotification *)notification
          withCompletionHandler:(void (^)(UNNotificationPresentationOptions))handler
{
    UNNotificationRequest* toast = notification.request;

    [_delegate userNotificationCenter:center
              willPresentNotification:notification
                withCompletionHandler:handler];

    if ([toast.trigger isKindOfClass:UNPushNotificationTrigger.class])
        return;

    APPNotificationOptions* options = toast.options;

    if (![notification.request wasUpdated]) {
        [self fireEvent:@"trigger" notification:toast];
    }

    if (options.silent) {
        handler(OptionNone);
    } else if (!isActive || options.priority > 0) {
        handler(OptionBadge|OptionSound|OptionAlert);
    } else {
        handler(OptionBadge|OptionSound);
    }
}

/**
 * Called to let your app know which action was selected by the user for a given
 * notification.
 */
- (void) userNotificationCenter:(UNUserNotificationCenter *)center
 didReceiveNotificationResponse:(UNNotificationResponse *)response
          withCompletionHandler:(void (^)(void))handler
{
    UNNotificationRequest* toast = response.notification.request;

    [_delegate userNotificationCenter:center
       didReceiveNotificationResponse:response
                withCompletionHandler:handler];

    handler();

    if ([toast.trigger isKindOfClass:UNPushNotificationTrigger.class])
        return;

    NSMutableDictionary* data = [[NSMutableDictionary alloc] init];
    NSString* action          = response.actionIdentifier;
    NSString* event           = action;

    if ([action isEqualToString:UNNotificationDefaultActionIdentifier]) {
        event = @"click";
    } else
    if ([action isEqualToString:UNNotificationDismissActionIdentifier]) {
        event = @"clear";
    }

    if (!deviceready && [event isEqualToString:@"click"]) {
        _launchDetails = @[toast.options.id, event];
    }

    if (![event isEqualToString:@"clear"]) {
        [self fireEvent:@"clear" notification:toast];
    }

    if ([response isKindOfClass:UNTextInputNotificationResponse.class]) {
        [data setObject:((UNTextInputNotificationResponse*) response).userText
                 forKey:@"text"];
    }

    [self fireEvent:event notification:toast data:data];
}

#pragma mark -
#pragma mark Life Cycle

/**
 * Registers obervers after plugin was initialized.
 */
- (void) pluginInitialize
{
    eventQueue = [[NSMutableArray alloc] init];
    _center    = [UNUserNotificationCenter currentNotificationCenter];
    _delegate  = _center.delegate;

    _center.delegate = self;
    [_center registerGeneralNotificationCategory];

    [self monitorAppStateChanges];
}

/**
 * Monitor changes of the app state and update the _isActive flag.
 */
- (void) monitorAppStateChanges
{
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];

    [center addObserverForName:UIApplicationDidBecomeActiveNotification
                        object:NULL queue:[NSOperationQueue mainQueue]
                    usingBlock:^(NSNotification *e) { isActive = YES; }];

    [center addObserverForName:UIApplicationDidEnterBackgroundNotification
                        object:NULL queue:[NSOperationQueue mainQueue]
                    usingBlock:^(NSNotification *e) { isActive = NO; }];
}

#pragma mark -
#pragma mark Helper

/**
 * Removes the badge number from the app icon.
 */
- (void) clearApplicationIconBadgeNumber
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
    });
}

/**
 * Invokes the callback without any parameter.
 *
 * @return [ Void ]
 */
- (void) execCallback:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult *result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK];

    [self.commandDelegate sendPluginResult:result
                                callbackId:command.callbackId];
}

/**
 * Invokes the callback with a single boolean parameter.
 *
 * @return [ Void ]
 */
- (void) execCallback:(CDVInvokedUrlCommand*)command arg:(BOOL)arg
{
    CDVPluginResult *result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK
                               messageAsBool:arg];

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
    NSString *js, *params, *notiAsJSON, *dataAsJSON;
    NSData* dataAsData;

    [data setObject:event           forKey:@"event"];
    [data setObject:@(isActive)     forKey:@"foreground"];
    [data setObject:@(!deviceready) forKey:@"queued"];

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
          @"cordova.plugins.notification.local.fireEvent('%@', %@)",
          event, params];

    if (deviceready) {
        [self.commandDelegate evalJs:js];
    } else {
        [self.eventQueue addObject:js];
    }
}

@end

// codebeat:enable[TOO_MANY_FUNCTIONS]
