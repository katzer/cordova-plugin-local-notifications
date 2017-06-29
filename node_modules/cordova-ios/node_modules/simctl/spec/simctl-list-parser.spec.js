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

var SimCtlListParser = require('../lib/simctl-list-parser');

describe('list-parser device type tests', function() {

    var parser = new SimCtlListParser();
    var header = '== Device Types ==';

    beforeEach(function() {
        parser._clear();
    });

    afterEach(function() {
    });

    it('test parse iPhones', function() {
        var lines = [
            header,
            'iPhone 4s (com.apple.CoreSimulator.SimDeviceType.iPhone-4s)',            
            'iPhone 5 (com.apple.CoreSimulator.SimDeviceType.iPhone-5)',
            'iPhone 5s (com.apple.CoreSimulator.SimDeviceType.iPhone-5s)',
            'iPhone 6 (com.apple.CoreSimulator.SimDeviceType.iPhone-6)',
            'iPhone 6 Plus (com.apple.CoreSimulator.SimDeviceType.iPhone-6-Plus)',
            'iPhone 6s (com.apple.CoreSimulator.SimDeviceType.iPhone-6s)',
            'iPhone 6s Plus (com.apple.CoreSimulator.SimDeviceType.iPhone-6s-Plus)',
            'iPhone 7 (com.apple.CoreSimulator.SimDeviceType.iPhone-7)',
            'iPhone 7 Plus (com.apple.CoreSimulator.SimDeviceType.iPhone-7-Plus)',
            'iPhone SE (com.apple.CoreSimulator.SimDeviceType.iPhone-SE)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(10);
        expect(result.devices.length).toEqual(0);
        expect(result.runtimes.length).toEqual(0);

        expect(result.devicetypes[0].name).toEqual('iPhone 4s');
        expect(result.devicetypes[0].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-4s');
        expect(result.devicetypes[1].name).toEqual('iPhone 5');
        expect(result.devicetypes[1].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-5');
        expect(result.devicetypes[2].name).toEqual('iPhone 5s');
        expect(result.devicetypes[2].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-5s');
        expect(result.devicetypes[3].name).toEqual('iPhone 6');
        expect(result.devicetypes[3].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-6');
        expect(result.devicetypes[4].name).toEqual('iPhone 6 Plus');
        expect(result.devicetypes[4].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-6-Plus');
        expect(result.devicetypes[5].name).toEqual('iPhone 6s');
        expect(result.devicetypes[5].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-6s');
        expect(result.devicetypes[6].name).toEqual('iPhone 6s Plus');
        expect(result.devicetypes[6].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-6s-Plus');
        expect(result.devicetypes[7].name).toEqual('iPhone 7');
        expect(result.devicetypes[7].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-7');
        expect(result.devicetypes[8].name).toEqual('iPhone 7 Plus');
        expect(result.devicetypes[8].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-7-Plus');
        expect(result.devicetypes[9].name).toEqual('iPhone SE');
        expect(result.devicetypes[9].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPhone-SE');
    });

    it('test parse iPads', function() {
        var lines = [
            header,
            'iPad 2 (com.apple.CoreSimulator.SimDeviceType.iPad-2)',
            'iPad Retina (com.apple.CoreSimulator.SimDeviceType.iPad-Retina)',
            'iPad Air (com.apple.CoreSimulator.SimDeviceType.iPad-Air)',
            'iPad Air 2 (com.apple.CoreSimulator.SimDeviceType.iPad-Air-2)',
            'iPad Pro (9.7-inch) (com.apple.CoreSimulator.SimDeviceType.iPad-Pro--9-7-inch-)',
            'iPad Pro (12.9-inch) (com.apple.CoreSimulator.SimDeviceType.iPad-Pro)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(6);
        expect(result.devices.length).toEqual(0);
        expect(result.runtimes.length).toEqual(0);

        expect(result.devicetypes[0].name).toEqual('iPad 2');
        expect(result.devicetypes[0].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-2');
        expect(result.devicetypes[1].name).toEqual('iPad Retina');
        expect(result.devicetypes[1].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-Retina');
        expect(result.devicetypes[2].name).toEqual('iPad Air');
        expect(result.devicetypes[2].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-Air');
        expect(result.devicetypes[3].name).toEqual('iPad Air 2');
        expect(result.devicetypes[3].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-Air-2');
        expect(result.devicetypes[4].name).toEqual('iPad Pro (9.7-inch)');
        expect(result.devicetypes[4].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-Pro--9-7-inch-');
        expect(result.devicetypes[5].name).toEqual('iPad Pro (12.9-inch)');
        expect(result.devicetypes[5].id).toEqual('com.apple.CoreSimulator.SimDeviceType.iPad-Pro');
    });

    it('test parse Apple Watches', function() {
        var lines = [
            header,
            'Apple Watch - 38mm (com.apple.CoreSimulator.SimDeviceType.Apple-Watch-38mm)',
            'Apple Watch - 42mm (com.apple.CoreSimulator.SimDeviceType.Apple-Watch-42mm)',
            'Apple Watch Series 2 - 38mm (com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-38mm)',
            'Apple Watch Series 2 - 42mm (com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-42mm)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(4);
        expect(result.devices.length).toEqual(0);
        expect(result.runtimes.length).toEqual(0);

        expect(result.devicetypes[0].name).toEqual('Apple Watch - 38mm');
        expect(result.devicetypes[0].id).toEqual('com.apple.CoreSimulator.SimDeviceType.Apple-Watch-38mm');
        expect(result.devicetypes[1].name).toEqual('Apple Watch - 42mm');
        expect(result.devicetypes[1].id).toEqual('com.apple.CoreSimulator.SimDeviceType.Apple-Watch-42mm');
        expect(result.devicetypes[2].name).toEqual('Apple Watch Series 2 - 38mm');
        expect(result.devicetypes[2].id).toEqual('com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-38mm');
        expect(result.devicetypes[3].name).toEqual('Apple Watch Series 2 - 42mm');
        expect(result.devicetypes[3].id).toEqual('com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-42mm');
    });

    it('test parse Apple TVs', function() {
        var lines = [
            header,
            'Apple TV 1080p (com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(1);
        expect(result.devices.length).toEqual(0);
        expect(result.runtimes.length).toEqual(0);

        expect(result.devicetypes[0].name).toEqual('Apple TV 1080p');
        expect(result.devicetypes[0].id).toEqual('com.apple.CoreSimulator.SimDeviceType.Apple-TV-1080p');
    });
});

describe('list-parser runtimes test', function() {

    var parser = new SimCtlListParser();
    var header = '== Runtimes ==';

    beforeEach(function() {
        parser._clear();
    });

    afterEach(function() {
    });

    it('test parse runtimes', function() {
        var lines = [
            header,
            'iOS 8.4 (8.4 - 12H141) (com.apple.CoreSimulator.SimRuntime.iOS-8-4)',
            'iOS 9.3 (9.3 - 13E233) (com.apple.CoreSimulator.SimRuntime.iOS-9-3)',
            'iOS 10.0 (10.0 - 14A345) (com.apple.CoreSimulator.SimRuntime.iOS-10-0)',
            'tvOS 10.0 (10.0 - 14A345) (com.apple.CoreSimulator.SimRuntime.tvOS-10-0)',
            'watchOS 3.0 (10.0 - 14A345) (com.apple.CoreSimulator.SimRuntime.watchOS-3-0)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(0);
        expect(result.devices.length).toEqual(0);
        expect(result.runtimes.length).toEqual(5);

        expect(result.runtimes[0].name).toEqual('iOS 8.4');
        expect(result.runtimes[0].build).toEqual('8.4 - 12H141');
        expect(result.runtimes[0].id).toEqual('com.apple.CoreSimulator.SimRuntime.iOS-8-4');
        expect(result.runtimes[0].available).toEqual(true);
        expect(result.runtimes[1].name).toEqual('iOS 9.3');
        expect(result.runtimes[1].build).toEqual('9.3 - 13E233');
        expect(result.runtimes[1].id).toEqual('com.apple.CoreSimulator.SimRuntime.iOS-9-3');
        expect(result.runtimes[1].available).toEqual(true);
        expect(result.runtimes[2].name).toEqual('iOS 10.0');
        expect(result.runtimes[2].build).toEqual('10.0 - 14A345');
        expect(result.runtimes[2].id).toEqual('com.apple.CoreSimulator.SimRuntime.iOS-10-0');
        expect(result.runtimes[2].available).toEqual(true);
        expect(result.runtimes[3].name).toEqual('tvOS 10.0');
        expect(result.runtimes[3].build).toEqual('10.0 - 14A345');
        expect(result.runtimes[3].id).toEqual('com.apple.CoreSimulator.SimRuntime.tvOS-10-0');
        expect(result.runtimes[3].available).toEqual(true);
        expect(result.runtimes[4].name).toEqual('watchOS 3.0');
        expect(result.runtimes[4].build).toEqual('10.0 - 14A345');
        expect(result.runtimes[4].id).toEqual('com.apple.CoreSimulator.SimRuntime.watchOS-3-0');
        expect(result.runtimes[4].available).toEqual(true);
    });
});

describe('list-parser test Devices', function() {

    var parser = new SimCtlListParser();
    var header = '== Devices ==';

    beforeEach(function() {
        parser._clear();
    });

    afterEach(function() {
    });

    it('test parse iPhone and iPad', function() {
        var lines = [
            header,
            '-- iOS 8.4 --',
            '    Resizable iPad (E7348A97-6719-476F-B5A9-0C7F32336F0B) (Shutdown) (unavailable, device type profile not found)',
            '    Resizable iPhone (6B3D08F5-6010-4934-8259-81F0F5F86E20) (Shutdown) (unavailable, device type profile not found)',
            '-- iOS 9.3 --',
            '    iPad Air 2 (9E3E156C-A96F-4D61-A2BB-D72F0BE2E7BB) (Shutdown)',
            '    iPad Pro (5B0E98E8-517D-49A7-860A-B7F820DA9C23) (Shutdown)',
            '-- iOS 10.0 --',
            '    iPhone 6s (8C41DBA3-0F78-43FF-AE92-845D35DDD39D) (Shutdown)',
            '    iPhone 6s Plus (1B4E1A98-2408-404A-BEFC-F723A6889A63) (Shutdown)',
            '    iPhone 7 (87894360-0337-459E-816E-AE5EFD0A4570) (Shutdown)',
            '    iPhone 7 Plus (8D85405B-96CA-4268-87D1-CE594567F5EF) (Shutdown)',
            '    iPhone SE (175D9F25-0B08-4E4B-AD39-E3CBAC72CB4B) (Shutdown)',
            '    iPad Pro (9.7 inch) (1C5590C8-8AE7-4C27-AD06-84C801702945) (Shutdown)',
            '    iPad Pro (12.9 inch) (065BAEBF-1D7D-4B3B-B30D-79529356065B) (Shutdown)',
            '-- tvOS 10.0 --',
            '    Apple TV 1080p (1A360376-E68E-45C2-8DBB-48BF7C60B4FB) (Shutdown)',
            '-- watchOS 3.0 --',
            '    Apple Watch - 38mm (349DD23B-689C-43E4-A1F5-304C3E4DCFDD) (Shutdown)',
            '    Apple Watch - 42mm (B932A73B-477F-47A7-AB29-1E98D3F9095C) (Shutdown)',
            '    Apple Watch Series 2 - 38mm (B4BB8453-349F-4CBF-A5A9-87BE602DB13E) (Shutdown)',
            '    Apple Watch Series 2 - 42mm (0C527828-EBF4-4FD0-A66B-200FE716EB37) (Shutdown)',
            '-- Unavailable: com.apple.CoreSimulator.SimRuntime.iOS-9-1 --',
            '    iPhone 4s (A27C69F5-1AFF-48D2-92B0-951F7E037E9C) (Shutdown) (unavailable, runtime profile not found)'
        ];

        var result = parser.parse(lines.join('\n'));
        expect(result.devicetypes.length).toEqual(0);
        expect(result.devices.length).toEqual(6);
        expect(result.runtimes.length).toEqual(0);

        var device = result.devices[0]; 
        expect(device.runtime).toEqual('iOS 8.4');
        expect(device.devices[0].name).toEqual('Resizable iPad');
        expect(device.devices[0].id).toEqual('E7348A97-6719-476F-B5A9-0C7F32336F0B');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(false);
        expect(device.devices[1].name).toEqual('Resizable iPhone');
        expect(device.devices[1].id).toEqual('6B3D08F5-6010-4934-8259-81F0F5F86E20');
        expect(device.devices[1].state).toEqual('Shutdown');
        expect(device.devices[1].available).toEqual(false);

        device = result.devices[1];
        expect(device.runtime).toEqual('iOS 9.3');
        expect(device.devices[0].name).toEqual('iPad Air 2');
        expect(device.devices[0].id).toEqual('9E3E156C-A96F-4D61-A2BB-D72F0BE2E7BB');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(true);
        expect(device.devices[1].name).toEqual('iPad Pro');
        expect(device.devices[1].id).toEqual('5B0E98E8-517D-49A7-860A-B7F820DA9C23');
        expect(device.devices[1].state).toEqual('Shutdown');
        expect(device.devices[1].available).toEqual(true);

        device = result.devices[2];
        expect(device.runtime).toEqual('iOS 10.0');
        expect(device.devices[0].name).toEqual('iPhone 6s');
        expect(device.devices[0].id).toEqual('8C41DBA3-0F78-43FF-AE92-845D35DDD39D');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(true);
        expect(device.devices[1].name).toEqual('iPhone 6s Plus');
        expect(device.devices[1].id).toEqual('1B4E1A98-2408-404A-BEFC-F723A6889A63');
        expect(device.devices[1].state).toEqual('Shutdown');
        expect(device.devices[1].available).toEqual(true);
        expect(device.devices[2].name).toEqual('iPhone 7');
        expect(device.devices[2].id).toEqual('87894360-0337-459E-816E-AE5EFD0A4570');
        expect(device.devices[2].state).toEqual('Shutdown');
        expect(device.devices[2].available).toEqual(true);
        expect(device.devices[3].name).toEqual('iPhone 7 Plus');
        expect(device.devices[3].id).toEqual('8D85405B-96CA-4268-87D1-CE594567F5EF');
        expect(device.devices[3].state).toEqual('Shutdown');
        expect(device.devices[3].available).toEqual(true);
        expect(device.devices[4].name).toEqual('iPhone SE');
        expect(device.devices[4].id).toEqual('175D9F25-0B08-4E4B-AD39-E3CBAC72CB4B');
        expect(device.devices[4].state).toEqual('Shutdown');
        expect(device.devices[4].available).toEqual(true);
        expect(device.devices[5].name).toEqual('iPad Pro (9.7 inch)');
        expect(device.devices[5].id).toEqual('1C5590C8-8AE7-4C27-AD06-84C801702945');
        expect(device.devices[5].state).toEqual('Shutdown');
        expect(device.devices[5].available).toEqual(true);
        expect(device.devices[6].name).toEqual('iPad Pro (12.9 inch)');
        expect(device.devices[6].id).toEqual('065BAEBF-1D7D-4B3B-B30D-79529356065B');
        expect(device.devices[6].state).toEqual('Shutdown');
        expect(device.devices[6].available).toEqual(true);

        // tvOS //////////

        device = result.devices[3]; 
        expect(device.runtime).toEqual('tvOS 10.0');
        expect(device.devices[0].name).toEqual('Apple TV 1080p');
        expect(device.devices[0].id).toEqual('1A360376-E68E-45C2-8DBB-48BF7C60B4FB');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(true);

        // watchOS //////////

        device = result.devices[4]; 
        expect(device.runtime).toEqual('watchOS 3.0');
        expect(device.devices[0].name).toEqual('Apple Watch - 38mm');
        expect(device.devices[0].id).toEqual('349DD23B-689C-43E4-A1F5-304C3E4DCFDD');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(true);
        expect(device.devices[1].name).toEqual('Apple Watch - 42mm');
        expect(device.devices[1].id).toEqual('B932A73B-477F-47A7-AB29-1E98D3F9095C');
        expect(device.devices[1].state).toEqual('Shutdown');
        expect(device.devices[1].available).toEqual(true);
        expect(device.devices[2].name).toEqual('Apple Watch Series 2 - 38mm');
        expect(device.devices[2].id).toEqual('B4BB8453-349F-4CBF-A5A9-87BE602DB13E');
        expect(device.devices[2].state).toEqual('Shutdown');
        expect(device.devices[2].available).toEqual(true);
        expect(device.devices[3].name).toEqual('Apple Watch Series 2 - 42mm');
        expect(device.devices[3].id).toEqual('0C527828-EBF4-4FD0-A66B-200FE716EB37');
        expect(device.devices[3].state).toEqual('Shutdown');
        expect(device.devices[3].available).toEqual(true);

        // Unavailable //////////

        device = result.devices[5]; 
        expect(device.runtime).toEqual('Unavailable: com.apple.CoreSimulator.SimRuntime.iOS-9-1');
        expect(device.devices[0].name).toEqual('iPhone 4s');
        expect(device.devices[0].id).toEqual('A27C69F5-1AFF-48D2-92B0-951F7E037E9C');
        expect(device.devices[0].state).toEqual('Shutdown');
        expect(device.devices[0].available).toEqual(false);
    });
});

describe('list-parser test Device Pairs', function() {

    var parser = new SimCtlListParser();
    var header = '== Device Pairs ==';

    beforeEach(function() {
        parser._clear();
    });

    afterEach(function() {
    });

    it('test parse', function() {
        // TODO: see https://github.com/phonegap/simctl/issues/3
        expect(true).toBe(true);
    });

});