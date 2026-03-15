# SWS Re-Evaluation — DIAGNOSIS v2

<!-- prettier-ignore-start -->
**Document Version:** 2.2
**Last Updated:** 2026-03-14
**Status:** DRAFT — Pending user review
**Supersedes:** DIAGNOSIS.md (2026-03-02)
<!-- prettier-ignore-end -->

> **Deep-Plan Phase 0 Artifact** — Re-evaluation of the System-Wide
> Standardization plan after 10 days of heavy development (2026-03-04 to
> 2026-03-14). T3-compliant: 14 research agents across 4 passes, convergence
> achieved at Pass 4. Pass 3 caught a critical double-inversion (state
> governance) and 11 corrections. Pass 4 targeted verification confirmed
> remaining findings with minor refinements.

---

## ROADMAP Alignment

**Status: ALIGNED.** SWS is milestone #4 in the Meta phase (P0 priority). The
re-evaluation strengthens the plan that governs all 4 Meta milestones. The
Meta-Pipeline sequence (Tooling → Code Quality → Data Effectiveness → SWS) is
reflected in ROADMAP.md as milestones #1-#4.

**No conflicts.** The re-evaluation absorbs child plan decisions into SWS,
consolidates folders, and updates maturity assessments — all consistent with
ROADMAP direction.

---

## What Changed Since SWS v1 (2026-03-04 → 2026-03-14)

### Major Implementations

| Change                                                                 | Impact on SWS                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Hook Mini-Audit** (PR #427, 35 decisions, 8 waves)                   | Hooks ecosystem moved L3→L4. SWS Step 3 is largely complete.                                                      |
| **Grand Plan Removed** (Waves 1-4, 50+ deletions)                      | TDMS Step 8 starts on clean slate. No legacy to reconcile.                                                        |
| **Data Effectiveness Audit** (PR #431, 35 decisions)                   | Partial implementation. Learning-router, lifecycle-scores, enforcement annotations exist.                         |
| **Automation Gap Closure** (spec approved, implementation in progress) | Closes D14 hybrid approach violation. confidence-classifier.js implemented. refine-scaffolds.js + wiring pending. |
| **S0 Reclassification** (67→19 items)                                  | Only genuine security items remain S0. Process/tooling downgraded to S1.                                          |
| **safe-fs Migration** (21 scripts, 56+ calls)                          | Scripts ecosystem partially advanced.                                                                             |
| **CLAUDE.md v5.5**                                                     | Guardrail #6 (passive surfacing), LSP preference, enforcement annotations on all rules.                           |
| **Planning Audit W1-W4**                                               | Grand Plan references removed from 50+ files. W5 (canonicalization) pending.                                      |

### New Infrastructure Not in Original SWS Plan

| System                         | Purpose                                                   | SWS Integration Needed                                               |
| ------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------- |
| `known-debt-baseline.json`     | Regression-only gating (baseline mode)                    | CANON schema governance, ratchet mechanism                           |
| Warning escalation system      | 5+ occurrences→warning, 15+→error                         | Standardize as CANON pattern                                         |
| Warning acknowledgment gates   | Session-begin blocks on unacknowledged warnings           | CANON enforcement pattern                                            |
| `_shared.sh`                   | Centralized hook utilities                                | Cross-platform concern (T7)                                          |
| Override-to-DEBT auto-intake   | `log-override.js checkBypassDebtThreshold` at 15 bypasses | **MUST CHANGE** per user T1 (no auto-DEBT) — 5 true violations found |
| Hook learning synthesizer      | Session-end step, top 3 recurring issues                  | Feeds into learning-router                                           |
| Learning-router pipeline       | `scripts/lib/learning-router.js`                          | Core data effectiveness infrastructure                               |
| Confidence-classifier pipeline | `scripts/lib/confidence-classifier.js` (implemented)      | Automation gap closure — refine-scaffolds.js pending                 |

---

## T3 Research — Converged Findings

> **Methodology:** 4 passes, 14 agents total. Pass 1 = 5 Explore agents. Pass 2
> = 2 Plan + 2 Explore agents. Pass 3 = 4 Explore agents (verify + expand). Pass
> 4 = 1 Explore agent (targeted verification of 6 new findings). Convergence
> confirmed at Pass 4: no material corrections, no unexplored angles. All claims
> below are Pass 3/4-verified with file:line evidence.

### Prior Research Errors Corrected

| Claim (Prior)                                 | Reality (T3-Verified, Pass 3+4)                                                                                                                                             | Impact                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "44 state files with NO schema governance"    | **Only 5/47 state files have Zod schemas. 42 lack formal validation.** Pass 2 incorrectly "corrected" this to 44/49 HAVE schemas — Pass 3 caught the double-inversion.      | State governance is weak (L1-L2), not strong. SWS Step 7 scope larger than Pass 2 suggested. |
| "CLAUDE.md documents ~33% of enforcement"     | **~22% coverage** (22 annotations out of ~100 mechanisms). Not 33% (original) or 8-15% (Pass 2).                                                                            | Gap is real but quantified correctly now.                                                    |
| "THREE parallel invocation systems"           | **Only TWO.** `.session-agents.json` is ephemeral (created during session at `.claude/hooks/.session-agents.json`, deleted at session-end), not a third persistent system.  | Skill tracking cleanup is simpler than assumed.                                              |
| "CANON circular dependency"                   | **NOT REAL.** Child plans reference SWS tenet/decision IDs in existing JSONL, not `.canon/` schemas. `scripts/reviews/lib/schemas/` already provides needed infrastructure. | Cross-Plan Issue #4 resolved — only changelog schema needs adding.                           |
| "Testing at L2 with ~9 test files"            | **201 test files** (14 root-level + 187 nested) with substantive assertions — not stubs. BUT: 0 Playwright, 0 Firebase rules, 0 React component tests.                      | Testing maturity is L2 (strong foundation, critical gaps in component/integration coverage). |
| "100+ React/Next.js components"               | **94 components** (85 in `/components/` + 9 in `/app/`).                                                                                                                    | Minor numeric correction.                                                                    |
| "41 .protocol.json test protocols"            | **28 protocols** (41 count included worktree copies). All declarative plans, not executable tests.                                                                          | Count corrected; nature unchanged.                                                           |
| "v2 InvocationRecord has outcome fields"      | **No outcome fields.** Schema has `success` (boolean) + `error` (string) only. Simpler than claimed.                                                                        | v2 cleanup is simpler.                                                                       |
| "7 auto-DEBT violations"                      | **5 actual violations** + 1 planned-not-implemented (spec line 193) + 1 misclassified (write-deferred-items.ts creates deferred items, not DEBT).                           | Remediation scope reduced.                                                                   |
| "CAPTURE_MANIFEST has 75 preserved decisions" | **~122 items** across 3 entries (68 + 17 + 37).                                                                                                                             | Scope of unconsumed items is larger than reported.                                           |
| "3 separate CHANGELOG.jsonl files"            | **0 exist.** Plans are designed to create them but none have been created yet.                                                                                              | Gap is planned-but-not-started, not existing-and-unmerged.                                   |

### CANON Enforcement (CONVERGED)

- CLAUDE.md has 22 enforcement annotations (10 [GATE:] + 12 [BEHAVIORAL:])
  covering ~22% of actual mechanisms
- ~100 enforcement mechanisms across: pre-commit (13 checks), pre-push (7-8
  gates), CI (17+ quality gates), ESLint plugin (32 rules in 3 phases)
- **Documentation gap is intentional architectural layering** — CLAUDE.md line
  9-13: "Kept minimal (~135 lines) to reduce token waste. Situational guidance
  lives in on-demand reference docs." The problem is **discoverability**, not
  absence.
- **Annotation bug found:** `[GATE: pre-commit hook + code-reviewer]` in
  CLAUDE.md line 144 is mislabeled — code-reviewer enforcement is actually in
  pre-push (line 59-96), not pre-commit. Pre-commit only issues a non-blocking
  warning.
- `patterns:check` runs in 3 places with different severity: pre-commit
  (BLOCKING), pre-push (WARNING only), CI (unspecified in CLAUDE.md)
- validate-canon-schema.js intentionally removed from pre-commit (C7-G3),
  enforced via CI only
- CODE_PATTERNS.md lists stale regex patterns already migrated to ESLint
- Several [BEHAVIORAL:] annotations describe hard gates and should be
  reclassified (e.g., "Never implement without approval" is a gate, not
  behavioral guidance)

### Skill Tracking (CONVERGED)

- TWO invocation systems, none connected: v1 hook (ACTIVE — tracks to
  `.claude/state/agent-invocations.jsonl`), v1 ephemeral (ACTIVE —
  `.claude/hooks/.session-agents.json`, deleted at session-end). v2 ecosystem is
  DEAD CODE.
- v2 InvocationRecord schema: `success` (boolean) + `error` (string). No
  structured outcome fields. Tests pass but ZERO production call sites.
- `data/ecosystem-v2/invocations.jsonl` exists (173 lines) but is orphaned — no
  active consumer reads it.
- `agentsSuggested[]` and `filesModified[]` defined in v1 hook state but NEVER
  populated — skeleton fields waiting for implementation.
- session-end reads `.session-agents.json` for presence/absence checks but
  doesn't consume outcome data.
- SKILL_STANDARDS.md lists post-execution retro as SHOULD (strong
  recommendation), but only ~10% of skills include retro logic. No enforcement
  gate prevents shipping skills without retros.
- 6 of 8 emergent cross-cutting skill patterns are CANON-ready; 2 (D26 data
  flows, operational dependencies) need design work. Note: the full roster of 8
  patterns is not enumerated in any existing document.

### Auto-DEBT Violations (CONVERGED — 5 actual)

5 locations create DEBT items without user interaction, violating user tenet T1
("DEBT as last resort, at user discretion. No auto-DEBT"):

| #   | File                                        | Mechanism                                                                 | Type                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | `scripts/lib/log-override.js`               | `checkBypassDebtThreshold` — auto-creates DEBT at 15+ bypasses in 14 days | True auto-DEBT (background)                |
| 2   | `scripts/reviews/lib/escalate-deferred.js`  | Auto-escalates deferred→DEBT at `defer_count >= 2`                        | True auto-DEBT (background)                |
| 3   | `scripts/reviews/lib/intake-pr-deferred.js` | `appendMasterDebtSync()` — no approval gate within script                 | Semi-automatic (user invokes, no approval) |
| 4   | `scripts/reviews/lib/intake-audit.js`       | `appendMasterDebtSync()` — processes audit JSONL silently                 | Semi-automatic (user invokes, no approval) |
| 5   | `scripts/reviews/lib/sync-sonarcloud.js`    | `appendMasterDebtSync()` — auto-syncs from SonarCloud API                 | Semi-automatic (user invokes, no approval) |

**Not violations (corrected from Pass 2):**

- `write-deferred-items.ts` — creates **deferred items** (to
  `deferred-items.jsonl`), not DEBT entries. Later escalated by #2.
- Automation gap closure spec line 193 — specifies auto-DEBT at
  `surfaced_count >= 3` but **not implemented yet**. Must be changed to
  fix-or-DEBT before implementation.

All 5 must become fix-or-DEBT with user interaction per T1.

### Integration Gaps (CONVERGED — updated)

- ALL 14 GAP-ANALYSIS.md must-fix items still completely open
- ~~Circular dependency~~ **RESOLVED:** child plans already use existing schemas
- Only a changelog schema needs adding to `scripts/reviews/lib/schemas/`
- 0 CHANGELOG.jsonl files exist yet (planned by child plans, not created)
- No consolidation spec for when they are created
- CAPTURE_MANIFEST has ~122 unconsumed items (not 75) across 3 entries — all
  marked PENDING, consumed when Steps 11 and 16 execute
- Framework-repo partially obsolete (Tooling plan deletes 19 of 35 current
  agents, no update spec for framework-repo post-execution)
- Missing documents: META_PIPELINE_GATES.md, CHANGELOG_CONSOLIDATION.md,
  CHILD_PLAN_INTEGRATION_MAP.md
- No prerequisite gates between child plans (documented in prose, not
  machine-enforced)

### Testing & State (CONVERGED — corrected)

**State Governance:**

- **5/47 state files have Zod schemas** (reviews.jsonl, reviews.jsonl.archive,
  lifecycle-scores.jsonl, learning-routes.jsonl, agent-invocations.jsonl)
- **42 state files lack formal schema validation** — use ad-hoc JSON structures,
  prose/markdown, or JSONL without Zod
- State governance is emerging (L1-L2), not mature

**Testing Infrastructure:**

- 201 test files exist (14 root-level + 187 nested) with substantive assertions
- 9 npm test scripts targeting different subsystems (test, test:build,
  test:coverage, test:health, test:hooks, test:debt, test:audits, test:checkers,
  test:infra)
- Playwright installed but ZERO test files using it
- @firebase/rules-unit-testing installed but ZERO Firestore security rule tests
- 94 React/Next.js components with ZERO unit tests
- 28 .protocol.json test protocols — all declarative plans, NOT executable tests
- TESTING_CHECKLIST.md (495+ lines) promises admin-functions.test.ts that
  DOESN'T EXIST
- Testing is L2: strong foundational infrastructure, critical gaps in
  component/integration/E2E coverage

---

## Maturity Assessment Updates (T3-Calibrated, Pass 3+4)

| Ecosystem          | Original Assessment | T3-Calibrated              | Change | Notes                                                                                                                  |
| ------------------ | ------------------- | -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Hooks              | L3→L4 target        | **L4 achieved**            | +1     | Step 3 largely done                                                                                                    |
| Scripts            | L2→L3 target        | L2 (partially advanced)    | 0      | 21 safe-fs migrations done, more work needed                                                                           |
| TDMS               | L2→L5 staged        | L2 (clean slate)           | 0      | Grand Plan removed, fresh start                                                                                        |
| Testing            | L3 assumed          | **L2 (DOWNGRADE)**         | **-1** | 201 test files + 9 npm scripts (strong foundation). 0 Playwright, 0 Firebase rules, 0 component tests (critical gaps). |
| CI/CD              | L1 assumed          | **L2 (UPGRADE)**           | **+1** | 17+ quality gates in ci.yml alone, known-debt-baseline, ratchet system, 16 workflow files                              |
| Planning           | Not assessed        | L2 (W5 pending)            | new    | Canonicalization pending                                                                                               |
| Data Effectiveness | Not in original     | L2 (partially implemented) | new    | PR #431 + automation gap closure in progress                                                                           |
| Skills             | L1 assessed         | L1 confirmed               | 0      | 16 skill modifications but effort estimate L→XL. ~10% have retro logic.                                                |
| CANON              | L0 target           | L0 (not started)           | 0      | Ecosystem Zero — first deliverable in SWS                                                                              |
| PR Review          | L4 assessed         | L4 confirmed               | 0      | Most mature ecosystem                                                                                                  |

---

## Three Child Plans — Status & Absorption Summary

### Hybrid A+C Model (per locked direction decision)

SWS absorbs all child plan decisions into its decision record (D93+). Child
PLAN.md files become execution appendices that SWS references. One queryable
decision record, one tenet set, one sequencing authority. Child plans own the
HOW, SWS owns the WHAT and WHY.

### Plan 1: Tooling & Infrastructure Audit

- **Location:** `.planning/tooling-infrastructure-audit/` → moves to
  `.planning/system-wide-standardization/tooling-infrastructure-audit/`
- **Status:** Approved, not started. Executes first in meta-pipeline.
- **Decisions:** 30 (security hardening, workflow fixes, plugin/MCP cleanup,
  agent audit, ESLint optimization, new tooling, npm script audit, docs)
- **SWS Overlap:** Steps 9 (Scripts), 10 (CI/CD), partially Step 3 (Hooks)
- **Forward-compatibility:** Born-compliant with SWS T7, T18, D72

### Plan 2: Code Quality Overhaul

- **Location:** `.planning/code-quality-overhaul/` → moves to
  `.planning/system-wide-standardization/code-quality-overhaul/`
- **Status:** Approved, not started. Prerequisite: Plan 1 complete.
- **Decisions:** 26 + 9 cross-cutting directives
- **Workstreams:** MD→JSONL audit, ESLint cleanup + v10 prep, propagation fixes,
  cyclomatic/cognitive complexity (358 violations), fragility fixes, truncation
  protection, orphan detection
- **Key innovation:** 4-pass convergence loop (scan→triage→implement→verify)
- **SWS Overlap:** Steps 3 (Hooks), 6 (Testing), 8 (TDMS tooling)
- **Prerequisite:** Plan 1 fully complete (D#23)

### Plan 3: Data Effectiveness Audit

- **Location:** `.planning/learnings-effectiveness-audit/` → moves to
  `.planning/system-wide-standardization/learnings-effectiveness-audit/`
- **Status:** Approved, partially implemented. PR #431 merged. Automation gap
  closure in progress (confidence-classifier.js done, refine-scaffolds.js +
  wiring pending).
- **Decisions:** 35
- **Waves:** 11 (0-10), wave-based dependency-ordered
- **Key deliverables:** learning-router.js, lifecycle-scores.jsonl, health
  checker contract (D25), data-effectiveness-audit skill
- **SWS Overlap:** Steps 11 (Alerts), 12 (Analytics), 15 (Archival)

### Cross-Plan Issues (T3-Verified)

1. No prerequisite gates between plans (prose only, not machine-enforced)
2. No cross-references between child plans
3. 0 CHANGELOG.jsonl files exist yet (plans specify creating them, no
   consolidation spec for when they do)
4. ~~Circular dependency~~ **RESOLVED** — child plans use existing
   `scripts/reviews/lib/schemas/`, not nonexistent `.canon/` schemas. Only
   changelog schema needs adding.
5. Ratchet baseline ownership undefined between Code Quality and Data
   Effectiveness
6. Learning router schema undefined for Code Quality patterns
7. Data Effectiveness has no forward-findings.jsonl
8. Zod schema versioning specified 3 different ways across plans

---

## GAP-ANALYSIS v1 — All 14 Must-Fix Items Still Open

The original GAP-ANALYSIS.md (2026-03-04) identified 14 must-fix items. **None
have been addressed.** They remain blockers for SWS execution.

### Contradictions (3)

| #   | Finding                                                 | Status |
| --- | ------------------------------------------------------- | ------ |
| C1  | Version trajectory conflict (D13/D76 vs Idea #45)       | OPEN   |
| C2  | Effort estimate mismatch (header 40-60 vs table 80-130) | OPEN   |
| C3  | Wrong decision reference (D38 should be directive #38)  | OPEN   |

### Hard Blockers (11)

| #   | Finding                                             | Status |
| --- | --------------------------------------------------- | ------ |
| G1  | D86 migration mechanics undefined                   | OPEN   |
| G2  | D78 checkpoint git tags/MCP not implemented         | OPEN   |
| G3  | D84 supersession protocol not in pre-commit         | OPEN   |
| G4  | D92 ecosystem tagging backfill absent               | OPEN   |
| G5  | #9 PR creep guard no step assigned                  | OPEN   |
| G6  | #39 non-truncation validation no gate               | OPEN   |
| G7  | D89 dependency graph — linear only, no lateral deps | OPEN   |
| G8  | scan-changelog.js path inconsistency                | OPEN   |
| G9  | Operational Visibility Sprint not closed            | OPEN   |
| G10 | generate-doc-index.js name mismatch                 | OPEN   |
| G11 | D77 planning artifact migration scope unclear       | OPEN   |

---

## User's 9 New Tenets

5 are NEW, 4 amend existing SWS tenets. To be integrated as T20-T24 (new) and
amendments to T8, T9, T11, T19.

| ID      | Content                                                                         | Type          |
| ------- | ------------------------------------------------------------------------------- | ------------- |
| T_new_1 | DEBT as last resort, at user discretion. No auto-DEBT.                          | NEW (T20)     |
| T_new_2 | ALWAYS AUTOMATE A PROCESS IF AT ALL POSSIBLE.                                   | Amend T8      |
| T_new_3 | Multi-pass convergence loops. Multi-agent, multi-angle. Loop until convergence. | NEW (T21)     |
| T_new_4 | Honest findings only. No placating. We are a team.                              | NEW (T22)     |
| T_new_5 | Save state EVERYWHERE. Session, context, compaction recovery.                   | Amend T9      |
| T_new_6 | ALL planning via deep-plan method. Universal process.                           | NEW (T23)     |
| T_new_7 | Warnings are CALL TO ACTION. Ability to stop and fix. Deferrals last resort.    | Amend T11     |
| T_new_8 | ALL TESTING must be ROBUST. Semantic, functionality, LSP. Not just grep.        | NEW (T24)     |
| T_new_9 | No passive surfacing of info — needs action.                                    | Merge with T7 |

### T21 (T_new_3) — Finalized Wording

T3/T21 is dual-form: CANON tenet + standalone `/convergence-loop` skill. The
tenet defines WHEN and WHY. The skill defines HOW (agent templates, tally
format, convergence logic, domain slicing). One skill, many callers.

Full tenet wording and integration targets documented in
`memory/t3_convergence_loops.md`. `/convergence-loop` skill must be built
**before** the CANON plan phase begins.

---

## Reframe Check

**Is this task what it appears to be?**

Yes, with one clarification: this is NOT a greenfield re-plan. It's an
**amendment and absorption** of the existing SWS plan. The 92 existing decisions
remain valid. The 21-step sequence may need reordering/collapsing based on:

1. Steps already partially/fully completed (Hooks L4, partial Scripts)
2. Child plan absorption (their steps become sub-steps of SWS steps)
3. New tenets that change execution approach (T3 loops, robust testing, no
   auto-DEBT)
4. New infrastructure that didn't exist when original plan was written
5. **T3-corrected maturity assessments** — Testing downgraded (but strong
   foundation), CI/CD upgraded, Skills effort increased
6. **New prerequisite:** `/convergence-loop` skill must exist before CANON phase

The key structural change: **SWS becomes the single umbrella plan** with child
plans as execution appendices, rather than 4 separate plans with informal
sequencing.

---

## Scope of This Deep-Plan

This deep-plan must produce:

1. **Amended tenet set** — T1-T19 + amendments + T20-T24 (new), with T21
   finalized wording
2. **Absorbed decision record** — D1-D92 (existing) + D93+ (from child plans +
   new decisions from this deep-plan)
3. **Updated PLAN.md** — reflecting completed work, absorbed child plans,
   resolved GAP-ANALYSIS items, new infrastructure, new tenets
4. **Resolved GAP-ANALYSIS** — all 14 must-fix items addressed
5. **`/convergence-loop` skill spec** — standalone skill for T3/T21 execution,
   invokable by deep-plan, audits, debugging, code review, doc-code sync
6. **Integration specs** — META_PIPELINE_GATES, CHANGELOG_CONSOLIDATION,
   CHILD_PLAN_INTEGRATION_MAP
7. **Folder consolidation** — child plan folders moved under SWS
8. **Updated coordination.json** — reflecting new state
9. **Auto-DEBT remediation plan** — all 5 violations converted to fix-or-DEBT

---

## T3 Convergence Log

| Pass | Agents | Type               | Key Outcome                                                                                                  |
| ---- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1    | 5      | Explore            | Baseline claims established                                                                                  |
| 2    | 4      | 2 Plan + 2 Explore | Maturity calibration, CANON deps resolved, auto-DEBT found                                                   |
| 3    | 4      | Explore (verify)   | 18 confirmed, 11 corrected, 5 extended, 6 new. State governance double-inversion caught.                     |
| 4    | 1      | Explore (targeted) | 4 confirmed, 2 minor corrections (pre-push 7 not 5, tests 201 not 9), 1 new (annotation bug). **CONVERGED.** |
