/**
 * Tests for write-invocation.ts — validates InvocationRecord writing to invocations.jsonl.
 *
 * Uses temp directories for file isolation. Node.js built-in test runner.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeInvocation } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-invocation.js")
) as {
  writeInvocation: (projectRoot: string, data: Record<string, unknown>) => Record<string, unknown>;
};

// ---- Test helpers -----------------------------------------------------------

let tmpDir: string;

function makeValidInvocationData(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "inv-test-001",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", tool: "write-invocation.ts" },
    skill: "pr-review",
    type: "skill",
    success: true,
    duration_ms: 1500,
    context: { pr: 100, trigger: "manual" },
    ...overrides,
  };
}

// ---- Tests ------------------------------------------------------------------

describe("writeInvocation", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "invocation-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  test("writes a valid invocation record to invocations.jsonl", () => {
    const data = makeValidInvocationData();
    const result = writeInvocation(tmpDir, data);

    assert.equal(result.id, "inv-test-001");
    assert.equal(result.skill, "pr-review");

    const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
    assert.ok(fs.existsSync(filePath), "invocations.jsonl should be created");

    const content = fs.readFileSync(filePath, "utf8").trim();
    const parsed = JSON.parse(content) as Record<string, unknown>;
    assert.equal(parsed.id, "inv-test-001");
    assert.equal(parsed.skill, "pr-review");
  });

  test("auto-ID uses timestamp-based format", () => {
    const data = makeValidInvocationData();
    delete data.id;

    const before = Date.now();
    const result = writeInvocation(tmpDir, data);
    const after = Date.now();

    assert.ok(
      typeof result.id === "string" && (result.id as string).startsWith("inv-"),
      "ID should start with inv-"
    );

    const timestamp = parseInt((result.id as string).replace("inv-", ""), 10);
    assert.ok(timestamp >= before && timestamp <= after, "timestamp should be within test window");
  });

  test("auto-date uses current date", () => {
    const data = makeValidInvocationData();
    delete data.date;

    const result = writeInvocation(tmpDir, data);
    const today = new Date().toISOString().slice(0, 10);

    assert.equal(result.date, today, "date should be today");
  });

  test("rejects invalid data (missing skill name)", () => {
    const data = makeValidInvocationData();
    delete data.skill;

    assert.throws(
      () => writeInvocation(tmpDir, data),
      (err: Error) => err.name === "ZodError"
    );
  });

  test("rejects invalid type value", () => {
    const data = makeValidInvocationData({ type: "invalid-type" });

    assert.throws(
      () => writeInvocation(tmpDir, data),
      (err: Error) => err.name === "ZodError"
    );
  });

  test("creates invocations.jsonl if not exists", () => {
    const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
    assert.ok(!fs.existsSync(filePath), "file should not exist initially");

    writeInvocation(tmpDir, makeValidInvocationData());

    assert.ok(fs.existsSync(filePath), "invocations.jsonl should be created");
  });

  test("multiple invocations append correctly", () => {
    writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-001", skill: "pr-review" }));
    writeInvocation(tmpDir, makeValidInvocationData({ id: "inv-002", skill: "pr-retro" }));
    writeInvocation(
      tmpDir,
      makeValidInvocationData({ id: "inv-003", skill: "code-reviewer", type: "agent" })
    );

    const filePath = path.join(tmpDir, "data/ecosystem-v2/invocations.jsonl");
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
    assert.equal(lines.length, 3, "should have 3 records");

    const first = JSON.parse(lines[0]) as Record<string, unknown>;
    const second = JSON.parse(lines[1]) as Record<string, unknown>;
    const third = JSON.parse(lines[2]) as Record<string, unknown>;
    assert.equal(first.skill, "pr-review");
    assert.equal(second.skill, "pr-retro");
    assert.equal(third.skill, "code-reviewer");
    assert.equal(third.type, "agent");
  });

  test("supports agent and team types", () => {
    const agentResult = writeInvocation(
      tmpDir,
      makeValidInvocationData({ id: "inv-a1", type: "agent", skill: "code-reviewer" })
    );
    assert.equal(agentResult.type, "agent");

    const teamResult = writeInvocation(
      tmpDir,
      makeValidInvocationData({ id: "inv-t1", type: "team", skill: "dev-team" })
    );
    assert.equal(teamResult.type, "team");
  });

  test("records error state correctly", () => {
    const data = makeValidInvocationData({
      id: "inv-err",
      success: false,
      error: "Timeout after 30s",
    });

    const result = writeInvocation(tmpDir, data);

    assert.equal(result.success, false);
    assert.equal(result.error, "Timeout after 30s");
  });
});
