/**
 * Consolidated unit tests for read-jsonl.ts and write-jsonl.ts
 *
 * Tests readValidatedJsonl() and appendRecord() via their compiled dist
 * modules. All I/O is isolated to temp directories.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { z } from "zod";

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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readValidatedJsonl } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/read-jsonl.js")
) as {
  readValidatedJsonl: <T>(
    filePath: string,
    schema: z.ZodType<T>,
    options?: { quiet?: boolean }
  ) => { valid: T[]; warnings: string[] };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendRecord } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/write-jsonl.js")
) as {
  appendRecord: <T>(filePath: string, record: T, schema: z.ZodType<T>) => void;
};

// =========================================================
// Test schema
// =========================================================

const WidgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.number(),
});
type Widget = z.infer<typeof WidgetSchema>;

// =========================================================
// Temp directory setup
// =========================================================

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rw-jsonl-test-"));
  // safe-fs.js is required by write-jsonl at runtime via findProjectRoot
  // The real project root is used, so no stub needed here.
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// =========================================================
// 1. readValidatedJsonl
// =========================================================

describe("readValidatedJsonl", () => {
  test("returns valid records and no warnings for a well-formed JSONL file", () => {
    const w1: Widget = { id: "w1", name: "Alpha", value: 1 };
    const w2: Widget = { id: "w2", name: "Beta", value: 2 };
    const filePath = path.join(tmpDir, "widgets.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(w1) + "\n" + JSON.stringify(w2) + "\n");

    const { valid, warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.equal(valid.length, 2);
    assert.equal(warnings.length, 0);
    assert.equal(valid[0].id, "w1");
    assert.equal(valid[1].id, "w2");
  });

  test("returns empty results for a missing file (never throws)", () => {
    const missing = path.join(tmpDir, "nonexistent.jsonl");
    const { valid, warnings } = readValidatedJsonl(missing, WidgetSchema, { quiet: true });
    assert.deepEqual(valid, []);
    assert.ok(Array.isArray(warnings));
  });

  test("returns empty results for an empty file", () => {
    const filePath = path.join(tmpDir, "empty.jsonl");
    fs.writeFileSync(filePath, "");
    const { valid, warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.deepEqual(valid, []);
    assert.deepEqual(warnings, []);
  });

  test("separates valid and invalid records, warning for each invalid one", () => {
    const good: Widget = { id: "good", name: "Good", value: 42 };
    const bad = { name: "Missing id and value" };
    const filePath = path.join(tmpDir, "mixed.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(good) + "\n" + JSON.stringify(bad) + "\n");

    const { valid, warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.equal(valid.length, 1);
    assert.equal(valid[0].id, "good");
    assert.equal(warnings.length, 1);
  });

  test("warning message includes the record id when present", () => {
    const bad = { id: "bad-widget", name: "Name" }; // missing value
    const filePath = path.join(tmpDir, "bad.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(bad) + "\n");

    const { warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.ok(warnings[0].includes("bad-widget"));
  });

  test("warning message uses 'unknown' id when record has no id field", () => {
    const bad = { name: "No id" };
    const filePath = path.join(tmpDir, "noid.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(bad) + "\n");

    const { warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.ok(warnings[0].includes("unknown"));
  });

  test("skips blank lines without producing warnings", () => {
    const good: Widget = { id: "w1", name: "Widget", value: 10 };
    const filePath = path.join(tmpDir, "blanks.jsonl");
    fs.writeFileSync(filePath, "\n" + JSON.stringify(good) + "\n\n\n");

    const { valid, warnings } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.equal(valid.length, 1);
    assert.equal(warnings.length, 0);
  });

  test("handles CRLF line endings", () => {
    const w: Widget = { id: "crlf", name: "CRLF", value: 99 };
    const filePath = path.join(tmpDir, "crlf.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(w) + "\r\n");

    const { valid } = readValidatedJsonl(filePath, WidgetSchema, { quiet: true });
    assert.equal(valid.length, 1);
    assert.equal(valid[0].id, "crlf");
  });
});

// =========================================================
// 2. appendRecord
// =========================================================

describe("appendRecord", () => {
  test("appends a valid record as a JSON line", () => {
    const filePath = path.join(tmpDir, "output.jsonl");
    const widget: Widget = { id: "w1", name: "Widget One", value: 1 };
    appendRecord(filePath, widget, WidgetSchema);

    const content = fs.readFileSync(filePath, "utf-8").trim();
    const parsed = JSON.parse(content) as Widget;
    assert.equal(parsed.id, "w1");
    assert.equal(parsed.name, "Widget One");
    assert.equal(parsed.value, 1);
  });

  test("appends multiple records to the same file", () => {
    const filePath = path.join(tmpDir, "multi.jsonl");
    appendRecord(filePath, { id: "a", name: "A", value: 1 }, WidgetSchema);
    appendRecord(filePath, { id: "b", name: "B", value: 2 }, WidgetSchema);
    appendRecord(filePath, { id: "c", name: "C", value: 3 }, WidgetSchema);

    const lines = fs.readFileSync(filePath, "utf-8").trim().split("\n");
    assert.equal(lines.length, 3);
    assert.equal((JSON.parse(lines[0]) as Widget).id, "a");
    assert.equal((JSON.parse(lines[1]) as Widget).id, "b");
    assert.equal((JSON.parse(lines[2]) as Widget).id, "c");
  });

  test("creates parent directories if they do not exist", () => {
    const deep = path.join(tmpDir, "new", "nested", "dir", "file.jsonl");
    const widget: Widget = { id: "deep", name: "Deep", value: 9 };
    appendRecord(deep, widget, WidgetSchema);

    assert.ok(fs.existsSync(deep));
    const parsed = JSON.parse(fs.readFileSync(deep, "utf-8").trim()) as Widget;
    assert.equal(parsed.id, "deep");
  });

  test("throws ZodError for an invalid record (schema validation)", () => {
    const filePath = path.join(tmpDir, "invalid.jsonl");
    const bad = { id: "", name: "Missing value" }; // id too short, value missing

    assert.throws(
      () => appendRecord(filePath, bad as unknown as Widget, WidgetSchema),
      (err: Error) => err.name === "ZodError"
    );

    // File should not be created on validation failure
    assert.ok(!fs.existsSync(filePath), "File should not be created when validation fails");
  });

  test("each appended record ends with a newline", () => {
    const filePath = path.join(tmpDir, "newline.jsonl");
    appendRecord(filePath, { id: "x", name: "X", value: 0 }, WidgetSchema);

    const raw = fs.readFileSync(filePath, "utf-8");
    assert.ok(raw.endsWith("\n"), "Each record should end with a newline");
  });

  test("refuses to write to a symlink path (safe-fs guard)", () => {
    // Create a real file, then make a symlink pointing to it
    const realFile = path.join(tmpDir, "real.jsonl");
    const symLink = path.join(tmpDir, "link.jsonl");
    fs.writeFileSync(realFile, "");
    try {
      fs.symlinkSync(realFile, symLink);
    } catch {
      // Symlink creation may fail in some CI environments — skip the sub-test
      return;
    }

    const widget: Widget = { id: "sym", name: "Sym", value: 7 };
    assert.throws(
      () => appendRecord(symLink, widget, WidgetSchema),
      (err: Error) =>
        err.message.includes("unsafe") ||
        err.message.includes("symlink") ||
        err.message.includes("Refusing")
    );
  });
});
