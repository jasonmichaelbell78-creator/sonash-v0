#!/usr/bin/env node
/**
 * Pattern Compliance Checker
 *
 * Scans code for known anti-patterns documented in claude.md and AI_REVIEW_LEARNINGS_LOG.md
 * This is a learning reinforcement tool - it surfaces patterns that have caused issues before.
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

import { readFileSync, existsSync, readdirSync, lstatSync } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sanitizeError } from './lib/sanitize-error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const STAGED = args.includes('--staged');
const ALL = args.includes('--all');
const VERBOSE = args.includes('--verbose');
const JSON_OUTPUT = args.includes('--json');
const FILES = args.filter(a => !a.startsWith('--'));

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
    id: 'exit-code-capture',
    pattern: /\$\(\s*[^)]+\s*\)\s*;\s*if\s+\[\s*\$\?\s/g,
    message: 'Exit code capture bug: $? after assignment captures assignment exit (always 0), not command exit',
    fix: 'Use: if ! OUT=$(cmd); then',
    review: '#4, #14',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'for-file-iteration',
    pattern: /for\s+\w+\s+in\s+\$\{?\w+\}?\s*;?\s*do/g,
    message: 'File iteration with for loop breaks on spaces in filenames',
    fix: 'Use: while IFS= read -r file; do ... done < file_list',
    review: '#4, #14',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'missing-trap',
    pattern: /mktemp\)(?![\s\S]{0,50}trap)/g,
    message: 'Temp file created without trap for cleanup',
    fix: 'Add: trap \'rm -f "$TMPFILE"\' EXIT after mktemp',
    review: '#17, #18',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'retry-loop-no-success-tracking',
    // Use lazy quantifiers and word boundaries for accurate matching
    // Note: No 'g' flag - using .test() which is stateful with global regexes
    pattern: /for\s+\w+\s+in\s+1\s+2\s+3\s*;\s*do[\s\S]{0,120}?&&\s*break[\s\S]{0,80}?done(?![\s\S]{0,80}?(?:\bSUCCESS\b|\bsuccess\b|\bFAILED\b|\bfailed\b))/,
    message: 'Retry loop may silently succeed on failure - not tracking success',
    fix: 'Track: SUCCESS=false; for i in 1 2 3; do cmd && { SUCCESS=true; break; }; done; $SUCCESS || exit 1',
    review: '#18, #19',
    fileTypes: ['.sh', '.yml', '.yaml'],
  },
  {
    id: 'npm-install-automation',
    pattern: /npm\s+install(?!\s+--)/g,
    message: 'npm install in automation can modify lockfile',
    fix: 'Use: npm ci (reads lockfile exactly)',
    review: '#10, #12',
    fileTypes: ['.sh', '.yml', '.yaml'],
    exclude: /--legacy-peer-deps|--save|--save-dev|-D|-S/,
  },

  // JavaScript/TypeScript patterns
  {
    id: 'unsafe-error-message',
    pattern: /catch\s*\(\s*(\w+)\s*\)\s*\{[\s\S]{0,100}\1\.message(?![^}]*instanceof\s+Error)/g,
    message: 'Unsafe error.message access - crashes if non-Error is thrown',
    fix: 'Use: error instanceof Error ? error.message : String(error)',
    review: '#17',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },
  {
    id: 'catch-console-error',
    pattern: /\.catch\s*\(\s*console\.error\s*\)/g,
    message: 'Unsanitized error logging - may expose sensitive paths/credentials',
    fix: 'Use: .catch((e) => console.error(sanitizeError(e))) or handle specific errors',
    review: '#20',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },
  {
    id: 'path-startswith',
    pattern: /\.startsWith\s*\(\s*['"`][./\\]+['"`]\s*\)/g,
    message: 'Path validation with startsWith() fails on Windows or edge cases',
    fix: 'Use: path.relative() and check for ".." prefix with regex',
    review: '#17, #18',
    fileTypes: ['.js', '.ts'],
    // Exclude files that use startsWith for absolute path DETECTION (security checks), not containment
    // - check-pattern-compliance.js: contains patterns as strings
    // - archive-doc.js: uses startsWith('/'), startsWith('\\') to detect & reject absolute paths
    pathExclude: /(?:check-pattern-compliance|archive-doc)\.js$/,
  },
  {
    id: 'regex-global-test-loop',
    pattern: /new\s+RegExp\s*\([^)]+,\s*['"`][^'"]*g[^'"]*['"`]\s*\)[\s\S]{0,200}\.test\s*\(/g,
    message: 'Regex with global flag used with .test() in loop - stateful lastIndex causes missed matches',
    fix: 'Remove "g" flag when using .test(), or reset lastIndex between iterations',
    review: '#13, #14',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },

  // GitHub Actions patterns
  {
    id: 'unsafe-interpolation',
    pattern: /`[^`]*\$\{\{\s*(?:steps|github|env|inputs)\.[^}]+\}\}[^`]*`/g,
    message: 'Unsafe ${{ }} interpolation in JavaScript template literal',
    fix: 'Use env: block to pass value, then process.env.VAR',
    review: '#16',
    fileTypes: ['.yml', '.yaml'],
  },
  {
    id: 'hardcoded-temp-path',
    pattern: /[>|]\s*\/tmp\/\w+(?!\.)/g,
    message: 'Hardcoded /tmp path - use mktemp for unique files',
    fix: 'Use: TMPFILE=$(mktemp) and trap for cleanup',
    review: '#18',
    fileTypes: ['.yml', '.yaml', '.sh'],
  },
  {
    id: 'implicit-if-expression',
    pattern: /^\s*if:\s+(?!.*\$\{\{).*(?:steps|github|env|inputs|needs)\./gm,
    message: 'Implicit expression in if: condition can cause YAML parser issues',
    fix: 'Always use explicit ${{ }} in if: conditions',
    review: '#17, #21',
    fileTypes: ['.yml', '.yaml'],
  },
  {
    id: 'fragile-bot-detection',
    pattern: /\.user\.type\s*===?\s*['"`]Bot['"`]/g,
    message: 'Fragile bot detection - user.type is unreliable',
    fix: 'Use: user.login === "github-actions[bot]"',
    review: '#15',
    fileTypes: ['.yml', '.yaml', '.js', '.ts'],
  },

  // Security patterns
  {
    id: 'simple-path-traversal-check',
    pattern: /startsWith\s*\(\s*['"`]\.\.['"`]\s*\)/g,
    message: 'Simple ".." check has false positives (e.g., "..hidden.md")',
    fix: 'Use: /^\\.\\.(?:[\\\\/]|$)/.test(rel)',
    review: '#18',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'hardcoded-api-key',
    pattern: /\b(?:api[_-]?key|apikey|secret|password|token)\b\s*[:=]\s*['"`][A-Za-z0-9_/+=-]{20,}['"`]/gi,
    message: 'Potential hardcoded API key or secret detected',
    fix: 'Use environment variables: process.env.API_KEY',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
    exclude: /(?:test|mock|fake|dummy|example|placeholder|xxx+|your[_-]?api|insert[_-]?your)/i,
  },
  {
    id: 'unsafe-innerhtml',
    pattern: /\.innerHTML\s*=/g,
    message: 'innerHTML assignment can lead to XSS vulnerabilities',
    fix: 'Use textContent for text, or sanitize with DOMPurify for HTML',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },
  {
    id: 'eval-usage',
    pattern: /\beval\s*\(/g,
    message: 'eval() is a security risk - allows arbitrary code execution',
    fix: 'Avoid eval. Use JSON.parse for JSON, or restructure code',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts', '.tsx', '.jsx'],
  },
  {
    id: 'sql-injection-risk',
    pattern: /(?:query|exec|execute|prepare|run|all|get)\s*\(\s*(?:`[^`]*(?:\$\{|\+\s*)|'[^']*(?:\$\{|\+\s*)|"[^"]*(?:\$\{|\+\s*))/g,
    message: 'Potential SQL injection: string interpolation or concatenation in query',
    fix: 'Use parameterized queries with placeholders (e.g., db.query("SELECT * FROM users WHERE id = ?", [userId]))',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'unsanitized-error-response',
    pattern: /res\.(?:json|send|status\s*\([^)]*\)\s*\.json)\s*\(\s*\{[\s\S]{0,300}?(?:error|err|e|exception)\.(?:message|stack|toString\s*\()/g,
    message: 'Exposing raw error messages/stack traces to clients',
    fix: 'Return sanitized error messages (e.g., "An error occurred"), log full details server-side',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'missing-rate-limit-comment',
    pattern: /(?:exports\.|module\.exports|export\s+(?:default\s+)?(?:async\s+)?function)\s+\w+(?:Handler|API|Endpoint)/gi,
    message: 'API endpoint may need rate limiting (verify rate limit is implemented)',
    fix: 'Ensure endpoint has rate limiting per GLOBAL_SECURITY_STANDARDS.md',
    review: 'Security Standards',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:^|\/)(?:pages|app|routes|api|functions)\/.*(?:api|routes|handlers|endpoints)?/i,
  },

  // New patterns from Consolidation #3 (Reviews #31-40)
  {
    id: 'path-join-without-containment',
    pattern: /path\.join\s*\([^)]*,\s*(?:deliverable|user|input|arg|param|file)\w*(?:\.path)?[^)]*\)(?![\s\S]{0,100}(?:relative|isWithin|contains|startsWith))/g,
    message: 'Path joined with user input without containment check',
    fix: 'Verify path.relative(root, resolved) does not start with ".." or equal ""',
    review: '#33, #34, #38, #39, #40',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'error-without-first-line',
    pattern: /String\s*\(\s*(?:err|error|e)(?:\?\.message|\s*\?\?\s*err|\s*\?\?\s*error)[\s\S]{0,30}\)(?![\s\S]{0,30}\.split\s*\(\s*['"`]\\n['"`]\s*\))/g,
    message: 'Error converted to string without extracting first line (stack trace leakage)',
    fix: 'Use: String(err?.message ?? err).split("\\n")[0].replace(/\\r$/, "")',
    review: '#36, #37, #38',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'console-log-file-content',
    pattern: /console\.(?:log|error|warn)\s*\([^)]*(?:content|fileContent|data|text|body)(?:\s*[,)])/g,
    message: 'File-derived content logged without control char sanitization',
    fix: 'Sanitize with: content.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, "")',
    review: '#39, #40',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'split-newline-without-cr-strip',
    pattern: /\.split\s*\(\s*['"`]\\n['"`]\s*\)\s*\[\s*0\s*\](?![\s\S]{0,30}\.replace\s*\(\s*\/\\r\$\/)/g,
    message: 'Line split without stripping trailing \\r (Windows CRLF issue)',
    fix: 'Add: .replace(/\\r$/, "") after split to handle CRLF',
    review: '#39, #40',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'regex-newline-lookahead',
    // Match lookaheads in regex literals `(?=\n` and in string patterns `"(?=\\n"`
    pattern: /\(\?=(?:\\n|\\\\n)(?!\?)/g,
    message: 'Regex lookahead uses \\n without optional \\r (fails on CRLF)',
    fix: 'Use: (?=\\r?\\n for cross-platform line endings',
    review: '#40',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'path-split-without-normalize',
    pattern: /\.split\s*\(\s*['"`]\/['"`]\s*\)[\s\S]{0,50}includes\s*\(\s*['"`]\.\.['"`]\s*\)(?![\s\S]{0,100}replace\s*\(\s*\/\\\\\/g)/g,
    message: 'Path traversal check splits on / without normalizing Windows backslashes',
    fix: 'First normalize: path.replace(/\\\\/g, "/").split("/").includes("..")',
    review: '#39, #40',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'readfilesync-without-try',
    // Avoid variable-length lookbehind (engine compatibility); match both fs.readFileSync and readFileSync
    // Note: This will have false positives for wrapped calls - use judgment
    pattern: /\b(?:fs\.)?readFileSync\s*\(/g,
    message: 'readFileSync without try/catch - existsSync does not guarantee read success',
    fix: 'Wrap in try/catch: race conditions, permissions, encoding errors',
    review: '#36, #37',
    fileTypes: ['.js', '.ts'],
    // Exclude pattern checker itself (has proper try/catch but triggers on pattern definition)
    pathExclude: /check-pattern-compliance\.js$/,
  },
  {
    id: 'auto-mode-slice-truncation',
    pattern: /(?:isAutoMode|isAuto|autoMode)\s*\?[\s\S]{0,50}\.slice\s*\(\s*0\s*,/g,
    message: 'Auto/CI mode should check ALL items, not truncate - limits are for interactive only',
    fix: 'Use: isAutoMode ? allItems : allItems.slice(0, MAX)',
    review: '#35',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'readline-no-close',
    pattern: /readline\.createInterface\s*\([\s\S]{0,500}process\.exit\s*\(\s*\d+\s*\)(?![\s\S]{0,50}close\s*\()/g,
    message: 'Script exits without closing readline interface (may hang)',
    fix: 'Create closeRl() helper and call before every process.exit()',
    review: '#33',
    fileTypes: ['.js', '.ts'],
  },
  {
    id: 'empty-path-not-rejected',
    pattern: /(?:startsWith\s*\(\s*['"`]\.\.['"`]\s*\)|\.isAbsolute\s*\(\s*rel\s*\))(?![\s\S]{0,50}===\s*['"`]['"`])/g,
    message: 'Path validation may miss empty string edge case (rel === "")',
    fix: 'Add: rel === "" || rel.startsWith("..") || path.isAbsolute(rel)',
    review: '#40',
    fileTypes: ['.js', '.ts'],
  },
];

/**
 * Get files to check based on options
 */
function getFilesToCheck() {
  if (FILES.length > 0) {
    // Block absolute paths, drive letters, UNC paths, and Windows rooted paths before processing
    // Then normalize relative to ROOT and filter out any path traversal attempts
    return FILES
      .filter(f => !/^(?:\/|[A-Za-z]:[\\/]|\\\\|\/\/|\\(?!\\))/.test(f)) // Block absolute/drive/UNC/rooted inputs
      .map(f => join(ROOT, f))
      .filter(abs => {
        const rel = relative(ROOT, abs);

        // `relative()` can return an absolute/UNC path on Windows (e.g., cross-drive),
        // so explicitly reject those in addition to ".." traversal.
        return (
          rel &&
          !/^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/.test(rel) &&
          !/^\.\.(?:[\\/]|$)/.test(rel)
        );
      })
      .map(abs => relative(ROOT, abs))
      .filter(rel => existsSync(join(ROOT, rel)));
  }

  if (STAGED) {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: ROOT,
        encoding: 'utf-8'
      });
      return output.trim().split('\n').filter(f => f.trim());
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
    const extensions = ['.sh', '.yml', '.yaml', '.js', '.ts', '.tsx', '.jsx'];
    const ignoreDirs = ['node_modules', '.next', 'dist', 'dist-tests', '.git', 'coverage'];

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
              console.warn(`⚠️ Skipping unreadable entry: ${relative(ROOT, fullPath)} (${sanitizeError(error)})`);
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
            } else if (!ext && relative(ROOT, dir).startsWith('.husky')) {
              // Extensionless files in .husky are shell scripts
              files.push(relative(ROOT, fullPath));
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    walk(ROOT);
    return files;
  }

  // Default: check common problem areas
  // Expanded in Review Audit (Session #18) to cover scripts that caused most issues
  return [
    '.husky/pre-commit',
    '.github/workflows/docs-lint.yml',
    '.github/workflows/review-check.yml',
    '.github/workflows/sync-readme.yml',
    // Scripts that have had repeated review issues (Reviews #31-40)
    'scripts/phase-complete-check.js',
    'scripts/surface-lessons-learned.js',
    // Note: check-pattern-compliance.js excluded - contains pattern definitions as strings
    // which cause false positives (meta-detection of its own patterns)
    'scripts/suggest-pattern-automation.js',
    'scripts/archive-doc.js',
    'scripts/validate-phase-completion.js',
    // Claude hooks that are security-critical
    '.claude/hooks/check-edit-requirements.sh',
    '.claude/hooks/check-write-requirements.sh',
    '.claude/hooks/coderabbit-review.sh',
    '.claude/hooks/check-mcp-servers.sh',
  ].filter(f => existsSync(join(ROOT, f)));
}

/**
 * Check a file for anti-patterns
 */
function checkFile(filePath) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) {
    return [];
  }

  let ext = extname(filePath);
  let content;
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch (error) {
    // Skip unreadable files (permissions, binary, etc.) to prevent scan abort
    if (VERBOSE && !JSON_OUTPUT) {
      console.warn(`⚠️ Skipping unreadable file: ${filePath} (${sanitizeError(error)})`);
    }
    return [];
  }

  // Extensionless files: detect type by shebang or path
  if (!ext) {
    if (filePath.startsWith('.husky/') ||
        content.startsWith('#!/bin/sh') ||
        content.startsWith('#!/bin/bash') ||
        content.startsWith('#!/usr/bin/env bash') ||
        content.startsWith('#!/usr/bin/env sh')) {
      ext = '.sh'; // Treat as shell script
    }
  }

  const violations = [];

  for (const antiPattern of ANTI_PATTERNS) {
    // Skip if file type doesn't match
    if (!antiPattern.fileTypes.includes(ext)) {
      continue;
    }

    // Skip if path filter doesn't match (for patterns that only apply to specific directories)
    if (antiPattern.pathFilter && !antiPattern.pathFilter.test(filePath)) {
      continue;
    }

    // Skip if path exclusion matches (for patterns that have false positives in specific files)
    if (antiPattern.pathExclude && antiPattern.pathExclude.test(filePath)) {
      continue;
    }

    // Reset regex lastIndex
    antiPattern.pattern.lastIndex = 0;

    let match;
    while ((match = antiPattern.pattern.exec(content)) !== null) {
      // Check exclusion pattern
      if (antiPattern.exclude && antiPattern.exclude.test(match[0])) {
        continue;
      }

      // Find line number
      const beforeMatch = content.slice(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

      violations.push({
        file: filePath,
        line: lineNumber,
        id: antiPattern.id,
        message: antiPattern.message,
        fix: antiPattern.fix,
        review: antiPattern.review,
        match: match[0].slice(0, 50) + (match[0].length > 50 ? '...' : ''),
      });
    }
  }

  return violations;
}

/**
 * Format output as text
 */
function formatTextOutput(violations, filesChecked) {
  if (violations.length === 0) {
    console.log('✅ No pattern violations found');
    console.log(`   Checked ${filesChecked} file(s) against ${ANTI_PATTERNS.length} known anti-patterns`);
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
      console.log('');
    }
  }

  console.log('---');
  console.log('These patterns have caused issues before. Review and fix if applicable.');
  console.log('Some may be false positives - use judgment based on context.');
}

/**
 * Main function
 */
function main() {
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

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      filesChecked: files.length,
      patternsChecked: ANTI_PATTERNS.length,
      violations: allViolations,
    }, null, 2));
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
