/**
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

var path = require('path');

function MRTImage(filePath) {
    this.path = filePath;
    this.location = path.dirname(filePath);
    this.extension = path.extname(filePath);
    this.basename = path.basename(filePath, this.extension);
    // 'scale-100' is the default qualifier
    this.qualifiers = 'scale-100';

    var nameParts = this.basename.split('.');
    if (nameParts.length > 1) {
        // Qualifiers is the dotted segment in the file just before the file extension
        // If no such segment in filename, then qualifiers is empty string
        this.qualifiers = nameParts[nameParts.length - 1];
        // Basename it everything before that segment
        this.basename = nameParts.slice(0, -1).join('.');
    }
}

/**
 * Indicates whether the current instance is matches to another one
 *     (base names and extensions are equal)
 *
 * @param {MRTImage} anotherImage Another instance of MRTImage class.
 * @returns {Boolean} True if the current instance is matches to another one
 */
MRTImage.prototype.matchesTo = function (anotherImage) {
    return anotherImage instanceof MRTImage &&
        anotherImage.basename === this.basename &&
        anotherImage.extension === this.extension;
};

/**
 * Generates a new filename based on new base name for the file. for example
 *     new MRTImage('myFileName.scale-400.png').replaceBaseName('otherFileName')
 *            -> 'otherFileName.scale-400.png'
 *
 * @param {String} baseName A new base name to use
 * @returns {String} A new filename
 */
MRTImage.prototype.generateFilenameFrom = function (baseName) {
    return [baseName, this.qualifiers].join('.') + this.extension;
};

module.exports = MRTImage;
