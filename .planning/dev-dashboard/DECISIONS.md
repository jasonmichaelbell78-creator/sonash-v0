# Decisions: Dev Dashboard Command Center

**Date:** 2026-03-29 (Session #245) **Questions asked:** 42 **Decisions
captured:** 43 **Prior research:** `.research/dev-dashboard/RESEARCH_OUTPUT.md`
(42 agents)

## User Constraints (binding, non-negotiable)

| #   | Constraint                                                 | Source                 |
| --- | ---------------------------------------------------------- | ---------------------- |
| UC1 | No broken widgets — tabs ship complete or not at all       | Session #245           |
| UC2 | No MVP/scope reduction — Tabs 5+6 get full treatment       | Session #245           |
| UC3 | No invisible processes — suppression audit widget in scope | Session #245           |
| UC4 | Fix data → build tab → ship complete                       | Session #245           |
| UC5 | Diff Mode baseline prop designed in Phase 1                | Session #245 Q-ANSWERS |

## Prior Research Decisions (carried forward, verified)

| #        | Decision                                    | Status                                                |
| -------- | ------------------------------------------- | ----------------------------------------------------- |
| D1-D10   | 10 pre-research decisions from Session #243 | All confirmed                                         |
| DD1-DD10 | 10 debt-runner carry-forward decisions      | DD3 modified (split-file), DD9 modified (6-tab scope) |

## Implementation Decisions

| #   | Question                      | Choice                                                                                         | Rationale                                                                                                                 |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | npm audit/SonarCloud location | Dev only                                                                                       | SonarCloud feeds TDMS (dev domain). Admin has Sentry for runtime. Clean boundary.                                         |
| 2   | Lighthouse migration          | Migrate to admin this sprint                                                                   | Tab is placeholder data — no loss removing from dev. Cleans DevTabId.                                                     |
| 3   | useTabRefresh refactor        | Generic `useTabRefresh<T>`                                                                     | ~5 lines change, prevents permanent duplication. Admin tests cover regression.                                            |
| 4   | Auth hook dedup               | Extract shared `useAdminAuth()`                                                                | Prevents auth drift between admin/dev pages. Low-risk refactor.                                                           |
| 5   | Build script architecture     | Hybrid: `build-all.js` orchestrator + per-tab builders in `scripts/dashboard/builders/`        | Single npm entry point, isolated per-tab logic, testable builders.                                                        |
| 6   | S1 lazy-load trigger          | Intersection observer on scroll past S0 section                                                | S0 (26 items) loads instantly. S1 (1,259) streams when user scrolls. No wasted bandwidth.                                 |
| 7   | Dual health score labels      | "Code Health" + "Process Health"                                                               | Most intuitive for solo developer. "Technical" is vague; "Artifact Quality" is jargon.                                    |
| 8   | Icon system                   | Lucide icons (replace emojis)                                                                  | shadcn dependency, consistent rendering, professional appearance.                                                         |
| 9   | S0 alert threshold            | Red when S0 > 0                                                                                | S0 = critical. Any non-zero count is urgent. Honest from day one (26 items).                                              |
| 10  | Suppression audit placement   | Tab 4 badge + Tab 5 full detail                                                                | Tab 4: "N active suppressions" KPI. Tab 5: full inventory with file paths and dates.                                      |
| 11  | Dashboard landing             | Pulse View                                                                                     | Dual health scores + warnings + S0. One glance = "can I start coding?" 3-5h build.                                        |
| 12  | Tab ordering                  | T1-T6: Health → Debt → Reviews → Pipeline → Audits → Planning                                  | Matches research numbering, documentation, and process domain model.                                                      |
| 13  | Watch Items widget            | Header badge count with dropdown                                                               | 4 items currently. Badge doesn't consume vertical space. Click to expand.                                                 |
| 14  | Dark theme contrast           | Tiered: primary `text-gray-200`, secondary `text-gray-300`, tertiary `text-gray-400`           | Standard dashboard practice. WCAG AA compliant for primary/secondary text.                                                |
| 15  | Hybrid fetch detection        | `process.env.NODE_ENV === "development"`                                                       | Standard Next.js pattern. No new env vars. API routes only exist during `next dev`.                                       |
| 16  | API route design              | One route per tab (`/api/dashboard/health`, etc.)                                              | Matches per-tab builder pattern. Tab-specific caching. Clean separation.                                                  |
| 17  | Static JSON gitignore         | Gitignored `public/*-data.json` + session-begin hook rebuilds                                  | Build artifacts not committed. Source JSONL is in git. Session-begin rebuilds on both locales.                            |
| 18  | Warning aggregation           | Build-time in builder script                                                                   | Normalize both warning systems to common shape. Zero client-side complexity.                                              |
| 19  | Check name normalization      | Shared `lib/dashboard/name-mappings.ts`                                                        | Used by build scripts AND client components. Fixes `doc-header`/`doc-headers`, `Explore`/`explore`.                       |
| 20  | Debt table virtualization     | TanStack Virtual (row virtualization)                                                          | 8,472 rows at 60fps. Pairs with intersection observer S1 lazy-load.                                                       |
| 21  | MiniSearch scope              | Debt only now, cross-tab via cmdk later                                                        | Debt has 8,472 searchable records. Cross-tab deferred until all tabs built.                                               |
| 22  | Prebuild trigger              | Both: `prebuild` npm hook + explicit `build:dashboard` script                                  | Automatic on `npm run build`, manual for dev testing. prebuild slot confirmed clean.                                      |
| 23  | Implementation phasing        | Two parallel tracks then sequential tabs                                                       | Track 1: pre-work + data fixes. Track 2: scaffold + shared infra. Converge, then build tabs.                              |
| 24  | Tab build order               | Debt → Health → Reviews → Planning → Pipeline → Audits                                         | Data readiness order. Debt first (most complete pipeline). Pipeline/Audits last (most blockers).                          |
| 25  | Shared component location     | `components/dev/shared/`                                                                       | Co-located with dev dashboard. `components/ui/` reserved for generic shadcn primitives.                                   |
| 26  | CLI handoff pattern           | Dropdown menu per widget header (`...` icon)                                                   | 1-3 commands per widget. Consistent, discoverable, not cluttered. shadcn dropdown-menu.                                   |
| 27  | Retro follow-through data     | Extend `retros.jsonl` with optional `follow_through` object                                    | Co-located data. `/pr-retro` already writes to this file.                                                                 |
| 28  | Velocity tracking repair      | Fix `track-session.js` AND add `session-activity.jsonl`                                        | Two metrics: velocity (items done) + cadence (sessions/week). Fix root cause + add supplementary.                         |
| 29  | Lifecycle scores trend        | Modify `/data-effectiveness-audit` to append, not overwrite                                    | Monthly audit frequency gives meaningful trend points. Single snapshot shown now, trends accumulate.                      |
| 30  | Protocol.json testing         | One per tab (7 files)                                                                          | Per-tab test isolation. `/test-suite --protocol=health-tab`. Internal tooling still needs tests.                          |
| 31  | Pulse View interaction        | Deep link with scroll-to-widget via anchor IDs                                                 | Click "S0: 26" → `#/dev?tab=debt&widget=s0-table`. Each widget gets stable anchor.                                        |
| 32  | Error state handling          | Two-layer error boundary: per-widget (data) + per-tab (render crash)                           | One broken widget doesn't take down the tab. Actionable CLI fix per error.                                                |
| 33  | Chart interaction             | Interactive: tooltips + click-to-filter table + legend toggle                                  | Click data point filters associated table. No brush zoom (overkill for 32-114 points).                                    |
| 34  | Stale data banner             | Show only when `generated` > 24h old                                                           | Under 24h: nothing. Over: "Data may be stale" + `npm run build:dashboard` copy button.                                    |
| 35  | AI Insights                   | Defer API call, build schema slot in each tab's JSON                                           | `insights` field in static JSON. Component ready. Claude API call added later.                                            |
| 36  | Cross-tab navigation          | Convention-based via `buildCrossTabLink(sourceId)` utility                                     | Parses `source_id` patterns (e.g., `PR-*` → Reviews tab). Uses `name-mappings.ts`.                                        |
| 37  | PromoteToDebtButton           | Shared component on all tabs from day one                                                      | Copies `/add-debt --title "..." --severity S2 --category "..."` with pre-filled context.                                  |
| 38  | Error boundary granularity    | Two-layer: per-widget inner + per-tab outer                                                    | Data loading → widget boundary. Render crash → tab boundary. Independent isolation.                                       |
| 39  | Build script failure mode     | Fail soft with degradation + `build-errors.json`                                               | Successful tabs render. Failed tabs show error. Banner: "N tabs stale — rebuild".                                         |
| 40  | Data validation               | Zod schema validation + timestamp check                                                        | Shared schemas between build script and client. Schema mismatch = error boundary. >24h = stale banner.                    |
| 41  | Schema drift detection        | Build-time detection, log to `build-errors.json` as "info"                                     | Unknown fields/files surfaced as "new data available" without breaking anything.                                          |
| 42  | Error CLI handoff             | Tiered: specific per-error CLI from `error-registry.ts` + generic fallback + "Copy diagnostic" | Known errors map to specific fix commands. Unknown → `npm run build:dashboard`. Full diagnostic copy for Claude sessions. |
