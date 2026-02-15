#!/usr/bin/env node
/* global process, console, require, __dirname */
/* eslint-disable security/detect-non-literal-regexp, @typescript-eslint/no-require-imports */
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

const fs = require("node:fs");
const path = require("node:path");
const { isSafeToWrite } = require("./lib/symlink-guard");

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

// Directive dedup state (15-min TTL)
const DIRECTIVE_STATE = path.join(__dirname, ".directive-dedup.json");

function wasRecentlyDirected(directive) {
  try {
    const data = JSON.parse(fs.readFileSync(DIRECTIVE_STATE, "utf8"));
    const entry = data[directive];
    if (entry && Date.now() - entry < 15 * 60 * 1000) return true;
  } catch {
    /* no state */
  }
  return false;
}

function recordDirective(directive) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(DIRECTIVE_STATE, "utf8"));
  } catch {
    /* start fresh */
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
  data[directive] = Date.now();

  // Purge stale entries older than 24h (Review #289)
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const key of Object.keys(data)) {
    const ts = Number(data[key]);
    if (!Number.isFinite(ts) || now - ts > DAY_MS) delete data[key];
  }

  const tmpPath = `${DIRECTIVE_STATE}.tmp`;
  try {
    if (!isSafeToWrite(DIRECTIVE_STATE)) return;
    fs.mkdirSync(path.dirname(DIRECTIVE_STATE), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data), "utf-8");
    try {
      fs.rmSync(DIRECTIVE_STATE, { force: true });
    } catch {
      /* best-effort */
    }
    fs.renameSync(tmpPath, DIRECTIVE_STATE);
  } catch {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      /* cleanup */
    }
  }
}

// Helper for word boundary matching (escapes regex special chars to prevent ReDoS)
// Supports ".?" convention for optional separator (e.g., api.?key matches apikey, api-key, api_key)
function matchesWord(pattern) {
  // Split on ".?" to preserve wildcard semantics, escape each part, then rejoin with optional separator
  const parts = pattern.split(".?").map((part) => part.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const joined = parts.join("[^a-z0-9]?");
  const regex = new RegExp(`(^|[^a-z0-9])(${joined})([^a-z0-9]|$)`, "i");
  return regex.test(requestLower);
}

// Helper for multi-word phrase matching with word boundaries
// Tokenizes phrase and allows varied spacing/punctuation between words
function matchesPhrase(phrase) {
  const tokens = String(phrase)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

  if (tokens.length === 0) return false;

  const joined = tokens.join("[^a-z0-9]+");
  const regex = new RegExp(`(^|[^a-z0-9])(${joined})([^a-z0-9]|$)`, "i");
  return regex.test(requestLower);
}

// Output to stdout (context-consuming) for high-confidence matches
function directiveStdout(msg) {
  if (wasRecentlyDirected(msg)) {
    console.log("ok");
    process.exit(0); // Skip — already directed recently
  }
  recordDirective(msg);
  console.log(msg);
  process.exit(0);
}

// Output to stderr (user-visible only) for low-confidence matches
// Does NOT exit — allows lower-priority categories to still be checked
function suggestStderr(msg) {
  process.stderr.write(msg + "\n");
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
let hasSecurityWeakMatch = false;
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
    hasSecurityWeakMatch = true;
  }
}
if (hasSecurityWeakMatch) {
  suggestStderr("Hint: If this is security-related, consider using security-auditor agent");
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
