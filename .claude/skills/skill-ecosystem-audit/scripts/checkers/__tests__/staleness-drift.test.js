/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-sd-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "staleness-drift.js");

describe("staleness-drift checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "staleness_drift");
    });
  });

  describe("happy path — recently updated skills", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(path.join(skillsDir, "fresh-skill"), { recursive: true });
      // Write skill with recent date in frontmatter
      const recentDate = new Date().toISOString().split("T")[0];
      fs.writeFileSync(
        path.join(skillsDir, "fresh-skill", "SKILL.md"),
        `---\ntrigger: /fresh\nversion: 1.0.0\nlastUpdated: ${recentDate}\n---\n# Fresh Skill\n\n## 1. Step\n\nRecently updated.\n`
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "staleness_drift");
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

  describe("stale skills — very old dates", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(path.join(skillsDir, "stale-skill"), { recursive: true });
      fs.writeFileSync(
        path.join(skillsDir, "stale-skill", "SKILL.md"),
        "---\ntrigger: /stale\nversion: 0.1.0\nlastUpdated: 2020-01-01\n---\n# Stale Skill\n\n## 1. Step\n\nVery old content.\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on stale skills", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for stale skills", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("no skills", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw with no skills", () => {
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
