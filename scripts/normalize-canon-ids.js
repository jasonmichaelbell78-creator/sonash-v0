#!/usr/bin/env node

/**
 * CANON ID Normalizer
 *
 * Normalizes CANON-*.jsonl files to use consistent CANON-XXXX ID format.
 * Maintains a global ID counter across all files to ensure uniqueness.
 *
 * Usage:
 *   node scripts/normalize-canon-ids.js [directory]
 *   node scripts/normalize-canon-ids.js docs/reviews/2026-Q1/canonical/
 *   node scripts/normalize-canon-ids.js --dry-run  # Preview changes
 *
 * The script will:
 *   1. Read all CANON-*.jsonl files in the directory
 *   2. Sort findings within each file by: severity (S0→S3), confidence (desc), effort (E0→E3)
 *   3. Assign new sequential IDs: CANON-0001, CANON-0002, ...
 *   4. Create an ID mapping file for reference
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const SEVERITY_ORDER = { S0: 0, S1: 1, S2: 2, S3: 3 };
const EFFORT_ORDER = { E0: 0, E1: 1, E2: 2, E3: 3 };

// Category order for processing (determines ID ranges)
// UNKNOWN categories are sorted to the end
const CATEGORY_ORDER = ["CODE", "SECURITY", "PERF", "REFACTOR", "DOCS", "PROCESS", "UNKNOWN"];

function getCategoryFromFilename(filename) {
  if (filename.includes("CODE")) return "CODE";
  if (filename.includes("SECURITY")) return "SECURITY";
  if (filename.includes("PERF")) return "PERF";
  if (filename.includes("REFACTOR")) return "REFACTOR";
  if (filename.includes("DOCS")) return "DOCS";
  if (filename.includes("PROCESS")) return "PROCESS";
  // Handle unknown categories - sort to end
  console.warn(`  ⚠️ Unknown category in filename: ${filename}`);
  return "UNKNOWN";
}

/**
 * Rewrites old IDs to new IDs in all string fields of a finding.
 * Handles: dependencies array, text fields that reference other findings.
 */
function rewriteIdReferences(finding, idMap) {
  // Handle dependencies array specifically
  // SECURITY: idMap is a Map to prevent prototype pollution
  if (Array.isArray(finding.dependencies)) {
    finding.dependencies = finding.dependencies.map((dep) => idMap.get(dep) || dep);
  }

  // Also check remediation.notes and other text fields that might reference IDs
  if (finding.remediation?.notes) {
    for (const [oldId, newId] of idMap.entries()) {
      finding.remediation.notes = finding.remediation.notes.replace(
        new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        newId
      );
    }
  }

  // Check severity_normalization.contingency field
  if (finding.severity_normalization?.contingency) {
    for (const [oldId, newId] of idMap.entries()) {
      finding.severity_normalization.contingency =
        finding.severity_normalization.contingency.replace(
          new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          newId
        );
    }
  }

  return finding;
}

function getConfidence(finding) {
  // Handle various confidence field names (ensure finite number to prevent NaN in sorting)
  const raw = finding.confidence ?? finding.final_confidence ?? 50;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : 50;
}

function getConsensus(finding) {
  // Handle various consensus field names and formats (ensure finite number)
  const tryNumber = (v, fallback) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  if (finding.consensus_score != null) return tryNumber(finding.consensus_score, 1);
  if (finding.consensus != null) {
    if (typeof finding.consensus === "string" && finding.consensus.includes("/")) {
      const [num] = finding.consensus.split("/");
      return tryNumber(num, 1);
    }
    return tryNumber(finding.consensus, 1);
  }
  if (finding.models_agreeing != null) return tryNumber(finding.models_agreeing, 1);

  return 1;
}

function sortFindings(findings) {
  return findings.sort((a, b) => {
    // 1. Severity (S0 first)
    const sevA = SEVERITY_ORDER[a.severity] ?? 99;
    const sevB = SEVERITY_ORDER[b.severity] ?? 99;
    if (sevA !== sevB) return sevA - sevB;

    // 2. Consensus (higher first)
    const consA = getConsensus(a);
    const consB = getConsensus(b);
    if (consA !== consB) return consB - consA;

    // 3. Confidence (higher first)
    const confA = getConfidence(a);
    const confB = getConfidence(b);
    if (confA !== confB) return confB - confA;

    // 4. Effort (lower first)
    const effA = EFFORT_ORDER[a.effort] ?? 99;
    const effB = EFFORT_ORDER[b.effort] ?? 99;
    if (effA !== effB) return effA - effB;

    // 5. Title (alphabetical)
    return (a.title || "").localeCompare(b.title || "");
  });
}

/**
 * Parse JSONL content into findings array
 * @param {string} content - Raw JSONL file content
 * @param {string} filename - Filename for error reporting
 * @param {boolean} failFast - If true, throw on parse errors (default: true for data safety)
 * @returns {{findings: Object[], parseErrors: Object[]}} Parsed findings and any errors
 * @throws {Error} If failFast is true and parse errors occur
 */
function parseJsonl(content, filename, failFast = true) {
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim());
  const findings = [];
  const parseErrors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      findings.push(JSON.parse(lines[i]));
    } catch (err) {
      // SECURITY: Do not log raw JSONL content - it may contain sensitive data
      // Only log line number, character count, and sanitized error message
      parseErrors.push({
        line: i + 1,
        error: err.message.replace(/position \d+/, "position [redacted]"),
        charCount: lines[i].length,
      });
    }
  }

  if (parseErrors.length > 0) {
    console.error(`\n  ⚠️ ${filename}: ${parseErrors.length} parse error(s):`);
    for (const err of parseErrors.slice(0, 3)) {
      // SECURITY: Only log line number and error type, not content
      console.error(`    Line ${err.line} (${err.charCount} chars): ${err.error}`);
    }
    if (parseErrors.length > 3) {
      console.error(`    ... and ${parseErrors.length - 3} more`);
    }

    // SAFETY: Fail-fast to prevent silent data loss during normalization
    // Malformed lines would be dropped without this check
    if (failFast) {
      throw new Error(
        `${filename}: Aborting due to ${parseErrors.length} parse error(s). Fix JSONL syntax before normalizing.`
      );
    }
  }

  return { findings, parseErrors };
}

function toJsonl(findings) {
  return findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
}

/**
 * Find and sort CANON files by category order
 */
function findCanonFiles(directory) {
  const files = readdirSync(directory)
    .filter((f) => f.startsWith("CANON-") && f.endsWith(".jsonl"))
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(getCategoryFromFilename(a));
      const catB = CATEGORY_ORDER.indexOf(getCategoryFromFilename(b));
      if (catA === -1 && catB === -1) return a.localeCompare(b);
      if (catA === -1) return 1;
      if (catB === -1) return -1;
      return catA - catB;
    });
  return files;
}

/**
 * Process a single CANON file for pass 1 (build ID mapping)
 */
function processFileForMapping(filepath, filename, idMap, idMapping, globalCounter, verbose) {
  const category = getCategoryFromFilename(filename);

  let content;
  try {
    content = readFileSync(filepath, "utf-8");
  } catch (err) {
    // Review #187: Use instanceof Error for safe message access
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  Error reading ${filename}: ${message}`);
    return { findings: null, counter: globalCounter };
  }

  const { findings } = parseJsonl(content, filename);
  if (findings.length === 0) {
    console.warn(`  ⚠️ ${filename}: No valid findings`);
    return { findings: null, counter: globalCounter };
  }

  const sortedFindings = sortFindings(findings);
  let counter = globalCounter;

  const mappedFindings = sortedFindings.map((finding, idx) => {
    const oldId = finding.canonical_id;

    // Review #192: Type-safe title preview to prevent crash on malformed data
    const titlePreview =
      typeof finding.title === "string"
        ? `${finding.title.substring(0, 50)}...`
        : "<non-string title>";

    if (typeof oldId !== "string" || oldId.trim() === "") {
      console.warn(
        `  ⚠️ ${filename} finding #${idx + 1}: Missing/invalid canonical_id (title: "${titlePreview}")`
      );
    }

    const effectiveOldId = typeof oldId === "string" && oldId.trim() ? oldId : `MISSING-${counter}`;
    const newId = `CANON-${String(counter).padStart(4, "0")}`;

    // Duplicate ID detection
    if (idMap.has(effectiveOldId)) {
      console.error(
        `  ❌ ${filename} finding #${idx + 1}: Duplicate canonical_id "${effectiveOldId}" would remap ${idMap.get(effectiveOldId)} -> ${newId}`
      );
      // Include filename and finding index in error for CI log debugging (Review #184 - Qodo)
      throw new Error(
        `Duplicate canonical_id detected in ${filename} (finding #${idx + 1}): ${effectiveOldId}`
      );
    }

    idMap.set(effectiveOldId, newId);
    idMapping.push({
      old_id: effectiveOldId,
      new_id: newId,
      category,
      title: finding.title,
      severity: finding.severity,
    });

    counter++;
    return { ...finding, canonical_id: newId };
  });

  return { findings: mappedFindings, counter, category };
}

/**
 * PASS 1: Build ID mapping for all findings across all files
 */
function buildIdMapping(files, directory, verbose) {
  const idMapping = [];
  // SECURITY: Use Map instead of plain object to prevent prototype pollution
  const idMap = new Map(); // old_id -> new_id lookup
  let globalCounter = 1;
  const fileData = []; // Store parsed data for pass 2

  for (const filename of files) {
    const filepath = join(directory, filename);
    // Review #187: Wrap in try/catch to handle duplicate ID errors gracefully
    try {
      const result = processFileForMapping(
        filepath,
        filename,
        idMap,
        idMapping,
        globalCounter,
        verbose
      );

      if (result.findings) {
        fileData.push({ filepath, filename, category: result.category, findings: result.findings });
        globalCounter = result.counter;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n❌ Failed while processing ${filename}: ${message}`);
      process.exit(2);
    }
  }

  return { idMapping, idMap, globalCounter, fileData };
}

/**
 * PASS 2: Rewrite ID references using the complete mapping
 */
function rewriteAllIdReferences(fileData, idMap, dryRun, verbose) {
  let referencesUpdated = 0;

  for (const { filepath, filename, category, findings } of fileData) {
    console.log(`\n  ${filename} (${category})`);

    const updatedFindings = findings.map((finding) => {
      const before = JSON.stringify(finding);
      const updated = rewriteIdReferences(finding, idMap);
      const after = JSON.stringify(updated);
      if (before !== after) {
        referencesUpdated++;
        if (verbose) {
          console.log(`    ${updated.canonical_id}: Updated references`);
        }
      }
      return updated;
    });

    if (dryRun) {
      console.log(`    Would update ${updatedFindings.length} findings`);
    } else {
      try {
        writeFileSync(filepath, toJsonl(updatedFindings));
        console.log(`    ✓ Updated ${updatedFindings.length} findings`);
      } catch (err) {
        console.error(`    Error writing ${filename}: ${err.message}`);
      }
    }
  }

  return referencesUpdated;
}

/**
 * Write the ID mapping file to disk
 */
function writeIdMappingFile(directory, globalCounter, idMapping, dryRun) {
  if (dryRun) return;

  const mappingPath = join(directory, "ID_MAPPING.json");
  const mappingContent = {
    generated: new Date().toISOString(),
    total_findings: globalCounter - 1,
    mapping: idMapping,
  };

  try {
    writeFileSync(mappingPath, JSON.stringify(mappingContent, null, 2));
    console.log(`\n✓ ID mapping saved to ${mappingPath}`);
  } catch (err) {
    console.error(`Error writing ID mapping: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Print normalization summary
 */
function printNormalizationSummary(fileCount, globalCounter, dryRun) {
  console.log("\n" + "=".repeat(50));
  console.log("SUMMARY");
  console.log("=".repeat(50));
  console.log(`Files processed: ${fileCount}`);
  console.log(`Findings renumbered: ${globalCounter - 1}`);
  console.log(`ID range: CANON-0001 to CANON-${String(globalCounter - 1).padStart(4, "0")}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No files were modified. Run without --dry-run to apply changes.");
  }
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dryRun = process.argv.includes("--dry-run");
  const verbose = process.argv.includes("--verbose");

  const directory = args[0] || "docs/reviews/2026-Q1/canonical";

  if (!existsSync(directory)) {
    console.error(`Error: Directory not found: ${directory}`);
    process.exit(2);
  }

  let files;
  try {
    files = findCanonFiles(directory);
  } catch (err) {
    // Review #189: Defensive error message access
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error reading directory: ${message}`);
    process.exit(2);
  }

  if (files.length === 0) {
    console.log("No CANON-*.jsonl files found.");
    process.exit(0);
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Processing ${files.length} CANON files...`);

  // PASS 1: Build ID mapping for all findings
  console.log("\nPass 1: Building ID mapping...");
  const { idMapping, idMap, globalCounter, fileData } = buildIdMapping(files, directory, verbose);

  // PASS 2: Rewrite ID references using the complete mapping
  console.log("\nPass 2: Rewriting ID references...");
  const referencesUpdated = rewriteAllIdReferences(fileData, idMap, dryRun, verbose);

  if (referencesUpdated > 0) {
    console.log(`\n  ✓ Rewrote ${referencesUpdated} ID reference(s)`);
  }

  // Write ID mapping file
  writeIdMappingFile(directory, globalCounter, idMapping, dryRun);

  // Summary
  printNormalizationSummary(files.length, globalCounter, dryRun);
}

main();
