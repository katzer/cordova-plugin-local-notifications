ChangeLog
---------

#### Version 1.0.0 (17.08.2024)
This Release contains mainly changes and fixes for the Android platform.

- Make Plugin compatible with Android 12-14
- Support Android X
- Minimum supported Android version is 7.0 (SDK 24). The target SDK is increased to 34 (Android 14).
- Remove obsolete Windows platform
- Fix crash with target Android 12 (SDK 31) which occured because of a pendingIntent change and not using `PendingIntent.FLAG_IMMUTABLE`
- Fix click notifications in Android 12
- Declare `SCHEDULE_EXACT_ALARM` permission, which is necessary for scheduling exact alarms since Android 12 (API 31). It is only pre-granted on Android 12. On Android 13 and newer, the user must grant the permission in the "Alarms & Reminders"-setting, if you still want exact alarms. If the permission is not granted, notifications will be scheduled inexact, which is still ok for the normal case.
- Request `POST_NOTIFICATIONS` permission in Android 13 (API 33)
- New methods for exact alarms:
    - `canScheduleExactAlarms(successCallback, scope)` - Android only. Checks if the user has enabled the "Alarms & Reminders"-setting.  If not, the notificiatons will be scheduled inexact, which is still ok and will only be delayed by some minutes.
        - On Android 12 the permission is granted by default
        - On Android 13 and newer, the permission is not granted by default and have to be explicitly enabled by the user.
        - On Android 11 and older, this method will always return `true` in the `successCallback`.
    - `openAlarmSettings(successCallback, scope)` - Android only. Opens the "Alarms & Reminders"-settings as an Activity when running on Android 12 (SDK 31) or later, where the user can enable exact alarms. On Android older then 12, it will just call the `successCallback`, without doing anything. This method will not wait for the user to be returned back to the app. For this, the `resume`-event can be used. The callback will just return `OK`, after starting the activity.
        - If the user grants permission, already inexact scheduled notifications will automatically be rescheduled as exact alarms, but only if the app is still available in background.
        - If exact alarms were alreay granted and the user revokes it, the app will be killed and all scheduled notifications will be canceld. The app have to schedule the notifications as inexact alarms again, when the app is opened the next time, see https://developer.android.com/develop/background-work/services/alarms/schedule#using-schedule-exact-permission.
    - `openNotificationSettings(successCallback, scope)` - Opens the notifications settings of the app on Android 8 and newer. This method will not wait for the user to be returned back to the app. For this, the `resume`-event can be used.
        - On Android, the callback will just return "OK", after starting the activity.
        - On Android older then 8, it opens the app details.
        - On iOS it's not possible to open the notification settings, it will open the app settings.
- Support sender image by new option `personIcon`
- Initialize the sender as empty String instead of "Me" ([PR #1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781))
- Reuse existing messages when using MessagingStyle ([PR #1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781)). With this fix, users won't have to cache the messages in their Javascript code, the plugin will automatically check if there is an active notification with that ID and append the new messages to the existing ones. This will only be done when using MessagingStyle, which will be used, if the option `text` is filled with an `Array` instead of a `String`.
- Added count of messages in a notification, wenn using Array for `text`. ([PR #1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781))
    - Added option `titleCount` to modify the count text of messages in a notification. The placeholder `%n%` can be used for inserting the messages count. If nothing is set, the text `(%n%)` will be used.
- Use app name as a tag for the notify call ([PR #1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781))
- Use correct authority name ([PR #1853](https://github.com/katzer/cordova-plugin-local-notifications/pull/1853))
- Replace `compile()` with `implementation()` in `localnotification.gradle`, because starting on Gradle 7.0 the compile-method is removed and will produce errors, like `Could not find method compile() for arguments...`
- Raise minimum Version for Cordova dependencies
    - Cordova to 12
    - cordova-android to 13

A lot of changes were adopted from [moodlemobile](https://github.com/moodlemobile/cordova-plugin-local-notification). Thanks for the work!

#### Version 0.9.0-beta.3 (13.02.2018)

#### Version 0.9.0-beta.2 (11.01.2018)

#### Version 0.9.0-beta.1 (11.11.2017)

#### Version 0.9.0-beta.0 (31.10.2017)

#### Version 0.8.5 (22.05.2017)
- iOS 10

#### Version 0.8.4 (04.01.2016)
- Bug fixes
 - SyntaxError: missing ) after argument list

#### Version 0.8.3 (03.01.2016)
- Platform enhancements
 - Support for the `Crosswalk Engine`
 - Support for `cordova-ios@4` and the `WKWebView Engine`
 - Support for `cordova-windows@4` and `Windows 10` without using hooks
- Enhancements
 - New `color` attribute for Android (Thanks to @Eusebius1920)
 - New `quarter` intervall for iOS & Android
 - `smallIcon` is optional (Android)
 - `update` checks for permission like _schedule_
 - Decreased time-frame for trigger event (iOS)
 - Force `every:` to be a string on iOS
- Bug fixes
 - Fixed #634 option to skip permission check
 - Fixed #588 crash when basename & extension can't be extracted (Android)
 - Fixed #732 loop between update and trigger (Android)
 - Fixed #710 crash due to >500 notifications (Android)
 - Fixed #682 crash while resuming app from notification (Android 6)
 - Fixed #612 cannot update icon or sound (Android)
 - Fixed crashing get(ID) if notification doesn't exist
 - Fixed #569 getScheduled returns two items per notification
 - Fixed #700 notifications appears on bootup

#### Version 0.8.2 (08.11.2015)
- Submitted to npm
- Initial support for the `windows` platform
- Re-add autoCancel option on Android
- Warn about unknown properties
- Fix crash on iOS 9
- Fixed webView-Problems with cordova-android 4.0
- Fix get* with single id
- Fix issue when passing data in milliseconds
- Update device plugin id
- Several other fixes

#### Version 0.8.1 (08.03.2015)

- Fix incompatibility with cordova version 3.5-3.0
- Fire `clear` instead of `cancel` event when clicked on repeating notifications
- Do not fire `clear` or `cancel` event when clicked on persistent notifications

### Version 0.8.0 (05.03.2015)

- Support for iOS 8, Android 2 (SDK >= 7) and Android 5
 - Windows Phone 8.1 will be added soon
- New interfaces to ask for / register permissions required to schedule local notifications
 - `hasPermission()` and `registerPermission()`
 - _schedule()_ will register the permission automatically and schedule the notification if granted.
- New interface to update already scheduled|triggered local notifications
 - `update()`
- New interfaces to clear the notification center
 - `clear()` and `clearAll()`
- New interfaces to query for local notifications, their properties, their IDs and their existence depend on their state
 - `isPresent()`, `isScheduled()`, `isTriggered()`
 - `getIds()`, `getAllIds()`, `getScheduledIds()`, `getTriggeredIds()`
 - `get()`, `getAll()`, `getScheduled()`, `getTriggered()`
- Schedule multiple local notifications at once
 - `schedule( [{...},{...}] )`
- Update multiple local notifications at once
 - `update( [{...},{...}] )`
- Clear multiple local notifications at once
 - `clear( [1, 2] )`
- Cancel multiple local notifications at once
 - `cancel( [1, 2] )`
- New URI format to specify sound and image resources
 - `http(s):` for remote resources _(Android)_
 - `file:` for local resources relative to the _www_ folder
 - `res:` for native resources
- New events
 - `schedule`, `update`, `clear`, `clearall` and `cancelall`
- Enhanced event informations
 - Listener will get called with the local notification object instead of only the ID
- Multiple listener for one event
 - `on(event, callback, scope)`
- Unregister event listener
 - `un(event, callback)`
- New Android specific properties
 - `led` properties
 - `sound` and `image` accepts remote resources
- Callback function and scope for all interface methods
 - `schedule( notification, callback, scope )`
- Renamed `add()` to `schedule()`
- `autoCancel` property has been removed
 - Use `ongoing: true` for persistent local notifications on Android
- Renamed repeat intervals
 - `second`, `minute`, `hour`, `day`, `week`, `month` and `year`
- Renamed some local notification properties
 - `date`, `json`, `message` and `repeat`
 - Scheduling local notifications with the deprecated properties is still possible
- [Kitchen Sink sample app](https://github.com/katzer/cordova-plugin-local-notifications/tree/example)
- [Wiki](https://github.com/katzer/cordova-plugin-local-notifications/wiki)
