import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/log-session-activity.js

function buildSessionEntry(sessionId: string, action: string, details: string): object {
  return {
    sessionId,
    action,
    details,
    timestamp: new Date().toISOString(),
    type: "session_activity",
  };
}

function toJsonlLine(entry: object): string {
  return JSON.stringify(entry) + "\n";
}

function isPathTraversal(rel: string): boolean {
  return /^\.\.(?:[\\/]|$)/.test(rel);
}

const VALID_ACTIONS = new Set(["begin", "end", "commit", "checkpoint", "error"]);

function isValidAction(action: string): boolean {
  return VALID_ACTIONS.has(action);
}

describe("log-session-activity: session entry structure", () => {
  it("builds valid session entry", () => {
    const entry = buildSessionEntry("213", "begin", "Session started") as Record<string, unknown>;
    assert.strictEqual(entry["sessionId"], "213");
    assert.strictEqual(entry["action"], "begin");
    assert.strictEqual(entry["type"], "session_activity");
    assert.ok(typeof entry["timestamp"] === "string");
  });

  it("timestamp is a valid ISO string", () => {
    const entry = buildSessionEntry("1", "end", "Session ended") as Record<string, unknown>;
    const ts = new Date(entry["timestamp"] as string);
    assert.ok(!Number.isNaN(ts.getTime()));
  });
});

describe("log-session-activity: JSONL line building", () => {
  it("produces valid JSON line with newline", () => {
    const output = toJsonlLine({ id: 1, value: "test" });
    assert.ok(output.endsWith("\n"));
    assert.doesNotThrow(() => JSON.parse(output.trim()));
  });

  it("handles nested objects", () => {
    const output = toJsonlLine({ metadata: { version: "1.0" } });
    const parsed = JSON.parse(output.trim()) as { metadata: { version: string } };
    assert.strictEqual(parsed.metadata.version, "1.0");
  });
});

describe("log-session-activity: path containment", () => {
  it("detects traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("passes safe relative path", () => {
    assert.strictEqual(isPathTraversal("logs/activity.jsonl"), false);
  });
});

describe("log-session-activity: activity type validation", () => {
  it("accepts valid action types", () => {
    assert.strictEqual(isValidAction("begin"), true);
    assert.strictEqual(isValidAction("end"), true);
    assert.strictEqual(isValidAction("commit"), true);
  });

  it("rejects unknown action types", () => {
    assert.strictEqual(isValidAction("unknown"), false);
    assert.strictEqual(isValidAction(""), false);
  });
});
