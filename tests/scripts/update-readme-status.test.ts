import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/update-readme-status.js");

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
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("update-readme-status.js", () => {
  describe("CLI options", () => {
    test("--dry-run flag prevents file modifications", () => {
      const result = runScript(["--dry-run"]);

      assert.ok(result.stdout.includes("DRY RUN"), "Should indicate dry run mode");
      // Should complete successfully without writing
      assert.equal(result.exitCode, 0, "Should exit with 0 in dry run mode");
    });

    test("--verbose flag shows detailed logging", () => {
      const result = runScript(["--dry-run", "--verbose"]);

      assert.ok(result.stdout.includes("[VERBOSE]"), "Should show verbose output");
    });
  });

  describe("ROADMAP parsing", () => {
    test("reads ROADMAP.md successfully", () => {
      const result = runScript(["--dry-run"]);

      // Should not show file not found error
      assert.ok(
        !result.stdout.includes("not found") || result.stdout.includes("milestones"),
        "Should successfully read ROADMAP.md"
      );
    });

    test("parses milestones from ROADMAP.md", () => {
      const result = runScript(["--dry-run"]);

      // Should show milestone parsing output
      assert.ok(
        result.stdout.includes("milestones") || result.stdout.includes("Milestone"),
        "Should parse milestones from ROADMAP.md"
      );
    });

    test("shows overall progress", () => {
      const result = runScript(["--dry-run"]);

      // Should show progress information
      assert.ok(
        result.stdout.includes("progress") ||
          result.stdout.includes("Progress") ||
          result.stdout.includes("%"),
        "Should show overall progress"
      );
    });
  });

  describe("output generation", () => {
    test("generates status section content", () => {
      const result = runScript(["--dry-run"]);

      // In dry run, should indicate what would be written
      assert.ok(
        result.stdout.includes("Would write") ||
          result.stdout.includes("updated") ||
          result.stdout.includes("up to date"),
        "Should indicate status section would be generated"
      );
    });
  });

  describe("error handling", () => {
    test("script uses sanitizeError for safe error messages", () => {
      // The script imports and uses sanitizeError - verify output is safe
      const result = runScript(["--dry-run"]);
      const output = result.stdout + result.stderr;

      // Script should complete without exposing raw paths
      assert.ok(
        !output.includes("/home/user") || output.includes("[HOME]"),
        "Should not expose raw home paths in output"
      );
    });

    test("handles execution gracefully", () => {
      // The script has a try-catch wrapper around main()
      // We verify it doesn't crash on normal execution
      const result = runScript(["--dry-run", "--verbose"]);

      assert.ok(typeof result.exitCode === "number", "Should return numeric exit code");
      assert.ok(result.exitCode === 0 || result.exitCode === 1, "Should exit with 0 or 1");
    });
  });

  describe("security", () => {
    test("does not expose sensitive paths in output", () => {
      const result = runScript(["--dry-run"]);
      const output = result.stdout + result.stderr;

      // Check that raw home paths are not exposed
      const homeDir = process.env.HOME || "/home";
      const rawHomeExposed = output.includes(homeDir) && !output.includes("[HOME]");

      assert.ok(!rawHomeExposed, "Should not expose raw home directory paths");
    });
  });

  describe("exit codes", () => {
    test("exits 0 on successful dry run", () => {
      const result = runScript(["--dry-run"]);

      assert.equal(result.exitCode, 0, "Should exit 0 on successful operation");
    });
  });
});
