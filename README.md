# AI Tools

一站式 AI 开发助手 —— 报错分析、命令生成、SQL 编写、Commit 信息、双语翻译

```bash
npm install -g @lance2026/ai-tools
ai-init  # 一次配置，永久使用
```

---

## 命令速览

| 命令 | 功能 | 示例 |
|------|------|------|
| `ai-error` | 报错分析修复 | `ai-error` 粘贴报错信息 |
| `ai-shell` | 生成 Shell 命令 | `ai-shell "查找大于 100M 的文件"` |
| `ai-sql` | 生成 SQL 查询 | `ai-sql "查询上月活跃用户"` |
| `ai-commit` | 生成 Commit 信息 | `ai-commit` 分析 git diff |
| `ai-tr` | 双语互译 | `ai-tr "hello world"` → 你好世界 |
| `ai-status` | 查看配置状态 | `ai-status` |
| `ai-config` | 管理配置文件 | `ai-config -e` 编辑配置 |

---

## 使用示例

### 🔧 报错分析
```bash
ai-error -y  # 从剪贴板读取报错
# ❌ 错误：Node.js 版本不兼容
# ✅ 修复：nvm install 18 && nvm use 18
```

### 📟 Shell 命令生成
```bash
ai-shell "找出最近 7 天修改过的日志文件"
# $ find . -name "*.log" -mtime -7 -ls
```

### 📊 SQL 查询生成
```bash
ai-sql "统计每个用户的订单数，按降序排列"
# SELECT user_id, COUNT(*) FROM orders GROUP BY user_id ORDER BY COUNT(*) DESC;
```

### 📝 Git Commit
```bash
ai-commit
# feat(auth): add JWT token expiration check
```

### 🌐 翻译
```bash
ai-tr "The quick brown fox jumps over the lazy dog"
# 敏捷的棕色狐狸跳过了懒狗
ai-tr --langs zh,ja "你好"  # 支持 10+ 语言
```

---

## 配置

配置文件：`~/.config/ai-tools/config.json`

```json
{
  "apiKey": "sk-xxxxx",
  "model": "qwen3.5-flash",
  "aiTr": { "languages": ["zh", "en"] }
}
```

支持 API：DashScope（通义千问）/ DeepSeek / OpenAI / 其他 OpenAI 兼容服务

---

## 开发

```bash
git clone https://github.com/lance2026/ai-tools.git
cd ai-tools && npm install && npm run build
./bin/ai-tr "test"  # 本地测试
```

## License

MIT
