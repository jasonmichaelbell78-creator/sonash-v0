#!/usr/bin/env node
/* global __dirname */
/**
 * Intake script for audit-generated improvement proposals
 *
 * Usage: node scripts/improvements/intake-audit.js <audit-output.jsonl>
 *
 * Process:
 * 1. Validates input file schema
 * 2. Maps enhancement audit JSONL format to IMS format (if detected)
 * 3. Checks for exact hash duplicates against MASTER_IMPROVEMENTS.jsonl
 * 4. Assigns ENH-XXXX IDs to new items
 * 5. Appends to raw pipeline files (normalized-all.jsonl + deduped.jsonl)
 * 6. Runs multi-pass dedup (parametric, near, semantic, cross-source, systemic)
 * 7. Regenerates views
 * 8. Cross-references MASTER_DEBT.jsonl for tdms_crossref matches (read-only)
 * 9. Logs intake activity (including confidence values from enhancement audits)
 *
 * Supports two input formats:
 * - IMS format (native): Uses fields like source_id, file, description, recommendation
 * - Enhancement audit format: Uses fields like fingerprint, files[], why_it_matters, suggested_fix
 *
 * Enhancement audit -> IMS field mapping (automatic):
 *   fingerprint        -> source_id (converted: category::file::id -> audit:category-file-id)
 *   files[0]           -> file (first path extracted, with optional :line extraction)
 *   why_it_matters     -> description (if not present)
 *   suggested_fix      -> recommendation (if not present)
 *   acceptance_tests   -> evidence (appended with [Acceptance] prefix)
 *   confidence         -> logged to intake-log.jsonl (not stored in MASTER_IMPROVEMENTS)
 *   counter_argument   -> preserved as-is (REQUIRED - honesty guard)
 *   current_approach   -> preserved as-is
 *   proposed_outcome   -> preserved as-is
 *   concrete_alternatives -> preserved as-is
 *
 * Does NOT run assign-roadmap-refs.js (IMS does not have that pipeline step).
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
function safeCloneObject(obj, depth = 0) {
  if (obj === null || typeof obj !== "object") return obj;
  // Prevent stack overflows from deeply-nested untrusted input
  // Return empty container (not null) to avoid downstream crashes on property access
  if (depth > 200) return Array.isArray(obj) ? [] : Object.create(null);
  if (Array.isArray(obj)) {
    return obj.map((v) => safeCloneObject(v, depth + 1));
  }
  const result = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      result[key] = safeCloneObject(obj[key], depth + 1);
    }
  }
  return result;
}

const { loadConfig } = require("../config/load-config");

const IMPROVEMENTS_DIR = path.join(__dirname, "../../docs/improvements");
const MASTER_FILE = path.join(IMPROVEMENTS_DIR, "MASTER_IMPROVEMENTS.jsonl");
const LOG_DIR = path.join(IMPROVEMENTS_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");
const RAW_DIR = path.join(IMPROVEMENTS_DIR, "raw");

// Cross-reference: MASTER_DEBT.jsonl for tdms_crossref checks (read-only)
const MASTER_DEBT_FILE = path.join(__dirname, "../../docs/technical-debt/MASTER_DEBT.jsonl");

// Valid schema values -- single source of truth: scripts/config/improvement-schema.json
let schema;
try {
  schema = loadConfig("improvement-schema");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load improvement-schema config: ${msg}`);
  process.exit(2);
}
const VALID_CATEGORIES = schema.validCategories;
const VALID_IMPACTS = schema.validImpacts;
const VALID_EFFORTS = schema.validEfforts;
const VALID_STATUSES = schema.validStatuses;

// Generate content hash for deduplication
function generateContentHash(item) {
  const normalizedFile = normalizeFilePath(item.file || "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// Symlink guard: refuse to write through symlinks (Review #289 R7, #290 R8)
function assertNotSymlink(filePath) {
  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      throw new Error(`Refusing to write to symlink: ${filePath}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.code === "ENOENT") return; // File doesn't exist yet — safe
      // Fail closed on permission errors — cannot verify symlink status (Review #291 R9)
      if (err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(`Refusing to write when symlink check is blocked: ${filePath}`);
      }
      if (err.message.includes("symlink")) throw err;
    }
    // Non-Error or other lstat errors — let the actual write handle them
  }
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

  // Strip trailing ":<line>" suffix for consistent hashing (Review #288 R6)
  normalized = normalized.replace(/:(\d+)$/, "");

  return normalized;
}

/**
 * Map enhancement audit JSONL format to IMS format
 *
 * Enhancement audit fields -> IMS fields:
 *   fingerprint          -> source_id (converted)
 *   files[0]             -> file (first file path extracted)
 *   why_it_matters       -> description (if not present)
 *   suggested_fix        -> recommendation (if not present)
 *   acceptance_tests     -> evidence (appended with [Acceptance] prefix)
 *   confidence           -> (logged only, not stored)
 *   counter_argument     -> preserved as-is (REQUIRED - honesty guard)
 *   current_approach     -> preserved as-is
 *   proposed_outcome     -> preserved as-is
 *   concrete_alternatives -> preserved as-is
 *
 * @param {Object} item - Raw input item (may be enhancement audit or IMS format)
 * @returns {Object} - Item normalized to IMS format with metadata
 */
function mapEnhancementAuditToIms(item) {
  // Use safe clone to prevent prototype pollution from untrusted JSONL input
  const mapped = safeCloneObject(item);
  const metadata = { format_detected: "ims", mappings_applied: [] };

  // Detect enhancement audit format by presence of audit-specific fields (Review #290 R8: type-precise)
  const hasEnhancementFields =
    (typeof item.fingerprint === "string" && item.fingerprint.trim()) ||
    (Array.isArray(item.files) && item.files.length > 0) ||
    (typeof item.why_it_matters === "string" && item.why_it_matters.trim()) ||
    (typeof item.suggested_fix === "string" && item.suggested_fix.trim()) ||
    (Array.isArray(item.acceptance_tests) && item.acceptance_tests.length > 0);

  if (hasEnhancementFields) {
    metadata.format_detected = "enhancement-audit";

    // Map fingerprint -> source_id
    if (item.fingerprint && !item.source_id) {
      // fingerprint format: "category::file::id" -> convert to audit:category-file-id
      mapped.source_id = `audit:${item.fingerprint.replace(/::/g, "-")}`;
      metadata.mappings_applied.push("fingerprint->source_id");
    }

    // Map files[0] -> file (with optional line extraction)
    if (Array.isArray(item.files) && item.files.length > 0 && !item.file) {
      const firstFile = item.files[0];
      // Type guard: ensure firstFile is a string before calling .match()
      if (typeof firstFile !== "string") {
        // Non-string file entry - convert to string or skip
        mapped.file = String(firstFile);
        metadata.mappings_applied.push("files[0]->file(coerced)");
      } else {
        // Check for file:line format
        const lineMatch = firstFile.match(/^(.+):(\d+)$/);
        if (lineMatch) {
          mapped.file = lineMatch[1];
          if (!item.line) {
            mapped.line = Number.parseInt(lineMatch[2], 10);
            metadata.mappings_applied.push("files[0]->file+line");
          } else {
            metadata.mappings_applied.push("files[0]->file");
          }
        } else {
          mapped.file = firstFile;
          metadata.mappings_applied.push("files[0]->file");
        }
      }
    }

    // Map why_it_matters -> description (if not already present)
    if (item.why_it_matters && !item.description) {
      mapped.description = item.why_it_matters;
      metadata.mappings_applied.push("why_it_matters->description");
    }

    // Map suggested_fix -> recommendation (if not already present)
    if (item.suggested_fix && !item.recommendation) {
      mapped.recommendation = item.suggested_fix;
      metadata.mappings_applied.push("suggested_fix->recommendation");
    }

    // Map acceptance_tests -> append to evidence with [Acceptance] prefix (Review #291 R9: sanitize)
    if (Array.isArray(item.acceptance_tests) && item.acceptance_tests.length > 0) {
      const existingEvidence = Array.isArray(item.evidence) ? item.evidence : [];
      const acceptanceEvidence = item.acceptance_tests
        .map((t) => (typeof t === "string" ? t.trim() : String(t).trim()))
        .filter(Boolean)
        .map((t) => `[Acceptance] ${t.substring(0, 500)}`);
      mapped.evidence = [...existingEvidence, ...acceptanceEvidence];
      metadata.mappings_applied.push("acceptance_tests->evidence");
    }

    // Extract confidence for logging (not stored in MASTER_IMPROVEMENTS)
    if (item.confidence !== undefined) {
      metadata.confidence = item.confidence;
      metadata.mappings_applied.push("confidence->logged");
    }

    // Preserve improvement-specific fields as-is (these stay in the normalized record)
    // counter_argument is REQUIRED as an honesty guard - do NOT delete it
    // current_approach, proposed_outcome, concrete_alternatives are preserved

    // Clean up fields that were mapped to other names
    // NOTE: fingerprint, confidence, why_it_matters are PRESERVED because they are
    // required fields in the IMS schema. We map them to additional fields but keep originals.
    delete mapped.files; // mapped to file + line
    delete mapped.suggested_fix; // mapped to recommendation
    delete mapped.acceptance_tests; // mapped to evidence
  }

  return { item: mapped, metadata };
}

// Ensure value is in valid set
function ensureValid(value, validSet, defaultValue) {
  if (validSet.includes(value)) return value;
  return defaultValue;
}

// Get next ENH ID
function getNextEnhId(existingItems) {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/ENH-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// Validate and normalize an input item
function validateAndNormalize(item, sourceFile) {
  const errors = [];

  // First, apply enhancement audit -> IMS field mapping
  const { item: mappedItem, metadata: mappingMetadata } = mapEnhancementAuditToIms(item);

  // Required fields check (after mapping)
  if (!mappedItem.title) errors.push("Missing required field: title");
  if (!mappedItem.impact) errors.push("Missing required field: impact");
  if (!mappedItem.category) errors.push("Missing required field: category");

  // Honesty guard: require counter_argument for enhancement-audit inputs (Review #289 R7)
  if (
    mappingMetadata?.format_detected === "enhancement-audit" &&
    (!mappedItem.counter_argument || String(mappedItem.counter_argument).trim() === "")
  ) {
    errors.push("Missing required field: counter_argument");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Normalize the item - keep all improvement-specific fields
  const normalized = {
    source_id: mappedItem.source_id || `audit:${crypto.randomUUID()}`,
    source_file: sourceFile,
    category: ensureValid(mappedItem.category, VALID_CATEGORIES, "app-architecture"),
    impact: ensureValid(mappedItem.impact, VALID_IMPACTS, "I2"),
    effort: ensureValid(mappedItem.effort, VALID_EFFORTS, "E1"),
    file: normalizeFilePath(mappedItem.file || ""),
    // Preserve numeric line info - parse strings, keep numbers, default to 0
    line:
      typeof mappedItem.line === "number"
        ? mappedItem.line
        : Number.parseInt(String(mappedItem.line), 10) || 0,
    title: (mappedItem.title || "Untitled").substring(0, 500),
    description: mappedItem.description || "",
    recommendation: mappedItem.recommendation || "",
    status: "PROPOSED",
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
  };

  // Preserve IMS-required fields (fingerprint, confidence, why_it_matters)
  if (mappedItem.fingerprint) normalized.fingerprint = mappedItem.fingerprint;
  if (mappedItem.confidence !== undefined) normalized.confidence = mappedItem.confidence;
  if (mappedItem.why_it_matters) normalized.why_it_matters = mappedItem.why_it_matters;

  // Generate content hash
  normalized.content_hash = generateContentHash(normalized);

  // Preserve improvement-specific fields (current_approach, proposed_outcome, counter_argument, etc.)
  if (mappedItem.current_approach) {
    normalized.current_approach = mappedItem.current_approach;
  }
  if (mappedItem.proposed_outcome) {
    normalized.proposed_outcome = mappedItem.proposed_outcome;
  }
  // counter_argument is the honesty guard - REQUIRED, preserve as-is
  if (mappedItem.counter_argument) {
    normalized.counter_argument = mappedItem.counter_argument;
  }
  if (mappedItem.concrete_alternatives) {
    normalized.concrete_alternatives = mappedItem.concrete_alternatives;
  }

  // Preserve optional metadata
  if (mappedItem.rule) normalized.rule = mappedItem.rule;
  if (mappedItem.evidence && mappedItem.evidence.length > 0) {
    normalized.evidence = mappedItem.evidence;
  }

  return { valid: true, item: normalized, mappingMetadata };
}

// Load existing items from MASTER_IMPROVEMENTS.jsonl with safe JSON parsing
function loadMasterImprovements() {
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
      `Warning: Failed to read MASTER_IMPROVEMENTS.jsonl: ${error_ instanceof Error ? error_.message : String(error_)}`
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
    console.error(`Warning: ${badLines.length} invalid JSON line(s) in MASTER_IMPROVEMENTS.jsonl`);
    for (const b of badLines.slice(0, 5)) {
      console.error(`   Line ${b.line}: ${b.message}`);
    }
    if (badLines.length > 5) {
      console.error(`   ... and ${badLines.length - 5} more`);
    }
  }

  return items;
}

// Load MASTER_DEBT.jsonl for cross-reference checks (read-only)
function loadMasterDebtForCrossRef() {
  if (!fs.existsSync(MASTER_DEBT_FILE)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_DEBT_FILE, "utf8");
  } catch (error_) {
    console.warn(
      `Warning: Failed to read MASTER_DEBT.jsonl for cross-ref: ${error_ instanceof Error ? error_.message : String(error_)}`
    );
    return [];
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch {
      /* skip unparseable lines in cross-ref file */
    }
  }

  return items;
}

// Check for duplicate by content hash
function findDuplicate(item, existingItems) {
  return existingItems.find((existing) => existing.content_hash === item.content_hash);
}

// Check MASTER_DEBT for cross-references (read-only, just note matches)
function checkTdmsCrossRefs(newItems, debtItems) {
  if (debtItems.length === 0) return [];

  const crossRefs = [];

  // Build lookup by normalized file path for debt items
  const debtByFile = new Map();
  for (const debtItem of debtItems) {
    const normalizedFile = normalizeFilePath(debtItem.file || "");
    if (normalizedFile) {
      if (!debtByFile.has(normalizedFile)) {
        debtByFile.set(normalizedFile, []);
      }
      debtByFile.get(normalizedFile).push(debtItem);
    }
  }

  for (const enhItem of newItems) {
    const normalizedFile = normalizeFilePath(enhItem.file || "");
    if (!normalizedFile) continue;

    const matchingDebt = debtByFile.get(normalizedFile);
    if (matchingDebt && matchingDebt.length > 0) {
      for (const debtItem of matchingDebt) {
        crossRefs.push({
          enh_id: enhItem.id,
          enh_title: enhItem.title.substring(0, 60),
          debt_id: debtItem.id,
          debt_title: (debtItem.title || "").substring(0, 60),
          shared_file: normalizedFile,
        });
      }
    }
  }

  return crossRefs;
}

// Log intake activity
// Log intake activity (wrapped in try/catch so logging failure doesn't crash pipeline - Review #287 R5)
function logIntake(activity) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    // Symlink guard on log file (Review #290 R8)
    assertNotSymlink(LOG_FILE);
    const logEntry = {
      ...activity,
      // Timestamp AFTER spread so activity cannot overwrite it (Review #288 R6)
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Failed to write intake log: ${msg}`);
  }
}

// Print processing results (new items, duplicates, errors, format stats)
function printProcessingResults(newItems, duplicates, errors, formatStats) {
  console.log("Processing Results:\n");
  console.log(`  New items to add: ${newItems.length}`);
  console.log(`  Duplicates skipped: ${duplicates.length}`);
  console.log(`  Validation errors: ${errors.length}`);

  if (formatStats["enhancement-audit"] > 0) {
    console.log(`\n  Format Detection:`);
    console.log(`    - IMS format: ${formatStats.ims} items`);
    console.log(
      `    - Enhancement audit format: ${formatStats["enhancement-audit"]} items (mapped to IMS)`
    );
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
}

// Read dedup log and compute per-pass breakdown, review count, and cluster count
function readDedupStats(finalItems) {
  const dedupBreakdown = {};
  let reviewCount = 0;
  let clusterCount = 0;

  try {
    const dedupLogPath = path.join(IMPROVEMENTS_DIR, "logs/dedup-log.jsonl");
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
    const reviewPath = path.join(IMPROVEMENTS_DIR, "raw/review-needed.jsonl");
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
  crossRefs,
}) {
  const finalItems = viewsRan ? loadMasterImprovements() : existingItems;
  const beforeDedup = existingItems.length + newItems.length;
  const dedupRemoved = dedupRan && viewsRan ? Math.max(0, beforeDedup - finalItems.length) : 0;

  console.log("\n" + "=".repeat(60));
  console.log("  INTAKE & DEDUP REPORT");
  console.log("=".repeat(60));
  console.log(`  Input:     ${inputLines.length} findings from audit`);
  if (newItems.length > 0) {
    console.log(
      `  Ingested:  ${newItems.length} new items (${newItems[0]?.id} - ${newItems[newItems.length - 1]?.id})`
    );
  } else {
    console.log(`  Ingested:  ${newItems.length} new items`);
  }
  console.log(`  Hash dupes: ${duplicates.length} exact duplicates skipped`);
  console.log(`  Errors:    ${errors.length} validation failures`);

  if (dedupRan) {
    const { dedupBreakdown, reviewCount, clusterCount } = readDedupStats(finalItems);
    console.log("");
    console.log("  Multi-Pass Dedup:");
    const passNames = {
      pass_0: "Parametric (numbers stripped)",
      pass_1: "Exact hash match",
      pass_2: "Near match (file+line+title)",
      pass_3: "Semantic (file+title >90%)",
      pass_4: "Cross-source (cross-ref)",
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
      console.log(`     ${reviewCount} items flagged for manual review`);
    }
  }

  // Cross-reference report
  if (crossRefs && crossRefs.length > 0) {
    console.log("");
    console.log("  TDMS Cross-References (read-only):");
    console.log(`     ${crossRefs.length} improvement(s) share files with existing debt items`);
    for (const ref of crossRefs.slice(0, 10)) {
      console.log(`     ${ref.enh_id} <-> ${ref.debt_id} (${ref.shared_file})`);
    }
    if (crossRefs.length > 10) {
      console.log(`     ... and ${crossRefs.length - 10} more`);
    }
  }

  const impactCounts = {};
  for (const item of finalItems) {
    impactCounts[item.impact] = (impactCounts[item.impact] || 0) + 1;
  }

  console.log("");
  console.log("  MASTER_IMPROVEMENTS.jsonl:");
  console.log(`     Total: ${finalItems.length} items`);
  console.log(
    `     I0: ${impactCounts.I0 || 0} | I1: ${impactCounts.I1 || 0} | I2: ${impactCounts.I2 || 0} | I3: ${impactCounts.I3 || 0}`
  );
  console.log("=".repeat(60));
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node scripts/improvements/intake-audit.js <audit-output.jsonl>");
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

  console.log("Intake: Processing improvement audit output...\n");
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
    console.log("  Input file is empty. Nothing to process.");
    process.exit(0);
  }

  console.log(`  Found ${inputLines.length} items in input file\n`);

  // Load existing master improvements
  const existingItems = loadMasterImprovements();
  console.log(`  Existing MASTER_IMPROVEMENTS.jsonl: ${existingItems.length} items\n`);

  // Build map of existing content hashes to IDs for O(1) lookup
  const existingHashMap = new Map(existingItems.map((item) => [item.content_hash, item.id]));

  // Process input items
  const newItems = [];
  const duplicates = [];
  const errors = [];
  let nextId = getNextEnhId(existingItems);

  // Track enhancement audit format statistics
  const formatStats = {
    ims: 0,
    "enhancement-audit": 0,
    mappings: {},
    confidenceLogs: [],
  };

  for (let i = 0; i < inputLines.length; i++) {
    const rawLine = inputLines[i];
    // Strip BOM from first line + handle CRLF (Review #287 R5 + Review #286 R4)
    const line = (i === 0 ? rawLine.replace(/^\uFEFF/, "") : rawLine).trimEnd();
    try {
      const inputItem = JSON.parse(line);

      if (!inputItem || typeof inputItem !== "object" || Array.isArray(inputItem)) {
        errors.push({
          line: i + 1,
          errors: [
            `Invalid item type (expected JSON object): ${String(inputItem).substring(0, 80)}`,
          ],
        });
        continue;
      }

      // Security: sanitize parsed object to prevent prototype pollution (Review #286 R4)
      const sanitizedItem = safeCloneObject(inputItem);
      const result = validateAndNormalize(sanitizedItem, inputFile);

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
        // Log confidence values for analysis (not stored in MASTER_IMPROVEMENTS)
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

      // Assign ENH ID
      normalizedItem.id = `ENH-${String(nextId).padStart(4, "0")}`;
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
  printProcessingResults(newItems, duplicates, errors, formatStats);

  // Write new items
  if (newItems.length === 0) {
    console.log("\nNo new items to add. MASTER_IMPROVEMENTS.jsonl unchanged.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\nDRY RUN: Would add the following items:");
    for (const item of newItems.slice(0, 5)) {
      console.log(`  - ${item.id}: ${item.title.substring(0, 60)}...`);
    }
    if (newItems.length > 5) {
      console.log(`  ... and ${newItems.length - 5} more items`);
    }
    process.exit(0);
  }

  // Append new items to raw pipeline files so full dedup can process them
  console.log("\nWriting new items to pipeline...");
  if (!fs.existsSync(IMPROVEMENTS_DIR)) {
    fs.mkdirSync(IMPROVEMENTS_DIR, { recursive: true });
  }
  const newLines = newItems.map((item) => JSON.stringify(item));

  // Append to raw/normalized-all.jsonl (input for dedup-multi-pass)
  const NORMALIZED_FILE = path.join(RAW_DIR, "normalized-all.jsonl");
  fs.mkdirSync(path.dirname(NORMALIZED_FILE), { recursive: true });
  // Symlink guard: refuse to write through symlinks (Review #289 R7)
  assertNotSymlink(NORMALIZED_FILE);
  fs.appendFileSync(NORMALIZED_FILE, newLines.join("\n") + "\n");

  // Also append to raw/deduped.jsonl as fallback
  const DEDUPED_FILE = path.join(RAW_DIR, "deduped.jsonl");
  fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });
  assertNotSymlink(DEDUPED_FILE);
  fs.appendFileSync(DEDUPED_FILE, newLines.join("\n") + "\n");

  // Cross-reference with MASTER_DEBT.jsonl (read-only, just note matches)
  console.log("Checking TDMS cross-references...");
  let crossRefs = [];
  try {
    const debtItems = loadMasterDebtForCrossRef();
    if (debtItems.length > 0) {
      crossRefs = checkTdmsCrossRefs(newItems, debtItems);
      if (crossRefs.length > 0) {
        console.log(`  Found ${crossRefs.length} cross-reference(s) with MASTER_DEBT.jsonl`);
      } else {
        console.log("  No cross-references found with MASTER_DEBT.jsonl");
      }
    } else {
      console.log("  MASTER_DEBT.jsonl empty or not found, skipping cross-ref");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  Warning: Cross-reference check failed: ${msg}`);
  }

  // Log intake activity (including format statistics, confidence values, and cross-refs)
  // Hash operator identity and use basename for input_file to avoid PII in logs (Review #288 R6)
  // Non-fatal operator hashing — fallback to "unknown" if all else fails (Review #289 R7)
  let operatorHash = "unknown";
  try {
    const rawUser = String(
      os.userInfo().username || process.env.USER || process.env.USERNAME || "unknown"
    );
    operatorHash = crypto.createHash("sha256").update(rawUser).digest("hex").substring(0, 12);
  } catch {
    operatorHash = "unknown";
  }

  logIntake({
    action: "intake-audit",
    // Ingestion-only outcome; downstream pipeline results logged separately (Review #288 R6)
    outcome: errors.length === 0 ? "ingested" : "ingested_with_errors",
    operator_hash: operatorHash,
    input_file: path.basename(inputFile),
    items_processed: inputLines.length,
    items_added: newItems.length,
    duplicates_skipped: duplicates.length,
    errors: errors.length,
    first_id: newItems[0]?.id,
    last_id: newItems[newItems.length - 1]?.id,
    format_stats: {
      ims_format: formatStats.ims,
      enhancement_audit_format: formatStats["enhancement-audit"],
      mappings_applied: formatStats.mappings,
    },
    // Log confidence values for analysis
    confidence_logs: formatStats.confidenceLogs.length > 0 ? formatStats.confidenceLogs : undefined,
    // Log cross-references found
    tdms_crossrefs: crossRefs.length > 0 ? crossRefs : undefined,
  });

  // Run multi-pass dedup then regenerate views (from scripts/improvements/, not scripts/debt/)
  console.log("Running multi-pass dedup pipeline...");
  let dedupRan = false;
  try {
    execFileSync(process.execPath, [path.join(__dirname, "dedup-multi-pass.js")], {
      stdio: "inherit",
    });
    dedupRan = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `  Warning: Multi-pass dedup failed: ${msg}. Falling back to views-only regeneration.`
    );
  }

  console.log("Regenerating views...");
  let viewsRan = false;
  try {
    execFileSync(process.execPath, [path.join(__dirname, "generate-views.js")], {
      stdio: "inherit",
    });
    viewsRan = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `  Warning: Failed to regenerate views: ${msg}. Run manually: node scripts/improvements/generate-views.js`
    );
  }

  // IMS does NOT run assign-roadmap-refs.js

  // Print final intake & dedup report
  printIntakeReport({
    inputLines,
    newItems,
    duplicates,
    errors,
    existingItems,
    dedupRan,
    viewsRan,
    crossRefs,
  });
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
