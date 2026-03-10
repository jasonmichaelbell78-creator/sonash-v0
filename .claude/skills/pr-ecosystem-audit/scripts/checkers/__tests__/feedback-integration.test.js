/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "prea-fi-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "feedback-integration.js");

describe("feedback-integration checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "feedback_integration");
    });
  });

  describe("happy path — feedback data present", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      const docsDir = path.join(tmpDir, "docs");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.mkdirSync(docsDir, { recursive: true });
      // Simulated review data showing feedback loop closure
      const reviews =
        Array.from({ length: 5 }, (_, i) =>
          JSON.stringify({
            prNumber: i + 1,
            reviewedAt: new Date().toISOString(),
            feedbackApplied: true,
            patterns: ["security-fix", "null-check"],
          })
        ).join("\n") + "\n";
      fs.writeFileSync(path.join(stateDir, "reviews.jsonl"), reviews);
      fs.writeFileSync(
        path.join(docsDir, "AI_REVIEW_LEARNINGS_LOG.md"),
        "# Learnings\n\n## Patterns\n\nPattern: always null-check.\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "feedback_integration");
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

  describe("empty project", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on empty project", () => {
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

  describe("corrupt JSONL data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(path.join(stateDir, "reviews.jsonl"), "{bad}\n{also bad}\n");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on corrupt JSONL", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });
  });

  describe("finding schema", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

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
