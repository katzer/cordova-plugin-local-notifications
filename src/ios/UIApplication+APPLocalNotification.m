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

#import "UIApplication+APPLocalNotification.h"
#import "UILocalNotification+APPLocalNotification.h"

#import <Availability.h>

@implementation UIApplication (APPLocalNotification)

#pragma mark -
#pragma mark Permissions

/**
 * If the app has the permission to schedule local notifications.
 */
- (BOOL) hasPermissionToScheduleLocalNotifications
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000
    UIUserNotificationType types;
    UIUserNotificationSettings *settings;

    settings = [[UIApplication sharedApplication]
                currentUserNotificationSettings];

    types = UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

    return (settings.types & types);
#else
    return YES;
#endif
}

/**
 * Ask for permission to schedule local notifications.
 */
- (void) registerPermissionToScheduleLocalNotifications
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000
    UIUserNotificationType types;
    UIUserNotificationSettings *settings;

    types = UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

    settings = [UIUserNotificationSettings settingsForTypes:types
                                                 categories:nil];

    [[UIApplication sharedApplication]
     registerUserNotificationSettings:settings];
#endif
}

#pragma mark -
#pragma mark LocalNotifications

/**
 * List of all local notifications which have been added
 * but not yet removed from the notification center.
 */
- (NSArray*) localNotifications
{
    NSArray* scheduledNotifications = self.scheduledLocalNotifications;
    NSMutableArray* notifications = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in scheduledNotifications)
    {
        if (notification) {
            [notifications addObject:notification];
        }
    }

    return notifications;
}

/**
 * List of all local notifications which have been scheduled
 * and not yet removed from the notification center.
 */
- (NSArray*) scheduledLocalNotifications2
{
    NSArray* scheduledNotifications = self.scheduledLocalNotifications;
    NSMutableArray* notifications = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in scheduledNotifications)
    {
        if (notification && [notification wasScheduled]) {
            [notifications addObject:notification];
        }
    }

    return notifications;
}

/**
 * List of all triggered local notifications which have been scheduled
 * and not yet removed the notification center.
 */
- (NSArray*) triggeredLocalNotifications
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* triggeredNotifications = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        if ([notification wasTriggered]) {
            [triggeredNotifications addObject:notification];
        }
    }

    return triggeredNotifications;
}

/**
 * List of all triggered local notifications IDs which have been scheduled
 * and not yet removed from the notification center.
 */
- (NSArray*) localNotificationIds
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [ids addObject:notification.options.id];
    }

    return ids;
}

/**
 * List of all added local notifications IDs which have been scheduled
 * and not yet removed from the notification center.
 */
- (NSArray*) triggeredLocalNotificationIds
{
    NSArray* notifications = self.triggeredLocalNotifications;
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [ids addObject:notification.options.id];
    }

    return ids;
}

/**
 * List of all scheduled local notifications IDs.
 */
- (NSArray*) scheduledLocalNotificationIds
{
    NSArray* notifications = self.scheduledLocalNotifications2;
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [ids addObject:notification.options.id];
    }

    return ids;
}

/**
 * Get local notification by ID.
 *
 * @param id
 *      Notification ID
 */
- (UILocalNotification*) localNotificationWithId:(NSString*)id
{
    NSArray* notifications = self.localNotifications;

    for (UILocalNotification* notification in notifications)
    {
        if ([notification.options.id isEqualToString:id]) {
            return notification;
        }
    }

    return NULL;
}

/**
 * Get scheduled local notification by ID.
 *
 * @param id
 *      Notification ID
 */
- (UILocalNotification*) scheduledLocalNotificationWithId:(NSString*)id
{
    NSArray* notifications = self.scheduledLocalNotifications2;

    for (UILocalNotification* notification in notifications)
    {
        if ([notification.options.id isEqualToString:id]) {
            return notification;
        }
    }

    return NULL;
}

/**
 * Get triggered local notification by ID.
 *
 * @param id
 *      Notification ID
 */
- (UILocalNotification*) triggeredLocalNotificationWithId:(NSString*)id
{
    UILocalNotification* notification = [self localNotificationWithId:id];

    if (notification && [notification wasTriggered]) {
        return notification;
    }

    return NULL;
}

/**
 * List of properties from all notifications.
 */
- (NSArray*) localNotificationOptions
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [options addObject:notification.userInfo];
    }

    return options;
}

/**
 * List of properties from all scheduled notifications.
 */
- (NSArray*) scheduledLocalNotificationOptions
{
    NSArray* notifications = [self scheduledLocalNotifications2];
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [options addObject:notification.userInfo];
    }

    return options;
}

/**
 * List of properties from all triggered notifications.
 */
- (NSArray*) triggeredLocalNotificationOptions
{
    NSArray* notifications = self.triggeredLocalNotifications;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        [options addObject:notification.userInfo];
    }

    return options;
}

/**
 * List of properties from given local notifications.
 *
 * @param ids
 *      Notification IDs
 */
- (NSArray*) localNotificationOptions:(NSArray*)ids
{
    UILocalNotification* notification;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (NSString* id in ids)
    {
        notification = [self localNotificationWithId:id];

        if (notification) {
            [options addObject:notification.userInfo];
        }
    }

    return options;
}

/**
 * List of properties from given scheduled notifications.
 *
 * @param ids
 *      Notification IDs
 */
- (NSArray*) scheduledLocalNotificationOptions:(NSArray*)ids
{
    UILocalNotification* notification;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (NSString* id in ids)
    {
        notification = [self scheduledLocalNotificationWithId:id];

        if (notification) {
            [options addObject:notification.userInfo];
        }
    }

    return options;
}

/**
 * List of properties from given triggered notifications.
 *
 * @param ids
 *      Notification IDs
 */
- (NSArray*) triggeredLocalNotificationOptions:(NSArray*)ids
{
    UILocalNotification* notification;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (NSString* id in ids)
    {
        notification = [self triggeredLocalNotificationWithId:id];

        if (notification) {
            [options addObject:notification.userInfo];
        }
    }

    return options;
}

@end
