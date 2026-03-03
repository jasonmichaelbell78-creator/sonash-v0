#!/usr/bin/env node
/**
 * Override Logger
 *
 * Logs when blocking checks are overridden with a reason.
 * Creates an audit trail for accountability.
 *
 * Usage:
 *   node scripts/reviews/log-override.js --check=triggers --reason="Already ran check this session"
 *   node scripts/reviews/log-override.js --check=patterns --reason="False positive in migration script"
 *   node scripts/reviews/log-override.js --list            # Show recent overrides
 *   node scripts/reviews/log-override.js --clear           # Clear override log
 *
 * Environment variable integration:
 *   SKIP_REASON="reason" SKIP_TRIGGERS=1 git push
 *   SKIP_REASON="reason" SKIP_PATTERNS=1 git push
 *
 * Exit codes:
 *   0 - Override logged successfully
 *   1 - Missing required parameters
 *   2 - Script error
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { isSafeToWrite } = require('../../.claude/hooks/lib/symlink-guard.js');

/**
 * Sanitize user input for safe logging
 */
function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return '';
  return (
    input
      // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
      .replace(/[\x00-\x1f\x7f]/g, '')
      .slice(0, maxLength)
      .trim()
  );
}

function getRepoRoot() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf-8',
    timeout: 3000,
  });
  if (result.status === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return process.cwd();
}

const OVERRIDE_LOG = path.resolve(path.join(getRepoRoot(), '.claude', 'override-log.jsonl'));
const MAX_LOG_SIZE = 50 * 1024; // 50KB

function ensureLogDir() {
  const dir = path.dirname(OVERRIDE_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseArgs() {
  const args = {
    check: null,
    reason: null,
    list: false,
    clear: false,
    quick: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--list') {
      args.list = true;
    } else if (arg === '--clear') {
      args.clear = true;
    } else if (arg === '--quick') {
      args.quick = true;
    } else if (arg.startsWith('--check=')) {
      args.check = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--reason=')) {
      args.reason = arg.split('=').slice(1).join('=');
    }
  }

  if (!args.reason && process.env.SKIP_REASON) {
    args.reason = process.env.SKIP_REASON;
  }

  if (args.check) args.check = sanitizeInput(args.check, 100);
  if (args.reason) args.reason = sanitizeInput(args.reason, 500);

  return args;
}

function rotateSizeBasedIfNeeded() {
  if (!fs.existsSync(OVERRIDE_LOG)) return;
  // eslint-disable-next-line framework/no-stat-without-lstat -- path is constructed internally, not from user input
  const stats = fs.statSync(OVERRIDE_LOG);
  if (stats.size <= MAX_LOG_SIZE) return;

  const backupFile = OVERRIDE_LOG.replaceAll('.jsonl', `-${Date.now()}.jsonl`);
  if (!isSafeToWrite(backupFile)) return;

  try {
    fs.renameSync(OVERRIDE_LOG, backupFile);
  } catch {
    fs.copyFileSync(OVERRIDE_LOG, backupFile);
    fs.unlinkSync(OVERRIDE_LOG);
  }
  console.log(`Override log rotated to ${path.basename(backupFile)}`);
}

function logOverride(check, reason) {
  try {
    ensureLogDir();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    console.error(`Warning: Could not create log directory: ${errMsg}`);
    return null;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    check,
    reason: reason || 'No reason provided',
    user: process.env.USER || process.env.USERNAME || 'unknown',
    cwd: process.cwd(),
    git_branch: getGitBranch(),
  };

  try {
    rotateSizeBasedIfNeeded();

    if (!isSafeToWrite(OVERRIDE_LOG)) return null;
    fs.appendFileSync(OVERRIDE_LOG, JSON.stringify(entry) + '\n');

    return entry;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    console.error(`Warning: Could not write to override log: ${errMsg}`);
    return null;
  }
}

function getGitBranch() {
  try {
    const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf-8',
      timeout: 3000,
    });
    if (result.status === 0 && result.stdout) {
      return result.stdout.trim();
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function listOverrides() {
  if (!fs.existsSync(OVERRIDE_LOG)) {
    console.log('No overrides logged yet.\n');
    return;
  }

  let content;
  try {
    content = fs.readFileSync(OVERRIDE_LOG, 'utf-8');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    console.error(`Warning: Could not read override log: ${errMsg}`);
    return;
  }

  const entries = content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (entries.length === 0) {
    console.log('No overrides logged yet.\n');
    return;
  }

  console.log('OVERRIDE AUDIT LOG');
  console.log('='.repeat(66) + '\n');

  const recent = entries.slice(-10);
  for (const entry of recent) {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(`Date: ${date}`);
    console.log(`   Check: ${entry.check}`);
    console.log(`   Reason: ${entry.reason}`);
    console.log(`   Branch: ${entry.git_branch}`);
    console.log('');
  }

  console.log('='.repeat(66));
  console.log(`Total overrides: ${entries.length}`);

  const byCheck = {};
  for (const entry of entries) {
    byCheck[entry.check] = (byCheck[entry.check] || 0) + 1;
  }
  console.log('\nBy check type:');
  for (const [check, count] of Object.entries(byCheck)) {
    console.log(`  - ${check}: ${count}`);
  }
}

function clearLog() {
  ensureLogDir();
  if (fs.existsSync(OVERRIDE_LOG)) {
    const backupFile = OVERRIDE_LOG.replaceAll('.jsonl', `-archived-${Date.now()}.jsonl`);
    if (isSafeToWrite(backupFile)) {
      try {
        fs.renameSync(OVERRIDE_LOG, backupFile);
      } catch {
        fs.copyFileSync(OVERRIDE_LOG, backupFile);
        fs.unlinkSync(OVERRIDE_LOG);
      }
      console.log(`Override log archived to ${path.basename(backupFile)}`);
    }
  }
  console.log('Override log cleared.');
}

function logSkip(check, reason) {
  return logOverride(check, reason);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { logSkip, logOverride };
}

function main() {
  const args = parseArgs();

  if (args.list) {
    listOverrides();
    return;
  }

  if (args.clear) {
    clearLog();
    return;
  }

  if (args.quick) {
    if (!args.check) {
      console.error('--quick requires --check=<type>');
      process.exit(1);
    }
    const entry = logOverride(args.check, args.reason);
    if (!entry) process.exit(1);
    process.exit(0);
  }

  if (!args.check) {
    console.log('Usage: node log-override.js --check=<type> --reason="<reason>"');
    console.log('');
    console.log(
      'Check types: triggers, patterns, tests, lint, cross-doc, doc-index, doc-header, debt-schema',
    );
    console.log('');
    console.log('Or use environment variable:');
    console.log('  SKIP_REASON="reason" SKIP_TRIGGERS=1 git push');
    console.log('');
    console.log('Other commands:');
    console.log('  --list    Show recent overrides');
    console.log('  --clear   Archive and clear override log');
    console.log('  --quick   Silent mode for shell hooks (log and exit)');
    process.exit(1);
  }

  const entry = logOverride(args.check, args.reason);
  if (!entry) {
    console.error('ERROR: Failed to write override audit log.');
    process.exit(2);
  }
  console.log(`Override logged: ${args.check}`);
  if (!args.reason) {
    console.log('Warning: No reason provided. Consider using --reason or SKIP_REASON env var.');
  }
}

if (require.main === module) {
  main();
}
