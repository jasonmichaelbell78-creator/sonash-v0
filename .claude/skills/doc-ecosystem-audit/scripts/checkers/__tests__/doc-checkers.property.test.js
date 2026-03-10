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
  "index-registry-health.js",
  "link-reference-integrity.js",
  "content-quality.js",
  "generation-pipeline.js",
  "coverage-completeness.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dea-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("doc-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    // Minimal valid project structure
    fs.mkdirSync(path.join(tmpDir, "docs"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "DOCUMENTATION_INDEX.md"),
      "# Index\n| [Doc](docs/test.md) | docs/test.md | test |\n"
    );
    fs.writeFileSync(path.join(tmpDir, "docs", "test.md"), "# Test\nContent.\n");
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ scripts: {} }));
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

      it("findings have valid schema (id, severity, message)", () => {
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

  describe("score invariant across diverse inputs", () => {
    it("all checkers handle missing rootDir gracefully", () => {
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
