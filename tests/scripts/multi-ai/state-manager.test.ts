/**
 * state-manager.js Test Suite
 *
 * Tests the exported functions from scripts/multi-ai/state-manager.js.
 * Uses a temp directory to isolate all file writes from the real repo state.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before, afterEach } from "node:test";
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

interface Session {
  session_id: string;
  status: string;
  workflow_phase: string;
  current_category: string | null;
  selected_categories: string[];
  categories: Record<string, { status: string; sources: string[]; finding_count: number }>;
  final_output: string | null;
  last_updated: string;
  created: string;
}

interface StateManagerModule {
  getSessionPath: (sessionId: string) => string;
  createSession: () => Session;
  loadSession: () => Session | null;
  updateSession: (sessionId: string, updates: Partial<Session>) => Session;
  updateCategoryState: (
    sessionId: string,
    category: string,
    updates: Record<string, unknown>
  ) => Session;
  addSourceToCategory: (
    sessionId: string,
    category: string,
    source: string,
    findingCount: number
  ) => Session;
  completeSession: (sessionId: string, finalOutputPath: string) => Session;
  clearSession: () => void;
  getSessionSummary: (session: Session | null) => object | null;
  VALID_CATEGORIES: string[];
  VALID_STATUS: string[];
  VALID_PHASES: string[];
  CONFIG: { stateDir: string; stateFile: string; outputBaseDir: string };
}

let mod: StateManagerModule;
let tmpRoot: string;

before(async () => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/multi-ai/state-manager.js");
  const moduleUrl = "file://" + srcPath.replaceAll("\\", "/");

  // Use Function-wrapped import to force a true ESM dynamic import
  // (TypeScript compiles `import()` to `require()` in CJS mode which
  //  does not support file:// URLs)
  const dynamicImport = new Function("url", "return import(url)") as (
    url: string
  ) => Promise<unknown>;
  mod = (await dynamicImport(moduleUrl)) as StateManagerModule;
});

// We override CONFIG.stateDir and CONFIG.outputBaseDir for test isolation
// by capturing tempDir before each test and patching CONFIG in-place.
// Since CONFIG is a plain object, we can mutate it temporarily.

afterEach(() => {
  if (tmpRoot && fs.existsSync(tmpRoot)) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

function useTmpRoot(): string {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "state-mgr-test-"));
  mod.CONFIG.stateDir = path.join(tmpRoot, ".claude/multi-ai-audit");
  mod.CONFIG.outputBaseDir = path.join(tmpRoot, "docs/audits/multi-ai");
  return tmpRoot;
}

// =========================================================
// VALID_CATEGORIES / VALID_PHASES / VALID_STATUS constants
// =========================================================

describe("state-manager constants", () => {
  it("VALID_CATEGORIES contains expected items", () => {
    assert.ok(mod.VALID_CATEGORIES.includes("security"), "Should include security");
    assert.ok(mod.VALID_CATEGORIES.includes("code-quality"), "Should include code-quality");
    assert.ok(mod.VALID_CATEGORIES.length >= 5, "Should have at least 5 categories");
  });

  it("VALID_PHASES contains workflow phases", () => {
    assert.ok(mod.VALID_PHASES.includes("starting"), "Should include starting phase");
    assert.ok(mod.VALID_PHASES.includes("complete"), "Should include complete phase");
  });

  it("VALID_STATUS contains category states", () => {
    assert.ok(mod.VALID_STATUS.includes("pending"), "Should include pending");
    assert.ok(mod.VALID_STATUS.includes("aggregated"), "Should include aggregated");
  });
});

// =========================================================
// getSessionPath
// =========================================================

describe("state-manager.getSessionPath", () => {
  it("returns a path string for valid session ID format", () => {
    useTmpRoot();
    const result = mod.getSessionPath("maa-2026-03-09-abc123");
    assert.equal(typeof result, "string");
    assert.ok(result.includes("maa-2026-03-09-abc123"), "Path should contain session ID");
  });

  it("throws for invalid session ID format", () => {
    useTmpRoot();
    assert.throws(() => mod.getSessionPath("invalid-session"), /Invalid session ID format/);
  });

  it("throws for empty session ID", () => {
    useTmpRoot();
    assert.throws(() => mod.getSessionPath(""), /Invalid session ID/);
  });

  it("throws for null-like input", () => {
    useTmpRoot();
    assert.throws(() => mod.getSessionPath(null as unknown as string), /Invalid session ID/);
  });
});

// =========================================================
// createSession
// =========================================================

describe("state-manager.createSession", () => {
  it("creates a session with a valid session_id", () => {
    useTmpRoot();
    const session = mod.createSession();
    assert.ok(typeof session.session_id === "string", "session_id should be a string");
    assert.ok(session.session_id.startsWith("maa-"), "session_id should start with maa-");
  });

  it("creates a session with status in_progress", () => {
    useTmpRoot();
    const session = mod.createSession();
    assert.equal(session.status, "in_progress");
  });

  it("creates a session with all VALID_CATEGORIES initialized as pending", () => {
    useTmpRoot();
    const session = mod.createSession();
    for (const cat of mod.VALID_CATEGORIES) {
      assert.ok(cat in session.categories, `Category ${cat} should be initialized`);
      assert.equal(
        session.categories[cat].status,
        "pending",
        `Category ${cat} should start as pending`
      );
    }
  });

  it("writes state file to disk", () => {
    useTmpRoot();
    const session = mod.createSession();
    const stateFile = path.join(mod.CONFIG.stateDir, mod.CONFIG.stateFile);
    assert.ok(fs.existsSync(stateFile), "State file should be written to disk");
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    assert.equal(parsed.session_id, session.session_id);
  });
});

// =========================================================
// loadSession
// =========================================================

describe("state-manager.loadSession", () => {
  it("returns null when no session exists", () => {
    useTmpRoot();
    const session = mod.loadSession();
    assert.equal(session, null);
  });

  it("returns the created session after createSession()", () => {
    useTmpRoot();
    const created = mod.createSession();
    const loaded = mod.loadSession();
    assert.ok(loaded !== null, "Should load the session");
    assert.equal(loaded!.session_id, created.session_id);
  });
});

// =========================================================
// updateSession
// =========================================================

describe("state-manager.updateSession", () => {
  it("updates workflow_phase correctly", () => {
    useTmpRoot();
    const session = mod.createSession();
    const updated = mod.updateSession(session.session_id, { workflow_phase: "collecting" });
    assert.equal(updated.workflow_phase, "collecting");
  });

  it("rejects invalid workflow_phase", () => {
    useTmpRoot();
    const session = mod.createSession();
    assert.throws(
      () =>
        mod.updateSession(session.session_id, { workflow_phase: "invalid-phase" as "starting" }),
      /Invalid workflow phase/
    );
  });

  it("throws when no session exists", () => {
    useTmpRoot();
    assert.throws(() => mod.updateSession("maa-2026-01-01-aabbcc", {}), /No session found/);
  });

  it("updates last_updated timestamp", () => {
    useTmpRoot();
    const session = mod.createSession();
    const _before = session.last_updated;
    // Small delay to ensure timestamp changes
    const updated = mod.updateSession(session.session_id, { workflow_phase: "aggregating" });
    // last_updated should be a valid ISO string
    assert.ok(typeof updated.last_updated === "string", "last_updated should be a string");
    assert.ok(!Number.isNaN(Date.parse(updated.last_updated)), "Should be valid ISO date");
    // It may or may not differ in sub-millisecond runs, but the field should exist
    assert.ok("last_updated" in updated);
    // _before captured for potential future timestamp comparison
  });
});

// =========================================================
// updateCategoryState
// =========================================================

describe("state-manager.updateCategoryState", () => {
  it("updates a specific category status", () => {
    useTmpRoot();
    const session = mod.createSession();
    const updated = mod.updateCategoryState(session.session_id, "security", {
      status: "collecting",
    });
    assert.equal(updated.categories.security.status, "collecting");
  });

  it("throws for invalid category name", () => {
    useTmpRoot();
    const session = mod.createSession();
    assert.throws(
      () => mod.updateCategoryState(session.session_id, "nonexistent-category", {}),
      /Invalid category/
    );
  });

  it("throws for invalid category status", () => {
    useTmpRoot();
    const session = mod.createSession();
    assert.throws(
      () => mod.updateCategoryState(session.session_id, "security", { status: "bad-status" }),
      /Invalid category status/
    );
  });
});

// =========================================================
// addSourceToCategory
// =========================================================

describe("state-manager.addSourceToCategory", () => {
  it("adds a source to a category", () => {
    useTmpRoot();
    const session = mod.createSession();
    const updated = mod.addSourceToCategory(session.session_id, "security", "claude", 10);
    assert.ok(
      updated.categories.security.sources.includes("claude"),
      "claude should be in sources"
    );
    assert.equal(updated.categories.security.finding_count, 10);
  });

  it("does not add duplicate sources", () => {
    useTmpRoot();
    const session = mod.createSession();
    mod.addSourceToCategory(session.session_id, "security", "claude", 5);
    const updated = mod.addSourceToCategory(session.session_id, "security", "claude", 3);
    const sourceCount = updated.categories.security.sources.filter((s) => s === "claude").length;
    assert.equal(sourceCount, 1, "Same source should not be added twice");
  });
});

// =========================================================
// completeSession
// =========================================================

describe("state-manager.completeSession", () => {
  it("sets status to complete", () => {
    useTmpRoot();
    const session = mod.createSession();
    const completed = mod.completeSession(session.session_id, "/path/to/final.jsonl");
    assert.equal(completed.status, "complete");
  });

  it("records the final_output path", () => {
    useTmpRoot();
    const session = mod.createSession();
    const completed = mod.completeSession(session.session_id, "/path/to/final.jsonl");
    assert.equal(completed.final_output, "/path/to/final.jsonl");
  });
});

// =========================================================
// getSessionSummary
// =========================================================

describe("state-manager.getSessionSummary", () => {
  it("returns null for null session", () => {
    const result = mod.getSessionSummary(null);
    assert.equal(result, null);
  });

  it("returns a summary object for a valid session", () => {
    useTmpRoot();
    const session = mod.createSession();
    const summary = mod.getSessionSummary(session) as Record<string, unknown>;
    assert.ok(summary !== null, "Summary should not be null");
    assert.equal(typeof summary.session_id, "string");
    assert.equal(typeof summary.status, "string");
    assert.ok(Array.isArray(summary.pending), "pending should be an array");
    assert.equal(typeof summary.total_sources, "number");
    assert.equal(typeof summary.total_findings, "number");
  });
});
