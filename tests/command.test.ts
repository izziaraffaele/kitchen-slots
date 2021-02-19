import yargs = require('yargs');

import * as command from '../src/command';

const spy = jest.spyOn(global.console, 'log');

describe('CLI', () => {
  beforeEach(() => {
    spy.mockClear();
  });

  it('returns help output', async () => {
    // Initialize parser using the command module
    const parser = yargs.command(command as any).help();

    // Run the command module with --help as argument
    const output: string = await new Promise((resolve) => {
      parser.parse('--help', (err: any, argv: yargs.Arguments, output: any) => {
        resolve(output);
      });
    });

    // Verify the output is correct
    expect(output).toEqual(expect.stringContaining(command.desc));
  });

  it('should return the expected output', async () => {
    // Initialize parser using the command module
    const parser = yargs.command(command as any).help();

    // Run the command module with --help as argument
    await new Promise((resolve) => {
      parser.parse(
        'tests/fixtures/test-input.csv',
        (err: any, argv: yargs.Arguments, output: any) => {
          resolve(output);
        }
      );
    });

    expect(spy.mock.calls[0][0]).toMatchSnapshot();
  });
});
