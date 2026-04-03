# Out-of-the-Box Review: Dev Dashboard Command Center

**Reviewer role:** OTB (creative opportunities, missed angles) **Date:**
2026-03-29 **Based on:** RESEARCH_OUTPUT.md, GAP-1-coverage-audit.md,
SQ6c-process-gaps.md, CHECKPOINT-tab-decisions.md, W3-T1A/T2A/T3A/T4A/T5A/T6A
findings

---

## Framing

The 35-agent research produced a thorough, reliable, evidence-backed plan. What
it produced less of: unconventional UX ideas, integrations with existing project
capabilities, and thinking about the dashboard as a living tool rather than a
read-only data browser. This review covers eight creative angles and assesses
each honestly.

---

## Idea 1: The Pulse View — A Pre-Tab Health Number

### Concept

Before any tab is visible, the dashboard landing renders a single prominent
display: two overlapping numbers (Technical: D/67, Workflow: B/87), a composite
"Pulse" derived from averaging both, and a color-coded indicator that shifts
from red through amber to green. This is the answer to "is today a good day to
code, or do I need to deal with debt and warnings first?" in under two seconds.
The pulse is not a new score — it is a calculated synthesis of the two existing
health scores, displayed before tabs load.

The composite formula is simple: `pulse = (technicalScore + workflowScore) / 2`
with thresholds: below 55 = red (stop and address), 55-75 = amber (proceed
carefully), above 75 = green (clear to ship). The dual-score breakdown (D/67 vs
B/87) is always shown underneath so the composite never hides the constituent
signals.

### Data sources needed

- `ecosystem-health-log.jsonl` — Technical Health (already Tab 1 primary source)
- `health-score-log.jsonl` — Workflow Health (already Tab 1 secondary source)
- No new data sources. No new data collection.

### Effort estimate

3-5 hours. This is a UI arrangement decision, not a data engineering problem.
The Tab 1 data fetch already retrieves both scores. The pulse view is a layout
choice: render the two KPI cards above the tab strip instead of inside Tab 1.
The composite calculation is 4 lines of arithmetic.

### Value/effort ratio

HIGH. The current design buries the health grade inside Tab 1 behind a tab
click. The pulse view answers the most important daily question at page load —
before the developer picks a tab. It costs almost nothing to implement because
Tab 1 already fetches this data.

### When to build

Phase 1. This is a layout change to the outer `dev-dashboard.tsx` shell, not a
tab component. It can be wired before any tab is built, using the health data
fetch as the sole dependency. It also doubles as the loading indicator while
tabs initialize: the pulse displays as soon as the health data arrives, even if
other tab data is still loading.

### Specific implementation note

The pulse display lives in the `DevTabProvider` context wrapper, not inside any
tab. It uses the same `useDashboardData("health")` hook that Tab 1 uses. The
two-number format "T: D/67 | W: B/87" reads clearly at a glance without
requiring color-blindness-accessible color alone — grades are always shown in
text alongside the color.

---

## Idea 2: ntfy.sh Threshold Alerts — Passive Monitoring Bridge

### Concept

The dashboard is a pull tool: you open it to check status. ntfy.sh is a push
tool: it sends notifications to your phone/desktop when thresholds are crossed.
The dashboard build script (`scripts/build-dashboard-data.js`) already runs at
`prebuild` time. Adding a threshold-check step to this script — or as a separate
`scripts/dashboard/check-thresholds.js` that runs at session-end — would push
ntfy alerts when conditions like "S0 debt count increased", "health grade
dropped a letter", or "3+ hook failures in the last 5 runs" are detected.

The dashboard UI would show a "Notifications Sent" counter in the Tab 4 pipeline
section: "Last 7 days: 3 alerts sent" with timestamps and what triggered each.
This makes the push behavior visible from the pull interface.

### Data sources needed

New: `.claude/state/ntfy-alert-log.jsonl` (written by the threshold script)

```json
{
  "timestamp": "ISO 8601",
  "trigger": "s0-count-increased",
  "value": 12,
  "threshold": 11,
  "ntfy_topic": "sonash-dev",
  "sent": true
}
```

Existing sources for threshold evaluation:

- `docs/technical-debt/metrics.json` — S0/S1 counts (already Tab 2 source)
- `data/ecosystem-v2/ecosystem-health-log.jsonl` — grade (already Tab 1 source)
- `.claude/state/hook-runs.jsonl` — recent failure rate (already Tab 4 source)

### Effort estimate

6-10 hours total:

- Threshold script: 3-4 hours (read data, evaluate thresholds, POST to ntfy)
- Wire into session-end or build hook: 1 hour
- Dashboard UI widget: 2-4 hours (notification history table in Tab 4)

### Value/effort ratio

MEDIUM. The dashboard already shows health data. ntfy fills the gap SQ6c
identified as "Blind Spot 10" — the developer has no signal when the commit
tracker stops producing live records, when S0 count grows between sessions, or
when the health grade drops while not looking at the dashboard. The push layer
makes the pull tool's blind spots into active alerts.

The tradeoff: ntfy.sh requires the developer to have a personal ntfy topic set
up (free, takes 5 minutes), and the threshold script needs environment
configuration. The research found zero existing ntfy.sh integration in the
codebase — this is net-new infrastructure, not a thin wrapper.

### When to build

Phase 2. The pull dashboard must exist first so thresholds are visually verified
before being pushed. Building alerting before the baseline display would create
confusion about what is being alerted on.

### Specific risk

The ntfy topic/endpoint needs an environment variable (e.g., `NTFY_TOPIC`). This
must be documented in `.env.example` and in the session-start checklist or the
feature silently does nothing when the variable is absent. The threshold script
must fail gracefully (log to console, not crash the build) when ntfy is
unconfigured.

---

## Idea 3: AI "What Changed Since Last Session" Summaries

### Concept

DD8 scoped the `/deep-plan` to include both CLI and web dashboard work. The
RESEARCH_OUTPUT mentions pre-generated static JSON at build time as the
production fetch strategy. The question is: what if
`scripts/build-dashboard-data.js` called the Claude API to generate a
one-paragraph natural-language summary of changes since the last build, attached
to each tab's static JSON payload?

Format:
`{ "aiSummary": "Since Session #243, the debt pipeline added 3 new S0 items (net +2 from resolutions). Hook compliance has been 100% for 8 straight commits. Two new learning routes were added to the review learning queue." }`

This summary lives in each tab's `public/<tab>-data.json` and is displayed at
the top of each tab as a collapsible "AI Digest" card. Users can dismiss it
permanently or toggle it off globally.

### Data sources needed

- Same sources as the regular build script (no new files)
- A diff between the current build's data and a cached previous-build snapshot
  stored at `public/<tab>-data.previous.json` (written by the build script on
  each run)
- Claude API call at build time (not at page load — static generation)

### Cost estimate

The build script would send 6 summaries (one per tab) per build. Each summary
prompt contains ~500-1500 tokens of structured data diff. Estimated input: ~6KB
per tab, or ~36KB total per build. At Sonnet 4.5 pricing (~$3/M input tokens),
one full build costs approximately $0.10-0.15 in API calls. Daily builds cost
roughly $0.70-1.05/week. This is negligible for a developer tool.

The catch: this adds latency to `npm run build`. If each API call takes 3-5
seconds and they run sequentially, the build adds 18-30 seconds. Running them in
parallel (Promise.all) reduces this to ~5 seconds of additional build time.

### Effort estimate

8-14 hours:

- Diff extraction logic per tab: 3-4 hours (compare current vs previous build)
- Claude API integration in build script: 2-3 hours
- UI: collapsible summary card component: 2-4 hours
- Previous-build snapshot management: 1-2 hours

### Value/effort ratio

MEDIUM. The summaries are most useful in the first 30 seconds of a session — the
moment the developer opens the dashboard to orient themselves. However, the
research established that the primary audience is a solo developer who already
knows the project deeply. Natural-language summaries of data the developer
generated are less valuable for an expert than for a stakeholder unfamiliar with
the data. The value is real but not dramatically higher than well-labeled delta
badges on each KPI card (which are planned in the existing design and cost
zero).

The richer opportunity: restrict AI summaries to one tab — Tab 2 (Debt Pipeline)
— where the data is genuinely complex enough to benefit from natural-language
interpretation. "You have 11 open S0 items. Three were added in the last 7 days,
all from the same `pattern-compliance` check. None have been scheduled for
resolution." This is more actionable than a summary of health grades the
developer already understands from the grade letters.

### When to build

Phase 3 or later. This is an enhancement to an already-functional dashboard.
Build it after the 6 tabs are working and the developer has lived with the
dashboard for a few sessions to understand where the interpretation burden is
highest. Never build this before the data display itself — it would be
summarizing data that cannot yet be independently verified.

### Specific risk

The build script must not fail if the Claude API is unavailable or rate-limited.
All AI summaries must be optional — tabs must render fully without them. A
`ENABLE_AI_SUMMARIES=true` environment variable should gate the feature so
builds work in CI or offline contexts without API calls.

---

## Idea 4: Ctrl+K Command Palette — cmdk Integration

### Concept

`cmdk` is already installed at v1.1.1 but is not used anywhere in the codebase.
The dev dashboard has six tabs of dense data with clipboard-copy CLI commands on
every tab. A Ctrl+K command palette would let the developer:

1. Search across all tab data by keyword (e.g., "cognitive-cc" returns the hook
   failure row from Tab 4 and the process gap from SQ6c)
2. Navigate directly to any tab ("debt" jumps to Tab 2)
3. Copy any CLI command to clipboard without navigating to its tab ("copy
   /debt-runner verify" from anywhere)
4. Jump to any S0 debt item by keyword search across MASTER_DEBT
5. Open any deep-plan state file in the browser tab directly

The command palette replaces the need to remember which tab contains which
information. For a 6-tab dashboard, this is a material reduction in cognitive
load when looking for something specific.

### Data sources needed

No new data sources. The palette searches across data already loaded by the tab
data hooks. The search index is built client-side at mount time from each tab's
loaded JSON. MiniSearch (already planned for installation as a dashboard
dependency) handles the in-memory index.

### Effort estimate

10-16 hours:

- `CommandDialog` wrapper using `cmdk` primitives: 2-3 hours (cmdk docs are
  excellent; shadcn has a `command` component pattern)
- Global keyboard shortcut wiring (Ctrl+K): 1 hour
- Search index construction from tab data: 3-4 hours (define indexable fields
  per tab — debt item titles, check IDs, agent names, CLI commands)
- Result rendering with tab-jump + clipboard actions: 2-4 hours
- Keyboard navigation between results: included in cmdk

### Value/effort ratio

HIGH. cmdk is already installed — the zero-install-cost bar is crossed. The
palette directly addresses the navigation problem that grows as the dashboard
matures: six tabs means six places to look. The CLI command clipboard feature
alone (type "debt-runner", hit Enter, command is copied) is worth the palette
for daily workflow. MiniSearch is already planned for the debt tab S1 browser,
so the indexing infrastructure is being built anyway.

The palette is especially valuable for the 8,472-record MASTER_DEBT browser.
Rather than paginating to find a specific debt item by ID or keyword, the
developer types in Ctrl+K and the item surfaces immediately.

### When to build

Phase 2. The palette needs at least two tabs of data to be useful. Build it
after Tab 2 (Debt Pipeline) and Tab 4 (Build Pipeline) are functional — these
have the densest CLI command sets and the most individually-searchable records.
A Phase 1 stub that only navigates between tabs by name is a valid minimal
version.

### Specific implementation note

Use the shadcn `command` component pattern (built on cmdk) rather than using
cmdk directly. The shadcn pattern adds appropriate dark-theme styling that
matches the dashboard vocabulary (`bg-gray-800`, `border-gray-700`) with no
custom CSS needed. The `CommandDialog` with `open` state controlled by
`useEffect` + `addEventListener("keydown")` is the standard pattern.

---

## Idea 5: Persistent Session Timeline Strip

### Concept

Instead of a timeline tab or a timeline widget inside Tab 4, add a persistent
horizontal strip at the very bottom of the dashboard (below the tab content
area, above the browser chrome). The strip shows the last 30 sessions as tick
marks on a horizontal line, with commits appearing as smaller ticks between
session boundaries.

Hovering any session tick shows a mini-tooltip: "Session #241 — 2026-03-25 — 3
commits, 12 hook runs, 1 PR closed". Clicking a session tick highlights all tab
data from that session (dims everything outside the session's time range) —
effectively a "what was happening during this session" filter mode across all 6
tabs.

The strip draws data from `session-activity.jsonl` (135 records, confirmed
existing — entirely missed by the 35-agent research, surfaced in GAP-1) and
`commit-log.jsonl` for commit markers.

### Data sources needed

- `.claude/session-activity.jsonl` (135 records, at `.claude/` root — NOT in
  `.claude/state/`) — session start events with timestamps and outcomes. This
  file was completely missed by the 35-agent research (confirmed in GAP-1,
  Section 4A).
- `.claude/state/commit-log.jsonl` — for commit tick timestamps (date range only
  — the seeded data has correct timestamps even without live branch data)
- Optionally: `.claude/state/hook-runs.jsonl` — for per-session hook run counts
  in tooltips

No new data capture needed. The `session-activity.jsonl` file already has 135
records spanning from 2026-03-06 to 2026-03-29, capturing session start events
in the format `{timestamp, user, outcome, event, source}`.

### Effort estimate

12-18 hours:

- Timeline strip component (SVG or CSS): 4-6 hours
- Session boundary detection from `session-activity.jsonl`: 2 hours (group
  commit-log entries by nearest session-start timestamp)
- Tooltip rendering: 2-3 hours
- "Session filter mode" — cross-tab time-range filtering: 4-6 hours (this is the
  hard part; requires tab data hooks to accept an optional time range filter
  context)
- Production build: include session data in the relevant static JSON files

### Value/effort ratio

MEDIUM. The timeline is visually compelling and addresses the "what happened in
Session #244" question that SQ6c identified as structurally difficult to answer
from the existing JSONL data. However, the cross-tab filter mode (the
highest-value part) is the most complex feature on this entire list. It requires
thread-safe state management across all 6 tab data hooks.

The timeline-without-filter is LOW effort (6-8 hours for display only) and
MEDIUM value. The timeline-with-filter is HIGH value but HIGH effort. These
should be treated as two separate decisions.

The session cross-reference problem (7 JSONL files, each with a different
session ID format) documented in SQ6c Serendipity section means the "filter all
tabs by session" feature would only work for tabs whose data includes timestamps
(all of them do). The session-to-data matching would be done by time range, not
by session ID join — workable but imprecise if two sessions overlap in a single
calendar day.

### When to build

Display-only version: Phase 2 (after Tab 4 is built, since Tab 4 already
processes the same temporal data). Cross-tab filter mode: Phase 3 or later.

### Specific implementation note

`session-activity.jsonl` lives at `.claude/` root, not `.claude/state/`. The
build script must explicitly include it in the pipeline data export
(`public/pipeline-data.json` or a new `public/session-timeline.json`). GAP-1
confirmed this file was not in any tab's export plan — it needs to be explicitly
added to `scripts/build-dashboard-data.js`.

---

## Idea 6: Diff Mode — Session-to-Session Comparison

### Concept

A "Diff Mode" toggle in the dashboard header lets the developer compare two
session snapshots: "Show me what changed between Session #240 and today." When
activated, every metric on every tab renders as a before/after pair:
`S0 items: 9 → 11 (+2)`, `Hook pass rate: 91% → 94% (+3%)`,
`Fix rate: 67% → 71% (+4%)`. KPI cards that improved are highlighted green;
those that regressed are highlighted red.

This is distinct from the trend charts already planned. Trend charts show
continuous history over all data points. Diff mode gives a discrete answer to
"are things better or worse than a specific point in time?" — which is the right
question after a sprint, a major PR, or a refactor.

### Data sources needed

The data already exists: every primary source file has timestamps. The
`metrics-log.jsonl` (114 entries), `hook-runs.jsonl`, `review-metrics.jsonl`,
`ecosystem-health-log.jsonl`, and `retros.jsonl` all have timestamped records
that can be sliced to a point-in-time snapshot.

The challenge: the static export (`public/*.json`) currently only includes
summary data or the full time series. A diff mode needs two-point snapshots: the
"current" state and a "comparison point" state. The comparison point could be:

- A fixed date (e.g., "30 days ago")
- The date of a specific session (from `session-activity.jsonl`)
- A hardcoded anchor (e.g., "start of current sprint" from ROADMAP.md)

### Effort estimate

16-24 hours:

- Session picker UI (dropdown of session dates): 2-3 hours
- Snapshot computation at build time (for static export): 4-6 hours (the build
  script must compute snapshots at N configurable time points)
- Diff rendering layer (before/after on every metric): 6-8 hours (requires that
  every metric component accepts a `comparison` prop alongside `current`)
- Color coding and delta display: 2-3 hours

### Value/effort ratio

MEDIUM. This is a high-value feature for a developer who uses the dashboard over
weeks — the "are we making progress?" question is essential for solo development
where external sprint reviews don't exist. The effort is significant because it
requires retrofitting a `comparison` prop into every KPI component, which must
be designed in from the start to be cheap.

The key architectural insight: if the tab components are built with a
`baseline?: TabData` prop alongside `current: TabData` from the beginning, diff
mode costs ~2 hours of conditional rendering logic per tab. If they are not
built this way, retrofit cost is 3-4x higher. This is a design decision, not a
Phase 3 feature.

### When to build

Design the comparison prop interface in Phase 1 (foundation). Implement the UI
toggle and snapshot generation in Phase 3. The incremental cost of designing the
interface early is near-zero; the retrofit cost of skipping it is high.

### Specific recommendation

Do not implement a "pick any two sessions" UI. Start with a simpler fixed
comparison: "current vs. 30 days ago" computed at build time as
`previousSnapshot` in each static JSON file. This delivers 80% of the value at
30% of the effort. The session-picker UI is a Phase 4 enhancement.

---

## Idea 7: Dashboard Anti-Patterns to Avoid

This is not an idea to build. It is a list of specific failure modes this
dashboard should actively defend against, derived from the research findings.

### Anti-Pattern 1: The Seeded Data Mirage [CRITICAL]

`commit-log.jsonl` has 634 records, all `seeded: true`, `filesChanged: 0`. The
commit timeline in Tab 4 will render 634 data points that look like real commit
activity but are historical seeds with no live tracker enrichment. A developer
unfamiliar with the seeding issue will read the timeline as real.

**Defense:** Every widget that uses seeded data must display a prominent inline
warning: "Note: commit timeline shows historical records. Live commit tracking
has not yet produced data." This warning must be hardcoded in the component, not
a runtime check — the build script must flag when seeded-only records dominate
the dataset.

### Anti-Pattern 2: The Velocity Void [HIGH]

`velocity-log.jsonl` is broken (`items_completed: 0` for Sessions #148-#243).
The research plan calls for showing "Data Unavailable" in the velocity widget.
This is correct. The anti-pattern is showing "0" or "no sprints" instead of
"unavailable" — those look like the developer shipped nothing, not like the data
collection is broken.

**Defense:** Every broken data source must render with a distinct "data pipeline
issue — not actual project state" visual treatment. A grayed-out card with a
wrench icon and the specific script to fix it (`track-session.js`) is more
useful than a red empty state.

### Anti-Pattern 3: Alert Fatigue from SonarCloud Null [HIGH]

SonarCloud appears as `null` in virtually every `health-score-log.jsonl` entry.
If the Process Health scorecard renders the SonarCloud category as a missing/
red entry alongside real categories, the developer either ignores it (wallpaper)
or investigates it every session (wasted time). Neither outcome is acceptable.

**Defense:** Categories with a null rate above 80% across the last 10 entries
should be hidden from the default view and surfaced only in an "unavailable data
sources" panel. Show what works; quarantine what does not.

### Anti-Pattern 4: The Archive Double-Count Trap [CRITICAL]

GAP-1 confirmed three files with non-standard extensions (`.archive`, `.bak`) in
`.claude/state/` that contain real JSONL data. A naive `*.jsonl` glob in the
build script would include them, double-counting review records and hook warning
records.

**Defense:** All file reads in `scripts/build-dashboard-data.js` must use
explicit file paths, not glob patterns. Never read `*.jsonl` from any directory
— always list exact filenames. Add an integration test that counts records in
each static JSON output and asserts they match expected counts from single-file
reads.

### Anti-Pattern 5: Vanity Metric — "Total Commits" [MEDIUM]

634 seeded commits + whatever the live tracker adds will be prominently visible.
The total looks impressive but most commits are seeds from a batch import. "634
commits" conveys false productivity signal.

**Defense:** Display commit counts only from the live-tracker window (records
where `seeded !== true`). Show "Live tracked: 0 commits (since [date])" next to
the total. When live tracking begins to work, this resets to a honest baseline.

### Anti-Pattern 6: Misleading Health Trend with Dual Systems [HIGH]

The D/67 (Technical) and B/87 (Workflow) health scores use different measurement
systems. Plotting both on the same trend chart would suggest the project has
both a "D" and a "B" health score simultaneously, which is confusing without
context.

**Defense:** Never combine Technical Health and Workflow Health on the same
chart axis. Always label each distinctly. Never compute an average and display
it as "overall health" without showing both components — the composite pulse
view (Idea 1) is acceptable because it explicitly shows both underlying scores.

---

## Idea 8: Progressive Disclosure — Tab 0 First, Tabs Unlock

### Concept

Instead of building all 6 tabs simultaneously, what if the dashboard launched as
a single "Tab 0: STATUS" view — essentially the Pulse (Idea 1) expanded:
Technical Health card, Workflow Health card, active warnings count, S0 debt item
count, last hook run status. Five KPIs. No charts. No deep data.

Then, as the developer uses the system and data accumulates, tabs appear: "Tab
2: Debt Pipeline is now available (data freshness: 3 days)." "Tab 3: Code Review
Quality has unlocked (5 PRs completed)."

The reveal is driven by data richness thresholds, not calendar time or manual
configuration. A tab does not appear until its primary data source has enough
records to be meaningful.

### Data sources needed

Same sources as the full 6-tab plan. The "unlock" logic is a simple gate on
record counts and data freshness:

- Tab 2 unlocks when `metrics-log.jsonl` has 5+ entries (already has 114)
- Tab 3 unlocks when `reviews.jsonl` has 3+ records (already has 23)
- Tab 4 unlocks when `hook-runs.jsonl` has 10+ records (already has 120)
- All existing thresholds are already met — all 6 tabs would unlock on day 1

### Honest assessment

This idea does not apply to the current project state. Every threshold is
already exceeded. The progressive disclosure model is valuable for a new project
with sparse data, not for a project with 120 hook runs, 478 review archive
records, and 32 health log entries.

The underlying insight that survives this reality: **build Tab 4 (Build
Pipeline) and Tab 2 (Debt Pipeline) first because their data is cleanest and
their value is highest**. The RESEARCH_OUTPUT already recommends this in Section
13 (Implementation Phasing). The phased build order IS the progressive
disclosure — just for the implementer, not the end user.

The one piece worth borrowing: a data-freshness badge on each tab header.
"Health: 2h ago", "Debt: 18h ago", "Governance: 33 days ago". This tells the
developer at a glance which tabs have stale static data and need a rebuild,
without requiring tab navigation.

### Effort estimate (data-freshness badge only)

2-3 hours. Each static JSON file includes a `generatedAt` timestamp. The tab
header renders a relative-time badge from this timestamp. Stale threshold: tabs
with data older than 48 hours display an amber "stale" badge.

### Value/effort ratio

HIGH for the data-freshness badge specifically. LOW for the full progressive
disclosure model (problem does not exist at current data maturity).

### When to build

Data-freshness badge: Phase 1 (include `generatedAt` in all static JSON files
from the start — retrofitting is annoying). Full progressive disclosure: Never
(for this project at this stage).

---

## Summary Table

| Idea                         | Value/Effort | Phase                                | Key Dependency                           |
| ---------------------------- | ------------ | ------------------------------------ | ---------------------------------------- |
| 1. Pulse View                | HIGH         | Phase 1                              | Tab 1 health data fetch                  |
| 2. ntfy Threshold Alerts     | MEDIUM       | Phase 2                              | ntfy.sh configuration                    |
| 3. AI Session Summaries      | MEDIUM       | Phase 3                              | Working dashboard + Claude API           |
| 4. Ctrl+K Command Palette    | HIGH         | Phase 2                              | cmdk (installed), MiniSearch (planned)   |
| 5. Session Timeline Strip    | MEDIUM       | Phase 2 (display) / Phase 3 (filter) | session-activity.jsonl added to export   |
| 6. Diff Mode                 | MEDIUM       | Phase 3 (UI) / Phase 1 (design)      | Comparison prop interface design upfront |
| 7. Anti-Patterns (defensive) | n/a          | Phase 1 (build in)                   | Awareness only                           |
| 8. Progressive Disclosure    | n/a          | Never (data already rich)            | Data-freshness badge: Phase 1            |

---

## Top Three Recommendations

**Recommendation 1: Add the Pulse View to the Phase 1 shell (Idea 1)**

The RESEARCH_OUTPUT's Phase 1 work list (Section 13) covers foundation
infrastructure but produces nothing visible. Adding the Pulse View to the shell
component in Phase 1 gives the developer a working, valuable artifact after
Phase 1 completes — two health grade cards, always visible, no tab click
required. Effort: 3-5 hours on top of the existing Phase 1 plan.

**Recommendation 2: Design comparison props into tab components from day one
(Idea 6)**

The "Diff Mode" is a Phase 3 feature, but its architecture must be decided in
Phase 1. Every tab data hook should accept an optional `baseline?: TabData`
prop. This is a 30-minute design decision that avoids a 20-hour retrofit later.
Add `generatedAt` to all static JSON files at the same time.

**Recommendation 3: Wire session-activity.jsonl into the pipeline data export
(Idea 5)**

This file has 135 records, was missed by all 35 research agents, and gives the
only honest session-count-per-day metric available while `velocity-log.jsonl` is
broken. Adding it to the pipeline data export is a one-line change to
`scripts/build-dashboard-data.js`. The dashboard gains a "sessions per day"
trend bar chart in Tab 4 with zero additional data collection. Cost: 2 hours.

---

## What the Research Did Well (and Should Not Change)

- The hybrid fetch architecture (dev: live API routes, production: static JSON)
  is the right call. The `output: "export"` constraint makes any other approach
  architecturally inconsistent.
- The decision to show both health scores (D/67 and B/87) as distinct labeled
  metrics rather than averaging them is correct and should not be compromised by
  the Pulse View concept. The pulse is a navigation cue, not a replacement for
  either score.
- The "Data Unavailable" treatment for broken data sources (velocity, seeded
  commits) is the honest approach. None of these ideas should change that
  stance.
- The Phase 2 prioritization of Tab 4 (Build Pipeline) and Tab 2 (Debt Pipeline)
  is correct — they have the cleanest data and highest immediate value.
