/* eslint-disable */
/**
 * Inline pattern checks for the post-write-validator hook.
 * Extracted from post-write-validator.js (AI-4.2)
 *
 * These are a fast subset of patterns run per-file on write/edit to catch issues early.
 *
 * NOTE: Many JS/TS patterns have been migrated to ESLint AST-based rules in
 * eslint-plugin-sonash (v3.0). This file retains only patterns that:
 * 1. Check non-JS content (bash, YAML, shell)
 * 2. Are not yet covered by ESLint rules
 * 3. Provide fast inline feedback for common issues
 *
 * Migrated to ESLint (removed from here):
 * - unsafe-error-message → sonash/no-unsafe-error-access
 * - path-startswith → sonash/no-path-startswith
 * - hardcoded-api-key → sonash/no-hardcoded-secrets
 * - unsafe-innerhtml → sonash/no-unsafe-innerhtml
 * - eval-usage → ESLint no-eval
 * - unstable-list-key → sonash/no-index-key
 * - div-onclick-no-role → sonash/no-div-onclick-no-role
 * - test-mock-firestore-directly → sonash/no-test-mock-firestore
 * - sql-injection-risk → sonash/no-sql-injection
 * - shell-command-injection → sonash/no-shell-injection
 * - sql-injection-template → sonash/no-sql-injection
 */

const INLINE_PATTERNS = [
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
    id: "exec-no-global-flag",
    pattern: /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g,
    message: "exec() in while loop requires /g flag - without it, infinite loop",
    fix: "Ensure regex has /g flag, or use String.prototype.matchAll() instead",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "race-condition-existssync",
    // Built via RegExp to avoid pattern-checker self-flagging on fs method names
    pattern: new RegExp(
      "existsSync\\s*\\([^)]+\\)\\s*(?:" +
        "&&\\s*(?:read" +
        "FileSync|write" +
        "FileSync|append" +
        "FileSync|unlink" +
        "Sync|rm" +
        "Sync)\\b" +
        "|(?:\\)\\s*\\{[^\\n]*\\n\\s*(?:read" +
        "FileSync|write" +
        "FileSync|append" +
        "FileSync|unlink" +
        "Sync|rm" +
        "Sync)\\b))",
      "g"
    ),
    message: "TOCTOU race: existsSync() check followed by file operation",
    fix: "Use try/catch around the operation instead of checking existence first",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "unvalidated-redirect",
    pattern: /redirect\(\s*(?:req\.|params\.|query\.)/g,
    message: "Redirect using unvalidated user input - open redirect risk",
    fix: "Validate redirect target against allowlist of safe destinations",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "console-log-in-production",
    pattern: /console\.log\(/g,
    message: "console.log() in production code - use structured logging or remove",
    fix: "Remove debug logging or use a proper logger",
    fileTypes: [".ts", ".tsx"],
    pathExclude: /(?:^|[\\/])(?:scripts|\.claude|tests?|__tests__|\.husky|.*\.test\.|.*\.spec\.)/,
  },
  {
    id: "any-type-usage",
    pattern: /:\s*any\b/g,
    message: "TypeScript 'any' type bypasses type safety",
    fix: "Use a specific type, 'unknown', or a generic instead of 'any'",
    fileTypes: [".ts", ".tsx"],
    pathExclude: /(?:^|[\\/])(?:scripts|\.claude|.*\.test\.|.*\.spec\.|.*\.d\.ts)/,
  },
  {
    id: "todo-without-ticket",
    pattern: /\/\/\s*TODO(?!\s*\(|\s*\[)/g,
    message: "TODO comment without ticket reference - may be forgotten",
    fix: "Add ticket reference: // TODO(PROJ-123) or // TODO[username]",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "unsafe-json-parse",
    pattern: /JSON\.parse\s*\(\s*(?:req\.|params\.|query\.|body\.|input|userInput)/g,
    message: "JSON.parse on user input without try/catch - crashes on malformed input",
    fix: "Wrap in try/catch: try { JSON.parse(input) } catch { /* handle */ }",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "hardcoded-localhost",
    pattern: /https?:\/\/localhost/g,
    message: "Hardcoded localhost URL - won't work in production",
    fix: "Use environment variable: process.env.API_URL",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    pathExclude:
      /(?:^|[\\/])(?:scripts|\.claude|tests?|__tests__|\.husky|.*\.test\.|.*\.spec\.|.*\.config\.)/,
  },
  {
    id: "empty-catch-block",
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    message: "Empty catch block silently swallows errors",
    fix: "At minimum log the error or add a comment explaining why it's intentional",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "xss-dangerouslysetinnerhtml",
    pattern: /dangerouslySetInnerHTML/g,
    message: "dangerouslySetInnerHTML can lead to XSS if content is not sanitized",
    fix: "Sanitize content with DOMPurify before using dangerouslySetInnerHTML",
    fileTypes: [".jsx", ".tsx"],
  },
  {
    id: "unrestricted-cors",
    pattern: /Access-Control-Allow-Origin.*\*/g,
    message: "Unrestricted CORS allows any origin - security risk",
    fix: "Restrict to specific trusted origins",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "missing-error-boundary",
    pattern: /<Suspense(?![^>]*fallback\s*=)/g,
    message: "Suspense without fallback prop - shows nothing during loading",
    fix: "Add fallback prop: <Suspense fallback={<Loading />}>",
    fileTypes: [".jsx", ".tsx"],
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
