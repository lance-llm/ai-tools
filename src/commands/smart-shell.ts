// smart-shell 命令实现

import { Command } from 'commander';
import prompts from 'prompts';
import { exec } from 'child_process';
import { loadConfig, getLanguage } from '../config';
import { callLLM, createMessages } from '../llm';
import {
  printLoading,
  printResult,
  formatResult,
  printError,
  printSuccess,
} from '../formatter';

const TOOL_NAME = 'smartShell';

const program = new Command();

program
  .name('ai-shell')
  .description('AI 驱动的 Shell 命令生成工具 - 根据自然语言描述生成 Shell 命令')
  .version('1.0.0')
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-r, --run', '直接执行生成的命令')
  .option('-m, --modify', '修改模式：提供命令和报错信息进行修复')
  .argument('[input...]', '用户输入描述或命令')
  .action((args) => {
    // 处理命令行参数
    const userInput = args ? args.join(' ') : null;
    run(userInput);
  });

// 国际化文本
const I18N = {
  zh: {
    title: '🐚 AI Shell - 根据描述生成 Shell 命令',
    inputPrompt: '请输入你想要执行的操作 (例如：查找所有大于 100M 的文件):',
    inputPromptModify: '请输入命令和报错信息 (格式：命令 | 报错信息):',
    descriptionLabel: '描述',
    generating: '正在生成命令',
    executing: '即将执行以下命令',
    confirmMsg: '确认执行？此操作可能有风险',
    running: '执行中',
    execFailed: '执行失败',
    success: '生成完成',
    failed: '生成失败',
  },
  en: {
    title: '🐚 AI Shell - Generate Shell commands from description',
    inputPrompt: 'Enter what you want to do (e.g., find all files larger than 100M):',
    inputPromptModify: 'Enter command and error (format: command | error message):',
    descriptionLabel: 'Description',
    generating: 'Generating command',
    executing: 'About to execute the following command',
    confirmMsg: 'Confirm execution? This operation may be risky',
    running: 'Running',
    execFailed: 'Execution failed',
    success: 'Generation complete',
    failed: 'Generation failed',
  },
};

async function run(userInput: string | null) {
  const options = program.opts();

  // 加载配置
  const config = loadConfig(TOOL_NAME, options.config);
  const language = getLanguage(config);
  const t = I18N[language as keyof typeof I18N] || I18N.zh;

  console.log('');
  console.log(t.title);
  console.log('');

  // 如果没有命令行参数，进入交互模式
  if (!userInput) {
    const promptMessage = options.modify ? t.inputPromptModify : t.inputPrompt;
    console.log(`📋 ${promptMessage}`);

    const response = await prompts({
      type: 'text',
      name: 'description',
      message: t.descriptionLabel,
      initial: '',
      validate: (value: string) => value.trim().length > 0 || '请输入描述',
    });

    userInput = response.description?.trim() || '';
  }

  if (!userInput) {
    printError('未输入描述');
    process.exit(1);
  }

  // 构建提示词
  let promptText: string;
  if (options.modify) {
    promptText = `请帮我修复以下 Shell 命令:

命令：${userInput}

请分析错误原因并给出修复后的命令。`;
  } else {
    promptText = userInput;
  }

  // 调用 LLM
  printLoading(t.generating);

  try {
    const messages = createMessages(config.systemMessage!, promptText);
    const result = await callLLM(config, messages);

    // 解析并打印结果
    const parsed = formatResult(result);
    printResult(parsed);

    // 如果用户选择直接执行
    if (options.run && parsed.fix) {
      console.log(`⚠️  ${t.executing}:`);
      console.log(parsed.fix);

      const confirm = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: t.confirmMsg,
        initial: false,
      });

      if (confirm.confirmed) {
        console.log(`⏳ ${t.running}...\n`);
        exec(parsed.fix, (error, stdout, stderr) => {
          if (error) {
            printError(`${t.execFailed}: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log('STDERR:', stderr);
          }
          if (stdout) {
            console.log('STDOUT:', stdout);
          }
          printSuccess(t.success);
        });
      }
    }

    printSuccess(t.success);
  } catch (error) {
    printError(error instanceof Error ? error.message : t.failed);
    process.exit(1);
  }
}

function main() {
  program.parse(process.argv);
}

main();
