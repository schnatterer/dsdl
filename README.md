dsdl
====

[![Build Status](https://img.shields.io/github/actions/workflow/status/schnatterer/dsdl/build.yaml?branch=main)](https://github.com/schnatterer/dsdl/actions)
[![QGate](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=alert_status)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=coverage)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)
[![TecDebt](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.dsdl&metric=sqale_index)](https://sonarcloud.io/dashboard?id=info.schnatterer.dsdl)

DiskStation Downloader (formerly photostationtagdownloader / pstd)

Downloads files from [Synology DiskStation Manager](https://www.synology.com/dsm). Supports downloading
* photos (all photos of a tag / "smart album") via [Synology Photos](https://www.synology.com/dsm/feature/photos) / [Photo Station](https://www.synology.com/dsm/feature/photo_station) and
* audio (all songs of a playlist) via [Audio Station](https://www.synology.com/dsm/feature/audio_station)


# Table of contents

<!-- Update with `doctoc --notitle README.md --maxlevel 5`. See https://github.com/thlorenz/doctoc -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Features](#features)
  - [Photos](#photos)
  - [Audio](#audio)
- [Installation](#installation)
  - [npm](#npm)
  - [Prebuilt binaries](#prebuilt-binaries)
  - [Docker](#docker)
  - [Clone repo](#clone-repo)
- [Usage](#usage)
    - [General parameters](#general-parameters)
    - [DS Audio](#ds-audio)
    - [Synology Photos](#synology-photos)
    - [DS Photo](#ds-photo)
    - [Non-interactive password](#non-interactive-password)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Features

## Photos

* Set tags (i.e. [IPTC keywords](http://www.iptc.org/std/photometadata/documentation/userguide/index.htm#!Documents/generalimagecontent.htm)) for photos, grouping them into "smart albums" (DS photo)
* dsdl downloads those for you. For some reasons this cannot be achieved using the Photo Station web app, nor native Android or Windows apps.

## Audio

* Group your songs into playlists
* dsdl downloads those for you. You can also do this via the web UI (where the playlist is zipped) or with [DS audio](https://www.synology.com/dsm/feature/audio_station#download) but it does not seem to work reliably, and it cannot be scripted 😉

# Installation

## npm

You can install it as global package [from npm](https://www.npmjs.com/package/dsdl)

```shell
npm install -g dsdl

dsdl --version
```

Note that, ff running on android via [termux](https://termux.com/) and want to trigger dsdl from a termux widget,
you need to perform the following once after installation/upgrade:

```shell
termux-fix-shebang $(which dsdl)
```

## Prebuilt binaries

Get the binary for your specific OS from the [release page](https://github.com/schnatterer/dsdl/releases).

```bash
DSDL_VERSION=2.00
sudo wget -O /usr/local/bin dsdl \
  https://github.com/schnatterer/dsdl/releases/download/${DSDL_VERSION}/dsdl-linux-x64
sudo chmod +x /usr/local/bin/dsdl

dsdl --version
```

## Docker

[See quay.io](https://quay.io/repository/schnatterer/dsdl)

```bash
docker run --rm -ti -v $(pwd):/dsdl quay.io/schnatterer/dsdl \
  audio --user your-photostation-user --output /dsdl http://diskstation/photo
```

Make sure uid/gid `1000` are allowed to write into current folder.

## Clone repo

Of course, you can also run the latest version by cloning this repo.

```bash
git clone https://github.com/schnatterer/dsdl && cd dsdl
yarn install

node src/cli/dsdl.js photo --version
```

# Usage

* DS Audio
```shell
dsdl audio --user your-user --output music/ http://diskstation:5000/
```
* Synology Photos (DSM 7+) -
```shell
dsdl photos --user your-user --output music/ http://diskstation:5000/
```
* DS Photo (DSM < 7)
```shell
dsdl photo --user your-diskstsation-user --output photos/ http://diskstation/photo
```

You will be prompted for the password.

### General parameters

* `--folder-structure`
  * Default: `list` - creates subdirs for each list.
  * `flat` - writes all photos to a single folders.
  * `server` - creates same folder structure as on server (Works only for audio).  
    Or is there a way to get the album for a photo via the Synology Photo Station / Foto API?

### DS Audio

* `--playlists` - downloads specific playlists. Note that playlists containing spaces must be quoted. Multiple playlists can either be specified
  * comma separated (e.g. `--playlists "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--playlists "tag one" --playlists numberTwo`)
* `--m3u` - Create m3u playlist files for each downloaded playlist

### Synology Photos

Note that for synology photos right now a maximum of 5000 photos can be downloaded for a single tag

* `--tags` - downloads specific tags. Note that tags containing spaces must be quoted. Multiple tags can either be specified
  * comma separated (e.g. `--tags "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--tags "tag one" --tags numberTwo`)

### DS Photo

* `--tags` - downloads specific tags. Note that tags containing spaces must be quoted. Multiple tags can either be specified
  * comma separated (e.g. `--tags "tag one",numberTwo`) or
  * by using multiple parameters (e.g `--tags "tag one" --tags numberTwo`)

### Non-interactive password

If running in batch/non-interactive/headless mode, you you can just pipe it to `dsdl`.
Note that passwords showing up in the shell history or log files are a potential security risk.

```bash
echo "PW" | dsdl photo -u ...
```