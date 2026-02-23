<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Code Quality Audit Report — sonash-v0

**Date:** 2026-02-22 **Auditor:** code-auditor agent (claude-sonnet-4-6)
**Scope:** `app/`, `components/`, `lib/`, `types/` **Stack:** Next.js 16.1.1,
React 19.2.3, Firebase 12.6.0, TypeScript strict, Tailwind 4.1.9

---

## 1. Executive Summary

| Severity      | Count  |
| ------------- | ------ |
| S0 (Critical) | 1      |
| S1 (High)     | 5      |
| S2 (Medium)   | 9      |
| S3 (Low)      | 7      |
| **Total**     | **22** |

Overall code quality is **good**. The codebase follows consistent patterns, has
proper error boundaries, and uses Cloud Functions correctly for write
operations. The main concerns are: Firebase App Check is disabled (S0),
TodayPage has excessive state complexity (S1), and `useAuth()` is used 14 times
despite being marked `@deprecated` (S1).

---

## 2. Top Findings Table

| Rank | ID     | Severity | Effort | File:Line                                              | Description                                                                                                           |
| ---- | ------ | -------- | ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1    | CQ-001 | S0       | E2     | `lib/firebase.ts:57`                                   | Firebase App Check is disabled (commented out), removing bot/abuse protection from all Cloud Functions                |
| 2    | CQ-002 | S1       | E2     | `components/notebook/pages/today-page.tsx:258`         | Excessive component state: 11 `useState` + 8 `useRef` in a single 1,139-line component                                |
| 3    | CQ-003 | S1       | E2     | Multiple (14 files)                                    | Deprecated `useAuth()` hook used 14 times; preferred focused hooks (`useAuthCore`, `useProfile`, `useDailyLog`) exist |
| 4    | CQ-004 | S1       | E1     | `components/notebook/pages/today-page.tsx:533`         | Explicit `any` type: `handleSnapshotUpdate(docSnap: any, ...)` — should be `DocumentSnapshot`                         |
| 5    | CQ-005 | S1       | E1     | `components/notebook/pages/resources-page.tsx:684`     | Deprecated `MeetingsService.getAllMeetings()` called directly; paginated alternative exists                           |
| 6    | CQ-006 | S1       | E1     | `components/admin/admin-crud-table.tsx:146,188,221`    | `alert()` used for error feedback (3 occurrences) — should use `sonner` toast                                         |
| 7    | CQ-007 | S2       | E1     | `components/notebook/pages/today-page.tsx:605`         | `journalEntry` in `useEffect` deps array causes stale-closure risk / excessive re-subscriptions to Firestore          |
| 8    | CQ-008 | S2       | E1     | `components/growth/Step1WorksheetCard.tsx:595,664,671` | Triple `as unknown as Record<string, unknown>` cast—missing discriminated union type for entry `.data` field          |
| 9    | CQ-009 | S2       | E1     | `components/admin/users-tab.tsx:353`                   | `// eslint-disable-next-line react-hooks/exhaustive-deps` suppresses real missing dependency                          |
| 10   | CQ-010 | S2       | E1     | `components/growth/NightReviewCard.tsx:130`            | Bare `window.open(...)` — should use `globalThis` for SSR safety                                                      |
| 11   | CQ-011 | S2       | E2     | `app/layout.tsx:66`                                    | Stale comment artifact `// ... existing metadata ...` left in production layout                                       |
| 12   | CQ-012 | S2       | E1     | `components/widgets/meeting-countdown.tsx`             | `MeetingCountdown` component is dead code — hardcoded placeholder, replaced by `CompactMeetingCountdown`              |
| 13   | CQ-013 | S2       | E1     | `components/admin/jobs-tab.tsx:557,563`                | `alert()` used in admin jobs tab for success/error messages                                                           |
| 14   | CQ-014 | S2       | E1     | `lib/firestore-service.ts:405`                         | `saveNotebookJournalEntry` marked `// DEPRECATED` but still called from 3 live components                             |
| 15   | CQ-015 | S2       | E2     | `components/notebook/pages/today-page.tsx:291`         | `useAuth()` pulls combined context triggering re-renders on profile, dailyLog changes unrelated to component needs    |

---

## 3. Detailed Findings

### S0 — Critical

#### CQ-001 · Firebase App Check Disabled

**File:** `lib/firebase.ts:57-91`

The entire App Check initialization block is commented out with comment
`// TEMPORARILY DISABLED: App Check is disabled due to 24-hour throttle`. This
was intended as a temporary fix but has persisted. Without App Check, Cloud
Functions (`saveDailyLog`, `saveJournalEntry`, `saveInventoryEntry`) can be
called by any actor without any bot/abuse attestation. reCAPTCHA tokens are
still sent in payloads but App Check token is the server-side gate.

**Evidence:**

```typescript
// TEMPORARILY DISABLED: App Check is disabled due to 24-hour throttle
/* try {
  ...initializeAppCheck(_app, {...})
  ...
} */
```

**Risk:** Any unauthenticated bot can spam the Cloud Functions with arbitrary
payloads. Server-side rate limiting exists but App Check is the primary bot
defense layer.

**Fix:** Re-enable App Check initialization. Investigate the throttle issue in
Firebase console. Set debug tokens properly for dev/CI environments.

---

### S1 — High

#### CQ-002 · TodayPage: Excessive State Complexity

**File:** `components/notebook/pages/today-page.tsx:258-301`

`TodayPage` is a 1,139-line Client Component managing 11 `useState` calls and 8
`useRef` calls at the component top level. This makes the component difficult to
test, reason about, and maintain. The component mixes: clean time display,
weekly stats fetching, HALT check logic, auto-save debouncing, milestone
celebrations, mood check-in, smart prompts, and real-time Firestore sync.

**Evidence:**

```typescript
const [mood, setMood] = useState<string | null>(null);
const [cravings, setCravings] = useState<boolean | null>(null);
const [used, setUsed] = useState<boolean | null>(null);
const [journalEntry, setJournalEntry] = useState("");
const [isSaving, setIsSaving] = useState(false);
const [saveComplete, setSaveComplete] = useState(false);
const [hasTouched, setHasTouched] = useState(false);
const [weekStats, setWeekStats] = useState(...);
const [isLoading, setIsLoading] = useState(true);
const [showQuickMoodPrompt, setShowQuickMoodPrompt] = useState(false);
const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
const [haltCheck, setHaltCheck] = useState({...});
const [haltSubmitted, setHaltSubmitted] = useState(false);
// Plus 8 useRefs...
```

**Fix (E2):** Extract `useHaltCheck`, `useWeeklyStats`, `useMilestoneCheck`, and
`useAutoSave` custom hooks. Consider splitting the HALT section into
`HaltCheckSection` component.

---

#### CQ-003 · Widespread Use of Deprecated `useAuth()` Hook

**Files:** 14 component files

`useAuth()` is marked `@deprecated` in `auth-provider.tsx` with clear
instructions to use `useAuthCore()`, `useProfile()`, or `useDailyLog()`. Despite
this, 14 components still call the deprecated hook. Using `useAuth()` means
subscribing to the combined context which triggers re-renders whenever any of
the three child contexts update, even if the component only needs one.

**Files using deprecated `useAuth()`:**

- `components/growth/GratitudeCard.tsx:35`
- `components/growth/NightReviewCard.tsx:482`
- `components/growth/SpotCheckCard.tsx:30`
- `components/growth/Step1WorksheetCard.tsx:491`
- `components/home/home-client.tsx:21`
- `components/journal/journal-hub.tsx:25`
- `components/notebook/book-cover.tsx:169`
- `components/notebook/journal-modal.tsx:28`
- `components/notebook/notebook-shell.tsx:145`
- `components/notebook/pages/resources-page.tsx:574`
- `components/notebook/pages/today-page.tsx:291`
- `components/notebook/visualizations/mood-sparkline.tsx:10`
- `components/onboarding/onboarding-wizard.tsx:31`
- `components/status/auth-error-banner.tsx:13`

**Fix (E2):** Replace each with the focused hook that matches what the component
actually uses. Most components only need `user` from `useAuthCore()`.

---

#### CQ-004 · Explicit `any` Type: `docSnap: any`

**File:** `components/notebook/pages/today-page.tsx:533`

```typescript
const handleSnapshotUpdate = useCallback(
  (docSnap: any, isMounted: boolean) => {
```

`docSnap` should be typed as `DocumentSnapshot` from `firebase/firestore`. This
is already imported elsewhere in the codebase (e.g., `profile-context.tsx:12`).

**Fix (E0):** Change parameter type to `DocumentSnapshot`.

---

#### CQ-005 · Deprecated `getAllMeetings()` Still Called

**File:** `components/notebook/pages/resources-page.tsx:684`

The `triggerRefresh` function calls `MeetingsService.getAllMeetings()` which is
marked `@deprecated` (use `getAllMeetingsPaginated` instead). On large datasets
this fetches all documents without pagination.

```typescript
: await MeetingsService.getAllMeetings();  // DEPRECATED
```

**Fix (E1):** Replace with `getAllMeetingsPaginated` or redesign
`triggerRefresh` to use the existing paginated flow.

---

#### CQ-006 · `alert()` Used for Error Feedback in Admin CRUD

**File:** `components/admin/admin-crud-table.tsx:146,188,221`

Three `alert()` calls are used for validation errors and save/delete failures.
This is inconsistent with the rest of the app (which uses `sonner` toasts) and
blocks the UI thread.

```typescript
if (error) {
  alert(error); // Line 146: validation error
  return;
}
// ...
alert(`Failed to save ${config.entityName}. Please try again.`); // Line 188
alert(`Failed to delete ${config.entityName}. Please try again.`); // Line 221
```

**Fix (E1):** Replace all three with `toast.error(...)` from sonner.

---

### S2 — Medium

#### CQ-007 · `journalEntry` in Firestore Listener `useEffect` Deps

**File:** `components/notebook/pages/today-page.tsx:605`

The Firestore `onSnapshot` listener effect includes `journalEntry` in its
dependency array:

```typescript
}, [referenceDate, user, journalEntry, handleSnapshotUpdate]);
// journalEntry added for exhaustive-deps; isEditingRef handles collision avoidance
```

This means every keystroke in the textarea triggers a new Firestore subscription
(unsubscribes and resubscribes). The comment acknowledges this was added purely
to satisfy `exhaustive-deps` lint. This creates unnecessary Firestore reads.

**Fix (E1):** Store `journalEntry` in a ref for the snapshot callback, removing
it from the dep array.

---

#### CQ-008 · Triple `as unknown as Record<string, unknown>` in Step1WorksheetCard

**File:** `components/growth/Step1WorksheetCard.tsx:595,664,671`

Journal entry `.data` is typed as `Record<string, unknown>` at the service
layer, requiring unsafe double-cast when using typed data objects:

```typescript
data: data as unknown as Record<string, unknown>,
```

This appears three times. The root cause is the loose
`data: Record<string, unknown>` type in
`saveInventoryEntry`/`saveNotebookJournalEntry`.

**Fix (E1):** Create a discriminated union type for entry data payloads (e.g.,
`Step1WorksheetData | GratitudeData | ...`) and update service method signatures
to accept it.

---

#### CQ-009 · Suppressed `exhaustive-deps` in `useDeleteDialogSafety`

**File:** `components/admin/users-tab.tsx:353`

```typescript
useEffect(() => {
  if (deleteDialogStep > 0) closeDeleteDialog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedUid]);
```

`closeDeleteDialog` is missing from deps. It appears to be a stable callback but
the suppression hides whether this is actually safe. Should use `useCallback`
for `closeDeleteDialog` and include it explicitly.

---

#### CQ-010 · Bare `window.open()` Calls (SSR Safety)

**Files:**

- `components/growth/NightReviewCard.tsx:130`
- `components/meetings/meeting-details-dialog.tsx:100`
- `components/notebook/pages/resources-page.tsx:494`

All three files are `"use client"` components so SSR crashes won't occur at
runtime, but the pattern is inconsistent with the rest of the codebase which
uses `globalThis` for browser API access. If components ever move to shared code
paths, these will fail silently on server.

**Fix (E0):** Use `globalThis.window?.open(...)` or wrap in
`if (typeof window !== 'undefined')`.

---

#### CQ-011 · Stale Comment Artifact in Root Layout

**File:** `app/layout.tsx:66`

```typescript
// ... existing metadata ...
```

This is a code-generation artifact left in a production file. The metadata is
already defined above this line.

**Fix (E0):** Remove the comment.

---

#### CQ-012 · Dead Code: `MeetingCountdown` Widget

**File:** `components/widgets/meeting-countdown.tsx`

This component is a hardcoded placeholder ("Placeholder: Calculate time until
7:00 PM today") that has been superseded by `CompactMeetingCountdown` which uses
real Firestore data. The old component does not appear to be imported anywhere
in the current codebase.

**Fix (E0):** Delete `components/widgets/meeting-countdown.tsx` after confirming
zero imports.

---

#### CQ-013 · `alert()` Calls in Admin Jobs Tab

**File:** `components/admin/jobs-tab.tsx:557,563`

Two `alert()` calls: one for success messages and one for errors in the admin
job runner. Inconsistent with the rest of the app.

---

#### CQ-014 · Deprecated `saveNotebookJournalEntry` Still Active

**File:** `lib/firestore-service.ts:405`

The method comment says
`// DEPRECATED: Use hooks/use-journal.ts:addEntry instead` but it is actively
called in:

- `components/notebook/pages/today-page.tsx` (multiple calls)
- `components/notebook/journal-modal.tsx`

The deprecated method and the non-deprecated `addEntry` hook likely duplicate
Cloud Function calls. Until fully migrated, the deprecation note creates
confusion.

**Fix (E2):** Either remove the `@deprecated` marker until migration is
complete, or complete the migration to `addEntry`.

---

#### CQ-015 · `TodayPage` Uses Combined `useAuth()` Triggering Excess Re-renders

**File:** `components/notebook/pages/today-page.tsx:291`

```typescript
const { user, profile } = useAuth();
```

`TodayPage` is the primary rendering component. Using the combined `useAuth()`
means it re-renders whenever `todayLog`, `profileError`, `todayLogError`,
`showLinkPrompt`, or other composite state changes—even though it only uses
`user` and `profile`. This causes the entire 1,139-line component to re-render
unnecessarily.

**Fix (E1):** Replace with `useAuthCore()` for `user` and `useProfile()` for
`profile`.

---

### S3 — Low

#### CQ-016 · Array Index Keys in Static Lists (Skeleton Components)

**Files:** `components/ui/skeleton.tsx:39,54,98,104`;
`components/notebook/pages/today-page-skeleton.tsx:56`

Using array index as React `key` in
`[...Array(N)].map((_, i) => <Skeleton key={i} ...>)`. For static skeleton lists
with no reordering, this is harmless but technically an anti-pattern.

---

#### CQ-017 · HALT Section: `document.querySelectorAll` DOM Imperatives

**File:** `components/notebook/pages/today-page.tsx:224-228`

```typescript
const headings = Array.from(document.querySelectorAll("h2"));
const haltHeading = headings.find((h) => h.textContent?.includes("HALT Check"));
const haltSection = haltHeading?.parentElement;
if (haltSection) {
  haltSection.scrollIntoView({ behavior: "smooth", block: "center" });
}
```

This imperative DOM traversal is fragile (depends on heading text content) and
could break if the heading label changes. The existing `useScrollToSection` hook
provides a cleaner abstraction with `ref`-based targeting.

**Fix (E1):** Attach a `ref` to the HALT section and use `useScrollToSection`
with `type: "ref"`.

---

#### CQ-018 · `_checkInSteps` Prefixed Underscore Indicates Unused

**File:** `components/notebook/pages/today-page.tsx:332`

```typescript
const _checkInSteps = useMemo(() => {...}, [mood, cravings, used, haltCheck, haltSubmitted]);
```

The underscore prefix conventionally signals an unused variable. This `useMemo`
runs on every relevant state change but the result is never consumed in JSX. The
`CheckInProgress` component import exists but is not rendered.

**Fix (E0):** Either render `_checkInSteps` via `CheckInProgress` component or
remove the computation entirely to avoid the wasted `useMemo` on each change.

---

#### CQ-019 · `referenceDate` Memoized `new Date()` Stale After Midnight

**File:** `components/notebook/pages/today-page.tsx:293`

```typescript
const referenceDate = useMemo(() => new Date(), []);
```

This creates a `Date` once when the component mounts and never refreshes it. If
a user keeps the app open past midnight, `referenceDate` will be yesterday. The
`getTodayDateId(referenceDate)` calls will return the wrong date for the entire
next day until a page reload.

**Fix (E1):** Remove the `useMemo` and create `referenceDate` inside effects, or
add a midnight-refresh timer.

---

#### CQ-020 · `MeetingCountdown` Hardcoded Placeholder Data

**File:** `components/widgets/meeting-countdown.tsx:77`

```typescript
<span className="font-handlee text-xs text-blue-700/60">Evening AA • Downtown</span>
```

Even if the component is not dead code, the meeting name is a hardcoded
placeholder string ("Evening AA • Downtown") with no connection to real data.
This would be user-facing if the component is ever rendered.

---

#### CQ-021 · `console.log`/`console.error` Development Guards Not Fully Removed

**File:** `components/notebook/pages/today-page.tsx:639,665-668`

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("💾 Attempting to save:", saveData);
}
```

Three `console.*` calls remain in production code, gated behind `NODE_ENV`
checks. While harmless in prod builds (tree-shaken by Next.js), they represent
left-over debug code that should use `logger` consistently.

---

#### CQ-022 · `EntryWizard` Component: Potential Missing `"use client"` Directive

**File:** `components/journal/entry-wizard.tsx:1`

`EntryWizard` uses `useState`, event handlers, and direct DOM-interaction
patterns, but lacks the `"use client"` directive at the top of the file. The
component is only imported within other Client Components so it works today, but
it is not self-declaring as a Client Component. This is a React 19 anti-pattern
— component boundaries should be explicit.

**Fix (E0):** Add `"use client"` as first line.

---

## 4. Recommendations

### Priority 1 — Security/Correctness

1. **Re-enable Firebase App Check** (CQ-001) — highest impact security gap.
   Schedule a dedicated session to debug the throttle issue and restore bot
   protection.
2. **Fix stale `referenceDate`** (CQ-019) — this is a functional bug that causes
   wrong date behavior for long-running sessions.
3. **Fix Firestore listener re-subscription on keystrokes** (CQ-007) — this
   causes unnecessary Firestore reads that count against quota.

### Priority 2 — Type Safety

4. **Fix `docSnap: any`** (CQ-004) — trivial fix with immediate TypeScript
   benefit.
5. **Fix double `as unknown as` casts** (CQ-008) — design a discriminated union
   for entry data types.
6. **Add `"use client"` to EntryWizard** (CQ-022) — correctness, not just style.

### Priority 3 — Component Health

7. **Migrate deprecated `useAuth()` calls** (CQ-003) — do in a single batch PR;
   improves render performance for 14 components.
8. **Extract custom hooks from TodayPage** (CQ-002) — the highest-traffic
   component in the app; reducing complexity here has the most maintenance
   payoff.
9. **Replace `alert()` calls** (CQ-006, CQ-013) — quick consistency win for the
   admin interface.

### Priority 4 — Cleanup

10. **Delete `MeetingCountdown`** (CQ-012) — confirm zero imports and remove
    dead code.
11. **Remove or render `_checkInSteps`** (CQ-018) — stop wasting computation.
12. **Remove stale layout comment** (CQ-011) — trivial.

### Long-term

- Define a shared discriminated union for journal entry `.data` payloads in
  `types/journal.ts` to eliminate all `as unknown as` casts across the codebase.
- Complete migration from `saveNotebookJournalEntry` → `use-journal.ts:addEntry`
  and remove the deprecated method.
- Set a lint rule (via `eslint-plugin-sonash` already in use) to flag `alert()`
  calls in component files.
