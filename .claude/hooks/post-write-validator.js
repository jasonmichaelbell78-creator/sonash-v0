#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * post-write-validator.js - Consolidated PostToolUse hook for Write/Edit/MultiEdit
 *
 * Replaces 10 separate hooks with ONE Node process (~800ms saved on Windows):
 *   1. checkRequirements     — agent suggestions based on file type (SUGGEST)
 *   2. auditS0S1             — S0/S1 audit JSONL validation (WARN/BLOCK, Write only)
 *   3. patternCheck          — inline pattern compliance (WARN)
 *   4. componentSizeCheck    — React component size limit (WARN)
 *   5. firestoreWriteBlock   — direct Firestore write prevention (BLOCK)
 *   6. testMockingValidator  — bad test mocking prevention (BLOCK)
 *   7. appCheckValidator     — missing App Check in Cloud Functions (WARN)
 *   8. typescriptStrictCheck — `any` type usage (WARN)
 *   9. repositoryPatternCheck — Firestore queries in components (WARN)
 *  10. agentTriggerEnforcer  — track modifications, suggest agents (SUGGEST)
 *
 * Output protocol: "ok" to stdout = success, "block: reason" = block, warnings to stderr.
 */

const fs = require("node:fs");
const path = require("node:path");

// ─── Optional dependency: sanitizeFilesystemError ────────────────────────────
let sanitizeFilesystemError;
try {
  ({ sanitizeFilesystemError } = require("../../scripts/lib/validate-paths.js"));
} catch {
  sanitizeFilesystemError = (err) =>
    (err instanceof Error ? err.message : String(err)).slice(0, 200);
}

// ─── Optional dependency: loadConfigWithRegex (for agent-trigger-enforcer) ───
let agentTriggersConfig = { reviewChangeThreshold: 5, agentTriggers: [] };
try {
  const { loadConfigWithRegex } = require("../../scripts/config/load-config");
  agentTriggersConfig = loadConfigWithRegex("agent-triggers");
} catch {
  // Config unavailable — agent trigger enforcer will be a no-op
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SHARED: Parse args ONCE
// ═══════════════════════════════════════════════════════════════════════════════

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const toolName = (process.env.CLAUDE_TOOL || "edit").toLowerCase();
const isWriteTool = toolName === "write";

const rawArg = process.argv[2] || "";
if (!rawArg) {
  console.log("ok");
  process.exit(0);
}

let filePath = "";
let argContent = "";

if (rawArg.trimStart().startsWith("{")) {
  try {
    const parsed = JSON.parse(rawArg);
    filePath = parsed.file_path || "";
    argContent = parsed.content || "";
  } catch {
    filePath = rawArg;
  }
} else {
  filePath = rawArg;
}

if (!filePath) {
  console.log("ok");
  process.exit(0);
}

// ─── Security checks ONCE ────────────────────────────────────────────────────
if (filePath.startsWith("-") || filePath.includes("\n") || filePath.includes("\r")) {
  console.log("ok");
  process.exit(0);
}

filePath = filePath.replace(/\\/g, "/");

if (
  path.isAbsolute(filePath) ||
  /^[A-Za-z]:\//.test(filePath) ||
  /(?:^|\/)\.\.(?:\/|$)/.test(filePath)
) {
  console.log("ok");
  process.exit(0);
}

const resolvedPath = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, resolvedPath);
if (rel === "" || /^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
  console.log("ok");
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SHARED: File characteristics (computed ONCE)
// ═══════════════════════════════════════════════════════════════════════════════

const ext = path.extname(filePath);
const filename = path.basename(filePath).toLowerCase();
const pathLower = filePath.toLowerCase();

const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename) || /__tests__\//.test(filePath);
const isCodeFile = /\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/.test(filename);
const isTsFile = /\.(ts|tsx)$/.test(filePath);
const isTsxFile = /\.tsx$/.test(filePath);
const isJsTsFile = /\.(ts|tsx|js|jsx)$/.test(filePath);
const isPatternCheckable = /\.(js|ts|tsx|jsx|sh|yml|yaml)$/.test(filePath);
const isMarkdownFile = /\.md$/.test(filename);
const isDtsFile = /\.d\.ts$/.test(filePath);
const isConfigFile = /\.(env|env\..+|config|cfg|ini|yaml|yml|json)$/.test(filename);

// Lazy content reader — reads file from disk at most once
let _contentCache;
let _contentLoaded = false;
function getContent() {
  if (_contentLoaded) return _contentCache;
  _contentLoaded = true;
  if (argContent) {
    _contentCache = argContent;
    return _contentCache;
  }
  const fullPath = path.resolve(projectDir, filePath);
  try {
    _contentCache = fs.readFileSync(fullPath, "utf8");
  } catch {
    _contentCache = "";
  }
  return _contentCache;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Validator definitions
// ═══════════════════════════════════════════════════════════════════════════════

let blockReason = "";

/**
 * Run a validator function safely. If it throws, log to stderr and continue.
 * Returns true if it set a block.
 */
function runValidator(name, fn) {
  if (blockReason) return; // already blocked, skip
  try {
    fn();
  } catch (err) {
    console.error(`[post-write-validator] ${name} error: ${sanitizeFilesystemError(err)}`);
  }
}

// ─── Validator 5: firestoreWriteBlock (BLOCK) ────────────────────────────────

function firestoreWriteBlock() {
  if (!isJsTsFile) return;

  const ALLOWED_PATHS = [
    /^app\/admin\//,
    /^functions\/src\//,
    /^scripts\//,
    /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    /__tests__\//,
    /__mocks__\//,
  ];
  if (ALLOWED_PATHS.some((p) => p.test(filePath))) return;

  const content = getContent();
  if (!content) return;

  const PROTECTED_COLLECTIONS = [
    "journal",
    "daily_logs",
    "inventoryEntries",
    "goals",
    "reflections",
    "users",
  ];

  const FIRESTORE_WRITE_PATTERNS = [
    /addDoc\s*\(\s*collection\s*\([^,]+,\s*["'`](\w+)["'`]\)/g,
    /setDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
    /updateDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
    /deleteDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
    /\.collection\s*\(\s*["'`](\w+)["'`]\s*\)\s*\.\s*(?:add|set|update|delete)/g,
  ];

  const violations = [];
  for (const pattern of FIRESTORE_WRITE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (PROTECTED_COLLECTIONS.includes(match[1])) {
        violations.push({
          collection: match[1],
          matchedText: match[0].slice(0, 60) + (match[0].length > 60 ? "..." : ""),
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error("");
    console.error("\u274c  FIRESTORE WRITE BLOCKED");
    console.error("\u2501".repeat(30));
    console.error(`File: ${filePath}`);
    console.error("");
    console.error("Direct writes to protected collections are prohibited.");
    console.error("Use Cloud Functions (httpsCallable) instead.");
    console.error("");
    console.error("Violations found:");
    for (const v of violations) {
      console.error(`  - Collection: "${v.collection}"`);
      console.error(`    Pattern: ${v.matchedText}`);
    }
    console.error("");
    console.error("Correct pattern:");
    console.error('  const addEntry = httpsCallable(functions, "addJournalEntry");');
    console.error("  await addEntry({ content: ... });");
    console.error("");
    console.error("See: CLAUDE.md Section 2, docs/SERVER_SIDE_SECURITY.md");
    console.error("\u2501".repeat(30));
    blockReason = "Direct Firestore writes to protected collections are not allowed";
  }
}

// ─── Validator 6: testMockingValidator (BLOCK) ───────────────────────────────

function testMockingValidator() {
  if (!isTestFile) return;
  // Admin/functions/scripts test files are allowed
  if (/^(?:app\/admin|functions)\//.test(filePath) || /^scripts\//.test(filePath)) return;

  const content = getContent();
  if (!content) return;

  const BAD_MOCK_PATTERNS = [
    /vi\.mock\s*\(\s*["']firebase\/firestore["']/,
    /jest\.mock\s*\(\s*["']firebase\/firestore["']/,
    /vi\.mock\s*\(\s*["']@firebase\/firestore["']/,
    /jest\.mock\s*\(\s*["']@firebase\/firestore["']/,
  ];

  const found = BAD_MOCK_PATTERNS.some((p) => p.test(content));
  if (found) {
    console.error("");
    console.error("\u274c  TEST MOCKING BLOCKED");
    console.error("\u2501".repeat(28));
    console.error(`File: ${filePath}`);
    console.error("");
    console.error("Tests must mock httpsCallable, NOT firebase/firestore directly.");
    console.error("This ensures tests validate security layers.");
    console.error("");
    console.error("Bad pattern detected:");
    console.error('  vi.mock("firebase/firestore") or jest.mock("firebase/firestore")');
    console.error("");
    console.error("Correct pattern:");
    console.error('  vi.mock("firebase/functions", () => ({');
    console.error("    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),");
    console.error("  }));");
    console.error("");
    console.error("See: docs/agent_docs/CODE_PATTERNS.md #5");
    console.error("\u2501".repeat(28));
    blockReason = "Tests must mock httpsCallable, not firebase/firestore directly";
  }
}

// ─── Validator 2: auditS0S1 (WARN/BLOCK, Write only) ────────────────────────

function auditS0S1() {
  if (!isWriteTool) return;

  // Fast path: skip if arg doesn't contain audit markers
  const argNorm = rawArg.replace(/\\/g, "/").toLowerCase();
  if (!argNorm.includes("docs/audits") || !argNorm.includes(".jsonl")) return;

  // Check file path pattern
  const normalized = filePath.replace(/\\/g, "/");
  if (
    !/^docs\/audits\/[^.][^/]*\.jsonl$|^docs\/audits\/[^.][^/]*\/[^.][^/]*\.jsonl$/.test(normalized)
  )
    return;

  const ROLLOUT_MODE = (process.env.AUDIT_S0S1_MODE || "WARN").trim().toUpperCase();
  const EFFECTIVE_MODE = ROLLOUT_MODE === "BLOCK" ? "BLOCK" : "WARN";

  // Resolve and verify file
  const fullPath = path.resolve(projectDir, normalized);
  const relCheck = path.relative(projectDir, fullPath);
  if (relCheck === "" || /^\.\.(?:[/\\]|$)/.test(relCheck) || path.isAbsolute(relCheck)) return;

  // Reject symlinks
  try {
    const stats = fs.lstatSync(fullPath);
    if (stats.isSymbolicLink()) return;
  } catch {
    return; // File doesn't exist yet
  }

  let content;
  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch {
    return;
  }

  // Parse JSONL
  const findings = [];
  const lines = content.split("\n").filter((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    try {
      const f = JSON.parse(line);
      findings.push({ ...f, _lineNumber: i + 1 });
    } catch {
      findings.push({ _parseError: true, _lineNumber: i + 1 });
    }
  }

  const s0s1 = findings.filter((f) => f.severity === "S0" || f.severity === "S1");
  if (s0s1.length === 0) return;

  const VALID_FIRST_PASS = new Set(["grep", "tool_output", "file_read", "code_search"]);
  const VALID_SECOND_PASS = new Set([
    "contextual_review",
    "exploitation_test",
    "manual_verification",
  ]);
  const VALID_TOOLS = new Set([
    "eslint",
    "sonarcloud",
    "npm_audit",
    "patterns_check",
    "typescript",
    "NONE",
  ]);

  const violations = [];
  for (const f of s0s1) {
    const prefix = `${f.id || "unknown"} (${f.severity})`;
    if (f.confidence === "LOW")
      violations.push({ message: `${prefix}: LOW confidence not allowed for S0/S1` });
    if (f.cross_ref === "MANUAL_ONLY")
      violations.push({ message: `${prefix}: MANUAL_ONLY not allowed for S0/S1` });
    if (!f.verification_steps) {
      violations.push({ message: `${prefix}: Missing verification_steps` });
      continue;
    }
    const vs = f.verification_steps;
    if (!vs.first_pass) {
      violations.push({ message: `${prefix}: Missing first_pass` });
    } else {
      if (!VALID_FIRST_PASS.has(vs.first_pass.method))
        violations.push({ message: `${prefix}: Invalid first_pass.method` });
      if (
        !Array.isArray(vs.first_pass.evidence_collected) ||
        vs.first_pass.evidence_collected.length < 1
      )
        violations.push({ message: `${prefix}: Empty first_pass.evidence_collected` });
    }
    if (!vs.second_pass) {
      violations.push({ message: `${prefix}: Missing second_pass` });
    } else {
      if (!VALID_SECOND_PASS.has(vs.second_pass.method))
        violations.push({ message: `${prefix}: Invalid second_pass.method` });
      if (vs.second_pass.confirmed !== true)
        violations.push({ message: `${prefix}: second_pass.confirmed must be true` });
    }
    if (!vs.tool_confirmation) {
      violations.push({ message: `${prefix}: Missing tool_confirmation` });
    } else {
      if (!VALID_TOOLS.has(vs.tool_confirmation.tool))
        violations.push({ message: `${prefix}: Invalid tool_confirmation.tool` });
      if (!vs.tool_confirmation.reference?.trim())
        violations.push({ message: `${prefix}: Missing tool_confirmation.reference` });
    }
    if (!Array.isArray(f.evidence) || f.evidence.length < 2)
      violations.push({ message: `${prefix}: Need >= 2 evidence items` });
  }

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  S0/S1 AUDIT VALIDATION");
    console.error("\u2501".repeat(28));
    console.error(`Found ${violations.length} issue(s) in ${s0s1.length} S0/S1 finding(s):\n`);
    for (const v of violations.slice(0, 5)) {
      console.error(`   \u274c ${v.message}`);
    }
    if (violations.length > 5) console.error(`   ... and ${violations.length - 5} more`);
    console.error("");
    console.error("S0/S1 findings require verification_steps. See:");
    console.error("  docs/templates/JSONL_SCHEMA_STANDARD.md#s0s1-verification-extension");
    console.error("\u2501".repeat(28));

    if (EFFECTIVE_MODE === "BLOCK") {
      blockReason = "S0/S1 audit validation failed";
    }
  }
}

// ─── Validator 3: patternCheck (WARN) ────────────────────────────────────────

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

function patternCheck() {
  if (!isPatternCheckable) return;

  const fullPath = path.resolve(projectDir, filePath);

  // Pre-check file size
  let size;
  try {
    ({ size } = fs.statSync(fullPath));
  } catch {
    return;
  }
  if (size < 8 * 1024 || size > 512 * 1024) return;

  const content = getContent();
  if (!content) return;

  // Skip binary files
  if (content.includes("\0")) return;

  // Count lines
  let lineCount = 1;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) lineCount++;
  }
  if (lineCount < 100) return;

  const violations = checkInlinePatterns(content, filePath, ext);

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  PATTERN CHECK REMINDER");
    console.error("\u2501".repeat(28));
    console.error(`\ud83d\udcc4 ${filePath}`);
    for (const v of violations.slice(0, 5)) {
      console.error(`   Line ${v.line}: ${v.message}`);
      console.error(`   \u2713 Fix: ${v.fix}`);
    }
    if (violations.length > 5) console.error(`   ... and ${violations.length - 5} more`);
    console.error("");
    console.error(
      "Review docs/agent_docs/CODE_PATTERNS.md (\ud83d\udd34 = critical) for documented patterns."
    );
    console.error("\u2501".repeat(28));
  }
}

// ─── Validator 4: componentSizeCheck (WARN) ──────────────────────────────────

function componentSizeCheck() {
  if (!isTsxFile) return;
  if (!/^(?:app|components)\//.test(filePath)) return;
  if (/\.(test|spec)\.tsx$/.test(filePath)) return;

  const content = getContent();
  if (!content) return;

  const lineCount = content.split("\n").length;
  const isFormComponent = /Form\.tsx$/.test(filePath) || /form/i.test(filePath);
  const threshold = isFormComponent ? 500 : 300;

  if (lineCount > threshold) {
    console.error("");
    console.error("\u26a0\ufe0f  COMPONENT SIZE WARNING");
    console.error("\u2501".repeat(28));
    console.error(`File: ${filePath}`);
    console.error(`Lines: ${lineCount} (threshold: ${threshold})`);
    console.error("");
    console.error("Consider splitting into smaller components:");
    console.error("  - Extract sub-components for distinct UI sections");
    console.error("  - Move business logic to custom hooks");
    console.error("  - Extract utility functions to separate files");
    console.error("");
    console.error("See: docs/agent_docs/CODE_PATTERNS.md for component patterns");
    console.error("\u2501".repeat(28));
  }
}

// ─── Validator 7: appCheckValidator (WARN) ───────────────────────────────────

function appCheckValidator() {
  if (!/^functions\/src\/.*\.ts$/.test(filePath)) return;
  if (/\.(test|spec)\.ts$/.test(filePath)) return;

  const content = getContent();
  if (!content) return;

  if (!/\bonCall\s*[<(]/.test(content)) return;

  const APP_CHECK_PATTERNS = [
    /context\.app/,
    /withSecurityChecks/,
    /requireAppCheck/,
    /App\s*Check/i,
  ];

  if (!APP_CHECK_PATTERNS.some((p) => p.test(content))) {
    console.error("");
    console.error("\u26a0\ufe0f  APP CHECK WARNING");
    console.error("\u2501".repeat(25));
    console.error(`File: ${filePath}`);
    console.error("");
    console.error("Cloud Function uses onCall but may not verify App Check.");
    console.error("");
    console.error("When App Check is re-enabled, add verification:");
    console.error("  if (!context.app) {");
    console.error('    throw new HttpsError("failed-precondition", "App Check required");');
    console.error("  }");
    console.error("");
    console.error("Or use the withSecurityChecks wrapper which handles this.");
    console.error("");
    console.error("Note: App Check is currently DISABLED per ROADMAP.md M2.");
    console.error("See: docs/reviews/2026-Q1/canonical/tier2-output/APP_CHECK_REENABLE_PLAN.md");
    console.error("\u2501".repeat(25));
  }
}

// ─── Validator 8: typescriptStrictCheck (WARN) ───────────────────────────────

function typescriptStrictCheck() {
  if (!isTsFile) return;
  if (isDtsFile || isTestFile) return;
  if (/^scripts\//.test(filePath)) return;

  const content = getContent();
  if (!content) return;

  const ANY_PATTERNS = [
    /:\s*any(?:\s*[;,)\]}]|\s*$)/,
    /\s+as\s+any(?:\s*[;,)\]}]|\s*$)/,
    /<any>/,
    /:\s*any\[\]/,
    /\)\s*:\s*any\s*[{=>]/,
  ];

  const violations = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    if (/eslint-disable.*@typescript-eslint\/no-explicit-any/.test(line)) continue;

    for (const pattern of ANY_PATTERNS) {
      if (pattern.test(line)) {
        const match = line.trim().slice(0, 60);
        violations.push({ line: i + 1, snippet: match + (line.length > 60 ? "..." : "") });
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  TYPESCRIPT STRICT MODE WARNING");
    console.error("\u2501".repeat(35));
    console.error(`File: ${filePath}`);
    console.error(`Found ${violations.length} use(s) of \`any\` type:`);
    console.error("");
    for (const v of violations.slice(0, 5)) {
      console.error(`  Line ${v.line}: ${v.snippet}`);
    }
    if (violations.length > 5) console.error(`  ... and ${violations.length - 5} more`);
    console.error("");
    console.error("Suggestions:");
    console.error("  - Use `unknown` instead of `any` when type is truly unknown");
    console.error("  - Define proper types/interfaces");
    console.error("  - Use generics for flexible typing");
    console.error("  - Add eslint-disable comment if `any` is intentional");
    console.error("");
    console.error("See: tsconfig.json strict mode settings");
    console.error("\u2501".repeat(35));
  }
}

// ─── Validator 9: repositoryPatternCheck (WARN) ──────────────────────────────

function repositoryPatternCheck() {
  if (!isTsxFile) return;

  const ALLOWED_PATHS = [
    /^lib\//,
    /^app\/admin\//,
    /^functions\//,
    /^scripts\//,
    /^hooks\//,
    /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    /__tests__\//,
  ];
  if (ALLOWED_PATHS.some((p) => p.test(filePath))) return;

  const content = getContent();
  if (!content) return;

  if (!/from\s+["']firebase\/firestore["']/.test(content)) return;

  const FIRESTORE_QUERY_METHODS = [
    "collection",
    "doc",
    "query",
    "getDocs",
    "getDoc",
    "addDoc",
    "setDoc",
    "updateDoc",
    "deleteDoc",
    "where",
    "orderBy",
    "limit",
    "startAfter",
    "endBefore",
  ];

  const violations = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*import\s/.test(line) || /^\s*(\/\/|\/\*|\*)/.test(line)) continue;

    for (const method of FIRESTORE_QUERY_METHODS) {
      const pattern = new RegExp(`\\b${method}\\s*[(<]`);
      if (pattern.test(line)) {
        violations.push({
          line: i + 1,
          method,
          snippet: line.trim().slice(0, 50) + (line.length > 50 ? "..." : ""),
        });
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  REPOSITORY PATTERN WARNING");
    console.error("\u2501".repeat(32));
    console.error(`File: ${filePath}`);
    console.error("");
    console.error("Firestore queries detected in React component.");
    console.error("Move queries to lib/firestore-service.ts per CLAUDE.md Section 3.");
    console.error("");
    console.error("Violations:");
    for (const v of violations.slice(0, 3)) {
      console.error(`  Line ${v.line}: ${v.method}() - ${v.snippet}`);
    }
    if (violations.length > 3) console.error(`  ... and ${violations.length - 3} more`);
    console.error("");
    console.error("Correct pattern:");
    console.error("  // In lib/firestore-service.ts");
    console.error("  export async function getJournalEntries(userId: string) { ... }");
    console.error("");
    console.error("  // In component");
    console.error('  import { getJournalEntries } from "@/lib/firestore-service";');
    console.error("");
    console.error("See: CLAUDE.md Section 3, ARCHITECTURE.md");
    console.error("\u2501".repeat(32));
  }
}

// ─── Validator 1: checkRequirements (SUGGEST) ────────────────────────────────

function checkRequirements() {
  const isTestDir = /__tests__|\/test\/|\/tests\/|\/spec\//.test(pathLower);

  const securityKeywordsBase =
    /(^|[^a-z0-9])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto)([^a-z0-9]|$)/;
  const securityKeywordsExtended =
    /(^|[^a-z0-9])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto|keys?|cert|certificate|ssl|tls|hash|hmac)([^a-z0-9]|$)/;
  const securityFilenames = /^(\.env|secrets|credentials|auth|token|keys?|cert|certificate)/;

  const isSecuritySensitive = isWriteTool
    ? securityKeywordsBase.test(pathLower)
    : securityKeywordsExtended.test(pathLower) || securityFilenames.test(filename);

  const hasSensitiveName =
    /(secret|credential|auth|key|token|password)/.test(filename) || filename.startsWith(".env");

  let suggestion = "";

  if (isWriteTool) {
    if (isTestFile)
      suggestion = "POST-TASK: SHOULD run test-engineer agent to validate test strategy";
    else if (isSecuritySensitive)
      suggestion = "POST-TASK: MUST run security-auditor agent before committing";
    else if (isCodeFile) suggestion = "POST-TASK: MUST run code-reviewer agent before committing";
    else if (isMarkdownFile)
      suggestion = "POST-TASK: SHOULD run technical-writer agent for quality check";
    else if (isConfigFile && hasSensitiveName)
      suggestion = "POST-TASK: SHOULD review for sensitive data exposure";
  } else {
    if (isSecuritySensitive)
      suggestion = "POST-TASK: MUST run security-auditor agent before committing";
    else if (isTestFile || isTestDir)
      suggestion = "POST-TASK: SHOULD run test-engineer agent to validate tests";
    else if (isCodeFile) suggestion = "POST-TASK: MUST run code-reviewer agent before committing";
    else if (isMarkdownFile)
      suggestion = "POST-TASK: SHOULD run technical-writer agent for quality check";
  }

  if (suggestion) {
    console.error(suggestion);
  }
}

// ─── Validator 10: agentTriggerEnforcer (SUGGEST) ────────────────────────────

function agentTriggerEnforcer() {
  const AGENT_TRIGGERS = agentTriggersConfig.agentTriggers;
  const REVIEW_CHANGE_THRESHOLD = agentTriggersConfig.reviewChangeThreshold;

  if (!AGENT_TRIGGERS || AGENT_TRIGGERS.length === 0) return;

  const applicableAgents = AGENT_TRIGGERS.filter((trigger) => {
    if (!trigger.pattern.test(filePath)) return false;
    if (trigger.excludePaths.some((exclude) => exclude.test(filePath))) return false;
    return true;
  });

  if (applicableAgents.length === 0) return;

  const STATE_FILE = ".claude/hooks/.agent-trigger-state.json";
  const REVIEW_QUEUE_FILE = ".claude/state/pending-reviews.json";

  // Read state
  const statePath = path.join(projectDir, STATE_FILE);
  let state = { uses: 0, firstUse: null, lastUse: null, suggestedAgents: {}, phase: 1 };
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    // Use default
  }

  // Normalize persisted state shape (defensive against corrupted/manual edits)
  if (!state || typeof state !== "object") {
    state = { uses: 0, firstUse: null, lastUse: null, suggestedAgents: {}, phase: 1 };
  }
  if (
    !state.suggestedAgents ||
    typeof state.suggestedAgents !== "object" ||
    Array.isArray(state.suggestedAgents)
  ) {
    state.suggestedAgents = {};
  }

  state.uses = Number.isFinite(Number(state.uses)) ? Number(state.uses) + 1 : 1;
  state.phase = Number.isFinite(Number(state.phase))
    ? Math.min(3, Math.max(1, Math.trunc(Number(state.phase))))
    : 1;
  if (!state.firstUse) state.firstUse = new Date().toISOString();
  state.lastUse = new Date().toISOString();

  const sessionKey = new Date().toISOString().split("T")[0];
  if (!Array.isArray(state.suggestedAgents[sessionKey])) state.suggestedAgents[sessionKey] = [];

  // Prune suggestedAgents entries older than 30 days (Review #289)
  const PRUNE_DAYS = 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PRUNE_DAYS);
  const cutoffKey = cutoff.toISOString().split("T")[0];
  for (const key of Object.keys(state.suggestedAgents)) {
    if (key < cutoffKey) delete state.suggestedAgents[key];
  }

  const newAgents = applicableAgents.filter(
    (agent) => !state.suggestedAgents[sessionKey].includes(agent.agent)
  );

  for (const agent of newAgents) {
    state.suggestedAgents[sessionKey].push(agent.agent);
  }

  // Phase transition check
  const now = Date.now();
  const firstUse = state.firstUse ? new Date(state.firstUse).getTime() : now;
  const daysSinceFirstUse = Math.floor((now - firstUse) / (1000 * 60 * 60 * 24));
  let phaseTransition = null;
  if (state.phase === 1 && (state.uses >= 50 || daysSinceFirstUse >= 30)) {
    phaseTransition = {
      message: `Agent Trigger Enforcer has been active for ${state.uses} uses / ${daysSinceFirstUse} days`,
      recommendation: "Consider upgrading to Phase 2 (WARNING mode) for stronger guidance",
    };
  } else if (state.phase === 2 && (state.uses >= 100 || daysSinceFirstUse >= 60)) {
    phaseTransition = {
      message: `Agent Trigger Enforcer has been active for ${state.uses} uses / ${daysSinceFirstUse} days`,
      recommendation: "Consider upgrading to Phase 3 (BLOCKING mode) for enforcement",
    };
  }

  // Write state (atomic: tmp + rename)
  const tmpPath = `${statePath}.tmp`;
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.rmSync(statePath, { force: true });
    } catch {
      /* best-effort */
    }
    fs.renameSync(tmpPath, statePath);
  } catch {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      /* cleanup */
    }
  }

  // Output suggestions
  if (newAgents.length > 0) {
    console.error("");
    console.error("\u{1F4A1}  AGENT SUGGESTION (Phase 1)");
    console.error("\u2501".repeat(28));
    console.error(`File: ${filePath}`);
    console.error("");
    console.error("Recommended agents for this work:");
    for (const agent of newAgents) {
      console.error(`  \u2192 ${agent.agent}: ${agent.description}`);
    }
    console.error("");
    console.error("Invoke with: Task tool using the agent type");
    console.error("Or use /code-reviewer skill after completing changes");
    console.error("\u2501".repeat(28));
  }

  if (phaseTransition) {
    console.error("");
    console.error("\u{1F4E2}  PHASE TRANSITION NOTIFICATION");
    console.error("\u2501".repeat(35));
    console.error(phaseTransition.message);
    console.error("");
    console.error(`Recommendation: ${phaseTransition.recommendation}`);
    console.error("");
    console.error("Current phases:");
    console.error("  Phase 1 (current): SUGGEST - non-blocking suggestions");
    console.error("  Phase 2: WARN - prominent warnings, still non-blocking");
    console.error("  Phase 3: BLOCK - require agent invocation before push");
    console.error("");
    console.error("To upgrade, update agent-trigger-enforcer.js phase config");
    console.error("\u2501".repeat(35));
  }

  // Delegated code review queue
  if (applicableAgents.some((a) => a.agent === "code-reviewer")) {
    const reviewQueuePath = path.join(projectDir, REVIEW_QUEUE_FILE);
    let reviewQueue = { files: [], queued: false, lastQueued: null };
    try {
      reviewQueue = JSON.parse(fs.readFileSync(reviewQueuePath, "utf8"));
      if (!Array.isArray(reviewQueue.files)) reviewQueue.files = [];
    } catch {
      // Use default
    }

    const normalizedFile = path
      .relative(projectDir, path.resolve(projectDir, filePath))
      .split(path.sep)
      .join("/");

    if (!reviewQueue.files.includes(normalizedFile)) {
      reviewQueue.files.push(normalizedFile);
    }

    if (reviewQueue.files.length >= REVIEW_CHANGE_THRESHOLD && !reviewQueue.queued) {
      reviewQueue.queued = true;
      reviewQueue.lastQueued = new Date().toISOString();

      console.error("");
      console.error("\u{1F4CB}  DELEGATED REVIEW QUEUED");
      console.error("\u2501".repeat(30));
      console.error(`  ${reviewQueue.files.length} code files modified this session.`);
      console.error("  Consider spawning a code-reviewer subagent:");
      console.error("");
      console.error("  Task({ subagent_type: 'code-reviewer',");
      console.error("    description: 'Review session changes',");
      console.error("    prompt: '<diff of changes>' })");
      console.error("");
      console.error("  Or run /code-reviewer before committing.");
      console.error("  Review queue: .claude/state/pending-reviews.json");
      console.error("\u2501".repeat(30));
    }

    // Write review queue (atomic)
    const tmpReviewPath = `${reviewQueuePath}.tmp`;
    try {
      fs.mkdirSync(path.dirname(reviewQueuePath), { recursive: true });
      fs.writeFileSync(tmpReviewPath, JSON.stringify(reviewQueue, null, 2));
      try {
        fs.rmSync(reviewQueuePath, { force: true });
      } catch {
        /* best-effort */
      }
      fs.renameSync(tmpReviewPath, reviewQueuePath);
    } catch {
      try {
        fs.rmSync(tmpReviewPath, { force: true });
      } catch {
        /* cleanup */
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Run validators: BLOCKING first, then WARN, then SUGGEST
// ═══════════════════════════════════════════════════════════════════════════════

// BLOCKING validators — fail fast
runValidator("firestoreWriteBlock", firestoreWriteBlock);
runValidator("testMockingValidator", testMockingValidator);

if (blockReason) {
  console.log(`block: ${blockReason}`);
  process.exit(0);
}

// WARN/BLOCK validators
runValidator("auditS0S1", auditS0S1);

if (blockReason) {
  console.log(`block: ${blockReason}`);
  process.exit(0);
}

// WARN validators
runValidator("patternCheck", patternCheck);
runValidator("componentSizeCheck", componentSizeCheck);
runValidator("appCheckValidator", appCheckValidator);
runValidator("typescriptStrictCheck", typescriptStrictCheck);
runValidator("repositoryPatternCheck", repositoryPatternCheck);

// SUGGEST validators
runValidator("checkRequirements", checkRequirements);
runValidator("agentTriggerEnforcer", agentTriggerEnforcer);

// Final output
console.log("ok");
