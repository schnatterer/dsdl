const read = require('read');
const { Command } = require('commander');

const startDate = new Date();

const DsAudioDownloader = require('../dsAudioDownloader.js');
const DsPhotoDownloader = require('../dsPhotoDownloader.js');
const SynoPhotosDownloader = require('../synoPhotosDownloader.js');

function cli(program) {

    if (!program) {
        program = new Command();
    }

    let downloader;

    program
        .version('3.1.0', '-v, --version')
        .showHelpAfterError();

    setCommonParams(program
        .command('photo')
        .description('Download from photo station'))
        .option('-t, --tags [value]', 'Comma separated list of specific tags to download. If not set, instead loads all tags', commaSeparatedMultiple, [])
        .action(function (url, options) {
            validateRequiredParams(url, options);
            downloader = new DsPhotoDownloader(options);
        });

    setCommonParams(program
        .command('photos')
        .alias('foto')
        .description('Download from Synology Photos (DSM7)'))
        .option('-t, --tags [value]', 'Comma separated list of specific tags to download. If not set, instead loads all tags', commaSeparatedMultiple, [])
        .action(function (url, options) {
            validateRequiredParams(url, options);
            downloader = new SynoPhotosDownloader(options);
        });

    setCommonParams(program
        .command('audio')
        .description('Download from audio station'))
        .option('-p, --playlists [value]', 'Comma separated list of specific playlists to download. If not set, instead loads all playlists', commaSeparatedMultiple, [])
        .option('-m, --m3u [value]', 'Create m3u playlist files for each downloaded playlist', false)
        .action(function (url, options) {
            validateRequiredParams(url, options);
            downloader = new DsAudioDownloader(options);
        });

    program.parse(process.argv);

    if (!downloader) {
        program.help()
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {

        downloader.downloadAllFiles(password)
            .then(stats => {
                console.log(`Processed ${stats.listsTotal} ${downloader.listType}s  (of which ${stats.listsFailed} failed),` +
                            `containing ${stats.filesTotal} files ` +
                            `(downloaded ${stats.filesDownloaded}, skipped ${stats.filesSkipped}, failed ${stats.filesFailed})` +
                            `in ${(new Date() - startDate) / 1000}s`);
                process.exit()
            })
            .catch(err => {
                console.error(err);
                process.exit(1)
            });
    });
}

function setCommonParams(program) {
    const cliIntendion = '                                    ';
    return program
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .option('-f, --folder-structure [folderStructure]',
            `\'flat\' - writes all files to a single folders.\n${cliIntendion}` +
            `\'list\' - creates subdirs for each list.\n${cliIntendion}` +
            '\'server\' - creates same folder structure as on server',
            'list')
        .arguments('<url>')
}

function validateRequiredParams(url, options) {
    options.url = url
    if (!options.user || !options.output || !options.url || !/^(flat|list|server)$/g.test(options.folderStructure)) {
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