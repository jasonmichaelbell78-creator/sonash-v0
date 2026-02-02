# ROADMAP Integration Guide

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-01-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Generated: 2026-01-30 | Session #116 | Total Findings to Integrate: 172

This document provides copy-paste ready sections for integrating findings into
ROADMAP.md.

---

## M2.1 Code Quality (87 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0138:** Reduce 47 CRITICAL complexity functions `N/A` [E3]
- [ ] **CANON-0162:** Convert CI gates to blocking `N/A` [E2]
- [ ] **CANON-0001:** 5 failing tests in check-docs-light.test.ts
      `check-docs-light.test.ts:199` [E1]
- [ ] **CANON-0031:** Client App Check initialization is disabled/commented out
      `firebase.ts` [E1]
- [ ] **CANON-0033:** reCAPTCHA verification is logged but not enforced when
      confi `security-wrapper.ts` [E1]
- [ ] **CANON-0034:** Admin-claim Firestore rule writes lack function-only
      defense `firestore.rules` [E2]
- [ ] **CANON-0035:** No integration tests for Firestore rules (emulator-based)
      `firestore.rules` [E2]
- [ ] **CANON-0036:** Security-critical files have low test coverage
      (account-link `account-linking.ts` [E2]
- [ ] **CANON-0037:** Potential rate limit bypass via cycling anonymous accounts
      ( `auth-context.tsx` [E2]
- [ ] **CANON-0038:** Potential sensitive data in localStorage (needs audit)
      `N/A` [E2]
- [ ] **CANON-0106:** Fix journal entry type mismatch `N/A` [E0]
- [ ] **CANON-0115:** Remove deprecated saveNotebookJournalEntry `N/A` [E2]
- [ ] **CANON-0116:** Separate domain/transport in useJournal `N/A` [E2]
- [ ] **CANON-0119:** Reduce 'use client' directives `N/A` [E2]
- [ ] **CANON-0120:** Explicit client providers wrapper `N/A` [E1]
- [ ] **CANON-0124:** Fix TodayPage subscription bug `N/A` [E0]
- [ ] **CANON-0125:** Lazy load notebook modules `N/A` [E2]
- [ ] **CANON-0136:** Add Firestore rules emulator tests `N/A` [E2]
- [ ] **CANON-0137:** Increase security file coverage `N/A` [E2]
- [ ] **CANON-0148:** Fix broken relative links `N/A` [E1]
- [ ] **CANON-0149:** Replace [X] placeholders `N/A` [E1]
- [ ] **CANON-0163:** Add npm audit + CodeQL + Dependabot `N/A` [E2]
- [ ] **CANON-0164:** Add gcloud setup to deploy workflow `N/A` [E1]
- [ ] **CANON-0170:** Item Name `N/A` [E0]

### Backlog Items (S2)

- [ ] **CANON-0039:** Unsafe type assertions with 'as unknown as' (worksheet +
      rel `Step1WorksheetCard.tsx`
- [ ] **CANON-0040:** ESLint security plugin warnings in scripts (unsafe regex /
      n `check-review-needed.js`
- [ ] **CANON-0041:** Unsafe localStorage JSON.parse in use-smart-prompts hook
      `use-smart-prompts.ts`
- [ ] **CANON-0043:** Inconsistent httpsCallable typing (missing generic
      request/r `firestore-service.ts`
- [ ] **CANON-0045:** Journal entry schema data is weakly typed (z.record
      unknown; `schemas.ts`
- [ ] **CANON-0046:** No tests for useJournal hook `use-journal.ts`
- [ ] **CANON-0107:** Add error.message null safety `N/A`
- [ ] **CANON-0108:** Safe localStorage JSON.parse `N/A`
- [ ] **CANON-0109:** Add .strict() to Zod schemas `N/A`
- [ ] **CANON-0110:** Replace unsafe type assertions `N/A`
- [ ] **CANON-0111:** Single source for journal types `N/A`
- [ ] **CANON-0112:** Type httpsCallable generics `N/A`
- [ ] **CANON-0117:** Create callSecureFunction wrapper `N/A`
- [ ] **CANON-0118:** Shared reCAPTCHA action constants `N/A`
- [ ] **CANON-0121:** Create typed collection helpers `N/A`
- [ ] **CANON-0122:** Clarify FirestoreAdapter boundary `N/A`
- [ ] **CANON-0123:** Audit inventory dual-write pattern `N/A`
- [ ] **CANON-0126:** Complete Sentry integration `N/A`
- [ ] **CANON-0127:** Add reduced-motion to animations `N/A`
- [ ] **CANON-0128:** Add React.memo to list components `N/A`
- ... and 22 more S2 items

### Nice-to-Have (S3): 21 items

_See MASTER_FINDINGS.jsonl for full list_

---

## M2.3-REF (19 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0067:** 47 CRITICAL cognitive complexity violations in scripts (19
      f `assign-review-tier.js` [E3]
- [ ] **CANON-0023:** Deprecated saveNotebookJournalEntry still used in 6+ UI
      comp `firestore-service.ts` [E2]
- [ ] **CANON-0030:** Console.\* usage in app components bypasses standardized
      logg `library.ts` [E1]
- [ ] **CANON-0032:** Critical logic divergence in journal saving (deprecated
      Fire `firestore-service.ts` [E1]
- [ ] **CANON-0068:** Journal entry type definitions diverge between client
      types `journal.ts` [E2]
- [ ] **CANON-0069:** useJournal mixes domain logic with transport
      (httpsCallable `use-journal.ts` [E2]

### Backlog Items (S2)

- [ ] **CANON-0042:** Inconsistent Firebase Functions import pattern (static vs
      dy `firestore-service.ts`
- [ ] **CANON-0044:** useJournal sets up its own auth listener instead of using
      sh `use-journal.ts`
- [ ] **CANON-0070:** Critical paths have low test coverage
      (firestore-service 35. `firestore-service.ts`
- [ ] **CANON-0071:** Firebase collection access scattered across 22+ files
      withou `slogans.ts`
- [ ] **CANON-0072:** Dual-write pattern to inventory AND journal collections
      `SpotCheckCard.tsx`
- [ ] **CANON-0073:** Deprecated API usage (31 instances) + Nested ternaries (41
      i `multiple`
- [ ] **CANON-0074:** FirestoreAdapter exists but is unused (realtime boundary
      unc `firestore-adapter.ts`

### Nice-to-Have (S3): 6 items

_See MASTER_FINDINGS.jsonl for full list_

---

## M4.5 Security & Privacy (17 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0050:** reCAPTCHA token missing does not block requests (logs but
      co `security-wrapper.ts` [E1]
- [ ] **CANON-0051:** Rate limiting is incomplete (no IP throttling, admin
      endpoin `security-wrapper.ts` [E2]
- [ ] **CANON-0099:** Restore client App Check init `N/A` [E1]
- [ ] **CANON-0100:** Admin-claim rules defense-in-depth `N/A` [E2]
- [ ] **CANON-0101:** Verify reCAPTCHA coverage `N/A` [E1]
- [ ] **CANON-0102:** Rate limit bypass mitigation `N/A` [E2]
- [ ] **CANON-0103:** Audit localStorage for sensitive data `N/A` [E2]

### Backlog Items (S2)

- [ ] **CANON-0052:** Zod schemas missing .strict() (unknown fields accepted)
      `schemas.ts`
- [ ] **CANON-0053:** Server-side journal entry type enum missing
      'step-1-workshee `schemas.ts`
- [ ] **CANON-0054:** Permissive z.record(..., z.unknown()) allows arbitrary
      neste `schemas.ts`
- [ ] **CANON-0055:** Some admin-managed collections allow direct client writes
      wi `firestore.rules`
- [ ] **CANON-0104:** Address ESLint security warnings `N/A`
- [ ] **CANON-0105:** Route admin writes through Functions `N/A`

### Nice-to-Have (S3): 4 items

_See MASTER_FINDINGS.jsonl for full list_

---

## Track B (18 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0011:** 16 broken anchor links detected by docs:check
      `SESSION_CONTEXT.md:47` [E1]
- [ ] **CANON-0012:** 20 placeholder issues across 5 template instances
      `PERFORMANCE_AUDIT_PLAN_2026_Q1.md:1` [E1]
- [ ] **CANON-0077:** Broken relative links in review/output docs (wrong ../
      depth `CODE_REVIEW_2026_Q1.md` [E1]
- [ ] **CANON-0078:** [X] placeholders remain in 2026-Q1 plan instances
      `CODE_REVIEW_PLAN_2026_Q1.md` [E1]

### Backlog Items (S2)

- [ ] **CANON-0013:** 99 files fail docs:check (313 errors, 177 warnings)
      `README.md:1`
- [ ] **CANON-0014:** 15 recent commits touch docs but AUDIT_TRACKER shows only
      5 ``
- [ ] **CANON-0079:** DOCUMENTATION_INDEX.md orphaned and missing required
      section `DOCUMENTATION_INDEX.md`
- [ ] **CANON-0080:** Tier 2 docs missing required metadata (Document Version,
      App `ANTIGRAVITY_GUIDE.md`
- [ ] **CANON-0081:** Standards/templates contain live placeholder links and
      incor `DOCUMENTATION_STANDARDS.md`
- [ ] **CANON-0082:** DOCUMENT_DEPENDENCIES.md claims SYNCED but has 30+ issues
      `DOCUMENT_DEPENDENCIES.md`
- [ ] **CANON-0083:** PR_REVIEW_PROMPT_TEMPLATE lacks required metadata and
      versio `PR_REVIEW_PROMPT_TEMPLATE.md`
- [ ] **CANON-0084:** CODE_PATTERNS.md referenced with incorrect path
      `CODE_PATTERNS.md`

### Nice-to-Have (S3): 6 items

_See MASTER_FINDINGS.jsonl for full list_

---

## Track D (17 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0090:** Automation scripts have critically low test coverage (2-7%
      o `` [E2]
- [ ] **CANON-0091:** Deploy workflow calls gcloud without installing Google
      Cloud `deploy-firebase.yml` [E1]

### Backlog Items (S2)

- [ ] **CANON-0007:** GitHub Actions using version tags instead of commit SHAs
      `auto-label-review-tier.yml:18`
- [ ] **CANON-0021:** Artifact upload without retention policy `ci.yml:99`
- [ ] **CANON-0022:** Git diff with @{u}...HEAD fails on new branches without
      upst `pre-push:48`
- [ ] **CANON-0092:** Pre-commit hook runs full test suite causing slow commits
      (~ `pre-commit`
- [ ] **CANON-0093:** Auto-label workflow has invalid if: expression syntax
      `auto-label-review-tier.yml`

### Nice-to-Have (S3): 10 items

_See MASTER_FINDINGS.jsonl for full list_

---

## Track E (3 findings)

### Backlog Items (S2)

- [ ] **CANON-0027:** No scripts/doctor.js for environment validation ``

### Nice-to-Have (S3): 2 items

_See MASTER_FINDINGS.jsonl for full list_

---

## Track P (11 findings)

### Priority Items (S0/S1)

- [ ] **CANON-0056:** Landing page forced to client-side rendering blocks SSR
      for `page.tsx` [E2]
- [ ] **CANON-0057:** Notebook module registry eagerly imports all pages
      `roadmap-modules.tsx` [E2]

### Backlog Items (S2)

- [ ] **CANON-0058:** Sentry integration incomplete - no Web Vitals reporting
      `sentry.client.ts`
- [ ] **CANON-0059:** Celebration animations create 150+ DOM elements without
      redu `confetti-burst.tsx`
- [ ] **CANON-0060:** No React.memo usage causes unnecessary re-renders in list
      co `entry-card.tsx`
- [ ] **CANON-0061:** Meeting map renders all markers without clustering
      `page.tsx`
- [ ] **CANON-0062:** Console statements in production code `use-journal.ts`
- [ ] **CANON-0063:** Firebase queries lack consistent indexing and limits
      `meetings.ts`
- [ ] **CANON-0064:** Step1WorksheetCard excessive complexity (804 lines)
      `Step1WorksheetCard.tsx`
- [ ] **CANON-0065:** No route-level loading UI (loading.tsx) or Suspense
      boundari `page.tsx`
- [ ] **CANON-0066:** JournalHub eagerly imports all entry forms
      `journal-hub.tsx`

---
