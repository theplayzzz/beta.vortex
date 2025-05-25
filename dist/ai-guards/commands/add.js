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
exports.exitSuccess = exports.errorHandler = void 0;
const fs = __importStar(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const template_manager_1 = require("../utils/template-manager");
// For testability
const errorHandler = (error) => {
    console.error(chalk_1.default.red('Error adding template:'), error);
    // Check if we're in test mode
    if (typeof global.__TEST__ !== 'undefined' && global.__TEST__) {
        // In test mode, throw an error instead of exiting
        throw new Error(`Error adding template: ${error.message}`);
    }
    process.exit(1);
};
exports.errorHandler = errorHandler;
const exitSuccess = () => {
    // Check if we're in test mode
    if (typeof global.__TEST__ !== 'undefined' && global.__TEST__) {
        // In test mode, throw an error instead of exiting
        throw new Error('Exit with success');
    }
    process.exit(0);
};
exports.exitSuccess = exitSuccess;
function addCommand(program) {
    program
        .command('add [template]')
        .description('Add a prompt template to your project')
        .option('-l, --list', 'List available templates')
        .action(async (templateId, options) => {
        try {
            // Check if AI Guards is initialized
            const aiGuardsDir = (0, template_manager_1.getAiGuardsDir)();
            if (!await fs.pathExists(aiGuardsDir)) {
                console.error(chalk_1.default.red('AI Guards is not initialized in this project.'));
                console.log(chalk_1.default.blue('Run "ai-guards init" first to initialize AI Guards.'));
                return (0, exports.errorHandler)(new Error('AI Guards not initialized'));
            }
            // If --list flag is provided, list available templates
            if (options.list) {
                await listAvailableTemplates();
                return (0, exports.exitSuccess)();
            }
            // If no template ID is provided, show interactive selection
            if (!templateId) {
                await interactiveTemplateSelection();
                return;
            }
            // Check if template is already installed
            if (await (0, template_manager_1.isTemplateInstalled)(templateId)) {
                console.log(chalk_1.default.yellow(`Template "${templateId}" is already installed.`));
                return (0, exports.exitSuccess)();
            }
            // Install the template
            console.log(chalk_1.default.blue(`Installing template: ${templateId}`));
            await (0, template_manager_1.installTemplate)(templateId);
            console.log(chalk_1.default.green(`Template "${templateId}" installed successfully!`));
        }
        catch (error) {
            return (0, exports.errorHandler)(error);
        }
    });
}
exports.default = addCommand;
/**
 * List all available templates
 */
async function listAvailableTemplates() {
    const templates = await (0, template_manager_1.getAvailableTemplates)();
    console.log(chalk_1.default.blue('\nAvailable templates:'));
    console.log(chalk_1.default.blue('-------------------'));
    // Group templates by category
    const templatesByCategory = {};
    templates.forEach(template => {
        if (!templatesByCategory[template.category]) {
            templatesByCategory[template.category] = [];
        }
        templatesByCategory[template.category].push(template);
    });
    // Display templates by category
    Object.entries(templatesByCategory).forEach(([category, categoryTemplates]) => {
        console.log(chalk_1.default.cyan(`\n${category.toUpperCase()}`));
        categoryTemplates.forEach(template => {
            console.log(`  ${chalk_1.default.green(template.id)} - ${template.name}`);
            console.log(`    ${template.description}`);
        });
    });
    console.log(chalk_1.default.blue('\nTo add a template, run:'));
    console.log(chalk_1.default.white('  ai-guards add <template-id>'));
    console.log('');
}
/**
 * Interactive template selection
 */
async function interactiveTemplateSelection() {
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
    const { selectedTemplate } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'selectedTemplate',
            message: 'Select a template to add:',
            choices,
            pageSize: 15
        }
    ]);
    // Check if template is already installed
    if (await (0, template_manager_1.isTemplateInstalled)(selectedTemplate)) {
        console.log(chalk_1.default.yellow(`Template "${selectedTemplate}" is already installed.`));
        return;
    }
    // Install the template
    console.log(chalk_1.default.blue(`Installing template: ${selectedTemplate}`));
    await (0, template_manager_1.installTemplate)(selectedTemplate);
    console.log(chalk_1.default.green(`Template "${selectedTemplate}" installed successfully!`));
}
//# sourceMappingURL=add.js.map