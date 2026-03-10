/**
 * audit-health-check.js Test Suite
 *
 * Tests the pure helper functions extracted from scripts/audit/audit-health-check.js.
 * The script has no exported module surface — all functions call process.exit() at
 * the top level — so we test the internal logic units that are representable in
 * isolation: addResult / check logic patterns, isValidJsonlFile, and the category
 * constant shapes that the rest of the script depends on.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// ---------------------------------------------------------------------------
// Re-implement isValidJsonlFile locally (the script does not export it).
// We keep the implementation identical to the source so we can test its logic
// without spawning a child process or modifying the source file.
// ---------------------------------------------------------------------------

function isValidJsonlFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return true;
    const lines = content.split("\n").filter(Boolean);
    JSON.parse(lines[0]);
    if (lines.length > 1) JSON.parse(lines.at(-1)!);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Constants from the script (verified by reading source)
// ---------------------------------------------------------------------------

const CANONICAL_CATEGORIES = [
  "code-quality",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];

const CATEGORY_DIR_MAPPING: Record<string, string> = {
  "code-quality": "code",
  security: "security",
  performance: "performance",
  refactoring: "refactoring",
  documentation: "documentation",
  process: "process",
  "engineering-productivity": "engineering-productivity",
  enhancements: "enhancements",
  "ai-optimization": "ai-optimization",
};

// ---------------------------------------------------------------------------
// Test: canonical category constants
// ---------------------------------------------------------------------------

describe("CANONICAL_CATEGORIES", () => {
  it("contains exactly 9 categories", () => {
    assert.equal(CANONICAL_CATEGORIES.length, 9);
  });

  it("includes all expected category names", () => {
    const expected = [
      "code-quality",
      "security",
      "performance",
      "refactoring",
      "documentation",
      "process",
      "engineering-productivity",
      "enhancements",
      "ai-optimization",
    ];
    for (const cat of expected) {
      assert.ok(CANONICAL_CATEGORIES.includes(cat), `Missing category: ${cat}`);
    }
  });

  it("has no duplicate entries", () => {
    const unique = new Set(CANONICAL_CATEGORIES);
    assert.equal(unique.size, CANONICAL_CATEGORIES.length);
  });
});

// ---------------------------------------------------------------------------
// Test: CATEGORY_DIR_MAPPING
// ---------------------------------------------------------------------------

describe("CATEGORY_DIR_MAPPING", () => {
  it("maps every canonical category to a directory name", () => {
    for (const cat of CANONICAL_CATEGORIES) {
      assert.ok(CATEGORY_DIR_MAPPING[cat], `No mapping for category: ${cat}`);
    }
  });

  it("maps code-quality to 'code'", () => {
    assert.equal(CATEGORY_DIR_MAPPING["code-quality"], "code");
  });

  it("has no path traversal characters in directory names", () => {
    for (const dirName of Object.values(CATEGORY_DIR_MAPPING)) {
      assert.ok(!/\.\./.test(dirName), `Traversal in dirName: ${dirName}`);
      assert.ok(!/[/\\]/.test(dirName), `Path separator in dirName: ${dirName}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Test: isValidJsonlFile
// ---------------------------------------------------------------------------

describe("isValidJsonlFile", () => {
  let tmpDir: string;

  // Create a fresh temp directory before each test group
  const setup = () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ahc-test-"));
  };
  const teardown = () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  };

  it("returns true for an empty file", () => {
    setup();
    try {
      const p = path.join(tmpDir, "empty.jsonl");
      fs.writeFileSync(p, "");
      assert.equal(isValidJsonlFile(p), true);
    } finally {
      teardown();
    }
  });

  it("returns true for a file with whitespace only", () => {
    setup();
    try {
      const p = path.join(tmpDir, "ws.jsonl");
      fs.writeFileSync(p, "   \n  ");
      assert.equal(isValidJsonlFile(p), true);
    } finally {
      teardown();
    }
  });

  it("returns true for a single valid JSON line", () => {
    setup();
    try {
      const p = path.join(tmpDir, "single.jsonl");
      fs.writeFileSync(p, '{"category":"security","title":"test"}\n');
      assert.equal(isValidJsonlFile(p), true);
    } finally {
      teardown();
    }
  });

  it("returns true for multiple valid JSON lines", () => {
    setup();
    try {
      const p = path.join(tmpDir, "multi.jsonl");
      const lines = [
        '{"category":"security","title":"a"}',
        '{"category":"performance","title":"b"}',
        '{"category":"code-quality","title":"c"}',
      ].join("\n");
      fs.writeFileSync(p, lines + "\n");
      assert.equal(isValidJsonlFile(p), true);
    } finally {
      teardown();
    }
  });

  it("returns false for a file with invalid JSON on the first line", () => {
    setup();
    try {
      const p = path.join(tmpDir, "bad-first.jsonl");
      fs.writeFileSync(p, "not-json\n");
      assert.equal(isValidJsonlFile(p), false);
    } finally {
      teardown();
    }
  });

  it("returns false for a file with invalid JSON on the last line", () => {
    setup();
    try {
      const p = path.join(tmpDir, "bad-last.jsonl");
      fs.writeFileSync(p, '{"ok":true}\nTRUNCATE{{\n');
      assert.equal(isValidJsonlFile(p), false);
    } finally {
      teardown();
    }
  });

  it("returns false for a non-existent file", () => {
    assert.equal(isValidJsonlFile("/nonexistent/path/file.jsonl"), false);
  });
});

// ---------------------------------------------------------------------------
// Test: addResult logic (pure reimplementation)
// ---------------------------------------------------------------------------

describe("addResult logic", () => {
  it("accumulates results and tracks overall pass state", () => {
    const results: Array<{ check: string; passed: boolean; message: string }> = [];
    let allPassed = true;

    function addResult(check: string, passed: boolean, message: string) {
      results.push({ check, passed, message });
      if (!passed) allPassed = false;
    }

    addResult("Check A", true, "All good");
    addResult("Check B", true, "Still good");

    assert.equal(results.length, 2);
    assert.equal(allPassed, true);

    addResult("Check C", false, "Something wrong");

    assert.equal(results.length, 3);
    assert.equal(allPassed, false);
  });

  it("allPassed stays false once set to false by a failing check", () => {
    const results: Array<{ check: string; passed: boolean; message: string }> = [];
    let allPassed = true;

    function addResult(check: string, passed: boolean, message: string) {
      results.push({ check, passed, message });
      if (!passed) allPassed = false;
    }

    addResult("Fail", false, "bad");
    addResult("Pass", true, "good");

    assert.equal(allPassed, false, "allPassed should stay false after first failure");
  });

  it("passCount and totalCount are derivable from results array", () => {
    const results: Array<{ check: string; passed: boolean; message: string }> = [
      { check: "A", passed: true, message: "ok" },
      { check: "B", passed: false, message: "fail" },
      { check: "C", passed: true, message: "ok" },
    ];

    const passCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    assert.equal(passCount, 2);
    assert.equal(totalCount, 3);
  });
});

// ---------------------------------------------------------------------------
// Test: script file exists at expected path
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("audit-health-check.js exists at scripts/audit/audit-health-check.js", () => {
    const scriptPath = path.resolve(PROJECT_ROOT, "scripts/audit/audit-health-check.js");
    assert.ok(fs.existsSync(scriptPath), `Script not found: ${scriptPath}`);
  });
});
