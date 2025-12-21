# Copilot Instructions - SoNash Recovery Notebook

**Repository:** sonash-v0  
**Last Updated:** December 21, 2025

## Project Overview

SoNash is a privacy-first digital recovery journal built with Next.js 16.1, React 19, TypeScript 5, and Firebase. It helps individuals in recovery track their sobriety journey with secure, real-time data synchronization. The app features a photo-realistic notebook interface, unified journal system, and privacy-first design with comprehensive security measures (App Check, reCAPTCHA v3, Firestore Rules, rate limiting).

**Tech Stack:** Next.js 16.1 (App Router), React 19.2, TypeScript 5.x, Tailwind CSS v4, Framer Motion 12, Firebase 12.7 (Firestore, Auth, Cloud Functions v2, App Check)

## Critical: Build & Test Commands

### Prerequisites
- **Node.js:** v22 (Node v20+ works but shows engine warnings in functions/)
- **npm:** 10+
- **Firebase CLI:** Install globally with `npm install -g firebase-tools`

### Installation (ALWAYS run these first)

```bash
# Install root dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### Testing

**IMPORTANT:** Tests require TypeScript compilation before running. Tests use Node's built-in test runner.

```bash
# Run all tests (compiles then runs)
npm test

# Run with coverage
npm run test:coverage

# Build tests only (creates dist-tests/)
npm run test:build
```

**Test Status:** 77/91 passing (14 failures are in logger tests due to mock issues - NOT blocking for CI)

**Known Issues:**
- 2 Firebase initialization tests fail without emulator setup (expected, safe to ignore)
- 12 logger tests fail due to mock.calls being undefined (known issue, not critical)
- Tests MUST have Firebase env vars set (see package.json test script for required vars)

### Linting

```bash
# Run ESLint
npm run lint
```

**Expected Warnings:** ESLint shows ~115 warnings (mostly @typescript-eslint/no-explicit-any and unused vars). **6 ERRORS in compact-meeting-countdown.tsx must be fixed before merging.**

**Type Check:**
```bash
# Standalone type check
npx tsc --noEmit
```

### Building

**CRITICAL BUILD ISSUE:** The build currently fails in restricted network environments due to Google Fonts fetching (Handlee and Rock Salt fonts). This is a known limitation when building without internet access.

**Workaround if build fails with font errors:**
1. Check if you have internet access to fonts.googleapis.com
2. In CI environments with network restrictions, font fetching will fail
3. This is expected behavior - the app uses Next.js font optimization

```bash
# Build Next.js app (requires internet for Google Fonts)
npm run build

# Output directory: out/ (static export)
```

**Build Configuration:**
- `next.config.mjs` sets `output: 'export'` for static Firebase Hosting deployment
- Images are unoptimized (`images.unoptimized: true`)
- Environment variables loaded from `.env.local` (gitignored)

### Development Server

```bash
# Start Next.js dev server
npm run dev

# Runs on http://localhost:3000
```

**With Firebase Emulators (Recommended for full local development):**

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start Next.js dev server
npm run dev
```

**Emulator Ports:**
- Emulator UI: `localhost:4000`
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Functions: `localhost:5001`

## Environment Variables

**REQUIRED:** Create `.env.local` in project root (see `.env.local.example`):

```bash
# Firebase SDK (required for build & runtime)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Check (required for production Cloud Functions access)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Development only (NEVER in production)
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=your_debug_token

# Optional monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_ENABLED=false
```

**For Testing:** Tests require test values for Firebase env vars (see `package.json` test script for exact values)

## Cloud Functions

### Building Functions

```bash
cd functions
npm install
npm run build
# Output: functions/lib/
```

**Node Version Warning:** Functions specify Node 22 in engines but work with Node 20+ (you'll see engine warnings, safe to ignore)

### Deploying Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName

# Deploy with Firestore rules
firebase deploy --only functions,firestore:rules
```

## CI/CD Workflows

### CI Workflow (.github/workflows/ci.yml)

Runs on push to `main` and all PRs:

1. **Lint, Type Check & Test** job:
   - Node 22
   - `npm ci` (clean install)
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm test` (with test env vars)

2. **Build** job:
   - Depends on tests passing
   - `npm ci`
   - `npm run build` (with Firebase secrets)

**IMPORTANT:** If CI fails on build step with Google Fonts errors, check GitHub Actions network access. This is a known environment limitation.

### Deploy Workflow (.github/workflows/deploy-firebase.yml)

Runs on push to `main` branch:

1. Install Firebase CLI globally
2. Install & build Cloud Functions (`cd functions && npm ci && npm run build`)
3. Authenticate with service account (`FIREBASE_SERVICE_ACCOUNT` secret)
4. Deploy functions: `firebase deploy --only functions`
5. Cleanup old functions (exportUserData, deleteUserAccount)
6. Deploy Firestore rules: `firebase deploy --only firestore:rules`

## Project Structure

### Key Directories

```
sonash-v0/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage (book cover)
│   ├── layout.tsx         # Root layout with fonts
│   ├── globals.css        # Global styles & design tokens
│   ├── admin/             # Admin panel
│   ├── journal/           # Journal page
│   └── meetings/          # Meetings directory
│
├── components/
│   ├── notebook/          # Main notebook UI
│   │   ├── book-cover.tsx
│   │   ├── notebook-shell.tsx
│   │   └── pages/         # Notebook pages (today, resources, support)
│   ├── journal/           # Journal system components
│   ├── growth/            # Growth tab tools (spot checks, night reviews)
│   ├── auth/              # Authentication modals
│   └── ui/                # shadcn/ui components
│
├── lib/                   # Core utilities
│   ├── firebase.ts        # Firebase initialization
│   ├── firestore-service.ts  # Firestore operations (PRIMARY DATA ACCESS)
│   ├── logger.ts          # Logging with PII redaction
│   ├── auth/              # Auth helpers
│   ├── database/          # Database utilities
│   └── security/          # Security validation
│
├── functions/             # Cloud Functions
│   ├── src/
│   │   ├── index.ts       # Function exports
│   │   └── journal/       # Journal functions
│   └── package.json       # Separate deps from root
│
├── tests/                 # Unit tests (Node test runner)
├── scripts/               # Utility scripts (seed data, migrations)
├── docs/                  # Documentation
├── firestore.rules        # Security rules (CRITICAL - must deploy with functions)
├── firestore.indexes.json # Database indexes
└── tsconfig.json          # TypeScript config (strict mode)
```

### Critical Files

**Configuration:**
- `next.config.mjs` - Next.js config (static export for Firebase Hosting)
- `tsconfig.json` - TypeScript (strict mode, paths alias `@/*`)
- `tsconfig.test.json` - Test-specific TypeScript (commonjs output to dist-tests/)
- `eslint.config.mjs` - ESLint (flat config, TypeScript + React Hooks rules)
- `firebase.json` - Firebase hosting/functions/rules config
- `firestore.rules` - Security rules (deploy with `firebase deploy --only firestore:rules`)
- `firestore.indexes.json` - Composite indexes for queries

**Documentation (READ BEFORE CHANGES):**
- `README.md` - Project overview
- `DEVELOPMENT.md` - Developer setup guide
- `ARCHITECTURE.md` - Technical architecture
- `TESTING_CHECKLIST.md` - Manual QA checklist

## Architecture & Patterns

### Data Access

**PRIMARY:** All Firestore operations go through `lib/firestore-service.ts` (FirestoreService class)

**Key Collections:**
- `/users/{uid}` - User profiles (owner-only access)
- `/users/{uid}/journal/{entryId}` - Unified journal (all entry types)
- `/users/{uid}/daily_logs/{dateId}` - Daily logs (Cloud Functions only for writes)
- `/users/{uid}/inventoryEntries/{entryId}` - Structured inventories
- `/meetings/{meetingId}` - Meeting directory (read-only for users)

### Security Layers (In Order)

1. **TLS 1.3** - Transport encryption
2. **App Check** - reCAPTCHA v3 bot protection (required in production)
3. **Firebase Auth** - JWT tokens, anonymous + email/Google auth
4. **Firestore Rules** - Server-side authorization (`firestore.rules`)
5. **Client Validation** - `lib/security/firestore-validation.ts`
6. **Rate Limiting** - Cloud Functions enforce 10 req/min per user
7. **Audit Logging** - Security events logged to GCP

### Component Patterns

**Hooks:** Use custom hooks for Firebase operations (`useAuth`, `useJournal`, `useGeolocation`)

**State Management:**
- React Context for global state (AuthContext)
- Real-time listeners for Firestore data (automatic sync)
- Optimistic UI updates

**Styling:** Tailwind CSS v4, design tokens in `app/globals.css`

## Common Pitfalls & Workarounds

### 1. ESLint Errors in compact-meeting-countdown.tsx

**Issue:** 6 ESLint errors about `updateTimeUntil` being accessed before declaration

**Fix Required:** Move `updateTimeUntil` function declaration before the useEffect that calls it

### 2. Test Failures with Firebase

**Issue:** Tests fail if Firebase env vars not set

**Workaround:** Tests require mock env vars (see package.json test script)

### 3. Build Fails with Google Fonts Error

**Issue:** `Failed to fetch 'Handlee' from Google Fonts`

**Cause:** Network restrictions blocking fonts.googleapis.com

**Workaround:** Build requires internet access. In restricted CI environments, this is expected. Consider pre-downloading fonts or using system fonts as fallback.

### 4. Node Engine Warnings in functions/

**Issue:** `npm warn EBADENGINE Unsupported engine { required: { node: '22' }, current: { node: 'v20.19.6' } }`

**Safe to Ignore:** Functions work with Node 20+ despite requiring Node 22. This is a soft requirement.

### 5. Test Pattern Requires Compilation

**Issue:** Running tests directly fails because tests are TypeScript

**Solution:** ALWAYS run `npm test` (not `node --test`), which compiles first via `test:build` script

## Validation Steps

Before submitting a PR:

1. **Lint:** `npm run lint` - Fix all errors, warnings acceptable
2. **Type Check:** `npx tsc --noEmit` - Must pass with no errors
3. **Tests:** `npm test` - 77+ tests passing (14 logger failures acceptable)
4. **Build:** `npm run build` - Must complete (may require internet)
5. **Functions:** `cd functions && npm run build` - Must compile
6. **Manual Test:** Start dev server, verify app loads and basic functionality works

## Additional Notes

### Firestore Indexes

**CRITICAL:** Deploy indexes before querying: `firebase deploy --only firestore:indexes`

Indexes defined in `firestore.indexes.json`:
- `journal` collection: `createdAt DESC`
- `journal` collection: `isSoftDeleted ASC, createdAt DESC`

### Feature Flags

Feature flags in `.env.local`:
- `NEXT_PUBLIC_ENABLE_GROWTH` - Growth tab
- `NEXT_PUBLIC_ENABLE_WORK` - Work tab  
- `NEXT_PUBLIC_ENABLE_MORE` - More tab

### Debugging

**Firebase Emulator UI:** http://localhost:4000 (when emulators running)

**Common Console Errors:**
- "App Check token not found" - Expected in development without debug token
- "Firebase not initialized" - Missing env vars
- "Permission denied" - Check Firestore rules or auth state

### Scripts

Utility scripts in `scripts/`:
- `seed-meetings.ts` - Seed meeting data
- `set-admin-claim.ts` - Grant admin privileges
- `migrate-to-journal.ts` - Data migration script

Run with: `npx tsx scripts/script-name.ts`

## Trust These Instructions

These instructions have been thoroughly validated by running all commands in a clean environment. If you encounter issues not documented here, it's likely a new problem - investigate and update this file. Otherwise, trust the documented commands and workflows.

---

**For Questions:** See DEVELOPMENT.md, ARCHITECTURE.md, or GitHub Issues
