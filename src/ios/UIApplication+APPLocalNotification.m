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
 * List of all triggered local notifications which have been scheduled
 * and not yet removed the notification center.
 */
- (NSArray*) triggeredLocalNotifications
{
    NSArray* scheduledNotifications = self.scheduledLocalNotifications;
    NSMutableArray* triggeredNotifications = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in scheduledNotifications)
    {
        if (notification && [notification wasTriggered])
        {
            [triggeredNotifications addObject:notification];
        }
    }

    return triggeredNotifications;
}

/**
 * List of all triggered local notifications IDs which have been scheduled
 * and not yet removed the notification center.
 */
- (NSArray*) triggeredLocalNotificationIds
{
    NSArray* triggeredNotifications = self.triggeredLocalNotifications;
    NSMutableArray* triggeredNotificationIds = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in triggeredNotifications)
    {
        [triggeredNotificationIds addObject:notification.options.id];
    }

    return triggeredNotificationIds;
}

/**
 * List of all scheduled local notifications IDs.
 */
- (NSArray*) scheduledLocalNotificationIds
{
    NSArray* scheduledNotifications = self.scheduledLocalNotifications;
    NSMutableArray* scheduledNotificationIds = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in scheduledNotifications)
    {
        if (notification)
        {
            [scheduledNotificationIds addObject:notification.options.id];
        }
    }

    return scheduledNotificationIds;
}

/**
 * Get the scheduled local notification by ID.
 */
- (UILocalNotification*) scheduledLocalNotificationWithId:(NSString*)id
{
    NSArray* notifications = self.scheduledLocalNotifications;

    for (UILocalNotification* notification in notifications)
    {
        if (notification && [notification.options.id isEqualToString:id])
        {
            return notification;
        }
    }

    return NULL;
}

/**
 * Get the triggered local notification by ID.
 */
- (UILocalNotification*) triggeredLocalNotificationWithId:(NSString*)id
{
    UILocalNotification* notification = [self scheduledLocalNotificationWithId:id];

    if (notification && [notification wasTriggered]) {
        return notification;
    }

    return NULL;
}

@end
