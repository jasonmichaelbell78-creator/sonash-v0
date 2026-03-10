import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Smoke tests for scripts/generate-claude-antipatterns.js (CLI wrapper)

describe("generate-claude-antipatterns: main export loading", () => {
  function checkMainExport(mainFn: unknown): { valid: boolean; error?: string } {
    if (typeof mainFn !== "function") {
      return {
        valid: false,
        error: "No callable `main` export found. Rebuild scripts/reviews and verify dist output.",
      };
    }
    return { valid: true };
  }

  it("accepts function export", () => {
    assert.strictEqual(checkMainExport(() => {}).valid, true);
  });

  it("rejects undefined export", () => {
    const result = checkMainExport(undefined);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes("main"));
  });

  it("rejects object export", () => {
    const result = checkMainExport({});
    assert.strictEqual(result.valid, false);
  });
});

describe("generate-claude-antipatterns: CLI arg passthrough", () => {
  function buildArgs(argv: string[]): string[] {
    return argv.slice(2);
  }

  it("passes --dry-run to main", () => {
    const args = buildArgs(["node", "script.js", "--dry-run"]);
    assert.ok(args.includes("--dry-run"));
  });

  it("passes empty args when no flags given", () => {
    const args = buildArgs(["node", "script.js"]);
    assert.deepStrictEqual(args, []);
  });
});
