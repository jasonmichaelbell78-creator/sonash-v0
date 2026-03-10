/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hea-si-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "state-integration.js");

describe("state-integration checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "state_integration");
    });
  });

  describe("happy path — state directory present", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const stateDir = path.join(tmpDir, ".claude", "state");
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(
        path.join(stateDir, "handoff.json"),
        JSON.stringify({
          sessionNumber: 100,
          status: "complete",
          timestamp: new Date().toISOString(),
        })
      );
      fs.writeFileSync(
        path.join(stateDir, "commit-log.jsonl"),
        JSON.stringify({
          hash: "abc1234",
          message: "test commit",
          timestamp: new Date().toISOString(),
        }) + "\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "state_integration");
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
      fs.writeFileSync(path.join(stateDir, "handoff.json"), "{ corrupt: json }");
      fs.writeFileSync(path.join(stateDir, "commit-log.jsonl"), "not-json\nalso-not-json\n");
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

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("all finding IDs match HEA-NNN format", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const f of result.findings) {
        assert.ok(/^HEA-\d+$/.test(f.id), `finding.id "${f.id}" must match HEA-NNN`);
        assert.ok(["error", "warning", "info"].includes(f.severity));
        assert.ok(typeof f.message === "string" && f.message.length > 0);
      }
    });
  });
});
