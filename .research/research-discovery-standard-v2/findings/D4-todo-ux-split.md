# Findings: /todo UX Split — PROJECT vs TASK Modes in One Interface

**Searcher:** deep-research-searcher **Profile:** codebase + web (CLI UX
patterns, dual-mode interfaces) **Date:** 2026-04-04 **Sub-Question IDs:** SQ4
**Domain:** technology

---

## 1. Sub-Question Restated

SoNash's `/todo` skill manages 19 active items that fall into two distinct
categories: simple atomic tasks (e.g., "Audit .gitignore") and rich R&D projects
(e.g., "Claude Code OS — multi-stage research initiative") that currently encode
their pipeline stage in a free-text `progress` field. The plan is to formally
split these into TASK and PROJECT types with PROJECT items tracking a named
pipeline (IDEA → BRAINSTORM → RESEARCH → PLAN → IMPLEMENT → TEST → COMPLETE).

The question: how should the interface handle both types without degrading the
quick-capture experience for tasks OR underserving the stage-visibility needs of
projects?

---

## 2. Search Strategy

**Codebase reads (ground truth):**

- `.claude/skills/todo/SKILL.md` — full menu structure, processes, guard rails
- `.claude/skills/todo/REFERENCE.md` — JSONL schema, table format, statuses
- `.planning/todos.jsonl` — actual live data (20 items, ~15 PROJECT-type, ~5
  TASK-type)

**Web research (CLI UX + dual-mode patterns):**

- Taskwarrior design philosophy (project as auxiliary, not first-class)
- Things 3 three-tier hierarchy (Areas → Projects → Tasks)
- OmniFocus GTD Inbox + Review separation
- Todoist quick-add vs project management trade-offs
- Linear opinionated complexity reduction
- GitHub Issues vs Projects atomic/aggregate design
- CLI UX pattern literature: clig.dev, Atlassian, Evil Martians, NN/G
- Progressive disclosure research (NN/G canonical article)

**Query reformulations used:** 8 distinct queries across Taskwarrior,
progressive disclosure, CLI dual-mode, task auto-classification, project
metadata minimums, kanban dual-view, menu-driven mode switching.

---

## 3. Findings

### Finding 1 — Current /todo schema already partially supports type bifurcation [CONFIDENCE: HIGH]

The live `todos.jsonl` (20 items) demonstrates a clear de facto split:

- **PROJECT-type items (approx. 15):** multi-sentence descriptions, 3-10 line
  `progress` entries describing pipeline stages ("Research done. Execution
  next.", "Brainstorm complete (6 directions)"), references to external
  artifacts (`.planning/`, `.research/` files), and multi-session lifecycle.
  Examples: T4 (Multi-layer memory), T5 (Worktree management), T13
  (Research-Discovery Standard), T16 (Claude Code OS).

- **TASK-type items (approx. 5):** single-sentence descriptions, empty
  `progress`, no artifact references, day-scale completion window. Examples: T15
  (Audit .gitignore), T19 (Internal testing suite — though this is on the
  border).

The existing schema (`id`, `title`, `description`, `priority`, `status`,
`progress`, `tags`, `context`, timestamps) contains no `type` discriminator. The
missing field is exactly that — a `type` field — plus a structured `stage` field
to replace the free-text `progress` encoding for PROJECT items.

Sources: `.claude/skills/todo/REFERENCE.md` (filesystem, HIGH trust);
`.planning/todos.jsonl` (filesystem, HIGH trust).

---

### Finding 2 — Taskwarrior's "project as auxiliary" design prevents capture friction [CONFIDENCE: HIGH]

Taskwarrior deliberately treats projects as optional lightweight classifiers
rather than mandatory hierarchical containers. `task add "fix auth redirect"` is
a complete, valid command. Adding a project is retrospective:
`task 1 modify project:auth`. This "optional enrichment" pattern means quick
capture never blocks on project assignment.

The practical result: users start with simple task lists and organically adopt
organizational layers that match actual complexity. The key constraint: each
task has at most one project (prevents organizational paralysis).

The inverse lesson for SoNash: the `type` field should be optional-with-smart-
default (default to TASK), not a mandatory upfront choice.

Sources: brokenpip3.com Taskwarrior practical guide (2025, MEDIUM trust);
1klb.com OmniFocus→Taskwarrior migration post (2025, MEDIUM trust).

---

### Finding 3 — Things 3's three-tier conceptual separation prevents hierarchy confusion [CONFIDENCE: MEDIUM]

Things 3 uses a clean three-tier model: **Areas** (life domains) → **Projects**
(multi-step outcomes) → **Tasks** (atomic actions). The explicit rule: when a
task requires more than one step to complete, it becomes a Project.

The UI implication: adding a task to an Area is one-tap. Promoting it to a
Project is a deliberate step. The whitespace between projects in the Today view
provides visual delineation at zero cognitive cost.

For SoNash (single-user, no Areas concept): the relevant insight is the
**promotion pattern** — items start as tasks, graduate to projects explicitly
when scope warrants it. The `/todo` skill could implement a
`promote T15 to project` action rather than requiring type selection at creation
time.

Sources: Staying Focused with Things 3 (Medium, 2018, MEDIUM trust);
culturedcode.com Things support guide (official, HIGH trust); multiple user
posts confirming promotion flow.

---

### Finding 4 — Progressive disclosure has a 2-layer maximum for usability [CONFIDENCE: HIGH]

NN/G's canonical progressive disclosure research establishes that designs
"typically shouldn't exceed 2 disclosure levels — users become disoriented
navigating more than two layers." The pattern resolves tension between "users
want features" and "users want simplicity" by deferring advanced options to
secondary screens.

Applied to the /todo menu: a two-layer model works cleanly.

- **Layer 1 (default):** TASK-only view — ID, Title, Priority, Status, Tags,
  Created. No stage columns. The standard 8-option menu applies.
- **Layer 2 (on demand):** PROJECT-specific actions — stage update, artifact
  link, pipeline view — surfaced only when selecting a PROJECT-type item or
  explicitly invoking a project filter.

Going to three layers (e.g., Layer 1: table → Layer 2: item detail → Layer 3:
pipeline stage editor) would exceed the usability limit for an interactive menu.

Sources: NN/G Progressive Disclosure article (official, Tier 1 HIGH trust);
lollypop.design progressive disclosure 2025 (MEDIUM trust).

---

### Finding 5 — The "5-second capture rule" is real and kills systems that violate it [CONFIDENCE: MEDIUM]

Multiple independent sources converge on a threshold: if capturing a thought
takes more than ~5-10 seconds of friction, the system fails as a capture tool.
Todoist's documentation states: "Every second of friction between thought and
capture is a thought that might not get captured." The GTD literature mirrors
this with the Inbox concept — capture first, organize later.

The anti-pattern to avoid: forcing type selection, stage selection, or
description input before the item is saved. Todoist's quick-add processes
natural language first, then enriches — title gets saved immediately, metadata
can follow.

For /todo: the `Add Todo` process (SKILL.md step 2) currently does AI-propose-
then-confirm, which is already compliant with this pattern for TASK items. For
PROJECT items, the risk is that the AI proposes a stage, asks about artifacts,
etc. — the confirm step multiplies. The fix: save first, enrich later. The
"Update Progress" menu option already handles retrospective enrichment.

Sources: Todoist help article on quick-add (official, HIGH trust); survicate.com
2025 user friction guide (MEDIUM trust); toolradar.com task manager comparison
2026 (MEDIUM trust).

---

### Finding 6 — Unified command with optional flags outperforms separate commands for same-domain items [CONFIDENCE: HIGH]

clig.dev (the authoritative CLI design guide) and Atlassian's 10 CLI principles
both recommend: use subcommands when items span different domains, but prefer
flags/options when items share the same underlying concept. Git uses subcommands
(different operations: `commit`, `push`, `status`). Cargo uses subcommands
(`build`, `test`, `run`). These are distinct operations on the same codebase
entity.

For SoNash, TASK and PROJECT are different _views_ of the same `todo` entity
type, not different operations. The unified command pattern is correct: `/todo`
handles both. Splitting into `/todo` and `/rnd` creates a navigation decision
tax on every capture: "wait, is this a task or a project?"

The exception: if `/rnd` needs a fundamentally different pipeline (brainstorm →
research → plan, not the simple TASK lifecycle), a separate skill becomes
justified. But the storage backend and session hooks can remain shared.

Sources: clig.dev CLI guidelines (Tier 1 authoritative, HIGH trust); HN CLI
design discussion (MEDIUM trust); Atlassian CLI principles (MEDIUM trust).

---

### Finding 7 — Context-aware table rendering hides irrelevant columns without separate views [CONFIDENCE: MEDIUM]

Multiple task management systems implement context-aware column visibility:
Quire Kanban Board 2.0 supports per-user view mode on the same data. GitScrum
offers Kanban/List/Flow/Heatmap on the same dataset with a toggle. Monday.com
Kanban view and Linear both render stage columns only when stage data exists.

The principle: table columns should reflect the data present, not the
maximum-possible schema. If no PROJECT items are visible, the `Stage` column
should not appear. If filtered to PROJECT items only, a `Stage` column (showing
`RESEARCH 60%` inline) becomes informative.

For the `/todo` SKILL.md table format specification: current columns are
`ID | Title | Priority | Status | Progress | Tags | Created`. A minimal change:
replace the free-text `Progress` column with a computed `Stage/Note` column that
shows:

- For TASK: empty or short progress note (existing behavior preserved)
- For PROJECT: pipeline stage badge + completion signal (e.g., `[RESEARCH]`)

Sources: Quire blog post (MEDIUM trust); GitScrum docs (MEDIUM trust); clig.dev
human-readable output defaults (HIGH trust).

---

### Finding 8 — Linear's "no 50 dropdowns" philosophy validates the opinionated minimum [CONFIDENCE: MEDIUM]

Linear was built explicitly from founder frustration with "every view having 50
dropdowns." The design mandate: eliminate fields that don't serve the core user
segment. Despite supporting projects, cycles, priorities, and labels, Linear's
issue creation is a single-field flow (title → enter). Everything else is
optional enrichment.

The OmniFocus counter-example: mandatory project assignment and perspective
configuration creates capture friction for quick tasks. This is why the
OmniFocus→Taskwarrior migration post notes that "capture friction varies
inversely with hierarchy depth."

For SoNash PROJECT items: the minimum viable metadata to add on top of the
existing TASK schema is exactly two fields:

1. `type: "project"` (discriminator)
2. `stage: string` (one of the 7 pipeline values, or null)

Everything else (artifacts, external links, sub-items) should remain free-form
in `description` and `progress` — as it already is today.

Sources: eleken.co Linear case study (MEDIUM trust); 1klb.com OmniFocus
migration (MEDIUM trust); Linear app official documentation (cross-reference).

---

### Finding 9 — OmniFocus Inbox/Review separation is the canonical single-user quick-capture pattern [CONFIDENCE: HIGH]

OmniFocus's GTD implementation separates capture from organization:

- **Inbox:** capture anything instantly, no metadata required
- **Review mode:** periodically process each item (assign project, due date,
  context, or drop it)

This two-phase approach is explicitly designed for single users managing both
simple errands and complex projects. The review interval (daily/weekly/monthly)
per project prevents organizational maintenance from becoming a full-time job.

For /todo: the existing `Add Todo → AI proposes → user confirms` flow is
Inbox-style (correct). The gap is the Review equivalent — there is no periodic
"process these pending items and upgrade any that are now projects" flow. Adding
a `Review Todos` option to the menu (or folding it into session-end) would close
this gap without requiring mandatory type selection at capture.

Sources: Inside OmniFocus GTD whitepaper (official, HIGH trust); Zapier
OmniFocus GTD guide (MEDIUM trust); OmniFocus forum 10-year GTD post (HIGH
community trust).

---

### Finding 10 — Todoist's capture-first philosophy deliberately obscures project orchestration [CONFIDENCE: MEDIUM]

Todoist's UX critique (NYC Design, Medium) reveals that the tool intentionally
optimizes task capture affordances while hiding project management behind
secondary navigation. The author discovered multi-project view after six months
of use. This is "not oversight — it's philosophy favoring simplicity over
feature discoverability."

The lesson is double-edged: Todoist succeeds at capture but fails at project
discoverability. A user who needs both capabilities must learn the hidden paths,
which works for consumer apps but may not be acceptable for a developer tool
where project visibility is a primary use case.

For /todo: pure discoverability of PROJECT items must be explicit — the menu
should show "5 projects active, 3 tasks active" in the header (not just "8 todos
active"), making the type split visible without forcing it.

Sources: NYC Design Todoist UX critique (Medium, MEDIUM trust); Todoist help
articles on quick-add (official, HIGH trust).

---

### Finding 11 — Interactive mode + non-interactive mode must coexist [CONFIDENCE: HIGH]

clig.dev and lucasfcosta.com both state the same principle: "An interactive
command does not replace a non-interactive one. Once people learn to use your
tool, they'll probably prefer non-interactive commands." Interactive mode
(numbered menu, confirm prompts) is for discovery and safety. Non-interactive
mode (flags, arguments) is for speed.

Current `/todo` is menu-only (SKILL.md: "takes no arguments — all interaction
happens through the menu"). This is appropriate for an AI-skill invocation
pattern where Claude is the executor. But the principle maps to the PROJECT vs
TASK split: the menu should present PROJECT operations without requiring menu
traversal to update a stage. A pattern like "T13 → update stage" should be a
direct conversational shortcut, not always requiring 3 menu hops.

Sources: clig.dev guidelines (HIGH trust); lucasfcosta.com CLI UX patterns 2022
(MEDIUM trust).

---

### Finding 12 — Type auto-detection from content signals is viable but must remain advisory [CONFIDENCE: LOW]

ML-based task classification research (MDPI Electronics, 2022) shows that task
types can be detected from keyword analysis in text descriptions. For SoNash's
AI-mediated skill, the AI can infer type signals: multi-sentence descriptions,
mentions of "research", "brainstorm", "plan", "phases" suggest PROJECT; short
imperative descriptions with a single verb suggest TASK.

However, several sources warn that auto-classification must remain advisory: the
`/todo` skill's "AI proposes, user decides" principle (SKILL.md rule 5) already
embeds this correctly. If the AI proposes `type: "project"`, the user can
override without friction. The risk of silent auto-promotion (task becomes
project without acknowledgment) is higher than the risk of requiring one
confirmation click.

The OmniFocus/Things 3 pattern aligns: auto-detection feeds the inbox, but type
assignment happens in review, not capture.

Sources: MDPI Classification of Task Types in Software Development (2022, MEDIUM
trust); ClickUp task categories blog (MEDIUM trust); SKILL.md rule 5
(filesystem, HIGH trust).

---

### Finding 13 — Display density: inline stage badge in the table is better than a separate column [CONFIDENCE: MEDIUM]

GitHub Issues demonstrates atomic display: each issue shows state, labels, and
assignees inline in a compact row. GitScrum and Linear both encode stage
information in compact badges (pill labels, colored tags) rather than full
columns. The Kanban view uses columns-as-stages, but the list view uses inline
badges — the same data, rendered differently.

For the /todo table, a `Stage` column appearing only when PROJECT items exist in
the current view would add one column (acceptable) but creates visual noise when
TASK items dominate. An alternative: encode the stage in the existing `Progress`
column display:

- TASK: `"halfway done"` (existing text behavior)
- PROJECT: `[RESEARCH 60%]` (structured badge derived from `stage` field)

This preserves the existing column schema while adding semantic richness for
PROJECT items. Zero new columns needed.

Sources: GitHub Issues evolving changelog (April 2025, official, HIGH trust);
Quire dual-view kanban (MEDIUM trust); current REFERENCE.md table spec
(filesystem, HIGH trust).

---

### Finding 14 — Separate `/rnd` skill vs PROJECT mode of `/todo`: analysis [CONFIDENCE: MEDIUM]

The codebase already has patterns for skill separation: `/todo` vs
`/gsd:add-todo` vs `/add-debt` are distinct skills for conceptually distinct
workflows. The criterion is whether the workflow shares enough surface with the
parent skill to justify co-location.

Arguments for `/rnd` as separate skill:

- Different lifecycle (7-stage pipeline vs 5 statuses)
- Different session integration (deep-research hookup, brainstorm, plan phases)
- Separate SKILL.md would be readable without PROJECT/TASK disambiguation prose
- Matches user's existing mental model: "this is an R&D project, not a todo"

Arguments for PROJECT mode within `/todo`:

- Same storage backend (todos.jsonl)
- Same session hooks (startup count, session-end review)
- Same operations (complete, archive, reprioritize)
- Avoids cross-skill sync state — "where did I put that project again?"

Recommendation analysis: the storage + hooks argument is decisive for a solo-
dev single-user context. The `/rnd` skill can be a thin view-layer on top of the
same `todos.jsonl` that filters to `type: "project"` items and presents a
pipeline-centric menu. This gives the user both the unified data model AND the
focused interface. The pattern mirrors GitHub Issues vs GitHub Projects: same
underlying data, different views.

Sources: SKILL.md architecture (filesystem, HIGH trust); clig.dev composition
principles (HIGH trust); GitHub changelog on Issues/Projects evolution (April
2025, official, HIGH trust).

---

## 4. Synthesis — UX Pattern Recommendations

### Pattern A: Capture-First, Type-Later (GTD Inbox Model)

Never block capture on type selection. The default `/todo add` flow should:

1. Save the item as `type: "task"` (default)
2. AI proposes type based on content signals (advisory only)
3. User confirms or overrides in a single step

Promotion from TASK to PROJECT is a later action, available via `Edit Todo` or a
new `Promote to Project` menu option.

### Pattern B: Two Disclosure Layers Only (NN/G Limit)

Layer 1: Standard 8-option menu → works for all items Layer 2: PROJECT-specific
actions surface only when a PROJECT item is selected (stage update, pipeline
view, artifact tracking)

Never go to a third layer. All PROJECT metadata fits in Layer 2.

### Pattern C: Type-Aware Table Rendering (Same Schema, Different Display)

No new columns. Instead:

- The `Progress` column displays `[STAGE]` badge for PROJECT items and free-
  text for TASK items
- The menu header shows "N projects · M tasks active" for type-level visibility
- Filter `1) View Todos` gains a "projects only" option that shows a stage-
  sorted pipeline view

### Pattern D: Unified Command, Separated Semantic View

`/todo` remains the single entry point for both types. `/rnd` (optional future
skill) is a filtered view of the same data with a pipeline-centric menu. They
share `todos.jsonl` and session hooks. No sync state required.

### Pattern E: Advisory Auto-Detection

The AI infers type from content signals during `Add Todo`:

- Keywords: "research", "brainstorm", "phase", "multi-session", "plan" → propose
  PROJECT
- Single verb imperative, no artifact refs → propose TASK User always confirms.
  Auto-detection is never silent.

---

## 5. Recommendations Specific to SoNash /todo → /rnd Evolution

### Immediate (schema change, minimal UX impact):

**R1.** Add `type: "task" | "project"` field to the JSONL schema. Default:
`"task"`. Backfill existing todos: T15, T19 → task; remaining long-progress
items → project. Risk: zero — existing consumers only read `progress` and
`status`.

**R2.** Add `stage: string | null` field to schema. Null for task items. For
project items: one of
`IDEA | BRAINSTORM | RESEARCH | PLAN | IMPLEMENT | TEST | COMPLETE`. This
replaces the implicit stage encoding in the `progress` field without removing
`progress` (free text still valuable as notes).

**R3.** Update `render-todos.js` to display `[STAGE]` badge in the Progress
column for PROJECT items. The `REFERENCE.md` "Output contract (stable for hook
parsing)" comment at Line 5 summary line should be updated to include
project/task counts: `N projects (S stage) · M tasks active`.

### UX evolution (menu changes):

**R4.** Add type-awareness to `2) Add Todo`:

- After title/description capture, AI infers type and proposes it
- If type=project AND no stage set, propose stage IDEA as default
- One confirmation step covers both: "T16 (project, RESEARCH) — does this look
  right?"

**R5.** Add `9) Promote to Project` menu option (or fold into `4) Edit Todo`).
Promotion sets `type: "project"`, proposes a stage based on the current progress
text. Demoting project → task clears the stage field.

**R6.** Add `View: Projects pipeline` subfilter within `1) View Todos`. This
shows PROJECT items sorted by stage (IDEA first), giving a lightweight kanban
read in table form. All TASK items hidden in this view.

### Future (justified if /rnd usage grows):

**R7.** Create `/rnd` as a thin skill wrapper around `todos.jsonl` filtered to
`type: "project"`. The menu becomes pipeline-centric: "1) View Pipeline | 2) Add
Project | 3) Advance Stage | 4) View by Stage". This preserves `/todo` for task
users while giving project users a focused interface. Both skills share the same
JSONL and render script — no state sync required.

**R8.** Session-start hook update: surface type counts:
`📋 Todos: 2 tasks active · 5 projects (2 RESEARCH, 1 PLAN, 2 IMPLEMENT)`

---

## 6. Gaps Identified

**GAP-1:** No empirical data on how often the user currently uses `/todo` for
quick single-task capture vs project-review sessions. The invocation log
(`scripts/reviews/dist/write-invocation.js`) would have this data, but it was
not read during this research. This matters because if 90% of invocations are
"check status on T16", the quick-capture friction is less critical than stage
visibility optimization.

**GAP-2:** Stage naming convention is not yet decided. The 7-stage pipeline
(IDEA → COMPLETE) was described in the spawn prompt but is not yet in any skill
file. The naming should align with existing `/brainstorm`, `/deep-plan`, and
`/deep-research` skill stage names to avoid vocabulary drift.

**GAP-3:** The `render-todos.js` output contract (REFERENCE.md: "Table columns
are stable: ID, Title, Priority, Status, Progress, Tags, Created") is declared
stable for hook parsing. Adding a stage badge inside `Progress` is backward-
compatible (column still named `Progress`). But changing to a separate `Stage`
column would break any hook parsing by column index. This constraint was not
fully assessed — hooks that parse `TODOS.md` would need auditing.

**GAP-4:** No research was conducted on how `/rnd` would interact with
`/deep-research`, `/brainstorm`, and `/deep-plan` skill invocations. If a
PROJECT item's stage is `RESEARCH`, should `/todo` (or `/rnd`) offer to invoke
`/deep-research`? This cross-skill integration pattern is unresolved.

**GAP-5:** The `/gsd:add-todo` interaction was noted as distinct from `/todo`
(SKILL.md "When NOT to Use" section) but not analyzed. If GSD-tracked projects
should also appear in the PROJECT pipeline view, the data model separation
becomes a concern.

---

## 7. Source List

| #   | URL / Path                                                                                                       | Title                                | Type               | Trust Tier     | CRAAP Score | Date       |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------ | -------------- | ----------- | ---------- |
| 1   | `.claude/skills/todo/SKILL.md`                                                                                   | /todo Skill Definition               | filesystem         | T1 HIGH        | 5/5         | 2026-03-31 |
| 2   | `.claude/skills/todo/REFERENCE.md`                                                                               | /todo Schema & Table Spec            | filesystem         | T1 HIGH        | 5/5         | 2026-03-31 |
| 3   | `.planning/todos.jsonl`                                                                                          | Live todo data (20 items)            | filesystem         | T1 HIGH        | 5/5         | 2026-04-04 |
| 4   | https://www.nngroup.com/articles/progressive-disclosure/                                                         | Progressive Disclosure — NN/G        | official-research  | T1 HIGH        | 4.8/5       | evergreen  |
| 5   | https://clig.dev/                                                                                                | Command Line Interface Guidelines    | official-community | T1 HIGH        | 4.7/5       | active     |
| 6   | https://www.brokenpip3.com/posts/2025-02-09-taskwarrior-practical-guide-1/                                       | Taskwarrior Practical Guide #1       | community-blog     | T3 MEDIUM      | 3.8/5       | 2025-02    |
| 7   | https://1klb.com/posts/2025/04/27/omnifocus_taskwarrior/                                                         | OmniFocus → Taskwarrior Migration    | community-blog     | T3 MEDIUM      | 3.7/5       | 2025-04    |
| 8   | https://medium.com/nyc-design/what-todoist-does-well-and-what-could-be-made-better-a-ui-ux-critique-94b18ce111b0 | Todoist UX Critique                  | community-blog     | T3 MEDIUM      | 3.5/5       | 2020       |
| 9   | https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz                                     | Todoist Quick Add                    | official-docs      | T1 HIGH        | 4.5/5       | current    |
| 10  | https://www.eleken.co/blog-posts/linear-app-case-study                                                           | Linear App Case Study                | community-analysis | T2 MEDIUM-HIGH | 4.0/5       | 2023       |
| 11  | https://www.atlassian.com/blog/it-teams/10-design-principles-for-delightful-clis                                 | 10 Design Principles for CLIs        | official-blog      | T2 MEDIUM-HIGH | 4.3/5       | 2022       |
| 12  | https://lucasfcosta.com/2022/06/01/ux-patterns-cli-tools.html                                                    | UX Patterns for CLI Tools            | community-blog     | T3 MEDIUM      | 4.0/5       | 2022       |
| 13  | https://culturedcode.com/things/guide/                                                                           | Getting Productive with Things 3     | official-docs      | T1 HIGH        | 4.5/5       | current    |
| 14  | https://inside.omnifocus.com/gtd-whitepaper                                                                      | OmniFocus GTD Whitepaper             | official-docs      | T1 HIGH        | 4.5/5       | current    |
| 15  | https://github.blog/changelog/2025-04-09-evolving-github-issues-and-projects/                                    | Evolving GitHub Issues and Projects  | official-changelog | T1 HIGH        | 4.8/5       | 2025-04    |
| 16  | https://news.ycombinator.com/item?id=35789781                                                                    | HN: Best Practices for CLI Design    | community-forum    | T3 MEDIUM      | 3.2/5       | 2023       |
| 17  | https://quire.io/blog/p/board.html                                                                               | Quire Kanban Board 2.0               | official-blog      | T2 MEDIUM      | 3.8/5       | 2022       |
| 18  | https://survicate.com/blog/user-friction/                                                                        | 2025 Guide to Minimize User Friction | commercial-blog    | T3 MEDIUM      | 3.5/5       | 2025       |

---

## Contradictions

**C1 — Unified vs. Separate command:** clig.dev recommends unified commands with
flags for same-domain items (HIGH trust). But the existing SoNash pattern of
`/todo` vs `/gsd:add-todo` vs `/add-debt` demonstrates successful separation by
conceptual domain (filesystem evidence, HIGH trust). These are not in direct
conflict — the resolution is: unified storage, optionally separated skill views
(Pattern D above).

**C2 — Auto-detect type vs. explicit selection:** Things 3 and OmniFocus both
use explicit promotion (user decides when something becomes a project).
Todoist's quick-add uses natural language inference to propose metadata. The
sources agree that auto-detection is advisory (never silent), which resolves the
tension.

**C3 — Todoist discoverability failure vs. Things 3 success:** Todoist
deliberately hides project features → discoverability failure reported. Things 3
deliberately separates tasks from projects → described as clean and elegant. The
difference: Things 3 makes the Area→Project→Task hierarchy _visible in
navigation_, while Todoist buries project management behind secondary menus. For
/todo: the header count "N projects · M tasks" (Recommendation R8) is the
minimum discoverability fix.

---

## Confidence Assessment

- HIGH claims: 6 (Findings 1, 2, 4, 5, 6, 9, 11)
- MEDIUM claims: 7 (Findings 3, 7, 8, 10, 13, 14 — and most Synthesis patterns)
- LOW claims: 1 (Finding 12 — auto-detection)
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH** — all findings are grounded in either
  filesystem evidence (ground truth) or 2+ independent sources. The one LOW
  confidence finding (auto-detection feasibility) is appropriately bounded and
  marked advisory.
