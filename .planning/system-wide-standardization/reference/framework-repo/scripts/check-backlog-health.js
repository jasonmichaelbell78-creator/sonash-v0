#!/usr/bin/env node
/**
 * check-backlog-health.js
 *
 * Checks a JSONL debt/backlog file for aging issues and threshold violations.
 *
 * Exit codes:
 *   0 = OK (healthy backlog)
 *   1 = Warning (aging issues or threshold exceeded)
 *   2 = Error (file not found, parse error, or unexpected exception)
 *
 * Thresholds (configurable via env vars):
 *   BACKLOG_S1_MAX_DAYS=7      - S1 findings older than this trigger warning
 *   BACKLOG_S2_MAX_DAYS=14     - S2 findings older than this trigger warning
 *   BACKLOG_MAX_ITEMS=25       - Total active items exceeding this trigger warning
 *   BACKLOG_BLOCK_S1_DAYS=14   - S1 findings older than this block push (pre-push)
 *   BACKLOG_FILE=<path>        - Path to debt JSONL file (default: docs/technical-debt/MASTER_DEBT.jsonl)
 */

const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

// Configuration (can be overridden via env vars)
const CONFIG = {
  S1_MAX_DAYS: Number.parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
  S2_MAX_DAYS: Number.parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
  MAX_ITEMS: Number.parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
  BLOCK_S1_DAYS: Number.parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
};

const BACKLOG_FILE =
  process.env.BACKLOG_FILE || join(__dirname, '..', 'docs', 'technical-debt', 'MASTER_DEBT.jsonl');

// Statuses that count as "active" (not resolved / not false positive)
const ACTIVE_STATUSES = new Set(['NEW', 'VERIFIED', 'IN_PROGRESS', 'PENDING']);

function parseBacklogItems(content) {
  const items = [];
  const corruptLines = [];
  const normalized = content.replace(/\uFEFF/g, '');
  const lines = normalized.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    try {
      const entry = JSON.parse(line);

      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        corruptLines.push({ lineNumber: i + 1, error: 'Entry is not a JSON object' });
        continue;
      }

      if (!entry.id || !entry.severity) {
        corruptLines.push({ lineNumber: i + 1, error: 'Missing required field (id or severity)' });
        continue;
      }

      items.push({
        ...entry,
        severity: String(entry.severity).toUpperCase(),
        status: entry.status ? String(entry.status).toUpperCase() : entry.status,
      });
    } catch (err) {
      corruptLines.push({
        lineNumber: i + 1,

        error:
          err && (err instanceof Error ? err.message : String(err)) // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
            ? err.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
            : String(err),
      });
    }
  }

  return { items, corruptLines };
}

function filterActiveItems(items) {
  return items.filter((item) => {
    const status = (item.status || 'NEW').toUpperCase();
    return ACTIVE_STATUSES.has(status);
  });
}

function categorizeBySeverity(items) {
  return {
    s0: items.filter((i) => i.severity === 'S0'),
    s1: items.filter((i) => i.severity === 'S1'),
    s2: items.filter((i) => i.severity === 'S2'),
    s3: items.filter((i) => i.severity === 'S3'),
  };
}

function getOldestItemAgeDays(items) {
  if (items.length === 0) return null;

  const now = new Date();
  let oldest = null;

  for (const item of items) {
    if (!item.created) continue;
    const created = new Date(item.created);
    if (Number.isNaN(created.getTime())) continue;
    const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    if (ageDays < 0) continue;
    if (oldest === null || ageDays > oldest) {
      oldest = ageDays;
    }
  }

  return oldest;
}

function checkThresholds(severityGroups, config, isPrePush) {
  const warnings = [];
  const blockers = [];
  let exitCode = 0;

  if (severityGroups.s0.length > 0) {
    const ids = severityGroups.s0.map((i) => i.id).join(', ');
    const msg = `S0 (Critical) active items in backlog: ${ids}`;
    blockers.push(msg);
    exitCode = 1;
  }

  const s1Age = getOldestItemAgeDays(severityGroups.s1);
  if (severityGroups.s1.length > 0 && s1Age !== null) {
    if (s1Age > config.BLOCK_S1_DAYS && isPrePush) {
      const msg = `S1 items aging ${s1Age} days (block threshold: ${config.BLOCK_S1_DAYS})`;
      blockers.push(msg);
      exitCode = 1;
    } else if (s1Age > config.S1_MAX_DAYS) {
      const msg = `S1 items aging ${s1Age} days (warn threshold: ${config.S1_MAX_DAYS})`;
      warnings.push(msg);
      exitCode = Math.max(exitCode, 1);
    }
  }

  const s2Age = getOldestItemAgeDays(severityGroups.s2);
  if (severityGroups.s2.length > 0 && s2Age !== null && s2Age > config.S2_MAX_DAYS) {
    const msg = `S2 items aging ${s2Age} days (warn threshold: ${config.S2_MAX_DAYS})`;
    warnings.push(msg);
    exitCode = Math.max(exitCode, 1);
  }

  return { warnings, blockers, exitCode };
}

function checkItemCountThreshold(itemCount, maxItems) {
  if (itemCount > maxItems) {
    return `Total active items (${itemCount}) exceeds threshold (${maxItems})`;
  }
  return null;
}

function outputHealthSummary(totalItems, activeItems, severityGroups, corruptLines) {
  console.log('Backlog Health Check');
  console.log('='.repeat(50));
  console.log(`   Source: ${BACKLOG_FILE}`);
  console.log(`   Total entries: ${totalItems}`);
  console.log(`   Active items:  ${activeItems.length}`);
  console.log(`   S0 (Critical): ${severityGroups.s0.length}`);
  console.log(`   S1 (Major):    ${severityGroups.s1.length}`);
  console.log(`   S2 (Medium):   ${severityGroups.s2.length}`);
  console.log(`   S3 (Minor):    ${severityGroups.s3.length}`);
  if (corruptLines.length > 0) {
    console.log(`   Corrupt entries: ${corruptLines.length}`);
  }
  console.log('');
}

function outputIssues(blockers, warnings) {
  if (blockers.length > 0) {
    console.log('BLOCKERS (must address before push):');
    blockers.forEach((b) => console.log(`   - ${b}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach((w) => console.log(`   - ${w}`));
    console.log('');
  }
}

function outputFinalStatus(exitCode, blockers, isPrePush) {
  if (exitCode === 0) {
    console.log('Backlog health OK');
  } else if (blockers.length > 0 && isPrePush) {
    console.log('Push blocked - address critical backlog items first');
    console.log('   Use --force to override (not recommended)');
  } else {
    console.log('Backlog needs attention - consider addressing items soon');
  }
  console.log('');
}

function determineFinalExitCode(isPrePush, blockers, exitCode) {
  if (isPrePush && blockers.length > 0 && !process.argv.includes('--force')) {
    return 1;
  }
  return exitCode;
}

function warnCorruptLines(corruptLines, isQuiet) {
  if (corruptLines.length === 0 || isQuiet) return;
  console.log(`Note: ${corruptLines.length} corrupt line(s) skipped in backlog file`);
  const preview = corruptLines.slice(0, 3);
  preview.forEach((c) => console.log(`   Line ${c.lineNumber}: ${c.error}`));
  if (corruptLines.length > 3) {
    console.log(`   ... and ${corruptLines.length - 3} more`);
  }
  console.log('');
}

function applyItemCountThreshold(warnings, exitCode, activeItemCount, maxItems) {
  const itemCountWarning = checkItemCountThreshold(activeItemCount, maxItems);
  if (itemCountWarning) {
    warnings.push(itemCountWarning);
    return Math.max(exitCode, 1);
  }
  return exitCode;
}

function main() {
  const isPrePush = process.argv.includes('--pre-push');
  const isQuiet = process.argv.includes('--quiet');

  try {
    if (!existsSync(BACKLOG_FILE)) {
      if (!isQuiet) console.error('Backlog file not found at: ' + BACKLOG_FILE);
      process.exitCode = 2;
      return;
    }

    const content = readFileSync(BACKLOG_FILE, 'utf8');
    const { items: allItems, corruptLines } = parseBacklogItems(content);

    const hasAnyNonEmptyLine = content
      .replace(/\uFEFF/g, '')
      .split(/\r?\n/)
      .some((l) => l.trim() !== '');
    if (allItems.length === 0) {
      if (!hasAnyNonEmptyLine) {
        if (!isQuiet) {
          outputHealthSummary(0, [], categorizeBySeverity([]), []);
          outputFinalStatus(0, [], isPrePush);
        }
        process.exitCode = 0;
        return;
      }
      if (!isQuiet) console.error('No valid entries found in backlog file');
      process.exitCode = 2;
      return;
    }

    warnCorruptLines(corruptLines, isQuiet);

    const activeItems = filterActiveItems(allItems);
    const severityGroups = categorizeBySeverity(activeItems);

    const { warnings, blockers, exitCode } = checkThresholds(severityGroups, CONFIG, isPrePush);

    const finalExitCode = applyItemCountThreshold(
      warnings,
      exitCode,
      activeItems.length,
      CONFIG.MAX_ITEMS,
    );

    if (!isQuiet) {
      outputHealthSummary(allItems.length, activeItems, severityGroups, corruptLines);
      outputIssues(blockers, warnings);
      outputFinalStatus(finalExitCode, blockers, isPrePush);
    }

    process.exitCode = determineFinalExitCode(isPrePush, blockers, finalExitCode);
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
