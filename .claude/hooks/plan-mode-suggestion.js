#!/usr/bin/env node
/* global process, console */
/**
 * plan-mode-suggestion.js - UserPromptSubmit hook for complex task detection
 *
 * Suggests entering Plan mode when detecting complex multi-step tasks.
 * Non-blocking: outputs suggestion but doesn't fail the operation.
 *
 * From HOOKIFY_STRATEGY.md #15: Plan Mode Suggestion
 * - Trigger: User request contains implementation keywords AND complexity indicators
 * - Action: SUGGEST (not block)
 * - Time Cost: +80ms per user message
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

// Skip very short messages (questions, acknowledgments)
if (userPrompt.length < 30) {
  console.log("ok");
  process.exit(0);
}

// Normalize for matching
const normalizedPrompt = userPrompt.toLowerCase();

// Implementation keywords that suggest substantial work
const IMPLEMENTATION_KEYWORDS = [
  "implement",
  "create",
  "build",
  "develop",
  "add feature",
  "add a feature",
  "new feature",
  "refactor",
  "redesign",
  "rewrite",
  "migrate",
  "integrate",
  "set up",
  "setup",
  "configure",
  "architect",
];

// Complexity indicators that suggest multi-step work
const COMPLEXITY_INDICATORS = [
  // Multiple items
  /\band\b.*\band\b/i, // "X and Y and Z"
  /,\s*[^,]+,\s*[^,]+/i, // Multiple commas (listing items like "A, B, and C")
  /\d+\.\s+.*\d+\.\s+/, // Numbered list "1. ... 2. ..."
  /-\s+.*-\s+/, // Bulleted list "- ... - ..."

  // Scope indicators (allow optional words like "entire", "whole", etc.)
  /across\s+(?:the\s+)?(?:\w+\s+)?(?:codebase|project|app|application|system)/i,
  /throughout\s+(?:the\s+)?(?:\w+\s+)?(?:codebase|project|app|application|system)/i,
  /multiple\s+(?:\w+\s+)?(?:files|components|modules|services|pages)/i,
  /several\s+(?:\w+\s+)?(?:files|components|modules|services|pages)/i,
  /all\s+(?:the\s+)?(?:\w+\s+)?(?:files|components|modules|services|pages)/i,

  // Architecture keywords
  /database\s+schema/i,
  /api\s+(?:design|architecture|endpoints)/i,
  /system\s+(?:design|architecture)/i,
  /full.?stack/i,
  /end.?to.?end/i,
  /from\s+scratch/i,
  /authentication\s+system/i,
  /oauth|sso|multi.?factor/i,

  // Process keywords
  /step\s+by\s+step/i,
  /phase\s*\d/i,
  /first.*then.*finally/i,
  /start\s+with.*move\s+on\s+to/i,
];

// Check for implementation keywords
const hasImplementationKeyword = IMPLEMENTATION_KEYWORDS.some((keyword) =>
  normalizedPrompt.includes(keyword)
);

// Check for complexity indicators
const complexityMatches = COMPLEXITY_INDICATORS.filter((pattern) => pattern.test(userPrompt));
const hasComplexityIndicator = complexityMatches.length > 0;

// Word count as additional complexity signal
const wordCount = userPrompt.split(/\s+/).length;
const isLongRequest = wordCount > 50;

// Determine if we should suggest plan mode
// Criteria: implementation keyword + (complexity indicator OR long request)
const shouldSuggest = hasImplementationKeyword && (hasComplexityIndicator || isLongRequest);

// Skip if this looks like a simple single-file change
const SIMPLE_PATTERNS = [
  /^(?:just\s+)?(?:fix|update|change|modify)\s+(?:the\s+)?(?:one|single|this)/i,
  /^(?:can\s+you\s+)?(?:quickly|just)\s+/i,
  /^(?:small|minor|quick)\s+(?:fix|change|update)/i,
];

const isSimpleRequest = SIMPLE_PATTERNS.some((pattern) => pattern.test(userPrompt));

if (shouldSuggest && !isSimpleRequest) {
  console.error("");
  console.error("\ud83d\udcdd  MULTI-STEP TASK DETECTED");
  console.error("\u2501".repeat(28));
  console.error("This looks like a complex task that might benefit from");
  console.error("planning before implementation.");
  console.error("");
  console.error("Options:");
  console.error("  \u2022 Plan mode - Quick planning (2-3 questions, then plan)");
  console.error("  \u2022 /deep-plan - Exhaustive discovery (10-25 questions,");
  console.error("    decision record, then detailed plan with approval gate)");
  console.error("");

  // Show what triggered the suggestion
  if (complexityMatches.length > 0) {
    console.error("Complexity detected: multiple items or broad scope");
  }
  if (isLongRequest) {
    console.error(`Request length: ${wordCount} words (suggests multiple steps)`);
  }

  console.error("");
  console.error('Say "continue without plan" to proceed directly.');
  console.error('Say "/deep-plan" for thorough discovery-first planning.');
  console.error("\u2501".repeat(28));
}

// Always succeed
console.log("ok");
process.exit(0);
