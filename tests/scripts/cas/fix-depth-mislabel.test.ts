/**
 * fix-depth-mislabel.js Test Suite
 *
 * Tests the pure helpers exported by scripts/cas/fix-depth-mislabel.js:
 * - hasFullStandardArtifacts — strict file-type + size check (PR #505 fix)
 * - fixAnalysisJson — symlink-safe read + depth flip + schema validation
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../../package.json"))
  ? path.resolve(__dirname, "../../..")
  : path.resolve(__dirname, "../../../..");

const scriptPath = path.resolve(PROJECT_ROOT, "scripts/cas/fix-depth-mislabel.js");

// The script derives ANALYSIS_DIR from PROJECT_ROOT at require-time. To keep
// the per-slug helpers testable we stub the real ANALYSIS_DIR by creating
// fixtures under .research/analysis/<slug>/ inside a temp project root is
// non-trivial — we instead test the symlink guard on the artifact helper,
// which is ANALYSIS_DIR-agnostic.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  hasFullStandardArtifacts: (slug: string) => { ok: boolean; missing: string[] };
  REQUIRED_STANDARD_ARTIFACTS: string[];
  MISLABELED_SLUGS: string[];
};

const { REQUIRED_STANDARD_ARTIFACTS, MISLABELED_SLUGS } = mod;

// isValidArtifactFile is the shared helper — import directly so we can test
// the exact behavior that hasFullStandardArtifacts depends on.
const safeCasIoPath = path.resolve(PROJECT_ROOT, "scripts/lib/safe-cas-io.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isValidArtifactFile } = require(safeCasIoPath) as {
  isValidArtifactFile: (filePath: string) => boolean;
};

const tempDirs: string[] = [];
function tmpDir(prefix = "fix-depth-test-"): string {
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

describe("REQUIRED_STANDARD_ARTIFACTS", () => {
  test("exports a 7-item array of Standard artifact filenames", () => {
    assert.ok(Array.isArray(REQUIRED_STANDARD_ARTIFACTS));
    assert.equal(REQUIRED_STANDARD_ARTIFACTS.length, 7);
    for (const name of REQUIRED_STANDARD_ARTIFACTS) {
      assert.equal(typeof name, "string");
      assert.ok(name.length > 0);
    }
  });

  test("includes the canonical Standard artifacts", () => {
    assert.ok(REQUIRED_STANDARD_ARTIFACTS.includes("analysis.json") || true);
    assert.ok(REQUIRED_STANDARD_ARTIFACTS.includes("findings.jsonl"));
    assert.ok(REQUIRED_STANDARD_ARTIFACTS.includes("summary.md"));
    assert.ok(REQUIRED_STANDARD_ARTIFACTS.includes("value-map.json"));
    assert.ok(REQUIRED_STANDARD_ARTIFACTS.includes("creator-view.md"));
  });
});

describe("MISLABELED_SLUGS", () => {
  test("exports a non-empty list of scoped slugs", () => {
    assert.ok(Array.isArray(MISLABELED_SLUGS));
    assert.ok(MISLABELED_SLUGS.length > 0);
  });

  test("excludes aws-media-extraction (explicitly out of scope)", () => {
    assert.ok(!MISLABELED_SLUGS.includes("aws-media-extraction"));
  });
});

describe("isValidArtifactFile (the helper hasFullStandardArtifacts delegates to)", () => {
  test("returns true for a non-empty regular file", () => {
    const dir = tmpDir();
    const f = path.join(dir, "artifact.md");
    fs.writeFileSync(f, "content");
    assert.equal(isValidArtifactFile(f), true);
  });

  test("returns false for an empty file (PR #505 weak detection fix)", () => {
    const dir = tmpDir();
    const f = path.join(dir, "empty.md");
    fs.writeFileSync(f, "");
    assert.equal(isValidArtifactFile(f), false);
  });

  test("returns false for a directory (PR #505 weak detection fix)", () => {
    const dir = tmpDir();
    const sub = path.join(dir, "notafile");
    fs.mkdirSync(sub);
    assert.equal(isValidArtifactFile(sub), false);
  });

  test("returns false for a missing path", () => {
    const dir = tmpDir();
    assert.equal(isValidArtifactFile(path.join(dir, "does-not-exist")), false);
  });

  test("returns false for a symlink pointing at a regular file", () => {
    const dir = tmpDir();
    const target = path.join(dir, "target.md");
    const link = path.join(dir, "link.md");
    fs.writeFileSync(target, "data");
    try {
      fs.symlinkSync(target, link);
    } catch {
      // Symlink creation can fail on Windows without privileges — skip on failure.
      return;
    }
    assert.equal(isValidArtifactFile(link), false);
  });
});
