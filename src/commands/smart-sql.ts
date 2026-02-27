// smart-sql 命令实现

import { Command } from 'commander';
import prompts from 'prompts';
import { loadConfig, getLanguage } from '../config';
import { callLLM, createMessages } from '../llm';
import {
  printLoading,
  printResult,
  formatResult,
  printError,
  printSuccess,
} from '../formatter';
import { version } from '../../package.json';

const TOOL_NAME = 'smartSql';

const program = new Command();

program
  .name('ai-sql')
  .description('AI 驱动的 SQL 查询生成工具 - 根据自然语言描述生成 SQL 查询')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-d, --dialect <type>', 'SQL 方言 (postgresql/mysql/sqlite)', 'postgresql')
  .option('-m, --modify', '修改模式：提供 SQL 和报错信息进行修复')
  .argument('[input...]', '用户输入描述或 SQL')
  .action((args) => {
    // 处理命令行参数
    const userInput = args ? args.join(' ') : null;
    run(userInput);
  });

// 国际化文本
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

async function run(userInput: string | null) {
  const options = program.opts();

  // 加载配置
  const config = loadConfig(TOOL_NAME, options.config);
  const language = getLanguage(config);
  const t = I18N[language as keyof typeof I18N] || I18N.zh;

  // 优先使用命令行选项的 dialect，其次使用配置文件的 dialect
  const dialect = options.dialect || config.dialect || 'postgresql';

  console.log('');
  console.log(t.title);
  console.log(`🔧 ${t.dialectLabel}: ${dialect}`);
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
    promptText = `请帮我修复以下 SQL:

SQL: ${userInput}

请分析错误原因并给出修复后的 SQL。`;
  } else {
    promptText = `${userInput}

SQL 方言：${dialect}`;
  }

  // 调用 LLM
  printLoading(t.generating);

  try {
    const messages = createMessages(config.systemMessage!, promptText);
    const result = await callLLM(config, messages);

    // 解析并打印结果
    const parsed = formatResult(result);
    printResult(parsed);

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
