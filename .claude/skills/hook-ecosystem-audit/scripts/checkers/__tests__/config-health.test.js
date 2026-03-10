/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hea-ch-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "config-health.js");

function makeSettings(hooks = {}) {
  return JSON.stringify({ hooks }, null, 2);
}

describe("config-health checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "config_health");
    });
  });

  describe("happy path — well-configured hooks", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const claudeDir = path.join(tmpDir, ".claude");
      const hooksDir = path.join(claudeDir, "hooks");
      fs.mkdirSync(hooksDir, { recursive: true });
      // Create hook files on disk
      fs.writeFileSync(path.join(hooksDir, "session-start.js"), "// hook\n");
      fs.writeFileSync(path.join(hooksDir, "post-tool.js"), "// hook\n");
      // Create settings.json referencing them
      const settings = {
        hooks: {
          SessionStart: [
            {
              matcher: ".*",
              hooks: [{ command: "node .claude/hooks/session-start.js" }],
            },
          ],
          PreCompact: [
            {
              matcher: ".*",
              hooks: [{ command: "node .claude/hooks/post-tool.js" }],
            },
          ],
          PostToolUse: [
            {
              matcher: "Write|Edit",
              hooks: [{ command: "node .claude/hooks/session-start.js" }],
            },
          ],
          UserPromptSubmit: [
            {
              matcher: ".*",
              hooks: [{ command: "node .claude/hooks/session-start.js" }],
            },
          ],
        },
      };
      fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(settings, null, 2));
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "config_health");
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

  describe("missing settings.json", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when settings.json is absent", () => {
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
      fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, ".claude", "settings.json"), "{ not valid json }");
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw on invalid JSON", () => {
      const { run } = require(CHECKER_PATH);
      assert.doesNotThrow(() => run({ rootDir: tmpDir }));
    });

    it("adds HEA-100 finding for invalid JSON", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const ids = result.findings.map((f) => f.id);
      assert.ok(ids.includes("HEA-100"), "Expected HEA-100 for invalid settings JSON");
    });
  });

  describe("settings reference missing hook file", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const claudeDir = path.join(tmpDir, ".claude");
      fs.mkdirSync(path.join(claudeDir, "hooks"), { recursive: true });
      const settings = {
        hooks: {
          SessionStart: [
            {
              matcher: ".*",
              hooks: [{ command: "node .claude/hooks/ghost-hook.js" }],
            },
          ],
        },
      };
      fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(settings));
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("adds HEA-101 finding when referenced file is missing", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const ids = result.findings.map((f) => f.id);
      assert.ok(ids.includes("HEA-101"), "Expected HEA-101 for missing hook file");
    });

    it("settings_file_alignment score is reduced", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const score = result.scores.settings_file_alignment;
      assert.ok(score.score < 100, "Alignment score should be < 100");
    });
  });

  describe("event coverage — uncovered events", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const claudeDir = path.join(tmpDir, ".claude");
      fs.mkdirSync(path.join(claudeDir, "hooks"), { recursive: true });
      // Only SessionStart covered
      const settings = {
        hooks: {
          SessionStart: [{ matcher: ".*", hooks: [{ command: "echo start" }] }],
        },
      };
      fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(settings));
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("adds HEA-110 finding for uncovered event types", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      const ids = result.findings.map((f) => f.id);
      assert.ok(ids.includes("HEA-110"), "Expected HEA-110 for uncovered events");
    });
  });

  describe("finding ID format", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

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
