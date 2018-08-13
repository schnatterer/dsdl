const read = require('read');
const startDate = new Date();

const AudioDownloader = require('../audioDownloader.js');
const PhotoDownloader = require('../photoDownloader.js');

function cli(program) {

    if (!program) {
        program = require('commander');
    }

    let downloader;

    program
        .version('1.0.0-SNAPSHOT', '-v, --version')

    setCommonParams(program
        .command('photo')
        .description('Download from photo station'))
        .option('-t, --tags [value]', 'Comma separated list of specific tags to download. If not set, instead loads all tags', commaSeparatedMultiple, [])
        .action(function (env, options) {
            validateRequiredParams(options);
            downloader = new PhotoDownloader(options);
        });

    setCommonParams(program
        .command('audio')
        .description('Download from audio station'))
        .option('-p, --playlists [value]', 'Comma separated list of specific playlists to download. If not set, instead loads all playlists', commaSeparatedMultiple, [])
        .action(function (env, options) {
            validateRequiredParams(options);
            downloader = new AudioDownloader(options);
        });

    program.parse(process.argv);

    if (!downloader) {
        program.help()
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {

        downloader.downloadAllFiles(password)
            .then(stats => {
                console.log(`Processed ${stats.listsTotal} ${downloader.listType}s, containing ${stats.filesTotal} files ` +
                    `(downloaded ${stats.filesDownloaded}, skipped ${stats.filesSkipped}) in ${(new Date() - startDate) / 1000}s`);
                process.exit()
            })
            .catch(err => {
                console.error(err);
                process.exit(1)
            });
    });
}

function setCommonParams(program) {
    return program
        .arguments('<url>').action(function (url) {
            program.url = url
        })
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .option('-f, --flat [value]', 'Writes all photos to a single folders. If not set, creates subdirs for each tag', false)
}

function validateRequiredParams(options) {
    if (!options.user || !options.output || !options.url) {
        options.help()
    }
}

function commaSeparatedMultiple(newValuesString, existingValues) {
    const newValuesArray = newValuesString.split(',');
    for (const newValue of newValuesArray) {
        if (!existingValues.includes(newValue)) {
            existingValues = existingValues.concat(newValue)
        }
    }
    return existingValues;
}

module.exports = cli;