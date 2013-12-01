/**
 *  Cordova LocalNotification Plugin
 *
 *  Created by Sebastian Katzer (github.com/katzer).
 *  Copyright 2013 Sebastian Katzer. All rights reserved.
 *  LGPL v2.1 licensed
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
