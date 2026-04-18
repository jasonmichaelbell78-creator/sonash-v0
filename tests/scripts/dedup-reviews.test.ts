import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/reviews/dedup-reviews.js for
// isolated unit testing. Covers the classifier, keeper-picker, and next-id
// helpers that drive the dedup strategy.

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

interface Entry {
  lineIndex: number;
  record: Rec;
}

function contentSignature(r: Rec): string {
  return JSON.stringify({
    title: r.title || "",
    pr: r.pr ?? null,
    source: r.source || "",
    total: r.total ?? 0,
    fixed: r.fixed ?? 0,
    rejected: r.rejected ?? 0,
    deferred: r.deferred ?? 0,
  });
}

function classifyGroup(group: Entry[]): { strategy: string } {
  if (group.length < 2) return { strategy: "none" };
  const sigs = new Set(group.map((e) => contentSignature(e.record)));
  if (sigs.size === 1) return { strategy: "true-duplicate" };
  const titles = new Set(group.map((e) => (e.record.title || "").trim()));
  const prs = new Set(group.map((e) => e.record.pr ?? null));
  if (titles.size === 1 && prs.size === 1) {
    return { strategy: "progressive-update" };
  }
  return { strategy: "namespace-collision" };
}

function weight(r: Rec) {
  const learnings = Array.isArray(r.learnings) ? r.learnings.length : 0;
  const patterns = Array.isArray(r.patterns) ? r.patterns.length : 0;
  const metrics = (r.fixed ?? 0) + (r.total ?? 0);
  return { learnings, patterns, metrics };
}

function pickKeeper(group: Entry[], strategy: string): Entry {
  if (strategy === "true-duplicate") {
    return group.slice().sort((a, b) => {
      const wa = weight(a.record);
      const wb = weight(b.record);
      return wb.learnings - wa.learnings || wb.patterns - wa.patterns || a.lineIndex - b.lineIndex;
    })[0];
  }
  if (strategy === "progressive-update") {
    return group.slice().sort((a, b) => {
      const wa = weight(a.record);
      const wb = weight(b.record);
      return wb.metrics - wa.metrics || b.lineIndex - a.lineIndex;
    })[0];
  }
  return group.slice().sort((a, b) => {
    const aDate = a.record.date && a.record.date !== "unknown" ? 0 : 1;
    const bDate = b.record.date && b.record.date !== "unknown" ? 0 : 1;
    return aDate - bDate || a.lineIndex - b.lineIndex;
  })[0];
}

const REV_ID_PATTERN = /^rev-(\d+)$/;

function nextRevId(records: Entry[], used: Set<string>): string {
  let max = 0;
  for (const { record } of records) {
    const m = REV_ID_PATTERN.exec(String(record.id));
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  for (const id of used) {
    const m = REV_ID_PATTERN.exec(id);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  return `rev-${max + 1}`;
}

describe("classifyGroup", () => {
  it("returns 'none' for single-entry groups", () => {
    assert.equal(classifyGroup([{ lineIndex: 0, record: { id: 1 } }]).strategy, "none");
  });

  it("returns 'true-duplicate' when all signatures match", () => {
    const rec: Rec = { id: 1, title: "T", pr: 100, source: "sonar", total: 5, fixed: 5 };
    const group: Entry[] = [
      { lineIndex: 0, record: rec },
      { lineIndex: 5, record: { ...rec } },
    ];
    assert.equal(classifyGroup(group).strategy, "true-duplicate");
  });

  it("returns 'progressive-update' when same title/pr but differing metrics", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 1, title: "T", pr: 100, total: 5, fixed: 5 } },
      { lineIndex: 5, record: { id: 1, title: "T", pr: 100, total: 10, fixed: 10 } },
    ];
    assert.equal(classifyGroup(group).strategy, "progressive-update");
  });

  it("returns 'namespace-collision' for different titles or PRs", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 53, title: "Jan 5 review", pr: null } },
      { lineIndex: 5, record: { id: 53, title: "PR #470 R1", pr: null } },
    ];
    assert.equal(classifyGroup(group).strategy, "namespace-collision");
  });
});

describe("pickKeeper", () => {
  it("true-duplicate: prefers entry with more learnings", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 1, learnings: ["a"] } },
      { lineIndex: 5, record: { id: 1, learnings: ["a", "b", "c"] } },
    ];
    const keeper = pickKeeper(group, "true-duplicate");
    assert.equal(keeper.lineIndex, 5);
  });

  it("true-duplicate: tie-breaks on earlier lineIndex when learnings equal", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 1, learnings: ["a"] } },
      { lineIndex: 5, record: { id: 1, learnings: ["b"] } },
    ];
    const keeper = pickKeeper(group, "true-duplicate");
    assert.equal(keeper.lineIndex, 0);
  });

  it("progressive-update: prefers entry with higher fixed+total", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 1, total: 5, fixed: 5 } },
      { lineIndex: 5, record: { id: 1, total: 20, fixed: 20 } },
    ];
    const keeper = pickKeeper(group, "progressive-update");
    assert.equal(keeper.lineIndex, 5);
  });

  it("namespace-collision: prefers entry with real (non-unknown) date", () => {
    const group: Entry[] = [
      { lineIndex: 0, record: { id: 53, date: "2026-01-05" } },
      { lineIndex: 5, record: { id: 53, date: "unknown" } },
    ];
    const keeper = pickKeeper(group, "namespace-collision");
    assert.equal(keeper.lineIndex, 0);
  });
});

describe("nextRevId", () => {
  it("returns rev-1 for empty records", () => {
    assert.equal(nextRevId([], new Set()), "rev-1");
  });

  it("returns max+1 from existing rev-N ids", () => {
    const records: Entry[] = [
      { lineIndex: 0, record: { id: "rev-5" } },
      { lineIndex: 1, record: { id: "rev-94" } },
      { lineIndex: 2, record: { id: "rev-12" } },
    ];
    assert.equal(nextRevId(records, new Set()), "rev-95");
  });

  it("accounts for already-used ids not yet in records", () => {
    const records: Entry[] = [{ lineIndex: 0, record: { id: "rev-10" } }];
    const used = new Set(["rev-20", "rev-15"]);
    assert.equal(nextRevId(records, used), "rev-21");
  });

  it("ignores non-rev IDs (numeric legacy, string hashes)", () => {
    const records: Entry[] = [
      { lineIndex: 0, record: { id: 358 } },
      { lineIndex: 1, record: { id: "retro-42" } },
      { lineIndex: 2, record: { id: "rev-5" } },
    ];
    assert.equal(nextRevId(records, new Set()), "rev-6");
  });
});
