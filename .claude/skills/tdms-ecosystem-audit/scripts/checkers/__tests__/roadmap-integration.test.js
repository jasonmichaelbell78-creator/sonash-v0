/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tdms-ri-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "roadmap-integration.js");

describe("roadmap-integration checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "roadmap_integration");
    });
  });

  describe("happy path — roadmap and debt data aligned", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const debtDir = path.join(tmpDir, "docs", "technical-debt");
      fs.mkdirSync(debtDir, { recursive: true });
      // ROADMAP.md with features
      fs.writeFileSync(
        path.join(tmpDir, "ROADMAP.md"),
        [
          "# Roadmap",
          "",
          "## Planned",
          "",
          "- [ ] Feature A",
          "- [ ] Feature B",
          "",
          "## Completed",
          "",
          "- [x] Feature Z",
        ].join("\n")
      );
      // Debt items linked to roadmap
      const masterDebt =
        [
          JSON.stringify({
            id: "TD-001",
            title: "Feature A implementation",
            roadmapRef: "Feature A",
          }),
          JSON.stringify({ id: "TD-002", title: "Fix Feature B bug", roadmapRef: "Feature B" }),
        ].join("\n") + "\n";
      fs.writeFileSync(path.join(debtDir, "MASTER_DEBT.jsonl"), masterDebt);
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "roadmap_integration");
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

  describe("missing ROADMAP.md", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when ROADMAP.md is absent", () => {
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

  describe("malformed ROADMAP.md", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.writeFileSync(path.join(tmpDir, "ROADMAP.md"), Buffer.from([0xff, 0xfe]));
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on malformed ROADMAP.md", () => {
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
