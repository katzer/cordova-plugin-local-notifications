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

var path  = require('path'),
    fs  = require('fs'),
    et = require('elementtree'),
    shell = require('shelljs'),
    ConfigParser = require('./ConfigParser');

var ROOT = path.join(__dirname, '..', '..'),
    accessRules;

module.exports.applyPlatformConfig = function () {
    console.log('Applying Platform Config...');

    var config = new ConfigParser(path.join(ROOT, 'config.xml'));

    accessRules = config.getAccessRules().filter(function(rule) {
        if (rule.indexOf('https://') === 0 || rule == '*') {
            return true;
        } else {
            console.log('Access rules must begin with "https://", the following rule will be ignored: ' + rule);
        }
        return false;
    });

    // Apply appxmanifest changes
    ['package.windows.appxmanifest', 'package.windows80.appxmanifest', 'package.phone.appxmanifest'].forEach(
        function(manifestFile) {
            updateManifestFile(config, path.join(ROOT, manifestFile));
    });

    // Apply jsproj changes
    ['CordovaApp.Phone.jsproj', 'CordovaApp.Windows.jsproj', 'CordovaApp.Windows80.jsproj'].forEach(
        function(jsprojFile) {
            updatejsprojFile(config, path.join(ROOT, jsprojFile));
    });

    copyImages(config);
};

function updatejsprojFile(config, jsProjFilePath) {
    var defaultLocale = config.defaultLocale() || 'en-US';

    var contents = fs.readFileSync(jsProjFilePath, 'utf-8');
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    if (contents.charCodeAt(0) === 0xFEFF) {
        contents = contents.slice(1);
    }
    var jsProjXML =  new et.ElementTree(et.XML(contents));
    var jsProjDefaultLocale = jsProjXML.find('./PropertyGroup/DefaultLanguage');
    jsProjDefaultLocale.text = defaultLocale;
    fs.writeFileSync(jsProjFilePath, jsProjXML.write({indent: 2}), 'utf-8');
}

function updateManifestFile (config, manifestPath) {

    var contents = fs.readFileSync(manifestPath, 'utf-8');
    if(contents) {
        //Windows is the BOM. Skip the Byte Order Mark.
        contents = contents.substring(contents.indexOf('<'));
    }

    var manifest =  new et.ElementTree(et.XML(contents));

    applyCoreProperties(config, manifest, manifestPath);
    // sort Capability elements as per CB-5350 Windows8 build fails due to invalid 'Capabilities' definition
    sortCapabilities(manifest);
    applyAccessRules(config, manifest);
    applyBackgroundColor(config, manifest);

    //Write out manifest
    fs.writeFileSync(manifestPath, manifest.write({indent: 4}), 'utf-8');
}

function applyCoreProperties(config, manifest, manifestPath) {
    var version = fixConfigVersion(config.version());
    var name = config.name();
    var pkgName = config.packageName();
    var author = config.author();
    var startPage = config.startPage();

    if (!startPage) {
        // If not specified, set default value
        // http://cordova.apache.org/docs/en/edge/config_ref_index.md.html#The%20config.xml%20File
        startPage = 'index.html';
    }

    var identityNode = manifest.find('.//Identity');
    if(!identityNode) {
        throw new Error('Invalid manifest file (no <Identity> node): ' + manifestPath);
    }
    // Update identity name and version
    if (pkgName) {
        (identityNode.attrib.Name = pkgName);
    }
    if (version) {
        (identityNode.attrib.Version = version);
    }

    // Update name (windows8 has it in the Application[@Id] and Application.VisualElements[@DisplayName])
    var app = manifest.find('.//Application');
    if(!app) {
        throw new Error('Invalid manifest file (no <Application> node): ' + manifestPath);
    }
    if (pkgName) {
        // 64 symbols restriction goes from manifest schema definition
        // http://msdn.microsoft.com/en-us/library/windows/apps/br211415.aspx
        var appId = pkgName.length <= 64 ? pkgName : pkgName.substr(0, 64);
        app.attrib.Id = appId;
    }
    app.attrib.StartPage = 'www/' + startPage;

    var visualElems = manifest.find('.//VisualElements') || // windows 8.0
        manifest.find('.//m2:VisualElements') || // windows 8.1
        manifest.find('.//m3:VisualElements'); // windows phone 8.1

    if(!visualElems) {
        throw new Error('Invalid manifest file (no <VisualElements> node): ' + manifestPath);
    }
    if (name) {
        (visualElems.attrib.DisplayName = name);
    }

    // Update properties
    var properties = manifest.find('.//Properties');
    if (properties && properties.find) {
        var displayNameElement = properties.find('.//DisplayName');
        if (displayNameElement && name) {
            displayNameElement.text = name;
        }

        var publisherNameElement = properties.find('.//PublisherDisplayName');
        if (publisherNameElement && author) {
            publisherNameElement.text = author;
        }
    }

    // Supported orientations
    var isWin80 = manifest.find('.//VisualElements') !== null;
    var isWin81 = manifest.find('.//m2:VisualElements') !== null;
    var isWP81 = manifest.find('.//m3:VisualElements') !== null;

    var rotationPreferenceName, rotationPreferenceRootName;

    if(isWin80) {
        rotationPreferenceName = 'Rotation';
        rotationPreferenceRootName = 'InitialRotationPreference';
    } else if(isWin81) {
        rotationPreferenceName = 'm2:Rotation';
        rotationPreferenceRootName = 'm2:InitialRotationPreference';
    } else if(isWP81) {
        rotationPreferenceName = 'm3:Rotation';
        rotationPreferenceRootName = 'm3:InitialRotationPreference';
    }

    var orientation = config.getPreference('Orientation');
    var rotationPreferenceRoot;
    if (orientation) {
        rotationPreferenceRoot = manifest.find('.//' + rotationPreferenceRootName);
        if(rotationPreferenceRoot === null) {
            visualElems.append(et.Element(rotationPreferenceRootName));
            rotationPreferenceRoot = manifest.find('.//' + rotationPreferenceRootName);
        }

        rotationPreferenceRoot.clear();

        var applyOrientations = function(orientationsArr) {
            orientationsArr.forEach(function(orientationValue) {
                var el = et.Element(rotationPreferenceName);
                el.attrib.Preference = orientationValue;
                rotationPreferenceRoot.append(el);
            });
        };

        // Updates supported orientations
        //<InitialRotationPreference>
        //    <Rotation Preference = "portrait" | "landscape" | "portraitFlipped" | "landscapeFlipped" /> {1,4}
        //</InitialRotationPreference>
        if(orientation === 'default') {
            // This means landscape and portrait
            applyOrientations(['portrait', 'landscape', 'landscapeFlipped']);
        } else if(orientation === 'portrait') {
            applyOrientations(['portrait']);
        } else if(orientation === 'landscape') {
            applyOrientations(['landscape', 'landscapeFlipped']);
        } else { // Platform-specific setting like "portrait,landscape,portraitFlipped"
            applyOrientations(orientation.split(','));
        }
    } else {
        // Remove InitialRotationPreference root element to revert to defaults
        rotationPreferenceRoot = visualElems.find('.//' + rotationPreferenceRootName);
        if(rotationPreferenceRoot !== null) {
            visualElems.remove(null, rotationPreferenceRoot);
        }
    }
}

// Adjust version number as per CB-5337 Windows8 build fails due to invalid app version
function fixConfigVersion (version) {
    if(version && version.match(/\.\d/g)) {
        var numVersionComponents = version.match(/\.\d/g).length + 1;
        while (numVersionComponents++ < 4) {
            version += '.0';
        }
    }
    return version;
}

function applyAccessRules (config, manifest) {
    // Updates WhiteListing rules
    //<ApplicationContentUriRules>
    //    <Rule Match="https://www.example.com" Type="include"/>
    //</ApplicationContentUriRules>
    var appUriRulesRoot = manifest.find('.//Application'),
        appUriRules = appUriRulesRoot.find('.//ApplicationContentUriRules');

    if (appUriRules !== null) {
        appUriRulesRoot.remove(null, appUriRules);
    }
    // rules are not defined or allow any
    if (accessRules.length === 0 || accessRules.indexOf('*') > -1) {
        return;
    } 

    appUriRules = et.Element('ApplicationContentUriRules');
    appUriRulesRoot.append(appUriRules);

    accessRules.forEach(function(rule) {
        var el = et.Element('Rule');
        el.attrib.Match = rule;
        el.attrib.Type = 'include';
        appUriRules.append(el);
    });
}

function sortCapabilities(manifest) {

    // removes namespace prefix (m3:Capability -> Capability)
    // this is required since elementtree returns qualified name with namespace
    function extractLocalName(tag) {
        return tag.split(':').pop(); // takes last part of string after ':'
    }

    var capabilitiesRoot = manifest.find('.//Capabilities'),
        capabilities = capabilitiesRoot._children || [];
    // to sort elements we remove them and then add again in the appropriate order
    capabilities.forEach(function(elem) { // no .clear() method
        capabilitiesRoot.remove(0, elem);
        // CB-7601 we need local name w/o namespace prefix to sort capabilities correctly
        elem.localName = extractLocalName(elem.tag);
    });
    capabilities.sort(function(a, b) {
        return (a.localName > b.localName) ? 1: -1;
    });
    capabilities.forEach(function(elem) {
        capabilitiesRoot.append(elem);
    });
}

function copyImages(config) {
    var platformRoot = ROOT;
    // TODO find the way to detect whether command was triggered by CLI or not
    var appRoot = path.join(platformRoot, '..', '..');

    function copyImage(src, dest) {
        src = path.join(appRoot, src);
        dest = path.join(platformRoot, 'images', dest);
        //console.log('Copying image from ' + src + ' to ' + dest);
        shell.cp('-f', src, dest);
    }

    function copyMrtImage(src, dest) {
        var srcDir = path.dirname(src),
            srcExt = path.extname(src),
            srcFileName = path.basename(src, srcExt);
     
        var destExt = path.extname(dest),
            destFileName = path.basename(dest, destExt);

        // all MRT images: logo.png, logo.scale-100.png, logo.scale-200.png, etc
        var images = fs.readdirSync(srcDir).filter(function(e) { 
            return e.match('^'+srcFileName + '(.scale-[0-9]+)?' + srcExt);
        });
        // warn if no images found
        if (images.length === 0) {
            console.log('No images found for target: ' + destFileName);
            return;
        }
        // copy images with new name but keeping scale suffix
        images.forEach(function(img) {
            var scale = path.extname(path.basename(img, srcExt));
            if (scale === '') {
                scale = '.scale-100';
            }
            copyImage(path.join(srcDir, img), destFileName+scale+destExt);
        });
        
    }

    // Platform default images
    var platformImages = [
        {dest: 'Square150x150Logo.scale-100.png', width: 150, height: 150},
        {dest: 'Square30x30Logo.scale-100.png', width: 30, height: 30},
        {dest: 'StoreLogo.scale-100.png', width: 50, height: 50},
        {dest: 'SplashScreen.scale-100.png', width: 620, height: 300},
        // scaled images are specified here for backward compatibility only so we can find them by size
        {dest: 'StoreLogo.scale-240.png', width: 120, height: 120},
        {dest: 'Square44x44Logo.scale-240.png', width: 106, height: 106},
        {dest: 'Square71x71Logo.scale-240.png', width: 170, height: 170},
        {dest: 'Square70x70Logo.scale-100.png', width: 70, height: 70},
        {dest: 'Square150x150Logo.scale-240.png', width: 360, height: 360},
        {dest: 'Square310x310Logo.scale-100.png', width: 310, height: 310},
        {dest: 'Wide310x150Logo.scale-100.png', width: 310, height: 150},
        {dest: 'Wide310x150Logo.scale-240.png', width: 744, height: 360},
        {dest: 'SplashScreenPhone.scale-240.png', width: 1152, height: 1920}
    ];

    function findPlatformImage(width, height) {
        if (!width && !height){
            // this could be default image, 
            // Windows requires specific image dimension so we can't apply it
            return null;
        }
        for (var idx in platformImages){
            var res = platformImages[idx];
            // If only one of width or height is not specified, use another parameter for comparation
            // If both specified, compare both.
            if ((!width || (width == res.width)) &&
                (!height || (height == res.height))){
                return res;
            }
        }
        return null;
    }

    var images = config.getIcons().concat(config.getSplashScreens());

    images.forEach(function (img) {
        if (img.target) {
            copyMrtImage(img.src, img.target + '.png');
        } else {
            // find target image by size
            var targetImg = findPlatformImage (img.width, img.height);
            if (targetImg) {
                copyImage(img.src, targetImg.dest);
            } else {
                console.log('The following image is skipped due to unsupported size: ' + img.src);
            }
        }
    });
}

function applyBackgroundColor (config, manifest) {
    var visualElems =null;

    function refineColor(color) {
        // return three-byte hexadecimal number preceded by "#" (required for Windows)
        color = color.replace('0x', '').replace('#', '');
        if (color.length == 3) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }
        // alpha is not supported, so we remove it
        if (color.length == 8) { // AArrggbb
            color = color.slice(2);
        }
        return '#' + color;
    }
    // background color
    var bgColor = config.getPreference('BackgroundColor');
    if (bgColor) {
        visualElems = manifest.find('.//VisualElements') || // windows 8.0
            manifest.find('.//m2:VisualElements') || // windows 8.1
            manifest.find('.//m3:VisualElements'); // windows phone 8.1
        visualElems.attrib.BackgroundColor = refineColor(bgColor);
    }

    // Splash Screen background color
    bgColor = config.getPreference('SplashScreenBackgroundColor');
    if (bgColor) {
        visualElems = manifest.find('.//SplashScreen') || // windows 8.0
            manifest.find('.//m2:SplashScreen') || // windows 8.1
            manifest.find('.//m3:SplashScreen'); // windows phone 8.1
        visualElems.attrib.BackgroundColor = refineColor(bgColor);
    }
}