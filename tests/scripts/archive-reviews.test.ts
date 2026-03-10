import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/archive-reviews.js

describe("archive-reviews: --keep argument parsing", () => {
  function parseKeepArg(argv: string[]): number {
    let keepCount = 20;
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === "--keep" && i + 1 < argv.length) {
        const parsed = Number.parseInt(argv[i + 1], 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          keepCount = parsed;
        }
      }
    }
    return keepCount;
  }

  it("defaults to 20 when not specified", () => {
    assert.strictEqual(parseKeepArg([]), 20);
  });

  it("parses --keep 50", () => {
    assert.strictEqual(parseKeepArg(["--keep", "50"]), 50);
  });

  it("ignores invalid values", () => {
    assert.strictEqual(parseKeepArg(["--keep", "abc"]), 20);
  });

  it("ignores zero value", () => {
    assert.strictEqual(parseKeepArg(["--keep", "0"]), 20);
  });

  it("ignores negative values", () => {
    assert.strictEqual(parseKeepArg(["--keep", "-5"]), 20);
  });
});

describe("archive-reviews: atomic write size validation", () => {
  function validateWriteSize(content: string, writtenContent: string): boolean {
    return content.length === writtenContent.length;
  }

  it("passes when sizes match", () => {
    const content = "hello world";
    assert.strictEqual(validateWriteSize(content, content), true);
  });

  it("fails when sizes differ (truncated write)", () => {
    assert.strictEqual(validateWriteSize("hello world", "hello"), false);
  });

  it("handles empty content", () => {
    assert.strictEqual(validateWriteSize("", ""), true);
  });
});

describe("archive-reviews: sanitizeError", () => {
  function sanitizeError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  it("sanitizes Windows paths", () => {
    const result = sanitizeError(new Error("C:\\Users\\jbell\\projects"));
    assert.ok(result.includes("[USER_PATH]"));
  });

  it("sanitizes Unix home paths", () => {
    const result = sanitizeError(new Error("/home/jbell/projects"));
    assert.ok(result.includes("[HOME]"));
  });

  it("does not modify safe messages", () => {
    assert.strictEqual(
      sanitizeError(new Error("EACCES: permission denied")),
      "EACCES: permission denied"
    );
  });
});

describe("archive-reviews: mode argument parsing", () => {
  function parseMode(args: Set<string>): { applyMode: boolean; autoMode: boolean; quiet: boolean } {
    return {
      applyMode: args.has("--apply"),
      autoMode: args.has("--auto"),
      quiet: args.has("--quiet"),
    };
  }

  it("detects apply mode", () => {
    const result = parseMode(new Set(["--apply"]));
    assert.strictEqual(result.applyMode, true);
    assert.strictEqual(result.autoMode, false);
  });

  it("detects auto mode", () => {
    const result = parseMode(new Set(["--auto"]));
    assert.strictEqual(result.autoMode, true);
    assert.strictEqual(result.applyMode, false);
  });

  it("detects quiet mode", () => {
    const result = parseMode(new Set(["--quiet"]));
    assert.strictEqual(result.quiet, true);
  });

  it("handles dry-run (no flags)", () => {
    const result = parseMode(new Set<string>());
    assert.strictEqual(result.applyMode, false);
    assert.strictEqual(result.autoMode, false);
  });
});

describe("archive-reviews: review block detection in markdown", () => {
  function countReviewBlocks(content: string): number {
    return (content.match(/^####\s+Review\s+#\d+/gm) ?? []).length;
  }

  it("counts review blocks correctly", () => {
    const content = `#### Review #1\ncontent\n#### Review #2\ncontent\n#### Review #3\ncontent`;
    assert.strictEqual(countReviewBlocks(content), 3);
  });

  it("returns 0 for content with no reviews", () => {
    assert.strictEqual(countReviewBlocks("# Title\n## Section"), 0);
  });

  it("handles single review", () => {
    assert.strictEqual(countReviewBlocks("#### Review #42\nsome content"), 1);
  });
});

describe("archive-reviews: archive filename generation", () => {
  function buildArchiveFilename(minId: number, maxId: number): string {
    return `REVIEWS_${minId}-${maxId}.md`;
  }

  it("builds correct archive filename", () => {
    assert.strictEqual(buildArchiveFilename(1, 50), "REVIEWS_1-50.md");
  });

  it("handles large IDs", () => {
    assert.strictEqual(buildArchiveFilename(300, 350), "REVIEWS_300-350.md");
  });
});
