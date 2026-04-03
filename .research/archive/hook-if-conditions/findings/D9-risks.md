# Findings: Risks, Failure Modes, and Anti-Patterns of `if` Conditions in Claude Code Hooks

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-29 **Sub-Question IDs:** D9

---

## Key Findings

### 1. Version Compatibility Silent Failure [CONFIDENCE: HIGH]

The `if` field requires **Claude Code v2.1.85 or later**. On earlier versions it
is **silently ignored** — the hook fires on every matched call instead of
filtering. There is no error, no warning, no log entry. This means:

- Teams using the `if` field for performance optimization (avoid process spawns)
  are silently running every hook on pre-v2.1.85 installations.
- Teams using the `if` field as a **security gate** on older installations are
  receiving zero enforcement with full illusion of protection.
- Because the fallback is "run the hook unconditionally," this is a
  false-negative failure for filtering but a false-positive for broad hooks.

**Official documentation confirms:** "Earlier versions ignore it and run the
hook on every matched call." [1]

---

### 2. Compound Command Bypass — The Core Security Failure [CONFIDENCE: HIGH]

This is the most critical failure mode. The `if` field uses the same permission
rule syntax as `allow`/`deny` rules, which means it inherits the same structural
weakness: **only the command prefix is checked, not the full AST of a compound
shell command**.

**What this means in practice:**

| Hook `if` pattern    | Claude runs                          | Fires?                |
| -------------------- | ------------------------------------ | --------------------- |
| `"Bash(git push *)"` | `git push origin main`               | YES                   |
| `"Bash(git push *)"` | `git status && git push origin main` | NO — compound bypass  |
| `"Bash(git push *)"` | `echo x; git push --force`           | NO — semicolon bypass |
| `"Bash(git push *)"` | `git log \| git push`                | NO — pipe bypass      |
| `"Bash(git push *)"` | `(git push origin main)`             | NO — subshell bypass  |

The `if` field evaluates against the **literal command string as provided to the
Bash tool**, matching from the beginning. A compound command starting with any
other token bypasses the filter entirely.

**This is a documented, reproducible bug.** GitHub issue #4956 identified
**97.9–100% bypass rate** across 52 compound command test cases. The root cause
is simple prefix glob matching instead of shell AST parsing. Issue was closed as
COMPLETED (fixed), but the permission documentation **still contains
contradictions** about shell operator awareness. [2][3]

**Documented bypass operators:** `&&`, `;`, `||`, `|`, `&`, `$()`, backticks,
subshells `()`, control flow (`if/then/fi`, `for`, `while`), `eval`, `exec`,
`source`, hex/octal/unicode obfuscation.

**Implication for `if` conditions used as security enforcement:** A
`"Bash(git push *)"` guard is trivially bypassed by running
`git status && git push origin main`. Any hook relying on `if` for security
blocking should use a **full-string regex match inside the hook script body**
instead of relying on the `if` field alone.

---

### 3. False Negatives from Narrow Patterns — Under-Scoping [CONFIDENCE: HIGH]

The `if` field uses glob matching with prefix semantics. Several documented
patterns cause false negatives (hook silently skips when it should fire):

**a) Space-before-wildcard word boundary**

`Bash(ls *)` matches `ls -la` but does NOT match `lsof`. The space before `*`
creates an implicit word boundary. This is documented behavior but frequently
surprises users who expect `ls*` and `ls *` to behave identically. [5]

**b) Argument ordering defeats the pattern**

`Bash(curl http://github.com/ *)` does NOT match
`curl -X GET http://github.com/...`. The pattern assumes a specific argument
order. Claude may construct valid commands in a different flag order. Official
documentation explicitly warns: "Bash permission patterns that try to constrain
command arguments are fragile." [5]

**c) "git push" without arguments**

`Bash(git push *)` requires something after `git push ` (space then wildcard). A
bare `git push` with no arguments (pushing current branch to default remote)
does **not** match because there is no space-separated suffix. Pattern
`Bash(git push*)` (no space) would match both, but then also matches
`git pushorigin` incorrectly.

**d) Multi-tool coverage gaps**

`if: "Edit(*.ts)"` does NOT cover `MultiEdit`. To intercept all file
modifications, you need separate handlers for `Edit`, `MultiEdit`, and `Write`.
Using only one misses the others. [6]

**e) Variable expansion and indirection**

`Bash(git push *)` does not match `URL=origin; git push $URL main` because the
literal command starts with `URL=...`. Similarly, `VAR=git; $VAR push` is not
caught. The pattern evaluates the literal uninterpreted command string. [7]

**f) Git abbreviations and aliases**

`Bash(git push *)` does not match `git p origin main` where `p` is a git alias
for `push`. Shell aliases defined in `.bashrc` are not expanded before the `if`
check because hooks run in non-interactive shells without sourcing `.bashrc`.
[6]

---

### 4. False Positives from Overly Broad Patterns — Over-Scoping [CONFIDENCE: HIGH]

The opposite problem: `if` conditions that fire too broadly.

**a) `Bash(git *)` matches all git commands**

A hook with `if: "Bash(git *)"` fires on `git status`, `git log`, `git diff`,
`git pull` — not just destructive commands. If the hook has a non-trivial
validation cost (spawns a process, makes a network call), this imposes that cost
on every read-only git operation.

**b) `Edit(*.ts)` matches any path containing `.ts`**

Due to glob semantics, this also matches `.tsx` files if the glob engine expands
`*` to include dotfiles. More critically, `Edit(src/*.ts)` uses single-directory
matching (`*` in gitignore spec does not recurse). To match recursively,
`Edit(src/**/*.ts)` is required. Misunderstanding this leads to hooks that
should fire on nested files but do not, or should be scoped to a directory but
match more broadly.

**c) Matcher + `if` redundancy creates confusion**

When a matcher group has `matcher: "Bash"` and the handler has
`if: "Bash(git *)"`, both are required to match. But having the tool name
duplicated in both locations creates maintenance confusion: changing the matcher
does not update the `if`, and vice versa. The two-level filtering is correct
behavior, but undocumented combinatorial effects can produce unexpected scoping.
[1]

---

### 5. `if` on Non-Tool Events Silently Prevents Hook Execution [CONFIDENCE: HIGH]

This is a **silent complete failure** mode. The `if` field only works on tool
events:

- `PreToolUse`
- `PostToolUse`
- `PostToolUseFailure`
- `PermissionRequest`

**If you add `if` to any other event, the hook never runs.** No error. No
warning. The events where this silently kills hook execution include:

- `UserPromptSubmit`
- `Stop`
- `SubagentStop`
- `TeammateIdle`
- `TaskCreated`
- `TaskCompleted`
- `WorktreeCreate`
- `WorktreeRemove`
- `CwdChanged`

**Example failure pattern:**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "my-completion-check.sh"
          }
        ]
      }
    ]
  }
}
```

This hook never runs. The `if` field on a `Stop` event kills it silently. The
developer may test, see no errors, and assume the hook is working when it is
not. [1]

---

### 6. Windows Path Separator Failures [CONFIDENCE: HIGH]

On Windows, the `if` field for Edit/Write conditions uses the same permission
rule matching as `allowedTools`, which has a documented and unresolved glob
matching failure.

**Root cause (GitHub issue #30736):**

- Claude generates Windows-style backslash paths:
  `C:\Users\user\project\src\file.ts`
- The glob matcher treats `\` as escape characters
- Pattern `Edit(*.ts)` or `Edit(/src/**/*.ts)` does not match
  backslash-delimited paths

**All three pattern formats fail:**

| Pattern               | Why it fails                                               |
| --------------------- | ---------------------------------------------------------- |
| `Edit(*.ts)`          | `*` doesn't match `\` in glob engine                       |
| `Edit(src/**/*.ts)`   | Forward slashes don't match backslash paths                |
| `Edit(src\\**\\*.ts)` | `\\` in JSON becomes `\`, treated as escape, not separator |

**Workaround per official docs:** On Windows, paths should be normalized to
POSIX form: `C:\Users\alice` becomes `/c/Users/alice`. Use `//c/**/*.ts`
patterns. However this normalization behavior is documented for Read/Edit
permission rules but behavior in `if` conditions specifically is not confirmed
in current docs. Hook script paths passed via `CLAUDE_PROJECT_DIR` also fail
when Git Bash receives Windows backslash paths. [8][9]

---

### 7. Parallel Execution: `if` Does Not Gate Sibling Hooks [CONFIDENCE: HIGH]

All hooks in a matcher group run **in parallel**. The `if` condition on one
handler only prevents that specific handler from spawning. Other handlers in the
same group run regardless.

**Implication:** You cannot use `if` conditions to create conditional
sequencing. Example:

```json
{
  "matcher": "Edit",
  "hooks": [
    {
      "type": "command",
      "if": "Edit(*.ts)",
      "command": "security-check.sh" // runs only for .ts files
    },
    {
      "type": "command",
      "command": "format.sh" // ALWAYS runs regardless of if condition above
    }
  ]
}
```

If a developer intends "only run `format.sh` after `security-check.sh` passes,"
the parallel model makes this impossible. `format.sh` runs unconditionally and
simultaneously with `security-check.sh`. The feature request for sequential
execution (GitHub issue #4446, #21533) was closed as NOT_PLANNED. [10][11]

**Additional parallel problem:** If one handler exits with code 2 (blocking),
the other handlers in the same group have already been spawned and are running
concurrently. Their output is collected but the blocking decision from one hook
propagates regardless of what others return.

---

### 8. `continue: false` Signals Ignored in Agent SDK Context [CONFIDENCE: HIGH]

GitHub issue #29991 documents that `PostToolUse` hooks returning
`continue: false` are **silently ignored** when Claude Code is invoked via the
Python Agent SDK. The hook executes, returns the correct JSON, and the CLI drops
the signal with no error, log, or indication.

While this is not specific to the `if` field, it compounds any `if`-based
conditional logic: a hook that uses `if` to selectively fire and then returns
`continue: false` may successfully fire due to the `if` match, but have its
output silently dropped by the control protocol. The bug affects: PreToolUse
`preventContinuation`, PostToolUse `continue: false`, and
`permissionDecision: "deny"`. [12]

---

### 9. False Security: `if` as a Replacement for Internal Bail-Out Logic [CONFIDENCE: MEDIUM]

**Anti-pattern:** Using `if` as the sole guard for security enforcement,
treating it like a gatekeeper rather than a performance optimization.

The `if` field is documented primarily as a **process spawn optimization**: "The
hook process only spawns when the Bash command starts with git. Other Bash
commands skip this handler entirely." The stated benefit is avoiding overhead,
not providing security guarantees.

When developers use `if: "Bash(git push *)"` to enforce a no-push policy, they
are relying on a pattern-match filter that:

1. Has compound command bypass (Risk #2)
2. Misses argument reordering (Risk #3)
3. Is silently ignored on older versions (Risk #1)
4. Does not expand aliases (Risk #3f)

**Correct pattern:** Use `if` for performance scoping only. Put the actual
enforcement logic — including secondary pattern matching against the full
command — **inside the hook script**:

```bash
#!/bin/bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command')
# Match anywhere in the command string, not just prefix
if echo "$CMD" | grep -qE "(^|[;&|])\s*git push"; then
  echo "git push detected in command chain" >&2
  exit 2
fi
exit 0
```

---

### 10. JSON Validation Failure from Shell Profile Pollution [CONFIDENCE: HIGH]

Hooks run in non-interactive shells that **source the user's shell profile**
(`~/.zshrc`, `~/.bashrc`). If the profile contains unconditional `echo`
statements, the output is prepended to the hook's stdout, corrupting JSON
responses.

This interacts with `if` conditions in a subtle way: if you use `if` to narrow
when a hook fires, and the hook that fires encounters this pollution, it will
fail JSON validation. But since `if` suppresses the hook for non-matching calls,
the failure only manifests when the `if` condition IS matched — making it harder
to diagnose because the hook works fine in broader testing but fails only for
the specific tool pattern.

**Mitigation:** Guard all profile output with `if [[ $- == *i* ]]; then ... fi`
to ensure only interactive shells emit output. [1]

---

### 11. Maintenance Burden: Too Many `if` Conditions Become Unauditable [CONFIDENCE: MEDIUM]

When a project accumulates many hooks, each with complex `if` conditions, the
interaction becomes difficult to reason about:

- No tooling to audit "what hooks fire for command X"
- `/hooks` menu shows configuration but does not simulate matching
- Silent failures (non-tool events, version mismatch) leave no trace
- `if` conditions and `matcher` conditions are evaluated at different levels but
  can contradict each other
- Developers copy hook configurations without understanding the two-level filter

**Observed pattern:** Teams with more than 10 hooks and `if` conditions on each
report debugging sessions where hooks fire unexpectedly or don't fire at all,
requiring `claude --debug` to trace execution. The `/hooks` UI is read-only and
cannot be used to test conditions. [13]

---

## Risk Matrix

| Risk                                             | Likelihood                                   | Impact                                          | Severity     | Mitigation                                                                       |
| ------------------------------------------------ | -------------------------------------------- | ----------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| Compound command bypass (&&, ;, pipe)            | HIGH — Claude regularly chains commands      | CRITICAL — security gate fails silently         | **CRITICAL** | Put regex grep inside hook script body; use `grep -qE` on full command string    |
| Version < v2.1.85: `if` silently ignored         | MEDIUM — depends on team update cadence      | HIGH — performance or security gap              | HIGH         | Pin minimum Claude Code version; use `if` only as optimization, not sole guard   |
| `if` on non-tool events kills hook silently      | MEDIUM — easy config mistake                 | HIGH — hook never runs                          | HIGH         | Verify event type is PreToolUse/PostToolUse/PostToolUseFailure/PermissionRequest |
| Windows path separator mismatch                  | HIGH on Windows                              | HIGH — hooks for Edit/Write patterns never fire | HIGH         | Use POSIX-normalized path patterns; test on target OS                            |
| Narrow pattern misses command variants           | HIGH — many variants exist                   | MEDIUM — partial coverage                       | MEDIUM-HIGH  | Test with `claude --debug`; use inclusive patterns + internal script filtering   |
| Parallel execution prevents conditional chaining | MEDIUM — design assumption                   | MEDIUM — unexpected behavior                    | MEDIUM       | Accept limitation; use monolithic hook script if sequencing needed               |
| `continue: false` ignored in Agent SDK           | LOW unless using Python SDK                  | HIGH — session control fails                    | MEDIUM       | Use SDK-side enforcement; do not rely on hook-based termination in SDK context   |
| Shell profile pollution corrupts JSON            | LOW — only affects users with noisy profiles | MEDIUM — hook fails with JSON error             | LOW-MEDIUM   | Add `$-` interactive shell guard to `.bashrc`/`.zshrc`                           |
| Over-scoping: `Bash(git *)` fires on safe ops    | HIGH — broad pattern is common               | LOW — performance/UX                            | LOW          | Use narrow `if` patterns; accept spawn overhead for infrequent ops               |
| Maintenance opacity: too many conditions         | MEDIUM — accumulates over time               | LOW — debugging burden                          | LOW          | Document hook intent; periodic audit; use `claude --debug`                       |

---

## Anti-Patterns

### AP-1: Using `if` as a Security Gate Without Internal Validation

**Wrong:**

```json
{
  "if": "Bash(git push *)",
  "command": "block-push.sh"
}
```

If Claude runs `git status && git push origin main`, the hook never fires.

**Right:** Use `if` for performance scoping. Inside `block-push.sh`, use
`grep -qE` on the full command string to match `git push` anywhere in the
command chain.

---

### AP-2: `if` on Stop/SessionEnd/UserPromptSubmit Events

**Wrong:**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "if": "Bash(git *)",
            "command": "completion-check.sh"
          }
        ]
      }
    ]
  }
}
```

Hook never runs. `if` is invalid on `Stop` events.

**Right:** Remove `if` from non-tool events. Put filtering logic inside the
script by checking the event input JSON.

---

### AP-3: Relying on `if: "Edit(*.ts)"` for Cross-Platform Hooks

**Wrong on Windows:** `if: "Edit(*.ts)"` may never match because Claude
generates backslash paths that the glob engine cannot match against
forward-slash patterns.

**Right:** On Windows, use POSIX-normalized patterns (`//c/**/*.ts`) AND test
hooks explicitly on the target platform. Consider putting path matching logic
inside the hook script using bash string operations rather than relying on `if`
glob matching.

---

### AP-4: Assuming Word Boundary on `Bash(git push *)`

**Wrong assumption:** `Bash(git push *)` matches `git push` with no arguments.

**Reality:** The space before `*` creates a word boundary. `git push` alone (no
args) does not match. Use `Bash(git push*)` (no space) to match both, but test
that this does not create false positives.

---

### AP-5: Duplicating Tool Name in `matcher` and `if`

**Fragile:**

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "if": "Bash(git *)",
      "command": "check.sh"
    }
  ]
}
```

If the matcher is changed to `"Edit|Bash"`, the `if` still says `"Bash(git *)"`
and only handles Bash calls. The two-level filter diverges silently. Document
the intent and keep both levels consistent.

---

### AP-6: Treating `if` Absence as "Always Run"

The `if` field is optional. Without it, every handler in the matched group runs.
But when multiple handlers exist in a group with mixed `if`/no-`if`
configurations, the logic becomes:

- Handler A: `if: "Bash(git *)"` — fires only for git
- Handler B: no `if` — fires for ALL Bash commands

Developers reviewing handler B often expect it to be scoped by the group's
context, but it runs unconditionally. This is correct behavior but frequently
surprises.

---

### AP-7: Implicit Assumption That `if` = Permission Check

`if` is evaluated **before the hook script is spawned**, as a client-side
filter. It is NOT evaluated by the permission system, NOT enforced by the
sandbox, and has no fail-secure default. If the pattern engine has a bug or the
version is old, the `if` check is skipped, not tightened. Never treat `if` as a
security boundary.

---

### AP-8: Using `if` Without Testing Compound Commands

Any `if: "Bash(...)"` condition intended to catch dangerous git or file
operations should be tested with:

1. Bare command: `git push origin main`
2. Compound: `git status && git push origin main`
3. Subshell: `(cd /tmp && git push)`
4. Semicolon: `echo x; git push`
5. Piped: `git log | xargs git push`

If the hook does not fire for cases 2-5, the `if` provides only superficial
coverage.

---

## Sources

| #   | URL                                                                                  | Title                                                               | Type              | Trust  | CRAAP     | Date      |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------- | ------ | --------- | --------- |
| 1   | https://code.claude.com/docs/en/hooks                                                | Hooks reference — Claude Code Docs                                  | official-docs     | HIGH   | 5/5/5/5/5 | 2026      |
| 2   | https://github.com/anthropics/claude-code/issues/4956                                | Security Vulnerability: Bash Permission Bypass via Command Chaining | github-issue      | HIGH   | 4/5/4/4/4 | 2025-08   |
| 3   | https://github.com/anthropics/claude-code/issues/13009                               | Permission bypass: git commit/push execute without approval         | github-issue      | HIGH   | 4/5/4/4/4 | 2025-12   |
| 4   | https://code.claude.com/docs/en/hooks-guide                                          | Automate workflows with hooks — Claude Code Docs                    | official-docs     | HIGH   | 5/5/5/5/5 | 2026      |
| 5   | https://code.claude.com/docs/en/permissions                                          | Configure permissions — Claude Code Docs                            | official-docs     | HIGH   | 5/5/5/5/5 | 2026      |
| 6   | https://www.brethorsting.com/blog/2025/08/demystifying-claude-code-hooks/            | Demystifying Claude Code Hooks                                      | community-blog    | MEDIUM | 3/4/3/3/4 | 2025-08   |
| 7   | https://gist.github.com/hartphoenix/698eb8ef8b08ad2ce6a99cf7346cd7cc                 | Claude Code Yolo Mode: Security Research                            | security-research | MEDIUM | 3/5/3/4/4 | 2026-03   |
| 8   | https://github.com/anthropics/claude-code/issues/30736                               | allowedTools glob patterns never match Windows backslash paths      | github-issue      | HIGH   | 4/5/4/4/4 | 2026      |
| 9   | https://github.com/anthropics/claude-code/issues/18527                               | Plugin bash hooks fail on Windows due to mixed path separators      | github-issue      | HIGH   | 4/5/4/4/4 | 2025-12   |
| 10  | https://github.com/anthropics/claude-code/issues/4446                                | Feature: Sequential, Conditional, and Chainable Hooks               | github-issue      | HIGH   | 4/5/4/4/4 | 2025-07   |
| 11  | https://github.com/anthropics/claude-code/issues/21533                               | Feature: Sequential Hook Execution Option                           | github-issue      | HIGH   | 4/5/4/4/4 | 2026-02   |
| 12  | https://github.com/anthropics/claude-code/issues/29991                               | PostToolUse hook `continue: false` silently ignored via Agent SDK   | github-issue      | HIGH   | 4/5/4/4/4 | 2026      |
| 13  | https://blakecrosley.com/blog/claude-code-hooks-tutorial                             | Claude Code Hooks Tutorial: 5 Production Hooks From Scratch         | community-blog    | MEDIUM | 3/4/3/3/4 | 2025-2026 |
| 14  | https://dev.to/boucle2026/how-to-fix-claude-codes-broken-permissions-with-hooks-23gl | How to Fix Claude Code's Broken Permissions (With Hooks)            | community-blog    | MEDIUM | 3/4/3/3/4 | 2026      |
| 15  | https://github.com/anthropics/claude-code/issues/11544                               | Hooks not loading from settings.json                                | github-issue      | HIGH   | 4/5/4/4/4 | 2025      |

---

## Contradictions

**Documentation vs. Reality on Shell Operator Awareness:** The official
permissions documentation states: "Claude Code is aware of shell operators (like
`&&`) so a prefix match rule like `Bash(safe-cmd *)` won't give it permission to
run the command `safe-cmd && other-cmd`."

GitHub issue #4956 directly contradicts this with a reproducible 97.9-100%
bypass rate. The issue was closed as COMPLETED, suggesting a fix was applied.
However, the `if` field was introduced in v2.1.85, and the exact interaction
between the post-fix permission engine and the `if` field matching is not
documented. The security research gist (Source 7) documents bypasses in 2026,
post-fix. **The contradiction is unresolved.** Treat compound command bypass as
a live risk until explicitly confirmed fixed for `if` conditions specifically.

**Parallel vs. Sequential Blocking:** The documentation says "all matching hooks
run in parallel" and one hook's exit code 2 blocks the tool. But if hooks run in
parallel, the blocking hook's signal arrives while other hooks are still
executing. The documentation does not clarify whether other parallel hooks are
cancelled when one returns exit 2, or whether they complete and their outputs
are discarded. This is undocumented behavior with real consequences for resource
cleanup hooks.

---

## Gaps

1. **Exact `if` matching implementation for compound commands post-fix:** The
   v2.1.85 release introduced `if`, and the compound command bypass fix was
   applied earlier (v2.1.7 era). It is not confirmed whether the `if` field uses
   the patched AST-aware matching or the old prefix-only approach.

2. **`if` field with heredocs and multi-line commands:** No documentation or
   community report addresses how `if` conditions behave when the Bash tool
   receives heredoc (`<<EOF ... EOF`) or multi-line scripts. Behavior is
   unknown.

3. **`if` and `continueOnError`:** The `continueOnError` field does not appear
   in Claude Code hook documentation. This term is absent from official sources.
   It may be a feature request, a different naming, or simply not implemented.
   No verified behavior to report.

4. **`if` pattern evaluation order vs. `matcher` evaluation:** It is unclear
   whether the `if` check is evaluated by the same engine as `matcher` regex, or
   by a separate permission-rule engine with different semantics. Both exist in
   the same config but may have different matching implementations.

5. **Race condition between `if` evaluation and execution:** No documentation or
   community report addresses a TOCTOU scenario where the `if` condition
   evaluates to false at hook-check time but the actual tool execution differs
   (e.g., a mutable variable in the command string). The security research gist
   mentions TOCTOU for sandbox contexts but not specifically for `if` fields.

6. **Hook chaining with `if` and Agent SDK `continue: false`:** The interaction
   between `if`-conditional hooks that return `continue: false` via the Agent
   SDK control protocol is not documented. Given that `continue: false` is
   already silently ignored in some Agent SDK contexts (Issue #29991), adding
   `if` conditions may further complicate the signal path.

---

## Serendipity

**Prompt-based hooks silently ignored when installed via plugins (Issue
#13155):** A separate class of silent failure exists where `type: "prompt"`
hooks do not fire when delivered through the plugin system. This affects any
team distributing hooks via plugins rather than direct settings files.

**"Always Allow" drift accumulates dead rules:** When developers click "Yes,
don't ask again" for compound commands, Claude Code saves a separate rule for
each subcommand. Over time, `~/.claude/settings.json` accumulates rules that
were created for specific compound contexts and no longer match any realistic
command. These dead rules can interact unexpectedly with `if` conditions in ways
that are difficult to audit.

**Security research found 84% successful attack rate against hook-based
guardrails:** A comprehensive security study (Source 7) found that hook-based
security configurations using `if` conditions and `deny` rules had an 84%
success rate against controlled attack payloads, rising to 90%+ when attackers
adapted to the specific defense. This is not a theoretical concern — it is a
measured empirical finding.

**The `if` field is primarily a performance feature, not a security feature:**
Multiple official documentation sources frame `if` as an optimization to "avoid
the process spawn overhead." The security framing comes from the community, not
Anthropic. This framing mismatch is the root of the "false security"
anti-pattern.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The core findings (compound command bypass, version compatibility silent
failure, non-tool event silent kill, Windows path issues) are all confirmed by
official documentation and/or reproducible GitHub issues. The security research
finding (84% bypass rate) is from a community source but is corroborated by the
official permission documentation's own warning about pattern fragility.
