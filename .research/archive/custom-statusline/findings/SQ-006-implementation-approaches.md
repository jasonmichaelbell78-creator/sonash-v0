# SQ-006: Implementation Approaches for a Custom Claude Code Statusline

**Research Date:** 2026-03-23 **Status:** COMPLETE **Researcher:** Claude Agent
(SQ-006 sub-question) **Prior Art:** SQ-001 (tools landscape), SQ-002 (terminal
frameworks), SQ-003 (visual layouts), Session #229 (initial research)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [How Claude Code Statusline Works (Constraints)](#2-how-claude-code-statusline-works)
3. [Approach A: Enhanced Monolith](#approach-a-enhanced-monolith)
4. [Approach B: Adopt ccstatusline](#approach-b-adopt-ccstatusline)
5. [Approach C: Hybrid ccstatusline + Custom Overlay](#approach-c-hybrid-ccstatusline--custom-overlay)
6. [Approach D: Compiled Binary (Go or Rust)](#approach-d-compiled-binary-go-or-rust)
7. [Approach E: Shell-Native (Bash + jq)](#approach-e-shell-native-bash--jq)
8. [Approach F: Plugin Marketplace](#approach-f-plugin-marketplace)
9. [Approach G: Starship Custom Module (via CShip)](#approach-g-starship-custom-module-via-cship)
10. [Approach H: PowerShell-Native](#approach-h-powershell-native)
11. [Approach I: Wrapper/Compositor Pattern](#approach-i-wrappercompositor-pattern)
12. [Comparison Matrix](#comparison-matrix)
13. [Recommendation](#recommendation)

---

## 1. Executive Summary

There are **9 distinct implementation approaches** for building a custom Claude
Code statusline, not just the 2 originally considered ("enhance monolith" and
"fork ccstatusline"). Each has fundamentally different trade-offs in
performance, maintainability, Windows compatibility, and ability to show
SoNash-specific widgets.

**The critical constraint** that shapes all options: Claude Code executes
exactly **one** `statusLine.command` from settings.json. It pipes a JSON blob to
stdin on every update (throttled to 300ms). Whatever the command prints to
stdout (first line only) becomes the statusline. This means:

- You cannot have two statusline hooks running in parallel natively
- Any "hybrid" approach requires a wrapper script that orchestrates multiple
  tools
- Performance budget is tight: ~300ms between invocations, with visible lag if
  your script takes >100ms

**Key finding:** The fnm overhead problem (100-300ms per invocation of
`ensure-fnm.sh`) is the single biggest performance bottleneck. The current
project-level settings.json routes the statusline through
`bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js`,
while the global `~/.claude/settings.json` invokes
`node /c/Users/jbell/.local/bin/sonash-v0/.claude/hooks/global/statusline.js`
directly. **Any approach that eliminates the fnm shim wins significant
performance.**

---

## 2. How Claude Code Statusline Works

### Architecture (from official docs + SQ-001 research)

```
Claude Code Runtime
    |
    | (pipes JSON to stdin on each update)
    | (throttled: max every 300ms)
    | (in-flight executions cancelled on new trigger)
    v
statusLine.command (from settings.json)
    |
    | (reads JSON from stdin)
    | (prints formatted text to stdout)
    v
Claude Code renders first line of stdout as statusline
```

### Configuration

```json
{
  "statusLine": {
    "type": "command",
    "command": "<your-script-or-binary>"
  }
}
```

### Trigger events

- After each assistant message
- On permission mode change
- On vim mode toggle
- Debounced at 300ms; in-flight executions cancelled

### JSON fields available (stdin)

Full schema documented in SQ-001. Key fields: `model.*`, `cwd`, `workspace.*`,
`cost.*`, `context_window.*`, `rate_limits.*` (Pro/Max), `session_id`, `vim.*`,
`agent.*`, `worktree.*`.

### SoNash-specific widgets needed

These require reading from the local filesystem, NOT from the stdin JSON:

| Widget                     | Data Source                                   | Read Cost                               |
| -------------------------- | --------------------------------------------- | --------------------------------------- |
| Debt ticker (e.g., `D:47`) | `docs/technical-debt/INDEX.md` or MASTER_DEBT | File read + parse                       |
| Hook health (e.g., `H:OK`) | `.claude/state/hook-runs.jsonl`               | File read (tail)                        |
| Health grade (e.g., `A-`)  | Computed from multiple sources                | Multiple file reads                     |
| GSD task (current)         | `~/.claude/todos/{session}-agent-*.json`      | File read + parse (already implemented) |

---

## Approach A: Enhanced Monolith

### Description

Keep the existing `statusline.js` (119 lines). Add new widgets inline with
individual try/catch blocks per widget. Optimize the fnm overhead by switching
the global settings.json invocation to use direct `node` (which already works at
`~/.claude/settings.json`).

### Current state

```
.claude/hooks/global/statusline.js — 119 lines, Node.js
Widgets: model, git branch, current task, directory, context bar
Invocation: bash ensure-fnm.sh node statusline.js (project) or node statusline.js (global)
```

### What to add

- `cost.total_cost_usd` display
- `rate_limits.five_hour.used_percentage` display
- Debt count widget (read INDEX.md)
- Hook health widget (tail hook-runs.jsonl)
- Caching for git operations (memoize with TTL)
- Multi-line layout option

### Effort estimate

- **Small (1-2 hours)**: Add cost + rate limits (just read from stdin JSON)
- **Medium (3-5 hours)**: Add debt/hook widgets (file reads + error handling)
- **Medium (2-4 hours)**: Add caching, optimize performance
- **Total: 6-11 hours**

### Performance characteristics

| Metric                     | Current   | After optimization        |
| -------------------------- | --------- | ------------------------- |
| Cold start (with fnm shim) | 150-400ms | N/A (eliminate shim)      |
| Cold start (direct node)   | 30-80ms   | 30-80ms                   |
| Warm execution             | 15-40ms   | 10-30ms (with caching)    |
| Git branch call            | 10-50ms   | cached, 0ms (TTL refresh) |
| File reads (debt/hooks)    | N/A       | 5-15ms per file           |

### Windows compatibility

Fully compatible. Already works. Uses `execFileSync` with `windowsHide: true`.

### SoNash-specific widgets

Full control. Can read any local file, parse any format, compute any metric.

### Maintenance burden

**Low-Medium.** Single file, single language (JS), no external dependencies.
Grows linearly with widgets. At ~200 lines it remains manageable; at ~400+ it
becomes unwieldy.

### Pros

- Zero migration cost
- Full control over every widget
- No new dependencies
- Already tested and working
- Same language as the rest of the project's tooling

### Cons

- Node.js cold start overhead (30-80ms even without fnm)
- Single-file monolith will get unwieldy past ~300 lines
- No configuration file (layout hardcoded)
- No interactive setup (manual editing)
- Re-inventing widgets that mature tools already provide

---

## Approach B: Adopt ccstatusline (sirmalloc, 5.8k stars)

### Description

Replace the custom statusline.js entirely with `ccstatusline`. Install via
`npx -y ccstatusline@latest` or `bunx -y ccstatusline@latest`. Configure via its
interactive TUI. Use its 30+ built-in widgets for standard metrics.

### How it works

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline@latest"
  }
}
```

ccstatusline reads the same JSON from stdin, applies its widget/theme
configuration, outputs a formatted statusline.

### What it provides out of the box

Model Name, Session Duration, Git Branch/Status/Worktree/Root/Insertions/
Deletions, Total/Input/Output Tokens, Session/Weekly Usage, Block Reset Timer,
Context Bar/Percentage, Input/Output/Total Speed, Memory Usage, Vim Mode, Block
Timer, Session Cost, Custom Text, Link (OSC8), Thinking Effort, Skills, Off Peak
Status.

### What it CANNOT provide

- GSD task tracking (reads SoNash-specific todo files)
- Debt ticker (SoNash-specific file format)
- Hook health (SoNash-specific state files)
- Health grade (SoNash-specific computation)

### Effort estimate

- **Trivial (15-30 min)**: Install, configure via TUI, update settings.json
- **Total: 30 minutes** (but loses all SoNash-specific widgets)

### Performance characteristics

| Metric                      | Value                                          |
| --------------------------- | ---------------------------------------------- |
| Cold start (npx)            | 500-2000ms (npm registry check + node_modules) |
| Cold start (global install) | 80-150ms (Node.js + React/Ink rendering)       |
| Warm execution              | 40-80ms                                        |

**Note:** ccstatusline uses React + Ink for TUI rendering, which adds overhead
compared to a raw Node.js script. The `npx` invocation is particularly slow due
to the npm registry check on each invocation.

### Windows compatibility

**Full support.** PowerShell 5.1+, CMD, WSL. Explicitly tested and documented.

### SoNash-specific widgets

**Limited.** The `custom-command` widget can execute arbitrary shell commands
and display their output. You could write small shell scripts that read SoNash
state files and pipe through jq. But this adds complexity and latency (each
custom-command widget spawns a subprocess).

### Maintenance burden

**Very Low** for standard widgets. **Medium** for custom-command widgets
(maintaining wrapper scripts).

### Pros

- 30+ widgets out of the box
- Active community (5.8k stars, 210 commits)
- Themes, multi-line, Powerline styling
- Interactive TUI configuration
- Referenced in official Claude Code docs

### Cons

- Loses all SoNash-specific widgets (task, debt, hooks, grade)
- React/Ink overhead for rendering
- npx cold start is unacceptably slow; requires global install
- External dependency (version churn, breaking changes)
- Custom-command widgets add per-widget subprocess overhead
- No control over rendering pipeline

---

## Approach C: Hybrid ccstatusline + Custom Overlay

### Description

Use ccstatusline for generic widgets (model, cost, tokens, rate limits, git),
then append SoNash-specific widgets from a custom script. Since Claude Code only
supports ONE statusline command, this requires a **wrapper script** that
orchestrates both tools.

### Technical feasibility

**Yes, this is possible.** The community has established a "wrapper/compositor"
pattern:

```bash
#!/bin/bash
# statusline-wrapper.sh
INPUT=$(cat)  # Read JSON from stdin once

# Get ccstatusline output (generic widgets)
GENERIC=$(echo "$INPUT" | npx -y ccstatusline@latest 2>/dev/null)

# Get SoNash-specific widgets
DEBT=$(node -e "..." 2>/dev/null)
HOOKS=$(node -e "..." 2>/dev/null)

# Combine
echo "${GENERIC} | ${DEBT} | ${HOOKS}"
```

### How two statusline sources coexist

They don't coexist as separate hooks. Claude Code runs ONE command. The wrapper
script:

1. Captures stdin (JSON) into a variable
2. Pipes it to ccstatusline for generic output
3. Pipes it (or reads files directly) for SoNash-specific output
4. Concatenates and prints the combined result

### Effort estimate

- **Small (1 hour)**: Write wrapper script
- **Small (30 min)**: Configure ccstatusline for generic widgets
- **Medium (3-5 hours)**: Write SoNash widget mini-scripts
- **Total: 5-7 hours**

### Performance characteristics

| Metric                | Value                                    |
| --------------------- | ---------------------------------------- |
| Wrapper overhead      | 5-10ms (bash startup)                    |
| ccstatusline call     | 80-150ms (global install)                |
| SoNash widget scripts | 30-80ms (node cold start per invocation) |
| **Total**             | **115-240ms**                            |

**This is too slow.** Running ccstatusline AND separate node processes for
custom widgets pushes the total past 200ms, causing noticeable lag. The
sequential execution of multiple subprocesses is the bottleneck.

### Windows compatibility

**Fragile.** The bash wrapper works through Git Bash, but spawning multiple
subprocesses (npx + node) in sequence on Windows Git Bash adds extra latency.
Environment variable passing between bash/node can be unreliable.

### SoNash-specific widgets

**Full capability** but at a performance cost. Each widget is a separate
subprocess.

### Maintenance burden

**High.** Three moving parts (wrapper, ccstatusline config, SoNash widget
scripts). Any ccstatusline update could change output format, breaking the
wrapper's string concatenation.

### Pros

- Best of both worlds conceptually
- Leverage ccstatusline's mature widget library
- Keep SoNash-specific widgets

### Cons

- **Performance is the dealbreaker** (115-240ms total)
- Three layers of abstraction to debug
- Fragile string concatenation between tools
- Windows compatibility is weakest here
- Version coupling between ccstatusline and wrapper

---

## Approach D: Compiled Binary (Go or Rust)

### Description

Write the statusline in Go or Rust. Compile to a native binary. Zero runtime
dependencies (no Node.js, no fnm, no npm). The binary reads JSON from stdin,
reads local files for SoNash widgets, outputs formatted text.

### Go variant

```toml
# Config: ~/.config/sonash-statusline/config.toml
[widgets]
model = true
cost = true
context_bar = true
debt_ticker = true
hook_health = true
```

Go binary reads config, parses stdin JSON, reads SoNash state files, outputs
formatted statusline.

**Reference implementations:**

- `felipeelias/claude-statusline` (Go, 2 stars but solid design)
- `syou6162/ccstatusline` (Go, YAML-based config)

### Rust variant

**Reference implementations:**

- `CCometixLine` (Rust, 2.3k stars, TOML config)
- `cship` (Rust, Starship passthrough, 262 stars)

### Effort estimate

**For Go (AI-assisted development):**

- **Medium (4-6 hours)**: Core binary (stdin parse, stdout format, file reads)
- **Small (1-2 hours)**: TOML config parsing
- **Small (1 hour)**: Cross-compile for Windows
- **Total: 6-9 hours**

**For Rust (AI-assisted development):**

- **Medium-High (8-12 hours)**: Core binary (steeper learning curve)
- **Total: 10-15 hours**

**Feasibility for a non-developer directed by AI:** Go is realistic. The
language is simple, `go build` cross-compiles trivially
(`GOOS=windows GOARCH=amd64 go build`), and Claude can write the entire binary.
Rust is harder due to the borrow checker and more complex toolchain, but still
possible.

**Note:** Go 1.23.6 is installed on this machine at `/c/Users/jbell/go/bin/go`.

### Performance characteristics

| Metric     | Go         | Rust       | Node.js (current) |
| ---------- | ---------- | ---------- | ----------------- |
| Cold start | 1-5ms      | 1-3ms      | 30-80ms           |
| JSON parse | <1ms       | <1ms       | 2-5ms             |
| File reads | 1-3ms      | 1-2ms      | 5-15ms            |
| Git branch | 5-20ms     | 5-20ms     | 10-50ms           |
| **Total**  | **8-29ms** | **7-26ms** | **47-150ms**      |

**This eliminates the fnm overhead entirely.** No Node.js runtime needed. No
npm. No shim scripts. Binary cold start is effectively instant.

### Windows compatibility

**Excellent.** Both Go and Rust cross-compile to Windows natively. Single .exe
binary, no runtime dependencies. No PATH issues, no fnm, no shell wrapper.

### SoNash-specific widgets

**Full capability.** The binary can read any local file, parse JSON/JSONL,
compute health grades, count debt items. All the same capabilities as Node.js
but faster.

### Maintenance burden

**Low** once built. Binary is self-contained. Updates require recompilation, but
AI can generate the code changes. No dependency tree to manage. No npm audit
alerts.

### Pros

- **Fastest possible execution** (1-5ms cold start)
- **Zero runtime dependencies** (single binary)
- **Eliminates fnm overhead entirely**
- Cross-platform by default
- No dependency management (npm, node_modules)
- Small binary size (~2-5MB for Go, ~1-3MB for Rust)

### Cons

- Higher initial development effort than enhancing statusline.js
- Requires Go or Rust toolchain for compilation
- Two languages in the project (JS/TS for app, Go/Rust for statusline)
- Harder to iterate quickly (compile step)
- User must install Go/Rust toolchain (Go already installed on this machine)

---

## Approach E: Shell-Native (Bash + jq)

### Description

Pure bash statusline script using `jq` for JSON parsing. No Node.js dependency
at all. Fastest possible startup after compiled binaries.

### Implementation sketch

```bash
#!/bin/bash
# statusline.sh - Pure bash + jq statusline
INPUT=$(cat)
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "Claude"')
COST=$(echo "$INPUT" | jq -r '.cost.total_cost_usd // 0' | xargs printf '$%.2f')
CTX=$(echo "$INPUT" | jq -r '.context_window.used_percentage // 0')
BRANCH=$(git -C "$(echo "$INPUT" | jq -r '.cwd')" rev-parse --abbrev-ref HEAD 2>/dev/null)

# SoNash widgets (file reads)
DEBT_COUNT=$(grep -c "^| DEBT-" docs/technical-debt/INDEX.md 2>/dev/null || echo "?")

# Output
printf "\e[2m%s\e[0m | \e[36m%s\e[0m | %s | D:%s | Ctx:%s%%" \
  "$MODEL" "$BRANCH" "$COST" "$DEBT_COUNT" "$CTX"
```

### Reference implementations

- `chongdashu/cc-statusline` (Bash + jq, 532 stars)
- `shanraisshan/claude-code-status-line` (Bash, simple)
- `rz1989s/claude-code-statusline` (Bash/Shell, 398 stars, 28 atomic components)
- Official docs example (simple bash + jq)

### Effort estimate

- **Small (1-2 hours)**: Basic widgets (model, branch, cost, context)
- **Small (1-2 hours)**: SoNash widgets (debt, hooks)
- **Small (1 hour)**: Color coding, formatting
- **Total: 3-5 hours**

### Performance characteristics

| Metric              | Value                |
| ------------------- | -------------------- |
| Bash startup        | 5-15ms               |
| jq invocations (5x) | 15-40ms (5-8ms each) |
| Git branch call     | 10-50ms              |
| grep for debt count | 2-5ms                |
| **Total**           | **32-110ms**         |

**Multiple jq invocations are the bottleneck.** Each `echo | jq` spawns a
subprocess. This can be mitigated by using a single jq call that extracts all
fields at once:

```bash
read -r MODEL COST CTX <<< $(echo "$INPUT" | jq -r '[.model.display_name, .cost.total_cost_usd, .context_window.used_percentage] | @tsv')
```

With single-jq optimization: **20-70ms total.**

### Windows compatibility

**Good with caveats.** Bash is available through Git Bash (which Claude Code
uses on Windows). `jq` must be installed separately (already at
`/c/Users/jbell/bin/jq.exe` on this machine). Git is available. File reads work.
The main issue is that bash on Windows (Git Bash / MSYS2) has higher subprocess
spawn overhead than on Linux/macOS.

### SoNash-specific widgets

**Moderate.** File reads and grep work fine. Complex computations (health grade
calculation, JSONL parsing with date math) are painful in bash. Anything beyond
simple counts/greps requires awk or external tools.

### Maintenance burden

**Low for simple scripts, high for complex ones.** Bash scripts over ~100 lines
become difficult to maintain, test, and debug. No type safety, no error handling
beyond `|| echo "?"`, no test framework.

### Pros

- No Node.js dependency
- Fast startup (20-70ms with optimization)
- Simple to understand and modify
- Widely portable
- Official docs endorse this approach

### Cons

- Complex widgets are painful in bash
- No type safety or structured error handling
- Multiple jq calls are slow (mitigatable)
- JSONL parsing (for hook health) is awkward
- Hard to unit test
- Bash on Windows is slower than on Unix
- Script becomes unmaintainable past ~150 lines

---

## Approach F: Plugin Marketplace

### Description

Package the SoNash statusline as a Claude Code plugin and distribute it via the
official plugin marketplace (or a private marketplace for enterprise use).

### How it works

Anthropic launched the official Claude Code plugin directory in early 2026:

- 72+ plugins across 24 categories
- Browse via `/plugin` > Discover tab, or at claude.com/plugins
- Official repo: `anthropics/claude-plugins-official`
- Plugins package slash commands, agents, MCP servers, and workflow hooks
- `starship-claude` is already available via the marketplace

**Private marketplace support** (launched Feb 2026):

- Enterprise admins can create private marketplaces
- Per-user provisioning, auto-install, team-specific visibility
- Claude Code supports installing plugins from private repositories using
  existing git credential helpers

### Can SoNash-specific widgets be published as a private plugin?

**Partially.** A plugin can provide a statusline script, but:

1. The plugin would need to know SoNash's file paths (project-specific)
2. The plugin would need to be installed in every Claude Code session
3. Plugins primarily package slash commands, agents, and MCP servers -- not raw
   statusline scripts
4. The `statusLine` setting in settings.json is separate from the plugin system

**The most realistic plugin approach:** Package the statusline script as part of
the SoNash project itself (which is already what we do), not as a separate
marketplace plugin. The plugin marketplace is designed for reusable,
project-agnostic tools.

### Effort estimate

- **Medium (4-6 hours)**: Package as a plugin, test distribution
- **Ongoing**: Maintain plugin packaging, handle marketplace requirements
- **Total: 4-6 hours initial + ongoing**

### Performance characteristics

Same as whatever the underlying statusline implementation is (the plugin is just
a distribution mechanism, not a runtime).

### Windows compatibility

Depends on the underlying implementation.

### SoNash-specific widgets

The fundamental tension: plugins are designed to be project-agnostic. SoNash
widgets are project-specific. A plugin that only works for one project is not a
good fit for the marketplace model.

### Maintenance burden

**High.** Plugin packaging, versioning, marketplace compliance, testing across
Claude Code versions. Overkill for a single-project tool.

### Pros

- Professional distribution mechanism
- Automatic updates via marketplace
- Discoverable by others if published publicly

### Cons

- **Wrong abstraction level** for project-specific widgets
- Adds packaging overhead for no benefit (single user, single project)
- Plugin system is for reusable tools, not project-specific configs
- Statusline scripts are already distributable via the project repo

### Verdict

**Not recommended.** The plugin marketplace solves a distribution problem that
SoNash doesn't have. The statusline script is already in the project repo and
configured via settings.json.

---

## Approach G: Starship Custom Module (via CShip)

### Description

Use Starship (or CShip, which extends Starship) to render the statusline.
Starship is a cross-platform, blazing-fast prompt renderer written in Rust.
CShip adds Claude Code-specific modules with full Starship passthrough.

### Two sub-approaches

**G1: Pure Starship custom module**

Add a `[custom.sonash]` section to `starship.toml` that executes a shell command
to read SoNash state:

```toml
[custom.sonash_debt]
command = "grep -c '^| DEBT-' docs/technical-debt/INDEX.md 2>/dev/null || echo '?'"
when = "test -f docs/technical-debt/INDEX.md"
format = "D:[$output]($style) "
style = "yellow"
```

**Problem:** Starship is a PROMPT renderer. It updates at prompt time (after
each shell command), NOT live between commands. Claude Code's statusline updates
after each assistant message. These are fundamentally different update models.
Starship cannot serve as a Claude Code statusline command.

**G2: CShip (Starship passthrough for Claude Code)**

CShip is a Rust binary that IS designed as a Claude Code statusline. It accepts
Starship module tokens alongside its native `$cship.*` tokens:

```toml
# cship.toml
[cship]
lines = ["$cship.model $cship.cost $git_branch $cship.context_bar"]
```

CShip renders the Claude Code statusline while allowing Starship modules
(git_branch, directory, etc.) to be embedded. It does NOT require Starship to be
installed -- it bundles its own Starship renderer.

### Effort estimate (CShip approach)

- **Small (30-60 min)**: Install CShip, configure TOML
- **Medium (2-3 hours)**: Write custom CShip modules for SoNash widgets (unclear
  if CShip supports arbitrary custom modules beyond Starship's `[custom.*]`
  format)
- **Total: 2-4 hours** (if CShip custom modules work for file reads)

### Performance characteristics

| Metric                    | CShip        |
| ------------------------- | ------------ |
| Binary startup            | 1-5ms (Rust) |
| Starship module rendering | 5-15ms       |
| Claude-specific modules   | 2-5ms        |
| **Total**                 | **8-25ms**   |

**Extremely fast.** Rust binary with optimized rendering pipeline. CShip
documents a rendering budget under 10ms.

### Windows compatibility

**CShip: Not documented.** The repo mentions macOS/Linux binaries only. Windows
would require cross-compilation or building from source. This is a significant
blocker.

**Starship itself: Excellent Windows support** (Bash, PowerShell, Cmd, etc.)

### SoNash-specific widgets

**Uncertain.** CShip's custom module support is underdocumented. Starship's
`[custom.*]` modules execute shell commands and display output, which would work
for simple file reads (debt count, hook status). Complex computations (health
grade) would need a helper script.

### Maintenance burden

**Low** for standard modules. **Medium** for custom SoNash modules. Depends on
CShip's stability and ongoing development (262 stars, active but young).

### Pros

- Blazing fast (Rust, <25ms total)
- Starship ecosystem compatibility
- TOML configuration (no code changes for layout tweaks)
- Beautiful defaults (themes, Powerline styling)

### Cons

- **Windows support unclear for CShip**
- Custom module support for project-specific data is underdocumented
- Young project (262 stars), uncertain longevity
- Cannot use pure Starship (wrong update model -- prompt-time vs live)
- Another external dependency to maintain

---

## Approach H: PowerShell-Native

### Description

Since SoNash runs on Windows, write the statusline as a PowerShell script.
Claude Code supports PowerShell statusline commands:

```json
{
  "statusLine": {
    "type": "command",
    "command": "powershell -NoProfile -File C:/Users/jbell/.claude/statusline.ps1"
  }
}
```

### Implementation sketch

```powershell
# statusline.ps1
$input = [Console]::In.ReadToEnd() | ConvertFrom-Json
$model = $input.model.display_name ?? "Claude"
$cost = '$' + [math]::Round($input.cost.total_cost_usd, 2)
$ctx = [math]::Round($input.context_window.used_percentage)
$branch = git rev-parse --abbrev-ref HEAD 2>$null

# SoNash widgets
$debtCount = (Select-String -Path "docs/technical-debt/INDEX.md" -Pattern "^\| DEBT-" | Measure-Object).Count

Write-Host "$model | $branch | $cost | D:$debtCount | Ctx:${ctx}%" -NoNewline
```

### Effort estimate

- **Small (2-3 hours)**: Core implementation
- **Small (1-2 hours)**: SoNash widgets
- **Total: 3-5 hours**

### Performance characteristics

| Metric                          | Value         |
| ------------------------------- | ------------- |
| PowerShell startup (-NoProfile) | 200-500ms     |
| JSON parsing                    | 5-10ms        |
| Git call                        | 10-50ms       |
| File reads                      | 5-15ms        |
| **Total**                       | **220-575ms** |

**PowerShell startup is the killer.** Even with `-NoProfile`, PowerShell on
Windows takes 200-500ms to start. This is worse than Node.js + fnm. The
statusline would lag visibly on every update.

### Windows compatibility

**Native.** PowerShell is the most Windows-native option. No Git Bash, no MSYS2,
no compatibility layers.

### SoNash-specific widgets

**Full capability.** PowerShell has excellent file manipulation, JSON parsing,
and string formatting. `ConvertFrom-Json` is built-in.

### Maintenance burden

**Medium.** PowerShell is a different language from the rest of the project.
Testing is harder. Cross-platform portability is poor (PowerShell Core on
Linux/macOS is possible but uncommon).

### Pros

- Most Windows-native approach
- Rich built-in JSON/file handling
- No external dependencies

### Cons

- **Unacceptable startup time** (200-500ms)
- Different language from the rest of the project
- Not cross-platform (PowerShell Core exists but is rarely used on Unix)
- Hard to test in CI

### Verdict

**Not recommended** due to PowerShell cold start overhead. The 200-500ms startup
time is worse than the current Node.js approach.

---

## Approach I: Wrapper/Compositor Pattern

### Description

A meta-approach: write a thin orchestrator script that combines output from
multiple specialized tools. This is how the community solves the "one statusline
command" limitation.

### How it works

```bash
#!/bin/bash
# statusline-compositor.sh
INPUT=$(cat)

# Source 1: ccstatusline for generic widgets
GENERIC=$(echo "$INPUT" | npx ccstatusline@latest --preset minimal 2>/dev/null)

# Source 2: Custom script for SoNash widgets
SONASH=$(echo "$INPUT" | node .claude/hooks/global/sonash-widgets.js 2>/dev/null)

# Source 3: ccusage for usage tracking
USAGE=$(echo "$INPUT" | npx ccusage@latest statusline 2>/dev/null)

# Combine
echo "${GENERIC} ${SONASH} ${USAGE}"
```

### Effort estimate

- **Small (1-2 hours)**: Write compositor
- **Medium (3-5 hours)**: Write individual widget sources
- **Total: 4-7 hours**

### Performance characteristics

**The worst of all approaches.** Each `echo | tool` spawns a subprocess. Three
subprocesses run sequentially (bash has no clean way to run them in parallel
while capturing stdout). Total is the SUM of all subprocess times.

| Source             | Time          |
| ------------------ | ------------- |
| Bash startup       | 5-15ms        |
| ccstatusline       | 80-150ms      |
| SoNash node script | 30-80ms       |
| ccusage            | 80-150ms      |
| **Total**          | **195-395ms** |

This exceeds the 300ms throttle. Claude Code would be cancelling in-flight
executions regularly.

### Windows compatibility

**Fragile.** Same issues as Approach C but worse (more subprocesses).

### Maintenance burden

**Very High.** N separate tools, N output formats, string concatenation between
them, N version management concerns.

### Verdict

**Not recommended.** The compositor pattern trades simplicity for flexibility,
but the performance cost is unacceptable. The only way this works is if all
sources are compiled binaries with <5ms startup, which defeats the purpose of
using existing tools.

---

## Comparison Matrix

### Performance (lower is better)

| Approach                               | Cold Start | Execution | Total         | Acceptable? |
| -------------------------------------- | ---------- | --------- | ------------- | :---------: |
| **D: Go binary**                       | 1-5ms      | 7-24ms    | **8-29ms**    |     YES     |
| **D: Rust binary**                     | 1-3ms      | 6-23ms    | **7-26ms**    |     YES     |
| **G: CShip (Rust)**                    | 1-5ms      | 7-20ms    | **8-25ms**    |     YES     |
| **E: Bash + jq (optimized)**           | 5-15ms     | 15-55ms   | **20-70ms**   |     YES     |
| **A: Enhanced monolith (direct node)** | 30-80ms    | 17-70ms   | **47-150ms**  |  MARGINAL   |
| **A: Enhanced monolith (fnm shim)**    | 150-400ms  | 17-70ms   | **167-470ms** |     NO      |
| **B: ccstatusline (global)**           | 80-150ms   | 40-80ms   | **120-230ms** |  MARGINAL   |
| **C: Hybrid**                          | 85-160ms   | 30-80ms   | **115-240ms** |     NO      |
| **H: PowerShell**                      | 200-500ms  | 20-75ms   | **220-575ms** |     NO      |
| **I: Compositor**                      | 5-15ms     | 190-380ms | **195-395ms** |     NO      |

### Capability Matrix

| Approach                 | SoNash Widgets | Config File | Themes  | Multi-line | Effort |
| ------------------------ | :------------: | :---------: | :-----: | :--------: | ------ |
| **A: Enhanced monolith** |      FULL      |     No      |   No    |   Manual   | 6-11h  |
| **B: ccstatusline**      |     NONE\*     |     TUI     |   Yes   |    Yes     | 30min  |
| **C: Hybrid**            |      FULL      |   Partial   |   Yes   |    Yes     | 5-7h   |
| **D: Go binary**         |      FULL      |    TOML     | Custom  |   Custom   | 6-9h   |
| **D: Rust binary**       |      FULL      |    TOML     | Custom  |   Custom   | 10-15h |
| **E: Bash + jq**         |    MODERATE    |     No      |   No    |   Manual   | 3-5h   |
| **F: Plugin**            |      FULL      |     N/A     |   N/A   |    N/A     | 4-6h   |
| **G: CShip**             |   UNCERTAIN    |    TOML     |   Yes   |    Yes     | 2-4h   |
| **H: PowerShell**        |      FULL      |     No      |   No    |   Manual   | 3-5h   |
| **I: Compositor**        |      FULL      |     No      | Partial |     No     | 4-7h   |

\*ccstatusline has custom-command widgets, but each spawns a subprocess.

### Windows Compatibility

| Approach                 | Windows Native | Git Bash | Notes                 |
| ------------------------ | :------------: | :------: | --------------------- |
| **A: Enhanced monolith** |    Via Node    |   Yes    | Already working       |
| **B: ccstatusline**      |      Yes       |   Yes    | Documented support    |
| **D: Go binary**         |   Yes (.exe)   |   Yes    | Cross-compile trivial |
| **E: Bash + jq**         |      N/A       |   Yes    | Requires jq install   |
| **G: CShip**             |    Unknown     | Unknown  | Not documented        |
| **H: PowerShell**        |      Yes       |   N/A    | Native but slow       |

### Maintenance Burden

| Approach                 | Dependencies           | Languages    | Update Frequency  | Risk   |
| ------------------------ | ---------------------- | ------------ | ----------------- | ------ |
| **A: Enhanced monolith** | Node.js                | JS           | As needed         | Low    |
| **B: ccstatusline**      | Node.js, npm           | N/A (config) | External releases | Medium |
| **D: Go binary**         | Go (build only)        | Go + JS      | As needed         | Low    |
| **E: Bash + jq**         | jq                     | Bash         | As needed         | Low    |
| **G: CShip**             | Rust (build) or binary | TOML         | External releases | Medium |

---

## Recommendation

### Tier 1: Recommended Approaches

**Winner: Approach D (Go binary)** for maximum performance and zero runtime
dependencies.

- Go is already installed on this machine
- AI can write the entire binary (Go is simple enough for AI-directed
  development)
- 8-29ms total execution eliminates all performance concerns
- Single .exe binary, no fnm/npm/node runtime needed
- TOML config for layout changes without recompilation
- Full SoNash widget capability
- Trivial Windows cross-compilation

**Runner-up: Approach A (Enhanced monolith)** for minimum risk and fastest
time-to-value.

- Already working, just needs new widgets
- 47-150ms is acceptable (marginal but fine for a statusline)
- **Critical optimization:** Change project settings.json to use direct `node`
  instead of the fnm shim for the statusline command specifically (the global
  settings.json already does this)
- 6-11 hours of incremental work
- Same language as all other project tooling

### Tier 2: Viable but Not Recommended

**Approach E (Bash + jq):** Good performance (20-70ms), simple, but
unmaintainable for complex SoNash widgets. Best as a stepping stone if the Go
binary feels too ambitious.

**Approach B (ccstatusline):** Great for users who don't need project-specific
widgets. Not viable for SoNash because it cannot display debt, hooks, or health
grade without per-widget subprocess overhead.

### Tier 3: Not Recommended

| Approach          | Why Not                                                     |
| ----------------- | ----------------------------------------------------------- |
| **C: Hybrid**     | Performance too slow (115-240ms), fragile integration       |
| **F: Plugin**     | Wrong abstraction (solves distribution, not implementation) |
| **G: CShip**      | Windows support unclear, custom module API underdocumented  |
| **H: PowerShell** | 200-500ms cold start is worse than current Node.js          |
| **I: Compositor** | Performance unacceptable (195-395ms), maximum complexity    |

### Suggested Decision Framework

```
Q1: Is raw performance the priority?
  YES -> Go binary (Approach D)
  NO  -> Q2

Q2: Is minimizing change/risk the priority?
  YES -> Enhanced monolith (Approach A)
  NO  -> Q3

Q3: Do you need SoNash-specific widgets?
  YES -> Go binary (D) or Enhanced monolith (A)
  NO  -> ccstatusline (B)
```

### Immediate Quick Win (Regardless of Approach)

**Fix the fnm shim overhead NOW.** The project `settings.json` invokes:

```
bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js
```

The global `~/.claude/settings.json` invokes:

```
node /c/Users/jbell/.local/bin/sonash-v0/.claude/hooks/global/statusline.js
```

The global setting is faster because it skips the fnm shim. If `node` is on PATH
(which it is when fnm has been initialized for the session), the project-level
setting should also skip the shim for the statusline command. This single change
saves 100-300ms per statusline update.

---

## Sources

### Official Documentation

- [Customize your status line - Claude Code Docs](https://code.claude.com/docs/en/statusline)
- [Create and distribute a plugin marketplace - Claude Code Docs](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code Release Notes](https://releasebot.io/updates/anthropic/claude-code)

### Implementation References

- [felipeelias/claude-statusline (Go)](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
- [sirmalloc/ccstatusline (Node.js)](https://github.com/sirmalloc/ccstatusline)
- [Haleclipse/CCometixLine (Rust)](https://github.com/Haleclipse/CCometixLine)
- [stephenleo/cship (Rust + Starship)](https://github.com/stephenleo/cship)
- [chongdashu/cc-statusline (Bash + jq)](https://github.com/chongdashu/cc-statusline)
- [martinemde/starship-claude (Starship)](https://github.com/martinemde/starship-claude)

### Performance Research

- [The 500x performance gap between Node.js version managers](https://nodevibe.substack.com/p/the-500x-performance-gap-between)
- [Rust vs Go vs Node.js Performance (2026)](https://caffeinatedcoder.medium.com/rust-vs-go-vs-node-js-which-backend-language-will-dominate-in-2026-b46e652d12f4)
- [Rust vs Go: Performance Tests (2026)](https://tech-insider.org/rust-vs-go-2026/)
- [Building Great CLIs: Node.js vs Go vs Rust](https://medium.com/@no-non-sense-guy/building-great-clis-in-2025-node-js-vs-go-vs-rust-e8e4bf7ee10e)

### Tutorials & Guides

- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- [Claude Code Status Line Setup Guide](https://claudefa.st/blog/tools/statusline-guide)
- [Build Your Dream Status Bar for Claude Code](https://dev.to/rajeshroyal/statusline-build-your-dream-status-bar-for-claude-code-50p5)
- [Building a Custom Claude Code Statusline](https://www.dandoescode.com/blog/claude-code-custom-statusline)
- [Claude Code Hooks and the Statusline](https://www.subaud.io/claude-code-hooks-and-the-statusline/)

### Ecosystem

- [Claude Code Plugin Directory](https://claudemarketplaces.com/)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [Starship Configuration](https://starship.rs/config/)
- [CShip Documentation](https://cship.dev/)
