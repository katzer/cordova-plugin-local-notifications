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

#import "UIApplication+APPLocalNotification.h"
#import "UILocalNotification+APPLocalNotification.h"

@implementation UIApplication (APPLocalNotification)

NSMutableDictionary *allNotificationActions;
NSMutableDictionary *allNotificationCategories;

#pragma mark -
#pragma mark Permissions

/**
 * If the app has the permission to schedule local notifications.
 */
- (BOOL) hasPermissionToScheduleLocalNotifications
{
    if ([[UIApplication sharedApplication]
         respondsToSelector:@selector(registerUserNotificationSettings:)])
    {
        UIUserNotificationType types;
        UIUserNotificationSettings *settings;

        settings = [[UIApplication sharedApplication]
                    currentUserNotificationSettings];

        types = UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

        return (settings.types & types);
    } else {
        return YES;
    }
}

/**
 * Ask for permission to schedule local notifications.
 */
- (void) registerPermissionToScheduleLocalNotifications:(NSArray*)interactions
{
    if ([[UIApplication sharedApplication]
         respondsToSelector:@selector(registerUserNotificationSettings:)])
    {
        UIUserNotificationType types;
        UIUserNotificationSettings *settings;

        settings = [[UIApplication sharedApplication]
                    currentUserNotificationSettings];

        types = settings.types|UIUserNotificationTypeAlert|UIUserNotificationTypeBadge|UIUserNotificationTypeSound;

        NSSet* categories = [self parseNotificationInteractions:interactions];

        settings = [UIUserNotificationSettings settingsForTypes:types
                                                     categories:categories];

        [[UIApplication sharedApplication]
         registerUserNotificationSettings:settings];
    }
}

/**
 * Persist all actions and categories for notifications, adding new ones if necessary.
 */
- (NSSet*) parseNotificationInteractions:(NSArray*)interactions
{
    [self initAllActionsAndCategories];
    
    if (interactions && [interactions count])
    {
        for (NSString* interaction in interactions)
        {
            NSData* interactionsData = 
                [interaction dataUsingEncoding:NSUTF8StringEncoding];

            NSDictionary* interactionsDict = 
                                [NSJSONSerialization 
                                    JSONObjectWithData:interactionsData 
                                    options:NSJSONReadingMutableContainers 
                                    error:nil];
            
            NSArray* actions = [interactionsDict objectForKey:@"actions"];
            NSString* category = [interactionsDict objectForKey:@"category"];
            
            [self setActions:actions forCategory:category];
        }
    }

    NSSet* categories = 
        [NSSet setWithArray:[allNotificationCategories allValues]];
    return categories;
}

- (void) initAllActionsAndCategories
{
    if (!allNotificationActions) {
        allNotificationActions = [[NSMutableDictionary alloc] init];
    }
    
    if (!allNotificationCategories) {
        allNotificationCategories = [[NSMutableDictionary alloc] init];
    }
}

- (void) setActions:(NSArray*)actions forCategory:(NSString*)category
{
    if ([actions count] && category.length) {
        if (![allNotificationCategories objectForKey:category])
        {
            UIMutableUserNotificationCategory* newCategory;
            newCategory = [[UIMutableUserNotificationCategory alloc] init];
            [newCategory setIdentifier:category];
            
            NSArray* actionsArray = [self parseActions:actions];
            
            if ([actionsArray count] > 2) {
                [newCategory setActions:@[
                    [actionsArray objectAtIndex:1], 
                    [actionsArray objectAtIndex:0]] 
                forContext:UIUserNotificationActionContextMinimal];
            } else {
                [newCategory setActions:[
                    [actionsArray reverseObjectEnumerator] allObjects] 
                forContext:UIUserNotificationActionContextMinimal];
            }

            [newCategory setActions:actionsArray 
                forContext:UIUserNotificationActionContextDefault];

            [allNotificationCategories setObject:newCategory forKey: category];
        }
    }
}

- (NSArray*) parseActions:(NSArray*)actions
{
    NSMutableArray* actionsArray;
    actionsArray = [[NSMutableArray alloc] init];
    
    for (NSDictionary* action in actions)
    {
        if ([action isKindOfClass:[NSDictionary class]])
        {
            NSString* actionIdent = [action objectForKey:@"identifier"];
            [self parseAction:action withIdentifier:actionIdent];
            [actionsArray addObject:
                [allNotificationActions objectForKey:actionIdent]];
        }
    }
    
    return actionsArray;
}

- (void) parseAction:(NSDictionary*)action withIdentifier:(NSString*)identifier
{
    
    UIMutableUserNotificationAction* existingAction = 
        [allNotificationActions objectForKey:identifier];
    
    if (!existingAction) {
        
        UIMutableUserNotificationAction* newAction = 
            [[UIMutableUserNotificationAction alloc] init];
        
        [newAction setActivationMode:[
            [action objectForKey:@"foreground"] boolValue]
                ? UIUserNotificationActivationModeForeground
                : UIUserNotificationActivationModeBackground];
        [newAction setTitle:[action objectForKey:@"title"]];
        [newAction setIdentifier:identifier];
        [newAction setDestructive:[
            [action objectForKey:@"destructive"] boolValue]];
        [newAction setAuthenticationRequired:[
            [action objectForKey:@"needsAuth"] boolValue]];
        
        if ([newAction respondsToSelector:@selector(setBehavior:)]) {
            [newAction setBehavior:[
                [action objectForKey:@"acceptsReply"] boolValue]
                    ? UIUserNotificationActionBehaviorTextInput 
                    : UIUserNotificationActionBehaviorDefault];
            
            if ([action objectForKey:@"replySendTitle"]) {
                [newAction setParameters:[NSDictionary dictionaryWithObject:
                    [action objectForKey:@"replySendTitle"]
                    forKey:UIUserNotificationTextInputActionButtonTitleKey]];
            }
        }
        
        [allNotificationActions setObject:newAction forKey:identifier];
    }
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
 * List of all triggered local notifications which have been scheduled
 * and not yet removed the notification center.
 */
- (NSArray*) triggeredLocalNotifications
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* triggeredNotifications = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        if ([notification isTriggered]) {
            [triggeredNotifications addObject:notification];
        }
    }

    return triggeredNotifications;
}

/**
 * List of all local notifications IDs.
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
 * List of all local notifications IDs from given type.
 *
 * @param type
 *      Notification life cycle type
 */
- (NSArray*) localNotificationIdsByType:(APPLocalNotificationType)type
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* ids = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        if (notification.type == type) {
            [ids addObject:notification.options.id];
        }
    }

    return ids;
}

/*
 * If local notification with ID exists.
 *
 * @param id
 *      Notification ID
 */
- (BOOL) localNotificationExist:(NSNumber*)id
{
    return [self localNotificationWithId:id] != NULL;
}

/* If local notification with ID and type exists
 *
 * @param id
 *      Notification ID
 * @param type
 *      Notification life cycle type
 */
- (BOOL) localNotificationExist:(NSNumber*)id type:(APPLocalNotificationType)type
{
    return [self localNotificationWithId:id andType:type] != NULL;
}

/**
 * Get local notification with ID.
 *
 * @param id
 *      Notification ID
 */
- (UILocalNotification*) localNotificationWithId:(NSNumber*)id
{
    NSArray* notifications = self.localNotifications;

    for (UILocalNotification* notification in notifications)
    {
        NSString* fid = [NSString stringWithFormat:@"%@", notification.options.id];
        
        if ([fid isEqualToString:[id stringValue]]) {
            return notification;
        }
    }

    return NULL;
}

/*
 * Get local notification with ID and type.
 *
 * @param id
 *      Notification ID
 * @param type
 *      Notification life cycle type
 */
- (UILocalNotification*) localNotificationWithId:(NSNumber*)id andType:(APPLocalNotificationType)type
{
    UILocalNotification* notification = [self localNotificationWithId:id];

    if (notification && notification.type == type)
        return notification;

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
        [options addObject:notification.options.userInfo];
    }

    return options;
}

/**
 * List of properties from all local notifications from given type.
 *
 * @param type
 *      Notification life cycle type
 */
- (NSArray*) localNotificationOptionsByType:(APPLocalNotificationType)type
{
    NSArray* notifications = self.localNotifications;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (UILocalNotification* notification in notifications)
    {
        if (notification.type == type) {
            [options addObject:notification.options.userInfo];
        }
    }

    return options;
}

/**
 * List of properties from given local notifications.
 *
 * @param ids
 *      Notification IDs
 */
- (NSArray*) localNotificationOptionsById:(NSArray*)ids
{
    UILocalNotification* notification;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (NSNumber* id in ids)
    {
        notification = [self localNotificationWithId:id];

        if (notification) {
            [options addObject:notification.options.userInfo];
        }
    }

    return options;
}

/**
 * List of properties from given local notifications.
 *
 * @param type
 *      Notification life cycle type
 * @param ids
 *      Notification IDs
 */
- (NSArray*) localNotificationOptionsByType:(APPLocalNotificationType)type andId:(NSArray*)ids
{
    UILocalNotification* notification;
    NSMutableArray* options = [[NSMutableArray alloc] init];

    for (NSNumber* id in ids)
    {
        notification = [self localNotificationWithId:id];

        if (notification && notification.type == type) {
            [options addObject:notification.options.userInfo];
        }
    }

    return options;
}

/*
 * Clear all local notfications.
 */
- (void) clearAllLocalNotifications
{
    NSArray* notifications = self.triggeredLocalNotifications;

    for (UILocalNotification* notification in notifications) {
        [self clearLocalNotification:notification];
    }
}

/*
 * Clear single local notfication.
 *
 * @param notification
 *      The local notification object
 */
- (void) clearLocalNotification:(UILocalNotification*)notification
{
    [self cancelLocalNotification:notification];

    if ([notification isRepeating]) {
        notification.fireDate = notification.options.fireDate;

        [self scheduleLocalNotification:notification];
    };
}

@end
