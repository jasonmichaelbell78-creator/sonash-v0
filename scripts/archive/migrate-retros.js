#!/usr/bin/env node
/* eslint-disable no-undef -- CJS globals (__dirname, require) */
/**
 * One-time migration: extract retro data from markdown and write to retros.jsonl.
 * Run from project root: node scripts/reviews/migrate-retros.js
 */

const { writeRetroRecord } = require("./dist/write-retro-record.js");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");

const retros = [
  {
    pr: 395,
    date: "2026-02-27",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 395, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "0% avoidable rounds — cleanest cycle since PR #393",
      "Propagation discipline (pre-check #17) fully followed",
      "FIX_TEMPLATE #45 production-validated and extended",
      "Lowest rejection rate in series (6%)",
    ],
    top_misses: ["TDMS data quality still unautomated (DEBT-11312) — 10/18 items were TDMS fixes"],
    process_changes: [
      "Implement JSONL schema validation (DEBT-11312)",
      "Multi-source convergence should auto-elevate finding priority",
    ],
    score: 9,
    metrics: { total_findings: 18, fix_rate: 0.94, pattern_recurrence: 2 },
  },
  {
    pr: 396,
    date: "2026-02-27",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 396, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "Strong 74% item reduction R1 to R2",
      "100% rejection accuracy — all 16 rejections held",
      "SonarCloud 0% false positive rate (12/12 actionable)",
    ],
    top_misses: [
      "Qodo Compliance 50% false positive rate",
      "Test regex not updated when production regex changed",
    ],
    process_changes: [
      "Suppress Qodo repeat-rejection items across rounds",
      "Update test regex when modifying production regex in same commit",
    ],
    score: 7,
    metrics: { total_findings: 48, fix_rate: 0.63, pattern_recurrence: 2 },
  },
  {
    pr: 397,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 397, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: ["Same-day completion despite 7 rounds", "74% fix rate across 84 items"],
    top_misses: [
      "43% avoidable rounds from known patterns",
      "CC pre-push check still not implemented (4th recommendation)",
      "Propagation misses in R5 (regex) and R6 (symlink guard)",
    ],
    process_changes: [
      "BLOCKING: Implement CC pre-push check (4th recommendation)",
      "Regex sweep after any S5852 fix — check entire file",
    ],
    score: 6,
    metrics: { total_findings: 84, fix_rate: 0.74, pattern_recurrence: 3 },
  },
  {
    pr: 398,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 398, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "Clean 2-round cycle with 79% fix rate",
      "Return to 2-round norm after PR #397 anomaly",
    ],
    top_misses: ["escapeLinkText needed 2 rounds due to incomplete initial impl"],
    process_changes: [
      "Enumerate all escape characters upfront when adding escape/sanitization functions",
    ],
    score: 8,
    metrics: { total_findings: 29, fix_rate: 0.79, pattern_recurrence: 1 },
  },
  {
    pr: 407,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 407, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "Completed longest review cycle in project history (17 rounds)",
      "5 ping-pong chains fully documented for process learning",
    ],
    top_misses: [
      "~50% avoidable — 8-9 rounds could have been eliminated",
      "All 3 top action items from previous retros remained unimplemented",
      "22% false positive rate (top-level await + compliance repeats)",
    ],
    process_changes: [
      "BLOCKING: Implement CC pre-push check (5th recommendation)",
      "Suppress Qodo top-level await and compliance repeat noise",
      "Propagation grep on all fixes (Pattern 13: Fix-One-Audit-All)",
    ],
    score: 4,
    metrics: { total_findings: 436, fix_rate: 0.77, pattern_recurrence: 6 },
  },
  {
    pr: 411,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 411, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "Batched review protocol effectively managed 414 items in single session",
      "ES modernization bulk (115 items R6) handled efficiently",
    ],
    top_misses: [
      "43% false positive rate dominated by Semgrep rule expansion",
      "Semgrep rule expansion took 4 rounds of iterative tightening",
      "CC pre-push check still not implemented (5th recommendation)",
    ],
    process_changes: [
      "Semgrep rule test harness — test against representative codebase before deploying",
      "Run SonarCloud locally before pushing to prevent first-scan volume surprises",
      "Continue batched review protocol for large PRs",
    ],
    score: 6.5,
    metrics: { total_findings: 414, fix_rate: 0.32, pattern_recurrence: 4 },
  },
  {
    pr: 414,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 414, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "Perfect single-round cycle — 100% fix rate, 0 rejections",
      "Cleanest review cycle since PR #378",
    ],
    top_misses: ["3/8 items were wrong percentages from manual metric calculation"],
    process_changes: [
      "Auto-compute changelog metrics from JSONL source data instead of manual calculation",
    ],
    score: 9.5,
    metrics: { total_findings: 8, fix_rate: 1, pattern_recurrence: 1 },
  },
  {
    pr: 415,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "migration", pr: 415, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: [
      "R1 tool exclusion fix was efficient single-root-cause resolution (5/8 items)",
      "Good 4-round cycle for large planning PR (336 files)",
    ],
    top_misses: [
      "50% avoidable rounds",
      "escapeCell propagation took 3 rounds (R2→R3→R4)",
      "S5852/S4036 false positives across 3 consecutive rounds",
    ],
    process_changes: [
      "Add .planning/ exclusions to all scanning tools before committing",
      "Suppress SonarCloud S5852 (space-only regex) and S4036 (hardcoded execFileSync)",
      "Design validators with dry-run/comparison pattern from the start",
    ],
    score: 7.5,
    metrics: { total_findings: 45, fix_rate: 0.76, pattern_recurrence: 3 },
  },
  {
    pr: 416,
    date: "2026-03-04",
    schema_version: 1,
    completeness: "stub",
    completeness_missing: ["review_cycle", "walkthrough", "action_items"],
    origin: { type: "migration", pr: 416, tool: "write-retro-record.ts" },
    session: "215",
    top_wins: ["Planning-only PR generated 0 review rounds — tool exclusions working"],
    top_misses: null,
    process_changes: null,
    score: null,
    metrics: { total_findings: 0, fix_rate: 0, pattern_recurrence: 0 },
  },
];

let success = 0;
let failed = 0;

for (const retro of retros) {
  try {
    const record = writeRetroRecord(ROOT, retro);
    console.log(`OK: ${record.id}`);
    success++;
  } catch (err) {
    console.error(`FAIL PR #${retro.pr}: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

console.log(`\nMigration complete: ${success} written, ${failed} failed`);
if (failed > 0) process.exit(1);
