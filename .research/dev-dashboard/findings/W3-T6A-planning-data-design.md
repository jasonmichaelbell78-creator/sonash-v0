# Findings: Planning & Research Tab — Data Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** W3-T6A

---

## 1. Data Schema Analysis

### 1.1 research-index.jsonl [CONFIDENCE: HIGH]

4 entries. Every entry is a flat JSON object on a single line. Exact field set:

```
topicSlug       string   — URL-safe slug, matches directory name under .research/
topic           string   — Human-readable title
depth           string   — "L1" | "L2" | "L3" | "L4"
domain          string   — "technology" | "codebase" | "academic" | "web"
completedAt     ISO 8601 — finish timestamp
claimCount      number   — total verified claims
sourceCount     number   — distinct sources consulted
confidenceDistribution  object  — { HIGH, MEDIUM, LOW, UNVERIFIED }
keywords        string[] — 8-10 tags
outputPath      string   — e.g. ".research/hook-if-conditions/"
status          string   — "complete" (only observed value)
```

No schema version field. No `startedAt` field (cannot derive duration from index
alone). All 4 records are `status: complete`; no in-progress research topics
appear here.

**Example record (hook-if-conditions):**

```json
{
  "topicSlug": "hook-if-conditions",
  "claimCount": 45,
  "sourceCount": 35,
  "confidenceDistribution": {
    "HIGH": 34,
    "MEDIUM": 11,
    "LOW": 0,
    "UNVERIFIED": 0
  },
  "depth": "L1",
  "completedAt": "2026-03-29T12:30:00Z"
}
```

### 1.2 deep-research state files [CONFIDENCE: HIGH]

4 files: `deep-research.hook-if-conditions.state.json`,
`deep-research.repo-cleanup.state.json`,
`deep-research.debt-runner-expansion.state.json`,
`deep-research.research-discovery-standard.state.json`.

Schemas are NOT uniform — they evolved across research sessions. Observed fields
by file:

**hook-if-conditions (in-flight schema):**

```
topicSlug, topic, depth, domain, phase ("1"),
subQuestions string[], agentCount, completedAgents [], failedAgents [],
startedAt, lastUpdated
```

**repo-cleanup (completed schema):**

```
topic, slug, phase ("presentation"), depth, domain,
started_at, waves_completed, agents_used, findings_files,
challenge_files, synthesis_complete, challenges_complete, resynthesized,
outputs { report, claims, sources, metadata, contrarian, otb },
post_challenge { claims_changed_pct, resynthesis_triggered, grade_change,
  overturned, weakened, new_findings, new_categories }
```

**debt-runner-expansion (mid-wave schema):**

```
task, topic, status, depth, sub_questions, agents_total, agents_completed,
version, prior_version, waves { wave_1..wave_4, synthesis, verification,
challenges, post_challenge } — each wave has { status, agents[] },
qa_decisions {}, updated
```

**research-discovery-standard (phase 1 schema):**

```
topic, slug, depth, phase, sub_questions, total_agents, waves_total,
wave_current, agents_completed, agents_failed, decisions {}, created_at,
updated_at
```

**Key gap:** No single canonical schema. The `research-index.jsonl` is the
reliable normalized view; state files are execution tracking artifacts with
heterogeneous shapes. The dashboard should read `research-index.jsonl` as
primary and only parse state files for progress-enrichment on in-flight topics.

### 1.3 deep-plan state files [CONFIDENCE: HIGH]

8 files. Even more schema heterogeneity than deep-research files. Four broad
shapes observed:

**Shape A — minimal (hook-if-implementation, 0-complete):**

```json
{
  "topic": "...",
  "phase": "0-complete",
  "batch": 0,
  "decisions": [],
  "timestamp": "..."
}
```

**Shape B — decision-record with decisions array (repo-cleanup,
memory-system-audit, custom-statusline, ecosystem-expansion):**

```
task, topic / topic_slug, status / current_phase, current_batch,
decisions [ { id, question/decision, choice, rationale } ],
total_decisions, pendingDecisions, artifacts { diagnosis, decisions, plan },
updated / started_at
```

Decision counts: 15 (repo-cleanup), 18 (memory-system-audit), 16
(custom-statusline), 33 (ecosystem-expansion).

**Shape C — massive execution record (sws-reeval):**

Everything in Shape B plus: context sub-object with existing_sws_decisions,
child_plans map, direction_decisions_locked[], t3_research{}, v3_rebuild_plan{},
v3_rebuild{}, files{}, resume_instructions, self_audit{},
critical_understanding{}.

**Shape D — legacy minimal (review-lifecycle, hook-overhaul):**

```
topic, phase ("complete" / "approved"), timestamp,
decisions (integer count), steps_completed, root_causes_fixed[],
artifacts { diagnosis, decisions, plan }, resumeInstructions
```

**Key normalization needed:** To populate the plans panel, the static export
script must extract at minimum: `topic`, `phase`, `decisions` count,
`artifacts.plan` path, and `updated/timestamp`. These fields exist in all Shape
B/C/D files but under different key names.

---

## 2. ROADMAP.md Parsing Strategy [CONFIDENCE: HIGH]

`scripts/tasks/resolve-dependencies.js` already implements a complete ROADMAP
parser. It is battle-tested and runs cleanly. The `--json` flag outputs a
machine-readable object with all information the sprint board needs.

### 2.1 JSON output shape (verified by live run)

```json
{
  "ready": [
    {
      "id": "B3",
      "title": "Lighthouse CI Integration (2hr)",
      "completed": false,
      "depends": ["B1", "B2"],
      "track": "B",
      "line": 413,
      "metDeps": ["B1", "B2"],
      "unmetDeps": []
    }
  ],
  "blocked": ["/* same shape, unmetDeps non-empty */"],
  "completed": ["/* same shape, completed: true */"],
  "orphanDeps": ["/* { task, missingDep } pairs */"],
  "circles": ["/* arrays of IDs forming cycles */"]
}
```

Current live counts (2026-03-29): **ready: 81, blocked: 12, completed: 10,
orphanDeps: 0, circles: 0**.

### 2.2 Track extraction

Track is derived from the `### Track X` section header immediately preceding the
task. The parser sets `track` field on every task. Tracks present: B, D, E, O,
P, S, T (and DEBT/CANON items that fall under their section's track letter).

### 2.3 Parsing limitations

- Task IDs with `DEBT-XXXX` or `CANON-XXXX` format parsed correctly.
- Multi-line `[depends: ...]` annotations supported (lookahead up to 4 lines).
- The title for B11 is currently mangled: it ends with `[depends:` because the
  annotation on the next line is not being consumed. The task shows as
  `unmetDeps: []` (no blocking), but the title field is garbled. Impact: low —
  the title needs post-processing cleanup (strip trailing `[depends:`).
- Effort annotations like `(2hr)` are embedded in `title` strings, not a
  separate field. The static export script should extract them via regex.

### 2.4 Recommended parsing strategy for the dashboard

Do NOT re-implement the ROADMAP parser. Invoke
`node scripts/tasks/resolve-dependencies.js --json` at export time via
`child_process.spawnSync` (not `exec`) and consume stdout directly. This gives
all 5 arrays, tracks, dependency metadata, and status in one call.

---

## 3. Sprint Board Gap Analysis [CONFIDENCE: HIGH]

`resolve-dependencies.js --json` is **already working**. There is no gap for
basic sprint board functionality.

| Feature                         | Status      | Notes                                              |
| ------------------------------- | ----------- | -------------------------------------------------- |
| Task list with ID, title, track | Ready       | `--json` output                                    |
| Completed/ready/blocked status  | Ready       | Three arrays in output                             |
| Dependency arrows (unmetDeps)   | Ready       | `unmetDeps[]` field                                |
| Effort estimates                | Partial     | Embedded in title string — regex extraction needed |
| Priority labels (S0/S1/S2)      | Partial     | Embedded in title as `[E1] - S1` — regex needed    |
| Track grouping                  | Ready       | `track` field present                              |
| Circular dep detection          | Ready       | `circles[]` field                                  |
| Effort total hours per track    | Not present | Would need aggregation from title parsing          |

**Effort to enable `--json` for dashboard:** Zero — it already works. The only
work is writing the static export wrapper that calls it and stores the output.

**Effort for enriched fields (effort, priority):** ~30 min — add regex
extraction in the export script to parse `(Xhr)` and `[E1] - Sn` patterns from
titles, add as `effort` and `severity` fields.

---

## 4. Visualization Specifications

### 4.1 Research Topics — Card Layout

One card per `research-index.jsonl` entry.

**Card fields:**

- Header: `topic` (full title)
- Badge row: `depth` pill (L1/L2/L3/L4), `domain` pill, `status` dot
- Stats row: `claimCount` claims / `sourceCount` sources
- Confidence bar: 4-segment proportional bar (HIGH=green, MEDIUM=yellow,
  LOW=orange, UNVERIFIED=gray) using `confidenceDistribution` values
- Footer: `completedAt` date, `keywords[0..3]` tag chips, link to `outputPath`
- In-flight enrichment (optional, from state file): `wave_current / waves_total`
  progress bar, `agents_completed / agentCount` counter

**Confidence bar rendering:** total = sum of all four buckets. Each segment
width = (bucket_value / total) \* 100%. For hook-if-conditions the bar is 75.5%
green / 24.4% yellow / 0% orange / 0% gray.

**Sort options:** By `completedAt` desc, by `claimCount` desc, by `depth`.

### 4.2 Active Plans — Table Layout

Source: all `.claude/state/deep-plan.*.state.json` and `deep-plan-*.state.json`
files.

**Recommended: table with expandable rows**, not Kanban (too much state
heterogeneity for columns to be meaningful across all plans).

| Column         | Source                                                       | Notes                                                      |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Plan Name      | `topic` or `task` field                                      | Normalize from both keys                                   |
| Phase          | `phase` or `current_phase` field                             | String: "0-complete", "approved", "executing", "discovery" |
| Decision Count | `decisions.length` or `total_decisions` or `decisions` (int) | All three patterns present                                 |
| Artifacts      | Does `artifacts.plan` exist?                                 | Boolean: plan doc written                                  |
| Last Updated   | `updated` or `timestamp` or `started_at`                     | Date, normalize from all three                             |
| Status         | Derived from `phase`                                         | Map to: Planning / Executing / Approved / Complete         |

**Phase to Status mapping:**

```
"0-complete", "discovery", "decision-record" → Planning
"executing", "phase_4_approved"              → Executing
"approved", "COMPLETE_v3_convergence_loop_done" → Approved
"complete"                                   → Complete
```

**Expandable row reveals:** `decisions[]` list (first 5 decisions with
choice+rationale), artifact links (DIAGNOSIS.md, DECISIONS.md, PLAN.md).

### 4.3 Sprint Board — Three-Column Kanban

Source: `resolve-dependencies.js --json` output.

**Columns:** Done | Ready | Blocked

**Card fields:**

- ID badge (B3, DEBT-0076, etc.)
- Title (clean — strip `[depends: ...]` trailing artifacts)
- Track badge (color-coded by track letter)
- Effort chip — extracted from `(Xhr)` in title
- Severity chip — extracted from `[E1] - Sn` in title
- For Blocked: red "waiting: X, Y" dependency list using `unmetDeps`
- For Ready: green check indicators for `metDeps`

**Dependency arrows:** Between cards in Ready and Blocked columns. Use SVG
overlay or CSS data attributes. The 12 blocked tasks each have at most 2 unmet
deps — no complex graph rendering needed.

**Track filter bar:** Buttons for B / D / E / O / P / S / T. Default: show all.

**Summary row:** "10 done · 81 ready · 12 blocked" — derived from array lengths.

### 4.4 Lifecycle Scores — Heatmap

Source: `.claude/state/lifecycle-scores.jsonl` (20 entries, all dated
2026-03-13).

**Schema (every record):**

```
id          string    — "ls-001" .. "ls-020"
date        ISO date  — "2026-03-13" (all same date currently)
system      string    — Human name ("Pattern Rules", "Review Learnings")
category    string    — kebab-case slug
files       string[]  — source files for this system
capture     1-3       — dimension score
storage     1-3       — dimension score
recall      1-3       — dimension score
action      0-2       — dimension score
total       5-10      — sum of four dimensions
gap         string    — gap description
remediation string|null
wave_fixed  string|null
```

Score range: total 5-10. Max possible per dimension: capture 3, storage 3,
recall 3, action 3 = max 12. Current max observed: 10.

**Heatmap layout:**

- Rows: 20 systems (category label on left)
- Columns: 5 columns — capture, storage, recall, action, total
- Cell color: map score to grade:
  - Dimension score 3 or total 9-10 → A → deep green
  - Dimension score 2 or total 7-8 → B → light green
  - Dimension score 1 or total 5-6 → C → yellow
  - Dimension score 0 → D/F → red
- Cell content: numeric score
- Hover tooltip: `gap` and `remediation` text

**Sort options:** By `total` asc (worst-first, default for actionability), by
`category` alpha.

**Summary stats row:** avg total, count with total < 7 (needs attention), count
with action = 0 (most critical gap).

Current distribution: 3 entries have total <= 6 (ls-017 Planning Data, ls-018
Audit Findings, ls-019 Aggregation Data). 2 entries have action = 0 (ls-013
Agent Tracking, ls-019 Aggregation Data).

---

## 5. Static Export Plan

### 5.1 Output file: `public/planning-data.json`

```json
{
  "generatedAt": "ISO 8601",
  "research": {
    "topics": ["/* research-index.jsonl entries as array */"],
    "inFlightProgress": {
      "slug": { "wave_current": 2, "waves_total": 5, "phase": "1-research" }
    }
  },
  "plans": {
    "items": [
      {
        "topic": "string",
        "phase": "string",
        "phaseStatus": "Planning|Executing|Approved|Complete",
        "decisionCount": 0,
        "hasArtifacts": true,
        "lastUpdated": "ISO 8601",
        "artifacts": {
          "diagnosis": "path",
          "decisions": "path",
          "plan": "path"
        }
      }
    ]
  },
  "sprint": {
    "ready": ["/* resolve-dependencies --json ready array */"],
    "blocked": ["/* blocked array */"],
    "completed": ["/* completed array */"],
    "orphanDeps": [],
    "circles": [],
    "enriched": [
      "/* merged array with effort and severity extracted from titles */"
    ]
  },
  "lifecycle": {
    "scores": ["/* lifecycle-scores.jsonl entries as array */"],
    "summary": {
      "avgTotal": 7.8,
      "belowThreshold": 3,
      "actionZero": 2
    }
  }
}
```

### 5.2 Export script responsibilities

File: `scripts/tasks/generate-planning-data.js` (new)

1. Read `.research/research-index.jsonl` — parse JSONL lines — populate
   `research.topics`
2. For each topic, check if a corresponding
   `.claude/state/deep-research.<slug>.state.json` exists — extract wave
   progress — populate `research.inFlightProgress`
3. Glob `.claude/state/deep-plan*.state.json` — normalize schema variants
   (handle `topic`/`task`/`topic_slug`, `decisions` as int vs array,
   `updated`/`timestamp`/`started_at`) — populate `plans.items`
4. Invoke `node scripts/tasks/resolve-dependencies.js --json` via
   `child_process.spawnSync` — parse stdout — populate `sprint` fields
5. Post-process each sprint task to extract effort `(Xhr)` and severity
   `[E1] - Sn` from title — add as `effort` and `severity` fields on enriched
   array
6. Read `.claude/state/lifecycle-scores.jsonl` — parse JSONL lines — compute
   summary stats — populate `lifecycle`
7. Write `public/planning-data.json`

**Run trigger:** Same as other tab data scripts —
`npm run generate:planning-data` — hooked into the dev dashboard build process.

---

## 6. Data Gaps — Blocked vs Ready

### Ready now (no missing data)

| Feature                            | Data Source                    | Notes                                        |
| ---------------------------------- | ------------------------------ | -------------------------------------------- |
| Research topic cards               | research-index.jsonl           | All 4 complete entries present               |
| Research confidence bars           | confidenceDistribution field   | All 4 records populated                      |
| Sprint board (3 columns)           | resolve-dependencies.js --json | Already working                              |
| Sprint dependency arrows           | unmetDeps field                | Already present in output                    |
| Lifecycle heatmap (all 20 rows)    | lifecycle-scores.jsonl         | All 20 records                               |
| Lifecycle gap/remediation tooltips | gap and remediation fields     | All records populated                        |
| Plan table (topic, phase, count)   | deep-plan state files          | Schema normalization needed but data present |

### Partially blocked (data exists, needs enrichment)

| Feature                     | Gap                                    | Effort                               |
| --------------------------- | -------------------------------------- | ------------------------------------ |
| Sprint effort chips         | Embedded in title string `(2hr)`       | Regex extraction: ~30 min            |
| Sprint severity badges      | Embedded in title as `[E1] - S1`       | Regex extraction: ~30 min            |
| Plan last-updated date      | Three different key names across files | Normalization logic: ~1 hr           |
| Research in-flight progress | In state files but not in index        | Join logic in export script: ~30 min |

### Blocked on missing data

| Feature                      | What is Missing                                              | How to Unblock                                                            |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Research duration            | research-index.jsonl has no `startedAt`                      | Add when research completes, or derive from state file `startedAt` fields |
| Plan step-level progress     | State files track batch/phase not individual step completion | Would need PLAN.md parsing or explicit step tracking added to state files |
| Research in-progress entries | research-index.jsonl only has `complete` entries             | Export script must read state files for in-flight topics separately       |
| Per-plan git branch          | Not tracked in any state file                                | Would require git log lookup or branch naming convention                  |
| Track effort totals (hours)  | Effort in title strings, not aggregated                      | Regex extraction plus sum per track: ~1 hr                                |

### Not feasible without schema change

| Feature                             | Reason                                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| Research confidence trend over time | Only one snapshot per topic — no history                          |
| Lifecycle score change over time    | All 20 records share the same date (2026-03-13) — single snapshot |

---

## 7. Component Breakdown

### 7.1 Page component

`app/dev/planning/page.tsx` (new) — fetches `public/planning-data.json` at build
time or via SWR. Renders four sub-sections with scroll anchors.

### 7.2 ResearchTopicsPanel

`components/dev/planning/ResearchTopicsPanel.tsx`

Props: `topics: ResearchTopic[]`,
`inFlightProgress: Record<string, InFlightProgress>` Child: `ResearchTopicCard`
(one per topic). State: sort order selector.

### 7.3 ResearchTopicCard

`components/dev/planning/ResearchTopicCard.tsx`

Renders confidence bar using CSS grid with 4 colored segments. Chip row for
depth/domain/status. If slug has an in-flight progress entry: shows wave
progress bar.

### 7.4 ActivePlansTable

`components/dev/planning/ActivePlansTable.tsx`

Props: `plans: PlanItem[]`. Sortable columns: phase, decision count, last
updated. Expandable rows via `<details>` or headless UI Disclosure. Child:
`PlanDecisionList` (renders first 5 decisions inline).

### 7.5 SprintBoard

`components/dev/planning/SprintBoard.tsx`

Props: `sprint: SprintData` (ready/blocked/completed arrays plus enriched).
Three-column flex layout. Track filter bar (button group, toggleable). Child:
`SprintTaskCard`.

### 7.6 SprintTaskCard

`components/dev/planning/SprintTaskCard.tsx`

Displays ID badge, clean title, track badge, effort chip, severity chip. Blocked
variant: red unmetDeps list. Ready variant: green metDeps check list.

### 7.7 LifecycleHeatmap

`components/dev/planning/LifecycleHeatmap.tsx`

Props: `scores: LifecycleScore[]`, `summary: LifecycleSummary`. Renders 20x5
grid with color-coded cells. Hover tooltip shows gap and remediation text. Sort
toggle: by total (default) or by category alpha. Summary bar at top: avg,
below-threshold count, action-zero count.

### 7.8 Type definitions

`types/planning.ts` (new):

```typescript
interface ResearchTopic {
  topicSlug: string;
  topic: string;
  depth: "L1" | "L2" | "L3" | "L4";
  domain: string;
  completedAt: string;
  claimCount: number;
  sourceCount: number;
  confidenceDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    UNVERIFIED: number;
  };
  keywords: string[];
  outputPath: string;
  status: string;
}

interface PlanItem {
  topic: string;
  phase: string;
  phaseStatus: "Planning" | "Executing" | "Approved" | "Complete";
  decisionCount: number;
  hasArtifacts: boolean;
  lastUpdated: string;
  artifacts: {
    diagnosis?: string;
    decisions?: string;
    plan?: string;
  };
}

interface SprintTask {
  id: string;
  title: string;
  completed: boolean;
  depends: string[];
  track: string;
  line: number;
  metDeps: string[];
  unmetDeps: string[];
  effort?: string; // extracted e.g. "2hr"
  severity?: string; // extracted e.g. "S0" | "S1" | "S2"
}

interface SprintData {
  ready: SprintTask[];
  blocked: SprintTask[];
  completed: SprintTask[];
  orphanDeps: Array<{ task: string; missingDep: string }>;
  circles: string[][];
  enriched: SprintTask[];
}

interface LifecycleScore {
  id: string;
  date: string;
  system: string;
  category: string;
  files: string[];
  capture: number;
  storage: number;
  recall: number;
  action: number;
  total: number;
  gap: string;
  remediation: string | null;
  wave_fixed: string | null;
}

interface LifecycleSummary {
  avgTotal: number;
  belowThreshold: number;
  actionZero: number;
}
```

---

## Sources

| #   | Source                                                    | Title                             | Type         | Trust | CRAAP | Date       |
| --- | --------------------------------------------------------- | --------------------------------- | ------------ | ----- | ----- | ---------- |
| 1   | `.research/research-index.jsonl`                          | Research index (4 entries)        | Ground truth | HIGH  | 5/5   | 2026-03    |
| 2   | `.claude/state/deep-research.*.state.json` (4 files)      | Deep-research state files         | Ground truth | HIGH  | 5/5   | 2026-03    |
| 3   | `.claude/state/deep-plan*.state.json` (8 files)           | Deep-plan state files             | Ground truth | HIGH  | 5/5   | 2026-03    |
| 4   | `scripts/tasks/resolve-dependencies.js`                   | Dependency resolver (full source) | Ground truth | HIGH  | 5/5   | 2026-03    |
| 5   | `scripts/tasks/resolve-dependencies.js --json` (live run) | Live JSON output                  | Ground truth | HIGH  | 5/5   | 2026-03-29 |
| 6   | `.claude/state/lifecycle-scores.jsonl` (20 entries)       | Lifecycle scores                  | Ground truth | HIGH  | 5/5   | 2026-03-13 |
| 7   | `.planning/hook-if-implementation/PLAN.md`                | Plan artifact structure example   | Ground truth | HIGH  | 5/5   | 2026-03-29 |
| 8   | `.planning/custom-statusline/PLAN.md`                     | Plan artifact structure example   | Ground truth | HIGH  | 5/5   | 2026-03-24 |
| 9   | `ROADMAP.md` (Active Sprint section, lines 284-570)       | Roadmap source                    | Ground truth | HIGH  | 5/5   | 2026-03-19 |

---

## Contradictions

**research-index.jsonl vs deep-research state files on in-flight topics:** The
index only records `complete` entries. The state files for
`debt-runner-expansion` and `research-discovery-standard` show status as
`phase1-in-progress` and `1-research` respectively — but neither has a
corresponding entry in `research-index.jsonl`. These topics are genuinely
in-flight and invisible to the index. The dashboard must read state files
directly to surface in-progress research.

**deep-plan state file schema fragmentation:** The 8 plan state files use at
least 4 different schema shapes. Fields that represent the same concept have
different key names: `topic` vs `task` vs `topic_slug`, `updated` vs `timestamp`
vs `started_at`, `decisions` as array vs integer. No schema version field
exists. Normalization code must handle all variants defensively.

**Lifecycle score dates:** All 20 lifecycle-scores.jsonl entries share the same
date (`2026-03-13`). This is a single point-in-time audit, not a history. The
heatmap will accurately represent current scores but there is no trend data.

---

## Gaps

1. **No `startedAt` in research-index.jsonl** — cannot compute research duration
   without cross-referencing state files.
2. **Plan step-level progress not tracked** — state files track batch/phase, not
   individual step completion. Cannot show "Step 3 of 16" without parsing
   PLAN.md.
3. **No plan-to-research linkage field** — some plans reference a research slug
   (e.g. `custom-statusline.state.json` has `artifacts.research`) but this is
   not consistent. Cannot reliably auto-link plan cards to their research
   topics.
4. **No plan status normalization** — the `phase` strings vary widely
   (`"0-complete"`, `"approved"`, `"phase_4_approved"`,
   `"COMPLETE_v3_convergence_loop_done"`, `"executing"`, `"discovery"`,
   `"decision-record"`, `"presentation"`). A mapping table is required in the
   export script.
5. **Sprint task title parsing artifact** — B11's title ends with `[depends:`
   due to multi-line annotation handling in the parser. Needs cleanup regex in
   the export script.

---

## Serendipity

**resolve-dependencies.js already works end-to-end.** The sprint board is the
most complex visualization but requires the least new code. The `--json` flag
already produces everything needed. The only marginal work is 30 minutes of
regex extraction for effort and severity fields.

**Lifecycle action=0 is the highest-value signal.** Two of 20 systems score 0 on
the action dimension — meaning learnings are captured and stored but never
enforced. These are ls-013 (Agent Tracking) and ls-019 (Aggregation Data). The
heatmap sorted by total ascending will immediately surface these as the reddest
cells. This is exactly the kind of signal the dashboard exists to surface.

**In-flight research is invisible in the index.** Two active research topics
(`debt-runner-expansion` and `research-discovery-standard`) exist only in state
files, not in `research-index.jsonl`. If the dashboard reads only the index, it
shows a false picture of research activity. The export script must join index
plus state files.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived directly from reading actual filesystem files with live
command execution to verify script behavior.
