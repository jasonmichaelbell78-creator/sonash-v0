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
  "pipeline-correctness.js",
  "data-quality-dedup.js",
  "file-io-safety.js",
  "roadmap-integration.js",
  "metrics-reporting.js",
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tdms-prop-"));
}
function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("tdms-ecosystem checkers — property tests", () => {
  let tmpDir;
  before(() => {
    tmpDir = makeTempDir();
    const scriptsDir = path.join(tmpDir, "scripts");
    const debtDir = path.join(tmpDir, "docs", "technical-debt");
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(debtDir, { recursive: true });
    // Pipeline scripts
    const phases = [
      "consolidate-all",
      "extract-audits",
      "extract-reviews",
      "extract-sonarcloud",
      "normalize-all",
      "dedup-multi-pass",
      "generate-views",
      "generate-metrics",
    ];
    phases.forEach((p) => {
      fs.writeFileSync(path.join(scriptsDir, `${p}.js`), `"use strict";\nmodule.exports = {};\n`);
    });
    // Debt data
    fs.writeFileSync(
      path.join(debtDir, "MASTER_DEBT.jsonl"),
      JSON.stringify({ id: "TD-001", title: "Test", severity: "low", contentHash: "h1" }) + "\n"
    );
    fs.writeFileSync(
      path.join(debtDir, "metrics.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), totalItems: 1 })
    );
    fs.writeFileSync(path.join(debtDir, "raw-items.jsonl"), "");
    fs.writeFileSync(path.join(tmpDir, "ROADMAP.md"), "# Roadmap\n\n## Planned\n\n- [ ] Feature\n");
    const safeScript =
      '"use strict";\nconst fs = require("node:fs");\nconst path = require("node:path");\n' +
      'function r(p) { try { return fs.readFileSync(p,"utf8"); } catch(e) { return null; } }\n' +
      "module.exports={r};\n";
    fs.writeFileSync(path.join(scriptsDir, "safe-util.js"), safeScript);
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
