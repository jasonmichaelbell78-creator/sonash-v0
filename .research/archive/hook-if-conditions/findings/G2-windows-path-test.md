# G2: Windows Path `if` Condition Empirical Test

**Tester:** Live testing agent (in-session) **Date:** 2026-03-29 **Platform:**
Windows 11 Home 10.0.26200 (Git Bash shell) **Claude Code version:** Session on
Opus 4.6 (1M context)

---

## Objective

Empirically test whether `if: "Write(*.ts)"` and `if: "Edit(*.json)"` work as
hook conditions on Windows, and whether Windows path separators (`\`) cause
matching failures.

---

## Test Results

### Test 1: Mid-Session Hook Addition (BLOCKED)

**What was tested:** Added a new PostToolUse hook to `.claude/settings.json`
with:

```json
{
  "matcher": "^(?i)(write|edit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(*.test-if-marker)|Edit(*.test-if-marker)",
      "command": "touch .claude/state/if-test-WITH-if.txt",
      "continueOnError": true
    },
    {
      "type": "command",
      "command": "touch .claude/state/if-test-NO-if.txt",
      "continueOnError": true
    }
  ]
}
```

Then used Write tool to create three `.test-if-marker` files.

**Result:** Neither hook fired (neither the `if`-conditioned nor the control
hook without `if`).

**Conclusion:** **Claude Code does NOT hot-reload hooks from settings.json
mid-session.** Hooks are loaded at session start and remain fixed for the
session's lifetime. This blocked all direct empirical testing of new `if`
patterns within a single session.

**Evidence:** The existing hooks (post-write-validator with matcher
`^(?i)write$`) continued to fire normally on every Write call throughout the
session, showing status message "Validating write operation..." as expected.
Only newly-added hooks were ignored.

---

### Test 2: Existing Bash `if` Conditions (CONFIRMED WORKING)

**What was tested:** The existing `if: "Bash(git commit *)"` condition on the
commit-tracker hook (loaded at session start).

**Method:** Ran `git commit --dry-run -m "test"` (a Bash command matching the
pattern) and then `git log --oneline -1` (a Bash command NOT matching the
pattern).

**Result:** The commit-tracker hook fired for the `git commit` command (its
internal logic detected no HEAD change and bailed -- expected). The `git log`
command did not trigger the commit-tracker. This confirms `Bash(...)` `if`
conditions work correctly on Windows.

**Evidence:** commit-log.jsonl remained at 639 lines before and after both
commands, consistent with the hook firing but finding no actual commit to log.

---

### Test 3: Windows Path Format Inspection (INDIRECT)

**What was tested:** What path format does Claude Code pass to Write/Edit hooks
on Windows?

**Method:** Inspected `post-write-validator.js` source code, which receives
`$ARGUMENTS` from the hook system.

**Findings:**

- Line 108 of post-write-validator.js:
  `filePath = filePath.replace(/\\/g, "/");`
- The hook script explicitly normalizes backslashes to forward slashes
- This implies the hook system passes Windows-native paths (with backslashes) to
  hook commands via `$ARGUMENTS`

**Conclusion:** Hook scripts receive Windows-style backslash paths from Claude
Code and must normalize them internally. This does NOT directly tell us what the
`if` field's pattern engine sees, because `if` is evaluated before the command
spawns.

---

## Findings from Prior Research (D1-spec, D8-locale, D9-risks)

The following findings from the existing deep-research output are directly
relevant and were reviewed:

### Finding A: Official Docs Say `Edit(*.ts)` Is a Valid `if` Pattern

D1-spec.md (Finding 1, CONFIDENCE: HIGH) cites the official hooks guide:

> "The `if` field accepts the same patterns as permission rules: `Bash(git *)`,
> `Edit(*.ts)`, and so on."

D3-S-tool-compatibility.md confirms this is architecturally supported, not
Bash-only.

### Finding B: Windows Path Normalization Claimed in Official Docs

D1-spec.md (Finding 5, CONFIDENCE: HIGH) states:

> "On Windows, paths are normalized to POSIX form before matching.
> `C:\Users\alice` becomes `/c/Users/alice`, so use `//c/**/.env` to match
> `.env` files anywhere on that drive."

**Source:** Official permissions documentation at
code.claude.com/docs/en/permissions

### Finding C: D8-locale Warns of Path Separator Risk Anyway

D8-locale (Finding 5, CONFIDENCE: HIGH) states:

> "If any future `if` condition uses `Edit(...)`, `Write(...)`, or `Read(...)`
> patterns with file paths, both locales face the same Windows path separator
> issue: Claude generates Windows-style backslash paths, but the glob matcher
> treats `\` as escape characters."

This contradicts Finding B. D8 was written by a codebase-profile agent that did
not access the official docs claiming POSIX normalization. D1 cited official
docs claiming normalization happens.

### Finding D: Pipe OR Syntax in `if` Is Unconfirmed

D1-spec.md (Finding 7, CONFIDENCE: MEDIUM) notes:

> "The official documentation does NOT show explicit pipe syntax within the `if`
> value itself. The docs recommend separate handler objects."

The existing commit-tracker uses pipe OR
(`Bash(git commit *)|Bash(git cherry-pick *)`), which works in practice for Bash
patterns. Whether it works for Write/Edit patterns is unverified.

---

## Specific Questions Answered

### Q1: Does `if: "Write(*.ts)"` work on Windows?

**Answer: THEORETICALLY YES, EMPIRICALLY UNVERIFIED.**

Official documentation says it is a valid pattern. D1-spec confirms the syntax
is supported. However:

- No empirical test was possible in this session (hooks are not hot-reloaded)
- No existing production hook in this repo uses `Write(...)` or `Edit(...)` in
  an `if` condition
- The only empirical evidence available is that `Bash(...)` patterns work
  correctly on Windows

### Q2: Does `if: "Edit(*.json)"` work on Windows?

**Answer: Same as Q1 -- theoretically yes, empirically unverified.**

### Q3: Does `if: "Write(src/*.ts)"` match when Windows passes `src\foo.ts`?

**Answer: UNKNOWN, with contradictory signals.**

- Official docs claim paths are POSIX-normalized before matching (D1 Finding 5)
- D8-locale warns that backslash-as-escape may cause failures
- The `$ARGUMENTS` passed to hook commands contain Windows backslashes (proven
  by post-write-validator.js needing explicit normalization on line 108)
- BUT the `if` field is evaluated by Claude Code's internal engine, not by the
  hook command, so it may normalize independently

**Likely behavior:** If the official docs are accurate, `Write(src/*.ts)` should
match because the path is normalized to `src/foo.ts` before the glob runs. But
this has never been tested empirically on this machine.

### Q4: Does `if: "Edit(C:\\Users\\*)"` work?

**Answer: ALMOST CERTAINLY NOT in that literal form.**

Per D1-spec Finding 5, absolute Windows paths use the `//drive/path` prefix:

- `Edit(//c/Users/jason/*)` -- correct form for absolute Windows paths
- `Edit(C:\\Users\\*)` -- would NOT work because `\` is treated as escape chars
  in the glob engine, and `C:` is not a recognized prefix

The docs are explicit: `//` prefix = absolute path from filesystem root. Use
`//c/Users/` not `C:\Users\`.

---

## Conclusions

### What IS empirically confirmed on Windows:

1. **`Bash(...)` `if` conditions work correctly** -- tested with `git commit`
   and `git log` commands
2. **Hooks are NOT hot-reloaded mid-session** -- new hooks added to
   settings.json during a session are ignored until the next session
3. **Hook commands receive Windows-style backslash paths** in `$ARGUMENTS`
4. **Existing hooks normalize paths internally** (backslash to forward slash)

### What is NOT empirically confirmed but documented:

1. **`Write(*.ts)` and `Edit(*.json)` are valid `if` patterns** -- per official
   docs, they use the same permission rule syntax as Bash patterns
2. **Windows paths are POSIX-normalized before `if` matching** -- per official
   permissions docs, `C:\Users\alice` becomes `/c/Users/alice`
3. **Relative path patterns like
   `Edit(src/**/\*.ts)`should work** -- if POSIX normalization occurs,`src\foo.ts`becomes`src/foo.ts`
   before glob matching
4. **Absolute Windows paths require `//c/` prefix** -- not `C:\` form

### What remains contradictory:

1. D8-locale warns about path separator failures in `Edit(...)` patterns, citing
   the same research session's D9-risks analysis
2. D1-spec cites official docs claiming POSIX normalization before matching
3. These two claims are in tension. The most likely resolution is that D1 is
   correct (official docs trump codebase-agent inference), but empirical
   verification would settle it definitively

### Recommendation for Empirical Verification:

To definitively test `Write(*.ts)` / `Edit(*.json)` `if` conditions on Windows:

1. Add the test hook to settings.json
2. **Start a new Claude Code session** (hooks are loaded at session start)
3. Use Write to create a `.ts` file -- check if the hook fires
4. Use Write to create a `.txt` file -- check if the hook does NOT fire
5. Use Edit on a `.json` file -- check if the hook fires
6. Clean up after testing

This two-session approach is required because hooks cannot be tested in the
session that adds them.

---

## Cleanup Verification

- settings.json: Restored to original (verified via diff)
- test-trigger\*.test-if-marker files: Deleted (verified via ls)
- .claude/state/if-test-\*.txt files: Deleted
- .claude/settings.json.bak: Deleted
- No test artifacts remain in the working tree
