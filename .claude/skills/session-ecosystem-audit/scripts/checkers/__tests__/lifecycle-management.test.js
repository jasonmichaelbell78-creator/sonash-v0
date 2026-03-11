/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-lm-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "lifecycle-management.js");

describe("lifecycle-management checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "lifecycle_management");
    });
  });

  describe("happy path — session skill and state present", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const skillsDir = path.join(tmpDir, ".claude", "skills", "session-end");
      const stateDir = path.join(tmpDir, ".claude", "state");
      const hooksDir = path.join(tmpDir, ".claude", "hooks");
      fs.mkdirSync(skillsDir, { recursive: true });
      fs.mkdirSync(stateDir, { recursive: true });
      fs.mkdirSync(hooksDir, { recursive: true });
      // Session skill
      const skillMd = [
        "---",
        "trigger: /session-end",
        "---",
        "# Session End Skill",
        "",
        "## 1. Save Context",
        "",
        "Save the current session context.",
        "",
        "## 2. Commit Changes",
        "",
        "Commit with proper message.",
      ].join("\n");
      fs.writeFileSync(path.join(skillsDir, "SKILL.md"), skillMd);
      // Session context doc
      fs.writeFileSync(
        path.join(tmpDir, "SESSION_CONTEXT.md"),
        "# Session Context\n\n**Session #100**\n\nCurrent sprint info.\n"
      );
      // Hook file
      fs.writeFileSync(
        path.join(hooksDir, "session-start.js"),
        '"use strict";\nprocess.exit(0);\n'
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "lifecycle_management");
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

  describe("missing session skill", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when session skill is absent", () => {
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

  describe("malformed SESSION_CONTEXT.md", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.writeFileSync(
        path.join(tmpDir, "SESSION_CONTEXT.md"),
        Buffer.from([0xff, 0xfe, 0x00, 0x01])
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on malformed SESSION_CONTEXT", () => {
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
