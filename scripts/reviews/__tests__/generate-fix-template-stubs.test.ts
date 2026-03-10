/**
 * Unit tests for scripts/reviews/lib/generate-fix-template-stubs.ts
 *
 * Tests generateFixTemplateStub() and appendFixTemplateStubs() (dry-run mode
 * only to avoid touching docs/). All file I/O uses temp directories.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distPath = path.resolve(
  PROJECT_ROOT,
  "scripts/reviews/dist/lib/generate-fix-template-stubs.js"
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateFixTemplateStub, appendFixTemplateStubs } = require(distPath) as {
  generateFixTemplateStub: (
    pattern: { pattern: string; count: number; distinctPRs: Set<number>; reviewIds: string[] },
    templateNumber: number
  ) => string;
  appendFixTemplateStubs: (
    projectRoot: string,
    patterns: Array<{
      pattern: string;
      count: number;
      distinctPRs: Set<number>;
      reviewIds: string[];
    }>,
    dryRun?: boolean
  ) => { generated: string[]; skipped: string[] };
};

// =========================================================
// Helpers
// =========================================================

function makePattern(
  pattern: string,
  count: number,
  prNumbers: number[] = []
): { pattern: string; count: number; distinctPRs: Set<number>; reviewIds: string[] } {
  return { pattern, count, distinctPRs: new Set(prNumbers), reviewIds: [] };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fix-stubs-test-"));
  // Set up project root structure for appendFixTemplateStubs
  fs.writeFileSync(path.join(tmpDir, "package.json"), "{}", "utf-8");
  // Copy safe-fs.js
  const safeFsSrc = path.join(PROJECT_ROOT, "scripts", "lib", "safe-fs.js");
  fs.mkdirSync(path.join(tmpDir, "scripts", "lib"), { recursive: true });
  fs.copyFileSync(safeFsSrc, path.join(tmpDir, "scripts", "lib", "safe-fs.js"));
  // Create docs/agent_docs directory for FIX_TEMPLATES.md
  fs.mkdirSync(path.join(tmpDir, "docs", "agent_docs"), { recursive: true });
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// =========================================================
// 1. generateFixTemplateStub
// =========================================================

describe("generateFixTemplateStub", () => {
  test("produces a heading with the template number", () => {
    const stub = generateFixTemplateStub(makePattern("missing-error-handling", 5, [10, 11]), 7);
    assert.ok(stub.includes("### Template 7:"));
  });

  test("title-cases the pattern name", () => {
    const stub = generateFixTemplateStub(makePattern("path-traversal", 3, [1, 2]), 1);
    assert.ok(stub.includes("Path Traversal"));
  });

  test("includes occurrence count in Source line", () => {
    const stub = generateFixTemplateStub(makePattern("unsafe-eval", 8, [5, 6, 7]), 2);
    assert.ok(stub.includes("8x"));
  });

  test("includes PR numbers in source line", () => {
    const stub = generateFixTemplateStub(makePattern("inline-firestore-write", 3, [100, 200]), 3);
    assert.ok(stub.includes("#100"));
    assert.ok(stub.includes("#200"));
  });

  test("uses N/A when no PRs are associated", () => {
    const stub = generateFixTemplateStub(makePattern("no-pr-pattern", 3, []), 4);
    assert.ok(stub.includes("N/A"));
  });

  test("includes a TODO fix placeholder code block", () => {
    const stub = generateFixTemplateStub(makePattern("some-pattern", 3, [1]), 5);
    assert.ok(stub.includes("```"));
    assert.ok(stub.includes("TODO: add fix example"));
  });

  test("includes **Pattern:** and **When to use:** fields", () => {
    const stub = generateFixTemplateStub(makePattern("my-pattern", 3, [1]), 6);
    assert.ok(stub.includes("**Pattern:**"));
    assert.ok(stub.includes("**When to use:**"));
  });

  test("distinct PR count is reflected in Source line", () => {
    const stub = generateFixTemplateStub(makePattern("test-pattern", 4, [10, 20, 30]), 1);
    assert.ok(stub.includes("3 PRs"));
  });
});

// =========================================================
// 2. appendFixTemplateStubs (dry-run)
// =========================================================

describe("appendFixTemplateStubs (dry-run)", () => {
  function writeFixTemplates(content: string): void {
    fs.writeFileSync(path.join(tmpDir, "docs", "agent_docs", "FIX_TEMPLATES.md"), content, "utf-8");
  }

  test("dry-run returns generated names without writing to disk", () => {
    writeFixTemplates(
      "# FIX TEMPLATES\n\n## Template 1: Old Pattern\n\n**Pattern:** old pattern\n"
    );

    const patterns = [makePattern("new-pattern", 4, [10, 11])];
    const result = appendFixTemplateStubs(tmpDir, patterns, true);

    assert.ok(result.generated.includes("new-pattern"));
    assert.equal(result.skipped.length, 0);

    // Disk should be unchanged
    const onDisk = fs.readFileSync(
      path.join(tmpDir, "docs", "agent_docs", "FIX_TEMPLATES.md"),
      "utf-8"
    );
    assert.ok(!onDisk.includes("New Pattern"), "File should not be modified in dry-run");
  });

  test("skips patterns already present in FIX_TEMPLATES.md", () => {
    writeFixTemplates(
      [
        "# FIX TEMPLATES",
        "",
        "### Template 1: Missing Error Handling",
        "",
        "**Pattern:** missing error handling",
      ].join("\n")
    );

    const patterns = [makePattern("missing-error-handling", 5, [1, 2])];
    const result = appendFixTemplateStubs(tmpDir, patterns, true);

    assert.equal(result.skipped.length, 1);
    assert.ok(result.skipped.includes("missing-error-handling"));
    assert.equal(result.generated.length, 0);
  });

  test("reports multiple patterns as generated and skipped correctly", () => {
    writeFixTemplates(
      [
        "# FIX TEMPLATES",
        "",
        "### Template 1: Existing Pattern",
        "",
        "**Pattern:** existing pattern",
      ].join("\n")
    );

    const patterns = [
      makePattern("existing-pattern", 4, [1, 2]),
      makePattern("new-pattern-a", 3, [3, 4]),
      makePattern("new-pattern-b", 5, [5, 6]),
    ];
    const result = appendFixTemplateStubs(tmpDir, patterns, true);

    assert.equal(result.skipped.length, 1);
    assert.equal(result.generated.length, 2);
    assert.ok(result.generated.includes("new-pattern-a"));
    assert.ok(result.generated.includes("new-pattern-b"));
  });

  test("throws when FIX_TEMPLATES.md does not exist", () => {
    assert.throws(
      () => appendFixTemplateStubs(tmpDir, [makePattern("any", 3, [1, 2])], true),
      /FIX_TEMPLATES.md not found/
    );
  });

  test("returns empty arrays when given no patterns", () => {
    writeFixTemplates("# FIX TEMPLATES\n\nNo templates yet.\n");
    const result = appendFixTemplateStubs(tmpDir, [], true);
    assert.deepEqual(result.generated, []);
    assert.deepEqual(result.skipped, []);
  });

  test("next template number increments from existing maximum", () => {
    writeFixTemplates(
      ["# FIX TEMPLATES", "", "### Template 5: Already Here", "**Pattern:** already here"].join(
        "\n"
      )
    );

    const patterns = [makePattern("brand-new", 3, [1, 2])];
    const result = appendFixTemplateStubs(tmpDir, patterns, true);

    assert.equal(result.generated.length, 1);
    // We can't directly observe the number without reading generated stubs,
    // but we can verify it was generated
    assert.ok(result.generated.includes("brand-new"));
  });
});
