/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-ic-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "integration-config.js");

describe("integration-config checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "integration_config");
    });
  });

  describe("happy path — integration well-configured", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const claudeDir = path.join(tmpDir, ".claude");
      fs.mkdirSync(claudeDir, { recursive: true });
      // Complete settings.json with all required sections
      const settings = {
        hooks: {
          SessionStart: [
            { matcher: ".*", hooks: [{ command: "node .claude/hooks/session-start.js" }] },
          ],
          PreCompact: [
            { matcher: ".*", hooks: [{ command: "node .claude/hooks/pre-compact.js" }] },
          ],
          PostToolUse: [{ matcher: ".*", hooks: [{ command: "node .claude/hooks/post-tool.js" }] }],
          UserPromptSubmit: [{ matcher: ".*", hooks: [{ command: "echo prompt" }] }],
        },
        permissions: { allow: ["read"], deny: [] },
      };
      fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(settings, null, 2));
      fs.writeFileSync(
        path.join(tmpDir, "CLAUDE.md"),
        "# Claude Config\n\n## Rules\n\nBe helpful.\n"
      );
    });
    after(() => removeTempDir(tmpDir));

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "integration_config");
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

  describe("missing configuration files", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw when config files are missing", () => {
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

  describe("malformed settings.json", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const claudeDir = path.join(tmpDir, ".claude");
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, "settings.json"), "{ bad json }");
    });
    after(() => removeTempDir(tmpDir));

    it("does not throw on malformed settings", () => {
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
