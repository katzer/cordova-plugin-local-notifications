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

#import "APPLocalNotification.h"

@interface APPLocalNotification (Private)

// Archiviert die Meldungen, sodass sie später abgerufen werden kann
- (void) archiveNotification:(UILocalNotification*)notification;
// Entfernt den zur ID passenden Eintrag
- (void) cancelNotificationWithId:(NSString*)id fireEvent:(BOOL)fireEvent;
// Nachschlagewerk für Zeitintervallangaben
- (NSMutableDictionary*) repeatDict;
// Alle zusätzlichen Metadaten der Notification als Hash
- (NSDictionary*) userDict:(NSMutableDictionary*)options;
// Erstellt die Notification und setzt deren Eigenschaften
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options;
// Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist
- (void) didReceiveLocalNotification:(NSNotification*)localNotification;
// Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist
- (void) didFinishLaunchingWithOptions:(NSNotification*)notification;
// Hilfsmethode gibt an, ob er String NULL oder Empty ist
- (BOOL) strIsNullOrEmpty:(NSString*)str;
// Fires the given event
- (void) fireEvent:(NSString*) event id:(NSString*) id json:(NSString*) json;

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
        NSString* id                      = [notification.userInfo objectForKey:@"id"];
        NSString* json                    = [notification.userInfo objectForKey:@"json"];

        [self cancelNotificationWithId:id fireEvent:NO];
        [self archiveNotification:notification];

        [self fireEvent:@"add" id:id json:json];

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
        NSArray* arguments = [command arguments];
        NSString* id       = [arguments objectAtIndex:0];

        [self cancelNotificationWithId:id fireEvent:YES];
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
                [self cancelNotificationWithId:key fireEvent:YES];
            }
        }

        [[NSUserDefaults standardUserDefaults] synchronize];

        [[UIApplication sharedApplication] cancelAllLocalNotifications];
        [[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
    }];
}

/**
 * Checks wether a notification with an ID is scheduled.
*/
- (void) isScheduled:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult* result;
        NSArray* arguments = [command arguments];
        NSString* id       = [arguments objectAtIndex:0];
        NSString* key      = [kAPP_LOCALNOTIFICATION stringByAppendingString:id];
        NSData* data       = [[NSUserDefaults standardUserDefaults] objectForKey:key];
        bool isScheduled   = data != NULL;

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsBool:isScheduled];

        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

/**
 * Retrieves a list with all currently pending notifications.
 */
- (void) getScheduledIds:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSMutableArray* scheduledIds = [[NSMutableArray alloc] init];
        NSDictionary* entries        = [[NSUserDefaults standardUserDefaults] dictionaryRepresentation];
        CDVPluginResult* result;

        for (NSString* key in [entries allKeys])
        {
            if ([key hasPrefix:kAPP_LOCALNOTIFICATION])
            {
                NSString* id = [key stringByReplacingOccurrencesOfString:kAPP_LOCALNOTIFICATION withString:@""];

                [scheduledIds addObject:id];
            }
        }

        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                    messageAsArray:scheduledIds];

        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

/**
 * Entfernt den zur ID passenden Eintrag.
 *
 * @param {NSString} id Die ID der Notification
 */
- (void) cancelNotificationWithId:(NSString*)id fireEvent:(BOOL)fireEvent
{
    if (![self strIsNullOrEmpty:id])
    {
        NSString* key = ([id hasPrefix:kAPP_LOCALNOTIFICATION])
        ? id
        : [kAPP_LOCALNOTIFICATION stringByAppendingString:id];

        NSData* data  = [[NSUserDefaults standardUserDefaults] objectForKey:key];

        if (data)
        {
            UILocalNotification* notification = [NSKeyedUnarchiver unarchiveObjectWithData:data];

            [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
            [[UIApplication sharedApplication] cancelLocalNotification:notification];

            if (fireEvent)
            {
                NSString* json = [notification.userInfo objectForKey:@"json"];

                [self fireEvent:@"cancel" id:id json:json];
            }
        }
    }
}

/**
 * Entfernt alle Meldungen, die älter als x Sekunden sind.
 *
 * @param {float} seconds
 */
- (void) cancelAllNotificationsWhichAreOlderThen:(float)seconds
{
    NSDictionary* entries = [[NSUserDefaults standardUserDefaults] dictionaryRepresentation];
    NSDate* now           = [NSDate date];

    for (NSString* key in [entries allKeys])
    {
        if ([key hasPrefix:kAPP_LOCALNOTIFICATION])
        {
            NSData* data = [[NSUserDefaults standardUserDefaults] objectForKey:key];

            if (data)
            {
                UILocalNotification* notification = [NSKeyedUnarchiver unarchiveObjectWithData:data];

                NSTimeInterval fireDateDistance   = [now timeIntervalSinceDate:notification.fireDate];
                NSString* id                      = [notification.userInfo objectForKey:@"id"];

                if (notification.repeatInterval == NSEraCalendarUnit && fireDateDistance > seconds) {
                    [self cancelNotificationWithId:id fireEvent:YES];
                }
            }
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

#ifdef NSCalendarUnitHour
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitSecond] forKey:@"secondly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitMinute] forKey:@"minutely"];
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitHour]   forKey:@"hourly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitDay]    forKey:@"daily"];
    [repeatDict setObject:[NSNumber numberWithInt:NSWeekCalendarUnit]   forKey:@"weekly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitMonth]  forKey:@"monthly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSCalendarUnitYear]   forKey:@"yearly"];
#else
    [repeatDict setObject:[NSNumber numberWithInt:NSSecondCalendarUnit] forKey:@"secondly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSMinuteCalendarUnit] forKey:@"minutely"];
    [repeatDict setObject:[NSNumber numberWithInt:NSHourCalendarUnit]   forKey:@"hourly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSDayCalendarUnit]    forKey:@"daily"];
    [repeatDict setObject:[NSNumber numberWithInt:NSWeekCalendarUnit]   forKey:@"weekly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSMonthCalendarUnit]  forKey:@"monthly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSYearCalendarUnit]   forKey:@"yearly"];
#endif

    [repeatDict setObject:[NSNumber numberWithInt:NSEraCalendarUnit]    forKey:@""];

    return repeatDict;
}

/**
 * Alle zusätzlichen Metadaten der Notification als Hash.
 */
- (NSDictionary*) userDict:(NSMutableDictionary*)options
{
    NSString* id = [options objectForKey:@"id"];
    NSString* ac = [options objectForKey:@"autoCancel"];
    NSString* js = [options objectForKey:@"json"];

    return [NSDictionary dictionaryWithObjectsAndKeys:
            id, @"id", ac, @"autoCancel", js, @"json", nil];
}

/**
 * Erstellt die Notification und setzt deren Eigenschaften.
 */
- (UILocalNotification*) notificationWithProperties:(NSMutableDictionary*)options
{
    UILocalNotification* notification = [[UILocalNotification alloc] init];

    double timestamp = [[options objectForKey:@"date"] doubleValue];
    NSString* msg    = [options objectForKey:@"message"];
    NSString* title  = [options objectForKey:@"title"];
    NSString* sound  = [options objectForKey:@"sound"];
    NSString* repeat = [options objectForKey:@"repeat"];
    NSInteger badge  = [[options objectForKey:@"badge"] intValue];

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
    NSString* json                    = [notification.userInfo objectForKey:@"json"];
    BOOL autoCancel                   = [[notification.userInfo objectForKey:@"autoCancel"] boolValue];

    NSDate* now                       = [NSDate date];
    NSTimeInterval fireDateDistance   = [now timeIntervalSinceDate:notification.fireDate];
    NSString* event                   = (fireDateDistance < 0.05) ? @"trigger" : @"click";

    [self fireEvent:event id:id json:json];

    if (autoCancel && !isActive)
    {
        [self cancelNotificationWithId:id fireEvent:YES];
    }
}

/**
 * Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist.
 */
- (void) didFinishLaunchingWithOptions:(NSNotification*)notification
{
    NSDictionary* launchOptions            = [notification userInfo];
    UILocalNotification *localNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey];

    if (localNotification)
    {
        [self didReceiveLocalNotification:[NSNotification notificationWithName:CDVLocalNotification object:localNotification]];
    }
}

/**
 * Registriert den Observer für LocalNotification Events.
 */
- (void) pluginInitialize
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:)
                                                 name:CDVLocalNotification object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didFinishLaunchingWithOptions:)
                                                 name:UIApplicationDidFinishLaunchingNotification object:nil];
}

/**
 * Löscht alle single-repeat Notifications, die älter als 5 Tage sind.
 */
- (void) onAppTerminate
{
    [self cancelAllNotificationsWhichAreOlderThen:432000];
}

/**
 * Hilfsmethode gibt an, ob er String NULL oder Empty ist.
 */
- (BOOL) strIsNullOrEmpty:(NSString*)str
{
    return (str == (NSString*)[NSNull null] || [str isEqualToString:@""]) ? YES : NO;
}

/**
 * Fires the given event.
 *
 * @param {String} event The Name of the event
 * @param {String} id    The ID of the notification
 * @param {String} json  A custom (JSON) string
 */
- (void) fireEvent:(NSString*)event id:(NSString*)id json:(NSString*)json
{
    UIApplicationState state = [[UIApplication sharedApplication] applicationState];
    bool isActive            = state == UIApplicationStateActive;
    NSString* stateName      = isActive ? @"foreground" : @"background";

    NSString* params = [NSString stringWithFormat:@"\"%@\",\"%@\",\\'%@\\'", id, stateName, json];
    NSString* js     = [NSString stringWithFormat:@"setTimeout('plugin.notification.local.on%@(%@)',0)", event, params];

    [self.commandDelegate evalJs:js];
}

@end
