# Code Quality Audit Report

> **Last Updated:** 2026-01-27

## Purpose

This document provides a comprehensive code quality audit of the SoNash
codebase, examining TypeScript best practices, React/Next.js patterns, code
hygiene, framework-specific issues, and error handling patterns.

---

**Date:** 2026-01-24 **Auditor:** Claude Opus 4.5 **Scope:** `app/`,
`components/`, `lib/`, `hooks/`, `types/`

---

## Executive Summary

This comprehensive code quality audit examined the SoNash codebase across
TypeScript best practices, React/Next.js patterns, code hygiene,
framework-specific issues, and error handling patterns.

### Baselines at Audit Time

| Metric             | Value                                          |
| ------------------ | ---------------------------------------------- |
| Tests              | 276 passing, 0 failed, 1 skipped               |
| Lint               | 0 errors, 539 warnings                         |
| Pattern Compliance | 0 violations (31 patterns checked)             |
| Stack Versions     | Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3 |

### Findings Summary

| Severity      | Count | Confidence |
| ------------- | ----- | ---------- |
| S0 (Critical) | 0     | -          |
| S1 (High)     | 2     | MEDIUM     |
| S2 (Medium)   | 8     | MEDIUM     |
| S3 (Low)      | 6     | MEDIUM/LOW |

**Overall Assessment:** The codebase demonstrates good practices overall with
well-structured components, proper error handling utilities, and
security-conscious patterns. Most issues are low severity and relate to code
hygiene or minor improvements.

---

## Category 1: Code Hygiene

### CODE-001: Debug Console Logs in Production Component

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep output)

**File:** `components/notebook/pages/today-page.tsx:594-788`

**Evidence:**

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("💾 Attempting to save:", saveData);
}
// ...
console.log("📊 Weekly Stats Debug:", {...});
console.log("📊 Query returned:", snapshot.size, "documents");
console.log("📊 ALL logs in database:", allLogsSnapshot.size, "total documents");
```

**Issue:** Multiple debug console.log statements exist wrapped in development
checks. While they are appropriately gated, there are 12+ debug logs in this
single file, making debugging output noisy.

**Recommendation:** Consider using the centralized `logger` utility with debug
level, or create a dedicated debug utility that can be enabled/disabled via
feature flag. This allows more granular control over debug output.

---

### CODE-002: Underscore-Prefixed Unused Variables

**Severity:** S3 (Low) | **Effort:** E0 (trivial) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep output)

**File:** `components/notebook/pages/today-page.tsx:305`,
`components/notebook/pages/growth-page.tsx:15`, `hooks/use-smart-prompts.ts:291`

**Evidence:**

```typescript
const _checkInSteps = useMemo(() => {...}, [...]);
export default function GrowthPage({ onNavigate: _onNavigate }: GrowthPageProps) {
const { ..., _used, ... } = useSmartPrompts({...});
```

**Issue:** Multiple variables with underscore prefix indicating intentionally
unused values. While this is a valid TypeScript pattern, some are computed with
`useMemo` but never used.

**Recommendation:** Remove truly unused code or add comments explaining why it's
retained (e.g., for future features). The `_checkInSteps` computation in
today-page.tsx can be removed if not needed.

---

### CODE-003: TODO Comments Without Issue References

**Severity:** S3 (Low) | **Effort:** E0 (trivial) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep output)

**File:** `components/notebook/features/quick-actions-fab.tsx:12`,
`lib/database/firestore-adapter.ts:51`

**Evidence:**

```typescript
// TODO: Make action buttons customizable by user (save preferences to profile/localStorage)
// TODO: Pass limit to FirestoreService when it supports configurable limits
```

**Issue:** 2 TODO comments found without issue tracker references. Per
FALSE_POSITIVES.jsonl FP-006, TODOs are acceptable if they reference issue
numbers.

**Recommendation:** Either create GitHub issues for these items and add
references, or document them in TECHNICAL_DEBT.md if they're long-term items.

---

## Category 2: Types & Correctness

### CODE-004: Any Type Usage in Test Files

**Severity:** S3 (Low) | **Effort:** E1 (small) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep + eslint output)

**File:** `tests/auth-provider.test.ts:25,43,63,78,88`,
`tests/firestore-service.test.ts:18-40,58,72,87`

**Evidence:**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
let todayLog: any;
const service = createFirestoreService(mockDeps() as any);
```

**Issue:** Test files use `any` type extensively for mocking. While documented
via eslint-disable, this reduces type safety and can hide type mismatches
between mocks and real implementations.

**Recommendation:** Consider creating proper mock types that match the actual
interfaces. This provides better test reliability and catches type drift early.

**Note:** Per FP-004 and FP-005, explicit eslint-disable comments are acceptable
technical debt, and `any-to-unknown` casting is a valid pattern for external
data.

---

### CODE-005: Callback Parameter Type as `any`

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** MEDIUM
**Verified:** DUAL_PASS_CONFIRMED

**File:** `components/notebook/pages/today-page.tsx:505`

**Evidence:**

```typescript
const handleSnapshotUpdate = useCallback(
  (docSnap: any, isMounted: boolean) => {
```

**Issue:** The `docSnap` parameter is typed as `any` instead of the proper
Firestore type. This is inside the main component file, not a test.

**Recommendation:** Import and use the correct Firestore type:

```typescript
import { DocumentSnapshot } from "firebase/firestore";
(docSnap: DocumentSnapshot, isMounted: boolean) => {
```

---

## Category 3: Framework Best Practices

### CODE-006: Missing React.Suspense for Code Splitting

**Severity:** S2 (Medium) | **Effort:** E2 (medium) | **Confidence:** MEDIUM
**Verified:** MANUAL_ONLY

**Files:** Throughout `components/` directory

**Issue:** The codebase does not utilize React's `lazy()` and `Suspense` for
code splitting. With 100+ components, the main bundle likely includes all
component code upfront.

**Evidence:** Grep for `Suspense|lazy` found only non-React-related uses:

- `strategy="lazyOnload"` (script tag)
- `"lazy_productive"` (string literal)
- "lazy initialization" (comment)

**Recommendation:** Consider lazy-loading heavy components like:

- Admin tabs (`components/admin/*.tsx`)
- Notebook pages that aren't immediately visible
- Maps component (includes Leaflet library)

Example:

```typescript
const AdminTabs = lazy(() => import('./admin/admin-tabs'));
<Suspense fallback={<Loading />}>
  <AdminTabs />
</Suspense>
```

---

### CODE-007: ESLint Rule Suppression for Exhaustive Deps

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep output)

**Files:** `hooks/use-geolocation.ts:171`,
`components/admin/users-tab.tsx:302,354`

**Evidence:**

```typescript
}, []); // eslint-disable-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps
```

**Issue:** 3 instances of suppressed exhaustive-deps warnings. While sometimes
necessary, this can hide bugs from missing dependencies.

**Recommendation:** Review each case:

1. `use-geolocation.ts:171` - `requestOnMount` pattern may be intentional (runs
   only once)
2. `users-tab.tsx:302,354` - Has comment explaining intent; acceptable but
   document rationale

---

### CODE-008: Large Component File (TodayPage)

**Severity:** S1 (High) | **Effort:** E2 (medium) | **Confidence:** MEDIUM
**Verified:** DUAL_PASS_CONFIRMED

**File:** `components/notebook/pages/today-page.tsx` (1179 lines)

**Issue:** This single component file is very large with:

- 15+ useState hooks
- 10+ useRef hooks
- 9 useEffect hooks
- 6+ useCallback definitions
- Multiple inline sub-components (ToggleButton, CheckInQuestion,
  SmartPromptsSection)

This complexity makes the component difficult to:

- Test in isolation
- Maintain and debug
- Understand at a glance

**Recommendation:** Extract concerns into separate files:

1. `today-page-hooks.ts` - Custom hooks for weekly stats, milestone checking
2. `today-page-components/` - Sub-components like CheckInSection, HALTCheck
3. `today-page-utils.ts` - Helper functions already partially extracted
   (formatDurationPart, etc.)

---

## Category 4: Testing Coverage

### CODE-009: No Component Tests

**Severity:** S2 (Medium) | **Effort:** E3 (large) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (glob output)

**Files:** `tests/**/*.test.ts`

**Issue:** Test files exist only for:

- Utility functions (`date-utils.test.ts`, `logger.test.ts`, etc.)
- Services (`firestore-service.test.ts`, `auth-provider.test.ts`)
- Scripts (`check-docs-light.test.ts`, etc.)

No React component tests were found (no `.test.tsx` files for components).

**Recommendation:** Prioritize component tests for:

1. Critical user flows (TodayPage check-in flow)
2. Complex conditional rendering (admin tabs)
3. Error boundary behavior

---

## Category 5: Security Surface

### CODE-010: Console Statements in Error Paths

**Severity:** S3 (Low) | **Effort:** E1 (small) | **Confidence:** HIGH
**Verified:** TOOL_VALIDATED (grep output)

**File:** `lib/utils/callable-errors.ts:182-189`

**Evidence:**

```typescript
if (process.env.NODE_ENV === "development") {
  console.error(`❌ Cloud Function error during ${operation}:`, error);
  if (isCloudFunctionError(error)) {
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }
}
```

**Issue:** Error details including message and details are logged to console.
While gated to development, the `error.details` could potentially contain
sensitive data.

**Recommendation:** Review what data flows through `error.details` and ensure no
PII can leak. Consider using the sanitized logger utility instead for
consistency.

**Note:** This is appropriately gated to development mode and follows the
project's console logging patterns per FP-007.

---

## Category 6: AICode (AI-Generated Code Patterns)

### CODE-011: Potential Copy-Paste Code Blocks

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** MEDIUM
**Verified:** MANUAL_ONLY

**Files:** `components/admin/*-tab.tsx`

**Issue:** Multiple admin tab files follow nearly identical patterns:

- Same state management structure
- Same tab refresh hook usage
- Same error handling patterns

While this is good for consistency, some shared patterns could be abstracted to
reduce duplication.

**Recommendation:** The existing `AdminCrudTable` abstraction is good. Consider
extending it for more tab types, or creating a `useAdminTab` hook that
encapsulates common patterns:

- Loading state
- Error handling
- Refresh logic
- Cloud function calls

---

### CODE-012: Complex Nested Logic Without Early Returns

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** MEDIUM
**Verified:** DUAL_PASS_CONFIRMED

**File:** `components/notebook/pages/today-page.tsx:698-794`
(calculateWeeklyStats)

**Evidence:**

```typescript
async function calculateWeeklyStats() {
  if (!user) return; // Guard against null user

  try {
    // ... 90+ lines of nested logic
  } catch (error) {
    // error handling
  }
}
```

**Issue:** The `calculateWeeklyStats` function has deeply nested logic with
multiple console.log statements and inline data transformation.

**Recommendation:** Extract into a custom hook `useWeeklyStats`:

```typescript
function useWeeklyStats(userId: string | undefined) {
  const [stats, setStats] = useState({ daysLogged: 0, streak: 0 });

  useEffect(() => {
    if (!userId) return;
    fetchWeeklyStats(userId).then(setStats);
  }, [userId]);

  return stats;
}
```

---

## Category 7: Debugging Ergonomics

### CODE-013: Missing Correlation IDs for Request Tracing

**Severity:** S1 (High) | **Effort:** E2 (medium) | **Confidence:** MEDIUM
**Verified:** MANUAL_ONLY

**Files:** `lib/firestore-service.ts`, `hooks/use-journal.ts`

**Issue:** Cloud function calls do not include correlation IDs for tracing
requests from frontend to backend. When debugging production issues, it's
difficult to correlate:

- Client-side errors
- Cloud function logs
- Sentry events

**Recommendation:** Add a correlation ID system:

```typescript
// lib/utils/correlation.ts
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// In Cloud Function calls:
const correlationId = generateCorrelationId();
await saveDailyLogFn({ ...payload, correlationId });
logger.info("Saving daily log", { correlationId, userId: maskedUserId });
```

---

### CODE-014: Inconsistent Error Context

**Severity:** S2 (Medium) | **Effort:** E1 (small) | **Confidence:** MEDIUM
**Verified:** MANUAL_ONLY

**Files:** Various components

**Issue:** Error logging is inconsistent across components:

- Some use `logger.error()` with full context
- Some use `console.error()` in development
- Some toast errors without logging

**Recommendation:** Standardize on:

1. Always use `logger.error()` for all errors
2. Include consistent context:
   `{ component, action, userId: masked, errorType }`
3. Consider adding actionable fix hints to error messages

---

## False Positives Filtered

The following patterns were excluded per `docs/audits/FALSE_POSITIVES.jsonl`:

| Pattern ID | Category                       | Count Filtered     |
| ---------- | ------------------------------ | ------------------ |
| FP-004     | eslint-disable with comments   | 7                  |
| FP-007     | Console in Cloud Functions     | 17                 |
| FP-011     | detect-object-injection        | 91 (lint warnings) |
| FP-012     | detect-non-literal-fs-filename | 66 (lint warnings) |

---

## Quick Wins (E0-E1)

1. **CODE-002**: Remove unused `_checkInSteps` computation
2. **CODE-003**: Add issue references to TODO comments
3. **CODE-005**: Type `docSnap` parameter properly
4. **CODE-010**: Use logger utility in callable-errors.ts

---

## Recommendations by Priority

### Immediate (This Sprint)

1. Fix `any` type in today-page.tsx handler (CODE-005)
2. Add correlation IDs to Cloud Function calls (CODE-013)

### Short-term (Next Sprint)

1. Add component tests for critical flows (CODE-009)
2. Extract TodayPage into smaller components (CODE-008)
3. Implement React.lazy for admin components (CODE-006)

### Long-term (Technical Debt)

1. Refactor admin tabs to use shared patterns (CODE-011)
2. Create centralized debug logging utility
3. Add comprehensive error context standards (CODE-014)

---

## Audit Metadata

| Field                    | Value                                   |
| ------------------------ | --------------------------------------- |
| Files Analyzed           | 95                                      |
| Directories Covered      | app/, components/, lib/, hooks/, types/ |
| Tests Analyzed           | 19 test files, 349 test cases           |
| Lint Warnings Reviewed   | 539                                     |
| False Positives Filtered | 6 patterns                              |

---

_Generated by Claude Opus 4.5 Code Quality Audit_

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-01-24 | Initial version |
