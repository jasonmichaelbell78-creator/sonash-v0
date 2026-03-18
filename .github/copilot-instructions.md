# Copilot Instructions - SoNash Recovery Notebook

**Repository:** sonash-v0  
**Last Updated:** March 18, 2026

## Project Overview

SoNash is a privacy-first recovery journal built with Next.js 16.1 (App Router),
React 19, TypeScript 5, and Firebase (Firestore, Auth, Cloud Functions v2, App
Check). Uses Tailwind CSS v4 for styling.

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

**IMPORTANT:** Tests require TypeScript compilation before running. Tests use
Node's built-in test runner.

```bash
# Run all tests (compiles then runs)
npm test

# Run with coverage
npm run test:coverage

# Build tests only (creates dist-tests/)
npm run test:build
```

**Test Status:** ~3776 tests across infrastructure, scripts, hooks, and
application test suites. Tests use Node's built-in test runner with TypeScript
compilation via `tsconfig.test.json`.

**Known Issues:**

- Firebase initialization tests require emulator setup (expected, safe to ignore
  in CI without emulators)
- Tests MUST have Firebase env vars set (see package.json test script for
  required vars)
- Some health-check tests depend on filesystem state and may skip gracefully

### Linting

```bash
# Run ESLint
npm run lint
```

**Expected:** ESLint should pass clean in CI. Run `npm run lint:fast` (oxlint)
for a quick correctness pre-check before the full ESLint pass.

**Type Check:**

```bash
# Standalone type check
npx tsc --noEmit
```

### Building

**FONTS NOW SELF-HOSTED:** Using @fontsource packages (Handlee, Rock Salt) - no
longer requires network access to fonts.googleapis.com during builds.

```bash
npm run build  # Output: out/ (static export for Firebase Hosting)
```

### Development Server

```bash
npm run dev  # http://localhost:3000

# With Firebase Emulators (optional):
firebase emulators:start  # Terminal 1, UI at localhost:4000
npm run dev               # Terminal 2
```

## Environment Variables

**REQUIRED:** Create `.env.local` (see `.env.local.example` for all vars). Must
include Firebase config, App Check keys, optional Sentry DSN.

## Cloud Functions

```bash
# Build functions
cd functions && npm install && npm run build && cd ..

# Deploy
firebase deploy --only functions
firebase deploy --only functions,firestore:rules  # With rules
```

**Note:** Functions specify Node 22 but work with Node 20+ (warnings are safe to
ignore)

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

**NOTE:** Fonts are self-hosted via @fontsource packages. Previously experienced
intermittent Google Fonts network errors, now resolved.

### Deploy Workflow (.github/workflows/deploy-firebase.yml)

Runs on push to `main`: builds & deploys Cloud Functions and Firestore rules
using `FIREBASE_SERVICE_ACCOUNT` secret.

## Project Structure

### Key Directories

- `app/` - Next.js pages (page.tsx, layout.tsx, globals.css, admin/, journal/,
  meetings/)
- `components/` - UI components (notebook/, journal/, growth/, auth/, ui/)
- `lib/` - Core utilities (firebase.ts, firestore-service.ts, logger.ts, auth/,
  security/)
- `functions/` - Cloud Functions (separate package.json)
- `tests/` - Unit tests (Node test runner)
- Configuration: `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`,
  `firebase.json`, `firestore.rules`

### Critical Files

- `firestore.rules` - Security rules (MUST deploy with functions)
- `firestore.indexes.json` - Composite indexes
- `tsconfig.test.json` - Test config (commonjs output to dist-tests/)
- Documentation: `README.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`

## Architecture & Patterns

### Data Access

ALL Firestore operations via `lib/firestore-service.ts`:

- `/users/{uid}` - User profiles (owner-only)
- `/users/{uid}/journal/{entryId}` - Unified journal timeline
- `/users/{uid}/daily_logs/{dateId}` - Daily logs (Cloud Functions only)
- `/meetings/{meetingId}` - Meeting directory (read-only)

### Security Layers

TLS → App Check (reCAPTCHA v3) → Firebase Auth → Firestore Rules
(`firestore.rules`) → Client Validation (`lib/security/`) → Rate Limiting (10
req/min) → Audit Logging

### Patterns

- Use `lib/firestore-service.ts` for ALL Firestore operations
- Custom hooks: `useAuth`, `useJournal`, `useGeolocation`
- State: React Context (AuthContext), real-time Firestore listeners
- Styling: Tailwind CSS v4, tokens in `app/globals.css`

## Common Issues & Fixes

1. **Tests fail**: ALWAYS run `npm test` (not `node --test`) - requires
   TypeScript compilation first via `test:build`
2. **Node engine warnings in functions/**: Safe to ignore - functions work with
   Node 20+ despite requiring Node 22
3. **Firebase test failures**: Expected without emulator - tests need mock env
   vars (see package.json)
4. **Pattern compliance failures**: Run `npm run patterns:check` to see what
   code patterns need fixing before committing
5. **Stale dist-tests/**: If tests behave unexpectedly, delete `dist-tests/` and
   re-run `npm run test:build`

## Validation Steps

Before submitting a PR:

1. **Lint:** `npm run lint` - Must pass clean (errors and warnings)
2. **Format:** `npm run format:check` - Prettier formatting enforced
3. **Type Check:** `npx tsc --noEmit` - Must pass with no errors
4. **Tests:** `npm test` - All tests passing
5. **Pattern Check:** `npm run patterns:check` - Code pattern compliance
6. **Build:** `npm run build` - Must complete (fonts are self-hosted)
7. **Functions:** `cd functions && npm run build` - Must compile
8. **Manual Test:** Start dev server, verify app loads and basic functionality
   works

## Quick Reference

**Firestore Indexes:** `firebase deploy --only firestore:indexes` (required
before first query)

**Feature Flags:** Set in `.env.local`: `NEXT_PUBLIC_ENABLE_GROWTH`,
`NEXT_PUBLIC_ENABLE_WORK`, `NEXT_PUBLIC_ENABLE_MORE`

**Common Errors:**

- "App Check token not found" → Expected in dev without debug token
- "Firebase not initialized" → Missing `.env.local`
- "Permission denied" → Check Firestore rules / auth state

**Utility Scripts:** Run with `npx tsx scripts/script-name.ts` (e.g.,
`seed-meetings.ts`, `set-admin-claim.ts`)

## Trust These Instructions

These instructions have been thoroughly validated by running all commands in a
clean environment. If you encounter issues not documented here, it's likely a
new problem - investigate and update this file. Otherwise, trust the documented
commands and workflows.

---

**For Questions:** See DEVELOPMENT.md, ARCHITECTURE.md, or GitHub Issues
