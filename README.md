# AI Tools

AI 驱动的开发工具 - 报错分析、Shell 生成、SQL 生成

## ✨ 工具列表

| 命令 | 功能 |
|------|------|
| `ai-init` | 初始化配置 |
| `ai-config` | 查看/编辑配置 |
| `ai-error` | 报错分析 |
| `ai-shell` | Shell 命令生成 |
| `ai-sql` | SQL 查询生成 |

## 🚀 安装

```bash
npm install -g @lance2026/ai-tools
```

## 📖 使用方法

### 0. 初始化配置

首次使用前，需要初始化配置：

```bash
# 交互式初始化配置
ai-init
```

按照提示输入：
- API Base URL（默认：阿里云 DashScope）
- API Key
- 默认模型
- 输出语言（中文/English）

### 1. 配置管理

```bash
# 查看配置（API Key 自动脱敏）
ai-config

# 仅显示配置文件路径
ai-config -p

# 使用编辑器打开配置
ai-config -e

# 重置为默认配置
ai-config --reset
```

### 2. 报错分析

```bash
# 交互模式
ai-error

# 直接读取剪贴板
ai-error -y

# 详细解释模式
ai-error -e
```

### 3. Shell 命令生成

```bash
# 交互模式
ai-shell

# 直接传入描述
ai-shell "查找当前目录下所有大于 100M 的文件"

# 生成并执行（需确认）
ai-shell -r

# 修改模式（提供命令和报错）
ai-shell -m "find . -name '*.txt' | 报错信息..."
```

示例：
```bash
$ ai-shell "查找所有大于 100M 的文件"

🐚 AI Shell - 根据描述生成 Shell 命令

⏳ 正在生成命令...

📝 命令：find . -type f -size +100M
📖 说明：使用 find 命令查找当前目录下所有大小超过 100M 的文件

✅ 生成完成
```

### 4. SQL 查询生成

```bash
# 交互模式
ai-sql

# 直接传入描述
ai-sql "查询年龄大于 18 岁的用户"

# 指定 SQL 方言
ai-sql --dialect mysql "查询用户表"

# 修改模式（提供 SQL 和报错）
ai-sql -m "SELECT * FROM users | 报错信息..."
```

示例：
```bash
$ ai-sql "查询订单数大于 10 的用户"

📊 AI SQL - 根据描述生成 SQL 查询
🔧 当前方言：postgresql

⏳ 正在生成 SQL...

📝 SQL: SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id HAVING COUNT(*) > 10 ORDER BY order_count DESC;
📖 说明：使用 GROUP BY 和 HAVING 子句筛选订单数大于 10 的用户

✅ 生成完成
```

## ⚙️ 配置说明

配置文件路径：`~/.config/ai-tools/config.json`

### 配置示例

```json
{
  "_comment": "AI Tools 通用配置文件",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-xxxxx",
  "model": "qwen3.5-flash",
  "language": "zh",

  "_comment": "工具独立配置，覆盖通用配置",
  "errorSolver": {
    "model": "qwen3.5-flash",
    "explainMode": true,
    "systemMessage": "自定义报错分析提示词..."
  },
  "smartShell": {
    "model": "qwen3.5-flash",
    "systemMessage": "自定义 Shell 生成提示词..."
  },
  "smartSql": {
    "model": "qwen3.5-flash",
    "dialect": "postgresql",
    "systemMessage": "自定义 SQL 生成提示词..."
  }
}
```

### 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `baseUrl` | string | API 基础 URL（阿里云 DashScope 或其他 OpenAI 兼容接口） |
| `apiKey` | string | API 密钥 |
| `model` | string | 默认模型 |
| `language` | string | 输出语言：`zh`（中文）或 `en`（English） |
| `errorSolver.model` | string | 错误分析专用模型 |
| `errorSolver.explainMode` | boolean | 是否启用详细解释模式 |
| `errorSolver.systemMessage` | string | 自定义 system 提示词 |
| `smartShell.model` | string | Shell 生成专用模型 |
| `smartShell.systemMessage` | string | 自定义 Shell 生成提示词 |
| `smartSql.model` | string | SQL 生成专用模型 |
| `smartSql.dialect` | string | 默认 SQL 方言（postgresql/mysql/sqlite） |
| `smartSql.systemMessage` | string | 自定义 SQL 生成提示词 |

## 📋 CLI 选项

### ai-init

| 选项 | 简写 | 说明 |
|------|------|------|
| `--force` | `-f` | 覆盖已存在的配置文件 |

### ai-config

| 选项 | 简写 | 说明 |
|------|------|------|
| `--edit` | `-e` | 使用默认编辑器打开配置文件 |
| `--path` | `-p` | 仅显示配置文件路径 |
| `--reset` | | 重置为默认配置 |

### ai-error

| 选项 | 简写 | 说明 |
|------|------|------|
| `--yes` | `-y` | 直接读取剪贴板，不进入交互模式 |
| `--config <path>` | `-c` | 指定配置文件路径 |
| `--explain` | `-e` | 启用详细解释模式 |

### ai-shell

| 选项 | 简写 | 说明 |
|------|------|------|
| `--config <path>` | `-c` | 指定配置文件路径 |
| `--run` | `-r` | 生成后直接执行（需确认） |
| `--modify` | `-m` | 修改模式：提供命令和报错信息进行修复 |
| `[input]` | | 直接输入描述内容（可选） |

### ai-sql

| 选项 | 简写 | 说明 |
|------|------|------|
| `--config <path>` | `-c` | 指定配置文件路径 |
| `--dialect <type>` | `-d` | SQL 方言 (postgresql/mysql/sqlite)，默认 postgresql |
| `--modify` | `-m` | 修改模式：提供 SQL 和报错信息进行修复 |
| `[input]` | | 直接输入描述内容（可选） |

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 本地运行
npm run start

# 开发模式
npm run dev
```

## 📦 发布

```bash
# 登录 npm
npm login

# 发布
npm publish --access public
```

## 📝 计划工具

- [x] ai-init - 初始化配置
- [x] ai-config - 配置管理
- [x] ai-error - 报错分析
- [x] ai-shell - Shell 命令生成
- [x] ai-sql - SQL 查询生成
- [ ] ai-commit - Git 提交信息生成
- [ ] ai-review - 代码审查
- [ ] ai-log - 日志分析

## 📄 许可证

MIT
