<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-01
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Framework Code Review Style Guide

This guide defines coding standards and review expectations for the Framework
project — a reusable development workflow framework providing standardized
tooling, quality gates, and development practices.

## Stack Versions (do NOT flag as outdated or invalid)

- Node.js 22 (LTS)
- TypeScript strict mode
- ESLint flat config (eslint.config.mjs)
- Prettier (100 char width, single quotes, trailing commas)
- Zod for runtime validation

## Architecture Rules

### Atomic File Operations

All file writes MUST use the tmp+rename atomic write pattern. Never write
directly to target files. Use `scripts/lib/safe-fs.js` for advisory locking
and `.claude/hooks/lib/symlink-guard.js` for path validation.

### TDMS (Technical Debt Management System)

- JSONL is the source of truth for all debt, audit, and review data
- Markdown views are GENERATED from JSONL — never edit views directly
- State rotation via `rotate-state.js` for file size management
- All debt items require a DEBT-XXXX identifier

### Hook System

- Event-driven automation hooks in `.claude/hooks/`
- Shared libraries in `.claude/hooks/lib/` (6 modules)
- Hooks use stderr for output, not stdout
- Security validation via bidirectional containment

### ESLint Plugin

- 23 custom rules in `eslint-plugin-framework/`
- Rules cover security (symlink, path traversal), correctness, and style
- Each rule must have corresponding tests

## Critical Anti-Patterns (flag as HIGH or CRITICAL)

1. **Raw error.message in responses** — Use `scripts/lib/sanitize-error.js` to
   strip PII before logging or returning errors.

2. **Path traversal via `startsWith('..')`** — This is bypassable. Use
   `/^\.\.(?:[\/\\]|$)/.test(rel)` for path traversal detection.

3. **`exec()` without `/g` flag** — Causes infinite loops. Always use the global
   flag with `exec()` in loops.

4. **File reads without try/catch** — `existsSync` has TOCTOU race conditions.
   Wrap all file operations in try/catch.

5. **Symlink attacks on file writes** — Check with `lstatSync` before writing to
   prevent symlink-following attacks. Use `scripts/lib/security-helpers.js`.

6. **Regex complexity** — If a regex is flagged twice for complexity (ReDoS
   risk), it should be replaced with string parsing, not patched.

7. **Direct JSONL file edits** — Never hand-edit JSONL data files. Use the
   TDMS scripts for all debt/audit/review data mutations.

## Do NOT Flag (known patterns, not bugs)

### CLI Scripts (`scripts/`, `.claude/hooks/`)

- **Console.log usage** — CLI scripts use console.log intentionally. Structured
  logging is a known improvement tracked in TDMS.
- **Empty catch blocks in JSONL parsing** — Intentional resilience. JSONL files
  may have partial writes; the parser skips malformed lines gracefully.
- **TOCTOU in single-user CLI scripts** — These are offline dev tools with no
  concurrent access. TOCTOU is acceptable risk.
- **S4036 PATH binary hijacking** — `execFileSync("git", [...])` and similar
  calls with hardcoded binary names and array arguments are safe. No shell
  injection risk.
- **Raw error details in CLI error output** — Dev tools that display filesystem
  errors on failure are acceptable. Internal paths aid debugging.

### Data Files (`docs/technical-debt/`)

- **Placeholder titles/descriptions in JSONL** — Automated pipeline output from
  audit aggregation. Not hand-edited.
- **Absolute paths in older JSONL entries** — Pre-existing data, not introduced
  by current PRs.
- **content_hash values** — Computed by the ingestion pipeline, intentionally
  stable. Do not suggest recomputation.

### Other

- **Override audit trail logging skip reasons** — `override-log.jsonl` is an
  intentional audit trail that must persist skip reasons.
- **JSON.parse output type handling** — Do NOT suggest adding Date, RegExp, Map,
  Set, or BigInt handling for `JSON.parse` output. `JSON.parse` can only produce
  string, number, boolean, null, array, and plain object.

## Code Standards

### JavaScript / TypeScript

- TypeScript strict mode for all new code
- No `any` types — use `unknown` or generics
- Prefer interfaces over type aliases for object shapes
- Use Zod schemas for runtime validation at boundaries

### File Operations

- Atomic writes: tmp+rename pattern (never direct writes)
- Advisory locking: `safe-fs.js` withLock() for concurrent access
- Symlink guard: `.claude/hooks/lib/symlink-guard.js` for path validation
- Secret redaction: sanitize-input.js for logged/persisted data

### Error Handling

- Never access `.message` or `.stack` without type checking
- Use sanitize-error.js for safe error serialization
- Empty catch blocks must have a comment explaining why
- Wrap JSON.parse of user input in try/catch

## Review Priorities

When reviewing PRs, prioritize in this order:

1. **Security** — Path traversal, injection, unsanitized errors, symlink attacks
2. **Data integrity** — TOCTOU races, missing validation, atomic write violations
3. **Correctness** — Logic errors, edge cases, error handling
4. **Performance** — Only flag if measurably impactful (regex DoS, unbounded loops)
5. **Style** — Only flag if it hurts readability or violates the above standards
