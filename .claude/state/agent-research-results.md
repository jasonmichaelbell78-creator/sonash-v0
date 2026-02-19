=== AGENT a9edaca === Perfect! Now let me compile my findings into a
comprehensive gap analysis report.

## SECOND PASS GAP ANALYSIS - DOMAINS 0-5

Based on my thorough exploration of the codebase, here are the gaps and missed
testing opportunities:

---

### **DOMAIN 0: Self-Validation (Skill Infrastructure)**

**Found Utilities in `/scripts/lib/`:**

1. **`sanitize-error.js`** - Error message sanitization with sensitive pattern
   detection
   - Masks file paths, credentials, connection strings, bearer tokens, private
     IPs
   - Gap: No tests for regex global state reset edge cases with concurrent calls
   - Gap: No test for Unicode private use area (U+E000-U+F8FF) patterns

2. **`sanitize-error.ts`** - TypeScript version with ES module export
   - Gap: No integration test verifying both .js and .ts versions produce
     identical output

3. **`security-helpers.js`** - 14 security utility functions
   - Functions: safeWriteFile (atomic wx flag), refuseSymlinkWithParents,
     validatePathInDir, safeGitAdd/Commit, parseCliArgs, SSRF validation, PII
     masking
   - Gap: No test for `parseCliArgs` with edge cases (consecutive flags, missing
     values)
   - Gap: No test for `maskEmail` with unusual domain structures (single-part,
     numeric)
   - Gap: No test for `safeRegexExec` infinite loop prevention with zero-length
     matches on boundary conditions

4. **`validate-paths.js`** - Path validation library with multiple functions
   - Functions: validateFilePath, verifyContainment, validateAndVerifyPath
   - Gap: No test for symlink traversal at boundary (deeply nested symlink
     chains)
   - Gap: No test for realpathSync behavior when symlink target is deleted
     mid-operation

5. **`validate-skip-reason.js`** - SKIP_REASON environment variable validation
   - Gap: No test for mixed ASCII/Unicode control character combinations
   - Gap: No test for Bidi override patterns at start/end/middle of string
   - No test for other Unicode line separators (U+2028/U+2029)

6. **`ai-pattern-checks.js`** - Exists but not examined
   - Gap: Unknown functionality, no visibility into what patterns it checks

**Fragile Areas Identified:**

- Regex lastIndex reset patterns (potential state leaks across script
  invocations)
- TOCTOU race conditions in symlink checks (filesystem state changes between
  checks)
- Multiline control character detection (incomplete Unicode support)

---

### **DOMAIN 1: Prerequisites (Environment Checks)**

**Version Constraints Found:**

- Root `package.json`: **NO `engines` field** (allows any Node version)
- Root CI workflows (`.github/workflows/ci.yml`, etc.): Use Node **22**
- `functions/package.json`: Requires Node **20** explicitly
- `firebase.json`: Cloud Functions runtime **nodejs24**
- `.env.local.example`: Documents required Firebase vars but doesn't validate
  presence

**Gaps:**

1. **No .nvmrc or .node-version file** - Developers might use wrong Node version
   locally vs CI (Node 22 in CI, but functions need 20)
2. **Node version mismatch not caught locally**:
   - Root uses Node 22 but Firebase Cloud Functions runs on Node 24
   - Functions require Node 20 but might run on 22
   - No preinstall script validates version match
3. **Missing firebase-tools dependency check** - `deploy-firebase.yml` installs
   globally (`npm install -g firebase-tools`) but no local dependency validation
4. **No environment variable validation script** - `.env.local.example` exists
   but no script validates `.env.local` has required keys
5. **Firebase Authentication setup not validated** - App Check, reCAPTCHA,
   Sentry DSN all optional but critical for production
6. **No postinstall hook** - `prepare` hook handles husky but not dependency
   verification

---

### **DOMAIN 2: Build Pipeline**

**Config Files Analyzed:**

- `next.config.mjs` - Minimal config (static export, unoptimized images)
- `postcss.config.mjs` - Tailwind v4 with @tailwindcss/postcss
- `tsconfig.json` - Includes: next-env.d.ts, \*_/_.ts/tsx, .next types;
  Excludes: node_modules, scripts, functions
- `tsconfig.test.json` - Compiles to dist-tests, extends root, includes only
  specific files

**Gaps:**

1. **next.config.mjs is too minimal**:
   - No rewrites/redirects tested
   - No headers (CSP, CORS, etc.) tested beyond static config
   - No experimental features enabled/tested
   - Gap: No test for static export behavior (no API routes expected)

2. **Build artifact directories not tested**:
   - `.next/` cache not cleaned before CI builds (stale cache risk)
   - `out/` directory (static export) size/contents not validated
   - No build time regression test

3. **PostCSS/Tailwind integration fragile**:
   - Tailwind v4 (@tailwindcss/postcss) is new, no integration test
   - Gap: No test for CSS generation with custom Tailwind config
   - No test for @layer, @slot, @custom-variant features

4. **TypeScript path aliases incomplete**:
   - `@/*` maps to root directory (very broad)
   - No validation that all imports can be resolved
   - Gap: No test for circular dependencies between path-aliased modules

5. **No build-time environment variable validation**:
   - Firebase keys embedded in HTML during `next build`
   - No check for missing NEXT*PUBLIC*\* variables

6. **tsc-alias not tested**:
   - Used in test:build script but no validation for alias resolution
     correctness
   - Gap: No test for tsc-alias handling of nested paths

---

### **DOMAIN 3: Tests**

**Test Infrastructure Found:**

- Framework: **Node.js built-in `node --test`**
- Build: TypeScript → dist-tests with tsc + tsc-alias
- Coverage: **c8** (code coverage tool)
- Config: `tsconfig.test.json` includes only
  `components/providers/auth-provider.tsx`, `lib/**/*.ts`, `tests/**/*.ts`
- Test files: 20+ files in `/tests/` including unit, integration, security tests

**Gaps:**

1. **Incomplete test coverage configuration**:
   - `tsconfig.test.json` explicitly excludes most of app/:
     - No app/page.tsx tests
     - No app/layout.tsx tests
     - No app/api/\*\* tests
   - Only includes auth-provider.tsx from components (why not others?)
   - Gap: No visibility into why specific modules are excluded

2. **No E2E tests with Playwright**:
   - `@playwright/test` installed but no tests found
   - playwright.config.ts not present
   - Gap: No integration testing of actual user workflows

3. **MSW mock service worker configured but not validated**:
   - `msw` v2.12.8 in devDependencies
   - No tests found that verify MSW handlers work correctly
   - Gap: No test for API response mocking consistency

4. **Firebase emulator not tested**:
   - `firebase-admin` v13.6.0 and `@firebase/rules-unit-testing` v5.0.0 present
   - No tests running against emulator
   - Gap: No integration test for Firestore operations

5. **Security test coverage unclear**:
   - `tests/security/firestore-validation.test.ts` exists
   - No visibility into what's tested (TOCTOU, injection, etc.)
   - Gap: No test for custom ESLint plugin rules

6. **c8 coverage thresholds not enforced**:
   - No .c8rc or package.json coverage config
   - Coverage reports generated but no threshold blocks CI

7. **Tests don't run in CI for doc-only commits**:
   - Pre-commit hook skips tests for doc-only changes
   - Gap: No test ensuring doc-only detection doesn't accidentally skip code
     tests

---

### **DOMAIN 4: Static Analysis**

**Linting Config Found:**

- `eslint.config.mjs` - Flat config with security plugin, react-hooks, custom
  SoNash rules
- Custom ESLint plugin: `eslint-plugin-sonash/` with 3 security rules:
  - `no-unguarded-file-read` - File ops need try/catch
  - `no-stat-without-lstat` - Symlink checks must use lstat first
  - `no-toctou-file-ops` - existsSync + readFileSync is TOCTOU
- `.prettierrc` - Standard config (100 char width, trailing comma)
- `.markdownlint.json` - Many rules disabled (MD001, MD004, MD007, etc.)
- `knip.json` - Unused dependency checker with Next.js config

**Gaps:**

1. **Custom ESLint plugin not tested**:
   - 3 rules defined but no test suite found
   - Gap: No test for false positives/negatives of symlink detection
   - Gap: No test for rule behavior on minified/transpiled code

2. **ESLint complexity rule not enforced everywhere**:
   - `complexity: ["warn", 15]` - warns globally
   - Pre-commit hook checks **only new JS files** with CC > 15 as ERROR
   - Gap: Existing code can have CC > 15 (113 pre-existing violations per
     eslint.config.mjs)
   - Gap: No blocking enforcer for actual cognitive complexity measurement

3. **Prettier format check only in CI**:
   - `.husky/pre-commit` runs lint-staged (auto-format)
   - CI blocks on format violations
   - Gap: Local Prettier version mismatch could cause CI failures

4. **Markdown linting permissive**:
   - 19 rules disabled (MD001, MD004, MD007, MD009, MD012, etc.)
   - Only MD013 (line length) has custom threshold (500 chars)
   - Gap: No test for Markdown consistency standards

5. **knip configuration incomplete**:
   - Ignores 19 dependencies with `ignoreDependencies` list
   - Gap: No validation that ignored deps are actually necessary
   - Many CSS/UI libs listed as ignored but might be unused

6. **No security-focused linter**:
   - Custom SoNash rules target file ops only
   - No coverage for:
     - Input validation
     - Command injection
     - Prototype pollution
     - Regular expression DoS (ReDoS)
   - Gap: `eslint-plugin-security` configured but no rules visible

7. **No test for eslint-plugin-security rules**:
   - `security` plugin imported but only `security.configs.recommended` used
   - Gap: No visibility into which security rules are active
   - Gap: No test for rule enforcement

---

### **DOMAIN 5: Dependencies**

**Package Structures Found:**

1. **Root `package.json`**:
   - 31 runtime dependencies
   - 37 devDependencies
   - No `workspaces` or monorepo config
   - `overrides`: fast-xml-parser pinned to 5.3.4

2. **`functions/package.json`** (separate project):
   - 5 runtime dependencies
   - 5 devDependencies
   - `engines.node`: 20
   - Not installed with `npm install` from root

3. **`scripts/mcp/package.json`** (MCP server):
   - 1 dependency: @modelcontextprotocol/sdk v1.0.0
   - `engines.node`: >=18
   - Separate from root/functions packages

4. **Dataconnect generated code**:
   - `@dataconnect/generated` installed as `file:src/dataconnect-generated`
   - Local file: protocol dependency

**Gaps:**

1. **Multi-package dependency management fragile**:
   - Root, functions, and mcp have separate package.json files
   - No workspace or monorepo setup
   - Gap: No synchronized version management (e.g., Firebase lib versions must
     match)
   - Gap: `npm ci` in CI doesn't install functions dependencies automatically
   - CI explicitly runs `npm ci --legacy-peer-deps` in functions/ separately

2. **Node version mismatch between packages**:
   - Root: No engines specified (uses Node 22 in CI)
   - Functions: engines.node = 20 (but deployed to Node 24)
   - MCP: engines.node >= 18
   - Gap: No validation script checks version compatibility

3. **Local file dependency**:
   - `@dataconnect/generated: file:src/dataconnect-generated`
   - Gap: No test validating file:// dependency resolve
   - Gap: No protection against symlink attacks on file:// paths

4. **Dependency duplication**:
   - `zod` v4.2.1 in root and functions
   - `@sentry/*` versions might differ
   - `firebase-admin` in root (main) and functions (Cloud Functions)
   - Gap: No audit for version mismatches that could cause runtime errors

5. **Override configuration minimal**:
   - Only `fast-xml-parser` pinned
   - Gap: No lockfile integrity check in CI

6. **Unused dependency checker passes but is permissive**:
   - knip.json has 19 entries in `ignoreDependencies`
   - Gap: No validation that ignored items are actually necessary
   - Gap: No test for false negatives (truly unused deps that slip through)

7. **Legacy peer deps flag**:
   - `npm ci --legacy-peer-deps` used in functions/ deploy
   - Gap: Indicates peer dependency conflicts not resolved
   - Gap: No test for breaking changes in next major versions

8. **No supply chain security checks**:
   - GitHub workflow uses pinned SHA for changed-files action
   - Gap: No SBOMs (Software Bill of Materials) generated
   - Gap: No npm audit integration beyond pre-push hook warning

9. **scripts/lib utilities not in package.json**:
   - `require("node:fs")`, `require("node:path")`, etc. used directly
   - Gap: Node.js built-in modules assumed but not validated

---

## **SUMMARY OF HIGH-PRIORITY GAPS**

### **Critical (Could block builds/deployments):**

1. Node version mismatch (22 local vs 24 Cloud Functions) not caught
2. Firebase dependencies version conflicts not audited
3. .env.local validation missing (could fail at runtime)
4. functions/ not installed by `npm install` (requires separate `npm ci`)

### **High (Security/Stability risks):**

1. Custom ESLint plugin (`sonash/*` rules) not unit tested
2. TOCTOU race conditions in path validation not fully covered
3. Symlink traversal edge cases not tested
4. Firebase Security Rules (Firestore/Storage) not validated in CI
5. Firestore indexes validation missing
6. E2E tests missing (Playwright not used despite being installed)

### **Medium (Test coverage gaps):**

1. tsconfig.test.json excludes most of app/ directory
2. MSW mock handlers not validated
3. c8 coverage thresholds not enforced
4. Markdown lint rules too permissive
5. knip's ignoreDependencies list not validated
6. ReDoS patterns in custom regex not checked

### **Low (Documentation/process gaps):**

1. Why ai-pattern-checks.js exists unclear
2. Why specific modules excluded from tsconfig.test.json
3. No validation that all security-helpers functions are used
4. No test for hook cleanup on Windows (CRLF handling)

---

**Files Found Requiring Testing:**

- `eslint-plugin-sonash/` (3 rule files)
- `scripts/lib/` (5 utility files, varying quality)
- `.husky/pre-commit` (372 lines, multiple gates)
- `.husky/pre-push` (220 lines, multiple gates)
- `firestore.rules` (23 lines, security-critical)
- `storage.rules` (23 lines, security-critical)
- `functions/src/` (8 TypeScript files, Cloud Functions)

=== AGENT a2d34d2 === Now I have comprehensive information. Let me compile the
final gap analysis report:

---

## COMPREHENSIVE GAP ANALYSIS: DOMAINS 6-10

Based on thorough exploration of the codebase, here are the detailed findings
for Domains 6-10:

### **DOMAIN 6: APP CODE (Minimal - 10 Files + CSS)**

#### App Directory Structure & Routes

- **Pages found:**
  - `/app/page.tsx` - Home page
  - `/app/layout.tsx` - Root layout (RootLayout component with providers)
  - `/app/admin/layout.tsx` - Admin layout wrapper
  - `/app/admin/page.tsx` - Admin dashboard page
  - `/app/journal/page.tsx` - Journal hub page
  - `/app/meetings/all/page.tsx` - Meetings listing page
  - `/app/celebration-demo/page.tsx` - Demo/test page
  - `/app/colors/page.tsx` - Color sampler page
  - `/app/dev/page.tsx` - Dev/debugging page

- **Dynamic Routes:** NONE found (no `[slug]` or `[id]` patterns)
- **API Routes:** NONE found (no `/api` directory or `route.ts` files)
- **Middleware:** NO middleware.ts at app root
- **Note:** Using Next.js 16.1.1 with static export (no server-side rendering
  for API routes)

#### Components Breakdown (117 files across 24 subdirectories)

| Directory              | Count | Notes                                                        |
| ---------------------- | ----- | ------------------------------------------------------------ |
| **journal**            | 18    | Entry forms (5), main components, layouts, wizards, timeline |
| **notebook**           | 30    | Largest component tree - various notebook/page views         |
| **admin**              | 17    | Dashboard tabs (15), CRUD table, types                       |
| **ui**                 | 10    | Shadcn/ui wrappers (buttons, dialogs, forms, etc.)           |
| **providers**          | 7     | Auth, daily-log context, error-boundary, sentry, theme       |
| **celebrations**       | 7     | Celebration/milestone animations and triggers                |
| **growth**             | 5     | Growth tracking components                                   |
| **widgets**            | 4     | Reusable widget components                                   |
| **desktop**            | 4     | Desktop-specific layouts                                     |
| **dev**                | 3     | Dev/debug tools                                              |
| **status**             | 2     | Status indicators and auth-error banner                      |
| **meetings**           | 1     | Meeting finder components                                    |
| **home**               | 1     | Home page section component                                  |
| **maps**               | 1     | Map integration (Leaflet-based)                              |
| **auth**               | 2     | Auth UI components                                           |
| **onboarding**         | 1     | Onboarding flow                                              |
| **settings**           | 1     | Settings page components                                     |
| **pwa**                | 1     | InstallPrompt (PWA) component                                |
| **color-sampler.tsx**  | 1     | Standalone component                                         |
| **theme-provider.tsx** | 1     | Theme context provider                                       |

#### TypeScript Type Coverage

- **Good:** Most components are properly typed (use explicit prop interfaces)
- **Potential gaps:**
  - Some event handlers may use implicit `any` types
  - No comprehensive prop validation library beyond TypeScript
  - Types defined in `/types/journal.ts` (9 entry types) and `/lib/types/` (3
    files)

#### Global Error Handling

- **ErrorBoundary** (`/components/providers/error-boundary.tsx`) - wraps entire
  app
- **Sentry integration** (`/components/providers/sentry-initializer.tsx`) -
  error monitoring
- **Error knowledge base** (`/lib/error-knowledge-base.ts`) - 11.7KB mapping of
  error patterns
- **Error utilities** (`/lib/utils/error-export.ts`, `admin-error-utils.ts`,
  `callable-errors.ts`)
- **Auth error banner** (`/components/status/auth-error-banner.tsx`)

#### PWA/Service Worker Setup

- **Manifest:** `/public/manifest.json` configured (standalone mode, theme color
  #f5f0e6)
- **PWA Icon:** `/public/pwa-icon.jpg` (380KB, suitable for 192x192 and 512x512)
- **Install Prompt:** `/components/pwa/install-prompt.tsx` - handles both iOS
  and Android
  - iOS detection and Share-to-Home guidance
  - BeforeInstallPrompt event handling for Android
  - **NO dedicated service worker file found** (critical gap for offline
    functionality)

#### Context/State Management

- **Auth Context:** `/components/providers/auth-context.tsx` - user auth state
- **Daily Log Context:** `/components/providers/daily-log-context.tsx` + utils
- **Profile Context:** `/components/providers/profile-context.tsx` - user
  profile data
- **Admin Tab Context:** `/lib/contexts/admin-tab-context.tsx` - admin UI state
  (tab switching, refresh tracking)
- **Theme Context:** via `next-themes`
- **Celebration Context:** `/components/celebrations/celebration-provider` -
  animations

#### Firestore Writes from Client

- **CRITICAL SECURITY DESIGN:** All direct Firestore writes are BLOCKED in
  security rules
- **Client-side Firestore usage:** READ-ONLY operations only
  - `onSnapshot()` for real-time listeners
  - `getDoc()`, `getDocs()`, `query()` for reads
- **Writes routed through:** Cloud Functions only (saveDailyLog,
  saveJournalEntry, saveInventoryEntry)
- **See:** `/lib/firestore-service.ts` - calls Cloud Functions, NOT direct
  Firestore writes

#### Custom Hooks (4 files)

1. **`use-journal.ts`** (16.6KB)
   - Real-time journal entry sync
   - Cleanup: Has `useEffect` with cleanup function returning
     `unsubscribeSnapshot()` ✓
   - Rate limiting: Client-side (UX feedback only)
   - Sanitization: XSS prevention in `sanitizeForSearch()` function

2. **`use-daily-quote.ts`** (6.3KB)
   - Module-level cache for quote of the day
   - Cleanup: None needed (no listeners/timers in hooks)
   - Note: `MIDNIGHT_REFRESH_DELAY_SECONDS = 5` constant extracted

3. **`use-geolocation.ts`** (4.9KB)
   - Browser geolocation API wrapper
   - Cleanup: No cleanup needed (uses navigator API, no listeners to
     unsubscribe)
   - Features: Permission handling, high accuracy option, cache maxAge

4. **`use-speech-recognition.ts`** (3.4KB)
   - Web Speech API wrapper
   - Cleanup: **POTENTIAL GAP** - `recognitionRef.current` created in useEffect
     but no explicit cleanup on unmount
   - Error handling for no-speech, timeout, denied permissions

#### Data Files (4 files)

- **`glossary.ts`** (15.7KB) - 200+ recovery-related terms
- **`local-resources.ts`** (26.1KB) - 100+ Tennessee recovery facilities with
  **external URLs** (mhc-tn.org, etc.)
  - **TEST COVERAGE NEEDED:** URL validity, redirect checks
- **`recovery-quotes.ts`** (6.8KB) - motivational quotes
- **`slogans.ts`** (7.7KB) - recovery slogans

### **DOMAIN 7: CLOUD FUNCTIONS (~12 Files)**

#### Functions Source Files

1. **`index.ts`** - Main callable functions:
   - `saveDailyLog` - Rate limited (10 req/min), Zod validated, reCAPTCHA
     verified
   - `saveJournalEntry` - Rate limited, full entry with type/data structure
   - `softDeleteJournalEntry` - Soft delete with recovery capability
   - `saveInventoryEntry` - Inventory entry with cravings/used fields
   - `migrateAnonymousUserData` - Data migration for anonymous users

2. **`admin.ts`** - 33+ admin callable functions:
   - User management: `adminListUsers`, `adminSearchUsers`,
     `adminGetUserDetail`, `adminUpdateUser`, `adminDisableUser`,
     `adminSoftDeleteUser`, `adminUndeleteUser`
   - Content management: `adminSaveMeeting`, `adminDeleteMeeting`,
     `adminSaveSoberLiving`, `adminDeleteSoberLiving`, `adminSaveQuote`,
     `adminDeleteQuote`
   - Dashboard: `adminGetDashboardStats`, `adminGetUserAnalytics`,
     `adminGetCollectionStats`, `adminGetStorageStats`
   - Admin tools: `adminHealthCheck`, `adminGetPrivilegeTypes`,
     `adminSetUserPrivilege`, `adminSendPasswordReset`, `adminTriggerJob`
   - Logs & monitoring: `adminGetLogs`, `adminGetErrorsWithUsers`,
     `adminGetRateLimitStatus`, `adminClearRateLimit`,
     `adminGetSentryErrorSummary`
   - User activity: `adminSearchUsers`, `adminFindUserByHash`,
     `adminGetUserActivityByHash`

3. **`jobs.ts`** - 9 scheduled functions:
   - `scheduledCleanupRateLimits` - Daily cleanup
   - `scheduledCleanupOldDailyLogs` / `cleanupOldSessions` - Archive old logs
   - `scheduledCleanupOrphanedStorageFiles` - Storage cleanup
   - `scheduledGenerateUsageAnalytics` - Analytics generation
   - `scheduledPruneSecurityEvents` - Security log retention
   - `scheduledHealthCheckNotifications` - Health monitoring
   - `scheduledHardDeleteSoftDeletedUsers` - GDPR compliance deletion

4. **`schemas.ts`** - Zod validation schemas:
   - `dailyLogSchema`
   - `journalEntrySchema`
   - `inventoryEntrySchema`
   - `softDeleteJournalEntrySchema`
   - `migrationDataSchema`

5. **`security-wrapper.ts`** - Multi-layer security middleware:
   - Authentication check
   - Rate limiting (userId-based + IP-based)
   - App Check verification (optional, currently disabled)
   - reCAPTCHA token verification
   - Input validation with Zod
   - Authorization check (userId matching)

6. **`security-logger.ts`** - Structured security event logging:
   - 19 security event types (AUTH*FAILURE, RATE_LIMIT_EXCEEDED, RECAPTCHA*\*,
     etc.)
   - User ID hashing with SHA-256 (first 12 chars)
   - Sentry integration for ERROR/WARNING events
   - GCP Cloud Logging structured JSON format

7. **`firestore-rate-limiter.ts`** - Firestore-backed rate limiting:
   - Persists across function instances
   - userId-based and IP-based limiting
   - Configurable points/duration

8. **`recaptcha-verify.ts`** - reCAPTCHA Enterprise verification:
   - Token validation
   - Action and score checking

#### Functions Package Configuration

- **Engine:** Node 20 (functions/package.json)
- **Runtime:** nodejs24 (firebase.json)
- **Build:** TypeScript with tsc
- **Main:** `lib/index.js` (compiled output)
- **Scripts:** lint, build, build:watch, serve, deploy, logs

#### Firebase Configuration

- **Hosting:** Firebase Hosting (Next.js static export to `/out`)
- **Functions:** `source: "functions"`, `runtime: nodejs24`
- **Headers configured:** Cache-Control, COOP, X-Frame-Options, XSSO, HSTS,
  Referrer-Policy, Permissions-Policy
- **Rewrites:** All routes -> `/index.html` (SPA mode)

#### Environment Config

- **Functions:** Uses Firebase CLI environment variables via `firebase.json`
- **Sentry DSN:** Passed via environment variable (SENTRY_DSN)
- **reCAPTCHA:** Site key from env
  (NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY)

#### Function Types

- **Callable vs HTTP:** All are `onCall()` (callable functions, not HTTP)
- **Scheduled triggers:** 9 functions using `onSchedule()`
- **Admin authorization:** Custom check in `admin.ts` (checks
  `request.auth.token.admin == true`)

### **DOMAIN 8: SECURITY (~15+ Files)**

#### Firestore Security Rules (`firestore.rules` - 152 lines)

**Structure:**

- Helper functions: `isSignedIn()`, `isOwner(userId)`, `isAdmin()`
- User profiles: `/users/{userId}` - owner read/write only
- **Journal collections (3 paths):**
  - `/users/{userId}/journal/{entryId}` - read own only, writes BLOCKED (via
    Cloud Functions)
  - `/users/{userId}/daily_logs/{dateId}` - read own, writes BLOCKED
  - `/users/{userId}/inventoryEntries/{entryId}` - read own, writes BLOCKED
  - `/users/{userId}/journalEntries/{entryId}` (legacy) - read own, writes
    BLOCKED
  - Delete allowed for GDPR compliance
- **Public collections (admin writes via CF):**
  - `/meetings/{meetingId}` - public read, write blocked
  - `/sober_living/{homeId}` - public read, write blocked
  - `/daily_quotes/{quoteId}` - public read, admin-only write
  - `/glossary/{termId}` - public read, admin-only write
  - `/slogans/{sloganId}` - public read, admin-only write
  - `/quick_links/{linkId}` - public read, admin-only write
  - `/prayers/{prayerId}` - public read, admin-only write

- **Admin collections:**
  - `/dev/{document=**}` - admin read, no client writes
- **Internal collections (CF only):**
  - `/rate_limits/{docId}` - blocked from client

**Wildcards:** Yes - `/{document=**}` pattern used for dev collection

#### Storage Rules (`storage.rules` - 23 lines)

- Default: Deny all
- Pattern: `/users/{userId}/{allPaths=**}` - authenticated user can access own
  files only
- Note: Admin SDK bypasses rules for cleanup functions

#### Firebase Hosting Headers (firebase.json)

- **Cache-Control:** `no-cache, no-store, must-revalidate` for HTML
- **Cache-Control:** `public, max-age=31536000, immutable` for static assets
- **Cross-Origin-Opener-Policy:** `same-origin-allow-popups`
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **Strict-Transport-Security:** `max-age=31536000; includeSubDomains`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Permissions-Policy:** Geolocation, microphone, camera, payment, USB disabled

#### Security Modules

- **`/lib/security/firestore-validation.ts`** - Input validation and scope
  checking:
  - `assertUserScope()` - Validates user ID is set
  - `validateUserDocumentPath()` - Ensures correct document structure

#### reCAPTCHA Integration

- **Client:** `/lib/recaptcha.ts` - Token generation for actions
- **Server:** `/functions/src/recaptcha-verify.ts` - Token validation
- **Configuration:** Site key in env, Enterprise mode

#### CSP & CORS Notes

- **CSP:** Not explicitly configured (potential gap)
- **CORS:** Not configured (may not be needed for same-origin)
- **Found in technical debt logs:** "Missing Content-Security-Policy header"
  flagged as issue

#### Rate Limiting

- **Server-side:** Firestore-backed rate limiter (persists across instances)
- **Client-side:** Rate limiters in `lib/utils/rate-limiter.ts` (UX feedback
  only)
- **Limits per function:**
  - saveDailyLog: 10 req/60s
  - saveJournalEntry: 10 req/60s
  - deleteJournalEntry: 20 req/60s (higher limit for deletes)
  - Admin functions: Custom limits

#### Recaptcha Configuration

- **Verification flow:** Client sends token in request data, Cloud Function
  validates
- **Currently disabled:** App Check requirement temporarily disabled pending
  throttle clear
- **Actions configured:** save_daily_log, save_journal_entry, etc.

### **DOMAIN 9: SCRIPTS (90+ Files across 11 Subdirectories)**

#### Scripts Root (60+ files)

Main utility scripts for documentation, audits, validation, and workflow
automation.

#### Subdirectories

| Directory    | Count | Purpose                                                                                                                                                                                            |
| ------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **lib**      | 6     | Shared utilities: ai-pattern-checks, sanitize-error, security-helpers, validate-paths, validate-skip-reason                                                                                        |
| **audit**    | 10    | Audit tools: health-check, compare-audits, track-resolutions, validate-templates, post-audit, pre-audit-check, generate-results-index, count-commits, validate-integration, transform-jsonl-schema |
| **config**   | 11    | Configuration files: ai-patterns.json, skill-registry.json, doc-dependencies.json, audit-config.json, verified-patterns.json, skill-config.json, agent-triggers.json, load-config.js               |
| **debt**     | 18    | Technical debt management: generate-metrics, generate-views, dedup-multi-pass, intake-audit, resolve-bulk, sync-sonarcloud, extract-audits, extract-reviews, assign-roadmap-refs, etc.             |
| **mcp**      | 5     | MCP server config: sonarcloud-server.js, manifest.json, sonarcloud.mcpb, package.json, package-lock.json                                                                                           |
| **metrics**  | 1     | Metrics: review-churn-tracker.js                                                                                                                                                                   |
| **multi-ai** | 6     | Multi-AI coordination: MCP servers for integration                                                                                                                                                 |
| **secrets**  | 2     | Secret management utilities                                                                                                                                                                        |
| **tasks**    | 1     | Task runners                                                                                                                                                                                       |
| **velocity** | 2     | Velocity/metrics tracking                                                                                                                                                                          |

#### Imports from scripts/lib/

**Scripts importing from `./lib/`:**

- `check-cross-doc-deps.js` → `./lib/validate-skip-reason`
- `check-doc-headers.js` → `./lib/validate-skip-reason`
- `check-triggers.js` → `./lib/validate-skip-reason`
- `search-capabilities.js` → `./lib/sanitize-error`

**Scripts importing from `.claude/hooks/lib/`:**

- `archive-doc.js` → `../.claude/hooks/lib/symlink-guard`
- `archive-reviews.js` → `../.claude/hooks/lib/symlink-guard`
- `check-pattern-compliance.js` → `../.claude/hooks/lib/rotate-state.js`
- `check-review-archive.js` → `../.claude/hooks/lib/symlink-guard`
- `log-override.js` → `symlink-guard`, `rotate-state.js`
- `promote-patterns.js` → `symlink-guard`
- `suggest-pattern-automation.js` → `symlink-guard`
- `sync-reviews-to-jsonl.js` → `symlink-guard`

#### Hardcoded Path Patterns

Most scripts use `__dirname` + relative paths (`path.join(__dirname, "..")`) to
locate project root. Generally safe but depends on:

- Script execution from `/scripts` directory
- Node.js having correct `__dirname` context
- Some scripts also accept `projectRoot` parameter as override

**Potential breakage scenarios:**

- Moving scripts to subdirectories without updating paths
- Running from different working directory
- Symlinked script files

#### Script Dependency Chains

- Scripts call other scripts via `require()` for shared utilities
- Config files loaded from `scripts/config/` (JSON files)
- State files read/written to `.claude/state/` (JSONL files)

### **DOMAIN 10: CLAUDE HOOKS (27 Files)**

#### Hook Files (in `.claude/hooks/`)

1. **Session Hooks:**
   - `session-start.js` - Run on session start
   - `session-end-reminder.js` - Reminder at session end
   - `compact-restore.js` - Context restoration after compaction

2. **Tool Post-Processors:**
   - `post-write-validator.js` - Validates Write/Edit/Multiedit operations
     (checks symlinks via `symlink-guard`)
   - `post-read-handler.js` - Handles Read tool output
   - `commit-tracker.js` - Tracks Bash commands for commits

3. **Pre-Operation:**
   - `pre-compaction-save.js` - Save context before compaction
   - `decision-save-prompt.js` - Process AskUserQuestion events

4. **Analysis/Monitoring:**
   - `analyze-user-request.js` - Parse and analyze user requests
   - `check-mcp-servers.js` - Verify MCP server availability
   - `check-remote-session-context.js` - Check Git branches for context
   - `user-prompt-handler.js` - Process user input
   - `track-agent-invocation.js` - Log agent executions
   - `alerts-reminder.js` - Alert/reminder system

5. **Maintenance:**
   - `plan-mode-suggestion.js` - Suggest plan mode usage
   - `stop-serena-dashboard.js` - Clean up Serena dashboard

6. **Global Hooks:**
   - `global/gsd-check-update.js` - Getting-Things-Done checks
   - `global/statusline.js` - Status line output

#### Shared Libraries (in `.claude/hooks/lib/`)

1. **`git-utils.js`** - Git operation helpers
2. **`inline-patterns.js`** - Pattern matching for rules
3. **`rotate-state.js`** - State file rotation (JSONL)
4. **`state-utils.js`** - State management helpers
5. **`symlink-guard.js`** - Symlink safety checks with `isSafeToWrite()`
   function
6. **`(duplicate) state-utils.js`** - Also in root hooks directory

#### Settings Configuration (`.claude/settings.json`)

```json
Events configured:
- SessionStart: session-start, check-mcp-servers, check-remote-session-context, compact-restore
- PreCompact: pre-compaction-save
- PostToolUse (matchers):
  - write → post-write-validator
  - edit → post-write-validator
  - multiedit → post-write-validator
  - read → post-read-handler
  - AskUserQuestion → decision-save-prompt
  - bash → commit-tracker
  - task → track-agent-invocation
- UserPromptSubmit: user-prompt-handler
```

**Disabled MCP servers:** rube, serena, nextjs-devtools, filesystem

#### State Files (in `.claude/state/`)

1. **`.gitignore`** - State files are ignored in version control
2. **`agent-invocations.jsonl`** - Log of agent calls
3. **`alert-suppressions.json`** - Suppressed alerts
4. **`alerts-baseline.json`** - Alert baselines
5. **`commit-log.jsonl`** - Git commit history
6. **`consolidation.json`** - Consolidation tracking
7. **`health-score-log.jsonl`** - System health metrics
8. **`hook-warnings-log.jsonl`** - Hook execution warnings
9. **`reviews.jsonl`** - Code review tracking
10. **`system-test-plan-decisions.json`** - Test plan decisions (11.4KB)
11. **`warned-files.json`** - Files that have been warned about

#### File Write Locations

Hooks write ONLY to `.claude/state/` directory:

- `.fetch-cache.json` - Web fetch caching
- `.session-state.json` - Current session state
- State JSONL files above

**Verification:** No hooks found with file writes outside `.claude/` (using grep
for `writeFileSync`, `appendFileSync` in non-.claude paths returns no results).

#### Hook-to-Hook Dependencies

- `post-write-validator.js` → requires `symlink-guard`
- `log-override.js` → requires `symlink-guard`, `rotate-state.js`
- `check-pattern-compliance.js` → requires `rotate-state.js`
- Various scripts → `.claude/hooks/lib/` functions

---

## **CRITICAL GAPS IDENTIFIED**

### Domain 6 (App Code)

1. ✓ **NO service worker** for offline support despite PWA manifest
2. ✓ **NO CSP (Content-Security-Policy) header** configured
3. ✓ **Speech recognition hook cleanup** - `recognitionRef.current` created but
   no cleanup on unmount
4. ⚠️ **External URLs in data files** - local-resources.ts has 100+ facility
   websites needing validation testing
5. ✓ **NO explicit middleware.ts** for request/response processing (may not be
   needed for static export)

### Domain 7 (Cloud Functions)

1. ✓ **APP CHECK DISABLED** - note in index.ts: "TEMPORARILY DISABLED - waiting
   for throttle to clear"
2. ⚠️ **No IP-based rate limiting configuration** - `ipRateLimiter` parameter
   exists but not instantiated in index.ts
3. ⚠️ **Limited error context** - Cloud Function errors generalized to prevent
   information leakage (security intentional)

### Domain 8 (Security)

1. ✓ **MISSING CSP header** - identified in technical debt logs
2. ⚠️ **Wildcard in Firestore rules** - `/dev/{document=**}` pattern could
   expose unintended documents
3. ✓ **Admin check not scoped** - `/daily_quotes`, `/glossary`, `/slogans` use
   `isAdmin()` but no sub-collection restrictions
4. ⚠️ **CORS not explicitly configured** - may be reliant on same-origin
   implicit behavior

### Domain 9 (Scripts)

1. ⚠️ **Path assumptions** - Scripts rely on `__dirname` and relative paths; may
   break if moved or symlinked
2. ⚠️ **No input validation** - Some scripts accept `projectRoot` but don't
   validate it exists
3. ✓ **Configuration loading** - Hard-coded paths to `scripts/config/` directory

### Domain 10 (Claude Hooks)

1. ✓ **State file rotation** - `rotate-state.js` handles JSONL file size
   management
2. ⚠️ **Duplicate state-utils.js** - Exists in both `/hooks/` and `/hooks/lib/`
   (should consolidate)
3. ⚠️ **No error recovery** - Hooks don't have explicit error handling for file
   system failures
4. ✓ **File write safety** - `symlink-guard.js` provides `isSafeToWrite()`
   checks before operations

---

## **RECOMMENDATIONS FOR TEST PLAN**

### New Tests to Add

**Domain 6:**

- Service worker offline functionality test
- CSP header injection test
- Speech recognition cleanup/unmounting test
- External URL validation for all data files
- PWA install flow (iOS and Android)

**Domain 7:**

- IP-based rate limiting when enabled
- App Check token validation
- reCAPTCHA action/score verification
- Scheduled job execution and cleanup

**Domain 8:**

- Firestore rule wildcards validation
- Storage rule edge cases (symlinks, empty paths)
- Admin authorization boundary testing
- CSP header compliance test

**Domain 9:**

- Script path resolution from different working directories
- Configuration file loading with missing/corrupted files
- Script cross-dependencies and circular imports

**Domain 10:**

- Hook execution error handling
- State file rotation with large JSONL files
- Symlink guard safety checks
- Hook event matching accuracy

---

This concludes the comprehensive gap analysis for Domains 6-10. All findings are
based on actual file inspection and configuration review.

=== AGENT a9576c1 === Perfect! Now I have comprehensive information. Let me
compile my findings into a detailed report:

## SECOND PASS GAP ANALYSIS: Domains 11-15

Based on my thorough exploration of the codebase, here are the critical gaps and
findings from the second pass:

---

### **DOMAIN 11: Skills (~56 skills)**

**DISCREPANCIES FOUND:**

1. **Skill Registry vs. Disk Mismatch (CRITICAL)**
   - **On disk but NOT in registry (4 skills):**
     - `audit-ai-optimization` - Has SKILL.md, but missing from
       skill-registry.json
     - `audit-health` - Has SKILL.md, but missing from skill-registry.json
     - `create-audit` - Has SKILL.md, but missing from skill-registry.json
     - `docs-maintain` - Has SKILL.md, but missing from skill-registry.json
   - **In registry but NOT on disk (5 skills - DEPRECATED):**
     - `docs-sync` - Referenced in registry but directory removed
     - `docs-update` - Referenced in registry but directory removed
     - `expansion-evaluation` - Referenced in registry but directory removed
     - `save-context` - Referenced in registry but directory removed
     - `sonarcloud-sprint` - Referenced in registry but directory removed
       (replaced by `/sonarcloud`)

2. **Version Count Mismatch**
   - SKILL_INDEX.md claims 54 skills (header says "Total Skills: 54")
   - skill-registry.json has 56 skills
   - Actual disk count: 55 skill directories + SKILL_INDEX.md
   - Reality: 55 live skills (SKILL_INDEX.md is a file, not a skill)

3. **Reference Subdirectories (3 skills with advanced structure)**
   - `system-test/reference/` - Contains RECOVERY_PROCEDURES.md,
     TRIAGE_GUIDE.md, WAVE_DETAILS.md
   - `mcp-builder/reference/` - Contains evaluation.md, mcp_best_practices.md,
     node_mcp_server.md, python_mcp_server.md
   - `pr-review/reference/` - Contains LEARNING_CAPTURE.md,
     PARALLEL_AGENT_STRATEGY.md, SONARCLOUD_ENRICHMENT.md, TDMS_INTEGRATION.md

4. **Large Skills with Complex Structure (3 skills)**
   - `systematic-debugging` - 312 bytes (complex)
   - `market-research-reports` - 78 bytes (complex)
   - `markitdown` - 226 bytes (complex)

5. **All Skills Have SKILL.md**
   - ✓ All 55 skill directories have SKILL.md files
   - ✓ SKILL_INDEX.md exists and is well-structured

6. **Config Files Present**
   - ✓ `/scripts/config/skill-config.json` - Present (required sections,
     deprecated patterns)
   - ✓ `/scripts/config/skill-registry.json` - Present (56 entries, last updated
     2026-02-13)

7. **Cross-References**
   - Skills reference scripts in `/scripts/` extensively
   - Skills reference agents in `/scripts/debt/intake-audit.js`, etc.
   - Found only 1 reference to skills from agents (very limited cross-reference)

---

### **DOMAIN 12: Agents (35 total)**

**FILE INVENTORY:**

1. **Regular Agents (24 files in .claude/agents/)**
   - backend-architect.md (1245 bytes)
   - code-reviewer.md (892 bytes)
   - database-architect.md (21000 bytes) ← Large agent
   - debugger.md (881 bytes)
   - dependency-manager.md (2429 bytes)
   - deployment-engineer.md (1282 bytes)
   - devops-troubleshooter.md (1131 bytes)
   - documentation-expert.md (2547 bytes)
   - error-detective.md (1194 bytes)
   - frontend-developer.md (1327 bytes)
   - fullstack-developer.md (33018 bytes) ← Very large agent
   - git-flow-manager.md (8800 bytes)
   - markdown-syntax-formatter.md (3265 bytes)
   - mcp-expert.md (6782 bytes)
   - nextjs-architecture-expert.md (6133 bytes)
   - penetration-tester.md (1429 bytes)
   - performance-engineer.md (1127 bytes)
   - prompt-engineer.md (3157 bytes)
   - react-performance-optimization.md (2210 bytes)
   - security-auditor.md (1239 bytes)
   - security-engineer.md (32861 bytes) ← Very large agent
   - technical-writer.md (1322 bytes)
   - test-engineer.md (26482 bytes) ← Very large agent
   - ui-ux-designer.md (1233 bytes)

2. **Global Agents (11 files in .claude/agents/global/)**
   - gsd-codebase-mapper.md (14902 bytes)
   - gsd-debugger.md (36645 bytes) ← Largest agent
   - gsd-executor.md (20590 bytes)
   - gsd-integration-checker.md (12121 bytes)
   - gsd-phase-researcher.md (18453 bytes)
   - gsd-plan-checker.md (19916 bytes)
   - gsd-planner.md (43133 bytes) ← Second largest
   - gsd-project-researcher.md (22831 bytes)
   - gsd-research-synthesizer.md (7087 bytes)
   - gsd-roadmapper.md (16203 bytes)
   - gsd-verifier.md (21788 bytes)

3. **Markdown Structure Issues**
   - All agents use standard markdown format
   - Some agents have extensive instruction blocks (3000+ lines)
   - No clear inconsistencies detected

4. **Agent Name Matching**
   - File names match internal agent names
   - Global agents prefixed with `gsd-` consistently

---

### **DOMAIN 13: CI/CD (10 workflow files + 3 GitHub files)**

**WORKFLOW FILES (10):**

1. auto-label-review-tier.yml - Uses v4, v7 (mixed pinning)
2. backlog-enforcement.yml - SHA pinned (supply chain security)
3. ci.yml - Mixed pinning (v4, SHA#46.0.2 for changed-files)
4. deploy-firebase.yml - Has concurrency block, mixed pinning
5. docs-lint.yml - v4, v46 tag pinned
6. resolve-debt.yml - Newly updated (2026-02-18)
7. review-check.yml - v4, v7 pinning
8. sonarcloud.yml - SonarSource action pinned (SHA)
9. sync-readme.yml - Has concurrency block
10. validate-plan.yml - Minimal setup

**GitHub Configuration Files:**

- `.github/pull_request_template.md` - Present, comprehensive (64 lines)
- `.github/copilot-instructions.md` - Present
- `.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md` - Present

**Actions Used:**

- actions/checkout@v4
- actions/setup-node@v4
- actions/github-script@v7
- tj-actions/changed-files@v46 (mixed with SHA pinning)
- FirebaseExtended/action-hosting-deploy@v0 (SHA pinned:
  e2eda2e106cfa35cdbcf4ac9ddaf6c4756df2c8c)
- SonarSource/sonarcloud-github-action@v3.1.0 (SHA pinned:
  383f7e52eae3ab0510c3cb0e7d9d150bbaeab838)

**Secrets Referenced:**

- SONAR_TOKEN
- GITHUB_TOKEN
- FIREBASE_SERVICE_ACCOUNT
- NEXT*PUBLIC_FIREBASE*\* (6 vars)
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

**Concurrency & Permissions:**

- ✓ Concurrency groups in: deploy-firebase.yml, sync-readme.yml
- ✓ Permissions blocks in: auto-label-review-tier.yml, deploy-firebase.yml,
  docs-lint.yml, resolve-debt.yml, review-check.yml, sonarcloud.yml,
  sync-readme.yml, validate-plan.yml

**GAPS IDENTIFIED:**

- Some workflows use tags (v4, v7) without SHA pinning (security risk)
- Mixed pinning strategy across workflows (inconsistent)
- No CODEOWNERS file
- No FUNDING.yml file
- No branch protection rules documented

---

### **DOMAIN 14: Documentation (281 files, 269 active + 100 archived)**

**Root Documentation (10 files):**

- README.md
- ARCHITECTURE.md
- DEVELOPMENT.md
- DOCUMENTATION_INDEX.md (auto-generated, last: 2026-02-18)
- AI_WORKFLOW.md
- ROADMAP.md
- ROADMAP_FUTURE.md
- ROADMAP_LOG.md
- SESSION_CONTEXT.md
- claude.md

**Docs/ Subdirectories (22 main categories):**

1. `docs/agent_docs/` - Agent documentation (FIX_TEMPLATES.md)
2. `docs/archive/` - 100+ archived files (11 subdirectories)
3. `docs/audits/` - Comprehensive, multi-ai, single-session audit outputs
4. `docs/decisions/` - Templates only (README.md, TEMPLATE.md)
5. `docs/patterns/` - Pattern documentation
6. `docs/plans/` - Active plans (7 files)
7. `docs/source-data/` - Source data directory
8. `docs/technical-debt/` - MASTER_DEBT.jsonl + views + logs
9. `docs/templates/` - 7 documentation templates (CANONICAL, FOUNDATION, GUIDE,
   PLANNING, REFERENCE, JSONL_SCHEMA_STANDARD, CANON_QUICK_REFERENCE)

**Root Docs/ Markdown Files (30 files):**

- ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md
- AI_REVIEW_LEARNINGS_LOG.md (4082 lines - very large)
- AI_REVIEW_PROCESS.md
- APPCHECK_SETUP.md
- DOCUMENTATION_STANDARDS.md
- DOCUMENT_DEPENDENCIES.md
- FIREBASE_CHANGE_POLICY.md
- GLOBAL_SECURITY_STANDARDS.md
- INCIDENT_RESPONSE.md
- LEARNING_METRICS.md
- LIGHTHOUSE_INTEGRATION_PLAN.md
- MCP_SETUP.md
- MONETIZATION_RESEARCH.md
- OPERATIONAL_VISIBILITY_SPRINT.md
- PR_WORKFLOW_CHECKLIST.md
- README.md
- RECAPTCHA_REMOVAL_GUIDE.md
- REVIEW*POLICY*\* (4 files: ARCHITECTURE, INDEX, QUICK_REF, VISUAL_GUIDE)
- SECURITY.md
- SENTRY_INTEGRATION_GUIDE.md
- SERVER_SIDE_SECURITY.md
- SESSION_DECISIONS.md
- SESSION_HISTORY.md
- SLASH_COMMANDS_REFERENCE.md
- SONARCLOUD_CLEANUP_RUNBOOK.md
- TESTING_PLAN.md
- TRIGGERS.md

**Archive Structure (47 files + 11 directories):**

- 2025-dec-reports/
- 2026-jan-deprecated/ (CUSTOM_SLASH_COMMANDS_GUIDE.md, SLASH_COMMANDS.md)
- architecture-reviews-dec-2025/
- completed-decisions/
- completed-plans/ (EIGHT_PHASE_REFACTOR_PLAN.md, etc.)
- consolidated-2025-12-19/ (ROADMAP_V3.md - 2265 lines)
- expansion-ideation/ (12 brainstorm files with non-ASCII names)
- handoffs-2025-12/
- superseded-plans/
- Large files: ChatGPT*Multi_AI_Refactoring_Plan_Chat.md (139KB), REVIEWS*\*
  files (160KB+), SoNash_Technical_Ideation (169KB)

**Documentation Templates (7 templates):**

- CANONICAL_DOC_TEMPLATE.md (11876 bytes)
- CANON_QUICK_REFERENCE.md (6797 bytes)
- FOUNDATION_DOC_TEMPLATE.md (9574 bytes)
- GUIDE_DOC_TEMPLATE.md (6632 bytes)
- JSONL_SCHEMA_STANDARD.md (17441 bytes)
- PLANNING_DOC_TEMPLATE.md (11061 bytes)
- REFERENCE_DOC_TEMPLATE.md (6994 bytes)

**DOCUMENTATION_INDEX.md Status:**

- Generated: 2026-02-18
- Active Documents: 269
- Archived Documents: 100
- Auto-regenerated (do not edit manually)

**GAPS IDENTIFIED:**

- Largest files: ChatGPT_Multi_AI_Refactoring_Plan_Chat.md (139KB - no line
  limit documented)
- Large JSON files: EXPANSION_EVALUATION_TRACKER.md (96KB),
  SoNash_Meetings\_\_cleaned.csv (97KB)
- Archive has files with non-ASCII names in expansion-ideation/ (hard to manage)
- Some files in archive from 2025-12 might be obsolete
- No clear lifecycle/deprecation policy documented for archived items

---

### **DOMAIN 15: Configuration (~45 files)**

**Root Config Files:**

1. **Build & Package Management:**
   - `package.json` - Main dependencies
   - `package-lock.json` - Lock file
   - `tsconfig.json` - TypeScript config
   - `tsconfig.test.json` - Test TypeScript config
   - `next.config.mjs` - Next.js config
   - `components.json` - Component config (Shadcn?)

2. **Code Quality & Formatting:**
   - `.markdownlint.json` - Markdown linting (references .claude/\*_/_.md)
   - `.prettierrc` - Prettier formatting config
   - `.prettierignore` - Prettier ignore patterns
   - `eslint.config.mjs` - ESLint config (modern flat config)
   - `.pr-agent.toml` - PR Agent config (1508 bytes)
   - `.pr_agent.toml` - PR Agent config alternate (3550 bytes) ← DUPLICATE!

3. **MCP Configuration:**
   - `.mcp.json` - Active config (628 bytes, minimal)
   - `.mcp.json.example` - Example template (2527 bytes, comprehensive)
   - `mcp.json.example` - Alternative example (1497 bytes)
   - ⚠️ **GAP:** .mcp.json is much smaller than example; missing `ccusage`,
     `firebase`, `github`, `filesystem` configs

4. **Firebase Configuration:**
   - `.firebaserc` - Project mapping (84 bytes, default: sonash-app)
   - `firebase.json` - Firebase hosting config
   - `firestore.indexes.json` - Firestore index definitions
   - `public/manifest.json` - PWA manifest (references /pwa-icon.jpg)

5. **Other Project Config:**
   - `knip.json` - Unused code detection
   - `geocoding_cache.json` - Geocoding cache
   - `.prettierignore` - Prettier ignore file

**Subdirectories:**

1. **.vscode/ (2 files)**
   - `settings.json` - VS Code settings (includes SonarLint, GitHub Copilot,
     Claude Code)
   - `mcp.json` - MCP servers for VS Code (Playwright, Puppeteer,
     Context7/Upstash)

2. **.husky/ (2 executable hooks + templates)**
   - `pre-commit` - Executable (0755, updated 2026-02-18)
   - `pre-push` - Executable (0755)
   - `_/` - Templates directory (husky internals)
   - ✓ Both hooks are executable

3. **.qodo/ (1 file)**
   - `pr-agent.toml` - QodoAI/Qodo config (4394 bytes, updated 2026-02-18)

4. **.serena/ (1 file)**
   - `project.yml` - Serena configuration (7095 bytes, project config)

5. **.claude/ (structured)**
   - Settings: settings.json, settings.global-template.json, settings.local.json
   - Markdown docs: COMMAND_REFERENCE.md, CROSS_PLATFORM_SETUP.md, HOOKS.md,
     REQUIRED_PLUGINS.md, STATE_SCHEMA.md
   - MCP template: mcp.global-template.json
   - State: .claude/state/ (11 files, JSONL + JSON)
   - Hooks: .claude/hooks/ (22 JS scripts + internal files)
   - Plans: 7 plan files
   - Test protocols: 39 protocol.json files

**GitHub Configuration:**

- `.github/workflows/` - 10 workflow files
- `.github/pull_request_template.md` - Template
- `.github/copilot-instructions.md` - GitHub Copilot instructions
- `.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md` - Issue template

**CRITICAL GAPS & INCONSISTENCIES:**

1. **PR-Agent Configuration Duplication:**
   - `.pr-agent.toml` (1508 bytes)
   - `.pr_agent.toml` (3550 bytes) - Much larger!
   - ⚠️ **WHICH ONE IS ACTIVE?** Both files exist; potentially conflicting
     configs

2. **MCP Configuration Incomplete:**
   - `.mcp.json` (628 bytes) - MINIMAL, only has: playwright, memory, sonarcloud
   - `.mcp.json.example` (2527 bytes) - Has: ccusage, firebase, sonarcloud,
     github, filesystem, puppeteer, playwright
   - ⚠️ **ACTION NEEDED:** .mcp.json missing critical servers (Firebase, GitHub,
     filesystem)

3. **Missing MCP Config Entry:**
   - `.mcp.json` references "sonarcloud" but missing "github" for PR automation
   - `.mcp.json` missing "memory" server reference (it's there but .example
     better documents it)

4. **No Documented MCP Setup**
   - docs/MCP_SETUP.md exists but .mcp.json not matching recommended setup

5. **.vscode/mcp.json vs .mcp.json**
   - VS Code has its own MCP config (Context7, Puppeteer, Playwright)
   - Root .mcp.json has different servers (playwright, memory, sonarcloud)
   - ⚠️ Potential inconsistency in MCP server availability

6. **.qodo/ Directory**
   - Contains `pr-agent.toml` - why? Should be root-level only?
   - Duplicates root `.pr-agent.toml`?

7. **Public Manifest**
   - `public/manifest.json` references `/pwa-icon.jpg`
   - ⚠️ **VERIFY:** Is /pwa-icon.jpg actually in public/?

8. **Prettier Config**
   - `.prettierrc` - Config file
   - `.prettierignore` - Ignore patterns
   - ✓ Both present, structure seems OK

9. **TypeScript Config Fragmentation**
   - `tsconfig.json` - Main config
   - `tsconfig.test.json` - Test config
   - No documented separation/inheritance strategy

10. **Hook Configuration Inconsistency**
    - `.husky/pre-commit` (updated 2026-02-18)
    - `.husky/pre-push` (updated 2026-02-17)
    - Different update dates suggest recent changes

---

## **SUMMARY OF CRITICAL GAPS:**

### **Domain 11 (Skills):**

- 4 skills on disk not in registry (audit-ai-optimization, audit-health,
  create-audit, docs-maintain)
- 5 deprecated skills still in registry (docs-sync, docs-update,
  expansion-evaluation, save-context, sonarcloud-sprint)
- Version count mismatch (54 vs 55 vs 56)

### **Domain 12 (Agents):**

- ✓ All agents present and properly structured
- No major gaps detected

### **Domain 13 (CI/CD):**

- Mixed action pinning strategy (v4 tags + SHA pins inconsistently used)
- No CODEOWNERS file
- No FUNDING.yml
- No branch protection rules documented

### **Domain 14 (Documentation):**

- No line-limit enforcement for markdown files (139KB files exist)
- Archive files with non-ASCII names in expansion-ideation/
- No clear deprecation policy for archived content

### **Domain 15 (Configuration):**

- **PR-Agent config duplication** (.pr-agent.toml vs .pr_agent.toml - different
  sizes!)
- **MCP config incomplete** (.mcp.json has 3 servers vs 7 in .example)
- **.qodo/ contains duplicate pr-agent.toml**
- Potential public/manifest.json icon reference mismatch
- .vscode/mcp.json different from root .mcp.json

All findings documented with absolute file paths above.

=== AGENT a3b01c9 === Perfect! Now I have comprehensive information. Let me
compile the final report:

## COMPREHENSIVE SECOND GAP ANALYSIS PASS - DOMAINS 16-21

Based on thorough exploration of the codebase, here are the complete findings
for all missing components from your system-test plan:

---

## **DOMAIN 16: TDMS (Technical Debt Management System) - ~20 files**

### File Structure & Inventory

- **MASTER_DEBT.jsonl**: 2,656 lines (2.5MB) - canonical source
- **FALSE_POSITIVES.jsonl**: 4 entries (6KB)
- **LEGACY_ID_MAPPING.json**: 160KB - maps external IDs (sonarcloud:_, CANON-_,
  review:\*) to DEBT-XXXX
- **Views directory** (5 files):
  - `by-category.md` (600KB)
  - `by-severity.md` (702KB)
  - `by-status.md` (309KB)
  - `unplaced-items.md` (2.4KB)
  - `verification-queue.md` (12KB)

### JSONL Entry Fields (20 fields per entry)

```
category, content_hash, created, description, effort, file, id, line, merged_from,
recommendation, resolution, roadmap_ref, severity, source_file, source_id, status,
title, type, verified_by
```

### Enumerated Values

**Statuses (4):** NEW, VERIFIED, IN_PROGRESS, RESOLVED, FALSE_POSITIVE

**Categories (10):** code-quality, code, documentation, process,
ai-optimization, security, performance, refactoring, enhancements,
engineering-productivity

**Severities (4):** S0 (Critical), S1 (High), S2 (Medium), S3 (Low)

**Efforts (4):** E0 (Minutes), E1 (Hours), E2 (Days), E3 (Weeks)

**Source IDs**: sonarcloud:_, audit:_, review:_, pr-review:_, manual:_, unknown,
OPT-_ (optimization findings), intake-\*

### Debt Scripts (18 files in scripts/debt/)

```
assign-roadmap-refs.js          check-phase-status.js        consolidate-all.js
dedup-multi-pass.js             extract-audits.js            extract-reviews.js
generate-metrics.js             generate-views.js            intake-audit.js
intake-manual.js                intake-pr-deferred.js        normalize-all.js
resolve-bulk.js                 resolve-item.js              sync-roadmap-refs.js
sync-sonarcloud.js              validate-schema.js           backfill-hashes.js
```

### Related Files & Metrics

- **metrics.json**: Machine-readable summary (generated by
  `npm run tdms:metrics`)
- **metrics.md**: Human-readable dashboard (auto-generated)
- **Raw logs dir** (6 files):
  - audits.jsonl, deduped.jsonl, normalized-all.jsonl, review-needed.jsonl,
    reviews.jsonl, ims-archive-2026-02-12.jsonl
- **Logs dir** (20+ files): dedup-log, grand-plan-manifest, intake-log,
  metrics-log, resolution-log, sprint-1/2/3-ids,
  s1/2/2s3/3-duplicate-candidates, s2-verification-batch

### TDMS Configuration Files

- **docs/technical-debt/PROCEDURE.md**: Step-by-step TDMS intake procedures
- **docs/technical-debt/INDEX.md**: Reference guide
- **docs/technical-debt/FINAL_SYSTEM_AUDIT.md**: Audit summary

### Key Stats

- Total items: 2,656
- Open items: 2,086 (78%)
- Resolved: 298 (11%)
- False positives: 272 (10%)
- Distribution: code-quality 58% (1,546), documentation 18% (468), process 13%
  (338)

---

## **DOMAIN 17: Roadmap - ~5 files**

### Files Inventory

1. **ROADMAP.md** (45KB): Primary active roadmap
   - Version 3.25, Document Status: ACTIVE
   - Structure: Phases + Priority buckets (no date-based scheduling)
   - Contains milestones overview table, vision, 7+ milestones with detailed
     status

2. **ROADMAP_FUTURE.md** (exists - actively maintained)
   - Version 1.3, for Milestones M2-M10 (future planning)
   - Structure: Phase + Priority system, task breakdowns, parallel groups
   - Scope: Detailed specifications not yet in active development

3. **ROADMAP_LOG.md** (exists - append-only archive)
   - Version 2.0, completed items archive
   - Documents: M0, M1, Track A, integrated improvement plan, documentation
     standardization

### DEBT-XXXX References in Roadmap

Found **40+ explicit DEBT-\* references** including:

```
DEBT-0012, DEBT-0037, DEBT-0854, DEBT-1056, DEBT-1064, DEBT-1538,
DEBT-1624, DEBT-1912, DEBT-2499, DEBT-3079, DEBT-3080, DEBT-2809, DEBT-2811,
DEBT-0944, DEBT-0945
```

All integrated with milestone planning (e.g., M2.1, Track-E references).

### Roadmap Validation & Management Scripts

- **scripts/check-roadmap-health.js** (validates structure)
- **scripts/check-roadmap-hygiene.js** (checks formatting)
- **scripts/debt/assign-roadmap-refs.js** (assigns DEBT-XXXX to roadmap items)
- **scripts/debt/sync-roadmap-refs.js** (sync roadmap → TDMS)
- **npm run roadmap:validate** command
- **npm run roadmap:hygiene** command

### Cross-References

- ROADMAP.md references ROADMAP_FUTURE.md and ROADMAP_LOG.md
- Section 6 of claude.md references roadmap update triggers
- .github/workflows/validate-plan.yml validates roadmap structure

---

## **DOMAIN 18: Integration (Cross-System Connections)**

### Husky Hooks (2 files)

1. **`.husky/pre-commit`** (17.8KB)
   - Runs: npm run lint (ESLint), lint-staged (Prettier auto-format)
   - Cognitive complexity check on NEW JS files (error on CC > 15)
   - Requires SKIP_REASON for overrides (10-500 chars, no control chars)
   - Pattern compliance checks (hardcoded 14 files)

2. **`.husky/pre-push`** (9.3KB)
   - Runs: `npm run deps:circular` (architectural check)
   - Pattern compliance (covered by pre-commit)
   - Code-reviewer gate for script changes
   - Validates code-reviewer invocation this session

### CI/CD Workflows (8 files in .github/workflows/)

- **ci.yml**: Main pipeline (lint → typecheck → test → circular deps → pattern
  check → TDMS validation)
- **resolve-debt.yml**: Extracts DEBT-XXXX from PR body, runs
  `scripts/debt/resolve-bulk.js`
- **sonarcloud.yml**: Integrates SonarCloud analysis, feeds to TDMS via
  sync-sonarcloud.js
- **validate-plan.yml**: Validates ROADMAP.md structure
- **deploy-firebase.yml**: Deployment pipeline
- **docs-lint.yml**: Documentation validation
- **review-check.yml**: PR review thresholds
- **auto-label-review-tier.yml**: PR labeling
- **backlog-enforcement.yml**: References MASTER_DEBT.jsonl (migrated from
  AUDIT_FINDINGS_BACKLOG.md)

### TDMS-CI Integration

- SonarCloud → sync-sonarcloud.js → MASTER_DEBT.jsonl
- resolve-debt.yml automatically resolves items when PR merged with "Resolves:
  DEBT-XXXX"
- TDMS validation in CI blocks if MASTER_DEBT.jsonl malformed
- Debt views auto-generated by CI pipeline

### Hook-Script Connection

- **npm scripts trigger hooks**: lint, format:check, test all invoked by
  pre-commit
- **Hook-script registry**: scripts/lib/ contains helper functions
- **ESLint integration**: .husky/pre-commit runs ESLint + CC complexity check
- **Pattern compliance**: `.husky/pre-push` validates via
  `npm run patterns:check`

### MCP Server Integration (scripts/mcp/)

- **sonarcloud-server.js** (Node.js MCP server)
- **sonarcloud.mcpb** (compiled binary)
- **manifest.json** - configures:
  - Tools: get_security_hotspots, get_issues, get_quality_gate,
    get_hotspot_details
  - User config: SONAR_TOKEN (required), SONAR_URL (optional)
  - Description: "MCP server for SonarCloud/SonarQube integration"

### Integration Test Pattern

- Tests stored in `tests/**/*.test.ts`
- Run via: `npm run test` (uses Node test runner)
- Pre-push hook already validates circular deps before push

---

## **DOMAIN 19: ESLint Plugin (~4 files)**

### Plugin Structure

- **eslint-plugin-sonash/index.js** (main plugin entry, 37 lines)
- **Rules directory** (3 security-focused rules, 516 lines total):
  - `no-unguarded-file-read.js` (112 lines)
  - `no-stat-without-lstat.js` (171 lines)
  - `no-toctou-file-ops.js` (233 lines)

### Rules Defined (3 rules)

1. **no-unguarded-file-read**: File reads must be in try/catch (race condition
   protection)
2. **no-stat-without-lstat**: statSync() requires preceding lstatSync() (symlink
   attack protection)
3. **no-toctou-file-ops**: Detects TOCTOU vulnerability (existsSync +
   readFileSync pattern)

### Plugin Configuration

- **eslint.config.mjs** loads plugin via:
  ```javascript
  const sonash = require("./eslint-plugin-sonash/index.js");
  ```
- Applied to high-risk directories:
  - `scripts/**/*.{js,ts}`
  - `.claude/hooks/**/*.{js,ts}`
  - `.husky/**/*.{js,ts}`
- Config: Flat config format (ESLint 9 compatible)
- Recommended rules enabled as "warn" level

### Test Coverage

- No dedicated test files found (rules implemented but no .test.js files)
- Rules reference CODE_PATTERNS.md for documentation

### Security Patterns Integration

- Rules enforce patterns from `/docs/agent_docs/CODE_PATTERNS.md`
- Pre-commit hook includes manual CC check (separate from ESLint)
- Pattern compliance checker runs via npm scripts

---

## **DOMAIN 20: Final Report Generation**

### Audit Output Structure

**Single-Session Audits**
(docs/audits/single-session/<category>/audit-YYYY-MM-DD/):

- AI_OPTIMIZATION_AUDIT_REPORT.md (example: 200+ lines, structured summary)
- REVIEW_DECISIONS.md (capture rationale)
- all-findings-deduped.jsonl (unified findings)
- Stage-N-\*.jsonl (incremental findings per analysis stage)

**Multi-AI Audits** (docs/audits/multi-ai/<timestamp>/:

- canon/ (canonicalized findings)
- final/ (final aggregated reports)
- raw/ (raw AI outputs before processing)
- state.json (audit execution state)
- COORDINATOR.md (orchestration plan)

### Report Templates (9 audit types in docs/audits/multi-ai/templates/)

- AI_OPTIMIZATION_AUDIT.md
- CODE_REVIEW_AUDIT.md
- DOCUMENTATION_AUDIT.md
- ENGINEERING_PRODUCTIVITY_AUDIT.md
- ENHANCEMENT_AUDIT.md
- PERFORMANCE_AUDIT.md
- PROCESS_AUDIT.md
- REFACTORING_AUDIT.md
- SECURITY_AUDIT.md
- SHARED_TEMPLATE_BASE.md (boilerplate)
- AGGREGATOR.md (aggregation patterns)

### Report Generation Scripts

- **scripts/debt/extract-audits.js** - Extracts audit findings
- **scripts/debt/generate-metrics.js** - Auto-generates metrics.md dashboard
- **scripts/debt/generate-views.js** - Generates category/severity/status views
- **scripts/aggregate-audit-findings.js** - Crossrefs findings with TDMS

### Report Structure Standards (AUDIT_STANDARDS.md defines):

- Executive summary table (severity × effort breakdown)
- Domain heatmap (findings per domain, highest severity)
- Top 10 highest-impact items (sorted by severity then effort)
- Quick wins list (S2+ with E0 effort)
- Recommended action plan (phased by effort)
- Evidence requirements per finding

### Audit Tracker (docs/audits/AUDIT_TRACKER.md)

- Documents all audit completions + threshold resets
- Per-category threshold tracking
- Multi-AI escalation triggers (100 commits, 14 days, major milestone)
- Examples show 5+ single-session audits per category, with detailed findings
  counts

### Visualization & Dashboard Tools

- **METRICS.md** - Dashboard (auto-generated by npm run tdms:metrics)
- **metrics.json** - Machine-readable metrics
- **RESULTS_INDEX.md** - Index of all audit results
- Views (by-category.md, by-severity.md, by-status.md) - Filterable findings

---

## **DOMAIN 21: Post-Test Self-Audit & Meta-Analysis**

### PR Retrospective Skill (pr-retro)

**File**: `.claude/skills/pr-retro/SKILL.md` (v2.2, 150+ sections)

**Structure**:

1. **CRITICAL RULES** (5 mandatory practices)
   - ALWAYS produce full retro (every section, every round)
   - ALWAYS display complete retro to user
   - Every observation must have recommended action
   - Reference actual round data with specifics
   - Cross-check previous retro action items (unimplemented recurring
     recommendations = finding)
   - Mandatory cross-PR systemic analysis (last 3-5 retros for pattern
     detection)

2. **Step 1: Gather Review Data**
   - Find all review rounds (docs/AI_REVIEW_LEARNINGS_LOG.md + archives)
   - Extract per-round data (fixes, deferrals, patterns, files)
   - Check git history
   - Check TDMS for deferred items
   - Check previous retros (MANDATORY)

3. **Step 2: Analyze Churn**
   - Ping-pong detection (fixes in RN → new issues in RN+1)
   - Scope creep detection (pre-existing vs this-PR)
   - Recurring pattern detection (3+ rounds = automation candidate)
   - Rejection analysis (false-positive rate by source)

4. **Step 3: Produce Actionable Output**
   - Mandatory format sections (scales to review cycle depth)
   - Per-round breakdown tables
   - Churn chains with escalation patterns
   - Action items with effort estimates

### Learning & Retrospective Patterns in Codebase

1. **AI_REVIEW_LEARNINGS_LOG.md** - Centralized learning capture
   - Tracks CodeRabbit, Qodo, SonarCloud reviews
   - Pattern categories (symlink guards, ReDoS, complexity, etc.)
   - Session-linked evidence

2. **Code Review Checklist** (pr-review/references/code_review_checklist.md)
   - Tracks patterns from 347+ AI reviews
   - Enforced by `npm run patterns:check`

3. **CODE_PATTERNS.md** (v3.2, 347+ reviews)
   - **Quick Reference**: 5 critical patterns
   - **Priority Tiers**: 🔴 Critical, 🟡 Important, ⚪ Edge case
   - **Pattern Categories**: Error sanitization, TOCTOU, ReDoS, execSync,
     symlinks, atomic writes, etc.

### Self-Audit Mechanisms

1. **Session-End Audits**
   - `.claude/skills/session-end/SKILL.md` runs quality checks
   - Updates ROADMAP.md, ROADMAP_LOG.md
   - Archives completed items

2. **Alerts System**
   - `.claude/skills/alerts/SKILL.md` - System health alerts
   - Tracks pending work, debt accumulation
   - Triggered via npm run alerts

3. **Retrospective Data Sources**
   - docs/audits/AUDIT_TRACKER.md (threshold reset history)
   - ROADMAP_LOG.md (completed items archive)
   - AI_REVIEW_LEARNINGS_LOG.md (pattern evolution)
   - docs/technical-debt/logs/ (intake, dedup, resolution logs)

### Existing Self-Audit Patterns Found

1. **Deduplication validation** (scripts/debt/dedup-multi-pass.js)
2. **Schema validation** (scripts/debt/validate-schema.js)
3. **View regeneration** (scripts/debt/generate-views.js)
4. **Cross-doc dependency checking** (scripts/check-cross-doc-deps.js)
5. **Pattern compliance auditing** (scripts/check-pattern-compliance.js)
6. **Skill validation** (scripts/validate-skill-config.js)
7. **Circular dependency detection** (npm run deps:circular via madge)

### Multi-AI Audit Orchestration (multi-ai-audit skill)

- Agent teams mode (4 parallel groups)
- Subagent fallback mode (3-stage execution)
- S0/S1 escalation during aggregation
- Cross-cutting finding detection via agent messages
- Episodic memory integration (search past audits)

---

## **CRITICAL GAPS IDENTIFIED FOR SYSTEM-TEST PLAN**

### Missing Test Coverage (What the plan should verify)

1. **Domain 16 - TDMS**
   - [ ] Verify JSONL schema compliance (all 20 fields present)
   - [ ] Test legacy ID mapping (sonarcloud → DEBT-XXXX)
   - [ ] Validate FALSE_POSITIVES.jsonl ingestion
   - [ ] Test view generation accuracy (by-category, by-severity, by-status)
   - [ ] Verify roadmap_ref resolution (DEBT-XXXX → milestone tracking)
   - [ ] Integration: PR merge → resolve-debt workflow
   - [ ] Integration: SonarCloud → sync-sonarcloud → MASTER_DEBT.jsonl
   - [ ] Intake procedures (manual, audit, pr-review, sonarcloud sources)

2. **Domain 17 - Roadmap**
   - [ ] DEBT-XXXX references consistency with MASTER_DEBT.jsonl
   - [ ] Milestone phase/priority system validation
   - [ ] Cross-references between ROADMAP.md ↔ ROADMAP_FUTURE.md ↔
         ROADMAP_LOG.md
   - [ ] Roadmap validation script output
   - [ ] DEBT progression tracking (NEW → VERIFIED → RESOLVED vs roadmap_ref)

3. **Domain 18 - Integration**
   - [ ] Pre-commit hook execution sequence
   - [ ] ESLint + CC check + lint-staged ordering
   - [ ] Pre-push circular dependency detection
   - [ ] Code-reviewer gate for script changes
   - [ ] CI workflow trigger conditions and ordering
   - [ ] SonarCloud → MCP → TDMS pipeline end-to-end
   - [ ] Resolve-debt workflow on PR merge
   - [ ] Hook-to-script callback patterns

4. **Domain 19 - ESLint Plugin**
   - [ ] Rule firing on high-risk directories
   - [ ] File read protection (try/catch validation)
   - [ ] Symlink attack detection (lstat prerequisite)
   - [ ] TOCTOU vulnerability detection
   - [ ] Flat config ESLint 9 compatibility
   - [ ] Recommended config application

5. **Domain 20 - Final Report**
   - [ ] Audit report structure compliance
   - [ ] Severity/effort distribution accuracy
   - [ ] Domain heatmap generation
   - [ ] Top-10 recommendations ordering (severity × effort)
   - [ ] Quick wins identification (S2+ E0)
   - [ ] AUDIT_TRACKER.md synchronization
   - [ ] Multi-AI aggregation accuracy
   - [ ] Report archival procedures

6. **Domain 21 - Self-Audit**
   - [ ] PR-retro mandatory sections completion
   - [ ] Ping-pong detection accuracy
   - [ ] Recurring pattern identification (3+ rounds)
   - [ ] Action item effort estimation
   - [ ] Cross-PR systemic analysis (last 5 retros)
   - [ ] Pattern compliance checker coverage
   - [ ] Code pattern documentation sync with enforcement

---

## **KEY REPO PATHS (relative)**

### TDMS Files

- `docs/technical-debt/MASTER_DEBT.jsonl`
- `docs/technical-debt/FALSE_POSITIVES.jsonl`
- `docs/technical-debt/LEGACY_ID_MAPPING.json`
- `docs/technical-debt/metrics.json`
- `docs/technical-debt/METRICS.md`
- `docs/technical-debt/INDEX.md`
- `docs/technical-debt/PROCEDURE.md`
- `docs/technical-debt/FINAL_SYSTEM_AUDIT.md`
- `docs/technical-debt/views/` (5 markdown files)
- `docs/technical-debt/raw/` (6 JSONL files)
- `docs/technical-debt/logs/` (20+ files)

### Debt Scripts

- `scripts/debt/` (18 .js files)

### Roadmap Files

- `ROADMAP.md`
- `ROADMAP_FUTURE.md`
- `ROADMAP_LOG.md`

### Hooks & Workflows

- `.husky/pre-commit`
- `.husky/pre-push`
- `.github/workflows/` (8 .yml files)

### ESLint Plugin

- `eslint-plugin-sonash/index.js`
- `eslint-plugin-sonash/rules/` (3 .js files)
- `eslint.config.mjs`

### Audit System

- `docs/audits/AUDIT_STANDARDS.md`
- `docs/audits/AUDIT_TRACKER.md`
- `docs/audits/README.md`
- `docs/audits/single-session/` (9 category dirs with audit reports)
- `docs/audits/multi-ai/` (templates + execution dirs)

### Skills

- `.claude/skills/pr-retro/SKILL.md`
- `.claude/skills/audit-code/SKILL.md`
- `.claude/skills/system-test/SKILL.md`
- `.claude/skills/SKILL_INDEX.md`
- 54 total skills in `.claude/skills/`

### Reference Documentation

- `docs/agent_docs/CODE_PATTERNS.md`
- `scripts/mcp/manifest.json`
- `scripts/mcp/sonarcloud-server.js`

This completes the SECOND GAP ANALYSIS PASS for Domains 16-21 with comprehensive
field-level detail, enumerated values, integration points, and test coverage
gaps.
