// LLM 调用模块 - OpenAI 兼容接口

import { MergedConfig, Message, LLMResponse } from './types';

export async function callLLM(config: MergedConfig, messages: Message[]): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json() as LLMResponse;
    return data.choices[0]?.message?.content || '未获取到响应内容';
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('调用 LLM 服务时发生未知错误');
  }
}

export function createMessages(systemMessage: string, userContent: string): Message[] {
  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userContent },
  ];
}
