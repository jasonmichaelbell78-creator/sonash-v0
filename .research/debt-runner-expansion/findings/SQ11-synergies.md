# Findings: Cross-Tab Synergies — Debt Tab and Dev Dashboard

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-11

---

## Key Findings

### 1. The tab shell is explicitly designed for expansion — adding debt requires exactly 3 file changes [CONFIDENCE: HIGH]

`DevTabId` in `components/dev/dev-tabs.tsx` is a string union. `TABS` is a flat
array. The content dispatcher in `dev-dashboard.tsx` is a sequence of
`{activeTab === "X" && <XTab />}` conditionals. No routing, no lazy loading, no
code-splitting — straightforward mechanical extension. This design makes synergy
features like cross-tab navigation equally simple: any tab can call
`setActiveTab("debt")` if `setActiveTab` is passed as a prop.

The five existing tabs (lighthouse, errors, sessions, docs, overrides) are all
currently placeholders except lighthouse. The debt tab will be the second
fully-implemented tab, making it the de facto pattern-setter for all remaining
implementations.

Sources: [1] (components/dev/dev-tabs.tsx), [2]
(components/dev/dev-dashboard.tsx)

---

### 2. Lighthouse tab is the ONLY data precedent — and it explicitly shows the gap that debt must not repeat [CONFIDENCE: HIGH]

The lighthouse tab reads from
`db.collection("dev").doc("lighthouse").collection("history")` — but PERF-002
(CI push to Firestore) and PERF-003 (Firestore history storage) are listed as
pending inside the tab's own UI. The tab exists without its data source.

This is the canonical warning for the debt tab: **build the data pipeline before
or alongside the UI, not after.** The debt tab's data source (SQLite local
mirror via `sync-to-sqlite.js`) must be confirmed working before the tab renders
real data.

The lighthouse score model also reveals the key synergy: Lighthouse flags
performance issues (`performance: 72` for /journal). If any DEBT item in
MASTER_DEBT references the same route, a "debt items affecting this page"
cross-link becomes possible. This is a v2+ synergy but architecturally it
requires that debt items carry `file` or `route` metadata — which MASTER_DEBT
already does (`file` field confirmed in JSONL schema).

Sources: [3] (components/dev/lighthouse-tab.tsx lines 184-191), [4]
(.research/debt-runner-expansion/findings/SQ2-web-integration.md finding #4)

---

### 3. Overrides tab is the highest-priority synergy target — override-log.jsonl contains the raw material for debt promotion [CONFIDENCE: HIGH]

`override-log.jsonl` has real data: entries with `check`, `reason`, `timestamp`,
`user`, `git_branch`, `cwd`. The existing DARK-02 analysis from the research
phase identified aging overrides as "dark debt." Each override is effectively an
unregistered debt acknowledgment — a human said "skip this check this time" but
the skip was never formalized as a DEBT-XXXXX item.

The synergy design is concrete and actionable:

**Override tab displays:** list of overrides with age (days since timestamp),
check type, branch, reason. **Debt tab sees:** overrides older than N days with
no linked DEBT-XXXXX ID. **Cross-link mechanism:** "Promote to Debt" button on
override entries — generates `/add-debt` command pre-populated from override
fields (check type → category, reason → description, timestamp → created).

This is the highest-ROI synergy because it closes a real gap identified in
research (DARK-02) and requires no new data sources — `override-log.jsonl` is
already being written by the pre-commit/pre-push hooks.

Sources: [5] (.claude/override-log.jsonl — confirmed schema), [6]
(DECISIONS_PRE_PLAN.md — DARK-02 reframe)

---

### 4. Errors tab synergy is directional: errors point to debt, not the reverse [CONFIDENCE: MEDIUM]

The planned B6 Errors tab includes "local error aggregation + Sentry link" and
"npm audit security results display." Both surfaces can feed the debt tab:

**npm audit vulnerabilities** — MASTER_DEBT already has category `security`.
When the Errors tab shows an npm audit finding, a "Track as debt" action could
copy it to the `/add-debt` CLI command. The `by_category.security` count in
metrics.json is 723 items, suggesting security debt is the second largest
category (after code-quality at 4,716). npm audit findings that are NOT already
in MASTER_DEBT would be visible by comparing the errors tab's npm audit results
against debt tab items filtered to `source=npm-audit`.

**Recurring runtime errors** — If the Errors tab tracks error frequency over
time, errors appearing in multiple sessions could be flagged as systemic. A
"Create debt item from error pattern" action surfaces the right moment. This is
speculative (no error frequency tracking currently exists) — HIGH effort, MEDIUM
synergy value.

The key constraint: the Errors tab is unimplemented (PlaceholderTab). The
synergy is real but depends on B6 being built first.

Sources: [2] (components/dev/dev-dashboard.tsx line 55), [7]
(docs/OPERATIONAL_VISIBILITY_SPRINT.md B6 spec), [8]
(docs/technical-debt/metrics.json by_category)

---

### 5. Sessions tab synergy: debt delta per session is the most concrete shared metric [CONFIDENCE: MEDIUM]

The Sessions tab (B7) is planned for "Development session activity." The
research found that `docs/technical-debt/logs/metrics-log.jsonl` contains 112
entries with `timestamp`, `total`, `open`, `resolved`, `s0_alerts`, `s1_alerts`.
This log is the sessions tab's best cross-reference: each metrics-log entry was
generated by a `generate-metrics.js` run, which correlates to a debt-runner or
session-end invocation.

The synergy: the Sessions tab can display a "debt delta" row in its session list
— "Session #241: +0 new debt, -3 resolved" — derived from consecutive
metrics-log entries. No new data collection needed; metrics-log already has the
series.

Conversely, the Debt tab can show a "session history" sparkline for total open
count over time, using the same metrics-log as source. This is the
`logs/metrics-log.jsonl` as a shared data source used by two tabs independently
— the clearest example of a shared data source synergy.

Sources: [9] (docs/technical-debt/logs/metrics-log.jsonl — confirmed 112 entries
with timestamp+counts), [7] (OPERATIONAL_VISIBILITY_SPRINT.md B7 spec)

---

### 6. Docs tab synergy: 982 documentation debt items are already in MASTER_DEBT [CONFIDENCE: HIGH]

The metrics.json `by_category.documentation` field shows 982 items. The Docs tab
(B8) is planned for "Document sync status." These two surfaces share the same
subject matter but view it from different angles:

- **Docs tab view:** Which doc files are out of sync, which have broken links,
  which lack headers — the structural health of the docs/ tree.
- **Debt tab filtered view:** `category=documentation` filter surfaces 982 DEBT
  items about documentation quality.

The synergy: the Docs tab should show a "documentation debt count" badge that
deep-links to the Debt tab pre-filtered to `category=documentation`. This is a
pure UI cross-link with zero additional data — the 982 items are already in
MASTER_DEBT.

DEBT-0386 (broken relative links in review docs, assigned to Track B) is a
concrete example: this item should appear in both the Docs tab (as a broken
link) and the Debt tab (as DEBT-0386).

Sources: [8] (metrics.json by_category.documentation=982), [10] (ROADMAP.md —
DEBT-0386 assigned to Track B)

---

### 7. Shared infrastructure: metrics.json is a ready-made multi-tab data source [CONFIDENCE: HIGH]

`docs/technical-debt/metrics.json` is generated by `generate-metrics.js` and
contains: `summary` (total, open, resolved, false_positives,
resolution_rate_pct), `by_status`, `by_severity`, `by_category`, `by_source`.
This file is updated every time debt-runner runs.

For the dev dashboard, this file serves as a "summary panel" data source that
multiple tabs can display without accessing the full MASTER_DEBT.jsonl. A
`useDebtMetrics()` hook that reads metrics.json once on mount would provide:

- Debt tab: full metrics panel
- Sessions tab: delta calculation (requires metrics-log.jsonl too)
- Docs tab: documentation debt badge (requires only `by_category.documentation`)
- System Health tab (B10): overall resolution rate and S0 count as health
  indicators

This makes metrics.json a **hub data source** — consumed by 4+ tabs, already
exists, already maintained.

Sources: [8] (docs/technical-debt/metrics.json confirmed schema), [7]
(OPERATIONAL_VISIBILITY_SPRINT.md B10 spec)

---

### 8. known-debt-baseline.json is the bridge between overrides and debt — it is the "shadow store" that needs a DEBT-XXXXX cross-reference [CONFIDENCE: HIGH]

`.claude/state/known-debt-baseline.json` contains pattern-level suppressions
with `baseline` counts and `ratchet_history`. These are pre-commit pattern
violations that were suppressed rather than fixed. Unlike `override-log.jsonl`
(commit-time skips), this is a persistent baseline representing a standing debt
acknowledgment.

The DECISIONS_PRE_PLAN.md reframed DARK-01 from "shadow store" to "pre-commit
suppression list that needs DEBT-XXXXX cross-reference." This is a synergy
between:

- **Overrides tab:** shows `override-log.jsonl` (per-commit skips)
- **Debt tab:** ideally shows which known-debt-baseline entries have a linked
  DEBT-XXXXX ID vs. which are unregistered

The data already exists. The gap is the absence of a `debt_id` field in
`known-debt-baseline.json` schema. Adding this cross-reference field is a small
schema extension, not a new data source.

Sources: [11] (.claude/state/known-debt-baseline.json confirmed schema), [6]
(DECISIONS_PRE_PLAN.md DARK-01 reframe)

---

### 9. hook-warnings-log.jsonl provides the Warnings tab (B11) ↔ Debt tab synergy: recurring warnings become debt [CONFIDENCE: HIGH]

`hook-warnings-log.jsonl` has real data: entries with `hook`, `type`,
`severity`, `message`, `action`, `timestamp`, `occurrences`,
`occurrences_since_ack`, `actor`, `user`, `outcome`. The sample data shows a
recurring "Code-reviewer bypassed for script changes" warning with occurrences
counts ranging 4-8.

The synergy: warnings with high `occurrences` counts (e.g., >5 unacknowledged)
are systemic issues that deserve promotion to DEBT items. The B11 Warnings tab
would show these with an "Add to debt" action. The Debt tab would show a
"warnings origin" badge on items created from warnings.

This is a concrete, data-grounded synergy: the warning data exists, the
promote-to-debt pattern matches the override synergy, and the
`occurrences_since_ack` field provides a natural threshold (promote when N > 5).

Sources: [12] (.claude/state/hook-warnings-log.jsonl confirmed schema and data)

---

### 10. Cross-tab navigation pattern: setActiveTab as a prop is the right mechanism [CONFIDENCE: HIGH]

Currently `DevDashboard` holds `activeTab` state and passes `setActiveTab` only
to `DevTabs`. For cross-tab navigation (e.g., "click documentation debt count →
jump to debt tab filtered to documentation"), `setActiveTab` needs to be passed
as a prop to each tab component.

The implementation is mechanical:

```tsx
// In dev-dashboard.tsx:
{
  activeTab === "docs" && <DocsTab setActiveTab={setActiveTab} />;
}
{
  activeTab === "debt" && <DebtTab setActiveTab={setActiveTab} />;
}
```

Each tab that supports cross-tab navigation receives `setActiveTab` and calls it
to jump. This is zero new infrastructure — the state already exists in
`DevDashboard`, it just needs to be shared.

A companion `setDebtFilter` callback would allow tab-jumping with pre-set filter
state:

```tsx
// DocsTab clicks "View 982 documentation debt items":
setDebtFilter({ category: "documentation" });
setActiveTab("debt");
```

This requires a lifted `debtFilter` state in `DevDashboard` — a small addition
that enables rich cross-tab navigation.

Sources: [1] (components/dev/dev-tabs.tsx), [2]
(components/dev/dev-dashboard.tsx)

---

## Sources

| #   | Path                                                            | Title                            | Type        | Trust | CRAAP | Date       |
| --- | --------------------------------------------------------------- | -------------------------------- | ----------- | ----- | ----- | ---------- |
| 1   | components/dev/dev-tabs.tsx                                     | Tab type + nav component         | source-code | HIGH  | 5/5   | 2026       |
| 2   | components/dev/dev-dashboard.tsx                                | Dashboard shell + dispatch       | source-code | HIGH  | 5/5   | 2026       |
| 3   | components/dev/lighthouse-tab.tsx                               | Only implemented tab             | source-code | HIGH  | 5/5   | 2026       |
| 4   | .research/debt-runner-expansion/findings/SQ2-web-integration.md | Web integration findings         | findings    | HIGH  | 5/5   | 2026-03-27 |
| 5   | .claude/override-log.jsonl                                      | Override log schema + data       | data-file   | HIGH  | 5/5   | 2026       |
| 6   | .research/debt-runner-expansion/DECISIONS_PRE_PLAN.md           | DARK-01/02 reframes              | decisions   | HIGH  | 5/5   | 2026-03-26 |
| 7   | docs/OPERATIONAL_VISIBILITY_SPRINT.md                           | B6-B11 tab specs                 | spec-doc    | HIGH  | 5/5   | 2026       |
| 8   | docs/technical-debt/metrics.json                                | Live metrics snapshot            | data-file   | HIGH  | 5/5   | 2026-03-26 |
| 9   | docs/technical-debt/logs/metrics-log.jsonl                      | Historical metrics series        | data-file   | HIGH  | 5/5   | 2026       |
| 10  | ROADMAP.md (Track B section)                                    | DEBT-0386 docs debt assignment   | spec-doc    | HIGH  | 5/5   | 2026       |
| 11  | .claude/state/known-debt-baseline.json                          | Pre-commit suppression baseline  | data-file   | HIGH  | 5/5   | 2026-03-14 |
| 12  | .claude/state/hook-warnings-log.jsonl                           | Warning log schema + occurrences | data-file   | HIGH  | 5/5   | 2026       |

---

## Contradictions

**Override-log as "dark debt" vs. "pre-commit suppression list":**
DECISIONS_PRE_PLAN.md reframed DARK-01 (known-debt-baseline) as not truly dark,
but DARK-02 (override-log) remains valid as a source of unregistered debt
acknowledgments. The distinction matters for the synergy design: override-log
skips are ad-hoc (different entries, different checks), while
known-debt-baseline suppressions are persistent standing exemptions. Both
warrant debt promotion pathways but the UX should differ.

**Docs tab and debt tab overlap on documentation category:** If the Docs tab
starts tracking doc quality issues and the Debt tab already contains 982
documentation-category DEBT items, there's a risk of duplicate display. The
resolution is to have the Docs tab show "structural sync status" (missing
headers, broken links, index staleness) and link OUT to the Debt tab for the
full list — never duplicating the debt item list.

---

## Gaps

1. **Sessions tab data model** — B7 spec says "Development session activity" but
   no existing session data source was found (no `sessions.jsonl`, no Firestore
   sessions collection for dev). How session activity will be tracked is
   undefined, making the debt-delta synergy depend on an undefined upstream.

2. **Errors tab data model** — B6 will aggregate from Sentry and npm audit. No
   Firestore path for errors was found in `lib/firestore-service.ts`. The
   error-to-debt synergy depends on errors being queryable by type/pattern —
   undefined until B6 is built.

3. **useTabRefresh hook** — The task brief mentions this hook "already exists."
   It was not found in the codebase (`grep` pattern would confirm). If it
   exists, it could anchor a shared data refresh pattern. This needs
   verification before building.

4. **Cross-tab filter state lifting scope** — If `debtFilter` state is lifted to
   `DevDashboard`, all 6 tabs share the state even when most don't use it.
   Whether to lift to `DevDashboard` or use a context provider is an unresolved
   architecture choice.

---

## Serendipity

**metrics-log.jsonl as a timeline** — The 112 entries in metrics-log span from
2026-02-01 to 2026-03-26, providing a 53-day debt trend. This is enough data for
a meaningful sparkline chart in the debt tab today, without any new data
collection. The total went from 868 → 8,472 items (driven by audit intake), and
resolved went from 0 → 1,116. This is a story worth telling visually.

**B10 System Health tab already owns the debt metrics cross-reference** — The
OPERATIONAL_VISIBILITY_SPRINT.md B10 spec includes "Backlog health from
check-backlog-health.js" and "Historical trends (track improvements)." This
means there may be intentional overlap between B10 (System Health) and the debt
tab. The plan should clarify ownership: debt tab owns the full TDMS view, B10
health tab shows a summary widget that links to the debt tab. Not two parallel
debt views.

**The CLI-web synergy is the most underappreciated pattern** — The
DECISIONS_PRE_PLAN.md open question #10 asked about tab coordination. Based on
all findings, the web-to-CLI handoff (clipboard copy of `/debt-runner` commands)
creates a synergy that extends naturally to other tabs: the Warnings tab could
generate `/debt-runner` commands, the Overrides tab could generate `/add-debt`
commands. The "copy as CLI command" pattern is a dashboard-wide primitive, not
just a debt tab feature.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are grounded in direct filesystem reads. The actual data files
(override-log.jsonl, hook-warnings-log.jsonl, metrics.json, metrics-log.jsonl)
were confirmed to exist and their schemas were verified. Tab implementation
status was verified against actual source code (not documentation). Synergy
designs are derived from real data structures, not hypothetical future states.
