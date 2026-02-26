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
const child_process_1 = require("child_process");
const CONFIG_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'config.json');
const program = new commander_1.Command();
program
    .name('ai-config')
    .description('查看或编辑 AI Tools 配置')
    .version('1.0.0')
    .option('-e, --edit', '使用默认编辑器打开配置文件')
    .option('-p, --path', '仅显示配置文件路径')
    .option('--reset', '重置为默认配置（危险操作）')
    .parse(process.argv);
const options = program.opts();
function printSuccess(message) {
    console.log(chalk_1.default.green('✅ ') + message);
}
function printError(message) {
    console.error(chalk_1.default.red('❌ ') + message);
}
function printInfo(message) {
    console.log(chalk_1.default.blue('ℹ️  ') + message);
}
function printWarning(message) {
    console.log(chalk_1.default.yellow('⚠️  ') + message);
}
function showConfigPath() {
    console.log(CONFIG_PATH);
}
function showConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        printWarning('配置文件不存在，运行 "ai-init" 进行初始化');
        process.exit(1);
    }
    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(content);
        console.log('');
        console.log(chalk_1.default.green.bold('📄 配置文件：') + chalk_1.default.gray(CONFIG_PATH));
        console.log('');
        const displayConfig = { ...config };
        if (displayConfig.apiKey) {
            displayConfig.apiKey = displayConfig.apiKey.replace(/^(sk-\w{4})\w+(.{4})$/, '$1...$2');
        }
        console.log(chalk_1.default.cyan(JSON.stringify(displayConfig, null, 2)));
        console.log('');
        console.log('操作选项:');
        console.log('  ' + chalk_1.default.cyan('ai-config -e') + '     - 用编辑器打开');
        console.log('  ' + chalk_1.default.cyan('ai-config --reset') + ' - 重置配置');
        console.log('');
    }
    catch (error) {
        printError(`读取配置失败：${error instanceof Error ? error.message : '未知错误'}`);
        process.exit(1);
    }
}
function editConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        printWarning('配置文件不存在，运行 "ai-init" 进行初始化');
        process.exit(1);
    }
    const editor = process.env.EDITOR || 'vi';
    console.log(`使用编辑器打开：${editor}`);
    (0, child_process_1.exec)(`${editor} "${CONFIG_PATH}"`, (error) => {
        if (error) {
            printError(`打开编辑器失败：${error.message}`);
            console.log(chalk_1.default.gray(`手动编辑：${CONFIG_PATH}`));
            return;
        }
        printSuccess('配置已保存');
    });
}
function resetConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        printWarning('配置文件不存在');
        process.exit(1);
    }
    console.log('');
    console.log(chalk_1.default.red.bold('⚠️  警告：此操作将覆盖现有配置！'));
    console.log('');
    (0, prompts_1.default)({
        type: 'confirm',
        name: 'confirmed',
        message: '确定要重置配置吗？',
        initial: false,
    }).then((response) => {
        if (!response.confirmed) {
            printInfo('已取消操作');
            process.exit(0);
        }
        const defaultConfig = {
            _comment: 'AI Tools 通用配置文件',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: 'sk-xxxxx',
            model: 'qwen3.5-flash',
            language: 'zh',
            errorSolver: {
                model: 'qwen3.5-flash',
                explainMode: true,
            },
            smartShell: {
                model: 'qwen3.5-flash',
            },
            smartSql: {
                model: 'qwen3.5-flash',
                dialect: 'postgresql',
            },
        };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
        printSuccess('配置已重置，请运行 "ai-init" 设置 API Key');
    });
}
async function main() {
    if (options.path) {
        showConfigPath();
        return;
    }
    if (options.edit) {
        editConfig();
        return;
    }
    if (options.reset) {
        resetConfig();
        return;
    }
    showConfig();
}
main().catch((error) => {
    printError(error instanceof Error ? error.message : '操作失败');
    process.exit(1);
});
//# sourceMappingURL=config.js.map