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

#import "UILocalNotification+APPLocalNotification.h"
#import "APPLocalNotificationOptions.h"
#import <objc/runtime.h>

static char optionsKey;

@implementation UILocalNotification (APPLocalNotification)

#pragma mark -
#pragma mark Init methods

/**
 * Initialize a local notification with the given options when calling on JS side:
 * notification.local.add(options)
 */
- (id) initWithOptions:(NSDictionary*)dict
{
    self = [super init];

    [self setUserInfo:dict];
    [self __init];

    return self;
}

/**
 * Applies the given options when calling on JS side:
 * notification.local.add(options)

 */
- (void) __init
{
    APPLocalNotificationOptions* options = self.options;

    self.fireDate = options.fireDate;
    self.timeZone = [NSTimeZone defaultTimeZone];
    self.applicationIconBadgeNumber = options.badgeNumber;
    self.repeatInterval = options.repeatInterval;
    self.alertBody = options.alertBody;
    self.soundName = options.soundName;
}

/**
 * The options provided by the plug-in.
 */
- (APPLocalNotificationOptions*) options
{
    APPLocalNotificationOptions* options = [self getOptions];

    if (!options) {
        options = [[APPLocalNotificationOptions alloc]
                   initWithDict:[self userInfo]];

        [self setOptions:options];
    }

    return options;
}

/**
 * Get associated option object
 */
- (APPLocalNotificationOptions*) getOptions
{
    return objc_getAssociatedObject(self, &optionsKey);
}

/**
 * Set associated option object
 */
- (void) setOptions:(APPLocalNotificationOptions*)options
{
    objc_setAssociatedObject(self, &optionsKey,
                             options, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 * The repeating interval in seconds.
 */
- (int) repeatIntervalInSeconds
{
    switch (self.repeatInterval) {
        case NSCalendarUnitMinute:
            return 60;

        case NSCalendarUnitHour:
            return 60000;

        case NSCalendarUnitDay:
        case NSCalendarUnitWeekOfYear:
        case NSCalendarUnitMonth:
        case NSCalendarUnitYear:
            return 86400;

        default:
            return 1;
    }
}

/**
 * Timeinterval since fire date.
 */
- (double) timeIntervalSinceFireDate
{
    NSDate* now      = [NSDate date];
    NSDate* fireDate = self.options.fireDate;

    int timespan     = [now timeIntervalSinceDate:fireDate];

    if (self.repeatInterval != NSCalendarUnitEra) {
        timespan = timespan % [self repeatIntervalInSeconds];
    }

    return timespan;
}

/**
 * If the fire date was in the past.
 */
- (BOOL) wasInThePast
{
    return [self timeIntervalSinceFireDate] < 0;
}

/**
 * If the notification was already triggered.
 */
- (BOOL) wasTriggered
{
    NSDate* now      = [NSDate date];
    NSDate* fireDate = self.fireDate;

    bool isLaterThanOrEqualTo = !([now compare:fireDate] == NSOrderedAscending);

    return isLaterThanOrEqualTo;
}

@end
