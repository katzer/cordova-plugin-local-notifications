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

#import "APPNotificationOptions.h"
#import "UNUserNotificationCenter+APPLocalNotification.h"

@import CoreLocation;
@import UserNotifications;

// Maps these crap where Sunday is the 1st day of the week
static NSInteger WEEKDAYS[8] = { 0, 2, 3, 4, 5, 6, 7, 1 };

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
 * @param dictionary A key-value property map.
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
    NSInteger id = [dict[@"id"] integerValue];

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
    return dict[@"title"];
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
    return dict[@"text"];
}

/**
 * Don't show a notification, make no sound, no vibration, when app is in foreground
 *
 * @return [ BOOL ]
 */
- (BOOL) silent
{
    return [dict[@"silent"] boolValue];
}

/**
 * Show notification in foreground.
 *
 * @return [ BOOL ]
 */
- (BOOL) iOSForeground
{
    return [dict[@"iOSForeground"] boolValue];
}

/**
 * The badge number for the notification.
 * 0 removes the badge, -1 don't changes the badge
 *
 * @return [ int ]
 */
- (int) badgeNumber
{
    return [dict[@"badgeNumber"] intValue];
}

/**
 * The category of the notification.
 *
 * @return [ NSString* ]
 */
- (NSString*) actionGroupId
{
    id actions = dict[@"actions"];
    
    return ([actions isKindOfClass:NSString.class]) ? actions : kAPPGeneralCategory;
}

/**
 * The sound file for the notification.
 *
 * @return [ UNNotificationSound* ]
 */
- (UNNotificationSound*) sound
{
    NSString* soundPath = dict[@"sound"];

    if (soundPath == NULL || [soundPath length] == 0 ) return NULL;

    if ([soundPath isEqualToString:@"default"]) {
        return [UNNotificationSound defaultSound];
    }

    // Change file:// to www/ for assets
    if ([soundPath hasPrefix:@"file://"]) {
        soundPath = [self soundPathForAsset:soundPath];

        // Gets the file name from the path
    } else if ([soundPath hasPrefix:@"res:"]) {
        soundPath = [self soundNameForResource:soundPath];
    }

    return [UNNotificationSound soundNamed:soundPath];
}


/**
 * Additional content to attach.
 *
 * @return [ UNNotificationSound* ]
 */
- (NSArray<UNNotificationAttachment *> *) attachments
{
    NSArray* attachmentsPaths = dict[@"attachments"];
    NSMutableArray* attachments = [[NSMutableArray alloc] init];

    if (!attachmentsPaths) return attachments;

    for (NSString* path in attachmentsPaths) {
        UNNotificationAttachment* attachment = [UNNotificationAttachment attachmentWithIdentifier:path
                                                                                              URL:[self urlForAttachmentPath:path]
                                                                                          options:NULL
                                                                                            error:NULL];

        if (attachment) {
            [attachments addObject:attachment];
        }
    }

    return attachments;
}

#pragma mark -
#pragma mark Public

/**
 * Specify how and when to trigger the notification.
 *
 * @return [ UNNotificationTrigger* ]
 */
- (UNNotificationTrigger*) trigger
{
    NSString* type = [self valueForTriggerOption:@"type"];

    if ([type isEqualToString:@"location"]) return [self triggerWithRegion];
    if (![type isEqualToString:@"calendar"]) NSLog(@"Unknown type: %@", type);
    if ([self isRepeating]) return [self repeatingTrigger];

    return [self nonRepeatingTrigger];
}

/**
 * The notification's user info dict.
 *
 * @return [ NSDictionary* ]
 */
- (NSDictionary*) userInfo
{
    if (dict[@"updatedAt"]) {
        NSMutableDictionary* data = [dict mutableCopy];

        [data removeObjectForKey:@"updatedAt"];

        return data;
    }

    return dict;
}

#pragma mark -
#pragma mark Private

- (id) valueForTriggerOption:(NSString*)key
{
    return dict[@"trigger"][key];
}

/**
 * The date when to fire the notification.
 *
 * @return [ NSDate* ]
 */
- (NSDate*) triggerDate
{
    double timestamp = [[self valueForTriggerOption:@"at"] doubleValue];

    return [NSDate dateWithTimeIntervalSince1970:(timestamp / 1000)];
}

/**
 * If the notification shall be repeating.
 *
 * @return [ BOOL ]
 */
- (BOOL) isRepeating
{
    id every = [self valueForTriggerOption:@"every"];

    if ([every isKindOfClass:NSString.class])
        return ((NSString*) every).length > 0;

    if ([every isKindOfClass:NSDictionary.class])
        return ((NSDictionary*) every).count > 0;

    return every > 0;
}

/**
 * Non repeating trigger.
 *
 * @return [ UNTimeIntervalNotificationTrigger* ]
 */
- (UNNotificationTrigger*) nonRepeatingTrigger
{
    if ([self valueForTriggerOption:@"at"]) {
        return [self triggerWithDateMatchingComponents:NO];
    }

    return [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:[self timeInterval] repeats:NO];
}

/**
 * Repeating trigger.
 *
 * @return [ UNNotificationTrigger* ]
 */
- (UNNotificationTrigger*) repeatingTrigger
{
    id every = [self valueForTriggerOption:@"every"];

    if ([every isKindOfClass:NSString.class])
        return [self triggerWithDateMatchingComponents:YES];

    if ([every isKindOfClass:NSDictionary.class])
        return [self triggerWithCustomDateMatchingComponents];

    return [self triggerWithTimeInterval];
}

/**
 * A trigger based on a calendar time defined by the user.
 *
 * @return [ UNTimeIntervalNotificationTrigger* ]
 */
- (UNTimeIntervalNotificationTrigger*) triggerWithTimeInterval
{
    double seconds = [self convertTicksToSeconds:[[self valueForTriggerOption:@"every"] doubleValue]
                                            unit:[self valueForTriggerOption:@"unit"]];

    if (seconds < 60) {
        NSLog(@"time interval must be at least 60 sec if repeating");
        seconds = 60;
    }

    return [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:seconds
                                                              repeats:YES];
}

/**
 * A repeating trigger based on a calendar time intervals defined by the plugin.
 *
 * @return [ UNCalendarNotificationTrigger* ]
 */
- (UNCalendarNotificationTrigger*) triggerWithDateMatchingComponents:(BOOL)repeats
{
    NSDateComponents *date = [[self calendarWithMondayAsFirstDay] components:[self repeatInterval]
                                                                    fromDate:[self triggerDate]];

    date.timeZone = [NSTimeZone defaultTimeZone];

    return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:date
                                                                    repeats:repeats];
}

/**
 * A repeating trigger based on a calendar time intervals defined by the user.
 *
 * @return [ UNCalendarNotificationTrigger* ]
 */
- (UNCalendarNotificationTrigger*) triggerWithCustomDateMatchingComponents
{
    NSDateComponents *date = [self customDateComponents];
    date.calendar = [self calendarWithMondayAsFirstDay];
    date.timeZone = [NSTimeZone defaultTimeZone];

    return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:date
                                                                    repeats:YES];
}

/**
 * A repeating trigger based on a location region.
 *
 * @return [ UNLocationNotificationTrigger* ]
 */
- (UNLocationNotificationTrigger*) triggerWithRegion
{
    NSArray* center = [self valueForTriggerOption:@"center"];
    double radius   = [[self valueForTriggerOption:@"radius"] doubleValue];
    BOOL single     = [[self valueForTriggerOption:@"single"] boolValue];

    CLLocationCoordinate2D coord =
    CLLocationCoordinate2DMake([center[0] doubleValue], [center[1] doubleValue]);

    CLCircularRegion* region =
    [[CLCircularRegion alloc] initWithCenter:coord
                                      radius:radius
                                  identifier:self.identifier];

    region.notifyOnEntry = [[self valueForTriggerOption:@"notifyOnEntry"] boolValue];
    region.notifyOnExit  = [[self valueForTriggerOption:@"notifyOnExit"] boolValue];

    return [UNLocationNotificationTrigger triggerWithRegion:region
                                                    repeats:!single];
}

/**
 * The time interval between the next fire date and now.
 *
 * @return [ double ]
 */
- (double) timeInterval
{
    double ticks   = [[self valueForTriggerOption:@"in"] doubleValue];
    NSString* unit = [self valueForTriggerOption:@"unit"];
    double seconds = [self convertTicksToSeconds:ticks unit:unit];

    return MAX(0.01f, seconds);
}

/**
 * The repeat interval for the notification.
 *
 * @return [ NSCalendarUnit ]
 */
- (NSCalendarUnit) repeatInterval
{
    NSString* interval = [self valueForTriggerOption:@"every"];
    NSCalendarUnit units = NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

    if ([interval isEqualToString:@"minute"])
        return NSCalendarUnitSecond;

    if ([interval isEqualToString:@"hour"])
        return NSCalendarUnitMinute|NSCalendarUnitSecond;

    if ([interval isEqualToString:@"day"])
        return NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

    if ([interval isEqualToString:@"week"])
        return NSCalendarUnitWeekday|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

    if ([interval isEqualToString:@"month"])
        return NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

    if ([interval isEqualToString:@"year"])
        return NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

    return units;
}

/**
 * The repeat interval for the notification.
 *
 * @return [ NSDateComponents* ]
 */
- (NSDateComponents*) customDateComponents
{
    NSDateComponents* date  = [[NSDateComponents alloc] init];
    NSDictionary* every     = [self valueForTriggerOption:@"every"];

    date.second = 0;

    for (NSString* key in every) {
        long value = [[every valueForKey:key] longValue];

        if ([key isEqualToString:@"minute"]) {
            date.minute = value;
        } else
        if ([key isEqualToString:@"hour"]) {
            date.hour = value;
        } else
        if ([key isEqualToString:@"day"]) {
            date.day = value;
        } else
        if ([key isEqualToString:@"weekday"]) {
            date.weekday = WEEKDAYS[value];
        } else
        if ([key isEqualToString:@"weekdayOrdinal"]) {
            date.weekdayOrdinal = value;
        } else
        if ([key isEqualToString:@"week"]) {
            date.weekOfYear = value;
        } else
        if ([key isEqualToString:@"weekOfMonth"]) {
            date.weekOfMonth = value;
        } else
        if ([key isEqualToString:@"month"]) {
            date.month = value;
        } else
        if ([key isEqualToString:@"quarter"]) {
            date.quarter = value;
        } else
        if ([key isEqualToString:@"year"]) {
            date.year = value;
        }
    }

    return date;
}

/**
 * Converts file:// to www/ for assets.
 * @param path A relative assets file path.
 * @return [ NSString* ]
 */
- (NSString*) soundPathForAsset:(NSString*)path
{
    return [path stringByReplacingOccurrencesOfString:@"file://" withString:@"www/"];
}

/**
 * Convert a ressource path to an valid sound name attribute.
 * @param path A relative ressource file path.
 * @return [ NSString* ]
 */
- (NSString*) soundNameForResource:(NSString*)path
{
    return [path pathComponents].lastObject;
}

/**
 * URL for the specified attachment path.
 * @param path Absolute/relative path or a base64 data.
 * @return [ NSURL* ]
 */
- (NSURL*) urlForAttachmentPath:(NSString*)path
{
    if ([path hasPrefix:@"file:///"]) return [self urlForFile:path];
    if ([path hasPrefix:@"res:"]) return [self urlForResource:path];
    if ([path hasPrefix:@"www"] || [path hasPrefix:@"file://"]) return [self urlForAsset:path];
    if ([path hasPrefix:@"base64:"]) return [self urlFromBase64:path];

    if (![[NSFileManager defaultManager] fileExistsAtPath:path]) NSLog(@"File not found: %@", path);

    return [NSURL fileURLWithPath:path];
}

/**
 * URL to an absolute file path.
 * @return [ NSURL* ]
 */
- (NSURL*) urlForFile:(NSString*)absoluteFilePath
{
    absoluteFilePath = [absoluteFilePath stringByReplacingOccurrencesOfString:@"file://" withString:@""];

    if (![[NSFileManager defaultManager] fileExistsAtPath:absoluteFilePath]) {
        NSLog(@"File not found: %@", absoluteFilePath);
    }

    return [NSURL fileURLWithPath:absoluteFilePath];
}

/**
 * URL to a resource file.
 * @param path A relative file path.
 * @return [ NSURL* ]
 */
- (NSURL*) urlForResource:(NSString*)path
{
    if ([path isEqualToString:@"res://icon"]) path = @"res://AppIcon60x60@3x.png";

    NSString* absPath = [path stringByReplacingOccurrencesOfString:@"res:/"
                                                        withString:@""];
    
    absPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingString:absPath];

    if (![[NSFileManager defaultManager] fileExistsAtPath:absPath]) NSLog(@"File not found: %@", absPath);

    return [NSURL fileURLWithPath:absPath];
}

/**
 * URL to an asset file.
 * @param path A relative www file path.
 * @return [ NSURL* ]
 */
- (NSURL*) urlForAsset:(NSString*)path
{
    NSString *absoluteAssetPath = [NSString stringWithFormat:@"%@/%@",
        [[NSBundle mainBundle] bundlePath],
        [path stringByReplacingOccurrencesOfString:@"file://"
                                        withString:@"www/"]];

    if (![[NSFileManager defaultManager] fileExistsAtPath:absoluteAssetPath]) {
        NSLog(@"File not found: %@", absoluteAssetPath);
    }

    return [NSURL fileURLWithPath:absoluteAssetPath];
}

/**
 * URL for a base64 encoded string.
 * @param base64String Base64 encoded string.
 * @return [ NSURL* ]
 */
- (NSURL*) urlFromBase64:(NSString*)base64String
{
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^base64:[^/]+.."
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:Nil];

    NSString *dataString = [regex stringByReplacingMatchesInString:base64String
                                                           options:0
                                                             range:NSMakeRange(0, [base64String length])
                                                      withTemplate:@""];

    NSData* data = [[NSData alloc] initWithBase64EncodedString:dataString
                                                       options:0];


    return [self urlForData:data withFileName:[self basenameFromAttachmentPath:base64String]];
}

/**
 * Extract the attachments basename.
 * @param path The file path or base64 data.
 * @return [ NSString* ]
 */
- (NSString*) basenameFromAttachmentPath:(NSString*)path
{
    if ([path hasPrefix:@"base64:"]) {
        NSString* pathWithoutPrefix = [path stringByReplacingOccurrencesOfString:@"base64:"
                                                                      withString:@""];

        return [pathWithoutPrefix substringToIndex:[pathWithoutPrefix rangeOfString:@"//"].location];
    }

    return path;
}

/**
 * Write the data into a temp file.
 * @param data The data to save to file.
 * @param filename The name of the file.
 * @return [ NSURL* ]
 */
- (NSURL*) urlForData:(NSData*)data withFileName:(NSString*) filename
{
    [[NSFileManager defaultManager] createDirectoryAtPath:NSTemporaryDirectory()
                              withIntermediateDirectories:YES
                                               attributes:NULL
                                                    error:NULL];

    NSString* absPath = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];

    if (![[NSFileManager defaultManager] fileExistsAtPath:absPath]) NSLog(@"File not found: %@", absPath);

    NSURL* url = [NSURL fileURLWithPath:absPath];
    [data writeToURL:url atomically:NO];
    
    return url;
}

/**
 * Convert the amount of ticks into seconds.
 * @param ticks The amount of ticks.
 * @param unit  The unit of the ticks (minute, hour, day, ...)
 * @return [ double ] Amount of ticks in seconds.
 */
- (double) convertTicksToSeconds:(double)ticks unit:(NSString*)unit
{
    if ([unit isEqualToString:@"second"]) {
        return ticks;
    } else if ([unit isEqualToString:@"minute"]) {
        return ticks * 60;
    } else if ([unit isEqualToString:@"hour"]) {
        return ticks * 60 * 60;
    } else if ([unit isEqualToString:@"day"]) {
        return ticks * 60 * 60 * 24;
    } else if ([unit isEqualToString:@"week"]) {
        return ticks * 60 * 60 * 24 * 7;
    } else if ([unit isEqualToString:@"month"]) {
        return ticks * 60 * 60 * 24 * 30.438;
    } else if ([unit isEqualToString:@"quarter"]) {
        return ticks * 60 * 60 * 24 * 91.313;
    } else if ([unit isEqualToString:@"year"]) {
        return ticks * 60 * 60 * 24 * 365;
    }

    return 0;
}

/**
 * Instance if a calendar where the monday is the first day of the week.
 * @return [ NSCalendar* ]
 */
- (NSCalendar*) calendarWithMondayAsFirstDay
{
    NSCalendar* calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierISO8601];
    calendar.firstWeekday = 2;
    calendar.minimumDaysInFirstWeek = 1;
    return calendar;
}

/**
 * String representation of this Object
 */
- (NSString *)description {
   return [NSString stringWithFormat: @"%@", dict];
}
@end
