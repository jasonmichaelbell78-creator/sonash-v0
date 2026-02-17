#!/usr/bin/env node
/* global __dirname */
/**
 * Intake script for audit-generated technical debt
 *
 * Usage: node scripts/debt/intake-audit.js <audit-output.jsonl>
 *
 * Process:
 * 1. Validates input file schema
 * 2. Maps Doc Standards JSONL format to TDMS format (if detected)
 * 3. Checks for exact hash duplicates against MASTER_DEBT.jsonl
 * 4. Assigns DEBT-XXXX IDs to new items
 * 5. Appends to raw pipeline files (normalized-all.jsonl + deduped.jsonl)
 * 6. Runs multi-pass dedup (parametric, near, semantic, cross-source, systemic)
 * 7. Regenerates views
 * 8. Assigns roadmap references (category + file path mapping)
 * 9. Logs intake activity (including confidence values from Doc Standards)
 *
 * Supports three input formats:
 * - TDMS format (native): Uses fields like source_id, file, description, recommendation
 * - Doc Standards format: Uses fields like fingerprint, files[], why_it_matters, suggested_fix
 * - Enhancement audit format: Uses IMS fields like counter_argument, confidence, current_approach
 *
 * Doc Standards → TDMS field mapping (automatic):
 *   fingerprint      → source_id (converted: category::file::id → audit:category-file-id)
 *   files[0]         → file (first path extracted, with optional :line extraction)
 *   why_it_matters   → description
 *   suggested_fix    → recommendation
 *   acceptance_tests → evidence (appended with [Acceptance] prefix)
 *   confidence       → logged to intake-log.jsonl (not stored in MASTER_DEBT)
 *
 * Enhancement audit → TDMS field mapping (automatic):
 *   impact           → severity (I0→S1, I1→S2, I2→S2, I3→S3)
 *   IMS category     → subcategory (preserved as metadata)
 *   counter_argument → preserved (honesty guard)
 *   confidence       → preserved + logged
 *   current_approach → preserved
 *   proposed_outcome → preserved
 *   why_it_matters   → description (if not present)
 *   Sets: category="enhancements", type="enhancement"
 *
 * See: docs/templates/JSONL_SCHEMA_STANDARD.md for field mapping documentation
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

// Prototype pollution protection - filter dangerous keys from untrusted objects
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function safeCloneObject(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

const { loadConfig } = require("../config/load-config");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");

// Valid schema values — single source of truth: scripts/config/audit-schema.json
let schema;
try {
  schema = loadConfig("audit-schema");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load audit-schema config: ${msg}`);
  process.exit(2);
}
const VALID_CATEGORIES = schema.validCategories;
const VALID_SEVERITIES = schema.validSeverities;
const VALID_TYPES = schema.validTypes;
const VALID_STATUSES = schema.validStatuses;
const VALID_EFFORTS = schema.validEfforts;

// Generate content hash for deduplication
function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
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
  // Remove leading ./ and all leading slashes
  let normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
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

// Map first file entry from files[] array to file field (shared by both format mappers)
function mapFirstFileToFile(firstFile, item, mapped, metadata) {
  if (typeof firstFile !== "string") {
    // Skip non-string: avoid creating invalid paths like "[object Object]"
    metadata.mappings_applied.push("files[0]→file(skipped_non_string)");
    return;
  }
  const lineMatch = firstFile.match(/^(.+):(\d+)$/);
  if (lineMatch) {
    mapped.file = lineMatch[1];
    if (item.line === undefined) {
      mapped.line = Number.parseInt(lineMatch[2], 10);
      metadata.mappings_applied.push("files[0]→file+line");
    } else {
      metadata.mappings_applied.push("files[0]→file");
    }
  } else {
    mapped.file = firstFile;
    metadata.mappings_applied.push("files[0]→file");
  }
}

// Map common audit fields shared between Doc Standards and Enhancement formats
function mapCommonAuditFields(item, mapped, metadata) {
  if (item.fingerprint && !item.source_id) {
    mapped.source_id = `audit:${item.fingerprint.replaceAll("::", "-")}`;
    metadata.mappings_applied.push("fingerprint→source_id");
  }
  if (Array.isArray(item.files) && item.files.length > 0 && !item.file) {
    mapFirstFileToFile(item.files[0], item, mapped, metadata);
  }
  if (item.why_it_matters && !item.description) {
    mapped.description = item.why_it_matters;
    metadata.mappings_applied.push("why_it_matters→description");
  }
  if (item.suggested_fix && !item.recommendation) {
    mapped.recommendation = item.suggested_fix;
    metadata.mappings_applied.push("suggested_fix→recommendation");
  }
  if (Array.isArray(item.acceptance_tests) && item.acceptance_tests.length > 0) {
    const existingEvidence = Array.isArray(item.evidence) ? item.evidence : [];
    mapped.evidence = [
      ...existingEvidence,
      ...item.acceptance_tests.map((t) => `[Acceptance] ${typeof t === "string" ? t : String(t)}`),
    ];
    metadata.mappings_applied.push("acceptance_tests→evidence");
  }
  if (item.confidence !== undefined) {
    metadata.confidence = item.confidence;
    metadata.mappings_applied.push("confidence→logged");
  }
}

/**
 * Map Documentation Standards JSONL format to TDMS format
 *
 * @param {Object} item - Raw input item (may be Doc Standards or TDMS format)
 * @returns {Object} - Item normalized to TDMS format with metadata
 */
function mapDocStandardsToTdms(item) {
  const mapped = safeCloneObject(item);
  const metadata = { format_detected: "tdms", mappings_applied: [] };

  const hasDocStandardsFields =
    item.fingerprint ||
    item.files ||
    item.why_it_matters ||
    item.suggested_fix ||
    item.acceptance_tests;

  if (hasDocStandardsFields) {
    metadata.format_detected = "doc-standards";
    mapCommonAuditFields(item, mapped, metadata);

    // Clean up Doc Standards-specific fields that shouldn't be in TDMS
    // Keep confidence in MASTER_DEBT for quality tracking (was previously lost)
    delete mapped.fingerprint;
    delete mapped.files;
    delete mapped.why_it_matters;
    delete mapped.suggested_fix;
    delete mapped.acceptance_tests;
  }

  return { item: mapped, metadata };
}

// Impact → Severity mapping for enhancement items (conservative: never S0)
const IMPACT_TO_SEVERITY = { I0: "S1", I1: "S2", I2: "S2", I3: "S3" };

/**
 * Map enhancement audit JSONL format to TDMS format
 *
 * @param {Object} item - Raw input item
 * @returns {Object} - Item normalized to TDMS format with metadata
 */
function mapEnhancementAuditToTdms(item) {
  const mapped = safeCloneObject(item);
  const metadata = { format_detected: "tdms", mappings_applied: [] };

  const hasEnhancementFields =
    (typeof item.counter_argument === "string" && item.counter_argument.trim()) ||
    (typeof item.current_approach === "string" && item.current_approach.trim()) ||
    (typeof item.proposed_outcome === "string" && item.proposed_outcome.trim());

  if (hasEnhancementFields) {
    metadata.format_detected = "enhancement-audit";

    mapped.category = "enhancements";
    mapped.type = "enhancement";
    metadata.mappings_applied.push("category→enhancements", "type→enhancement");

    if (item.category && item.category !== "enhancements") {
      mapped.subcategory = item.category;
      metadata.mappings_applied.push("category→subcategory");
    }

    if (item.impact && !item.severity) {
      mapped.severity = IMPACT_TO_SEVERITY[item.impact] || "S2";
      metadata.mappings_applied.push("impact→severity");
    }
    if (item.impact) {
      mapped.impact = item.impact;
    }

    mapCommonAuditFields(item, mapped, metadata);

    // Clean up fields that were mapped (keep enhancement-specific metadata)
    delete mapped.files;
    delete mapped.suggested_fix;
    delete mapped.acceptance_tests;
  }

  return { item: mapped, metadata };
}

// Ensure value is in valid set
function ensureValid(value, validSet, defaultValue) {
  if (validSet.includes(value)) return value;
  return defaultValue;
}

// Get next DEBT ID
function getNextDebtId(existingItems) {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// Validate that a file path looks like a real file reference
function isValidFilePath(filePath) {
  if (!filePath) return false;
  const f = String(filePath).trim();
  if (!f) return false;
  // Reject numeric-only values (e.g., "1", "10-12", "1-80")
  if (/^\d[\d-]*$/.test(f)) return false;
  // Reject generic placeholders
  const placeholders = ["multiple", "various", "several", "unknown", "n/a", "tbd"];
  if (placeholders.includes(f.toLowerCase())) return false;
  // Must contain a dot (file extension) or a path separator
  if (!f.includes(".") && !f.includes("/") && !f.includes("\\")) return false;
  return true;
}

// Preserve enhancement-specific fields on normalized item
function preserveEnhancementFields(normalized, mappedItem) {
  const fields = [
    "subcategory",
    "impact",
    "counter_argument",
    "current_approach",
    "proposed_outcome",
    "why_it_matters",
    "concrete_alternatives",
    "risk_assessment",
    "fingerprint",
    "confidence",
  ];
  for (const field of fields) {
    if (mappedItem[field] !== undefined) normalized[field] = mappedItem[field];
  }
}

/**
 * Detect the input format and apply the appropriate mapping to TDMS format.
 * Tries enhancement audit first (shares fields with Doc Standards), then Doc Standards.
 */
function detectAndMapFormat(item) {
  let { item: mappedItem, metadata: mappingMetadata } = mapEnhancementAuditToTdms(item);

  if (mappingMetadata.format_detected === "tdms") {
    const docResult = mapDocStandardsToTdms(item);
    if (docResult.metadata.format_detected === "doc-standards") {
      mappedItem = docResult.item;
      mappingMetadata = docResult.metadata;
    }
  }

  return { mappedItem, mappingMetadata };
}

/**
 * Check required fields and validate file paths on a mapped item.
 * Returns arrays of errors and warnings.
 */
function checkRequiredFields(mappedItem) {
  const errors = [];
  const warnings = [];

  if (!mappedItem.title) errors.push("Missing required field: title");
  if (!mappedItem.severity) errors.push("Missing required field: severity");
  if (!mappedItem.category) errors.push("Missing required field: category");

  const normalizedFile = normalizeFilePath(mappedItem.file || "");
  if (normalizedFile) mappedItem.file = normalizedFile;
  if (normalizedFile && !isValidFilePath(normalizedFile)) {
    warnings.push(
      `Invalid file path: "${mappedItem.file || "(empty)"}". TDMS requires a real file path.`
    );
  }

  if (
    (mappedItem.severity === "S0" || mappedItem.severity === "S1") &&
    !mappedItem.verification_steps
  ) {
    warnings.push(
      `S0/S1 finding missing verification_steps (recommended for critical/high severity)`
    );
  }

  return { errors, warnings };
}

// Validate and normalize an input item
function validateAndNormalize(item, sourceFile) {
  const { mappedItem, mappingMetadata } = detectAndMapFormat(item);
  const { errors, warnings } = checkRequiredFields(mappedItem);

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Normalize the item
  const normalized = {
    source_id: mappedItem.source_id || `audit:${crypto.randomUUID()}`,
    source_file: sourceFile,
    category: ensureValid(mappedItem.category, VALID_CATEGORIES, "code-quality"),
    severity: ensureValid(mappedItem.severity, VALID_SEVERITIES, "S2"),
    type: ensureValid(mappedItem.type, VALID_TYPES, "code-smell"),
    file: normalizeFilePath(mappedItem.file || ""),
    // Preserve numeric line info - parse strings, keep numbers, default to 0
    line:
      typeof mappedItem.line === "number"
        ? mappedItem.line
        : Number.parseInt(String(mappedItem.line), 10) || 0,
    title: (mappedItem.title || "Untitled").substring(0, 500),
    description: mappedItem.description || "",
    recommendation: mappedItem.recommendation || "",
    effort: ensureValid(mappedItem.effort, VALID_EFFORTS, "E1"),
    status: "NEW",
    roadmap_ref: mappedItem.roadmap_ref || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
  };

  // Generate content hash
  normalized.content_hash = generateContentHash(normalized);

  // Preserve optional metadata
  if (mappedItem.rule) normalized.rule = mappedItem.rule;
  if (mappedItem.evidence && mappedItem.evidence.length > 0)
    normalized.evidence = mappedItem.evidence;

  // Preserve enhancement-specific fields for type="enhancement" items
  if (mappingMetadata.format_detected === "enhancement-audit") {
    preserveEnhancementFields(normalized, mappedItem);
  }

  return { valid: true, item: normalized, mappingMetadata, warnings };
}

// Load existing items from MASTER_DEBT.jsonl with safe JSON parsing
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }

  // Wrap readFileSync in try/catch - existsSync doesn't guarantee read success
  // (race conditions, permissions, encoding errors)
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (error_) {
    console.error(
      `⚠️ Warning: Failed to read MASTER_DEBT.jsonl: ${error_ instanceof Error ? error_.message : String(error_)}`
    );
    return [];
  }

  const lines = content.split("\n").filter((line) => line.trim());

  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      // Safe error message access - err may not be an Error instance
      badLines.push({
        line: i + 1,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (badLines.length > 0) {
    console.error(`⚠️ Warning: ${badLines.length} invalid JSON line(s) in MASTER_DEBT.jsonl`);
    for (const b of badLines.slice(0, 5)) {
      console.error(`   Line ${b.line}: ${b.message}`);
    }
    if (badLines.length > 5) {
      console.error(`   ... and ${badLines.length - 5} more`);
    }
  }

  return items;
}

// Check for duplicate by content hash
function findDuplicate(item, existingItems) {
  return existingItems.find((existing) => existing.content_hash === item.content_hash);
}

// Log intake activity
function logIntake(activity) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...activity,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
}

// Print format detection statistics
function printFormatStats(formatStats) {
  if (formatStats["doc-standards"] <= 0 && formatStats["enhancement-audit"] <= 0) return;

  console.log(`\n  📋 Format Detection:`);
  console.log(`    - TDMS format: ${formatStats.tdms} items`);
  if (formatStats["doc-standards"] > 0) {
    console.log(
      `    - Doc Standards format: ${formatStats["doc-standards"]} items (mapped to TDMS)`
    );
  }
  if (formatStats["enhancement-audit"] > 0) {
    console.log(
      `    - Enhancement audit format: ${formatStats["enhancement-audit"]} items (mapped to TDMS)`
    );
  }
  if (Object.keys(formatStats.mappings).length > 0) {
    console.log(`    - Field mappings applied:`);
    for (const [mapping, count] of Object.entries(formatStats.mappings)) {
      console.log(`        ${mapping}: ${count}`);
    }
  }
  if (formatStats.confidenceLogs.length > 0) {
    console.log(`    - Confidence values logged: ${formatStats.confidenceLogs.length} items`);
  }
}

// Print file path warnings
function printFilePathWarnings(filePathWarnings) {
  if (!filePathWarnings || filePathWarnings.length === 0) return;

  console.log(
    `\n  ⚠️  File path warnings: ${filePathWarnings.length} items have invalid file refs`
  );
  for (const w of filePathWarnings.slice(0, 10)) {
    console.log(`    Line ${w.line}: "${w.title}" - ${w.warnings.join(", ")}`);
  }
  if (filePathWarnings.length > 10) {
    console.log(`    ... and ${filePathWarnings.length - 10} more`);
  }
  console.log(`    ⚠️  TDMS requires real file paths. Fix before committing.`);
}

// Print processing results (new items, duplicates, errors, format stats, warnings)
function printProcessingResults(newItems, duplicates, errors, formatStats, filePathWarnings) {
  console.log("📊 Processing Results:\n");
  console.log(`  ✅ New items to add: ${newItems.length}`);
  console.log(`  ⏭️  Duplicates skipped: ${duplicates.length}`);
  console.log(`  ❌ Validation errors: ${errors.length}`);

  printFormatStats(formatStats);

  if (duplicates.length > 0 && duplicates.length <= 10) {
    console.log("\n  Skipped duplicates:");
    for (const dup of duplicates) {
      console.log(`    - "${dup.input}..." (exists as ${dup.existingId})`);
    }
  }

  if (errors.length > 0 && errors.length <= 10) {
    console.log("\n  Validation errors:");
    for (const err of errors) {
      console.log(`    Line ${err.line}: ${err.errors.join(", ")}`);
    }
  }

  printFilePathWarnings(filePathWarnings);
}

// Read dedup log and compute per-pass breakdown, review count, and cluster count
function readDedupStats(finalItems) {
  const dedupBreakdown = {};
  let reviewCount = 0;
  let clusterCount = 0;

  try {
    const dedupLogPath = path.join(DEBT_DIR, "logs/dedup-log.jsonl");
    const dedupLogContent = fs.readFileSync(dedupLogPath, "utf8");
    const logEntries = dedupLogContent.split("\n").filter((l) => l.trim());
    for (const entry of logEntries) {
      try {
        const e = JSON.parse(entry);
        const passNum = Number.parseInt(String(e.pass), 10);
        if (!Number.isFinite(passNum) || passNum < 0) continue;
        const key = `pass_${passNum}`;
        dedupBreakdown[key] = (dedupBreakdown[key] || 0) + 1;
      } catch {
        /* skip unparseable log entry */
      }
    }
  } catch {
    /* dedup log not available */
  }

  try {
    const reviewPath = path.join(DEBT_DIR, "raw/review-needed.jsonl");
    if (fs.existsSync(reviewPath)) {
      reviewCount = fs
        .readFileSync(reviewPath, "utf8")
        .split("\n")
        .filter((l) => l.trim()).length;
    }
  } catch {
    /* review file not available */
  }

  const clusterIds = new Set();
  for (const item of finalItems) {
    if (item.cluster_id) clusterIds.add(item.cluster_id);
  }
  clusterCount = clusterIds.size;

  return { dedupBreakdown, reviewCount, clusterCount };
}

// Print final intake & dedup report
function printIntakeReport({
  inputLines,
  newItems,
  duplicates,
  errors,
  existingItems,
  dedupRan,
  viewsRan,
}) {
  const finalItems = viewsRan ? loadMasterDebt() : existingItems;
  const beforeDedup = existingItems.length + newItems.length;
  const dedupRemoved = dedupRan && viewsRan ? Math.max(0, beforeDedup - finalItems.length) : 0;

  console.log("\n" + "═".repeat(60));
  console.log("  INTAKE & DEDUP REPORT");
  console.log("═".repeat(60));
  console.log(`  📥 Input:     ${inputLines.length} findings from audit`);
  if (newItems.length > 0) {
    console.log(
      `  ✅ Ingested:  ${newItems.length} new items (${newItems[0]?.id} – ${newItems[newItems.length - 1]?.id})`
    );
  } else {
    console.log(`  ✅ Ingested:  ${newItems.length} new items`);
  }
  console.log(`  ⏭️  Hash dupes: ${duplicates.length} exact duplicates skipped`);
  console.log(`  ❌ Errors:    ${errors.length} validation failures`);

  if (dedupRan) {
    const { dedupBreakdown, reviewCount, clusterCount } = readDedupStats(finalItems);
    console.log("");
    console.log("  🔄 Multi-Pass Dedup:");
    const passNames = {
      pass_0: "Parametric (numbers stripped)",
      pass_1: "Exact hash match",
      pass_2: "Near match (file+line+title)",
      pass_3: "Semantic (file+title >90%)",
      pass_4: "Cross-source (SonarCloud↔audit)",
      pass_5: "Systemic pattern annotation",
    };
    for (const [key, name] of Object.entries(passNames)) {
      const count = dedupBreakdown[key] || 0;
      if (count > 0) {
        console.log(`     ${name}: ${count}`);
      }
    }
    console.log(`     Total merged: ${dedupRemoved}`);
    if (clusterCount > 0) {
      console.log(`     Systemic patterns: ${clusterCount} clusters identified`);
    }
    if (reviewCount > 0) {
      console.log(`     ⚠️  ${reviewCount} items flagged for manual review`);
    }
  }

  const sevCounts = {};
  for (const item of finalItems) {
    sevCounts[item.severity] = (sevCounts[item.severity] || 0) + 1;
  }

  console.log("");
  console.log("  📊 MASTER_DEBT.jsonl:");
  console.log(`     Total: ${finalItems.length} items`);
  console.log(
    `     S0: ${sevCounts.S0 || 0} | S1: ${sevCounts.S1 || 0} | S2: ${sevCounts.S2 || 0} | S3: ${sevCounts.S3 || 0}`
  );
  console.log("═".repeat(60));
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node scripts/debt/intake-audit.js <audit-output.jsonl>");
    console.error("\nOptions:");
    console.error("  --dry-run    Preview changes without writing");
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  const inputFile = args.find((arg) => !arg.startsWith("--"));

  if (!inputFile) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log("📥 Intake: Processing audit output...\n");
  console.log(`  Input file: ${inputFile}`);
  if (dryRun) console.log("  Mode: DRY RUN (no changes will be written)\n");

  // Load input file - wrap in try/catch for race conditions and permission errors
  let inputContent;
  try {
    inputContent = fs.readFileSync(inputFile, "utf8");
  } catch (error_) {
    console.error(
      `Error: Failed to read input file: ${error_ instanceof Error ? error_.message : String(error_)}`
    );
    process.exit(1);
  }
  const inputLines = inputContent.split("\n").filter((line) => line.trim());

  if (inputLines.length === 0) {
    console.log("  ⚠️ Input file is empty. Nothing to process.");
    process.exit(0);
  }

  console.log(`  📄 Found ${inputLines.length} items in input file\n`);

  // Load existing master debt
  const existingItems = loadMasterDebt();
  console.log(`  📊 Existing MASTER_DEBT.jsonl: ${existingItems.length} items\n`);

  // Build map of existing content hashes to IDs for O(1) lookup
  const existingHashMap = new Map(existingItems.map((item) => [item.content_hash, item.id]));

  // Process input items
  const newItems = [];
  const duplicates = [];
  const errors = [];
  const filePathWarnings = [];
  let nextId = getNextDebtId(existingItems);

  // Track format statistics (Doc Standards + enhancement audit)
  const formatStats = {
    tdms: 0,
    "doc-standards": 0,
    "enhancement-audit": 0,
    mappings: {},
    confidenceLogs: [],
  };

  for (let i = 0; i < inputLines.length; i++) {
    const line = inputLines[i];
    try {
      const inputItem = JSON.parse(line);
      const result = validateAndNormalize(inputItem, inputFile);

      if (!result.valid) {
        errors.push({ line: i + 1, errors: result.errors });
        continue;
      }

      const normalizedItem = result.item;
      const mappingMetadata = result.mappingMetadata;

      // Track format statistics
      if (mappingMetadata) {
        formatStats[mappingMetadata.format_detected]++;
        for (const mapping of mappingMetadata.mappings_applied || []) {
          formatStats.mappings[mapping] = (formatStats.mappings[mapping] || 0) + 1;
        }
        // Log confidence values for analysis (not stored in MASTER_DEBT)
        if (mappingMetadata.confidence !== undefined) {
          formatStats.confidenceLogs.push({
            title: normalizedItem.title.substring(0, 50),
            confidence: mappingMetadata.confidence,
          });
        }
      }

      // Check for duplicate using Map for O(1) lookup
      if (existingHashMap.has(normalizedItem.content_hash)) {
        duplicates.push({
          input: normalizedItem.title.substring(0, 50),
          existingId: existingHashMap.get(normalizedItem.content_hash) || "unknown",
        });
        continue;
      }

      // Track file path warnings
      if (result.warnings && result.warnings.length > 0) {
        filePathWarnings.push({
          line: i + 1,
          title: normalizedItem.title.substring(0, 60),
          warnings: result.warnings,
        });
      }

      // Assign DEBT ID
      normalizedItem.id = `DEBT-${String(nextId).padStart(4, "0")}`;
      nextId++;

      newItems.push(normalizedItem);
      existingHashMap.set(normalizedItem.content_hash, normalizedItem.id);
    } catch (err) {
      // Safe error message access - err may not be an Error instance
      errors.push({
        line: i + 1,
        errors: [`JSON parse error: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  }

  // Report results
  printProcessingResults(newItems, duplicates, errors, formatStats, filePathWarnings);

  // Write new items
  if (newItems.length === 0) {
    console.log("\n✅ No new items to add. MASTER_DEBT.jsonl unchanged.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN: Would add the following items:");
    for (const item of newItems.slice(0, 5)) {
      console.log(`  - ${item.id}: ${item.title.substring(0, 60)}...`);
    }
    if (newItems.length > 5) {
      console.log(`  ... and ${newItems.length - 5} more items`);
    }
    process.exit(0);
  }

  // Append new items to raw pipeline files so full dedup can process them
  console.log("\n📝 Writing new items to pipeline...");
  if (!fs.existsSync(DEBT_DIR)) {
    fs.mkdirSync(DEBT_DIR, { recursive: true });
  }
  const newLines = newItems.map((item) => JSON.stringify(item));

  // Append to raw/normalized-all.jsonl (input for dedup-multi-pass)
  const NORMALIZED_FILE = path.join(DEBT_DIR, "raw/normalized-all.jsonl");
  fs.mkdirSync(path.dirname(NORMALIZED_FILE), { recursive: true });
  fs.appendFileSync(NORMALIZED_FILE, newLines.join("\n") + "\n");

  // Also append to raw/deduped.jsonl as fallback
  const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
  fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });
  fs.appendFileSync(DEDUPED_FILE, newLines.join("\n") + "\n");

  // Log intake activity (including format statistics and confidence values)
  // Include user context for audit trail reconstruction (Qodo compliance)
  let operatorContext;
  try {
    operatorContext =
      os.userInfo().username || process.env.USER || process.env.USERNAME || "unknown";
  } catch {
    operatorContext = process.env.USER || process.env.USERNAME || "unknown";
  }

  logIntake({
    action: "intake-audit",
    operator: operatorContext,
    input_file: inputFile,
    items_processed: inputLines.length,
    items_added: newItems.length,
    duplicates_skipped: duplicates.length,
    errors: errors.length,
    first_id: newItems[0]?.id,
    last_id: newItems[newItems.length - 1]?.id,
    format_stats: {
      tdms_format: formatStats.tdms,
      doc_standards_format: formatStats["doc-standards"],
      enhancement_audit_format: formatStats["enhancement-audit"],
      mappings_applied: formatStats.mappings,
    },
    // Log confidence values for analysis (per JSONL_SCHEMA_STANDARD.md)
    confidence_logs: formatStats.confidenceLogs.length > 0 ? formatStats.confidenceLogs : undefined,
  });

  // Run multi-pass dedup then regenerate views
  console.log("🔄 Running multi-pass dedup pipeline...");
  let dedupRan = false;
  try {
    execFileSync(process.execPath, ["scripts/debt/dedup-multi-pass.js"], { stdio: "inherit" });
    dedupRan = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️ Multi-pass dedup failed: ${msg}. Falling back to views-only regeneration.`);
  }

  console.log("🔄 Regenerating views...");
  let viewsRan = false;
  try {
    execFileSync(process.execPath, ["scripts/debt/generate-views.js"], { stdio: "inherit" });
    viewsRan = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `  ⚠️ Failed to regenerate views: ${msg}. Run manually: node scripts/debt/generate-views.js`
    );
  }

  console.log("🔄 Assigning roadmap references...");
  try {
    execFileSync(process.execPath, ["scripts/debt/assign-roadmap-refs.js"], { stdio: "inherit" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `  ⚠️ Failed to assign roadmap refs: ${msg}. Run manually: node scripts/debt/assign-roadmap-refs.js`
    );
  }

  // Print final intake & dedup report
  printIntakeReport({
    inputLines,
    newItems,
    duplicates,
    errors,
    existingItems,
    dedupRan,
    viewsRan,
  });
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
