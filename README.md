# cordova-plugin-local-notification (fork)

This is a fork of `cordova-plugin-local-notification` by [Moodle HQ](https://moodle.com/). If you are looking for the documentation, you can read the original at [katzer/cordova-plugin-local-notifications](https://github.com/katzer/cordova-plugin-local-notifications).

## Modifications from the original

We created this fork because we needed to include the following modifications in [our mobile application](https://github.com/moodlehq/moodleapp):

| PR | Description |
| -- | ----------- |
| [#1781](https://github.com/katzer/cordova-plugin-local-notifications/pull/1781) | Reuse existing messages when using MessagingStyle |
| [#1853](https://github.com/katzer/cordova-plugin-local-notifications/pull/1853) | Use correct authority name |

It also includes some commits that are in master and haven't been released.

You can see all the changes here: [0.9.0-beta.3...moodlemobile:v0.9.0-moodle.1](https://github.com/katzer/cordova-plugin-local-notifications/compare/0.9.0-beta.3...moodlemobile:v0.9.0-moodle.1)

## Installation

You can install this package using the [original installation instructions](https://github.com/katzer/cordova-plugin-local-notifications#installation), but installing this package instead:

```sh
cordova plugin add @moodlehq/cordova-plugin-local-notification@0.9.0-moodle.1
```

Depending on your cordova version, this command will add the plugin to your package.json as `cordova-plugin-local-notification` (for example, under `cordova.plugins`). In that case, you also need to add `@moodlehq/cordova-plugin-local-notification` so that the project restores the fork properly in other machines. Make sure that it is listed before the unscoped plugin name.
