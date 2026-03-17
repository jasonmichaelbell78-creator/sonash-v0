<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: Insight Report — Work Locale

## Summary

Add 5 behavioral guardrails to CLAUDE.md Section 4 (items 7-11) addressing push
control, platform awareness, pre-commit recovery, question batching, and pre-PR
verification. Clean up ~25 stale one-off permissions from settings.local.json.

**Decisions:** See DECISIONS.md (16 decisions) **Effort Estimate:** S (~1-2
hours) **Execution:** Single commit on `plan-implementation` branch

## Files to Create/Modify

### Modified Files (2)

1. **`CLAUDE.md`** — Add 5 new behavioral guardrails (items 7-11) to Section 4
2. **`.claude/settings.local.json`** — Remove ~25 stale one-off SKIP\_\* push
   permissions (WORK-LOCALE ONLY)

---

## Step 1: Add CLAUDE.md Behavioral Guardrails (UNIVERSAL)

Add the following 5 items to Section 4 (Behavioral Guardrails), after existing
item 6:

```markdown
7. **Never push to remote without explicit approval.** `git commit` is fine
   autonomously. `git push` requires the user to say "push" or "push it." Do not
   push as part of a commit flow, PR creation, or session-end unless explicitly
   asked. `[BEHAVIORAL: no automated enforcement]`
8. **Respect the declared platform and shell.** The system prompt declares the
   OS and shell. Do not assume Linux-only tools, paths, or syntax. When in
   doubt, check the system prompt before generating shell commands.
   `[BEHAVIORAL: no automated enforcement]`
9. **On pre-commit hook failure, use `/pre-commit-fixer`.** Do not manually
   retry or guess at fixes. The skill handles ESLint, pattern compliance, doc
   headers, cross-doc deps, and index staleness. After 2 fixer attempts, ask the
   user. `[BEHAVIORAL: no automated enforcement]`
10. **Keep question batches concise.** When asking clarifying questions, batch
    in groups of 5-8 maximum unless the user has requested exhaustive
    questioning (e.g., via `/deep-plan`).
    `[BEHAVIORAL: no automated enforcement]`
11. **Verify no untracked files before PR or branch completion.** Run
    `git status` and confirm no generated or untracked files are missing before
    creating a PR, finishing a branch, or running `/session-end`.
    `[BEHAVIORAL: no automated enforcement]`
```

Update CLAUDE.md version to 5.6, update date to execution date, add version
history entry:

```markdown
| 5.6 | YYYY-MM-DD | Add 5 behavioral guardrails from /insights report (7-11) |
```

**Done when:** CLAUDE.md Section 4 has 11 items. Version is 5.6. **Depends on:**
None

---

## Step 2: Clean Up settings.local.json (WORK-LOCALE ONLY)

Remove all one-off SKIP\_\* push permission lines. These are stale artifacts
from past sessions that reference specific PRs, specific error messages, or
specific skip reasons.

**Lines to REMOVE** (patterns — match by content, not line number):

1. All lines containing `SKIP_CHECKS=` with specific error descriptions
2. All lines containing `SKIP_REVIEWER=1 SKIP_PROPAGATION=1` with long
   `SKIP_REASON` strings referencing specific PRs (#431, #429, etc.)
3. All lines containing `SKIP_CC=1 SKIP_REASON=` with specific function names
4. One-off Bash commands: `/tmp/check_tests.sh`, `/tmp/report.txt`,
   `echo "=== Step 13`, `GIT_TRACE=1 git commit`
5. The `for f:*`, `for cmd:*`, `do:*`, `do echo:*`, `done` lines (loop fragments
   that shouldn't be individual permissions)
6. Specific `cat .eslintrc*` compound command

**Lines to KEEP** (generic, reusable permissions):

- `Bash(git:*)`, `Bash(git add:*)`, `Bash(git diff:*)`, `Bash(git commit:*)`
- `Bash(git checkout:*)`
- `Bash(npm run:*)`, `Bash(npm test:*)`, `Bash(npm install:*)`
- `Bash(npm view:*)`, `Bash(npm audit:*)`
- `Bash(npx prettier:*)`, `Bash(npx eslint:*)`, `Bash(npx tsc:*)`
- `Bash(npx lint-staged:*)`, `Bash(npx:*)`
- `Bash(node:*)`, `Bash(bash:*)`, `Bash(ls:*)`, `Bash(mkdir:*)`
- `Bash(rm:*)`, `Bash(cp:*)`, `Bash(grep:*)`, `Bash(find:*)`, `Bash(wc:*)`
- `Bash(cat:*)`, `Bash(df:*)`
- `Bash(gh pr:*)`, `Bash(gh auth:*)`, `Bash(gh api:*)`
- `Bash(python3:*)`
- `WebSearch`, `WebFetch(domain:github.com)`, `WebFetch(domain:alexop.dev)`,
  `WebFetch(domain:gist.github.com)`
- `Read(...)` entries

**Done when:** settings.local.json has ~35-40 permission lines (down from 67).
No lines reference specific PR numbers or SKIP_REASON strings. **Depends on:**
None

---

## Step 3: Audit Checkpoint

Review both changed files for correctness:

- CLAUDE.md: verify 11 items in Section 4, version bumped, no formatting issues
- settings.local.json: verify valid JSON, no accidentally removed generic
  permissions

**Done when:** Both files pass validation. JSON is parseable. Markdown renders
correctly. **Depends on:** Steps 1-2

---

## Parallelization Guidance

Steps 1 and 2 can run in parallel (different files, no dependencies). Step 3
depends on both.

---

## Merge Instructions (for home-locale plan)

This section is the protocol for merging work-locale and home-locale plans:

### Before starting the home-locale plan:

1. Run `/insights` at home locale
2. Run `/deep-plan insight-report-home-locale` with the home insights data
3. Reference this plan's DECISIONS.md for what's already decided

### During home-locale discovery:

- **Universal items (D1-D5, D7-D11, D13, D15)** are already decided. The
  home-locale plan should NOT re-decide these — just confirm or flag conflicts.
- **Home-locale-specific items** are new decisions (settings.local.json cleanup
  specific to that machine, any home-specific frictions).
- If home insights reveal NEW universal items not covered here, add them.

### Merge execution:

1. **Universal items:** Execute once on whichever locale runs first. The other
   locale gets them via `git pull`.
   - CLAUDE.md changes (Step 1) — shared via git
2. **Work-locale items:** Execute at work only.
   - settings.local.json cleanup (Step 2) — this file is gitignored or
     locale-specific
3. **Home-locale items:** Execute at home only.
   - Whatever the home-locale plan produces for settings.local.json or
     home-specific config
4. **Conflicts:** If home insights contradict a work-locale decision, user
   decides which takes priority. Document the resolution.

### After merge:

- Both locales should have identical CLAUDE.md (universal rules)
- Each locale has its own clean settings.local.json
- Both plans' DECISIONS.md are preserved for reference

---

## Deferred Items

| Item                                         | Why Deferred                                                              | Track In                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Claude Code hook for pre-commit dry-run (S6) | Pre-commit-fixer skill + CLAUDE.md rule is sufficient                     | Monitor — add hook only if behavioral rule proves insufficient |
| /safe-commit skill (S7)                      | /pre-commit-fixer already exists with better scope                        | Not needed                                                     |
| Headless mode for batch audits (S8)          | Agent Teams (Agent Environment Analysis) covers this more comprehensively | Agent Environment Analysis Phase 4                             |
| Push enforcement hook (S6 variant)           | CLAUDE.md rule is sufficient; hook would be disruptive                    | Monitor — add hook only if pushes without asking persist       |
