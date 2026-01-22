#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * decision-save-prompt.js - PostToolUse hook for decision documentation
 *
 * Prompts to save important decisions when presenting multiple options.
 * Non-blocking: outputs reminder but doesn't fail the operation.
 *
 * From HOOKIFY_STRATEGY.md #7: SESSION_DECISIONS Auto-Save Prompt
 * - Trigger: AskUserQuestion with 3+ questions OR 3+ options
 * - Action: PROMPT (not block)
 * - Time Cost: +10ms per AskUserQuestion
 */

// Parse arguments
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract questions from JSON
let questions = [];
try {
  const parsed = JSON.parse(arg);
  questions = parsed.questions || [];
} catch {
  console.log("ok");
  process.exit(0);
}

if (!Array.isArray(questions) || questions.length === 0) {
  console.log("ok");
  process.exit(0);
}

// Keywords that indicate significant decisions worth documenting
const SIGNIFICANT_KEYWORDS = [
  "architecture",
  "design",
  "approach",
  "implement",
  "strategy",
  "pattern",
  "framework",
  "database",
  "api",
  "security",
  "authentication",
  "authorization",
  "migration",
  "refactor",
  "structure",
  "technology",
  "library",
  "dependency",
];

// Check if any question is significant (contains important keywords)
function isSignificantDecision(question) {
  const questionText = (question.question || "").toLowerCase();
  const header = (question.header || "").toLowerCase();
  const combined = `${questionText} ${header}`;

  return SIGNIFICANT_KEYWORDS.some((keyword) => combined.includes(keyword));
}

// Count total options across all questions
let totalOptions = 0;
let hasSignificantQuestion = false;

for (const question of questions) {
  if (Array.isArray(question.options)) {
    totalOptions += question.options.length;
  }
  if (isSignificantDecision(question)) {
    hasSignificantQuestion = true;
  }
}

// Determine if we should prompt
// Criteria: 3+ questions OR 3+ total options AND at least one significant keyword
const hasMultipleQuestions = questions.length >= 3;
const hasMultipleOptions = totalOptions >= 3;
const shouldPrompt = (hasMultipleQuestions || hasMultipleOptions) && hasSignificantQuestion;

if (shouldPrompt) {
  console.error("");
  console.error("\ud83d\udcdd  DECISION DOCUMENTATION REMINDER");
  console.error("\u2501".repeat(35));
  console.error("Multi-option decision detected. Consider documenting in:");
  console.error("  docs/SESSION_DECISIONS.md");
  console.error("");
  console.error("Template:");
  console.error("  ## Decision: [Topic]");
  console.error("  **Date**: YYYY-MM-DD | **Session**: #XX");
  console.error("  **Options Considered**: 1. ... 2. ... 3. ...");
  console.error("  **Decision**: [Chosen option]");
  console.error("  **Rationale**: [Why this choice]");
  console.error("");
  console.error("See: CLAUDE.md Section 7 for decision documentation policy");
  console.error("\u2501".repeat(35));
}

// Always succeed
console.log("ok");
process.exit(0);
