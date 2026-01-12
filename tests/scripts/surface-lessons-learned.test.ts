import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// Get project root (works both in source and compiled contexts)
// When compiled, __dirname is dist-tests/tests/scripts, so go up 3 levels
// When in source, __dirname is tests/scripts, so go up 2 levels
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..") // source context
  : path.resolve(__dirname, "../../.."); // compiled context (dist-tests/tests/scripts -> project root)

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/surface-lessons-learned.js");

/**
 * Helper to run the script and capture output
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
    timeout: 10000,
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("surface-lessons-learned.js", () => {
  describe("CLI behavior", () => {
    test("runs successfully with no arguments", () => {
      const result = runScript();

      // Should exit 0 on success
      assert.equal(result.exitCode, 0, `Script failed with stderr: ${result.stderr}`);

      // Should output the lessons header
      assert.ok(
        result.stdout.includes("LESSONS LEARNED SURFACE"),
        "Should include header in output"
      );
    });

    test("shows found lessons count", () => {
      const result = runScript();

      assert.ok(result.stdout.includes("documented reviews"), "Should mention documented reviews");
    });

    test("handles --topic flag with valid topic", () => {
      const result = runScript(["--topic", "security"]);

      assert.equal(result.exitCode, 0, `Script failed: ${result.stderr}`);
      assert.ok(result.stdout.includes("security"), "Should show searched topic");
    });

    test("handles --topic flag with multiple topics", () => {
      const result = runScript(["--topic", "firebase,auth"]);

      assert.equal(result.exitCode, 0, `Script failed: ${result.stderr}`);
    });

    test("errors on --topic without value", () => {
      const result = runScript(["--topic"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error");
      assert.ok(output.includes("--topic requires a value"), "Should show error message");
    });

    test("errors on --topic with empty value", () => {
      const result = runScript(["--topic", ""]);

      assert.equal(result.exitCode, 1, "Should exit with error");
    });

    test("errors on --topic followed by another flag", () => {
      const result = runScript(["--topic", "--other"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error");
      assert.ok(output.includes("--topic requires a value"), "Should show error message");
    });
  });

  describe("output format", () => {
    test("outputs full log reference", () => {
      const result = runScript();

      assert.ok(
        result.stdout.includes("docs/AI_REVIEW_LEARNINGS_LOG.md"),
        "Should reference the full log file"
      );
    });

    test("does not expose home directory paths", () => {
      const result = runScript();

      // Should not contain actual home paths (sanitization check)
      const homePath = os.homedir();
      assert.ok(
        !result.stdout.includes(homePath) && !result.stderr.includes(homePath),
        "Should not expose home directory path"
      );
    });
  });

  describe("error handling", () => {
    test("fails gracefully when learnings file is missing", () => {
      // Create a temp directory without the learnings file
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lessons-test-"));

      try {
        const result = runScript([], { cwd: tempDir });

        assert.equal(result.exitCode, 1, "Should exit with error");
        assert.ok(result.stdout.includes("not found"), "Should indicate file not found");
      } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
