/**
 * Tests for .claude/hooks/check-remote-session-context.js
 *
 * The hook compares local SESSION_CONTEXT.md session counter against
 * remote branches to detect if newer context exists elsewhere.
 *
 * We test the pure parsing functions extracted from the hook.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing

function getSessionCounter(content: string): number {
  const regex = /\*{0,2}Current Session Count(?:er)?\*{0,2}[\s:]*(\d+)/i;
  const match = regex.exec(content);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function getLastUpdated(content: string): string | null {
  const regex = /\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/;
  const match = regex.exec(content);
  return match ? match[1] : null;
}

function normalizeRemoteBranch(branch: string): string {
  return branch.startsWith("origin/") ? branch.slice("origin/".length) : branch;
}

// Path traversal check from the hook
function isOutsideBase(rel: string): boolean {
  /* eslint-disable @typescript-eslint/no-require-imports */
  return /^\.\.(?:[\\/]|$)/.test(rel) || (rel.length > 0 && require("node:path").isAbsolute(rel));
  /* eslint-enable @typescript-eslint/no-require-imports */
}

describe("getSessionCounter", () => {
  test("parses plain 'Current Session Count: N' format", () => {
    const content = "# Session Context\n\nCurrent Session Count: 42\n";
    assert.equal(getSessionCounter(content), 42);
  });

  test("parses bold 'Current Session Counter: N' format", () => {
    const content = "**Current Session Counter**: 15\n";
    assert.equal(getSessionCounter(content), 15);
  });

  test("parses double-bold '**Current Session Count**: N' format", () => {
    const content = "**Current Session Count**: 7\n";
    assert.equal(getSessionCounter(content), 7);
  });

  test("parses case-insensitive variant", () => {
    const content = "current session count: 99\n";
    assert.equal(getSessionCounter(content), 99);
  });

  test("returns 0 when no session counter found", () => {
    const content = "# No counter here\n\nSome other content\n";
    assert.equal(getSessionCounter(content), 0);
  });

  test("returns 0 for empty content", () => {
    assert.equal(getSessionCounter(""), 0);
  });

  test("handles counter with flexible spacing", () => {
    const content = "**Current Session Count**  :  213\n";
    assert.equal(getSessionCounter(content), 213);
  });
});

describe("getLastUpdated", () => {
  test("parses **Last Updated**: YYYY-MM-DD format", () => {
    const content = "**Last Updated**: 2026-03-09\n";
    assert.equal(getLastUpdated(content), "2026-03-09");
  });

  test("returns null when Last Updated is absent", () => {
    const content = "# No date here\n";
    assert.equal(getLastUpdated(content), null);
  });

  test("returns null for malformed date", () => {
    const content = "**Last Updated**: March 9, 2026\n";
    assert.equal(getLastUpdated(content), null);
  });

  test("returns null for empty content", () => {
    assert.equal(getLastUpdated(""), null);
  });

  test("extracts date when surrounded by other content", () => {
    const content = [
      "# Session Context",
      "",
      "Some intro text",
      "**Last Updated**: 2025-12-01",
      "More content after",
    ].join("\n");
    assert.equal(getLastUpdated(content), "2025-12-01");
  });
});

describe("normalizeRemoteBranch", () => {
  test("strips origin/ prefix", () => {
    assert.equal(normalizeRemoteBranch("origin/feature/foo"), "feature/foo");
    assert.equal(normalizeRemoteBranch("origin/main"), "main");
  });

  test("leaves non-origin branches unchanged", () => {
    assert.equal(normalizeRemoteBranch("upstream/feature/foo"), "upstream/feature/foo");
    assert.equal(normalizeRemoteBranch("feature/foo"), "feature/foo");
  });

  test("handles edge case of exactly 'origin/'", () => {
    assert.equal(normalizeRemoteBranch("origin/"), "");
  });
});

describe("isOutsideBase: path traversal guard", () => {
  test("returns false for same-dir relative path (empty string)", () => {
    assert.equal(isOutsideBase(""), false);
  });

  test("returns false for subdirectory paths", () => {
    assert.equal(isOutsideBase("subdir/file"), false);
    assert.equal(isOutsideBase("a/b/c"), false);
  });

  test("returns true for paths starting with ..", () => {
    assert.equal(isOutsideBase("../other"), true);
    assert.equal(isOutsideBase(String.raw`..\other`), true);
    assert.equal(isOutsideBase(".."), true);
  });
});

describe("shouldFetch TTL logic", () => {
  function shouldFetch(cacheData: unknown, ttlMs: number): boolean {
    if (!cacheData || typeof cacheData !== "object") return true;
    const data = cacheData as Record<string, unknown>;
    const lastFetch = Number(data.lastFetch);
    const ageMs = Date.now() - lastFetch;
    if (Number.isFinite(lastFetch) && ageMs >= 0 && ageMs < ttlMs) return false;
    return true;
  }

  test("returns true when no cache data is available", () => {
    assert.equal(shouldFetch(null, 5 * 60 * 1000), true);
    assert.equal(shouldFetch({}, 5 * 60 * 1000), true);
  });

  test("returns false when cache is fresh (within TTL)", () => {
    const freshCache = { lastFetch: Date.now() - 1000 }; // 1 second ago
    assert.equal(shouldFetch(freshCache, 5 * 60 * 1000), false);
  });

  test("returns true when cache is stale (beyond TTL)", () => {
    const staleCache = { lastFetch: Date.now() - 10 * 60 * 1000 }; // 10 minutes ago
    assert.equal(shouldFetch(staleCache, 5 * 60 * 1000), true);
  });
});
