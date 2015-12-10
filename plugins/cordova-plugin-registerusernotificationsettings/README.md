
[![npm version](https://badge.fury.io/js/cordova-common-registerusernotificationsettings.svg)](http://badge.fury.io/js/cordova-plugin-registerusernotificationsettings)
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L3HKQCD9UA35A "Donate once-off to this project using Paypal")

Cordova RegisterUserNotificationSettings Plugin
===============================================

Implements didRegisterUserNotificationSettings and broadcasts the event for listening plugins.

```obj-c
#import "AppDelegate+APPRegisterUserNotificationSettings.h"

- (void) pluginInitialize
{
    NSNotificationCenter* center = [NSNotificationCenter
                                    defaultCenter];

    [center addObserver:self
               selector:@selector(didRegisterUserNotificationSettings:)
                   name:UIApplicationRegisterUserNotificationSettings
                 object:nil];
}

- (void) didRegisterUserNotificationSettings:(UIUserNotificationSettings*)settings
{
    ...  
}
```
