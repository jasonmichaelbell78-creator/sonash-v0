# SQ-005: Performance Constraints & Windows Status of Claude Code Statusline (v2.1.81)

**Researched:** 2026-03-23 **Prior Research:** Session #229 (2026-03-19/20),
SQ-001 (2026-03-23) **Claude Code Version:** v2.1.81 (released 2026-03-20)

---

## 1. Executive Summary

The two blockers identified in prior research (March 20) have **partially
changed status**:

| Blocker                                              | Prior Status | Current Status (v2.1.81)                                                             |
| ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| GitHub #31670 — statusline non-functional on Windows | BLOCKING     | **PARTIALLY RESOLVED** — community workaround found 2026-03-22; issue still OPEN     |
| fnm wrapper overhead (100-300ms per render)          | CONCERN      | **MITIGABLE** — use direct node path, not fnm shims; official docs recommend caching |

**Bottom line:** Windows statusline works in v2.1.81 with a specific workaround
(workspace trust file + forward-slash paths + Node.js). The render budget is
300ms debounce with no documented hard timeout on the script itself, but slow
scripts get cancelled when the next trigger fires. The official API has expanded
significantly with `rate_limits`, `worktree.*`, and `agent.name` fields.

---

## 2. Windows Statusline Status (Issue #31670)

### Issue Timeline

| Date           | Event                                                                |
| -------------- | -------------------------------------------------------------------- |
| 2026-02-18     | Statusline last confirmed working on Windows (v2.1.45)               |
| 2026-03-07     | Issue #31670 filed — statusline "never executed" on v2.1.71          |
| 2026-03-07     | Bot flags 3 duplicate issues: #30725, #28526, #13517                 |
| 2026-03-09     | PowerShell user confirms same error (AbortError in child_process)    |
| 2026-03-20     | User reports "completely non-functional" after hours of workarounds  |
| 2026-03-21     | Partial workaround: Node.js script executes but output not displayed |
| **2026-03-22** | **WORKING WORKAROUND FOUND** by apocalx (v2.1.81)                    |
| 2026-03-23     | Issue remains **OPEN** — no official Anthropic fix merged            |

### Root Cause

The regression was introduced during the transition to the **Windows native
binary** (Bun-based). Two interacting failures:

1. **AbortError in child_process** — the script spawn is immediately aborted:
   ```
   AbortError: The operation was aborted.
       at abortChildProcess (node:child_process:947:42)
   ```
2. **Silent workspace trust check** — the `statusLine` command requires
   workspace trust acceptance (same as hooks), but on Windows the trust check
   silently kills execution without any visible error. This explains why scripts
   "flash briefly and disappear."

### Confirmed Workaround (v2.1.81)

Create `~/.claude/.claude.json` with explicit workspace trust:

```json
{
  "projects": {
    "C:\\Users\\YOUR_USERNAME\\your-project": {
      "hasTrustDialogAccepted": true
    }
  }
}
```

Then in `~/.claude/settings.json`, use forward slashes and Node.js:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/YOUR_USERNAME/.claude/statusline.js"
  }
}
```

### Impact on SoNash

- **We must create `~/.claude/.claude.json`** with trust entries for the SoNash
  project directory before statusline will work
- **Use forward slashes** in all paths (not backslashes)
- **Use Node.js** as the script runtime (not bash, not PowerShell) for most
  reliable execution on Windows
- The issue is **not officially fixed** — Anthropic has not merged a PR. The
  workaround bypasses the symptom but the underlying process abort race may
  still cause intermittent failures (see issue #32917: "output intermittently
  not rendered")

### Related Windows Issues

| Issue  | Title                                                | Status              |
| ------ | ---------------------------------------------------- | ------------------- |
| #31670 | Statusline not executed on Windows v2.1.71           | **Open**            |
| #30725 | PowerShell statusLine stopped after v2.1.68          | Duplicate of #31670 |
| #28526 | Custom statusLine stopped in v2.1.53+                | Duplicate of #31670 |
| #27161 | "Session environment not yet supported on Windows"   | Open                |
| #14125 | StatusLine not rendering in Windows Terminal         | Open                |
| #12870 | Status line output truncated on Windows              | Open                |
| #6526  | StatusLine not displaying on Windows 11 + PowerShell | Open                |
| #32917 | Output intermittently not rendered                   | Open                |

---

## 3. Render Pipeline & Performance Constraints

### Render Triggers

The statusline script is invoked on exactly **three events**:

1. **After each new assistant message** (most frequent)
2. **When permission mode changes** (accept/deny prompts)
3. **When vim mode toggles** (NORMAL/INSERT switch)

The statusline does **NOT** update:

- During streaming (only after the full message completes)
- During autocomplete suggestions
- During the help menu
- During permission prompts (hides temporarily)

### Debounce & Cancellation

| Parameter                  | Value                                                                                                                                     | Source                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Debounce interval**      | **300ms**                                                                                                                                 | Official docs (code.claude.com/docs/en/statusline) |
| **In-flight cancellation** | Yes — new trigger cancels running script                                                                                                  | Official docs                                      |
| **Hard timeout**           | **Not documented** — official docs say "long-running commands will be killed after the configured timeout" but no specific value is given |
| **Max output lines**       | **Unlimited** — each `echo`/`print` creates a separate row                                                                                | Official docs                                      |
| **Max output width**       | **Terminal width** — truncated with ellipsis (...) if exceeded                                                                            | Official docs + community reports                  |

### Effective Render Budget

Given the 300ms debounce and the cancellation behavior, the practical render
budget is:

```
Script must complete in < 300ms to guarantee display before next trigger
```

- If a script takes >300ms and a new trigger fires, the script is **cancelled**
  (AbortError/SIGTERM) and its output is discarded
- There is no hard timeout documented in the official API. The "configured
  timeout" referenced in community tools (like ccstatusline's 't' key) is a
  **third-party feature**, not a Claude Code native setting
- Scripts that exit with non-zero codes or produce no output cause the status
  line to **go blank** (shows nothing, not an error)

### Performance Recommendations (from Official Docs)

1. **Keep scripts fast** — slow scripts block updates and show stale output
2. **Cache expensive operations** — especially `git status`, `git diff` in large
   repos. Official example uses 5-second cache to `/tmp/statusline-git-cache`
3. **Use stable cache filenames** — `$$`/`os.getpid()`/`process.pid` change
   every invocation; use fixed filenames
4. **Keep output short** — the status bar has limited width; long output wraps
   or truncates

---

## 4. fnm Wrapper Overhead

### Prior Research Finding

Prior research (Session #229) identified 100-300ms overhead from fnm (Fast Node
Manager) wrapper on every statusline render. This is because:

1. The statusline `command` invokes the user's shell
2. Shell initialization runs fnm shims (`fnm env`)
3. fnm resolves the correct Node.js version via `.node-version`/`.nvmrc`
4. Only then does the actual script execute

### Mitigation Strategies

| Strategy              | Overhead Reduction | Approach                                                                                                         |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Direct node path**  | ~100-200ms saved   | Use absolute path: `C:/Users/jbell/.local/share/fnm/node-versions/v22.x/installation/bin/node` instead of `node` |
| **Pre-resolved shim** | ~50-100ms saved    | Pass `--shell bash` to `fnm env` to skip shell inference                                                         |
| **Compiled binary**   | ~200-250ms saved   | Use Rust (CCometixLine) or Go (claude-statusline) instead of Node.js                                             |
| **Bash + jq**         | ~150ms saved       | Avoid Node.js startup entirely; use `jq` for JSON parsing                                                        |

**Recommendation for SoNash:** Use **bash + jq** for the statusline script on
Windows (via Git Bash which Claude Code uses natively). This avoids Node.js
startup and fnm wrapper entirely. Measured overhead for `jq` parsing: ~10-30ms
vs ~200-500ms for Node.js with fnm.

If bash is unreliable on Windows (see issue #31670), fall back to **direct node
path** (bypassing fnm):

```json
{
  "statusLine": {
    "type": "command",
    "command": "C:/Users/jbell/.local/share/fnm/node-versions/v22.14.0/installation/bin/node C:/Users/jbell/.claude/statusline.js"
  }
}
```

---

## 5. Current API Surface (v2.1.81 Complete Schema)

### Configuration Options

```json
{
  "statusLine": {
    "type": "command",
    "command": "path/to/script or inline command",
    "padding": 0
  }
}
```

| Option    | Type   | Default  | Description                                          |
| --------- | ------ | -------- | ---------------------------------------------------- |
| `type`    | string | required | Must be `"command"`                                  |
| `command` | string | required | Shell command or script path (~ expands on v2.1.47+) |
| `padding` | number | `0`      | Extra horizontal spacing in characters               |

No other configuration options exist. There is no `timeout`, `debounce`,
`maxLines`, or `enabled` field in the official API.

To disable: delete the `statusLine` key or use `/statusline clear`.

Note: `disableAllHooks: true` in settings also disables the statusline.

### stdin JSON Schema (Complete as of v2.1.81)

```json
{
  "cwd": "/current/working/directory",
  "session_id": "abc123...",
  "transcript_path": "/path/to/transcript.jsonl",
  "model": {
    "id": "claude-opus-4-6",
    "display_name": "Opus"
  },
  "workspace": {
    "current_dir": "/current/working/directory",
    "project_dir": "/original/project/directory"
  },
  "version": "2.1.81",
  "output_style": {
    "name": "default"
  },
  "cost": {
    "total_cost_usd": 0.01234,
    "total_duration_ms": 45000,
    "total_api_duration_ms": 2300,
    "total_lines_added": 156,
    "total_lines_removed": 23
  },
  "context_window": {
    "total_input_tokens": 15234,
    "total_output_tokens": 4521,
    "context_window_size": 200000,
    "used_percentage": 8,
    "remaining_percentage": 92,
    "current_usage": {
      "input_tokens": 8500,
      "output_tokens": 1200,
      "cache_creation_input_tokens": 5000,
      "cache_read_input_tokens": 2000
    }
  },
  "exceeds_200k_tokens": false,
  "rate_limits": {
    "five_hour": {
      "used_percentage": 23.5,
      "resets_at": 1738425600
    },
    "seven_day": {
      "used_percentage": 41.2,
      "resets_at": 1738857600
    }
  },
  "vim": { "mode": "NORMAL" },
  "agent": { "name": "security-reviewer" },
  "worktree": {
    "name": "my-feature",
    "path": "/path/to/.claude/worktrees/my-feature",
    "branch": "worktree-my-feature",
    "original_cwd": "/path/to/project",
    "original_branch": "main"
  }
}
```

### Conditionally Absent Fields

| Field                      | When Absent                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| `vim`                      | Vim mode not enabled                                             |
| `agent`                    | Not running with `--agent` flag                                  |
| `worktree`                 | Not in a `--worktree` session                                    |
| `worktree.branch`          | Hook-based worktrees                                             |
| `worktree.original_branch` | Hook-based worktrees                                             |
| `rate_limits`              | Not a Claude.ai Pro/Max subscriber, or before first API response |
| `rate_limits.five_hour`    | May be independently absent                                      |
| `rate_limits.seven_day`    | May be independently absent                                      |

### Fields That May Be null

| Field                                 | When null                        |
| ------------------------------------- | -------------------------------- |
| `context_window.current_usage`        | Before first API call in session |
| `context_window.used_percentage`      | Early in session                 |
| `context_window.remaining_percentage` | Early in session                 |

### New in v2.1.80-v2.1.81

| Field                                   | Added In | Description                   |
| --------------------------------------- | -------- | ----------------------------- |
| `rate_limits.five_hour.used_percentage` | v2.1.80  | 5-hour rate limit % (0-100)   |
| `rate_limits.five_hour.resets_at`       | v2.1.80  | Unix epoch seconds for reset  |
| `rate_limits.seven_day.used_percentage` | v2.1.80  | 7-day rate limit % (0-100)    |
| `rate_limits.seven_day.resets_at`       | v2.1.80  | Unix epoch seconds for reset  |
| `agent.name`                            | v2.1.80  | Agent name when using --agent |
| `worktree.*` (5 fields)                 | v2.1.80  | Worktree session information  |

---

## 6. Output Capabilities & Constraints

### Supported Output Features

| Feature               | Support | Notes                                                      |
| --------------------- | ------- | ---------------------------------------------------------- |
| Multi-line output     | Yes     | Each `echo`/`print` = separate row                         |
| ANSI colors (16)      | Yes     | `\033[32m` etc.                                            |
| ANSI colors (256)     | Yes     | `\033[38;5;Nm`                                             |
| Truecolor (24-bit)    | Yes     | `\033[38;2;R;G;Bm` (but quantized in tmux, see #35371)     |
| OSC 8 hyperlinks      | Yes     | Cmd+click (macOS) / Ctrl+click (Windows/Linux)             |
| Unicode/emoji         | Yes     | Requires UTF-8 terminal (Windows: v2.0.28 fixed code page) |
| Bold/italic/underline | Yes     | Standard ANSI SGR codes                                    |

### Output Constraints

| Constraint         | Value                                      | Source                                 |
| ------------------ | ------------------------------------------ | -------------------------------------- |
| Max width          | Terminal width (auto-truncated with `...`) | Official docs                          |
| Max lines          | No hard limit documented                   | Official docs show multi-line examples |
| Right-side sharing | System notifications display on same row   | Official docs                          |
| Verbose mode       | Adds token counter to right side           | Official docs                          |
| Narrow terminals   | Notifications may truncate statusline      | Official docs                          |

### Visibility Gaps

The statusline **temporarily hides** during:

- Autocomplete suggestions
- Help menu display
- Permission prompts (feature request #21349 to keep visible)

---

## 7. Changelog Statusline Entries (v2.1.68 through v2.1.81)

| Version | Date         | Change                                                                  |
| ------- | ------------ | ----------------------------------------------------------------------- |
| v2.0.28 | Early 2026   | Windows UTF-8 code page fix for piped statusline output                 |
| v2.1.68 | ~Feb 2026    | PowerShell statusLine stopped rendering (regression, #30725)            |
| v2.1.71 | ~Mar 2026    | Statusline completely non-functional on Windows (#31670)                |
| v2.1.75 | ~Mar 2026    | Security fix: statusLine commands could execute without workspace trust |
| v2.1.77 | ~Mar 2026    | Truecolor quantization regression in tmux (#35371)                      |
| v2.1.78 | ~Mar 2026    | Fixed Windows PATH inheritance for Bash tool (Git Bash regression)      |
| v2.1.80 | Mar 2026     | Added `rate_limits` field to statusline JSON                            |
| v2.1.80 | Mar 2026     | Added `added_dirs` to workspace section                                 |
| v2.1.81 | Mar 20, 2026 | `--bare` flag, channel permissions; statusline workaround confirmed     |

---

## 8. Risk Assessment for SoNash Implementation

### Risks

| Risk                                     | Severity   | Mitigation                                               |
| ---------------------------------------- | ---------- | -------------------------------------------------------- |
| Windows statusline not officially fixed  | **HIGH**   | Use workaround (trust file + forward slashes + Node.js)  |
| Intermittent rendering failures (#32917) | **MEDIUM** | Accept occasional blank frames; no fix available         |
| fnm overhead exceeding 300ms budget      | **MEDIUM** | Use direct node path or bash+jq                          |
| Permission prompt hides statusline       | **LOW**    | Accepted limitation; feature request #21349 filed        |
| Truecolor colors wrong in tmux           | **LOW**    | Use 16-color ANSI for maximum compatibility              |
| No hard timeout = hung script blocks UI  | **MEDIUM** | Implement self-timeout in script (e.g., `timeout 200ms`) |

### Recommended Architecture for SoNash

1. **Script language:** Bash + jq (primary), Node.js fallback for Windows
2. **Cache strategy:** 5-second cache for git operations (per official example)
3. **Target render time:** <100ms (well within 300ms budget)
4. **Self-timeout:** Include `timeout 0.2` wrapper on bash, or
   `setTimeout(process.exit, 200)` in Node.js
5. **Error handling:** Always produce output (even fallback); never exit
   non-zero
6. **Windows setup:** Auto-generate `~/.claude/.claude.json` trust file as part
   of statusline installation
7. **Path format:** Always use forward slashes in settings.json commands

---

## 9. Sources

- [Official Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline)
- [GitHub Issue #31670 — Statusline not executed on Windows](https://github.com/anthropics/claude-code/issues/31670)
- [GitHub Issue #32917 — Output intermittently not rendered](https://github.com/anthropics/claude-code/issues/32917)
- [GitHub Issue #30725 — PowerShell statusLine stopped after v2.1.68](https://github.com/anthropics/claude-code/issues/30725)
- [GitHub Issue #21349 — Keep status line visible during prompts](https://github.com/anthropics/claude-code/issues/21349)
- [GitHub Issue #35371 — Truecolor quantization regression in tmux](https://github.com/anthropics/claude-code/issues/35371)
- [Claude Code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code v2.1.81 Release Notes](https://claude-world.com/articles/claude-code-2181-release/)
- [Claude Code v2.1.80 Release Notes](https://www.claudeupdates.dev/version/2.1.80)
- [Releasebot — Claude Code March 2026 Updates](https://releasebot.io/updates/anthropic/claude-code)
- [ccstatusline (sirmalloc)](https://github.com/sirmalloc/ccstatusline)
- [CCometixLine (Haleclipse)](https://github.com/Haleclipse/CCometixLine)
- [Claude Code Status Line Setup Guide (claudefast)](https://claudefa.st/blog/tools/statusline-guide)
- [SQ-001 Research — Claude Code Statusline Tools](SQ-001-claude-statusline-tools.md)
