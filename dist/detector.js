"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = detectLanguage;
exports.getLanguageIcon = getLanguageIcon;
exports.formatLanguageName = formatLanguageName;
function detectLanguage(errorText) {
    const lowerText = errorText.toLowerCase();
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
    function checkPatterns(text, patterns) {
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
    let maxScore = 0;
    let detectedLang = 'unknown';
    for (const [lang, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedLang = lang;
        }
    }
    if (maxScore === 0) {
        return 'unknown';
    }
    return detectedLang;
}
function getLanguageIcon(lang) {
    const icons = {
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
function formatLanguageName(lang) {
    const names = {
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
//# sourceMappingURL=detector.js.map