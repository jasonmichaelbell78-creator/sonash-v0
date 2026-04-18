import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const scriptPath = path.resolve(PROJECT_ROOT, "scripts/hooks/check-review-record.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  parseReviewFixCommit: (message: string) => { pr: number; round: number } | null;
  toInt: (v: unknown) => number | null;
  idToString: (v: unknown) => string;
  recordMatches: (
    rec: { id?: unknown; pr?: unknown; round?: unknown; title?: unknown },
    pr: number,
    round: number
  ) => boolean;
};

describe("parseReviewFixCommit", () => {
  it("parses fix: PR #N RM subjects", () => {
    const r = mod.parseReviewFixCommit("fix: PR #517 R1 - some title");
    assert.deepEqual(r, { pr: 517, round: 1 });
  });

  it("parses scoped fix(pr-review): PR #N RM subjects", () => {
    const r = mod.parseReviewFixCommit("fix(pr-review): PR #494 R3 - 5 fixes");
    assert.deepEqual(r, { pr: 494, round: 3 });
  });

  it("returns null for non-fix commits that mention PR/round", () => {
    assert.equal(mod.parseReviewFixCommit("chore: mention of PR #123 R1 in docs"), null);
    assert.equal(mod.parseReviewFixCommit("Merge pull request #517 from feature"), null);
    assert.equal(mod.parseReviewFixCommit("feat: new thing"), null);
  });

  it("returns null for malformed subjects", () => {
    assert.equal(mod.parseReviewFixCommit(""), null);
    assert.equal(mod.parseReviewFixCommit("fix: something else"), null);
    assert.equal(mod.parseReviewFixCommit("fix: PR abc Rdef"), null);
  });
});

describe("toInt", () => {
  it("accepts positive finite numbers", () => {
    assert.equal(mod.toInt(42), 42);
    assert.equal(mod.toInt(1), 1);
  });

  it("rejects non-positive numbers", () => {
    assert.equal(mod.toInt(0), null);
    assert.equal(mod.toInt(-5), null);
  });

  it("rejects non-finite numbers", () => {
    assert.equal(mod.toInt(Number.NaN), null);
    assert.equal(mod.toInt(Number.POSITIVE_INFINITY), null);
  });

  it("coerces valid positive-integer strings", () => {
    assert.equal(mod.toInt("517"), 517);
    assert.equal(mod.toInt("1"), 1);
  });

  it("rejects invalid strings and other types", () => {
    assert.equal(mod.toInt(""), null);
    assert.equal(mod.toInt("abc"), null);
    assert.equal(mod.toInt("0"), null);
    assert.equal(mod.toInt("-1"), null);
    assert.equal(mod.toInt(null), null);
    assert.equal(mod.toInt(undefined), null);
    assert.equal(mod.toInt({}), null);
  });
});

describe("idToString", () => {
  it("returns string inputs as-is", () => {
    assert.equal(mod.idToString("review-pr517-r1"), "review-pr517-r1");
  });

  it("stringifies finite numbers", () => {
    assert.equal(mod.idToString(42), "42");
  });

  it("returns empty for null, undefined, objects, non-finite", () => {
    assert.equal(mod.idToString(null), "");
    assert.equal(mod.idToString(undefined), "");
    assert.equal(mod.idToString({}), "");
    assert.equal(mod.idToString(Number.NaN), "");
  });
});

describe("recordMatches", () => {
  it("matches canonical ID format", () => {
    assert.equal(mod.recordMatches({ id: "review-pr517-r1" }, 517, 1), true);
    assert.equal(mod.recordMatches({ id: "review-pr517-r1" }, 517, 2), false);
  });

  it("matches numeric pr + round fields", () => {
    assert.equal(mod.recordMatches({ pr: 517, round: 1 }, 517, 1), true);
    assert.equal(mod.recordMatches({ pr: 517, round: 2 }, 517, 1), false);
  });

  it("coerces string-stored pr/round (legacy records)", () => {
    assert.equal(mod.recordMatches({ pr: "517", round: "1" }, 517, 1), true);
  });

  it("falls back to title pattern when round field is missing", () => {
    assert.equal(mod.recordMatches({ pr: 517, title: "PR #517 R1" }, 517, 1), true);
    assert.equal(mod.recordMatches({ pr: 517, title: "PR #517 R3" }, 517, 1), false);
  });

  it("returns false when all paths fail", () => {
    assert.equal(mod.recordMatches({}, 517, 1), false);
    assert.equal(mod.recordMatches({ id: null }, 517, 1), false);
  });
});
