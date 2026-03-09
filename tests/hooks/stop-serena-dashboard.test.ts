/**
 * Tests for .claude/hooks/stop-serena-dashboard.js
 *
 * The hook finds processes on port 24282 and terminates them if they
 * match an allowlist. We test the pure logic functions.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing

const PROCESS_ALLOWLIST = ["node", "node.exe", "serena", "claude", "python", "python.exe"];

interface ProcessInfo {
  name: string;
  commandLine: string;
}

function isAllowedProcess(processInfo: ProcessInfo | null): boolean {
  if (!processInfo) return false;
  const name = (processInfo.name || "").toLowerCase().trim();
  const cmdLine = (processInfo.commandLine || "").toLowerCase();

  const allowedNames = new Set(PROCESS_ALLOWLIST.map((s) => s.toLowerCase()));
  const nameAllowed = allowedNames.has(name);

  const cmdLineMatch =
    /\bserena\b/.test(cmdLine) || /\bdashboard\b/.test(cmdLine) || /\b24282\b/.test(cmdLine);

  const isGenericNode = name === "node" || name === "node.exe";
  if (isGenericNode) return cmdLineMatch;

  const isGenericPython = name === "python" || name === "python.exe";
  if (isGenericPython) return /\bserena-dashboard\.py\b/.test(cmdLine);

  return nameAllowed && cmdLineMatch;
}

function isPidValid(pid: unknown): boolean {
  return Number.isInteger(pid) && (pid as number) > 0;
}

function parsePids(output: string): number[] {
  return output
    .trim()
    .split(/\r?\n/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
}

describe("isAllowedProcess", () => {
  test("returns false for null processInfo", () => {
    assert.equal(isAllowedProcess(null), false);
  });

  test("allows node process with 'serena' in command line", () => {
    assert.equal(
      isAllowedProcess({ name: "node", commandLine: "/usr/bin/node serena/server.js" }),
      true
    );
  });

  test("allows node process with 'dashboard' in command line", () => {
    assert.equal(isAllowedProcess({ name: "node", commandLine: "node dashboard.js" }), true);
  });

  test("allows node process with '24282' in command line", () => {
    assert.equal(
      isAllowedProcess({ name: "node", commandLine: "node server.js --port 24282" }),
      true
    );
  });

  test("blocks generic node process without serena/dashboard/24282 in command line", () => {
    assert.equal(isAllowedProcess({ name: "node", commandLine: "node my-other-app.js" }), false);
  });

  test("blocks node.exe without serena-related command line", () => {
    assert.equal(isAllowedProcess({ name: "node.exe", commandLine: "node.exe app.js" }), false);
  });

  test("allows python process only if running serena-dashboard.py", () => {
    assert.equal(
      isAllowedProcess({ name: "python", commandLine: "python serena-dashboard.py" }),
      true
    );
    assert.equal(
      isAllowedProcess({ name: "python", commandLine: "python other-script.py" }),
      false
    );
  });

  test("allows 'serena' named process with dashboard in command line", () => {
    assert.equal(
      isAllowedProcess({ name: "serena", commandLine: "serena dashboard --port 24282" }),
      true
    );
  });

  test("blocks process not in allowlist", () => {
    assert.equal(isAllowedProcess({ name: "nginx", commandLine: "nginx -g 'daemon off;'" }), false);
  });

  test("blocks generic non-serena process even with dashboard in cmdline", () => {
    assert.equal(isAllowedProcess({ name: "bash", commandLine: "bash run-dashboard.sh" }), false);
  });

  test("word-boundary check: 'mydashboard' does not match 'dashboard'", () => {
    assert.equal(isAllowedProcess({ name: "node", commandLine: "node mydashboard-app.js" }), false);
  });
});

describe("isPidValid", () => {
  test("returns true for positive integers", () => {
    assert.equal(isPidValid(1), true);
    assert.equal(isPidValid(1234), true);
    assert.equal(isPidValid(99999), true);
  });

  test("returns false for 0", () => {
    assert.equal(isPidValid(0), false);
  });

  test("returns false for negative integers", () => {
    assert.equal(isPidValid(-1), false);
  });

  test("returns false for NaN", () => {
    assert.equal(isPidValid(NaN), false);
  });

  test("returns false for floating point numbers", () => {
    assert.equal(isPidValid(1.5), false);
  });

  test("returns false for strings", () => {
    assert.equal(isPidValid("1234"), false);
  });

  test("returns false for null", () => {
    assert.equal(isPidValid(null), false);
  });
});

describe("parsePids", () => {
  test("parses single PID from output", () => {
    assert.deepEqual(parsePids("1234"), [1234]);
  });

  test("parses multiple PIDs from multi-line output", () => {
    assert.deepEqual(parsePids("1234\n5678"), [1234, 5678]);
  });

  test("handles Windows CRLF line endings", () => {
    assert.deepEqual(parsePids("1234\r\n5678\r\n"), [1234, 5678]);
  });

  test("filters out non-integer lines", () => {
    const output = "1234\nnot-a-pid\n5678\n";
    assert.deepEqual(parsePids(output), [1234, 5678]);
  });

  test("filters out 0 and negative values", () => {
    assert.deepEqual(parsePids("0\n-1\n1234"), [1234]);
  });

  test("returns empty array for empty output", () => {
    assert.deepEqual(parsePids(""), []);
    assert.deepEqual(parsePids("   "), []);
  });

  test("returns only first PID when multiple exist (hook takes pids[0])", () => {
    const pids = parsePids("1234\n5678");
    // The hook only uses the first PID
    assert.equal(pids[0], 1234);
  });
});
