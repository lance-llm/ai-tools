// ai-init 命令实现 - 初始化配置文件

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import prompts from 'prompts';
import chalk from 'chalk';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ai-tools');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const program = new Command();

program
  .name('ai-init')
  .description('初始化 AI Tools 配置文件')
  .version('1.0.0')
  .option('-f, --force', '覆盖已存在的配置文件')
  .parse(process.argv);

const options = program.opts();

function printWelcome() {
  console.log('');
  console.log(chalk.green.bold('🤖 AI Tools - 初始化向导'));
  console.log(chalk.gray('配置文件路径：') + chalk.cyan(CONFIG_PATH));
  console.log('');
}

function printSuccess(message: string) {
  console.log(chalk.green('✅ ') + message);
}

function printError(message: string) {
  console.error(chalk.red('❌ ') + message);
}

function printInfo(message: string) {
  console.log(chalk.blue('ℹ️  ') + message);
}

async function main() {
  printWelcome();

  // 检查配置文件是否已存在
  if (fs.existsSync(CONFIG_PATH) && !options.force) {
    console.log(chalk.yellow('⚠️  配置文件已存在!'));
    console.log('');

    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: '是否覆盖现有配置？',
      initial: false,
    });

    if (!response.overwrite) {
      printInfo('已取消操作');
      process.exit(0);
    }
  }

  // 确保配置目录存在
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    printSuccess(`配置目录已创建：${CONFIG_DIR}`);
  }

  // 交互式输入配置
  console.log('');
  console.log('请输入配置信息：');
  console.log('(直接回车使用默认值)');
  console.log('');

  const response = await prompts([
    {
      type: 'text',
      name: 'baseUrl',
      message: 'API Base URL:',
      initial: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key:',
      validate: (value: string) => value.length > 0 || 'API Key 不能为空',
    },
    {
      type: 'text',
      name: 'model',
      message: '默认模型:',
      initial: 'qwen3.5-flash',
    },
    {
      type: 'select',
      name: 'language',
      message: '输出语言:',
      initial: 0,
      choices: [
        { title: '中文', value: 'zh' },
        { title: 'English', value: 'en' },
      ],
    },
  ]);

  if (!response.apiKey) {
    printError('API Key 不能为空');
    process.exit(1);
  }

  // 构建配置对象
  const config = {
    _comment: 'AI Tools 通用配置文件',
    _docs: 'https://github.com/lance2026/ai-tools',
    baseUrl: response.baseUrl,
    apiKey: response.apiKey,
    model: response.model,
    language: response.language || 'zh',
    errorSolver: {
      model: response.model,
      explainMode: true,
    },
    smartShell: {
      model: response.model,
      // systemMessage: '自定义提示词...',
    },
    smartSql: {
      model: response.model,
      dialect: 'postgresql',
      // systemMessage: '自定义提示词...',
    },
  };

  // 写入配置文件
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  console.log('');
  printSuccess('配置文件已创建！');
  console.log('');
  console.log('可用命令:');
  console.log('  ' + chalk.cyan('ai-error') + '        - 报错分析');
  console.log('  ' + chalk.cyan('ai-shell') + '        - Shell 命令生成');
  console.log('  ' + chalk.cyan('ai-sql') + '          - SQL 查询生成');
  console.log('  ' + chalk.cyan('ai-config') + '       - 查看/编辑配置');
  console.log('');
}

main().catch((error) => {
  printError(error instanceof Error ? error.message : '初始化失败');
  process.exit(1);
});
