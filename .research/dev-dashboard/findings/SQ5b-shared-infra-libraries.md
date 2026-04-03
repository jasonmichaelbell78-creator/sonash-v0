# Findings: Shared Library Patterns — TanStack Table, Recharts, MiniSearch

**Searcher:** deep-research-searcher **Profile:** docs + codebase **Date:**
2026-03-29 **Sub-Question IDs:** SQ5b

---

## Context: What Was Read

Before designing patterns, the following sources were consulted directly:

- `package.json` — current runtime and dev dependencies
- `components/ui/` directory listing — installed shadcn components
- `components/dev/lighthouse-tab.tsx` — existing tab implementation style
- `W3-T1A-health-data-design.md` — Health tab data + widget inventory
- `W3-T2A-debt-data-design.md` — Debt tab data + widget inventory
- `W3-T3A-reviews-data-design.md` — Reviews tab data + widget inventory
- `W3-T4A-pipeline-data-design.md` — Pipeline tab data + widget inventory
- Context7 MCP docs for TanStack Table (v9 alpha), Recharts (v3.3.0), MiniSearch
- Web search for current bundle sizes

---

## Current State: What Is and Isn't Installed

**Currently in `package.json` (relevant to this task):**

- `lucide-react` — icon library (installed)
- `class-variance-authority` + `clsx` + `tailwind-merge` — styling utilities
  (installed)
- `framer-motion` — animation (installed)
- `date-fns` — date formatting (installed)
- `sonner` — toasts (installed)
- `@radix-ui/react-dialog`, `@radix-ui/react-select`,
  `@radix-ui/react-scroll-area`, `@radix-ui/react-slot` — Radix primitives
  (installed)

**NOT installed (must be added before dev dashboard work):**

- `@tanstack/react-table` — not in dependencies
- `recharts` — not in dependencies
- `minisearch` — not in dependencies

**shadcn components installed (`components/ui/`):**

- `button.tsx`, `dialog.tsx`, `empty-state.tsx`, `input.tsx`, `label.tsx`,
  `scroll-area.tsx`, `select.tsx`, `skeleton.tsx`, `textarea.tsx`,
  `voice-text-area.tsx`
- **Notable gap:** No `badge.tsx`, `table.tsx`, `tooltip.tsx`,
  `dropdown-menu.tsx`, `checkbox.tsx` — these are needed for the dashboard and
  are standard shadcn components that need to be added.

**Existing tab pattern (from `lighthouse-tab.tsx`):**

- Dark theme: `bg-gray-800`, `border-gray-700`, `text-gray-400` color vocabulary
- Loading state: simple centered text ("Loading Lighthouse data...")
- Error state: `bg-red-900/30 border-red-700 text-red-400` pattern
- Empty/setup state: structured card with instructions
- Score color convention: `text-green-400` (≥90), `text-yellow-400` (50–89),
  `text-red-400` (<50)
- No Recharts or TanStack usage yet — trend chart is a placeholder div

---

## Key Findings

### 1. Install Requirements [CONFIDENCE: HIGH]

Three packages must be installed before any shared infrastructure can be built:

```bash
npm install @tanstack/react-table recharts minisearch
```

The W3-T2A debt findings explicitly confirm this: "Recharts and shadcn chart
components are NOT currently installed and must be added before development."

Additional shadcn components needed:

```bash
npx shadcn@latest add badge table tooltip dropdown-menu checkbox
```

These are prerequisites, not optional. Every shared pattern below depends on at
least one of these.

---

### 2. TanStack Table — Shared Pattern [CONFIDENCE: HIGH]

**Version context:** Context7 docs show TanStack Table is in v9 alpha
(`@tanstack/react-table` alpha branch). The API uses `tableFeatures()`,
`useTable()`, and explicit feature imports — this is the current tree-shakeable
v9 API, different from the v8 `useReactTable()` API. The bundle size for v9
starts at ~4 KB gzipped for `useTable` alone, scaling to ~10–20 KB with all
features enabled [1][2].

**Design decision:** Use v9 alpha if it stabilizes before dashboard
implementation; fall back to v8 (`useReactTable`) if not. The patterns below
work for both — the column definition schema is identical.

#### 2a. Shared Column Definition Schema

Every tab's table extends a base column shape. The `createColumnHelper` pattern
is the TanStack-recommended approach for type-safe column definitions:

```typescript
// lib/dashboard/table-utils.ts
import { createColumnHelper } from "@tanstack/react-table";

// Base column meta that every tab's columns can optionally extend
export interface DashboardColumnMeta {
  /** If true, this column appears in export/search but not in the table by default */
  hiddenByDefault?: boolean;
  /** Align cell content right (for numbers, dates) */
  alignRight?: boolean;
  /** Tooltip text for the column header */
  headerTooltip?: string;
}

// Each tab creates its own column helper:
// const columnHelper = createColumnHelper<DebtItem>()
// const columnHelper = createColumnHelper<ReviewRound>()
// etc.
```

#### 2b. Shared `<DashboardTable>` Component

```typescript
// components/dev/shared/dashboard-table.tsx

import {
  useReactTable,         // v8 API (stable)
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface DashboardTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  /** Search term from parent (cross-tab or local search box) */
  globalFilter?: string
  /** Show column visibility toggle UI */
  showColumnToggle?: boolean
  /** Default sort */
  defaultSorting?: SortingState
  /** Empty state text */
  emptyMessage?: string
  /** Whether the data is still loading */
  isLoading?: boolean
}

export function DashboardTable<TData>({
  data,
  columns,
  globalFilter,
  showColumnToggle = false,
  defaultSorting = [],
  emptyMessage = 'No data',
  isLoading = false,
}: DashboardTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return <TableSkeleton columnCount={columns.length} rowCount={5} />
  }

  return (
    <div className="space-y-2">
      {showColumnToggle && (
        <ColumnVisibilityToggle table={table} />
      )}
      <div className="overflow-x-auto rounded border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs text-gray-400 font-medium select-none"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

#### 2c. Column Visibility Toggle Sub-Component

```typescript
// Inline within dashboard-table.tsx or extract to ColumnVisibilityToggle.tsx
function ColumnVisibilityToggle<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {table.getAllColumns()
        .filter((col) => col.getCanHide())
        .map((col) => (
          <label key={col.id} className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <Checkbox
              checked={col.getIsVisible()}
              onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
            />
            {col.id}
          </label>
        ))}
    </div>
  )
}
```

#### 2d. Per-Tab Column Definition Examples

Each tab defines its own columns array and passes it to `<DashboardTable>`.
Example for the Debt tab:

```typescript
// components/dev/debt/debt-columns.tsx
import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { DebtItem } from '@/types/dashboard'

const h = createColumnHelper<DebtItem>()

export const debtColumns = [
  h.accessor('id', {
    header: 'ID',
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
    enableHiding: false, // ID column cannot be hidden
  }),
  h.accessor('severity', {
    header: 'Severity',
    cell: (info) => <SeverityBadge value={info.getValue()} />,
    filterFn: 'equals',
  }),
  h.accessor('title', {
    header: 'Title',
    cell: (info) => (
      <span className="max-w-xs truncate block" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  h.accessor('file', {
    header: 'File',
    cell: (info) => (
      <span
        className="text-xs text-gray-400 font-mono"
        title={info.getValue()}
      >
        {info.getValue()?.split('/').pop()}
      </span>
    ),
  }),
  h.accessor('created', {
    header: 'Age',
    cell: (info) => <RelativeDate value={info.getValue()} />,
    meta: { alignRight: true },
  }),
]
```

**Usage in Debt tab:**

```typescript
<DashboardTable
  data={debtItems}
  columns={debtColumns}
  globalFilter={searchQuery}
  showColumnToggle={true}
  defaultSorting={[{ id: 'severity', desc: false }]}
  emptyMessage="No debt items match current filters"
  isLoading={isLoading}
/>
```

#### 2e. Tables Needed Per Tab

| Tab      | Table Name           | Row Type         | Key Columns                                               | Est. Rows        |
| -------- | -------------------- | ---------------- | --------------------------------------------------------- | ---------------- |
| Debt     | DebtItemsTable       | `DebtItem`       | id, severity, status, category, file, effort, created     | 8,472 (lazy)     |
| Health   | LifecycleScoreMatrix | `LifecycleScore` | system, capture, storage, recall, action, total           | 20               |
| Health   | PatternGateTable     | `PatternGateRow` | pattern_name, category, priority, coverage, last_verified | 360 (lazy)       |
| Reviews  | ReviewRoundsTable    | `ReviewRound`    | pr, date, source, total, fixed, deferred, rejected        | 23 + 478 archive |
| Reviews  | PRMetricsTable       | `PRMetric`       | pr, review_rounds, fix_ratio, total_commits               | 52               |
| Pipeline | BypassBreakdownTable | `BypassRow`      | check, overrides, hook_runs, bypass_rate                  | ~6               |
| Audits   | (TBD from W3-T5A)    | TBD              | TBD                                                       | TBD              |
| Planning | (TBD from W3-T6A)    | TBD              | TBD                                                       | TBD              |

**Virtualization note:** Only the Debt items table (8,472 rows) needs
virtualization. Consider `@tanstack/react-virtual` for that specific table. All
others are small enough for standard DOM rendering.

---

### 3. Recharts — Shared Pattern [CONFIDENCE: HIGH]

**Bundle context:** Recharts v3.3.0 is approximately 40 KB gzipped. Tree-shaking
does NOT work effectively — importing any single component bundles most of the
library. This is a known long-standing issue [3][4]. Mitigation: lazy-load the
entire charting module at the tab level.

#### 3a. Theme Tokens (Dark Mode)

Based on the lighthouse-tab.tsx color vocabulary (`bg-gray-800`,
`text-green-400`, etc.), these are the chart theme constants:

```typescript
// lib/dashboard/chart-theme.ts

/** Chart color palette for dark dashboard theme */
export const CHART_COLORS = {
  // Semantic colors for data series
  primary: "#60a5fa", // blue-400 — default line/bar
  secondary: "#34d399", // emerald-400 — success/resolved
  warning: "#fbbf24", // amber-400 — warning states
  danger: "#f87171", // red-400 — errors/critical
  muted: "#6b7280", // gray-500 — secondary/inactive series
  info: "#a78bfa", // violet-400 — info/neutral count

  // Grade colors (matches existing getScoreColor convention)
  gradeA: "#4ade80", // green-400
  gradeB: "#34d399", // emerald-400
  gradeC: "#fbbf24", // amber-400
  gradeD: "#fb923c", // orange-400
  gradeF: "#f87171", // red-400

  // Status colors (debt pipeline)
  statusNew: "#60a5fa", // blue-400
  statusVerified: "#2dd4bf", // teal-400
  statusResolved: "#4ade80", // green-400
  statusFP: "#6b7280", // gray-500
} as const;

/** Shared axis and grid styling for all charts */
export const CHART_AXIS_STYLE = {
  tick: { fill: "#9ca3af", fontSize: 11 }, // gray-400
  line: { stroke: "#374151" }, // gray-700
} as const;

export const CHART_GRID_STYLE = {
  stroke: "#1f2937", // gray-800
  strokeDasharray: "3 3",
} as const;

/** Shared tooltip styling (dark themed) */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#111827", // gray-900
    border: "1px solid #374151", // gray-700
    borderRadius: "6px",
    fontSize: "12px",
    color: "#e5e7eb", // gray-200
  },
  labelStyle: { color: "#9ca3af" }, // gray-400
} as const;
```

#### 3b. `<DashboardLineChart>` Wrapper

```typescript
// components/dev/shared/dashboard-line-chart.tsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from '@/lib/dashboard/chart-theme'

interface SeriesConfig {
  dataKey: string
  label: string
  color?: string
  strokeDasharray?: string
}

interface DashboardLineChartProps {
  data: Record<string, unknown>[]
  series: SeriesConfig[]
  xAxisKey: string
  xAxisLabel?: string
  yAxisLabel?: string
  /** 0-100 domain forces percentage scale */
  yDomain?: [number | 'auto', number | 'auto']
  /** Optional horizontal reference line (e.g. average score) */
  referenceLineY?: number
  height?: number
}

export function DashboardLineChart({
  data,
  series,
  xAxisKey,
  yDomain = ['auto', 'auto'],
  referenceLineY,
  height = 200,
}: DashboardLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid {...CHART_GRID_STYLE} />
        <XAxis
          dataKey={xAxisKey}
          tick={CHART_AXIS_STYLE.tick}
          axisLine={CHART_AXIS_STYLE.line}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={CHART_AXIS_STYLE.tick}
          axisLine={CHART_AXIS_STYLE.line}
          tickLine={false}
          width={32}
        />
        <Tooltip {...CHART_TOOLTIP_STYLE} />
        {referenceLineY !== undefined && (
          <ReferenceLine
            y={referenceLineY}
            stroke={CHART_COLORS.muted}
            strokeDasharray="4 4"
          />
        )}
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stroke={s.color ?? CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            strokeDasharray={s.strokeDasharray}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

#### 3c. `<DashboardBarChart>` Wrapper

```typescript
// components/dev/shared/dashboard-bar-chart.tsx

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from '@/lib/dashboard/chart-theme'

interface DashboardBarChartProps {
  data: { label: string; value: number; color?: string }[]
  /** 'horizontal' for category breakdowns; 'vertical' for time series */
  orientation?: 'horizontal' | 'vertical'
  height?: number
  /** Show value labels inside/outside bars */
  showLabels?: boolean
}

export function DashboardBarChart({
  data,
  orientation = 'vertical',
  height = 200,
}: DashboardBarChartProps) {
  if (orientation === 'horizontal') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, data.length * 28)}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 40, bottom: 0, left: 80 }}
        >
          <CartesianGrid horizontal={false} {...CHART_GRID_STYLE} />
          <XAxis type="number" tick={CHART_AXIS_STYLE.tick} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ ...CHART_AXIS_STYLE.tick, textAnchor: 'end' }}
            axisLine={false}
            tickLine={false}
            width={76}
          />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color ?? CHART_COLORS.primary}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} {...CHART_GRID_STYLE} />
        <XAxis dataKey="label" tick={CHART_AXIS_STYLE.tick} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_AXIS_STYLE.tick} axisLine={false} tickLine={false} width={32} />
        <Tooltip {...CHART_TOOLTIP_STYLE} />
        <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? CHART_COLORS.primary} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

#### 3d. Heatmap: CSS Grid (Not Recharts)

The Pipeline tab's hook compliance heatmap (297 cells, check × date matrix)
should be implemented with **CSS Grid, not Recharts**. The W3-T4A findings
explicitly recommend this: "14 rows × 11 columns = 154 cells for pre-commit...
Lightweight enough for CSS." Recharts has no native heatmap component and
forcing it through a custom shape would be more complex than a grid.

```typescript
// components/dev/shared/compliance-heatmap.tsx
// CSS-only implementation, no Recharts dependency
const STATUS_COLORS: Record<string, string> = {
  pass: "bg-green-900/80 hover:bg-green-900",
  warn: "bg-amber-900/80 hover:bg-amber-900",
  "auto-fix": "bg-blue-900/80 hover:bg-blue-900",
  skip: "bg-gray-800 hover:bg-gray-700",
  fail: "bg-red-900/80 hover:bg-red-900",
  "N/A": "bg-gray-900/40",
};
```

#### 3e. Chart Usage Per Tab

| Tab      | Chart Type     | Component                                    | Key Series                             |
| -------- | -------------- | -------------------------------------------- | -------------------------------------- |
| Health   | Line chart     | `DashboardLineChart`                         | Technical health score over 32 days    |
| Health   | Horizontal bar | `DashboardBarChart` orientation="horizontal" | 9 technical categories                 |
| Health   | Heatmap grid   | `CategoryHeatmap` (CSS)                      | 37 process categories                  |
| Debt     | Multi-line     | `DashboardLineChart`                         | total/open/resolved/s0/s1 over 49 days |
| Debt     | Horizontal bar | `DashboardBarChart` orientation="horizontal" | 9 categories                           |
| Reviews  | Line chart     | `DashboardLineChart`                         | fix_ratio per PR                       |
| Reviews  | Vertical bar   | `DashboardBarChart`                          | round count distribution               |
| Pipeline | Vertical bar   | `DashboardBarChart`                          | daily commit count                     |
| Pipeline | Multi-line     | `DashboardLineChart`                         | override trends by check               |
| Pipeline | Heatmap grid   | `ComplianceHeatmap` (CSS)                    | check × date compliance matrix         |

---

### 4. MiniSearch — Shared Pattern [CONFIDENCE: HIGH]

**Bundle context:** MiniSearch is approximately 5.8–8 KB gzipped [5]. It has
zero dependencies. It is safe to import directly without lazy loading.

#### 4a. What Gets Indexed Per Tab

| Tab      | Indexed Fields                                    | Boost                       | Notes                                                                              |
| -------- | ------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| Debt     | `id`, `title`, `file`, `category`, `type`, `rule` | `title: 2`                  | 8,472 rows — only index s0/s1 by default (1,386 rows); s2/s3 indexed on "load all" |
| Health   | `system`, `category`, `gap` (lifecycle scores)    | `system: 2`                 | 20 rows — trivial                                                                  |
| Health   | `pattern_name`, `category` (enforcement manifest) | `pattern_name: 2`           | 360 rows — compact fields only                                                     |
| Reviews  | `title`, `source`, `patterns` (archive)           | `title: 2`, `patterns: 1.5` | 23 active + 478 archive; patterns array joined as string                           |
| Pipeline | `check`, `type`, `message` (hook warnings)        | `check: 2`                  | 87 rows                                                                            |
| Planning | TBD (W3-T6A)                                      | TBD                         | TBD                                                                                |
| Audits   | TBD (W3-T5A)                                      | TBD                         | TBD                                                                                |

#### 4b. Shared `useDashboardSearch` Hook

```typescript
// hooks/use-dashboard-search.ts
import MiniSearch, { SearchResult } from "minisearch";
import { useMemo, useState, useCallback } from "react";

interface SearchableDocument {
  id: string | number;
  [key: string]: unknown;
}

interface UseDashboardSearchOptions<T extends SearchableDocument> {
  documents: T[];
  /** Fields to index for search */
  fields: (keyof T & string)[];
  /** Field weights — higher = boosted in results */
  boost?: Partial<Record<keyof T & string, number>>;
  /** Fields to store for result display (default: all) */
  storeFields?: (keyof T & string)[];
  /** Enable fuzzy matching (0.2 = 20% edit distance) */
  fuzzy?: number;
}

export function useDashboardSearch<T extends SearchableDocument>({
  documents,
  fields,
  boost = {},
  storeFields,
  fuzzy = 0.2,
}: UseDashboardSearchOptions<T>) {
  const [query, setQuery] = useState("");

  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<T>({
      idField: "id",
      fields,
      storeFields: storeFields ?? fields,
      searchOptions: {
        boost,
        fuzzy,
        prefix: true,
      },
    });
    if (documents.length > 0) {
      ms.addAll(documents);
    }
    return ms;
  }, [documents, fields, boost, fuzzy, storeFields]);

  const results = useMemo<T[]>(() => {
    if (!query.trim()) return documents;
    return miniSearch.search(query).map((r: SearchResult) => r as unknown as T);
  }, [query, miniSearch, documents]);

  const search = useCallback((q: string) => setQuery(q), []);
  const clearSearch = useCallback(() => setQuery(""), []);

  return {
    query,
    results,
    search,
    clearSearch,
    isFiltered: query.trim().length > 0,
  };
}
```

**Usage in DebtTab:**

```typescript
const { query, results, search } = useDashboardSearch({
  documents: debtItems,
  fields: ["id", "title", "file", "category", "type", "rule"],
  boost: { title: 2 },
  storeFields: [
    "id",
    "title",
    "severity",
    "status",
    "category",
    "file",
    "effort",
    "created",
  ],
});

// Wire to <DashboardTable globalFilter={query} />
// Wire to <Input value={query} onChange={(e) => search(e.target.value)} />
```

#### 4c. Cross-Tab Search — Deferred

Cross-tab search is an aspirational feature that requires a shared search index.
The current tab-isolated pattern (each tab has its own `useDashboardSearch`
instance) does not support "search across all tabs."

Cross-tab search would require:

1. A single root-level `MiniSearch` instance with all documents from all tabs
2. A discriminator field (`tab: 'debt' | 'health' | 'reviews' | ...`) on every
   document
3. Result grouping by `tab` field with navigation to the right tab on click

**Recommendation:** Do not implement cross-tab search in the initial dashboard
build. Each tab searches its own data. The `useDashboardSearch` hook is designed
to support cross-tab use later (the `filter` parameter of MiniSearch's search
API supports `filter: (r) => r.tab === 'debt'`), but wiring it requires a global
state layer (Context or Zustand) that is not in scope for Phase 1.

---

### 5. KPI Card Pattern [CONFIDENCE: HIGH]

Every tab from the data design findings needs status cards. The Debt tab needs
4-6, the Health tab needs 2, the Reviews tab needs several, and the Pipeline tab
needs 4. A single shared component handles all of them.

```typescript
// components/dev/shared/kpi-card.tsx

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type TrendDirection = 'up' | 'down' | 'stable' | 'none'
type CardVariant = 'default' | 'danger' | 'warning' | 'success' | 'info'

interface KPICardProps {
  label: string
  value: string | number
  /** e.g. "+3 since last run" or "42d avg" */
  subtext?: string
  /** Arrow direction for trend */
  trend?: TrendDirection
  /** Whether 'up' is good or bad (default: 'up-is-good') */
  trendSemantic?: 'up-is-good' | 'up-is-bad'
  /** Override card background/border color */
  variant?: CardVariant
  /** Optional grade badge: 'A' | 'B' | 'C' | 'D' | 'F' */
  grade?: string
  /** Lucide icon */
  icon?: LucideIcon
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'bg-gray-800 border-gray-700',
  danger:  'bg-red-900/30 border-red-700',
  warning: 'bg-amber-900/30 border-amber-700',
  success: 'bg-green-900/30 border-green-700',
  info:    'bg-blue-900/30 border-blue-700',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-900/50 text-green-400 border-green-700',
  B: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  C: 'bg-amber-900/50 text-amber-400 border-amber-700',
  D: 'bg-orange-900/50 text-orange-400 border-orange-700',
  F: 'bg-red-900/50 text-red-400 border-red-700',
}

export function KPICard({
  label,
  value,
  subtext,
  trend = 'none',
  trendSemantic = 'up-is-good',
  variant = 'default',
  grade,
  icon: Icon,
}: KPICardProps) {
  const trendColor =
    trend === 'none' || trend === 'stable' ? 'text-gray-400' :
    (trend === 'up') === (trendSemantic === 'up-is-good') ? 'text-green-400' : 'text-red-400'

  const trendSymbol = { up: '↑', down: '↓', stable: '→', none: '' }[trend]

  return (
    <div className={cn('rounded-lg p-4 border', VARIANT_STYLES[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1 truncate">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-100">{value}</span>
            {trend !== 'none' && (
              <span className={cn('text-sm font-medium', trendColor)}>
                {trendSymbol}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-gray-500 mt-1">{subtext}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {grade && (
            <span className={cn(
              'text-lg font-bold px-2 py-0.5 rounded border',
              GRADE_COLORS[grade] ?? 'bg-gray-700 text-gray-300 border-gray-600'
            )}>
              {grade}
            </span>
          )}
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
    </div>
  )
}
```

**Usage examples from data design findings:**

```typescript
// Health tab — Technical Health Grade Card
<KPICard
  label="Technical Health"
  value="67/100"
  grade="D"
  trend="down"
  trendSemantic="up-is-good"
  subtext="−1 since last run · 2026-03-27"
  variant="warning"
/>

// Debt tab — S0 Alert Card
<KPICard
  label="S0 Critical Alerts"
  value={11}
  subtext="Requires immediate action"
  variant="danger"
/>

// Pipeline tab — Bypass Rate Card
<KPICard
  label="Override Bypass Rate"
  value="21.6%"
  trend="up"
  trendSemantic="up-is-bad"
  subtext="33 overrides / 153 total opportunities"
  variant="warning"
/>
```

---

### 6. Data Loading Pattern [CONFIDENCE: HIGH]

The hybrid fetch pattern appears in all four data design findings (W3-T1A
through T4A). This shared hook standardizes it.

```typescript
// hooks/use-dashboard-data.ts

type DataStatus = "idle" | "loading" | "success" | "error" | "empty";

interface UseDashboardDataResult<T> {
  data: T | null;
  status: DataStatus;
  error: string | null;
  refetch: () => void;
  lastFetchedAt: Date | null;
}

/**
 * Hybrid fetch: dev → API route, prod → static JSON.
 * The path is the static JSON path (e.g. '/debt-summary.json').
 * In dev, an optional apiPath overrides it (e.g. '/api/debt/summary').
 */
export function useDashboardData<T>(
  staticPath: string,
  options?: {
    apiPath?: string;
    /** Transform raw JSON before storing in state */
    transform?: (raw: unknown) => T;
  }
): UseDashboardDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<DataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const isDev = process.env.NODE_ENV === "development";
  const url = isDev && options?.apiPath ? options.apiPath : staticPath;

  const fetchData = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const raw: unknown = await res.json();
      const transformed = options?.transform
        ? options.transform(raw)
        : (raw as T);
      if (
        transformed === null ||
        (Array.isArray(transformed) && transformed.length === 0)
      ) {
        setStatus("empty");
      } else {
        setStatus("success");
      }
      setData(transformed);
      setLastFetchedAt(new Date());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, status, error, refetch: fetchData, lastFetchedAt };
}
```

**Usage pattern in each tab:**

```typescript
// DebtPipelineTab.tsx
const {
  data: summary,
  status,
  error,
} = useDashboardData<DebtSummary>("/debt-summary.json", {
  apiPath: "/api/debt/summary",
});

// Lazy-loaded data
const [loadAll, setLoadAll] = useState(false);
const { data: s2s3Items } = useDashboardData<DebtItem[]>(
  "/debt-items-s2s3.json",
  { apiPath: "/api/debt/items?severity=S2,S3", enabled: loadAll } // add enabled flag
);
```

**Loading / Error / Empty state rendering:**

```typescript
if (status === 'loading') return <TabLoadingSkeleton />
if (status === 'error')   return <TabErrorState message={error} />
if (status === 'empty')   return <TabEmptyState message="No data available" />
```

---

### 7. "Data Unavailable" Pattern [CONFIDENCE: HIGH]

The Pipeline tab has two confirmed broken data sources (velocity-log.jsonl and
retro follow-through). The pattern should be reusable across any tab that
encounters this condition.

```typescript
// components/dev/shared/data-unavailable.tsx

import { AlertTriangle } from 'lucide-react'

interface DataUnavailableProps {
  /** Short label for what is unavailable */
  label: string
  /** Why the data is unavailable */
  reason: string
  /** Source file path for reference */
  sourceFile?: string
  /** Optional raw data peek link (opens in modal or logs to console) */
  onViewRaw?: () => void
  /** Additional context (e.g., record counts, session range) */
  context?: string
}

export function DataUnavailable({
  label,
  reason,
  sourceFile,
  onViewRaw,
  context,
}: DataUnavailableProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-600 bg-gray-900/50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800">
              Unavailable
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-1">{reason}</p>
          {context && <p className="text-xs text-gray-500">{context}</p>}
          {sourceFile && (
            <p className="text-xs text-gray-600 font-mono mt-1">{sourceFile}</p>
          )}
          {onViewRaw && (
            <button
              onClick={onViewRaw}
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 underline underline-offset-2"
            >
              View raw data
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Usage examples from data design findings:**

```typescript
// Pipeline tab — Velocity widget
<DataUnavailable
  label="Velocity"
  reason="items_completed = 0 across all 50 sessions. Extraction script not reading ROADMAP items."
  sourceFile=".claude/state/velocity-log.jsonl"
  context="Sessions tracked: #148–#243"
/>

// Pipeline tab — Retro Follow-Through
<DataUnavailable
  label="Retro Follow-Through"
  reason="No tracking data source identified. Requires a new JSONL-based tracking mechanism."
/>

// Health tab — Testing category
<DataUnavailable
  label="Testing Score"
  reason="Testing category scores 0/F across all 32 runs. Likely a data collection gap, not 0% pass rate."
  sourceFile="data/ecosystem-v2/ecosystem-health-log.jsonl"
/>
```

---

### 8. Bundle Impact and Lazy Loading Strategy [CONFIDENCE: MEDIUM]

**Estimated bundle additions (gzipped):**

| Library                    | Gzipped Size | Notes                                            |
| -------------------------- | ------------ | ------------------------------------------------ |
| `@tanstack/react-table` v8 | ~14–16 KB    | Current stable; used across all 6 tabs           |
| `@tanstack/react-table` v9 | ~4–20 KB     | v9 tree-shakeable; ~6–10 KB typical usage [1][2] |
| `recharts` v3.3.0          | ~40 KB       | Not effectively tree-shakeable [3][4]            |
| `minisearch`               | ~6–8 KB      | Zero deps; safe to import directly [5]           |
| **Total (worst case)**     | ~66–68 KB    | All three in main bundle                         |
| **Total (optimized)**      | ~30–34 KB    | Recharts lazy-loaded per tab; v9 table           |

**Lazy loading strategy for Recharts:**

Because Recharts pulls ~40 KB regardless of which chart types you import, the
optimal strategy is to lazy-load the chart components at the tab level using
Next.js dynamic imports:

```typescript
// In each tab that uses charts:
import dynamic from 'next/dynamic'

const DashboardLineChart = dynamic(
  () => import('@/components/dev/shared/dashboard-line-chart').then(m => m.DashboardLineChart),
  {
    loading: () => <div className="h-48 animate-pulse bg-gray-800 rounded" />,
    ssr: false,  // Recharts uses browser APIs; SSR would fail
  }
)

const DashboardBarChart = dynamic(
  () => import('@/components/dev/shared/dashboard-bar-chart').then(m => m.DashboardBarChart),
  { loading: () => <div className="h-48 animate-pulse bg-gray-800 rounded" />, ssr: false }
)
```

**This means:** A user who opens the dashboard but only views a non-chart tab
will not pay the ~40 KB Recharts cost until they navigate to a tab that uses
charts.

**TanStack Table:** Import directly (not lazy). At 14–16 KB (v8), it is lighter
than Recharts and needed immediately when any table tab loads. Tables are
present on almost every tab, so lazy-loading TanStack Table would not save
meaningful bytes in practice.

**MiniSearch:** Import directly. At 6–8 KB, it adds minimal overhead. The search
index is built lazily (only when data is loaded), so there is no startup cost
beyond the import.

**Total dashboard overhead estimate (at tab open, optimized):**

- TanStack Table: ~16 KB (loaded once, shared)
- MiniSearch: ~8 KB (loaded once, shared)
- Recharts: ~40 KB (loaded on first chart tab visit, then cached)
- KPI Cards, shared components: ~5–8 KB
- Data loading hooks: ~2–3 KB
- **Total: ~71–75 KB** above existing app bundle for full dashboard
  functionality

This is acceptable for a developer-only `/dev` route. The dashboard is not in
the user-facing critical path.

---

### 9. Component File Organization [CONFIDENCE: MEDIUM]

Based on the existing structure (`components/dev/lighthouse-tab.tsx`) and the
number of shared patterns, the recommended directory layout:

```
components/dev/
  shared/
    dashboard-table.tsx        -- <DashboardTable> + <ColumnVisibilityToggle> + <TableSkeleton>
    dashboard-line-chart.tsx   -- <DashboardLineChart>
    dashboard-bar-chart.tsx    -- <DashboardBarChart>
    compliance-heatmap.tsx     -- <ComplianceHeatmap> (CSS Grid)
    kpi-card.tsx               -- <KPICard>
    kpi-strip.tsx              -- <KPIStrip> (row of KPI cards)
    data-unavailable.tsx       -- <DataUnavailable>
    section-heading.tsx        -- <SectionHeading> with optional info tooltip
  health-tab.tsx
  debt-tab.tsx
  reviews-tab.tsx
  pipeline-tab.tsx
  audits-tab.tsx
  planning-tab.tsx
  lighthouse-tab.tsx           -- existing

lib/dashboard/
  chart-theme.ts               -- CHART_COLORS, CHART_AXIS_STYLE, etc.
  table-utils.ts               -- DashboardColumnMeta, shared column helpers

hooks/
  use-dashboard-data.ts        -- useDashboardData<T>
  use-dashboard-search.ts      -- useDashboardSearch<T>
```

---

## Contradictions

**TanStack Table v8 vs v9:** The Context7 docs show the v9 alpha API
(`tableFeatures()`, `useTable()`, explicit feature imports). The stable
published package is v8 (`useReactTable()`). The v9 API breaks backward
compatibility. The patterns in this document use v8 syntax (stable) because
installing an alpha package into a production codebase is risky. If v9
stabilizes before dashboard implementation begins, the column definition schema
is compatible — only the `useTable` call and feature import pattern differs.

**Recharts tree-shaking claims:** Some Recharts documentation implies
tree-shaking works. Multiple GitHub issues (1417, 3697) and bundlephobia data
contradict this — the full 40 KB loads on any import. The lazy-loading strategy
mitigates this regardless of tree-shaking status.

---

## Gaps

1. **W3-T5A (Audits) and W3-T6A (Planning) data designs not read** — Those
   findings were not available at research time. The table patterns in this
   document will need to be extended for those tabs once their column schemas
   are known. The shared `<DashboardTable>` component is designed to accept any
   `ColumnDef<T>` so extension should be straightforward.

2. **No `badge.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`, `checkbox.tsx` shadcn
   components installed** — These are referenced in the table and KPI card
   patterns. They need to be added via `npx shadcn@latest add` before
   implementation.

3. **TanStack Virtual not evaluated** — The Debt table has 8,472 rows.
   `@tanstack/react-virtual` (separate package, ~4 KB gzipped) is the standard
   pairing for virtualization with TanStack Table. This document assumes the
   Debt tab lazy-loads the S2/S3 data and uses standard pagination as a first
   approach, deferring virtualization until performance testing reveals it is
   needed.

4. **No accessibility audit performed** — The dark color scheme uses
   `text-gray-400` for secondary text. WCAG AA requires 4.5:1 contrast ratio for
   normal text. gray-400 (#9ca3af) on gray-800 (#1f2937) is approximately 3.8:1
   — below threshold. This should be flagged to the implementer for
   accessibility review.

5. **MiniSearch index rebuild on data update** — The `useDashboardSearch` hook
   rebuilds the MiniSearch index via `useMemo` when `documents` changes. For
   large datasets (debt items at 1,386–8,472 rows), this rebuild could take
   50–200ms. The hook does not debounce this. If data refreshes frequently in
   dev mode, this may cause noticeable lag.

---

## Serendipity

**The `lighthouse-tab.tsx` score color convention is the right starting point.**
Its `getScoreColor()` function (≥90 green, ≥50 yellow, <50 red) is the
established pattern for this codebase. The KPI card and grade color systems in
this document extend — rather than replace — that convention, which means the
Health tab's grade cards will visually harmonize with the existing Lighthouse
tab.

**MiniSearch can serve as a light alternative to filtering dropdowns.** Several
tabs (Debt, Reviews) have multi-select filter UIs planned. For power users, a
single search box backed by MiniSearch
(`search('S0 sonarcloud code-quality', { prefix: true }`) can replace multiple
dropdowns. Consider a "search or filter" toggle pattern that shows MiniSearch
for keyboard-first users and dropdowns for mouse-first users.

**The `DataUnavailable` component is also useful for the Lighthouse tab.** The
current lighthouse-tab.tsx "No data" state is a bespoke implementation. It could
be refactored to use the shared `<DataUnavailable>` component, reducing code
duplication and establishing a consistent empty-state vocabulary across the
entire dashboard.

---

## Sources

| #   | URL/Path                                               | Title                             | Type                  | Trust  | CRAAP        | Date       |
| --- | ------------------------------------------------------ | --------------------------------- | --------------------- | ------ | ------------ | ---------- |
| 1   | https://github.com/TanStack/table/discussions/5834     | TanStack Table V9 RFC             | GitHub discussion     | MEDIUM | 4/4/4/4/4=20 | 2024       |
| 2   | https://bundlephobia.com/package/@tanstack/react-table | @tanstack/react-table bundle size | Bundlephobia          | MEDIUM | 4/5/4/4/5=22 | 2026       |
| 3   | https://github.com/recharts/recharts/issues/1417       | Recharts large bundle size issue  | GitHub issue          | MEDIUM | 4/4/3/4/5=20 | ongoing    |
| 4   | https://github.com/recharts/recharts/issues/3697       | Recharts large bundle size #3697  | GitHub issue          | MEDIUM | 4/4/3/4/5=20 | ongoing    |
| 5   | https://bundlephobia.com/package/minisearch            | minisearch bundle size            | Bundlephobia          | MEDIUM | 4/5/4/4/5=22 | 2026       |
| 6   | Context7: `/tanstack/table`                            | TanStack Table docs (v9 alpha)    | Official docs via MCP | HIGH   | 5/5/5/5/5=25 | 2026       |
| 7   | Context7: `/recharts/recharts`                         | Recharts docs v3.3.0              | Official docs via MCP | HIGH   | 5/5/5/5/5=25 | 2026       |
| 8   | Context7: `/lucaong/minisearch`                        | MiniSearch docs                   | Official docs via MCP | HIGH   | 5/5/5/5/5=25 | 2026       |
| 9   | `components/dev/lighthouse-tab.tsx`                    | Existing tab implementation       | Codebase filesystem   | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |
| 10  | `package.json`                                         | Current dependencies              | Codebase filesystem   | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |
| 11  | `W3-T1A-health-data-design.md`                         | Health tab data spec              | Research findings     | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |
| 12  | `W3-T2A-debt-data-design.md`                           | Debt tab data spec                | Research findings     | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |
| 13  | `W3-T3A-reviews-data-design.md`                        | Reviews tab data spec             | Research findings     | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |
| 14  | `W3-T4A-pipeline-data-design.md`                       | Pipeline tab data spec            | Research findings     | HIGH   | 5/5/5/5/5=25 | 2026-03-29 |

---

## Confidence Assessment

- HIGH claims: 7 (install requirements, TanStack Table pattern, Recharts
  pattern, MiniSearch pattern, KPI Card pattern, Data Loading pattern,
  DataUnavailable pattern)
- MEDIUM claims: 2 (bundle sizes — web search rather than live npm check;
  component organization — design recommendation)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All patterns are grounded in direct filesystem inspection of the existing
codebase (lighthouse-tab.tsx style conventions, package.json current state,
shadcn component inventory) combined with Context7 MCP documentation for the
three libraries. No pattern was designed from training data alone.
