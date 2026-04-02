# Custom Statusline for Claude Code: Comprehensive Research Report

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
**Depth:** L1 (Exhaustive)
**Prior Research:** Session #229 (2026-03-19/20), synthesized in `.planning/statusline-research/RESEARCH_OUTPUT.md`
**New Research:** 6 sub-question findings (SQ-001 through SQ-007, March 23)
<!-- prettier-ignore-end -->

---

## Current Baseline (what's already working)

The existing statusline (`.claude/hooks/global/statusline.js`, 119 lines,
Node.js) renders this output:

```
Opus 4.6 (1M context) │ planning-32326 │ sonash-v0 ███░░░░░░░ 32%
⏵⏵ accept edits on · 1 local agent
```

**Current widgets (5):** Model name, git branch, project directory, context
gauge (color-coded: green <50%, yellow <65%, orange <80%, red+skull ≥80%),
active task (from todo files).

**Current data sources:** stdin JSON (model, context, session_id), git shell-out
(branch, 10-50ms), filesystem (todo files, 1-10ms).

**Performance:** ~60-220ms per render (dominated by git shell-out + fnm wrapper
overhead). Runs via `ensure-fnm.sh node statusline.js`.

**What's right:** Working, secure (sanitizes all output), Windows-compatible,
shows context gauge which is the single most important widget.

**What's missing:** Cost, rate limits, anomaly indicators (hook failures, health
grade, debt S0), predictive compaction ("~N msgs left"), agent status detail.

**What becomes redundant with Starship (per CLI tools plan):** Branch and
directory will be shown at the prompt once Starship is installed. The statusline
can then focus exclusively on session/health data that Starship can't show.

---

## Executive Summary

This report synthesizes 6 new research findings (SQ-001 through SQ-007) with the
prior Session #229 research to produce a definitive picture of the Claude Code
statusline landscape, design options, and implementation path for SoNash. The
research covers 15+ third-party tools, 8 visual layout patterns, 9
implementation approaches, 15+ design inspirations from outside the Claude Code
ecosystem, and the complete Windows compatibility picture.

**What changed in 3 days (March 20-23):** Claude Code v2.1.81 shipped
`rate_limits` fields (5-hour and 7-day windows), the `mapleleafu/ccstatusline`
repo from prior research now returns 404 (replaced by `sirmalloc/ccstatusline`
at 5.8k stars), and a community workaround was discovered for the Windows
statusline regression (issue #31670). The `felipeelias/claude-statusline` Go
binary also launched on March 17, introducing a new implementation paradigm. The
prior research's two blockers (Windows rendering and fnm overhead) are now both
mitigable rather than blocking.

**The core design thesis survives from prior research:** The anomaly-driven
visibility philosophy ("quiet when fine, noisy when problems") remains the
correct approach. The statusline width itself becomes a signal -- a longer bar
means "pay attention," a second line means "something is critically wrong." This
directly operationalizes CLAUDE.md guardrail #6 ("Unacknowledged warnings become
wallpaper") [SQ-003, SQ-007, Prior Research].

**The implementation landscape has shifted.** The prior research recommended
"enhance the existing monolith." The new findings add a compelling alternative:
a Go binary that eliminates all Node.js/fnm overhead (8-29ms vs 47-470ms) while
retaining full SoNash widget capability. Go is already installed on this
machine. This changes the recommendation from a single winner to a three-option
spectrum (conservative/balanced/ambitious) [SQ-006].

**Workflow-specific modules are the differentiator.** No third-party tool
provides session tracking, hook health, health grade, debt S0 count, predictive
compaction, agent status, or PR review state. These are what make a custom
statusline worth building. The 8 workflow-relevant modules the user identified
map cleanly to the anomaly-driven tier system: 2 always-visible anchors
(branch + context bar with predictive compaction) and 6 anomaly-activated
widgets that appear only when thresholds are crossed [SQ-003, SQ-006, Prior
Research].

---

## Key Findings by Theme

### Theme 1: The Tool Landscape (What Exists, What Changed)

The Claude Code statusline ecosystem has matured rapidly. As of March 23, 2026,
the landscape includes [SQ-001]:

**Official first-party support:**

- Built-in `statusLine` configuration in `~/.claude/settings.json` (type:
  "command")
- `/statusline` slash command generates scripts from natural language
- JSON session data piped to stdin on every update (after assistant messages,
  permission changes, vim toggles)
- Debounced at 300ms; in-flight executions cancelled on new trigger
- Supports multi-line output, ANSI colors (16/256/truecolor), OSC 8 clickable
  links
- v2.1.81 (March 20) added `rate_limits` fields with 5-hour and 7-day usage
  windows

**Third-party tool tiers [SQ-001]:**

| Tier | Tool                             | Stars | Language            | Windows       | Key Differentiator                         |
| ---- | -------------------------------- | ----- | ------------------- | ------------- | ------------------------------------------ |
| 1    | sirmalloc/ccstatusline           | 5,800 | Node.js (React+Ink) | Full          | 30+ widgets, TUI config, Powerline styling |
| 1    | Haleclipse/CCometixLine          | 2,300 | Rust                | Full (winget) | High-performance binary, TOML config       |
| 2    | Owloops/claude-powerline         | 947   | Node.js             | Yes           | 6 themes, 4 styles, budget tracking        |
| 2    | chongdashu/cc-statusline         | 532   | Bash+jq             | Yes           | Lightweight, burn rate monitoring          |
| 2    | rz1989s/claude-code-statusline   | 398   | Bash                | WSL only      | 28 atomic components, TOML config          |
| 2    | stephenleo/cship                 | 262   | Rust                | No            | Starship passthrough, <10ms render         |
| 2    | leeguooooo/claude-code-usage-bar | 163   | Python              | No            | Budget tracking, depletion estimates       |
| 3    | martinemde/starship-claude       | 56    | Shell+Starship      | No            | Plugin marketplace integration             |
| 3    | felipeelias/claude-statusline    | 2     | Go                  | Likely        | NEW (March 17), `test` command, presets    |

**What changed since prior research [SQ-001]:**

1. `mapleleafu/ccstatusline` now 404s; `sirmalloc/ccstatusline` (5.8k stars) is
   the canonical project
2. v2.1.81 added `rate_limits.five_hour` and `rate_limits.seven_day` to stdin
   JSON
3. `felipeelias/claude-statusline` launched (Go binary with Starship-inspired
   design)
4. Plugin marketplace matured (72+ plugins, 24 categories)

**What third-party tools offer that SoNash does not [SQ-001]:** Cost tracking,
rate limit display, token speed, worktree awareness, multi-line layouts, caching
of expensive operations, TOML/YAML config, clickable links.

**What SoNash has that no third-party tool provides [SQ-001, Prior Research]:**
GSD task tracking, debt ticker, hook health, health grade, predictive
compaction, session state persistence -- all the workflow-specific modules that
make the statusline operationally valuable.

### Theme 2: Visual Design Options

Eight distinct layout patterns were analyzed [SQ-003]. Every mockup from the
research is reproduced here.

#### Pattern A: Minimal Single-Line

> Show almost nothing. Only essential navigation context.

**Full width (100ch):**

```
main | ████░░░░░░ 28%
```

**Narrow (60ch):**

```
main | ████░░ 28%
```

**Ultra-narrow (40ch):**

```
main | 28%
```

Assessment: Near-zero cognitive load, excellent degradation. Too minimal for
SoNash -- defeats the purpose of anomaly surfacing. Best as the "normal state"
within an anomaly-driven design.

#### Pattern B: Segmented Single-Line

> Pack maximum useful information into one line using pipe-delimited segments.

**Full width (100ch):**

```
main | S#234 | $1.23 | 5hr:42% | ████████░░ 62% ~22 msgs
```

**Narrow (80ch):**

```
main | S#234 | $1.23 | ████████░░ 62% ~22 msgs
```

**Narrow (60ch):**

```
main | $1.23 | ████░░ 62% ~22
```

**Ultra-narrow (40ch):**

```
main | $1.23 | 62%
```

Assessment: High density, good priority-based degradation. The default
power-user layout. Segments are self-labeling but visually monotone.

#### Pattern C: Icon-Based Single-Line

> Replace text labels with Nerd Font / Unicode icons for density.

**Full width (100ch):**

```
 main |  234 |  $1.23 |  42% |  A | ████████░░ 62%
```

**Narrow (60ch):**

```
 main |  $1.23 | ████░░ 62%
```

Assessment: Most compact but hard accessibility barrier -- Nerd Font required,
icon meanings not self-documenting. Not recommended as the sole mode for SoNash.

#### Pattern D: Multi-Line Always

> Two lines separating "navigation" from "system health."

**Full width (100ch):**

```
 main | ████████░░ 62% ~22 msgs | $1.23 (+$0.50/hr)
 HOOKS:OK | HEALTH:A(91) | DEBT:S0=0 S1=2 | BLK 5hr:42%
```

**Narrow (80ch):**

```
 main | ████████░░ 62% ~22 msgs | $1.23
 HOOKS:OK | HEALTH:A | DEBT:S0=0 | 5hr:42%
```

**Narrow (60ch):**

```
 main | ████░░ 62% | $1.23
 HOOKS:OK | HEALTH:A | S0=0
```

Assessment: Most room for health data. Permanently consumes an extra terminal
line. Best for comprehensive dashboard view, but feels heavy during focused
coding.

#### Pattern E: Anomaly-Driven (Adaptive) -- RECOMMENDED

> Quiet when everything is fine. Noisy when something needs attention. The bar
> earns its visual weight only when there is an anomaly.

**Normal state (everything OK):**

```
main | ████░░░░░░ 28%
```

**Anomaly: High context usage:**

```
main | $1.23 | ████████████████░░ 84% ~6 msgs COMPACT SOON
```

**Anomaly: Hook failure:**

```
main | HOOKS:FAIL(2) | ████░░░░░░ 28%
```

**Anomaly: Critical debt:**

```
main | S0:3! | ████░░░░░░ 28%
```

**Anomaly: Multiple issues (worst case):**

```
main | HOOKS:FAIL | S0:3! | $8.23 | ████████████████░░ 84% ~6 msgs
```

**Anomaly: Cost spike:**

```
main | $5.41 (+$2.10/hr) | ████████░░ 62%
```

**State transition rules [SQ-003]:**

| Metric       | Normal (hidden) | Warning (appears)   | Critical (highlighted) |
| ------------ | --------------- | ------------------- | ---------------------- |
| Context      | <50% used       | >=65% used          | >=80% used (blinking)  |
| Cost         | <$2.00 session  | >=$2 (shows amount) | >=$5 (red + burn rate) |
| Hooks        | All passing     | Warnings exist      | Failures exist         |
| Debt S0      | S0=0            | --                  | S0>0 (always critical) |
| Health Grade | A or B          | C (shows grade)     | D or F (red + grade)   |
| Block Timer  | >30% remaining  | <20% remaining      | <10% remaining         |

Assessment: Best signal-to-noise ratio. The bar width itself becomes a signal --
growth means problems. Directly addresses CLAUDE.md guardrail #6. Most complex
to implement (threshold engine) but highest value.

#### Pattern F: Dashboard-Style

> Three-line mini-dashboard with header, metrics row, and progress bar.

**Full width (100ch):**

```
───────────────────────── SoNash Session #234 ──────────────────────────
 main   $1.23   5hr:42%   HEALTH:A   S0:0   HOOKS:OK
████████████████████████████████░░░░░░░░░░░░ 62% ~22 msgs remaining
```

Assessment: Most visually polished but three lines is too much terminal real
estate for a persistent bar. Better as a `/dashboard` command output than
always-on status.

#### Pattern G: Sparkline/Graph-Based

> Replace numbers with visual trends using Unicode block characters.

**Full width (100ch):**

```
main | $▁▂▃▅▇ $1.23 | ▇▅▃▂▁ 62% | A(91) | S0:0
```

Assessment: Encodes temporal trend data that no other pattern can show. Unicode
block chars render inconsistently across terminals. Best as a supplementary
widget within Pattern E, not standalone.

#### Pattern H: Color-Zone

> The entire bar changes background color based on overall system state.

**GREEN Zone (All Clear):**

```
[green bg]  main | 28% context | all clear
```

**YELLOW Zone (Warnings):**

```
[yellow bg]  main | 62% context | $3.41 | hooks: 1 warn
```

**RED Zone (Critical):**

```
[red bg]  main | 84% context ~6 msgs | $8.23 | HOOKS:FAIL | S0:3
```

Assessment: Highest possible "is everything OK?" signal. Accessibility failure
for colorblind users (8% of males). Must combine with text-based signals, never
as sole information channel.

#### Composite Mockups (SoNash-Optimized)

**"Best of all worlds" -- Full width, healthy state [SQ-007]:**

```
▊ ● main | S#234 | $1.23 | ✓ hooks | ▂▃▄▅▆▇ 62% ~22 msgs | 5h:42m
```

**Same width, anomaly state [SQ-007]:**

```
▊ ⟳ main | ◆agent | $4.23 | ⚠3 hooks | ▅▆▇█████ 82% ~6 msgs | 3h:12m
```

**Prior research "normal operation" [Prior Research]:**

```
housecleaning | ████░░░░░░ 28%
```

**Prior research "mild anomalies" [Prior Research]:**

```
housecleaning | D:32! | $3.41 | 5hr:72% | ████████░░ 62% ~22 msgs
```

**Prior research "critical anomalies" (2 lines) [Prior Research]:**

```
housecleaning | HOOKS:FAIL | D:32! | $8.23(+$2/hr) | ████████░░ 84% ~6 msgs
HEALTH:C(72)v | 5hr:89% resets 2:15pm | Reviewing (code-reviewer)
```

**Recommended SoNash "Adaptive Segmented" [SQ-003]:**

Normal state (quiet):

```
main | ████░░░░░░ 28%
```

Warning state (one or more warnings):

```
[yellow accent] main | $3.41 | hooks:1⚠ | ████████░░ 62% ~22
```

Critical state (one or more criticals):

```
[red accent] main | HOOKS:FAIL | S0:3! | $8.23 | ████████████████░░ 84% ~6
```

**Width-aware degradation tiers [SQ-003, SQ-007]:**

```
Width >= 120: ▊ ● main | S#234 | $1.23 | ✓ hooks | ████████░░ 62% ~22msgs | 5h:42m
Width >= 100: ▊ ● main | $1.23 | ████████░░ 62% | 5h:42m
Width >=  80: ▊ ● main | $1.23 | 62% | 5h:42m
Width >=  60: ▊ ● main | 62%
Width <   60: ▊ 62%
```

### Theme 3: Implementation Approaches (Full Comparison Matrix)

Nine distinct approaches were evaluated [SQ-006]. The critical constraint:
Claude Code executes exactly ONE `statusLine.command` and pipes JSON to stdin.
Performance budget is 300ms (debounce interval with cancellation).

#### Performance Comparison (lower is better)

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

#### Capability Comparison

| Approach                 | SoNash Widgets | Config File | Themes  |  Windows   | Effort |
| ------------------------ | :------------: | :---------: | :-----: | :--------: | ------ |
| **A: Enhanced monolith** |      FULL      |     No      |   No    |    Yes     | 6-11h  |
| **B: ccstatusline**      |     NONE\*     |     TUI     |   Yes   |    Yes     | 30min  |
| **C: Hybrid**            |      FULL      |   Partial   |   Yes   |    Yes     | 5-7h   |
| **D: Go binary**         |      FULL      |    TOML     | Custom  | Yes (.exe) | 6-9h   |
| **E: Bash + jq**         |    MODERATE    |     No      |   No    |  Git Bash  | 3-5h   |
| **F: Plugin**            |      FULL      |     N/A     |   N/A   |  Depends   | 4-6h   |
| **G: CShip**             |   UNCERTAIN    |    TOML     |   Yes   |  Unknown   | 2-4h   |
| **H: PowerShell**        |      FULL      |     No      |   No    |   Native   | 3-5h   |
| **I: Compositor**        |      FULL      |     No      | Partial |  Fragile   | 4-7h   |

\*ccstatusline has custom-command widgets, but each spawns a subprocess.

#### Eliminated Approaches [SQ-006]

| Approach                  | Why Eliminated                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **C: Hybrid**             | Performance too slow (115-240ms), fragile string concatenation between tools                                       |
| **F: Plugin marketplace** | Wrong abstraction -- solves distribution, not implementation; project-specific widgets don't fit marketplace model |
| **G: CShip**              | Windows support undocumented, custom module API underdocumented, young project (262 stars)                         |
| **H: PowerShell**         | 200-500ms cold start worse than current Node.js; different language from project                                   |
| **I: Compositor**         | Performance unacceptable (195-395ms), maximum complexity                                                           |

### Theme 4: Data Sources & Performance Budget

**Free data (stdin JSON, zero I/O cost) [SQ-001, SQ-005]:**

| Field                                   | Description          | Widget Use              |
| --------------------------------------- | -------------------- | ----------------------- |
| `model.display_name`                    | Current model        | Model indicator         |
| `cost.total_cost_usd`                   | Session cost         | Cost widget             |
| `cost.total_duration_ms`                | Session duration     | Duration widget         |
| `cost.total_lines_added/removed`        | Lines changed        | Activity widget         |
| `context_window.used_percentage`        | Context usage        | Context bar             |
| `context_window.remaining_percentage`   | Context remaining    | Predictive compaction   |
| `context_window.context_window_size`    | Max tokens (200k/1M) | Context bar denominator |
| `rate_limits.five_hour.used_percentage` | 5-hour rate limit    | Rate limit widget       |
| `rate_limits.five_hour.resets_at`       | Reset timestamp      | "resets at" display     |
| `rate_limits.seven_day.used_percentage` | 7-day rate limit     | Rate limit widget       |
| `agent.name`                            | Active agent         | Agent status widget     |
| `session_id`                            | Session identifier   | Session tracking        |
| `vim.mode`                              | NORMAL/INSERT        | Vim mode indicator      |
| `worktree.*`                            | Worktree info        | Worktree awareness      |

**Cheap data (local file reads, 1-15ms) [SQ-006, Prior Research]:**

| Source                                             | Widget Use            | Read Cost |
| -------------------------------------------------- | --------------------- | --------- |
| `.claude/state/hook-runs.jsonl` (tail)             | Hook health           | 1-5ms     |
| `.claude/state/hook-warnings-log.jsonl`            | Unacked warnings      | 1-5ms     |
| `.claude/state/health-score-log.jsonl` (last line) | Health grade          | 1-3ms     |
| `.claude/state/debt-summary-cache.json`            | Debt S0 count         | 1-3ms     |
| `.claude/state/pace-sparkline.json`                | Predictive compaction | 1-3ms     |
| `~/.claude/todos/{session}-agent-*.json`           | Current task          | 5-15ms    |

**Expensive data (shell-out, 10-200ms) [SQ-005, Prior Research]:**

| Operation                         | Widget Use       | Cost     | Recommendation                              |
| --------------------------------- | ---------------- | -------- | ------------------------------------------- |
| `git rev-parse --abbrev-ref HEAD` | Branch display   | 10-50ms  | Cache with 5s TTL                           |
| `git status --porcelain`          | Dirty file count | 50-200ms | DO NOT USE -- cut from scope                |
| `git diff --stat`                 | Changed files    | 30-100ms | DO NOT USE -- available in commit summaries |

**Render budget breakdown (post-fnm-fix, Node.js) [Prior Research]:**

| Component                 | Min      | Max       |
| ------------------------- | -------- | --------- |
| Node.js startup           | 50ms     | 100ms     |
| Git rev-parse (cached)    | 0ms      | 50ms      |
| Stdin JSON parsing        | <1ms     | <1ms      |
| 6 Tier 2 widget functions | 3ms      | 15ms      |
| Pace state read+write     | 1ms      | 3ms       |
| Snapshot write            | 1ms      | 3ms       |
| **Total**                 | **56ms** | **172ms** |

**Render budget breakdown (Go binary) [SQ-006]:**

| Component                | Min      | Max      |
| ------------------------ | -------- | -------- |
| Binary startup           | 1ms      | 5ms      |
| JSON parse               | <1ms     | <1ms     |
| Git rev-parse            | 5ms      | 20ms     |
| File reads (all widgets) | 3ms      | 15ms     |
| **Total**                | **10ms** | **41ms** |

### Theme 5: Design Principles (from Inspiration Analysis)

Seven cross-cutting design principles emerged from analyzing 15+ tools across 5
categories [SQ-007]:

**Principle 1: Color Language Consistency** -- Every tool uses the same
universal color language: green=healthy, yellow=warning, red=critical,
blue=working, magenta=special mode, dim=inactive. Never violate this. Users have
decades of conditioning.

**Principle 2: The 5-7 Widget Rule** -- Microsoft's status bar guidelines state
having more than 5-6 indicators overwhelms users. Tools that violate this
compensate with toggleable widgets. Default to 5-7 maximum.

**Principle 3: Healthy = Quiet, Unhealthy = Loud** -- Across JetBrains
(checkmark vs error count), Copilot (invisible when working, loud when broken),
Starship (hidden for fast commands), and btop (green fades, red demands). The
statusline should be almost ignorable when everything is fine.

**Principle 4: Progressive Disclosure by Width** -- Define a clear priority
order. The MOST important widget (context %) should be the LAST to disappear.
tmux uses `if-shell #{client_width}`, heirline uses priority-based flex, iTerm2
uses compression resistance.

**Principle 5: Left = Identity, Right = Metrics** -- Across lualine, VS Code,
tmux, lazygit, and Yazi: the left side holds identity/location/mode
("who/what/where am I?") and the right side holds numbers/metrics/timestamps
("what are the measurements?"). The eye scans left-to-right.

**Principle 6: One Character Can Do the Work of Ten** -- lualine's `▊` colored
bar (1 char = mode), Copilot's `●`/`⟳`/`✕` (1 char = state), lazygit's `↑2 ↓0`
(5 chars = sync status), btop's sparkline `▁▂▃▅▆▇` (6 chars = trend). Invest in
dense symbolic representations.

**Principle 7: Refresh on Events, Not Timers** -- Timer-based polling wastes
resources and creates flicker. Claude Code already does this correctly (refresh
after assistant message, permission change, vim toggle).

**Key inspiration sources mapped to SoNash needs [SQ-007]:**

| SoNash Need       | Best Inspiration                          | Pattern                                           |
| ----------------- | ----------------------------------------- | ------------------------------------------------- |
| Cost tracking     | Cursor AI (token count)                   | Always visible, color-coded thresholds            |
| Context usage     | JetBrains memory widget + btop sparklines | Bar + optional trend                              |
| Health monitoring | JetBrains inspections + Starship anomaly  | Quiet when healthy, loud on problems              |
| Agent status      | Copilot state machine                     | 5-state icon: idle/working/agent/permission/error |
| Hook results      | JetBrains inspections                     | `✓` clean / `⚠N` warnings / `✕N` errors           |
| Width handling    | heirline flex + tmux width checks         | Priority-based progressive degradation            |
| Session awareness | Warp (persistent status)                  | Never disappear during operations                 |

### Theme 6: Windows Compatibility (Blocker Status and Workarounds)

**Prior research blocker:** GitHub issue #31670 reported statusline "completely
non-functional" on Windows as of v2.1.71.

**Current status (v2.1.81): PARTIALLY RESOLVED** [SQ-005]

A community workaround was found on March 22 by user "apocalx":

1. Create `~/.claude/.claude.json` with explicit workspace trust:

```json
{
  "projects": {
    "C:\\Users\\YOUR_USERNAME\\your-project": {
      "hasTrustDialogAccepted": true
    }
  }
}
```

2. Use forward slashes and Node.js in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/YOUR_USERNAME/.claude/statusline.js"
  }
}
```

**Root cause [SQ-005]:** The regression was introduced during the transition to
the Windows native binary (Bun-based). Two interacting failures: (1) AbortError
in child_process where the script spawn is immediately aborted, and (2) a silent
workspace trust check that kills execution without any visible error.

**Issue is NOT officially fixed** -- Anthropic has not merged a PR. The
workaround bypasses the symptom but the underlying process abort race may cause
intermittent rendering failures (issue #32917).

**Related open issues [SQ-005]:**

| Issue  | Title                                            | Impact                             |
| ------ | ------------------------------------------------ | ---------------------------------- |
| #31670 | Statusline not executed on Windows v2.1.71       | Primary blocker (workaround found) |
| #32917 | Output intermittently not rendered               | Occasional blank frames            |
| #12870 | Status line output truncated on Windows          | Width-dependent truncation         |
| #27161 | Session environment not yet supported on Windows | Limits available features          |

**fnm overhead (prior research blocker): MITIGABLE** [SQ-005]

The fnm wrapper adds 100-300ms per render. Mitigation strategies:

| Strategy             | Savings   | Approach                          |
| -------------------- | --------- | --------------------------------- |
| Direct node path     | 100-200ms | Absolute path bypassing fnm shims |
| Compiled binary (Go) | 200-450ms | Eliminate Node.js entirely        |
| Bash + jq            | 150ms     | Skip Node.js startup              |

**Recommended Windows setup for SoNash [SQ-005, SQ-006]:**

1. Create `~/.claude/.claude.json` trust file for the SoNash project directory
2. Use forward slashes in all settings.json paths
3. Use direct `node` path (not fnm shim) for statusline command, OR use a Go
   binary
4. Accept occasional blank frames from #32917 -- no fix available
5. Use 16-color ANSI for maximum compatibility (truecolor quantization issues in
   tmux, #35371)

### Theme 7: Workflow-Specific Widgets

These are the 8 modules the user identified as workflow-relevant, mapped to the
anomaly-driven tier system [Prior Research, SQ-003, SQ-006]:

#### Tier 1: Always Visible (Anchor Widgets)

**1. Git branch** (existing)

- Source: `git rev-parse --abbrev-ref HEAD` (10-50ms, cache with 5s TTL)
- Rationale: Orientation -- which branch am I on?
- Display: Cyan text, left-aligned per Principle 5

**2. Context bar + predictive compaction** (enhanced from existing)

- Source: `context_window.used_percentage` +
  `context_window.remaining_percentage` (stdin JSON, free)
- Enhancement: When context exceeds 50%, show `~N msgs left` estimate using
  linear extrapolation from pace tracking samples
- Rationale: Safety -- the only widget that reliably drives `/session-end`
- Display: Color-coded bar (green <50%, yellow <65%, orange <80%, blinking red
  skull >=80%)
- **This is the killer feature** -- no external tool predicts compaction [Prior
  Research]

#### Tier 2: Anomaly-Activated (Appear Only When Thresholds Crossed)

**3. Session tracking** (session number, duration)

- Source: `session_id` + `cost.total_duration_ms` (stdin JSON, free)
- Anomaly threshold: Duration shows only after 30 minutes (Starship pattern)
- Session number: `S#NNN` appears always if width permits (low priority for
  dropping)
- Display: Dim white text

**4. Cost / rate limit awareness** (budget management)

- Source: `cost.total_cost_usd` + `rate_limits.five_hour` (stdin JSON, free)
- Anomaly thresholds: Cost shows at >=$2 (yellow), >=$5 with burn rate
  (orange), >=$10 (red); Rate limit shows at >=70% of 5-hour limit
- Display: `$3.41` or `$5.41 (+$2.10/hr)` or `5hr:72%`
- **Prior research correction:** Showing cost below $2 is wallpaper [Prior
  Research]

**5. Hook health** (pre-commit/pre-push status)

- Source: `.claude/state/hook-runs.jsonl` (tail last entry, 1-5ms) +
  `.claude/state/hook-warnings-log.jsonl` (count unacked, 1-5ms)
- Anomaly threshold: Any WARN or FAIL in last run, or unacked warnings > 0
- Hidden when: Last run passed AND 0 unacked warnings
- Display: `✓` (green, invisible by default) / `⚠N` (yellow) / `FAIL` (red)
- Follows JetBrains inspections pattern [SQ-007]

**6. Health grade** (system health score)

- Source: `.claude/state/health-score-log.jsonl` (last line, 1-3ms)
- Anomaly threshold: Grade C or below (score < 80)
- Hidden when: Grade A or B
- Display: `HEALTH:C(72)` in yellow, `HEALTH:D(55)` in red

**7. Debt S0 count** (critical technical debt)

- Source: `.claude/state/debt-summary-cache.json` (pre-computed, 1-3ms)
- Anomaly threshold: S0 > 0 (always critical when present)
- Hidden when: S0 = 0
- Display: `S0:3!` in red

**8. Agent status** (what is running, waiting for input)

- Source: `agent.name` (stdin JSON, free) + todo status
- Anomaly threshold: Agent active OR waiting state detected
- Hidden when: No active agent, idle
- Display: `◆code-reviewer` or `⟳ Reviewing...`
- Follows Copilot state machine pattern [SQ-007]

#### Additional Workflow Widgets (from user request)

**9. PR review state** (pending reviews, review rounds)

- Source: `.claude/state/pr-review-state.json` (if exists, 1-3ms)
- Anomaly threshold: Active review session with pending items
- Hidden when: No active PR review
- Display: `PR:R2 4/12` (round 2, 4 items remaining of 12)

**10. Context predictive compaction** ("~N msgs left")

- Merged into the context bar (Tier 1 widget #2)
- Source: `.claude/state/pace-sparkline.json` (samples array, 1-3ms)
- Shows `~N msgs` when context >50%
- Display: `████████░░ 62% ~22 msgs`

---

## Recommended Approach -- Three Options

### Option 1: Conservative -- Enhanced Monolith (Approach A)

**What:** Keep the existing `statusline.js` (119 lines). Add new widgets inline
with per-widget try/catch. Fix fnm overhead by switching to direct `node` path.

**Mockup (normal state):**

```
housecleaning | ████░░░░░░ 28%
```

**Mockup (anomaly state):**

```
housecleaning | $3.41 | 5hr:72% | ████████░░ 62% ~22 msgs
```

**Effort:** 6-11 hours across 2 sessions **Performance:** 47-150ms (marginal but
functional) **Risk:** Low -- already working, incremental changes only **SoNash
widgets:** Full capability **Windows:** Already working (with trust file
workaround)

**Phase plan:**

- Phase 0 (30 min): Fix fnm shim, create trust file, verify rendering
- Phase 1 (1.5h): Refactor to per-widget functions, add anomaly layout logic,
  predictive compaction
- Phase 2 (1.5h): Add cost, rate limits, hook health, health grade, debt, agent
  status widgets
- Phase 3 (45 min): Performance profiling, multi-line anomaly escalation

**When to choose:** Minimum risk is the priority. Want to ship something quickly
and iterate.

### Option 2: Balanced -- Go Binary (Approach D)

**What:** Write the statusline as a Go binary. Single .exe, zero runtime
dependencies, TOML config. Go is already installed at
`/c/Users/jbell/go/bin/go`. AI writes the entire binary.

**Mockup (normal state -- same visual output, different engine):**

```
▊ ● housecleaning | ████░░░░░░ 28%
```

**Mockup (anomaly state with sparkline accent):**

```
▊ ⚠ housecleaning | $5.41 | ⚠2 hooks | ▅▆▇██ 78% ~8 msgs | 2h:14m
```

**Effort:** 6-9 hours across 2 sessions (AI-directed development)
**Performance:** 8-29ms (eliminates all performance concerns) **Risk:** Medium
-- new language, but Go is simple enough for AI-directed development **SoNash
widgets:** Full capability (same file reads, faster execution) **Windows:**
Excellent (cross-compile: `GOOS=windows GOARCH=amd64 go build`)

**Implementation structure:**

```
tools/statusline/
  main.go          -- stdin reader, widget orchestrator, stdout writer
  config.go        -- TOML config parsing
  widgets.go       -- all widget functions
  config.toml      -- layout, thresholds, colors
  Makefile         -- build targets for windows/linux/darwin
```

**When to choose:** Performance matters. Willing to invest slightly more upfront
for a dramatically faster and cleaner solution. The 10x performance improvement
(29ms vs 150ms) means the statusline never visibly lags.

### Option 3: Ambitious -- Go Binary + Full Design System (Approach D+)

**What:** Go binary with the full "best of all worlds" design: evil_lualine
state indicator (`▊`), Copilot-style session state (`●`/`⟳`/`◆`), sparkline
trends, width-aware progressive degradation across 5 breakpoints,
TOML-configurable widget priority and thresholds, statusline snapshot writes for
compaction recovery.

**Mockup (full width, healthy):**

```
▊ ● housecleaning | S#234 | $1.23 | ✓ hooks | ▂▃▄▅▆▇ 62% ~22 msgs | 5h:42m
```

**Mockup (full width, anomaly):**

```
▊ ⟳ housecleaning | ◆code-reviewer | $4.23 | ⚠3 hooks | ▅▆▇█████ 82% ~6 msgs
HEALTH:C(72) | S0:2! | 5hr:89% resets 2:15pm | PR:R2 4/12
```

**Effort:** 12-18 hours across 3-4 sessions **Performance:** 8-41ms **Risk:**
Medium-High -- more features to get right, sparkline data persistence, TOML
config parsing **SoNash widgets:** Full + sparkline trends + snapshot
persistence + PR review state **Windows:** Excellent

**Additional features over Option 2:**

- Sparkline context/cost trends (10-char history)
- Statusline snapshot writes (`.claude/state/statusline-snapshot.json`) for
  session-start acceleration and compaction recovery
- TOML config for threshold tuning without recompilation
- 5-tier width-aware degradation
- Multi-line escalation on critical anomalies
- PR review state widget

**When to choose:** Want the definitive statusline. Willing to invest across
multiple sessions. The snapshot persistence and PR review integration make this
the "Swiss Army knife" option.

---

## Contradictions & Open Questions

### Contradictions Found

1. **Prior research said "enhanced monolith" was the clear winner; new findings
   say Go binary is competitive.** The prior research never evaluated a compiled
   binary approach because it correctly noted Go was "not in the SoNash stack."
   The new findings [SQ-006] reframe this: Go is installed, AI can write the
   binary, and the 10x performance improvement changes the calculus. Both
   approaches are now valid -- the choice is risk tolerance vs performance.

2. **Session counter was deferred in prior research as "not actionable"; user
   now lists it as workflow-relevant.** The prior research applied a strict
   actionability filter that cut session number. The user's request suggests
   session number serves an orientation purpose ("where am I in the project
   history?"). Resolution: include it as a low-priority segment that drops first
   at narrow widths.

3. **Prior research cut duration as "not actionable"; user now lists it.** Same
   resolution: include as a Starship-style conditional widget that shows only
   after 30 minutes, giving long-session awareness without wallpaper.

4. **SQ-006 recommends Bash + jq as "Tier 2 viable" but SQ-005 recommends it as
   primary.** SQ-005 focused narrowly on performance and saw Bash as fastest
   non-compiled option. SQ-006 evaluated holistically and noted Bash becomes
   unmaintainable past ~150 lines for complex widgets like health grade
   calculation. Resolution: Bash + jq is a good stepping stone but not the
   long-term answer for 8+ SoNash widgets.

### Open Questions

1. **Does the v2.1.81 trust file workaround survive across Claude Code
   updates?** The workaround modifies `~/.claude/.claude.json` which may be
   overwritten by Claude Code updates. No data yet.

2. **How does multi-line output interact with Claude Code's system
   notifications?** The official docs say system notifications display on the
   same row as the statusline. Multi-line output (Pattern D, critical anomaly
   escalation) may conflict. Needs testing.

3. **What is the actual hard timeout for statusline scripts?** Official docs
   reference a timeout but give no specific value. Community reports suggest
   scripts over 1 second are reliably killed, but the exact threshold between
   300ms (debounce) and 1000ms is unknown.

4. **Will Anthropic officially fix issue #31670?** The workaround is fragile. An
   official fix would eliminate the trust file requirement.

5. **Can Go binaries read the SoNash state files reliably on Windows?** JSONL
   tail reads and path resolution should work, but Windows file locking behavior
   differs from Unix. Needs testing.

---

## Confidence Assessment

| Theme                               | Confidence | Basis                                                                                                                     |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tool landscape (Theme 1)            | HIGH       | 10+ repos verified with star counts, READMEs read, version numbers confirmed                                              |
| Visual designs (Theme 2)            | HIGH       | 8 patterns with ASCII mockups, comparison matrix, degradation strategies                                                  |
| Implementation approaches (Theme 3) | HIGH       | 9 approaches evaluated with effort estimates and performance benchmarks                                                   |
| Data sources (Theme 4)              | HIGH       | Full v2.1.81 stdin JSON schema documented, file read costs measured                                                       |
| Design principles (Theme 5)         | HIGH       | 15+ tools analyzed, 7 principles distilled with cross-tool validation                                                     |
| Windows compatibility (Theme 6)     | MEDIUM     | Workaround confirmed by community user but not verified on our machine; issue still open                                  |
| Workflow widgets (Theme 7)          | MEDIUM     | Widget specifications are sound, but state file formats assume current SoNash tooling; some cache files may not exist yet |

---

## Recommendations (Top 5 Actions)

1. **Verify Windows statusline rendering NOW.** Before any implementation work,
   apply the trust file workaround and confirm the existing statusline.js
   renders on our Windows 11 machine. If broken, all other work is deferred.
   This is a 15-minute action [SQ-005, Prior Research].

2. **Fix the fnm shim overhead immediately.** Change the project `settings.json`
   statusline command from `bash .claude/hooks/ensure-fnm.sh node statusline.js`
   to
   `node C:/Users/jbell/.local/bin/sonash-v0/.claude/hooks/global/statusline.js`
   (with direct node path). This single change saves 100-300ms per render and is
   prerequisite for any approach [SQ-006, Prior Research].

3. **Choose between Option 1 (Conservative/Node.js) or Option 2 (Balanced/Go).**
   Both deliver the same workflow widgets. The difference is performance (150ms
   vs 29ms), maintenance model (single JS file vs single Go binary), and
   complexity (familiar stack vs new language). For a solo developer who values
   performance and has Go installed, Option 2 is recommended.

4. **Implement anomaly-driven visibility as the layout philosophy.** Regardless
   of approach, the design should be Pattern E (anomaly-driven) with Pattern H
   (color-zone) accents. Normal state shows only branch + context bar. Anomaly
   widgets appear only when thresholds are crossed. This is the single most
   important design decision [SQ-003, SQ-007, Prior Research].

5. **Prioritize predictive compaction as the first new widget.** "~N msgs left"
   is the killer feature -- no external tool does this. It turns the context bar
   from a passive gauge into an actionable countdown. Implementation is ~15
   lines of arithmetic using pace tracking data [Prior Research].

---

## Theme 8: Non-Development Widgets

**Research gap corrected:** The original 7 sub-questions focused entirely on
development workflow. SQ-008 (supplemental) surveyed non-dev widget options
across ccstatusline, tmux plugins, polybar, Waybar, i3pystatus, and Starship.

### High-Value Non-Dev Widgets for This User

| Widget                              | Value       | Data Source                       | Cost      | Example Output          |
| ----------------------------------- | ----------- | --------------------------------- | --------- | ----------------------- |
| **Next calendar event + countdown** | HIGH        | Google Calendar MCP → cache file  | <5ms read | `📅 Standup in 12m`     |
| **Meeting imminent alert**          | HIGH        | Same cache, color escalation <10m | <5ms      | `🔴 Meeting in 3m!`     |
| **Session duration**                | HIGH        | stdin `cost.total_duration_ms`    | Free      | `⏱ 1h23m`               |
| **Break/Pomodoro reminder**         | MEDIUM-HIGH | Timer state file                  | <2ms      | `🍅 Break in 8m`        |
| **Unread email count**              | MEDIUM      | Gmail MCP → cache file            | <5ms read | `✉ 3`                   |
| **Clock (dual timezone)**           | MEDIUM      | System time                       | <1ms      | `10:23 CST / 11:23 EST` |

### Lower-Value Non-Dev Widgets (available but not recommended initially)

| Widget              | Value | Why Lower                               |
| ------------------- | ----- | --------------------------------------- |
| Weather             | LOW   | Not actionable from terminal            |
| Spotify/music       | LOW   | Not actionable, aesthetic only          |
| Battery             | LOW   | Windows taskbar already shows this      |
| CPU/memory          | LOW   | Not useful unless debugging performance |
| Motivational quotes | LOW   | Becomes wallpaper per guardrail #6      |
| Network/VPN status  | LOW   | Windows taskbar already shows this      |

### Architecture: MCP-Backed Widgets

For calendar and email, the pattern is **decouple fetch from display:**

1. Background fetcher (Task Scheduler every 5 min) calls MCP or API, writes to
   `~/.cache/statusline/next-event.txt`
2. Statusline reads the cache file (<5ms)
3. Statusline NEVER blocks on API calls

This means calendar/email widgets add <5ms to render time regardless of API
speed, and degrade gracefully if the cache is stale (show "?" or hide).

### Key Insight

ccstatusline ships **zero dedicated non-dev widgets** — it uses a generic
`Custom Command` widget that runs arbitrary shell commands. Any non-dev widget
is a custom implementation regardless of which tool you use.

---

## Sources

### Official Documentation

- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline) --
  API contract, stdin JSON schema
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) -- v2.1.81
  release notes
- [Claude Code Plugin Directory](https://code.claude.com/docs/en/discover-plugins)
  -- Plugin marketplace

### GitHub Issues

- [#31670 -- Statusline not executed on Windows](https://github.com/anthropics/claude-code/issues/31670)
  -- Primary Windows blocker
- [#32917 -- Output intermittently not rendered](https://github.com/anthropics/claude-code/issues/32917)
  -- Intermittent rendering
- [#30725 -- PowerShell statusLine stopped](https://github.com/anthropics/claude-code/issues/30725)
  -- Duplicate of #31670
- [#21349 -- Keep status line visible during prompts](https://github.com/anthropics/claude-code/issues/21349)
  -- Feature request
- [#35371 -- Truecolor quantization in tmux](https://github.com/anthropics/claude-code/issues/35371)
  -- Color regression

### Major Third-Party Tools

- [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) -- 5.8k
  stars, Node.js
- [Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine) -- 2.3k
  stars, Rust
- [Owloops/claude-powerline](https://github.com/Owloops/claude-powerline) -- 947
  stars, Node.js
- [chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline) -- 532
  stars, Bash
- [stephenleo/cship](https://github.com/stephenleo/cship) -- 262 stars, Rust
- [felipeelias/claude-statusline](https://github.com/felipeelias/claude-statusline)
  -- Go binary (new March 17)
- [martinemde/starship-claude](https://github.com/martinemde/starship-claude) --
  56 stars

### Design Inspiration Sources

- [lualine.nvim](https://github.com/nvim-lualine/lualine.nvim) -- 6.8k stars,
  Neovim statusline gold standard
- [heirline.nvim](https://github.com/rebelot/heirline.nvim) -- 1.2k stars,
  programmable degradation
- [VS Code Status Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/status-bar)
  -- Color-as-state
- [Starship](https://github.com/starship/starship) -- 48k stars, conditional
  modules pioneer
- [btop](https://github.com/aristocratos/btop) -- Sparkline visualization
- [lazygit](https://github.com/jesseduffield/lazygit) -- Compact sync notation

### Framework and Ecosystem

- [Ink (React for CLI)](https://github.com/vadimdemedes/ink) -- 27k stars,
  Node.js TUI
- [Bubble Tea](https://github.com/charmbracelet/bubbletea) -- 30k stars, Go TUI
- [tmux-powerline](https://github.com/erikw/tmux-powerline) -- 3.4k stars, tmux
  status
- [Oh My Posh](https://github.com/JanDeDobbeleer/oh-my-posh) -- 21k stars,
  cross-platform prompt
- [Ratatui](https://github.com/ratatui/ratatui) -- 19k stars, Rust TUI

### Community Resources

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) --
  Curated list
- [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)
  -- Comprehensive toolkit
- [Claudetory Status Lines](https://claudetory.com/statuslines) -- Directory
- [ccusage Statusline Guide](https://ccusage.com/guide/statusline) -- Usage
  analysis

### Tutorials and Blog Posts

- [Creating The Perfect Claude Code Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- [Claude HUD: Real-Time Observability](https://pub.towardsai.net/claude-hud-building-real-time-observability-for-claude-code-via-the-statusline-api-b114b825d3ef)
- [felipeelias: Go statusline announcement](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
- [Dan Does Code: Custom Statusline](https://www.dandoescode.com/blog/claude-code-custom-statusline)

### Prior Research

- `Session #229 RESEARCH_OUTPUT`
  (`.planning/statusline-research/RESEARCH_OUTPUT.md`) -- 8-agent analysis,
  anomaly-driven design, canonical widget list, 3-phase implementation plan

---

## Methodology

This research was conducted on 2026-03-23 using 6 parallel sub-question
investigations:

| ID     | Sub-Question                                      | Scope                                                                            |
| ------ | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| SQ-001 | Claude Code statusline tools & plugins landscape  | All dedicated Claude Code statusline tools, official API, plugin marketplace     |
| SQ-002 | Terminal statusbar frameworks outside Claude Code | General-purpose terminal status bar tools, multiplexers, TUI frameworks, prompts |
| SQ-003 | Visual layouts & design patterns                  | 8 layout patterns with ASCII mockups at 4 width tiers each                       |
| SQ-005 | Performance constraints & Windows status          | v2.1.81 API schema, render pipeline, Windows blocker status, fnm overhead        |
| SQ-006 | Implementation approaches                         | 9 approaches with performance benchmarks, effort estimates, capability matrices  |
| SQ-007 | Design inspiration from best implementations      | 15+ tools across Neovim, IDE, AI tool, TUI, tmux, and prompt categories          |

Note: SQ-004 was not produced (skipped in the sub-question allocation). All
findings were cross-referenced against the prior Session #229 research to
identify changes, corrections, and confirmations. De-duplication was applied
across findings with preference for the most recent/specific data.
