import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/hook-analytics.js

interface HookEntry {
  timestamp: string;
  type: string;
}

function safeParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function filterBySince(entries: HookEntry[], since: string | null): HookEntry[] {
  if (!since) return entries;
  const cutoff = new Date(since).getTime();
  if (Number.isNaN(cutoff)) return entries;
  return entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

function parseHookArgs(argv: string[]): {
  since: string | null;
  json: boolean;
  check: string | null;
} {
  const args = { since: null as string | null, json: false, check: null as string | null };
  for (const arg of argv) {
    if (arg === "--json") args.json = true;
    else if (arg.startsWith("--since=")) args.since = arg.split("=").slice(1).join("=");
    else if (arg.startsWith("--check=")) args.check = arg.split("=").slice(1).join("=");
  }
  return args;
}

function isFileSafe(sizeBytes: number, maxSize: number): boolean {
  return sizeBytes <= maxSize;
}

describe("hook-analytics: safeParse", () => {
  it("parses valid JSON", () => {
    const result = safeParse('{"key":"value"}');
    assert.deepStrictEqual(result, { key: "value" });
  });

  it("returns null for invalid JSON", () => {
    assert.strictEqual(safeParse("not json"), null);
  });

  it("returns null for empty string", () => {
    assert.strictEqual(safeParse(""), null);
  });
});

describe("hook-analytics: filterBySince", () => {
  it("returns all entries when since is null", () => {
    const entries: HookEntry[] = [
      { timestamp: "2026-01-01T00:00:00Z", type: "override" },
      { timestamp: "2026-02-01T00:00:00Z", type: "override" },
    ];
    assert.strictEqual(filterBySince(entries, null).length, 2);
  });

  it("filters entries before cutoff date", () => {
    const entries: HookEntry[] = [
      { timestamp: "2026-01-01T00:00:00Z", type: "override" },
      { timestamp: "2026-03-01T00:00:00Z", type: "override" },
    ];
    const filtered = filterBySince(entries, "2026-02-01");
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].timestamp, "2026-03-01T00:00:00Z");
  });

  it("returns all entries when since is invalid date", () => {
    const entries: HookEntry[] = [{ timestamp: "2026-01-01T00:00:00Z", type: "override" }];
    assert.strictEqual(filterBySince(entries, "not-a-date").length, 1);
  });
});

describe("hook-analytics: parseArgs", () => {
  it("parses --json flag", () => {
    assert.strictEqual(parseHookArgs(["--json"]).json, true);
  });

  it("parses --since= value", () => {
    const result = parseHookArgs(["--since=2026-02-14"]);
    assert.strictEqual(result.since, "2026-02-14");
  });

  it("parses --check= value", () => {
    const result = parseHookArgs(["--check=cross-doc"]);
    assert.strictEqual(result.check, "cross-doc");
  });

  it("defaults all to null/false", () => {
    const result = parseHookArgs([]);
    assert.strictEqual(result.since, null);
    assert.strictEqual(result.json, false);
    assert.strictEqual(result.check, null);
  });
});

describe("hook-analytics: MAX_FILE_SIZE guard", () => {
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  it("accepts file under 2MB", () => {
    assert.strictEqual(isFileSafe(1024 * 1024, MAX_FILE_SIZE), true);
  });

  it("rejects file over 2MB", () => {
    assert.strictEqual(isFileSafe(3 * 1024 * 1024, MAX_FILE_SIZE), false);
  });

  it("accepts file exactly at 2MB limit", () => {
    assert.strictEqual(isFileSafe(MAX_FILE_SIZE, MAX_FILE_SIZE), true);
  });
});
