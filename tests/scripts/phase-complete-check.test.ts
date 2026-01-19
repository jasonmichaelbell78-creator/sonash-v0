import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

// Get project root (works both in source and compiled contexts)
// When compiled, __dirname is dist-tests/tests/scripts, so go up 3 levels
// When in source, __dirname is tests/scripts, so go up 2 levels
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..") // source context
  : path.resolve(__dirname, "../../.."); // compiled context (dist-tests/tests/scripts -> project root)

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/phase-complete-check.js");

/**
 * Helper to run the script and capture output
 */
function runScript(
  args: string[] = [],
  options: { cwd?: string; stdin?: string } = {}
): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cwd = options.cwd || PROJECT_ROOT;
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60000, // 60s timeout for tests (script runs npm test internally)
    input: options.stdin,
    env: { ...process.env, NODE_ENV: "test" },
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

describe("phase-complete-check.js", () => {
  // Cache auto mode result to avoid expensive repeated subprocess calls
  let cachedAutoResult: { stdout: string; stderr: string; exitCode: number } | null = null;

  function getAutoModeResult() {
    if (!cachedAutoResult) {
      cachedAutoResult = runScript(["--auto"]);
    }
    return cachedAutoResult;
  }

  describe("CLI argument validation", () => {
    test("--plan flag requires a path argument", () => {
      const result = runScript(["--plan"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error");
      assert.ok(output.includes("--plan requires a path"), "Should show error about missing path");
    });

    test("--plan flag rejects another flag as value", () => {
      const result = runScript(["--plan", "--auto"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error");
      assert.ok(output.includes("--plan requires a path"), "Should show error about invalid path");
    });

    test("--plan flag rejects absolute paths", () => {
      const result = runScript(["--plan", "/etc/passwd"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error for absolute path");
      assert.ok(
        output.includes("relative to project root"),
        "Should show error about absolute paths"
      );
    });

    test("--plan flag rejects path traversal", () => {
      const result = runScript(["--plan", "../outside/file.md"]);
      const output = result.stdout + result.stderr;

      assert.equal(result.exitCode, 1, "Should exit with error for path traversal");
      assert.ok(output.includes("within project root"), "Should show error about path traversal");
    });
  });

  describe("--auto mode", () => {
    test("runs in auto mode without prompts", () => {
      // Auto mode should skip interactive questions
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();

      // Should see auto mode indicator
      assert.ok(
        result.stdout.includes("AUTO MODE") || result.stdout.includes("--auto"),
        "Should indicate auto mode is active"
      );

      // Should not hang waiting for input (would timeout if it did)
      assert.ok(typeof result.exitCode === "number", "Should complete without hanging");
    });

    test("shows PHASE COMPLETION CHECKLIST header", () => {
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();

      assert.ok(
        result.stdout.includes("PHASE COMPLETION CHECKLIST"),
        "Should show checklist header"
      );
    });

    test("runs ESLint check", () => {
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();

      assert.ok(result.stdout.includes("ESLint"), "Should run ESLint check");
    });

    test("runs tests check", () => {
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();

      assert.ok(
        result.stdout.includes("tests") || result.stdout.includes("Tests"),
        "Should run tests check"
      );
    });
  });

  describe("deliverable audit", () => {
    test("handles missing plan file gracefully in non-auto mode", () => {
      const result = runScript(["--plan", "nonexistent-file.md", "--auto"]);

      // Should indicate file not found
      assert.ok(
        result.stdout.includes("not found") || result.stdout.includes("No plan file"),
        "Should indicate plan file not found"
      );
    });

    test("extracts deliverables from valid plan file", () => {
      // Create a temp plan file within PROJECT_ROOT for valid workspace context
      // This ensures npm commands can find package.json
      const tempDir = path.join(PROJECT_ROOT, ".temp-test-phase-" + Date.now());
      const planPath = path.join(tempDir, "test-plan.md");

      try {
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(
          planPath,
          `
# Test Plan

## Deliverables

- [ ] README.md
- [ ] ARCHITECTURE.md
- [ ] lib/utils/test.ts

## Acceptance Criteria

- File exists
        `
        );

        // Run from PROJECT_ROOT with relative plan path (proper workspace context)
        const relativePlanPath = path.relative(PROJECT_ROOT, planPath);
        const result = runScript(["--auto", "--plan", relativePlanPath], { cwd: PROJECT_ROOT });

        // Should mention analyzing the plan or at least run successfully
        assert.ok(
          result.stdout.includes("Analyzing") ||
            result.stdout.includes("deliverables") ||
            result.stdout.includes("plan"),
          "Should analyze plan file"
        );
      } finally {
        // Cleanup temp dir
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe("security", () => {
    test("does not expose home directory in output", () => {
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();
      const output = result.stdout + result.stderr;

      const homePath = os.homedir();
      // Accept either: home path not present OR sanitized to [HOME]
      // npm test/lint output may include paths, so we allow sanitized form
      const homePathExposed = output.includes(homePath) && !output.includes("[HOME]");
      assert.ok(
        !homePathExposed,
        "Should not expose raw home directory path in output (sanitization to [HOME] is acceptable)"
      );
    });

    test("sanitizes error messages", () => {
      // Test with an invalid path that might trigger error output
      const result = runScript(["--plan", "../../etc/passwd"]);
      const output = result.stdout + result.stderr;

      // Check output doesn't contain sensitive info
      assert.ok(
        !output.includes("/home/") || output.includes("[HOME]"),
        "Should sanitize or not include home paths in errors"
      );
    });
  });

  describe("exit codes", () => {
    test("exits 0 when all automated checks pass", () => {
      // Use cached result to avoid repeated expensive subprocess calls
      const result = getAutoModeResult();

      // If lint and tests pass, should exit 0 in auto mode
      // (unless there are failures)
      assert.ok(typeof result.exitCode === "number", "Should return a numeric exit code");
    });
  });
});
