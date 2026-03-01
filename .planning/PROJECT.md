<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Ecosystem v2

## What This Is

The PR Review Ecosystem for SoNash — infrastructure that captures code review
feedback, stores it as structured JSONL data with Zod validation, detects
patterns through recurrence analysis, promotes them to enforcement rules across
7 mechanisms (Regex, ESLint, Semgrep, cross-doc, hooks, AI, manual), and tracks
ecosystem health through a 64-metric composite dashboard. Rebuilt from D+ to
functional in v1.0 with JSONL-first architecture, 100% review history backfill,
and automated pattern-to-enforcement pipeline.

## Core Value

The PR review ecosystem must reliably capture every review finding, track it
through resolution, and prevent recurrence through automated enforcement — no
data loss, no dead ends, no manual steps that get skipped.

## Requirements

### Validated

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
- ✓ JSONL-first architecture with 5 Zod-validated data files — v1.0
- ✓ 100% review history backfill (372 records from 13 archives) — v1.0
- ✓ Automated pattern promotion pipeline with recurrence detection — v1.0
- ✓ Tiered enforcement: 20 Semgrep + 32 ESLint + 64 regex rules — v1.0
- ✓ 64-metric composite health dashboard with session persistence — v1.0
- ✓ Cross-doc gate recalibration with auto-fix and override analytics — v1.0
- ✓ Session lifecycle integration (health:quick on start, score on end) — v1.0
- ✓ Deferred item tracking with auto-escalation pipeline — v1.0
- ✓ Warning lifecycle system with mid-session alerts — v1.0
- ✓ 56 test files across 5 tiers (unit, contract, integration, E2E, perf) — v1.0
- ✓ Performance budgets enforced (<3s gate, <1s quick, <5s full) — v1.0

### Active

(No active requirements — next milestone not yet planned)

### Out of Scope

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

**Current State (post v1.0, 2026-03-01):**

- Composite health grade: D (63/100) — ecosystem-controlled subset C+ (78.6/100)
- reviews.jsonl: 372 validated records from 13 archives (100% backfill)
- 360 patterns tracked across 7 enforcement mechanisms (17.2% automated, 100%
  tracked)
- Deferred items auto-tracked with escalation to S1 after 2+ deferrals
- 56 test files across 5 tiers, all passing
- Cross-doc gate recalibrated with diffPattern filters and auto-fix
- v1/v2 gradual coexistence — v2 handles JSONL-first, v1 bridges legacy

**Prior Work:**

- v1.0 milestone: `.planning/milestones/v1.0-ROADMAP.md` (7 phases, 30 plans)
- Diagnosis: `docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md`
- Discovery: `.planning/ecosystem-v2/DISCOVERY_QA.md` (60 decisions)

## Constraints

- **Tech Stack**: Next.js 16.1.6, TypeScript strict, Zod 4.3.5 — per CLAUDE.md
- **Testing**: Every commit must include its tests (UC-42)
- **Documentation**: Doc updates in same commit as behavior changes (UC-42)
- **Performance**: <3s per gate, <10s total pre-commit, <30s session-start
  (UC-11)
- **Parallelization**: Safe parallelization only (user preference)
- **Backward Compatibility**: Same skill commands, different plumbing (UC-7)

## Key Decisions

| Decision                               | Rationale                                                        | Outcome    |
| -------------------------------------- | ---------------------------------------------------------------- | ---------- |
| JSONL-first architecture (UC-1)        | Eliminates parsing problem — AI writes structured data directly  | ✓ Good     |
| Split JSONL files (Q1)                 | Queryability, separation of concerns, independent schemas        | ✓ Good     |
| Three-tier completeness (UC-2)         | Handles inconsistent historical data gracefully                  | ✓ Good     |
| Structured origin field (Q14)          | Prevents source ID drift, enables reliable queries               | ✓ Good     |
| Full backfill (Q2)                     | Complete data set enables meaningful analytics                   | ✓ Good     |
| Tiered enforcement with Semgrep (UC-3) | Fills gap between regex (too dumb) and ESLint (too much effort)  | ✓ Good     |
| Merge consolidation+promotion (Q20)    | Eliminates dead-end suggested-rules.md artifact                  | ✓ Good     |
| Automated rule generation (Q16)        | Removes human bottleneck that caused 100% stall rate             | ✓ Good     |
| Parallel build then swap (Q11)         | Safest migration path — v1 as fallback                           | ⚠️ Revisit |
| Cross-doc gate recalibration (Q7)      | 48.9% override rate means gate is broken, not useful             | ✓ Good     |
| Self-contained skills (UC-8)           | 90% skip rate on manual follow-up steps proves automation needed | ✓ Good     |
| GSD project structure (Q9)             | Multi-phase, multi-session project needs structured tracking     | ✓ Good     |
| scripts/reviews/ directory (Q19)       | Domain-specific, permanent home after v1 deletion                | ✓ Good     |
| Coverage target revision (ENFR-06)     | 55% mathematically unreachable (ceiling 32.2%), revised to 17.2% | ✓ Good     |
| Gradual v1/v2 coexistence (INTG-06)    | Pre-commit gate too risky to hard-swap                           | ⚠️ Revisit |

---

_Last updated: 2026-03-01 after v1.0 milestone_
