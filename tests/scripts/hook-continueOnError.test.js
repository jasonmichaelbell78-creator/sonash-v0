/**
 * Hook continueOnError regression test
 *
 * Validates that non-critical SessionStart hooks have continueOnError: true
 * to prevent brittle session startup. Critical hooks (session-start.js,
 * compact-restore.js) must NOT have continueOnError.
 *
 * Source: PR #423 retro — 5 hooks had continueOnError removed, blocking sessions.
 */

import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Hooks that MUST have continueOnError: true (non-critical, optional checks)
const NON_CRITICAL_HOOKS = [
  "check-mcp-servers.js",
  "check-remote-session-context.js",
  "stop-serena-dashboard.js",
  "gsd-check-update.js",
];

// Hooks that MUST NOT have continueOnError (critical path)
const CRITICAL_HOOKS = ["session-start.js", "compact-restore.js"];

describe("Hook continueOnError configuration", () => {
  const settingsPath = ".claude/settings.json";
  let settings;

  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    // If settings file doesn't exist, skip gracefully
    settings = null;
  }

  it("settings.json is parseable", () => {
    assert.ok(settings, "Failed to parse .claude/settings.json");
  });

  it("non-critical SessionStart hooks have continueOnError: true", () => {
    if (!settings) return;
    const sessionStartGroups = settings.hooks?.SessionStart || [];
    const allHooks = sessionStartGroups.flatMap((g) => g.hooks || []);

    for (const hookName of NON_CRITICAL_HOOKS) {
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
    const sessionStartGroups = settings.hooks?.SessionStart || [];
    const allHooks = sessionStartGroups.flatMap((g) => g.hooks || []);

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
});
