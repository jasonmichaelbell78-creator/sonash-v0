<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# GSD Project Context: PR Review Ecosystem v2

**Created:** 2026-02-28 (Session #197) **Purpose:** Context package for
`/gsd:new-project` plan compilation **Status:** Ready for plan compilation next
session

---

## Project Summary

Full v2 rebuild of the PR Review Ecosystem based on the comprehensive diagnosis
in `docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md`. 60 decisions recorded across 20
Q&A items and 42 user comments (UC-1 through UC-42), plus 1 intentional deferral
(NG-11 skill sprawl).

**Current grade:** D+ (from diagnosis) **Target:** B+ within 3 months, A within
6 months

---

## Source Documents (read these for plan compilation)

### Primary

1. **`.planning/ecosystem-v2/DISCOVERY_QA.md`** — ALL 60 decisions. This is the
   authoritative decision record. ~1200 lines.
2. **`docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md`** — The diagnosis that started
   this. 27 gaps, 7 layers, 35 components. ~1070 lines.

### Reference (consult as needed during planning)

3. **`CLAUDE.md`** — Project rules, stack versions, anti-patterns
4. **`docs/agent_docs/CODE_PATTERNS.md`** — Current 275 patterns, compliance
   rules
5. **`docs/agent_docs/FIX_TEMPLATES.md`** — Current 34 templates
6. **`docs/AI_REVIEW_PROCESS.md`** — Current review workflow
7. **`.claude/skills/pr-review/SKILL.md`** — Current pr-review protocol
8. **`.claude/skills/pr-retro/SKILL.md`** — Current pr-retro protocol
9. **`scripts/sync-reviews-to-jsonl.js`** — v1 sync script (to be deleted)
10. **`scripts/run-consolidation.js`** — v1 consolidation (to be merged)
11. **`scripts/promote-patterns.js`** — v1 promotion (to be rewritten)
12. **`scripts/check-pattern-compliance.js`** — v1 compliance (to be expanded)
13. **`scripts/check-cross-doc-deps.js`** — v1 cross-doc (to be recalibrated)
14. **`.claude/state/reviews.jsonl`** — Current JSONL (45 entries, broken)
15. **`docs/archive/REVIEWS_*.md`** — 13 archive files for backfill

---

## GSD Configuration Decisions

| Setting         | Choice                                                | Rationale                                            |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Approach        | `/gsd:new-project`                                    | Multi-phase, multi-session project                   |
| Parallelization | Safe parallelization, otherwise sequential            | User preference — don't risk data corruption         |
| Build order     | Best judgment (recommended: storage first)            | Everything depends on JSONL layer                    |
| v1/v2 cutover   | Parallel build then swap (Q11)                        | v2 in `scripts/reviews/`, v1 stays, swap when tested |
| Session budget  | No fixed target — however long it takes               | User directive                                       |
| Testing mandate | Test-alongside every commit (UC-42)                   | No script lands without its test                     |
| Doc mandate     | Update docs in same commit as behavior change (UC-42) | No separate docs phase                               |

---

## Key Architecture Decisions (quick reference)

- **JSONL-first** (UC-1): AI writes structured JSONL → markdown is generated
  view
- **Split JSONL files**: reviews.jsonl, retros.jsonl, deferred-items.jsonl,
  invocations.jsonl, warnings.jsonl — each with Zod schema
- **Three-tier completeness** (UC-2): full/partial/stub with
  completeness_missing
- **Structured origin** (Q14): Zod-validated object replaces string source IDs
- **Tiered enforcement** (UC-3): Regex + ESLint AST + Semgrep + AI context
- **Full automation chain**: Review → archive → recurrence → promote →
  CODE_PATTERNS → enforcement rule → FIX_TEMPLATE → claude.md (UC-31)
- **57 metrics, 8 categories, composite score** (UC-35)
- **13 dashboard dimensions** with interactive drill-down (UC-13)
- **39 test files** across 5 tiers (UC-38)
- **Performance budgets**: <3s/gate, <10s pre-commit, <30s session-start (UC-11)

---

## Recommended Phase Structure (for GSD planner)

Based on dependency analysis of the 60 decisions:

**Phase 1 — Foundation (Storage Layer)**

- Zod schemas for all 5 JSONL files
- Write/read utility library with validation
- completeness tier logic + hasField() helper
- Fixtures for all 3 tiers
- Contract tests for write paths
- _Everything else depends on this_

**Phase 2 — Backfill & Data Migration**

- Archive cleanup (UC-24)
- Backfill parser for 13 archives + active log
- Existing DEBT dedup (UC-39)
- Retro arithmetic tagging (UC-40)
- Consolidation counter fix (UC-29)
- Pattern #5/#13 correction (UC-25)

**Phase 3 — Core Pipeline (Capture → Enforcement)**

- pr-review skill: JSONL-first write path
- pr-retro skill: JSONL-first write path + dual-writes
- Auto-deferred-item creation (UC-8)
- Unified invocation tracker (UC-9)
- Promotion script rewrite (Q20 merge + Q16 auto-generation)
- claude.md auto-generation (UC-31)
- FIX_TEMPLATE auto-stubs (UC-22)
- 3 security FIX_TEMPLATES authored (UC-41)

**Phase 4 — Enforcement Expansion**

- Semgrep custom rules (UC-3: 20-30 rules)
- ESLint new rules (UC-3: 5-10 rules)
- Regex expansion (UC-3: 10-15 rules)
- Pattern lifecycle tracking (UC-36)
- All 7 active pattern enforcement mechanisms (UC-36)

**Phase 5 — Health Monitoring & Dashboard**

- All 10 health check scripts (UC-37)
- 57-metric composite scoring (UC-35)
- ecosystem-health-log.jsonl persistence
- `/ecosystem-health` interactive dashboard skill (UC-13)
- Warning lifecycle system (UC-12)

**Phase 6 — Gate Recalibration & Automation**

- Cross-doc gate recalibration + auto-fix mode (UC-28, UC-32)
- Override analytics (UC-32)
- Auto-archive reviews (UC-19)
- Qodo suppression pruning (UC-20)
- SECURITY_CHECKLIST sync (UC-21)
- DEBT triage automation (UC-23)
- S1 escalation auto-trigger (UC-27)
- Temporal coverage monitoring (UC-30)

**Phase 7 — Integration & Cutover**

- Session-start/end wiring (health:quick, health:score)
- Gemini config in-repo (UC-26)
- Cross-doc sync gap closure verification (UC-33)
- Compaction safeguards (UC-18)
- v1→v2 cutover (swap scripts, delete v1)
- Full E2E smoke test on real data
- Composite score baseline

**Note:** This is a SUGGESTED structure for the GSD planner. The actual plan may
reorganize based on dependency analysis and parallelization opportunities.

---

## Gap Coverage Verification

All 27 diagnosis gaps accounted for:

- 26/27 fully addressed by UC decisions
- 1/27 intentionally deferred (NG-11 skill sprawl)

See DISCOVERY_QA.md "Gap Catalog Final Scorecard" section for full mapping.

---

## Decisions Index (for quick lookup)

**Q1-Q20:** Strategic direction, backfill, testing, scope, enforcement, data
model, migration, dashboards, performance, staleness, consolidation merge,
parallel build, rule generation, origin field, Semgrep, invocation tracking

**UC-1 to UC-10:** JSONL-first, completeness tiers, enforcement tiers,
suggested-rules elimination, investment areas, layer priorities, skill UX,
manual step automation, unified invocations, anti-staleness

**UC-11 to UC-20:** Over-engineering guardrails, warning lifecycle, interactive
dashboard, test strategy, 5-layer field defense, graceful degradation, retro
JSONL-first, compaction safeguards, review archival, Qodo pruning

**UC-21 to UC-30:** Security checklist sync, FIX_TEMPLATE auto-gen, DEBT triage,
archive cleanup, pattern correction, Gemini config, S1 escalation, cross-doc
auto-fix, consolidation counter, temporal coverage

**UC-31 to UC-42:** claude.md auto-gen, gate recalibration + override
accountability, close all cross-doc gaps, effectiveness metrics, composite
scoring (57 metrics), pattern staleness resolution, health invocation
architecture, complete test catalog (39 files), DEBT dedup, retro arithmetic,
security FIX_TEMPLATES, continuous testing + doc maintenance mandate
