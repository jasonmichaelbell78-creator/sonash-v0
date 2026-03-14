#!/usr/bin/env node
/**
 * refine-scaffolds.js — Classify scaffolded routes and promote or refine them
 *
 * Reads all "scaffolded" entries from learning-routes.jsonl, runs each through
 * the confidence-classifier, then:
 *
 * - High confidence → Updates status to "enforced", populates enforcement_test
 *   and metrics fields, writes updated entry back to learning-routes.jsonl
 * - Low confidence  → Updates status to "refined", appends to pending-refinements.jsonl
 *
 * Part of Automation Gap Closure (spec: 2026-03-14)
 *
 * Usage:
 *   node scripts/refine-scaffolds.js [--dry-run] [--json]
 */

/* global __dirname */
const path = require("node:path");
const fs = require("node:fs");

let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(__dirname, "lib", "security-helpers.js")));
} catch {
  sanitizeError = () => "error (details redacted — security-helpers unavailable)";
}

const { safeWriteFileSync, safeAppendFileSync } = require(
  path.join(__dirname, "lib", "safe-fs.js")
);

const { classify } = require(path.join(__dirname, "lib", "confidence-classifier.js"));

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_ROUTES_PATH = path.join(PROJECT_ROOT, ".claude", "state", "learning-routes.jsonl");
const DEFAULT_PENDING_PATH = path.join(
  PROJECT_ROOT,
  ".claude",
  "state",
  "pending-refinements.jsonl"
);

// ---------------------------------------------------------------------------
// JSONL I/O helpers
// ---------------------------------------------------------------------------

/**
 * Read all lines from a JSONL file. Returns empty array if file is missing or empty.
 * Wraps in try/catch per CLAUDE.md Section 5 (file reads must be wrapped).
 *
 * @param {string} filePath
 * @returns {object[]}
 */
function readJsonl(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const lines = content.split("\n").filter((l) => l.trim());
  const entries = [];
  let malformed = 0;
  let invalid = 0;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      // Validate: entries must be objects with required fields
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.id) {
        invalid++;
        continue;
      }
      entries.push(parsed);
    } catch {
      malformed++;
    }
  }
  if (malformed > 0 || invalid > 0) {
    console.error(
      `[refine-scaffolds] Warning: ${malformed} malformed, ${invalid} invalid line(s) skipped in ${path.basename(filePath)}`
    );
  }
  return entries;
}

/**
 * Write entries back to a JSONL file (overwrite).
 *
 * @param {string} filePath
 * @param {object[]} entries
 */
function writeJsonl(filePath, entries) {
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  safeWriteFileSync(filePath, content, { encoding: "utf-8" });
}

/**
 * Append a single entry to a JSONL file (create if missing).
 *
 * @param {string} filePath
 * @param {object} entry
 */
function appendJsonl(filePath, entry) {
  const line = JSON.stringify(entry) + "\n";
  safeAppendFileSync(filePath, line, { encoding: "utf-8" });
}

// ---------------------------------------------------------------------------
// Core processing
// ---------------------------------------------------------------------------

/**
 * Build an enforcement_test placeholder path for a high-confidence entry.
 *
 * @param {string} id
 * @returns {string}
 */
function buildEnforcementTestPath(id) {
  const safeId = String(id || "unknown")
    .toLowerCase()
    .replaceAll(/[^a-z0-9_-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return `tests/enforcement/check-${safeId || "unknown"}.test.js`;
}

/**
 * Build the initial metrics snapshot for a newly enforced entry.
 *
 * @returns {{ violations_before: number, violations_after: null }}
 */
function buildInitialMetrics() {
  return { violations_before: 0, violations_after: null };
}

/**
 * Build a pending-refinements.jsonl entry for a low-confidence route.
 *
 * @param {object} entry - The learning-routes entry
 * @param {{ confidence: string, reason: string }} classification
 * @returns {object}
 */
function buildPendingEntry(entry, classification) {
  return {
    id: entry.id,
    route_type: entry.route,
    pattern: entry.learning?.pattern ?? "",
    generated_code: entry.scaffold?.generatedCode ?? null,
    confidence: classification.confidence,
    reason: classification.reason,
    surfaced_count: 0,
    created: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Run the refine-scaffolds pipeline.
 *
 * @param {object} options
 * @param {string} [options.routesPath] - Path to learning-routes.jsonl
 * @param {string} [options.pendingPath] - Path to pending-refinements.jsonl
 * @param {boolean} [options.dryRun]    - If true, read-only: no writes
 * @param {boolean} [options.json]      - If true, print JSON summary to stdout
 * @returns {{ success: boolean, promoted: number, refined: number, skipped: number }}
 */
function run(options = {}) {
  const routesPath = options.routesPath || DEFAULT_ROUTES_PATH;
  const pendingPath = options.pendingPath || DEFAULT_PENDING_PATH;
  const dryRun = options.dryRun || false;
  const json = options.json || false;

  // Read entries — missing file is treated as empty (not an error)
  let entries;
  try {
    entries = readJsonl(routesPath);
  } catch (error) {
    console.error(`Failed to read learning-routes.jsonl: ${sanitizeError(error)}`);
    return { success: false, promoted: 0, refined: 0, skipped: 0 };
  }

  if (entries.length === 0) {
    console.log("No entries in learning-routes.jsonl.");
    return { success: true, promoted: 0, refined: 0, skipped: 0 };
  }

  let promoted = 0;
  let refined = 0;
  let skipped = 0;
  const promotedIds = [];
  const refinedIds = [];
  const pendingToAppend = [];

  const updatedEntries = entries.map((entry) => {
    // Only process "scaffolded" entries
    if (entry.status !== "scaffolded") {
      skipped++;
      return entry;
    }

    const classification = classify(entry);

    if (classification.confidence === "high") {
      // Promote to enforced (test + metrics start null; verify-enforcement skips until populated)
      const updated = {
        ...entry,
        status: "enforced",
        enforcement_test: null,
        metrics: null,
        _pending_test: buildEnforcementTestPath(entry.id),
        refined_at: new Date().toISOString(),
        classification: {
          confidence: classification.confidence,
          reason: classification.reason,
          action: classification.action,
        },
      };
      promoted++;
      promotedIds.push(entry.id);
      return updated;
    } else {
      // Low confidence → refined
      const updated = {
        ...entry,
        status: "refined",
        refined_at: new Date().toISOString(),
        classification: {
          confidence: classification.confidence,
          reason: classification.reason,
          action: classification.action,
        },
      };

      pendingToAppend.push(buildPendingEntry(entry, classification));

      refined++;
      refinedIds.push(entry.id);
      return updated;
    }
  });

  if (!dryRun) {
    // Write routes first (atomic); only then append pending entries
    try {
      writeJsonl(routesPath, updatedEntries);
    } catch (error) {
      console.error(`Failed to write learning-routes.jsonl: ${sanitizeError(error)}`);
      return { success: false, promoted, refined, skipped };
    }

    // Audit trail: log state mutation (Review #432 R2)
    console.error(
      `[refine-scaffolds] Wrote ${updatedEntries.length} entries to ${path.basename(routesPath)} ` +
        `(promoted=${promoted}, refined=${refined}, skipped=${skipped}) at ${new Date().toISOString()}`
    );

    // Routes persisted — now safe to append pending entries
    let appendFailures = 0;
    for (const pending of pendingToAppend) {
      try {
        appendJsonl(pendingPath, pending);
      } catch (error) {
        appendFailures++;
        console.error(`Failed to append to pending-refinements.jsonl: ${sanitizeError(error)}`);
      }
    }
    if (appendFailures > 0) {
      return { success: false, promoted, refined, skipped };
    }
  }

  const summary = {
    success: true,
    promoted,
    refined,
    skipped,
    dryRun,
    promotedIds,
    refinedIds,
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (dryRun) {
    console.log(
      `Dry run: ${promoted} would be promoted to 'enforced', ` +
        `${refined} to 'refined', ${skipped} skipped.`
    );
  } else {
    console.log(`Promoted: ${promoted} | Refined: ${refined} | Skipped: ${skipped}`);
  }

  return { success: true, promoted, refined, skipped };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const json = args.has("--json");

  const result = run({ dryRun, json });
  if (!result.success) {
    process.exitCode = 1;
  }
}

module.exports = { run, readJsonl, writeJsonl, appendJsonl, buildPendingEntry };
