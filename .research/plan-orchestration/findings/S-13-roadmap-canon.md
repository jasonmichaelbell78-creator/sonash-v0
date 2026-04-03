# Findings: ROADMAP Alignment & CANON Pre-Work Analysis

**Searcher:** deep-research-searcher (cross-cutting analyst) **Profile:**
codebase **Date:** 2026-03-24 **Sub-Question IDs:** S-13

---

## 1. ROADMAP Alignment Matrix

### ROADMAP Structure Recap

The ROADMAP defines a **Meta Pipeline** (P0, BLOCKING all other work):

1. Tooling & Infrastructure (30 decisions) -- ACTIVE, 0%
2. Code Quality Overhaul (26 decisions) -- BLOCKED
3. Data Effectiveness (35 decisions) -- BLOCKED
4. System-Wide Standardization (92 decisions) -- BLOCKED, Phase 1b done

These are sequential: T&I -> CQ -> DE -> SWS -> Operational Visibility -> all
downstream milestones.

Each Meta Pipeline item has a corresponding plan directory under
`.planning/system-wide-standardization/`.

### Alignment Matrix

| Plan                              | ROADMAP Milestone                                                                                                                                         | ROADMAP Priority                  | Sprint Fit                       | Notes                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| **repo-cleanup**                  | None directly. Supports all Meta Pipeline items by removing cruft.                                                                                        | P0 (indirect)                     | Pre-sprint housekeeping          | Not a ROADMAP milestone. Meta-work that de-risks everything else.                        |
| **custom-statusline**             | None. Not referenced in ROADMAP.                                                                                                                          | N/A (developer tooling)           | Parallel with any sprint         | Self-contained Go binary. No ROADMAP milestone covers dev tooling/statusline.            |
| **cli-tools-implementation**      | None. Not referenced in ROADMAP.                                                                                                                          | N/A (developer tooling)           | Parallel with any sprint         | Developer environment setup. Not a product milestone.                                    |
| **passive-surfacing-remediation** | Partial overlap with Operational Visibility (Track E: Solo Developer Automations). Also supports Meta Pipeline #4 (SWS) by pre-fixing 33 violations.      | P0 (indirect)                     | Pre-SWS remediation              | Implements CLAUDE.md Guardrail #6. Reduces SWS scope.                                    |
| **propagation-research**          | Partial overlap with Meta Pipeline #2 (Code Quality Overhaul) and #4 (SWS). Steps 6-7 consolidate code patterns. Steps 2, 13 harden CI (Track D overlap). | P0 (indirect)                     | Pre-SWS infrastructure hardening | Code consolidation directly reduces SWS workload for Scripts (Step 9) and TDMS (Step 8). |
| **agent-environment-analysis**    | Partial overlap with Meta Pipeline #4 (SWS Step 13: Agents ecosystem). Memory note states "all 5 phases must complete before SWS Phase 1."                | P0 (prerequisite for SWS Step 13) | Must complete before SWS         | Strongest non-SWS ROADMAP alignment. Agent standardization is SWS Step 13.               |
| **system-wide-standardization**   | **Direct**: Meta Pipeline #4. This IS the ROADMAP item.                                                                                                   | **P0** (critical path)            | The main event                   | 80-130 sessions. Blocks Operational Visibility and all downstream milestones.            |

**Confidence: HIGH** -- All milestone references verified against ROADMAP.md
lines 86-117 and 232-246.

---

## 2. ROADMAP Gap Analysis

### Plans That Do NOT Map to Any ROADMAP Item

| Plan                         | ROADMAP Status   | Nature of Work                 |
| ---------------------------- | ---------------- | ------------------------------ |
| **repo-cleanup**             | No ROADMAP entry | Hygiene/housekeeping meta-work |
| **custom-statusline**        | No ROADMAP entry | Developer experience tooling   |
| **cli-tools-implementation** | No ROADMAP entry | Developer environment setup    |

These three plans are **developer tooling and hygiene work** -- they improve the
development experience but do not appear as ROADMAP milestones. This is
appropriate: the ROADMAP tracks product and infrastructure milestones, not
one-off developer setup tasks.

### ROADMAP Items NOT Covered by Any Active Plan

| ROADMAP Item                                                  | Priority    | Status      | Coverage Gap                                                                                                                                                                    |
| ------------------------------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Meta Pipeline #1: Tooling & Infrastructure** (30 decisions) | P0, ACTIVE  | 0% progress | Has its own plan at `.planning/system-wide-standardization/tooling-infrastructure-audit/PLAN.md` but NOT among the 7 active plans. **This is the current ROADMAP active item.** |
| **Meta Pipeline #2: Code Quality Overhaul** (26 decisions)    | P0, BLOCKED | 0% progress | Has its own plan at `.planning/system-wide-standardization/code-quality-overhaul/PLAN.md`. Not among 7 active plans. BLOCKED on T&I completing.                                 |
| **Meta Pipeline #3: Data Effectiveness** (35 decisions)       | P0, BLOCKED | 0% progress | Has its own plan at `.planning/system-wide-standardization/learnings-effectiveness-audit/PLAN.md`. Not among 7 active plans. BLOCKED on CQ completing.                          |
| **Operational Visibility** (Tracks B, D, E, O, P, T)          | P0, BLOCKED | ~25%        | Active sprint with 8 tracks. Not among 7 active plans but has items that overlap with passive-surfacing and propagation.                                                        |
| **S0 Critical Debt** (10 items)                               | P0/S0       | Active      | Security/performance critical items. Not covered by any of the 7 plans. These are always-active regardless of sprint.                                                           |

**Priority mismatch assessment:**

The ROADMAP declares Meta Pipeline #1 (Tooling & Infrastructure) as the ACTIVE
P0 item at 0% progress, yet it is NOT among the 7 active plans being
orchestrated. The 7 plans being orchestrated include SWS (Meta Pipeline #4) but
skip #1, #2, and #3 which are declared as prerequisites.

**However**, the DIAGNOSIS.md for plan-orchestration notes that SWS has CANON as
its first step (not an external dependency), and the other 6 plans have no
formal ROADMAP entries. The Meta Pipeline sequence (T&I -> CQ -> DE -> SWS) may
be stale or may represent SWS-internal phases rather than separate blocking
gates. The ROADMAP Chain 0 references the same plan directories, suggesting
these are SWS sub-plans.

**Confidence: HIGH** for gap identification, MEDIUM for interpretation of
whether the Meta Pipeline sequence is still enforced or has been superseded by
SWS's internal sequencing.

---

## 3. CANON Pre-Work Identification

### What CANON Step 1 Actually Does

Per S-07 findings and the SWS PLAN.md, CANON Step 1 (sub-steps 1a-1i) creates:

- `.canon/` directory tree with all infrastructure
- Tenets (migrated from `.planning/system-wide-standardization/tenets.jsonl`)
- Ecosystem registry (18 ecosystems)
- Maturity model (L0-L5) with 16-item checklist
- Enforcement system (scripts, hooks)
- Changelog infrastructure
- Generated views and dashboard
- Testing and documentation
- Self-assessment

CANON's tenets are seeded from the existing 18 SWS tenets (T1-T18/T19). The
question is: do any of the 6 non-SWS plans produce patterns or standards that
SHOULD be codified as CANON tenets?

### Per-Plan Assessment

| Plan                  | Produces CANON-Eligible Artifacts?                                    | What Artifacts?                                                                                                                                                                                                                                                                           | Should Run Before SWS Step 1?                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **repo-cleanup**      | NO -- produces clean state, not patterns                              | Cleaned repo, updated docs, corrected skill index                                                                                                                                                                                                                                         | YES for practical reasons (clean repo = cleaner CANON foundation), but not for CANON content.                                                                                                |
| **passive-surfacing** | YES -- establishes enforcement pattern (Guardrail #6 compliance)      | 5-pattern fix taxonomy (fire-and-forget, no-gate, cooldown-suppression, wallpaper, passive-suggestions). State file contract (`session-start-failures.json`, `context-warnings.json`). Session-begin gating pattern. `[TRACKED]` marker convention.                                       | MODERATE benefit. Patterns are useful for CANON to codify, but they are behavioral patterns, not the structural patterns CANON focuses on (schemas, health checkers, enforcement manifests). |
| **propagation**       | YES -- establishes code consolidation patterns and baseline mechanism | `known-propagation-baseline.json` (violation baseline pattern). `sanitize-error.cjs` (CJS/ESM bridge pattern). Shared-lib extraction pattern (`.claude/skills/shared-lib/`). Centralized writer pattern (`appendMasterDebtSync`).                                                         | MODERATE-STRONG benefit. The baseline pattern is directly relevant to CANON's enforcement model. The shared-lib pattern applies to ecosystem standardization.                                |
| **agent-env**         | YES -- establishes agent quality standards and Zod schema patterns    | Agent quality audit rubric (8+ categories). Agent disposition taxonomy (keep, improve, replace, prune, merge). Zod schemas for agent frontmatter and invocation JSONL (Step 5.5). Token monitoring pipeline pattern. Agent compliance enforcement (strict mode). PreToolUse hook pattern. | STRONG benefit. Agent definitions are SWS Step 13. Agent-env directly produces the standards CANON Step 13 will codify. Memory note: "all 5 phases must complete before SWS Phase 1."        |
| **cli-tools**         | NO -- produces tool installation infrastructure                       | `tool-manifest.json` (tool registry pattern). `setup-cli-tools.sh`/`install-cli-tools.sh` (setup script pattern). Session-start tool detection.                                                                                                                                           | WEAK benefit. The tool-manifest pattern could inform CANON's registry patterns, but this is a stretch.                                                                                       |
| **custom-statusline** | NO -- produces a standalone Go binary                                 | Config pattern (TOML shared + local override). Build/install script. Widget system.                                                                                                                                                                                                       | WEAK benefit. The shared/local config pattern is interesting but specific to the statusline, not generalizable to CANON.                                                                     |

**Confidence: MEDIUM-HIGH** -- Assessment based on what each plan actually
produces (per S-01 through S-07 findings) cross-referenced with what CANON Step
1 consumes (per SWS PLAN.md and DECISIONS.md).

---

## 4. CANON Tenet Candidates

What standards could each plan's work contribute as CANON tenets or enforcement
rules?

### repo-cleanup

- **No tenet candidates.** Repo-cleanup is a one-time cleanup, not a pattern
  establishment. Its value is removing noise, not creating standards.
- **Indirect benefit:** Clean state means CANON starts from an accurate baseline
  rather than standardizing things that should be deleted.

### passive-surfacing-remediation

- **Candidate tenet: "All passive surfacing must force acknowledgment"**
  (already CLAUDE.md Guardrail #6). This could become a formal CANON tenet.
- **Candidate enforcement rule:** "Warnings must include `Fix:` action commands"
  -- enforceable by linting hook outputs.
- **Candidate enforcement rule:** "HIGH severity items must gate session-begin"
  -- enforceable via state file checks.
- **Candidate pattern:** Tiered routing (HIGH -> gate, MEDIUM -> JSONL +
  `[TRACKED]`, LOW -> inline `Fix:`).
- **Assessment:** These are valuable behavioral standards. Passive-surfacing
  produces 5 fix patterns (D1) that could become CANON enforcement rules for the
  Hooks ecosystem (SWS Step 3). However, they are not structural standards in
  CANON's Zod-schema sense.

### propagation-research

- **Candidate tenet: "No code duplication across script ecosystem"** -- directly
  aligns with T12 (idempotent_operations) and T2 (source_of_truth).
- **Candidate enforcement rule:** "Propagation baseline must exist and be
  validated" -- the `known-propagation-baseline.json` pattern is directly
  analogous to CANON's enforcement manifests.
- **Candidate pattern:** Centralized writer pattern (all MASTER_DEBT writes
  through `appendMasterDebtSync`) -- aligns with T12 (idempotent) and T16
  (single_ownership).
- **Candidate pattern:** CJS/ESM bridge pattern -- relevant to Scripts ecosystem
  (SWS Step 9).
- **Candidate pattern:** Shared-lib extraction for ecosystem audit skills --
  relevant to Skills ecosystem (SWS Step 2) and Audits ecosystem (SWS Step 14).
- **Assessment:** Propagation produces the most structurally CANON-relevant
  patterns. The baseline mechanism, centralized writer, and shared-lib patterns
  are exactly the kind of infrastructure CANON should codify.

### agent-environment-analysis

- **Candidate tenet: "Agent definitions must meet quality rubric"** -- the
  8-category audit rubric from Phase 2.
- **Candidate enforcement rule:** "Agent compliance checks run in strict mode"
  (Decision #27).
- **Candidate enforcement rule:** "PreToolUse hook validates mandatory agent
  invocations" (Decision #28).
- **Candidate schema:** Zod schema for agent frontmatter and invocation JSONL
  (Step 5.5) -- directly feeds SWS Step 13 (Agents ecosystem).
- **Candidate pattern:** Token monitoring JSONL pipeline -- aligns with T14
  (capture_everything) and T4 (jsonl_first).
- **Assessment:** Agent-env produces the most CANON-ready artifacts. The Zod
  schemas (Step 5.5) are literally the type of artifact CANON creates per
  ecosystem. The quality rubric becomes the assessment criteria for SWS Step 13.

### cli-tools-implementation

- **Candidate pattern:** Tool manifest (`.claude/tool-manifest.json`) as a
  registry pattern -- weak parallel to CANON's ecosystem registry.
- **Assessment:** Minimal CANON relevance. CLI tools are developer environment,
  not ecosystem infrastructure.

### custom-statusline

- **Candidate pattern:** Shared config (committed) + local config (gitignored)
  -- analogous to CANON's `config/defaults.json` + `config/overrides/` pattern.
  But this is a coincidence of form, not a pattern worth codifying as a tenet.
- **Assessment:** No meaningful CANON tenet candidates. The statusline is a
  standalone Go binary that does not establish repo-wide standards.

---

## 5. Sequencing Recommendation

### Tier 1: Run BEFORE SWS Step 1 (CANON)

| Plan                                        | Rationale                                                                                                                                                        | CANON Benefit                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **repo-cleanup**                            | Cleans repo state. CANON should standardize the clean repo, not the dirty one. DIAGNOSIS.md explicitly recommends this runs first. 60-90 minutes, 1 session.     | Practical: clean baseline. No CANON content.                                                       |
| **agent-environment-analysis (Phases 4-5)** | Memory note: "all 5 phases must complete before SWS Phase 1." Produces Zod schemas and quality standards that feed SWS Step 13 directly. 2-4 sessions remaining. | Strong: Zod schemas, quality rubric, enforcement patterns directly inform CANON's agent ecosystem. |

### Tier 2: Run BEFORE SWS Step 1 IF Possible (valuable but not critical)

| Plan                              | Rationale                                                                                                                                                                                    | CANON Benefit                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **propagation-research (Wave 1)** | Wave 1 (critical fixes, 3 hours) fixes data-loss vectors and creates the baseline mechanism. Wave 2-4 can run later. The baseline pattern and centralized writer pattern are CANON-relevant. | Moderate: baseline mechanism informs CANON enforcement. Shared-lib pattern informs Skills/Audits ecosystems. |
| **passive-surfacing-remediation** | Pre-fixes 33 violations that SWS would otherwise discover and track. Establishes surfacing patterns. 1-2 sessions with parallelization.                                                      | Moderate: fix patterns inform Hooks ecosystem (SWS Step 3). Reduces SWS discovery overhead.                  |

### Tier 3: Timing Does NOT Matter for CANON

| Plan                         | Rationale                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **custom-statusline**        | Fully self-contained Go binary. No CANON content. No shared files beyond `.claude/settings.json`. Can run at any time, even in parallel with SWS. |
| **cli-tools-implementation** | Developer environment setup. No CANON content. Minimal shared file overlap. Can run at any time.                                                  |

### Recommended Execution Order (CANON-optimized)

```
Session 1:     repo-cleanup (60-90 min)
Sessions 2-4:  agent-env Phase 4-5 (2-4 sessions)
Session 3:     propagation Wave 1 (3 hours, can overlap agent-env)
Session 4:     passive-surfacing (1-2 sessions, can overlap)
--- CANON-relevant pre-work complete ---
Sessions 5+:   SWS Step 1 (CANON) -- 6-10 sessions
                custom-statusline can run in parallel (any sessions)
                cli-tools can run in parallel (any sessions)
                propagation Waves 2-4 can interleave with SWS
```

### Critical Caveat: Meta Pipeline Sequence

The ROADMAP defines a Meta Pipeline sequence: Tooling & Infrastructure -> Code
Quality -> Data Effectiveness -> SWS. All are P0. If this sequence is still
enforced, then SWS cannot start until the first three complete. However:

1. The DIAGNOSIS.md lists only 7 plans, not including T&I, CQ, or DE as separate
   active plans
2. SWS's own PLAN.md treats CANON as its first step with zero external
   dependencies
3. The Meta Pipeline plans exist as subdirectories of
   `.planning/system-wide-standardization/` suggesting they may be internal SWS
   phases, not separate blockers

**This is a decision point for the user:** Is the Meta Pipeline sequence (T&I ->
CQ -> DE -> SWS) still enforced? Or has it been superseded by SWS's internal
sequencing? The answer changes whether SWS can start after only repo-cleanup +
agent-env, or must wait for three additional plans.

**Confidence: MEDIUM** -- The Meta Pipeline question is genuinely ambiguous. The
ROADMAP says one thing (sequential P0 blocking), the DIAGNOSIS says another (SWS
has CANON as first step, no external deps).

---

## Convergence Loop Results

### CL-1: ROADMAP Milestone References Verified

Every milestone cited in the alignment matrix exists in ROADMAP.md:

- Meta Pipeline items 1-4: lines 94-97
- Operational Visibility: line 98
- Chain 0 description: lines 234-246
- Foundation/Core/Enhancement phase buckets: lines 121-128

No phantom milestones cited. **VERIFIED.**

### CL-2: SWS PLAN.md Step 1 Description Match

My CANON description matches the plan:

- Step 1 sub-steps 1a-1i: verified against S-07 findings lines 22-33
- CANON produces schemas, enforcement, tenets, registry: verified against
  PLAN.md lines 39-67
- CANON is built WITHIN SWS, not external: verified against S-07 finding line
  177 and PLAN.md summary
- Tenets migrated from `.planning/system-wide-standardization/tenets.jsonl`:
  verified against D77 and D32

**VERIFIED.** No corrections needed.

### CL-3: CANON-Eligible Artifacts Based on Actual Plan Outputs?

Cross-checked each claim against the specific findings:

- **Passive-surfacing "5 fix patterns"**: Verified in S-04 lines 133-137 (D1
  categorization)
- **Propagation "baseline mechanism"**: Verified in S-05 Step 5 (line 19)
- **Propagation "shared-lib extraction"**: Verified in S-05 Step 8 (line 22)
- **Agent-env "Zod schemas"**: Verified in S-06 Step 5.5 (line 63)
- **Agent-env "quality rubric"**: Verified in S-06 Phase 2 (line 35)
- **Repo-cleanup produces NO patterns**: Verified in S-01 -- all steps are
  deletions, updates, corrections

**VERIFIED.** All claims grounded in plan inventories, not speculation.

### CL-4: All Plans and All Active ROADMAP Milestones Covered?

**Plans:** All 7 plans appear in the alignment matrix (repo-cleanup,
custom-statusline, cli-tools, passive-surfacing, propagation, agent-env, SWS).
**COVERED.**

**Active ROADMAP milestones:**

- Meta Pipeline #1 (T&I): Covered in gap analysis. Not among 7 plans.
- Meta Pipeline #2 (CQ): Covered in gap analysis. Not among 7 plans.
- Meta Pipeline #3 (DE): Covered in gap analysis. Not among 7 plans.
- Meta Pipeline #4 (SWS): Covered as plan #7.
- Operational Visibility: Covered in gap analysis. Partial overlap with
  passive-surfacing and propagation.
- S0 Critical Debt: Covered in gap analysis. Not covered by any plan.
- M1.5, M1.6: Noted as paused. Not relevant to current orchestration.

**VERIFIED.** All active milestones accounted for.

### Corrections Applied During CL

1. **Added Meta Pipeline gap analysis** -- initial draft did not adequately flag
   that Meta Pipeline #1-#3 exist as plans but are not among the 7 active plans.
   This is a significant gap or a deliberate scope decision.
2. **Strengthened the "decision point" callout** about Meta Pipeline sequencing
   being ambiguous.
3. **Downgraded cli-tools CANON relevance** from "WEAK" to "NO" for tenet
   candidates after re-examining what the plan actually produces vs what CANON
   needs.
4. **Verified tenet count** -- DECISIONS.md says 18 tenets but plan references
   T1-T19. S-07 documents this as a known contradiction (tenet count ambiguity).

---

## Sources

| #   | Path                                                 | Type                    | Trust                   | Notes                                                         |
| --- | ---------------------------------------------------- | ----------------------- | ----------------------- | ------------------------------------------------------------- |
| 1   | `ROADMAP.md`                                         | Product roadmap         | HIGHEST (canonical doc) | Lines 86-280 (milestones, meta pipeline, dependency chains)   |
| 2   | `.planning/plan-orchestration/DIAGNOSIS.md`          | Orchestration diagnosis | HIGH                    | 7-plan inventory, dependency analysis                         |
| 3   | `.planning/system-wide-standardization/PLAN.md`      | SWS implementation plan | HIGH                    | Step 1 (CANON), cross-cutting infrastructure, execution model |
| 4   | `.planning/system-wide-standardization/DECISIONS.md` | SWS decisions           | HIGH                    | 92 decisions, 18 tenets, CANON spec                           |
| 5   | S-01 through S-07 findings                           | Plan inventories        | HIGH                    | Per-plan step inventory, file touchpoints, post-conditions    |
| 6   | Memory: `project_agent_env_analysis.md`              | Agent-env status        | HIGH                    | "All 5 phases must complete before SWS Phase 1"               |
| 7   | Glob verification                                    | Filesystem              | HIGHEST                 | Confirmed Meta Pipeline sub-plan directories exist            |

## Contradictions

1. **Meta Pipeline sequencing vs DIAGNOSIS.md scope:** The ROADMAP declares a
   strict P0 sequential pipeline (T&I -> CQ -> DE -> SWS) with all milestones
   blocked until completion. But the DIAGNOSIS.md only includes SWS among the 7
   active plans, and SWS's own PLAN.md says CANON (Step 1) has zero external
   dependencies. These statements cannot both be true simultaneously. Either (a)
   the Meta Pipeline sequence is still enforced and SWS cannot start yet, or (b)
   the Meta Pipeline sequence has been superseded and the 7 plans proceed as the
   DIAGNOSIS describes.

2. **Agent-env "must complete before SWS Phase 1" vs CANON having "zero external
   dependencies":** Memory note says agent-env must finish before SWS starts.
   SWS PLAN.md says CANON has no dependencies. Resolution: Agent-env informs SWS
   Step 13 (Agents), not Step 1 (CANON). Agent-env could complete after CANON
   but must complete before Step 13. The memory note may be overly conservative.

## Gaps

1. **Meta Pipeline #1-#3 status is unclear.** These plans exist but their
   current status (active? dormant? superseded?) is not documented in the
   DIAGNOSIS.md 7-plan inventory. This is the single largest gap in the
   orchestration analysis.

2. **S0 Critical Debt coverage.** 10 S0 items (security, performance) are not
   addressed by any of the 7 plans. The ROADMAP states these are always-active
   regardless of sprint.

3. **Operational Visibility sprint status.** ~25% complete, P0 BLOCKED. Some
   tracks overlap with passive-surfacing (Track E) and propagation (Track D CI
   items). The orchestration analysis does not address how completing those 2
   plans affects Operational Visibility progress.

## Serendipity

1. **SWS planning directory is a CANON prototype.** D77 notes that the planning
   artifacts (decisions.jsonl, tenets.jsonl, etc.) will become CANON's "first
   test case." The SWS planning directory already practices JSONL-first with
   generated MD views -- CANON is already partially validated by the planning
   process that designed it.

2. **Propagation's baseline pattern is a natural fit for CANON enforcement.**
   The `known-propagation-baseline.json` concept (track known violations, only
   fail on NEW violations) is exactly the pattern CANON enforcement manifests
   use. Running propagation Wave 1 before CANON means this pattern exists as a
   reference implementation.

3. **The 3 Meta Pipeline sub-plans could be treated as SWS Phase 0.** If T&I,
   CQ, and DE are effectively SWS prerequisites, they could be reframed as "SWS
   Phase 0" work that runs before CANON Step 1, aligning both the ROADMAP's
   sequential requirement and the practical desire to start CANON soon.

---

## Confidence Assessment

- HIGH claims: 8 (ROADMAP milestone alignment, plan-ROADMAP gaps, CANON Step 1
  description, agent-env CANON relevance, file verification)
- MEDIUM claims: 5 (CANON-eligible artifact assessment for
  passive-surfacing/propagation, effort timing, sequencing recommendation, Meta
  Pipeline interpretation)
- LOW claims: 1 (Meta Pipeline #1-#3 current status)
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH** (the Meta Pipeline ambiguity prevents full
  HIGH confidence on sequencing)
