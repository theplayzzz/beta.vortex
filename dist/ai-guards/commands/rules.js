"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const registry_manager_1 = require("../utils/registry-manager");
const config_manager_1 = require("../utils/config-manager");
/**
 * Register `ai-guards rules <action>` sub‑commands.
 */
function rulesCommand(program) {
    const rules = program
        .command('rules')
        .description('Manage AI Guards rule registry');
    // -------------------------
    // rules list [--json]
    // -------------------------
    rules
        .command('list')
        .description('List all rules registered in ai-guards.json')
        .option('--json', 'Output raw JSON')
        .action(async (options) => {
        try {
            const config = await (0, config_manager_1.loadConfig)();
            const rules = config.rules;
            if (options.json) {
                console.log(JSON.stringify({ version: 1, rules }, null, 2));
                return;
            }
            if (rules.length === 0) {
                console.log(chalk_1.default.yellow('Registry is empty – run "ai-guards rules sync" to populate it.'));
                return;
            }
            // Basic table output
            console.log(chalk_1.default.blue('\nInstalled Rules:'));
            console.table(rules.map(r => ({
                id: r.id,
                type: r.ruleType,
                path: r.path,
                globs: r.globs ? r.globs.join(',') : '',
                extensions: r.fileExtensions ? r.fileExtensions.join(',') : ''
            })));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to list rules:'), error);
        }
    });
    // -------------------------
    // rules sync
    // -------------------------
    rules
        .command('sync')
        .description('Rebuild the registry by scanning .ai-guards/rules folder')
        .action(async () => {
        try {
            await (0, registry_manager_1.syncRegistry)();
            console.log(chalk_1.default.green('Registry synced successfully.'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to sync registry:'), error);
        }
    });
    // -------------------------
    // rules add <rule-file> [--category]
    // -------------------------
    rules
        .command('add <rule-file>')
        .description('Add a rule file to project and register it')
        .option('-c, --category <category>', 'Category to add rule to', /^(guidelines|security|general)$/i, 'guidelines')
        .action(async (ruleFile, options) => {
        try {
            // Validate that the source file exists
            if (!await fs.pathExists(ruleFile)) {
                console.error(chalk_1.default.red(`Rule file not found: ${ruleFile}`));
                process.exit(1);
            }
            // Ensure category folder exists
            const category = options.category.toLowerCase();
            const aiGuardsDir = path.join(process.cwd(), '.ai-guards');
            const rulesDir = path.join(aiGuardsDir, 'rules', category);
            await fs.ensureDir(rulesDir);
            // Copy file to destination
            const fileName = path.basename(ruleFile);
            const destPath = path.join(rulesDir, fileName);
            await fs.copy(ruleFile, destPath, { overwrite: true });
            console.log(chalk_1.default.green(`Rule file copied to: ${destPath}`));
            // Update registry
            await (0, registry_manager_1.addRule)(destPath);
            console.log(chalk_1.default.green('Registry updated successfully.'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to add rule:'), error);
        }
    });
}
exports.default = rulesCommand;
//# sourceMappingURL=rules.js.map