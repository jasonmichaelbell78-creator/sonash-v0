#!/usr/bin/env node
/* global __dirname */
/**
 * Normalize all raw extractions to unified TDMS schema
 *
 * Reads: docs/technical-debt/raw/*.jsonl
 * Outputs: docs/technical-debt/raw/normalized-all.jsonl
 *
 * - Merges all raw extractions
 * - Applies final schema normalization
 * - Generates deterministic hashes for deduplication
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { glob } = require("glob");

const RAW_DIR = path.join(__dirname, "../../docs/technical-debt/raw");
const OUTPUT_FILE = path.join(RAW_DIR, "normalized-all.jsonl");

// Valid category values
const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
];

// Valid severity values
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];

// Valid type values
const VALID_TYPES = ["bug", "code-smell", "vulnerability", "hotspot", "tech-debt", "process-gap"];

// Valid status values
const VALID_STATUSES = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"];

// Valid effort values
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

// Generate deterministic content hash for deduplication
function generateContentHash(item) {
  // Normalize file path for hash (remove leading ./ or /)
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();

  // Create hash input from key fields
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// Normalize file path
function normalizeFilePath(filePath) {
  if (!filePath) return "";
  // Convert Windows backslashes to forward slashes for consistent hashing
  // Then remove leading ./ or /
  let normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
  // Remove org/repo prefix if present (e.g., "org_repo:path/to/file")
  // But preserve Windows drive letters (e.g., "C:\path\to\file")
  const colonIndex = normalized.indexOf(":");
  if (colonIndex > 0) {
    // Check if this looks like a Windows drive letter (single letter before colon)
    const beforeColon = normalized.substring(0, colonIndex);
    const isWindowsDrive = beforeColon.length === 1 && /^[A-Za-z]$/.test(beforeColon);
    if (!isWindowsDrive) {
      normalized = normalized.substring(colonIndex + 1);
    }
  }
  return normalized;
}

// Ensure value is in valid set
function ensureValid(value, validSet, defaultValue) {
  if (validSet.includes(value)) return value;
  return defaultValue;
}

// Final schema normalization
function normalizeItem(item) {
  const normalized = {
    // Required fields
    source_id: item.source_id || "unknown",
    source_file: item.source_file || "unknown",

    // Normalized fields
    category: ensureValid(item.category, VALID_CATEGORIES, "code-quality"),
    severity: ensureValid(item.severity, VALID_SEVERITIES, "S2"),
    type: ensureValid(item.type, VALID_TYPES, "code-smell"),
    file: normalizeFilePath(item.file),
    // Parse line numbers from strings (e.g., "123" -> 123), default to 0 for invalid
    line: (() => {
      const parsedLine =
        typeof item.line === "number"
          ? item.line
          : Number.parseInt(String(item.line), 10);
      return Number.isFinite(parsedLine) && parsedLine >= 0 ? parsedLine : 0;
    })(),
    title: (item.title || "Untitled").substring(0, 500),
    description: item.description || "",
    recommendation: item.recommendation || "",
    effort: ensureValid(item.effort, VALID_EFFORTS, "E1"),
    status: ensureValid(item.status, VALID_STATUSES, "NEW"),
    roadmap_ref: item.roadmap_ref || null,
    created: item.created || new Date().toISOString().split("T")[0],
    verified_by: item.verified_by || null,
    resolution: item.resolution || null,
  };

  // Generate content hash for deduplication
  normalized.content_hash = generateContentHash(normalized);

  // Preserve optional metadata if present
  if (item.original_id) normalized.original_id = item.original_id;
  if (item.rule) normalized.rule = item.rule;
  if (item.sonar_key) normalized.sonar_key = item.sonar_key;
  if (item.evidence && item.evidence.length > 0) normalized.evidence = item.evidence;
  if (item.sources && item.sources.length > 0) normalized.sources = item.sources;
  if (item.merged_from && item.merged_from.length > 0) normalized.merged_from = item.merged_from;
  if (item.pr_bucket) normalized.pr_bucket = item.pr_bucket;
  if (item.consensus_score) normalized.consensus_score = item.consensus_score;
  if (item.dependencies && item.dependencies.length > 0)
    normalized.dependencies = item.dependencies;
  if (item.roadmap_status) normalized.roadmap_status = item.roadmap_status;

  return normalized;
}

async function main() {
  console.log("🔄 Normalizing all raw extractions...\n");

  // Find all raw JSONL files (except normalized-all.jsonl itself)
  const pattern = path.join(RAW_DIR, "*.jsonl").replace(/\\/g, "/");
  const files = await glob(pattern, {
    ignore: ["**/normalized-all.jsonl"],
  });

  if (files.length === 0) {
    console.log("⚠️ No raw extraction files found. Run extract scripts first.");
    process.exit(1);
  }

  console.log(`  📂 Found ${files.length} raw extraction files\n`);

  const items = [];

  for (const file of files) {
    const fileName = path.basename(file);
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());

    let fileItemCount = 0;
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        const normalized = normalizeItem(item);
        items.push(normalized);
        fileItemCount++;
      } catch (err) {
        console.warn(`  ⚠️ Failed to parse line in ${fileName}: ${err.message}`);
      }
    }

    console.log(`  📄 ${fileName}: ${fileItemCount} items normalized`);
  }

  // Write output
  const outputLines = items.map((item) => JSON.stringify(item));
  fs.writeFileSync(OUTPUT_FILE, outputLines.join("\n") + "\n");

  console.log(`\n✅ Normalized ${items.length} total items to ${OUTPUT_FILE}`);

  // Summary stats
  console.log("\n📊 Summary Statistics:");

  const bySeverity = {};
  const byCategory = {};
  const byType = {};
  const bySource = {};

  for (const item of items) {
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byType[item.type] = (byType[item.type] || 0) + 1;

    const sourcePrefix = item.source_id.split(":")[0];
    bySource[sourcePrefix] = (bySource[sourcePrefix] || 0) + 1;
  }

  console.log("\n  By Severity:");
  for (const sev of VALID_SEVERITIES) {
    if (bySeverity[sev]) {
      console.log(`    ${sev}: ${bySeverity[sev]}`);
    }
  }

  console.log("\n  By Category:");
  for (const cat of Object.keys(byCategory).sort()) {
    console.log(`    ${cat}: ${byCategory[cat]}`);
  }

  console.log("\n  By Source:");
  for (const src of Object.keys(bySource).sort()) {
    console.log(`    ${src}: ${bySource[src]}`);
  }

  // Check for missing required fields
  let missingFile = 0;
  let missingLine = 0;
  for (const item of items) {
    if (!item.file) missingFile++;
    if (item.line === 0) missingLine++;
  }

  if (missingFile > 0 || missingLine > 0) {
    console.log("\n⚠️ Data Quality Notes:");
    if (missingFile > 0) console.log(`   ${missingFile} items missing file path`);
    if (missingLine > 0) console.log(`   ${missingLine} items missing line number`);
  }
}

main().catch(console.error);
