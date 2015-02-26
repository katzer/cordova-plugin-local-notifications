
<p align="right">
    <a href="https://github.com/katzer/cordova-plugin-local-notifications/tree/example">EXAMPLE :point_right:</a>
</p>

Cordova Local-Notification Plugin
==================================

The essential purpose of local notifications is to enable an application to inform its users that it has something for them — for example, a message or an upcoming appointment — when the application isn’t running in the foreground.<br>
They are scheduled by an application and delivered on the same device.

### How they appear to the user
Users see notifications in the following ways:
- Displaying an alert or banner
- Badging the app’s icon
- Playing a sound

### Examples of Notification Usage
Local notifications are ideally suited for applications with time-based behaviors, such as calendar and to-do list applications. Applications that run in the background for the limited period allowed by iOS might also find local notifications useful.<br>
For example, applications that depend on servers for messages or data can poll their servers for incoming items while running in the background; if a message is ready to view or an update is ready to download, they can then present a local notification immediately to inform their users.

### Plugin's Purpose
The purpose of the plugin is to create a platform-independent javascript interface for [Cordova][cordova]-based mobile applications to access the specific API on each platform.


## Supported Platforms
- **iOS** _(up to iOS8)_<br>
See [Local and Push Notification Programming Guide][ios_notification_guide] for detailed information and screenshots.

- **Android** *(SDK >=7)*<br>
See [Notification Guide][android_notification_guide] for detailed information and screenshots.

- **WP8**<br>
See [Local notifications for Windows Phone][wp8_notification_guide] for detailed information and screenshots.
<br>*Windows Phone 8.0 has no notification center. Instead local notifications are realized through live tiles updates.*


## Dependencies
[Cordova][cordova] will check all dependencies and install them if they are missing.
- [org.apache.cordova.device][apache_device_plugin] *(since v0.6.0)*


## Installation
The plugin can either be installed into the local development environment or cloud based through [PhoneGap Build][PGB].

### Adding the Plugin to your project
Through the [Command-line Interface][CLI]:
```bash
# ~~ from master ~~
cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git && cordova prepare
```
or to use the last stable version:
```bash
# ~~ stable version ~~
cordova plugin add de.appplant.cordova.plugin.local-notification && cordova prepare
```

### Removing the Plugin from your project
Through the [Command-line Interface][CLI]:
```bash
cordova plugin rm de.appplant.cordova.plugin.local-notification
```

### PhoneGap Build
Add the following xml to your config.xml to always use the latest version of this plugin:
```xml
<gap:plugin name="de.appplant.cordova.plugin.local-notification" />
```
or to use an specific version:
```xml
<gap:plugin name="de.appplant.cordova.plugin.local-notification" version="0.7.2" />
```
More information can be found [here][PGB_plugin].


## ChangeLog
#### Version 0.8.0 (not yet released)
- [feature:] New method `hasPermission` to ask if the user has granted to display local notifications.
- [feature:] New method `registerPermission` to register permission to display local notifications.
- [feature:] New Android specific `led:` flag.
- [feature:] Add `isTriggered` & `getTriggeredIds` methods.
- [enhancement:] iOS8 support.
- [enhancement:] Android 2.x (SDK >= 7) support (Thanks to **khizarsonu**)
- [enhancement:] Scope parameter for `isScheduled` and `getScheduledIds`
- [enhancement:] Callbacks for `add`, `cancel` & `cancelAll`
- [enhancement:] `image:` accepts remote URLs and local URIs (Android)

#### Further information
- See [CHANGELOG.md][changelog] to get the full changelog for the plugin.
- See the [v0.8.x TODO List][todo_list] for upcomming changes and other things.


## Using the plugin
The plugin creates the object ```window.plugin.notification.local``` with the following methods:

1. [notification.local.hasPermission][has_permission]
2. [notification.local.registerPermission][register_permission]
3. [notification.local.add][add]
4. [notification.local.cancel][cancel]
5. [notification.local.cancelAll][cancelall]
6. [notification.local.isScheduled][isscheduled]
7. [notification.local.getScheduledIds][getscheduledids]
8. [notification.local.isTriggered][istriggered]
9. [notification.local.getDefaults][getdefaults]
10. [notification.local.setDefaults][setdefaults]
11. [notification.local.onadd][onadd]
12. [notification.local.ontrigger][ontrigger]
13. [notification.local.onclick][onclick]
14. [notification.local.oncancel][oncancel]

### Plugin initialization
The plugin and its methods are not available before the *deviceready* event has been fired.

```javascript
document.addEventListener('deviceready', function () {
    // window.plugin.notification.local is now available
}, false);
```

### Determine if the app does have the permission to show local notifications
If the permission has been granted through the user it can be retrieved through the `notification.local.hasPermission` interface.<br/>
The method takes a callback function as its argument which will be called with a boolean value. Optional: the scope of the callback function can be defined through a second argument.

#### Further information
- The method is supported on each platform, however it's only relevant for iOS8 and above.

```javascript
window.plugin.notification.local.hasPermission(function (granted) {
    // console.log('Permission has been granted: ' + granted);
});
```

### Register permission for local notifications
Required permissions can be registered through the `notification.local.registerPermission` interface.<br/>
The method takes a callback function as its argument which will be called with a boolean value. Optional: the scope of the callback function can be defined through a second argument.

#### Further information
- The method is supported on each platform, however its only relevant for iOS8 and above.
- The user will only get a prompt dialog for the first time. Later it's only possible to change the setting via the notification center.

```javascript
window.plugin.notification.local.registerPermission(function (granted) {
    // console.log('Permission has been granted: ' + granted);
});
```

### Schedule local notifications
Local notifications can be scheduled through the `notification.local.add` interface.<br>
The method takes a hash as an argument to specify the notification's properties and returns the ID for the notification.<br>
Scheduling a local notification will override an earlier one with the same ID.
All properties are optional. If no date object is given, the notification pops-up immediately.

**Note:** The notification ID must be a string which can be converted to a number (that is, `isNaN()` returns false for). If the ID has an invalid format, it will silently be changed to `0` and will override an earlier one with the same ID.

#### Further information
- See the [onadd][onadd] event for registering a listener to be notified when a local notification has been scheduled.
- See the [ontrigger][ontrigger] event for registering a listener to be notified when a local notification has been triggered.
- See the [onclick][onclick] event for registering a listener to be notified when the user has been clicked on a local notification.
- See the [platform specific properties][platform_specific_properties] too list which other properties are available too.
- See [getDefaults][getdefaults] to examine which property values are used by default and [setDefaults][setdefaults] how to override them.
- See [examples][examples] for scheduling local notifications.

```javascript
window.plugin.notification.local.add({
    id:         String,  // A unique id of the notification
    date:       Date,    // This expects a date object
    message:    String,  // The message that is displayed
    title:      String,  // The title of the message
    repeat:     String,  // Either 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly' or 'yearly'
    badge:      Number,  // Displays number badge to notification
    sound:      String,  // A sound to be played
    json:       String,  // Data to be passed through the notification
    autoCancel: Boolean, // Setting this flag and the notification is automatically cancelled when the user clicks it
    ongoing:    Boolean, // Prevent clearing of notification (Android only)
}, callback, scope);
```

### Cancel scheduled local notifications
Local notifications can be cancelled through the `notification.local.cancel` interface.<br>
Note that only local notifications with an ID can be cancelled.

#### Further information
- See the [oncancel][oncancel] event for registering a listener to be notified when a local notification has been cancelled.
- See [getScheduledIds][getscheduledids] to retrieve a list of IDs for all scheduled local notifications.

```javascript
window.plugin.notification.local.cancel(ID, function () {
    // The notification has been cancelled
}, scope);
```

### Cancel all scheduled local notifications
All local notifications can be cancelled through the `notification.local.cancelAll` interface.<br>
The method cancels all local notifications even if they have no ID.

#### Further information
- See the [oncancel][oncancel] event for registering a listener to be notified when a local notification has been cancelled.

```javascript
window.plugin.notification.local.cancelAll(function () {
    // All notifications have been cancelled
}, scope);
```

### Check whether a notification with an ID is scheduled
To check if a notification with an ID is scheduled, the `notification.local.isScheduled` interface can be used.<br>
The method takes the ID of the local notification as an argument and a callback function to be called with the result. Optional: the scope of the callback can be assigned too.

#### Further information
- See [getScheduledIds][getscheduledids] to retrieve a list of IDs for all scheduled local notifications.

```javascript
window.plugin.notification.local.isScheduled(id, function (isScheduled) {
    // console.log('Notification with ID ' + id + ' is scheduled: ' + isScheduled);
}, scope);
```

### Retrieve the IDs from all currently scheduled local notifications
To retrieve the IDs from all currently scheduled local notifications, the `notification.local.getScheduledIds` interface can be used.<br>
The method takes a callback function to be called with the result as an array of IDs. Optional: the scope of the callback can be assigned too.

```javascript
window.plugin.notification.local.getScheduledIds(function (scheduledIds) {
    // alert('Scheduled IDs: ' + scheduledIds.join(' ,'));
}, scope);
```

### Check whether a notification with an ID was triggered
To check if a notification with an ID was triggered, the `notification.local.isTriggered` interface can be used.<br>
The method takes the ID of the local notification as an argument and a callback function to be called with the result. Optional: the scope of the callback can be assigned too.

#### Further information
- See [getTriggeredIds][gettriggeredIds] to retrieve a list of IDs for all scheduled local notifications.

```javascript
window.plugin.notification.local.isTriggered(id, function (isTriggered) {
    // console.log('Notification with ID ' + id + ' is triggered: ' + isTriggered);
}, scope);
```

### Retrieve the IDs from all currently triggered local notifications
To retrieve the IDs from all currently triggered local notifications, the `notification.local.getTriggeredIds` interface can be used.<br>
The method takes a callback function to be called with the result as an array of IDs. Optional: the scope of the callback can be assigned too.

```javascript
window.plugin.notification.local.getTriggeredIds(function (triggeredIds) {
    // alert('Triggered IDs: ' + triggeredIds.join(' ,'));
}, scope);
```

### Get the default values of the local notification properties
The default values of the local notification properties can be retrieved through the `notification.local.getDefaults` interface.<br>
The method returns an object of values for all available local notification properties on the platform.

#### Further information
- See [setDefaults][setdefaults] to override the default values.

```javascript
window.plugin.notification.local.getDefaults(); // => Object
```

### Set the default values of the local notification properties
The default values of the local notification properties can be set through the `notification.local.setDefaults` interface.<br>
The method takes an object as argument.

#### Further information
- See the [add][add] interface and the [platform specific properties][platform_specific_properties] to get an overview about all available local notification properties.
- See the [example][setdefaults_example] to override default values.

```javascript
window.plugin.notification.local.setDefaults(Object);
```

### Get notified when a local notification has been scheduled
The `notification.local.onadd` interface can be used to get notified when a local notification has been scheduled.

The listener must be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only being invoked in background if the app is not suspended!

#### Further information
- See the [ontrigger][ontrigger] event for registering a listener to be notified when a local notification has been triggered.

```javascript
window.plugin.notification.local.onadd = function (id, state, json) {};
```

### Get notified when a local notification has been triggered
The `notification.local.ontrigger` interface can be used to get notified when a local notification has been triggered.

The listener must be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only invoked in background if the app is running and is not suspended!

#### Further information
- See the [onclick][onclick] event for registering a listener to be notified when the user has been clicked on a local notification.

```javascript
window.plugin.notification.local.ontrigger = function (id, state, json) {};
```

### Get notified when the user has been clicked on a local notification
The `notification.local.onclick` interface can be used to get notified when the user has been clicked on a local notification.

The listener must be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is only invoked in background if the app is not suspended!

#### Further information
- The *autoCancel* property can be used to either automatically cancel the local notification or not after it has been clicked by the user.

```javascript
window.plugin.notification.local.onclick = function (id, state, json) {};
```

### Get notified when a local notification has been cancelled
The `notification.local.oncancel` interface can be used to get notified when a local notification has been cancelled.

The listener must be a function and takes the following arguments:
 - id: The ID of the notification
 - state: Either *background* or *foreground*
 - json: A custom (JSON encoded) string

**Note:** The event is not invoked if the local notification has been cleared in the notification center.

#### Further information
- The *autoCancel* property can automatically cancel the local notification if has been clicked by the user.
- See [cancel][cancel] and [cancelAll][cancelall] to cancel local notifications manually.

```javascript
window.plugin.notification.local.oncancel = function (id, state, json) {};
```


## Examples
### Scheduling a repeating local notification in the future
The following example shows how to schedule a local notification which will be triggered every week on this day, 60 seconds from now.

```javascript
var now                  = new Date().getTime(),
    _60_seconds_from_now = new Date(now + 60*1000);

window.plugin.notification.local.add({
    id:      1,
    title:   'Reminder',
    message: 'Dont forget to buy some flowers.',
    repeat:  'weekly',
    date:    _60_seconds_from_now
});
```

### Scheduling an immediately-triggered local notification
The example below shows how to schedule a local notification which will be triggered immediately.

```javascript
window.plugin.notification.local.add({ message: 'Great app!' });
```

### Schedule a silent local notification
By default the system sound for local notifications will be used. To turn off any sound, set the *sound* property to *NULL*.

```javascript
window.plugin.notification.local.add({ sound: null });
```

### Assign user data to the notification
If needed, local notifications can be scheduled with any user data. That data can be accessed on each event listener, but cannot be modified later.

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

### Change the default value of local notification properties
The following example shows how to override the default value of the *autoCancel* property.

```javascript
window.plugin.notification.local.setDefaults({ autoCancel: true });
```


## Platform specifics

### Small and large icons on Android
By default all notifications will display the app icon. A specific icon can be defined through the `icon` and `smallIcon` properties.

#### Resource icons
The following example shows how to display the `<package.name>.R.drawable.ic_launcher`icon as the notification icon.

```javascript
window.plugin.notification.local.add({ icon: 'ic_launcher' });
```

See below to use the `android.R.drawable.ic_dialog_email` icon as the notification small icon.

```javascript
window.plugin.notification.local.add({ smallIcon: 'ic_dialog_email' });
```

#### Local icons
The `icon` property also accepts local file URIs. The URI points to a relative path within the www folder.

```javascript
window.plugin.notification.local.add({ icon: 'file://img/logo.png' }); //=> /assets/www/img/logo.png
```

#### Remote icons
The `icon` property also accepts remote URLs. If the device cannot download the image, it will fallback to the app icon.

```javascript
window.plugin.notification.local.add({ icon: 'https://cordova.apache.org/images/cordova_bot.png' });
```

### Notification sound on Android
The sound must be an absolute or relative URI pointing to the sound file. The default sound is `RingtoneManager.TYPE_NOTIFICATION`.

**Note:** Local sound files must be placed into the res-folder and not into the assets-folder.

```javascript
/**
 * Plays the `beep.mp3` which must be located in the res folder
 */
window.plugin.notification.local.add({ sound: 'android.resource://' + package_name + '/raw/beep' });

/**
 * Plays a remote sound
 */
window.plugin.notification.local.add({ sound: 'http://remotedomain/beep.mp3' });

/**
 * Plays a sound file which must be located in the android_assets folder
 */
window.plugin.notification.local.add({ sound: '/www/audio/beep.mp3' });

/**
 * Plays the `RingtoneManager.TYPE_ALARM` sound
 */
window.plugin.notification.local.add({ sound: 'TYPE_ALARM' });
```

### Notification sound on iOS
You can package the audio data in an *aiff*, *wav*, or *caf* file. Then, in Xcode, add the sound file to your project as a nonlocalized resource of the application bundle. You may use the *afconvert* tool to convert sounds.

**Note:** To play notification sounds, permission needs to be granted in the notification center settings.<br>
**Note:** Custom sounds must be under 30 seconds when played. If a custom sound is over that limit, the default system sound is played instead.

```javascript
/**
 * Plays the `beep.mp3` which must be located in the root folder of the project
 */
window.plugin.notification.local.add({ sound: 'beep.caf' });

/**
 * Plays the `beep.mp3` which must located in the www folder
 */
window.plugin.notification.local.add({ sound: 'www/sounds/beep.caf' });
```

### LiveTile background images on WP8
LiveTiles have the ability to display images for different sizes. These images can be defined through the `smallImage`, `image` and `wideImage` properties.

**Note:** An image must be defined as a relative or absolute URI. They can be restored to default by cancelling the notification.

```javascript
/**
 * Displays the application icon as the LiveTile's background image
 */
window.plugin.notification.local.add({ image: 'appdata:ApplicationIcon.png' })
```

### Custom repeating interval on Android
To specify a custom interval, the `repeat` property can be assigned with an number in minutes.

```javascript
/**
 * Schedules the notification quarterly every 15 mins
 */
window.plugin.notification.local.add({ repeat: 15 });
```

### Change the LED color on Android devices
The LED color can be specified through the `led` property. By default the color value is white (FFFFFF). It is possible to change that value by setting another hex code.

```javascript
window.plugin.notification.local.add({ led: 'A0FF05' });
```


## Quirks

### Local Notification limit on iOS
Each application on a device is limited to 64 scheduled local notifications.<br>
The system discards scheduled notifications in excess of this limit, keeping only the 64 notifications that will fire the soonest. Recurring notifications are treated as a single notification.

### Events aren't fired on iOS
After deploying/replacing the app on the device via Xcode, no callback for previously scheduled local notifications are fired.

### No sound is played on iOS 7
Users must grant permission in the notification center settings for notification sounds to be played.

### Adding a notification on WP8
An application can only display one notification at a time. Each time a new notification is added, the application's LiveTile data will be overwritten by the new ones.

### TypeError: Cannot read property 'currentVersion' of null
Along with Cordova 3.2 and Windows Phone 8, the `version.bat` script must be renamed to `version`.

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

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2014 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[ios_notification_guide]: http://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/WhatAreRemoteNotif.html
[android_notification_guide]: http://developer.android.com/guide/topics/ui/notifiers/notifications.html
[wp8_notification_guide]: http://msdn.microsoft.com/en-us/library/windowsphone/develop/jj207047.aspx
[apache_device_plugin]: https://github.com/apache/cordova-plugin-device
[CLI]: http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface
[PGB]: http://docs.build.phonegap.com/en_US/3.3.0/index.html
[PGB_plugin]: https://build.phonegap.com/plugins/413
[changelog]: CHANGELOG.md
[todo_list]: ../../issues/164
[onadd]: #get-notified-when-a-local-notification-has-been-scheduled
[onclick]: #get-notified-when-the-user-has-been-clicked-on-a-local-notification
[oncancel]: #get-notified-when-a-local-notification-has-been-canceled
[ontrigger]: #get-notified-when-a-local-notification-has-been-triggered
[platform-specific-properties]: #platform-specifics
[has_permission]: #determine-if-the-app-does-have-the-permission-to-show-local-notifications
[register_permission]: #register-permission-for-local-notifications
[add]: #schedule-local-notifications
[cancel]: #cancel-scheduled-local-notifications
[cancelall]: #cancel-all-scheduled-local-notifications
[getdefaults]: #get-the-default-values-of-the-local-notification-properties
[setdefaults]: #set-the-default-values-of-the-local-notification-properties
[getscheduledids]: #retrieve-the-ids-from-all-currently-scheduled-local-notifications
[gettriggeredids]: #retrieve-the-ids-from-all-currently-triggered-local-notifications
[isscheduled]: #check-wether-a-notification-with-an-id-is-scheduled
[istriggered]: #check-wether-a-notification-with-an-id-was-triggered
[examples]: #examples
[setdefaults-example]: #change-the-default-value-of-local-notification-properties
[apache2_license]: http://opensource.org/licenses/Apache-2.0
