const Downloader = require('../src/downloader');
const nock = require('nock');

const baseUrl = 'http://diskstation';

describe("Cookies", () => {

    const expectedCookie = 'myCookie';
    const downloader = new Downloader(baseUrl, undefined);

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
            .rejects.toEqual( 'Authentication failed' );
    });

    test('auth returned non-200 code', () => {
        const returnCode = 500;
        mockAuthResponse(returnCode, { dont : 'care' });
        expect(downloader.auth('dont', 'care'))
            .rejects.toEqual( 'response not OK, when fetching auth. Status: ' + returnCode );
    });

    function mockAuthResponse(returnCode, response) {
        nock(baseUrl)
            .post('/photo/webapi/auth.php')
            .reply(returnCode, response, {
                'set-cookie': expectedCookie
            });
    }
});
