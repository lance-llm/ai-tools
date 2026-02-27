// TypeScript 类型定义

export interface CommonConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  language?: string;        // zh | en
  showExplanation?: boolean; // show explanation text, default true; tool config overrides this
}

export interface ToolConfig {
  model?: string;
  systemMessage?: string;
  dialect?: string;         // postgresql | mysql | sqlite
  autoCopyFix?: boolean;
  showExplanation?: boolean; // overrides the common-level showExplanation
  maxDiffLength?: number;    // ai-commit: max characters of git diff sent to LLM, default 40000
  languages?: string[];      // ai-tr: language pair for translation, e.g. ['zh', 'en']
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
