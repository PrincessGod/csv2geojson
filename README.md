# csv2geojson

Node.js library and command-line tools for convert csv to geojson.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

## Command line tools

### Convert csv file to Linestrings feature collection

Translate single file.

```
node ./bin/index.js toLines ./source.csv
```
```
node ./bin/index.js toLines -i ./source.csv
```
```
node ./bin/index.js toLines -i ./source.csv -o ./result.json
```

Translate a folder's csv files.

```
node ./bin/index.js toLines -d ./sources
```
```
node ./bin/index.js toLines -d ./sources -o ./results
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input file path of the csv file.| :white_check_mark: Yes|
|`-o`, `--output`|Output file path of json file.|No|
|`-d`, `--directory`|Input directory of csv files folder.|No|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|