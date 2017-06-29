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

#import "APPLocalNotificationOptions.h"

@import UserNotifications;

@interface APPLocalNotificationOptions ()

// The dictionary which contains all notification properties
@property(nonatomic, retain) NSDictionary* dict;

@end

@implementation APPLocalNotificationOptions

@synthesize dict;

#pragma mark -
#pragma mark Initialization

/**
 * Initialize the object with the given options when calling on JS side:
 * notification.local.add(options)
 */
- (id) initWithDict:(NSDictionary*)dictionary
{
    self = [self init];

    self.dict = dictionary;

    return self;
}

#pragma mark -
#pragma mark Attributes

/**
 * The notification's ID.
 */
- (NSNumber*) id
{
    NSInteger id = [[dict objectForKey:@"id"] integerValue];

    return [NSNumber numberWithInteger:id];
}

/**
 * The notification's ID as a string.
 */
- (NSString*) identifier
{
    return [NSString stringWithFormat:@"%@", self.id];
}

/**
 * The notification's title.
 */
- (NSString*) title
{
    return [dict objectForKey:@"title"];
}

/**
 * The notification's title.
 */
- (NSString*) subtitle
{
    NSArray *parts = [self.title componentsSeparatedByString:@"\n"];

    return parts.count < 2 ? @"" : [parts objectAtIndex:1];
}

/**
 * The notification's message.
 */
- (NSString*) text
{
    return [dict objectForKey:@"text"];
}

/**
 * The notification's badge number.
 */
- (NSNumber*) badge
{
    return [NSNumber numberWithInt:[[dict objectForKey:@"badge"] intValue]];
}

/**
 * The notification's sound path.
 */
- (UNNotificationSound*) sound
{
    NSString* path = [dict objectForKey:@"sound"];
    NSString* file;

    if ([self stringIsNullOrEmpty:path])
        return NULL;

    if ([path isEqualToString:@"res://platform_default"])
        return [UNNotificationSound defaultSound];

    if ([path hasPrefix:@"file:/"]) {
        file = [self soundNameForAsset:path];
    } else
    if ([path hasPrefix:@"res:"]) {
        file = [self soundNameForResource:path];
    }

    return [UNNotificationSound soundNamed:file];
}

/**
 * The notification's fire date.
 */
- (NSDate*) fireDate
{
    double timestamp = [[dict objectForKey:@"at"]
                        doubleValue];

    return [NSDate dateWithTimeIntervalSince1970:timestamp];
}

/**
 * If it's a repeating notification.
 */
- (BOOL) isRepeating
{
    NSString* interval = [dict objectForKey:@"every"];

    return ![self stringIsNullOrEmpty:interval];
}

#pragma mark -
#pragma mark Methods

/**
 * Specify how and when to trigger the notification.
 */
- (UNNotificationTrigger*) trigger
{
    return [self isRepeating] ? [self triggerWithDateMatchingComponents] : [self triggerWithTimeInterval];
}

/**
 * The notification's user info dict.
 */
- (NSDictionary*) userInfo
{
    if ([dict objectForKey:@"updatedAt"]) {
        NSMutableDictionary* data = [dict mutableCopy];

        [data removeObjectForKey:@"updatedAt"];

        return data;
    }

    return dict;
}

#pragma mark -
#pragma mark Private

/**
 * Returns a trigger based on a custom time interval in seconds.
 */
- (UNTimeIntervalNotificationTrigger*) triggerWithTimeInterval
{
    return [UNTimeIntervalNotificationTrigger
            triggerWithTimeInterval:[self timeInterval] repeats:NO];
}

/**
 * Returns a trigger based on a calendar time.
 */
- (UNCalendarNotificationTrigger*) triggerWithDateMatchingComponents
{
    NSCalendar* cal = [[NSCalendar alloc]
                       initWithCalendarIdentifier:NSCalendarIdentifierGregorian];

    NSDateComponents *date = [cal components:[self repeatInterval]
                                    fromDate:[self fireDate]];

    [date setTimeZone:[NSTimeZone defaultTimeZone]];

    return [UNCalendarNotificationTrigger
            triggerWithDateMatchingComponents:date repeats:YES];
}

/**
 * Timeinterval between future fire date and now.
 */
- (double) timeInterval
{
    return MAX(0.01f, [self.fireDate timeIntervalSinceDate:[NSDate date]]);
}

/**
 * The notification's repeat interval.
 */
- (NSCalendarUnit) repeatInterval
{
    NSString* interval = [dict objectForKey:@"every"];
    NSCalendarUnit unitFlags = NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;


    if ([self stringIsNullOrEmpty:interval]) {
        return unitFlags;
    }
    else if ([interval isEqualToString:@"second"]) {
        return NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay;
    }
    else if ([interval isEqualToString:@"minute"]) {
        return NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitSecond;
    }
    else if ([interval isEqualToString:@"hour"]) {
        return NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"day"]) {
        return NSCalendarUnitHour|NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"week"]) {
        return NSCalendarUnitWeekday|NSCalendarUnitHour|NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"month"]) {
        return NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"year"]) {
        return NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute;
    }

    return unitFlags;
}

/**
 * Convert relative path to valid sound name attribute.
 */
- (NSString*) soundNameForAsset:(NSString*)path
{
    return [path stringByReplacingOccurrencesOfString:@"file:/"
                                           withString:@"www"];
}

/**
 * Convert resource path to valid sound name attribute.
 */
- (NSString*) soundNameForResource:(NSString*)path
{
    return [path pathComponents].lastObject;
}

/**
 * If the string is empty.
 */
- (BOOL) stringIsNullOrEmpty:(NSString*)str
{
    return (!str.length);
}

@end
