/**
 * Unit tests for assign-roadmap-refs.js
 *
 * Tests: parseArgs, normalizeRoadmapRef, getTrackAssignment category and path rules.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(args: string[]): { dryRun: boolean; verbose: boolean; report: boolean } {
  const parsed = { dryRun: false, verbose: false, report: false };
  for (const arg of args) {
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--verbose") parsed.verbose = true;
    else if (arg === "--report") parsed.report = true;
  }
  return parsed;
}

describe("parseArgs (assign-roadmap-refs)", () => {
  it("defaults all flags to false", () => {
    const result = parseArgs([]);
    assert.equal(result.dryRun, false);
    assert.equal(result.verbose, false);
    assert.equal(result.report, false);
  });

  it("sets dryRun", () => assert.equal(parseArgs(["--dry-run"]).dryRun, true));
  it("sets verbose", () => assert.equal(parseArgs(["--verbose"]).verbose, true));
  it("sets report", () => assert.equal(parseArgs(["--report"]).report, true));

  it("handles all flags together", () => {
    const result = parseArgs(["--dry-run", "--verbose", "--report"]);
    assert.equal(result.dryRun, true);
    assert.equal(result.verbose, true);
    assert.equal(result.report, true);
  });
});

// ─── normalizeRoadmapRef ──────────────────────────────────────────────────────

function normalizeRoadmapRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const normalizations: Record<string, string> = {
    "Track P": "Track-P",
    "Track D": "Track-D",
    "Track B": "Track-B",
    "Track T": "Track-T",
    "Track E": "Track-E",
    "Track S": "Track-S",
    "M2.1 Code Quality": "M2.1",
  };
  return normalizations[ref] || ref;
}

describe("normalizeRoadmapRef", () => {
  it("normalizes 'Track P' to 'Track-P'", () => {
    assert.equal(normalizeRoadmapRef("Track P"), "Track-P");
  });

  it("normalizes 'Track S' to 'Track-S'", () => {
    assert.equal(normalizeRoadmapRef("Track S"), "Track-S");
  });

  it("normalizes 'M2.1 Code Quality' to 'M2.1'", () => {
    assert.equal(normalizeRoadmapRef("M2.1 Code Quality"), "M2.1");
  });

  it("passes through already-normalized refs unchanged", () => {
    assert.equal(normalizeRoadmapRef("Track-P"), "Track-P");
    assert.equal(normalizeRoadmapRef("M2.1"), "M2.1");
  });

  it("returns null for null input", () => {
    assert.equal(normalizeRoadmapRef(null), null);
  });

  it("returns null for undefined", () => {
    assert.equal(normalizeRoadmapRef(undefined), null);
  });

  it("returns null for empty string", () => {
    assert.equal(normalizeRoadmapRef(""), null);
  });
});

// ─── getTrackAssignment ───────────────────────────────────────────────────────

function getTrackAssignment(item: { category: string; file?: string }): string {
  const category = item.category;
  const filePath = item.file || "";

  switch (category) {
    case "security":
      return "Track-S";
    case "performance":
      return "Track-P";
    case "process":
      return "Track-D";
    case "refactoring":
      return "M2.3-REF";
    case "documentation":
      return "M1.5";
    default:
      break;
  }

  // code-quality: path-based
  if (filePath.startsWith("scripts/") || filePath.startsWith(".claude/")) return "Track-E";
  if (filePath.startsWith(".github/")) return "Track-D";
  if (filePath.startsWith("tests/")) return "Track-T";
  if (filePath.startsWith("functions/")) return "M2.2";
  if (
    filePath.startsWith("components/") ||
    filePath.startsWith("lib/") ||
    filePath.startsWith("app/") ||
    filePath.startsWith("hooks/")
  ) {
    return "M2.1";
  }
  if (filePath.startsWith("docs/")) return "M1.5";
  return "M2.1";
}

describe("getTrackAssignment — category-based", () => {
  it("assigns security to Track-S", () => {
    assert.equal(getTrackAssignment({ category: "security" }), "Track-S");
  });

  it("assigns performance to Track-P", () => {
    assert.equal(getTrackAssignment({ category: "performance" }), "Track-P");
  });

  it("assigns process to Track-D", () => {
    assert.equal(getTrackAssignment({ category: "process" }), "Track-D");
  });

  it("assigns refactoring to M2.3-REF", () => {
    assert.equal(getTrackAssignment({ category: "refactoring" }), "M2.3-REF");
  });

  it("assigns documentation to M1.5", () => {
    assert.equal(getTrackAssignment({ category: "documentation" }), "M1.5");
  });
});

describe("getTrackAssignment — code-quality path-based", () => {
  it("scripts/ -> Track-E", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: "scripts/debt/sync.js" }),
      "Track-E"
    );
  });

  it(".claude/ -> Track-E", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: ".claude/hooks/pre-commit.sh" }),
      "Track-E"
    );
  });

  it(".github/ -> Track-D", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: ".github/workflows/ci.yml" }),
      "Track-D"
    );
  });

  it("tests/ -> Track-T", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: "tests/unit/auth.test.ts" }),
      "Track-T"
    );
  });

  it("functions/ -> M2.2", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: "functions/src/index.ts" }),
      "M2.2"
    );
  });

  it("components/ -> M2.1", () => {
    assert.equal(
      getTrackAssignment({ category: "code-quality", file: "components/Button.tsx" }),
      "M2.1"
    );
  });

  it("app/ -> M2.1", () => {
    assert.equal(getTrackAssignment({ category: "code-quality", file: "app/page.tsx" }), "M2.1");
  });

  it("docs/ -> M1.5", () => {
    assert.equal(getTrackAssignment({ category: "code-quality", file: "docs/README.md" }), "M1.5");
  });

  it("unknown path defaults to M2.1", () => {
    assert.equal(getTrackAssignment({ category: "code-quality", file: "unknown/file.ts" }), "M2.1");
  });

  it("no file defaults to M2.1", () => {
    assert.equal(getTrackAssignment({ category: "code-quality" }), "M2.1");
  });
});
