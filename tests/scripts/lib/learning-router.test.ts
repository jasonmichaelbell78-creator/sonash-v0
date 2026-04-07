/**
 * learning-router.js dedup guard tests
 *
 * Verifies that route() skips entries with statuses that indicate
 * enforcement is already in the pipeline: "enforced", "scaffolded",
 * "refined", and "deferred".
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/learning-router.test.js
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

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/learning-router.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { route, generateId } = require(MODULE_PATH) as {
  route: (
    learning: Record<string, unknown>,
    options?: { routesPath?: string }
  ) => {
    action: string;
    reason?: string;
    existingEntry?: unknown;
    id: string;
    scaffold?: {
      generatedCode?: unknown;
      targetFile?: string;
      status?: string;
      [key: string]: unknown;
    };
  };
  generateId: (learning: Record<string, unknown>) => string;
};

describe("learning-router dedup guard", () => {
  let tmpDir: string;
  let testRoutesPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "learning-router-test-"));
    testRoutesPath = path.join(tmpDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("route() skips pattern already at 'enforced' status", () => {
    const learning = {
      type: "process",
      pattern: "test enforced",
      source: "test",
      severity: "medium",
    };
    const entry = {
      id: generateId(learning),
      status: "enforced",
    };
    fs.writeFileSync(testRoutesPath, JSON.stringify(entry) + "\n");

    const result = route(learning, { routesPath: testRoutesPath });
    assert.strictEqual(result.action, "skipped");
    assert.strictEqual(result.reason, "enforcement-in-pipeline");
  });

  it("route() skips pattern already at 'scaffolded' status", () => {
    const learning = {
      type: "process",
      pattern: "test scaffolded",
      source: "test",
      severity: "medium",
    };
    const entry = {
      id: generateId(learning),
      status: "scaffolded",
    };
    fs.writeFileSync(testRoutesPath, JSON.stringify(entry) + "\n");

    const result = route(learning, { routesPath: testRoutesPath });
    assert.strictEqual(result.action, "skipped");
    assert.strictEqual(result.reason, "enforcement-in-pipeline");
  });

  it("route() skips pattern already at 'refined' status", () => {
    const learning = {
      type: "process",
      pattern: "test refined",
      source: "test",
      severity: "medium",
    };
    const entry = {
      id: generateId(learning),
      status: "refined",
    };
    fs.writeFileSync(testRoutesPath, JSON.stringify(entry) + "\n");

    const result = route(learning, { routesPath: testRoutesPath });
    assert.strictEqual(result.action, "skipped");
    assert.strictEqual(result.reason, "enforcement-in-pipeline");
  });

  it("route() skips pattern already at 'deferred' status", () => {
    const learning = {
      type: "process",
      pattern: "test deferred",
      source: "test",
      severity: "medium",
    };
    const entry = {
      id: generateId(learning),
      status: "deferred",
    };
    fs.writeFileSync(testRoutesPath, JSON.stringify(entry) + "\n");

    const result = route(learning, { routesPath: testRoutesPath });
    assert.strictEqual(result.action, "skipped");
    assert.strictEqual(result.reason, "enforcement-in-pipeline");
  });

  it("route() does NOT skip pattern at 'failed' status (allows re-routing)", () => {
    const learning = {
      type: "process",
      pattern: "test failed",
      source: "test",
      severity: "medium",
    };
    const entry = {
      id: generateId(learning),
      status: "failed",
    };
    fs.writeFileSync(testRoutesPath, JSON.stringify(entry) + "\n");

    const result = route(learning, { routesPath: testRoutesPath });
    // "failed" should allow re-routing, so action should NOT be "skipped"
    assert.notStrictEqual(result.action, "skipped");
  });
});

describe("learning-router scaffold generatedCode field", () => {
  let tmpDir: string;
  let testRoutesPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "learning-router-test-"));
    testRoutesPath = path.join(tmpDir, "learning-routes.jsonl");
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // Tests verify the JSONL-persisted scaffold entry includes generatedCode,
  // which is what refine-scaffolds.js:154 reads (entry.scaffold?.generatedCode).

  it("persisted JSONL entry includes non-null scaffold.generatedCode for code-type learning", () => {
    const learning = {
      type: "code",
      pattern: "use sanitizeError not raw error.message",
      source: "test",
      severity: "high",
    };

    route(learning, { routesPath: testRoutesPath });

    let content: string;
    try {
      content = fs.readFileSync(testRoutesPath, "utf-8");
    } catch (err) {
      assert.fail(`Could not read routes file: ${String(err)}`);
    }

    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    assert.strictEqual(lines.length, 1, "should have written exactly one JSONL line");

    const persisted = JSON.parse(lines[0]) as {
      scaffold?: { generatedCode?: unknown };
    };
    assert.ok(persisted.scaffold, "persisted entry must have scaffold");
    assert.ok(
      persisted.scaffold.generatedCode !== undefined,
      "persisted scaffold.generatedCode must be present (not undefined)"
    );
    assert.notStrictEqual(
      persisted.scaffold.generatedCode,
      null,
      "persisted scaffold.generatedCode must not be null for code-type learning"
    );
    // For code-type, generatedCode is the verified-pattern entry object
    assert.strictEqual(
      typeof persisted.scaffold.generatedCode,
      "object",
      "code-type generatedCode should be the pattern entry object"
    );
  });

  it("persisted JSONL entry includes non-null scaffold.generatedCode for process-type learning", () => {
    const learning = {
      type: "process",
      pattern: "run patterns check before commit",
      source: "test",
      severity: "high",
    };

    route(learning, { routesPath: testRoutesPath });

    let content: string;
    try {
      content = fs.readFileSync(testRoutesPath, "utf-8");
    } catch (err) {
      assert.fail(`Could not read routes file: ${String(err)}`);
    }

    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    assert.strictEqual(lines.length, 1, "should have written exactly one JSONL line");

    const persisted = JSON.parse(lines[0]) as {
      scaffold?: { generatedCode?: unknown };
    };
    assert.ok(persisted.scaffold, "persisted entry must have scaffold");
    assert.notStrictEqual(
      persisted.scaffold.generatedCode,
      null,
      "persisted scaffold.generatedCode must not be null for process-type learning"
    );
    // For process-type, generatedCode is the hook script string
    assert.strictEqual(
      typeof persisted.scaffold.generatedCode,
      "string",
      "process-type generatedCode must be the hook script string"
    );
  });

  it("persisted JSONL entry includes non-null scaffold.generatedCode for behavioral-type learning", () => {
    const learning = {
      type: "behavioral",
      pattern: "ask on first confusion not fourth",
      source: "test",
      severity: "medium",
    };

    route(learning, { routesPath: testRoutesPath });

    let content: string;
    try {
      content = fs.readFileSync(testRoutesPath, "utf-8");
    } catch (err) {
      assert.fail(`Could not read routes file: ${String(err)}`);
    }

    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    assert.strictEqual(lines.length, 1, "should have written exactly one JSONL line");

    const persisted = JSON.parse(lines[0]) as {
      scaffold?: { generatedCode?: unknown };
    };
    assert.ok(persisted.scaffold, "persisted entry must have scaffold");
    assert.notStrictEqual(
      persisted.scaffold.generatedCode,
      null,
      "persisted scaffold.generatedCode must not be null for behavioral-type learning"
    );
    // For behavioral-type, generatedCode is the annotation string
    assert.strictEqual(
      typeof persisted.scaffold.generatedCode,
      "string",
      "behavioral-type generatedCode must be the annotation string"
    );
  });

  it("persisted JSONL entry includes scaffold.generatedCode (general case)", () => {
    const learning = {
      type: "code",
      pattern: "wrap file reads in try catch",
      source: "test",
      severity: "critical",
    };

    route(learning, { routesPath: testRoutesPath });

    let content: string;
    try {
      content = fs.readFileSync(testRoutesPath, "utf-8");
    } catch (err) {
      assert.fail(`Could not read routes file: ${String(err)}`);
    }

    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    assert.strictEqual(lines.length, 1, "should have written exactly one JSONL line");

    const persisted = JSON.parse(lines[0]) as {
      scaffold?: { generatedCode?: unknown };
    };
    assert.ok(persisted.scaffold, "persisted entry must have scaffold");
    assert.ok(
      persisted.scaffold.generatedCode !== undefined,
      "persisted scaffold.generatedCode must be present"
    );
    assert.notStrictEqual(
      persisted.scaffold.generatedCode,
      null,
      "persisted scaffold.generatedCode must not be null"
    );
  });
});
