# Gap Analysis: PLAN.md v1.0

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-04
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

## Overview

Three parallel audit agents ran against PLAN.md (21 steps, 92 decisions, 18
tenets, 41 directives) covering 12 domains across 2 tiers of the D81 audit
framework. All 3 agents completed successfully.

| Agent       | Domains                                                            | Status   |
| ----------- | ------------------------------------------------------------------ | -------- |
| Tier 1 Core | Decision Coverage, Tenet Alignment, Directive Compliance,          | COMPLETE |
|             | Sequence Integrity, Artifact Completeness                          |          |
| Tier 2 6-8  | Gap Analysis, Re-Research with Fresh Eyes, Contradiction Detection | COMPLETE |
| Tier 2 9-12 | Risk Assessment, Cross-Ecosystem Impact, Knowledge Base, Rollback  | COMPLETE |

---

## Contradictions (must resolve — internal inconsistencies)

| #   | Source               | Finding                                                                                                                                                                                                       | Severity |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| C1  | D13/D76 vs Idea #45  | **Version trajectory conflict:** D13 and D76 say promote to 1.0.0 at Checkpoint #1. PLAN follows Idea #45: stay in 0.x, promote to 1.0.0 only at Step 21. Plan is correct in intent — D13/D76 need amendment. | HIGH     |
| C2  | PLAN header vs table | **Effort estimate mismatch:** Header says "40-60 sessions," table computes 80-130. Header is stale from earlier wave estimate.                                                                                | HIGH     |
| C3  | PLAN line 63         | **Wrong decision reference:** TDMS Pre-Check heading cites `D38` (Alerts ecosystem row) — should be `directive #38`.                                                                                          | LOW      |

---

## Hard Blockers (GAP — must resolve before execution)

| #   | Source   | Finding                                                                                                                                                                                         | Action Required                                                                                                                                |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | D86      | Migration mechanics (conventions, tooling, testing, rollback) were **explicitly deferred to PLAN.md** with a `plan_md_requirement` field but not defined anywhere                               | Add `## Migration Mechanics` section to Step 1 defining naming conventions, file locations, up/down format, dry-run testing, rollback behavior |
| G2  | D78      | Checkpoint git tags (`canon-checkpoint-1` through `canon-checkpoint-4`) and MCP episodic memory summaries have no implementation step                                                           | Add to each checkpoint step: create git tag + MCP memory summary                                                                               |
| G3  | D84      | Supersession protocol enforcement (mandatory `superseded_by`, `status`, `supersession_note` fields) not wired into pre-commit hook                                                              | Add to Step 1e                                                                                                                                 |
| G4  | D92      | Ecosystem tagging backfill mandated "during PLAN.md phase" — absent                                                                                                                             | Execute backfill (add `ecosystems` array to JSONL) as pre-execution task                                                                       |
| G5  | #9       | PR creep guard: user explicitly requested "SOON," no step assigned                                                                                                                              | Add to Step 3 (Hooks)                                                                                                                          |
| G6  | #39      | Non-truncation validation for generated views: no enforcement gate                                                                                                                              | Add to each generator's "Done when" criteria                                                                                                   |
| G7  | D89      | Dependency graph: (1) linear chain only — lateral deps invisible, (2) no critical path identification, (3) no D68 skip-and-return validation                                                    | Enrich Mermaid diagram with lateral edges + add critical path + validate D68 viability                                                         |
| G8  | Domain 6 | `scan-changelog.js` path inconsistency: Step 1 creates it in `.canon/scripts/` but Cross-Cutting section calls `scripts/debt/scan-changelog.js`                                                 | Decide canonical path, fix references                                                                                                          |
| G9  | Domain 6 | Operational Visibility Sprint supersession not closed — ROADMAP still shows it as BLOCKED but plan doesn't archive/reconcile it                                                                 | Add task to migrate surviving work items to Track-CANON and retire sprint                                                                      |
| G10 | Domain 7 | `generate-doc-index.js` (Step 5) vs actual `generate-documentation-index.js` — name mismatch will cause confusion or duplicate                                                                  | Fix filename reference in Step 5                                                                                                               |
| G11 | D77      | Planning artifact migration scope: D77 says full JSONL set migrates to `.canon/` as first test case, but plan only migrates tenets. Decisions, directives, ideas, changelog disposition unclear | Define what migrates vs what stays in `.planning/`                                                                                             |

---

## Material Risks (RISK — addressable with amendments)

### Architecture & Design

| #   | Source   | Finding                                                                                                                                                                                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | D4       | Cross-cutting subsystem map: no artifact path, no assigned step                                                                                                                                        |
| R2  | D16      | 3-layer naming convention standard (files/exports/JSONL fields): no output file named                                                                                                                  |
| R3  | D19      | Pilot+rollout validation gate missing — no check that pilot ecosystems proved out the pattern before applying to remaining 15                                                                          |
| R4  | T6/#12   | `room_for_growth`: extensible-core schema pattern demonstrated in Step 1 but no per-step design gate for Steps 2-21                                                                                    |
| R5  | Domain 7 | Existing 10-checker health system (`scripts/health/checkers/`, 64 metrics) not addressed for CANON format migration — plan creates a new interface standard (D25) but doesn't bridge existing checkers |
| R6  | Domain 7 | 7 existing ecosystem audit skills (`hook-ecosystem-audit`, `pr-ecosystem-audit`, etc.) not integrated into exit criteria (D69) — these are directly applicable but unleveraged                         |
| R7  | Domain 6 | `agent-research/` reference folder missing from knowledge base — 2.2MB of raw findings (9 files) cited in DIAGNOSIS but not preserved in reference material                                            |

### Process & Enforcement

| #   | Source      | Finding                                                                                                                                                               |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R8  | D82/T15/#17 | Interactive audit process: plan never specifies audits must be interactive                                                                                            |
| R9  | D85         | Amendment protocol + JSONL→MD sync enforcement: not in any step                                                                                                       |
| R10 | D88         | `backfill-tenet-evidence.js` already exists at `scripts/planning/` — Tier 2 confirmed it doesn't need creation, but its batch-gate integration is unspecified in plan |
| R11 | D90/#41     | Hardcoded counts (18 ecosystems, 21 steps, 37 scripts) in PLAN.md violate D90                                                                                         |
| R12 | D91         | Reading-order hierarchy not encoded as mandatory session protocol                                                                                                     |
| R13 | #6          | Overlap enforcement: no conflict-detection gate between ecosystems                                                                                                    |
| R14 | #24         | Planning docs "deletions" clause unaddressed (only additions covered)                                                                                                 |
| R15 | #25         | Checklist adaptation formalization applied only to Steps 8/18/19, not universally                                                                                     |
| R16 | #40         | JSONL→MD sync enforcement gate: no pre-commit check specified                                                                                                         |

### Artifact Completeness

| #   | Source     | Finding                                                                                      |
| --- | ---------- | -------------------------------------------------------------------------------------------- |
| R17 | Steps 4-21 | Per-ecosystem `assessment.jsonl`/`enforcement.jsonl`/`contracts/` paths not explicitly named |
| R18 | Steps 3-21 | Per-ecosystem Zod schema file paths unnamed                                                  |
| R19 | Steps 3-21 | Health checker script paths vague or missing                                                 |
| R20 | D73/Step 1 | TDMS pre-check missing from Step 1 (D73 scope is "#1-#7")                                    |

---

## Risk Assessment: Highest-Risk Steps

From Tier 2 Domain 9 analysis:

| Step                       | Completion | Scope Explosion | Dependency | Key Concern                                                                                |
| -------------------------- | ---------- | --------------- | ---------- | ------------------------------------------------------------------------------------------ |
| **Step 1 (CANON)**         | HIGH       | HIGH            | LOW        | 9 sub-tasks from scratch; self-dogfooding circular quality bar; schema mistakes cascade    |
| **Step 2 (Skills)**        | HIGH       | HIGH            | MEDIUM     | 62-65 skills with interactive audit; touches most ecosystems; no scope cap                 |
| **Step 3 (Hooks)**         | MEDIUM     | MEDIUM          | HIGH       | ~350-line pre-commit hook; framework-repo lists 8 additional waves; depends on Steps 1+2   |
| **Step 4 (Checkpoint #1)** | MEDIUM     | LOW             | HIGH       | **Single hardest dependency** — failure requires iterating Step 1 with no iteration budget |
| **Step 8 (TDMS Stage 1)**  | HIGH       | HIGH            | MEDIUM     | 37 scripts, 9-writer race condition, scope depends on pipeline complexity                  |
| **Step 9 (Scripts)**       | MEDIUM     | HIGH            | MEDIUM     | 300+ scripts; "largest scope delta" in plan; no triage/prioritization guidance             |

---

## Knowledge Base & Rollback Gaps

From Tier 2 Domains 11-12:

1. **Knowledge base not ready**:
   `.planning/system-wide-standardization/reference/framework-repo/` exists but
   is at v0.1.0/C+ (incomplete). No navigation index. Agent-research reference
   material missing.
2. **No rollback procedure**: If Checkpoint #1 reveals CANON is fundamentally
   flawed, there's no defined rollback path, cost estimate, or exit ramp.
3. **Retroactive compliance**: When CANON schemas change mid-execution, no
   mechanism tracks which already-completed ecosystems need updates.
4. **MASTER_DEBT migration**: The 9-writer race condition resolution pattern is
   undesigned.

---

## Tier 1 Coverage Summary

| Category                      | PASS | RISK         | GAP |
| ----------------------------- | ---- | ------------ | --- |
| Decision Coverage (D1-D92)    | 72   | 9            | 4   |
| Tenet Alignment (T1-T18)      | 16   | 2            | 0   |
| Directive Compliance (#1-#41) | 29   | 8            | 4   |
| Sequence Integrity (3 checks) | 2    | 1            | 0   |
| Artifact Completeness         | Core | 5 categories | 1   |

**Sequence integrity confirmed:** All 21 steps match DECISIONS.md ordering
perfectly. All 4 checkpoints at correct positions.

---

## Consolidated Action Items

### Must-Fix Before Approval (14 items)

**Contradictions:**

1. **C1: Version trajectory** — Amend D13/D76 to match Idea #45 trajectory (0.x
   through checkpoints, 1.0.0 at Step 21)
2. **C2: Effort header** — Update from "40-60 sessions" to "80-130 sessions"
3. **C3: D38 wrong ref** — Fix TDMS Pre-Check heading to cite `directive #38`

**Gaps:**

4. **G1: D86 migration mechanics** — Add `## Migration Mechanics` section
5. **G2: D78 checkpoint tags/MCP** — Add to Steps 4, 7, 15, 21
6. **G3: D84 supersession enforcement** — Add to Step 1e
7. **G7: D89 dependency graph** — Add lateral edges, critical path, D68
   validation
8. **G8: scan-changelog.js path** — Resolve `.canon/scripts/` vs `scripts/debt/`
9. **G9: Operational Visibility Sprint** — Close/archive in ROADMAP
10. **G10: generate-doc-index.js** — Fix filename reference
11. **G11: D77 planning artifact scope** — Define migration boundary

**Risk escalations:**

12. **Checkpoint #1 iteration budget** — Add effort estimate for failure loop
13. **Scope caps for Steps 2 and 9** — Add triage/prioritization guidance
14. **Existing health checkers** — Address CANON format migration for 10-checker
    system

### Should-Fix Before Approval (8 items)

15. G4: D92 ecosystem tagging backfill
16. G5: #9 PR creep guard in Step 3
17. G6: #39 non-truncation validation
18. R4: T6/T15 per-step enforcement language
19. R6: Integrate 7 existing audit skills into exit criteria
20. R17: Per-ecosystem artifact template (standardize paths)
21. R3: Pilot validation gate
22. R5: D13/D76 vs Idea #45 — formal amendment

### Nice-to-Fix (8 items)

23. R1: D4 cross-cutting subsystem map artifact
24. R2: D16 naming convention standard file path
25. R7: agent-research reference material recovery
26. R8: D82 interactive audit workflow spec
27. R10: D88 batch-gate integration
28. R12: D91 reading-order hierarchy encoding
29. R11: D90 hardcoded count compliance
30. R14: #24 planning doc deletions clause
