#!/usr/bin/env node
/**
 * security-check.js
 *
 * Quick security pattern compliance check for modified files.
 *
 * Exit codes:
 *   0 = OK (no violations found)
 *   1 = Warning (violations found, but non-blocking by default)
 *   2 = Error (execution error)
 *
 * Usage:
 *   node scripts/reviews/security-check.js                 # Check staged files
 *   node scripts/reviews/security-check.js --all          # Check all source files
 *   node scripts/reviews/security-check.js --file path    # Check specific file
 *   node scripts/reviews/security-check.js --blocking     # Exit non-zero on violations
 */

const { existsSync, readFileSync, readdirSync, lstatSync, realpathSync } = require('node:fs');
const { execSync } = require('node:child_process');
const { join, extname, relative, resolve, sep } = require('node:path');

const PROJECT_ROOT = join(__dirname, '..', '..');

// Security patterns to check
const SECURITY_PATTERNS = [
  {
    id: 'SEC-001',
    name: 'execSync with shell interpolation',
    pattern: /execSync\s*\(\s*`[^`]*\$\{/g,
    severity: 'HIGH',
    message: 'Potential command injection: use execFileSync or spawnSync with args array',
    fileTypes: ['.js', '.ts'],
    exclude: [/pattern-compliance\.test/],
  },
  {
    id: 'SEC-002',
    name: 'Unsafe eval usage',
    pattern: /\beval\s*\(/g,
    severity: 'CRITICAL',
    message: 'Avoid eval() - use safer alternatives',
    fileTypes: ['.js', '.ts', '.tsx'],
    exclude: [
      /eslint/,
      /config/,
      /(?:^|[\\/])security-check\.js$/,
      /(?:^|[\\/])check-pattern-compliance\.js$/,
      /pattern-compliance\.test/,
    ],
  },
  {
    id: 'SEC-003',
    name: 'innerHTML assignment',
    pattern: /\.innerHTML\s*=/g,
    severity: 'MEDIUM',
    message: 'Potential XSS: use textContent or sanitize HTML',
    fileTypes: ['.js', '.ts', '.tsx'],
    exclude: [/pattern-compliance\.test/],
  },
  {
    id: 'SEC-004',
    name: 'Hardcoded secrets',
    pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'CRITICAL',
    message: 'Potential hardcoded secret - use environment variables',
    fileTypes: ['.js', '.ts', '.tsx', '.json'],
    exclude: [/test/, /mock/, /example/, /\.d\.ts$/, /eslint-plugin/],
  },
  {
    id: 'SEC-005',
    name: 'URL without protocol validation',
    pattern: /new\s+URL\s*\([^)]+\)(?!\s*\.\s*protocol)/g,
    severity: 'LOW',
    message: 'Consider validating URL protocol (https only for external)',
    fileTypes: ['.js', '.ts', '.tsx'],
  },
  {
    id: 'SEC-007',
    name: 'Unbounded regex quantifier on user input',
    pattern: /new\s+RegExp\s*\([^)]{0,500}[+*][^)]{0,500}\)/g,
    severity: 'MEDIUM',
    message: 'Use bounded quantifiers {1,N} to prevent ReDoS',
    fileTypes: ['.js', '.ts', '.tsx'],
  },
  {
    id: 'SEC-008',
    name: 'Missing path containment check',
    pattern: /path\.resolve\s*\([^)]+\)(?![\s\S]{0,100}(?:relative|startsWith|includes))/g,
    severity: 'LOW',
    message: 'Verify resolved path stays within expected directory',
    fileTypes: ['.js', '.ts'],
    pathFilter: /(?:hooks|scripts)\//,
  },
  {
    id: 'SEC-010',
    name: 'Unescaped template in shell',
    pattern: /execSync\s*\([^)]*\$\{[^}]+\}/g,
    severity: 'HIGH',
    message: 'Shell command with unescaped variable - use execFileSync',
    fileTypes: ['.js', '.ts'],
    exclude: [/pattern-compliance\.test/],
  },
];

// Files/directories to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /coverage/,
  /\.git/,
  /\.turbo/,
  /archive/,
  /[\\/]backup[\\/]/,
  /[\\/]out[\\/]/,
  /\.d\.ts$/,
];

function shouldApplyPattern(pattern, ext, relativePath) {
  if (!pattern.fileTypes.includes(ext)) return false;
  if (pattern.pathFilter && !pattern.pathFilter.test(relativePath)) return false;
  if (pattern.exclude && pattern.exclude.some((e) => e.test(relativePath))) return false;
  return true;
}

function findPatternViolations(pattern, content, _lines, relativePath) {
  const violations = [];
  const normalizedContent = content.replace(/\r\n?/g, '\n');
  const normalizedLines = normalizedContent.split('\n');

  const flags = pattern.pattern.flags.includes('g')
    ? pattern.pattern.flags
    : pattern.pattern.flags + 'g';
  // eslint-disable-next-line framework/no-unescaped-regexp-input -- input is from controlled internal source
  const regex = new RegExp(pattern.pattern.source, flags);

  let match;
  while ((match = regex.exec(normalizedContent)) !== null) {
    const beforeMatch = normalizedContent.slice(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    const lineContent = normalizedLines[lineNum - 1]?.slice(0, 80) || '';

    violations.push({
      file: relativePath,
      line: lineNum,
      pattern: pattern.id,
      name: pattern.name,
      severity: pattern.severity,
      message: pattern.message,
      snippet: lineContent.trim(),
    });

    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  return violations;
}

function groupViolationsBySeverity(violations) {
  return {
    critical: violations.filter((v) => v.severity === 'CRITICAL'),
    high: violations.filter((v) => v.severity === 'HIGH'),
    medium: violations.filter((v) => v.severity === 'MEDIUM'),
    low: violations.filter((v) => v.severity === 'LOW'),
  };
}

function outputViolationSummary(groups, total) {
  console.log(`Found ${total} potential issue(s):`);
  console.log(`   CRITICAL: ${groups.critical.length}`);
  console.log(`   HIGH:     ${groups.high.length}`);
  console.log(`   MEDIUM:   ${groups.medium.length}`);
  console.log(`   LOW:      ${groups.low.length}`);
  console.log('');
}

function outputHighSeverityDetails(violations) {
  if (violations.length === 0) return;

  console.log('HIGH/CRITICAL Issues:');
  for (const v of violations) {
    console.log(`   ${v.file}:${v.line}`);
    console.log(`      [${v.pattern}] ${v.name}`);
    console.log(`      ${v.message}`);
    console.log(`      > ${v.snippet}`);
    console.log('');
  }
}

function outputLowSeveritySummary(violations) {
  if (violations.length === 0) return;

  console.log('MEDIUM/LOW Issues (summary):');
  for (const v of violations) {
    console.log(`   ${v.file}:${v.line} [${v.pattern}] ${v.name}`);
  }
  console.log('');
}

function determineExitCode(groups, isBlocking) {
  const totalViolations =
    groups.critical.length + groups.high.length + groups.medium.length + groups.low.length;

  if (totalViolations === 0) return 0;
  if (isBlocking && (groups.critical.length > 0 || groups.high.length > 0)) return 1;
  return 0;
}

function getFilesToCheck(args) {
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const input = args[fileIndex + 1];
    const rootReal = resolve(PROJECT_ROOT);
    const abs = resolve(rootReal, input);

    let absReal = abs;
    try {
      absReal = realpathSync(abs);
    } catch {
      // keep resolved path
    }

    const rel = relative(rootReal, absReal);
    if (rel.startsWith('..' + sep) || rel === '..') {
      console.error(`Refusing to scan outside project: ${input}`);
      return [];
    }

    if (existsSync(absReal)) return [absReal];
    console.error(`File not found: ${input}`);
    return [];
  }

  if (args.includes('--all')) return getAllSourceFiles(PROJECT_ROOT);
  return getStagedFiles();
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR --', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .filter((f) => f.trim())
      .map((f) => join(PROJECT_ROOT, f))
      .filter((f) => existsSync(f));
  } catch {
    return [];
  }
}

function getAllSourceFiles(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (SKIP_PATTERNS.some((p) => p.test(fullPath))) continue;

    let stat;
    try {
      stat = lstatSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isSymbolicLink()) continue;

    if (stat.isDirectory()) {
      getAllSourceFiles(fullPath, files);
    } else if (['.js', '.ts', '.tsx', '.json'].includes(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFile(filePath) {
  const violations = [];
  const ext = extname(filePath);
  const relativePath = relative(PROJECT_ROOT, filePath);

  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return violations;
  }

  const lines = content.split('\n');

  for (const pattern of SECURITY_PATTERNS) {
    if (!shouldApplyPattern(pattern, ext, relativePath)) continue;
    pattern.pattern.lastIndex = 0;
    const patternViolations = findPatternViolations(pattern, content, lines, relativePath);
    violations.push(...patternViolations);
  }

  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const isBlocking = args.includes('--blocking');
  const isQuiet = args.includes('--quiet');

  try {
    const files = getFilesToCheck(args);

    if (files.length === 0) {
      if (!isQuiet) console.log('No files to check');
      process.exitCode = 0;
      return;
    }

    if (!isQuiet) {
      console.log('Security Pattern Check');
      console.log('='.repeat(50));
      console.log(`   Checking ${files.length} file(s)`);
      console.log('');
    }

    const allViolations = files.flatMap((file) => checkFile(file));
    const groups = groupViolationsBySeverity(allViolations);

    if (!isQuiet) {
      if (allViolations.length === 0) {
        console.log('No security violations found');
      } else {
        outputViolationSummary(groups, allViolations.length);
        outputHighSeverityDetails([...groups.critical, ...groups.high]);
        outputLowSeveritySummary([...groups.medium, ...groups.low]);
      }
    }

    const exitCode = determineExitCode(groups, isBlocking);
    if (exitCode === 1 && !isQuiet) {
      console.log('Blocking due to CRITICAL/HIGH severity issues');
    }
    process.exitCode = exitCode;
  } catch (err) {
    if (!isQuiet) {
      console.error(
        `Error: ${err instanceof Error ? err.message : String(err)}`, // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
      );
    }
    process.exitCode = 2;
  }
}

main();
