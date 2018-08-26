const {compile} = require('nexe');

// See https://github.com/nexe/nexe/releases
let nodeVersion = '9.5.0';
let platforms = ['linux-x64', 'windows-x64', 'mac-x64'];

//  Create specific binaries like so: yarn package alpine-x64
if (process.argv.length > 2) {
    platforms = [ process.argv[2] ]
}

platforms.forEach(platform => {
    compile({
        input: 'src/cli/dsdl.js',
        target: `${platform}-${nodeVersion}`,
        name: `dist/dsdl-${platform}`
    }).then(() => console.log(`Platform ${platform} success`))
});
