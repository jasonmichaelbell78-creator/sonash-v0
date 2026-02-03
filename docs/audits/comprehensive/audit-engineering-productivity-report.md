# Engineering Productivity Audit Report

**Date:** 2026-02-03 **Auditor:** Claude Code (claude-opus-4-5-20251101)
**Scope:** Golden Path & DX, Debugging Ergonomics, Offline Support **Type:**
Comprehensive (single-session)

---

## Executive Summary

This audit evaluates the SoNash codebase for engineering productivity, focusing
on developer experience, debugging capabilities, and offline support. The audit
identifies 12 findings across 3 categories, with significant progress since the
prior audit (2026-01-17) but critical gaps remaining in offline support.

**Key Metrics Change from Prior Audit:**

| Metric                   | 2026-01-17  | 2026-02-03   | Change                      |
| ------------------------ | ----------- | ------------ | --------------------------- |
| npm scripts              | 42          | 64           | +22 (+52%)                  |
| logger.\* calls          | 394         | 173          | -221 (methodology change\*) |
| console.log calls        | 3111        | 156          | -2955 (cleaned up)          |
| Structured logging ratio | 1:8 (poor)  | 1:0.9 (good) | Improved                    |
| Service worker           | None        | None         | No change                   |
| Correlation ID support   | None        | None         | No change                   |
| Offline write queue      | None        | None         | No change                   |
| Firebase persistence     | Not enabled | Not enabled  | No change                   |

\*Note: Prior audit may have counted all logger imports/definitions; this audit
counts actual log calls.

---

## Baseline Metrics (2026-02-03)

| Metric                   | Value       | Notes                                  |
| ------------------------ | ----------- | -------------------------------------- |
| npm scripts              | 64          | Strong tooling ecosystem               |
| logger.\* calls          | 173         | Across 56 files                        |
| console.log calls        | 156         | Across 22 files (mostly scripts/tests) |
| Structured logging ratio | ~1:1        | Significant improvement                |
| localStorage usages      | 7           | Centralized in storage.ts              |
| IndexedDB usage          | 0           | Not implemented                        |
| Service worker           | None        | No offline caching                     |
| Correlation ID support   | None        | No request tracing                     |
| Offline write queue      | None        | No offline writes                      |
| Firebase persistence     | Not enabled | No offline reads                       |
| doctor.js script         | None        | No environment validation              |
| setup script             | None        | Multi-step manual setup                |

---

## Findings Summary

| Severity | Count | Categories                                  |
| -------- | ----- | ------------------------------------------- |
| S0       | 0     | -                                           |
| S1       | 3     | Offline (3)                                 |
| S2       | 5     | Golden Path (2), Debugging (2), Offline (1) |
| S3       | 4     | Golden Path (2), Debugging (1), Offline (1) |

**Total: 12 findings (0 S0, 3 S1, 5 S2, 4 S3)**

---

## Category 1: Golden Path & Developer Experience (4 findings)

### Current Golden Path

```
Setup:  git clone -> npm install -> cd functions && npm install -> copy .env.local -> firebase login
Dev:    npm run dev (online only, requires 2 terminals for emulators)
Test:   npm test
Deploy: git push (CI handles)
```

### Target Golden Path

```
Setup:  npm run setup (one command validates everything)
Dev:    npm run dev:offline (with emulators in single terminal)
Test:   npm test
Deploy: git push
Verify: npm run doctor (health check)
```

### Findings

| ID       | Severity | Effort | Title                                | Status    |
| -------- | -------- | ------ | ------------------------------------ | --------- |
| EFFP-001 | S2       | E1     | No `npm run dev:offline` script      | Carryover |
| EFFP-002 | S2       | E1     | No `scripts/doctor.js` validation    | Carryover |
| EFFP-003 | S3       | E1     | No single `npm run setup` command    | Carryover |
| EFFP-004 | S3       | E0     | 64 npm scripts without documentation | New       |

**Positive Finding:** Comprehensive tooling ecosystem with 64 npm scripts
covering:

- Documentation quality checks
- Pattern compliance
- Session management
- Security checks
- Audit validation
- Learning effectiveness analysis

---

## Category 2: Debugging Ergonomics (3 findings)

### Current State

**Logging Infrastructure:**

- Structured logger exists (`lib/logger.ts`) with Sentry integration
- PII redaction implemented (SENSITIVE_KEYS, sanitizeMessage)
- Production logs go to Sentry, dev logs to console
- ~1:1 ratio of logger to console.log (significant improvement from 1:8)

**Error Handling:**

- Error Knowledge Base (`lib/error-knowledge-base.ts`) with 13 error patterns
- Cloud Function error utilities (`lib/utils/callable-errors.ts`)
- User-friendly error messages with guidance
- ~100 instances of "Please try again" messages (could be more specific)

**Missing:**

- No correlation IDs for request tracing
- No way to trace a user journey from frontend to Cloud Functions
- Sentry integration works but lacks request context linking

### Findings

| ID       | Severity | Effort | Title                                            | Status    |
| -------- | -------- | ------ | ------------------------------------------------ | --------- |
| EFFP-005 | S2       | E2     | No correlation ID support for request tracing    | Carryover |
| EFFP-006 | S2       | E1     | Generic error messages lack specific remediation | New       |
| EFFP-007 | S3       | E1     | Error knowledge base incomplete                  | New       |

**Positive Findings:**

- Sentry integration is properly configured with privacy controls
- Error knowledge base provides actionable remediations for known errors
- Logger sanitizes PII before sending to Sentry
- Callable errors utility provides consistent error handling pattern

---

## Category 3: Offline Support (5 findings)

### Current State

**Critical Gap:** This is a recovery support app where users may have spotty
connectivity. Offline support is essential but currently non-existent.

**What Exists:**

- `OfflineIndicator` component shows network status
- PWA manifest configured
- Install prompt exists for PWA installation
- SSR-safe localStorage utilities

**What's Missing:**

- Firebase persistence NOT enabled (no offline reads)
- No service worker (app won't load offline)
- No offline write queue (writes fail immediately)
- No pending write indicators
- OfflineIndicator claims "changes will sync" but there's no sync mechanism

### Findings

| ID       | Severity | Effort | Title                                          | Status    |
| -------- | -------- | ------ | ---------------------------------------------- | --------- |
| EFFP-008 | S1       | E0     | Firebase persistence not enabled               | Carryover |
| EFFP-009 | S1       | E2     | No service worker for offline caching          | Carryover |
| EFFP-010 | S1       | E3     | No offline write queue                         | Carryover |
| EFFP-011 | S2       | E1     | OfflineIndicator misleading about sync         | New       |
| EFFP-012 | S3       | E1     | No network retry mechanism for failed requests | New       |

### Impact Analysis

**User Impact:**

- Users in areas with poor connectivity (common in recovery scenarios) lose all
  functionality
- Failed writes result in DATA LOSS with no recovery mechanism
- App cannot be used without network, defeating PWA purpose

**Business Risk:**

- Recovery app users are particularly vulnerable to connectivity issues
- Journal entries made during meetings (often in basements) may be lost
- User trust eroded when "changes will sync" message is false

---

## Quick Wins (E0-E1, High ROI)

### Immediate (< 1 hour each)

1. **EFFP-008: Enable Firebase Persistence**

   ```typescript
   // lib/firebase.ts - add after getFirestore()
   import { enableIndexedDbPersistence } from "firebase/firestore";
   enableIndexedDbPersistence(db).catch((err) => {
     if (err.code === "failed-precondition") {
       // Multiple tabs open, persistence can only be enabled in one tab at a time
       logger.warn("Persistence failed: multiple tabs open");
     } else if (err.code === "unimplemented") {
       // The current browser does not support all features needed for persistence
       logger.warn("Persistence not available in this browser");
     }
   });
   ```

   **Impact:** Enables offline reads immediately

2. **EFFP-004: Document npm scripts** Add comments to package.json or create
   SCRIPTS.md with descriptions

3. **EFFP-011: Fix OfflineIndicator message** Change "changes will sync when
   reconnected" to "some features may be unavailable"

### Short-term (1-4 hours)

4. **EFFP-001: Add dev:offline script**

   ```json
   "dev:offline": "concurrently \"firebase emulators:start\" \"npm run dev\""
   ```

5. **EFFP-002: Create doctor.js script** Check Node version, Firebase CLI, env
   vars, functions build status

6. **EFFP-003: Create setup script**
   ```json
   "setup": "npm install && cd functions && npm install && cd .. && node scripts/doctor.js"
   ```

---

## Comparison with Prior Audit (2026-01-17)

| This Audit | Prior Finding | Days Open | Status     |
| ---------- | ------------- | --------- | ---------- |
| EFFP-001   | EFF-001       | 17        | Still open |
| EFFP-002   | EFF-003       | 17        | Still open |
| EFFP-005   | EFF-006       | 17        | Still open |
| EFFP-008   | EFFP-008      | 17        | Still open |
| EFFP-009   | EFFP-009      | 17        | Still open |
| EFFP-010   | EFF-010       | 17        | Still open |

**6 of 12 findings are carryover from prior audit (17 days open)**

---

## Recommendations by Priority

### P1: Critical (This Week)

1. **Enable Firebase Persistence (EFFP-008)** - 30 minutes
   - Single line of code change
   - Immediate offline read support
   - No user-facing changes needed

2. **Fix OfflineIndicator message (EFFP-011)** - 15 minutes
   - Current message is misleading
   - User trust issue

### P2: High (Next Sprint)

3. **Add correlation IDs (EFFP-005)** - 4 hours
   - Generate UUID on client
   - Pass to Cloud Functions in headers
   - Include in logger context
   - Critical for debugging production issues

4. **Add service worker (EFFP-009)** - 8 hours
   - Use next-pwa or workbox
   - Cache app shell and static assets
   - Enables true offline loading

### P3: Medium (Next Month)

5. **Implement offline write queue (EFFP-010)** - 2-3 days
   - IndexedDB-based queue
   - Sync on reconnection
   - Conflict resolution strategy
   - UI for pending writes

6. **Golden path improvements (EFFP-001, 002, 003)** - 4 hours total
   - dev:offline script
   - doctor.js script
   - setup script

### P4: Low (Backlog)

7. **Error message improvements (EFFP-006, 007)**
8. **npm scripts documentation (EFFP-004)**
9. **Network retry mechanism (EFFP-012)**

---

## Positive Findings

1. **Massive logging improvement** - console.log to logger ratio went from 8:1
   to ~1:1
2. **Comprehensive tooling** - 64 npm scripts covering many development
   workflows
3. **Sentry integration working** - Privacy-preserving error monitoring
4. **Error knowledge base** - Actionable remediations for known errors
5. **SSR-safe storage utilities** - Proper localStorage guards
6. **PWA foundation exists** - Manifest and install prompt ready

---

## Technical Debt Impact

| Finding                | Tech Debt Type   | Impact Score |
| ---------------------- | ---------------- | ------------ |
| No offline persistence | Architectural    | High         |
| No correlation IDs     | Observability    | High         |
| No service worker      | PWA completeness | Medium       |
| No offline queue       | Data integrity   | Critical     |
| Missing setup scripts  | DX friction      | Low          |

---

## Verification Checklist

After implementing recommendations, verify:

- [ ] Firebase persistence enabled - check IndexedDB in DevTools
- [ ] OfflineIndicator shows accurate message
- [ ] Correlation IDs appear in Cloud Function logs
- [ ] Service worker caches app shell
- [ ] Offline queue shows pending writes
- [ ] `npm run setup` completes successfully
- [ ] `npm run dev:offline` starts both emulators and dev server
- [ ] `npm run doctor` validates environment

---

## Appendix: File References

| Area                    | Key Files                                                     |
| ----------------------- | ------------------------------------------------------------- |
| Firebase initialization | `lib/firebase.ts`                                             |
| Logger                  | `lib/logger.ts`                                               |
| Error handling          | `lib/utils/callable-errors.ts`, `lib/error-knowledge-base.ts` |
| Offline indicator       | `components/status/offline-indicator.tsx`                     |
| Storage utilities       | `lib/utils/storage.ts`                                        |
| Sentry config           | `lib/sentry.client.ts`                                        |
| PWA manifest            | `public/manifest.json`                                        |
| Install prompt          | `components/pwa/install-prompt.tsx`                           |

---

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0     | 2026-02-03 | Initial comprehensive engineering productivity audit |
