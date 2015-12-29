/*
 * AppDelegate+APPLocalNotificationAction.m
 *
 * Created by Elli Rego on 10/28/15.
 *
 */

 #import "AppDelegate+APPLocalNotificationAction.h"

 @implementation AppDelegate (APPLocalNotificationAction)

/**
 * Handle notification actions for iOS < 9.
 */
 - (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification completionHandler:(void(^)())completionHandler  
 {
    [self application:[UIApplication sharedApplication]
        handleActionWithIdentifier:identifier
        forLocalNotification:notification
        withResponseInfo:nil
        completionHandler:(void (^)())completionHandler];
 }

/**
 * Handle notification actions with optional response info for iOS >= 9.
 */
 - (void) application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)())completionHandler   
{   
    NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:
						    	notification, @"localNotification", 
						    	responseInfo, @"responseInfo", 
						    	nil];
    [[NSNotificationCenter defaultCenter] 
    	postNotificationName:@"SendActionIdentifier" 
    		object:identifier 
    		userInfo:userInfo];
  
    completionHandler();   
}  

 @end
