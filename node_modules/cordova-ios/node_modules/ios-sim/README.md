[![Build status](https://ci.appveyor.com/api/projects/status/0kw833771uu622fs?svg=true)](https://ci.appveyor.com/project/shazron/ios-sim)
[![Build Status](https://travis-ci.org/phonegap/ios-sim.svg?branch=master)](https://travis-ci.org/phonegap/ios-sim)

ios-sim
=======

Supports Xcode 6 only since version 3.x.

The ios-sim tool is a command-line utility that launches an iOS application on the iOS Simulator. This allows for niceties such as automated testing without having to open Xcode.

Features
--------

* Choose the device family to simulate, i.e. iPhone or iPad. Run using "showdevicetypes" option to see available device types, and pass it in as the "devicetypeid" parameter.

See the `--help` option for more info.

The unimplemented options below are in the [backlog](https://github.com/phonegap/ios-sim/milestones/ios-sim%204.2.0)

Usage
-----

```

    Usage: ios-sim <command> <options> [--args ...]
        
    Commands:
      showsdks                        List the available iOS SDK versions
      showdevicetypes                 List the available device types
      launch <application path>       Launch the application at the specified path on the iOS Simulator
      start                           Launch iOS Simulator without an app
      install <application path>      Install the application at the specified path on the iOS Simulator without launching the app

    Options:
      --version                       Print the version of ios-sim
      --help                          Show this help text
      --exit                          Exit after startup
      --log <log file path>           The path where log of the app running in the Simulator will be redirected to
      --devicetypeid <device type>    The id of the device type that should be simulated (Xcode6+). Use 'showdevicetypes' to list devices.
                                      e.g "com.apple.CoreSimulator.SimDeviceType.Resizable-iPhone6, 8.0"
                                  
    Removed in version 4.x:
      --stdout <stdout file path>     The path where stdout of the simulator will be redirected to (defaults to stdout of ios-sim)
      --stderr <stderr file path>     The path where stderr of the simulator will be redirected to (defaults to stderr of ios-sim)
      --sdk <sdkversion>              The iOS SDK version to run the application on (defaults to the latest)
      --family <device family>        The device type that should be simulated (defaults to `iphone')
      --retina                        Start a retina device
      --tall                          In combination with --retina flag, start the tall version of the retina device (e.g. iPhone 5 (4-inch))
      --64bit                         In combination with --retina flag and the --tall flag, start the 64bit version of the tall retina device (e.g. iPhone 5S (4-inch 64bit))
                                    
    Unimplemented in this version:
      --verbose                       Set the output level to verbose
      --timeout <seconds>             The timeout time to wait for a response from the Simulator. Default value: 30 seconds
      --args <...>                    All following arguments will be passed on to the application
      --env <environment file path>   A plist file containing environment key-value pairs that should be set
      --setenv NAME=VALUE             Set an environment variable
                                  
```

Installation
------------

Choose one of the following installation methods.

### Node JS

Install using node.js (at least 0.10.20):

    $ npm install ios-sim -g

### Zip

Download a zip file:

    $ curl -L https://github.com/phonegap/ios-sim/archive/master.zip -o ios-sim.zip
    $ unzip ios-sim.zip

### Git

Download using git clone:

    $ git clone git://github.com/phonegap/ios-sim.git

Troubleshooting
---------------

Make sure you enable Developer Mode on your machine:

    $ DevToolsSecurity -enable

Make sure multiple instances of launchd_sim are not running:

    $ killall launchd_sim

License
-------

This project is available under the MIT license. See [LICENSE][license].

[license]: https://github.com/phonegap/ios-sim/blob/master/LICENSE
