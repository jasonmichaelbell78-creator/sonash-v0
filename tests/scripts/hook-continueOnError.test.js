/**
 * Hook continueOnError regression test
 *
 * Validates that non-critical hooks have continueOnError: true
 * to prevent brittle session startup and tool use. Critical hooks
 * (session-start.js, compact-restore.js) must NOT have continueOnError.
 *
 * Source: PR #423 retro — 5 hooks had continueOnError removed, blocking sessions.
 * Enhanced: PR #428 retro — extended to cover PostToolUse non-critical hooks.
 */

import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// SessionStart hooks that MUST have continueOnError: true (non-critical, optional checks)
const NON_CRITICAL_SESSION_HOOKS = [
  "check-mcp-servers.js",
  "check-remote-session-context.js",
  "stop-serena-dashboard.js",
  "gsd-check-update.js",
];

// PostToolUse hooks that MUST have continueOnError: true (non-critical tracking)
const NON_CRITICAL_POSTTOOL_HOOKS = ["commit-tracker.js"];

// Hooks that MUST NOT have continueOnError (critical path)
const CRITICAL_HOOKS = ["session-start.js", "compact-restore.js"];

// PostToolUse hooks that MUST NOT have continueOnError (critical validation)
const CRITICAL_POSTTOOL_HOOKS = ["post-write-validator.js", "block-push-to-main.js"];

describe("Hook continueOnError configuration", () => {
  const settingsPath = ".claude/settings.json";
  let settings;

  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    // If settings file doesn't exist, skip gracefully
    settings = null;
  }

  /** Flatten all hooks from a hook group array */
  function flattenHooks(groups) {
    return (groups || []).flatMap((g) => g.hooks || []);
  }

  it("settings.json is parseable", () => {
    assert.ok(settings, "Failed to parse .claude/settings.json");
  });

  it("non-critical SessionStart hooks have continueOnError: true", () => {
    if (!settings) return;
    const allHooks = flattenHooks(settings.hooks?.SessionStart);

    for (const hookName of NON_CRITICAL_SESSION_HOOKS) {
      const hook = allHooks.find((h) => h.command?.includes(hookName));
      assert.ok(hook, `Non-critical hook ${hookName} not found in SessionStart`);
      assert.strictEqual(
        hook.continueOnError,
        true,
        `${hookName} must have continueOnError: true — removing it causes brittle session startup (PR #423 regression)`
      );
    }
  });

  it("critical SessionStart hooks do NOT have continueOnError", () => {
    if (!settings) return;
    const allHooks = flattenHooks(settings.hooks?.SessionStart);

    for (const hookName of CRITICAL_HOOKS) {
      const hook = allHooks.find((h) => h.command?.includes(hookName));
      if (!hook) continue; // Hook may not exist in all configurations
      assert.notStrictEqual(
        hook.continueOnError,
        true,
        `${hookName} is critical and must NOT have continueOnError: true`
      );
    }
  });

  it("non-critical PostToolUse hooks have continueOnError: true", () => {
    if (!settings) return;
    const allHooks = flattenHooks(settings.hooks?.PostToolUse);

    for (const hookName of NON_CRITICAL_POSTTOOL_HOOKS) {
      const hook = allHooks.find((h) => h.command?.includes(hookName));
      if (!hook) continue; // Hook may not be configured
      assert.strictEqual(
        hook.continueOnError,
        true,
        `PostToolUse ${hookName} must have continueOnError: true — it is non-critical tracking`
      );
    }
  });

  it("critical PostToolUse hooks do NOT have continueOnError", () => {
    if (!settings) return;
    const allHooks = flattenHooks(settings.hooks?.PostToolUse);

    for (const hookName of CRITICAL_POSTTOOL_HOOKS) {
      const hook = allHooks.find((h) => h.command?.includes(hookName));
      if (!hook) continue; // Hook may not be configured
      assert.notStrictEqual(
        hook.continueOnError,
        true,
        `PostToolUse ${hookName} is critical and must NOT have continueOnError: true`
      );
    }
  });

  it("every hook with continueOnError is in a known non-critical list", () => {
    if (!settings) return;
    const allKnownNonCritical = [...NON_CRITICAL_SESSION_HOOKS, ...NON_CRITICAL_POSTTOOL_HOOKS];

    // Check all hook groups for unexpected continueOnError usage
    for (const [groupName, groups] of Object.entries(settings.hooks || {})) {
      if (!Array.isArray(groups)) continue;
      const allHooks = flattenHooks(groups);
      for (const hook of allHooks) {
        if (hook.continueOnError === true) {
          const hookFile = allKnownNonCritical.find((name) => hook.command?.includes(name));
          assert.ok(
            hookFile,
            `Unknown hook in ${groupName} has continueOnError: true — add to non-critical list or remove flag. Command: ${hook.command}`
          );
        }
      }
    }
  });
});
