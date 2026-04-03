# Findings: Claude Code Permission System — Complete Reference

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-25
**Sub-Question IDs:** SQ-001 through SQ-009

---

## Key Findings

### 1. Permission File Locations [CONFIDENCE: HIGH]

There are five distinct file locations where permissions can reside, each with a
different scope:

| Scope   | File Path                                                               | Git tracked?    | Who it affects                 |
| ------- | ----------------------------------------------------------------------- | --------------- | ------------------------------ |
| Managed | `C:\Program Files\ClaudeCode\managed-settings.json` (Windows)           | No              | All users, org-enforced        |
| Managed | `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS) | No              | All users, org-enforced        |
| Managed | `/etc/claude-code/managed-settings.json` (Linux/WSL)                    | No              | All users, org-enforced        |
| Managed | Windows registry: `HKLM\SOFTWARE\Policies\ClaudeCode`                   | No              | All users, org-enforced        |
| User    | `~/.claude/settings.json`                                               | No              | You, across all projects       |
| Project | `.claude/settings.json`                                                 | Yes (shared)    | All collaborators on this repo |
| Local   | `.claude/settings.local.json`                                           | No (gitignored) | You, in this repository only   |

**Additional file: `~/.claude.json`** This is NOT a settings file in the same
sense. It stores OAuth session state, MCP server configurations (for user and
local scopes), per-project `allowedTools` state (legacy), preferences like
theme/editor mode, and various caches. Permissions set via `/permissions` UI and
"don't ask again" approvals are stored here under a `projects` key indexed by
project path. This is distinct from `~/.claude/settings.json`.

**Note on legacy format:** Older versions stored per-project `allowedTools`
arrays in `~/.claude.json` under `projects["<absolute-path>"].allowedTools`.
This is considered legacy but may still be read.

Sources: [1][2][3]

---

### 2. Precedence — Which File Wins [CONFIDENCE: HIGH]

Precedence order from highest to lowest:

1. **Managed settings** — cannot be overridden by anything, including CLI flags
2. **Command-line arguments** (`--allowedTools`, `--disallowedTools`,
   `--permission-mode`) — temporary session overrides
3. **Local project settings** (`.claude/settings.local.json`) — overrides
   project + user
4. **Shared project settings** (`.claude/settings.json`) — overrides user
5. **User settings** (`~/.claude/settings.json`) — lowest, fallback

**Merge vs. Override:** For `allow`, `deny`, and `ask` arrays, the behavior is
**merge by deny-wins**. Arrays are NOT simply replaced. Instead, a deny rule at
ANY level takes final precedence over an allow rule at any other level. The
first matching rule in the evaluation order `deny → ask → allow` wins, where
deny rules are checked globally before ask and allow, regardless of which file
they came from. A project-level deny overrides a user-level allow.

**Concrete example:** If `~/.claude/settings.json` has
`allow: ["Bash(git push *)"]` but `.claude/settings.json` has
`deny: ["Bash(git push *)"]`, the deny wins.

Sources: [1][2][4]

---

### 3. Persistence of Runtime Approvals [CONFIDENCE: MEDIUM]

When Claude prompts for permission and you approve:

**"Yes" (one-time):** Permission granted for this specific invocation only.
Nothing persisted.

**"Yes, don't ask again" (Bash commands):**

- Saves to `.claude/settings.local.json` in the current project directory
- Saves **per-subcommand** not per compound command. Approving
  `git status && npm test` creates separate rules for `git status` and
  `npm test`
- For compound commands, up to 5 rules may be saved
- **Known bugs:** Multiple open issues confirm this persistence is unreliable in
  certain scenarios:
  - Issue #28905: When `.claude/settings.local.json` doesn't yet exist, the
    permission is lost after the turn
  - Issue #29400: "don't ask again" keeps re-prompting despite rule being saved
  - Issue #12796: Windows pattern-matching failures on saved rules
  - Multiline/heredoc commands save verbatim but never match again (issue
    #25441)

**"Yes, don't ask again" (file edits):**

- The official docs table states this persists only "until session end" — NOT
  permanently
- File edit approvals are session-scoped by design

**File edit permission persistence table (from official docs):**

| Tool type         | "Yes, don't ask again" scope                |
| ----------------- | ------------------------------------------- |
| Bash commands     | Permanently per project directory + command |
| File modification | Until session end only                      |
| Read-only         | N/A (no approval needed)                    |

**"Yes, and always allow access to [directory] from this project":**

- Saves the path under `additionalDirectories` in `.claude/settings.local.json`
- Bug #7472 (closed Sept 2025): was previously not persisting; confirmed fixed

Sources: [1][5][6][7][8]

---

### 4. Permission Rule Syntax — Exact Format [CONFIDENCE: HIGH]

Rules follow the format: `ToolName` or `ToolName(specifier)`

**Match all uses of a tool:**

```
Bash        → all Bash commands (equivalent to Bash(*))
Read        → all file reads
Edit        → all file edits
WebFetch    → all web fetches
```

**Bash wildcards:**

```json
"Bash(npm run *)"        // commands starting with "npm run "
"Bash(git commit *)"     // git commit with any args
"Bash(git * main)"       // git <anything> main
"Bash(* --version)"      // any command with --version
"Bash(* --help *)"       // any command containing --help
"Bash(npm run build)"    // exact command only
```

**Word-boundary rule:** `Bash(ls *)` matches `ls -la` but NOT `lsof`. The space
before `*` enforces a word boundary. `Bash(ls*)` without the space matches both.

**Shell operator awareness:** `Bash(safe-cmd *)` does NOT grant permission to
run `safe-cmd && other-cmd`. Claude Code parses shell operators.

**Deprecated syntax:** The `:*` suffix (e.g., `Bash(git log:*)`) is equivalent
to ` *` but is deprecated. Prefer the space form.

**Read and Edit rules (gitignore-style paths):**

| Pattern            | Meaning                       | Example                          |
| ------------------ | ----------------------------- | -------------------------------- |
| `//path`           | Absolute from filesystem root | `Read(//Users/alice/secrets/**)` |
| `~/path`           | From home directory           | `Read(~/.zshrc)`                 |
| `/path`            | Relative to project root      | `Edit(/src/**/*.ts)`             |
| `path` or `./path` | Relative to current directory | `Read(*.env)`                    |

**CAUTION:** `/Users/alice/file` is NOT absolute — it is project-root-relative.
Use `//Users/alice/file` for absolute.

**Windows note:** Paths are normalized to POSIX form. `C:\Users\alice` becomes
`/c/Users/alice`. Use `//c/**/.env` for absolute Windows paths. Cross-drive:
`//**/.env`.

**In gitignore patterns:** `*` matches within one directory; `**` matches
recursively.

**WebFetch domain rules:**

```
WebFetch(domain:example.com)    // fetches to example.com only
WebFetch(domain:*.example.com)  // subdomains
```

**MCP tool rules:**

```
mcp__puppeteer                  // all tools from the puppeteer server
mcp__puppeteer__*               // same (wildcard form)
mcp__puppeteer__puppeteer_navigate  // specific tool only
```

**Agent (subagent) rules:**

```
Agent(Explore)                  // the Explore subagent
Agent(Plan)                     // the Plan subagent
Agent(my-custom-agent)          // any named custom subagent
```

Sources: [1][2][9]

---

### 5. Complete Tool Names for Permission Rules [CONFIDENCE: HIGH]

From the official Tools Reference page
(code.claude.com/docs/en/tools-reference), these are ALL built-in tool names,
with the exact strings used in permission rules:

| Tool Name              | Description                                      | Permission Required |
| ---------------------- | ------------------------------------------------ | ------------------- |
| `Agent`                | Spawns a subagent                                | No                  |
| `AskUserQuestion`      | Asks multiple-choice questions                   | No                  |
| `Bash`                 | Executes shell commands                          | **Yes**             |
| `CronCreate`           | Schedules a recurring/one-shot prompt            | No                  |
| `CronDelete`           | Cancels a scheduled task                         | No                  |
| `CronList`             | Lists scheduled tasks                            | No                  |
| `Edit`                 | Makes targeted edits to specific files           | **Yes**             |
| `EnterPlanMode`        | Switches to plan mode                            | No                  |
| `EnterWorktree`        | Creates/switches to git worktree                 | No                  |
| `ExitPlanMode`         | Presents plan and exits plan mode                | **Yes**             |
| `ExitWorktree`         | Exits worktree session                           | No                  |
| `Glob`                 | Finds files by pattern                           | No                  |
| `Grep`                 | Searches file contents                           | No                  |
| `ListMcpResourcesTool` | Lists resources from MCP servers                 | No                  |
| `LSP`                  | Code intelligence (go-to-def, refs, types)       | No                  |
| `NotebookEdit`         | Modifies Jupyter notebook cells                  | **Yes**             |
| `Read`                 | Reads file contents                              | No                  |
| `ReadMcpResourceTool`  | Reads a specific MCP resource by URI             | No                  |
| `Skill`                | Executes a skill in the main conversation        | **Yes**             |
| `TaskCreate`           | Creates a task in the task list                  | No                  |
| `TaskGet`              | Retrieves details for a specific task            | No                  |
| `TaskList`             | Lists all tasks                                  | No                  |
| `TaskOutput`           | Retrieves output from a background task          | No                  |
| `TaskStop`             | Kills a running background task                  | No                  |
| `TaskUpdate`           | Updates task status/details                      | No                  |
| `TodoWrite`            | Manages session task checklist (non-interactive) | No                  |
| `ToolSearch`           | Searches for/loads deferred MCP tools            | No                  |
| `WebFetch`             | Fetches content from a URL                       | **Yes**             |
| `WebSearch`            | Performs web searches                            | **Yes**             |
| `Write`                | Creates or overwrites files                      | **Yes**             |

**Notes on older/alternate names seen in community sources:**

- `NotebookRead` — referenced in older guides/gists; may be a pre-rename of
  `Read` for notebooks or a legacy name
- `MultiEdit` — referenced in older guides and `~/.claude.json` allowedTools
  arrays; may have been merged into `Edit`
- `LS` — referenced in older system prompt gist; may be internal or have been
  removed
- `TodoRead` — referenced in older gist alongside `TodoWrite`

The official tools reference (current) does not list NotebookRead, MultiEdit,
LS, or TodoRead as separate tools. The current list above is authoritative.

**`Edit` applies to all file-editing tools:** The docs state "`Edit` rules apply
to all built-in tools that edit files." This means `Edit` in deny/allow covers
`Write`, `Edit`, and `NotebookEdit` collectively for path-based rules.

**`Read` is best-effort for path rules:** "Claude makes a best-effort attempt to
apply `Read` rules to all built-in tools that read files like Grep and Glob."

**Critical caveat:** Read/Edit deny rules apply to Claude's built-in tools only,
NOT to Bash subprocesses. A `Read(./.env)` deny rule blocks the `Read` tool but
does NOT prevent `cat .env` in Bash.

Sources: [1][10][11]

---

### 6. MCP Tool Permissions — Exact Syntax [CONFIDENCE: HIGH]

MCP tools use a double-underscore naming convention based on the server name
configured in Claude Code:

```
mcp__<server-name>                      // allows ALL tools from this server
mcp__<server-name>__*                   // same, wildcard form (equivalent)
mcp__<server-name>__<tool-name>         // specific tool only
```

**Examples:**

```json
{
  "permissions": {
    "allow": [
      "mcp__sonarcloud",
      "mcp__context7__resolve-library-id",
      "mcp__puppeteer__puppeteer_navigate"
    ],
    "deny": ["mcp__filesystem"]
  }
}
```

**Server name = the name you configured in Claude Code**, not necessarily the
package name. If you named your SonarCloud server "sonarcloud" in your MCP
config, the permission rule is `mcp__sonarcloud`.

**Open bug:** Issue #28595 reports that `permissions.deny` rules do not apply to
MCP tools — MCP tool calls may bypass deny rules. This is unresolved as of the
research date.

Sources: [1][12]

---

### 7. Permission Modes — Special Modes [CONFIDENCE: HIGH]

Set via `"permissions": { "defaultMode": "<mode>" }` in any settings file, or
via `--permission-mode <mode>` at startup, or via `Shift+Tab` cycle during a
session.

| Mode Key            | What Claude can do without asking          | Notes                                                |
| ------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `default`           | Read files only                            | Standard; prompts for edits and Bash                 |
| `acceptEdits`       | Read + edit files without asking           | Still prompts for Bash commands                      |
| `plan`              | Read files only (same as default)          | Blocks all writes; Claude produces a plan file       |
| `auto`              | All actions (classifier evaluates each)    | Team plan required; Sonnet/Opus 4.6 only             |
| `dontAsk`           | Only pre-approved tools (from allow rules) | All other tools auto-denied; fully non-interactive   |
| `bypassPermissions` | Everything, no checks                      | Use only in containers/VMs; `.git` etc. still prompt |

**How modes interact with allow/deny rules:**

- `default`, `acceptEdits`, `plan`, `dontAsk`: allow/deny/ask rules are
  evaluated normally
- `bypassPermissions`: skips ALL permission rules. Allow/deny lists are ignored.
  Exception: writes to `.git`, `.claude`, `.vscode`, `.idea` still prompt (but
  not `.claude/commands`, `.claude/agents`, `.claude/skills`)
- `auto` mode: allow/deny rules are evaluated FIRST (short-circuit), then the
  classifier handles everything else. Note: in auto mode, blanket `Bash(*)`
  allow rules are dropped on mode entry and restored on exit

**Prevent a mode from being used (managed settings):**

```json
{ "permissions": { "disableBypassPermissionsMode": "disable" } }
{ "disableAutoMode": "disable" }
```

**`Shift+Tab` cycle order:** `default → acceptEdits → plan → auto` (auto only if
`--enable-auto-mode` was passed; `bypassPermissions` appears in cycle only if
session was started with `--permission-mode bypassPermissions` or
`--dangerously-skip-permissions`)

**`dontAsk` is never in the `Shift+Tab` cycle.**

**Setting `defaultMode` location:** Can be in any of the 4 settings files. More
specific scope wins.

Sources: [1][3][13]

---

### 8. Session-Level vs. Permanent Permissions [CONFIDENCE: MEDIUM-HIGH]

| Mechanism                                            | Scope                                    | Persistence                                                   |
| ---------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `--allowedTools Tool1 Tool2` CLI flag                | Session only                             | Lost on exit                                                  |
| `--permission-mode <mode>` CLI flag                  | Session only                             | Lost on exit                                                  |
| "Yes" (one-time at runtime prompt)                   | Current invocation only                  | Not persisted                                                 |
| "Yes, don't ask again" (Bash)                        | Per project directory                    | Saved to `.claude/settings.local.json` (buggy, see Finding 3) |
| "Yes, don't ask again" (file edits)                  | Session only                             | NOT saved to disk                                             |
| `permissions.allow` in `.claude/settings.local.json` | Per project, per user                    | Permanent until manually removed                              |
| `permissions.allow` in `.claude/settings.json`       | Per project, all users                   | Permanent, git-tracked                                        |
| `permissions.allow` in `~/.claude/settings.json`     | All projects, this user                  | Permanent until manually removed                              |
| `permissions.allow` in managed settings              | Org-wide                                 | Permanent until admin changes                                 |
| `/permissions` UI interactive edits                  | Writes to local project or user settings | Permanent                                                     |

**Runtime approval storage detail:** "Don't ask again" for Bash commands writes
to `.claude/settings.local.json`. The issue #11073 feature request (closed as
inactive Jan 2026) proposed making the target scope cycleable via Tab —
currently it always saves to local project scope. To save globally, you must
manually edit `~/.claude/settings.json`.

**Important: file edit approvals are explicitly session-only** per the official
permission table — they are NOT persisted even when you click "don't ask again."
The `acceptEdits` mode is the persistent equivalent.

Sources: [1][5][6][14]

---

### 9. Deny List Behavior — Evaluation Order [CONFIDENCE: HIGH]

**Order:** `deny → ask → allow`. First matching rule wins. **Deny always wins.**

This is global across all settings levels. A deny at user level overrides an
allow at project level. A deny at project level overrides an allow at user
level. There is no "local allow overrides global deny" escape hatch in the
standard system.

**Exception:** Managed settings can set `allowManagedPermissionRulesOnly: true`
to prevent user/project settings from defining any rules at all.

**Hooks can override deny:** A `PreToolUse` hook that exits with code 0 (allow)
does NOT override a deny rule — deny rules are still evaluated. However, a hook
that exits with code 2 (block) DOES take precedence over allow rules. So: hooks
can ADD blocks beyond deny rules, but cannot REMOVE deny rule blocks.

**Critical known bug:** Issue #27040 (open), #8961, #22055, #31925 report that
deny rules are inconsistently enforced. File-based deny rules (Read/Edit path
patterns) are reportedly bypassed in some scenarios. The workaround is to use
PreToolUse hooks for reliable enforcement.

**Practical security implication:** `Read(./.env)` in deny stops the `Read`
tool, but Bash can still `cat .env`. For OS-level enforcement, the sandbox must
be enabled separately.

Sources: [1][12][15]

---

## Sources

| #   | URL                                                            | Title                                                    | Type                         | Trust  | CRAAP (avg) | Date                |
| --- | -------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------- | ------ | ----------- | ------------------- |
| 1   | https://code.claude.com/docs/en/permissions                    | Configure permissions — Claude Code Docs                 | Official docs                | HIGH   | 4.8         | Current             |
| 2   | https://code.claude.com/docs/en/settings                       | Claude Code settings — Official Docs                     | Official docs                | HIGH   | 4.8         | Current             |
| 3   | https://code.claude.com/docs/en/permission-modes               | Choose a permission mode — Official Docs                 | Official docs                | HIGH   | 4.8         | Current             |
| 4   | https://code.claude.com/docs/en/tools-reference                | Tools reference — Official Docs                          | Official docs                | HIGH   | 4.8         | Current             |
| 5   | https://github.com/anthropics/claude-code/issues/7472          | "Always allow" not persisted — GitHub Issue              | Primary source               | HIGH   | 4.5         | Sept 2025           |
| 6   | https://github.com/anthropics/claude-code/issues/28905         | "Don't ask again" not persisting — GitHub Issue          | Primary source               | HIGH   | 4.5         | 2025                |
| 7   | https://github.com/anthropics/claude-code/issues/29400         | "Don't ask again" keeps re-prompting — GitHub Issue      | Primary source               | HIGH   | 4.3         | 2025                |
| 8   | https://github.com/anthropics/claude-code/issues/11073         | Cycleable scope for don't ask again — GitHub Issue       | Primary source               | HIGH   | 4.3         | 2025                |
| 9   | https://github.com/anthropics/claude-code/issues/3428          | Bash:\* wildcard not working — GitHub Issue              | Primary source               | HIGH   | 4.3         | 2024/2025           |
| 10  | https://gist.github.com/wong2/e0f34aac66caf890a332f7b6f9e2ba8f | Claude Code system prompt tools list — Gist              | Community/reverse-engineered | MEDIUM | 3.2         | 2024 (may be stale) |
| 11  | https://github.com/anthropics/claude-code/issues/889           | Allow specifying allowedTools globally — GitHub Issue    | Primary source               | HIGH   | 4.3         | 2024/2025           |
| 12  | https://github.com/anthropics/claude-code/issues/27040         | Deny permissions in settings.json ignored — GitHub Issue | Primary source               | HIGH   | 4.5         | 2025                |
| 13  | https://www.eesel.ai/blog/settings-json-claude-code            | Complete settings.json guide 2026 — Blog                 | Community blog               | MEDIUM | 3.5         | 2026                |
| 14  | https://www.eesel.ai/blog/claude-code-permissions              | Complete guide to Claude Code permissions — Blog         | Community blog               | MEDIUM | 3.5         | 2026                |
| 15  | https://www.petefreitag.com/blog/claude-code-permissions/      | Understanding Claude Code Permissions — Blog             | Community blog               | MEDIUM | 3.4         | 2025                |

---

## Contradictions

**1. File edit "don't ask again" — session vs. permanent:** The official docs
table says file modifications persist "until session end." Multiple community
sources and the GitHub issue feature request (#11073) discuss "don't ask again"
as saving to settings.local.json. The resolution: the official docs distinguish
by tool TYPE — Bash rules are permanent, file edit rules are session-only. This
is not a contradiction but was poorly understood across community sources.

**2. ~/.claude.json vs. ~/.claude/settings.json:** Community sources frequently
conflate these two files. `~/.claude.json` is the legacy/state file (MCP
configs, per-project allowedTools, OAuth). `~/.claude/settings.json` is the
modern permissions/settings file. The official settings doc makes this
distinction explicit at line 109: "Other configuration is stored in
`~/.claude.json`. This file contains...per-project state (allowed tools, trust
settings)..." — confirming that runtime "don't ask again" approvals are stored
in `~/.claude.json` under a projects key, while declarative permission rules go
in `~/.claude/settings.json`.

**3. Deny rule reliability:** Official docs present deny rules as definitive
("deny always takes precedence"). Multiple open GitHub issues (#27040, #8961,
#22055, #28595, #31925) document that deny rules are bypassed in practice. This
is an unresolved product bug, not a documentation issue. Trust the bugs, not the
docs, for security-critical enforcement. Use PreToolUse hooks for reliable
blocking.

**4. "Edit" covers all file-editing vs. separate Write/Edit tools:** The docs
say `Edit` rules apply to "all built-in tools that edit files" for path-based
filtering, but the tools table lists `Edit`, `Write`, and `NotebookEdit` as
separate tool names that each require permission separately. For path-based
rules, use `Edit(path)`. For tool-level allow/deny (no path specifier), you need
separate entries: `Edit`, `Write`, `NotebookEdit`.

---

## Gaps

1. **Exact structure of `~/.claude.json` runtime approvals:** The key under
   which "don't ask again" Bash approvals are actually stored in
   `~/.claude.json` (vs. settings.local.json) could not be fully confirmed from
   documentation. The GitHub issue #28905 mentions
   `~/.claude/projects/<path>/settings.json` as the expected destination, but
   community sources say `~/.claude.json` under a `projects` key. These may be
   two different storage mechanisms in different versions.

2. **`NotebookRead` status:** The current tools reference lists `NotebookEdit`
   but no `NotebookRead`. Older gists and community sources list it. Whether it
   exists as a permission rule target in current versions is unclear.

3. **`MultiEdit` status:** Older sources list it; current tools reference does
   not. May have been merged into `Edit`. Unclear whether it is still a valid
   permission rule target.

4. **Session-level "don't ask again" scope cycling:** Issue #11073 proposed
   Tab-cycling the destination scope (local/user/project). It was closed
   inactive Jan 2026 without being implemented. Current behavior is hardcoded to
   local project scope.

5. **`auto` mode availability:** Currently requires Team plan + Sonnet/Opus 4.6.
   API/Enterprise rollout was described as "shortly" in docs but exact GA date
   was not found.

6. **`dontAsk` mode + `ask` rules interaction:** Docs say "if a tool has an
   explicit `ask` rule, the action is also denied rather than prompting" in
   dontAsk mode. The exact interaction with deny rules vs. ask rules in this
   mode was not confirmed with a second source.

---

## Serendipity

**1. Auto mode drops blanket Bash allows:** On entering `auto` mode, Claude Code
automatically drops any allow rule that grants arbitrary code execution (e.g.,
`Bash(*)`, `Bash(python*)`, `Bash(node*)`, package-manager run commands, and any
`Agent` allow rule). These are restored when you leave auto mode. This is
undocumented in most guides and could cause surprising behavior if someone
switches to auto mode mid-session expecting their broad allow rules to carry
through.

**2. Compound command "don't ask again" saves up to 5 rules:** Approving
`git status && npm test` creates separate rules for each subcommand, up to 5
rules for a single compound command approval. This means one complex approval
can result in multiple persisted rules.

**3. PreToolUse hooks are MORE reliable than deny rules for security:** Given
the documented deny rule bypass bugs, the community workaround of using
PreToolUse hooks provides more reliable enforcement than `permissions.deny`. For
a solo workflow managing sensitive files, hooks are the recommended security
mechanism until the deny rule bugs are resolved.

**4. Windows path normalization is non-obvious:** On Windows, permission path
rules require POSIX form. `C:\Users\jbell\secrets` must be written as
`//c/Users/jbell/secrets` in permission rules. Cross-drive matching uses
`//**/.env`. This is a gotcha for Windows-primary developers.

**5. `allowManagedPermissionRulesOnly` lockdown:** Managed settings can set this
to `true` to prevent ALL user and project permission rules from having any
effect — only managed settings rules apply. This is relevant for any
organizational deployment where centralized control is needed.

**6. `autoMode` classifier does NOT read shared project settings:** The
`autoMode` config block is deliberately excluded from `.claude/settings.json`
(shared project settings) to prevent a checked-in repo from injecting its own
classifier allow rules. It is only read from user settings,
`.claude/settings.local.json`, and managed settings.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM-HIGH claims: 1
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — Primary source is official Anthropic
  documentation fetched directly. Key nuances cross-referenced against GitHub
  issues. Known bugs documented with issue numbers.
