/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests — history append/read, baseline save/load.
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { createStateManager } = require("../lib/state-manager");

describe("State Manager", () => {
  let tmpDir;
  let stateManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hms-state-test-"));
    // Create .claude/state/ structure
    fs.mkdirSync(path.join(tmpDir, ".claude", "state"), { recursive: true });
    stateManager = createStateManager(tmpDir, () => true);
  });

  afterEach(() => {
    try {
      if (typeof tmpDir === "string" && tmpDir.length > 0) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {
      // cleanup best-effort
    }
  });

  describe("readEntries", () => {
    it("returns empty array when no state file", () => {
      const entries = stateManager.readEntries();
      assert.deepEqual(entries, []);
    });

    it("reads valid JSONL entries", () => {
      const stateFile = path.join(
        tmpDir,
        ".claude",
        "state",
        "health-ecosystem-audit-history.jsonl"
      );
      const entry = { timestamp: "2026-03-10T00:00:00Z", healthScore: { score: 85, grade: "B" } };
      fs.writeFileSync(stateFile, JSON.stringify(entry) + "\n");

      const entries = stateManager.readEntries();
      assert.equal(entries.length, 1);
      assert.equal(entries[0].healthScore.score, 85);
    });

    it("filters out corrupt lines", () => {
      const stateFile = path.join(
        tmpDir,
        ".claude",
        "state",
        "health-ecosystem-audit-history.jsonl"
      );
      fs.writeFileSync(stateFile, '{"valid":true}\nnot-json\n{"also":"valid"}\n');

      const entries = stateManager.readEntries();
      assert.equal(entries.length, 2);
    });
  });

  describe("appendEntry", () => {
    it("creates state file and appends entry", () => {
      const entry = { timestamp: "2026-03-10T01:00:00Z", healthScore: { score: 90 } };
      const result = stateManager.appendEntry(entry);
      assert.equal(result, true);

      const entries = stateManager.readEntries();
      assert.equal(entries.length, 1);
      assert.equal(entries[0].healthScore.score, 90);
    });

    it("appends multiple entries", () => {
      stateManager.appendEntry({ timestamp: "t1", healthScore: { score: 80 } });
      stateManager.appendEntry({ timestamp: "t2", healthScore: { score: 85 } });
      stateManager.appendEntry({ timestamp: "t3", healthScore: { score: 90 } });

      const entries = stateManager.readEntries();
      assert.equal(entries.length, 3);
    });

    it("returns false when symlink guard fails", () => {
      const guardedManager = createStateManager(tmpDir, () => false);
      const result = guardedManager.appendEntry({ timestamp: "t1" });
      assert.equal(result, false);
    });
  });

  describe("getCompositeHistory", () => {
    it("returns scores from recent entries", () => {
      stateManager.appendEntry({ timestamp: "t1", healthScore: { score: 80 } });
      stateManager.appendEntry({ timestamp: "t2", healthScore: { score: 85 } });

      const history = stateManager.getCompositeHistory(10);
      assert.deepEqual(history, [80, 85]);
    });

    it("returns empty array when no entries", () => {
      const history = stateManager.getCompositeHistory(10);
      assert.deepEqual(history, []);
    });
  });

  describe("getCategoryHistory", () => {
    it("returns category scores from entries", () => {
      stateManager.appendEntry({
        timestamp: "t1",
        categories: { file_io_safety: { score: 75 } },
      });
      stateManager.appendEntry({
        timestamp: "t2",
        categories: { file_io_safety: { score: 82 } },
      });

      const history = stateManager.getCategoryHistory("file_io_safety", 10);
      assert.deepEqual(history, [75, 82]);
    });
  });

  describe("saveBaseline / loadBaseline", () => {
    it("saves and loads baseline", () => {
      const entry = { healthScore: { score: 85 }, categories: { a: { score: 90 } } };
      const saved = stateManager.saveBaseline(entry);
      assert.equal(saved, true);

      const loaded = stateManager.loadBaseline();
      assert.ok(loaded);
      assert.equal(loaded.healthScore.score, 85);
    });

    it("returns null when no baseline exists", () => {
      const loaded = stateManager.loadBaseline();
      assert.equal(loaded, null);
    });
  });

  describe("computeDelta", () => {
    it("computes delta from previous entry", () => {
      stateManager.appendEntry({
        timestamp: "t1",
        healthScore: { score: 80, grade: "B" },
        categories: { a: { score: 75 } },
      });

      const current = {
        healthScore: { score: 85, grade: "B" },
        categories: { a: { score: 82 } },
      };

      const delta = stateManager.computeDelta(current);
      assert.ok(delta);
      assert.equal(delta.scoreDelta, 5);
      assert.equal(delta.scoreBefore, 80);
      assert.equal(delta.scoreAfter, 85);
    });

    it("returns null when no history", () => {
      const delta = stateManager.computeDelta({ healthScore: { score: 80 } });
      assert.equal(delta, null);
    });
  });
});
