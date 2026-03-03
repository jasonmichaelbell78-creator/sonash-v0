#!/usr/bin/env node
/**
 * TDMS Master Consolidation Pipeline
 *
 * Runs all extraction, normalization, deduplication, and view generation scripts
 * in sequence to consolidate all technical debt into the canonical location.
 *
 * Usage: node scripts/debt/consolidate-all.js
 */

const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const SCRIPTS_DIR = __dirname;

const STEPS = [
  {
    name: 'Extract audit findings',
    script: 'extract-audits.js',
    required: true,
  },
  {
    name: 'Extract review/aggregation findings',
    script: 'extract-reviews.js',
    required: true,
  },
  {
    name: 'Extract scattered TODO/FIXME comments',
    script: 'extract-scattered-debt.js',
    required: false,
  },
  {
    name: 'Normalize all extractions',
    script: 'normalize-all.js',
    required: true,
  },
  {
    name: 'Multi-pass deduplication',
    script: 'dedup-multi-pass.js',
    required: true,
  },
  {
    name: 'Ingest new items and generate views',
    script: 'generate-views.js',
    args: ['--ingest'],
    required: true,
  },
];

function runStep(step, index) {
  const scriptPath = path.join(SCRIPTS_DIR, step.script);

  if (!fs.existsSync(scriptPath)) {
    if (step.required) {
      console.error(`\nError: Required script not found: ${step.script}`);
      process.exit(1);
    }
    console.log(`  Skipping ${step.name} (script not found)`);
    return true;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step ${index + 1}/${STEPS.length}: ${step.name}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const args = [scriptPath, ...(step.args || [])];
    execFileSync(process.execPath, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..'),
    });
    return true;
  } catch (error) {
    if (step.required) {
      console.error(`\nError: Step failed: ${step.name}`);
      // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
    console.warn(`\nWarning: Step failed (non-required): ${step.name}`);
    return false;
  }
}

function main() {
  console.log(`
================================================================
     TDMS - Technical Debt Management System Consolidation
================================================================
`);

  const startTime = Date.now();
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < STEPS.length; i++) {
    if (runStep(STEPS[i], i)) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`CONSOLIDATION COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`  ${successCount}/${STEPS.length} steps completed successfully`);
  console.log(`  Total time: ${duration}s`);

  if (failedCount > 0) {
    process.exitCode = 1;
  }

  const debtDir = process.env.TDMS_DEBT_DIR || 'docs/technical-debt';
  console.log(`\nOutput location: ${debtDir}/`);
  console.log(`   - MASTER_DEBT.jsonl    (canonical source)`);
  console.log(`   - INDEX.md             (human-readable index)`);
  console.log(`   - views/               (filtered views)`);
  console.log(`   - LEGACY_ID_MAPPING.json (old ID -> DEBT-XXXX)`);

  console.log(`\nNext steps:`);
  console.log(`   1. Review INDEX.md for summary`);
  console.log(`   2. Check views/verification-queue.md for items needing review`);
  console.log(`   3. Update ROADMAP.md with new DEBT-XXXX references`);
  console.log(`   4. Archive source documents when verified`);
}

main();
