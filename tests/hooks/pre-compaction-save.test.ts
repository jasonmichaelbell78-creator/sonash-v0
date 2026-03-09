/**
 * Tests for .claude/hooks/pre-compaction-save.js
 *
 * The hook fires PreCompact and saves a handoff.json snapshot.
 * We test the helper functions: session counter extraction, task state reading,
 * commit log parsing, and git file list processing.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing

function getSessionCounterFromContent(content: string): number | null {
  const regex = /\*{0,2}Current Session Count(?:er)?\*{0,2}[\s:]*(\d+)/i;
  const match = regex.exec(content);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseCommitLogLines(content: string): object[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const commits: object[] = [];
  for (const line of lines) {
    try {
      commits.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return commits;
}

function parseGitFileList(output: string): string[] {
  return output.split("\n").filter((f) => f.trim().length > 0);
}

function shouldSkipTaskFile(filename: string): boolean {
  return !filename.startsWith("task-") || !filename.endsWith(".state.json");
}

// Compaction trigger parsing
function parseTrigger(argv2: string): string {
  if (!argv2) return "unknown";
  try {
    const parsed = JSON.parse(argv2);
    return typeof parsed.trigger === "string" ? parsed.trigger : "unknown";
  } catch {
    // Treat as raw trigger string
    return argv2 || "unknown";
  }
}

describe("getSessionCounterFromContent", () => {
  test("extracts counter from standard format", () => {
    const content = "**Current Session Counter**: 213\n";
    assert.equal(getSessionCounterFromContent(content), 213);
  });

  test("extracts counter from Count (not Counter) variant", () => {
    const content = "Current Session Count: 7\n";
    assert.equal(getSessionCounterFromContent(content), 7);
  });

  test("returns null when no counter found", () => {
    assert.equal(getSessionCounterFromContent("# Some content\n"), null);
  });

  test("handles optional bold markers", () => {
    assert.equal(getSessionCounterFromContent("Current Session Count: 99\n"), 99);
    assert.equal(getSessionCounterFromContent("**Current Session Count**: 99\n"), 99);
  });
});

describe("parseCommitLogLines", () => {
  test("parses valid JSONL lines into objects", () => {
    const content =
      [
        JSON.stringify({ hash: "abc123", message: "feat: add X", session: 1 }),
        JSON.stringify({ hash: "def456", message: "fix: bug Y", session: 1 }),
      ].join("\n") + "\n";
    const result = parseCommitLogLines(content);
    assert.equal(result.length, 2);
    assert.equal((result[0] as Record<string, unknown>).hash, "abc123");
  });

  test("skips malformed JSON lines", () => {
    const content = [
      JSON.stringify({ hash: "abc123" }),
      "not valid json",
      JSON.stringify({ hash: "def456" }),
    ].join("\n");
    const result = parseCommitLogLines(content);
    assert.equal(result.length, 2);
  });

  test("returns empty array for empty content", () => {
    assert.equal(parseCommitLogLines("").length, 0);
    assert.equal(parseCommitLogLines("   \n   \n").length, 0);
  });

  test("ignores blank lines", () => {
    const content = JSON.stringify({ hash: "a" }) + "\n\n" + JSON.stringify({ hash: "b" });
    assert.equal(parseCommitLogLines(content).length, 2);
  });
});

describe("parseGitFileList", () => {
  test("splits newline-separated file list", () => {
    const output = "src/index.ts\nlib/utils.ts\ntests/index.test.ts\n";
    const result = parseGitFileList(output);
    assert.deepEqual(result, ["src/index.ts", "lib/utils.ts", "tests/index.test.ts"]);
  });

  test("filters out empty lines", () => {
    const output = "file1.ts\n\nfile2.ts\n";
    const result = parseGitFileList(output);
    assert.equal(result.length, 2);
  });

  test("returns empty array for empty output", () => {
    assert.equal(parseGitFileList("").length, 0);
  });

  test("handles single file", () => {
    assert.deepEqual(parseGitFileList("package.json"), ["package.json"]);
  });
});

describe("shouldSkipTaskFile", () => {
  test("returns false for valid task state files", () => {
    assert.equal(shouldSkipTaskFile("task-implement-tests.state.json"), false);
    assert.equal(shouldSkipTaskFile("task-1.state.json"), false);
  });

  test("returns true for files not starting with task-", () => {
    assert.equal(shouldSkipTaskFile("handoff.json"), true);
    assert.equal(shouldSkipTaskFile("commit-log.jsonl"), true);
  });

  test("returns true for files not ending with .state.json", () => {
    assert.equal(shouldSkipTaskFile("task-foo.json"), true);
    assert.equal(shouldSkipTaskFile("task-foo.txt"), true);
  });

  test("returns true for empty filename", () => {
    assert.equal(shouldSkipTaskFile(""), true);
  });
});

describe("parseTrigger", () => {
  test("extracts trigger from JSON argument", () => {
    const arg = JSON.stringify({ trigger: "manual" });
    assert.equal(parseTrigger(arg), "manual");
  });

  test("extracts 'auto' trigger", () => {
    const arg = JSON.stringify({ trigger: "auto" });
    assert.equal(parseTrigger(arg), "auto");
  });

  test("returns 'unknown' when trigger field is absent", () => {
    const arg = JSON.stringify({ other: "value" });
    assert.equal(parseTrigger(arg), "unknown");
  });

  test("returns 'unknown' for empty argument", () => {
    assert.equal(parseTrigger(""), "unknown");
  });

  test("returns raw string for non-JSON argument", () => {
    assert.equal(parseTrigger("manual"), "manual");
  });

  test("returns 'unknown' when trigger is not a string in JSON", () => {
    const arg = JSON.stringify({ trigger: 42 });
    assert.equal(parseTrigger(arg), "unknown");
  });
});
