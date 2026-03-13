#!/usr/bin/env node
/**
 * generate-lifecycle-scores-md.js - Generate LIFECYCLE_SCORES.md from lifecycle-scores.jsonl
 *
 * Part of Data Effectiveness Audit (Wave 5.1)
 * Per SWS alignment: JSONL is canonical, markdown is generated. Never hand-edit the markdown.
 *
 * Usage:
 *   node scripts/generate-lifecycle-scores-md.js [--input FILE] [--output FILE] [--json]
 */

/* global __dirname */
const path = require("node:path");
const fs = require("node:fs");

// sanitizeError loaded for future error-handling use; prefixed to satisfy linter
let _sanitizeError;
try {
  ({ sanitizeError: _sanitizeError } = require(path.join(__dirname, "lib", "security-helpers.js")));
} catch {
  // regex patterns required for case-insensitive matching — replaceAll not applicable
  _sanitizeError = (e) =>
    (e instanceof Error ? e.message : String(e))
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]");
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_INPUT = path.join(PROJECT_ROOT, ".claude", "state", "lifecycle-scores.jsonl");
const DEFAULT_OUTPUT = path.join(
  PROJECT_ROOT,
  ".planning",
  "learnings-effectiveness-audit",
  "LIFECYCLE_SCORES.md"
);

// ---------------------------------------------------------------------------
// Read JSONL
// ---------------------------------------------------------------------------

function readJsonl(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const entries = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      console.warn(`[JSONL] Skipping corrupt line ${i + 1} in ${path.basename(filePath)}`);
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Generate markdown
// ---------------------------------------------------------------------------

function scoreEmoji(score) {
  if (score >= 10) return "A";
  if (score >= 8) return "B";
  if (score >= 6) return "C";
  if (score >= 4) return "D";
  return "F";
}

/**
 * Generate the summary table section.
 * @param {object[]} entries - All scored entries
 * @param {string} now - Current date string (YYYY-MM-DD)
 * @returns {string} Markdown for header + summary table
 */
function generateHeader(entries, now) {
  const totalSystems = entries.length;
  const avgScore =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.total, 0) / entries.length).toFixed(1)
      : "0.0";
  const belowThreshold = entries.filter((e) => e.total < 6).length;
  const actionGaps = entries.filter((e) => e.action < 2).length;
  const recallGaps = entries.filter((e) => e.recall < 2).length;
  const storageGaps = entries.filter((e) => e.storage < 2).length;

  return `# Lifecycle Scores — Data Effectiveness Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** ${now}
**Status:** ACTIVE
**Generated:** ${now}
**Source:** \`.claude/state/lifecycle-scores.jsonl\`
**Note:** AUTO-GENERATED — do not hand-edit
<!-- prettier-ignore-end -->

> Scoring: Capture/Storage/Recall/Action (0-3 each, 0-12 total).
> Systems below 6/12 are flagged for remediation.

---

## Summary

| Metric | Value |
|--------|-------|
| Total systems | ${totalSystems} |
| Average score | ${avgScore}/12 |
| Below threshold (<6) | ${belowThreshold} |
| Action gaps (Action < 2) | ${actionGaps} |
| Recall gaps (Recall < 2) | ${recallGaps} |
| Storage gaps (Storage < 2) | ${storageGaps} |

---

## All Systems (sorted by total score, worst first)

| System | Files | Cap | Sto | Rec | Act | Total | Grade | Gap |
|--------|-------|-----|-----|-----|-----|-------|-------|-----|
`;
}

/**
 * Generate the all-systems table rows.
 * @param {object[]} sorted - Entries sorted by total ascending
 * @returns {string} Markdown table rows
 */
function generateSystemsTable(sorted) {
  let md = "";
  for (const e of sorted) {
    const fileList = e.files.map((f) => `\`${path.basename(f)}\``).join(", ");
    const grade = scoreEmoji(e.total);
    const flag = e.total < 6 ? " **FLAG**" : "";
    md += `| ${e.system} | ${fileList} | ${e.capture} | ${e.storage} | ${e.recall} | ${e.action} | **${e.total}** | ${grade}${flag} | ${e.gap} |\n`;
  }
  return md;
}

/**
 * Generate the flagged systems section (total < 6).
 * @param {object[]} flagged - Entries with total < 6
 * @returns {string} Markdown section (empty string if no flagged systems)
 */
function generateFlaggedSection(flagged) {
  if (flagged.length === 0) return "";
  let md = `\n---\n\n## Flagged Systems (Total < 6)\n\n`;
  for (const e of flagged) {
    md += `### ${e.system} (${e.total}/12)\n\n`;
    md += `- **Category:** ${e.category}\n`;
    md += `- **Files:** ${e.files.join(", ")}\n`;
    md += `- **Gap:** ${e.gap}\n`;
    if (e.remediation) {
      md += `- **Remediation:** ${e.remediation}\n`;
    }
    if (e.wave_fixed) {
      md += `- **Wave fixed:** ${e.wave_fixed}\n`;
    }
    md += "\n";
  }
  return md;
}

/**
 * Generate the action gaps table section.
 * @param {object[]} systems - Entries with action < 2
 * @returns {string} Markdown section
 */
function generateActionGapsSection(systems) {
  if (systems.length === 0) return "";
  let md = `---\n\n## Action Gaps (Action < 2) — Priority for Wave 6\n\n`;
  md += `| System | Action Score | Gap | Remediation |\n`;
  md += `|--------|-------------|-----|-------------|\n`;
  for (const e of systems) {
    md += `| ${e.system} | ${e.action} | ${e.gap} | ${e.remediation || "Pending"} |\n`;
  }
  md += "\n";
  return md;
}

/**
 * Generate the recall gaps table section.
 * @param {object[]} systems - Entries with recall < 2
 * @returns {string} Markdown section
 */
function generateRecallGapsSection(systems) {
  if (systems.length === 0) return "";
  let md = `---\n\n## Recall Gaps (Recall < 2) — Priority for Wave 6\n\n`;
  md += `| System | Recall Score | Gap |\n`;
  md += `|--------|-------------|-----|\n`;
  for (const e of systems) {
    md += `| ${e.system} | ${e.recall} | ${e.gap} |\n`;
  }
  md += "\n";
  return md;
}

/**
 * Generate the wave improvements table section.
 * @param {object[]} entries - All entries (filtered internally for wave_fixed)
 * @returns {string} Markdown section
 */
function generateWaveImprovementsSection(entries) {
  const waveFixed = entries.filter((e) => e.wave_fixed);
  if (waveFixed.length === 0) return "";
  let md = `---\n\n## Wave Improvements Applied\n\n`;
  md += `| System | Wave | Remediation |\n`;
  md += `|--------|------|-------------|\n`;
  for (const e of waveFixed) {
    md += `| ${e.system} | ${e.wave_fixed} | ${e.remediation} |\n`;
  }
  md += "\n";
  return md;
}

function generateMarkdown(entries) {
  const now = new Date().toISOString().split("T")[0];
  const sorted = [...entries].sort((a, b) => a.total - b.total);

  let md = generateHeader(entries, now);
  md += generateSystemsTable(sorted);
  md += generateFlaggedSection(sorted.filter((e) => e.total < 6));
  md += generateActionGapsSection(sorted.filter((e) => e.action < 2));
  md += generateRecallGapsSection(sorted.filter((e) => e.recall < 2));
  md += generateWaveImprovementsSection(entries);

  return md;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function run(options = {}) {
  const inputPath = options.input || DEFAULT_INPUT;
  const outputPath = options.output || DEFAULT_OUTPUT;

  const entries = readJsonl(inputPath);
  if (entries.length === 0) {
    console.error("No entries found in lifecycle-scores.jsonl");
    return { success: false, entries: [] };
  }

  const md = generateMarkdown(entries);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, md, "utf-8");
  console.log(
    `Generated ${path.relative(PROJECT_ROOT, outputPath)} with ${entries.length} systems`
  );

  if (options.json) {
    const summary = {
      totalSystems: entries.length,
      avgScore: (entries.reduce((s, e) => s + e.total, 0) / entries.length).toFixed(1),
      belowThreshold: entries.filter((e) => e.total < 6).length,
      actionGaps: entries.filter((e) => e.action < 2).length,
      recallGaps: entries.filter((e) => e.recall < 2).length,
    };
    console.log(JSON.stringify(summary, null, 2));
  }

  return { success: true, entries };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");
  const json = args.includes("--json");

  const options = { json };
  if (inputIdx !== -1 && args[inputIdx + 1]) {
    options.input = args[inputIdx + 1];
  }
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.output = args[outputIdx + 1];
  }

  const result = run(options);
  if (!result.success) {
    process.exitCode = 1;
  }
}

module.exports = { run, readJsonl, generateMarkdown };
