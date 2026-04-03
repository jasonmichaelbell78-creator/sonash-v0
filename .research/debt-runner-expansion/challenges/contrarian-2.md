# Contrarian Challenge #2: Web Dashboard Design Decisions

**Challenger:** Senior Frontend Engineer **Target:** RESEARCH_OUTPUT.md -- Web
Dashboard Architecture **Date:** 2026-03-27 **Method:** 8-point design challenge
with severity ratings and alternatives

---

## Challenge 1: React 19.2.4 Compatibility Claims

**Severity: HIGH**

The report recommends TanStack Table v8, TanStack Virtual v3, and Recharts (via
shadcn/ui chart) and rates confidence HIGH on compatibility. This warrants
scrutiny.

**Findings:**

1. **Recharts is NOT in the project.** The report states Recharts is "already in
   project deps" (Section 7, size table note) and "conditionally included only
   if shadcn/ui chart components are already imported elsewhere." Verified
   against `package.json`: Recharts is absent from both `dependencies` and
   `devDependencies`. There is no `components/ui/chart.tsx` file. The shadcn
   chart primitive does not exist in this project. This is a factual error in
   the report.

2. **react-is version conflict is real but underspecified.** The report mentions
   adding `"overrides": { "react-is": "^19.0.0" }` as a "one-line fix." But
   React 19.2.4 ships `react-is` as part of the React package itself -- the
   standalone `react-is` package was deprecated in React 19. Recharts v3 uses
   `react-is` internally for type checking (`isValidElement`, `isFragment`,
   etc.). The override may force resolution to a version that does not exist in
   the npm registry yet (as of this writing, `react-is@19.x` may or may not be
   published as a standalone package). This needs verification before committing
   to Recharts.

3. **TanStack Table v8 and TanStack Virtual v3** have better React 19
   compatibility stories because they are headless (no JSX rendering of their
   own, no `react-is` dependency). Risk is LOW for these two.

4. **Recharts v3 renders SVG via React components.** Any subtle React 19
   breaking changes in `createElement`, `ref` forwarding (React 19 changed ref
   to a regular prop), or `useId` behavior can cause rendering bugs in Recharts
   internals that are invisible until specific chart configurations trigger
   them. Recharts has historically been slow to ship React compatibility fixes.

**Alternatives:**

- **Option A (recommended):** Use Tremor (tremor.so), which is built on top of
  Recharts but managed by a team that actively tests against React 19 and
  provides shadcn-compatible styling. If Tremor has the same react-is issue,
  fall through to Option B.
- **Option B:** Use lightweight chart libraries that render to Canvas instead of
  React components: Chart.js via react-chartjs-2, or uPlot for time-series.
  These have minimal React surface area.
- **Option C:** Use Victory (by Formidable), which has explicit React 19 support
  and renders SVG without react-is dependency.
- **Minimum action:** Before any charting work, add Recharts to a test branch,
  build, and verify all 6 chart types render correctly with React 19.2.4. Do not
  assume the override works.

---

## Challenge 2: Virtualized Table UX for 8,470 Rows

**Severity: MEDIUM**

The report selects TanStack Virtual v3 for row virtualization as if it is a
straightforward win. It is not. Virtualized tables have well-documented UX
problems that the report does not address.

**Findings:**

1. **Browser Find (Ctrl+F) is broken.** Only ~30-50 rows exist in the DOM at any
   time. If a user presses Ctrl+F to search for "DEBT-4521", the browser finds
   nothing because that row is off-screen and not rendered. For a debt-browsing
   tool where users search by ID, title, or file path, this is a significant
   usability gap. The report recommends Fuse.js as a replacement, but Fuse.js
   search is a separate UI interaction -- it does not replace the muscle memory
   of Ctrl+F.

2. **Screen reader accessibility.** WCAG 2.1 requires all table content to be
   accessible. Virtualized tables violate this -- screen readers cannot navigate
   to off-screen rows. For an internal dev tool this may be acceptable, but it
   should be an explicit, acknowledged tradeoff, not an oversight.

3. **Variable-height rows.** If descriptions wrap or annotations are shown
   inline, rows have variable heights. TanStack Virtual handles this via
   `estimateSize` + measurement, but it introduces scroll position jank when
   measured sizes differ significantly from estimates. The report proposes
   togglable Description and Annotation columns, which are exactly the columns
   that would cause variable heights.

4. **Grouping + virtualization interaction.** The report proposes 7 grouping
   modes. Grouped rows with collapsible headers inside a virtualized list
   require careful implementation -- each group header is a different row type
   with different height. This is achievable with TanStack Virtual but adds
   significant implementation complexity that the report does not acknowledge.

**Alternatives:**

- **Option A (recommended):** Implement two-tier loading. Default view: load
  only the first 500 items (sorted by severity DESC, then age DESC) with
  standard DOM rendering. No virtualization needed for 500 rows. Add "Load All"
  button that switches to virtualized mode. This preserves Ctrl+F for the
  default view.
- **Option B:** Use pagination (client-side, 100 items per page). All data is in
  memory; pagination controls which items render. Ctrl+F works within pages.
  Less elegant but more predictable UX.
- **Option C:** Accept virtualization but add a prominent "Search" input (the
  Fuse.js search) as the FIRST element above the table, with visual emphasis
  indicating "use this instead of Ctrl+F." Add an `aria-rowcount` attribute to
  the table element for screen readers.

---

## Challenge 3: Static JSON File Size (7.6 MB)

**Severity: HIGH**

The report estimates "~8-12 MB uncompressed" and says it is "acceptable for a
local dev tool, not a public site." Direct measurement shows the real numbers:

**Verified data:**

- MASTER_DEBT.jsonl: 7.23 MB (8,472 lines)
- Average per-record size (compact JSON): 942 bytes
- Estimated `debt-data.json` as compact JSON array: **7.61 MB**
- Estimated `debt-data.json` as pretty-printed JSON: **9.02 MB**
- Each record has 20 fields, but only 7 are needed for the default table view

The report does not consider:

1. **Parse time.** `JSON.parse()` on a 7.6 MB string blocks the main thread. On
   a typical dev machine, this takes 50-150ms -- noticeable but not
   catastrophic. However, it happens on every page load because this is a static
   SPA with no caching layer.

2. **Memory footprint.** 8,472 objects with 20 fields each, stored as a
   JavaScript array in memory. Estimated ~15-25 MB of heap after parsing
   (JavaScript objects have significant overhead per property). This lives in
   memory for the entire session.

3. **Git bloat.** `public/debt-data.json` is a build artifact committed to the
   repo (it must be in `public/` for static export). Every time debt data
   changes and the site is rebuilt, a 7.6 MB diff is added to git history. Over
   50 rebuilds, this adds 380 MB to the git repo.

4. **No field stripping.** The report sends ALL 20 fields to the web, but the
   web table only displays 7 by default (16 total with toggles). Fields like
   `content_hash`, `original_id`, `merged_from`, `verified_by`, `recommendation`
   are never displayed in the web table. Stripping to the 7 default fields
   reduces file size from 7.6 MB to **2.04 MB** (68% savings). Stripping to the
   16 displayable fields would land around 3-4 MB.

**Alternatives:**

- **Option A (strongly recommended): Field stripping.** `build-debt-data.js`
  should output only the fields the web actually uses. Map each table column to
  a field; omit the rest. This alone cuts file size by 50-68%.
- **Option B: Two-file split.** `debt-data-summary.json` (2 MB, display fields
  only) loads on mount. `debt-data-detail.json` (5 MB, remaining fields) loads
  on demand when a user clicks "View Details" on a specific item.
- **Option C: Paginated JSON.** Split into `debt-data-0.json` through
  `debt-data-8.json` (1000 items each, ~900 KB per file). Load first page
  immediately, prefetch remaining pages.
- **Option D: .gitignore the output.** Add `public/debt-data.json` to
  `.gitignore` and generate it at build time only. This prevents git bloat but
  means the file does not exist until the first build.
- **Minimum action:** Add `public/debt-data.json` to `.gitignore`. Implement
  field stripping. These two changes together eliminate 68% of the file size and
  100% of the git bloat.

---

## Challenge 4: No Server-Side Rendering

**Severity: LOW**

The report correctly identifies `output: "export"` as a load-bearing constraint.
However, it does not discuss the performance implications.

**Findings:**

1. With `output: "export"`, all React rendering happens client-side. The browser
   downloads the JavaScript bundle, then downloads `debt-data.json` (7.6 MB),
   then parses it, then renders the table. This is a waterfall.

2. For a LOCAL dev tool accessed at `localhost`, this is mostly acceptable.
   Network latency is zero; the bottleneck is parse + render time.

3. The real risk is perceived performance: if the user opens the Debt tab and
   sees a blank table for 500ms+ while data loads and parses, it feels broken.

**Alternatives:**

- **Option A (recommended):** Show a skeleton/shimmer UI immediately. Use
  `React.lazy()` to code-split the Debt tab so it does not inflate the initial
  bundle for other tabs. Fetch `debt-data.json` with a loading indicator.
- **Option B:** Embed KPI summary data directly in `metrics-data.json` (which is
  small). Show KPI cards instantly while the large data file loads in the
  background. The user sees useful content immediately.
- This is LOW severity because this is a local dev tool, not a production web
  app. Users expect dev tooling to have loading states.

---

## Challenge 5: nuqs with Static Export

**Severity: MEDIUM**

The report itself flags this as MEDIUM confidence. Let me escalate the concern
with specifics.

**Findings:**

1. **nuqs is not used anywhere in this project.** Zero imports of `nuqs`,
   `useQueryState`, or `useSearchParams` exist in the codebase. This is a
   brand-new dependency with zero established patterns in the project.

2. **Static export and URL state conflict.** `output: "export"` generates static
   HTML files. URL query parameters (`?status=Open&severity=S0`) work fine for
   client-side reading via `window.location.search`. But nuqs typically relies
   on Next.js router internals (`useSearchParams` from `next/navigation`). With
   static export, the Next.js router operates in client-only mode. nuqs v2+
   claims to support this, but the interaction between nuqs, Next.js 16 App
   Router, and `output: "export"` is a three-way compatibility question that the
   report has not validated.

3. **Hash routing complication.** Some static export deployments use hash
   routing (`/#/debt?status=Open`) instead of path routing. If Firebase Hosting
   rewrites are configured to serve `index.html` for all paths, query parameters
   on paths work. If not, URL state breaks entirely.

4. **The problem nuqs solves may not exist yet.** URL state is useful for
   shareable links and browser back/forward. For a local dev dashboard with a
   single user, `useState` with no URL persistence is arguably sufficient for
   v1. URL state is a v2 optimization.

**Alternatives:**

- **Option A (recommended): Skip nuqs for v1.** Use `useState` for all filter
  state. The single user of this dashboard does not need shareable URLs. Add URL
  state in v2 if the need is demonstrated.
- **Option B:** Use raw `window.location.search` + `URLSearchParams` API
  directly. Zero dependency, works in any deployment mode, no library
  compatibility risk. Write a 20-line custom hook.
- **Option C:** Validate nuqs in a test branch before committing. Create a
  minimal page with `output: "export"`, use `useQueryState` from nuqs, build,
  and confirm the query params persist through page reload.

---

## Challenge 6: Dark Mode Chart Theming with Recharts

**Severity: LOW**

The report says "chart CSS variables exist" for dark mode theming. This
conflates two different systems.

**Findings:**

1. **Recharts renders SVG with inline styles.** `<Line stroke="#8884d8" />`,
   `<Bar fill="var(--chart-1)" />`. Recharts accepts CSS custom property
   references in some props (like `fill` and `stroke`), but not in all styling
   contexts (axis labels, tooltips, legends use inline React styles, not CSS).

2. **shadcn/ui chart wrapper exists to bridge this gap.** The shadcn Chart
   component provides `<ChartContainer config={...}>` which sets CSS variables
   and passes them to Recharts children. But as established in Challenge 1, this
   project has NO shadcn chart component installed. It would need to be added
   via `npx shadcn@latest add chart`.

3. **Tooltip and legend dark mode.** Recharts default tooltips are white
   backgrounds with black text. In dark mode, they are invisible against a dark
   container unless custom tooltip components are written. The shadcn chart
   wrapper handles this, but only if properly installed and configured.

**Alternatives:**

- **Option A (recommended):** When adding charting, install the full shadcn
  chart component (`npx shadcn@latest add chart`). This pulls in Recharts as a
  dependency and includes the CSS variable bridge, dark mode tooltips, and
  theme-aware legends. Do not install Recharts directly.
- **Option B:** If Recharts has React 19 issues (see Challenge 1), choose a
  chart library with native CSS variable support (Tremor, or Canvas-based
  libraries that accept theme config objects).
- This is LOW severity because it is a solvable implementation detail, not an
  architectural risk.

---

## Challenge 7: better-sqlite3 on Windows

**Severity: HIGH**

The report designs a full SQLite layer with `better-sqlite3` for the CLI write
path. This has a significant platform risk that is not addressed.

**Findings:**

1. **better-sqlite3 is a native Node.js addon.** It requires compilation via
   `node-gyp`, which depends on: Python, a C++ compiler (MSVC Build Tools on
   Windows), and the Windows SDK.

2. **Verified on this machine:** MSVC (`cl.exe`) is NOT available. Python IS
   available. `node-gyp` is bundled with npm but will fail at the compilation
   step without MSVC.

3. **The user is described as a "non-developer director."** Installing Visual
   Studio Build Tools (a ~6 GB download requiring admin access) to get MSVC is
   not a reasonable ask. The memory file notes "no admin access" at the work
   locale.

4. **Pre-built binaries.** `better-sqlite3` distributes prebuilt binaries via
   `prebuild-install` for common platform/arch/Node version combinations.
   Node.js 22 on Windows x64 MAY have a prebuilt binary available. If it does,
   `npm install` succeeds without a compiler. If it does not (e.g., Node 22 is
   too new for the prebuilt matrix), installation fails hard.

5. **Fallback is catastrophic.** If `better-sqlite3` cannot install, the ENTIRE
   CLI write path that depends on SQLite breaks -- sync-to-sqlite.js,
   build-debt-data.js (if it reads from SQLite), and all CLI query modes that
   use SQLite.

**Alternatives:**

- **Option A (strongly recommended): Make SQLite optional.** The CLI write path
  currently works with JSONL directly. Keep `build-debt-data.js` reading from
  MASTER_DEBT.jsonl, NOT from `data/tdms.db`. SQLite becomes an optional
  performance enhancement, not a required dependency. If `better-sqlite3` fails
  to install, everything still works.
- **Option B:** Use `sql.js` (SQLite compiled to WebAssembly) instead of
  `better-sqlite3`. Zero native compilation required. Slower (2-5x) but for
  8,472 records the difference is negligible. Works identically on Windows, Mac,
  and Linux with no build tools.
- **Option C:** Test the exact install on this machine before committing to the
  dependency. Run `npm install better-sqlite3` in a temp directory and see if
  the prebuilt binary resolves for Node 22 x64 Windows.
- **Minimum action:** Regardless of which SQLite binding is chosen,
  `build-debt-data.js` MUST read from MASTER_DEBT.jsonl as its primary source.
  SQLite is a CLI performance optimization, not a data pipeline dependency.

---

## Challenge 8: FTS5 Is CLI-Only; Web Has No Search Architecture

**Severity: MEDIUM**

The report designs an elaborate FTS5 full-text search index for SQLite (CLI
side) but the web search story is a single mention of Fuse.js.

**Findings:**

1. **FTS5 cannot serve the web.** The static SPA cannot access SQLite. All
   search on the web must be client-side. The report acknowledges this but
   treats Fuse.js as an equivalent substitute -- it is not.

2. **Fuse.js limitations at scale.** Fuse.js performs fuzzy matching by
   iterating through all records and computing similarity scores. For 8,472
   records searching across 4 fields (`id`, `title`, `description`, `file`),
   each keystroke triggers a full scan. Estimated search time: 20-80ms per
   keystroke on a modern machine. This is usable but may feel sluggish with
   debouncing.

3. **Fuse.js does not support boolean queries.** Users cannot search
   `"firebase AND auth"` or `"severity:S0 status:Open"`. The FTS5 CLI search
   supports these. The web search is significantly less powerful.

4. **Index size in memory.** Fuse.js builds an internal index on initialization.
   For 8,472 records across 4 fields, this index adds ~5-10 MB of additional
   heap memory on top of the raw data. Combined with the 7.6 MB JSON parse
   overhead and the data array itself, total memory for the Debt tab could reach
   30-40 MB.

5. **The description field is the problem.** Many MASTER_DEBT records have long
   descriptions (100-300 characters). Including `description` in Fuse.js search
   significantly slows matching. But excluding it makes search much less useful.

**Alternatives:**

- **Option A (recommended): Structured filters > fuzzy search.** For a debt
  management tool, users search by known attributes: ID, severity, status,
  category, file path. These are exact-match or prefix-match operations, not
  fuzzy search. Replace Fuse.js with simple `Array.filter()` + `includes()` for
  the search bar, combined with the existing column filter panels. Faster,
  lighter, more predictable.
- **Option B: MiniSearch** instead of Fuse.js. MiniSearch builds a proper
  inverted index (like FTS5) in memory. Supports boolean queries, prefix
  matching, and field boosting. ~3 kB gzipped. Faster than Fuse.js for large
  datasets because it uses an index instead of brute-force scanning.
- **Option C: Debounced Fuse.js with limited fields.** If Fuse.js is chosen,
  search only `id` and `title` fields (not `description` or `file`). Add
  `description` search as an explicit "Advanced Search" toggle. This keeps
  per-keystroke search under 10ms.
- **Minimum action:** Benchmark Fuse.js search performance with the actual
  dataset (8,472 records, 4 fields) before committing. If search exceeds 50ms
  per keystroke, switch to MiniSearch or structured filters.

---

## Summary: Severity Ranking

| #   | Challenge                         | Severity | Action Required                                            |
| --- | --------------------------------- | -------- | ---------------------------------------------------------- |
| 1   | React 19 + Recharts compatibility | HIGH     | Verify before committing; Recharts is NOT installed        |
| 3   | Static JSON 7.6 MB                | HIGH     | Field stripping + .gitignore; 68% size reduction available |
| 7   | better-sqlite3 on Windows         | HIGH     | Make SQLite optional; JSONL as primary source              |
| 2   | Virtualized table UX              | MEDIUM   | Two-tier loading or prominent search UX                    |
| 5   | nuqs with static export           | MEDIUM   | Skip for v1; use useState                                  |
| 8   | Web search architecture           | MEDIUM   | MiniSearch or structured filters over Fuse.js              |
| 4   | No SSR performance                | LOW      | Skeleton UI + code splitting                               |
| 6   | Dark mode chart theming           | LOW      | Install shadcn chart component properly                    |

**3 HIGH items require resolution before implementation begins.** Challenges 1,
3, and 7 represent risks that could cause build failures, unacceptable
performance, or broken installations. The remaining MEDIUM/LOW items are design
tradeoffs that can be addressed during implementation.

---

## Cross-Cutting Observation

The report makes several claims that are factually incorrect when checked
against the actual `package.json` and filesystem:

1. Recharts is described as "already in project deps" -- it is not
2. shadcn/ui chart is implied to exist -- the component has not been added
3. nuqs is recommended with no existing usage patterns -- zero imports exist
4. The `react-is` override is described as confirmed -- it has not been tested
5. The 8-12 MB size estimate is presented without field-stripping analysis

These errors suggest the research agents may have conflated "planned" or
"possible" dependencies with "existing" ones. The /deep-plan phase should verify
all dependency claims against the actual `package.json` before incorporating
them into the implementation plan.
