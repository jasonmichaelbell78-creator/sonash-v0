#!/usr/bin/env node
/**
 * Append Hook Warning
 *
 * Utility script for hooks to append warnings to .claude/hook-warnings.json
 * These warnings are aggregated and surfaced at session start.
 *
 * Usage (from hooks):
 *   node scripts/reviews/append-hook-warning.js --hook=pre-commit --type=pattern --severity=warning --message="Pattern issues found"
 */

let fs, path;
try {
  fs = require('node:fs');
  path = require('node:path');
} catch (e) {
  // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
  console.error('Failed to load required modules:', e instanceof Error ? e.message : String(e));
  process.exit(1);
}

const ROOT_DIR = path.join(__dirname, '..', '..');
const WARNINGS_FILE = path.join(ROOT_DIR, '.claude', 'hook-warnings.json');

const { isSafeToWrite } = require('../../.claude/hooks/lib/symlink-guard.js');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

function readWarnings() {
  try {
    const content = fs.readFileSync(WARNINGS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return { warnings: [], lastCleared: null };
  }
}

function writeWarnings(data) {
  const tmpFile = `${WARNINGS_FILE}.tmp`;
  try {
    if (!isSafeToWrite(WARNINGS_FILE) || !isSafeToWrite(tmpFile)) return;
    const claudeDir = path.dirname(WARNINGS_FILE);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));

    try {
      fs.rmSync(WARNINGS_FILE, { force: true });
    } catch {
      // ignore
    }

    fs.renameSync(tmpFile, WARNINGS_FILE);
  } catch {
    try {
      fs.rmSync(tmpFile, { force: true });
    } catch {
      // ignore
    }
  }
}

function appendWarning(hook, type, severity, message, action = null) {
  const data = readWarnings();

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const isDuplicate = data.warnings.some(
    (w) =>
      w.hook === hook &&
      w.type === type &&
      w.message === message &&
      new Date(w.timestamp).getTime() > oneHourAgo,
  );

  if (!isDuplicate) {
    data.warnings.push({
      hook,
      type,
      severity: severity || 'warning',
      message,
      action,
      timestamp: new Date().toISOString(),
    });

    if (data.warnings.length > 50) {
      data.warnings = data.warnings.slice(-50);
    }

    writeWarnings(data);

    // Permanent JSONL audit trail (best-effort)
    try {
      const logDir = path.join(ROOT_DIR, '.claude', 'state');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logPath = path.join(logDir, 'hook-warnings-log.jsonl');
      if (!isSafeToWrite(logPath)) return;
      const entry = JSON.stringify({
        hook,
        type,
        severity: severity || 'warning',
        message,
        action,
        timestamp: new Date().toISOString(),
      });
      fs.appendFileSync(logPath, entry + '\n');
    } catch {
      // Best-effort
    }
  }
}

function clearWarnings() {
  writeWarnings({
    warnings: [],
    lastCleared: new Date().toISOString(),
  });
}

// Main
const args = parseArgs();

if (args.clear === 'true') {
  clearWarnings();
  console.log('Hook warnings cleared');
} else if (args.hook && args.message) {
  appendWarning(
    args.hook,
    args.type || 'general',
    args.severity || 'warning',
    args.message,
    args.action || null,
  );
} else {
  console.error(
    'Usage: --hook=<hook> --type=<type> --severity=<severity> --message=<message> [--action=<action>]',
  );
  console.error('       --clear=true');
  process.exit(1);
}
