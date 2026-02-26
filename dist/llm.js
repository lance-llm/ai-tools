"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLLM = callLLM;
exports.createMessages = createMessages;
async function callLLM(config, messages) {
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
        const data = await response.json();
        return data.choices[0]?.message?.content || '未获取到响应内容';
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('调用 LLM 服务时发生未知错误');
    }
}
function createMessages(systemMessage, userContent) {
    return [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userContent },
    ];
}
//# sourceMappingURL=llm.js.map