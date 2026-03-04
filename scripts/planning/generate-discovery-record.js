#!/usr/bin/env node
/**
 * generate-discovery-record.js
 *
 * Reads JSONL source files and generates DISCOVERY_RECORD.md — the human-readable
 * view of all planning decisions, tenets, directives, and ideas.
 *
 * Per D79: JSONL is source of truth (AI-optimized). MD is generated view (human-optimized).
 * Per T2: source of truth + generated views. Never manually maintain both.
 *
 * Usage:
 *   node scripts/planning/generate-discovery-record.js [--dry-run]
 *
 * This script is the TEMPLATE for all future ecosystem view generators.
 */

import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { safeWriteFileSync } from "../lib/safe-fs.js";
import { readJsonl, escapeCell } from "./lib/read-jsonl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, "..", "..");
const PLANNING_DIR = join(ROOT, ".planning", "system-wide-standardization");
const OUTPUT_FILE = join(PLANNING_DIR, "DISCOVERY_RECORD.md");

const DRY_RUN = process.argv.includes("--dry-run");

// --- Helpers ---

function readCoordination() {
  const filepath = join(PLANNING_DIR, "coordination.json");
  try {
    return JSON.parse(readFileSync(filepath, "utf-8"));
  } catch {
    return {};
  }
}

// --- Load Data ---

const decisions = readJsonl(PLANNING_DIR, "decisions.jsonl");
const tenets = readJsonl(PLANNING_DIR, "tenets.jsonl");
const directives = readJsonl(PLANNING_DIR, "directives.jsonl");
const ideas = readJsonl(PLANNING_DIR, "ideas.jsonl");
const coord = readCoordination();

// --- Generate MD ---

const lines = [];

// --- Header + Tenets Section ---

lines.push(
  "# Discovery Record: System-Wide Standardization",
  "",
  "> **Auto-generated** from JSONL source files by `generate-discovery-record.js`.",
  "> Per D79/T2: JSONL is source of truth. This MD is the generated human view.",
  "> **Do not manually edit** — changes will be overwritten on next generation.",
  "",
  `**Generated:** ${new Date().toISOString().split("T")[0]}`,
  `**Decisions:** ${decisions.length} | **Tenets:** ${tenets.length} | **Directives:** ${directives.length} | **Ideas:** ${ideas.length}`,
  `**Status:** ${coord.status || "unknown"}`,
  "",
  "---",
  "",
  `## Core Tenets (${tenets[0]?.id || "T1"}-${tenets[tenets.length - 1]?.id || "?"})`,
  "",
  "| ID | Name | Category | Statement |",
  "|-----|------|----------|-----------|"
);

for (const t of tenets) {
  const id = t.id || t.key?.split("_")[0] || "?";
  const name = t.key || t.name || "";
  const cat = t.category || "";
  const stmt = t.statement;
  lines.push(`| ${id} | ${escapeCell(name)} | ${cat} | ${escapeCell(stmt)} |`);
}
lines.push("");

// --- Decisions Section ---

const maxDecisionId =
  decisions.length > 0 ? decisions.reduce((max, d) => Math.max(max, d.id), 0) : "?";
lines.push(
  `## All Decisions (D1-D${maxDecisionId})`,
  "",
  "| # | Decision | Choice | Rationale |",
  "|---|----------|--------|-----------|"
);

for (const d of decisions) {
  const choice = d.choice;
  const rationale = d.rationale;
  const superseded = d.superseded_by ? ` *(superseded by D${d.superseded_by})*` : "";
  const userDir = d.user_directive ? " **[USER]**" : "";
  const userOvr = d.user_override ? " **[OVERRIDE]**" : "";
  lines.push(
    `| D${d.id} | ${escapeCell(d.decision)}${superseded} | ${escapeCell(choice)}${userDir}${userOvr} | ${escapeCell(rationale)} |`
  );
}
lines.push("");

// --- Sequence Section ---

const d67 = decisions.find((d) => d.id === 67);
if (d67?.sequence) {
  lines.push(
    "## Implementation Sequence (21 Steps)",
    "",
    "| # | Ecosystem | Target | Effort | Rationale |",
    "|---|-----------|--------|--------|-----------|"
  );
  for (const s of d67.sequence) {
    lines.push(
      `| ${s.pos} | ${escapeCell(s.ecosystem)} | ${s.target} | ${s.effort} | ${escapeCell(s.rationale)} |`
    );
  }
  lines.push("");

  if (d67.checkpoints) {
    lines.push("### Checkpoints", "");
    for (const cp of d67.checkpoints) {
      lines.push(`- **After #${cp.after}:** ${cp.gate}`);
    }
    lines.push("");
  }
}

// --- Ecosystem Assessments ---

lines.push(
  "## Ecosystem Assessments",
  "",
  "| Ecosystem | Current | Target | Effort | Staging | Decision |",
  "|-----------|---------|--------|--------|---------|----------|"
);

const assessmentDecisions = decisions.filter(
  (d) => d.assessment_summary || (d.choice?.includes("Current L") && d.choice?.includes("Target L"))
);
for (const d of assessmentDecisions) {
  const match = d.choice?.match(/Current (L\d).*?Target (L\d)/);
  if (match) {
    const ecosystem = d.decision.replace(/:.*/, "").replace(/ Current and target maturity/, "");
    const effort = d.effort || "?";
    const staging = d.staging || "Direct";
    lines.push(
      `| ${escapeCell(ecosystem)} | ${match[1]} | ${match[2]} | ${effort} | ${escapeCell(staging)} | D${d.id} |`
    );
  }
}
// --- Directives Section ---

lines.push("", "## User Directives (" + directives.length + ")", "");

for (const d of directives) {
  lines.push(`${d.id}. **${d.key}**: ${d.directive}`);
}

// --- Ideas Section ---

lines.push("", "## Captured Ideas (" + ideas.length + ")", "");

for (const idea of ideas) {
  lines.push(`${idea.id}. ${idea.idea}`);
}
lines.push("");

// --- Audit Framework ---

const d81 = decisions.find((d) => d.id === 81);
if (d81?.audit_framework) {
  lines.push("## Audit Framework (26 Domains, 4 Tiers)", "");

  const af = d81.audit_framework;
  lines.push("### Tier 1: Core");
  for (const item of af.tier_1_core || []) lines.push(`- ${item}`);
  lines.push("", "### Tier 2: Analytical");
  for (const item of af.tier_2_analytical || []) lines.push(`- ${item}`);
  lines.push("", "### Tier 3: Implementation");
  const t3 = af.tier_3_implementation || {};
  lines.push(`*${t3.description || ""}*`, "");
  const phaseLevelCount = (t3.phase_level_domains || []).length;
  lines.push(`**Phase-Level (${phaseLevelCount} domains):**`);
  for (const item of t3.phase_level_domains || []) lines.push(`- ${item}`);
  lines.push("");
  const fullScopeCount = (t3.full_scope_only_domains || []).length;
  lines.push(`**Full-Scope Only (${fullScopeCount} additional):**`);
  for (const item of t3.full_scope_only_domains || []) lines.push(`- ${item}`);
  lines.push("", "### Tier 4: Ecosystem Completion");
  for (const item of af.tier_4_ecosystem_completion || []) lines.push(`- ${item}`);
  lines.push("");
}

// --- Footer ---

lines.push(
  "---",
  "",
  "*Generated by `scripts/planning/generate-discovery-record.js` from JSONL sources.*",
  "*Source files: decisions.jsonl, tenets.jsonl, directives.jsonl, ideas.jsonl*",
  ""
);

const output = lines.join("\n");

if (DRY_RUN) {
  console.log(output);
  console.log("\n--- DRY RUN: not written to file ---");
} else {
  safeWriteFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(
    `  ${decisions.length} decisions, ${tenets.length} tenets, ${directives.length} directives, ${ideas.length} ideas`
  );
  console.log(`  ${output.split("\n").length} lines`);
}
