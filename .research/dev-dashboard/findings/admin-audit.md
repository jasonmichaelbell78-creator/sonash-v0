# Admin vs Dev Dashboard Audit

**Date:** 2026-03-27 (Session #243)
**Source:** Explore agent reading app/admin/, app/dev/, components/admin/, components/dev/, ROADMAP.md, OPERATIONAL_VISIBILITY_SPRINT.md

## Admin Panel (fully built, 14 tabs)

**Route:** /admin
**Auth:** Google OAuth + admin custom claim, desktop-only
**Theme:** Light (bg-gray-50, amber accents)
**Layout:** app/admin/layout.tsx (minimal pass-through div)

### System Row (7 tabs)
- Dashboard (29 KB)
- Users (65 KB — largest file in project)
- Privileges
- Jobs
- Errors (41 KB — Sentry error display)
- Logs (28 KB — GCP log display)
- Analytics

### Content Row (7 tabs)
- Meetings, Sober Living, Daily Quotes, Slogans, Quick Links, Prayers, Glossary

All 14 tabs have real implementations (no placeholders).

## Dev Dashboard (1 real tab, 4 placeholders)

**Route:** /dev
**Auth:** Same Google OAuth + admin custom claim, desktop-only
**Theme:** Dark (bg-gray-900)
**Layout:** No layout file — self-contained in page.tsx
**Header:** Includes "Admin Panel →" link to /admin

### Current Tabs (DevTabId union type in dev-tabs.tsx:7)
- lighthouse (IMPLEMENTED — reads from Firestore)
- errors (PLACEHOLDER — "Coming soon in Operational Visibility Sprint")
- sessions (PLACEHOLDER)
- docs (PLACEHOLDER)
- overrides (PLACEHOLDER)

### Lighthouse Tab (only real tab)
- File: components/dev/lighthouse-tab.tsx (11 KB)
- Data: Reads from Firestore via FirestoreService
- Pattern: useState/useEffect/isCancelled, 4 render states

### PlaceholderTab Component
- In dev-dashboard.tsx line 65-76
- References OPERATIONAL_VISIBILITY_SPRINT.md directly in rendered UI

## Track B Plans (from ROADMAP.md + OPERATIONAL_VISIBILITY_SPRINT.md)

| Task | Tab | Target file | Status |
|------|-----|-------------|--------|
| B1 | Route setup | app/dev/page.tsx | DONE |
| B2 | Lighthouse script | lighthouse integration | DONE |
| B3 | Lighthouse CI | hook into existing tab | Not started |
| B4 | Firestore history | data layer | Not started |
| B5 | Lighthouse Dashboard | updates lighthouse-tab.tsx | Not started |
| B6 | Error Tracing Tab | components/dev/errors-tab.tsx | Not started |
| B7 | Session Activity Tab | implied sessions-tab.tsx | Not started |
| B8 | Document Sync Tab | implied docs-tab.tsx | Not started |
| B9 | Override Audit Tab | implied overrides-tab.tsx | Not started |
| B10 | System Health Tab | components/dev/health-tab.tsx | NEW (not in DevTabId) |
| B11 | Warnings Resolution Tab | components/dev/warnings-tab.tsx | NEW (not in DevTabId) |

B10 and B11 were added from Process Audit integration (Session #101).

## Boundary

| Dimension | Admin (/admin) | Dev (/dev) |
|-----------|---------------|------------|
| Audience | App operator (content + user mgmt) | Developer (build health + tooling) |
| Theme | Light | Dark |
| Auth | Same claim (admin === true) | Same claim (admin === true) |
| Content | App data + app health (Sentry, GCP) | Dev infrastructure (Lighthouse, CI, warnings) |
| State | Fully implemented | Skeleton — 4/5 placeholder |

## Overlap Risk
- Both have "Errors" — admin = Sentry runtime errors, dev = build/dependency errors
- OPERATIONAL_VISIBILITY_SPRINT.md line 126 clarifies: dev errors = "npm audit security results"

## Session #243 Decision
- Lighthouse belongs on ADMIN, not dev — move post-M1.6
- Tab selection for dev dashboard NOT pre-decided — research discovers groupings

## Key Component Patterns
- Admin tabs: admin-tabs.tsx with two-row layout (System + Content)
- Dev tabs: dev-tabs.tsx with single-row, DevTabId union type
- Lighthouse data access: Firestore via FirestoreService (NOT local files)
- Admin has no index.ts barrel — direct imports by path
- useTabRefresh hook exists at lib/hooks/use-tab-refresh.ts but scoped to AdminTabId
