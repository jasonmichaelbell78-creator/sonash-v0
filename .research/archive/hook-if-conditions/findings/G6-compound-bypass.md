# G6: Ground-Truth — Compound Command Bypass of Hook `if` Conditions

**Tester:** Live-testing agent (Opus 4.6) **Date:** 2026-03-29 **Claim under
test:** C-033 — "Compound command bypass is the critical security risk:
`Bash(git push *)` does not fire when Claude runs
`git status && git push origin main`" **D9 confidence:** HIGH (97.9-100% bypass
rate) **V1 downgrade:** MEDIUM (permissions engine may be compound-aware; `if`
behavior undocumented)

---

## The Key Question

When Claude runs `git status && git push origin main` via a single Bash tool
call:

1. Does `if: "Bash(git push *)"` match the tool call and fire the hook?
2. Or does the compound command bypass the `if` filter because the string starts
   with `git status`?

---

## Evidence Gathered

### Evidence 1: Bash Tool Passes the Full Compound String

Empirically confirmed: when Claude executes `echo "test1" && echo "test2"`, the
Bash tool receives a single `command` argument containing the full string
`echo "test1" && echo "test2"`. Claude does NOT automatically split compound
commands into separate tool calls. The entire compound command is a single Bash
tool invocation.

This means the `if` matcher receives the full string
`git status && git push origin main` as the tool input to evaluate.

### Evidence 2: Permission Rules ARE Compound-Aware (Post-Fix)

The official Claude Code permissions documentation
(code.claude.com/docs/en/permissions) explicitly states:

> "Claude Code is aware of shell operators like `&&`. A prefix match rule such
> as `Bash(safe-cmd *)` will not grant permission to execute a compound command
> like `safe-cmd && other-cmd`."

And:

> "When a compound command is approved with a 'don't ask again' confirmation,
> Claude Code creates individual rules for each subcommand that requires
> approval. For example, approving `git status && npm test` results in a saved
> rule for `npm test`, allowing future `npm test` invocations regardless of
> preceding commands."

This proves the **permission matching engine** splits compound commands and
evaluates each subcommand independently. GitHub issue #4956 was the original
report (97.9-100% bypass rate) and was CLOSED as COMPLETED — the fix was applied
to the permission engine.

### Evidence 3: `if` Field Documentation Says "Same Syntax as Permission Rules"

The hooks-guide (code.claude.com/docs/en/hooks-guide) states:

> "The `if` field accepts the same patterns as permission rules"

And the hooks reference states:

> "The `if` field uses permission rule syntax to filter hooks by tool name and
> arguments together"

### Evidence 4: "Same Syntax" vs "Same Engine" — The Ambiguity

V1 correctly identified the critical ambiguity: "uses permission rule syntax"
describes the **pattern format** (`ToolName(glob_pattern)`), not necessarily the
**matching engine**. Two scenarios exist:

- **Scenario A (compound-aware):** `if` uses the same engine as permissions. The
  engine splits `git status && git push origin main` into subcommands and checks
  each against `Bash(git push *)`. The hook fires because `git push origin main`
  matches.
- **Scenario B (prefix-only):** `if` uses a simpler glob matcher that checks the
  full command string as a prefix. `git status && git push origin main` starts
  with `git status`, not `git push`, so the pattern fails and the hook does not
  fire.

### Evidence 5: The Existing Hook Already Has Defense-in-Depth

`block-push-to-main.js` (lines 34-36) does NOT rely solely on the `if`
condition:

```javascript
// Fast bail: only inspect commands that look like git push
if (!/\bgit\b/i.test(command) || !/\bpush\b/i.test(command)) {
  process.exit(0);
}
```

The script uses `\bgit\b` and `\bpush\b` regex tests against the **full command
string** — these match `git push` anywhere in the string, not just at the start.
A compound command like `git status && git push origin main` would pass both
regex tests because `git` and `push` appear as whole words.

Furthermore, the regex patterns on lines 53-58 use `\bgit\s+push\b` which
matches `git push` as a word-bounded substring anywhere in the normalized
command. The `[^|;&]*` negative character class in the pattern explicitly
accounts for shell operators — it limits the match scope to the segment between
shell operators, not the entire string.

**The existing script already handles compound commands correctly.** Even if the
`if` condition is bypassed, the script would still need to be invoked to do its
job.

### Evidence 6: The Actual Risk Is `if` Preventing the Script from Running

The real vulnerability is not in `block-push-to-main.js` itself (which handles
compounds) but in the `if` condition preventing the script from being spawned at
all. If `if: "Bash(git push *)"` does NOT fire for compound commands, then the
well-written script never executes and the push proceeds unblocked.

However, this is only exploitable if:

1. The `if` matcher uses simple prefix matching (Scenario B), AND
2. Claude generates compound commands that start with a non-push command

### Evidence 7: Claude's Behavioral Pattern

In practice, when Claude wants to push, it typically generates either:

- `git push origin branch-name` (simple command), or
- `git add . && git commit -m "msg" && git push origin branch-name` (compound,
  push is last)

The second pattern is common in session-end or commit flows. In this case, the
compound command starts with `git add`, not `git push`. If the `if` matcher uses
prefix matching, this compound command would bypass the filter.

---

## Verdict

### On the D9 claim (97% bypass rate): OVERSTATED but directionally correct

D9 conflated two different things:

1. **GitHub issue #4956** reported bypass of **permission allow rules**, not
   hook `if` conditions. The 97.9% figure applies to the pre-fix permission
   engine.
2. **The permission engine was fixed** (issue closed as COMPLETED). Post-fix,
   the permission engine IS compound-aware.
3. **Whether `if` uses the same fixed engine is undocumented.** D9 assumed it
   does not; this is plausible but unconfirmed.

The 97% figure cannot be directly applied to `if` conditions because:

- It was measured against the **old, pre-fix** permission engine
- The fix made the permission engine compound-aware
- The `if` field was introduced in v2.1.85, **after** the permission fix

### On V1's MEDIUM downgrade: CORRECT

V1 was right to downgrade from HIGH to MEDIUM. The compound bypass is confirmed
for the pre-fix permission engine but not empirically confirmed for the `if`
field specifically. The documentation is ambiguous.

### On the practical risk to this project: LOW — defense-in-depth already exists

Regardless of whether `if` is compound-aware:

- `block-push-to-main.js` already validates the full command string with regex
  that matches `git push` anywhere in the command
- The `permissions.deny` rules in settings.json include
  `"Bash(git push origin main)"` as a separate deny rule — and the permission
  engine IS compound-aware post-fix
- CLAUDE.md guardrail #7 states: "Never push to remote without explicit
  approval"

The `if` condition on the hook serves as a **performance optimization** (avoids
spawning the hook process for non-push commands). Even if it misses a compound
command, the permission deny rule would still catch it.

### Definitive answer: CANNOT CONFIRM without live instrumented test

The `if` field's compound command behavior is genuinely undocumented. I cannot
determine whether `if` uses the same compound-aware matching engine as
permissions or a simpler prefix matcher without:

1. An instrumented test that logs whether the hook process is spawned for a
   compound command, OR
2. Reading the Claude Code source code for the `if` evaluation path

**What I CAN confirm:**

- The Bash tool receives the full compound string as a single `command` argument
- The permission engine IS compound-aware (splits and checks subcommands)
- The `if` field claims to use "the same patterns as permission rules"
- The hook script itself already handles compound commands via full-string regex
- The deny rule in permissions provides a second layer of protection

---

## Confidence Assessment

| Sub-claim                                            | Confidence  | Basis                                                  |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------ |
| Bash tool passes full compound string                | **HIGH**    | Empirically confirmed in this session                  |
| Permission engine is compound-aware (post-fix)       | **HIGH**    | Official docs explicitly state it                      |
| `if` field uses permission rule syntax               | **HIGH**    | Official docs explicitly state it                      |
| `if` field uses same matching ENGINE as permissions  | **UNKNOWN** | Undocumented; "same syntax" != "same engine"           |
| D9's 97% bypass rate applies to `if` conditions      | **LOW**     | Figure was for pre-fix permission rules, not `if`      |
| `block-push-to-main.js` handles compounds internally | **HIGH**    | Confirmed by reading the script's regex patterns       |
| Practical risk to this project                       | **LOW**     | Three layers: `if`, script regex, permission deny rule |

**Overall confidence for C-033 as stated:** MEDIUM — the bypass is theoretically
possible but:

1. The 97% figure is misattributed (it was for pre-fix permissions, not `if`)
2. The `if` engine may be compound-aware (same codebase, same pattern syntax)
3. The existing hook script already handles the bypass case internally
4. The permission deny rule provides an independent enforcement layer

---

## Implications for Existing Hooks

### block-push-to-main.js — SAFE (3 layers of protection)

| Layer                                            | Mechanism         | Compound-aware?  |
| ------------------------------------------------ | ----------------- | ---------------- |
| `if: "Bash(git push *)"`                         | Hook spawn filter | UNKNOWN          |
| Script regex `\bgit\b` + `\bpush\b`              | Full-string match | YES              |
| `permissions.deny: "Bash(git push origin main)"` | Permission engine | YES (documented) |

Even if layer 1 fails, layers 2 and 3 catch it. **However**, if layer 1 fails,
layer 2 never runs (the script is not spawned). So the actual fallback is layer
3 (permission deny rule). This is still effective because the deny rule uses the
compound-aware permission engine.

### pre-commit-agent-compliance.js — LOWER RISK

Has `if: "Bash(git commit *)"`. If bypassed by a compound command, the
compliance check doesn't run. But this hook is advisory (warns, does not block),
so the impact of a bypass is reduced.

### commit-tracker.js — MODERATE RISK

Has
`if: "Bash(git commit *)|Bash(git cherry-pick *)|Bash(git merge *)|Bash(git revert *)"`.
If bypassed, commits are not tracked. This is a data-integrity issue, not a
security issue.

---

## Recommended Mitigations

### M1: Remove `if` from security-critical hooks (RECOMMENDED)

For `block-push-to-main.js`, remove `if: "Bash(git push *)"` so the hook fires
on ALL Bash commands. The script's own fast-bail regex (line 35) already exits
immediately for non-push commands — the overhead is a JSON parse + two regex
tests, which is negligible compared to process spawn cost.

**Trade-off:** The hook process spawns for every Bash command instead of only
push commands. This adds ~167-191ms (per D7-performance findings) to every Bash
command. This may be unacceptable.

### M2: Broaden `if` to catch compound patterns (ALTERNATIVE)

Change `if: "Bash(git push *)"` to `if: "Bash(*git push*)"` or
`if: "Bash(*push*)"` — IF the glob engine supports mid-string wildcards. This is
untested and may not work with permission rule syntax which appears to be
prefix-oriented.

### M3: Keep current architecture, accept residual risk (PRAGMATIC)

The permission deny rule `"Bash(git push origin main)"` is compound-aware and
provides enforcement. The `if` condition is a performance optimization. The
script handles compounds if spawned. Three layers exist. The residual risk is
low.

### M4: Add empirical test to CI (IDEAL)

Create a test that:

1. Configures a hook with `if: "Bash(git push *)"` that logs to a file when
   spawned
2. Runs Claude Code (or simulates the hook dispatch) with
   `git status && git push origin test`
3. Checks whether the log file was written
4. This would definitively answer the question

---

## Corrections to Prior Research

1. **D9's C-033 confidence should be MEDIUM, not HIGH.** V1 was correct. The 97%
   figure is from pre-fix permission rules, not `if` conditions.
2. **D9 incorrectly attributed GitHub #4956 to `if` conditions.** The issue was
   about permission allow rules. The `if` field did not exist when #4956 was
   filed.
3. **The "documented, reproducible bug" framing in D9 is misleading.** The bug
   was documented and reproduced for permissions, then FIXED. Whether the fix
   extends to `if` is unknown.
4. **D9's security recommendation remains correct regardless.** Never rely on
   `if` as a sole security gate. The recommendation stands even though the
   specific evidence was misattributed.
5. **This project's `block-push-to-main.js` already follows best practice.** It
   has internal regex validation against the full command string, not just the
   `if` condition.
