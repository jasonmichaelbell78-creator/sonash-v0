/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tdms-dqd-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "data-quality-dedup.js");

function makeDebtItem(id, overrides = {}) {
  return JSON.stringify({
    id,
    title: `Debt item ${id}`,
    severity: "medium",
    category: "code-quality",
    createdAt: new Date().toISOString(),
    contentHash: `hash-${id}`,
    ...overrides,
  });
}

describe("data-quality-dedup checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "data_quality_dedup");
    });
  });

  describe("happy path — clean deduplicated data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const debtDir = path.join(tmpDir, "docs", "technical-debt");
      fs.mkdirSync(debtDir, { recursive: true });
      // Unique items with different IDs and hashes
      const masterDebt =
        [makeDebtItem("TD-001"), makeDebtItem("TD-002"), makeDebtItem("TD-003")].join("\n") + "\n";
      fs.writeFileSync(path.join(debtDir, "MASTER_DEBT.jsonl"), masterDebt);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "data_quality_dedup");
      assert.ok(Array.isArray(result.findings));
      assert.ok(typeof result.scores === "object");
    });

    it("all scores are in [0, 100]", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(
          typeof val.score === "number" && val.score >= 0 && val.score <= 100,
          `Score for ${key} out of range: ${val.score}`
        );
      }
    });
  });

  describe("no debt data files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when debt files are absent", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("returns valid result structure", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.ok(Array.isArray(result.findings));
      assert.ok(typeof result.scores === "object");
    });
  });

  describe("duplicate items", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const debtDir = path.join(tmpDir, "docs", "technical-debt");
      fs.mkdirSync(debtDir, { recursive: true });
      // Duplicate IDs
      const masterDebt =
        [
          makeDebtItem("TD-001"),
          makeDebtItem("TD-001"), // duplicate ID
          makeDebtItem("TD-002"),
          makeDebtItem("TD-002", { contentHash: "hash-TD-002" }), // duplicate
        ].join("\n") + "\n";
      fs.writeFileSync(path.join(debtDir, "MASTER_DEBT.jsonl"), masterDebt);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on duplicate items", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for duplicate data", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("malformed JSONL", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const debtDir = path.join(tmpDir, "docs", "technical-debt");
      fs.mkdirSync(debtDir, { recursive: true });
      fs.writeFileSync(path.join(debtDir, "MASTER_DEBT.jsonl"), "bad\n{invalid}\nnot-json\n");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on malformed JSONL", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });
  });

  describe("finding schema", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("all findings have id, severity, message", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(typeof f.id === "string" && f.id.length > 0);
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
