/*
The MIT License (MIT)

Copyright (c) 2014 Shazron Abdullah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
//jscs:disable maximumLineLength

var path = require('path'),
    fs = require('fs'),
    help = require('./help'),
    util = require('util');
var simctl;
var bplist;
var plist;

function findFirstAvailableDevice(list) {
    /*
        // Example result:
        {
            name : 'iPhone 6',
            id : 'A1193D97-F5EE-468D-9DBA-786F403766E6',
            runtime : 'iOS 8.3'
        }
    */

    // the object to return
    var ret_obj = {
        name: null,
        id: null,
        runtime: null
    };

    var available_runtimes = {};

    list.runtimes.forEach(function(runtime) {
        available_runtimes[ runtime.name ] = (runtime.availability === '(available)');
    });

    Object.keys(list.devices).some(function(deviceGroup) {
        return list.devices[deviceGroup].some(function(device) {
            if (available_runtimes[deviceGroup]) {
                ret_obj = {
                    name: device.name,
                    id: device.udid,
                    runtime: deviceGroup
                };
                return true;
            }
            return false;
        });
    });

    return ret_obj;
}

function findRuntimesGroupByDeviceProperty(list, deviceProperty, availableOnly) {
    /*
        // Example result:
        {
            "iPhone 6" : [ "iOS 8.2", "iOS 8.3"],
            "iPhone 6 Plus" : [ "iOS 8.2", "iOS 8.3"]
        }
    */

    var runtimes = {};
    var available_runtimes = {};

    list.runtimes.forEach(function(runtime) {
        available_runtimes[ runtime.name ] = (runtime.availability === '(available)');
    });

    Object.keys(list.devices).forEach(function(deviceGroup) {
        list.devices[deviceGroup].forEach(function(device) {
            var devicePropertyValue = device[deviceProperty];

            if (!runtimes[devicePropertyValue]) {
                runtimes[devicePropertyValue] = [];
            }
            if (availableOnly) {
                if (available_runtimes[deviceGroup]) {
                    runtimes[devicePropertyValue].push(deviceGroup);
                }
            } else {
                runtimes[devicePropertyValue].push(deviceGroup);
            }
        });
    });

    return runtimes;
}

function findAvailableRuntime(list, device_name) {

    var all_druntimes = findRuntimesGroupByDeviceProperty(list, 'name', true);
    var druntime = all_druntimes[ filterDeviceName(device_name) ];
    var runtime_found = druntime && druntime.length > 0;

    if (!runtime_found) {
        console.error(util.format('No available runtimes could be found for "%s".', device_name));
        process.exit(1);
    }

    // return most modern runtime
    return druntime.sort().pop();
}

function getDeviceFromDeviceTypeId(devicetypeid) {
    /*
        // Example result:
        {
            name : 'iPhone 6',
            id : 'A1193D97-F5EE-468D-9DBA-786F403766E6',
            runtime : 'iOS 8.3'
        }
    */

    // the object to return
    var ret_obj = {
        name: null,
        id: null,
        runtime: null
    };

    var options = { 'silent': true };
    var list = simctl.list(options).json;
    list = fixSimCtlList(list);

    var arr = [];
    if (devicetypeid) {
        arr = devicetypeid.split(',');
    }

    // get the devicetype from --devicetypeid
    // --devicetypeid is a string in the form "devicetype, runtime_version" (optional: runtime_version)
    var devicetype = null;
    if (arr.length < 1) {
        var dv = findFirstAvailableDevice(list);
        console.error(util.format('--devicetypeid was not specified, using first available device: %s.', dv.name));
        return dv;
    } else {
        devicetype = arr[0].trim();
        if (arr.length > 1) {
            ret_obj.runtime = arr[1].trim();
        }
    }

    // check whether devicetype has the "com.apple.CoreSimulator.SimDeviceType." prefix, if not, add it
    var prefix = 'com.apple.CoreSimulator.SimDeviceType.';
    if (devicetype.indexOf(prefix) !== 0) {
        devicetype = prefix + devicetype;
    }

    // now find the devicename from the devicetype
    var devicename_found = list.devicetypes.some(function(deviceGroup) {
        if (deviceGroup.identifier === devicetype) {
            ret_obj.name = deviceGroup.name;
            return true;
        }

        return false;
    });

    // device name not found, exit
    if (!devicename_found) {
        console.error(util.format('Device type "%s" could not be found.', devicetype));
        process.exit(1);
    }

    // if runtime_version was not specified, we use a default. Use first available that has the device
    if (!ret_obj.runtime) {
        ret_obj.runtime = findAvailableRuntime(list, ret_obj.name);
    }

    // prepend iOS to runtime version, if necessary
    if (ret_obj.runtime.indexOf('OS') === -1) {
        ret_obj.runtime = util.format('iOS %s', ret_obj.runtime);
    }

    // now find the deviceid (by runtime and devicename)
    var deviceid_found = Object.keys(list.devices).some(function(deviceGroup) {
        // found the runtime, now find the actual device matching devicename
        if (deviceGroup === ret_obj.runtime) {
            return list.devices[deviceGroup].some(function(device) {
                if (filterDeviceName(device.name) === filterDeviceName(ret_obj.name)) {
                    ret_obj.id = device.udid;
                    return true;
                }
                return false;
            });
        }
        return false;
    });

    if (!deviceid_found) {
        console.error(
            util.format('Device id for device name "%s" and runtime "%s" could not be found, or is not available.', ret_obj.name, ret_obj.runtime)
        );
        process.exit(1);
    }

    return ret_obj;
}

// Parses array of KEY=Value strings into map of strings
// If fixsymctl == true, updates variables for correct usage with simctl
function parseEnvironmentVariables(envVariables, fixsymctl) {
    envVariables = envVariables || [];
    fixsymctl = typeof fixsymctl != 'undefined' ? fixsymctl : true;

    var envMap = {};
    envVariables.forEach(function(variable) {
        var envPair = variable.split('=', 2);
        if (envPair.length == 2) {
            var key = envPair[0];
            var value = envPair[1];
            if (fixsymctl) {
                key = 'SIMCTL_CHILD_' + key;
            }
            envMap[ key ] = value;
        }
    });
    return envMap;
}

// Injects specified environt variables to the process and then runs action
// returns environment variables back to original state after action completes
function withInjectedEnvironmentVariablesToProcess(process, envVariables, action) {
    var oldVariables = util._extend({}, process.env);

    // Inject additional environment variables to process
    for (var key in envVariables) {
        var value = envVariables[key];
        process.env[key] = value;
    }

    action();

    // restore old envs
    process.env = oldVariables;
}

// replace hyphens in iPad Pro name which differ in 'Device Types' and 'Devices'
function filterDeviceName(deviceName) {
    // replace hyphens in iPad Pro name which differ in 'Device Types' and 'Devices'
    if (deviceName.indexOf('iPad Pro') === 0) {
        return deviceName.replace(/\-/g, ' ').trim();
    }
    return deviceName;
}

function fixNameKey(array, mapping) {
    if (!array || !mapping) {
        return array;
    }

    return array.map(function(elem) {
        var name = mapping[elem.name];
        if (name) {
            elem.name = name;
        }
        return elem;
    });
}

function fixSimCtlList(list) {
    // Xcode 9 `xcrun simctl list devicetypes` have obfuscated names for 2017 iPhones and Apple Watches.
    var deviceTypeNameMap = {
        'iPhone2017-A': 'iPhone 8',
        'iPhone2017-B': 'iPhone 8 Plus',
        'iPhone2017-C': 'iPhone X',
        'Watch2017 - 38mm': 'Apple Watch Series 3 - 38mm',
        'Watch2017 - 42mm': 'Apple Watch Series 3 - 42mm'
    };
    list.devicetypes = fixNameKey(list.devicetypes, deviceTypeNameMap);

    // `iPad Pro` in iOS 9.3 has mapped to `iPad Pro (9.7 inch)`
    // `Apple TV 1080p` has mapped to `Apple TV`
    var deviceNameMap = {
        'Apple TV 1080p': 'Apple TV',
        'iPad Pro': 'iPad Pro (9.7-inch)'
    };
    Object.keys(list.devices).forEach(function(key) {
        list.devices[key] = fixNameKey(list.devices[key], deviceNameMap);
    });

    return list;
}

var lib = {

    init: function() {
        if (!simctl) {
            simctl = require('simctl');
        }
        var output = simctl.check_prerequisites();
        if (output.code !== 0) {
            console.error(output.output);
        }

        if (!bplist) {
            bplist = require('bplist-parser');
        }

        return output.code;
    },

    //jscs:disable disallowUnusedParams
    showsdks: function(args) {
        var options = { silent: true, runtimes: true };
        var list = simctl.list(options).json;

        var output = 'Simulator SDK Roots:\n';
        list.runtimes.forEach(function(runtime) {
            if (runtime.availability === '(available)') {
                output += util.format('"%s" (%s)\n', runtime.name, runtime.buildversion);
                output += util.format('\t(unknown)\n');
            }
        });

        return output;
    },
    //jscs:enable disallowUnusedParams

    //jscs:disable disallowUnusedParams
    getdevicetypes: function(args) {
        var options = { silent: true };
        var list = simctl.list(options).json;
        list = fixSimCtlList(list);

        var druntimes = findRuntimesGroupByDeviceProperty(list, 'name', true);
        var name_id_map = {};

        list.devicetypes.forEach(function(device) {
            name_id_map[ filterDeviceName(device.name) ] = device.identifier;
        });

        list = [];
        var remove = function(devicename, runtime) {
            // remove "iOS" prefix in runtime, remove prefix "com.apple.CoreSimulator.SimDeviceType." in id
            list.push(util.format('%s, %s', name_id_map[ devicename ].replace(/^com.apple.CoreSimulator.SimDeviceType./, ''), runtime.replace(/^iOS /, '')));
        };

        var cur = function(devicename) {
            return function(runtime) {
                remove(devicename, runtime);
            };
        };

        for (var deviceName in druntimes) {
            var runtimes = druntimes[ deviceName ];
            var dname = filterDeviceName(deviceName);

            if (!(dname in name_id_map)) {
                continue;
            }

            runtimes.forEach(cur(dname));
        }
        return list;
    },
    //jscs:enable disallowUnusedParams

    //jscs:disable disallowUnusedParams
    showdevicetypes: function(args) {
        var output = '';
        this.getdevicetypes().forEach(function(device) {
            output += util.format('%s\n', device);
        });

        return output;
    },
    //jscs:enable disallowUnusedParams

    launch: function(app_path, devicetypeid, log, exit, setenv, argv) {
        var wait_for_debugger = false;
        var info_plist_path;
        var app_identifier;

        info_plist_path = path.join(app_path,'Info.plist');
        if (!fs.existsSync(info_plist_path)) {
            console.error(info_plist_path + ' file not found.');
            process.exit(1);
        }

        bplist.parseFile(info_plist_path, function(err, obj) {

            if (err) {
                // try to see if a regular plist parser will work
                if (!plist) {
                    plist = require('plist');
                }
                obj = plist.parse(fs.readFileSync(info_plist_path, 'utf8'));
                if (obj) {
                    app_identifier = obj.CFBundleIdentifier;
                } else {
                    throw err;
                }
            } else {
                app_identifier = obj[0].CFBundleIdentifier;
            }

            argv = argv || [];
            setenv = setenv || [];

            var environmentVariables = parseEnvironmentVariables(setenv);

            withInjectedEnvironmentVariablesToProcess(process, environmentVariables, function() {
                // get the deviceid from --devicetypeid
                // --devicetypeid is a string in the form "devicetype, runtime_version" (optional: runtime_version)
                var device = getDeviceFromDeviceTypeId(devicetypeid);

                // so now we have the deviceid, we can proceed
                simctl.extensions.start(device.id);
                simctl.install(device.id, app_path);
                simctl.launch(wait_for_debugger, device.id, app_identifier, argv);
                simctl.extensions.log(device.id, log);
                if (log) {
                    console.log(util.format('logPath: %s', path.resolve(log)));
                }
                if (exit) {
                    process.exit(0);
                }
            });
        });
    },

    install: function(app_path, devicetypeid, log, exit) {
        var wait_for_debugger = false;
        var info_plist_path;
        var app_identifier;

        info_plist_path = path.join(app_path,'Info.plist');
        if (!fs.existsSync(info_plist_path)) {
            console.error(info_plist_path + ' file not found.');
            process.exit(1);
        }

        bplist.parseFile(info_plist_path, function(err, obj) {

            if (err) {
                throw err;
            }

            app_identifier = obj[0].CFBundleIdentifier;

            // get the deviceid from --devicetypeid
            // --devicetypeid is a string in the form "devicetype, runtime_version" (optional: runtime_version)
            var device = getDeviceFromDeviceTypeId(devicetypeid);

            // so now we have the deviceid, we can proceed
            simctl.extensions.start(device.id);
            simctl.install(device.id, app_path);

            simctl.extensions.log(device.id, log);
            if (log) {
                console.log(util.format('logPath: %s', path.resolve(log)));
            }
            if (exit) {
                process.exit(0);
            }
        });
    },

    start: function(devicetypeid) {
        var device = getDeviceFromDeviceTypeId(devicetypeid);
        simctl.extensions.start(device.id);
    },

    _parseEnvironmentVariables: parseEnvironmentVariables

};

module.exports = lib;
