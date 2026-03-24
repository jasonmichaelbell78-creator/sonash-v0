# S0 CI/Scripts Triage — DEBT-1878, DEBT-2121, DEBT-4403

**Date:** 2026-03-24 **Auditor:** security-auditor agent **Scope:** Real-world
exploitability assessment + fix feasibility for 3 CI/script S0 items

---

## Item 1: DEBT-1878 — pull_request_target with PR head checkout

**File:** `.github/workflows/deploy-firebase.yml` **Lines:** 8-36

### Evidence

The `pull_request_target` trigger is **commented out** on lines 7-10:

```yaml
# pull_request_target:
#   branches:
#     - main
#   types: [opened, synchronize, reopened]
```

The workflow currently triggers only on `push` to `main` and `workflow_dispatch`
(line 3-12). The `preview-deploy` job references `pull_request_target` in its
`if` condition (line 23), but since the trigger itself is disabled, this job
**can never execute**. The conditional
`github.event_name == 'pull_request_target'` will never be true.

However, the **dead code** at lines 23-70 contains a genuine vulnerability
pattern: it checks out PR head code
(`ref: ${{ github.event.pull_request.head.sha }}`) at line 36, which would run
untrusted fork code with access to repo secrets
(`secrets.FIREBASE_SERVICE_ACCOUNT` at line 66) if the trigger were ever
re-enabled. The same-repo guard on line 23
(`github.event.pull_request.head.repo.full_name == github.repository`) blocks
fork PRs but does NOT prevent a compromised collaborator from exploiting this.

Additional concern: the global `permissions: {}` on line 14 is good (deny-all
default), but the `preview-deploy` job escalates to `contents: read`,
`checks: write`, `pull-requests: write` at lines 28-30.

### Disposition: DEFER

### Rationale

The vulnerability is **not currently exploitable** because the trigger is
commented out. The risk is latent -- it becomes exploitable only if someone
uncomments lines 8-10 without removing the dangerous checkout pattern.

### Fix complexity: S (Small)

Delete the dead `preview-deploy` job entirely (lines 20-75), or at minimum
remove the `ref: ${{ github.event.pull_request.head.sha }}` line. If preview
deploys are needed later, redesign using the safe two-workflow pattern
(`pull_request_target` triggers a separate workflow that does NOT check out PR
code).

### Risk if deferred

**Low.** Trigger is disabled. Risk materializes only if someone uncomments the
trigger without security review. Mitigated by the fact that workflow changes
require PR review. Recommend adding a comment warning above the dead code, or
preferably just deleting it.

---

## Item 2: DEBT-2121 — execSync command injection risk

**File:** `scripts/debt/resolve-item.js` (original finding, line 21)

### Evidence

The original finding flagged `resolve-item.js` for `execSync` with string
interpolation. Inspecting the current file:

- **Line 21:** `const { execFileSync } = require("node:child_process");`
- **Lines 204-207, 239-241, 254, 298:** All calls use `execFileSync` with
  argument arrays, NOT `execSync` with string concatenation.

This file has **already been remediated**. It imports only `execFileSync` and
passes arguments as arrays, which prevents shell interpretation entirely.

The research output at `.research/plan-orchestration/RESEARCH_OUTPUT.md:156`
states DEBT-2121 is "resolved by propagation Step 9," but the fix appears to
have already been applied -- the file currently contains no `execSync` usage.

**Broader `execSync` audit** across `scripts/`:

Other files still use `execSync` with template literals, but with
internally-generated inputs (not user-controlled):

| File                          | Line          | Input source                                                            | Risk                     |
| ----------------------------- | ------------- | ----------------------------------------------------------------------- | ------------------------ |
| `check-review-needed.js`      | 544, 560      | `afterDate` from `sanitizeDateString()` (strict ISO regex + Date parse) | None -- input validated  |
| `check-review-needed.js`      | 692           | Hardcoded `npm run lint` string                                         | None -- no interpolation |
| `check-pattern-compliance.js` | 1775          | Hardcoded `git diff --cached`                                           | None -- no interpolation |
| `check-agent-compliance.js`   | 60            | Hardcoded `git diff --cached`                                           | None -- no interpolation |
| `security-check.js`           | 327           | Hardcoded `git diff --cached`                                           | None -- no interpolation |
| `surface-lessons-learned.js`  | 110, 116, 125 | Hardcoded git commands                                                  | None -- no interpolation |
| `validate-audit.js`           | 696, 752      | Hardcoded `npm audit --json`, `npm run lint`                            | None -- no interpolation |
| `phase-complete-check.js`     | 489, 512      | Hardcoded `npm run lint`, `npm test`                                    | None -- no interpolation |
| `velocity/track-session.js`   | 19            | Imports `execSync` but never calls it (uses `execFileSync` only)        | None -- dead import      |

The `check-review-needed.js` interpolated calls (lines 544, 560) are the only
ones with dynamic values, and those values pass through `sanitizeDateString()`
which enforces a strict ISO date regex (`/^\d{4}-\d{2}-\d{2}.../`) before
interpolation, followed by `getNextDay()` which re-validates via `new Date()`
and returns empty string on failure. Shell injection through a validated
`YYYY-MM-DDTHH:MM:SS` string is not feasible.

### Disposition: FALSE POSITIVE

### Rationale

The specific file (`resolve-item.js`) has already been fixed -- it uses
`execFileSync` with argument arrays exclusively. The broader `execSync` usage in
other scripts uses either hardcoded commands or strictly validated date strings.
No attacker-controlled input reaches any `execSync` call.

### Fix complexity: N/A (already fixed)

The remaining `execSync` calls with hardcoded strings are a defense-in-depth
improvement (migrate to `execFileSync`) but not a security vulnerability. That
work is tracked separately in the propagation plan.

### Risk if deferred

**None.** The vulnerability in `resolve-item.js` is already remediated. Mark as
RESOLVED in MASTER_DEBT.jsonl.

---

## Item 3: DEBT-4403 — OS command safety (SonarCloud S4721)

**File:** `scripts/check-review-needed.js` (line 214) **SonarCloud rule:**
javascript:S4721 ("Make sure that executing this OS command is safe here.")

### Evidence

Line 214-220 contains the `safeExec()` function body:

```javascript
function safeExec(command, description) {
  verbose(`Running: ${command}`);
  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
```

SonarCloud rule S4721 flags **any** use of `child_process.execSync()` as a
potential OS command injection. This is a **heuristic rule** -- it does not
perform taint analysis to determine whether the command string contains
attacker-controlled input.

Reviewing all callers of `safeExec()` in this file:

1. **Line 544:** `git rev-list --count --since="${afterDate}" HEAD` --
   `afterDate` comes from `getNextDay(sanitizeDateString(...))` which enforces
   strict ISO date format via regex and Date validation. Not injectable.

2. **Line 560:** `git log --since="${afterDate}" --name-only --pretty=format:`
   -- same `afterDate` source. Not injectable.

3. **Line 692:** `npm run lint 2>&1 | grep -iE "..." | head -1` -- fully
   hardcoded string. Not injectable.

4. **Line 967:** `git log --reverse -1 --format=%cs` -- fully hardcoded. Not
   injectable.

All inputs to `safeExec()` are either fully hardcoded or pass through strict
date validation. No external/user input reaches the shell command. The `ROOT`
variable (cwd) is derived from `__dirname` (line 48), not from user input.

Additionally, the codebase already has its own `execSync` shell interpolation
detector in `scripts/security-check.js` (SEC-010, line 122) which would flag
template literals with `${}` inside `execSync` calls. The propagation research
at `.planning/propagation-research/findings/01-DETECTION_GAPS.md:286` confirms
"0 in scripts (good!)" for `execSync` with template literal interpolation.

### Disposition: FALSE POSITIVE

### Rationale

SonarCloud S4721 is a blanket flag on `child_process` usage. It does not
distinguish between hardcoded commands and attacker-controlled input. All
`safeExec()` callers use either hardcoded strings or strictly validated date
values. There is no path from external input to shell execution.

The "right" fix (replacing `execSync` in `safeExec` with `execFileSync` + args
array) would improve defense-in-depth but would require refactoring all 4
callsites to split commands into executable + argument arrays. This is good
hygiene but not a security fix.

### Fix complexity: M (Medium)

Refactoring `safeExec` to use `execFileSync` would require splitting each
command string into `[executable, ...args]` format, and the lint pipeline call
(line 692) uses shell pipes (`|`), which cannot be expressed with `execFileSync`
without a wrapper. Feasible but not trivial.

### Risk if deferred

**None for current code.** The risk would emerge if a future developer adds a
new `safeExec()` call with unsanitized user input. The existing
`security-check.js` SEC-010 rule provides detection coverage for this regression
scenario.

---

## Summary

| DEBT ID   | Item                             | Disposition    | Fix Size | Risk if Deferred              |
| --------- | -------------------------------- | -------------- | -------- | ----------------------------- |
| DEBT-1878 | pull_request_target + PR head co | DEFER          | S        | Low (trigger disabled)        |
| DEBT-2121 | execSync command injection       | FALSE POSITIVE | N/A      | None (already fixed)          |
| DEBT-4403 | OS command safety (S4721)        | FALSE POSITIVE | M        | None (no attacker input path) |

### Recommended Actions

1. **DEBT-2121:** Mark as RESOLVED in MASTER_DEBT.jsonl. The file uses
   `execFileSync` with argument arrays.

2. **DEBT-4403:** Mark as FALSE POSITIVE in MASTER_DEBT.jsonl with reason:
   "SonarCloud S4721 blanket flag; all execSync inputs are hardcoded or
   ISO-date-validated. No attacker-controlled input reaches shell execution."

3. **DEBT-1878:** Keep open but downgrade from S0 to S2. The trigger is
   commented out. Best action: delete the dead `preview-deploy` job (lines
   20-75) during repo-cleanup (Step 2) to eliminate the latent risk entirely.
   This is a 5-minute deletion, not a security fix.
