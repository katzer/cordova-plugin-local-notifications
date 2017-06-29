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
        if (runtime.available) {
            available_runtimes[ runtime.name ] = true;
        }
    });

    list.devices.some(function(deviceGroup) {
        deviceGroup.devices.some(function(device) {
            if (available_runtimes[deviceGroup.runtime]) {
                ret_obj = {
                    name: device.name,
                    id: device.id,
                    runtime: deviceGroup.runtime
                };
                return true;
            }
            return false;
        });
        return false;
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
        if (runtime.available) {
            available_runtimes[ runtime.name ] = true;
        }
    });

    list.devices.forEach(function(deviceGroup) {
        deviceGroup.devices.forEach(function(device) {
            var devicePropertyValue = device[deviceProperty];

            if (!runtimes[devicePropertyValue]) {
                runtimes[devicePropertyValue] = [];
            }
            if (availableOnly) {
                if (available_runtimes[deviceGroup.runtime]) {
                    runtimes[devicePropertyValue].push(deviceGroup.runtime);
                }
            } else {
                runtimes[devicePropertyValue].push(deviceGroup.runtime);
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
        if (deviceGroup.id === devicetype) {
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
    if (ret_obj.runtime.indexOf('iOS') === -1) {
        ret_obj.runtime = util.format('iOS %s', ret_obj.runtime);
    }

    // now find the deviceid (by runtime and devicename)
    var deviceid_found = list.devices.some(function(deviceGroup) {
        // found the runtime, now find the actual device matching devicename
        if (deviceGroup.runtime === ret_obj.runtime) {
            return deviceGroup.devices.some(function(device) {
                if (filterDeviceName(device.name) === filterDeviceName(ret_obj.name)) {
                    ret_obj.id = device.id;
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

// replace hyphens in iPad Pro name which differ in 'Device Types' and 'Devices'
function filterDeviceName(deviceName) {
    // replace hyphens in iPad Pro name which differ in 'Device Types' and 'Devices'
    if (deviceName.indexOf('iPad Pro') === 0) {
        return deviceName.replace(/\-/g, ' ').trim();
    }
    return deviceName;
}

var lib = {

    init: function() {
        if (!simctl) {
            simctl = require('simctl');
        }
        var output = simctl.check_prerequisites();
        if (output.code !== 0) {
            console.error(output.output);
            process.exit(2);
        }

        if (!bplist) {
            bplist = require('bplist-parser');
        }
    },

    //jscs:disable disallowUnusedParams
    showsdks: function(args) {
        var options = { silent: true, runtimes: true };
        var list = simctl.list(options).json;

        console.log('Simulator SDK Roots:');
        list.runtimes.forEach(function(runtime) {
            if (runtime.available) {
                console.log(util.format('"%s" (%s)', runtime.name, runtime.build));
                console.log(util.format('\t(unknown)'));
            }
        });
    },
    //jscs:enable disallowUnusedParams

    //jscs:disable disallowUnusedParams
    getdevicetypes: function(args) {
        var options = { silent: true };
        var list = simctl.list(options).json;

        var druntimes = findRuntimesGroupByDeviceProperty(list, 'name', true);
        var name_id_map = {};

        list.devicetypes.forEach(function(device) {
            name_id_map[ filterDeviceName(device.name) ] = device.id;
        });

        list = [];
        var remove = function(runtime) {
            // remove "iOS" prefix in runtime, remove prefix "com.apple.CoreSimulator.SimDeviceType." in id
            list.push(util.format('%s, %s', name_id_map[ deviceName ].replace(/^com.apple.CoreSimulator.SimDeviceType./, ''), runtime.replace(/^iOS /, '')));
        };

        for (var deviceName in druntimes) {
            var runtimes = druntimes[ deviceName ];
            var dname = filterDeviceName(deviceName);

            if (!(dname in name_id_map)) {
                continue;
            }
            runtimes.forEach(remove);
        }
        return list;
    },
    //jscs:enable disallowUnusedParams

    //jscs:disable disallowUnusedParams
    showdevicetypes: function(args) {
        this.getdevicetypes().forEach(function(device) {
            console.log(device);
        });
    },
    //jscs:enable disallowUnusedParams

    launch: function(app_path, devicetypeid, log, exit, argv) {
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
        var device = {};
        try {
            device = getDeviceFromDeviceTypeId(devicetypeid);
        } catch (e) {
            console.error(e);
        }

        simctl.extensions.start(device.id);
    }
};

module.exports = lib;
