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

#import "APPNotificationCategory.h"

@import UserNotifications;

@implementation APPNotificationCategory : NSObject

#pragma mark -
#pragma mark Public

/**
 * Parse the provided spec map into an action group.
 *
 * @param [ NSDictionary* ] spec A key-value property map.
 *                               Must contain an id and a list of actions.
 *
 * @return [ UNNotificationCategory* ]
 */
+ (UNNotificationCategory*) parse:(NSArray*)list withId:(NSString*)groupId
{
    NSArray* actions = [self parseActions:list];

    return [UNNotificationCategory categoryWithIdentifier:groupId
                                                  actions:actions
                                        intentIdentifiers:@[]
                                                  options:UNNotificationCategoryOptionCustomDismissAction];
}

#pragma mark -
#pragma mark Private

/**
 * The actions of the action group.
 *
 * @return [ NSArray* ]
 */
+ (NSArray<UNNotificationAction *> *) parseActions:(NSArray*)items
{
    NSMutableArray* actions = [[NSMutableArray alloc] init];
    
    for (NSDictionary* item in items) {
        NSString* id    = item[@"id"];
        NSString* title = item[@"title"];
        NSString* type  = item[@"type"];
        
        UNNotificationActionOptions options = UNNotificationActionOptionNone;
        UNNotificationAction* action;
        
        if ([item[@"launch"] boolValue]) {
            options = UNNotificationActionOptionForeground;
        }
        
        if ([item[@"ui"] isEqualToString:@"decline"]) {
            options = options | UNNotificationActionOptionDestructive;
        }
        
        if ([item[@"needsAuth"] boolValue]) {
            options = options | UNNotificationActionOptionAuthenticationRequired;
        }
        
        if ([type isEqualToString:@"input"]) {
            NSString* submitTitle = item[@"submitTitle"];
            NSString* placeholder = item[@"emptyText"];
            
            if (!submitTitle.length) {
                submitTitle = @"Submit";
            }
            
            action = [UNTextInputNotificationAction actionWithIdentifier:id
                                                                   title:title
                                                                 options:options
                                                    textInputButtonTitle:submitTitle
                                                    textInputPlaceholder:placeholder];
        } else
            if (!type.length || [type isEqualToString:@"button"]) {
                action = [UNNotificationAction actionWithIdentifier:id
                                                              title:title
                                                            options:options];
            } else {
                NSLog(@"Unknown action type: %@", type);
            }
        
        if (action) {
            [actions addObject:action];
        }
    }
    
    return actions;
}

@end
