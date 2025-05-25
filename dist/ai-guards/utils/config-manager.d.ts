import { RuleType } from './registry-manager';
export interface RuleMeta {
    id: string;
    path: string;
    ruleType: RuleType;
    description?: string;
    globs?: string[];
    fileExtensions?: string[];
    alwaysApply?: boolean;
}
export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    path: string;
    installedAt?: string;
    customized?: boolean;
}
export interface UnifiedConfig {
    version: 1;
    rules: RuleMeta[];
    templates: Record<string, Template>;
    config?: {
        defaultCategory?: string;
        customTemplatesPath?: string;
    };
}
export declare function getConfigPath(): string;
/**
 * Load the unified configuration
 * - Attempts to load from ai-guards.json
 * - Verifies schema and defaults to empty if invalid
 */
export declare function loadConfig(): Promise<UnifiedConfig>;
/**
 * Save the unified configuration
 * - Writes atomically to ai-guards.json
 */
export declare function saveConfig(config: UnifiedConfig): Promise<void>;
/**
 * Ensure a config file exists with at least empty collections
 */
export declare function ensureConfigExists(): Promise<void>;
/**
 * Update a single rule in the config
 */
export declare function updateRule(rule: RuleMeta): Promise<void>;
/**
 * Set the entire rules collection
 */
export declare function setRules(rules: RuleMeta[]): Promise<void>;
/**
 * Update or add a template in the config
 */
export declare function updateTemplate(template: Template): Promise<void>;
/**
 * Remove a template from the config
 */
export declare function removeTemplate(tid: string): Promise<void>;
//# sourceMappingURL=config-manager.d.ts.map