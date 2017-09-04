# csv2geojson

Node.js library and command-line tools for convert csv to geojson.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm installx
```

If you want to put it to global environment, run:
```
npm link
```
This allowd you to run the tool anywhere by call `csv2geojson`. Otherwise you can use `node ./bin/index.js` instead.

## Config

File config file at `./bin/config.json`, it should be like this:
```
{
    // FeatureCollection root object for LineString.
    "linesjson":
    {
        "type": "FeatureCollection",
        "features": []
    },

    // FeatureCollection root object for Point.
    "pointsjson":
    {
        "type": "FeatureCollection",
        "features": []
    },

    // The csv feature id, to specify each feature in feature collection.
    "idField": "OBJECTID",

    // The csv field store longitude
    "longitudeField": "x",

    // The csv field store latitude
    "latitudeField": "y"
}
```

## Command line tools

### Convert csv file to LineString feature collection

Translate single file.

```
node ./bin/index.js tolines ./source.csv
```
```
node ./bin/index.js tolines -i ./source.csv
```
```
node ./bin/index.js tolines -i ./source.csv -o ./result.json
```

Translate a folder's csv files.

```
node ./bin/index.js tolines -d ./sources
```
```
node ./bin/index.js tolines -d ./sources -o ./results
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input file path of the csv file.| :white_check_mark: Yes|
|`-o`, `--output`|Output file path of json file.|No|
|`-d`, `--directory`|Input directory of csv files folder.|No|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|

### Convert csv file to Point feature collection

Translate single file.

```
node ./bin/index.js topoints ./source.csv
```
```
node ./bin/index.js topoints -i ./source.csv
```
```
node ./bin/index.js topoints -i ./source.csv -o ./result.json
```

Translate a folder's csv files.

```
node ./bin/index.js topoints -d ./sources
```
```
node ./bin/index.js topoints -d ./sources -o ./results
```

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Input file path of the csv file.| :white_check_mark: Yes|
|`-o`, `--output`|Output file path of json file.|No|
|`-d`, `--directory`|Input directory of csv files folder.|No|
|`-f`, `--force`|Overwrite output directory if it exists.|No, default `false`|
