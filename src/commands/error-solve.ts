// error-solve 命令实现

import { Command } from 'commander';
import prompts from 'prompts';
import clipboard from 'clipboardy';
import { loadConfig } from '../config';
import { callLLM, createMessages } from '../llm';
import { detectLanguage, formatLanguageName } from '../detector';
import {
  printWelcome,
  printInputPrompt,
  printClipboardRead,
  printLanguageDetected,
  printLoading,
  printResult,
  formatResult,
  printError,
  printSuccess,
} from '../formatter';

const TOOL_NAME = 'errorSolver';

const program = new Command();

program
  .name('ai-error')
  .description('AI 驱动的报错分析工具 - 粘贴报错信息，AI 自动分析原因并给出修复方案')
  .version('1.0.0')
  .option('-y, --yes', '直接读取剪贴板，不交互')
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-e, --explain', '启用详细解释模式')
  .parse(process.argv);

const options = program.opts();

async function main() {
  // 加载配置
  const config = loadConfig(TOOL_NAME, options.config);

  // 交互模式
  if (!options.yes) {
    printWelcome();
  }

  // 获取报错内容
  let errorText: string;

  if (options.yes) {
    // 直接读取剪贴板
    try {
      errorText = clipboard.readSync();
      printClipboardRead();
    } catch (error) {
      printError('无法读取剪贴板内容');
      process.exit(1);
    }
  } else {
    // 交互输入
    printInputPrompt();

    const response = await prompts({
      type: 'text',
      name: 'error',
      message: '报错信息:',
      initial: '',
      validate: (value: string) => value.trim().length > 0 || '请输入报错信息',
    });

    errorText = response.error?.trim() || '';

    if (!errorText) {
      printError('未输入报错信息');
      process.exit(1);
    }
  }

  // 检测语言
  const detectedLang = detectLanguage(errorText);
  printLanguageDetected(detectedLang);

  // 构建 Prompt
  let promptText = `请分析以下报错信息：\n\n${errorText}`;

  if (detectedLang !== 'unknown') {
    promptText += `\n\n检测到编程语言：${formatLanguageName(detectedLang)}`;
  }

  if (options.explain) {
    promptText += '\n\n请详细解释错误原因，帮助我理解。';
  }

  // 调用 LLM
  printLoading('正在分析');

  try {
    const messages = createMessages(config.systemMessage!, promptText);
    const result = await callLLM(config, messages);

    // 解析并打印结果
    const parsed = formatResult(result);
    printResult(parsed, detectedLang);

    printSuccess('分析完成');
  } catch (error) {
    printError(error instanceof Error ? error.message : '分析失败');
    process.exit(1);
  }
}

main().catch((error) => {
  printError(error instanceof Error ? error.message : '未知错误');
  process.exit(1);
});
