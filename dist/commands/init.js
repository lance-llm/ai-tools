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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const package_json_1 = require("../../package.json");
const CONFIG_DIR = path.join(os.homedir(), '.config', 'ai-tools');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const program = new commander_1.Command();
program
    .name('ai-init')
    .description('初始化 AI Tools 配置文件')
    .version(package_json_1.version)
    .option('-f, --force', '覆盖已存在的配置文件')
    .parse(process.argv);
const options = program.opts();
function printWelcome() {
    console.log('');
    console.log(chalk_1.default.green.bold('🤖 AI Tools - 初始化向导'));
    console.log(chalk_1.default.gray('配置文件路径：') + chalk_1.default.cyan(CONFIG_PATH));
    console.log('');
}
function printSuccess(message) {
    console.log(chalk_1.default.green('✅ ') + message);
}
function printError(message) {
    console.error(chalk_1.default.red('❌ ') + message);
}
function printInfo(message) {
    console.log(chalk_1.default.blue('ℹ️  ') + message);
}
async function main() {
    printWelcome();
    if (fs.existsSync(CONFIG_PATH) && !options.force) {
        console.log(chalk_1.default.yellow('⚠️  配置文件已存在!'));
        console.log('');
        const response = await (0, prompts_1.default)({
            type: 'confirm',
            name: 'overwrite',
            message: '是否覆盖现有配置？',
            initial: false,
        });
        if (!response.overwrite) {
            printInfo('已取消操作');
            process.exit(0);
        }
    }
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
        printSuccess(`配置目录已创建：${CONFIG_DIR}`);
    }
    console.log('');
    console.log('请输入配置信息：');
    console.log('(直接回车使用默认值)');
    console.log('');
    const response = await (0, prompts_1.default)([
        {
            type: 'text',
            name: 'baseUrl',
            message: 'API Base URL:',
            initial: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'API Key:',
            validate: (value) => value.length > 0 || 'API Key 不能为空',
        },
        {
            type: 'text',
            name: 'model',
            message: '默认模型:',
            initial: 'qwen3.5-flash',
        },
        {
            type: 'select',
            name: 'language',
            message: '输出语言:',
            initial: 0,
            choices: [
                { title: '中文', value: 'zh' },
                { title: 'English', value: 'en' },
            ],
        },
    ]);
    if (!response.apiKey) {
        printError('API Key 不能为空');
        process.exit(1);
    }
    const lang = response.language || 'zh';
    const config = {
        _docs: 'https://github.com/lance2026/ai-tools',
        baseUrl: response.baseUrl,
        apiKey: response.apiKey,
        model: response.model,
        language: lang,
        errorSolver: {
            model: response.model,
            explainMode: true,
            systemMessage: config_1.DEFAULT_SYSTEM_MESSAGES['errorSolver']?.[lang]
                ?? config_1.DEFAULT_SYSTEM_MESSAGES['errorSolver']?.['zh']
                ?? '',
        },
        smartShell: {
            model: response.model,
            showExplanation: true,
            systemMessage: config_1.DEFAULT_SYSTEM_MESSAGES['smartShell']?.[lang]
                ?? config_1.DEFAULT_SYSTEM_MESSAGES['smartShell']?.['zh']
                ?? '',
        },
        smartSql: {
            model: response.model,
            dialect: 'postgresql',
            systemMessage: config_1.DEFAULT_SYSTEM_MESSAGES['smartSql']?.[lang]
                ?? config_1.DEFAULT_SYSTEM_MESSAGES['smartSql']?.['zh']
                ?? '',
        },
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('');
    printSuccess('配置文件已创建！');
    console.log('');
    console.log('可用命令:');
    console.log('  ' + chalk_1.default.cyan('ai-error') + '        - 报错分析');
    console.log('  ' + chalk_1.default.cyan('ai-shell') + '        - Shell 命令生成');
    console.log('  ' + chalk_1.default.cyan('ai-sql') + '          - SQL 查询生成');
    console.log('  ' + chalk_1.default.cyan('ai-config') + '       - 查看/编辑配置');
    console.log('');
}
main().catch((error) => {
    printError(error instanceof Error ? error.message : '初始化失败');
    process.exit(1);
});
//# sourceMappingURL=init.js.map