<report>
**AI Model**: GPT-5.1-Codex-Max

**Repository**: sonash-v0

**Analysis Date**: 2025-12-12

**Executive Summary**: The SoNash codebase shows strong feature coverage and
thoughtful UI work, but several workflows still risk data loss, failed Firestore
calls, and user confusion. The onboarding wizard overwrites existing profiles on
repeat runs, resources fetching does not wait for authentication, and daily log
date handling mixes UTC IDs with local display strings. Admin-only meeting
utilities also remain exposed in the client UI.

Addressing these concerns would improve reliability and safety: gate Firestore
reads on auth readiness, merge profile updates instead of overwriting, align
date calculations to one timezone, and remove destructive utilities from the
public surface. These changes will harden data integrity, reduce noisy errors,
and create a more predictable experience for end users.

**Findings**:

**Finding #1**

- **Category**: Error/Bug
- **Severity**: High
- **File**: components/onboarding/onboarding-wizard.tsx (lines 37-87)
- **Description**: `handleFinish` always calls `createUserProfile` followed by
  `updateUserProfile`. Because `createUserProfile` uses `setDoc` without merge
  semantics, running onboarding again overwrites any existing profile
  (preferences, timestamps, clean date) with defaults before the update, leading
  to unintended resets.
- **Impact**: Returning users who re-run onboarding can lose stored profile data
  and have their recovery history reset, causing data integrity issues and poor
  UX.
- **Recommendation**: Check whether a profile already exists and avoid
  recreating it when it does. Use `setDoc(..., { merge: true })` or rely solely
  on `updateUserProfile` to add clean date and nickname without wiping existing
  fields.
- **Code Example** (if applicable):

```ts
const existing = await getUserProfile(user.uid);
if (!existing) {
  await createUserProfile(user.uid, user.email, nickname);
}
await updateUserProfile(user.uid, { cleanStart, nickname });
```

**Finding #2**

- **Category**: Error/Bug
- **Severity**: High
- **File**: components/notebook/pages/resources-page.tsx (lines 33-54) and
  firestore.rules (lines 114-118)
- **Description**: The resources page fetches meetings immediately on mount
  without waiting for authentication, but Firestore rules require
  `request.auth != null` for reads. Initial fetches often execute before
  anonymous sign-in completes, generating permission errors with no retry when
  auth becomes available.
- **Impact**: Users can see empty results or error toasts because the first
  fetch runs unauthenticated and is never re-triggered once authentication
  finishes.
- **Recommendation**: Delay meeting fetches until the auth hook reports a
  signed-in user (or loading finished) and retry when auth transitions from null
  to a valid user. Depend the effect on auth readiness signals.
- **Code Example** (if applicable):

```ts
const { user, loading } = useAuth();
useEffect(() => {
  if (loading || !user) return;
  fetchMeetings();
}, [user, loading, viewMode]);
```

**Finding #3**

- **Category**: Code Quality
- **Severity**: Medium
- **File**: components/notebook/pages/today-page.tsx (lines 71-170) and
  lib/utils/date-utils.ts (lines 21-45)
- **Description**: Daily log IDs are generated in UTC (`getTodayDateId`), while
  `date` strings saved to documents use the local timezone
  (`formatDateForDisplay`). Around midnight in non-UTC zones, users can be
  viewing "today" locally while writes target the next day’s document ID,
  splitting a single day’s entry across two records.
- **Impact**: Journal entries near day boundaries can appear under unexpected
  dates, fragmenting history and confusing users.
- **Recommendation**: Standardize on one timezone for both ID and display.
  Derive both the Firestore ID and display string from the same `Date` instance
  using consistent timezone logic (local or UTC) to prevent divergence.

**Finding #4**

- **Category**: Security
- **Severity**: Medium
- **File**: components/notebook/pages/resources-page.tsx (lines 60-110, 317-340)
  and lib/db/meetings.ts (lines 102-165)
- **Description**: Developer utilities to seed and clear the `meetings`
  collection are exposed in the production client UI and callable from any
  browser. While Firestore rules currently block writes, these buttons still
  attempt batch deletes/inserts from the client, inviting misuse.
- **Impact**: Users can trigger failing admin operations (poor UX), and if rules
  ever loosen or misconfigure, client-side callers could wipe or overwrite
  shared meeting data.
- **Recommendation**: Remove or hide destructive meeting utilities in production
  builds. Relocate seed/clear operations to a secured admin context or guard
  rendering with environment flags or role checks.

**Summary Statistics**:

- Total Findings: 4
- Critical: 0
- High: 2
- Medium: 2
- Low: 0

**Overall Assessment**: 6/10 – The codebase is feature-rich with solid patterns
but contains sequencing and data-handling gaps that threaten reliability.
Resolving the outlined issues will significantly improve data integrity and user
trust.

**Priority Recommendations**:

1. Prevent onboarding from overwriting existing user profiles by detecting
   existing docs or merging writes.
2. Gate meeting fetches on auth readiness and retry after sign-in to satisfy
   Firestore rules.
3. Align daily log ID and display date generation to a consistent timezone.
4. Hide or secure meeting seed/clear utilities so destructive actions are
   unavailable to normal users. </report>
