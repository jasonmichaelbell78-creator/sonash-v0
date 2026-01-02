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

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
    id: 'path-startswith',
    pattern: /\.startsWith\s*\(\s*['"`][./\\]+['"`]\s*\)/g,
    message: 'Path validation with startsWith() fails on Windows or edge cases',
    fix: 'Use: path.relative() and check for ".." prefix with regex',
    review: '#17, #18',
    fileTypes: ['.js', '.ts'],
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

  // Security patterns
  {
    id: 'simple-path-traversal-check',
    pattern: /startsWith\s*\(\s*['"`]\.\.['"`]\s*\)/g,
    message: 'Simple ".." check has false positives (e.g., "..hidden.md")',
    fix: 'Use: /^\\.\\.\\.(?:[\\\\/]|$)/.test(rel)',
    review: '#18',
    fileTypes: ['.js', '.ts'],
  },
];

/**
 * Get files to check based on options
 */
function getFilesToCheck() {
  if (FILES.length > 0) {
    return FILES.filter(f => existsSync(f));
  }

  if (STAGED) {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: ROOT,
        encoding: 'utf-8'
      });
      return output.trim().split('\n').filter(f => f.trim());
    } catch {
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
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            if (!ignoreDirs.includes(entry)) {
              walk(fullPath);
            }
          } else if (extensions.includes(extname(entry))) {
            files.push(relative(ROOT, fullPath));
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
  return [
    '.husky/pre-commit',
    '.github/workflows/docs-lint.yml',
    '.github/workflows/review-check.yml',
    '.github/workflows/sync-readme.yml',
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

  const ext = extname(filePath);
  const content = readFileSync(fullPath, 'utf-8');
  const violations = [];

  for (const antiPattern of ANTI_PATTERNS) {
    // Skip if file type doesn't match
    if (!antiPattern.fileTypes.includes(ext)) {
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

main();
