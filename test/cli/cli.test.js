const commander = require('commander');

let program;

beforeEach(() => {
    program = new commander.Command();

    jest.mock('read');
    const read = require('read');
    // For now, ignore read(), by not calling the call back function
    read.mockImplementation();
    // We could actually execute read() and test the function like so
    //read.mockImplementation((obj, funct) => funct({}, 'pw'));
});


describe('CLI', () => {

    const requiredArgs = ['-u', 'expectedUser', '-o', 'expectedOutput', 'expectedUrl'];

    test('No command', () => {
        setArgv(requiredArgs);
        program.help = jest.fn();
        cli();
        expect(program.help.mock.calls.length).toBe(1);
    });

    test('Minimal mandatory params for photo command', () => {
        setArgv(['photo', ...requiredArgs]);
        cli();
        let command = getCommand('photo');
        validateRequiredParams(command);

        expect(command.tags).toEqual([]);
    });

    test('Minimal mandatory params for audio command', () => {
        setArgv(['audio', ...requiredArgs]);
        cli();
        let command = getCommand('audio');
        validateRequiredParams(command);

        expect(command.playlists).toEqual([]);
    });

    test('Comma-separated multiple playlists/tags', () => {
        setArgv(['photo', ...requiredArgs, '--tags', '1', '--tags', '2,3 3,4']);
        cli();
        let command = getCommand('photo');

        expect(command.tags).toEqual(expect.arrayContaining(['1', '2', '3 3', '4']));
    });

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
        expect(command.folderStructure).toEqual('list');
    }

    function cli() {
        // We could test the read() part like so
        // jest.mock('read');
        // const read = require('read');
        // read.mockImplementation((obj, funct) => funct({}, 'pw'));
        const cli = require("../../src/cli/cli.js");
        cli(program)
    }

});