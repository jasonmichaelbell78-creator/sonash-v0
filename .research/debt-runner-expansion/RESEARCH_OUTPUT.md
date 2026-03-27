# Research Report: debt-runner Hybrid Expansion — CLI Write-Side + Web Dashboard Read-Side

**Generated:** 2026-03-27 **Revised:** 2026-03-27 (post-challenge re-synthesis —
V1-codebase, V2-data, contrarian-1, contrarian-2, otb-1, otb-2) **Agents:** 13
searcher agents + 2 verification agents + 4 challenge reviewers **Depth:** L3
**Confidence:** HIGH across all architectural decisions; 6 confirmed bugs;
MEDIUM on nuqs URL state compatibility with static export

---

## Table of Contents

1. Executive Summary
2. Critical Architectural Tension — Resolution
3. Data Flow Architecture
4. Key Findings by Theme
5. Capability Matrix — Read/Write Split
6. Web Dashboard: Data Layer
7. Web Dashboard: Table and Charting
8. CLI: Expanded Menu and Interaction Patterns
9. Discovery Agents
10. Bugs Confirmed
11. Gaps and Dark Debt — Re-Evaluated
12. Cross-Tab Synergies
13. Contradictions
14. Confidence Assessment
15. Recommendations (Revised Post-Challenge)
16. Implementation Phasing
17. Unexpected Findings and Creative Opportunities (OTB)
18. Challenges and Verification Summary
19. Open Questions for /deep-plan
20. Sources
21. Methodology

---

## 1. Executive Summary

The debt-runner expansion project delivers a hybrid Technical Debt Management
System (TDMS): the CLI remains the exclusive write-side (all intake, triage,
resolution, and mutation), while a new Dev Dashboard web tab provides a
read-side visual layer for browsing, filtering, charting, and navigating 8,472
debt items.

The defining architectural constraint is that `next.config.mjs` sets
`output: "export"`, making the web application a fully static SPA. API routes
work under `npm run dev` (Turbopack) but fail at `npm run build`. The selected
architecture keeps the web dashboard static, served from pre-built JSON
snapshots. However, a critical upgrade from contrarian review: during
`npm run dev` (the primary usage mode for a solo developer), API routes ARE
available. The PRIMARY recommendation is a hybrid fetch strategy: dev mode uses
an API route reading MASTER_DEBT.jsonl live; production falls back to static
`public/debt-data.json`. This eliminates staleness during actual development
usage.

Six bugs were confirmed in the current CLI scripts, two rated HIGH impact on the
web dashboard: BUG-01 (lowercase status strings that will break all web-side
status filters) and BUG-06 (metrics-log.jsonl missing `by_source` and
`by_category` fields required for web trend charts). These bugs must be fixed
before web development begins.

Verification agents confirmed 12 of 12 verifiable codebase claims and 12 of 14
data claims. Two factual corrections from verification: (1)
known-debt-baseline.json has approximately 40 entries across 3 categories, not
45+; (2) cluster_primary is a sparse field present in only 172 of 8,472 items
(~2% coverage) and must be treated as nullable. Two factual corrections from
challenge review: (3) Recharts and shadcn chart components are NOT installed and
must be ADDED; (4) static JSON for all items would be 7.6 MB — field stripping
to display-only fields is required to bring this to approximately 2 MB.

Challenge review produced four significant architectural upgrades: the hybrid
fetch strategy as the primary data-freshness approach; pre-generated AI
summaries as a build-time capability; a reduced initial discovery agent set (3
instead of 7, with a resolution-rate gate before expanding); and a recommended
4-phase implementation sequence where each phase delivers independent value and
has a clean stop point.

---

## 2. Critical Architectural Tension — Resolution

### The Constraint

`next.config.mjs` line 13: `output: "export"` [1]

This makes the web application a fully static SPA. API routes (`/api/*`) work
under `npm run dev` (Turbopack dev server) but fail at `npm run build` and are
absent from the deployed `out/` directory. The Firestore pattern in the
Lighthouse tab [2] works because it uses the Firebase client SDK directly — not
server-side API routes.

### Options Evaluated

| Option       | Description                                                                    | Verdict                                                              |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **A-Hybrid** | API route during `npm run dev` (live data); static JSON fallback in production | **SELECTED — PRIMARY**                                               |
| **A-Static** | SQLite for CLI only; static JSON built at build time for all web usage         | Previously selected; demoted to production fallback only             |
| B            | SQLite with API routes (requires removing `output: "export"`)                  | Rejected — changes deployment model, breaks static hosting           |
| C            | Firestore as single source of truth (sync CLI writes to Firestore)             | Rejected — adds auth/network dependency to CLI; offline-hostile      |
| D            | Client-side SQLite via WASM (sql.js or wa-sqlite)                              | Rejected — requires bundling 1.5 MB WASM; overkill for read-only use |

### Hybrid Fetch Strategy (PRIMARY)

**During `npm run dev`:** The debt tab fetches from an API route
(`/api/debt-data`) that reads `MASTER_DEBT.jsonl` directly from disk. Data is
always current. A "Refresh Data" button triggers a re-fetch without restarting
the dev server.

**During production build (`npm run build`):** API routes are unavailable. The
tab falls back to `fetch("/debt-data.json")` — the pre-built static snapshot. A
stale-data banner shows the build timestamp and "Data last refreshed [N] days
ago."

**Detection:** The tab component detects which mode it is in via
`process.env.NODE_ENV === "development"` and chooses the fetch target
accordingly.

This approach eliminates the staleness problem during actual development usage
(which is when the user interacts with the dashboard) while preserving static
hosting compatibility for production deployment.

### Static JSON for Production (FALLBACK)

**Web build path:** `MASTER_DEBT.jsonl` → `build-debt-data.js` (runs at
`npm run build`) → `public/debt-data.json` + `public/metrics-data.json` → static
SPA fetches at runtime

`build-debt-data.js` MUST read from `MASTER_DEBT.jsonl` directly, not from
`data/tdms.db`. This eliminates the SQLite build dependency and ensures the web
path works even if `better-sqlite3` is not installed.

**Field stripping is required:** Static JSON for all 20 fields per item would be
7.6 MB. The `build-debt-data.js` script must strip fields not needed for web
display. Stripping to the 7 default display columns reduces output to
approximately 2 MB (68% savings). Stripping to all 16 displayable columns (with
toggles) lands around 3-4 MB. The 7.6 MB figure should not appear anywhere in
planning documents as an acceptable target.

**Git housekeeping:** `public/debt-data.json` should be added to `.gitignore` —
it is a build artifact, and committing it on every rebuild would add ~7 MB per
commit to git history.

### SQLite Scope (OPTIONAL — CLI only)

SQLite (`better-sqlite3`) remains valid for CLI query acceleration. However:

1. **It is optional.** `better-sqlite3` requires native compilation via
   `node-gyp`. On Windows, this requires Python and MSVC Build Tools. If
   `better-sqlite3` fails to install, the entire system must continue to work
   via JSONL directly. `build-debt-data.js` MUST read from JSONL, not SQLite.
2. **The 179ms full JSONL parse time is adequate** for interactive CLI
   operations. A solo developer will not notice the difference between 179ms and
   5ms SQLite.
3. **SQLite can be deferred entirely** until JSONL becomes a bottleneck (around
   20,000-25,000 items based on linear I/O scaling).

**Windows compilation risk:** `better-sqlite3` distributes prebuilt binaries for
common platform/arch/Node combinations. Node.js 22 on Windows x64 may have a
prebuilt available; if not, installation fails hard. Verified on this machine:
MSVC (`cl.exe`) is not available. If the prebuilt binary is absent, installation
requires Visual Studio Build Tools — a ~6 GB download. Make SQLite optional;
never make it a required dependency for the web path.

**Alternative:** `sql.js` (SQLite compiled to WebAssembly) requires zero native
compilation and works identically on Windows, Mac, and Linux. It is 2-5x slower
than `better-sqlite3` but for 8,472 records the difference is negligible.

---

## 3. Data Flow Architecture

```
WRITE PATH (CLI only)
─────────────────────
External sources
 ├─ Git hooks (pre-commit, pre-push)
 ├─ CI workflows (resolve-debt.yml, audit-intake.yml)
 ├─ Manual: /add-debt, /debt-runner
 └─ Discovery agents (3 initial types, expandable)
         │
         ▼
    intake-audit.js ──► MASTER_DEBT.jsonl (8,472 items)
         │                      │
         │              generate-metrics.js
         │                      │
         │              metrics.json + metrics-log.jsonl
         │                      │
         │              [Optional] sync-to-sqlite.js
         │                      │
         │                 data/tdms.db (better-sqlite3, optional)
         │
    build-debt-data.js   ← reads MASTER_DEBT.jsonl DIRECTLY (not SQLite)
    (runs at npm run build; field-strips to display fields)
         │
    ┌────┴────────────────────┐
    ▼                         ▼
public/debt-data.json    public/metrics-data.json
(~2 MB field-stripped)   (summary metrics + AI insights)

READ PATH (Web Dashboard)
─────────────────────────
npm run dev mode:
  fetch("/api/debt-data")  ←── API route reads MASTER_DEBT.jsonl live
         │
         ▼
  DebtTab (TanStack Table v8 + TanStack Virtual v3)

production mode:
  fetch("/debt-data.json") ←── static snapshot (~2 MB field-stripped)
         │
         ▼
  DebtTab (same component, different data source)

Both modes:
  MiniSearch inverted index (client-side search)
  Recharts (via shadcn/ui chart — must be ADDED: npx shadcn@latest add chart)
  Clipboard → /debt-runner commands (web→CLI handoff, V1 mechanism)
  Firestore dev/debt/*  (annotations only — consider localStorage first)
```

---

## 4. Key Findings by Theme

### Theme 1: Static Export is the Load-Bearing Constraint — But Dev Mode Has an Escape Hatch

Every production web-side decision flows from `output: "export"` [1]. This
eliminates API routes, server-side rendering, and server-computed responses in
the deployed build. However, during `npm run dev` (Turbopack), API routes ARE
available. This was identified in SQ2 [2], SQ4a [4], SQ4b [5], SQ5 [6], and
confirmed by contrarian review as a missed opportunity.

The distinction is critical: the user runs `npm run dev` for day-to-day usage.
They run `npm run build` for deployment. The dashboard is a dev tool. Data
staleness during `npm run dev` would be the normal case without the hybrid
approach — potentially missing hundreds of resolutions visible via CLI but
invisible in the dashboard.

### Theme 2: Field-Stripped Build-Time JSON Closes the Production Gap

`build-debt-data.js` bridges CLI data to production web display. It runs during
`npm run build`, reads `MASTER_DEBT.jsonl` directly, and writes field-stripped
JSON:

- `public/debt-data.json` — display-only fields, approximately 2 MB (7 default
  columns; not the 7.6 MB full-field version)
- `public/metrics-data.json` — summary metrics + pre-generated AI insights (see
  Theme 9)

**Field stripping is not optional.** Full-field export is 7.6 MB. Stripping
unused fields (content_hash, original_id, merged_from, verified_by,
recommendation) to the 7 default display columns reduces this to approximately 2
MB. The `build-debt-data.js` script must define which fields are exported and
strip the rest.

### Theme 3: Two Bugs Must Be Fixed Before Web Development Starts

BUG-01 and BUG-06 are HIGH impact on the web dashboard [9]:

**BUG-01:** `debt-health.js` uses lowercase status strings (`resolved`,
`closed`) but canonical status values in MASTER_DEBT.jsonl are uppercase
(`RESOLVED`). The filter at `debt-health.js` line 65 — `d.status !== "resolved"`
— never matches any record. All items including resolved ones are treated as
open when calculating average age. If the web fetches `debt-data.json` and
filters by `status === "Open"`, it returns 0 results.

**BUG-06:** `logMetricsGeneration()` in `generate-metrics.js` writes only
`{timestamp, total, open, resolved, s0_alerts, s1_alerts}` to
`metrics-log.jsonl`. The `by_source` and `by_category` fields ARE computed and
written to `metrics.json` but absent from all 113 existing log entries. Any web
trend chart reading historical breakdown from `metrics-log.jsonl` will find
those fields missing from all 113 existing entries.

Both fixes are contained changes in existing scripts. Fix before web tab
development.

### Theme 4: The Table Layer Determines Usability

The 8,472-record dataset requires row virtualization — traditional pagination
requires a server (eliminated by static export in production) and interrupts
browsing flow. TanStack Virtual v3 [10] renders only visible rows (~30-50) at
any time, maintaining 60fps scroll even with the full dataset loaded in memory.

**Virtualization tradeoff:** Only ~30-50 rows exist in the DOM at any time.
Browser Ctrl+F search finds nothing for off-screen rows. The search input
(MiniSearch, see Theme 6) must be prominently positioned above the table to
replace this muscle memory. This tradeoff is acceptable but must be acknowledged
in the UI design.

TanStack Table v8 [10] provides headless table logic (sorting, filtering,
grouping, column visibility) with zero rendering opinions. At ~15.2 kB gzipped
it is the lightest option evaluated. AG Grid (298 kB) was rejected.

### Theme 5: Clipboard is a V1 Handoff Mechanism (Not Final Architecture)

The web dashboard is a static SPA with no filesystem access. All web-to-CLI
handoff in V1 uses `navigator.clipboard.writeText()` to copy a `/debt-runner`
command string [6]. The user pastes the command into their Claude session.

**This is the MVP approach, not the final answer.** During `npm run dev`, full
server capabilities are available — a localhost API bridge could execute
commands directly. This should be evaluated for V2. Three existing clipboard
patterns in the codebase [6] confirm copy-to-clipboard is an established project
primitive, making V1 consistent with existing UX patterns.

### Theme 6: MiniSearch for Client-Side Search

Fuse.js (originally recommended) performs fuzzy matching by iterating through
all records on every keystroke — estimated 20-80ms per keystroke for 8,472
records across 4 fields. MiniSearch builds a proper inverted index (like SQLite
FTS5) in memory:

- Supports boolean queries and prefix matching
- Approximately 3 kB gzipped
- Faster than Fuse.js for large datasets because it uses an index rather than
  brute-force scanning
- Does not support regex, but covers the primary use cases (ID lookup, title
  search)

Replace Fuse.js recommendation with MiniSearch. For Tier 3 power filters (regex
on description), retain the existing `Array.filter()` approach.

### Theme 7: Discovery Agents — Start With 3, Gate Before Expanding

The original recommendation of 7 discovery agents was revised by contrarian
review. The backlog already has 7,282 open items with a 13.2% resolution rate
(1,116 resolved / 8,472 total). Adding 123-305 items per full 7-agent discovery
run at the current resolution pace (~20 items/week) means the backlog grows
faster than it shrinks.

**Revised recommendation:** Start with 3 agents that have the highest unique
signal and lowest overlap with existing tools:

1. `config-drift-detector` — finds config files out of sync with code reality
   (no existing tool covers this)
2. `architectural-boundary-checker` — finds cross-layer imports and coupling
   violations (no existing tool covers this)
3. `integration-verifier` — finds script integration gaps and missing handoffs
   (routes confirmed gaps directly to resolution)

**Resolution-rate gate:** Before adding additional agents, require the open
backlog to be below 7,000 items OR resolution rate to be above 20%. When the
user selects discovery mode, warn: "Your backlog is growing faster than you can
resolve. Resolution rate: 13.2%. Recommend focusing on resolution before
expanding intake."

**Individual agent selection:** The discovery mode should present a menu of
agent types, not run all agents at once. Allow the user to pick which agents to
run.

**Token cost transparency:** Estimate and display token cost before running
discovery agents (~$0.05-0.15 per agent depending on model). Ask for
confirmation before spawning.

The 4 deprioritized agents (dead-code-detector, test-coverage-analyzer,
type-safety-scanner, performance-regression-detector) have significant overlap
with existing tools (ESLint no-unused-vars, TypeScript strict mode, SonarCloud)
and would add items likely already in the backlog.

### Theme 8: metrics.json as Dashboard Hub

`docs/technical-debt/metrics.json` [8] is generated by `generate-metrics.js` and
contains: `summary` (total, open, resolved, false_positives,
resolution_rate_pct), `by_status`, `by_severity`, `by_category`, `by_source`. It
is updated every time debt-runner runs.

A `useDebtMetrics()` hook consuming `public/metrics-data.json` serves as a
shared data source for dashboard tabs [13]. Cross-tab synergies should be
deferred until target tabs actually exist — building shared hooks for tabs that
have no data source is premature architecture.

### Theme 9: Pre-Generated AI Summaries (New — from OTB-1)

The `build-debt-data.js` script runs at build time with the full dataset in
memory. It can make one Claude API call to generate natural-language insights
baked into `public/debt-insights.json`:

Example output: "The 3 oldest S0 items (DEBT-00142, DEBT-00389, DEBT-01204) have
been open for 41, 38, and 33 days respectively. None are assigned to any sprint.
The fastest-growing debt category this week is code-quality (+142 items)."

This transforms the KPI panel from numbers to interpret into insights to act on.
The web tab renders these bullets in a "Insights" card above the KPI panel.
Requirements: Anthropic API key in `.env.local` or CI secrets; one API call per
build (~$0.01-0.03); fallback for offline builds (skip insights, serve previous
`debt-insights.json` or a placeholder).

This is rated HIGH value, SOON feasibility — requires only ~30 lines added to
`build-debt-data.js` plus one React card component.

---

## 5. Capability Matrix — Read/Write Split

Full 27-capability breakdown:

| #   | Capability                   | CLI         | Web               | Notes                                                                        |
| --- | ---------------------------- | ----------- | ----------------- | ---------------------------------------------------------------------------- |
| 1   | Intake new debt items        | W           | —                 | intake-audit.js                                                              |
| 2   | Triage (set severity/status) | W           | —                 | triage-debt.js                                                               |
| 3   | Resolve single item          | W           | —                 | resolve-debt.js                                                              |
| 4   | Bulk resolve                 | W           | —                 | resolve-bulk.js                                                              |
| 5   | Add annotation               | W           | Generates command | Web copies /add-debt command                                                 |
| 6   | Run discovery agents         | W           | —                 | spawn-agents.js (3 initial)                                                  |
| 7   | Dedup scan                   | W           | —                 | dedup-debt.js                                                                |
| 8   | Generate metrics             | W           | —                 | generate-metrics.js                                                          |
| 9   | Sync to SQLite               | W           | —                 | sync-to-sqlite.js (new, optional)                                            |
| 10  | Build static JSON            | W           | —                 | build-debt-data.js (new, field-strips to ~2 MB)                              |
| 11  | View all items (table)       | R           | R                 | CLI: jq queries; Web: TanStack Table                                         |
| 12  | Filter by status             | R           | R                 | CLI: --status flag; Web: filter panel                                        |
| 13  | Filter by severity           | R           | R                 | CLI: --severity flag; Web: filter panel                                      |
| 14  | Filter by category           | R           | R                 | Web: dropdown; CLI: --category flag                                          |
| 15  | Search (inverted index)      | —           | R                 | MiniSearch; CLI has grep/jq                                                  |
| 16  | Trend charts                 | —           | R                 | Recharts (must be added) + metrics-log.jsonl                                 |
| 17  | KPI panel                    | —           | R                 | 6 cards: total, S0, resolved, rate, staleness, top-category                  |
| 18  | AI insights panel            | —           | R                 | Pre-generated at build time from Claude API                                  |
| 19  | Export CSV                   | —           | R                 | papaparse                                                                    |
| 20  | Export JSONL                 | —           | R                 | raw download                                                                 |
| 21  | Discovery panel              | —           | R                 | discovery-runs.jsonl display                                                 |
| 22  | Override promotion view      | —           | R                 | override-log.jsonl; promote button copies CLI command                        |
| 23  | Warning promotion view       | —           | R                 | hook-warnings-log.jsonl; promote button                                      |
| 24  | Dark debt status view        | —           | R                 | known-debt-baseline.json cross-ref display (~40 entries across 3 categories) |
| 25  | Health report                | CLI primary | R summary         | check-backlog-health.js; web shows summary                                   |
| 26  | Source breakdown             | R           | R                 | by_source in metrics.json                                                    |
| 27  | Session delta                | —           | R                 | metrics-log.jsonl consecutive entries                                        |

**Unidirectional principle:** CLI computes, web renders. The web never writes to
MASTER_DEBT.jsonl, metrics.json, or any TDMS file. All mutation is CLI-side.

---

## 6. Web Dashboard: Data Layer

### Hybrid Fetch Strategy (Primary)

**Dev mode (`npm run dev`):** API route `/api/debt-data` reads
`MASTER_DEBT.jsonl` from disk on each request. Returns field-stripped JSON array
in real time. A "Refresh" button in the tab header re-fetches without page
reload.

**Production mode:** Static `public/debt-data.json` fetched at tab mount.
Stale-data banner shown when `buildTimestamp` is more than 24 hours old.

**Detection pattern in `debt-tab.tsx`:**

```typescript
const apiUrl =
  process.env.NODE_ENV === "development" ? "/api/debt-data" : "/debt-data.json";
```

### Static JSON Build (Production Fallback)

**New script: `build-debt-data.js`**

- Reads `MASTER_DEBT.jsonl` DIRECTLY (not from SQLite — eliminates build
  dependency)
- Strips fields to display-only set (targeting ~2 MB, not 7.6 MB)
- Writes `public/debt-data.json` — field-stripped JSON array
- Writes `public/metrics-data.json` — summary metrics + buildTimestamp
- Optionally calls Claude API to generate `public/debt-insights.json`
- Add `public/debt-data.json` and `public/debt-insights.json` to `.gitignore`
- Runs as `"prebuild": "node scripts/build-debt-data.js"` in package.json

**Fields to strip from web output:** `content_hash`, `original_id`,
`merged_from`, `verified_by`, `recommendation` (and any other fields with no
corresponding web table column).

### SQLite Schema (CLI Layer — Optional)

If `better-sqlite3` installs successfully, four tables in `data/tdms.db` [11]:

1. **debt_items** — all records; `cluster_primary` declared NULLABLE (2%
   coverage, 172/8,472 items — verified sparse field)
2. **metrics_snapshots** — mirrors metrics-log.jsonl entries; extended with
   by_source and by_category (BUG-06 fix)
3. **intake_log** — per-intake run metadata
4. **resolution_log** — per-resolution record

FTS5 full-text search on title + description + file fields. 25+ indexes covering
all filter/sort columns. 10 SQL views for dashboard query patterns.

**If better-sqlite3 fails to install:** The sync-to-sqlite.js script is skipped.
build-debt-data.js reads from MASTER_DEBT.jsonl. CLI query modes use JSONL with
jq. Nothing breaks.

### Annotations: localStorage First

Start with `localStorage` for per-item annotations, not Firestore. This is a
solo-developer tool; cross-device persistence is not a launch requirement.
Firestore migration path available if annotation volume grows or cross-device is
needed. This avoids the "no Firebase needed" / "Firestore for annotations"
contradiction in the executive summary — localStorage is genuinely
Firebase-free.

### Data Integrity Notes (from Verification)

- `cluster_primary` field: 172 of 8,472 items (~2% coverage). The SQLite schema
  MUST declare this column `NULLABLE`. Web UI components MUST handle null/absent
  values for this field. Do not assume universal presence.
- `known-debt-baseline.json`: approximately 40 file-level entries across 3
  baseline categories (`raw-error-message`: 1 pattern, `cognitive-complexity`:
  22 file-level, `cyclomatic-complexity`: 16 file-level). It is a nested JSON
  object, not a flat list of 45+ entries.

---

## 7. Web Dashboard: Table and Charting

### Dependencies — Verified Against package.json

| Package                    | Size (gzipped) | Role                                | Status                                    |
| -------------------------- | -------------- | ----------------------------------- | ----------------------------------------- |
| @tanstack/react-table v8   | ~15.2 kB       | Headless table logic                | Must be ADDED                             |
| @tanstack/react-virtual v3 | ~3.9 kB        | Row virtualization                  | Must be ADDED                             |
| recharts                   | ~35-40 kB      | Charts                              | Must be ADDED (NOT in project; see below) |
| minisearch                 | ~3 kB          | Client-side search (inverted index) | Must be ADDED (replaces Fuse.js)          |
| papaparse                  | ~5 kB          | CSV export                          | Must be ADDED                             |
| nuqs                       | ~8 kB          | URL state                           | Skip for v1 — use useState                |

**Recharts is NOT currently installed.** Verification confirmed no charting
libraries exist in `package.json` (grep for recharts, chart.js, d3, victory,
nivo, visx, tremor, apexcharts, highcharts, echarts — all absent). The shadcn/ui
chart component (`components/ui/chart.tsx`) has NOT been added to this project.

**Installation path:** Run `npx shadcn@latest add chart` to add the shadcn chart
component. This pulls Recharts as a dependency and provides the CSS variable
bridge for dark mode theming. Do not install Recharts directly.

**react-is compatibility:** Recharts v3 uses `react-is` internally. Verify React
19.2.4 compatibility before committing. Add to `package.json` if needed:

```json
"overrides": { "react-is": "^19.0.0" }
```

If this override fails or Recharts has React 19 breaking changes, fallback
options: Tremor (built on Recharts, actively tests against React 19) or uPlot
(~13 kB, canvas-based, minimal React surface area).

The chart CSS variables (`--chart-1` through `--chart-5`) ARE present in
`globals.css` — confirmed in both light and dark mode. No charting library is
needed to use these variables; they are ready for whichever library is
installed.

**nuqs skipped for v1:** nuqs compatibility with `output: "export"` + Next.js 16
App Router is a three-way compatibility question that has not been validated. A
solo user with a single dashboard instance does not need shareable URLs. Use
`useState` for all filter state in v1. Add URL state in v2 if the need is
demonstrated.

### Table Configuration

**Default visible columns (7):** ID, Title, Severity, Status, Category, File,
Age (days)

**Togglable columns (9):** Source, Created, Resolved, Actor, Resolution Method,
Description, Priority Score, TRIAGED flag, Annotation badge

**Sort:** 9 columns; multi-column with Shift+click; default sort: Severity DESC,
then Age DESC

**Filter tiers:**

- Tier 1 (always visible): Status, Severity
- Tier 2 (collapsible panel): Category, Source, Age range, Has annotation
- Tier 3 (power user, v2): Regex match on description

**Grouping modes (7):** By Severity, By Category, By Source, By Status, By File
(directory), By Age Bucket, No grouping

**Search UX note:** With row virtualization, Ctrl+F finds nothing for off-screen
rows. The MiniSearch input must be positioned prominently at the top of the tab
with clear labeling (e.g., "Search items — replaces Ctrl+F"). This is not
optional UX; it is a required mitigation for the virtualization tradeoff.

### Chart Types (6)

1. **Trend line** — total open count over time (metrics-log.jsonl; 113 entries =
   53-day history)
2. **Alert trend** — S0 + S1 counts over time
3. **Velocity** — items resolved per week
4. **Distribution donut** — by severity (current snapshot)
5. **Category bar** — top 10 categories by open count
6. **Source breakdown** — by_source stacked bar

KPI cards (6): Total items, S0 critical, Resolved (total), Resolution rate %,
Data freshness, Top category

**AI Insights card (new):** Positioned above KPI cards. Shows 3-5 pre-generated
natural-language bullets from `debt-insights.json`. Includes a footer: "Insights
generated at last build" with the build timestamp.

---

## 8. CLI: Expanded Menu and Interaction Patterns

### 10-Mode Menu Structure

```
debt-runner v2 — Technical Debt Manager
────────────────────────────────────────
  REVIEW
    [1] View dashboard summary          (metrics + S0/S1 alerts)
    [2] Browse items                    (filter/sort/view)
    [3] Health report                   (backlog health analysis)

  ACT
    [4] Triage items                    (set severity, assign)
    [5] Resolve item                    (single resolution)
    [6] Bulk resolve                    (batch by filter)
    [7] Add new item                    (manual intake)

  DISCOVER
    [8] Run intake scan                 (audit existing code)
    [9] Run discovery agents            (select from 3 types — see below)

  MAINTAIN
    [10] Dark debt review               (overrides + baselines)
    [0] Exit

  [G] Guided mode  ←── DEFAULT for first session; press [E] for expert menu
```

Mode 3 (7 existing) expanded to 10 by adding: Intake Scan (8), Discovery Agents
(9), Dark Debt Review (10).

**Discovery agents (Mode 9) as sub-menu:** When the user selects [9], they see:

```
Discovery Agents — Select types to run:
  [A] config-drift-detector      (unique signal; ~5-15 items)
  [B] architectural-boundary-checker  (unique signal; ~10-30 items)
  [C] integration-verifier       (routes directly to resolution; ~3-10 items)
  [ALL] Run all 3 agents         (estimated: 18-55 items, ~4-6 min)

  Warning: Backlog resolution rate is 13.2% — below 20% threshold.
  Adding more items without improving resolution worsens backlog health.
  Estimated token cost: ~$0.15. Proceed? [Y/N]
```

### Guided Mode — Default for Non-Developer User

Guided Mode is the DEFAULT entry point. Non-developer outcome language. The
numbered menu is available via [E] as an expert escape hatch.

User selects from outcome statements:

- "I want to reduce my S0 critical alerts" → routes to Mode 1 + Mode 5 for S0
  items
- "I want to understand what kind of debt I have" → routes to Mode 2 with
  category grouping
- "I want to find debt I didn't know about" → routes to Mode 9 (discovery
  agents) with resolution-rate warning
- "I want to clean up old overrides" → routes to Mode 10
- "I want to see if we're making progress" → routes to Mode 1 + trend view

Delegation triggers (canonical list from SQ10 [15]):

- > 100 items matching a filter → "This looks like a batch operation. Recommend
  > /debt-runner bulk mode or spawning an agent."
- > 30 minutes estimated → "This may take a while. Recommend running in
  > background or delegating to an agent."
- Security-category items → "Security debt changes should be reviewed. Recommend
  security-auditor agent."
- S0 alert active → "You have N critical alerts. Address before other work?"

### Web-Reference Messages (6 Templates)

When CLI output would benefit from visual context, display:

1. After `View dashboard summary`: "For trend charts and full browsing: open Dev
   Dashboard → Debt tab"
2. After discovery agent run: "Discovery results visible in Dev Dashboard → Debt
   tab → Discovery panel"
3. After bulk resolve: "Resolution history chart available in Dev Dashboard →
   Debt tab → Trends"
4. When filter returns >50 items: "Use Dev Dashboard for visual browsing of
   large result sets"
5. Dark debt review complete: "Override promotion status visible in Dev
   Dashboard → Overrides tab"
6. After metrics generation: "Full metrics dashboard at Dev Dashboard → Debt tab
   → KPIs"

---

## 9. Discovery Agents

### 3 Initial Agent Types (Revised from 7)

| Agent                          | Focus                                      | Unique Signal                              | Typical Yield |
| ------------------------------ | ------------------------------------------ | ------------------------------------------ | ------------- |
| config-drift-detector          | Config files out of sync with code reality | HIGH — no existing tool covers this        | 5-15 items    |
| architectural-boundary-checker | Cross-layer imports, coupling violations   | HIGH — no existing tool covers this        | 10-30 items   |
| integration-verifier           | Script integration gaps, missing handoffs  | HIGH — routes confirmed gaps to resolution | 3-10 items    |

**Deferred (overlap with existing tools):**

| Agent                           | Overlapping Tool                      | Reason for Deferral                                             |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| dead-code-detector              | ESLint no-unused-vars, tree-shaking   | High overlap; 2,561 SonarCloud items likely cover many findings |
| type-safety-scanner             | TypeScript strict mode, SonarCloud    | High overlap with existing TypeScript enforcement               |
| test-coverage-analyzer          | Coverage tooling (if configured)      | Overlapping; lower unique signal                                |
| performance-regression-detector | Bundle analysis, existing perf checks | Lower priority until backlog resolution rate improves           |

**Resolution-rate gate before expanding:** If open backlog < 7,000 items OR
resolution rate > 20%, the deferred agents can be added. These thresholds ensure
discovery runs accelerate progress rather than worsen the
intake-without-resolution spiral.

### TDMS-Output Protocol

All discovery agents produce output in Documentation Standards format [12]:

```
DEBT-XXXXX | category | severity | file | description | discovery_source=<agent-type>
```

Two gaps found in `intake-audit.js` [9]: missing `discovery_source` field
passthrough and missing `source_type` passthrough. Both must be fixed before
discovery agents are deployed.

`disallowedTools` for all discovery agents: Write, Edit, Agent (read-only
operation; no mutations during discovery).

### Web Discovery Panel

`discovery-runs.jsonl` (new file) stores per-run metadata: timestamp, agent
types used, items found, items accepted into MASTER_DEBT, items rejected
(duplicate/false positive). The web Discovery Panel displays run history with
acceptance rate per agent type.

---

## 10. Bugs Confirmed

Six bugs confirmed present in current scripts via direct code inspection [9].
V2-data verification confirmed BUG-01, BUG-03, and BUG-06 at specific file
locations:

| Bug    | Location                                         | Severity | Web Impact                                            | Fix                                                  |
| ------ | ------------------------------------------------ | -------- | ----------------------------------------------------- | ---------------------------------------------------- |
| BUG-01 | debt-health.js line 65 (lowercase status filter) | HIGH     | HIGH — breaks all status filters and age calculations | Normalize to uppercase at filter sites               |
| BUG-02 | No --dry-run flag on resolve commands            | MEDIUM   | LOW                                                   | Add --dry-run to resolve-debt.js, resolve-bulk.js    |
| BUG-03 | resolve-bulk.js missing sync-deduped.js call     | HIGH     | LOW (data integrity)                                  | Add sync-deduped.js call after bulk resolve          |
| BUG-04 | TRIAGED not in status schema                     | MEDIUM   | MEDIUM — TRIAGED items show as unknown                | Add TRIAGED to schema enum + handle in web filter    |
| BUG-05 | Shallow promotion (field copy, not deep clone)   | LOW      | LOW                                                   | Fix resolution object deep clone                     |
| BUG-06 | metrics-log.jsonl missing by_source/by_category  | HIGH     | HIGH — breaks trend charts                            | Expand logMetricsGeneration() in generate-metrics.js |

**Fix sequence:** BUG-01 → BUG-06 → BUG-03 → BUG-04 → BUG-02 → BUG-05

BUG-01 and BUG-06 must be fixed and metrics regenerated before any web tab
development, or the first render will show incorrect data. Additionally:
resolve-debt.yml CI workflow does not call generate-metrics.js after resolution,
and generate-metrics.js is absent from consolidate-all.js — these are structural
gaps in the pipeline that should be addressed in Phase 1.

---

## 11. Gaps and Dark Debt — Re-Evaluated

### MUST-HAVE for Hybrid Architecture (6 elevated)

| Gap     | Description                                                  | Why Elevated                                                                                        |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| GAP-04  | File metadata (directory, extension) missing from some items | Web file-tree grouping requires normalized file paths; also required for heat map future capability |
| GAP-07  | No sync freshness indicator                                  | Web stale-data banner requires build timestamp in data                                              |
| GAP-08  | Discovery source not tagged in MASTER_DEBT                   | Web Discovery Panel cannot show origin without this field                                           |
| GAP-14  | Resolution actor not recorded                                | Web resolution history requires actor field                                                         |
| DARK-02 | override-log.jsonl unregistered debt                         | Override tab synergy requires debt promotion pathway                                                |
| DARK-05 | metrics-log.jsonl missing by_source/by_category              | Same as BUG-06; trend charts depend on this                                                         |

### Status Changes from Pre-Plan Decisions

- GAP-01 (title dedup false positives): Downgraded from HIGH to MEDIUM —
  Levenshtein distance comparison adequate for current scale
- GAP-09 (CI timing): Downgraded — acceptable tradeoff
- GAP-13 (REMOVED): Was incorrect analysis — behavior is by design
- DARK-01 (known-debt-baseline.json): Reframed from "shadow store" to
  "pre-commit suppression list needing DEBT-XXXXX cross-reference" — not truly
  dark, but schema extension needed. Approximately 40 file-level entries across
  3 categories (not 45+ flat entries as originally reported)

### Remaining Gaps (Defer)

GAP-01 through GAP-19 excluding the 6 elevated above, and
DARK-01/DARK-03/DARK-04/DARK-06, are all defer-path candidates.

---

## 12. Cross-Tab Synergies

Full detail in `.research/debt-runner-expansion/SYNERGIES.md` [16].

### Priority Ranking

| Synergy                                         | ROI    | Effort | Blocking Dep                                                  |
| ----------------------------------------------- | ------ | ------ | ------------------------------------------------------------- |
| Overrides tab → Debt tab (DARK-02 closure)      | HIGH   | LOW    | override-log.jsonl already written                            |
| metrics-log.jsonl as shared trend source        | HIGH   | LOW    | BUG-06 fix required                                           |
| Warnings tab → Debt tab (occurrences threshold) | HIGH   | MEDIUM | hook-warnings-log.jsonl already written                       |
| Docs tab documentation badge → Debt tab         | MEDIUM | LOW    | 982 items already in MASTER_DEBT                              |
| Sessions tab debt delta row                     | MEDIUM | MEDIUM | metrics-log.jsonl; BUG-06 fix; sessions data source undefined |
| Lighthouse tab → Debt tab (route cross-link)    | LOW    | MEDIUM | v2+; requires route metadata on debt items                    |

**Important caveat (from OTB-2):** Cross-tab synergy infrastructure should be
deferred until target tabs actually exist. As of today:

- Error Tracing tab (B6): unbuilt, no Firestore path found
- Session Activity tab (B7): unbuilt, no data source defined
- Document Sync tab (B8): unbuilt
- Override Audit tab: unbuilt

Building shared hooks and cross-tab navigation props for consumers that may
never be built is premature optimization. Build the Debt tab as a standalone
component. Refactor shared infrastructure when the next tab is actually built.

### Shared Infrastructure (Defer to When Needed)

**R1: `useDebtMetrics()` hook** — reads `public/metrics-data.json` once on
mount; shared across tabs. Design now, implement when second tab needs it.

**R2: "Promote to Debt" button pattern** — reusable component
(PromoteToDebtButton) that generates a `/add-debt` CLI command pre-populated
from source data. Extract as shared utility from the start.

**R3: `discovery-runs.jsonl`** — shared data source for the Discovery panel.

**R4: Build timestamp propagation** — both JSON files include `buildTimestamp`.

### 3-File Change for Tab Shell

Adding the Debt tab requires exactly 3 file changes [13]:

1. `components/dev/dev-tabs.tsx` — add `"debt"` to `DevTabId` union and `TABS`
   array
2. `components/dev/dev-dashboard.tsx` — add
   `{activeTab === "debt" && <DebtTab />}` conditional
3. `components/dev/debt-tab.tsx` — new file, the tab component itself

Note: `useTabRefresh` hook exists at `/lib/hooks/use-tab-refresh.ts` but is
scoped to `AdminTabId`, not `DevTabId`. If the Debt tab needs
refresh-on-activation behavior, either generalize this hook to accept a generic
tab ID type, or create a `DevTabId`-aware variant.

---

## 13. Contradictions

### Contradiction 1: Firestore "no Firebase" QA Decision vs. Firestore for Annotations

**Position A (SQ5):** The QA decision "Manual button, no auto-sync, no Firebase"
applies to bulk MASTER_DEBT data transmission.

**Position B (SQ4b, SQ5):** Firestore `dev/debt/*` collections are appropriate
for small annotation metadata.

**Resolution (revised post-challenge):** Start with localStorage for
annotations, not Firestore. This is a solo-developer tool; cross-device
persistence is not a launch requirement. This eliminates the contradiction
entirely — the executive summary "no Firebase needed" claim becomes accurate.
Migrate to Firestore if annotation volume grows or cross-device is needed.
**localStorage first is now better-supported.**

### Contradiction 2: Override-log as "dark debt" vs. "pre-commit suppression list"

**Position A (pre-research):** `override-log.jsonl` is dark debt — unregistered
acknowledgments of skipped checks.

**Position B (DECISIONS_PRE_PLAN.md):** DARK-01 (`known-debt-baseline.json`) was
reframed as a suppression list, not truly dark.

**Resolution:** The reframe applies to DARK-01 only. DARK-02
(`override-log.jsonl`) remains dark debt — per-commit skips never formalized as
DEBT items. Both warrant promotion pathways with different UI flows. **Both
positions are partially correct for different data sources.**

### Contradiction 3: Docs tab and Debt tab overlap on documentation category

**Position A:** Docs tab (B8) tracks doc quality issues; Debt tab shows 982
documentation-category items. Risk of duplicate display.

**Position B (SQ11):** Docs tab shows "structural sync status" and links OUT to
the Debt tab for the full list. No duplication.

**Resolution:** Position B is the design intent. Docs tab = structural health
surface; Debt tab = canonical TDMS list. **Position B is better-supported.**

### Contradiction 4: Static JSON blob vs. developer usage pattern (NEW — from contrarian-1)

**Position A (original report):** Static JSON served via `public/debt-data.json`
is acceptable for a local dev tool. Stale-data banner is sufficient.

**Position B (contrarian-1):** The user runs `npm run dev` for day-to-day usage.
`npm run build` may run once a week or less. Debt data changes multiple times
per session. A banner saying "Data last updated 3 days ago" is showing actively
wrong information, not just stale information.

**Resolution:** Position B is better-supported. The hybrid fetch strategy (API
route during dev, static JSON for production) resolves this. The banner remains
for production fallback; it is insufficient as the only freshness mechanism.
**Position B adopted as primary architecture.**

### Contradiction 5: Discovery agents — expand intake vs. resolve first (NEW — from contrarian-1, OTB-2)

**Position A (original report):** 7 discovery agents extend the intake funnel
and improve debt visibility.

**Position B (contrarian-1, OTB-2):** At 13.2% resolution rate, adding 123-305
items per discovery run worsens the backlog. More intake without fixing
resolution is counter-productive.

**Resolution:** Both positions have merit. The compromise: start with 3 agents
that have high unique signal and low overlap. Add a resolution-rate gate (open <
7,000 OR resolution rate > 20%) before expanding. Surface the arithmetic
("adding N items at current resolution pace means the backlog grows by X
items/month") in the discovery mode warning. **Position B adopted as primary
stance; Position A preserved as Phase 4 expansion path.**

---

## 14. Confidence Assessment

| Category                                                | Confidence | Basis                                                                              |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| output:export constraint                                | HIGH       | Direct code read: next.config.mjs line 13                                          |
| Hybrid fetch strategy (dev API + prod static)           | HIGH       | API routes confirmed available in npm run dev; constraint is production only       |
| Option A architecture (static JSON production fallback) | HIGH       | Constraint eliminates B/C/D by elimination                                         |
| SQLite optional on Windows                              | HIGH       | MSVC not available on this machine; prebuilt binary availability unconfirmed       |
| 179ms full parse time                                   | HIGH       | Direct measurement from SQ1b                                                       |
| BUG-01 (lowercase status)                               | HIGH       | V2-data verification: debt-health.js line 65 confirmed                             |
| BUG-06 (metrics-log missing fields)                     | HIGH       | V2-data verification: logMetricsGeneration function lines 335-356 confirmed        |
| BUG-03 (no sync-deduped.js call)                        | HIGH       | V2-data verification: resolve-bulk.js 492 lines read, no call found                |
| BUG-04, BUG-05                                          | HIGH       | Direct code inspection                                                             |
| BUG-02 (no --dry-run)                                   | MEDIUM     | Confirmed absent; not a blocking bug                                               |
| TanStack Table v8 + Virtual v3                          | HIGH       | Version confirmed; project dep compatibility verified                              |
| Recharts — NOT installed                                | HIGH       | V1-codebase verification: package.json grepped, all charting libs absent           |
| MiniSearch for client-side search                       | HIGH       | Inverted index model confirmed superior to Fuse.js brute-force at 8,472 records    |
| Clipboard web→CLI (V1 mechanism)                        | HIGH       | Confirmed static SPA; 3 existing patterns in codebase                              |
| 3 discovery agents initially (not 7)                    | MEDIUM     | Based on overlap analysis; agent yields are estimates                              |
| Resolution-rate gate at 20%                             | MEDIUM     | Threshold is a recommendation, not verified against user preference                |
| nuqs URL state compatibility                            | LOW        | Not validated; skipped for v1                                                      |
| Pre-generated AI summaries                              | HIGH       | Build-time API call is architecturally sound; API key setup required               |
| cluster_primary field                                   | HIGH       | V2-data verification: 172/8,472 items (~2%), MUST be nullable                      |
| known-debt-baseline.json entries                        | HIGH       | V2-data verification: ~40 entries across 3 categories (not 45+)                    |
| useTabRefresh scoped to AdminTabId                      | HIGH       | V1-codebase verification: hook in lib/hooks/use-tab-refresh.ts, 10 admin consumers |
| Session tab data model                                  | LOW        | No session data source found; B7 data source undefined                             |
| Errors tab data model                                   | LOW        | B6 unimplemented; no Firestore path found for errors                               |

**Overall:** HIGH confidence on all architectural decisions, blocking bugs, and
verification-confirmed claims. MEDIUM on discovery agent thresholds. LOW on nuqs
(skipped), Sessions and Errors tabs.

---

## 15. Recommendations (Revised Post-Challenge)

### Immediate (Before Any Web Development)

**REC-01:** Fix BUG-01 (normalize status strings) and BUG-06 (expand
`logMetricsGeneration()`) before writing any web-side code. Run debt:sync after
fixes to regenerate metrics going forward. [9][8]

**REC-02:** Create `scripts/build-debt-data.js` reading from `MASTER_DEBT.jsonl`
directly (not SQLite). Strip to display fields (~2 MB target). Add
`public/debt-data.json` to `.gitignore`. Include `buildTimestamp` in output. Add
a prebuild hook AND a `npm run dev` API route for hybrid data freshness. [1][3]

**REC-03:** Fix the two `intake-audit.js` gaps (discovery_source field
passthrough, source_type passthrough) before deploying any discovery agents.
[12]

### Architecture

**REC-04:** Implement the hybrid fetch strategy as the primary data freshness
mechanism. During `npm run dev`, the debt tab fetches from `/api/debt-data`
(live JSONL). During production, it falls back to `/debt-data.json`. This is the
PRIMARY recommendation, replacing static-JSON-only as the data strategy.

**REC-05:** Make SQLite optional. `build-debt-data.js` reads from
`MASTER_DEBT.jsonl` regardless of whether SQLite is installed. The system must
work without `better-sqlite3` on Windows.

**REC-06:** Add `npx shadcn@latest add chart` to the setup steps. Recharts is
NOT currently installed. Verify React 19.2.4 compatibility before committing. Do
not install Recharts directly — go through the shadcn chart component.

**REC-07:** Use MiniSearch instead of Fuse.js for client-side search. Inverted
index model provides better performance and boolean query support for 8,472+
records.

**REC-08:** Start with 3 discovery agents (config-drift-detector,
architectural-boundary-checker, integration-verifier). Add a resolution-rate
gate before expanding. Display token cost and resolution-rate warning before
running.

**REC-09:** Make Guided Mode the DEFAULT entry point for the CLI. Expert
numbered menu via [E] escape hatch. This is a solo non-developer director; the
numbered menu is not the right first impression.

**REC-10:** Start with localStorage for annotations, not Firestore. Migrate to
Firestore only if cross-device need is demonstrated.

### CLI Expansion

**REC-11:** Implement the statusline S0 widget as a Phase 1 quick win.
`metrics.json` already exists and contains `summary.total`, `summary.open`,
`summary.resolution_rate_pct`, and `by_severity.S0`. The statusline pattern is
established (D1, D5 widgets). A new widget displaying `S0:26 | 13% resolved` is
approximately 30 lines of Go. This provides ambient debt awareness during every
Claude Code session — the highest-visibility signal for the lowest effort.

---

## 16. Implementation Phasing

The challenge review (OTB-2) identified that the research's implementation
sequence (REC-07) has no clean stop points. This phasing adds explicit gates
where the user can stop and still have a better system than before.

### Phase 1: Bug Fixes + Metrics Enrichment (1-2 sessions)

**Scope:**

1. Fix all 6 bugs in priority order (BUG-01 → BUG-06 → BUG-03 → BUG-04 → BUG-02
   → BUG-05)
2. Add `generate-metrics.js` call to `resolve-debt.yml` CI workflow
3. Enrich future metrics-log.jsonl entries with by_source and by_category
4. Regenerate metrics after fixes
5. Verify data integrity end-to-end
6. Add statusline S0 widget (30 lines of Go — Phase 1 quick win)
7. Ship as standalone PR

**Value delivered:** Clean, trustworthy data. The S0 widget provides ambient
awareness during every session. Every subsequent phase works correctly. **Can
stop here:** Yes. The system is materially better with correct data and ambient
monitoring.

### Phase 2: CLI Expansion (2-3 sessions)

**Scope:**

1. Add Guided Mode as default entry point (outcome-oriented language, [E] for
   expert menu)
2. Add "full refresh" command (sequences existing scripts)
3. Add intake scan mode (Mode 8)
4. Deploy 3 initial discovery agents with resolution-rate gate (Mode 9 sub-menu)
5. Add dark debt review mode (Mode 10)
6. Fix intake-audit.js gaps (discovery_source passthrough)

**Value delivered:** Faster, more intuitive CLI operations. The user can run a
complete debt refresh from a single command. Discovery with guard rails. **Can
stop here:** Yes. The CLI is better and the data is clean.

### Phase 3: Web Dashboard — Minimal (2-3 sessions)

**Scope:**

1. Create `scripts/build-debt-data.js` (JSONL → field-stripped JSON, ~2 MB)
2. Create `/api/debt-data` API route (dev mode only)
3. Build `debt-tab.tsx` shell with hybrid fetch strategy
4. Add KPI cards (6) + AI Insights card (if API key available)
5. Add Recharts trend chart (1 chart type: open count over time)
6. Add TanStack Table + Virtual for sortable item browsing
7. Wire into dev-dashboard.tsx (3-file change)
8. Stale-data banner for production mode

**Value delivered:** Visual overview of debt state and trends. Live data during
dev mode, static fallback for production. **Can stop here:** Yes. The user has a
functional read-only dashboard.

### Phase 4: Web Power Features + Discovery Expansion (4-6 sessions, optional)

**Scope (pull as needed):**

- MiniSearch client-side search
- Filter panel (Tier 1 always visible, Tier 2 collapsible)
- 5 additional chart types
- Diff view between time points (simple metric-level version first)
- Debt heat map / file tree sidebar (after GAP-04 fix)
- Cross-tab synergies (only when target tabs exist)
- Additional discovery agents (after resolution-rate gate is met)
- CSV/JSONL export
- Override/Warning promotion buttons
- Pre-generated AI summaries in build-debt-data.js (if not done in Phase 3)

**Value delivered:** Power-user features, automated discovery, richer browsing.
**This is a backlog, not a committed spec.** The user pulls from it as the
previous phases prove valuable.

---

## 17. Unexpected Findings and Creative Opportunities (OTB)

**metrics-log.jsonl spans 53 days of debt history.** The 113 entries in
`docs/technical-debt/logs/metrics-log.jsonl` cover 2026-02-01 through
2026-03-26. Total went from 868 → 8,472 items; resolved went from 0 → 1,116.
This is a compelling story: 53 days of evidence of active debt management. The
trend chart is buildable today with existing data — no new collection needed —
if BUG-06 is fixed.

**The CLI-web synergy generalizes to all tabs.** The "copy as CLI command"
clipboard pattern is not a debt tab feature — it is a dashboard-wide primitive.
The Warnings tab and Overrides tab both benefit from "generate /add-debt
command" buttons using the same mechanism. Extract as a shared utility from the
start.

**Pre-generated AI summaries are the highest-value new idea.** (OTB-1, Idea 5)
The `build-debt-data.js` script has the full dataset in memory at build time.
Adding 3-5 summary prompts to a Claude API call produces actionable
natural-language bullets: "The 3 oldest S0 items have been open for 41, 38, and
33 days respectively. None are assigned to any sprint." This transforms the
dashboard from "numbers you interpret" to "insights you act on." Cost:
~$0.01-0.03 per build. Effort: ~30 lines in `build-debt-data.js` + one React
card component.

**Debt heat map / file tree as a future capability.** (OTB-1, Idea 3) A
collapsible file tree sidebar showing debt density by directory (color-coded by
severity weight) would transform understanding from "I have 8,472 debt items" to
"my auth module is drowning in debt and my lib/ is clean." The data exists; the
grouping logic is already planned. Blocked on GAP-04 (file metadata
normalization). Schedule: Phase 4, after GAP-04 is fixed.

**Diff view between time points as a future capability.** (OTB-1, Idea 6) Two
dropdowns selecting metrics-log.jsonl entries by date. The diff shows: total
delta, resolved delta, S0 delta, top 3 categories that grew/shrank. Simple
version uses existing data, no new dependency. Scheduled for Phase 4 Trends
panel alongside existing trend charts.

**Webhook threshold triggers on existing ntfy.sh infrastructure.** (OTB-1,
Idea 8) ntfy.sh is already configured and working. Adding threshold checks to
`generate-metrics.js` is 10-15 lines: S0 > N, resolution rate below M%,
single-session intake > K items. Configurable via
`tool-configs/debt-thresholds.json`. Feasibility: NOW. Schedule
opportunistically.

**The B10 System Health tab may duplicate the Debt tab.**
`OPERATIONAL_VISIBILITY_SPRINT.md` B10 spec includes "Backlog health" and
"Historical trends." Resolution: Debt tab owns the full TDMS view; B10 shows a
3-metric summary widget (S0 count, resolution rate, data freshness) with a
deep-link to the Debt tab.

**hook-warnings-log.jsonl has real data with threshold-ready fields.**
`occurrences_since_ack` field enables automatic "promote to debt" suggestions at
N > 5 unacknowledged occurrences. The sample data shows a recurring
"Code-reviewer bypassed for script changes" warning with occurrences 4-8. This
is a concrete, data-grounded synergy requiring zero new data collection.

---

## 18. Challenges and Verification Summary

### Verification Results

**V1 — Codebase Verification:** 12 VERIFIED, 2 PARTIAL

- All architectural claims confirmed (output:export, tab structure, auth gate,
  Cloud Functions pattern)
- useTabRefresh hook exists but scoped to AdminTabId — does NOT apply to
  DevTabId without generalization
- No charting libraries installed — Recharts, Chart.js, d3, all others absent
  from package.json

**V2 — Data Verification:** 12 VERIFIED, 2 REFUTED

- Refuted: known-debt-baseline.json has ~40 entries (not 45+); is a nested
  object, not flat list
- Refuted: cluster_primary is sparse (~2% coverage, 172/8,472 items) — must be
  nullable
- BUG-01, BUG-03, BUG-06 confirmed at specific file locations with evidence

### Challenge Results

**Contrarian-1 (Architectural Stress Test) — 5 MAJOR findings addressed:**

| Challenge                          | Severity | Resolution                                                     |
| ---------------------------------- | -------- | -------------------------------------------------------------- |
| Static JSON blob scalability       | MAJOR    | Hybrid fetch (dev API + prod static); field stripping to ~2 MB |
| Build-time staleness               | MAJOR    | Hybrid fetch is primary; live API during npm run dev           |
| 7 discovery agents                 | MAJOR    | Reduced to 3 with resolution-rate gate                         |
| 10 CLI modes (cognitive model)     | MAJOR    | Discovery as sub-menu; Guided Mode as default                  |
| Clipboard as "only viable" handoff | MAJOR    | Repositioned as V1/MVP; WebSocket bridge documented for V2     |

**Contrarian-2 (Frontend Design) — 3 HIGH items addressed:**

| Challenge                 | Severity | Resolution                                                     |
| ------------------------- | -------- | -------------------------------------------------------------- |
| Recharts not in project   | HIGH     | Corrected: must be added via shadcn chart; never was installed |
| Static JSON 7.6 MB        | HIGH     | Field stripping required; ~2 MB target                         |
| better-sqlite3 on Windows | HIGH     | SQLite now optional; build-debt-data.js reads JSONL directly   |

**OTB-1 (Missed Opportunities) — Top 3 incorporated:**

1. Pre-generated AI summaries → Added to Phase 3 scope and Section 4 Theme 9
2. Debt heat map file tree → Added as Phase 4 future capability
3. Diff view between time points → Added as Phase 4 future capability
4. Statusline S0 widget → Added to Phase 1 as quick win (30 lines Go)

**OTB-2 (Product Strategy) — Core recommendations adopted:**

1. 4-phase implementation plan with independent value at each stop point →
   Section 16
2. Web dashboard deferred to Phase 3 (CLI expansion first) → Section 16
3. Bug fixes as mandatory Phase 1 gate → Phase 1 scope
4. Discovery agents reduced scope at current resolution rate → Section 9

---

## 19. Open Questions for /deep-plan

These questions from `DECISIONS_PRE_PLAN.md` [17] plus new questions raised by
challenge review require /deep-plan resolution:

1. **Hybrid fetch API route implementation:** What specific API route structure
   serves `MASTER_DEBT.jsonl` content during `npm run dev`? How does field
   stripping work in the API route vs. build script?
2. **Field selection for ~2 MB target:** Exactly which fields are stripped? What
   is the canonical list of display-side fields vs. stripped fields?
3. **better-sqlite3 prebuilt availability:** Does the prebuilt binary resolve
   for Node 22 x64 Windows? Test before committing to SQLite in the plan.
4. **Recharts React 19 compatibility:** Add Recharts to a test branch, build,
   verify all 6 chart types render correctly with React 19.2.4 before assuming
   the react-is override is sufficient.
5. **Resolution-rate gate thresholds:** Are the thresholds (open < 7,000 OR
   resolution rate > 20%) acceptable to the user, or should different values be
   set?
6. **AI insights API key setup:** Does the build environment have an Anthropic
   API key available? Is the cost ($0.01-0.03/build) acceptable? What fallback
   behavior is wanted for offline builds?
7. **Statusline widget slot:** Which existing widget (D-series) does the debt
   widget replace, or is a new slot acceptable?
8. **useTabRefresh generalization:** Generalize the existing hook to accept a
   generic tab ID type, or create a DevTabId-specific variant?
9. **localStorage vs. Firestore annotation decision:** Confirm localStorage is
   acceptable for v1 annotations (no cross-device persistence needed).
10. **Discovery agent individual selection vs. run-all:** Confirm the sub-menu
    approach for Mode 9 is preferred over wave execution.

---

## 20. Sources

### Tier 1 — Primary Codebase (Direct Reads)

| #     | Source                                               | Type        | Trust | CRAAP |
| ----- | ---------------------------------------------------- | ----------- | ----- | ----- |
| S-001 | next.config.mjs line 13                              | config-file | HIGH  | 5/5   |
| S-002 | components/dev/lighthouse-tab.tsx                    | source-code | HIGH  | 5/5   |
| S-003 | components/dev/dev-tabs.tsx                          | source-code | HIGH  | 5/5   |
| S-004 | components/dev/dev-dashboard.tsx                     | source-code | HIGH  | 5/5   |
| S-005 | docs/technical-debt/MASTER_DEBT.jsonl (schema)       | data-file   | HIGH  | 5/5   |
| S-006 | docs/technical-debt/metrics.json                     | data-file   | HIGH  | 5/5   |
| S-007 | docs/technical-debt/logs/metrics-log.jsonl           | data-file   | HIGH  | 5/5   |
| S-008 | .claude/override-log.jsonl                           | data-file   | HIGH  | 5/5   |
| S-009 | .claude/state/hook-warnings-log.jsonl                | data-file   | HIGH  | 5/5   |
| S-010 | .claude/state/known-debt-baseline.json (~40 entries) | data-file   | HIGH  | 5/5   |
| S-011 | scripts/resolve-debt.js                              | source-code | HIGH  | 5/5   |
| S-012 | scripts/resolve-bulk.js                              | source-code | HIGH  | 5/5   |
| S-013 | scripts/generate-metrics.js                          | source-code | HIGH  | 5/5   |
| S-014 | scripts/intake-audit.js                              | source-code | HIGH  | 5/5   |
| S-015 | scripts/dedup-debt.js                                | source-code | HIGH  | 5/5   |
| S-016 | scripts/triage-debt.js                               | source-code | HIGH  | 5/5   |
| S-017 | scripts/check-backlog-health.js                      | source-code | HIGH  | 5/5   |
| S-018 | lib/firestore-service.ts                             | source-code | HIGH  | 5/5   |
| S-019 | package.json (full deps)                             | config-file | HIGH  | 5/5   |
| S-020 | .github/workflows/resolve-debt.yml                   | ci-config   | HIGH  | 5/5   |
| S-021 | .github/workflows/audit-intake.yml                   | ci-config   | HIGH  | 5/5   |
| S-022 | scripts/health/checkers/debt-health.js               | source-code | HIGH  | 5/5   |
| S-023 | lib/hooks/use-tab-refresh.ts                         | source-code | HIGH  | 5/5   |
| S-024 | app/dev/page.tsx                                     | source-code | HIGH  | 5/5   |

### Tier 2 — Project Documentation (Authoritative)

| #     | Source                                                                | Type         | Trust | CRAAP |
| ----- | --------------------------------------------------------------------- | ------------ | ----- | ----- |
| S-025 | docs/OPERATIONAL_VISIBILITY_SPRINT.md                                 | spec-doc     | HIGH  | 5/5   |
| S-026 | ROADMAP.md (Track B section)                                          | spec-doc     | HIGH  | 5/5   |
| S-027 | .research/debt-runner-expansion/DECISIONS_PRE_PLAN.md                 | decisions    | HIGH  | 5/5   |
| S-028 | .research/debt-runner-expansion/SYNERGIES.md                          | analysis     | HIGH  | 5/5   |
| S-029 | .research/debt-runner-expansion/findings/SQ1a-sqlite-schema.md        | findings     | HIGH  | 5/5   |
| S-030 | .research/debt-runner-expansion/findings/SQ1b-sync-architecture.md    | findings     | HIGH  | 5/5   |
| S-031 | .research/debt-runner-expansion/findings/SQ2-web-integration.md       | findings     | HIGH  | 5/5   |
| S-032 | .research/debt-runner-expansion/findings/SQ3-charting-libraries.md    | findings     | HIGH  | 5/5   |
| S-033 | .research/debt-runner-expansion/findings/SQ4a-web-browsing.md         | findings     | HIGH  | 5/5   |
| S-034 | .research/debt-runner-expansion/findings/SQ4b-web-power.md            | findings     | HIGH  | 5/5   |
| S-035 | .research/debt-runner-expansion/findings/SQ5-cli-web-handoff.md       | findings     | HIGH  | 5/5   |
| S-036 | .research/debt-runner-expansion/findings/SQ6-read-write-split.md      | findings     | HIGH  | 5/5   |
| S-037 | .research/debt-runner-expansion/findings/SQ7-scripts-bugs-updated.md  | findings     | HIGH  | 5/5   |
| S-038 | .research/debt-runner-expansion/findings/SQ8-gaps-debt-updated.md     | findings     | HIGH  | 5/5   |
| S-039 | .research/debt-runner-expansion/findings/SQ9-discovery-agents.md      | findings     | HIGH  | 5/5   |
| S-040 | .research/debt-runner-expansion/findings/SQ10-cli-patterns-updated.md | findings     | HIGH  | 5/5   |
| S-041 | .research/debt-runner-expansion/findings/SQ11-synergies.md            | findings     | HIGH  | 5/5   |
| S-042 | .research/debt-runner-expansion/findings/V1-codebase-verification.md  | verification | HIGH  | 5/5   |
| S-043 | .research/debt-runner-expansion/findings/V2-data-verification.md      | verification | HIGH  | 5/5   |
| S-044 | .research/debt-runner-expansion/challenges/contrarian-1.md            | challenge    | HIGH  | 5/5   |
| S-045 | .research/debt-runner-expansion/challenges/contrarian-2.md            | challenge    | HIGH  | 5/5   |
| S-046 | .research/debt-runner-expansion/challenges/otb-1.md                   | challenge    | HIGH  | 5/5   |
| S-047 | .research/debt-runner-expansion/challenges/otb-2.md                   | challenge    | HIGH  | 5/5   |

### Tier 3 — External References (Library Documentation)

| #     | Source                                       | Type          | Trust | CRAAP                |
| ----- | -------------------------------------------- | ------------- | ----- | -------------------- |
| S-048 | tanstack.com/table/v8 (official docs)        | official-docs | HIGH  | 4/5                  |
| S-049 | tanstack.com/virtual/v3 (official docs)      | official-docs | HIGH  | 4/5                  |
| S-050 | recharts.org (official docs)                 | official-docs | HIGH  | 4/5                  |
| S-051 | ui.shadcn.com/docs/components/chart          | official-docs | HIGH  | 4/5                  |
| S-052 | lucaong.github.io/minisearch (official docs) | official-docs | HIGH  | 4/5                  |
| S-053 | nuqs.47ng.com (official docs)                | official-docs | LOW   | 2/5 (skipped for v1) |
| S-054 | better-sqlite3 GitHub (npm registry)         | official-docs | HIGH  | 4/5                  |
| S-055 | papaparse.com (official docs)                | official-docs | HIGH  | 4/5                  |

---

## 21. Methodology

**Phase:** Deep Research (Phase 1) + Phase 2 (Challenge + Verification) +
Post-Challenge Re-Synthesis **Searcher agents:** 13 across 11 sub-questions
(SQ1a, SQ1b, SQ2, SQ3, SQ4a, SQ4b, SQ5, SQ6, SQ7, SQ8, SQ9, SQ10, SQ11)
**Verification agents:** 2 (V1 codebase verification, V2 data verification)
**Challenge reviewers:** 4 (contrarian-1 architectural, contrarian-2 frontend,
otb-1 creative, otb-2 product strategy) **Search passes:** 2 passes for SQ7,
SQ8, SQ10 (updated with architectural tension resolution); 1 pass for others
**Total findings files read for synthesis:** 17 (11 SQ files + 2 verification +
4 challenge) **Unique sources cited:** 55 (S-001 through S-055)
**Deduplication:** output:export constraint confirmed in SQ2, SQ4a, SQ4b, SQ5 —
merged to single finding; clipboard mechanism confirmed in SQ5 + SQ4b — merged;
Recharts absence confirmed in V1 + contrarian-1 + contrarian-2 — merged
**Contradictions found:** 5 (3 original + 2 new from challenge review) — all
addressed with resolution **All findings from codebase direct reads:** No
external web search used for primary claims. All architectural claims grounded
in filesystem inspection of this repository.

**Post-challenge corrections applied:** 15 (see Section 18 and factual
corrections in executive summary)

**Inline citation key:** [1] S-001 (next.config.mjs) | [2] S-031 (SQ2) | [3]
S-007/S-006 (metrics-log/metrics) | [4] S-033 (SQ4a) | [5] S-034 (SQ4b) | [6]
S-035 (SQ5) | [7] S-030 (SQ1b) | [8] S-006 (metrics.json) | [9] S-037 (SQ7) |
[10] S-032/S-048/S-049 (SQ3/TanStack) | [11] S-029 (SQ1a) | [12] S-039 (SQ9) |
[13] S-041 (SQ11) | [14] S-051 (shadcn chart) | [15] S-040 (SQ10) | [16] S-028
(SYNERGIES.md) | [17] S-027 (DECISIONS_PRE_PLAN.md) | [V1] S-042 (codebase
verification) | [V2] S-043 (data verification) | [C1] S-044 (contrarian-1) |
[C2] S-045 (contrarian-2) | [OTB1] S-046 (otb-1) | [OTB2] S-047 (otb-2)
