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
const scriptPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dedup-reviews.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(scriptPath) as {
  classifyGroup: (group: { lineIndex: number; record: Rec }[]) => { strategy: string };
  pickKeeper: (
    group: { lineIndex: number; record: Rec }[],
    strategy: string
  ) => { lineIndex: number; record: Rec };
  nextRevId: (records: { lineIndex: number; record: Rec }[], used: Set<string>) => string;
};

interface Rec {
  id: string | number;
  title?: string;
  pr?: number | null;
  source?: string;
  total?: number;
  fixed?: number;
  rejected?: number;
  deferred?: number;
  learnings?: string[];
  patterns?: string[];
  date?: string;
}

describe("classifyGroup", () => {
  it("returns none for single-entry groups", () => {
    assert.equal(mod.classifyGroup([{ lineIndex: 0, record: { id: 1 } }]).strategy, "none");
  });

  it("returns true-duplicate when all signatures match", () => {
    const rec: Rec = { id: 1, title: "T", pr: 100, source: "sonar", total: 5, fixed: 5 };
    const group = [
      { lineIndex: 0, record: rec },
      { lineIndex: 5, record: { ...rec } },
    ];
    assert.equal(mod.classifyGroup(group).strategy, "true-duplicate");
  });

  it("returns progressive-update when same title/pr but differing metrics", () => {
    const group = [
      { lineIndex: 0, record: { id: 1, title: "T", pr: 100, total: 5, fixed: 5 } as Rec },
      { lineIndex: 5, record: { id: 1, title: "T", pr: 100, total: 10, fixed: 10 } as Rec },
    ];
    assert.equal(mod.classifyGroup(group).strategy, "progressive-update");
  });

  it("returns namespace-collision for different titles or PRs", () => {
    const group = [
      { lineIndex: 0, record: { id: 53, title: "Jan 5 review", pr: null } as Rec },
      { lineIndex: 5, record: { id: 53, title: "PR #470 R1", pr: null } as Rec },
    ];
    assert.equal(mod.classifyGroup(group).strategy, "namespace-collision");
  });
});

describe("pickKeeper", () => {
  it("true-duplicate: prefers entry with more learnings", () => {
    const group = [
      { lineIndex: 0, record: { id: 1, learnings: ["a"] } as Rec },
      { lineIndex: 5, record: { id: 1, learnings: ["a", "b", "c"] } as Rec },
    ];
    const keeper = mod.pickKeeper(group, "true-duplicate");
    assert.equal(keeper.lineIndex, 5);
  });

  it("progressive-update: prefers entry with higher fixed+total", () => {
    const group = [
      { lineIndex: 0, record: { id: 1, total: 5, fixed: 5 } as Rec },
      { lineIndex: 5, record: { id: 1, total: 20, fixed: 20 } as Rec },
    ];
    const keeper = mod.pickKeeper(group, "progressive-update");
    assert.equal(keeper.lineIndex, 5);
  });

  it("namespace-collision: prefers entry with real (non-unknown) date", () => {
    const group = [
      { lineIndex: 0, record: { id: 53, date: "2026-01-05" } as Rec },
      { lineIndex: 5, record: { id: 53, date: "unknown" } as Rec },
    ];
    const keeper = mod.pickKeeper(group, "namespace-collision");
    assert.equal(keeper.lineIndex, 0);
  });
});

describe("nextRevId", () => {
  it("returns rev-1 for empty records", () => {
    assert.equal(mod.nextRevId([], new Set()), "rev-1");
  });

  it("returns max+1 from existing rev-N ids", () => {
    const records = [
      { lineIndex: 0, record: { id: "rev-5" } as Rec },
      { lineIndex: 1, record: { id: "rev-94" } as Rec },
      { lineIndex: 2, record: { id: "rev-12" } as Rec },
    ];
    assert.equal(mod.nextRevId(records, new Set()), "rev-95");
  });

  it("accounts for already-used ids not yet in records", () => {
    const records = [{ lineIndex: 0, record: { id: "rev-10" } as Rec }];
    const used = new Set(["rev-20", "rev-15"]);
    assert.equal(mod.nextRevId(records, used), "rev-21");
  });

  it("ignores non-rev IDs (numeric legacy, string hashes)", () => {
    const records = [
      { lineIndex: 0, record: { id: 358 } as Rec },
      { lineIndex: 1, record: { id: "retro-42" } as Rec },
      { lineIndex: 2, record: { id: "rev-5" } as Rec },
    ];
    assert.equal(mod.nextRevId(records, new Set()), "rev-6");
  });
});
