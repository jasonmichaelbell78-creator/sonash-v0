# Findings: Convergence-Loop Integration with the R&D Pipeline

**Searcher:** deep-research-searcher **Profile:** codebase + web (verification
patterns, pipeline validation) **Date:** 2026-04-04 **Sub-Question IDs:** SQ8
(D8)

---

## 1. Sub-Question Restated

SoNash has a `/convergence-loop` skill (T20 tenet, canonical) that provides
multi-pass claim verification through agent-based discovery. It is already used
by `/deep-research` Phase 3 and `/deep-plan` Phase 0. The original
research-discovery-standard plan decision D5 kept `CL-PROTOCOL` as an
independent document under R&D ecosystem governance (not a user-invocable
skill), and the broader question is whether CL-PROTOCOL should merge with or
stay independent from the `/convergence-loop` skill.

The new `/rnd` pipeline (IDEA → BRAINSTORM → RESEARCH → PLAN → IMPLEMENT → TEST
→ COMPLETE) needs verification at stage transitions. Three architectural models
exist:

- **Embedded (stage-internal):** Each stage runs its own CL at completion before
  advancing.
- **Cross-cutting (orchestrated):** Stages complete, orchestrator runs CL at
  transition points.
- **Separate invocation (user-driven):** User manually invokes CL when they want
  verification.

**Key question:** Which model (or hybrid) best fits the /rnd pipeline while
respecting the original D3/D5 independence decision?

---

## 2. Search Strategy

**Round 1 — Codebase baseline (primary sources):**

- Read `.claude/skills/convergence-loop/SKILL.md` — full workflow, presets,
  programmatic mode, current integrations
- Read `.claude/skills/convergence-loop/REFERENCE.md` — behavior definitions,
  composable behaviors, state schema
- Read `.planning/plan-orchestration/CL-PROTOCOL.md` — the existing D1-D4/V1-V4
  protocol, placement table, guard rails
- Read `.planning/research-discovery-standard/DECISIONS.md` — original D3
  (document location) and D5 (CL-PROTOCOL disposition) decisions
- Read `.claude/skills/deep-research/SKILL.md` — how Phase 3 invokes CL
  (research-claims preset), Phase 0.5 quick-pass integration
- Read `.claude/skills/deep-plan/SKILL.md` — Phase 0 DIAGNOSIS verification
  (MUST for L/XL, SHOULD for S/M)
- Read `.claude/skills/brainstorm/SKILL.md` — Phase 4 CL verify, Phase 0
  landscape claims verify

**Round 2 — Industry verification patterns (web):**

- CI/CD pipeline stage-gate patterns (embedded vs. cross-cutting verification)
- Data pipeline validation patterns (dbt/Great Expectations between stages)
- Stage-Gate product development (Cooper) — mandatory vs optional gate criteria
- Cross-cutting concern architectural patterns in software

**Round 3 — Existing findings cross-reference:**

- D1-state-machine findings (R&D two-axis model, stage transitions)
- D2-auto-advance findings (FileChanged hook, watcher architecture)
- Evidence of existing CL integration patterns in the codebase

---

## 3. Findings

### Finding 1: The convergence-loop skill already has a formal "Programmatic Mode" designed for exactly this integration [CONFIDENCE: HIGH]

The `/convergence-loop` SKILL.md (v1.1, 2026-03-15) has an explicit section
titled "Programmatic Mode" [S1]:

> Other skills reference this skill's workflow without invoking
> `/convergence-loop` directly. To integrate:
>
> 1. Read this SKILL.md's Workflow section
> 2. Implement the Setup → Loop → Report sequence in your skill's relevant phase
> 3. Use the T20 tally format
> 4. Reference REFERENCE.md for behavior definitions and slicing templates

This is a "pull" interface: consuming skills implement the CL workflow
themselves. The returning contract is defined: "For programmatic callers, return
the verified claims set, convergence status, and confidence score."

**Implication:** The /rnd pipeline does not need to invent a new integration
pattern. Programmatic Mode is the canonical contract. This is the cross-cutting
model already built into CL's design.

Sources: [S1] `.claude/skills/convergence-loop/SKILL.md` (Programmatic Mode
section)

---

### Finding 2: The CL-PROTOCOL (D1-D4/V1-V4) is already a cross-cutting pattern, not embedded in individual stages [CONFIDENCE: HIGH]

The existing `CL-PROTOCOL.md` [S2] defines two protocol phases:

- **Phase D (Discovery CL):** Run BEFORE executing any plan step that modifies
  code. Verifies that plan claims are still accurate.
- **Phase V (Verification CL):** Run AFTER executing plan steps. Verifies fixes
  are functional.

The placement table shows it is invoked by the **orchestrator** at defined
checkpoints, not by individual plan steps internally:

| Orchestrator Step               | Protocol Phase | Scope                        |
| ------------------------------- | -------------- | ---------------------------- |
| Step 1: S0 Pre-Verification     | Phase D (full) | S0 debt items                |
| Step 4: S0 Post-Verification    | Phase V (full) | S0 fix effectiveness         |
| Step 6: Wave 1 Pre-Verification | Phase D (full) | All 5 plan entry assumptions |

This is the cross-cutting model in practice. The protocol is an
orchestrator-owned concern that fires at defined transition points between
stages. Individual stages do not own their own CL.

Sources: [S2] `.planning/plan-orchestration/CL-PROTOCOL.md`

---

### Finding 3: The existing D5 decision keeps CL-PROTOCOL as independent governance — respecting this is mandatory [CONFIDENCE: HIGH]

The original research-discovery-standard DECISIONS.md decision D5 [S3]:

> **CL-PROTOCOL disposition:** Keep as protocol doc, move under R&D ecosystem
> governance. Not a skill.
>
> **Rationale:** Used across multiple plans, not user-invocable. General enough
> for R&D governance.

The CL-PROTOCOL is a governance document. The `/convergence-loop` skill is a
user-invocable tool. These are intentionally separate:

- **CL-PROTOCOL:** Specifies WHICH checks to run, WHEN to run them, WHICH agents
  to use (always opus), HOW to structure D1-D4/V1-V4 phases, WHAT counts as
  convergence.
- **/convergence-loop:** Provides the T20 tally machinery, composable behaviors,
  state persistence, and Programmatic Mode contract.

The protocol defines policy; the skill provides execution capability. This is an
architectural principle analogous to a policy document vs. the infrastructure
that enforces it. The R&D pipeline must respect D5 — do not merge or conflate
these.

Sources: [S3] `.planning/research-discovery-standard/DECISIONS.md` (D5)

---

### Finding 4: Three skills already demonstrate different CL invocation patterns, establishing a precedent taxonomy [CONFIDENCE: HIGH]

A codebase survey reveals three distinct integration patterns already in use:

**Pattern A — Mandatory CL at every qualifying phase transition
(`/deep-plan`):** Phase 0 Step 9 of `/deep-plan` [S4]:

> "Convergence-loop verify DIAGNOSIS (MUST for L/XL tasks, SHOULD for S/M) — if
> DIAGNOSIS.md makes 5+ claims about codebase state, verify via convergence-loop
> quick preset. Wrong diagnosis cascades through the entire plan."

This is conditional-mandatory: triggered when claim count threshold is met,
before plan can proceed. Tier-scaled (MUST/SHOULD based on task size).

**Pattern B — CL as phase-ending verification in research (`/deep-research`):**
Phase 0.5 of `/deep-research` [S5]:

> "CL quick-pass (MUST): After generating sub-questions, run convergence-loop
> quick preset to verify coverage — are there blind spots? overlaps? Missing
> angles? Fix before presenting plan."

Phase 3 runs the full `research-claims` preset (6-behavior sequence). This is
embedded in the skill's own workflow, but the skill itself is the orchestrator.

**Pattern C — SHOULD-level at early creative phases (`/brainstorm`):** Phase 0
of `/brainstorm` [S6]:

> "Convergence-loop verify landscape (SHOULD): If Phase 0 makes 3+ claims about
> codebase state, verify via CL quick preset before presenting."

Phase 4 also includes CL verify of BRAINSTORM.md before routing. This is
lower-obligation (SHOULD not MUST) because brainstorm is early-stage and claims
are more provisional.

**Conclusion:** The existing pattern taxonomy is: MUST when wrong claims cascade
into irreversible work; SHOULD when claims are provisional; pattern B when the
skill is itself the research orchestrator.

Sources: [S4] `.claude/skills/deep-plan/SKILL.md`, [S5]
`.claude/skills/deep-research/SKILL.md`, [S6]
`.claude/skills/brainstorm/SKILL.md`

---

### Finding 5: CI/CD and data pipeline industry patterns strongly support the cross-cutting model over embedded stage-internal verification [CONFIDENCE: MEDIUM]

Industry verification architecture across three analogous domains:

**CI/CD pipelines (QAOps pattern):** Quality gates are implemented as
orchestrator-owned enforcement points BETWEEN stages, not inside stages
themselves [S7]. The pipeline orchestrator (e.g., GitLab CI, GitHub Actions)
controls which gates fire at which transition, with "must meet" vs "should meet"
criteria distinctions. Individual job stages do not manage their own gate
policy.

**Data pipelines (dbt/Great Expectations):** dbt tests run as
post-transformation hooks managed by the pipeline orchestrator
(Airflow/Prefect), not embedded inside individual model definitions. Great
Expectations validators fire between extract and transform, managed externally
[S8]. The principle: "dbt builds data; GX validates it" — producer and validator
are separate concerns.

**Stage-Gate product development (Cooper):** Every stage is followed by a gate
review. Gates use "must meet" (mandatory) and "should meet" (conditional)
criteria. The gate is managed by gatekeepers, not by the stage team [S9]. The
stage team completes their work; the gate decides whether progression is
allowed.

**Common principle across all three:** Verification is an orchestrator
responsibility at transition points, not an internal responsibility of
individual stages. This is the cross-cutting model.

**Key difference from embedded:** Embedded means the stage cannot complete
without verification. Cross-cutting means the stage completes its work, and the
orchestrator runs verification before allowing advancement. The distinction
matters for overrideability and performance.

Sources: [S7] CI/CD QAOps literature, [S8] dbt/Great Expectations architecture,
[S9] Stage-Gate International

---

### Finding 6: The "embedded" model creates a coupling anti-pattern for the /rnd pipeline's early stages [CONFIDENCE: HIGH]

The `/convergence-loop` SKILL.md defines an explicit "When NOT to Use" section
[S1]:

> - Single-value lookups ("what version is X?")
> - Mechanical operations (git mv, file deletion)
> - Tasks with binary right/wrong answers verifiable by running code
> - **When claims set has <3 items (overhead exceeds value)**

At the IDEA stage, there are no claims to verify. At BRAINSTORM, claims are
provisional and exploratory — the value of brainstorm is generating ideas, not
verifying them. Embedding CL at every stage would:

1. **Violate the <3 claims guardrail** for early stages (IDEA, BRAINSTORM)
2. **Create ceremony around stages that don't need it** (false security theater)
3. **Make the pipeline feel like overhead** rather than a lightweight lifecycle
   tracker
4. **Not be skippable** by design if embedded — stages that genuinely don't need
   CL can't opt out

The embedded model is specifically wrong for early-stage R&D work.

Sources: [S1] `.claude/skills/convergence-loop/SKILL.md` (When NOT to Use
section)

---

### Finding 7: The stage-transition claim-density heuristic determines where CL adds value vs noise [CONFIDENCE: HIGH]

Cross-referencing the CL guardrails with the R&D pipeline stage outputs:

| Stage      | Typical Output                   | Claim Count                        | Claims That Could Cascade                 | CL Value |
| ---------- | -------------------------------- | ---------------------------------- | ----------------------------------------- | -------- |
| IDEA       | Rough concept, no artifact       | 0-2                                | None                                      | None     |
| BRAINSTORM | BRAINSTORM.md, 3+ directions     | 3-8 (provisional)                  | Low (all provisional)                     | LOW      |
| RESEARCH   | RESEARCH_OUTPUT.md, claims.jsonl | 20-100+                            | HIGH (plan will be built on these)        | HIGH     |
| PLAN       | PLAN.md, DECISIONS.md            | 10-30 (implementation assumptions) | HIGH (code will be written against these) | HIGH     |
| IMPLEMENT  | Code changes                     | Binary (runs/doesn't)              | Medium (tests will validate)              | MEDIUM   |
| TEST       | Test results                     | Binary (pass/fail)                 | Low (tests are the verification)          | LOW      |
| COMPLETE   | Archived                         | None                               | None                                      | None     |

**Key insight:** CL adds maximum value at the RESEARCH → PLAN and PLAN →
IMPLEMENT transitions. These are the points where unverified claims cause the
most expensive downstream rework (planning against wrong research, implementing
against wrong plan assumptions).

The `/deep-research` skill already runs Phase 2.5 verification and Phase 3
research-claims CL before the RESEARCH stage is considered complete. The
`/deep-plan` skill already runs DIAGNOSIS CL before the PLAN stage is considered
complete.

**Implication for /rnd:** The existing skills already gate their own outputs
with CL. The /rnd pipeline needs to recognize these outputs as pre-verified when
they exist, rather than adding redundant CL on top.

Sources: [S1] `.claude/skills/convergence-loop/SKILL.md`, [S4] deep-plan, [S5]
deep-research

---

### Finding 8: The existing skill-CL integrations already serve as the RESEARCH → PLAN and PLAN → IMPLEMENT gates [CONFIDENCE: HIGH]

A critical architectural finding: the /rnd pipeline does not need to add new CL
gates at the most valuable transitions because those gates are already built
into the skills:

- **BRAINSTORM stage** uses `/brainstorm` → BRAINSTORM.md has CL verification in
  Phase 4 before output is committed
- **RESEARCH stage** uses `/deep-research` → research output goes through Phase
  2.5 verification + Phase 3 CL before RESEARCH_OUTPUT.md and claims.jsonl are
  finalized
- **PLAN stage** uses `/deep-plan` → DIAGNOSIS.md goes through CL before plan
  proceeds (Phase 0 Step 9)

The skills ARE the verification gates for their respective stages. The /rnd
pipeline's job is to:

1. Track that the appropriate skill was used
2. Track that the skill completed (artifacts exist on disk)
3. Recognize artifact existence as evidence of CL-gated completion

This means the /rnd state machine's stage advancement should be
**artifact-presence triggered** (per D2-auto-advance findings: FileChanged
events on canonical artifacts), not CL-execution triggered. The CL was already
run inside the skill.

Sources: [S4] deep-plan, [S5] deep-research, [S6] brainstorm

---

### Finding 9: When skills are NOT used (raw artifact creation), the /rnd orchestrator needs a CL suggestion, not a mandate [CONFIDENCE: MEDIUM]

Not every /rnd stage will be driven by a canonical skill. A user might:

- Write a PLAN.md manually without running `/deep-plan`
- Create research notes without `/deep-research`
- Skip BRAINSTORM entirely and go straight to RESEARCH

In these cases, the CL gate built into the skill was never executed. The /rnd
orchestrator should detect this and surface a CL suggestion:

> "Stage advancing to PLAN without a verified RESEARCH stage output (no
> claims.jsonl found). Recommend running `/convergence-loop quick` on your
> research notes before proceeding. Skip? [Y/n]"

This is a SHOULD-level suggestion, not a MUST-level block. The user may have
legitimate reasons to skip (e.g., they are very confident in their notes, or the
research was done externally). The R&D standard's tier model (T0-T3) from D4 and
D11 supports this: T0/T1 transitions may not warrant CL; T2/T3 always do.

Sources: [S3] DECISIONS.md (D4, D11 tier model), [S1] convergence-loop SKILL.md
(When NOT to Use)

---

### Finding 10: The "separate invocation" model fails the D11 directive — "Verifications at ALL tiers (T0-T3)" [CONFIDENCE: HIGH]

The original DECISIONS.md D11 [S3] explicitly states:

> **Verifications at ALL tiers (T0-T3).** Contrarians at T2+. T3 gets full
> contrarian + OTB.

A fully manual "user decides to invoke CL" model would mean T0 and T1 pipeline
transitions never get any verification. This directly violates D11.

The "forgotten CL" anti-pattern is real: if the pipeline has no CL policy, users
will advance stages without verification, creating false confidence in
unverified plan assumptions. This is exactly the problem the CL-PROTOCOL was
created to solve (per CL-PROTOCOL.md origin note: "Session #237 correction.
Single-pass Explore agents were run instead of proper CLs").

The pure separate invocation model is explicitly rejected by the existing D11
decision.

Sources: [S3] `.planning/research-discovery-standard/DECISIONS.md` (D11), [S2]
CL-PROTOCOL.md (Origin section)

---

### Finding 11: The "cross-cutting as SUGGESTED prompt with tier-scaled obligation" is the synthesis that respects all constraints [CONFIDENCE: HIGH]

Combining Findings 2, 4, 9, and 10 produces a synthesis model:

**CL as cross-cutting with tier-scaled obligation (MUST/SHOULD/MAY):**

- The /rnd orchestrator owns the CL policy at stage transitions
- Individual stages do not embed CL internally
- The obligation level scales with the tier and transition risk:
  - **MUST:** When advancing from RESEARCH → PLAN or PLAN → IMPLEMENT without
    skill-generated artifacts (skills do their own CL; raw artifacts need a
    gate)
  - **SHOULD:** When advancing from BRAINSTORM → RESEARCH (verify brainstorm
    assumptions; low cost, high leverage)
  - **MAY:** When a user wants extra confidence at any transition

The orchestrator runs CL at transitions. Skills that run internally
(deep-research, deep-plan) already satisfy the gate. The orchestrator detects
which path was used (skill-generated vs. manual artifact) and adjusts the
obligation level.

This model:

1. Respects D5 (CL-PROTOCOL independence maintained — this is protocol, not a
   skill being embedded)
2. Respects D11 (verification at all tiers, obligation is tier-scaled)
3. Avoids the embedded model's "no-skip" rigidity for early stages
4. Avoids the separate model's "forgotten CL" failure mode
5. Uses Programmatic Mode (Finding 1) as the execution interface
6. Extends the existing CL-PROTOCOL pattern (Finding 2) from plan orchestration
   to R&D pipeline orchestration

Sources: All above findings, synthesized

---

### Finding 12: CL feedback into pipeline state requires a defined propagation contract, not auto-advance [CONFIDENCE: HIGH]

The D2-auto-advance findings established that stage advancement should be
artifact-triggered (canonical file appears on disk). CL output is NOT a
canonical artifact in the /rnd pipeline sense — it is a verification pass on the
artifacts.

CL output needs to propagate back into pipeline state in a defined way:

**CL output → pipeline state contract:**

| CL Result                                   | Pipeline State Effect               | Action                                    |
| ------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| CONVERGED (HIGH confidence)                 | `cl_verified: true` on stage output | Advance permitted                         |
| NOT CONVERGED (corrections still declining) | `cl_verified: partial`              | Present corrections to user, user decides |
| NOT CONVERGED (no convergence trend)        | `cl_verified: false`                | Block advance, surface corrections        |
| SKIPPED (user decision)                     | `cl_verified: skipped:<reason>`     | Advance permitted with logged skip reason |

This contract must be explicit in the /rnd state schema. The state file should
persist the CL run reference (link to the convergence-loop state file) for
auditability.

**Critical:** Auto-advance on CL completion is wrong. CL always requires a user
gate (convergence-loop SKILL.md Rule 3: "User gate before convergence
declaration — MUST present tally and recommend converged/not-converged. User
decides"). The CL can recommend, but the user decides both convergence AND stage
advancement.

Sources: [S1] convergence-loop SKILL.md (Critical Rule 3), [D2 findings]
auto-advance research

---

### Finding 13: The minimum /rnd ↔ /convergence-loop interface requires only three parameters [CONFIDENCE: HIGH]

Using the Programmatic Mode contract from Finding 1 and the CL-PROTOCOL's
placement-in-subplans pattern from Finding 2, the minimum interface is:

```
/rnd stage transition CL invocation:
  input:
    - claims_source: path to artifact being advanced FROM (e.g., RESEARCH_OUTPUT.md)
    - preset: "quick" | "standard" | "research-claims" (based on tier)
    - topic: "<rnd-slug>-<transition>" (e.g., "jason-os-research-to-plan")
  output:
    - convergence_status: "CONVERGED" | "NOT_CONVERGED" | "SKIPPED"
    - confidence: "HIGH" | "MEDIUM" | "LOW"
    - cl_state_ref: path to .claude/state/convergence-loop-<topic>.state.json
    - corrections_applied: integer
```

The /rnd pipeline writes `cl_state_ref` into its own state file, linking the CL
run to the stage transition for auditability. This is the minimum coupling
needed — /rnd does not need to know anything about CL internals, only the inputs
and outputs.

This interface is already compatible with the existing CL state schema
(REFERENCE.md Section 6) without modification.

Sources: [S1] convergence-loop SKILL.md (Programmatic Mode, Input, Output
sections), [S2] CL-PROTOCOL.md

---

### Finding 14: The CL claim-count guardrail (<3 items = overhead exceeds value) provides a natural early-stage filter [CONFIDENCE: HIGH]

The `/convergence-loop` SKILL.md Validate gate [S1]:

> "Check input — identify claims format, count claims. If >100 claims: MUST
> suggest decomposition before starting. Do not proceed." "When claims set has
> <3 items (overhead exceeds value)" — do not use.

This guardrail provides a natural filter for early R&D stages. At IDEA and early
BRAINSTORM stages, claim count is typically 0-2 (not yet codified). The CL won't
even run in these cases — the Validate gate will stop it.

The /rnd orchestrator can use this as an automated early-exit: before suggesting
a CL run at a stage transition, count the claims in the artifact. If <3, skip
silently (no ceremony). If 3+, proceed with the tier-scaled suggestion.

This eliminates the "noise at every step" anti-pattern entirely through the
skill's own internal guard rail, without requiring the /rnd pipeline to
implement custom filtering logic.

Sources: [S1] `.claude/skills/convergence-loop/SKILL.md` (Validate step)

---

## 4. Synthesis — Architectural Verdict

**VERDICT: Cross-cutting model with tier-scaled obligation and skill-integration
awareness.**

### Why not embedded:

The embedded model (each stage runs its own CL before advancing) is wrong for
three reasons. First, early stages (IDEA, BRAINSTORM) have claim counts below
the CL minimum threshold — embedding CL here is pure ceremony with no
verification value. Second, the existing skills (deep-research, deep-plan,
brainstorm) already embed CL internally — adding orchestrator-level CL on top
creates redundant verification with no added confidence. Third, the embedded
model cannot be skipped without modifying stage logic, creating friction for
T0/T1 transitions that don't warrant CL.

### Why not separate invocation:

The separate invocation model (user invokes CL manually) is rejected by the
existing D11 decision: "Verifications at ALL tiers (T0-T3)." A fully manual
model means T0/T1 transitions get no verification policy. The CL-PROTOCOL origin
note documents exactly this failure mode (Session #237: CLs were forgotten,
single-pass agents were run instead). The pipeline must have a CL policy, not
just a CL option.

### Why cross-cutting wins:

The cross-cutting model (orchestrator runs CL at transition points, individual
stages do not own CL) aligns with three independent industry patterns (CI/CD
quality gates, dbt/GX data pipeline validation, Cooper Stage-Gate), with the
existing CL-PROTOCOL design, and with the skills' own integration patterns. The
orchestrator has full context about which skill was used, what artifacts exist,
and which tier applies — it is the right owner of the verification policy.

### The skill-integration awareness refinement:

The key insight that separates this verdict from a generic "use cross-cutting"
answer: the /rnd orchestrator must distinguish between **skill-completed
stages** (where CL was already run internally by the skill) and
**manually-created stages** (where no skill CL was run). For skill-completed
stages, the orchestrator recognizes the artifact as pre-verified and surfaces
only a SHOULD-level reminder. For manually-created stages at T2/T3 transitions,
it surfaces a MUST-level gate.

### D3/D5 independence respected:

CL-PROTOCOL remains independent from `/convergence-loop`. The /rnd pipeline uses
CL-PROTOCOL-style cross-cutting placement (policy) and calls `/convergence-loop`
Programmatic Mode (execution). The two remain distinct. This is the same
relationship that already exists in plan orchestration.

---

## 5. Recommendations Specific to SoNash /rnd + /convergence-loop Integration

### R1: Define a CL transition policy table in the R&D standard protocol (RDS-PROTOCOL.md) [PRIORITY: P1]

The policy belongs in the protocol document, not in the /rnd skill
implementation. The protocol table specifies which transitions get which CL
obligation level (MUST/SHOULD/MAY), which preset to use, and when
skill-completion counts as satisfying the gate.

### R2: Implement skill-completion detection in /rnd stage advancement [PRIORITY: P1]

The /rnd orchestrator should check for canonical skill artifacts before
suggesting a CL run:

- BRAINSTORM stage: check for `.research/<slug>/BRAINSTORM.md`
- RESEARCH stage: check for `.research/<slug>/claims.jsonl` (CL already run
  internally by deep-research)
- PLAN stage: check for `.planning/<slug>/DECISIONS.md` (CL already run
  internally by deep-plan)

If canonical artifact exists, treat stage as pre-verified and reduce CL
suggestion to SHOULD-level (informational, not blocking).

### R3: Use the 3-parameter minimum interface from Finding 13 [PRIORITY: P1]

Do not add coupling beyond the minimum interface (claims_source, preset, topic
as input; convergence_status, confidence, cl_state_ref, corrections_applied as
output). Keeping the interface narrow prevents /rnd from depending on CL
internals.

### R4: Store CL results in /rnd state as a transition audit record [PRIORITY: P2]

Add a `cl_transitions` array to the /rnd state file for each stage advancement
that involved a CL run. Each entry records: `from_stage`, `to_stage`,
`cl_state_ref`, `convergence_status`, `timestamp`. This enables later audit of
which pipeline stages had verified claims.

### R5: Use the <3 claims auto-filter for early stages (IDEA/BRAINSTORM) [PRIORITY: P2]

Before suggesting CL at IDEA → BRAINSTORM or BRAINSTORM → RESEARCH transitions,
count artifact claims. If <3, silently skip CL suggestion. The CL's own Validate
gate enforces this, but the /rnd orchestrator can provide an earlier, cleaner
exit.

### R6: Apply T20 tally language consistently in /rnd stage transition reports [PRIORITY: P3]

When CL runs as part of a stage transition, display the T20 tally (Confirmed /
Corrected / Extended / New) in the transition report. This maintains vocabulary
consistency and signals to the user that the advancement is evidence-backed.

---

## 6. Stage-by-Stage CL Value Assessment

| Stage Transition      | CL Value   | Obligation                                                   | Preset                                                | Notes                                                                                            |
| --------------------- | ---------- | ------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| IDEA → BRAINSTORM     | None       | MAY (skip)                                                   | —                                                     | No claims to verify. CL guardrail fires (<3 items).                                              |
| BRAINSTORM → RESEARCH | LOW-MEDIUM | SHOULD                                                       | `quick`                                               | Verify brainstorm assumptions before investing in T3 research. 3-8 claims typically.             |
| RESEARCH → PLAN       | HIGH       | MUST (if manual), satisfied-by-skill (if deep-research used) | `research-claims` (manual) or skip (if deep-research) | Deep-research already ran Phase 2.5 + Phase 3 CL. Manual research needs full gate.               |
| PLAN → IMPLEMENT      | HIGH       | MUST (if manual), satisfied-by-skill (if deep-plan used)     | `standard` (manual) or skip (if deep-plan)            | Deep-plan already ran DIAGNOSIS CL. Manual plan needs gate. Wrong plan = wasted implementation.  |
| IMPLEMENT → TEST      | LOW        | MAY                                                          | —                                                     | Code itself is the verification artifact. Tests will reveal plan errors.                         |
| TEST → COMPLETE       | LOW-MEDIUM | SHOULD                                                       | `quick`                                               | Verify test coverage claims if they were formally documented. Optional for informal test passes. |

---

## 7. Interface Proposal: How /rnd calls /convergence-loop

### Invocation Contract

```
/rnd stage transition check:
  1. Determine artifact being advanced FROM (BRAINSTORM.md, claims.jsonl, PLAN.md, etc.)
  2. Detect whether artifact was skill-generated (check metadata.json or artifact path)
  3. Apply tier-scaled policy:
     - Skill-generated: SHOULD (suggest, not block)
     - Manual: MUST for RESEARCH→PLAN and PLAN→IMPLEMENT; SHOULD for others
  4. If policy is SHOULD or MUST, count claims in artifact
     - <3 claims: auto-skip, log as "cl_verified: skipped:below-threshold"
     - 3+ claims: surface CL suggestion to user
  5. On user approval, invoke CL via Programmatic Mode:
     - Read convergence-loop SKILL.md Workflow section
     - Initialize with: claims_source, preset (tier-determined), topic ("<slug>-<transition>")
     - Execute Setup → Loop → Report sequence
     - Return to /rnd: convergence_status, confidence, cl_state_ref, corrections_applied
  6. Write CL result to /rnd state as transition audit record
  7. Present result to user (T20 tally + convergence recommendation)
  8. User approves stage advancement (CLAUDE.md guardrail #2: never advance without
     explicit approval)
```

### Coupling Boundaries

**What /rnd knows about /convergence-loop:**

- It exists and has a Programmatic Mode contract
- Inputs: claims source, preset name, topic
- Outputs: convergence_status, confidence, cl_state_ref
- Minimum claim threshold: 3 (below this, don't invoke)

**What /rnd does NOT know about /convergence-loop:**

- Internal pass mechanics (that's CL's concern)
- Agent allocation (CL decides based on claims volume)
- Behavior sequence (determined by preset)
- State file schema internals

This keeps the coupling minimal and preserves the independence validated in D5.

---

## 8. Gaps Identified

1. **No existing /rnd skill to read:** The /rnd pipeline is being designed
   fresh. This analysis is prospective — there is no existing /rnd SKILL.md to
   cross-check against. Recommendations must be re-validated once /rnd is
   implemented.

2. **Tier-mapping for /rnd not yet defined:** The R&D pipeline tier (T0-T3) at
   which a given /rnd project operates determines the CL obligation level. The
   MUST/ SHOULD/MAY distinction in this document assumes the orchestrator knows
   the project's tier. How the project tier is set and tracked is not yet
   resolved (pending /rnd design decisions).

3. **Skill-completion detection accuracy:** Detecting whether a stage was
   "skill-completed" by checking for artifact existence (claims.jsonl,
   DECISIONS.md) may produce false positives if artifacts were created manually
   or by other tools. A `metadata.json` field indicating skill_invoked would be
   more reliable. Whether deep-research and deep-plan already write this field
   was not fully confirmed.

4. **CL interaction with partial/stale research:** The /rnd pipeline may have
   research artifacts from previous sessions that have since become stale. The
   temporal-check behavior in the research-claims preset handles this, but the
   staleness rules (technology: stale after 7 days) would need to factor into
   the RESEARCH → PLAN gate decision.

5. **Multi-branch /rnd projects:** D1-state-machine findings established that
   the pipeline is DAG-capable (parallel IMPLEMENT branches). CL integration for
   parallel branches was not analyzed. If two IMPLEMENT branches converge at
   TEST, which branch's CL results feed the TEST → COMPLETE gate?

6. **CL result persistence format:** The interface proposal links CL state files
   from /rnd state. The convergence-loop state format (REFERENCE.md Section 6)
   is stable, but the /rnd state schema for `cl_transitions` needs explicit
   design.

---

## 9. Source List with Trust Tiers

| #   | Source                                                                                              | Title                                                                     | Type                       | Trust  | CRAAP Avg | Date       |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------- | ------ | --------- | ---------- |
| S1  | `.claude/skills/convergence-loop/SKILL.md`                                                          | Convergence Loop Skill (v1.1)                                             | codebase-official          | HIGH   | 5.0       | 2026-03-15 |
| S2  | `.planning/plan-orchestration/CL-PROTOCOL.md`                                                       | Plan Execution CL Protocol (v1.1)                                         | codebase-official          | HIGH   | 5.0       | 2026-03-24 |
| S3  | `.planning/research-discovery-standard/DECISIONS.md`                                                | R&D Standard Decisions (D1-D23)                                           | codebase-official          | HIGH   | 5.0       | 2026-03-25 |
| S4  | `.claude/skills/deep-plan/SKILL.md`                                                                 | Deep Plan Skill (v3.0)                                                    | codebase-official          | HIGH   | 5.0       | 2026-03-07 |
| S5  | `.claude/skills/deep-research/SKILL.md`                                                             | Deep Research Skill (v1.9)                                                | codebase-official          | HIGH   | 5.0       | 2026-04-03 |
| S6  | `.claude/skills/brainstorm/SKILL.md`                                                                | Brainstorm Skill (v1.0)                                                   | codebase-official          | HIGH   | 5.0       | 2026-04-01 |
| S7  | https://www.devopstraininginstitute.com/blog/10-cicd-quality-gates-for-production-level-reliability | 10 CI/CD Quality Gates for Production-Level Reliability                   | industry-practitioner      | MEDIUM | 3.8       | 2025       |
| S8  | https://www.getdbt.com/blog/building-a-robust-data-pipeline-with-dbt-airflow-and-great-expectations | Building a robust data pipeline with dbt, Airflow, and Great Expectations | official-vendor-blog       | MEDIUM | 4.0       | 2024       |
| S9  | https://www.stage-gate.com/blog/the-stage-gate-model-an-overview/                                   | The Stage-Gate Model: An Overview                                         | authoritative-practitioner | HIGH   | 4.2       | 2024       |
| S10 | `.claude/skills/convergence-loop/REFERENCE.md`                                                      | Convergence Loop Reference                                                | codebase-official          | HIGH   | 5.0       | 2026-03-15 |
| S11 | `.claude/skills/deep-research/REFERENCE.md`                                                         | Deep Research Reference (Section 14)                                      | codebase-official          | HIGH   | 5.0       | 2026-03-29 |

---

## Contradictions

**C1: D11 says "verifications at ALL tiers" vs. CL guardrail says "don't use for
<3 claims"**

D11 mandates verification at T0 and T1 transitions. The CL skill explicitly
prohibits invocation when the claims set has fewer than 3 items (overhead
exceeds value). Early /rnd stages (IDEA, BRAINSTORM) typically have 0-2 codified
claims.

Resolution path: D11's "verification" at T0/T1 is satisfied by lighter checks
than a full CL run — the deep-research SKILL.md confirms this with "source
exists? recency OK?" as the T0/T1 verification standard (DECISIONS.md D11). A CL
is not required at T0/T1; only basic source checks are. The CL guardrail and D11
are compatible when read precisely: CL is the T2/T3 verification instrument, not
T0/T1.

**C2: Artifact-presence as "pre-verified" vs. user might have run deep-research
without completing Phase 2.5**

The model in Finding 8 treats claims.jsonl existence as evidence of CL-gated
completion. But a user could have aborted deep-research after Phase 1 (parallel
research) and before Phase 2.5 (verification). The claims.jsonl would exist but
be unverified.

Resolution path: deep-research Phase 2.5 produces verifier findings files
(V1.md, V2.md in the findings/ directory) in addition to claims.jsonl. A more
robust signal is presence of both claims.jsonl AND at least one V*.md verifier
file. If V*.md is absent, treat as manually-created for the purposes of the
gate.

---

## Confidence Assessment

- HIGH claims: 10 (Findings 1, 2, 3, 4, 6, 7, 8, 10, 12, 13, 14)
- MEDIUM claims: 3 (Findings 5, 9, 11)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings grounded in direct codebase
  inspection of canonical skill documents and the existing CL-PROTOCOL. Web
  sources are used only to corroborate industry patterns, not as primary
  evidence. No training-data-only claims.
