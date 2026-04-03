# Findings: Charting/Visualization Libraries and Data Table Components for the Debt Dashboard

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-27
**Sub-Question IDs:** SQ-003

---

## Key Findings

### 1. The project already uses Radix UI and the pattern (shadcn) primitive stack [CONFIDENCE: HIGH]

Package audit confirmed zero charting libraries installed. The existing UI
foundation is:

- Radix UI primitives: `@radix-ui/react-dialog`, `@radix-ui/react-scroll-area`,
  `@radix-ui/react-select`, `@radix-ui/react-slot`
- `class-variance-authority`, `clsx`, `tailwind-merge` — the exact
  CVA+clsx+twMerge stack that shadcn/ui uses
- `lucide-react` — shadcn/ui's default icon library
- `framer-motion` — already installed
- `cmdk` — shadcn's command palette primitive

The project does NOT have shadcn installed as a CLI tool, but it uses all of
shadcn's underlying dependencies and already has components/ui/ with
shadcn-pattern components (button, dialog, input, label, scroll-area, select,
skeleton, textarea). The existing `AdminCrudTable` uses a hand-rolled plain HTML
`<table>` with basic search/filter — no sorting, no virtualization, no
pagination.

The `package.json` already has an `overrides` block, making it trivial to add
the `react-is` override required for Recharts + React 19.

### 2. Recharts 3.x is the correct charting library for this project [CONFIDENCE: HIGH]

Recharts released v3.0 in June 2025 with a full state management rewrite, and is
at v3.7.x as of early 2026. React 19 is supported with one known workaround: a
`react-is` peer dependency override is required. The project already has an
`overrides` block in package.json, so this is a one-line addition.

Key facts:

- SVG-based, declarative React component API (line, area, bar, pie, radar,
  radial chart types)
- Ships Tailwind-friendly — no CSS conflicts with Tailwind 4.2
- Requires `"use client"` in Next.js App Router (client-side rendering only —
  all charting libraries require this)
- Bundle size: approximately 40-50 kB gzipped (v3.x; v2.14.1 was known ~40kB
  gzip from Bundlephobia)
- 3.6M+ weekly downloads; actively maintained
- shadcn/ui's official chart components are built directly on Recharts v3 — this
  is a key alignment signal

Chart types available for debt dashboard needs:

- Trend lines over time: `LineChart` + `AreaChart`
- Severity distribution: `BarChart` (grouped/stacked) + `PieChart`
- Source health: `RadarChart` or `BarChart`
- Resolution velocity: `AreaChart` (cumulative) or `LineChart`

**React 19 workaround** (one-line addition to existing `overrides` block in
package.json):

```json
"overrides": {
  "react-is": "^19.0.0",
  "fast-xml-parser": "5.5.7",
  "@tootallnate/once": "3.0.1"
}
```

Then install with `--legacy-peer-deps`.

### 3. shadcn/ui Chart component layer is the recommended charting interface [CONFIDENCE: HIGH]

shadcn/ui has a fully built-out chart component library (53 pre-built chart
variants) that:

- Uses Recharts v3 under the hood
- Does NOT wrap Recharts in a black-box abstraction — you compose directly with
  Recharts components
- Provides `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`,
  `ChartLegend`, `ChartLegendContent`
- Handles theming via CSS variables with full Tailwind 4 support
- In Tailwind v4, chart colors use `var(--chart-1)` syntax (no `hsl()` wrapper
  needed)
- Is copy-paste based — charts are owned code, no locked-in library versioning

Since the project already uses all of shadcn's primitive dependencies, adding
shadcn chart components means zero new peer dependencies beyond Recharts itself.

### 4. TanStack Table v8 + TanStack Virtual is the correct data table solution [CONFIDENCE: HIGH]

For 8,470+ debt items, a powerful headless table + virtualization stack is
required. TanStack Table v8 (`@tanstack/react-table`) is:

- React 19 compatible (confirmed; minor React Compiler edge case exists but does
  not affect standard use)
- Headless — zero opinions on rendering, fully styled with Tailwind
- Bundle size: ~15.2 kB gzipped (extremely lightweight)
- Features: sorting, filtering (column-level + global), grouping, column
  visibility, column resize, pagination, row selection
- Integrates directly with the shadcn/ui data table pattern (officially
  documented by shadcn)
- The existing `AdminCrudTable` pattern can be evolved into a TanStack-powered
  table

TanStack Virtual (`@tanstack/react-virtual`) adds row virtualization:

- ~3.9 kB gzipped
- Handles 50,000+ rows smoothly
- Required for 8,470+ rows to avoid DOM bloat
- The two TanStack packages are designed to work together

The shadcn/ui data table documentation explicitly walks through building a table
with TanStack Table, using the same Radix UI + Tailwind primitives already in
this project.

### 5. Nivo has unresolved React 19 friction — not recommended [CONFIDENCE: MEDIUM]

Nivo's React 19 GitHub issue (#2618) was closed as resolved by the maintainer,
but as of a 2025 LogRocket review, Nivo still required `--legacy-peer-deps` to
install with React 19. The resolution is ambiguous — the issue was closed but
community reports indicate residual friction. Given the project is on React
19.2.4, and better alternatives exist with clean React 19 support, Nivo should
be deprioritized.

Nivo is also notably verbose (30+ lines for a basic chart vs Recharts), adds D3
as a direct dependency (heavier bundle), and the D3 dependency interacts poorly
with tree-shaking.

### 6. AG Grid Community is feature-complete but over-engineered at 298 kB gzipped [CONFIDENCE: HIGH]

AG Grid Community is free (MIT), React 19 compatible since v34.3.0 (Oct 2025),
and has every feature required. However:

- 298.2 kB gzipped — 20x heavier than TanStack Table
- Enterprise features (server-side row model, set filters, integrated charting)
  require $999/developer license
- The debt dashboard is an internal tool; AG Grid's enterprise positioning does
  not fit this use case
- All needed features (sorting, filtering, grouping, virtualization, export) are
  achievable with TanStack Table + Virtual at a fraction of the size

### 7. Tremor is built on Recharts but adds indirection — not needed here [CONFIDENCE: MEDIUM]

Tremor provides high-level dashboard components (KPI cards, chart wrappers, stat
tiles) built on Recharts. React 19 support is available via Tremor Blocks
templates (Next.js 15 + React 19), but the npm package (`@tremor/react`) still
depends on `@headlessui/react 1.x` which complicates React 19 upgrade paths.

Since this project already uses Radix UI (not Headless UI), and shadcn/ui chart
components provide the same Tailwind-native chart experience without Headless UI
friction, Tremor adds no value here.

### 8. react-chartjs-2 / Chart.js is a valid canvas-based alternative for performance [CONFIDENCE: MEDIUM]

react-chartjs-2 v5.3.1 has full React 19 support. Chart.js is canvas-based (not
SVG), which makes it more performant for large datasets but harder to style with
Tailwind. Given the debt dashboard charts are likely to show trend data over
months (not thousands of data points per chart), canvas performance benefits are
not needed. The SVG-based Recharts approach integrates more cleanly with
Tailwind utility classes.

### 9. Tailwind CSS 4.2.2 has no built-in charting utilities [CONFIDENCE: HIGH]

Confirmed: Tailwind CSS 4 provides no native chart or data visualization
utilities. It is a styling framework only. All charting must be done via
JavaScript libraries. Tailwind 4 is compatible with Recharts (no CSS conflicts),
and shadcn chart components have explicit Tailwind 4 support (updated from
`hsl(var(--chart-1))` to `var(--chart-1)`).

---

## Recommended Combinations

### Option A: Maximum Power — TanStack Table + AG Grid charts (NOT recommended)

- Chart: AG Grid Community integrated charting
- Table: AG Grid Community
- Bundle cost: ~500+ kB gzipped
- Verdict: Over-engineered for an internal tool. Enterprise features locked
  behind $999/dev license. Reject.

### Option B: Balanced — shadcn Charts (Recharts v3) + TanStack Table + TanStack Virtual [RECOMMENDED]

- Chart: shadcn/ui chart components (copy-paste) powered by Recharts v3
- Table: `@tanstack/react-table` v8 with shadcn/ui table primitives
- Virtualization: `@tanstack/react-virtual` v3
- Bundle cost: ~55-65 kB gzipped total (Recharts ~40-50 kB + TanStack Table ~15
  kB + Virtual ~4 kB)
- Zero new primitive dependencies — builds on Radix/Tailwind/CVA already in
  project
- Supports all required chart types (trend lines, distribution bars, pie, radar)
- Supports all table features: sorting, filtering, grouping, column resize,
  pagination, virtual scroll
- shadcn copy-paste components are owned code — no versioning lock
- React 19 compatible with one-line `react-is` override addition to existing
  overrides block
- Export (CSV) can be added manually or via a small utility like `papaparse`
  (not a table library concern)
- Recommended for this project.

### Option C: Lightweight — Recharts direct + custom Tailwind table with react-window

- Chart: Recharts directly (no shadcn wrapper layer)
- Table: Hand-rolled HTML `<table>` (evolution of existing `AdminCrudTable`) +
  `react-window` for virtualization
- Bundle cost: ~55 kB gzipped (Recharts ~40-50 kB + react-window ~15 kB)
- Pro: Complete control, minimal dependencies
- Con: Significant custom development time for filtering/sorting/grouping on
  8,470+ items; loses shadcn alignment with rest of UI

---

## Sources

| #   | URL                                                                      | Title                                       | Type           | Trust  | CRAAP Avg | Date      |
| --- | ------------------------------------------------------------------------ | ------------------------------------------- | -------------- | ------ | --------- | --------- |
| 1   | https://ui.shadcn.com/docs/components/radix/chart                        | Chart - shadcn/ui                           | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 2   | https://ui.shadcn.com/docs/react-19                                      | Next.js 15 + React 19 - shadcn/ui           | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 3   | https://ui.shadcn.com/docs/tailwind-v4                                   | Tailwind v4 - shadcn/ui                     | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 4   | https://github.com/recharts/recharts/releases                            | Releases - recharts/recharts                | official-repo  | HIGH   | 4.6       | 2025-2026 |
| 5   | https://github.com/recharts/recharts/issues/4558                         | Support React 19 - recharts                 | official-repo  | HIGH   | 4.5       | 2024-2025 |
| 6   | https://tanstack.com/table/v8/docs/framework/react/react-table           | React Table - TanStack Table Docs           | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 7   | https://tanstack.com/virtual/latest                                      | TanStack Virtual                            | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 8   | https://github.com/TanStack/table/issues/5567                            | Table re-render React Compiler issue        | official-repo  | HIGH   | 4.4       | 2025      |
| 9   | https://www.ag-grid.com/react-data-grid/community-vs-enterprise/         | AG Grid Community vs Enterprise             | official-docs  | HIGH   | 4.7       | 2025-2026 |
| 10  | https://www.ag-grid.com/react-data-grid/compatibility/                   | AG Grid Version Compatibility               | official-docs  | HIGH   | 4.7       | 2025-2026 |
| 11  | https://github.com/plouc/nivo/issues/2618                                | Nivo React 19 Support Issue                 | official-repo  | HIGH   | 4.4       | 2024-2025 |
| 12  | https://www.simple-table.com/blog/react-data-grid-bundle-size-comparison | React Data Grid Bundle Size Comparison 2025 | community-blog | MEDIUM | 3.8       | 2025      |
| 13  | https://blog.logrocket.com/best-react-chart-libraries-2025/              | Best React chart libraries 2025 - LogRocket | community-blog | MEDIUM | 3.9       | 2025      |
| 14  | https://github.com/reactchartjs/react-chartjs-2/issues/1235              | react-chartjs-2 React 19 Support            | official-repo  | HIGH   | 4.4       | 2024-2025 |
| 15  | https://ui.shadcn.com/charts/area                                        | shadcn/ui Chart Gallery                     | official-docs  | HIGH   | 4.8       | 2025-2026 |
| 16  | https://github.com/shadcn-ui/ui/issues/7669                              | shadcn Support Recharts v3 Issue            | official-repo  | HIGH   | 4.5       | 2025      |

---

## Contradictions

**Nivo React 19 status:** The GitHub issue #2618 was officially closed by the
maintainer with "React 19 is now supported," but a 2025 LogRocket review article
states that Nivo does not yet support the latest React version and requires
`--legacy-peer-deps`. This contradiction may reflect a timing gap (issue closed
but npm packages not yet republished with updated peer deps at time of the
article) or version-specific differences across `@nivo/*` packages. Regardless,
this friction does not exist with Recharts and is a reason to avoid Nivo for
this project.

**Recharts react-is override necessity:** The shadcn/ui React 19 docs say the
override IS required. Some community posts say Recharts works out of the box.
The override is a safe, low-cost addition either way.

---

## Gaps

- Precise gzipped bundle size for Recharts v3.7.x could not be retrieved
  (Bundlephobia returned 403 or empty content). The ~40-50 kB estimate is
  extrapolated from v2.14.1 known measurements and community articles; actual v3
  size may be larger due to the state management rewrite.
- No direct benchmarks were found comparing TanStack Table render performance at
  exactly 8,470 rows vs. AG Grid at the same size. Community evidence suggests
  TanStack Virtual handles 50,000+ rows smoothly.
- Export-to-CSV capability was not deeply researched for TanStack Table. This is
  a gap for the debt dashboard export requirement. `papaparse` or a manual CSV
  serializer would be needed.
- Column grouping (grouping by severity, source, etc.) in TanStack Table v8 was
  confirmed as a supported feature but was not tested against 8,470 items
  specifically.
- The shadcn/ui CLI is not installed in the project. Installing it is optional —
  the copy-paste approach works without the CLI and aligns with how the project
  already patterns its UI components.

---

## Serendipity

**The project is already 90% of the way to shadcn/ui.** The presence of
`class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*`, and
`lucide-react` in the existing dependencies means shadcn/ui chart components and
data table patterns can be adopted with zero new primitive dependencies. The
existing `components/ui/` directory already follows the shadcn file placement
convention. This significantly de-risks Option B: the charting/table stack fits
into the project's existing patterns without introducing architectural friction.

**shadcn/ui has an official "Data Table" guide** that builds a TanStack
Table-powered table using the exact Radix + Tailwind + lucide-react stack
already present. This guide can be followed almost verbatim.

**Recharts v3.0 rewrote state management** (June 2025), fixing long-standing
bugs including infinite rendering loops (fixed in v3.5.0). Using v3.7.x is
meaningfully better than v2.x would have been.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The core recommendation (shadcn Charts/Recharts v3 + TanStack Table + TanStack
Virtual) is supported by multiple independent official sources and aligns with
the project's existing dependency graph. The only uncertainty is precise bundle
sizes for v3 Recharts and the exact react-is override version string needed.
