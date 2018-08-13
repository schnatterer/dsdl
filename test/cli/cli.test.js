const cli = require("../../src/cli/cli.js");
const commander = require('commander');

let program;

beforeEach(() => {
    program = new commander.Command();
});
describe('CLI', () => {

    const requiredArgs = ['-u', 'expectedUser', '-o', 'expectedOutput', 'expectedUrl'];

    test('Minimal mandatory params for photo command', () => {
        setArgv(['photo', ...requiredArgs]);
        cli(program);
        let command = getCommand('photo');
        validateRequiredParams(command);

        expect(command.tags).toEqual([]);
    });

    test('Minimal mandatory params for audio command', () => {
        setArgv(['audio', ...requiredArgs]);
        cli(program);
        let command = getCommand('audio');
        validateRequiredParams(command);

        expect(command.playlists).toEqual([]);
    });

    test('No command', () => {
        setArgv(requiredArgs);
        program.help = jest.fn();
        cli(program);
        expect(program.help.mock.calls.length).toBe(1);
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

    function getCommand(requiredCommandName) {
        for (const command of program.commands) {
            if (command._name === requiredCommandName) {
                return command;
            }
        }
        throw `Command ${requiredCommandName} not found`
    }

    function validateRequiredParams(command) {
        expect(command.user).toEqual('expectedUser');
        expect(command.output).toEqual('expectedOutput');
        expect(command.url).toEqual('expectedUrl');
        expect(command.flat).toEqual(false);
    }


});