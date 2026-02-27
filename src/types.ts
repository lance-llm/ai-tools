// TypeScript 类型定义

export interface CommonConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  language?: string;  // zh | en
}

export interface ToolConfig {
  model?: string;
  systemMessage?: string;
  dialect?: string;        // postgresql | mysql | sqlite
  explainMode?: boolean;
  autoCopyFix?: boolean;
  showExplanation?: boolean; // ai-shell: show command explanation, default true
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
