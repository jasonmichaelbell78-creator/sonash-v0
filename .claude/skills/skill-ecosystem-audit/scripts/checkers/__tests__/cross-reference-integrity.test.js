/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-cri-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "cross-reference-integrity.js");

describe("cross-reference-integrity checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "cross_reference_integrity");
    });
  });

  describe("happy path — all cross-references valid", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      const skillA = path.join(skillsDir, "skill-a");
      const skillB = path.join(skillsDir, "skill-b");
      fs.mkdirSync(skillA, { recursive: true });
      fs.mkdirSync(skillB, { recursive: true });
      fs.writeFileSync(
        path.join(skillA, "SKILL.md"),
        "---\ntrigger: /skill-a\n---\n# Skill A\n\n## 1. Step\n\nSee [Skill B](../skill-b/SKILL.md).\n"
      );
      fs.writeFileSync(
        path.join(skillB, "SKILL.md"),
        "---\ntrigger: /skill-b\n---\n# Skill B\n\n## 1. Step\n\nStandalone skill.\n"
      );
      // Also a CLAUDE.md referencing the skills
      fs.writeFileSync(
        path.join(tmpDir, "CLAUDE.md"),
        "# Claude Config\n\nSee [Skill A](.claude/skills/skill-a/SKILL.md).\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "cross_reference_integrity");
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

  describe("broken cross-references", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillDir = path.join(tmpDir, ".claude", "skills", "broken-skill");
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, "SKILL.md"),
        "---\ntrigger: /broken\n---\n# Broken Skill\n\n## 1. Step\n\nSee [Missing](../nonexistent/SKILL.md).\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on broken cross-references", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for broken refs", () => {
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
