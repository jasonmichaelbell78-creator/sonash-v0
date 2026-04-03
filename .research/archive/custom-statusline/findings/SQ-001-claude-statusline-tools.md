# SQ-001: Claude Code Statusline Tools & Plugins Landscape (March 2026)

**Researched:** 2026-03-23 **Prior Research:** Session #229 (2026-03-19/20)
**Claude Code Version:** v2.1.81 (released 2026-03-20)

---

## 1. Executive Summary

The Claude Code statusline ecosystem has **exploded** since our prior research 3
days ago. The landscape now includes:

- **Official built-in support** via `/statusline` command and comprehensive JSON
  API
- **10+ dedicated third-party tools** ranging from simple bash scripts to
  full-featured Rust/Go binaries
- **An official plugin marketplace** (launched early 2026) that some statusline
  tools integrate with
- **New JSON fields** added in v2.1.81 (March 20) including `rate_limits`,
  `worktree.*`, and `agent.name`

The original `mapleleafu/ccstatusline` from prior research now returns a
**404**. The dominant project is now `sirmalloc/ccstatusline` (5.8k stars),
which may be a rename/transfer or a successor.

---

## 2. Official Claude Code Statusline Support

### Built-in Feature (First-Party)

Claude Code has **native statusline support** as a first-class feature. No
plugin required.

**Configuration** (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

**How it works:**

- Runs your shell script and pipes JSON session data via stdin
- Script reads JSON, extracts fields, prints to stdout
- Updates after each assistant message, permission mode change, or vim toggle
- Debounced at 300ms; in-flight executions cancelled on new trigger
- Supports multi-line output, ANSI colors, OSC 8 clickable links

**`/statusline` command:** Accepts natural language description, generates a
script, updates settings automatically.

**Windows:** Runs through Git Bash. Can invoke PowerShell from there:

```json
{
  "statusLine": {
    "type": "command",
    "command": "powershell -NoProfile -File C:/Users/username/.claude/statusline.ps1"
  }
}
```

Or use a bash script directly (the `~` tilde expands to home on Claude Code
v2.1.47+).

### Available JSON Fields (stdin schema)

**Source:** https://code.claude.com/docs/en/statusline

| Field                                   | Description                               |
| --------------------------------------- | ----------------------------------------- |
| `model.id`, `model.display_name`        | Current model identifier and display name |
| `cwd`, `workspace.current_dir`          | Current working directory                 |
| `workspace.project_dir`                 | Directory where Claude Code was launched  |
| `cost.total_cost_usd`                   | Total session cost in USD                 |
| `cost.total_duration_ms`                | Wall-clock time since session start       |
| `cost.total_api_duration_ms`            | Time spent waiting for API responses      |
| `cost.total_lines_added/removed`        | Lines of code changed                     |
| `context_window.total_input_tokens`     | Cumulative input tokens                   |
| `context_window.total_output_tokens`    | Cumulative output tokens                  |
| `context_window.context_window_size`    | Max context size (200k or 1M)             |
| `context_window.used_percentage`        | Pre-calculated % used                     |
| `context_window.remaining_percentage`   | Pre-calculated % remaining                |
| `context_window.current_usage.*`        | Token counts from last API call           |
| `exceeds_200k_tokens`                   | Boolean: exceeds 200k threshold           |
| `rate_limits.five_hour.used_percentage` | **NEW v2.1.81** 5-hour rate limit %       |
| `rate_limits.five_hour.resets_at`       | **NEW v2.1.81** Reset epoch seconds       |
| `rate_limits.seven_day.used_percentage` | **NEW v2.1.81** 7-day rate limit %        |
| `rate_limits.seven_day.resets_at`       | **NEW v2.1.81** Reset epoch seconds       |
| `session_id`                            | Unique session identifier                 |
| `transcript_path`                       | Path to conversation transcript           |
| `version`                               | Claude Code version                       |
| `output_style.name`                     | Current output style                      |
| `vim.mode`                              | NORMAL or INSERT (when vim mode enabled)  |
| `agent.name`                            | Agent name (with --agent flag)            |
| `worktree.name/path/branch`             | Worktree info (--worktree sessions)       |
| `worktree.original_cwd/original_branch` | Pre-worktree state                        |

**Conditionally absent fields:** `vim`, `agent`, `worktree`, `rate_limits`
(Pro/Max subscribers only after first API response).

### v2.1.81 Statusline Changes (March 20, 2026)

- Added `rate_limits` field with 5-hour and 7-day windows
- Added `source: 'settings'` plugin marketplace source for inline plugin
  declarations

---

## 3. Third-Party Tools — Comprehensive Catalog

### Tier 1: Major Projects (1000+ stars)

#### ccstatusline (sirmalloc)

| Attribute        | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| **URL**          | https://github.com/sirmalloc/ccstatusline                     |
| **Stars**        | 5,800                                                         |
| **Version**      | v2.2.6                                                        |
| **Language**     | Node.js (React + Ink for TUI)                                 |
| **Last Updated** | Active (210 commits)                                          |
| **Windows**      | Full support (PowerShell 5.1+, CMD, WSL)                      |
| **Install**      | `npx -y ccstatusline@latest` or `bunx -y ccstatusline@latest` |

**What it does:** The most feature-rich statusline tool. Widget-based
architecture with 30+ widgets, Powerline styling, interactive TUI configuration,
multi-line support.

**Key widgets:** Model Name, Session Duration, Git Branch/Status/Worktree/Root
Dir/Insertions/Deletions, Total/Input/Output Tokens, Session/Weekly Usage, Block
Reset Timer, Context Bar/Percentage, Input/Output/Total Speed, Memory Usage, Vim
Mode, Block Timer, Session Cost, Custom Text, Link (OSC8), Thinking Effort,
Skills.

**Themes:** Multiple built-in, custom color support (16/256/truecolor).

**Notable:** This is the project referenced in the official Claude Code docs as
a community tool. The `mapleleafu/ccstatusline` from our prior research (Session
#229) now 404s — this sirmalloc version appears to be the canonical successor or
a rename.

---

#### CCometixLine (Haleclipse)

| Attribute        | Value                                               |
| ---------------- | --------------------------------------------------- |
| **URL**          | https://github.com/Haleclipse/CCometixLine          |
| **Stars**        | 2,300                                               |
| **Version**      | Latest (81 commits)                                 |
| **Language**     | Rust                                                |
| **Last Updated** | Active                                              |
| **Windows**      | Yes (pre-built binaries, winget package)            |
| **Install**      | `npm install -g @cometix/ccline` or download binary |

**What it does:** High-performance Rust binary. Interactive TUI configuration,
TOML config files, multiple built-in themes (cometix, minimal, gruvbox, nord,
powerline-dark). Also includes Claude Code "enhancement utilities" (context
warning suppression, verbose mode activation).

**Config location:** `~/.claude/ccline/` **Segments:** Directory, Git, Model,
Usage, Time, Cost, OutputStyle

---

### Tier 2: Popular Projects (100-999 stars)

#### claude-powerline (Owloops)

| Attribute        | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| **URL**          | https://github.com/Owloops/claude-powerline                 |
| **Stars**        | 947                                                         |
| **Version**      | ~v1.0.81                                                    |
| **Language**     | Node.js                                                     |
| **Last Updated** | Active (297 commits, 64 forks)                              |
| **Windows**      | Yes (Node.js/NPM ecosystem)                                 |
| **Install**      | `npx -y @owloops/claude-powerline@latest --style=powerline` |

**What it does:** Vim-style powerline with real-time usage tracking. Six themes
(Dark, Light, Nord, Tokyo Night, Rose Pine, Gruvbox), four styles (Minimal,
Powerline, Capsule, TUI). Zero dependencies. Responsive design across three
breakpoints. Budget tracking with session/daily/5-hour block limits.

**Unique features:** Tmux session tracking, auto-compact buffer for context
display, 10+ context display styles (text, bar, blocks, dots, lines, squares).

---

#### cc-statusline (chongdashu)

| Attribute    | Value                                       |
| ------------ | ------------------------------------------- |
| **URL**      | https://github.com/chongdashu/cc-statusline |
| **Stars**    | 532                                         |
| **Language** | Bash + jq                                   |
| **Windows**  | Yes (Win 10/11, Chocolatey/Scoop/Winget)    |
| **Install**  | `npx @chongdashu/cc-statusline@latest init` |

**What it does:** Bash-based, lightweight. Git branch, model info, context
visualization, live cost monitoring with hourly burn rates, session timer with
usage limit reset countdown. Integrates with ccusage for usage stats.

---

#### rz1989s/claude-code-statusline

| Attribute    | Value                                             |
| ------------ | ------------------------------------------------- |
| **URL**      | https://github.com/rz1989s/claude-code-statusline |
| **Stars**    | 398                                               |
| **Language** | Bash/Shell                                        |
| **Windows**  | WSL only                                          |
| **Install**  | curl one-liner                                    |

**What it does:** "Atomic precision" statusline. 28 atomic components across 1-9
configurable lines. TOML config at `~/.claude/statusline/Config.toml`. Unique
features: MCP monitoring, Islamic prayer times integration, 28+ themes
(including Catppuccin), burn rate monitoring, cache efficiency tracking, cost
projections.

---

#### cship (stephenleo)

| Attribute    | Value                                      |
| ------------ | ------------------------------------------ |
| **URL**      | https://github.com/stephenleo/cship        |
| **Stars**    | 262                                        |
| **Language** | Rust                                       |
| **Windows**  | Not documented (macOS/Linux binaries only) |
| **Install**  | curl installer or `cargo install`          |

**What it does:** Blazing-fast Rust implementation with **Starship
passthrough**. Can embed Starship modules (`$directory`, `$git_branch`,
`$git_status`) alongside native `$cship.*` tokens. Rendering budget under 10ms.
Full Starship TOML compatibility.

---

#### claude-code-usage-bar (leeguooooo)

| Attribute    | Value                                               |
| ------------ | --------------------------------------------------- |
| **URL**      | https://github.com/leeguooooo/claude-code-usage-bar |
| **Stars**    | 163                                                 |
| **Language** | Python                                              |
| **Windows**  | Not documented (Unix-focused)                       |
| **Install**  | curl one-liner or pip/uv/pipx                       |

**What it does:** Focused on token usage tracking. Shows current session cost,
today's total, remaining budget, burn rate, depletion time estimate. P90 limits
with color-coded thresholds.

---

### Tier 3: Niche / New Projects

#### starship-claude (martinemde)

| Attribute    | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| **URL**      | https://github.com/martinemde/starship-claude                            |
| **Stars**    | 56                                                                       |
| **Language** | Shell + Starship                                                         |
| **Windows**  | Not documented                                                           |
| **Install**  | Plugin marketplace: `/plugin marketplace add martinemde/starship-claude` |

**What it does:** Renders statusline via Starship. Context progress bar with
"Dex Horthy dumb zone" methodology (warnings at 40% capacity). Setup wizard via
`/starship` slash command. Referenced in official Claude Code docs.

---

#### claude-statusline (felipeelias)

| Attribute    | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| **URL**      | https://github.com/felipeelias/claude-statusline                 |
| **Stars**    | 2                                                                |
| **Version**  | v0.4.0                                                           |
| **Language** | Go                                                               |
| **Released** | March 17, 2026                                                   |
| **Install**  | `brew install felipeelias/tap/claude-statusline` or `go install` |

**What it does:** Single Go binary, Starship-inspired design. Presets, format
strings, per-module config. Seven modules: directory, git branch, model, cost,
context, elapsed time, lines changed. Six preset themes.
`claude-statusline test` command for iterating on config without Claude Code
running.

**Notable:** Very new (6 days old). Despite low stars, the Go binary approach
and `test` command are genuinely useful design choices.

---

#### ccstatusline (syou6162)

| Attribute        | Value                                    |
| ---------------- | ---------------------------------------- |
| **URL**          | https://github.com/syou6162/ccstatusline |
| **Stars**        | 9                                        |
| **Language**     | Go                                       |
| **Last Updated** | January 2025                             |
| **Install**      | Go binary                                |

**What it does:** YAML-based configuration with `{.field}` template syntax for
JQ queries. TTL-based caching, XDG-compliant paths. Lightweight alternative.

---

#### levz0r/claude-code-statusline

| Attribute        | Value                                            |
| ---------------- | ------------------------------------------------ |
| **URL**          | https://github.com/levz0r/claude-code-statusline |
| **Stars**        | 1                                                |
| **Language**     | Bash + PowerShell                                |
| **Last Updated** | October 2025                                     |
| **Windows**      | PowerShell version available (untested)          |

**What it does:** Simple bash script. Parses transcript file for token costs.
Color-coded display. Both bash and PowerShell versions included.

---

### Honorable Mentions (Found but not deeply surveyed)

| Tool                                    | URL                                                      | Notes                           |
| --------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| claude-statusline-powerline (spences10) | https://github.com/spences10/claude-statusline-powerline | Powerline-style with git + cost |
| glebis/claude-statusline                | https://github.com/glebis/claude-statusline              | Right-aligned token tracking    |
| sotayamashita/claude-code-statusline    | https://github.com/sotayamashita/claude-code-statusline  | Minimal implementation          |
| @illumin8ca/claude-statusline           | NPM package                                              | Published on npm                |
| cccost (badlogic)                       | https://github.com/badlogic/cccost                       | Token usage instrumentation     |

---

## 4. ccusage Statusline Integration

**URL:** https://ccusage.com/guide/statusline **Stars:** High (ccusage is a
major Claude Code usage analysis tool)

Not a standalone statusline — ccusage has a `statusline` subcommand that
provides a compact, real-time view of usage data designed to integrate with
Claude Code's statusline hook.

**Displays:** Current session cost, today's total cost, current block with cost
and time remaining, burn rate, active model.

**Config:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline"
  }
}
```

**Features:** Cache token support, offline mode, MCP integration, multi-instance
grouping by project, timezone support.

---

## 5. Plugin Marketplace & Ecosystem

Anthropic launched the **official Claude Code plugin directory** in early 2026:

- 72+ plugins across 24 categories
- Browse via `/plugin` > Discover tab, or at claude.com/plugins
- Official repo: https://github.com/anthropics/claude-plugins-official
- Plugins package slash commands, agents, MCP servers, and workflow hooks
- starship-claude is available via the marketplace (`/plugin marketplace add`)
- Enterprise plugins now available for department-specific use cases

**Relevance to statusline:** The `source: 'settings'` plugin source (v2.1.81)
allows declaring plugin entries inline in settings.json, which could interact
with statusline configuration.

---

## 6. What Changed Since Prior Research (March 19-20)

### Changes in 3 days:

1. **v2.1.81 released (March 20):** Added `rate_limits` field to statusline JSON
   (5-hour and 7-day windows for Pro/Max subscribers)
2. **claude-statusline (Go) launched (March 17):** New Go-based tool by
   felipeelias with Starship-inspired design
3. **mapleleafu/ccstatusline is now 404:** The repo from our prior research no
   longer exists. sirmalloc/ccstatusline (5.8k stars) is the dominant project
   under the ccstatusline name
4. **Plugin marketplace matured:** More statusline tools discoverable via
   `/plugin`
5. **No other major new tools** in the 3-day window

### Prior research corrections:

- "ccstatusline" in Session #229 notes referred to what is now
  `sirmalloc/ccstatusline` (5.8k stars, v2.2.6)
- The "widget-rich" characterization remains accurate — 30+ widgets now

---

## 7. Comparison Matrix — Windows Support Focus

| Tool                 | Windows Native | WSL | PowerShell | Node.js  | Notes                             |
| -------------------- | :------------: | :-: | :--------: | :------: | --------------------------------- |
| **Built-in**         |      Yes       | Yes |    Yes     |   N/A    | Git Bash or PowerShell            |
| **ccstatusline**     |      Yes       | Yes |    Yes     | Required | Full PowerShell 5.1+ support      |
| **CCometixLine**     |      Yes       | Yes |     -      | Optional | Pre-built .exe, winget package    |
| **claude-powerline** |      Yes       | Yes |     -      | Required | NPX-based                         |
| **cc-statusline**    |      Yes       | Yes |     -      | Required | Chocolatey/Scoop/Winget           |
| **rz1989s**          |       -        | Yes |     -      |    -     | WSL only                          |
| **cship**            |       -        |  -  |     -      |    -     | macOS/Linux only                  |
| **usage-bar**        |       -        |  -  |     -      |    -     | Unix-focused                      |
| **starship-claude**  |       -        |  -  |     -      |    -     | Not documented                    |
| **felipeelias**      |     Likely     |  -  |     -      |    -     | Go binary, cross-compile possible |
| **SoNash built-in**  |      Yes       | N/A |    N/A     | Required | Our existing statusline.js        |

---

## 8. Relevance to SoNash Custom Statusline

### Our existing implementation

File: `.claude/hooks/global/statusline.js`

- Node.js script, 119 lines
- Widgets: model, branch, current task (from todo files), directory, context bar
- Color-coded context usage with threshold warnings
- Windows-compatible (uses `execFileSync` with `windowsHide`)
- Security: sanitizes all dynamic values against control chars and ANSI
  injection

### What third-party tools offer that we don't

1. **Cost tracking** (session cost, burn rate, projections)
2. **Rate limit display** (new in v2.1.81 — `rate_limits.*`)
3. **Token speed** (input/output tokens per second)
4. **Worktree awareness** (`worktree.*` fields)
5. **Multi-line layouts** (we use single line)
6. **Caching of expensive operations** (git calls)
7. **TOML/YAML config** instead of hardcoded layout
8. **Clickable links** (OSC 8 sequences)

### What we have that they don't

1. **GSD task tracking** (reads todo files for in-progress task)
2. **Project-specific widgets** (debt ticker, hook health, health grade —
   planned)
3. **Deep integration** with SoNash tooling (hook-runs.jsonl, metrics.json,
   etc.)

### Recommendation

Do NOT replace our custom statusline.js with a third-party tool. Instead:

1. **Enhance our existing script** with select features from the ecosystem:
   - Add `rate_limits` display (from v2.1.81 JSON)
   - Add `cost.total_cost_usd` display
   - Add caching for git operations
   - Consider multi-line layout for SoNash-specific widgets
2. **Keep project-specific widgets** as our differentiator (debt, hooks, grade)
3. **Use the official JSON schema** as our API contract — it is well-documented
   and stable

---

## 9. Sources

### Official

- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline)
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog)
- [Claude Code Plugin Directory](https://code.claude.com/docs/en/discover-plugins)
- [Official Plugin Repo](https://github.com/anthropics/claude-plugins-official)

### Major Tools

- [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) — 5.8k
  stars
- [Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine) — 2.3k
  stars
- [Owloops/claude-powerline](https://github.com/Owloops/claude-powerline) — 947
  stars
- [chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline) — 532
  stars
- [rz1989s/claude-code-statusline](https://github.com/rz1989s/claude-code-statusline)
  — 398 stars
- [stephenleo/cship](https://github.com/stephenleo/cship) — 262 stars
- [leeguooooo/claude-code-usage-bar](https://github.com/leeguooooo/claude-code-usage-bar)
  — 163 stars

### Integrations

- [martinemde/starship-claude](https://github.com/martinemde/starship-claude) —
  56 stars
- [felipeelias/claude-statusline](https://github.com/felipeelias/claude-statusline)
  — Go binary
- [ccusage Statusline](https://ccusage.com/guide/statusline) — Usage analysis
  integration

### Community

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) —
  Curated list
- [Claudetory Status Lines](https://claudetory.com/statuslines) — Directory
- [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)
  — Comprehensive toolkit
- [ClaudeLog ccstatusline](https://claudelog.com/claude-code-mcps/ccstatusline/)
  — Guide

### Blog Posts & Articles

- [felipeelias blog post](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
  — Go tool announcement
- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- [Claude HUD: Real-Time Observability](https://pub.towardsai.net/claude-hud-building-real-time-observability-for-claude-code-via-the-statusline-api-b114b825d3ef)
- [DEV Community: Build Your Dream Status Bar](https://dev.to/rajeshroyal/statusline-build-your-dream-status-bar-for-claude-code-50p5)
- [Dan Does Code: Custom Statusline](https://www.dandoescode.com/blog/claude-code-custom-statusline)
