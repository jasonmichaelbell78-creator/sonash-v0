#!/usr/bin/env node
/**
 * Regenerate MASTER_FINDINGS_INDEX.md from MASTER_FINDINGS.jsonl
 * Session #116
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS.jsonl");
const INDEX_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS_INDEX.md");

// Read findings
const findings = readFileSync(MASTER_FILE, "utf-8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

console.log(`Processing ${findings.length} findings...`);

// Group by severity and category
const bySeverity = { S0: [], S1: [], S2: [], S3: [] };
const byCategory = {};

findings.forEach((f) => {
  if (bySeverity[f.severity]) bySeverity[f.severity].push(f);
  if (!byCategory[f.category]) byCategory[f.category] = [];
  byCategory[f.category].push(f);
});

// Placement mapping
const ROADMAP_PLACEMENT = {
  code: "M2.1 Code Quality",
  security: "M4.5 Security & Privacy",
  performance: "Track P",
  documentation: "Track B",
  process: "Track D",
  refactoring: "M2.3-REF",
  "engineering-productivity": "Track E",
};

// Generate index
let index = `# Master Findings Index

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Generated: 2026-01-30 | Session #116 | Total Findings: ${findings.length}
> Includes: 172 Session #116 findings + 31 legacy findings (DEDUP, EFF, PERF, M2.3-REF, M4.5-SEC)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| S0 Critical | ${bySeverity.S0.length} | Immediate fix required |
| S1 High | ${bySeverity.S1.length} | Fix before next release |
| S2 Medium | ${bySeverity.S2.length} | Fix when convenient |
| S3 Low | ${bySeverity.S3.length} | Nice to have |

| Category | Count | ROADMAP Section |
|----------|-------|-----------------|
`;

Object.entries(byCategory)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([cat, items]) => {
    const placement = ROADMAP_PLACEMENT[cat] || "M2";
    index += `| ${cat} | ${items.length} | ${placement} |\n`;
  });

index += `\n---\n\n`;

// S0 Critical findings (detailed)
if (bySeverity.S0.length > 0) {
  index += `## S0 Critical (${bySeverity.S0.length})\n\n`;
  bySeverity.S0.forEach((f) => {
    const fileInfo = f.line && f.line !== 1 ? `\`${f.file}:${f.line}\`` : `\`${f.file}\``;
    index += `### ${f.id}: ${f.title}\n\n`;
    index += `- **Original ID:** ${f.original_id || "N/A"}\n`;
    index += `- **File:** ${fileInfo}\n`;
    index += `- **Category:** ${f.category}\n`;
    index += `- **Effort:** ${f.effort || "TBD"}\n`;
    index += `- **ROADMAP:** ${f.roadmap_section || f.roadmap_track}\n`;
    index += `- **Description:** ${(f.description || "").slice(0, 300)}${f.description && f.description.length > 300 ? "..." : ""}\n\n`;
  });
}

// S1 High findings (table)
if (bySeverity.S1.length > 0) {
  index += `## S1 High (${bySeverity.S1.length})\n\n`;
  index += `| ID | Original | Title | File | Category | ROADMAP |\n`;
  index += `|----|----------|-------|------|----------|--------|\n`;
  bySeverity.S1.forEach((f) => {
    const basename = f.file ? f.file.replace(/^.*\//, "").slice(0, 25) : "N/A";
    const fileInfo = f.line && f.line !== 1 ? `${basename}:${f.line}` : basename;
    const origId = f.original_id || "-";
    index += `| ${f.id} | ${origId} | ${(f.title || "").slice(0, 45)} | \`${fileInfo}\` | ${f.category} | ${f.roadmap_section || f.roadmap_track || "-"} |\n`;
  });
  index += `\n`;
}

// S2 Medium findings (table, limited)
if (bySeverity.S2.length > 0) {
  index += `## S2 Medium (${bySeverity.S2.length})\n\n`;
  index += `| ID | Original | Title | File | Category |\n`;
  index += `|----|----------|-------|------|----------|\n`;
  bySeverity.S2.slice(0, 40).forEach((f) => {
    const basename = f.file ? f.file.replace(/^.*\//, "").slice(0, 20) : "N/A";
    const origId = f.original_id || "-";
    index += `| ${f.id} | ${origId} | ${(f.title || "").slice(0, 40)} | \`${basename}\` | ${f.category} |\n`;
  });
  if (bySeverity.S2.length > 40) {
    index += `\n*... and ${bySeverity.S2.length - 40} more S2 findings*\n`;
  }
  index += `\n`;
}

// S3 Low findings (summary only)
if (bySeverity.S3.length > 0) {
  index += `## S3 Low (${bySeverity.S3.length})\n\n`;
  index += `S3 findings are tracked in MASTER_FINDINGS.jsonl but not listed here individually.\n\n`;
  index += `| Category | Count |\n`;
  index += `|----------|-------|\n`;
  const s3ByCat = {};
  bySeverity.S3.forEach((f) => {
    s3ByCat[f.category] = (s3ByCat[f.category] || 0) + 1;
  });
  Object.entries(s3ByCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      index += `| ${cat} | ${count} |\n`;
    });
  index += `\n`;
}

// Legacy ID cross-reference
index += `---\n\n## Legacy ID Cross-Reference\n\n`;
index += `The following legacy IDs have been migrated to canonical CANON IDs:\n\n`;
index += `| Legacy ID | Canonical ID | Title |\n`;
index += `|-----------|--------------|-------|\n`;

findings
  .filter((f) => f.original_id && !f.original_id.startsWith("CANON-") && f.original_id !== f.id)
  .sort((a, b) => (a.original_id || "").localeCompare(b.original_id || ""))
  .forEach((f) => {
    index += `| ${f.original_id} | ${f.id} | ${(f.title || "").slice(0, 40)} |\n`;
  });

index += `\n---\n\n## Quick Reference\n\n`;
index += `- **Full details:** \`docs/audits/canonical/MASTER_FINDINGS.jsonl\`\n`;
index += `- **Procedures:** \`docs/AUDIT_FINDINGS_PROCEDURE.md\`\n`;
index += `- **ROADMAP integration:** \`docs/audits/canonical/ROADMAP_INTEGRATION.md\`\n`;
index += `- **Legacy ID mapping:** \`docs/audits/canonical/LEGACY_ID_MAPPING.json\`\n`;

writeFileSync(INDEX_FILE, index);
console.log(`Updated: ${INDEX_FILE}`);
