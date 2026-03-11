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
  "process-compliance.js",
  "feedback-integration.js",
  "pattern-lifecycle.js",
  "effectiveness-metrics.js",
  "data-state-health.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "prea-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("pr-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    const stateDir = path.join(tmpDir, ".claude", "state");
    const docsDir = path.join(tmpDir, "docs");
    fs.mkdirSync(stateDir, { recursive: true });
    fs.mkdirSync(path.join(docsDir, "technical-debt"), { recursive: true });
    const reviews =
      Array.from({ length: 5 }, (_, i) =>
        JSON.stringify({
          prNumber: i + 1,
          reviewedAt: new Date().toISOString(),
          skillsUsed: ["code-reviewer"],
          retroComplete: true,
          patterns: ["null-check"],
        })
      ).join("\n") + "\n";
    fs.writeFileSync(path.join(stateDir, "reviews.jsonl"), reviews);
    fs.writeFileSync(
      path.join(stateDir, "review-metrics.jsonl"),
      Array.from({ length: 5 }, (_, i) =>
        JSON.stringify({ sessionNumber: i + 1, timestamp: new Date().toISOString() })
      ).join("\n") + "\n"
    );
    fs.writeFileSync(
      path.join(docsDir, "AI_REVIEW_LEARNINGS_LOG.md"),
      "# Review Learnings\n\nPatterns and lessons.\n"
    );
    fs.writeFileSync(
      path.join(docsDir, "technical-debt", "MASTER_DEBT.jsonl"),
      JSON.stringify({ id: "TD-001", title: "Fix auth" }) + "\n"
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
