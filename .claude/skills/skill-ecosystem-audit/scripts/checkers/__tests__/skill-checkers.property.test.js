/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const fc = require("fast-check");

const CHECKERS_DIR = path.join(__dirname, "..");

const CHECKER_FILES = [
  "structural-compliance.js",
  "cross-reference-integrity.js",
  "coverage-consistency.js",
  "staleness-drift.js",
  "agent-orchestration.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "skea-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("skill-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    const skillsDir = path.join(tmpDir, ".claude", "skills");
    const docsDir = path.join(tmpDir, "docs", "agent_docs");
    fs.mkdirSync(path.join(skillsDir, "test-skill"), { recursive: true });
    fs.mkdirSync(path.join(skillsDir, "explore"), { recursive: true });
    fs.mkdirSync(docsDir, { recursive: true });
    const recentDate = new Date().toISOString().split("T")[0];
    const skillMd = [
      "---",
      "trigger: /test-skill",
      `lastUpdated: ${recentDate}`,
      "version: 1.0.0",
      "---",
      "# Test Skill",
      "",
      "## 1. First Step",
      "",
      "Do first step.",
      "",
      "## 2. Second Step",
      "",
      "Do second step.",
    ].join("\n");
    fs.writeFileSync(path.join(skillsDir, "test-skill", "SKILL.md"), skillMd);
    fs.writeFileSync(
      path.join(skillsDir, "explore", "SKILL.md"),
      "---\ntrigger: /explore\n---\n# Explore\n\n## 1. Explore\n\nExplore.\n"
    );
    fs.writeFileSync(
      path.join(docsDir, "AGENT_ORCHESTRATION.md"),
      "# Agent Orchestration\n\nUse explore agent.\n"
    );
    fs.writeFileSync(
      path.join(tmpDir, "CLAUDE.md"),
      "# Claude Config\n\n| Trigger | Action |\n| --- | --- |\n| explore | `explore` skill |\n| test | `/test-skill` |\n"
    );
  });
  after(() => {
    if (tmpDir) removeTempDir(tmpDir);
  });

  for (const checkerFile of CHECKER_FILES) {
    describe(`${checkerFile}`, () => {
      it("run() score values are always in [0, 100]", () => {
        const checker = require(path.join(CHECKERS_DIR, checkerFile));
        fc.assert(
          fc.property(fc.constant(tmpDir), (rootDir) => {
            const result = checker.run({ rootDir });
            for (const val of Object.values(result.scores)) {
              if (typeof val === "object" && val !== null && typeof val.score === "number") {
                if (val.score < 0 || val.score > 100) return false;
              }
            }
            return true;
          }),
          { numRuns: 10 }
        );
      });

      it("run() always returns domain string", () => {
        const checker = require(path.join(CHECKERS_DIR, checkerFile));
        fc.assert(
          fc.property(fc.constant(tmpDir), (rootDir) => {
            const result = checker.run({ rootDir });
            return typeof result.domain === "string" && result.domain.length > 0;
          }),
          { numRuns: 10 }
        );
      });

      it("run() always returns findings array", () => {
        const checker = require(path.join(CHECKERS_DIR, checkerFile));
        fc.assert(
          fc.property(fc.constant(tmpDir), (rootDir) => {
            const result = checker.run({ rootDir });
            return Array.isArray(result.findings);
          }),
          { numRuns: 10 }
        );
      });

      it("findings have valid schema", () => {
        const checker = require(path.join(CHECKERS_DIR, checkerFile));
        fc.assert(
          fc.property(fc.constant(tmpDir), (rootDir) => {
            const result = checker.run({ rootDir });
            return result.findings.every(
              (f) =>
                typeof f.id === "string" &&
                typeof f.severity === "string" &&
                typeof f.message === "string" &&
                ["error", "warning", "info"].includes(f.severity)
            );
          }),
          { numRuns: 10 }
        );
      });
    });
  }

  describe("all checkers handle empty rootDir", () => {
    it("no checker throws on empty directory", () => {
      const emptyDir = makeTempDir();
      try {
        for (const checkerFile of CHECKER_FILES) {
          const checker = require(path.join(CHECKERS_DIR, checkerFile));
          assert.doesNotThrow(() => {
            const result = checker.run({ rootDir: emptyDir });
            for (const val of Object.values(result.scores)) {
              if (typeof val === "object" && val !== null && typeof val.score === "number") {
                assert.ok(val.score >= 0 && val.score <= 100);
              }
            }
          });
        }
      } finally {
        removeTempDir(emptyDir);
      }
    });
  });
});
