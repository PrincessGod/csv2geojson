#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp');
const util = require('util')
const yargs = require('yargs')
const Promise = require("bluebird")
Promise.promisifyAll(fs);

const csv2lines = require('../lib/csvtolines')
const csv2points = require('../lib/csvtopoints')
const defined = require('../lib/defined')
const defaultValue = require('../lib/defaultValue')
const DeveloperError = require('../lib/DeveloperError')
const fileExists = require('../lib/fileExists');


var index = -1;
for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--options') {
        index = i;
        break;
    }
}

var args;
var optionArgs;
if (index < 0) {
    args = process.argv.slice(2);
    optionArgs = [];
} else {
    args = process.argv.slice(2, index);
    optionArgs = process.argv.slice(index + 1);
}

// Specify input for argument parsing even though it won't be used
optionArgs.push('-i');
optionArgs.push('null');

var argv = yargs
    .usage('Usage: $0 <command> [options]')
    .help('h')
    .alias('h', 'help')
    .options({
        'i': {
            alias: 'input',
            description: 'Input path for the command.',
            global: true,
            normalize: true,
            type: 'string'
        },
        'd': {
            alias: 'directory',
            description: 'Input directory for the command.',
            global: true,
            normalize: true,
            type: 'string'
        },
        'o': {
            alias: 'output',
            description: 'Output path for the command.',
            global: true,
            normalize: true,
            type: 'string'
        },
        'f': {
            alias: 'force',
            default: false,
            description: 'Output can be overwritten if it already exists.',
            global: true,
            type: 'boolean'
        }
    })
    .command('tolines', 'Convert csv to LineString feature collection geojson.')
    .command('topoints', 'Convert csv to Point feature collection geojson.')
    .demand(1)
    .recommendCommands()
    .strict()
    .parse(args);

var command = argv._[0];
var input = defaultValue(argv.i, argv._[1]);
var output = defaultValue(argv.o, argv._[2]);
var inputFolder = argv.d;
var force = argv.f;

if (!defined(input) && !defined(inputFolder)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

console.time('Total');
runCommand(command, input, output, force, argv)
    .then(function() {
        console.timeEnd('Total');
    })
    .catch(function(error) {
        console.log(error.message);
    });

function runCommand(command, input, output, force, argv) {
    if (command === 'tolines') {
        if (input) {
            return transformFile(input, output, force, csv2lines);
        }
        return transformFiles(argv.d, output, force, csv2lines);
    }
    if (command === 'topoints') {
        if (input) {
            return transformFile(input, output, force, csv2points);
        }
        return transformFiles(argv.d, output, force, csv2points);
    }

    throw new DeveloperError('Invalid command: ' + command);
}


function checkDirectoryOverwritable(directory, force) {
    if (force) {
        return Promise.resolve();
    }
    return directoryExists(directory)
        .then(function(exists) {
            if (exists) {
                throw new DeveloperError('Directory ' + directory + ' already exists. Specify -f or --force to overwrite existing files.');
            }
        });
}

function checkFileOverwritable(file, force) {
    if (force) {
        return Promise.resolve();
    }
    return fileExists(file)
        .then(function(exists) {
            if (exists) {
                throw new DeveloperError('File ' + file + ' already exists. Specify -f or --force to overwrite existing files.');
            }
        })
}

function checkInputFile(file) {
    if (path.extname(file) === '.csv') {
        return fileExists(file)
            .then(function(exists) {
                if (exists) {
                    return Promise.resolve();
                } else {
                    throw new DeveloperError('File ' + file + ' not exists.');
                }
            })
    } else {
        return Promise.reject(new DeveloperError('Input file type have to be ".csv" .'))
    }
}

function transformFile(inputDirectory, outputPath, force, option) {
    if (outputPath && outputPath.slice(outputPath.length - 5) !== '.json') {
        return Promise.reject(new DeveloperError('Output path should be a .json file path, received ' + outputPath));
    }

    outputPath = defaultValue(outputPath, path.join(path.dirname(inputDirectory),
        path.basename(inputDirectory).replace(/\.[^/.]+$/, "") + '.json'));

    return checkInputFile(inputDirectory)
        .then(function() {
            return checkFileOverwritable(outputPath, force)
                .then(function() {
                    return option(inputDirectory, outputPath);
                });
        })
}

function transformPoints(inputDirectory, outputPath, force) {
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '.json'));
    return checkInputFile(inputDirectory)
        .then(function() {
            return checkFileOverwritable(outputPath, force)
                .then(function() {
                    return csv2lines(inputDirectory, outputPath);
                });
        })
}

function transformFiles(inputFolder, outputPath, force, option) {
    var allcsv = [];
    var dd = path.resolve(process.cwd(), inputFolder);
    return fs.readdirAsync(dd)
        .then(function(files) {
            files.map(function(file) {
                if (path.extname(file) === '.csv') {
                    var csv = path.join(inputFolder, file);
                    allcsv.push(csv);
                }
            });
            return new Promise.map(allcsv, function(csv) {
                var outPath = '';
                if (defined(outputPath)) {
                    outPath = path.join(process.cwd(), outputPath);
                } else {
                    outPath = path.dirname(csv);
                }
                outPath = path.join(outPath, path.basename(csv).replace(/\.[^/.]+$/, "") + '.json');
                console.log(outPath)
                return transformFile(csv, outPath, force, option);
            })
        })
}