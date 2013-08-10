/**
 *  APPLocalNotification.m
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 10/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

 #import "APPLocalNotification.h"


@implementation APPLocalNotification

/**
 * Fügt eine neue Notification-Eintrag hinzu.
 *
 * @param {NSMutableDictionary} options
 */
- (void) add:(CDVInvokedUrlCommand*)command {
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
- (void) cancel:(CDVInvokedUrlCommand*)command {
	NSArray  *arguments      = [command arguments];
	NSString *notificationId = [arguments objectAtIndex:0];
	NSArray  *notifications  = [[UIApplication sharedApplication] scheduledLocalNotifications];

	for (UILocalNotification *notification in notifications) {
		NSString *notId = [notification.userInfo objectForKey:@"notificationId"];

		if ([notificationId isEqualToString:notId]) {
			[[UIApplication sharedApplication] cancelLocalNotification:notification];
		}
	}
}

/**
 * Entfernt alle registrierten Einträge.
 */
- (void) cancelAll:(CDVInvokedUrlCommand*)command {
	[[UIApplication sharedApplication] cancelAllLocalNotifications];
}

/**
 * @private
 */
- (NSMutableDictionary*) repeatDict {
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
- (NSMutableDictionary*) userDict:(NSMutableDictionary*)options {
	NSString     *notificationId = [options objectForKey:@"id"];
    NSString     *bg             = [options objectForKey:@"background"];
    NSString     *fg             = [options objectForKey:@"foreground"];

	NSDictionary *userDict       = [NSDictionary dictionaryWithObjectsAndKeys:notificationId, @"notificationId", bg, @"background", fg, @"foreground", nil];

	return userDict;
}

/**
 * @private
 */
- (UILocalNotification*) prepareNotification:(NSMutableDictionary*)options {
	double               timestamp          = [[options objectForKey:@"date"] doubleValue];
	NSString*            msg                = [options objectForKey:@"message"];
	NSString*            action             = [options objectForKey:@"action"];
    NSString*            sound              = [options objectForKey:@"sound"];
    NSString*            repeat             = [options objectForKey:@"repeat"];
	NSInteger            badge              = [[options objectForKey:@"badge"] intValue];
	bool                 hasAction          = ([[options objectForKey:@"hasAction"] intValue] == 1) ? YES : NO;

	NSDate*              date               = [NSDate dateWithTimeIntervalSince1970:timestamp];
	UILocalNotification* notification       = [[UILocalNotification alloc] init];

	notification.fireDate                   = date;
	notification.hasAction                  = hasAction;
	notification.timeZone                   = [NSTimeZone defaultTimeZone];
    notification.repeatInterval             = [[[self repeatDict] objectForKey: repeat] intValue];
	notification.alertBody                  = ([msg isEqualToString:@""])?nil:msg;
	notification.alertAction                = action;
    notification.soundName                  = sound;
    notification.applicationIconBadgeNumber = badge;

    return notification;
}

@end