# G5: Template Syntax in Hook `if` Fields — Live Testing Results

**Investigator:** live-testing agent **Date:** 2026-03-29 **Sub-Question:** Does
`{{ variable }}` template syntax work in hook `if` fields? **Verdict:** NO.
Template syntax is NOT supported. Not even close.

---

## Executive Summary

The `if` field in Claude Code hooks supports **one and only one syntax**:
permission rule syntax (`ToolName(argument_pattern)`). There is no template
variable system, no `{{ }}` interpolation, no access to `context_window` or any
other session state from the `if` field. The D4 proposal to use
`if: "{{ context_window.remaining_percentage }} < 40"` is **invalid** and would
silently fail (the hook would never match anything).

---

## Evidence

### 1. Official Documentation — Definitive [CONFIDENCE: HIGH]

The official hooks guide at `code.claude.com/docs/en/hooks-guide` states:

> The `if` field uses permission rule syntax to filter hooks by tool name and
> arguments together, so the hook process only spawns when the tool call
> matches. [...] The `if` field accepts the same patterns as permission rules:
> `"Bash(git *)"`, `"Edit(*.ts)"`, and so on.

The official hooks reference at `code.claude.com/docs/en/hooks` defines `if` as:

> Permission rule syntax to filter when this hook runs, such as `"Bash(git *)"`
> or `"Edit(*.ts)"`. [...] Uses the same syntax as permission rules.

**No mention whatsoever** of template variables, `{{ }}` syntax, dynamic
conditions, context window access, or any expression evaluation in the `if`
field.

### 2. Complete Interpolation Inventory [CONFIDENCE: HIGH]

Claude Code supports exactly **three** forms of variable interpolation in hook
configuration, and **none** apply to the `if` field:

| Interpolation Type        | Where It Works                   | Syntax                                        | Example                                         |
| ------------------------- | -------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Environment variables     | Command hook `command` field     | `$VAR` / `${VAR}`                             | `"$CLAUDE_PROJECT_DIR"/.claude/hooks/script.sh` |
| HTTP header interpolation | HTTP hook `headers` field        | `$VAR` / `${VAR}` (requires `allowedEnvVars`) | `"Authorization": "Bearer $MY_TOKEN"`           |
| Prompt placeholder        | Prompt/agent hook `prompt` field | `$ARGUMENTS`                                  | `"Check this: $ARGUMENTS"`                      |

The `if` field is not in any of these categories. It is evaluated by the
permission rule engine, which is a static pattern matcher — not a template
engine.

### 3. `if` Field Operates at Wrong Level for Context State [CONFIDENCE: HIGH]

The `if` field is fundamentally a **tool-call filter**. It answers: "Does this
specific tool invocation match a pattern?" It operates on:

- Tool name (e.g., `Bash`, `Edit`, `Write`)
- Tool arguments (e.g., `git *`, `*.ts`, `/src/**`)

It does NOT have access to:

- Session state (context window usage, token counts, cost)
- Environment variables
- Filesystem state
- Git state
- Any runtime values beyond the tool call itself

### 4. Context Window Data Exists — But Only in StatusLine [CONFIDENCE: HIGH]

The `context_window` object with `remaining_percentage`, `used_percentage`,
`context_window_size`, etc. is real and available — but **only to the statusLine
command**, which is a completely separate system from hooks.

StatusLine receives a rich JSON payload on stdin including:

```json
{
  "context_window": {
    "context_window_size": 200000,
    "used_percentage": 42,
    "remaining_percentage": 58,
    "total_input_tokens": 84000,
    "total_output_tokens": 12000,
    "current_usage": { ... }
  }
}
```

Hooks do NOT receive this data. Hook scripts receive only event-specific JSON
(tool name, tool input, session ID, cwd, etc.) — never context window metrics.

### 5. Active Feature Requests Confirm the Gap [CONFIDENCE: HIGH]

Multiple open GitHub issues on `anthropics/claude-code` request exactly this
capability, confirming it does not exist:

| Issue                                                            | Title                                                           | Status       | Key Quote                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| [#34340](https://github.com/anthropics/claude-code/issues/34340) | Expose context window usage to hooks via environment variable   | OPEN         | "Hooks have no way to know how much of the context window is consumed"                            |
| [#27969](https://github.com/anthropics/claude-code/issues/27969) | Expose context window usage percentage to hooks                 | CLOSED (dup) | "There's currently no way for hooks to know how full the context window is"                       |
| [#34879](https://github.com/anthropics/claude-code/issues/34879) | Expose context window usage metrics to Claude for self-analysis | OPEN         | "No way for Claude to inspect its own context window consumption during a session"                |
| [#32014](https://github.com/anthropics/claude-code/issues/32014) | Statusline hook: context_window_size always reports 200k        | CLOSED (dup) | Bug in statusLine data — confirms context data IS available there but has issues                  |
| [#4446](https://github.com/anthropics/claude-code/issues/4446)   | Support Sequential, Conditional, and Chainable Hooks            | CLOSED       | Proposed `conditions` block with `git_branch`, `env_var_exists`, `file_exists` — none implemented |

### 6. Changelog Confirms No Template Features [CONFIDENCE: HIGH]

The v2.1.85 changelog entry for `if` reads:

> "Added conditional `if` field for hooks using permission rule syntax (e.g.,
> `Bash(git *)`) to filter when they run, reducing process spawning overhead"

No subsequent changelog entry adds template variables, dynamic conditions, or
context-aware expressions to hooks.

---

## What D4's Proposed Syntax Would Actually Do

```json
{
  "if": "{{ context_window.remaining_percentage }} < 40"
}
```

This string would be evaluated as a **permission rule pattern**. The permission
rule engine would attempt to match it against tool calls like `Bash(npm test)`.
The literal string `{{ context_window.remaining_percentage }} < 40` would never
match any tool name or argument pattern. The hook would **silently never fire**.

This is particularly dangerous because Claude Code does not error on invalid
`if` patterns — it just never matches, so the failure is silent.

---

## Alternatives for Context-Aware Hook Behavior

### Alternative 1: Wrapper Script With Heuristic (Available Now)

Instead of filtering with `if`, use a `PostToolUse` hook on all tools and let
the script decide whether to act based on heuristic context estimation:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/context-monitor.sh"
          }
        ]
      }
    ]
  }
}
```

The script counts tool calls or cumulative stdin size as a proxy for context
usage. This is what issue #34340's author does today. Limitations:

- Imprecise (cannot know actual token count)
- Breaks when context window size changes (200K vs 1M)
- Must be manually recalibrated per model/plan

### Alternative 2: PreCompact Hook (Available Now)

Use `PreCompact` to detect when compaction is about to happen (meaning context
is full):

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": "auto",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre-compact-save.sh"
          }
        ]
      }
    ]
  }
}
```

This fires when context IS full (not at a configurable threshold), but it is
reliable and does not require heuristics. Useful for
save-state-before-compaction workflows.

### Alternative 3: StatusLine Monitoring (Available Now, Read-Only)

Use the statusLine to display context percentage. The user can see it and make
decisions. This does not enable **automated** action, but it provides the data.

### Alternative 4: Wait for CLAUDE_CONTEXT_PERCENT Env Var (Future)

Issues #34340 and #34879 request exposing `CLAUDE_CONTEXT_PERCENT`,
`CLAUDE_CONTEXT_USED`, and `CLAUDE_CONTEXT_MAX` as environment variables to hook
scripts. If implemented, a wrapper script could use these:

```bash
#!/bin/bash
if [ "${CLAUDE_CONTEXT_PERCENT:-0}" -ge 60 ]; then
  echo "Context at ${CLAUDE_CONTEXT_PERCENT}%. Consider /compact."
fi
```

This is the most-requested approach but has no implementation timeline.

### Alternative 5: Prompt Hook With Agent Self-Awareness (Available Now)

Use a `prompt` or `agent` type hook that asks the model to assess context
pressure:

```json
{
  "type": "prompt",
  "prompt": "Based on the session so far, estimate if context is getting full. If so, suggest /compact. $ARGUMENTS"
}
```

This is imprecise (the model does not have accurate token counts) but might
catch extreme cases. High overhead: spawns an LLM call on every matched event.

---

## Impact on D4 GSD Context Monitor Proposal

The D4 proposal's "highest-value optimization" of ~92% spawn reduction via
`if: "{{ context_window.remaining_percentage }} < 40"` is **not achievable**
through the `if` field. The alternatives are:

| Approach                         | Spawn Reduction                    | Accuracy                | Available     |
| -------------------------------- | ---------------------------------- | ----------------------- | ------------- |
| `if` with template syntax        | N/A                                | N/A                     | NOT SUPPORTED |
| Wrapper script (exit early)      | 0% (always spawns)                 | LOW (heuristic)         | NOW           |
| `PreCompact` hook                | ~95% (fires only at full)          | HIGH (but no threshold) | NOW           |
| `CLAUDE_CONTEXT_PERCENT` env var | 0% (always spawns, script decides) | HIGH                    | FUTURE        |
| Prompt hook                      | 0% (always spawns LLM)             | LOW-MEDIUM              | NOW           |

**Recommendation for D4:** Use `PreCompact` for the "context is full" case, and
a lightweight wrapper script with tool-call counting for the "approaching
threshold" case. Accept that the wrapper always spawns (no `if` optimization)
but can exit in <10ms when below threshold.

---

## Sources

| #   | URL/Location                                                     | Type                              | Trust |
| --- | ---------------------------------------------------------------- | --------------------------------- | ----- |
| 1   | https://code.claude.com/docs/en/hooks-guide                      | Official docs (hooks guide)       | HIGH  |
| 2   | https://code.claude.com/docs/en/hooks                            | Official docs (hooks reference)   | HIGH  |
| 3   | https://code.claude.com/docs/en/statusline                       | Official docs (statusline)        | HIGH  |
| 4   | https://code.claude.com/docs/en/permissions                      | Official docs (permissions)       | HIGH  |
| 5   | https://github.com/anthropics/claude-code/issues/34340           | GitHub issue (context env var)    | HIGH  |
| 6   | https://github.com/anthropics/claude-code/issues/27969           | GitHub issue (context percentage) | HIGH  |
| 7   | https://github.com/anthropics/claude-code/issues/34879           | GitHub issue (context metrics)    | HIGH  |
| 8   | https://github.com/anthropics/claude-code/issues/32014           | GitHub issue (statusline bug)     | HIGH  |
| 9   | https://github.com/anthropics/claude-code/issues/4446            | GitHub issue (conditional hooks)  | HIGH  |
| 10  | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md | Changelog                         | HIGH  |
| 11  | D1-spec.md (this research)                                       | Prior finding                     | HIGH  |
