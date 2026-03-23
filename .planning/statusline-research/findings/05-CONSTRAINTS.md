# 05 - Claude Code Statusline: Technical Constraints

**Research Date:** 2026-03-20 **Sources:** Official docs (code.claude.com),
GitHub issues, community implementations, codebase analysis

---

## 1. Stdin JSON Contract

The statusline command receives a JSON object on stdin every render cycle. The
full schema is documented at https://code.claude.com/docs/en/statusline.

### Guaranteed Fields (always present)

| Field                                | Type   | Description                                      |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `cwd`                                | string | Current working directory                        |
| `session_id`                         | string | Unique session identifier                        |
| `transcript_path`                    | string | Path to conversation transcript file             |
| `model.id`                           | string | Model identifier (e.g. `claude-opus-4-6`)        |
| `model.display_name`                 | string | Human-friendly name (e.g. `Opus`)                |
| `workspace.current_dir`              | string | Current working directory (preferred over `cwd`) |
| `workspace.project_dir`              | string | Directory where Claude Code was launched         |
| `version`                            | string | Claude Code version (e.g. `1.0.80`)              |
| `output_style.name`                  | string | Current output style name                        |
| `cost.total_cost_usd`                | number | Total session cost in USD                        |
| `cost.total_duration_ms`             | number | Wall-clock time since session start (ms)         |
| `cost.total_api_duration_ms`         | number | Time waiting for API responses (ms)              |
| `cost.total_lines_added`             | number | Lines of code added this session                 |
| `cost.total_lines_removed`           | number | Lines of code removed this session               |
| `context_window.total_input_tokens`  | number | Cumulative input tokens across session           |
| `context_window.total_output_tokens` | number | Cumulative output tokens across session          |
| `context_window.context_window_size` | number | Max context size (200000 or 1000000)             |
| `exceeds_200k_tokens`                | bool   | Whether last response exceeded 200k tokens       |

### Nullable Fields (present but may be `null`)

| Field                                                      | Type         | When null                              |
| ---------------------------------------------------------- | ------------ | -------------------------------------- |
| `context_window.used_percentage`                           | number\|null | Early in session before first API call |
| `context_window.remaining_percentage`                      | number\|null | Early in session before first API call |
| `context_window.current_usage`                             | object\|null | Before first API call in session       |
| `context_window.current_usage.input_tokens`                | number       | Current context input tokens           |
| `context_window.current_usage.output_tokens`               | number       | Output tokens generated                |
| `context_window.current_usage.cache_creation_input_tokens` | number       | Tokens written to cache                |
| `context_window.current_usage.cache_read_input_tokens`     | number       | Tokens read from cache                 |

### Conditionally Absent Fields (may not exist in JSON at all)

| Field                                   | Type   | When absent                                       |
| --------------------------------------- | ------ | ------------------------------------------------- |
| `vim.mode`                              | string | Only when vim mode is enabled (`NORMAL`/`INSERT`) |
| `agent.name`                            | string | Only with `--agent` flag or agent settings        |
| `worktree.name`                         | string | Only during `--worktree` sessions                 |
| `worktree.path`                         | string | Only during `--worktree` sessions                 |
| `worktree.branch`                       | string | Absent for hook-based worktrees                   |
| `worktree.original_cwd`                 | string | Only during `--worktree` sessions                 |
| `worktree.original_branch`              | string | Absent for hook-based worktrees                   |
| `rate_limits.five_hour.used_percentage` | number | Only for Claude.ai Pro/Max subscribers            |
| `rate_limits.five_hour.resets_at`       | number | Unix epoch seconds; subscriber-only               |
| `rate_limits.seven_day.used_percentage` | number | Only for Claude.ai Pro/Max subscribers            |
| `rate_limits.seven_day.resets_at`       | number | Unix epoch seconds; subscriber-only               |

### Key Notes on Input Data

- `used_percentage` is calculated from **input tokens only**:
  `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`. It
  does NOT include `output_tokens`.
- `total_input_tokens` / `total_output_tokens` are **cumulative** across the
  session and may exceed context_window_size. Do not use for percentage calcs.
- `rate_limits` only appears after the first API response, and each window
  (`five_hour`, `seven_day`) may be independently absent.

---

## 2. Stdout Contract

### What Claude Code reads

- Your script's **stdout** is displayed as the status line.
- **Multiple lines are supported**: each `echo`/`print`/`console.log` produces a
  separate row in the status area.
- **No documented max length**, but output is truncated or wraps awkwardly on
  narrow terminals. Keep output short.
- System notifications (MCP errors, auto-updates, token warnings) display on the
  **right side** of the same row. Verbose mode adds a token counter there too.
  These can truncate your output on narrow terminals.

### Supported formatting

- **ANSI escape codes**: Colors (`\033[32m` green, `\033[33m` yellow, etc.),
  bold (`\033[1m`), dim (`\033[2m`), blink (`\033[5m`), reset (`\033[0m`).
  Terminal must support them.
- **OSC 8 hyperlinks**: `\e]8;;URL\a TEXT \e]8;;\a` makes text clickable
  (Cmd+click macOS, Ctrl+click Windows/Linux). Requires iTerm2, Kitty, or
  WezTerm. Terminal.app does NOT support this. SSH/tmux may strip OSC sequences.
- **Unicode**: Block chars (`\u2588`, `\u2591`), box drawing (`\u2502`), emojis
  all work, but require compatible fonts. Nerd Fonts needed for powerline
  symbols.

### Stderr

- Stderr is **ignored** for display purposes.
- With `claude --debug`, the exit code and stderr from the **first** statusline
  invocation in a session are logged.
- Scripts that exit with non-zero codes or produce no output cause the status
  line to **go blank** (shows nothing, does not crash Claude Code).

---

## 3. Rendering Frequency and Trigger Model

### When the statusline renders

The script runs after:

1. Each new **assistant message**
2. When the **permission mode** changes
3. When **vim mode** toggles

### Debounce / Throttle

- Updates are **debounced at 300ms**. Rapid changes batch together and the
  script runs once things settle.
- If a new update triggers while the script is **still running**, the in-flight
  execution is **cancelled** (the process is aborted).

### Visibility

- The status line **temporarily hides** during: autocomplete suggestions, the
  help menu, and permission prompts.
- If you edit the script file, changes **do not appear** until the next
  interaction with Claude Code triggers an update.

---

## 4. Performance Budget

### Hard constraints

- The 300ms debounce means your script can theoretically take up to ~300ms
  before the next render would cancel it. But slow scripts cause **stale
  output** visible to the user.
- Community benchmarks: **sub-50ms** is considered "lightning-fast" and the
  target. Scripts taking 200-500ms are considered problematic.

### What's expensive

- **Shell-out commands** (git, npm, etc.) are the main cost. Each `execFileSync`
  or `subprocess.check_output` spawns a child process.
- `git status` and `git diff` can be **very slow** in large repositories.
- **jq** invocations in bash scripts add overhead (multiple `echo | jq` pipes
  are slower than a single parsed read in Node/Python).

### Caching strategy (official recommendation)

- Cache expensive operations to a **temp file** with a TTL (e.g., 5 seconds).
- Use a **stable, fixed filename** for the cache file (e.g.,
  `/tmp/statusline-git-cache`). Do NOT use `$$`, `os.getpid()`, or `process.pid`
  -- each invocation is a **new process** so PIDs change every time.
- Check file age before re-running expensive commands.

---

## 5. Process Model

### New process every render

- **Each statusline render spawns a brand new process.** There is no persistent
  process or long-running daemon.
- JSON is piped to stdin; the process reads it, writes to stdout, and exits.
- Process-based identifiers (`$$`, PID) are **different every invocation**.

### Shell environment

- On all platforms, Claude Code runs statusline commands through the shell.
- On Windows, commands run through **Git Bash** (not PowerShell by default). You
  can invoke PowerShell explicitly:
  `powershell -NoProfile -File C:/Users/username/.claude/statusline.ps1`
- The `~` home directory expansion works in the `command` field.

### Our setup

- The current codebase uses
  `bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js`
  which adds ~100-200ms overhead for fnm initialization on every render. This is
  a significant cost for a statusline.

---

## 6. Shell Access and File I/O

### Shell access

- Yes, the script can shell out to **any command** (git, npm, curl, etc.).
- Cost: each subprocess spawn adds 50-200ms depending on the command and OS.
- On Windows, `execFileSync` with `windowsHide: true` prevents console window
  flashes.

### File access

- Yes, scripts can read **any file** the user has access to.
- File I/O is fast (sub-1ms for small files) but must be wrapped in try/catch
  for robustness.
- The codebase's statusline reads todo files from `~/.claude/todos/` to find the
  current in-progress task.

### Network access

- Technically possible but **strongly discouraged**. Network calls would blow
  the latency budget. Use file-based caching if external data is needed.

---

## 7. Windows-Specific Constraints

### Current status (as of 2026-03-20)

**The Windows statusline is currently broken in recent versions.** Key issues:

| Issue                                                                                                     | Version | Status                             |
| --------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------- |
| [#31670](https://github.com/anthropics/claude-code/issues/31670): Command not executed at all             | v2.1.71 | **OPEN** - regression from v2.1.45 |
| [#30725](https://github.com/anthropics/claude-code/issues/30725): PowerShell statusline stopped rendering | v2.1.68 | Reported                           |
| [#14125](https://github.com/anthropics/claude-code/issues/14125): Not rendering in Windows Terminal       | v2.0.70 | **RESOLVED** in Jan 2026           |
| [#12870](https://github.com/anthropics/claude-code/issues/12870): Output truncated                        | -       | Reported                           |
| [#14716](https://github.com/anthropics/claude-code/issues/14716): Scroll margins not reset                | -       | Reported                           |

### ANSI escape code support

- Windows Terminal supports ANSI codes natively.
- ConPTY (Windows Terminal's pseudoterminal) maintains ANSI state including
  scroll margins, which can cause rendering artifacts if not properly reset.
- The legacy CMD console often resets ANSI state, which can actually be less
  buggy for statuslines.

### UTF-8 and encoding

- Windows requires explicit UTF-8 code page configuration for piped output.
  Without it, non-ASCII characters (powerline symbols, emojis, block chars)
  display as mojibake.
- The ccstatusline community tool (v2.0.28) explicitly sets the Windows UTF-8
  code page for piped rendering.

### Path handling

- Git Bash uses forward slashes (`/c/Users/...`) while Windows APIs use
  backslashes (`C:\Users\...`). The statusline gets **Windows-style paths** in
  `workspace.current_dir`.
- Mixed path separators are common. Use `path.basename()` or equivalent rather
  than string splitting.

### Shell execution

- Claude Code runs statusline commands through **Git Bash** on Windows.
- PowerShell can be invoked explicitly but has had reliability issues across
  versions.
- `windowsHide: true` in `execFileSync` options prevents console window flashes
  when shelling out to git.

### Known workaround for broken versions

- None confirmed working as of v2.1.71. The feature is reported as "completely
  non-functional" on Windows in the latest version.

---

## 8. Concurrent Access

### Multiple Claude Code instances

- Each instance runs its **own statusline process** independently.
- The `session_id` field in stdin JSON is unique per session, allowing scripts
  to differentiate.

### Known concurrency bugs

- **model.id reflects global state**
  ([#27144](https://github.com/anthropics/claude-code/issues/27144)): When
  switching models via `/model` in one session, ALL other sessions' statuslines
  show the new model. Marked as resolved (Feb 2026) but reveals that some state
  is shared globally, not per-session.
- **Cache file collisions**: If using file-based caching (e.g.,
  `/tmp/statusline-git-cache`), multiple sessions writing the same file create
  race conditions. Use `session_id` in the cache filename to isolate.
- **OAuth token race condition**
  ([#25609](https://github.com/anthropics/claude-code/issues/25609)): Multiple
  sessions share `~/.claude/.credentials.json` with no file locking. Not
  directly a statusline issue but affects the environment.

---

## 9. Error Handling

### What happens when the hook fails

| Scenario                          | Behavior                                       |
| --------------------------------- | ---------------------------------------------- |
| Script exits non-zero             | Status line goes **blank** (no crash)          |
| Script produces no output         | Status line goes **blank**                     |
| Script hangs / takes too long     | Blocks updates until cancelled by next render  |
| Script writes to stderr only      | Ignored (blank status line)                    |
| JSON parse error in script        | Silent fail if caught; blank if uncaught crash |
| Script not found / not executable | Status line blank; `chmod +x` is the fix       |
| Trust not accepted                | Shows `statusline skipped - restart to fix`    |
| `disableAllHooks: true`           | Status line is also disabled                   |

### Debugging

- `claude --debug` logs the exit code and stderr from the **first** statusline
  invocation in a session.
- Ask Claude to read your settings and execute the command directly to surface
  errors.
- Test scripts manually:
  `echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":25}}' | ./statusline.sh`

---

## 10. Configuration Options

```json
{
  "statusLine": {
    "type": "command",
    "command": "path/to/script.sh",
    "padding": 2
  }
}
```

| Field     | Type   | Default | Description                                                                           |
| --------- | ------ | ------- | ------------------------------------------------------------------------------------- |
| `type`    | string | -       | Must be `"command"`                                                                   |
| `command` | string | -       | Shell command or path to script. `~` expands to home dir.                             |
| `padding` | number | `0`     | Extra horizontal spacing (characters) added to content. Additive to built-in spacing. |

Can be placed in:

- `~/.claude/settings.json` (user-level)
- `.claude/settings.json` (project-level, our current setup)

### Trust requirement

The statusline command only runs if the user has **accepted the workspace trust
dialog** for the current directory. Same trust requirement as hooks.

---

## 11. Implications for Our Implementation

### Current setup analysis

Our statusline (`/.claude/hooks/global/statusline.js`) has these
characteristics:

- **Language**: Node.js (good -- native JSON parsing, no jq dependency)
- **Launch overhead**: `bash ensure-fnm.sh node statusline.js` adds fnm init on
  every render (~100-200ms). This is the single largest performance issue.
- **Git call**: `execFileSync("git", ["rev-parse", ...])` with 1000ms timeout.
  Reasonable but adds ~50ms per render.
- **Todo file scanning**: Reads filesystem for in-progress tasks. Fast for small
  dirs but could slow down with many todo files.
- **Sanitization**: Strips ANSI and control chars from dynamic values. Good
  security practice.
- **Error handling**: Silent catch on all errors. Correct -- never crash the
  statusline.

### Performance optimization opportunities

1. **Eliminate fnm overhead**: Use an absolute path to node instead of going
   through ensure-fnm.sh on every render.
2. **Cache git branch**: Branch rarely changes mid-session. Cache to file with
   5s TTL.
3. **Session-specific cache files**: Use session_id to avoid concurrent access
   collisions.

### Fields we use vs fields available

| Used                                  | Available but unused                 |
| ------------------------------------- | ------------------------------------ |
| `model.display_name`                  | `cost.total_cost_usd`                |
| `workspace.current_dir`               | `cost.total_duration_ms`             |
| `session_id`                          | `rate_limits.*`                      |
| `context_window.remaining_percentage` | `context_window.context_window_size` |
|                                       | `version`                            |
|                                       | `worktree.*`                         |
|                                       | `vim.mode`                           |
|                                       | `agent.name`                         |

---

## Sources

- [Official Claude Code Statusline Documentation](https://code.claude.com/docs/en/statusline)
- [ccstatusline - Community statusline tool](https://github.com/sirmalloc/ccstatusline)
- [#31670 - Statusline not executed on Windows v2.1.71](https://github.com/anthropics/claude-code/issues/31670)
- [#14125 - StatusLine not rendering in Windows Terminal](https://github.com/anthropics/claude-code/issues/14125)
- [#27144 - model.id reflects global state](https://github.com/anthropics/claude-code/issues/27144)
- [#30725 - PowerShell statusline stopped rendering](https://github.com/anthropics/claude-code/issues/30725)
- [#25609 - OAuth token race condition with concurrent sessions](https://github.com/anthropics/claude-code/issues/25609)
- [#12870 - Output truncated on Windows](https://github.com/anthropics/claude-code/issues/12870)
- [#14716 - Scroll margins not reset](https://github.com/anthropics/claude-code/issues/14716)
- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
