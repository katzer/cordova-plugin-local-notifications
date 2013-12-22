/*
 Copyright 2013 appPlant UG

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

#import "APPLocalNotification.h"

@interface APPLocalNotification (Private)

// Archiviert die Meldungen, sodass sie später abgerufen werden kann
- (void) archiveNotification:(UILocalNotification*)notification;
// Nachschlagewerk für Zeitintervallangaben
- (NSMutableDictionary*) repeatDict;
// Alle zusätzlichen Metadaten der Notification als Hash
- (NSDictionary*) userDict:(NSMutableDictionary*)options;
// Erstellt die Notification und setzt deren Eigenschaften
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options;
// Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist
- (void) didReceiveLocalNotification:(NSNotification*)localNotification;
// Hilfsmethode gibt an, ob er String NULL oder Empty ist
- (BOOL) strIsNullOrEmpty:(NSString*)str;

@end

// Schlüssel-Präfix für alle archivierten Meldungen
NSString *const kAPP_LOCALNOTIFICATION = @"APP_LOCALNOTIFICATION";


@implementation APPLocalNotification

/**
 * Fügt eine neue Notification-Eintrag hinzu.
 *
 * @param {NSMutableDictionary} options Die Eigenschaften der Notification
 */
- (void) add:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments                = [command arguments];
        NSMutableDictionary* options      = [arguments objectAtIndex:0];
        UILocalNotification* notification = [self notificationWithProperties:options];
        NSString* notificationId          = [notification.userInfo objectForKey:@"id"];

        [self cancelNotificationWithId:notificationId];
        [self archiveNotification:notification];

        [[UIApplication sharedApplication] scheduleLocalNotification:notification];
    }];
}

/**
 * Entfernt die zur ID passende Meldung.
 *
 * @param {NSString} id Die ID der Notification
 */
- (void) cancel:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* arguments       = [command arguments];
        NSString* notificationId = [arguments objectAtIndex:0];

        [self cancelNotificationWithId:notificationId];
    }];
}

/**
 * Entfernt alle registrierten Einträge.
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSDictionary* entries = [[NSUserDefaults standardUserDefaults] dictionaryRepresentation];

        for (NSString* key in [entries allKeys])
        {
            if ([key hasPrefix:kAPP_LOCALNOTIFICATION])
            {
                [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
            }
        }

        [[NSUserDefaults standardUserDefaults] synchronize];

        [[UIApplication sharedApplication] cancelAllLocalNotifications];
    }];
}

/**
 * Entfernt den zur ID passenden Eintrag.
 *
 * @param {NSString} id Die ID der Notification
 */
- (void) cancelNotificationWithId:(NSString*)id
{
    if (![self strIsNullOrEmpty:id])
    {
        NSString* key = [kAPP_LOCALNOTIFICATION stringByAppendingString:id];
        NSData* data  = [[NSUserDefaults standardUserDefaults] objectForKey:key];

        if (data)
        {
            UILocalNotification* notification = [NSKeyedUnarchiver unarchiveObjectWithData:data];

            [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
            [[UIApplication sharedApplication] cancelLocalNotification:notification];
        }
    }
}

/**
 * Archiviert die Meldungen, sodass sie später abgerufen werden kann.
 *
 * @param {UILocalNotification} notification
 */
- (void) archiveNotification:(UILocalNotification*)notification
{
    NSString* id = [notification.userInfo objectForKey:@"id"];

    if (![self strIsNullOrEmpty:id])
    {
        NSData* data  = [NSKeyedArchiver archivedDataWithRootObject:notification];
        NSString* key = [kAPP_LOCALNOTIFICATION stringByAppendingString:id];

        [[NSUserDefaults standardUserDefaults] setObject:data forKey:key];
    }
}

/**
 * Nachschlagewerk für Zeitintervallangaben.
 */
- (NSMutableDictionary*) repeatDict
{
    NSMutableDictionary* repeatDict = [[NSMutableDictionary alloc] init];

    [repeatDict setObject:[NSNumber numberWithInt:NSMinuteCalendarUnit] forKey:@"minutely" ];
    [repeatDict setObject:[NSNumber numberWithInt:NSHourCalendarUnit]  forKey:@"hourly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSDayCalendarUnit]   forKey:@"daily"];
    [repeatDict setObject:[NSNumber numberWithInt:NSWeekCalendarUnit]  forKey:@"weekly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSMonthCalendarUnit] forKey:@"monthly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSYearCalendarUnit]  forKey:@"yearly"];
    [repeatDict setObject:[NSNumber numberWithInt:0]                   forKey:@""];

    return repeatDict;
}

/**
 * Alle zusätzlichen Metadaten der Notification als Hash.
 */
- (NSDictionary*) userDict:(NSMutableDictionary*)options
{
    NSString* id = [options objectForKey:@"id"];
    NSString* bg = [options objectForKey:@"background"];
    NSString* fg = [options objectForKey:@"foreground"];
    NSString* ac = [options objectForKey:@"autoCancel"];

    return [NSDictionary dictionaryWithObjectsAndKeys:id, @"id", bg, @"background", fg, @"foreground", ac, @"autoCancel", nil];
}

/**
 * Erstellt die Notification und setzt deren Eigenschaften.
 */
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options
{
    UILocalNotification* notification = [[UILocalNotification alloc] init];

    double    timestamp = [[options objectForKey:@"date"] doubleValue];
    NSString* msg       = [options objectForKey:@"message"];
    NSString* title     = [options objectForKey:@"title"];
    NSString* sound     = [options objectForKey:@"sound"];
    NSString* repeat    = [options objectForKey:@"repeat"];
    NSInteger badge     = [[options objectForKey:@"badge"] intValue];

    notification.fireDate       = [NSDate dateWithTimeIntervalSince1970:timestamp];
    notification.timeZone       = [NSTimeZone defaultTimeZone];
    notification.repeatInterval = [[[self repeatDict] objectForKey: repeat] intValue];
    notification.userInfo       = [self userDict:options];

    notification.applicationIconBadgeNumber = badge;


    if (![self strIsNullOrEmpty:msg])
    {
        if (![self strIsNullOrEmpty:title])
        {
            notification.alertBody = [NSString stringWithFormat:@"%@\n%@", title, msg];
        }
        else
        {
            notification.alertBody = msg;
        }
    }

    if (sound != (NSString*)[NSNull null])
    {
        if ([sound isEqualToString:@""]) {
            notification.soundName = UILocalNotificationDefaultSoundName;
        }
        else
        {
            notification.soundName = sound;
        }
    }

    return notification;
}

/**
 * Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist.
 */
- (void) didReceiveLocalNotification:(NSNotification*)localNotification
{
    UIApplicationState state          = [[UIApplication sharedApplication] applicationState];
    bool isActive                     = state == UIApplicationStateActive;

    UILocalNotification* notification = [localNotification object];
    NSString* id                      = [notification.userInfo objectForKey:@"id"];
    NSString* callbackType            = isActive ? @"foreground" : @"background";
    NSString* callbackFn              = [notification.userInfo objectForKey:callbackType];
    BOOL autoCancel                   = [[notification.userInfo objectForKey:@"autoCancel"] boolValue];

    if (autoCancel && !isActive)
    {
        [self cancelNotificationWithId:id];
    }

    if (![self strIsNullOrEmpty:callbackFn])
    {
        NSString* js = [NSString stringWithFormat:@"setTimeout('%@(%@)',0)", callbackFn, id];

        [self writeJavascript:js];
    }
}

/**
 * Registriert den Observer für LocalNotification Events.
 */
- (void) pluginInitialize
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:) name:CDVLocalNotification object:nil];
}

/**
 * Hilfsmethode gibt an, ob er String NULL oder Empty ist.
 */
- (BOOL) strIsNullOrEmpty:(NSString*)str
{
    return (str == (NSString*)[NSNull null] || [str isEqualToString:@""]) ? YES : NO;
}

@end
