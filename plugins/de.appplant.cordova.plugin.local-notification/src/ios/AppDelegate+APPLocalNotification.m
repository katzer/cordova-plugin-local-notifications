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

#import "AppDelegate+APPLocalNotification.h"

#import <Availability.h>

NSString* const UIApplicationRegisterUserNotificationSettings = @"UIApplicationRegisterUserNotificationSettings";

@implementation AppDelegate (APPLocalNotification)

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 80000
/**
 * Tells the delegate what types of notifications may be used
 * to get the user’s attention.
 */
- (void)                    application:(UIApplication*)application
    didRegisterUserNotificationSettings:(UIUserNotificationSettings*)settings
{
    NSNotificationCenter* center = [NSNotificationCenter
                                    defaultCenter];

    // re-post (broadcast)
    [center postNotificationName:UIApplicationRegisterUserNotificationSettings
                          object:settings];
}
#endif

@end
