# photostationtagdownloader

[![Build Status](https://travis-ci.org/schnatterer/photostationtagdownloader.svg?branch=develop)](https://travis-ci.org/schnatterer/photostationtagdownloader)
[![schnatterer/photostationtagdownloader@docker hub](https://images.microbadger.com/badges/image/schnatterer/photostationtagdownloader.svg)](https://hub.docker.com/r/schnatterer/photostationtagdownloader/)
[![QGate](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.photostationtagdownloader&metric=alert_status)](https://sonarcloud.io/dashboard?id=info.schnatterer.photostationtagdownloader)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.photostationtagdownloader&metric=coverage)](https://sonarcloud.io/dashboard?id=info.schnatterer.photostationtagdownloader)
[![TecDebt](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.photostationtagdownloader&metric=sqale_index)](https://sonarcloud.io/dashboard?id=info.schnatterer.photostationtagdownloader)

Downloads tagged photos (aka "smart albums") from a [Synology Photo Station](https://www.synology.com/dsm/feature/photo_station) into a single folder.

Use Case: 
* Set tags (i.e. [IPTC keywords](http://www.iptc.org/std/photometadata/documentation/userguide/index.htm#!Documents/generalimagecontent.htm)) for photos, grouping them into albums.
* photostationtagdownloader downloads those albums for you. For some reasons this cannot be achieved using the Photo Station web app, nor native Android or Windows apps.

# Usage

## Prebuilt binaries

Get the binary for your specific OS from the [release page](https://github.com/schnatterer/photostationtagdownloader/releases).

```bash
wget -O pstd https://github.com/schnatterer/photostationtagdownloader/releases/download/0.1.1/pstd-linux-x64
chmod +x pstd
```

Use it like so:

```bash
./pstd --user your-photostation-user --output photos/ http://diskstation
```

You will be prompted for the password.

## Docker

```bash
docker run schnatterer/photostationtagdownloader:0.1.1 --user your-photostation-user --output photos/ http://diskstation
```

## Node.js

You can also run it with your own node js instance.

```bash
yarn install
node src/app.js --user your-photostation-user --output photos/ http://diskstation
```

## Non-interactive password

If running in batch/non-interactive mode, you you can just pipe it to `pstd`.
Note that passwords showing up in the shell history or log files are a potential security risk.

```bash
echo "PW" | ./pstd -u ...
```

## Options

* `--flat` - downloads all photos of the chosen tags into a single folder
* `--tags` - downloads specific tags. Note that tags containing spaces must be quoted. Multiple tags can either be specified  
  * comma separated (e.g. `--tags "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--tags "tag one" --tags numberTwo`) 