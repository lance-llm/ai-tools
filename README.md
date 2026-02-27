# AI Tools

> 一站式 AI 开发助手 —— 报错分析、命令生成、SQL 编写、Commit 信息、双语翻译

```bash
npm install -g @lance2026/ai-tools
ai-init  # 一次配置，永久使用
```

---

## 命令速览

| 命令 | 功能 | 一行示例 |
|------|------|----------|
| [`ai-error`](docs/usage.md#ai-error) | 报错分析 | `ai-error -y` 从剪贴板读取 |
| [`ai-shell`](docs/usage.md#ai-shell) | Shell 生成 | `ai-shell "查找大文件"` |
| [`ai-sql`](docs/usage.md#ai-sql) | SQL 生成 | `ai-sql "上月活跃用户"` |
| [`ai-commit`](docs/usage.md#ai-commit) | Commit 信息 | `ai-commit` 分析 git diff |
| [`ai-tr`](docs/usage.md#ai-tr) | 双语翻译 | `ai-tr "hello" → 你好` |
| `ai-status` | 查看配置 | `ai-status` |
| `ai-config` | 管理配置 | `ai-config -e` 编辑 |

---

## 快速开始

<details>
<summary><strong>📦 安装与配置</strong></summary>

```bash
# 安装
npm install -g @lance2026/ai-tools

# 初始化配置（输入 API Key）
ai-init

# 验证配置
ai-status
```

**配置文件位置**: `~/.config/ai-tools/config.json`

</details>

<details>
<summary><strong>🔧 ai-error 报错分析</strong></summary>

```bash
ai-error                  # 交互输入
ai-error -y               # 从剪贴板读取
ai-error -e               # 详细解释模式

# 输出示例
❌ 错误：Node.js 版本不兼容
✅ 修复：nvm install 18 && nvm use 18
```

[查看详细文档 →](docs/usage.md#ai-error)

</details>

<details>
<summary><strong>📟 ai-shell Shell 生成</strong></summary>

```bash
ai-shell "查找所有大于 100M 的文件"
echo "列出最大的 5 个文件" | ai-shell
ai-shell --history        # 查看历史

# 生成后可选：直接执行 / 复制 / 编辑 / 取消
# ⚠️ 危险命令 (rm -rf, sudo) 需要确认
```

[查看详细文档 →](docs/usage.md#ai-shell)

</details>

<details>
<summary><strong>📊 ai-sql SQL 生成</strong></summary>

```bash
ai-sql "查询上月活跃用户"
ai-sql --dialect mysql "月活统计"
ai-sql --modify "SELECT * FORM users | 报错"
echo "统计订单数" | ai-sql
```

[查看详细文档 →](docs/usage.md#ai-sql)

</details>

<details>
<summary><strong>📝 ai-commit Commit 信息</strong></summary>

```bash
ai-commit                 # 分析暂存改动
ai-commit -a              # 自动 add + commit

# 输出示例
feat(auth): add JWT token expiration
```

[查看详细文档 →](docs/usage.md#ai-commit)

</details>

<details>
<summary><strong>🌐 ai-tr 双语翻译</strong></summary>

```bash
ai-tr "hello world"              # 英译中
ai-tr "你好世界"                  # 中译英
ai-tr --langs zh,ja "你好"        # 中日互译
echo "hello" | ai-tr             # 管道输入

# 自动检测语言，翻译后自动复制
```

[查看详细文档 →](docs/usage.md#ai-tr)

</details>

<details>
<summary><strong>⚙️ 配置说明</strong></summary>

```json
{
  "apiKey": "sk-xxxxx",
  "model": "qwen3.5-flash",
  "language": "zh",
  "showExplanation": true,
  "aiTr": { "languages": ["zh", "en"] }
}
```

**常用命令**:
- `ai-status` - 查看配置摘要
- `ai-config -e` - 编辑配置
- `ai-config --reset` - 重置配置

**支持的 API**: 通义千问 / DeepSeek / OpenAI / Ollama / Groq

[查看配置指南 →](docs/config.md)

</details>

---

## 支持的 AI 服务

| 服务商 | 端点 | 模型示例 |
|--------|------|----------|
| 通义千问 (默认) | dashscope.aliyuncs.com | qwen3.5-flash, qwen-plus |
| DeepSeek | api.deepseek.com | deepseek-chat |
| OpenAI | api.openai.com | gpt-4o, gpt-3.5-turbo |
| Ollama (本地) | localhost:11434 | qwen2.5, llama3 |

---

## 开发

```bash
git clone https://github.com/lance2026/ai-tools.git
cd ai-tools
npm install
npm run build
./bin/ai-tr "test"  # 本地测试
```

## License

MIT
