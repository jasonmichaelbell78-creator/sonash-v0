/**
 * refine-scaffolds.js Tests
 *
 * Verifies that run() correctly:
 * - Promotes high-confidence scaffolded entries to "enforced"
 * - Promotes low-confidence scaffolded entries to "refined" and writes to pending-refinements.jsonl
 * - Skips entries not in "scaffolded" status
 * - Handles empty learning-routes.jsonl
 * - Handles missing learning-routes.jsonl
 *
 * Run: npm run test:infra
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts/refine-scaffolds.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { run } = require(SCRIPT_PATH) as {
  run: (options?: {
    routesPath?: string;
    pendingPath?: string;
    dryRun?: boolean;
    json?: boolean;
  }) => {
    success: boolean;
    promoted: number;
    refined: number;
    skipped: number;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface LearningRouteEntry {
  id: string;
  timestamp: string;
  date: string;
  schema_version: number;
  learning: {
    type: string;
    pattern: string;
    source?: string;
    severity?: string;
  };
  route: string;
  scaffold?: {
    targetFile: string;
    status: string;
  };
  status: string;
}

function makeScaffoldedEntry(overrides: Partial<LearningRouteEntry> = {}): LearningRouteEntry {
  return {
    id: "test-id-001",
    timestamp: "2026-03-14T00:00:00.000Z",
    date: "2026-03-14",
    schema_version: 1,
    learning: {
      type: "code",
      pattern: "unbounded query with no rotation policy",
      source: "test",
      severity: "medium",
    },
    route: "verified-pattern",
    scaffold: {
      targetFile: "config/rotation-policy.json",
      status: "scaffolded",
    },
    status: "scaffolded",
    ...overrides,
  };
}

function writeJsonl(filePath: string, entries: unknown[]): void {
  fs.writeFileSync(filePath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf-8");
}

function readJsonl(filePath: string): unknown[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("refine-scaffolds: high-confidence entry", () => {
  let tmpDir: string;
  let routesPath: string;
  let pendingPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "refine-scaffolds-test-"));
    routesPath = path.join(tmpDir, "learning-routes.jsonl");
    pendingPath = path.join(tmpDir, "pending-refinements.jsonl");
    delete require.cache[require.resolve(SCRIPT_PATH)];
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it("promotes high-confidence scaffolded entry to 'enforced' status", () => {
    // A code entry with "unbounded" → high confidence (add-to-rotation)
    const entry = makeScaffoldedEntry({
      id: "high-conf-001",
      learning: {
        type: "code",
        pattern: "Storage bucket: unbounded, no rotation policy",
        source: "test",
        severity: "medium",
      },
    });
    writeJsonl(routesPath, [entry]);

    const result = run({ routesPath, pendingPath });

    assert.ok(result.success, "run() should succeed");
    assert.strictEqual(result.promoted, 1, "should promote 1 entry");
    assert.strictEqual(result.refined, 0, "should not refine any entry");

    const updatedEntries = readJsonl(routesPath) as LearningRouteEntry[];
    assert.strictEqual(updatedEntries.length, 1);
    assert.strictEqual(updatedEntries[0].status, "enforced");
    const enforced0 = updatedEntries[0] as unknown as Record<string, unknown>;
    // enforcement_test and metrics start null (verify-enforcement skips until populated)
    assert.strictEqual(
      enforced0.enforcement_test,
      null,
      "enforcement_test should be null initially"
    );
    assert.strictEqual(enforced0.metrics, null, "metrics should be null initially");
    assert.ok(
      enforced0.pending_enforcement_test,
      "should have pending_enforcement_test placeholder"
    );
  });

  it("pending_enforcement_test is a sanitized placeholder path string", () => {
    const entry = makeScaffoldedEntry({
      id: "high-conf-002",
      learning: {
        type: "code",
        pattern: "no rotation on data stream",
        source: "test",
        severity: "medium",
      },
    });
    writeJsonl(routesPath, [entry]);

    run({ routesPath, pendingPath });

    const updatedEntries = readJsonl(routesPath) as Array<Record<string, unknown>>;
    const enforced = updatedEntries[0] as unknown as Record<string, unknown>;
    assert.ok(typeof enforced.pending_enforcement_test === "string");
    assert.match(enforced.pending_enforcement_test as string, /tests\/enforcement\//);
    assert.match(enforced.pending_enforcement_test as string, /high-conf-002/);
  });

  it("enforcement_test and metrics are null for newly promoted entries", () => {
    const entry = makeScaffoldedEntry({
      id: "high-conf-003",
      learning: {
        type: "code",
        pattern: "unbounded query results",
        source: "test",
        severity: "medium",
      },
    });
    writeJsonl(routesPath, [entry]);

    run({ routesPath, pendingPath });

    const updatedEntries = readJsonl(routesPath) as Array<Record<string, unknown>>;
    assert.strictEqual(updatedEntries[0].enforcement_test, null);
    assert.strictEqual(updatedEntries[0].metrics, null);
  });
});

describe("refine-scaffolds: low-confidence entry", () => {
  let tmpDir: string;
  let routesPath: string;
  let pendingPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "refine-scaffolds-test-"));
    routesPath = path.join(tmpDir, "learning-routes.jsonl");
    pendingPath = path.join(tmpDir, "pending-refinements.jsonl");
    delete require.cache[require.resolve(SCRIPT_PATH)];
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it("promotes low-confidence scaffolded entry to 'refined' status", () => {
    // behavioral type → always low confidence
    const entry = makeScaffoldedEntry({
      id: "low-conf-001",
      learning: {
        type: "behavioral",
        pattern: "Stop and ask is a hard stop",
        source: "test",
        severity: "medium",
      },
      route: "claude-md-annotation",
    });
    writeJsonl(routesPath, [entry]);

    const result = run({ routesPath, pendingPath });

    assert.ok(result.success, "run() should succeed");
    assert.strictEqual(result.refined, 1, "should refine 1 entry");
    assert.strictEqual(result.promoted, 0, "should not promote any entry");

    const updatedEntries = readJsonl(routesPath) as LearningRouteEntry[];
    assert.strictEqual(updatedEntries[0].status, "refined");
  });

  it("appends low-confidence entry to pending-refinements.jsonl", () => {
    const entry = makeScaffoldedEntry({
      id: "low-conf-002",
      learning: {
        type: "behavioral",
        pattern: "One correction equals full stop",
        source: "test",
        severity: "medium",
      },
      route: "claude-md-annotation",
    });
    writeJsonl(routesPath, [entry]);

    run({ routesPath, pendingPath });

    const pendingEntries = readJsonl(pendingPath) as Array<Record<string, unknown>>;
    assert.strictEqual(pendingEntries.length, 1, "should write 1 pending entry");
    assert.strictEqual(pendingEntries[0].id, "low-conf-002");
    assert.strictEqual(pendingEntries[0].route_type, "claude-md-annotation");
    assert.strictEqual(pendingEntries[0].pattern, "One correction equals full stop");
    assert.ok(pendingEntries[0].confidence, "pending entry should have confidence field");
    assert.ok(pendingEntries[0].reason, "pending entry should have reason field");
    assert.strictEqual(pendingEntries[0].surfaced_count, 0);
    assert.ok(pendingEntries[0].created, "pending entry should have created timestamp");
  });

  it("appends to existing pending-refinements.jsonl (does not overwrite)", () => {
    const existing = {
      id: "existing-001",
      route_type: "hook-gate",
      pattern: "existing pattern",
      confidence: "low",
      reason: "test",
      surfaced_count: 0,
      created: "2026-03-01T00:00:00.000Z",
    };
    writeJsonl(pendingPath, [existing]);

    const entry = makeScaffoldedEntry({
      id: "low-conf-003",
      learning: {
        type: "behavioral",
        pattern: "New behavioral pattern",
        source: "test",
        severity: "medium",
      },
    });
    writeJsonl(routesPath, [entry]);

    run({ routesPath, pendingPath });

    const pendingEntries = readJsonl(pendingPath) as Array<Record<string, unknown>>;
    assert.strictEqual(pendingEntries.length, 2, "should have 2 entries (existing + new)");
    assert.strictEqual(pendingEntries[0].id, "existing-001");
    assert.strictEqual(pendingEntries[1].id, "low-conf-003");
  });
});

describe("refine-scaffolds: skip non-scaffolded entries", () => {
  let tmpDir: string;
  let routesPath: string;
  let pendingPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "refine-scaffolds-test-"));
    routesPath = path.join(tmpDir, "learning-routes.jsonl");
    pendingPath = path.join(tmpDir, "pending-refinements.jsonl");
    delete require.cache[require.resolve(SCRIPT_PATH)];
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it("skips entries with status 'enforced'", () => {
    const entry = makeScaffoldedEntry({ id: "skip-001", status: "enforced" });
    writeJsonl(routesPath, [entry]);

    const result = run({ routesPath, pendingPath });

    assert.strictEqual(result.skipped, 1, "should skip 1 enforced entry");
    assert.strictEqual(result.promoted, 0);
    assert.strictEqual(result.refined, 0);
  });

  it("skips entries with status 'refined'", () => {
    const entry = makeScaffoldedEntry({ id: "skip-002", status: "refined" });
    writeJsonl(routesPath, [entry]);

    const result = run({ routesPath, pendingPath });

    assert.strictEqual(result.skipped, 1, "should skip 1 refined entry");
    assert.strictEqual(result.promoted, 0);
    assert.strictEqual(result.refined, 0);
  });

  it("skips entries with status 'deferred'", () => {
    const entry = makeScaffoldedEntry({ id: "skip-003", status: "deferred" });
    writeJsonl(routesPath, [entry]);

    const result = run({ routesPath, pendingPath });

    assert.strictEqual(result.skipped, 1, "should skip 1 deferred entry");
  });

  it("processes only scaffolded entries in a mixed file", () => {
    const scaffolded = makeScaffoldedEntry({
      id: "mixed-scaffolded",
      learning: {
        type: "behavioral",
        pattern: "test behavioral pattern",
        source: "test",
        severity: "medium",
      },
    });
    const enforced = makeScaffoldedEntry({ id: "mixed-enforced", status: "enforced" });
    const refined = makeScaffoldedEntry({ id: "mixed-refined", status: "refined" });

    writeJsonl(routesPath, [scaffolded, enforced, refined]);

    const result = run({ routesPath, pendingPath });

    assert.strictEqual(result.refined, 1, "should refine 1 scaffolded entry");
    assert.strictEqual(result.skipped, 2, "should skip 2 non-scaffolded entries");

    const updatedEntries = readJsonl(routesPath) as LearningRouteEntry[];
    assert.strictEqual(updatedEntries.length, 3, "should preserve all 3 entries");

    const updatedScaffolded = updatedEntries.find((e) => e.id === "mixed-scaffolded");
    const updatedEnforced = updatedEntries.find((e) => e.id === "mixed-enforced");
    const updatedRefined = updatedEntries.find((e) => e.id === "mixed-refined");

    assert.strictEqual(updatedScaffolded?.status, "refined");
    assert.strictEqual(updatedEnforced?.status, "enforced");
    assert.strictEqual(updatedRefined?.status, "refined");
  });
});

describe("refine-scaffolds: edge cases", () => {
  let tmpDir: string;
  let routesPath: string;
  let pendingPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "refine-scaffolds-test-"));
    routesPath = path.join(tmpDir, "learning-routes.jsonl");
    pendingPath = path.join(tmpDir, "pending-refinements.jsonl");
    delete require.cache[require.resolve(SCRIPT_PATH)];
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it("handles empty learning-routes.jsonl gracefully", () => {
    fs.writeFileSync(routesPath, "", "utf-8");

    const result = run({ routesPath, pendingPath });

    assert.ok(result.success, "run() should succeed on empty file");
    assert.strictEqual(result.promoted, 0);
    assert.strictEqual(result.refined, 0);
    assert.strictEqual(result.skipped, 0);
  });

  it("handles missing learning-routes.jsonl gracefully", () => {
    // Do not create the file — routesPath points to non-existent file

    const result = run({ routesPath, pendingPath });

    assert.ok(result.success, "run() should succeed on missing file (treat as empty)");
    assert.strictEqual(result.promoted, 0);
    assert.strictEqual(result.refined, 0);
  });

  it("dry-run does not modify files", () => {
    const entry = makeScaffoldedEntry({
      id: "dry-run-001",
      learning: {
        type: "behavioral",
        pattern: "dry run behavioral test",
        source: "test",
        severity: "medium",
      },
    });
    writeJsonl(routesPath, [entry]);

    const originalContent = fs.readFileSync(routesPath, "utf-8");

    const result = run({ routesPath, pendingPath, dryRun: true });

    assert.ok(result.success, "dry-run should succeed");

    const afterContent = fs.readFileSync(routesPath, "utf-8");
    assert.strictEqual(
      afterContent,
      originalContent,
      "routes file should not be modified in dry-run"
    );
    assert.ok(!fs.existsSync(pendingPath), "pending file should not be created in dry-run");
  });
});
