# AI Tools 配置指南

## 配置文件位置

```
~/.config/ai-tools/config.json
```

## 快速配置

### 1. 初始化配置

```bash
ai-init
```

交互式设置 API Key 和默认选项。

### 2. 手动配置

```bash
ai-config -e  # 使用编辑器打开
```

### 3. 验证配置

```bash
ai-status
```

## 完整配置示例

```json
{
  "_comment": "AI Tools 通用配置文件",

  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-your-api-key-here",
  "model": "qwen3.5-flash",
  "language": "zh",
  "showExplanation": true,

  "errorSolver": {
    "model": "qwen-plus",
    "showExplanation": true
  },

  "smartShell": {
    "model": "qwen3.5-flash",
    "showExplanation": true
  },

  "smartSql": {
    "model": "qwen3.5-flash",
    "dialect": "postgresql",
    "showExplanation": true
  },

  "aiCommit": {
    "model": "qwen3.5-flash",
    "showExplanation": true,
    "maxDiffLength": 40000
  },

  "aiTr": {
    "model": "qwen3.5-flash",
    "languages": ["zh", "en"]
  }
}
```

## 配置字段说明

### 通用字段

| 字段 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `baseUrl` | 否 | DashScope | OpenAI 兼容 API 端点 |
| `apiKey` | 是 | - | API 密钥 |
| `model` | 否 | qwen3.5-flash | 默认模型 |
| `language` | 否 | zh | 输出语言：zh 或 en |
| `showExplanation` | 否 | true | 是否显示解释说明 |

### 工具专属字段

#### errorSolver (ai-error)

| 字段 | 说明 |
|------|------|
| `model` | 覆盖默认模型 |
| `showExplanation` | 是否显示详细解释 |
| `systemMessage` | 自定义系统提示词 |

#### smartShell (ai-shell)

| 字段 | 说明 |
|------|------|
| `model` | 覆盖默认模型 |
| `showExplanation` | 是否显示命令解释 |
| `systemMessage` | 自定义系统提示词 |

#### smartSql (ai-sql)

| 字段 | 说明 |
|------|------|
| `model` | 覆盖默认模型 |
| `dialect` | SQL 方言：postgresql/mysql/sqlite |
| `showExplanation` | 是否显示 SQL 解释 |
| `systemMessage` | 自定义系统提示词 |

#### aiCommit (ai-commit)

| 字段 | 说明 |
|------|------|
| `model` | 覆盖默认模型 |
| `showExplanation` | 是否显示改动说明 |
| `maxDiffLength` | Git Diff 最大字符数 (默认 40000) |
| `systemMessage` | 自定义系统提示词 |

#### aiTr (ai-tr / ai-translate)

| 字段 | 说明 |
|------|------|
| `model` | 覆盖默认模型 |
| `languages` | 语言对数组，如 ["zh", "en"] |

## API 服务商配置

### 通义千问 (默认)

```json
{
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-dashscope-key",
  "model": "qwen3.5-flash"
}
```

### DeepSeek

```json
{
  "baseUrl": "https://api.deepseek.com/v1",
  "apiKey": "sk-deepseek-key",
  "model": "deepseek-chat"
}
```

### OpenAI

```json
{
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-openai-key",
  "model": "gpt-4o"
}
```

### Ollama (本地)

```json
{
  "baseUrl": "http://localhost:11434/v1",
  "apiKey": "ollama",
  "model": "qwen2.5"
}
```

## 常用配置组合

### 经济模式 (低成本)

```json
{
  "model": "qwen-turbo",
  "errorSolver": { "model": "qwen-turbo" },
  "smartShell": { "model": "qwen-turbo" },
  "smartSql": { "model": "qwen-turbo" },
  "aiCommit": { "model": "qwen-turbo" }
}
```

### 高质量模式

```json
{
  "model": "qwen-plus",
  "errorSolver": { "model": "qwen-max" },
  "smartShell": { "model": "qwen-plus" },
  "smartSql": { "model": "qwen-plus" },
  "aiCommit": { "model": "qwen-plus" }
}
```

### 英文环境

```json
{
  "language": "en",
  "errorSolver": {
    "systemMessage": "You are a senior programmer..."
  }
}
```

## 常见问题

### 配置文件不存在

```bash
ai-init  # 创建配置
```

### 配置解析失败

检查 JSON 格式，确保：
- 使用双引号
- 逗号正确
- 无注释

### 查看配置路径

```bash
ai-config -p
```

### 重置配置

```bash
ai-config --reset
```

## 自定义系统提示词

每个工具都可以自定义 systemMessage：

```json
{
  "smartSql": {
    "systemMessage": "你是 SQL 专家，只输出 SQL 语句，不要解释。"
  },
  "aiCommit": {
    "systemMessage": "Use English for commit messages."
  }
}
```
