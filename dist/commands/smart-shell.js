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
const prompts_1 = __importDefault(require("prompts"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const clipboardy_1 = __importDefault(require("clipboardy"));
const config_1 = require("../config");
const llm_1 = require("../llm");
const formatter_1 = require("../formatter");
const package_json_1 = require("../../package.json");
const TOOL_NAME = 'smartShell';
const HISTORY_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'shell-history.json');
const MAX_HISTORY = 50;
const DANGEROUS_PATTERNS = [
    { pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)/i, label: 'rm -rf (递归强制删除)' },
    { pattern: /\bsudo\b/, label: 'sudo (超级用户权限)' },
    { pattern: /chmod\s+[0-7]*7[0-7][0-7]/, label: 'chmod 777 (危险权限)' },
    { pattern: /\bdd\b.*\bif=/, label: 'dd (磁盘写入)' },
    { pattern: /\bmkfs\b/, label: 'mkfs (格式化文件系统)' },
    { pattern: />[\s]*\/(etc|usr|bin|sbin|var|boot)\//, label: '写入系统目录' },
];
const I18N = {
    zh: {
        title: '🐚 AI Shell - 根据描述生成 Shell 命令',
        inputPrompt: '请输入你想要执行的操作 (例如：查找所有大于 100M 的文件):',
        descriptionLabel: '描述',
        generating: '正在生成命令',
        actionMenu: '选择操作',
        actionRun: '⚡ 直接执行',
        actionCopy: '📋 复制到剪贴板',
        actionEdit: '✏️  编辑后执行',
        actionCancel: '✖  取消',
        editLabel: '编辑命令',
        dangerWarning: '⚠️  警告：此命令包含危险操作',
        dangerConfirmHint: '需要输入 "yes" 确认执行',
        dangerConfirmLabel: '确认',
        dangerCancelled: '已取消执行',
        executing: '⚡ 执行中...',
        execDone: '执行完成',
        execFailed: '执行失败',
        execErrorHint: '💡 提示：可以用 ai-error 分析这个错误',
        copied: '已复制到剪贴板',
        cancelled: '已取消',
        success: '生成完成',
        failed: '生成失败',
        noCommand: '未能从响应中提取命令',
        historyEmpty: '暂无命令历史',
        historyTitle: '📜 命令历史（最近 ' + MAX_HISTORY + ' 条）',
    },
    en: {
        title: '🐚 AI Shell - Generate Shell commands from description',
        inputPrompt: 'Enter what you want to do (e.g., find all files larger than 100M):',
        descriptionLabel: 'Description',
        generating: 'Generating command',
        actionMenu: 'Choose action',
        actionRun: '⚡ Execute directly',
        actionCopy: '📋 Copy to clipboard',
        actionEdit: '✏️  Edit then execute',
        actionCancel: '✖  Cancel',
        editLabel: 'Edit command',
        dangerWarning: '⚠️  Warning: This command contains dangerous operations',
        dangerConfirmHint: 'Type "yes" to confirm execution',
        dangerConfirmLabel: 'Confirm',
        dangerCancelled: 'Execution cancelled',
        executing: '⚡ Executing...',
        execDone: 'Execution complete',
        execFailed: 'Execution failed',
        execErrorHint: '💡 Tip: Use ai-error to analyze this error',
        copied: 'Copied to clipboard',
        cancelled: 'Cancelled',
        success: 'Generation complete',
        failed: 'Generation failed',
        noCommand: 'Could not extract command from response',
        historyEmpty: 'No command history',
        historyTitle: '📜 Command history (last ' + MAX_HISTORY + ')',
    },
};
async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data.trim()));
    });
}
function stripBackticks(s) {
    return s.replace(/^`+|`+$/g, '').trim();
}
function extractCommand(response) {
    const cmdMatch = response.match(/📝\s*(?:命令|Command)[:：]\s*(.+)/);
    if (cmdMatch)
        return stripBackticks(cmdMatch[1].trim());
    const codeMatch = response.match(/```(?:bash|sh|shell)?\n?([\s\S]+?)\n?```/);
    if (codeMatch)
        return codeMatch[1].trim();
    const fixMatch = response.match(/✅\s*(?:修复|Fix)[:：]\s*(.+)/);
    if (fixMatch)
        return stripBackticks(fixMatch[1].trim());
    return null;
}
function extractExplanation(response) {
    const explMatch = response.match(/📖\s*(?:说明|Explanation)[:：]\s*(.+)/);
    if (!explMatch)
        return null;
    return explMatch[1]
        .trim()
        .replace(/^\*\s+/, '')
        .replace(/`([^`]+)`/g, '$1');
}
function detectDangerous(command) {
    return DANGEROUS_PATTERNS
        .filter(({ pattern }) => pattern.test(command))
        .map(({ label }) => label);
}
async function executeCommand(command) {
    return new Promise((resolve) => {
        const start = Date.now();
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            const duration = Date.now() - start;
            const exitCode = error ? (error.code ?? 1) : 0;
            resolve({ stdout, stderr, exitCode, duration });
        });
    });
}
function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_PATH)) {
            return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
        }
    }
    catch {
    }
    return [];
}
function saveHistory(entries) {
    try {
        const dir = path.dirname(HISTORY_PATH);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2));
    }
    catch {
    }
}
function addHistory(description, command, executed) {
    const entries = loadHistory();
    entries.unshift({ timestamp: new Date().toISOString(), description, command, executed });
    if (entries.length > MAX_HISTORY)
        entries.splice(MAX_HISTORY);
    saveHistory(entries);
}
function showHistory() {
    const t = I18N.zh;
    const entries = loadHistory();
    console.log('');
    console.log(chalk_1.default.bold(t.historyTitle));
    console.log('');
    if (entries.length === 0) {
        console.log(chalk_1.default.gray(t.historyEmpty));
        console.log('');
        return;
    }
    entries.forEach((entry, index) => {
        const d = new Date(entry.timestamp);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const execIcon = entry.executed ? chalk_1.default.green('✓') : chalk_1.default.gray('○');
        console.log(`${chalk_1.default.gray(String(index + 1).padStart(2))}. ${execIcon} ${chalk_1.default.gray(dateStr)}  ${chalk_1.default.cyan(entry.command)}`);
        console.log(`    ${chalk_1.default.gray(entry.description)}`);
        console.log('');
    });
}
async function run(userInput) {
    const options = program.opts();
    const config = (0, config_1.loadConfig)(TOOL_NAME, options.config);
    const language = (0, config_1.getLanguage)(config);
    const t = I18N[language] || I18N.zh;
    console.log('');
    console.log(chalk_1.default.bold(t.title));
    console.log('');
    if (!userInput) {
        console.log(chalk_1.default.gray(`📋 ${t.inputPrompt}`));
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
    (0, formatter_1.printLoading)(t.generating);
    let rawResult;
    try {
        const messages = (0, llm_1.createMessages)(config.systemMessage, userInput);
        rawResult = await (0, llm_1.callLLM)(config, messages);
    }
    catch (error) {
        (0, formatter_1.printError)(error instanceof Error ? error.message : t.failed);
        process.exit(1);
    }
    const command = extractCommand(rawResult);
    const explanation = extractExplanation(rawResult);
    console.log('');
    if (command) {
        console.log('  ' + chalk_1.default.gray('$') + ' ' + chalk_1.default.cyan.bold(command));
    }
    else {
        console.log(chalk_1.default.white(rawResult));
    }
    if (explanation && config.showExplanation !== false) {
        console.log('  ' + chalk_1.default.gray(explanation));
    }
    console.log('');
    if (!command) {
        (0, formatter_1.printSuccess)(t.success);
        return;
    }
    const actionResponse = await (0, prompts_1.default)({
        type: 'select',
        name: 'action',
        message: t.actionMenu,
        hint: ' ',
        choices: [
            { title: t.actionRun, value: 'run' },
            { title: t.actionCopy, value: 'copy' },
            { title: t.actionEdit, value: 'edit' },
            { title: t.actionCancel, value: 'cancel' },
        ],
    });
    const action = actionResponse.action;
    if (!action || action === 'cancel') {
        console.log(chalk_1.default.gray(t.cancelled));
        addHistory(userInput, command, false);
        return;
    }
    if (action === 'copy') {
        clipboardy_1.default.writeSync(command);
        (0, formatter_1.printSuccess)(t.copied);
        addHistory(userInput, command, false);
        return;
    }
    let finalCommand = command;
    if (action === 'edit') {
        const editResponse = await (0, prompts_1.default)({
            type: 'text',
            name: 'command',
            message: t.editLabel,
            initial: command,
        });
        finalCommand = editResponse.command?.trim() || command;
        if (!finalCommand) {
            console.log(chalk_1.default.gray(t.cancelled));
            return;
        }
    }
    const dangers = detectDangerous(finalCommand);
    if (dangers.length > 0) {
        console.log('');
        console.log(chalk_1.default.yellow.bold(t.dangerWarning));
        dangers.forEach((d) => console.log(chalk_1.default.yellow(`  • ${d}`)));
        console.log('  ' + chalk_1.default.gray(finalCommand));
        console.log('');
        console.log(chalk_1.default.yellow(t.dangerConfirmHint));
        const confirmResponse = await (0, prompts_1.default)({
            type: 'text',
            name: 'confirm',
            message: t.dangerConfirmLabel,
        });
        if (confirmResponse.confirm?.trim().toLowerCase() !== 'yes') {
            console.log(chalk_1.default.gray(t.dangerCancelled));
            addHistory(userInput, finalCommand, false);
            return;
        }
    }
    console.log('');
    console.log(chalk_1.default.yellow(t.executing));
    console.log('');
    const result = await executeCommand(finalCommand);
    if (result.stdout)
        process.stdout.write(result.stdout);
    if (result.stderr)
        process.stderr.write(chalk_1.default.red(result.stderr));
    console.log('');
    const duration = (result.duration / 1000).toFixed(1);
    if (result.exitCode === 0) {
        console.log(chalk_1.default.green(`✅ ${t.execDone}`) +
            chalk_1.default.gray(`（耗时 ${duration}s）  退出码: ${result.exitCode}`));
    }
    else {
        console.log(chalk_1.default.red(`❌ ${t.execFailed}`) +
            chalk_1.default.gray(`（耗时 ${duration}s）  退出码: ${result.exitCode}`));
        console.log('');
        console.log(chalk_1.default.gray(t.execErrorHint));
    }
    addHistory(userInput, finalCommand, true);
}
const program = new commander_1.Command();
program
    .name('ai-shell')
    .description('AI 驱动的 Shell 命令生成工具 - 根据自然语言描述生成 Shell 命令')
    .version(package_json_1.version)
    .option('-c, --config <path>', '指定配置文件路径')
    .option('--history', '查看命令历史')
    .argument('[input...]', '用户输入描述或命令')
    .action(async (args) => {
    const options = program.opts();
    if (options.history) {
        showHistory();
        return;
    }
    let userInput = null;
    if (!process.stdin.isTTY) {
        userInput = await readStdin();
    }
    else if (args && args.length > 0) {
        userInput = args.join(' ');
    }
    await run(userInput);
});
function main() {
    program.parse(process.argv);
}
main();
//# sourceMappingURL=smart-shell.js.map