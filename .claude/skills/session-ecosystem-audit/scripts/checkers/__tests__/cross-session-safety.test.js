/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-css-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "cross-session-safety.js");

describe("cross-session-safety checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "cross_session_safety");
    });
  });

  describe("happy path — consistent cross-session state", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      // Consistent commit log with incrementing session numbers
      const commitLog =
        Array.from({ length: 5 }, (_, i) =>
          JSON.stringify({
            hash: `abc${i}def`,
            message: `session-${i + 1}: feat: add feature`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          })
        ).join("\n") + "\n";
      fs.writeFileSync(path.join(stateDir, "commit-log.jsonl"), commitLog);
      // Handoff with matching session number
      fs.writeFileSync(
        path.join(stateDir, "handoff.json"),
        JSON.stringify({ sessionNumber: 5, status: "complete" })
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "cross_session_safety");
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

  describe("no state data", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw with no state data", () => {
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

  describe("corrupt state files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(path.join(stateDir, "commit-log.jsonl"), "corrupt\n");
      fs.writeFileSync(path.join(stateDir, "handoff.json"), "corrupt");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on corrupt state files", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for corrupt state", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
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
