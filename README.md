Cordova LocalNotification-Plugin
==================================

A bunch of local-notification plugins for Cordova 3.x.x

by Sebastián Katzer ([github.com/katzer](https://github.com/katzer))

## Supported Platforms ##
- **iOS**

## Adding the Plugin to your project ##
Through the [Command-line Interface](http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface):
```
cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
```

## Release Notes ##
#### Version 0.2.0 (11.08.2013) ####
- Added iOS support

## Using the plugin ##
The plugin creates the object ```window.plugin.notification.local``` with three methods:

### add() ###
To add a custom notification:
```javascript
window.plugin.notification.local.add({
    date: date,// this expects a date object
    message: message, // the message that is displayed
    repeat: repeat, // has the options of 'weekly','daily','monthly','yearly')
    badge: badge, // displays number badge to notification
    foreground: forground, //  a javascript function to be called if the app is running
    background: background, // a javascript function to be called if the app is in the background
    sound: sound // a sound to be played, the sound must be located in your project's resources and must be a caf file
});
```

### clear() ###
To clear a specific notification:
```javascript
window.plugin.notification.local.clear(__id__);
```

### clearAll() ###
To clear all notifications:
```javascript
window.plugin.notification.local.clearAll();
```

#### Example ####
```javascript
var now                  = new Date().getTime(),
    _60_seconds_from_now = new Date(now + 60*1000);

window.plugin.notification.local.add({
    date: _60_seconds_from_now,
    message: 'Hello world!',
    repeat: 'weekly', // will fire every week on this day
    badge: 1,
    foreground: 'foreground',
    background: 'background',
    sound: 'sub.caf'
});

function foreground (id) {
    console.log('I WAS RUNNING ID='+id)
}

function background (id) {
    console.log('I WAS IN THE BACKGROUND ID='+id)
}
```
