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
exports.errorHandler = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const template_manager_1 = require("../utils/template-manager");
const config_manager_1 = require("../utils/config-manager");
// For testability
const errorHandler = (error) => {
    console.error(chalk_1.default.red('Error initializing AI Guards:'), error);
    // Check if we're in test mode
    if (typeof global.__TEST__ !== 'undefined' && global.__TEST__) {
        // In test mode, throw an error instead of exiting
        throw new Error(`Error initializing AI Guards: ${error.message}`);
    }
    process.exit(1);
};
exports.errorHandler = errorHandler;
function initCommand(program) {
    program
        .command('init')
        .description('Initialize AI Guards in the current project')
        .option('--templates', 'Initialize with prompt templates')
        .option('--no-templates', 'Skip template initialization')
        .option('--select-templates', 'Select specific templates to initialize')
        .action(async (options) => {
        console.log(chalk_1.default.blue('Initializing AI Guards...'));
        try {
            // Create base directory structure
            const aiGuardsDir = path.join(process.cwd(), '.ai-guards');
            // Create directories
            const directories = [
                path.join(aiGuardsDir, 'rules', 'guidelines'),
                path.join(aiGuardsDir, 'rules', 'security'),
                path.join(aiGuardsDir, 'rules', 'general'),
                path.join(aiGuardsDir, 'templates'),
                path.join(aiGuardsDir, 'plans')
            ];
            for (const dir of directories) {
                await fs.ensureDir(dir);
                console.log(chalk_1.default.green(`Created directory: ${dir}`));
            }
            // Ensure ai-guards.json exists with unified schema
            await (0, config_manager_1.ensureConfigExists)();
            // Create sample rule files
            const sampleRule = `---
description: RPC Service boilerplate
globs: 
alwaysApply: false
---

- Use our internal RPC pattern when defining services
- Always use snake_case for service names.

@service-template.ts
`;
            await fs.writeFile(path.join(aiGuardsDir, 'rules', 'guidelines', 'service-naming.md'), sampleRule);
            // Handle template initialization
            if (options.templates === false) {
                console.log(chalk_1.default.yellow('Skipping template initialization...'));
            }
            else if (options.selectTemplates) {
                await handleTemplateSelection();
            }
            else if (options.templates) {
                console.log(chalk_1.default.blue('Initializing all templates...'));
                await (0, template_manager_1.initTemplates)(true);
                console.log(chalk_1.default.green('Templates initialized successfully!'));
            }
            else {
                // Default behavior - ask if they want to initialize templates
                const { initializeTemplates } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'initializeTemplates',
                        message: 'Would you like to initialize prompt templates?',
                        default: true
                    }
                ]);
                if (initializeTemplates) {
                    // Ask if they want to select specific templates
                    const { selectSpecific } = await inquirer_1.default.prompt([
                        {
                            type: 'confirm',
                            name: 'selectSpecific',
                            message: 'Would you like to select specific templates to initialize?',
                            default: false
                        }
                    ]);
                    if (selectSpecific) {
                        await handleTemplateSelection();
                    }
                    else {
                        console.log(chalk_1.default.blue('Initializing all templates...'));
                        await (0, template_manager_1.initTemplates)(true);
                        console.log(chalk_1.default.green('Templates initialized successfully!'));
                    }
                }
                else {
                    console.log(chalk_1.default.yellow('Skipping template initialization...'));
                    // Just initialize the templates directory and config without installing templates
                    await (0, template_manager_1.initTemplates)(false);
                }
            }
            console.log(chalk_1.default.green('AI Guards initialized successfully!'));
            console.log(chalk_1.default.blue('Directory structure created at .ai-guards/'));
            console.log(chalk_1.default.blue('You can add more templates later with:'));
            console.log(chalk_1.default.white('  ai-guards add <template-name>'));
        }
        catch (error) {
            return (0, exports.errorHandler)(error);
        }
    });
}
exports.default = initCommand;
/**
 * Handle interactive template selection
 */
async function handleTemplateSelection() {
    const availableTemplates = await (0, template_manager_1.getAvailableTemplates)();
    // Group templates by category
    const templatesByCategory = {};
    availableTemplates.forEach(template => {
        if (!templatesByCategory[template.category]) {
            templatesByCategory[template.category] = [];
        }
        templatesByCategory[template.category].push(template);
    });
    // Format template choices with categories as separators
    const choices = [];
    Object.entries(templatesByCategory).forEach(([category, templates]) => {
        choices.push(new inquirer_1.default.Separator(`--- ${category.toUpperCase()} ---`));
        templates.forEach(template => {
            choices.push({
                name: `${template.name} - ${template.description}`,
                value: template.id,
                short: template.name
            });
        });
    });
    const { selectedTemplates } = await inquirer_1.default.prompt([
        {
            type: 'checkbox',
            name: 'selectedTemplates',
            message: 'Select templates to initialize:',
            choices,
            pageSize: 15
        }
    ]);
    if (selectedTemplates.length === 0) {
        console.log(chalk_1.default.yellow('No templates selected. Initializing without templates.'));
        await (0, template_manager_1.initTemplates)(false);
        return;
    }
    console.log(chalk_1.default.blue(`Installing ${selectedTemplates.length} template(s)...`));
    // First initialize the templates directory and config
    await (0, template_manager_1.initTemplates)(false);
    // Then install each selected template
    for (const templateId of selectedTemplates) {
        try {
            await (0, template_manager_1.installTemplate)(templateId);
            console.log(chalk_1.default.green(`Installed template: ${templateId}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error installing template "${templateId}":`, error));
        }
    }
    console.log(chalk_1.default.green('Templates initialized successfully!'));
}
//# sourceMappingURL=init.js.map