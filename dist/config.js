"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYSTEM_MESSAGES = void 0;
exports.loadConfig = loadConfig;
exports.getLanguage = getLanguage;
exports.getConfigPath = getConfigPath;
exports.ensureConfigDir = ensureConfigDir;
exports.createDefaultConfig = createDefaultConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'config.json');
const DEFAULT_COMMON_CONFIG = {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen3.5-flash',
    language: 'zh',
};
exports.DEFAULT_SYSTEM_MESSAGES = {
    errorSolver: {
        zh: `你是资深程序员，擅长分析各种编程错误。

任务：分析用户提供的报错信息，给出：
1. 错误原因（简洁说明）
2. 具体修复命令或步骤
3. 预防建议（可选）

输出格式：
❌ 错误：[原因]
✅ 修复：[命令/步骤]
💡 提示：[额外建议]`,
        en: `You are a senior programmer, expert at analyzing various programming errors.

Task: Analyze the error message provided by the user and give:
1. Error cause (brief explanation)
2. Specific fix commands or steps
3. Prevention suggestions (optional)

Output format:
❌ Error: [cause]
✅ Fix: [command/steps]
💡 Tip: [additional suggestions]`,
    },
    smartShell: {
        zh: `你是 Shell 脚本专家，擅长根据自然语言描述生成正确的 Shell 命令。

任务：根据用户描述生成对应的 Shell 命令。
支持两种模式：
1. 描述生成：用户描述需求，生成对应的命令
2. 命令修复：用户提供命令和报错，帮助修复

输出格式：
📝 命令：[生成的命令]
📖 说明：[命令解释]`,
        en: `You are a Shell script expert, expert at generating correct Shell commands based on natural language descriptions.

Task: Generate corresponding Shell commands based on user descriptions.
Supports two modes:
1. Description to command: User describes requirements, generate corresponding commands
2. Command fix: User provides command and error, help fix it

Output format:
📝 Command: [generated command]
📖 Explanation: [command explanation]`,
    },
    smartSql: {
        zh: `你是 SQL 专家，擅长根据自然语言描述生成 SQL 查询语句。

任务：根据用户描述生成对应的 SQL 查询。
支持两种模式：
1. 描述生成：用户描述需求，生成对应的 SQL
2. SQL 修复：用户提供 SQL 和报错，帮助修复

注意：默认使用 PostgreSQL 方言，除非用户指定其他方言

输出格式：
📝 SQL: [生成的 SQL]
📖 说明：[查询解释]`,
        en: `You are a SQL expert, expert at generating SQL queries based on natural language descriptions.

Task: Generate corresponding SQL queries based on user descriptions.
Supports two modes:
1. Description to query: User describes requirements, generate corresponding SQL
2. SQL fix: User provides SQL and error, help fix it

Note: Use PostgreSQL dialect by default, unless user specifies another dialect

Output format:
📝 SQL: [generated SQL]
📖 Explanation: [query explanation]`,
    },
};
function loadConfig(toolName, customPath) {
    const configPath = customPath || DEFAULT_CONFIG_PATH;
    let rawConfig = {};
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            rawConfig = JSON.parse(content);
        }
        catch (error) {
            console.error(`⚠️  配置文件解析失败：${error}`);
            console.error(`📁 文件路径：${configPath}`);
            process.exit(1);
        }
    }
    const commonConfig = {
        baseUrl: rawConfig.baseUrl || DEFAULT_COMMON_CONFIG.baseUrl,
        apiKey: rawConfig.apiKey || '',
        model: rawConfig.model || DEFAULT_COMMON_CONFIG.model,
        language: rawConfig.language || DEFAULT_COMMON_CONFIG.language,
        ...rawConfig,
    };
    const toolConfig = rawConfig[toolName] || {};
    const mergedConfig = {
        ...commonConfig,
        ...toolConfig,
    };
    if (!mergedConfig.systemMessage) {
        const lang = mergedConfig.language || 'zh';
        mergedConfig.systemMessage = exports.DEFAULT_SYSTEM_MESSAGES[toolName]?.[lang] || exports.DEFAULT_SYSTEM_MESSAGES[toolName]?.['zh'] || '';
    }
    if (!mergedConfig.apiKey) {
        console.error('❌ 错误：缺少 API Key 配置');
        console.error(`📁 请在配置文件中添加 apiKey 字段：${configPath}`);
        console.error('\n📖 配置示例：');
        console.error(JSON.stringify({
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: 'sk-xxxxx',
            model: 'qwen3.5-flash',
            language: 'zh',
            [toolName]: {
                model: 'qwen3.5-flash',
            }
        }, null, 2));
        process.exit(1);
    }
    return mergedConfig;
}
function getLanguage(config) {
    return config.language || 'zh';
}
function getConfigPath(customPath) {
    return customPath || DEFAULT_CONFIG_PATH;
}
function ensureConfigDir() {
    const configDir = path.dirname(DEFAULT_CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
}
function createDefaultConfig() {
    ensureConfigDir();
    const defaultConfig = {
        _comment: 'AI Tools 通用配置文件',
        _docs: 'https://github.com/lance2026/ai-tools',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'sk-xxxxx',
        model: 'qwen-turbo',
        errorSolver: {
            model: 'qwen-plus',
            explainMode: true,
        },
    };
    const configPath = DEFAULT_CONFIG_PATH;
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log(`✅ 默认配置文件已创建：${configPath}`);
        console.log('⚠️  请编辑配置文件，填入你的 API Key');
    }
}
//# sourceMappingURL=config.js.map