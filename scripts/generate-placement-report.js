#!/usr/bin/env node
/**
 * Generate roadmap placement suggestions for NET NEW findings
 * Session #116
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NET_NEW_FILE = join(__dirname, "..", "docs/aggregation/net-new-findings.jsonl");
const OUTPUT_FILE = join(__dirname, "..", "docs/aggregation/NET_NEW_ROADMAP_PLACEMENT.md");

// Get NET NEW findings
const netNew = readFileSync(NET_NEW_FILE, "utf-8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

// Categorize by severity
const byPriority = {
  "S0-Critical": [],
  "S1-High": [],
  "S2-Medium": [],
  "S3-Low": [],
};

netNew.forEach((f) => {
  const key =
    f.severity === "S0"
      ? "S0-Critical"
      : f.severity === "S1"
        ? "S1-High"
        : f.severity === "S2"
          ? "S2-Medium"
          : "S3-Low";
  if (byPriority[key]) byPriority[key].push(f);
});

// Roadmap placement mapping based on category
const ROADMAP_PLACEMENT = {
  code: "M2 - Code Quality / Track D (CI Reliability)",
  security: "M4.5 - Security Enhancements / Track D-D5",
  performance: "Track P - Performance Critical",
  documentation: "Track B-B8 (Document Sync Tab) / M2 Docs",
  process: "Track D - CI Reliability / Track E (Solo Dev)",
  refactoring: "M2.3-REF (God Objects) / M2 Architecture",
  "engineering-productivity": "Track E - Solo Developer Automations",
  dx: "Track E - Solo Developer Automations",
};

let output = `# NET NEW Findings - Roadmap Placement Suggestions

> Generated: ${new Date().toISOString().split("T")[0]} | Session #116
> Total NET NEW findings: ${netNew.length}

---

`;

["S0-Critical", "S1-High", "S2-Medium", "S3-Low"].forEach((priority) => {
  const items = byPriority[priority];
  if (items.length === 0) return;

  output += `## ${priority} (${items.length} findings)\n\n`;

  // Group by suggested roadmap placement
  const byPlacement = {};
  items.forEach((f) => {
    const placement = ROADMAP_PLACEMENT[f.category] || "M2 (General Backlog)";
    if (byPlacement[placement] === undefined) byPlacement[placement] = [];
    byPlacement[placement].push(f);
  });

  Object.entries(byPlacement).forEach(([placement, findings]) => {
    output += `### → ${placement}\n\n`;
    findings.slice(0, 8).forEach((f) => {
      const basename = f.file ? f.file.replace(/^.*\//, "") : "N/A";
      const fileInfo = f.line ? `${basename}:${f.line}` : basename;
      output += `- **${f.original_id}**: ${(f.title || "").slice(0, 70)}...\n`;
      output += `  - File: \`${fileInfo}\` | Effort: ${f.effort || "TBD"}\n`;
    });
    if (findings.length > 8) {
      output += `  - ... and ${findings.length - 8} more\n`;
    }
    output += "\n";
  });
});

// Summary by category
output += `---

## Summary by Category

| Category | Count | Suggested ROADMAP Location |
|----------|-------|---------------------------|
`;

const byCategory = {};
netNew.forEach((f) => {
  byCategory[f.category] = (byCategory[f.category] || 0) + 1;
});

Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const placement = ROADMAP_PLACEMENT[cat] || "M2 (General Backlog)";
    output += `| ${cat} | ${count} | ${placement} |\n`;
  });

writeFileSync(OUTPUT_FILE, output);
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`Total NET NEW: ${netNew.length}`);
