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
 *   --fp-report  Show per-pattern false-positive exclusion counts
 *
 * Severity tiers:
 *   critical - Always blocks (pre-commit + CI): security patterns
 *   high     - Blocks in CI, warns in pre-commit: correctness patterns
 *   medium   - Always warns: style/quality patterns
 *
 * Exit codes: 0 = no critical violations, 1 = critical violations found, 2 = error
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

// TTL for warned-files entries: entries older than this are expired on load
// Prevents false positives from blocking indefinitely (Fix: hook-quality session)
const WARNED_FILES_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadWarnedFiles() {
  try {
    const raw = readFileSync(WARNED_FILES_PATH, "utf-8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);

    // Validate parsed data is a plain object (not array, null, etc.)
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      console.warn("Warning: warned-files.json is not a plain object — resetting");
      return {};
    }

    // Purge expired entries (older than TTL)
    const now = Date.now();
    let purged = 0;
    for (const key of Object.keys(data)) {
      const ts = new Date(data[key]).getTime();
      if (!Number.isFinite(ts) || now - ts > WARNED_FILES_TTL_MS) {
        delete data[key];
        purged++;
      }
    }
    if (purged > 0 && VERBOSE) {
      console.log(`   Purged ${purged} expired pattern warning(s) (older than 7 days)`);
    }
    if (purged > 0) {
      try {
        const tmpPath = `${WARNED_FILES_PATH}.tmp`;
        writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
        if (existsSync(WARNED_FILES_PATH)) unlinkSync(WARNED_FILES_PATH);
        renameSync(tmpPath, WARNED_FILES_PATH);
      } catch {
        /* best effort */
      }
    }

    return data;
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

const MAX_WARNED_ENTRIES = 200;

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

    // Cap entries at MAX_WARNED_ENTRIES, dropping oldest by timestamp
    const keys = Object.keys(warned);
    if (keys.length > MAX_WARNED_ENTRIES) {
      const sorted = [...keys].sort((a, b) => {
        const ta = new Date(warned[a]).getTime() || 0;
        const tb = new Date(warned[b]).getTime() || 0;
        return ta - tb;
      });
      const toDrop = sorted.slice(0, keys.length - MAX_WARNED_ENTRIES);
      for (const k of toDrop) delete warned[k];
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
const FP_REPORT = args.includes("--fp-report");
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
  // Pattern test suite contains anti-pattern examples as test fixtures (not violations)
  /^tests\/pattern-compliance\.test\.js$/,
  // Archived/obsolete scripts - not actively maintained (Review #250)
  /^docs\/archive\//,
  // Development/build utility scripts (pre-existing debt - Review #136)
  /^scripts\/ai-review\.js$/,
  /^scripts\/assign-review-tier\.js$/,
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
    severity: "high",
    pattern: /\$\(\s*[^)]{1,500}\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
    message:
      "Exit code capture bug: $? after assignment captures assignment exit (always 0), not command exit",
    fix: "Use: if ! OUT=$(cmd); then",
    review: "#4, #14",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "for-file-iteration",
    severity: "medium",
    pattern: /for\s+\w{1,200}\s+in\s+\$\{?\w{1,200}\}?\s{0,50};?\s{0,50}do/g,
    message: "File iteration with for loop breaks on spaces in filenames",
    fix: "Use: while IFS= read -r file; do ... done < file_list",
    review: "#4, #14",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "missing-trap",
    severity: "medium",
    pattern: /mktemp\)(?![\s\S]{0,100}trap)/g,
    message: "Temp file created without trap for cleanup",
    fix: "Add: trap 'rm -f \"$TMPFILE\"' EXIT after mktemp",
    review: "#17, #18",
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  {
    id: "retry-loop-no-success-tracking",
    severity: "high",
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
    severity: "high",
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
    severity: "critical",
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
    severity: "high",
    pattern: /\.catch\s*\(\s*console\.error\s*\)/g,
    message: "Unsanitized error logging - may expose sensitive paths/credentials",
    fix: "Use: .catch((e) => console.error(sanitizeError(e))) or handle specific errors",
    review: "#20",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "path-startswith",
    severity: "critical",
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
    severity: "high",
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
    severity: "critical",
    pattern: /`[^`]*\$\{\{\s*(?:steps|github|env|inputs)\.[^}]+\}\}[^`]*`/g,
    message: "Unsafe ${{ }} interpolation in JavaScript template literal",
    fix: "Use env: block to pass value, then process.env.VAR",
    review: "#16",
    fileTypes: [".yml", ".yaml"],
  },
  {
    id: "hardcoded-temp-path",
    severity: "medium",
    pattern: /[>|]\s*\/tmp\/\w+(?!\.)/g,
    message: "Hardcoded /tmp path - use mktemp for unique files",
    fix: "Use: TMPFILE=$(mktemp) and trap for cleanup",
    review: "#18",
    fileTypes: [".yml", ".yaml", ".sh"],
  },
  {
    id: "implicit-if-expression",
    severity: "medium",
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
    severity: "medium",
    pattern: /\.user\.type\s*===?\s*['"`]Bot['"`]/g,
    message: "Fragile bot detection - user.type is unreliable",
    fix: 'Use: user.login === "github-actions[bot]"',
    review: "#15",
    fileTypes: [".yml", ".yaml", ".js", ".ts"],
  },

  // Security patterns
  {
    id: "simple-path-traversal-check",
    severity: "critical",
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
    severity: "critical",
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
    severity: "critical",
    pattern: /\.innerHTML\s*=/g,
    message: "innerHTML assignment can lead to XSS vulnerabilities",
    fix: "Use textContent for text, or sanitize with DOMPurify for HTML",
    review: "Security Standards",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "eval-usage",
    severity: "critical",
    pattern: /\beval\s*\(/g,
    message: "eval() is a security risk - allows arbitrary code execution",
    fix: "Avoid eval. Use JSON.parse for JSON, or restructure code",
    review: "Security Standards",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    // Exclude check-pattern-compliance.js and pattern-check.js: contain pattern definitions as strings (meta-detection)
    // 2026-01-20 audit (PR #286):
    // - security-check.js: Contains regex pattern /\beval\s*\(/ at L42 as detection pattern, not actual eval usage
    // 2026-02-13 (OPT-H002): pattern-check.js now has inline pattern defs including eval-usage regex
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|security-check|pattern-check)\.js$/,
  },
  {
    id: "sql-injection-risk",
    severity: "critical",
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
    severity: "critical",
    pattern:
      /res\.(?:json|send|status\s*\([^)]*\)\s*\.json)\s*\(\s*\{[\s\S]{0,300}?(?:error|err|e|exception)\.(?:message|stack|toString\s*\()/g,
    message: "Exposing raw error messages/stack traces to clients",
    fix: 'Return sanitized error messages (e.g., "An error occurred"), log full details server-side',
    review: "Security Standards",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "missing-rate-limit-comment",
    severity: "medium",
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
    severity: "critical",
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
    severity: "high",
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
    severity: "medium",
    pattern:
      /console\.(?:log|error|warn)\s*\([^)]*(?:content|fileContent|data|text|body)(?:\s*[,)])/g,
    message: "File-derived content logged without control char sanitization",
    fix: 'Sanitize with: content.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "")',
    review: "#39, #40",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "split-newline-without-cr-strip",
    severity: "medium",
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
    severity: "medium",
    // Match lookaheads in regex literals `(?=\n` and in string patterns `"(?=\\n"`
    pattern: /\(\?=(?:\\n|\\\\n)(?!\?)/g,
    message: "Regex lookahead uses \\n without optional \\r (fails on CRLF)",
    fix: "Use: (?=\\r?\\n for cross-platform line endings",
    review: "#40",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "path-split-without-normalize",
    severity: "critical",
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
  // readfilesync-without-try: REMOVED (92 exclusions = pattern unfit for purpose)
  // ESLint sonash/no-unguarded-file-read handles this with AST-level try/catch awareness
  {
    id: "auto-mode-slice-truncation",
    severity: "high",
    pattern: /(?:isAutoMode|isAuto|autoMode)\s*\?[\s\S]{0,50}\.slice\s*\(\s*0\s*,/g,
    message: "Auto/CI mode should check ALL items, not truncate - limits are for interactive only",
    fix: "Use: isAutoMode ? allItems : allItems.slice(0, MAX)",
    review: "#35",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "readline-no-close",
    severity: "medium",
    pattern:
      /readline\.createInterface\s*\([\s\S]{0,500}process\.exit\s*\(\s*\d+\s*\)(?![\s\S]{0,50}close\s*\()/g,
    message: "Script exits without closing readline interface (may hang)",
    fix: "Create closeRl() helper and call before every process.exit()",
    review: "#33",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "empty-path-not-rejected",
    severity: "critical",
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
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: [
      "phase-complete-check.js",
      "check-edit-requirements.js",
      "check-write-requirements.js",
      "check-requirements.js",
      "check-mcp-servers.js",
      "pattern-check.js",
      "session-start.js",
      "validate-paths.js",
      "analyze-learning-effectiveness.js",
      "security-helpers.js",
      "check-remote-session-context.js",
      "track-agent-invocation.js",
      "check-roadmap-health.js",
      "check-doc-headers.js",
      "statusline.js",
      "sync-claude-settings.js",
      "ai-pattern-checks.js",
      "eval-check-stage.js",
      "eval-snapshot.js",
      "unify-findings.js",
      "normalize-format.js",
      "extract-agent-findings.js",
      "generate-detailed-sonar-report.js",
      "place-unassigned-debt.js",
      "analyze-placement.js",
      "post-write-validator.js",
    ],
  },

  // Test patterns from Consolidation #14 (Reviews #180-201)
  {
    id: "test-mock-firestore-directly",
    severity: "high",
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
    severity: "high",
    pattern: /\b(?:loadConfig|require)\s*\(\s*['"`][^'"`)]+['"`]\s*\)(?![\s\S]{0,30}catch)/g,
    message: "loadConfig/require without try/catch - crashes on missing or malformed config",
    fix: "Wrap in try/catch with graceful fallback or clear error message",
    review: "#36, #37, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only check scripts and hooks (not app code where require is standard)
    pathFilter: /(?:^|\/)(?:scripts|\.claude\/hooks|\.husky)\//,
    // Exclude files with verified error handling
    // check-pattern-sync.js: CJS require() calls at top-level are standard node module loading
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|load-config|check-pattern-sync|security-helpers|analyze-learning-effectiveness)\.js$/,
    pathExcludeList: verifiedPatterns["unguarded-loadconfig"] || [],
  },

  // Silent catch blocks (11x in reviews)
  {
    id: "silent-catch-block",
    severity: "high",
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
    severity: "high",
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
    severity: "critical",
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
    severity: "high",
    pattern: /new\s+RegExp\s*\([^)]*['"`][^'"]*(?:\.\*(?!\?)|\.\+(?!\?))[^'"]*['"`]/g,
    message: "Unbounded .* or .+ in dynamic RegExp - potential ReDoS or performance issue",
    fix: "Use bounded quantifiers: [\\s\\S]{0,N}? or .{0,N}? with explicit limits",
    review: "#53, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // check-pattern-sync.js: uses .* in extractPatterns() for flexible pattern matching (intentional)
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|check-pattern-sync)\.js$/,
    pathExcludeList: verifiedPatterns["unbounded-regex-quantifier"] || [],
  },

  // Missing Array.isArray checks (7x in reviews)
  {
    id: "missing-array-isarray",
    severity: "high",
    pattern:
      /(?:\.length\b|\.forEach\s*\(|\.map\s*\(|\.filter\s*\()[\s\S]{0,5}(?![\s\S]{0,100}Array\.isArray)/g,
    message: "Array method used without Array.isArray guard - crashes on non-array values",
    fix: "Guard with: if (Array.isArray(data)) { ... } or default: const arr = Array.isArray(x) ? x : [];",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Too many false positives in app code - only check scripts processing external data
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
    pathExcludeList: verifiedPatterns["missing-array-isarray"] || [],
  },

  // Unescaped user input in RegExp constructor (7x in reviews)
  {
    id: "unescaped-regexp-input",
    severity: "high",
    pattern: /new\s+RegExp\s*\(\s*(?!['"`/])(?:\w+(?:\.\w+)*)\s*[,)]/g,
    message: "Variable in RegExp constructor without escaping - special chars break regex",
    fix: "Escape input: new RegExp(str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'))",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|inline-patterns)\.js$/,
    pathExcludeList: verifiedPatterns["unescaped-regexp-input"] || [],
  },

  // exec() loop without /g flag (6x in reviews)
  {
    id: "exec-without-global",
    severity: "high",
    pattern: /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g,
    message: "exec() in while loop requires /g flag - without it, infinite loop",
    fix: "Ensure regex has /g flag, or use String.prototype.matchAll() instead",
    review: "#13, #14, Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|inline-patterns|check-pattern-sync)\.js$/,
    pathExcludeList: verifiedPatterns["exec-without-global"] || [],
  },

  // Git commands without -- separator (6x in reviews)
  {
    id: "git-without-separator",
    severity: "high",
    pattern:
      /exec(?:Sync|FileSync)?\s*\(\s*['"`]git\s+(?:add|rm|checkout|diff|log|show|blame)\b(?![\s\S]{0,100}['"`]\s*--\s*['"`]|['"`],\s*\[[\s\S]{0,200}['"`]--['"`])/g,
    message: "Git command without -- separator - filenames starting with - are treated as options",
    fix: "Always use -- before file arguments: git add -- file.txt",
    review: "#31, #38, Session #151 analysis",
    fileTypes: [".js", ".ts", ".sh"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["git-without-separator"] || [],
  },

  // json-parse-without-try: REMOVED (24 exclusions = regex can't detect try/catch context)
  // ESLint sonash/no-unguarded-file-read and SonarCloud handle this with AST awareness

  // process.exit without cleanup (5x in reviews)
  {
    id: "process-exit-without-cleanup",
    severity: "medium",
    pattern: /process\.exit\s*\(\s*[12]\s*\)(?![\s\S]{0,50}finally)/g,
    message: "process.exit() without cleanup - open handles, temp files may leak",
    fix: "Use cleanup function before exit, or set process.exitCode and return",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only flag in scripts with resource management (too noisy otherwise)
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|metrics)\//,
    pathExcludeList: verifiedPatterns["process-exit-without-cleanup"] || [],
  },

  // console.error with raw error object (not just .message)
  {
    id: "console-error-raw-object",
    severity: "medium",
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
    severity: "medium",
    pattern:
      /readFileSync\s*\([^)]+,\s*['"`]utf-?8['"`]\s*\)(?![\s\S]{0,50}\.replace\s*\(\s*\/\\uFEFF)/g,
    message: "UTF-8 file read without BOM stripping - BOM can break JSON.parse and regex",
    fix: "Add: .replace(/\\uFEFF/g, '') after reading UTF-8 files",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    // Only flag in scripts reading external/user files
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
    pathExcludeList: verifiedPatterns["missing-bom-handling"] || [],
  },

  // Unbounded file reads (reading entire file into memory)
  {
    id: "unbounded-file-read",
    severity: "medium",
    pattern:
      /readFileSync\s*\([^)]+\)[\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\)(?![\s\S]{0,50}(?:slice|MAX_LINES))/g,
    message: "Reading entire file then splitting - may OOM on large files",
    fix: "Use readline or stream for large files, or add size check: if (stat.size > MAX_SIZE) skip",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExcludeList: verifiedPatterns["unbounded-file-read"] || [],
  },

  // Shell command injection via string concatenation
  {
    id: "shell-command-injection",
    severity: "critical",
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
    severity: "medium",
    pattern: /writeFileSync\s*\(\s*[^,]+,\s*[^,]+\s*\)(?!\s*;?\s*\/\/\s*binary)/g,
    message: "writeFileSync without explicit encoding - defaults to UTF-8 but intent unclear",
    fix: "Add encoding: writeFileSync(path, data, 'utf-8') or { encoding: 'utf-8' }",
    review: "Session #151 analysis",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)(?:scripts|\.claude)\//,
    // Exclude files already using options object with encoding
    pathExclude: /encoding/,
    pathExcludeList: verifiedPatterns["writefile-missing-encoding"] || [],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Phase 7: New enforcement rules for previously unenforced categories
  // Added: Session learning-log-accuracy-review
  // ═══════════════════════════════════════════════════════════════════

  // --- React/Frontend ---

  // Unstable list keys: key={index} causes unnecessary re-renders
  {
    id: "unstable-list-key",
    severity: "high",
    pattern: /key=\{[^}]*\bindex\b[^}]*\}/g,
    message: "Using array index as React key - causes unnecessary re-renders and bugs on reorder",
    fix: "Use a stable unique identifier: key={item.id} or key={item.canonId}",
    review: "CODE_PATTERNS.md React/Frontend - Key stability",
    fileTypes: [".jsx", ".tsx"],
  },

  // Clickable div without ARIA role
  {
    id: "div-onclick-no-role",
    severity: "medium",
    pattern: /<div(?![^>]*\brole\s*=)[^>]*\bonClick\b[^>]*>/g,
    message: "Clickable <div> without role attribute - inaccessible to screen readers",
    fix: 'Add role="button" or use <button> element instead: <button onClick={...}>',
    review: "CODE_PATTERNS.md React/Frontend - Accessible toggle switches",
    fileTypes: [".jsx", ".tsx"],
  },

  // --- JS/TS ---

  // parseInt without radix
  {
    id: "parseint-no-radix",
    severity: "medium",
    pattern: /parseInt\s*\([^\n,)]+\)(?!\s*,)/g,
    message: "parseInt() without radix parameter - may parse as octal in legacy engines",
    fix: "Always specify radix: parseInt(str, 10) or use Number.parseInt(str, 10)",
    review: "CODE_PATTERNS.md JS/TS - Number.parseInt radix",
    fileTypes: [".js", ".ts", ".jsx", ".tsx"],
    exclude: /Number\.parseInt/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["parseint-no-radix"] || [],
  },

  // Math.max with spread on potentially empty array
  {
    id: "math-max-spread-no-guard",
    severity: "medium",
    pattern: /Math\.max\(\s*\.\.\.[^)]+\)/g,
    message: "Math.max(...arr) returns -Infinity on empty array - add length guard",
    fix: "Guard empty: arr.length > 0 ? Math.max(...arr) : defaultValue",
    review: "CODE_PATTERNS.md JS/TS - Math.max empty array, Review #216",
    fileTypes: [".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // startsWith('/') instead of path.isAbsolute
  {
    id: "startswith-slash-check",
    severity: "high",
    pattern: /\.startsWith\s*\(\s*['"]\/['"]\s*\)/g,
    message: String.raw`startsWith('/') misses Windows absolute paths (C:\) - use path.isAbsolute()`,
    fix: "Use path.isAbsolute(p) for cross-platform absolute path detection",
    review: "CODE_PATTERNS.md JS/TS - Cross-platform isAbsolute, v1.9",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
  },

  // --- CI/Automation ---

  // git diff --name without --diff-filter
  {
    id: "git-diff-no-filter",
    severity: "high",
    pattern: /git\s+diff[^\n]*--name-only(?![^\n]*--diff-filter)/g,
    message: "git diff --name-only without --diff-filter includes deleted files",
    fix: "Add --diff-filter=ACM to exclude deleted files: git diff --name-only --diff-filter=ACM",
    review: "CODE_PATTERNS.md Documentation - Pre-commit ADM filter, v2.5",
    fileTypes: [".sh", ".js", ".ts"],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["git-diff-no-filter"] || [],
  },

  // --- Shell ---

  // xargs without -r or --no-run-if-empty (hangs on empty input)
  {
    id: "xargs-without-guard",
    severity: "medium",
    pattern: /\|\s*xargs\b(?![^\n]*(?:-r\b|--no-run-if-empty))/g,
    message: "xargs without -r flag may hang or run with empty input on some platforms",
    fix: "Use xargs -r (--no-run-if-empty) or pipe through 'grep .' first",
    review: "CODE_PATTERNS.md Documentation - xargs hang prevention, v2.0",
    fileTypes: [".sh"],
  },

  // --- New patterns from PR #364 Retro / Learning Effectiveness (Session #157) ---
  // Top 3 automation candidates: 10x, 8x, 8x recurrence after documentation

  // Unanchored regex for enum/severity validation (10x recurrence)
  {
    id: "unanchored-enum-regex",
    severity: "high",
    pattern: /(?:test|match)\s*\(\s*\/(?!\^)[EeSs]\[\d+[^/]{0,20}\]\//g,
    message: "Unanchored regex for enum validation - matches partial strings (e.g. E12 matches E1)",
    fix: "Anchor with ^ and $: /^E[0-3]$/ or /^S[0-4]$/ instead of /E[0-3]/",
    review: "CODE_PATTERNS.md JS/TS - Regex anchoring for enums, Review #219 (10x recurrence)",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // Division without zero guard (8x recurrence)
  // Matches `/ total` etc. only when NOT preceded by `> 0 ?` guard on same line
  {
    id: "unsafe-division",
    severity: "high",
    pattern: /^(?!.*>\s*0\s*\?).*[^/*]\s\/\s*(?:total|count|length|size|denominator)\b/gm,
    message: "Division by variable that could be 0 - returns Infinity/NaN",
    fix: "Use safePercent(n, total) helper or guard: total > 0 ? (n / total) * 100 : 0",
    review: "CODE_PATTERNS.md JS/TS - Safe percentage, Review #226 (8x recurrence)",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    exclude: /safePercent|\/\/|\/\*|\* /,
  },

  // renameSync without prior rmSync on Windows (8x recurrence)
  {
    id: "rename-without-remove",
    severity: "high",
    pattern: /\brenameSync\s*\(/g,
    message: "renameSync without prior rmSync - fails on Windows if destination exists",
    fix: "Remove destination first: if (fs.existsSync(dest)) fs.rmSync(dest, { force: true }); fs.renameSync(tmp, dest);",
    review: "CODE_PATTERNS.md JS/TS - Windows atomic rename, Review #224 (8x recurrence)",
    fileTypes: [".js", ".ts"],
    // Only check cross-platform scripts (not POSIX-only hooks)
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["rename-without-remove"] || [],
  },

  // throw after console.error re-exposes sanitized error (PR #365)
  // SonarCloud S5852: replaced regex with string-based check (two-strikes rule, Review #289)
  {
    id: "throw-after-sanitize",
    severity: "high",
    testFn: (content) => {
      const lines = content.split("\n");
      const matches = [];
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trimEnd();
        const nextLine = lines[i + 1].trim();
        if (
          line.includes("console.error(") &&
          line.endsWith(";") &&
          nextLine.startsWith("throw ")
        ) {
          matches.push({ line: i + 1, match: `${line}\n${lines[i + 1]}` });
        }
      }
      return matches;
    },
    message: "Stack trace leakage: throw after console.error re-exposes sanitized error",
    fix: "Use process.exit(1) instead of throw when error is fatal and already logged",
    review: "#315",
    fileTypes: [".js", ".mjs", ".cjs"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // writeFileSync/renameSync/appendFileSync/openSync without symlink guard (PR #366+#368 ping-pong)
  // SonarCloud S5852 safe: uses testFn string parsing instead of regex
  {
    id: "write-without-symlink-guard",
    severity: "critical",
    testFn: (content) => {
      const lines = content.split("\n");
      const matches = [];
      // All fs write operations that need symlink guards
      const writeOps = ["writeFileSync", "renameSync", "appendFileSync"];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for any write operation
        const hasWriteOp = writeOps.some((op) => line.includes(op));
        // Also check openSync with write/append flags (a, w, r+, etc.)
        const hasOpenSync =
          line.includes("openSync") && /openSync\s*\([^)]*["'](a|w|r\+|a\+|w\+)["']/.test(line);
        if (!hasWriteOp && !hasOpenSync) continue;
        // Skip comments, imports, and string literals containing the pattern
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        if (trimmed.startsWith("import ") || trimmed.startsWith("import{")) continue;
        // Skip require() lines (CJS imports)
        if (trimmed.includes("require(")) continue;
        // Skip destructured import members (e.g. "  renameSync," inside "import { ... }")
        if (/^\w+,?$/.test(trimmed)) continue;
        // Look for symlink guard in preceding 10 lines (isSafeToWrite, isSymbolicLink)
        let hasGuard = false;
        const backStart = Math.max(0, i - 10);
        for (let j = backStart; j < i; j++) {
          if (
            lines[j].includes("isSafeToWrite") ||
            lines[j].includes("isWriteSafe") ||
            lines[j].includes("isSymbolicLink") ||
            lines[j].includes("guardSymlink") ||
            lines[j].includes("refuseSymlink")
          ) {
            hasGuard = true;
            break;
          }
        }
        // fd-based chains: openSync→fstatSync places fstatSync AFTER the open call
        if (!hasGuard && hasOpenSync) {
          const fwdEnd = Math.min(lines.length, i + 11);
          for (let j = i; j < fwdEnd; j++) {
            if (lines[j].includes("fstatSync")) {
              hasGuard = true;
              break;
            }
          }
        }
        if (!hasGuard) {
          matches.push({ line: i + 1, match: line.trim().slice(0, 120) });
        }
      }
      return matches;
    },
    message:
      "writeFileSync/renameSync/appendFileSync/openSync without symlink guard — use isSafeToWrite() or fd-based chain (Template 27)",
    fix: "Add: if (!isSafeToWrite(filePath)) return; OR use fd-based chain: openSync→fstatSync→fchmodSync→writeSync→closeSync. See FIX_TEMPLATES.md Template 27.",
    review: "#316-#323 (PR #366 R1-R8, 5 rounds of symlink ping-pong)",
    fileTypes: [".js"],
    pathFilter: /(?:^|[\\/])(?:\.claude[\\/]hooks|scripts)[\\/]/,
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|security-helpers|session-start|commit-tracker)\.js$/,
    pathExcludeList: verifiedPatterns["write-without-symlink-guard"] || [],
  },

  // Atomic write missing tmpPath symlink guard (PR #366 R7-R8, most common miss)
  {
    id: "atomic-write-missing-tmp-guard",
    severity: "critical",
    testFn: (content) => {
      const lines = content.split("\n");
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for tmp file variable declarations in atomic write patterns
        if (!line.includes(".tmp`") && !line.includes('.tmp"') && !line.includes(".tmp'")) continue;
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        // This line declares a tmp path — check if isSafeToWrite is called on it within next 5 lines
        const varMatch = line.match(/(?:const|let)\s+(\w+)\s*=/);
        if (!varMatch) continue;
        const varName = varMatch[1];
        let hasGuard = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          if (lines[j].includes("isSafeToWrite") && lines[j].includes(varName)) {
            hasGuard = true;
            break;
          }
        }
        if (!hasGuard) {
          matches.push({
            line: i + 1,
            match: `${trimmed.slice(0, 100)} — missing isSafeToWrite(${varName})`,
          });
        }
      }
      return matches;
    },
    message: "Atomic write declares tmp path without isSafeToWrite(tmpPath) guard",
    fix: "Add: if (!isSafeToWrite(tmpPath)) return; after the target file guard. Both target AND tmp need guards.",
    review: "#322-#323 (PR #366 R7-R8)",
    fileTypes: [".js"],
    pathFilter: /(?:^|[\\/])(?:\.claude[\\/]hooks|scripts)[\\/]/,
    pathExclude: /(?:^|[\\/])(?:check-pattern-compliance|session-start)\.js$/,
    pathExcludeList: verifiedPatterns["atomic-write-missing-tmp-guard"] || [],
  },

  // === Patterns automated from LEARNING_METRICS.md failing patterns ===

  // Pattern: "JSONL line parsing" — 14 recurrences (Reviews: 319, 336, 337, 339, 342)
  // JSONL files must be parsed line-by-line with per-line try/catch
  {
    id: "jsonl-parse-no-try-catch",
    severity: "high",
    testFn: (content, filePath) => {
      const matches = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect JSON.parse(line) not wrapped in try/catch
        if (/JSON\.parse\s*\(\s*(?:line|l|entry|row)\b/.test(line)) {
          // Check if within a try block (look back up to 15 lines)
          const context = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
          if (!/\btry\s*\{/.test(context)) {
            matches.push({
              line: i + 1,
              match: line.trim().slice(0, 100),
            });
          }
        }
      }
      return matches;
    },
    message: "JSONL line parsing without try/catch — single corrupt line crashes entire script",
    fix: "Wrap JSON.parse(line) in try/catch with line number tracking: try { JSON.parse(line); } catch (e) { console.warn(`Skipping corrupt line ${lineNum}`); }",
    review: "#218 (recurred: #319, #336, #337, #339, #342)",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|[\\/])scripts[\\/]/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["jsonl-parse-no-try-catch"] || [],
  },

  // Pattern: "Rename fallback guard" — 14 recurrences (Reviews: 339, 340, 341, 342, 345)
  // renameSync can fail on cross-drive moves; needs writeFileSync+unlinkSync fallback
  {
    id: "rename-no-fallback",
    severity: "high",
    testFn: (content, filePath) => {
      const matches = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\brenameSync\s*\(/.test(line)) {
          // Check if within a try block (look back up to 15 lines)
          const contextBefore = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
          // Check if followed by a catch with copy fallback + cleanup (look ahead up to 30 lines)
          const contextAfter = lines.slice(i, Math.min(lines.length, i + 30)).join("\n");
          const hasTry = /\btry\s*\{/.test(contextBefore);
          const hasCatch = /\bcatch\s*[({]/.test(contextAfter);
          const hasCopyFallback =
            /\bcopyFileSync\b/.test(contextAfter) ||
            (/\breadFileSync\b/.test(contextAfter) && /\bwriteFileSync\b/.test(contextAfter));
          const hasCleanup = /\b(?:unlinkSync|rmSync)\b/.test(contextAfter);
          if (!hasTry || !hasCatch || !hasCopyFallback || !hasCleanup) {
            matches.push({
              line: i + 1,
              match: line.trim().slice(0, 100),
            });
          }
        }
      }
      return matches;
    },
    message: "renameSync without try/catch + fallback copy/unlink — fails on cross-drive moves",
    fix: "Wrap in try/catch: try { renameSync(src, dest); } catch { copyFileSync(src, dest); unlinkSync(src); }",
    review: "#265 (recurred: #339, #340, #341, #342, #345)",
    fileTypes: [".js"],
    pathFilter: /(?:^|[\\/])scripts[\\/]/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["rename-no-fallback"] || [],
  },

  // Pattern: "Session identity check" — 17 recurrences (Reviews: 324, 328, 329, 344, 345)
  // Session IDs used in file paths must be validated to prevent path traversal
  {
    id: "session-id-no-validation",
    severity: "critical",
    testFn: (content, filePath) => {
      const matches = [];
      const lines = content.split("\n");
      // Look for sessionId being interpolated into file paths without prior validation
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect sessionId/session_id used in path construction (join, template literal, concat)
        const hasSessionId = /(?:session[_-]?[Ii]d|sessionId)\b/.test(line);
        const hasPathUse =
          /join\s*\(/.test(line) ||
          /`[^`]{0,200}\$\{/.test(line) ||
          /\/\S{0,100}session/.test(line) ||
          line.includes("writeFileSync") ||
          line.includes("readFileSync");
        if (hasSessionId && hasPathUse) {
          // Check if validation exists nearby (look back up to 15 lines)
          const context = lines.slice(Math.max(0, i - 15), i + 1).join("\n");
          const hasValidation =
            (/(?:validate|isValid|assert)\s*\(/.test(context) &&
              /session[_-]?[Ii]d/.test(context)) ||
            /session[_-]?[Ii]d\s*\.\s*match\s*\(/.test(context) ||
            /\/\^[^/]+\/\.\s*test\s*\(\s*session[_-]?[Ii]d\s*\)/.test(context) ||
            (/(?:\/\^|new RegExp)/.test(context) && /session/.test(context));
          if (!hasValidation) {
            matches.push({
              line: i + 1,
              match: line.trim().slice(0, 100),
            });
          }
        }
      }
      return matches;
    },
    message:
      "Session ID used in file path without format validation — risks path traversal or cross-session pollution",
    fix: "Validate sessionId format before use: if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) throw new Error('Invalid session ID');",
    review: "#209 (recurred: #324, #328, #329, #344, #345)",
    fileTypes: [".js"],
    pathFilter: /(?:^|[\\/])scripts[\\/]/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns["session-id-no-validation"] || [],
  },

  // ═══════════════════════════════════════════════════════════════════
  // AI Behavior Patterns (migrated from scripts/config/ai-patterns.json)
  // Detect common AI-generated code issues
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "happy-path-only",
    severity: "high",
    testFn: (content) => {
      const lines = content.split("\n");
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (!/\basync\s+function\b/.test(lines[i])) continue;
        const window = lines.slice(i, Math.min(lines.length, i + 80)).join("\n");
        if (!/\bawait\b/.test(window)) continue;
        if (/\btry\s*\{/.test(window)) continue;
        matches.push({ line: i + 1, match: lines[i].trim() });
      }
      return matches;
    },
    message: "Function handles only success path, no error handling",
    fix: "Add try/catch with proper error handling for async operations",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    pathFilter: /(?:^|\/)(?:lib|app|components|pages)\//,
  },
  {
    id: "trivial-assertions",
    severity: "medium",
    pattern:
      /expect\(true\)\.toBe\(true\)|expect\(1\)\.toBe\(1\)|expect\(false\)\.toBe\(false\)|assert\.ok\(true\)|assert\.equal\(1,\s*1\)/g,
    message: "Test that always passes without testing real behavior",
    fix: "Write assertions that test actual behavior: expect(result).toBe(expected)",
    review: "ai-behavior",
    fileTypes: [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", ".test.js", ".test.jsx"],
  },
  {
    id: "ai-todo-markers",
    severity: "medium",
    pattern: /(?:TODO|FIXME)[^A-Z]*(?:AI|claude|LLM|GPT)|AI should fix|Claude will/gi,
    message: "TODO comment referencing AI that was never resolved",
    fix: "Resolve the TODO or convert to a concrete task with ticket reference",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "session-boundary",
    severity: "medium",
    pattern: /\/\/\s*(?:Session\s*\d+|Added in session|From session)/gi,
    message: "Comment marking AI session boundary (potential inconsistency)",
    fix: "Remove session boundary comment - code should stand on its own",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "overconfident-security",
    severity: "medium",
    pattern:
      /(?:this is secure|security guaranteed|fully protected|completely safe|no vulnerabilities|unhackable)/gi,
    message: "Comment claiming security without evidence",
    fix: "Replace with specific security measures taken, or remove the claim",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "hallucinated-apis",
    severity: "high",
    pattern:
      /crypto\.secureHash\(|firebase\.verifyAppCheck\(|React\.useServerState\(|next\.getServerAuth\(|firestore\.atomicUpdate\(/g,
    message: "Call to API method that doesn't exist (hallucinated by AI)",
    fix: "Check the actual API documentation for the correct method name",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "naive-data-fetch",
    severity: "high",
    pattern:
      /(?:\.get\(\)\.then\([^)]{0,100}\.filter\(|getDocs\([^)]{0,100}\)[^;]{0,100}\.filter\()/g,
    message: "Fetching all data then filtering client-side",
    fix: "Use server-side filtering with where() clauses or query constraints",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  {
    id: "unbounded-query",
    severity: "medium",
    pattern:
      /(?:collection\([^)]+\)\.get\(\)|getDocs\([^)]+\)|\.onSnapshot\([^)]+\))(?![^;]{0,50}\blimit\s*\()/g,
    message: "Query without limit() on potentially large collection",
    fix: "Add limit() to prevent fetching unbounded data: query(collection, limit(50))",
    review: "ai-behavior",
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
    pathFilter: /(?:^|\/)(?:lib|app|components|pages)\//,
  },

  // Section-scoped regex parsing (4x recurrence)
  // Anti-pattern: matching markdown table rows on full file content instead of extracting the section first
  // Detects: readFileSync() for .md files followed by table-row regex on full content variable
  {
    id: "unsection-scoped-table-regex",
    severity: "medium",
    testFn: (content) => {
      // Look for reading .md files and then applying table row regex to full content
      const lines = content.split("\n");
      const matches = [];
      let lastMdReadLine = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Track where a .md read happens; keep a bounded "active window"
        if (line.includes("readFileSync") && /\.md/i.test(line)) {
          lastMdReadLine = i;
        }
        // Only consider table-regex usage within 40 lines of the .md read
        const withinReadWindow = lastMdReadLine >= 0 && i - lastMdReadLine <= 40;
        // Detect table-row regex applied broadly (not section-scoped)
        // Checks for .match(/...|.../gm) or .matchAll(/...|.../gm) patterns with pipe chars
        const hasMatchCall = line.includes(".match") || line.includes(".matchAll");
        const hasPipeRegex = hasMatchCall && line.includes(String.raw`\|`);
        if (withinReadWindow && hasPipeRegex) {
          // Check if there's a section extraction nearby (within 20 lines before)
          const start = Math.max(0, i - 20);
          const context = lines.slice(start, i).join("\n");
          if (
            !/extractSection|section\s*=|\.split\s*\(\s*['"`]#{1,3}\s|between.*heading/i.test(
              context
            )
          ) {
            matches.push({ line: i + 1, col: 0, match: line.trim().slice(0, 120) });
          }
        }
      }
      return matches;
    },
    message: "Table-row regex on full markdown content - may match rows from wrong section",
    fix: "Extract the target section first with extractSection() or split by headings before matching table rows",
    review: "CODE_PATTERNS.md JS/TS - Section-scoped regex parsing, Review #263 (4x recurrence)",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // User context in audit logs (4x recurrence)
  // Anti-pattern: writing security/audit log entries without user/session context
  {
    id: "audit-log-missing-context",
    severity: "medium",
    testFn: (content) => {
      const lines = content.split("\n");
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Detect security/audit log writes
        if (
          /(?:SECURITY|AUDIT|security.event|audit.log|securityLog|auditLog)\b/.test(line) &&
          /(?:appendFileSync|writeFileSync|console\.(?:log|warn|error)|\.push\s*\(|\.write\s*\()/.test(
            line
          )
        ) {
          // Check if user context is included nearby (within 5 lines)
          const start = Math.max(0, i - 5);
          const end = Math.min(lines.length, i + 5);
          const context = lines.slice(start, end).join("\n");
          if (!/USER_CONTEXT|SESSION_ID|userId|sessionId|user_id|session_id/.test(context)) {
            matches.push({ line: i + 1, col: 0 });
          }
        }
      }
      return matches;
    },
    message: "Security/audit log entry missing user context (USER_CONTEXT, SESSION_ID)",
    fix: "Include USER_CONTEXT and SESSION_ID in all security log entries for accountability",
    review: "CODE_PATTERNS.md JS/TS - User context in audit logs, Review #198 (4x recurrence)",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // Logical OR on numeric fields that could be 0 (PR #384 R2 recurrence)
  // Anti-pattern: count || total || 0 treats legitimate 0 as falsy
  {
    id: "logical-or-numeric-fallback",
    severity: "medium",
    testFn: (() => {
      // CC-extracted constants and helper (Review #370 R2 — CC 24→~8)
      const numericNames = ["count", "total", "length", "size", "items", "score", "round", "index"];
      const fallbackValues = ["0", "null", "undefined", '"', "'", "`"];
      function isWordChar(ch) {
        return (
          (ch >= "a" && ch <= "z") ||
          (ch >= "A" && ch <= "Z") ||
          (ch >= "0" && ch <= "9") ||
          ch === "_"
        );
      }
      function findNumericOrFallback(line) {
        for (const name of numericNames) {
          const idx = line.indexOf(name);
          if (idx === -1) continue;
          if (idx > 0 && isWordChar(line[idx - 1])) continue;
          const afterIdx = idx + name.length;
          if (afterIdx < line.length && isWordChar(line[afterIdx])) continue;
          const orIdx = line.indexOf("||", afterIdx);
          if (orIdx === -1) continue;
          const afterOr = line.slice(orIdx + 2).trimStart();
          if (fallbackValues.some((v) => afterOr.startsWith(v))) {
            return idx;
          }
        }
        return -1;
      }
      return (content) => {
        const lines = content.split("\n");
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*"))
            continue;
          if (!line.includes("||")) continue;
          const col = findNumericOrFallback(line);
          if (col >= 0) matches.push({ line: i + 1, col, match: line.trim().slice(0, 120) });
        }
        return matches;
      };
    })(),
    message:
      "Logical OR (||) on numeric field treats 0 as falsy — use nullish coalescing (??) instead",
    fix: "Replace `value || 0` with `value ?? 0` for numeric fields that may legitimately be 0",
    review: "CODE_PATTERNS.md JS/TS - || vs ?? for zero-values, PR #384 R2",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },

  // S5852 regex complexity — detect regexes likely to trigger SonarCloud S5852
  // Heuristic: count quantifiers, alternations, groups. Flag if combined complexity > threshold.
  // PR #386 retro: helper regexes inside testFn also trigger S5852.
  {
    id: "regex-complexity-s5852",
    severity: "warning",
    testFn: (() => {
      const THRESHOLD = 35;
      function estimateComplexity(body) {
        let score = 0;
        score += (body.match(/[+*?]/g) ?? []).length * 2;
        score += (body.match(/\{[\d,]+\}/g) ?? []).length * 2;
        score += (body.match(/\|/g) ?? []).length * 3;
        score += (body.match(/\(/g) ?? []).length;
        score += (body.match(/\[/g) ?? []).length;
        score += (body.match(/\\[dDwWsS]/g) ?? []).length;
        return score;
      }
      // Extract regex body by scanning forward from `/`, handling escapes and char classes
      function extractRegexBody(line, startIdx) {
        let i = startIdx + 1;
        let inCharClass = false;
        while (i < line.length) {
          const ch = line[i];
          if (ch === "\\") {
            i += 2;
            continue;
          }
          if (ch === "[") {
            inCharClass = true;
            i++;
            continue;
          }
          if (ch === "]") {
            inCharClass = false;
            i++;
            continue;
          }
          if (ch === "/" && !inCharClass) return line.slice(startIdx + 1, i);
          i++;
        }
        return null;
      }
      // Find regex literal start positions (after = , ( : ! | ? + -)
      const REGEX_START = /(?:^|[=(,;!&|?:+\-~\s])(\/)(?![/*])/g;
      return (content) => {
        const lines = content.split("\n");
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
          REGEX_START.lastIndex = 0;
          let m;
          while ((m = REGEX_START.exec(line)) !== null) {
            const slashIdx = m.index + m[0].length - 1;
            const body = extractRegexBody(line, slashIdx);
            if (!body || body.length < 5) continue;
            const score = estimateComplexity(body);
            if (score >= THRESHOLD) {
              matches.push({
                line: i + 1,
                col: slashIdx,
                match: `complexity ~${score} (threshold ${THRESHOLD}): ${line.trim().slice(0, 100)}`,
              });
            }
          }
        }
        return matches;
      };
    })(),
    message:
      "Regex likely exceeds SonarCloud S5852 complexity threshold — consider string parsing or simpler patterns",
    fix: "Replace complex regex with testFn string parsing, or split into multiple simpler patterns",
    review: "PR #386 retro — S5852 caused 0.5 avoidable rounds when helper regex was missed",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
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
  if (antiPattern.pathExclude?.test(normalizedPath)) return true;
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

  // Support testFn for patterns that use string parsing instead of regex (SonarCloud S5852 two-strikes)
  if (typeof antiPattern.testFn === "function") {
    const matches = antiPattern.testFn(content);
    const safeMatches = Array.isArray(matches) ? matches : [];
    for (const m of safeMatches) {
      if (!m || typeof m.line !== "number") continue;
      violations.push({
        file: filePath,
        line: m.line,
        id: antiPattern.id,
        severity: antiPattern.severity || "medium",
        message: antiPattern.message,
        fix: antiPattern.fix,
        review: antiPattern.review,
        match: (m.match || "").slice(0, 50),
      });
    }
    return violations;
  }

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
      if (!exclude?.test(match[0])) {
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
    if (exclude?.test(match[0])) continue;
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
    severity: antiPattern.severity || "medium",
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
  const severityTag = v.severity ? `[${v.severity.toUpperCase()}]` : "";
  const prefix = v.graduated ? "🚫 BLOCK" : "⚠️  WARN";
  console.log(`   ${prefix} ${severityTag} Line ${v.line}: ${v.message}`);
  if (v.fix) console.log(`   ✓ Fix: ${v.fix}`);
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
    console.log("   Critical-severity patterns always block. High-severity blocks in CI.");
  }
  if (warnCount > 0) {
    console.log("⚠️  Warnings are informational - fix when practical.");
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

  // Count by severity
  const bySeverity = { critical: 0, high: 0, medium: 0 };
  for (const v of violations) {
    const sev = v.severity || "medium";
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;
  }

  if (blockCount > 0) {
    console.log(`🚫 ${blockCount} BLOCKING violation(s) (critical + high in CI)`);
  }
  if (warnCount > 0) {
    console.log(`⚠️  ${warnCount} warning(s)`);
  }
  if (bySeverity.critical > 0) console.log(`   🔴 Critical: ${bySeverity.critical}`);
  if (bySeverity.high > 0) console.log(`   🟡 High: ${bySeverity.high}`);
  if (bySeverity.medium > 0) console.log(`   🔵 Medium: ${bySeverity.medium}`);
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
/**
 * Apply severity-based blocking logic.
 * Replaces time-based graduation with severity tiers:
 *   - critical → always block (no grace period)
 *   - high → block in CI/--all mode, warn in --staged (pre-commit)
 *   - medium → always warn
 * Returns { warnings: [], blocks: [] } with violations split by action
 */
function applyGraduation(violations) {
  const warnings = [];
  const blocks = [];

  for (const v of violations) {
    const severity = v.severity || "medium";
    const shouldBlock = severity === "critical" || (severity === "high" && !STAGED);

    if (shouldBlock) {
      v.graduated = true;
      blocks.push(v);
    } else {
      // medium always warns, high warns in --staged mode
      warnings.push(v);
    }
  }

  return { warnings, blocks };
}

/**
 * Collect per-pattern exclusion counts from verified-patterns and pathExcludeLists.
 * @returns {Object} Map of patternId -> { verified: number, pathExclude: number }
 */
function collectPatternExclusions() {
  const patternExclusions = {};

  // Count verified-patterns.json exclusions per pattern
  for (const [patternId, files] of Object.entries(verifiedPatterns)) {
    const count = Array.isArray(files) ? files.length : 0;
    if (count > 0) {
      patternExclusions[patternId] = { verified: count, pathExclude: 0 };
    }
  }

  // Count pathExcludeList entries per pattern (separate from verified)
  for (const ap of ANTI_PATTERNS) {
    if (ap.pathExcludeList && ap.pathExcludeList.length > 0) {
      if (!patternExclusions[ap.id]) {
        patternExclusions[ap.id] = { verified: 0, pathExclude: 0 };
      }
      patternExclusions[ap.id].pathExclude = ap.pathExcludeList.length;
    }
  }

  return patternExclusions;
}

/**
 * Determine FP status label for a given total exclusion count.
 */
function getFpStatus(total) {
  if (total > 20) return "\uD83D\uDD34 CONSIDER REMOVAL";
  if (total > 10) return "\uD83D\uDFE1 HIGH FP RISK";
  return "";
}

/**
 * Generate false-positive report showing per-pattern exclusion counts
 */
function generateFpReport() {
  const patternExclusions = collectPatternExclusions();

  // Sort by total count descending
  const sorted = Object.entries(patternExclusions)
    .map(([id, counts]) => [id, counts.verified + counts.pathExclude, counts])
    .sort((a, b) => b[1] - a[1]);

  console.log("\uD83D\uDCCA False Positive Report \u2014 Per-Pattern Exclusion Counts\n");
  console.log(`Total patterns: ${ANTI_PATTERNS.length}`);
  console.log(`Patterns with exclusions: ${sorted.length}\n`);

  if (sorted.length === 0) {
    console.log("No exclusions found.");
    return;
  }

  console.log("Pattern ID                              | Verified | PathExcl | Total | Status");
  console.log(
    "----------------------------------------|----------|----------|-------|------------------"
  );
  for (const [id, total, counts] of sorted) {
    const paddedId = id.padEnd(39);
    console.log(
      `${paddedId} | ${String(counts.verified).padStart(8)} | ${String(counts.pathExclude).padStart(8)} | ${String(total).padStart(5)} | ${getFpStatus(total)}`
    );
  }

  const highFp = sorted.filter(([, c]) => c > 10).length;
  const considerRemoval = sorted.filter(([, c]) => c > 20).length;
  console.log(`\nSummary: ${highFp} high-FP patterns, ${considerRemoval} candidates for removal`);
}

/**
 * Main function
 */
function main() {
  // Handle --fp-report mode
  if (FP_REPORT) {
    generateFpReport();
    process.exit(0);
  }

  // Expire stale warned-files entries older than 30 days (OPT #75)
  try {
    const { expireByAge } = require("../.claude/hooks/lib/rotate-state.js");
    const result = expireByAge(WARNED_FILES_PATH, 30);
    if (result.expired && VERBOSE && !JSON_OUTPUT) {
      console.log(
        `   Expired ${result.before - result.after} stale pattern warning(s) (older than 30 days)`
      );
    }
  } catch {
    // Non-critical — expiry failure doesn't block pattern checking
  }

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

  // Apply severity-based blocking:
  // - critical: blocks in ALL modes (including --staged/pre-commit)
  // - high: blocks in --all/CI, warns in --staged
  // - medium: always warns
  const { warnings, blocks } = applyGraduation(allViolations);

  if (JSON_OUTPUT) {
    // Count by severity for summary
    const severityCounts = { critical: 0, high: 0, medium: 0 };
    for (const v of allViolations) {
      const sev = v.severity || "medium";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
    console.log(
      JSON.stringify(
        {
          filesChecked: files.length,
          patternsChecked: ANTI_PATTERNS.length,
          severityCounts,
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
