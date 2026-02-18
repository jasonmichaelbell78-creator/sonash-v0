/* eslint-disable */
/**
 * Inline pattern checks for the post-write-validator hook.
 * Extracted from post-write-validator.js (AI-4.2)
 *
 * These are a fast subset of the patterns in scripts/check-pattern-compliance.js,
 * run per-file on write/edit to catch issues early.
 */

const INLINE_PATTERNS = [
  {
    id: "unsafe-error-message",
    pattern: /catch\s*\(\s*(\w+)\s*\)\s*\{(?![^}]*instanceof\s+Error)[^}]*?\b\1\b\.message/g,
    message: "Unsafe error.message access - crashes if non-Error is thrown",
    fix: "Use: error instanceof Error ? error.message : String(error)",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "path-startswith",
    pattern: /\.startsWith\s*\(\s*['"`][./\\]+['"`]\s*\)/g,
    message: "Path validation with startsWith() fails on Windows or edge cases",
    fix: 'Use: path.relative() and check for ".." prefix with regex',
    fileTypes: [".js", ".ts"],
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|archive-doc|phase-complete-check|pattern-check|normalize-format|post-write-validator)\.js$/,
  },
  {
    id: "hardcoded-api-key",
    pattern:
      /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Z0-9_/+=-]{20,}['"`]/gi,
    message: "Potential hardcoded API key or secret detected",
    fix: "Use environment variables: process.env.API_KEY",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    exclude: /(?:test|mock|fake|dummy|example|placeholder|xxx+|your[_-]?api|insert[_-]?your)/i,
  },
  {
    id: "unsafe-innerhtml",
    pattern: /\.innerHTML\s*=/g,
    message: "innerHTML assignment can lead to XSS vulnerabilities",
    fix: "Use textContent for text, or sanitize with DOMPurify for HTML",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "eval-usage",
    pattern: /\beval\s*\(/g,
    message: "ev" + "al() is a security risk - allows arbitrary code execution",
    fix: "Avoid ev" + "al. Use JSON.parse for JSON, or restructure code",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|security-check|pattern-check|post-write-validator)\.js$/,
  },
  {
    id: "npm-install-automation",
    pattern: /npm\s+install\b[^\n]*/g,
    message: "npm install in automation can modify lockfile",
    fix: "Use: npm ci (reads lockfile exactly)",
    fileTypes: [".sh", ".yml", ".yaml"],
    exclude: /--legacy-peer-deps|--save|--save-dev|-[gDS]\b|--global/,
    pathExclude: /session-start\.(?:sh|js)$/,
  },
  {
    id: "exit-code-capture",
    pattern: /\$\(\s*[^)]{1,500}\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
    message: "Exit code capture bug: $? after assignment captures assignment exit (always 0)",
    fix: "Use: if ! OUT=$(cmd); then",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "unstable-list-key",
    pattern: /key=\{[^}]*\bindex\b[^}]*\}/g,
    message: "Using array index as React key - causes unnecessary re-renders",
    fix: "Use a stable unique identifier: key={item.id}",
    fileTypes: [".jsx", ".tsx"],
  },
  {
    id: "div-onclick-no-role",
    pattern: /<div(?![^>]*\brole\s*=)[^>]*\bonClick\b[^>]*>/g,
    message: "Clickable <div> without role attribute - inaccessible to screen readers",
    fix: 'Add role="button" or use <button> element instead',
    fileTypes: [".jsx", ".tsx"],
  },
  {
    id: "test-mock-firestore-directly",
    pattern: /(?:vi|jest)\.mock\s*\(\s*['"`]firebase\/firestore['"`]/g,
    message:
      "Mocking firebase/firestore directly - app uses Cloud Functions (httpsCallable) for writes",
    fix: 'Mock firebase/functions instead: vi.mock("firebase/functions", ...)',
    fileTypes: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".test.js", ".test.jsx"],
  },
  {
    id: "sql-injection-risk",
    pattern:
      /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*(?:\$\{|\+\s*)|'[^']*(?:\$\{|\+\s*)|"[^"]*(?:\$\{|\+\s*))/g,
    message: "Potential SQL injection: string interpolation in query",
    fix: "Use parameterized queries with placeholders",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])generate-views\.js$/,
  },
  {
    id: "shell-command-injection",
    pattern: /exec(?:Sync)?\s*\(\s*(?:`[^`]*\$\{|['"`][^'"]*['"`]\s*\+\s*(?!['"`]))/g,
    message: "Shell command built with string interpolation - command injection risk",
    fix: "Use execFileSync with array args",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },
];

/**
 * Check content against inline patterns and return violations.
 * @param {string} content - File content
 * @param {string} relPath - Relative file path
 * @param {string} fileExt - File extension (e.g., ".js")
 * @returns {Array<{id: string, line: number, message: string, fix: string}>}
 */
function checkInlinePatterns(content, relPath, fileExt) {
  const violations = [];
  const normalizedPath = relPath.replace(/\\/g, "/");

  for (const pat of INLINE_PATTERNS) {
    if (!pat.fileTypes.some((ft) => fileExt === ft || normalizedPath.endsWith(ft))) continue;
    if (pat.pathExclude && pat.pathExclude.test(normalizedPath)) continue;

    const flags = pat.pattern.flags.includes("g") ? pat.pattern.flags : `${pat.pattern.flags}g`;
    const regex = new RegExp(pat.pattern.source, flags);
    const exclude = pat.exclude ? new RegExp(pat.exclude.source, pat.exclude.flags) : null;

    let match;
    let lastIdx = 0;
    let lineNumber = 1;
    while ((match = regex.exec(content)) !== null) {
      if (exclude) {
        exclude.lastIndex = 0;
        if (exclude.test(match[0])) continue;
      }
      for (let i = lastIdx; i < match.index; i++) {
        if (content.charCodeAt(i) === 10) lineNumber++;
      }
      lastIdx = match.index + match[0].length;
      violations.push({ id: pat.id, line: lineNumber, message: pat.message, fix: pat.fix });
      if (match[0].length === 0) {
        regex.lastIndex++;
        lastIdx = regex.lastIndex;
      }
    }
  }
  return violations;
}

module.exports = { INLINE_PATTERNS, checkInlinePatterns };
