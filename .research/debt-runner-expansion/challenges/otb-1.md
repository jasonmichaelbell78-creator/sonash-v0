# OTB Challenge #1: Missed Opportunities and Creative Alternatives

**Author:** Innovation Consultant (OTB-1) **Date:** 2026-03-27 **Research
reviewed:** RESEARCH_OUTPUT.md (698 lines), DECISIONS_PRE_PLAN.md, SYNERGIES.md,
challenges-v1/otb.md, codebase infrastructure (statusline, ntfy,
next.config.mjs, metrics.json, settings.json)

---

## What This Document Is

The research report made a decisive architectural choice: static JSON via
`output: "export"`, clipboard-based CLI handoff, read-only web dashboard. That
choice is sound given the constraints as framed. This document asks: what if the
constraints were framed differently? What adjacent ideas does the architecture
enable or foreclose? What could make the debt management experience genuinely
compelling rather than merely functional?

Eight ideas are evaluated below. Each is rated on two axes:

- **Feasibility:** NOW (could ship this sprint), SOON (1-2 sprints, no
  architectural change), LATER (requires new infrastructure or significant
  rework), NEVER (fundamentally incompatible with the project)
- **Value:** HIGH (directly accelerates debt resolution or changes user
  behavior), MEDIUM (useful but incremental), LOW (nice-to-have, cosmetic)

---

## Idea 1: Standalone Electron/Tauri App Instead of Web Tab

### The Premise

The web dashboard is constrained by `output: "export"` (next.config.mjs line
13). No API routes in production. No filesystem access. No SQLite from the
browser. A local desktop app (Electron or Tauri) would have full filesystem
access, could read `data/tdms.db` directly via better-sqlite3, could run CLI
commands natively, and would not need the `build-debt-data.js` bridge script at
all. The entire static-JSON workaround disappears.

### Why the Research Rejected This (Implicitly)

The research never considered this option. Decision D7 from
DECISIONS_PRE_PLAN.md states: "This is ONE tab of the broader dev dashboard
(Track B in ROADMAP). Not a standalone site." The constraint is organizational,
not technical: the dev dashboard already exists as a multi-tab React application
with a Lighthouse tab implemented, and the user wants debt alongside Sessions,
Errors, Docs, Overrides, and System Health tabs. A standalone app would fragment
the monitoring experience.

### Assessment

The architectural pain of static JSON is real but bounded. `build-debt-data.js`
is a one-time script. The 8-12 MB JSON payload is acceptable for a local dev
tool. The stale-data banner handles freshness. And the cross-tab synergies
documented in SYNERGIES.md (Lighthouse route-level debt overlay, Override
promotion buttons, Sessions debt-delta row, shared `useDebtMetrics()` hook) only
work because all tabs live in the same React application with shared state. A
standalone Electron app would need IPC or a local server to coordinate with the
Next.js dashboard -- adding more architectural pain than the static JSON
constraint causes.

Tauri is lighter than Electron (Rust backend, system webview), but introduces a
new language ecosystem (Rust) to a project that uses JavaScript/TypeScript and
Go. The build/deploy complexity is not justified for a tool used by one person.

**The research's implicit rejection was correct.** The dev dashboard tab is the
right home. The static JSON bridge is the right cost to pay.

**Feasibility:** LATER (technically possible, 2-3 weeks for MVP) **Value:** LOW
(solves a problem that already has a good-enough solution, breaks cross-tab
synergies)

---

## Idea 2: AI Chat Widget in the Web Dashboard

### The Premise

The user said "I wish we could wrapper your AI into it." What if the debt tab
had an embedded chat widget? Natural language queries against the debt data:
"Which S0 items have been open longest?" "What's the most common category in the
last 3 sessions?" "Show me items that were resolved then re-opened."

### Why This Is Blocked -- and What Gets Around It

`output: "export"` kills this dead for any server-side approach. No API route
can proxy to the Claude API. But three workarounds exist:

**Workaround A: Client-side API key.** The browser calls the Anthropic API
directly with an API key stored in `.env.local`. This is technically feasible
for a single-user local dev tool but violates the project's security model (no
secrets in client bundles). The key would be visible in browser devtools. For a
solo-developer tool never deployed publicly, the risk is low. But it sets a bad
precedent and would fail security-auditor review.

**Workaround B: Firebase Cloud Function as proxy.** A `httpsCallable` function
receives the user's question + a summary of debt data, calls Claude API
server-side, returns the answer. This is architecturally clean and consistent
with the project's existing Cloud Functions pattern. But it requires: (1) the
Anthropic API key in Firebase secrets, (2) a new Cloud Function, (3) shipping
some representation of debt data to the cloud (8,472 items is too large for a
function invocation -- would need to send summaries). App Check protects the
endpoint. This is viable but adds a new external dependency (Anthropic API) to
the Firebase project.

**Workaround C: Pre-generated AI insights at build time.** The
`build-debt-data.js` script already runs at build time. It could call the Claude
API during the build to generate a `public/debt-insights.json` file containing
3-5 natural language insights: "The fastest-growing debt category this week is
code-quality (+142 items). 3 S0 items have been open for more than 30 days. Your
resolution velocity improved 18% compared to last week." These insights are
static text baked into the JSON -- no runtime API call needed. Freshness matches
the stale-data banner (as recent as the last build).

### Assessment

Workaround C is the realistic path. It sidesteps every constraint: no API route
needed, no secrets in the browser, no Cloud Function overhead. The cost is one
API call per build (cheap), and the insights are always as fresh as the data.
The build script already has the full dataset in memory -- adding 3-5 summary
prompts is straightforward.

The key insight: this is not "AI in the dashboard" -- it is "AI-generated
content in the dashboard," which is a much simpler problem. The user does not
need to ask arbitrary questions. They need the RIGHT questions pre-answered
every time they open the tab.

**Feasibility:** SOON (Workaround C requires adding ~20 lines to
build-debt-data.js + an API key in the build environment) **Value:** HIGH
(transforms the KPI panel from "numbers you have to interpret" to "insights you
can act on immediately")

---

## Idea 3: Debt Heat Map on Source Code

### The Premise

Instead of a flat table of 8,472 items, show a visual file tree of the codebase
with directories color-coded by debt density. `components/` glows red (847
items). `scripts/` is orange (312 items). `lib/` is green (23 items). Clicking a
directory drills into its files with per-file debt counts. This turns abstract
debt data into spatial understanding: "where does debt live?"

### What Exists Today

MASTER_DEBT items carry a `file` field (when populated). The research identified
GAP-04 (file metadata -- directory, extension -- missing from some items) as a
MUST-HAVE for the hybrid architecture. If GAP-04 is fixed, every item has a
normalized file path. The `by_file` grouping mode is already in the table design
(Section 7: "Grouping modes: By File (directory)").

### Assessment

This is a genuinely compelling visualization that no existing tool provides for
this project. The data exists. The grouping logic is already planned. The
question is whether a tree map / heat map visualization justifies its complexity
versus the table's "group by directory" mode.

**Implementation approach:** A collapsible file tree (not a treemap chart) on
the left sidebar of the debt tab. Each directory node shows a count badge and a
severity-weighted color indicator. Clicking a directory filters the main table
to that directory's items. This is simpler than a full treemap visualization and
integrates naturally with the existing table+filter architecture.

The file tree requires: (1) parsing all `file` fields into directory paths, (2)
building a tree structure from those paths, (3) aggregating debt counts and
severity weights per directory node. All of this can be computed from the static
`debt-data.json` at load time -- no new data source needed.

**Risk:** Items without file paths (GAP-04) would appear as "Uncategorized" in
the tree. If GAP-04 is not fixed first, a large fraction of items cluster under
a single node, reducing the visualization's value. GAP-04 is already flagged as
MUST-HAVE, so this is a sequencing dependency, not a blocker.

**Feasibility:** SOON (after GAP-04 fix; ~2-3 days of UI work using existing
data) **Value:** HIGH (transforms understanding from "I have 8,472 debt items"
to "my auth module is drowning in debt and my lib/ is clean")

---

## Idea 4: Gamification -- Debt Velocity as Game Metrics

### The Premise

240+ sessions. 1,116 resolved items. 53 days of metrics history in
metrics-log.jsonl. This is enough data for meaningful personal bests. "You
resolved 47 items this week -- your best week ever." "15-session resolution
streak." "S0 count at its lowest since February 12." Streaks, milestones,
velocity badges.

### What Exists Today

`metrics-log.jsonl` has 112 entries spanning 2026-02-01 through 2026-03-26. Each
entry (after BUG-06 fix) will contain total, open, resolved, S0, S1, by_source,
by_category. This is enough to compute: weekly resolution velocity,
consecutive-session streaks where items were resolved, personal bests for
single-session and weekly resolution counts, and S0 count trajectory (new lows).

### Assessment

This is a surprisingly good fit for this project. The user is a solo operator
with 240+ sessions -- there is no team to compete against, but there IS a strong
personal-progress narrative. The 13% resolution rate is a problem the research
identified but did not solve. Gamification does not solve it either, but it
creates a psychological pull toward resolution that dashboards and tables do
not.

**Caution:** Gamification can backfire if the metrics are too crude. Resolving
100 S3 items to hit a "personal best" while ignoring 26 S0 items is gaming the
metric. The velocity metric should be severity-weighted: resolving 1 S0 item
counts as much as resolving 10 S3 items. This prevents "resolution farming."

**Implementation:** A "Personal Stats" card in the KPI panel. Three metrics: (1)
Weekly resolution velocity (severity-weighted), (2) Current streak (consecutive
sessions with at least 1 resolution), (3) S0 count with historical best marker.
Computed entirely from `metrics-log.jsonl` at build time. No new data source. No
new dependency. Just 3 derived fields in `metrics-data.json`.

**Feasibility:** NOW (data exists in metrics-log.jsonl; computation is trivial;
3 extra fields in metrics-data.json) **Value:** MEDIUM (motivational, but does
not directly remove the structural barriers to resolution identified in OTB-v1
Challenge 4)

---

## Idea 5: Pre-Generated Static AI Summaries

### The Premise

The `build-debt-data.js` sync script could call the Claude API at build time to
generate natural-language summaries baked into `public/debt-insights.json`:
"This week, 3 new S0 items appeared in the auth module. The largest source of
new debt is SonarCloud auto-sync. Your resolution rate improved from 12% to 13%
-- slow but steady."

### Relationship to Idea 2

This is Workaround C from Idea 2, extracted as its own proposal. The distinction
matters: Idea 2 asked "can we put AI in the dashboard?" and concluded that
pre-generated insights are the viable path. Idea 5 is the concrete design.

### Assessment

This is the single highest-value addition that the research did not consider.
The research designed 6 chart types and 6 KPI cards. All of them require the
user to interpret numbers. A pre-generated insight like "The 3 oldest S0 items
(DEBT-00142, DEBT-00389, DEBT-01204) have been open for 41, 38, and 33 days
respectively. None are assigned to any sprint." turns a number ("26 S0 items")
into an actionable statement ("these 3 specific items are the worst offenders").

**Data flow:** `build-debt-data.js` reads MASTER_DEBT.jsonl + metrics-log.jsonl
into memory. It constructs a summary prompt (total counts, severity
distribution, top movers since last build, oldest unresolved items, resolution
velocity trend). It sends this to the Claude API with a system prompt
constraining output to 5 bullet points. The response is written to
`public/debt-insights.json`. The web tab renders these bullets in a "Weekly
Insights" card above the KPI panel.

**Requirements:** An Anthropic API key in the build environment (`.env.local` or
CI secrets). One API call per build (~$0.01-0.03 depending on model). The build
becomes slightly slower (~2-5 seconds for the API call). A fallback for offline
builds (skip insights generation, serve previous insights or a placeholder).

**Feasibility:** SOON (requires API key setup + ~30 lines in build-debt-data.js

- one React card component) **Value:** HIGH (converts raw data into actionable
  narrative; addresses the "items get lost in TDMS" problem identified by
  pr-retro's anti-TDMS philosophy)

---

## Idea 6: Diff View Between Two Points in Time

### The Premise

metrics-log.jsonl has 112 snapshots. "Show me what changed between Session #230
and Session #243" -- how many items were added, how many resolved, which
categories grew, which shrank. A time-travel diff view.

### What Exists Today

Each metrics-log.jsonl entry (after BUG-06 fix) will contain: timestamp, total,
open, resolved, s0_alerts, s1_alerts, by_source, by_category. Two consecutive
entries can be diffed to produce: net new items, net resolved, category-level
deltas, source-level deltas. 112 entries means 111 possible consecutive diffs,
or arbitrary A-to-B diffs across any two entries.

### Assessment

This is valuable but the implementation complexity varies dramatically depending
on scope:

**Simple version (SOON):** Two dropdowns ("From" and "To") selecting
metrics-log.jsonl entries by date. The diff shows: total delta, resolved delta,
S0 delta, top 3 categories that grew, top 3 categories that shrank. This is a
pure computation on two JSON objects -- no new data source, no new dependency.
Estimated effort: 1 day.

**Rich version (LATER):** Item-level diff showing which specific DEBT-XXXXX
items were added or resolved between two snapshots. This requires MASTER_DEBT to
carry `created_at` and `resolved_at` timestamps (which it does), but the
metrics-log entries do not record per-item IDs. The rich version would need
either: (a) the full `debt-data.json` array with per-item dates and client-side
filtering, or (b) a new `debt-snapshots/` directory with per-snapshot JSONL
files (expensive storage). Option (a) is viable because the web already loads
the full 8-12 MB dataset -- filtering by `created_at` between two dates is a
client-side array filter.

The simple version delivers 80% of the value. The rich version adds "show me
which items" to "show me how many," which is useful but not essential for the
initial launch.

**Feasibility:** SOON (simple version); LATER (rich item-level version)
**Value:** HIGH (directly answers "are we making progress?" -- the most
important question a debt management system should answer)

---

## Idea 7: Embed Debt Dashboard in Claude Code Statusline

### The Premise

The statusline already has 22 widgets (A1 through I4) in Go. D1 shows hook
health. D5 shows unacked warnings. Could there be a D-series "debt widget" that
shows S0 count, resolution rate, or data freshness directly in the Claude Code
terminal?

### What Exists Today

The statusline binary (`tools/statusline/sonash-statusline.exe`) reads JSONL
state files from `.claude/state/` and renders widgets. It already reads
`hook-runs.jsonl` and `hook-warnings-log.jsonl`. Adding a widget that reads
`docs/technical-debt/metrics.json` (which is already generated by
`generate-metrics.js` and committed to the repo) is architecturally identical to
the existing D1/D5 pattern.

The file `metrics.json` contains `summary.total`, `summary.open`,
`summary.resolution_rate_pct`, and `by_severity.S0`. All four values are
directly renderable as a widget string.

### Assessment

This is the lowest-effort, highest-visibility idea in this list. The statusline
infrastructure exists. The data file exists. The widget pattern is established.
A new `D3` widget (or similar) that reads `metrics.json` and displays
`S0:26 | 13% resolved` is ~30 lines of Go code following the exact pattern of
`widgetHookHealth` and `widgetUnackedWarnings`.

The key question is whether this duplicates the KPI panel on the web dashboard.
Answer: no, it complements it. The statusline is an ambient signal visible
during EVERY Claude Code session. The web dashboard is a deliberate action the
user takes to investigate. The statusline widget answers "should I go look at
the debt dashboard right now?" -- if S0 spikes or resolution rate drops, the
widget changes color (yellow at S0 > 20, red at S0 > 30, for example).

**Going further:** The statusline already shows unacked warnings (D5). A "debt
alerts" widget that blinks or turns red when S0 exceeds a threshold would be an
ambient nudge toward debt resolution -- exactly the behavioral pull that the 13%
resolution rate problem needs.

**Feasibility:** NOW (30 lines of Go, same pattern as D1/D5, data file already
exists) **Value:** MEDIUM (ambient awareness is valuable, but the statusline is
information-dense already -- 22 widgets. Adding more risks visual clutter. The
right move is to replace one of the lower-value widgets, not add a 23rd.)

---

## Idea 8: Webhook Triggers on Debt Thresholds

### The Premise

ntfy.sh is already configured (`tool-configs/ntfy.conf` with topic
`sonash-claude`). The Claude Code settings.json has a Notification hook that
pushes to `ntfy.sh/sonash-claude`. What if `generate-metrics.js` checked
thresholds after generating metrics and fired a notification? "S0 count exceeded
30." "Resolution rate dropped below 10%." "100 new items added in a single
session."

### What Exists Today

The notification infrastructure is deployed and working:

- `ntfy.conf` defines the topic
- `settings.json` has a Notification hook type that calls
  `curl -s -d "..." ntfy.sh/sonash-claude`
- ntfy.sh pushes to mobile (the user already receives push notifications from
  Claude Code)

`generate-metrics.js` runs at session-end and after debt-runner operations. It
already computes all the values needed for threshold checks (S0 count,
resolution rate, total count).

### Assessment

This is a natural extension of existing infrastructure with a clear behavioral
impact. The ntfy pipeline is already working -- adding threshold checks to
`generate-metrics.js` is 10-15 lines of JavaScript.

**Threshold candidates:**

1. S0 count > N (configurable, default 30) -- "ALERT: S0 critical debt is at
   {count}, above threshold of {N}"
2. Resolution rate drops below M% (configurable, default 10%) -- "WARNING:
   Resolution rate dropped to {rate}%"
3. Single-session intake > K items (configurable, default 100) -- "INFO: {K} new
   items added this session"
4. S0 item age > D days without resolution (configurable, default 14) -- "STALE:
   {count} S0 items older than {D} days"

**Risk:** Notification fatigue. If thresholds are too sensitive, the user gets
push notifications on every session-end. The thresholds must be conservative
(fire rarely, when something genuinely needs attention) and the user must be
able to disable them without editing code (a `tool-configs/debt-thresholds.json`
config file).

**Risk 2:** `generate-metrics.js` currently runs inside the Claude Code session
(via debt-runner or session-end). The ntfy call adds a network dependency to a
script that was previously offline-safe. Wrap the curl call in a try-catch with
a 3-second timeout and `continueOnError: true` to prevent notification failures
from blocking the metrics pipeline.

**Feasibility:** NOW (infrastructure exists, 10-15 lines of JS + a config file)
**Value:** MEDIUM (useful for the "S0 spike" scenario, but the user already sees
S0 counts in /alerts and /session-begin. The marginal value is push notification
vs. pull -- valuable for the mobile use case when the user is not at the
terminal.)

---

## Summary Matrix

| #   | Idea                              | Feasibility | Value  | Recommendation                                          |
| --- | --------------------------------- | ----------- | ------ | ------------------------------------------------------- |
| 1   | Standalone Electron/Tauri app     | LATER       | LOW    | Skip. The web tab is the right home.                    |
| 2   | AI chat widget in dashboard       | SOON        | HIGH   | Implement as pre-generated insights (Idea 5).           |
| 3   | Debt heat map on source code      | SOON        | HIGH   | Add as file-tree sidebar in debt tab, post-GAP-04.      |
| 4   | Gamification / debt velocity      | NOW         | MEDIUM | Add 3 derived metrics to metrics-data.json. Low effort. |
| 5   | Pre-generated static AI summaries | SOON        | HIGH   | Highest-value new idea. Build into build-debt-data.js.  |
| 6   | Diff view between time points     | SOON        | HIGH   | Simple version first (metric-level diffs).              |
| 7   | Statusline debt widget            | NOW         | MEDIUM | 30 lines of Go. Replace low-value widget, not additive. |
| 8   | Webhook threshold triggers        | NOW         | MEDIUM | Conservative thresholds + config file. Low effort.      |

---

## Top 3 Recommendations for /deep-plan

If the plan can absorb additional scope beyond the research report, these three
ideas have the best effort-to-value ratio:

1. **Pre-generated AI summaries (Idea 5):** Transforms the dashboard from "data
   you interpret" to "insights you act on." Directly addresses the pr-retro
   observation that TDMS items "get lost." Cost: ~30 lines + API key. Schedule:
   add to `build-debt-data.js` when that script is created (REC-02).

2. **Debt heat map file tree (Idea 3):** The single most impactful visualization
   beyond the table. Turns 8,472 abstract items into spatial understanding.
   Depends on GAP-04 (already MUST-HAVE). Schedule: Phase 2 of the web tab,
   after the core table is working.

3. **Time diff view (Idea 6):** Answers "are we making progress?" with a simple
   A-to-B comparison. Uses existing metrics-log.jsonl data. Schedule: add to the
   Trends panel alongside the existing trend charts.

Ideas 4, 7, and 8 are low-effort garnishes that can be added opportunistically
without /deep-plan coordination.

Idea 1 (standalone app) should be permanently deferred. The architectural
constraints it solves are already solved by static JSON, and the cross-tab
synergies it breaks are more valuable than the filesystem access it gains.

---

## Confidence

These assessments are grounded in verified codebase facts: `output: "export"` in
next.config.mjs, ntfy.sh configuration in settings.json and ntfy.conf,
statusline widget patterns in widgets.go, metrics.json schema, and
metrics-log.jsonl data volume. The feasibility ratings are conservative -- "NOW"
means the infrastructure exists and the implementation is bounded; "SOON" means
one prerequisite must be met first.

Value ratings are subjective judgments informed by the OTB-v1 challenge analysis
(particularly Challenge 4's observation about the 13% resolution rate and
Challenge 9's observation about the pr-retro anti-TDMS signal). Ideas that
address the behavioral gap (why items are not resolved) are rated higher than
ideas that address the visibility gap (making existing data more visible).
