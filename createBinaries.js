const {compile} = require('nexe');

// See https://github.com/nexe/nexe/releases
// Keep in sync with Dockerfile and .github/workflows/build.yaml
// Building with node 14 results in error on runtime:
// Error parsing /dist/node_modules/read/package.json: Unexpected end of JSON input
 //let nodeVersion = '14.15.3';
// Latest 12.x version available for nexe
let nodeVersion = '12.16.2';
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
        .catch(e => {
        console.log(`Platform ${platform} failed: ${e}`);
        // Make sure the builds breaks
            process.exit(1);
    });
});
