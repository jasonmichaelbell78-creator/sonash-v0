/**
 * gsd-context-monitor.js Minimal Tests
 *
 * gsd-context-monitor.js runs as a stdin hook process and cannot be imported
 * without side effects (it registers stdin handlers immediately).
 * We test the pure decision logic it contains: threshold evaluation,
 * severity escalation, debounce, and message building.
 *
 * Run: npm run test:build && node --test dist-tests/tests/hooks/gsd-context-monitor.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror constants from gsd-context-monitor.js
const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

// Mirror threshold evaluation
type ContextLevel = "none" | "warning" | "critical";

function evaluateLevel(remainingPct: number): ContextLevel {
  if (remainingPct <= CRITICAL_THRESHOLD) return "critical";
  if (remainingPct <= WARNING_THRESHOLD) return "warning";
  return "none";
}

// Mirror staleness check
function isStale(timestampSeconds: number, nowSeconds: number): boolean {
  return nowSeconds - timestampSeconds > STALE_SECONDS;
}

// Mirror severity escalation check (WARNING -> CRITICAL bypasses debounce)
function shouldBypassDebounce(currentLevel: ContextLevel, lastLevel: ContextLevel | null): boolean {
  return currentLevel === "critical" && lastLevel === "warning";
}

// Mirror debounce check
function shouldSupressWarning(
  firstWarn: boolean,
  callsSinceWarn: number,
  severityEscalated: boolean
): boolean {
  return !firstWarn && callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated;
}

// Mirror message building (GSD-active variant)
function buildMessage(
  isCritical: boolean,
  isGsdActive: boolean,
  usedPct: number,
  remaining: number
): string {
  if (isCritical) {
    return isGsdActive
      ? `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
          "Context is nearly exhausted. Do NOT start new complex work or write handoff files — " +
          "GSD state is already tracked in STATE.md. Inform the user so they can run " +
          "/gsd:pause-work at the next natural stopping point."
      : `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
          "Context is nearly exhausted. Inform the user that context is low and ask how they " +
          "want to proceed. Do NOT autonomously save state or write handoff files unless the user asks.";
  }
  return isGsdActive
    ? `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        "Context is getting limited. Avoid starting new complex work. If not between " +
        "defined plan steps, inform the user so they can prepare to pause."
    : `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        "Be aware that context is getting limited. Avoid unnecessary exploration or " +
        "starting new complex work.";
}

// =========================================================
// evaluateLevel
// =========================================================

describe("evaluateLevel", () => {
  it("returns 'none' for remaining > 35%", () => {
    assert.equal(evaluateLevel(100), "none");
    assert.equal(evaluateLevel(36), "none");
  });

  it("returns 'warning' for remaining in (25, 35] range", () => {
    assert.equal(evaluateLevel(35), "warning");
    assert.equal(evaluateLevel(30), "warning");
    assert.equal(evaluateLevel(26), "warning");
  });

  it("returns 'critical' for remaining <= 25%", () => {
    assert.equal(evaluateLevel(25), "critical");
    assert.equal(evaluateLevel(10), "critical");
    assert.equal(evaluateLevel(0), "critical");
  });
});

// =========================================================
// isStale
// =========================================================

describe("isStale", () => {
  it("returns false for metrics within 60 seconds", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.equal(isStale(now - 30, now), false);
    assert.equal(isStale(now, now), false);
  });

  it("returns true for metrics older than 60 seconds", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.equal(isStale(now - 61, now), true);
    assert.equal(isStale(now - 120, now), true);
  });

  it("returns false for exactly 60 seconds old (boundary)", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.equal(isStale(now - 60, now), false);
  });
});

// =========================================================
// shouldBypassDebounce (severity escalation)
// =========================================================

describe("shouldBypassDebounce", () => {
  it("returns true when escalating from warning to critical", () => {
    assert.equal(shouldBypassDebounce("critical", "warning"), true);
  });

  it("returns false for same level (critical -> critical)", () => {
    assert.equal(shouldBypassDebounce("critical", "critical"), false);
  });

  it("returns false when no prior level recorded", () => {
    assert.equal(shouldBypassDebounce("critical", null), false);
  });

  it("returns false for warning when last was null", () => {
    assert.equal(shouldBypassDebounce("warning", null), false);
  });
});

// =========================================================
// shouldSupressWarning (debounce)
// =========================================================

describe("shouldSupressWarning", () => {
  it("does not suppress on first warning", () => {
    assert.equal(shouldSupressWarning(true, 0, false), false);
  });

  it("suppresses when debounce counter < DEBOUNCE_CALLS", () => {
    assert.equal(shouldSupressWarning(false, 3, false), true);
  });

  it("does not suppress when debounce counter >= DEBOUNCE_CALLS", () => {
    assert.equal(shouldSupressWarning(false, DEBOUNCE_CALLS, false), false);
  });

  it("does not suppress when severity escalated (bypasses debounce)", () => {
    assert.equal(shouldSupressWarning(false, 1, true), false);
  });
});

// =========================================================
// buildMessage
// =========================================================

describe("buildMessage", () => {
  it("produces CRITICAL message with GSD info when critical + GSD active", () => {
    const msg = buildMessage(true, true, 80, 20);
    assert.ok(msg.includes("CONTEXT CRITICAL"), "should be critical");
    assert.ok(msg.includes("STATE.md"), "GSD path should mention STATE.md");
  });

  it("produces CRITICAL message without GSD info when critical + no GSD", () => {
    const msg = buildMessage(true, false, 80, 20);
    assert.ok(msg.includes("CONTEXT CRITICAL"));
    assert.ok(!msg.includes("STATE.md"), "non-GSD critical should not mention STATE.md");
  });

  it("produces WARNING message with GSD info when warning + GSD active", () => {
    const msg = buildMessage(false, true, 70, 30);
    assert.ok(msg.includes("CONTEXT WARNING"));
    assert.ok(msg.includes("pause"), "GSD warning should mention pausing");
  });

  it("includes usage and remaining percentages in message", () => {
    const msg = buildMessage(false, false, 72, 28);
    assert.ok(msg.includes("72%"), "should include used percentage");
    assert.ok(msg.includes("28%"), "should include remaining percentage");
  });
});
