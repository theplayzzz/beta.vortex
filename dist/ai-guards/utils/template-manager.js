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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTemplates = exports.getTemplateCategories = exports.uninstallTemplate = exports.installTemplate = exports.isTemplateInstalled = exports.getInstalledTemplates = exports.getAvailableTemplates = exports.loadTemplateRegistry = exports.saveTemplatesConfig = exports.loadTemplatesConfig = exports.getTemplatesConfigPath = exports.getTemplatesDir = exports.getAiGuardsDir = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const config_manager_1 = require("./config-manager");
// Constants
const AI_GUARDS_DIR = '.ai-guards';
const TEMPLATES_CONFIG_FILE = 'templates.json';
/**
 * Get the path to the AI Guards directory
 */
function getAiGuardsDir() {
    return path.join(process.cwd(), AI_GUARDS_DIR);
}
exports.getAiGuardsDir = getAiGuardsDir;
/**
 * Get the path to the templates directory
 */
function getTemplatesDir() {
    return path.join(getAiGuardsDir(), 'templates');
}
exports.getTemplatesDir = getTemplatesDir;
/**
 * Get the path to the templates config file (legacy)
 */
function getTemplatesConfigPath() {
    return path.join(getTemplatesDir(), TEMPLATES_CONFIG_FILE);
}
exports.getTemplatesConfigPath = getTemplatesConfigPath;
/**
 * Load the templates config (now uses unified config)
 */
async function loadTemplatesConfig() {
    const config = await (0, config_manager_1.loadConfig)();
    // Return in format expected by legacy code
    return {
        templates: config.templates,
        config: config.config
    };
}
exports.loadTemplatesConfig = loadTemplatesConfig;
/**
 * Save the templates config (now uses unified config)
 */
async function saveTemplatesConfig(templateConfig) {
    const cfg = await (0, config_manager_1.loadConfig)();
    cfg.templates = templateConfig.templates;
    if (templateConfig.config) {
        cfg.config = templateConfig.config;
    }
    const { saveConfig } = require('./config-manager');
    await saveConfig(cfg);
}
exports.saveTemplatesConfig = saveTemplatesConfig;
/**
 * Load the template registry
 */
async function loadTemplateRegistry() {
    const registryPath = path.join(__dirname, '..', 'templates', 'registry.json');
    try {
        const registry = await fs.readJson(registryPath);
        return registry;
    }
    catch (error) {
        console.error('Error loading template registry:', error);
        throw error;
    }
}
exports.loadTemplateRegistry = loadTemplateRegistry;
/**
 * Get a list of all available templates from the registry
 */
async function getAvailableTemplates() {
    const registry = await loadTemplateRegistry();
    return Object.values(registry.templates);
}
exports.getAvailableTemplates = getAvailableTemplates;
/**
 * Get a list of all installed templates
 */
async function getInstalledTemplates() {
    const config = await (0, config_manager_1.loadConfig)();
    return Object.values(config.templates);
}
exports.getInstalledTemplates = getInstalledTemplates;
/**
 * Check if a template is installed
 */
async function isTemplateInstalled(templateId) {
    const config = await (0, config_manager_1.loadConfig)();
    return !!config.templates[templateId];
}
exports.isTemplateInstalled = isTemplateInstalled;
/**
 * Install a template (now uses unified config)
 */
async function installTemplate(templateId) {
    // Get the template from the registry
    const registry = await loadTemplateRegistry();
    const template = registry.templates[templateId];
    if (!template) {
        throw new Error(`Template "${templateId}" not found in registry`);
    }
    // Check if template is already installed
    if (await isTemplateInstalled(templateId)) {
        throw new Error(`Template "${templateId}" is already installed`);
    }
    // Copy the template file to the templates directory
    const sourceTemplatePath = path.join(__dirname, '../templates', template.path);
    const destTemplatePath = path.join(getTemplatesDir(), template.path);
    await fs.copy(sourceTemplatePath, destTemplatePath);
    // Update the unified config
    await (0, config_manager_1.updateTemplate)({
        ...template,
        installedAt: new Date().toISOString(),
        customized: false
    });
}
exports.installTemplate = installTemplate;
/**
 * Uninstall a template (now uses unified config)
 */
async function uninstallTemplate(templateId) {
    // Check if template is installed
    const config = await (0, config_manager_1.loadConfig)();
    const template = config.templates[templateId];
    if (!template) {
        throw new Error(`Template "${templateId}" is not installed`);
    }
    // Remove the template file
    const templatePath = path.join(getTemplatesDir(), template.path);
    if (await fs.pathExists(templatePath)) {
        await fs.remove(templatePath);
    }
    // Update the unified config
    await (0, config_manager_1.removeTemplate)(templateId);
}
exports.uninstallTemplate = uninstallTemplate;
/**
 * Get template categories from registry
 */
async function getTemplateCategories() {
    const registry = await loadTemplateRegistry();
    return registry.categories;
}
exports.getTemplateCategories = getTemplateCategories;
/**
 * Initialize templates directory and config (now uses unified config)
 */
async function initTemplates(installAll = false) {
    const templatesDir = getTemplatesDir();
    await fs.ensureDir(templatesDir);
    // Ensure the unified config exists
    await (0, config_manager_1.ensureConfigExists)();
    // Install all templates if requested
    if (installAll) {
        const templates = await getAvailableTemplates();
        for (const template of templates) {
            try {
                await installTemplate(template.id);
            }
            catch (error) {
                console.error(`Error installing template "${template.id}":`, error);
            }
        }
    }
}
exports.initTemplates = initTemplates;
//# sourceMappingURL=template-manager.js.map