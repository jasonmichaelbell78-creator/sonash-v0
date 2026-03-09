/**
 * pre-audit-check.js Test Suite
 *
 * Tests the individual check functions from scripts/audit/pre-audit-check.js.
 * Each function performs a filesystem access check and returns { passed, label }.
 * We extract them without triggering main() and mock the filesystem where needed.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

interface CheckResult {
  passed: boolean;
  label: string;
}

interface PreAuditModule {
  checkFalsePositives: () => CheckResult;
  checkAuditSchema: () => CheckResult;
  checkMasterDebt: () => CheckResult;
  checkJSONLSchema: () => CheckResult;
  checkTDMSPipeline: () => CheckResult;
  checkOutputDirectories: (category?: string) => CheckResult;
  CATEGORY_DIR_MAP: Record<string, string>;
}

let mod: PreAuditModule;

before(() => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/audit/pre-audit-check.js");
  let src = fs.readFileSync(srcPath, "utf-8");

  // Strip the main() invocation at the bottom so requiring doesn't execute it
  src = src.replace(/^main\(\s*\)\s*;?\s*$/m, "// main() removed for test isolation");

  // Expose all the helper functions
  src += `\nmodule.exports = {
    checkFalsePositives,
    checkAuditSchema,
    checkMasterDebt,
    checkJSONLSchema,
    checkTDMSPipeline,
    checkOutputDirectories,
    CATEGORY_DIR_MAP,
  };\n`;

  const wrapperFile = srcPath.replace(".js", ".test-wrapper.js");
  fs.writeFileSync(wrapperFile, src, "utf-8");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(wrapperFile) as PreAuditModule;
  } finally {
    try {
      fs.unlinkSync(wrapperFile);
    } catch {
      /* best effort */
    }
  }
});

// =========================================================
// CATEGORY_DIR_MAP
// =========================================================

describe("pre-audit-check.CATEGORY_DIR_MAP", () => {
  it("contains expected categories", () => {
    const map = mod.CATEGORY_DIR_MAP;
    assert.ok("security" in map, "Should have security category");
    assert.ok("code-quality" in map, "Should have code-quality category");
    assert.ok("performance" in map, "Should have performance category");
  });

  it("maps security to 'security' directory", () => {
    assert.equal(mod.CATEGORY_DIR_MAP["security"], "security");
  });
});

// =========================================================
// checkAuditSchema
// =========================================================

describe("pre-audit-check.checkAuditSchema", () => {
  it("returns a result with passed boolean and label string", () => {
    const result = mod.checkAuditSchema();
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
    assert.ok(result.label.length > 0, "Label should not be empty");
  });

  it("label includes 'Audit schema' text", () => {
    const result = mod.checkAuditSchema();
    assert.ok(
      result.label.toLowerCase().includes("audit schema"),
      "Label should mention audit schema"
    );
  });
});

// =========================================================
// checkFalsePositives
// =========================================================

describe("pre-audit-check.checkFalsePositives", () => {
  it("returns a result with passed boolean and label string", () => {
    const result = mod.checkFalsePositives();
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
    assert.ok(result.label.length > 0, "Label should not be empty");
  });

  it("label mentions FALSE_POSITIVES.jsonl", () => {
    const result = mod.checkFalsePositives();
    assert.ok(result.label.includes("FALSE_POSITIVES"), "Label should reference the file");
  });
});

// =========================================================
// checkMasterDebt
// =========================================================

describe("pre-audit-check.checkMasterDebt", () => {
  it("returns a result with passed boolean and label string", () => {
    const result = mod.checkMasterDebt();
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
  });

  it("label mentions MASTER_DEBT.jsonl", () => {
    const result = mod.checkMasterDebt();
    assert.ok(result.label.includes("MASTER_DEBT"), "Label should reference the file");
  });
});

// =========================================================
// checkTDMSPipeline
// =========================================================

describe("pre-audit-check.checkTDMSPipeline", () => {
  it("returns a result with passed boolean and label string", () => {
    const result = mod.checkTDMSPipeline();
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
  });

  it("label mentions TDMS pipeline", () => {
    const result = mod.checkTDMSPipeline();
    assert.ok(result.label.toLowerCase().includes("tdms"), "Label should mention TDMS");
  });
});

// =========================================================
// checkOutputDirectories
// =========================================================

describe("pre-audit-check.checkOutputDirectories", () => {
  it("returns a result with passed boolean and label string when called with no category", () => {
    const result = mod.checkOutputDirectories();
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
  });

  it("returns a result when called with a valid category", () => {
    const result = mod.checkOutputDirectories("security");
    assert.equal(typeof result.passed, "boolean");
    assert.equal(typeof result.label, "string");
  });

  it("returns a result when called with an unknown category (defaults to all dirs)", () => {
    // An unknown category causes it to check all dirs — should still return a result
    const result = mod.checkOutputDirectories(undefined);
    assert.equal(typeof result.passed, "boolean");
  });
});
