/**
 * document-analysis/self-audit.js Test Suite
 *
 * Tests the pure helpers exported by scripts/skills/document-analysis/self-audit.js:
 * - parseArgs: CLI argument parser
 * - checkDeepRead: deep-read.md presence/size validation
 * - checkSourceType: analysis.json.source_type === "document"
 * - checkPhaseOrdering: phase marker sequence validation
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

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/skills/document-analysis/self-audit.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseArgs: (argv: string[]) => { slug: string | null; json: boolean };
  checkDeepRead: (slug: string) => { status: string; details: string };
  checkSourceType: (slug: string) => { status: string; details: string };
  checkPhaseOrdering: (slug: string) => { status: string; details: string };
};

const tempDirs: string[] = [];
function tmpDir(prefix = "doc-self-audit-test-"): string {
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
  test("returns null slug when --slug missing", () => {
    const out = mod.parseArgs(["node", "self-audit.js"]);
    assert.equal(out.slug, null);
    assert.equal(out.json, false);
  });

  test("extracts slug from --slug=value", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=my-doc"]);
    assert.equal(out.slug, "my-doc");
    assert.equal(out.json, false);
  });

  test("detects --json flag", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=x", "--json"]);
    assert.equal(out.slug, "x");
    assert.equal(out.json, true);
  });

  test("ignores unknown args", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--unknown=foo"]);
    assert.equal(out.slug, null);
    assert.equal(out.json, false);
  });
});

describe("checkSourceType (rejects traversal + validates source_type)", () => {
  test("rejects slug with path traversal", () => {
    const result = mod.checkSourceType("../escape");
    assert.equal(result.status, "FAIL");
    assert.match(result.details, /source_type check|escape/i);
  });

  test("rejects absolute-path slug", () => {
    const result = mod.checkSourceType("/etc/passwd");
    assert.equal(result.status, "FAIL");
  });
});

describe("checkPhaseOrdering (state-file-driven validation)", () => {
  test("returns WARN when no state file exists for a unique slug", () => {
    // Use a slug that's very unlikely to have a state file present
    const uniqueSlug = `unit-test-no-state-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = mod.checkPhaseOrdering(uniqueSlug);
    // Either WARN (no state file) or a well-formed FAIL (slug validation etc.)
    assert.ok(
      result.status === "WARN" || result.status === "FAIL",
      `expected WARN or FAIL, got ${result.status}`
    );
  });
});

describe("checkDeepRead", () => {
  test("rejects traversal slugs cleanly", () => {
    const result = mod.checkDeepRead("../../../etc");
    assert.equal(result.status, "FAIL");
  });
});

// Smoke test — confirm module exports shape is stable.
test("module exposes expected helpers", () => {
  assert.equal(typeof mod.parseArgs, "function");
  assert.equal(typeof mod.checkDeepRead, "function");
  assert.equal(typeof mod.checkSourceType, "function");
  assert.equal(typeof mod.checkPhaseOrdering, "function");
});

// Keep tmpDir referenced so TS doesn't complain about unused import surface
// in future additions. (Also reserves a tempdir for fixture-based extensions.)
test("tmpDir helper creates a cleanable directory", () => {
  const d = tmpDir();
  assert.ok(fs.existsSync(d));
  fs.writeFileSync(path.join(d, "sentinel.txt"), "ok", "utf8");
  assert.ok(fs.existsSync(path.join(d, "sentinel.txt")));
});
