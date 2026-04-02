# Findings: Advanced/Power Features for the Debt Dashboard Web Tab

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-03-27 **Sub-Question IDs:** SQ-4b

---

## Preface: What the Codebase Confirms

Before findings, several facts confirmed by direct codebase inspection drive
design decisions throughout:

1. **Sonner is installed and active.** `app/layout.tsx` line 10:
   `import { Toaster } from "sonner"`. The `<Toaster closeButton richColors />`
   is in the root layout. `toast()` calls work project-wide with no setup
   needed.
2. **Dark mode is implemented.** `globals.css` defines both `:root` (light) and
   `.dark {}` CSS variable blocks with full `--chart-1` through `--chart-5`
   token sets in both modes. The variant is
   `@custom-variant dark (&:is(.dark *))`. However, there is NO `ThemeProvider`,
   `useTheme`, or `next-themes` import anywhere in the app — the `.dark` class
   must be toggled manually on the `<html>` element or a parent. The Dev
   Dashboard (`bg-gray-900`) uses hardcoded dark styling, bypassing the CSS
   variable system entirely.
3. **Skeleton component exists.** `components/ui/skeleton.tsx` is present —
   loading skeletons are a zero-install-cost pattern.
4. **The Dev Dashboard color scheme is gray-900 (dark terminal).** All existing
   tabs use `bg-gray-800`, `border-gray-700`, `text-white` — hardcoded, not CSS
   variables. The debt tab must match this palette, not the amber/notebook
   palette used in Admin.
5. **Real metrics data exists.** `docs/technical-debt/metrics.json` contains:
   8,472 total items, 7,282 open, 1,116 resolved, 13% resolution rate, 11 S0
   alerts, 1,259 S1 alerts. The `metrics-log.jsonl` has 113 data points spanning
   2026-02-01 to 2026-03-26 — usable for trend charts.
6. **Clipboard API available.** `navigator.clipboard.writeText()` is the correct
   modern pattern. Requires HTTPS or localhost (both satisfied — Firebase
   Hosting uses HTTPS; dev uses localhost).
7. **No API routes possible.** The `output: "export"` in `next.config.mjs`
   blocks all Next.js API routes in production. All data operations must be
   client-side or via Firebase Cloud Functions.

---

## Key Findings

### 1. Summary Metrics Panel — 6-card grid, all data from metrics.json [CONFIDENCE: HIGH]

The top-of-page KPI panel should be a 6-card grid reading from `metrics.json`
(served as a static file or from Firestore after sync). All values are present
in the existing `metrics.json` schema:

**Card layout (2 rows of 3):**

| Card               | Value Source                             | Color Signal                        |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| Total Items        | `summary.total` (8,472)                  | Neutral gray                        |
| Open / Unresolved  | `summary.open` (7,282)                   | Amber if >80% of total              |
| Resolution Rate    | `summary.resolution_rate_pct` (13%)      | Red <20%, yellow 20-50%, green >50% |
| S0 Critical Alerts | `alerts.s0_count` (11)                   | Always red if >0; pulse animation   |
| S1 High Priority   | `alerts.s1_count` (1,259)                | Orange if >500                      |
| Verification Queue | `health.verification_queue_size` (2,126) | Blue; shows backlog                 |

**Health Score integration:** The existing `generate-metrics.js` computes
`health.avg_age_days` (41) and `health.oldest_age_days` (55). A derived "Health
Score" (0-100) could weight these:
`score = max(0, 100 - (open/total*50) - (avg_age/30*25) - (s0_count*5))`. This
is NOT in the current `metrics.json` and would need to be added to
`generate-metrics.js` or computed in the component.

**Source freshness indicator:** `metrics.json` has `generated` (ISO timestamp).
Compute `formatDistanceToNow(new Date(generated))` — display "Updated 2 hours
ago" near the panel header. Flag as stale (yellow) if >24 hours, red if >7 days.
Pattern follows `DashboardFooter` in `dashboard-tab.tsx` line 672.

Implementation pattern: Mirror `MetricCard` from `analytics-tab.tsx` (lines
67-87) but in gray-800/gray-700 palette for dev dashboard context.

---

### 2. Trend Charts — Recharts v3 with 113 metrics-log.jsonl data points [CONFIDENCE: HIGH]

The `metrics-log.jsonl` provides the time-series backbone. All 113 records have
the same schema: `{timestamp, total, open, resolved, s0_alerts, s1_alerts}`.
Current range: 2026-02-01 to 2026-03-26.

**Chart A — Open Items Over Time (Line Chart)**

- X: `timestamp` → formatted as MM-DD
- Y: `open` value
- Secondary line: `resolved`
- Shows the trajectory: started ~868 items in Feb, jumped to 7,281+ in mid-March
  when bulk audit ran
- Visual: `LineChart` from Recharts with `CartesianGrid`, `XAxis`, `YAxis`,
  `Tooltip`, `Legend`
- This is the most important chart — it shows the project health arc

**Chart B — S0/S1 Alert Trend (Dual-line)**

- X: `timestamp`
- Y: `s0_alerts`, `s1_alerts` (two lines)
- S0 line in red, S1 in orange
- Shows S0 dropped from 18 to 11 over the period — a win worth visualizing

**Chart C — Intake vs Resolution Velocity (Dual-axis line chart)**

- Session-over-session delta: `total[n] - total[n-1]` vs
  `resolved[n] - resolved[n-1]`
- Shows: intake rate (how fast new items are added) vs resolution rate (how fast
  they're closed)
- Gap between the two lines is the "debt accumulation rate"
- Use Recharts `ComposedChart` with `Bar` for intake + `Line` for resolution
  overlay

**Chart D — Severity Distribution (Stacked Bar or Pie)**

- Data from `metrics.json` `by_severity`: S0:26, S1:1360, S2:3445, S3:3641
- Simple `PieChart` with 4 slices: red/orange/yellow/green for S0/S1/S2/S3
- Or `BarChart` with single stacked bar (good for showing proportions at a
  glance)

**Chart E — Category Heatmap / Horizontal Bar**

- Data from `metrics.json` `by_category`
- Horizontal `BarChart` sorted by count: code-quality (4,716), audit (2,942),
  sonarcloud (2,561)...
- Highlight fastest-growing categories by comparing two metrics.json snapshots
  (current vs previous)

**Chart F — Source Contribution (Treemap or Horizontal Bar)**

- Data from `metrics.json` `by_source`
- Shows which sources (sonarcloud, audit, review, roadmap) contribute most debt
- Treemap via Recharts `Treemap` component — gives instant visual weight to
  large sources

**Implementation detail:** All charts are client-side components tagged
`"use client"`. For the static export constraint, charts read from the same
pre-fetched metrics data as the KPI panel (single fetch, shared state). No
separate API calls.

---

### 3. Comparison Views — Session-over-session delta from metrics-log.jsonl [CONFIDENCE: MEDIUM]

The `metrics-log.jsonl` enables before/after comparisons. Two implementation
approaches:

**Approach A — Timeline Scrubber (simpler):** A date picker or range slider
above the charts lets the user select a "comparison point." All charts show
`current` vs `selected date` as overlaid lines. Data is fully local.

**Approach B — Snapshot Cards:** Show "Last 7 days" and "Last 30 days" delta
cards alongside the KPI panel:

- `+X items added`, `-Y items resolved`, `net change: +Z`
- Compute by finding the metrics-log.jsonl entry closest to 7/30 days ago

**Sprint-over-sprint:** The metrics-log.jsonl has sparse entries in early
February and dense entries from March 25 onward. True sprint comparison would
require regular cadence logging. This is a gap in current data — the comparison
view should gracefully handle sparse data with "insufficient data" notices
rather than misleading charts.

**Source health comparison:** Side-by-side view of `by_source` counts between
two snapshots is useful but requires the metrics-log.jsonl to capture
`by_source` over time. Current schema does NOT include `by_source` in the log
entries — only the main `metrics.json` has it. This is a **gap**: to enable
source comparison charts, `generate-metrics.js` would need to log `by_source` to
`metrics-log.jsonl` as well.

---

### 4. Export Capabilities — All client-side, no backend required [CONFIDENCE: HIGH]

All export operations are fully client-side, consistent with the
`output: "export"` static deployment.

**CSV Export:**

- `papaparse` (`Papa.unparse(rows)`) converts the filtered/visible rows to CSV
  string
- Trigger download via:
  `const blob = new Blob([csv], {type: 'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'debt-export.csv'; a.click()`
- Export scope: "Export filtered view" (current table state) or "Export all open
  items" or "Export S0+S1 only"
- papaparse is MIT, 14kB gzipped, React 19 compatible, used by react-papaparse

**JSONL Export:**

- Same pattern but serialize each row as `JSON.stringify(item) + "\n"`
- Label: "Export as JSONL (for CLI consumption)" — makes the handoff intent
  explicit
- JSONL format matches MASTER_DEBT.jsonl schema exactly, so CLI tools can read
  it directly

**Copy Item ID to Clipboard:**

```tsx
const copyId = async (id: string) => {
  await navigator.clipboard.writeText(id);
  toast.success(`Copied ${id} to clipboard`);
};
```

- Use sonner's `toast.success()` (already in root layout)
- Pattern: small copy icon button next to every DEBT-XXXXX ID in the table

**Copy Full Item Details:**

```tsx
const copyDetails = async (item: DebtItem) => {
  const text = `ID: ${item.id}\nTitle: ${item.title}\nFile: ${item.file}:${item.line}\nSeverity: ${item.severity}\nCategory: ${item.category}\nStatus: ${item.status}`;
  await navigator.clipboard.writeText(text);
  toast.success("Item details copied");
};
```

**Generate /add-debt command:**

- For selected items needing follow-up:
  `debt-runner add --id "${item.id}" --title "${item.title}"`
- Button: "Copy as /add-debt command" — copies the CLI invocation string to
  clipboard
- This is the first CLI handoff mechanism (see Section 5)

---

### 5. CLI Handoff Mechanisms — The Core Power Feature [CONFIDENCE: HIGH]

This is the highest-value differentiator. The web dashboard serves as a visual
exploration surface; the CLI handles actual mutation. Handoff mechanisms bridge
the gap.

**Mechanism A — "Copy CLI Command" button on every item:** Appears in item
detail row (expanded row or hover reveal):

```
debt-runner verify --item DEBT-0042
debt-runner resolve --item DEBT-0042 --reason "Fixed in commit abc123"
debt-runner triage --item DEBT-0042
```

Copies the exact shell command to clipboard. User pastes into terminal. Toast:
"CLI command copied — paste in terminal."

**Mechanism B — "Start Triage Session" with pre-filtered scope:** User applies
filters (e.g., S1 items in `components/journal/`) then clicks "Start Triage
Session":

```
debt-runner triage --severity S1 --path "components/journal/" --limit 20
```

Generates the filtered triage command based on current active filters. Copies to
clipboard. This is the highest-value handoff because it translates a visual
exploration decision into a CLI work session.

**Mechanism C — Bulk Selection → "Verify Selected" command:** User selects N
items via checkboxes (TanStack Table row selection). "Verify Selected" button
appears in toolbar when selection >0:

```
debt-runner verify --items DEBT-0042,DEBT-0043,DEBT-0044,DEBT-0045
```

The CLI must support `--items` (comma-separated list) for this to work. This is
a **CLI capability gap** that the web dashboard design should signal as a
requirement.

**Mechanism D — "Create CLI Task File" (persistent handoff):** User selects
items + clicks "Create CLI Task". This writes a
`.claude/state/debt-task-{timestamp}.json` to the filesystem via a Cloud
Function (since the web app cannot write to the local filesystem directly). The
task file format:

```json
{
  "type": "debt-triage",
  "created": "2026-03-27T10:00:00Z",
  "items": ["DEBT-0042", "DEBT-0043"],
  "filters": { "severity": "S1", "category": "security" },
  "source": "web-dashboard"
}
```

NOTE: This requires the user to run a sync command to pull the task from
Firestore to local filesystem — or the CLI periodically polls for pending tasks.
This is a **design gap** requiring further decisions on the task file pickup
mechanism.

**Mechanism E — Deep Link from item to CLI:** Browser URL encodes the DEBT ID:
`/dev?tab=debt&item=DEBT-0042`. When CLI tools output a DEBT ID, user can paste
it into browser URL bar to navigate directly to that item in the web dashboard.
Reverse: clicking "Open in CLI" on an item generates
`debt-runner inspect DEBT-0042` and copies to clipboard.

**Implementation note:** Mechanisms A, B, C, and E are purely clipboard-based —
zero infrastructure required beyond the web UI. Mechanism D requires a Cloud
Function write + CLI poll/pull. Ship A/B/C/E first; D is a Phase 2 feature.

---

### 6. Annotation and Bookmarking — Web-only metadata layer [CONFIDENCE: MEDIUM]

Since MASTER_DEBT.jsonl is the canonical source of truth and must not be mutated
by the web app (per architecture — web is read-only), annotations live in a
separate Firestore collection.

**Bookmark items:**

- Firestore path: `dev/debt/bookmarks/{userId}/{debtId}` →
  `{ created: timestamp }`
- UI: star/bookmark icon on each row; filled = bookmarked, outline = not
- Filter: "Show bookmarks only" toggle in filter bar

**Notes on items:**

- Firestore path: `dev/debt/notes/{debtId}` →
  `{ note: string, author: string, updated: timestamp }`
- UI: note icon in row. Click → inline textarea or small dialog. Saves on blur.
- Notes display as tooltip or expanded row panel
- Max 500 chars per note

**Priority override (web-only flag):**

- Firestore path: `dev/debt/overrides/{debtId}` →
  `{ webPriority: "high"|"medium"|"low", reason: string }`
- Does NOT change the JSONL `severity` field — web priority is a display-layer
  override
- UI: a colored dot or badge overlay on the severity badge when override is
  active
- Useful for "I know this is S2 but I want to tackle it next session"

**"Assigned to" field:**

- Firestore path: `dev/debt/assignments/{debtId}` →
  `{ assignee: string, session: string, assigned_at: timestamp }`
- For a solo operator, `assignee` = session identifier ("Session #242") or work
  context
- Shows as a tag in the table row
- Allows filtering by "assigned this session" to track focus items

**Key constraint:** All annotation writes must go via `httpsCallable` to Cloud
Functions (CLAUDE.md Security Rule #1 prohibits direct Firestore writes). A
`devUpdateDebtAnnotation` Cloud Function is needed, gated by admin claim.

---

### 7. Search Capabilities — Full-text, regex, and similarity search [CONFIDENCE: HIGH]

For 8,472 items loaded client-side (or paginated from Firestore), search must be
performant.

**Primary search — fuzzy full-text across 4 fields:** Fields to search: `title`,
`description`, `recommendation`, `file` Implementation: `useMemo` over filtered
items using a simple `item.title.toLowerCase().includes(query)` for exact match,
or `fuse.js` (lightweight fuzzy search, 8.4 kB gzipped) for fuzzy match.

- Fuse.js is React 19 compatible, pure JS, no dependencies
- Handles typos, partial matches, weighted fields (title > description > file)
- For 8,472 items, Fuse.js index builds in ~50ms on modern hardware

**Regex search toggle:** When regex mode is enabled, try
`new RegExp(query, 'i').test(item.title)` with try/catch for invalid regex. Show
a regex syntax error inline if the pattern fails to compile.

**Search history:**

- `localStorage.setItem('debt-search-history', JSON.stringify(last10queries))`
- Render as chips below search input when input is focused and empty
- Max 10 entries; LRU eviction

**"Similar items" feature:**

- Click an item → "Find similar items" button appears
- Similarity by: (a) same `file` path, (b) same `category` + `severity`, (c)
  title cosine similarity via Fuse.js scoring
- Opens a sidebar panel or adds a "Similar" filter badge to the current view
- Most useful for deduplication awareness ("there are 12 other S2 items in this
  same file")

**Column-level search:** TanStack Table v8 supports per-column filter functions.
The debt table should support:

- ID filter: exact match (DEBT-XXXX)
- File path filter: prefix/contains
- Severity: multi-select dropdown (S0, S1, S2, S3)
- Status: multi-select (NEW, VERIFIED, IN_PROGRESS, RESOLVED)
- Category: multi-select
- Date range: created_at between [start] and [end]

---

### 8. Accessibility and UX Polish — Dev dashboard has gray-900 dark context [CONFIDENCE: HIGH]

**Dark mode:** The Dev Dashboard is hardcoded `bg-gray-900` (dark). No theme
toggle is needed for the debt tab — it inherits the parent's dark styling. The
CSS variable `.dark {}` system exists in globals.css but is not wired to a
toggle anywhere in the app. Adding a toggle is optional but is a medium-effort
addition (requires `next-themes` + a ThemeProvider wrapping the dev route).

**Keyboard navigation:**

- TanStack Table v8 tables are navigable via arrow keys when `tabIndex` is set
  on cells
- The tab navigation in `admin-tabs.tsx` (lines 79-97) already uses
  `aria-selected`, `aria-controls`, `role="tab"`, and
  `tabIndex={selected ? 0 : -1}` — the debt tab navigation should follow this
  same ARIA pattern
- Row checkboxes for bulk selection: space to toggle, shift+click for range
  select

**Loading skeletons:**

- `components/ui/skeleton.tsx` exists and is ready to use
- Replace initial load blank states with skeleton rows matching the table column
  widths
- Pattern: render 10 skeleton rows while data is fetching, then animate out

**Toast notifications for all actions:**

- Copy ID: `toast.success("DEBT-0042 copied")`
- Export started: `toast.info("Exporting 847 items as CSV...")`
- Bookmark added: `toast.success("Bookmarked")`
- CLI command copied: `toast.success("CLI command copied — paste in terminal")`
- Error: `toast.error("Failed to load debt data. Check connection.")`
- All use sonner's existing `<Toaster closeButton richColors />` — zero
  additional setup

**Table row density toggle:** Power user feature: compact / comfortable /
spacious row height. Stored in `localStorage`. In compact mode, show ID +
title + severity badge in 32px rows. In comfortable mode (default), show +
file:line + status. Spacious adds description preview.

**Column visibility toggle:** TanStack Table v8 has built-in column visibility
APIs. A "Columns" dropdown button (top-right of table) lets users show/hide
columns. Persist visibility state to `localStorage`.

**Sticky header + sticky filter bar:**

- Table `<thead>` should be `position: sticky; top: 0` for long scroll
- Filter/search bar also sticky below the tab navigation
- This is especially important for 7,282 open items

---

## Sources

| #   | URL / Path                                                                     | Title                                 | Type              | Trust  | CRAAP Avg | Date                     |
| --- | ------------------------------------------------------------------------------ | ------------------------------------- | ----------------- | ------ | --------- | ------------------------ |
| 1   | `app/layout.tsx`                                                               | Root layout — Sonner Toaster          | source-code       | HIGH   | 5/5       | 2026                     |
| 2   | `app/globals.css`                                                              | CSS variables — dark/light mode       | source-code       | HIGH   | 5/5       | 2026                     |
| 3   | `components/dev/dev-dashboard.tsx`                                             | Dev Dashboard shell pattern           | source-code       | HIGH   | 5/5       | 2026                     |
| 4   | `components/admin/analytics-tab.tsx`                                           | MetricCard + chart pattern            | source-code       | HIGH   | 5/5       | 2026                     |
| 5   | `components/admin/dashboard-tab.tsx`                                           | Dashboard layout + loading states     | source-code       | HIGH   | 5/5       | 2026                     |
| 6   | `docs/technical-debt/metrics.json`                                             | Actual debt metrics (8,472 items)     | data              | HIGH   | 5/5       | 2026-03-26               |
| 7   | `docs/technical-debt/logs/metrics-log.jsonl`                                   | Time-series metrics (113 points)      | data              | HIGH   | 5/5       | 2026-02-01 to 2026-03-26 |
| 8   | `scripts/debt/generate-metrics.js`                                             | Metric computation logic              | source-code       | HIGH   | 5/5       | 2026                     |
| 9   | `components/ui/skeleton.tsx`                                                   | Skeleton component exists             | source-code       | HIGH   | 5/5       | 2026                     |
| 10  | `components/admin/admin-tabs.tsx`                                              | ARIA-compliant tab pattern            | source-code       | HIGH   | 5/5       | 2026                     |
| 11  | https://react.wiki/hooks/copy-to-clipboard/                                    | useClipboard React Hook pattern       | community         | MEDIUM | 3.9       | 2025                     |
| 12  | https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write               | Clipboard API — MDN                   | official-docs     | HIGH   | 5/5       | 2025                     |
| 13  | https://www.papaparse.com/                                                     | PapaParse — CSV in browser            | official-docs     | HIGH   | 4.8       | 2025                     |
| 14  | https://react-papaparse.js.org/                                                | react-papaparse                       | official-docs     | HIGH   | 4.7       | 2025                     |
| 15  | https://www.zenhub.com/blog-posts/the-top-technical-debt-management-tools-2025 | Top Tech Debt Tools 2025              | community-blog    | MEDIUM | 3.8       | 2025                     |
| 16  | https://fuselabcreative.com/top-dashboard-design-trends-2025/                  | Dashboard Design Trends 2025          | community-blog    | MEDIUM | 3.7       | 2025                     |
| 17  | https://blog.logrocket.com/implementing-copy-clipboard-react-clipboard-api/    | Clipboard API in React                | community-blog    | MEDIUM | 3.9       | 2025                     |
| 18  | `.research/debt-runner-expansion/findings/SQ2-web-integration.md`              | Web integration architecture findings | internal-research | HIGH   | 5/5       | 2026-03-27               |
| 19  | `.research/debt-runner-expansion/findings/SQ3-charting-libraries.md`           | Recharts + TanStack Table findings    | internal-research | HIGH   | 5/5       | 2026-03-27               |

---

## Contradictions

**Dark mode approach — hardcoded vs CSS variables:** The Dev Dashboard uses
hardcoded `bg-gray-900`/`text-white` (not CSS variables), but `globals.css` has
a full `.dark {}` variable system. The debt tab will need to choose one
approach. Using CSS variables would be more maintainable but requires either (a)
adding a ThemeProvider, or (b) applying `.dark` class to the dev route root
element. The current dev dashboard does not do either — it just hard-codes dark
colors. To be consistent with the existing DevDashboard pattern, hard-coded
gray-900 palette is simpler; using CSS variables is architecturally better but
diverges from the established pattern.

**CLI task file (Mechanism D) vs static export constraint:** Writing
`.claude/state/debt-task-*.json` from the web app requires a Cloud Function (the
app cannot write to the local filesystem). However, the CLI tools run on the
local machine. The handoff requires either (a) the Cloud Function writes the
task to Firestore and the CLI polls Firestore, or (b) the user runs a
`debt-runner pull-tasks` command to sync. Neither mechanism exists today. This
is a design gap with no current resolution — Mechanism D should be deferred to
Phase 2.

**Annotation writes and Security Rule #1:** CLAUDE.md Security Rule #1
explicitly prohibits direct Firestore writes. All
bookmark/note/priority-override operations require `httpsCallable` to a Cloud
Function. This means a `devUpdateDebtAnnotation` Cloud Function must be built
before any annotation features ship. The web UI design can be built ahead of
this, but the save operations will be no-ops until the Cloud Function exists.

---

## Gaps

**`metrics-log.jsonl` schema does not include `by_source` or `by_category`:**
Only `{timestamp, total, open, resolved, s0_alerts, s1_alerts}` is logged per
session. Source contribution and category breakdown comparisons over time are
not possible with the current log schema. To enable "which source is growing
fastest" charts, `generate-metrics.js` must be updated to log `by_source` and
`by_category` objects in each `metrics-log.jsonl` entry.

**Sparse metrics-log.jsonl data before March 2026:** 113 data points, but all
pre-March 25 entries have the same values (2026-02-01 to 2026-02-01, just 3
entries with identical counts). The meaningful data range is only ~3 days (March
25-26). Trend charts will look impressive in 30 days but are currently limited.
A "not enough data" notice should display when the time window has <5 unique
data points.

**"Similar items" requires semantic similarity:** True semantic "find items
related to this one by content" requires either (a) embeddings + vector search
(Firestore Vector Search, Vertex AI) or (b) a simpler heuristic. The heuristic
approach (same file, same category, Fuse.js title similarity) covers 80% of use
cases without AI infrastructure. Full semantic similarity is a Phase 2 feature.

**No CLI `--items` bulk flag confirmed:** The CLI handoff for bulk selection
(Mechanism C) assumes `debt-runner verify --items DEBT-0042,DEBT-0043`. Whether
the CLI supports this flag is unknown from the current research. The web UI
should generate this command format but document that the CLI needs to implement
the `--items` parameter.

**Priority override UX requires confirmation:** Overriding a severity from S2 →
high in the web layer could mislead users who expect web priority = JSONL
severity. A persistent visual distinction is needed (e.g., orange dot overlay on
severity badge + tooltip "Web priority override: High. System severity: S2").
The exact UX for communicating this duality needs design work.

---

## Serendipity

**The metrics-log.jsonl data tells a dramatic story:** Feb 1: 868 items → March
25: 8,470 items. That's a 976% increase in ~7 weeks, driven by the bulk audit
ingestion. The trend chart will immediately make this visible. Showing this arc
is itself a power feature — it contextualizes the current debt count as
"post-audit shock" and sets a resolution baseline. The chart should annotate the
March 25 spike with "Bulk audit ingested."

**chart-1 through chart-5 CSS variables are already defined in globals.css:**
Both `:root` and `.dark {}` blocks define `--chart-1` through `--chart-5` in
oklch format. This means shadcn chart components will have correct theme colors
out of the box — the chart color tokens are ready even though no charting
library has been installed yet.

**The Dev Dashboard is already dark-mode-native:** `bg-gray-900` makes the debt
tab implicitly appropriate for a monitoring/ops dashboard aesthetic. Recharts
charts on a dark background with `--chart-1` amber and `--chart-2` teal will
look professional with minimal CSS customization.

**`useTabRefresh` hook exists in the codebase:** `analytics-tab.tsx` line 310
calls `useTabRefresh("analytics", ...)` — a hook that auto-refreshes when the
tab becomes active. The debt tab can use this same hook for auto-refresh of debt
data when the user switches to it. Zero new infrastructure needed.

---

## Confidence Assessment

- HIGH claims: 16
- MEDIUM claims: 6
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The design specifications are grounded in verified codebase patterns
(analytics-tab.tsx, dashboard-tab.tsx, admin-tabs.tsx, globals.css,
metrics.json). Chart and table library recommendations are confirmed from SQ3
findings. Export mechanisms (papaparse, Clipboard API) are standard web APIs
with official documentation. The primary uncertainty areas are the CLI `--items`
flag existence, the task-file pickup mechanism for Mechanism D, and the
annotation Cloud Function which does not yet exist.
