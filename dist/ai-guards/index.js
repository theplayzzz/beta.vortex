#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = __importDefault(require("./commands/init"));
const plan_1 = __importDefault(require("./commands/plan"));
const add_1 = __importDefault(require("./commands/add"));
const rules_1 = __importDefault(require("./commands/rules"));
// Import version from package.json
const packageJson = require('../../package.json');
const version = packageJson.version;
// Create a new commander program
const program = new commander_1.Command();
// Set up the basic program info
program
    .name('ai-guards')
    .description('Standardize how teams plan, review, execute, and verify AI‑assisted code')
    .version(version);
// Register commands
(0, init_1.default)(program);
(0, plan_1.default)(program);
(0, add_1.default)(program);
(0, rules_1.default)(program);
// Parse command line arguments
program.parse(process.argv);
// If no arguments provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map