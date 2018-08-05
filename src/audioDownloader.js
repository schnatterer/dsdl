// Needed for node < 10
const URLSearchParams = require('url').URLSearchParams
const SynologyDownloadService = require('./downloadService.js');

class AudioDownloader {

    constructor(program) {

        this.downloadService = new SynologyDownloadService({
            url: program.url,
            output: program.output,
            flat: program.flat,
            listsToDownload: program.tags,
            user: program.user,

            listType: 'playlist',

            authUrl: 'auth.cgi',
            createAuthBody: this.auth,

            fetchListsUrl: 'AudioStation/playlist.cgi',
            createFetchListsBody: this.fetchTags,
            findListInListsResponse: this.processTagsResponse,

            fetchListUrl: 'AudioStation/playlist.cgi',
            createFetchListBody: this.fetchTag,
            findFilesInListResponse: this.processTagResponse,

            createFileName: this.createFileName,

            fetchFileUrl: 'AudioStation/download.cgi',
            createFetchFileBody : this.fetchPhoto
        })
    }

    downloadAllPhotos(password) {
        return this.downloadService.downloadAllFiles(password);
    };

    processTagsResponse(responseJson) {
        return responseJson.data.playlists;
    }

    processTagResponse(responseJson) {
        return responseJson.data.playlists[0].additional.songs
    }

    createFileName(photo) {
        return photo.path.split('/').pop();
    }

    auth(username, password) {

        let form = new URLSearchParams();
        form.append('api', 'SYNO.API.Auth');
        form.append('method', 'Login');
        form.append('version', '1');
        form.append('account', username);
        form.append('passwd', password);
        form.append('session', 'AudioStation');

        return form;
    }

    fetchTags() {

        let form = new URLSearchParams();
        form.append('method', 'list');
        form.append('api', 'SYNO.AudioStation.Playlist');
        form.append('version', '3');
        form.append('sort_by', '');
        form.append('sort_direction', 'ASC');
        form.append('limit', '999999999999');
        form.append('library', 'shared');

        return form;
    }

    fetchTag(tag) {

        let form = new URLSearchParams();
        form.append('id', tag.id);
        form.append('library', tag.library);
        form.append('method', 'getinfo');
        form.append('api', 'SYNO.AudioStation.Playlist');
        form.append('version', '3');
        form.append('limit', '1000000');
        // songs_song_audio = kbps etc
        // songs_song_rating
        // sharing_info
        // songs_song_tag Artist name and such
        form.append('additional', 'songs_song_tag');
        form.append('sort_by', '');
        form.append('sort_direction', 'ASC');

        return form;
    }

    fetchPhoto(photo) {

        let form = new URLSearchParams();
        form.append('songs', photo.id);
        form.append('method', 'download');
        form.append('api', 'SYNO.AudioStation.Download');
        form.append('version', '1');
        form.append('filename', '');

        return form;
    }
}

module.exports = AudioDownloader;