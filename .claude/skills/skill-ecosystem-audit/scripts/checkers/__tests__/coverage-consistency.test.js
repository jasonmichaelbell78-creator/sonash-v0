/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-cc-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "coverage-consistency.js");

describe("coverage-consistency checker (skill ecosystem)", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "coverage_consistency");
    });
  });

  describe("happy path — all skills covered in CLAUDE.md", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(path.join(skillsDir, "code-reviewer"), { recursive: true });
      fs.mkdirSync(path.join(skillsDir, "session-end"), { recursive: true });
      fs.writeFileSync(
        path.join(skillsDir, "code-reviewer", "SKILL.md"),
        "---\ntrigger: /code-review\n---\n# Code Reviewer\n\n## 1. Review\n\nReview code.\n"
      );
      fs.writeFileSync(
        path.join(skillsDir, "session-end", "SKILL.md"),
        "---\ntrigger: /session-end\n---\n# Session End\n\n## 1. Save\n\nSave state.\n"
      );
      // CLAUDE.md references both skills
      fs.writeFileSync(
        path.join(tmpDir, "CLAUDE.md"),
        "# Claude Config\n\n| Trigger | Action |\n| --- | --- |\n| code review | `code-reviewer` skill |\n| session end | `/session-end` skill |\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "coverage_consistency");
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

  describe("skills without CLAUDE.md coverage", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(path.join(skillsDir, "uncovered-skill"), { recursive: true });
      fs.writeFileSync(
        path.join(skillsDir, "uncovered-skill", "SKILL.md"),
        "---\ntrigger: /uncovered\n---\n# Uncovered Skill\n\n## 1. Step\n\nDo something.\n"
      );
      fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Claude Config\n\nNo skill references.\n");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when skills lack CLAUDE.md coverage", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are reduced for uncovered skills", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("no skills directory", () => {
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
