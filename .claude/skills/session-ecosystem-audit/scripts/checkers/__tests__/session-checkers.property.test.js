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
  "lifecycle-management.js",
  "state-persistence.js",
  "compaction-resilience.js",
  "cross-session-safety.js",
  "integration-config.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sea-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("session-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    const claudeDir = path.join(tmpDir, ".claude");
    const hooksDir = path.join(claudeDir, "hooks");
    const stateDir = path.join(claudeDir, "state");
    const skillsDir = path.join(claudeDir, "skills", "session-end");
    const docsDir = path.join(tmpDir, "docs", "agent_docs");
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.mkdirSync(stateDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDir, "session-start.js"), '"use strict";\nprocess.exit(0);\n');
    fs.writeFileSync(path.join(hooksDir, "pre-compact.js"), '"use strict";\nprocess.exit(0);\n');
    const settings = {
      hooks: {
        SessionStart: [
          { matcher: ".*", hooks: [{ command: "node .claude/hooks/session-start.js" }] },
        ],
        PreCompact: [{ matcher: ".*", hooks: [{ command: "node .claude/hooks/pre-compact.js" }] }],
        PostToolUse: [{ matcher: ".*", hooks: [{ command: "echo done" }] }],
        UserPromptSubmit: [{ matcher: ".*", hooks: [{ command: "echo prompt" }] }],
      },
    };
    fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify(settings));
    fs.writeFileSync(
      path.join(stateDir, "handoff.json"),
      JSON.stringify({
        sessionNumber: 100,
        status: "complete",
        timestamp: new Date().toISOString(),
      })
    );
    fs.writeFileSync(
      path.join(stateDir, "commit-log.jsonl"),
      JSON.stringify({ hash: "abc123", message: "session-100: test" }) + "\n"
    );
    fs.writeFileSync(
      path.join(skillsDir, "SKILL.md"),
      "# Session End\n\n## 1. Save Context\n\nSave.\n"
    );
    fs.writeFileSync(
      path.join(tmpDir, "SESSION_CONTEXT.md"),
      "# Session Context\n\n**Session #100**\n"
    );
    fs.writeFileSync(
      path.join(docsDir, "CONTEXT_PRESERVATION.md"),
      "# Context Preservation\n\nGuide.\n"
    );
  });
  after(() => removeTempDir(tmpDir));

  for (const checkerFile of CHECKER_FILES) {
    describe(`${checkerFile}`, () => {
      it("run() score values are always in [0, 100]", () => {
        const checker = require(path.join(CHECKERS_DIR, checkerFile));
        fc.assert(
          fc.property(fc.constant(tmpDir), (rootDir) => {
            const result = checker.run({ rootDir });
            for (const val of Object.values(result.scores)) {
              if (typeof val === "object" && val !== null && typeof val.score === "number") {
                return val.score >= 0 && val.score <= 100;
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
