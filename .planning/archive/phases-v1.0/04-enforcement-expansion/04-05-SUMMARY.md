<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

phase: 04-enforcement-expansion plan: 05 subsystem: enforcement-manifest tags:
[semgrep, manifest-builder, coverage-accuracy, gap-closure]

dependency_graph: requires: [04-04] provides: [accurate-semgrep-refs,
exact-slug-matching] affects: [04-06]

tech_stack: added: [] patterns: [exact-slug-matching-over-fuzzy]

key_files: created: [] modified: -
.semgrep/rules/security/no-direct-firestore-write.yml -
.semgrep/rules/security/no-dangerouslysetinnerhtml.yml -
.semgrep/rules/security/no-eval-usage.yml -
.semgrep/rules/security/no-hardcoded-secrets.yml -
.semgrep/rules/security/no-innerhtml-assignment.yml -
.semgrep/rules/security/taint-user-input-to-exec.yml -
.semgrep/rules/correctness/no-await-in-loop.yml -
.semgrep/rules/correctness/no-floating-promise.yml -
.semgrep/rules/correctness/no-unchecked-array-access.yml -
.semgrep/rules/style/no-any-type.yml -
.semgrep/rules/style/no-console-in-components.yml -
.semgrep/rules/style/no-default-export.yml -
.semgrep/rules/style/no-inline-firestore-query.yml -
.semgrep/rules/style/no-magic-numbers.yml -
scripts/reviews/build-enforcement-manifest.ts

decisions:

- id: D04-05-01 decision: Keep fuzzyMatch for regex/ESLint but use exact slug
  match for Semgrep rationale: Regex and ESLint rule IDs were designed with
  fuzzy matching in mind; Semgrep refs are now controlled with exact pattern
  slugs

metrics: duration: 4 min completed: 2026-03-01

---

# Phase 04 Plan 05: Semgrep Ref Fix Summary

**One-liner:** Fixed inflated enforcement coverage by replacing 14 generic
Semgrep code-pattern-ref values with specific pattern slugs and switching
builder to exact-match-only logic.

## What Was Done

### Task 1: Update Semgrep rule code-pattern-ref values (14 of 20 files changed)

Replaced generic category refs with specific pattern IDs from CODE_PATTERNS.md:

**Security rules (6 changed, 2 already correct):** | Rule | Old ref | New ref |
|------|---------|---------| | no-direct-firestore-write | "Security" | "Dev
data client-only" | | no-dangerouslysetinnerhtml | "Security" | "Markdown
injection" | | no-eval-usage | "Security" | "Shell interpolation" | |
no-hardcoded-secrets | "Security" | ".env files" | | no-innerhtml-assignment |
"Security" | "Markdown injection" | | taint-user-input-to-exec | "Security" |
"External input" | | no-unsanitized-error-response | "Error Sanitization" |
(kept) | | taint-path-traversal | "Path Traversal Check" | (kept) |

**Correctness rules (3 changed, 4 already correct):** | Rule | Old ref | New ref
| |------|---------|---------| | no-await-in-loop | "General" | "Cursor
pagination batch jobs" | | no-floating-promise | "General" | "Safe error
handling" | | no-unchecked-array-access | "General" | "Array.isArray guards" | |
async-without-try-catch | "File Reads with try/catch" | (kept) | |
file-read-without-try-catch | "File Reads with try/catch" | (kept) | |
no-race-condition-file-ops | "File Reads with try/catch" | (kept) | |
regex-without-lastindex-reset | "exec() Loops with /g Flag" | (kept) |

**Style rules (5 changed):** | Rule | Old ref | New ref |
|------|---------|---------| | no-any-type | "JavaScript/TypeScript" | "Robust
non-Error" | | no-console-in-components | "React/Frontend" | "Error user-facing
messages" | | no-default-export | "JavaScript/TypeScript" | "Node.js module
prefix" | | no-inline-firestore-query | "Security" | "Firestore batch chunking"
| | no-magic-numbers | "General" | "Smart fallbacks" |

### Task 2: Fix manifest builder matching logic

Changed Semgrep matching in `buildMechanisms()` from:

```typescript
if (fuzzyMatch(refSlug, slug) || ref === pattern.category || ref === pattern.name)
```

To:

```typescript
if (refSlug === slug)
```

Removed three problematic matching strategies:

1. `ref === pattern.category` -- primary bug causing category-wide false matches
2. `ref === pattern.name` -- redundant with slug comparison
3. `fuzzyMatch(refSlug, slug)` -- 60% word overlap caused unrelated matches

Kept `fuzzyMatch` function for regex and ESLint matching (those rule IDs were
designed with fuzzy matching in mind).

## Decisions Made

1. **Keep fuzzyMatch for regex/ESLint, exact for Semgrep** -- Regex rule IDs and
   ESLint rule names were designed to fuzzy-match pattern slugs. Semgrep refs
   are now under our control with exact pattern slugs, so exact matching is both
   safer and sufficient.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. Zero generic category refs remain in any Semgrep YAML file
2. build-enforcement-manifest.ts Semgrep matching uses `refSlug === slug` only
3. TypeScript compiles without errors (`npx tsc --noEmit`)
4. All 25 enforcement-manifest tests pass (`npx tsx --test`)

## Next Phase Readiness

Plan 04-06 can now rebuild the manifest with accurate coverage numbers. The two
root causes of inflated coverage (generic refs + category-level matching) are
eliminated.
