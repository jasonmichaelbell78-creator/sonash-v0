<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-03-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SoNash Code Review Style Guide

This guide defines coding standards and review expectations for the SoNash
project — a privacy-first ADHD management app built with Next.js and Firebase.

## Stack Versions (do NOT flag as outdated or invalid)

These are intentionally bleeding-edge and newer than your training data:

- Next.js 16.2.0 (App Router)
- React 19.2.4
- Firebase 12.10.0 (Modular SDK)
- Tailwind CSS 4.2.2
- Zod 4.3.6
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
- **S5852 regex complexity** — Space-only regexes (`/ +$/gm`, `/\n+/`) in CLI
  scripts under `scripts/` and `.claude/hooks/` are bounded and operate on
  trusted local data. Not a ReDoS risk.
- **Raw error details in CLI error output** — Dev tools that display filesystem
  errors on failure are acceptable. Internal paths aid debugging.
- **Local config file access** — `config-health.js` intentionally reads
  `~/.claude/settings.json` for health scoring. This is guarded with HOME env
  check and existsSync. Not a sensitive data exposure.
- **Hook stdin field names** — Claude Code hooks receive a documented JSON
  schema via stdin. Do NOT suggest adding fallback fields (`request`, `message`,
  `content`) that don't exist in the protocol.

### Data Files (`docs/technical-debt/`, `docs/audits/`)

- **Placeholder titles/descriptions in JSONL** — Automated pipeline output from
  multi-AI audit aggregation. Not hand-edited.
- **Absolute paths in older JSONL entries** — Pre-existing data, not introduced
  by current PRs. Pipeline now uses repo-relative paths.
- **content_hash values** — Computed by the ingestion pipeline, intentionally
  stable. Do not suggest recomputation.

### Research Output Files (`.research/`)

- **Schema design suggestions on research documents** — Files under `.research/`
  are research findings and analysis outputs, NOT production code. Do NOT
  suggest schema redesigns (normalization, redundancy removal, indexing
  strategy) on research markdown or synthesis files. Flag genuine
  inconsistencies (e.g., "says 4 but lists 7") but do NOT propose alternative
  designs. The document's purpose is to capture what was researched, not serve
  as an implementation spec. (Rejected 6 items in PR #500 R1)

### Other

- **Override audit trail logging skip reasons** — `override-log.jsonl` is an
  intentional audit trail that must persist skip reasons including sensitive
  ones.
- **JSON.parse output type handling** — Do NOT suggest adding Date, RegExp, Map,
  Set, or BigInt handling for `JSON.parse` output. `JSON.parse` can only produce
  string, number, boolean, null, array, and plain object.
- **NEXT*PUBLIC*\* environment variables** — These are NOT credentials or
  secrets. Next.js intentionally exposes NEXT*PUBLIC* prefixed env vars to the
  browser. Do NOT flag them as "exposed secrets" or "sensitive data in client
  code".
- **CJS/ESM module format** — Do NOT suggest converting CJS files to ESM or vice
  versa. Files under `scripts/` and `.claude/hooks/` use their intentional
  module format. Don't suggest `import` in `.js` files that use `require()`, or
  `require()` in files that use `import`.
- **scripts/ internal tooling** — Do NOT suggest production-grade security
  hardening (structured logging, secret rotation, RBAC, rate limiting) for
  offline CLI dev tools under `scripts/`. These are internal automation scripts,
  not production services.
- **CJS module format on scripts/\*.js** — Do NOT flag CommonJS module format
  (require/module.exports) or suggest converting to ESM on intentional CommonJS
  scripts under `scripts/`. CJS is the project's established format for CLI
  tooling.
- **Repeat-rejection items** — Do NOT re-raise items that have been rejected 3+
  times across different PR review rounds with the same rationale. These are
  verified false positives. Check prior round context before raising.
- **Local config exposure on .claude/ files** — Do NOT flag "sensitive file
  access" or "local config exposure" for files under `.claude/` (.claude/hooks/,
  .claude/skills/, .claude/state/). These are local AI agent configuration
  files, not secrets or credentials. They are version-controlled intentionally.
- **R-style function signature complaints** — Do NOT flag function signature
  style complaints (e.g., "R-style naming", "unconventional parameter patterns")
  on utility functions in `scripts/lib/`. These follow the project's established
  conventions for CLI helper libraries.
- **Statusline audit trails** — Do NOT flag "audit trails" or "missing audit
  metadata" on statusline session-tracking code (`tools/statusline/`). The
  statusline is a local diagnostic tool. (Rejected 4 rounds in PR #470)
- **OpenWeatherMap API key in URL** — Do NOT flag API key in query parameter for
  OpenWeatherMap calls. No header-based auth alternative exists. (Rejected PR
  #470 R3)
- **os.ReadDir path traversal** — Do NOT flag path traversal concerns on code
  reading filenames from `os.ReadDir()` or `fs.readdirSync()`. Directory listing
  returns trusted filenames. (Rejected PR #470 R4)
- **Bash(\*) permission in settings** — Do NOT flag `Bash(*)` wildcard
  permission entries in `.claude/settings.json` or agent config files as
  security risks. The wildcard is the intended operational model for AI-assisted
  development. (Rejected across PRs #448-#477)
- **Constant extraction in scripts** — Do NOT flag "extract constants" or "magic
  strings/numbers" in bash scripts or Node.js CLI scripts under `scripts/` or
  `.claude/hooks/`. Inline values are clearer than constants files for
  self-contained CLI tools. (Rejected across PRs #448-#470)
- **Audit trails on CLI tools** — Do NOT flag "missing audit trail" or "audit
  logging required" on local dev tools under `scripts/`, `tools/`, or
  `.claude/hooks/`. These are offline developer tools, not production services.
  (Rejected across PRs #448-#477)
- **Fail-open catch blocks in hooks** — Do NOT flag "silent catch" or "swallowed
  exception" on intentional fail-open catch blocks in `.claude/hooks/` or
  `scripts/`. Beyond JSONL parsing, hooks use empty catch blocks for
  non-critical operations (telemetry, state persistence) where crashing is worse
  than skipping. (Rejected across PRs #448-#477)
- **Checksum verification on downloads** — Do NOT flag "missing checksum
  verification" on binary downloads from version-pinned URLs in scripts or
  tools. Version-pinned HTTPS URLs from known sources (e.g., GitHub releases)
  are acceptable for dev tooling. (Rejected across PRs #448-#470)

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
