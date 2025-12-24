# SoNash Product Roadmap

**Last Updated:** December 23, 2025
**Status:** Canonical roadmap - supersedes all previous roadmap documents

---

## 🎯 Vision

Build a comprehensive, secure digital recovery notebook that helps individuals track their sobriety journey with privacy-first design and evidence-based recovery practices.

---

## 📊 Milestones Overview

| Milestone | Status | Progress | Target | Priority |
|-----------|--------|----------|--------|----------|
| **M0 - Baseline** | ✅ Complete | 100% | Q4 2025 | Foundation |
| **M1 - Foundation** | 🔄 In Progress | ~85% | Q1 2026 | P0 |
| **M1.5 - Quick Wins** | 🔄 In Progress | ~40% | Q1 2026 | P0 |
| **M1.6 - Admin Panel + UX** | 🔄 In Progress | ~65% | Q1 2026 | P1 |
| **M2 - Architecture** | ⏸️ Optional | 0% | As needed | P2 |
| **M3 - Meetings** | 📋 Planned | 0% | Q2 2026 | P1 |
| **M4 - Expansion** | 📋 Planned | 0% | Q2 2026 | P1 |
| **M5 - Inventories** | 📋 Planned | 0% | Q3 2026 | P1 |
| **M6 - Prayers** | 📋 Planned | 0% | Q3 2026 | P2 |
| **M7 - Fellowship** | 📋 Planned | 0% | Q4 2026 | P1 |
| **M8 - Speakers** | 📋 Planned | 0% | Q4 2026 | P2 |
| **M10 - Monetization** | 🔬 Research | 0% | 2027 | P2 |

**Overall Progress:** ~26%

---

## 🚀 M0 - Baseline & Alignment (✅ Complete)

### Objectives

- Establish project documentation and success metrics
- Define owners and reporting cadence

### Deliverables

- ✅ Canonical roadmap published
- ✅ Definitions of Done for each milestone
- ✅ Initial KPI tracking

---

## 🏗️ M1 - Stabilize & De-Risk Foundation (🔄 In Progress)

**Goal:** Improve stability, reduce time-to-fix, establish engineering guardrails

### Week 1-3: Security Hardening (✅ Complete)

- ⏸️ Firebase App Check with reCAPTCHA v3 *(deferred - blocking users, see [recaptcha_removal_guide.md](./recaptcha_removal_guide.md))*
- ✅ Server-side validation (Zod schemas in Cloud Functions)
- ✅ Rate limiting (10 req/min per user)
- ✅ Firestore security rules hardened
- ✅ Audit logging for security events
- ✅ GDPR data export/deletion
- ✅ Account linking (anonymous → permanent)
- ✅ Billing alerts ($50, $100, $500)
- ✅ Incident response runbook

**Documentation:** See [docs/SECURITY.md](./docs/SECURITY.md), [docs/INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md), [docs/SERVER_SIDE_SECURITY.md](./docs/SERVER_SIDE_SECURITY.md)

### Week 4-6: Monitoring & Observability (✅ Foundation Complete)

- ✅ Sentry error monitoring configured
- ✅ Security audit logging (Cloud Logging)
- ⏸️ *Additional monitoring moved to M2 (Technical Debt)*

### Week 7-9: Code Quality (✅ Foundation Complete)

- ✅ ESLint configuration (0 errors, 29 warnings)
- ✅ TypeScript strict mode
- ✅ Test coverage: 97.8% (89/91 passing)
- ⏸️ *CI/CD and automation moved to M2 (Technical Debt)*

### Week 10-12: Code Remediation (📋 Planned)

*Based on December 2025 multi-model code analysis (6 AI reviewers)*

#### Critical Security Fixes (✅ Complete - Dec 20, 2025)

- ✅ Close Firestore rules bypass for `daily_logs` (remove direct client write)
- ✅ Fix rate limiter fail-open vulnerability (change to fail-closed)
- ✅ Protect admin reset functionality (dev-only mode)
- ✅ Refactor SSR unsafe exports in `lib/firebase.ts` (proxy guards)

#### High-Priority Bug Fixes (✅ Complete - Dec 20, 2025)

*Note: Most fixes were already implemented in prior sessions, verified during Dec 20 analysis*

- ✅ Date handling standardization (`getTodayDateId()` in `date-utils.ts`)
- ✅ Listener memory leak prevention (`isMounted` pattern in `today-page.tsx`)
- ✅ useEffect dependency optimization (`isEditingRef` instead of state)
- ✅ Auto-save race condition fix (`pendingSaveRef` + `saveScheduledRef` pattern)
- ✅ Resources page auth race condition (`if (authLoading) return` gate)
- ✅ Add pagination to large queries (meetings: 50, journal: 100)

#### Code Quality Improvements (✅ Complete - Dec 20, 2025)

- ✅ Refactor monolithic components - *Extracted: CleanTimeDisplay, MoodSelector, CheckInQuestions, RecoveryNotepad*
- ✅ App Check debug token production guard (in `lib/firebase.ts`)
- ✅ Onboarding AnimatePresence fix - *Verified correct*

#### Phase 4 Backlog (✅ Complete - Dec 20, 2025)

*All items completed during comprehensive December 2025 code remediation*

- ✅ Font loading optimization (3 fonts with `display: swap`, reduced from 20+)
- ✅ Code splitting (dynamic imports for MeetingMap and heavy components)
- ✅ Unused dependencies cleanup (removed `embla-carousel-react`, `input-otp`)
- ✅ Production-aware logging (logger.ts only logs errors in production)
- ✅ Component documentation (JSDoc) - *Added to extracted components, firestore-service.ts*
- ✅ Accessibility improvements (ARIA labels) - *Added rolegroup, radiogroup, live regions*

**Analysis Report:** See [docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md](./docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md)

**Testing Guide:** See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md), [docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md)

### Week 13+: Multi-AI Security Review Remediation (🔄 In Progress - Dec 21, 2025)

*Based on December 21, 2025 multi-AI code review (5 models: CODEX, GEMINI, JULES, CLAUDE, CLAUDE CODE)*

**Analysis Results:**
- **Total Issues Identified:** 95 → **71 TRUE OPEN** (after verification)
- **Sources:** 5 new AI models + baseline 6-model aggregation
- **Report:** See artifacts - `AUTHORITATIVE_ISSUE_REPORT.md`

#### Critical Security Fixes (Week 13 - Immediate)

- ✅ **Journal Collection Security Gap** (JULES #3) - ✅ **FIXED (Verified Dec 21, 2025)**
  - **Issue:** `journal` collection allows direct client writes while `daily_logs` properly blocks them
  - **Impact:** Bypasses rate limiting and App Check completely
  - **Fix:** Block direct writes in `firestore.rules:35-40`, create `saveJournalEntry` Cloud Function
  - **Status:** Verified complete - identical security to daily_logs
  - **Priority:** ~~IMMEDIATE~~ COMPLETE

- ✅ **Account Linking Data Loss** (CODEX #5) - ✅ **FIXED Dec 21, 2025**
  - **Issue:** When credential-already-in-use, signs into existing account WITHOUT migrating anonymous data
  - **Impact:** Users lose anonymous journal data
  - **Fix:** ✅ Implemented data migration Cloud Function with smart conflict resolution
  - **Status:** Deployed to production (sonash-app)
  - **Future Enhancement:** Full conflict resolution UI (see M1.5 Planned)

#### High-Priority Fixes (Week 13-14)

- ✅ **Test Assertions Don't Match Implementation** (CLAUDE CODE #1) - ⏳ **DEFERRED**
  - Tests mock direct Firestore but implementation uses Cloud Functions
  - Impact: False confidence - tests pass but don't reflect actual behavior
  - Fix: Rewrite tests to mock `httpsCallable`
  - Status: Deferred - not blocking production, can address in future sprint

- ✅ **Feature Flag System Non-Functional** (CLAUDE CODE #3) - ✅ **FIXED Dec 21, 2025**
  - Issue: `featureFlagEnabled()` always returns true (was hardcoded)
  - Impact: Cannot gate features, staged rollouts impossible
  - Fix: ✅ Implemented proper environment variable reading with Next.js integration
  - Status: Working - supports `NEXT_PUBLIC_*` flags for staged rollouts

- ✅ **Timeline Array Mutation** - ✅ **FIXED Dec 21, 2025**
  - One-line fix (`[...entries].sort()`)
  - Status: Deployed

- ✅ **Error Handling Missing** - ✅ **FIXED Dec 21, 2025**
  - Added try/finally to links-tab, prayers-tab
  - Status: Deployed

- ❌ **Daily Log History Ordering** - ✅ **VERIFIED CORRECT Dec 21, 2025**
  - Reviewed alignment of dateId vs date field
  - Status: Already working correctly, no action needed

- ❌ **Account Linking Production Errors** - 🐛 **DISCOVERED Dec 21, 2025**
  - Google OAuth fails with COOP (Cross-Origin-Opener-Policy) errors
  - Email/password linking fails with 400 Bad Request
  - Impact: Users cannot link accounts, migration function untested
  - Fix: Update Firebase Hosting headers in `firebase.json`
  - Priority: HIGH - blocks account linking feature

- ❌ **Missing Rate Limiting** - saveInventoryEntry, getHistory, getInventoryEntries
- ❌ **Onboarding Overwrites Profiles** - Check existing profile before recreate
- ❌ **Composite Indexes Missing** - Library queries need indexes

#### Medium Priority (Week 15-16)

- Firestore rules overly permissive for user profiles
- Delete operations without GDPR audit logging
- Date validation missing in Cloud Function
- localStorage unencrypted for journal data
- Inefficient meeting sorting (parseTime regex)
- Nested context providers cause re-renders
- Monolithic components remain (ResourcesPage, AllMeetingsPage)
- TypeScript strict flags missing (noUncheckedIndexedAccess)
- useAuth deprecated but still used
- *[32 total medium priority issues - see report for complete list]*

#### Low Priority (Week 17+)

- Debug console.log statements in production code
- Console logs expose configuration
- README lacks setup instructions
- *[24 total low priority issues - see report for complete list]*

**Total Remediation Estimate:** ~110-120 hours across all priorities

### Week 14+: Consolidated 6-AI Code Review Remediation (🔄 In Progress - Dec 23-24, 2025)

*Based on December 23-24, 2025 consolidated multi-AI code review (6 models: Claude Code, Codex, Jules, Kimi K2, Claude, Claude Opus 4.5)*

**Analysis Results:**
- **Total Raw Findings:** 85 → **~42 Deduplicated Issues**
- **Consensus Score:** 6.3/10
- **Report:** See [SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md](./SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md)

**Priority Distribution:**
- Critical: 5 issues (build blockers + security bypasses)
- High: 8 issues (data loss risks + performance)
- Medium: 17 issues (code quality + architecture)
- Low: 10 issues (cleanup + documentation)

#### P0 - Immediate Blockers (Week 14 - Critical)

**Package Version Fixes** (5 min effort)
- ❌ **C1: Next.js 16.1.0 Does Not Exist** - ✅ **FALSE POSITIVE - COMPLETED Dec 24, 2025**
  - **Issue:** Review claimed Next.js 16.x doesn't exist; latest stable is 15.x
  - **Reality:** Next.js 16.1.0 DOES exist (latest is 16.1.1)
  - **Fix Applied:** Updated to `"next": "^16.1.1"`
  - **Reports:** All 6 AI models flagged this (all models had outdated knowledge)
  - **Status:** Packages verified via npm registry, updated to latest patch version

- ❌ **C2: Zod 4.1.13 Does Not Exist** - ✅ **FALSE POSITIVE - COMPLETED Dec 24, 2025**
  - **Issue:** Review claimed Zod 4.x doesn't exist; latest stable is 3.23.x
  - **Reality:** Zod 4.1.13 DOES exist (latest is 4.2.1)
  - **Fix Applied:** Updated to `"zod": "^4.2.1"`
  - **Reports:** R6 only (single source, incorrect information)
  - **Status:** Packages verified via npm registry, updated to latest patch version

- 🔄 **C5: React 19 is Release Candidate** - ✅ **FALSE POSITIVE - COMPLETED Dec 24, 2025**
  - **Issue:** Review claimed React 19.2.0 was RC status as of late 2024
  - **Reality:** React 19 IS STABLE (latest is 19.2.3)
  - **Fix Applied:** Updated to `"react": "19.2.3"`, `"react-dom": "19.2.3"`
  - **Reports:** All 6 AI models flagged this (all models had outdated knowledge)
  - **Status:** All package versions verified and updated

**Security Bypasses** (2-4 hr effort)
- ✅ **C4: Journal Collection Bypasses Cloud Functions** - ✅ **ALREADY FIXED**
  - **Status:** Verified fixed in Week 13 (identical to daily_logs security)
  - **Cross-reference:** Week 13+ Critical Security Fixes

- ⏸️ **C3: App Check Not Initialized on Client** (lib/firebase.ts)
  - **Issue:** Cloud Functions enforce App Check, but client never initializes it
  - **Impact:** All callable functions fail with "App Check verification failed"
  - **Fix:** Initialize App Check with reCAPTCHA v3 provider
  - **Status:** Deferred - see M1 Week 1-3 and [recaptcha_removal_guide.md](./recaptcha_removal_guide.md)
  - **Reports:** R2, R4, R6 (3 models)
  - **Priority:** P2 - implement after M3+ unless bot abuse becomes significant

#### P1 - Short-Term Fixes (Week 14-15 - High Priority)

**Data Integrity & Migration** (3-4 hr effort)
- ✅ **H1: Migration Batch Exceeds 500-Operation Limit** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** `migrateAnonymousUserData` aggregates all user documents into single batch
  - **Impact:** Users with >500 documents experienced failed migrations, data loss
  - **Fix Applied:** Implemented batch chunking with 499-operation limit per batch
  - **Implementation:** Changed `forEach` to `for...of`, added `addToBatch` helper that creates new batch when limit reached
  - **Trade-off:** Not fully atomic across batches (sequential commits), but better than complete failure
  - **Reports:** R3, R5 (2 models)
  - **Status:** Supports unlimited document migration, prevents data loss for power users

- ✅ **H4: No Rollback for Migration Failures** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** Batch writes have no rollback mechanism if partially failed
  - **Impact:** Data corruption or loss during account linking on network failures
  - **Fix Applied:** Added partial success tracking with detailed error reporting
  - **Implementation:**
    * Track successful batch count before each commit
    * Log PARTIAL_MIGRATION_FAILURE with batch details to Sentry
    * Return user-facing error: "Migration partially completed: X/Y batches succeeded"
    * Client-side already shows: "Some data may not have transferred. Please check your journal."
  - **Limitation:** True rollback impossible (Firestore doesn't support transactions >500 ops)
  - **Reports:** R6 only
  - **Status:** Best-effort solution given Firestore constraints; provides visibility into partial migrations

**Error Handling & UX** (3-4 hr effort)
- ✅ **H5: Auth Error Leaves Indefinite Loading** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** If anonymous sign-in fails repeatedly, UI shows indefinite loading
  - **Impact:** Users stuck on loading screen if Firebase auth fails
  - **Fix Applied:** Added retry mechanism with exponential backoff
  - **Implementation:**
    * 3 retries with 1s, 2s, 4s delays (exponential backoff)
    * User-facing error messages after max retries
    * Detailed logging for each attempt
    * Sets loading=false after final failure
  - **Reports:** R5, R6 (2 models)
  - **Status:** Users no longer stuck on indefinite loading

- ✅ **H6: Silent Data Loss in addEntry** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** `addEntry` catches errors but doesn't notify components of failures
  - **Impact:** Users believe entries are saved when they may have failed
  - **Fix Applied:** Changed return type to `Promise<{ success: boolean; error?: string }>`
  - **Implementation:**
    * Returns `{ success: true }` on successful save
    * Returns `{ success: false, error: "message" }` on failure
    * User-friendly error messages for rate limiting & App Check failures
    * Components can now show appropriate feedback to users
  - **Reports:** R6 (1 model)
  - **Status:** Users now receive clear feedback about save success/failure

**Performance & Memory** (1-2 hr effort)
- ✅ **H7: Journal Snapshot Listener Memory Leak** - ✅ **ALREADY FIXED**
  - **Status:** Fixed in Week 10-12 via `isMounted` pattern
  - **Cross-reference:** Week 10-12 High-Priority Bug Fixes

- ✅ **H8: Journal Query Has No Pagination** - ✅ **ALREADY FIXED**
  - **Status:** Fixed in Week 10-12 (pagination added, limit 100)
  - **Cross-reference:** Week 10-12 High-Priority Bug Fixes

**Security Gaps** (2-3 hr effort)
- ✅ **H3: Inventory Bypasses Rate Limiting** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** Inventory entries written directly from client using `setDoc`
  - **Impact:** Unprotected against rapid write attacks
  - **Fix Applied:** Created `saveInventoryEntry` Cloud Function with full security stack
  - **Implementation:**
    * Created `inventoryEntrySchema` in functions/src/schemas.ts
    * Created Cloud Function with rate limiting (10 req/min), Zod validation, App Check
    * Updated client-side to call Cloud Function via `httpsCallable`
    * Updated Firestore rules: `allow create, update: if false` (blocks direct writes)
    * Security layers now consistent: daily_logs, journal, inventory all use Cloud Functions
  - **Reports:** R3, R5 (2 models)
  - **Cross-reference:** Week 13+ Missing Rate Limiting
  - **Status:** Inventory entries now have same security as journal & daily logs

**Admin Panel Issues** (30 min effort)
- ✅ **H2: Admin Mobile Detection Logic Missing** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** Admin page defines `mobile` state but no detection logic in useEffect
  - **Impact:** Desktop-only security restriction ineffective
  - **Fix Applied:** Added mobile detection at start of useEffect
  - **Implementation:**
    * User agent regex: `/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)`
    * Window width check: `window.innerWidth < 768`
    * Sets state to "mobile" and returns early before auth check
  - **Reports:** R4 only
  - **Status:** Desktop-only restriction now enforced properly

#### P2 - Medium-Term Improvements (Week 15-17 - Code Quality)

**Architecture & Maintainability** (6-8 hr effort)
- ⏳ **M1: Cloud Functions Code Duplication** (functions/src/index.ts)
  - **Issue:** `saveDailyLog`, `saveJournalEntry`, `migrateAnonymousUserData` have identical boilerplate
  - **Impact:** Maintenance burden, inconsistent behavior risk
  - **Fix:** Extract `withSecurityChecks()` wrapper function
  - **Reports:** R1, R3 (2 models)
  - **Effort:** 2 hours
  - **Milestone:** M2 (Architecture Refactor) or M1 cleanup

- ⏳ **M2: FirestoreService is a God Object** (lib/firestore-service.ts)
  - **Issue:** 300-400+ line file manages all Firestore operations (daily logs, journal, inventory, history)
  - **Impact:** Hard to test, maintain, and extend; security models obscured
  - **Fix:** Split into `DailyLogService`, `JournalService`, `InventoryService`
  - **Reports:** R3, R5, R6 (3 models)
  - **Effort:** 4 hours
  - **Milestone:** M2 (Architecture Refactor)

**Error Handling Consistency** (4-6 hr effort)
- ⏳ **M3: Error Handling Gaps in Contexts** (multiple context files)
  - **Issue:** Various contexts lack proper error handling (daily-log-context, profile-context, use-journal)
  - **Impact:** Users see stale data with no feedback; unhandled rejections
  - **Fix:** Implement consistent error state pattern across all contexts
  - **Reports:** R1, R2, R4, R5, R6 (5 models - high consensus)
  - **Effort:** 4 hours
  - **Priority:** MEDIUM - UX quality

**Bug Fixes** (3-4 hr effort)
- ⏳ **M4: Meeting Countdown Date Calculation Wrong** (components/widgets/compact-meeting-countdown.tsx:40-56)
  - **Issue:** Only handles "today" or "tomorrow"; meetings 2+ days away show incorrect countdown
  - **Impact:** Incorrect time remaining for future meetings
  - **Fix:** Proper day-of-week calculation with wrap-around
  - **Reports:** R5 (1 model)
  - **Effort:** 1 hour

- ⏳ **M5: Missing Null Guards on entry.data** (components/journal/entry-detail-dialog.tsx, entry-feed.tsx)
  - **Issue:** Direct access to nested properties without null/undefined checks
  - **Impact:** Application crashes with incomplete or corrupted data
  - **Fix:** Add optional chaining `entry.data?.mood ?? '😐'`
  - **Reports:** R5 (1 model)
  - **Effort:** 2 hours

**Dependencies & Configuration** (1-2 hr effort)
- ✅ **M6: @dataconnect/generated Path Missing** - ✅ **COMPLETED Dec 24, 2025**
  - **Issue:** Dependency references `file:src/dataconnect-generated` which doesn't exist
  - **Impact:** npm install fails for new developers
  - **Fix Applied:** Removed unused dependency from package.json
  - **Verification:** Directory doesn't exist, not used in codebase (only in package.json)
  - **Reports:** R5 (1 model)
  - **Status:** Dependency removed, npm install successful

- ✅ **M7: Rate Limiter Fail-Closed Strategy** - ✅ **ALREADY FIXED**
  - **Status:** Fixed in Week 10-12 (changed from fail-open to fail-closed)
  - **Cross-reference:** Week 10-12 Critical Security Fixes

- ⏳ **M8: Bundle Size with 34 Dependencies** (package.json:16-49)
  - **Issue:** Heavy libraries (Firebase, Framer Motion, Recharts, React Leaflet)
  - **Impact:** Slower initial page load, increased bandwidth for mobile users
  - **Fix:** Audit dependencies, remove unused packages, implement code splitting
  - **Reports:** R4 (1 model)
  - **Effort:** 2 hours
  - **Note:** Code splitting already partially done in Week 10-12
  - **Milestone:** M2 (Performance optimization)

**Security Hardening** (2-3 hr effort)
- ⏳ **M9: Rate Limiter Reveals Timing Info** (functions/src/firestore-rate-limiter.ts:64-67)
  - **Issue:** Error messages reveal exact limits and retry timing
  - **Impact:** Helps attackers optimize abuse timing
  - **Fix:** Generic error message + server-side logging only
  - **Reports:** R6 (1 model)
  - **Effort:** 30 minutes

- ⏳ **M10: Cloud Functions Excluded from ESLint** (eslint.config.mjs:17)
  - **Issue:** `functions/**` directory excluded from linting
  - **Impact:** Security-critical backend code not linted; bugs undetected
  - **Fix:** Create separate ESLint config for functions or include in main config
  - **Reports:** R6 (1 model)
  - **Effort:** 1 hour

- ⏳ **M11: generateSearchableText XSS Risk** (hooks/use-journal.ts:42-77)
  - **Issue:** Concatenates user input without sanitization; stored XSS if rendered in admin panel
  - **Impact:** Potential stored XSS if searchable text displayed without escaping
  - **Fix:** Sanitize input or ensure all rendering uses proper escaping
  - **Reports:** R6 (1 model)
  - **Effort:** 1 hour

**Data Handling** (2-3 hr effort)
- ✅ **M12: Date Timezone Handling Inconsistent** - ✅ **ALREADY ADDRESSED**
  - **Status:** Addressed via `getTodayDateId()` standardization in Week 10-12
  - **Cross-reference:** Week 10-12 High-Priority Bug Fixes

- ⏳ **M13: Duplicate Zod Schemas** (functions/src/schemas.ts, functions/src/admin.ts:14-46)
  - **Issue:** Zod validation schemas duplicated between files
  - **Impact:** Schema changes must be made in multiple places; validation inconsistencies
  - **Fix:** Consolidate all schemas in `schemas.ts` and import
  - **Reports:** R6 (1 model)
  - **Effort:** 1 hour

- ⏳ **M14: No Retry Logic for Cloud Functions** (lib/firestore-service.ts:151)
  - **Issue:** Cloud Function calls have no retry logic; single network blip causes failure
  - **Impact:** Poor UX on unreliable networks; perceived app instability
  - **Fix:** Implement retry with exponential backoff for transient failures
  - **Reports:** R6 (1 model)
  - **Effort:** 2 hours

**Expected Behavior (Documentation Only)**
- ℹ️ **M15: Client-Side Validation Bypassable** (lib/security/firestore-validation.ts)
  - **Note:** Expected behavior in defense-in-depth model
  - **Status:** Server-side enforcement via Cloud Functions and Firestore rules is the actual security boundary
  - **Action:** Documentation issue, not a vulnerability
  - **Reports:** R4 (1 model)

- ⏳ **M16: getUserProfile Returns Null for Both Not-Found and Error** (lib/db/users.ts:83-99)
  - **Issue:** Function returns `null` for both "profile not found" and "error fetching profile"
  - **Impact:** Real errors silently swallowed; network errors appear same as new users
  - **Fix:** Return discriminated union type `ProfileResult`
  - **Reports:** R5 (1 model)
  - **Effort:** 1 hour

- ⏳ **M17: Onboarding Wizard is 515 Lines** (components/onboarding/onboarding-wizard.tsx)
  - **Issue:** Single component with 5 different step views embedded inline
  - **Impact:** Reduced maintainability, harder to test individual steps
  - **Fix:** Extract each step into own component (WelcomeStep, CleanDateStep, etc.)
  - **Reports:** R1 (1 model)
  - **Effort:** 3 hours
  - **Priority:** LOW - works fine, refactor when needed

#### P3 - Low Priority Cleanup (Week 17+ - Polish)

**Code Cleanup** (1-2 hr effort)
- ⏳ **L1: Unused `_bounds` Variable** (components/maps/meeting-map.tsx:28)
  - **Fix:** Remove unused variable entirely
  - **Effort:** 5 minutes

- ⏳ **L2: Duplicate Comment** (lib/firestore-service.ts:229-230)
  - **Fix:** Remove duplicate `// Get history of logs` comment
  - **Effort:** 5 minutes

- ⏳ **L5: Record<string, any> Loses Type Safety** (functions/src/admin.ts:492, functions/src/index.ts:492)
  - **Fix:** Define `MigrationMergeData` interface
  - **Effort:** 30 minutes

- ⏳ **L8: Dead getMoodEmoji Function** (components/journal/entry-card.tsx:39-46)
  - **Fix:** Remove unused function
  - **Effort:** 5 minutes

**Performance Optimizations** (1-2 hr effort)
- ⏳ **L3: Leaflet Icons from External CDN** (components/maps/meeting-map.tsx:13-16)
  - **Issue:** Loading marker icons from CDN on every component mount
  - **Impact:** Slower rendering, dependency on external CDN
  - **Fix:** Bundle icons locally or use inline SVG
  - **Effort:** 1 hour

- ⏳ **L4: Unused rate-limiter-flexible Dependency** (functions/package.json:21)
  - **Issue:** Package listed but custom `FirestoreRateLimiter` used instead
  - **Impact:** Bloated function deployment size
  - **Fix:** Remove unused dependency
  - **Effort:** 5 minutes

**Configuration Updates** (30 min effort)
- ⏳ **L6: TypeScript Target es2017 Outdated** (functions/tsconfig.json:11)
  - **Issue:** Target is `es2017`, but Node 22 supports ES2022+
  - **Fix:** Update target to `es2022`
  - **Effort:** 5 minutes

- ⏳ **L7: Duplicate Type Definitions** (types/journal.ts, lib/types/daily-log.ts)
  - **Issue:** `DailyLog` and `DailyLogEntry` similar but different
  - **Fix:** Consolidate or add documentation explaining when to use each
  - **Effort:** 30 minutes

- ⏳ **L9: Magic Numbers Throughout** (multiple files)
  - **Issue:** `limit(100)`, `limit(30)`, `points: 10`, `duration: 60`, `timeout: 5000`
  - **Fix:** Extract to named constants in `lib/constants.ts`
  - **Effort:** 1 hour

**Documentation** (2-4 hr effort)
- ⏳ **L10: Missing README and Documentation** (repository root)
  - **Issue:** No comprehensive README, setup instructions, or architecture overview
  - **Fix:**
    - Add comprehensive README.md with setup instructions
    - Create ARCHITECTURE.md explaining split context pattern
    - Add JSDoc comments to Cloud Functions
  - **Reports:** R1, R5, R6 (3 models)
  - **Effort:** 4 hours
  - **Priority:** LOW - internal project

**Status Summary:**
- ✅ Already Fixed (Pre-review): 5 issues (C4, H7, H8, M7, M12)
- ✅ Completed Dec 24 (P0): 4 issues (C1, C2, C5, M6)
- ✅ Completed Dec 24 (P1): 6 issues (H1, H2, H3, H4, H5, H6)
- ⚠️ False Positives: 3 issues (C1, C2, C5 - AI models had outdated knowledge)
- ⏸️ Deferred: 1 issue (C3 - App Check)
- ⏳ Planned: 21 medium/low priority issues
- ℹ️ Documentation Only: 1 issue (M15)

**Actual Time Spent:**
- P0 (Immediate): ✅ COMPLETE - 30 min (false positives + dependency cleanup)
- P1 (Short-term): ✅ COMPLETE - ~7.5 hours (6 issues: H1=2h, H2=0.5h, H3=2h, H4=2h, H5=1h, H6=1h)
- P2 (Medium-term): ⏳ PLANNED - ~24-34 hours (21 issues remaining)
- P3 (Low priority): ⏳ PLANNED - ~8-12 hours (included in P2)
- **Total Completed: ~8 hours** | **Total Remaining: ~32-46 hours** (down from ~48-69 hours)

---

## ⚡ M1.5 - Quick Wins (🔄 In Progress)

**Goal:** High-impact, low-effort features that improve user experience

### Completed

- ✅ Journal system consolidation (single-save architecture)
- ✅ Entry type separation (mood stamps, stickers, notes)
- ✅ Timeline filter ribbons
- ✅ User error notifications (Sonner toasts)
- ✅ Firestore indexes for performance
- ✅ UI Polish (Notebook Cover typography, Recovery Prayers formatting)

**Documentation:** See [docs/JOURNAL_SYSTEM_UPDATE.md](./docs/JOURNAL_SYSTEM_UPDATE.md) for complete changelog

### In Progress

- 🔄 Settings page UI
- 🔄 Profile management
- 🔄 Clean date picker improvements
- ✅ **The Library Tab** (10 SP) - Content hub consolidating:
  - ✅ Glossary (searchable recovery terms)
  - ✅ Meeting Etiquette guide
  - ✅ Quick Links (AA/NA sites, hotlines)
  - ✅ Prayers (CMS-managed)

### Planned Quick Wins (Priority Order)

#### P0 - Critical UX

1. **Recovery Library** (✅ Complete)
   - ✅ Glossary of recovery terms, slogans, abbreviations
   - ✅ Meeting etiquette guide for first-timers
   - ✅ Searchable reference material

2. **Expanded Onboarding Wizard** (8-13 SP)
   - Program selection (AA/NA/CA/Smart Recovery)
   - Sobriety/clean date setup with guidance
   - Stage-of-recovery assessment
   - Notification preferences
   - Privacy walkthrough (what data is collected)
   - Home screen customization (choose visible widgets)
   - Sponsor contact setup (optional)
   - Skip option for returning users

3. **Sponsor Personalization System** (8-13 SP)
   - **Leverages:** `hasSponsor` data from onboarding
   - **Sponsor Contact Management:**
     - Add sponsor name, phone, email
     - Quick-dial from app
     - Track last contact date
     - Set reminder frequency
   - **Personalized Prompts:**
     - "Have you called your sponsor today?" (if `hasSponsor === 'yes'`)
     - "Consider finding a sponsor" nudges (if `hasSponsor === 'no'`)
     - Meeting etiquette tips for sponsor-seekers (if `hasSponsor === 'looking'`)
   - **Step Work Integration:**
     - Encourage sponsor involvement for Step 4-9
     - "Share with sponsor" quick action for inventory entries
   - **Analytics Tracking:**
     - Sponsor contact frequency
     - Retention comparison (sponsored vs non-sponsored users)
     - Feature usage by sponsor status
   - **Why:** Fulfills onboarding promise of personalization, proven retention booster

4. **Stage-of-Recovery Selector** (4 SP)
   - Adjusts app emphasis based on user stage
   - Newcomer vs old-timer focus

4. **"I Made It Through Today" Button** (2 SP)
   - End-of-day celebration/affirmation
   - Builds positive reinforcement

#### P1 - High Value

5. **HALT Check** (4 SP)
   - Hungry/Angry/Lonely/Tired assessment
   - User-initiated button for self-check

6. **User Documentation & Help System** (5-8 SP)
   - Getting started guide for new users
   - Feature explanations (daily check-in, journal, growth tools)
   - Recovery program primer (12 steps overview)
   - FAQ section (account, privacy, data)
   - In-app tooltips for key features
   - Optional: Interactive tutorial/walkthrough on first launch
   - **Why:** Reduces confusion, improves onboarding, helps users get value faster

7. **Sober Fun Ideas Generator** (3 SP)
   - Random activities for boredom
   - Relapse prevention tool

7. **"Meetings Starting Soon" Filter** (3 SP)
   - Shows meetings within next hour
   - Location-based proximity

#### P2 - Nice to Have

8. **Sobriety Clock with Minutes** (2 SP)
   - Important for early recovery (0-90 days)
   - Feasibility check required

9. **"Too Tired" Mode** (3 SP)
   - Reduces night review to 3 questions
   - Prevents fatigue-based abandonment

10. **Disguised App Icon + Name** (5 SP)

- Privacy layer for device sharing
- "Journal" or neutral branding

---

## 🖥️ M1.6 - Admin Panel + Today Page Enhancement (🔄 In Progress)

**Goal:** Operational monitoring for admins + dramatically improved user experience for Today page

**Detailed Specification:** See [SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md](./SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md) (v1.4)

**Phase 1 Prompt:** See [SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md](./SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md)

### Current Admin Infrastructure

| Component | Status |
|-----------|--------|
| Admin route (`/app/admin/`) | ✅ Exists |
| Tab navigation (8 tabs) | ✅ Exists |
| `AdminCrudTable<T>` component | ✅ Exists |
| Cloud Functions auth (`requireAdmin()`) | ✅ Exists |
| Firestore rules (`isAdmin()`) | ✅ Exists |
| Sentry integration | ✅ Exists |
| `logSecurityEvent()` → GCP Cloud Logging | ✅ Exists |
| Server-side admin route protection | ⚠️ Missing (Phase 1) |

### Security Requirements (v1.2)

All admin Cloud Functions MUST:
- Call `requireAdmin(request)` as first operation
- Enforce App Check (`enforceAppCheck: true`)
- Return only non-sensitive aggregated data
- Hash/redact user identifiers in responses
- Log admin actions via `logSecurityEvent()` to GCP Cloud Logging (immutable)
- **Keep API tokens server-side only** (never expose to client)

### Phase 1: Dashboard + Foundations (✅ Complete - Dec 23, 2025)

**Priority:** High | **Effort:** Medium | **Value:** High

- [x] ~~Server-side middleware~~ (Deferred - client-side protection sufficient)
- [x] System health at a glance (Firestore, Auth, Functions status)
- [x] Active user metrics (24h, 7d, 30d)
- [x] Recent signups list
- [x] Background jobs status overview
- [x] Throttled `lastActive` timestamp tracking (15 min via localStorage)
- [x] Firestore rules for `/_health` and `/admin_jobs`

**Cloud Functions Deployed:**
- `adminHealthCheck` - Tests Firestore/Auth connectivity
- `adminGetDashboardStats` - Returns user counts, signups, job statuses

### Phase 2: Enhanced User Lookup (✅ Complete - Dec 23, 2025)

**Priority:** High | **Effort:** Medium | **Value:** High

- [x] Search users by email, UID, or nickname
- [x] User detail drawer with full profile
- [x] Activity timeline (daily logs, journal entries)
- [x] Account actions (disable user)
- [x] Admin notes field
- [x] All admin actions logged to GCP Cloud Logging

**Cloud Functions Deployed:**
- `adminSearchUsers` - Search by email/UID/nickname
- `adminGetUserDetail` - Full user profile + activity
- `adminUpdateUser` - Update user fields (admin notes)
- `adminDisableUser` - Disable/enable user accounts

### Phase 3: Background Jobs Monitoring (✅ Complete - Dec 23, 2025)

**Priority:** Medium | **Effort:** Low | **Value:** Medium

- [x] Jobs registry in Firestore (`admin_jobs` collection)
- [x] Job wrapper for status tracking (with `logSecurityEvent()`)
- [x] Jobs tab UI
- [x] Manual trigger capability
- [x] Scheduled `cleanupOldRateLimits` (daily 3 AM CT)

**Cloud Functions Deployed:**
- `adminTriggerJob` - Manual job execution
- `adminGetJobsStatus` - Job status retrieval
- `scheduledCleanupRateLimits` - Daily rate limit cleanup

### Today Page Enhancement - UX Polish (✅ Complete - Dec 23, 2025)

**Priority:** High | **Effort:** Medium | **Value:** High — dramatically improved user experience

**Objectives:**
- [x] Progressive check-in flow with visual progress indicator
- [x] Loading states and skeleton screens
- [x] Enhanced visual feedback (animations, scale effects, glow)
- [x] Mobile-specific improvements (larger touch targets, active states)
- [x] Quick actions FAB with 4 shortcuts
- [x] Smart defaults with contextual prompts (3 types)
- [x] Enhanced mood selector with keyboard shortcuts (1-4 keys)
- [x] Data visualization enhancements (progress bars)
- [x] Accessibility improvements (ARIA labels, keyboard navigation)
- [x] Offline-first enhancement with network status indicator
- [x] Code quality improvements (custom hooks, localStorage persistence)

**New Components Created (6):**
- `TodayPageSkeleton` - Loading state skeleton screen
- `CheckInProgress` - Step-by-step progress indicator
- `QuickActionsFab` - Floating action button with 4 shortcuts (z-index fix applied)
- `EnhancedMoodSelector` - Mood picker with keyboard shortcuts (1-4)
- `SmartPrompt` - Contextual AI-driven suggestions
- `OfflineIndicator` - Network status awareness

**Custom Hooks Created (2):**
- `useSmartPrompts` - Smart prompt visibility + localStorage persistence
- `useScrollToSection` - Scroll management with useEffect (no setTimeout)

**Key Features:**
- **3 Smart Prompts:** Evening check-in reminder (6-10 PM), HALT suggestion when struggling, streak celebration (7+ days)
- **localStorage Persistence:** Dismissed prompts persist per day (`dismissed-prompts-YYYY-MM-DD`)
- **Keyboard Shortcuts:** Press 1-4 to select mood on desktop
- **Code Quality:** Fixed critical Qodo bug (invalid `:has-text()` selector), extracted hooks for separation of concerns

**Files Changed:**
- 8 new files (6 components + 2 hooks)
- 1 major refactor (`components/notebook/pages/today-page.tsx`)

### Today Page Mobile Layout Reordering (📋 HIGH PRIORITY - Next Up)

**Priority:** High | **Effort:** Low-Medium | **Value:** High — improves mobile UX flow

**Objective:** Reorder Today page components on mobile to follow a more logical progression from quick info to detailed reflection.

**Current Mobile Order:**
1. Check-In (mood, cravings, used)
2. HALT Check
3. "I Made It Through Today" button
4. Weekly Stats
5. Time Tracker
6. Daily Quote
7. Today's Reading
8. Recovery Notepad

**Desired Mobile Order:**
1. **Time Tracker** (clean time display)
2. **Daily Quote** (inspiration)
3. **Today's Reading** (external links)
4. **Check-In** (mood, cravings, used)
5. **HALT Check** (self-assessment)
6. **"I Made It Through Today"** (celebration button)
7. **Weekly Stats** (progress summary)
8. **Recovery Notepad** (free-form journaling)

**Rationale:**
- Start with quick, passive content (tracker, quote, reading)
- Move to active engagement (check-in, HALT)
- End with reflection tools (notepad)
- Maintains 2-column desktop grid layout

**Technical Approach:**
- Use CSS flexbox with `order` property on mobile
- Preserve `md:grid md:grid-cols-2` on desktop
- Individual `order-X` classes per component (avoid wrapper divs that create layout gaps)
- Test thoroughly to prevent desktop layout regression

**Previous Attempt:** Dec 23, 2025 - Caused desktop layout gaps, reverted
**Next Attempt:** Use more conservative approach with minimal DOM changes

### Phase 4: Error Tracking - Sentry Integration (📋 Planned)

**Priority:** High | **Effort:** Low-Medium | **Value:** High

**Approach:** Hybrid summary + deep links via Cloud Function (token never exposed to client)

- [ ] `adminGetSentryErrorSummary` Cloud Function (server-side API call)
- [ ] Error summary card on Dashboard (count + trend)
- [ ] Errors tab with recent errors in plain English
- [ ] Deep links to Sentry for each error
- [ ] User ID correlation (link to user detail if available)

**Environment Variables (Cloud Functions only):** `SENTRY_API_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

### Phase 5: System Logs - GCP Integration (📋 Planned)

**Priority:** Medium | **Effort:** Low | **Value:** Medium

**Approach:** Recent events + deep links (don't rebuild GCP logging UI)

- [ ] Recent security events display (from existing `logSecurityEvent()`)
- [ ] Deep link to GCP Cloud Logging Console (pre-filtered)
- [ ] Verify log retention configured (90+ days)
- [ ] Optional: Log sink for long-term archival

**Note:** Security/audit logs remain in GCP Cloud Logging (immutable, compliant) — no Firestore `admin_logs` collection.

### Phase 6: Customizable Quick Actions (📋 Planned)

**Priority:** Medium | **Effort:** Medium | **Value:** High — personalized user experience

**Approach:** User-configurable FAB with Firestore preferences

**Objectives:**
- [ ] Settings panel for Quick Actions customization (More tab → Settings)
- [ ] Action selection (choose which actions to show)
- [ ] Action ordering (drag-and-drop reordering)
- [ ] Custom phone numbers (sponsor, support contacts)
- [ ] Save preferences to user profile (Firestore)
- [ ] Fallback to sensible defaults for new users

**Use Cases:**
1. **Power User:** Removes "Quick Mood" (doesn't use it), adds custom sponsor phone
2. **Minimalist:** Shows only 2 actions (Call Sponsor, Community)
3. **Meeting-Focused:** Reorders to prioritize Community at top
4. **Contact-Heavy:** Adds multiple phone numbers (sponsor, accountability partner, hotline)

**New Files:**
- `components/settings/quick-actions-settings.tsx` - Settings panel UI
- `lib/quick-actions-config.ts` - Default actions + validation

**Modified Files:**
- `components/notebook/features/quick-actions-fab.tsx` - Load user preferences
- `firestore.rules` - Allow user to read/write `users/{uid}/preferences/quickActions`

**Technical Details:**
- **Data Model:** `QuickActionsPreferences` in `/users/{uid}/preferences`
- **Action Types:** navigation (NotebookModuleId), phone (tel: link), custom (URL)
- **Max Actions:** 6 (performance limit)
- **Drag-and-Drop:** Using `@dnd-kit/core`
- **Phone Validation:** Standard phone number format checking

**Future Enhancements:**
- Action templates (e.g., "Meeting-Focused", "Contact-Heavy")
- Share action configurations with other users
- Analytics on most-used actions
- Suggested actions based on usage patterns

### New Firestore Collections

```
/admin_jobs/{jobId}       - Background job registry
/_health/ping             - Health check document
```

### Success Metrics

| Metric | Target |
|--------|--------|
| Time to identify issue | < 2 minutes |
| Dashboard load time | < 3 seconds |
| Error visibility | 100% of Cloud Function errors |
| Job failure detection | < 1 hour after failure |

---

## 🏛️ M2 - Architecture Refactor (⏸️ Optional)

**Goal:** Reduce technical debt only if friction prevents progress

### Deferred Foundation Work

**From M1 - Monitoring & Observability:**
- ⏳ Performance monitoring (page load times, API latency)
- ⏳ User analytics baseline (DAU, retention, feature usage)
- ⏳ Alert thresholds defined (automated error/performance alerts)

**From M1 - Code Quality & Automation:**
- ⏳ CI/CD pipeline setup (GitHub Actions or similar)
- ⏳ Automated testing in PR workflow
- ⏳ Client-side rate limiting in firestore-service.ts

**From M1 - Security Hardening:**
- ⏳ Firebase App Check with reCAPTCHA *(deferred due to authentication blocking issues)*
- See [recaptcha_removal_guide.md](./recaptcha_removal_guide.md) for:
  - Complete removal instructions (Firebase Console, Google Cloud, codebase)
  - Fresh implementation guide (8 phases with detailed steps)
  - Troubleshooting and rollback plans
- **Priority:** P2 - Implement after M3+ unless bot abuse becomes significant

### Potential Architecture Work

- ⏳ Component library consolidation
- ⏳ State management standardization
- ⏳ API abstraction layer
- ⏳ Database schema optimization
- ⏳ Admin route middleware (server-side protection for `/admin/*`)

**Trigger:** Only pursue if M3+ blocked by technical limitations or if scaling reveals performance issues

**Priority:** Low - Foundation is solid, focus on features first

---

## 🗓️ M3 - Meetings & Location (📋 Planned - Q2 2026)

**Story Points:** 84 SP | **Priority:** P1

### Features

#### F1: Meeting Proximity Detection (21 SP)

- Real-time "meetings near me" based on GPS
- Distance calculation and sorting
- Map view integration
- Filter by fellowship type (AA/NA/CA/etc)

#### F2: Meeting Notes (13 SP)

- In-app note capture during meetings
- "What did you commit to?" prompts
- Auto-link to journal timeline
- Export/share capabilities

#### F3: Calendar Integration (26 SP)

- Sync favorite meetings to device calendar
- Reminder notifications
- iCal export for external apps
- Recurring event support

#### F4: Virtual Meeting Support (13 SP)

- Zoom/Google Meet link integration
- Online meeting directory
- One-tap join from app
- Hybrid in-person/virtual tracking

#### F5: Enhanced Meeting Data (11 SP)

- User reviews and ratings
- Accessibility information
- Special requirements (smoking, childcare, etc)
- Meeting type badges (Step Study, Big Book, Speaker)

**Dependencies:**

- Google Maps API integration
- Calendar API permissions
- Meeting data scraping/partnership

---

## 🎯 M4 - Feature Expansion (📋 Planned - Q2 2026)

**Goal:** Extend core functionality based on M1-M3 learnings

### Potential Features (TBD)

- Multiple sobriety dates (separate counters per substance)
- Tone/language settings (firm vs gentle)
- Craving countdown timer ("ride it out" feature)
- Auto-carry-forward task nudges

### HALT Check Enhancements
*Building on the basic HALT check feature from M1.5*

**Phase 2: Analytics & Insights**
- Pattern detection: "You often feel tired on Mondays"
- Weekly/monthly HALT summaries with visualization
- Correlation analysis with mood and usage patterns
- Trend graphs showing HALT frequency over time

**Phase 3: Smart Features**
- Predictive alerts: "You usually feel lonely at this time"
- Context-aware suggestions based on historical patterns
- Reminder system for regular HALT checks (customizable schedule)
- Integration with meeting finder when lonely detected
- Integration with sponsor contact when angry/lonely

**Phase 4: Community & AI**
- Anonymous aggregate insights: "Others often feel the same today"
- AI-powered coping strategy recommendations
- Guided meditation/breathing exercises for anger/stress
- Connection to support community during vulnerability
- Emergency escalation for critical patterns

**Story Points:** 26-34 SP (distributed across phases)  
**Priority:** P2 (nice-to-have, builds on core feature)

---

## 📝 M5 - Nightly Inventories (📋 Planned - Q3 2026)

**Story Points:** 116 SP | **Priority:** P1

### Features

#### F1: 10th Step Inventory Tool (47 SP)

- Structured inventory prompts (AA Big Book format)
- Character defects checklist
- Assets vs defects tracking
- Progress over time visualization

#### F2: Inventory Templates (21 SP)

- Multiple formats (AA, NA, custom)
- User-created templates
- Share templates with sponsor

#### F3: Amends Tracker (26 SP)

- List of people harmed
- Amends completion status
- Notes and reflections
- Privacy controls (sponsor-only sharing)

#### F4: Pattern Recognition (22 SP)

- AI-powered theme detection
- Recurring character defects
- Trigger identification
- Insights dashboard

**Dependencies:**

- Secure storage (encrypted at rest)
- Sponsor sharing permissions
- AI/ML analysis (optional)

---

## 🙏 M6 - Prayers & Meditations (📋 Planned - Q3 2026)

**Story Points:** 63 SP | **Priority:** P2

### Features

#### F1: Prayer Library (21 SP)

- AA-approved prayers (Serenity Prayer, 3rd Step, 7th Step)
- NA prayers and meditations
- Custom prayer creation
- Favorites and bookmarks

#### F2: Daily Meditation (16 SP)

- Just for Today (NA)
- Daily Reflections (AA)
- 24 Hours a Day
- Push notification reminders

#### F3: Guided Meditation (26 SP)

- Audio meditation tracks
- Mindfulness exercises
- Breath work timers
- Progress tracking

**Content Licensing:**

- Requires AA/NA permissions for copyrighted material
- Partnership with publishers (Hazelden, NA World Services)

---

## 🤝 M7 - Fellowship & Support (📋 Planned - Q4 2026)

**Story Points:** 100 SP | **Priority:** P1

### Features

#### F1: Sponsor Connection (32 SP)

- Sponsor contact quick-dial
- "I need help" emergency button
- Sponsor chat/messaging
- Sponsor dashboard (view sponsee progress)

#### F2: Phone List (21 SP)

- Fellowship phone directory
- Favorites and groups
- One-tap calling
- SMS integration

#### F3: Support Network (26 SP)

- Create accountability circles
- Group check-ins
- Shared gratitude lists
- Peer encouragement system

#### F4: Milestone Celebrations (11 SP)

- Auto-detect sobriety milestones (30/60/90 days, 1 year)
- Shareable celebration graphics
- Notify sponsor/support network
- Digital chips and badges

#### F5: Gamification (Optional) (10 SP)

- Principle-based badges (honesty, service)
- Streak tracking (journal entries, meeting attendance)
- No shame/punishment mechanics
- Focus on growth, not competition

**Privacy Considerations:**

- Optional feature (opt-in only)
- User controls visibility settings
- Anonymous participation option

---

## 🎤 M8 - Speaker Recordings (📋 Planned - Q4 2026)

**Story Points:** 63 SP | **Priority:** P2

### Features

#### F1: Speaker Library (26 SP)

- Curated AA/NA speaker recordings
- Search by topic (resentments, relationships, Step 4)
- Favorites and playlists
- Download for offline listening

#### F2: Personal Recording (21 SP)

- Record own shares/qualifications
- Private journal audio entries
- Transcription (AI-powered)
- Organize by topic/date

#### F3: Audio Player (16 SP)

- Playback controls
- Speed adjustment
- Sleep timer
- Resume from last position

**Content Licensing:**

- AA/NA speaker permissions
- Copyright compliance
- Content moderation

---

## 💰 M10 - Monetization Strategy (🔬 Research - 2027)

**Goal:** Sustainable revenue model without exploiting vulnerable users

**Detailed Research:** See [docs/MONETIZATION_RESEARCH.md](./docs/MONETIZATION_RESEARCH.md)

### Research Findings (December 2025)

#### Rejected Models

- ❌ Freemium with paywalls (blocks critical recovery tools)
- ❌ Ads (privacy violations, triggers)
- ❌ Data monetization (unethical, illegal in recovery context)

#### Viable Options

**1. Premium Features (Ethical Freemium)**

- ✅ Free: All core recovery tools (journal, meetings, inventories)
- 💰 Premium: Advanced analytics, speaker library, offline mode
- **Pricing:** $2.99/month or $19.99/year
- **Positioning:** "Support SoNash, unlock extras"

**2. Donation Model**

- ✅ "Pay what you can" philosophy (AA 7th Tradition)
- Optional recurring donations
- Transparent expense reporting
- No feature gating

**3. B2B Licensing**

- Treatment centers license app for clients
- Sober living facilities bulk subscriptions
- Institutional pricing ($5-10/user/month)
- White-label options

**4. Hybrid Approach (Recommended)**

- Free tier: 100% of core features
- Optional premium: $2.99/month (power users)
- Institutional partnerships: Recurring revenue
- Donation option: Community support

**Next Steps:**

1. Launch free product to build user base
2. Measure engagement and retention (M3-M8)
3. Survey users about willingness to pay
4. Pilot premium tier Q1 2027

---

## 🖥️ Desktop/Web Enhancements

**Goal:** Leverage full browser capabilities for power users

### Multi-Panel Layout (21 SP)

- Split-screen views (timeline + detail)
- Dashboard mode (4-panel grid)
- Resizable panels
- Keyboard shortcuts

### Advanced Visualizations (34 SP)

- Mood heat map (calendar view)
- Correlation matrix (meetings ↔ mood)
- Trend lines (multiple metrics)
- Word clouds from journal entries
- Export charts as PNG/SVG

### Keyboard Shortcuts (8 SP)

- `J/K`: Navigate timeline
- `N`: New journal entry
- `G + T`: Go to Today tab
- `?`: Keyboard shortcuts help
- Vim-style navigation (optional)

### Export & Backup (13 SP)

- CSV/JSON/PDF export
- Automated cloud backup
- Local file download
- Sponsor report generation

### Search & Filter (21 SP)

- Full-text search across all entries
- Advanced filters (date range, mood, type)
- Saved searches
- Search suggestions

---

## 🎨 Feature Decisions (Quick Reference)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Recovery Library | ✅ Approved | P0 | Combine glossary + etiquette |
| HALT Check | ✅ Approved | P1 | User-initiated button |
| God Box | ❌ Deferred | P3 | Maybe never |
| Complacency Detector | ⏳ Needs Review | P2 | Engagement drop alerts |
| Tone Settings | ⏳ Needs Review | P1 | Firm vs gentle language |
| Multiple Sobriety Dates | ⏳ Needs Review | P2 | Separate counters per substance |
| Principle-Based Badges | ✅ Approved | P2 | Honesty/service vs streaks |

---

## 📏 Success Metrics

### User Engagement

- Daily Active Users (DAU)
- Weekly journal entries per user
- Average session duration
- Feature adoption rate

### Retention

- 7-day retention rate (target: >40%)
- 30-day retention rate (target: >25%)
- 90-day retention rate (target: >15%)

### Recovery Outcomes

- Days clean tracking
- Meeting attendance frequency
- Journal consistency (entries per week)
- Spot check completion rate

### Technical Health

- Error rate (target: <1%)
- API response time (target: <200ms)
- App crash rate (target: <0.1%)
- Security incidents (target: 0)

---

## 🔄 Agile Process

### Sprint Cadence

- **Sprint Length:** 2 weeks
- **Planning:** Every other Monday
- **Retrospective:** Every other Friday
- **Daily Standups:** Async (Slack/Discord)

### Story Point Scale

- 1-2 SP: <1 day
- 3-5 SP: 1-2 days
- 8 SP: 1 week
- 13 SP: 1-2 weeks
- 21+ SP: Break into smaller stories

### Definition of Done

- ✅ Code reviewed
- ✅ Tests written and passing
- ✅ Documentation updated
- ✅ Deployed to staging
- ✅ Manual QA complete
- ✅ Security review (if applicable)

---

## 📚 References

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer setup and testing guide
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - QA testing procedures
- **[AI_HANDOFF.md](./AI_HANDOFF.md)** - Current sprint focus
- **[SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md](./SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md)** - Consolidated 6-AI code review report (M1 Week 14+)
- **[SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md](./SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)** - Admin panel enhancement specification (M1.6)
- **[SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md](./SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md)** - Phase 1 implementation prompt

### Detailed Documentation (in /docs)

- **[SECURITY.md](./docs/SECURITY.md)** - Security layers, data classification, privacy protections
- **[INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md)** - Security incident procedures
- **[MONETIZATION_RESEARCH.md](./docs/MONETIZATION_RESEARCH.md)** - Revenue model research and recommendations (M10)
- **[JOURNAL_SYSTEM_UPDATE.md](./docs/JOURNAL_SYSTEM_UPDATE.md)** - December 2025 journal refactor changelog
- **[TESTING_PLAN.md](./docs/TESTING_PLAN.md)** - Comprehensive testing strategy and multi-phase fixes
- **[SERVER_SIDE_SECURITY.md](./docs/SERVER_SIDE_SECURITY.md)** - Cloud Functions security patterns
- **[ANTIGRAVITY_GUIDE.md](./docs/ANTIGRAVITY_GUIDE.md)** - AI agent collaboration guide
- **[LIBRARY_ANALYSIS.md](./docs/LIBRARY_ANALYSIS.md)** - Dependency documentation (192k+ code snippets)
- **[firestore-rules.md](./docs/firestore-rules.md)** - Firestore security rules documentation

### Archived Documentation

- **[docs/archive/](./docs/archive/)** - Historical documents, proposals, and status reports

---

**Document History:**

- December 24, 2025: Added Week 14+ Consolidated 6-AI Code Review Remediation section - Integrated findings from 6-model consolidated review (Claude Code, Codex, Jules, Kimi K2, Claude, Claude Opus 4.5). 42 deduplicated issues organized by priority (P0-P3): 9 critical/high priority issues requiring action, 5 already fixed, 1 deferred (App Check), 22 medium/low priority planned. Estimated remediation: ~48-69 hours. Report: [SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md](./SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md). M1 progress remains ~85% (new findings extend completion timeline).
- December 23, 2025: M1.6 updated to v1.4 - Phases 1-3 complete, Today Page Enhancement complete (all 10 UX improvements), added Phase 6 (Customizable Quick Actions). Renamed to "M1.6 - Admin Panel + Today Page Enhancement". Progress updated to ~65%. Overall roadmap progress: ~26%.
- December 22, 2025: Updated Phase 1 prompt to v1.3 (fail-closed middleware, nodejs runtime, bounded queries, invalid date guards)
- December 22, 2025: Updated M1.6 to v1.2 spec (server-side middleware, Sentry API in Cloud Function, throttled lastActive, robust job wrapper)
- December 22, 2025: Updated M1.6 to v1.1 spec (hybrid Sentry/GCP approach, explicit security requirements)
- December 22, 2025: Added M1.6 Admin Panel Enhancement milestone (5 phases)
- December 19, 2025: Consolidated from ROADMAP_V3.md, WEB_ENHANCEMENTS_ROADMAP.md, FEATURE_DECISIONS.md
- December 18, 2025: M1 security hardening completed
- December 17, 2025: Journal system refactor completed
