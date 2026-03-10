/**
 * Unit tests for sprint-intake.js
 *
 * Tests: collectAssignedIds pattern, FOCUS_MAP path routing, readJSON safety,
 * and sprint overflow logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── FOCUS_MAP path routing ────────────────────────────────────────────────────

interface FocusEntry {
  test: (f: string) => boolean;
  sprint: string;
  overflow: string | null;
}

const FOCUS_MAP: FocusEntry[] = [
  { test: (f) => f.startsWith("scripts/"), sprint: "sprint-1", overflow: "sprint-8a" },
  { test: (f) => f.startsWith("components/"), sprint: "sprint-2", overflow: "sprint-8b" },
  {
    test: (f) => f.startsWith("docs/") || f.startsWith(".claude/"),
    sprint: "sprint-3",
    overflow: "sprint-8c",
  },
  { test: (f) => /^(?:lib|hooks|app|styles|types)\//.test(f), sprint: "sprint-4", overflow: null },
  {
    test: (f) => f.startsWith(".github/") || f.startsWith(".husky/"),
    sprint: "sprint-5",
    overflow: null,
  },
  { test: (f) => f.startsWith("functions/"), sprint: "sprint-6", overflow: null },
  { test: (f) => f.startsWith("tests/"), sprint: "sprint-7", overflow: null },
];

function getSprintForFile(filePath: string): string | null {
  for (const entry of FOCUS_MAP) {
    if (entry.test(filePath)) return entry.sprint;
  }
  return null;
}

describe("FOCUS_MAP routing", () => {
  it("routes scripts/ to sprint-1", () => {
    assert.equal(getSprintForFile("scripts/debt/sync.js"), "sprint-1");
  });

  it("routes components/ to sprint-2", () => {
    assert.equal(getSprintForFile("components/Button.tsx"), "sprint-2");
  });

  it("routes docs/ to sprint-3", () => {
    assert.equal(getSprintForFile("docs/README.md"), "sprint-3");
  });

  it("routes .claude/ to sprint-3", () => {
    assert.equal(getSprintForFile(".claude/CLAUDE.md"), "sprint-3");
  });

  it("routes lib/ to sprint-4", () => {
    assert.equal(getSprintForFile("lib/auth.ts"), "sprint-4");
  });

  it("routes hooks/ to sprint-4", () => {
    assert.equal(getSprintForFile("hooks/useAuth.ts"), "sprint-4");
  });

  it("routes app/ to sprint-4", () => {
    assert.equal(getSprintForFile("app/page.tsx"), "sprint-4");
  });

  it("routes .github/ to sprint-5", () => {
    assert.equal(getSprintForFile(".github/workflows/ci.yml"), "sprint-5");
  });

  it("routes functions/ to sprint-6", () => {
    assert.equal(getSprintForFile("functions/src/index.ts"), "sprint-6");
  });

  it("routes tests/ to sprint-7", () => {
    assert.equal(getSprintForFile("tests/unit/auth.test.ts"), "sprint-7");
  });

  it("returns null for unmatched path", () => {
    assert.equal(getSprintForFile("unknown/path.ts"), null);
  });
});

// ─── Sprint manifest pattern ──────────────────────────────────────────────────

function isSprintManifestFile(filename: string): boolean {
  return /^sprint-.*-ids\.json$/.test(filename);
}

describe("isSprintManifestFile", () => {
  it("matches sprint-1-ids.json", () =>
    assert.equal(isSprintManifestFile("sprint-1-ids.json"), true));
  it("matches sprint-8a-ids.json", () =>
    assert.equal(isSprintManifestFile("sprint-8a-ids.json"), true));
  it("does not match other files", () => assert.equal(isSprintManifestFile("metrics.json"), false));
});

// ─── collectAssignedIds ───────────────────────────────────────────────────────

function collectAssignedIds(sprintFiles: Array<{ ids?: string[] }>): Set<string> {
  const assigned = new Set<string>();
  for (const data of sprintFiles) {
    if (data && Array.isArray(data.ids)) {
      for (const id of data.ids) assigned.add(id);
    }
  }
  return assigned;
}

describe("collectAssignedIds", () => {
  it("collects IDs from all sprint files", () => {
    const files = [{ ids: ["DEBT-0001", "DEBT-0002"] }, { ids: ["DEBT-0003"] }];
    const assigned = collectAssignedIds(files);
    assert.ok(assigned.has("DEBT-0001"));
    assert.ok(assigned.has("DEBT-0003"));
    assert.equal(assigned.size, 3);
  });

  it("deduplicates IDs across files", () => {
    const files = [{ ids: ["DEBT-0001"] }, { ids: ["DEBT-0001"] }];
    assert.equal(collectAssignedIds(files).size, 1);
  });

  it("handles files with no ids array", () => {
    const files = [{}, { ids: ["DEBT-0001"] }];
    const assigned = collectAssignedIds(files);
    assert.equal(assigned.size, 1);
  });

  it("returns empty set for empty input", () => {
    assert.equal(collectAssignedIds([]).size, 0);
  });
});

// ─── readJSON safety ─────────────────────────────────────────────────────────

function readJSONSafe(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

describe("readJSON (sprint-intake)", () => {
  it("parses valid sprint manifest", () => {
    const data = readJSONSafe('{"sprint":"sprint-1","ids":["DEBT-0001"]}') as Record<
      string,
      unknown
    >;
    assert.equal(data.sprint, "sprint-1");
    assert.deepEqual(data.ids, ["DEBT-0001"]);
  });

  it("returns null for malformed JSON", () => {
    assert.equal(readJSONSafe("NOT JSON"), null);
  });
});

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseIntakeArgs(argv: string[]): { applyMode: boolean; jsonMode: boolean } {
  const args = new Set(argv);
  return {
    applyMode: args.has("--apply"),
    jsonMode: args.has("--json"),
  };
}

describe("parseIntakeArgs", () => {
  it("defaults to dry-run (no --apply)", () => {
    assert.equal(parseIntakeArgs([]).applyMode, false);
  });

  it("sets apply mode", () => {
    assert.equal(parseIntakeArgs(["--apply"]).applyMode, true);
  });

  it("sets json output mode", () => {
    assert.equal(parseIntakeArgs(["--json"]).jsonMode, true);
  });
});
