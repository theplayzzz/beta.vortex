#!/usr/bin/env node

import { Command } from 'commander';
import initCommand from './commands/init';
import planCommand from './commands/plan';
import addCommand from './commands/add';
import rulesCommand from './commands/rules';
// Import version from package.json
const packageJson = require('../../package.json');
const version = packageJson.version;

// Create a new commander program
const program = new Command();

// Set up the basic program info
program
  .name('ai-guards')
  .description('Standardize how teams plan, review, execute, and verify AI‑assisted code')
  .version(version);

// Register commands
initCommand(program);
planCommand(program);
addCommand(program);
rulesCommand(program);

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 