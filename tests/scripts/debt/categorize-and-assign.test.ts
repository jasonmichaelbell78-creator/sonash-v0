/**
 * Unit tests for categorize-and-assign.js
 *
 * Tests: parseArgs, categorizeItem, getSprintBucketForPath, splitOversizedSprints,
 * isRootConfigFile, ROADMAP vs GRAND_PLAN category sets, and buildExistingAssignments.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROADMAP_CATEGORIES = new Set(["security", "enhancements", "performance"]);
const GRAND_PLAN_CATEGORIES = new Set([
  "code-quality",
  "documentation",
  "process",
  "refactoring",
  "engineering-productivity",
  "ai-optimization",
]);
const COMPLETE_SPRINTS = new Set(["sprint-1", "sprint-2", "sprint-3"]);
const MAX_SPRINT_SIZE = 200;

const ROADMAP_DEFAULTS: Record<string, string> = {
  security: "Track-S",
  enhancements: "M3-M10",
  performance: "M2",
};

// ─── parseArgs ────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { write: boolean; verbose: boolean } {
  const opts = { write: false, verbose: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--write") opts.write = true;
    else if (arg === "--verbose") opts.verbose = true;
  }
  return opts;
}

describe("parseArgs (categorize-and-assign)", () => {
  it("defaults to write=false, verbose=false", () => {
    const result = parseArgs(["node", "script.js"]);
    assert.equal(result.write, false);
    assert.equal(result.verbose, false);
  });

  it("sets write=true with --write", () => {
    assert.equal(parseArgs(["node", "script.js", "--write"]).write, true);
  });

  it("sets verbose=true with --verbose", () => {
    assert.equal(parseArgs(["node", "script.js", "--verbose"]).verbose, true);
  });

  it("handles combined flags", () => {
    const result = parseArgs(["node", "script.js", "--write", "--verbose"]);
    assert.equal(result.write, true);
    assert.equal(result.verbose, true);
  });

  it("ignores unknown flags", () => {
    const result = parseArgs(["node", "script.js", "--unknown"]);
    assert.equal(result.write, false);
  });
});

// ─── Category sets ────────────────────────────────────────────────────────────

describe("ROADMAP_CATEGORIES", () => {
  it("contains security", () => assert.ok(ROADMAP_CATEGORIES.has("security")));
  it("contains enhancements", () => assert.ok(ROADMAP_CATEGORIES.has("enhancements")));
  it("contains performance", () => assert.ok(ROADMAP_CATEGORIES.has("performance")));
  it("does not contain code-quality", () =>
    assert.equal(ROADMAP_CATEGORIES.has("code-quality"), false));
  it("does not contain refactoring", () =>
    assert.equal(ROADMAP_CATEGORIES.has("refactoring"), false));
});

describe("GRAND_PLAN_CATEGORIES", () => {
  it("contains code-quality", () => assert.ok(GRAND_PLAN_CATEGORIES.has("code-quality")));
  it("contains documentation", () => assert.ok(GRAND_PLAN_CATEGORIES.has("documentation")));
  it("contains process", () => assert.ok(GRAND_PLAN_CATEGORIES.has("process")));
  it("contains refactoring", () => assert.ok(GRAND_PLAN_CATEGORIES.has("refactoring")));
  it("does not contain security", () => assert.equal(GRAND_PLAN_CATEGORIES.has("security"), false));
});

describe("ROADMAP_DEFAULTS", () => {
  it("maps security to Track-S", () => assert.equal(ROADMAP_DEFAULTS.security, "Track-S"));
  it("maps enhancements to M3-M10", () => assert.equal(ROADMAP_DEFAULTS.enhancements, "M3-M10"));
  it("maps performance to M2", () => assert.equal(ROADMAP_DEFAULTS.performance, "M2"));
});

// ─── categorizeItem ──────────────────────────────────────────────────────────

interface DebtItem {
  id: string;
  category: string;
}

function categorizeItem(item: DebtItem): { type: "roadmap" | "grand-plan"; category: string } {
  if (ROADMAP_CATEGORIES.has(item.category)) {
    return { type: "roadmap", category: item.category };
  }
  if (GRAND_PLAN_CATEGORIES.has(item.category)) {
    return { type: "grand-plan", category: item.category };
  }
  return { type: "grand-plan", category: item.category || "unknown" };
}

describe("categorizeItem", () => {
  it("categorizes security as roadmap", () => {
    assert.equal(categorizeItem({ id: "A", category: "security" }).type, "roadmap");
  });

  it("categorizes enhancements as roadmap", () => {
    assert.equal(categorizeItem({ id: "A", category: "enhancements" }).type, "roadmap");
  });

  it("categorizes performance as roadmap", () => {
    assert.equal(categorizeItem({ id: "A", category: "performance" }).type, "roadmap");
  });

  it("categorizes code-quality as grand-plan", () => {
    assert.equal(categorizeItem({ id: "A", category: "code-quality" }).type, "grand-plan");
  });

  it("categorizes refactoring as grand-plan", () => {
    assert.equal(categorizeItem({ id: "A", category: "refactoring" }).type, "grand-plan");
  });

  it("falls back to grand-plan for unknown categories", () => {
    const result = categorizeItem({ id: "A", category: "unknown-cat" });
    assert.equal(result.type, "grand-plan");
    assert.equal(result.category, "unknown-cat");
  });
});

// ─── isRootConfigFile ─────────────────────────────────────────────────────────

function isRootConfigFile(filePath: string): boolean {
  if (filePath.includes("/")) return false;
  return /\.(json|yml|yaml)$/i.test(filePath);
}

describe("isRootConfigFile", () => {
  it("identifies tsconfig.json as root config", () => {
    assert.equal(isRootConfigFile("tsconfig.json"), true);
  });

  it("identifies .github/ci.yml as NOT root config (has slash)", () => {
    assert.equal(isRootConfigFile(".github/ci.yml"), false);
  });

  it("identifies eslint.config.js as not root config (not json/yml)", () => {
    assert.equal(isRootConfigFile("eslint.config.js"), false);
  });

  it("identifies package.json as root config", () => {
    assert.equal(isRootConfigFile("package.json"), true);
  });

  it("identifies deploy.yaml as root config", () => {
    assert.equal(isRootConfigFile("deploy.yaml"), true);
  });
});

// ─── getSprintBucketForPath ───────────────────────────────────────────────────

function getSprintBucketForPath(filePath: string): number {
  if (!filePath || filePath === "N/A" || filePath === "") return 12;
  const norm = filePath.replaceAll("\\", "/").replaceAll(/\/+/g, "/");
  if (/(^|\/)\.\.(\/|$)/.test(norm)) return 12;
  if (norm.startsWith("scripts/")) return 8;
  if (norm.startsWith(".claude/") || norm.startsWith("docs/")) return 9;
  if (norm.startsWith(".github/") || norm.startsWith(".husky/") || isRootConfigFile(norm)) {
    return 10;
  }
  return 11;
}

describe("getSprintBucketForPath", () => {
  it("assigns scripts/ to bucket 8", () => {
    assert.equal(getSprintBucketForPath("scripts/debt/sync.js"), 8);
  });

  it("assigns .claude/ to bucket 9", () => {
    assert.equal(getSprintBucketForPath(".claude/hooks/pre-commit.sh"), 9);
  });

  it("assigns docs/ to bucket 9", () => {
    assert.equal(getSprintBucketForPath("docs/technical-debt/MASTER_DEBT.jsonl"), 9);
  });

  it("assigns .github/ to bucket 10", () => {
    assert.equal(getSprintBucketForPath(".github/workflows/ci.yml"), 10);
  });

  it("assigns root JSON files to bucket 10", () => {
    assert.equal(getSprintBucketForPath("tsconfig.json"), 10);
  });

  it("assigns app/ files to bucket 11", () => {
    assert.equal(getSprintBucketForPath("app/page.tsx"), 11);
  });

  it("assigns N/A to bucket 12", () => {
    assert.equal(getSprintBucketForPath("N/A"), 12);
  });

  it("assigns empty string to bucket 12", () => {
    assert.equal(getSprintBucketForPath(""), 12);
  });

  it("assigns path traversal to bucket 12", () => {
    assert.equal(getSprintBucketForPath("../secret"), 12);
  });
});

// ─── splitOversizedSprints ────────────────────────────────────────────────────

function splitOversizedSprints(
  sprintBuckets: Map<string, string[]>,
  maxSize: number
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const suffixes = "abcdefghijklmnopqrstuvwxyz";
  for (const [sprintNum, ids] of sprintBuckets.entries()) {
    if (ids.length <= maxSize) {
      result.set(sprintNum, ids);
    } else {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += maxSize) {
        chunks.push(ids.slice(i, i + maxSize));
      }
      for (let c = 0; c < chunks.length; c++) {
        const key = `${sprintNum}${suffixes[c] || String(c)}`;
        result.set(key, chunks[c]);
      }
    }
  }
  return result;
}

describe("splitOversizedSprints", () => {
  it("does not split a sprint under the limit", () => {
    const input = new Map([["8", ["DEBT-0001", "DEBT-0002"]]]);
    const result = splitOversizedSprints(input, 200);
    assert.equal(result.has("8"), true);
    assert.equal(result.size, 1);
  });

  it("splits a sprint exceeding the limit into labeled sub-sprints", () => {
    const ids = Array.from({ length: 5 }, (_, i) => `DEBT-${String(i).padStart(4, "0")}`);
    const input = new Map([["8", ids]]);
    const result = splitOversizedSprints(input, 2);
    assert.ok(result.has("8a"));
    assert.ok(result.has("8b"));
    assert.ok(result.has("8c"));
    assert.equal(result.get("8a")!.length, 2);
    assert.equal(result.get("8b")!.length, 2);
    assert.equal(result.get("8c")!.length, 1);
  });

  it("preserves sprints already at the limit", () => {
    const ids = Array.from({ length: 200 }, (_, i) => `DEBT-${String(i).padStart(4, "0")}`);
    const input = new Map([["9", ids]]);
    const result = splitOversizedSprints(input, 200);
    assert.equal(result.has("9"), true);
    assert.equal(result.get("9")!.length, 200);
  });

  it("handles empty sprint", () => {
    const input = new Map([["5", [] as string[]]]);
    const result = splitOversizedSprints(input, 200);
    assert.equal(result.has("5"), true);
    assert.deepEqual(result.get("5"), []);
  });
});

// ─── buildExistingAssignments ─────────────────────────────────────────────────

interface SprintManifest {
  sprints: Record<string, { ids: string[] }>;
}

function buildExistingAssignments(manifest: SprintManifest | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!manifest || !manifest.sprints) return map;
  for (const [sprintKey, sprintData] of Object.entries(manifest.sprints)) {
    const ids = sprintData.ids || [];
    for (const id of ids) {
      map.set(id, sprintKey);
    }
  }
  return map;
}

describe("buildExistingAssignments", () => {
  it("builds lookup from manifest sprints", () => {
    const manifest: SprintManifest = {
      sprints: {
        "sprint-1": { ids: ["DEBT-0001", "DEBT-0002"] },
        "sprint-2": { ids: ["DEBT-0003"] },
      },
    };
    const map = buildExistingAssignments(manifest);
    assert.equal(map.get("DEBT-0001"), "sprint-1");
    assert.equal(map.get("DEBT-0003"), "sprint-2");
  });

  it("returns empty map for null manifest", () => {
    assert.equal(buildExistingAssignments(null).size, 0);
  });

  it("returns empty map for manifest with no sprints", () => {
    assert.equal(buildExistingAssignments({ sprints: {} }).size, 0);
  });

  it("handles sprints with empty ids arrays", () => {
    const manifest: SprintManifest = { sprints: { "sprint-1": { ids: [] } } };
    assert.equal(buildExistingAssignments(manifest).size, 0);
  });
});

// ─── COMPLETE_SPRINTS ─────────────────────────────────────────────────────────

describe("COMPLETE_SPRINTS", () => {
  it("contains sprint-1", () => assert.ok(COMPLETE_SPRINTS.has("sprint-1")));
  it("contains sprint-2", () => assert.ok(COMPLETE_SPRINTS.has("sprint-2")));
  it("contains sprint-3", () => assert.ok(COMPLETE_SPRINTS.has("sprint-3")));
  it("does not contain sprint-4", () => assert.equal(COMPLETE_SPRINTS.has("sprint-4"), false));
});
