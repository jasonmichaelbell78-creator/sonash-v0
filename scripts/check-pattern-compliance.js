#!/usr/bin/env node
/**
 * Pattern Compliance Checker
 *
 * Scans code for known anti-patterns documented in claude.md and AI_REVIEW_LEARNINGS_LOG.md
 * This is a learning reinforcement tool - it surfaces patterns that have caused issues before.
 *
 * NOTE: Patterns in this file are aligned with CODE_PATTERNS.md v2.1 (2026-01-18)
 *       See docs/agent_docs/CODE_PATTERNS.md for full pattern reference with priority tiers.
 *
 * Usage: node scripts/check-pattern-compliance.js [options] [files...]
 *
 * Options:
 *   --staged     Check only git staged files
 *   --all        Check all relevant files in the repo
 *   --verbose    Show detailed output
 *   --json       Output as JSON
 *
 * Exit codes: 0 = no violations, 1 = violations found, 2 = error
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
  lstatSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join, dirname, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Load verified pattern exclusions from JSON config (single source of truth)
const require = createRequire(import.meta.url);
const { loadConfig } = require("./config/load-config.js");
let verifiedPatterns;
try {
  verifiedPatterns = loadConfig("verified-patterns");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load verified-patterns config: ${msg}`);
  process.exit(2);
}

// Graduation system: warn once per file, block on repeat
// State file tracks which files have been warned for which patterns
const WARNED_FILES_PATH = join(ROOT, ".claude", "state", "warned-files.json");

function loadWarnedFiles() {
  try {
    const raw = readFileSync(WARNED_FILES_PATH, "utf-8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : null;
    if (code === "ENOENT") return {};
    // Non-ENOENT error (corrupt file, permission issue) — return null
    // so caller preserves existing state instead of wiping it
    console.warn(`Warning: could not load pattern warning state: ${sanitizeError(err)}`);
    return null;
  }
}

/**
 * Best-effort file removal (swallows errors).
 */
function tryUnlink(filePath) {
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch (_err) {
    // Best-effort — ignore failures
  }
}

/**
 * Check if a path is a symlink (returns false if path doesn't exist).
 */
function isSymlink(filePath) {
  try {
    return existsSync(filePath) && lstatSync(filePath).isSymbolicLink();
  } catch (_err) {
    return false;
  }
}

function saveWarnedFiles(warned) {
  const dir = dirname(WARNED_FILES_PATH);
  const tmpPath = WARNED_FILES_PATH + `.tmp.${process.pid}`;
  const bakPath = WARNED_FILES_PATH + `.bak.${process.pid}`;

  try {
    // Refuse if state directory is a symlink
    if (isSymlink(dir)) {
      console.warn("Warning: state directory is a symlink — refusing to write");
      return;
    }

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // Verify target and tmp are not symlinks (prevent symlink-clobber attacks)
    if (isSymlink(WARNED_FILES_PATH) || isSymlink(tmpPath)) {
      console.warn("Warning: state file or tmp is a symlink — refusing to write");
      return;
    }

    writeFileSync(tmpPath, JSON.stringify(warned, null, 2), "utf-8");

    // Backup-and-replace: rename existing to .bak, then swap in new file
    try {
      if (existsSync(WARNED_FILES_PATH)) renameSync(WARNED_FILES_PATH, bakPath);
    } catch (_err) {
      // If backup fails, proceed; renameSync may still work
    }

    renameSync(tmpPath, WARNED_FILES_PATH);
    tryUnlink(bakPath);
  } catch (err) {
    tryUnlink(tmpPath);
    // Restore backup if destination is gone
    try {
      if (existsSync(bakPath) && !existsSync(WARNED_FILES_PATH))
        renameSync(bakPath, WARNED_FILES_PATH);
    } catch (_err) {
      // Best-effort restore
    }
    console.warn(`Warning: could not save pattern warning state: ${sanitizeError(err)}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const STAGED = args.includes("--staged");
const ALL = args.includes("--all");
const VERBOSE = args.includes("--verbose");
const JSON_OUTPUT = args.includes("--json");
const FILES = args.filter((a) => !a.startsWith("--"));

/**
 * Global excludes - development utility scripts with pre-existing technical debt
 * These scripts are rarely run and flagged for incremental cleanup (see ROADMAP.md)
 * Pattern: relative path regexes matched against file path
 */
const GLOBAL_EXCLUDE = [
  // Documentation files that contain pattern examples (not violations)
  /^docs\/AI_REVIEW_LEARNINGS_LOG\.md$/,
  // This file contains pattern definitions as strings (meta-detection false positives)
  /^scripts\/check-pattern-compliance\.js$/,
  // Archived/obsolete scripts - not actively maintained (Review #250)
  /^docs\/archive\//,
  // Development/build utility scripts (pre-existing debt - Review #136)
  /^scripts\/ai-review\.js$/,
  /^scripts\/assign-review-tier\.js$/,
  /^scripts\/check-consolidation-status\.js$/,
  /^scripts\/check-docs-light\.js$/,
  /^scripts\/check-document-sync\.js$/,
  /^scripts\/check-review-needed\.js$/,
  /^scripts\/generate-documentation-index\.js$/,
  /^scripts\/normalize-canon-ids\.js$/,
  /^scripts\/add-false-positive\.js$/,
  /^scripts\/validate-audit\.js$/,
  /^scripts\/validate-canon-schema\.js$/,
  /^scripts\/mcp\/sonarcloud-server\.js$/,
  /^scripts\/update-readme-status\.js$/,
  /^scripts\/archive-doc\.js$/,
  // One-time migration scripts (rarely run)
  /^scripts\/migrate-.*\.ts$/,
  /^scripts\/seed-.*\.ts$/,
  /^scripts\/enrich-.*\.ts$/,
  /^scripts\/import-.*\.ts$/,
  /^scripts\/retry-failures\.ts$/,
  /^scripts\/sync-geocache\.ts$/,
  /^scripts\/set-admin-claim\.ts$/,
  /^scripts\/dedupe-quotes\.ts$/,
  // lighthouse-audit.js: CI reported false positives (lines 272-273 but file has only ~250 lines)
  // The script audits performance, not package management (no actual npm install in file)
  /^scripts\/lighthouse-audit\.js$/,
  // init-artifact.sh: deliberately uses npm/pnpm installs to bootstrap new artifact projects
  // This is a one-time setup script for the artifacts-builder skill
  /^\.claude\/skills\/artifacts-builder\/scripts\/init-artifact\.sh$/,
];

/**
 * Known anti-patterns to check for
 * Each pattern has:
 * - pattern: RegExp to match the anti-pattern
 * - message: Human-readable description
 * - fix: The correct pattern to use
 * - review: Which review(s) documented this
 * - fileTypes: Which file extensions to check
 */
const ANTI_PATTERNS = [
  // Bash/Shell patterns
  {
    id: "exit-code-capture",
    pattern: /\$\(\s*[^)]{1,500}\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
    message:
      "Exit code capture bug: $? after assignment captures assignment exit (always 0), not command exit",
    fix: "Use: if ! OUT=$(cmd); then",
    review: "#4, #14",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "for-file-iteration",
    pattern: /for\s+\w{1,200}\s+in\s+\$\{?\w{1,200}\}?\s{0,50};?\s{0,50}do/g,
    message: "File iteration with for loop breaks on spaces in filenames",
    fix: "Use: while IFS= read -r file; do ... done < file_list",
    review: "#4, #14",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "missing-trap",
    pattern: /mktemp\)(?![\s\S]{0,50}trap)/g,
    message: "Temp file created without trap for cleanup",
    fix: "Add: trap 'rm -f \"$TMPFILE\"' EXIT after mktemp",
    review: "#17, #18",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "retry-loop-no-success-tracking",
    // Use lazy quantifiers and word boundaries for accurate matching
    // Note: Global flag required - checkFile uses exec() in a loop which needs /g to advance lastIndex
    pattern:
      /for\s+\w+\s+in\s+1\s+2\s+3\s*;\s*do[\s\S]{0,120}?&&\s*break[\s\S]{0,80}?done(?![\s\S]{0,80}?(?:\bSUCCESS\b|\bsuccess\b|\bFAILED\b|\bfailed\b))/g,
    message: "Retry loop may silently succeed on failure - not tracking success",
    fix: "Track: SUCCESS=false; for i in 1 2 3; do cmd && { SUCCESS=true; break; }; done; $SUCCESS || exit 1",
    review: "#18, #19, #51",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "npm-install-automation",
    // Capture npm install plus rest of line for exclusion pattern matching
    pattern: /npm\s+install\b[^\n]*/g,
    message: "npm install in automation can modify lockfile",
    fix: "Use: npm ci (reads lockfile exactly)",
    review: "#10, #12",
    fileTypes: [".sh", ".yml", ".yaml"],
    // Exclude installs with flags that are intentional:
    // -g/--global: global installs don't modify project lockfile
    // --save/--save-dev/-D/-S: intentional dependency additions
    // --legacy-peer-deps: explicit peer dep handling
    // Note: --prefer-offline fallback is covered by pathExclude for session-start files
    exclude: /--legacy-peer-deps|--save|--save-dev|-[gDS]\b|--global/,
    // session-start.sh mentions "npm install" in comments and as documented fallback
    // when package-lock.json is missing - this is intentional behavior
    pathExclude: /session-start\.(?:sh|js)$/,
  },

  // JavaScript/TypeScript patterns
  {
    id: "unsafe-error-message",
    // Match catch blocks with .message access that DON'T have instanceof check anywhere in block
    // Uses [^}] to constrain search to current catch block (Review #53: prevents false negatives)
    // Note: May miss deeply nested blocks, but safer than unbounded [\s\S]
    pattern: /catch\s*\(\s*(\w+)\s*\)\s*\{(?![^}]*instanceof\s+Error)[^}]*?\b\1\b\.message/g,
    message: "Unsafe error.message access - crashes if non-Error is thrown",
    fix: "Use: error instanceof Error ? error.message : String(error)",
    review: "#17, #51, #53",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "catch-console-error",
    pattern: /\.catch\s*\(\s*console\.error\s*\)/g,
    message: "Unsanitized error logging - may expose sensitive paths/credentials",
    fix: "Use: .catch((e) => console.error(sanitizeError(e))) or handle specific errors",
    review: "#20",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "path-startswith",
    pattern: /\.startsWith\s*\(\s*['"`][./\\]+['"`]\s*\)/g,
    message: "Path validation with startsWith() fails on Windows or edge cases",
    fix: 'Use: path.relative() and check for ".." prefix with regex',
    review: "#17, #18",
    fileTypes: [".js", ".ts"],
    // Exclude files verified:
    // 2026-01-04:
    // - check-pattern-compliance.js: contains patterns as strings
    // - archive-doc.js: uses startsWith('/'), startsWith('\\') to detect & reject absolute paths
    // - phase-complete-check.js: uses path.relative() THEN startsWith('..') which is correct
    // 2026-01-12 (Review #134):
    // - pattern-check.js: L61,64 check for absolute paths (/, //, drive letters) before path.relative() containment at L98
    // 2026-02-05 (Review #249):
    // - normalize-format.js: L219 startsWith("//") is comment detection, not path validation
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|archive-doc|phase-complete-check|pattern-check|normalize-format)\.js$/,
  },
  {
    id: "regex-global-test-loop",
    pattern:
      /new\s+RegExp\s*\([^)]{1,500},\s*['"`][^'"]{0,200}g[^'"]{0,200}['"`]\s*\)[\s\S]{0,200}\.test\s*\(/g,
    message:
      "Regex with global flag used with .test() in loop - stateful lastIndex causes missed matches",
    fix: 'Remove "g" flag when using .test(), or reset lastIndex between iterations',
    review: "#13, #14",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },

  // GitHub Actions patterns
  {
    id: "unsafe-interpolation",
    pattern: /`[^`]*\$\{\{\s*(?:steps|github|env|inputs)\.[^}]+\}\}[^`]*`/g,
    message: "Unsafe ${{ }} interpolation in JavaScript template literal",
    fix: "Use env: block to pass value, then process.env.VAR",
    review: "#16",
    fileTypes: [".yml", ".yaml"],
  },
  {
    id: "hardcoded-temp-path",
    pattern: /[>|]\s*\/tmp\/\w+(?!\.)/g,
    message: "Hardcoded /tmp path - use mktemp for unique files",
    fix: "Use: TMPFILE=$(mktemp) and trap for cleanup",
    review: "#18",
    fileTypes: [".yml", ".yaml", ".sh"],
  },
  {
    id: "implicit-if-expression",
    pattern: /^\s*if:\s+(?!.{0,500}\$\{\{).{0,500}(?:steps|github|env|inputs|needs)\./gm,
    message: "Implicit expression in if: condition can cause YAML parser issues",
    fix: "Always use explicit ${{ }} in if: conditions",
    review: "#17, #21",
    fileTypes: [".yml", ".yaml"],
    // Review #224: ci.yml verified - all if: conditions use ${{ }} syntax
    // Pattern has false positives on multiline files/with blocks containing github/steps refs
    pathExclude: /(?:^|[\\/])ci\.yml$/,
  },
  {
    id: "fragile-bot-detection",
    pattern: /\.user\.type\s*===?\s*['"`]Bot['"`]/g,
    message: "Fragile bot detection - user.type is unreliable",
    fix: 'Use: user.login === "github-actions[bot]"',
    review: "#15",
    fileTypes: [".yml", ".yaml", ".js", ".ts"],
  },

  // Security patterns
  {
    id: "simple-path-traversal-check",
    pattern: /startsWith\s*\(\s*['"`]\.\.['"`]\s*\)/g,
    message: 'Simple ".." check has false positives (e.g., "..hidden.md")',
    fix: "Use: /^\\.\\.(?:[\\\\/]|$)/.test(rel)",
    review: "#18, #53",
    fileTypes: [".js", ".ts"],
    // NOTE: Do NOT exclude files even if they use path.relative() first.
    // path.relative() CAN return just ".." (no separator) for parent directories.
    // All files must use the proper regex check: /^\.\.(?:[\/\\]|$)/.test(rel)
    // Exclude check-pattern-compliance.js: contains pattern definitions as strings (meta-detection)
    // 2026-02-05 (Review #249): eval-check-stage.js, eval-snapshot.js, unify-findings.js, normalize-format.js
    //   all use /^\.\.(?:[\\/]|$)/.test(relative) in validateSessionPath (not startsWith)
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|eval-check-stage|eval-snapshot|unify-findings|normalize-format)\.js$/,
  },
  {
    id: "hardcoded-api-key",
    pattern:
      /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Z0-9_/+=-]{20,}['"`]/gi,
    message: "Potential hardcoded API key or secret detected",
    fix: "Use environment variables: process.env.API_KEY",
    review: "Security Standards",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    exclude: /(?:test|mock|fake|dummy|example|placeholder|xxx+|your[_-]?api|insert[_-]?your)/i,
  },
  {
    id: "unsafe-innerhtml",
    pattern: /\.innerHTML\s*=/g,
    message: "innerHTML assignment can lead to XSS vulnerabilities",
    fix: "Use textContent for text, or sanitize with DOMPurify for HTML",
    review: "Security Standards",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "eval-usage",
    pattern: /\beval\s*\(/g,
    message: "eval() is a security risk - allows arbitrary code execution",
    fix: "Avoid eval. Use JSON.parse for JSON, or restructure code",
    review: "Security Standards",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    // Exclude check-pattern-compliance.js: contains pattern definitions as strings (meta-detection)
    // 2026-01-20 audit (PR #286):
    // - security-check.js: Contains regex pattern /\beval\s*\(/ at L42 as detection pattern, not actual eval usage
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|security-check)\.js$/,
  },
  {
    id: "sql-injection-risk",
    pattern:
      /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*(?:\$\{|\+\s*)|'[^']*(?:\$\{|\+\s*)|"[^"]*(?:\$\{|\+\s*))/g,
    message: "Potential SQL injection: string interpolation or concatenation in query",
    fix: 'Use parameterized queries with placeholders (e.g., db.query("SELECT * FROM users WHERE id = ?", [userId]))',
    review: "Security Standards",
    fileTypes: [".js", ".ts"],
    // 2026-02-05 (Review #249): generate-views.js uses .get() on Map objects with template strings, not SQL queries
    pathExclude: /(?:^|[\\/])generate-views\.js$/,
  },
  {
    id: "unsanitized-error-response",
    pattern:
      /res\.(?:json|send|status\s*\([^)]*\)\s*\.json)\s*\(\s*\{[\s\S]{0,300}?(?:error|err|e|exception)\.(?:message|stack|toString\s*\()/g,
    message: "Exposing raw error messages/stack traces to clients",
    fix: 'Return sanitized error messages (e.g., "An error occurred"), log full details server-side',
    review: "Security Standards",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "missing-rate-limit-comment",
    pattern:
      /(?:exports\.|module\.exports|export\s+(?:default\s+)?(?:async\s+)?function)\s+\w+(?:Handler|API|Endpoint)/gi,
    message: "API endpoint may need rate limiting (verify rate limit is implemented)",
    fix: "Ensure endpoint has rate limiting per GLOBAL_SECURITY_STANDARDS.md",
    review: "Security Standards",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)(?:pages|app|routes|api|functions)\/.*(?:api|routes|handlers|endpoints)?/i,
  },

  // New patterns from Consolidation #3 (Reviews #31-40)
  {
    id: "path-join-without-containment",
    pattern:
      /path\.join\s*\([^)]{0,500},\s*(?:deliverable|user|input|arg|param|file)\w*(?:\.path)?[^)]{0,500}\)(?![\s\S]{0,100}(?:relative|isWithin|contains|startsWith))/g,
    message: "Path joined with user input without containment check",
    fix: 'Verify path.relative(root, resolved) does not start with ".." or equal ""',
    review: "#33, #34, #38, #39, #40",
    fileTypes: [".js", ".ts"],
    // Review #190: phase-complete-check.js L171 has containment via safeStatCheck→isWithinArchive
    // Review #217 R4: check-doc-headers.js L112 has containment check on L117 (rel === "" || regex || isAbsolute)
    // Review #224: sync-claude-settings.js uses isPathContained helper (L43-48) for all path joins
    // Review #238: transform-jsonl-schema.js L621 `file` comes from readdirSync (not user input),
    //   containment check at L623, symlink check at L627-640
    // Review #249: eval-check-stage.js L254,369 `file` from readdirSync; validated sessionPath upstream
    // Review #249: eval-snapshot.js L137 `file` from readdirSync; VIEWS_DIR is constant
    // Review #250: state-utils.js has validateFilename() basename check before all path.join calls
    // Review #252: eval-sonarcloud-snapshot.js L186 `file` from readdirSync; containment check at L200-201
    pathExclude:
      /(?:^|[\\/])(?:phase-complete-check|check-doc-headers|sync-claude-settings|transform-jsonl-schema|eval-check-stage|eval-snapshot|eval-sonarcloud-snapshot|state-utils)\.js$/,
  },
  {
    id: "error-without-first-line",
    pattern:
      /String\s*\(\s*(?:err|error|e)(?:\?\.message|\s*\?\?\s*err|\s*\?\?\s*error)[\s\S]{0,30}\)(?![\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\))/g,
    message: "Error converted to string without extracting first line (stack trace leakage)",
    fix: 'Use: String(err?.message ?? err).split("\\n")[0].replace(/\\r$/, "")',
    review: "#36, #37, #38",
    fileTypes: [".js", ".ts"],
    // Exclude check-pattern-compliance.js: contains pattern definitions as strings (meta-detection)
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },
  {
    id: "console-log-file-content",
    pattern:
      /console\.(?:log|error|warn)\s*\([^)]*(?:content|fileContent|data|text|body)(?:\s*[,)])/g,
    message: "File-derived content logged without control char sanitization",
    fix: 'Sanitize with: content.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "")',
    review: "#39, #40",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "split-newline-without-cr-strip",
    pattern:
      /\.split\s*\(\s*['"`]\\n['"`]\s*\)\s*\[\s*0\s*\](?![\s\S]{0,30}\.replace\s*\(\s*\/\\r\$\/)/g,
    message: "Line split without stripping trailing \\r (Windows CRLF issue)",
    fix: 'Add: .replace(/\\r$/, "") after split to handle CRLF',
    review: "#39, #40",
    fileTypes: [".js", ".ts"],
    // Exclude files verified 2026-01-04 to have proper CRLF handling:
    // - phase-complete-check.js: L555 has .replace(/\r$/, '')
    // - surface-lessons-learned.js: L372 has .replace(/\r$/, '')
    pathExclude: /(?:^|[\\/])(?:phase-complete-check|surface-lessons-learned)\.js$/,
  },
  {
    id: "regex-newline-lookahead",
    // Match lookaheads in regex literals `(?=\n` and in string patterns `"(?=\\n"`
    pattern: /\(\?=(?:\\n|\\\\n)(?!\?)/g,
    message: "Regex lookahead uses \\n without optional \\r (fails on CRLF)",
    fix: "Use: (?=\\r?\\n for cross-platform line endings",
    review: "#40",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "path-split-without-normalize",
    pattern:
      /\.split\s*\(\s*['"`]\/['"`]\s*\)[\s\S]{0,50}includes\s*\(\s*['"`]\.\.['"`]\s*\)(?![\s\S]{0,100}replace\s*\(\s*\/\\\\\/g)/g,
    message: "Path traversal check splits on / without normalizing Windows backslashes",
    fix: 'First normalize: path.replace(/\\\\/g, "/").split("/").includes("..")',
    review: "#39, #40",
    fileTypes: [".js", ".ts"],
    // Exclude files verified 2026-01-04 to normalize before split:
    // - phase-complete-check.js: L290 has .replace(/\\/g, '/').split('/').includes('..')
    pathExclude: /(?:^|[\\/])phase-complete-check\.js$/,
  },
  {
    id: "readfilesync-without-try",
    // Avoid variable-length lookbehind (engine compatibility); match both fs.readFileSync and readFileSync
    // Note: This pattern has HIGH false positive rate - regex can't detect try/catch context
    // Files with verified proper error handling are excluded below
    pattern: /\b(?:fs\.)?readFileSync\s*\(/g,
    message: "readFileSync without try/catch - existsSync does not guarantee read success",
    fix: "Wrap in try/catch: race conditions, permissions, encoding errors",
    review: "#36, #37",
    fileTypes: [".js", ".ts"],
    // Verified exclusions sourced from scripts/config/verified-patterns.json
    pathExcludeList: verifiedPatterns["readfilesync-without-try"] || [],
  },
  {
    id: "auto-mode-slice-truncation",
    pattern: /(?:isAutoMode|isAuto|autoMode)\s*\?[\s\S]{0,50}\.slice\s*\(\s*0\s*,/g,
    message: "Auto/CI mode should check ALL items, not truncate - limits are for interactive only",
    fix: "Use: isAutoMode ? allItems : allItems.slice(0, MAX)",
    review: "#35",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "readline-no-close",
    pattern:
      /readline\.createInterface\s*\([\s\S]{0,500}process\.exit\s*\(\s*\d+\s*\)(?![\s\S]{0,50}close\s*\()/g,
    message: "Script exits without closing readline interface (may hang)",
    fix: "Create closeRl() helper and call before every process.exit()",
    review: "#33",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "empty-path-not-rejected",
    pattern:
      /(?:startsWith\s*\(\s*['"`]\.\.['"`]\s*\)|\.isAbsolute\s*\(\s*rel\s*\))(?![\s\S]{0,50}===\s*['"`]['"`])/g,
    message: 'Path validation may miss empty string edge case (rel === "")',
    fix: 'Add: rel === "" || rel.startsWith("..") || path.isAbsolute(rel)',
    review: "#40",
    fileTypes: [".js", ".ts"],
    // Exclude files verified to check for empty string (regex looks FORWARD only, misses rel === '' at START):
    // - phase-complete-check.js: L55, L140, L165, L244 all have `rel === '' || rel.startsWith('..')`
    // - .claude/hooks/*.js: All verified 2026-01-12 (Review #134) to have `rel === '' ||` at start of condition
    // - check-pattern-compliance.js: contains pattern definitions as strings (meta-detection)
    // - validate-paths.js: L73 has `rel === "" ||` at start of condition (Review #200)
    // - analyze-learning-effectiveness.js: L1076 has `rel === "" ||` at start of condition (Review #200)
    // - security-helpers.js: L104-108 validates empty/falsy paths upfront + L113 has `rel === "" ||` (Review #202)
    // 2026-01-27 audit (Review #210): check-remote-session-context.js and track-agent-invocation.js
    // both use `/^\.\.(?:[\\/]|$)/.test(rel)` which correctly handles empty rel (same path = valid)
    // 2026-01-27 audit (Review #212):
    // - check-roadmap-health.js: L175 has `rel === "" ||` at start of condition
    // 2026-01-29 audit (Review #217 R4):
    // - check-doc-headers.js: L117 has `rel === "" ||` at start of condition
    // 2026-02-02 audit (Review #224):
    // - statusline.js (hooks/global): L64 has `rel === "" ||` at start of condition
    // - sync-claude-settings.js: L47 has `rel === "" ||` in isPathContained helper
    // 2026-02-03 audit (Review #226 R3):
    // - ai-pattern-checks.js: L82 uses `rel !== "" && (isAbsolute || regex)` - equivalent logic, handles empty
    // 2026-02-05 (Review #249): eval-check-stage.js, eval-snapshot.js, unify-findings.js, normalize-format.js
    //   all have `rel === "" ||` in validateSessionPath
    // 2026-02-06 (Review #256): extract-agent-findings.js L29 has `rel === "" ||` at start of condition
    // 2026-02-06 (Review #258): generate-detailed-sonar-report.js L33 has `rel === "" ||` at start of condition
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|phase-complete-check|check-edit-requirements|check-write-requirements|check-mcp-servers|pattern-check|session-start|validate-paths|analyze-learning-effectiveness|security-helpers|check-remote-session-context|track-agent-invocation|check-roadmap-health|check-doc-headers|statusline|sync-claude-settings|ai-pattern-checks|eval-check-stage|eval-snapshot|unify-findings|normalize-format|extract-agent-findings|generate-detailed-sonar-report)\.js$/,
  },

  // Test patterns from Consolidation #14 (Reviews #180-201)
  {
    id: "test-mock-firestore-directly",
    // Catch vi.mock or jest.mock of firebase/firestore in test files
    // App uses Cloud Functions for writes - mock httpsCallable instead
    pattern: /(?:vi|jest)\.mock\s*\(\s*['"`]firebase\/firestore['"`]/g,
    message:
      "Mocking firebase/firestore directly - app uses Cloud Functions (httpsCallable) for writes",
    fix: 'Mock firebase/functions instead: vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })) }))',
    review: "#185, #180-201 (recurring 6x)",
    fileTypes: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".test.js", ".test.jsx"],
  },

  // --- New patterns from PR Review Churn Analysis (Session #151) ---
  // These patterns were identified from top 20 Qodo findings across 259 reviews

  // Unguarded loadConfig (15x in reviews)
  {
    id: "unguarded-loadconfig",
    pattern: /\b(?:loadConfig|require)\s*\(\s*['"`][^'"`)]+['"`]\s*\)(?![\s\S]{0,30}catch)/g,
    message: "loadConfig/require without try/catch - crashes on missing or malformed config",
    fix: "Wrap in try/catch with graceful fallback or clear error message",
    review: "#36, #37, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only check scripts and hooks (not app code where require is standard)
    pathFilter: /(?:^|\/)(?:scripts|\.claude\/hooks|\.husky)\//,
    // Exclude files with verified error handling
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|load-config)\.js$/,
  },

  // Silent catch blocks (11x in reviews)
  {
    id: "silent-catch-block",
    pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g,
    message: "Empty catch block silently swallows errors - hides bugs",
    fix: "At minimum log the error: catch (err) { console.warn('Context:', sanitizeError(err)); }",
    review: "#283, #284, Session #151 analysis",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    // Files verified to have intentional empty catches (cleanup code, best-effort ops)
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|security-helpers)\.js$/,
  },

  // writeFileSync without atomic write pattern (10x in reviews)
  {
    id: "non-atomic-write",
    pattern: /writeFileSync\s*\([^)]+\)(?![\s\S]{0,80}(?:unlinkSync|renameSync|tmpdir|\.tmp))/g,
    message: "writeFileSync without atomic write pattern - partial writes on crash corrupt data",
    fix: "Write to tmp file first, then rename: writeFileSync(path + '.tmp', data); renameSync(path + '.tmp', path);",
    review: "#284, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only flag in scripts that write critical state files
    pathFilter: /(?:^|\/)(?:scripts|\.claude)\//,
    // Exclude files verified to use atomic writes or where non-atomic is acceptable
    pathExcludeList: verifiedPatterns["non-atomic-write"] || [],
  },

  // Prototype pollution via Object.assign on parsed JSON (9x in reviews)
  {
    id: "object-assign-parsed-json",
    pattern:
      /Object\.assign\s*\(\s*\{\s*\}\s*,\s*(?:JSON\.parse|parsed|item|entry|record|finding|doc)\b/g,
    message: "Object.assign from parsed JSON can carry __proto__ (prototype pollution)",
    fix: "Use structuredClone() or filter dangerous keys (__proto__, constructor, prototype)",
    review: "#283, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // Unbounded regex quantifiers (8x in reviews)
  {
    id: "unbounded-regex-quantifier",
    pattern: /new\s+RegExp\s*\([^)]*['"`][^'"]*(?:\.\*(?!\?)|\.\+(?!\?))[^'"]*['"`]/g,
    message: "Unbounded .* or .+ in dynamic RegExp - potential ReDoS or performance issue",
    fix: "Use bounded quantifiers: [\\s\\S]{0,N}? or .{0,N}? with explicit limits",
    review: "#53, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // Missing Array.isArray checks (7x in reviews)
  {
    id: "missing-array-isarray",
    pattern:
      /(?:\.length\b|\.forEach\s*\(|\.map\s*\(|\.filter\s*\()[\s\S]{0,5}(?![\s\S]{0,100}Array\.isArray)/g,
    message: "Array method used without Array.isArray guard - crashes on non-array values",
    fix: "Guard with: if (Array.isArray(data)) { ... } or default: const arr = Array.isArray(x) ? x : [];",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Too many false positives in app code - only check scripts processing external data
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
  },

  // Unescaped user input in RegExp constructor (7x in reviews)
  {
    id: "unescaped-regexp-input",
    pattern: /new\s+RegExp\s*\(\s*(?!['"`/])(?:\w+(?:\.\w+)*)\s*[,)]/g,
    message: "Variable in RegExp constructor without escaping - special chars break regex",
    fix: "Escape input: new RegExp(str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'))",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // exec() loop without /g flag (6x in reviews)
  {
    id: "exec-without-global",
    pattern: /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g,
    message: "exec() in while loop requires /g flag - without it, infinite loop",
    fix: "Ensure regex has /g flag, or use String.prototype.matchAll() instead",
    review: "#13, #14, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["exec-without-global"] || [],
  },

  // Git commands without -- separator (6x in reviews)
  {
    id: "git-without-separator",
    pattern:
      /exec(?:Sync|FileSync)?\s*\(\s*['"`]git\s+(?:add|rm|checkout|diff|log|show|blame)\b(?![\s\S]{0,100}['"`]\s*--\s*['"`]|['"`],\s*\[[\s\S]{0,200}['"`]--['"`])/g,
    message: "Git command without -- separator - filenames starting with - are treated as options",
    fix: "Always use -- before file arguments: git add -- file.txt",
    review: "#31, #38, Session #151 analysis",
    fileTypes: [".js", ".ts", ".sh"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // JSON.parse without try/catch (5x in reviews)
  {
    id: "json-parse-without-try",
    pattern: /JSON\.parse\s*\(/g,
    message: "JSON.parse without try/catch - crashes on malformed input",
    fix: "Wrap in try/catch: try { JSON.parse(str); } catch { /* handle */ }",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only check scripts processing external/file data (too many false positives elsewhere)
    pathFilter: /(?:^|\/)(?:scripts|\.claude\/hooks)\//,
    // Exclude files with verified error handling
    pathExcludeList: verifiedPatterns["json-parse-without-try"] || [],
  },

  // process.exit without cleanup (5x in reviews)
  {
    id: "process-exit-without-cleanup",
    pattern: /process\.exit\s*\(\s*[12]\s*\)(?![\s\S]{0,50}finally)/g,
    message: "process.exit() without cleanup - open handles, temp files may leak",
    fix: "Use cleanup function before exit, or set process.exitCode and return",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only flag in scripts with resource management (too noisy otherwise)
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|metrics)\//,
  },

  // console.error with raw error object (not just .message)
  {
    id: "console-error-raw-object",
    pattern: /console\.(?:error|warn)\s*\(\s*(?:['"`][^'"]*['"`]\s*,\s*)?(?:err|error|e)\s*\)/g,
    message: "Logging raw error object may expose stack traces and sensitive paths",
    fix: "Use: console.error('Context:', sanitizeError(err))",
    review: "#283, #284, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)(?:scripts|\.claude)\//,
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|sanitize-error)\.js$/,
  },

  // Missing BOM handling for file reads
  {
    id: "missing-bom-handling",
    pattern:
      /readFileSync\s*\([^)]+,\s*['"`]utf-?8['"`]\s*\)(?![\s\S]{0,50}\.replace\s*\(\s*\/\\uFEFF)/g,
    message: "UTF-8 file read without BOM stripping - BOM can break JSON.parse and regex",
    fix: "Add: .replace(/\\uFEFF/g, '') after reading UTF-8 files",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only flag in scripts reading external/user files
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
  },

  // Unbounded file reads (reading entire file into memory)
  {
    id: "unbounded-file-read",
    pattern:
      /readFileSync\s*\([^)]+\)[\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\)(?![\s\S]{0,50}(?:slice|MAX_LINES))/g,
    message: "Reading entire file then splitting - may OOM on large files",
    fix: "Use readline or stream for large files, or add size check: if (stat.size > MAX_SIZE) skip",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
  },

  // Shell command injection via string concatenation
  {
    id: "shell-command-injection",
    pattern: /exec(?:Sync)?\s*\(\s*(?:`[^`]*\$\{|['"`][^'"]*['"`]\s*\+\s*(?!['"`]))/g,
    message: "Shell command built with string interpolation - command injection risk",
    fix: "Use execFileSync with array args: execFileSync('cmd', ['arg1', userInput])",
    review: "#31, #38, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // Missing encoding in writeFileSync
  {
    id: "writefile-missing-encoding",
    pattern: /writeFileSync\s*\(\s*[^,]+,\s*[^,]+\s*\)(?!\s*;?\s*\/\/\s*binary)/g,
    message: "writeFileSync without explicit encoding - defaults to UTF-8 but intent unclear",
    fix: "Add encoding: writeFileSync(path, data, 'utf-8') or { encoding: 'utf-8' }",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)(?:scripts|\.claude)\//,
    // Exclude files already using options object with encoding
    pathExclude: /encoding/,
  },
];

/**
 * Get files to check based on options
 */
/**
 * Check if a file path matches any global exclude pattern
 */
function isGloballyExcluded(filePath) {
  // Normalize to forward slashes for consistent matching
  const normalized = filePath.replace(/\\/g, "/");
  return GLOBAL_EXCLUDE.some((pattern) => pattern.test(normalized));
}

function getFilesToCheck() {
  if (FILES.length > 0) {
    // Block absolute paths, drive letters, UNC paths, and Windows rooted paths before processing
    // Then normalize relative to ROOT and filter out any path traversal attempts
    return FILES.filter((f) => !/^(?:\/|[A-Za-z]:[\\/]|\\\\|\/\/|\\(?!\\))/.test(f)) // Block absolute/drive/UNC/rooted inputs
      .map((f) => join(ROOT, f))
      .filter((abs) => {
        const rel = relative(ROOT, abs);

        // `relative()` can return an absolute/UNC path on Windows (e.g., cross-drive),
        // so explicitly reject those in addition to ".." traversal.
        return rel && !/^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/.test(rel) && !/^\.\.(?:[\\/]|$)/.test(rel);
      })
      .map((abs) => relative(ROOT, abs))
      .filter((rel) => existsSync(join(ROOT, rel)))
      .filter((rel) => !isGloballyExcluded(rel)); // Apply global excludes
  }

  if (STAGED) {
    try {
      const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
        cwd: ROOT,
        encoding: "utf-8",
      });
      return output
        .trim()
        .split("\n")
        .filter((f) => f.trim())
        .filter((f) => !isGloballyExcluded(f)); // Apply global excludes
    } catch (error) {
      // Log git errors for debugging but don't abort (may not be a git repo)
      if (VERBOSE && !JSON_OUTPUT) {
        console.warn(`⚠️ Could not list staged files: ${sanitizeError(error)}`);
      }
      return [];
    }
  }

  if (ALL) {
    const files = [];
    const extensions = new Set([".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"]);
    const ignoreDirs = new Set(["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"]);

    function walk(dir) {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);

          // Use lstatSync to detect symlinks and avoid infinite loops
          let lstat;
          try {
            lstat = lstatSync(fullPath);
          } catch (error) {
            // Skip unreadable entries without aborting entire scan
            if (VERBOSE && !JSON_OUTPUT) {
              console.warn(
                `⚠️ Skipping unreadable entry: ${relative(ROOT, fullPath)} (${sanitizeError(error)})`
              );
            }
            continue;
          }

          if (lstat.isSymbolicLink()) {
            continue; // Skip symlinks to prevent infinite recursion
          }

          if (lstat.isDirectory()) {
            if (!ignoreDirs.has(entry)) {
              walk(fullPath);
            }
          } else {
            const ext = extname(entry);
            // Include files with known extensions OR extensionless files in .husky
            if (extensions.has(ext)) {
              files.push(relative(ROOT, fullPath));
            } else if (!ext) {
              // Review #190: Normalize backslashes for Windows path detection
              const relDir = relative(ROOT, dir).replace(/\\/g, "/");
              if (relDir.startsWith(".husky")) {
                // Extensionless files in .husky are shell scripts
                files.push(relative(ROOT, fullPath));
              }
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    walk(ROOT);
    return files.filter((f) => !isGloballyExcluded(f)); // Apply global excludes
  }

  // Default: check common problem areas
  // Expanded in Review Audit (Session #18) to cover scripts that caused most issues
  return [
    ".husky/pre-commit",
    ".github/workflows/docs-lint.yml",
    ".github/workflows/review-check.yml",
    ".github/workflows/sync-readme.yml",
    // Scripts that have had repeated review issues (Reviews #31-40)
    "scripts/phase-complete-check.js",
    "scripts/surface-lessons-learned.js",
    // Note: check-pattern-compliance.js excluded - contains pattern definitions as strings
    // which cause false positives (meta-detection of its own patterns)
    "scripts/suggest-pattern-automation.js",
    "scripts/archive-doc.js",
    "scripts/validate-phase-completion.js",
    // Claude hooks that are security-critical
    ".claude/hooks/check-edit-requirements.sh",
    ".claude/hooks/check-write-requirements.sh",
    ".claude/hooks/check-mcp-servers.sh",
    ".claude/hooks/pattern-check.sh",
  ].filter((f) => existsSync(join(ROOT, f)));
}

/**
 * Detect file type from shebang for extensionless files
 * Review #190: Normalize backslashes for Windows path detection
 * @param {string} filePath - File path
 * @param {string} content - File content
 * @param {string} ext - Current extension (may be empty)
 * @returns {string} Detected extension
 */
function detectFileType(filePath, content, ext) {
  if (ext) return ext;
  const shellShebangs = ["#!/bin/sh", "#!/bin/bash", "#!/usr/bin/env bash", "#!/usr/bin/env sh"];
  // Review #190: Normalize backslashes for Windows .husky path detection
  const normalizedPath = filePath.replace(/\\/g, "/");
  if (normalizedPath.startsWith(".husky/") || shellShebangs.some((s) => content.startsWith(s))) {
    return ".sh";
  }
  return ext;
}

/**
 * Check if a pattern should be skipped for a file
 * @param {object} antiPattern - Pattern configuration
 * @param {string} ext - File extension
 * @param {string} normalizedPath - Normalized file path
 * @returns {boolean} True if pattern should be skipped
 */
function shouldSkipPattern(antiPattern, ext, normalizedPath) {
  if (!antiPattern.fileTypes.includes(ext)) return true;
  if (antiPattern.pathFilter && !antiPattern.pathFilter.test(normalizedPath)) return true;
  if (antiPattern.pathExclude && antiPattern.pathExclude.test(normalizedPath)) return true;
  // Support array-based exclusions for S5843 regex complexity compliance
  if (antiPattern.pathExcludeList) {
    const fileName = normalizedPath.split("/").pop() || "";
    if (antiPattern.pathExcludeList.includes(fileName)) return true;
  }
  return false;
}

/**
 * Find pattern matches in file content
 * @param {object} antiPattern - Pattern configuration
 * @param {string} content - File content
 * @param {string} filePath - File path for reporting
 * @returns {Array} Array of violation objects
 */
function findPatternMatches(antiPattern, content, filePath) {
  const violations = [];
  // Create new RegExp to avoid shared state mutation (S3776 fix + Qodo suggestion)
  const pattern = new RegExp(antiPattern.pattern.source, antiPattern.pattern.flags);
  // Review #188: Clone exclude regex to prevent state mutation from g/y flags
  const exclude = antiPattern.exclude
    ? new RegExp(antiPattern.exclude.source, antiPattern.exclude.flags)
    : null;

  // Non-global regexes: single match only (prevents infinite loop)
  if (!pattern.global) {
    const match = pattern.exec(content);
    if (match) {
      // Review #189: Reset exclude.lastIndex before test to ensure consistent behavior
      if (exclude) exclude.lastIndex = 0;
      if (!(exclude && exclude.test(match[0]))) {
        violations.push(buildViolation(antiPattern, match, content, filePath));
      }
    }
    return violations;
  }

  // Global regexes: iterate all matches
  let match;
  while ((match = pattern.exec(content)) !== null) {
    // Review #189: Reset exclude.lastIndex before each test
    if (exclude) exclude.lastIndex = 0;
    if (exclude && exclude.test(match[0])) continue;
    violations.push(buildViolation(antiPattern, match, content, filePath));

    // Prevent infinite loops on zero-length matches
    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
  }
  return violations;
}

/**
 * Build a violation object from a regex match
 * Extracted helper for cognitive complexity reduction (S3776)
 */
function buildViolation(antiPattern, match, content, filePath) {
  const beforeMatch = content.slice(0, match.index);
  const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
  return {
    file: filePath,
    line: lineNumber,
    id: antiPattern.id,
    message: antiPattern.message,
    fix: antiPattern.fix,
    review: antiPattern.review,
    match: match[0].slice(0, 50) + (match[0].length > 50 ? "..." : ""),
  };
}

/**
 * Check a file for anti-patterns
 */
function checkFile(filePath) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) return [];

  let content;
  try {
    content = readFileSync(fullPath, "utf-8");
  } catch (error) {
    if (VERBOSE && !JSON_OUTPUT) {
      console.warn(`⚠️ Skipping unreadable file: ${filePath} (${sanitizeError(error)})`);
    }
    return [];
  }

  const ext = detectFileType(filePath, content, extname(filePath));
  const normalizedPath = filePath.replace(/\\/g, "/");
  const violations = [];

  for (const antiPattern of ANTI_PATTERNS) {
    if (shouldSkipPattern(antiPattern, ext, normalizedPath)) continue;
    violations.push(...findPatternMatches(antiPattern, content, filePath));
  }

  return violations;
}

/**
 * Print a single violation entry.
 */
function printViolation(v) {
  const prefix = v.graduated ? "🚫 BLOCK" : "⚠️  WARN";
  console.log(`   ${prefix} Line ${v.line}: ${v.message}`);
  console.log(`   ✓ Fix: ${v.fix}`);
  console.log(`   📚 See: Review ${v.review} in AI_REVIEW_LEARNINGS_LOG.md`);
  if (VERBOSE) {
    // Truncate match to avoid leaking full source snippets (may contain secrets/PII)
    const matchStr = String(v.match ?? "");
    const match = matchStr.slice(0, 120);
    console.log(`   Match: ${match}${matchStr.length > 120 ? "..." : ""}`);
  }
  console.log("");
}

/**
 * Print summary footer with block/warn guidance.
 */
function printSummaryFooter(blockCount, warnCount) {
  console.log("---");
  if (blockCount > 0) {
    console.log("🚫 Blocking violations MUST be fixed before committing.");
    console.log("   These patterns were warned on a previous check and are now enforced.");
  }
  if (warnCount > 0) {
    console.log("⚠️  Warnings are informational on first occurrence.");
    console.log("   Fix them now - they will BLOCK on the next check of the same file.");
  }
  console.log("Some may be false positives - use judgment based on context.");
}

/**
 * Format output as text
 */
function formatTextOutput(violations, filesChecked, warnCount = 0, blockCount = 0) {
  if (violations.length === 0) {
    console.log("✅ No pattern violations found");
    console.log(
      `   Checked ${filesChecked} file(s) against ${ANTI_PATTERNS.length} known anti-patterns`
    );
    return;
  }

  if (blockCount > 0) {
    console.log(`🚫 ${blockCount} BLOCKING violation(s) (previously warned, now enforced)`);
  }
  if (warnCount > 0) {
    console.log(`⚠️  ${warnCount} new warning(s) (first occurrence - fix before next check)`);
  }
  console.log("");

  // Group by file
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.log(`📄 ${file}`);
    for (const v of fileViolations) {
      printViolation(v);
    }
  }

  printSummaryFooter(blockCount, warnCount);
}

/**
 * Apply graduation logic: warn once per file+pattern, block on next check
 * Key is file+patternId (not per-line - any occurrence in a warned file blocks)
 * Returns { warnings: [], blocks: [] } with violations split by severity
 */
function applyGraduation(violations) {
  const warnedState = loadWarnedFiles();
  const warned = warnedState ?? {};
  const warnings = [];
  const blocks = [];
  const now = Date.now();
  // Only graduate to block if warning is older than 4 hours
  // Prevents self-escalation across hooks (pre-commit → pre-push) in same session
  const GRACE_PERIOD_MS = 4 * 60 * 60 * 1000;

  for (const v of violations) {
    const fileKey = String(v.file).replaceAll("\\", "/");
    const key = `${fileKey}::${v.id}`;

    // If state couldn't be loaded (corrupt), don't graduate — warn only
    if (warnedState === null) {
      warnings.push(v);
      continue;
    }

    if (warned[key]) {
      const warnedAt = new Date(warned[key]).getTime();
      const ageMs = Number.isFinite(warnedAt) ? now - warnedAt : GRACE_PERIOD_MS + 1;
      if (ageMs > GRACE_PERIOD_MS) {
        // Warning is old enough - graduate to block
        v.graduated = true;
        blocks.push(v);
      } else {
        // Still within grace period - keep as warning
        warnings.push(v);
      }
    } else {
      // First time seeing this file+pattern combo - warn only
      warned[key] = new Date().toISOString();
      warnings.push(v);
    }
  }

  // Don't overwrite state file if we couldn't read it (prevents wiping history)
  if (warnedState !== null) saveWarnedFiles(warned);
  return { warnings, blocks };
}

/**
 * Main function
 */
function main() {
  const files = getFilesToCheck();

  if (files.length === 0) {
    if (!JSON_OUTPUT) {
      console.log("No files to check. Use --all to scan entire repo or specify files.");
    }
    process.exit(0);
  }

  if (VERBOSE && !JSON_OUTPUT) {
    console.log(`Checking ${files.length} file(s)...`);
  }

  const allViolations = [];

  for (const file of files) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  // Apply graduation: warn once, block on repeat
  const { warnings, blocks } = applyGraduation(allViolations);

  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        {
          filesChecked: files.length,
          patternsChecked: ANTI_PATTERNS.length,
          warnings,
          blocks,
          violations: allViolations,
        },
        null,
        2
      )
    );
  } else {
    formatTextOutput(allViolations, files.length, warnings.length, blocks.length);
  }

  // Exit 1 only if there are blocks (graduated violations)
  // Warnings alone don't block (first occurrence = informational)
  process.exit(blocks.length > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  // Exit code 2 for unexpected errors (as documented in header)
  const message = sanitizeError(error);
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ error: true, message }, null, 2));
  } else {
    console.error(`❌ Error: ${message}`);
  }
  process.exit(2);
}
