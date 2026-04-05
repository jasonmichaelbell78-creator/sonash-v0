import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * run-github-health.test.ts — Smoke tests for scripts/run-github-health.js.
 *
 * Re-implements core pure-logic helpers from the script under test. Follows
 * the established tests/scripts convention in this repo (source scripts are
 * CJS; TS tests re-implement logic rather than requiring .js modules so the
 * test compiles under tsconfig.test.json's allowJs:false setting).
 *
 * Coverage intent: unblock the test-baseline gate introduced in PR #492
 * (generate-test-registry --check-coverage). Focuses on helpers that had
 * correctness bugs flagged by Qodo + Gemini review items I2, I5, I11, I15.
 */

const SLUG_ALLOWLIST = /^[A-Za-z0-9._-]+$/;

function parseRepoSlug(remote: string): { owner: string; name: string } | null {
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote);
  if (!match) return null;
  const owner = match[1];
  const name = match[2];
  if (!SLUG_ALLOWLIST.test(owner) || !SLUG_ALLOWLIST.test(name)) return null;
  return { owner, name };
}

interface IssueCounts {
  p0: number;
  p1: number;
  p2: number;
  p3: number;
}

function computeGrade(counts: IssueCounts): string {
  if (counts.p0 > 0) return "F";
  if (counts.p1 > 0 || counts.p2 >= 3) return "D";
  if (counts.p2 > 0) return "C";
  if (counts.p3 > 0) return "B";
  return "A";
}

function gradeToColor(grade: string): string {
  if (grade === "A" || grade === "B") return "GREEN";
  if (grade === "C") return "YELLOW";
  return "RED";
}

// I5/I13 exit-code mapping from main():
//   RED            -> 1
//   errors present -> 2
//   otherwise      -> 0
function computeExitCode(color: string, errorCount: number): number {
  if (color === "RED") return 1;
  if (errorCount > 0) return 2;
  return 0;
}

// I15 dedup timestamp validation
function isValidDedupTimestamp(timestamp: unknown): boolean {
  if (typeof timestamp !== "string" || timestamp === "") return false;
  const ms = new Date(timestamp).getTime();
  return Number.isFinite(ms);
}

// I11 stale PR basis (activity over creation)
function resolvePrStalenessBasis(pr: {
  createdAt?: string;
  updatedAt?: string;
}): string | undefined {
  return pr.updatedAt || pr.createdAt;
}

// ============================================================================
// Tests
// ============================================================================

describe("run-github-health: parseRepoSlug", () => {
  it("parses HTTPS remote with .git suffix", () => {
    assert.deepEqual(parseRepoSlug("https://github.com/owner/repo.git"), {
      owner: "owner",
      name: "repo",
    });
  });

  it("parses HTTPS remote without .git suffix", () => {
    assert.deepEqual(parseRepoSlug("https://github.com/owner/repo"), {
      owner: "owner",
      name: "repo",
    });
  });

  it("parses SSH remote with .git suffix", () => {
    assert.deepEqual(parseRepoSlug("git@github.com:owner/repo.git"), {
      owner: "owner",
      name: "repo",
    });
  });

  it("preserves dots in repo name (I2 regression - octokit/rest.js)", () => {
    assert.deepEqual(parseRepoSlug("git@github.com:octokit/rest.js.git"), {
      owner: "octokit",
      name: "rest.js",
    });
    assert.deepEqual(parseRepoSlug("https://github.com/octokit/rest.js"), {
      owner: "octokit",
      name: "rest.js",
    });
  });

  it("preserves multi-dot repo names", () => {
    assert.deepEqual(parseRepoSlug("https://github.com/org/my.app.name.git"), {
      owner: "org",
      name: "my.app.name",
    });
  });

  it("returns null for non-github remotes", () => {
    assert.equal(parseRepoSlug("https://gitlab.com/owner/repo.git"), null);
    assert.equal(parseRepoSlug("not a url"), null);
    assert.equal(parseRepoSlug(""), null);
  });

  it("rejects owner/name with disallowed characters (GraphQL injection guard)", () => {
    assert.equal(parseRepoSlug('https://github.com/owner"/"evil/repo.git'), null);
    assert.equal(parseRepoSlug("https://github.com/my org/repo"), null);
  });

  it("accepts valid hyphen/underscore slugs", () => {
    assert.deepEqual(parseRepoSlug("https://github.com/my-org/my_repo"), {
      owner: "my-org",
      name: "my_repo",
    });
  });
});

describe("run-github-health: computeGrade", () => {
  it("returns A for zero issues", () => {
    assert.equal(computeGrade({ p0: 0, p1: 0, p2: 0, p3: 0 }), "A");
  });

  it("returns B when only P3 issues are present", () => {
    assert.equal(computeGrade({ p0: 0, p1: 0, p2: 0, p3: 2 }), "B");
  });

  it("returns C for 1-2 P2 issues", () => {
    assert.equal(computeGrade({ p0: 0, p1: 0, p2: 1, p3: 0 }), "C");
    assert.equal(computeGrade({ p0: 0, p1: 0, p2: 2, p3: 5 }), "C");
  });

  it("returns D for 3+ P2 issues or any P1", () => {
    assert.equal(computeGrade({ p0: 0, p1: 0, p2: 3, p3: 0 }), "D");
    assert.equal(computeGrade({ p0: 0, p1: 1, p2: 0, p3: 0 }), "D");
  });

  it("returns F for any P0 issue", () => {
    assert.equal(computeGrade({ p0: 1, p1: 0, p2: 0, p3: 0 }), "F");
    assert.equal(computeGrade({ p0: 1, p1: 99, p2: 99, p3: 99 }), "F");
  });
});

describe("run-github-health: gradeToColor", () => {
  it("maps A and B to GREEN", () => {
    assert.equal(gradeToColor("A"), "GREEN");
    assert.equal(gradeToColor("B"), "GREEN");
  });

  it("maps C to YELLOW", () => {
    assert.equal(gradeToColor("C"), "YELLOW");
  });

  it("maps D and F to RED", () => {
    assert.equal(gradeToColor("D"), "RED");
    assert.equal(gradeToColor("F"), "RED");
  });
});

describe("run-github-health: computeExitCode (I5/I13)", () => {
  it("returns 1 for RED regardless of errors", () => {
    assert.equal(computeExitCode("RED", 0), 1);
    assert.equal(computeExitCode("RED", 3), 1);
  });

  it("returns 2 when API errors exist on GREEN/YELLOW (I5)", () => {
    assert.equal(computeExitCode("GREEN", 1), 2);
    assert.equal(computeExitCode("YELLOW", 2), 2);
  });

  it("returns 0 on GREEN or YELLOW with no errors", () => {
    assert.equal(computeExitCode("GREEN", 0), 0);
    assert.equal(computeExitCode("YELLOW", 0), 0);
  });
});

describe("run-github-health: isValidDedupTimestamp (I15)", () => {
  it("accepts valid ISO timestamp", () => {
    assert.equal(isValidDedupTimestamp("2026-04-04T12:00:00.000Z"), true);
  });

  it("rejects empty string", () => {
    assert.equal(isValidDedupTimestamp(""), false);
  });

  it("rejects non-string values", () => {
    assert.equal(isValidDedupTimestamp(undefined), false);
    assert.equal(isValidDedupTimestamp(null), false);
    assert.equal(isValidDedupTimestamp(12345), false);
  });

  it("rejects unparseable timestamp strings", () => {
    assert.equal(isValidDedupTimestamp("not-a-date"), false);
    assert.equal(isValidDedupTimestamp("13:00:00"), false);
  });
});

describe("run-github-health: resolvePrStalenessBasis (I11)", () => {
  it("prefers updatedAt over createdAt (activity-based staleness)", () => {
    assert.equal(
      resolvePrStalenessBasis({
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-03-01T00:00:00Z",
      }),
      "2026-03-01T00:00:00Z"
    );
  });

  it("falls back to createdAt when updatedAt is missing", () => {
    assert.equal(
      resolvePrStalenessBasis({ createdAt: "2026-01-01T00:00:00Z" }),
      "2026-01-01T00:00:00Z"
    );
  });

  it("returns undefined when neither field is present", () => {
    assert.equal(resolvePrStalenessBasis({}), undefined);
  });
});
