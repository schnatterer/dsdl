const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const promisePipe = require('promisepipe');

class PhotoDownloader {

    constructor(url, program) {

        this.baseUrl = `${url}/webapi`;
        this.program = program;

        this.photosTotal = 0;
        this.photosDownloaded = 0;
        this.photosSkipped = 0;
        this.tagsTotal = 0;
        this.tagsDownloaded = [];

        this.cookie = undefined;
    }

    downloadAllPhotos(password) {

        return this.auth(this.program.user, password)
            .then(() => this.fetchAndProcessTags());
    };

    fetchAndProcessTags() {
        return this.fetchTags()
            .then(res => this.validatedToJson(res, "all tags"))
            .then(json => this.processTagsResponse(json));
    }

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
            throw `Fetching all tags returned success=false`
        }
    }

    processTags(tags) {
        let promises = [];

        this.createFolderIfNotExists(this.program.output);

        tags.forEach(tag => {
            this.tagsTotal++;
            if (this.allTagsSelected() || this.program.tags.includes(tag.name)) {
                this.tagsDownloaded.push(tag.name);
                    let promise = this.fetchTag(tag)
                        .then(res => this.validatedToJson(res, `tag ${tag.name} (id ${tag.id})`))
                        .then(json => this.processTagResponse(json, tag));
                promises.push(promise)
            }
        });

        this.program.tags.forEach(tag => {
            if (!this.tagsDownloaded.includes(tag)) {
                console.log(`WARNING: Selected tag "${tag}" not found on disk station`)
            }
        });

        return Promise.all(promises)
    }

    allTagsSelected() {
        // Not passing any tags is interpreted as all tags
        return this.program.tags.length === 0;
    }

    processTagResponse(responseJson, tag) {
        if (responseJson.success) {
            return this.processPhotos(responseJson.data.items, tag);
        } else {
            throw `Fetching tag "${tag.name}" returned success=false`
        }
    }

    async processPhotos(items, tag) {
        for (const photo of items) {
            this.photosTotal++;

            let path;
            const fileName = this.createFileName(photo);
            if (this.program.flat) {
                path = `${this.program.output}/${fileName}`;
            } else {
                let folder = `${this.program.output}/${tag.name}`;
                this.createFolderIfNotExists(folder);
                path = `${folder}/${fileName}`;
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

    createFileName(photo) {
        return photo.info.name;
    }

    writeToFileIfResponseOk(res, photo, path) {
        if (res.ok) {
            console.log('Writing ' + path);
            // Make sure that writing is finished before program exits
            this.photosDownloaded++;
            return promisePipe(res.body, fs.createWriteStream(path))
        } else {
            throw `Can't write photo, because response not OK. Status: ${res.status}. Photo: ${this.createFileName(photo)} (id ${photo.id})`;
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

        const url = `${this.baseUrl}/download.php`;
        console.log(`Trying to fetch photo ${this.createFileName(photo)} from ${url}`);

        let form = new FormData();
        form.append('id', photo.id);
        form.append('method', 'getphoto');
        form.append('api', 'SYNO.PhotoStation.Download');
        form.append('version', '1');

        return this.postToNas(url, form);
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

module.exports = PhotoDownloader;