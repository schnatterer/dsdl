// Needed for node < 10
const URLSearchParams = require('url').URLSearchParams;
const fs = require('fs');
const m3u = require('m3u')

const Downloader = require('./downloader.js');


class AudioDownloader extends Downloader {

    constructor(params) {

        super({
           ...params,
            listsToDownload: params.playlists,
            listType: 'playlist',
            fetchListsUrl: 'AudioStation/playlist.cgi',
            fetchListUrl: 'AudioStation/playlist.cgi',
            fetchFileUrl: 'AudioStation/download.cgi'
        });

        this.m3u = params.m3u;
    }

    findListInListsResponse(responseJson) {
        return responseJson.data.playlists;
    }

    findFilesInListResponse(responseJson) {

        const playlist = responseJson.data.playlists[0];

        if (this.m3u) {
            this.writeM3u(playlist);
        }

        return playlist.additional.songs
    }

    writeM3u(playlist) {
        const m3uWriter = m3u.writer();
        const name = playlist.name;
        const songs = playlist.additional.songs;

        songs.forEach( song => {
            m3uWriter.file(
                this.createDestinationPathDependingOnFolderStructure(song, playlist)
                    .replace(new RegExp(`^${this.output}/`, "g"),"")
            );
        });

        // Write synchronously because this function is no called outside our main promise pipe
        fs.writeFileSync(`${this.output}/${name}.m3u`, m3uWriter.toString());
    }

    findRelativePath(song) {
        if (this.folderStructure === 'server') {
            return song.path.replace('/music/', '')
        } else{
            //return song.path.split('/').pop();
            return song.path
        }
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