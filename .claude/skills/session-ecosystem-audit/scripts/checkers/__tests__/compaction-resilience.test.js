/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-cr-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "compaction-resilience.js");

describe("compaction-resilience checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "compaction_resilience");
    });
  });

  describe("happy path — compaction hook and recovery in place", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const hooksDir = path.join(tmpDir, ".claude", "hooks");
      const stateDir = path.join(tmpDir, ".claude", "state");
      const docsDir = path.join(tmpDir, "docs", "agent_docs");
      fs.mkdirSync(hooksDir, { recursive: true });
      fs.mkdirSync(stateDir, { recursive: true });
      fs.mkdirSync(docsDir, { recursive: true });
      // Pre-compact hook
      fs.writeFileSync(
        path.join(hooksDir, "pre-compact.js"),
        '"use strict";\n// Save state before compaction\nprocess.exit(0);\n'
      );
      // Context preservation docs
      fs.writeFileSync(
        path.join(docsDir, "CONTEXT_PRESERVATION.md"),
        "# Context Preservation\n\nInstructions for preserving context across compaction.\n"
      );
      // State data
      fs.writeFileSync(
        path.join(stateDir, "handoff.json"),
        JSON.stringify({ sessionNumber: 100, status: "complete" })
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "compaction_resilience");
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

  describe("no compaction infrastructure", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw with no compaction config", () => {
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
