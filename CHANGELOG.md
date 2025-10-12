# ChangeLog

## Version 1.2.2 (12.10.2025)

### iOS
- Ignore deprecation warning about using `UNNotificationPresentationOptionAlert`
  - XCode could give a deprecation warning about using `UNNotificationPresentationOptionAlert` which is deprecated since iOS 14. The code is already written in such a way that it can only be used on iOS 13 and older versions. So ignore the deprecation warning.

### Common

- Add plugin method `getDefaults` back
  - The `getDefaults` method was accidentally removed in version `1.1.0`
  - Thanks to @randnetdd who reported this issue
  - Fixes [#2088](https://github.com/katzer/cordova-plugin-local-notifications/issues/2088)

## Version 1.2.1 (14.08.2025)

### Android
- Bugfix: Prevent `NullPointerException` for trigger and clear
  - It could happen, that a `NullPointerException` occurred, when a notification was triggered or a user cleared a notification, because the notification data was not found any longer in the `SharedPreferences`
- Bugfix: Handle crash when updating from plugin version `0.9-beta.3` and notifications were already scheduled with the old plugin version.
  - This was due to not handling correctly the `-beta` in the version string `0.9-beta.3` when trying to convert the string to an int. Now the pre-release identifiers `-dev` and `-beta` will be removed, before the version string will be converted to an int.
  - Fixes [#2087](https://github.com/katzer/cordova-plugin-local-notifications/issues/2087)
- Update `meta.version` of scheduled notifications from older plugin versions to the current plugin version. So if notifications were scheduled by version `1.2.0`, it will be updated to `1.2.1`, when the app is updated.

## Version 1.2.0 (02.07.2025)

### Common
- Bugfix: Don't filter out notifications where `trigger.at` is not set: Notifications were filtered out when something other than `trigger.at` was set like `trigger.in`, or `trigger.every`

## Version 1.1.9 (12.06.2025)

### Android
- Bugfix: Subsequent notifications were ignored, when posting them without `trigger.at`: If no `trigger.at` was set, it was set to the current time, but due shallow copying the default properties, the `trigger`-property of the defaults was changed also to that time and all subsequent notifications were getting the time which resulted in being ignored.
  - Fixes https://github.com/katzer/cordova-plugin-local-notifications/issues/2082

## Version 1.1.8 (25.05.2025)

### Android

- Bugfix: Handle passed `trigger.at` dates: If `trigger.at` lays more then 5 seconds in the past, ignore it, otherwise keep sure, it will be posted on iOS and Android by setting the trigger time 5 seconds in the future.
- Bugfix: Open app when notification clicked. The app was not opened anymore, when a notification was clicked
- Bugfix: Already posted notifications could not be updated
- Bugfix: Already posted notifications will be shown again, when the app updates or the device reboots.
- Bugfix: Setting no trigger date fired endless notifications
  - `trigger.at` will always be set, when no trigger is set. The current time will be used as `trigger.at` then.
- Bugfix: `trigger.unit` and `trigger.every` (String) could fail in different user locales. The value of those two properties was upper cased by [String.toUpperCase()](https://developer.android.com/reference/java/lang/String#toUpperCase()) and turned after into an `Enum`. The method `String.toUpperCase()` is locale aware and will use the current user locale to upper case the string. In Turkish, for e.g., the value `minute` would become upper cased to `MİNUTE` where the I has a dot above it and would not recognized as an Enum. Now enums will not be used anymore and the values are taken as they come from JavaScript and are expected to be lower cased like `minute`, `hour` etc.
  - Thanks [TheNotorius0](https://github.com/TheNotorius0) for sharing his experiences in issue [2060](https://github.com/katzer/cordova-plugin-local-notifications/issues/2060) as a [comment](https://github.com/katzer/cordova-plugin-local-notifications/issues/2060#issuecomment-2751895663) and also [pahenator](https://github.com/pahenator) for initially posting the issue.
  - Thanks [iamAdamGoodman](https://github.com/iamAdamGoodman) noting that `trigger.at` was not functioning after adding these changes in issue [2070](https://github.com/katzer/cordova-plugin-local-notifications/issues/2070)
  - Throw exception if the `trigger` property is set wrong
- Bugfix: Use `cordova-android` default Kotlin support mechanism. The plugin has bypassed `cordova-android` default Kotlin support mechanism by defining `kotlin-bom` in `localnotification.gradle`. To enable Cordova-Android's Kotlin support, the preference flag `GradlePluginKotlinEnabled` is set to true in `plugin.xml` and `kotlin-bom` was removed. Fixes https://github.com/katzer/cordova-plugin-local-notifications/issues/2076
- Set default notification id to 1 instead of 0
- Code refactoring
  - Renamed `DateTrigger.java` to `TriggerHandler.java`
  - Added `OptionsTrigger` which is a helper to read the trigger properties
  - Split `IntervalTrigger` in `TriggerHandlerAt`, `TriggerHandlerIn` and `TriggerHandlerEvery`, to better refelect the trigger options
  - Rename `MatchTrigger` to `TriggerHandlerEvery`
  - Remove `BuilderCreator` and move code to `Notification`
  - Move notification show code from `TriggerReceiver` to `Notification`

## Version 1.1.7 (22.03.2025)
- Fix for npm: The dev version 1.1.6-dev was accidentally published to npm and there were also problems with version 1.1.6. Correct this to 1.1.7.

## Version 1.1.6 (22.03.2025)
- Fix for npm: The dev version 1.1.6-dev was accidentally published to npm. This will correct this as published as 1.1.6.

## Version 1.1.5 (22.03.2025)

### Android
- Bugfix: Don't crash when getting none existent notification. Calling `cancel` could crash the app, if a notification does not exist for an id.
  - Fixes [Issue 2064](https://github.com/katzer/cordova-plugin-local-notifications/issues/2064)

## Version 1.1.4 (21.03.2025)

### Android
- Restore notifications correctly from old plugin versions
  - Old properties were only corrected in JavaScript, but not on Java. If an app was updated with the new plugin version and had scheduled notifications before, the notifications could be triggered with no sound and the default `smallIcon` would always be used.
  - Fixes [Issue 2059](https://github.com/katzer/cordova-plugin-local-notifications/issues/2059)
- Refactor trigger handling
  - Trigger notifications where `trigger.at` is in the past. Before those notifications were ignored.
  - `DateTrigger`: Set occurrence initial to 0 (not 1)
  - Don't schedule all occurrences at once when `trigger.count` is set. Schedule one after the other, like it's done when `trigger.count` is not set
  - Repeating notification: Don't cancel previously posted notification, when scheduling next notification, fixes [Issue 2059](https://github.com/katzer/cordova-plugin-local-notifications/issues/2059)
  - Restore a trigger date exactly like it was before the restoration
  - Fallback for false `unit` value when using `trigger: {in: xxx, unit: 'xxx'}`
      - Unit `minute` will be used if `unit` is set wrong.
      - Fixes [Issue 2060](https://github.com/katzer/cordova-plugin-local-notifications/issues/2060)
  - Bugfix: Calculation of next `trigger.every`: The second occurrence of `trigger.every` was calculated wrong, because the base date was not set to the last trigger date of the last occurrence but instead to the current time. Now the trigger date will be saved in the `SharedPreferences` of Android and restored when the next occurrence is scheduled and calculated.
      - Fixes [Issue 2059](https://github.com/katzer/cordova-plugin-local-notifications/issues/2059)
  - Bugfix: Only fire `add` event, if a notification was scheduled successfully. Before it could also be fired, when an error occurred and the notification was not scheduled.
  - Fire event `clear` or `cancel` always when a notification is cleared or canceled. Before it could be possible, that these events were not fired though notifications got cleared or canceled.
  - Code changes:
      -  Refactor `MatchTrigger` used for `trigger: every { minute: xx, hour: xx, ...}`
      - Remove `Request.java` and use `DateTrigger` directly in a `Notification`. Intialise the appropriate `DateTrigger` when a `Notification` is created.
      - Rename `Builder` to `BuilderCreator` and set the builder directly in a `Notification`. Don't create a Notification from the Builder.

### Common
- Improve documentation: [trigger property](README.md#triggers)

## Version 1.1.3 (15.02.2025)

### Android
- fix(crash): `ArrayIndexOutOfBoundsException` can occur, if the user dismisses a permission request without clicking a button
  - Reported by #UzverNumber47. Thanks :)

## Version 1.1.2 (08.02.2025)

### Android
- Bugfix for input actions: Make PendingIntent for actions mutable. Fixes a crash when using input actions
- New methods for handling unused app restrictions settings
  - `getUnusedAppRestrictionsStatus`: Gets the status of the unused app restrictions status
  - `openManageUnusedAppRestrictions`: Opens the settings for controlling the unused app restrictions status

### iOS
- Fix warnigs when using cordova-ios 8.0.0
  - Remove wrong named params from code documentation.

### Common
- Improve documentation

## Version 1.1.1 (24.01.2025)

### Android
- `SCHEDULE_EXACT_ALARM` is not pre-configured anymore by this plugin to have more flexibility. If you want exact alarms, see [Schedule exact alarms](README.md#android-schedule-exact-alarms).
- You can declare `USE_EXACT_ALARM` to set your app as a calendar or alarm clock app. See [Exact alarms: Define your app as a Calender or Alarm Clock app](README.md#exact-alarms-define-your-app-as-a-calender-or-alarm-clock-app)
- Renamed property `vibrate` to [androidChannelEnableVibration](README.md#property-androidchannelenablevibration)
- Image resources: Support `res://`, `www` and `shared://` for [attachments](README.md#property-attachments) and [attachments.personIcon](README.md#property-personicon)

### iOS
- Since iOS 14: Show a notification in the notification center when the app is in foreground, like on Android. Happens also if [iOSForeground](README.md#property-iosforeground) is `false`.

### Common
- Improved documentation
- Renamed internal plugin method `check` to `hasPermission` to make it consistent with `cordova.plugins.notification.local.hasPermission`

## Version 1.1.0 (23.12.2024)

- Improve documentation
- Documentation of properties

### Changes for Android
- Handling [Android channels](README.md#android-notification-channels):
    - New Methods: [createChannel](README.md#createchannel) and [deleteChannel](README.md#deletechannel)
    - The [default channel](README.md#default-channel) is configurable
- Changed default channel id from `default-channel-id` to `default_channel`
- Bugfix: Make cancel/cancelAll/clear/clearAll work again. This was broken since Version 1.0.0 because of the change "Use app name as a tag for the notify call [PR #1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781)". For e.g. notifications were still in the statusbar, when clearing a notification.
- Bugfix: `java.lang.IllegalStateException: Maximum limit of concurrent alarms 500 reached`, when canceling notifications and schedule new notifications
    - When canceling a notification, the saved data for the notification was removed from the app and also a posted notification from the statusbar, but the alarm itself, which would create the notification, not. This was due to a wrongly created intent for clearing the scheduled alarms.
- Bugfix: Reschedule notifications, when app is updated
    - Android clears all pending alarms, when an app is updated, this was not properly handled.
- Bugfix: Remove wrongly used intent-filter `LOCKED_BOOT_COMPLETED`
    - The intent-filter `LOCKED_BOOT_COMPLETED` is executed, when the device was booted, but not yet unlocked by the user (e.g. the device is looked by a pin). To use this feature, the device encrypted storage has to be used, which is accessible by `context.createDeviceProtectedStorageContext()`. This has first to be implemented and was not implemented.
- React on `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` when app is closed and not only in the background
- Added [onlyAlertOnce](https://developer.android.com/reference/android/app/Notification.Builder#setOnlyAlertOnce(boolean)) option
- Removed option `mediaSession` and the corresponding MediaStyle. This was not functional and also needed the extra Android library `android:media`.

#### Changes in resource handling
- Added resource uri [shared://](README.md#resource-pattern-shared), to set at runtime created resources for e.g. a [sound](README.md#property-sound), [androidLargeIcon](README.md#property-androidlargeicon), etc.
- Added resource path [www](README.md#resource-pattern-www) to access www-files
- Removed resource uris `http`, `https`. You can use for this the [shared](README.md#resource-pattern-shared) dirctory and a `shared:` uri.
- Removed resource uri `file:///`. file uris should not be used in Android.
- Removed resource uri `content:`. You can instead use a [shared://](README.md#resource-pattern-shared) uri.

#### Code fixes and cleanup
- General code clenaup
- Removed Plugin dependency `cordova-plugin-badge` and `ShortcutBadger`. These were only used for Android. Android can handle the badging itself and does not need a 3rd party library. You can configure the behaviour by the [badgeNumber](README.md#property-badgenumber) property.
- Use `FLAG_IMMUTABLE` on every Android version
    - Before it was set since Android 12, now since Android 7, to make the code consistent between all Android versions.
- Bugfix: Catch any exceptions when attempting to get option for a notification
- Removed subfolder `notification` and correct package declaration `de.appplant.cordova.plugin.notification` to `de.appplant.cordova.plugin.localnotification`
- Added `androidx.core:core` package version `1.12.0` for using `NotificationManagerCompat`
    - The version is cofigurable by `ANDROIDX_CORE_VERSION`.
    - Added `kotlin-bom` to fix duplicate classes errors.
- Removed Android Support Library leftovers `com.android.support:support-v4` from `plugin.xml`
    - This was overlooked, when switched to Android X.
- Removed `android:media` Library: This was used for MediaSytle, which was removed.
- Gradle: Removed deprecated repository `jcenter`. The appeareance of `jcenter` as a repository, produced the gradle warning `Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.`
- Always set the receiver class for alarms to `TriggerReceiver.class`, so it's easier to cancel alarms.

### Changes for iOS
- Plugin compatibility for upcoming `cordova-ios` version `8.0.0`
- `package.json`: Correct incorrect `cordova-ios` dependency
    - Version `10.0.0` was referenced, but the maximum available version currently is `7.1.1`
    - Correct version also for old plugin version `0.9.0-beta.3`
- New method [iOSClearBadge](README.md#iosclearbadge) for clearing the badge on iOS.
- Added resource path [www](README.md#resource-pattern-www) to access www-files

### Changed properties
Some properties were changed. See [Changes since version `1.1.0`](README.md#changes-since-version-110)

### Other changes
- Renamed plugin action `request` to `requestPermission`

## Version 1.0.0 (17.08.2024)
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
    - [canScheduleExactAlarms(successCallback, scope)](README.md#canscheduleexactalarms)
    - [openAlarmSettings(successCallback, scope)](README.md#openalarmsettings)
    - [openNotificationSettings(successCallback, scope)](README.md#opennotificationsettings)
- Changes for MessagingStyle:
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

## Version 0.9.0-beta.3 (13.02.2018)

## Version 0.9.0-beta.2 (11.01.2018)

## Version 0.9.0-beta.1 (11.11.2017)

## Version 0.9.0-beta.0 (31.10.2017)

## Version 0.8.5 (22.05.2017)
- iOS 10

## Version 0.8.4 (04.01.2016)
- Bug fixes
 - SyntaxError: missing ) after argument list

## Version 0.8.3 (03.01.2016)
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

## Version 0.8.2 (08.11.2015)
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

## Version 0.8.1 (08.03.2015)

- Fix incompatibility with cordova version 3.5-3.0
- Fire `clear` instead of `cancel` event when clicked on repeating notifications
- Do not fire `clear` or `cancel` event when clicked on persistent notifications

## Version 0.8.0 (05.03.2015)

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
