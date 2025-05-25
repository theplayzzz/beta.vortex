import { Template } from './config-manager';
export type { Template };
interface TemplateConfig {
    templates: Record<string, Template>;
    config?: {
        defaultCategory?: string;
        customTemplatesPath?: string;
    };
}
interface TemplateRegistry {
    templates: Record<string, Template>;
    categories: Record<string, {
        name: string;
        description: string;
    }>;
}
/**
 * Get the path to the AI Guards directory
 */
export declare function getAiGuardsDir(): string;
/**
 * Get the path to the templates directory
 */
export declare function getTemplatesDir(): string;
/**
 * Get the path to the templates config file (legacy)
 */
export declare function getTemplatesConfigPath(): string;
/**
 * Load the templates config (now uses unified config)
 */
export declare function loadTemplatesConfig(): Promise<TemplateConfig>;
/**
 * Save the templates config (now uses unified config)
 */
export declare function saveTemplatesConfig(templateConfig: TemplateConfig): Promise<void>;
/**
 * Load the template registry
 */
export declare function loadTemplateRegistry(): Promise<TemplateRegistry>;
/**
 * Get a list of all available templates from the registry
 */
export declare function getAvailableTemplates(): Promise<Template[]>;
/**
 * Get a list of all installed templates
 */
export declare function getInstalledTemplates(): Promise<Template[]>;
/**
 * Check if a template is installed
 */
export declare function isTemplateInstalled(templateId: string): Promise<boolean>;
/**
 * Install a template (now uses unified config)
 */
export declare function installTemplate(templateId: string): Promise<void>;
/**
 * Uninstall a template (now uses unified config)
 */
export declare function uninstallTemplate(templateId: string): Promise<void>;
/**
 * Get template categories from registry
 */
export declare function getTemplateCategories(): Promise<Record<string, {
    name: string;
    description: string;
}>>;
/**
 * Initialize templates directory and config (now uses unified config)
 */
export declare function initTemplates(installAll?: boolean): Promise<void>;
//# sourceMappingURL=template-manager.d.ts.map