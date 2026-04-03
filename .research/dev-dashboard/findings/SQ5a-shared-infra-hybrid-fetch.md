# Findings: Hybrid Fetch Architecture, Component Patterns, and Build Pipeline

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ5a

---

## Key Findings

### 1. `output: "export"` is Confirmed — API Routes are Dev-Mode Only [CONFIDENCE: HIGH]

`next.config.mjs` line 13 is `output: "export"` with the comment "Required for
Firebase Hosting static deployment." This is the load-bearing architectural
constraint. API routes (`/api/*`) function under `npm run dev` (Turbopack) but
are absent from the `out/` directory produced by `npm run build`. They are
unavailable in the deployed Firebase Hosting static site.

The critical nuance established by the debt-runner-expansion research: the
dashboard is a **developer tool**. The user runs `npm run dev` for daily use.
They run `npm run build` only for deployment. This creates the escape hatch for
the hybrid fetch strategy: dev mode (the primary usage mode) can use live API
routes, while production falls back to static pre-built JSON.

There are no existing API routes at `app/api/`. The directory does not exist.
Every API route needed for the dashboard must be created from scratch.

### 2. Hybrid Fetch Strategy — The Definitive Design [CONFIDENCE: HIGH]

The architecture confirmed by the debt-runner-expansion research and applicable
to all 6 tabs:

**Dev mode (`process.env.NODE_ENV === 'development'`):**

- Tab fetches from `/api/<tab>/data` — an API route that reads source JSONL/JSON
  files directly from disk
- Data is always current — zero staleness during actual development usage
- "Refresh Data" button re-fetches without restarting the dev server
- Source files are read at request time, not cached

**Production (`npm run build` + Firebase Hosting deployment):**

- API routes are unavailable
- Tab fetches from `/public/<tab>-data.json` — a pre-built static snapshot
- A stale-data banner shows the build timestamp and "Data last refreshed N days
  ago"
- `generated` field in each JSON file provides the timestamp

**Detection pattern** (established in debt research, confirmed by existing
codebase pattern):

```typescript
// Consistent with existing components: resources-page.tsx, today-page.tsx
const isDev = process.env.NODE_ENV === "development";
```

This pattern is already used in `components/notebook/pages/resources-page.tsx`
and `components/notebook/pages/today-page.tsx` — it is not new to the codebase.
Next.js inlines `process.env.NODE_ENV` at build time, so the production bundle
tree-shakes the dev branch entirely.

**Per-tab URL mapping:**

| Tab                 | Dev API route             | Static fallback                                                    |
| ------------------- | ------------------------- | ------------------------------------------------------------------ |
| Health & Alerts     | `/api/dashboard/health`   | `/health-data.json`                                                |
| Debt Pipeline       | `/api/dashboard/debt`     | `/debt-summary.json`, `/debt-alerts.json`, `/debt-items-s0s1.json` |
| Code Review         | `/api/dashboard/reviews`  | `/reviews-data.json`                                               |
| Build Pipeline      | `/api/dashboard/pipeline` | `/pipeline-data.json`                                              |
| Governance & Audits | `/api/dashboard/audits`   | `/audits-data.json`                                                |
| Planning & Research | `/api/dashboard/planning` | `/planning-data.json`                                              |

Note: Debt tab uses multiple endpoints (summary, alerts, items) because of
size-split strategy for the 8,472-record MASTER_DEBT.jsonl. All other tabs use a
single endpoint.

**Stale-data banner component** (for production static mode):

```tsx
// Show when NODE_ENV !== 'development' and generated timestamp is present
function StaleDataBanner({ generatedAt }: { generatedAt: string }) {
  const days = Math.floor(
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return (
    <div
      className="bg-yellow-900/30 border border-yellow-700 rounded px-4 py-2
                    text-sm text-yellow-300 flex items-center gap-2"
    >
      <span>Static snapshot</span>
      <span>·</span>
      <span>Data last refreshed {days === 0 ? "today" : `${days}d ago`}</span>
      <span>·</span>
      <span className="text-yellow-400">Run `npm run build` to update</span>
    </div>
  );
}
```

All 6 tab data files must include a top-level `generated` ISO timestamp field
written by the build script.

### 3. Build Script Design — `scripts/build-dashboard-data.js` [CONFIDENCE: HIGH]

**Trigger:** `prebuild` npm lifecycle hook. In npm, a script named `"prebuild"`
auto-runs before `"build"` without any additional configuration. Add to
`package.json`:

```json
"prebuild": "node scripts/build-dashboard-data.js"
```

No `prebuild` script currently exists in `package.json`. This is a clean slot.

An alternative `"dashboard:build": "node scripts/build-dashboard-data.js"` can
be added alongside `prebuild` for manual refresh without triggering a full
build.

**Source → Output mapping** (all confirmed from W3 data design research):

| Output File                   | Primary Sources                                                                                                                                                                                                                                                                                                                                               | Processing                                                                                                 | Size Target                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `public/health-data.json`     | `data/ecosystem-v2/ecosystem-health-log.jsonl` (438 KB), `data/ecosystem-v2/enforcement-manifest.jsonl` (120 KB), `.claude/state/health-score-log.jsonl` (18 KB), `.claude/state/hook-warnings-log.jsonl` (27 KB), `.claude/state/lifecycle-scores.jsonl` (10 KB), `data/ecosystem-v2/warnings.jsonl` (6 KB)                                                  | Field-strip to display fields; aggregate warnings; extract last N entries from health-log                  | ~30–35 KB                           |
| `public/debt-summary.json`    | `docs/technical-debt/metrics.json` (5 KB)                                                                                                                                                                                                                                                                                                                     | Copy with `generated` timestamp                                                                            | ~2 KB                               |
| `public/debt-trend.json`      | `docs/technical-debt/logs/metrics-log.jsonl` (13 KB, 114 entries)                                                                                                                                                                                                                                                                                             | Deduplicate to ~49 date points, keep 6 fields                                                              | ~12 KB                              |
| `public/debt-alerts.json`     | `docs/technical-debt/MASTER_DEBT.jsonl` (7.6 MB, 8,472 items)                                                                                                                                                                                                                                                                                                 | Filter to S0 + open S1; strip to 13 display fields                                                         | ~432 KB                             |
| `public/debt-items-s0s1.json` | `docs/technical-debt/MASTER_DEBT.jsonl`                                                                                                                                                                                                                                                                                                                       | All S0+S1 items; strip to 13 fields                                                                        | ~464 KB                             |
| `public/debt-items-s2s3.json` | `docs/technical-debt/MASTER_DEBT.jsonl`                                                                                                                                                                                                                                                                                                                       | All S2+S3; strip to 13 fields; lazy-loaded                                                                 | ~2.2 MB                             |
| `public/reviews-data.json`    | `.claude/state/pr-review-state.json` (10 KB), `.claude/state/review-metrics.jsonl` (11 KB), `.claude/state/reviews.jsonl` + `reviews-archive.jsonl` (285 KB combined), `.claude/state/retros.jsonl` (37 KB), `.claude/state/pending-refinements.jsonl` (25 KB), `.claude/state/learning-routes.jsonl` (25 KB), `.claude/state/forward-findings.jsonl` (<1 KB) | Pre-compute pattern frequencies from archive; strip to top 30–50 patterns; deduplicate                     | ~28 KB                              |
| `public/pipeline-data.json`   | `.claude/state/hook-runs.jsonl` (120 KB), `.claude/state/commit-log.jsonl` (220 KB), `.claude/state/agent-invocations.jsonl` (14 KB), `.claude/override-log.jsonl` (7 KB), `.claude/state/hook-warnings-log.jsonl` (27 KB)                                                                                                                                    | Pre-compute heatmap matrix; summarize overrides (privacy-filter content); derive process compliance scores | ~26 KB                              |
| `public/audits-data.json`     | `.claude/state/*-ecosystem-audit-history.jsonl` (7 files), `.claude/state/audit-agent-quality-history.jsonl`                                                                                                                                                                                                                                                  | Extract scores, dates, sub-audit breakdown; compute recency flags                                          | ~60–65 KB gzipped (~185–190 KB raw) |
| `public/planning-data.json`   | `.research/research-index.jsonl` (4 entries), `.claude/state/deep-plan*.json` (8 files), `ROADMAP.md` (requires `--json` flag on resolve-dependencies.js), `.claude/state/lifecycle-scores.jsonl` (10 KB)                                                                                                                                                     | Parse deep-plan state files; extract task lists; run roadmap dependency resolver                           | ~20–40 KB estimated                 |

**MASTER_DEBT.jsonl read mode:** The build script MUST read from JSONL directly,
not from SQLite. This ensures the web path works even if `better-sqlite3` is not
installed. The 179ms full JSONL parse time is acceptable for a build-time
operation.

**BUG PREREQUISITE (confirmed from debt-runner research):** Two bugs in existing
scripts must be fixed before the build script can produce correct debt data:

- **BUG-01:** `debt-health.js` uses lowercase status strings (`resolved`,
  `closed`) instead of canonical uppercase (`RESOLVED`). The build script's
  status filter will return 0 results if the same bug is replicated.
- **BUG-06:** `metrics-log.jsonl` is missing `by_source` and `by_category`
  fields (present in `metrics.json` but never written to the log). Historical
  breakdown charts will silently show no data for all 114 existing entries.

**`.gitignore` additions needed:**

```
public/debt-items-s0s1.json
public/debt-items-s2s3.json
public/debt-alerts.json
public/debt-summary.json
public/debt-trend.json
public/health-data.json
public/reviews-data.json
public/pipeline-data.json
public/audits-data.json
public/planning-data.json
```

These are build artifacts. Committing them would add ~3+ MB per commit to git
history. The ROADMAP.md planning gap (needs `--json` flag) means
`public/planning-data.json` may partially require a pre-work task before
`planning-data.json` is complete.

### 4. Dependency Audit — What Needs Installing [CONFIDENCE: HIGH]

**Confirmed NOT installed** (from package.json audit):

| Package                   | Purpose                                                   | Install Command                       |
| ------------------------- | --------------------------------------------------------- | ------------------------------------- |
| `recharts`                | Line charts, bar charts, area charts                      | `npm install recharts`                |
| `@tanstack/react-table`   | Headless table with sorting, filtering, column visibility | `npm install @tanstack/react-table`   |
| `@tanstack/react-virtual` | Row virtualization for 8,472-record MASTER_DEBT table     | `npm install @tanstack/react-virtual` |
| `minisearch`              | Client-side full-text search inverted index               | `npm install minisearch`              |
| shadcn `chart` component  | Recharts wrapper with design tokens                       | `npx shadcn@latest add chart`         |

**Already installed** (confirmed in package.json):

- `@radix-ui/react-dialog`, `@radix-ui/react-scroll-area`,
  `@radix-ui/react-select`, `@radix-ui/react-slot` — Radix primitives, used by
  shadcn components
- `clsx`, `tailwind-merge`, `class-variance-authority` — shadcn utility libs
- `lucide-react` — icon set
- `sonner` — toast notifications (for rate-limiting 429 errors)
- `date-fns` — date formatting

**Already installed UI components** at `components/ui/`:

- `button.tsx`, `dialog.tsx`, `empty-state.tsx`, `input.tsx`, `label.tsx`,
  `scroll-area.tsx`, `select.tsx`, `skeleton.tsx`, `textarea.tsx`

The shadcn `chart` component wraps Recharts and requires Recharts as a peer
dependency. Install order: `npm install recharts` first, then
`npx shadcn@latest add chart`.

MiniSearch is required for the Debt tab (browser Ctrl+F finds nothing for
off-screen virtualized rows — the search input is the replacement). May also be
useful for Planning tab (searching research topics and plan titles).

TanStack Virtual is required only for the Debt tab (8,472 rows). Other tabs have
<200 records and do not need virtualization.

TanStack Table is required for the Debt tab. Other tabs may use simpler
structures. If MiniSearch + TanStack Table + TanStack Virtual are all scoped to
the Debt tab only, the other tabs have zero new dependencies.

### 5. Shared UX Patterns from `lighthouse-tab.tsx` [CONFIDENCE: HIGH]

The lighthouse tab is the only fully implemented tab. It establishes these
patterns to reuse across all 6 new tabs:

**Loading state pattern:**

```tsx
if (loading) {
  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
      <div className="text-gray-400">Loading [tab name] data...</div>
    </div>
  );
}
```

The `skeleton.tsx` component is installed and should replace the plain text
loading message in new tabs — use `<Skeleton>` bars to reduce layout shift.

**Error state pattern:**

```tsx
if (error) {
  return (
    <div className="bg-red-900/30 rounded-lg p-8 text-center border border-red-700">
      <div className="text-red-400">{error}</div>
    </div>
  );
}
```

New tabs should expand this to include a "Retry" button for transient network
errors. The `classifyFirestoreError` pattern (mapping error codes to user-facing
messages) should be generalized as `classifyFetchError` for API route failures
vs. static file 404s.

**Empty / no-data state pattern:** The lighthouse tab renders setup instructions
when no data exists. New tabs should render an `empty-state.tsx` component
(already installed) pointing to the CLI command that generates the data (e.g.,
"Run `npm run dashboard:build` to generate data").

**Dark theme design tokens** (from lighthouse tab and dev-dashboard.tsx):

```
bg-gray-900    — page background (min-h-screen)
bg-gray-800    — card/panel surface
bg-gray-700    — border color (border-gray-700)
text-white     — primary text
text-gray-400  — secondary/muted text
text-gray-500  — tertiary/placeholder text
blue-500       — active tab indicator border
blue-400       — active tab text
green-400      — good/healthy value
yellow-400     — warning/needs improvement value
red-400        — error/critical value
red-900/30     — error panel background (30% opacity)
yellow-900/30  — warning panel background
green-900/30   — success panel background (used in ScoreBadge)
```

**Color scale pattern** (`getScoreColor` / `getScoreBg` from lighthouse tab):
The 90/50 threshold scoring system (≥90 = green, ≥50 = yellow, <50 = red) can be
generalized to any 0–100 metric. All health scores, audit scores, and compliance
rates use the same semantic: ≥90 good, ≥50 needs improvement, <50 critical. Keep
these thresholds consistent.

**`isCancelled` cleanup pattern:** All `useEffect` data fetches in the codebase
use the `isCancelled` boolean to prevent state updates after unmount. This is
the required pattern — do not use `AbortController` (inconsistent with existing
code). Every new tab must follow this pattern.

**Card layout pattern** (from dev-dashboard.tsx):

```tsx
<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
  <h2 className="text-xl font-bold mb-4">Section Title</h2>
  ...
</div>
```

All dashboard widgets use `space-y-6` between cards and `max-w-7xl mx-auto px-6`
for the content area (inherited from the parent `main` element).

### 6. `DevTabId` Expansion — Removing Old Tabs, Adding 6 New [CONFIDENCE: HIGH]

**Current state** in `components/dev/dev-tabs.tsx`:

```typescript
export type DevTabId =
  | "lighthouse"
  | "errors"
  | "sessions"
  | "docs"
  | "overrides";
```

**New union type** replacing all 5 existing tabs with 6 new tabs:

```typescript
export type DevTabId =
  | "health"
  | "debt"
  | "reviews"
  | "pipeline"
  | "governance"
  | "planning";
```

"lighthouse", "errors", "sessions", "docs", and "overrides" are all removed. The
existing `<LighthouseTab />` component and its Firestore integration are
retired. The "Remote" badge in the header (indicating Firestore-sourced data)
may need updating — the new tabs use local JSONL, not Firestore.

**Updated TABS array** in `dev-tabs.tsx`:

```typescript
const TABS: Tab[] = [
  {
    id: "health",
    label: "Health",
    icon: "🏥",
    description: "Ecosystem health, alerts, compliance gates",
  },
  {
    id: "debt",
    label: "Debt",
    icon: "📋",
    description: "Technical debt pipeline and MASTER_DEBT browser",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: "🔍",
    description: "Code review quality, PR history, learning items",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: "⚙️",
    description: "Hook compliance, commits, agent usage, overrides",
  },
  {
    id: "governance",
    label: "Governance",
    icon: "🏛️",
    description: "Ecosystem audits, quality trends, staleness",
  },
  {
    id: "planning",
    label: "Planning",
    icon: "🗺️",
    description: "Research topics, active plans, sprint board",
  },
];
```

The `activeTab` default in `dev-dashboard.tsx` should change from `"lighthouse"`
to `"health"` (the natural landing tab for a dashboard).

**Impact cascade:** `dev-dashboard.tsx` currently has
`activeTab === "lighthouse" && <LighthouseTab />` and 4 `<PlaceholderTab>`
conditionals. All 5 must be replaced with 6 new tab conditionals. The
`DevDashboard` comment block also lists "Lighthouse performance scores" — update
to reflect new scope.

### 7. Static JSON Budget — Total Across All 6 Tabs [CONFIDENCE: MEDIUM]

Estimates derived from W3 data design research (confirmed from source file
sizes):

| Tab                   | Output File(s)                | Estimated Size (raw) | Notes                               |
| --------------------- | ----------------------------- | -------------------- | ----------------------------------- |
| 1: Health & Alerts    | `public/health-data.json`     | ~30–35 KB            | Field-stripped from 608 KB raw      |
| 2: Debt Pipeline      | `public/debt-summary.json`    | ~2 KB                | Copy of metrics.json                |
|                       | `public/debt-trend.json`      | ~12 KB               | Deduped metrics-log                 |
|                       | `public/debt-alerts.json`     | ~432 KB              | S0 + open S1 (eager load)           |
|                       | `public/debt-items-s0s1.json` | ~464 KB              | All S0+S1 (on demand)               |
|                       | `public/debt-items-s2s3.json` | ~2.2 MB              | All S2+S3 (lazy load)               |
| 3: Code Review        | `public/reviews-data.json`    | ~28 KB               | Pre-computed from 386 KB raw        |
| 4: Build Pipeline     | `public/pipeline-data.json`   | ~26 KB               | Pre-aggregated from 268 KB raw      |
| 5: Governance         | `public/audits-data.json`     | ~185–190 KB          | 7 audit histories                   |
| 6: Planning           | `public/planning-data.json`   | ~20–40 KB est.       | Deep-plan state + research-index    |
| **Dashboard header**  | `public/health-data.json`     | (shared with Tab 1)  | forward-findings included           |
| **Total (eager)**     |                               | **~940 KB**          | Tabs 1+2(summary+alerts)+3+4+5+6    |
| **Total (all files)** |                               | **~3.4 MB**          | Including full S0–S3 items + audits |

**Budget recommendation:** 500 KB for eager-loaded content (immediately fetched
on dashboard load), 3 MB total for all files (some lazy-loaded). The 2 MB
production target for MASTER_DEBT field-stripped export established in
debt-runner research is confirmed — split across debt-alerts + debt-items files.

**For `public/debt-items-s2s3.json` (2.2 MB):** This is the one file that
exceeds comfortable eager-load size. The loading strategy: fetch debt-summary +
debt-alerts eagerly; fetch debt-items-s2s3 only when the user clicks into the
full item browser. In dev mode, the API route serves this live from JSONL
anyway, so the split matters only for production.

**All generated files must include `"generated": "<ISO timestamp>"` at the
root** to enable the stale-data banner in production mode.

---

## Sources

| #   | Source                                                            | Title                                                              | Type              | Trust | CRAAP     | Date       |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- | ----- | --------- | ---------- |
| 1   | `next.config.mjs` (filesystem)                                    | Next.js config with `output: "export"`                             | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 2   | `components/dev/dev-tabs.tsx` (filesystem)                        | Current DevTabId union and TABS array                              | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 3   | `components/dev/dev-dashboard.tsx` (filesystem)                   | Dashboard layout and tab dispatch                                  | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 4   | `components/dev/lighthouse-tab.tsx` (filesystem)                  | Reference tab UX implementation                                    | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | `package.json` (filesystem)                                       | Installed dependencies, scripts                                    | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | `components/notebook/pages/resources-page.tsx` (filesystem)       | Existing `NODE_ENV` detection pattern                              | Source file       | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 7   | `.research/debt-runner-expansion/RESEARCH_OUTPUT.md`              | Hybrid fetch architecture, field-stripping rationale, bug analysis | Internal research | HIGH  | 4/5/5/5/5 | 2026-03-27 |
| 8   | `.research/dev-dashboard/findings/W3-T2A-debt-data-design.md`     | Debt tab data design, static JSON sizes, URL pattern               | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 9   | `.research/dev-dashboard/findings/W3-T1A-health-data-design.md`   | Health tab data schema, file sizes                                 | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 10  | `.research/dev-dashboard/findings/W3-T3A-reviews-data-design.md`  | Reviews tab data design, ~28 KB output                             | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 11  | `.research/dev-dashboard/findings/W3-T4A-pipeline-data-design.md` | Pipeline tab data design, ~26 KB output                            | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 12  | `.research/dev-dashboard/findings/W3-T5A-audits-data-design.md`   | Audits tab data design, ~185–190 KB output                         | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 13  | `.research/dev-dashboard/findings/W3-T6A-planning-data-design.md` | Planning tab data design, output files                             | Internal research | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 14  | JSONL file measurements via `wc` (filesystem)                     | Actual byte counts for all source files                            | Filesystem        | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**Debt endpoint naming:** The debt-runner research (source 7) calls the API
route `/api/debt-data` while the W3-T2A debt data design (source 8) specifies
`/api/debt/summary` and `/api/debt/alerts` (split routes). These are not
directly contradictory — split routes are the correct design for the multi-file
debt strategy (summary + alerts + items separately). The single `/api/debt-data`
route in the debt-runner research was an earlier formulation before the
size-split strategy was finalized. **Resolution:** Use split routes as specified
in W3-T2A.

**Debt tab description in debt-runner research:** Says "static JSON for all
items would be 7.6 MB" but also says "field stripping to approximately 2 MB."
The 2 MB figure applies to a single field-stripped bundle of all 8,472 items.
The split strategy (debt-alerts + debt-items-s0s1 + debt-items-s2s3) totals
approximately 3.1 MB across three files with slightly more fields. Both are
internally consistent — the 2 MB figure was the "minimal columns" target; the
actual split design is slightly larger due to more fields included.

---

## Gaps

**planning-data.json exact size:** The W3-T6A research does not give a precise
byte-count estimate for `public/planning-data.json`. The "~20–40 KB" estimate is
inferred from source file sizes (research-index.jsonl = 1.8 KB, deep-plan state
files = 8 files × ~3 KB average = ~24 KB, lifecycle-scores = 10 KB). Actual
output size depends on how much of each deep-plan state is included.

**ROADMAP.md `--json` flag:** The planning tab requires structured task output
from `scripts/resolve-dependencies.js`. The `--json` flag does not yet exist on
this script. This is a confirmed pre-work gap from the CHECKPOINT. The planning
tab's sprint board widget cannot be fully built until this flag is added.

**`public/planning-data.json` gitignore strategy:** Should it be gitignored like
debt data? The file is smaller and includes planning state from `.claude/state/`
which is already committed. This is not resolved by existing research —
recommend gitignoring it since it is a derived build artifact.

**`velocity-log.jsonl` is broken:** The CHECKPOINT notes "velocity-log.jsonl
broken (show 'unavailable' state)." The file exists (50 entries, 7.5 KB) but the
data inside is confirmed unreliable. The build script must handle this
gracefully — write a `velocityStatus: "unavailable"` flag to
`pipeline-data.json` and the tab must render a "data unavailable" placeholder
for the velocity widget.

**Comprehensive ecosystem audit deletes JSON at run end:** The audit skill
deletes its output JSON file at the end of a run. The build script cannot rely
on a stale artifact from this process. The `*-ecosystem-audit-history.jsonl`
files are the stable source.

---

## Serendipity

**`prebuild` slot is clean:** No `prebuild` script exists in package.json, and
npm's automatic lifecycle hook (`prebuild` runs before `build`) means zero
package.json boilerplate beyond a single script entry. No Makefile, no shell
wrapper, no build orchestrator needed.

**`empty-state.tsx` is already installed** at `components/ui/empty-state.tsx`.
This component should be used for the "no data yet — run build script" state
across all 6 tabs. Avoids recreating the same hollow-state UX pattern that
lighthouse-tab does inline.

**`skeleton.tsx` is already installed.** The lighthouse tab uses plain text
"Loading..." — new tabs should use skeleton loaders from
`components/ui/skeleton.tsx` for a more polished experience with zero additional
dependencies.

**Process compliance data is entirely pre-computable at build time.** The W3-T4A
design confirms that all process compliance metrics (bypass rate, auto-fix rate,
chronic skip detection, agent compliance rate, retro follow-through) can be
derived at build time from the JSONL sources and stored as scalar values in
`pipeline-data.json`. The tab component renders pre-computed numbers — no
client-side computation beyond display.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 1 (planning-data.json size — inferred, not measured)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
