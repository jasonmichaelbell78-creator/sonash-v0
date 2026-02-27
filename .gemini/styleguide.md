<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-27
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SoNash Code Review Style Guide

This guide defines coding standards and review expectations for the SoNash
project — a privacy-first ADHD management app built with Next.js and Firebase.

## Stack Versions (do NOT flag as outdated or invalid)

These are intentionally bleeding-edge and newer than your training data:

- Next.js 16.1.6 (App Router)
- React 19.2.3
- Firebase 12.8.0 (Modular SDK)
- Tailwind CSS 4.1.18
- Zod 4.3.5
- TypeScript strict mode

## Architecture Rules

### Repository Pattern

All Firestore queries go through service files in `lib/`, not inline in
components. New queries must be added to `lib/firestore-service.ts` or a
domain-specific service file.

### Security Model (CRITICAL — flag violations as CRITICAL)

- **All Firestore writes MUST go through Cloud Functions** using
  `httpsCallable`. Direct writes to `journal`, `daily_logs`, or
  `inventoryEntries` collections from client code are security violations.
- **App Check is required** on all Cloud Functions — verify tokens are checked.
- **Rate limiting** — Cloud Functions must handle 429 errors. Client-side should
  use `sonner` toasts to display rate limit feedback.

### State Management

- `useState` for component-local state
- React Context for global client state
- Firestore for server/persistent state
- Zod for runtime validation matching TypeScript interfaces

## Critical Anti-Patterns (flag as HIGH or CRITICAL)

These are the most common issues in this codebase. Flag them aggressively:

1. **Raw error.message in responses** — Use `scripts/lib/sanitize-error.js` to
   strip PII before logging or returning errors. Never expose raw error messages
   to clients.

2. **Path traversal via `startsWith('..')`** — This is bypassable. Use
   `/^\.\.(?:[\/\\]|$)/.test(rel)` for path traversal detection.

3. **Direct Firestore writes in components** — Must use `httpsCallable` Cloud
   Functions. This is a security boundary, not a preference.

4. **`exec()` without `/g` flag** — Causes infinite loops. Always use the global
   flag with `exec()` in loops.

5. **File reads without try/catch** — `existsSync` has TOCTOU race conditions.
   Wrap all file operations in try/catch.

6. **Symlink attacks on file writes** — Check with `lstatSync` before writing to
   prevent symlink-following attacks. Use `scripts/lib/security-helpers.js`.

7. **Regex complexity** — If a regex is flagged twice for complexity (ReDoS
   risk), it should be replaced with string parsing, not patched.

## Do NOT Flag (known patterns, not bugs)

These have been reviewed and intentionally accepted. Flagging them wastes review
cycles:

### CLI Scripts (`scripts/`, `.claude/hooks/`)

- **Console.log usage** — CLI scripts use console.log intentionally. Structured
  logging is tracked as DEBT-0455 and requires a project-wide logger library.
- **Missing actor/user context in JSON output** — Actor identity lives in
  `resolution-log.jsonl`, not in ephemeral CI artifacts.
- **Empty catch blocks in JSONL parsing** — Intentional resilience. JSONL files
  may have partial writes; the parser skips malformed lines gracefully.
- **TOCTOU in single-user CLI scripts** — These are offline dev tools with no
  concurrent access. TOCTOU is acceptable risk.
- **S4036 PATH binary hijacking** — `execFileSync("git", [...])` and similar
  calls with hardcoded binary names and array arguments are safe. No shell
  injection risk.
- **Raw error details in CLI error output** — Dev tools that display filesystem
  errors on failure are acceptable. Internal paths aid debugging.

### Data Files (`docs/technical-debt/`, `docs/audits/`)

- **Placeholder titles/descriptions in JSONL** — Automated pipeline output from
  multi-AI audit aggregation. Not hand-edited.
- **Absolute paths in older JSONL entries** — Pre-existing data, not introduced
  by current PRs. Pipeline now uses repo-relative paths.
- **content_hash values** — Computed by the ingestion pipeline, intentionally
  stable. Do not suggest recomputation.

### Other

- **Override audit trail logging skip reasons** — `override-log.jsonl` is an
  intentional audit trail that must persist skip reasons including sensitive
  ones.
- **JSON.parse output type handling** — Do NOT suggest adding Date, RegExp, Map,
  Set, or BigInt handling for `JSON.parse` output. `JSON.parse` can only produce
  string, number, boolean, null, array, and plain object.

## Code Standards

### TypeScript

- Strict mode enabled, no `any` types
- Prefer interfaces over type aliases for object shapes
- Use Zod schemas for runtime validation that matches TS types

### React / Next.js

- Functional components with hooks only (no class components)
- `useCallback` must be defined before `useEffect` that uses it
- App Router patterns (server components by default, `"use client"` only when
  needed)

### Styling

- Tailwind CSS utility-first approach
- No CSS modules or styled-components
- Use design system tokens from the Tailwind config

### Testing

- Mock `httpsCallable` in tests, never mock direct Firestore writes
- Tests should verify behavior, not implementation details
- Use descriptive test names that explain the expected behavior

## Review Priorities

When reviewing PRs, prioritize in this order:

1. **Security** — Auth bypasses, direct Firestore writes, unsanitized errors
2. **Data integrity** — Race conditions, missing validation, lost writes
3. **Correctness** — Logic errors, edge cases, error handling
4. **Performance** — Only flag if measurably impactful (N+1 queries, unbounded
   loops)
5. **Style** — Only flag if it hurts readability or violates the above standards
