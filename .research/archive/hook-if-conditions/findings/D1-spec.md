# Findings: Claude Code Hook `if` Field — Complete Specification

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-29 **Sub-Question IDs:** SQ-001 (if field specification)

---

## Summary

The `if` field is an optional filter introduced in Claude Code v2.1.85 (released
March 27, 2026) that applies to individual hook handlers within tool-related
events. It uses **permission rule syntax** to match against tool name +
arguments together, acting as a fast pre-spawn filter. When the condition fails,
the hook process is never spawned — reducing overhead vs. spawning a process
that immediately exits.

Key constraint: `if` only works on `PreToolUse`, `PostToolUse`,
`PostToolUseFailure`, and `PermissionRequest`. On all other events, a hook with
an `if` field **never runs** — it is silently skipped, not errored.

---

## Key Findings

### 1. Version Requirement [CONFIDENCE: HIGH]

The `if` field requires **Claude Code v2.1.85 or later** (released March 27,
2026). Earlier versions silently ignore the `if` field and run the hook on every
matched call.

Exact changelog entry from v2.1.85:

> "Added conditional `if` field for hooks using permission rule syntax (e.g.,
> `Bash(git *)`) to filter when they run"

Sources: [1], [2]

---

### 2. Complete Syntax Format [CONFIDENCE: HIGH]

The `if` field is placed on an individual hook handler object (the innermost
hooks array), not on the matcher group.

**Format:** `"ToolName(argument_pattern)"`

Structure example:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "/path/to/script.sh"
          }
        ]
      }
    ]
  }
}
```

The syntax is identical to the permission rule specifier syntax documented at
`/en/permissions`. Sources: [3], [4]

---

### 3. Pattern Matching Rules [CONFIDENCE: HIGH]

The `if` field uses the same pattern system as Claude Code permission rules (not
a separate glob or regex engine). Key behaviors:

**Wildcards:**

- `*` is the wildcard character
- When `*` appears at the end with a space before it (e.g., `Bash(git *)`), it
  enforces a word boundary: requires the prefix to be followed by a space or
  end-of-string
  - `Bash(git *)` matches `git commit` and `git push` but NOT `gitignore`
  - `Bash(git*)` without a space matches both `git commit` AND `gitignore`
- `**` in file path patterns (Edit/Read/Write) matches recursively across
  directories; `*` matches within a single directory level

**Exact matching:** `Bash(npm run build)` matches only the exact command
`npm run build`

**Shell operator awareness:** Claude Code is aware of shell operators (`&&`,
`;`, `|`). A prefix match like `Bash(safe-cmd *)` will NOT give permission for
`safe-cmd && other-cmd`. This same awareness applies to `if` patterns since they
use identical syntax.

Sources: [3], [4]

---

### 4. Tool Argument Shapes per Tool Type [CONFIDENCE: HIGH]

The `if` pattern matches against the tool's actual argument value. Each tool
type has a distinct argument field that is matched:

**Bash — matched field: `command` (the full shell command string)**

```
"Bash(git *)"        — commands starting with "git " (word boundary)
"Bash(rm *)"         — commands starting with "rm "
"Bash(npm run *)"    — commands starting with "npm run "
"Bash(git * main)"   — commands like "git checkout main", "git merge main"
"Bash(* --version)"  — any command ending with " --version"
"Bash(npm run build)"— exact command only
```

**Edit — matched field: `file_path` (the file being edited)**

```
"Edit(*.ts)"          — TypeScript files in cwd
"Edit(/src/**/*.ts)"  — .ts files under project's src/ (recursive)
"Edit(./.env)"        — exact .env file in cwd
"Edit(~/secrets/*)"   — files in home directory secrets/
"Edit(//tmp/**)"      — absolute path /tmp/ (note: // prefix = absolute)
```

**Write — matched field: `file_path` (the file being written)**

```
"Write(src/**)"       — any file under cwd's src/
"Write(*.json)"       — JSON files in cwd
```

**Read — matched field: `file_path` (the file being read)**

```
"Read(*.json)"        — JSON files
"Read(~/.zshrc)"      — specific home-dir file
"Read(./.env)"        — .env in cwd
```

**Glob — matched field: `pattern` (the glob pattern being searched)**

```
"Glob(*.ts)"          — glob searches for TypeScript files
```

**Grep — matched field: `pattern` (the search pattern)**

```
"Grep(TODO)"          — grep searches for "TODO"
```

**WebFetch — matched field: `url`**

```
"WebFetch(domain:example.com)"  — fetches to example.com
```

**WebSearch — matched field: `query`**

```
"WebSearch(*)"        — all web searches
```

**Agent/subagent — matched field: `prompt`**

```
"Agent(Explore)"      — Explore subagent
"Agent(Plan)"         — Plan subagent
"Agent(my-agent)"     — custom-named subagent
```

**MCP tools — matched by full tool name (no argument specifier pattern shown in
docs)**

```
"mcp__memory__.*"          — all tools from memory server
"mcp__.*__write.*"         — write-related tools from any MCP server
"mcp__github__search_*"    — search tools from github server
```

Note: Read and Edit rules apply to ALL built-in file tools. `Edit` rules cover
all file-editing tools; Claude makes a best-effort attempt to apply `Read` rules
to all tools that read files (including Grep and Glob).

Sources: [3], [4], [5]

---

### 5. File Path Pattern Prefixes for Edit/Write/Read [CONFIDENCE: HIGH]

The path patterns in Edit/Write/Read rules follow the gitignore specification
with four distinct prefix types:

| Pattern prefix     | Meaning                            | Example                   |
| ------------------ | ---------------------------------- | ------------------------- |
| `//path`           | Absolute path from filesystem root | `Edit(//tmp/scratch.txt)` |
| `~/path`           | Path from home directory           | `Read(~/Documents/*.pdf)` |
| `/path`            | Path relative to project root      | `Edit(/src/**/*.ts)`      |
| `path` or `./path` | Path relative to current directory | `Read(*.env)`             |

WARNING: A pattern like `/Users/alice/file` is NOT an absolute path — it is
relative to the project root. Use `//Users/alice/file` for absolute paths.

On Windows, paths are normalized to POSIX form before matching. `C:\Users\alice`
becomes `/c/Users/alice`, so use `//c/**/.env` to match `.env` files anywhere on
that drive.

Sources: [4]

---

### 6. Supported Events — `if` Only Works on Tool Events [CONFIDENCE: HIGH]

The `if` field is **only evaluated** on these four events:

- `PreToolUse`
- `PostToolUse`
- `PostToolUseFailure`
- `PermissionRequest`

**On ALL other events, a hook with `if` set NEVER runs.** This is a hard rule,
not a degraded/fallback behavior. The official docs state:

> "Adding it to any other event prevents the hook from running."

Non-tool events where `if` causes the hook to be silently skipped (never runs):

- `SessionStart`, `SessionEnd`
- `UserPromptSubmit`
- `Stop`, `StopFailure`
- `Notification`
- `SubagentStart`, `SubagentStop`
- `TaskCreated`, `TaskCompleted`
- `TeammateIdle`
- `InstructionsLoaded`
- `ConfigChange`
- `CwdChanged`
- `FileChanged`
- `WorktreeCreate`, `WorktreeRemove`
- `PreCompact`, `PostCompact`
- `Elicitation`, `ElicitationResult`

Sources: [3], [5]

---

### 7. OR Conditions — Two Patterns [CONFIDENCE: MEDIUM]

There are two ways to express OR conditions, and they work at different levels:

**At the `matcher` level (tool name OR):**

```json
"matcher": "Edit|Write"
```

The matcher supports pipe `|` for OR across tool names. This is a regex pattern.

**At the `if` level:** The official documentation does NOT show explicit pipe
syntax within the `if` value itself for combining different tool names or
argument patterns. The docs state:

> "To match multiple tool names, use separate handlers each with its own `if`
> value, or match at the `matcher` level where pipe alternation is supported."

This means the recommended approach for OR across tools is separate handlers:

```json
"hooks": [
  { "type": "command", "if": "Edit(*.ts)", "command": "..." },
  { "type": "command", "if": "Write(*.ts)", "command": "..." }
]
```

One Context7 source shows `"Bash(rm *) | Edit(*)"` syntax, but this was NOT
confirmed in the official hooks reference or permissions docs. Treat as
unverified.

Sources: [3], [5]

---

### 8. Negation Syntax — NOT SUPPORTED [CONFIDENCE: MEDIUM]

There is **no documented negation syntax** (`!`, `NOT`, `^`) for the `if` field.
The permission rule syntax as documented covers only positive matching patterns.

The documentation does not mention any way to express "run this hook when the
tool call does NOT match a pattern."

Workaround: Use a shell script invoked by the hook, which reads the tool input
from stdin and applies its own negation logic.

Sources: [3], [4] — absence of evidence from both official docs and web search

---

### 9. How `if` Interacts with `matcher` [CONFIDENCE: HIGH]

The two fields operate at different levels of the hook configuration hierarchy:

**Level 1:** Hook event (e.g., `PreToolUse`) **Level 2:** Matcher group —
`matcher` filters by tool name (regex). Applies to the whole group. **Level 3:**
Hook handler — `if` field on individual handlers within the matched group

Execution order:

1. Event fires → `PreToolUse` triggered
2. Matcher checks tool name → `matcher: "Bash"` passes if tool is Bash
3. `if` checks tool name + arguments → `if: "Bash(git *)"` checks the actual
   command
4. If `if` passes → hook process spawns and runs
5. If `if` fails → handler skipped, no process spawned (performance benefit)

The `if` field provides **additional narrowing** beyond the matcher. The
`matcher` is still required and evaluated first; `if` is a secondary filter.

Important: Both `matcher` and `if` can match tool names, but only `if` can match
arguments. If you set `matcher: "Bash"` and `if: "Edit(*.ts)"`, the `if`
condition will never match (Edit tool would have been filtered out by the
matcher already). Keep them consistent.

Sources: [3], [5]

---

### 10. Performance Benefit — Process Spawn Avoidance [CONFIDENCE: HIGH]

The `if` field is evaluated **before** the hook process spawns. When the
condition fails, no subprocess is created. This is the stated primary motivation
for the feature per the v2.1.85 changelog:

> "to filter when they run, significantly reducing unnecessary process spawning
> overhead"

This is different from a hook that spawns and exits early — the process is never
created at all when `if` evaluates to false.

Sources: [1], [2]

---

### 11. `if` Field on `PermissionRequest` Specifics [CONFIDENCE: MEDIUM]

The `PermissionRequest` event is a tool event and supports `if`. However:

- `PermissionRequest` hooks do NOT fire in non-interactive mode (`-p` flag)
- For automated/headless environments, use `PreToolUse` hooks instead

Sources: [5]

---

### 12. Older Versions — Backward Compatibility [CONFIDENCE: HIGH]

The official docs state:

> "Earlier versions ignore it and run the hook on every matched call."

This means on versions before v2.1.85:

- The `if` field is silently ignored (not an error)
- All hooks in the matched group run regardless of what the `if` field contains

Sources: [3]

---

### 13. `MultiEdit` Tool [CONFIDENCE: MEDIUM]

The `MultiEdit` tool appears in hook configurations (e.g.,
`"matcher": "Edit|Write|MultiEdit"`) but is not explicitly documented in the
permissions rule syntax page or `if` field examples. It is likely matched the
same way as `Edit` (by file path), but this is not confirmed in official docs.

Sources: [5] (matcher examples only, not `if` field examples)

---

## Sources

| #   | URL                                                         | Title                                             | Type                          | Trust  | CRAAP | Date       |
| --- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------- | ------ | ----- | ---------- |
| 1   | https://releasebot.io/updates/anthropic/claude-code         | Claude Code Release Notes on Releasebot           | Third-party changelog tracker | MEDIUM | 3.8   | March 2026 |
| 2   | https://claude-world.com/articles/claude-code-2185-release/ | Claude Code v2.1.85 Release Notes - ClaudeWorld   | Third-party summary           | MEDIUM | 3.6   | March 2026 |
| 3   | https://code.claude.com/docs/en/hooks-guide                 | Hooks Guide - Official Claude Code Docs           | Official docs                 | HIGH   | 5.0   | March 2026 |
| 4   | https://code.claude.com/docs/en/permissions                 | Configure Permissions - Official Claude Code Docs | Official docs                 | HIGH   | 5.0   | March 2026 |
| 5   | https://code.claude.com/docs/en/hooks                       | Hooks Reference - Official Claude Code Docs       | Official docs                 | HIGH   | 5.0   | March 2026 |
| 6   | /llmstxt/code_claude_llms_txt (Context7 MCP)                | Claude Code LLMs.txt via Context7                 | Context7 tier-1               | HIGH   | 4.5   | Current    |

---

## Contradictions

**OR syntax in `if` field:** One Context7 source (from
`/llmstxt/code_claude_llms_txt`) showed `"Bash(rm *) | Edit(*)"` as example `if`
field syntax. The official hooks-guide documentation states the opposite: "To
match multiple tool names, use separate handlers each with its own `if` value,
or match at the `matcher` level where pipe alternation is supported." This
directly contradicts the pipe-in-if example from Context7. The official docs are
authoritative. Until tested, treat pipe inside an `if` value as unverified /
potentially non-functional.

---

## Gaps

1. **Negation syntax:** No source confirms whether `!`, `NOT`, or any negation
   operator exists. The absence from official docs strongly suggests it does not
   exist, but no source explicitly states "negation is not supported."

2. **`MultiEdit` argument shape:** How `if` matches against `MultiEdit` (which
   edits multiple files at once) is not documented. The tool takes an array of
   `{file_path, old_string, new_string}` objects — it's unclear whether the `if`
   pattern matches the first file, any file, or the tool name only.

3. **Pipe-in-if validity:** Whether `|` inside an `if` value (e.g.,
   `"Bash(git *)|Bash(npm *)"`) is valid syntax was not conclusively determined.
   The official docs advise using separate handlers.

4. **Maximum pattern length/complexity:** No documentation mentions limits on
   `if` pattern length or complexity.

5. **Case sensitivity:** No documentation states whether `if` pattern matching
   is case-sensitive. Given it uses the same system as matchers (which are regex
   and case-sensitive), it is likely case-sensitive, but unconfirmed.

6. **`if` on `PostToolUseFailure`:** Technically listed as a supported event,
   but no examples exist showing `if` on failure events. Whether `tool_input` is
   still available the same way is not shown.

---

## Serendipity

- **`matcher` vs `if` OR syntax asymmetry:** The `matcher` field supports pipe
  regex (`Edit|Write`) but `if` does not support the same OR pattern. This
  asymmetry is easy to miss and is a common source of misconfiguration.

- **Shell operator protection:** The permission rule system is aware of `&&`,
  `;`, and `|` operators in Bash commands. `Bash(safe-cmd *)` does NOT authorize
  `safe-cmd && malicious-cmd`. This is a critical security nuance when using
  `if` for security-relevant hooks.

- **Edit deny rules don't stop Bash:** `Edit(./.env)` deny rules block the Edit
  tool but do NOT prevent `cat .env` via Bash. This applies equally to `if`
  field patterns — they only filter the specific tool, not equivalent Bash
  commands.

- **v2.1.85 also added:** In the same release as `if` field support, Claude Code
  also added `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL`
  environment variables for MCP headers, and improved OAuth flow (RFC 9728).
  These are unrelated to hooks but context for the release.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** (core specification is from official docs; gaps
  are clearly labeled)
