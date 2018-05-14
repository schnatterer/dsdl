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
        expect(downloader.auth('dont', 'care'))
            .rejects.toEqual('Authentication failed');
    });

    test('auth returned non-200 code', () => {
        const returnCode = 500;
        mockAuthResponse(returnCode, {dont: 'care'});
        expect(downloader.auth('dont', 'care'))
            .rejects.toEqual('response not OK, when fetching auth. Status: ' + returnCode);
    });

});

describe("Download photos", () => {

    const photos = [
        photo(1, 'one.jpg', 'fake-binary-data-1'), photo(2, 'two.png', 'fake-binary-data-too')
    ];
    const expectedOutputFolder = '/folder';

    beforeEach(() => {
        mockAuthResponse(200, {success: true});

        downloader.program.output = expectedOutputFolder;
        vol.reset();
        vol.mkdirSync(expectedOutputFolder);

        photos.forEach((photo) => mockPhotoDownload(photo.id, photo.data));
    });

    test('tag folder', async () => {

        await downloader.processPhotos(photos, tag('our-tag'));

        photos.forEach((photo) =>
            expect(vol.readFileSync(`/folder/our-tag/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
        expect(downloader.photosTotal).toBe(photos.length);
        expect(downloader.photosSkipped).toBe(0);
    });

    test('flat folder', async () => {
        downloader.program.flat = true;

        await downloader.processPhotos(photos, tag('our-tag'));

        photos.forEach((photo) =>
            expect(vol.readFileSync(`/folder/${photo.info.name}`, {encoding: 'ascii'})).toEqual(photo.data));
        expect(downloader.photosTotal).toBe(photos.length);
        expect(downloader.photosSkipped).toBe(0);
    });

    test('Skip existing', async () => {
        vol.mkdirSync(`/folder/our-tag`);
        vol.writeFileSync(`/folder/our-tag/${photos[0].info.name}`, 'some other data', {encoding: 'ascii'});

        await downloader.processPhotos(photos, tag('our-tag'));

        expect(vol.readFileSync(`/folder/our-tag/${photos[0].info.name}`, {encoding: 'ascii'})).toEqual('some other data');
        expect(downloader.photosTotal).toBe(2);
        expect(downloader.photosSkipped).toBe(1);
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

function mockPhotoDownload(photoId, response) {
    nock(baseUrl)
        .get(`/photo/webapi/download.php?api=SYNO.PhotoStation.Download&method=getphoto&version=1&id=${photoId}`)
        .reply(200, response);
}