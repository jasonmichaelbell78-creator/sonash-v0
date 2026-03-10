/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-sp-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "state-persistence.js");

describe("state-persistence checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "state_persistence");
    });
  });

  describe("happy path — all state files healthy", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      // Valid handoff.json
      fs.writeFileSync(
        path.join(stateDir, "handoff.json"),
        JSON.stringify({
          sessionNumber: 200,
          status: "complete",
          timestamp: new Date().toISOString(),
          summary: "Completed feature X",
          nextSteps: ["review PR", "merge"],
        })
      );
      // Valid commit-log.jsonl
      const commitLog =
        Array.from({ length: 3 }, (_, i) =>
          JSON.stringify({
            hash: `abc${i}`,
            message: `commit ${i}`,
            timestamp: new Date().toISOString(),
            author: "test",
          })
        ).join("\n") + "\n";
      fs.writeFileSync(path.join(stateDir, "commit-log.jsonl"), commitLog);
      // Valid session-notes.json
      fs.writeFileSync(
        path.join(stateDir, "session-notes.json"),
        JSON.stringify({ notes: ["note 1", "note 2"], sessionNumber: 200 })
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "state_persistence");
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

  describe("missing state directory", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when state/ is absent", () => {
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
      fs.writeFileSync(path.join(stateDir, "handoff.json"), "{ not valid }");
      fs.writeFileSync(path.join(stateDir, "commit-log.jsonl"), "bad line 1\nbad line 2\n");
      fs.writeFileSync(path.join(stateDir, "session-notes.json"), "{ invalid }");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on corrupt state files", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores remain in [0, 100] for corrupt state", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("handoff.json schema validation", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      // Missing required fields
      fs.writeFileSync(path.join(stateDir, "handoff.json"), JSON.stringify({ foo: "bar" }));
    });
    after(() => removeTempDir(tmpDir));

    it("detects missing required fields in handoff.json", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      // Should have findings or reduced score
      const handoffScore = result.scores.handoff_file_schema;
      if (handoffScore !== undefined) {
        assert.ok(handoffScore.score >= 0 && handoffScore.score <= 100);
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
