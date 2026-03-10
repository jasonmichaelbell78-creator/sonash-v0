import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/repair-archives.js

describe("repair-archives: heading normalization", () => {
  function normalizeHeadings(content: string): { fixed: string; changes: number } {
    let changes = 0;
    const fixed = content.replace(/^###\s+(Review\s+#\d+)/gm, (_, capture) => {
      changes++;
      return `#### ${capture}`;
    });
    return { fixed, changes };
  }

  it("upgrades ### Review headings to ####", () => {
    const content = "### Review #42\nsome content";
    const { fixed, changes } = normalizeHeadings(content);
    assert.ok(fixed.startsWith("#### Review #42"));
    assert.strictEqual(changes, 1);
  });

  it("leaves already correct headings unchanged", () => {
    const content = "#### Review #42\nsome content";
    const { changes } = normalizeHeadings(content);
    assert.strictEqual(changes, 0);
  });

  it("counts multiple changes", () => {
    const content = "### Review #1\ncontent\n### Review #2\ncontent";
    const { changes } = normalizeHeadings(content);
    assert.strictEqual(changes, 2);
  });
});

describe("repair-archives: archive file name validation", () => {
  function isValidArchiveFilename(filename: string): boolean {
    return /^REVIEWS_\d+-\d+\.md$/.test(filename);
  }

  it("accepts valid archive filename", () => {
    assert.strictEqual(isValidArchiveFilename("REVIEWS_1-50.md"), true);
  });

  it("accepts large range archives", () => {
    assert.strictEqual(isValidArchiveFilename("REVIEWS_300-369.md"), true);
  });

  it("rejects invalid archive filenames", () => {
    assert.strictEqual(isValidArchiveFilename("archive.md"), false);
    assert.strictEqual(isValidArchiveFilename("REVIEWS.md"), false);
  });
});

describe("repair-archives: duplicate detection", () => {
  function findDuplicateIds(content: string): number[] {
    const ids: number[] = [];
    const regex = /^####\s+Review\s+#(\d+)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      ids.push(Number.parseInt(match[1], 10));
    }
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const id of ids) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }
    return Array.from(duplicates);
  }

  it("detects duplicate review IDs", () => {
    const content = "#### Review #42\ncontent\n#### Review #42\ncopy";
    const dups = findDuplicateIds(content);
    assert.deepStrictEqual(dups, [42]);
  });

  it("returns empty for no duplicates", () => {
    const content = "#### Review #1\ncontent\n#### Review #2\nmore";
    assert.deepStrictEqual(findDuplicateIds(content), []);
  });
});

describe("repair-archives: path traversal protection", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects ../traversal", () => {
    assert.strictEqual(isPathTraversal("../outside"), true);
  });

  it("allows safe paths", () => {
    assert.strictEqual(isPathTraversal("docs/archive/file.md"), false);
  });
});
