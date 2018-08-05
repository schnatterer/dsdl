const nock = require('nock');
jest.mock('fs', () => require('memfs').fs);
const PhotoDownloader = require('../src/photoDownloader');
const vol = require('memfs').vol;


const output = '/output/dir';
const baseUrl = 'http://diskstation';
const expectedCookie = 'myCookie';

let downloader;
const password = 'dontCare';


beforeEach(() => {
    const program = {
        url: baseUrl,
        user: 'ignored'
    };
    downloader = new PhotoDownloader(program);
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

    // Successful auth tested with photos and tags

});

describe("Photos & Tags", () => {

    const expectedOutputFolder = '/folder';

    let photos = [];

    let tags = [];

    beforeEach(() => {
        photos = [
            photo(1, 'one.jpg', 'fake-binary-data-1'), photo(2, 'two.png', 'fake-binary-data-too')
        ];
        tags = [
            tag(1, 'our-tag', [photos[0]]), tag(2, 'the other tag', [photos[1]])
        ];

        nock.cleanAll();
        mockAuthResponse(200, {success: true});

        downloader.downloadService.output = expectedOutputFolder;
        downloader.downloadService.listsToDownload = [];

        vol.reset();
        vol.mkdirSync(expectedOutputFolder);
    });

    describe("Download photos", () => {

        test('tag folder', async () => {
            tags[0].photos.push(photos[1]);
            downloader.downloadService.listsToDownload = [tags[0].name];
            vol.reset();
            mockSuccessfulPhotoDownload(photos);
            mockSuccessfulTagResponse(tags);
            mockFetchedTags(tags, 200, true);

            await downloader.downloadAllPhotos(password);

            photos.forEach((photo) =>
                expect(vol.readFileSync(`/folder/${tags[0].name}/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
            expect(downloader.downloadService.filesTotal).toBe(photos.length);
            expect(downloader.downloadService.filesDownloaded).toBe(photos.length);
            expect(downloader.downloadService.filesSkipped).toBe(0);
        });

        test('flat folder', async () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulTagResponse(tags);

            mockSuccessfulPhotoDownload(photos);
            downloader.downloadService.flat = true;

            await downloader.downloadAllPhotos(password);

            photos.forEach((photo) =>
                expect(vol.readFileSync(`/folder/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
            expect(downloader.downloadService.filesTotal).toBe(photos.length);
            expect(downloader.downloadService.filesDownloaded).toBe(photos.length);
            expect(downloader.downloadService.filesSkipped).toBe(0);
        });

        test('skip existing', async () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulTagResponse(tags);

            mockSuccessfulPhotoDownload(photos);

            vol.mkdirSync(`/folder/${tags[0].name}`);
            vol.writeFileSync(`/folder/${tags[0].name}/${photos[0].info.name}`, 'some other data', {encoding: 'ascii'});

            await downloader.downloadAllPhotos(password);

            expect(vol.readFileSync(`/folder/${tags[0].name}/${photos[0].info.name}`, {encoding: 'ascii'})).toEqual('some other data');
            expect(downloader.downloadService.filesTotal).toBe(2);
            expect(downloader.downloadService.filesDownloaded).toBe(1);
            expect(downloader.downloadService.filesSkipped).toBe(1);
        });

        test('returns non-2xx code', () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulTagResponse(tags);

            mockPhotoDownload(photos[0].id, 500, '');
            mockPhotoDownload(photos[1].id, 200, '');

            expect.assertions(1);

            return expect(downloader.downloadAllPhotos(password))
                .rejects.toEqual("Can't write photo, because response not OK. Status: 500. Photo: one.jpg (id 1)");
        });

    });

    describe("Select Tags", () => {

        test('no specific tag selected, i.e. all tags',  async () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulPhotoDownload(photos);
            mockSuccessfulTagResponse(tags);

            await downloader.downloadAllPhotos(password);

            tags.forEach((tag) =>
                tag.photos.forEach((photo) =>
                    expect(vol.readFileSync(`/folder/${tag.name}/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data)));

            expect(downloader.downloadService.listsTotal).toBe(tags.length);
            expect(downloader.downloadService.filesTotal).toBe(2);
            expect(downloader.downloadService.filesDownloaded).toBe(2);
            expect(downloader.downloadService.filesSkipped).toBe(0);

        });

        test('specific tag selected',  async () => {
            mockFetchedTags(tags, 200, true);

            mockSuccessfulPhotoDownload(photos);
            mockSuccessfulTagResponse(tags);

            const expectedTag = tags[0];

            downloader.downloadService.listsToDownload = [expectedTag.name];

            await downloader.downloadAllPhotos(password);

            expectedTag.photos.forEach((photo) =>
                    expect(vol.readFileSync(`/folder/${expectedTag.name}/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));

            expect(downloader.downloadService.listsTotal).toBe(tags.length);
            expect(downloader.downloadService.filesTotal).toBe(1);
            expect(downloader.downloadService.filesDownloaded).toBe(1);
            expect(downloader.downloadService.filesSkipped).toBe(0);
        });

        test('tag selected that does not exist',  async () => {
            mockFetchedTags(tags, 200, true);

            mockSuccessfulPhotoDownload(photos);
            mockSuccessfulTagResponse(tags);

            downloader.downloadService.listsToDownload = ['not existing'];

            await downloader.downloadAllPhotos(password);

            expect(downloader.downloadService.listsTotal).toBe(tags.length);
            expect(downloader.downloadService.filesTotal).toBe(0);
            expect(downloader.downloadService.filesDownloaded).toBe(0);
            expect(downloader.downloadService.filesSkipped).toBe(0);
        });


        test('unsuccessful tag request', () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulPhotoDownload(photos);

            mockTagResponse(tags[0], 200, true);
            mockTagResponse(tags[1], 200, false);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("Fetching tag \"the other tag\" returned success=false"));
        });

        test('returns non-2xx code', () => {
            mockFetchedTags(tags, 200, true);
            mockSuccessfulPhotoDownload(photos);

            mockTagResponse(tags[0], 200, true);
            mockTagResponse(tags[1], 500, true);


            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("response not OK, when fetching tag \"the other tag\" (id 2). Status: 500"));
        });
    });

    describe("Fetch Tags", () => {

        test('Successful request', async () => {
            vol.reset();
            mockSuccessfulPhotoDownload(photos);
            mockSuccessfulTagResponse(tags);
            mockFetchedTags(tags, 200, true);

            await downloader.downloadAllPhotos(password);

            expect(downloader.downloadService.listsTotal).toBe(tags.length);
            expect(downloader.downloadService.filesTotal).toBe(2);
            expect(downloader.downloadService.filesSkipped).toBe(0);
            expect(downloader.downloadService.filesDownloaded).toBe(2);
        });

        test('unsuccessful request', () => {
            mockFetchedTags([], 200, false);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("Fetching all tags returned success=false"));
        });

        test('returns non-2xx code', () => {
            mockFetchedTags([], 500, true);

            expect.assertions(1);

            return downloader.downloadAllPhotos(password)
                .catch(e => expect(e).toEqual("response not OK, when fetching all tags. Status: 500"));
        });
    });
});

function mockSuccessfulPhotoDownload(photos) {
    photos.forEach((photo) => mockPhotoDownload(photo.id, 200, photo.data));
}
function mockSuccessfulTagResponse(tags) {
    tags.forEach((tag) => mockTagResponse(tag, 200, true));
}

function photo(id, name, data) {
    // Note: Data is not a part of the productive object, just makes testing simpler
    return {id: id, info: {name: name}, data: data}
}

function tag(id, name, photos) {
    return {id: id, name: name, photos: photos};
}

function mockAuthResponse(returnCode, response) {
    nock(baseUrl)
        .post('/webapi/auth.php')
        .reply(returnCode, response, {
            'set-cookie': expectedCookie
        });
}

function mockPhotoDownload(photoId, returnCode, response) {
    nock(baseUrl)
        .post(`/webapi/download.php`, new RegExp(`form-data; name="id"[^]*${photoId}`,'m'))
        .reply(returnCode, response);
}

function mockTagResponse(tag, returnCode, responseSuccessful) {
    nock(baseUrl)
        .post(`/webapi/photo.php`, new RegExp(`form-data; name="filter_tag"[^]*${tag.id}`,'m'))
        .reply(returnCode, {success: responseSuccessful, data: {items: tag.photos}});
}

function mockFetchedTags(tags, returnCode, responseSuccessful) {
    nock(baseUrl)
        .post(`/webapi/tag.php`)
        .reply(returnCode, {success: responseSuccessful, data: {tags: tags}});
}