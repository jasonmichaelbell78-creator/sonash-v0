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

  // Group by source
  const bySource = new Map();
  for (const entry of entries) {
    const key = entry.source || "unknown";
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(entry);
  }

  // Count decisions
  const decisions = {};
  for (const entry of entries) {
    const d = entry.decision || "defer";
    decisions[d] = (decisions[d] || 0) + 1;
  }

  const decisionSummary = Object.entries(decisions)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  // Sort sources: repos first, then websites, then others
  const sourceOrder = [...bySource.keys()].sort((a, b) => {
    const aIsUrl = a.startsWith("http");
    const bIsUrl = b.startsWith("http");
    if (aIsUrl && !bIsUrl) return 1;
    if (!aIsUrl && bIsUrl) return -1;
    return a.localeCompare(b);
  });

  // Build TOC data
  const tocRows = [];
  for (const source of sourceOrder) {
    const sourceEntries = bySource.get(source);
    const sourceType = sourceEntries[0]?.source_type || "repo";
    const total = sourceEntries.length;
    const typeCounts = { pattern: 0, knowledge: 0, "anti-pattern": 0, content: 0 };
    for (const e of sourceEntries) {
      const t = (e.type || "").toLowerCase();
      if (t.includes("pattern") && !t.includes("anti")) typeCounts.pattern++;
      else if (t.includes("anti")) typeCounts["anti-pattern"]++;
      else if (t.includes("knowledge")) typeCounts.knowledge++;
      else if (t.includes("content")) typeCounts.content++;
      else typeCounts.pattern++; // architecture-pattern, tool, etc.
    }
    // Generate anchor: lowercase, replace non-alphanumeric with hyphens
    const anchor = source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    tocRows.push({ source, sourceType, anchor, total, ...typeCounts });
  }

  const lines = [
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
    "| ------ | ---- | ----- | ------- | --------- | ------------ | ------- |",
  ];

  for (const row of tocRows) {
    lines.push(
      `| [${escapeCell(row.source)}](#${row.anchor}-${row.sourceType}) | ${row.sourceType} | ${row.total} | ${row.pattern} | ${row.knowledge} | ${row["anti-pattern"]} | ${row.content} |`
    );
  }

  lines.push("", "---");

  for (const source of sourceOrder) {
    const sourceEntries = bySource.get(source);
    const sourceType = sourceEntries[0]?.source_type || "repo";
    const isQuickScan = sourceEntries.length <= 2 && sourceEntries.every((e) => !e.notes);

    lines.push(
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

  // Warn on entries with empty tags (CONVENTIONS 14)
  let untaggedCount = 0;
  for (const entry of entries) {
    if (!entry.tags || entry.tags.length === 0) untaggedCount++;
  }
  if (untaggedCount > 0) {
    console.warn(
      `WARNING: ${untaggedCount} extraction entries have no tags. Run: node scripts/cas/backfill-tags.js`
    );
  }

  const content = lines.join("\n") + "\n";

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
      `Generated EXTRACTIONS.md: ${entries.length} candidates across ${bySource.size} sources.`
    );
  } catch (err) {
    console.error(`Failed to write EXTRACTIONS.md: ${sanitizeError(err)}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
