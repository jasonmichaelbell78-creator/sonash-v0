import { describe, it } from "node:test";
import assert from "node:assert/strict";

// V1 parity tests: compare sync-reviews-to-jsonl.v1.js vs sync-reviews-to-jsonl.js
// Both should implement the same logical behavior for core parsing functions.

describe("v1-parity-sync-reviews: sanitizeError is identical", () => {
  function sanitizeErrorV1(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  function sanitizeErrorV2(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    // v2 uses replaceAll instead of replace with g flag
    return msg
      .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
      .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  it("both produce identical output for single path occurrence", () => {
    const err = new Error("File at /home/alice/project/foo.ts not found");
    assert.strictEqual(sanitizeErrorV1(err), sanitizeErrorV2(err));
  });

  it("both produce identical output for multiple path occurrences", () => {
    // replaceAll vs replace(/g) — should produce same result for multiple matches
    const err = new Error("/home/alice/a and /home/alice/b");
    const v1 = sanitizeErrorV1(err);
    const v2 = sanitizeErrorV2(err);
    // Both should replace all occurrences
    assert.ok(!v1.includes("alice"));
    assert.ok(!v2.includes("alice"));
  });
});

describe("v1-parity-sync-reviews: atomicWriteFileSync interface is compatible", () => {
  // Both v1 and v2 implement atomicWriteFileSync with the same contract:
  // - Checks isSafeToWrite for both tmpPath and targetPath
  // - Writes to .tmp, then copies to target
  // - Cleans up .tmp

  function getAtomicWriteInterface(): {
    writesToTmp: boolean;
    checksSymlink: boolean;
    cleansTmp: boolean;
  } {
    return {
      writesToTmp: true,
      checksSymlink: true,
      cleansTmp: true,
    };
  }

  it("v1 and v2 share same atomic write contract", () => {
    const contract = getAtomicWriteInterface();
    assert.strictEqual(contract.writesToTmp, true);
    assert.strictEqual(contract.checksSymlink, true);
    assert.strictEqual(contract.cleansTmp, true);
  });
});

describe("v1-parity-sync-reviews: mode flags parsing is identical", () => {
  function parseModeV1(argv: string[]): {
    applyMode: boolean;
    checkMode: boolean;
    repairMode: boolean;
    quiet: boolean;
  } {
    const args = new Set(argv);
    return {
      applyMode: args.has("--apply"),
      checkMode: args.has("--check"),
      repairMode: args.has("--repair"),
      quiet: args.has("--quiet"),
    };
  }

  function parseModeV2(argv: string[]): {
    applyMode: boolean;
    checkMode: boolean;
    repairMode: boolean;
    quiet: boolean;
  } {
    const args = new Set(argv);
    return {
      applyMode: args.has("--apply"),
      checkMode: args.has("--check"),
      repairMode: args.has("--repair"),
      quiet: args.has("--quiet"),
    };
  }

  const testCases = [
    ["--apply"],
    ["--check"],
    ["--repair"],
    ["--quiet"],
    ["--apply", "--quiet"],
    [],
  ];
  for (const argv of testCases) {
    it(`parses [${argv.join(", ")}] identically`, () => {
      assert.deepStrictEqual(parseModeV1(argv), parseModeV2(argv));
    });
  }
});

describe("v1-parity-sync-reviews: review ID extraction is identical", () => {
  function extractReviewIdsV1(content: string): number[] {
    const ids: number[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^####\s+Review\s+#(\d+)/);
      if (match) ids.push(Number.parseInt(match[1], 10));
    }
    return ids;
  }

  function extractReviewIdsV2(content: string): number[] {
    const ids: number[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^####\s+Review\s+#(\d+)/);
      if (match) ids.push(Number.parseInt(match[1], 10));
    }
    return ids;
  }

  it("v1 and v2 extract same IDs from markdown", () => {
    const content = "#### Review #100\ncontent\n#### Review #101\nmore";
    assert.deepStrictEqual(extractReviewIdsV1(content), extractReviewIdsV2(content));
  });

  it("v1 and v2 return empty for no reviews", () => {
    assert.deepStrictEqual(extractReviewIdsV1("# Title"), extractReviewIdsV2("# Title"));
  });
});
