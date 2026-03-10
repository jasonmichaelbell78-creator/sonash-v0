/**
 * Tests for .claude/hooks/decision-save-prompt.js
 *
 * The hook receives JSON argv[2] with a `questions` array.
 * It outputs a reminder to stderr when significant decisions with 3+ options
 * or 3+ questions are detected. Always exits 0.
 *
 * We test the decision logic inline by extracting the core functions.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing
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

interface Question {
  question?: string;
  header?: string;
  options?: string[];
}

function isSignificantDecision(question: Question): boolean {
  const questionText = (question.question || "").toLowerCase();
  const header = (question.header || "").toLowerCase();
  const combined = `${questionText} ${header}`;
  return SIGNIFICANT_KEYWORDS.some((keyword) => combined.includes(keyword));
}

function shouldPrompt(questions: Question[]): boolean {
  if (!Array.isArray(questions) || questions.length === 0) return false;

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

  const hasMultipleQuestions = questions.length >= 3;
  const hasMultipleOptions = totalOptions >= 3;
  return (hasMultipleQuestions || hasMultipleOptions) && hasSignificantQuestion;
}

describe("isSignificantDecision", () => {
  test("returns true when question text contains significant keyword", () => {
    assert.equal(isSignificantDecision({ question: "Which database should we use?" }), true);
    assert.equal(isSignificantDecision({ question: "Choose the authentication strategy" }), true);
    assert.equal(isSignificantDecision({ question: "Select the API framework" }), true);
  });

  test("returns true when header contains significant keyword", () => {
    assert.equal(
      isSignificantDecision({ header: "Architecture Decision", question: "Pick one" }),
      true
    );
    assert.equal(isSignificantDecision({ header: "Security approach" }), true);
  });

  test("returns false for non-significant questions", () => {
    assert.equal(isSignificantDecision({ question: "What color should the button be?" }), false);
    assert.equal(isSignificantDecision({ question: "Continue or stop?" }), false);
    assert.equal(isSignificantDecision({}), false);
  });

  test("is case-insensitive", () => {
    assert.equal(isSignificantDecision({ question: "DATABASE migration plan" }), true);
    assert.equal(isSignificantDecision({ question: "AUTHENTICATION method" }), true);
  });
});

describe("shouldPrompt: no prompt cases", () => {
  test("returns false for empty questions array", () => {
    assert.equal(shouldPrompt([]), false);
  });

  test("returns false when fewer than 3 questions and fewer than 3 total options", () => {
    const questions: Question[] = [{ question: "Architecture choice?", options: ["A", "B"] }];
    assert.equal(shouldPrompt(questions), false);
  });

  test("returns false when 3+ options but no significant keyword", () => {
    const questions: Question[] = [{ question: "Pick a color", options: ["red", "green", "blue"] }];
    assert.equal(shouldPrompt(questions), false);
  });

  test("returns false when 3+ questions but no significant keyword", () => {
    const questions: Question[] = [
      { question: "Option A?" },
      { question: "Option B?" },
      { question: "Option C?" },
    ];
    assert.equal(shouldPrompt(questions), false);
  });
});

describe("shouldPrompt: prompt triggered cases", () => {
  test("returns true for 3+ total options with a significant keyword", () => {
    const questions: Question[] = [
      { question: "Which database to use?", options: ["PostgreSQL", "MySQL", "MongoDB"] },
    ];
    assert.equal(shouldPrompt(questions), true);
  });

  test("returns true for 3+ questions with at least one significant", () => {
    const questions: Question[] = [
      { question: "Use TypeScript?" },
      { question: "Which architecture pattern?" },
      { question: "Prefer monorepo?" },
    ];
    assert.equal(shouldPrompt(questions), true);
  });

  test("returns true for mixed: security question with 3+ options", () => {
    const questions: Question[] = [
      {
        question: "Authentication approach",
        options: ["JWT", "Session", "OAuth"],
      },
    ];
    assert.equal(shouldPrompt(questions), true);
  });

  test("returns true when options spread across multiple questions sum to 3+", () => {
    const questions: Question[] = [
      { question: "API design", options: ["REST", "GraphQL"] },
      { question: "Database", options: ["Postgres"] },
    ];
    // total options = 3, significant keyword present
    assert.equal(shouldPrompt(questions), true);
  });
});

describe("shouldPrompt: edge cases", () => {
  test("handles questions without options field", () => {
    const questions: Question[] = [
      { question: "Architecture?" },
      { question: "Strategy?" },
      { question: "Pattern?" },
    ];
    // 3 questions, one significant — should prompt
    assert.equal(shouldPrompt(questions), true);
  });

  test("handles questions with empty options array", () => {
    const questions: Question[] = [{ question: "Security consideration", options: [] }];
    // 0 options, 1 question — should NOT prompt
    assert.equal(shouldPrompt(questions), false);
  });
});
