'use strict';

const program = require('commander');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require("fs");
const read = require('read');
const promisePipe = require("promisepipe");

let cookie;
let baseUrl;

let photosTotal = 0;
let photosDownloaded = 0;
let photosSkipped = 0;
let tagsTotal = 0;
const startDate = new Date();

main();

function main() {

    cli();

    if (!fs.existsSync(program.output)) {
        fs.mkdirSync(program.output);
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {
        downloadAllPhotos(password)
            .then(() => {
                console.log(`Processed ${tagsTotal} tags, containing ${photosTotal} photos ` +
                    `(downloaded ${photosDownloaded}, skipped ${photosSkipped}) in ${(new Date() - startDate) / 1000}s`);
                process.exit()
            })
            .catch(err => {
                console.error(err);
                process.exit(1)
            });
    });
}

function cli() {
    let urlVal = '';

    program
        .version('0.1.2-SNAPSHOT', '-v, --version')
        .arguments('<url>').action(function (url) {
        urlVal = url
    })
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .parse(process.argv);

    if (!program.user || !program.output || !urlVal) {
        program.help()
    }
    baseUrl = `${urlVal}/photo/webapi`;
}

function downloadAllPhotos(password) {

    return auth(program.user, password)
        .then(() => fetchTags()
            .then(res => validatedToJson(res, "all tags"))
            .then(json => processTagsResponse(json)))
}

function validatedToJson(res, target) {
    if (res.ok) {
        return res.json()
    } else {
        throw "response not OK, when fetching " + target + ". Status:" + res.status;
    }
}

function processTagsResponse(responseJson) {
    if (responseJson.success) {
        return processTags(responseJson.data.tags);
    } else {
        throw `Request returned success=false: ${responseJson}`
    }
}

function processTags(tags) {
    let promises = [];

    tags.forEach(tag => {
        tagsTotal++;
        let promise = fetchTag(tag)
            .then(res => validatedToJson(res, `tag ${tag.name} (id ${tag.id})`))
            .then(json => processTagResponse(json));
        promises.push(promise)
    });

    return Promise.all(promises)
}

function processTagResponse(responseJson) {
    if (responseJson.success) {
        return processPhotos(responseJson.data.items);
    } else {
        throw `Request returned success=false: ${responseJson}`
    }
}

async function processPhotos(items) {
    for (const photo of items) {
        photosTotal++;
        let path = program.output + photo.info.name;
        if (fs.existsSync(path)) {
            console.log(`Skipping file, because it already exists: ${path}`)
            photosSkipped++;
        } else {
            // Don't open too many connections in parallel
            await fetchPhoto(photo)
                .then(res => writeToFileIfResponseOk(res, photo));
        }
    }
}

function writeToFileIfResponseOk(res, photo) {
    if (res.ok) {
        let path = program.output + photo.info.name;
        console.log('Writing ' + path);
        // Make sure that writing is finished before program exits
        photosDownloaded++;
        return promisePipe(res.body, fs.createWriteStream(path))
    } else {
        throw "Can't write photo, because response not OK. Status:" + res.status + ". Photo " + photo.info.name + " (id " + photo.info.id + ")";
    }
}

function auth(username, password) {
    const url = baseUrl + '/auth.php';
    console.log("Trying to fetch " + url);

    let form = new FormData();
    form.append('api', 'SYNO.PhotoStation.Auth');
    form.append('method', 'login');
    form.append('version', '1');
    form.append('username', username);
    form.append('password', password);

    return postToNas(url, form)
        .then(res => {
            cookie = res.headers.get('set-cookie');
            return validatedToJson(res, "auth");
        }).then(responseJson => {
            if (!responseJson.success) {
                throw "Authentication failed"
            }
        })
}

function fetchTags() {
    const url = baseUrl + '/tag.php';
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

    return postToNas(url, form);
}

function fetchTag(tag) {
    const url = baseUrl + '/photo.php';

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

    return postToNas(url, form);
}

function fetchPhoto(photo) {

    const url = `${baseUrl}/download.php?api=SYNO.PhotoStation.Download&method=getphoto&version=1&id=${photo.id}`;
    console.log(`Trying to fetch photo ${photo.info.name} from ${url}`);

    return getFromNas(url)
}

function getFromNas(url) {
    return fetch(url, {
        method: 'GET',
        headers: headers()
    });
}

function postToNas(url, form) {
    return fetch(url, {
        method: 'POST',
        body: form,
        headers: headers()
    });
}

function headers() {
    return {
        Cookie: cookie
    };
}
