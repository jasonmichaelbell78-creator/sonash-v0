/**
 * planning/lib/read-jsonl.js Test Suite
 *
 * Tests the JSONL parser and escapeCell helper from scripts/planning/lib/read-jsonl.js.
 * Uses temp directories to avoid touching real planning files.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before, afterEach } from "node:test";
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

interface ReadJsonlModule {
  readJsonl: (planningDir: string, filename: string) => object[];
  escapeCell: (str: string | null | undefined) => string;
}

let mod: ReadJsonlModule;
const tmpDirs: string[] = [];

before(async () => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/planning/lib/read-jsonl.js");
  const moduleUrl = "file://" + srcPath.replaceAll(/\\/g, "/");
  // Permitted ESM workaround: TypeScript CJS output compiles `import()` to `require()`
  // which cannot handle file:// URLs. Function-wrapped import forces a true ESM dynamic import.
  // Input is always a hardcoded path from path.resolve(), never user-controlled.
  const dynamicImport = new Function("url", "return import(url)") as (
    url: string
  ) => Promise<unknown>;
  mod = (await dynamicImport(moduleUrl)) as ReadJsonlModule;
});

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort cleanup
      }
    }
  }
});

function createTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-jsonl-test-"));
  tmpDirs.push(dir);
  return dir;
}

// =========================================================
// readJsonl
// =========================================================

describe("planning.readJsonl", () => {
  it("parses valid JSONL file", () => {
    const dir = createTmpDir();
    fs.writeFileSync(
      path.join(dir, "items.jsonl"),
      ['{"id":1,"title":"First"}', '{"id":2,"title":"Second"}'].join("\n"),
      "utf-8"
    );
    const result = mod.readJsonl(dir, "items.jsonl");
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], { id: 1, title: "First" });
  });

  it("skips blank lines", () => {
    const dir = createTmpDir();
    fs.writeFileSync(
      path.join(dir, "items.jsonl"),
      ['{"id":1}', "", '{"id":2}', ""].join("\n"),
      "utf-8"
    );
    const result = mod.readJsonl(dir, "items.jsonl");
    assert.equal(result.length, 2);
  });

  it("skips comment lines starting with //", () => {
    const dir = createTmpDir();
    fs.writeFileSync(
      path.join(dir, "items.jsonl"),
      ["// This is a comment", '{"id":1}', "// Another comment", '{"id":2}'].join("\n"),
      "utf-8"
    );
    const result = mod.readJsonl(dir, "items.jsonl");
    assert.equal(result.length, 2);
  });

  it("skips indented comment lines", () => {
    const dir = createTmpDir();
    fs.writeFileSync(
      path.join(dir, "items.jsonl"),
      ["  // indented comment", '{"id":1}'].join("\n"),
      "utf-8"
    );
    const result = mod.readJsonl(dir, "items.jsonl");
    assert.equal(result.length, 1);
  });

  it("returns empty array for file with only comments and blanks", () => {
    const dir = createTmpDir();
    fs.writeFileSync(path.join(dir, "empty.jsonl"), ["// comment", "   ", ""].join("\n"), "utf-8");
    const result = mod.readJsonl(dir, "empty.jsonl");
    assert.equal(result.length, 0);
  });

  it("handles CRLF line endings", () => {
    const dir = createTmpDir();
    fs.writeFileSync(path.join(dir, "crlf.jsonl"), '{"id":1}\r\n{"id":2}\r\n', "utf-8");
    const result = mod.readJsonl(dir, "crlf.jsonl");
    assert.equal(result.length, 2);
  });

  it("warns but skips invalid JSON lines (non-fatal)", () => {
    const dir = createTmpDir();
    fs.writeFileSync(
      path.join(dir, "mixed.jsonl"),
      ['{"id":1}', "this is not json", '{"id":3}'].join("\n"),
      "utf-8"
    );
    const captured: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => captured.push(args.join(" "));
    try {
      const result = mod.readJsonl(dir, "mixed.jsonl");
      // Valid lines should be parsed, invalid line skipped with warning
      assert.equal(result.length, 2);
      assert.ok(
        captured.some((w) => w.includes("parse error")),
        "Should emit parse warning"
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});

// =========================================================
// escapeCell
// =========================================================

describe("planning.escapeCell", () => {
  it("escapes pipe characters", () => {
    const result = mod.escapeCell("value with | pipe");
    assert.ok(!result.includes(" | "), "Unescaped pipe should be replaced");
    assert.ok(result.includes(String.raw`\|`), "Pipe should be escaped");
  });

  it("escapes backslashes", () => {
    const result = mod.escapeCell(String.raw`path\to\file`);
    // Backslash should be doubled
    assert.ok(result.includes(String.raw`\\`), "Backslashes should be escaped");
  });

  it("replaces newlines with spaces", () => {
    const result = mod.escapeCell("line1\nline2");
    assert.ok(!result.includes("\n"), "Newlines should be removed");
    assert.ok(result.includes("line1 line2"), "Newline should be replaced with space");
  });

  it("strips carriage returns", () => {
    const result = mod.escapeCell("value\r\nwith crlf");
    assert.ok(!result.includes("\r"), "Carriage returns should be removed");
  });

  it("returns empty string for null", () => {
    const result = mod.escapeCell(null);
    assert.equal(result, "");
  });

  it("returns empty string for undefined", () => {
    const result = mod.escapeCell(undefined);
    assert.equal(result, "");
  });

  it("returns the same string for plain text with no special chars", () => {
    const result = mod.escapeCell("simple text");
    assert.equal(result, "simple text");
  });
});
