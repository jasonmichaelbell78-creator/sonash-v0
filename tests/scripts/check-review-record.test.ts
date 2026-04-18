import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/hooks/check-review-record.js
// for isolated unit testing. Mirrors the script's regex + coercion helpers.

const REVIEW_FIX_PATTERN = /^fix(?:\([^)]*\))?:\s+PR #(\d+)\s+R(\d+)/i;
const CANONICAL_ID_PATTERN = /^review-pr(\d+)-r(\d+)$/i;
const TITLE_ROUND_PATTERN = /R(\d+)/i;

function parseReviewFixCommit(message: string): { pr: number; round: number } | null {
  const match = REVIEW_FIX_PATTERN.exec(message);
  if (!match) return null;
  return {
    pr: Number.parseInt(match[1], 10),
    round: Number.parseInt(match[2], 10),
  };
}

function toInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function idToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function recordMatches(
  rec: { id?: unknown; pr?: unknown; round?: unknown; title?: unknown },
  pr: number,
  round: number
): boolean {
  const idMatch = CANONICAL_ID_PATTERN.exec(idToString(rec.id));
  if (
    idMatch &&
    Number.parseInt(idMatch[1], 10) === pr &&
    Number.parseInt(idMatch[2], 10) === round
  ) {
    return true;
  }
  const recPr = toInt(rec.pr);
  const recRound = toInt(rec.round);
  if (recPr === pr && recRound === round) return true;
  if (recPr === pr && typeof rec.title === "string") {
    const roundMatch = TITLE_ROUND_PATTERN.exec(rec.title);
    if (roundMatch && Number.parseInt(roundMatch[1], 10) === round) return true;
  }
  return false;
}

describe("parseReviewFixCommit", () => {
  it("parses fix: PR #N RM subjects", () => {
    const r = parseReviewFixCommit("fix: PR #517 R1 — some title");
    assert.deepEqual(r, { pr: 517, round: 1 });
  });

  it("parses scoped fix(pr-review): PR #N RM subjects", () => {
    const r = parseReviewFixCommit("fix(pr-review): PR #494 R3 — 5 fixes");
    assert.deepEqual(r, { pr: 494, round: 3 });
  });

  it("returns null for non-fix commits that mention PR/round", () => {
    assert.equal(parseReviewFixCommit("chore: mention of PR #123 R1 in docs"), null);
    assert.equal(parseReviewFixCommit("Merge pull request #517 from feature"), null);
    assert.equal(parseReviewFixCommit("feat: new thing"), null);
  });

  it("returns null for malformed subjects", () => {
    assert.equal(parseReviewFixCommit(""), null);
    assert.equal(parseReviewFixCommit("fix: something else"), null);
    assert.equal(parseReviewFixCommit("fix: PR abc Rdef"), null);
  });
});

describe("toInt", () => {
  it("accepts positive finite numbers", () => {
    assert.equal(toInt(42), 42);
    assert.equal(toInt(1), 1);
  });

  it("rejects non-positive numbers", () => {
    assert.equal(toInt(0), null);
    assert.equal(toInt(-5), null);
  });

  it("rejects non-finite numbers", () => {
    assert.equal(toInt(Number.NaN), null);
    assert.equal(toInt(Number.POSITIVE_INFINITY), null);
  });

  it("coerces valid positive-integer strings", () => {
    assert.equal(toInt("517"), 517);
    assert.equal(toInt("1"), 1);
  });

  it("rejects invalid strings and other types", () => {
    assert.equal(toInt(""), null);
    assert.equal(toInt("abc"), null);
    assert.equal(toInt("0"), null);
    assert.equal(toInt("-1"), null);
    assert.equal(toInt(null), null);
    assert.equal(toInt(undefined), null);
    assert.equal(toInt({}), null);
  });
});

describe("recordMatches (legacy type coercion)", () => {
  it("matches canonical ID format", () => {
    assert.equal(recordMatches({ id: "review-pr517-r1" }, 517, 1), true);
    assert.equal(recordMatches({ id: "review-pr517-r1" }, 517, 2), false);
    assert.equal(recordMatches({ id: "review-pr999-r1" }, 517, 1), false);
  });

  it("matches numeric pr + round fields", () => {
    assert.equal(recordMatches({ pr: 517, round: 1 }, 517, 1), true);
    assert.equal(recordMatches({ pr: 517, round: 2 }, 517, 1), false);
  });

  it("coerces string-stored pr/round (legacy records)", () => {
    assert.equal(recordMatches({ pr: "517", round: "1" }, 517, 1), true);
    assert.equal(recordMatches({ pr: "517", round: "2" }, 517, 1), false);
  });

  it("falls back to title pattern when round field is missing", () => {
    assert.equal(recordMatches({ pr: 517, title: "PR #517 R1 — mixed" }, 517, 1), true);
    assert.equal(recordMatches({ pr: 517, title: "PR #517 R3 — suggestions" }, 517, 1), false);
  });

  it("returns false when all paths fail", () => {
    assert.equal(recordMatches({}, 517, 1), false);
    assert.equal(recordMatches({ id: null }, 517, 1), false);
    assert.equal(recordMatches({ pr: "abc" }, 517, 1), false);
  });
});
