# Findings: Debt-Runner Decisions Verification in 6-Tab Dashboard Context

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ7b

---

## Overview

This document verifies whether each architectural decision from the
`debt-runner-expansion` research (DECISIONS_PRE_PLAN.md + RESEARCH_OUTPUT.md)
still holds now that the broader 6-tab unified dashboard has been fully scoped
in the `dev-dashboard` research wave. Every decision is assessed with evidence
from the W3 data-design findings files and package.json.

---

## Decision Verdicts

### DD1: JSONL stays canonical write format

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

All six tabs consume data that originates as JSONL. No tab design has introduced
a competing write format. The W3-T2A finding explicitly states:
"build-debt-data.js MUST read from MASTER_DEBT.jsonl directly (not SQLite)." The
static export approach across all tabs (health-data.json, pipeline-data.json,
reviews-data.json, audits-data.json, planning-data.json, debt-\*.json) treats
JSONL as the source of truth and JSON as a read-only derived artifact. JSONL's
append-only semantic remains the correct fit for all five write-side systems
(debt intake, hook runs, health scores, reviews, override logs).

**Evidence:** W3-T1A, W3-T2A, W3-T3A, W3-T4A, W3-T5A, W3-T6A all define JSONL
files as the canonical read source.

---

### DD2: SQLite deferred — 179ms JSONL parse adequate

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

The dashboard context strengthens this decision. The web dashboard never parses
JSONL at request time — the static export scripts (run at build/snapshot time)
do the heavy lifting and write pre-aggregated JSON. The 179ms parse time was
already adequate for interactive CLI; it is entirely irrelevant to the web
dashboard (which reads from pre-computed JSON files). SQLite remains a valid
optional CLI acceleration layer only.

RESEARCH_OUTPUT.md note (line 154): "SQLite can be deferred entirely until JSONL
becomes a bottleneck (around 50,000+ items)." Current MASTER_DEBT is at 8,472
items — well below that threshold.

**Additional concern from RESEARCH_OUTPUT.md:** `better-sqlite3` requires Visual
Studio Build Tools on Windows (~6 GB download). This is a real friction cost
that further supports deferral.

---

### DD3: Static JSON field-stripped to ~2 MB

**Verdict: MODIFIED** [CONFIDENCE: HIGH]

The original decision assumed a single "~2 MB" static file. Actual W3-T2A
findings show the debt tab uses a split-file strategy, not a monolith:

| File                   | Size                   |
| ---------------------- | ---------------------- |
| debt-summary.json      | ~2 KB                  |
| debt-trend.json        | ~12 KB                 |
| debt-alerts.json       | ~432 KB (S0 + open S1) |
| debt-items-s0s1.json   | ~464 KB                |
| debt-items-s2s3.json   | ~2.2 MB (lazy-loaded)  |
| debt-review-queue.json | ~200 KB                |
| debt-activity.json     | ~50 KB                 |
| **Total (all debt)**   | **~3.1 MB**            |

Initial load is only ~446 KB (summary + alerts). The "2 MB" figure in the
original decision was approximate and referred to the full stripped bundle
(debt-items-all.json = 2,641 KB per W3-T2A). The split strategy is strictly
better: initial load is 5x smaller and the full dataset is only fetched
on-demand.

The "~2 MB" decision is directionally correct but the implementation is now a
lazy-split model rather than a monolithic export.

---

### DD4: 3 discovery agents initially, resolution-rate gate

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

This decision remains unchanged. The 6-tab dashboard scope does not affect the
CLI-side discovery agent layer. RESEARCH_OUTPUT.md (line 325): "The original
recommendation of 7 discovery agents was revised by contrarian review. Start
with 3 initial types; gate expansion on resolution rate." No W3 findings
contradict this. The web dashboard is a read-only consumer — it does not affect
the agent dispatch strategy.

---

### DD5: Guided mode is default for all sessions

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

The guided vs. expert mode decision is CLI-side and entirely unaffected by the
dashboard. The 6-tab dashboard is read-only (browse/filter/trends). The CLI
skill remains the write-side AI operation layer with full interactivity. The
DECISIONS_PRE_PLAN.md note (D9) is explicit: "Even with the web dashboard
handling browsing, the CLI skill will still need significant interactivity."
Guided mode as default remains valid.

---

### DD6: localStorage for annotations, Firestore optional later

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

RESEARCH_OUTPUT.md (line 488): "Start with localStorage for per-item
annotations, not Firestore." The 6-tab context does not change this. The
dashboard is a static SPA (`output: "export"` in next.config.mjs); Firestore
writes require the Firebase client SDK, which is available but adds complexity.
localStorage is the right first-step for per-item annotations on the debt tab.
No other tab has proposed annotation functionality that would require Firestore
at this stage.

---

### DD7: MiniSearch for client-side search

**Verdict: CONFIRMED — but scope is Debt tab only** [CONFIDENCE: HIGH]

MiniSearch is still the right choice for the debt table (8,472 items × 4 fields
= substantial inverted index). RESEARCH_OUTPUT.md (line 310): "MiniSearch builds
a proper inverted index (like SQLite FTS) without requiring a server."

**Scope clarification:** MiniSearch was scoped to the Debt Pipeline tab. Other
tabs have much smaller datasets where MiniSearch would be overkill:

- Reviews tab: 52 PR records (review-metrics.jsonl) — browser `Array.filter` is
  sufficient.
- Health tab: 360 pattern manifest entries — no search UI planned; filter only.
- Pipeline tab: 120 hook-run records — aggregated at build time.
- Audits tab: 9 audit types × ≤25 records each — no search needed.
- Planning tab: 4 research topics, 8 plan files, 103 sprint tasks — no search.

MiniSearch is ONLY needed for the debt items table. Adding it globally would be
premature.

**Current status:** Not installed (confirmed by package.json grep — absent from
both dependencies and devDependencies).

---

### DD8: Pre-generated AI summaries at build time (Phase 3)

**Verdict: CONFIRMED** [CONFIDENCE: MEDIUM]

RESEARCH_OUTPUT.md (line 72): "pre-generated AI summaries as a build-time
capability." The 6-tab dashboard context does not change the Phase 3 scoping for
AI summaries on the debt tab.

**Scope question opened by 6-tab context:** Should pre-generated AI summaries
extend to other tabs (e.g., a "What's deteriorating?" summary on the Health tab,
or a "Recurring pattern digest" on Reviews)? This was not addressed in the W3
findings and is a valid Phase 3 expansion question. The debt-tab-only scoping in
the original decision is still appropriate as a starting point.

**Note:** The RESEARCH_OUTPUT.md (line 589) specifies the AI Insights card is
"positioned above KPI cards" and "shows 3-5 pre-generated insights." This widget
position and count still makes sense in the 6-tab context.

---

### DD9: 4-phase implementation with independent value

**Verdict: MODIFIED — scope expanded** [CONFIDENCE: HIGH]

The original 4-phase plan was scoped to the debt-runner expansion (CLI + debt
web tab). The 6-tab dashboard reveals that phases must now account for 6 tabs,
not 1.

**What changes:** The phasing logic still holds (each phase delivers independent
value with a clean stop point), but the sequencing now involves 6 data pipelines
and 6 tab implementations rather than just the debt tab. The W3 findings have
identified tab-specific data export scripts that need to be built for each tab.

**Revised implication:** Phase 1 (foundation: static export scaffolding, the
`output: "export"` constraint confirmation, hybrid fetch hook) must be designed
to accommodate all 6 tabs, not just debt. The data generation scripts for all
tabs should share a common pattern (see W3-T2A for the reference pattern).

The 4-phase structure is directionally correct but the per-phase scope now
covers 6 tab implementations, each with their own data export script.

---

### DD10: BUG-01 + BUG-06 must fix BEFORE web development

**Verdict: CONFIRMED** [CONFIDENCE: HIGH]

This decision is strengthened by the 6-tab context. W3-T2A (Gaps section)
explicitly flags: "BUG-01 from debt-runner-expansion research — some CLI scripts
write lowercase status strings. Status filters on the UI will miss items.
Recommend adding a normalization step: `status.toUpperCase()` before filtering."

W3-T2A also confirms BUG-06: "metrics-log.jsonl is missing the breakdown fields
needed for multi-line trend charts. This is a known gap."

Both bugs directly impact the Debt Pipeline tab (Tab 2) which is likely the
first tab to implement. BUG-01 corrupts status filter results; BUG-06 prevents
historical breakdown charts. These remain pre-development blockers for Tab 2.

**Note:** These bugs do not affect Tabs 1, 3, 4, 5, or 6, which use different
data sources. However, they must still be fixed before any debt-tab work begins.

---

## Additional Technology Decisions

### Hybrid Fetch — Still Right with 6 Tabs?

**Verdict: CONFIRMED AND GENERALIZED** [CONFIDENCE: HIGH]

The hybrid fetch pattern (dev: `/api/*` live routes; prod: `public/*.json`
static files) was originally proposed for the debt tab in RESEARCH_OUTPUT.md.
W3-T2A codified it. All 5 other W3 data design findings adopted the same pattern
for their respective tabs:

- W3-T1A: `public/health-data.json` (Tab 1)
- W3-T2A: `public/debt-*.json` (Tab 2)
- W3-T3A: `public/reviews-data.json` (Tab 3)
- W3-T4A: `public/pipeline-data.json` (Tab 4)
- W3-T5A: `public/audits-data.json` (Tab 5)
- W3-T6A: `public/planning-data.json` (Tab 6)

The pattern generalizes correctly. The `output: "export"` constraint in
`next.config.mjs` applies to all tabs equally — no tab can rely on server-side
API routes in production. The hybrid fetch is NOT extra complexity introduced
for the debt tab; it is the only viable data freshness pattern for a static SPA.

**The `/api/*` dev-mode routes are optional.** Every tab's static export files
can serve as the sole data source if the dev-mode API is not implemented. The
hybrid adds zero-staleness in dev; the static files alone are sufficient for the
initial build. Teams can ship static-only first and add API routes later.

---

### TanStack Table — Still Right for All Tabs or Overkill for Some?

**Verdict: RIGHT FOR DEBT TAB; OVERKILL FOR MOST OTHERS** [CONFIDENCE: HIGH]

TanStack Table v8 (@tanstack/react-table) is justified where:

1. The dataset has 1,000+ rows (virtualization required), OR
2. Multi-column sort + multi-select filter + column visibility is needed

Applying this to each tab's largest table:

| Tab                 | Largest Table          | Rows                      | TanStack?      | Rationale                                                                                                                           |
| ------------------- | ---------------------- | ------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Debt Pipeline       | debt-items             | 8,472                     | YES — required | Virtualization mandatory; complex multi-filter                                                                                      |
| Code Review         | PR history             | 501 (archive)             | BORDERLINE     | 501 rows without virtualization is manageable; shadcn Table + native sort adequate if initial view shows recent 52 (review-metrics) |
| Build Pipeline      | Hook heatmap           | 297 cells (14×11 + 13×11) | NO             | CSS Grid is the specified approach (W3-T4A)                                                                                         |
| Health & Alerts     | Lifecycle score matrix | 20 rows                   | NO             | Plain shadcn Table with native sort                                                                                                 |
| Governance & Audits | Category comparison    | ≤25 rows per audit        | NO             | Plain table                                                                                                                         |
| Planning            | Sprint board           | 103 tasks                 | NO             | Card-based layout; TanStack overkill                                                                                                |

**Recommendation:** Install TanStack Table exclusively for the Debt Pipeline
tab. Do not make it a shared infrastructure choice across all tabs.

**Current status:** Not installed (confirmed by package.json grep).

---

### Recharts — Still Right or Should Some Tabs Use Simpler Charting?

**Verdict: RIGHT FOR DATA-HEAVY TABS; SIMPLER ALTERNATIVES ADEQUATE FOR OTHERS**
[CONFIDENCE: HIGH]

Recharts is justified for tabs with time-series charts or multi-series line
charts (meaningful chart interaction, legend toggling, axis configuration):

| Tab                 | Chart Type                               | Recharts? | Rationale                                                   |
| ------------------- | ---------------------------------------- | --------- | ----------------------------------------------------------- |
| Debt Pipeline       | Multi-line trend (5 series)              | YES       | Series toggle, date x-axis, inflection annotations required |
| Health & Alerts     | Technical health trend (32 points)       | YES       | Line chart with dip annotation; process health sparkline    |
| Code Review         | Fix rate trend (52 points), retro scores | YES       | Line chart with PR x-axis                                   |
| Build Pipeline      | Override trend (multi-series line)       | YES       | Multi-series by check type                                  |
| Governance & Audits | Audit score trend (per audit over time)  | YES       | Score trend lines per audit type                            |
| Planning            | N/A                                      | NO        | No time-series charts; sprint board is card layout          |

**Simpler alternatives for some widgets:**

- Hook compliance heatmap (W3-T4A): CSS Grid — no Recharts
- Severity donut, status donut (debt): Recharts `PieChart` — simple, justified
- Category bar charts: Recharts `BarChart` — simple, justified
- KPI cards with delta badges: Pure CSS/HTML — no charting library needed
- Agent usage bar chart: Recharts OR pure CSS bars (37 agents max — CSS
  adequate)

**Conclusion:** Recharts is needed across 5 of 6 tabs (all except Planning). It
is not overkill — the alternative would be 5 different lightweight charting
libraries or bespoke SVG, which adds more complexity than a single dependency.

RESEARCH_OUTPUT.md note (line 526): Install via `npx shadcn@latest add chart`
(NOT `npm install recharts` directly). The shadcn chart wrapper provides the CSS
variable bridge for dark mode theming.

**Current status:** Recharts NOT installed (confirmed by package.json grep).
Must be added before any chart development across all 5 tabs.

---

### Total Static JSON Budget — Sum Across All 6 Tabs

**Verdict: WITHIN 5 MB CEILING** [CONFIDENCE: HIGH]

| Tab                              | Static File(s)        | Initial Load     | Full Load              |
| -------------------------------- | --------------------- | ---------------- | ---------------------- |
| Tab 1: Health & Alerts           | health-data.json      | ~30-35 KB        | ~30-35 KB (no lazy)    |
| Tab 2: Debt Pipeline             | debt-summary + alerts | ~446 KB          | ~3,160 KB (lazy S2/S3) |
| Tab 3: Code Review               | reviews-data.json     | ~28 KB           | ~28 KB (no lazy)       |
| Tab 4: Build Pipeline            | pipeline-data.json    | ~26 KB           | ~26 KB (no lazy)       |
| Tab 5: Governance & Audits       | audits-data.json      | ~185-190 KB      | ~185-190 KB (no lazy)  |
| Tab 6: Planning & Research       | planning-data.json    | est. ~50-80 KB\* | ~50-80 KB (no lazy)    |
| **Total initial**                |                       | **~770-810 KB**  |                        |
| **Total full (all debt loaded)** |                       |                  | **~3.5-3.6 MB**        |

\*Tab 6 estimate: research-index.jsonl (4 entries), plan state files (8 × ~5 KB
each normalized), sprint board (103 tasks × ~200 bytes each = ~21 KB), lifecycle
scores (10 KB). Pre-compressed this is well under 100 KB.

**Assessment:**

- Initial page load (Tab 1 active, others not yet fetched): ~30-35 KB.
  Excellent.
- Full dashboard with all tabs loaded: ~770-810 KB uncompressed. Well under 5
  MB.
- Including lazy-load of all debt items (user-triggered): ~3.5-3.6 MB total.
  Still under the 5 MB ceiling.
- Gzip reduces all figures by ~65-70%.

**The 5 MB ceiling is NOT at risk.** The debt tab dominates the budget (88% of
full load), and its S2/S3 data is lazy-loaded only on user demand. Even if all
items are loaded, the 5 MB ceiling has ~1.4 MB of headroom.

**One caveat:** Tab 6's planning-data.json size is estimated (no W3-T6A size
section found). The sprint board output alone is 103 tasks, but the resolve-
dependencies.js output per task is small (6-8 fields). Actual size likely ~30-50
KB for the full planning export. Headroom is ample.

---

## Sources

| #   | Path                                                              | Type                    | Trust | Date       |
| --- | ----------------------------------------------------------------- | ----------------------- | ----- | ---------- |
| 1   | `.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md`           | research-decisions      | HIGH  | 2026-03-26 |
| 2   | `.research/debt-runner-expansion/RESEARCH_OUTPUT.md`              | research-output         | HIGH  | 2026-03-26 |
| 3   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`    | user-checkpoint         | HIGH  | 2026-03-29 |
| 4   | `.research/dev-dashboard/findings/W3-T2A-debt-data-design.md`     | codebase-findings       | HIGH  | 2026-03-29 |
| 5   | `.research/dev-dashboard/findings/W3-T1A-health-data-design.md`   | codebase-findings       | HIGH  | 2026-03-29 |
| 6   | `.research/dev-dashboard/findings/W3-T3A-reviews-data-design.md`  | codebase-findings       | HIGH  | 2026-03-29 |
| 7   | `.research/dev-dashboard/findings/W3-T4A-pipeline-data-design.md` | codebase-findings       | HIGH  | 2026-03-29 |
| 8   | `.research/dev-dashboard/findings/W3-T5A-audits-data-design.md`   | codebase-findings       | HIGH  | 2026-03-29 |
| 9   | `.research/dev-dashboard/findings/W3-T6A-planning-data-design.md` | codebase-findings       | HIGH  | 2026-03-29 |
| 10  | `package.json`                                                    | filesystem-ground-truth | HIGH  | 2026-03-29 |

---

## Contradictions

**1. DD3 "~2 MB" vs actual split-file design**

The original decision said "~2 MB." Actual W3-T2A finding is a split strategy:
initial load ~446 KB, full load ~3.1 MB. These are not contradictory in intent
(the goal was "browser-loadable, field-stripped") but the implementation is
materially different. The split strategy is strictly better. The /deep-plan
should use the split model, not the monolith model.

**2. TanStack Table: "Debt tab" vs possible "all tabs" interpretation**

RESEARCH_OUTPUT.md positions TanStack Table as the debt tab solution. No W3
finding explicitly says "do not use TanStack Table on other tabs." However,
verification of all six tab data sizes confirms no other tab has a dataset
requiring virtualization. The debt-tab-only scoping is a conclusion from size
analysis, not an explicit prior decision. Both readings are defensible; this
document chooses the conservative (debt-only) interpretation.

---

## Gaps

**1. No explicit size estimate for planning-data.json (Tab 6)**

W3-T6A does not include a "size estimate" section comparable to W3-T4A's 26 KB
or W3-T3A's 28 KB table. The Tab 6 budget estimate (~50-80 KB) is derived by
summing component data sizes, not from a published W3 finding. This should be
confirmed when the planning-data export script is written.

**2. SQ5a-shared-infra-hybrid-fetch.md does not exist**

The file was listed as a target source but was not created during the W3 wave.
The hybrid fetch pattern was documented within W3-T2A instead. No dedicated
shared-infrastructure findings document was produced. This is not a gap in the
actual decisions (hybrid fetch is well-documented in W3-T2A and
RESEARCH_OUTPUT.md) but represents a documentation gap.

**3. Recharts + React 19 compatibility not re-verified**

RESEARCH_OUTPUT.md (line 529) notes: "Verify React 19 compatibility. Recharts v3
uses `react-is` internally." package.json confirms React 19.2.4. No W3 finding
explicitly verified current Recharts compatibility with React 19.2.4 (the
project is on a newer React 19 than training data would know about). This should
be checked before installing Recharts.

**4. TanStack Virtual — still needed?**

RESEARCH_OUTPUT.md specifies TanStack Virtual v3 for row virtualization in the
debt table. The W3-T2A findings describe a paginated approach ("virtualized
table with server-side-style pagination"). The two approaches are different:
TanStack Virtual renders only visible rows (continuous scroll); pagination
renders a fixed page. W3-T2A uses the word "virtualized" but the description
sounds more like pagination. This tension should be resolved in /deep-plan
before implementing the debt items table.

---

## Serendipity

**The `output: "export"` constraint simplifies the decision tree for all tabs.**
Because the Next.js static export constraint is already established (and
confirmed by RESEARCH_OUTPUT.md), every tab team independently arrives at the
same static JSON pattern. This means the build pipeline and data generation
scripts are the same shape for all 6 tabs — reducing architectural decisions to
a single shared pattern rather than 6 independent choices.

**Recharts requirement is a shared dependency across 5 of 6 tabs.** Since
multiple tabs need Recharts, it should be installed once as a shared
infrastructure step — not deferred to "when the debt tab needs charts." This
changes the sequencing: install Recharts in Phase 1 scaffolding, not Phase 2
when debt-tab charts are implemented.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 1 (DD8 — pre-generated AI summaries scope extension to other
  tabs)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All verdicts are derived from direct cross-referencing of DECISIONS_PRE_PLAN.md,
RESEARCH_OUTPUT.md, all six W3-T\*A data design findings, and package.json. No
training data assumptions were used for any core verdict.
