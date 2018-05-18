const nock = require('nock');
jest.mock('fs', () => require('memfs').fs);
const Downloader = require('../src/downloader');
const vol = require('memfs').vol;


const output = '/output/dir';
const baseUrl = 'http://diskstation';
const expectedCookie = 'myCookie';

let downloader;

beforeEach(() => {
    downloader = new Downloader(baseUrl, {});
});

describe("Cookies", () => {

    test('without auth', () => {
        expect(downloader.headers()).toEqual({
            Cookie: undefined
        });
    });

    test('successful auth', async () => {
        mockAuthResponse(200, {success: true});

        await downloader.auth('dont', 'care');

        expect(downloader.headers()).toEqual({Cookie: expectedCookie})
    });

    test('unsuccessful auth', () => {
        mockAuthResponse(200, {success: false});

        expect.assertions(1);

        return expect(downloader.auth('dont', 'care'))
            .rejects.toEqual('Authentication failed');
    });

    test('auth returns non-2xx code', () => {
        const returnCode = 500;
        mockAuthResponse(returnCode, {dont: 'care'});

        expect.assertions(1);

        return expect(downloader.auth('dont', 'care'))
            .rejects.toEqual('response not OK, when fetching auth. Status: ' + returnCode);
    });

});

describe("Download photos", () => {

    const photos = [
        photo(1, 'one.jpg', 'fake-binary-data-1'), photo(2, 'two.png', 'fake-binary-data-too')
    ];
    const expectedOutputFolder = '/folder';

    beforeEach(() => {
        nock.cleanAll()
        mockAuthResponse(200, {success: true});

        downloader.program.output = expectedOutputFolder;
        vol.reset();
        vol.mkdirSync(expectedOutputFolder);
    });

    test('tag folder', async () => {
        photos.forEach((photo) => mockPhotoDownload(photo.id, 200, photo.data));

        await downloader.processPhotos(photos, tag('our-tag'));

        photos.forEach((photo) =>
            expect(vol.readFileSync(`/folder/our-tag/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
        expect(downloader.photosTotal).toBe(photos.length);
        expect(downloader.photosDownloaded).toBe(photos.length);
        expect(downloader.photosSkipped).toBe(0);
    });

    test('flat folder', async () => {
        photos.forEach((photo) => mockPhotoDownload(photo.id, 200, photo.data));
        downloader.program.flat = true;

        await downloader.processPhotos(photos, tag('our-tag'));

        photos.forEach((photo) =>
            expect(vol.readFileSync(`/folder/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
        expect(downloader.photosTotal).toBe(photos.length);
        expect(downloader.photosDownloaded).toBe(photos.length);
        expect(downloader.photosSkipped).toBe(0);
    });

    test('skip existing', async () => {
        photos.forEach((photo) => mockPhotoDownload(photo.id, 200, photo.data));

        vol.mkdirSync(`/folder/our-tag`);
        vol.writeFileSync(`/folder/our-tag/${photos[0].info.name}`, 'some other data', {encoding: 'ascii'});

        await downloader.processPhotos(photos, tag('our-tag'));

        expect(vol.readFileSync(`/folder/our-tag/${photos[0].info.name}`, {encoding: 'ascii'})).toEqual('some other data');
        expect(downloader.photosTotal).toBe(2);
        expect(downloader.photosDownloaded).toBe(1);
        expect(downloader.photosSkipped).toBe(1);
    });

    test('returns non-2xx code', () => {
        mockPhotoDownload(photos[0].id, 500, '');
        mockPhotoDownload(photos[1].id, 200, '');

        expect.assertions(1);

        return expect(downloader.processPhotos(photos, tag('our-tag')))
            .rejects.toEqual("Can't write photo, because response not OK. Status: 500. Photo: one.jpg (id 1)");
    });

});

function photo(id, name, data) {
    // Note: Data is not a part of the productive object, just makes testing simpler
    return {id: id, info: {name: name}, data: data}
}

function tag(name) {
    return {name: name};
}

function mockAuthResponse(returnCode, response) {
    nock(baseUrl)
        .post('/photo/webapi/auth.php')
        .reply(returnCode, response, {
            'set-cookie': expectedCookie
        });
}

function mockPhotoDownload(photoId, returnCode, response) {
    nock(baseUrl)
        .get(`/photo/webapi/download.php?api=SYNO.PhotoStation.Download&method=getphoto&version=1&id=${photoId}`)
        .reply(returnCode, response);
}