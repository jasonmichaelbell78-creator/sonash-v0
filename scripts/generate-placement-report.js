#!/usr/bin/env node
/**
 * Generate roadmap placement suggestions for NET NEW findings
 * Session #116
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NET_NEW_FILE = join(__dirname, "..", "docs/aggregation/net-new-findings.jsonl");
const OUTPUT_FILE = join(__dirname, "..", "docs/aggregation/NET_NEW_ROADMAP_PLACEMENT.md");

// Get NET NEW findings with safe JSONL parsing and empty file handling
const raw = readFileSync(NET_NEW_FILE, "utf-8");
const trimmedRaw = raw.trim();

// Handle empty or whitespace-only file
if (!trimmedRaw) {
  console.log(`No NET NEW findings in: ${NET_NEW_FILE}`);
  process.exit(0);
}

const lines = trimmedRaw.split("\n").filter(Boolean);
const netNew = [];

for (let i = 0; i < lines.length; i++) {
  try {
    netNew.push(JSON.parse(lines[i]));
  } catch (err) {
    throw new Error(`Invalid JSONL in ${NET_NEW_FILE} at line ${i + 1}: ${err.message}`);
  }
}

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

  // Group by suggested roadmap placement (use Map to prevent prototype pollution)
  const byPlacement = new Map();
  items.forEach((f) => {
    const placement = ROADMAP_PLACEMENT[f.category] || "M2 (General Backlog)";
    const existing = byPlacement.get(placement);
    if (existing) {
      existing.push(f);
    } else {
      byPlacement.set(placement, [f]);
    }
  });

  for (const [placement, findings] of byPlacement.entries()) {
    output += `### → ${placement}\n\n`;
    findings.slice(0, 8).forEach((f) => {
      // Harden against malformed finding fields
      const fileStr = typeof f.file === "string" ? f.file : "";
      const basename = fileStr ? fileStr.replace(/^.*\//, "") : "N/A";

      const lineNum = Number.isFinite(f.line) && f.line > 0 ? f.line : null;
      const fileInfo = lineNum ? `${basename}:${lineNum}` : basename;

      const title = typeof f.title === "string" ? f.title : "";
      const titleShort = title.length > 70 ? `${title.slice(0, 70)}...` : title;

      output += `- **${f.original_id}**: ${titleShort}\n`;
      output += `  - File: \`${fileInfo}\` | Effort: ${f.effort || "TBD"}\n`;
    });
    if (findings.length > 8) {
      output += `  - ... and ${findings.length - 8} more\n`;
    }
    output += "\n";
  }
});

// Summary by category
output += `---

## Summary by Category

| Category | Count | Suggested ROADMAP Location |
|----------|-------|---------------------------|
`;

// Use Map to prevent prototype pollution from external data
const byCategory = new Map();
netNew.forEach((f) => {
  const key = f.category;
  byCategory.set(key, (byCategory.get(key) || 0) + 1);
});

Array.from(byCategory.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const placement = ROADMAP_PLACEMENT[cat] || "M2 (General Backlog)";
    output += `| ${cat} | ${count} | ${placement} |\n`;
  });

// Ensure output directory exists (fresh clone / CI)
const outDir = dirname(OUTPUT_FILE);
try {
  mkdirSync(outDir, { recursive: true });
} catch {
  // If mkdir fails, let the subsequent write throw a clearer error
}

writeFileSync(OUTPUT_FILE, output);
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`Total NET NEW: ${netNew.length}`);
