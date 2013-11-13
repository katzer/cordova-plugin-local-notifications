/**
 *  APPLocalNotification.m
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 10/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

#import "APPLocalNotification.h"


@interface APPLocalNotification (Private)

- (NSMutableDictionary*) repeatDict;
- (NSDictionary*) userDict:(NSMutableDictionary*)options;
- (UILocalNotification*) prepareNotification:(NSMutableDictionary*)options;
- (void) didReceiveLocalNotification:(NSNotification *)localNotification;

@end


@implementation APPLocalNotification

/**
 * Fügt eine neue Notification-Eintrag hinzu.
 *
 * @param {NSMutableDictionary} options
 */
- (void) add:(CDVInvokedUrlCommand*)command
{
	NSArray             *arguments    = [command arguments];
	NSMutableDictionary *options      = [arguments objectAtIndex:0];
	UILocalNotification *notification = [self prepareNotification:options];

    notification.userInfo = [self userDict:options];

	[[UIApplication sharedApplication] scheduleLocalNotification:notification];
}

/**
 * Entfernt den anhand der ID angegebenen Eintrag.
 *
 * @param {NSString} id Die ID der Notification
 */
- (void) cancel:(CDVInvokedUrlCommand*)command
{
	NSArray  *arguments      = [command arguments];
	NSString *notificationId = [arguments objectAtIndex:0];
	NSArray  *notifications  = [[UIApplication sharedApplication] scheduledLocalNotifications];

	for (UILocalNotification *notification in notifications)
    {
		NSString *id = [notification.userInfo objectForKey:@"id"];

		if ([notificationId isEqualToString:id])
        {
			[[UIApplication sharedApplication] cancelLocalNotification:notification];
		}
	}
}

/**
 * Entfernt alle registrierten Einträge.
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command
{
	[[UIApplication sharedApplication] cancelAllLocalNotifications];
}

/**
 * @private
 */
- (NSMutableDictionary*) repeatDict
{
	NSMutableDictionary *repeatDict = [[NSMutableDictionary alloc] init];

    [repeatDict setObject:[NSNumber numberWithInt:NSDayCalendarUnit]   forKey:@"daily"];
    [repeatDict setObject:[NSNumber numberWithInt:NSWeekCalendarUnit]  forKey:@"weekly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSMonthCalendarUnit] forKey:@"monthly"];
    [repeatDict setObject:[NSNumber numberWithInt:NSYearCalendarUnit]  forKey:@"yearly"];
    [repeatDict setObject:[NSNumber numberWithInt:0]                   forKey:@""];

    return repeatDict;
}

/**
 * @private
 */
- (NSDictionary*) userDict:(NSMutableDictionary*)options
{
	NSString* id = [options objectForKey:@"id"];
    NSString* bg = [options objectForKey:@"background"];
    NSString* fg = [options objectForKey:@"foreground"];

	return [NSDictionary dictionaryWithObjectsAndKeys:id, @"id", bg, @"background", fg, @"foreground", nil];
}

/**
 * @private
 */
- (UILocalNotification*) prepareNotification:(NSMutableDictionary*)options
{
	double               timestamp          = [[options objectForKey:@"date"] doubleValue];
	NSString*            msg                = [options objectForKey:@"message"];
	NSString*            title              = [options objectForKey:@"title"];
	NSString*            sound              = [options objectForKey:@"sound"];
	NSString*            repeat             = [options objectForKey:@"repeat"];
	NSInteger            badge              = [[options objectForKey:@"badge"] intValue];

	NSDate*              date               = [NSDate dateWithTimeIntervalSince1970:timestamp];
	UILocalNotification* notification       = [[UILocalNotification alloc] init];

	notification.fireDate                   = date;
	notification.timeZone                   = [NSTimeZone defaultTimeZone];
	notification.repeatInterval             = [[[self repeatDict] objectForKey: repeat] intValue];
	notification.alertBody                  = title ? [NSString stringWithFormat:@"%@\n%@", title, msg] : msg;
	notification.soundName                  = sound;
	notification.applicationIconBadgeNumber = badge;

    return notification;
}

/**
 * @private
 * Ruft die JS-Callbacks auf, nachdem eine Notification eingegangen ist.
 */
- (void) didReceiveLocalNotification:(NSNotification *)localNotification
{
    UILocalNotification* notification = [localNotification object];
    UIApplicationState   state        = [[UIApplication sharedApplication] applicationState];
    bool                 isActive     = state == UIApplicationStateActive;

    NSString* id         = [notification.userInfo objectForKey:@"id"];
    NSString* callbackFn = [notification.userInfo objectForKey:isActive ? @"foreground" : @"background"];

    if (callbackFn.length > 0)
    {
        NSString* jsCallBack = [NSString stringWithFormat:@"%@(%@)", callbackFn, id];

        [self writeJavascript:jsCallBack];
    }
}

/**
 * @private
 * Registriert den Observer für LocalNotification Events.
 */
- (void) pluginInitialize
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:) name:CDVLocalNotification object:nil];
}

@end
