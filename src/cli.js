const program = require('commander');
const read = require('read');
const startDate = new Date();

const AudioDownloader = require('./audioDownloader.js');
const PhotoDownloader = require('./photoDownloader.js');

function cli() {


    program
        .version('1.0.0-SNAPSHOT', '-v, --version')
        .arguments('<url>').action(function (url) { program.url = url })
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .option('-f, --flat [value]', 'Writes all photos to a single folders. If not set, creates subdirs for each tag', false)
        .option('-t, --tags [value]', 'Comma separated list of specific tags to download. If not set, instead loads all tags', commaSeparatedMultiple, [])
        // TODO add commands to CLI for photos and audio
        .option('-a, --audio [value]', 'Download audio albums instead of photo tags', false)
        .parse(process.argv);

    if (!program.user || !program.output || !program.url) {
        program.help()
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {
        let downloader;
        if (program.audio) {
            downloader = new AudioDownloader(program.url, program);
        } else {
            downloader = new PhotoDownloader(program.url, program);
        }

        downloader.downloadAllPhotos(password)
            .then(() => {
                console.log(`Processed ${downloader.tagsTotal} tags, containing ${downloader.photosTotal} photos ` +
                    `(downloaded ${downloader.photosDownloaded}, skipped ${downloader.photosSkipped}) in ${(new Date() - startDate) / 1000}s`);
                process.exit()
            })
            .catch(err => {
                console.error(err);
                process.exit(1)
            });
    });
}

function commaSeparatedMultiple(val, memo) {
    return memo.concat(val.split(','));
}

module.exports = cli;