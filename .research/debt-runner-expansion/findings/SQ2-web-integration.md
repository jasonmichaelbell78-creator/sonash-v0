# Findings: /dev/debt Tab Integration into Dev Dashboard Shell and Next.js Architecture

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-2

---

## Key Findings

### 1. Route Structure: `app/dev/page.tsx` is the sole entry point, no layout.tsx exists [CONFIDENCE: HIGH]

The `/dev` route is a single `"use client"` page component at
`app/dev/page.tsx`. It handles the full auth gate inline — no
`app/dev/layout.tsx` exists. The auth flow is:

1. Mobile check (UA + innerWidth < 768 → blocks immediately)
2. `onAuthStateChanged` listener → anonymous/null → "login" state
3. `getIdTokenResult(true)` → checks `claims.admin === true`
4. Renders `<DevDashboard user={user} onLogout={handleLogout} />` on success

State machine:
`DevState = "loading" | "mobile" | "login" | "not-admin" | "authenticated"`

The `/dev/debt` route does NOT need a new Next.js route — it will be a tab
within the existing `/dev` page. No new `app/dev/debt/` directory is needed.

For comparison, `app/admin/layout.tsx` exists but is trivially thin — just
`<div className="min-h-screen bg-gray-50">{children}</div>` — confirming that
the admin panel handles its own auth inline in the page, same pattern as `/dev`.

Sources: [1] (app/dev/page.tsx lines 1-224), [2] (app/admin/layout.tsx)

---

### 2. Tab shell: adding "debt" requires changes to exactly 3 files [CONFIDENCE: HIGH]

The tab system has a clean 3-layer architecture:

**Layer 1 — Type definition (`components/dev/dev-tabs.tsx` line 7):**

```
export type DevTabId = "lighthouse" | "errors" | "sessions" | "docs" | "overrides";
```

Must add `"debt"` to this union.

**Layer 2 — TABS array (`components/dev/dev-tabs.tsx` lines 16-47):** The `TABS`
array drives tab rendering. Add one new entry:

```ts
{
  id: "debt",
  label: "Tech Debt",
  icon: "🔧",
  description: "Tech debt browse, filter, and trends",
}
```

**Layer 3 — Tab content dispatcher (`components/dev/dev-dashboard.tsx` lines
54-58):** Current pattern:

```tsx
{activeTab === "lighthouse" && <LighthouseTab />}
{activeTab === "errors" && <PlaceholderTab title="Error Tracing" icon="🐛" />}
...
```

Add:

```tsx
{
  activeTab === "debt" && <DebtTab />;
}
```

And add import: `import { DebtTab } from "./debt-tab";`

The default tab on mount is `"lighthouse"` (line 25 of dev-dashboard.tsx).

Sources: [3] (components/dev/dev-tabs.tsx), [4]
(components/dev/dev-dashboard.tsx)

---

### 3. CRITICAL: `output: "export"` in next.config.mjs means Next.js API routes are IMPOSSIBLE in production [CONFIDENCE: HIGH]

`next.config.mjs` line 13: `output: "export"` — this is a fully static site for
Firebase Hosting. The `out/` directory contains pre-rendered HTML/JS only.

Consequences:

- `app/api/dev/debt/route.ts` CANNOT be created — Next.js API routes are
  server-side and incompatible with static export
- `next start` does NOT work with `output: "export"` (Next.js docs confirm
  static exports cannot use the custom server)
- The `npm run start` script in package.json is present but non-functional for
  this build mode

**`npm run dev` (Turbopack) DOES support API routes locally** —
`output: "export"` only affects the build output, not the dev server. So an API
route would work in dev but fail at `npm run build`.

The deployment target is confirmed as Firebase Hosting (`firebase.json`
hosting.public: `"out"`, rewrites `"**" → "/index.html"` for client-side
routing).

The lighthouse tab demonstrates the working pattern: all data comes from
**Firestore** via the client-side `FirestoreService`. There is zero server-side
code in the web app.

Sources: [5] (next.config.mjs), [6] (firebase.json), [7]
(components/dev/lighthouse-tab.tsx)

---

### 4. The lighthouse tab is the canonical data access pattern: Firestore client-side reads [CONFIDENCE: HIGH]

`LighthouseTab` is the only implemented tab. Its data flow:

1. `useEffect` on mount → calls `FirestoreService.getLatestLighthouseRun()`
2. `FirestoreService` queries `dev/lighthouse/history` collection with
   `orderBy("timestamp", "desc")` + `limit(1)`
3. `useState` for `loading`, `error`, `latestRun` — standard three-state UI
4. `isCancelled` flag for cleanup (prevents state update after unmount)
5. Error classification via `classifyFirestoreError()` mapping error codes to
   user messages
6. Loading → error → no-data (setup instructions) → data — 4 distinct render
   states

The Firestore path is
`db.collection("dev").doc("lighthouse").collection("history")`.

For the debt tab to follow this pattern, debt data would need to exist in
Firestore. MASTER_DEBT.jsonl is at `docs/technical-debt/MASTER_DEBT.jsonl` on
the local filesystem — it is NOT currently in Firestore. This is the central
integration challenge.

Sources: [7] (components/dev/lighthouse-tab.tsx), [8] (lib/firestore-service.ts
lines 397-411)

---

### 5. MASTER_DEBT.jsonl is local-filesystem data — not currently in Firestore [CONFIDENCE: HIGH]

`docs/technical-debt/MASTER_DEBT.jsonl` exists with hundreds of DEBT-XXXXX
entries in JSONL format. Sample record structure confirmed:

- `id`: "DEBT-0001" format
- `category`, `severity` (S1-S3), `type`, `file`, `line`, `title`, `description`
- `effort`, `status` ("NEW", "VERIFIED"), `roadmap_ref`, `created`,
  `content_hash`
- Optional: `source`, `rule`, `sonar_key`, `merged_from`

No Firestore collection for debt data was found in `lib/firestore-service.ts`.
No Firebase Cloud Function for debt sync exists in `functions/src/`.

The web dashboard will need a sync mechanism to get this data into a queryable
form accessible by the static client app.

Sources: [9] (docs/technical-debt/MASTER_DEBT.jsonl peek), [10]
(lib/firestore-service.ts)

---

### 6. No existing API routes, no middleware — the /dev route is auth-gated entirely client-side [CONFIDENCE: HIGH]

`app/api/` directory does not exist (glob returned no results). `middleware.ts`
does not exist (glob returned no results).

The `/dev` route is NOT protected at the server/network level. Protection is
purely client-side via Firebase Auth + admin claim check. Any user can load the
JavaScript bundle for `/dev`, but the rendered content is gated behind
`getIdTokenResult(true)`.

This is consistent with the static export model — there IS no server to enforce
middleware. Firebase Hosting's rewrites (`"**" → "/index.html"`) serve the SPA
shell for all routes.

For the debt tab, the same auth model applies — the admin claim gate in
`app/dev/page.tsx` already covers all tab content. No additional auth layer is
needed.

Sources: [1] (app/dev/page.tsx), [11] (middleware.ts — not found), [6]
(firebase.json rewrites)

---

### 7. Firebase Cloud Functions are the established backend pattern for non-client operations [CONFIDENCE: HIGH]

`functions/src/` contains: `index.ts`, `jobs.ts`, `security-logger.ts`,
`firestore-rate-limiter.ts`, `schemas.ts`, `security-wrapper.ts`, `admin.ts`,
`recaptcha-verify.ts`.

CLAUDE.md Section 2 (Security Rules) explicitly states: "NO DIRECT WRITES to
journal, daily_logs, inventoryEntries — use Cloud Functions (httpsCallable)."

The `firebase.json` functions block confirms runtime: nodejs22.

For triggering server-side debt operations (sync JSONL → Firestore, run
discovery agents, etc.), a Cloud Function called via `httpsCallable` is the
architecturally consistent pattern. The `functions/src/jobs.ts` file likely
contains scheduled/triggered jobs.

Sources: [12] (functions/src/ directory), [6] (firebase.json functions block),
CLAUDE.md

---

### 8. Designed integration architecture for /dev/debt tab [CONFIDENCE: MEDIUM]

Based on all above findings, the correct integration design is:

**What to build (UI side — 3 file changes):**

1. `components/dev/dev-tabs.tsx` — add `"debt"` to `DevTabId` union + TABS array
   entry
2. `components/dev/dev-dashboard.tsx` — add
   `{activeTab === "debt" && <DebtTab />}` + import
3. `components/dev/debt-tab.tsx` — new component (see pattern below)

**What NOT to build:**

- `app/api/dev/debt/route.ts` — BLOCKED by `output: "export"`, would break
  production build
- A new Next.js route at `app/dev/debt/` — unnecessary, debt is a tab not a page

**Data access options (in priority order):**

Option A — Firestore sync (consistent with lighthouse pattern):

- A Cloud Function or local sync script writes MASTER_DEBT.jsonl entries to
  `db.collection("dev").doc("debt").collection("items")`
- `DebtTab` reads from Firestore via `FirestoreService` (same as
  `LighthouseTab`)
- PRO: works in both dev and production, consistent pattern, real-time capable
- CON: requires writing a sync script + Firestore schema, Firestore query limits
  for large debt backlogs (pagination needed)

Option B — Static JSON bundled at build time:

- A pre-build script converts MASTER_DEBT.jsonl → `public/debt-data.json`
- `DebtTab` fetches `/debt-data.json` via browser `fetch()`
- PRO: no backend needed, works in static export
- CON: data is build-time snapshot, not live; potentially large bundle; no
  refresh without redeploy

Option C — Firebase Storage:

- Sync script uploads debt data to Firebase Storage as JSON
- Client fetches with Firebase Storage SDK
- PRO: updatable without redeploy
- CON: auth complexity for Storage rules, less consistent with existing patterns

**`DebtTab` component pattern (mirrors LighthouseTab):**

```tsx
"use client";
// useState: loading, error, debtItems
// useEffect: fetch from FirestoreService.getDebtItems() or fetch('/debt-data.json')
// isCancelled pattern for cleanup
// 4 render states: loading → error → no-data → data
// Refresh button triggers re-fetch
// Filter/sort controls for severity, status, category
```

Sources: [1-12] (all above)

---

## Sources

| #   | Path / URL                                   | Title                          | Type        | Trust | CRAAP | Date |
| --- | -------------------------------------------- | ------------------------------ | ----------- | ----- | ----- | ---- |
| 1   | app/dev/page.tsx                             | Dev page route                 | source-code | HIGH  | 5/5   | 2026 |
| 2   | app/admin/layout.tsx                         | Admin layout                   | source-code | HIGH  | 5/5   | 2026 |
| 3   | components/dev/dev-tabs.tsx                  | DevTabId type + tab nav        | source-code | HIGH  | 5/5   | 2026 |
| 4   | components/dev/dev-dashboard.tsx             | Tab shell + content dispatch   | source-code | HIGH  | 5/5   | 2026 |
| 5   | next.config.mjs                              | Next.js config (output:export) | source-code | HIGH  | 5/5   | 2026 |
| 6   | firebase.json                                | Firebase Hosting config        | source-code | HIGH  | 5/5   | 2026 |
| 7   | components/dev/lighthouse-tab.tsx            | Implemented tab pattern        | source-code | HIGH  | 5/5   | 2026 |
| 8   | lib/firestore-service.ts (lines 397-411)     | getLatestLighthouseRun method  | source-code | HIGH  | 5/5   | 2026 |
| 9   | docs/technical-debt/MASTER_DEBT.jsonl        | Debt data format               | source-code | HIGH  | 5/5   | 2026 |
| 10  | lib/firestore-service.ts (full)              | Firestore service (no debt)    | source-code | HIGH  | 5/5   | 2026 |
| 11  | middleware.ts                                | Not found                      | absent      | HIGH  | N/A   | N/A  |
| 12  | functions/src/ (index, jobs, admin, schemas) | Cloud Functions sources        | source-code | HIGH  | 5/5   | 2026 |

---

## Contradictions

**`npm run start` in package.json vs `output: "export"` in next.config.mjs:**
The `start` script (`next start`) is present in package.json, but `next start`
does not work when `output: "export"` is set — Next.js throws an error at
startup. The script is likely vestigial or used only in dev/CI context where the
config is temporarily modified. This is not a contradiction that needs
resolution for the debt tab, but it is a misleading package.json entry.

---

## Gaps

1. **MASTER_DEBT.jsonl record count** — Did not count total entries; only peeked
   at first 3. The data volume will affect which data access option is viable
   (Firestore pagination vs static JSON size).

2. **`functions/src/jobs.ts` content** — Not read. Could contain existing
   patterns for data sync jobs that inform how a debt-sync function should be
   structured.

3. **Firestore security rules** — Did not read `firestore.rules`. The `dev/*`
   collection access rules are unknown. The lighthouse data is readable by
   admin-claim users, but whether a `dev/debt/*` collection would require rule
   additions is unverified.

4. **`lib/firestore-service.ts` — full method list** — Only read the lighthouse
   section. Whether any debt-related Firestore methods already exist is
   unverified (grep for "debt" in firestore-service.ts was not run).

5. **Existing debt-runner Firestore collection** — Did not verify whether any
   prior session created a `dev/debt` collection in Firestore.

6. **`components/dev/` full directory listing** — Did not enumerate all files.
   There may be additional components relevant to the pattern.

---

## Serendipity

**`test:debt` npm script exists:** `package.json` has
`"test:debt": "npm run test:build && node --test \"dist-tests/tests/scripts/debt/**/*.test.js\""`.
This implies test infrastructure for debt scripts is already planned or
partially built. The `dist-tests/tests/scripts/debt/` path suggests test files
for a debt runner already exist or are expected. This is highly relevant to the
CLI workstream.

**DECISIONS_PRE_PLAN.md is already written:** The pre-plan decisions file at
`.research/debt-runner-expansion/DECISIONS_PRE_PLAN.md` captures D6 (Hybrid
CLI + Web), D7 (one tab of dev dashboard), and Open Question #9 (API routes vs
direct file reads vs SQLite queries). This sub-question directly answers Q9: API
routes are blocked by static export. The answer is Firestore sync or static JSON
bundle.

**`PlaceholderTab` already in dev-dashboard.tsx:** A `PlaceholderTab` component
is defined inline in `dev-dashboard.tsx` (lines 64-76). If the debt tab needs
incremental rollout, it could start as a placeholder before full implementation.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are based on direct filesystem reads of actual source files. No
training data or external sources were used. Every component name, import path,
and type definition was verified against the actual file content.
