/**
 * Tests for .claude/hooks/global/gsd-check-update.js
 *
 * The hook spawns a detached child process to check for GSD updates.
 * We test the cache data structures and version comparison logic inline.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted logic for unit testing

interface UpdateCheckResult {
  update_available: boolean;
  installed: string;
  latest: string;
  checked: number;
}

function buildUpdateResult(installed: string, latest: string | null): UpdateCheckResult {
  return {
    update_available: latest !== null && installed !== latest,
    installed,
    latest: latest || "unknown",
    checked: Math.floor(Date.now() / 1000),
  };
}

function isUpdateAvailable(cache: unknown): boolean {
  if (!cache || typeof cache !== "object" || Array.isArray(cache)) return false;
  const c = cache as Record<string, unknown>;
  return c.update_available === true;
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+/.test(version);
}

function parseVersion(version: string): [number, number, number] {
  const regex = /^(\d+)\.(\d+)\.(\d+)/;
  const parts = regex.exec(version);
  if (!parts) return [0, 0, 0];
  return [
    Number.parseInt(parts[1], 10),
    Number.parseInt(parts[2], 10),
    Number.parseInt(parts[3], 10),
  ];
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

describe("buildUpdateResult", () => {
  test("marks update available when installed differs from latest", () => {
    const result = buildUpdateResult("1.0.0", "1.1.0");
    assert.equal(result.update_available, true);
    assert.equal(result.installed, "1.0.0");
    assert.equal(result.latest, "1.1.0");
  });

  test("marks no update when installed matches latest", () => {
    const result = buildUpdateResult("1.1.0", "1.1.0");
    assert.equal(result.update_available, false);
  });

  test("marks no update when latest is null (npm check failed)", () => {
    const result = buildUpdateResult("1.0.0", null);
    assert.equal(result.update_available, false);
    assert.equal(result.latest, "unknown");
  });

  test("includes a checked timestamp (unix seconds)", () => {
    const before = Math.floor(Date.now() / 1000);
    const result = buildUpdateResult("1.0.0", "1.1.0");
    const after = Math.floor(Date.now() / 1000);
    assert.ok(result.checked >= before && result.checked <= after);
  });
});

describe("isUpdateAvailable", () => {
  test("returns true when update_available is true", () => {
    assert.equal(
      isUpdateAvailable({ update_available: true, installed: "1.0.0", latest: "1.1.0" }),
      true
    );
  });

  test("returns false when update_available is false", () => {
    assert.equal(isUpdateAvailable({ update_available: false }), false);
  });

  test("returns false for null cache", () => {
    assert.equal(isUpdateAvailable(null), false);
  });

  test("returns false for array input", () => {
    assert.equal(isUpdateAvailable([]), false);
  });

  test("returns false when update_available is missing", () => {
    assert.equal(isUpdateAvailable({ installed: "1.0.0", latest: "1.0.0" }), false);
  });
});

describe("isValidVersion", () => {
  test("returns true for semver-like versions", () => {
    assert.equal(isValidVersion("1.0.0"), true);
    assert.equal(isValidVersion("2.13.5"), true);
    assert.equal(isValidVersion("0.0.1"), true);
  });

  test("returns false for non-version strings", () => {
    assert.equal(isValidVersion("unknown"), false);
    assert.equal(isValidVersion(""), false);
    assert.equal(isValidVersion("0.0.0"), true); // technically valid semver
  });
});

describe("compareVersions", () => {
  test("returns 0 for equal versions", () => {
    assert.equal(compareVersions("1.2.3", "1.2.3"), 0);
  });

  test("returns positive when a is newer (major)", () => {
    assert.ok(compareVersions("2.0.0", "1.0.0") > 0);
  });

  test("returns negative when a is older (major)", () => {
    assert.ok(compareVersions("1.0.0", "2.0.0") < 0);
  });

  test("handles minor version differences", () => {
    assert.ok(compareVersions("1.2.0", "1.1.0") > 0);
    assert.ok(compareVersions("1.1.0", "1.2.0") < 0);
  });

  test("handles patch version differences", () => {
    assert.ok(compareVersions("1.0.2", "1.0.1") > 0);
    assert.ok(compareVersions("1.0.1", "1.0.2") < 0);
  });
});
