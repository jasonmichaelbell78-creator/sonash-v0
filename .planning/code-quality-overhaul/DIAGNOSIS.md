# Diagnosis: Repo-Wide Code Quality Overhaul

**Date:** 2026-03-12 **Task:** Research and produce an implementation plan for 7
code quality workstreams: MD→JSONL audit, ESLint cleanup + v10 migration,
propagation pattern fixes, cyclomatic/cognitive complexity refactoring +
guardrails, code fragility fixes, truncation/reformatting protection guardrails,
and full orphan search.

## ROADMAP Alignment

**Aligned.** This work maps directly to **M2.1 Code Quality & Tooling** (~25
items, P2, Parallel phase) in the ROADMAP. The System-Wide Standardization
initiative (92 decisions, P0 BLOCKER) has already established foundational
tenets that this plan implements:

- **T2:** Source of truth + generated views (JSONL→MD pattern)
- **D39:** No truncation in generated views
- **D77-D79:** JSONL is canonical source of truth

Additionally, Plan 1 (Tooling Infrastructure Audit) Decision #3 explicitly
defers the 30 open code scanning alerts to "Plan 2 (code quality overhaul)" —
this plan.

---

## Relevant Existing Systems

| System                        | Relationship                                         | Pattern to Follow                                                      |
| ----------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| TDMS (Technical Debt)         | JSONL source → MD views pipeline                     | D77-D79: JSONL as source of truth                                      |
| Planning system               | JSONL source → MD views pipeline                     | Same pattern, `generate-decisions.js` / `generate-discovery-record.js` |
| `check-pattern-compliance.js` | 40+ regex patterns, enforced in pre-commit           | Migrate high-value patterns to ESLint AST rules                        |
| `check-propagation.js`        | 6 known-pattern rules + function-duplicate detection | Pre-push warning, pre-commit staged warning                            |
| `eslint-plugin-sonash`        | 31 custom rules (24 unique), 3 phases of migration   | ESLint plugin is the future home for pattern enforcement               |
| Pre-commit hook               | 517 lines, 15 checks, Wave 0-1 parallel              | Well-engineered; changes must not slow it down                         |
| `post-write-validator.js`     | 10 consolidated checks on Write/Edit/MultiEdit       | Existing guardrail against bad AI writes                               |

---

## Current State by Workstream

### WS1: MD → JSONL Audit

**Current state:** Disciplined JSONL→MD pipeline exists for planning and TDMS
data. Only 4 scripts read MD for structured data:

- `track-session.js` — SESSION_CONTEXT.md (session number extraction)
- `check-roadmap-hygiene.js` — ROADMAP.md (checkbox counts)
- `extract-roadmap-debt.js` — ROADMAP.md (debt item extraction)
- `reconcile-roadmap.js` — ROADMAP.md (ID replacement)

**Key finding:** The problem isn't "MD files being read instead of JSONL" — the
JSONL convention is already well-established. The real question is: should the 4
remaining MD readers be converted to JSONL-backed, and are there other AI-facing
files that should be JSONL?

### WS2: ESLint Cleanup + v10 Migration

**Current state:** ESLint v9.39.4 (already flat config). 2,124 warnings, 0
errors.

Top warning sources: | Rule | Count | Nature | |------|-------|--------| |
`sonash/no-unsafe-error-access` | 472 | Custom rule — many may be intentional
patterns | | `complexity` (CC>15) | 358 | Pre-existing high-CC functions | |
`security/detect-non-literal-fs-filename` | 277 | False positives in src/
(Next.js, not user input) | | `security/detect-object-injection` | 240 | False
positives in src/ | | `sonash/no-unguarded-loadconfig` | 162 | Missing try/catch
on config loads | | `@typescript-eslint/no-unused-vars` | 112 | Unused variables
| | `sonash/no-non-atomic-write` | 103 | writeFileSync without atomic pattern |

**v10 note:** ESLint v10 doesn't exist yet (current stable is v9.39.4). This
workstream should focus on warning triage, baseline reduction, and preparation
for v10 when it arrives.

### WS3: Propagation Pattern Fixes

**Current state:** `check-propagation.js` has 2 enforcement modes:

1. **Function-level:** Detects when a function is modified in file A but an
   identical copy in file B wasn't updated
2. **Known-pattern rules (6):** statSync-without-lstat,
   path-resolve-without-containment, writeFileSync-without-symlink-guard,
   rmSync-usage, escapeCell-inconsistency, truthy-filter-unsafe

**Integration:** Pre-commit (warning, staged only) + pre-push (blocking). The
hook mini-audit identified this as well-functioning but needing fix for
security-critical patterns.

### WS4: Cyclomatic/Cognitive Complexity

**Current state:**

- ESLint `complexity` rule: warn at 15 globally, error at 15 for staged .husky/
  files
- 358 pre-existing CC>15 violations (113 were documented in eslint.config.mjs
  comment, now grown to 358)
- Pre-commit runs CC as error on staged files only — blocks NEW high-CC but
  doesn't reduce existing
- **No cognitive complexity enforcement** — only cyclomatic. SonarCloud measures
  cognitive complexity but it's not in ESLint config
- CANON-0138 in ROADMAP: "Reduce 47 CRITICAL complexity functions in scripts/"
  (S0)

### WS5: Code Fragility Fixes

**Current state:** Multiple sources identify fragility:

- **Regex-based markdown parsing** in scripts that should use structured data
  (JSONL) instead
- **Hardcoded format assumptions** in hooks/scripts
- **Deep conditional nesting:** Scripts with deeply nested `instanceof`/ternary
  chains should be refactored for readability
- **Cross-doc dependency checking** uses regex to validate markdown links
- **ai-optimization-audit skill** has a "Fragile Parsing Audit" step
  specifically designed for this

### WS6: Truncation/Reformatting Protection

**Current state:**

- **D39 (Standardization):** "Generated MD files must NEVER truncate JSONL
  source data"
- **Pattern compliance:** Has `auto-mode-slice-truncation` pattern (warns on
  `.slice()` in auto mode)
- **post-write-validator.js:** 10 checks on AI writes but NO explicit
  truncation/file-shrink detection
- **No guardrail** against AI agents accidentally removing content from the end
  of files during edits
- **No file-size regression check** — if a write reduces file size by >50%, no
  warning fires

### WS7: Full Orphan Search

**Current state:**

- **6 skill directories** missing (senior-architect through senior-qa) — listed
  in SKILL_INDEX.md but don't exist
- **6+ dead npm scripts** confirmed (ecosystem:audit:all, lighthouse, docs:lint,
  and others)
- **4 dead workflow components** (covered by Plan 1)
- **1 orphaned system** (render-reviews-to-md.js — not wired into archival
  pipeline)
- **No automated orphan detection** for: SKILL_INDEX.md ↔ filesystem, npm
  scripts ↔ referenced files, hooks ↔ referenced files

---

## Reframe Check

**Partial reframe needed.** The user framed this as 7 parallel workstreams, but
they have significant overlap:

1. **WS1 (MD→JSONL) + WS5 (fragility) + WS6 (truncation)** share a root cause:
   AI-facing data stored in fragile formats without protection guardrails
2. **WS2 (ESLint) + WS3 (propagation) + WS4 (complexity)** share a root cause:
   enforcement gaps in the linting/compliance pipeline
3. **WS7 (orphans)** overlaps heavily with Plan 1 Step 7 (npm script audit +
   skill orphan scan)

**Recommendation:** Keep the 7 workstream structure (user specified it) but
organize implementation around the shared infrastructure:

- **Enforcement layer** (ESLint, propagation, complexity) — unified cleanup
- **Data integrity layer** (MD→JSONL, fragility, truncation) — guardrail
  creation
- **Cleanup layer** (orphans) — search + removal, deduplicated with Plan 1

This prevents duplicate work between WS1/WS5/WS6 and between WS2/WS3/WS4.
