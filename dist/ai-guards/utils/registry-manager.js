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
exports.ensureRegistryExists = exports.syncRegistry = exports.addRule = exports.extractRuleMeta = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
const config_manager_1 = require("./config-manager");
// ----------------------------
// Helper paths
// ----------------------------
function getRulesDir() {
    return path.join(process.cwd(), '.ai-guards', 'rules');
}
function parseFrontMatter(content) {
    const FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---/;
    const match = content.match(FRONT_MATTER_REGEX);
    if (!match)
        return {};
    const yamlBlock = match[1];
    const lines = yamlBlock.split(/\r?\n/);
    const res = {};
    lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key)
            return;
        const valueRaw = rest.join(':').trim();
        const keyTrim = key.trim();
        switch (keyTrim) {
            case 'description':
                res.description = valueRaw;
                break;
            case 'globs':
                // Could be array or single; naive parse
                if (valueRaw) {
                    res.globs = valueRaw.split(',').map(s => s.trim()).filter(Boolean);
                }
                else {
                    res.globs = [];
                }
                break;
            case 'alwaysApply':
                res.alwaysApply = valueRaw.toLowerCase() === 'true';
                break;
        }
    });
    return res;
}
function deriveRuleType(meta) {
    if (meta.alwaysApply)
        return 'always';
    if (meta.globs && meta.globs.length)
        return 'auto-attached';
    return 'manual';
}
/** Extract rule metadata from a file path */
async function extractRuleMeta(ruleFilePath) {
    const content = await fs.readFile(ruleFilePath, 'utf8');
    const fm = parseFrontMatter(content);
    const ruleType = deriveRuleType(fm);
    // id from filename without extension
    const id = path.basename(ruleFilePath).replace(path.extname(ruleFilePath), '');
    // Guess file extensions from globs (e.g., **/*.ts => .ts)
    const exts = (fm.globs || []).reduce((acc, g) => {
        const extMatch = g.match(/\.([a-zA-Z0-9]+)$/);
        if (extMatch) {
            acc.push('.' + extMatch[1]);
        }
        return acc;
    }, []);
    const meta = {
        id,
        path: path.relative(process.cwd(), ruleFilePath),
        ruleType,
        description: fm.description,
        globs: fm.globs,
        fileExtensions: exts.length ? exts : undefined,
        alwaysApply: fm.alwaysApply
    };
    return meta;
}
exports.extractRuleMeta = extractRuleMeta;
/**
 * Add or update a single rule entry in the registry.
 * Uses config-manager for storage.
 */
async function addRule(ruleFilePath) {
    const meta = await extractRuleMeta(ruleFilePath);
    await (0, config_manager_1.updateRule)(meta);
}
exports.addRule = addRule;
/**
 * Rebuild registry by scanning all rule files under .ai-guards/rules
 * Uses config-manager for storage.
 */
async function syncRegistry() {
    const ruleFiles = glob.sync('**/*.{md,markdown}', { cwd: getRulesDir(), absolute: true });
    const rules = [];
    for (const file of ruleFiles) {
        try {
            const meta = await extractRuleMeta(file);
            rules.push(meta);
        }
        catch (error) {
            console.error(`Failed to parse rule ${file}:`, error);
        }
    }
    await (0, config_manager_1.setRules)(rules);
}
exports.syncRegistry = syncRegistry;
// Convenience helper to ensure registry exists (called from init)
// Uses config-manager's ensureConfigExists function
async function ensureRegistryExists() {
    await (0, config_manager_1.ensureConfigExists)();
}
exports.ensureRegistryExists = ensureRegistryExists;
//# sourceMappingURL=registry-manager.js.map