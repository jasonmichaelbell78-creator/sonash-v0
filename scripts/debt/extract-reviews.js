#!/usr/bin/env node
/* global __dirname */
/**
 * Extract review and aggregation findings to TDMS raw format
 *
 * Reads: docs/reviews/**\/*.jsonl, docs/aggregation/*.jsonl
 * Outputs: docs/technical-debt/raw/reviews.jsonl
 *
 * Handles:
 * - 2026-Q1 canonical CANON-* files
 * - Aggregation MASTER_ISSUE_LIST
 * - Net-new findings
 */

const fs = require("node:fs");
const path = require("node:path");
const { glob } = require("glob");

const REVIEWS_DIR = path.join(__dirname, "../../docs/reviews");
const AGGREGATION_DIR = path.join(__dirname, "../../docs/aggregation");
const OUTPUT_FILE = path.join(__dirname, "../../docs/technical-debt/raw/reviews.jsonl");

// Category normalization
const CATEGORY_MAP = {
  code: "code-quality",
  security: "security",
  performance: "performance",
  documentation: "documentation",
  process: "process",
  refactoring: "refactoring",
  perf: "performance",
  docs: "documentation",
  "code-quality": "code-quality",
  "Hygiene/Duplication": "code-quality",
  "Types/Correctness": "code-quality",
  Testing: "code-quality",
  "Next/React Boundaries": "code-quality",
  Security: "security",
};

function normalizeCategory(cat) {
  if (!cat) return "code-quality";
  const normalized = CATEGORY_MAP[cat];
  if (normalized) return normalized;
  const lower = cat.toLowerCase();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  return "code-quality";
}

function extractFile(item) {
  if (item.file && typeof item.file === "string") return item.file;
  if (item.files && Array.isArray(item.files) && item.files.length > 0) {
    return item.files[0];
  }
  return "";
}

function extractLine(item) {
  if (typeof item.line === "number") return item.line;
  if (typeof item.line === "string") return Number.parseInt(item.line, 10) || 0;
  return 0;
}

function getSourceId(item, sourceFile) {
  const id = item.id || item.canonical_id || item.master_id || item.original_id || item.finding_id;
  if (id) {
    return `review:${id}`;
  }
  // Use base64url for URL-safe IDs (no +, /, = characters)
  const hash = Buffer.from(`${item.title}:${extractFile(item)}:${extractLine(item)}`)
    .toString("base64url")
    .substring(0, 12);
  return `review:hash-${hash}`;
}

function normalizeEffort(effort) {
  if (!effort) return "E1";
  // Use anchored regex to prevent partial matches like "E10" or "XE1Y"
  if (/^E[0-3]$/.test(String(effort))) return effort;
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

function determineType(item) {
  const cat = (item.category || "").toLowerCase();
  if (cat.includes("security")) return "vulnerability";
  if (cat.includes("bug") || item.type === "BUG") return "bug";
  if (cat.includes("process")) return "process-gap";
  if (cat.includes("documentation")) return "tech-debt";
  return "code-smell";
}

function processReviewItem(item, sourceFile) {
  const relSourceFile = path.relative(path.join(__dirname, "../.."), sourceFile);

  return {
    source_id: getSourceId(item, relSourceFile),
    source_file: relSourceFile,
    original_id: item.id || item.canonical_id || item.master_id || null,
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
    roadmap_ref: item.roadmap_ref || item.roadmap_section || item.matched_roadmap_item || null,
    roadmap_status: item.roadmap_status || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: item.verified || item.verified_by || null,
    resolution: null,
    evidence: item.evidence || [],
    sources: item.sources || [],
    merged_from: item.merged_from || [],
    pr_bucket: item.pr_bucket || item.pr_bucket_suggestion || null,
    consensus_score: item.consensus_score || null,
    dependencies: item.dependencies || [],
  };
}

async function main() {
  console.log("🔍 Extracting review and aggregation findings...\n");

  const items = [];
  const seenIds = new Set();

  // Find review JSONL files
  const reviewPattern = path.join(REVIEWS_DIR, "**/*.jsonl").replace(/\\/g, "/");
  const reviewFiles = await glob(reviewPattern);

  console.log(`  📂 Found ${reviewFiles.length} review files\n`);

  for (const file of reviewFiles) {
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
        const processed = processReviewItem(item, file);

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

  // Find aggregation JSONL files
  const aggregationPattern = path.join(AGGREGATION_DIR, "*.jsonl").replace(/\\/g, "/");
  const aggregationFiles = await glob(aggregationPattern, {
    ignore: ["**/dedup-log.jsonl", "**/crossref-log.jsonl"],
  });

  console.log(`\n  📂 Found ${aggregationFiles.length} aggregation files\n`);

  for (const file of aggregationFiles) {
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
        const processed = processReviewItem(item, file);

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
  fs.writeFileSync(OUTPUT_FILE, outputLines.join("\n") + "\n");

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

const { sanitizeError } = require("../lib/security-helpers.js");

main().catch((err) => {
  console.error("Fatal error:", sanitizeError(err));
  process.exit(1);
});
