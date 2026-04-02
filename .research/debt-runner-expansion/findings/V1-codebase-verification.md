# V1 Codebase Verification — debt-runner Expansion Research Claims

**Verified by:** Verification Agent  
**Date:** 2026-03-27  
**Source report:** `.research/debt-runner-expansion/RESEARCH_OUTPUT.md`  
**Method:** Direct filesystem reads against actual source files

---

## Summary

14 claims verified. 12 VERIFIED, 2 PARTIAL (correct finding, wrong location).

---

## Claim-by-Claim Results

### Claim 1: DevTabId type has exactly 5 members (lighthouse, errors, sessions, docs, overrides)

**VERIFIED**  
File: `/components/dev/dev-tabs.tsx`, line 7

```
export type DevTabId = "lighthouse" | "errors" | "sessions" | "docs" | "overrides";
```

Exactly 5 members in that exact order. The `TABS` array at lines 16–47 confirms
each member has a corresponding entry.

---

### Claim 2: `output: "export"` is set in next.config

**VERIFIED**  
File: `/next.config.mjs`, line 13

```
output: "export", // Required for Firebase Hosting static deployment
```

File is `next.config.mjs` (not `.ts`). The research report correctly cited
`next.config.mjs line 13`.

---

### Claim 3: PlaceholderTab component exists in dev-dashboard.tsx

**VERIFIED**  
File: `/components/dev/dev-dashboard.tsx`, lines 65–76

```tsx
function PlaceholderTab({ title, icon }: Readonly<{ title: string; icon: string }>) {
```

It is a local (non-exported) function defined at the bottom of the file. Used
for `errors`, `sessions`, `docs`, and `overrides` tabs (lines 55–58).

---

### Claim 4: cmdk is installed

**VERIFIED**  
File: `/package.json`, line 147 (dependencies)

```
"cmdk": "^1.1.1",
```

---

### Claim 5: react-day-picker is installed

**VERIFIED**  
File: `/package.json`, line 157 (dependencies)

```
"react-day-picker": "^9.14.0",
```

---

### Claim 6: Chart CSS variables (--chart-1 through --chart-5) exist

**VERIFIED**  
File: `/app/globals.css`

Light mode (`:root`, lines 26–30):

```css
--chart-1: oklch(0.646 0.222 41.116);
--chart-2: oklch(0.6 0.118 184.704);
--chart-3: oklch(0.398 0.07 227.392);
--chart-4: oklch(0.828 0.189 84.429);
--chart-5: oklch(0.769 0.188 70.08);
```

Dark mode (`.dark`, lines 88–92) also defines all 5 variables with different
values. They are also aliased in `@theme inline` at lines 147–151.

Note: The research report referenced "shadcn/ui chart" as the source. The
variables exist and follow the shadcn/ui naming convention, but are defined
directly in `globals.css` — no separate shadcn chart component file was checked,
as the variables themselves are confirmed present.

---

### Claim 7: useTabRefresh hook exists — search in components/dev/

**PARTIAL — VERIFIED (wrong location)**  
The hook exists but is NOT in `components/dev/`. It lives at:  
`/lib/hooks/use-tab-refresh.ts`, lines 36–77

It is tied to `AdminTabId` from `lib/contexts/admin-tab-context`, not
`DevTabId`. It is used exclusively by admin panel tabs (`components/admin/*`) —
confirmed by grep showing 10 admin component files as the only consumers.

No `useTabRefresh` reference exists anywhere in `components/dev/`. If the
research report implied this hook is available to or used by the Dev Dashboard,
that is inaccurate. The Dev Dashboard would need its own refresh mechanism or
the hook would need to be generalized to accept `DevTabId`.

---

### Claim 8: sonner is used for toasts

**VERIFIED**  
File: `/package.json`, line 162 (dependencies)

```
"sonner": "^2.0.7",
```

---

### Claim 9: Clipboard patterns exist in lib/utils/error-export.ts

**VERIFIED**  
File: `/lib/utils/error-export.ts`, lines 300–326

Two clipboard patterns are present:

- `navigator.clipboard.writeText(json)` (modern API) at line 306
- `document.execCommand("copy")` fallback for older browsers at lines 312–321

The function `copyErrorExportToClipboard` (line 300) implements both.

---

### Claim 10: Firebase Hosting is the deployment target

**VERIFIED**  
File: `/firebase.json`, lines 1–65

`hosting.public` is set to `"out"` (line 3), which is the Next.js static export
output directory produced by `output: "export"`. Security headers, `cleanUrls`,
and SPA rewrites (`**` → `/index.html`) are all configured. Cloud Functions are
also configured in `firebase.json` (lines 66–71) with `runtime: "nodejs22"`.

---

### Claim 11: Cloud Functions use httpsCallable pattern

**VERIFIED**  
Server-side (functions): `/functions/src/index.ts`, line 16 — all functions use
`onCall` from `firebase-functions/v2/https` (the server-side counterpart to
`httpsCallable`). Five `onCall` functions confirmed: `saveDailyLog` (line 77),
`saveJournalEntry` (line 163), `softDeleteJournalEntry` (line 262),
`saveInventoryEntry` (line 356), `migrateAnonymousUserData` (line 487).

Client-side (lib): `/lib/firestore-service.ts` calls `httpsCallable` at lines
189, 472, 527. `/lib/auth/account-linking.ts` calls it at lines 210, 335.

---

### Claim 12: Admin auth gate uses Google OAuth + admin claim

**VERIFIED**  
File: `/app/dev/page.tsx`

- Google OAuth: `GoogleAuthProvider` + `signInWithPopup` at lines 20 and 94
- Admin claim check: `tokenResult.claims.admin === true` at line 68, after
  `getIdTokenResult(true)` force-refresh at line 64

The Dev Dashboard page (`/app/dev/page.tsx`) mirrors the admin panel auth
pattern exactly, per the comment at line 61:
`// Verify admin claim (same as admin panel - devs are admins)`.

---

### Claim 13: better-sqlite3 is NOT in package.json

**VERIFIED — ABSENT**  
Grepped `/package.json` for `better-sqlite3` and `sqlite`. No matches found in
either `dependencies` or `devDependencies`. The research report's Option A
architecture (using better-sqlite3 for the CLI path) refers to a proposed
addition, not a currently installed package.

---

### Claim 14: No charting libraries installed

**VERIFIED — ABSENT**  
Grepped `/package.json` for: `recharts`, `chart.js`, `chartjs`, `d3`, `victory`,
`nivo`, `visx`, `tremor`, `apexcharts`, `highcharts`, `echarts`. No matches
found in any dependency section.

The `--chart-1` through `--chart-5` CSS variables (Claim 6) are present and
ready, but no charting library is installed to consume them. The research
report's recommendation to use Recharts (via shadcn/ui chart) refers to a
package that would need to be added.

---

## Cross-Claim Notes

1. **useTabRefresh location mismatch (Claim 7):** The hook is scoped to
   `AdminTabId`, not `DevTabId`. Any debt dashboard tab that wants
   refresh-on-activation behavior will either need the hook generalized or a new
   `DevTabId`-aware variant created.

2. **better-sqlite3 absence (Claim 13) confirms Option A is a proposal:** The
   entire CLI SQLite path described in the research report (`sync-to-sqlite.js`,
   `data/tdms.db`, `build-debt-data.js`) does not yet exist in the codebase.
   These are design targets, not current implementations.

3. **No charting library (Claim 14) confirms web work is greenfield:** The chart
   CSS variables are ready infrastructure from shadcn/ui setup, but the Recharts
   dependency must be added before any chart component can be built.

---

## Confidence

HIGH on all 14 claims. Each was verified by direct file read or grep against the
actual filesystem. No assumptions made from documentation or conversation
history.
