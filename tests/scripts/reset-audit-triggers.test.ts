import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/reset-audit-triggers.js

function createDefaultTriggerState(): object {
  return {
    lastResetDate: new Date().toISOString(),
    triggers: {
      security_audit: { lastRun: null, nextDue: null, count: 0 },
      consolidation: { lastRun: null, nextDue: null, count: 0 },
      skill_validation: { lastRun: null, nextDue: null, count: 0 },
    },
  };
}

function resetTrigger(
  state: Record<string, unknown>,
  triggerName: string
): Record<string, unknown> {
  const triggers = state["triggers"] as Record<string, Record<string, unknown>> | undefined;
  if (!triggers || !(triggerName in triggers)) return state;
  triggers[triggerName] = {
    ...triggers[triggerName],
    lastRun: new Date().toISOString(),
    count: 0,
  };
  return { ...state, triggers };
}

function parseResetArgs(argv: string[]): {
  category: string | null;
  all: boolean;
  dryRun: boolean;
} {
  const all = argv.includes("--all");
  const dryRun = argv.includes("--dry-run");
  const catArg = argv.find((a) => a.startsWith("--category="));
  const category = catArg ? catArg.split("=")[1] : null;
  return { category, all, dryRun };
}

describe("reset-audit-triggers: trigger state structure", () => {
  it("creates state with required trigger keys", () => {
    const state = createDefaultTriggerState() as Record<string, unknown>;
    const triggers = state["triggers"] as Record<string, unknown>;
    assert.ok("security_audit" in triggers);
    assert.ok("consolidation" in triggers);
    assert.ok("skill_validation" in triggers);
  });

  it("initializes counts to 0", () => {
    const state = createDefaultTriggerState() as Record<string, unknown>;
    const triggers = state["triggers"] as Record<string, Record<string, unknown>>;
    assert.strictEqual(triggers["security_audit"]["count"], 0);
  });

  it("includes lastResetDate", () => {
    const state = createDefaultTriggerState() as Record<string, unknown>;
    assert.ok(typeof state["lastResetDate"] === "string");
    assert.ok(!Number.isNaN(new Date(state["lastResetDate"] as string).getTime()));
  });
});

describe("reset-audit-triggers: category reset logic", () => {
  it("resets count to 0", () => {
    const state = {
      triggers: {
        security_audit: { lastRun: "2026-01-01", count: 42 },
      },
    };
    const updated = resetTrigger(state, "security_audit") as {
      triggers: { security_audit: { count: number } };
    };
    assert.strictEqual(updated.triggers.security_audit.count, 0);
  });

  it("does not modify unknown triggers", () => {
    const state = { triggers: {} };
    const result = resetTrigger(state, "unknown_trigger");
    assert.deepStrictEqual(result, state);
  });
});

describe("reset-audit-triggers: argument parsing", () => {
  it("parses --all flag", () => {
    assert.strictEqual(parseResetArgs(["--all"]).all, true);
  });

  it("parses --dry-run flag", () => {
    assert.strictEqual(parseResetArgs(["--dry-run"]).dryRun, true);
  });

  it("parses --category= value", () => {
    const result = parseResetArgs(["--category=security_audit"]);
    assert.strictEqual(result.category, "security_audit");
  });
});
