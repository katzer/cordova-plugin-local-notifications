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

#import "APPNotificationOptions.h"

@import UserNotifications;

@interface APPNotificationOptions ()

// The dictionary which contains all notification properties
@property(nonatomic, retain) NSDictionary* dict;

@end

@implementation APPNotificationOptions : NSObject

@synthesize dict;

#pragma mark -
#pragma mark Initialization

/**
 * Initialize by using the given property values.
 *
 * @param [ NSDictionary* ] dict A key-value property map.
 *
 * @return [ APPNotificationOptions ]
 */
- (id) initWithDict:(NSDictionary*)dictionary
{
    self = [self init];

    self.dict = dictionary;

    return self;
}

#pragma mark -
#pragma mark Properties

/**
 * The ID for the notification.
 *
 * @return [ NSNumber* ]
 */
- (NSNumber*) id
{
    NSInteger id = [[dict objectForKey:@"id"] integerValue];

    return [NSNumber numberWithInteger:id];
}

/**
 * The ID for the notification.
 *
 * @return [ NSString* ]
 */
- (NSString*) identifier
{
    return [NSString stringWithFormat:@"%@", self.id];
}

/**
 * The title for the notification.
 *
 * @return [ NSString* ]
 */
- (NSString*) title
{
    return [dict objectForKey:@"title"];
}

/**
 * The subtitle for the notification.
 *
 * @return [ NSString* ]
 */
- (NSString*) subtitle
{
    NSArray *parts = [self.title componentsSeparatedByString:@"\n"];

    return parts.count < 2 ? @"" : [parts objectAtIndex:1];
}

/**
 * The text for the notification.
 *
 * @return [ NSString* ]
 */
- (NSString*) text
{
    return [dict objectForKey:@"text"];
}

/**
 * The badge number for the notification.
 *
 * @return [ NSNumber* ]
 */
- (NSNumber*) badge
{
    return [NSNumber numberWithInt:[[dict objectForKey:@"badge"] intValue]];
}

/**
 * The sound file for the notification.
 *
 * @return [ UNNotificationSound* ]
 */
- (UNNotificationSound*) sound
{
    NSString* path = [dict objectForKey:@"sound"];
    NSString* file;

    if (!path.length)
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
 * The date when to fire the notification.
 *
 * @return [ NSDate* ]
 */
- (NSDate*) fireDate
{
    double timestamp = [[dict objectForKey:@"at"]
                        doubleValue];

    return [NSDate dateWithTimeIntervalSince1970:timestamp];
}

#pragma mark -
#pragma mark Public

/**
 * If the notification shall be repeating.
 *
 * @return [ BOOL ]
 */
- (BOOL) isRepeating
{
    id every = [dict objectForKey:@"every"];

    if ([every isKindOfClass:NSString.class])
        return ((NSString*) every).length > 0;

    return every > 0;
}

/**
 * Specify how and when to trigger the notification.
 *
 * @return [ UNNotificationTrigger* ]
 */
- (UNNotificationTrigger*) trigger
{
    if ([self isRepeating])
        return [self repeatingTrigger];

    return [self nonRepeatingTrigger];
}

/**
 * The notification's user info dict.
 *
 * @return [ NSDictionary* ]
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
 * Non repeating trigger.
 *
 * @return [ UNTimeIntervalNotificationTrigger* ]
 */
- (UNTimeIntervalNotificationTrigger*) nonRepeatingTrigger
{
    return [UNTimeIntervalNotificationTrigger
            triggerWithTimeInterval:[self timeInterval] repeats:NO];
}

/**
 * Repeating trigger.
 *
 * @return [ UNNotificationTrigger* ]
 */
- (UNNotificationTrigger*) repeatingTrigger
{
    id every = [dict objectForKey:@"every"];

    if ([every isKindOfClass:NSString.class])
        return [self repeatingTriggerWithDateMatchingComponents];

    return [self repeatingTriggerWithTimeInterval];
}

/**
 * A trigger based on a calendar time defined by the user.
 *
 * @return [ UNTimeIntervalNotificationTrigger* ]
 */
- (UNTimeIntervalNotificationTrigger*) repeatingTriggerWithTimeInterval
{
    long interval = [[dict objectForKey:@"every"] longValue];

    if (interval < 60) {
        NSLog(@"time interval must be at least 60 if repeating");
        interval = 60;
    }

    return [UNTimeIntervalNotificationTrigger
            triggerWithTimeInterval:interval repeats:YES];
}

/**
 * A repeating trigger based on a calendar time defined by the user.
 *
 * @return [ UNCalendarNotificationTrigger* ]
 */
- (UNCalendarNotificationTrigger*) repeatingTriggerWithDateMatchingComponents
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
 * The time interval between the next fire date and now.
 *
 * @return [ double ]
 */
- (double) timeInterval
{
    return MAX(0.01f, [self.fireDate timeIntervalSinceDate:[NSDate date]]);
}

/**
 * The repeat interval for the notification.
 *
 * @return [ NSCalendarUnit ]
 */
- (NSCalendarUnit) repeatInterval
{
    NSString* interval = [dict objectForKey:@"every"];
    NSCalendarUnit units = NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;


    if (!interval.length)
        return units;

    if ([interval isEqualToString:@"second"])
        return NSCalendarUnitNanosecond;

    if ([interval isEqualToString:@"minute"])
        return NSCalendarUnitSecond;

    if ([interval isEqualToString:@"hour"])
        return NSCalendarUnitMinute;

    if ([interval isEqualToString:@"day"])
        return NSCalendarUnitHour|NSCalendarUnitMinute;

    if ([interval isEqualToString:@"week"])
        return NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitWeekday;

    if ([interval isEqualToString:@"month"])
        return NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitDay;

    if ([interval isEqualToString:@"year"])
        return NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitDay|NSCalendarUnitMonth;

    return units;
}

/**
 * Convert an assets path to an valid sound name attribute.
 *
 * @param [ NSString* ] path A relative assets file path.
 *
 * @return [ NSString* ]
 */
- (NSString*) soundNameForAsset:(NSString*)path
{
    return [path stringByReplacingOccurrencesOfString:@"file:/"
                                           withString:@"www"];
}

/**
 * Convert a ressource path to an valid sound name attribute.
 *
 * @param [ NSString* ] path A relative ressource file path.
 *
 * @return [ NSString* ]
 */
- (NSString*) soundNameForResource:(NSString*)path
{
    return [path pathComponents].lastObject;
}

@end
