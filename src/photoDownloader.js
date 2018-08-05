const FormData = require('form-data');
const SynologyDownloadService = require('./downloadService.js');

class PhotoDownloader {

    constructor(program) {

        this.downloadService = new SynologyDownloadService({
            url: program.url,
            output: program.output,
            flat: program.flat,
            listsToDownload: program.tags,
            user: program.user,

            listType: 'tag',

            authUrl: 'auth.php',
            createAuthBody: this.auth,

            fetchListsUrl: 'tag.php',
            createFetchListsBody: this.fetchTags,
            findListInListsResponse: this.processTagsResponse,

            fetchListUrl: 'photo.php',
            createFetchListBody: this.fetchTag,
            findFilesInListResponse: this.processTagResponse,

            createFileName: this.createFileName,

            fetchFileUrl: 'download.php',
            createFetchFileBody : this.fetchPhoto
        })
    }

    downloadAllPhotos(password) {
        return this.downloadService.downloadAllFiles(password);
    };

    auth(username, password) {

        let form = new FormData();
        form.append('api', 'SYNO.PhotoStation.Auth');
        form.append('method', 'login');
        form.append('version', '1');
        form.append('username', username);
        form.append('password', password);

        return form;
    }

    processTagsResponse(responseJson) {
        return responseJson.data.tags;
    }

    processTagResponse(responseJson) {
        return responseJson.data.items;
    }

    createFileName(photo) {
        return photo.info.name;
    }

    fetchTags() {
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

        return form;
    }

    fetchTag(tag) {
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

        return form;
    }

    fetchPhoto(photo) {
        let form = new FormData();
        form.append('id', photo.id);
        form.append('method', 'getphoto');
        form.append('api', 'SYNO.PhotoStation.Download');
        form.append('version', '1');

        return form;
    }
}

module.exports = PhotoDownloader;