const Downloader = require('./downloader.js');

class DsPhotoDownloader extends Downloader {

    constructor(params) {

        super({
            ...params,
            listsToDownload: params.tags,
            listType: 'tag',
            authUrl: 'auth.php',
            fetchListsUrl: 'tag.php',
            fetchListUrl: 'photo.php',
            fetchFileUrl: 'download.php'
        });

        if (params.folderStructure === 'server') {
            // If it is possible to get path (album?) of photo, we should just implement it in findRelativePath() and
            // Remove this block
            throw "folderStructure 'server' not supported for photos. "
        }
    }

    createAuthBody(username, password) {

        // The photo app seems to be a bit special - it could authenticate against http(s)://<dsm>:5000/webapi/auth.cgi
        // But: All other APIs seem not to work at this endpoint, only at http(s)://<dsm>/photo/webapi/
        // In turn http(s)://<dsm>/photo/webapi/auth.cgi yields HTTP 405 - Method not allowed
        // So: Use Photo Station's very own auth API and Endpoint 🙄
        let form = new URLSearchParams();
        form.append('api', 'SYNO.PhotoStation.Auth');
        form.append('method', 'login');
        form.append('version', '1');
        form.append('username', username);
        form.append('password', password);

        return form;
    }

    findListInListsResponse(responseJson) {
        return responseJson.data.tags;
    }

    findFilesInListResponse(responseJson) {
        return responseJson.data.items;
    }

    findRelativePath(photo) {
        let baseName = photo.info.name;
        if (photo.type === 'video') {
            let ending
            if (photo.additional && photo.additional.video_codec && photo.additional.video_codec.container) {
                ending = photo.additional.video_codec.container;
            } else {
                console.log(`WARNING: Could not find file ending for video. Defaulting to mp4`)
                ending = 'mp4'
            }
            baseName = `${baseName}.${ending}`
        }
        return baseName;
    }

    createFetchListsBody() {
        let form = new URLSearchParams();
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

    createFetchListBody(tag) {
        let form = new URLSearchParams();
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

    createFetchFileBody(photo) {
        let form = new URLSearchParams();
        if (photo.type === 'video') {
            form.append('method', 'getvideo');
        } else {
            form.append('method', 'getphoto');
        }
        form.append('id', photo.id);
        form.append('api', 'SYNO.PhotoStation.Download');
        form.append('version', '1');
        form.append('download', true);

        return form;
    }
}

module.exports = DsPhotoDownloader;