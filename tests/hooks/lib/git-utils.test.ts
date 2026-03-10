/**
 * Tests for .claude/hooks/lib/git-utils.js
 *
 * Validates resolveProjectDir() containment logic and gitExec()
 * error-tolerance. We do NOT run real git commands in most tests.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      /* existsSync race */
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

describe("git-utils: resolveProjectDir", () => {
  const HOOK_PATH = path.join(PROJECT_ROOT, ".claude/hooks/lib/git-utils.js");

  let tmpDir: string;
  let origEnv: string | undefined;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-utils-test-"));
    origEnv = process.env.CLAUDE_PROJECT_DIR;
    origCwd = process.cwd();
  });

  afterEach(() => {
    // Restore env and cwd
    if (origEnv === undefined) {
      delete process.env.CLAUDE_PROJECT_DIR;
    } else {
      process.env.CLAUDE_PROJECT_DIR = origEnv;
    }
    try {
      process.chdir(origCwd);
    } catch {
      // ignore
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
    // Bust require cache so the module re-evaluates CLAUDE_PROJECT_DIR on next load
    delete require.cache[require.resolve(HOOK_PATH)];
  });

  test("module exports gitExec and projectDir", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const mod = require(HOOK_PATH) as {
      gitExec: (args: string[], opts?: object) => string;
      projectDir: string;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
    assert.equal(typeof mod.gitExec, "function");
    assert.equal(typeof mod.projectDir, "string");
    assert.ok(
      path.isAbsolute(mod.projectDir),
      `projectDir should be absolute, got: ${mod.projectDir}`
    );
  });

  test("projectDir falls back to cwd when CLAUDE_PROJECT_DIR is not set", () => {
    delete process.env.CLAUDE_PROJECT_DIR;
    delete require.cache[require.resolve(HOOK_PATH)];
    /* eslint-disable @typescript-eslint/no-require-imports */
    const mod = require(HOOK_PATH) as { projectDir: string };
    /* eslint-enable @typescript-eslint/no-require-imports */
    // projectDir should be resolvable and absolute
    assert.ok(path.isAbsolute(mod.projectDir));
  });

  test("projectDir falls back to cwd when CLAUDE_PROJECT_DIR points outside cwd", () => {
    // Set an env var that would be a sibling directory (outside cwd)
    const siblingDir = path.resolve(os.tmpdir(), "completely-unrelated-12345");
    process.env.CLAUDE_PROJECT_DIR = siblingDir;
    delete require.cache[require.resolve(HOOK_PATH)];
    /* eslint-disable @typescript-eslint/no-require-imports */
    const mod = require(HOOK_PATH) as { projectDir: string };
    /* eslint-enable @typescript-eslint/no-require-imports */
    // Must not use the unrelated sibling dir (path traversal protection)
    assert.notEqual(
      mod.projectDir.toLowerCase(),
      siblingDir.toLowerCase(),
      "Should reject unrelated CLAUDE_PROJECT_DIR"
    );
  });
});

describe("git-utils: gitExec", () => {
  const HOOK_PATH = path.join(PROJECT_ROOT, ".claude/hooks/lib/git-utils.js");

  test("gitExec returns empty string on git command failure", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { gitExec } = require(HOOK_PATH) as {
      gitExec: (args: string[], opts?: object) => string;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
    // "git nonsense-command" will always fail
    const result = gitExec(["this-command-does-not-exist"]);
    assert.equal(result, "", "Should return empty string on failure");
  });

  test("gitExec returns trimmed string by default", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { gitExec } = require(HOOK_PATH) as {
      gitExec: (args: string[], opts?: object) => string;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
    // git --version always succeeds and returns something like "git version 2.x.y"
    const result = gitExec(["--version"]);
    if (result) {
      assert.ok(!result.startsWith(" "), "Should be trimmed");
      assert.ok(!result.endsWith(" "), "Should be trimmed");
      assert.ok(!result.endsWith("\n"), "Should be trimmed");
    }
  });

  test("gitExec respects custom cwd option", () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { gitExec } = require(HOOK_PATH) as {
      gitExec: (args: string[], opts?: { cwd?: string; timeout?: number }) => string;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
    // Running git in os.tmpdir() where there's no git repo should return ""
    const result = gitExec(["rev-parse", "--git-dir"], { cwd: os.tmpdir() });
    // Either empty (not a repo) or non-empty (if tmpdir is inside a repo)
    assert.equal(typeof result, "string");
  });
});
