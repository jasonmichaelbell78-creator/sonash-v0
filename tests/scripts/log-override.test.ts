import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/log-override.js

function parseOverrideArgs(argv: string[]): {
  check: string | null;
  reason: string | null;
  list: boolean;
  clear: boolean;
  analytics: boolean;
  days: number;
  json: boolean;
} {
  const args = {
    check: null as string | null,
    reason: null as string | null,
    list: false,
    clear: false,
    analytics: false,
    days: 30,
    json: false,
  };

  for (const arg of argv) {
    if (arg === "--list") args.list = true;
    else if (arg === "--clear") args.clear = true;
    else if (arg === "--analytics") args.analytics = true;
    else if (arg === "--json") args.json = true;
    else if (arg.startsWith("--days=")) {
      const val = Number.parseInt(arg.split("=").slice(1).join("="), 10);
      if (!Number.isNaN(val) && val > 0) args.days = val;
    } else if (arg.startsWith("--check=")) {
      args.check = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--reason=")) {
      args.reason = arg.split("=").slice(1).join("=");
    }
  }
  return args;
}

function buildOverrideEntry(check: string, reason: string, timestamp: string): object {
  return { check, reason, timestamp, type: "override" };
}

interface OverrideEntry {
  timestamp: string;
  check: string;
  reason: string;
}

function filterByDays(entries: OverrideEntry[], days: number, now: number): OverrideEntry[] {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const ts = new Date(entry.timestamp).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function groupByCheck(entries: OverrideEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.check, (counts.get(entry.check) ?? 0) + 1);
  }
  return counts;
}

function shouldRotate(currentSize: number): boolean {
  const MAX_LOG_SIZE = 50 * 1024; // 50KB
  return currentSize > MAX_LOG_SIZE;
}

describe("log-override: parseArgs", () => {
  it("parses --list flag", () => {
    assert.strictEqual(parseOverrideArgs(["--list"]).list, true);
  });

  it("parses --clear flag", () => {
    assert.strictEqual(parseOverrideArgs(["--clear"]).clear, true);
  });

  it("parses --analytics flag", () => {
    assert.strictEqual(parseOverrideArgs(["--analytics"]).analytics, true);
  });

  it("parses --json flag", () => {
    assert.strictEqual(parseOverrideArgs(["--json"]).json, true);
  });

  it("parses --check= value", () => {
    const result = parseOverrideArgs(["--check=triggers"]);
    assert.strictEqual(result.check, "triggers");
  });

  it("parses --reason= value", () => {
    const result = parseOverrideArgs(["--reason=Already ran security-auditor"]);
    assert.strictEqual(result.reason, "Already ran security-auditor");
  });

  it("parses --days= value", () => {
    const result = parseOverrideArgs(["--days=7"]);
    assert.strictEqual(result.days, 7);
  });

  it("defaults to 30 days", () => {
    assert.strictEqual(parseOverrideArgs([]).days, 30);
  });

  it("handles reason with = in value", () => {
    const result = parseOverrideArgs(["--reason=key=value style reason"]);
    assert.strictEqual(result.reason, "key=value style reason");
  });

  it("ignores invalid days value", () => {
    const result = parseOverrideArgs(["--days=0"]);
    assert.strictEqual(result.days, 30);
  });
});

describe("log-override: override log entry building", () => {
  it("builds correct override entry structure", () => {
    const entry = buildOverrideEntry(
      "triggers",
      "False positive in migration",
      "2026-01-01T00:00:00Z"
    );
    assert.deepStrictEqual(entry, {
      check: "triggers",
      reason: "False positive in migration",
      timestamp: "2026-01-01T00:00:00Z",
      type: "override",
    });
  });
});

describe("log-override: analytics filter by date", () => {
  it("includes recent entries", () => {
    const now = Date.now();
    const entries: OverrideEntry[] = [
      { timestamp: new Date(now - 1000).toISOString(), check: "triggers", reason: "test" },
    ];
    assert.strictEqual(filterByDays(entries, 30, now).length, 1);
  });

  it("excludes old entries", () => {
    const now = Date.now();
    const oldDate = new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString();
    const entries: OverrideEntry[] = [
      { timestamp: oldDate, check: "triggers", reason: "old reason" },
    ];
    assert.strictEqual(filterByDays(entries, 30, now).length, 0);
  });

  it("handles invalid timestamps", () => {
    const now = Date.now();
    const entries: OverrideEntry[] = [
      { timestamp: "not-a-date", check: "triggers", reason: "test" },
    ];
    assert.strictEqual(filterByDays(entries, 30, now).length, 0);
  });
});

describe("log-override: analytics grouping by check type", () => {
  it("groups overrides by check type", () => {
    const entries: OverrideEntry[] = [
      { check: "triggers", reason: "r1", timestamp: "2026-01-01" },
      { check: "patterns", reason: "r2", timestamp: "2026-01-01" },
      { check: "triggers", reason: "r3", timestamp: "2026-01-01" },
    ];
    const groups = groupByCheck(entries);
    assert.strictEqual(groups.get("triggers"), 2);
    assert.strictEqual(groups.get("patterns"), 1);
  });

  it("returns empty map for empty entries", () => {
    assert.strictEqual(groupByCheck([]).size, 0);
  });
});

describe("log-override: max log size rotation threshold", () => {
  it("triggers rotation when log exceeds 50KB", () => {
    assert.strictEqual(shouldRotate(51 * 1024), true);
  });

  it("does not trigger rotation under 50KB", () => {
    assert.strictEqual(shouldRotate(49 * 1024), false);
  });

  it("does not trigger at exactly 50KB", () => {
    assert.strictEqual(shouldRotate(50 * 1024), false);
  });
});
