# Diagnosis: Dev Dashboard Command Center

**Date:** 2026-03-29 (Session #245) **Prior research:**
`.research/dev-dashboard/RESEARCH_OUTPUT.md` (42 agents, 100 claims, 90 sources,
1,153 lines)

## ROADMAP Alignment

**ALIGNED** — Track B in ROADMAP.md is explicitly "Dev Dashboard MVP (expanded
+B10/B11)" at ~20 hours estimated. The research found Track B is a valid
starting point but misses the 3 richest data sources (ecosystem health, TDMS, PR
analytics). This plan supersedes Track B's tab structure (B6-B11) with the
research-derived 6-tab structure while preserving Track B's infrastructure work
(B1-B5).

## Research Context (42-agent deep-research, Session #245)

### Architecture

- **6 tabs** (process domain model): Health, Debt, Reviews, Pipeline, Audits,
  Planning
- **Hybrid fetch:** API route in dev mode, static JSON in prod (forced by
  `output: "export"`)
- **Static JSON budget:** ~770 KB initial, ~3.5 MB full (within 5 MB ceiling)
- **Shared libraries:** Recharts (lazy, 5/6 tabs), TanStack Table (debt only),
  MiniSearch (debt only)
- **Dashboard header:** Watch Items widget (forward-findings.jsonl)
- **Diff Mode `baseline` prop:** design in Phase 1 per user decision

### User Constraints (binding)

- **No broken widgets** — tabs ship complete or not at all. Fix data → build
  tab.
- **No MVP/scope reduction** — Tabs 5+6 get full treatment, identical to 1-4.
- **No invisible processes** — suppression audit widget added to Tab 5.
- **Velocity repair in pre-work** — fix track-session.js before Tab 4.
- **All 3 Tab 4 BLOCKS in pre-work** — G29 (velocity), G30 (commit-log), G33
  (retro follow-through).

### Pre-Work Gate (must complete before any tab code)

1. Install packages: recharts, @tanstack/react-table, @tanstack/react-virtual,
   minisearch
2. Add shadcn components: badge, table, tooltip, dropdown-menu, checkbox
3. Fix BUG-01: lowercase status strings in debt-health.js
4. Fix velocity-log.jsonl broken extraction (track-session.js)
5. Verify commit-tracker produces live records (INV-1 says it does)
6. Create retro follow-through data source
7. Run /health-ecosystem-audit once (creates missing history file)
8. Normalize deep-plan state file schemas (4 incompatible versions)
9. Design `baseline?: TabData` prop interface for Diff Mode

### Key Discoveries (verified)

- BUG-06 is NOT a bug (intentional compact log format)
- `resolve-dependencies.js --json` already works (sprint board unblocked)
- `session-activity.jsonl` (135 records) is velocity-log replacement candidate
- `forward-findings.jsonl` contains cross-PLAN findings (not cross-PR)
- Recharts 3.x fully compatible with React 19.2.4
- Dual health scores: D/67 (Technical) + B/87 (Process) — both shown
- MASTER_DEBT field-strip: 7.22 MB → split (464 KB + 2.2 MB lazy)
- 41 CLI gaps, 47 data gaps catalogued with effort estimates

### Verified Data Readiness per Tab

| Tab             | Ready?                 | Blockers                                |
| --------------- | ---------------------- | --------------------------------------- |
| Tab 1: Health   | YES (after BUG-01 fix) | Warning aggregation logic needed        |
| Tab 2: Debt     | YES (after BUG-01 fix) | None — metrics.json is dashboard-ready  |
| Tab 3: Reviews  | YES                    | 3 schema versions need branching        |
| Tab 4: Pipeline | BLOCKED                | G29 velocity, G30 commit-log, G33 retro |
| Tab 5: Audits   | BLOCKED                | health-ecosystem-audit never run        |
| Tab 6: Planning | YES                    | 4 state file schemas need normalization |

### 10 Open Questions (for Phase 1 Discovery)

Q1: npm audit/SonarCloud panel location Q2: Lighthouse migration timing Q3:
useTabRefresh generic vs duplicate Q4: Auth hook deduplication Q5: Emoji vs
Lucide icons Q6: S0 alert threshold Q7: Dual health score labeling Q10: Build
script monolith vs split Q11: S1 lazy-load trigger

## Existing Patterns

- **Tab component pattern:** `lighthouse-tab.tsx` — dark gray cards,
  `getScoreBg()` color system, 4-state render (loading/error/empty/data)
- **Auth pattern:** Google OAuth + admin custom claim, duplicated between
  admin/dev pages (~80 lines identical)
- **Data fetching:** Firestore via FirestoreService (Lighthouse). Dashboard will
  use local files instead.
- **Tab navigation:** `DevTabs` component with `DevTabId` union type
- **shadcn installed:** button, dialog, empty-state, input, label, scroll-area,
  select, skeleton, textarea
- **shadcn NOT installed:** badge, table, tooltip, dropdown-menu, checkbox

## Reframe Check

The task is what it appears to be: building a 6-tab dev dashboard command center
with full data pipeline, hybrid fetch architecture, and web→CLI handoff. No
reframing needed. The research is comprehensive and the tab structure is a
binding user decision.

## Verify Commands

```bash
# BUG-01 status
grep -n "resolved\|closed" scripts/debt/debt-health.js | head -5  # [VERIFIED: lowercase at line 65]

# Package status
node -e "try{require('recharts');console.log('installed')}catch{console.log('NOT installed')}"  # [VERIFIED: NOT installed]

# DevTabId
grep "DevTabId" components/dev/dev-tabs.tsx  # [VERIFIED: 5-member union]

# output: export
grep "output" next.config.mjs  # [VERIFIED: output: "export"]
```
