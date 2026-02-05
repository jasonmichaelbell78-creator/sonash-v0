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

import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
import { join, dirname, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

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
      /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Za-z0-9_/+=-]{20,}['"`]/gi,
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
    pathExclude:
      /(?:^|[\\/])(?:phase-complete-check|check-doc-headers|sync-claude-settings|transform-jsonl-schema|eval-check-stage|eval-snapshot)\.js$/,
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
    // Exclude files verified to have proper try/catch:
    // 2026-01-04 audit:
    // - check-pattern-compliance.js: pattern definition + proper try/catch at L440
    // - phase-complete-check.js: proper try/catch at L252-261, L147-192
    // - surface-lessons-learned.js: proper try/catch at L313-318
    // - suggest-pattern-automation.js: proper try/catch at L108-113, L171-176
    // - archive-doc.js: safeReadFile wrapper at L126-154 with try/catch
    // - validate-phase-completion.js: NOW HAS try/catch at L29-35 (fixed 2026-01-04)
    // - update-readme-status.js: safeReadFile wrapper at L57-88 with try/catch (fixed 2026-01-04)
    // 2026-01-12 audit (Review #134):
    // - check-mcp-servers.js: readFileSync at L60 IS in try/catch (L58-106)
    // - session-start.js: computeHash() L72 in try/catch L70-76, needsRootInstall() L88 in try/catch L83-92, needsFunctionsInstall() L105 in try/catch L99-110
    // 2026-01-13 audit (Review #143):
    // - log-override.js: readFileSync at L153 IS in try/catch (L152-158)
    // - log-session-activity.js: readFileSync at L118 IS in try/catch (L117-123)
    // - validate-skill-config.js: readFileSync at L105 IS in try/catch (L104-109)
    // - verify-skill-usage.js: readFileSync at L77 IS in try/catch (L76-82)
    // 2026-01-16 audit (Review #159):
    // - run-consolidation.js: readFileSync at L413 IS in try/catch (L412-419)
    // 2026-01-17 audit (Review #175):
    // - aggregate-audit-findings.js: readFileSync at L145, L181, L246 all in try/catch blocks
    // 2026-01-19 audit (Review #181):
    // - generate-detailed-sonar-report.js: readFileSync at L27, L43, L76 all in try/catch blocks
    // - generate-sonar-report-with-snippets.js: ARCHIVED to docs/archive/obsolete-scripts-2026-02/
    // - verify-sonar-phase.js: readFileSync at L135, L195, L215 all in try/catch blocks
    // 2026-01-20 audit (PR #286):
    // - check-backlog-health.js: readFileSync at L250 IS in try/catch (L242-292)
    // - security-check.js: readFileSync at L358 IS in try/catch (L357-361)
    // 2026-01-21 audit (Review #191):
    // - encrypt-secrets.js: readFileSync at L136 IS in try/catch (L135-140)
    // - decrypt-secrets.js: readFileSync at L178 IS in try/catch (L177-191), L197 in try/catch (L196-201)
    // 2026-01-23 audit (Review #200):
    // - pattern-check.js: readFileSync at L117 IS in try/catch (L110-125)
    // 2026-01-24 audit (Review #200):
    // - analyze-learning-effectiveness.js: readFileSync at L143, L241, L308 all in try/catch blocks
    // S5843: Use array instead of complex regex to reduce complexity from 21 to < 20
    // (Review #184 - SonarCloud regex complexity)
    pathExcludeList: [
      "check-pattern-compliance.js",
      "phase-complete-check.js",
      "surface-lessons-learned.js",
      "suggest-pattern-automation.js",
      "archive-doc.js",
      "validate-phase-completion.js",
      "update-readme-status.js",
      "check-mcp-servers.js",
      "session-start.js",
      "log-override.js",
      "log-session-activity.js",
      "validate-skill-config.js",
      "verify-skill-usage.js",
      "run-consolidation.js",
      "aggregate-audit-findings.js",
      "generate-detailed-sonar-report.js",
      // generate-sonar-report-with-snippets.js - ARCHIVED to docs/archive/obsolete-scripts-2026-02/
      "verify-sonar-phase.js",
      "check-backlog-health.js",
      "security-check.js",
      "encrypt-secrets.js",
      "decrypt-secrets.js",
      "pattern-check.js",
      "analyze-learning-effectiveness.js",
      // 2026-01-24 audit (Review #202):
      // - check-pattern-sync.js: readFileSync at L105 IS in try/catch (L104-109), L232 in try/catch (L231-235)
      // - security-helpers.js: safeReadFile at L322 IS in try/catch (L321-329)
      "check-pattern-sync.js",
      "security-helpers.js",
      // 2026-01-26 audit (Review #198):
      // - audit-s0s1-validator.js: readFileSync at L216 IS in try/catch (L214-221)
      "audit-s0s1-validator.js",
      // 2026-01-26 audit (Review #208):
      // - check-remote-session-context.js: readFileSync at L113 IS in try/catch (L112-118)
      // - track-agent-invocation.js: readFileSync at L61 IS in try/catch (L60-64), L92 IS in try/catch (L91-96)
      // - check-agent-compliance.js: readFileSync at L76 IS in try/catch (L74-80)
      "check-remote-session-context.js",
      "track-agent-invocation.js",
      "check-agent-compliance.js",
      // 2026-01-27 audit (Review #212):
      // - check-roadmap-health.js: readFileSync at L39 IS in try/catch (L38-47 readFile function)
      "check-roadmap-health.js",
      // 2026-01-28 audit (Review #214):
      // - alerts-reminder.js: all readFileSync calls in try/catch (checkContextSize L35-47, checkPendingMcpSave, main)
      // - auto-save-context.js: loadJson has try/catch (L57-62), getRecentDecisions has try/catch (L112-114)
      // - run-alerts.js: all readFileSync calls verified in try/catch blocks
      // - large-context-warning.js: readFileSync L93 in try/catch (L92-103), L127 in try/catch (L126-131)
      // - generate-pending-alerts.js: all readFileSync now wrapped in try/catch after refactor
      // - append-hook-warning.js: readWarnings has try/catch (L40-48 after refactor)
      "alerts-reminder.js",
      "auto-save-context.js",
      "run-alerts.js",
      "large-context-warning.js",
      "generate-pending-alerts.js",
      "append-hook-warning.js",
      // 2026-01-29 audit (Review #217):
      // - check-doc-headers.js: readFileSync at L100 IS in try/catch (L99-126)
      // - session-end-commit.js: readFileSync at L86 IS in try/catch (L85-90)
      "check-doc-headers.js",
      "session-end-commit.js",
      // 2026-01-31 audit (Review #221):
      // - check-phase-status.js: readFileSync at L53 IS in try/catch (L49-68)
      // - intake-manual.js: readFileSync at L119 IS in try/catch (L118-124)
      "check-phase-status.js",
      "intake-manual.js",
      // 2026-02-02 audit (Review #224):
      // - generate-metrics.js: readFileSync at L47 IS in try/catch (L45-52), loadMasterDebt validated
      // - assign-roadmap-refs.js: readFileSync at L140 IS in try/catch (L139-145)
      // - sync-claude-settings.js: readFileSync at L84 IS in try/catch (L83-91) via readJson helper
      // - statusline.js (hooks/global): readFileSync at L67 IS in try/catch (L59-73), L82 IS in try/catch (L81-88)
      // - gsd-check-update.js: readFileSync at L37 IS in try/catch (L36-38) in spawned child process code
      "generate-metrics.js",
      "assign-roadmap-refs.js",
      "sync-claude-settings.js",
      "statusline.js",
      "gsd-check-update.js",
      // 2026-02-02 audit (PR #329):
      // - check-content-accuracy.js: readFileSync at L49 IS in try/catch (L47-52), L408 IS in try/catch (L407)
      // - check-doc-placement.js: readFileSync at L504 IS in try/catch (L503)
      // - check-external-links.js: readFileSync at L580 IS in try/catch (L579-587)
      "check-content-accuracy.js",
      "check-doc-placement.js",
      "check-external-links.js",
      // 2026-02-03 audit (Review #127):
      // - ai-pattern-checks.js: readFileSync at L34 IS in try/catch (L33-38)
      "ai-pattern-checks.js",
      // 2026-02-03 audit (PR #333):
      // - validate-audit-integration.js: readFileSync at L164 IS in try/catch (L163-171),
      //   L578 IS in try/catch (L577-603), L901 IS in try/catch (L900-905)
      "validate-audit-integration.js",
      // 2026-02-03 audit (Review #238 PR #334):
      // - transform-jsonl-schema.js: readFileSync at L497 IS in try/catch (L496-502),
      //   File paths in --all mode at L621 come from fs.readdirSync(), containment check at L623,
      //   symlink check at L627-640 after line additions
      "transform-jsonl-schema.js",
      // 2026-02-04 audit (Review #242):
      // - sync-consolidation-counter.js: readFileSync at L74 IS in try/catch (L73-83)
      "sync-consolidation-counter.js",
      // 2026-02-05 audit (Review #249 PR #336):
      // - eval-check-stage.js: all readFileSync in try/catch (L65-68, L122-132, L171-178, L702-707, L765-772, L876-880)
      // - eval-snapshot.js: all readFileSync in try/catch (L55-58, L76-80, L121-126, L152-155)
      // - unify-findings.js: readFileSync at L67 IS in try/catch (L66-70)
      // - normalize-format.js: readFileSync at L811 IS in try/catch (L810-815)
      // - aggregate-category.js: readFileSync at L131 IS in try/catch (L130-134), L544 IS in try/catch (L543-547)
      // - eval-report.js: readFileSync at L41 IS in try/catch (L40-44), L60 IS in try/catch (L59-63)
      // - fix-schema.js: readFileSync at L520 IS in try/catch (L519-524)
      // - state-manager.js: readFileSync at L157 IS in try/catch (L156-161), L193 IS in try/catch (L192-196)
      "eval-check-stage.js",
      "eval-snapshot.js",
      "unify-findings.js",
      "normalize-format.js",
      "aggregate-category.js",
      "eval-report.js",
      "fix-schema.js",
      "state-manager.js",
      // 2026-02-05 (Review #249): generate-views.js readFileSync at L79 IS in try/catch (L78-108),
      //   L129 now IS in try/catch (L129-135)
      "generate-views.js",
      // extract-sonarcloud.js - ARCHIVED to docs/archive/obsolete-scripts-2026-02/
      // 2026-02-05 (Review #249): validate-schema.js readFileSync at L181 IS in try/catch (L180-185)
      "validate-schema.js",
    ],
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
    pathExclude:
      /(?:^|[\\/])(?:check-pattern-compliance|phase-complete-check|check-edit-requirements|check-write-requirements|check-mcp-servers|pattern-check|session-start|validate-paths|analyze-learning-effectiveness|security-helpers|check-remote-session-context|track-agent-invocation|check-roadmap-health|check-doc-headers|statusline|sync-claude-settings|ai-pattern-checks|eval-check-stage|eval-snapshot|unify-findings|normalize-format)\.js$/,
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
    const extensions = [".sh", ".yml", ".yaml", ".js", ".ts", ".tsx", ".jsx"];
    const ignoreDirs = ["node_modules", ".next", "dist", "dist-tests", ".git", "coverage"];

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
            if (!ignoreDirs.includes(entry)) {
              walk(fullPath);
            }
          } else {
            const ext = extname(entry);
            // Include files with known extensions OR extensionless files in .husky
            if (extensions.includes(ext)) {
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
 * Format output as text
 */
function formatTextOutput(violations, filesChecked) {
  if (violations.length === 0) {
    console.log("✅ No pattern violations found");
    console.log(
      `   Checked ${filesChecked} file(s) against ${ANTI_PATTERNS.length} known anti-patterns`
    );
    return;
  }

  console.log(`⚠️  Found ${violations.length} potential pattern violation(s)\n`);

  // Group by file
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.log(`📄 ${file}`);
    for (const v of fileViolations) {
      console.log(`   Line ${v.line}: ${v.message}`);
      console.log(`   ✓ Fix: ${v.fix}`);
      console.log(`   📚 See: Review ${v.review} in AI_REVIEW_LEARNINGS_LOG.md`);
      if (VERBOSE) {
        console.log(`   Match: ${v.match}`);
      }
      console.log("");
    }
  }

  console.log("---");
  console.log("These patterns have caused issues before. Review and fix if applicable.");
  console.log("Some may be false positives - use judgment based on context.");
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

  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        {
          filesChecked: files.length,
          patternsChecked: ANTI_PATTERNS.length,
          violations: allViolations,
        },
        null,
        2
      )
    );
  } else {
    formatTextOutput(allViolations, files.length);
  }

  process.exit(allViolations.length > 0 ? 1 : 0);
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
