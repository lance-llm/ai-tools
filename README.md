# AI Tools

AI-powered CLI toolkit for developers — error analysis, shell command generation, SQL generation, and git commit message generation. Works with any OpenAI-compatible API (Qwen / DeepSeek / OpenAI / etc.).

## Commands

| Command | Description |
|---------|-------------|
| `ai-init` | Interactive setup wizard — initializes config file |
| `ai-status` | Show config summary: version, API key, model, per-tool settings |
| `ai-config` | View or edit the config file |
| `ai-error` | Analyze error messages and suggest fixes |
| `ai-shell` | Generate shell commands from natural language |
| `ai-sql` | Generate SQL queries from natural language |
| `ai-commit` | Analyze git diff and generate a commit message |
| `ai-tr` | Intelligent bilingual translation — auto-detect language and translate |

## Installation

```bash
npm install -g @lance2026/ai-tools
```

## Quick Start

```bash
# 1. Initialize config (one-time setup)
ai-init

# 2. Check everything is configured
ai-status

# 3. Start using
ai-error                        # paste an error, get a fix
ai-shell "find files over 100M" # generate a shell command
ai-sql "users who joined last month" # generate SQL
ai-commit                       # generate commit message from staged changes
```

---

## Usage

### ai-init

Interactive wizard that creates `~/.config/ai-tools/config.json` with all default values pre-filled — including system prompts for each tool, so you can customize them directly.

```bash
ai-init           # create config
ai-init --force   # overwrite existing config
```

---

### ai-status

Quick overview of your current configuration.

```bash
ai-status
```

```
AI Tools  v1.3.0

config    ~/.config/ai-tools/config.json  ✓
api key   sk-ab••••1234  ✓
endpoint  https://dashscope.aliyuncs.com/compatible-mode/v1
model     qwen3.5-flash
language  zh
explain   true

tools
  ai-error    qwen-plus     showExplanation: true
  ai-shell    qwen3.5-flash
  ai-sql      qwen3.5-flash dialect: postgresql
  ai-commit   qwen3.5-flash
```

---

### ai-config

```bash
ai-config           # view config (API key masked)
ai-config -e        # open in $EDITOR
ai-config -p        # print config file path only
ai-config --reset   # reset to defaults
```

---

### ai-error

Paste an error message, get root cause analysis and fix suggestions.

```bash
ai-error                  # interactive input
ai-error -y               # read from clipboard directly
ai-error -e               # request a more detailed explanation
```

Example:

```
$ ai-error

🔧 Error Solver v1.3.0

📋 请输入报错信息 (或直接粘贴):

❌ 错误: Node.js 版本不兼容，需要 >= 18
✅ 修复: nvm install 18 && nvm use 18
💡 提示: 在 .nvmrc 中固定版本避免重复切换
```

---

### ai-shell

Generate shell commands from a natural language description. After generation, choose what to do with the result.

```bash
ai-shell                                  # interactive
ai-shell "find all files larger than 100M"  # inline description
echo "list top 5 biggest files" | ai-shell  # pipe input
ai-shell --history                          # view recent commands
```

After the command is generated:

```
  $ find . -size +100M -ls
  find: recursively search for files larger than 100MB

? 选择操作 ›
❯ ⚡ 直接执行
  📋 复制到剪贴板
  ✏️  编辑后执行
  ✖  取消
```

Dangerous commands (`rm -rf`, `sudo`, `chmod 777`, etc.) require typing `yes` before execution.

---

### ai-sql

Generate SQL from a natural language description. Supports PostgreSQL, MySQL, and SQLite.

```bash
ai-sql                                         # interactive
ai-sql "users who placed more than 10 orders"  # inline
ai-sql --dialect mysql "monthly active users"  # specify dialect
ai-sql --modify "SELECT * FORM users | ..."    # fix broken SQL
echo "top 10 products by revenue" | ai-sql     # pipe input
```

After the SQL is generated:

```
  SELECT user_id, COUNT(*) AS order_count
  FROM orders
  GROUP BY user_id
  HAVING COUNT(*) > 10
  ORDER BY order_count DESC;
  Groups orders by user and filters those with more than 10 orders.

? 选择操作 ›
❯ 📋 复制到剪贴板
  ✏️  编辑后复制
  ✖  取消
```

---

### ai-commit

Analyzes staged git changes and generates a [Conventional Commits](https://www.conventionalcommits.org/) message.

```bash
ai-commit        # use already-staged changes
ai-commit -a     # run git add -A first, then generate
```

If nothing is staged, it lists unstaged files and asks whether to stage them.

```
📝 AI Commit - 根据改动生成 commit message

  src/commands/smart-sql.ts  | 120 +++---
  src/config.ts              |  18 +-
  2 files changed, 97 insertions(+), 41 deletions(-)

⏳ 正在分析改动并生成 commit message...

  feat(sql): rewrite smart-sql with clean extraction and action menu

  Remove code-fence markers from LLM output, strip markdown from
  explanations, add copy/edit action menu aligned with smart-shell.

? 选择操作 ›
❯ ✅ 直接提交
  ✏️  编辑后提交
  📋 复制到剪贴板
  ✖  取消
```

---

### ai-tr / ai-translate

Intelligent bilingual translation tool — auto-detects input language and translates between two configured languages.

```bash
ai-tr "hello world"              # translate to Chinese
ai-tr "你好世界"                  # translate to English
ai-tr --langs zh,ja "你好"        # translate between Chinese and Japanese
ai-tr --set-langs zh,en          # save language pair to config
echo "hello" | ai-tr             # pipe input
cat file.txt | ai-tr             # translate multi-line text
```

After translation:

```
🌐 AI Translate - 智能双语翻译
  当前语言对：中文 ⇄ English

⏳ 正在翻译...

  你好，世界

? 选择操作 ›
❯ 📋 复制到剪贴板
  ✏️  编辑后复制
  ✖  取消
```

**Aliases:** `ai-translate` works the same as `ai-tr`.

**Language codes:** `zh` (Chinese), `en` (English), `ja` (Japanese), `ko` (Korean), `fr` (French), `de` (German), `es` (Spanish), `it` (Italian), `pt` (Portuguese), `ru` (Russian)

---

## Configuration

Config file: `~/.config/ai-tools/config.json`

Running `ai-init` creates this file with all options pre-filled and commented. You can edit it directly at any time.

```json
{
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-xxxxx",
  "model": "qwen3.5-flash",
  "language": "zh",
  "showExplanation": true,

  "errorSolver": {
    "model": "qwen-plus",
    "showExplanation": true,
    "systemMessage": "custom prompt..."
  },
  "smartShell": {
    "model": "qwen3.5-flash",
    "showExplanation": true,
    "systemMessage": "custom prompt..."
  },
  "smartSql": {
    "model": "qwen3.5-flash",
    "dialect": "postgresql",
    "showExplanation": true,
    "systemMessage": "custom prompt..."
  },
  "aiCommit": {
    "model": "qwen3.5-flash",
    "showExplanation": true,
    "systemMessage": "custom prompt..."
  },
  "aiTr": {
    "model": "qwen3.5-flash",
    "languages": ["zh", "en"]
  }
}
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | string | DashScope | Any OpenAI-compatible API endpoint |
| `apiKey` | string | — | API key |
| `model` | string | `qwen3.5-flash` | Default model for all tools |
| `language` | string | `zh` | Output language: `zh` or `en` |
| `showExplanation` | boolean | `true` | Show explanation text globally; each tool can override |
| `<tool>.model` | string | inherited | Per-tool model override |
| `<tool>.showExplanation` | boolean | inherited | Override global `showExplanation` for one tool |
| `<tool>.systemMessage` | string | built-in | Customize the system prompt sent to the LLM |
| `smartSql.dialect` | string | `postgresql` | SQL dialect: `postgresql` / `mysql` / `sqlite` |
| `aiTr.languages` | array | `["zh", "en"]` | Language pair for translation |

### Compatible API Providers

Any provider that exposes an OpenAI-compatible `/chat/completions` endpoint works:

- **Alibaba Cloud DashScope** (default) — Qwen models
- **DeepSeek** — `https://api.deepseek.com/v1`
- **OpenAI** — `https://api.openai.com/v1`
- **Groq**, **Together AI**, **Ollama** (local), and others

---

## Development

```bash
git clone https://github.com/lance2026/ai-tools.git
cd ai-tools
npm install
npm run build      # compile TypeScript → dist/
node bin/ai-shell  # test locally without installing
```

## License

MIT
