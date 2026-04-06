<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Refactoring Audit — sonash-v0

**Date:** 2026-02-22 **Auditor:** refactoring-auditor agent **Scope:** app/,
components/, lib/, scripts/, hooks/

---

## 1. Executive Summary

| Severity      | Count  |
| ------------- | ------ |
| S0 (Critical) | 1      |
| S1 (High)     | 7      |
| S2 (Medium)   | 10     |
| S3 (Low)      | 6      |
| **Total**     | **24** |

The codebase is generally well-structured with clear architectural intent
(Repository pattern, Cloud Function security, rate limiting). The most
significant structural concerns are concentrated in the admin panel (god-file
components) and duplicated infrastructure patterns across all admin tabs.
Scripts in `scripts/` directory contain several very large files with disabled
complexity linting. The app/ and lib/ layers are notably cleaner.

---

## 2. Top Findings Table

| ID    | File                                                       | Issue                                                                                  | Severity | Effort |
| ----- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- | ------ |
| RF-01 | `components/admin/users-tab.tsx` (2093 lines)              | God file — manages 10+ distinct concerns                                               | S1       | E3     |
| RF-02 | `components/admin/errors-tab.tsx` (1095 lines)             | God file — too many responsibilities                                                   | S1       | E3     |
| RF-03 | 8 admin tab components                                     | Repeated `getFunctions()` + `httpsCallable` boilerplate (28 occurrences)               | S1       | E2     |
| RF-04 | `components/admin/links-tab.tsx` + `prayers-tab.tsx`       | Near-identical CRUD structure — ~90% code duplication                                  | S1       | E2     |
| RF-05 | `components/notebook/pages/resources-page.tsx` (969 lines) | Dead code: 3 underscore-prefixed unused functions                                      | S2       | E1     |
| RF-06 | `app/meetings/all/page.tsx` + `resources-page.tsx`         | `parseTime`/`parse12HourTime`/`parse24HourTime` duplicated verbatim                    | S2       | E1     |
| RF-07 | `components/widgets/meeting-countdown.tsx`                 | Placeholder widget with hardcoded "7:00 PM" — dead/stale feature                       | S1       | E1     |
| RF-08 | `components/widgets/daily-quote-card.tsx`                  | Duplicate of `notebook/features/daily-quote-card.tsx` — orphaned widget                | S2       | E1     |
| RF-09 | `lib/database/firestore-adapter.ts`                        | Unused abstraction layer — `database` export has zero consumers                        | S2       | E1     |
| RF-10 | `lib/firebase.ts`                                          | App Check commented out since "Dec 31" — stale commented code block                    | S2       | E1     |
| RF-11 | `scripts/check-pattern-compliance.js` (1917 lines)         | God script — `/* eslint-disable complexity */` suppressor present                      | S1       | E3     |
| RF-12 | `scripts/aggregate-audit-findings.js` (1953 lines)         | God script with 25+ functions, complexity suppressor absent but needed                 | S1       | E3     |
| RF-13 | `scripts/debt/intake-sonar-reliability.js` (2608 lines)    | Largest file in project — almost entirely raw data + `/* eslint-disable complexity */` | S2       | E2     |
| RF-14 | Admin tabs (10 files)                                      | Browser `confirm()` used for destructive actions — 10 occurrences                      | S2       | E2     |
| RF-15 | `components/admin/dashboard-tab.tsx` (1031 lines)          | 5 separate `getFunctions()` calls within same component file                           | S2       | E1     |
| RF-16 | `components/notebook/pages/today-page.tsx` (1138 lines)    | 42 hook calls — page does too much (data fetch, UI, save, timers, celebs)              | S1       | E3     |
| RF-17 | `components/notebook/pages/resources-page.tsx`             | `isSameDay` reimplemented locally; date-fns exports this function                      | S3       | E0     |
| RF-18 | `components/admin/users-tab.tsx`                           | `eslint-disable react-hooks/exhaustive-deps` suppressor without fix                    | S3       | E1     |
| RF-19 | `lib/utils/errors.ts` + `lib/utils/callable-errors.ts`     | Two parallel error-handling utilities; `errors.ts` consumed only by `storage.ts`       | S3       | E2     |
| RF-20 | `components/growth/Step1WorksheetCard.tsx` (848 lines)     | Data-heavy component — question data embedded in component file                        | S2       | E2     |
| RF-21 | All admin tab fetch functions                              | State setters passed as function arguments instead of using hooks                      | S2       | E2     |
| RF-22 | `app/meetings/all/page.tsx`                                | `parseInt` x4 instead of `Number.parseInt` (SonarCloud flags)                          | S3       | E0     |
| RF-23 | `components/notebook/pages/today-page.tsx`                 | Debug `console.log("💾 Attempting to save:")` in dev guard — not removed               | S3       | E0     |
| RF-24 | `lib/firebase.ts`                                          | `_appCheck` module-level variable typed but always `undefined` in runtime              | S3       | E1     |

---

## 3. Detailed Findings (Grouped by Severity)

### S0 — Critical

No S0 issues found. Security architecture (no direct Firestore writes, Cloud
Functions, App Check design) is properly observed.

---

### S1 — High

#### RF-01: users-tab.tsx — God File (2093 lines)

**File:** `components/admin/users-tab.tsx` **Lines:** 2093

The component manages: user search, pagination, sort, user detail panel,
disable/enable flow, soft-delete flow, privilege management, password reset, tab
content rendering. It exports a single component but contains:

- 4 private custom hooks (`usePasswordResetTimeout`, `useEscapeKeyHandler`,
  `useDeleteDialogSafety`, `useSearchModeClear`)
- 10+ standalone API functions (`fetchUsersList`, `searchUsersApi`,
  `fetchUserDetailApi`, etc.)
- 8+ sub-components (`SortButton`, `UserStatusBadge`, etc.)
- 46 React hook calls in the main component

**Recommendation:** Extract sub-hooks to `lib/hooks/use-user-management.ts`.
Extract sub-components to separate files under `components/admin/users/`. The
API functions are already well-extracted; move them to a service or dedicated
API module.

**Effort:** E3 (large)

---

#### RF-02: errors-tab.tsx — God File (1095 lines)

**File:** `components/admin/errors-tab.tsx` **Lines:** 1095

Manages: Sentry issue listing, error-user correlation, Cloud Logging query
builder, export (CSV/clipboard), knowledge base lookups. Three very different
concerns in one component.

**Recommendation:** Split into `ErrorsOverviewTab`, `UserCorrelationPanel`,
`LogsQueryBuilder`, coordinated by a parent `ErrorsTab` container.

**Effort:** E3

---

#### RF-03: Repeated getFunctions() Boilerplate — 28 Occurrences

**Files:** All 8 admin tab components + `admin-crud-table.tsx`

Every admin API call follows this pattern:

```js
const functions = getFunctions();
const fn = httpsCallable<InputType, OutputType>(functions, "functionName");
const result = await fn(payload);
return result.data;
```

This pattern repeats **28 times** across the admin layer. There is no shared
wrapper.

**Recommendation:** Create `lib/utils/admin-caller.ts` with a typed
`callAdminFunction<TInput, TOutput>(name, payload)` helper. This aligns with the
existing `lib/utils/secure-caller.ts` pattern used for non-admin functions.

**Effort:** E2

---

#### RF-04: links-tab.tsx and prayers-tab.tsx — Near-Duplicate CRUD

**Files:** `components/admin/links-tab.tsx` (344 lines),
`components/admin/prayers-tab.tsx` (323 lines)

Both files implement the same CRUD pattern: load items, dialog for create/edit,
inline delete with `confirm()`, toggle active status. The structure is ~90%
identical with different entity names and field names. They even share identical
import lists.

**Recommendation:** Create a generic `admin-content-tab.tsx` HOC or a
`useAdminCrud` hook parameterized by entity config. The existing
`admin-crud-table.tsx` is a partial solution but is not being used by these two
tabs.

**Effort:** E2

---

#### RF-07: meeting-countdown.tsx — Placeholder/Dead Widget

**File:** `components/widgets/meeting-countdown.tsx` **Lines:** 90

The component has a comment: "Placeholder: Calculate time until 7:00 PM today."
It hardcodes "Evening AA • Downtown" and has no real data integration. It is
**not imported anywhere** in the active codebase (only
`compact-meeting-countdown.tsx` is used via `today-page.tsx`).

**Recommendation:** Delete this file. It is dead code with a stale placeholder
that will never match reality.

**Effort:** E1

---

#### RF-11: check-pattern-compliance.js — God Script (1917 lines)

**File:** `scripts/check-pattern-compliance.js` **Lines:** 1917

Has `/* eslint-disable complexity */` at the top. Contains 15 major functions
plus the pattern database (100+ patterns as inline objects). The pattern data,
file scanning logic, reporting logic, and graduation/warning system are all
co-located.

**Recommendation:** Extract pattern definitions to
`scripts/config/anti-patterns.json`. Extract reporting to
`scripts/lib/pattern-reporter.js`. Extract graduation logic to
`scripts/lib/graduation-tracker.js`.

**Effort:** E3

---

#### RF-12: aggregate-audit-findings.js — God Script (1953 lines)

**File:** `scripts/aggregate-audit-findings.js` **Lines:** 1953

Contains 25+ functions including: parsing, normalization, deduplication
(Levenshtein distance), priority scoring, PR bucket assignment,
cross-referencing, and output generation. No explicit complexity suppressor but
several functions exceed 50 lines.

**Recommendation:** Split into pipeline stages: `parse-sources.js`,
`normalize-findings.js`, `dedup-findings.js`, `score-findings.js`,
`generate-reports.js`, coordinated by a thin `aggregate-audit-findings.js`
orchestrator.

**Effort:** E3

---

#### RF-16: today-page.tsx — Page Does Too Much (1138 lines, 42 hooks)

**File:** `components/notebook/pages/today-page.tsx` **Lines:** 1138

The page manages: clean time display, weekly stats fetch, mood tracking,
cravings/used check-in, journal text entry, HALT check, autosave scheduling with
two separate timers, journal entry creation, smart prompts display, celebration
triggers, local storage sync, and scroll behavior. It uses 42 React hook calls.

Sub-components are partially extracted (`SmartPromptsSection`,
`CheckInQuestion`, `ToggleButton`) but the main `TodayPage` component function
still handles too much.

**Recommendation:**

- Extract `useCheckIn` hook for mood/cravings/used state
- Extract `useJournalAutosave` hook for save scheduling
- Extract `useWeeklyStats` hook for data fetching
- The `fetchWeeklyStats` async function at module level queries Firestore
  directly instead of via `FirestoreService` (violates architecture rule)

**Effort:** E3

---

### S2 — Medium

#### RF-05: resources-page.tsx — Dead Code (3 Unused Functions)

**File:** `components/notebook/pages/resources-page.tsx` lines 596, 796, 827

Three underscore-prefixed symbols are defined but never called:

- `_loadMoreMeetings` (line 596) — pagination callback, never wired to UI
- `_availableNeighborhoods` (line 796) — computed but never rendered
- `_handleTimeJump` (line 827) — time-jump handler, never attached

**Recommendation:** Remove all three. The neighborhood filter UI appears to use
a different implementation.

**Effort:** E1

---

#### RF-06: parseTime Duplicated Between Two Files

**Files:** `app/meetings/all/page.tsx` (lines 214–247),
`components/notebook/pages/resources-page.tsx` (lines 52–73)

Both files implement `parseTime`, `parse12HourTime`, `parse24HourTime` with
identical logic (minor signature difference: one returns `number | null`, the
other `number`).

**Recommendation:** Move to `lib/utils/time-utils.ts` and import from both
files.

**Effort:** E1

---

#### RF-08: Duplicate DailyQuoteCard Component

**Files:** `components/widgets/daily-quote-card.tsx`,
`components/notebook/features/daily-quote-card.tsx`

Both use `useDailyQuote` hook and render a quote card. The `widgets/` version is
not imported anywhere active. The `notebook/features/` version is the live one
(used in `today-page.tsx`).

**Recommendation:** Delete `components/widgets/daily-quote-card.tsx`. Both names
are `DailyQuoteCard`, risking import confusion.

**Effort:** E1

---

#### RF-09: lib/database — Unused Abstraction Layer

**Files:** `lib/database/firestore-adapter.ts`,
`lib/database/database-interface.ts`

The `database` export (a `FirestoreAdapter` instance implementing
`IDatabaseWithRealtime`) has **zero consumers** in the codebase. All code
accesses `FirestoreService` directly.

**Recommendation:** Either wire `database` as the primary access point (aligning
with the adapter pattern intent) or delete these files. Currently they add ~188
lines of unused indirection.

**Effort:** E1

---

#### RF-10: lib/firebase.ts — Stale Commented-Out App Check Block

**File:** `lib/firebase.ts` lines 57–90

A large block of App Check initialization code is commented out with the note
"Will re-enable after throttle clears (Dec 31, ~01:02 UTC)." The comment is from
December (2+ months old). The `_appCheck` variable is still declared and typed
but is always `undefined`.

**Recommendation:** If App Check will be re-enabled, move the code to a separate
`lib/app-check.ts` module and import conditionally. If abandoned, delete the
dead code.

**Effort:** E1

---

#### RF-13: intake-sonar-reliability.js — Data Embedded in Script (2608 lines)

**File:** `scripts/debt/intake-sonar-reliability.js`

Over 2000 lines are a raw JavaScript array literal (`RAW_ISSUES`) containing 295
SonarCloud issue objects. The script has `/* eslint-disable complexity */`. The
data should be in a JSON or JSONL file; the script should be a small processor.

**Recommendation:** Extract `RAW_ISSUES` to
`scripts/debt/data/sonar-reliability-issues.json` and reduce the script to ~50
lines of processing logic.

**Effort:** E2

---

#### RF-14: Browser confirm() for Destructive Actions — 10 Occurrences

**Files:** Multiple admin components

10 uses of `window.confirm()` / `confirm()` for destructive operations (delete
user, disable user, clear rate limit, reset data, etc.). Browser dialogs are
non-styleable, block the UI thread, and are disabled in some embedded contexts.

**Recommendation:** Replace with a reusable `ConfirmationDialog` component (a
modal). The codebase already has `components/ui/dialog.tsx` — a wrapper takes
~30 lines.

**Effort:** E2

---

#### RF-20: Step1WorksheetCard.tsx — Data Embedded in Component (848 lines)

**File:** `components/growth/Step1WorksheetCard.tsx`

The `FORM_SECTIONS` constant (lines 124–480) is a 356-line configuration array
embedded in the component file. It contains all 14+ question configs. The actual
rendering logic starts at line 486.

**Recommendation:** Extract `FORM_SECTIONS` to
`components/growth/step1-worksheet-config.ts`. This is a pure data structure
with no React dependencies.

**Effort:** E2

---

#### RF-21: State Setters as Function Arguments (Anti-Pattern)

**File:** `components/admin/dashboard-tab.tsx` lines 720–818

Multiple extracted async functions (`fetchStorageStats`, `fetchRateLimits`,
`fetchCollectionStats`, `clearRateLimitApi`) accept React state setters as
function arguments:

```js
async function fetchStorageStats(
  setLoadingStorage: (v: boolean) => void,
  setStorageError: (v: string | null) => void,
  setStorageStats: (v: StorageStats) => void
) { ... }
```

This is an inversion of the proper pattern — the setters should live in the
component and the async function should return data.

**Recommendation:** Convert to data-returning async functions and call setters
in the component's `useCallback`. Alternatively, extract to a custom hook per
data section.

**Effort:** E2

---

### S3 — Low

#### RF-17: Local isSameDay Reimplementation

**File:** `components/notebook/pages/resources-page.tsx` line 78

```ts
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() && ...
}
```

`date-fns` exports `isSameDay` which does the same thing. The file already
imports from `date-fns`.

**Recommendation:** Remove local implementation, import from `date-fns`.

**Effort:** E0

---

#### RF-18: eslint-disable exhaustive-deps Without Root Cause Fix

**File:** `components/admin/users-tab.tsx` line 353

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedUid]);
```

The `closeDeleteDialog` dependency is intentionally omitted because including it
caused bugs. This should be fixed by wrapping `closeDeleteDialog` in
`useCallback` with stable identity.

**Effort:** E1

---

#### RF-19: Parallel Error Utility Modules

**Files:** `lib/utils/errors.ts`, `lib/utils/callable-errors.ts`

`errors.ts` exports `isFirebaseError`, `getErrorMessage`,
`getFirebaseErrorMessage`. `callable-errors.ts` exports `isCloudFunctionError`,
`getCloudFunctionErrorMessage`. Both serve similar purposes. `errors.ts` is
consumed only by `lib/utils/storage.ts`.

**Recommendation:** Consider merging into a single `lib/utils/error-utils.ts`.
Not urgent but creates confusion.

**Effort:** E2

---

#### RF-22: parseInt vs Number.parseInt

**File:** `app/meetings/all/page.tsx` lines 222–240

Four occurrences of bare `parseInt()` flagged by SonarCloud. Should be
`Number.parseInt()` per project coding standards.

**Effort:** E0

---

#### RF-23: Debug console.log in Development Guard

**File:** `components/notebook/pages/today-page.tsx` line 639

```ts
if (process.env.NODE_ENV === "development") {
  console.log("💾 Attempting to save:", saveData);
}
```

The `dev` guard prevents production leakage but this log serves no purpose
beyond early debugging. The production logger (`logger.info`) is used 3 lines
earlier and is sufficient.

**Effort:** E0

---

#### RF-24: \_appCheck Always Undefined

**File:** `lib/firebase.ts` line 40

`let _appCheck: AppCheck | undefined;` is declared and included in
`getFirebase()` return but App Check initialization is commented out, so it is
always `undefined`. Code consuming `appCheck` from `getFirebase()` silently gets
`undefined`.

**Effort:** E1

---

## 4. Complexity Hotspots (Top 10 Most Complex Files)

Ranked by lines + commit frequency (churn) + hook/function count:

| Rank | File                                           | Lines | Commits (90d) | Hook Calls | Notes                             |
| ---- | ---------------------------------------------- | ----- | ------------- | ---------- | --------------------------------- |
| 1    | `scripts/check-pattern-compliance.js`          | 1917  | 125           | —          | Highest churn in project          |
| 2    | `components/notebook/pages/today-page.tsx`     | 1138  | 75            | 42         | Most hooks per component          |
| 3    | `components/admin/users-tab.tsx`               | 2093  | 24            | 46         | Largest component file            |
| 4    | `components/admin/errors-tab.tsx`              | 1095  | 28            | —          | Multi-concern admin tab           |
| 5    | `scripts/aggregate-audit-findings.js`          | 1953  | 35            | —          | 25+ functions, complex dedup      |
| 6    | `lib/firestore-service.ts`                     | 476   | 47            | —          | High churn for its size           |
| 7    | `components/notebook/pages/resources-page.tsx` | 969   | 34            | —          | Dead code + parsing duplication   |
| 8    | `components/admin/dashboard-tab.tsx`           | 1031  | 11            | —          | State-setter anti-pattern         |
| 9    | `scripts/debt/intake-sonar-reliability.js`     | 2608  | 7             | —          | Data embedded in script           |
| 10   | `components/growth/Step1WorksheetCard.tsx`     | 848   | 18            | —          | Config data embedded in component |

**Churn note:** `scripts/check-pattern-compliance.js` with 125 commits in 90
days is the most actively changing file in the project. This is a strong signal
it needs structural stability improvements.

---

## 5. Recommendations

### Immediate Actions (E0/E1, minimal risk)

1. **Delete dead code:** Remove `components/widgets/meeting-countdown.tsx`,
   `components/widgets/daily-quote-card.tsx`, and the 3 underscore-prefixed dead
   functions in `resources-page.tsx`.
2. **Extract parseTime to shared utility:** `lib/utils/time-utils.ts` — 2
   consumers, zero risk.
3. **Remove or resolve stale App Check comment block** in `lib/firebase.ts`.
4. **Fix 4x `parseInt` → `Number.parseInt`** in `app/meetings/all/page.tsx`.
5. **Replace `isSameDay`** local implementation with `date-fns` import.

### Short-Term (E2, medium risk)

6. **Create `callAdminFunction` helper** to eliminate 28 instances of
   `getFunctions()` + `httpsCallable` boilerplate.
7. **Merge links-tab and prayers-tab** into a generic `AdminContentTab`
   parameterized by entity config.
8. **Replace `confirm()` dialogs** with a reusable `ConfirmationDialog`
   component.
9. **Extract Step1WorksheetCard config data** to `step1-worksheet-config.ts`.
10. **Refactor dashboard-tab fetch functions** to return data (not accept
    setters).

### Longer-Term (E3, requires planning)

11. **Decompose users-tab.tsx** — extract sub-hooks and sub-components into
    dedicated files.
12. **Decompose today-page.tsx** — extract `useCheckIn`, `useJournalAutosave`,
    `useWeeklyStats` hooks.
13. **Split check-pattern-compliance.js** — extract pattern definitions,
    reporter, and graduation tracker.
14. **Pipeline-ify aggregate-audit-findings.js** — split into 5 focused stage
    scripts.

### Architecture Observations

- The Repository pattern in `lib/firestore-service.ts` is well-implemented; the
  `lib/database/` adapter layer is a duplicate that should be connected or
  removed.
- Error handling is consolidated well in `lib/utils/callable-errors.ts` — extend
  this pattern to admin tab error handling to reduce `try/catch` boilerplate.
- The admin panel follows a consistent tab structure but each tab reinvents
  loading/error state management. A `useAdminTabData` hook template would
  eliminate ~56 repeated loading state pairs.

---

_Report generated: 2026-02-22 | Auditor: refactoring-auditor agent_
