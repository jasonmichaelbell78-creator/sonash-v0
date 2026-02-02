# SoNash Code Review - 2026 Q1

**Document Version:** 1.0 **Created:** 2026-01-06 **Last Updated:** 2026-01-27
**Status:** COMPLETE **Review Type:** Multi-AI Code Quality Audit

---

## Purpose

This document contains canonical findings from a multi-AI code review analyzing
code quality, duplication, type safety, and testing coverage across the SoNash
codebase.

## Quick Start

1. Review severity breakdown
2. Check findings by category
3. Prioritize Critical/High items

## AI Instructions

When addressing code review findings:

- Start with S0/S1 items
- Verify fixes don't introduce regressions
- Update finding status after resolution

## Version History

| Version | Date       | Changes                        |
| ------- | ---------- | ------------------------------ |
| 1.0     | 2026-01-06 | Initial multi-AI audit results |

---

## Executive Summary

This document contains the canonical findings from a multi-AI code review
conducted as part of **Step 4.2** of the Integrated Improvement Plan. The review
was executed using multiple AI models with aggregation via GPT 5.2 Thinking.

### Key Metrics

| Metric         | Value |
| -------------- | ----- |
| Total Findings | 31    |
| Confirmed      | 28    |
| Suspected      | 3     |
| S0 (Critical)  | 2     |
| S1 (High)      | 12    |
| S2 (Medium)    | 14    |
| S3 (Low)       | 3     |
| Planned PRs    | 9     |

### Severity Distribution

```
S0 Critical  ██ 2
S1 High      ████████████ 12
S2 Medium    ██████████████ 14
S3 Low       ███ 3
```

---

## Top-Priority Items

### Critical (S0) - Must Fix Immediately

| ID         | Title                                                        | Effort | Files                    |
| ---------- | ------------------------------------------------------------ | ------ | ------------------------ |
| CANON-0001 | App Check disabled on all production Cloud Functions         | E2     | `functions/src/index.ts` |
| CANON-0002 | Legacy journalEntries collection allows direct client writes | E2     | `firestore.rules`        |

### High Risk (S1) - Fix Soon

| ID         | Title                                                     | Effort | Files                                              |
| ---------- | --------------------------------------------------------- | ------ | -------------------------------------------------- |
| CANON-0003 | Client App Check initialization is disabled/commented out | E1     | `lib/firebase.ts`                                  |
| CANON-0004 | reCAPTCHA verification is logged but not enforced         | E1     | `functions/src/security-wrapper.ts`                |
| CANON-0005 | Console.\* usage bypasses standardized logger             | E1     | Multiple (9 files)                                 |
| CANON-0006 | Critical logic divergence in journal saving               | E1     | `lib/firestore-service.ts`, `hooks/use-journal.ts` |
| CANON-0007 | Cloud Function schema missing 'step-1-worksheet' type     | E0     | `functions/src/schemas.ts`                         |
| CANON-0008 | Admin-claim Firestore rules lack function-only defense    | E2     | `firestore.rules`                                  |
| CANON-0010 | Missing tests for Cloud Function security layers          | E2     | `functions/src/`                                   |
| CANON-0011 | No integration tests for Firestore rules                  | E2     | `firestore.rules`                                  |
| CANON-0012 | Server layout composes client providers without boundary  | E1     | `app/layout.tsx`                                   |
| CANON-0041 | Cloud Function error handling duplicated (4 locations)    | E1     | `lib/firestore-service.ts`, `hooks/use-journal.ts` |
| CANON-0043 | Security-critical files have low test coverage            | E2     | Multiple auth/data files                           |

---

## Quick Wins (E0-E1, High Impact)

These can be completed quickly with immediate benefit:

1. **CANON-0007** - Add `step-1-worksheet` to `functions/src/schemas.ts` enum
   (S1/E0)
2. **CANON-0045** - Remove `@ts-expect-error` by fixing typing in
   `resources-page.tsx` (S3/E0)
3. **CANON-0019** - Guard `JSON.parse` on localStorage in `use-smart-prompts.ts`
   (S2/E0)
4. **CANON-0026** - Replace unsafe `error.message` access in TodayPage with safe
   helper (S2/E0)
5. **CANON-0044** - Replace production `any` usage with `unknown` + guards
   (S3/E1)
6. **CANON-0042** - Standardize static vs dynamic Firebase Functions imports
   (S2/E1)
7. **CANON-0014** - Extract shared quote/slogan rotation utility (S2/E1)
8. **CANON-0013** - Consolidate DailyQuoteCard duplication (S2/E1)
9. **CANON-0005** - Replace `console.*` in components with `logger.*` (S1/E1)
10. **CANON-0041** - Extract single Cloud Function error handler (S1/E1)

---

## All Findings by Category

### Security (8 Confirmed, 3 Suspected)

#### CANON-0001: App Check disabled on all production Cloud Functions

- **Severity:** S0 (Critical) | **Effort:** E2 | **Confidence:** 100%
- **Status:** CONFIRMED | **Consensus:** 3 (Claude Sonnet 4.5, Claude Code)
- **Files:** `functions/src/index.ts`
- **Symbols:** `saveDailyLog`, `saveJournalEntry`, `saveInventoryEntry`,
  `softDeleteJournalEntry`

**Problem:** Bot/device attestation layer is disabled for callable endpoints,
increasing abuse/spam risk and weakening defense-in-depth.

**Duplication Cluster:** Multiple Cloud Functions set `requireAppCheck: false`
with temporary-disable comments.

- `functions/src/index.ts:78` - `saveDailyLog`
- `functions/src/index.ts:~150/170` - `saveJournalEntry`
- `functions/src/index.ts:~250/265` - `saveInventoryEntry`
- `functions/src/index.ts:~350/363` - `softDeleteJournalEntry`

**Suggested Fix:** Re-enable App Check (`requireAppCheck: true`) across
functions; add monitoring for App Check failures and ensure client App Check
init is working.

**Acceptance Tests:**

- All 4 Cloud Functions have `requireAppCheck: true`
- Manual test confirms App Check tokens are validated
- Monitor function invocation logs for abuse patterns

**Dependencies:** CANON-0003

---

#### CANON-0002: Legacy journalEntries collection allows direct client writes

- **Severity:** S0 (Critical) | **Effort:** E2 | **Confidence:** 100%
- **Status:** CONFIRMED | **Consensus:** 3 (Claude Sonnet 4.5, GitHub Copilot)
- **Files:** `firestore.rules`
- **Symbols:** `journalEntries`

**Problem:** Direct client writes bypass App Check / rate limiting / server-side
validation, creating a high-risk security outlier vs other collections.

**Suggested Fix:** Migrate remaining data off legacy path and set
`allow write: if false` (or route writes through Cloud Functions if still used).

**Acceptance Tests:**

- Verify no active code writes to journalEntries directly
- Migration script moves all data
- Rules block direct writes

---

#### CANON-0003: Client App Check initialization is disabled/commented out

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (Codex, GitHub Copilot)
- **Files:** `lib/firebase.ts`
- **Symbols:** `initializeFirebase`, `_appCheck`

**Problem:** Without client App Check init, tokens may not be sent, undermining
verification and/or causing callable failures once functions enforce App Check.

**Suggested Fix:** Restore `initializeAppCheck` gated by configured site key;
use debug tokens only in development.

**Acceptance Tests:**

- Enable App Check site key in env, load client and confirm `_appCheck` is
  created without console warnings
- Verify App Check tokens are sent with Cloud Function calls
- Test that calls without valid App Check token are rejected

---

#### CANON-0004: reCAPTCHA verification is logged but not enforced when configured

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Codex)
- **Files:** `functions/src/security-wrapper.ts`
- **Symbols:** `withSecurityChecks`

**Problem:** Requests can bypass bot mitigation if missing tokens are allowed to
proceed while only being logged.

**Suggested Fix:** When `recaptchaAction` is set, require a token (throw on
missing/blank) unless an explicit opt-out is provided.

**Acceptance Tests:**

- Call a function wrapped with recaptchaAction and no token; expect
  failed-precondition error
- Call same function with valid token; expect success path to execute

---

#### CANON-0008: Admin-claim Firestore rule writes lack function-only defense-in-depth

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `firestore.rules`
- **Symbols:** `isAdmin`

**Problem:** If admin claims are compromised/misconfigured, direct writes expand
blast radius without server-side auditing/enforcement.

**Suggested Fix:** Add Cloud Function wrappers for admin mutations with
server-side checks + audit logging; tighten rules to function-only where
appropriate.

**Acceptance Tests:**

- Admin writes only succeed through Cloud Functions
- Audit log captures all admin mutations

---

#### CANON-0021: ESLint security plugin warnings in scripts

- **Severity:** S2 (Medium) | **Effort:** E2 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (Jules, Claude Code)
- **Files:** `scripts/check-review-needed.js`,
  `scripts/suggest-pattern-automation.js`,
  `scripts/validate-phase-completion.js`, `scripts/check-pattern-compliance.js`,
  `scripts/update-readme-status.js`
- **Symbols:** `detectUnsafeRegex`, `detectNonLiteralFs`,
  `detectObjectInjection`

**Problem:** Even if scripts run in trusted contexts, these patterns are
repeatedly flagged and can become risky if reused; they also create noisy lint
output.

**Suggested Fix:** Address highest-risk warnings first: validate dynamic paths,
constrain object key access, simplify/guard regex patterns.

**Acceptance Tests:**

- `npm run lint` shows materially fewer security warnings
- All non-literal fs paths validated against allowlist

---

#### CANON-0037: Potential sensitive data in localStorage (SUSPECTED)

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 30%
- **Status:** SUSPECTED | **Consensus:** 1 (Claude Sonnet 4.5)

**Problem:** If recovery/journal content is stored in localStorage, it persists
unencrypted on-device and may raise privacy/compliance concerns.

**Suggested Fix:** Audit localStorage/sessionStorage usage; restrict to
non-sensitive UI prefs; document policy.

---

#### CANON-0038: reCAPTCHA verification coverage may be incomplete (SUSPECTED)

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 35%
- **Status:** SUSPECTED | **Consensus:** 1 (GitHub Copilot)
- **Files:** `functions/src/index.ts`, `functions/src/recaptcha-verify.ts`

**Problem:** If server-side verification is not enforced independently, bot
mitigation may be weaker than intended when App Check is off.

**Dependencies:** CANON-0004, CANON-0001

---

#### CANON-0046: Potential rate limit bypass via cycling anonymous accounts (SUSPECTED)

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 35%
- **Status:** SUSPECTED | **Consensus:** 1 (Claude Code)
- **Files:** `components/providers/auth-context.tsx`,
  `lib/auth/account-linking.ts`
- **Symbols:** `ensureAnonymousSession`, `signInAnonymously`

**Problem:** If rate limiting is keyed only by userId, attackers might bypass
limits by creating new anonymous sessions repeatedly.

---

### Hygiene/Duplication (5 Findings)

#### CANON-0005: Console.\* usage in app components bypasses standardized logger

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 100%
- **Status:** CONFIRMED | **Consensus:** 4 (Claude Sonnet 4.5, Jules, Claude
  Code)
- **Files:** `lib/db/library.ts`, `lib/firestore-service.ts`,
  `components/notebook/journal-modal.tsx`,
  `components/notebook/pages/today-page.tsx`,
  `components/notebook/pages/library-page.tsx`, `lib/firebase.ts`,
  `components/growth/Step1WorksheetCard.tsx`, `components/admin/jobs-tab.tsx`,
  `components/admin/prayers-tab.tsx`

**Problem:** Raw console logging can leak sensitive details, creates
inconsistent observability, and violates the project's documented
logger/sanitization intent.

**Duplication Cluster:** Multiple auditors report production console logging
across many components instead of `lib/logger.ts`.

**Suggested Fix:** Replace `console.*` with `logger.*` (or a client-safe
wrapper), then enforce via lint rule (`no-console` with exceptions for logger
implementation).

**Acceptance Tests:**

- Zero `console.log/error/warn` in components/ (except logger implementation)
- Errors logged don't contain file paths/tokens/UIDs
- Production builds have no console output for normal operations

**Dependencies:** CANON-0023

---

#### CANON-0006: Critical logic divergence in journal saving

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Jules)
- **Files:** `lib/firestore-service.ts`, `hooks/use-journal.ts`,
  `components/growth/Step1WorksheetCard.tsx`,
  `components/notebook/pages/today-page.tsx`
- **Symbols:** `FirestoreService.saveNotebookJournalEntry`,
  `useJournal.addEntry`, `generateSearchableText`, `generateTags`

**Problem:** Two journal-save pathways exist; one generates tags/searchable
text, the other does not. Entries saved through the deprecated service miss
searchable metadata, breaking search/filter.

**Suggested Fix:** Refactor `Step1WorksheetCard` and `TodayPage` to use
`useJournal.addEntry`; remove deprecated `saveNotebookJournalEntry` from
FirestoreService.

**Acceptance Tests:**

- Save a Step 1 Worksheet entry
- Verify in Firestore console that the new document has `searchableText` and
  `tags` fields populated

**Dependencies:** CANON-0007

---

#### CANON-0013: Duplicated DailyQuoteCard component

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `components/notebook/features/daily-quote-card.tsx`,
  `components/widgets/daily-quote-card.tsx`,
  `components/widgets/compact-daily-quote.tsx`

**Problem:** Two near-identical DailyQuoteCard implementations are confirmed; a
compact variant exists and may duplicate quote-fetch logic.

**Suggested Fix:** Consolidate to a single source of truth (keeping widgets
version) and compose variants if needed.

**Acceptance Tests:**

- Verify quote displays correctly in notebook + widget contexts
- Confirm animations work
- No broken imports remain

---

#### CANON-0014: Duplicated time-of-day rotation logic for quotes and slogans

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (Codex, GitHub Copilot)
- **Files:** `lib/db/quotes.ts`, `lib/db/slogans.ts`
- **Symbols:** `QuotesService.getQuoteForNow`, `SlogansService.getSloganForNow`,
  `getTimeOfDay`

**Problem:** Identical time-of-day calculation and near-identical
rotation/scheduling algorithm duplicated across both services.

**Suggested Fix:** Extract shared rotation utilities and reuse in both services;
add unit tests for schedule/rotation paths.

**Acceptance Tests:**

- Unit tests cover scheduled-with-time, scheduled-any-time, and fallback
  rotation
- Quotes and slogans return consistent items for equivalent datasets

---

#### CANON-0041: Cloud Function error handling duplicated (4 locations)

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (GitHub Copilot, Claude Code)
- **Files:** `lib/firestore-service.ts`, `hooks/use-journal.ts`
- **Symbols:** `saveDailyLog`, `saveNotebookJournalEntry`, `addEntry`,
  `crumplePage`, `CloudFunctionError`

**Problem:** Similar/identical Cloud Function error handling and
CloudFunctionError interface appear repeatedly, creating drift risk and
inconsistent user messaging.

**Suggested Fix:** Extract `CloudFunctionError` type +
`handleCloudFunctionError()` helper (likely in `lib/utils/errors.ts`) and use it
in all locations.

**Acceptance Tests:**

- Single helper used in all listed locations
- No duplicate error code mappings remain
- Error messages are consistent across app

---

### Types/Correctness (9 Findings)

#### CANON-0007: Cloud Function schema missing 'step-1-worksheet' journal entry type

- **Severity:** S1 (High) | **Effort:** E0 | **Confidence:** 95%
- **Status:** CONFIRMED | **Consensus:** 3 (Claude Sonnet 4.5, GitHub Copilot)
- **Files:** `functions/src/schemas.ts`, `types/journal.ts`
- **Symbols:** `journalEntrySchema`, `JournalEntryType`

**Problem:** Client types include `step-1-worksheet` but server Zod enum omits
it. Users can create Step 1 worksheet entries client-side that fail server
validation, breaking saves at runtime.

**Suggested Fix:** Add `'step-1-worksheet'` to `journalEntrySchema` type enum in
`functions/src/schemas.ts`.

**Acceptance Tests:**

- Test saving a step-1-worksheet entry via Cloud Function
- Typecheck passes

---

#### CANON-0016: Journal entry type definitions duplicated across client and server

- **Severity:** S2 (Medium) | **Effort:** E2 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (Claude Sonnet 4.5, GitHub Copilot)
- **Files:** `types/journal.ts`, `functions/src/schemas.ts`

**Problem:** Type list maintained in both TS and Zod; drift already observed.

**Suggested Fix:** Extract shared constants (or generate TS types from Zod) so
both client and functions import from one source.

**Dependencies:** CANON-0007

---

#### CANON-0017: Inconsistent httpsCallable typing

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `lib/firestore-service.ts`
- **Symbols:** `callCloudFunction`

**Problem:** Callable returns unknown, forcing casts and losing compile-time
safety.

**Suggested Fix:** Add generic type parameters to `callCloudFunction` /
`httpsCallable` usage.

---

#### CANON-0018: Unsafe type assertions with 'as unknown as'

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 85%
- **Status:** CONFIRMED | **Consensus:** 3 (Jules, Claude Code)
- **Files:** `components/growth/Step1WorksheetCard.tsx`,
  `components/journal/entry-detail-dialog.tsx`,
  `components/maps/meeting-map.tsx`

**Problem:** Double casts bypass TypeScript safety; runtime crashes possible if
data shape differs.

**Suggested Fix:** Add runtime validation (e.g., Zod parse) before casting;
replace with type guards where applicable.

**Dependencies:** CANON-0007

---

#### CANON-0019: Unsafe localStorage JSON.parse in use-smart-prompts hook

- **Severity:** S2 (Medium) | **Effort:** E0 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Jules)
- **Files:** `components/notebook/hooks/use-smart-prompts.ts`
- **Symbols:** `useSmartPrompts`

**Problem:** Corrupted localStorage can throw and crash the component.

**Suggested Fix:** Wrap `JSON.parse` in try/catch or use a safe parse utility
with defaults.

---

#### CANON-0022: Journal entry schema data is weakly typed

- **Severity:** S2 (Medium) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (GitHub Copilot)
- **Files:** `functions/src/schemas.ts`
- **Symbols:** `journalEntrySchema`

**Problem:** `journalEntrySchema.data` uses `z.record(z.string(), z.unknown())`.
Malformed entries can pass validation.

**Suggested Fix:** Use a Zod discriminated union for per-entry-type data
schemas.

**Dependencies:** CANON-0016

---

#### CANON-0026: Missing error.message null safety in TodayPage

- **Severity:** S2 (Medium) | **Effort:** E0 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `components/notebook/pages/today-page.tsx`
- **Symbols:** `handleSave`

**Problem:** If a non-Error is thrown, accessing `error.message/stack` can
crash; catch is unknown.

**Suggested Fix:** Use `getErrorMessage(error)` helper to safely extract
message.

---

#### CANON-0044: 'any' types leaking into production code

- **Severity:** S3 (Low) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Code)
- **Files:** `lib/sentry.client.ts`, `components/admin/meetings-tab.tsx`,
  `functions/src/admin.ts`, `tests/firestore-service.test.ts`

**Problem:** Use of `any` reduces type safety; in production files it can mask
real issues.

**Suggested Fix:** Replace production `any` with `unknown` + type guards or
concrete types.

---

#### CANON-0045: @ts-expect-error suppression in production code

- **Severity:** S3 (Low) | **Effort:** E0 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Code)
- **Files:** `components/notebook/pages/resources-page.tsx`
- **Symbols:** `setGenderFilter`

**Problem:** Suppresses type checking and can hide real mismatches.

**Suggested Fix:** Fix type annotation or add explicit narrowing so the call is
type-safe without suppression.

---

### Next/React Boundaries (4 Findings)

#### CANON-0012: Server layout composes client providers without explicit boundary

- **Severity:** S1 (High) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `app/layout.tsx`
- **Symbols:** `RootLayout`

**Problem:** Boundary clarity and potential hydration/bundle concerns.

**Suggested Fix:** Create `app/providers.tsx` ('use client') wrapping
AuthProvider/CelebrationProvider/ErrorBoundary and import from layout.tsx.

---

#### CANON-0023: useJournal sets up its own auth listener

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (GitHub Copilot)
- **Files:** `hooks/use-journal.ts`, `components/providers/auth-provider.tsx`
- **Symbols:** `useJournal`, `auth.onAuthStateChanged`

**Problem:** Redundant subscriptions can cause state-sync issues and unnecessary
listeners.

**Suggested Fix:** Refactor `useJournal` to consume user from auth context (or
accept user as param) and remove internal `onAuthStateChanged` listener.

**Dependencies:** CANON-0006

---

#### CANON-0033: Landing page forced to client component for top-level state

- **Severity:** S3 (Low) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Jules)
- **Files:** `app/page.tsx`
- **Symbols:** `Home`, `useState`

**Problem:** Forces full landing page client rendering, potentially affecting
FCP/bundle size.

**Suggested Fix:** Move stateful logic into a small client wrapper; keep
`app/page.tsx` server-rendered where possible.

---

#### CANON-0034: Environment variables accessed directly in components

- **Severity:** S3 (Low) | **Effort:** E0 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Jules)
- **Files:** `app/layout.tsx`
- **Symbols:** `process.env`

**Problem:** Harder to track and type-check configuration dependencies across
components.

**Suggested Fix:** Move env access to a config module exporting typed constants.

---

#### CANON-0042: Inconsistent Firebase Functions import pattern

- **Severity:** S2 (Medium) | **Effort:** E1 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Code)
- **Files:** `lib/firestore-service.ts`, `hooks/use-journal.ts`,
  `lib/auth/account-linking.ts`, `components/admin/jobs-tab.tsx`,
  `components/admin/errors-tab.tsx`, `components/admin/dashboard-tab.tsx`
- **Symbols:** `getFunctions`, `httpsCallable`

**Problem:** Mixed dynamic imports and static imports for firebase/functions
APIs across codebase.

**Suggested Fix:** Standardize import strategy (e.g., static imports for
client-side code).

---

### Testing (5 Findings)

#### CANON-0010: Missing automated tests for Cloud Function security layers

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `functions/src/index.ts`, `functions/src/security-wrapper.ts`
- **Symbols:** `withSecurityChecks`, `saveDailyLog`, `saveJournalEntry`

**Problem:** Security regressions can ship undetected without tests covering
enforcement layers.

**Suggested Fix:** Add tests covering unauth rejection, rate-limit behavior, App
Check pass/fail, user-scope enforcement, and reCAPTCHA behavior.

**Dependencies:** CANON-0001, CANON-0002

---

#### CANON-0011: No integration tests for Firestore rules

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Sonnet 4.5)
- **Files:** `firestore.rules`

**Problem:** Rules are a primary security boundary; regressions can become data
exposure incidents without automated tests.

**Suggested Fix:** Set up Firebase emulator rule tests using
`@firebase/rules-unit-testing` for key permission scenarios.

**Dependencies:** CANON-0002, CANON-0008

---

#### CANON-0024: Cloud Function integration test is skipped

- **Severity:** S2 (Medium) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (GitHub Copilot)
- **Files:** `tests/firestore-service.test.ts`
- **Symbols:** `saveDailyLog test`

**Problem:** Primary data save path is effectively untested; skip note indicates
missing integration harness/emulator setup.

**Suggested Fix:** Add an integration test suite using Firebase emulator;
optionally mock httpsCallable for unit coverage.

---

#### CANON-0025: No tests for useJournal hook

- **Severity:** S2 (Medium) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (GitHub Copilot)
- **Files:** `hooks/use-journal.ts`
- **Symbols:** `useJournal`, `addEntry`, `crumplePage`

**Problem:** Core journal interaction logic lacks dedicated tests; regressions
can break journaling flows.

**Suggested Fix:** Add tests for useJournal with mocked Firebase/Cloud Functions
covering auth changes, addEntry, and crumplePage.

**Dependencies:** CANON-0006

---

#### CANON-0043: Security-critical files have low test coverage

- **Severity:** S1 (High) | **Effort:** E2 | **Confidence:** 60%
- **Status:** CONFIRMED | **Consensus:** 1 (Claude Code)
- **Files:** `lib/auth/account-linking.ts`, `lib/firestore-service.ts`,
  `lib/recaptcha.ts`, `lib/db/users.ts`
- **Symbols:** `linkEmailPassword`, `linkWithGoogle`, `saveDailyLog`,
  `getRecaptchaToken`

**Problem:** Low coverage in auth/data/recaptcha paths increases risk of
undetected production regressions.

**Suggested Fix:** Add tests to raise coverage targets for these files; mock
Cloud Functions where needed.

---

## Implementation Roadmap (PR Plan)

### PR1: S0 Security - Restore App Check End-to-End

**Goal:** Re-enable App Check in client initialization and require it in all
callable Cloud Functions.

| Attribute  | Value                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| Risk Level | HIGH                                                                           |
| Effort     | E2                                                                             |
| CANON IDs  | CANON-0003, CANON-0001                                                         |
| Staging    | PR1a (client init) → PR1b (functions requireAppCheck) → PR1c (monitoring/docs) |

**Acceptance Tests:**

- Enable App Check site key in env, load client and confirm `_appCheck` is
  created
- All 4 Cloud Functions have `requireAppCheck: true`
- Manual test confirms App Check tokens are validated

**Notes:** Do client init first to avoid breaking production callers when
functions enforcement flips.

---

### PR2: S0 Security - Lock Down Legacy journalEntries

**Goal:** Remove direct client writes for legacy journalEntries and restore
function-only posture.

| Attribute  | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| Risk Level | HIGH                                                               |
| Effort     | E2                                                                 |
| CANON IDs  | CANON-0002                                                         |
| Staging    | PR2a (audit usage + migration plan) → PR2b (rules change + deploy) |

**Acceptance Tests:**

- Verify no active code writes to journalEntries directly
- Rules block direct writes

---

### PR3: Bot Mitigation Enforcement - reCAPTCHA

**Goal:** Ensure reCAPTCHA is actually enforced when configured.

| Attribute  | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| Risk Level | MEDIUM                                                          |
| Effort     | E1                                                              |
| CANON IDs  | CANON-0004, CANON-0038                                          |
| Staging    | PR3a (enforce missing-token failure) → PR3b (verify end-to-end) |

**Acceptance Tests:**

- Call a function with recaptchaAction and no token; expect failed-precondition
- Call with valid token; expect success

---

### PR4: Data Integrity - Fix Step 1 Journal Save Path

**Goal:** Unbreak Step 1 worksheet saves and ensure entries include searchable
metadata.

| Attribute  | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Risk Level | MEDIUM                                                         |
| Effort     | E2                                                             |
| CANON IDs  | CANON-0007, CANON-0006                                         |
| Staging    | PR4a (schema enum fix) → PR4b (refactor callers to useJournal) |

**Acceptance Tests:**

- Test saving a step-1-worksheet entry via Cloud Function
- Verify `searchableText` and `tags` fields are populated

**Notes:** Ship the enum fix first (E0) so users stop hitting validation
failures.

---

### PR5: Standardize Error Handling + Logging

**Goal:** Deduplicate CF error mapping and eliminate console logging in
production.

| Attribute  | Value                                                   |
| ---------- | ------------------------------------------------------- |
| Risk Level | MEDIUM                                                  |
| Effort     | E2                                                      |
| CANON IDs  | CANON-0041, CANON-0005                                  |
| Staging    | PR5a (shared CF error helper) → PR5b (logger migration) |

**Acceptance Tests:**

- Single helper used in all error-handling locations
- Zero `console.*` in components/ (except logger)
- Errors logged don't contain sensitive data

---

### PR6: Testing Hardening

**Goal:** Raise confidence in security and auth/data flows via tests.

| Attribute  | Value                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Risk Level | HIGH                                                                                    |
| Effort     | E3                                                                                      |
| CANON IDs  | CANON-0010, CANON-0011, CANON-0024, CANON-0043                                          |
| Staging    | PR6a (rules emulator tests) → PR6b (functions security tests) → PR6c (coverage targets) |

**Acceptance Tests:**

- Rules emulator tests pass in CI
- Functions security paths are covered
- Coverage for critical files improves materially

---

### PR7: Duplication Cleanup - Quotes/Slogans + DailyQuoteCard

**Goal:** Reduce duplicated logic/components to prevent drift.

| Attribute  | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Risk Level | LOW                                                                   |
| Effort     | E2                                                                    |
| CANON IDs  | CANON-0014, CANON-0013                                                |
| Staging    | PR7a (rotation utility + tests) → PR7b (DailyQuoteCard consolidation) |

**Acceptance Tests:**

- Rotation unit tests cover schedule + fallback paths
- Quote displays correctly wherever used

---

### PR8: Types Cleanup

**Goal:** Reduce runtime failures by tightening types and removing suppressions.

| Attribute  | Value                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Risk Level | MEDIUM                                                                                             |
| Effort     | E3                                                                                                 |
| CANON IDs  | CANON-0018, CANON-0022, CANON-0044, CANON-0045, CANON-0019, CANON-0026, CANON-0016                 |
| Staging    | PR8a (remove ts-expect-error + quick fixes) → PR8b (runtime validation) → PR8c (schema tightening) |

**Acceptance Tests:**

- No `@ts-expect-error` in production code
- Unsafe casts paired with runtime validation
- Invalid payloads rejected by schema

---

### PR9: Scripts Lint-Security Cleanup

**Goal:** Reduce ESLint security warnings in scripts/.

| Attribute  | Value      |
| ---------- | ---------- |
| Risk Level | LOW        |
| Effort     | E2         |
| CANON IDs  | CANON-0021 |

**Acceptance Tests:**

- `npm run lint` shows materially fewer security warnings
- All non-literal fs paths validated against allowlist

---

## Recommended Implementation Order

1. **PR1:** CANON-0003 → CANON-0001 (restore App Check end-to-end)
2. **PR2:** CANON-0002 (legacy rules/migration)
3. **PR3:** CANON-0004 (+ verify CANON-0038) (reCAPTCHA enforcement)
4. **PR4:** CANON-0007 → CANON-0006 (Step1 save path + searchable metadata)
5. **PR5:** CANON-0041 + CANON-0005 (error handling DRY + logger migration)
6. **PR6:** CANON-0010 + CANON-0011 + CANON-0024 + CANON-0043 (tests + coverage)
7. **PR7:** CANON-0014 + CANON-0013 (duplication cleanups)
8. **PR8:** CANON-0018 + CANON-0022 + CANON-0044 + CANON-0045 (+ small safety
   fixes)
9. **PR9:** CANON-0021 (scripts lint cleanup)

---

## Key Duplication Clusters

| Cluster                          | Files          | Impact                 |
| -------------------------------- | -------------- | ---------------------- |
| Console logging bypassing logger | 9+ files       | Security/observability |
| Cloud Function error handling    | 4 locations    | Maintainability        |
| Quote/slogan rotation logic      | 2 services     | Drift risk             |
| DailyQuoteCard implementations   | 2-3 components | Maintenance burden     |

---

## Suspected Findings (Require Verification)

| ID         | Title                               | Confidence | Next Step                |
| ---------- | ----------------------------------- | ---------- | ------------------------ |
| CANON-0037 | Sensitive data in localStorage      | 30%        | Audit localStorage usage |
| CANON-0038 | reCAPTCHA coverage incomplete       | 35%        | Verify server-side paths |
| CANON-0046 | Rate limit bypass via anon accounts | 35%        | Validate threat model    |

---

## Related Documents

- [CODE_REVIEW_PLAN_2026_Q1.md](../../CODE_REVIEW_PLAN_2026_Q1.md) - Execution
  plan
- [INTEGRATED_IMPROVEMENT_PLAN.md](../../../../archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md) -
  Parent plan (Step 4.2)
- [sonarqube-manifest.md](../../../../analysis/sonarqube-manifest.md) - Static
  analysis baseline
- [MULTI_AI_AGGREGATOR_TEMPLATE.md](../../../../templates/MULTI_AI_AGGREGATOR_TEMPLATE.md) -
  Aggregation methodology

---

## Version History

| Version | Date       | Changes                                          | Author |
| ------- | ---------- | ------------------------------------------------ | ------ |
| 1.0     | 2026-01-06 | Initial creation from multi-AI aggregated output | Claude |

---

**END OF CODE_REVIEW_2026_Q1.md**
