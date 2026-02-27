"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const prompts_1 = __importDefault(require("prompts"));
const config_1 = require("../config");
const llm_1 = require("../llm");
const formatter_1 = require("../formatter");
const package_json_1 = require("../../package.json");
const TOOL_NAME = 'smartSql';
const program = new commander_1.Command();
program
    .name('ai-sql')
    .description('AI 驱动的 SQL 查询生成工具 - 根据自然语言描述生成 SQL 查询')
    .version(package_json_1.version)
    .option('-c, --config <path>', '指定配置文件路径')
    .option('-d, --dialect <type>', 'SQL 方言 (postgresql/mysql/sqlite)', 'postgresql')
    .option('-m, --modify', '修改模式：提供 SQL 和报错信息进行修复')
    .argument('[input...]', '用户输入描述或 SQL')
    .action((args) => {
    const userInput = args ? args.join(' ') : null;
    run(userInput);
});
const I18N = {
    zh: {
        title: '📊 AI SQL - 根据描述生成 SQL 查询',
        dialectLabel: '当前方言',
        inputPrompt: '请输入你想要查询的内容 (例如：查询年龄大于 18 岁的用户):',
        inputPromptModify: '请输入 SQL 和报错信息 (格式：SQL 命令 | 报错信息):',
        descriptionLabel: '描述',
        generating: '正在生成 SQL',
        success: '生成完成',
        failed: '生成失败',
    },
    en: {
        title: '📊 AI SQL - Generate SQL from description',
        dialectLabel: 'Dialect',
        inputPrompt: 'Enter your query description (e.g., select users older than 18):',
        inputPromptModify: 'Enter SQL and error (format: SQL command | error message):',
        descriptionLabel: 'Description',
        generating: 'Generating SQL',
        success: 'Generation complete',
        failed: 'Generation failed',
    },
};
async function run(userInput) {
    const options = program.opts();
    const config = (0, config_1.loadConfig)(TOOL_NAME, options.config);
    const language = (0, config_1.getLanguage)(config);
    const t = I18N[language] || I18N.zh;
    const dialect = options.dialect || config.dialect || 'postgresql';
    console.log('');
    console.log(t.title);
    console.log(`🔧 ${t.dialectLabel}: ${dialect}`);
    console.log('');
    if (!userInput) {
        const promptMessage = options.modify ? t.inputPromptModify : t.inputPrompt;
        console.log(`📋 ${promptMessage}`);
        const response = await (0, prompts_1.default)({
            type: 'text',
            name: 'description',
            message: t.descriptionLabel,
            initial: '',
            validate: (value) => value.trim().length > 0 || '请输入描述',
        });
        userInput = response.description?.trim() || '';
    }
    if (!userInput) {
        (0, formatter_1.printError)('未输入描述');
        process.exit(1);
    }
    let promptText;
    if (options.modify) {
        promptText = `请帮我修复以下 SQL:

SQL: ${userInput}

请分析错误原因并给出修复后的 SQL。`;
    }
    else {
        promptText = `${userInput}

SQL 方言：${dialect}`;
    }
    (0, formatter_1.printLoading)(t.generating);
    try {
        const messages = (0, llm_1.createMessages)(config.systemMessage, promptText);
        const result = await (0, llm_1.callLLM)(config, messages);
        const parsed = (0, formatter_1.formatResult)(result);
        (0, formatter_1.printResult)(parsed);
        (0, formatter_1.printSuccess)(t.success);
    }
    catch (error) {
        (0, formatter_1.printError)(error instanceof Error ? error.message : t.failed);
        process.exit(1);
    }
}
function main() {
    program.parse(process.argv);
}
main();
//# sourceMappingURL=smart-sql.js.map