import { RuleMeta } from './config-manager';
export type RuleType = 'always' | 'auto-attached' | 'agent-requested' | 'manual';
/** Extract rule metadata from a file path */
export declare function extractRuleMeta(ruleFilePath: string): Promise<RuleMeta>;
/**
 * Add or update a single rule entry in the registry.
 * Uses config-manager for storage.
 */
export declare function addRule(ruleFilePath: string): Promise<void>;
/**
 * Rebuild registry by scanning all rule files under .ai-guards/rules
 * Uses config-manager for storage.
 */
export declare function syncRegistry(): Promise<void>;
export declare function ensureRegistryExists(): Promise<void>;
//# sourceMappingURL=registry-manager.d.ts.map