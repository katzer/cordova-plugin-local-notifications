cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-plugin-device.device",
    "file": "plugins/cordova-plugin-device/www/device.js",
    "pluginId": "cordova-plugin-device",
    "clobbers": [
      "device"
    ]
  },
  {
    "id": "cordova-plugin-local-notifications.LocalNotification",
    "file": "plugins/cordova-plugin-local-notifications/www/local-notification.js",
    "pluginId": "cordova-plugin-local-notifications",
    "clobbers": [
      "cordova.plugins.notification.local"
    ]
  },
  {
    "id": "cordova-plugin-local-notifications.LocalNotification.Core",
    "file": "plugins/cordova-plugin-local-notifications/www/local-notification-core.js",
    "pluginId": "cordova-plugin-local-notifications",
    "clobbers": [
      "cordova.plugins.notification.local.core",
      "plugin.notification.local.core"
    ]
  },
  {
    "id": "cordova-plugin-local-notifications.LocalNotification.Util",
    "file": "plugins/cordova-plugin-local-notifications/www/local-notification-util.js",
    "pluginId": "cordova-plugin-local-notifications",
    "merges": [
      "cordova.plugins.notification.local.core",
      "plugin.notification.local.core"
    ]
  },
  {
    "id": "cordova-plugin-x-toast.Toast",
    "file": "plugins/cordova-plugin-x-toast/www/Toast.js",
    "pluginId": "cordova-plugin-x-toast",
    "clobbers": [
      "window.plugins.toast"
    ]
  },
  {
    "id": "cordova-plugin-x-toast.tests",
    "file": "plugins/cordova-plugin-x-toast/test/tests.js",
    "pluginId": "cordova-plugin-x-toast"
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-device": "1.1.6",
  "cordova-plugin-local-notifications": "0.0.0",
  "cordova-plugin-x-toast": "2.6.0"
};
// BOTTOM OF METADATA
});