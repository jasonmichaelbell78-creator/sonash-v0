#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * pattern-check.js - PostToolUse hook for pattern compliance
 * Cross-platform replacement for pattern-check.sh
 *
 * Runs pattern checker on modified files during the session
 * Non-blocking: outputs warnings but doesn't fail the operation
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeFilesystemError } = require("../../scripts/lib/validate-paths.js");

/**
 * Inline pattern definitions — high-signal subset from scripts/check-pattern-compliance.js
 * OPT-H002: Eliminates ~100ms subprocess spawn by running patterns in-process.
 * Full pattern set still available via: node scripts/check-pattern-compliance.js --all
 */
const INLINE_PATTERNS = [
  // Security-critical patterns
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
      /(?:^|[\\/])(?:check-pattern-compliance|archive-doc|phase-complete-check|pattern-check|normalize-format)\.js$/,
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
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|security-check|pattern-check)\.js$/,
  },
  // Shell patterns
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
  // React patterns
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
  // Test pattern
  {
    id: "test-mock-firestore-directly",
    pattern: /(?:vi|jest)\.mock\s*\(\s*['"`]firebase\/firestore['"`]/g,
    message:
      "Mocking firebase/firestore directly - app uses Cloud Functions (httpsCallable) for writes",
    fix: 'Mock firebase/functions instead: vi.mock("firebase/functions", ...)',
    fileTypes: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".test.js", ".test.jsx"],
  },
  // SQL injection
  {
    id: "sql-injection-risk",
    pattern:
      /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*(?:\$\{|\+\s*)|'[^']*(?:\$\{|\+\s*)|"[^"]*(?:\$\{|\+\s*))/g,
    message: "Potential SQL injection: string interpolation in query",
    fix: "Use parameterized queries with placeholders",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])generate-views\.js$/,
  },
  // Shell command injection
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
 * Run inline patterns against file content.
 * Returns array of {id, line, message, fix} violations.
 */
function checkInlinePatterns(content, relPath, ext) {
  const violations = [];
  const normalizedPath = relPath.replace(/\\/g, "/");

  for (const pat of INLINE_PATTERNS) {
    // File type filter
    if (!pat.fileTypes.some((ft) => ext === ft || normalizedPath.endsWith(ft))) continue;
    // Path exclude
    if (pat.pathExclude && pat.pathExclude.test(normalizedPath)) continue;

    // Run pattern (use fresh regex to avoid shared lastIndex state)
    // Defensive: ensure global flag so exec() advances (Review #256)
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
      // Compute line number incrementally (avoid O(n²) slicing)
      for (let i = lastIdx; i < match.index; i++) {
        if (content.charCodeAt(i) === 10) lineNumber++;
      }
      // Advance past the full match to avoid double-counting newlines (Review #256)
      lastIdx = match.index + match[0].length;
      violations.push({ id: pat.id, line: lineNumber, message: pat.message, fix: pat.fix });
      // Prevent infinite loop on zero-length match
      if (match[0].length === 0) {
        regex.lastIndex++;
        lastIdx = regex.lastIndex;
      }
    }
  }
  return violations;
}

/**
 * Sanitize path strings for safe logging (prevent log injection)
 * @param {string} pathStr - The path string to sanitize
 * @returns {string} - Safe path string
 */
function sanitizePathForLog(pathStr) {
  // Remove control characters and Unicode line separators (Review #200 R4 - Qodo)
  // eslint-disable-next-line no-control-regex -- Intentional control character removal for log safety
  const sanitized = String(pathStr).replace(/[\x00-\x1F\x7F-\x9F\u2028\u2029]/g, "");
  // Cap length to prevent log flooding (Review #200 R4 - Qodo)
  return sanitized.length > 500 ? `${sanitized.slice(0, 500)}…[truncated]` : sanitized;
}

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;

// Security: Fail closed on absolute CLAUDE_PROJECT_DIR (Review #200 R4 - Qodo)
if (projectDirInput !== safeBaseDir && path.isAbsolute(projectDirInput)) {
  process.exit(0);
}

const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Cache realpathSync(projectDir) at module level (avoids redundant syscall per invocation)
let _realProjectDir;
function getRealProjectDir() {
  if (!_realProjectDir) _realProjectDir = fs.realpathSync(projectDir);
  return _realProjectDir;
}

// Security: Ensure projectDir is within baseDir using path.relative() (prevent path traversal)
const baseRel = path.relative(safeBaseDir, projectDir);
// Use segment-based check instead of startsWith (Review #200 R4 - Qodo)
const baseSegments = baseRel.split(path.sep);
if (baseSegments[0] === ".." || baseRel === ".." || path.isAbsolute(baseRel)) {
  process.exit(0);
}

// Parse file path from arguments (JSON format: {"file_path": "..."})
const arg = process.argv[2] || "";
if (!arg) {
  process.exit(0);
}

// Extract file_path from JSON
let filePath = "";
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || "";
} catch {
  // Not JSON, try as direct path
  filePath = arg;
}

if (!filePath) {
  process.exit(0);
}

// Security: Reject option-like paths
// Use [0] instead of startsWith to avoid pattern trigger (Review #200 R4 - Qodo)
if (filePath[0] === "-") {
  process.exit(0);
}

// Reject multiline paths
if (filePath.includes("\n") || filePath.includes("\r")) {
  process.exit(0);
}

// Normalize backslashes to forward slashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths (use [0] to avoid startsWith pattern - Review #200 R4 - Qodo)
if (filePath[0] === "/" || /^[A-Za-z]:\//.test(filePath)) {
  process.exit(0);
}
// Block path traversal (use regex for segment matching - Review #200 R4 - Qodo)
if (/(?:^|\/)\.\.(?:\/|$)/.test(filePath)) {
  process.exit(0);
}

// Only check JS/TS files and shell scripts
if (!/\.(js|ts|tsx|jsx|sh|yml|yaml)$/.test(filePath)) {
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// Compute relative path (cross-platform: use path.sep for separator)
// Use path-based matching instead of startsWith (Review #200 R4 - Qodo)
let relPath = filePath;
if (path.isAbsolute(filePath)) {
  relPath = path.relative(projectDir, filePath);
  if (!relPath || relPath === ".." || relPath.split(path.sep)[0] === "..") {
    process.exit(0);
  }
}

// Verify containment (wrap realpathSync in try/catch for filesystem errors)
// Note: No existsSync check - avoid TOCTOU race, rely on realpathSync error handling (Review #200)
const fullPath = path.resolve(projectDir, relPath);
let realPath = "";
let realProject = "";
try {
  realPath = fs.realpathSync(fullPath);
  realProject = getRealProjectDir();
} catch (err) {
  // File doesn't exist or is inaccessible - skip pattern check (Review #200 - logging added)
  // Sanitize error message to prevent path disclosure (Review #200 Round 2 - Qodo compliance)
  // Add timestamp for audit trail (Review #200 Round 2 - Qodo Comprehensive Audit Trails)
  const timestamp = new Date().toISOString();
  const safeMsg = sanitizeFilesystemError(err);
  const safePath = sanitizePathForLog(relPath);
  console.error(
    `[${timestamp}] Pattern check skipped: ${safePath} (file not accessible: ${safeMsg})`
  );
  process.exit(0);
}
// rel === '' means file path equals projectDir (invalid for file operations)
const pathRel = path.relative(realProject, realPath);
// Use segment-based check instead of startsWith (Review #200 R4 - Qodo)
const pathSegments = pathRel.split(path.sep);
if (pathRel === "" || pathSegments[0] === ".." || pathRel === ".." || path.isAbsolute(pathRel)) {
  process.exit(0);
}

// Quick Win: Skip pattern check for small files (<100 lines) to reduce latency (Review #200)
// Pre-check file size before reading (Review #200 - Qodo suggestion #7)
// Use realPath instead of fullPath to prevent TOCTOU race (Review #200 Round 2 - Qodo suggestion #0)
try {
  const { size } = fs.statSync(realPath);
  // Approximate small files (under ~8 KB) as <100 lines
  if (size < 8 * 1024) {
    process.exit(0);
  }
  // Skip very large files to prevent regex DoS on crafted input (Review #315)
  const MAX_PATTERN_CHECK_SIZE = 512 * 1024; // 512 KB
  if (size > MAX_PATTERN_CHECK_SIZE) {
    process.exit(0);
  }

  // File is large enough - check line count
  const content = fs.readFileSync(realPath, "utf8");

  // Skip binary files (Review #200 R4 - Qodo)
  // Check for null bytes which indicate binary content
  if (content.includes("\0")) {
    process.exit(0);
  }

  // Optimize line counting to avoid creating large array (Review #200 - Qodo suggestion #13)
  let lineCount = 1;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) lineCount++;
  }

  if (lineCount < 100) {
    process.exit(0);
  }

  // OPT-H002: Run inline pattern checks instead of subprocess spawn (~5ms vs ~100ms)
  const ext = path.extname(relPath);
  const violations = checkInlinePatterns(content, relPath, ext);

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  PATTERN CHECK REMINDER");
    console.error("\u2501".repeat(28));
    console.error(`\ud83d\udcc4 ${relPath}`);
    // Show first 5 violations to keep output manageable
    for (const v of violations.slice(0, 5)) {
      console.error(`   Line ${v.line}: ${v.message}`);
      console.error(`   \u2713 Fix: ${v.fix}`);
    }
    if (violations.length > 5) {
      console.error(`   ... and ${violations.length - 5} more`);
    }
    console.error("");
    console.error(
      "Review docs/agent_docs/CODE_PATTERNS.md (\ud83d\udd34 = critical) for documented patterns."
    );
    console.error("\u2501".repeat(28));
  }
} catch (err) {
  // Exit gracefully on precheck failure instead of proceeding (Review #200 R4 - Qodo)
  const timestamp = new Date().toISOString();
  const safeMsg = sanitizeFilesystemError(err);
  const safePath = sanitizePathForLog(relPath);
  console.error(`[${timestamp}] Pattern check skipped (precheck failed): ${safePath}: ${safeMsg}`);
  console.log("ok");
  process.exit(0);
}

// Protocol: stdout only contains "ok"
console.log("ok");
process.exit(0);
