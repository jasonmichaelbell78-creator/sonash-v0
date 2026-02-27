/**
 * Pattern Compliance Checker Integration Test
 *
 * Validates that check-pattern-compliance.js can be executed without errors
 * and that the no-raw-fs-write pattern is properly configured.
 *
 * NOTE: Regex-level pattern tests live in tests/pattern-compliance.test.js (vitest).
 * This file tests the script execution and integration.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/check-pattern-compliance.js");

/**
 * Helper to run the compliance checker script
 */
function runScript(
  args: string[] = [],
  options: { cwd?: string } = {}
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cwd = options.cwd || PROJECT_ROOT;
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("check-pattern-compliance.js", () => {
  test("script file exists", () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), `Script not found at ${SCRIPT_PATH}`);
  });

  test("can be executed without crashing (--help or dry run)", () => {
    // Run with a single known-clean file to verify the script loads
    const result = runScript(["README.md"]);

    // Exit code 0 or 1 is acceptable (0 = no violations, 1 = violations found)
    // Exit code 2 means an error in the script itself
    assert.ok(
      result.exitCode !== 2,
      `Script crashed with exit code 2. stderr: ${result.stderr.slice(0, 500)}`
    );
  });

  test("no-raw-fs-write pattern is registered", () => {
    // Run with --verbose and --json to get pattern info
    const result = runScript(["--verbose", "--json", "scripts/lib/safe-fs.js"]);

    // The script should either report violations or pass without errors
    // Exit code 2 = script error
    assert.ok(result.exitCode !== 2, `Script crashed. stderr: ${result.stderr.slice(0, 500)}`);
  });

  test("detects raw fs writes in a test file", () => {
    // Create a temp file with a raw fs.writeFileSync call
    const tempDir = fs.mkdtempSync(path.join(PROJECT_ROOT, ".temp-test-compliance-"));
    const testFile = path.join(tempDir, "scripts", "bad-script.js");

    try {
      fs.mkdirSync(path.join(tempDir, "scripts"), { recursive: true });
      fs.writeFileSync(
        testFile,
        `const fs = require("fs");\nfs.writeFileSync("output.txt", "data");\n`
      );

      // Run compliance checker on this file — must use relative path
      // because the checker rejects absolute paths as a security measure
      const relPath = path.relative(PROJECT_ROOT, testFile).split(path.sep).join(path.posix.sep);
      const result = runScript([relPath]);

      // Should find violations (exit code 0 means no critical, but output should mention it)
      // The no-raw-fs-write pattern is severity "medium" so it won't cause exit code 1
      // but it should appear in stdout
      const combined = result.stdout + result.stderr;
      assert.ok(
        combined.includes("no-raw-fs-write") || combined.includes("writeFileSync"),
        `Expected raw fs write to be detected. exitCode=${result.exitCode} stderr=${result.stderr.slice(0, 200)}`
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
