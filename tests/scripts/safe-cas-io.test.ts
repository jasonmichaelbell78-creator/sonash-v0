/**
 * safe-cas-io.js Test Suite
 *
 * Tests the shared CAS I/O helpers:
 * - safeReadText / safeReadJson (parent-chain symlink guard + regular-file enforcement)
 * - safeWriteJson (delegates to safeWriteFileSync)
 * - isValidArtifactFile (strict file-type + size check)
 * - validateCandidate (Zod-backed, accepts empty-string description)
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const modPath = path.resolve(PROJECT_ROOT, "scripts/lib/safe-cas-io.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(modPath) as {
  safeReadText: (filePath: string) => string;
  safeReadJson: (filePath: string) => unknown;
  safeWriteJson: (filePath: string, data: unknown) => void;
  isValidArtifactFile: (filePath: string) => boolean;
  validateCandidate: (candidate: unknown) => string[];
};

const { safeReadText, safeReadJson, safeWriteJson, isValidArtifactFile, validateCandidate } = mod;

const tempDirs: string[] = [];
function tmpDir(prefix = "safe-cas-io-test-"): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(d);
  return d;
}
afterEach(() => {
  while (tempDirs.length > 0) {
    const d = tempDirs.pop();
    if (d) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
});

describe("safeReadText", () => {
  test("reads UTF-8 content from a regular file", () => {
    const dir = tmpDir();
    const f = path.join(dir, "data.txt");
    fs.writeFileSync(f, "hello world");
    assert.equal(safeReadText(f), "hello world");
  });

  test("throws when the target is a directory", () => {
    const dir = tmpDir();
    assert.throws(() => safeReadText(dir), /Not a regular file|EISDIR/);
  });

  test("throws ENOENT for a missing file", () => {
    const dir = tmpDir();
    assert.throws(() => safeReadText(path.join(dir, "missing.txt")), /ENOENT/);
  });

  test("refuses a symlink pointing at a regular file", () => {
    const dir = tmpDir();
    const target = path.join(dir, "target.txt");
    const link = path.join(dir, "link.txt");
    fs.writeFileSync(target, "payload");
    try {
      fs.symlinkSync(target, link);
    } catch {
      // Symlink creation can fail on Windows without privileges — skip.
      return;
    }
    assert.throws(() => safeReadText(link), /symlink|Refusing/i);
  });
});

describe("safeReadJson", () => {
  test("parses JSON from a regular file", () => {
    const dir = tmpDir();
    const f = path.join(dir, "data.json");
    fs.writeFileSync(f, JSON.stringify({ k: "v" }));
    assert.deepEqual(safeReadJson(f), { k: "v" });
  });

  test("throws SyntaxError for invalid JSON", () => {
    const dir = tmpDir();
    const f = path.join(dir, "bad.json");
    fs.writeFileSync(f, "{ not valid");
    assert.throws(() => safeReadJson(f), SyntaxError);
  });
});

describe("safeWriteJson", () => {
  test("writes pretty-printed JSON with trailing newline", () => {
    const dir = tmpDir();
    const f = path.join(dir, "out.json");
    safeWriteJson(f, { k: "v", n: 1 });
    const raw = fs.readFileSync(f, "utf8");
    assert.ok(raw.endsWith("\n"));
    assert.deepEqual(JSON.parse(raw), { k: "v", n: 1 });
  });

  test("produces 2-space indentation", () => {
    const dir = tmpDir();
    const f = path.join(dir, "out.json");
    safeWriteJson(f, { a: 1 });
    const raw = fs.readFileSync(f, "utf8");
    assert.match(raw, /\n {2}"a": 1/);
  });
});

describe("isValidArtifactFile", () => {
  test("accepts a non-empty regular file", () => {
    const dir = tmpDir();
    const f = path.join(dir, "a.json");
    fs.writeFileSync(f, '{"k":"v"}');
    assert.equal(isValidArtifactFile(f), true);
  });

  test("rejects an empty file", () => {
    const dir = tmpDir();
    const f = path.join(dir, "empty.json");
    fs.writeFileSync(f, "");
    assert.equal(isValidArtifactFile(f), false);
  });

  test("rejects a directory", () => {
    const dir = tmpDir();
    const sub = path.join(dir, "sub");
    fs.mkdirSync(sub);
    assert.equal(isValidArtifactFile(sub), false);
  });

  test("rejects a non-existent path", () => {
    const dir = tmpDir();
    assert.equal(isValidArtifactFile(path.join(dir, "nope")), false);
  });

  test("never throws — returns false for any exception", () => {
    // Passing a wildly invalid path must not crash the loop.
    assert.doesNotThrow(() => isValidArtifactFile("\0invalid"));
    assert.equal(isValidArtifactFile("\0invalid"), false);
  });
});

describe("validateCandidate", () => {
  function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      name: "X",
      type: "pattern",
      description: "desc",
      novelty: "medium",
      effort: "E1",
      relevance: "high",
      tags: [],
      ...overrides,
    };
  }

  test("returns empty array for a valid candidate", () => {
    assert.deepEqual(validateCandidate(valid()), []);
  });

  test("empty-string description is VALID (PR #505 fix)", () => {
    assert.deepEqual(validateCandidate(valid({ description: "" })), []);
  });

  test("reports missing name", () => {
    const problems = validateCandidate(valid({ name: undefined }));
    assert.ok(problems.length > 0);
    assert.ok(problems.some((p) => p.includes("name")));
  });

  test("reports invalid novelty enum", () => {
    const problems = validateCandidate(valid({ novelty: "weird" }));
    assert.ok(problems.some((p) => p.includes("novelty")));
  });

  test("reports invalid effort enum", () => {
    const problems = validateCandidate(valid({ effort: "E42" }));
    assert.ok(problems.some((p) => p.includes("effort")));
  });

  test("reports invalid relevance enum", () => {
    const problems = validateCandidate(valid({ relevance: "maybe" }));
    assert.ok(problems.some((p) => p.includes("relevance")));
  });

  test("reports invalid type enum", () => {
    const problems = validateCandidate(valid({ type: "not-a-type" }));
    assert.ok(problems.some((p) => p.includes("type")));
  });

  test("returns an error for a non-object candidate", () => {
    assert.ok(validateCandidate(null).length > 0);
    assert.ok(validateCandidate("string").length > 0);
  });
});
