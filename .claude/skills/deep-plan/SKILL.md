---
name: deep-plan
description: >-
  Structured discovery-first planning for complex tasks. Ask exhaustive
  categorized questions, build a standalone decision record, then produce a
  detailed implementation plan with audit checkpoints for user approval before
  any code is written.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-01
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
- Brainstorming without a concrete implementation target — use brainstorming
  skill first, then `/deep-plan` to plan the chosen approach

---

## Process Overview

```
PHASE 0:  Context Gathering → Explore codebase, ROADMAP check, DIAGNOSIS.md
PHASE 1:  Discovery         → Exhaustive questions (floor ~15, no ceiling)
PHASE 1b: User Discovery    → Optional: user questions/concerns, revisit answers
PHASE 2:  Decision Record   → Standalone DECISIONS.md
PHASE 3:  Plan              → Steps with "Done when:" + audit checkpoints
PHASE 4:  Approval          → Show inline, free-form feedback, explicit gate
HANDOFF:  Execution Routing  → Decision tree: subagent / GSD / manual
```

---

## Phase 0: Context Gathering

**Purpose:** Understand before asking. Explore the codebase so questions
reference actual patterns, not generic placeholders.

1. Read ROADMAP.md — verify task aligns with project direction
2. Explore relevant codebase areas (use Explore agent for broad searches)
3. Identify existing patterns, conventions, and neighboring systems
4. Produce `DIAGNOSIS.md` at the plan output location:
   - ROADMAP alignment check (aligned / misaligned / new direction)
   - Relevant existing systems and their patterns
   - Reframe check: is the task what it appears to be, or does context suggest a
     different framing?
5. Present DIAGNOSIS.md to user for review before proceeding

**Phase gate:** User confirms diagnosis or reframes the task. If reframed,
update DIAGNOSIS.md and re-present. Do NOT proceed to Discovery until confirmed.

---

## Phase 1: Discovery

**Purpose:** Eliminate assumptions. Every ambiguous design decision MUST be
surfaced and resolved with the user.

> Read `.claude/skills/deep-plan/REFERENCE.md` for the 8 question categories
> with example questions for each.

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
   cap; use judgment based on question complexity.
6. **Inter-batch synthesis** — after each batch of answers, synthesize what was
   learned before asking the next batch. This prevents redundant questions.
7. **State inferences explicitly** — when an answer makes other questions
   obvious, state "Based on your answer to Q3, I'm inferring X for Q7" rather
   than silently skipping.
8. **Save decisions after every batch** — persist to
   `.claude/state/deep-plan.state.json` with task name, current batch number,
   all decisions so far, and timestamp.
9. **Show progress** — "Batch 2 of ~3 complete. 12 decisions captured so far."

### Discovery Anti-Patterns (MUST avoid)

- Asking questions answerable by reading the codebase (Phase 0 should handle)
- Asking the same question in different ways
- Asking questions whose answers don't affect the plan
- Not offering recommended defaults
- Treating "your call" as ambiguity — it's delegation, decide and state why
- Silently skipping questions without stating what was inferred

---

## Phase 1b: User Discovery (Optional)

After completing discovery, offer a welcoming prompt:

"Before I compile the decision record — do you have any questions, concerns, or
things you'd like to revisit from what we've discussed? This is also a good time
to reconsider any earlier answers in light of later decisions."

Skip if the user has indicated urgency or if all answers were confident.

---

## Phase 2: Decision Record

Compile a **standalone DECISIONS.md** at the plan output location. This is the
single source of truth referenced throughout implementation.

### Format

```markdown
# Decision Record: [Feature Name]

| #   | Decision    | Choice        | Rationale                     |
| --- | ----------- | ------------- | ----------------------------- |
| 1   | Name        | `system-name` | Mirrors existing X convention |
| 2   | Data format | JSONL         | Project canonical standard    |
```

### Rules

- One row per decision point, numbered sequentially
- Choice column MUST be specific and actionable (never "TBD" or "maybe")
- Rationale column captures WHY (institutional memory)
- Include both what was chosen AND what was rejected when relevant
- Write to file AND display inline in conversation

---

## Phase 3: Plan

Write a structured plan. Reference DECISIONS.md rather than duplicating the
decision table.

### Step Structure (MUST follow for each step)

```markdown
## Step N: [Title]

[Implementation details — specific files, code snippets for non-obvious logic]

**Done when:** [Concrete, verifiable completion criteria] **Depends on:** Step M
(if applicable) **Triggers:** /skill-name or downstream action (if applicable)
```

### Plan Rules

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

### Plan Quality Checklist

Before presenting, verify the plan has:

- [ ] Summary (2-3 sentences)
- [ ] Reference to DECISIONS.md
- [ ] Files to create/modify with exact paths
- [ ] Steps with "Done when:" criteria
- [ ] Dependency markers between steps
- [ ] At least one audit checkpoint
- [ ] Effort estimate
- [ ] Parallelization guidance where applicable

---

## Phase 4: Approval

1. Write plan to file for persistence
2. **Display plan inline in conversation** (MUST — this is the primary output)
3. Ask: "Ready to proceed, or changes needed?" Accept free-form feedback — not
   just accept/reject

### Approval Outcomes

- **Approved as-is** — proceed to Handoff
- **Approved with additions** — note additions, proceed
- **Changes requested** — revise plan, re-present
- **Scope reduction** — remove steps, re-present
- **Rejected** — stop, discuss alternative approaches

---

## Handoff: Execution Routing

After approval, route to the right execution approach. This is a decision tree,
not a full execution phase — deep-plan's job is done after routing.

| Plan Complexity      | Route           | Action                               |
| -------------------- | --------------- | ------------------------------------ |
| 3+ independent steps | Subagent-driven | Use `/dispatching-parallel-agents`   |
| Multi-phase project  | GSD             | Use `/gsd:plan-phase` for each phase |
| Sequential/simple    | Manual          | Execute steps in order               |

After routing, present completion message:

```
Deep Plan Complete: [Feature Name]
Artifacts: DIAGNOSIS.md, DECISIONS.md, PLAN.md
Execution: [routed to X]
```

Prompt: "After implementation, consider running a brief retro: what worked, what
didn't, what should deep-plan do differently next time?"

---

## Compaction Resilience

Deep-plan sessions run long. MUST persist state incrementally:

- **State file:** `.claude/state/deep-plan.state.json`
- **Update after:** every batch (Phase 1), decision record (Phase 2), plan
  completion (Phase 3)
- **Recovery:** On resume, read state file, skip completed phases, continue from
  current phase
- **Artifacts as checkpoints:** DIAGNOSIS.md, DECISIONS.md, PLAN.md each serve
  as durable checkpoints — if state file is lost, artifacts remain

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
| 1.0     | 2026-02-25 | Initial implementation                                 |
| 2.0     | 2026-03-01 | Rewrite from 64-decision audit: Phase 0, no caps,      |
|         |            | standalone DECISIONS.md, audit checkpoints, handoff    |
|         |            | routing, compaction resilience, guard rails, REFERENCE |
