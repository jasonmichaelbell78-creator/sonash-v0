# Security Instructions for Copilot

## Purpose

Scoped guidance for AI assistance in security-sensitive paths: `functions/src/`,
`lib/security/`, `firestore.rules`, and authentication code.

## Rules

### Cloud Functions (`functions/src/`)

- ALL Cloud Functions MUST use `httpsCallable` with `requireAppCheck: true` when
  App Check is enabled (currently disabled pending Firebase support resolution)
- Never write directly to `journal`, `daily_logs`, or `inventoryEntries`
  collections from client code - always use Cloud Functions
- All callable functions must validate auth: `if (!context.auth) throw new HttpsError('unauthenticated')`
- Rate limiting: handle 429 errors gracefully in client callers
- Input validation: use Zod schemas from `functions/src/schemas.ts`
- Never log raw `error.message` - use `scripts/lib/sanitize-error.js` pattern

### Firestore Rules (`firestore.rules`)

- Rules must enforce owner-only access: `request.auth.uid == userId`
- Always validate data types and field presence in write rules
- Deploy rules together with functions: `firebase deploy --only functions,firestore:rules`
- Test rule changes against `tests/` before deploying

### Authentication (`lib/auth/`, `lib/firebase.ts`)

- Anonymous auth is supported - never assume users are signed in with a provider
- `migrateAnonymousUserData` handles account linking - do not merge manually
- Google OAuth requires COOP/COEP headers configured in `firebase.json`
- Token refresh is handled automatically by Firebase SDK

### Security Utilities (`lib/security/`)

- Use existing validation functions before creating new ones
- Client-side validation is defense-in-depth, not a security boundary
- Server-side (Cloud Functions) validation is the security boundary

## Anti-Patterns

- Never use `any` type for auth context or user data
- Never trust client-provided UIDs without server verification
- Never expose Firebase Admin SDK credentials in client code
- Never use `startsWith('..')` for path traversal checks - use the regex pattern
  from CODE_PATTERNS.md

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-03-18 | Initial release |
