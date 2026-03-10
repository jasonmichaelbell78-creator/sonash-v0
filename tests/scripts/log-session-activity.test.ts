import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/log-session-activity.js

describe("log-session-activity: session entry structure", () => {
  function buildSessionEntry(sessionId: string, action: string, details: string): object {
    return {
      sessionId,
      action,
      details,
      timestamp: new Date().toISOString(),
      type: "session_activity",
    };
  }

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
  function toJsonlLine(entry: object): string {
    return JSON.stringify(entry) + "\n";
  }

  it("produces valid JSON line with newline", () => {
    const line = toJsonlLine({ id: 1, value: "test" });
    assert.ok(line.endsWith("\n"));
    assert.doesNotThrow(() => JSON.parse(line.trim()));
  });

  it("handles nested objects", () => {
    const line = toJsonlLine({ metadata: { version: "1.0" } });
    const parsed = JSON.parse(line.trim()) as { metadata: { version: string } };
    assert.strictEqual(parsed.metadata.version, "1.0");
  });
});

describe("log-session-activity: path containment", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("passes safe relative path", () => {
    assert.strictEqual(isPathTraversal("logs/activity.jsonl"), false);
  });
});

describe("log-session-activity: activity type validation", () => {
  const VALID_ACTIONS = new Set(["begin", "end", "commit", "checkpoint", "error"]);

  function isValidAction(action: string): boolean {
    return VALID_ACTIONS.has(action);
  }

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
