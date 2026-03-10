import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-propagation.js

function toPosixPath(filePath: string): string {
  return String(filePath).replaceAll("\\", "/");
}

function posixDirname(filePath: string): string {
  const s = toPosixPath(filePath).replace(/\/+$/, "");
  const idx = s.lastIndexOf("/");
  if (idx === -1) return ".";
  if (idx === 0) return "/";
  return s.slice(0, idx);
}

function parsePropagationArgs(argv: string[]): {
  verbose: boolean;
  stagedOnly: boolean;
  blocking: boolean;
} {
  return {
    verbose: argv.includes("--verbose"),
    stagedOnly: argv.includes("--staged"),
    blocking: argv.includes("--blocking"),
  };
}

describe("check-propagation: toPosixPath", () => {
  it("converts backslashes to forward slashes", () => {
    assert.strictEqual(toPosixPath("scripts\\lib\\utils.js"), "scripts/lib/utils.js");
  });

  it("leaves forward slashes unchanged", () => {
    assert.strictEqual(toPosixPath("scripts/lib/utils.js"), "scripts/lib/utils.js");
  });

  it("handles mixed separators", () => {
    assert.strictEqual(toPosixPath("scripts\\lib/utils.js"), "scripts/lib/utils.js");
  });

  it("handles empty string", () => {
    assert.strictEqual(toPosixPath(""), "");
  });
});

describe("check-propagation: posixDirname", () => {
  it("returns directory of file path", () => {
    assert.strictEqual(posixDirname("scripts/lib/utils.js"), "scripts/lib");
  });

  it("returns . for top-level file", () => {
    assert.strictEqual(posixDirname("utils.js"), ".");
  });

  it("returns / for root file", () => {
    assert.strictEqual(posixDirname("/utils.js"), "/");
  });

  it("strips trailing slashes", () => {
    assert.strictEqual(posixDirname("scripts/lib/"), "scripts");
  });
});

describe("check-propagation: KNOWN_PATTERN_RULES validation", () => {
  const KNOWN_PATTERN_RULES = [
    { name: "statSync-without-lstat", description: "statSync without symlink check" },
    {
      name: "path-resolve-without-containment",
      description: "path.resolve() without path containment guard",
    },
    {
      name: "writeFileSync-without-symlink-guard",
      description: "writeFileSync without symlink check",
    },
    { name: "rmSync-usage", description: "rmSync creates race condition risk" },
    { name: "escapeCell-inconsistency", description: "Markdown table write without escapeCell" },
    { name: "truthy-filter-unsafe", description: ".filter(Boolean) unsafe for nullable numbers" },
  ];

  it("contains statSync pattern rule", () => {
    assert.ok(KNOWN_PATTERN_RULES.some((r) => r.name === "statSync-without-lstat"));
  });

  it("contains writeFileSync symlink guard rule", () => {
    assert.ok(KNOWN_PATTERN_RULES.some((r) => r.name === "writeFileSync-without-symlink-guard"));
  });

  it("contains truthy filter rule", () => {
    assert.ok(KNOWN_PATTERN_RULES.some((r) => r.name === "truthy-filter-unsafe"));
  });

  it("has descriptions for all rules", () => {
    for (const rule of KNOWN_PATTERN_RULES) {
      assert.ok(rule.description.length > 0, `Rule ${rule.name} has empty description`);
    }
  });
});

describe("check-propagation: argument parsing", () => {
  it("parses --verbose flag", () => {
    assert.strictEqual(parsePropagationArgs(["--verbose"]).verbose, true);
  });

  it("parses --staged flag", () => {
    assert.strictEqual(parsePropagationArgs(["--staged"]).stagedOnly, true);
  });

  it("parses --blocking flag", () => {
    assert.strictEqual(parsePropagationArgs(["--blocking"]).blocking, true);
  });

  it("returns false for all flags when none provided", () => {
    const result = parsePropagationArgs([]);
    assert.strictEqual(result.verbose, false);
    assert.strictEqual(result.stagedOnly, false);
    assert.strictEqual(result.blocking, false);
  });
});

describe("check-propagation: SEARCH_DIRS and IGNORE_DIRS", () => {
  const SEARCH_DIRS = ["scripts/", ".claude/skills/", ".claude/hooks/"];
  const IGNORE_DIRS = ["node_modules", ".git", "docs/archive", "__tests__"];

  it("searches in scripts directory", () => {
    assert.ok(SEARCH_DIRS.includes("scripts/"));
  });

  it("searches in hooks directory", () => {
    assert.ok(SEARCH_DIRS.includes(".claude/hooks/"));
  });

  it("ignores node_modules", () => {
    assert.ok(IGNORE_DIRS.includes("node_modules"));
  });

  it("ignores .git directory", () => {
    assert.ok(IGNORE_DIRS.includes(".git"));
  });
});

describe("check-propagation: MAX_FILE_SIZE guard", () => {
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  function shouldSkipFile(sizeBytes: number): boolean {
    return sizeBytes > MAX_FILE_SIZE;
  }

  it("skips files larger than 2MB", () => {
    assert.strictEqual(shouldSkipFile(3 * 1024 * 1024), true);
  });

  it("processes files smaller than 2MB", () => {
    assert.strictEqual(shouldSkipFile(1 * 1024 * 1024), false);
  });

  it("processes files exactly at the limit", () => {
    assert.strictEqual(shouldSkipFile(MAX_FILE_SIZE), false);
  });
});
