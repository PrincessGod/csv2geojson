#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
const util = require('util')
const yargs = require('yargs')
const Promise = require("bluebird");
Promise.promisifyAll(fs);

const csv2lines = require('../lib/csvtolines')
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
    .command('toLines', 'Convert csv to Linestrings feature collection geojson.')
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
    if (command === 'toLines') {
        if (input) {
            return transformLinestring(input, output, force);
        }
        return transformFiles(argv.d, output, force);
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

function transformLinestring(inputDirectory, outputPath, force) {
    outputPath = defaultValue(outputPath, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '.json'));
    return checkInputFile(inputDirectory)
        .then(function() {
            return checkFileOverwritable(outputPath, force)
                .then(function() {
                    return csv2lines(inputDirectory, outputPath);
                });
        })
}

function transformFiles(inputFolder, outputPath, force) {
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
                    outPath = process.cwd();
                }
                outPath = path.join(outPath, path.basename(csv) + '.json');
                return transformLinestring(csv, outPath, force);
            })
        })
}