# Findings: Debt-Runner Research Integration with Unified Dashboard Plan

**Searcher:** deep-research-searcher **Profile:** codebase (reconciliation)
**Date:** 2026-03-29 **Sub-Question IDs:** SQ7a

**Sources consumed:**

- `.research/debt-runner-expansion/RESEARCH_OUTPUT.md` (941 lines, 13+4 agents,
  L3 depth)
- `.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md` (DD1-DD10 decisions)
- `.research/debt-runner-expansion/SYNERGIES.md` (cross-tab synergy matrix)
- `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md` (6-tab
  structure)
- `.research/dev-dashboard/findings/W3-T2A-debt-data-design.md` (Tab 2 data
  design, 712 lines)
- `.research/dev-dashboard/findings/W3-T2B-debt-cli-handoff.md` (Tab 2 CLI
  handoff)

---

## 1. Decision Reconciliation (DD1-DD10)

### DD1 — External sources scope: use everything currently available

**Status: HOLDS.** The dashboard plan does not introduce any new external source
scope constraints. Tab 2 reads from MASTER_DEBT.jsonl, metrics.json,
metrics-log.jsonl, intake-log.jsonl, resolution-log.jsonl, and
review-needed.jsonl — all currently available files. No conflict.

### DD2 — Debt refresh model: additive reconciliation, preserve DEBT-XXXXX IDs

**Status: HOLDS.** The hybrid fetch strategy (dev: live API route reading
MASTER_DEBT; production: static snapshot) is fully compatible with additive
reconciliation. The dashboard is read-only; it never mutates MASTER_DEBT. The
`generate-debt-export.js` build script reads from MASTER_DEBT directly without
rewriting it. No conflict.

### DD3 — Full documentation of all 30 scripts

**Status: HOLDS, scope extended.** W3-T2B documented all 30 scripts with CLI
flags and invocation patterns. The CLI handoff inventory (Section 4 of T2B)
provides the exact clipboard command strings the dashboard should copy. This
decision is satisfied and expanded — the dashboard now has a precise
script-to-command mapping.

### DD4 — Full mapping of ALL audit skills' findings paths to TDMS

**Status: HOLDS, partially out-of-scope for dashboard.** This decision affects
TDMS intake pipelines. The dashboard is read-only and does not change audit
skill routing. The implication for the dashboard is Widget 9 (Intake Activity
Timeline) which shows `intake-log.jsonl` entries — the intake pathway provenance
(which skill produced each entry) is preserved via the `source` field in
MASTER_DEBT. No conflict.

### DD5 — Trace ALL "defer to TDMS" locations; deeply interactive menus

**Status: HOLDS, split between CLI and web.** The RESEARCH_OUTPUT confirmed the
CLI will be the interactive side (menus, submenus, guided mode). The dashboard's
role is specifically read-side browsing and filter-to-clipboard handoff. The
10-mode CLI menu structure from the research (Section 8) is the primary locus of
this decision. No conflict with the dashboard design.

### DD6 — Architecture: Hybrid CLI + Web Dashboard (Option C)

**Status: HOLDS AND IS THE FOUNDATION.** The 6-tab dashboard plan names Tab 2
"Debt Pipeline" and assigns it exactly the browse/filter/trends read-side role
specified in DD6. The CLI (`/debt-runner`, `/sonarcloud --sync`) is listed as
the write-side. This is fully aligned.

**One refinement from W3-T2A:** the dashboard plan's Tab 2 notes a MASTER_DEBT
field-stripped size of "~300KB" in the CHECKPOINT, but the W3-T2A data design
measured the 13-field strip at ~2.6 MB for all items. The CHECKPOINT estimate
was based on 7-field strip of a subset. The split-file strategy (S0+S1 = 464 KB
initial load, S2+S3 = 2.2 MB lazy) is the correct implementation path per
W3-T2A. **The "~300KB" figure in CHECKPOINT-tab-decisions.md should be treated
as a placeholder, not a constraint.** No conflict in architecture; minor data
size figure correction needed.

### DD7 — Web dashboard context: ONE tab of broader dev dashboard

**Status: HOLDS, confirmed by final structure.** The 6-tab structure places debt
as Tab 2. The research's entire cross-tab synergy framework (SYNERGIES.md) was
designed with this multi-tab context in mind. Tab 2 (Debt Pipeline) is one of
six coordinated tabs. No conflict.

### DD8 — /deep-plan scope: both CLI + web + ALL downstream

**Status: HOLDS, now fully scoped.** The reconciliation here (this document)
provides the data for /deep-plan to plan both workstreams together. The bug
fixes (BUG-01 through BUG-06), integration gaps, and web tab are all in scope.
No conflict.

### DD9 — CLI remains significantly interactive (menus and submenus)

**Status: HOLDS.** The research's 10-mode menu structure with guided mode
default (Section 8 of RESEARCH_OUTPUT) confirms the CLI is not a thin wrapper.
The dashboard offloads only the read/browse side. No conflict.

### DD10 — ALL downstream changes in scope: 6 bugs, integration gaps, defer-paths

**Status: HOLDS, with prioritization added.** The research confirmed this scope.
The RESEARCH_OUTPUT established a fix sequence (BUG-01 → BUG-06 → BUG-03 →
BUG-04 → BUG-02 → BUG-05) and elevated 6 gaps as MUST-HAVE for the hybrid
architecture. The dashboard plan must budget for these pre-work items. See
Section 2 below.

**Summary: All 10 decisions hold without conflict.** The only correction is the
"~300KB" data size placeholder in CHECKPOINT-tab-decisions.md, which should read
"~464 KB initial (S0+S1) + 2.2 MB lazy (S2+S3)."

---

## 2. Bug Status — Dashboard Development Impact

Six bugs were confirmed in RESEARCH_OUTPUT Section 10. Here is their impact on
dashboard development specifically:

### BUG-01 — Lowercase status strings in debt-health.js [MUST FIX FIRST]

**Location:** `debt-health.js` line 65 — uses `d.status !== "resolved"` but
canonical values in MASTER_DEBT are `RESOLVED` (uppercase).

**Dashboard impact: CRITICAL.** If BUG-01 is not fixed before web development:

- Status filter dropdowns (`NEW`, `VERIFIED`, `RESOLVED`, etc.) will return zero
  results for `RESOLVED` items
- Average age calculations in Widget 12 (Health Stats) will be wrong
- The KPI strip `summary.resolved` count comes from `metrics.json` (generated by
  `generate-metrics.js`, not `debt-health.js`), so Widget 1 is unaffected
- But any dashboard filtering on status field directly from MASTER_DEBT records
  will break

**Action: Fix before writing a single line of dashboard code.** W3-T2A
recommended adding `status.toUpperCase()` normalization in the data loading
layer as a defensive measure regardless.

### BUG-06 — metrics-log.jsonl missing by_source/by_category [MUST FIX FIRST]

**Location:** `logMetricsGeneration()` in `generate-metrics.js` lines 335-356.

**Dashboard impact: CRITICAL for trend charts.** All 113 existing log entries
are missing `by_severity`, `by_category`, `by_source`. Dashboard Widget 5 (Debt
Trend Line) can only show `total`, `open`, `resolved`, `s0_alerts`, `s1_alerts`
from existing data. After the fix is applied and metrics are regenerated, future
entries will have breakdown fields — but the historical trend charts will never
show breakdown series for the pre-fix period (49 dates of history are lost for
those fields).

**Dashboard UI consequence:** The trend chart must show a message on chart
render: "Breakdown trend data not available before [fix date]. Only total/open/
resolved series are historical." W3-T2A documented this limitation explicitly.

**Action: Fix and regenerate metrics before web development starts.** This
unblocks chart construction.

### BUG-03 — resolve-bulk.js missing sync-deduped.js call [PRE-WEB, NOT BLOCKING]

**Location:** `resolve-bulk.js` (492 lines) — no call to `sync-deduped.js` after
bulk resolve.

**Dashboard impact: LOW for display, HIGH for data integrity.** After a bulk
resolution event, the MASTER_DEBT snapshot shown in the dashboard may be
inconsistent until `sync-deduped.js` is run manually. The dashboard will show
items as still-open that were bulk-resolved. This is a data integrity issue in
the CLI, not a dashboard rendering bug.

**Action: Fix before production use, not blocking for initial development.** The
dashboard will display whatever MASTER_DEBT contains; fixing this ensures
MASTER_DEBT is accurate after resolution operations.

### BUG-04 — TRIAGED status not in schema enum [MEDIUM — FIX BEFORE FILTERS]

**Location:** Status schema definition.

**Dashboard impact: MEDIUM.** If TRIAGED items exist in MASTER_DEBT, the status
filter will bucket them as "unknown" or miss them. Widget 3 (Status Breakdown)
will not include a TRIAGED segment. W3-T2A's verified schema shows 5 status
values (`NEW|VERIFIED|IN_PROGRESS|RESOLVED|FALSE_POSITIVE`) — TRIAGED is absent
from both the schema and the data observation. Low immediate risk.

**Action: Add TRIAGED to status enum and web filter before deploying filters to
users. Not blocking for initial skeleton build.**

### BUG-02 — No --dry-run flag on resolve commands [LOW — NOT DASHBOARD-RELEVANT]

**Dashboard impact: NONE.** The dashboard does not invoke resolve scripts
directly. It generates clipboard commands. The absence of --dry-run on
resolve-debt.js affects CLI usability, not the dashboard.

**Action: Fix for CLI completeness, not a dashboard prerequisite.**

### BUG-05 — Shallow promotion (field copy, not deep clone) [LOW — NOT DASHBOARD-RELEVANT]

**Dashboard impact: NONE.** This is a CLI data integrity issue affecting
resolution objects. The dashboard renders whatever resolution object is in
MASTER_DEBT; it does not introspect resolution object structure.

**Action: Fix for CLI data integrity, not a dashboard prerequisite.**

### Bug fix sequence for dashboard-driven prioritization:

**Phase 0 (must complete before dashboard dev):** BUG-01, BUG-06 **Phase 1
(complete before dashboard goes to production):** BUG-03, BUG-04 **Defer (no
dashboard impact):** BUG-02, BUG-05

---

## 3. Capability Coverage — 27 Capabilities Mapped to Tab 2 Widgets

The RESEARCH_OUTPUT identified 27 capabilities split across CLI (write) and web
(read). The 9 web capabilities map to Tab 2 widgets as follows.

### Web-side capabilities mapped to Tab 2 widget design (W3-T2A)

| Capability # | Capability name         | Widget in Tab 2                                                      | Notes                                                                            |
| ------------ | ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 11           | View all items (table)  | Widget 8: DebtItemsTable (TanStack Table + Virtual)                  | Initial view: S0+S1 only; "Load all" expands to S2+S3                            |
| 12           | Filter by status        | Widget 8: DebtTableFilters dropdown                                  | Multi-select status filter; normalize to uppercase per BUG-01                    |
| 13           | Filter by severity      | Widget 8: DebtTableFilters dropdown + Widget 2 donut click-to-filter | Tier 1 always-visible filter                                                     |
| 14           | Filter by category      | Widget 8: DebtTableFilters dropdown + Widget 4 bar-click-to-filter   | Tier 2 collapsible panel                                                         |
| 15           | Search (inverted index) | Widget 8: MiniSearch input above table                               | MiniSearch replaces Ctrl+F; prominently positioned                               |
| 16           | Trend charts            | Widget 5: DebtTrendChart (Recharts LineChart)                        | 5 series: total/open/resolved/s0/s1; breakdown series blocked pending BUG-06 fix |
| 17           | KPI panel               | Widget 1: DebtSummaryStrip (6 KPI cards)                             | total, S0, resolved, rate, freshness, top-category                               |
| 19           | Export CSV              | Not in W3-T2A widget spec                                            | Gap: papaparse export not included in component tree — needs adding              |
| 20           | Export JSONL            | Not in W3-T2A widget spec                                            | Gap: raw download not in component tree — needs adding                           |

### Web capabilities from capability matrix NOT yet in W3-T2A widget spec

| Capability # | Capability name         | Status                        | Notes                                                                                                                                                                      |
| ------------ | ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18           | AI insights panel       | Gap — not in W3-T2A           | Pre-generated at build time. Add as Widget 0 (above KPI strip). Requires `build-debt-data.js` → `public/debt-insights.json`. Optional but HIGH value.                      |
| 21           | Discovery panel         | Gap — not in W3-T2A           | `discovery-runs.jsonl` (new file). Not in current data inventory. Blocked until CLI discovery mode is built. Defer to post-CLI-expansion phase.                            |
| 22           | Override promotion view | Gap — not in W3-T2A           | `override-log.jsonl`. In Tab 4 (Build Pipeline) per CHECKPOINT. NOT in Tab 2. Cross-tab synergy: Tab 4 "Promote to Debt" button generates `/add-debt` command.             |
| 23           | Warning promotion view  | Gap — not in W3-T2A           | `hook-warnings-log.jsonl`. In Tab 1 (Health & Alerts) per CHECKPOINT. NOT in Tab 2. Same cross-tab synergy model as Override.                                              |
| 24           | Dark debt status view   | Gap — not in W3-T2A           | `known-debt-baseline.json` (~40 entries). Not in Tab 2 widget spec. Closest home: Tab 5 (Governance & Audits).                                                             |
| 25           | Health report summary   | Partial — Widget 12 covers it | Widget 12 (DebtHealthStats) shows avg age, oldest item, verification queue. Full health report is CLI (`/debt-runner health`). Dashboard shows summary only, per research. |
| 26           | Source breakdown        | Widget 6: SourceBreakdown     | Mapped in W3-T2A Widget 6.                                                                                                                                                 |
| 27           | Session delta           | Not in Tab 2                  | Sessions tab (Tab 6?) uses metrics-log consecutive entries. Cross-tab synergy, not Tab 2 direct.                                                                           |

### Capabilities 1-10 (CLI write-side) — NOT in Tab 2

All 10 write-side capabilities (intake, triage, resolve, bulk resolve,
annotation, discovery agents, dedup, metrics generation, SQLite sync, static
JSON build) remain CLI-only. The dashboard generates clipboard commands for
triggering them (W3-T2B Section 4) but does not implement them as web actions.

### Export capabilities gap (19, 20)

Both CSV export (papaparse) and JSONL download are listed in the research
capability matrix but are absent from the W3-T2A component tree. These should be
added to DebtItemsTable as action buttons (Export CSV / Export JSONL) using the
existing papaparse pattern from the research. This is a small addition not
requiring new dependencies if papaparse is installed.

---

## 4. Implementation Phasing Alignment

The RESEARCH_OUTPUT proposed a 4-phase sequence. Here is how it maps to the
unified dashboard build order.

### Research Phase 1: Bug fixes + data plumbing

**Research scope:** Fix BUG-01 and BUG-06, add `discovery_source` passthrough to
`intake-audit.js`, fix `resolve-debt.yml` to call `generate-metrics.js`, add
`generate-metrics.js` to `consolidate-all.js`, build `build-debt-data.js`
(static JSON export), build `/api/debt-data` (dev mode API route).

**Maps to: Dashboard pre-work.** This phase must complete before any dashboard
component is written. In the unified build order, this is the pre-build gate
phase. Without BUG-01 and BUG-06 fixed, the first render will show wrong data.

**Deliverables before dashboard build begins:**

- BUG-01 fixed, MASTER_DEBT status values normalized
- BUG-06 fixed, metrics regenerated with by_source/by_category
- `scripts/generate-debt-export.js` (or `build-debt-data.js`) written and tested
  — produces the 7 public/ JSON files per W3-T2A Section 3
- `/api/debt/summary`, `/api/debt/items`, `/api/debt/alerts` API routes written
  for dev mode hybrid fetch

### Research Phase 2: Web tab foundation (Widgets 1-7)

**Research scope:** DebtTab shell (3-file change), KPI panel, charts row, trend
chart, S0 alert table. TanStack Table + Virtual installed, Recharts added via
shadcn, MiniSearch added.

**Maps to: Tab 2 build, milestone 1.** In the unified dashboard, this is the
first deliverable: a working Tab 2 with KPI strip, breakdown charts, trend line,
and S0 table. No virtualized table yet (deferred to Phase 3), but the data layer
is proven.

**Dependency installs required first (per research verification):**

- `npx shadcn@latest add chart` (pulls Recharts; NOT currently installed)
- `npm install @tanstack/react-table` (NOT currently installed)
- `npm install @tanstack/react-virtual` (NOT currently installed)
- `npm install minisearch` (NOT currently installed; replaces Fuse.js)
- `npm install papaparse` (NOT currently installed; for export)
- Verify `"overrides": { "react-is": "^19.0.0" }` in package.json for Recharts
  React 19 compat

### Research Phase 3: Full table with virtualization (Widget 8)

**Research scope:** DebtItemsTable with TanStack Virtual, multi-filter
dropdowns, MiniSearch integration, column toggles, grouping modes,
DebtDetailPanel (description/recommendation on demand).

**Maps to: Tab 2 build, milestone 2.** The virtualized table is the most complex
component in Tab 2. The research validated TanStack Virtual v3 as the correct
solution for 8,472 rows at 60fps. Key UX constraint: MiniSearch input must be
prominently positioned above table with label "Search items — replaces Ctrl+F"
to address the virtualization Ctrl+F tradeoff.

**Implementation notes from research:**

- Default table state: filter to S0+S1, load S2+S3 lazily
- Default sort: Severity DESC, then Age DESC
- 7 default visible columns, 9 togglable
- Tier 1 filters always visible (Status, Severity); Tier 2 collapsible; Tier 3
  v2 only
- Grouping modes (7): by Severity, Category, Source, Status, File directory, Age
  Bucket, None

### Research Phase 4: CLI expansion + discovery agents

**Research scope:** 10-mode CLI menu, guided mode, 3 initial discovery agents,
discovery-runs.jsonl, resolution-rate gate.

**Maps to: CLI workstream, post-web.** In the unified plan, this is a parallel
or subsequent workstream to web tab development. The CLI expansion does not
block the dashboard read-side beyond Phase 1 bug fixes. The Dashboard Discovery
Panel (Capability 21) requires this phase to complete before it can be built.

**Phasing verdict:** CLI expansion can proceed in parallel with or after
dashboard Phase 3. The discovery panel widget in Tab 2 is deferred until CLI
Phase 4 completes. This is a clean stop point.

### Additional phase: Tab 2 supplementary widgets

Not explicitly in research phasing but required for full Tab 2 coverage:

- Widget 9+10: Intake/Resolution Activity Feed (from debt-activity.json)
- Widget 11: Verification Queue (from debt-review-queue.json)
- Widget 12: Health Stats (from debt-summary.json)
- AI Insights card (from debt-insights.json — optional; requires Anthropic API
  key)
- CSV/JSONL export buttons (papaparse)

These can be added incrementally after the Phase 2 foundation is working.

---

## 5. Cross-Tab Synergies Now Possible with 6 Tabs

The SYNERGIES.md was written with a different assumed tab structure (Lighthouse,
Errors, Sessions, Docs, Overrides, Warnings as separate tabs). The unified 6-tab
structure consolidates some of these. Here is how each SYNERGIES.md synergy maps
to the actual 6-tab structure.

### Tab structure remapping

| SYNERGIES.md tab    | Actual 6-tab home                                                               | Notes                                                                                          |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Lighthouse tab (B5) | Tab 1 (Health & Alerts) or separate — check ROADMAP                             | CHECKPOINT does not list Lighthouse in the 6 tabs. It may remain as its own tab outside the 6. |
| Errors tab (B6)     | Not in the 6 tabs                                                               | Unbuilt; no data source defined. Synergies deferred.                                           |
| Sessions tab (B7)   | Tab 6 (Planning & Research) partial; no standalone Sessions tab                 | Sessions activity not in the 6-tab structure. Debt delta synergy deferred.                     |
| Docs tab (B8)       | No standalone Docs tab in the 6                                                 | Documentation badge synergy possible via Tab 5 (Governance & Audits).                          |
| Overrides tab (B9)  | Tab 4 (Build Pipeline & Process Compliance) — override-log.jsonl is listed here | Override → Debt synergy is active: Tab 4 includes override-log.jsonl.                          |
| Warnings tab (B11)  | Tab 1 (Health & Alerts) — hook-warnings-log.jsonl listed here                   | Warning → Debt synergy is active: Tab 1 includes hook-warnings-log.                            |

### Synergies NOW ACTIVE with 6-tab structure

**Tier 1 — Build during Debt tab construction (zero marginal cost):**

1. **`setActiveTab` + `setDebtFilter` prop threading** — Lift debtFilter to
   DevDashboard state. Pass to Tab 1, Tab 4, Tab 5. Unlocks all deep-link
   navigations from other tabs into Tab 2 with a pre-set filter. ~20 lines.

2. **`CopyCliButton` shared component** — Tab 2 needs this anyway. Extract to
   `components/dev/shared/copy-cli-button.tsx` immediately. Tab 1, Tab 4, Tab 5
   will reuse it for their own CLI handoffs.

3. **`MetricCard` shared component** — Tab 2's KPI strip. Extract to
   `components/dev/shared/metric-card.tsx`. Tab 1 (Health scorecards) and Tab 5
   (Governance audit scores) will reuse.

4. **`useDebtMetrics()` shared hook** — Design the hook during Tab 2 build;
   implement when Tab 1 needs `by_severity.S0` as a health indicator.

**Tier 2 — Build when implementing each tab:**

5. **Tab 4 → Tab 2: Override promotion (DARK-02 closure)** — Tab 4's
   override-log.jsonl section should include a "Promote to Debt" button for
   aging overrides (>14 days, no DEBT-XXXXX). Generates `/add-debt` command.
   Uses `PromoteToDebtButton` shared component. This directly closes DARK-02
   from the research gaps section. Build when Tab 4 is implemented.

6. **Tab 1 → Tab 2: Warning promotion** — Tab 1's hook-warnings-log section
   should flag entries with `occurrences_since_ack >= 5` as systemic process
   debt candidates. "Create Debt Item" button. Build when Tab 1 is implemented.

7. **Tab 5 → Tab 2: Deferred findings promotion** — CHECKPOINT lists "Deferred
   findings promoted to TDMS" in Tab 5. This uses the same PromoteToDebtButton
   pattern. Connects audit skill deferrals to TDMS intake. Build when Tab 5 is
   implemented.

8. **Documentation debt badge** — If Tab 5 (Governance) or any tab references
   documentation quality, add a badge reading
   `metrics.json.by_category .documentation` (982 items) with deep-link to Tab 2
   filtered by `category=documentation`. One field read, no new data source.

**Tier 3 — After multiple tabs have working data pipelines:**

9. **Debt sparkline in Tab 2 header** — Full `open` trend from metrics-log
   history. Requires BUG-06 fix to have any breakdown data. The 5-series trend
   chart (Widget 5) is already planned in W3-T2A; no additional work needed.

10. **Session debt delta** — If sessions data becomes available (currently no
    data source found per RESEARCH_OUTPUT), metrics-log consecutive entry diffs
    produce per-session debt change (+N new, -M resolved).

11. **Debt Impact View (north-star, not v1)** — Cross-tab correlation view in
    Tab 2: given a debt item, show which other tabs have relevant data
    (file-matching Lighthouse route, security-matching Errors tab findings,
    override-matching Tab 4 entries). Requires all tabs built and their data
    sources accessible. Designed for from the start via filterable `file` and
    `category` fields.

### Synergies DEFERRED (blocked by unbuilt tabs)

- Errors tab (B6) synergies: npm audit gap analysis, "Track as debt" from error
  events. Blocked: B6 unbuilt, no Firestore path defined.
- Lighthouse tab: route-level debt overlay (Tier 3). Blocked: unclear if
  Lighthouse is one of the 6 tabs or a separate tab. Check ROADMAP.md.
- Sessions tab: debt delta per session column. Blocked: no standalone sessions
  tab in 6-tab structure; no session data source defined.

### The `PromoteToDebtButton` primitive unlocks all tabs

The single most leveraged piece of shared infrastructure from SYNERGIES.md is
`PromoteToDebtButton` — a reusable component that maps any structured entry
(override, warning, audit finding, error) to an `/add-debt` CLI command string
copied to clipboard. Build this as
`components/dev/shared/promote-to-debt-button.tsx` during the Tab 2 build. Every
subsequent tab that has "track this as debt" actions gets it for free.

---

## Summary of Integration Gaps

Items identified during reconciliation that need resolution in /deep-plan:

| Gap | Description                                       | Severity | Owner                                                                        |
| --- | ------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| G1  | CSV/JSONL export not in W3-T2A widget spec        | MEDIUM   | Add to DebtItemsTable build                                                  |
| G2  | AI Insights panel (Capability 18) not in W3-T2A   | LOW      | Optional; needs API key setup decision                                       |
| G3  | Discovery Panel (Capability 21) not in Tab 2 spec | LOW      | Deferred until CLI Phase 4 completes                                         |
| G4  | Override/Warning promotion views not in Tab 2     | INFO     | Correct: they live in Tab 4 / Tab 1                                          |
| G5  | "~300KB" size in CHECKPOINT is incorrect          | INFO     | Correct to "~464KB initial + 2.2MB lazy"                                     |
| G6  | Lighthouse tab not in 6-tab structure             | UNKNOWN  | Needs ROADMAP.md check; synergy design depends on this                       |
| G7  | Session debt delta blocked                        | LOW      | No sessions data source; defer                                               |
| G8  | `useTabRefresh` scoped to AdminTabId              | MEDIUM   | Generalize or create DevTabId variant when Tab 2 needs refresh-on-activation |

---

## Sources

| #   | Path                                                           | Title                                                 | Type                                          | Trust | CRAAP     | Date       |
| --- | -------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- | ----- | --------- | ---------- |
| 1   | `.research/debt-runner-expansion/RESEARCH_OUTPUT.md`           | Debt-runner hybrid expansion research                 | Internal research (13+4 agents, L3)           | HIGH  | 5/5/5/5/5 | 2026-03-27 |
| 2   | `.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md`        | Pre-plan DD1-DD10 decisions                           | Session decisions (canonical)                 | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 3   | `.research/debt-runner-expansion/SYNERGIES.md`                 | Cross-tab synergy matrix                              | Internal research (verified against codebase) | HIGH  | 5/5/5/5/5 | 2026-03-27 |
| 4   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md` | 6-tab structure (Session #245)                        | User decision checkpoint                      | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | `.research/dev-dashboard/findings/W3-T2A-debt-data-design.md`  | Tab 2 data design (712 lines, direct file inspection) | Internal research                             | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | `.research/dev-dashboard/findings/W3-T2B-debt-cli-handoff.md`  | Tab 2 CLI handoff (skill + script ground truth)       | Internal research                             | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**1. Data size in CHECKPOINT vs. W3-T2A measurement**

CHECKPOINT-tab-decisions.md states "MASTER_DEBT.jsonl field-stripped (~300KB)"
for Tab 2. W3-T2A measured the actual 13-field strip at 2,641 KB (all items).
The 300 KB figure appears to be an early estimate based on a 7-field strip of a
subset. The correct figure for /deep-plan budgeting is: 464 KB initial load
(S0+S1) + 2.2 MB lazy (S2+S3). Not a design conflict, but a stale number.

**2. SYNERGIES.md assumes standalone tabs not in 6-tab structure**

SYNERGIES.md designed synergies for B5 Lighthouse, B6 Errors, B7 Sessions, B8
Docs, B9 Overrides, B11 Warnings as separate tabs. The 6-tab CHECKPOINT merges
some of these (overrides → Tab 4, warnings → Tab 1) and has no standalone
sessions or docs tab. The synergy mechanisms (prop threading,
PromoteToDebtButton) still apply — they route through the consolidated tabs
instead of standalone ones. The underlying infrastructure recommendations are
correct; only the tab routing labels change.

**3. Discovery panel in Tab 2 vs. deferred discovery infrastructure**

RESEARCH_OUTPUT Capability 21 places the Discovery Panel in Tab 2. However,
`discovery-runs.jsonl` is a new file that does not yet exist (requires CLI
discovery mode to be built). Building a Widget for a file that does not exist
would be premature. Correct approach: design Tab 2 with a placeholder slot for
the Discovery Panel that activates when `discovery-runs.jsonl` is first created.

---

## Gaps

1. **Lighthouse tab status unclear.** SYNERGIES.md treats it as an existing tab.
   The 6-tab CHECKPOINT does not include it. RESEARCH_OUTPUT mentions a
   Lighthouse tab reading Firestore. Cannot confirm whether it is inside or
   outside the 6-tab structure without checking the current dev-tabs.tsx or
   ROADMAP.md.

2. **`/debt-runner` does not support single-item targeting.** W3-T2B confirmed
   no `/debt-runner verify DEBT-XXXXX` command exists. The dashboard's "Verify
   this item" CTA must use the severity-slice form
   (`/debt-runner verify --severity {item.severity}`) or the direct script
   (`resolve-item.js`). This is a CLI capability gap, not a dashboard design gap
   — but it limits the precision of in-dashboard CLI suggestions.

3. **AI Insights panel (Capability 18) requires a decision** on Anthropic API
   key setup in the build environment. If accepted, it adds ~30 lines to
   `build-debt-data.js` and one React card component. If deferred, Tab 2 ships
   without this widget. Not blocking, but needs a /deep-plan go/no-go.

---

## Serendipity

**Tab 2 is the only tab with a fully-specified data pipeline.** The W3-T2A and
W3-T2B files provide the most complete pre-build specification of any tab in the
6-tab structure: exact file schemas, field coverage percentages, widget
component tree, data hooks, CLI command strings, and size calculations.
/deep-plan can write a nearly line-by-line build plan for Tab 2 using these
inputs alone.

**The PromoteToDebtButton pattern is the most generalizable infrastructure
decision in the entire dashboard.** Building it during Tab 2 construction (where
it first appears as a CLI clipboard copy button) seeds a reusable primitive that
will be used by Tab 1, Tab 4, Tab 5, and every future tab that encounters
trackable-as-debt data. This is zero extra cost if designed as shared from
day 1.

**`escalate-deferred.js` is invisible to users and has no dashboard surface.**
Discovered in W3-T2B: this script escalates items deferred N+ times but appears
in no skill documentation. Tab 2's Intake Activity Feed (Widget 9) could surface
escalation events from `intake-log.jsonl` as a distinct action type, making this
currently-invisible pipeline step visible without any new data collection.

---

## Confidence Assessment

- HIGH claims: 18 (all reconciliation conclusions, bug impact assessments,
  capability mappings, and phasing decisions — drawn from direct reading of
  source files with HIGH-confidence research backing)
- MEDIUM claims: 3 (Lighthouse tab status uncertain; AI insights go/no-go;
  Sessions synergy deferred on unknown)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All DD decision status assessments are based on direct comparison of research
conclusions against dashboard design. All bug impact assessments are based on
verified bug locations in RESEARCH_OUTPUT and dashboard widget specifications in
W3-T2A.
