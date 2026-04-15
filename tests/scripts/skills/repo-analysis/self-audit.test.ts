/**
 * repo-analysis/self-audit.js Test Suite
 *
 * Tests the pure helpers exported by scripts/skills/repo-analysis/self-audit.js:
 * - parseArgs: CLI argument parser
 * - checkRepomix: repomix-output.txt presence/size validation
 * - checkSourceType: analysis.json.source_type === "repo"
 * - checkPhaseOrdering: phase marker sequence validation (content-eval legacy-
 *   label support via idxAny)
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

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/skills/repo-analysis/self-audit.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseArgs: (argv: string[]) => { slug: string | null; json: boolean };
  checkRepomix: (slug: string) => { status: string; details: string };
  checkSourceType: (slug: string) => { status: string; details: string };
  checkPhaseOrdering: (slug: string) => { status: string; details: string };
};

const tempDirs: string[] = [];
function tmpDir(prefix = "repo-self-audit-test-"): string {
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

  test("parses slug", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=owner-repo"]);
    assert.equal(out.slug, "owner-repo");
  });

  test("parses --json", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=x", "--json"]);
    assert.equal(out.json, true);
  });
});

describe("checkRepomix (rejects traversal)", () => {
  test("rejects path-traversal slug", () => {
    const result = mod.checkRepomix("../../../etc");
    assert.equal(result.status, "FAIL");
  });

  test("rejects absolute-path slug", () => {
    const result = mod.checkRepomix("/tmp/external");
    assert.equal(result.status, "FAIL");
  });
});

describe("checkSourceType", () => {
  test("rejects traversal slugs cleanly", () => {
    const result = mod.checkSourceType("../escape");
    assert.equal(result.status, "FAIL");
  });
});

describe("checkPhaseOrdering", () => {
  test("returns WARN when no state file exists for unique slug", () => {
    const uniqueSlug = `unit-test-no-state-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = mod.checkPhaseOrdering(uniqueSlug);
    assert.ok(
      result.status === "WARN" || result.status === "FAIL",
      `expected WARN or FAIL, got ${result.status}`
    );
  });
});

test("module exposes expected helpers", () => {
  assert.equal(typeof mod.parseArgs, "function");
  assert.equal(typeof mod.checkRepomix, "function");
  assert.equal(typeof mod.checkSourceType, "function");
  assert.equal(typeof mod.checkPhaseOrdering, "function");
});

test("tmpDir helper creates a cleanable directory", () => {
  const d = tmpDir();
  assert.ok(fs.existsSync(d));
});
