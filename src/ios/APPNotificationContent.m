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

#import "APPNotificationContent.h"
#import "APPNotificationOptions.h"
#import <objc/runtime.h>

@import UserNotifications;

static char optionsKey;

@implementation APPNotificationContent : UNMutableNotificationContent

#pragma mark -
#pragma mark Init

/**
 * Initialize a notification with the given options.
 * @param dict A key-value property map.
 * @return [ UNMutableNotificationContent ]
 */
- (id) initWithOptions:(NSDictionary*)dict
{
    self = [self init];

    [self setUserInfo:dict];
    [self __init];

    return self;
}

/**
 * Initialize a notification by using the options found under userInfo.
 */
- (void) __init
{
    self.title = self.options.title;
    self.subtitle = self.options.subtitle;
    self.body = self.options.text;
    self.sound = self.options.sound;
    // -1 will not change the badge, 0 will clear it
    self.badge = self.options.badgeNumber == -1 ? nil : [NSNumber numberWithInt:self.options.badgeNumber];
    self.attachments = self.options.attachments;
    self.categoryIdentifier = self.options.actionGroupId;
}

#pragma mark -
#pragma mark Public

/**
 * The options used to initialize the notification.
 *
 * @return [ APPNotificationOptions* ] options
 */
- (APPNotificationOptions*) options
{
    APPNotificationOptions* options = [self getOptions];

    if (!options) {
        options = [[APPNotificationOptions alloc]
                   initWithDict:[self userInfo]];

        [self setOptions:options];
    }

    return options;
}

/**
 * Creates a notification request object that you use to schedule a notification.
 *
 * @return [ UNNotificationRequest* ]
 */
- (UNNotificationRequest*) request
{
    APPNotificationOptions* options = [self getOptions];
    
    return [UNNotificationRequest requestWithIdentifier:options.identifier
                                                content:self
                                                trigger:options.trigger];
}

#pragma mark -
#pragma mark Private

/**
 * The options used to initialize the notification.
 *
 * @return [ APPNotificationOptions* ]
 */
- (APPNotificationOptions*) getOptions
{
    return objc_getAssociatedObject(self, &optionsKey);
}

/**
 * Set the options used to initialize the notification.
 */
- (void) setOptions:(APPNotificationOptions*)options
{
    objc_setAssociatedObject(self, &optionsKey, options, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end
