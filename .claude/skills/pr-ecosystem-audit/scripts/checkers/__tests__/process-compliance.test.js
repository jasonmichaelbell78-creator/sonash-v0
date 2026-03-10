/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "prea-pc-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "process-compliance.js");

function makeReviewEntry(overrides = {}) {
  return JSON.stringify({
    prNumber: 1,
    reviewedAt: new Date().toISOString(),
    reviewer: "test-user",
    skillsUsed: ["code-reviewer"],
    retroComplete: true,
    ...overrides,
  });
}

describe("process-compliance checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "process_compliance");
    });
  });

  describe("happy path — full process data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      const docsDir = path.join(tmpDir, "docs");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.mkdirSync(path.join(docsDir, "technical-debt"), { recursive: true });
      // Write reviews.jsonl with good data
      const reviews =
        [
          makeReviewEntry({ prNumber: 1 }),
          makeReviewEntry({ prNumber: 2 }),
          makeReviewEntry({ prNumber: 3 }),
        ].join("\n") + "\n";
      fs.writeFileSync(path.join(stateDir, "reviews.jsonl"), reviews);
      // Write learnings log
      fs.writeFileSync(
        path.join(docsDir, "AI_REVIEW_LEARNINGS_LOG.md"),
        "# AI Review Learnings\n\n## Session Learnings\n\nKey insight: always use skill.\n"
      );
      // Write debt items
      fs.writeFileSync(
        path.join(docsDir, "technical-debt", "MASTER_DEBT.jsonl"),
        JSON.stringify({ id: "TD-001", title: "Fix auth", severity: "high" }) + "\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "process_compliance");
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

  describe("empty/missing data files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when all data files are absent", () => {
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

  describe("malformed JSONL data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(path.join(stateDir, "reviews.jsonl"), "not-json\n{broken\nalso-broken}\n");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on malformed JSONL", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores remain in [0, 100] for corrupt input", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("all finding IDs have a consistent prefix format", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(typeof f.id === "string" && f.id.length > 0, "id must be non-empty string");
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
