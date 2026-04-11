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
const { safeParseLine } = require("./lib/parse-jsonl-line");

const ROOT = path.join(__dirname, "..");
const FINDINGS_PATH = path.join(ROOT, ".planning", "orphan-detection", "findings.jsonl");
const REPORT_PATH = path.join(ROOT, ".planning", "orphan-detection", "REPORT.md");

const CATEGORY_ORDER = [
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

function parseFindings() {
  let raw;
  try {
    raw = fs.readFileSync(FINDINGS_PATH, "utf8");
  } catch (err) {
    console.error(`Cannot read findings: ${sanitizeError(err)}`);
    console.error("Run 'npm run orphans:detect' first.");
    process.exit(1);
  }
  return raw.split("\n").map(safeParseLine).filter(Boolean);
}

function groupByCategory(findings) {
  const categories = {};
  const confOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  for (const f of findings) {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  }
  for (const cat of Object.values(categories)) {
    cat.sort((a, b) => (confOrder[a.confidence] || 9) - (confOrder[b.confidence] || 9));
  }
  return categories;
}

function buildSummaryTable(findings, categories) {
  const byConf = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) byConf[f.confidence] = (byConf[f.confidence] || 0) + 1;

  const lines = ["| Category | Count | HIGH | MEDIUM | LOW |", "| --- | --- | --- | --- | --- |"];
  for (const [cat, items] of Object.entries(categories)) {
    const h = items.filter((f) => f.confidence === "HIGH").length;
    const m = items.filter((f) => f.confidence === "MEDIUM").length;
    const l = items.filter((f) => f.confidence === "LOW").length;
    lines.push(`| ${cat} | ${items.length} | ${h} | ${m} | ${l} |`);
  }
  lines.push(
    `| **Total** | **${findings.length}** | **${byConf.HIGH}** | **${byConf.MEDIUM}** | **${byConf.LOW}** |`
  );
  return lines;
}

function buildDiffSection(findings) {
  let newCount = 0;
  let unchanged = 0;
  for (const f of findings) {
    if (f.diffStatus === "NEW") newCount++;
    else if (f.diffStatus === "UNCHANGED") unchanged++;
  }
  if (newCount === 0) return [];
  return [
    "## Changes Since Last Run",
    "",
    `- **New:** ${newCount}`,
    `- **Unchanged:** ${unchanged}`,
    "",
  ];
}

function buildCategorySection(cat, items) {
  const lines = [
    `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
    "",
    "| File | Confidence | Action | Reason | Last Modified |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const f of items) {
    const modified = f.daysSinceModified === null ? "n/a" : `${f.daysSinceModified}d ago`;
    const diff = f.diffStatus === "NEW" ? " **NEW**" : "";
    lines.push(
      `| ${f.file}${diff} | ${f.confidence} | ${f.proposedAction} | ${truncate(f.reason, 60)} | ${modified} |`
    );
  }
  lines.push("");
  return lines;
}

function truncate(str, max) {
  if (!str || str.length <= max) return str ?? "";
  return str.slice(0, max - 3) + "...";
}

function main() {
  const findings = parseFindings();
  if (findings.length === 0) {
    console.log("No findings to report.");
    return;
  }

  const categories = groupByCategory(findings);
  const lines = [
    "# Orphan Detection Report",
    "",
    `**Generated:** ${new Date().toISOString().split("T")[0]}`,
    `**Total findings:** ${findings.length}`,
    "",
    "## Summary",
    "",
    ...buildSummaryTable(findings, categories),
    "",
    ...buildDiffSection(findings),
  ];

  for (const cat of CATEGORY_ORDER) {
    if (categories[cat]?.length > 0) {
      lines.push(...buildCategorySection(cat, categories[cat]));
    }
  }

  safeWriteFileSync(REPORT_PATH, lines.join("\n"), { allowOverwrite: true });
  console.log(`Report written to: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`${findings.length} findings across ${Object.keys(categories).length} categories`);
}

main();
