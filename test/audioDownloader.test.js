const nock = require('nock');
jest.mock('fs', () => require('memfs').fs);
const AudioDownloader = require('../src/audioDownloader');
const vol = require('memfs').vol;


const output = '/output/dir';
const baseUrl = 'http://diskstation';
const expectedCookie = 'myCookie';

let downloader;
const password = 'dontCare';

beforeEach(() => {
    downloader = new AudioDownloader(baseUrl, {});
});

describe("Authentication", () => {

    test('unsuccessful auth', () => {
        mockAuthResponse(200, {success: false});

        expect.assertions(1);

        return expect(downloader.downloadAllPhotos(password))
            .rejects.toEqual('Authentication failed');
    });

    test('auth returns non-2xx code', () => {
        const returnCode = 500;
        mockAuthResponse(returnCode, {dont: 'care'});

        expect.assertions(1);

        return expect(downloader.downloadAllPhotos(password))
            .rejects.toEqual('response not OK, when fetching auth. Status: ' + returnCode);
    });

    // Successful auth tested with Songs & Playlists

});

describe("Songs & Playlists", () => {

    const expectedOutputFolder = '/folder';

    let songs = [];

    let playlists = [];

    beforeEach(() => {

        songs = [
            song(1, 'one.mp3', 'fake-binary-data-1'), song(2, 'two.mp3', 'fake-binary-data-too')
        ];

        playlists = [
            playlist(1, 'our-playlist', [songs[0]]), playlist(2, 'the other playlist', [songs[1]])
        ];
        
        nock.cleanAll();
        mockAuthResponse(200, {success: true});

        downloader.program.output = expectedOutputFolder;
        downloader.program.tags = [];

        vol.reset();
        vol.mkdirSync(expectedOutputFolder);
    });

    describe("Download songs", () => {

        test('playlist folder', async () => {
            playlists[0].songs.push(songs[1]);
            downloader.program.tags = [playlists[0].name];
            vol.reset();
            mockSuccessfulSongDownload(songs);
            mockSuccessfulTagResponse(playlists);
            mockFetchedPlaylists(playlists, 200, true);

            await downloader.downloadAllPhotos(password);

            songs.forEach((song) =>
                expect(vol.readFileSync(`/folder/${playlists[0].name}/${song.name}`, {encoding: 'ascii'})).toEqual(song.data));
            expect(downloader.photosTotal).toBe(songs.length);
            expect(downloader.photosDownloaded).toBe(songs.length);
            expect(downloader.photosSkipped).toBe(0);
        });

        test('flat folder', async () => {
            mockFetchedPlaylists(playlists, 200, true);
            mockSuccessfulTagResponse(playlists);
            
            mockSuccessfulSongDownload(songs);
            downloader.program.flat = true;

            await downloader.downloadAllPhotos(password);

            songs.forEach((song) =>
                expect(vol.readFileSync(`/folder/${song.name}`, {encoding: 'ascii'})).toEqual(song.data));
            expect(downloader.photosTotal).toBe(songs.length);
            expect(downloader.photosDownloaded).toBe(songs.length);
            expect(downloader.photosSkipped).toBe(0);
        });

        test('skip existing', async () => {
            mockFetchedPlaylists(playlists, 200, true);
            mockSuccessfulTagResponse(playlists);
            
            mockSuccessfulSongDownload(songs);

            vol.mkdirSync(`/folder/${playlists[0].name}`);
            vol.writeFileSync(`/folder/${playlists[0].name}/${songs[0].name}`, 'some other data', {encoding: 'ascii'});

            await downloader.downloadAllPhotos(password);

            expect(vol.readFileSync(`/folder/${playlists[0].name}/${songs[0].name}`, {encoding: 'ascii'})).toEqual('some other data');
            expect(downloader.photosTotal).toBe(2);
            expect(downloader.photosDownloaded).toBe(1);
            expect(downloader.photosSkipped).toBe(1);
        });

        test('returns non-2xx code', () => {
            mockFetchedPlaylists(playlists, 200, true);
            mockSuccessfulTagResponse(playlists);
            
            mockSongDownload(songs[0].id, 500, '');
            mockSongDownload(songs[1].id, 200, '');

            expect.assertions(1);

            return expect(downloader.downloadAllPhotos(password))
                .rejects.toEqual("Can't write photo, because response not OK. Status: 500. Photo: one.mp3 (id 1)");
        });

    });

    describe("Select Playlists", () => {

        test('no specific playlist selected, i.e. all playlists',  async () => {
            mockFetchedPlaylists(playlists, 200, true);
            
            mockSuccessfulSongDownload(songs);
            mockSuccessfulTagResponse(playlists);

            await downloader.downloadAllPhotos(password);

            playlists.forEach((playlist) =>
                playlist.songs.forEach((song) =>
                    expect(vol.readFileSync(`/folder/${playlist.name}/${song.name}`, {encoding: 'ascii'})).toEqual(song.data)));

            expect(downloader.tagsTotal).toBe(playlists.length);
            expect(downloader.photosTotal).toBe(2);
            expect(downloader.photosDownloaded).toBe(2);
            expect(downloader.photosSkipped).toBe(0);

        });

        test('specific playlist selected',  async () => {
            mockFetchedPlaylists(playlists, 200, true);
            
            mockSuccessfulSongDownload(songs);
            mockSuccessfulTagResponse(playlists);

            const expectedPlaylist = playlists[0];

            downloader.program.tags = [expectedPlaylist.name];

            await downloader.downloadAllPhotos(password);

            expectedPlaylist.songs.forEach((song) =>
                    expect(vol.readFileSync(`/folder/${expectedPlaylist.name}/${song.name}`, {encoding: 'ascii'})).toEqual(song.data));

            expect(downloader.tagsTotal).toBe(playlists.length);
            expect(downloader.photosTotal).toBe(1);
            expect(downloader.photosDownloaded).toBe(1);
            expect(downloader.photosSkipped).toBe(0);
        });

        test('playlist selected that does not exist',  async () => {
            mockFetchedPlaylists(playlists, 200, true);
            
            mockSuccessfulSongDownload(songs);
            mockSuccessfulTagResponse(playlists);

            downloader.program.tags = ['not existing'];

            await downloader.downloadAllPhotos(password);

            expect(downloader.tagsTotal).toBe(playlists.length);
            expect(downloader.photosTotal).toBe(0);
            expect(downloader.photosDownloaded).toBe(0);
            expect(downloader.photosSkipped).toBe(0);
        });


        test('unsuccessful playlist request', () => {
            mockFetchedPlaylists(playlists, 200, true);
            mockSuccessfulSongDownload(songs);
            
            mockPlaylistResponse(playlists[0], 200, true);
            mockPlaylistResponse(playlists[1], 200, false);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("Fetching tag \"the other playlist\" returned success=false"));
        });

        test('returns non-2xx code', () => {
            mockFetchedPlaylists(playlists, 200, true);
            mockSuccessfulSongDownload(songs);
            
            mockPlaylistResponse(playlists[0], 200, true);
            mockPlaylistResponse(playlists[1], 500, true);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("response not OK, when fetching tag the other playlist (id 2). Status: 500"));
        });
    });

    describe("Fetch Playlists", () => {

        test('Successful request', async () => {
            vol.reset();
            mockSuccessfulSongDownload(songs);
            mockSuccessfulTagResponse(playlists);
            mockFetchedPlaylists(playlists, 200, true);

            await downloader.downloadAllPhotos(password);

            expect(downloader.tagsTotal).toBe(playlists.length);
            expect(downloader.photosTotal).toBe(2);
            expect(downloader.photosSkipped).toBe(0);
            expect(downloader.photosDownloaded).toBe(2);
        });

        test('unsuccessful request', () => {
            mockFetchedPlaylists([], 200, false);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("Fetching all tags returned success=false"));
        });

        test('returns non-2xx code', () => {
            mockFetchedPlaylists([], 500, true);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("response not OK, when fetching all tags. Status: 500"));
        });
    });
});

function mockSuccessfulSongDownload(songs) {
    songs.forEach((photo) => mockSongDownload(photo.id, 200, photo.data));
}
function mockSuccessfulTagResponse(tags) {
    tags.forEach((tag) => mockPlaylistResponse(tag, 200, true));
}

function song(id, name, data) {
    // Note: Data is not a part of the productive object, just makes testing simpler
    return {id: id, path: `/some/path/${name}`, data: data, name: name}
}

function playlist(id, name, songs) {
    return {id: id, name: name, songs: songs};
}

function mockAuthResponse(returnCode, response) {
    nock(baseUrl)
        .post('/webapi/auth.cgi')
        .reply(returnCode, response, {
            'set-cookie': expectedCookie
        });
}

function mockSongDownload(songId, returnCode, response) {
    nock(baseUrl)
        .post('/webapi/AudioStation/download.cgi', function(body) {
            return body.includes(`songs=${songId}`);
        })
        .reply(returnCode, response);
}

function mockPlaylistResponse(playlist, returnCode, responseSuccessful) {
    nock(baseUrl)
        .post('/webapi/AudioStation/playlist.cgi', function(body) {
            return body.includes(`id=${playlist.id}`);
        })
        .reply(returnCode, {success: responseSuccessful, data: { playlists: [ { additional: { songs: playlist.songs } }] }});
}

function mockFetchedPlaylists(playlists, returnCode, responseSuccessful) {
    nock(baseUrl)
        .post('/webapi/AudioStation/playlist.cgi', function(body) {
            return body.includes(`method=list`);
        })
        .reply(returnCode, {success: responseSuccessful, data: {playlists: playlists}});
}