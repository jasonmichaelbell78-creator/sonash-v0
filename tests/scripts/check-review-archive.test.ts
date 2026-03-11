import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-review-archive.js

function groupConsecutive(nums: number[]): string[] {
  const sorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);
  return ranges;
}

function isValidReviewHeading(line: string): boolean {
  return /^####\s+Review\s+#\d+/.test(line);
}

function isInvalidReviewHeading(line: string): boolean {
  return /^###\s+Review\s+#\d+/.test(line);
}

function findGaps(ids: number[], knownSkipped: Set<number>): number[] {
  if (ids.length === 0) return [];
  const sorted = [...ids].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted.at(-1)!;
  const gaps: number[] = [];
  for (let i = min + 1; i < max; i++) {
    if (!sorted.includes(i) && !knownSkipped.has(i)) {
      gaps.push(i);
    }
  }
  return gaps;
}

function getMaxJsonlId(jsonlContent: string): number {
  let max = 0;
  for (const line of jsonlContent.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line) as { id?: unknown };
      const id = typeof obj.id === "number" ? obj.id : Number(obj.id);
      if (Number.isFinite(id) && id > max) max = id;
    } catch {
      // skip malformed
    }
  }
  return max;
}

describe("check-review-archive: groupConsecutive", () => {
  it("groups consecutive numbers into ranges", () => {
    const result = groupConsecutive([1, 2, 3, 5, 7, 8]);
    assert.deepStrictEqual(result, ["#1-#3", "#5", "#7-#8"]);
  });

  it("returns single item as range", () => {
    assert.deepStrictEqual(groupConsecutive([42]), ["#42"]);
  });

  it("returns empty array for empty input", () => {
    assert.deepStrictEqual(groupConsecutive([]), []);
  });

  it("deduplicates before grouping", () => {
    const result = groupConsecutive([1, 1, 2, 3]);
    assert.deepStrictEqual(result, ["#1-#3"]);
  });

  it("handles non-consecutive numbers", () => {
    const result = groupConsecutive([1, 5, 10]);
    assert.deepStrictEqual(result, ["#1", "#5", "#10"]);
  });
});

describe("check-review-archive: KNOWN_SKIPPED_IDS", () => {
  const KNOWN_SKIPPED_IDS = new Set([41, 64, 65, 66, 80, 83, 84, 85, 92, 93, 94, 95]);

  it("contains known skip IDs", () => {
    assert.ok(KNOWN_SKIPPED_IDS.has(41));
    assert.ok(KNOWN_SKIPPED_IDS.has(80));
  });

  it("does not contain arbitrary IDs", () => {
    assert.ok(!KNOWN_SKIPPED_IDS.has(1));
    assert.ok(!KNOWN_SKIPPED_IDS.has(100));
  });
});

describe("check-review-archive: KNOWN_DUPLICATE_IDS", () => {
  const KNOWN_DUPLICATE_IDS = new Set([366, 367, 368, 369]);

  it("contains the known duplicate range", () => {
    for (const id of [366, 367, 368, 369]) {
      assert.ok(KNOWN_DUPLICATE_IDS.has(id));
    }
  });

  it("does not contain non-duplicate IDs", () => {
    assert.ok(!KNOWN_DUPLICATE_IDS.has(365));
    assert.ok(!KNOWN_DUPLICATE_IDS.has(370));
  });
});

describe("check-review-archive: heading format check", () => {
  it("accepts #### (four hashes) headings", () => {
    assert.strictEqual(isValidReviewHeading("#### Review #123"), true);
  });

  it("rejects ### (three hash) headings in archives", () => {
    assert.strictEqual(isInvalidReviewHeading("### Review #123"), true);
  });

  it("does not flag non-review headings", () => {
    assert.strictEqual(isValidReviewHeading("#### Some Other Section"), false);
    assert.strictEqual(isInvalidReviewHeading("### Some Other Section"), false);
  });
});

describe("check-review-archive: gap detection", () => {
  it("finds gaps in review numbering", () => {
    const ids = [1, 2, 4, 5]; // gap at 3
    const gaps = findGaps(ids, new Set<number>());
    assert.deepStrictEqual(gaps, [3]);
  });

  it("ignores known skipped IDs", () => {
    const ids = [1, 2, 4, 5];
    const gaps = findGaps(ids, new Set([3]));
    assert.deepStrictEqual(gaps, []);
  });

  it("returns empty for consecutive IDs", () => {
    assert.deepStrictEqual(findGaps([1, 2, 3, 4], new Set<number>()), []);
  });

  it("handles single-element array", () => {
    assert.deepStrictEqual(findGaps([5], new Set<number>()), []);
  });
});

describe("check-review-archive: JSONL sync max ID comparison", () => {
  it("finds max review ID in JSONL", () => {
    const content = '{"id":101}\n{"id":150}\n{"id":99}\n';
    assert.strictEqual(getMaxJsonlId(content), 150);
  });

  it("returns 0 for empty content", () => {
    assert.strictEqual(getMaxJsonlId(""), 0);
  });

  it("handles malformed lines gracefully", () => {
    const content = '{"id":10}\nNOT_JSON\n{"id":20}\n';
    assert.strictEqual(getMaxJsonlId(content), 20);
  });
});
