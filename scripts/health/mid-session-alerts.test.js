/**
 * Tests for mid-session alert system.
 *
 * Uses node:test with temp directories for JSONL file isolation.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let _safeFsModule;
try {
  _safeFsModule = require("../lib/safe-fs");
} catch {
  _safeFsModule = null;
}
const safeWriteFileSync = _safeFsModule
  ? _safeFsModule.safeWriteFileSync
  : (_p, _d) => {
      throw new Error("safe-fs unavailable");
    };

// Dynamic import of ESM module
let runMidSessionChecks;

describe("mid-session-alerts", () => {
  let tmpDir;
  let opts;

  beforeEach(async () => {
    // Load module
    if (!runMidSessionChecks) {
      const mod = await import("./lib/mid-session-alerts.js");
      runMidSessionChecks = mod.runMidSessionChecks;
    }

    // Create temp directory
    tmpDir = mkdtempSync(join(tmpdir(), "mid-session-alerts-"));
    opts = {
      deferredPath: join(tmpDir, "deferred-items.jsonl"),
      healthLogPath: join(tmpDir, "ecosystem-health-log.jsonl"),
      cooldownPath: join(tmpDir, "alerts-cooldown.json"),
      warningsPath: join(tmpDir, "warnings.jsonl"),
      skipSideEffects: true,
    };
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  it("detects deferred items older than 30 days", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const oldDateStr = oldDate.toISOString().slice(0, 10);

    const items = [
      { id: "d-1", title: "Old item", category: "debt", date: oldDateStr, lifecycle: "open" },
      {
        id: "d-2",
        title: "Another old",
        category: "security",
        date: oldDateStr,
        lifecycle: "in-progress",
      },
    ];
    safeWriteFileSync(opts.deferredPath, items.map((i) => JSON.stringify(i)).join("\n") + "\n");

    const result = runMidSessionChecks(opts);

    assert.equal(result.alerts.length, 1);
    assert.equal(result.alerts[0].type, "deferred-aging");
    assert.ok(result.alerts[0].message.includes("2 deferred item(s)"));
    assert.equal(result.alerts[0].severity, "warning");
  });

  it("does not alert for recent deferred items", () => {
    const recentDate = new Date().toISOString().slice(0, 10);

    const items = [
      { id: "d-1", title: "Recent item", category: "debt", date: recentDate, lifecycle: "open" },
    ];
    safeWriteFileSync(opts.deferredPath, items.map((i) => JSON.stringify(i)).join("\n") + "\n");

    const result = runMidSessionChecks(opts);

    // No deferred-aging alert (item is recent)
    const agingAlerts = result.alerts.filter((a) => a.type === "deferred-aging");
    assert.equal(agingAlerts.length, 0);
  });

  it("detects duplicate deferred items within 7 days", () => {
    const recentDate = new Date().toISOString().slice(0, 10);

    const items = [
      { id: "d-1", title: "Fix auth bug", category: "security", date: recentDate },
      { id: "d-2", title: "Fix auth bug", category: "security", date: recentDate },
      { id: "d-3", title: "Fix auth bug", category: "security", date: recentDate },
    ];
    safeWriteFileSync(opts.deferredPath, items.map((i) => JSON.stringify(i)).join("\n") + "\n");

    const result = runMidSessionChecks(opts);

    const dupAlerts = result.alerts.filter((a) => a.type === "duplicate-deferrals");
    assert.equal(dupAlerts.length, 1);
    assert.ok(dupAlerts[0].message.includes("2 duplicate"));
  });

  it("detects score degradation of 10+ points", () => {
    const entries = [
      { timestamp: "2026-02-28T10:00:00Z", score: 85, grade: "B" },
      { timestamp: "2026-03-01T10:00:00Z", score: 70, grade: "C" },
    ];
    safeWriteFileSync(opts.healthLogPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");

    const result = runMidSessionChecks(opts);

    const degradeAlerts = result.alerts.filter((a) => a.type === "score-degradation");
    assert.equal(degradeAlerts.length, 1);
    assert.ok(degradeAlerts[0].message.includes("dropped 15"));
    assert.equal(degradeAlerts[0].severity, "error");
  });

  it("does not alert for stable or improving scores", () => {
    const entries = [
      { timestamp: "2026-02-28T10:00:00Z", score: 80, grade: "B" },
      { timestamp: "2026-03-01T10:00:00Z", score: 82, grade: "B" },
    ];
    safeWriteFileSync(opts.healthLogPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");

    const result = runMidSessionChecks(opts);

    const degradeAlerts = result.alerts.filter((a) => a.type === "score-degradation");
    assert.equal(degradeAlerts.length, 0);
  });

  it("respects cooldown - same alert type within 1 hour is skipped", () => {
    // Set up aged deferred items
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const oldDateStr = oldDate.toISOString().slice(0, 10);

    const items = [
      { id: "d-1", title: "Old item", category: "debt", date: oldDateStr, lifecycle: "open" },
    ];
    safeWriteFileSync(opts.deferredPath, items.map((i) => JSON.stringify(i)).join("\n") + "\n");

    // Set cooldown: deferred-aging fired 30 minutes ago
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    safeWriteFileSync(opts.cooldownPath, JSON.stringify({ "deferred-aging": thirtyMinAgo }));

    const result = runMidSessionChecks(opts);

    // Should be skipped due to cooldown
    const agingAlerts = result.alerts.filter((a) => a.type === "deferred-aging");
    assert.equal(agingAlerts.length, 0);
    assert.equal(result.skipped, 1);
  });

  it("returns empty alerts array when all checks pass", () => {
    // No deferred items, no health log = all checks pass
    const result = runMidSessionChecks(opts);

    assert.deepEqual(result.alerts, []);
    assert.equal(result.skipped, 0);
  });
});
