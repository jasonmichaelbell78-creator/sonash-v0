/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-sc-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "structural-compliance.js");

const VALID_SKILL_MD = [
  "---",
  "trigger: /test-skill",
  "version: 1.0.0",
  "---",
  "# Test Skill",
  "",
  "## 1. First Step",
  "",
  "Do the first step.",
  "",
  "## 2. Second Step",
  "",
  "Do the second step.",
].join("\n");

describe("structural-compliance checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "structural_compliance");
    });
  });

  describe("happy path — valid skill files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(path.join(skillsDir, "test-skill"), { recursive: true });
      fs.mkdirSync(path.join(skillsDir, "another-skill"), { recursive: true });
      fs.writeFileSync(path.join(skillsDir, "test-skill", "SKILL.md"), VALID_SKILL_MD);
      fs.writeFileSync(
        path.join(skillsDir, "another-skill", "SKILL.md"),
        VALID_SKILL_MD.replace("test-skill", "another-skill")
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "structural_compliance");
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

  describe("no skills directory", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when skills/ is absent", () => {
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

  describe("malformed SKILL.md — missing frontmatter", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillDir = path.join(tmpDir, ".claude", "skills", "bad-skill");
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# Bad Skill\n\nNo frontmatter here.\n");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on skill with missing frontmatter", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("scores are in [0, 100] for malformed skill", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      for (const [key, val] of Object.entries(result.scores)) {
        assert.ok(val.score >= 0 && val.score <= 100, `Score ${key} out of range`);
      }
    });
  });

  describe("step discontinuity", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillDir = path.join(tmpDir, ".claude", "skills", "gap-skill");
      fs.mkdirSync(skillDir, { recursive: true });
      // Steps 1 and 3, missing 2
      fs.writeFileSync(
        path.join(skillDir, "SKILL.md"),
        "---\ntrigger: /gap\n---\n# Gap Skill\n\n## 1. First\n\nContent.\n\n## 3. Third\n\nSkipped step 2.\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on step discontinuity", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });
  });

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillDir = path.join(tmpDir, ".claude", "skills", "empty-skill");
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), "");
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
