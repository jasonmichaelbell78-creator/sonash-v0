/**
 * Tests for warning lifecycle management.
 * Uses node:test (project convention) with isolated temp directories.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { safeWriteFileSync } = require("../../lib/safe-fs");

import {
  createWarning,
  acknowledgeWarning,
  resolveWarning,
  markStale,
  queryWarnings,
  getWarningStats,
} from "./warning-lifecycle.js";

let tmpDir;
let warningsPath;

describe("warning-lifecycle", () => {
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "warn-test-"));
    warningsPath = join(tmpDir, "warnings.jsonl");
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  it("createWarning writes a valid record with lifecycle 'new'", () => {
    const result = createWarning(
      {
        category: "data-quality",
        message: "Missing required field in review",
        severity: "warning",
        source_script: "health-check",
      },
      { warningsPath }
    );

    assert.equal(result.lifecycle, "new");
    assert.equal(result.category, "data-quality");
    assert.equal(result.severity, "warning");
    assert.ok(result.id.startsWith("warn-"));
    assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);

    // Verify file was created with content
    const content = readFileSync(warningsPath, "utf8").trim();
    const parsed = JSON.parse(content);
    assert.equal(parsed.id, result.id);
  });

  it("createWarning generates unique IDs for multiple warnings", () => {
    const w1 = createWarning(
      { category: "test", message: "First", severity: "info" },
      { warningsPath }
    );
    // Small delay to ensure Date.now() differs
    const w2 = createWarning(
      { category: "test", message: "Second", severity: "info" },
      { warningsPath }
    );

    assert.notEqual(w1.id, w2.id);

    // Both should be in the file
    const lines = readFileSync(warningsPath, "utf8").trim().split("\n");
    assert.equal(lines.length, 2);
  });

  it("acknowledgeWarning transitions lifecycle from 'new' to 'acknowledged'", () => {
    const created = createWarning(
      { category: "test", message: "Test warning", severity: "warning" },
      { warningsPath }
    );

    const updated = acknowledgeWarning(created.id, { warningsPath });

    assert.ok(updated);
    assert.equal(updated.lifecycle, "acknowledged");
    assert.equal(updated.id, created.id);

    // Verify persisted
    const all = queryWarnings(null, { warningsPath });
    assert.equal(all.length, 1);
    assert.equal(all[0].lifecycle, "acknowledged");
  });

  it("acknowledgeWarning returns null for non-existent ID", () => {
    createWarning({ category: "test", message: "Exists", severity: "info" }, { warningsPath });

    const result = acknowledgeWarning("warn-nonexistent", { warningsPath });
    assert.equal(result, null);
  });

  it("resolveWarning sets lifecycle 'resolved' and resolved_date", () => {
    const created = createWarning(
      { category: "test", message: "To resolve", severity: "error" },
      { warningsPath }
    );

    const updated = resolveWarning(created.id, { warningsPath });

    assert.ok(updated);
    assert.equal(updated.lifecycle, "resolved");
    assert.match(updated.resolved_date, /^\d{4}-\d{2}-\d{2}$/);

    // Verify persisted
    const all = queryWarnings(null, { warningsPath });
    assert.equal(all[0].lifecycle, "resolved");
    assert.ok(all[0].resolved_date);
  });

  it("markStale marks old warnings as stale", () => {
    // Create a warning, then manually rewrite with an old date
    const created = createWarning(
      { category: "test", message: "Old warning", severity: "warning" },
      { warningsPath }
    );

    // Rewrite with date 60 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const oldDateStr = oldDate.toISOString().slice(0, 10);

    const content = readFileSync(warningsPath, "utf8").trim();
    const record = JSON.parse(content);
    record.date = oldDateStr;
    safeWriteFileSync(warningsPath, JSON.stringify(record) + "\n", "utf8");

    const staleResults = markStale(30, { warningsPath });

    assert.equal(staleResults.length, 1);
    assert.equal(staleResults[0].lifecycle, "stale");
    assert.equal(staleResults[0].id, created.id);
  });

  it("queryWarnings filters by lifecycle state", () => {
    createWarning({ category: "cat-a", message: "W1", severity: "info" }, { warningsPath });
    const w2 = createWarning(
      { category: "cat-b", message: "W2", severity: "error" },
      { warningsPath }
    );
    acknowledgeWarning(w2.id, { warningsPath });

    const newOnly = queryWarnings({ lifecycle: "new" }, { warningsPath });
    assert.equal(newOnly.length, 1);
    assert.equal(newOnly[0].message, "W1");

    const ackOnly = queryWarnings({ lifecycle: "acknowledged" }, { warningsPath });
    assert.equal(ackOnly.length, 1);
    assert.equal(ackOnly[0].message, "W2");
  });

  it("queryWarnings filters by category and severity", () => {
    createWarning(
      { category: "data-quality", message: "DQ1", severity: "warning" },
      { warningsPath }
    );
    createWarning({ category: "pipeline", message: "P1", severity: "error" }, { warningsPath });
    createWarning({ category: "data-quality", message: "DQ2", severity: "info" }, { warningsPath });

    const byCategory = queryWarnings({ category: "data-quality" }, { warningsPath });
    assert.equal(byCategory.length, 2);

    const bySeverity = queryWarnings({ severity: "error" }, { warningsPath });
    assert.equal(bySeverity.length, 1);
    assert.equal(bySeverity[0].category, "pipeline");

    const combined = queryWarnings(
      { category: "data-quality", severity: "warning" },
      { warningsPath }
    );
    assert.equal(combined.length, 1);
    assert.equal(combined[0].message, "DQ1");
  });

  it("getWarningStats returns correct counts by lifecycle and severity", () => {
    createWarning({ category: "a", message: "W1", severity: "info" }, { warningsPath });
    createWarning({ category: "b", message: "W2", severity: "warning" }, { warningsPath });
    const w3 = createWarning({ category: "c", message: "W3", severity: "error" }, { warningsPath });
    const w4 = createWarning(
      { category: "d", message: "W4", severity: "warning" },
      { warningsPath }
    );

    acknowledgeWarning(w3.id, { warningsPath });
    resolveWarning(w4.id, { warningsPath });

    const stats = getWarningStats({ warningsPath });

    assert.equal(stats.total, 4);
    assert.equal(stats.byLifecycle.new, 2);
    assert.equal(stats.byLifecycle.acknowledged, 1);
    assert.equal(stats.byLifecycle.resolved, 1);
    assert.equal(stats.byLifecycle.stale, 0);
    assert.equal(stats.bySeverity.info, 1);
    assert.equal(stats.bySeverity.warning, 2);
    assert.equal(stats.bySeverity.error, 1);
    assert.ok(stats.oldestUnresolved); // should have a date string
  });
});
