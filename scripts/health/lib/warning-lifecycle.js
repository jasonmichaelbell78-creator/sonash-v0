/**
 * Warning lifecycle management for data/ecosystem-v2/warnings.jsonl.
 *
 * Manages warnings through lifecycle states: new -> acknowledged -> resolved,
 * with auto-stale detection for aged warnings.
 */

import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Compiled TS modules from scripts/reviews/dist/
const { appendRecord } = require("../../reviews/dist/lib/write-jsonl");
const { readValidatedJsonl } = require("../../reviews/dist/lib/read-jsonl");
const { WarningRecord } = require("../../reviews/dist/lib/schemas/warning");
const { isSafeToWrite } = require("../../lib/safe-fs");

// Walk up from __dirname to find project root (same pattern used throughout codebase)
function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (existsSync(join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const DEFAULT_WARNINGS_PATH = join(PROJECT_ROOT, "data", "ecosystem-v2", "warnings.jsonl");

/**
 * Resolve warnings file path, using optional override or default.
 * @param {object} [opts]
 * @param {string} [opts.warningsPath]
 * @returns {string}
 */
function resolveWarningsPath(opts) {
  return opts && opts.warningsPath ? resolve(opts.warningsPath) : DEFAULT_WARNINGS_PATH;
}

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string}
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Read all warning records from the JSONL file.
 * Returns empty array if file doesn't exist.
 * @param {string} filePath
 * @returns {Array}
 */
function readAll(filePath) {
  const { valid } = readValidatedJsonl(filePath, WarningRecord, {
    quiet: true,
  });
  return valid;
}

/**
 * Write all records back to the warnings file (full rewrite).
 * Used for acknowledge/resolve/stale transitions.
 * @param {string} filePath
 * @param {Array} records
 */
function writeAll(filePath, records) {
  const absPath = resolve(filePath);

  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to write to unsafe path: ${basename(absPath)}`);
  }

  mkdirSync(dirname(absPath), { recursive: true });

  const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  writeFileSync(absPath, lines, "utf8");
}

/**
 * Create a new warning record and append it to warnings.jsonl.
 *
 * @param {object} params
 * @param {string} params.category - Warning category
 * @param {string} params.message - Warning message
 * @param {string} params.severity - "info" | "warning" | "error"
 * @param {string} [params.source_script] - Script that generated the warning
 * @param {string[]} [params.related_ids] - Related record IDs
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {object} The created WarningRecord
 */
export function createWarning({ category, message, severity, source_script, related_ids }, opts) {
  const filePath = resolveWarningsPath(opts);

  const record = {
    id: `warn-${Date.now()}`,
    date: today(),
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: {
      type: "manual",
      tool: source_script || "health-check",
    },
    category,
    message,
    severity,
    lifecycle: "new",
    resolved_date: null,
    source_script: source_script || null,
    related_ids: related_ids || null,
  };

  appendRecord(filePath, record, WarningRecord);
  return record;
}

/**
 * Transition a warning from "new" to "acknowledged".
 *
 * @param {string} warningId - The warning ID to acknowledge
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {object|null} Updated record, or null if not found
 */
export function acknowledgeWarning(warningId, opts) {
  const filePath = resolveWarningsPath(opts);
  const records = readAll(filePath);

  const idx = records.findIndex((r) => r.id === warningId);
  if (idx === -1) return null;

  records[idx] = { ...records[idx], lifecycle: "acknowledged" };
  writeAll(filePath, records);
  return records[idx];
}

/**
 * Transition a warning to "resolved" with today's resolved_date.
 *
 * @param {string} warningId - The warning ID to resolve
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {object|null} Updated record, or null if not found
 */
export function resolveWarning(warningId, opts) {
  const filePath = resolveWarningsPath(opts);
  const records = readAll(filePath);

  const idx = records.findIndex((r) => r.id === warningId);
  if (idx === -1) return null;

  records[idx] = {
    ...records[idx],
    lifecycle: "resolved",
    resolved_date: today(),
  };
  writeAll(filePath, records);
  return records[idx];
}

/**
 * Mark warnings older than thresholdDays as "stale".
 * Only affects warnings with lifecycle "new" or "acknowledged".
 *
 * @param {number} [thresholdDays=30] - Days before marking stale
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {Array} Array of records that were marked stale
 */
export function markStale(thresholdDays = 30, opts) {
  const filePath = resolveWarningsPath(opts);
  const records = readAll(filePath);

  if (records.length === 0) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const staleRecords = [];
  let changed = false;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if ((r.lifecycle === "new" || r.lifecycle === "acknowledged") && r.date <= cutoffStr) {
      records[i] = { ...r, lifecycle: "stale" };
      staleRecords.push(records[i]);
      changed = true;
    }
  }

  if (changed) {
    writeAll(filePath, records);
  }

  return staleRecords;
}

/**
 * Query warnings by lifecycle, category, and/or severity.
 *
 * @param {object} [filters]
 * @param {string} [filters.lifecycle] - Filter by lifecycle state
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.severity] - Filter by severity
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {Array} Matching WarningRecord objects
 */
export function queryWarnings(filters, opts) {
  const filePath = resolveWarningsPath(opts);
  const records = readAll(filePath);

  if (!filters) return records;

  return records.filter((r) => {
    if (filters.lifecycle && r.lifecycle !== filters.lifecycle) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.severity && r.severity !== filters.severity) return false;
    return true;
  });
}

/**
 * Get summary statistics for all warnings.
 *
 * @param {object} [opts]
 * @param {string} [opts.warningsPath] - Override default warnings.jsonl path
 * @returns {object} Stats with total, byLifecycle, bySeverity, oldestUnresolved
 */
export function getWarningStats(opts) {
  const filePath = resolveWarningsPath(opts);
  const records = readAll(filePath);

  const stats = {
    total: records.length,
    byLifecycle: { new: 0, acknowledged: 0, resolved: 0, stale: 0 },
    bySeverity: { error: 0, warning: 0, info: 0 },
    oldestUnresolved: null,
  };

  for (const r of records) {
    if (r.lifecycle in stats.byLifecycle) {
      stats.byLifecycle[r.lifecycle]++;
    }
    if (r.severity in stats.bySeverity) {
      stats.bySeverity[r.severity]++;
    }

    // Track oldest unresolved
    if (r.lifecycle !== "resolved") {
      if (stats.oldestUnresolved === null || r.date < stats.oldestUnresolved) {
        stats.oldestUnresolved = r.date;
      }
    }
  }

  return stats;
}
