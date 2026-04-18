/**
 * media-analysis/self-audit.js Test Suite
 *
 * Tests the pure helpers exported by scripts/skills/media-analysis/self-audit.js:
 * - parseArgs: CLI argument parser
 * - readDepth: returns structured { depth, error } per Qodo R2 #2+#3
 * - checkTranscript: depth-aware (Quick Scan runs pass without transcript)
 * - checkSourceTypeAndTranscriptSource: depth-aware transcript_source check
 * - VALID_SOURCES: enumeration
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../../package.json"))
  ? path.resolve(__dirname, "../../../..")
  : path.resolve(__dirname, "../../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/skills/media-analysis/self-audit.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseArgs: (argv: string[]) => { slug: string | null; json: boolean };
  readDepth: (slug: string) => { depth: string | null; error: string | null };
  checkTranscript: (slug: string) => { status: string; details: string };
  checkSourceTypeAndTranscriptSource: (slug: string) => { status: string; details: string };
  VALID_SOURCES: string[];
};

const tempDirs: string[] = [];
function tmpDir(prefix = "media-self-audit-test-"): string {
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

describe("parseArgs", () => {
  test("returns null slug when missing", () => {
    const out = mod.parseArgs(["node", "self-audit.js"]);
    assert.equal(out.slug, null);
    assert.equal(out.json, false);
  });

  test("parses slug and json flag", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=yt-abc", "--json"]);
    assert.equal(out.slug, "yt-abc");
    assert.equal(out.json, true);
  });
});

describe("readDepth (Qodo R2 #2+#3 structured return)", () => {
  test("returns { depth: null, error: 'missing' } when analysis.json absent", () => {
    const uniqueSlug = `unit-test-missing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = mod.readDepth(uniqueSlug);
    // For a slug with no analysis.json, the error branch MUST populate error.
    assert.equal(result.depth, null);
    assert.ok(
      result.error === "missing" || result.error === "unreadable",
      `expected error 'missing' or 'unreadable', got '${result.error}'`
    );
  });

  test("rejects traversal slug (path validation returns error)", () => {
    const result = mod.readDepth("../escape");
    assert.equal(result.depth, null);
    // Validation throws → caught → returns error label
    assert.ok(result.error !== null);
  });
});

describe("VALID_SOURCES", () => {
  test("enumerates expected transcript sources", () => {
    assert.deepEqual(
      [...mod.VALID_SOURCES].sort((a, b) => a.localeCompare(b)),
      ["captions", "manual", "whisper"]
    );
  });
});

describe("checkTranscript", () => {
  test("rejects traversal slugs cleanly", () => {
    const result = mod.checkTranscript("../../../etc");
    assert.equal(result.status, "FAIL");
  });
});

describe("checkSourceTypeAndTranscriptSource", () => {
  test("rejects traversal slugs cleanly", () => {
    const result = mod.checkSourceTypeAndTranscriptSource("../escape");
    assert.equal(result.status, "FAIL");
  });
});

test("module exposes expected helpers", () => {
  assert.equal(typeof mod.parseArgs, "function");
  assert.equal(typeof mod.readDepth, "function");
  assert.equal(typeof mod.checkTranscript, "function");
  assert.equal(typeof mod.checkSourceTypeAndTranscriptSource, "function");
  assert.ok(Array.isArray(mod.VALID_SOURCES));
});

test("tmpDir helper creates a cleanable directory", () => {
  const d = tmpDir();
  assert.ok(fs.existsSync(d));
});
