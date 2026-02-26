// 输出格式化模块

import chalk from 'chalk';

export interface AnalysisResult {
  error?: string;
  fix?: string;
  hint?: string;
  raw?: string;
}

export function formatResult(result: string): AnalysisResult {
  const lines = result.split('\n');
  const parsed: AnalysisResult = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('❌ 错误:')) {
      parsed.error = trimmed.replace('❌ 错误:', '').trim();
    } else if (trimmed.startsWith('✅ 修复:')) {
      parsed.fix = trimmed.replace('✅ 修复:', '').trim();
    } else if (trimmed.startsWith('💡 提示:')) {
      parsed.hint = trimmed.replace('💡 提示:', '').trim();
    }
  }

  // 如果没有解析出结构化内容，返回原始内容
  if (!parsed.error && !parsed.fix && !parsed.hint) {
    parsed.raw = result;
  }

  return parsed;
}

export function printResult(result: AnalysisResult, _language?: string): void {
  console.log('');

  if (result.raw) {
    // 非结构化输出，直接打印
    console.log(chalk.white(result.raw));
  } else {
    // 结构化输出
    if (result.error) {
      console.log(chalk.red('❌ 错误: ') + chalk.yellow(result.error));
    }
    if (result.fix) {
      console.log(chalk.green('✅ 修复: ') + chalk.cyan(result.fix));
    }
    if (result.hint) {
      console.log(chalk.blue('💡 提示: ') + chalk.gray(result.hint));
    }
  }

  console.log('');
}

export function printLoading(text: string = '分析中'): void {
  console.log(chalk.yellow('⏳ ') + chalk.gray(text) + '...');
}

export function printWelcome(): void {
  console.log('');
  console.log(chalk.green.bold('🔧 Error Solver ') + chalk.gray('v1.0.0'));
  console.log(chalk.gray('粘贴报错信息，AI 自动分析原因并给出修复方案'));
  console.log(chalk.gray('输入 Ctrl+C 退出'));
  console.log('');
}

export function printInputPrompt(): void {
  console.log(chalk.yellow('📋 ') + chalk.gray('请输入报错信息 (或直接粘贴):'));
}

export function printClipboardRead(): void {
  console.log(chalk.green('✅ ') + chalk.gray('已从剪贴板读取内容'));
}

export function printLanguageDetected(lang: string): void {
  const icon = lang === 'unknown' ? '🔍' : getLanguageIcon(lang);
  const name = formatLanguageName(lang);
  console.log(chalk.cyan(`${icon} `) + chalk.gray(`检测到语言：${name}`));
}

export function printError(message: string): void {
  console.error(chalk.red('❌ 错误: ') + message);
}

export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ️  ') + chalk.gray(message));
}

export function printSuccess(message: string): void {
  console.log(chalk.green('✅ ') + message);
}

// 辅助函数
function getLanguageIcon(lang: string): string {
  const icons: Record<string, string> = {
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

function formatLanguageName(lang: string): string {
  const names: Record<string, string> = {
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
