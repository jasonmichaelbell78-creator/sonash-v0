"use strict";

/**
 * Content Analysis System — Generate EXTRACTIONS.md
 *
 * Auto-generates .research/EXTRACTIONS.md from extraction-journal.jsonl.
 * Idempotent — safe to run anytime. Groups entries by source, sorted by
 * decision date descending.
 *
 * Usage: node scripts/cas/generate-extractions-md.js
 *
 * @see .claude/skills/repo-analysis/SKILL.md (Cross-Repo Extraction Tracking)
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/security-helpers.js");
const { safeAtomicWriteSync, isSafeToWrite } = require("../lib/safe-fs");
const readJsonl = require("../lib/read-jsonl.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const OUTPUT_PATH = path.join(PROJECT_ROOT, ".research", "EXTRACTIONS.md");

function escapeCell(text) {
  if (typeof text !== "string") return "-";
  return text.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ").slice(0, 120);
}

function groupBySource(entries) {
  const bySource = new Map();
  for (const entry of entries) {
    const key = entry.source || "unknown";
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(entry);
  }
  return bySource;
}

function buildDecisionSummary(entries) {
  const decisions = {};
  for (const entry of entries) {
    const d = entry.decision || "defer";
    decisions[d] = (decisions[d] || 0) + 1;
  }
  return Object.entries(decisions)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function sortSources(bySource) {
  // Repos first (non-URL), then websites (starts-with-http), then alphabetical within group.
  return [...bySource.keys()].sort((a, b) => {
    const aIsUrl = a.startsWith("http");
    const bIsUrl = b.startsWith("http");
    if (aIsUrl && !bIsUrl) return 1;
    if (!aIsUrl && bIsUrl) return -1;
    return a.localeCompare(b);
  });
}

function countEntryTypes(sourceEntries) {
  const typeCounts = { pattern: 0, knowledge: 0, "anti-pattern": 0, content: 0 };
  for (const e of sourceEntries) {
    const t = (e.type || "").toLowerCase();
    if (t.includes("pattern") && !t.includes("anti")) typeCounts.pattern++;
    else if (t.includes("anti")) typeCounts["anti-pattern"]++;
    else if (t.includes("knowledge")) typeCounts.knowledge++;
    else if (t.includes("content")) typeCounts.content++;
    else typeCounts.pattern++; // architecture-pattern, tool, etc.
  }
  return typeCounts;
}

/**
 * Build a renderer-independent anchor ID for a section heading. Sections
 * emit explicit <a id="..."></a> anchors so TOC links do not depend on
 * each markdown renderer's slugging algorithm (Qodo #3).
 */
function buildSectionAnchorId(source, sourceType) {
  const slug = source
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
  return `${slug}-${sourceType}`;
}

function buildTocRows(bySource, sourceOrder) {
  const rows = [];
  for (const source of sourceOrder) {
    const sourceEntries = bySource.get(source);
    const sourceType = sourceEntries[0]?.source_type || "repo";
    rows.push({
      source,
      sourceType,
      anchorId: buildSectionAnchorId(source, sourceType),
      total: sourceEntries.length,
      ...countEntryTypes(sourceEntries),
    });
  }
  return rows;
}

function appendHeader(lines, entries, bySource, decisionSummary) {
  lines.push(
    "# Extraction Candidates — Cross-Entity Summary",
    "",
    "Auto-generated from `extraction-journal.jsonl` by `scripts/cas/generate-extractions-md.js`.",
    "Do not edit directly — run `node scripts/cas/generate-extractions-md.js` to rebuild.",
    "",
    `**Total:** ${entries.length} candidates across ${bySource.size} sources | **By decision:** ${decisionSummary}`,
    "",
    "---",
    "",
    "## Table of Contents",
    "",
    "| Source | Type | Total | Pattern | Knowledge | Anti-Pattern | Content |",
    "| ------ | ---- | ----- | ------- | --------- | ------------ | ------- |"
  );
}

function appendTocTable(lines, tocRows) {
  for (const row of tocRows) {
    lines.push(
      `| [${escapeCell(row.source)}](#${row.anchorId}) | ${row.sourceType} | ${row.total} | ${row.pattern} | ${row.knowledge} | ${row["anti-pattern"]} | ${row.content} |`
    );
  }
}

function appendSourceSection(lines, source, sourceEntries) {
  const sourceType = sourceEntries[0]?.source_type || "repo";
  const isQuickScan = sourceEntries.length <= 2 && sourceEntries.every((e) => !e.notes);
  const anchorId = buildSectionAnchorId(source, sourceType);
  lines.push(
    "",
    // Explicit HTML anchor keeps TOC links stable across markdown renderers.
    `<a id="${anchorId}"></a>`,
    "",
    `## ${source} (${sourceType})${isQuickScan ? " — Quick Scan" : ""}`,
    "",
    "| Candidate | Type | Decision | Date | Novelty | Effort | Relevance | Extracted To | Notes |",
    "| --------- | ---- | -------- | ---- | ------- | ------ | --------- | ------------ | ----- |"
  );
  sourceEntries.sort((a, b) =>
    String(b.decision_date || "").localeCompare(String(a.decision_date || ""))
  );
  for (const entry of sourceEntries) {
    const row = [
      escapeCell(entry.candidate),
      escapeCell(entry.type),
      escapeCell(entry.decision || "defer"),
      escapeCell(entry.decision_date),
      escapeCell(entry.novelty),
      escapeCell(entry.effort),
      escapeCell(entry.relevance),
      escapeCell(entry.extracted_to),
      escapeCell(entry.notes),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }
}

function countUntagged(entries) {
  let n = 0;
  for (const entry of entries) {
    if (!entry.tags || entry.tags.length === 0) n++;
  }
  return n;
}

function writeOutput(content, entryCount, sourceCount) {
  if (!isSafeToWrite(OUTPUT_PATH)) {
    console.error("Refusing to write — symlink detected on EXTRACTIONS.md");
    process.exit(1);
  }
  // Atomic rewrite: tmp file + rename. Propagation of the Qodo "Retag
  // rewrites non-atomic" finding from retag.js — EXTRACTIONS.md is the same
  // full-file rewrite shape (drop the whole file and re-emit), so the same
  // crash-safety argument applies.
  try {
    safeAtomicWriteSync(OUTPUT_PATH, content, "utf8");
    console.log(
      `Generated EXTRACTIONS.md: ${entryCount} candidates across ${sourceCount} sources.`
    );
  } catch (err) {
    console.error(`Failed to write EXTRACTIONS.md: ${sanitizeError(err)}`);
    process.exit(1);
  }
}

function main() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    console.error("No extraction journal found at", JOURNAL_PATH);
    process.exit(1);
  }
  const entries = readJsonl(JOURNAL_PATH, { safe: true, quiet: true });
  if (entries.length === 0) {
    console.log("Journal is empty — nothing to generate.");
    return;
  }
  const bySource = groupBySource(entries);
  const decisionSummary = buildDecisionSummary(entries);
  const sourceOrder = sortSources(bySource);
  const tocRows = buildTocRows(bySource, sourceOrder);

  const lines = [];
  appendHeader(lines, entries, bySource, decisionSummary);
  appendTocTable(lines, tocRows);
  lines.push("", "---");
  for (const source of sourceOrder) {
    appendSourceSection(lines, source, bySource.get(source));
  }

  const untaggedCount = countUntagged(entries);
  if (untaggedCount > 0) {
    console.warn(
      `WARNING: ${untaggedCount} extraction entries have no tags. Run: node scripts/cas/backfill-tags.js`
    );
  }

  writeOutput(lines.join("\n") + "\n", entries.length, bySource.size);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
