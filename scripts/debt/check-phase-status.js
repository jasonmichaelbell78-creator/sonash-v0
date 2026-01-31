#!/usr/bin/env node
/**
 * TDMS Phase Status Checker
 *
 * Checks implementation progress by looking for PHASE_N_AUDIT.md files.
 * The audit files ARE the source of truth for phase completion.
 *
 * Usage: node scripts/debt/check-phase-status.js
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const DEBT_DIR = "docs/technical-debt";

const PHASES = [
  { num: "1", name: "Consolidation" },
  { num: "2", name: "PROCEDURE.md" },
  { num: "3", name: "Intake scripts" },
  { num: "4", name: "Validation scripts" },
  { num: "5", name: "Update audit skills" },
  { num: "6", name: "Create intake skills" },
  { num: "7", name: "Pre-commit hooks" },
  { num: "8", name: "CI checks" },
  { num: "9", name: "Verification skill", note: "Done in Phase 6" },
  { num: "9b", name: "Full Audit TDMS Integration" },
  { num: "10", name: "GitHub Action" },
  { num: "11", name: "PR template" },
  { num: "12", name: "pr-review skill" },
  { num: "13", name: "Archive" },
  { num: "14", name: "Dev dashboard" },
  { num: "15", name: "Verification batches" },
  { num: "16", name: "Final doc sync" },
  { num: "17", name: "Final System Audit", file: "FINAL_SYSTEM_AUDIT.md" },
];

function getAuditFile(phase) {
  if (phase.file) return phase.file;
  return `PHASE_${phase.num.toUpperCase()}_AUDIT.md`;
}

function checkPhaseStatus(phase) {
  const file = getAuditFile(phase);
  const path = join(DEBT_DIR, file);

  if (existsSync(path)) {
    // Read file to get status
    try {
      const content = readFileSync(path, "utf-8");
      const statusMatch = content.match(/\*\*Status:\*\*\s*(PASS|FAIL)/i);
      const dateMatch = content.match(/\*\*Audit Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i);

      return {
        complete: true,
        status: statusMatch ? statusMatch[1] : "UNKNOWN",
        date: dateMatch ? dateMatch[1] : "UNKNOWN",
        file,
      };
    } catch {
      return { complete: true, status: "EXISTS", file };
    }
  }

  return { complete: false, file };
}

function main() {
  console.log("📊 TDMS Implementation Phase Status\n");
  console.log("Source of truth: docs/technical-debt/PHASE_N_AUDIT.md files\n");
  console.log("─".repeat(70));

  let completed = 0;
  let pending = 0;

  for (const phase of PHASES) {
    const status = checkPhaseStatus(phase);
    const icon = status.complete ? "✅" : "⬜";

    if (status.complete) {
      completed++;
      const dateStr = status.date !== "UNKNOWN" ? ` (${status.date})` : "";
      const statusStr = status.status !== "UNKNOWN" ? ` - ${status.status}` : "";
      console.log(`${icon} Phase ${phase.num}: ${phase.name}${statusStr}${dateStr}`);
    } else if (phase.note) {
      console.log(`✅ Phase ${phase.num}: ${phase.name} - ${phase.note}`);
      completed++;
    } else {
      pending++;
      console.log(`${icon} Phase ${phase.num}: ${phase.name}`);
    }
  }

  console.log("─".repeat(70));
  console.log(`\n📈 Progress: ${completed}/${PHASES.length} phases complete`);
  console.log(`   Remaining: ${pending} phases\n`);

  // List existing audit files
  if (existsSync(DEBT_DIR)) {
    const files = readdirSync(DEBT_DIR).filter(
      (f) => f.startsWith("PHASE_") && f.endsWith("_AUDIT.md")
    );
    if (files.length > 0) {
      console.log("📁 Audit files found:");
      files.forEach((f) => console.log(`   - ${f}`));
    }
  }
}

main();
