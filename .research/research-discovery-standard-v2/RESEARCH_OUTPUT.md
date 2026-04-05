# Research Output: Research & Discovery Standard — Supplemental Gaps (v2)

**Topic:** Research & Discovery Standard — supplemental gaps (v2) **Date:**
2026-04-04 **Depth:** L1 (Exhaustive) **Status:** Synthesis Complete **Prior
Research:** `.research/research-discovery-standard/RESEARCH_OUTPUT.md`
**Brainstorm Input:** `.research/research-discovery-standard/BRAINSTORM.md`
**Agents:** 8 searchers (SQ1–SQ8) **Total Findings:** 112 across 8 sub-questions

---

## Executive Summary

This supplemental research run addresses 8 gaps left open by the original
2026-03-24 R&D Standard research. The prior work chose Direction E (Phased
Hybrid): formalize the /rnd pipeline into the existing `/todo` infrastructure
with a `stage` field extension. The 8 sub-questions here spec out the mechanical
details: how the pipeline's state machine works, how stages auto-advance, how
findings flow across projects, how the `/todo` UX handles the TASK/PROJECT
split, how the JSONL schema migrates safely, how R&D visibility fits in the dev
dashboard, how Phase 2 scouting governance prevents analysis paralysis, and how
the convergence-loop integrates across the pipeline.

The core conclusions are firm and well-supported:

**State machine:** The /rnd pipeline requires two orthogonal state dimensions —
`status` (execution state, unchanged) and `stage` (R&D lifecycle position).
Stage transitions are governed by a declarative whitelist table, not scattered
code logic. The transition audit trail uses an append-only `stage_history` array
embedded in each todo record. Terminal states are COMPLETE and ABANDONED, with
an optional PARKED soft-pause state. (D1)

**Auto-advance:** The correct architecture is dual-path: lazy scan at `/rnd`
view time (primary) plus Claude Code's native `FileChanged` hook for in-session
real-time feedback (**provisional secondary — pending feasibility
verification**). No polling daemons, no pre-commit hooks. **Before implementing
FileChanged:** (1) verify whether `watchPaths` accepts directories vs. explicit
paths; (2) if explicit paths, confirm platform limit exceeds 80 entries; (3)
confirm FileChanged hook behavior on Windows specifically. Until these three
checks pass, treat FileChanged as provisional — the lazy scan is the reliable
primary path in all cases. Windows path normalization is mandatory at every hook
boundary. "Done enough" detection uses L3 content checks (section heading
present + minimum file size), with a planned upgrade to L5 (research-index.jsonl
entry) once enforcement is in place. (D2) [REVISED — dispute-resolutions.md
Resolution 4]

**Cross-project findings flow:** A `findings_refs` array on todos.jsonl is the
minimal data shape needed. Each ref uses `<topic-slug>:<claim-id>` stable
addressing, carries a `relationship` type
(informedBy/constrainedBy/contradicts), and requires a human `note`.
Session-begin surfacing with acknowledgment-required digest completes the loop.
Graph databases and embedding-based auto-retrieval are explicitly rejected at
this scale. (D3)

**PROJECT vs TASK UX:** Two fields — `type: "task"|"project"` (default: task)
and `stage: string|null` — are the complete schema addition. The `/todo`
interface follows GTD's capture-first pattern (never block capture on type
selection). Progressive disclosure stays within NN/G's 2-layer limit. The
`Progress` column is replaced by a `Stage/Note` column rendering `[STAGE]`
badges for PROJECT items. `/rnd` is a thin view-layer on the same `todos.jsonl`,
not a separate storage backend. (D4)

**Schema migration:** The existing SoNash `BaseRecord` pattern (per-record
`schema_version` integer) is the confirmed approach. All new fields are additive
and optional with Zod defaults. A `migrate-todos-v2.js` script **does not yet
exist and must be written** following the recommended pattern: backup via git
commit → dry-run preview → apply full-file overwrite → validate with
`render-todos.js`. The `origin: { type: "migration" }` convention is borrowed
from `migrate-retros.js`. Rollback is `git checkout -- .planning/todos.jsonl`.
Upcasters and external migration libraries are overkill at 20-record scale. (D5)
[REVISED — dispute-resolutions.md Resolution 1]

**Dev dashboard:** Add a 7th "R&D" tab — do not fold into the Planning tab. The
Planning tab's domain is sprint/task readiness; the R&D pipeline answers a
distinct question ("where are my projects and what blocks them?"). The tab
requires a `build-rnd.js` builder performing a 3-source join (todos + research
metadata + plan metadata). Cross-tab links of value: R&D ↔ Planning (lifecycle
to tasks), R&D ↔ Debt (blocking relationships). High-tab-count concern is
non-blocking for a developer tool. (D6)

**Scouting governance:** Theoretical saturation (grounded theory) + Chesterton's
Gate + Rogers' Five Factors + ADR-lifecycle exit artifacts form the governance
framework for Phase 2 scouting. No artificial time/count caps — stopping is
governed by qualitative saturation signals and the ability to produce a
SCOUT-DECISION document per category. The ≤5% new-information threshold provides
a concrete operationalization. (D7)

**Convergence-loop integration:** The cross-cutting model wins over both
embedded and separate-invocation models. Critically: skill-completed stages
(deep-research, deep-plan, brainstorm all embed CL internally) are pre-verified
**only when the convergence-loop state file is present** (not just any V\*.md
verifier file). The /rnd orchestrator must recognize this and not add redundant
CL gates when the CL state artifact is present; when absent, treat the stage as
manually-created and apply the appropriate CL obligation. Users may explicitly
mark a stage as pre-verified or force-CL-gate regardless of artifact state. For
manually-created artifacts at RESEARCH→PLAN and PLAN→IMPLEMENT transitions, a
MUST-level CL gate applies. **The /rnd write-guard must be enforced at the write
layer (shared pre-write validator), not the /rnd view layer** — `/todo` writes
that modify `stage` or `type` fields must also pass through the whitelist check.
CL-PROTOCOL and /convergence-loop remain independent per **D3** (not D5 —
citation corrected). (D8) [REVISED — dispute-resolutions.md Resolutions 2, 3, 5]

---

## Current State Assessment

The original R&D Standard research (2026-03-24) established the high-level
direction. At the time of this supplemental run, the following is confirmed from
codebase inspection:

- `.planning/todos.jsonl` has 19-20 active records with NO `type`, `stage`, or
  `schema_version` fields. Stage is implicitly encoded in free-text `progress`
  field. This confirms the gap the research addresses.
- `.claude/skills/todo/SKILL.md` and `REFERENCE.md` define a stable schema and
  mutation rules that are fully compatible with additive extensions.
- `render-todos.js` uses `?? ""` fallbacks on all field accesses — already
  forward-compatible with new fields.
- The existing `BaseRecord` Zod schema in
  `scripts/reviews/lib/schemas/shared.ts` demonstrates the per-record
  `schema_version` pattern that should be adopted.
- Three production migration scripts exist (`migrate-retros.js`,
  `migrate-ecosystem-v2.js`, `backfill-reviews.ts`) that define the migration
  pattern.
- `.research/research-index.jsonl` has 14 entries with inconsistent `status`
  fields — the L5 auto-advance trigger approach requires enforcement before use.
- The dev dashboard plan (`.planning/dev-dashboard/PLAN.md`) is a 26-step,
  43-decision plan with 6 tabs; no R&D tab exists.
- `/convergence-loop` SKILL.md has explicit Programmatic Mode and clear "When
  NOT to Use" guardrails. Three existing skills (deep-research, deep-plan,
  brainstorm) already integrate CL internally.

---

## SQ1 — State Machine for /rnd Pipeline

**Verdict:** Two-axis model with guarded whitelist transitions and append-only
audit trail.

### Key Findings

**D1-F2: Two orthogonal state dimensions are required.** `status` (execution:
pending/in-progress/blocked/completed/archived) and `stage` (R&D position: IDEA
through COMPLETE) are independent axes. A PROJECT can be `in-progress` at
`RESEARCH` stage or `blocked` at `PLAN` stage. Conflating them creates 35
ambiguous combined states. Both fields must exist as separate fields on each
todo record.

**D1-F4: Guarded whitelist, not strict linear or DAG.** The pipeline is
naturally linear but backtracking is allowed and required. DAGs prohibit cycles
(backtracking is a cycle). Strict linear forces empty intermediate stages when
shortcuts are valid. The whitelist table enumerates allowed transitions;
unspecified transitions are forbidden. Guards (or a `reason` field for
non-runtime implementations) encode skip logic.

```
IDEA        → BRAINSTORM, RESEARCH, PLAN, IMPLEMENT, ABANDONED
BRAINSTORM  → RESEARCH, PLAN, IDEA, ABANDONED
RESEARCH    → PLAN, BRAINSTORM, IDEA, ABANDONED
PLAN        → IMPLEMENT, RESEARCH, BRAINSTORM, ABANDONED
IMPLEMENT   → TEST, PLAN, ABANDONED
TEST        → COMPLETE, IMPLEMENT, PLAN, ABANDONED
COMPLETE    → (terminal)
ABANDONED   → (terminal)
PARKED      → (to any prior stage, via history state)
```

**D1-F7: Minimal transition log schema.** Each stage change appends a record
with `from`, `to`, `at` (ISO-8601), `by` (user/auto-advance/migration), optional
`skipped[]` array, and optional `reason`. The log is embedded in the todo record
as `stage_history[]`. Never overwrite entries — append only.

**D1-F9: Deep-research's own pipeline is the best internal reference.** The
12-phase deep-research pipeline demonstrates all required primitives (sequential
phases, conditional execution, parallel agents, off-ramps, backtracking, state
persistence via `.claude/state/*.state.json`) without a formal FSM runtime. The
decimal sub-phase convention (3.5, 3.95) is a reusable pattern for inserting
conditional stages without renumbering.

**D1-F11: Transition validation must be a declarative data structure.** Store
the allowed-transitions whitelist in `.planning/rnd-config.json`, not in skill
logic. Declarative table = machine-readable, testable, extensible.

**D1-F3 and D1-F12: Type discriminator and skip reporting.**
`type: "PROJECT"|"TASK"` controls whether stage tracking is active. TASK items
have no stage overhead. When a stage is skipped via direct transition
(IDEA→PLAN), populate `skipped: ["BRAINSTORM", "RESEARCH"]` in the transition
record — don't rely on post-hoc inference.

**D1-F14: Crash-proof persistence via JSONL.** Stage state embedded in
`todos.jsonl` (the todo record IS the state file) satisfies T9 (crash-proof
state). No separate state machine runtime needed.

### Design Decisions from SQ1

| Decision          | Choice                                           | Rationale                                           |
| ----------------- | ------------------------------------------------ | --------------------------------------------------- |
| State dimensions  | Two orthogonal fields                            | Avoids combinatorial explosion; backward compatible |
| Transition model  | Guarded whitelist table                          | Declarative, testable, supports cycles              |
| Transition log    | Append-only `stage_history[]` embedded in record | T4 JSONL-first, T2 single source of truth           |
| Terminal states   | COMPLETE + ABANDONED (+ optional PARKED)         | Distinguish success from cancellation               |
| Stage field scope | PROJECT-type items only                          | Prevents overhead on simple TASK items              |
| Skip recording    | Explicit `skipped[]` array in transition entry   | Trivial reporting, no post-hoc inference            |
| Backtracking      | `returnAfter` optional field on current record   | Approximates history-state without runtime          |

---

## SQ2 — Auto-Advance Architecture

**Verdict:** Dual-path hybrid — lazy scan (primary) + FileChanged hook
(secondary). No polling daemons.

### Key Findings

**D2-F1 and D2-F2: Claude Code's native `FileChanged` hook is the right
primitive.** The hook fires when a watched file changes. `SessionStart` hook
outputs a `watchPaths` array registering paths for monitoring. SoNash's existing
`session-start.js` already reads `todos.jsonl` — extending it to emit
`watchPaths` for active R&D slugs is low-cost.

**D2-F3: On-demand lazy scan is the correct primary mode.** When `/rnd` view is
opened, scan all 4 canonical locations per active slug with `fs.existsSync()` +
content checks. Takes <5ms for 20 slugs on SSD. Zero overhead between sessions.
Handles all between-session artifact writes. No missed-update risk.

**D2-F7: "Done enough" trigger — L3 content check is the current standard.**

| Artifact           | Check                                 |
| ------------------ | ------------------------------------- |
| BRAINSTORM.md      | size > 200 bytes AND contains('## ')  |
| RESEARCH_OUTPUT.md | size > 1000 bytes AND contains('## ') |
| FINDINGS.md files  | size > 500 bytes                      |
| metadata.json      | valid JSON AND has 'status' field     |

Future upgrade to L5 (research-index.jsonl entry) once D16/D17 enforcement is in
place.

**D2-F5 and D2-F12: Windows-specific requirements.** `fs.watch` on Windows has
documented duplicate events and null filename issues. Debouncing (100ms with
1000ms ceiling) is mandatory. Path normalization
(`filePath.replace(/\\/g, '/')`) must happen at every hook boundary — follow the
pattern already in `post-write-validator.js:117`. FileChanged hook matcher
matches by basename only; path-based disambiguation must happen inside the hook
script using `file_path` from JSON input.

**D2-F9 and D2-F10: Atomic writes and hook placement.** State writes use
temp-file-then-rename (already used in `session-start.js:132-153`).
Session-start hook is the correct registration point for `watchPaths` — not
pre/post-commit hooks. Session-start already has the data needed (reads
`todos.jsonl`).

**D2-F13: research-index.jsonl has inconsistent status fields.** L5 trigger
approach requires enforcement before it can be relied on. Current interim: L3
content checks.

### Design Decisions from SQ2

| Decision            | Choice                                | Rationale                                         |
| ------------------- | ------------------------------------- | ------------------------------------------------- |
| Primary scan mode   | Lazy on `/rnd` view                   | Zero overhead, handles missed events              |
| Real-time mode      | FileChanged hook (Claude Code native) | Zero-dependency solution, in-session coverage     |
| "Done enough" check | L3 section-heading + min size         | No skill changes needed; false-positive resistant |
| Debounce            | 100ms debounce + 1000ms ceiling       | Matches Windows fs.watch duplicate event behavior |
| Path handling       | Normalize at hook boundary            | Required on Windows                               |
| Polling             | Explicitly rejected                   | Unnecessary overhead at solo-dev scale            |
| Pre-commit hook     | Explicitly rejected                   | Wrong semantic trigger, wrong timing              |

---

## SQ3 — Cross-Project Findings Flow

**Verdict:** Add `findings_refs` array to todos.jsonl. Use `<slug>:<claim-id>`
stable addressing. Session-begin digest with acknowledgment. No graph databases,
no embeddings.

### Key Findings

**D3-F1 and D3-F2: The data gap is confirmed.** No cross-project reference field
exists in any SoNash JSONL. `research-index.jsonl` operates at topic level only.
The `findings_refs` pattern must live at claim level.

**D3-F10: Minimum viable data shape.**

```json
{
  "findings_refs": [
    {
      "ref": "<topic-slug>:<claim-id>",
      "relationship": "informedBy | constrainedBy | contradicts",
      "note": "<human-readable rationale>"
    }
  ]
}
```

**D3-F3 and D3-F4: ID stability requires `<slug>:<id>` addressing.** BibTeX
research shows that keys generated from mutable metadata break when metadata
changes. The slug is already stable once research is archived (archive pattern
makes slugs immutable). Adding `stable_ref: "<slug>:<id>"` to claims.jsonl
records completes the stable addressing system.

**D3-F7: REFUTED claims must propagate.** Academic research shows 95%+ of
post-retraction citations are made in error. When a claim's confidence degrades
to LOW or REFUTED status is applied, the system must surface a warning to all
todos referencing that claim. This is the "broken ref" equivalent for knowledge
graphs.

**D3-F8: Pull mechanism preferred over push.** Session-begin scan of active
todos for `findings_refs` is the right surfacing pattern: scoped to active work,
acknowledgment-required (satisfies CLAUDE.md guardrail #6), non-empty only
triggers display.

**D3-F9: Triple stores are overkill at 800-claim scale.** The total claims
corpus is ~800 across all research. JSONL with `jq` lookup is sufficient. No
Neo4j, ArangoDB, or similar graph infrastructure should be introduced.

**D3-F14: Auto-propagation is a high-failure-mode path.** Embedding-based
auto-population of `findings_refs` creates false positives and notification
fatigue. Manual registration with required `note` field is the right pattern —
it forces articulation of the connection at the moment of insight.

### Design Decisions from SQ3

| Decision                | Choice                                        | Rationale                              |
| ----------------------- | --------------------------------------------- | -------------------------------------- |
| Cross-project ref shape | `findings_refs` array on todos.jsonl          | Minimal, no new infrastructure         |
| ID stability            | `<slug>:<claim-id>` addressing                | Slug is immutable after archive        |
| Relationship types      | informedBy / constrainedBy / contradicts      | Based on scite.ai classification model |
| Auto-propagation        | Explicitly rejected                           | False positive rate unacceptable       |
| Graph database          | Explicitly rejected                           | Enterprise overkill at 800-claim scale |
| Surfacing mechanism     | Session-begin digest, acknowledgment-required | Satisfies guardrail #6, low noise      |

---

## SQ4 — /todo UX Split: PROJECT vs TASK

**Verdict:** Two new schema fields (`type`, `stage`), capture-first UX, inline
stage badge in Progress column, /rnd as a thin view layer on shared data.

### Key Findings

**D4-F1: The split is already de facto.** ~15 of 20 active todos are already
PROJECT-type items (multi-session lifecycle, artifact references,
stage-in-progress). ~5 are TASK-type. The `type` field formalizes existing
behavior.

**D4-F2 and D4-F5: Capture-first, never block on type.** Taskwarrior's
optional-enrichment pattern and Todoist's "5-second capture rule" both confirm:
type selection must never block capture. Default to TASK. AI infers type from
content signals (advisory only). Promotion from TASK to PROJECT is a subsequent
action.

**D4-F4: NN/G's 2-layer disclosure limit.** Layer 1: standard menu for all
items. Layer 2: PROJECT-specific actions surface when a PROJECT item is
selected. No third layer. All PROJECT metadata fits within Layer 2.

**D4-F7 and D4-F13: Inline stage badge is better than a separate column.**
Context-aware rendering: replace the free-text `Progress` column with a
`Stage/Note` column that shows `[STAGE]` badge for PROJECT items and the
existing free-text for TASK items. No new columns. Backward-compatible with hook
parsers that parse by column name.

**D4-F6: Unified command, separated view.** clig.dev confirms: unified commands
with flags/views for same-domain items when items share a storage backend.
`/todo` and `/rnd` are not different operations — they are different views of
`todos.jsonl`. `/rnd` is a thin PROJECT-filtered view with a pipeline-centric
menu.

**D4-F10: Header count is minimum discoverability.** "N projects · M tasks
active" in the header. Todoist's failure to surface project management
demonstrates why visibility at the top level is required.

### Design Decisions from SQ4

| Decision          | Choice                                    | Rationale                                  |
| ----------------- | ----------------------------------------- | ------------------------------------------ | ----- | ------------------------------------------- |
| New fields        | `type: "task"                             | "project"`, `stage: string                 | null` | Minimal addition; existing fields preserved |
| Default type      | "task"                                    | Never force overhead on simple captures    |
| Capture flow      | Save first, type-last                     | GTD Inbox model; AI inference advisory     |
| Promotion         | Explicit "Promote to Project" action      | Deliberate step, not silent auto-promotion |
| Stage display     | Inline `[STAGE]` badge in Progress column | No new column; backward-compatible         |
| /rnd relationship | Thin view layer on shared `todos.jsonl`   | No sync state; same storage backend        |
| Header display    | "N projects · M tasks active"             | Minimum discoverability requirement        |

---

## SQ5 — /todo JSONL Schema Versioning

**Verdict:** Per-record `schema_version` integer (matching BaseRecord pattern).
Additive-only migration. `migrate-todos-v2.js` script. Git is the rollback.

### Key Findings

**D5-F1: No version marker exists today.** All 19 records are implicitly v1.
`render-todos.js` uses `?? ""` fallbacks — already forward-compatible with new
fields.

**D5-F2: SoNash already uses per-record `schema_version`.** `BaseRecord` in
`scripts/reviews/lib/schemas/shared.ts` defines
`schema_version: z.number().int().positive()`. All 5 review-system JSONL files
use this pattern. The todos.jsonl migration must follow the same standard.

**D5-F3: Additive-only migration is the safest path.** All proposed new fields
(`stage`, `type`, `artifacts`, `findings_refs`, `blocks`, `blocked_by`) are
additions. No existing fields are removed or renamed. Existing consumers ignore
unknown fields. No "version gate" logic needed in existing consumers.

**D5-F5: Zod v4 `.default()` handles absent fields correctly.** Zod 4.3.6's
`.default()` applies even when the key is entirely absent. V1 records parsed
through the V2 schema automatically receive `type: "task"`, `schema_version: 2`
defaults.

**D5-F8: Bulk migration script is the correct pattern.** Three production
examples exist. The script: backup via git commit → dry-run preview → apply with
full-file overwrite → validate with render-todos.js. Idempotent:
`if (record.schema_version >= 2) return record`.

**D5-F9: Git is the rollback.** `git checkout -- .planning/todos.jsonl` is
instantaneous. No separate backup mechanism needed for a Git-tracked 20-record
file.

**D5-F13: `by: "migration"` in initial stage_history entry.** The initial
migration entry uses `by: "migration"` with `reason: "retroactive_v2_migration"`
to distinguish inferred stages from user-confirmed transitions. Follows
`migrate-retros.js` precedent (`origin: { type: "migration" }`).

**D5-F6 and D5-F7: Upcasters and Verzod are overkill.** Upcasters are designed
for large immutable event logs. `todos.jsonl` is mutable and has 20 records.
Verzod has a Zod v3 peer dependency incompatible with SoNash's Zod v4. Use plain
`migrate-todos-v2.js`.

### Design Decisions from SQ5

| Decision           | Choice                                      | Rationale                                           |
| ------------------ | ------------------------------------------- | --------------------------------------------------- |
| Version marker     | Per-record `schema_version` integer         | Matches BaseRecord pattern; self-describing records |
| Migration type     | Additive-only (no removals)                 | Zero-risk for existing consumers                    |
| Migration approach | Bulk one-shot rewrite script                | Follows migrate-retros.js pattern; 20 records       |
| Rollback           | `git checkout -- .planning/todos.jsonl`     | Git-tracked file; instantaneous                     |
| Zod schema         | ReadSchema (lenient) + WriteSchema (strict) | Matches existing review pipeline pattern            |
| Upcasters          | Explicitly deferred                         | Overkill at current scale; document as fallback     |
| Verzod library     | Explicitly rejected                         | Zod v3 incompatibility; adds dep for 50 lines       |

---

## SQ6 — Dev Dashboard Integration

**Verdict: Add a 7th R&D tab.** Do not fold into Planning tab.

### Key Findings

**D6-F2 and D6-F3: Planning tab's current slot is insufficient.** The
`ResearchTopics` widget shows historical topic summaries (depth, agent count,
confidence). It does NOT show current pipeline stage, blocked projects,
time-in-stage, or dependency relationships. The R&D pipeline joins
`todos.jsonl` + `.research/<slug>/metadata.json` + `.planning/<slug>/`
directories — a different source graph than the Planning tab's current data
sources.

**D6-F4: Distinct user intent is the decisive argument.** Planning tab answers
"what tasks are ready to work on?" R&D pipeline answers "where are my projects
in their lifecycle and what blocks them?" These are different cognitive modes.
Single-responsibility tab design requires separation when user intents diverge.

**D6-F6 and D6-F9: Stage-column kanban is a new visualization type.** No current
tab uses a stage-column pipeline view. This visualization pattern (projects as
cards, stages as columns) requires new render logic. The primary cognitive need
for R&D is surfacing bottlenecks and stalls — time-in-stage data and dependency
signals, not available in any current tab widget.

**D6-F5: 7 tabs is within acceptable range for a developer tool.** The 3-6 tab
guideline is for consumer UIs. Developer tools (Grafana, DataDog, GitHub)
routinely use 8+ tabs. The distinction between 6 and 7 tabs for an expert tool
is not architecturally material.

**D6-F7: Builder architecture is trivially extensible.** Adding `build-rnd.js`
producing `public/rnd-data.json` follows the existing per-tab builder pattern.
No change to Planning tab builder.

**D6-F8 and D6-F13: High-value cross-tab links (3 only).** R&D → Planning
(project hits IMPLEMENT, surface sprint tasks), R&D → Debt (project has
associated debt entries), Debt → R&D (debt item has blocking project). Low-value
links (R&D → Reviews, R&D → Pipeline hook compliance, R&D → Audits) explicitly
rejected.

**D6-F11: Timing advantage of 7th tab.** As the last tab built, the type/stage
schema extensions will exist before the R&D tab needs them. Folding into
Planning (Step 20) would tighten this dependency.

### Design Decisions from SQ6

| Decision              | Choice                                               | Rationale                                                |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Dashboard placement   | 7th tab (R&D)                                        | Distinct user intent, distinct data sources              |
| Builder               | `build-rnd.js` → `public/rnd-data.json`              | Follows per-tab builder pattern                          |
| Primary visualization | Stage-column kanban                                  | Unique visualization; surfaces bottlenecks               |
| Cross-tab links       | 3 high-value only                                    | Signal vs noise; low-value links skipped                 |
| Planning tab          | Add "View in Pipeline" link to ResearchTopics widget | Minimal upgrade; makes Planning a discovery entry        |
| Tab naming            | "R&D" or "Initiatives" (user decides)                | Both accurate; "Pipeline" ambiguous (tab already exists) |

---

## SQ7 — Phase 2 Scouting Governance

**Verdict:** Saturation-based stopping (not time/count caps) with Chesterton's
Gate, Rogers' Five Factors, and ADR-lifecycle exit artifacts.

### Key Findings

**D7-F1 and D7-F2: Theoretical saturation is the correct frame.** Grounded
theory's saturation criterion — "no additional data adds new properties to any
category" — is directly compatible with "no artificial caps." The ≤5%
new-information threshold (Hennig et al., PLOS ONE 2020) operationalizes this:
when (new concepts in last N sources) / (total concepts) < 5%, saturation is
reached. At 0% for two consecutive sources from different sub-categories, it is
definitive.

**D7-F5: Chesterton's Gate is mandatory before any adopt/adapt/reject
decision.** Do not adopt OR reject a pattern until you can articulate: (a) the
problem it solves, (b) the context constraints that shaped it, (c) what happens
if you adopt without those constraints. This is the minimum rigor that prevents
cargo-cult adoption.

**D7-F6 and D7-F7: Cargo cult and NIH are the two failure poles.** Cargo cult =
adopting patterns without understanding their context requirements. NIH =
rejecting patterns based on external origin rather than merit. Both are failure
modes. The neutral evaluation question: "Does this pattern solve a real problem
we have, in a way that fits our constraints?"

**D7-F8: Rogers' Five Factors are the adopt/adapt/reject backbone.** Relative
advantage, Compatibility, Complexity, Trialability, Observability. ADOPT when
all five are favorable; ADAPT when advantage is clear but compatibility requires
modification; REJECT when advantage is unclear or context requirements cannot be
met.

**D7-F10: Satisficing resolves "no caps but not infinite."** Simon's satisficing
provides the theoretical grounding: stop when the aspiration level is met
(enough to decide), not when a counter expires. The aspiration level is
qualitative and researcher-defined.

**D7-F14: ADR lifecycle is the correct exit artifact pattern.** Scouting is
"done" when a SCOUT-DECISION document exists for each category with: pattern
identified, context requirements (Chesterton), adopt/adapt/reject recommendation
(Rogers), translation adjustments (scale/toolchain/workflow). The document
requirement is the gate.

**D7-F15: AAER sustainability test filters scale-dependent patterns.** "If you
removed the organizational scaffolding this pattern was designed for, would it
still deliver value?" Solo devs lack the team coordination infrastructure that
many enterprise patterns require. This test prevents adopting patterns whose
value is entirely scaffolding-dependent.

### Concrete Gate Criteria for Phase 2

**Category OPEN (continue scouting) when any hold:**

- Last source introduced ≥1 new concept
- Cannot articulate WHY the dominant pattern exists (Chesterton fails)
- Fewer than 3 independent source categories sampled

**Category CLOSE (stop scouting) when ALL hold:**

- 2+ consecutive sources from different sub-categories produced 0 new concepts
- Can articulate original problem, context requirements, constraints
- 3+ independent source categories converge on same pattern
- Can predict next source's content with high accuracy before reading

**Phase-Level DONE when ALL hold:**

- Every category has reached Category-Level Saturation Gate
- SCOUT-DECISION document exists for every category
- Disconfirmation pass completed (≥1 contradicting source examined per category)
- Feynman test: can deliver 5-minute summary without notes

---

## SQ8 — Convergence-Loop Integration

**Verdict:** Cross-cutting model with tier-scaled obligation and
skill-integration awareness. Skill-completed stages are pre-verified — do not
add redundant CL gates on top.

### Key Findings

**D8-F1: Programmatic Mode is the canonical interface.** `/convergence-loop`
SKILL.md has an explicit Programmatic Mode for other skills to consume without
direct invocation. The interface: claims_source + preset + topic →
convergence_status + confidence + cl_state_ref.

**D8-F3: D3 independence decision must be respected.** CL-PROTOCOL (policy:
which checks to run, when, which agents) and `/convergence-loop` (execution: T20
tally machinery, state persistence) are intentionally separate. Do not merge or
conflate. (Citation corrected from D5 to D3 per dispute-resolutions.md
Resolution 2 — the independence decision is D3 in the original
`.research/research-discovery-standard/RESEARCH_OUTPUT.md:363`.)

**D8-F4 and D8-F7: Three integration patterns are already in the codebase.**

- `/deep-plan`: MUST for L/XL tasks (5+ diagnosis claims), SHOULD for S/M
- `/deep-research`: Phase 0.5 quick-pass (MUST) + Phase 3 research-claims preset
- `/brainstorm`: SHOULD at Phase 0 (3+ claims), SHOULD at Phase 4

The pattern taxonomy: MUST when wrong claims cascade into irreversible work;
SHOULD when claims are provisional.

**D8-F8: Skill-completed stages are pre-verified conditional on CL state
artifact (cross-cutting insight).** This is the single most important finding
from SQ8, with a critical refinement from dispute resolution. The /rnd pipeline
should NOT add redundant CL gates at RESEARCH→PLAN and PLAN→IMPLEMENT **when a
convergence-loop state file is present** indicating CL was run to completion.
When only claims.jsonl and/or V*.md verifier files exist without a CL state
artifact, treat the stage as manually-created — the V*.md check alone is a
necessary but not sufficient proxy for CL completion (contrarian C3 identified
false-positive failure modes: aborted-before-CL, L0 depth runs expecting
pipeline gate, pre-integration stale artifacts). Users may explicitly mark a
stage as pre-verified or force-CL-gate via the /rnd interface regardless of
artifact state. [REVISED — dispute-resolutions.md Resolution 5]

Robustness check: presence of a convergence-loop state file = deep-research CL
was run. `claims.jsonl` + `V*.md` files alone are a weaker signal and do not
guarantee CL was completed.

**D8-F10: Separate invocation model is explicitly rejected.** D11 mandates
"Verifications at ALL tiers (T0-T3)." A fully manual model means T0/T1
transitions get no policy. The CL-PROTOCOL origin note documents exactly this
failure from Session #237.

**D8-F6 and D8-F14: Embedded model is wrong for early stages.** IDEA and
BRAINSTORM stages typically have 0-2 codified claims — below the CL minimum
threshold (≥3 claims). Embedding CL at every stage adds ceremony with no
verification value.

### Stage-by-Stage CL Value (from D8)

| Transition            | Obligation                         | Preset                    | Notes                                                 |
| --------------------- | ---------------------------------- | ------------------------- | ----------------------------------------------------- |
| IDEA → BRAINSTORM     | MAY (skip)                         | —                         | <3 claims; CL guardrail fires                         |
| BRAINSTORM → RESEARCH | SHOULD                             | `quick`                   | Verify brainstorm assumptions; 3-8 provisional claims |
| RESEARCH → PLAN       | MUST (manual) / satisfied-by-skill | `research-claims` or skip | Deep-research already ran Phase 2.5 + Phase 3 CL      |
| PLAN → IMPLEMENT      | MUST (manual) / satisfied-by-skill | `standard` or skip        | Deep-plan already ran DIAGNOSIS CL                    |
| IMPLEMENT → TEST      | MAY                                | —                         | Code is the verification artifact                     |
| TEST → COMPLETE       | SHOULD                             | `quick`                   | If test coverage was formally documented              |

### Design Decisions from SQ8

| Decision                                     | Choice                                    | Rationale                                                   |
| -------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| CL model                                     | Cross-cutting with tier-scaled obligation | Aligns with CL-PROTOCOL, industry patterns, existing skills |
| Embedded model                               | Explicitly rejected                       | Wrong for early stages; redundant with skill CL             |
| Separate invocation                          | Explicitly rejected                       | Violates D11; "forgotten CL" failure mode                   |
| D3 independence (citation corrected from D5) | Preserved                                 | CL-PROTOCOL = policy; /convergence-loop = execution         |
| Skill-completed stages                       | Treated as pre-verified                   | Most important finding; prevents redundant CL               |
| Detection robustness                         | claims.jsonl + V\*.md verifier file       | More reliable than claims.jsonl alone                       |
| CL result in pipeline state                  | `cl_transitions[]` audit array            | Enables later audit of verified stage transitions           |

---

## Cross-Cutting Themes

### Theme 1: Declarative Over Imperative (spans SQ1, SQ5, SQ8)

The whitelist transition table (SQ1-D1-F11), Zod schema as the single source of
truth for validation (SQ5-D5-F5), and the CL policy table in RDS-PROTOCOL.md
(SQ8-D8-R1) all converge on the same pattern: behavior defined in data
structures that are testable and auditable, not in scattered conditional code
logic. SoNash tenets T17 (`declarative_over_imperative`) and T5
(`contract_over_implementation`) are confirmed by this finding.

### Theme 2: Capture-First, Enrich-Later (spans SQ1, SQ4, SQ7)

The GTD Inbox model (SQ4-D4-F5), the "guarded whitelist allows shortcuts" design
(SQ1-D1-F4), and the "scope anchoring before scouting" governance pattern
(SQ7-D7, R1) all share the same principle: start with the simplest valid state
and allow enrichment as context accumulates. Forcing full metadata at creation
time is consistently identified as an anti-pattern.

### Theme 3: Skill-Completed Stages Are Pre-Verified (spans SQ2, SQ8)

The most important cross-cutting insight from this research: artifact-presence
triggered stage advance (SQ2) and recognition that skill-completed stages are
already CL-gated (SQ8) work together. The /rnd pipeline should recognize
`claims.jsonl + V*.md` (from deep-research) and `DECISIONS.md` (from deep-plan)
as pre-verified artifacts and reduce the CL obligation to SHOULD-level. This
prevents ceremony stacking: the skills do their own CL; the pipeline should not
duplicate it.

### Theme 4: Minimal Infrastructure, Maximum Compatibility (spans SQ3, SQ5, SQ6)

The `findings_refs` array added to `todos.jsonl` (SQ3), the additive-only JSONL
migration (SQ5), and the per-tab builder architecture for the dashboard (SQ6)
all share the same design philosophy: extend existing data structures rather
than introduce new infrastructure. No graph databases, no external migration
libraries, no new file formats. The existing patterns (JSONL arrays, Zod
schemas, per-tab builders) are sufficient.

### Theme 5: Acknowledgment-Required Surfacing (spans SQ3, SQ8, CLAUDE.md guardrail #6)

The session-begin `findings_refs` digest (SQ3-D3-F8), the user gate before CL
convergence declaration (SQ8-D8-F12), and CLAUDE.md guardrail #6
("unacknowledged warnings become wallpaper") all point to the same requirement:
any system-surfaced data that requires action must force acknowledgment before
proceeding. Passive surfacing that can be ignored is not surfacing at all.

---

## Contradictions and Open Tensions

| Contradiction                                                                                  | Sources                | Resolution                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab count guideline (3-6) vs adding 7th tab                                                    | D6-F5 vs UX literature | Developer tool context mitigates; expert user internalizes layout quickly. Not architecturally material.                                                                                                    |
| D11 "verify at all tiers" vs CL guardrail "<3 claims don't run CL"                             | D8-C1                  | CL is the T2/T3 instrument. T0/T1 verification is satisfied by lighter source-existence checks, not full CL. Compatible when read precisely.                                                                |
| Artifact-presence as "pre-verified" vs user may have aborted deep-research before Phase 2.5    | D8-C2                  | Require `claims.jsonl` + at least one `V*.md` verifier file. `claims.jsonl` alone is insufficient.                                                                                                          |
| Zettelkasten "timestamp IDs are perpetually stable" vs BibTeX "keys must be explicitly pinned" | D3-C2                  | SoNash's `C-NNN` IDs are index positions, not timestamps. Archived slugs make them stable only if claims.jsonl is never regenerated after archiving. Require archived research directories to be read-only. |
| Scite.ai neutral "mentioning" category vs 3-type relationship model                            | D3-C1                  | Consider adding `relatesTo` as a fourth type for loose connections. Not currently included to reduce cognitive friction at registration time — surface this decision.                                       |

---

## Open Questions for Deep-Plan Consumption

1. **Retroactive stage inference heuristic.** The 19 existing todos have
   implicit stage in free-text `progress` field. What is the heuristic for
   mapping `progress` text to a formal `stage` value? Manual one-time review vs
   AI-assisted inference + confirmation?

2. **`/rnd` SKILL.md design.** The thin view layer on `todos.jsonl` needs a
   formal skill definition. What is the menu structure? How does it differ from
   `/todo`? What pipeline-centric actions does it expose?

3. **Slug field on todos.** The R&D dashboard builder and `findings_refs` both
   require a `slug` field. The current heuristic (derive from `context.files`
   paths) covers observed todos but may fail for edge cases. Should `slug` be an
   explicit field in the V2 schema?

4. **PARKED stage semantics.** PARKED is proposed as a non-terminal stage with
   outgoing transitions back to any prior stage (history state). What are the
   explicit outgoing transitions in the whitelist? Does PARKED require a
   `returnAfter` field?

5. **Tier assignment for /rnd projects.** The CL obligation level scales with
   project tier (T0-T3). How is tier set on a PROJECT-type todo? Is it a field?
   Is it inferred from tags or priority?

6. **`watchPaths` directory vs file support.** Whether Claude Code's
   `watchPaths` accepts directories (watching all files within) or requires
   explicit file paths is not confirmed. With 20 active slugs × 4 artifact paths
   = 80 entries, feasibility limit is unknown.

7. **`relatesTo` fourth relationship type.** Scite.ai data shows neutral
   "mentioning" is the most common citation type. The three-type `findings_refs`
   model (informedBy/constrainedBy/contradicts) may force false categorization.
   Add `relatesTo`?

8. **R&D tab naming.** "R&D", "Initiatives", "Projects" are all viable.
   "Pipeline" is ambiguous (Pipeline tab exists for build pipeline hooks). User
   decides.

---

## Cross-References to Original Research

### What This Research Confirms (Original Research Findings Still Valid)

- **Direction E (Phased Hybrid)** chosen in the brainstorm is validated by all 8
  sub-questions. The approach of extending `/todo` with a `stage` field is
  correct.
- **The JSONL-first tenet (T4)** and **crash-proof state (T9)** are confirmed as
  the right primitives for stage persistence.
- **Decision D3 (CL-PROTOCOL independence)** from the original
  `.research/research-discovery-standard/RESEARCH_OUTPUT.md:363` is confirmed
  valid and explicitly preserved in SQ8. (Citation corrected from D5 to D3 per
  dispute-resolutions.md Resolution 2.)
- **Decision D11 (verification at all tiers)** is confirmed valid and its
  interaction with CL guardrails is fully resolved.
- **Phase 2 scouting governance** was identified as an open question in the
  brainstorm — SQ7 provides a complete framework.

### What This Research Supersedes

- **Informal stage tracking via `progress` text field.** Superseded by the
  formal two-field model (`type` + `stage`) with `stage_history` audit trail.
- **No cross-project findings connection.** Superseded by the `findings_refs`
  schema extension and `stable_ref` field on claims.

### What Is Net-New (Not in Original Research)

- **`FileChanged` hook + `watchPaths` architecture** for auto-advance. The
  original research did not examine this Claude Code native capability.
- **Skill-completed stages are pre-verified** insight (SQ8-D8-F8). Not
  anticipated in original research framing.
- **ADR lifecycle as scouting exit artifact.** Not in original scope; emerged
  from scouting governance investigation.
- **`build-rnd.js` 3-source join architecture** with explicit slug derivation
  logic. Original research confirmed R&D tab as a consideration but did not spec
  the data model.
- **AAER sustainability test** for scale translation of external patterns. Novel
  governance tool.

---

## Unexpected Findings

1. **Deep-research's decimal sub-phase convention (3.5, 3.95, 3.97) is directly
   reusable for the /rnd pipeline.** This pattern allows inserting conditional
   stages without renumbering the main stage enum. E.g., BRAINSTORM.1 (initial)
   vs BRAINSTORM.2 (post-research refinement). Not in original scope but
   directly applicable.

2. **Temporal's workflow replay capability has a stage_history analog.** The
   append-only `stage_history` audit trail enables reconstruction of any prior
   pipeline state by reading up to a given timestamp — a free-tier "replay"
   capability for debugging.

3. **`post-write-validator.js:117` already has the correct Windows path
   normalization pattern.** The new `rnd-stage-advance.js` hook should copy this
   exact approach — no new logic needed.

4. **The ≤5% new-information saturation threshold (Hennig et al., PLOS
   ONE 2020)** transforms a subjective saturation judgment into an auditable
   calculation. This is directly applicable to any future deep-research Phase 2
   scouting.

5. **Verzod (Zod-based migration library) has a Zod v3 peer dependency.** Since
   SoNash uses Zod v4, Verzod cannot be added. But the conceptual migration
   chain pattern it implements is achievable in ~50 lines of plain TypeScript
   with Zod 4 — no library needed.

---

## Challenges Section

_Phase 3 (contrarian + OTB challenge agents) was not run in this supplemental
research pass. The following are candidate challenge vectors identified during
synthesis:_

- The "skill-completed stages are pre-verified" heuristic assumes skills were
  used correctly and completely. An adversarial challenge: what if the user
  aborted deep-research at Phase 1? The V\*.md check (D8-C2 resolution)
  partially addresses this but relies on Phase 2.5 output files existing.
- The `findings_refs` manual registration model requires discipline to populate.
  If the user never populates refs, the system provides zero cross-project
  value. Challenge: is there a graceful degradation path that provides partial
  value even without explicit refs?
- The 7-tab dashboard assumes the 6-tab plan is completed first. If the
  dashboard project is deprioritized, the R&D tab has no home. Challenge: is a
  `/rnd` CLI skill sufficient as a standalone alternative if the dashboard is
  not built?

---

## Methodology

**Research Design:** 8 parallel searcher agents, one per sub-question. Each
agent used a codebase-primary + web-secondary profile. Findings files produced:
D1–D8.

**Sources:** 112 total findings across 8 files. Primary sources are direct
codebase reads (T1 HIGH trust). Secondary sources are official documentation,
peer-reviewed academic papers, and authoritative practitioner references.

**Synthesis approach:** Thematic grouping by design decision, not by source
file. Cross-cutting themes extracted by identifying convergent patterns across
2+ sub-questions.

**Confidence:** Overall HIGH. The vast majority of findings are grounded in
direct codebase inspection or 2+ independent external sources. No
training-data-only claims were made as primary evidence.

---

## Sources (Tiered)

### Tier 1 — Official Codebase (Ground Truth)

| ID    | Source                                                                       | Used By            |
| ----- | ---------------------------------------------------------------------------- | ------------------ |
| S-001 | `.planning/todos.jsonl`                                                      | D1, D2, D4, D5, D6 |
| S-002 | `.research/research-discovery-standard/BRAINSTORM.md`                        | D1, D4             |
| S-003 | `.claude/skills/deep-research/SKILL.md` v1.9                                 | D1, D2, D8         |
| S-004 | `.claude/skills/convergence-loop/SKILL.md` v1.1                              | D8                 |
| S-005 | `.planning/plan-orchestration/CL-PROTOCOL.md` v1.1                           | D8                 |
| S-006 | `.planning/research-discovery-standard/DECISIONS.md`                         | D8, D3             |
| S-007 | `.claude/skills/todo/SKILL.md`                                               | D4, D5             |
| S-008 | `.claude/skills/todo/REFERENCE.md`                                           | D4, D5             |
| S-009 | `scripts/reviews/lib/schemas/shared.ts`                                      | D5                 |
| S-010 | `scripts/reviews/migrate-retros.js`                                          | D5                 |
| S-011 | `scripts/reviews/migrate-ecosystem-v2.js`                                    | D5                 |
| S-012 | `scripts/planning/render-todos.js`                                           | D5                 |
| S-013 | `.claude/hooks/session-start.js`                                             | D2                 |
| S-014 | `.claude/hooks/post-write-validator.js`                                      | D2                 |
| S-015 | `.planning/dev-dashboard/PLAN.md`                                            | D6                 |
| S-016 | `.planning/dev-dashboard/DECISIONS.md`                                       | D6                 |
| S-017 | `.planning/system-wide-standardization/tenets.jsonl`                         | D1                 |
| S-018 | `.research/research-index.jsonl`                                             | D2, D3             |
| S-019 | `.claude/skills/deep-plan/SKILL.md` v3.0                                     | D8                 |
| S-020 | `.claude/skills/brainstorm/SKILL.md` v1.0                                    | D8                 |
| S-021 | `.planning/archive/deep-research-skill/research/RESEARCH_MEMORY_LEARNING.md` | D3                 |
| S-022 | `.claude/state/deep-research.research-discovery-standard-v2.state.json`      | D1                 |

### Tier 2 — Official Documentation and High-Quality External Sources

| ID    | Source                                                                | Used By |
| ----- | --------------------------------------------------------------------- | ------- |
| S-023 | XState Documentation (xstate.js.org)                                  | D1      |
| S-024 | Statecharts.dev Glossary                                              | D1      |
| S-025 | YouTrack State Machine Documentation                                  | D1      |
| S-026 | Azure Architecture Center — Event Sourcing                            | D1      |
| S-027 | Linear Conceptual Model (linear.app/docs)                             | D1, D4  |
| S-028 | Claude Code Hooks Reference (code.claude.com)                         | D2      |
| S-029 | Claude Code Hooks Guide (code.claude.com)                             | D2      |
| S-030 | chokidar Library Documentation                                        | D2      |
| S-031 | Better BibTeX Citation Keys (retorque.re)                             | D3      |
| S-032 | Zettelkasten Identity Article (zettelkasten.de)                       | D3      |
| S-033 | scite.ai Smart Citation Index (MIT Press, peer-reviewed)              | D3      |
| S-034 | Citation of Retracted Papers (Learned Publishing 2025, peer-reviewed) | D3      |
| S-035 | NN/G Progressive Disclosure (nngroup.com)                             | D4      |
| S-036 | CLI Guidelines (clig.dev)                                             | D4      |
| S-037 | OmniFocus GTD Whitepaper                                              | D4      |
| S-038 | Getting Productive with Things 3 (culturedcode.com)                   | D4      |
| S-039 | Evolving GitHub Issues and Projects (April 2025, official changelog)  | D4      |
| S-040 | Confluent Schema Registry Evolution Docs                              | D5      |
| S-041 | Zod v4 Migration Guide (zod.dev)                                      | D5      |
| S-042 | Eleken.co Tabs UX Guide                                               | D6      |
| S-043 | Atlassian Kanban Guide                                                | D6      |
| S-044 | Saturation in Qualitative Research (PMC5993836, peer-reviewed)        | D7      |
| S-045 | Thematic Saturation Method (PMC7200005/PLOS ONE, peer-reviewed)       | D7      |
| S-046 | Chesterton's Fence — Farnam Street                                    | D7      |
| S-047 | Cargo Cult Software Engineering — Steve McConnell                     | D7      |
| S-048 | Diffusion of Innovations — Rogers (via Wikipedia)                     | D7      |
| S-049 | Architecture Decision Records (adr.github.io)                         | D7      |
| S-050 | Stage-Gate International                                              | D7, D8  |
| S-051 | dbt + Great Expectations pipeline architecture                        | D8      |

### Tier 3 — Community, Blogs, Supporting References

| ID    | Source                                          | Used By |
| ----- | ----------------------------------------------- | ------- |
| S-052 | Node.js GitHub Issues (fs.watch Windows)        | D2      |
| S-053 | OpenAI Codex PR #11494 (debounce duration)      | D2      |
| S-054 | Logseq Block References Issues                  | D3      |
| S-055 | Taskwarrior Practical Guide (2025)              | D4      |
| S-056 | Todoist Quick Add (official)                    | D4      |
| S-057 | GitHub Issues changelog April 2025              | D4      |
| S-058 | RSSD Methodology (ResearchSquare, 2022)         | D1      |
| S-059 | Temporal.io — Beyond State Machines             | D1      |
| S-060 | Hennig et al. Saturation (PMC7200005, PLOS ONE) | D7      |
| S-061 | Not Invented Here — Wikipedia                   | D7      |
| S-062 | Satisficing — Wikipedia                         | D7      |
| S-063 | AAER Framework — Practical Action               | D7      |

---

## Version History

| Version | Date       | Changes                                         |
| ------- | ---------- | ----------------------------------------------- |
| 1.0     | 2026-04-04 | Initial synthesis from 8 findings files (D1–D8) |
