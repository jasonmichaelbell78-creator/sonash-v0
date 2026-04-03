# Contrarian Challenge #1: Architectural Stress Test

**Reviewer:** Skeptical Technical Architect **Date:** 2026-03-27 **Document
Under Review:** `.research/debt-runner-expansion/RESEARCH_OUTPUT.md` **Scope:**
8 targeted challenges against the report's core recommendations

---

## Challenge 1: Static JSON for 8,470+ Items

**Severity: MAJOR**

### The Claim

The report recommends loading all 8,472 debt items as a single static JSON file
(`public/debt-data.json`), estimated at "~8-12 MB uncompressed." The report
calls this "acceptable for a local dev tool, not a public site."

### Ground Truth

Measured reality is worse than the estimate:

- `MASTER_DEBT.jsonl` is **7.59 MB** raw (8,472 lines, ~896 bytes/item)
- As a JSON array (minified): **~7.6 MB**
- Pretty-printed: **~14.5 MB**
- Gzipped: **~1.4 MB** (over HTTP with compression)

The report's 8-12 MB estimate is in the right range for minified, but the real
problem is not today's size -- it is the growth trajectory.

### Growth Rate Analysis

The backlog grew from 868 items (Feb 1) to 8,472 items (Mar 26) -- a **9.8x
increase in 53 days**. The early growth was explosive (audit intake runs added
thousands at once). Recent growth has stabilized to ~7.7 items/day. But the
report proposes adding **7 discovery agents** that the report itself estimates
will yield 123-305 items per run. Even one full discovery run per week adds
500-1,200 items/month.

**Projected sizes:**

| Items  | JSON Size | Gzipped | When (at recent rate)                        |
| ------ | --------- | ------- | -------------------------------------------- |
| 10,000 | 8.5 MB    | ~1.7 MB | ~6 months                                    |
| 15,000 | 12.8 MB   | ~2.6 MB | ~1 year (without discovery agents)           |
| 20,000 | 17.1 MB   | ~3.4 MB | ~6 months (with weekly discovery runs)       |
| 50,000 | 42.7 MB   | ~8.5 MB | Plausible at 18 months with discovery agents |

### The Real Problem

Loading 7.6 MB of JSON into browser memory is fine today. Parsing it takes
~100-200ms on modern hardware. But the architecture has **no escape hatch**. The
report does not define a threshold at which this approach breaks, nor does it
propose a migration path when it does. At 20,000 items (17 MB), JSON.parse alone
will take 300-500ms and the in-memory array will consume ~40-60 MB of heap
(JavaScript objects are much larger than their JSON representation due to
property descriptors, hidden classes, and pointer overhead).

The report's own discovery agent estimates (Section 9) would push the dataset
past 15,000 items within 6 months if discovery agents run regularly. This is the
report contradicting itself: it proposes both aggressive automated intake AND a
monolithic static blob architecture.

### What Should Change

1. **Define a size ceiling.** Explicitly declare: "If debt-data.json exceeds
   15,000 items or 15 MB, the architecture must be revisited." Without a
   declared ceiling, this becomes silent technical debt.
2. **Design field pruning now.** The web table shows 7 default columns. The JSON
   file includes all 20 fields per item including `description` (often 100+
   characters) and `recommendation` (often 200+ characters). A
   `build-debt-data.js` that strips fields not needed for web display could cut
   size by 40-50%.
3. **Consider lazy loading by status.** Split into `debt-data-open.json` and
   `debt-data-resolved.json`. The 1,116 resolved items are rarely needed in the
   default view.
4. **Add the escape hatch to the plan.** Acknowledge that if/when this approach
   hits a wall, the options are: remove `output: "export"`, adopt client-side
   SQLite WASM, or implement pagination via a separate data-serving process.

---

## Challenge 2: SQLite for Local + Static JSON for Web (Dual Format)

**Severity: MINOR**

### The Claim

The report proposes maintaining TWO data pipelines: `MASTER_DEBT.jsonl` -->
`sync-to-sqlite.js` --> `data/tdms.db` (for CLI), AND `MASTER_DEBT.jsonl` -->
`build-debt-data.js` --> `public/debt-data.json` (for web). Plus the original
JSONL source file. That is three representations of the same data.

### The Counter-Argument

This sounds worse than it is. The JSONL is the canonical source. SQLite is a
derived index for CLI queries. Static JSON is a derived snapshot for web
display. Both are generated artifacts, not maintained in parallel. The
complexity is in the generation scripts, not in keeping two formats "in sync"
manually.

The report correctly identifies that removing `output: "export"` would allow API
routes and eliminate the static JSON entirely. But the deployment model
(Firebase Hosting, static SPA) is a deliberate architectural choice confirmed by
the `next.config.mjs` comment: "Required for Firebase Hosting static
deployment." Changing this has blast radius far beyond the debt dashboard.

### Where the Report is Actually Weak

The report does not address **build ordering**. If `sync-to-sqlite.js` and
`build-debt-data.js` both read from `MASTER_DEBT.jsonl`, they are independent.
But the report's data flow diagram (Section 3) shows `build-debt-data.js`
reading from `data/tdms.db` ("OR MASTER_DEBT.jsonl"). If it reads from SQLite,
then `sync-to-sqlite.js` must run first, creating a build dependency chain. The
plan should make a hard decision: `build-debt-data.js` reads from JSONL directly
(simpler, no dependency) or from SQLite (consistent, but adds ordering). Do not
leave this as "OR."

### What Should Change

1. **Pick one source for `build-debt-data.js`.** JSONL is simpler and eliminates
   the SQLite build dependency. Recommend JSONL.
2. **No other changes needed.** The dual-format approach is standard practice
   for derived data stores and does not warrant architectural concern.

---

## Challenge 3: Clipboard-Only Web-to-CLI Handoff

**Severity: MAJOR**

### The Claim

The report says clipboard copy-paste is "the only viable web-to-CLI mechanism"
for a static SPA. The user clicks a button in the web dashboard, a
`/debt-runner` command is copied to clipboard, and they paste it into a Claude
session.

### The Counter-Argument

The report claims this because `output: "export"` eliminates server-side
mechanisms. This is correct for the production build. But the report overlooks
several alternatives that DO NOT require removing static export:

**Alternative 1: localhost WebSocket bridge.** A tiny Node process (or the
existing `npm run dev` server) listens on a local port. The web dashboard sends
commands via WebSocket. This works because the tool is a local dev dashboard,
not a public website. The "static export" constraint only matters for the
deployed build; during `npm run dev` (when the user actually uses the
dashboard), full server capabilities are available.

**Alternative 2: File-based handoff.** The web dashboard writes a command file
to `public/` or a temp directory via a Service Worker or by triggering a
download. The CLI watches for this file. Clunky but eliminates copy-paste.

**Alternative 3: Custom protocol handler.** Register a `sonash://` protocol that
the OS routes to the CLI or Claude session. One-time setup, then one-click
execution from the dashboard.

**Alternative 4: Accept the clipboard for now, but acknowledge it as a V1
limitation.** The report presents clipboard as the final answer. It should be
presented as the MVP approach with better alternatives documented for V2.

### The Deeper Issue

The user's stated desire was "UBER capabilities." Copy-paste is not Uber-level
UX. For a solo developer who runs 1-3 sessions per day, the friction of
copy-pasting a command is real but tolerable. But the report should not pretend
this is the "only viable" option -- it is the simplest option given the static
export constraint, which only applies to the production build that the solo
developer will rarely use (they run `npm run dev` locally).

### What Should Change

1. **Acknowledge clipboard as V1, not final architecture.** The plan should
   state: "Clipboard handoff is the MVP mechanism. V2 should evaluate a
   localhost WebSocket bridge during `npm run dev` for one-click execution."
2. **Verify the user actually uses the production build.** If the dev dashboard
   is only used during `npm run dev`, the static export constraint is irrelevant
   for handoff mechanisms. The report assumes the worst case without checking
   the actual usage pattern.
3. **Design the clipboard command format to be extensible.** If a future bridge
   is added, the command format should not need to change -- only the delivery
   mechanism.

---

## Challenge 4: 7 Discovery Agents

**Severity: MAJOR**

### The Claim

The report proposes 7 net-new discovery agent types running in 2 waves (~10
minutes total), reduced from an original 9. Each agent produces TDMS-formatted
output for intake.

### The Counter-Argument

For a solo developer with 240 sessions, this is over-engineered on multiple
dimensions:

**Volume problem.** The report estimates 123-305 items per full discovery run
(sum of "Typical Yield" column). The backlog already has 7,282 open items with a
13.2% resolution rate (1,116 resolved / 8,472 total). Adding 123-305 items per
run while resolving at the current pace (~20 items/week based on recent metrics)
means the backlog grows faster than it shrinks. The report itself notes this
contradiction in Open Question #8 ("OTB flagged that more intake without fixing
resolution worsens backlog") but does not resolve it.

**Usage reality.** Will the user actually run all 7 agents? The guided mode
suggests "I want to find debt I didn't know about" routes to Mode 9. But running
7 agents for 10 minutes every time is wasteful if you only care about one type
of finding. The report does not propose individual agent selection -- it is
all-or-nothing by wave.

**Overlap with existing tools.** The report removed 2 agents (dependency-
auditor, security-scanner) for duplicating existing tools. But the remaining 7
have partial overlaps:

- `type-safety-scanner` (50-100 items: `any` usage, unsafe casts) overlaps
  significantly with TypeScript strict mode enforcement in `tsconfig.json` and
  SonarCloud's type safety rules. The 2,561 existing SonarCloud items likely
  already cover many of these.
- `dead-code-detector` (20-50 items) overlaps with tree-shaking analysis that
  bundlers already perform and ESLint's no-unused-vars.
- `test-coverage-analyzer` (30-80 items) overlaps with whatever coverage tool is
  already configured (if any).

**Cost.** Each agent is a Claude agent spawn. At 7 agents per run, that is 7
agent invocations costing tokens. The report does not estimate token cost per
discovery run. For a solo developer, this is a real budget concern.

### What Should Change

1. **Start with 3 agents, not 7.** Pick the 3 with highest unique-signal and
   lowest overlap: `config-drift-detector`, `architectural-boundary-checker`,
   and `integration-verifier`. These fill gaps that no existing tool covers.
2. **Allow individual agent selection.** Mode 9 should present a menu of agent
   types, not just "run all." Let the user pick which agents to run.
3. **Add a resolution-rate gate.** If the open backlog exceeds a threshold
   (e.g., 10,000 items) and resolution rate is below 20%, discovery agents
   should warn: "Your backlog is growing faster than you can resolve. Run
   discovery anyway?" This prevents the intake-without-resolution spiral.
4. **Estimate and display token cost** before running discovery agents.

---

## Challenge 5: Firestore for Annotations -- "No Firebase" Contradiction

**Severity: MINOR**

### The Claim

The report states in the executive summary: "no Firebase needed" for the debt
dashboard. But Section 6 recommends Firestore `dev/debt/annotations/{debtId}`
for per-item bookmarks, notes, and annotations. Section 13 (Contradictions)
addresses this but calls both positions "correct for different scopes."

### The Counter-Argument

The report actually handles this reasonably well in Section 13. The QA decision
"no Firebase" applies to bulk MASTER_DEBT synchronization (~67 MB), not to small
annotation metadata (<1 KB per item). The Lighthouse tab already uses Firestore
client SDK in the static SPA, so the pattern is established.

The real weakness is not the contradiction -- it is that the annotation feature
is under-specified. How many items will users annotate? If the answer is "5-20
important ones," then Firestore is overkill -- localStorage would work. If the
answer is "hundreds," then Firestore is justified for cross-device persistence.
The report does not estimate annotation volume.

### What Should Change

1. **Start with localStorage for annotations, not Firestore.** This is a solo
   developer tool. Cross-device persistence is not a launch requirement. If
   annotation volume grows or cross-device is needed, migrate to Firestore.
2. **Clarify the contradiction in the executive summary.** Either remove the "no
   Firebase needed" language or qualify it: "no Firebase needed for bulk data;
   Firestore used for optional annotation metadata."

---

## Challenge 6: TanStack Table + Recharts -- Right Choices or Path of Least Resistance?

**Severity: MINOR**

### The Claim

The report recommends TanStack Table v8 (~15.2 kB) + TanStack Virtual v3 (~3.9
kB) for table rendering, and Recharts (via shadcn/ui chart) for visualization.
AG Grid (298 kB) and Nivo (React 19 friction) were rejected.

### The Counter-Argument

These are defensible choices, but the evaluation is shallow:

**TanStack Table is the right call.** It is headless (no styling opinions),
lightweight, and well-maintained. The 15.2 kB footprint is appropriate. The
report correctly identifies that TanStack Virtual is needed for 8,470+ rows.
This is sound.

**Recharts deserves more scrutiny.** The report says Recharts is "already in
project deps" but the package.json check shows **Recharts is NOT currently a
dependency.** The report's claim that "Recharts is conditionally included only
if shadcn/ui chart components are already imported elsewhere" is hedged -- and
the ground truth is that no charting library is currently installed.

For the 6 chart types proposed (trend line, alert trend, velocity, distribution
donut, category bar, source stacked bar), Recharts is adequate but not optimal.
Alternatives worth considering:

- **Lightweight options:** Chart.js (~64 kB gzipped but canvas-based, faster
  rendering than SVG for large datasets) or uPlot (~13 kB, specifically designed
  for time-series data -- perfect for the trend charts).
- **Nivo rejection may be premature.** The "React 19 friction" cited is likely
  resolved by now given React 19 has been stable for months. The report does not
  specify what the friction is.

**Performance with 8,470 rows in charts is not an issue.** Charts aggregate data
(e.g., "count by severity" produces 4-5 data points, not 8,470). The
metrics-log.jsonl has only 113 entries for trend charts. Charting performance is
a non-issue at this scale regardless of library choice.

### What Should Change

1. **Correct the "already in deps" claim.** Recharts is a new dependency, not an
   existing one. The bundle impact (~35-40 kB gzipped) should be counted in the
   total new dependency cost.
2. **No library change needed.** Recharts via shadcn/ui chart is still the
   pragmatic choice because shadcn/ui provides pre-built chart components that
   match the project's existing UI patterns.
3. **Consider uPlot for trend charts only** if Recharts performance becomes an
   issue with metrics-log.jsonl growth. This is a V2 optimization, not a launch
   blocker.

---

## Challenge 7: 10 CLI Modes -- Mode Sprawl

**Severity: MAJOR**

### The Claim

The report expands the CLI from 7 modes (`verify`, `sync`, `plan`, `health`,
`dedup`, `validate`, `cleanup`) to 10 modes, grouped into 4 categories (REVIEW,
ACT, DISCOVER, MAINTAIN), plus a Guided Mode.

### The Counter-Argument

The 3 new modes are:

- **Mode 8: Run intake scan** (audit existing code)
- **Mode 9: Run discovery agents** (7 agent types)
- **Mode 10: Dark debt review** (overrides + baselines)

Plus **Guided Mode** as a separate entry point.

The problem is not the count -- it is the **cognitive model**. The existing 7
modes are all verbs acting on the same data (MASTER_DEBT). The new modes
introduce different scopes:

- Mode 8 (intake scan) is an existing operation (`intake-audit.js`) that already
  runs via CI and pre-commit hooks. Exposing it as a menu item means the user
  might run it manually and then wonder why the data differs from the automated
  run. The report does not address this interaction.
- Mode 9 (discovery agents) spawns 7 Claude agents. This is qualitatively
  different from Modes 1-8 (which run Node.js scripts). The token cost,
  execution time (~10 min), and error handling are all different. Mixing "run a
  script" and "spawn 7 AI agents" in the same menu level is misleading about
  what happens when you press "9."
- Mode 10 (dark debt review) is a read-only inspection mode, while Mode 8 and 9
  are write-path operations. The REVIEW/ACT/DISCOVER/MAINTAIN grouping helps,
  but Mode 10 is categorized under MAINTAIN when it is really REVIEW.

**Guided Mode adds a 5th interaction pattern.** The existing 7 modes are direct
invocations. Guided Mode is a wizard. This is two mental models for the same
skill: "pick a mode" vs. "tell me what you want." For a solo developer, the
guided mode may be more useful than the numbered menu -- but offering both means
maintaining both, and the user will likely settle into one pattern and never use
the other.

### What Should Change

1. **Make Mode 9 a sub-menu, not a top-level mode.** When the user selects
   "Discover," show: (a) Run intake scan, (b) Run discovery agents [Select
   types], (c) View discovery history. This reduces top-level modes to 9 and
   contains the complexity of agent spawning behind a gate.
2. **Move Mode 10 to REVIEW.** Dark debt review is a read-only inspection. It
   belongs with "View dashboard summary" and "Browse items," not with
   "Maintain."
3. **Consider making Guided Mode the default for the first N sessions.** If the
   user is a non-developer director, the numbered menu is intimidating. Guided
   Mode should be the default entry point, with "Press [E] for expert menu" as
   the escape hatch -- not the other way around.
4. **Estimate the maintenance burden.** Each mode needs: help text, error
   handling, edge case documentation, and Guided Mode routing. 10 modes + guided
   mode + 5 delegation triggers = significant skill surface area to maintain.
   The report does not estimate how much SKILL.md grows.

---

## Challenge 8: Build-Time Data Staleness

**Severity: MAJOR**

### The Claim

`public/debt-data.json` is generated at `npm run build` time. A "stale-data
banner" warns when data is >24 hours old. The report acknowledges this in Open
Question #3 but does not resolve it.

### The Counter-Argument

The staleness problem is worse than the report suggests:

**When does `npm run build` actually run?** This is a dev tool. The user runs
`npm run dev` for day-to-day use (Turbopack, hot reload). `npm run build` runs
for deployment or testing the production build. For a solo developer, this might
be **once a week or less**. The debt data could be days or weeks stale during
normal `npm run dev` usage.

**The report's own data shows high-frequency debt changes.** Between Mar 18 and
Mar 19, the total went from 8,459 to 8,461 and resolved jumped from 483 to 1,113
(630 items resolved in one day). A user looking at the web dashboard during
`npm run dev` would see data from the last `npm run build` -- missing 630
resolutions. That is not a "stale data banner" situation; that is the dashboard
showing actively wrong information.

**The stale-data banner is insufficient.** A banner that says "Data last updated
3 days ago" does not help the user understand what changed. Did 500 items get
resolved? Were 100 new S0 alerts added? The user has to mentally diff the banner
timestamp against their memory of what they did in the CLI.

**`npm run dev` could solve this.** During `npm run dev`, API routes work
(Turbopack serves them). The report mentions this fact (Section 2: "API routes
work under `npm run dev`") but does not propose using it. A hybrid approach is
obvious: during `npm run dev`, the debt tab fetches from an API route that reads
MASTER_DEBT.jsonl directly. During production (`output: "export"`), it falls
back to the static JSON. This gives live data during development and static data
for deployment.

### What Should Change

1. **Add a `prebuild` hook to `npm run dev`.** At minimum, regenerate
   `public/debt-data.json` when the dev server starts. This ensures data is
   fresh at session start. The script takes <1 second for 8,472 items.
2. **Implement the hybrid fetch strategy.** During `npm run dev`, use an API
   route or middleware to serve fresh data. During production build, use static
   JSON. The debt tab component detects which mode it is in via an environment
   variable (`process.env.NODE_ENV`).
3. **Add a "Refresh Data" button to the web dashboard.** In dev mode, this
   button triggers the API route to re-read MASTER_DEBT.jsonl. In production
   mode, the button is hidden (or shows "Run `npm run build` to refresh").
4. **Define acceptable staleness.** The report says ">24 hours" triggers the
   banner. But for a tool that changes debt data multiple times per session, 24
   hours is too generous. Consider ">1 hour" during dev mode, ">24 hours" for
   production.

---

## Summary Matrix

| #   | Challenge                    | Severity  | Recommendation                                                                               |
| --- | ---------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 1   | Static JSON blob scalability | **MAJOR** | Define size ceiling (15K items); strip unused fields; split by status; document escape hatch |
| 2   | Dual format (SQLite + JSON)  | MINOR     | Pick JSONL as source for build-debt-data.js; eliminate "OR" ambiguity                        |
| 3   | Clipboard-only handoff       | **MAJOR** | Label as V1; evaluate WebSocket bridge for `npm run dev`; verify production build usage      |
| 4   | 7 discovery agents           | **MAJOR** | Start with 3; add individual selection; add resolution-rate gate; estimate token cost        |
| 5   | Firestore contradiction      | MINOR     | Start with localStorage; qualify the "no Firebase" claim                                     |
| 6   | TanStack + Recharts choices  | MINOR     | Correct the "already in deps" claim for Recharts; choices are sound otherwise                |
| 7   | 10 CLI modes                 | **MAJOR** | Make discovery a sub-menu; move dark debt to REVIEW; consider Guided Mode as default         |
| 8   | Build-time staleness         | **MAJOR** | Add prebuild to dev start; implement hybrid fetch for dev vs. prod; add refresh button       |

### Overall Assessment

The report is thorough in its research methodology and correctly identifies
`output: "export"` as the load-bearing constraint. Its bug identification
(BUG-01, BUG-06) and cross-tab synergy analysis are strong.

However, the report has **5 MAJOR weaknesses** that stem from a common root
cause: **it optimizes for architectural elegance over operational reality.**

The solo developer with 240 sessions does not need 7 discovery agents, 10 CLI
modes, or a guided wizard. They need: a table that shows their 8,000 items with
fast filtering, 2-3 trend charts, and a way to act on what they see without
leaving the dashboard. The report over-engineers the intake funnel (which
already has a surplus-to-resolution problem) and under-engineers the handoff
mechanism (clipboard copy-paste is not "UBER capabilities").

The build-time staleness issue (Challenge 8) is the most architecturally
significant finding. The report correctly identifies that `npm run dev` supports
API routes but inexplicably does not propose using them for fresh data during
development. This is the single highest-impact change the plan could make: live
data during `npm run dev`, static fallback for production.

**Recommended action before /deep-plan:** Address Challenges 1, 3, 4, 7, and 8
in the plan's assumptions. Challenges 2, 5, and 6 are minor and can be resolved
during implementation.
