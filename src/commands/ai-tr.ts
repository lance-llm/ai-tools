// ai-tr command - AI 双向翻译工具

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { loadConfig } from '../config';
import { callLLM, createMessages } from '../llm';
import { printLoading, printError, printSuccess } from '../formatter';
import { version } from '../../package.json';

const TOOL_NAME = 'aiTr';

// 语言代码映射
const LANGUAGE_NAMES: Record<string, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
};

// 读取 stdin 内容（支持管道）
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

// 保存配置到文件
function saveConfig(languages: string[]): void {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const configPath = path.join(os.homedir(), '.config', 'ai-tools', 'config.json');
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let config: Record<string, any> = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      // 忽略解析错误，创建新配置
    }
  }

  config.aiTr = { languages };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// 提取翻译结果（去除多余说明）
function extractTranslation(response: string): string {
  // 尝试提取 "📝 翻译："或"Translation:"后的内容
  const zhMatch = response.match(/📝\s*[翻译]?[翻译]*[:：]?\s*([\s\S]+?)(?=\n📖|\n💡|\n✅|\n❌|$)/);
  if (zhMatch) {
    return zhMatch[1].trim();
  }

  const enMatch = response.match(/📝\s*Translation[:：]?\s*([\s\S]+?)(?=\n📖|\n💡|\n✅|\n❌|$)/);
  if (enMatch) {
    return enMatch[1].trim();
  }

  //  fallback: 返回第一行非空内容
  const lines = response.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('📖') && !trimmed.startsWith('💡')) {
      return trimmed;
    }
  }

  return response.trim();
}

async function run(userInput: string | null, options: any): Promise<void> {
  const config = loadConfig(TOOL_NAME, options.config);

  // 获取语言对配置
  let languages = options.langs;
  if (!languages) {
    // 从 config 中读取
    const toolConfig = config.aiTr || {};
    languages = toolConfig.languages?.join(',') || 'zh,en';
  }

  const [lang1, lang2] = languages.split(',').map((l: string) => l.trim());

  if (!lang1 || !lang2) {
    printError('Invalid language pair. Use format: zh,en');
    process.exit(1);
  }

  const lang1Name = LANGUAGE_NAMES[lang1] || lang1;
  const lang2Name = LANGUAGE_NAMES[lang2] || lang2;

  // 交互式输入（仅在无输入时）
  if (!userInput) {
    console.log('');
    console.log(chalk.bold('🌐 AI Translate - 智能双语翻译'));
    console.log(chalk.gray(`  当前语言对：${lang1Name} ⇄ ${lang2Name}`));
    console.log('');
    console.log(chalk.gray('📋 请输入要翻译的内容（或 Ctrl+C 退出）:'));
    console.log('');

    const response = await prompts({
      type: 'text',
      name: 'content',
      message: '翻译内容',
      initial: '',
      validate: (value: string) => value.trim().length > 0 || '请输入内容',
    });

    userInput = response.content?.trim() || '';
  }

  if (!userInput) {
    printError('未输入内容');
    process.exit(1);
  }

  // 构建翻译 Prompt
  const systemMessage = `你是专业翻译，擅长在 ${lang1Name} 和 ${lang2Name} 之间进行准确、自然的互译。

任务：
1. 自动检测输入内容的语言
2. 如果输入是${lang1Name}，翻译成${lang2Name}
3. 如果输入是${lang2Name}，翻译成${lang1Name}
4. 保持原文的格式（多行、标点等）
5. 译文要自然流畅，符合目标语言的表达习惯

直接输出翻译结果，不需要额外说明。`;

  printLoading('正在翻译');

  let rawResult: string;
  try {
    const messages = createMessages(systemMessage, userInput);
    rawResult = await callLLM(config, messages);
  } catch (error) {
    printError(error instanceof Error ? error.message : '翻译失败');
    process.exit(1);
  }

  // 提取翻译结果
  const translation = extractTranslation(rawResult);

  console.log('');

  // 显示翻译结果
  console.log(chalk.cyan(translation));

  console.log('');

  // 自动复制到剪贴板
  clipboard.writeSync(translation);
  printSuccess('已复制到剪贴板');
  console.log('');
}

const program = new Command();

program
  .name('ai-tr')
  .description('AI 驱动的双向翻译工具 - 自动检测语言并在两种语言间互译')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-l, --langs <pair>', '设置语言对，例如 "zh,en" 或 "zh,ja"', 'zh,en')
  .option('--set-langs <pair>', '保存语言对到配置文件（例如："zh,en"）')
  .argument('[input...]', '要翻译的内容')
  .action(async (args: string[]) => {
    const options = program.opts();

    // 处理 --set-langs
    if (options.setLangs) {
      const [lang1, lang2] = options.setLangs.split(',').map((l: string) => l.trim());
      if (!lang1 || !lang2) {
        printError('Invalid language pair. Use format: zh,en');
        process.exit(1);
      }
      saveConfig([lang1, lang2]);
      console.log(chalk.green('✅ ') + '配置已保存');
      console.log(chalk.gray(`  当前语言对：${LANGUAGE_NAMES[lang1] || lang1} ⇄ ${LANGUAGE_NAMES[lang2] || lang2}`));
      return;
    }

    let userInput: string | null = null;

    // 从 stdin 读取（管道输入）
    if (!process.stdin.isTTY) {
      userInput = await readStdin();
    } else if (args && args.length > 0) {
      userInput = args.join(' ');
    }

    await run(userInput, options);
  });

function main(): void {
  program.parse(process.argv);
}

main();
