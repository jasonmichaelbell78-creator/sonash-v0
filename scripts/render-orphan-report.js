#!/usr/bin/env node
/**
 * Orphan Report Renderer
 *
 * Reads findings.jsonl and generates a Markdown report grouped by category.
 *
 * Usage: node scripts/render-orphan-report.js
 *
 * Output: .planning/orphan-detection/REPORT.md
 */
/* global __dirname */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("./lib/sanitize-error.js");
const { safeWriteFileSync } = require("./lib/safe-fs.js");

const ROOT = path.resolve(__dirname, "..");
const FINDINGS_PATH = path.join(ROOT, ".planning", "orphan-detection", "findings.jsonl");
const REPORT_PATH = path.join(ROOT, ".planning", "orphan-detection", "REPORT.md");

function main() {
  let raw;
  try {
    raw = fs.readFileSync(FINDINGS_PATH, "utf8");
  } catch (err) {
    console.error(`Cannot read findings: ${sanitizeError(err)}`);
    console.error("Run 'npm run orphans:detect' first.");
    process.exit(1);
  }

  const findings = raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (findings.length === 0) {
    console.log("No findings to report.");
    return;
  }

  // Group by category
  const categories = {};
  for (const f of findings) {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  }

  // Sort within each category: HIGH first, then MEDIUM, then LOW
  const confOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  for (const cat of Object.values(categories)) {
    cat.sort((a, b) => (confOrder[a.confidence] || 9) - (confOrder[b.confidence] || 9));
  }

  // Summary stats
  const byConfidence = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) {
    byConfidence[f.confidence] = (byConfidence[f.confidence] || 0) + 1;
  }

  // Diff stats
  const diffCounts = { NEW: 0, RESOLVED: 0, UNCHANGED: 0 };
  for (const f of findings) {
    if (f.diffStatus) diffCounts[f.diffStatus] = (diffCounts[f.diffStatus] || 0) + 1;
  }

  // Build report
  const lines = [];
  lines.push("# Orphan Detection Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString().split("T")[0]}`);
  lines.push(`**Total findings:** ${findings.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Category | Count | HIGH | MEDIUM | LOW |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const [cat, items] of Object.entries(categories)) {
    const h = items.filter((f) => f.confidence === "HIGH").length;
    const m = items.filter((f) => f.confidence === "MEDIUM").length;
    const l = items.filter((f) => f.confidence === "LOW").length;
    lines.push(`| ${cat} | ${items.length} | ${h} | ${m} | ${l} |`);
  }
  lines.push(
    `| **Total** | **${findings.length}** | **${byConfidence.HIGH}** | **${byConfidence.MEDIUM}** | **${byConfidence.LOW}** |`
  );
  lines.push("");

  if (diffCounts.NEW > 0 || diffCounts.RESOLVED > 0) {
    lines.push("## Changes Since Last Run");
    lines.push("");
    lines.push(`- **New:** ${diffCounts.NEW}`);
    lines.push(`- **Resolved:** ${diffCounts.RESOLVED}`);
    lines.push(`- **Unchanged:** ${diffCounts.UNCHANGED}`);
    lines.push("");
  }

  // Category sections
  const categoryOrder = [
    "scripts",
    "workflows",
    "hooks",
    "state-files",
    "agents",
    "skills",
    "docs",
    "planning",
    "research",
  ];
  for (const cat of categoryOrder) {
    const items = categories[cat];
    if (!items || items.length === 0) continue;

    lines.push(`## ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    lines.push("");
    lines.push("| File | Confidence | Action | Reason | Last Modified |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const f of items) {
      const modified = f.daysSinceModified !== null ? `${f.daysSinceModified}d ago` : "n/a";
      const diff = f.diffStatus === "NEW" ? " **NEW**" : "";
      lines.push(
        `| ${f.file}${diff} | ${f.confidence} | ${f.proposedAction} | ${truncate(f.reason, 60)} | ${modified} |`
      );
    }
    lines.push("");
  }

  const report = lines.join("\n");
  safeWriteFileSync(REPORT_PATH, report, { allowOverwrite: true });
  console.log(`Report written to: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`${findings.length} findings across ${Object.keys(categories).length} categories`);
}

function truncate(str, max) {
  if (!str || str.length <= max) return str ?? "";
  return str.slice(0, max - 3) + "...";
}

main();
