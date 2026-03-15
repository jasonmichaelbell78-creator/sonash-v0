# SWS Decisions by Phase — Index

**Generated:** 2026-03-15 (Session #221)
**Source:** DECISIONS.md (D1-D92), DECISIONS-reeval.md (Q1-Q38), Tenets (T1-T24)
**Purpose:** Ensure all prior decisions surface when planning each phase (per Q38)

**Usage:** Before planning any phase, read this section. Deep-plan skill MUST present
these decisions before discovery questions begin. Convergence loop verification MUST
cross-check that all tagged decisions appear in the resulting plan.

---

## Phase 0: Pre-Requisites

| ID | Summary |
|----|---------|
| Q4 | GAP-ANALYSIS Resolution — resolve inline during deep-plan |
| Q5 | /convergence-loop Build When — Step 0 pre-requisite |
| Q7 | Completed Work Verification — verify Hooks with /convergence-loop |
| Q14 | BEHAVIORAL->GATE Reclassification — 4 annotations in CLAUDE.md |
| Q15 | CLAUDE.md Annotation Bug — fix now |
| Q20 | Checkpoint Tags — descoped, state files approach working |
| Q24 | Operational Visibility — extract 5 framework items to SWS steps |
| Q27 | Folder Consolidation — git mv child plans under SWS |
| Q33 | Framework-Repo Disposition — archive |
| Q38 | Decision Recall Mechanism — 4-layer guarantee |
| D77 | Decision artifact architecture — JSONL + coordination.json |
| T20 | research_convergence_loops — /convergence-loop skill |

**Count: 12 decisions**

---

## Phase 1: CANON Foundation

| ID | Summary |
|----|---------|
| D1 | CANON ecosystem definition |
| D2 | Maturity levels + criteria (also P3) |
| D3 | Per-ecosystem maturity targets (also P3) |
| D4 | Maturity assessment checklist (also P3) |
| D5 | Configuration parameterization — global defaults + per-ecosystem cascade (also P3) |
| D6 | Naming conventions (also P3) |
| D7 | CANON directory structure |
| D8 | Lifecycle management + graduation (also P3, P5) |
| D9 | Maturity gating rules (also P3, P5) |
| D10 | Monitoring and dashboards (also P3) |
| D11 | Ecosystem boundary rules (also P3) |
| D12 | Cross-ecosystem dependency rules |
| D13 | Compliance scoring (also P3, P5) |
| D14-D20 | Schema definitions, health checkers, interfaces (also P3) |
| D21 | .canon/ directory structure (also P3) |
| D22-D27 | Extensibility, migration, validation, parameterization (also P3) |
| D28-D32 | Tenet architecture, JSONL decomposition |
| D49 | Breaking changes ship WITH migration scripts (also P3) |
| D55 | Two-doc system concept |
| D57 | CANON solo in Wave 1 |
| D64 | Schema-first enforcement (also cross-cutting) |
| D72 | Enforcement mechanism selection (also cross-cutting) |
| D74 | Schema versioning (also P3) |
| D76 | Learning capture infrastructure (also P3, P5) |
| D77 | Decision artifact architecture + coordination.json (also P0) |
| D79 | JSONL decomposition for planning artifacts |
| D84 | Decision supersession protocol (also cross-cutting) |
| D85 | Decision amendment protocol + JSONL-MD sync (also cross-cutting) |
| D86 | Migration path mechanics (also P3) |
| D88 | Tenet alignment soft reminder at batch gate (also cross-cutting) |
| D91 | Planning artifact hierarchy and precedence (also cross-cutting) |
| D92 | Implementation sequence (also P3) |
| Q6 | CANON Phase Scope — Full Spec Phased Delivery (also P3) |
| Q8 | Schema-less State Files — incremental (also P3) |
| Q9 | Tenet Amendments — replace T7/T8/T9/T11 |
| Q11 | Enforcement Documentation — fix + auto-generate (also P3) |
| Q16 | C1 Version Trajectory — obsolete (Zod 4 installed) |
| Q19 | CANON Infra — Phase deliverables (also P3) |
| Q21 | Overwrite Protection — shadow-append (also cross-cutting) |
| Q25 | Planning Migration — selective (also P3) |
| Q30 | Learning Router Schema Contract (also P2, cross-cutting) |
| Q31 | Forward-Findings Pipeline (also P2, cross-cutting) |
| Q32 | Zod Versioning — Zod 4 only (also cross-cutting) |
| Q34 | Canon Enforcement Model — progressive + acknowledgment-gated (also cross-cutting) |
| Q35 | No Silent Fails — all failures surfaced (also P2, cross-cutting) |
| Q36 | No Orphans — proactive discovery (also P2, cross-cutting) |
| Q37 | Skill Audit Pipeline — update skill-audit first (also P3) |
| Q38 | Decision Recall Mechanism — 4-layer guarantee (also P0, cross-cutting) |
| T1 | canon_is_ecosystem_zero |
| T2 | source_of_truth_generated_views (also cross-cutting) |
| T3 | maturity_is_measurable (also P3) |
| T4 | jsonl_first (also cross-cutting) |
| T5 | contract_over_implementation (also P3) |
| T6 | room_for_growth |
| T7 | platform_agnostic_by_default (also cross-cutting) |
| T8 | automation_over_discipline (also P2, cross-cutting) |
| T9 | crash_proof_state (also P4) |
| T10 | validate_before_scaling (also P3) |
| T11 | fail_loud_fail_early (also cross-cutting) |
| T12 | idempotent_operations (also cross-cutting) |
| T16 | single_ownership_many_consumers (also P3) |
| T17 | declarative_over_imperative |
| T18 | changelog_driven_traceability (also P3, P5, cross-cutting) |
| T21 | shadow_append_protection (also cross-cutting) |
| T24 | robust_testing_required (also P4) |

**Count: 60+ decisions/tenets**

---

## Phase 2: Meta-Pipeline Execution

| ID | Summary |
|----|---------|
| Q2 | Meta-Pipeline Sequencing — overlapping with gates |
| Q3 | Decision Absorption Numbering — grouped blocks |
| Q10 | Auto-DEBT Remediation — differentiated |
| Q12 | Skill Invocation Cleanup — defer to Tooling |
| Q13 | patterns:check Severity — rationalize |
| Q22 | Script Mismatches — fix during Tooling |
| Q28 | Integration Specs — inline in PLAN.md |
| Q29 | Ratchet Baseline Ownership — extract to shared lib |
| Q30 | Learning Router Schema — unified intake (also P1, cross-cutting) |
| Q31 | Forward-Findings Pipeline (also P1, cross-cutting) |
| Q35 | No Silent Fails (also P1, cross-cutting) |
| Q36 | No Orphans (also P1, cross-cutting) |
| D63 | Sequential-first execution model (also P3, cross-cutting) |
| T8 | automation_over_discipline (also P1, cross-cutting) |

**Count: 14 decisions/tenets**

---

## Phase 3: Ecosystem Standardization

| ID | Summary |
|----|---------|
| D2-D6 | Maturity levels, targets, assessment, config, naming |
| D8-D11 | Lifecycle, gating, monitoring, boundaries |
| D13-D20 | Compliance, schemas, health checkers, interfaces |
| D21-D27 | Directory structure, extensibility, migration, validation |
| D33-D54 | Per-ecosystem decisions (Skills, Hooks, PR Review, Docs, Testing, Sessions, TDMS, Scripts, CI/CD, Alerts, Analytics, Agents, Audits, Archival) |
| D56 | Wave structure (superseded by D63 tier structure) |
| D58-D62 | Tier 2-3 ecosystem decisions |
| D63 | Sequential-first execution (also P2, cross-cutting) |
| D65-D70 | Ecosystem exit criteria, ROADMAP integration |
| D73-D76 | Late-stage ecosystem decisions |
| D80-D83 | Verification, audit, post-completion decisions |
| D86 | Migration mechanics (also P1) |
| D89 | Ecosystem-specific decisions |
| D92 | Implementation sequence (also P1) |
| Q6 | CANON Phase Scope — Phases 2-4 run during P3 (also P1) |
| Q8 | Schema-less State Files — cleanup during P3 (also P1) |
| Q11 | Enforcement Documentation (also P1) |
| Q19 | CANON Infra deliverables (also P1) |
| Q24 | Operational Visibility extraction (also P0) |
| Q25 | Planning Migration (also P1) |
| Q26 | CAPTURE_MANIFEST Consumption (also P5) |
| Q34 | Canon Enforcement — each ecosystem sets own rules (also P1, cross-cutting) |
| Q37 | Skill Audit Pipeline (also P1) |
| T3 | maturity_is_measurable (also P1) |
| T5 | contract_over_implementation (also P1) |
| T10 | validate_before_scaling (also P1) |
| T13 | plan_as_you_go (also cross-cutting) |
| T16 | single_ownership_many_consumers (also P1) |
| T18 | changelog_driven_traceability (also P1, P5, cross-cutting) |
| T19 | extensive_discovery_first |
| T20 | research_convergence_loops (also P0, P5, cross-cutting) |
| T23 | all_planning_via_deep_plan (also cross-cutting) |

**Count: 65+ decisions/tenets**

---

## Phase 4: L4 Testing

| ID | Summary |
|----|---------|
| D47 | Testing ecosystem assessment L3->L4 (also P3) |
| Q23 | Testing Strategy — L4 as explicit planned phase (also P2) |
| T9 | crash_proof_state — chaos/failure-mode tests (also P1) |
| T24 | robust_testing_required (also P1) |

**Count: 4 decisions/tenets**

---

## Phase 5: Final Verification

| ID | Summary |
|----|---------|
| D8 | Lifecycle management graduation |
| D9 | Maturity gating rules |
| D13 | Compliance scoring |
| D67 | Exit criteria verification |
| D76 | Learning capture verification |
| D81-D83 | Post-completion verification decisions |
| Q26 | CAPTURE_MANIFEST Consumption (also P3) |
| T18 | changelog_driven_traceability (also P1, P3, cross-cutting) |
| T20 | research_convergence_loops (also P0, P3, cross-cutting) |

**Count: 10 decisions/tenets**

---

## Cross-Cutting (All Phases)

| ID | Summary |
|----|---------|
| Q1 | 21-Step Collapse — full restructure |
| Q5 | /convergence-loop — pre-requisite tool |
| Q17 | Effort Estimates — composite CANON standard |
| Q18 | Wrong Decision Ref — fixes itself |
| Q21 | Overwrite Protection — shadow-append |
| Q30 | Learning Router — unified intake |
| Q31 | Forward-Findings Pipeline |
| Q32 | Zod Versioning — Zod 4 only |
| Q34 | Canon Enforcement — progressive model |
| Q35 | No Silent Fails |
| Q36 | No Orphans |
| Q38 | Decision Recall Mechanism |
| D63 | Sequential-first execution model |
| D64 | Schema-first enforcement |
| D69 | Per-ecosystem exit criteria template |
| D70 | ROADMAP integration protocol |
| D71 | Ongoing project work — interleaved |
| D72 | Enforcement mechanism selection |
| D75 | Cross-ecosystem learning capture |
| D78 | Safety/redundancy for planning artifacts |
| D80 | Post-ecosystem verification protocol |
| D84 | Decision supersession protocol |
| D85 | Decision amendment protocol |
| D87 | Effort size calibration |
| D88 | Tenet alignment reminder at batch gate |
| D90 | No hardcoded counts |
| D91 | Planning artifact hierarchy |
| T2 | source_of_truth_generated_views |
| T4 | jsonl_first |
| T7 | platform_agnostic_by_default |
| T8 | automation_over_discipline |
| T11 | fail_loud_fail_early |
| T12 | idempotent_operations |
| T13 | plan_as_you_go |
| T14 | capture_everything_surface_what_matters |
| T15 | interactivity_first |
| T18 | changelog_driven_traceability |
| T20 | research_convergence_loops |
| T21 | shadow_append_protection |
| T22 | honest_findings_only |
| T23 | all_planning_via_deep_plan |

**Count: 41 decisions/tenets**

---

## Convergence Loop Record

| Pass | Findings | T20 Tally |
|------|----------|-----------|
| Pass 1 | 125 D/Q decisions tagged | Initial mapping |
| Pass 2 | 10 corrections, 24 tenets untagged | 80 confirmed, 10 corrected, 24 new |
| Pass 3 | Corrections applied, index generated | Pending verification |
