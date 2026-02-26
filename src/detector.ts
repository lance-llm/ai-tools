// 编程语言检测模块

export function detectLanguage(errorText: string): string {
  const lowerText = errorText.toLowerCase();

  // Python 特征
  const pythonPatterns = [
    /modulenotfounderror/i,
    /importerror/i,
    /syntaxerror:\s*invalid syntax/i,
    /typeerror/i,
    /valueerror/i,
    /attributeerror/i,
    /indentationerror/i,
    /nameerror/i,
    /keyerror/i,
    /indexerror/i,
    /pip\s+install/i,
    /python\s+[0-9.]+/i,
    /file\s+"[^"]+\.py"/i,
    /line\s+\d+/i,
    /traceback\s+\(most recent call last\)/i,
  ];

  // JavaScript/TypeScript 特征
  const jsPatterns = [
    /referenceerror/i,
    /typeerror:?\s*cannot read/i,
    /syntaxerror:/i,
    /cannot find module/i,
    /require\(/i,
    /import\s+.*\s+from/i,
    /undefined\s+is\s+not\s+a\s+function/i,
    /webpack/i,
    /babel/i,
    /typescript/i,
    /ts-node/i,
    /npm\s+install/i,
    /yarn\s+add/i,
    /pnpm\s+add/i,
    /node_modules/i,
    /package\.json/i,
  ];

  // Java 特征
  const javaPatterns = [
    /java\.lang\./i,
    /exception\s+in\s+thread/i,
    /caused by:/i,
    /at\s+[\w.]+\([^)]*\)/i,
    /maven/i,
    /gradle/i,
    /build\.gradle/i,
    /pom\.xml/i,
  ];

  // Go 特征
  const goPatterns = [
    /panic:/i,
    /fatal error:/i,
    /undefined:/i,
    /cannot use\s+.*\s+as\s+type/i,
    /go build/i,
    /go run/i,
    /go mod/i,
    /import\s+"[^"]+"/i,
  ];

  // Rust 特征
  const rustPatterns = [
    /error\[E\d+\]:/i,
    /could not find `[^`]+` in/i,
    /the trait `[^`]+` is not implemented/i,
    /cannot find value `[^`]+`/i,
    /mismatched types/i,
    /borrowed value does not live long enough/i,
    /cargo\s+(build|run)/i,
    /Cargo\.toml/i,
  ];

  // 检测函数
  function checkPatterns(text: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);
  }

  const scores = {
    python: checkPatterns(lowerText, pythonPatterns),
    javascript: checkPatterns(lowerText, jsPatterns),
    java: checkPatterns(lowerText, javaPatterns),
    go: checkPatterns(lowerText, goPatterns),
    rust: checkPatterns(lowerText, rustPatterns),
  };

  // 找出得分最高的语言
  let maxScore = 0;
  let detectedLang = 'unknown';

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // 如果没有检测到特征，返回 unknown
  if (maxScore === 0) {
    return 'unknown';
  }

  return detectedLang;
}

export function getLanguageIcon(lang: string): string {
  const icons: Record<string, string> = {
    python: '🐍',
    javascript: '🟨',
    typescript: '🟦',
    java: '☕',
    go: '🐹',
    rust: '🦀',
    unknown: '🔍',
  };
  return icons[lang] || '🔍';
}

export function formatLanguageName(lang: string): string {
  const names: Record<string, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    unknown: '未知',
  };
  return names[lang] || lang;
}
