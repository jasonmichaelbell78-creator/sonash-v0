#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * session-end-reminder.js - UserPromptSubmit hook for session ending
 *
 * Reminds to run /session-end when user indicates they're done.
 * Non-blocking: outputs reminder but doesn't fail the operation.
 *
 * From HOOKIFY_STRATEGY.md #13: Session End Reminder
 * - Trigger: User says "done", "finished", "that's all", etc.
 * - Action: PROMPT (not block)
 * - Time Cost: +5ms per user message
 */

// Parse arguments - for UserPromptSubmit, this is the user's message
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract user prompt from JSON
let userPrompt = "";
try {
  const parsed = JSON.parse(arg);
  userPrompt = parsed.prompt || parsed.message || parsed.content || "";
} catch {
  // If not JSON, treat as direct message
  userPrompt = arg;
}

if (!userPrompt || typeof userPrompt !== "string") {
  console.log("ok");
  process.exit(0);
}

// Normalize for matching
const normalizedPrompt = userPrompt.toLowerCase().trim();

// Patterns that indicate session might be ending
const END_PATTERNS = [
  // Explicit ending phrases
  /^(?:that'?s?\s+)?(?:all|it)\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
  /^(?:i'?m\s+)?done\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
  /^(?:i'?m\s+)?finished\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
  /^(?:we'?re\s+)?done\s*(?:here)?\s*[.!]?$/i,
  /^(?:let'?s?\s+)?(?:stop|end|wrap\s*up)\s*(?:here|now|for\s+today)?\s*[.!]?$/i,
  /^(?:that'?s?\s+)?(?:enough|good)\s+for\s+(?:now|today)\s*[.!]?$/i,
  /^(?:i'?m\s+)?(?:signing|logging)\s*off\s*[.!]?$/i,
  /^(?:good)?bye\s*[.!]?$/i,
  /^thanks?,?\s*(?:that'?s?\s+)?(?:all|it)\s*[.!]?$/i,
  /^(?:ok|okay|great),?\s*(?:that'?s?\s+)?(?:all|it|enough)\s*[.!]?$/i,

  // Contextual phrases (more lenient)
  /^(?:i\s+)?(?:think\s+)?we'?re\s+(?:good|done)\s*[.!]?$/i,
  /^nothing\s+(?:else|more)\s*[.!]?$/i,
  /^no(?:pe|thing)?\s*(?:,?\s*(?:that'?s?\s+)?(?:all|it))?\s*[.!]?$/i,
];

// Check if message matches any end pattern
const isEndingSession = END_PATTERNS.some((pattern) => pattern.test(normalizedPrompt));

// Also check for short "thanks" messages that might indicate wrapping up
const isThanksOnly =
  /^(?:thanks?|thx|ty|thank\s+you)\s*[!.]?$/i.test(normalizedPrompt) &&
  normalizedPrompt.length < 15;

if (isEndingSession || isThanksOnly) {
  console.error("");
  console.error("\ud83d\udccb  SESSION ENDING?");
  console.error("\u2501".repeat(20));
  console.error("If you're wrapping up, consider running /session-end");
  console.error("");
  console.error("The session-end checklist helps:");
  console.error("  \u2714 Update SESSION_CONTEXT.md with progress");
  console.error("  \u2714 Commit uncommitted changes");
  console.error("  \u2714 Check for pending PR reviews");
  console.error("  \u2714 Document any decisions made");
  console.error("");
  console.error("Just say 'continue' if you have more work to do!");
  console.error("\u2501".repeat(20));
}

// Always succeed
console.log("ok");
process.exit(0);
