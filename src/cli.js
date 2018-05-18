const program = require('commander');
const read = require('read');
const startDate = new Date();

const Downloader = require('./downloader.js');

function cli() {

    program
        .version('0.1.2-SNAPSHOT', '-v, --version')
        .arguments('<url>').action(function (url) { program.url = url })
        .option('-u, --user <required>', 'Server user')
        .option('-o, --output <required>', 'Write to this folder')
        .option('-f, --flat [value]', 'Writes all photos to a single folders. If not set, creates subdirs for each tag', false)
        .parse(process.argv);

    if (!program.user || !program.output || !program.url) {
        program.help()
    }

    read({prompt: 'Password: ', silent: true, terminal: true}, function (er, password) {
        const downloader = new Downloader(program.url, program);

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