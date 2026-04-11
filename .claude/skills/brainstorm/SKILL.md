---
name: brainstorm
description: >-
  Creative discovery phase for exploring ideas, directions, and design space
  before implementation planning or research. Uses Socratic dialogue,
  research-grade agents, and contrarian challenge to move from seed ideas to
  chosen directions with structured BRAINSTORM.md output that feeds directly
  into /deep-plan or /deep-research.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Brainstorm

Creative discovery that does what jumping straight to planning cannot. Explores
the problem space, generates multiple directions, challenges assumptions, and
converges on a chosen path — before any implementation decisions are made.

## Critical Rules (MUST follow)

1. **No artificial caps** — no ceiling on agents, convergence loop passes,
   directions explored, or questions asked. Use as many as needed.
2. **Seed ideas are welcome** — if the user can't articulate goals, constraints,
   or success criteria, discovering those becomes part of the brainstorm. Never
   skip a question because the user doesn't have an answer yet.
3. **Contrarian checkpoint is mandatory** — before convergence, present honest
   weaknesses of the leading direction(s). Resist the AI tendency to validate.
   If an idea has a real flaw, say so.
4. **Research-grade agents for unknowns** — when the brainstorm touches
   unfamiliar territory, dispatch `deep-research-searcher` agents for domain
   investigation. Do NOT fake understanding with surface-level greps.
5. **Minimum 3 directions before convergence** — premature convergence on the
   first idea kills creative exploration. Push back if the user tries to
   converge too early.
6. **Persist state incrementally** — save to state file after every phase. Long
   brainstorms WILL hit compaction.
7. **Show artifact inline** — write BRAINSTORM.md for persistence, display in
   conversation as primary output.

## When to Use

- User has an idea but direction is unclear — "how should we approach X?"
- Creative decisions with multiple viable paths
- New features, new systems, greenfield exploration
- User says "let's brainstorm" or "I have an idea"
- Seed-stage thinking — half-formed thoughts that need nurturing
- Before `/deep-plan` when WHAT to build isn't settled

## When NOT to Use

- Bug fixes or clear instructions with no ambiguity — just do them
- Direction is clear, need implementation plan — use `/deep-plan`
- Pure research question — use `/deep-research` directly
- Task has 3-4 clear decisions — use `EnterPlanMode`
- Multi-phase project roadmap — use `/gsd:new-project`
- Note: `sc:brainstorm` is an external plugin with different methodology. For
  this project, `/brainstorm` is the canonical brainstorming skill.

## Routing Guide

| Situation                     | Use                                 | Why                                    |
| ----------------------------- | ----------------------------------- | -------------------------------------- |
| Don't know WHAT to build      | `/brainstorm`                       | Explore directions before planning     |
| Know WHAT, need to plan HOW   | `/deep-plan`                        | Discovery-first implementation plan    |
| Need domain understanding     | `/deep-research`                    | Multi-agent investigation              |
| Need to explore THEN plan     | `/brainstorm` then `/deep-plan`     | Natural flow                           |
| Need to explore THEN research | `/brainstorm` then `/deep-research` | When open questions need investigation |

## Input

**Argument:** Topic or idea, passed as `/brainstorm <topic>` or provided in
conversation context. Accepts anything from a vague notion to a detailed
concept.

**Output:** `.research/<topic-slug>/BRAINSTORM.md` — co-located with research
artifacts as an early-stage discovery artifact. Downstream skills (deep-plan,
deep-research) discover it naturally during Phase 0. **Slug:** lowercase,
hyphens for spaces/special chars, max 50 chars.

---

## Process Overview

```
WARM-UP:   Orientation    -> Topic, process, seed-idea welcome
PHASE 0:   Context        -> Codebase scan, landscape, agent dispatch if needed
PHASE 1:   Diverge        -> Expansive Socratic exploration, multiple directions
PHASE 2:   Evaluate       -> Tradeoffs, contrarian checkpoint, feasibility
PHASE 3:   Converge       -> User selects direction, rationale captured
PHASE 4:   Crystallize    -> BRAINSTORM.md, CL verify, routing menu
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Warm-Up (MUST)

Present: topic, process overview, explicit invitation for vague ideas.

"This brainstorm explores what's possible before committing to a direction.
Vague ideas are welcome — we'll shape them together. No code will be written."

**Done when:** User confirms proceed.

---

## Phase 0: Context (MUST)

**Purpose:** Understand the landscape so exploration is grounded, not generic.

1. Check CLAUDE.md for relevant conventions (MUST)
2. Check ROADMAP.md — verify alignment with project direction (MUST)
3. **Extraction context (MUST):** Scan `.research/EXTRACTIONS.md` for candidates
   relevant to the brainstorm topic (human-readable, grouped by source). For
   targeted filtering, query `.research/extraction-journal.jsonl` (match by
   type, tags in notes, or source domain). If matches found, present as "Prior
   art from analyzed sources" before exploration begins. These are patterns,
   principles, and tools already identified from external repos/websites —
   grounding exploration in what's been learned, not starting from zero.
4. Scan codebase for relevant existing systems (MUST)
5. **Agent dispatch for unknowns (MUST when applicable):**
   - Codebase questions: spawn `Explore` agents
   - Domain/technology questions: spawn `deep-research-searcher` agents with
     sub-question, search profile (web/docs/academic), output path, depth
   - No limit on agent count — dispatch as many as the landscape requires
6. **Duplicate check (MUST):** Check `.research/<topic-slug>/`. If BRAINSTORM.md
   exists, offer: resume, start fresh, or rename.
7. Check `.research/` for prior research on related topics (SHOULD)
8. **Convergence-loop verify landscape (SHOULD):** If Phase 0 makes 3+ claims
   about codebase state, verify via CL quick preset before presenting.
9. Present landscape summary to user (MUST)

**If misaligned with ROADMAP:** Present conflict, offer proceed/reframe/abort.

**Reframe path:** If context reveals the direction is already clear and no
creative exploration is needed, suggest: "This looks ready for `/deep-plan` —
brainstorm may not add value here. Proceed with brainstorm or route to
planning?"

**Phase gate:** User confirms landscape or reframes. Do NOT proceed to Diverge
until confirmed.

**Done when:** Landscape understood, summary presented, user confirms.

---

## Phase 1: Diverge (MUST)

**Purpose:** Expansive exploration. Generate multiple directions. No evaluation
yet — that's Phase 2.

### Socratic Exploration

Use question themes (not rigid categories) to explore the space. Adapt to what
the user knows and doesn't know.

> See [REFERENCE.md](./REFERENCE.md) for question themes with example prompts.

**Themes:** Problem Space, Assumptions, Constraints, Alternatives, Success
Criteria, Anti-Goals.

### Seed Idea Nurturing (MUST)

When the user can't answer a question:

- Don't skip it — explore it together
- Propose possible answers: "It could be X, Y, or Z. Which resonates?"
- Use agent findings to inform: "Based on what the searcher found, X seems
  likely because..."
- Mark as "Discovered during brainstorm" in the artifact

### Direction Generation (MUST)

1. Ask the user what directions they see (MUST)
2. Propose additional directions informed by agents and codebase (MUST)
3. For each direction, sketch a 2-3 sentence "what this looks like" vision
4. Show progress: "Direction N explored. M agent dispatches so far."
5. Enforce minimum 3 directions (Critical Rule 5) before allowing Phase 2

**Delegation:** If user says "you decide" on direction generation, propose and
justify. For direction selection (Phase 3), always require explicit user choice
— delegation not accepted for the final pick.

### Anti-Goals (MUST)

Explicitly ask: "What do you NOT want? What outcomes would make this a failure?"
Anti-goals constrain the design space and prevent wasted exploration.

**Phase gate:** "Before we evaluate — any directions to add or revisit?" User
confirms ready. Do NOT proceed to Evaluate until confirmed.

**Done when:** 3+ directions generated, anti-goals captured, user confirms
ready.

---

## Phase 2: Evaluate (MUST)

**Purpose:** Honest assessment of each direction's strengths and weaknesses.

### Tradeoff Analysis (MUST)

For each direction:

- **Strengths:** What it gets right
- **Weaknesses:** What it gets wrong or leaves unresolved
- **Assumptions:** What must be true for this to work
- **Feasibility:** Given current codebase, constraints, and capabilities

### Contrarian Checkpoint (MUST — Critical Rule 3)

Before convergence, present a devil's advocate perspective on the leading
direction(s). This is NOT optional.

"Before you choose — here's why [Direction A] might fail: [honest weaknesses].
And here's what [Direction B] gets right that A doesn't: [specific advantages]."

**If the brainstorm is complex (4+ directions, unfamiliar domain):** Dispatch a
`contrarian-challenger` agent to stress-test the top 2 directions. Present its
findings alongside your own assessment.

### Anti-Goal Violation Check (MUST)

If a direction violates a stated anti-goal, flag it explicitly: "Direction A
conflicts with anti-goal X. Proceed anyway or drop?"

### Grounding Check (MUST)

If any direction references technology, patterns, or capabilities that haven't
been verified, dispatch agents to confirm before evaluation. Never evaluate a
direction built on unverified premises.

Show progress: "Evaluating direction N of M."

**Done when:** All directions evaluated, contrarian checkpoint presented, user
ready to choose.

---

## Phase 3: Converge (MUST)

**Purpose:** User selects a direction with full awareness of tradeoffs.

1. Present directions with evaluation summary (MUST)
2. User selects direction (MUST — AI does not choose)
3. Capture rationale: "Why this direction over the others?" (MUST)
4. Capture open questions: "What still needs research or deeper planning?"
   (MUST)

**Hybrid directions:** User may combine elements from multiple directions. If
so, sketch the hybrid and confirm: "So the direction is: [synthesis]. Correct?"

**Done when:** Direction chosen, rationale captured, open questions listed.

---

## Phase 4: Crystallize (MUST)

**Purpose:** Produce the BRAINSTORM.md artifact and route to next action.

1. Write BRAINSTORM.md to `.research/<topic-slug>/` (MUST)
2. Display inline in conversation (MUST — primary output)
3. **Convergence-loop verify** (MUST) — run CL quick preset on BRAINSTORM.md
   claims about codebase state, existing systems, and feasibility. As many
   passes as needed to converge. Present T20 tally
   (Confirmed/Corrected/Extended/New) — standard convergence-loop protocol, see
   `/convergence-loop` skill for definitions. Fix any failed claims before
   presenting.
4. Present routing menu (MUST):

```
Brainstorm complete. What next?
1. /deep-plan  — plan implementation of chosen direction
2. /deep-research — investigate open questions (adapter: pass BRAINSTORM.md
   chosen direction + open questions as the research topic; the research
   output dir should use the same slug as the brainstorm)
3. Both — research first, then plan
4. Direct implementation — direction is clear enough, just build it
5. Save and continue later — state preserved for resume
```

> See [REFERENCE.md](./REFERENCE.md) for the BRAINSTORM.md template.

### Invocation Tracking (MUST)

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data '{"skill":"brainstorm","type":"skill","success":true,"schema_version":1,"completeness":"stub","origin":{"type":"manual"},"context":{"topic":"TOPIC","directions":N,"chosen":"DIRECTION_NAME"}}'
```

**Retro (SHOULD):** "Did the brainstorm surface anything unexpected? What would
you do differently?" Save to state file `process_feedback`.

**Done when:** BRAINSTORM.md written and verified, routing presented, user
routes to next action.

---

## Guard Rails

- **Premature convergence:** Block convergence with < 3 directions explored.
  "We've only explored N directions. Worth considering more before choosing?"
- **Assumption surfacing:** Every direction MUST state key assumptions. No
  hidden premises.
- **Scope explosion:** If directions exceed ~7, pause and cluster into themes.
- **Grounding check:** Dispatch agents for any unverified claims before
  evaluation.
- **AI agreement bias:** The contrarian checkpoint exists specifically to
  counter this. If every direction looks great, something is being missed.
- **Contradiction detection:** If user statements in later phases conflict with
  earlier ones, flag immediately and resolve before proceeding.
- **Disengagement:** Save state, list what's been explored, offer resume.

---

## Compaction Resilience

- **State file:** `.claude/state/brainstorm.<topic-slug>.state.json`
- **Update:** After every phase boundary
- **Recovery:** Re-invoke `/brainstorm <same-topic>` to resume
- **Schema:** See [REFERENCE.md](./REFERENCE.md) for state file schema
- **Artifacts as checkpoints:** BRAINSTORM.md persists even if state is lost

---

## Integration

- **Upstream:** `using-superpowers` routes here for creative work in this
  project
- **Downstream:** `/deep-plan` (BRAINSTORM.md consumed by Phase 0),
  `/deep-research` (open questions become research topics)
- **Neighbors:** `/deep-plan` (plans chosen direction), `/deep-research`
  (investigates open questions), `/convergence-loop` (Phase 4 verification)
- **Agents used:** `deep-research-searcher` (domain investigation), `Explore`
  (codebase), `contrarian-challenger` (stress-test, conditional)
- **References:** [REFERENCE.md](./REFERENCE.md) (templates, themes, schema)

---

## Version History

| Version | Date       | Description                                                  |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.1     | 2026-04-01 | Skill-audit: 18 decisions — phase gates, CL, guard rails, UX |
| 1.0     | 2026-04-01 | Initial creation from 17-decision skill-creator discovery    |
