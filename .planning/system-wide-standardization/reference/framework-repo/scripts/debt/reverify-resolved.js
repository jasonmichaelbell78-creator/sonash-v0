#!/usr/bin/env node

/**
 * Re-verify RESOLVED items flagged as "possibly unresolved" by the resolution audit.
 *
 * Categorizes each item as:
 *   - FALSE_ALARM: Code was fixed, audit matched on comments/unrelated patterns -- keep RESOLVED
 *   - FILE_MISSING: Referenced file no longer exists -- keep RESOLVED
 *   - GENUINELY_UNRESOLVED: Pattern still exists, set back to VERIFIED
 *   - ALREADY_VERIFIED: Item is already VERIFIED (audit already changed it) -- no action needed
 *
 * Usage:
 *   node scripts/debt/reverify-resolved.js          # dry run
 *   node scripts/debt/reverify-resolved.js --write   # apply changes
 */

const fs = require('node:fs');
const path = require('node:path');
const { safeWriteFileSync, safeRenameSync } = require('../lib/safe-fs');

const ROOT = path.resolve(__dirname, '../..');
const MASTER_PATH = path.join(ROOT, 'docs/technical-debt/MASTER_DEBT.jsonl');
const DEDUPED_PATH = path.join(ROOT, 'docs/technical-debt/raw/deduped.jsonl');
const REPORT_PATH = path.join(ROOT, 'docs/technical-debt/logs/resolution-audit-report.json');

const writeMode = process.argv.includes('--write');

// --- Load flagged IDs from audit report ---
let report;
try {
  report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
  console.error(`Error: Failed to read or parse ${REPORT_PATH}: ${msg}`);
  process.exit(1);
}
const flaggedDetails = report?.step4_audit_resolved?.possibly_unresolved_details;
if (!Array.isArray(flaggedDetails)) {
  console.error("Error: 'possibly_unresolved_details' not found or not an array in audit report.");
  process.exit(1);
}
const flaggedIds = new Set(flaggedDetails.map((d) => d.id));

console.log(`\nLoaded ${flaggedIds.size} flagged IDs from audit report.\n`);

// --- Load MASTER_DEBT ---
let lines;
try {
  lines = fs.readFileSync(MASTER_PATH, 'utf8').split('\n').filter(Boolean);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
  console.error(`Error: Failed to read ${MASTER_PATH}: ${msg}`);
  process.exit(1);
}
const allItems = lines.flatMap((l, idx) => {
  try {
    return [JSON.parse(l)];
  } catch {
    console.warn(`  WARN: skipping malformed JSON at MASTER_DEBT.jsonl:${idx + 1}`);
    return [];
  }
});
const flaggedItems = allItems.filter((item) => flaggedIds.has(item.id));

console.log(`Found ${flaggedItems.length} matching items in MASTER_DEBT.jsonl.\n`);

// --- Manual verification results ---
// Populate these sets with DEBT IDs based on your codebase verification.
// FALSE_ALARM: Code was fixed, audit matched on leftover comments/patterns -- keep RESOLVED
// GENUINELY_UNRESOLVED: Pattern still exists in code -- set back to VERIFIED

const falseAlarms = new Set([
  // Add DEBT-XXXX IDs here for items confirmed as false alarms
]);

const genuinelyUnresolved = new Set([
  // Add DEBT-XXXX IDs here for items that are genuinely unresolved
]);

// --- Categorize all flagged items ---
const categories = {
  FALSE_ALARM: [],
  GENUINELY_UNRESOLVED: [],
  ALREADY_VERIFIED: [],
  FILE_MISSING: [],
};

for (const item of flaggedItems) {
  const filePath = item.file ? path.join(ROOT, item.file) : null;

  if (falseAlarms.has(item.id)) {
    categories.FALSE_ALARM.push(item.id);
  } else if (genuinelyUnresolved.has(item.id)) {
    categories.GENUINELY_UNRESOLVED.push(item.id);
  } else if (filePath && !fs.existsSync(filePath)) {
    categories.FILE_MISSING.push(item.id);
  } else if (item.status === 'VERIFIED') {
    // Default: items we didn't manually verify -- classify based on current status
    categories.ALREADY_VERIFIED.push(item.id);
  } else {
    // RESOLVED items we didn't check -- conservatively mark as unresolved
    categories.GENUINELY_UNRESOLVED.push(item.id);
  }
}

// --- Report ---
console.log('===================================================================');
console.log('  RE-VERIFICATION RESULTS');
console.log('===================================================================\n');

console.log(`  FALSE_ALARM (keep RESOLVED):     ${categories.FALSE_ALARM.length}`);
console.log(`  FILE_MISSING (keep RESOLVED):    ${categories.FILE_MISSING.length}`);
console.log(`  ALREADY_VERIFIED (no change):    ${categories.ALREADY_VERIFIED.length}`);
console.log(`  GENUINELY_UNRESOLVED (-> VERIFIED): ${categories.GENUINELY_UNRESOLVED.length}`);
console.log(`\n  TOTAL: ${Object.values(categories).reduce((a, b) => a + b.length, 0)}\n`);

if (categories.FALSE_ALARM.length > 0) {
  console.log('FALSE ALARM IDs (code was fixed, audit matched on leftovers):');
  for (const id of categories.FALSE_ALARM) {
    console.log(`  ${id}`);
  }
  console.log();
}

if (categories.GENUINELY_UNRESOLVED.length > 0) {
  console.log('GENUINELY UNRESOLVED IDs (pattern still exists in code):');
  for (const id of categories.GENUINELY_UNRESOLVED) {
    console.log(`  ${id}`);
  }
  console.log();
}

if (categories.ALREADY_VERIFIED.length > 0) {
  console.log('ALREADY VERIFIED (audit already set these back):');
  for (const id of categories.ALREADY_VERIFIED) {
    console.log(`  ${id}`);
  }
  console.log();
}

// --- Apply changes ---
// Items that are currently RESOLVED but should be VERIFIED
const toRevert = new Set(categories.GENUINELY_UNRESOLVED);
// Items that are currently VERIFIED but should be RESOLVED (false alarms the audit incorrectly changed)
const toResolve = new Set(categories.FALSE_ALARM);

let revertedCount = 0;
let resolvedCount = 0;

if (writeMode) {
  const today = new Date().toISOString().split('T')[0];
  const updatedLines = [];
  for (const line of lines) {
    try {
      const item = JSON.parse(line);

      if (toRevert.has(item.id) && item.status === 'RESOLVED') {
        item.status = 'VERIFIED';
        item.resolution_note =
          (item.resolution_note || '') +
          ` [Re-opened by reverify-resolved.js ${today}: pattern still detected in codebase]`;
        revertedCount++;
        updatedLines.push(JSON.stringify(item));
      } else if (toResolve.has(item.id) && item.status === 'VERIFIED') {
        item.status = 'RESOLVED';
        item.resolution_note =
          (item.resolution_note || '') +
          ` [Re-resolved by reverify-resolved.js ${today}: verified code was actually fixed]`;
        resolvedCount++;
        updatedLines.push(JSON.stringify(item));
      } else {
        updatedLines.push(line);
      }
    } catch {
      updatedLines.push(line);
    }
  }

  // Stage both tmp files
  const masterTmpPath = MASTER_PATH + '.tmp';
  safeWriteFileSync(masterTmpPath, updatedLines.join('\n') + '\n', 'utf8');

  let dedupedTmpPath = null;
  if (fs.existsSync(DEDUPED_PATH)) {
    // eslint-disable-next-line framework/no-toctou-file-ops, framework/no-unguarded-file-read -- existence check is advisory; read failure handled below
    const dedupedLines = fs.readFileSync(DEDUPED_PATH, 'utf8').split('\n').filter(Boolean);
    const dedupedUpdated = [];
    for (const line of dedupedLines) {
      try {
        const item = JSON.parse(line);
        if (toRevert.has(item.id) && item.status === 'RESOLVED') {
          item.status = 'VERIFIED';
          item.resolution_note =
            (item.resolution_note || '') +
            ` [Re-opened by reverify-resolved.js ${today}: pattern still detected in codebase]`;
          dedupedUpdated.push(JSON.stringify(item));
        } else if (toResolve.has(item.id) && item.status === 'VERIFIED') {
          item.status = 'RESOLVED';
          item.resolution_note =
            (item.resolution_note || '') +
            ` [Re-resolved by reverify-resolved.js ${today}: verified code was actually fixed]`;
          dedupedUpdated.push(JSON.stringify(item));
        } else {
          dedupedUpdated.push(line);
        }
      } catch {
        dedupedUpdated.push(line);
      }
    }
    dedupedTmpPath = DEDUPED_PATH + '.tmp';
    safeWriteFileSync(dedupedTmpPath, dedupedUpdated.join('\n') + '\n', 'utf8');
  }

  // Commit atomically
  safeRenameSync(masterTmpPath, MASTER_PATH);
  try {
    if (dedupedTmpPath) safeRenameSync(dedupedTmpPath, DEDUPED_PATH);
  } catch (renameErr) {
    try {
      safeRenameSync(MASTER_PATH, masterTmpPath);
    } catch {
      /* ignore */
    }
    throw renameErr;
  }

  console.log('===================================================================');
  console.log('  WRITE MODE -- Changes applied:');
  console.log(`  Reverted to VERIFIED:   ${revertedCount}`);
  console.log(`  Re-resolved to RESOLVED: ${resolvedCount}`);
  console.log('  Updated: MASTER_DEBT.jsonl + deduped.jsonl');
  console.log('===================================================================\n');
} else {
  // Count how many would change
  let wouldRevert = 0;
  let wouldResolve = 0;
  for (const item of allItems) {
    if (toRevert.has(item.id) && item.status === 'RESOLVED') wouldRevert++;
    if (toResolve.has(item.id) && item.status === 'VERIFIED') wouldResolve++;
  }

  console.log('===================================================================');
  console.log('  DRY RUN -- No changes made. Would apply:');
  console.log(`  Revert to VERIFIED:      ${wouldRevert}`);
  console.log(`  Re-resolve to RESOLVED:  ${wouldResolve}`);
  console.log('  Run with --write to apply.');
  console.log('===================================================================\n');
}
