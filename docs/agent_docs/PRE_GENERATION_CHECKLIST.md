# Pre-Generation Behavioral Checklist

**Document Version:** 1.0 **Last Updated:** 2026-03-13 **Status:** ACTIVE
**Purpose:** Behavioral guardrails for patterns that cannot be fully automated.
Each item has a proxy metric for measurement.

> Reference this checklist before generating code, scripts, or skill files.
> Items derive from CLAUDE.md Section 4 behavioral guardrails.

---

## Checklist

### Before Editing Files

- [ ] **Read before edit** — Did I read the target file before modifying it?
  - Proxy metric: `edit-without-read count` (tool call sequence analysis)
  - Enforcement: Edit tool rejects if file not previously Read in conversation
  - Why: Blind edits cause regressions, duplicate code, and context loss

- [ ] **Understand before changing** — Do I understand the existing code's
      purpose?
  - Proxy metric: `edit-size-vs-read-coverage` (large edits after minimal reads
    = red flag)
  - Enforcement: None (behavioral only)
  - Why: Changes without understanding create subtle bugs

### Before Implementing

- [ ] **Explicit approval** — Did I get explicit user approval for this
      approach?
  - Proxy metric: `implementation-before-plan count` (code writes before plan
    presentation)
  - Enforcement: CLAUDE.md guardrail #2
  - Why: Implementing without approval wastes time on wrong approaches

- [ ] **Read the skill format** — If following a skill, did I read the SKILL.md
      first?
  - Proxy metric: `skill-format-deviation count` (output doesn't match skill
    template)
  - Enforcement: CLAUDE.md guardrail #3
  - Why: Improvising formats from memory produces inconsistent output

### Before Writing Code

- [ ] **Safe filesystem ops** — Am I using safe-fs helpers instead of raw fs?
  - Proxy metric: `raw-fs-usage count` in new/modified files
  - Enforcement: `patterns:check` detects some cases; POSITIVE_PATTERNS.md §6-8
  - Why: Raw fs operations skip symlink guards, locking, and error handling

- [ ] **Correct imports** — Am I importing types from `types/` and schemas from
      `schemas.ts`?
  - Proxy metric: `inline-type-definition count` vs `import-from-types count`
  - Enforcement: TypeScript strict mode catches some; code-reviewer checks
  - Why: Scattered type definitions cause drift and inconsistency

- [ ] **Error handling** — Am I wrapping file reads in try/catch and sanitizing
      errors?
  - Proxy metric: `unguarded-read count` in new code
  - Enforcement: `patterns:check` detects unguarded reads
  - Why: TOCTOU races and unsanitized errors leak sensitive paths

### Before Committing

- [ ] **Tests pass** — Did I run the relevant tests?
  - Proxy metric: `commit-without-test-run count`
  - Enforcement: pre-commit hook runs tests
  - Why: Broken tests block CI and waste review cycles

- [ ] **No regressions** — Did I check that existing tests still pass?
  - Proxy metric: `test-regression count` in CI
  - Enforcement: CI test gate
  - Why: Regressions are the #1 source of avoidable review rounds

---

## Proxy Metric Summary

| Behavior                | Metric             | Collection Point   | Threshold    |
| ----------------------- | ------------------ | ------------------ | ------------ |
| Read before edit        | edit-without-read  | Tool call sequence | 0 (absolute) |
| Explicit approval       | impl-before-plan   | Session logs       | 0 (absolute) |
| Skill format compliance | format-deviation   | Retro analysis     | 0 (target)   |
| Safe fs usage           | raw-fs-in-new-code | patterns:check     | 0 (absolute) |
| Error handling          | unguarded-reads    | patterns:check     | 0 (absolute) |
| Test before commit      | commit-no-test     | pre-commit hook    | 0 (absolute) |
