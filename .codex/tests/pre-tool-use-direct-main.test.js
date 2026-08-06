/* eslint-disable @typescript-eslint/no-require-imports, no-undef -- Node test harness uses CommonJS globals. */
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const test = require("node:test");

const hookPath = join(__dirname, "..", "hooks", "pre-tool-use-direct-main.js");

function runHook(input) {
  const result = spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === "" ? null : JSON.parse(result.stdout);
}

test("allows non-Bash tools", () => {
  assert.equal(runHook({ tool_name: "Read" }), null);
});

test("denies a push targeting main from any branch", () => {
  const result = runHook({
    tool_name: "Bash",
    tool_input: { command: "git push origin main" },
    cwd: process.cwd(),
  });

  assert.equal(result.hookSpecificOutput.permissionDecision, "deny");
});

test("allows read-only Git commands on the working branch", () => {
  assert.deepEqual(
    runHook({
      tool_name: "Bash",
      tool_input: { command: "git status --short" },
      cwd: process.cwd(),
    }),
    { continue: true }
  );
});

test("denies mutation on a checked-out main branch", () => {
  const directory = mkdtempSync(join(tmpdir(), "sonash-codex-hook-"));

  try {
    execFileSync("git", ["init", "--quiet", "--initial-branch=main", directory]);
    const result = runHook({
      tool_name: "Bash",
      tool_input: { command: "git commit -m test" },
      cwd: directory,
    });

    assert.equal(result.hookSpecificOutput.permissionDecision, "deny");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
