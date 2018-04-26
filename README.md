# photostationtagdownloader

[![Build Status](https://travis-ci.org/schnatterer/photostationtagdownloader.svg?branch=master)](https://travis-ci.org/schnatterer/photostationtagdownloader)
[![QGate](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.photostationtagdownloader&metric=alert_status)](https://sonarcloud.io/dashboard?id=info.schnatterer.photostationtagdownloader)
[![TecDebt](https://sonarcloud.io/api/project_badges/measure?project=info.schnatterer.photostationtagdownloader&metric=sqale_index)](https://sonarcloud.io/dashboard?id=info.schnatterer.photostationtagdownloader)

Downloads all tagged photos from a [Synology Photo Station](https://www.synology.com/dsm/feature/photo_station) into a single folder.

# Usage

## Local

Get the binary for your specific OS version from [release page](https://github.com/schnatterer/photostationtagdownloader/releases).

```bash
wget -O pstd https://github.com/schnatterer/photostationtagdownloader/releases/download/0.1.0/pstd-linux-x64`
chmod +x pstd
```

Use it like so:

```bash
./pstd --user your-photostation-user --output photos/ http://diskstation`
```

You will be prompted for the password.

## Docker

```bash
docker run schnatterer/photostationtagdownloader:0.1.0 --user your-photostation-user --output photos/ http://diskstation
```

## Non-interactive password

If running in batch/non-interactive mode, you you can just pipe it to `pstd`.
Note that passwords showing up in the shell history or log files are a potential security risk.

```bash
echo "PW" | ./pstd -u ...
```
 