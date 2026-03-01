<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Requirements: PR Review Ecosystem v2

**Defined:** 2026-02-28 **Core Value:** Reliably capture every review finding,
track it through resolution, and prevent recurrence through automated
enforcement — no data loss, no dead ends, no manual steps that get skipped.

## v1 Requirements

Requirements for the v2 rebuild. Each maps to roadmap phases.

### Storage & Data Layer

- [ ] **STOR-01**: Zod schemas defined for all 5 JSONL files (reviews, retros,
      deferred-items, invocations, warnings) with write-time validation (Q1,
      Q13)
- [ ] **STOR-02**: JSONL-first architecture — AI writes structured JSONL as
      source of truth, markdown generated as view (UC-1)
- [ ] **STOR-03**: Split JSONL storage — each file has independent schema, can
      be queried independently (Q1)
- [ ] **STOR-04**: Three-tier completeness model — every record tagged
      full/partial/stub with completeness_missing array (UC-2)
- [ ] **STOR-05**: Structured origin field — Zod-validated object replacing
      string source IDs, never queried by string parsing (Q14)
- [ ] **STOR-06**: Read-time validation — consumers log warnings for malformed
      records, graceful degradation (Q13)
- [ ] **STOR-07**: Shared write utility — all JSONL writes go through one
      validated function, invalid records rejected (Q13)
- [ ] **STOR-08**: hasField() helper — checks both null AND completeness_missing
      array for consumer safety (UC-2)
- [ ] **STOR-09**: Test fixtures for all 3 completeness tiers (full, partial,
      stub) used across all pipeline tests (UC-2)

### Backfill & Data Migration

- [ ] **BKFL-01**: Full backfill of reviews #1-406 parsed from 13 archives +
      active log into v2 JSONL format (Q2)
- [ ] **BKFL-02**: Archive cleanup — resolve 3 overlaps and 7 gaps across 13
      archive files (UC-24)
- [ ] **BKFL-03**: Existing DEBT dedup — deduplicate review-sourced entries in
      MASTER_DEBT.jsonl (UC-39)
- [ ] **BKFL-04**: Retro arithmetic tagging — tag retros with computed metrics
      for analytics (UC-40)
- [ ] **BKFL-05**: Consolidation counter fix — correct miscounts in
      consolidation output (UC-29)
- [ ] **BKFL-06**: Pattern corrections — fix patterns #5 and #13 content errors
      (UC-25)
- [ ] **BKFL-07**: Migration script validates and fixes all existing records to
      clean slate (Q13)

### Pipeline (Capture to Enforcement)

- [ ] **PIPE-01**: pr-review skill writes JSONL-first, then renders markdown
      view (UC-1, UC-7)
- [ ] **PIPE-02**: pr-retro skill writes JSONL-first with dual-writes during
      transition (UC-1, UC-7)
- [ ] **PIPE-03**: Auto-deferred-item creation — review JSONL write auto-creates
      deferred-items.jsonl entries, no manual /add-debt needed (UC-8)
- [ ] **PIPE-04**: Unified invocation tracker — single system tracking all skill
      and agent invocations (UC-9)
- [ ] **PIPE-05**: Merged promotion script — consolidation + promotion in one
      script, detect recurrence, generate rules, promote to CODE_PATTERNS (Q20)
- [ ] **PIPE-06**: Automated rule generation — pattern recurs N times across M
      PRs triggers auto-rule creation with tier classification (Q16)
- [ ] **PIPE-07**: CLAUDE.md auto-generation — top patterns auto-update
      CLAUDE.md anti-patterns section (UC-31)
- [ ] **PIPE-08**: FIX_TEMPLATE auto-stubs — new patterns auto-generate template
      skeletons in FIX_TEMPLATES.md (UC-22)
- [ ] **PIPE-09**: 3 security-specific FIX_TEMPLATES authored for common
      security patterns (UC-41)
- [ ] **PIPE-10**: render-reviews-to-markdown.js — generates human-readable
      markdown from JSONL source of truth (UC-1)

### Enforcement Expansion

- [ ] **ENFR-01**: Semgrep custom rules — 20-30 new rules for multi-line
      patterns, try/catch wrapping, taint tracking (UC-3)
- [ ] **ENFR-02**: ESLint AST rules — 5-10 new rules for code structure, hooks,
      unsafe patterns (UC-3)
- [ ] **ENFR-03**: Regex rule expansion — 10-15 new rules for banned strings,
      imports, naming (UC-3)
- [ ] **ENFR-04**: Pattern lifecycle tracking across all 7 enforcement
      mechanisms (UC-36)
- [ ] **ENFR-05**: Pattern staleness resolution — all stale patterns either
      enforced, documented-only, or removed (UC-36)
- [ ] **ENFR-06**: Automated enforcement target: 55-60% automated, 80% total
      coverage (up from 24%) (UC-3)
- [ ] **ENFR-07**: FP monitoring — auto-disable rules with false positive rate
      above threshold (UC-3)

### Health Monitoring & Dashboard

- [ ] **HLTH-01**: 10 health check scripts covering all ecosystem dimensions
      (UC-37)
- [ ] **HLTH-02**: 57-metric composite scoring across 8 categories with letter
      grades (UC-35)
- [ ] **HLTH-03**: ecosystem-health-log.jsonl — persists health scores across
      sessions for trending (UC-35)
- [ ] **HLTH-04**: Interactive /ecosystem-health dashboard skill with 13
      dimensions and drill-down (UC-13)
- [ ] **HLTH-05**: Warning lifecycle system — warnings tracked from creation
      through resolution (UC-12)
- [ ] **HLTH-06**: Mid-session alerts for metric degradation (new duplicates,
      aged deferrals) (Q18)

### Gate Recalibration & Automation

- [ ] **GATE-01**: Cross-doc deps gate recalibration — diffPattern filters,
      gitFilter, target <15% override rate (Q7, UC-28)
- [ ] **GATE-02**: Cross-doc auto-fix mode — gate suggests and applies fixes
      instead of just blocking (UC-28)
- [ ] **GATE-03**: Override analytics — track and surface override patterns with
      accountability (UC-32)
- [ ] **GATE-04**: Auto-archive reviews at threshold (currently manual confirm)
      (UC-19)
- [ ] **GATE-05**: Qodo suppression rule pruning — audit 19 rules for staleness
      (UC-20)
- [ ] **GATE-06**: SECURITY_CHECKLIST sync with ESLint reality (UC-21)
- [ ] **GATE-07**: DEBT triage automation — auto-classify and route
      review-sourced DEBT items (UC-23)
- [ ] **GATE-08**: S1 escalation auto-trigger — deferred 2+ times auto-promotes
      to S1 with DEBT entry (UC-27)
- [ ] **GATE-09**: Temporal coverage monitoring — detect and surface time-period
      gaps in review data (UC-30)

### Integration & Cutover

- [ ] **INTG-01**: Session-start wiring — health:quick check integrated into
      session startup (GSD_CONTEXT)
- [ ] **INTG-02**: Session-end wiring — health:score integrated into session
      shutdown (GSD_CONTEXT)
- [ ] **INTG-03**: Gemini review config moved in-repo for version control
      (UC-26)
- [ ] **INTG-04**: Cross-doc sync gap closure verification — confirm all sync
      gaps resolved (UC-33)
- [ ] **INTG-05**: Compaction safeguards — ecosystem state survives context
      compaction (UC-18)
- [ ] **INTG-06**: v1-to-v2 cutover — swap session-start/hooks to v2 scripts,
      keep v1 as fallback (Q11)
- [ ] **INTG-07**: Full E2E smoke test on real data — markdown to JSONL to
      consolidation to patterns to enforcement (Q3)
- [ ] **INTG-08**: Composite score baseline — establish initial B+ target
      metrics (UC-35)

### Testing (Cross-Cutting)

- [ ] **TEST-01**: Contract tests for all 10 data handoff points between scripts
      (Q3)
- [ ] **TEST-02**: E2E smoke test covering full pipeline end-to-end (Q3)
- [ ] **TEST-03**: 39 test files across 5 tiers — unit, contract, integration,
      E2E, performance (UC-38)
- [ ] **TEST-04**: Performance budget enforcement — <3s/gate, <10s pre-commit,
      <30s session-start (UC-11)
- [ ] **TEST-05**: Every script committed with its tests — no untested code
      lands (UC-42)
- [ ] **TEST-06**: Pipeline functions tested against all 3 fixture types (full,
      partial, stub) — none throw (UC-2)

## v2 Requirements

Deferred beyond ecosystem v2 rebuild.

### Skill Rationalization

- **SKIL-01**: Audit and consolidate 27 review-related skills (6 core + 21
  variants)
- **SKIL-02**: Merge overlapping skill functionality where appropriate

### Advanced Analytics

- **ANLZ-01**: ML-based pattern detection (beyond recurrence counting)
- **ANLZ-02**: Developer productivity correlation with review metrics
- **ANLZ-03**: Predictive analytics for review duration and complexity

## Out of Scope

| Feature                         | Reason                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| Skill rationalization           | Skills work individually; fix data not skill count (Q6, NG-11)    |
| Database migration (SQLite/PG)  | JSONL format sufficient for this scale (Q1)                       |
| Real-time collaboration         | Single-developer workflow                                         |
| New external integrations       | SonarCloud + Qodo + Gemini covers current needs                   |
| Mobile/web dashboard UI         | CLI interactive dashboard is target (UC-13)                       |
| Suggested-rules.md preservation | Dead-end artifact replaced by auto-rule generation (UC-4)         |
| Manual /add-debt in review flow | Replaced by auto-deferred-item creation (UC-8)                    |
| sync-reviews-to-jsonl.js        | Eliminated by JSONL-first architecture — no more markdown parsing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| STOR-01     | Phase 1 | Complete |
| STOR-02     | Phase 1 | Complete |
| STOR-03     | Phase 1 | Complete |
| STOR-04     | Phase 1 | Complete |
| STOR-05     | Phase 1 | Complete |
| STOR-06     | Phase 1 | Complete |
| STOR-07     | Phase 1 | Complete |
| STOR-08     | Phase 1 | Complete |
| STOR-09     | Phase 1 | Complete |
| BKFL-01     | Phase 2 | Complete |
| BKFL-02     | Phase 2 | Complete |
| BKFL-03     | Phase 2 | Complete |
| BKFL-04     | Phase 2 | Complete |
| BKFL-05     | Phase 2 | Complete |
| BKFL-06     | Phase 2 | Complete |
| BKFL-07     | Phase 2 | Complete |
| PIPE-01     | Phase 3 | Complete |
| PIPE-02     | Phase 3 | Complete |
| PIPE-03     | Phase 3 | Complete |
| PIPE-04     | Phase 3 | Complete |
| PIPE-05     | Phase 3 | Complete |
| PIPE-06     | Phase 3 | Complete |
| PIPE-07     | Phase 3 | Complete |
| PIPE-08     | Phase 3 | Complete |
| PIPE-09     | Phase 3 | Complete |
| PIPE-10     | Phase 3 | Complete |
| ENFR-01     | Phase 4 | Pending  |
| ENFR-02     | Phase 4 | Pending  |
| ENFR-03     | Phase 4 | Pending  |
| ENFR-04     | Phase 4 | Pending  |
| ENFR-05     | Phase 4 | Pending  |
| ENFR-06     | Phase 4 | Pending  |
| ENFR-07     | Phase 4 | Pending  |
| HLTH-01     | Phase 5 | Pending  |
| HLTH-02     | Phase 5 | Pending  |
| HLTH-03     | Phase 5 | Pending  |
| HLTH-04     | Phase 5 | Pending  |
| HLTH-05     | Phase 5 | Pending  |
| HLTH-06     | Phase 5 | Pending  |
| GATE-01     | Phase 6 | Pending  |
| GATE-02     | Phase 6 | Pending  |
| GATE-03     | Phase 6 | Pending  |
| GATE-04     | Phase 6 | Pending  |
| GATE-05     | Phase 6 | Pending  |
| GATE-06     | Phase 6 | Pending  |
| GATE-07     | Phase 6 | Pending  |
| GATE-08     | Phase 6 | Pending  |
| GATE-09     | Phase 6 | Pending  |
| INTG-01     | Phase 7 | Pending  |
| INTG-02     | Phase 7 | Pending  |
| INTG-03     | Phase 7 | Pending  |
| INTG-04     | Phase 7 | Pending  |
| INTG-05     | Phase 7 | Pending  |
| INTG-06     | Phase 7 | Pending  |
| INTG-07     | Phase 7 | Pending  |
| INTG-08     | Phase 7 | Pending  |
| TEST-01     | Phase 1 | Complete |
| TEST-02     | Phase 7 | Pending  |
| TEST-03     | Phase 7 | Pending  |
| TEST-04     | Phase 7 | Pending  |
| TEST-05     | Phase 7 | Pending  |
| TEST-06     | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 59 total
- Mapped to phases: 59
- Unmapped: 0

**Notes:**

- TEST-03 (39 test files) and TEST-05 (test-alongside mandate) are cross-cutting
  constraints enforced from Phase 1 onward per PROJECT.md. Assigned to Phase 7
  for formal verification but the constraint applies throughout.

---

_Requirements defined: 2026-02-28_ _Last updated: 2026-02-28 after roadmap
creation (v1.1 — traceability updated, TEST-03/TEST-05 assigned to Phase 7)_
