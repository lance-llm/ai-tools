// smart-sql command implementation

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { loadConfig, getLanguage } from '../config';
import { callLLM, createMessages } from '../llm';
import { printLoading, printError, printSuccess } from '../formatter';
import { version } from '../../package.json';

const TOOL_NAME = 'smartSql';

// I18N text
const I18N = {
  zh: {
    title: '📊 AI SQL - 根据描述生成 SQL 查询',
    dialectLabel: '方言',
    inputPrompt: '请输入你想要查询的内容 (例如：查询年龄大于 18 岁的用户):',
    inputPromptModify: '请输入 SQL 和报错信息 (格式：SQL | 报错信息):',
    descriptionLabel: '描述',
    generating: '正在生成 SQL',
    actionMenu: '选择操作',
    actionCopy: '📋 复制到剪贴板',
    actionEdit: '✏️  编辑后复制',
    actionCancel: '✖  取消',
    editLabel: '编辑 SQL',
    copied: '已复制到剪贴板',
    cancelled: '已取消',
    success: '生成完成',
    failed: '生成失败',
    noSQL: '未能从响应中提取 SQL',
  },
  en: {
    title: '📊 AI SQL - Generate SQL from description',
    dialectLabel: 'Dialect',
    inputPrompt: 'Enter your query description (e.g., select users older than 18):',
    inputPromptModify: 'Enter SQL and error (format: SQL | error message):',
    descriptionLabel: 'Description',
    generating: 'Generating SQL',
    actionMenu: 'Choose action',
    actionCopy: '📋 Copy to clipboard',
    actionEdit: '✏️  Edit then copy',
    actionCancel: '✖  Cancel',
    editLabel: 'Edit SQL',
    copied: 'Copied to clipboard',
    cancelled: 'Cancelled',
    success: 'Generation complete',
    failed: 'Generation failed',
    noSQL: 'Could not extract SQL from response',
  },
};

// Read all data from stdin (for pipe support)
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

// Extract SQL from LLM response, stripping code fences and backticks
function extractSQL(response: string): string | null {
  // Match "📝 SQL: ..." section — content may start with a code fence
  const sectionMatch = response.match(/📝\s*SQL[:：]\s*([\s\S]+?)(?=\n📖|\n💡|\n✅|\n❌|$)/);
  if (sectionMatch) {
    const section = sectionMatch[1].trim();
    const fenced = section.match(/```(?:sql)?\n?([\s\S]+?)\n?```/i);
    if (fenced) return fenced[1].trim();
    return section.replace(/^`+|`+$/g, '').trim();
  }
  // Fallback: first fenced code block
  const codeMatch = response.match(/```(?:sql)?\n?([\s\S]+?)\n?```/i);
  if (codeMatch) return codeMatch[1].trim();

  return null;
}

// Extract and clean explanation, stripping markdown formatting
function extractExplanation(response: string): string | null {
  const explMatch = response.match(/📖\s*(?:说明|Explanation)[:：]\s*([\s\S]+?)(?=\n\n|\n📝|\n✅|\n❌|$)/);
  if (!explMatch) return null;
  return explMatch[1]
    .trim()
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // strip **bold**
    .replace(/`([^`]+)`/g, '$1')        // strip `code`
    .replace(/^\*\s+/, '');             // strip leading bullet
}

async function run(userInput: string | null): Promise<void> {
  const options = program.opts();
  const config = loadConfig(TOOL_NAME, options.config);
  const language = getLanguage(config);
  const t = I18N[language as keyof typeof I18N] || I18N.zh;

  // CLI flag takes precedence over config, then falls back to 'postgresql'
  const dialect: string = options.dialect !== 'postgresql'
    ? options.dialect
    : (config.dialect || 'postgresql');

  console.log('');
  console.log(chalk.bold(t.title));
  console.log(chalk.gray(`  ${t.dialectLabel}: ${dialect}`));
  console.log('');

  // Interactive input when nothing provided
  if (!userInput) {
    const promptMsg = options.modify ? t.inputPromptModify : t.inputPrompt;
    console.log(chalk.gray(`📋 ${promptMsg}`));

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

  // Build prompt
  const promptText = options.modify
    ? `请帮我修复以下 SQL:\n\nSQL: ${userInput}\n\n请分析错误原因并给出修复后的 SQL。`
    : `${userInput}\n\nSQL 方言：${dialect}`;

  // Call LLM
  printLoading(t.generating);

  let rawResult: string;
  try {
    const messages = createMessages(config.systemMessage!, promptText);
    rawResult = await callLLM(config, messages);
  } catch (error) {
    printError(error instanceof Error ? error.message : t.failed);
    process.exit(1);
  }

  // Extract SQL and explanation
  const sql = extractSQL(rawResult);
  const explanation = extractExplanation(rawResult);

  console.log('');

  if (sql) {
    // Multi-line SQL: indent every line uniformly
    sql.split('\n').forEach((line) => {
      console.log('  ' + chalk.cyan(line));
    });
  } else {
    // Fallback: show raw output
    console.log(chalk.white(rawResult));
  }

  if (explanation && config.showExplanation !== false) {
    console.log('  ' + chalk.gray(explanation));
  }

  console.log('');

  if (!sql) {
    printSuccess(t.success);
    return;
  }

  // Action menu: copy / edit / cancel  (no execute — SQL needs a DB connection)
  const actionResponse = await prompts({
    type: 'select',
    name: 'action',
    message: t.actionMenu,
    hint: ' ',
    choices: [
      { title: t.actionCopy, value: 'copy' },
      { title: t.actionEdit, value: 'edit' },
      { title: t.actionCancel, value: 'cancel' },
    ],
  });

  const action = actionResponse.action as string | undefined;

  if (!action || action === 'cancel') {
    console.log(chalk.gray(t.cancelled));
    return;
  }

  let finalSQL = sql;

  if (action === 'edit') {
    const editResponse = await prompts({
      type: 'text',
      name: 'sql',
      message: t.editLabel,
      initial: sql,
    });
    finalSQL = editResponse.sql?.trim() || sql;
    if (!finalSQL) {
      console.log(chalk.gray(t.cancelled));
      return;
    }
  }

  clipboard.writeSync(finalSQL);
  printSuccess(t.copied);
}

const program = new Command();

program
  .name('ai-sql')
  .description('AI 驱动的 SQL 查询生成工具 - 根据自然语言描述生成 SQL 查询')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-d, --dialect <type>', 'SQL 方言 (postgresql/mysql/sqlite)', 'postgresql')
  .option('-m, --modify', '修改模式：提供 SQL 和报错信息进行修复')
  .argument('[input...]', '用户输入描述或 SQL')
  .action(async (args: string[]) => {
    let userInput: string | null = null;
    if (!process.stdin.isTTY) {
      userInput = await readStdin();
    } else if (args && args.length > 0) {
      userInput = args.join(' ');
    }
    await run(userInput);
  });

function main(): void {
  program.parse(process.argv);
}

main();
