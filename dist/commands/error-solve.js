"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const prompts_1 = __importDefault(require("prompts"));
const clipboardy_1 = __importDefault(require("clipboardy"));
const config_1 = require("../config");
const llm_1 = require("../llm");
const detector_1 = require("../detector");
const package_json_1 = require("../../package.json");
const formatter_1 = require("../formatter");
const TOOL_NAME = 'errorSolver';
const program = new commander_1.Command();
program
    .name('ai-error')
    .description('AI 驱动的报错分析工具 - 粘贴报错信息，AI 自动分析原因并给出修复方案')
    .version(package_json_1.version)
    .option('-y, --yes', '直接读取剪贴板，不交互')
    .option('-c, --config <path>', '指定配置文件路径')
    .option('-e, --explain', '启用详细解释模式')
    .parse(process.argv);
const options = program.opts();
async function main() {
    const config = (0, config_1.loadConfig)(TOOL_NAME, options.config);
    if (!options.yes) {
        (0, formatter_1.printWelcome)();
    }
    let errorText;
    if (options.yes) {
        try {
            errorText = clipboardy_1.default.readSync();
            (0, formatter_1.printClipboardRead)();
        }
        catch (error) {
            (0, formatter_1.printError)('无法读取剪贴板内容');
            process.exit(1);
        }
    }
    else {
        (0, formatter_1.printInputPrompt)();
        const response = await (0, prompts_1.default)({
            type: 'text',
            name: 'error',
            message: '报错信息:',
            initial: '',
            validate: (value) => value.trim().length > 0 || '请输入报错信息',
        });
        errorText = response.error?.trim() || '';
        if (!errorText) {
            (0, formatter_1.printError)('未输入报错信息');
            process.exit(1);
        }
    }
    const detectedLang = (0, detector_1.detectLanguage)(errorText);
    (0, formatter_1.printLanguageDetected)(detectedLang);
    let promptText = `请分析以下报错信息：\n\n${errorText}`;
    if (detectedLang !== 'unknown') {
        promptText += `\n\n检测到编程语言：${(0, detector_1.formatLanguageName)(detectedLang)}`;
    }
    if (options.explain) {
        promptText += '\n\n请详细解释错误原因，帮助我理解。';
    }
    (0, formatter_1.printLoading)('正在分析');
    try {
        const messages = (0, llm_1.createMessages)(config.systemMessage, promptText);
        const result = await (0, llm_1.callLLM)(config, messages);
        const parsed = (0, formatter_1.formatResult)(result);
        (0, formatter_1.printResult)(parsed, detectedLang);
        (0, formatter_1.printSuccess)('分析完成');
    }
    catch (error) {
        (0, formatter_1.printError)(error instanceof Error ? error.message : '分析失败');
        process.exit(1);
    }
}
main().catch((error) => {
    (0, formatter_1.printError)(error instanceof Error ? error.message : '未知错误');
    process.exit(1);
});
//# sourceMappingURL=error-solve.js.map