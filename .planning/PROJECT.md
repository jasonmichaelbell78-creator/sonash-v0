<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Ecosystem v2

## What This Is

A full v2 rebuild of the PR Review Ecosystem for SoNash — the infrastructure
that captures code review feedback, stores it as structured data, detects
patterns, promotes them to enforcement rules, and tracks their lifecycle.
Currently graded D+ due to 85-100% data loss in the JSONL layer, 76% unenforced
patterns, and ~90% of deferred items vanishing without resolution. V2 redesigns
the entire pipeline from the ground up: JSONL-first architecture, split storage
files with Zod schemas, automated pattern-to-enforcement pipeline, tiered
enforcement (Regex + ESLint + Semgrep + AI), and a 57-metric ecosystem health
dashboard.

## Core Value

The PR review ecosystem must reliably capture every review finding, track it
through resolution, and prevent recurrence through automated enforcement — no
data loss, no dead ends, no manual steps that get skipped.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ PR review skill (`/pr-review`) processes external review feedback — existing
- ✓ PR retro skill (`/pr-retro`) generates retrospective analysis — existing
- ✓ Code reviewer agent performs post-implementation review — existing
- ✓ CODE_PATTERNS.md captures 275 known patterns — existing
- ✓ check-pattern-compliance.js enforces 65 patterns via regex — existing
- ✓ ESLint plugin enforces 22 patterns via AST — existing
- ✓ Pre-commit/pre-push gates with 20 checks — existing
- ✓ MASTER_DEBT.jsonl tracks 8,354 technical debt items — existing
- ✓ 13 review archive files preserve historical reviews — existing
- ✓ SonarCloud + Qodo + Gemini external review integrations — existing

### Active

<!-- v1 scope for ecosystem v2 rebuild -->

- [ ] JSONL-first architecture — AI writes structured JSONL, markdown is
      generated view (UC-1)
- [ ] Split JSONL storage — reviews.jsonl, retros.jsonl, deferred-items.jsonl,
      invocations.jsonl, warnings.jsonl (Q1)
- [ ] Zod schemas for all 5 JSONL files with write-time validation (Q13)
- [ ] Three-tier completeness model — full/partial/stub with
      completeness_missing (UC-2)
- [ ] Structured origin field — Zod-validated object replacing string source IDs
      (Q14)
- [ ] Full backfill of reviews #1-406 from 13 archives + active log (Q2)
- [ ] Contract tests for all 10 data handoff points + E2E smoke test (Q3)
- [ ] Merged consolidation+promotion script — detect recurrence, generate rules,
      promote (Q20)
- [ ] Automated rule generation — recurrence triggers auto-rule creation (Q16)
- [ ] Tiered enforcement — Regex (+10-15), ESLint (+5-10), Semgrep (+20-30),
      AI-assisted (UC-3)
- [ ] Target 55-60% automated enforcement, 80% total (up from 24%) (UC-3)
- [ ] Itemized deferred-item tracking with auto-escalation (Q8)
- [ ] Ecosystem health dashboard — 10 dimensions, 57 metrics, composite score
      (Q17, UC-35)
- [ ] Cross-doc deps gate recalibration — target <15% override rate (Q7)
- [ ] Automated review archival at threshold (UC-19)
- [ ] Skills write JSONL-first, same UX, different plumbing (UC-7)
- [ ] Auto-deferred-item creation inside review skills (UC-8)
- [ ] FIX_TEMPLATE auto-stubs from patterns (UC-22)
- [ ] CLAUDE.md auto-generation from top patterns (UC-31)
- [ ] DEBT triage automation (UC-23)
- [ ] S1 escalation auto-trigger (UC-27)
- [ ] Performance budgets: <3s/gate, <10s pre-commit, <30s session-start (UC-11)
- [ ] 39 test files across 5 tiers (UC-38)
- [ ] Qodo suppression rule pruning (UC-20)
- [ ] SECURITY_CHECKLIST sync with ESLint reality (UC-21)
- [ ] 3 security-specific FIX_TEMPLATES (UC-41)
- [ ] Gemini config in-repo (UC-26)
- [ ] Override analytics and accountability (UC-32)
- [ ] Pattern staleness resolution for all 7 mechanisms (UC-36)
- [ ] Warning lifecycle system (UC-12)
- [ ] Compaction safeguards for ecosystem state (UC-18)
- [ ] Continuous testing + doc maintenance mandate (UC-42)

### Out of Scope

<!-- Explicit boundaries with reasoning -->

- Skill rationalization (27 review-related skills) — skills work individually,
  fix data not skill count (Q6, NG-11)
- Database migration — JSONL format is sufficient, no need for SQLite/Postgres
  (Q1)
- Real-time collaboration features — single-developer workflow (project context)
- External API integrations beyond existing (SonarCloud, Qodo, Gemini) — current
  set is sufficient
- Mobile/web dashboard UI — CLI-based interactive dashboard is the target
  (UC-13)

## Context

**Current State (from diagnosis, 2026-02-27):**

- Composite health grade: D+
- reviews.jsonl covers 7.8% of review history (45/406 reviews) with 85-100% data
  loss
- 76% of documented patterns have no automated enforcement (65/275)
- ~90% of deferred items vanish without resolution tracking
- 10 of 14 critical pipeline scripts have zero test coverage
- Review-sourced DEBT resolution rate is 6.9% (558/638 stuck in VERIFIED)
- Cross-doc deps gate has 48.9% override rate
- consolidation → suggested-rules pipeline is a dead end (22 unconverted stubs)

**Target State:**

- Composite health grade: B+ within 3 months, A within 6 months
- 100% review data captured via JSONL-first architecture
- 55-60% automated enforcement, 80% total coverage
- Zero deferred items lost — all tracked with auto-escalation
- Contract tests for all data handoffs + E2E smoke test
- <15% override rate on recalibrated gates

**Prior Work:**

- Diagnosis: `docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md` (27 gaps, 7 layers, 35
  components)
- Discovery: `.planning/ecosystem-v2/DISCOVERY_QA.md` (60 decisions)
- Context: `.planning/ecosystem-v2/GSD_CONTEXT.md` (architecture summary)

**Existing Components (35 across 7 layers):**

- Layer 1 Capture: pr-review skill, code-reviewer agent, multi-ai-audit skill,
  SonarCloud, Qodo, Gemini
- Layer 2 Storage: AI_REVIEW_LEARNINGS_LOG.md, reviews.jsonl (broken), 13
  archive files
- Layer 3 Analysis: run-consolidation.js, analyze-learning-effectiveness.js
- Layer 4 Promotion: promote-patterns.js, CODE_PATTERNS.md, FIX_TEMPLATES.md
- Layer 5 Enforcement: check-pattern-compliance.js, ESLint plugin, cross-doc
  deps, hooks
- Layer 6 Tracking: MASTER_DEBT.jsonl, add-debt skill, pr-retro skill
- Layer 7 Audit: pr-ecosystem-audit skill, agent invocation tracker

## Constraints

- **Tech Stack**: Next.js 16.1.6, TypeScript strict, Zod 4.3.5 for schemas — per
  CLAUDE.md
- **Migration**: Parallel build then swap — v2 in `scripts/reviews/`, v1 stays
  until cutover (Q11)
- **Testing**: Every commit must include its tests — no script lands without
  test coverage (UC-42)
- **Documentation**: Doc updates in same commit as behavior changes — no
  separate docs phase (UC-42)
- **Performance**: <3s per gate, <10s total pre-commit, <30s session-start
  (UC-11)
- **Parallelization**: Safe parallelization only — don't risk data corruption
  (user preference)
- **Backward Compatibility**: Same skill commands and invocation patterns —
  different plumbing (UC-7)
- **Session Budget**: No fixed timeline — however long it takes (user directive)

## Key Decisions

| Decision                               | Rationale                                                        | Outcome   |
| -------------------------------------- | ---------------------------------------------------------------- | --------- |
| JSONL-first architecture (UC-1)        | Eliminates parsing problem — AI writes structured data directly  | — Pending |
| Split JSONL files (Q1)                 | Queryability, separation of concerns, independent schemas        | — Pending |
| Three-tier completeness (UC-2)         | Handles inconsistent historical data gracefully                  | — Pending |
| Structured origin field (Q14)          | Prevents source ID drift, enables reliable queries               | — Pending |
| Full backfill (Q2)                     | Complete data set enables meaningful analytics                   | — Pending |
| Tiered enforcement with Semgrep (UC-3) | Fills gap between regex (too dumb) and ESLint (too much effort)  | — Pending |
| Merge consolidation+promotion (Q20)    | Eliminates dead-end suggested-rules.md artifact                  | — Pending |
| Automated rule generation (Q16)        | Removes human bottleneck that caused 100% stall rate             | — Pending |
| Parallel build then swap (Q11)         | Safest migration path — v1 as fallback                           | — Pending |
| Cross-doc gate recalibration (Q7)      | 48.9% override rate means gate is broken, not useful             | — Pending |
| Self-contained skills (UC-8)           | 90% skip rate on manual follow-up steps proves automation needed | — Pending |
| GSD project structure (Q9)             | Multi-phase, multi-session project needs structured tracking     | — Pending |
| scripts/reviews/ directory (Q19)       | Domain-specific, permanent home after v1 deletion                | — Pending |

---

_Last updated: 2026-02-28 after initialization_
