import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/compute-changelog-metrics.js

describe("compute-changelog-metrics: filterByPR", () => {
  function filterByPR(records: Array<{ pr: unknown }>, prNum: number): Array<{ pr: unknown }> {
    return records.filter((r) => Number(r.pr) === prNum);
  }

  it("filters records by PR number", () => {
    const records = [
      { pr: 395, finding: "issue A" },
      { pr: 396, finding: "issue B" },
      { pr: 395, finding: "issue C" },
    ];
    const result = filterByPR(records, 395);
    assert.strictEqual(result.length, 2);
  });

  it("returns empty when PR not found", () => {
    const records = [{ pr: 395, finding: "issue A" }];
    assert.strictEqual(filterByPR(records, 999).length, 0);
  });
});

describe("compute-changelog-metrics: filterByRange", () => {
  function filterByRange(
    records: Array<{ pr: unknown }>,
    start: number,
    end: number
  ): Array<{ pr: unknown }> {
    return records.filter((r) => {
      const pr = Number(r.pr);
      return Number.isFinite(pr) && pr >= start && pr <= end;
    });
  }

  it("filters records within range", () => {
    const records = [{ pr: 378 }, { pr: 395 }, { pr: 416 }, { pr: 420 }];
    const result = filterByRange(records, 378, 416);
    assert.strictEqual(result.length, 3);
  });

  it("handles inclusive boundaries", () => {
    const records = [{ pr: 378 }, { pr: 416 }];
    assert.strictEqual(filterByRange(records, 378, 416).length, 2);
  });
});

describe("compute-changelog-metrics: computeMetrics", () => {
  function toFiniteNumber(value: unknown, fallback = 0): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function computeMetrics(records: Array<Record<string, unknown>>): {
    totalFindings: number;
    totalFixed: number;
    fixRate: number;
  } {
    let totalFindings = 0;
    let totalFixed = 0;
    for (const record of records) {
      totalFindings += toFiniteNumber(record["findings"]);
      totalFixed += toFiniteNumber(record["fixed"]);
    }
    const fixRate = totalFindings > 0 ? Math.round((totalFixed / totalFindings) * 100) : 0;
    return { totalFindings, totalFixed, fixRate };
  }

  it("computes correct totals", () => {
    const records = [
      { findings: 8, fixed: 6 },
      { findings: 5, fixed: 4 },
    ];
    const metrics = computeMetrics(records);
    assert.strictEqual(metrics.totalFindings, 13);
    assert.strictEqual(metrics.totalFixed, 10);
  });

  it("calculates fix rate as percentage", () => {
    const records = [{ findings: 10, fixed: 8 }];
    const metrics = computeMetrics(records);
    assert.strictEqual(metrics.fixRate, 80);
  });

  it("handles zero findings gracefully", () => {
    const metrics = computeMetrics([]);
    assert.strictEqual(metrics.fixRate, 0);
  });

  it("handles non-numeric values with fallback", () => {
    const metrics = computeMetrics([{ findings: "invalid", fixed: null }]);
    assert.strictEqual(metrics.totalFindings, 0);
    assert.strictEqual(metrics.totalFixed, 0);
  });
});

describe("compute-changelog-metrics: JSONL parsing", () => {
  function parseReviewsJsonl(content: string): unknown[] {
    const cleaned = content.replace(/^\uFEFF/, "");
    const lines = cleaned.trim().split("\n");
    const records: unknown[] = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        records.push(JSON.parse(line));
      } catch {
        // skip
      }
    }
    return records;
  }

  it("strips BOM before parsing", () => {
    const content = '\uFEFF{"pr":395,"findings":8}';
    const records = parseReviewsJsonl(content);
    assert.strictEqual(records.length, 1);
  });

  it("handles multiple records", () => {
    const content = '{"pr":395}\n{"pr":396}\n{"pr":397}';
    assert.strictEqual(parseReviewsJsonl(content).length, 3);
  });
});
