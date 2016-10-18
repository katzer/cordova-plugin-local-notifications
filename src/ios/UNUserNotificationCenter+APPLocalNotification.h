/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
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

#import "UNMutableNotificationContent+APPLocalNotification.h"

@interface UNUserNotificationCenter (APPLocalNotification)

typedef NS_ENUM(NSUInteger, APPNotificationType) {
    NotifcationTypeAll = 0,
    NotifcationTypeScheduled = 1,
    NotifcationTypeTriggered = 2
};

#define APPNotificationType_DEFINED

@property (readonly, getter=getNotifications) NSArray* localNotifications;
@property (readonly, getter=getNotificationIds) NSArray* localNotificationIds;

// List of all notification IDs from given type
- (NSArray*) getNotificationIdsByType:(APPNotificationType)type;

// Find out if notification with ID exists
- (BOOL) notificationExist:(NSNumber*)id;
// Find out if notification with ID and type exists
- (BOOL) notificationExist:(NSNumber*)id type:(APPNotificationType)type;

// Find notification by ID
- (UNNotificationRequest*) getNotificationWithId:(NSNumber*)id;
// Find notification by ID and type
- (UNNotificationRequest*) getNotificationWithId:(NSNumber*)id andType:(APPNotificationType)type;

// Property list from all local notifications
- (NSArray*) getNotificationOptions;
// Property list from given local notifications
- (NSArray*) getNotificationOptionsById:(NSArray*)ids;
// Property list from all local notifications with type constraint
- (NSArray*) getNotificationOptionsByType:(APPNotificationType)type;
// Property list from given local notifications with type constraint
- (NSArray*) getNotificationOptionsByType:(APPNotificationType)type andId:(NSArray*)ids;

// Clear specified notfication
- (void) clearNotification:(UNNotificationRequest*)notification;
// Clear all notfications
- (void) clearAllNotifications;

// Cancel specified notfication
- (void) cancelNotification:(UNNotificationRequest*)notification;
// Cancel all notfications
- (void) cancelAllNotifications;

@end
