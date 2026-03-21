# External Claude Code Statusline Implementations

**Research Date:** 2026-03-20 **Session:** #230 (Deep Dive follow-up to Session
#229 survey) **Scope:** Architecture, performance, Windows compat, unique
innovations

---

## Table of Contents

1. [Official API Reference](#1-official-api-reference)
2. [Tier 1: High-Impact Repos (1k+ stars)](#2-tier-1-high-impact-repos)
3. [Tier 2: Notable Repos (100-999 stars)](#3-tier-2-notable-repos)
4. [Tier 3: Specialized/Niche Repos (<100 stars)](#4-tier-3-specializedniche-repos)
5. [npm Packages](#5-npm-packages)
6. [Comparative Analysis](#6-comparative-analysis)
7. [Best Practices from Community](#7-best-practices-from-community)
8. [Implications for SoNash](#8-implications-for-sonash)

---

## 1. Official API Reference

**Source:**
[code.claude.com/docs/en/statusline](https://code.claude.com/docs/en/statusline)

### Stdin JSON Schema (Complete)

The statusline command receives this JSON via stdin on every update:

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
  "version": "1.0.80",
  "output_style": { "name": "default" },
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
    "five_hour": { "used_percentage": 23.5, "resets_at": 1738425600 },
    "seven_day": { "used_percentage": 41.2, "resets_at": 1738857600 }
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

### Conditional/Nullable Fields

| Field                            | Condition                                                         |
| -------------------------------- | ----------------------------------------------------------------- |
| `vim`                            | Only when vim mode enabled                                        |
| `agent`                          | Only with `--agent` flag or agent settings                        |
| `worktree`                       | Only during `--worktree` sessions                                 |
| `rate_limits`                    | Only for Claude.ai subscribers (Pro/Max) after first API response |
| `context_window.current_usage`   | `null` before first API call                                      |
| `context_window.used_percentage` | May be `null` early in session                                    |

### Refresh Behavior

- Triggers: after each assistant message, permission mode change, vim mode
  toggle
- Debounce: 300ms (rapid changes batch together)
- Cancellation: new update cancels in-flight script
- Output: multiple `echo`/`print` lines = multiple status rows
- Supports: ANSI colors, OSC 8 clickable links
- Does NOT consume API tokens

### Official Windows Guidance

Claude Code runs statusline commands through Git Bash on Windows. Two
approaches:

1. Invoke PowerShell from Git Bash: `powershell -NoProfile -File path.ps1`
2. Run Bash script directly via `~/.claude/statusline.sh`

---

## 2. Tier 1: High-Impact Repos

### 2.1 claude-hud (jarrodwatts)

| Attribute           | Value                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| **URL**             | [github.com/jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) |
| **Stars**           | 9,300                                                                          |
| **Language**        | TypeScript (41%) + JavaScript (59%)                                            |
| **License**         | MIT                                                                            |
| **Last Release**    | v0.0.9 (March 5, 2026)                                                         |
| **Min Claude Code** | v1.0.80+                                                                       |

**Architecture:** Plugin system for Claude Code. Integrates via marketplace
registration + native statusline API. No tmux or separate window needed.
JSON-driven config at `~/.claude/plugins/claude-hud/config.json` with three
presets (Full/Essential/Minimal).

**Features:**

- Project path (1-3 configurable directory levels)
- Context window health with visual progress bars
- **Tool activity tracking** (file reads, edits, grep operations)
- **Agent status monitoring** with runtime duration
- Todo progress tracking (completed/total tasks)
- Git branch with dirty indicators and ahead/behind
- Usage rate limits (Pro/Max/Team)
- Session duration and token output speed

**Performance:** Updates ~300ms. Parses Claude Code's transcript JSONL for
activity detection (not estimation). Scales to 1M-token sessions dynamically.

**Windows:** No specific limitations documented. Cross-platform terminal support
emphasized.

**Unique Innovation:** **Real-time agent and tool tracking** from transcript
data. This is the only repo that shows what tools/agents are actively running
and their durations. The highest-starred statusline project by a wide margin.

---

### 2.2 ccstatusline (sirmalloc)

| Attribute        | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **URL**          | [github.com/sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) |
| **Stars**        | 5,600                                                                          |
| **Language**     | TypeScript/JavaScript                                                          |
| **License**      | MIT                                                                            |
| **npm**          | `ccstatusline`                                                                 |
| **Last Version** | v2.2.6                                                                         |

**Architecture:** Config-driven single application with 30+ widgets. Settings in
`~/.config/ccstatusline/settings.json`. Interactive TUI configuration via
React/Ink for widget picker with search and ranked matching.

**Widget System (30+):**

- Token speed widgets (Input/Output/Total with configurable rolling windows
  0-120s)
- Usage API widgets (Session/Weekly usage, Block Reset Timer, Context Bar)
- Git widgets (Branch, Status, Worktree, Insertions, Deletions, Root Dir)
- Block timer with progress bar visualization
- Session cost, CWD, Memory usage, Custom text, Link (OSC8)
- Thinking Effort, Vim Mode, Skills widget

**Performance:**

- Block timer metric caching with per-config hashed cache files (5-hour
  invalidation)
- Shared git command helpers (reduce redundant executions)
- Usage API proxy support (`HTTPS_PROXY`)
- Subagent-aware token speed calculations

**Windows:** Full compatibility across PowerShell 5.1+/7+, Command Prompt, WSL.
Automatic UTF-8 code page handling for piped output. Supports forward/backslash
path separators, mapped drives, UNC paths. Auto Nerd Font detection.

**Installation:** Zero-install via `npx -y ccstatusline@latest` or
`bunx -y ccstatusline@latest`.

**Unique Innovations:**

- Unlimited multi-line statuslines (removed 3-line limit in v2.0.11)
- Rolling window token speed calculation (0-120s configurable)
- Block timer with 5-hour boundary detection from transcript timestamps
- Auto-alignment of widgets across Powerline lines
- OSC8 hyperlink rendering (clickable git branch links to GitHub, IDE paths)
- Fish-style path abbreviation toggle

---

### 2.3 CCometixLine (Haleclipse)

| Attribute       | Value                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| **URL**         | [github.com/Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine) |
| **Stars**       | 2,300                                                                            |
| **Language**    | Rust                                                                             |
| **License**     | MIT                                                                              |
| **npm**         | `@cometix/ccline`                                                                |
| **Last Commit** | January 11, 2025                                                                 |

**Architecture:** Single compiled binary, no runtime dependencies. TOML config
at `~/.claude/ccline/config.toml` and `models.toml`. Composable segment
configuration with custom themes.

**Features:**

- Git integration (branch, tracking, conflict indicators)
- Model name simplification (e.g., `claude-3-5-sonnet` -> "Sonnet 3.5")
- Token usage tracking via transcript analysis
- Context window visualization
- Interactive TUI configuration with real-time preview
- Built-in themes
- Claude Code enhancement utilities (context warning suppression, verbose mode)

**Performance:** Native Rust binary = fast startup, no interpreter overhead.
Efficient transcript analysis for metrics.

**Windows:** Fully supported. Platform-specific binaries for Windows x64.
Unix-style path syntax support since Claude Code v2.1.47+.

**Installation:** `npm install -g @cometix/ccline` or manual binary download or
`cargo install`.

**Unique Innovation:** Robust patcher for Claude Code that survives version
updates with automatic backups. Model pattern matching with context modifiers.

---

## 3. Tier 2: Notable Repos

### 3.1 claude-powerline (Owloops)

| Attribute    | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| **URL**      | [github.com/Owloops/claude-powerline](https://github.com/Owloops/claude-powerline) |
| **Stars**    | 937                                                                                |
| **Language** | TypeScript/Node.js                                                                 |
| **npm**      | `@owloops/claude-powerline`                                                        |

**Architecture:** Config-driven via cascading JSON priority: CLI flags -> env
vars -> config files -> defaults. Three config file locations
(project/user/XDG). Auto-reloading without restart.

**Features:**

- 12+ configurable segments (directory, git, metrics, model, context, tmux,
  version, session, block, today, env)
- 6 built-in themes (dark, light, nord, tokyo-night, rose-pine, gruvbox)
- 4 display styles (minimal, powerline, capsule, TUI panel)
- Budget monitoring with percentage alerts
- Unicode or ASCII character set support
- Auto-wrap layout based on terminal width

**Performance:** Auto-compact threshold detection (33k token buffer). TUI style
has responsive breakpoints (wide 80+, medium 55-79, narrow <55 cols).

**Windows:** Node.js 18+ and Git 2.0+ required. No explicit limitations.
ASCII-only mode available via `--charset=text`.

**Unique Innovation:** Weighted token calculation reflecting Opus model's 5x
rate limit multiplier. TUI panel mode with responsive multi-breakpoint layout.
Model-specific context limits.

---

### 3.2 kamranahmedse/claude-statusline

| Attribute       | Value                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **URL**         | [github.com/kamranahmedse/claude-statusline](https://github.com/kamranahmedse/claude-statusline) |
| **Stars**       | 754                                                                                              |
| **Language**    | Shell (72%) + JavaScript (28%)                                                                   |
| **Last Commit** | March 8, 2026                                                                                    |

**Architecture:** Single shell script at `~/.claude/statusline.sh`. npm-based
installer copies script and backs up existing config.

**Features:** Usage limits, current directory, git branch, rate limit data
(fetched via curl). Minimal and intentionally simple.

**Windows:** Not addressed. macOS/Linux primary focus.

**Installation:** `npx @kamranahmedse/claude-statusline`

**Unique Innovation:** Simplicity itself. From Kamran Ahmed (roadmap.sh
creator). Real-time API rate limiting display. Good baseline reference for
minimal implementations.

---

### 3.3 cc-statusline (chongdashu)

| Attribute    | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| **URL**      | [github.com/chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline) |
| **Stars**    | 526                                                                                |
| **Language** | Bash (generated) + Node.js (CLI)                                                   |
| **npm**      | `@chongdashu/cc-statusline`                                                        |

**Architecture:** Interactive CLI generates project-specific Bash scripts (not
generic). File-based locking mechanism prevents concurrent `ccusage` process
spawning. Zero-dependency core with graceful fallbacks.

**Performance:**

- Execution time: 45-80ms (target <100ms)
- Memory: ~2MB (target <5MB)
- CPU: <1% per invocation

**Windows:** Full Windows 10/11 support via Chocolatey, Scoop, Winget. Proper
PATH configuration. Platform-specific guidance included.

**Installation:** `npx @chongdashu/cc-statusline@latest init` (interactive
3-question setup).

**Unique Innovation:** Code generation model -- creates customized scripts per
project rather than running a generic tool. Safety-first: never overwrites
existing configs. Built-in preview/testing.

---

### 3.4 rz1989s/claude-code-statusline

| Attribute        | Value                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **URL**          | [github.com/rz1989s/claude-code-statusline](https://github.com/rz1989s/claude-code-statusline) |
| **Stars**        | 398                                                                                            |
| **Language**     | Bash (pure)                                                                                    |
| **Last Version** | v2.10.0                                                                                        |

**Architecture:** 28 atomic components across 1-9 configurable lines. Single
`Config.toml` (227 settings) replaces 13 previous example configs. Modular 18+
component modules with standardized interfaces.

**Performance:**

- Sub-50ms responses via 3-tier caching
- Session-wide command existence caching
- Duration-based git operation caching
- SHA-256 integrity protection on XDG cache
- 77+ tests

**Windows:** macOS 12+, Ubuntu/Debian, Arch, Fedora/RHEL, Alpine, Windows via
WSL.

**Unique Innovations:**

- **Islamic Prayer Times & Hijri Calendar** via AlAdhan API (all 5 daily prayers
  with Maghrib-based date changes)
- MCP server health monitoring component
- Block metrics (burn rate, cache efficiency, cost projections)
- Eliminated GitHub rate limits via architectural redesign (3-tier download)

---

### 3.5 daniel3303/ClaudeCodeStatusLine

| Attribute        | Value                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **URL**          | [github.com/daniel3303/ClaudeCodeStatusLine](https://github.com/daniel3303/ClaudeCodeStatusLine) |
| **Stars**        | 330                                                                                              |
| **Language**     | Shell (55%) + PowerShell (45%)                                                                   |
| **Last Release** | v1.1.0 (March 19, 2026)                                                                          |

**Architecture:** Dual-script approach: separate Bash and PowerShell
implementations. 60-second usage cache at
`/tmp/claude/statusline-usage-cache.json`. 24-hour version check caching.

**Features:** Model, directory, git branch, file changes, token usage
(current/total with %), reasoning effort level, 5h/7d rate limit status with
reset times, extra usage credits, update notifications.

**Windows:** Full Windows support via PowerShell 5.1+ (included on Win 10/11).
Separate `statusline.ps1` implementation. Git required in PATH.

**Unique Innovation:** Real-time Anthropic API integration for actual rate
limits without impacting Claude Code performance. Auto-update detection with
clickable links. Color coding: green (<50%) -> yellow (>=50%) -> orange (>=70%)
-> red (>=90%).

---

### 3.6 cship (stephenleo)

| Attribute    | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| **URL**      | [github.com/stephenleo/cship](https://github.com/stephenleo/cship) |
| **Stars**    | 245                                                                |
| **Language** | Rust                                                               |
| **Config**   | TOML                                                               |

**Architecture:** Rust binary with <=10ms render budget. Bridges Claude Code's
JSON feed with Starship prompt framework. TOML config at `~/.config/cship.toml`
or per-project `cship.toml`.

**Features:**

- Native modules for Claude Code data (cost, context, API limits)
- Full Starship passthrough via `$starship_prompt` token
- Individual Starship tokens mixable in format strings
- Multi-row statusline layouts
- Custom warn/critical thresholds

**Windows:** Not explicitly documented. Binaries for macOS + Linux only.

**Installation:** Curl installer (auto-detects OS/arch) or `cargo install`.

**Unique Innovation:** **Starship integration.** The only statusline that
bridges Claude Code telemetry with Starship's extensible prompt framework.
Developers who already use Starship can reuse their prompt config inside Claude
Code's statusline.

---

## 4. Tier 3: Specialized/Niche Repos

### 4.1 claudia-statusline (hagan)

| Attribute       | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| **URL**         | [github.com/hagan/claudia-statusline](https://github.com/hagan/claudia-statusline) |
| **Stars**       | 21                                                                                 |
| **Language**    | Rust                                                                               |
| **Config**      | TOML                                                                               |
| **Last Commit** | Feb 13, 2025                                                                       |

**Architecture:** Single-binary Rust application. TOML config at
`~/.config/claudia-statusline/config.toml`. **SQLite persistence** at
`~/.local/share/claudia-statusline/stats.db` with JSON backup fallback.

**Features:**

- 11 embedded themes, 5 layout presets
- Custom templates via format strings
- Session duration, cost tracking, hourly burn rate
- Lines changed (+/-)
- Context usage with progress bar

**Performance:** Hot path completes in "a few milliseconds." Negligible CPU.
Event-driven hooks instead of polling. Rolling-window token rate metrics.

**Windows:** Dedicated Windows binary (`statusline-windows-amd64.zip`) with
`WINDOWS_BUILD.md` guide.

**Compaction Detection (Key Innovation):**

- Dual-mode: hook-based (`PreCompact`/`SessionStart`) = <1ms detection vs token
  analysis (~60s fallback)
- Shows "Compacting..." spinner during process, checkmark on completion
- Experimental but functional

**Other Unique Features:**

- **Adaptive context learning** (opt-in) -- observes usage patterns to learn
  window limits
- **Configurable burn rate modes**: `wall_clock`, `active_time` (excludes idle
  gaps), `auto_reset` (daily separation)
- **Cloud sync via Turso** for cross-machine stats
- Token rate metrics with cache efficiency tracking and ROI calculation

---

### 4.2 SaharCarmel/claude-code-status-line

| Attribute        | Value                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **URL**          | [github.com/SaharCarmel/claude-code-status-line](https://github.com/SaharCarmel/claude-code-status-line) |
| **Stars**        | 8                                                                                                        |
| **Language**     | Shell (100%)                                                                                             |
| **Last Release** | v1.3.3 (Aug 24, 2025)                                                                                    |

**Architecture:** Single shell script (`statusline-haiku-summary.sh`). Minimal,
no plugin system. Config via `~/.claude/settings.json`.

**Features:**

- Project info, costs, git status
- 5-word AI-generated summary of current work
- Code quality detection indicators

**Performance:** 30-second intelligent caching for AI summaries. Multi-instance
isolation. Async operation within bash constraints.

**Windows:** Not supported (Bash-only).

**AI Summary Generation (Key Innovation):**

- Reads actual conversation history from `~/.claude/projects/`
- Generates summaries using Claude Haiku via XML-structured prompts
- Isolated directory (`~/.claude/statusline-summaries/`)

**Code Quality Detection (Key Innovation):**

- MOCK: Claude is using mock/fake data
- SHORTCUT: Taking implementation shortcuts
- SOLID: Production-ready solutions
- UNKNOWN: Insufficient context

**Installation:**
`brew tap saharcarmel/claude && brew install claude-code-status-line`

---

### 4.3 FlineDev/CustomStatusline

| Attribute       | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| **URL**         | [github.com/FlineDev/CustomStatusline](https://github.com/FlineDev/CustomStatusline) |
| **Stars**       | 7                                                                                    |
| **Language**    | Shell (100%)                                                                         |
| **Last Commit** | Feb 18, 2026                                                                         |

**Architecture:** Single Bash script. Two-source data pipeline: real-time
context data from Claude Code stdin + Anthropic OAuth API for utilization data.

**Performance:** 5-minute shared cache file prevents redundant API calls across
multiple terminals. Graceful degradation when API unavailable.

**Windows:** Not documented (macOS primary).

**Pace Sustainability Algorithm (Key Innovation):** Compares usage percentage
against elapsed time percentage. If usage < elapsed time, color stays gray
regardless of absolute percentage -- indicating sustainable consumption that
will not trigger limits. Example: 4 hours into 5-hour window (80% elapsed) with
75% used = sustainable (gray), not warning (yellow). This is psychologically
superior to naive threshold-based alerts.

---

### 4.4 felipeelias/claude-statusline

| Attribute        | Value                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| **URL**          | [github.com/felipeelias/claude-statusline](https://github.com/felipeelias/claude-statusline) |
| **Stars**        | 2                                                                                            |
| **Language**     | Go (100%)                                                                                    |
| **Last Release** | v0.4.0 (March 17, 2026)                                                                      |

**Architecture:** Go binary. TOML config at
`~/.config/claude-statusline/config.toml`. 7 modules: directory, git_branch,
model, cost, context, session timer, lines changed.

**Presets (6):** default, minimal, pastel-powerline, tokyo-night,
gruvbox-rainbow, catppuccin.

**Styling:** Named colors, hex (#ff5500), 256-color palette, combined
attributes.

**Installation:** `brew install felipeelias/tap/claude-statusline` or
`go install`.

**Commands:** `prompt` (render), `init` (create config), `test` (preview with
mock data), `themes` (display presets).

**Unique Innovation:** Starship-inspired template system in Go. `test` command
for iterating on config without running Claude Code. Clean, minimal, well-
documented despite low stars.

---

### 4.5 dwillitzer/claude-statusline

| Attribute    | Value                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| **URL**      | [github.com/dwillitzer/claude-statusline](https://github.com/dwillitzer/claude-statusline) |
| **Stars**    | 12                                                                                         |
| **Language** | Bash + Node.js (tiktoken)                                                                  |

**Features:** Multi-provider token counting (Claude, OpenAI, Gemini, xAI Grok).
3 display modes (verbose, compact, custom template). Smart message filtering.

**Unique Innovation:** **Multi-provider AI support** with verified context
limits across Claude, OpenAI GPT-4.1/4o, Google Gemini 1.5/2.x, and xAI Grok
3/4. Tiktoken fallback when direct token data unavailable.

---

### 4.6 gabriel-dehan/claude_monitor_statusline

| Attribute    | Value                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **URL**      | [github.com/gabriel-dehan/claude_monitor_statusline](https://github.com/gabriel-dehan/claude_monitor_statusline) |
| **Stars**    | 20                                                                                                               |
| **Language** | Ruby (100%)                                                                                                      |

**Features:** Workspace context, git indicators, model name, token/message usage
against plan limits, time until quota reset.

**Unique Innovation:** Three visual modes (colors/minimal/background) + info
modes (none/emoji/text). Environment variable configuration
(`CLAUDE_STATUS_DISPLAY_MODE`, `CLAUDE_STATUS_PLAN`). The only Ruby-based
statusline.

---

## 5. npm Packages

| Package                            | Registry | Language | Stars | Key Feature                 |
| ---------------------------------- | -------- | -------- | ----- | --------------------------- |
| `ccstatusline`                     | npm      | TS/JS    | 5.6k  | 30+ widgets, TUI config     |
| `@owloops/claude-powerline`        | npm      | TS       | 937   | Vim-style powerline, themes |
| `@chongdashu/cc-statusline`        | npm      | JS/Bash  | 526   | Generated scripts, preview  |
| `@cometix/ccline`                  | npm      | Rust     | 2.3k  | Native binary via npm       |
| `@kamranahmedse/claude-statusline` | npm      | Shell/JS | 754   | Minimal, one-command        |
| `@illumin8ca/claude-statusline`    | npm      | TS       | --    | Powerline style             |
| `@wyattjoh/claude-status-line`     | JSR      | --       | --    | Deno-compatible             |

---

## 6. Comparative Analysis

### Architecture Patterns

| Pattern                       | Repos                                                | Pros                          | Cons                                            |
| ----------------------------- | ---------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| **Single Bash script**        | kamranahmedse, SaharCarmel, FlineDev, rz1989s        | Zero deps, easy to understand | Hard to maintain at scale, slow for complex ops |
| **Compiled binary (Rust/Go)** | CCometixLine, claudia-statusline, cship, felipeelias | <10ms render, no runtime      | Build step, larger install                      |
| **Node.js/TS app**            | ccstatusline, claude-hud, claude-powerline           | Rich ecosystem, TUI possible  | Node.js startup overhead, heavier               |
| **Code generator**            | cc-statusline                                        | Tailored per-project          | Generated code diverges from upstream           |

### Performance Comparison

| Repo               | Render Time | Caching Strategy                          |
| ------------------ | ----------- | ----------------------------------------- |
| cship              | <=10ms      | Rust native                               |
| CCometixLine       | ~10-20ms    | Rust native, transcript analysis          |
| claudia-statusline | "few ms"    | SQLite + event-driven hooks               |
| rz1989s            | <50ms       | 3-tier caching, SHA-256 integrity         |
| cc-statusline      | 45-80ms     | File-based locking, ccusage cache         |
| ccstatusline       | ~50-100ms   | Per-config hashed cache, 5hr invalidation |
| claude-powerline   | ~50-100ms   | Auto-compact threshold                    |

### Windows Compatibility Matrix

| Repo                 | Windows Support | Method                        |
| -------------------- | --------------- | ----------------------------- |
| ccstatusline         | **Full**        | PowerShell 5.1+/7+, CMD, WSL  |
| ClaudeCodeStatusLine | **Full**        | Separate PowerShell script    |
| cc-statusline        | **Full**        | Chocolatey/Scoop/Winget       |
| CCometixLine         | **Full**        | Platform-specific binary      |
| claudia-statusline   | **Full**        | Dedicated Windows binary      |
| rz1989s              | WSL only        | Bash via WSL                  |
| claude-powerline     | Likely          | Node.js + ASCII mode          |
| claude-hud           | Likely          | Node.js, no documented limits |
| kamranahmedse        | No              | macOS/Linux only              |
| SaharCarmel          | No              | Bash-only                     |
| FlineDev             | No              | macOS primary                 |
| cship                | No              | macOS/Linux binaries only     |

### Unique Innovation Map

| Innovation                          | Repo               | Our Interest                              |
| ----------------------------------- | ------------------ | ----------------------------------------- |
| Agent/tool activity tracking        | claude-hud         | **HIGH** -- session observability         |
| Compaction detection (hook-based)   | claudia-statusline | **HIGH** -- context safety                |
| Code quality detection (MOCK/SOLID) | SaharCarmel        | **HIGH** -- implementation quality signal |
| Pace sustainability coloring        | FlineDev           | **HIGH** -- UX psychology                 |
| SQLite persistence + cloud sync     | claudia-statusline | **MEDIUM** -- cross-session stats         |
| Starship passthrough                | cship              | **MEDIUM** -- ecosystem integration       |
| AI-generated work summaries         | SaharCarmel        | **MEDIUM** -- context awareness           |
| Prayer times / cultural widgets     | rz1989s            | LOW -- domain-specific                    |
| Multi-provider token counting       | dwillitzer         | LOW -- Claude-only for us                 |
| 30+ widget ecosystem                | ccstatusline       | **MEDIUM** -- extensibility model         |

---

## 7. Best Practices from Community

### Performance

1. **Cache slow operations** (git status, API calls) -- 5-60 second TTLs common
2. **Target <100ms render time** -- scripts run on every assistant message
3. **Use file-based caching** with stable filenames (NOT `$$`/PID-based)
4. **Graceful degradation** when deps unavailable (jq, git, curl)
5. **Cancellation-safe** -- Claude Code cancels in-flight scripts on new updates

### UX

1. **Keep output short** -- terminal width is limited, long output truncates
2. **Color-code thresholds** -- green (<50%) / yellow (50-70%) / orange (70-90%)
   / red (90%+)
3. **Pace-based coloring > absolute thresholds** (FlineDev innovation)
4. **Multi-line for rich displays** -- each echo/print = separate row
5. **Handle null/missing fields** -- many fields absent early in session

### Architecture

1. **TOML is the emerging config standard** (claudia, felipeelias, cship,
   rz1989s, CCometixLine) over JSON
2. **Compiled binaries dominate performance** but Node.js dominates ecosystem
3. **Widget/module pattern** works for extensibility (ccstatusline model)
4. **Dual Windows support** (separate .sh + .ps1) is the proven pattern

### Official Recommendations

1. Test with mock input: `echo '{"model":...}' | ./statusline.sh`
2. On Windows, write Node.js scripts instead of inline commands (avoid shell
   character escaping issues)
3. Use `printf '%b'` instead of `echo -e` for reliable escape handling
4. Status line hides during autocomplete, help menu, permission prompts
5. `disableAllHooks: true` also disables statusline

---

## 8. Implications for SoNash

### Must-Have Features (based on ecosystem consensus)

1. Context window usage with visual indicator
2. Rate limit tracking (5h/7d) with reset times
3. Session cost
4. Git branch + status
5. Model name

### High-Value Differentiators to Consider

1. **Hook/agent activity tracking** (claude-hud approach) -- SoNash already has
   extensive hook infrastructure
2. **Compaction detection** (claudia-statusline approach) -- critical for
   SoNash's context preservation strategy
3. **Pace sustainability** (FlineDev approach) -- better than threshold-based
   for Max plan users
4. **Code quality signal** (SaharCarmel approach) -- could integrate with
   SoNash's code-reviewer agent

### Windows Compatibility Strategy

The proven pattern is dual-script (Bash + PowerShell) as seen in
daniel3303/ClaudeCodeStatusLine. However, since SoNash runs on Windows and uses
Git Bash, a Node.js-based approach would work cross-platform without separate
scripts. Official docs recommend Node.js for Windows to avoid shell character
issues.

### Architecture Recommendation

Based on the ecosystem analysis:

- **Node.js/TypeScript** for cross-platform compatibility and ecosystem access
- **JSON or TOML config** for user customization
- **File-based caching** for expensive operations (git, API calls)
- **Module/widget pattern** for extensibility (follow ccstatusline model)
- **Target <100ms render** with graceful degradation

---

## Sources

- [Customize your status line - Claude Code Docs](https://code.claude.com/docs/en/statusline)
- [github.com/jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)
- [github.com/sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline)
- [github.com/Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine)
- [github.com/Owloops/claude-powerline](https://github.com/Owloops/claude-powerline)
- [github.com/kamranahmedse/claude-statusline](https://github.com/kamranahmedse/claude-statusline)
- [github.com/chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline)
- [github.com/rz1989s/claude-code-statusline](https://github.com/rz1989s/claude-code-statusline)
- [github.com/daniel3303/ClaudeCodeStatusLine](https://github.com/daniel3303/ClaudeCodeStatusLine)
- [github.com/stephenleo/cship](https://github.com/stephenleo/cship)
- [github.com/hagan/claudia-statusline](https://github.com/hagan/claudia-statusline)
- [github.com/SaharCarmel/claude-code-status-line](https://github.com/SaharCarmel/claude-code-status-line)
- [github.com/FlineDev/CustomStatusline](https://github.com/FlineDev/CustomStatusline)
- [github.com/felipeelias/claude-statusline](https://github.com/felipeelias/claude-statusline)
- [github.com/dwillitzer/claude-statusline](https://github.com/dwillitzer/claude-statusline)
- [github.com/gabriel-dehan/claude_monitor_statusline](https://github.com/gabriel-dehan/claude_monitor_statusline)
- [github.com/levz0r/claude-code-statusline](https://github.com/levz0r/claude-code-statusline)
- [github.com/b-open-io/statusline](https://github.com/b-open-io/statusline)
- [ccstatusline on npm](https://www.npmjs.com/package/ccstatusline)
- [felipeelias blog post](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
