#!/usr/bin/env node
/**
 * Pattern Compliance Checker
 *
 * Scans code for known anti-patterns documented in project learnings.
 * This is a learning reinforcement tool - it surfaces patterns that have caused issues before.
 *
 * Usage: node scripts/reviews/check-pattern-compliance.js [options] [files...]
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

const {
  readFileSync,
  existsSync,
  readdirSync,
  lstatSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
} = require('node:fs');
const { join, dirname, extname, relative } = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = join(__dirname, '..', '..');

// Load verified pattern exclusions from JSON config (single source of truth)
let verifiedPatterns = {};
try {
  const { loadConfig } = require('../config/load-config.js');
  verifiedPatterns = loadConfig('verified-patterns');
} catch {
  // Config not available - use empty defaults
}

// Graduation system: warn once per file, block on repeat
// State file tracks which files have been warned for which patterns
const WARNED_FILES_PATH = join(ROOT, '.claude', 'state', 'warned-files.json');

// TTL for warned-files entries: entries older than this are expired on load
const WARNED_FILES_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// eslint-disable-next-line complexity -- _loadWarnedFiles has inherent branching (complexity 17), refactoring would reduce readability
function _loadWarnedFiles() {
  try {
    const raw = readFileSync(WARNED_FILES_PATH, 'utf-8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn('Warning: warned-files.json is not a plain object - resetting');
      return {};
    }

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
        writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        if (existsSync(WARNED_FILES_PATH)) unlinkSync(WARNED_FILES_PATH);
        renameSync(tmpPath, WARNED_FILES_PATH);
      } catch {
        /* best effort */
      }
    }

    return data;
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : null;
    if (code === 'ENOENT') return {};
    console.warn(`Warning: could not load pattern warning state`);
    return null;
  }
}

function tryUnlink(filePath) {
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch {
    // Best-effort
  }
}

function isSymlink(filePath) {
  try {
    return existsSync(filePath) && lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

const MAX_WARNED_ENTRIES = 200;

function _saveWarnedFiles(warned) {
  const dir = dirname(WARNED_FILES_PATH);
  const tmpPath = WARNED_FILES_PATH + `.tmp.${process.pid}`;
  const bakPath = WARNED_FILES_PATH + `.bak.${process.pid}`;

  try {
    if (isSymlink(dir)) {
      console.warn('Warning: state directory is a symlink - refusing to write');
      return;
    }

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (isSymlink(WARNED_FILES_PATH) || isSymlink(tmpPath)) {
      console.warn('Warning: state file or tmp is a symlink - refusing to write');
      return;
    }

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

    // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
    writeFileSync(tmpPath, JSON.stringify(warned, null, 2), 'utf-8');

    try {
      if (existsSync(WARNED_FILES_PATH)) renameSync(WARNED_FILES_PATH, bakPath);
    } catch {
      // If backup fails, proceed
    }

    renameSync(tmpPath, WARNED_FILES_PATH);
    tryUnlink(bakPath);
  } catch (err) {
    tryUnlink(tmpPath);
    try {
      if (existsSync(bakPath) && !existsSync(WARNED_FILES_PATH))
        renameSync(bakPath, WARNED_FILES_PATH);
    } catch {
      // Best-effort restore
    }

    const msg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    console.warn(`Warning: could not save pattern warning state: ${msg}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const STAGED = args.includes('--staged');
const ALL = args.includes('--all');
const VERBOSE = args.includes('--verbose');
const JSON_OUTPUT = args.includes('--json');
const FP_REPORT = args.includes('--fp-report');
const FILES = args.filter((a) => !a.startsWith('--'));

/**
 * Global excludes - development utility scripts with pre-existing technical debt
 * Pattern: relative path regexes matched against file path
 */
const GLOBAL_EXCLUDE = [
  // Documentation files that contain pattern examples (not violations)
  /^docs\/.*LEARNINGS.*\.md$/,
  // This file contains pattern definitions as strings (meta-detection false positives)
  /^scripts\/reviews\/check-pattern-compliance\.js$/,
  // Pattern test suite contains anti-pattern examples as test fixtures
  /^tests\/pattern-compliance\.test\.js$/,
  // Archived/obsolete scripts
  /^docs\/archive\//,
  // One-time migration scripts (rarely run)
  /^scripts\/migrate-.*\.ts$/,
  /^scripts\/seed-.*\.ts$/,
];

/**
 * Known anti-patterns to check for
 * Each pattern has:
 * - pattern: RegExp to match the anti-pattern
 * - message: Human-readable description
 * - fix: The correct pattern to use
 * - fileTypes: Which file extensions to check
 */
const ANTI_PATTERNS = [
  // Bash/Shell patterns
  {
    id: 'exit-code-capture',
    severity: 'high',
    pattern: /\$\(\s*[^)]{1,500}\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
    message:
      'Exit code capture bug: $? after assignment captures assignment exit (always 0), not command exit',
    fix: 'Use: if ! OUT=$(cmd); then',
    review: 'Shell best practices',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'for-file-iteration',
    severity: 'medium',
    pattern: /for\s+\w{1,200}\s+in\s+\$\{?\w{1,200}\}?\s{0,50};?\s{0,50}do/g,
    message: 'File iteration with for loop breaks on spaces in filenames',
    fix: 'Use: while IFS= read -r file; do ... done < file_list',
    review: 'Shell best practices',
    fileTypes: ['.sh', '.yml', '.yaml'],
    pathExcludeList: verifiedPatterns['for-file-iteration'] || [],
  },
  {
    id: 'missing-trap',
    severity: 'medium',
    pattern: /mktemp\)(?![\s\S]{0,100}trap)/g,
    message: 'Temp file created without trap for cleanup',
    fix: 'Add: trap \'rm -f "$TMPFILE"\' EXIT after mktemp',
    review: 'Shell best practices',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'retry-loop-no-success-tracking',
    severity: 'high',
    pattern:
      /for\s+\w+\s+in\s+1\s+2\s+3\s*;\s*do[\s\S]{0,120}?&&\s*break[\s\S]{0,80}?done(?![\s\S]{0,80}?(?:\bSUCCESS\b|\bsuccess\b|\bFAILED\b|\bfailed\b))/g,
    message: 'Retry loop may silently succeed on failure - not tracking success',
    fix: 'Track: SUCCESS=false; for i in 1 2 3; do cmd && { SUCCESS=true; break; }; done; $SUCCESS || exit 1',
    review: 'Shell best practices',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'npm-install-automation',
    severity: 'high',
    pattern: /npm\s+install\b[^\n]*/g,
    message: 'npm install in automation can modify lockfile',
    fix: 'Use: npm ci (reads lockfile exactly)',
    review: 'CI best practices',
    fileTypes: ['.sh', '.yml', '.yaml'],
    exclude: /--legacy-peer-deps|--save|--save-dev|-[gDS]\b|--global/,
    pathExclude: /session-start\.(?:sh|js)$/,
  },

  // JavaScript/TypeScript patterns
  {
    id: 'regex-global-test-loop',
    severity: 'high',
    pattern:
      /new\s+RegExp\s*\([^)]{1,500},\s*['"`][^'"]{0,200}g[^'"]{0,200}['"`]\s*\)[\s\S]{0,200}\.test\s*\(/g,
    message:
      'Regex with global flag used with .test() in loop - stateful lastIndex causes missed matches',
    fix: 'Remove "g" flag when using .test(), or reset lastIndex between iterations',
    review: 'JS best practices',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },

  // GitHub Actions patterns
  {
    id: 'unsafe-interpolation',
    severity: 'critical',
    pattern: /`[^`]*\$\{\{\s*(?:steps|github|env|inputs)\.[^}]+\}\}[^`]*`/g,
    message: 'Unsafe ${{ }} interpolation in JavaScript template literal',
    fix: 'Use env: block to pass value, then process.env.VAR',
    review: 'CI security',
    fileTypes: ['.yml', '.yaml'],
    pathExcludeList: verifiedPatterns['unsafe-interpolation'] || [],
  },
  {
    id: 'hardcoded-temp-path',
    severity: 'medium',
    pattern: /[>|]\s*\/tmp\/\w+(?!\.)/g,
    message: 'Hardcoded /tmp path - use mktemp for unique files',
    fix: 'Use: TMPFILE=$(mktemp) and trap for cleanup',
    review: 'Shell best practices',
    fileTypes: ['.yml', '.yaml', '.sh'],
  },
  {
    id: 'implicit-if-expression',
    severity: 'medium',
    pattern: /^\s*if:\s+(?!.{0,500}\$\{\{).{0,500}(?:steps|github|env|inputs|needs)\./gm,
    message: 'Implicit expression in if: condition can cause YAML parser issues',
    fix: 'Always use explicit ${{ }} in if: conditions',
    review: 'CI best practices',
    fileTypes: ['.yml', '.yaml'],
    pathExclude: /(?:^|[\\/])ci\.yml$/,
  },
  {
    id: 'fragile-bot-detection',
    severity: 'medium',
    pattern: /\.user\.type\s*===?\s*['"`]Bot['"`]/g,
    message: 'Fragile bot detection - user.type is unreliable',
    fix: 'Use: user.login === "github-actions[bot]"',
    review: 'CI best practices',
    fileTypes: ['.yml', '.yaml', '.js', '.ts'],
  },

  // Security patterns
  {
    id: 'simple-path-traversal-check',
    severity: 'critical',
    pattern: /startsWith\s*\(\s*['"`]\.\.['"`]\s*\)/g,
    message: 'Simple ".." check has false positives (e.g., "..hidden.md")',
    fix: 'Use: /^\\.\\.(?:[\\\\/]|$)/.test(rel)',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },
  {
    id: 'unsanitized-error-response',
    severity: 'critical',
    pattern:
      /res\.(?:json|send|status\s*\([^)]*\)\s*\.json)\s*\(\s*\{[\s\S]{0,300}?(?:error|err|e|exception)\.(?:message|stack|toString\s*\()/g,
    message: 'Exposing raw error messages/stack traces to clients',
    fix: 'Return sanitized error messages (e.g., "An error occurred"), log full details server-side',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'missing-rate-limit-comment',
    severity: 'medium',
    pattern:
      /(?:exports\.|module\.exports|export\s+(?:default\s+)?(?:async\s+)?function)\s+\w+(?:Handler|API|Endpoint)/gi,
    message: 'API endpoint may need rate limiting (verify rate limit is implemented)',
    fix: 'Ensure endpoint has rate limiting',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)(?:pages|app|routes|api|functions)\/.*(?:api|routes|handlers|endpoints)?/i,
  },
  {
    id: 'path-join-without-containment',
    severity: 'critical',
    pattern:
      /path\.join\s*\([^)]{0,500},\s*(?:deliverable|user|input|arg|param|file)\w*(?:\.path)?[^)]{0,500}\)(?![\s\S]{0,100}(?:relative|isWithin|contains|startsWith))/g,
    message: 'Path joined with user input without containment check',
    fix: 'Verify path.relative(root, resolved) does not start with ".." or equal ""',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
    pathExcludeList: verifiedPatterns['path-join-without-containment'] || [],
  },
  {
    id: 'error-without-first-line',
    severity: 'high',
    pattern:
      /String\s*\(\s*(?:err|error|e)(?:\?\.message|\s*\?\?\s*err|\s*\?\?\s*error)[\s\S]{0,30}\)(?![\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\))/g,
    message: 'Error converted to string without extracting first line (stack trace leakage)',
    fix: 'Use: String(err?.message ?? err).split("\\n")[0].replace(/\\r$/, "")',
    review: 'Error handling',
    fileTypes: ['.js', '.ts'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
  },
  {
    id: 'console-log-file-content',
    severity: 'medium',
    pattern:
      /console\.(?:log|error|warn)\s*\([^)]*(?:content|fileContent|data|text|body)(?:\s*[,)])/g,
    message: 'File-derived content logged without control char sanitization',
    fix: 'Sanitize with: content.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "")',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'split-newline-without-cr-strip',
    severity: 'medium',
    pattern:
      /\.split\s*\(\s*['"`]\\n['"`]\s*\)\s*\[\s*0\s*\](?![\s\S]{0,30}\.replace\s*\(\s*\/\\r\$\/)/g,
    message: 'Line split without stripping trailing \\r (Windows CRLF issue)',
    fix: 'Add: .replace(/\\r$/, "") after split to handle CRLF',
    review: 'Cross-platform',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'path-split-without-normalize',
    severity: 'critical',
    pattern:
      /\.split\s*\(\s*['"`]\/['"`]\s*\)[\s\S]{0,50}includes\s*\(\s*['"`]\.\.['"`]\s*\)(?![\s\S]{0,100}replace\s*\(\s*\/\\\\\/g)/g,
    message: 'Path traversal check splits on / without normalizing Windows backslashes',
    fix: 'First normalize: path.replace(/\\\\/g, "/").split("/").includes("..")',
    review: 'Cross-platform security',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'auto-mode-slice-truncation',
    severity: 'high',
    pattern: /(?:isAutoMode|isAuto|autoMode)\s*\?[\s\S]{0,50}\.slice\s*\(\s*0\s*,/g,
    message: 'Auto/CI mode should check ALL items, not truncate - limits are for interactive only',
    fix: 'Use: isAutoMode ? allItems : allItems.slice(0, MAX)',
    review: 'CI best practices',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'readline-no-close',
    severity: 'medium',
    pattern:
      /readline\.createInterface\s*\([\s\S]{0,500}process\.exit\s*\(\s*\d+\s*\)(?![\s\S]{0,50}close\s*\()/g,
    message: 'Script exits without closing readline interface (may hang)',
    fix: 'Create closeRl() helper and call before every process.exit()',
    review: 'Resource management',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'missing-array-isarray',
    severity: 'high',
    pattern:
      /(?:\.length\b|\.forEach\s*\(|\.map\s*\(|\.filter\s*\()[\s\S]{0,5}(?![\s\S]{0,100}Array\.isArray)/g,
    message: 'Array method used without Array.isArray guard - crashes on non-array values',
    fix: 'Guard with: if (Array.isArray(data)) { ... } or default: const arr = Array.isArray(x) ? x : [];',
    review: 'Defensive coding',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
    pathExcludeList: verifiedPatterns['missing-array-isarray'] || [],
  },
  {
    id: 'exec-without-global',
    severity: 'high',
    pattern: /while\s*\(\s*\(\s*\w+\s*=\s*(?:\w+)\.exec\s*\([^)]+\)\s*\)/g,
    message: 'exec() in while loop requires /g flag - without it, infinite loop',
    fix: 'Ensure regex has /g flag, or use String.prototype.matchAll() instead',
    review: 'JS best practices',
    fileTypes: ['.js', '.ts'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['exec-without-global'] || [],
  },
  {
    id: 'git-without-separator',
    severity: 'high',
    pattern:
      /exec(?:Sync|FileSync)?\s*\(\s*['"`]git\s+(?:add|rm|checkout|diff|log|show|blame)\b(?![\s\S]{0,100}['"`]\s*--\s*['"`]|['"`],\s*\[[\s\S]{0,200}['"`]--['"`])/g,
    message: 'Git command without -- separator - filenames starting with - are treated as options',
    fix: 'Always use -- before file arguments: git add -- file.txt',
    review: 'Git best practices',
    fileTypes: ['.js', '.ts', '.sh'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['git-without-separator'] || [],
  },
  {
    id: 'process-exit-without-cleanup',
    severity: 'medium',
    pattern: /process\.exit\s*\(\s*[12]\s*\)(?![\s\S]{0,50}finally)/g,
    message: 'process.exit() without cleanup - open handles, temp files may leak',
    fix: 'Use cleanup function before exit, or set process.exitCode and return',
    review: 'Resource management',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|metrics)\//,
    pathExcludeList: verifiedPatterns['process-exit-without-cleanup'] || [],
  },
  {
    id: 'missing-bom-handling',
    severity: 'medium',
    pattern:
      /readFileSync\s*\([^)]+,\s*['"`]utf-?8['"`]\s*\)(?![\s\S]{0,50}\.replace\s*\(\s*\/\\uFEFF)/g,
    message: 'UTF-8 file read without BOM stripping - BOM can break JSON.parse and regex',
    fix: "Add: .replace(/\\uFEFF/g, '') after reading UTF-8 files",
    review: 'File I/O',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\/(?:debt|improvements|audits)\//,
    pathExcludeList: verifiedPatterns['missing-bom-handling'] || [],
  },
  {
    id: 'unbounded-file-read',
    severity: 'medium',
    pattern:
      /readFileSync\s*\([^)]+\)[\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\)(?![\s\S]{0,50}(?:slice|MAX_LINES))/g,
    message: 'Reading entire file then splitting - may OOM on large files',
    fix: 'Use readline or stream for large files, or add size check: if (stat.size > MAX_SIZE) skip',
    review: 'Performance',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\//,
    pathExcludeList: verifiedPatterns['unbounded-file-read'] || [],
  },
  {
    id: 'startswith-slash-check',
    severity: 'high',
    pattern: /\.startsWith\s*\(\s*['"]\/['"]\s*\)/g,
    message: String.raw`startsWith('/') misses Windows absolute paths (C:\) - use path.isAbsolute()`,
    fix: 'Use path.isAbsolute(p) for cross-platform absolute path detection',
    review: 'Cross-platform',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\//,
  },
  {
    id: 'git-diff-no-filter',
    severity: 'high',
    pattern: /git\s+diff[^\n]*--name-only(?![^\n]*--diff-filter)/g,
    message: 'git diff --name-only without --diff-filter includes deleted files',
    fix: 'Add --diff-filter=ACM to exclude deleted files',
    review: 'Git best practices',
    fileTypes: ['.sh', '.js', '.ts'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['git-diff-no-filter'] || [],
  },
  {
    id: 'xargs-without-guard',
    severity: 'medium',
    pattern: /\|\s*xargs\b(?![^\n]*(?:-r\b|--no-run-if-empty))/g,
    message: 'xargs without -r flag may hang or run with empty input on some platforms',
    fix: "Use xargs -r (--no-run-if-empty) or pipe through 'grep .' first",
    review: 'Shell best practices',
    fileTypes: ['.sh'],
  },
  {
    id: 'rename-without-remove',
    severity: 'high',
    pattern: /\brenameSync\s*\(/g,
    message: 'renameSync without prior rmSync - fails on Windows if destination exists',
    fix: 'Remove destination first: if (fs.existsSync(dest)) fs.rmSync(dest, { force: true }); fs.renameSync(tmp, dest);',
    review: 'Cross-platform',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['rename-without-remove'] || [],
  },

  // JSONL line parsing
  {
    id: 'jsonl-parse-no-try-catch',
    severity: 'high',
    testFn: (content) => {
      const matches = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/JSON\.parse\s*\(\s*(?:line|l|entry|row)\b/.test(line)) {
          const context = lines.slice(Math.max(0, i - 15), i + 1).join('\n');
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
    message: 'JSONL line parsing without try/catch - single corrupt line crashes entire script',
    fix: 'Wrap JSON.parse(line) in try/catch with line number tracking',
    review: 'JSONL handling',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|[\\/])scripts[\\/]/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['jsonl-parse-no-try-catch'] || [],
  },

  // Rename fallback guard
  {
    id: 'rename-no-fallback',
    severity: 'high',
    testFn: (content) => {
      const matches = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\brenameSync\s*\(/.test(line)) {
          const contextBefore = lines.slice(Math.max(0, i - 15), i + 1).join('\n');
          const contextAfter = lines.slice(i, Math.min(lines.length, i + 30)).join('\n');
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
    message: 'renameSync without try/catch + fallback copy/unlink - fails on cross-drive moves',
    fix: 'Wrap in try/catch: try { renameSync(src, dest); } catch { copyFileSync(src, dest); unlinkSync(src); }',
    review: 'Cross-platform file I/O',
    fileTypes: ['.js'],
    pathFilter: /(?:^|[\\/])scripts[\\/]/,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['rename-no-fallback'] || [],
  },

  // AI Behavior Patterns
  {
    id: 'happy-path-only',
    severity: 'high',
    testFn: (content) => {
      const lines = content.split('\n');
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (!/\basync\s+function\b/.test(lines[i])) continue;
        const window = lines.slice(i, Math.min(lines.length, i + 80)).join('\n');
        if (!/\bawait\b/.test(window)) continue;
        if (/\btry\s*\{/.test(window)) continue;
        matches.push({ line: i + 1, match: lines[i].trim() });
      }
      return matches;
    },
    message: 'Function handles only success path, no error handling',
    fix: 'Add try/catch with proper error handling for async operations',
    review: 'AI behavior patterns',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
    pathFilter: /(?:^|\/)(?:lib|app|components|pages|src)\//,
    pathExcludeList: verifiedPatterns['happy-path-only'] || [],
  },
  {
    id: 'ai-todo-markers',
    severity: 'medium',
    pattern: /(?:TODO|FIXME)[^A-Z]*(?:AI|claude|LLM|GPT)|AI should fix|Claude will/gi,
    message: 'TODO comment referencing AI that was never resolved',
    fix: 'Resolve the TODO or convert to a concrete task with ticket reference',
    review: 'AI behavior patterns',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },
  {
    id: 'overconfident-security',
    severity: 'medium',
    pattern:
      /(?:this is secure|security guaranteed|fully protected|completely safe|no vulnerabilities|unhackable)/gi,
    message: 'Comment claiming security without evidence',
    fix: 'Replace with specific security measures taken, or remove the claim',
    review: 'AI behavior patterns',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },

  // Logical OR on numeric fields
  {
    id: 'logical-or-numeric-fallback',
    severity: 'medium',
    testFn: (() => {
      const numericNames = ['count', 'total', 'length', 'size', 'items', 'score', 'round', 'index'];
      const fallbackValues = ['0', 'null', 'undefined', '"', "'", '`'];
      function isWordChar(ch) {
        return (
          (ch >= 'a' && ch <= 'z') ||
          (ch >= 'A' && ch <= 'Z') ||
          (ch >= '0' && ch <= '9') ||
          ch === '_'
        );
      }
      function findNumericOrFallback(line) {
        for (const name of numericNames) {
          const idx = line.indexOf(name);
          if (idx === -1) continue;
          if (idx > 0 && isWordChar(line[idx - 1])) continue;
          const afterIdx = idx + name.length;
          if (afterIdx < line.length && isWordChar(line[afterIdx])) continue;
          const orIdx = line.indexOf('||', afterIdx);
          if (orIdx === -1) continue;
          const afterOr = line.slice(orIdx + 2).trimStart();
          if (fallbackValues.some((v) => afterOr.startsWith(v))) {
            return idx;
          }
        }
        return -1;
      }
      return (content) => {
        const lines = content.split('\n');
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          // eslint-disable-next-line framework/no-path-startswith -- safe: comparing against known constant prefix
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))
            continue;
          if (!line.includes('||')) continue;
          const col = findNumericOrFallback(line);
          if (col >= 0) matches.push({ line: i + 1, col, match: line.trim().slice(0, 120) });
        }
        return matches;
      };
    })(),
    message:
      'Logical OR (||) on numeric field treats 0 as falsy - use nullish coalescing (??) instead',
    fix: 'Replace `value || 0` with `value ?? 0` for numeric fields that may legitimately be 0',
    review: 'JS best practices',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['logical-or-numeric-fallback'] || [],
  },

  {
    id: 'absolute-path-in-log',
    severity: 'medium',
    pattern:
      /(?:console\.(?:log|error|warn)\s*)\([^)]*(?:__dirname|__filename|process\.cwd\(\)|path\.(?:resolve|join)\([^)]*\))/g,
    message:
      'Logging absolute paths exposes filesystem structure - use path.relative(ROOT, target) instead',
    fix: 'Use path.relative(ROOT_DIR, filePath) before logging file paths',
    review: 'Security best practices',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)scripts\//,
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['absolute-path-in-log'] || [],
  },

  {
    id: 'git-log-pipe-delimiter',
    severity: 'medium',
    pattern: /git\s+log[^\n]*--(?:format|pretty)=[^\n]*%[a-zA-Z][^\n]*\|[^\n]*%[a-zA-Z]/g,
    message:
      'git log format using | as delimiter - commit messages containing | will corrupt parsing',
    fix: String.raw`Use \x1f (Unit Separator) instead of | in git log --format fields`,
    review: 'Git best practices',
    fileTypes: ['.js', '.ts', '.sh'],
    pathExclude: /(?:^|[\\/])check-pattern-compliance\.js$/,
    pathExcludeList: verifiedPatterns['git-log-pipe-delimiter'] || [],
  },
];

/**
 * Check if a file path matches any global exclude pattern
 */
function isGloballyExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return GLOBAL_EXCLUDE.some((pattern) => pattern.test(normalized));
}

function getFilesToCheck() {
  if (FILES.length > 0) {
    return FILES.filter((f) => !/^(?:\/|[A-Za-z]:[\\/]|\\\\|\/\/|\\(?!\\))/.test(f))
      .map((f) => join(ROOT, f))
      .filter((abs) => {
        const rel = relative(ROOT, abs);
        return rel && !/^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/.test(rel) && !/^\.\.(?:[\\/]|$)/.test(rel);
      })
      .map((abs) => relative(ROOT, abs))
      .filter((rel) => existsSync(join(ROOT, rel)))
      .filter((rel) => !isGloballyExcluded(rel));
  }

  if (STAGED) {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: ROOT,
        encoding: 'utf-8',
      });
      return output
        .trim()
        .split('\n')
        .filter((f) => f.trim())
        .filter((f) => !isGloballyExcluded(f));
    } catch {
      return [];
    }
  }

  if (ALL) {
    const files = [];
    const extensions = new Set(['.sh', '.yml', '.yaml', '.js', '.ts', '.tsx', '.jsx']);
    const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'dist-tests', '.git', 'coverage']);

    function walk(dir) {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);

          let lstat;
          try {
            lstat = lstatSync(fullPath);
          } catch {
            continue;
          }

          if (lstat.isSymbolicLink()) continue;

          if (lstat.isDirectory()) {
            if (!ignoreDirs.has(entry)) walk(fullPath);
          } else {
            const ext = extname(entry);
            if (extensions.has(ext)) {
              files.push(relative(ROOT, fullPath));
            } else if (!ext) {
              const relDir = relative(ROOT, dir).replace(/\\/g, '/');
              if (relDir.startsWith('.husky')) {
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
    return files.filter((f) => !isGloballyExcluded(f));
  }

  // Default: check common problem areas
  return [
    '.husky/pre-commit',
    '.github/workflows/ci.yml',
    'scripts/check-pattern-compliance.js',
  ].filter((f) => existsSync(join(ROOT, f)));
}

function detectFileType(filePath, content, ext) {
  if (ext) return ext;
  const shellShebangs = ['#!/bin/sh', '#!/bin/bash', '#!/usr/bin/env bash', '#!/usr/bin/env sh'];
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('.husky/') || shellShebangs.some((s) => content.startsWith(s))) {
    return '.sh';
  }
  return ext;
}

function shouldSkipPattern(antiPattern, ext, normalizedPath) {
  if (!antiPattern.fileTypes.includes(ext)) return true;
  if (antiPattern.pathFilter && !antiPattern.pathFilter.test(normalizedPath)) return true;
  if (antiPattern.pathExclude?.test(normalizedPath)) return true;
  if (antiPattern.pathExcludeList) {
    const fileName = normalizedPath.split('/').pop() || '';
    if (antiPattern.pathExcludeList.includes(fileName)) return true;
  }
  return false;
}

// eslint-disable-next-line complexity -- findPatternMatches has inherent branching (complexity 19), refactoring would reduce readability
function findPatternMatches(antiPattern, content, filePath) {
  const violations = [];

  if (typeof antiPattern.testFn === 'function') {
    const matches = antiPattern.testFn(content);
    const safeMatches = Array.isArray(matches) ? matches : [];
    for (const m of safeMatches) {
      if (!m || typeof m.line !== 'number') continue;
      violations.push({
        file: filePath,
        line: m.line,
        id: antiPattern.id,
        severity: antiPattern.severity || 'medium',
        message: antiPattern.message,
        fix: antiPattern.fix,
        review: antiPattern.review,
        match: (m.match || '').slice(0, 50),
      });
    }
    return violations;
  }

  // eslint-disable-next-line framework/no-unescaped-regexp-input -- input is from controlled internal source
  const pattern = new RegExp(antiPattern.pattern.source, antiPattern.pattern.flags);
  const exclude = antiPattern.exclude
    ? // eslint-disable-next-line framework/no-unescaped-regexp-input -- input is from controlled internal source
      new RegExp(antiPattern.exclude.source, antiPattern.exclude.flags)
    : null;

  if (!pattern.global) {
    const match = pattern.exec(content);
    if (match) {
      if (exclude) exclude.lastIndex = 0;
      if (!exclude?.test(match[0])) {
        violations.push(buildViolation(antiPattern, match, content, filePath));
      }
    }
    return violations;
  }

  let match;
  while ((match = pattern.exec(content)) !== null) {
    if (exclude) exclude.lastIndex = 0;
    if (exclude?.test(match[0])) continue;
    violations.push(buildViolation(antiPattern, match, content, filePath));

    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
  }
  return violations;
}

function buildViolation(antiPattern, match, content, filePath) {
  const beforeMatch = content.slice(0, match.index);
  const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
  return {
    file: filePath,
    line: lineNumber,
    id: antiPattern.id,
    severity: antiPattern.severity || 'medium',
    message: antiPattern.message,
    fix: antiPattern.fix,
    review: antiPattern.review,
    match: match[0].slice(0, 50) + (match[0].length > 50 ? '...' : ''),
  };
}

function checkFile(filePath) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) return [];

  let content;
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch {
    return [];
  }

  const ext = detectFileType(filePath, content, extname(filePath));
  const normalizedPath = filePath.replace(/\\/g, '/');
  const violations = [];

  for (const antiPattern of ANTI_PATTERNS) {
    if (shouldSkipPattern(antiPattern, ext, normalizedPath)) continue;
    violations.push(...findPatternMatches(antiPattern, content, filePath));
  }

  return violations;
}

function printViolation(v) {
  const severityTag = v.severity ? `[${v.severity.toUpperCase()}]` : '';
  const prefix = v.graduated ? 'BLOCK' : 'WARN';
  console.log(`   ${prefix} ${severityTag} Line ${v.line}: ${v.message}`);
  if (v.fix) console.log(`   Fix: ${v.fix}`);
  if (VERBOSE) {
    const matchStr = String(v.match ?? '');
    const match = matchStr.slice(0, 120);
    console.log(`   Match: ${match}${matchStr.length > 120 ? '...' : ''}`);
  }
  console.log('');
}

function printSummaryFooter(blockCount, warnCount) {
  console.log('---');
  if (blockCount > 0) {
    console.log('Blocking violations MUST be fixed before committing.');
    console.log('   Critical-severity patterns always block. High-severity blocks in CI.');
  }
  if (warnCount > 0) {
    console.log('Warnings are informational - fix when practical.');
  }
  console.log('Some may be false positives - use judgment based on context.');
}

// eslint-disable-next-line complexity -- formatTextOutput has inherent branching (complexity 16), refactoring would reduce readability
function formatTextOutput(violations, filesChecked, warnCount = 0, blockCount = 0) {
  if (violations.length === 0) {
    console.log('No pattern violations found');
    console.log(
      `   Checked ${filesChecked} file(s) against ${ANTI_PATTERNS.length} known anti-patterns`,
    );
    return;
  }

  const bySeverity = { critical: 0, high: 0, medium: 0 };
  for (const v of violations) {
    const sev = v.severity || 'medium';
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;
  }

  if (blockCount > 0) console.log(`${blockCount} BLOCKING violation(s) (critical + high in CI)`);
  if (warnCount > 0) console.log(`${warnCount} warning(s)`);
  if (bySeverity.critical > 0) console.log(`   Critical: ${bySeverity.critical}`);
  if (bySeverity.high > 0) console.log(`   High: ${bySeverity.high}`);
  if (bySeverity.medium > 0) console.log(`   Medium: ${bySeverity.medium}`);
  console.log('');

  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.log(`File: ${file}`);
    for (const v of fileViolations) {
      printViolation(v);
    }
  }

  printSummaryFooter(blockCount, warnCount);
}

function applyGraduation(violations) {
  const warnings = [];
  const blocks = [];

  for (const v of violations) {
    const severity = v.severity || 'medium';
    const shouldBlock = severity === 'critical' || (severity === 'high' && !STAGED);

    if (shouldBlock) {
      v.graduated = true;
      blocks.push(v);
    } else {
      warnings.push(v);
    }
  }

  return { warnings, blocks };
}

function collectPatternExclusions() {
  const patternExclusions = {};
  for (const [patternId, files] of Object.entries(verifiedPatterns)) {
    const count = Array.isArray(files) ? files.length : 0;
    if (count > 0) {
      patternExclusions[patternId] = { verified: count, pathExclude: 0 };
    }
  }
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

function getFpStatus(total) {
  if (total > 20) return 'CONSIDER REMOVAL';
  if (total > 10) return 'HIGH FP RISK';
  return '';
}

function generateFpReport() {
  const patternExclusions = collectPatternExclusions();
  const sorted = Object.entries(patternExclusions)
    .map(([id, counts]) => [id, counts.verified + counts.pathExclude, counts])
    .sort((a, b) => b[1] - a[1]);

  console.log('False Positive Report - Per-Pattern Exclusion Counts\n');
  console.log(`Total patterns: ${ANTI_PATTERNS.length}`);
  console.log(`Patterns with exclusions: ${sorted.length}\n`);

  if (sorted.length === 0) {
    console.log('No exclusions found.');
    return;
  }

  console.log('Pattern ID                              | Verified | PathExcl | Total | Status');
  console.log(
    '----------------------------------------|----------|----------|-------|------------------',
  );
  for (const [id, total, counts] of sorted) {
    const paddedId = id.padEnd(39);
    console.log(
      `${paddedId} | ${String(counts.verified).padStart(8)} | ${String(counts.pathExclude).padStart(8)} | ${String(total).padStart(5)} | ${getFpStatus(total)}`,
    );
  }

  const highFp = sorted.filter(([, c]) => c > 10).length;
  const considerRemoval = sorted.filter(([, c]) => c > 20).length;
  console.log(`\nSummary: ${highFp} high-FP patterns, ${considerRemoval} candidates for removal`);
}

function main() {
  if (FP_REPORT) {
    generateFpReport();
    process.exit(0);
  }

  const files = getFilesToCheck();

  if (files.length === 0) {
    if (!JSON_OUTPUT) {
      console.log('No files to check. Use --all to scan entire repo or specify files.');
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

  const { warnings, blocks } = applyGraduation(allViolations);

  if (JSON_OUTPUT) {
    const severityCounts = { critical: 0, high: 0, medium: 0 };
    for (const v of allViolations) {
      const sev = v.severity || 'medium';
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
        2,
      ),
    );
  } else {
    formatTextOutput(allViolations, files.length, warnings.length, blocks.length);
  }

  process.exit(blocks.length > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  const message =
    error instanceof Error
      ? error instanceof Error
        ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
        : String(error)
      : String(error);
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ error: true, message }, null, 2));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(2);
}
