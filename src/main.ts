#!/usr/bin/env node
import yargs = require('yargs');

yargs(process.argv.slice(2))
  .usage('Usage: $0 <source>')
  .command(require('./command'))
  .help('h')
  .alias('h', 'help').argv;
