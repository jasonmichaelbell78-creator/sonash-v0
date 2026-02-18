# System Test Plan V2 — Second Gap Analysis Pass (In Progress)

**Status:** DRAFT — agents still researching, findings accumulating **Date:**
2026-02-18

## Cross-Cutting Findings (from direct codebase exploration)

### FINDING-X01: Zero Next.js Error/Loading/NotFound Boundary Pages

- **Impact:** All 7 page routes have no `error.tsx`, `loading.tsx`, or
  `not-found.tsx`
- **Routes found:** `/`, `/admin`, `/celebration-demo`, `/colors`, `/dev`,
  `/journal`, `/meetings/all`
- **Only 2 layouts exist:** `app/layout.tsx` (root) and `app/admin/layout.tsx`
- **No middleware.ts** at root level
- **Gap in plan:** Domain 6 mentions "missing error.tsx/loading.tsx" but doesn't
  enumerate all routes that need them. Should be explicit test: for each route
  in `app/*/page.tsx`, verify corresponding error boundary exists.

### FINDING-X02: lib/ Directory Structure Much Richer Than Plan Documents

The v1 plan mentions only `lib/firebase.ts`, `lib/firestore-service.ts`,
`lib/security/firestore-validation.ts`, and a few utils. Actual structure:

- `lib/auth/account-linking.ts`
- `lib/constants.ts` — NOT in plan
- `lib/contexts/admin-tab-context.tsx` — NOT in plan
- `lib/database/database-interface.ts` + `lib/database/firestore-adapter.ts` —
  NOT in plan (database abstraction layer!)
- `lib/db/` (8 files: collections, glossary, library, meetings, quotes, slogans,
  sober-living, users) — NOT in plan
- `lib/error-knowledge-base.ts` — NOT in plan
- `lib/hooks/use-tab-refresh.ts` — NOT in plan (also: hook in lib/ vs hooks/
  directory — consistency issue)
- `lib/recaptcha.ts` — partially mentioned
- `lib/sentry.client.ts` — NOT in plan at all
- `lib/types/` (3 files: daily-log.ts, firebase-guards.ts, firebase-types.ts) —
  NOT in plan
- `lib/utils/` (13 files) — only some mentioned
- `lib/utils.ts` (root-level) — NOT in plan, overlaps with `lib/utils/`
  directory
- **Gap:** Domain 6 Step 2 needs complete lib/ enumeration, not just selected
  highlights.

### FINDING-X03: Sentry Integration Not Covered Anywhere in Plan

- `components/providers/sentry-initializer.tsx` — initializes Sentry client-side
- `lib/sentry.client.ts` — Sentry client module
- `components/providers/auth-context.tsx` — calls `setSentryUser()`
- **Gap:** No domain covers: Is Sentry configured correctly? Is DSN set? Is PII
  handled? Is it disabled in dev? Does it capture the right errors?

### FINDING-X04: Component Directory Count Mismatch

- Plan says "19 subdirs in components/"
- Actual count: **18 subdirectories** (admin, auth, celebrations, desktop, dev,
  growth, home, journal, maps, meetings, notebook, onboarding, providers, pwa,
  settings, status, ui, widgets)
- Plus root-level components: `color-sampler.tsx`, `theme-provider.tsx`
- **Gap:** Plan needs accurate enumeration.

### FINDING-X05: 98 Components Use 'use client' — No Server Components

- Every component file has `'use client'` directive
- This means the app has effectively NO server components
- **Gap:** Domain 6 "Client/Server boundary audit" should verify this is
  intentional and document why (likely because of Firebase client SDK usage, but
  should be explicitly verified).

### FINDING-X06: Zero eslint-disable, Zero @ts-ignore in Source

- No `eslint-disable` comments found in any `.ts/.tsx/.js/.jsx/.mjs` file
- No `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` found
- Only 1 `any` type usage (in `components/notebook/pages/today-page.tsx`)
- **Impact on plan:** Domain 4 "ESLint disable comment audit" may find nothing —
  but the step should remain to verify this is maintained.

### FINDING-X07: 26 TODO Comments in Scripts + 1 in CI Workflows

- 8 script files contain 26 TODO comments total
- 1 TODO in `.github/workflows/auto-label-review-tier.yml` (already known)
- **Gap:** Domain 9 should include a TODO/FIXME audit as a specific step — each
  TODO should be evaluated for whether it represents incomplete functionality.

### FINDING-X08: Public Assets Need Verification

- `public/font-samples.html` — standalone HTML file, may not be needed in
  production
- `public/images/gemini-generated-image-*.{jpeg,png}` — AI-generated images with
  hash names (poor naming)
- `public/leaflet-icons/` — 4 marker icons for maps component
- `public/manifest.json` — PWA manifest (plan covers this)
- No service worker file in public/
- **Gap:** Domain 15 should include a public assets audit: verify all assets are
  referenced from code, no orphaned files, proper naming conventions.

### FINDING-X09: types/ Directory at Root Level

- `types/journal.ts` exists at root level
- But also `lib/types/` has type files
- **Gap:** Type definition organization should be part of Domain 6 code review —
  are types consistently located?

### FINDING-X10: 6 Console Statements in Production Components

- `components/admin/errors-tab.tsx` — 1 console statement
- `components/notebook/pages/today-page.tsx` — 4 console statements
- `components/admin/logs-tab.tsx` — 1 console statement
- **Gap:** Domain 6 "console.log in production code" search needs to cover
  these. Admin components may be acceptable, but `today-page.tsx` with 4
  statements needs review.

### FINDING-X11: Sentry in Cloud Functions — Separate Integration Not In Plan

- `functions/src/security-logger.ts` imports `@sentry/node` directly
- `initSentry()` is called at cold start in `functions/src/index.ts` line 40
- Sentry processes WARNING and ERROR security events, redacts PII before sending
- `flushSentry()` is exported but may not be called in all function paths
- **Gap:** Domain 7 needs a dedicated "Sentry integration in Cloud Functions"
  step:
  - Is SENTRY_DSN set in functions environment?
  - Is `flushSentry()` called before function returns?
  - Is PII redaction working correctly in `beforeSend`?
  - Is `tracesSampleRate: 0.1` appropriate?

### FINDING-X12: Hardcoded reCAPTCHA Site Key Fallback

- `functions/src/recaptcha-verify.ts` line 66:
  `const siteKey = process.env.RECAPTCHA_SITE_KEY || "6LdeazosAAAAAMDNCh1hTUDKh_UeS6xWY1-85B2O"`
- While reCAPTCHA site keys are semi-public (embedded in frontend HTML), having
  a hardcoded fallback in server code is a code quality issue
- **Gap:** Domain 7 and Domain 8 should both flag this — server code should
  require env vars, not have fallbacks.

### FINDING-X13: Missing Firestore Rule for security_logs Collection

- `functions/src/security-logger.ts` writes to `db.collection("security_logs")`
- `firestore.rules` has NO explicit rule for the `security_logs` collection
- Without an explicit rule, Firestore defaults to DENY — so this may work via
  Admin SDK only, which is correct
- BUT: the absence of an explicit rule means the intent isn't documented, and a
  future change could accidentally expose it
- **Gap:** Domain 8 should verify that `security_logs` has an explicit deny
  rule, and that every collection written by Cloud Functions has an explicit
  rule entry.

### FINDING-X14: Cloud Functions File Coverage Incomplete in Plan

The v1 plan mentions specific files but misses:

- `functions/src/recaptcha-verify.ts` — only mentioned in passing, needs full
  review (token verification, error handling, API interaction)
- `functions/src/security-logger.ts` — needs dedicated review (PII redaction,
  ReDoS protection, Firestore storage, Sentry integration)
- **Gap:** Domain 7 should list ALL 8 function source files explicitly and have
  a review step for each.

### FINDING-X15: Database Abstraction Layer Not in Plan

- `lib/database/database-interface.ts` + `lib/database/firestore-adapter.ts` — a
  full database abstraction
- `lib/db/` — 8 collection-specific modules
- This is a significant architectural pattern that needs review:
  - Does the interface match the adapter implementation?
  - Are all 8 db modules using the adapter consistently?
  - Does `lib/firestore-service.ts` overlap with `lib/db/`?
- **Gap:** Domain 6 needs a "Data access layer audit" step.

### FINDING-X16: Celebrations System — Rich But Not Covered

- 6 files in `components/celebrations/`: overlay, provider, confetti-burst,
  firework-burst, milestone-modal, success-pulse
- `celebration-provider.tsx` — context provider for celebration state
- `celebration-demo` route exists at `app/celebration-demo/page.tsx`
- **Gap:** Domain 6 should explicitly review the celebration subsystem — is the
  demo route protected? Is it a dev-only feature that shouldn't be in
  production?

### FINDING-X17: Permissions-Policy Header Blocks Features the App Uses (S1)

- `firebase.json` header:
  `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()`
- `geolocation=()` blocks ALL geolocation access
- BUT `hooks/use-geolocation.ts` actively uses `navigator.geolocation`
- AND `components/maps/meeting-map.tsx` depends on it
- `microphone=()` blocks ALL microphone access
- BUT `hooks/use-speech-recognition.ts` uses the Web Speech API which needs
  microphone
- **Impact:** These features are likely broken in production when served from
  Firebase Hosting
- **Gap:** Domain 8 (Security) should cross-reference Permissions-Policy against
  actual browser API usage in the codebase. The plan mentions "hosting headers"
  but doesn't check for this specific conflict.

### FINDING-X18: Static Export Architecture — Plan Should Document Implications

- `next.config.mjs` uses `output: "export"` (static site generation)
- `images: { unoptimized: true }` because static export can't use Next.js image
  optimization
- This means: NO server components, NO API routes, NO middleware, NO server-side
  rendering
- All 98 components correctly use `'use client'`
- **Gap:** Domain 2 should explicitly verify this architecture choice is
  intentional and test that no code accidentally relies on server features
  (getServerSideProps, API routes, etc.)

### FINDING-X19: Tailwind v4 Configuration (CSS-based, not JS)

- Using `@tailwindcss/postcss` plugin in `postcss.config.mjs`
- No `tailwind.config.ts` or `tailwind.config.js` file (correct for Tailwind v4)
- Tailwind v4 uses CSS-based configuration (`@theme` directives in CSS)
- **Gap:** Domain 2 should check that the CSS-based Tailwind config is correct
  and that `globals.css` has proper Tailwind directives. Domain 4 could verify
  no stale Tailwind v3 patterns remain.

### FINDING-X20: 5 Orphaned Hook Files Not Registered in settings.json

- `alerts-reminder.js` — exists but NOT in settings.json hooks
- `analyze-user-request.js` — exists but NOT registered
- `plan-mode-suggestion.js` — exists but NOT registered
- `session-end-reminder.js` — exists but NOT registered
- `stop-serena-dashboard.js` — exists but NOT registered
- Also: `state-utils.js` exists both at `hooks/state-utils.js` AND
  `hooks/lib/state-utils.js` (potential duplication)
- **Gap:** Domain 10 should include bidirectional cross-reference: settings.json
  → files AND files → settings.json. Both directions.

### FINDING-X21: Firestore security_logs Collection Has No Explicit Rule

- `security-logger.ts` writes to `security_logs` collection via Admin SDK
- `firestore.rules` covers: users, journal, daily_logs, inventoryEntries,
  journalEntries (legacy), meetings, sober_living, daily_quotes, glossary,
  slogans, quick_links, prayers, dev, rate_limits
- **Missing:** `security_logs` — no explicit rule
- Firestore defaults to deny for unmatched paths, so it works (Admin SDK
  bypasses rules), but intent isn't documented
- **Gap:** Domain 8 should verify EVERY collection written by Cloud Functions
  has an explicit entry in firestore.rules, even if it's
  `allow read, write: if false`.

### FINDING-X22: Storage Rules Missing File Size and Content Type Restrictions (S2)

- `storage.rules` allows users to write to `users/{userId}/**` with NO
  restrictions on:
  - File size (could upload gigabytes)
  - Content type (could upload executables, scripts, etc.)
- **Gap:** Domain 8 step 3 mentions "size limits" but the plan should be
  explicit about testing both size and content type restrictions in storage
  rules.

### FINDING-X23: Cloud Functions Scale Vastly Underestimated

- Plan says "~12 files" — actual: 8 source files
- But ACTUAL COMPLEXITY is ~40+ exported functions across 5000+ lines:
  - `index.ts`: 5 user-facing callable functions + migration function
  - `admin.ts`: 35+ admin callable functions (3863+ lines!)
  - `jobs.ts`: 8 scheduled jobs (cleanup, analytics, health check, pruning,
    hard-delete)
  - `schemas.ts`: 8 Zod validation schemas
  - `security-wrapper.ts`: security middleware
  - `security-logger.ts`: logging + Sentry + PII redaction
  - `firestore-rate-limiter.ts`: rate limiting
  - `recaptcha-verify.ts`: reCAPTCHA Enterprise
- **Gap:** Domain 7 "~12 files" label severely underestimates scope. Should say
  "~8 files, ~40 exported functions, ~5000+ lines". Each admin function needs
  its own review checklist item (auth check, input validation, error handling,
  response sanitization).

### FINDING-X24: Scheduled Jobs Coverage Gap

- 8 scheduled jobs in `jobs.ts` — the plan mentions "schedules, error handling,
  cleanup" generically
- Specific jobs that need individual testing:
  1. `scheduledCleanupRateLimits` — purges old rate limit docs
  2. `scheduledCleanupOldDailyLogs` — removes old daily logs
  3. `scheduledCleanupOrphanedStorageFiles` — removes orphaned storage files
  4. `scheduledGenerateUsageAnalytics` — generates analytics
  5. `scheduledPruneSecurityEvents` — prunes old security_logs
  6. `scheduledHealthCheckNotifications` — health monitoring
  7. `scheduledHardDeleteSoftDeletedUsers` — permanent user deletion (GDPR!)
  8. `cleanupOldSessions` (alias for cleanupOldDailyLogs)
- **Gap:** Each job should be verified for: correct schedule, idempotency, error
  handling, data retention compliance (especially the hard-delete and prune
  jobs).

### FINDING-X25: Zod Schema Completeness Not Verified

- `schemas.ts` exports 8 schemas for validation
- The plan mentions "Zod schemas match data models" but doesn't specify HOW to
  verify this
- **Gap:** Domain 7 should explicitly: (1) compare each Zod schema
  field-by-field against the Firestore document structure, (2) verify no fields
  are accepted but not validated, (3) verify schema is used in EVERY function
  that accepts user data.

---

## Agent Research Findings (merged from 4 parallel agents, 72KB total)

### FINDING-X26: Root package.json Has NO `engines` Field

- Root `package.json` doesn't specify Node version
- CI uses Node 22, functions require Node 20, Firebase runs Node 24
- No `.nvmrc` or `.node-version` file exists
- **Gap:** Domain 1 should check for engines field AND Domain 5 should flag
  3-way version mismatch

### FINDING-X27: No Environment Variable Validation Script

- `.env.local.example` documents required vars but no script validates
  `.env.local` has them
- Missing NEXT*PUBLIC*\* vars would cause silent runtime failures
- **Gap:** Domain 1 should include "validate all NEXT*PUBLIC*\* vars are set
  before build"

### FINDING-X28: Test Framework = Node Built-in `node --test` + c8 Coverage

- Uses Node.js native test runner, NOT Jest/Vitest/Mocha
- Coverage via c8 but NO coverage thresholds enforced
- `tsconfig.test.json` only includes: `auth-provider.tsx`, `lib/**/*.ts`,
  `tests/**/*.ts`
- Most components EXCLUDED from test compilation
- **Gap:** Domain 3 should flag: no coverage thresholds, limited test scope, no
  E2E

### FINDING-X29: Playwright Installed But No Tests

- `@playwright/test` in devDependencies, no playwright.config.ts, no test files
- **Gap:** Domain 3 should verify: intended for future use? Should test-suite
  skill fill this?

### FINDING-X30: MSW (Mock Service Worker) Configured But Not Validated

- `msw` v2.12.8 in devDependencies, no tests verifying handlers
- **Gap:** Domain 3 should check if MSW is actually used

### FINDING-X31: ESLint Complexity Enforcement Has Gap

- `complexity: ["warn", 15]` global warn, pre-commit only checks NEW files
- 113 pre-existing violations exempted
- **Gap:** Domain 4 should enumerate existing complexity violations

### FINDING-X32: Markdownlint Has 19 Rules Disabled

- `.markdownlint.json` disables 19+ rules
- **Gap:** Domain 4 should verify each disabled rule has justification

### FINDING-X33: knip Ignores 19 Dependencies

- `knip.json` has 19 entries in `ignoreDependencies`
- **Gap:** Domain 5 should verify each entry is still needed

### FINDING-X34: Multi-Package Dependency Management

- Root, functions/, scripts/mcp/ have separate package.json files
- No workspace/monorepo, `--legacy-peer-deps` flag used for functions/
- **Gap:** Domain 5 should test: can all 3 packages install cleanly from
  scratch?

### FINDING-X35: @dataconnect/generated Uses file: Protocol

- `file:src/dataconnect-generated` — local path dependency
- **Gap:** Domain 5 should verify source directory exists and contains valid
  code

### FINDING-X36: Skill Registry vs Disk Mismatch

- 4 skills on disk NOT in registry, 5 in registry NOT on disk
- SKILL_INDEX claims 54, registry has 56, disk has 55
- **Gap:** Domain 11 needs 3-way reconciliation

### FINDING-X37: Agent Count Discrepancy

- V1 plan says 14 root agents — actual: 24 root agents + 11 global = 35 total
- **Gap:** Domain 12 count correction needed

### FINDING-X38: TDMS Has 18 Scripts Not 8

- V1 plan says 8 debt/TDMS scripts — actual: 18 scripts in scripts/debt/
- **Gap:** Domain 16 needs complete inventory, Domain 9 must execute all 18

### FINDING-X39: TDMS Has Rich Substructure

- Views (5 files), raw logs (6 files), logs (20+ files), procedures, metrics
- **Gap:** Domain 16 should audit ALL artifacts, not just MASTER_DEBT.jsonl

### FINDING-X40: Error Knowledge Base Unmapped

- `lib/error-knowledge-base.ts` — 11.7KB, maps error patterns to user messages
- Not in any domain of v1 plan
- **Gap:** Domain 6 should review for completeness and accuracy

### FINDING-X41: No Firestore Indexes Validation

- `firestore.indexes.json` exists but no CI validates indexes match query
  patterns
- **Gap:** Domain 8 should include index validation

### FINDING-X42: No Supply Chain Security (SBOM)

- No Software Bill of Materials generated, npm audit only in pre-push warning
- **Gap:** Domain 5 and Domain 13 should flag SBOM absence

---

## Summary

**Total new findings from second-pass:** 42 (X01-X42) **Critical findings
requiring plan revision:**

1. **Permissions-Policy blocks geolocation + microphone** (S1 production bug)
2. **Cloud Functions scope 4x larger than planned** (40+ functions, not ~12
   files)
3. **Skill registry/disk/index 3-way mismatch** (data integrity)
4. **24 root agents, not 14** (plan count wrong)
5. **18 TDMS scripts, not 8** (plan count wrong)
6. **No Sentry coverage in any domain** (monitoring system ignored)
7. **No env var validation** (silent build/runtime failures)

**Persisted artifacts:**

- Decisions: `.claude/state/system-test-plan-decisions.json` + MCP memory (10
  entities)
- Gap analysis: `.claude/state/system-test-gap-analysis-pass2.md` (this file)
- Agent research: `.claude/state/agent-research-results.md` (72KB)
