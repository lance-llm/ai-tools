import { MergedConfig } from './types';
export declare const DEFAULT_SYSTEM_MESSAGES: Record<string, Record<string, string>>;
export declare function loadConfig(toolName: string, customPath?: string): MergedConfig;
export declare function getLanguage(config: MergedConfig): string;
export declare function getConfigPath(customPath?: string): string;
export declare function ensureConfigDir(): void;
export declare function createDefaultConfig(): void;
//# sourceMappingURL=config.d.ts.map