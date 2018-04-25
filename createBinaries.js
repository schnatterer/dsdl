const {compile} = require('nexe');

// See https://github.com/nexe/nexe/releases
let nodeVersion = '9.5.0';
let platforms = ['linux-x64', 'windows-x64', 'mac-x64'];

platforms.forEach(platform => {
    compile({
        target: `${platform}-${nodeVersion}`,
        name: `pstd-${platform}`
    }).then(() => console.log(`Platform ${platform} success`))
});
