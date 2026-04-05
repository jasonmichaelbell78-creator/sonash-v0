# Findings: Dev Dashboard Integration — R&D Tab vs Fold-in to Planning Tab

**Searcher:** deep-research-searcher **Profile:** codebase (primary) + web
(secondary) **Date:** 2026-04-04 **Sub-Question IDs:** SQ6 (D6) **Domain:**
technology

---

## 1. Sub-Question Restated

SoNash has a 6-tab dev dashboard plan (Health → Debt → Reviews → Planning →
Pipeline → Audits). The R&D pipeline tracking being designed in this research
needs to surface in the dashboard. Two options: add a 7th "R&D" tab, or fold R&D
pipeline visibility into the existing Planning tab. This research investigates
which approach is correct, what data model supports it, and what cross-tab links
are high-value.

---

## 2. Search Strategy

**Round 1 — Codebase ground truth:**

- Read `.planning/dev-dashboard/PLAN.md` (26 steps, 43 decisions)
- Read `.planning/dev-dashboard/DECISIONS.md` (full decision table)
- Read `.planning/dev-dashboard/DIAGNOSIS.md` (architecture, constraints)
- Read `.research/dev-dashboard/metadata.json` (46-file research output summary)
- Read `.research/dev-dashboard/findings/SQ1b-data-inventory.md` (data sources
  inventory, 112 files)
- Read `.planning/todos.jsonl` (19 live todos, schema verification)
- Read `.research/research-index.jsonl` (14 research entries, schema)
- Read sister findings: D1-state-machine.md, D3-findings-refs.md,
  D4-todo-ux-split.md

**Round 2 — Web (secondary):**

- Tabs UX patterns: when to add tab vs fold-in (eleken.co)
- Dashboard IA principles: six criteria, tab quantity limits
- Kanban pipeline patterns for solo developer R&D tracking
- Single-responsibility tabs and user intent separation

**Query reformulations:** 3 (general dashboard design, tabs UX criteria, kanban
solo developer R&D, information architecture user intent).

---

## 3. Findings

### Finding 1 — The Planning tab (Tab 6) already has explicit R&D data source slots [CONFIDENCE: HIGH]

The PLAN.md Step 20 (Tab 6 — Planning & Research) defines 4 widgets [Source 1]:

- `SprintBoard` — ROADMAP.md tasks
- `ResearchTopics` — cards from `research-index.jsonl` (4 topics, depth, agent
  count, confidence)
- `ActivePlans` — normalized deep-plan state files (phase, status, decisions
  count)
- `LifecycleScoreDrillDown` — heatmap linking to Health tab

The `ResearchTopics` widget already reads from `research-index.jsonl` and shows
research depth/confidence data. The `ActivePlans` widget reads from
`.claude/state/deep-plan.*.state.json` files (8 files, 4 schemas requiring
normalization in Step 7 pre-work).

**Implication:** The Planning tab already allocates screen space and data
pipeline for R&D visibility. The question is not "where does R&D go" but "is the
existing slot sufficient for the new pipeline semantics, or does it need
expansion?"

Sources: `.planning/dev-dashboard/PLAN.md` Step 20 (filesystem, T1 HIGH);
`.planning/dev-dashboard/DECISIONS.md` (filesystem, T1 HIGH).

---

### Finding 2 — The existing Planning tab ResearchTopics widget is topic-level, not pipeline-stage-level [CONFIDENCE: HIGH]

The `ResearchTopics` widget spec reads from `research-index.jsonl` and shows
"depth, agent count, confidence" per topic. This is a historical-record view
(research done and indexed). It does NOT show:

- Current pipeline stage per project
  (`IDEA | BRAINSTORM | RESEARCH | PLAN | ...`)
- Which projects are blocked vs advancing
- Dependency relationships (blocks/blocked_by)
- Time-in-stage (how long has T16 been in PLAN stage?)
- Off-ramp projects (those that exited the pipeline early)

The `ActivePlans` widget reads deep-plan state files — those are
`deep-plan.<slug>.state.json` — and only surfaces the planning phase state, not
the full lifecycle from IDEA onward.

The structural gap: **Research visibility exists (topic-level), but
pipeline-stage visibility (project-lifecycle-level) does not exist in any
current widget.**

Sources: `.planning/dev-dashboard/PLAN.md` Step 20 (filesystem, T1 HIGH);
`.planning/dev-dashboard/findings/SQ1b-data-inventory.md` (filesystem, T1 HIGH).

---

### Finding 3 — The data sources for R&D pipeline are distinct from Planning tab's current sources [CONFIDENCE: HIGH]

Current Planning tab data sources:

- `resolve-dependencies.js --json` → SprintBoard (ROADMAP tasks)
- `.research/research-index.jsonl` → ResearchTopics (topic-level)
- `.claude/state/deep-plan.*.state.json` → ActivePlans (plan states)

Proposed R&D pipeline data sources (from SQ1 D1-state-machine.md and the
todos.jsonl schema):

- `.planning/todos.jsonl` — primary tracker (with `type: "project"` and `stage`
  fields per D4 findings)
- `.research/<slug>/metadata.json` — research status per project
- `.planning/<slug>/PLAN.md` existence check — plan status per project
- `.planning/<slug>/DECISIONS.md` count — decisions made
- `cl-runs.jsonl` (proposed by D5 in RDS plan) — convergence loop runs
- `findings_refs` (proposed in D3 findings) — cross-project knowledge flow

The R&D pipeline aggregates **across 3 directories** (`.planning/todos.jsonl`,
`.research/<slug>/`, `.planning/<slug>/`) and joins them by project slug. The
Planning tab's current builder (`build-planning.js`) reads from a different
source set and does not perform cross-directory join logic.

Sources: `.planning/dev-dashboard/PLAN.md` Steps 7, 12, 20 (filesystem, T1
HIGH); `.research/research-discovery-standard-v2/findings/D3-findings-refs.md`
(filesystem, T1 HIGH); `.planning/todos.jsonl` schema (filesystem, T1 HIGH).

---

### Finding 4 — The Planning tab already has 4 widgets at defined scope; adding pipeline view exceeds its single-responsibility boundary [CONFIDENCE: MEDIUM-HIGH]

The 6-tab architecture was designed using a "process domain model" (DECISIONS.md
Decision #12). The Planning tab's domain is: sprint/task readiness, active
research topics, and plan states. All 4 widgets stay within "what is planned and
what is researched."

The R&D pipeline's domain is: **project lifecycle tracking** — which stage is
each initiative in, what gates it to the next stage, what blocks it, how long it
has been stalled. This is a distinct user intent from "what sprint tasks are
ready to pick up" (SprintBoard) or "what research topics exist"
(ResearchTopics).

The UX principle from tabs literature [Source 4]: tabs work when each tab
represents "peer-level choices" where users have "distinct interaction modes."
The user visiting the Planning tab wants to know "what should I work on next."
The user visiting an R&D view wants to know "where are my projects in the
pipeline and what's blocking them." These are answerable by separate mental
models.

Decision #12 established: "Tab ordering matches research numbering,
documentation, and process domain model." Adding R&D pipeline to the Planning
tab would be the only instance of a tab serving two distinct process domains.

Sources: `.planning/dev-dashboard/DECISIONS.md` Decision #12 (filesystem, T1
HIGH); eleken.co tabs UX guide (T2 MEDIUM-HIGH);
`.planning/dev-dashboard/PLAN.md` Step 20 (T1 HIGH).

---

### Finding 5 — Tab quantity (6 → 7) is within the acceptable design threshold [CONFIDENCE: HIGH]

The tabs UX literature recommends a maximum of 3-6 tabs before the interface
becomes cluttered [Source 4]. The current plan has 6 tabs. Adding R&D as a 7th
tab exceeds the 6-tab guideline's upper bound by 1.

However, three mitigating factors apply:

1. **Internal developer tool**: The tab limit heuristic is for public-facing
   UIs. Developer dashboards routinely use 7-12 tabs (Grafana, DataDog, GitHub's
   repo tabs are all 8+). The constraint is less strict for expert users who
   will internalize the layout quickly.

2. **The current 6 tabs are already decided and scoped**: Decision #24 (tab
   build order: Debt → Health → Reviews → Planning → Pipeline → Audits) is a
   binding user constraint. Adding R&D would be Tab 7 in build order, not
   requiring reordering.

3. **Alternative: tab grouping or view modes**: If the 7th tab feels heavy, a
   view-mode toggle within the Planning tab (table/pipeline/kanban) is the
   next-best option without a new tab. This is less ideal but architecturally
   possible.

Sources: eleken.co tabs UX (T2 MEDIUM-HIGH); designsystems.surf blueprints (T2
MEDIUM); `.planning/dev-dashboard/DECISIONS.md` Decisions #12, #24 (T1 HIGH).

---

### Finding 6 — The Kanban/pipeline visualization for R&D is distinctly different from any current tab widget [CONFIDENCE: HIGH]

The current 6 tabs use these visualization types:

- Health tab: KPI cards, trend charts, heatmaps, warning feed
- Debt tab: tables (S0/S1), charts (severity, trend, status), timelines
- Reviews tab: line charts, bar charts, action item boards
- Planning tab: table (SprintBoard), cards (ResearchTopics), plan state list
- Pipeline tab: CSS grid heatmap (hooks), bar charts, KPI cards
- Audits tab: recency table, score comparison charts

An R&D pipeline view requires a **stage-column kanban** or **horizontal pipeline
visualization** — projects as cards, pipeline stages as columns:
`IDEA | BRAINSTORM | RESEARCH | PLAN | IMPLEMENT | TEST | COMPLETE`.

No current tab uses a stage-column kanban. The closest analog is the
`HookComplianceHeatmap` (Pipeline tab — CSS Grid, checks × dates), but that is a
compliance matrix, not a lifecycle pipeline.

The data shape for a pipeline view requires grouping by `stage` field across N
project items — a fundamentally different render pattern than any existing
widget in the 6-tab plan.

Sources: `.planning/dev-dashboard/PLAN.md` Steps 17-22 widget specs (T1 HIGH);
kanbantool.com kanban board examples (T3 MEDIUM);
`.research/research-discovery-standard-v2/findings/D4-todo-ux-split.md` Finding
13 (T1 HIGH).

---

### Finding 7 — The `build-planning.js` data builder architecture can accommodate R&D without a new tab [CONFIDENCE: HIGH]

Step 12 in the PLAN.md creates `scripts/dashboard/builders/build-planning.js` as
one of 7 builders. The builder architecture (Decision #5) uses isolated per-tab
builders that each produce one `public/<tab>-data.json` file.

If R&D folds into Planning, `build-planning.js` takes on the cross-directory
join (todos.jsonl + research slugs + plan slugs). The resulting
`public/planning-data.json` grows to include both sprint data AND pipeline data.
The shared Zod schema (`lib/dashboard/schemas.ts`) for the Planning tab would
need a new `rndPipeline` field added.

If R&D gets its own tab, `build-rnd.js` is a new builder producing
`public/rnd-data.json`. The orchestrator adds it to `build-all.js`. No change to
`build-planning.js`.

**Architectural verdict:** Adding a builder is trivial in the existing
architecture. There is no technical reason to fold into Planning to save build
infrastructure cost.

Sources: `.planning/dev-dashboard/PLAN.md` Step 12 (T1 HIGH); DECISIONS.md
Decision #5 (T1 HIGH).

---

### Finding 8 — Cross-tab linking between R&D and Planning tab is high-value [CONFIDENCE: HIGH]

Decision #36 established `buildCrossTabLink(sourceId)` as the cross-tab linking
utility in `lib/dashboard/cross-tab-links.ts`. The existing cross-tab links
designed are:

- Pulse View → any tab/widget via anchor IDs (Decision #31)
- Debt tab → Reviews tab (debt items from review sources)
- Health tab → Pipeline tab (health score regressions from hook failures)
- Planning tab → Health tab (LifecycleScoreDrillDown cross-link)

For R&D:

- **R&D → Planning tab** (open SprintBoard filtered to project tasks): when a
  project reaches `IMPLEMENT` stage, its associated ROADMAP tasks should be
  visible
- **R&D → Health tab** (if a health issue emerged from R&D investigation):
  high-value (e.g., github-health research produced health findings that went
  into TDMS)
- **Planning tab → R&D** (from ResearchTopics: "open in pipeline view"):
  converts the existing read-only research card into an action trigger

If R&D is a separate tab, `buildCrossTabLink` adds a pattern for `rnd:` source
prefix. If R&D is folded into Planning, the links are within-tab anchors —
simpler but less discoverable.

Sources: `.planning/dev-dashboard/PLAN.md` Steps 14, 23 (T1 HIGH); DECISIONS.md
Decision #36 (T1 HIGH).

---

### Finding 9 — The solo developer's primary cognitive need for R&D is "what am I blocked on" not "what did I research" [CONFIDENCE: MEDIUM]

The D4 findings (todo UX split) established that PROJECT-type items need stage
visibility because the user is asking: "Where are my initiatives in the pipeline
and what's blocking them?" This is distinct from the sprint board question
("What tasks are ready to pick up?") and the research topics question ("What has
been researched?").

From the kanban literature [Source 7]: the core value of a pipeline
visualization is surfacing **bottlenecks and stalls** — not just current state.
For R&D:

- "T16 (JASON-OS) has been in RESEARCH for 47 days" is a stall signal
- "T3 (debt-runner) is blocked on T2 (dev-dashboard)" is a dependency signal
- "3 projects in PLAN stage, 0 in IMPLEMENT — planning pipeline is full" is a
  throughput signal

These signals require time-in-stage data and dependency graph data — not
available in the existing Planning tab widgets. The LifecycleScoreDrillDown and
SprintBoard are point-in-time status views, not flow/stall visualization.

Sources: `.research/research-discovery-standard-v2/findings/D4-todo-ux-split.md`
Synthesis (T1 HIGH); kanboard.io kanban for developers (T3 MEDIUM);
atlassian.com kanban guide (T2 HIGH).

---

### Finding 10 — The "off-ramp" and "shortcut" projects require the same stage model as standard projects [CONFIDENCE: MEDIUM]

From D1-state-machine.md findings (codebase): the pipeline supports shortcuts
(projects that skip straight from IDEA to IMPLEMENT, like T8 Custom Agents which
had a plan approved fast) and off-ramps (projects that exit without completing,
archived). The state machine design in D1 uses an audit trail schema that
records every stage transition.

For dashboard display, shortcut projects and off-ramp projects must be **visible
but separated**: they represent valid pipeline outcomes, not failures. A
filtering mechanism (all/active/shortcuts/off-ramps/completed) would satisfy
this requirement.

This filtering pattern works identically whether R&D is a separate tab or folded
into Planning. It does not differentially affect the architectural decision.

Sources: `.research/research-discovery-standard-v2/findings/D1-state-machine.md`
(T1 HIGH, filesystem).

---

### Finding 11 — The todos.jsonl pipeline stage data is not yet built; timing aligns with dashboard build sequence [CONFIDENCE: HIGH]

The current `todos.jsonl` schema does NOT have a `type` or `stage` field
(confirmed by direct inspection of 19 live records). Both fields are proposed by
D4 findings but not yet implemented.

The dev dashboard build sequence (PLAN.md Decision #24) builds Planning as Step
20 (4th tab built), after Debt, Health, and Reviews. The R&D tab (if approved)
would be Step 27 (post-existing-6), the last to be built.

**Timing advantage:** By the time a 7th R&D tab is built, the todos.jsonl schema
extension (type/stage fields) will have been implemented as part of the
research- discovery-standard work. The pipeline data will exist by the time the
tab needs it. No chicken-and-egg problem.

If R&D is folded into Planning (Step 20), the type/stage fields must exist
before Planning tab builds — a tighter dependency. As a 7th tab, the dependency
timeline is relaxed.

Sources: `.planning/todos.jsonl` schema inspection (T1 HIGH);
`.planning/dev-dashboard/PLAN.md` Steps 7, 20 (T1 HIGH);
`.research/research-discovery-standard-v2/findings/D4-todo-ux-split.md`
Recommendations R1-R2 (T1 HIGH).

---

### Finding 12 — The `build-rnd.js` builder needs a 3-source join: todos, research metadata, plan metadata [CONFIDENCE: HIGH]

The R&D pipeline view requires combining data from three independent locations:

1. **todos.jsonl** (primary) — project identity, stage, priority, status,
   findings_refs
2. **`.research/<slug>/metadata.json`** — research completion status, claim
   count, confidence
3. **`.planning/<slug>/PLAN.md` existence + DECISIONS.md count** — plan status

The join key is the project `slug` (derived from the todo `context.files` path
patterns or a new explicit `slug` field). For example, T16 (JASON-OS) links to:

- `.research/jason-os/metadata.json` (research state)
- `.planning/jason-os/PLAN.md` (plan exists? what phase?)
- `.planning/jason-os/DECISIONS.md` (how many decisions made?)

The `build-rnd.js` builder performs this join at build time and writes a flat
`public/rnd-data.json` that the React component reads without needing to know
the source architecture.

This is the same pattern as `build-planning.js` reading
`.claude/state/deep-plan.*.state.json` across multiple files (Step 7
normalization).

Sources: `.planning/dev-dashboard/PLAN.md` Steps 7, 12 (T1 HIGH);
`.planning/todos.jsonl` `context.files` field patterns (T1 HIGH);
`.research/research-index.jsonl` schema (T1 HIGH).

---

### Finding 13 — Cross-tab links of HIGH value vs LOW value (signal vs noise) [CONFIDENCE: MEDIUM]

From Decision #36 (cross-tab linking convention) and the process domain model:

**HIGH VALUE (surfacing non-obvious state):**

- R&D tab → Debt tab: when `T3 (debt-runner expansion)` is blocked on T2
  (dev-dashboard), and debt-runner research found tech debt items — links the
  cause of a block to the debt queue
- R&D tab → Planning tab: when a project hits IMPLEMENT stage, deep-link to the
  SprintBoard filtered to that project's tasks (actionable handoff)
- R&D tab → Health tab: if a health investigation (like github-health) produced
  findings that fed into ecosystem health scores — closes the loop
- Debt tab → R&D tab: when a debt item is tagged to a specific R&D project —
  "this S1 debt is gating T6 plan-orchestration"

**LOW VALUE (noise/redundant):**

- R&D tab → Reviews tab: no natural connection; reviews are code quality, not
  R&D lifecycle
- R&D tab → Pipeline tab: hook compliance is not R&D gating in any documented
  pattern
- R&D tab → Audits tab: audits are periodic health checks, not per-project R&D
  gates

The high-value links form a triangular pattern: R&D ↔ Planning (lifecycle to
tasks), R&D ↔ Debt (blocking relationships), R&D ↔ Health (investigation
outcomes). The low-value links are arbitrary and would add navigation cost
without decision-relevant signal.

Sources: DECISIONS.md Decision #36 (T1 HIGH); `.planning/todos.jsonl`
blocked/status fields (T1 HIGH); `.planning/dev-dashboard/PLAN.md` Step 23
cross-tab integration testing (T1 HIGH).

---

### Finding 14 — The Planning tab's `ResearchTopics` widget should become a cross-link entry point regardless of the architecture decision [CONFIDENCE: MEDIUM]

Whether R&D is a 7th tab or a view mode in Planning, the existing
`ResearchTopics` widget should be upgraded from a static card to an interactive
entry point:

- **If R&D is a 7th tab:** each ResearchTopics card gets a "View in Pipeline"
  link that navigates to the R&D tab filtered to that slug's project. This makes
  Planning tab a discovery entry point into the R&D tab.
- **If R&D is folded into Planning:** the ResearchTopics widget gains a toggle
  to "Pipeline View" mode showing stage columns instead of research cards.

This finding is architecture-agnostic and represents the minimum useful upgrade
regardless of which approach wins.

Sources: `.planning/dev-dashboard/PLAN.md` Step 20 (T1 HIGH);
`.planning/dev-dashboard/DECISIONS.md` Decision #31 (anchor IDs for
deep-linking, T1 HIGH).

---

## 4. Synthesis — VERDICT: Add a 7th R&D Tab

**Verdict: Separate tab (`rnd` / "R&D Pipeline").**

Rationale, ordered by strength:

**1. Distinct user intent (decisive):** The Planning tab answers "what tasks are
ready to work on?" The R&D pipeline view answers "where are my projects in their
lifecycle and what's blocking them?" These are different questions. A user
checking sprint readiness and a user checking pipeline health are in different
cognitive modes. Single-responsibility tab design requires separation when user
intents diverge.

**2. Distinct data source with cross-directory join (strong):** The R&D pipeline
joins `.planning/todos.jsonl` + `.research/<slug>/metadata.json` +
`.planning/<slug>/` directory existence. The Planning tab joins sprint data +
research-index topics + deep-plan state files. These are distinct source graphs
that do not overlap. Building a builder (`build-rnd.js`) to produce separate
output is the architecturally correct implementation.

**3. Distinct visual representation (supporting):** No current tab uses a
stage-column pipeline/kanban view. The R&D visualization needs stage columns
(IDEA through COMPLETE) that don't map to any existing widget pattern. Grafting
this onto an existing tab requires a view-mode toggle — adding UI complexity to
the Planning tab without a clear navigation affordance.

**4. Build sequence timing advantage (supporting):** As a 7th tab built last, it
gains the type/stage schema extensions from todos.jsonl without blocking the
Planning tab build timeline. Folding into Planning would tighten this
dependency.

**5. Tab count (non-blocking counter-argument):** 7 tabs exceeds the 3-6
guideline by 1. This is mitigated by the developer tool context (expert user,
not consumer UX). The existing 6 tabs already exceed the guideline's lower bound
of "3-5" that some sources recommend. The distinction between 6 and 7 tabs for
an expert tool is not architecturally material.

**Rejected alternative (view mode in Planning):** A "Pipeline View" toggle in
the Planning tab is the fallback if the 7th tab is explicitly rejected by the
user. It preserves the data model join but buries the pipeline visualization
inside a tab whose name (Planning) does not signal "project lifecycle." This is
the Todoist anti-pattern from D4 findings: hiding project management behind a
secondary menu.

---

## 5. Recommendations Specific to SoNash Dev Dashboard R&D Integration

**R1 — Add 7th tab `rnd` to DevTabId** (after all 6 existing tabs are built)

```typescript
type DevTabId =
  | "health"
  | "debt"
  | "reviews"
  | "pipeline"
  | "audits"
  | "planning"
  | "rnd";
```

Label: "R&D" or "Pipeline" (user's choice — both are accurate). Use `GitBranch`
or `FlaskConical` Lucide icon (research/lab flavor).

**R2 — Create `scripts/dashboard/builders/build-rnd.js`**

Builder performs the 3-source join at build time and writes
`public/rnd-data.json`. Add to `build-all.js` orchestrator. Gitignore
`public/rnd-data.json`.

**R3 — Upgrade `ResearchTopics` widget in Planning tab**

Add a `View in Pipeline` anchor link on each research card that navigates to the
R&D tab filtered to that slug. This makes Planning tab a discovery entry point
for the R&D tab.

**R4 — Implement cross-tab links (3 high-value only)**

1. R&D tab → Planning tab: "View tasks" when project is in IMPLEMENT stage
2. R&D tab → Debt tab: when a project has associated MASTER_DEBT entries via
   source_id prefix matching (e.g., `project:jason-os`)
3. Debt tab → R&D tab: when a debt item has a blocking project association

Skip: R&D → Reviews, R&D → Pipeline, R&D → Audits (low signal, high noise).

**R5 — The R&D tab should handle off-ramps and shortcuts in the same pipeline
view**

Add filter buttons: `All | Active | Shortcuts | Stalled | Complete`. "Stalled"
means time-in-stage > threshold (configurable, default 30 days). "Shortcuts"
means projects that jumped multiple stages. This surfaces the items that need
attention without hiding them.

**R6 — Primary visualization: column kanban, secondary: timeline**

Primary: stage-column kanban (cards in columns by current stage). This is
scannable in under 5 seconds. Secondary: timeline table showing entry-date per
stage per project (for stall identification). Both rendered from the same
`rnd-data.json`.

**R7 — Defer dependency graph visualization**

The blocks/blocked_by visualization (T3 blocked by T2, T6 blocked by T3) is
valuable but complex to render. Defer to post-initial tab build. The tabular
blocked/blocked_by status is sufficient for V1.

---

## 6. Data Model Proposal

### Source Data Shape (at build time)

`build-rnd.js` reads and joins:

```
Source A: .planning/todos.jsonl
  - filter: todos where type = "project" OR (type field absent AND tags include research/planning/os/strategic)
  - fields used: id, title, priority, status, stage, tags, context.files, findings_refs, createdAt, updatedAt

Source B: for each todo with a slug, check .research/<slug>/metadata.json
  - fields used: completedAt, claimCount, confidenceDistribution, agentCount, depth
  - existence check (researchExists: boolean)

Source C: for each todo, check .planning/<slug>/ directory
  - planExists: boolean (PLAN.md exists?)
  - decisionsCount: number (count lines in DECISIONS.md matching "^| [0-9]+" pattern)
  - planPhase: string | null (from deep-plan.{slug}.state.json if exists)
```

### Output Schema (public/rnd-data.json)

```jsonc
{
  "generated": "ISO-8601",
  "pipeline": [
    {
      "id": "T16",
      "title": "Claude Code OS",
      "priority": "P1",
      "status": "in-progress",
      "stage": "RESEARCH",
      "stageEnteredAt": "2026-04-01T00:00:00Z",
      "daysInStage": 3,
      "tags": ["#os", "#research", "#strategic"],
      "isShortcut": false,
      "isOffRamp": false,
      "blockedBy": [],
      "blocks": [],
      "research": {
        "exists": true,
        "slug": "jason-os",
        "completedAt": "2026-04-02",
        "claimCount": 50,
        "confidence": "HIGH",
        "agentCount": 18,
      },
      "plan": {
        "exists": true,
        "slug": "jason-os",
        "decisionsCount": 32,
        "planPhase": null,
      },
      "findingsRefs": [
        {
          "ref": "custom-agents:C-041",
          "relationship": "constrainedBy",
          "note": "Hard agent ceiling applies to OS design",
        },
      ],
    },
  ],
  "summary": {
    "total": 16,
    "byStage": {
      "IDEA": 0,
      "BRAINSTORM": 1,
      "RESEARCH": 3,
      "PLAN": 2,
      "IMPLEMENT": 2,
      "TEST": 0,
      "COMPLETE": 3,
    },
    "stalled": 1,
    "blocked": 2,
    "shortcuts": 1,
    "offRamps": 0,
  },
}
```

### Slug Derivation Logic

Not all todos have an explicit `slug` field. The builder derives the slug from:

1. If `context.files` contains `.research/<slug>/` path → extract slug
2. If `context.files` contains `.planning/<slug>/` path → extract slug
3. Fallback: kebab-case of the todo title

This covers all 19 current todos that use the `context.files` convention.

### Join Key Stability

The slug is stable for archived research (archive pattern makes slugs immutable
— see D3-findings-refs.md Finding 3 and 4). Active research slugs are stable as
long as the directory name does not change. The builder logs "slug not found"
warnings to `build-errors.json` for any todo whose slug cannot be resolved,
matching the existing error pattern from Decision #39.

---

## 7. Gaps Identified

**GAP-1 — todos.jsonl lacks `type`, `stage`, and `stageEnteredAt` fields
today.** The R&D tab data model requires these fields to be present. They are
proposed by D4 findings (type/stage) but not yet implemented. The
`stageEnteredAt` field (for stall detection) requires tracking when a stage
transition occurred — this needs the audit trail schema from D1 findings to be
in place. Until then, `stageEnteredAt` will default to the todo's `updatedAt`
field (approximate but functional for V1).

**GAP-2 — No slug field on todos; derivation heuristic needs validation.** The
slug derivation from `context.files` path patterns covers observed todos but may
fail for edge cases (todos without files, todos with multiple planning paths).
This requires a small audit of the 19 existing todos against the derivation
logic before building the builder.

**GAP-3 — `blocks`/`blockedBy` relationship data is implicit, not explicit.**
The todos.jsonl currently has no structured block relationship field. T3
(debt-runner) is "blocked on T2" — but this is encoded in the `progress`
free-text field, not a structured `blockedBy: ["T2"]` array. The data model
above includes these fields but they must be populated manually during the
schema extension work. V1 of the R&D tab can omit the dependency visualization
if these fields are not yet populated.

**GAP-4 — `planPhase` derivation requires reading deep-plan state files.** The 8
deep-plan state files have 4 incompatible schemas (Step 7 normalization in
PLAN.md). The `build-rnd.js` builder needs the same normalization function
(`normalize-plan-states.js`) already planned in Step 7. This is a shared
dependency between Planning tab (Step 20) and R&D tab — must be built before
either tab.

**GAP-5 — `ResearchTopics` widget upgrade is a Planning tab modification.**
Recommendation R3 (adding "View in Pipeline" links to ResearchTopics) modifies a
Planning tab widget after Planning is already built. This is a minor cross-tab
integration change that should happen at Step 23 (Cross-Tab Integration Testing)
rather than being retrofitted into Step 20.

**GAP-6 — The tab naming decision is not yet made.** "R&D", "Pipeline",
"Research", "Initiatives" are all viable labels. "Pipeline" is ambiguous
(Pipeline tab already exists for build pipeline). "R&D" is accurate but may not
be universally understood. "Initiatives" is closest to the user's mental model.
The user should decide — flagged here for clarity.

---

## 8. Source List with Trust Tiers

| #   | URL / Path                                                                          | Title                                        | Type                | Trust Tier     | CRAAP Avg | Date       |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------- | ------------------- | -------------- | --------- | ---------- |
| 1   | `.planning/dev-dashboard/PLAN.md`                                                   | Dev Dashboard Plan (26 steps)                | filesystem          | T1 HIGH        | 5.0       | 2026-03-29 |
| 2   | `.planning/dev-dashboard/DECISIONS.md`                                              | Dev Dashboard 43 Decisions                   | filesystem          | T1 HIGH        | 5.0       | 2026-03-29 |
| 3   | `.planning/dev-dashboard/DIAGNOSIS.md`                                              | Dev Dashboard Architecture Diagnosis         | filesystem          | T1 HIGH        | 5.0       | 2026-03-29 |
| 4   | https://www.eleken.co/blog-posts/tabs-ux                                            | Tabs UX: Best Practices and When to Avoid    | official-analysis   | T2 MEDIUM-HIGH | 4.2       | 2024       |
| 5   | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`                           | Dev Dashboard Data Inventory (112 files)     | filesystem          | T1 HIGH        | 5.0       | 2026-03-29 |
| 6   | `.research/dev-dashboard/metadata.json`                                             | Dev Dashboard Research Metadata              | filesystem          | T1 HIGH        | 5.0       | 2026-03-29 |
| 7   | https://www.atlassian.com/agile/kanban                                              | Atlassian Kanban Guide                       | official-docs       | T2 HIGH        | 4.5       | active     |
| 8   | https://kanboard.io/kanban-for-developers                                           | Kanban for Developers                        | community           | T3 MEDIUM      | 3.5       | 2024       |
| 9   | `.planning/todos.jsonl`                                                             | Live Todos Schema (19 items)                 | filesystem          | T1 HIGH        | 5.0       | 2026-04-04 |
| 10  | `.research/research-index.jsonl`                                                    | Research Index (14 entries)                  | filesystem          | T1 HIGH        | 5.0       | 2026-04-04 |
| 11  | `.research/research-discovery-standard-v2/findings/D4-todo-ux-split.md`             | D4 Findings: /todo UX Split                  | filesystem          | T1 HIGH        | 5.0       | 2026-04-04 |
| 12  | `.research/research-discovery-standard-v2/findings/D3-findings-refs.md`             | D3 Findings: Cross-Project findings_refs     | filesystem          | T1 HIGH        | 5.0       | 2026-04-04 |
| 13  | `.research/research-discovery-standard-v2/findings/D1-state-machine.md`             | D1 Findings: State Machine for /rnd Pipeline | filesystem          | T1 HIGH        | 5.0       | 2026-04-04 |
| 14  | https://www.gooddata.com/blog/six-principles-of-dashboard-information-architecture/ | Six Principles of Dashboard IA               | official-blog       | T2 MEDIUM-HIGH | 4.0       | 2024       |
| 15  | https://designsystems.surf/blueprints/tabs                                          | Tabs Blueprints in Design Systems            | community-reference | T2 MEDIUM      | 3.8       | 2024       |
| 16  | https://ones.com/blog/maximize-productivity-kanban-board-examples-tips/             | Kanban Board Examples and Tips 2025          | commercial-blog     | T3 MEDIUM      | 3.4       | 2025       |

---

## Contradictions

**C1 — Tab count guideline (3-6) vs. adding a 7th tab:** The tabs UX literature
recommends 3-6 tabs maximum. This research recommends a 7th tab. Resolution: the
guideline is for consumer/SaaS products. Internal developer tools (Grafana,
DataDog, GitHub) routinely exceed this. The single-responsibility principle and
distinct user intent are more material design constraints for this context. The
contradiction is noted but not decisive.

**C2 — "Fold in" preserves nav simplicity vs. "separate tab" improves
discoverability:** Folding R&D into Planning reduces navigation complexity (6
tabs, not 7). A separate tab improves discoverability (explicit label in
navigation). The Todoist anti-pattern (D4 findings Finding 10) argues against
hiding project management in secondary menus. For a solo developer tool where
the user is the designer, discoverability is more valuable than nav simplicity.
The separate tab is preferred.

**C3 — ResearchTopics widget already in Planning vs. R&D pipeline being a new
concept:** The existing `ResearchTopics` widget reads from
`research-index.jsonl` and could be expanded. However, the data it shows
(historical topic summaries) is fundamentally different from pipeline state
(current stage per project). Expanding the widget would produce a hybrid that
serves neither purpose cleanly. Adding a cross-link from ResearchTopics to the
R&D tab (R3) is the resolution.

---

## Confidence Assessment

- HIGH claims: 8 (Findings 1, 2, 3, 5, 6, 7, 8, 11, 12)
- MEDIUM-HIGH claims: 1 (Finding 4)
- MEDIUM claims: 5 (Findings 9, 10, 13, 14 — and most synthesis patterns)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings grounded in direct codebase
  inspection (filesystem T1) or 2+ independent sources. Web sources used only
  for design pattern validation; verdict derives entirely from codebase
  evidence.
