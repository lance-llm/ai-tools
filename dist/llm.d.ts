import { MergedConfig, Message } from './types';
export declare function callLLM(config: MergedConfig, messages: Message[]): Promise<string>;
export declare function createMessages(systemMessage: string, userContent: string): Message[];
//# sourceMappingURL=llm.d.ts.map