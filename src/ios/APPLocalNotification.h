/**
 *  APPLocalNotification.h
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer) on 10/08/2013.
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  GPL v2 licensed
 */

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface APPLocalNotification : CDVPlugin {

}

// Fügt einen neuen Eintrag hinzu
- (void) add:(CDVInvokedUrlCommand*)command;
// Entfernt den anhand der ID angegebenen Eintrag
- (void) cancel:(CDVInvokedUrlCommand*)command;
// Entfernt alle registrierten Einträge
- (void) cancelAll:(CDVInvokedUrlCommand*)command;

@end
