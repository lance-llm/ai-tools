// ai-config 命令实现 - 查看/编辑配置

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import prompts from 'prompts';
import chalk from 'chalk';
import { exec } from 'child_process';

const CONFIG_PATH = path.join(os.homedir(), '.config', 'ai-tools', 'config.json');

const program = new Command();

program
  .name('ai-config')
  .description('查看或编辑 AI Tools 配置')
  .version('1.0.0')
  .option('-e, --edit', '使用默认编辑器打开配置文件')
  .option('-p, --path', '仅显示配置文件路径')
  .option('--reset', '重置为默认配置（危险操作）')
  .parse(process.argv);

const options = program.opts();

function printSuccess(message: string) {
  console.log(chalk.green('✅ ') + message);
}

function printError(message: string) {
  console.error(chalk.red('❌ ') + message);
}

function printInfo(message: string) {
  console.log(chalk.blue('ℹ️  ') + message);
}

function printWarning(message: string) {
  console.log(chalk.yellow('⚠️  ') + message);
}

function showConfigPath() {
  console.log(CONFIG_PATH);
}

function showConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    printWarning('配置文件不存在，运行 "ai-init" 进行初始化');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);

    console.log('');
    console.log(chalk.green.bold('📄 配置文件：') + chalk.gray(CONFIG_PATH));
    console.log('');

    // 隐藏 API Key 显示
    const displayConfig = { ...config };
    if (displayConfig.apiKey) {
      displayConfig.apiKey = displayConfig.apiKey.replace(/^(sk-\w{4})\w+(.{4})$/, '$1...$2');
    }

    console.log(chalk.cyan(JSON.stringify(displayConfig, null, 2)));
    console.log('');

    console.log('操作选项:');
    console.log('  ' + chalk.cyan('ai-config -e') + '     - 用编辑器打开');
    console.log('  ' + chalk.cyan('ai-config --reset') + ' - 重置配置');
    console.log('');
  } catch (error) {
    printError(`读取配置失败：${error instanceof Error ? error.message : '未知错误'}`);
    process.exit(1);
  }
}

function editConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    printWarning('配置文件不存在，运行 "ai-init" 进行初始化');
    process.exit(1);
  }

  const editor = process.env.EDITOR || 'vi';
  console.log(`使用编辑器打开：${editor}`);

  exec(`${editor} "${CONFIG_PATH}"`, (error) => {
    if (error) {
      printError(`打开编辑器失败：${error.message}`);
      console.log(chalk.gray(`手动编辑：${CONFIG_PATH}`));
      return;
    }
    printSuccess('配置已保存');
  });
}

function resetConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    printWarning('配置文件不存在');
    process.exit(1);
  }

  console.log('');
  console.log(chalk.red.bold('⚠️  警告：此操作将覆盖现有配置！'));
  console.log('');

  prompts({
    type: 'confirm',
    name: 'confirmed',
    message: '确定要重置配置吗？',
    initial: false,
  }).then((response) => {
    if (!response.confirmed) {
      printInfo('已取消操作');
      process.exit(0);
    }

    const defaultConfig = {
      _comment: 'AI Tools 通用配置文件',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: 'sk-xxxxx',
      model: 'qwen3.5-flash',
      language: 'zh',
      errorSolver: {
        model: 'qwen3.5-flash',
        explainMode: true,
      },
      smartShell: {
        model: 'qwen3.5-flash',
      },
      smartSql: {
        model: 'qwen3.5-flash',
        dialect: 'postgresql',
      },
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    printSuccess('配置已重置，请运行 "ai-init" 设置 API Key');
  });
}

async function main() {
  if (options.path) {
    showConfigPath();
    return;
  }

  if (options.edit) {
    editConfig();
    return;
  }

  if (options.reset) {
    resetConfig();
    return;
  }

  // 默认显示配置
  showConfig();
}

main().catch((error) => {
  printError(error instanceof Error ? error.message : '操作失败');
  process.exit(1);
});
