# Out-of-the-Box Alternatives: Research-Discovery-Standard v2

**Agent:** otb-challenger **Date:** 2026-04-04 **Scope:** Alternatives to chosen
direction (F + E hybrid from brainstorm)

---

## Solution Space Covered by Research

The research (D1-D8) covered:

- State model: JSONL-embedded `stage` field, guarded whitelist transitions,
  append-only `stage_history[]` audit trail embedded inside each todo record
- Auto-advance: FileChanged hook (real-time) + lazy scan on `/rnd` view
  (primary)
- Cross-project flow: manual `findings_refs` array with `<slug>:<claim-id>`
  addressing; auto-propagation explicitly rejected
- UX split: `type: "task"|"project"` + inline `[STAGE]` badge in Progress column
- Schema evolution: per-record `schema_version`, additive migration script
- Dashboard: 7th tab with stage-column kanban, `build-rnd.js` builder
- Scouting governance: theoretical saturation + Rogers Five Factors + ADR exit
  artifacts
- CL integration: cross-cutting policy, skill-completed stages treated as
  pre-verified

**Boundaries NOT crossed:** event-sourcing as primary state derivation (only
used for audit trail shape); git-native tracking; no-stage-tracking
perspectives; lightweight advisory similarity for findings_refs discovery;
time-in-stage stall detection as the primary actionable signal; the
`todos.jsonl` anchor assumption itself; research-paper pipeline metaphor.

---

## Alternative A1: Event-Sourcing as Primary State Model

**Description:** Instead of mutating a `stage` field on each todo record, append
discrete events to a separate `rnd-events.jsonl` file. Each event has a type
(`STAGE_ADVANCED`, `STAGE_BACKTRACKED`, `ARTIFACT_LINKED`, `FINDING_REFERENCED`,
`PROJECT_ABANDONED`) and a payload. Current project state is derived on demand
by replaying events filtered by project ID. The `todos.jsonl` record retains a
`denormalized_stage` cache field updated by the event processor, but it is a
projection — not the system of record.

**Source domain:** Event sourcing / CQRS (Domain-Driven Design, Greg Young
2010). Used in financial systems, audit-heavy applications, and collaborative
editors. Present in simpler form in append-only ledgers.

**How it differs:** The research embeds `stage_history[]` inside each todo
record — a partial event log that conflates the state store and the event store.
True event sourcing separates them: events are the system of record; the current
`stage` in `todos.jsonl` is a derived projection. The research arrived at
append-only `stage_history[]` but stopped short of deriving state FROM that log
rather than maintaining it alongside a mutable `stage` field.

**Verdict:** INFORM

**Trade-offs:**

- Gains: Replay lets you reconstruct project history at any point in time. Undo
  is trivially "replay without last N events." Events naturally support
  attribution (`by` field) and time-travel debugging. The event log is a
  complete audit trail.
- Losses: Deriving current state requires scanning the events file on every
  `/rnd` view. Introduces a second JSONL that must stay in sync with
  `todos.jsonl`. The projection can drift if the event processor crashes
  mid-write. Adds conceptual complexity that conflicts with the "minimal
  infrastructure" cross-cutting theme confirmed by D3, D5, D6. At 20-record
  scale, the existing `stage_history[]` inside the record achieves 90% of the
  benefit without the coordination overhead.

**Recommendation:** Note as future consideration. If project count grows past
50-100 and `stage_history[]` arrays become large enough to slow JSONL parsing,
revisit as a natural evolution path. The current design is already
event-sourcing-adjacent; full separation is a refactor, not a redesign.

---

## Alternative A2: Git-Native Pipeline State

**Description:** Use git itself as the pipeline state store. Each R&D stage
transition is a git commit with a structured message (e.g.,
`[rnd] RESEARCH→PLAN: github-health`). Stage badges are derived from
`git log --grep="^\[rnd\]"` filtered by project slug. No `stage_history[]`
field. No migration script. The git log IS the audit trail.

**Source domain:** GitOps, conventional commits. Simon Willison uses git commits
as his primary public R&D log. Datomic's immutable database-as-value philosophy
applied to simpler tooling.

**How it differs:** The research uses git only as rollback for `todos.jsonl`.
This inverts the relationship: git commits ARE the state transitions. The
`todos.jsonl` record could be reduced to identity and metadata only.

**Verdict:** INFORM

**Trade-offs:**

- Gains: Zero new data structures. Audit trail is human-readable in `git log`.
  Transitions are automatically timestamped. Portable to any git project.
- Losses: Parsing `git log` for derived state is fragile. Convention-based
  commits can be skipped or written inconsistently. Cannot be queried from
  `todos.jsonl` without a git-log bridge. Critical incompatibility: CLAUDE.md
  guardrail #7 prohibits autonomous `git commit`. Auto-advance to a new stage
  cannot be a git commit without explicit user approval. This single constraint
  makes git-native state unworkable for the auto-advance requirement.

**Recommendation:** Note as convention supplement only — include structured
commit messages alongside JSONL state as a human-readable secondary record. Not
viable as the primary state store.

---

## Alternative A3: Completion-Only Tracking — No Stage Machine

**Description:** Discard stage tracking entirely. Track only (1) done or not
done, and (2) a single free-text "latest activity" note updated manually. No
FSM, no pipeline, no whitelist transitions, no `stage_history[]`. The dashboard
surfaces projects sorted by staleness (`updatedAt` recency). Session-begin
digest shows only projects unchanged for more than N days.

**Source domain:** GTD pure inbox model. Zettelkasten "no hierarchy" principle.
Bullet Journal completion symbols. The anti-pipeline camp in solo-creator
methodology.

**How it differs:** The entire research (D1, D2, D4, D8) assumes stage tracking
is worth building. The brainstorm's anti-goal #2 states that "tracking overhead
that discourages the pipeline" is failure. This alternative asks: what if stage
tracking IS the overhead?

**Verdict:** INFORM

**Trade-offs:**

- Gains: Zero implementation cost. No migration, no schema extension, no
  watcher, no state machine, no CL gate integration. Preserves exploration joy
  (brainstorm anti-goal #1). Consistent with the observation that 19 todos
  already informally track state in free text — formalization may add friction
  without proportional benefit.
- Losses: Stall detection is the primary value of stage tracking. Without stage
  data, the signal "this project has been at RESEARCH for 47 days" is invisible.
  `updatedAt` is a weak substitute — a project can be "active" but stuck at the
  same stage. `findings_refs` loses its relevance signal (which claims matter
  depends on what stage the project is in). The dashboard R&D tab loses its
  primary value proposition.

**Recommendation:** Use as a pressure-test against D1+D2+D4+D8 implementation
cost during deep-plan. Confirm that the concrete decisions enabled by stage data
justify the ceremony cost. The brainstorm acknowledged this tension (anti-goal
#2) but did not resolve it quantitatively.

---

## Alternative A4: Time-in-Stage as the Primary Signal

**Description:** Keep stage tracking as designed in D1, but reframe what is
surfaced. Instead of showing "project is at RESEARCH stage," surface "project
has been at RESEARCH stage for 14 days." The session-begin digest becomes a
stall alert: "3 projects have been in their current stage for more than N days
without an artifact change." The dashboard's primary sort order is time-in-stage
(longest stalls first), not stage-column kanban.

**Source domain:** Flow efficiency metrics in Lean manufacturing (cycle time,
lead time, wait time). Kanban's primary metric is not "where is the card" but
"how long has it been waiting." DORA metrics in software engineering (lead time
for changes). Value Stream Mapping focuses on queued items, not their stage
identity.

**How it differs:** The research's dashboard design (D6) focuses on stage-column
kanban as the primary visualization — projects as cards, stages as columns. That
is stage-identity-centric. This alternative treats stage identity as metadata
and surfaces time-in-stage as the actionable signal. A swimlane sorted by stall
duration is architecturally different from a kanban sorted by current stage.

**Verdict:** SUPPLEMENT

**Trade-offs:**

- Gains: Stall detection is the real pain point for a solo developer managing
  10-20 R&D threads. Time-in-stage data is derivable from the
  `stage_history[].at` timestamps already in the D1 design — no new schema
  fields needed. `stage_history[-1].at` (timestamp of most recent transition) is
  already required by D1-F7. Computing time-in-stage =
  `now - stage_history[-1].at` requires zero schema changes and can be computed
  in `build-rnd.js`. Compatible with D6 builder architecture.
- Losses: Requires a configurable stall threshold (N days). Swimlane sorted by
  stall duration may be harder to visually parse than a conventional kanban. Not
  a replacement — should coexist as the DEFAULT sort order alongside the
  stage-column view as secondary.

**Recommendation:** Supplement the D6 dashboard design with stall-sorted
swimlane as the default sort order. High-value, zero schema cost. Present as a
concrete design option during deep-plan. This is the most actionable alternative
in this set.

---

## Alternative A5: findings_refs Advisory Auto-Suggestion via Keyword Overlap

**Description:** Rather than requiring fully manual `findings_refs`
registration, use a lightweight keyword-overlap algorithm to suggest candidate
references at stage-advance time. When a project advances to PLAN, compute
keyword intersection between the project's title/description/tags and all claim
`label` fields in `claims.jsonl`. Surface top 3-5 candidates with a "confirm or
dismiss" prompt. Manual registration remains the write path; the algorithm only
surfaces candidates.

**Source domain:** Document similarity in information retrieval (TF-IDF, BM25).
Citation recommendation systems (Semantic Scholar's SPECTER, PubMed's "similar
articles"). This is the "suggest and confirm" pattern — advisory recommendation,
not automatic population.

**How it differs:** The research explicitly rejected auto-propagation (D3-F14)
on grounds that "embedding-based auto-population creates false positives and
notification fatigue." However, that rejection conflated two distinct patterns:
(1) automatic population without user review, and (2) advisory suggestion
requiring user confirmation. D3 addressed pattern (1) but did not evaluate
pattern (2). The research also rejected graph databases and embeddings on
infrastructure grounds (D3-F9) — but TF-IDF requires no external infrastructure,
only a JavaScript implementation over existing `claims.jsonl`.

**Verdict:** SUPPLEMENT

**Trade-offs:**

- Gains: The current design requires the user to know a relevant claim exists
  and manually look it up. For a 800-claim corpus spanning 14+ research topics,
  manual discovery has a high miss rate. Advisory suggestion surfaces
  connections the user would otherwise miss without imposing false positives
  (user confirms before any ref is written). TF-IDF over 800 short claim labels
  runs in under 10ms in Node.js. No new dependencies.
- Losses: Requires implementing a TF-IDF scorer (~80 lines of Node.js).
  Suggestion quality depends on how well claim labels are written — sparse
  labels produce poor suggestions. Adds a confirmation prompt at stage-advance
  time. D3-F14's concern about notification fatigue is real — must be gated to
  stage-advance only, maximum 5 suggestions, fully dismissible.
- Compatibility: Fully compatible with D3's schema. The `findings_refs` shape
  and `<slug>:<claim-id>` addressing remain unchanged. This adds an advisory
  layer on top of the manual registration path.

**Recommendation:** Investigate further during deep-plan. Flag as a Phase 3
enhancement candidate — implement basic TF-IDF after the core schema is stable.
The "suggest and confirm" pattern was not evaluated in the research and deserves
explicit consideration.

---

## Alternative A6: Dedicated rnd-projects.jsonl (Not todos.jsonl Anchor)

**Description:** Instead of extending `todos.jsonl` with PROJECT-type records,
create a dedicated `rnd-projects.jsonl` with a schema optimized for R&D pipeline
tracking. The `todos.jsonl` retains a `project_ref: "<slug>"` field linking a
task cluster to its parent project. Two files, separate schemas, separate
migration paths, separate skill entry points.

**Source domain:** Relational database normalization (separate tables with
foreign keys rather than polymorphic columns). Obsidian's separate note types
with links between them. Unix philosophy: each tool does one thing well.

**How it differs:** The research's direction (D4-F6) chose "unified command,
separated view" — `/todo` and `/rnd` are different views of the same
`todos.jsonl`. The brainstorm collapsed directions A and B into /todo evolution
because "parallel tooling would duplicate the data model." This alternative
argues that separation at the FILE level is not duplication — it is appropriate
schema isolation.

**Verdict:** INFORM

**Trade-offs:**

- Gains: Schema isolation prevents bloat on TASK records. A task record never
  needs `stage`, `artifacts`, `findings_refs`, `stage_history[]`, `blocks`,
  `blocked_by`. PROJECT schema can evolve independently. The TASK migration
  script is simpler. The PROJECT file can be shared across worktrees more
  cleanly.
- Losses: Cross-file joins add complexity to every script needing both. The
  "single source of truth" tenet (T2) is weakened. The brainstorm correctly
  identified that 15 of 19 existing todos are PROJECT-type — the TASK file would
  be sparse. At 20-record scale, adding 5-7 fields to PROJECT records adds
  kilobytes, not megabytes. The separation cost exceeds the benefit at current
  scale. D4's `type` discriminator is schema polymorphism as a known
  anti-pattern at scale, but "at scale" is not today's problem.

**Recommendation:** Note as future consideration. If the todo list grows
significantly (100+ records) or if PROJECT schema evolution diverges sharply
from TASK schema, revisit. Not worth the split at current scale.

---

## Alternative A7: Research Paper Pipeline Metaphor

**Description:** Model the R&D pipeline using the academic paper submission
lifecycle rather than a software development lifecycle. Stages become: DRAFT
(idea/brainstorm), SUBMITTED (research in progress), UNDER_REVIEW (convergence-
loop running), REVISION_REQUESTED (CL returned gaps), ACCEPTED (research
complete), IN_PRODUCTION (implementation), PUBLISHED (shipped). The CL
integration (D8) maps directly to "peer review." Rejection maps to ABANDONED.

**Source domain:** Academic publishing pipeline. arXiv preprint model. Simon
Willison's "TIL" pattern — each insight goes through draft, publish, link. Also:
the zine/indie publishing model used by solo creators.

**How it differs:** The research's pipeline (IDEA → BRAINSTORM → RESEARCH → PLAN
→ IMPLEMENT → TEST → COMPLETE) is software-development-centric. This reframes
the CL pass as "peer review" — which it functionally is. The metaphor changes
how the user thinks about stage transitions: being at UNDER_REVIEW is not a
delay in academic publishing, it is an expected and valued step.

**Verdict:** INFORM

**Trade-offs:**

- Gains: The metaphor accurately captures what CL integration does — an
  independent adversarial review of claims. "Under review" is a respected state
  that may reduce the psychological friction of running CL gates. The metaphor
  provides a natural answer to "how long should research take?" — "until it
  would be accepted" (saturation threshold, D7). Compatible with D7's scouting
  governance framing.
- Losses: The academic pipeline has no IMPLEMENT or TEST equivalent — it
  terminates at "published" (equivalent to PLAN). The metaphor breaks down for
  execution phases. Software developers may find academic vocabulary alienating.
  The brainstorm includes implementation and test stages; this metaphor only
  covers the pre-implementation half.

**Recommendation:** Use as a framing lens for CL documentation language in
D8-R1. The CL gate at RESEARCH → PLAN can be described as "the peer review
step." Do not change stage names — software lifecycle names are clearer for the
implementation and test phases.

---

## Summary

| Alternative                           | Type            | Verdict    | Most compelling reason                                                               |
| ------------------------------------- | --------------- | ---------- | ------------------------------------------------------------------------------------ |
| A1: Event-sourcing primary state      | Inverted        | INFORM     | Future evolution path; current `stage_history[]` is 90% of the benefit               |
| A2: Git-native pipeline state         | Adjacent-domain | INFORM     | Blocked by guardrail #7; convention supplement only                                  |
| A3: Completion-only, no stages        | Simpler         | INFORM     | Pressure-tests D1+D2+D4+D8 cost against brainstorm anti-goal #2                      |
| A4: Time-in-stage as primary signal   | Reframing       | SUPPLEMENT | High-value, zero schema cost; stall detection is more actionable than stage identity |
| A5: TF-IDF advisory for findings_refs | Newer           | SUPPLEMENT | Fills the gap between auto-propagation (rejected) and manual-only (chosen)           |
| A6: Dedicated rnd-projects.jsonl      | Simpler         | INFORM     | Correct relational design but wrong scale; document as evolution path                |
| A7: Research paper metaphor           | Adjacent-domain | INFORM     | Useful framing for CL documentation; no implementation change                        |

**Alternative count:** 7 **Verdict distribution:** INFORM x5, SUPPLEMENT x2,
REPLACE x0

**Most compelling alternative:** A4 (Time-in-stage as primary signal). It
requires zero schema changes — the `stage_history[].at` timestamps are already
specified in D1. The sole addition is a sort-by-stall-duration view in
`build-rnd.js`. Stall detection is the real operational value of the R&D
dashboard: knowing a project has been at RESEARCH for 47 days is more actionable
than knowing it is currently at RESEARCH. This maps directly to Lean's flow
efficiency insight. Present as a concrete design option during deep-plan.

**Second most compelling:** A5 (TF-IDF advisory suggestions). The research
rejected auto-propagation but the "suggest and confirm" pattern was never
evaluated. An 800-claim corpus has genuine cross-project connections that manual
registration will miss. A TF-IDF implementation over existing `claims.jsonl`
surfaces those connections without the notification fatigue risk that D3
identified. Flag for Phase 3 enhancement consideration.
