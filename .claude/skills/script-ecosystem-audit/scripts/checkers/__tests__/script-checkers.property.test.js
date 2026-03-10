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
  "module-consistency.js",
  "safety-error-handling.js",
  "registration-reachability.js",
  "code-quality.js",
  "testing-reliability.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sia-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("script-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    const scriptsDir = path.join(tmpDir, "scripts");
    const testsDir = path.join(scriptsDir, "__tests__");
    fs.mkdirSync(testsDir, { recursive: true });
    // Good CJS script
    fs.writeFileSync(
      path.join(scriptsDir, "util.js"),
      '"use strict";\nconst path = require("node:path");\nmodule.exports = { util: true };\n'
    );
    // Corresponding test
    fs.writeFileSync(
      path.join(testsDir, "util.test.js"),
      '"use strict";\nconst assert = require("node:assert");\nassert.ok(true);\n'
    );
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({
        type: "commonjs",
        scripts: { analyze: "node scripts/util.js" },
      })
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
