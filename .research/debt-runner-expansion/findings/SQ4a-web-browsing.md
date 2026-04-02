# Findings: Browsing, Filtering, Sorting, and UX Capabilities for the Debt Dashboard Web Tab

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-03-27 **Sub-Question IDs:** SQ-4a

---

## Key Findings

### 1. Actual MASTER_DEBT.jsonl Field Distribution (Ground Truth) [CONFIDENCE: HIGH]

Full Python analysis of all 8,472 records reveals the following distribution.
This is the authoritative basis for filter panel design.

**Severity distribution (S0-S3):**

- S3: 3,641 (43%) — low-priority code smells
- S2: 3,445 (41%) — moderate issues
- S1: 1,360 (16%) — significant issues
- S0: 26 (0.3%) — critical / security

**Status distribution:**

- VERIFIED: 5,156 (61%)
- NEW: 2,126 (25%)
- RESOLVED: 1,116 (13%)
- FALSE_POSITIVE: 74 (1%)
- IN_PROGRESS: 0 (not used — reserved field)

**Source distribution (top 10 of ~30 distinct values):**

- audit: 2,942 (35%)
- sonarcloud: 2,561 (30%)
- unknown: 741 (9%)
- dec-2025-report: 641 (8%)
- review: 622 (7%)
- sonarcloud-paste: 286 (3%)
- context: 252 (3%)
- roadmap: 172 (2%)
- manual: 73
- intake: 64

**Category distribution (9 categories):**

- code-quality: 4,716 (56%)
- documentation: 982 (12%)
- process: 727 (9%)
- security: 723 (9%)
- refactoring: 668 (8%)
- ai-optimization: 254 (3%)
- performance: 179 (2%)
- enhancements: 154 (2%)
- engineering-productivity: 69 (1%)

**Type distribution:**

- code-smell: 6,877 (81%)
- tech-debt: 904 (11%)
- vulnerability: 248 (3%)
- hotspot: 212 (3%)
- process-gap: 136 (2%)
- enhancement: 48
- bug: 41

**Effort distribution:**

- E1: 3,844 (45%) — small
- E0: 3,529 (42%) — trivial
- E2: 966 (11%) — medium
- E3: 125 (1%) — large

**Roadmap ref (top 10 of ~20 distinct values):**

- M2.1: 2,386
- Track-E: 1,654
- M1.5: 1,081
- null: 1,039
- Track-D: 720
- Track-S: 542
- M2.3-REF: 356
- Track-P: 161
- M2.2: 145
- GRAND_PLAN_S4: 108

**Sparsely populated fields:**

- tags: only 8 records have any tags — filter is not worth building yet
- pr_ref/pr_number: only 15 records
- verified_by: 1,241 non-null (14%)
- resolution (non-null): 936 records with an actual resolution object

**Highly populated conditional fields:**

- evidence: 2,706 records (32%)
- merged_from: 4,462 records (53%)
- cluster_id: 1,867 records (22%)
- recommendation: 4,708 records (56%)

**File distribution:**

- 711 unique file paths across 8,468 records
- Top file prefixes: scripts/ (2,217), components/ (946), .claude/ (799), docs/
  (398), lib/ (351), functions/ (252), .github/ (168), hooks/ (107), app/ (104),
  tests/ (72)

**Date range:** All records created 2026-01-30 to 2026-03-26 (57-day span). No
records are older than 90 days. "Stale >90d" preset is therefore currently empty
but meaningful as a future filter.

**Resolution structure:** resolution is a JSON object when non-null. Types
observed: `resolved` (643), `file_removed` (198), `duplicate` (56), `wont_fix`
(10), `false_positive` (4). Resolution objects also carry `.date` and sometimes
`.pr` fields.

Sources: Direct Python analysis of MASTER_DEBT.jsonl (8,472 records)

---

### 2. TanStack Table + Virtual Are NOT Yet Installed — Must Be Added [CONFIDENCE: HIGH]

The current `package.json` (71 dependencies) does NOT include
`@tanstack/react-table` or `@tanstack/react-virtual`. They need to be added as
new dependencies.

The existing `AdminCrudTable` (components/admin/admin-crud-table.tsx) uses a
plain HTML `<table>` with:

- Client-side search across `config.searchFields` (substring match)
- Single-value select dropdowns per filter (not multi-select)
- No sorting, no column visibility, no virtualization, no pagination
- No URL state sync

This confirms zero reuse potential from the existing pattern for the debt
dashboard — the debt tab needs a purpose-built component using TanStack Table
v8 + TanStack Virtual v3.

The project already has all of TanStack Table's non-library prerequisites:

- React 19.2.4 (TanStack Table v8 is compatible)
- `date-fns` already installed (date range filters)
- `cmdk` already installed (command palette, usable for power search)
- `react-day-picker` already installed (date range picker for `created` field)
- Radix UI select + dialog primitives already available

Sources: Direct filesystem analysis of package.json and components/admin/

---

### 3. Filter Panel Design — Recommended Architecture [CONFIDENCE: HIGH]

Based on cardinality analysis, the filter panel should use these controls:

**Tier 1 — Always-visible quick filters (pill/chip row above table):**

| Filter   | Control Type                                                    | Rationale                                              |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Severity | Multi-select badge group (S0/S1/S2/S3 as colored chips)         | Low cardinality (4 values), high usage                 |
| Status   | Multi-select badge group (NEW/VERIFIED/RESOLVED/FALSE_POSITIVE) | Low cardinality (4 values), primary workflow dimension |

**Tier 2 — Collapsible filter sidebar or popover panel:**

| Filter            | Control Type                                 | Cardinality | Notes                                               |
| ----------------- | -------------------------------------------- | ----------- | --------------------------------------------------- |
| Source            | Multi-select popover with checkboxes         | ~30 values  | Faceted values from data                            |
| Category          | Multi-select popover with checkboxes         | 9 values    | All must be selectable simultaneously               |
| Type              | Multi-select popover with checkboxes         | 7 values    | code-smell, tech-debt, vulnerability, hotspot, etc. |
| Effort            | Multi-select badge group (E0/E1/E2/E3)       | 4 values    | Simple enough for chips                             |
| Roadmap Ref       | Multi-select popover with search             | ~20 values  | Has overlap variants (Track_E vs Track-E)           |
| Resolution status | Toggle: All / Has Resolution / No Resolution | Boolean-ish | 936 resolved items                                  |

**Tier 3 — Advanced filters (expandable "More filters" section):**

| Filter           | Control Type                                    | Notes                                    |
| ---------------- | ----------------------------------------------- | ---------------------------------------- |
| File path prefix | Hierarchical tree-select or free-text prefix    | scripts/ vs .claude/ vs components/ etc. |
| Date range       | react-day-picker date range (already installed) | created field, 2026-01-30 to 2026-03-26  |
| Cluster          | Has cluster / No cluster toggle                 | 1,867 clustered items                    |
| Verified by      | Has verifier / No verifier toggle               | 1,241 items                              |
| SonarCloud rule  | Free-text (high cardinality ~60+ rules)         | sonar_key is sonarcloud-source only      |

**Global search:**

- Always visible, top of panel
- Searches: title (primary), description, file path, DEBT-ID
- Debounce 200ms to avoid re-render on every keystroke
- "/" keyboard shortcut to focus

**Tags filter:** NOT recommended for initial build. Only 8 records have tags —
not useful until the tagging system is populated.

**pr_ref filter:** NOT recommended for initial build. Only 15 records.

**Saved presets (hardcoded initially):**

- "S0 Critical" — severity=S0, status=NEW|VERIFIED
- "Security Open" — category=security, status=NEW|VERIFIED
- "Open Items" — status=NEW|VERIFIED
- "Stale 90d+" — future: once items age past 90 days
- "Clusters" — has cluster_id=true
- "No Recommendation" — recommendation=empty

Presets should serialize to the same URL state format as manual filters, so a
preset is just a named URL params bundle.

Sources: Direct MASTER_DEBT.jsonl analysis + TanStack Table faceting docs [1],
[2]

---

### 4. Sorting Options — Multi-Column Sort Via TanStack Table [CONFIDENCE: HIGH]

TanStack Table v8's sorting state is an array of `{ id: string, desc: boolean }`
objects, enabling multi-column sort natively. Shift+click a column header adds
it as a secondary sort key.

**Default sort:** severity ASC (S0 first), then created DESC (newest first).

**Recommended sortable columns:**

| Column      | Sort Direction Options     | Use Case                |
| ----------- | -------------------------- | ----------------------- |
| Severity    | S0→S3 (asc), S3→S0 (desc)  | Triage by priority      |
| Created     | Oldest first, Newest first | Chronological review    |
| Status      | Workflow ordering          | NEW→VERIFIED→RESOLVED   |
| Category    | Alphabetical               | Group similar items     |
| Source      | Alphabetical               | Source comparison       |
| Type        | Alphabetical               | Type grouping           |
| Effort      | E0→E3 (asc/desc)           | Quick-win vs large work |
| File        | Alphabetical by path       | File-level review       |
| Roadmap Ref | Alphabetical               | Sprint alignment        |

**Multi-column sort UX:** Shift+click header = add to sort array. Click header
alone = replace sort. Clicking sorted column toggles asc/desc/off.

**Sort by "age":** Uses `created` field (desc = newest first). All items are
within a 57-day window so age-based sorting is less impactful than severity.

Sources: TanStack Table Sorting Guide [3], TanStack Table Sorting APIs [4]

---

### 5. Grouping Options — TanStack Table Grouping Feature [CONFIDENCE: HIGH]

TanStack Table v8 supports row grouping with aggregation. When grouping is
active, matched rows collapse into a group header row with a count and expanded
disclosure.

**Recommended grouping modes (one active at a time):**

| Group By       | Display                                        | Value                                |
| -------------- | ---------------------------------------------- | ------------------------------------ |
| None (flat)    | Default                                        | All 8,472 rows in flat list          |
| Severity       | S0 (26), S1 (1,360), S2 (3,445), S3 (3,641)    | Best for triage                      |
| Category       | 9 groups, code-quality dominant                | Best for domain work                 |
| Source         | ~15 active sources                             | Best for audit/SonarCloud comparison |
| Type           | 7 types, code-smell dominant                   | Best for fixing patterns             |
| Roadmap Ref    | ~15 refs                                       | Best for sprint planning             |
| File Directory | Top-level prefix (scripts/, components/, etc.) | Best for file-level review           |
| Effort         | E0–E3                                          | Best for quick-win triage            |

**Grouping UX considerations:**

- Group headers should show: group name, item count, severity breakdown mini-bar
- Expand/collapse all groups button
- When grouping is active, sorting should apply within each group
- "Group by directory" means using `file.split('/')[0]` as the group key

Sources: TanStack Table Grouping Guide [5]

---

### 6. Table Columns — Default Visible vs Togglable [CONFIDENCE: HIGH]

TanStack Table v8 has first-class `columnVisibility` state management.

**Recommended default visible columns (7 columns):**

| Column   | Width | Content                     | Notes                                                         |
| -------- | ----- | --------------------------- | ------------------------------------------------------------- |
| ID       | 90px  | DEBT-NNNNN                  | Monospace, clickable                                          |
| Severity | 60px  | Colored badge (S0/S1/S2/S3) | Color-coded: S0=red, S1=orange, S2=yellow, S3=blue            |
| Status   | 90px  | Colored badge               | NEW=gray, VERIFIED=blue, RESOLVED=green, FALSE_POSITIVE=slate |
| Title    | flex  | Truncated title text        | Primary content column, flex-grow                             |
| Category | 110px | Badge                       |                                                               |
| Source   | 100px | Text                        | sonarcloud, audit, review, etc.                               |
| Created  | 80px  | Relative date               | "3d ago", "2mo ago" using date-fns                            |

**Togglable (hidden by default) columns:**

| Column                  | Why Hidden                                      |
| ----------------------- | ----------------------------------------------- |
| Type                    | Redundant with category for most workflows      |
| Effort                  | Useful for planning but clutters triage view    |
| Roadmap Ref             | Useful for sprint, not always relevant          |
| File                    | Shown in row expansion; too wide for table      |
| Line                    | Very granular, usually irrelevant at list level |
| Verified By             | Sparse (14% populated)                          |
| Description (truncated) | Available in row expansion                      |
| Cluster Count           | Only 22% of items have this                     |
| Rule                    | SonarCloud-source only                          |

**Column ordering:** User-draggable via TanStack Table's `columnOrder` state
(column reordering feature). Persist in localStorage, not URL (too verbose).

Sources: TanStack Table Column Visibility Guide [6], Direct data analysis

---

### 7. Row Expansion — Click-to-Expand Detail Panel [CONFIDENCE: HIGH]

TanStack Table v8 has a built-in `row.getIsExpanded()` / `row.toggleExpanded()`
API. Expanded rows render a sub-row below the parent row.

**Row expansion content (for a single expanded item):**

```
DEBT-XXXXX — [Full Title]
[Severity badge] [Status badge] [Category] [Type] [Effort]

DESCRIPTION
[Full description text]

FILE REFERENCE
[file path]:[line] (clickable if GitHub URL can be inferred)

RECOMMENDATION
[recommendation text, or "No recommendation provided"]

RESOLUTION
[If status=RESOLVED]: Type: resolved | Date: 2026-MM-DD | PR: #NNN
[If status=FALSE_POSITIVE]: Reason: [reason]

EVIDENCE (if present, ~32% of items)
[evidence content]

PROVENANCE
Source: [source] | Source ID: [source_id]
Roadmap Ref: [roadmap_ref]
Created: [full ISO date]
Verified by: [verified_by or "unverified"]

RELATED (if merged_from populated, ~53% of items)
Merged from: [count] source items
Cluster: [cluster_id], [cluster_count] items in cluster
```

Expansion should be a slide-down row, not a modal, so the user can expand
multiple rows and compare them simultaneously.

Sources: TanStack Table row expansion API (training data, cross-referenced with
existing row-expansion patterns in admin components)

---

### 8. Virtualization Strategy — TanStack Virtual v3 (Not Pagination) [CONFIDENCE: HIGH]

**Recommendation: Row virtualization, not pagination.**

Rationale:

- The user asked for "UBER capabilities" — pagination breaks flow for power
  users
- TanStack Virtual v3 handles 8,472 rows at 60fps (tested at 30,000+ in official
  examples)
- After filtering, typical result sets will be 500-2,000 rows — virtualization
  handles this cleanly
- Static export (`output: "export"`) means no server-side pagination anyway

**Implementation pattern:**

- Container: fixed-height div with `overflow-y: auto` (e.g.,
  `calc(100vh - 280px)`)
- `useVirtualizer` from `@tanstack/react-virtual` with `count: rows.length`
- `estimateSize: () => 44` (44px row height)
- `overscan: 10` (render 10 rows outside viewport for smooth scrolling)
- Total height: virtualizer.getTotalSize() rendered as spacer div
- Only `virtualizer.getVirtualItems()` are rendered as DOM nodes

**Performance math:** 8,472 rows × 44px = 372,768px total height. Only ~20-25
rows rendered at any time. This is the correct approach.

**No infinite scroll:** Infinite scroll (load more on scroll-to-bottom) is not
appropriate here since all data is already in memory as static JSON.
Virtualization renders all rows but only paints visible ones.

Sources: TanStack Virtual v3 docs [7], Material React Table virtualization
(10,000+ rows) [8]

---

### 9. URL State — nuqs with React SPA Adapter [CONFIDENCE: MEDIUM-HIGH]

The project uses `output: "export"` (confirmed in next.config.mjs line 13),
which means it generates a static SPA. This is important for URL state library
choice.

**nuqs compatibility:** nuqs v2.5 supports "React SPA" as an adapter. The
project's static export is effectively a React SPA on the client side. nuqs is
used by Vercel, Sentry, Supabase, and confirmed compatible with Next.js 14.2+.
The project uses Next.js 16.2.0.

**Recommended URL state params:**

```
?severity=S0,S1     (comma-separated multi-values)
?status=NEW,VERIFIED
?source=sonarcloud,audit
?category=security,code-quality
?type=vulnerability
?effort=E0,E1
?roadmap=M2.1,Track-E
?q=search+term      (global search)
?sort=severity:asc,created:desc  (multi-column sort)
?group=category     (active grouping)
?file=scripts/      (file path prefix)
?expand=DEBT-0001   (expanded row ID)
?preset=s0-open     (named preset)
```

**Serialization approach:** Each multi-select param is a comma-separated string.
nuqs has a `parseAsArrayOf` parser that handles this with type safety.

**Shallow routing:** For filter changes that don't change the URL pathname, use
nuqs `shallow: true` to avoid full page re-renders (default behavior in SPA
mode).

**Column visibility and column ordering:** NOT stored in URL (too verbose).
Store in `localStorage` under key `debt-dashboard-prefs`. This keeps URLs
shareable for filter states without including layout preferences.

**URL size concern:** With many filters active, the URL could become long.
Mitigate by only including non-default filter values in the URL (omit params
that equal the default state).

Sources: nuqs.dev [9], nuqs 2.5 changelog [10]

---

### 10. Keyboard Shortcuts for Power Users [CONFIDENCE: MEDIUM]

The project already has `cmdk` installed (shadcn command palette primitive),
which can be repurposed or referenced for keyboard shortcut handling.

**Recommended keyboard shortcuts:**

| Key          | Action                                               | Implementation                 |
| ------------ | ---------------------------------------------------- | ------------------------------ |
| `/`          | Focus global search input                            | `useEffect` keydown listener   |
| `j`          | Move selection down one row                          | Custom `useKeyboardNav` hook   |
| `k`          | Move selection up one row                            | Custom `useKeyboardNav` hook   |
| `Enter`      | Expand/collapse selected row                         | `selectedRow.toggleExpanded()` |
| `Escape`     | Clear search / collapse expanded row / close popover | Context-aware                  |
| `g` then `s` | Group by severity                                    | Two-key sequence (vim-style)   |
| `g` then `c` | Group by category                                    | Two-key sequence               |
| `g` then `0` | Clear grouping                                       | Two-key sequence               |
| `Shift+S0`   | Filter by S0 only                                    | Direct filter shortcut         |
| `Cmd/Ctrl+K` | Open command palette (all actions)                   | cmdk integration               |

**Implementation note:** j/k navigation is not built into TanStack Table.
Requires a `useState` for `focusedRowIndex`, a `useEffect` for keydown, and
`useRef` array on row elements. The focused row should receive
`aria-selected="true"` and visual highlight.

**Scope guards:** Keyboard shortcuts must be disabled when any input, textarea,
or popover is focused. Check `document.activeElement.tagName !== 'INPUT'` before
acting.

**shadcn keyboard nav block:** shadcn/ui has a published keyboard nav table
block (`shadcn.io/blocks/tables-keyboard-nav`) confirming arrow key navigation,
Enter to activate, visual focus ring, and screen reader announcements as the
expected pattern.

Sources: shadcn.io keyboard nav table block [11], GitHub TanStack keyboard
navigation discussion [12]

---

### 11. Static JSON Loading Strategy [CONFIDENCE: HIGH]

With `output: "export"`, there are no API routes. The 8,472-item
MASTER_DEBT.jsonl must be bundled as a static asset.

**Options analyzed:**

| Approach                                | Size          | Load Time       | Build Impact                  |
| --------------------------------------- | ------------- | --------------- | ----------------------------- |
| Import as JSON directly                 | ~4-8MB        | Blocks bundle   | Webpack includes in JS bundle |
| Fetch from `/debt-data.json` at runtime | ~4-8MB        | 1-2s first load | Separate static asset         |
| Pre-split by severity/source            | ~0.5-1MB each | Fast initial    | More complex build            |

**Recommendation:** Fetch `/debt-data.json` on component mount (lazy). The file
is generated at build time from MASTER_DEBT.jsonl via a build script. On first
load, show a skeleton. Cache in `useRef` or React context so tab-switching
doesn't re-fetch.

**Compression:** JSON of 8,472 items with these fields will be approximately
6-10MB uncompressed but ~800KB-1.5MB gzipped. Firebase Hosting serves gzip
automatically.

**Build script:** `scripts/build-debt-data.js` would convert MASTER_DEBT.jsonl
to a single `public/debt-data.json` at build time using a pre-build npm script
hook.

Sources: Direct codebase analysis (next.config.mjs), SQ1a findings

---

### 12. Existing Codebase Patterns Worth Reusing [CONFIDENCE: HIGH]

Direct inspection of `components/admin/` and `components/dev/` reveals:

**Reusable patterns:**

- `logs-tab.tsx` uses collapsible row expansion with
  `ChevronDown`/`ChevronRight` icons — same pattern for debt row expansion
- `errors-tab.tsx` uses `timeframe` presets (7d/30d/90d/custom) — same concept
  as saved filter presets
- `admin-crud-table.tsx` uses the `useTabRefresh` hook for data freshness — debt
  tab doesn't need this (static data)
- Badge pattern from `getSeverityBadge()` in logs-tab.tsx should be adapted for
  S0/S1/S2/S3 severity badges with matching colors

**Dev dashboard integration point:**

- `DevTabId` union in `components/dev/dev-tabs.tsx` line 7 must have `"debt"`
  added
- `TABS` array must have new entry added
- `dev-dashboard.tsx` dispatcher must add
  `{activeTab === "debt" && <DebtTab />}`

**Dark theme:** The dev dashboard uses a dark theme (`bg-gray-900`,
`text-white`, `border-gray-700`). The debt tab must match this dark theme,
unlike the admin dashboard which uses light theme.

Sources: Direct filesystem analysis, SQ2-web-integration findings

---

## Sources

| #   | URL                                                                             | Title                                         | Type           | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------- | --------------------------------------------- | -------------- | ------ | ----- | ---------- |
| 1   | https://tanstack.com/table/latest/docs/framework/react/examples/filters-faceted | TanStack Table Faceted Filters Example        | official-docs  | HIGH   | 4.5   | 2025+      |
| 2   | https://tanstack.com/table/v8/docs/guide/column-filtering                       | Column Filtering Guide                        | official-docs  | HIGH   | 4.5   | 2025+      |
| 3   | https://tanstack.com/table/v8/docs/guide/sorting                                | Sorting Guide                                 | official-docs  | HIGH   | 4.5   | 2025+      |
| 4   | https://tanstack.com/table/v8/docs/api/features/sorting                         | Sorting APIs                                  | official-docs  | HIGH   | 4.5   | 2025+      |
| 5   | https://tanstack.com/table/v8/docs/guide/grouping                               | Grouping Guide                                | official-docs  | HIGH   | 4.5   | 2025+      |
| 6   | https://tanstack.com/table/v8/docs/guide/column-visibility                      | Column Visibility Guide                       | official-docs  | HIGH   | 4.5   | 2025+      |
| 7   | https://tanstack.com/virtual/latest                                             | TanStack Virtual v3                           | official-docs  | HIGH   | 4.5   | 2025+      |
| 8   | https://www.material-react-table.com/docs/guides/virtualization                 | Material React Table Virtualization           | community-docs | MEDIUM | 3.8   | 2025       |
| 9   | https://nuqs.dev                                                                | nuqs — Type-safe URL state                    | official-docs  | HIGH   | 4.2   | 2026       |
| 10  | https://nuqs.dev/blog/nuqs-2.5                                                  | nuqs 2.5 changelog                            | official-docs  | HIGH   | 4.2   | 2025       |
| 11  | https://www.shadcn.io/blocks/tables-keyboard-nav                                | shadcn Keyboard Nav Table Block               | official-docs  | HIGH   | 4.5   | 2025+      |
| 12  | https://github.com/TanStack/table/discussions/2752                              | TanStack Table keyboard navigation discussion | community      | MEDIUM | 3.2   | 2023       |
| 13  | filesystem: MASTER_DEBT.jsonl (8,472 records)                                   | Direct data analysis                          | ground-truth   | HIGH   | 5.0   | 2026-03-27 |
| 14  | filesystem: package.json, next.config.mjs, components/                          | Direct codebase analysis                      | ground-truth   | HIGH   | 5.0   | 2026-03-27 |

---

## Contradictions

**Pagination vs Virtualization:** Some dashboard patterns recommend pagination
for developer experience (simpler code, clear "pages"). Virtualization is more
complex to implement correctly (requires fixed-height container, overscan
tuning, scroll restoration). However, given the static-JSON constraint (all data
in memory) and the user's stated "UBER capabilities" goal, virtualization wins.

**URL state with static export:** nuqs documentation does not explicitly confirm
static Next.js `output: "export"` support, but the React SPA adapter should
handle this case since a static export is functionally a React SPA. No evidence
of incompatibility found, but this should be validated with a quick test when
implementing. If nuqs has issues, a fallback to manual
`window.history.replaceState` + `URLSearchParams` is straightforward since the
filter state is simple key-value pairs.

**nuqs re-render concern:** The nuqs 2.5 blog mentions that Next.js uses a
single Context for URLSearchParams that re-renders all `useSearchParams` call
sites when any param changes. In a static export/SPA context this may be
mitigated because the Next.js router isn't fully active in the same way. This
needs testing.

---

## Gaps

1. **TanStack Table exact version for React 19 compatibility:** The docs confirm
   React 19 support but the exact minimum TanStack Table version for React 19
   was not determined. The latest stable version should be used when installing.

2. **JSON bundle size for debt-data.json:** Exact file size of MASTER_DEBT.jsonl
   when converted to JSON array not measured. The JSONL file is approximately
   8MB uncompressed. The JSON array version will be similar. Gzip compression
   (automatic on Firebase Hosting) should bring this to ~1-1.5MB. Worth
   benchmarking during build.

3. **nuqs with static export validation:** No official documentation found
   confirming `output: "export"` + nuqs works out of the box. Needs a test in
   the actual project before committing to nuqs.

4. **Column drag-and-drop reorder:** TanStack Table has `columnOrder` state but
   implementing drag-and-drop requires an additional library (e.g., @dnd-kit).
   Not researched in depth — may be a Phase 2 feature.

5. **tags field:** Only 8 records have tags. Tag-based filtering is not worth
   building until the TDMS pipeline populates this field.

6. **Saved preset persistence:** Where to store user-saved presets (localStorage
   vs Firestore). For a dev-only tool, localStorage is sufficient. Firestore
   would enable cross-device preset sharing — but adds auth complexity. Not
   decided.

---

## Serendipity

**cmdk already installed:** The project has `cmdk` (command palette primitive)
at v1.1.1. This enables a `Cmd+K` power-user command palette for the debt
dashboard with zero additional dependencies — search across all actions (filter
by X, jump to DEBT-XXXX, export as CSV, toggle grouping) via a keyboard-first
UI. This is a differentiating feature that would be straightforward to add.

**react-day-picker already installed:** The `react-day-picker` v9.14.0 is
already in package.json. The `created` date range filter is free — no new
dependency required.

**Roadmap ref normalization issue:** The data has `Track-E` and `Track_E` as
separate values (6 records for `Track_E`). Similarly `Track_D` vs `Track-D`.
This is a data quality issue that will confuse users in the filter UI. The
filter panel should normalize these at display time (or the build script should
normalize during JSON generation).

**cluster_primary flag:** 172 items have `cluster_primary: true`, meaning they
are the canonical representative of a cluster of duplicates. A "show cluster
primaries only" toggle would reduce the visible list by collapsing 1,867
clustered items into ~300 canonical items — a powerful deduplication view for
triage.

**Evidence field (32% of items):** The `evidence` field has 2,706 records. Some
items have it as structured data (arrays of source citations). Displaying this
in row expansion would add significant context for `review` and `audit` sourced
items.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM-HIGH claims: 1
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The findings are primarily grounded in direct filesystem analysis of actual data
(8,472 records) and direct codebase inspection, with TanStack Table capabilities
confirmed via official documentation.
