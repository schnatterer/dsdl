const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const promisePipe = require("promisepipe");

class Downloader {

    constructor(url, program) {

        this.baseUrl = `${url}/photo/webapi`;
        this.program = program;
        this.photosTotal = 0;
        this.photosDownloaded = 0;
        this.photosSkipped = 0;
        this.tagsTotal = 0;

        this.cookie = undefined;
    }

    downloadAllPhotos(password) {

        return this.auth(this.program.user, password)
            .then(() => this.fetchTags()
                .then(res => this.validatedToJson(res, "all tags"))
                .then(json => this.processTagsResponse(json)))
    };

    validatedToJson(res, target) {
        if (res.ok) {
            return res.json()
        } else {
            throw `response not OK, when fetching ${target}. Status: ${res.status}`;
        }
    }

    processTagsResponse(responseJson) {
        if (responseJson.success) {
            return this.processTags(responseJson.data.tags);
        } else {
            throw `Request returned success=false: ${responseJson}`
        }
    }

    processTags(tags) {
        let promises = [];

        this.createFolderIfNotExists(this.program.output);

        tags.forEach(tag => {
            this.tagsTotal++;
            let promise = this.fetchTag(tag)
                .then(res => this.validatedToJson(res, `tag ${tag.name} (id ${tag.id})`))
                .then(json => this.processTagResponse(json, tag));
            promises.push(promise)
        });

        return Promise.all(promises)
    }

    processTagResponse(responseJson, tag) {
        if (responseJson.success) {
            return this.processPhotos(responseJson.data.items, tag);
        } else {
            throw `Request returned success=false: ${responseJson}`
        }
    }

    async processPhotos(items, tag) {
        for (const photo of items) {
            this.photosTotal++;

            let path;
            if (this.program.flat) {
                path = `${this.program.output}/${photo.info.name}`;
            } else {
                let folder = `${this.program.output}/${tag.name}`;
                this.createFolderIfNotExists(folder);
                path = `${folder}/${photo.info.name}`;
            }

            if (fs.existsSync(path)) {
                console.log(`Skipping file, because it already exists: ${path}`);
                this.photosSkipped++;
            } else {
                // Don't open too many connections in parallel
                await this.fetchPhoto(photo)
                    .then(res => this.writeToFileIfResponseOk(res, photo, path));
            }
        }
    }

    writeToFileIfResponseOk(res, photo, path) {
        if (res.ok) {
            console.log('Writing ' + path);
            // Make sure that writing is finished before program exits
            this.photosDownloaded++;
            return promisePipe(res.body, fs.createWriteStream(path))
        } else {
            throw `Can't write photo, because response not OK. Status: ${res.status}. Photo: ${photo.info.name} (id ${photo.id})`;
        }
    }

    auth(username, password) {
        const url = this.baseUrl + '/auth.php';
        console.log("Trying to fetch " + url);

        let form = new FormData();
        form.append('api', 'SYNO.PhotoStation.Auth');
        form.append('method', 'login');
        form.append('version', '1');
        form.append('username', username);
        form.append('password', password);

        return this.postToNas(url, form)
            .then(res => {
                this.cookie = res.headers.get('set-cookie');
                return this.validatedToJson(res, "auth");
            }).then(responseJson => {
                if (!responseJson.success) {
                    throw "Authentication failed"
                }
            })
    }

    fetchTags() {
        const url = this.baseUrl + '/tag.php';
        console.log("Trying to fetch " + url);

        let form = new FormData();
        form.append('type', 'desc');
        form.append('sort_by', 'title');
        form.append('sort_direction', 'asc');
        form.append('api', 'SYNO.PhotoStation.Tag');
        form.append('method', 'list');
        form.append('version', '1');
        form.append('offset', '0');
        form.append('thumbnail_status', 'true');
        form.append('limit', '999999999999');
        form.append('additional', 'info,thumb_size');

        return this.postToNas(url, form);
    }

    fetchTag(tag) {
        const url = this.baseUrl + '/photo.php';

        console.log("Trying to fetch tag " + tag.name + " (id " + tag.id + ") from " + url);

        let form = new FormData();
        form.append('filter_tag', tag.id);
        form.append('sort_by', 'filename');
        form.append('sort_direction', 'asc');
        form.append('api', 'SYNO.PhotoStation.Photo');
        form.append('method', 'list');
        form.append('version', '1');
        form.append('offset', '0');
        form.append('limit', '999999999999');
        form.append('type', 'photo,video');
        form.append('additional', 'photo_exif,video_codec,video_quality,thumb_size');

        return this.postToNas(url, form);
    }

    fetchPhoto(photo) {

        const url = `${this.baseUrl}/download.php?api=SYNO.PhotoStation.Download&method=getphoto&version=1&id=${photo.id}`;
        console.log(`Trying to fetch photo ${photo.info.name} from ${url}`);

        return this.getFromNas(url)
    }

    getFromNas(url) {
        return fetch(url, {
            method: 'GET',
            headers: this.headers()
        });
    }

    postToNas(url, form) {
        return fetch(url, {
            method: 'POST',
            body: form,
            headers: this.headers()
        });
    }

    headers() {
        return {
            Cookie: this.cookie
        };
    }

    createFolderIfNotExists(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }
}

module.exports = Downloader;