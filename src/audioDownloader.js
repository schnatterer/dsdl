// Needed for node < 10
const URLSearchParams = require('url').URLSearchParams;
const Downloader = require('./downloader.js');

class AudioDownloader extends Downloader {

    constructor(params) {

        super({
           ...params,
            listType: 'playlist',
            authUrl: 'auth.cgi',
            fetchListsUrl: 'AudioStation/playlist.cgi',
            fetchListUrl: 'AudioStation/playlist.cgi',
            fetchFileUrl: 'AudioStation/download.cgi'
        });
    }

    findListInListsResponse(responseJson) {
        return responseJson.data.playlists;
    }

    findFilesInListResponse(responseJson) {
        return responseJson.data.playlists[0].additional.songs
    }

    findRelativePath(song) {
        if (this.folderStructure === 'server') {
            return song.path.replace('/music/', '')
        } else{
            //return song.path.split('/').pop();
            return song.path
        }
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