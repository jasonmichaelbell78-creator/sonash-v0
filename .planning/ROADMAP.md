<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Roadmap: PR Review Ecosystem v2

## Overview

Rebuild the PR review ecosystem from D+ to B+ by replacing the broken
markdown-first pipeline with a JSONL-first architecture, backfilling 100% of
review history, automating the pattern-to-enforcement pipeline, expanding
enforcement from 24% to 80%, and wiring everything into a 57-metric health
dashboard. Seven phases, each delivering a complete, verifiable capability layer
that unblocks the next.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Storage Foundation** - Zod schemas, write utilities,
      completeness model, and contract tests for the JSONL layer everything else
      depends on
- [ ] **Phase 2: Backfill & Data Migration** - Parse all 13 archives into v2
      JSONL, fix data errors, establish clean baseline dataset
- [ ] **Phase 3: Core Pipeline** - Skills write JSONL-first, auto-deferred
      tracking, promotion automation, template generation
- [ ] **Phase 4: Enforcement Expansion** - Semgrep + ESLint + regex rule
      expansion to hit 55-60% automated enforcement
- [ ] **Phase 5: Health Monitoring** - 57-metric composite scoring, interactive
      dashboard, warning lifecycle
- [ ] **Phase 6: Gate Recalibration** - Cross-doc gate fixes, override
      analytics, automation of triage/escalation/archival
- [ ] **Phase 7: Integration & Cutover** - Wire into sessions, E2E smoke test,
      v1-to-v2 swap, baseline score

## Dependency Graph

```
Phase 1: Storage Foundation
    |
    v
Phase 2: Backfill & Data Migration
    |
    v
Phase 3: Core Pipeline --------+
    |                           |
    v                           v
Phase 4: Enforcement       Phase 5: Health Monitoring
    |                           |
    +----------+----------------+
               |
               v
         Phase 6: Gate Recalibration
               |
               v
         Phase 7: Integration & Cutover
```

Phases 4 and 5 can execute in parallel after Phase 3 completes (safe
parallelization — no shared data writes between them). Phase 6 depends on both 4
and 5. Phase 7 depends on everything.

## Phase Details

### Phase 1: Storage Foundation

**Goal**: All 5 JSONL files have Zod-validated schemas, a shared write utility
rejects invalid records, and the completeness model handles full/partial/stub
tiers gracefully **Depends on**: Nothing (first phase) **Requirements**:
STOR-01, STOR-02, STOR-03, STOR-04, STOR-05, STOR-06, STOR-07, STOR-08, STOR-09,
TEST-01, TEST-06 **Success Criteria** (what must be TRUE):

1. All 5 JSONL files (reviews, retros, deferred-items, invocations, warnings)
   have Zod schemas that reject malformed data at write time
2. A single shared write utility is the only way to append to any JSONL file —
   direct fs.appendFile calls are impossible without bypassing the API
3. Read-time validation logs warnings for malformed records and continues
   processing (does not throw)
4. hasField() helper correctly distinguishes between null values and fields
   listed in completeness_missing for all 3 tiers
5. Contract tests verify all 10 data handoff points pass with full/partial/stub
   fixture data **Plans**: 3 plans

Plans:

- [x] 01-01-PLAN.md — Zod schemas for all 5 JSONL types + shared base record +
      tsconfig setup
- [x] 01-02-PLAN.md — Write/read utilities, completeness helper, and unit tests
- [x] 01-03-PLAN.md — Test fixtures for all 3 completeness tiers + 7 contract
      tests

### Phase 2: Backfill & Data Migration

**Goal**: 100% of review history (reviews #1-406) exists as validated JSONL
records, all known data errors are corrected, and the dataset is a clean
foundation for pipeline work **Depends on**: Phase 1 **Requirements**: BKFL-01,
BKFL-02, BKFL-03, BKFL-04, BKFL-05, BKFL-06, BKFL-07 **Success Criteria** (what
must be TRUE):

1. reviews.jsonl contains entries for all 406 reviews parsed from 13 archives +
   active log, each passing Zod validation
2. The 3 archive overlaps produce no duplicate records and the 7 archive gaps
   are accounted for (filled or marked stub with completeness_missing)
3. All existing MASTER_DEBT.jsonl review-sourced entries are deduplicated (no
   duplicate debt items for the same finding)
4. Migration script run on existing data produces zero Zod validation errors on
   output **Plans**: 3 plans

Plans:

- [ ] 02-01-PLAN.md — Markdown review parser with heading + table format support
      and field extractors
- [ ] 02-02-PLAN.md — Backfill orchestrator: read all archives, resolve
      overlaps, write validated JSONL
- [ ] 02-03-PLAN.md — MASTER_DEBT.jsonl deduplication of review-sourced entries

### Phase 3: Core Pipeline

**Goal**: Review and retro skills write structured JSONL as source of truth,
deferred items are auto-tracked, and the promotion pipeline automatically
detects recurrence and generates enforcement rules **Depends on**: Phase 2
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07,
PIPE-08, PIPE-09, PIPE-10 **Success Criteria** (what must be TRUE):

1. Running /pr-review writes a Zod-validated record to reviews.jsonl and renders
   markdown as a view — same UX, JSONL plumbing underneath
2. Running /pr-retro writes to retros.jsonl (with dual-write to legacy format
   during transition) and auto-creates deferred-items.jsonl entries for any
   actionable findings
3. The merged promotion script detects a pattern recurring N times across M PRs
   and auto-generates a CODE_PATTERNS entry + enforcement rule skeleton +
   FIX_TEMPLATE stub
4. CLAUDE.md anti-patterns section can be regenerated from top patterns without
   manual editing
5. All skill and agent invocations are tracked in a single invocations.jsonl
   with structured origin fields **Plans**: TBD

Plans:

- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Enforcement Expansion

**Goal**: Automated enforcement coverage reaches 55-60% (up from 24%) through
new Semgrep, ESLint, and regex rules, with pattern lifecycle tracking across all
7 mechanisms **Depends on**: Phase 3 **Requirements**: ENFR-01, ENFR-02,
ENFR-03, ENFR-04, ENFR-05, ENFR-06, ENFR-07 **Success Criteria** (what must be
TRUE):

1. 20-30 Semgrep custom rules exist and catch multi-line patterns, try/catch
   wrapping issues, and taint-tracking violations that regex cannot
2. 5-10 new ESLint AST rules enforce code structure, hooks usage, and unsafe
   patterns that require parse-tree analysis
3. 10-15 new regex rules in check-pattern-compliance.js catch banned strings,
   imports, and naming violations
4. Every pattern in CODE_PATTERNS.md has a tracked enforcement status across all
   7 mechanisms (regex, ESLint, Semgrep, cross-doc, hooks, AI, manual)
5. Rules with false positive rates above threshold are auto-disabled and flagged
   for review **Plans**: TBD

Plans:

- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Health Monitoring

**Goal**: A 57-metric composite health score with letter grades runs on demand,
persists across sessions, and surfaces degradation through mid-session alerts
**Depends on**: Phase 3 **Requirements**: HLTH-01, HLTH-02, HLTH-03, HLTH-04,
HLTH-05, HLTH-06 **Success Criteria** (what must be TRUE):

1. Running /ecosystem-health produces a composite score across 8 categories with
   per-dimension letter grades and drill-down into any of 13 dimensions
2. ecosystem-health-log.jsonl persists scores across sessions, enabling trend
   comparison (is the score improving or degrading?)
3. Warnings are tracked from creation through resolution in warnings.jsonl with
   lifecycle states (new/acknowledged/resolved/stale)
4. Mid-session alerts fire when metrics degrade (new duplicates detected,
   deferred items aged past threshold) **Plans**: TBD

Plans:

- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Gate Recalibration

**Goal**: Cross-doc deps gate override rate drops below 15%, gates auto-fix
instead of just blocking, and triage/escalation/archival happen automatically
**Depends on**: Phase 4, Phase 5 **Requirements**: GATE-01, GATE-02, GATE-03,
GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, GATE-09 **Success Criteria** (what
must be TRUE):

1. Cross-doc deps gate with diffPattern filters and gitFilter achieves <15%
   override rate (down from 48.9%)
2. When cross-doc gate detects a violation, it suggests a fix and can auto-apply
   it (not just block)
3. Override events are tracked with accountability — running override analytics
   shows who overrode what and why, with pattern detection
4. Deferred items deferred 2+ times auto-promote to S1 severity with a DEBT
   entry created
5. Qodo suppression rules are pruned (19 rules audited, stale ones removed) and
   SECURITY_CHECKLIST syncs with actual ESLint enforcement reality **Plans**:
   TBD

Plans:

- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Integration & Cutover

**Goal**: v2 ecosystem is wired into session lifecycle, passes E2E smoke test on
real data, v1 scripts are swapped out, and composite score baseline is
established **Depends on**: Phase 6 **Requirements**: INTG-01, INTG-02, INTG-03,
INTG-04, INTG-05, INTG-06, INTG-07, INTG-08, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

1. Session-start runs health:quick check automatically; session-end runs
   health:score — both integrated without manual invocation
2. Full E2E smoke test passes on real data: review markdown -> JSONL capture ->
   consolidation -> pattern promotion -> enforcement rule -> gate check
3. v1 scripts are replaced by v2 equivalents in scripts/reviews/, with v1
   available as fallback via flag
4. 39 test files exist across 5 tiers (unit, contract, integration, E2E,
   performance) with all performance budgets met (<3s/gate, <10s pre-commit,
   <30s session-start)
5. Composite health score baseline is established at B+ or above, with all
   category scores documented **Plans**: TBD

Plans:

- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

## Coverage Validation

**59 v1 requirements mapped across 7 phases:**

| Category           | Count | Phase(s)                                                                 | Requirements            |
| ------------------ | ----- | ------------------------------------------------------------------------ | ----------------------- |
| Storage (STOR)     | 9     | Phase 1                                                                  | STOR-01 through STOR-09 |
| Backfill (BKFL)    | 7     | Phase 2                                                                  | BKFL-01 through BKFL-07 |
| Pipeline (PIPE)    | 10    | Phase 3                                                                  | PIPE-01 through PIPE-10 |
| Enforcement (ENFR) | 7     | Phase 4                                                                  | ENFR-01 through ENFR-07 |
| Health (HLTH)      | 6     | Phase 5                                                                  | HLTH-01 through HLTH-06 |
| Gate (GATE)        | 9     | Phase 6                                                                  | GATE-01 through GATE-09 |
| Integration (INTG) | 8     | Phase 7                                                                  | INTG-01 through INTG-08 |
| Testing (TEST)     | 6     | Phase 1 (TEST-01, TEST-06), Phase 7 (TEST-02, TEST-03, TEST-04, TEST-05) | Cross-cutting           |

**Mapped: 59/59** -- No orphaned requirements.

**Cross-cutting note:** TEST-03 (39 test files across 5 tiers) and TEST-05
(every script committed with tests) are enforced throughout all phases as a
project constraint but formally verified in Phase 7. They are assigned to Phase
7 for traceability but the constraint applies from Phase 1 onward per PROJECT.md
constraints.

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 2 -> 3 -> 4 (parallel
with 5) -> 6 -> 7

| Phase                        | Plans Complete | Status      | Completed  |
| ---------------------------- | -------------- | ----------- | ---------- |
| 1. Storage Foundation        | 3/3            | Complete    | 2026-02-28 |
| 2. Backfill & Data Migration | 0/3            | Not started | -          |
| 3. Core Pipeline             | 0/TBD          | Not started | -          |
| 4. Enforcement Expansion     | 0/TBD          | Not started | -          |
| 5. Health Monitoring         | 0/TBD          | Not started | -          |
| 6. Gate Recalibration        | 0/TBD          | Not started | -          |
| 7. Integration & Cutover     | 0/TBD          | Not started | -          |

---

_Roadmap created: 2026-02-28_ _Last updated: 2026-02-28 (Phase 2 planned — 3
plans in 2 waves)_
