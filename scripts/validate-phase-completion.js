#!/usr/bin/env node
/**
 * Validate Phase Completion - CI ENFORCEMENT
 *
 * This script runs in CI when INTEGRATED_IMPROVEMENT_PLAN.md is modified.
 * It ensures that when a step is marked COMPLETE:
 * 1. A "What Was Accomplished" or acceptance criteria section exists
 * 2. Acceptance criteria are checked
 * 3. The change isn't just flipping status without documentation
 *
 * Exit codes:
 *   0 = Validation passed
 *   1 = Validation failed (block merge)
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const PLAN_PATH = join(
  ROOT,
  "docs",
  "archive",
  "completed-plans",
  "INTEGRATED_IMPROVEMENT_PLAN.md"
);

function main() {
  console.log("🔍 Validating Phase Completion...\n");

  // Read current plan with error handling
  let content;
  try {
    content = readFileSync(PLAN_PATH, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read plan: ${sanitizeError(err)}`);
    process.exit(1);
  }

  // Find all steps marked COMPLETE
  // Note: Use \r?\n for cross-platform CRLF support (Review #51)
  // Updated for INTEGRATED_IMPROVEMENT_PLAN.md format (Review #53)
  const phasePattern = /## (Step \d+:[^*\r\n]+)\r?\n(?:[ \t]*\r?\n)+\*\*Status:\*\* COMPLETE/g;
  const completedPhases = [];
  let match;

  while ((match = phasePattern.exec(content)) !== null) {
    completedPhases.push(match[1].trim());
  }

  if (completedPhases.length === 0) {
    console.log("No phases marked COMPLETE. Validation passed.\n");
    process.exit(0);
  }

  console.log(`Found ${completedPhases.length} phase(s) marked COMPLETE:\n`);

  let allValid = true;
  const issues = [];

  for (const phase of completedPhases) {
    console.log(`Checking: ${phase}`);

    // Find the phase section
    const phaseStart = content.indexOf(`## 📋 ${phase}`);
    if (phaseStart === -1) {
      console.log(`  ⚠️  Could not find phase section`);
      continue;
    }

    // Find next phase section (or end of file)
    const nextPhaseMatch = content.slice(phaseStart + 10).match(/\n## 📋 PHASE/);
    const phaseEnd = nextPhaseMatch ? phaseStart + 10 + nextPhaseMatch.index : content.length;

    const phaseContent = content.slice(phaseStart, phaseEnd);

    // Check 1: "What Was Accomplished" section exists
    const hasAccomplished = /### 📊 What Was Accomplished/.test(phaseContent);
    if (!hasAccomplished) {
      console.log('  ❌ Missing "What Was Accomplished" section');
      issues.push(`${phase}: Missing "What Was Accomplished" section`);
      allValid = false;
    } else {
      console.log('  ✅ Has "What Was Accomplished" section');
    }

    // Check 2: Acceptance criteria have some checked items
    const criteriaChecked = (phaseContent.match(/- \[x\]/g) || []).length;
    const criteriaTotal = (phaseContent.match(/- \[[ x]\]/g) || []).length;

    if (criteriaTotal > 0 && criteriaChecked === 0) {
      console.log("  ❌ No acceptance criteria marked complete");
      issues.push(`${phase}: No acceptance criteria checked`);
      allValid = false;
    } else if (criteriaTotal > 0) {
      console.log(`  ✅ Acceptance criteria: ${criteriaChecked}/${criteriaTotal} checked`);
    }

    // Check 3: Completed date exists
    const hasCompletedDate = /\*\*Completed:\*\*\s*\d{4}-\d{2}-\d{2}/.test(phaseContent);
    if (!hasCompletedDate) {
      console.log('  ❌ Missing "Completed" date');
      issues.push(`${phase}: Missing completion date`);
      allValid = false;
    } else {
      console.log("  ✅ Has completion date");
    }

    console.log("");
  }

  if (allValid) {
    console.log("✅ All phase completions properly documented!\n");
    process.exit(0);
  } else {
    console.log("❌ VALIDATION FAILED\n");
    console.log("The following issues must be fixed before merging:\n");
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    console.log("\nRun `npm run phase:complete` to properly complete a phase.\n");
    process.exit(1);
  }
}

main();
