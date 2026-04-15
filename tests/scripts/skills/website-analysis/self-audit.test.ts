/**
 * website-analysis/self-audit.js Test Suite
 *
 * Tests the pure helpers exported by scripts/skills/website-analysis/self-audit.js:
 * - parseArgs: CLI argument parser
 * - checkMetaJson: meta.json presence and field validation
 * - checkSourceTypeAndCompliance: source_type and compliance status validation
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

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/skills/website-analysis/self-audit.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseArgs: (argv: string[]) => { slug: string | null; json: boolean };
  checkMetaJson: (slug: string) => { status: string; details: string };
  checkSourceTypeAndCompliance: (slug: string) => { status: string; details: string };
};

const tempDirs: string[] = [];
function tmpDir(prefix = "web-self-audit-test-"): string {
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

  test("parses slug and json", () => {
    const out = mod.parseArgs(["node", "self-audit.js", "--slug=example-com", "--json"]);
    assert.equal(out.slug, "example-com");
    assert.equal(out.json, true);
  });
});

describe("checkMetaJson", () => {
  test("rejects traversal slug", () => {
    const result = mod.checkMetaJson("../escape");
    assert.equal(result.status, "FAIL");
  });

  test("rejects absolute-path slug", () => {
    const result = mod.checkMetaJson("/etc/meta");
    assert.equal(result.status, "FAIL");
  });
});

describe("checkSourceTypeAndCompliance", () => {
  test("rejects traversal slug", () => {
    const result = mod.checkSourceTypeAndCompliance("../escape");
    assert.equal(result.status, "FAIL");
  });
});

test("module exposes expected helpers", () => {
  assert.equal(typeof mod.parseArgs, "function");
  assert.equal(typeof mod.checkMetaJson, "function");
  assert.equal(typeof mod.checkSourceTypeAndCompliance, "function");
});

test("tmpDir helper creates a cleanable directory", () => {
  const d = tmpDir();
  assert.ok(fs.existsSync(d));
});
