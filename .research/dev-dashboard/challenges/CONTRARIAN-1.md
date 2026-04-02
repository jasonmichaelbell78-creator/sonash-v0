# Contrarian Review: Dev Dashboard Command Center

**Reviewer:** deep-research-searcher (contrarian mode) **Profile:** codebase
**Date:** 2026-03-29 **Source document:**
`.research/dev-dashboard/RESEARCH_OUTPUT.md` **Role:** Challenge the findings.
Surface weaknesses before planning locks them in.

---

## Challenge 1: 6-Tab Structure

**Claim challenged:** Six domain-organized tabs (Health, Debt, Reviews,
Pipeline, Governance, Planning) is the optimal structure for this dashboard.

**Contrarian position:** Six tabs optimizes for data completeness, not for solo
developer daily use. The research reports that the structure "emerged from
rigorous evaluation" of four competing models, but the evaluation criteria were
data coverage and co-occurrence — not frequency of use. There is no usage
evidence anywhere in the report. The 6-tab model covers all 36 HIGH-relevance
data sources, but covering everything is not the same as serving daily workflow.

A solo developer navigating 6 tabs to get a session start-of-day situational
awareness check is doing more cognitive work, not less. The alternative: 3 core
tabs (Health + Debt combined as "Status", Pipeline + Reviews as "Activity",
Governance + Planning as "Roadmap") with drill-down into sub-views would
front-load the information that matters daily while burying the rarely-consulted
data (e.g., 7 ecosystem audit history files, 4 research index entries, the
lifecycle score matrix).

Consider what each tab's actual cadence is for a solo developer:

- Tab 1 (Health): daily (session start)
- Tab 2 (Debt): weekly or per-sprint
- Tab 3 (Reviews): per-PR (not daily)
- Tab 4 (Pipeline): daily (session end)
- Tab 5 (Governance): monthly or after audits
- Tab 6 (Planning): per-sprint kickoff

Three of the six tabs have sub-weekly cadences. They will sit unused for days.
Idle tabs become invisible tabs.

**Evidence for the challenge:**

- The report cites no usage-frequency data. Cadence analysis is absent.
- The research's own phasing (Section 13) ranks Tabs 5 and 6 as "lower-priority"
  — which implicitly acknowledges they are not daily-use tools.
- Tab 6 (Planning) has 4 research index entries. A whole tab for 4 entries and
  some plan state files is feature overhead for current data volume.
- Tab 5 (Governance) has 7 audit history files with 1 record each for 3 of those
  files (stale since February). It may not grow meaningfully without a major
  habit change.

**Evidence against the challenge:**

- The 6-tab structure was a binding user decision made in Session #245 — this is
  not a research recommendation, it is an approved decision. The report says
  "settled by user decision" (Section 1). Overturning it here is not within the
  contrarian's scope.
- Domain separation reduces cognitive confusion (Health vs Reviews vs Pipeline
  all have distinct mental models; merging them adds translation overhead).
- The tab navigation cost (one click) is low. Idle tabs do not impose cost
  unless they drive implementation cost, which they do — but that is a separate
  question.

**Verdict: WEAKENED** — the structure is defensible on domain grounds and is a
locked user decision, but the research never validated it against actual usage
patterns. The absence of cadence analysis is a genuine gap. There is real risk
that Tabs 5 and 6 get built, used twice, and forgotten. The `/deep-plan` phase
should consider minimum-viable implementations for the low-cadence tabs rather
than full feature parity with the daily-use tabs.

---

## Challenge 2: Hybrid Fetch Architecture

**Claim challenged:** The hybrid fetch architecture (dev mode = API routes,
production = static JSON) is the correct approach.

**Contrarian position:** The research frames the hybrid as a necessary split
forced by `output: "export"`. That constraint is real. But it conflates "API
routes don't work in static export" with "hybrid fetch is the right pattern." A
simpler alternative exists: always use static JSON with a manual refresh button.
This eliminates the API route layer entirely.

The research justifies the dev-mode API routes by saying they provide "live
data" during development. But the dashboard's primary audience is the developer
during an active session — and during an active session, the developer can
already run `npm run dashboard:build` or the `dashboard:build` alias to refresh
data. The hybrid adds:

- A `app/api/` directory that must be created from scratch (confirmed absent in
  the report)
- 6 new API route handlers, each reading JSONL from disk
- A `const isDev = process.env.NODE_ENV === 'development'` branch in every tab
- Risk of divergence: the API route output shape and the static build output
  shape must stay in sync, but they are maintained by different code paths

The marginal benefit of the hybrid is: data is fresh on every page load in dev
mode without manually running the build script. The cost is: a second code path
that can drift, additional surface area for bugs, and an API layer that vanishes
in production.

The always-static alternative: one code path, one data source, one script to
run. A prominent "Refresh Data" button (calls `dashboard:build` via a dev-only
API route or just instructs the developer to run it) gives equivalent freshness
with half the architecture.

**Evidence for the challenge:**

- Section 5.4 confirms `app/api/` does not exist — this is greenfield work, not
  incremental extension.
- The report already shows the dev-side precedent for this pattern in
  `resources-page.tsx` and `today-page.tsx`, but those were likely purpose-built
  for live data needs. A dashboard reading JSONL from disk has different latency
  expectations than a live Firestore query.
- The build script alias `dashboard:build` already exists in the plan (Section
  5.4). The infrastructure for manual refresh is already being built.
- The "stale data banner" (Section 5.3) is already designed — meaning the
  production experience with static data is already planned as a first-class
  citizen, not a degraded fallback.

**Evidence against the challenge:**

- The `output: "export"` constraint genuinely forces the split at the
  architecture level — there is no way to have API routes in production.
- The dev-mode live fetch eliminates one recurring friction point (running the
  build script before seeing fresh data). For a developer who opens the
  dashboard frequently during a session, this compounds.
- The pattern already exists in the codebase (resources-page, today-page) — this
  is extending a known convention, not inventing one.
- The API routes are simple file readers, not business logic. Drift risk is low
  if the build script and API routes share a common data-shape module.

**Verdict: HOLDS** — the hybrid is architecturally forced and consistent with
existing codebase patterns. The always-static alternative is simpler but trades
freshness for convenience that the developer would feel on every dashboard open.
The complexity cost is real but bounded: 6 simple route handlers with shared
output schemas are manageable. The contrarian case is legitimate (the simplicity
argument is valid) but not strong enough to overturn the decision given the
existing codebase precedent.

---

## Challenge 3: Static JSON Budget

**Claim challenged:** 3.5 MB full load (initial ~600 KB + 2.2 MB lazy S2/S3) is
within the 5 MB ceiling and acceptable.

**Contrarian position:** "Within ceiling" is not the same as "acceptable for a
dashboard." 600 KB initial load for a developer dashboard is heavy. For
comparison, a typical production web app targets sub-200 KB initial HTML+CSS+JS.
This is JSON data payloads alone, before any React bundle overhead.

The more specific problem: the 464 KB `debt-items-s0s1.json` file is the initial
load for Tab 2, and it contains 1,270 items (11 S0 + 1,259 S1). The S0 items
(11) are genuinely critical. The S1 items (1,259) are not urgent — they are a
browsing surface. Loading all 1,259 S1 items on tab mount is overfetching.

The research acknowledges TanStack Virtual will be used for row virtualization
(preventing DOM bloat), but virtualization does not reduce network transfer. 464
KB still crosses the wire before the table renders.

A more defensible approach: load S0 items immediately (~5 KB for 11 items), load
S1 summary counts from `debt-summary.json` (2 KB), and defer the 464 KB S1
browser to an explicit "Load S1 items" user action or lazy scroll trigger. This
would reduce Tab 2 initial load from 464 KB to under 10 KB.

**Evidence for the challenge:**

- The report sets the "5 MB ceiling" without citing its origin. It appears to be
  a self-imposed constraint, not a hard limit from Firebase Hosting or Next.js.
- The S0 vs S1 distinction already exists in the data model. S0 (11 items,
  zero-tolerance) and S1 (1,259 items, prioritized backlog) have fundamentally
  different urgency. Bundling them into one initial load conflates two different
  user intent patterns.
- Tab 6's `planning-data.json` estimate of "20-40 KB" is noted as uncertain. The
  report does not add a safety margin to the total budget.
- The report explicitly notes this is "desktop-only" and dismisses mobile, but
  does not address slower development machines, corporate VPNs, or the local
  disk I/O overhead of reading 7.22 MB MASTER_DEBT.jsonl at build time.

**Evidence against the challenge:**

- This is a developer-only tool accessed from localhost or a local network. The
  600 KB initial load will transfer in milliseconds on loopback.
- The lazy-load split is already implemented in the plan: S2+S3 (2.2 MB) is
  deferred. The report has already made the highest-impact lazy-load decision.
- Serving 464 KB from `localhost:3000` or Firebase Hosting CDN (which gzips
  responses) will compress to roughly 80-100 KB on the wire.
- Splitting S0 from S1 into separate endpoints adds build script complexity and
  API endpoint complexity for 11 items that could just as easily be flagged in
  the S0+S1 file.

**Verdict: WEAKENED** — the decision is defensible on a localhost/CDN context,
but the budget analysis conflates "within ceiling" with "well-reasoned." The S1
initial-load question is legitimate: 1,259 items loaded before the user has
requested them is speculative prefetch. The `/deep-plan` phase should define an
explicit lazy-load threshold for S1 (e.g., S1 loads on first scroll past the S0
section, not on tab mount).

---

## Challenge 4: TanStack Table for Debt Tab Only

**Claim challenged:** TanStack Table (v8, ~15 KB gzipped) is justified for the
debt tab's S1 item browser.

**Contrarian position:** If only 1 of 6 tabs uses TanStack Table, the bundle
cost is borne by all tabs but the value is delivered by one. TanStack Table is a
powerful headless table library designed for complex multi-column sorting,
column visibility controls, pagination, filtering, and row selection across
large datasets. For a developer dashboard, the actual sorting requirements for
S1 items are: sort by severity (already filtered to S1), age, category, and
file. That is 4 sort columns and no filtering beyond what MiniSearch provides.

A hand-rolled `<table>` with `useSortState` (a 20-line custom hook) covers this.
The question is not whether TanStack Table is appropriate for the use case — it
is — but whether the use case justifies pulling in a library that is used
nowhere else in the codebase.

**Evidence for the challenge:**

- The report confirms TanStack Table is NOT currently installed. Adding it
  purely for one tab adds a new dependency with its own update and compatibility
  surface.
- The research lists `@tanstack/react-virtual` as a separate install (~6 KB).
  This is genuinely needed for virtualizing 1,259 rows — but virtualization and
  table management are separate concerns. `@tanstack/react-virtual` alone
  (without `@tanstack/react-table`) is sufficient for row virtualization.
- The S1 item table needs: sort by 4 columns, full-text search (MiniSearch), and
  row virtualization. None of these require TanStack Table's column model,
  column visibility, header groups, or row selection features.
- Section 13 (phasing) identifies Tab 2 as "high value" and places it in Phase 2
  — the early-build phase. Installing a full table library in Phase 1 pre-work
  for a single table that could be hand-built in Phase 2 is premature
  abstraction.

**Evidence against the challenge:**

- TanStack Table is widely used, well-maintained, and React 19 compatible.
  Adding it is not a risk.
- If the dashboard expands (Tab 3 has a PR history table with 501 records; Tab
  5's audit recency is a table), TanStack Table will be reused. The first use
  amortizes the bundle cost.
- A hand-rolled sort table requires ongoing maintenance. TanStack Table's sort
  logic is battle-tested across edge cases (locale-aware string sort, null
  handling, multi-column sort order).
- 15 KB gzipped is genuinely small. The developer bundle overhead is negligible.

**Verdict: HOLDS** — the 15 KB bundle cost is justified given the multi-tab
reuse potential (Tab 3 has a 501-record table; Tab 5 has a multi-column audit
table). The concern is legitimate but the reuse case weakens it. The contrarian
argument would be stronger if TanStack Table were truly single-use. As designed,
it is likely to be used in at least 3 of 6 tabs.

---

## Challenge 5: Recharts for 5/6 Tabs

**Claim challenged:** Recharts (~50 KB gzipped, tree-shakeable) is the right
visualization library for this dashboard.

**Contrarian position:** The report confirms Recharts 3.7.0 is compatible with
React 19.2.4 (INV-1/Q7), which resolves the main technical risk. The contrarian
case is not about compatibility — it is about whether a 50 KB charting library
is necessary for charts whose data density is low.

Looking at the actual charts specified per tab:

- Tab 1: Line chart (32 points — health trend), horizontal bar (9 categories),
  heatmap grid (37 cells), sorted list. The "heatmap" is actually a styled div
  grid with background colors — not a chart library feature.
- Tab 2: Stacked bar (4 status values), donut (categories), line chart (49-114
  points — debt trend).
- Tab 3: Line chart (52 points — fix rate trend), bar chart (4 values — round
  distribution).
- Tab 4: Matrix/heatmap (14 checks × N dates), bar chart (daily commit counts),
  list. The hook compliance matrix is another styled div grid.
- Tab 5: Horizontal bar (8 audit scores), line charts (25-point and 24-point
  series).
- Tab 6: Card list, kanban columns — no charts at all.

Of the actual Recharts-powered widgets, most have under 100 data points and no
interactivity requirements beyond hover tooltips. The complexity level is
squarely in "sparkline and simple bar chart" territory for most of them.

Alternatives:

- **CSS-only sparklines** for trend indicators (health score over time): zero
  bundle cost, sufficient for direction visualization.
- **Chart.js** (~60 KB full, but lighter for basic charts): more imperative API
  but widely used and smaller for simple use cases.
- **Recharts as planned**: 50 KB for a React-native, declarative API that
  matches the existing codebase style. INV-1 confirmed React 19 compatibility.

The honest question: is the declarative React API of Recharts worth 50 KB vs
building 3-4 simple chart components with SVG directly? For a developer tool
with low chart complexity, SVG-direct or a minimal library could serve equally
well.

**Evidence for the challenge:**

- Several of the "charts" in the spec are actually styled div grids (hook
  compliance matrix, category heatmap) — these do not need a chart library at
  all.
- The line charts all have fewer than 120 data points. SVG path generation for a
  32-point line chart is a 15-line function.
- The report's own budget section lists Recharts as the largest new bundle
  addition (50 KB vs 15 KB for TanStack Table, 6 KB for react-virtual, 12 KB for
  MiniSearch).

**Evidence against the challenge:**

- Recharts' value is not raw rendering — it is axes, ticks, tooltips, responsive
  containers, and legend handling. Hand-rolling those is 200+ lines of SVG math
  for each chart type.
- React 19 compatibility is confirmed. No risk of peer dependency conflicts.
- Tree-shaking means only the imported chart types (LineChart, BarChart,
  PieChart, RadarChart) are bundled — 50 KB is a ceiling, not a floor. A
  dashboard using only LineChart and BarChart will bundle significantly less.
- The codebase is already using `recharts` as a shadcn dependency (shadcn's
  `chart` component wraps Recharts). Adding Recharts explicitly just makes the
  implicit dependency explicit.

**Verdict: HOLDS** — the shadcn `chart` component dependency is the deciding
factor. The codebase is already pulling in Recharts transitively via shadcn;
making it a direct dependency adds nothing in bundle terms. The contrarian
argument has merit in isolation (the charts are simple) but loses on the
transitive dependency reality.

**Caveat:** The research should verify whether the `chart` shadcn component is
already installed and therefore Recharts already present in `node_modules`. If
it is, the "install recharts" pre-work step is misleading — it is already there
and the install command would simply add it to `package.json` explicitly.

---

## Challenge 6: Pre-Work Gate Weight

**Claim challenged:** The pre-work gate (BUG-01 fix + package installs + shadcn
additions + infrastructure) must complete before any tab work starts.

**Contrarian position:** The gate is front-loaded with work that is not
uniformly blocking. The research correctly labels BUG-01 (lowercase status
strings in `debt-health.js`) as BLOCKS-severity for Tab 2. But Tab 1 (Health)
has no dependency on `debt-health.js`. The question is whether fixing BUG-01
before building Tab 1 is a rational gate or a sequence convenience that delays
value delivery.

Breaking down what actually blocks what:

- `npm install recharts` — blocks tabs that use charts (Tabs 1, 2, 3, 4, 5).
  Genuinely pre-work.
- `npm install @tanstack/react-table @tanstack/react-virtual` — blocks Tab 2 S1
  browser. Does NOT block Tab 1.
- `npm install minisearch` — blocks Tab 2 search. Does NOT block Tab 1.
- `npx shadcn@latest add badge table tooltip dropdown-menu checkbox chart` —
  `badge` and `tooltip` are needed by Tab 1. `table` is needed by Tab 2. `chart`
  may already be installed.
- BUG-01 fix — blocks Tab 2 export script correctness. Does NOT block Tab 1.
- `DevTabProvider` context — blocks tab refresh in all tabs. Genuinely pre-work.
- `DevTabId` union type update — blocks type-safe tab routing. Genuinely
  pre-work.
- `.gitignore` additions — does not block development. Can be added during Tab 2
  build.
- `prebuild` npm script — blocks production build. Does not block development
  iteration.

Tab 1 (Health) has clean data (ecosystem-health-log is not broken,
health-score-log is not broken, warnings.jsonl is not broken). The only true
pre-work for Tab 1 is: package installs (recharts + badge + tooltip shadcn
components), `DevTabProvider`, and the `DevTabId` type update. BUG-01 and
TanStack installs are irrelevant to Tab 1.

**Evidence for the challenge:**

- The research's own implementation phasing (Section 13) places Tab 4 (Pipeline)
  and Tab 2 (Debt) first in Phase 2 — not Tab 1. Tab 1 is placed in Phase 3 as
  "medium complexity." If Tab 1 were started first (as an alternative), the gate
  could be lighter.
- The "complete all pre-work then start tabs" model creates a large front-load
  with no visible progress. For a solo developer, visible progress (a working
  Tab 1) is motivating.
- BUG-01 is a single `.toUpperCase()` call. It takes 5 minutes. Including it in
  a formal "gate" step that implies it must precede all tab work adds process
  theater to a trivial fix.

**Evidence against the challenge:**

- Installing packages piecemeal (install recharts for Tab 1, then install
  TanStack when you reach Tab 2) creates repeated context-switch overhead.
  Batching package installs is a genuine efficiency.
- The pre-work gate also creates `DevTabProvider` and updates `DevTabId` — these
  are shared infrastructure that every tab depends on. Starting a tab before the
  provider exists means either building without it (technical debt) or doing the
  provider work mid-tab (interrupting flow).
- BUG-01 being trivial is an argument for fixing it immediately, not for
  deferring it. Five minutes now vs discovering it causes incorrect data in Tab
  2 during a test run.

**Verdict: WEAKENED** — the gate conflates genuinely shared pre-work
(DevTabProvider, DevTabId, package installs) with Tab 2-specific work (TanStack,
MiniSearch, BUG-01). A cleaner gate would be: "shared pre-work for all tabs"
(provider, type, recharts, badge/tooltip shadcn) vs "Tab 2 pre-work" (TanStack,
MiniSearch, BUG-01). This allows Tab 1 to start earlier and demonstrates the
pattern before committing to the full approach. The current single-gate framing
is not wrong, but it is unnecessarily conservative.

---

## Challenge 7: Process Compliance Folded into Tab 4

**Claim challenged:** Folding T7 (Hygiene/Process Compliance) into Tab 4 (Build
Pipeline) is the right call.

**Contrarian position:** The research describes Tab 4 as answering "What
happened in this session and how compliant is the automation?" The "this
session" framing is temporal — it is a session log view. Process compliance
(hook bypass rates, auto-fix frequency, retro follow-through rates) is a
longitudinal view — it answers "how are we doing over time?" These two questions
have different temporal granularities and different action triggers.

Mixing them creates a tab with two distinct user intents:

1. **Session review intent** (end of session): "What hooks ran? What was
   overridden today?" — uses hook-runs, override-log, agent-invocations.
2. **Process audit intent** (weekly/monthly): "Is our compliance improving? Are
   we following through on retro action items?" — uses historical bypass rates,
   retro completion tracking.

Session review is the daily Tab 4 use case. Process audit is the weekly Tab 5
adjacent use case. Folding process compliance into Tab 4 means the session
review is cluttered with infrequently-needed longitudinal compliance charts, and
the compliance analysis is buried inside a tab that users open for daily session
logs.

The research even highlights this tension: G33 (no retro follow-through data
source) is listed as a BLOCKS-severity gap in Tab 4. If the data for the
compliance section doesn't exist, and the section is mixed with session data,
Tab 4 becomes a partially broken tab rather than a clean session log.

**Evidence for the challenge:**

- G33 is explicitly BLOCKS-severity. The "Process Compliance Section" within Tab
  4 cannot function. Yet the tab is placed in Phase 2 (high-value, early build).
  Building Tab 4 early means building a tab that is visibly broken from day one.
- Tab 5 (Governance) is the natural home for longitudinal compliance data — it
  already contains audit history, override analysis at the ecosystem level, and
  agent quality metrics. Process compliance fits that theme better than "session
  log."
- The 3 BLOCKS gaps in Tab 4 are all in the Process Compliance sub-section: G29
  (velocity), G30 (commit log), G33 (retro follow-through). Zero BLOCKS are in
  the session log sub-section. The BLOCKS are concentrated in the compliance
  portion, not the pipeline portion.

**Evidence against the challenge:**

- The user made this grouping decision in Session #245. It is a locked decision,
  not a research recommendation.
- Override rates and auto-fix rates are directly readable from hook-runs.jsonl —
  this data is available and does belong alongside the hook run timeline.
- The "session" framing naturally encompasses compliance: did this session's
  hooks pass? How many were overridden? This is not a different question, it is
  the same question at different zoom levels.
- Showing compliance in the session tab creates a feedback loop: open the tab
  after a session, see the override count, and immediately have context to
  decide whether to investigate.

**Verdict: WEAKENED** — the folding is defensible as a user-decision that holds,
but the BLOCKS concentration in the compliance sub-section is a real
implementation risk. Phase 2 Tab 4 will ship with explicit "Data Unavailable"
states in 3 compliance widgets. This is acceptable only if those states are
clearly labeled and do not make the tab look unfinished for the session log
portion. The `/deep-plan` phase should confirm that the Tab 4 BLOCKS are
cosmetically contained (not visually dominant) so the working session log
portion gets appropriate prominence.

---

## Challenge 8: Tab 6 (Planning) Should It Be Deferred?

**Claim challenged:** Tab 6 (Planning & Research) should be built as specified,
despite its data quality gaps.

**Contrarian position:** Tab 6 has the weakest data position of any tab:

- 4 research index entries (total, ever)
- 8 deep-plan state files with 4 incompatible schema shapes
- A Sprint Board that depends on parsing markdown checkboxes from ROADMAP.md
- Lifecycle scores shared with Tab 1 (not unique to Tab 6)
- No dedicated data source that is not either sparse (4 entries), fragmented (4
  state file schemas), or already covered elsewhere (lifecycle scores)

The research places Tab 6 in Phase 4 ("lower priority") and explicitly notes it
as a "point-in-time" source for lifecycle scores. The gaps are G46 (in-flight
research not indexed) and G47 (state file schema fragmentation). These are
DEGRADES, not BLOCKS — but the substance of what Tab 6 shows when it works is
thin:

- 4 research history cards
- A handful of active plan status badges
- 81 ROADMAP tasks in a kanban view (but ROADMAP parsing requires
  `resolve-dependencies.js --json` which was just confirmed working in INV-1)
- Shared lifecycle score matrix (Tab 1 already shows this)

The kanban view of ROADMAP.md is genuinely useful. But the research history
section (4 cards) and the active plan section (state file badges) add so little
signal that they might not justify a full tab. Could the ROADMAP kanban live as
a widget in Tab 1 (Health) or as a standalone panel in the header widget area?

**Evidence for the challenge:**

- The research's own phasing puts Tab 6 last, after Tab 5 (Governance) which
  already has sparse data.
- 4 research entries is not a tab's worth of data. By the time Tab 6 is built
  (Phase 4), it might have 6-8 entries — still sparse.
- Schema fragmentation (G47) means the export script must handle 4 distinct
  normalization paths for deep-plan state files. This is non-trivial engineering
  effort for a sparse data source.
- The lifecycle score matrix is already displayed in Tab 1. Showing it again in
  Tab 6 creates redundancy without clear benefit.
- No unique data source exists in Tab 6 that is not covered elsewhere or
  shareable as a widget in another tab.

**Evidence against the challenge:**

- The ROADMAP kanban is legitimately distinct from the other tabs. It answers
  "what can I work on next?" — a question that does not fit cleanly into Health,
  Debt, Reviews, Pipeline, or Governance.
- Research history and active plan tracking will grow over time. A tab that is
  sparse today becomes valuable once the project has 20+ research sessions and
  multiple concurrent deep-plans.
- Deferring Tab 6 is not the same as building a better structure — it just means
  the planning data has no home, which may cause it to be forgotten entirely.
- The `resolve-dependencies.js --json` confirmation (INV-1/Q1) means the hardest
  technical problem in Tab 6 (ROADMAP parsing) is already solved.

**Verdict: WEAKENED** — Tab 6 as specified is a full tab built around sparse,
fragmented data that will not justify its own tab until research and planning
activity scale up significantly. A more honest design: build only the ROADMAP
kanban widget in Phase 4 (or defer to Phase 2 as a lightweight addition to an
existing tab), and hold the research history + plan status features until the
data volume warrants them. Building a full "Planning" tab for 4 research entries
and 8 state files imposes engineering cost that the data does not yet justify.

---

## Overall Assessment

| Challenge                      | Verdict  | Severity                                                                                              |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| 1. 6-tab structure             | WEAKENED | Medium — cadence data absent; low-cadence tabs risk being forgotten                                   |
| 2. Hybrid fetch architecture   | HOLDS    | Low — architecturally forced; existing codebase precedent                                             |
| 3. Static JSON budget          | WEAKENED | Medium — S1 initial-load is speculative prefetch; ceiling ≠ target                                    |
| 4. TanStack Table for 1 tab    | HOLDS    | Low — multi-tab reuse amortizes cost                                                                  |
| 5. Recharts for 5/6 tabs       | HOLDS    | Low — shadcn transitive dependency likely already present                                             |
| 6. Pre-work gate weight        | WEAKENED | Low-Medium — gate conflates shared and tab-specific work                                              |
| 7. Process Compliance in Tab 4 | WEAKENED | Medium — BLOCKS concentration in compliance sub-section risks making tab look broken                  |
| 8. Tab 6 deferral case         | WEAKENED | Medium — 4 research entries and 4-schema state files do not justify a full tab at current data volume |

### Highest-Risk Issues for /deep-plan

1. **Tab 4 ships with 3 BLOCKS in its compliance section** (G29, G30, G33). If
   those broken widgets are visually prominent, Tab 4 will look unfinished
   despite having working session log data. Plan needs explicit widget state
   designs for "Data Unavailable."

2. **Tab 6 data volume does not yet justify a full tab.** The ROADMAP kanban is
   the only widget with real substance today. Consider a minimum-viable
   "Planning" section (kanban only) rather than a full 6th tab.

3. **S1 initial load (464 KB) on tab mount is speculative prefetch.** The plan
   should define a lazy-load trigger point for S1 items to reduce the perceived
   weight of Tab 2.

4. **No cadence analysis was done for tab usage frequency.** Tabs 5 and 6 have
   sub-weekly use cadences. Minimum-viable implementations for these two tabs
   would reduce Phase 4 scope without sacrificing daily-use value.

### What the Research Got Right

- BUG-01 identification and the `.toUpperCase()` fix are precise and actionable.
- The dual health score disambiguation (D/67 technical vs B/87 process) is a
  critical finding that prevents a misleading dashboard.
- The warning unification schema (lifecycle + hook-warnings normalization) is
  well-specified.
- The MASTER_DEBT S0+S1 / S2+S3 split is the right lazy-load decision for the
  largest file.
- INV-1 confirmations (resolve-dependencies.js, override-log canonical path,
  recharts React 19 compat) close real gaps with ground-truth verification.
