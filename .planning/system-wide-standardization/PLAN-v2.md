# System-Wide Standardization — Implementation Plan (v2)

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-14
**Status:** DRAFT — Pending Approval
**Decisions:** See [DECISIONS-reeval.md](./DECISIONS-reeval.md) (33 decisions)
**Diagnosis:** See [DIAGNOSIS-v2.md](./DIAGNOSIS-v2.md) (T3-verified, 4-pass convergence)
<!-- prettier-ignore-end -->

## Summary

Full restructure of the System-Wide Standardization plan from current reality
(per Q1). Replaces the original 21-step sequential ecosystem plan with a phased
approach: pre-requisites → CANON foundation → meta-pipeline (3 child plans,
overlapping with gates) → per-ecosystem standardization → L4 testing → final
verification. Child plan PLAN.md files are execution appendices under this
umbrella.

**Effort Estimate (CANON composite per Q17):**

| Metric       | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Complexity   | XL                                                                                    |
| Sessions     | ~60-90 (down from 80-130 — child plans reduce per-ecosystem work)                     |
| Waves        | 6 phases, child plans add ~30 internal waves                                          |
| Deliverables | CANON infrastructure, 3 child plan outputs, 18 standardized ecosystems, L4 test suite |

---

## Amended Tenets (T1-T24)

Foundation tenets T1-T6 unchanged. T7/T8/T9/T11 replaced with stronger versions
(per Q9). New tenets T20-T24 added from user directives and DIAGNOSIS-v2
findings.

### Unchanged (T1-T6, T10, T12-T19)

T1 canon_is_ecosystem_zero | T2 source_of_truth_generated_views | T3
maturity_is_measurable | T4 jsonl_first | T5 contract_over_implementation | T6
room_for_growth | T10 validate_before_scaling | T12 idempotent_operations | T13
plan_as_you_go | T14 capture_everything_surface_what_matters | T15
interactivity_first | T16 single_ownership_many_consumers | T17
declarative_over_imperative | T18 changelog_driven_traceability | T19
extensive_discovery_first

### Replaced (per Q9 — old wording archived in rationale)

**T7. platform_agnostic_by_default** (strengthened) All CANON artifacts,
scripts, and tooling MUST work identically across platforms. Node.js over bash.
`path.posix` for paths. LF line endings. **Enforcement:** Pre-commit hook
rejects bash-only scripts and backslash paths. _Previous: advisory only, no
enforcement mechanism._

**T8. automation_over_discipline** (strengthened) If enforcement relies on human
memory, it is a bug. Every rule MUST have an automated gate (hook, CI, script).
Rules without gates are aspirational, not real. Manual processes are tracked as
DEBT until automated. _Previous: "Automate enforcement or accept non-compliance"
— too permissive._

**T9. crash_proof_state** (strengthened) State MUST survive compaction, session
boundaries, crashes, and network failures. All state files MUST have Zod schemas
(new immediately, existing 42 incrementally per Q8). State recovery is tested,
not assumed. _Previous: no schema requirement, no testing requirement._

**T11. fail_loud_fail_early** (strengthened + merged with T\*new*9) Failures
MUST block, not warn. Pre-commit catches before PR. Session-start surfaces
before work begins. Silent failures are S0 severity. Warnings that persist 3+
sessions without action auto-escalate to DEBT (per escalation pattern from
Automation Gap Closure). **No passive surfacing of information — all data
surfaces MUST require action or acknowledgment.** Unacknowledged warnings become
wallpaper and are treated as bugs. \_Previous: "errors block, they don't
whisper" — no escalation, no passive surfacing prohibition.*

### New Tenets

**T20. research_convergence_loops** (T3 dual-form per Q5) Research requires
convergence loops, not single passes. Multi-agent, multi-angle. Each pass
verifies prior claims + explores new angles. Explicit tally
(Confirmed/Corrected/Extended/New). Convergence = no material corrections AND no
unexplored angles. Minimum 2 passes. All corrections cite evidence. **Skill:**
`/convergence-loop` — standalone skill, many callers. _See:
memory/t3_convergence_loops.md for full wording and integration targets._

**T21. shadow_append_protection** (per Q21) Source JSONL files are append-only
(sacred). Views are generated/regenerable. No script may overwrite a source
JSONL — only append. Automation enforces this (no human gate). Each plan
declares a scope manifest listing which JSONL files it writes to, enabling
design-time collision detection.

**T22. honest_findings_only** No placating. Findings, audits, and reports MUST
reflect actual state — never softened, hedged, or diplomatically framed to avoid
uncomfortable truths. If something is broken, say it's broken. If quality is
poor, say quality is poor. Honest assessment is a prerequisite for improvement.

**T23. all_planning_via_deep_plan** ALL non-trivial planning MUST use the
deep-plan method. No ad-hoc plans, no "quick outlines," no plans that skip
discovery. If it has 5+ design decisions, it gets a deep-plan. This ensures
exhaustive discovery, explicit decision records, and self-audit before
execution.

**T24. robust_testing_required** ALL testing MUST be robust — semantic,
functional, LSP-verified. Not just grep pattern matching or string presence
checks. Tests must verify actual behavior, not superficial indicators. Mock
boundaries must match real system boundaries. Test assertions must be meaningful
(not `expect(result).toBeDefined()`).

### Directive: Zod 4 Only (per Q32)

All schemas use Zod 4 syntax. No Zod 3 compatibility shims. Enforced immediately
across all plans.

### Directive: Composite Effort Estimates (per Q17)

No hours-based estimates anywhere in the project. All effort uses CANON
composite: complexity (S/M/L/XL) + sessions + waves + deliverables.

---

## Phase 0: Pre-Requisites

**Complexity:** M | **Sessions:** 2-3 | **Waves:** 1 | **Deliverables:** 7

Everything here MUST complete before Phase 1 begins. All steps are
parallelizable except Step 0.3 which depends on Step 0.1.

### Step 0.1: Build `/convergence-loop` Skill

Per Q5 — Step 0 pre-requisite before meta-pipeline. T20 defines WHEN/WHY, this
skill defines HOW.

**Implementation:**

- Create `.claude/skills/convergence-loop/SKILL.md` with agent prompt templates,
  tally formats, convergence decision logic, domain slicing patterns
- Skill takes: claims set + domain slicing strategy as input
- Skill outputs: verified claims set + convergence report
- Integration targets (high-value): deep-plan Phase 0, all 9+ audit skills, code
  review, /systematic-debugging, doc-code sync, plan self-audit
- Integration targets (medium): test generation, migration verification, PR
  review processing

**Done when:** Skill exists, is registered in skill registry, and has been
validated by running it against the DIAGNOSIS-v2.md claims (meta-test: the skill
verifies the document that motivated its creation).

### Step 0.2: Fix CLAUDE.md Annotation Bugs

Per Q14 + Q15 — immediate fixes.

**Implementation:**

- Reclassify 4 annotations from `[BEHAVIORAL]` to `[GATE: patterns:check]`:
  error sanitization, path traversal, test mocking, file reads
- Fix any other annotation mismatches found during reclassification

**Done when:** Every CLAUDE.md rule annotation accurately reflects its actual
enforcement mechanism. No BEHAVIORAL annotations on rules with GATE enforcement.

### Step 0.3: Verify Hooks PR #427

Per Q7 — run `/convergence-loop` on Hooks PR #427 (35 decisions, 6 learnings).
Verify claims about implementation completeness.

**Done when:** Convergence report confirms implementation matches plan, or
issues are logged for remediation. **Depends on:** Step 0.1 (needs the skill).

### Step 0.4: Folder Consolidation

Per Q27 — physical `git mv`.

**Implementation:**

- `git mv .planning/tooling-infrastructure-audit/ .planning/system-wide-standardization/tooling-infrastructure-audit/`
- `git mv .planning/code-quality-overhaul/ .planning/system-wide-standardization/code-quality-overhaul/`
- `git mv .planning/learnings-effectiveness-audit/ .planning/system-wide-standardization/learnings-effectiveness-audit/`
- Update all internal cross-references in moved files
- Update any external references (ROADMAP.md, SESSION_CONTEXT.md, state files)

**Done when:** All 3 child plan folders live under
`.planning/system-wide-standardization/`, all references updated,
`git log --follow` confirms history preserved.

### Step 0.5: Archive Framework-Repo

Per Q33 — codebase is the living reference.

**Implementation:**

- `git rm -r .planning/system-wide-standardization/reference/framework-repo/`
- Git history preserves the snapshot for future reference if needed

**Done when:** Directory removed. No broken references remain.

### Step 0.6: Update coordination.json

Reflect restructured plan state in the coordination file.

**Implementation:**

- Update `.planning/system-wide-standardization/coordination.json` to reference
  PLAN-v2.md, DECISIONS-reeval.md, consolidated child plan paths, and current
  phase status

**Done when:** `coordination.json` reflects restructured plan state. All file
references point to current (not stale) artifacts.

### Step 0.7: Operational Visibility Extraction

Per Q24 — extract 5 framework items, remove only those from ROADMAP sprint.

**Implementation:**

- Extract from Operational Visibility Sprint to SWS scope:
  - D2 (pre-commit optimization) → Phase 3 ecosystem: Hooks
  - D4 (CI gates) → Phase 3 ecosystem: CI/CD
  - D10 (script test coverage) → Phase 3 ecosystem: Scripts
  - E1 (warning collector hook) → Phase 3 ecosystem: Hooks
  - E2 (session health JSON) → Phase 3 ecosystem: Sessions
- Update ROADMAP.md: remove these 5 items from sprint, add note that sprint
  remains as app-level work
- Sprint itself stays in ROADMAP as app-level work (not archived)

**Done when:** 5 items documented in SWS ecosystem queue, removed from
Operational Visibility Sprint in ROADMAP, sprint still listed as app-level work.

---

## Phase 1: CANON Foundation (Phase 1 of 4)

**Complexity:** L | **Sessions:** 3-5 | **Waves:** 2 | **Deliverables:** 4

Per Q6 — Full Spec Phased Delivery. This phase delivers CANON Phase 1 (schemas)
which unblocks all child plans. CANON Phases 2-4 run in parallel with the
meta-pipeline (Phase 2 of this plan).

### Step 1.1: CANON Schema Definitions

Create `.canon/` repo root with foundational schemas.

**Implementation:**

- `.canon/schemas/` — Zod 4 schemas for:
  - Ecosystem declaration (name, owner, maturity level, health checker path)
  - Tenet declaration (id, name, wording, enforcement mechanism, version)
  - Directive declaration (id, scope, rule, enforcement)
  - Changelog entry (ecosystem, change_type, impact, timestamp)
  - Health checker output contract (T5)
  - Enforcement manifest entry (rule, gate_type, gate_path, severity)
  - `forward-findings.jsonl` entry schema (per Q31: source_plan, finding_type,
    pattern, severity, target_ecosystem, timestamp)
- `.canon/config/` — CANON configuration:
  - Shadow-append registry (per Q21: which JSONL files are sacred sources)
  - Scope manifests per plan (per Q21: design-time collision detection)
- All schemas in Zod 4 syntax (per Q32), no Zod 3 compat shims

**Done when:** All schemas parse and validate. At least one real artifact
validates against each schema (smoke test). Shadow-append registry lists all
known sacred JSONL files.

### Step 1.2: Migration Mechanics

Per G1 — conventions, tooling, testing, rollback for CANON adoption.

**Implementation:**

- Document migration path: how an ecosystem moves from current state to
  CANON-compliant (checklist derived from T3 maturity levels)
- Rollback procedure: if CANON adoption breaks an ecosystem, how to revert
- Migration tooling: script that validates an ecosystem's CANON compliance
  (reads declaration, checks health checker exists, verifies schema coverage)

**Done when:** Migration checklist exists. Validation script runs against at
least one ecosystem (PR Review — the CANON pilot per original Step 4).

**Phase 1 gate:** CANON schemas exist and validate. Child plans can proceed.

---

## Phase 2: Meta-Pipeline Execution

**Complexity:** XL | **Sessions:** 25-40 | **Waves:** 3 child plans (overlapping
per Q2) | **Deliverables:** Per child plan appendices

Per Q2 — overlapping with gates. Each child plan has its own PLAN.md as an
execution appendix. This section defines the gates between them and any
SWS-level additions not in the original child plans.

### Step 2.1: Tooling Infrastructure (Plan 1)

**Appendix:** `tooling-infrastructure-audit/PLAN.md` (9 steps, 4 waves)
**Decisions:** D93-D122 (per Q3 absorption numbering) **Complexity:** XL |
**Sessions:** 8-12 | **Waves:** 4

Execute the Tooling plan as-written, with these SWS-level additions:

- **Q29 addition:** During Step 7 (npm Script Audit), extract
  `ratchet-baselines.js` engine to `scripts/lib/ratchet-engine.js`. Keep
  metric-specific logic in calling scripts. Both CQ and DE consume the shared
  utility.
- **Q22 addition:** During Step 7, fix G8 (`scan-changelog.js` path
  inconsistency) and G10 (`generate-doc-index.js` filename mismatch).
- **Q12 addition:** During Step 4 (Agent Cleanup), handle skill invocation
  cleanup.
- **Q13 addition:** During Step 5 (ESLint), rationalize severity→stage mapping
  for `patterns:check`.

**Auto-DEBT remediation (per Q10):**

- **Tier-1 hard block** (true auto-DEBT — background/silent, no user
  invocation):
  - `log-override.js` (checkBypassDebtThreshold) — silently creates DEBT on
    threshold breach
  - `escalate-deferred.js` — silently escalates deferred items to DEBT
  - These MUST NOT create DEBT entries without interactive gate + user
    confirmation
- **Tier-2 confirmation step** (semi-auto — user invokes, but DEBT creation is a
  side-effect without explicit approval):
  - `intake-audit.js` — user invokes audit, DEBT created as side-effect
  - `sync-sonarcloud.js` — user invokes sync, DEBT created as side-effect
  - `intake-pr-deferred.js` — user invokes PR processing, deferred items created
    as side-effect
  - These MUST add confirmation step before DEBT creation/modification

**Done when:** All 9 Tooling plan steps complete. All SWS-level additions
implemented. Auto-DEBT remediation verified (both tiers). Gate checklist below
passes.

**Tooling → CQ gate (per Q2, Q28):** Before Code Quality can begin:

- [ ] Branch protection enabled
- [ ] All GitHub Actions SHA-pinned
- [ ] Dead agents/plugins removed
- [ ] ESLint plugin optimized (4 new rules active)
- [ ] npm scripts classified (ACTIVE/DEAD/REDUNDANT)
- [ ] Ratchet engine extracted to shared `scripts/lib/`

### Step 2.2: Code Quality Overhaul (Plan 2)

**Appendix:** `code-quality-overhaul/PLAN.md` (12 steps, 12 waves)
**Decisions:** D123-D148 (per Q3 absorption numbering) **Complexity:** XL |
**Sessions:** 10-15 | **Waves:** 12

**Overlap start:** May begin Phase 0 (research/deep-plan) while Tooling
completes its final wave (documentation). Must not begin implementation until
Tooling→CQ gate passes.

Execute the Code Quality plan as-written, with these SWS-level additions:

- **Q23 addition:** L3 testing is delivered as part of CQ scope. Wave 12 (Final
  Audit) includes test coverage verification.
- **Q30 addition:** CQ findings write to `forward-findings.jsonl` (per unified
  intake). Schema from CANON Phase 1 (Step 1.1).

**Done when:** All 12 CQ plan steps complete. All SWS-level additions
implemented. Forward-findings intake operational. Gate checklist below passes.

**CQ → DE gate (per Q2, Q28):** Before Data Effectiveness can begin new work:

- [ ] Zero ESLint warnings (2,124 → 0)
- [ ] Ratchet baselines established for all quality metrics
- [ ] Complexity violations remediated (358+ → within thresholds)
- [ ] All new validators passing in pre-commit
- [ ] CQ findings written to `forward-findings.jsonl`

### Step 2.3: Data Effectiveness (Plan 3)

**Appendix:** `learnings-effectiveness-audit/PLAN.md` (10 waves, 11 steps)
**Decisions:** D149-D183 (per Q3 absorption numbering) **Complexity:** XL |
**Sessions:** 6-10 | **Waves:** 10

**Note:** Partially implemented (Automation Gap Closure PR #431 + follow-up).
Remaining waves execute after CQ→DE gate passes.

**Overlap start:** Already-implemented portions (router, scaffolding, wiring)
continue operating. New waves begin after CQ→DE gate.

Execute the Data Effectiveness plan as-written, with these SWS-level additions:

- **Q31 addition:** DE produces findings to `forward-findings.jsonl` AND
  consumes from it. The learning-router reads `forward-findings.jsonl` as an
  intake source alongside its existing event-driven inputs.
- **Q30 addition:** Learning-router schema contract defined by CANON Phase 1
  schemas. CQ patterns enter through `forward-findings.jsonl`, not direct
  `learning-routes.jsonl` writes.

**Done when:** All 10 waves complete. Lifecycle scores for 40+ systems.
Learning-to-automation pipeline fully operational. Forward-findings consumed.

---

## Phase 3: Ecosystem Standardization

**Complexity:** XL | **Sessions:** 25-40 | **Waves:** 18 ecosystems in
dependency order | **Deliverables:** 18 standardized ecosystems at L3+ maturity

Per T13 (plan_as_you_go) — each ecosystem gets its own deep-plan when sequenced.
This phase defines the sequence and gates, not the per-ecosystem implementation
details.

### CANON Phases 2-4 (parallel track)

Per Q6 — CANON Phases 2-4 run in parallel with ecosystem standardization, after
Phase 1 schemas are in place.

**CANON Phase 2: Declarations** (per Q19: G4 → P2)

- Ecosystem lifecycle declarations for all 18 ecosystems
- Selective migration: `tenets.jsonl` and `directives.jsonl` to `.canon/` (per
  Q25). `decisions.jsonl`, `ideas.jsonl`, `changelog.jsonl` stay in
  `.planning/`.

**CANON Phase 3: Enforcement** (per Q19: G1 → P3, G3 → P3)

- Enforcement manifests per ecosystem (G1)
- Supersession protocol wired into pre-commit (G3)
- **ENFORCEMENT_MAP.md auto-generation (per Q11):** Create script that reads
  CLAUDE.md `[GATE:]` and `[BEHAVIORAL:]` annotations, cross-references with
  actual hook/CI gate implementations, and generates `ENFORCEMENT_MAP.md`. Runs
  on-demand and in session-start. **Done when:** Script exists, generates
  accurate map, no annotation/enforcement mismatches remain.
- Shadow-append enforcement automation (per Q21)

**CANON Phase 4: Governance**

- Amendment protocol for tenets and directives
- JSONL→MD sync enforcement in pre-commit (R16)
- Tenet evidence backfill integration (R10)

### Ecosystem Sequence

Dependency-ordered. Each ecosystem's standardization follows this process:

1. **Deep-plan** (T13, T19) — per-ecosystem discovery + decisions
2. **Execute** — implement standardization per deep-plan output
3. **Verify** — `/convergence-loop` on claims about completion (T20)
4. **Declare** — CANON ecosystem declaration with health checker

**Done when (per ecosystem):** Ecosystem reaches target maturity level per its
deep-plan output. CANON declaration filed. Health checker operational. Ecosystem
passes `/convergence-loop` verification.

**Priority Tier (Steps 3.1-3.7) — core infrastructure:**

| Order | Ecosystem      | Target | Depends On | Notes                                                              |
| ----- | -------------- | ------ | ---------- | ------------------------------------------------------------------ |
| 3.1   | Skills         | L1→L3  | Phase 1    | Daily tool. 62-65 skills audit.                                    |
| 3.2   | Hooks          | L3→L4  | 3.1        | Enforcement infra. PR #427 partial.                                |
| 3.3   | PR Review      | L4→L5  | 3.2        | **CANON pilot.** Validates framework works.                        |
| 3.4   | Docs           | L2→L3  | 3.3        | Standards for all subsequent ecosystems.                           |
| 3.5   | Testing        | L3→L4  | 3.4        | Test infrastructure.                                               |
| 3.6   | Sessions       | L1→L3  | 3.5        | State management. Extracted OV items E1, E2.                       |
| 3.7   | **Checkpoint** | —      | 3.1-3.6    | Core infrastructure complete. CANON validated via PR Review pilot. |

**Data Tier (Steps 3.8-3.12) — data-heavy ecosystems:**

| Order | Ecosystem      | Target | Depends On | Notes                                          |
| ----- | -------------- | ------ | ---------- | ---------------------------------------------- |
| 3.8   | TDMS Stage 1   | L2→L3  | 3.7        | 37 scripts get schemas + monitoring.           |
| 3.9   | Scripts        | L2→L3  | 3.8        | Script infra standards. Extracted OV item D10. |
| 3.10  | CI/CD          | L1→L3  | 3.9        | Pipelines. Extracted OV item D4.               |
| 3.11  | Alerts         | L2→L4  | 3.10       | Monitoring layer.                              |
| 3.12  | **Checkpoint** | —      | 3.8-3.11   | Data infrastructure standardized.              |

**Process Tier (Steps 3.13-3.18) — process + app ecosystems:**

| Order | Ecosystem           | Target | Depends On | Notes                                      |
| ----- | ------------------- | ------ | ---------- | ------------------------------------------ |
| 3.13  | Analytics           | L1→L3  | 3.12       | Aggregation. Builds on alerts.             |
| 3.14  | Agents              | L2→L3  | 3.12       | Agent definitions. Benefits from Skills.   |
| 3.15  | Audits              | L3→L4+ | 3.12       | All audits are skills. L4 with L5 pathway. |
| 3.16  | Archival/Rotation   | L3→L4  | 3.12       | Lifecycle patterns.                        |
| 3.17  | TDMS Stage 2        | L3→L4  | 3.16       | Enforcement manifest, testing.             |
| 3.18  | Roadmap & Execution | L2→L3  | 3.17       | Hub ecosystem. All inputs standardized.    |

**App Tier (Steps 3.19-3.22) — application layer:**

| Order | Ecosystem           | Target | Depends On | Notes                                        |
| ----- | ------------------- | ------ | ---------- | -------------------------------------------- |
| 3.19  | Frontend/App        | L2→L3  | 3.18       | App-layer.                                   |
| 3.20  | Firebase/Backend    | L1→L3  | 3.18       | Connection point contracts.                  |
| 3.21  | Docs (verification) | verify | 3.20       | Meta-check: all ecosystems' docs consistent. |
| 3.22  | TDMS Stage 3        | L4→L5  | 3.21       | Final canonization.                          |

**CAPTURE_MANIFEST consumption (per Q26):**

- Step 3.11 (Alerts): consume CAPTURE_MANIFEST Entry 1 (41 audit ecosystem
  issues) — executor triages items during deep-plan
- Step 3.22 (TDMS Stage 3): consume CAPTURE_MANIFEST Entry 3 (20-domain test
  structure) — executor incorporates into TDMS testing

---

## Phase 4: L4 Testing

**Complexity:** L | **Sessions:** 5-8 | **Waves:** 3 | **Deliverables:** L4 test
suite, coverage report, regression baseline

Per Q23 — planned now, scheduled later. Not vague future.

### Step 4.1: Test Infrastructure Audit

Assess current test coverage across all standardized ecosystems. Identify gaps
between L3 (basic tests exist) and L4 (comprehensive, automated,
regression-proof).

**Done when:** Gap analysis complete. Per-ecosystem test coverage report
generated.

### Step 4.2: L4 Test Implementation

For each ecosystem, implement L4-level testing:

- Integration tests across ecosystem boundaries
- Regression tests for all enforcement gates
- Performance benchmarks for scripts and hooks
- Chaos/failure mode tests for state recovery (T9)

**Done when:** All ecosystems have L4 test coverage. CI runs full suite.

### Step 4.3: Test Automation & Ratcheting

Wire L4 tests into CI/CD. Establish ratchet baselines for test coverage using
shared ratchet engine (per Q29).

**Done when:** Test coverage ratchets in CI. Coverage can only go up.

---

## Phase 5: Final Verification

**Complexity:** M | **Sessions:** 2-3 | **Waves:** 1 | **Deliverables:** Final
audit report, maturity scorecard

### Step 5.1: End-to-End Audit

Run `/convergence-loop` (T20) across the entire SWS outcome:

- All 18 ecosystems at target maturity?
- All CANON declarations in place?
- All enforcement manifests wired?
- All health checkers operational?
- Shadow-append protection verified?
- Forward-findings pipeline flowing?
- No orphaned artifacts?

**Done when:** Convergence report shows no material gaps. Maturity scorecard
published.

### Step 5.2: CAPTURE_MANIFEST Entry 2 Consumption

Consume Entry 2 (ecosystem audit expansion — 3 new audit skills designed).
Verify these audit skills were created during Phase 3 ecosystem work.

**Done when:** CAPTURE_MANIFEST fully consumed. All 3 entries resolved.

---

## Cross-Phase Concerns

### Forward-Findings Pipeline (Q30, Q31)

```
Tooling Plan ──→ forward-findings.jsonl ←── Code Quality Plan
                        │
                        ▼
                 learning-router.js
                        │
                        ▼
              learning-routes.jsonl ←── Data Effectiveness Plan
                        │
                        ▼
               enforcement pipeline
```

**Schema** (defined in CANON Phase 1):

```json
{
  "source_plan": "tooling | code-quality | data-effectiveness | ecosystem-*",
  "finding_type": "pattern | violation | gap | enhancement",
  "pattern": "description of what was found",
  "severity": "S0 | S1 | S2 | S3",
  "target_ecosystem": "which ecosystem this finding affects",
  "timestamp": "ISO-8601"
}
```

### Meta-Pipeline Gates (Q2, Q28)

```
Phase 1 (CANON schemas)
    │
    ▼
Tooling ────gate────→ Code Quality ────gate────→ Data Effectiveness
    │                      │                          │
    └──overlap──→ CQ Phase 0   └──overlap──→ DE remaining waves
```

Gates are pass/fail checklists (defined in Steps 2.1, 2.2). Overlap means the
next plan can begin its Phase 0 (research/deep-plan) while the prior plan
finishes its final wave. Implementation cannot start until the gate passes.

### Shadow-Append Registry (Q21)

Sacred JSONL files (append-only, never overwritten):

- `docs/technical-debt/raw/deduped.jsonl`
- `docs/technical-debt/MASTER_DEBT.jsonl`
- `.claude/state/learning-routes.jsonl`
- `.claude/state/forward-findings.jsonl` (new)
- `.claude/state/pending-refinements.jsonl`
- All `changelog.jsonl` files created during ecosystem standardization

Generated views (regenerable, may be overwritten):

- All `.md` files generated from JSONL sources
- `LIFECYCLE_SCORES.md`, `ENFORCEMENT_MAP.md`, etc.

---

## Appendices

### A. Child Plan Locations (post-consolidation per Q27)

| Plan                   | Path                                                                          | Decisions |
| ---------------------- | ----------------------------------------------------------------------------- | --------- |
| Tooling Infrastructure | `.planning/system-wide-standardization/tooling-infrastructure-audit/PLAN.md`  | D93-D122  |
| Code Quality Overhaul  | `.planning/system-wide-standardization/code-quality-overhaul/PLAN.md`         | D123-D148 |
| Data Effectiveness     | `.planning/system-wide-standardization/learnings-effectiveness-audit/PLAN.md` | D149-D183 |

### B. GAP-ANALYSIS Resolution Map

All 11 hard blockers resolved by this plan:

| GAP                            | Resolution                            | Plan Location    |
| ------------------------------ | ------------------------------------- | ---------------- |
| G1 (migration mechanics)       | Step 1.2                              | Phase 1          |
| G2 (checkpoint tags)           | Descoped per Q20                      | —                |
| G3 (supersession enforcement)  | CANON Phase 3 per Q19                 | Phase 3          |
| G4 (ecosystem tagging)         | CANON Phase 2 per Q19                 | Phase 3          |
| G5 (PR creep guard)            | Ecosystem 3.2 (Hooks) deep-plan       | Phase 3          |
| G6 (non-truncation validation) | CQ Plan Wave 6                        | Phase 2 Step 2.2 |
| G7 (dependency graph)          | Replaced by meta-pipeline gates (Q28) | Phase 2          |
| G8 (script path inconsistency) | Tooling Plan Step 7 per Q22           | Phase 2 Step 2.1 |
| G9 (operational visibility)    | Extract 5 items per Q24               | Phase 0 Step 0.7 |
| G10 (filename mismatch)        | Tooling Plan Step 7 per Q22           | Phase 2 Step 2.1 |
| G11 (planning migration scope) | Selective migration per Q25           | Phase 3 CANON P2 |

### C. Material Risk Disposition

| Risk                           | Disposition                                               |
| ------------------------------ | --------------------------------------------------------- |
| R1 (cross-cutting map)         | Addressed by forward-findings pipeline (Q30-Q31)          |
| R2 (naming convention)         | Per-ecosystem deep-plan concern (T13)                     |
| R3 (pilot validation gate)     | Step 3.3 (PR Review) IS the pilot (Checkpoint 3.7)        |
| R4 (room-for-growth gate)      | T6 enforcement via CANON Phase 3                          |
| R5 (health checker migration)  | Per-ecosystem during Phase 3 standardization              |
| R6 (audit skill integration)   | Step 3.15 (Audits ecosystem)                              |
| R7 (agent-research folder)     | Archived with framework-repo (Q33), git history preserves |
| R8 (interactive audit process) | T15 enforced via skill audit standards                    |
| R9 (amendment protocol)        | CANON Phase 4                                             |
| R10 (tenet evidence backfill)  | CANON Phase 4                                             |
| R11 (hardcoded counts)         | Replaced by dynamic queries in restructured plan          |
| R12 (reading-order hierarchy)  | Per-ecosystem deep-plan concern                           |
| R13 (overlap enforcement)      | Scope manifests per Q21 (design-time collision detection) |
| R14 (deletions clause)         | Addressed in restructured plan (full restructure per Q1)  |
| R15 (checklist adaptation)     | Universal via CANON Phase 3 enforcement manifests         |
| R16 (JSONL→MD sync)            | CANON Phase 4                                             |

### D. Contradiction Resolution

| Issue                         | Resolution                                    |
| ----------------------------- | --------------------------------------------- |
| C1 (version trajectory)       | Obsolete per Q16 — Zod 4 already installed    |
| C2 (effort estimate mismatch) | Replaced with CANON composite estimates (Q17) |
| C3 (wrong decision ref)       | Fixes itself in restructured plan per Q18     |
