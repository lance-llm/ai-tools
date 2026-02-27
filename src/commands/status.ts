// ai-status command - show a concise overview of the current configuration

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { version } from '../../package.json';

const CONFIG_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'config.json');

// Tools and their display names / relevant extra fields
const TOOLS: { key: string; name: string; extras: string[] }[] = [
  { key: 'errorSolver', name: 'ai-error',  extras: ['showExplanation'] },
  { key: 'smartShell',  name: 'ai-shell',  extras: ['showExplanation'] },
  { key: 'smartSql',    name: 'ai-sql',    extras: ['showExplanation', 'dialect'] },
  { key: 'aiCommit',    name: 'ai-commit', extras: ['showExplanation'] },
];

// Mask API key: show first 6 and last 4 chars
function maskKey(key: string): string {
  if (key.length <= 10) return '••••••••';
  return key.slice(0, 6) + '••••' + key.slice(-4);
}

// Right-pad a string for alignment
function pad(s: string, len: number): string {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

function main(): void {
  const program = new Command();

  program
    .name('ai-status')
    .description('查看 AI Tools 当前配置摘要')
    .version(version)
    .parse(process.argv);

  console.log('');
  console.log(chalk.bold('AI Tools') + chalk.gray(`  v${version}`));
  console.log('');

  // ── Config file ──────────────────────────────────
  const configExists = fs.existsSync(CONFIG_PATH);

  if (!configExists) {
    console.log(
      chalk.gray(pad('config', 10)) +
      chalk.cyan(CONFIG_PATH) + '  ' + chalk.red('✗ 未找到，运行 ai-init 初始化')
    );
    console.log('');
    return;
  }

  // ── Parse config ─────────────────────────────────
  let raw: Record<string, any> = {};
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8').trim();
    if (!content) {
      console.log(
        chalk.gray(pad('config', 10)) +
        chalk.cyan(CONFIG_PATH) + '  ' + chalk.yellow('⚠ 配置为空，运行 ai-init 初始化')
      );
      console.log('');
      return;
    }
    raw = JSON.parse(content);
  } catch {
    console.log(
      chalk.gray(pad('config', 10)) +
      chalk.cyan(CONFIG_PATH) + '  ' + chalk.red('✗ 解析失败，请检查 JSON 格式')
    );
    console.log('');
    return;
  }

  console.log(
    chalk.gray(pad('config', 10)) +
    chalk.cyan(CONFIG_PATH) + '  ' + chalk.green('✓')
  );

  // ── Common fields ─────────────────────────────────
  const apiKey: string = raw.apiKey || '';
  const apiKeyDisplay = apiKey
    ? maskKey(apiKey) + '  ' + chalk.green('✓')
    : chalk.red('未配置');

  const rows: [string, string][] = [
    ['api key',   apiKeyDisplay],
    ['endpoint',  raw.baseUrl  || chalk.gray('(default)')],
    ['model',     raw.model    || chalk.gray('(default)')],
    ['language',  raw.language || chalk.gray('(default)')],
  ];

  if (raw.showExplanation !== undefined) {
    rows.push(['explain', String(raw.showExplanation)]);
  }

  for (const [label, value] of rows) {
    console.log(chalk.gray(pad(label, 10)) + value);
  }

  // ── Per-tool overrides ────────────────────────────
  const configuredTools = TOOLS.filter(({ key }) => raw[key]);

  if (configuredTools.length > 0) {
    console.log('');
    console.log(chalk.gray('tools'));

    for (const { key, name, extras } of configuredTools) {
      const toolCfg: Record<string, any> = raw[key];
      const toolModel: string = toolCfg.model || raw.model || '';

      const extraParts: string[] = [];
      for (const field of extras) {
        if (toolCfg[field] !== undefined) {
          extraParts.push(`${field}: ${toolCfg[field]}`);
        }
      }
      if (toolCfg.dialect) {
        // only add dialect if not already in extras list above
        if (!extras.includes('dialect')) {
          extraParts.push(`dialect: ${toolCfg.dialect}`);
        } else if (!extraParts.some(p => p.startsWith('dialect'))) {
          extraParts.push(`dialect: ${toolCfg.dialect}`);
        }
      }

      const extraStr = extraParts.length > 0
        ? chalk.gray('  ' + extraParts.join('  '))
        : '';

      console.log(
        '  ' + chalk.cyan(pad(name, 12)) + chalk.white(toolModel) + extraStr
      );
    }
  }

  console.log('');
  console.log(chalk.gray('ai-config -e') + chalk.gray('  to edit  ') + chalk.gray('ai-config --reset') + chalk.gray('  to reset'));
  console.log('');
}

main();
