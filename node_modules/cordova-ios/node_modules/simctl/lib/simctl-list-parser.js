/*
The MIT License (MIT)

Copyright (c) 2014 Shazron Abdullah.

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

var SimctlListParserMode = {
    'device': 0,
    'devicetype': 1,
    'runtime': 2
};

function SimctlListParser() {
    this._result = {
        'devices': [],
        'devicetypes': [],
        'runtimes': []
    };

    this._mode = null;
    this._deviceRuntime = null;
}

SimctlListParser.prototype.parse = function(text) {
    var _this = this;
    clearResult.apply(this);

    text.split(/\r?\n/).forEach(function(line) {
        parseLine.apply(_this, [line]);
    });
    changeMode.apply(this);

    return this._result;
};

SimctlListParser.prototype._clear = function() {
    clearResult.apply(this);
};

function clearResult() {
    this._result = {
        'devices': [],
        'devicetypes': [],
        'runtimes': []
    };
}

function changeMode(line) {
    endParse.apply(this);

    if (line && line.indexOf('Devices') !== -1) {
        this._mode = SimctlListParserMode.device;
    } else if (line && line.indexOf('Device Types') !== -1) {
        this._mode = SimctlListParserMode.devicetype;
    } else if (line && line.indexOf('Runtimes') !== -1) {
        this._mode = SimctlListParserMode.runtime;
    } else {
        this._mode = null;
    }
}

function endParse() {
    switch (this._mode) {
    case SimctlListParserMode.device:
        if (this._deviceRuntime) {
            this._result.devices.push(this._deviceRuntime);
        }
        break;
    }
}

function parseLine(line) {

    if (line.indexOf('==') === 0) {
        changeMode.apply(this, [line]);
        return;
    }

    switch (this._mode) {
        case SimctlListParserMode.device:
            parseDevice.apply(this, [line]);
            break;
        case SimctlListParserMode.devicetype:
            parseDeviceType.apply(this, [line]);
            break;
        case SimctlListParserMode.runtime:
            parseRuntime.apply(this, [line]);
            break;
    }
}

function isUUID(text) {
    var regExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regExp.test(text);
}

function parseDevice(line) {
    if (line.indexOf('--') === 0) {
        changeDeviceRuntime.apply(this, [line]);
        return;
    }

    // example: iPhone 4s (3717C817-6AD7-42B8-ACF3-405CB9E96375) (Shutdown) (unavailable)
    // example: iPad Pro (9.7 inch) (1C5590C8-8AE7-4C27-AD06-84C801702945) (Shutdown) (unavailable)
    // the last capture group might not be there if available
    // the first parenthesized group might be part of the name

    var available = false;

    var regExp = /([^)]*)\s\(([^)]+)\)/g;
    var items = [];
    var matches;

    while ((matches = regExp.exec(line)) !== null) {
        if (matches[1].length > 0) {
            if (isUUID(matches[2])) { // next is uuid, so push both name and id
                items.push(matches[1]);
                items.push(matches[2]);
            } else { // name is in the next paren. group (not UUID), use whole match
                items.push(matches[0]);
            }
        } else { // no match for name, just push second match
            items.push(matches[2]);
        }
    }

    if (items.length) {
        var obj = {
            'name': items[0].trim(),
            'id': items[1].trim(),
            'state': items[2].trim(),
            'available': items[3] === undefined
        };

        this._deviceRuntime.devices.push(obj);
    }
}

function changeDeviceRuntime(line) {
    if (this._deviceRuntime) {
        this._result.devices.push(this._deviceRuntime);
    }

    var runtime = line;
    var regExp = /--\s(.*)\s--/;
    var matches = regExp.exec(line);

    if (matches) {
        runtime = matches[1];
    }

    var obj = {
        'runtime': runtime,
        'devices': []
    };

    this._deviceRuntime = obj;
}

function parseDeviceType(line) {
    // Example: 'iPhone 4s (com.apple.CoreSimulator.SimDeviceType.iPhone-4s)'
    var regExp = /(.*)\(([^)]+)\)/;
    var matches = regExp.exec(line);

    if (matches) {
        var obj = {
            'name': matches[1].trim(),
            'id': matches[2].trim()
        };

        this._result.devicetypes.push(obj);
    }
}

function parseRuntime(line) {
    // Example:
    //     iOS 7.0 (7.0 - Unknown)
    //     (com.apple.CoreSimulator.SimRuntime.iOS-7-0) (unavailable, runtime path not found)
    // the last capture group might not be there if available
    var available = false;

    var regExp = /(.*)\(([^)]+)\)\s\(([^)]+)\)\s\(([^)]+)\)/;
    var matches = regExp.exec(line);
    if (!matches) {
        regExp = /(.*)\(([^)]+)\)\s\(([^)]+)\)/;
        matches = regExp.exec(line);
        available = true;
    }

    if (matches) {
        var obj = {
            'name': matches[1].trim(),
            'build': matches[2].trim(),
            'id': matches[3].trim(),
            'available': available
        };

        this._result.runtimes.push(obj);
    }
}

exports = module.exports = SimctlListParser;
