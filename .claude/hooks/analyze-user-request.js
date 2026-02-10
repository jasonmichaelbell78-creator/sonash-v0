#!/usr/bin/env node
/* global process, console */
/* eslint-disable security/detect-non-literal-regexp */
/**
 * analyze-user-request.js - UserPromptSubmit hook for routing user requests
 * Cross-platform replacement for analyze-user-request.sh
 *
 * v2.0 - Tightened matching to reduce false positives
 *
 * Changes from v1:
 * - Broad single-word triggers (fix, issue, test, form, find, etc.) now require
 *   compound patterns (e.g., "fix bug" not just "fix")
 * - Low-confidence matches output to stderr (user-visible, not context-consuming)
 * - High-confidence matches remain on stdout (injected into AI context)
 *
 * Priority order:
 * 1. Security (HIGHEST - "fix auth bug" should trigger security, not debugging)
 * 2. Bug/Error/Debugging
 * 3. Database
 * 4. UI/Frontend
 * 5. Planning/Architecture
 * 6. Exploration/Understanding
 * 7. Testing
 */

// Get user request from arguments (trim to handle whitespace)
let userRequest = (process.argv[2] || "").trim();

// Try to parse as JSON if it looks like JSON
if (userRequest.startsWith("{")) {
  try {
    const parsed = JSON.parse(userRequest);
    userRequest = parsed.prompt || parsed.request || parsed.message || "";
  } catch {
    // Not JSON, use as-is
  }
}

if (!userRequest) {
  console.log("ok");
  process.exit(0);
}

// Truncate long input
const MAX_LENGTH = 2000;
if (userRequest.length > MAX_LENGTH) {
  userRequest = userRequest.slice(0, MAX_LENGTH);
}

const requestLower = userRequest.toLowerCase();

// Helper for word boundary matching (escapes regex special chars to prevent ReDoS)
// Supports ".?" convention for optional separator (e.g., api.?key matches apikey, api-key, api_key)
function matchesWord(pattern) {
  // Split on ".?" to preserve wildcard semantics, escape each part, then rejoin with optional separator
  const parts = pattern.split(".?").map((part) => part.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const joined = parts.join("[^a-z0-9]?");
  const regex = new RegExp(`(^|[^a-z0-9])(${joined})([^a-z0-9]|$)`, "i");
  return regex.test(requestLower);
}

// Helper for multi-word phrase matching
function matchesPhrase(phrase) {
  return requestLower.includes(phrase.toLowerCase());
}

// Output to stdout (context-consuming) for high-confidence matches
function directiveStdout(msg) {
  console.log(msg);
  process.exit(0);
}

// Output to stderr (user-visible only) for low-confidence matches
function suggestStderr(msg) {
  process.stderr.write(msg + "\n");
  console.log("ok");
  process.exit(0);
}

// Priority 1: SECURITY (HIGHEST)
// High confidence: specific security terms
const securityStrong = [
  "security",
  "authentication",
  "authorization",
  "password",
  "credential",
  "oauth",
  "jwt",
  "encrypt",
  "decrypt",
  "api.?key",
  "access.?control",
  "vulnerability",
  "xss",
  "injection",
];
for (const pattern of securityStrong) {
  if (matchesWord(pattern)) {
    directiveStdout("PRE-TASK: MUST use security-auditor agent");
  }
}
// Low confidence: broad words that could be security but often aren't
const securityWeak = ["auth", "token", "secret", "permission"];
for (const pattern of securityWeak) {
  if (matchesWord(pattern)) {
    // Only trigger if combined with security-adjacent context
    if (
      matchesWord("security") ||
      matchesWord("login") ||
      matchesWord("protect") ||
      matchesWord("attack") ||
      matchesWord("hack")
    ) {
      directiveStdout("PRE-TASK: MUST use security-auditor agent");
    }
    suggestStderr("Hint: If this is security-related, consider using security-auditor agent");
  }
}

// Priority 2: Bug/Error/Debugging
// High confidence: specific debugging terms
const bugStrong = ["bug", "broken", "not.?working", "crash", "debug", "stack.?trace", "exception"];
for (const pattern of bugStrong) {
  if (matchesWord(pattern)) {
    directiveStdout("PRE-TASK: MUST use systematic-debugging skill FIRST");
  }
}
// Low confidence: "fix", "error", "fail", "issue", "problem" are too broad alone
// Require compound: "fix bug", "fix error", "fix issue", "failing test", etc.
if (
  matchesPhrase("fix bug") ||
  matchesPhrase("fix error") ||
  matchesPhrase("fix crash") ||
  matchesPhrase("fix issue") ||
  matchesPhrase("fix problem") ||
  matchesPhrase("error message") ||
  matchesPhrase("failing test") ||
  matchesPhrase("test failure") ||
  matchesPhrase("test fail")
) {
  directiveStdout("PRE-TASK: MUST use systematic-debugging skill FIRST");
}

// Priority 3: Database
const dbStrong = ["database", "migration", "sql", "postgres", "mysql", "mongodb"];
for (const pattern of dbStrong) {
  if (matchesWord(pattern)) {
    directiveStdout("PRE-TASK: MUST use database-architect agent");
  }
}
// "query", "schema", "firestore" need context
if (
  matchesWord("firestore") &&
  (matchesWord("query") || matchesWord("rule") || matchesWord("index") || matchesWord("schema"))
) {
  directiveStdout("PRE-TASK: MUST use database-architect agent");
}

// Priority 4: UI/Frontend
// High confidence: clearly UI-focused terms
const uiStrong = ["frontend", "css", "styling", "layout", "responsive", "tailwind"];
for (const pattern of uiStrong) {
  if (matchesWord(pattern)) {
    directiveStdout("PRE-TASK: MUST use frontend-design skill");
  }
}
// "component", "form", "button", "design", "react", "ui" need context
if (
  (matchesWord("component") || matchesWord("button") || matchesWord("form")) &&
  (matchesWord("create") ||
    matchesWord("build") ||
    matchesWord("add") ||
    matchesWord("new") ||
    matchesWord("style") ||
    matchesWord("design"))
) {
  directiveStdout("PRE-TASK: MUST use frontend-design skill");
}

// Priority 5: Planning/Architecture
const planStrong = ["architect", "implement.?feature", "add.?feature", "new.?feature"];
for (const pattern of planStrong) {
  if (matchesWord(pattern)) {
    suggestStderr("Hint: Consider using Plan agent for multi-step work");
  }
}

// Priority 6: Exploration/Understanding
// Only trigger on explicit exploration phrases, not broad "find" or "what is"
if (
  matchesPhrase("explore the") ||
  matchesPhrase("explore this") ||
  matchesPhrase("understand how") ||
  matchesPhrase("how does this") ||
  matchesPhrase("walk me through") ||
  matchesPhrase("explain the code")
) {
  suggestStderr("Hint: Consider using Explore agent for codebase exploration");
}

// Priority 7: Testing
// Only trigger on explicit testing intent, not bare "test"
if (
  matchesPhrase("write test") ||
  matchesPhrase("add test") ||
  matchesPhrase("test coverage") ||
  matchesPhrase("run test") ||
  matchesPhrase("testing strategy") ||
  matchesWord("jest") ||
  matchesWord("cypress") ||
  matchesWord("playwright")
) {
  suggestStderr("Hint: Consider using test-engineer agent");
}

console.log("ok");
