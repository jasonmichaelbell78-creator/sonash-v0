/**
 * post-audit.js Test Suite
 *
 * Tests the internal helper functions exported from scripts/audit/post-audit.js.
 * Since the script's main() calls process.exit(), we test the logic directly by
 * loading the module and probing the helper functions via module internals.
 *
 * We exercise validateJsonlFile and printSummary by extracting them from the
 * module source without triggering main().
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// We extract the helper functions by loading the source and wrapping them.
// post-audit.js is a CJS script. We use a module-level eval approach: re-define
// the module boundary so we can call internal helpers without triggering main().

// ===================================================================
// Extract + wrap the logic under test (without triggering main())
// ===================================================================

// Read the source and extract validateJsonlFile by re-running only its
// definition. This is safe because the function only uses node:fs and
// does not read process.argv or call process.exit.

let validateJsonlFile: (filePath: string) => {
  valid: boolean;
  lineCount: number;
  errors: string[];
};

let printSummary: (
  results: Array<{ label: string; passed: boolean; error: string | null }>
) => void;

before(() => {
  // Dynamically build a mini-module that exposes just the helpers.
  // We do this by reading the source, stripping the main() invocation,
  // and then requiring the modified version via a temp file.
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/audit/post-audit.js");
  let src = fs.readFileSync(srcPath, "utf-8");

  // Remove the main() call at the bottom so requiring doesn't execute it
  // String-based replacement per S5852 two-strikes rule (no regex)
  src = src
    .split("\n")
    .map((line) => {
      const t = line.trim();
      return t === "main();" || t === "main()" ? "// main() removed for test isolation" : line;
    })
    .join("\n");

  // Expose helpers via module.exports
  src += `\nmodule.exports = { validateJsonlFile, printSummary };\n`;

  // Write wrapper alongside the original script so relative requires resolve correctly
  const srcPath2 = path.resolve(PROJECT_ROOT, "scripts/audit/post-audit.js");
  const wrapperFile = srcPath2.replace(".js", ".test-wrapper.js");
  fs.writeFileSync(wrapperFile, src, "utf-8");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require(wrapperFile) as {
      validateJsonlFile: typeof validateJsonlFile;
      printSummary: typeof printSummary;
    };
    validateJsonlFile = loaded.validateJsonlFile;
    printSummary = loaded.printSummary;
  } finally {
    try {
      fs.unlinkSync(wrapperFile);
    } catch {
      /* best effort */
    }
  }
});

// =========================================================
// validateJsonlFile
// =========================================================

describe("post-audit.validateJsonlFile", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-audit-jsonl-"));
  });

  it("returns valid:false when file does not exist", () => {
    const result = validateJsonlFile(path.join(tmpDir, "nonexistent.jsonl"));
    assert.equal(result.valid, false);
    assert.equal(result.lineCount, 0);
    assert.ok(result.errors.length > 0, "Should have at least one error");
    assert.ok(
      result.errors[0].includes("not found") || result.errors[0].includes("File not found")
    );
  });

  it("returns valid:false for an empty file", () => {
    const empty = path.join(tmpDir, "empty.jsonl");
    fs.writeFileSync(empty, "", "utf-8");
    const result = validateJsonlFile(empty);
    assert.equal(result.valid, false);
    assert.equal(result.lineCount, 0);
    assert.ok(result.errors.some((e) => e.toLowerCase().includes("empty")));
  });

  it("returns valid:true and correct lineCount for valid JSONL", () => {
    const valid = path.join(tmpDir, "valid.jsonl");
    fs.writeFileSync(
      valid,
      ['{"id":1,"title":"Finding A"}', '{"id":2,"title":"Finding B"}'].join("\n") + "\n",
      "utf-8"
    );
    const result = validateJsonlFile(valid);
    assert.equal(result.valid, true);
    assert.equal(result.lineCount, 2);
    assert.equal(result.errors.length, 0);
  });

  it("returns valid:false with line-specific errors for invalid JSON", () => {
    const invalid = path.join(tmpDir, "invalid.jsonl");
    fs.writeFileSync(
      invalid,
      ['{"id":1,"title":"OK"}', "this is not json", '{"id":3}'].join("\n"),
      "utf-8"
    );
    const result = validateJsonlFile(invalid);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0, "Should report invalid JSON lines");
    assert.ok(
      result.errors.some((e) => e.includes("Line 2")),
      "Should identify line 2 as invalid"
    );
  });

  it("ignores blank lines when counting", () => {
    const blanks = path.join(tmpDir, "blanks.jsonl");
    fs.writeFileSync(blanks, '{"id":1}\n\n{"id":2}\n\n', "utf-8");
    const result = validateJsonlFile(blanks);
    assert.equal(result.valid, true);
    assert.equal(result.lineCount, 2);
  });
});

// =========================================================
// printSummary
// =========================================================

describe("post-audit.printSummary", () => {
  it("runs without throwing for all-passed results", () => {
    const results = [
      { label: "TDMS Intake", passed: true, error: null },
      { label: "Generate Views", passed: true, error: null },
    ];
    // Capture console output to avoid polluting test output
    const originalLog = console.log;
    const captured: string[] = [];
    console.log = (...args: unknown[]) => captured.push(args.join(" "));
    try {
      assert.doesNotThrow(() => printSummary(results));
      const output = captured.join("\n");
      assert.ok(output.includes("PASS"), "Output should contain PASS");
      assert.ok(output.includes("TDMS Intake"), "Output should include step labels");
    } finally {
      console.log = originalLog;
    }
  });

  it("includes FAIL indicator for failed results", () => {
    const results = [
      { label: "TDMS Intake", passed: false, error: "Connection refused" },
      { label: "Generate Views", passed: true, error: null },
    ];
    const originalLog = console.log;
    const captured: string[] = [];
    console.log = (...args: unknown[]) => captured.push(args.join(" "));
    try {
      assert.doesNotThrow(() => printSummary(results));
      const output = captured.join("\n");
      assert.ok(output.includes("FAIL"), "Output should contain FAIL");
      assert.ok(output.includes("2"), "Should mention the number of steps in summary");
    } finally {
      console.log = originalLog;
    }
  });

  it("handles empty results array without throwing", () => {
    const originalLog = console.log;
    console.log = () => undefined;
    try {
      assert.doesNotThrow(() => printSummary([]));
    } finally {
      console.log = originalLog;
    }
  });
});
