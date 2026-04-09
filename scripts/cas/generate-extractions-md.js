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
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");
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
    .join(",\n");

  const lines = [
    "# Extraction Candidates — Cross-Entity Summary",
    "",
    "Auto-generated from `extraction-journal.jsonl`. Do not edit directly.",
    "",
    `**Schema version:** 2.0 | **Total:** ${entries.length} candidates **By decision:** ${decisionSummary}`,
    "",
    "---",
  ];

  // Sort sources: repos first, then websites, then others
  const sourceOrder = [...bySource.keys()].sort((a, b) => {
    const aIsUrl = a.startsWith("http");
    const bIsUrl = b.startsWith("http");
    if (aIsUrl && !bIsUrl) return 1;
    if (!aIsUrl && bIsUrl) return -1;
    return a.localeCompare(b);
  });

  for (const source of sourceOrder) {
    const sourceEntries = bySource.get(source);
    const sourceType = sourceEntries[0]?.source_type || "repo";
    const isQuickScan = sourceEntries.length <= 2 && sourceEntries.every((e) => !e.notes);

    lines.push("");
    lines.push(`## ${source} (${sourceType})${isQuickScan ? " — Quick Scan" : ""}`);
    lines.push("");
    lines.push(
      "| Candidate | Type | Decision | Date | Novelty | Effort | Relevance | Extracted To | Notes |"
    );
    lines.push(
      "| --------- | ---- | -------- | ---- | ------- | ------ | --------- | ------------ | ----- |"
    );

    sourceEntries.sort((a, b) =>
      String(b.decision_date || "").localeCompare(String(a.decision_date || ""))
    );
    for (const entry of sourceEntries) {
      const row = [
        escapeCell(entry.candidate),
        entry.type || "-",
        entry.decision || "defer",
        entry.decision_date || "-",
        entry.novelty || "-",
        entry.effort || "-",
        entry.relevance || "-",
        entry.extracted_to || "-",
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

  try {
    safeWriteFileSync(OUTPUT_PATH, content, "utf8");
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
