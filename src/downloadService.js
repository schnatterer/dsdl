const fetch = require('node-fetch');
const fs = require('fs');
const promisePipe = require('promisepipe');

class SynologyDownloadService {

    constructor(params) {

        this.baseUrl = `${params.url}/webapi`;
        this.output = params.output;
        this.flat = params.flat;
        this.listsToDownload = params.listsToDownload;
        this.user = params.user;


        this.listType = params.listType;
        // e.g auth.php
        this.authUrl = params.authUrl;
        this.createAuthBody = params.createAuthBody;

        // e.g tag.php'
        this.fetchListsUrl = params.fetchListsUrl;
        this.createFetchListsBody = params.createFetchListsBody;
        // responseJson.data.tags
        this.findListInListsResponse = params.findListInListsResponse;

        // e.g photo.php'
        this.fetchListUrl = params.fetchListUrl;
        this.createFetchListBody = params.createFetchListBody;
        // responseJson.data.items
        this.findFilesInListResponse = params.findFilesInListResponse;

        this.createFileName = params.createFileName;

        // download.php
        this.fetchFileUrl = params.fetchFileUrl;
        this.createFetchFileBody = params.createFetchFileBody;

        // TODO move to stats object and return from downloadAllFiles()
        this.filesTotal = 0;
        this.filesDownloaded = 0;
        this.filesSkipped = 0;
        this.listsTotal = 0;
        this.listsDownloaded = [];

        this.cookie = undefined;
    }

    downloadAllFiles(password) {

        return this.auth(this.user, password)
            .then(() => this.fetchAndProcessLists());
    };


    auth(username, password) {
        const url = `${this.baseUrl}/${this.authUrl}`;
        console.log("Trying to fetch " + url);

        return this.postToNas(url, this.createAuthBody(username, password))
            .then(res => {
                this.cookie = res.headers.get('set-cookie');
                return this.validatedToJson(res, "auth");
            }).then(responseJson => {
                if (!responseJson.success) {
                    throw "Authentication failed"
                }
            })
    }

    fetchAndProcessLists() {
        return this.fetchLists()
            .then(res => this.validatedToJson(res, `all ${this.listType}s`))
            .then(json => this.processListsResponse(json));
    }

    validatedToJson(res, target) {
        if (res.ok) {
            return res.json()
        } else {
            throw `response not OK, when fetching ${target}. Status: ${res.status}`;
        }
    }

    processListsResponse(responseJson) {
        if (responseJson.success) {
            return this.processLists(this.findListInListsResponse(responseJson));
        } else {
            throw `Fetching all ${this.listType}s returned success=false`
        }
    }

    processLists(lists) {
        let promises = [];

        this.createFolderIfNotExists(this.output);

        lists.forEach(list => {
            this.listsTotal++;
            if (this.allListsSelected() || this.listsToDownload.includes(list.name)) {
                this.listsDownloaded.push(list.name);
                let promise = this.fetchList(list)
                    .then(res => this.validatedToJson(res, `${this.listType} "${list.name}" (id ${list.id})`))
                    .then(json => this.processListResponse(json, list));
                promises.push(promise)
            }
        });

        this.listsToDownload.forEach(list => {
            if (!this.listsDownloaded.includes(list)) {
                console.log(`WARNING: Selected ${this.listType} "${list}" not found on disk station`)
            }
        });

        return Promise.all(promises)
    }

    allListsSelected() {
        // Not passing any lists is interpreted as all lists
        return this.listsToDownload.length === 0;
    }

    processListResponse(responseJson, list) {
        if (responseJson.success) {
            return this.processFiles(this.findFilesInListResponse(responseJson), list);
        } else {
            throw `Fetching ${this.listType} "${list.name}" returned success=false`
        }
    }

    async processFiles(files, list) {
        for (const file of files) {
            this.filesTotal++;

            let path;
            const fileName = this.createFileName(file);
            if (this.flat) {
                path = `${this.output}/${fileName}`;
            } else {
                let folder = `${this.output}/${list.name}`;
                this.createFolderIfNotExists(folder);
                path = `${folder}/${fileName}`;
            }

            if (fs.existsSync(path)) {
                console.log(`Skipping file, because it already exists: ${path}`);
                this.filesSkipped++;
            } else {
                // Don't open too many connections in parallel
                await this.fetchFile(file)
                    .then(res => this.writeToFileIfResponseOk(res, file, path));
            }
        }
    }

    writeToFileIfResponseOk(res, photo, path) {
        if (res.ok) {
            console.log('Writing ' + path);
            // Make sure that writing is finished before program exits
            this.filesDownloaded++;
            return promisePipe(res.body, fs.createWriteStream(path))
        } else {
            throw `Can't write photo, because response not OK. Status: ${res.status}. Photo: ${this.createFileName(photo)} (id ${photo.id})`;
        }
    }

    fetchLists() {
        const url = `${this.baseUrl}/${this.fetchListsUrl}`;
        console.log("Trying to fetch " + url);

        return this.postToNas(url, this.createFetchListsBody());
    }

    fetchList(list) {
        const url = `${this.baseUrl}/${this.fetchListUrl}`;

        console.log("Trying to fetch " + list.name + " (id " + list.id + ") from " + url);

        return this.postToNas(url, this.createFetchListBody(list));
    }

    fetchFile(file) {

        const url = `${this.baseUrl}/${this.fetchFileUrl}`;
        console.log(`Trying to fetch file ${this.createFileName(file)} from ${url}`);

        return this.postToNas(url, this.createFetchFileBody(file));
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

module.exports = SynologyDownloadService;