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

#import "UNUserNotificationCenter+APPLocalNotification.h"
#import "UNNotificationRequest+APPLocalNotification.h"

@import UserNotifications;

NSString * const kAPPGeneralCategory = @"GENERAL";

@implementation UNUserNotificationCenter (APPLocalNotification)

#pragma mark -
#pragma mark NotificationCategory

/**
 * Register general notification category to listen for dismiss actions.
 */
- (void) registerGeneralNotificationCategory
{
    UNNotificationCategory* category = [UNNotificationCategory categoryWithIdentifier:kAPPGeneralCategory
                                                                              actions:@[]
                                                                    intentIdentifiers:@[]
                                                                              options:UNNotificationCategoryOptionCustomDismissAction];

    [self setNotificationCategories:[NSSet setWithObject:category]];
}

/**
 * Add the specified category to the list of categories.
 * @param addCategory The category to add.
 */
- (void) addActionGroup:(UNNotificationCategory*)addCategory
{
    if (!addCategory) return;

    [self getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
        NSMutableSet* mutableCategories = [NSMutableSet setWithSet:categories];
        
        // Remove category first, if it already exists
        for (UNNotificationCategory* category in mutableCategories)
        {
            if ([addCategory.identifier isEqualToString:category.identifier]) {
                [mutableCategories removeObject:category];
                break;
            }
        }
        
        NSLog(@"Adding action category: %@", addCategory.identifier);
        [mutableCategories addObject:addCategory];
        [self setNotificationCategories:mutableCategories];
    }];
}

/**
 * Remove if the specified category does exist.
 * @param removeCategoryIdentifier The category id to remove.
 */
- (void) removeActionGroup:(NSString*)removeCategoryIdentifier
{
    [self getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
        NSMutableSet* mutableCategories = [NSMutableSet setWithSet:categories];
        
        for (UNNotificationCategory* category in mutableCategories)
        {
            if ([category.identifier isEqualToString:removeCategoryIdentifier]) {
                [mutableCategories removeObject:category];
                break;
            }
        }

        [self setNotificationCategories:mutableCategories];
    }];
}

/**
 * Check if the specified category does exist.
 * @param findCategoryIdentifier The category id to check for.
 * @return [ BOOL ]
 */
- (BOOL) hasActionGroup:(NSString*)findCategoryIdentifier
{
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    __block BOOL found = NO;

    [self getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
        for (UNNotificationCategory* category in categories)
        {
            if ([category.identifier isEqualToString:findCategoryIdentifier]) {
                found = YES;
                dispatch_semaphore_signal(semaphore);
                break;
            }
        }
    }];
    
    dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    
    return found;
}

#pragma mark -
#pragma mark LocalNotifications

/**
 * List of all delivered or still pending notifications.
 * @return [ NSArray<UNNotificationRequest*>* ]
 */
- (NSArray*) getNotifications
{
    NSMutableArray* notifications = [[NSMutableArray alloc] init];
    [notifications addObjectsFromArray:[self getPendingNotifications]];
    [notifications addObjectsFromArray:[self getDeliveredNotifications]];
    return notifications;
}

/**
 * List of all triggered notifications.
 * @return [ NSArray<UNNotificationRequest*>* ]
 */
- (NSArray*) getDeliveredNotifications
{
    NSMutableArray* notifications = [[NSMutableArray alloc] init];
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);

    [self getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *delivered) {
        for (UNNotification* notification in delivered)
        {
            [notifications addObject:notification.request];
        }
        dispatch_semaphore_signal(sema);
    }];

    dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);

    return notifications;
}

/**
 * List of all pending notifications.
 * @return [ NSArray<UNNotificationRequest*>* ]
 */
- (NSArray*) getPendingNotifications
{
    NSMutableArray* notificationsRequests = [[NSMutableArray alloc] init];
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    [self getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        [notificationsRequests addObjectsFromArray:requests];
        dispatch_semaphore_signal(semaphore);
    }];

    dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

    return notificationsRequests;
}

/**
 * List of all notifications from given type.
 * @param type Notification life cycle type.
 * @return [ NSArray<UNNotificationRequest>* ]
 */
- (NSArray*) getNotificationsByType:(APPNotificationType)type
{
    switch (type) {
        case NotifcationTypeScheduled:
            return [self getPendingNotifications];

        case NotifcationTypeTriggered:
            return [self getDeliveredNotifications];

        default:
            return [self getNotifications];
    }
}

/**
 * List of all local notifications IDs.
 * @return [ NSArray<int>* ]
 */
- (NSArray*) getNotificationIds
{
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UNNotificationRequest* notification in [self getNotifications])
    {
        [ids addObject:notification.options.id];
    }

    return ids;
}

/**
 * List of all notifications IDs from given type.
 * @param type Notification life cycle type.
 * @return [ NSArray<int>* ]
 */
- (NSArray*) getNotificationIdsByType:(APPNotificationType)type
{
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UNNotificationRequest* notification in [self getNotificationsByType:type])
    {
        [ids addObject:notification.options.id];
    }

    return ids;
}

/**
 * Find notification by ID.
 * @param findNotificationId Notification ID
 * @return [ UNNotificationRequest* ]
 */
- (UNNotificationRequest*) getNotificationWithId:(NSNumber*)findNotificationId
{
    for (UNNotificationRequest* notification in [self getNotifications])
    {
        NSString* notificationId = [NSString stringWithFormat:@"%@", notification.options.id];
        
        if ([notificationId isEqualToString:[findNotificationId stringValue]]) {
            return notification;
        }
    }
    
    return NULL;
}

/**
 * Find notification type by ID.
 * @param notificationId The ID of the notification.
 * @return [ APPNotificationType ]
 */
- (APPNotificationType) getTypeOfNotificationWithId:(NSNumber*)notificationId
{
    // Check if triggered
    if ([[self getNotificationIdsByType:NotifcationTypeTriggered] containsObject:notificationId]) return NotifcationTypeTriggered;

    // Check if scheduled
    if ([[self getNotificationIdsByType:NotifcationTypeScheduled] containsObject:notificationId]) return NotifcationTypeScheduled;
    
    return NotifcationTypeUnknown;
}

/**
 * List of properties from all notifications.
 * @return [ NSArray<APPNotificationOptions*>* ]
 */
- (NSArray*) getNotificationOptions
{
    return [self getNotificationOptionsByType:NotifcationTypeAll];
}

/**
 * List of properties from all notifications of given type.
 * @param type Notification life cycle type.
 * @return [ NSArray<APPNotificationOptions*>* ]
 */
- (NSArray*) getNotificationOptionsByType:(APPNotificationType)type
{
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (UNNotificationRequest* notification in [self getNotificationsByType:type])
    {
        [options addObject:notification.options.userInfo];
    }

    return options;
}

/**
 * List of properties from given local notifications.
 * @param notificationsIds The ids of the notifications to find.
 * @return [ NSArray<APPNotificationOptions*>* ]
 */
- (NSArray*) getNotificationOptionsById:(NSArray*)notificationsIds
{
    NSMutableArray* options = [[NSMutableArray alloc] init];
    
    for (UNNotificationRequest* notification in [self getNotifications])
    {
        if ([notificationsIds containsObject:notification.options.id]) {
            [options addObject:notification.options.userInfo];
        }
    }
    
    return options;
}

/**
 * Clear all notfications.
 */
- (void) clearNotifications
{
    [self removeAllDeliveredNotifications];
}

/**
 * Clear Specified notfication.
 */
- (void) clearNotification:(UNNotificationRequest*)notificationRequest
{
    [self removeDeliveredNotificationsWithIdentifiers:@[notificationRequest.identifier]];
}

/**
 * Cancel all notfications.
 */
- (void) cancelNotifications
{
    [self removeAllPendingNotificationRequests];
    [self removeAllDeliveredNotifications];
}

/**
 * Cancel specified notfication.
 * @param notificationRequest The notification object.
 */
- (void) cancelNotification:(UNNotificationRequest*)notificationRequest
{
    NSArray* ids = @[notificationRequest.identifier];
    [self removeDeliveredNotificationsWithIdentifiers:ids];
    [self removePendingNotificationRequestsWithIdentifiers:ids];
}

@end
