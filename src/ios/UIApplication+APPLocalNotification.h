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

@interface UIApplication (APPLocalNotification)

@property (readonly, getter=triggeredLocalNotifications) NSArray* triggeredLocalNotifications;
@property (readonly, getter=triggeredLocalNotificationIds) NSArray* triggeredLocalNotificationIds;
@property (readonly, getter=scheduledLocalNotificationIds) NSArray* scheduledLocalNotificationIds;

// If the app has the permission to schedule local notifications
- (BOOL) hasPermissionToScheduleLocalNotifications;
// Ask for permission to schedule local notifications
- (void) registerPermissionToScheduleLocalNotifications;
// Get the scheduled local notification by ID
- (UILocalNotification*) scheduledLocalNotificationWithId:(NSString*)id;
// Get the triggered local notification by ID
- (UILocalNotification*) triggeredLocalNotificationWithId:(NSString*)id;

@end
