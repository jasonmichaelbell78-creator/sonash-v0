---
name: deep-plan
description: >-
  Structured discovery-first planning for complex tasks. Ask exhaustive
  categorized questions, build a standalone decision record, then produce a
  step-by-step implementation plan with audit checkpoints and convergence-loop
  verification of diagnosis and plan claims for user approval before any code
  is written.
---

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-07
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Plan

Structured discovery-first planning that produces high-quality implementation
plans by front-loading decision-making through exhaustive questioning.

## Critical Rules (MUST follow)

1. **No artificial caps** — no ceiling on questions or plan size. Floor of ~15
   questions. Plans are as long as they need to be.
2. **Persist state incrementally** — save decisions to state file after every
   batch. Long planning sessions WILL hit compaction.
3. **Every plan includes audit checkpoints** — at minimum at plan completion, at
   phase boundaries for multi-phase plans.
4. **Show plan inline** — users may not have filesystem access. Write to file
   for persistence, display in conversation as primary output.
5. **DECISIONS.md is standalone** — not embedded in the plan. Most-referenced
   artifact during execution.
6. **Handoff is a decision tree, not a phase** — after approval, route to the
   right execution approach (subagent / GSD / manual).

## When to Use

- User invokes `/deep-plan` explicitly
- User says "ask as many questions as you need" or similar
- Task is ambiguous with 5+ design decisions that could go either way
- Task creates a new system, skill, or major feature (not a bug fix or tweak)
- Task touches multiple existing systems that need coordination
- Regular plan mode's 2-3 questions would leave too many assumptions

## When NOT to Use

- Simple bug fixes or single-file changes — just do them
- Tasks with 3-4 decisions — use regular plan mode (EnterPlanMode)
- Tasks where the user has already specified every decision
- Multi-phase project roadmaps — use `/gsd:new-project` or `/gsd:new-milestone`
- Brainstorming without a concrete implementation target — use a brainstorming
  approach first, then `/deep-plan` to plan the chosen approach

## Routing Guide

| Situation              | Use                | Why                                     |
| ---------------------- | ------------------ | --------------------------------------- |
| 5+ ambiguous decisions | `/deep-plan`       | Exhaustive discovery prevents bad plans |
| 3-4 clear decisions    | EnterPlanMode      | Lighter-weight, faster                  |
| Multi-phase roadmap    | `/gsd:new-project` | Project-level planning with milestones  |

> See `.claude/skills/deep-plan/REFERENCE.md` for the full routing table.

## Input

**Argument:** Topic or task description, passed as `/deep-plan <topic>` or
provided in conversation context.

**Output location:** Artifacts are written to `.planning/<topic-slug>/`
(DIAGNOSIS.md, DECISIONS.md, PLAN.md). User MAY specify a different location.

---

## Process Overview

```
WARM-UP:   Orientation     → Topic, process overview, effort estimate
PHASE 0:   Context         → Explore codebase, ROADMAP check, DIAGNOSIS.md
PHASE 1:   Discovery       → Exhaustive questions (floor ~15, no ceiling)
PHASE 1b:  User Discovery  → Optional: user questions/concerns, revisit answers
PHASE 2:   Decision Record → Standalone DECISIONS.md
PHASE 3:   Plan            → Steps with "Done when:" + audit checkpoints
PHASE 3.5: Self-Audit      → Verify decisions→plan coverage
PHASE 4:   Approval        → Show inline, free-form feedback, explicit gate
HANDOFF:   Routing         → Decision tree: subagent / GSD / manual
```

Use phase transition markers: `========== PHASE N: [NAME] ==========`

---

## Warm-Up (MUST)

Present before any work begins: topic name, process overview (explore → ask
questions → decision record → plan), and effort estimate (S: 20min, M: 40min, L:
60min+).

---

## Phase 0: Context Gathering (MUST)

**Purpose:** Understand before asking. Explore the codebase so questions
reference actual patterns, not generic placeholders.

1. Check CLAUDE.md for documented project conventions (MUST)
2. Read ROADMAP.md — verify task aligns with project direction (MUST)
3. Explore relevant codebase areas (SHOULD — use Explore agent for broad)
4. Identify existing patterns, conventions, and neighboring systems (MUST)
5. Produce `DIAGNOSIS.md` at the plan output location (MUST):
   - ROADMAP alignment check (aligned / misaligned / new direction)
   - Relevant existing systems and their patterns
   - Reframe check: is the task what it appears to be?
6. **Verify code-state claims (MUST):** All claims in DIAGNOSIS.md about
   specific code state (line numbers, bug descriptions, specific values,
   corruption claims) MUST include a verify command. Claims without verification
   are flagged as `[UNVERIFIED]`. Run `npm view <pkg> version` for any version
   references — plans MUST NOT assume future/unreleased software exists. Use
   "preparation" language ("prepare for eventual vN") not imperative ("migrate
   to vN").
7. **Convergence-loop verify DIAGNOSIS** (MUST for L/XL tasks, SHOULD for
   S/M) — if DIAGNOSIS.md makes 5+ claims about codebase state (claims =
   testable assertions about codebase state, per `/convergence-loop` SKILL.md),
   verify via convergence-loop quick preset. Wrong diagnosis cascades through
   the entire plan. **If claims are wrong:** correct DIAGNOSIS.md and
   re-verify before presenting. See `/convergence-loop` SKILL.md "Programmatic
   Mode" for the integration contract.
8. Present DIAGNOSIS.md to user for review (MUST)

**If misaligned with ROADMAP:** Present the conflict to the user. Options: (1)
proceed with acknowledgment, (2) reframe to align, (3) abort. Do NOT silently
proceed with a misaligned task.

**Phase gate:** User confirms diagnosis or reframes the task. If reframed,
update DIAGNOSIS.md and re-present. Do NOT proceed to Discovery until confirmed.

---

## Phase 1: Discovery (MUST)

**Purpose:** Eliminate assumptions. Every ambiguous design decision MUST be
surfaced and resolved with the user.

> Read `.claude/skills/deep-plan/REFERENCE.md` for the 8 question categories
> with example questions and phase ordering guidance.

### Discovery Rules (MUST follow)

1. **Floor of ~15 questions, no ceiling** — ask until all ambiguity is resolved.
   Do NOT skip questions to save time.
2. **Front-load critical decisions** — architecture, scope, and naming first.
   Edge cases and UX last.
3. **Offer defaults for every question** — "I recommend X because Y. Override?"
   When the user says "your call" or similar, treat it as delegation and choose
   the best option, stating what was chosen and why.
4. **Reference existing patterns** — cite actual codebase conventions, not
   generic options. "TDMS uses S0-S3 severity. Mirror this with I0-I3?"
5. **Batch related questions** — group 5-8 related questions per batch. No rigid
   cap; use judgment based on question complexity. If a batch exceeds 10
   questions, split by sub-theme — present the most critical sub-theme first.
6. **Inter-batch synthesis** — after each batch of answers, synthesize what was
   learned before asking the next batch. This prevents redundant questions.
7. **State inferences explicitly** — when an answer makes other questions
   obvious, state "Based on your answer to Q3, I'm inferring X for Q7" rather
   than silently skipping.
8. **Save decisions after every batch** (MUST) — persist to
   `.claude/state/deep-plan.state.json` with task name, current batch number,
   all decisions so far, and timestamp.
9. **Show progress** — "Batch 2 of ~3 complete. 12 decisions captured so far."

### Mid-Discovery Check (MUST — after batch 2)

"Discovery progress: N questions asked, M decisions captured. Estimated ~K more
questions. Continue, or scope-reduce?"

### Discovery Completion Signal (MUST)

"Discovery complete: N questions asked, M decisions captured. Compiling decision
record."

### Discovery Anti-Patterns (MUST avoid)

- Asking questions answerable by reading the codebase (Phase 0 should handle)
- Asking the same question in different ways
- Not offering recommended defaults
- Treating "your call" as ambiguity — it's delegation, decide and state why

---

## Phase 1b: User Discovery (MAY)

"Before I compile the decision record — any questions, concerns, or answers
you'd like to revisit?" Skip if user indicated urgency.

---

## Phase 2: Decision Record (MUST)

Compile a **standalone DECISIONS.md** at the plan output location. This is the
single source of truth referenced throughout implementation.

> See `.claude/skills/deep-plan/REFERENCE.md` for the DECISIONS.md template.

### Rules (MUST follow)

- One row per decision, numbered. Choice MUST be specific (never "TBD").
- Rationale column captures WHY. Include rejected alternatives when relevant.
- Write to file AND display inline in conversation.

**Transition:** "Decision record compiled. Proceeding to plan generation."

---

## Phase 3: Plan (MUST)

Write a structured plan. Reference DECISIONS.md rather than duplicating the
decision table.

> See `.claude/skills/deep-plan/REFERENCE.md` for the step structure template.
> Each step MUST have: title, implementation details, "Done when:" criteria, and
> optional "Depends on:" / "Triggers:" fields.

### Plan Rules (MUST follow)

1. **Be specific about files** — exact paths, not "somewhere in scripts/"
2. **Include code snippets** — for schemas, configs, and non-obvious logic
3. **No artificial size cap** — plans are as long as they need to be
4. **Mark parallelizable steps** — "Steps 3-6 can run in parallel"
5. **Reference forking sources** — "Forked from scripts/debt/intake-audit.js"
6. **Include audit checkpoint** — at minimum: "Step N: Audit — run code-reviewer
   on all new/modified files." For multi-phase plans, add audit at each phase
   boundary.
7. **Include effort estimate** — rough T-shirt size (S/M/L/XL) for user planning
8. **Reference DECISIONS.md** — "Per Decision #4, using JSONL format"

---

## Phase 3.5: Plan Self-Audit (MUST)

Before presenting the plan, verify decisions→plan fidelity:

1. **Decision coverage** (MUST) — every DECISIONS.md entry maps to a plan step
2. **Quality checklist** (MUST) — see checklist in REFERENCE.md
3. **Artifact consistency** (MUST) — DIAGNOSIS.md findings addressed by plan
4. **Convergence-loop verify plan** (MUST for L/XL plans, SHOULD for S/M) —
   verify plan's codebase assumptions (file paths, existing patterns,
   integration points) via convergence-loop quick preset. Plans built on wrong
   assumptions waste implementation effort. **If assumptions are wrong:** fix
   plan steps before presenting for approval.
5. **Signal** (MUST) — "Self-audit: N/N decisions covered, checklist PASS"

### Finding Presentation (MUST)

Present each issue found in the same Q&A format used in Phase 1 Discovery:

- **Description:** What the issue is, with full context (cite decision #, plan
  step, exact text from both)
- **Why it matters:** Impact if left unfixed
- **Options:** Enumerate concrete resolution options (A, B, C...)
- **Recommendation:** "I recommend X because Y. Override?"

Walk through findings **one-by-one** with the user. Collect disposition for each
(accept recommendation / choose different option / modify / defer) before
proceeding. Save dispositions to state file after each batch.

Fix all accepted issues in PLAN.md before proceeding to Phase 4.

---

## Phase 4: Approval (MUST)

1. Write plan to file for persistence (MUST)
2. **Display plan inline in conversation** (MUST — primary output)
3. Present: "Plan compiled. Presenting for review."
4. Ask: "Ready to proceed, or changes needed?" Accept free-form feedback

Outcomes: approved as-is, approved with additions, changes requested (revise),
scope reduction (remove steps), or rejected (discuss alternatives).

---

## Handoff: Execution Routing (MUST)

After approval, route to the right execution approach. Deep-plan's job is done
after routing.

| Plan Complexity      | Route           | Action                                        |
| -------------------- | --------------- | --------------------------------------------- |
| 3+ independent steps | Subagent-driven | Use Agent tool to dispatch parallel subagents |
| Multi-phase project  | GSD             | Use `/gsd:plan-phase` for each phase          |
| Sequential/simple    | Manual          | Execute steps in order                        |

**Artifact consumers:** DECISIONS.md is referenced during execution by any
approach. PLAN.md is consumed by GSD via `/gsd:plan-phase`. DIAGNOSIS.md is
reference-only.

**Invocation tracking** (MUST):

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"deep-plan","type":"skill","success":true,"context":{"topic":"TOPIC","decisions":N}}'
```

**Completion message:** List artifacts (DIAGNOSIS.md, DECISIONS.md, PLAN.md),
location, and execution route.

**Post-execution retro** (SHOULD): After implementation, executor runs a brief
retro: (1) Plan got right? (2) Plan missed? (3) Deep-plan do differently?
Capture in state file `process_feedback` field.

---

## Compaction Resilience

- **State file:** `.claude/state/deep-plan.state.json` — update after every
  batch, decision record, and plan completion
- **Recovery:** On resume, read state file, skip completed phases
- **Topic validation:** If state file topic differs from current invocation, ask
  user: "Start fresh or resume [old-topic]?"
- **Resume:** Re-invoke `/deep-plan <same-topic>` to trigger recovery
- **Artifacts as checkpoints:** DIAGNOSIS.md, DECISIONS.md, PLAN.md persist even
  if state file is lost
- **Cleanup:** `rm .claude/state/deep-plan.state.json`

---

## Integration

- **Neighbors:** `/convergence-loop` (Phase 0 diagnosis verify + Phase 3.5 plan
  verify), `EnterPlanMode` (lighter alternative for 3-4 decisions),
  `/gsd:new-project` (heavier alternative for multi-phase roadmaps),
  `/skill-creator` (consumes deep-plan patterns for skill-type plans)
- **References:** [REFERENCE.md](./REFERENCE.md) (question categories,
  templates, routing table, state schema)
- **Handoff:** DECISIONS.md + PLAN.md consumed by execution approach
  (subagent/GSD/manual)

---

## Guard Rails

- **Contradictions:** If user answers conflict with earlier decisions, flag
  immediately: "Decision #3 said X, but this answer implies Y. Which takes
  priority?"
- **Scope explosion:** If question count exceeds ~30, pause and ask: "We're at
  30+ decisions. Should we scope-reduce before continuing?"
- **Reframe path:** If Phase 0 reveals the task isn't what it appeared, present
  the reframe before proceeding to discovery
- **Disengagement:** If user wants to stop mid-skill, save state and present
  resume instructions

---

## Version History

| Version | Date       | Description                                            |
| ------- | ---------- | ------------------------------------------------------ |
| 3.3     | 2026-03-15 | Skill-audit: CL MUST for L/XL, verify-before-present, Integration section, failure paths |
| 3.2     | 2026-03-15 | Convergence-loop integration: Phase 0 diagnosis + 3.5 self-audit |
| 3.1     | 2026-03-12 | Add code-state verification requirement to Phase 0     |
|         |            | (UNVERIFIED flag, version validation). PR #428 retro.  |
| 3.0     | 2026-03-07 | Skill audit (29 decisions): self-audit phase, warm-up  |
|         |            | routing guide, input/output spec, MUST/SHOULD/MAY,     |
|         |            | invocation tracking, phase markers, mid-discovery      |
| 2.0     | 2026-03-01 | Rewrite from 64-decision audit: Phase 0, no caps,      |
|         |            | standalone DECISIONS.md, audit checkpoints, handoff    |
|         |            | routing, compaction resilience, guard rails, REFERENCE |
| 1.0     | 2026-02-25 | Initial implementation                                 |
