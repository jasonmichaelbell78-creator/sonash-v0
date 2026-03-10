import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

// Re-implements core logic from scripts/archive-doc.js

describe("archive-doc: validatePathWithinRepo", () => {
  const ROOT = "/project/root";

  function validatePathWithinRepo(
    filePath: string,
    root: string
  ): { valid: boolean; error?: string } {
    if (!filePath) return { valid: false, error: "Empty file path" };

    // On Windows, block cross-drive paths
    if (process.platform === "win32") {
      const pathDrive = filePath.slice(0, 2).toLowerCase();
      const rootDrive = root.slice(0, 2).toLowerCase();
      if (/^[a-z]:/.test(pathDrive) && /^[a-z]:/.test(rootDrive) && pathDrive !== rootDrive) {
        return { valid: false, error: "Cross-drive path detected" };
      }
    }

    // Check if path escapes root
    const rel = path.relative(root, filePath);
    if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      return { valid: false, error: `Path escapes repository root: ${filePath}` };
    }

    return { valid: true };
  }

  it("accepts file within project root", () => {
    const result = validatePathWithinRepo("/project/root/docs/file.md", ROOT);
    assert.strictEqual(result.valid, true);
  });

  it("rejects path traversal attempt", () => {
    const result = validatePathWithinRepo("/project/other/file.md", ROOT);
    assert.strictEqual(result.valid, false);
  });

  it("rejects empty path", () => {
    const result = validatePathWithinRepo("", ROOT);
    assert.strictEqual(result.valid, false);
  });
});

describe("archive-doc: argument parsing", () => {
  function parseArgs(argv: string[]): {
    dryRun: boolean;
    verbose: boolean;
    updateLog: boolean;
    reason: string;
    fileArg: string | undefined;
  } {
    const dryRun = argv.includes("--dry-run");
    const verbose = argv.includes("--verbose");
    const updateLog = argv.includes("--update-log");
    const reasonIndex = argv.indexOf("--reason");
    const reason =
      reasonIndex !== -1 && argv[reasonIndex + 1]
        ? argv[reasonIndex + 1]
        : "Superseded or outdated";
    const fileArg = argv.find(
      (arg) =>
        !arg.startsWith("--") && (reasonIndex === -1 || argv.indexOf(arg) !== reasonIndex + 1)
    );
    return { dryRun, verbose, updateLog, reason, fileArg };
  }

  it("parses --dry-run flag", () => {
    const result = parseArgs(["--dry-run"]);
    assert.strictEqual(result.dryRun, true);
  });

  it("parses --reason value", () => {
    const result = parseArgs(["--reason", "Outdated content"]);
    assert.strictEqual(result.reason, "Outdated content");
  });

  it("defaults reason to standard message", () => {
    const result = parseArgs([]);
    assert.strictEqual(result.reason, "Superseded or outdated");
  });

  it("identifies file argument", () => {
    const result = parseArgs(["MYFILE.md", "--dry-run"]);
    assert.strictEqual(result.fileArg, "MYFILE.md");
  });

  it("parses --update-log flag", () => {
    const result = parseArgs(["--update-log"]);
    assert.strictEqual(result.updateLog, true);
  });
});

describe("archive-doc: frontmatter building", () => {
  function buildArchivedFrontmatter(
    originalPath: string,
    reason: string,
    archivedDate: string
  ): string {
    return [
      "---",
      `archived_date: ${archivedDate}`,
      `original_path: ${originalPath}`,
      `archive_reason: ${reason}`,
      "---",
    ].join("\n");
  }

  it("produces valid frontmatter block", () => {
    const fm = buildArchivedFrontmatter("docs/OLD.md", "Superseded", "2026-01-01");
    assert.ok(fm.startsWith("---"));
    assert.ok(fm.endsWith("---"));
    assert.ok(fm.includes("archived_date: 2026-01-01"));
    assert.ok(fm.includes("original_path: docs/OLD.md"));
    assert.ok(fm.includes("archive_reason: Superseded"));
  });
});

describe("archive-doc: path containment check using regex", () => {
  function isPathTraversal(rel: string): boolean {
    return /^\.\.(?:[\\/]|$)/.test(rel);
  }

  it("detects ../escape", () => {
    assert.strictEqual(isPathTraversal("../escape"), true);
  });

  it("detects ..\\ on Windows", () => {
    assert.strictEqual(isPathTraversal("..\\escape"), true);
  });

  it("detects standalone ..", () => {
    assert.strictEqual(isPathTraversal(".."), true);
  });

  it("does not flag normal relative paths", () => {
    assert.strictEqual(isPathTraversal("docs/file.md"), false);
  });

  it("does not flag ..hidden (starts with .. but not traversal)", () => {
    assert.strictEqual(isPathTraversal("..hidden"), false);
  });
});
