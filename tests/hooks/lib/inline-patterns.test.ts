/**
 * Tests for .claude/hooks/lib/inline-patterns.js
 *
 * Validates that checkInlinePatterns() correctly identifies violations
 * and respects file type and path exclusions.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      /* existsSync race */
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

/* eslint-disable @typescript-eslint/no-require-imports */
const { checkInlinePatterns, INLINE_PATTERNS } = require(
  path.join(PROJECT_ROOT, ".claude/hooks/lib/inline-patterns.js")
) as {
  checkInlinePatterns: (
    content: string,
    relPath: string,
    fileExt: string
  ) => Array<{ id: string; line: number; message: string; fix: string }>;
  INLINE_PATTERNS: Array<{
    id: string;
    pattern: RegExp;
    fileTypes: string[];
    message: string;
    fix: string;
  }>;
};
/* eslint-enable @typescript-eslint/no-require-imports */

describe("INLINE_PATTERNS", () => {
  test("is a non-empty array", () => {
    assert.ok(Array.isArray(INLINE_PATTERNS));
    assert.ok(INLINE_PATTERNS.length > 0);
  });

  test("each pattern has required fields", () => {
    for (const p of INLINE_PATTERNS) {
      assert.ok(
        typeof p.id === "string" && p.id.length > 0,
        `Pattern missing id: ${JSON.stringify(p)}`
      );
      assert.ok(p.pattern instanceof RegExp, `Pattern ${p.id} has non-RegExp pattern`);
      assert.ok(
        Array.isArray(p.fileTypes) && p.fileTypes.length > 0,
        `Pattern ${p.id} missing fileTypes`
      );
      assert.ok(typeof p.message === "string", `Pattern ${p.id} missing message`);
      assert.ok(typeof p.fix === "string", `Pattern ${p.id} missing fix`);
    }
  });
});

describe("checkInlinePatterns: npm-install-automation", () => {
  test("detects bare npm install in a .sh file", () => {
    const content = "#!/bin/bash\nnpm install\necho done\n";
    const violations = checkInlinePatterns(content, "scripts/setup.sh", ".sh");
    const found = violations.find((v) => v.id === "npm-install-automation");
    assert.ok(found, "Should detect npm install in shell script");
    assert.equal(found.line, 2);
  });

  test("does not flag npm install with --save-dev flag", () => {
    const content = "npm install --save-dev some-package\n";
    const violations = checkInlinePatterns(content, "scripts/setup.sh", ".sh");
    const found = violations.find((v) => v.id === "npm-install-automation");
    assert.equal(found, undefined, "Should not flag npm install --save-dev");
  });

  test("does not flag npm install in .ts files (wrong file type)", () => {
    const content = "const x = 'npm install';\n";
    const violations = checkInlinePatterns(content, "src/utils.ts", ".ts");
    const found = violations.find((v) => v.id === "npm-install-automation");
    assert.equal(found, undefined, "npm-install-automation only targets .sh/.yml/.yaml");
  });
});

describe("checkInlinePatterns: console-log-in-production", () => {
  test("detects console.log in a .ts file", () => {
    const content = "export function foo() {\n  console.log('debug');\n}\n";
    const violations = checkInlinePatterns(content, "src/service.ts", ".ts");
    const found = violations.find((v) => v.id === "console-log-in-production");
    assert.ok(found, "Should detect console.log in production .ts file");
    assert.equal(found.line, 2);
  });

  test("does not flag console.log in test files", () => {
    const content = "console.log('test output');\n";
    const violations = checkInlinePatterns(content, "tests/foo.test.ts", ".ts");
    const found = violations.find((v) => v.id === "console-log-in-production");
    assert.equal(found, undefined, "Should not flag console.log in test files");
  });

  test("does not flag console.log in scripts directory", () => {
    const content = "console.log('script output');\n";
    const violations = checkInlinePatterns(content, "scripts/build.ts", ".ts");
    const found = violations.find((v) => v.id === "console-log-in-production");
    assert.equal(found, undefined, "Should exclude scripts/ directory");
  });
});

describe("checkInlinePatterns: any-type-usage", () => {
  test("detects : any type annotation in .ts file", () => {
    const content = "function foo(x: any) {\n  return x;\n}\n";
    const violations = checkInlinePatterns(content, "src/util.ts", ".ts");
    const found = violations.find((v) => v.id === "any-type-usage");
    assert.ok(found, "Should detect : any type usage");
  });

  test("does not flag any in .d.ts files", () => {
    const content = "declare function foo(x: any): void;\n";
    const violations = checkInlinePatterns(content, "types/global.d.ts", ".ts");
    const found = violations.find((v) => v.id === "any-type-usage");
    assert.equal(found, undefined, "Should exclude .d.ts files");
  });
});

describe("checkInlinePatterns: empty-catch-block", () => {
  test("detects empty catch block in .ts file", () => {
    const content = "try {\n  doSomething();\n} catch (e) {}\n";
    const violations = checkInlinePatterns(content, "src/handler.ts", ".ts");
    const found = violations.find((v) => v.id === "empty-catch-block");
    assert.ok(found, "Should detect empty catch block");
  });

  test("does not flag non-empty catch block", () => {
    const content = "try {\n  doSomething();\n} catch (e) {\n  console.error(e);\n}\n";
    const violations = checkInlinePatterns(content, "src/handler.ts", ".ts");
    const found = violations.find((v) => v.id === "empty-catch-block");
    assert.equal(found, undefined, "Non-empty catch should not be flagged");
  });
});

describe("checkInlinePatterns: todo-without-ticket", () => {
  test("detects bare TODO without ticket reference in .ts", () => {
    const content = "// TODO fix this later\nconst x = 1;\n";
    const violations = checkInlinePatterns(content, "src/module.ts", ".ts");
    const found = violations.find((v) => v.id === "todo-without-ticket");
    assert.ok(found, "Should detect TODO without ticket");
  });

  test("does not flag TODO with parenthesized ticket reference", () => {
    const content = "// TODO(PROJ-123) fix this\nconst x = 1;\n";
    const violations = checkInlinePatterns(content, "src/module.ts", ".ts");
    const found = violations.find((v) => v.id === "todo-without-ticket");
    assert.equal(found, undefined, "TODO(ticket) should not be flagged");
  });
});

describe("checkInlinePatterns: file type filtering", () => {
  test("returns no violations when file type does not match any pattern", () => {
    const content = "npm install\nconsole.log('x');\nconfig=value123\n";
    const violations = checkInlinePatterns(content, "file.unknown", ".unknown");
    assert.equal(violations.length, 0, "Unknown file type should produce no violations");
  });

  test("returns violations array (may be empty) for empty content", () => {
    const violations = checkInlinePatterns("", "src/empty.ts", ".ts");
    assert.ok(Array.isArray(violations));
    assert.equal(violations.length, 0);
  });
});
