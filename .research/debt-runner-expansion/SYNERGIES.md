# Dev Dashboard Cross-Tab Synergies Report

**Generated:** 2026-03-27 **Scope:** Debt tab (6th tab) — synergies with
Lighthouse, Errors, Sessions, Docs, Overrides, and future tabs **Data sources
verified:** components/dev/dev-tabs.tsx, dev-dashboard.tsx, lighthouse-tab.tsx,
override-log.jsonl, hook-warnings-log.jsonl, metrics.json, metrics-log.jsonl,
MASTER_DEBT.jsonl schema, OPERATIONAL_VISIBILITY_SPRINT.md **Confidence:** HIGH
— all synergies grounded in actual codebase and data file verification

---

## Architecture Context

The dev dashboard is a single-state React component (`DevDashboard`) holding
`activeTab` in `useState`. There is no routing, no lazy loading, no inter-tab
messaging. This is the right architecture for a solo-developer tool — it also
means synergy features are low-friction to add: pass `setActiveTab` as a prop,
lift shared filter state once, done.

The debt tab follows the hybrid model decided in DECISIONS_PRE_PLAN.md (D6):
**web dashboard for browse/filter/trends (read side), CLI skill for AI
operations (write side).** All cross-tab synergies on the web side are read-only
enrichment. All write-side actions generate CLI commands that the user copies
and pastes into Claude Code.

---

## Per-Tab Synergy Matrix

### Lighthouse tab (B5) x Debt tab

**Description:** Performance, accessibility, SEO scores for each app route.

| Synergy                                             | Type           | Direction         | Effort | Value  |
| --------------------------------------------------- | -------------- | ----------------- | ------ | ------ |
| Route-level debt overlay                            | Cross-link     | Lighthouse → Debt | Medium | High   |
| "Debt items affecting this page"                    | Deep-link      | Lighthouse → Debt | Low    | High   |
| Debt tab performance badge                          | Widget         | Debt → Lighthouse | Low    | Medium |
| Trend correlation (score regressions + new S0 debt) | Derived metric | Shared data       | High   | Medium |

**Implementation detail — Route-level debt overlay:**

MASTER_DEBT items carry a `file` field. App routes (e.g., `/journal`, `/today`)
map to files (e.g., `app/journal/page.tsx`). When the Lighthouse tab shows a low
performance score for `/journal`, it can query "how many open DEBT items have
`file` matching `app/journal/`?" and display a badge: "14 debt items".

Clicking the badge calls:

```tsx
setDebtFilter({ filePattern: "app/journal/", status: "open" });
setActiveTab("debt");
```

This is the richest Lighthouse synergy and requires only that `setActiveTab` and
`setDebtFilter` are passed as props.

**Data sources shared:** SQLite (debt items by file), Firestore (Lighthouse
scores by route)

**v1 implementation:** Deep-link only — "View debt for this route" button that
pre-filters the debt tab. No inline badge until debt SQLite integration is
confirmed working.

---

### Errors tab (B6) x Debt tab

**Description:** Local error aggregation, Sentry link, npm audit security
results.

| Synergy                           | Type            | Direction     | Effort | Value  |
| --------------------------------- | --------------- | ------------- | ------ | ------ |
| npm audit → debt comparison       | Cross-reference | Errors → Debt | Medium | High   |
| "Track as debt" action            | CLI command     | Errors → Debt | Low    | High   |
| Debt items with error origin      | Filter          | Debt → Errors | Low    | Medium |
| Recurring error → promote to debt | Pattern match   | Errors → Debt | High   | Medium |

**Implementation detail — npm audit comparison:**

MASTER_DEBT already has `by_category.security = 723` and `by_source.sonarcloud`
entries covering some security findings. When the Errors tab shows npm audit
results, it can highlight which vulnerabilities are NOT yet in MASTER_DEBT by
comparing against the debt tab's data filtered to
`category=security, source contains npm`. Items not in MASTER_DEBT get a "Track
as debt" button that generates:

```
/add-debt --title "CVE-XXXX: lodash prototype pollution" --category security --severity S1 --source npm-audit
```

**Data sources shared:** metrics.json `by_category.security` (lightweight
check), SQLite `items` table filtered to `category=security` (full check)

**Constraint:** B6 Errors tab is unimplemented (PlaceholderTab). This synergy is
blocked until B6 is built.

---

### Sessions tab (B7) x Debt tab

**Description:** Development session activity.

| Synergy                           | Type           | Direction       | Effort | Value  |
| --------------------------------- | -------------- | --------------- | ------ | ------ |
| Debt delta per session            | Derived metric | Shared data     | Low    | High   |
| Session sparkline in debt tab     | Chart          | Shared data     | Low    | High   |
| "Sessions with most debt changes" | Correlation    | Sessions → Debt | Medium | Medium |
| Debt work attribution             | Annotation     | Debt → Sessions | High   | Low    |

**Implementation detail — Debt delta per session:**

`docs/technical-debt/logs/metrics-log.jsonl` has 112 entries spanning 53 days
(2026-02-01 to 2026-03-26). Each entry has `timestamp`, `total`, `open`,
`resolved`, `s0_alerts`, `s1_alerts`. Consecutive entries diff to produce
per-session debt deltas.

The Sessions tab displays a session list with a "debt delta" column: "+247 new,
-3 resolved" sourced from metrics-log entries bracketing the session timestamp.

The Debt tab shows a sparkline (mini trend chart) of `open` count over time —
zero new data collection, the data exists today.

**Data sources shared:** `docs/technical-debt/logs/metrics-log.jsonl` — the key
shared data source for this synergy.

**v1 ready today:** The metrics-log has enough history to render a meaningful
debt trend chart without any new infrastructure.

---

### Docs tab (B8) x Debt tab

**Description:** Document sync status — missing headers, broken links, index
staleness.

| Synergy                          | Type              | Direction   | Effort | Value  |
| -------------------------------- | ----------------- | ----------- | ------ | ------ |
| Documentation debt badge         | Badge + deep-link | Docs → Debt | Low    | High   |
| DEBT-0386 cross-reference        | Cross-link        | Shared      | Low    | High   |
| Doc sync issue → "Track as debt" | CLI command       | Docs → Debt | Low    | Medium |
| Debt tab docs filter             | Filter            | Debt → Docs | None   | High   |

**Implementation detail — Documentation debt badge:**

MASTER_DEBT has 982 items in `by_category.documentation`. The Docs tab header
shows:

```
Document Sync Status    [982 documentation debt items →]
```

The badge reads metrics.json `by_category.documentation` — a single field, no
query needed. The arrow is a button that calls `setActiveTab("debt")` with
`debtFilter = { category: "documentation" }`.

DEBT-0386 (broken relative links in review docs, Track B) is a concrete joint
case: it appears in the Docs tab as a broken link finding AND in the Debt tab as
a registered DEBT item. The Docs tab can show "Known DEBT item: DEBT-0386"
inline.

**Data sources shared:** metrics.json (badge count), SQLite (full documentation
debt items)

**Lowest effort, highest return** of all synergies — requires only reading one
field from metrics.json, which is already maintained.

---

### Overrides tab (B9) x Debt tab

**Description:** Rule override audit trail — `override-log.jsonl` entries per
check type.

| Synergy                             | Type        | Direction        | Effort | Value  |
| ----------------------------------- | ----------- | ---------------- | ------ | ------ |
| Aging override → "Promote to debt"  | CLI command | Overrides → Debt | Low    | High   |
| Override count badge in debt tab    | Widget      | Overrides → Debt | Low    | Medium |
| Overrides with no linked DEBT-XXXXX | Gap display | Overrides → Debt | Medium | High   |
| Debt items with override origin     | Filter      | Debt → Overrides | Medium | Medium |

**Implementation detail — Aging override → promote to debt:**

`override-log.jsonl` entries have `check`, `reason`, `timestamp`, `git_branch`.
Override entries older than 14 days with no linked DEBT-XXXXX are "aging
overrides" — the strongest candidates for formalization.

The Overrides tab computes age from `timestamp` and flags entries > 14 days with
a "Promote to Debt" button that generates:

```
/add-debt --title "Recurring override: [check]" --category process --description "[reason]" --source override-log
```

This directly closes the DARK-02 gap identified in research: override-log is a
real source of unregistered debt acknowledgments.

**Data sources shared:** `override-log.jsonl` (Overrides tab primary, Debt tab
for aging override count)

**Highest strategic value** of all synergies: it closes a real data gap
(DARK-02), requires no new data collection, and the promote-to-debt UX pattern
generalizes to Warnings tab, Errors tab, and future tabs.

**known-debt-baseline.json note:** The `.claude/state/known-debt-baseline.json`
is a companion to override-log — it stores persistent per-pattern suppression
baselines. The Overrides tab should show both: per-commit overrides
(override-log) AND standing pattern suppressions (known-debt-baseline). Items in
known-debt-baseline with no DEBT-XXXXX cross-reference get the same "Promote to
Debt" treatment.

---

### Warnings tab (B11) x Debt tab

**Description:** Unresolved hook warnings — `hook-warnings-log.jsonl`.

| Synergy                                   | Type          | Direction       | Effort | Value  |
| ----------------------------------------- | ------------- | --------------- | ------ | ------ |
| High-occurrence warning → promote to debt | CLI command   | Warnings → Debt | Low    | High   |
| Warning count badge in debt tab           | Widget        | Warnings → Debt | Low    | Medium |
| Debt items created from warnings          | Origin filter | Debt → Warnings | Medium | Low    |

**Implementation detail — High-occurrence warning → promote to debt:**

`hook-warnings-log.jsonl` has `occurrences_since_ack` field. The current data
shows "Code-reviewer bypassed for script changes" with occurrences counts of 4-8
across multiple entries. When `occurrences_since_ack >= 5`, the warning is
systemic — it should become a debt item.

The Warnings tab flags these with a "Recurring — consider tracking as debt"
badge and a "Create Debt Item" button generating:

```
/add-debt --title "Systemic: [warning.message]" --category process --description "Occurred N times without resolution" --source hook-warnings
```

This synergy is lower effort than the Overrides synergy (same pattern, same
action) and addresses a different failure mode: process debt (recurring
bypasses) vs. ad-hoc skips.

**Data sources shared:** `hook-warnings-log.jsonl` (Warnings tab primary, Debt
tab for promotion context)

---

## Shared Infrastructure Recommendations

### R1. `setActiveTab` + `setDebtFilter` prop drilling (implement first)

Lift `debtFilter` state to `DevDashboard`. Pass both `setActiveTab` and
`setDebtFilter` to every tab that participates in cross-tab navigation. This is
the enabler for all deep-link synergies.

```tsx
// DevDashboard state additions:
const [debtFilter, setDebtFilter] = useState<DebtFilter | null>(null);

// Pass to each tab:
{
  activeTab === "docs" && (
    <DocsTab setActiveTab={setActiveTab} setDebtFilter={setDebtFilter} />
  );
}
{
  activeTab === "debt" && (
    <DebtTab filter={debtFilter} onFilterConsumed={() => setDebtFilter(null)} />
  );
}
```

Cost: ~20 lines of prop threading. Unlocks: all deep-link synergies across all
tabs.

---

### R2. `useDebtMetrics()` shared hook

A single hook that reads `docs/technical-debt/metrics.json` (or the SQLite
sync_meta equivalent) and returns the summary. Used by:

- **Debt tab:** Full metrics panel
- **Docs tab:** `by_category.documentation` badge
- **Sessions tab:** Delta calculation
- **B10 System Health tab:** `by_severity.S0` + `resolution_rate_pct` as health
  indicators

No Firestore, no server. The hook reads a local file via the SQLite read path.
One network call shared across all consumers via React state.

---

### R3. "Promote to Debt" as a shared primitive

The action of generating an `/add-debt` CLI command from a structured entry
appears in three tabs (Overrides, Warnings, Errors) with the same shape:

```tsx
function PromoteToDebtButton({
  entry,
  label,
}: {
  entry: PromotableEntry;
  label: string;
}) {
  const command = buildAddDebtCommand(entry);
  return <CopyCliButton command={command} label={label} />;
}
```

`buildAddDebtCommand` accepts a `PromotableEntry` interface and maps fields to
`/add-debt` flags. `CopyCliButton` uses the existing clipboard pattern from
`components/admin/errors-tab.tsx` (copy + 2-second success state).

Building this as a shared `components/dev/shared/promote-to-debt-button.tsx`
component establishes the pattern for all future tabs. Any data source that can
produce a debt item candidate gets the same UX.

---

### R4. `metrics-log.jsonl` as shared trend data source

`docs/technical-debt/logs/metrics-log.jsonl` has 112 real data points today.
Expose it via a `useDebtTrend()` hook returning the series. Consumers:

- **Debt tab:** Full sparkline chart (open count over time)
- **Sessions tab:** Per-session debt delta column
- **B10 Health tab:** Resolution rate trend

Reading a JSONL file from the browser is not possible in the static SPA. The
SQLite sync script should include this log in the `data/tdms.db` schema as a
`metrics_history` table, making it queryable from the web.

---

### R5. Shared component library: `components/dev/shared/`

Establish a shared component directory for dev dashboard components used across
tabs. Candidates:

| Component             | Used by                              |
| --------------------- | ------------------------------------ |
| `MetricCard`          | Debt, Health, Lighthouse             |
| `TrendSparkline`      | Debt, Sessions, Health               |
| `CopyCliButton`       | Debt, Overrides, Warnings, Errors    |
| `PromoteToDebtButton` | Overrides, Warnings, Errors          |
| `SeverityBadge`       | Debt, Errors                         |
| `StatusBadge`         | Debt, Docs                           |
| `DataTable`           | Debt, Overrides, Warnings, Sessions  |
| `RefreshButton`       | Debt (all tabs that load local data) |

The lighthouse tab already defines `ScoreBadge` inline — this pattern of inline
primitives should stop at the debt tab and be refactored into the shared
directory.

---

## Implementation Priority

### Tier 1: Build with the debt tab (zero cost if done during initial build)

| Item                             | What                                          | Why now                                                           |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `setActiveTab` prop threading    | Pass to all tabs                              | Costs nothing extra during debt tab build, unlocks all deep-links |
| Docs tab badge                   | Read `metrics.json.by_category.documentation` | One line, no new data source                                      |
| `CopyCliButton` shared component | Clipboard + success state                     | Needed by debt tab anyway, reusable immediately                   |
| `MetricCard` shared component    | Metric display primitive                      | Needed by debt tab, reusable by B10/Health                        |

### Tier 2: Build when implementing each tab (low-friction add-ons)

| Item                       | When                          | What                                                     |
| -------------------------- | ----------------------------- | -------------------------------------------------------- |
| Override aging alerts      | When building B9 Overrides    | `PromoteToDebtButton` for override-log entries > 14 days |
| Warning recurring alerts   | When building B11 Warnings    | `PromoteToDebtButton` for warnings with occurrences >= 5 |
| Session debt delta         | When building B7 Sessions     | Read metrics-log.jsonl, diff consecutive entries         |
| Debt sparkline in debt tab | When metrics-log is in SQLite | `TrendSparkline` reading `metrics_history` table         |

### Tier 3: After multiple tabs are implemented (requires shared data working)

| Item                       | What                                                     | Requires                                  |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| Route-level debt overlay   | Lighthouse badge → debt tab filtered by file/route       | Debt SQLite working + setDebtFilter       |
| npm audit gap analysis     | Compare Errors tab npm audit vs. debt tab security items | B6 Errors tab built + debt SQLite working |
| B10 health tab debt widget | S0 count + resolution rate from `useDebtMetrics()`       | B10 built + shared hook                   |
| Debt trend chart           | Full sparkline from metrics-log history                  | metrics-log in SQLite                     |

---

## Debt Tab as Hub: The "Impact View"

The debt tab has unique potential to be the cross-tab hub because MASTER_DEBT
items reference:

- `file` — which maps to Lighthouse routes and error locations
- `category` — which maps to Docs tab (documentation), Errors tab (security),
  Health tab (process)
- `source` — which maps to data origins (sonarcloud, review, audit, manual,
  override-log, hook-warnings)

An "Impact View" in the debt tab shows:

```
DEBT-0812 (S0 — auth/validate.ts — missing rate limit)
  Lighthouse: affects /api route (performance score: 82)
  Errors: 3 related Sentry events in last 30 days
  Source: SonarCloud (synced 2026-03-20)
  Related overrides: 2 reviewer bypasses on this file
```

This is not v1 scope. It requires all tabs to have working data pipelines. But
it is the north-star architecture: the debt tab as the correlation point between
all other dashboard dimensions. Design for it from the start by ensuring the
`file` and `category` fields remain filterable and that deep-links accept them
as filter parameters.

---

## Web-to-CLI Synergy: Dashboard-Wide Pattern

The "copy as CLI command" mechanism designed for the debt tab is the most
generalized web-to-CLI synergy in the dashboard. It extends naturally:

| Tab                    | CLI command generated                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Debt tab               | `/debt-runner verify --severity S0`                                           |
| Debt tab (single item) | `/debt-runner verify --item DEBT-0812`                                        |
| Overrides tab          | `/add-debt --title "Aging override: reviewer" --category process`             |
| Warnings tab           | `/add-debt --title "Recurring: code-reviewer bypassed" --category process`    |
| Errors tab             | `/add-debt --title "CVE-XXXX: npm audit finding" --category security`         |
| Docs tab (future)      | `/add-debt --title "Broken link: docs/reviews/dist" --category documentation` |

The `CopyCliButton` shared component (Recommendation R3) is the infrastructure
that makes this consistent across all tabs. Every "action" in the dashboard that
involves changing system state routes through the CLI. The dashboard never
writes to the filesystem — it generates intent.

---

## Future Tab Opportunities

The debt tab pattern (read-only view + CLI command generation + promote-to-debt
action) applies directly to planned future tabs:

| Future Tab (ROADMAP.md)        | Debt tab pattern application                                   |
| ------------------------------ | -------------------------------------------------------------- |
| **Test Coverage (Track T)**    | Tests with 0% coverage → "Create debt item: no tests for X"    |
| **Dependency Security (P2)**   | Untracked CVEs → PromoteToDebtButton                           |
| **CI/CD Pipeline Status (P1)** | Recurring CI failures → "Create debt item: flaky test pattern" |
| **Bundle Size Analysis (P1)**  | Bundles > threshold → "Create debt item: bundle bloat in X"    |
| **API Latency Metrics (P2)**   | Slow Cloud Functions → "Create debt item: PERF-XXX"            |

Each new tab gets the debt promotion pattern for free once `CopyCliButton` and
`PromoteToDebtButton` exist as shared components. The debt tab is not just one
of six tabs — it is the write-back surface that all other tabs reference when
they find something worth tracking.

---

## Summary Table

| Tab Pair          | Synergy                              | Data Source              | Priority | Effort  |
| ----------------- | ------------------------------------ | ------------------------ | -------- | ------- |
| Lighthouse ↔ Debt | Route-level debt overlay             | SQLite (items.file)      | Tier 3   | Medium  |
| Lighthouse ↔ Debt | "View debt for route" deep-link      | setDebtFilter            | Tier 1   | Low     |
| Errors ↔ Debt     | npm audit gap comparison             | SQLite + Errors data     | Tier 3   | Medium  |
| Errors ↔ Debt     | "Track as debt" CLI action           | CopyCliButton            | Tier 2   | Low     |
| Sessions ↔ Debt   | Debt delta per session               | metrics-log.jsonl        | Tier 2   | Low     |
| Sessions ↔ Debt   | Debt sparkline trend                 | SQLite metrics_history   | Tier 3   | Medium  |
| Docs ↔ Debt       | Documentation debt badge + deep-link | metrics.json.by_category | Tier 1   | Minimal |
| Docs ↔ Debt       | DEBT-0386 cross-reference            | SQLite                   | Tier 2   | Low     |
| Overrides ↔ Debt  | Aging override → promote to debt     | override-log.jsonl       | Tier 2   | Low     |
| Overrides ↔ Debt  | known-debt-baseline cross-ref        | known-debt-baseline.json | Tier 2   | Low     |
| Warnings ↔ Debt   | Recurring warning → promote to debt  | hook-warnings-log.jsonl  | Tier 2   | Low     |
| All tabs          | CopyCliButton shared primitive       | navigator.clipboard      | Tier 1   | Low     |
| All tabs          | PromoteToDebtButton shared component | CopyCliButton            | Tier 2   | Low     |
| All tabs          | useDebtMetrics() shared hook         | metrics.json             | Tier 1   | Low     |
| All tabs          | setActiveTab + setDebtFilter prop    | DevDashboard state       | Tier 1   | Minimal |
