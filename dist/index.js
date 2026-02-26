"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = require("../package.json");
const error_solve_1 = __importDefault(require("./commands/error-solve"));
const smart_shell_1 = __importDefault(require("./commands/smart-shell"));
const smart_sql_1 = __importDefault(require("./commands/smart-sql"));
const program = new commander_1.Command();
program
    .name('ai-tools')
    .description(package_json_1.description)
    .version(package_json_1.version);
program.command('error-solve')
    .alias('es')
    .description('AI 驱动的报错分析工具')
    .option('-y, --yes', '直接读取剪贴板，不交互')
    .option('-c, --config <path>', '指定配置文件路径')
    .option('-e, --explain', '启用详细解释模式')
    .action((options) => (0, error_solve_1.default)(options));
program.command('smart-shell')
    .alias('shell')
    .description('根据自然语言生成 Shell 命令')
    .option('-c, --config <path>', '指定配置文件路径')
    .option('-r, --run', '直接执行生成的命令')
    .action((options) => (0, smart_shell_1.default)(options));
program.command('smart-sql')
    .alias('sql')
    .description('根据自然语言生成 SQL 查询')
    .option('-c, --config <path>', '指定配置文件路径')
    .option('--dialect <type>', 'SQL 方言 (mysql/postgresql/sqlite)', 'mysql')
    .action((options) => (0, smart_sql_1.default)(options));
program.parse(process.argv);
//# sourceMappingURL=index.js.map