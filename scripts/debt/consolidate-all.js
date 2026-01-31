#!/usr/bin/env node
/* global __dirname */
/**
 * TDMS Master Consolidation Pipeline
 *
 * Runs all extraction, normalization, deduplication, and view generation scripts
 * in sequence to consolidate all technical debt into the canonical location.
 *
 * Usage: node scripts/debt/consolidate-all.js
 */

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const SCRIPTS_DIR = __dirname;

const STEPS = [
  {
    name: "Extract SonarCloud issues",
    script: "extract-sonarcloud.js",
    required: true,
  },
  {
    name: "Extract audit findings",
    script: "extract-audits.js",
    required: true,
  },
  {
    name: "Extract review/aggregation findings",
    script: "extract-reviews.js",
    required: true,
  },
  {
    name: "Normalize all extractions",
    script: "normalize-all.js",
    required: true,
  },
  {
    name: "Multi-pass deduplication",
    script: "dedup-multi-pass.js",
    required: true,
  },
  {
    name: "Generate views and final output",
    script: "generate-views.js",
    required: true,
  },
];

function runStep(step, index) {
  const scriptPath = path.join(SCRIPTS_DIR, step.script);

  if (!fs.existsSync(scriptPath)) {
    if (step.required) {
      console.error(`\n❌ Required script not found: ${step.script}`);
      process.exit(1);
    }
    console.log(`  ⏭️ Skipping ${step.name} (script not found)`);
    return true;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Step ${index + 1}/${STEPS.length}: ${step.name}`);
  console.log(`${"═".repeat(60)}\n`);

  try {
    execFileSync(process.execPath, [scriptPath], {
      stdio: "inherit",
      cwd: path.join(__dirname, "../.."),
    });
    return true;
  } catch (error) {
    if (step.required) {
      console.error(`\n❌ Step failed: ${step.name}`);
      console.error(`   ${error.message}`);
      process.exit(1);
    }
    console.warn(`\n⚠️ Step failed (non-required): ${step.name}`);
    return false;
  }
}

function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     TDMS - Technical Debt Management System Consolidation     ║
╚══════════════════════════════════════════════════════════════╝
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

  console.log(`\n${"═".repeat(60)}`);
  console.log(`CONSOLIDATION COMPLETE`);
  console.log(`${"═".repeat(60)}\n`);

  console.log(`✅ ${successCount}/${STEPS.length} steps completed successfully`);
  console.log(`⏱️ Total time: ${duration}s`);

  // Set non-zero exit code if any step failed (for CI)
  if (failedCount > 0) {
    process.exitCode = 1;
  }

  console.log(`\n📁 Output location: docs/technical-debt/`);
  console.log(`   - MASTER_DEBT.jsonl    (canonical source)`);
  console.log(`   - INDEX.md             (human-readable index)`);
  console.log(`   - views/               (filtered views)`);
  console.log(`   - LEGACY_ID_MAPPING.json (old ID → DEBT-XXXX)`);

  console.log(`\n📋 Next steps:`);
  console.log(`   1. Review INDEX.md for summary`);
  console.log(`   2. Check views/verification-queue.md for items needing review`);
  console.log(`   3. Update ROADMAP.md with new DEBT-XXXX references`);
  console.log(`   4. Archive source documents when verified`);
}

main();
