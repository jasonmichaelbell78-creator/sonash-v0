---
name: code-reviewer
version: '2.0'
updated: 2026-02-14
description: Ad-hoc code review skill. Includes automated code analysis, best practice
  checking, security scanning, and review checklist generation. Use when
  reviewing changes, providing code feedback, identifying issues, or ensuring
  code quality standards.
---

# Code Reviewer

Ad-hoc code review toolkit for use during development.

## When to Use

- Tasks related to code-reviewer
- User explicitly invokes `/code-reviewer`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Scope -- When to Use

- **Ad-hoc code reviews** during development (reviewing changes before moving
  on)
- **Post-task quality checks** -- invoke after completing each task, major
  feature, or complex bug fix to catch issues before they compound
- **Before merge to main** -- final quality gate on your own work
- **When stuck** -- a fresh review perspective can reveal root causes
- **Before refactoring** -- establish a quality baseline

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

- `{WHAT_WAS_IMPLEMENTED}` -- What you just built
- `{PLAN_OR_REQUIREMENTS}` -- What it should do
- `{BASE_SHA}` / `{HEAD_SHA}` -- Git range
- `{DESCRIPTION}` -- Brief summary

Act on feedback: fix Critical immediately, fix Important before proceeding, note
Minor for later. Push back with reasoning if reviewer is wrong.

## Pre-Review: Episodic Memory Search

**BEFORE starting any code review, search episodic memory for relevant
context:**

```javascript
// Search for established patterns in this codebase
mcp__plugin_episodic_memory_episodic_memory__search({
  query: ['code patterns', 'review', 'conventions'],
  limit: 5,
});

// Search for past reviews on the same module/area
mcp__plugin_episodic_memory_episodic_memory__search({
  query: 'module-name or feature area',
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

- Strict mode -- no `any` types (use `unknown` + type guards)
- Proper error typing in catch blocks
- No unused imports or dead code
- Consistent use of `const` over `let`
- Schema/interface alignment where applicable

### Framework Patterns (adapt to project stack)

- Component/module patterns followed consistently
- No missing dependency arrays in reactive hooks
- Proper cleanup in effects (return teardown function)
- Server vs client boundaries correct (if applicable)
- No direct DOM manipulation -- use refs/abstractions
- Framework conventions followed (layout, routing, error files)

### Script-Specific Checklist (scripts/, hooks/)

1. **File I/O**: All `readFileSync`/`writeFileSync` wrapped in try/catch?
2. **Error handling**: Using sanitized error formatting, not raw `err.message`?
3. **Path safety**: Using validated path checks, not naive `startsWith("..")`?
4. **Symlinks**: Using `lstatSync()` before `statSync()`?
5. **Atomic writes**: Using tmp+rename pattern for critical state files?
6. **Regex safety**: No `/g` with `.test()`? No unbounded `.*`?
7. **Git commands**: Using `--` separator before file arguments?
8. **Prototype pollution**: Using safe clone for parsed JSON?
9. **Silent catches**: No empty `catch {}` blocks?
10. **Fix templates**: Check `docs/agent_docs/FIX_TEMPLATES.md` for standard
    fixes

### Security

- Validate all inputs (on both client and server where applicable)
- No secrets in client-side code
- Authentication checks on protected routes and API endpoints
- Dependencies up to date (no known vulnerabilities)
- Access control covers new data paths

### Testing

- New features have corresponding tests
- Edge cases covered (empty state, error state, loading state)
- No flaky tests (avoid timing-dependent assertions)
- Tests assert meaningful behavior (not trivially passing)

### Code Quality

- Follow established patterns (DRY, SOLID principles)
- Clear naming conventions
- Helpful comments for non-obvious logic
- No premature optimization -- measure first
- Error boundaries / propagation for component/module trees

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

- `docs/agent_docs/CODE_PATTERNS.md` -- Detailed patterns and practices
- `docs/agent_docs/SECURITY_CHECKLIST.md` -- Pre-write security checklist
- `docs/agent_docs/FIX_TEMPLATES.md` -- Standard fix patterns

---

## Version History

| Version | Date       | Description                         |
| ------- | ---------- | ----------------------------------- |
| 2.0     | 2026-02-28 | Sanitized for framework portability |
| 1.0     | 2026-02-25 | Initial implementation              |
