// Needed for node < 10
const URLSearchParams = require('url').URLSearchParams;
const DownloadService = require('./downloadService.js');

class AudioDownloader {

    constructor(program) {

        this.listType = 'playlist';

        this.downloadService = new DownloadService({
            url: program.url,
            output: program.output,
            flat: program.flat,
            listsToDownload: program.tags,
            user: program.user,

            listType: this.listType,

            authUrl: 'auth.cgi',
            createAuthBody: this.createAuthBody,

            fetchListsUrl: 'AudioStation/playlist.cgi',
            createFetchListsBody: this.createFetchListsBody,
            findListInListsResponse: this.findListInListsResponse,

            fetchListUrl: 'AudioStation/playlist.cgi',
            createFetchListBody: this.createFetchListBody,
            findFilesInListResponse: this.findFilesInListResponse,

            createFileName: this.createFileName,

            fetchFileUrl: 'AudioStation/download.cgi',
            createFetchFileBody: this.createFetchFileBody
        })
    }

    downloadAllFiles(password) {
        return this.downloadService.downloadAllFiles(password);
    };

    findListInListsResponse(responseJson) {
        return responseJson.data.playlists;
    }

    findFilesInListResponse(responseJson) {
        return responseJson.data.playlists[0].additional.songs
    }

    createFileName(song) {
        return song.path.split('/').pop();
    }

    createAuthBody(username, password) {

        let form = new URLSearchParams();
        form.append('api', 'SYNO.API.Auth');
        form.append('method', 'Login');
        form.append('version', '1');
        form.append('account', username);
        form.append('passwd', password);
        form.append('session', 'AudioStation');

        return form;
    }

    createFetchListsBody() {

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

    createFetchListBody(playlist) {

        let form = new URLSearchParams();
        form.append('id', playlist.id);
        form.append('library', playlist.library);
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

    createFetchFileBody(song) {

        let form = new URLSearchParams();
        form.append('songs', song.id);
        form.append('method', 'download');
        form.append('api', 'SYNO.AudioStation.Download');
        form.append('version', '1');
        form.append('filename', '');

        return form;
    }
}

module.exports = AudioDownloader;