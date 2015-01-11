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

#import "APPLocalNotificationOptions.h"
#import <Cordova/CDVAvailability.h>

@interface APPLocalNotificationOptions ()

// The dictionary which contains all notification properties
@property(readwrite, assign) NSDictionary* dict;

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
    self = [super init];

    self.dict = dictionary;

    return self;
}

#pragma mark -
#pragma mark Attributes

/**
 * The notification's ID.
 */
- (NSString*) id
{
    return [dict objectForKey:@"id"];
}

/**
 * The notification's title.
 */
- (NSString*) title
{
    return [dict objectForKey:@"title"];
}

/**
 * The notification's message.
 */
- (NSString*) message
{
    return [dict objectForKey:@"message"];
}

/**
 * The notification's auto cancel flag.
 */
- (BOOL) autoCancel
{
    if (IsAtLeastiOSVersion(@"8.0")){
        return ![self isRepeating];
    } else {
        return [[dict objectForKey:@"autoCancel"] boolValue];
    }
}

/**
 * The notification's JSON data.
 */
- (NSString*) json
{
    return [dict objectForKey:@"json"];
}

/**
 * The notification's badge number.
 */
- (NSInteger) badgeNumber
{
    NSInteger number = [[dict objectForKey:@"badge"] intValue];

    if (number == -1) {
        number = 1 + [UIApplication sharedApplication].applicationIconBadgeNumber;
    }

    return number;
}

#pragma mark -
#pragma mark Complex Attributes

/**
 * The notification's alert body.
 */
- (NSString*) alertBody
{
    NSString* title = [self title];
    NSString* msg = [self message];

    NSString* alertBody = msg;

    if (![self stringIsNullOrEmpty:title])
    {
        alertBody = [NSString stringWithFormat:@"%@\n%@",
                     title, msg];
    }

    return alertBody;
}

/**
 * The notification's sound path.
 */
- (NSString*) soundName
{
    NSString* path = [dict objectForKey:@"sound"];

    if ([path hasPrefix:@"file:/"])
    {
        return [self soundNameForAsset:path];
    }
    else if ([path hasPrefix:@"res:"])
    {
        return [self soundNameForResource:path];
    }

    return UILocalNotificationDefaultSoundName;
}

/**
 * The notification's fire date.
 */
- (NSDate*) fireDate
{
    double timestamp = [[dict objectForKey:@"date"]
                        doubleValue];

    return [NSDate dateWithTimeIntervalSince1970:timestamp];
}

/**
 * The notification's repeat interval.
 */
- (NSCalendarUnit) repeatInterval
{
    NSString* interval = [dict objectForKey:@"repeat"];

    if ([interval isEqualToString:@"secondly"])
    {
        return NSCalendarUnitSecond;
    }
    else if ([interval isEqualToString:@"minutely"])
    {
        return NSCalendarUnitMinute;
    }
    else if ([interval isEqualToString:@"hourly"])
    {
        return NSCalendarUnitHour;
    }
    else if ([interval isEqualToString:@"daily"])
    {
        return NSCalendarUnitDay;
    }
    else if ([interval isEqualToString:@"weekly"])
    {
        return NSCalendarUnitWeekOfYear;
    }
    else if ([interval isEqualToString:@"monthly"])
    {
        return NSCalendarUnitMonth;
    }
    else if ([interval isEqualToString:@"yearly"])
    {
        return NSCalendarUnitYear;
    }

    return NSCalendarUnitEra;
}

#pragma mark -
#pragma mark Methods

/**
 * The notification's user info dict.
 */
- (NSDictionary*) userInfo
{
    return dict;
}

/**
 * If it's a repeating notification.
 */
- (BOOL) isRepeating
{
    NSCalendarUnit interval = self.repeatInterval;

    return !(interval == NSCalendarUnitEra || interval == 0);
}

#pragma mark -
#pragma mark Helpers

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
    if (str == (NSString*)[NSNull null])
        return YES;

    if ([str isEqualToString:@""])
        return YES;

    return NO;
}

@end
