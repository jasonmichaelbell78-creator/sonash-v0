#!/usr/bin/env node
/* global __dirname */
/**
 * Extract audit findings to TDMS raw format
 *
 * Reads: docs/audits/**\/*.jsonl (excluding FALSE_POSITIVES.jsonl)
 * Outputs: docs/technical-debt/raw/audits.jsonl
 *
 * Handles multiple audit formats:
 * - Single-session audits (CODE-*, SEC-*, etc.)
 * - Multi-AI audits
 * - Canonical MASTER_FINDINGS (CANON-*)
 */

const fs = require("node:fs");
const path = require("node:path");
const { glob } = require("glob");

const normalizeCategory = require("../lib/normalize-category");
const { safeWriteFileSync } = require("../lib/safe-fs");

const AUDITS_DIR = path.join(__dirname, "../../docs/audits");
const OUTPUT_FILE = path.join(__dirname, "../../docs/technical-debt/raw/audits.jsonl");

// Extract primary file from various fields
function extractFile(item) {
  if (item.file && typeof item.file === "string") return item.file;
  if (item.files && Array.isArray(item.files) && item.files.length > 0) {
    return item.files[0];
  }
  return "";
}

// Extract line number
function extractLine(item) {
  if (typeof item.line === "number") return item.line;
  if (typeof item.line === "string") return Number.parseInt(item.line, 10) || 0;
  return 0;
}

// Get source ID
function getSourceId(item, sourceFile) {
  // Try various ID fields
  const id = item.id || item.canonical_id || item.master_id || item.original_id || item.finding_id;
  if (id) {
    return `audit:${id}`;
  }
  // Generate from hash - use base64url for URL-safe IDs (no +, /, = characters)
  const hash = Buffer.from(`${item.title}:${extractFile(item)}:${extractLine(item)}`)
    .toString("base64url")
    .substring(0, 12);
  return `audit:hash-${hash}`;
}

// Map effort strings
function normalizeEffort(effort) {
  if (!effort) return "E1";
  // Use anchored regex to prevent partial matches like "E10" or "XE1Y"
  if (/^E[0-3]$/.test(String(effort))) return effort;
  // Try to parse
  const map = {
    trivial: "E0",
    easy: "E0",
    small: "E0",
    medium: "E1",
    moderate: "E1",
    large: "E2",
    complex: "E2",
    "very large": "E3",
    "very complex": "E3",
  };
  const lower = effort.toLowerCase();
  if (map[lower]) return map[lower];
  return "E1";
}

// Map severity
function normalizeSeverity(severity) {
  if (!severity) return "S2";
  // Use anchored regex to prevent partial matches like "S10" or "XS1Y"
  if (/^S[0-3]$/.test(String(severity))) return severity;
  const map = {
    critical: "S0",
    blocker: "S0",
    high: "S1",
    major: "S1",
    medium: "S2",
    moderate: "S2",
    low: "S3",
    minor: "S3",
    info: "S3",
    trivial: "S3",
  };
  const lower = severity.toLowerCase();
  if (map[lower]) return map[lower];
  return "S2";
}

// Determine type from category and context
function determineType(item) {
  const cat = (item.category || "").toLowerCase();
  if (cat.includes("security")) return "vulnerability";
  if (cat.includes("bug") || item.type === "BUG") return "bug";
  if (cat.includes("process")) return "process-gap";
  if (cat.includes("documentation")) return "tech-debt";
  return "code-smell";
}

function processAuditItem(item, sourceFile) {
  const relSourceFile = path.relative(path.join(__dirname, "../.."), sourceFile);

  return {
    source_id: getSourceId(item, relSourceFile),
    source_file: relSourceFile,
    original_id: item.id || item.canonical_id || item.original_id || null,
    category: normalizeCategory(item.category),
    severity: normalizeSeverity(item.severity),
    type: determineType(item),
    file: extractFile(item),
    line: extractLine(item),
    title: item.title || item.message || "Untitled finding",
    description:
      item.description || item.why_it_matters || item.recommendation || item.message || "",
    recommendation: item.recommendation || item.suggested_fix || "",
    effort: normalizeEffort(item.effort),
    status: "NEW",
    roadmap_ref: item.roadmap_ref || item.roadmap_section || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: item.verified || item.verified_by || null,
    resolution: null,
    // Preserve useful metadata
    evidence: item.evidence || [],
    sources: item.sources || [],
    merged_from: item.merged_from || [],
  };
}

async function main() {
  console.log("🔍 Extracting audit findings...\n");

  // Find all JSONL files, excluding FALSE_POSITIVES
  const pattern = path.join(AUDITS_DIR, "**/*.jsonl").replace(/\\/g, "/");
  const files = await glob(pattern, {
    ignore: ["**/FALSE_POSITIVES.jsonl"],
  });

  console.log(`  📂 Found ${files.length} audit files\n`);

  const items = [];
  const seenIds = new Set();

  for (const file of files) {
    const relPath = path.relative(path.join(__dirname, "../.."), file);
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠️ Failed to read ${relPath}: ${errMsg}`);
      continue;
    }
    const lines = content.split("\n").filter((line) => line.trim());

    let fileItemCount = 0;
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        const processed = processAuditItem(item, file);

        // Skip duplicates within extraction
        if (seenIds.has(processed.source_id)) {
          continue;
        }
        seenIds.add(processed.source_id);

        items.push(processed);
        fileItemCount++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠️ Failed to parse line in ${relPath}: ${errMsg}`);
      }
    }

    if (fileItemCount > 0) {
      console.log(`  📄 ${relPath}: ${fileItemCount} items`);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSONL output
  const outputLines = items.map((item) => JSON.stringify(item));
  safeWriteFileSync(OUTPUT_FILE, outputLines.join("\n") + "\n");

  console.log(`\n✅ Extracted ${items.length} unique items to ${OUTPUT_FILE}`);

  // Summary by severity
  const bySeverity = {};
  for (const item of items) {
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  }
  console.log("\n📈 Summary by severity:");
  for (const sev of ["S0", "S1", "S2", "S3"]) {
    if (bySeverity[sev]) {
      console.log(`   ${sev}: ${bySeverity[sev]}`);
    }
  }

  // Summary by category
  const byCategory = {};
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  }
  console.log("\n📂 Summary by category:");
  for (const cat of Object.keys(byCategory).sort()) {
    console.log(`   ${cat}: ${byCategory[cat]}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
