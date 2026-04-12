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
const { execFileSync } = require("node:child_process");
const generateContentHash = require("../lib/generate-content-hash");
const normalizeFilePath = require("../lib/normalize-file-path");

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
const { safeAppendFileSync } = require("../lib/safe-fs");
const { safeParseLine, safeParseLineWithError } = require("../lib/parse-jsonl-line.js");

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
  // Reject directory-only paths (trailing slash)
  if (f.endsWith("/") || f.endsWith("\\")) return false;
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
  const isPlainObject = typeof item === "object" && item !== null && !Array.isArray(item);
  if (!isPlainObject) {
    return {
      mappedItem: { title: null, severity: null, category: null, file: null },
      mappingMetadata: { format_detected: "invalid" },
    };
  }

  const enh = mapEnhancementAuditToTdms(item);
  if (enh.metadata.format_detected === "enhancement-audit") {
    return { mappedItem: enh.item, mappingMetadata: enh.metadata };
  }

  const doc = mapDocStandardsToTdms(item);
  if (doc.metadata.format_detected === "doc-standards") {
    return { mappedItem: doc.item, mappingMetadata: doc.metadata };
  }

  return { mappedItem: item, mappingMetadata: { format_detected: "tdms" } };
}

/**
 * Validate and normalize the file path on a mapped item.
 * Mutates mappedItem.file and mappedItem.line in place.
 * Returns an array of warning strings.
 */
function validateFilePath(mappedItem) {
  const warnings = [];
  const rawFile = typeof mappedItem.file === "string" ? mappedItem.file : "";
  const normalizedFile = normalizeFilePath(rawFile);

  if (rawFile && !normalizedFile) {
    warnings.push(
      `Invalid file path: "${rawFile}" (could not be normalized to a repo-relative path)`
    );
    return warnings;
  }

  if (normalizedFile) {
    mappedItem.file = normalizedFile;

    // Detect file:linenum pattern left after normalization and split it out
    const lineNumMatch = /^(.+):(\d+)$/.exec(normalizedFile);
    if (lineNumMatch && isValidFilePath(lineNumMatch[1])) {
      mappedItem.file = lineNumMatch[1];
      if (mappedItem.line === undefined || mappedItem.line === 0) {
        mappedItem.line = Number.parseInt(lineNumMatch[2], 10);
      }
    }

    if (!isValidFilePath(mappedItem.file)) {
      warnings.push(
        `Invalid file path: "${mappedItem.file}" (must be repo-relative and not contain unsafe segments)`
      );
    }
  }

  return warnings;
}

/**
 * Coerce verified_by to a valid string value if it is a non-string type.
 * Mutates mappedItem.verified_by in place.
 * Returns an array of warning strings.
 */
function coerceVerifiedBy(mappedItem) {
  const warnings = [];

  if (mappedItem.verified_by === undefined || mappedItem.verified_by === null) {
    return warnings;
  }

  if (typeof mappedItem.verified_by !== "string") {
    if (mappedItem.verified_by === true) {
      mappedItem.verified_by = "auto";
      warnings.push(`verified_by coerced from boolean true → "auto"`);
    } else if (mappedItem.verified_by === false) {
      mappedItem.verified_by = null;
      warnings.push(`verified_by coerced from boolean false → null (not verified)`);
    } else {
      const coerced = String(mappedItem.verified_by);
      warnings.push(`verified_by coerced from ${typeof mappedItem.verified_by} → "${coerced}"`);
      mappedItem.verified_by = coerced;
    }
  }

  return warnings;
}

/**
 * Check required fields and validate file paths on a mapped item.
 * Returns arrays of errors and warnings.
 */
function checkRequiredFields(mappedItem) {
  const errors = [];

  if (!mappedItem.title) errors.push("Missing required field: title");
  if (!mappedItem.severity) errors.push("Missing required field: severity");
  if (!mappedItem.category) errors.push("Missing required field: category");

  const warnings = [...validateFilePath(mappedItem), ...coerceVerifiedBy(mappedItem)];

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
    verified_by: typeof mappedItem.verified_by === "string" ? mappedItem.verified_by : null,
    resolution: null,
    source_pr: (() => {
      if (mappedItem.source_pr === null || mappedItem.source_pr === undefined) return null;
      const n = Number(mappedItem.source_pr);
      return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
    })(),
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
    const { value, error } = safeParseLineWithError(lines[i]);
    if (error) {
      badLines.push({ line: i + 1, message: error.message });
    } else if (value) {
      items.push(value);
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
  safeAppendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
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
    for (const rawEntry of logEntries) {
      const e = safeParseLine(rawEntry);
      if (!e) continue;
      const passNum = Number.parseInt(String(e.pass), 10);
      if (!Number.isFinite(passNum) || passNum < 0) continue;
      const key = `pass_${passNum}`;
      dedupBreakdown[key] = (dedupBreakdown[key] || 0) + 1;
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

// Print the "Ingested" line with ID range if any items were added
function printIngestedLine(newItems) {
  if (newItems.length === 0) {
    console.log(`  ✅ Ingested:  0 new items`);
    return;
  }
  const firstId = newItems[0]?.id;
  const lastId = newItems[newItems.length - 1]?.id;
  console.log(`  ✅ Ingested:  ${newItems.length} new items (${firstId} – ${lastId})`);
}

// Print the multi-pass dedup breakdown section of the intake report
function printDedupBreakdownSection(finalItems, dedupRemoved) {
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
    const count = dedupBreakdown[key] ?? 0;
    if (count > 0) console.log(`     ${name}: ${count}`);
  }
  console.log(`     Total merged: ${dedupRemoved}`);
  if (clusterCount > 0) {
    console.log(`     Systemic patterns: ${clusterCount} clusters identified`);
  }
  if (reviewCount > 0) {
    console.log(`     ⚠️  ${reviewCount} items flagged for manual review`);
  }
}

// Count items grouped by severity (S0..S3)
function countBySeverity(items) {
  const sevCounts = {};
  for (const item of items) {
    sevCounts[item.severity] = (sevCounts[item.severity] || 0) + 1;
  }
  return sevCounts;
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
  printIngestedLine(newItems);
  console.log(`  ⏭️  Hash dupes: ${duplicates.length} exact duplicates skipped`);
  console.log(`  ❌ Errors:    ${errors.length} validation failures`);

  if (dedupRan) {
    printDedupBreakdownSection(finalItems, dedupRemoved);
  }

  const sevCounts = countBySeverity(finalItems);
  console.log("");
  console.log("  📊 MASTER_DEBT.jsonl:");
  console.log(`     Total: ${finalItems.length} items`);
  console.log(
    `     S0: ${sevCounts.S0 || 0} | S1: ${sevCounts.S1 || 0} | S2: ${sevCounts.S2 || 0} | S3: ${sevCounts.S3 || 0}`
  );
  console.log("═".repeat(60));
}

// Parse CLI args and return the validated input-file path.
// Exits (code 1) on missing args, missing file, or no input file.
function parseArgsOrExit(argv) {
  if (argv.length === 0) {
    console.error("Usage: node scripts/debt/intake-audit.js <audit-output.jsonl>");
    console.error("\nOptions:");
    console.error("  --dry-run    Preview changes without writing");
    process.exit(1);
  }
  const dryRun = argv.includes("--dry-run");
  const inputFile = argv.find((arg) => !arg.startsWith("--"));
  if (!inputFile) {
    console.error("Error: No input file specified");
    process.exit(1);
  }
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }
  return { dryRun, inputFile };
}

// Read the input JSONL file into a list of non-empty lines. Exits if the
// read fails or the file is empty (exit 0 — empty is not an error).
function readInputLinesOrExit(inputFile) {
  let inputContent;
  try {
    inputContent = fs.readFileSync(inputFile, "utf8");
  } catch (error_) {
    const msg = error_ instanceof Error ? error_.message : String(error_);
    console.error(`Error: Failed to read input file: ${msg}`);
    process.exit(1);
  }
  const inputLines = inputContent.split("\n").filter((line) => line.trim());
  if (inputLines.length === 0) {
    console.log("  ⚠️ Input file is empty. Nothing to process.");
    process.exit(0);
  }
  console.log(`  📄 Found ${inputLines.length} items in input file\n`);
  return inputLines;
}

// Create an empty format-stats record (Doc Standards + enhancement audit)
function createEmptyFormatStats() {
  return { tdms: 0, "doc-standards": 0, "enhancement-audit": 0, mappings: {}, confidenceLogs: [] };
}

// Fold a mapping-metadata record into the aggregate formatStats bucket
function applyMappingMetadata(formatStats, normalizedItem, mappingMetadata) {
  if (!mappingMetadata) return;
  formatStats[mappingMetadata.format_detected]++;
  for (const mapping of mappingMetadata.mappings_applied || []) {
    formatStats.mappings[mapping] = (formatStats.mappings[mapping] || 0) + 1;
  }
  if (mappingMetadata.confidence !== undefined) {
    formatStats.confidenceLogs.push({
      title: normalizedItem.title.substring(0, 50),
      confidence: mappingMetadata.confidence,
    });
  }
}

// Process one input line into { kind: "ok"|"parse-error"|"validation-error"|"duplicate"|"skip", ... }
function classifyInputLine(rawLine, inputFile, existingHashMap, formatStats) {
  const { value: inputItem, error: parseErr } = safeParseLineWithError(rawLine);
  if (parseErr) return { kind: "parse-error", message: parseErr.message };
  if (!inputItem) return { kind: "skip" };

  const result = validateAndNormalize(inputItem, inputFile);
  if (!result.valid) return { kind: "validation-error", errors: result.errors };

  const normalizedItem = result.item;
  applyMappingMetadata(formatStats, normalizedItem, result.mappingMetadata);

  if (existingHashMap.has(normalizedItem.content_hash)) {
    return {
      kind: "duplicate",
      input: normalizedItem.title.substring(0, 50),
      existingId: existingHashMap.get(normalizedItem.content_hash) || "unknown",
    };
  }
  return { kind: "ok", item: normalizedItem, warnings: result.warnings || [] };
}

// Walk all input lines and produce the full intake bookkeeping in a single pass
function processInputLines(inputLines, inputFile, existingItems) {
  const existingHashMap = new Map(existingItems.map((item) => [item.content_hash, item.id]));
  const newItems = [];
  const duplicates = [];
  const errors = [];
  const filePathWarnings = [];
  const formatStats = createEmptyFormatStats();
  let nextId = getNextDebtId(existingItems);

  for (let i = 0; i < inputLines.length; i++) {
    const result = classifyInputLine(inputLines[i], inputFile, existingHashMap, formatStats);
    if (result.kind === "parse-error") {
      errors.push({ line: i + 1, errors: [result.message] });
      continue;
    }
    if (result.kind === "validation-error") {
      errors.push({ line: i + 1, errors: result.errors });
      continue;
    }
    if (result.kind === "duplicate") {
      duplicates.push({ input: result.input, existingId: result.existingId });
      continue;
    }
    if (result.kind !== "ok") continue;

    const { item: normalizedItem, warnings } = result;
    if (warnings.length > 0) {
      filePathWarnings.push({
        line: i + 1,
        title: normalizedItem.title.substring(0, 60),
        warnings,
      });
    }
    normalizedItem.id = `DEBT-${String(nextId).padStart(4, "0")}`;
    nextId++;
    newItems.push(normalizedItem);
    existingHashMap.set(normalizedItem.content_hash, normalizedItem.id);
  }

  return { newItems, duplicates, errors, filePathWarnings, formatStats };
}

// Print the dry-run preview of items that would be added
function printDryRunPreview(newItems) {
  console.log("\n🔍 DRY RUN: Would add the following items:");
  for (const item of newItems.slice(0, 5)) {
    console.log(`  - ${item.id}: ${item.title.substring(0, 60)}...`);
  }
  if (newItems.length > 5) {
    console.log(`  ... and ${newItems.length - 5} more items`);
  }
}

// Append new items to the raw pipeline files (normalized-all + deduped fallback)
function writeNewItemsToPipeline(newItems) {
  console.log("\n📝 Writing new items to pipeline...");
  if (!fs.existsSync(DEBT_DIR)) {
    fs.mkdirSync(DEBT_DIR, { recursive: true });
  }
  const newLines = newItems.map((item) => JSON.stringify(item));

  const NORMALIZED_FILE = path.join(DEBT_DIR, "raw/normalized-all.jsonl");
  fs.mkdirSync(path.dirname(NORMALIZED_FILE), { recursive: true });
  safeAppendFileSync(NORMALIZED_FILE, newLines.join("\n") + "\n");

  const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
  fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });
  safeAppendFileSync(DEDUPED_FILE, newLines.join("\n") + "\n");
}

// Log the intake activity audit record (neutral operator label per PR #500 R1)
function logIntakeActivity({ inputFile, inputLines, newItems, duplicates, errors, formatStats }) {
  logIntake({
    action: "intake-audit",
    operator: "tdms-intake",
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
    confidence_logs: formatStats.confidenceLogs.length > 0 ? formatStats.confidenceLogs : undefined,
  });
}

// Run a single child-process step of the post-intake pipeline. Warnings on
// failure are non-fatal. Returns true if the step completed cleanly.
function runPipelineStep(label, args, opts = {}) {
  try {
    execFileSync(process.execPath, args, { stdio: "inherit", ...opts });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️ ${label}: ${msg}`);
    return false;
  }
}

// Run dedup, views regeneration, and roadmap-ref assignment. Returns flags
// indicating which stages completed so the caller can render the final report.
function runPostIntakePipeline() {
  console.log("🔄 Running multi-pass dedup pipeline...");
  const dedupRan = runPipelineStep(
    "Multi-pass dedup failed. Falling back to views-only regeneration.",
    ["scripts/debt/dedup-multi-pass.js"]
  );

  console.log("🔄 Regenerating views...");
  const viewsRan = runPipelineStep(
    "Failed to regenerate views. Run manually: node scripts/debt/generate-views.js",
    [path.join(__dirname, "generate-views.js")],
    { cwd: __dirname }
  );

  console.log("🔄 Assigning roadmap references...");
  runPipelineStep(
    "Failed to assign roadmap refs. Run manually: node scripts/debt/assign-roadmap-refs.js",
    ["scripts/debt/assign-roadmap-refs.js"]
  );

  return { dedupRan, viewsRan };
}

// Main function
async function main() {
  const { dryRun, inputFile } = parseArgsOrExit(process.argv.slice(2));

  console.log("📥 Intake: Processing audit output...\n");
  console.log(`  Input file: ${inputFile}`);
  if (dryRun) console.log("  Mode: DRY RUN (no changes will be written)\n");

  const inputLines = readInputLinesOrExit(inputFile);
  const existingItems = loadMasterDebt();
  console.log(`  📊 Existing MASTER_DEBT.jsonl: ${existingItems.length} items\n`);

  const { newItems, duplicates, errors, filePathWarnings, formatStats } = processInputLines(
    inputLines,
    inputFile,
    existingItems
  );

  printProcessingResults(newItems, duplicates, errors, formatStats, filePathWarnings);

  if (newItems.length === 0) {
    console.log("\n✅ No new items to add. MASTER_DEBT.jsonl unchanged.");
    process.exit(0);
  }
  if (dryRun) {
    printDryRunPreview(newItems);
    process.exit(0);
  }

  writeNewItemsToPipeline(newItems);
  logIntakeActivity({ inputFile, inputLines, newItems, duplicates, errors, formatStats });

  const { dedupRan, viewsRan } = runPostIntakePipeline();

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
