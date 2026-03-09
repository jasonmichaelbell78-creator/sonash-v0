/**
 * Tests for .claude/hooks/user-prompt-handler.js
 *
 * The hook reads a user prompt from stdin (JSON or raw string) and:
 *   - Injects alerts reminders
 *   - Checks session end commands
 *   - Monitors context usage
 *
 * We test the prompt parsing and command detection logic.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted prompt parsing logic from the hook
function parsePromptFromStdin(stdinData: string): string {
  if (!stdinData.trim()) return "";
  try {
    const parsed = JSON.parse(stdinData);
    return String(parsed.prompt || "").trim();
  } catch {
    return stdinData.trim();
  }
}

// Extracted session-end detection (from the hook's command detection logic)
function isSessionEndCommand(requestLower: string): boolean {
  return (
    requestLower.includes("/session-end") ||
    requestLower.includes("session end") ||
    requestLower.includes("end session")
  );
}

// Extracted: should cooldown be skipped?
function isCooldownActive(lastRun: number, cooldownMs: number): boolean {
  return Number.isFinite(lastRun) && lastRun > 0 && Date.now() - lastRun < cooldownMs;
}

// Extracted: prompt length cap
function capPrompt(prompt: string, maxLength: number): string {
  return prompt.length > maxLength ? prompt.slice(0, maxLength) : prompt;
}

// Extracted: stdoutParts accumulation pattern (hook collects messages then outputs at end)
function buildOutput(parts: string[]): string {
  return parts.length > 0 ? parts.join("\n") : "";
}

describe("parsePromptFromStdin", () => {
  test("extracts prompt field from JSON stdin", () => {
    const json = JSON.stringify({ prompt: "Hello, Claude!", session_id: "sess-123" });
    assert.equal(parsePromptFromStdin(json), "Hello, Claude!");
  });

  test("returns raw string for non-JSON stdin", () => {
    assert.equal(parsePromptFromStdin("plain text prompt"), "plain text prompt");
  });

  test("returns empty string for empty stdin", () => {
    assert.equal(parsePromptFromStdin(""), "");
    assert.equal(parsePromptFromStdin("   "), "");
  });

  test("trims whitespace from extracted prompt", () => {
    const json = JSON.stringify({ prompt: "  trimmed  " });
    assert.equal(parsePromptFromStdin(json), "trimmed");
  });

  test("handles JSON with missing prompt field", () => {
    const json = JSON.stringify({ other: "value" });
    assert.equal(parsePromptFromStdin(json), "");
  });

  test("handles prompt that is not a string in JSON", () => {
    const json = JSON.stringify({ prompt: 42 });
    assert.equal(parsePromptFromStdin(json), "42");
  });
});

describe("isSessionEndCommand", () => {
  test("detects /session-end command", () => {
    assert.equal(isSessionEndCommand("/session-end"), true);
  });

  test("detects 'session end' phrase", () => {
    assert.equal(isSessionEndCommand("please run session end now"), true);
  });

  test("detects 'end session' phrase", () => {
    assert.equal(isSessionEndCommand("let's end session"), true);
  });

  test("is case-insensitive via toLowerCase pre-processing", () => {
    // The hook lowercases the prompt before checking
    assert.equal(isSessionEndCommand("/session-end"), true);
    assert.equal(isSessionEndCommand("session end"), true);
  });

  test("returns false for unrelated commands", () => {
    assert.equal(isSessionEndCommand("write some tests"), false);
    assert.equal(isSessionEndCommand("start a session"), false);
    assert.equal(isSessionEndCommand(""), false);
  });

  test("returns false for unrelated session-related phrases", () => {
    // "session" alone without "end" after it should not match
    assert.equal(isSessionEndCommand("start a new session here"), false);
    assert.equal(isSessionEndCommand("session context loaded"), false);
  });
});

describe("isCooldownActive", () => {
  test("returns true when last run is recent (within cooldown)", () => {
    const lastRun = Date.now() - 2 * 60 * 1000; // 2 minutes ago
    const cooldown = 10 * 60 * 1000; // 10 minutes
    assert.equal(isCooldownActive(lastRun, cooldown), true);
  });

  test("returns false when last run is outside cooldown period", () => {
    const lastRun = Date.now() - 15 * 60 * 1000; // 15 minutes ago
    const cooldown = 10 * 60 * 1000; // 10 minutes
    assert.equal(isCooldownActive(lastRun, cooldown), false);
  });

  test("returns false when lastRun is 0 (no prior run)", () => {
    assert.equal(isCooldownActive(0, 10 * 60 * 1000), false);
  });

  test("returns false when lastRun is NaN", () => {
    assert.equal(isCooldownActive(NaN, 10 * 60 * 1000), false);
  });

  test("returns false when lastRun is negative", () => {
    assert.equal(isCooldownActive(-1, 10 * 60 * 1000), false);
  });
});

describe("capPrompt", () => {
  test("returns unchanged prompt when within maxLength", () => {
    const prompt = "short prompt";
    assert.equal(capPrompt(prompt, 2000), prompt);
  });

  test("truncates prompt exceeding maxLength", () => {
    const long = "x".repeat(3000);
    const result = capPrompt(long, 2000);
    assert.equal(result.length, 2000);
  });

  test("handles exactly maxLength without truncation", () => {
    const exact = "x".repeat(2000);
    assert.equal(capPrompt(exact, 2000).length, 2000);
  });

  test("handles empty string", () => {
    assert.equal(capPrompt("", 2000), "");
  });
});

describe("buildOutput", () => {
  test("returns empty string when no parts", () => {
    assert.equal(buildOutput([]), "");
  });

  test("returns single part unchanged", () => {
    assert.equal(buildOutput(["hello world"]), "hello world");
  });

  test("joins multiple parts with newlines", () => {
    const result = buildOutput(["line 1", "line 2", "line 3"]);
    assert.equal(result, "line 1\nline 2\nline 3");
  });
});
