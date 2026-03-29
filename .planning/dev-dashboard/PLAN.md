# Plan: Dev Dashboard Command Center

**Date:** 2026-03-29 (Session #245) **Effort:** XL (~40-60 sessions)
**Decisions:** `.planning/dev-dashboard/DECISIONS.md` (43 decisions)
**Research:** `.research/dev-dashboard/RESEARCH_OUTPUT.md` (42 agents, 100
claims)

---

## Overview

Two parallel tracks converge, then 6 tabs build sequentially in data-readiness
order. Every tab ships complete (UC1). No scope reduction (UC2).

```
Track 1: Pre-Work (bug fixes, data gaps)  ──┐
                                             ├── Converge → Build Tabs → Ship
Track 2: Scaffold (infra, shared, Pulse)  ──┘
```

**Tab build order (Decision #24):** Debt → Health → Reviews → Planning →
Pipeline → Audits

---

## Track 1: Pre-Work — Bug Fixes & Data Gaps

### Step 1: Package Installation & shadcn Components

**Files:** `package.json`, `components/ui/`

- `npm install recharts @tanstack/react-table @tanstack/react-virtual minisearch`
- `npx shadcn@latest add badge table tooltip dropdown-menu checkbox`
- Verify Recharts 3.x installs without peer dep warnings (Decision #20,
  INV-1/Q7)

**Done when:** All 4 packages in `node_modules/`, all 5 shadcn components in
`components/ui/`, `npm run build` succeeds.

### Step 2: Fix BUG-01 — Lowercase Status Strings

**Files:** `scripts/debt/debt-health.js`

- Line 65: change lowercase status comparisons (`resolved`, `closed`) to
  uppercase (`RESOLVED`, `CLOSED`) matching MASTER_DEBT.jsonl canonical format
- Run `node scripts/debt/debt-health.js` to verify fix
- Run `npm run debt:health` to confirm no downstream breakage

**Done when:** `debt-health.js` uses uppercase status strings. Health metrics
match expected counts.

### Step 3: Fix Velocity Tracking (G29)

**Files:** `scripts/session/track-session.js` (or equivalent)

- Investigate why `items_completed: 0` in all 50 entries of `velocity-log.jsonl`
- Fix: should count `- [x]` items in ROADMAP.md Active Sprint section
- Add `session-activity.jsonl` to the session-end pipeline as supplementary
  cadence metric (Decision #28)

**Done when:** `velocity-log.jsonl` correctly captures completed ROADMAP items.
`session-activity.jsonl` confirmed readable with 135+ records. **Depends on:**
Investigate root cause first — may be a regex or path issue.

### Step 4: Verify Commit Tracker (G30)

**Files:** `.claude/hooks/commit-tracker.js` (or similar PostToolUse hook)

- INV-1 confirmed tracker works — 634 entries are historical backfill, live
  commits append from that baseline
- Verify by making a test commit and checking `commit-log.jsonl` for a new
  non-seeded entry (`seeded: false` or absent)
- If verification fails, fix the hook

**Done when:** At least 1 live commit entry exists in `commit-log.jsonl` with
`seeded: false` or missing `seeded` field. Timestamp matches today.

### Step 5: Create Retro Follow-Through Data Source (G33)

**Files:** `.claude/skills/pr-retro/SKILL.md`, retro execution logic

- Extend `retros.jsonl` schema with optional `follow_through` object:
  `{verified_at: string, passed: boolean, items_completed: number, items_total: number}`
  (Decision #27)
- Update `/pr-retro` skill to populate `follow_through` when verify commands are
  re-run
- Backfill: for existing 57 retro entries, `follow_through` is `null` (handled
  by null-guard in client)

**Done when:** Next `/pr-retro` run populates `follow_through`. Schema change
documented. Existing entries gracefully null.

### Step 6: Run Health Ecosystem Audit (Tab 5 blocker)

**Files:** `.claude/state/health-ecosystem-audit-history.jsonl`

- Run `/health-ecosystem-audit` once to create the missing history file
- This is the only Tab 5 blocker — once the file exists, Tab 5 can build

**Done when:** `health-ecosystem-audit-history.jsonl` exists with at least 1
entry. **Note:** This is a user action — prompt the user to run the audit.

### Step 7: Normalize Deep-Plan State File Schemas

**Files:** `.claude/state/deep-plan.*.state.json` (8 files, 4 schemas)

- Create mapping layer in `scripts/dashboard/builders/normalize-plan-states.js`
- Handle: `topic`/`task`/`topic_slug`, `decisions` as int vs array,
  `updated`/`timestamp`/`started_at`
- Output: normalized array of
  `{slug, topic, phase, status, decisions_count, updated_at}`

**Done when:** Normalization function handles all 4 schema variants. Unit test
covers each variant.

### Step 8: Modify Lifecycle Scores Audit (Decision #29)

**Files:** `/data-effectiveness-audit` skill or its output script

- Change behavior: append timestamped entries to `lifecycle-scores.jsonl`
  instead of overwriting
- Each entry gets a `scored_at` timestamp
- Existing 20 entries get `scored_at: "2026-03-13"` backfill

**Done when:** Running the audit appends new entries with timestamps. Existing
entries have `scored_at`.

**Track 1 Audit Checkpoint:** Run code-reviewer on all modified files (Steps
2-8). Verify no regressions in `npm run build` and `npm test`.

---

## Track 2: Scaffold — Infrastructure & Shared Components

### Step 9: Extract Shared Auth Hook (Decision #4)

**Files:** `lib/hooks/use-admin-auth.ts` (new), `app/admin/page.tsx`,
`app/dev/page.tsx`

- Extract ~80 lines of shared auth state machine into `useAdminAuth()` hook
- Both pages import the shared hook
- Test: admin and dev login flows work identically

**Done when:** Both pages use `useAdminAuth()`. No duplicated auth logic. Login
works on both routes.

### Step 10: Generic useTabRefresh (Decision #3)

**Files:** `lib/hooks/use-tab-refresh.ts`

- Change type from `AdminTabId` to generic `T extends string`
- Update admin page imports (no functional change)
- Dev dashboard will consume with `DevTabId`

**Done when:** Hook is generic. Admin tabs still auto-refresh. TypeScript
compiles clean.

### Step 11: Migrate Lighthouse to Admin (Decision #2)

**Files:** `components/dev/dev-tabs.tsx`, `components/dev/dev-dashboard.tsx`,
`components/admin/admin-tabs.tsx` (or equivalent), `app/admin/page.tsx`

- Remove `"lighthouse"` from `DevTabId`
- Move `lighthouse-tab.tsx` to `components/admin/`
- Add `"lighthouse"` to `AdminTabId` and wire into admin tab navigation
- Remove `LighthouseTab` import from `dev-dashboard.tsx`

**Done when:** Lighthouse renders on admin panel. DevTabId has 0 members
(rebuilt in Step 13). No broken imports.

### Step 12: Build Dashboard Data Pipeline (Decisions #5, #17, #22)

**Files:**

- `scripts/dashboard/build-all.js` (orchestrator)
- `scripts/dashboard/builders/build-health.js`
- `scripts/dashboard/builders/build-debt.js`
- `scripts/dashboard/builders/build-reviews.js`
- `scripts/dashboard/builders/build-pipeline.js`
- `scripts/dashboard/builders/build-audits.js`
- `scripts/dashboard/builders/build-planning.js`
- `scripts/dashboard/builders/build-pulse.js`
- `package.json` (add `prebuild` + `build:dashboard` scripts)
- `.gitignore` (add `public/*-data.json`, `public/build-errors.json`)

**Implementation:**

- Orchestrator calls each builder in try/catch
- Failed builders write to `build-errors.json` (Decision #39)
- Each builder reads source JSONL, validates schema, field-strips, writes
  `public/<tab>-data.json`
- Unknown fields logged as "info" in `build-errors.json` (Decision #41)
- Add to session-begin hook for two-locale sync (Decision #17)

**Done when:** `npm run build:dashboard` produces all `public/*-data.json`
files. `build-errors.json` is empty (no errors). prebuild hook works.

### Step 13: Expand DevTabId & Tab Navigation (Decision #12)

**Files:** `components/dev/dev-tabs.tsx`, `components/dev/dev-dashboard.tsx`

- New `DevTabId`:
  `"health" | "debt" | "reviews" | "pipeline" | "audits" | "planning"`
- Update `DevTabs` component with 6 tabs in T1-T6 order
- Replace emoji labels with Lucide icons (Decision #8)
- Tab renders placeholder shells (loading skeleton) until each tab component is
  built

**Done when:** 6 tabs render in navigation. Each shows a skeleton loading state.
Lucide icons display correctly. Old tabs removed.

### Step 14: Shared Components (Decisions #25, #26, #32, #37, #14)

**Files in `components/dev/shared/`:**

- `KPICard.tsx` — grade badge, count with trend arrow, color from
  `getScoreColor` vocabulary. Tiered contrast (Decision #14).
- `DashboardChart.tsx` — Recharts wrapper, lazy-loaded via `dynamic()` with
  `ssr: false`. Dark theme tokens. Tooltip + click-to-filter + legend toggle
  (Decision #33).
- `DataTable.tsx` — TanStack Table wrapper with sorting, filtering, column
  toggles. TanStack Virtual for >100 rows (Decision #20).
- `CliHandoffMenu.tsx` — shadcn dropdown-menu per widget header. Receives
  command array, copies to clipboard (Decision #26).
- `PromoteToDebtButton.tsx` — copies `/add-debt` command with pre-filled
  context. Available on all tabs (Decision #37).
- `ErrorBoundary.tsx` — two-layer: inner (per-widget data errors) + outer
  (per-tab render crashes). Shows specific CLI fix from error-registry
  (Decisions #32, #38).
- `StaleBanner.tsx` — shows "Data may be stale" when `generated` > 24h (Decision
  #34).
- `WidgetAnchor.tsx` — wrapper adding stable anchor ID for deep linking
  (Decision #31).

**Files in `lib/dashboard/`:**

- `name-mappings.ts` — check name + agent name canonical mappings (Decision #19)
- `error-registry.ts` — error type → CLI fix command mapping (Decision #42)
- `cross-tab-links.ts` — `buildCrossTabLink(sourceId)` utility (Decision #36)
- `use-dashboard-data.ts` — shared hook for hybrid fetch: dev API route vs prod
  static JSON. NODE_ENV detection (Decision #15). Zod validation (Decision #40).
- `schemas.ts` — Zod schemas for each tab's data shape. Shared by build scripts
  AND client (Decision #40).

### Step 15: Pulse View Landing (Decision #11)

**Files:** `components/dev/pulse-view.tsx` (new),
`components/dev/dev-dashboard.tsx`

- Dual health scores: "Code Health: D/67" + "Process Health: B/87"
- Active warning count (badge, red if > 0)
- S0 debt count (badge, red if > 0 per Decision #9)
- Each metric clickable → deep link to tab + widget anchor (Decision #31)
- Design `baseline?: TabData` prop interface for future Diff Mode (UC5)
- Reads `public/pulse-data.json` (built by `build-pulse.js`)

**Done when:** `/dev` shows Pulse View on load. Clicking any metric navigates to
correct tab. Dual scores display with correct labels (Decision #7).

### Step 16: Watch Items Header Widget (Decision #13)

**Files:** `components/dev/watch-items-badge.tsx` (new),
`components/dev/dev-dashboard.tsx`

- Badge count in header bar from `forward-findings.jsonl` data
- Click expands shadcn dropdown with findings list
- Each finding shows severity, description, and source plan

**Done when:** Badge renders with correct count. Dropdown shows findings.
Clicking a finding does nothing (cross-tab link deferred to per-tab builds).

**Track 2 Audit Checkpoint:** Run code-reviewer on all new/modified files (Steps
9-16). Verify `npm run build` succeeds. Visual check: dashboard loads with Pulse
View, 6 skeleton tabs, Watch Items badge.

---

## Tab Builds (Sequential, Data-Readiness Order)

### Step 17: Tab 2 — Debt Pipeline (Decision #24 — built first)

**Files:**

- `components/dev/tabs/debt-tab.tsx` (new)
- `app/api/dashboard/debt/route.ts` (dev-mode API route)
- `scripts/dashboard/builders/build-debt.js` (if not complete from Step 12)
- `debt-tab.protocol.json` (Decision #30)

**Widgets (from W3-T2A):**

- `DebtSeverityBreakdown` — stacked bar: S0/S1/S2/S3 from `metrics.json`
- `DebtTrendChart` — line chart from `metrics-log.jsonl` (114 points)
- `DebtStatusDonut` — donut chart: NEW/VERIFIED/RESOLVED/FALSE_POSITIVE
- `DebtSourceBreakdown` — donut: by_source (20 sources, enumerate dynamically)
- `S0Table` — 26 items with age in days. Red badge (Decision #9).
- `S1Browser` — intersection observer lazy-load (Decision #6). TanStack Virtual
  (Decision #20). MiniSearch indexed (Decision #21).
- `IntakeTimeline` — last 20 intake events from `intake-log.jsonl`
- `ResolutionTimeline` — 14 resolution events
- `VerificationQueue` — 27 review-needed items
- `InsightsSlot` — empty slot for future AI insights (Decision #35)
- Each widget: CliHandoffMenu + PromoteToDebtButton + WidgetAnchor +
  ErrorBoundary

**CLI commands (from W3-T2B):**

- `/debt-runner verify`, `/debt-runner plan --severity S0,S1`
- `/sonarcloud --sync`, `/debt-runner dedup`
- `node scripts/debt/generate-metrics.js`

**Done when:** All 10 widgets render with real data. S1 lazy-loads on scroll.
MiniSearch filters debt items. CLI dropdown works on every widget. No empty
states. Protocol.json written.

### Step 18: Tab 1 — Health & Alerts

**Files:**

- `components/dev/tabs/health-tab.tsx` (new)
- `app/api/dashboard/health/route.ts`
- `health-tab.protocol.json`

**Widgets (from W3-T1A):**

- `DualHealthGrade` — "Code Health: D/67" + "Process Health: B/87" cards
  (Decision #7). Trend sparklines from both log files.
- `CategoryScoreHeatmap` — per-category scores from ecosystem-health-log
- `UnifiedWarningFeed` — build-time aggregated from 2 systems (Decision #18).
  Deduplicated by `{source, message}`. Shows lifecycle status.
- `LifecycleMatrix` — 20 systems × 4 dimensions heatmap (A-F colors)
- `PatternGateCoverage` — 17% automated / 82% manual from
  enforcement-manifest.jsonl. Breakdown by enforcement layer.
- `GradeRegressionAlert` — "Code Health dropped A→D since 2026-03-19"
- Each widget: CliHandoffMenu + ErrorBoundary + WidgetAnchor

**Done when:** All 6 widgets render. Warning feed unified. Heatmaps display
correct colors. No empty states. Protocol.json written.

### Step 19: Tab 3 — Code Review Quality

**Files:**

- `components/dev/tabs/reviews-tab.tsx` (new)
- `app/api/dashboard/reviews/route.ts`
- `reviews-tab.protocol.json`

**Widgets (from W3-T3A):**

- `ActivePRCard` — current PR#, round, items remaining from
  `pr-review-state.json` (note: legacy format, cross-reference with
  `review-metrics.jsonl`)
- `FixRateTrend` — line chart: per-PR fix ratio (52 points). Declining trend
  context note (stricter standards).
- `RoundDistribution` — bar chart: PRs needing R1/R2/R3/R4+
- `RecurringPatterns` — ranked table: top findings from `retros.jsonl`
- `ActionItemBoard` — retro action items with verify status
- `ReviewerEffectiveness` — items by source (SonarCloud/Qodo/Gemini/CodeRabbit)
- `LearningPipeline` — `pending-refinements.jsonl` (39 items, all
  `surfaced_count=0`) + `learning-routes.jsonl`. Flag dead pipeline.
- `HighChurnWatchlist` — files appearing in 4+ PRs (from W3-T3B serendipity)
- Handle 3 schema versions in `reviews.jsonl` (branch on `schema_version`,
  null-guard for unversioned legacy). Field name: `review_rounds` not `rounds`.

**Done when:** All 8 widgets render. Schema branching works. Action items show
follow-through status (from Step 5). Protocol.json written.

### Step 20: Tab 6 — Planning & Research

**Files:**

- `components/dev/tabs/planning-tab.tsx` (new)
- `app/api/dashboard/planning/route.ts`
- `planning-tab.protocol.json`

**Widgets (from W3-T6A):**

- `SprintBoard` — ROADMAP.md tasks from `resolve-dependencies.js --json`
  (confirmed working by INV-1). 81 ready / 12 blocked / 10 completed. Extract
  `(Xhr)` effort and `[E1] - Sn` severity from titles.
- `ResearchTopics` — cards from `research-index.jsonl` (4 topics). Depth, agent
  count, confidence.
- `ActivePlans` — normalized plan states (from Step 7). Phase, status, decisions
  count.
- `LifecycleScoreDrillDown` — same heatmap as Health tab but with per-system
  detail view. Links to Health tab via cross-tab (Decision #36).

**Done when:** Sprint board renders with correct task counts. Research cards
show all topics. Plan states normalized. Protocol.json written.

### Step 21: Tab 4 — Build Pipeline & Process Compliance

**Files:**

- `components/dev/tabs/pipeline-tab.tsx` (new)
- `app/api/dashboard/pipeline/route.ts`
- `pipeline-tab.protocol.json`

**Widgets — Pipeline section (from W3-T4A):**

- `HookComplianceHeatmap` — CSS Grid (not Recharts). Pre-commit 14 checks ×
  dates, pre-push 13 checks × dates. Color: pass/warn/fail/skip/auto-fix. Check
  name normalization via `name-mappings.ts` (Decision #19).
- `CommitTimeline` — bar chart by day from `commit-log.jsonl`. Note: branch/file
  data unavailable on seeded entries. Live entries from Step 4 verification.
- `AgentUsageChart` — horizontal bar by agent type. Normalize casing (Decision
  #19).
- `OverrideTrendChart` — multi-series line by check type. `doc-header` (48%) and
  `reviewer` (37.5%) highlighted.

**Widgets — Process Compliance section (Decisions #10, #28):**

- `BypassRateKPI` — overall 21.6% bypass rate
- `AutoFixKPI` — 123 silent auto-fixes in 11 days
- `AgentComplianceKPI` — 97.2% (69/71 runs)
- `ChronicSkipList` — `audit-s0s1`, `jsonl-md-sync`, `tsc` (now `type-check`)
- `VelocityWidget` — from fixed `velocity-log.jsonl` (Step 3) + session-activity
  sparkline
- `RetroFollowThrough` — from extended `retros.jsonl` (Step 5)
- `SuppressionBadge` — "N active suppressions" KPI linking to Tab 5 (Decision
  #10)

**Done when:** Heatmap renders 27 checks × dates. All Process Compliance widgets
show real data (not placeholders — UC1). Override trends display. Protocol.json
written. **Depends on:** Steps 3, 4, 5 (Track 1 pre-work must be complete).

### Step 22: Tab 5 — Governance & Audits

**Files:**

- `components/dev/tabs/audits-tab.tsx` (new)
- `app/api/dashboard/audits/route.ts`
- `audits-tab.protocol.json`

**Widgets (from W3-T5A, W3-T5B):**

- `AuditRecencyTable` — 8 audits: name, last run, score, days since, stale
  warning (>14 days). 5 currently stale.
- `AuditScoreComparison` — 8 scores side-by-side bar chart. Only hook (25), pr
  (24), skill (15) have trend data.
- `AuditTrendChart` — per-audit score over time (only audits with 5+ entries)
- `AgentQualityTrend` — separate chart from `audit-agent-quality-history.jsonl`
- `StaleAuditAlerts` — prominent warning for audits exceeding threshold
- `DeferredFindings` — filter MASTER_DEBT by `source_id` starting with
  `review:*-ecosystem-audit-*` or `audit-agent-quality-*` (2 patterns per
  W3-T5B)
- `SuppressionAuditWidget` — full inventory of suppression rules from
  `.gemini/styleguide.md` and `.qodo/pr-agent.toml`. File path, date added (if
  parseable), rule text. (Decision #10, UC3)
- Handle schema drift: hook added 3 categories in March, pr added 4. Missing
  keys treated as `null` in trend charts.
- `health-ecosystem-audit-history.jsonl` available from Step 6.

**Done when:** All 7 widgets render. Suppression audit shows real rules. Stale
alerts fire for 5 audits. Deferred findings load from MASTER_DEBT. Protocol.json
written. **Depends on:** Step 6 (health audit must have been run).

---

## Polish & Completion

### Step 23: Cross-Tab Integration Testing

- Test all deep links from Pulse View (Decision #31)
- Test cross-tab links (Decision #36) — debt items sourced from reviews, health
  scores linking to pipeline hook failures
- Test PromoteToDebtButton on every tab (Decision #37)
- Test stale data banner at >24h (Decision #34)
- Test build-errors.json rendering for failed builders (Decision #39)

**Done when:** All cross-tab navigation works. Promote-to-debt copies correct
commands. Error states display correctly.

### Step 24: Zod Schema Validation Suite (Decision #40)

**Files:** `lib/dashboard/schemas.ts`

- Finalize Zod schemas for all 7 data files (6 tabs + pulse)
- Ensure build scripts AND client use same schemas
- Test with deliberately malformed JSON to verify error boundaries trigger

**Done when:** Schema mismatch → error boundary. Missing fields → error
boundary. All happy paths pass.

### Step 25: Session-Begin Hook Integration (Decision #17)

**Files:** `.claude/hooks/` or session-begin skill configuration

- Add `npm run build:dashboard` to session-begin pipeline
- Verify it runs on both locales after `git pull`
- Verify it doesn't add >5 seconds to session-begin time

**Done when:** Fresh pull on either locale → session-begin rebuilds dashboard
data automatically. Build time acceptable.

### Step 26: Final Audit & Protocol Testing

- Run code-reviewer on all new/modified files
- Run `/test-suite --protocol=pulse-view` and each tab protocol
- Verify `npm run build` succeeds with prebuild hook
- Visual walkthrough of every tab on both locales
- Verify 0 items in `build-errors.json` on clean build

**Done when:** All protocols pass. Build clean. Both locales render correctly.
Code review clean.

---

## Summary

| Phase             | Steps        | Parallelizable                        | Effort                    |
| ----------------- | ------------ | ------------------------------------- | ------------------------- |
| Track 1: Pre-Work | 1-8          | Steps 1-2 parallel, 3-8 sequential    | L                         |
| Track 2: Scaffold | 9-16         | Steps 9-11 parallel, 12-16 sequential | L                         |
| Tab 2: Debt       | 17           | —                                     | L                         |
| Tab 1: Health     | 18           | —                                     | M                         |
| Tab 3: Reviews    | 19           | —                                     | M                         |
| Tab 6: Planning   | 20           | —                                     | M                         |
| Tab 4: Pipeline   | 21           | —                                     | L (most widgets)          |
| Tab 5: Audits     | 22           | —                                     | L (suppression audit new) |
| Polish            | 23-26        | 23-24 parallel                        | M                         |
| **Total**         | **26 steps** |                                       | **XL**                    |

**Critical path:** Track 1 Steps 3+5 (velocity fix + retro follow-through) →
Step 21 (Tab 4 Pipeline). Everything else can proceed while these are being
fixed.

**First visible artifact:** Step 15 (Pulse View) — after Track 2 scaffold is
done, the dashboard shows the health heartbeat.
