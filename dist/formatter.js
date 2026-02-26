"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResult = formatResult;
exports.printResult = printResult;
exports.printLoading = printLoading;
exports.printWelcome = printWelcome;
exports.printInputPrompt = printInputPrompt;
exports.printClipboardRead = printClipboardRead;
exports.printLanguageDetected = printLanguageDetected;
exports.printError = printError;
exports.printInfo = printInfo;
exports.printSuccess = printSuccess;
const chalk_1 = __importDefault(require("chalk"));
function formatResult(result) {
    const lines = result.split('\n');
    const parsed = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('❌ 错误:')) {
            parsed.error = trimmed.replace('❌ 错误:', '').trim();
        }
        else if (trimmed.startsWith('✅ 修复:')) {
            parsed.fix = trimmed.replace('✅ 修复:', '').trim();
        }
        else if (trimmed.startsWith('💡 提示:')) {
            parsed.hint = trimmed.replace('💡 提示:', '').trim();
        }
    }
    if (!parsed.error && !parsed.fix && !parsed.hint) {
        parsed.raw = result;
    }
    return parsed;
}
function printResult(result, _language) {
    console.log('');
    if (result.raw) {
        console.log(chalk_1.default.white(result.raw));
    }
    else {
        if (result.error) {
            console.log(chalk_1.default.red('❌ 错误: ') + chalk_1.default.yellow(result.error));
        }
        if (result.fix) {
            console.log(chalk_1.default.green('✅ 修复: ') + chalk_1.default.cyan(result.fix));
        }
        if (result.hint) {
            console.log(chalk_1.default.blue('💡 提示: ') + chalk_1.default.gray(result.hint));
        }
    }
    console.log('');
}
function printLoading(text = '分析中') {
    console.log(chalk_1.default.yellow('⏳ ') + chalk_1.default.gray(text) + '...');
}
function printWelcome() {
    console.log('');
    console.log(chalk_1.default.green.bold('🔧 Error Solver ') + chalk_1.default.gray('v1.0.0'));
    console.log(chalk_1.default.gray('粘贴报错信息，AI 自动分析原因并给出修复方案'));
    console.log(chalk_1.default.gray('输入 Ctrl+C 退出'));
    console.log('');
}
function printInputPrompt() {
    console.log(chalk_1.default.yellow('📋 ') + chalk_1.default.gray('请输入报错信息 (或直接粘贴):'));
}
function printClipboardRead() {
    console.log(chalk_1.default.green('✅ ') + chalk_1.default.gray('已从剪贴板读取内容'));
}
function printLanguageDetected(lang) {
    const icon = lang === 'unknown' ? '🔍' : getLanguageIcon(lang);
    const name = formatLanguageName(lang);
    console.log(chalk_1.default.cyan(`${icon} `) + chalk_1.default.gray(`检测到语言：${name}`));
}
function printError(message) {
    console.error(chalk_1.default.red('❌ 错误: ') + message);
}
function printInfo(message) {
    console.log(chalk_1.default.blue('ℹ️  ') + chalk_1.default.gray(message));
}
function printSuccess(message) {
    console.log(chalk_1.default.green('✅ ') + message);
}
function getLanguageIcon(lang) {
    const icons = {
        python: '🐍',
        javascript: '🟨',
        typescript: '🟦',
        java: '☕',
        go: '🐹',
        rust: '🦀',
        unknown: '🔍',
    };
    return icons[lang] || '🔍';
}
function formatLanguageName(lang) {
    const names = {
        python: 'Python',
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        java: 'Java',
        go: 'Go',
        rust: 'Rust',
        unknown: '未知',
    };
    return names[lang] || lang;
}
//# sourceMappingURL=formatter.js.map