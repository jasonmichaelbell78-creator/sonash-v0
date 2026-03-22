---
name: pre-commit-fixer
description: |
  Diagnose and fix pre-commit hook failures with user confirmation at each step.
  Reads .git/hook-output.log, classifies failures by category, spawns targeted
  subagents for complex fixes, and presents a structured report before
  re-committing. Reduces context waste from manual fix-commit-retry cycles.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Pre-Commit Fixer

Diagnose and fix pre-commit hook failures through a structured classify → fix →
report → confirm workflow.

## Critical Rules (MUST follow)

1. **Never re-commit without user confirmation.** Present the structured report
   and wait for explicit "go" before re-staging and re-committing.
2. **Never set SKIP_REASON autonomously.** Per CLAUDE.md guardrail #14, present
   three options: (a) fix now, (b) defer to `known-debt-baseline.json`, (c) skip
   with user-provided reason.
3. **Review hook output after every commit.** Per CLAUDE.md guardrail #13, check
   the hook summary for warnings/failures and present with remediation options.
4. **Only fix files in staged or working tree.** Skip errors in node_modules,
   generated files, and vendored code.
5. **After 2 fix attempts on the same category, stop and ask the user.** Per
   CLAUDE.md guardrail #9.
6. **Check feedback memory** for user preferences on report format and retry
   behavior before executing.

## When to Use

- `git commit` fails due to pre-commit hook errors
- User explicitly invokes `/pre-commit-fixer`
- CLAUDE.md guardrail #9 directs here on pre-commit failure

## When NOT to Use

- Bug investigation → `/systematic-debugging`
- Quick config tweak → `/quick-fix` (advisory, not operational)
- Ecosystem-wide hook issues → `/hook-ecosystem-audit`
- Pre-push failures → out of scope (address manually or via
  `/systematic-debugging`)
- Build failures (`npm run build`), CI failures, or test failures outside the
  pre-commit hook's test step

## Arguments

- `--dry-run` — classify and report failures without fixing. Shows what would be
  fixed and estimated complexity, then exits.

## Workflow

### Step 1: Read Hook Output (MUST)

Read the primary error source:

```bash
cat .git/hook-output.log
```

**Done when:** Full error output captured. If the log file doesn't exist, fall
back to the commit's stderr/stdout.

### Step 2: Classify Failures (MUST)

Parse the error output and classify ALL failure categories present. Reference
`scripts/config/hook-checks.json` for the canonical check list.

**Failure categories:**

| Category               | Detection Pattern                    | Fix Type                  |
| ---------------------- | ------------------------------------ | ------------------------- |
| Secrets (gitleaks)     | `leaks found`                        | MUST stop — user decision |
| ESLint errors          | `ESLint` + error output              | Subagent                  |
| Oxlint errors          | `oxlint` in output                   | Subagent                  |
| Pattern compliance     | `Pattern compliance` failed          | Subagent                  |
| Propagation checks     | `propagation` in output              | Subagent                  |
| Document headers       | `Missing required header`            | Inline                    |
| Cross-doc dependencies | `not staged` or `cross-document`     | Inline                    |
| Doc index stale        | `DOCUMENTATION_INDEX.md not updated` | Inline                    |
| Skill validation       | `Skill validation` failed            | Subagent                  |
| Debt/schema validation | `debt` or `schema` in output         | Subagent                  |
| Test failures (tsc)    | `error TS` in output                 | Subagent                  |
| Lint-staged formatting | `prettier` or `lint-staged`          | Inline (auto-fixed)       |

**Pre-existing detection (SHOULD):** Compare errors against a clean baseline.
Errors present before your changes are pre-existing. Present separately: "N
errors from your changes, M pre-existing."

- Pre-existing errors → offer: fix now or defer to `/add-debt`
- New errors → fix as part of this workflow

**Done when:** All failure categories identified with counts.

### Step 3: Present Warm-Up (MUST)

```
Pre-commit failure: N errors across M categories
  - [category]: N errors
  - [category]: N errors
Complexity: [Quick (<1 min) | Moderate (~3 min) | Complex (~5-10 min)]
[If pre-existing: M pre-existing errors detected separately]

Fix all? [Y / fix specific categories / defer all to /add-debt / abort]
```

**Scope threshold:** If >15 errors or >10 files affected, present and ask: fix
all, fix staged-only, or defer to `/add-debt`?

**Done when:** User confirms which categories to fix.

### Step 4: Execute Fixes (MUST)

Fix in priority order: security patterns → ESLint/oxlint → pattern compliance →
doc compliance → formatting.

**Inline fixes (no subagent):**

```bash
# Doc index stale
npm run docs:index && git add DOCUMENTATION_INDEX.md

# Cross-doc dependency
git add <missing-file>

# Lint-staged formatting — already auto-fixed, just re-stage
git add <formatted-files>

# Doc headers — add standard block:
# <!-- prettier-ignore-start -->
# **Document Version:** 1.0
# **Last Updated:** YYYY-MM-DD
# **Status:** ACTIVE
# <!-- prettier-ignore-end -->
```

**Subagent fixes:**

Spawn focused subagents using the Agent tool with category-specific prompts:

- **ESLint/oxlint:**
  `Agent({subagent_type: "debugger", prompt: "Fix these ESLint errors. Error list: <errors>. Files: <list>. Do NOT create new files, do NOT add eslint-disable unless genuinely false positive."})`
- **Pattern compliance:**
  `Agent({subagent_type: "code-reviewer", prompt: "Fix these pattern violations per docs/agent_docs/CODE_PATTERNS.md. Violations: <list>. Do NOT add to pathExcludeList unless verified false positive."})`
- **Skill validation:**
  `Agent({subagent_type: "general-purpose", prompt: "Fix skill validation errors in <file>. Errors: <list>."})`
- **Test failures (tsc):**
  `Agent({subagent_type: "debugger", prompt: "Fix these TypeScript errors. Errors: <list>. Only fix errors in staged/working files."})`

**Confidence flagging (SHOULD):** If a fix involves judgment (e.g., choosing
between eslint-disable and code restructure), present options to user instead of
deciding autonomously.

**Progress (MUST for multi-category):** "Category 1 of N: [type] — fixing..."

**Done when:** All accepted categories fixed and staged.

### Step 5: Report and Confirm (MUST)

Present the structured report. **Do NOT re-commit until user confirms.**

```
PRE-COMMIT FIX REPORT:
  Status: READY | PARTIAL
  Categories fixed: N/M
    - [category]: [description] ([files modified])
  Deferred (if any):
    - [category]: [description] → /add-debt
  Pre-existing (if any):
    - [category]: [description] → deferred / fixed
  Files modified: [list]
  Confidence: [all high | N items flagged for review]

  Re-commit? [Y / review changes first / abort]
```

**Delegation:** If user previously said "just fix it," present report but
auto-proceed. Record as delegated.

**Done when:** User confirms re-commit or aborts.

### Step 6: Re-commit (MUST)

```bash
git add <fixed-files>
git commit -F .git/COMMIT_EDITMSG
```

After commit, review the hook summary output (CLAUDE.md guardrail #13). If new
warnings appear, present them before continuing.

**On retry failure:** Classify the NEW errors (don't assume same category).
Present a new report. After 2 attempts on the same category, stop and ask.

**Regression detection (MUST):** If new errors appear that weren't in the
original failure, flag as regression. Do NOT auto-fix — present original vs new
and ask user.

**Done when:** Commit succeeds, or user decides to stop.

### Step 7: Closure (MUST)

```
Pre-commit fixer complete.
  Fixed: N categories, M individual errors
  Deferred: K items to /add-debt
  Files modified: [list]
  Commit: [hash]
  Post-fix check: Was this a root cause fix or symptom patch?
    [1] Root cause — done
    [2] Symptom — fix root cause now
    [3] Symptom — defer to /add-debt
```

**Done when:** User selects post-fix option and any follow-up is routed.

---

## Guard Rails

- **Scope explosion:** >15 errors or >10 files → ask before proceeding
- **Regression:** New errors after fix → flag, do not auto-fix
- **Disengagement:** User can say "stop" or "I'll handle it" at any confirmation
  gate. Present what was fixed so far, exit cleanly.
- **Persistent failure:** After 2 attempts on same category → ask user. Suggest
  `/hook-ecosystem-audit` if hook may be misconfigured.
- **Routing out:** Can't fix → `/systematic-debugging`. Architectural issue →
  `/add-debt`. Hook misconfiguration → `/hook-ecosystem-audit`.

## Integration

- **Trigger:** CLAUDE.md guardrail #9
- **Neighbors:** `/quick-fix` (advisory), `/systematic-debugging` (bugs),
  `/add-debt` (deferral), `/hook-ecosystem-audit` (infrastructure)
- **State:** Saves progress to `.claude/tmp/pre-commit-fixer-state.json`
  (current categories, fixes applied, attempt count). On resume, skips
  already-fixed categories.
- **Session-end:** Append fix summary to `hook-runs.jsonl` for session-end
  compliance review.
- **Canonical check list:** `scripts/config/hook-checks.json`

## Anti-Patterns

- **Do NOT** suppress ESLint rules with `// eslint-disable` unless genuinely
  false positive
- **Do NOT** add files to `pathExcludeList` unless verified false positive
- **Do NOT** commit partial fixes without presenting the partial status to user
- **Do NOT** fix errors in node_modules, generated, or vendored files

---

## Version History

| Version | Date       | Description                                              |
| ------- | ---------- | -------------------------------------------------------- |
| 2.0     | 2026-03-22 | Skill-audit rewrite: 47 decisions, 41→est.78, user gates |
| 1.1     | 2026-02-14 | Schema/audit failure types added                         |
| 1.0     | 2026-02-25 | Initial implementation                                   |
