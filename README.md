Cordova LocalNotification-Plugin
==================================

A bunch of local notification plugins for Cordova 3.x.x

by Sebastián Katzer ([github.com/katzer](https://github.com/katzer))

## Supported Platforms
- **iOS**<br>
See [Local and Push Notification Programming Guide](http://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/WhatAreRemoteNotif.html) for detailed informations and screenshots.

- **Android** *(SDK >=11)*<br>
See [Notification Guide](http://developer.android.com/guide/topics/ui/notifiers/notifications.html) for detailed informations and screenshots.

- **WP8**<br>
See [Local notifications for Windows Phone](http://msdn.microsoft.com/en-us/library/windowsphone/develop/jj207047.aspx) for detailed informations and screenshots.
<br>*Windows Phone 8.0 has no notification center. Instead local notifications are realized through live tiles updates.*


## Dependencies
Cordova will check all dependencies and install them if they are missing.
- [org.apache.cordova.device](https://github.com/apache/cordova-plugin-device) *(since v0.6.0)*


## Adding the Plugin to your project
Through the [Command-line Interface](http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface):
```bash
# from master:
cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
cordova build

# stable version:
cordova plugin add de.appplant.cordova.plugin.local-notification
cordova build
```

## Removing the Plugin from your project
Through the [Command-line Interface](http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface):
```
cordova plugin rm de.appplant.cordova.plugin.local-notification
```

## PhoneGap Build
Add the following xml to your config.xml to always use the latest version of this plugin:
```
<gap:plugin name="de.appplant.cordova.plugin.local-notification" />
```
or to use this exact version:
```
<gap:plugin name="de.appplant.cordova.plugin.local-notification" version="0.7.0" />
```
More informations can be found [here](https://build.phonegap.com/plugins/413).

## Release Notes
#### Version 0.7.3 (not yet released)
- [bugfix:] cancel callbacks have not been fired after all notifications have been canceled on iOS.
- [change:] The `oncancel` callback will be called at last if `autoCancel` is set to true (iOS).
- [bugfix:] Callbacks for non-repeating notifications were not called if they were not created in the current app instance on iOS.
- [enhancement:] Added 'secondly' and 'minutely' as new repeat time aliases.
- [bugfix:] `sound:null` didnt work for Android. The default sound was played.
- [feature:] New interface `isScheduled` to check wether a notification with an ID is pending.
- [feature:] New interface `getScheduledIds` to retrieve a list with all currently pending notifications.

#### Version 0.7.2 (09.02.2014)
- [enhancement:] Avoid blocking the main thread (on Android) **(dpogue)**.
- [bugfix:] `onadd` was called each time after a repeating message was triggered (Android)
- [change:] Reset badge with cancelAll.
- [bugfix:] `onclick` instead of `ontrigger` was called on "slow" iOS devices.

#### Version 0.7.1 (31.01.2014)
- [bugfix:] `ongoing` attribute was ignored.
- [bugfix:] `oncancel` wasnt fired if `autoCancel` was set to true.
- [bugfix:] App throwed an error at restart if a callback was registered.

#### Version 0.7.0 (22.01.2014)
**Note:** The new way of callback registration will be not compatible with previous versions! See #62
- **[feature:]** Added new callback registration interface and new callback types.
- [feature:] Added the ability to override notifications default properties.
- [bugfix:] Fixed build failure if iOS/MacOS/Xcode were to old (#68).
- **[change]** The message and not the title will be used as the ticker text.

#### Version 0.7.0beta1 (17.01.2014)
- [bugfix:] App throws an error on iOS if `message` is null.
- [bugfix:] Removed extra line break on iOS if `title` is null or empty.
- [bugfix:] Notification on iOS will be canceled if a new one with the same ID was added.
- [feature:] Added `autoCancel` flag.
- [bugfix:] `cancel` on iOS did not work.
- [enhancement:] Added 'hourly' as a new repeat time aliase.
- [enhancement:] Repeat with custom intervals on Android.
- **[change:]** Callbacks are called with the ID as a number and not as a string.
- [enhancement:] The background callback on Android is called, even the app is not running when the notification is tapped.
- [enhancement:] Notifications are repeated more precisely.
- [feature:] Added `json` property to pass custom data through the notification.
- [enhancement:] Added Android specific property `smallImage`.
- [enhancement:] Added Android specific property `ongoing`.
- [enhancement:] Setting launchMode to *singleInstance* isn't necessary anymore.

#### Version 0.6.3 (12.12.2013)
- [bugfix:] Black screen on Android.
- [bugfix:] App throws an error on reboot on Android.
- [enhancement:] Calling `cancel` on Android with an invalid String as ID does not throw an error anymore.

#### Version 0.6.2 (04.12.2013)
- Release under the Apache 2.0 license.

#### Version 0.6.1 (04.12.2013)
- Release under the LGPL 2.1 license.
- [feature:] Sound can be specified on Android.
- [enhancement:] Adding notifications on Android does not block the ui thread anymore.
- [bugfix:] The app did stop/crash after removing them from recent apps list.
- [enhancement:] Adding notifications on iOS does not block the ui thread anymore.
- [bugfix:] Added missing `RECEIVE_BOOT_COMPLETED`permission on Android.
- [enhancement:] Rework the code for Android. Thanks to ***samsara (samsarayg)***.
- [bugfix:] `cancel` on iOS did not work do to wrong param type.
- [enhancement:] `cancel` & `cancelAll` remove the notification(s) from notification center as well on Android.
- [bugfix:] Missing background callback on Android.
- [bugfix:] Android notification is not shown when the app is not running.

#### Version 0.6.0 (16.11.2013)
- Added WP8 support<br>
  *Based on the LiveTiles WP8 plugin made by* ***Jesse MacFadyen (purplecabbage)***
- [enhancement:] The `add()` function now returns the id of the created notification.
- [feature:] Added new `title` property.
- [bugfix:] `cancel` on iOS did not work do to wrong dict key.
- [enhancement:] All notifications on Android display the app icon by default.
- [feature:] Icon can be specified on Android.

#### Version 0.4.0 (06.10.2013)
- Added Android support<br>
  *Based on the LocalNotifications Android plugin made by* ***Daniël (dvtoever)***

#### Version 0.2.0 (11.08.2013)
- Added iOS support<br>
  *Based on the LocalNotifications iOS plugin made by* ***Rodrigo Moyle***


## Using the plugin
The plugin creates the object ```window.plugin.notification.local``` with the following methods:

### add()
The method allows to add a custom notification. It takes an hash as an argument to specify the notification's properties and returns the ID for the notification.<br>
All properties are optional. If no date object is given, the notification will pop-up immediately.

```javascript
window.plugin.notification.local.add({
    id:         String,  // A unique id of the notifiction
    date:       Date,    // This expects a date object
    message:    String,  // The message that is displayed
    title:      String,  // The title of the message
    repeat:     String,  // Has the options of 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly', 'yearly'
    badge:      Number,  // Displays number badge to notification
    sound:      String,  // A sound to be played
    json:       String,  // Data to be passed through the notification
    autoCancel: Boolean, // Setting this flag and the notification is automatically canceled when the user clicks it
    ongoing:    Boolean, // Prevent clearing of notification (Android only)
});
```
**Note:** On Android the notification id needs to be a string which can be converted to a number. If the ID has an invalid format, it will be ignored, but canceling the notification will fail.

### cancel()
The method cancels a notification which was previously added. It takes the ID of the notification as an argument.
```javascript
window.plugin.notification.local.cancel(String);
```

### cancelAll()
The method cancels all notifications which were previously added by the application.
```javascript
window.plugin.notification.local.cancelAll();
```

### onadd() | ontrigger() | onclick() | oncancel()
There are 4 different callback types available. For each of them one listener can be specified. The listener has to be a function and takes the following arguments:
 - event: The Name of the event
 - id: The ID of the notification
 - json:  A custom (JSON) string

```javascript
window.plugin.notification.local.on_callback_ = function (id, state, json) {};
```
**Note:** The *ontrigger* callback is only invoked in background if the app is not suspended!

### isScheduled()
Checks wether a notification with an ID is scheduled. It takes the ID as an argument and a callback function to be called with the result.
```javascript
window.plugin.notification.local.isScheduled(id, function (isScheduled) {

});
```

### getScheduledIds()
Checks wether a notification with an ID is scheduled. It takes a callback function to be called with the result as an array.
```javascript
window.plugin.notification.local.getScheduledIds(function (pendingIds) {

});
```

### getDefaults()
Gives an overview about all available notification properties for the platform and their default values. The function returns an object.
```javascript
window.plugin.notification.local.getDefaults();
```

### setDefaults ()
Overrides the default properties. The function takes an object as argument.
```javascript
window.plugin.notification.local.setDefaults(Object);
```


## Examples
#### Will fire every week on this day, 60 seconds from now
```javascript
var now                  = new Date().getTime(),
    _60_seconds_from_now = new Date(now + 60*1000);

window.plugin.notification.local.add({
    id:      1, // is converted to a string
    title:   'Reminder',
    message: 'Dont forget to buy some flowers.',
    repeat:  'weekly',
    date:    _60_seconds_from_now
});
```

#### Pop's up immediately
```javascript
window.plugin.notification.local.add({ message: 'Great app!' });
```

#### Plays no sound if the notification pop's up
```javascript
window.plugin.notification.local.add({ sound: null });
```

#### Callback registration
```javascript
window.plugin.notification.local.onadd = function (id, state, json) {};
```

#### Pass data through the notification
```javascript
window.plugin.notification.local.add({
    id:         1,
    message:    'I love BlackBerry!',
    json:       JSON.stringify({ test: 123 })
});

window.plugin.notification.local.onclick = function (id, state, json) {
    console.log(id, JSON.parse(json).test);
}
```

### Change the default value for autoCancel
```javascript
window.plugin.notification.local.setDefaults({ autoCancel: true });
```


## Platform specifics
### Small and large icons on Android
By default all notifications will display the app icon. But an specific icon can be defined through the `icon` and `smallIcon` properties.
```javascript
/**
 * Displays the <package.name>.R.drawable.ic_launcher icon
 */
window.plugin.notification.local.add({ icon: 'ic_launcher' });

/**
 * Displays the android.R.drawable.ic_dialog_email icon
 */
window.plugin.notification.local.add({ smallIcon: 'ic_dialog_email' });
```

### Notification sound on Android
The sound must be a absolute or relative Uri pointing to the sound file. The default sound is `RingtoneManager.TYPE_NOTIFICATION`.
```javascript
/**
 * Plays the `beep.mp3` which has to be located in the res folder
 */
window.plugin.notification.local.add({ sound: 'android.resource://' + package_name + '/raw/beep' });

/**
 * Plays a remote sound
 */
window.plugin.notification.local.add({ sound: 'http://remotedomain/beep.mp3' });

/**
 * Plays a sound file which has to be located in the android_assets folder
 */
window.plugin.notification.local.add({ sound: '/www/audio/beep.mp3' });

/**
 * Plays the `RingtoneManager.TYPE_ALARM` sound
 */
window.plugin.notification.local.add({ sound: 'TYPE_ALARM' });
```
**Note:** Local sound files must be placed into the res-folder and not into the assets-folder.

### Notification sound on iOS
You can package the audio data in an *aiff*, *wav*, or *caf* file. Then, in Xcode, add the sound file to your project as a nonlocalized resource of the application bundle. You may use the *afconvert* tool to convert sounds.
```javascript
/**
 * Plays the `beep.mp3` which has to be located in the root folder of the project
 */
window.plugin.notification.local.add({ sound: 'beep.caf' });

/**
 * Plays the `beep.mp3` which has to be located in the www folder
 */
window.plugin.notification.local.add({ sound: 'www/sounds/beep.caf' });
```
**Note:** The right to play notification sounds in the notification center settings has to be granted.<br>
**Note:** Custom sounds must be under 30 seconds when played. If a custom sound is over that limit, the default system sound is played instead.

### LiveTile background images on WP8
LiveTile's have the ability to display images for different sizes. These images can be defined through the `smallImage`, `image` and `wideImage` properties.<br>
An image must be defined as a relative or absolute URI.
```javascript
/**
 * Displays the application icon as the livetile's background image
 */
window.plugin.notification.local.add({ image: 'appdata:ApplicationIcon.png' })
```
All images can be restored to the default ones by canceling the notification.

### Custom repeating interval on Android
To specify a custom interval, the `repeat` property can be assigned with an number in minutes.
```javascript
/**
 * Schedules the notification quarterly every 15 mins
 */
window.plugin.notification.local.add({ repeat: 15 });
```


## Quirks
### No sound is played on iOS 7
The right to play notification sounds in the notification center settings has to be granted.

### Adding a notification on WP8
An application can only display one notification at a time. Each time a new notification has to be added, the application live tile's data will be overwritten by the new ones.

### TypeError: Cannot read property 'currentVersion' of null
Along with Cordova 3.2 and Windows Phone 8 the `version.bat` script has to be renamed to `version`.

On Mac or Linux
```
mv platforms/wp8/cordova/version.bat platforms/wp8/cordova/version
```
On Windows
```
ren platforms\wp8\cordova\version.bat platforms\wp8\cordova\version
```

### Black screen (or app restarts) on Android after a notification was clicked
The launch mode for the main activity has to be set to `singleInstance`
```xml
<activity ... android:launchMode="singleInstance" ... />
```


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License](http://opensource.org/licenses/Apache-2.0).
