// ai-mind command - 苹果三件套 + AI 的命令行大脑

import { Command } from 'commander';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { loadConfig } from '../config';
import { callLLM, createMessages } from '../llm';
import { printLoading, printError, printSuccess } from '../formatter';
import { version } from '../../package.json';
import { getReminders, getCalendarEvents, getNotes, Reminder, CalendarEvent, Note } from '../apple-data';

const TOOL_NAME = 'aiMind';

// 格式化日期为中文或英文
function formatDate(date: Date, lang: string): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', options);
}

// 判断日期是否今天或明天
function getDayLabel(date: Date, lang: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = new Date(date.toDateString());
  const t = new Date(today.toDateString());
  const tm = new Date(tomorrow.toDateString());

  if (d.getTime() === t.getTime()) return lang === 'en' ? 'Today' : '今天';
  if (d.getTime() === tm.getTime()) return lang === 'en' ? 'Tomorrow' : '明天';
  return formatDate(date, lang);
}

async function runToday(): Promise<void> {
  const config = loadConfig(TOOL_NAME);
  const lang = config.language || 'zh';
  const isZh = lang === 'zh';

  console.log('');
  console.log(chalk.bold('🧠 AI Mind - 今日智能总结'));
  console.log('');

  // 读取数据
  printLoading(isZh ? '读取日程、待办、笔记' : 'Reading calendars, reminders, notes');

  const [reminders, events, notes] = await Promise.all([
    getReminders(),
    getCalendarEvents(),
    getNotes(),
  ]);

  // 准备数据给 AI
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = events.filter(
    (e: CalendarEvent) => new Date(e.startDate.toDateString()).getTime() === new Date(today.toDateString()).getTime()
  );
  const tomorrowEvents = events.filter(
    (e: CalendarEvent) => new Date(e.startDate.toDateString()).getTime() === new Date(tomorrow.toDateString()).getTime()
  );

  const overdueReminders = reminders.filter(
    (r: Reminder) => r.dueDate && r.dueDate < today
  );
  const todayReminders = reminders.filter(
    (r: Reminder) => r.dueDate && new Date(r.dueDate.toDateString()).getTime() === new Date(today.toDateString()).getTime()
  );
  const futureReminders = reminders.filter(
    (r: Reminder) => !r.dueDate || (r.dueDate && r.dueDate > today && new Date(r.dueDate.toDateString()).getTime() !== new Date(today.toDateString()).getTime())
  );

  // 构建 prompt
  const systemPrompt = isZh
    ? `你是用户的 AI 助理，帮助用户管理日程、待办和笔记。
你的任务是根据用户提供的日程、待办、笔记，生成一份「今日智能总结」。

输出格式：
📅 今日日程
  - 时间 + 事件名称

⏰ 待办事项
  - 逾期/今日/未来 分类展示

📝 相关笔记
  - 列出可能相关的笔记标题

💡 今日建议
  - 根据日程和待办，给出优先级建议和时间安排`
    : `You are the user's AI assistant, helping manage schedules, reminders, and notes.
Your task is to generate a "Today Summary" based on the provided data.

Output format:
📅 Today's Schedule
⏰ Reminders
📝 Related Notes
💡 Today's Recommendations`;

  const userData = isZh
    ? `今天是：${today.toDateString()}

【今天日程】(${todayEvents.length}个)
${todayEvents.map((e) => `  - ${getDayLabel(e.startDate, lang)} ${e.startDate.getHours()}:${String(e.startDate.getMinutes()).padStart(2, '0')} ${e.title}`).join('\n') || '  无'}

【明天日程】(${tomorrowEvents.length}个)
${tomorrowEvents.map((e) => `  - ${getDayLabel(e.startDate, lang)} ${e.startDate.getHours()}:${String(e.startDate.getMinutes()).padStart(2, '0')} ${e.title}`).join('\n') || '  无'}

【逾期待办】(${overdueReminders.length}个)
${overdueReminders.map((r) => `  - ⚠️ ${r.title} (截止：${formatDate(r.dueDate!, lang)})`).join('\n') || '  无'}

【今日待办】(${todayReminders.length}个)
${todayReminders.map((r) => `  - ${r.title}`).join('\n') || '  无'}

【未来待办】(${futureReminders.length}个)
${futureReminders.map((r) => `  - ${r.title}${r.dueDate ? ` (截止：${formatDate(r.dueDate, lang)})` : ''}`).join('\n') || '  无'}

【笔记】(${notes.length}个)
${notes.slice(0, 10).map((n: Note) => `  - ${n.title}`).join('\n')}${notes.length > 10 ? `\n  ... 还有 ${notes.length - 10} 个` : ''}`
    : `Today: ${today.toDateString()}

【Today's Events】(${todayEvents.length})
${todayEvents.map((e: CalendarEvent) => `  - ${e.title} at ${e.startDate.getHours()}:${String(e.startDate.getMinutes()).padStart(2, '0')}`).join('\n') || '  None'}

【Tomorrow's Events】(${tomorrowEvents.length})
${tomorrowEvents.map((e: CalendarEvent) => `  - ${e.title} at ${e.startDate.getHours()}:${String(e.startDate.getMinutes()).padStart(2, '0')}`).join('\n') || '  None'}

【Overdue Reminders】(${overdueReminders.length})
${overdueReminders.map((r: Reminder) => `  - ⚠️ ${r.title} (due: ${formatDate(r.dueDate!, lang)})`).join('\n') || '  None'}

【Today's Reminders】(${todayReminders.length})
${todayReminders.map((r: Reminder) => `  - ${r.title}`).join('\n') || '  None'}

【Future Reminders】(${futureReminders.length})
${futureReminders.map((r: Reminder) => `  - ${r.title}${r.dueDate ? ` (due: ${formatDate(r.dueDate, lang)})` : ''}`).join('\n') || '  None'}

【Notes】(${notes.length})
${notes.slice(0, 10).map((n: Note) => `  - ${n.title}`).join('\n')}${notes.length > 10 ? `\n  ... and ${notes.length - 10} more` : ''}`;

  // 调用 AI
  printLoading(isZh ? 'AI 正在分析并生成总结' : 'AI is analyzing and generating summary');

  try {
    const messages = createMessages(systemPrompt, userData);
    const result = await callLLM(config, messages);

    console.log('');
    console.log(chalk.cyan(result));
    console.log('');

    // 询问是否复制
    const prompts = require('prompts');
    const response = await prompts({
      type: 'select',
      name: 'action',
      message: isZh ? '选择操作' : 'Choose action',
      choices: [
        { title: '📋 复制到剪贴板', value: 'copy' },
        { title: '✖  取消', value: 'cancel' },
      ],
    });

    if (response.action === 'copy') {
      clipboard.writeSync(result);
      printSuccess(isZh ? '已复制到剪贴板' : 'Copied to clipboard');
    }

    console.log('');
  } catch (error) {
    printError(error instanceof Error ? error.message : (isZh ? '生成失败' : 'Generation failed'));
    process.exit(1);
  }
}

const program = new Command();

program
  .name('ai-mind')
  .description('苹果三件套 + AI 的命令行大脑 - 管理日程、待办、笔记')
  .version(version)
  .option('-c, --config <path>', '指定配置文件路径')
  .argument('[command]', '子命令：today', 'today')
  .action(async (cmd: string) => {
    if (cmd === 'today') {
      await runToday();
    } else {
      console.log('');
      console.log(chalk.yellow('未知命令:'), cmd);
      console.log('');
      console.log('可用命令:');
      console.log('  ai-mind today    ' + chalk.gray('- 今日智能总结'));
      console.log('');
      program.outputHelp();
    }
  });

function main(): void {
  program.parse(process.argv);
}

main();
