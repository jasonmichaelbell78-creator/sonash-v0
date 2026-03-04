#!/usr/bin/env node
/**
 * decompose-state.js
 *
 * One-time migration script: reads deep-plan.state.json and decomposes it into
 * purpose-specific JSONL files per D77.
 *
 * Output:
 *   .planning/system-wide-standardization/decisions.jsonl
 *   .planning/system-wide-standardization/tenets.jsonl
 *   .planning/system-wide-standardization/directives.jsonl
 *   .planning/system-wide-standardization/ideas.jsonl
 *   .planning/system-wide-standardization/coordination.json
 */

const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

const ROOT = join(__dirname, "..", "..");
const STATE_FILE = join(ROOT, ".claude", "state", "deep-plan.state.json");
const OUTPUT_DIR = join(ROOT, ".planning", "system-wide-standardization");

// Read source
const state = JSON.parse(readFileSync(STATE_FILE, "utf-8"));

// --- decisions.jsonl ---
const decisions = state.decisions || [];
const decisionsLines = decisions.map((d) => JSON.stringify(d)).join("\n");
writeFileSync(join(OUTPUT_DIR, "decisions.jsonl"), decisionsLines + "\n", "utf-8");
console.log(`decisions.jsonl: ${decisions.length} entries`);

// --- tenets.jsonl ---
const tenets = state.core_tenets || {};
const tenetsLines = [];
for (const [category, items] of Object.entries(tenets)) {
  if (category.startsWith("_")) continue; // skip _organization
  for (const [key, value] of Object.entries(items)) {
    tenetsLines.push(
      JSON.stringify({
        id: key.split("_")[0], // T1, T2, etc.
        key,
        ...value,
      })
    );
  }
}
writeFileSync(join(OUTPUT_DIR, "tenets.jsonl"), tenetsLines.join("\n") + "\n", "utf-8");
console.log(`tenets.jsonl: ${tenetsLines.length} entries`);

// --- directives.jsonl ---
const directives = state.user_directives || {};
const directivesLines = Object.entries(directives).map(([key, value], i) =>
  JSON.stringify({ id: i + 1, key, directive: value })
);
writeFileSync(
  join(OUTPUT_DIR, "directives.jsonl"),
  directivesLines.join("\n") + "\n",
  "utf-8"
);
console.log(`directives.jsonl: ${directivesLines.length} entries`);

// --- ideas.jsonl ---
const ideas = state.ideas_captured || [];
const ideasLines = ideas.map((idea, i) =>
  JSON.stringify({ id: i + 1, idea, captured_during: "deep-plan-discovery" })
);
writeFileSync(join(OUTPUT_DIR, "ideas.jsonl"), ideasLines.join("\n") + "\n", "utf-8");
console.log(`ideas.jsonl: ${ideasLines.length} entries`);

// --- coordination.json ---
const coordination = {
  task: state.task,
  topic: state.topic,
  status: state.status,
  current_batch: state.current_batch,
  total_batches_so_far: state.total_batches_so_far,
  estimated_remaining_batches: state.estimated_remaining_batches,
  total_ecosystems: state.total_ecosystems,
  total_decisions: state.total_decisions,
  total_tenets: tenetsLines.length,
  total_directives: directivesLines.length,
  total_ideas: ideasLines.length,
  artifacts: state.artifacts,
  phase_0_outcomes: state.phase_0_outcomes,
  batch_5d_research: state.batch_5d_research,
  batch_5d_qa: state.batch_5d_qa,
  batch_6_progress: state.batch_6_progress,
  session_corrections: state.session_corrections,
  resume_instructions: state.resume_instructions,
  updated: state.updated,
  source_files: {
    decisions: "decisions.jsonl",
    tenets: "tenets.jsonl",
    directives: "directives.jsonl",
    ideas: "ideas.jsonl",
    changelog: "changelog.jsonl (empty until implementation starts)",
  },
  migration_note:
    "Decomposed from .claude/state/deep-plan.state.json per D77. " +
    "JSONL files are now the canonical source. deep-plan.state.json is retained " +
    "as backup but no longer the primary source of truth.",
};
writeFileSync(
  join(OUTPUT_DIR, "coordination.json"),
  JSON.stringify(coordination, null, 2) + "\n",
  "utf-8"
);
console.log("coordination.json: written");

// --- changelog.jsonl (empty placeholder) ---
writeFileSync(
  join(OUTPUT_DIR, "changelog.jsonl"),
  "// T18: Cross-ecosystem impact changelog. One JSONL entry per change.\n",
  "utf-8"
);
console.log("changelog.jsonl: placeholder created");

console.log("\nMigration complete. JSONL suite created in:");
console.log(`  ${OUTPUT_DIR}`);
