// smart-shell command implementation

import { Command } from 'commander';
import prompts from 'prompts';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { loadConfig, getLanguage } from '../config';
import { callLLM, createMessages } from '../llm';
import { printLoading, printError, printSuccess } from '../formatter';
import { version } from '../../package.json';

const TOOL_NAME = 'smartShell';
const HISTORY_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'shell-history.json');
const MAX_HISTORY = 50;

// Dangerous command patterns that require extra confirmation
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)/i, label: 'rm -rf (递归强制删除)' },
  { pattern: /\bsudo\b/, label: 'sudo (超级用户权限)' },
  { pattern: /chmod\s+[0-7]*7[0-7][0-7]/, label: 'chmod 777 (危险权限)' },
  { pattern: /\bdd\b.*\bif=/, label: 'dd (磁盘写入)' },
  { pattern: /\bmkfs\b/, label: 'mkfs (格式化文件系统)' },
  { pattern: />[\s]*\/(etc|usr|bin|sbin|var|boot)\//, label: '写入系统目录' },
];

interface HistoryEntry {
  timestamp: string;
  description: string;
  command: string;
  executed: boolean;
}

// I18N text
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

// Read all data from stdin (for pipe support)
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

// Strip surrounding backticks that LLMs sometimes add around commands
function stripBackticks(s: string): string {
  return s.replace(/^`+|`+$/g, '').trim();
}

// Extract shell command from LLM response
function extractCommand(response: string): string | null {
  // Match "📝 命令: xxx" or "📝 Command: xxx"
  const cmdMatch = response.match(/📝\s*(?:命令|Command)[:：]\s*(.+)/);
  if (cmdMatch) return stripBackticks(cmdMatch[1].trim());

  // Match fenced code blocks
  const codeMatch = response.match(/```(?:bash|sh|shell)?\n?([\s\S]+?)\n?```/);
  if (codeMatch) return codeMatch[1].trim();

  // Match "✅ 修复: xxx" or "✅ Fix: xxx"
  const fixMatch = response.match(/✅\s*(?:修复|Fix)[:：]\s*(.+)/);
  if (fixMatch) return stripBackticks(fixMatch[1].trim());

  return null;
}

// Extract and clean explanation from LLM response
function extractExplanation(response: string): string | null {
  const explMatch = response.match(/📖\s*(?:说明|Explanation)[:：]\s*(.+)/);
  if (!explMatch) return null;
  // Strip markdown artifacts: leading bullets and inline backticks
  return explMatch[1]
    .trim()
    .replace(/^\*\s+/, '')
    .replace(/`([^`]+)`/g, '$1');
}

// Detect dangerous patterns in a command
function detectDangerous(command: string): string[] {
  return DANGEROUS_PATTERNS
    .filter(({ pattern }) => pattern.test(command))
    .map(({ label }) => label);
}

// Execute a command and capture full output, timing, and exit code
async function executeCommand(command: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}> {
  return new Promise((resolve) => {
    const start = Date.now();
    exec(command, (error, stdout, stderr) => {
      const duration = Date.now() - start;
      const exitCode = error ? (error.code ?? 1) : 0;
      resolve({ stdout, stderr, exitCode, duration });
    });
  });
}

// History helpers
function loadHistory(): HistoryEntry[] {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')) as HistoryEntry[];
    }
  } catch {
    // ignore corrupt history
  }
  return [];
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2));
  } catch {
    // ignore write errors silently
  }
}

function addHistory(description: string, command: string, executed: boolean): void {
  const entries = loadHistory();
  entries.unshift({ timestamp: new Date().toISOString(), description, command, executed });
  if (entries.length > MAX_HISTORY) entries.splice(MAX_HISTORY);
  saveHistory(entries);
}

function showHistory(): void {
  const t = I18N.zh;
  const entries = loadHistory();

  console.log('');
  console.log(chalk.bold(t.historyTitle));
  console.log('');

  if (entries.length === 0) {
    console.log(chalk.gray(t.historyEmpty));
    console.log('');
    return;
  }

  entries.forEach((entry, index) => {
    const d = new Date(entry.timestamp);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const execIcon = entry.executed ? chalk.green('✓') : chalk.gray('○');
    console.log(`${chalk.gray(String(index + 1).padStart(2))}. ${execIcon} ${chalk.gray(dateStr)}  ${chalk.cyan(entry.command)}`);
    console.log(`    ${chalk.gray(entry.description)}`);
    console.log('');
  });
}

async function run(userInput: string | null): Promise<void> {
  const options = program.opts();
  const config = loadConfig(TOOL_NAME, options.config);
  const language = getLanguage(config);
  const t = I18N[language as keyof typeof I18N] || I18N.zh;

  console.log('');
  console.log(chalk.bold(t.title));
  console.log('');

  // Interactive mode when no input provided
  if (!userInput) {
    console.log(chalk.gray(`📋 ${t.inputPrompt}`));
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

  // Call LLM
  printLoading(t.generating);

  let rawResult: string;
  try {
    const messages = createMessages(config.systemMessage!, userInput);
    rawResult = await callLLM(config, messages);
  } catch (error) {
    printError(error instanceof Error ? error.message : t.failed);
    process.exit(1);
  }

  // Display generated command
  const command = extractCommand(rawResult);
  const explanation = extractExplanation(rawResult);

  console.log('');

  if (command) {
    console.log('  ' + chalk.gray('$') + ' ' + chalk.cyan.bold(command));
  } else {
    // Fallback: raw LLM output
    console.log(chalk.white(rawResult));
  }

  if (explanation && config.showExplanation !== false) {
    console.log('  ' + chalk.gray(explanation));
  }

  console.log('');

  if (!command) {
    printSuccess(t.success);
    return;
  }

  // Action menu: run / copy / edit / cancel
  const actionResponse = await prompts({
    type: 'select',
    name: 'action',
    message: t.actionMenu,
    hint: ' ',  // suppress the default English hint
    choices: [
      { title: t.actionRun, value: 'run' },
      { title: t.actionCopy, value: 'copy' },
      { title: t.actionEdit, value: 'edit' },
      { title: t.actionCancel, value: 'cancel' },
    ],
  });

  const action = actionResponse.action as string | undefined;

  // Ctrl+C or explicit cancel
  if (!action || action === 'cancel') {
    console.log(chalk.gray(t.cancelled));
    addHistory(userInput, command, false);
    return;
  }

  if (action === 'copy') {
    clipboard.writeSync(command);
    printSuccess(t.copied);
    addHistory(userInput, command, false);
    return;
  }

  // Determine final command (may be edited by user)
  let finalCommand = command;
  if (action === 'edit') {
    const editResponse = await prompts({
      type: 'text',
      name: 'command',
      message: t.editLabel,
      initial: command,
    });
    finalCommand = editResponse.command?.trim() || command;
    if (!finalCommand) {
      console.log(chalk.gray(t.cancelled));
      return;
    }
  }

  // Danger detection — require explicit "yes" before proceeding
  const dangers = detectDangerous(finalCommand);
  if (dangers.length > 0) {
    console.log('');
    console.log(chalk.yellow.bold(t.dangerWarning));
    dangers.forEach((d) => console.log(chalk.yellow(`  • ${d}`)));
    console.log('  ' + chalk.gray(finalCommand));
    console.log('');
    console.log(chalk.yellow(t.dangerConfirmHint));

    const confirmResponse = await prompts({
      type: 'text',
      name: 'confirm',
      message: t.dangerConfirmLabel,
    });

    if (confirmResponse.confirm?.trim().toLowerCase() !== 'yes') {
      console.log(chalk.gray(t.dangerCancelled));
      addHistory(userInput, finalCommand, false);
      return;
    }
  }

  // Execute and display output
  console.log('');
  console.log(chalk.yellow(t.executing));
  console.log('');

  const result = await executeCommand(finalCommand);

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(chalk.red(result.stderr));

  console.log('');
  const duration = (result.duration / 1000).toFixed(1);

  if (result.exitCode === 0) {
    console.log(
      chalk.green(`✅ ${t.execDone}`) +
      chalk.gray(`（耗时 ${duration}s）  退出码: ${result.exitCode}`)
    );
  } else {
    console.log(
      chalk.red(`❌ ${t.execFailed}`) +
      chalk.gray(`（耗时 ${duration}s）  退出码: ${result.exitCode}`)
    );
    console.log('');
    console.log(chalk.gray(t.execErrorHint));
  }

  addHistory(userInput, finalCommand, true);
}

const program = new Command();

program
  .name('ai-shell')
  .description('AI 驱动的 Shell 命令生成工具 - 根据自然语言描述生成 Shell 命令')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .option('--history', '查看命令历史')
  .argument('[input...]', '用户输入描述或命令')
  .action(async (args: string[]) => {
    const options = program.opts();

    if (options.history) {
      showHistory();
      return;
    }

    // Support piped stdin input
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
