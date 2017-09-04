'use strict';
const csv = require('csvtojson')
const fs = require('fs')
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const path = require('path')

const config = require('../bin/config')
const isNumeric = require('./isNumeric')

// Get config fields
const geojson = config['linesjson']
const idField = config['idField']
const longitudeField = config['longitudeField']
const latitudeField = config['latitudeField']

module.exports = csv2lines;

var lineNum = 1;
var errNum = 0;

function csv2lines(csvFilePath, outFilePath) {
    var jsonobj = JSON.parse(JSON.stringify(geojson));
    var lasFeature = {};

    return new Promise(function(resolve, reject) {
        const filename = path.basename(csvFilePath);
        console.log('start ' + csvFilePath);

        csv()
            .fromFile(csvFilePath)
            .on('json', (point) => {
                lineNum += 1;

                // Check if id field existed
                if (!point[idField] && point[idField] !== 0) {
                    errNum += 1;
                    console.log('File: ' + filename + '    Line number: ' + lineNum + '    Bad lines: ' + errNum + '    error: not have id');
                    return;
                }

                // Create new feature, and last feature to json object.
                if (!lasFeature['properties'] || lasFeature['properties'][idField] !== point[idField]) {
                    if (lasFeature['id']) {
                        jsonobj['features'].push(lasFeature);
                    }

                    lasFeature = {
                        "type": "Feature",
                        "id": point[idField],
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": []
                        }
                    }

                    // Copy all fields to feature's properties
                    for (var key in point) {
                        if (key !== longitudeField && key !== latitudeField) {
                            lasFeature['properties'][key] = point[key];
                        }
                    }
                }

                // Get longitude and latitude for currten feature
                if (isNumeric(point[longitudeField]) && isNumeric(point[latitudeField])) {
                    lasFeature['geometry']['coordinates'].push([Number(point[longitudeField]), Number(point[latitudeField])]);
                } else {
                    errNum += 1;
                    console.log('File: ' + filename + '    Line number: ' + lineNum + '    Bad lines: ' + errNum + '    error: not have coordinates');
                }

            })
            .on('done', (error) => {
                if (error) {
                    reject(error);
                }

                // Push last to json object
                jsonobj['features'].push(lasFeature);

                var result = JSON.stringify(jsonobj);
                mkdirp(getDirName(outFilePath), function(err) {
                    if (err) reject(err);

                    fs.writeFile(outFilePath, result, 'utf8', function(err) {
                        if (err) {
                            reject(err);
                        }
                    });
                });

                console.log('Finished ' + outFilePath)
                resolve(jsonobj);
            });
    })
}