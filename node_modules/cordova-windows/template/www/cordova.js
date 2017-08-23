// Platform: windows
// 7c5fcc5a5adfbf3fb8ceaf36fbdd4bd970bd9c20
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var PLATFORM_VERSION_BUILD_LABEL = '5.0.0';
// file: src/scripts/require.js

/*jshint -W079 */
/*jshint -W020 */

var require,
    define;

(function () {
    var modules = {},
    // Stack of moduleIds currently being built.
        requireStack = [],
    // Map of module ID -> index into requireStack of modules currently being built.
        inProgressModules = {},
        SEPARATOR = ".";



    function build(module) {
        var factory = module.factory,
            localRequire = function (id) {
                var resultantId = id;
                //Its a relative path, so lop off the last portion and add the id (minus "./")
                if (id.charAt(0) === ".") {
                    resultantId = module.id.slice(0, module.id.lastIndexOf(SEPARATOR)) + SEPARATOR + id.slice(2);
                }
                return require(resultantId);
            };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: src/cordova.js
define("cordova", function(require, exports, module) {

// Workaround for Windows 10 in hosted environment case
// http://www.w3.org/html/wg/drafts/html/master/browsers.html#named-access-on-the-window-object
if (window.cordova && !(window.cordova instanceof HTMLElement)) {
    throw new Error("cordova already defined");
}


var channel = require('cordova/channel');
var platform = require('cordova/platform');


/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}


var cordova = {
    define:define,
    require:require,
    version:PLATFORM_VERSION_BUILD_LABEL,
    platformVersion:PLATFORM_VERSION_BUILD_LABEL,
    platformId:platform.id,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if( bNoDetach ) {
                documentEventHandlers[type].fire(evt);
            }
            else {
                setTimeout(function() {
                    // Fire deviceready on listeners that were registered before cordova.js was loaded.
                    if (type == 'deviceready') {
                        document.dispatchEvent(evt);
                    }
                    documentEventHandlers[type].fire(evt);
                }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, isSuccess, status, args, keepCallback) {
        try {
            var callback = cordova.callbacks[callbackId];
            if (callback) {
                if (isSuccess && status == cordova.callbackStatus.OK) {
                    callback.success && callback.success.apply(null, args);
                } else if (!isSuccess) {
                    callback.fail && callback.fail.apply(null, args);
                }
                /*
                else
                    Note, this case is intentionally not caught.
                    this can happen if isSuccess is true, but callbackStatus is NO_RESULT
                    which is used to remove a callback from the list without calling the callbacks
                    typically keepCallback is false in this case
                */
                // Clear callback if not expecting any more results
                if (!keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            }
        }
        catch (err) {
            var msg = "Error in " + (isSuccess ? "Success" : "Error") + " callbackId: " + callbackId + " : " + err;
            console && console.log && console.log(msg);
            cordova.fireWindowEvent("cordovacallbackerror", { 'message': msg });
            throw err;
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};


module.exports = cordova;

});

// file: src/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName(callee, argIndex) {
    return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs(spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i),
            cUpper = c.toUpperCase(),
            arg = args[i];
        // Asterix means allow anything.
        if (c == '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c == cUpper) {
            continue;
        }
        if (typeName != typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running unit tests.
        if (typeof jasmine == 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;


});

// file: src/common/base64.js
define("cordova/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function(arrayBuffer) {
    var array = new Uint8Array(arrayBuffer);
    return uint8ToBase64(array);
};

base64.toArrayBuffer = function(str) {
    var decodedStr = typeof atob != 'undefined' ? atob(str) : new Buffer(str,'base64').toString('binary');
    var arrayBuffer = new ArrayBuffer(decodedStr.length);
    var array = new Uint8Array(arrayBuffer);
    for (var i=0, len=decodedStr.length; i < len; i++) {
        array[i] = decodedStr.charCodeAt(i);
    }
    return arrayBuffer;
};

//------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64_12bit;

var b64_12bitTable = function() {
    b64_12bit = [];
    for (var i=0; i<64; i++) {
        for (var j=0; j<64; j++) {
            b64_12bit[i*64+j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function() { return b64_12bit; };
    return b64_12bit;
};

function uint8ToBase64(rawData) {
    var numBytes = rawData.byteLength;
    var output="";
    var segment;
    var table = b64_12bitTable();
    for (var i=0;i<numBytes-2;i+=3) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8) + rawData[i+2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i == 2) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i == 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: src/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber(obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    var needsProperty = false;
    try {
        obj[key] = value;
    } catch (e) {
        needsProperty = true;
    }
    // Getters can only be overridden by getters.
    if (needsProperty || obj[key] !== value) {
        utils.defineGetter(obj, key, function() {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function() {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
            var result = obj.path ? require(obj.path) : {};

            if (clobber) {
                // Clobber if it doesn't exist.
                if (typeof parent[key] === 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else if (typeof obj.path !== 'undefined') {
                    // If merging, merge properties onto parent, otherwise, clobber.
                    if (merge) {
                        recursiveMerge(parent[key], result);
                    } else {
                        assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                    }
                }
                result = parent[key];
            } else {
                // Overwrite if not currently defined.
                if (typeof parent[key] == 'undefined') {
                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                } else {
                    // Set result to what already exists, so we can build children into it if they exist.
                    result = parent[key];
                }
            }

            if (obj.children) {
                include(result, obj.children, clobber, merge);
            }
        } catch(e) {
            utils.alert('Exception building Cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function(objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function(objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function(objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function() {};

});

// file: src/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function checkSubscriptionArgument(argument) {
    if (typeof argument !== "function" && typeof argument.handleEvent !== "function") {
        throw new Error(
                "Must provide a function or an EventListener object " +
                "implementing the handleEvent interface."
        );
    }
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(eventListenerOrFunction, eventListener) {
    checkSubscriptionArgument(eventListenerOrFunction);
    var handleEvent, guid;

    if (eventListenerOrFunction && typeof eventListenerOrFunction === "object") {
        // Received an EventListener object implementing the handleEvent interface
        handleEvent = eventListenerOrFunction.handleEvent;
        eventListener = eventListenerOrFunction;
    } else {
        // Received a function to handle event
        handleEvent = eventListenerOrFunction;
    }

    if (this.state == 2) {
        handleEvent.apply(eventListener || this, this.fireArgs);
        return;
    }

    guid = eventListenerOrFunction.observer_guid;
    if (typeof eventListener === "object") {
        handleEvent = utils.close(eventListener, handleEvent);
    }

    if (!guid) {
        // First time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    handleEvent.observer_guid = guid;
    eventListenerOrFunction.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = handleEvent;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(eventListenerOrFunction) {
    checkSubscriptionArgument(eventListenerOrFunction);
    var handleEvent, guid, handler;

    if (eventListenerOrFunction && typeof eventListenerOrFunction === "object") {
        // Received an EventListener object implementing the handleEvent interface
        handleEvent = eventListenerOrFunction.handleEvent;
    } else {
        // Received a function to handle event
        handleEvent = eventListenerOrFunction;
    }

    guid = handleEvent.observer_guid;
    handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
// FIXME remove this
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: f:/coho/cordova-windows/cordova-js-src/confighelper.js
define("cordova/confighelper", function(require, exports, module) {

// config.xml and AppxManifest.xml wrapper (non-node ConfigParser analogue)
var configCache = {};
var utils = require("cordova/utils");

var isPhone = (cordova.platformId == 'windows') && WinJS.Utilities.isPhone;
var isWin10UWP = navigator.appVersion.indexOf('MSAppHost/3.0') !== -1;
var splashScreenTagName = isWin10UWP ? "SplashScreen" : (isPhone ? "m3:SplashScreen" : "m2:SplashScreen");

function XmlFile(text) {
    this.text = text;
}

XmlFile.prototype.loadTags = function (tagName) {
    var parser;
    if (!this.doc) {
        parser = new DOMParser();
        this.doc = parser.parseFromString(this.text, "application/xml");
    }

    var tags = this.doc.getElementsByTagName(tagName);
    return Array.prototype.slice.call(tags);
}

function Config(text) {
    XmlFile.apply(this, arguments);
    this.preferences = this.loadTags("preference");
}

function Manifest(text) {
    XmlFile.apply(this, arguments);
    this.splashScreen = this.loadTags(splashScreenTagName)[0];
}

utils.extend(Config, XmlFile);
utils.extend(Manifest, XmlFile);

function requestFile(filePath, success, error) {
    var xhr;

    if (typeof configCache[filePath] != 'undefined') {
        success(configCache[filePath]);
    }

    function fail(msg) {
        console.error(msg);

        if (error) {
            error(msg);
        }
    }

    var xhrStatusChangeHandler = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 304 || xhr.status == 0 /* file:// */) {
                configCache[filePath] = xhr.responseText;
                success(xhr.responseText);
            }
            else {
                fail('[Windows][cordova.js][xhrStatusChangeHandler] Could not XHR ' + filePath + ': ' + xhr.statusText);
            }
        }
    };

    xhr = new XMLHttpRequest();
    xhr.addEventListener("load", xhrStatusChangeHandler);

    try {
        xhr.open("get", filePath, true);
        xhr.send();
    } catch (e) {
        fail('[Windows][cordova.js][xhrFile] Could not XHR ' + filePath + ': ' + JSON.stringify(e));
    }
}

function readConfig(success, error) {
    requestFile("/config.xml", function (contents) {
        success(new Config(contents));
    }, error);
}

function readManifest(success, error) {
    requestFile("/AppxManifest.xml", function (contents) {
        success(new Manifest(contents));
    }, error);
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function (preferenceName) {
    var preferenceItem = this.preferences && this.preferences.filter(function (item) {
        return item.attributes['name'].value === preferenceName;
    });

    if (preferenceItem && preferenceItem[0] && preferenceItem[0].attributes && preferenceItem[0].attributes['value']) {
        return preferenceItem[0].attributes['value'].value;
    }
}

/**
 * Reads SplashScreen image path
 */
Manifest.prototype.getSplashScreenImagePath = function () {
    return this.splashScreen.attributes['Image'].value;
}

exports.readConfig = readConfig;
exports.readManifest = readManifest;

});

// file: f:/coho/cordova-windows/cordova-js-src/exec.js
define("cordova/exec", function(require, exports, module) {

/*jslint sloppy:true, plusplus:true*/
/*global require, module, console */

var cordova = require('cordova');
var execProxy = require('cordova/exec/proxy');

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */
module.exports = function (success, fail, service, action, args) {

    // Handle the case when we have an old version of splashscreen plugin to avoid the API calls failures
    if (service === 'SplashScreen') {
        var pluginsVersions = require("cordova/plugin_list").metadata;
        var splashscreenVersion = pluginsVersions['cordova-plugin-splashscreen'];
        var MIN_SPLASHSCREEN_SUPPORTED_VER = 4;
        if (splashscreenVersion && ((parseInt(splashscreenVersion.split('.')[0], 10) || 0) < MIN_SPLASHSCREEN_SUPPORTED_VER)) {
            console.log('Warning: A more recent version of cordova-plugin-splashscreen has been hooked into for compatibility reasons. Update the plugin to version >= 4.');

            var platformSplashscreen = require('cordova/splashscreen');
            // Replace old plugin proxy with the platform's one
            require('cordova/exec/proxy').add(service, platformSplashscreen);
        }
    }

    var proxy = execProxy.get(service, action),
        callbackId,
        onSuccess,
        onError;

    args = args || [];

    if (proxy) {
        callbackId = service + cordova.callbackId++;
        // console.log("EXEC:" + service + " : " + action);
        if (typeof success === "function" || typeof fail === "function") {
            cordova.callbacks[callbackId] = {success: success, fail: fail};
        }
        try {
            // callbackOptions param represents additional optional parameters command could pass back, like keepCallback or
            // custom callbackId, for example {callbackId: id, keepCallback: true, status: cordova.callbackStatus.JSON_EXCEPTION }
            // CB-5806 [Windows8] Add keepCallback support to proxy
            onSuccess = function (result, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in cordova.callbackFromNative
                // see CB-8996 Mobilespec app hang on windows
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = cordova.callbackStatus.OK;
                }
                cordova.callbackSuccess(callbackOptions.callbackId || callbackId,
                    {
                        status: callbackStatus,
                        message: result,
                        keepCallback: callbackOptions.keepCallback || false
                    });
            };
            onError = function (err, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in cordova.callbackFromNative
                // see CB-8996 Mobilespec app hang on windows
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = cordova.callbackStatus.OK;
                }
                cordova.callbackError(callbackOptions.callbackId || callbackId,
                    {
                        status: callbackStatus,
                        message: err,
                        keepCallback: callbackOptions.keepCallback || false
                    });
            };
            proxy(onSuccess, onError, args);

        } catch (e) {
            console.log("Exception calling native with command :: " + service + " :: " + action  + " ::exception=" + e);
        }
    } else {
        if (typeof fail === "function") {
            fail("Missing Command Error");
        }
    }
};

});

// file: src/common/exec/proxy.js
define("cordova/exec/proxy", function(require, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: src/common/init.js
define("cordova/init", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var pluginloader = require('cordova/pluginloader');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

function logUnfiredChannels(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state != 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function() {
    if (channel.onDeviceReady.state != 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator(origNavigator) {
    var CordovaNavigator = function() {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] == 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            }
            else {
                (function(k) {
                    utils.defineGetterSetter(newNavigator,key,function() {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}

if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function(){}
    };
}
if (!window.console.warn) {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

modulemapper.clobbers('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

// Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
// The delay allows the attached modules to be defined before the plugin loader looks for them.
setTimeout(function() {
    pluginloader.load(function() {
        channel.onPluginsReady.fire();
    });
}, 0);

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function() {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function() {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);


});

// file: src/common/init_b.js
define("cordova/init_b", function(require, exports, module) {

var channel = require('cordova/channel');
var cordova = require('cordova');
var modulemapper = require('cordova/modulemapper');
var platform = require('cordova/platform');
var pluginloader = require('cordova/pluginloader');
var utils = require('cordova/utils');

var platformInitChannelsArray = [channel.onDOMContentLoaded, channel.onNativeReady, channel.onPluginsReady];

// setting exec
cordova.exec = require('cordova/exec');

function logUnfiredChannels(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if (arr[i].state != 2) {
            console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function() {
    if (channel.onDeviceReady.state != 2) {
        console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

// Replace navigator before any modules are required(), to ensure it happens as soon as possible.
// We replace it so that properties that can't be clobbered can instead be overridden.
function replaceNavigator(origNavigator) {
    var CordovaNavigator = function() {};
    CordovaNavigator.prototype = origNavigator;
    var newNavigator = new CordovaNavigator();
    // This work-around really only applies to new APIs that are newer than Function.bind.
    // Without it, APIs such as getGamepads() break.
    if (CordovaNavigator.bind) {
        for (var key in origNavigator) {
            if (typeof origNavigator[key] == 'function') {
                newNavigator[key] = origNavigator[key].bind(origNavigator);
            }
            else {
                (function(k) {
                    utils.defineGetterSetter(newNavigator,key,function() {
                        return origNavigator[k];
                    });
                })(key);
            }
        }
    }
    return newNavigator;
}
if (window.navigator) {
    window.navigator = replaceNavigator(window.navigator);
}

if (!window.console) {
    window.console = {
        log: function(){}
    };
}
if (!window.console.warn) {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onActivated = cordova.addDocumentEventHandler('activated');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any cordova JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

// Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
// The delay allows the attached modules to be defined before the plugin loader looks for them.
setTimeout(function() {
    pluginloader.load(function() {
        channel.onPluginsReady.fire();
    });
}, 0);

/**
 * Create all cordova objects once native side is ready.
 */
channel.join(function() {
    modulemapper.mapModules(window);

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onCordovaReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and cordova info has been received from native
    // side.
    channel.join(function() {
        require('cordova').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);

});

// file: src/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder'),
    moduleMap = define.moduleMap,
    symbolList,
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();


});

// file: src/common/modulemapper_b.js
define("cordova/modulemapper_b", function(require, exports, module) {

var builder = require('cordova/builder'),
    symbolList = [],
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.reset();


});

// file: f:/coho/cordova-windows/cordova-js-src/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: 'windows',
    bootstrap:function() {
        var cordova = require('cordova'),
            exec = require('cordova/exec'),
            channel = cordova.require('cordova/channel'),
            platform = require('cordova/platform'),
            modulemapper = require('cordova/modulemapper'),
            utils = require('cordova/utils');

        modulemapper.clobbers('cordova/exec/proxy', 'cordova.commandProxy');

        // we will make sure we get this channel
        // TODO: remove this once other platforms catch up.
        if(!channel.onActivated) {
            channel.onActivated = cordova.addDocumentEventHandler('activated');
        }
        channel.onNativeReady.fire();

        var onWinJSReady = function () {
            var app = WinJS.Application,
                splashscreen = require('cordova/splashscreen'),
                configHelper = require('cordova/confighelper');

            modulemapper.clobbers('cordova/splashscreen', 'navigator.splashscreen');

            var checkpointHandler = function checkpointHandler() {
                cordova.fireDocumentEvent('pause',null,true);
            };

            var resumingHandler = function resumingHandler() {
                cordova.fireDocumentEvent('resume',null,true);
            };

            // activation args are available via the activated event
            // OR cordova.require('cordova/platform').activationContext
            // activationContext:{type: actType, args: args};
            var activationHandler = function (e) {
                // Making all the details available as activationContext
                platform.activationContext = utils.clone(e.detail);         /* CB-10653 to avoid losing detail properties for some activation kinds */
                platform.activationContext.raw = e.detail;                  /* CB-11522 to preserve types */
                platform.activationContext.args = e.detail.arguments;       /* for backwards compatibility */

                function makePromise(fn) {
                    return new WinJS.Promise(function init(completeDispatch, errorDispatch) {
                        fn(function successCb(results) {
                            completeDispatch(results);
                        }, function errorCb(error) {
                            errorDispatch(error);
                        });
                    });
                }

                if (e.detail.previousExecutionState === Windows.ApplicationModel.Activation.ApplicationExecutionState.running
                        || e.detail.previousExecutionState === Windows.ApplicationModel.Activation.ApplicationExecutionState.suspended) {
                    cordova.fireDocumentEvent('activated', platform.activationContext, true);
                    return;
                }

                var manifest;

                e.setPromise(makePromise(configHelper.readManifest).then(function (manifestTmp) {
                    manifest = manifestTmp;
                    return makePromise(configHelper.readConfig);
                })
                .then(function (config) {
                    splashscreen.firstShow(config, manifest, e);
                }).then(function () {
                    // Avoids splashimage flicker on Windows Phone 8.1/10
                    return WinJS.Promise.timeout();
                }).then(function () {
                    cordova.fireDocumentEvent('activated', platform.activationContext, true);
                }));
            };

            // CB-12193 CoreWindow and some WinRT APIs are not available in webview
            var isCoreWindowAvailable = false;
            try {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
                isCoreWindowAvailable = true;
            } catch (e) { }

            if (isCoreWindowAvailable) {
                app.addEventListener("checkpoint", checkpointHandler);
                app.addEventListener("activated", activationHandler, false);
                Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", resumingHandler, false);

                injectBackButtonHandler();

                app.start();
            }
        };

        function appendScript(scriptElem, loadedCb) {
            scriptElem.addEventListener("load", loadedCb);
            document.head.appendChild(scriptElem);
        }

        if (!window.WinJS) {
            var scriptElem = document.createElement("script");

            if (navigator.appVersion.indexOf('MSAppHost/3.0') !== -1) {
                // Windows 10 UWP
                scriptElem.src = '/www/WinJS/js/base.js';
            } else if (navigator.appVersion.indexOf("Windows Phone 8.1;") !== -1) {
                // windows phone 8.1 + Mobile IE 11
                scriptElem.src = "//Microsoft.Phone.WinJS.2.1/js/base.js";
            } else if (navigator.appVersion.indexOf("MSAppHost/2.0;") !== -1) {
                // windows 8.1 + IE 11
                scriptElem.src = "//Microsoft.WinJS.2.0/js/base.js";
            }
            scriptElem.addEventListener("load", onWinJSReady);
            document.head.appendChild(scriptElem);
        }
        else {
            onWinJSReady();
        }
    }
};

function injectBackButtonHandler() {

    var app = WinJS.Application;

    // create document event handler for backbutton
    var backButtonChannel = cordova.addDocumentEventHandler('backbutton');

    // preserve reference to original backclick implementation
    // `false` as a result will trigger system default behaviour
    var defaultBackButtonHandler = app.onbackclick || function () { return false; };

    var backRequestedHandler = function backRequestedHandler(evt) {
        // check if listeners are registered, if yes use custom backbutton event
        // NOTE: On Windows Phone 8.1 backbutton handlers have to throw an exception in order to exit the app
        if (backButtonChannel.numHandlers >= 1) {
            try {
                cordova.fireDocumentEvent('backbutton', evt, true);
                evt.handled = true; // Windows Mobile requires handled to be set as well;
                return true;
            }
            catch (e) {
                return false;
            }
        }
        // if not listeners are active, use default implementation (backwards compatibility)
        else {
            return defaultBackButtonHandler.apply(app, arguments);
        }
    };

    // Only load this code if we're running on Win10 in a non-emulated app frame, otherwise crash \o/
    if (navigator.appVersion.indexOf('MSAppHost/3.0') !== -1) { // Windows 10 UWP (PC/Tablet/Phone)
        var navigationManager = Windows.UI.Core.SystemNavigationManager.getForCurrentView();
        // Inject a listener for the backbutton on the document.
        backButtonChannel.onHasSubscribersChange = function () {
            // If we just attached the first handler or detached the last handler,
            // let native know we need to override the back button.
            navigationManager.appViewBackButtonVisibility = (this.numHandlers > 0) ?
                Windows.UI.Core.AppViewBackButtonVisibility.visible :
                Windows.UI.Core.AppViewBackButtonVisibility.collapsed;
        };

        navigationManager.addEventListener("backrequested", backRequestedHandler, false);
    } else { // Windows 8.1 Phone
        // inject new back button handler
        app.onbackclick = backRequestedHandler;
    }
}

});

// file: src/common/pluginloader.js
define("cordova/pluginloader", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');
var urlutil = require('cordova/urlutil');

// Helper function to inject a <script> tag.
// Exported for testing.
exports.injectScript = function(url, onload, onerror) {
    var script = document.createElement("script");
    // onload fires even when script fails loads with an error.
    script.onload = onload;
    // onerror fires for malformed URLs.
    script.onerror = onerror;
    script.src = url;
    document.head.appendChild(script);
};

function injectIfNecessary(id, url, onload, onerror) {
    onerror = onerror || onload;
    if (id in define.moduleMap) {
        onload();
    } else {
        exports.injectScript(url, function() {
            if (id in define.moduleMap) {
                onload();
            } else {
                onerror();
            }
        }, onerror);
    }
}

function onScriptLoadingComplete(moduleList, finishPluginLoading) {
    // Loop through all the plugins and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) {
        if (module.clobbers && module.clobbers.length) {
            for (var j = 0; j < module.clobbers.length; j++) {
                modulemapper.clobbers(module.id, module.clobbers[j]);
            }
        }

        if (module.merges && module.merges.length) {
            for (var k = 0; k < module.merges.length; k++) {
                modulemapper.merges(module.id, module.merges[k]);
            }
        }

        // Finally, if runs is truthy we want to simply require() the module.
        if (module.runs) {
            modulemapper.runs(module.id);
        }
    }

    finishPluginLoading();
}

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
// This function is only called if the really is a plugins array that isn't empty.
// Otherwise the onerror response handler will just call finishPluginLoading().
function handlePluginsObject(path, moduleList, finishPluginLoading) {
    // Now inject the scripts.
    var scriptCounter = moduleList.length;

    if (!scriptCounter) {
        finishPluginLoading();
        return;
    }
    function scriptLoadedCallback() {
        if (!--scriptCounter) {
            onScriptLoadingComplete(moduleList, finishPluginLoading);
        }
    }

    for (var i = 0; i < moduleList.length; i++) {
        injectIfNecessary(moduleList[i].id, path + moduleList[i].file, scriptLoadedCallback);
    }
}

function findCordovaPath() {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = '/cordova.js';
    for (var n = scripts.length-1; n>-1; n--) {
        var src = scripts[n].src.replace(/\?.*$/, ''); // Strip any query param (CB-6007).
        if (src.indexOf(term) == (src.length - term.length)) {
            path = src.substring(0, src.length - term.length) + '/';
            break;
        }
    }
    return path;
}

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
exports.load = function(callback) {
    var pathPrefix = findCordovaPath();
    if (pathPrefix === null) {
        console.log('Could not find cordova.js script tag. Plugin loading may fail.');
        pathPrefix = '';
    }
    injectIfNecessary('cordova/plugin_list', pathPrefix + 'cordova_plugins.js', function() {
        var moduleList = require("cordova/plugin_list");
        handlePluginsObject(pathPrefix, moduleList, callback);
    }, callback);
};


});

// file: src/common/pluginloader_b.js
define("cordova/pluginloader_b", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
function handlePluginsObject(moduleList) {
    // if moduleList is not defined or empty, we've nothing to do
    if (!moduleList || !moduleList.length) {
        return;
    }

    // Loop through all the modules and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) {
        if (module.clobbers && module.clobbers.length) {
            for (var j = 0; j < module.clobbers.length; j++) {
                modulemapper.clobbers(module.id, module.clobbers[j]);
            }
        }

        if (module.merges && module.merges.length) {
            for (var k = 0; k < module.merges.length; k++) {
                modulemapper.merges(module.id, module.merges[k]);
            }
        }

        // Finally, if runs is truthy we want to simply require() the module.
        if (module.runs) {
            modulemapper.runs(module.id);
        }
    }
}

// Loads all plugins' js-modules. Plugin loading is syncronous in browserified bundle
// but the method accepts callback to be compatible with non-browserify flow.
// onDeviceReady is blocked on onPluginsReady. onPluginsReady is fired when there are
// no plugins to load, or they are all done.
exports.load = function(callback) {
    var moduleList = require("cordova/plugin_list");
    handlePluginsObject(moduleList);

    callback();
};


});

// file: f:/coho/cordova-windows/cordova-js-src/splashscreen.js
define("cordova/splashscreen", function(require, exports, module) {

var isWp81 = navigator.appVersion.indexOf("Windows Phone 8.1") !== -1;
var isWp10 = navigator.appVersion.indexOf("Windows Phone 10") !== -1;
var isPhoneDevice = isWp81 || isWp10;
var isWin10UWP = navigator.appVersion.indexOf('MSAppHost/3.0') !== -1;
var isHosted = window.location.protocol.indexOf('http') === 0;
var isMsAppxWeb = window.location.protocol.indexOf('ms-appx-web') === 0;

var schema = (isHosted || isWin10UWP && isMsAppxWeb) ? 'ms-appx-web' : 'ms-appx';
var fileName = isWp81 ? 'splashscreenphone.png' : 'splashscreen.png';
var splashImageSrc = schema + ':///images/' + fileName;

var splashElement = null,
    extendedSplashImage = null,
    extendedSplashProgress = null,
    extendedSplashImageHelper = null;

//// <Config and initialization>
var DEFAULT_SPLASHSCREEN_DURATION = 3000, // in milliseconds
    DEFAULT_FADE_DURATION = 500, // in milliseconds
    FPS = 60, // frames per second used by requestAnimationFrame
    PROGRESSRING_HEIGHT = 40,
    PROGRESSRING_BOTTOM_MARGIN = 10; // needed for windows 10 min height window

var bgColor = "#464646",
    titleInitialBgColor,
    titleBgColor,
    autoHideSplashScreen = true,
    splashScreenDelay = DEFAULT_SPLASHSCREEN_DURATION,
    fadeSplashScreen = true,
    fadeSplashScreenDuration = DEFAULT_FADE_DURATION,
    showSplashScreenSpinner = true,
    splashScreenSpinnerColor; // defaults to system accent color

var effectiveSplashDuration;

function readBoolFromCfg(preferenceName, defaultValue, cfg) {
    var value = cfg.getPreferenceValue(preferenceName);
    if (typeof value !== 'undefined') {
        return value === 'true';
    } else {
        return defaultValue;
    }
}

function readPreferencesFromCfg(cfg, manifest) {
    try {
        // Update splashscreen image path to match application manifest
        splashImageSrc = schema + ':///' + manifest.getSplashScreenImagePath().replace(/\\/g, '/');

        bgColor = cfg.getPreferenceValue('SplashScreenBackgroundColor') || bgColor;
        bgColor = bgColor.replace('0x', '#').replace('0X', '#');
        if (bgColor.length > 7) {
            // Remove aplha
            bgColor = bgColor.slice(0, 1) + bgColor.slice(3, bgColor.length);
        }

        titleBgColor = {
            a: 255,
            r: parseInt(bgColor.slice(1, 3), 16),
            g: parseInt(bgColor.slice(3, 5), 16),
            b: parseInt(bgColor.slice(5, 7), 16)
        };

        autoHideSplashScreen = readBoolFromCfg('AutoHideSplashScreen', autoHideSplashScreen, cfg);
        splashScreenDelay = cfg.getPreferenceValue('SplashScreenDelay') || splashScreenDelay;

        fadeSplashScreen = readBoolFromCfg('FadeSplashScreen', fadeSplashScreen, cfg);
        fadeSplashScreenDuration = cfg.getPreferenceValue('FadeSplashScreenDuration') || fadeSplashScreenDuration;

        showSplashScreenSpinner = readBoolFromCfg('ShowSplashScreenSpinner', showSplashScreenSpinner, cfg);
        splashScreenSpinnerColor = cfg.getPreferenceValue('SplashScreenSpinnerColor');

        effectiveSplashDuration = Math.max(splashScreenDelay - fadeSplashScreenDuration, 0);
    } catch (e) {
        var msg = '[Windows][SplashScreen] Error occured on loading preferences from config.xml: ' + JSON.stringify(e);
        console.error(msg);
    }
}

function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

function init(config, manifest) {
    readPreferencesFromCfg(config, manifest);

    var splashscreenStyles = document.createElement("link");
    splashscreenStyles.rel = 'stylesheet';
    splashscreenStyles.type = 'text/css';
    splashscreenStyles.href = '/www/css/splashscreen.css';
    document.head.appendChild(splashscreenStyles);

    // Windows 8.1 Desktop
    //<div id='extendedSplashScreen' class='extendedSplashScreen hidden'>
    //    <img id='extendedSplashImage' src='/images/SplashScreen.png' alt='Splash screen image' />
    //    <progress id='extendedSplashProgress' class='win-medium win-ring'></progress>
    //</div>
    splashElement = document.createElement('div');
    splashElement.id = 'extendedSplashScreen';
    splashElement.classList.add('extendedSplashScreen');
    splashElement.classList.add('hidden');
    splashElement.style.backgroundColor = bgColor;

    extendedSplashImageHelper = document.createElement('span');
    extendedSplashImageHelper.id = 'extendedSplashImageHelper';

    extendedSplashImage = document.createElement('img');
    extendedSplashImage.id = 'extendedSplashImage';
    extendedSplashImage.alt = 'Splash screen image';

    // Disabling image drag
    var draggableAttr = document.createAttribute('draggable');
    draggableAttr.value = 'false';
    extendedSplashImage.attributes.setNamedItem(draggableAttr);

    // This helps prevent flickering by making the system wait until your image has been rendered 
    // before it switches to your extended splash screen.
    var onloadAttr = document.createAttribute('onload');
    onloadAttr.value = '';
    extendedSplashImage.attributes.setNamedItem(onloadAttr);
    extendedSplashImage.src = splashImageSrc;

    extendedSplashProgress = document.createElement('progress');
    extendedSplashProgress.id = 'extendedSplashProgress';
    extendedSplashProgress.classList.add('win-medium');
    extendedSplashProgress.classList.add('win-ring');

    extendedSplashImage.src = splashImageSrc;

    if (isPhoneDevice) {
        extendedSplashImage.classList.add('phone');
    }

    if (isWp81) {
        extendedSplashProgress.classList.add('extended-splash-progress-phone');
    } else if (isWp10) {   
        extendedSplashProgress.classList.add('extended-splash-progress-wp10');
    } else {
        extendedSplashProgress.classList.add('extended-splash-progress-desktop');
    }

    if (!showSplashScreenSpinner) {
        extendedSplashProgress.classList.add('hidden');
    }
    if (typeof splashScreenSpinnerColor !== 'undefined') {
        extendedSplashProgress.style.color = splashScreenSpinnerColor;
    }

    splashElement.appendChild(extendedSplashImageHelper);
    splashElement.appendChild(extendedSplashImage);
    splashElement.appendChild(extendedSplashProgress);

    document.body.appendChild(splashElement);
}
//// </Config and initialization>

//// <UI>
var origOverflow, origZooming;

function disableUserInteraction() {
    origOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    origZooming = document.body.style['-ms-content-zooming'];
    document.body.style['-ms-content-zooming'] = 'none';
}

function enableUserInteraction() {
    document.documentElement.style.overflow = origOverflow;
    document.body.style['-ms-content-zooming'] = origZooming;
}

// Enter fullscreen mode
function enterFullScreen() {
    if (Windows.UI.ViewManagement.ApplicationViewBoundsMode) { // else crash on 8.1
        var view = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
        view.setDesiredBoundsMode(Windows.UI.ViewManagement.ApplicationViewBoundsMode.useCoreWindow);
        view.suppressSystemOverlays = true;
    }
}

// Exit fullscreen mode
function exitFullScreen() {
    if (Windows.UI.ViewManagement.ApplicationViewBoundsMode) { // else crash on 8.1
        var view = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
        view.setDesiredBoundsMode(Windows.UI.ViewManagement.ApplicationViewBoundsMode.useVisible);
        view.suppressSystemOverlays = false;
    }
}

// Make title bg color match splashscreen bg color
function colorizeTitleBar() {
    var appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
    if (appView.titleBar) {
        titleInitialBgColor = appView.titleBar.backgroundColor;

        appView.titleBar.backgroundColor = titleBgColor;
        appView.titleBar.buttonBackgroundColor = titleBgColor;
    }
}

// Revert title bg color
function revertTitleBarColor() {
    var appView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();
    if (appView.titleBar) {
        appView.titleBar.backgroundColor = titleInitialBgColor;
        appView.titleBar.buttonBackgroundColor = titleInitialBgColor;
    }
}

// Displays the extended splash screen. Pass the splash screen object retrieved during activation.
function show() {
    enterFullScreen();
    colorizeTitleBar();
    disableUserInteraction();
    positionControls();

    // Once the extended splash screen is setup, apply the CSS style that will make the extended splash screen visible.
    WinJS.Utilities.removeClass(splashElement, 'hidden');
}

function positionControls() {
    if (isWp10) {
        // Resize happens twice sometimes, ensure the image is properly positioned
        if (splash.imageLocation.y !== 0) {
            if (isPortrait()) {
                extendedSplashProgress.style.top = window.innerHeight * (2/3 + 1/6) - PROGRESSRING_HEIGHT / 2 + 'px';
            } else {
                extendedSplashProgress.style.top = Math.min(window.innerHeight - PROGRESSRING_HEIGHT - PROGRESSRING_BOTTOM_MARGIN, splash.imageLocation.y + splash.imageLocation.height + 32) + 'px';
            }
        }
        return;
    }

    // Position the extended splash screen image in the same location as the system splash screen image.
    if (isPhoneDevice) {
        extendedSplashImage.style.top = 0;
        extendedSplashImage.style.left = 0;
    } else {
        // Avoiding subtle image shift on desktop
        extendedSplashImage.style.left = splash.imageLocation.x + 'px';
        extendedSplashImage.style.top = splash.imageLocation.y + 'px';
    }

    if (!isWp81) {
        extendedSplashImage.style.height = splash.imageLocation.height + 'px';
        extendedSplashImage.style.width = splash.imageLocation.width + 'px';

        extendedSplashProgress.style.marginTop = Math.min(window.innerHeight - PROGRESSRING_HEIGHT - PROGRESSRING_BOTTOM_MARGIN, splash.imageLocation.y + splash.imageLocation.height + 32) + 'px';
    }
}

// Updates the location of the extended splash screen image. Should be used to respond to window size changes.
function updateImageLocation() {
    if (isVisible()) {
        positionControls();
    }
}

// Checks whether the extended splash screen is visible and returns a boolean.
function isVisible() {
    return !(WinJS.Utilities.hasClass(splashElement, 'hidden'));
}

function fadeOut(el, duration, finishCb) {
    var opacityDelta = 1 / (FPS * duration / 1000);
    el.style.opacity = 1;

    (function fade() {
        if ((el.style.opacity -= opacityDelta) < 0) {
            finishCb();
        } else {
            requestAnimationFrame(fade);
        }
    })();
}

// Removes the extended splash screen if it is currently visible.
function hide() {
    if (isVisible()) {
        var hideFinishCb = function () {
            WinJS.Utilities.addClass(splashElement, 'hidden');
            splashElement.style.opacity = 1;
            enableUserInteraction();
            exitFullScreen();
        }

        // Color reversion before fading is over looks better:
        revertTitleBarColor();

        // https://issues.apache.org/jira/browse/CB-11751
        // This can occur when we directly replace whole document.body f.e. in a router.
        // Note that you should disable the splashscreen in this case or update a container element instead.
        if (document.getElementById(splashElement.id) == null) {
            hideFinishCb();
            return;
        }

        if (fadeSplashScreen) {
            fadeOut(splashElement, fadeSplashScreenDuration, hideFinishCb);
        } else {
            hideFinishCb();
        }
    }
}
//// </UI>

//// <Events>
var splash = null; // Variable to hold the splash screen object. 
var coordinates = { x: 0, y: 0, width: 0, height: 0 }; // Object to store splash screen image coordinates. It will be initialized during activation. 

function activated(eventObject) {
    // Retrieve splash screen object 
    splash = eventObject.detail.splashScreen;

    // Retrieve the window coordinates of the splash screen image. 
    coordinates = splash.imageLocation;

    // Register an event handler to be executed when the splash screen has been dismissed. 
    splash.addEventListener('dismissed', onSplashScreenDismissed, false);

    // Listen for window resize events to reposition the extended splash screen image accordingly. 
    // This is important to ensure that the extended splash screen is formatted properly in response to snapping, unsnapping, rotation, etc... 
    window.addEventListener('resize', onResize, false);
}

function onSplashScreenDismissed() {
    // Include code to be executed when the system has transitioned from the splash screen to the extended splash screen (application's first view). 
    if (autoHideSplashScreen) {
        window.setTimeout(hide, effectiveSplashDuration);
    }
}

function onResize() {
    // Safely update the extended splash screen image coordinates. This function will be fired in response to snapping, unsnapping, rotation, etc... 
    if (splash) {
        // Update the coordinates of the splash screen image. 
        coordinates = splash.imageLocation;
        updateImageLocation(splash);
    }
}
//// </Events>

module.exports = {
    firstShow: function (config, manifest, activatedEventArgs) {
        init(config, manifest);
        activated(activatedEventArgs);

        if (!isVisible() && (splashScreenDelay > 0 || !autoHideSplashScreen)) {
            show();
        }
    },
    show: function () {
        if (!isVisible()) {
            show();
        }
    },
    hide: function () {
        if (isVisible()) {
            hide();
        }
    }
};

});

// file: src/common/urlutil.js
define("cordova/urlutil", function(require, exports, module) {


/**
 * For already absolute URLs, returns what is passed in.
 * For relative URLs, converts them to absolute ones.
 */
exports.makeAbsolute = function makeAbsolute(url) {
    var anchorEl = document.createElement('a');
    anchorEl.href = url;
    return anchorEl.href;
};


});

// file: src/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = Array.isArray ||
                function(a) {return utils.typeName(a) == 'Array';};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return (d instanceof Date);
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        // https://issues.apache.org/jira/browse/CB-11522 'unknown' type may be returned in
        // custom protocol activation case on Windows Phone 8.1 causing "No such interface supported" exception
        // on cloning.
        if((!(i in retVal) || retVal[i] != obj[i]) && typeof obj[i] != 'undefined' && typeof obj[i] != 'unknown') {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    return function() {
        var args = params || arguments;
        return func.apply(context, args);
    };
};

//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};


/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {

        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};





});

window.cordova = require('cordova');
// file: src/scripts/bootstrap.js

require('cordova/init');

})();