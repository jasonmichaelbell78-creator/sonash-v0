#!/usr/bin/env node
/**
 * Create canonical findings from aggregated NET NEW findings
 * Session #116
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NET_NEW_FILE = join(__dirname, "..", "docs/aggregation/net-new-findings.jsonl");
const MASTER_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS.jsonl");
const INDEX_FILE = join(__dirname, "..", "docs/audits/canonical/MASTER_FINDINGS_INDEX.md");
const ROADMAP_INTEGRATION = join(__dirname, "..", "docs/audits/canonical/ROADMAP_INTEGRATION.md");

// ROADMAP placement mapping
const ROADMAP_PLACEMENT = {
  code: { section: "M2.1 Code Quality", track: "Track D" },
  security: { section: "M4.5 Security & Privacy", track: "Track D-D5" },
  performance: { section: "Track P", track: "Performance Critical" },
  documentation: { section: "Track B", track: "B8 Document Sync" },
  process: { section: "Track D", track: "CI Reliability" },
  refactoring: { section: "M2.3-REF", track: "God Objects" },
  "engineering-productivity": { section: "Track E", track: "Solo Dev Automations" },
  dx: { section: "Track E", track: "Solo Dev Automations" },
};

// Read NET NEW findings
const netNew = readFileSync(NET_NEW_FILE, "utf-8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

console.log(`Processing ${netNew.length} NET NEW findings...`);

// Load existing canonical findings (if any) to avoid overwriting history
let existingCanonical = [];
if (existsSync(MASTER_FILE)) {
  try {
    const raw = readFileSync(MASTER_FILE, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    existingCanonical = lines.map((l, idx) => {
      try {
        return JSON.parse(l);
      } catch (e) {
        console.warn(`Warning: Invalid JSON at line ${idx + 1} in MASTER_FINDINGS.jsonl, skipping`);
        return null;
      }
    }).filter(Boolean);
  } catch (e) {
    console.warn(`Warning: Could not read existing MASTER_FINDINGS.jsonl: ${e.message}`);
    existingCanonical = [];
  }
}

// Build set of existing original_ids for deduplication
const existingOriginalIds = new Set(
  existingCanonical.map((f) => f.original_id).filter(Boolean)
);

// Get max CANON ID to continue numbering
let maxCanonId = 0;
for (const f of existingCanonical) {
  const match = String(f.id || "").match(/CANON-(\d+)/);
  if (match) maxCanonId = Math.max(maxCanonId, parseInt(match[1], 10));
}

// Filter out duplicates and assign canonical IDs
let canonId = maxCanonId + 1;
const newFindings = netNew
  .filter((f) => !f.original_id || !existingOriginalIds.has(f.original_id))
  .map((f) => {
    const placement = ROADMAP_PLACEMENT[f.category] || { section: "M2", track: "General" };
    const today = new Date().toISOString().split("T")[0];
    return {
      ...f,
      id: `CANON-${String(canonId++).padStart(4, "0")}`,
      roadmap_section: placement.section,
      roadmap_track: placement.track,
      status: "active",
      created: today,
      updated: today,
    };
  });

// Merge existing and new (append-only pattern)
const canonical = [...existingCanonical, ...newFindings];

// Write MASTER_FINDINGS.jsonl (merged)
writeFileSync(MASTER_FILE, canonical.map((f) => JSON.stringify(f)).join("\n") + "\n");
console.log(`Updated: ${MASTER_FILE} (+${newFindings.length} new, total ${canonical.length} findings)`);

// Group by severity and category for index
const bySeverity = { S0: [], S1: [], S2: [], S3: [] };
const byCategory = {};

canonical.forEach((f) => {
  if (bySeverity[f.severity]) bySeverity[f.severity].push(f);
  if (!byCategory[f.category]) byCategory[f.category] = [];
  byCategory[f.category].push(f);
});

// Generate MASTER_FINDINGS_INDEX.md
let index = `# Master Findings Index

> Generated: ${new Date().toISOString().split("T")[0]} | Session #116
> Total Findings: ${canonical.length}

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
    const placement = ROADMAP_PLACEMENT[cat] || { section: "M2" };
    index += `| ${cat} | ${items.length} | ${placement.section} |\n`;
  });

index += `\n---\n\n`;

// S0 Critical findings
if (bySeverity.S0.length > 0) {
  index += `## S0 Critical (${bySeverity.S0.length})\n\n`;
  bySeverity.S0.forEach((f) => {
    const fileInfo = f.line ? `\`${f.file}:${f.line}\`` : `\`${f.file}\``;
    index += `### ${f.id}: ${f.title}\n\n`;
    index += `- **File:** ${fileInfo}\n`;
    index += `- **Category:** ${f.category}\n`;
    index += `- **Effort:** ${f.effort || "TBD"}\n`;
    index += `- **ROADMAP:** ${f.roadmap_section}\n`;
    index += `- **Description:** ${(f.description || "").slice(0, 200)}...\n\n`;
  });
}

// S1 High findings
if (bySeverity.S1.length > 0) {
  index += `## S1 High (${bySeverity.S1.length})\n\n`;
  index += `| ID | Title | File | Category | Effort | ROADMAP |\n`;
  index += `|----|-------|------|----------|--------|--------|\n`;
  bySeverity.S1.forEach((f) => {
    const basename = f.file ? f.file.replace(/^.*\//, "") : "N/A";
    const fileInfo = f.line ? `${basename}:${f.line}` : basename;
    index += `| ${f.id} | ${(f.title || "").slice(0, 50)} | \`${fileInfo}\` | ${f.category} | ${f.effort || "TBD"} | ${f.roadmap_section} |\n`;
  });
  index += `\n`;
}

// S2 Medium findings (table format)
if (bySeverity.S2.length > 0) {
  index += `## S2 Medium (${bySeverity.S2.length})\n\n`;
  index += `| ID | Title | File | Category | ROADMAP |\n`;
  index += `|----|-------|------|----------|--------|\n`;
  bySeverity.S2.slice(0, 50).forEach((f) => {
    const basename = f.file ? f.file.replace(/^.*\//, "") : "N/A";
    const fileInfo = f.line ? `${basename}:${f.line}` : basename;
    index += `| ${f.id} | ${(f.title || "").slice(0, 40)} | \`${fileInfo}\` | ${f.category} | ${f.roadmap_section} |\n`;
  });
  if (bySeverity.S2.length > 50) {
    index += `\n*... and ${bySeverity.S2.length - 50} more S2 findings*\n`;
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

index += `---\n\n## Quick Reference\n\n`;
index += `- **Full details:** \`docs/audits/canonical/MASTER_FINDINGS.jsonl\`\n`;
index += `- **Procedures:** \`docs/AUDIT_FINDINGS_PROCEDURE.md\`\n`;
index += `- **ROADMAP integration:** \`docs/audits/canonical/ROADMAP_INTEGRATION.md\`\n`;

writeFileSync(INDEX_FILE, index);
console.log(`Created: ${INDEX_FILE}`);

// Generate ROADMAP_INTEGRATION.md
let roadmapIntegration = `# ROADMAP Integration Guide

> Generated: ${new Date().toISOString().split("T")[0]} | Session #116
> Total Findings to Integrate: ${canonical.length}

This document provides copy-paste ready sections for integrating findings into ROADMAP.md.

---

`;

// Group by ROADMAP section
const byRoadmap = {};
canonical.forEach((f) => {
  const section = f.roadmap_section || "M2 General";
  if (!byRoadmap[section]) byRoadmap[section] = [];
  byRoadmap[section].push(f);
});

Object.entries(byRoadmap)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([section, findings]) => {
    roadmapIntegration += `## ${section} (${findings.length} findings)\n\n`;

    // Group by severity within section
    const sectionBySeverity = { S0: [], S1: [], S2: [], S3: [] };
    findings.forEach((f) => {
      if (sectionBySeverity[f.severity]) sectionBySeverity[f.severity].push(f);
    });

    if (sectionBySeverity.S0.length + sectionBySeverity.S1.length > 0) {
      roadmapIntegration += `### Priority Items (S0/S1)\n\n`;
      [...sectionBySeverity.S0, ...sectionBySeverity.S1].forEach((f) => {
        const basename = f.file ? f.file.replace(/^.*\//, "") : "N/A";
        const fileInfo = f.line ? `${basename}:${f.line}` : basename;
        roadmapIntegration += `- [ ] **${f.id}:** ${(f.title || "").slice(0, 60)} \`${fileInfo}\` [${f.effort || "E1"}]\n`;
      });
      roadmapIntegration += `\n`;
    }

    if (sectionBySeverity.S2.length > 0) {
      roadmapIntegration += `### Backlog Items (S2)\n\n`;
      sectionBySeverity.S2.slice(0, 20).forEach((f) => {
        const basename = f.file ? f.file.replace(/^.*\//, "") : "N/A";
        const fileInfo = f.line ? `${basename}:${f.line}` : basename;
        roadmapIntegration += `- [ ] **${f.id}:** ${(f.title || "").slice(0, 60)} \`${fileInfo}\`\n`;
      });
      if (sectionBySeverity.S2.length > 20) {
        roadmapIntegration += `- ... and ${sectionBySeverity.S2.length - 20} more S2 items\n`;
      }
      roadmapIntegration += `\n`;
    }

    if (sectionBySeverity.S3.length > 0) {
      roadmapIntegration += `### Nice-to-Have (S3): ${sectionBySeverity.S3.length} items\n\n`;
      roadmapIntegration += `*See MASTER_FINDINGS.jsonl for full list*\n\n`;
    }

    roadmapIntegration += `---\n\n`;
  });

writeFileSync(ROADMAP_INTEGRATION, roadmapIntegration);
console.log(`Created: ${ROADMAP_INTEGRATION}`);

// Summary
console.log("\n=== Summary ===");
console.log(`S0 Critical: ${bySeverity.S0.length}`);
console.log(`S1 High: ${bySeverity.S1.length}`);
console.log(`S2 Medium: ${bySeverity.S2.length}`);
console.log(`S3 Low: ${bySeverity.S3.length}`);
console.log(`\nBy Category:`);
Object.entries(byCategory)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([cat, items]) => {
    console.log(`  ${cat}: ${items.length}`);
  });
