const program = require('commander');
const read = require('read');
const startDate = new Date();
const fs = require("fs");

const Downloader = require('./downloader.js');

function cli() {
    let urlVal = '';

    program
        .version('0.1.2-SNAPSHOT', '-v, --version')
        .arguments('<url>').action(function (url) {
        urlVal = url
    })
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .parse(process.argv);

    if (!program.user || !program.output || !urlVal) {
        program.help()
    }

    if (!fs.existsSync(program.output)) {
        fs.mkdirSync(program.output);
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {
        const downloader = new Downloader(urlVal, program);

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

module.exports = cli;