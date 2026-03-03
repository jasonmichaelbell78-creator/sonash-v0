#!/usr/bin/env node
/**
 * Cross-Document Dependency Checker (BLOCKING)
 *
 * Purpose: Ensures cross-document dependencies are maintained when commits are made.
 * When a document is modified that has dependencies, this script blocks the commit
 * unless the dependent documents are also staged.
 *
 * Exit Codes:
 *   0 - No dependency issues found
 *   1 - Dependency issues found (blocking)
 *   2 - Error during execution
 *
 * Usage:
 *   node scripts/check-cross-doc-deps.js              # Check staged files
 *   node scripts/check-cross-doc-deps.js --verbose    # Show all checks
 *   node scripts/check-cross-doc-deps.js --dry-run    # Check without blocking
 *
 * Dependency rules are loaded from scripts/config/doc-dependencies.json
 */

const { execFileSync } = require('node:child_process');

// Load config helpers if available
let loadConfigWithRegex;
let validateSkipReason;
try {
  ({ loadConfigWithRegex } = require('./config/load-config'));
} catch {
  loadConfigWithRegex = null;
}
try {
  ({ validateSkipReason } = require('./lib/validate-skip-reason'));
} catch {
  validateSkipReason = null;
}

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const dryRun = args.includes('--dry-run');
const trivialMode = args.includes('--trivial');

const useColors = process.stdout.isTTY;
const colors = {
  red: useColors ? '\x1b[31m' : '',
  green: useColors ? '\x1b[32m' : '',
  yellow: useColors ? '\x1b[33m' : '',
  blue: useColors ? '\x1b[34m' : '',
  cyan: useColors ? '\x1b[36m' : '',
  reset: useColors ? '\x1b[0m' : '',
  bold: useColors ? '\x1b[1m' : '',
};

function log(message, color = '') {
  console.log(color ? `${color}${message}${colors.reset}` : message);
}

function logVerbose(message) {
  if (verbose) {
    log(`  [verbose] ${message}`, colors.cyan);
  }
}

/**
 * Cross-document dependency rules - CONFIGURABLE
 * Load from config file or use empty default
 */
let dependencyRules = [];
if (loadConfigWithRegex) {
  try {
    const cfg = loadConfigWithRegex('doc-dependencies', ['diffPattern']);
    dependencyRules = Array.isArray(cfg.rules) ? cfg.rules : [];
  } catch (configErr) {
    const msg =
      configErr instanceof Error
        ? configErr instanceof Error
          ? configErr.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
          : String(configErr)
        : String(configErr);
    log(`Warning: Could not load doc dependency rules: ${msg}`, colors.yellow);
  }
}

if (dependencyRules.length === 0 && !dryRun) {
  log(
    'Warning: No dependency rules loaded. Configure scripts/config/doc-dependencies.json.',
    colors.yellow,
  );
}

function getStagedFiles() {
  try {
    const output = execFileSync('git', ['diff', '--cached', '--name-only'], {
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);
  } catch {
    log('Error: Could not get staged files from git', colors.red);
    process.exit(2);
  }
}

function getStagedFilesFiltered(filter) {
  try {
    const output = execFileSync(
      'git',
      ['diff', '--cached', '--name-only', `--diff-filter=${filter}`],
      {
        encoding: 'utf-8',
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

function checkDiffPattern(file, pattern) {
  try {
    const diff = execFileSync('git', ['diff', '--cached', '--unified=0', '--', file], {
      encoding: 'utf-8',
    });
    return pattern.test(diff);
  } catch (error) {
    if (verbose) {
      const message =
        error instanceof Error
          ? error instanceof Error
            ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
            : String(error)
          : String(error);
      logVerbose(`Failed to check diff pattern for ${file}: ${message}`);
    }
    return false;
  }
}

const trivialChangeCache = new Map();

function isTrivialChange(file) {
  const gitPath = file.replaceAll('\\', '/');
  if (trivialChangeCache.has(gitPath)) return trivialChangeCache.get(gitPath);

  let result = false;
  try {
    const wsDiff = execFileSync('git', ['diff', '--cached', '-w', '--unified=0', '--', gitPath], {
      encoding: 'utf-8',
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    });
    const wsChangeLines = wsDiff
      .split('\n')
      .filter((line) => /^[+-]/.test(line) && !/^[+-]{3}/.test(line));
    if (wsChangeLines.length === 0) {
      result = true;
    } else {
      const diff = execFileSync('git', ['diff', '--cached', '--unified=0', '--', gitPath], {
        encoding: 'utf-8',
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });

      const changeLines = diff
        .split('\n')
        .filter((line) => /^[+-]/.test(line) && !/^[+-]{3}/.test(line))
        .map((line) => line.slice(1));

      if (changeLines.length === 0) {
        result = true;
      } else {
        const ext = gitPath.split('.').pop()?.toLowerCase();
        const hashIsComment =
          ext && ['sh', 'bash', 'zsh', 'py', 'rb', 'yml', 'yaml', 'toml'].includes(ext);
        const trivialPattern = hashIsComment
          ? /^\s*$|^\s*(?:\/\/|#|\/\*|\*\/|\*|<!--).*$|^\s*\*\*(?:Status|Last Updated|Document Version):\*\*\s/
          : /^\s*$|^\s*(?:\/\/|\/\*|\*\/|\*|<!--).*$|^\s*\*\*(?:Status|Last Updated|Document Version):\*\*\s/;
        result = changeLines.every((line) => trivialPattern.test(line));
      }
    }
  } catch {
    result = false;
  }
  trivialChangeCache.set(gitPath, result);
  return result;
}

function matchesTrigger(stagedFiles, trigger) {
  const isDirTrigger = trigger.endsWith('/');
  const isBareName = !trigger.includes('/');
  const normTrigger = trigger.replace(/\\/g, '/').toLowerCase();

  return stagedFiles.some((file) => {
    const normFile = file.replace(/\\/g, '/').toLowerCase();
    if (isDirTrigger) return normFile.startsWith(normTrigger);
    if (normFile === normTrigger) return true;
    return isBareName && normFile.endsWith(`/${normTrigger}`);
  });
}

function isDependentStaged(stagedFiles, dependent) {
  const isBareName = !dependent.includes('/');
  const normDependent = dependent.replace(/\\/g, '/').toLowerCase();

  return stagedFiles.some((file) => {
    const normFile = file.replace(/\\/g, '/').toLowerCase();
    if (normFile === normDependent) return true;
    return isBareName && normFile.endsWith(`/${normDependent}`);
  });
}

// eslint-disable-next-line complexity -- checkDependencies has inherent branching (complexity 20), refactoring would reduce readability
function checkDependencies() {
  log(`\n${colors.bold}Cross-Document Dependency Check${colors.reset}\n`);

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    log('No staged files to check.', colors.green);
    return 0;
  }

  logVerbose(`Staged files: ${stagedFiles.length}`);
  if (verbose) {
    stagedFiles.forEach((f) => logVerbose(`  - ${f}`));
  }

  const issues = [];
  const passed = [];

  for (const rule of dependencyRules) {
    if (!matchesTrigger(stagedFiles, rule.trigger)) {
      logVerbose(`Rule skipped (no trigger match): ${rule.trigger}`);
      continue;
    }

    logVerbose(`Rule triggered: ${rule.trigger}`);

    if (rule.gitFilter) {
      let filteredFiles = getStagedFilesFiltered(rule.gitFilter);
      if (rule.filePattern) {
        // eslint-disable-next-line framework/no-unescaped-regexp-input -- input is from controlled internal source
        const re = new RegExp(rule.filePattern);
        filteredFiles = filteredFiles.filter((f) => re.test(f));
      }
      if (!matchesTrigger(filteredFiles, rule.trigger)) {
        logVerbose(
          `Rule skipped (gitFilter "${rule.gitFilter}" - no matching changes): ${rule.trigger}`,
        );
        continue;
      }
    }

    if (rule.checkDiff) {
      const triggerFile = stagedFiles.find(
        (f) => f === rule.trigger || f.endsWith(`/${rule.trigger}`),
      );
      if (triggerFile && !checkDiffPattern(triggerFile, rule.diffPattern)) {
        logVerbose(`Rule skipped (diff pattern not found): ${rule.trigger}`);
        continue;
      }
    }

    if (trivialMode) {
      const trigger = rule.trigger.replaceAll('\\', '/');
      const triggerFiles = stagedFiles
        .map((f) => f.replaceAll('\\', '/'))
        .filter(
          (f) =>
            f === trigger ||
            f.endsWith(`/${trigger}`) ||
            (trigger.endsWith('/') && f.startsWith(trigger)),
        );
      const allTrivial = triggerFiles.length > 0 && triggerFiles.every(isTrivialChange);
      if (allTrivial) {
        logVerbose(`Rule skipped (trivial changes only): ${rule.trigger}`);
        continue;
      }
    }

    for (const dependent of rule.dependents) {
      if (isDependentStaged(stagedFiles, dependent)) {
        passed.push({
          trigger: rule.trigger,
          dependent,
          reason: rule.reason,
        });
        logVerbose(`Dependency satisfied: ${dependent}`);
      } else {
        issues.push({
          trigger: rule.trigger,
          dependent,
          reason: rule.reason,
        });
      }
    }
  }

  if (passed.length > 0 && verbose) {
    log('\nSatisfied dependencies:', colors.green);
    passed.forEach((p) => {
      log(`   ${p.trigger} -> ${p.dependent}`, colors.green);
    });
  }

  if (issues.length > 0) {
    log('\nMissing dependent documents:', colors.red);
    log('', colors.reset);

    issues.forEach((issue) => {
      log(
        `   ${colors.yellow}${issue.trigger}${colors.reset} changed but ${colors.cyan}${issue.dependent}${colors.reset} is not staged`,
      );
      log(`   Reason: ${issue.reason}`, colors.reset);
      log('');
    });

    log(`${colors.bold}Resolution Options:${colors.reset}`);
    log('');
    log('   1. Update the dependent documents and stage them:');
    issues.forEach((issue) => {
      log(`      ${colors.cyan}git add ${issue.dependent}${colors.reset}`);
    });
    log('');
    log('   2. If no changes are needed, add a comment explaining why');
    log('');
    log('   3. Override this check (use sparingly):');
    log(`      ${colors.yellow}SKIP_CROSS_DOC_CHECK=1 git commit ...${colors.reset}`);
    log('');

    if (dryRun) {
      log(
        `${colors.yellow}[DRY RUN] Would block commit with ${issues.length} issue(s)${colors.reset}`,
      );
      return 0;
    }

    return 1;
  }

  log('All cross-document dependencies satisfied', colors.green);
  return 0;
}

try {
  const skipChecks = (process.env.SKIP_CHECKS || '').split(',').map((s) => s.trim());
  if (process.env.SKIP_CROSS_DOC_CHECK === '1' || skipChecks.includes('cross-doc')) {
    if (validateSkipReason) {
      const skipResult = validateSkipReason(process.env.SKIP_REASON, 'SKIP_CROSS_DOC_CHECK=1');
      if (!skipResult.valid) {
        log(skipResult.error, colors.red);
        process.exit(1);
      }
    }
    log('Cross-document check skipped (SKIP_CROSS_DOC_CHECK=1)', colors.yellow);
    process.exit(0);
  }

  const exitCode = checkDependencies();
  process.exit(exitCode);
} catch (error) {
  const message =
    error instanceof Error
      ? error instanceof Error
        ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
        : String(error)
      : String(error);
  log(`Error: ${message}`, colors.red);
  process.exit(2);
}
