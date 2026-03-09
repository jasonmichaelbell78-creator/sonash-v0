/**
 * Tests for .claude/hooks/block-push-to-main.js
 *
 * The hook reads JSON from stdin (PreToolUse Bash event) and:
 *   - Exits 0 for non-push commands
 *   - Exits 2 for pushes targeting main or master
 *   - Exits 0 for pushes to other branches
 *
 * We test the blocking logic by extracting the pattern-matching logic inline.
 * The hook itself is a process-based script; we test its core decision function.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Core pattern-matching logic extracted from the hook for unit testing
const PROTECTED_BRANCHES = ["main", "master"];

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isBlockedPush(command: string): { blocked: boolean; branch?: string } {
  if (!/\bgit\b/i.test(command) || !/\bpush\b/i.test(command)) {
    return { blocked: false };
  }

  const normalized = command.replaceAll(/#.*/g, "").replaceAll(/\s+/g, " ").trim();

  for (const branch of PROTECTED_BRANCHES) {
    const escaped = escapeRegex(branch);
    const directPattern = new RegExp(
      String.raw`\bgit\s+push\b[^|;&]*(?:\s|^)(?:refs/heads/)?${escaped}(?=\s|$)`
    );
    const refspecPattern = new RegExp(
      String.raw`\bgit\s+push\b[^|;&]*:\s*(?:refs/heads/)?${escaped}(?=\s|$)`
    );
    if (directPattern.test(normalized) || refspecPattern.test(normalized)) {
      return { blocked: true, branch };
    }
  }

  return { blocked: false };
}

describe("block-push-to-main: non-git commands", () => {
  test("allows non-git commands", () => {
    assert.equal(isBlockedPush("npm run build").blocked, false);
    assert.equal(isBlockedPush("ls -la").blocked, false);
    assert.equal(isBlockedPush("echo hello").blocked, false);
  });

  test("allows git commands that are not push", () => {
    assert.equal(isBlockedPush("git commit -m 'fix'").blocked, false);
    assert.equal(isBlockedPush("git pull origin main").blocked, false);
    assert.equal(isBlockedPush("git status").blocked, false);
  });
});

describe("block-push-to-main: push to main", () => {
  test("blocks direct push to main", () => {
    const result = isBlockedPush("git push origin main");
    assert.equal(result.blocked, true);
    assert.equal(result.branch, "main");
  });

  test("blocks direct push to master", () => {
    const result = isBlockedPush("git push origin master");
    assert.equal(result.blocked, true);
    assert.equal(result.branch, "master");
  });

  test("blocks force push to main", () => {
    const result = isBlockedPush("git push --force origin main");
    assert.equal(result.blocked, true);
  });

  test("blocks push with -f flag to main", () => {
    const result = isBlockedPush("git push -f origin main");
    assert.equal(result.blocked, true);
  });

  test("blocks refspec push HEAD:main", () => {
    const result = isBlockedPush("git push origin HEAD:main");
    assert.equal(result.blocked, true);
  });

  test("blocks refspec push HEAD:refs/heads/main", () => {
    const result = isBlockedPush("git push origin HEAD:refs/heads/main");
    assert.equal(result.blocked, true);
  });

  test("blocks push to refs/heads/main directly", () => {
    const result = isBlockedPush("git push origin refs/heads/main");
    assert.equal(result.blocked, true);
  });
});

describe("block-push-to-main: allowed pushes", () => {
  test("allows push to feature branches", () => {
    assert.equal(isBlockedPush("git push origin feature/my-feature").blocked, false);
    assert.equal(isBlockedPush("git push origin new-ecosystem").blocked, false);
    assert.equal(isBlockedPush("git push origin develop").blocked, false);
  });

  test("allows push with upstream flag to non-main branch", () => {
    assert.equal(isBlockedPush("git push -u origin feature/test").blocked, false);
  });

  test("does not block branches with main as substring", () => {
    // 'feature-main' or 'maintain' should not be blocked
    assert.equal(isBlockedPush("git push origin feature-main").blocked, false);
  });

  test("does not block push to main-branch (hyphen-separated)", () => {
    assert.equal(isBlockedPush("git push origin main-branch").blocked, false);
  });
});

describe("block-push-to-main: edge cases", () => {
  test("allows empty command", () => {
    assert.equal(isBlockedPush("").blocked, false);
  });

  test("strips comments before checking", () => {
    // Command with inline comment — the push target comes after comment removal
    const cmd = "git push origin main # deploy";
    const result = isBlockedPush(cmd);
    assert.equal(result.blocked, true, "Should still detect push to main after comment strip");
  });

  test("allows commands with pipe to push unrelated commands", () => {
    // Pipe-separated: the pattern only inspects before | or ; or &
    const cmd = "echo 'main' | git push origin feature/test";
    // The regex looks for 'git push' followed by the branch, not arbitrary string
    const result = isBlockedPush(cmd);
    // 'main' appears but is not the push target
    assert.equal(result.blocked, false);
  });
});
