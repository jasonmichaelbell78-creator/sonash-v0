#!/usr/bin/env node
/**
 * generate-decisions.js
 *
 * Generates DECISIONS.md — the standalone implementation reference for the
 * system-wide standardization overhaul. Organized by section for readability,
 * generated from JSONL for updatability.
 *
 * Per D77/D79: JSONL is source of truth. This MD is the generated view.
 * Update process: append to JSONL → run this script → MD regenerated.
 *
 * Usage:
 *   node scripts/planning/generate-decisions.js [--dry-run]
 */

import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { safeWriteFileSync } from "../lib/safe-fs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, "..", "..");
const PLANNING_DIR = join(ROOT, ".planning", "system-wide-standardization");
const OUTPUT_FILE = join(PLANNING_DIR, "DECISIONS.md");
const DRY_RUN = process.argv.includes("--dry-run");

// --- Helpers ---

function readJsonl(filename) {
  const filepath = join(PLANNING_DIR, filename);
  try {
    const entries = readFileSync(filepath, "utf-8")
      .split("\n")
      .map((line, i) => ({ line, lineNum: i + 1 }))
      .filter(({ line }) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith("//");
      });
    const results = [];
    for (const { line, lineNum } of entries) {
      try {
        results.push(JSON.parse(line));
      } catch (err) {
        console.warn(`WARNING: ${filename} line ${lineNum}: parse error — ${err.message}`);
      }
    }
    return results;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FATAL: Cannot read ${filename}: ${message}`);
    process.exit(1);
  }
}

function esc(str) {
  if (!str) return "";
  return String(str).replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function tag(d) {
  const tags = [];
  if (d.user_directive) tags.push("USER");
  if (d.user_override) tags.push("OVERRIDE");
  if (d.user_insight) tags.push("INSIGHT");
  if (d.superseded_by) tags.push(`superseded:D${d.superseded_by}`);
  return tags.length ? ` \`[${tags.join(", ")}]\`` : "";
}

// --- Load ---

const decisions = readJsonl("decisions.jsonl");
const tenets = readJsonl("tenets.jsonl");
const directives = readJsonl("directives.jsonl");
const ideas = readJsonl("ideas.jsonl");

// --- Classify decisions by section ---

const d67 = decisions.find((d) => d.id === 67);
const d81 = decisions.find((d) => d.id === 81);

// Architecture: D1-D32 (includes CANON structure + tenet discovery)
const architecture = decisions.filter((d) => d.id >= 1 && d.id <= 32);

// Assessments: D33-D54 (ALL of them, not just ones with assessment_summary)
const assessments = decisions.filter((d) => d.id >= 33 && d.id <= 54);

// Sequencing: D55-D67
const sequencing = decisions.filter((d) => d.id >= 55 && d.id <= 67);

// Edge cases: D68-D76
const edgeCases = decisions.filter((d) => d.id >= 68 && d.id <= 76);

// Process: D77-D83
const processDecisions = decisions.filter((d) => d.id >= 77 && d.id <= 83);

// Audit fixes: D84+
const auditFixes = decisions.filter((d) => d.id >= 84);

// Coverage validation - warn about any orphaned decisions
const coveredIds = new Set(
  [
    ...architecture,
    ...assessments,
    ...sequencing,
    ...edgeCases,
    ...processDecisions,
    ...auditFixes,
  ].map((d) => d.id)
);
const uncovered = decisions.filter((d) => !coveredIds.has(d.id));
if (uncovered.length > 0) {
  console.warn(
    `WARNING: ${uncovered.length} decisions not in any section: ${uncovered.map((d) => "D" + d.id).join(", ")}`
  );
}

// --- Build MD ---

const L = [];

L.push("# System-Wide Standardization — Implementation Reference", "");
L.push("> **Auto-generated** from JSONL source files by `generate-decisions.js`.");
L.push("> **Do not manually edit.** Update JSONL → run script → MD regenerated.", "");
L.push(`**Generated:** ${new Date().toISOString().split("T")[0]}  `);
L.push(
  `**Decisions:** ${decisions.length} | **Tenets:** ${tenets.length} | **Directives:** ${directives.length} | **Ideas:** ${ideas.length}`
);
L.push("", "---", "");

// ============================================================
// SECTION 1: QUICK REFERENCE — The Sequence
// ============================================================

L.push("## 1. Implementation Sequence", "");
L.push("21 steps, 18 ecosystems. Sequential with research overlap. TDMS staged x3.", "");

if (d67?.sequence) {
  L.push(
    "| # | Ecosystem | Target | Effort | Key Rationale |",
    "|---|-----------|--------|--------|---------------|"
  );
  for (const s of d67.sequence) {
    L.push(
      `| **${s.pos}** | ${esc(s.ecosystem)} | ${s.target} | ${s.effort} | ${esc(s.rationale)} |`
    );
  }
  L.push("");

  L.push("**Checkpoints:**");
  for (const cp of d67.checkpoints || []) {
    L.push(`- After **#${cp.after}**: ${cp.gate}`);
  }
  L.push("");
}

// ============================================================
// SECTION 2: CORE TENETS
// ============================================================

L.push("---", "", "## 2. Core Tenets", "");
L.push('The "why" behind every decision. Reference these when making implementation choices.', "");

const tenetCategories = [...new Set(tenets.map((t) => t.category).filter(Boolean))];
for (const cat of tenetCategories) {
  const catTenets = tenets.filter((t) => t.category === cat);
  if (catTenets.length === 0) continue;

  L.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
  L.push("");
  for (const t of catTenets) {
    const id = t.id || t.key?.split("_")[0];
    const displayName = t.key?.replace(/^T\d+_/, "") || t.name || "";
    L.push(`**${id}. ${displayName}**  `);
    L.push(`${t.statement}`);
    if (t.note) L.push(`  *Note: ${t.note}*`);
    L.push("");
  }
}

// ============================================================
// SECTION 3: ARCHITECTURE & STANDARDS (D1-D27)
// ============================================================

L.push("---", "");
L.push(`## 3. Architecture & Standards (D1-D${architecture.at(-1)?.id ?? "?"})`);
L.push("", "CANON structure, schemas, formats, enforcement model, naming conventions.", "");
L.push("| # | Decision | Choice |", "|---|----------|--------|");
for (const d of architecture) {
  L.push(`| D${d.id} | ${esc(d.decision)} | ${esc(d.choice)}${tag(d)} |`);
}
L.push("");

// Key details worth expanding
const d9 = decisions.find((d) => d.id === 9);
if (d9?.checklist) {
  L.push("### 16-Item Completeness Checklist (D9)", "");
  for (const item of d9.checklist) {
    L.push(`- ${item}`);
  }
  L.push("");
}

const d21 = decisions.find((d) => d.id === 21);
if (d21?.structure) {
  L.push("### .canon/ Directory Structure (D21)", "");
  for (const [path, desc] of Object.entries(d21.structure)) {
    L.push(`- \`${path}\` — ${desc}`);
  }
  L.push("");
}

// ============================================================
// SECTION 4: ECOSYSTEM ASSESSMENTS
// ============================================================

L.push("---", "", "## 4. Ecosystem Assessments", "");

// Split assessments into maturity assessments and other decisions in this range
const maturityAssessments = assessments.filter((d) => {
  const match = d.choice?.match(/Current (L\d).*?Target (L\d)/);
  return match;
});
const otherAssessmentDecisions = assessments.filter((d) => {
  const match = d.choice?.match(/Current (L\d).*?Target (L\d)/);
  return !match;
});

L.push(
  "| Ecosystem | Current | Target | Effort | Staging | D# |",
  "|-----------|---------|--------|--------|---------|----|"
);

for (const d of maturityAssessments) {
  const match = d.choice.match(/Current (L\d).*?Target (L\d)/);
  const name = d.decision
    .replace(/:.*/, "")
    .replace(/ Current and target maturity/, "")
    .replace(/ Current and target maturity.*/, "");
  const effort = d.effort || "?";
  const staging = d.staging || "Direct";
  let flags = "";
  if (d.user_override) flags = " **[OVERRIDE]**";
  else if (d.priority_elevated) flags = " **[ELEVATED]**";
  L.push(
    `| ${esc(name)}${flags} | ${match[1]} | ${match[2]} | ${esc(effort)} | ${esc(staging)} | D${d.id} |`
  );
}
L.push("");

if (otherAssessmentDecisions.length > 0) {
  L.push("### Other Assessment-Phase Decisions", "");
  L.push("| # | Decision | Choice |", "|---|----------|--------|");
  for (const d of otherAssessmentDecisions) {
    L.push(`| D${d.id} | ${esc(d.decision)} | ${esc(d.choice)}${tag(d)} |`);
  }
  L.push("");
}

// User overrides callout
const overrides = maturityAssessments.filter((d) => d.user_override || d.user_directive);
if (overrides.length > 0) {
  L.push("**User Overrides:**");
  for (const d of overrides) {
    L.push(
      `- **D${d.id}**: ${d.user_note || d.user_directive || d.original_recommendation || "User override applied"}`
    );
  }
  L.push("");
}

// ============================================================
// SECTION 5: SEQUENCING & EXECUTION (D55-D76)
// ============================================================

L.push("---", "", "## 5. Sequencing & Execution", "");
L.push("### Model (D63)");
L.push("Sequential implementation + parallel research overlap. No parallel implementation tracks.");
L.push("Research ecosystem N+1 while implementing ecosystem N.", "");
L.push("### Key Sequencing Decisions", "");
L.push("| # | Decision | Choice |", "|---|----------|--------|");
for (const d of [...sequencing, ...edgeCases]) {
  L.push(`| D${d.id} | ${esc(d.decision)} | ${esc(d.choice)}${tag(d)} |`);
}
L.push("");

// ============================================================
// SECTION 6: PROCESS & ARTIFACTS (D77-D83)
// ============================================================

L.push("---", "", "## 6. Process & Artifacts", "");
L.push("How we work. Artifact standards, safety, generation, audits.", "");
L.push("| # | Decision | Choice |", "|---|----------|--------|");
for (const d of processDecisions) {
  L.push(`| D${d.id} | ${esc(d.decision)} | ${esc(d.choice)}${tag(d)} |`);
}
L.push("");

// Process tree from D79
L.push("### Decision Capture Process (D79)", "", "```");
L.push("User says something");
L.push("  → AI classifies: decision / directive / idea / tenet / correction");
L.push("  → Immediate JSONL append to the right file");
L.push("  → Batch gate: update coordination.json, run generation scripts, git commit");
L.push("  → Safety: commit every batch, tagged commits at checkpoints, MCP at milestones");
L.push("```", "");

// ============================================================
// SECTION 6b: AUDIT FIXES & PROTOCOLS (D84+)
// ============================================================

if (auditFixes.length > 0) {
  L.push("---", "", "## 6b. Audit Fixes & Protocols", "");
  L.push(
    "Decisions arising from Phase 1b audit. Supersession protocols, amendment rules, hardcoded count elimination, artifact hierarchy."
  );
  L.push("", "| # | Decision | Choice |", "|---|----------|--------|");
  for (const d of auditFixes) {
    L.push(`| D${d.id} | ${esc(d.decision)} | ${esc(d.choice)}${tag(d)} |`);
  }
  L.push("");
}

// ============================================================
// SECTION 7: AUDIT FRAMEWORK
// ============================================================

L.push("---", "", "## 7. Audit Framework (D81-D83)", "");
if (d81?.audit_framework) {
  const af = d81.audit_framework;
  const t1Count = (af.tier_1_core || []).length;
  const t2Count = (af.tier_2_analytical || []).length;
  const t3Data = af.tier_3_implementation || {};
  const t3PhaseLevelCount = (t3Data.phase_level_domains || []).length;
  const t3FullScopeCount = (t3Data.full_scope_only_domains || []).length;
  const t3Count = t3PhaseLevelCount + t3FullScopeCount;
  const t4Count = (af.tier_4_ecosystem_completion || []).length;
  const totalDomains = t1Count + t2Count + t3Count + t4Count;

  L.push(
    `${totalDomains} domains across 4 tiers. Interactive process (T15). Multi-level triggers.`
  );
  L.push("");

  L.push(`### Tier 1: Core (${t1Count} domains)`);
  L.push("*Mechanical checks — did we cover everything?*");
  L.push("");
  for (const item of af.tier_1_core || []) L.push(`- ${item}`);
  L.push("");

  L.push(`### Tier 2: Analytical (${t2Count} domains)`);
  L.push("*Deep analysis — gap analysis, re-research, risk assessment*");
  L.push("");
  for (const item of af.tier_2_analytical || []) L.push(`- ${item}`);
  L.push("");

  L.push(`### Tier 3: Implementation (${t3Count} domains)`);
  L.push(
    `*Build-time checks. Phase-level (${t3PhaseLevelCount}) = lightweight + frequent. Full-scope (${t3FullScopeCount}) = comprehensive at completion.*`
  );
  L.push("");
  L.push(`**Phase-level (run at every phase boundary):**`);
  for (const item of t3Data.phase_level_domains || []) L.push(`- ${item}`);
  L.push("");
  L.push(`**Full-scope only (run at ecosystem completion):**`);
  for (const item of t3Data.full_scope_only_domains || []) L.push(`- ${item}`);
  L.push("");

  L.push(`### Tier 4: Ecosystem Completion (${t4Count} domains)`);
  L.push("*Exit checks — did we hit the target?*");
  L.push("");
  for (const item of af.tier_4_ecosystem_completion || []) L.push(`- ${item}`);
  L.push("");

  L.push("### When to Use", "");
  L.push("| Context | Tiers |", "|---------|-------|");
  if (d81.application_matrix) {
    for (const [ctx, tiers] of Object.entries(d81.application_matrix)) {
      L.push(`| ${esc(ctx.replaceAll("_", " "))} | ${esc(tiers)} |`);
    }
  }
  L.push("");
}

// ============================================================
// SECTION 8: USER DIRECTIVES
// ============================================================

L.push("---", "", "## 8. User Directives", "");
L.push("Non-negotiable constraints. These override defaults and recommendations.", "");

for (const d of directives) {
  L.push(`**${d.id}. ${d.key}**  `);
  L.push(`${d.directive}`);
  L.push("");
}

// ============================================================
// SECTION 9: CAPTURED IDEAS
// ============================================================

L.push("---", "", "## 9. Captured Ideas", "");
L.push("Future considerations, potential work items, things to watch for.");
L.push("These are NOT decisions — they're institutional memory for later reference.", "");

for (const idea of ideas) {
  L.push(`${idea.id}. ${idea.idea}`);
}
L.push("");

// ============================================================
// FOOTER
// ============================================================

L.push("---", "");
L.push(`*Generated by \`scripts/planning/generate-decisions.js\` — ${new Date().toISOString()}*  `);
L.push("*Source: decisions.jsonl, tenets.jsonl, directives.jsonl, ideas.jsonl*  ");
L.push("*Update: append to JSONL → run script → MD regenerated*", "");

const output = L.join("\n");

if (DRY_RUN) {
  console.log(output);
  console.log("\n--- DRY RUN ---");
} else {
  safeWriteFileSync(OUTPUT_FILE, output, "utf-8");
  const lineCount = output.split("\n").length;
  console.log(`Generated: DECISIONS.md`);
  console.log(`  ${lineCount} lines`);
  console.log(
    `  Sections: Sequence, Tenets, Architecture, Assessments, Sequencing, Process, Audits, Directives, Ideas`
  );
  console.log(
    `  Data: ${decisions.length} decisions, ${tenets.length} tenets, ${directives.length} directives, ${ideas.length} ideas`
  );
}
