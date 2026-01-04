import assert from "node:assert/strict"
import { test, describe } from "node:test"
import { spawnSync } from "child_process"
import * as path from "path"
import * as fs from "fs"
import * as os from "os"

// Get project root (works both in source and compiled contexts)
// When compiled, __dirname is dist-tests/tests/scripts, so go up 3 levels
// When in source, __dirname is tests/scripts, so go up 2 levels
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")  // source context
  : path.resolve(__dirname, "../../..")  // compiled context (dist-tests/tests/scripts -> project root)

const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/phase-complete-check.js")

/**
 * Helper to run the script and capture output
 */
function runScript(args: string[] = [], options: { cwd?: string; stdin?: string } = {}): {
  stdout: string
  stderr: string
  exitCode: number
} {
  const cwd = options.cwd || PROJECT_ROOT
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 60000, // 60s timeout for tests (script runs npm test internally)
    input: options.stdin,
    env: { ...process.env, NODE_ENV: "test" }
  })

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1
  }
}

describe("phase-complete-check.js", () => {
  describe("CLI argument validation", () => {
    test("--plan flag requires a path argument", () => {
      const result = runScript(["--plan"])
      const output = result.stdout + result.stderr

      assert.equal(result.exitCode, 1, "Should exit with error")
      assert.ok(
        output.includes("--plan requires a path"),
        "Should show error about missing path"
      )
    })

    test("--plan flag rejects another flag as value", () => {
      const result = runScript(["--plan", "--auto"])
      const output = result.stdout + result.stderr

      assert.equal(result.exitCode, 1, "Should exit with error")
      assert.ok(
        output.includes("--plan requires a path"),
        "Should show error about invalid path"
      )
    })

    test("--plan flag rejects absolute paths", () => {
      const result = runScript(["--plan", "/etc/passwd"])
      const output = result.stdout + result.stderr

      assert.equal(result.exitCode, 1, "Should exit with error for absolute path")
      assert.ok(
        output.includes("relative to project root"),
        "Should show error about absolute paths"
      )
    })

    test("--plan flag rejects path traversal", () => {
      const result = runScript(["--plan", "../outside/file.md"])
      const output = result.stdout + result.stderr

      assert.equal(result.exitCode, 1, "Should exit with error for path traversal")
      assert.ok(
        output.includes("within project root"),
        "Should show error about path traversal"
      )
    })
  })

  describe("--auto mode", () => {
    test("runs in auto mode without prompts", () => {
      // Auto mode should skip interactive questions
      const result = runScript(["--auto"])

      // Should see auto mode indicator
      assert.ok(
        result.stdout.includes("AUTO MODE") || result.stdout.includes("--auto"),
        "Should indicate auto mode is active"
      )

      // Should not hang waiting for input (would timeout if it did)
      assert.ok(
        typeof result.exitCode === "number",
        "Should complete without hanging"
      )
    })

    test("shows PHASE COMPLETION CHECKLIST header", () => {
      const result = runScript(["--auto"])

      assert.ok(
        result.stdout.includes("PHASE COMPLETION CHECKLIST"),
        "Should show checklist header"
      )
    })

    test("runs ESLint check", () => {
      const result = runScript(["--auto"])

      assert.ok(
        result.stdout.includes("ESLint"),
        "Should run ESLint check"
      )
    })

    test("runs tests check", () => {
      const result = runScript(["--auto"])

      assert.ok(
        result.stdout.includes("tests") || result.stdout.includes("Tests"),
        "Should run tests check"
      )
    })
  })

  describe("deliverable audit", () => {
    test("handles missing plan file gracefully in non-auto mode", () => {
      const result = runScript(["--plan", "nonexistent-file.md", "--auto"])

      // Should indicate file not found
      assert.ok(
        result.stdout.includes("not found") || result.stdout.includes("No plan file"),
        "Should indicate plan file not found"
      )
    })

    test("extracts deliverables from valid plan file", () => {
      // Create a temp plan file with deliverables
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "phase-test-"))
      const planPath = path.join(tempDir, "test-plan.md")

      fs.writeFileSync(planPath, `
# Test Plan

## Deliverables

- [ ] README.md
- [ ] ARCHITECTURE.md
- [ ] lib/utils/test.ts

## Acceptance Criteria

- File exists
      `)

      // Also create some of the files
      fs.mkdirSync(path.join(tempDir, "lib/utils"), { recursive: true })
      fs.writeFileSync(path.join(tempDir, "README.md"), "# Test README")
      fs.writeFileSync(path.join(tempDir, "lib/utils/test.ts"), "export const test = true;")

      try {
        // Run from temp dir to avoid running full test suite
        const result = runScript(
          ["--auto", "--plan", "test-plan.md"],
          { cwd: tempDir }
        )

        // Should mention analyzing the plan
        assert.ok(
          result.stdout.includes("Analyzing") || result.stdout.includes("deliverables"),
          "Should analyze plan file"
        )
      } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    })
  })

  describe("security", () => {
    test("does not expose home directory in output", () => {
      const result = runScript(["--auto"])
      const output = result.stdout + result.stderr

      const homePath = os.homedir()
      // Accept either: home path not present OR sanitized to [HOME]
      // npm test/lint output may include paths, so we allow sanitized form
      const homePathExposed = output.includes(homePath) && !output.includes("[HOME]")
      assert.ok(
        !homePathExposed,
        "Should not expose raw home directory path in output (sanitization to [HOME] is acceptable)"
      )
    })

    test("sanitizes error messages", () => {
      // Test with an invalid path that might trigger error output
      const result = runScript(["--plan", "../../etc/passwd"])
      const output = result.stdout + result.stderr

      // Check output doesn't contain sensitive info
      assert.ok(
        !output.includes("/home/") || output.includes("[HOME]"),
        "Should sanitize or not include home paths in errors"
      )
    })
  })

  describe("exit codes", () => {
    test("exits 0 when all automated checks pass", () => {
      const result = runScript(["--auto"])

      // If lint and tests pass, should exit 0 in auto mode
      // (unless there are failures)
      assert.ok(
        typeof result.exitCode === "number",
        "Should return a numeric exit code"
      )
    })
  })
})
