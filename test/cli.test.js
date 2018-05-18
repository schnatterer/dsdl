const cli = require("../src/cli.js");
const program = require('commander');

describe('CLI', () => {

    const requiredArgs = ['-u', 'expectedUser', '-o', 'expectedOutput', 'expectedUrl'];

    test('Minimal mandatory params', () => {
        setArgv(requiredArgs);
        cli();
        expect(program.user).toEqual('expectedUser');
        expect(program.output).toEqual('expectedOutput');
        expect(program.url).toEqual('expectedUrl');
        expect(program.flat).toEqual(false);
    });

    // A much more sensible test would be with a child process, as commander is static.
    // See https://github.com/npm/read/blob/master/test/basic.js

   /* test('Optional Args', () => {
        setArgv(['-f'].concat(requiredArgs));
        cli();
        expect(program.flat).toEqual(true);
    });*/


    function setArgv(args) {
        process.argv = ['node', 'cli.js'].concat(args);
    }

});