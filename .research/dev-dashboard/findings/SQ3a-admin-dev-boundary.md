# Findings: Admin vs Dev Dashboard Boundary Classification

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ3a

---

## Method

All source files were read directly from the filesystem. Admin component files
were inspected (admin-tabs.tsx, errors-tab.tsx, dashboard-tab.tsx,
analytics-tab.tsx, logs-tab.tsx, jobs-tab.tsx), as were all dev files
(dev-dashboard.tsx, dev-tabs.tsx, lighthouse-tab.tsx, app/admin/page.tsx,
app/dev/page.tsx). All Wave 1 findings were read in full (SQ1a-1, SQ1a-3, SQ1b,
SQ1c-2) plus the prior admin-audit.md from Session #243. Shared infrastructure
(admin-tab-context.tsx, use-tab-refresh.ts) was also inspected.

---

## Key Findings

### 1. The Two Panels Have Fundamentally Different Audiences and Data Domains [CONFIDENCE: HIGH]

Confirmed from code inspection across all source files:

**Admin Panel (/admin):**

- Audience: App operator managing live app health and content
- Data: Firebase/Firestore runtime data — user records, Sentry runtime errors,
  GCP Cloud Function logs, scheduled job run statuses, DAU/WAU/MAU app
  analytics, content (meetings, quotes, slogans, etc.)
- Theme: Light (bg-gray-50, amber accents)
- All data fetched via `httpsCallable` (Cloud Functions) — no local file reads

**Dev Dashboard (/dev):**

- Audience: Developer monitoring build pipeline, code quality, and dev process
- Data: Local filesystem artifacts — `.claude/state/*.jsonl`,
  `data/ecosystem-v2/*.jsonl`, `docs/technical-debt/MASTER_DEBT.jsonl`, hook
  runs, agent invocations, PR review history
- Theme: Dark (bg-gray-900, gray palette, blue accent for active tab)
- Data sourced from Firestore (Lighthouse) + local files (all planned tabs)

The decision D4 ("Admin = app + users; Dev = build pipeline + dev process") is
confirmed as an accurate and clean split. No existing admin tab serves
developer-process data; no existing dev tab serves app-operator data.

---

### 2. Boundary Classification Table — All Wave 1 Data Sources [CONFIDENCE: HIGH]

Every data source identified in Wave 1 classified against the D4 boundary rule.

**Classification key:**

- ADMIN: Belongs on admin panel; app/user/runtime data
- DEV: Belongs on dev dashboard; build/process/code-health data
- BOTH: Legitimately useful to both audiences; display in both OR use a shared
  widget
- NEITHER: Not dashboard material (pipeline artifacts, ephemeral files, app
  content)

#### App Runtime Data (Firebase/Cloud Functions)

| Data Source                                    | Classification    | Rationale                                                                               |
| ---------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| Sentry runtime errors (errors-tab.tsx)         | ADMIN             | Runtime crashes in the live app, user-impacting                                         |
| GCP Cloud Function logs (logs-tab.tsx)         | ADMIN             | Operational logs for Firebase Functions — function execution, auth events, admin events |
| Scheduled job statuses (jobs-tab.tsx)          | ADMIN             | Cloud Scheduler runs for Firebase jobs (cron-based app maintenance)                     |
| DAU/WAU/MAU analytics (analytics-tab.tsx)      | ADMIN             | App user activity and cohort retention                                                  |
| User records + auth (users-tab.tsx)            | ADMIN             | User management, anonymous migrations                                                   |
| Privileges/custom claims (privileges-tab.tsx)  | ADMIN             | Admin claim grants/revocations                                                          |
| Firestore health check (dashboard-tab.tsx)     | ADMIN             | Live Firestore + Auth service status                                                    |
| Rate limit entries (dashboard-tab.tsx)         | ADMIN             | App-facing rate-limit state (httpsCallable protected)                                   |
| Storage stats (dashboard-tab.tsx)              | ADMIN             | Firebase Storage bucket usage, orphaned files                                           |
| Collection stats (dashboard-tab.tsx)           | ADMIN             | Firestore collection document counts                                                    |
| Active user count (dashboard-tab.tsx)          | ADMIN             | App users: last 24h, 7d, 30d                                                            |
| Content tabs (meetings, quotes, slogans, etc.) | ADMIN             | App content management; zero dev relevance                                              |
| Lighthouse scores (Firestore)                  | ADMIN (post-M1.6) | D1 decision: moves from dev to admin after M1.6                                         |

#### Dev Process Data (Local Files)

| Data Source                                             | Classification | Rationale                                                     |
| ------------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| `data/ecosystem-v2/ecosystem-health-log.jsonl`          | DEV            | 8-dimension dev process health, scored A-F                    |
| `.claude/state/health-score-log.jsonl`                  | DEV            | 36-category session health scores, trend                      |
| `.claude/state/alerts-baseline.json`                    | DEV            | Current health baseline for comparison                        |
| `data/ecosystem-v2/warnings.jsonl`                      | DEV            | Active health warnings with category breakdown                |
| `docs/technical-debt/MASTER_DEBT.jsonl`                 | DEV            | 8,472 debt items, S0-S3 severity breakdown                    |
| `docs/technical-debt/metrics.json`                      | DEV            | Debt summary snapshot (counts by severity/status)             |
| `docs/technical-debt/logs/metrics-log.jsonl`            | DEV            | Debt trend over time (chartable)                              |
| `.claude/state/hook-runs.jsonl`                         | DEV            | Pre-commit/push compliance, per-check pass/fail/skip/auto-fix |
| `.claude/state/hook-warnings-log.jsonl`                 | DEV            | Active unacknowledged hook warnings                           |
| `.claude/state/commit-log.jsonl`                        | DEV            | Git activity timeline with session context                    |
| `.claude/state/reviews.jsonl` + `reviews-archive.jsonl` | DEV            | PR review history and trends                                  |
| `.claude/state/review-metrics.jsonl`                    | DEV            | Fix-rate, review rounds, fix_ratio per PR                     |
| `.claude/state/retros.jsonl`                            | DEV            | PR retrospectives, top wins/misses, pattern recurrence        |
| `.claude/state/velocity-log.jsonl`                      | DEV            | Session velocity (structural — currently broken extraction)   |
| `.claude/state/agent-invocations.jsonl`                 | DEV            | Agent activity feed by session                                |
| `.claude/state/lifecycle-scores.jsonl`                  | DEV            | System lifecycle health (capture/storage/recall/action)       |
| `.claude/state/forward-findings.jsonl`                  | DEV            | Active cross-PR forward findings (severity-tagged)            |
| `.claude/state/pr-review-state.json`                    | DEV            | Current PR review status                                      |
| `.claude/override-log.jsonl`                            | DEV            | Hook override audit (what bypasses occurred)                  |
| `data/ecosystem-v2/enforcement-manifest.jsonl`          | DEV            | Pattern enforcement coverage (eslint vs behavioral)           |
| `.research/research-index.jsonl`                        | DEV            | Research history and confidence distribution                  |
| Audit skill outputs (MASTER_DEBT downstream)            | DEV            | All audit findings flow into TDMS pipeline                    |
| Session lifecycle state files (handoff.json, etc.)      | DEV            | Current session context, in-progress tasks                    |

#### BOTH (Overlap Candidates)

| Data Source                        | Classification | Rationale                                                   |
| ---------------------------------- | -------------- | ----------------------------------------------------------- |
| Npm audit security vulnerabilities | BOTH           | Admin: exposed to users; Dev: dependency supply chain       |
| SonarCloud data                    | BOTH           | Code security affects live app (admin) + code quality (dev) |

#### NEITHER

| Data Source                                                                  | Classification | Rationale                                                            |
| ---------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `data/local-resources.ts`, `glossary.ts`, `slogans.ts`, `recovery-quotes.ts` | NEITHER        | App content, not metrics                                             |
| `.claude/state/task-*.state.json` files                                      | NEITHER        | Ephemeral per-task operational state                                 |
| TDMS pipeline intermediates (dedup-log.jsonl, normalized-all.jsonl, etc.)    | NEITHER        | Pipeline artifacts, not dashboard-ready                              |
| TDMS views (by-severity.md, etc.)                                            | NEITHER        | Pre-rendered for humans; dashboard should query MASTER_DEBT directly |

---

### 3. Overlap Analysis — Errors Tab is the Primary Conflict Zone [CONFIDENCE: HIGH]

Both panels have an "errors" tab. Their scopes are distinct but share a noun:

| Dimension        | Admin "Errors" (errors-tab.tsx)              | Dev "Errors" (dev-tabs.tsx placeholder)                                                     |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Data source      | Sentry via `httpsCallable`                   | `npm audit` security results + build errors (per OPERATIONAL_VISIBILITY_SPRINT.md line 126) |
| Error type       | Runtime application exceptions (user-facing) | Dependency vulnerabilities, build failures, pattern violations                              |
| Audience concern | "Is the live app crashing for users?"        | "Is our dependency chain safe? Did the build break?"                                        |
| User impacted?   | Yes — actual user-facing errors              | No — developer pipeline concerns                                                            |
| Severity format  | Sentry level (info/warning/error/critical)   | npm audit severity (critical/high/medium/low)                                               |

**Resolution:** Keep both as separate tabs. The word "errors" collides but the
data does not. However, the label on the dev tab should be disambiguated:
consider "Deps" or "Security Scan" rather than "Errors" to prevent cognitive
confusion for users who work in both panels.

**Secondary overlap candidates:**

| Topic                  | Admin Treatment                                  | Dev Treatment                                 | Overlap Risk                                                |
| ---------------------- | ------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------- |
| Jobs (scheduled tasks) | Cloud Scheduler Firebase jobs (jobs-tab.tsx)     | No equivalent planned                         | LOW — Firebase jobs are app-maintenance, not build-pipeline |
| Logs                   | GCP Cloud Function execution logs (logs-tab.tsx) | No equivalent planned                         | LOW — GCP logs are runtime app logs, not dev process logs   |
| Analytics              | App user DAU/WAU/MAU (analytics-tab.tsx)         | No equivalent planned                         | NONE — completely different audiences                       |
| Performance            | No admin tab                                     | Lighthouse (lighthouse-tab.tsx, pending move) | MEDIUM during M1-M1.6 window only                           |

---

### 4. Migration Candidates — Current State [CONFIDENCE: HIGH]

#### From Dev to Admin (confirmed by D1 decision):

| Item           | Current Location                         | Target   | When      | Rationale                                                                              |
| -------------- | ---------------------------------------- | -------- | --------- | -------------------------------------------------------------------------------------- |
| Lighthouse tab | `/dev` (lighthouse-tab.tsx, implemented) | `/admin` | Post-M1.6 | D1: Lighthouse scores reflect app quality visible to users; admin-appropriate audience |

This is the only confirmed migration candidate. The decision is documented in
admin-audit.md (Session #243) and context decision D1.

#### Nothing should move from Admin to Dev:

No admin tab serves developer-process data. The admin panel's "system" tabs
(Errors, Logs, Jobs, Analytics, Dashboard) all serve the app-operator role —
monitoring live application health, not developer tooling health. No migration
from admin to dev is warranted.

#### New tabs that belong on Dev (not Admin):

All planned dev tabs (errors/security-scan, sessions, docs, overrides) plus
proposed additions (health, warnings) are properly dev-scoped. None were
incorrectly placed on admin.

---

### 5. Shared Infrastructure — What Both Panels Use [CONFIDENCE: HIGH]

#### Auth (identical pattern):

Both `app/admin/page.tsx` and `app/dev/page.tsx` implement identical auth flows:

- Same `DevState`/`AdminState` type:
  `"loading" | "mobile" | "login" | "not-admin" | "authenticated"`
- Same Firebase Auth: `signInWithPopup(GoogleAuthProvider)`,
  `onAuthStateChanged`
- Same admin claim check: `getIdTokenResult()` with `claims.admin === true`
- Same mobile block: `/iPhone|iPad|iPod|Android/i` regex,
  `window.innerWidth < 768`
- Same logout: `signOut(auth)`

**Implication:** The auth logic is ~80 lines of duplicated code between the two
pages. A shared `useAdminAuth()` hook or `AdminAuthGuard` component could
eliminate this duplication.

#### Layout differences (intentional):

| Aspect               | Admin                                                      | Dev                                             |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Layout file          | `app/admin/layout.tsx` (minimal div wrapper, `bg-gray-50`) | No layout file — self-contained                 |
| Tab state management | React Context (`AdminTabProvider` + `useAdminTabContext`)  | Local `useState` in dev-dashboard.tsx           |
| Refresh pattern      | `useTabRefresh` hook tied to `AdminTabId`                  | Not yet implemented (all tabs are placeholders) |
| Tab navigation       | `admin-tabs.tsx` (two-row: System + Content)               | `dev-tabs.tsx` (single-row)                     |

#### Shared utilities available to both:

- `@/lib/firebase` — Firebase app instance
- `@/lib/logger` — structured logging (used in lighthouse-tab.tsx)
- `@/lib/firestore-service` — Firestore data access (used in lighthouse-tab.tsx)
- `date-fns` — used in admin jobs/analytics tabs, available for dev
- `lucide-react` — icon library (used in admin; dev currently uses emoji
  strings)

#### What the Dev dashboard currently LACKS vs Admin:

1. **No tab context provider** — active tab state is local useState, not a
   shared context. When adding more tabs, a `DevTabProvider` pattern (parallel
   to `AdminTabProvider`) will be needed for the `useTabRefresh` equivalent.
2. **No `useTabRefresh` support** — the hook is hardcoded to `AdminTabId`. Dev
   tabs will need either: (a) a generic version of `useTabRefresh`, or (b) a
   parallel `useDevTabRefresh` hook.
3. **No layout wrapper** — dev page is self-contained. As it scales to ~8 tabs,
   extracting a `DevLayout` (parallel to `app/admin/layout.tsx`) will be needed.
4. **Emoji icons** — dev tabs use emoji strings (`🚀`, `🐛`, `📊`) while admin
   uses Lucide React components. The dev panel should standardize on Lucide for
   consistency and resizability.

---

### 6. Theme and UX Comparison [CONFIDENCE: HIGH]

#### Current theme differential (intentional and well-motivated):

| Aspect            | Admin Panel                                                  | Dev Dashboard                                      |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Background        | `bg-gray-50` (light)                                         | `bg-gray-900` (dark)                               |
| Accent color      | Amber (`amber-500`, `amber-100`, `amber-200`)                | Blue (`border-blue-500`, `text-blue-400`)          |
| Tab style         | Amber pill buttons with `bg-amber-500 text-white` for active | Blue underline border `border-b-2 border-blue-500` |
| Content cards     | White with amber borders                                     | Gray-800 with gray-700 borders                     |
| Typography accent | `text-amber-900/70` for secondary text                       | `text-gray-400` for secondary text                 |
| Header            | Implicit (in layout wrapper)                                 | Explicit header with title + "Admin Panel →" link  |

**The dark theme for dev is well-chosen** — developers working in
terminal/editor environments typically prefer dark interfaces; the amber/light
admin theme is appropriate for a content-management tool. The visual contrast
between panels also helps users orient themselves quickly ("I'm in the dev
dashboard, not admin").

#### Recommended theme enforcement for new dev tabs:

| Element                 | Recommended Spec                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Section cards           | `bg-gray-800 rounded-lg border border-gray-700` (matches lighthouse-tab.tsx)                 |
| Score/status indicators | Green/Yellow/Red using `*-900/30` backgrounds (matches `getScoreBg()` in lighthouse-tab.tsx) |
| Metric values           | `text-2xl font-bold` (matches `ScoreBadge` pattern)                                          |
| Table headers           | `text-gray-400 text-sm border-b border-gray-700`                                             |
| Links/actions           | `text-blue-400 hover:text-blue-300` (matches tab active color)                               |
| Error states            | `bg-red-900/30 border-red-700` (established in lighthouse-tab.tsx)                           |
| Loading states          | `text-gray-400` spinner text (established in lighthouse-tab.tsx)                             |

The lighthouse-tab.tsx file is the de facto **UX reference implementation** for
all new dev tabs. All new tabs should visually match it.

#### One UX concern: emoji in dev-tabs.tsx

The DevTabs navigation uses emoji (`🚀`, `🐛`, `📊`, `📄`, `⚠️`). While
intentional and informal, this creates inconsistency: the header section uses
emoji (`🛠️` in dev-dashboard.tsx line 34) but admin uses Lucide icons
consistently. If dev is intended as a professional tool, Lucide icons would
improve visual cohesion with the rest of the codebase.

---

## Sources

| #   | Path                                                               | Type                  | Trust | CRAAP | Date       |
| --- | ------------------------------------------------------------------ | --------------------- | ----- | ----- | ---------- |
| 1   | `components/admin/admin-tabs.tsx`                                  | codebase-ground-truth | HIGH  | 5/5   | 2026-03-22 |
| 2   | `components/admin/errors-tab.tsx`                                  | codebase-ground-truth | HIGH  | 5/5   | 2026-03-22 |
| 3   | `components/admin/dashboard-tab.tsx`                               | codebase-ground-truth | HIGH  | 5/5   | 2026-03-19 |
| 4   | `components/admin/analytics-tab.tsx`                               | codebase-ground-truth | HIGH  | 5/5   | 2026-03-19 |
| 5   | `components/admin/logs-tab.tsx`                                    | codebase-ground-truth | HIGH  | 5/5   | 2026-03-22 |
| 6   | `components/admin/jobs-tab.tsx`                                    | codebase-ground-truth | HIGH  | 5/5   | 2026-03-22 |
| 7   | `components/dev/dev-dashboard.tsx`                                 | codebase-ground-truth | HIGH  | 5/5   | 2026-03-15 |
| 8   | `components/dev/dev-tabs.tsx`                                      | codebase-ground-truth | HIGH  | 5/5   | 2026-03-15 |
| 9   | `components/dev/lighthouse-tab.tsx`                                | codebase-ground-truth | HIGH  | 5/5   | 2026-03-22 |
| 10  | `app/admin/page.tsx` + `layout.tsx`                                | codebase-ground-truth | HIGH  | 5/5   | current    |
| 11  | `app/dev/page.tsx`                                                 | codebase-ground-truth | HIGH  | 5/5   | current    |
| 12  | `lib/contexts/admin-tab-context.tsx`                               | codebase-ground-truth | HIGH  | 5/5   | current    |
| 13  | `lib/hooks/use-tab-refresh.ts`                                     | codebase-ground-truth | HIGH  | 5/5   | current    |
| 14  | `.research/dev-dashboard/findings/admin-audit.md`                  | prior-research        | HIGH  | 5/5   | 2026-03-27 |
| 15  | `.research/dev-dashboard/findings/SQ1a-1-audit-skills.md`          | prior-research        | HIGH  | 5/5   | 2026-03-29 |
| 16  | `.research/dev-dashboard/findings/SQ1a-3-operational-skills-am.md` | prior-research        | HIGH  | 5/5   | 2026-03-29 |
| 17  | `.research/dev-dashboard/findings/SQ1b-data-inventory.md`          | prior-research        | HIGH  | 5/5   | 2026-03-29 |
| 18  | `.research/dev-dashboard/findings/SQ1c-2-process-session-hooks.md` | prior-research        | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**None of substance.** The D4 boundary rule ("Admin = app + users; Dev = build
pipeline + dev process") is clean and supported by every data source. The only
word-level collision is the "Errors" tab label, but the underlying data scopes
do not overlap.

One minor tension: admin-audit.md (Session #243) noted "dev errors = npm audit
security results" as confirmed in OPERATIONAL_VISIBILITY_SPRINT.md. This is a
design decision, not a contradiction — the planned dev "Errors" tab has a scope
that deliberately excludes runtime app errors (which belong in admin). The
labels should be disambiguated in implementation to make this clear to users.

---

## Gaps

1. **Lighthouse post-M1.6 migration not yet implemented** — D1 specifies
   Lighthouse moves to admin, but there is no admin tab ID for it in
   `AdminTabId`, no admin-side component, and no migration plan in code. This is
   confirmed future work, not a gap in this research.

2. **Dev tab context provider design not decided** — The dev dashboard will need
   a context pattern for tab refresh (parallel to `AdminTabProvider`). Whether
   to create a generic shared context or a parallel dev-specific context has not
   been decided. This is architectural planning scope.

3. **`useTabRefresh` hardcoding** — The hook imports `AdminTabId` directly
   (`import { useAdminTabContext, type AdminTabId }`). It cannot be reused for
   dev tabs without modification. The fix is either generics or a separate hook
   — but the decision is not made.

4. **Npm audit / SonarCloud BOTH classification** — These two data sources
   appear legitimately relevant to both panels (security affects live app + code
   quality). Whether to show security vulnerability counts on admin, dev, or
   both was not specified in any reviewed decision.

5. **Dev dashboard layout file** — No `app/dev/layout.tsx` exists. As dev scales
   to 8+ tabs, extracting layout boilerplate may be needed. Not blocking but
   unaddressed.

---

## Serendipity

**Auth duplication is ~80 lines of identical code.** `app/admin/page.tsx` and
`app/dev/page.tsx` implement the exact same auth state machine with the exact
same types. A shared `useAdminAuth()` hook would eliminate this and reduce the
risk of the two implementations drifting. This wasn't asked in the sub-question
but is a concrete refactoring opportunity.

**`useTabRefresh` is tightly coupled to AdminTabId** — importing the admin
context type directly. If a `DevTabProvider` is created (which it should be for
refresh functionality), the hook will need to be made generic
(`useTabRefresh<T extends string>`). This is a small but non-trivial refactor
that will be needed before any dev tab needs auto-refresh.

**Dev dashboard has an "Admin Panel →" cross-link already.** `dev-dashboard.tsx`
line 38 includes `<a href="/admin" className="...">Admin Panel →</a>`. The
reverse link does not exist on admin. If both panels are peer tools for the same
user, a symmetric nav link from admin to dev would complete the relationship.

**The dark/light theme split is a natural session-context signal.** When a
developer is in the dark dev dashboard, they are in a "build mode" mindset. When
in the amber admin panel, they are in an "operator mode" mindset. This contrast
is worth preserving deliberately — it functions as ambient orientation for the
user.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived from direct filesystem inspection of live code and prior
research files. No training data used for any claim.
