---
name: code-reviewer
version: "2.0"
updated: 2026-02-14
description:
  Code review skill for SoNash (Next.js/TypeScript/Firebase). Includes automated
  code analysis, best practice checking, security scanning, and review checklist
  generation. Use when reviewing changes, providing code feedback, identifying
  issues, or ensuring code quality standards.
---

# Code Reviewer

Code review toolkit tailored for the SoNash codebase.

## Scope — When to Use

- **Ad-hoc code reviews** during development (reviewing changes before moving
  on)
- **Post-task quality checks** — invoke after completing each task, major
  feature, or complex bug fix to catch issues before they compound
- **Before merge to main** — final quality gate on your own work
- **When stuck** — a fresh review perspective can reveal root causes
- **Before refactoring** — establish a quality baseline

> **Not for formal PR gate reviews.** Use `pr-review` for the standardized
> 8-step protocol applied to pull requests with external review feedback.

## How to Request Review (Post-Task)

After completing a task, get the git range and dispatch a code-reviewer
subagent:

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

Then use the Task tool with `superpowers:code-reviewer` type, providing:

- `{WHAT_WAS_IMPLEMENTED}` — What you just built
- `{PLAN_OR_REQUIREMENTS}` — What it should do
- `{BASE_SHA}` / `{HEAD_SHA}` — Git range
- `{DESCRIPTION}` — Brief summary

Act on feedback: fix Critical immediately, fix Important before proceeding, note
Minor for later. Push back with reasoning if reviewer is wrong.

## Pre-Review: Episodic Memory Search

**BEFORE starting any code review, search episodic memory for relevant
context:**

```javascript
// Search for established patterns in this codebase
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["code patterns", "review", "conventions"],
    limit: 5,
  });

// Search for past reviews on the same module/area
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: "module-name or feature area",
    limit: 5,
  });
```

**Why this matters:**

- Reveals established code patterns and conventions
- Shows past review decisions that set precedent
- Identifies recurring issues that need root cause fixes
- Prevents contradicting previous review guidance

**Use findings to:**

1. Apply consistent standards with past reviews
2. Reference prior decisions when giving feedback
3. Escalate patterns that keep recurring (architectural issues)

---

## Review Checklist

### TypeScript / JavaScript

- Strict mode — no `any` types (use `unknown` + type guards)
- Proper error typing in catch blocks
- Zod schemas match TypeScript interfaces
- No unused imports or dead code
- Consistent use of `const` over `let`

### React / Next.js

- Functional components with hooks only
- No missing dependency arrays in `useEffect`/`useCallback`/`useMemo`
- Proper cleanup in effects (return teardown function)
- Server vs client component boundaries correct (`"use client"` directive)
- No direct DOM manipulation — use refs
- App Router conventions followed (layout, page, loading, error files)

### Firebase / Firestore

- **NO direct writes** to `journal`, `daily_logs`, `inventoryEntries` — use
  Cloud Functions via `httpsCallable`
- App Check tokens verified in all Cloud Functions
- Rate limiting: handle `429` errors gracefully (use `sonner` toasts)
- Repository pattern: queries in `lib/firestore-service.ts`, not inline
- Types from `types/` or `functions/src/schemas.ts`

### Tailwind CSS

- Utility-first — no custom CSS unless absolutely necessary
- Responsive design uses Tailwind breakpoints
- No conflicting or redundant utility classes
- Dark mode support where applicable

### Script-Specific Checklist (scripts/, hooks/, .husky/)

1. **File I/O**: All `readFileSync`/`writeFileSync` wrapped in try/catch?
2. **Error handling**: Using `sanitizeError()` not raw `err.message`?
3. **Path safety**: Using `validatePathInDir()` or regex check, not
   `startsWith("..")`?
4. **Symlinks**: Using `lstatSync()` before `statSync()`?
5. **Atomic writes**: Using tmp+rename pattern for critical state files?
6. **Regex safety**: No `/g` with `.test()`? No unbounded `.*`?
7. **Git commands**: Using `--` separator before file arguments?
8. **Prototype pollution**: Using `safeCloneObject()` for parsed JSON?
9. **Silent catches**: No empty `catch {}` blocks?
10. **Fix templates**: Check `docs/agent_docs/FIX_TEMPLATES.md` for standard
    fixes

### Security

- Validate all inputs (Zod on both client and server)
- No secrets in client-side code
- Firebase security rules cover new collections/fields
- Authentication checks on protected routes and API endpoints
- Dependencies up to date (no known vulnerabilities)

### Testing

- New features have corresponding tests
- Mock `httpsCallable`, NOT direct Firestore writes
- Edge cases covered (empty state, error state, loading state)
- No flaky tests (avoid timing-dependent assertions)

### Code Quality

- Follow established patterns (DRY, SOLID principles)
- Clear naming conventions
- Helpful comments for non-obvious logic
- No premature optimization — measure first
- Error boundaries for component trees

## Common Commands

```bash
# Development
npm run dev
npm run build
npm run test
npm run lint

# Pattern checks
npm run patterns:check
```

## Reference Documentation

- `docs/agent_docs/CODE_PATTERNS.md` — Detailed patterns and practices (230+
  from 259 reviews)
- `docs/agent_docs/SECURITY_CHECKLIST.md` — Pre-write security checklist
- `docs/agent_docs/FIX_TEMPLATES.md` — Standard fix patterns
- `docs/agent_docs/CODE_PATTERNS.md` — 230+ patterns from 259 reviews
- `docs/agent_docs/SECURITY_CHECKLIST.md` — Pre-write security checklist
- `docs/agent_docs/FIX_TEMPLATES.md` — Standard fix patterns
