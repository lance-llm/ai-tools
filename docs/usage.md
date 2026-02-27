# AI Tools 使用指南

## 目录

- [ai-error](#ai-error) - 报错分析
- [ai-shell](#ai-shell) - Shell 命令生成
- [ai-sql](#ai-sql) - SQL 查询生成
- [ai-commit](#ai-commit) - Git Commit 信息
- [ai-tr](#ai-tr) - 双语翻译
- [配置说明](#配置说明)

---

## ai-error

报错分析工具 - 粘贴报错信息，AI 自动分析原因并给出修复方案

### 基本用法

```bash
ai-error                  # 交互输入报错信息
ai-error -y               # 直接从剪贴板读取
ai-error -e               # 启用详细解释模式
```

### 选项

| 选项 | 说明 |
|------|------|
| `-y, --yes` | 直接读取剪贴板，不交互 |
| `-e, --explain` | 启用详细解释模式 |
| `-c, --config <path>` | 指定配置文件路径 |

### 输出示例

```
❌ 错误：Node.js 版本不兼容，需要 >= 18
✅ 修复：nvm install 18 && nvm use 18
💡 提示：在 .nvmrc 中固定版本避免重复切换
```

### 配置

```json
{
  "errorSolver": {
    "model": "qwen-plus",
    "showExplanation": true
  }
}
```

---

## ai-shell

Shell 命令生成工具 - 根据自然语言描述生成 Shell 命令

### 基本用法

```bash
ai-shell                                  # 交互输入
ai-shell "查找所有大于 100M 的文件"          # 命令行参数
echo "列出最大的 5 个文件" | ai-shell       # 管道输入
ai-shell --history                        # 查看命令历史
```

### 选项

| 选项 | 说明 |
|------|------|
| `--history` | 查看命令历史（最近 50 条） |
| `-c, --config <path>` | 指定配置文件路径 |

### 操作菜单

生成命令后可选择：
- ⚡ **直接执行** - 运行命令
- 📋 **复制到剪贴板** - 复制命令
- ✏️ **编辑后执行** - 修改后运行
- ✖ **取消** - 退出

### 危险命令检测

以下命令需要输入 `yes` 确认：
- `rm -rf` (递归强制删除)
- `sudo` (超级用户权限)
- `chmod 777` (危险权限)
- `dd` (磁盘写入)
- `mkfs` (格式化)
- 写入系统目录

### 命令历史

历史保存在 `~/.config/ai-tools/shell-history.json`

```
 1. ✓ 12/15 14:30  $ find . -size +100M -ls
    查找大于 100MB 的文件
```

### 配置

```json
{
  "smartShell": {
    "model": "qwen3.5-flash",
    "showExplanation": true
  }
}
```

---

## ai-sql

SQL 查询生成工具 - 根据自然语言生成 SQL

### 基本用法

```bash
ai-sql                                         # 交互输入
ai-sql "查询上月活跃用户"                        # 命令行参数
ai-sql --dialect mysql "月活用户数"              # 指定方言
ai-sql --modify "SELECT * FORM users | 报错"    # 修复 SQL
echo "统计订单数" | ai-sql                      # 管道输入
```

### 选项

| 选项 | 说明 |
|------|------|
| `-d, --dialect <type>` | SQL 方言：postgresql/mysql/sqlite (默认 postgresql) |
| `-m, --modify` | 修改模式：提供 SQL 和报错信息 |
| `-c, --config <path>` | 指定配置文件路径 |

### 输出示例

```sql
SELECT user_id, COUNT(*) AS order_count
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY order_count DESC;
按用户分组并筛选订单数超过 10 条的记录
```

### 操作菜单

- 📋 **复制到剪贴板**
- ✏️ **编辑后复制**
- ✖ **取消**

### 配置

```json
{
  "smartSql": {
    "model": "qwen3.5-flash",
    "dialect": "postgresql",
    "showExplanation": true
  }
}
```

---

## ai-commit

Git Commit 信息生成工具 - 分析 git diff 生成规范的 Commit Message

### 基本用法

```bash
ai-commit        # 使用已暂存的改动
ai-commit -a     # 先执行 git add -A，再生成
```

### 选项

| 选项 | 说明 |
|------|------|
| `-a, --all` | 自动暂存所有改动 |
| `-c, --config <path>` | 指定配置文件路径 |

### 输出格式

使用 [约定式提交](https://www.conventionalcommits.org/) 规范：

```
feat(sql): 重构 smart-sql 命令

- 移除代码围栏标记
- 添加操作菜单
- 优化解释输出
```

### Commit 类型

- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试
- `chore` - 构建/工具
- `ci` - CI 配置

### 操作菜单

- ✅ **直接提交** - git commit
- ✏️ **编辑后提交** - 修改后 commit
- 📋 **复制到剪贴板**
- ✖ **取消**

### 配置

```json
{
  "aiCommit": {
    "model": "qwen3.5-flash",
    "showExplanation": true,
    "maxDiffLength": 40000
  }
}
```

`maxDiffLength` - git diff 最大字符数，默认 40000

---

## ai-tr

双语翻译工具 - 自动检测语言并在两种语言间互译

### 基本用法

```bash
ai-tr "hello world"              # 翻译为中文
ai-tr "你好世界"                  # 翻译为英文
ai-tr --langs zh,ja "你好"        # 中日互译
ai-tr --set-langs zh,en          # 保存配置
echo "hello" | ai-tr             # 管道输入
cat file.txt | ai-tr             # 多行翻译
```

### 选项

| 选项 | 说明 |
|------|------|
| `-l, --langs <pair>` | 设置语言对，如 "zh,en" |
| `--set-langs <pair>` | 保存语言对到配置 |
| `-c, --config <path>` | 指定配置文件路径 |

### 支持的语言

| 代码 | 语言 | 代码 | 语言 |
|------|------|------|------|
| zh | 中文 | fr | 法语 |
| en | 英语 | de | 德语 |
| ja | 日语 | es | 西班牙语 |
| ko | 韩语 | it | 意大利语 |
| ru | 俄语 | pt | 葡萄牙语 |

### 输出示例

```
⏳ 正在翻译...

你好世界

✅ 已复制到剪贴板
```

### 配置

```json
{
  "aiTr": {
    "model": "qwen3.5-flash",
    "languages": ["zh", "en"]
  }
}
```

---

## 配置说明

配置文件位置：`~/.config/ai-tools/config.json`

### 快速开始

```bash
ai-init           # 创建配置文件
ai-status         # 查看配置摘要
ai-config         # 查看配置详情
ai-config -e      # 编辑配置
ai-config -p      # 显示配置路径
ai-config --reset # 重置配置
```

### 配置字段

#### 通用配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `baseUrl` | string | DashScope | API 端点 |
| `apiKey` | string | - | API 密钥 |
| `model` | string | qwen3.5-flash | 默认模型 |
| `language` | string | zh | 输出语言 (zh/en) |
| `showExplanation` | boolean | true | 显示解释 |

#### 工具配置

| 字段 | 说明 |
|------|------|
| `errorSolver.model` | 报错分析模型 |
| `smartShell.model` | Shell 生成模型 |
| `smartSql.model` | SQL 生成模型 |
| `smartSql.dialect` | SQL 方言 |
| `aiCommit.model` | Commit 生成模型 |
| `aiCommit.maxDiffLength` | Diff 长度限制 |
| `aiTr.languages` | 翻译语言对 |

### 配置示例

```json
{
  "apiKey": "sk-xxxxx",
  "model": "qwen3.5-flash",
  "language": "zh",
  "showExplanation": true,

  "errorSolver": {
    "model": "qwen-plus"
  },
  "smartSql": {
    "dialect": "mysql"
  },
  "aiTr": {
    "languages": ["zh", "en"]
  }
}
```

### 支持的 API 服务

| 服务商 | 端点 |
|--------|------|
| 通义千问 (默认) | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| DeepSeek | https://api.deepseek.com/v1 |
| OpenAI | https://api.openai.com/v1 |
| Groq | https://api.groq.com/openai/v1 |
| Ollama (本地) | http://localhost:11434/v1 |
