/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-ao-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const CHECKER_PATH = path.join(__dirname, "..", "agent-orchestration.js");

describe("agent-orchestration checker", () => {
  describe("module exports", () => {
    it("exports run and DOMAIN", () => {
      const checker = require(CHECKER_PATH);
      assert.equal(typeof checker.run, "function");
      assert.equal(typeof checker.DOMAIN, "string");
      assert.equal(checker.DOMAIN, "agent_orchestration");
    });
  });

  describe("happy path — orchestration docs present", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
      const docsDir = path.join(tmpDir, "docs", "agent_docs");
      const skillsDir = path.join(tmpDir, ".claude", "skills");
      fs.mkdirSync(docsDir, { recursive: true });
      fs.mkdirSync(path.join(skillsDir, "explore"), { recursive: true });
      fs.mkdirSync(path.join(skillsDir, "plan"), { recursive: true });
      // Orchestration doc
      fs.writeFileSync(
        path.join(docsDir, "AGENT_ORCHESTRATION.md"),
        [
          "# Agent Orchestration",
          "",
          "## Explore Agent",
          "",
          "Use for exploring unfamiliar code.",
          "",
          "## Plan Agent",
          "",
          "Use for multi-step implementations.",
        ].join("\n")
      );
      // Agent skill files
      fs.writeFileSync(
        path.join(skillsDir, "explore", "SKILL.md"),
        "---\ntrigger: /explore\n---\n# Explore Agent\n\n## 1. Explore\n\nExplore code.\n"
      );
      fs.writeFileSync(
        path.join(skillsDir, "plan", "SKILL.md"),
        "---\ntrigger: /plan\n---\n# Plan Agent\n\n## 1. Plan\n\nPlan implementation.\n"
      );
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("returns domain, findings array, scores object", () => {
      const { run } = require(CHECKER_PATH);
      const result = run({ rootDir: tmpDir });
      assert.equal(result.domain, "agent_orchestration");
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

  describe("missing orchestration docs", () => {
    let tmpDir;
    before(() => {
      tmpDir = makeTempDir();
    });
    after(() => {
      if (tmpDir) removeTempDir(tmpDir);
    });

    it("does not throw when orchestration docs are absent", () => {
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
