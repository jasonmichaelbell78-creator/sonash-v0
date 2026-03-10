/**
 * Unit tests for verify-resolutions.js
 *
 * Tests: parseArgs, STOP_WORDS logic, loadJsonl safety, keyword extraction,
 * status transition rules, and report generation logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(args: string[]): { dryRun: boolean; verbose: boolean } {
  const parsed = { dryRun: true, verbose: false };
  for (const arg of args) {
    if (arg === "--write") parsed.dryRun = false;
    if (arg === "--dry-run") parsed.dryRun = true;
    if (arg === "--verbose") parsed.verbose = true;
  }
  return parsed;
}

describe("parseArgs (verify-resolutions)", () => {
  it("defaults to dryRun=true, verbose=false", () => {
    const result = parseArgs([]);
    assert.equal(result.dryRun, true);
    assert.equal(result.verbose, false);
  });

  it("--write sets dryRun=false", () => {
    assert.equal(parseArgs(["--write"]).dryRun, false);
  });

  it("--dry-run overrides --write when listed after", () => {
    assert.equal(parseArgs(["--write", "--dry-run"]).dryRun, true);
  });

  it("--verbose sets verbose=true", () => {
    assert.equal(parseArgs(["--verbose"]).verbose, true);
  });

  it("handles combined flags", () => {
    const result = parseArgs(["--write", "--verbose"]);
    assert.equal(result.dryRun, false);
    assert.equal(result.verbose, true);
  });
});

// ─── STOP_WORDS ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "in",
  "for",
  "should",
  "be",
  "to",
  "of",
  "and",
  "or",
  "not",
  "this",
  "that",
  "it",
  "with",
  "on",
  "at",
  "by",
  "from",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
]);

describe("STOP_WORDS", () => {
  it("contains 'the'", () => assert.ok(STOP_WORDS.has("the")));
  it("contains 'should'", () => assert.ok(STOP_WORDS.has("should")));
  it("does not contain 'function'", () => assert.equal(STOP_WORDS.has("function"), false));
  it("does not contain 'error'", () => assert.equal(STOP_WORDS.has("error"), false));
  it("is case-sensitive (only lowercase stored)", () => assert.equal(STOP_WORDS.has("The"), false));
});

// ─── extractKeywords ─────────────────────────────────────────────────────────

function extractKeywords(title: string, stopWords: Set<string>): string[] {
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

describe("extractKeywords", () => {
  it("extracts meaningful words from a title", () => {
    const kw = extractKeywords("Fix authentication flow", STOP_WORDS);
    assert.ok(kw.includes("fix"));
    assert.ok(kw.includes("authentication"));
    assert.ok(kw.includes("flow"));
  });

  it("filters stop words", () => {
    const kw = extractKeywords("The error should be fixed", STOP_WORDS);
    assert.equal(kw.includes("the"), false);
    assert.equal(kw.includes("should"), false);
    assert.equal(kw.includes("be"), false);
  });

  it("filters words shorter than 3 chars", () => {
    const kw = extractKeywords("Fix an IO bug", STOP_WORDS);
    assert.equal(kw.includes("an"), false);
    assert.equal(kw.includes("io"), false);
  });

  it("handles empty title", () => {
    assert.deepEqual(extractKeywords("", STOP_WORDS), []);
  });
});

// ─── loadJsonl safety ────────────────────────────────────────────────────────

function loadJsonlSafe(content: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      // skip malformed
    }
  }
  return items;
}

describe("loadJsonl (safe parsing)", () => {
  it("parses valid JSONL", () => {
    const content = `{"id":"DEBT-0001","status":"NEW"}\n{"id":"DEBT-0002","status":"RESOLVED"}`;
    const items = loadJsonlSafe(content);
    assert.equal(items.length, 2);
    assert.equal(items[0].status, "NEW");
  });

  it("skips blank lines", () => {
    const content = `{"id":"A"}\n\n{"id":"B"}`;
    assert.equal(loadJsonlSafe(content).length, 2);
  });

  it("skips malformed JSON without throwing", () => {
    const content = `{"id":"A"}\nBAD LINE\n{"id":"B"}`;
    assert.equal(loadJsonlSafe(content).length, 2);
  });

  it("returns empty array for empty content", () => {
    assert.deepEqual(loadJsonlSafe(""), []);
  });
});

// ─── Status transition rules ─────────────────────────────────────────────────

type DebtStatus = "NEW" | "VERIFIED" | "IN_PROGRESS" | "TRIAGED" | "RESOLVED" | "FALSE_POSITIVE";

function isEligibleForVerification(status: DebtStatus): boolean {
  return status === "NEW";
}

function isEligibleForResolutionAudit(status: DebtStatus): boolean {
  return status === "RESOLVED";
}

function isEligibleForFalsePositiveAudit(status: DebtStatus): boolean {
  return status === "FALSE_POSITIVE";
}

function promoteNewToVerified(item: { status: DebtStatus; file?: string }): {
  promoted: boolean;
  reason: string;
} {
  if (item.status !== "NEW") return { promoted: false, reason: "not NEW status" };
  if (!item.file || item.file === "N/A") return { promoted: false, reason: "no file reference" };
  return { promoted: true, reason: "file reference exists" };
}

describe("status transitions", () => {
  it("only NEW items are eligible for verification", () => {
    assert.equal(isEligibleForVerification("NEW"), true);
    assert.equal(isEligibleForVerification("VERIFIED"), false);
    assert.equal(isEligibleForVerification("RESOLVED"), false);
  });

  it("only RESOLVED items are eligible for resolution audit", () => {
    assert.equal(isEligibleForResolutionAudit("RESOLVED"), true);
    assert.equal(isEligibleForResolutionAudit("NEW"), false);
    assert.equal(isEligibleForResolutionAudit("FALSE_POSITIVE"), false);
  });

  it("only FALSE_POSITIVE items are eligible for false positive audit", () => {
    assert.equal(isEligibleForFalsePositiveAudit("FALSE_POSITIVE"), true);
    assert.equal(isEligibleForFalsePositiveAudit("RESOLVED"), false);
  });
});

describe("promoteNewToVerified", () => {
  it("promotes NEW item with a file path", () => {
    const result = promoteNewToVerified({ status: "NEW", file: "src/auth.ts" });
    assert.equal(result.promoted, true);
  });

  it("does not promote non-NEW items", () => {
    const result = promoteNewToVerified({ status: "VERIFIED", file: "src/auth.ts" });
    assert.equal(result.promoted, false);
    assert.equal(result.reason, "not NEW status");
  });

  it("does not promote NEW item with no file", () => {
    const result = promoteNewToVerified({ status: "NEW", file: "" });
    assert.equal(result.promoted, false);
  });

  it("does not promote NEW item with N/A file", () => {
    const result = promoteNewToVerified({ status: "NEW", file: "N/A" });
    assert.equal(result.promoted, false);
  });
});

// ─── Summary statistics ───────────────────────────────────────────────────────

interface DebtItem {
  id: string;
  status: string;
}

function buildAuditSummary(items: DebtItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}

describe("buildAuditSummary", () => {
  it("counts statuses correctly", () => {
    const items: DebtItem[] = [
      { id: "A", status: "NEW" },
      { id: "B", status: "NEW" },
      { id: "C", status: "RESOLVED" },
      { id: "D", status: "FALSE_POSITIVE" },
    ];
    const summary = buildAuditSummary(items);
    assert.equal(summary["NEW"], 2);
    assert.equal(summary["RESOLVED"], 1);
    assert.equal(summary["FALSE_POSITIVE"], 1);
  });

  it("returns empty object for empty array", () => {
    assert.deepEqual(buildAuditSummary([]), {});
  });
});

// ─── Path containment check ───────────────────────────────────────────────────

function isTraversalPath(rel: string): boolean {
  return /^\.\.(?:[\\/]|$)/.test(rel);
}

describe("path traversal guard", () => {
  it("detects '../' traversal", () => assert.equal(isTraversalPath("../secret"), true));
  it(String.raw`detects '..\' traversal on Windows paths`, () =>
    assert.equal(isTraversalPath(String.raw`..\secret`), true)
  );
  it("detects bare '..'", () => assert.equal(isTraversalPath(".."), true));
  it("allows normal relative paths", () => assert.equal(isTraversalPath("src/file.ts"), false));
  it("allows paths starting with a filename beginning '..'", () => {
    assert.equal(isTraversalPath("..config"), false);
  });
});
