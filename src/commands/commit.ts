// ai-commit command implementation

import { Command } from 'commander';
import { execFileSync, execSync } from 'child_process';
import prompts from 'prompts';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { loadConfig, getLanguage } from '../config';
import { callLLM, createMessages } from '../llm';
import { printLoading, printError, printSuccess } from '../formatter';
import { version } from '../../package.json';

const TOOL_NAME = 'aiCommit';
// Truncate diff to avoid exceeding LLM token limits
const MAX_DIFF_LENGTH = 8000;

// I18N text
const I18N = {
  zh: {
    title: '📝 AI Commit - 根据改动生成 commit message',
    notGitRepo: '当前目录不是 git 仓库',
    nothingToCommit: '没有任何改动',
    noStagedChanges: '暂无暂存的改动，以下文件有变更：',
    stageAllPrompt: '是否暂存所有改动？(git add -A)',
    stageFailed: 'git add 失败',
    generating: '正在分析改动并生成 commit message',
    actionMenu: '选择操作',
    actionCommit: '✅ 直接提交',
    actionEdit: '✏️  编辑后提交',
    actionCopy: '📋 复制到剪贴板',
    actionCancel: '✖  取消',
    editLabel: '编辑 commit message',
    copied: '已复制到剪贴板',
    cancelled: '已取消',
    committed: '提交成功',
    commitFailed: '提交失败',
    failed: '生成失败',
    diffTruncated: '（diff 过长，已截断）',
  },
  en: {
    title: '📝 AI Commit - Generate commit message from changes',
    notGitRepo: 'Not a git repository',
    nothingToCommit: 'Nothing to commit',
    noStagedChanges: 'No staged changes. Files with changes:',
    stageAllPrompt: 'Stage all changes? (git add -A)',
    stageFailed: 'git add failed',
    generating: 'Analyzing changes and generating commit message',
    actionMenu: 'Choose action',
    actionCommit: '✅ Commit directly',
    actionEdit: '✏️  Edit then commit',
    actionCopy: '📋 Copy to clipboard',
    actionCancel: '✖  Cancel',
    editLabel: 'Edit commit message',
    copied: 'Copied to clipboard',
    cancelled: 'Cancelled',
    committed: 'Committed successfully',
    commitFailed: 'Commit failed',
    failed: 'Generation failed',
    diffTruncated: '(diff truncated — too large)',
  },
};

// Run a git command and return stdout; returns '' on failure
function git(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

// Return true when the cwd is inside a git repository
function isGitRepo(): boolean {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Return true when there are staged changes ready to commit
function hasStagedChanges(): boolean {
  return git(['diff', '--cached', '--name-only']) !== '';
}

// Commit message parsed from LLM response
interface CommitMessage {
  subject: string;
  body: string | null;
}

// Extract commit message from LLM response
function extractCommitMessage(response: string): CommitMessage | null {
  const subjectMatch = response.match(/📝\s*commit[:：]\s*(.+)/);
  if (!subjectMatch) return null;

  const subject = subjectMatch[1].trim().replace(/^`+|`+$/g, '');

  const bodyMatch = response.match(/📖\s*(?:说明|Body|Explanation)[:：]\s*([\s\S]+?)(?=\n\n|$)/);
  const body = bodyMatch
    ? bodyMatch[1]
        .trim()
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
    : null;

  return { subject, body };
}

async function run(): Promise<void> {
  const options = program.opts();
  const config = loadConfig(TOOL_NAME, options.config);
  const language = getLanguage(config);
  const t = I18N[language as keyof typeof I18N] || I18N.zh;

  console.log('');
  console.log(chalk.bold(t.title));
  console.log('');

  if (!isGitRepo()) {
    printError(t.notGitRepo);
    process.exit(1);
  }

  // --all: stage everything before proceeding
  if (options.all) {
    try {
      execFileSync('git', ['add', '-A'], { stdio: 'ignore' });
    } catch {
      printError(t.stageFailed);
      process.exit(1);
    }
  }

  // If nothing staged, show unstaged files and ask whether to stage all
  if (!hasStagedChanges()) {
    const status = git(['status', '--short']);
    if (!status) {
      printError(t.nothingToCommit);
      process.exit(0);
    }

    console.log(chalk.gray(t.noStagedChanges));
    console.log('');
    status.split('\n').forEach((line) => console.log('  ' + chalk.yellow(line)));
    console.log('');

    const confirm = await prompts({
      type: 'confirm',
      name: 'stageAll',
      message: t.stageAllPrompt,
      initial: true,
    });

    if (!confirm.stageAll) {
      console.log(chalk.gray(t.cancelled));
      return;
    }

    try {
      execFileSync('git', ['add', '-A'], { stdio: 'ignore' });
    } catch {
      printError(t.stageFailed);
      process.exit(1);
    }
  }

  // Show staged file summary
  const stat = git(['diff', '--cached', '--stat']);
  if (stat) {
    stat.split('\n').forEach((line) => console.log(chalk.gray('  ' + line)));
    console.log('');
  }

  // Get full diff for LLM
  let diff = git(['diff', '--cached']);
  if (!diff) {
    printError(t.nothingToCommit);
    process.exit(0);
  }

  let truncated = false;
  if (diff.length > MAX_DIFF_LENGTH) {
    diff = diff.slice(0, MAX_DIFF_LENGTH);
    truncated = true;
  }

  if (truncated) {
    console.log(chalk.gray(`  ${t.diffTruncated}`));
    console.log('');
  }

  // Call LLM
  printLoading(t.generating);

  let rawResult: string;
  try {
    const messages = createMessages(config.systemMessage!, diff);
    rawResult = await callLLM(config, messages);
  } catch (error) {
    printError(error instanceof Error ? error.message : t.failed);
    process.exit(1);
  }

  // Parse and display result
  const commitMsg = extractCommitMessage(rawResult);

  console.log('');

  if (!commitMsg) {
    // Fallback: show raw output so user can copy manually
    console.log(chalk.white(rawResult));
    return;
  }

  console.log('  ' + chalk.green.bold(commitMsg.subject));

  if (commitMsg.body && config.showExplanation !== false) {
    console.log('');
    commitMsg.body.split('\n').forEach((line) => {
      console.log('  ' + chalk.gray(line));
    });
  }

  console.log('');

  // Action menu
  const actionResponse = await prompts({
    type: 'select',
    name: 'action',
    message: t.actionMenu,
    hint: ' ',
    choices: [
      { title: t.actionCommit, value: 'commit' },
      { title: t.actionEdit, value: 'edit' },
      { title: t.actionCopy, value: 'copy' },
      { title: t.actionCancel, value: 'cancel' },
    ],
  });

  const action = actionResponse.action as string | undefined;

  if (!action || action === 'cancel') {
    console.log(chalk.gray(t.cancelled));
    return;
  }

  if (action === 'copy') {
    clipboard.writeSync(commitMsg.subject);
    printSuccess(t.copied);
    return;
  }

  let finalSubject = commitMsg.subject;

  if (action === 'edit') {
    const editResponse = await prompts({
      type: 'text',
      name: 'message',
      message: t.editLabel,
      initial: commitMsg.subject,
    });
    finalSubject = editResponse.message?.trim() || commitMsg.subject;
    if (!finalSubject) {
      console.log(chalk.gray(t.cancelled));
      return;
    }
  }

  // Include body when showExplanation is not disabled
  const fullMessage =
    commitMsg.body && config.showExplanation !== false
      ? `${finalSubject}\n\n${commitMsg.body}`
      : finalSubject;

  // Execute git commit
  try {
    execSync(`git commit -m ${JSON.stringify(fullMessage)}`, { stdio: 'inherit' });
    console.log('');
    printSuccess(t.committed);
  } catch {
    printError(t.commitFailed);
    process.exit(1);
  }
}

const program = new Command();

program
  .name('ai-commit')
  .description('AI 驱动的 commit message 生成工具 - 分析 git 改动，自动生成 commit message')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .option('-a, --all', '提交前自动暂存所有改动 (git add -A)')
  .action(async () => {
    await run();
  });

function main(): void {
  program.parse(process.argv);
}

main();
