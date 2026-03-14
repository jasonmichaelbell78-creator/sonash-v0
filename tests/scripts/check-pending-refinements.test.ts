import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("checkPendingRefinements logic", () => {
  let tmpDir: string;
  let pendingPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "alerts-pending-test-"));
    pendingPath = path.join(tmpDir, "pending-refinements.jsonl");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("increments surfaced_count on each read", () => {
    const entry = { id: "test-1", surfaced_count: 0, pattern: "test" };
    fs.writeFileSync(pendingPath, JSON.stringify(entry) + "\n");

    let lines: string[];
    try {
      lines = fs.readFileSync(pendingPath, "utf-8").trim().split("\n");
    } catch (err) {
      throw new Error(`Failed to read pending file: ${err instanceof Error ? err.message : String(err)}`);
    }
    const parsed = lines.map((l) => JSON.parse(l));
    const updated = parsed.map((e: { surfaced_count?: number }) => ({
      ...e,
      surfaced_count: ((e.surfaced_count as number) || 0) + 1,
    }));

    assert.equal(updated[0].surfaced_count, 1);
  });

  test("escalates entries at surfaced_count >= 3", () => {
    const entry = { id: "test-1", surfaced_count: 2, pattern: "test" };
    fs.writeFileSync(pendingPath, JSON.stringify(entry) + "\n");

    let lines: string[];
    try {
      lines = fs.readFileSync(pendingPath, "utf-8").trim().split("\n");
    } catch (err) {
      throw new Error(`Failed to read pending file: ${err instanceof Error ? err.message : String(err)}`);
    }
    const parsed = lines.map((l) => JSON.parse(l));
    const escalated: unknown[] = [];
    const active: unknown[] = [];
    for (const e of parsed) {
      const count = ((e.surfaced_count as number) || 0) + 1;
      if (count >= 3) escalated.push({ ...e, surfaced_count: count });
      else active.push({ ...e, surfaced_count: count });
    }

    assert.equal(escalated.length, 1);
    assert.equal(active.length, 0);
  });

  test("does not escalate entries below threshold", () => {
    const entry = { id: "test-1", surfaced_count: 0, pattern: "test" };
    fs.writeFileSync(pendingPath, JSON.stringify(entry) + "\n");

    let lines: string[];
    try {
      lines = fs.readFileSync(pendingPath, "utf-8").trim().split("\n");
    } catch (err) {
      throw new Error(`Failed to read pending file: ${err instanceof Error ? err.message : String(err)}`);
    }
    const parsed = lines.map((l) => JSON.parse(l));
    const escalated: unknown[] = [];
    const active: unknown[] = [];
    for (const e of parsed) {
      const count = ((e.surfaced_count as number) || 0) + 1;
      if (count >= 3) escalated.push({ ...e, surfaced_count: count });
      else active.push({ ...e, surfaced_count: count });
    }

    assert.equal(escalated.length, 0);
    assert.equal(active.length, 1);
  });
});
