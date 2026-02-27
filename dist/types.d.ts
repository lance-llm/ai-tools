export interface CommonConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
    language?: string;
}
export interface ToolConfig {
    model?: string;
    systemMessage?: string;
    dialect?: string;
    explainMode?: boolean;
    autoCopyFix?: boolean;
    showExplanation?: boolean;
    [key: string]: any;
}
export type MergedConfig = Omit<CommonConfig, keyof ToolConfig> & CommonConfig & ToolConfig;
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface LLMResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}
//# sourceMappingURL=types.d.ts.map