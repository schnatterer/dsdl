dsdl
====

[![Build Status](https://travis-ci.org/schnatterer/dsdl.svg?branch=develop)](https://travis-ci.org/schnatterer/dsdl)
[![schnatterer/dsdl@docker hub](https://images.microbadger.com/badges/image/schnatterer/dsdl.svg)](https://hub.docker.com/r/schnatterer/dsdl/)
[![QGate](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=alert_status)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=coverage)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)
[![TecDebt](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=sqale_index)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)

DiskStation Downloader (formerly photostationtagdownloader / pstd)
 
Downloads files from [Synology DiskStation Manager](https://www.synology.com/dsm). Supports downloading 
* photos (all photos of a tag / "smart album") via [Photo Station](https://www.synology.com/dsm/feature/photo_station) and
* audio (all songs of a playlist) via [Audio Station](https://www.synology.com/dsm/feature/audio_station) 

# Use Cases

## Photos 

* Set tags (i.e. [IPTC keywords](http://www.iptc.org/std/photometadata/documentation/userguide/index.htm#!Documents/generalimagecontent.htm)) for photos, grouping them into "smart albums"
* dsdl downloads those for you. For some reasons this cannot be achieved using the Photo Station web app, nor native Android or Windows apps.

## Audio
* Group your songs into playlists
* dsdl downloads those for you. You can also do this via the web UI (where the playlist is zipped) or with [DS audio](https://www.synology.com/dsm/feature/audio_station#download) but it does not seem to work reliably and it cannot be scripted 😉

# Usage

## Prebuilt binaries

Get the binary for your specific OS from the [release page](https://github.com/schnatterer/dsdl/releases).

```bash
wget -O dsdl https://github.com/schnatterer/dsdl/releases/download/1.0.0/dsdl-linux-x64
chmod +x dsdl
```

Use it like so:

* photos
    ```bash
    ./dsdl photo --user your-diskstsation-user --output photos/ http://diskstation/photo
    ```
* audio
    ```bash
    ./dsdl audio --user your-user --output music/ http://diskstation:5000/audio
    ```

You will be prompted for the password.

## Docker

```bash
docker run -ti schnatterer/dsdl:1.0.0 photo --user your-photostation-user --output photos/ http://diskstation/photo
```

## Node.js

You can also run it with your own node js instance. This also allows for running on platforms that are not supplied with
prebuilt binaries, like arm/arm64. For example on android, you can run dsdl via [termux](https://termux.com/). 

```bash
yarn install
node src/cli/dsdl.js photo --user your-photostation-user --output photos/ http://diskstation/photo
```

## Non-interactive password

If running in batch/non-interactive mode, you you can just pipe it to `dsdl`.
Note that passwords showing up in the shell history or log files are a potential security risk.

```bash
echo "PW" | ./dsdl photo -u ...
```

## Options

### General

* `--flat` - downloads all photos/songs of the chosen tags/playlists into a single folder

### Photo

* `--tags` - downloads specific tags. Note that tags containing spaces must be quoted. Multiple tags can either be specified  
  * comma separated (e.g. `--tags "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--tags "tag one" --tags numberTwo`) 
  
### Audio

* `--playlists` - downloads specific playlists. Note that playlists containing spaces must be quoted. Multiple playlists can either be specified  
  * comma separated (e.g. `--playlists "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--playlists "tag one" --playlists numberTwo`) 