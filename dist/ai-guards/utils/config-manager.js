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
exports.removeTemplate = exports.updateTemplate = exports.setRules = exports.updateRule = exports.ensureConfigExists = exports.saveConfig = exports.loadConfig = exports.getConfigPath = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
// ----------------------------
// Zod Schema
// ----------------------------
const ruleMetaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    path: zod_1.z.string(),
    ruleType: zod_1.z.enum(['always', 'auto-attached', 'agent-requested', 'manual']),
    description: zod_1.z.string().optional(),
    globs: zod_1.z.array(zod_1.z.string()).optional(),
    fileExtensions: zod_1.z.array(zod_1.z.string()).optional(),
    alwaysApply: zod_1.z.boolean().optional()
});
const templateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    category: zod_1.z.string(),
    path: zod_1.z.string(),
    installedAt: zod_1.z.string().optional(),
    customized: zod_1.z.boolean().optional()
});
const configSchema = zod_1.z.object({
    version: zod_1.z.literal(1),
    rules: zod_1.z.array(ruleMetaSchema),
    templates: zod_1.z.record(zod_1.z.string(), templateSchema),
    config: zod_1.z.object({
        defaultCategory: zod_1.z.string().optional(),
        customTemplatesPath: zod_1.z.string().optional()
    }).optional()
});
// ----------------------------
// Paths & Defaults
// ----------------------------
function getConfigPath() {
    return path.join(process.cwd(), 'ai-guards.json');
}
exports.getConfigPath = getConfigPath;
const DEFAULT_CONFIG = {
    version: 1,
    rules: [],
    templates: {},
    config: {
        defaultCategory: 'guidelines'
    }
};
// ----------------------------
// Core Helpers
// ----------------------------
/**
 * Load the unified configuration
 * - Attempts to load from ai-guards.json
 * - Verifies schema and defaults to empty if invalid
 */
async function loadConfig() {
    const configPath = getConfigPath();
    if (!(await fs.pathExists(configPath))) {
        return DEFAULT_CONFIG;
    }
    try {
        const json = await fs.readJson(configPath);
        const parsed = configSchema.parse(json);
        return parsed;
    }
    catch (err) {
        console.error('Invalid ai-guards.json – using defaults', err);
        return DEFAULT_CONFIG;
    }
}
exports.loadConfig = loadConfig;
/**
 * Save the unified configuration
 * - Writes atomically to ai-guards.json
 */
async function saveConfig(config) {
    const cfg = { ...config, version: 1 };
    const tmp = getConfigPath() + '.tmp';
    await fs.writeJson(tmp, cfg, { spaces: 2 });
    await fs.move(tmp, getConfigPath(), { overwrite: true });
}
exports.saveConfig = saveConfig;
/**
 * Ensure a config file exists with at least empty collections
 */
async function ensureConfigExists() {
    if (!(await fs.pathExists(getConfigPath()))) {
        await saveConfig(DEFAULT_CONFIG);
    }
}
exports.ensureConfigExists = ensureConfigExists;
// ----------------------------
// Rule Registry Operations
// ----------------------------
/**
 * Update a single rule in the config
 */
async function updateRule(rule) {
    const cfg = await loadConfig();
    const idx = cfg.rules.findIndex(r => r.id === rule.id);
    if (idx >= 0)
        cfg.rules[idx] = rule;
    else
        cfg.rules.push(rule);
    await saveConfig(cfg);
}
exports.updateRule = updateRule;
/**
 * Set the entire rules collection
 */
async function setRules(rules) {
    const cfg = await loadConfig();
    cfg.rules = rules;
    await saveConfig(cfg);
}
exports.setRules = setRules;
// ----------------------------
// Template Operations
// ----------------------------
/**
 * Update or add a template in the config
 */
async function updateTemplate(template) {
    const cfg = await loadConfig();
    cfg.templates[template.id] = template;
    await saveConfig(cfg);
}
exports.updateTemplate = updateTemplate;
/**
 * Remove a template from the config
 */
async function removeTemplate(tid) {
    const cfg = await loadConfig();
    if (cfg.templates[tid]) {
        delete cfg.templates[tid];
        await saveConfig(cfg);
    }
}
exports.removeTemplate = removeTemplate;
//# sourceMappingURL=config-manager.js.map