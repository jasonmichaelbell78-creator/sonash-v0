# SQ-007: Design Inspiration from Best Statusline/Status Bar Implementations

**Research Date:** 2026-03-23 **Status:** COMPLETE **Researcher:** Claude Agent
(SQ-007 sub-question)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Neovim Statuslines](#2-neovim-statuslines)
3. [IDE Status Bars](#3-ide-status-bars)
4. [AI Tool Status Indicators](#4-ai-tool-status-indicators)
5. [Terminal TUI Dashboards](#5-terminal-tui-dashboards)
6. [tmux Status Bar Ecosystem](#6-tmux-status-bar-ecosystem)
7. [Shell Prompts as Statuslines](#7-shell-prompts-as-statuslines)
8. [Cross-Cutting Design Principles](#8-cross-cutting-design-principles)
9. [Patterns Mapped to SoNash Needs](#9-patterns-mapped-to-sonash-needs)
10. [Recommended Design Language](#10-recommended-design-language)

---

## 1. Executive Summary

After analyzing 15+ tools across 5 categories (Neovim statuslines, IDE status
bars, AI tool indicators, terminal TUIs, and tmux themes), **seven design
principles** emerge that are directly applicable to Claude Code's statusline:

1. **Conditional visibility** (Starship, lualine) — show only when relevant
2. **Color-as-state** (VS Code, btop) — background color encodes mode
3. **Progressive density** (heirline, iTerm2) — graceful degradation by width
4. **Section symmetry** (lualine A-B-C-X-Y-Z) — left = identity, right = metrics
5. **Anomaly-only surfacing** (Starship, lazygit) — hide when healthy
6. **Spinner semantics** (Copilot, Warp) — distinct states for
   working/ready/error
7. **Glanceable hierarchy** (btop, JetBrains) — most important data scans first

The strongest inspiration for an AI-directed development workflow comes from
combining **lualine's 6-section architecture** with **Starship's conditional
modules**, **VS Code's color-as-state**, and the **Copilot CLI status sidebar
proposal's** context metrics layout.

---

## 2. Neovim Statuslines

### 2.1 lualine.nvim (6.8k+ stars)

**The gold standard for terminal statusline design.**

#### ASCII Layout

<!-- prettier-ignore -->
```
┌────────┬─────────────────────┬──────────────────────────────────────┬───────────┬──────────┬───────┐
│ NORMAL │  main  +3 ~1 -0    │ src/app/page.tsx                     │ utf-8  lf │ ts  42%  │ 23:17 │
│   A    │         B           │               C                      │     X     │    Y     │   Z   │
└────────┴─────────────────────┴──────────────────────────────────────┴───────────┴──────────┴───────┘
```

#### What Makes It Effective

- **6-section model (A-B-C-X-Y-Z):** Creates natural left-right grouping.
  Sections A/B/C fill from the left (identity, git, filename). Sections X/Y/Z
  fill from the right (encoding, progress, location). The `always_divide_middle`
  option prevents left from overrunning right.
- **Color gradient:** Section A has the strongest/brightest background color
  (mode indicator). Color intensity fades through B and C. This creates **visual
  hierarchy without reading text** — the bright badge on the left immediately
  signals mode.
- **Powerline separators:** The `and` Unicode characters create flowing
  transitions between sections. Each section's background bleeds into the next
  via the separator's foreground color matching the previous section's
  background.
- **Component system:** Each section contains one or more "components" (e.g.,
  `{'branch', 'diff', 'diagnostics'}`). Components are independently
  configurable with conditions, colors, icons, and formatters.
- **Conditional components:** Components can have a `cond` function. Example:
  LSP server name only shows when an LSP client is attached. This prevents
  blank/useless segments.

#### Design Principle: **Section Symmetry with Color Hierarchy**

Left side = "what am I" (mode, branch, file). Right side = "what are the
numbers" (encoding, position, time). The human eye scans left-to-right, so
identity comes first, metrics come last.

#### Translation to Claude Code

| lualine Section | Claude Code Equivalent | Purpose                       |
| --------------- | ---------------------- | ----------------------------- |
| A (mode)        | Session state icon     | `IDLE` / `WORKING` / `AGENT`  |
| B (branch/diff) | `main` + hook status   | Git branch + last hook result |
| C (filename)    | Current task/sprint    | What the AI is working on     |
| X (encoding)    | Cost tracker           | `$1.23` session cost          |
| Y (progress)    | Context remaining      | `████░░ 62% ~22 msgs`         |
| Z (location)    | Session timer          | `5h:42m` elapsed              |

---

### 2.2 heirline.nvim (1.2k+ stars)

**Maximum programmability via recursive inheritance.**

#### ASCII Layout (from cookbook)

<!-- prettier-ignore -->
```
┌─────────┬──────────────────┬──────────────────────────────────────────┬─────────────────┬──────┐
│ NORMAL  │  main ~2 +1     │ ~/project/src/utils/helpers.ts [+]       │  12 ⚠ 3 ⓧ 0    │ 42%  │
│  mode   │  git + diff      │  file path + modified flag                │  diagnostics    │ ruler│
└─────────┴──────────────────┴──────────────────────────────────────────┴─────────────────┴──────┘
```

#### What Makes It Effective

- **Recursive inheritance:** Components can inherit properties from parent
  components. A `Flexible` container component automatically distributes space
  among children. When space is tight, components with lower priority truncate
  first.
- **Condition + update system:** Components define `condition` (should I render
  at all?) and `update` (when should I re-evaluate?). This means expensive
  computations (like LSP diagnostics) only re-run on specific events, not every
  statusline refresh.
- **Pick-child pattern:** A parent component can dynamically choose which child
  to render based on conditions. Example: show a "simple" statusline in inactive
  windows, a "full" statusline in the active window.
- **No abstraction tax:** Unlike lualine's predefined A-B-C-X-Y-Z sections,
  heirline lets you define any number of sections in any arrangement. You build
  the structure from scratch.

#### Design Principle: **Programmable Degradation**

Heirline's `flexible` components are the most sophisticated approach to
responsive statuslines. Instead of hardcoded breakpoints, each component
declares its own priority, and the framework automatically truncates
lowest-priority components when space runs out. This is superior to manually
checking terminal width.

#### Translation to Claude Code

The `condition` + `update` pattern maps perfectly to Claude Code's statusline
refresh model (refresh after each assistant message, permission change, or vim
toggle). Expensive computations (reading hook-runs.jsonl, calculating session
cost) should only run on specific triggers, not every 300ms debounce.

The `pick-child` pattern could let the statusline show different layouts for
different states:

- During normal editing: show cost + context + branch
- During agent execution: show agent name + spinner + elapsed time
- During error state: show error summary + blink

---

### 2.3 galaxyline.nvim (Minimalist, condition-based)

#### ASCII Layout

<!-- prettier-ignore -->
```
┌────────────────────┬──────────────────────────────────────────┬──────────────────────┐
│ ▊ NORMAL  main   │  src/page.tsx                    ts      │   +2 ~1   42:17  │
│   left section      │              mid section                  │    right section     │
└────────────────────┴──────────────────────────────────────────┴──────────────────────┘
```

#### What Makes It Effective

- **Provider pattern:** Each component has a `provider` function that returns
  the text to display. The statusline is just a sequence of providers.
- **Condition-gated:** Components only render when their `condition` function
  returns true. Empty conditions = always render.
- **Separator awareness:** Each component can define `separator` and
  `separator_highlight`, controlling what goes between it and the next
  component. This is simpler than powerline arrows.

#### Design Principle: **Show Nothing by Default**

Galaxyline's approach is "add things" rather than "remove things." You start
with a blank bar and explicitly add each provider. This forces you to justify
every pixel of space.

#### Translation to Claude Code

The provider pattern maps directly to shell script functions. Each "widget" in
the Claude Code statusline script is a provider function that returns text. The
condition pattern means widgets can self-suppress:

```bash
# Widget only shows if there are hook warnings
hook_warnings() {
  local count=$(wc -l < hook-warnings-log.jsonl 2>/dev/null)
  [[ "$count" -gt 0 ]] && echo "⚠${count}"
}
```

---

### 2.4 evil_lualine and bubbles (Design Variants)

**evil_lualine** is the most replicated lualine config in the Neovim community.
It abandons the standard A-B-C-X-Y-Z layout in favor of a "one big section with
individual highlights" approach:

<!-- prettier-ignore -->
```
▊ ● NORMAL │  main │ src/page.tsx │                    │  lua_ls │ +2 ~1 │ LF │ 42:17 ▊
```

Key insight: The colored bar on the far left (`▊`) changes color based on mode
(green=NORMAL, blue=INSERT, red=VISUAL). This is a **single-character state
indicator** that's visible in peripheral vision.

**bubbles** wraps each segment in rounded brackets with distinct background
colors:

<!-- prettier-ignore -->
```
 NORMAL   main   src/page.tsx                     utf-8   ts   42%   23:17
```

Key insight: Bubbles create visual separation WITHOUT powerline arrows. Each
segment is self-contained. This is easier to implement and works with any font.

#### Translation to Claude Code

The single-character colored bar (`▊`) is extremely relevant. A Claude Code
statusline could use:

- `▊` green = idle, healthy
- `▊` blue = AI working
- `▊` yellow = warnings present
- `▊` red = errors or context >80%
- `▊` magenta = agent mode active

This costs exactly 1 character but provides instant peripheral-vision state
awareness.

---

## 3. IDE Status Bars

### 3.1 VS Code Status Bar

#### ASCII Layout

<!-- prettier-ignore -->
```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│  main*  0⚠  0✕ │  Go Live │                    │ Ln 23, Col 17 │ Spaces: 2 │ UTF-8 │ TS ⓘ │
│ ← workspace scope (left)                            → file scope (right) →                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Full-bar color encodes global state:**
  - Blue = folder/workspace open (normal)
  - Purple = no folder open (degraded)
  - Orange = debugging active
  - This means you never need to READ the status bar to know the current mode —
    the COLOR tells you instantly from peripheral vision.
- **Left = workspace scope, Right = file scope:** The left side shows
  project-level info (branch, errors, warnings). The right side shows file-level
  info (line/col, encoding, language). This separation prevents cognitive
  mixing.
- **Warning/error background highlighting:** Individual items can have
  `statusBarItem.warningBackground` (yellow) or `statusBarItem.errorBackground`
  (red) to call attention to specific problems without changing the entire bar.
- **Clickable segments:** Each segment is a button that opens a relevant panel.
  Branch opens source control. Errors/warnings open the problems panel. Line/Col
  opens "go to line." Every segment provides an action.
- **Extension-contributed items:** Third parties add items to left or right
  zones with priority numbers controlling ordering.

#### Design Principles

1. **Color-as-state at the global level** (whole bar background)
2. **Color-as-severity at the item level** (warning/error backgrounds)
3. **Scope separation** (workspace left, file right)
4. **Every item is actionable** (click = do something)

#### Translation to Claude Code

VS Code's **full-bar color-as-state** is the single most transferable pattern.
Claude Code's statusline could change its overall tone:

| State          | Color              | Meaning                     |
| -------------- | ------------------ | --------------------------- |
| Normal         | Default/dim        | Idle, healthy               |
| AI Working     | Blue background    | Claude is generating        |
| Agent Active   | Magenta background | Sub-agent is running        |
| Warning        | Yellow background  | Hook warnings, context >65% |
| Error/Critical | Red background     | Context >80%, build failure |
| Debugging      | Orange background  | User is in debug mode       |

The **item-level warning/error** pattern is also critical. Individual widgets
(like cost or context) could shift to warning/error colors independently:

- Cost widget turns yellow at $5, red at $10
- Context widget turns yellow at 65%, red at 80%
- Hook widget turns red when last run had failures

---

### 3.2 JetBrains IDE Status Bar

#### ASCII Layout

<!-- prettier-ignore -->
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 23:42  ⌥⇧  ● main │                       │ 512M/1024M │ ✓ │ LF │ UTF-8 │  Ln:42 Col:17  │
│ ← project info       ← stretch zone →        memory   insp  fmt  enc     cursor              │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Memory indicator widget:** A real-time bar showing heap usage (`512M/1024M`)
  that turns yellow/red as memory fills up. Clicking it triggers garbage
  collection. This is the **canonical example** of a resource widget that's both
  informational AND actionable.
- **Inspections widget (✓):** Shows a green checkmark when no problems, yellow
  triangle with count when warnings exist, red circle with count when errors
  exist. The icon ALONE tells the story — no text needed when healthy.
- **Encoding/format/line-ending:** Clickable to change, not just informational.
- **Configurable visibility:** Right-click the status bar to toggle individual
  widgets on/off. Users self-curate what they see.

#### Design Principles

1. **Healthy = quiet, unhealthy = loud** (checkmark vs error count)
2. **Resource meters are clickable actions** (memory click = GC)
3. **User-configurable density** (toggle widgets on/off)

#### Translation to Claude Code

The **memory indicator** pattern maps directly to the **context window meter**.
Both show "resource consumption out of total capacity" with color-coded urgency:

<!-- prettier-ignore -->
```
Context-as-JetBrains-memory:  ████████░░ 62% of 200K
                              ████████████░ 78%        ← turns yellow
                              ████████████████░ 92%    ← turns red + blinks
```

The **inspections widget** pattern maps to **hook health**:

- `✓` = last pre-commit hook passed cleanly
- `⚠3` = 3 hook warnings deferred
- `✕2` = 2 hook errors (blocks commit)

---

## 4. AI Tool Status Indicators

### 4.1 GitHub Copilot (VS Code)

#### Status Icon States

<!-- prettier-ignore -->
```
  ⟳  Copilot thinking...    (spinning icon, blue)
  ✓  Copilot ready          (checkmark, green — hidden in most themes)
  ⚠  Copilot warning        (triangle, yellow — auth issue, rate limit)
  ✕  Copilot disabled       (X mark, red — manually disabled or error)
  ~  Copilot suggesting     (tilde, subtle — inline suggestion available)
```

#### What Makes It Effective

- **Three-state clarity:** Working / Ready / Error covers all user needs. Users
  don't need to know HOW Copilot is working, just WHETHER it is.
- **Disappears when healthy:** When Copilot is working normally and not actively
  generating, the icon is minimal/hidden. It only demands attention when
  something is wrong.
- **Consistent position:** Always in the status bar, same spot. Users develop
  muscle memory for where to glance.

#### Design Principle: **State Machine Iconography**

The icon IS the status. No text needed. A 3-state machine (working/ready/error)
covers 95% of user needs. The icon only gets "loud" (colored, animated) when
action is needed.

#### Translation to Claude Code

Claude Code's statusline should have a **session state indicator** with these
states:

<!-- prettier-ignore -->
```
  ● IDLE        (green dot — Claude is ready for input)
  ⟳ WORKING     (spinning — Claude is generating a response)
  ◆ AGENT       (diamond — a sub-agent is executing)
  ▲ PERMISSION  (triangle — waiting for user permission)
  ✕ ERROR       (red X — session error or disconnected)
```

The spinning indicator is particularly important because Claude Code sessions
can have long generation times. Users glancing at the statusline should
instantly see "is Claude still working?"

---

### 4.2 Cursor AI Status Bar

#### ASCII Layout

<!-- prettier-ignore -->
```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  Cursor  claude-3.5-sonnet │ 12.4K tokens │ ⟳ Generating...  │  main  Ln 42, Col 17 │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Model name visible:** Users always know which model is active. This matters
  when switching between models with different capabilities/costs.
- **Token count:** Running token count helps users estimate cost and understand
  how much context has been consumed. This is unique to AI tools.
- **Generation state:** Explicit "Generating..." text with spinner, vs nothing
  when idle. Clear binary state.

#### Design Principle: **AI Resource Transparency**

AI tools have unique resources users care about: model identity, token
consumption, cost, and generation state. These deserve first-class status bar
real estate because they directly impact user decision-making (e.g., "should I
start a new session to save context?").

#### Translation to Claude Code

Model + token count + state is the **AI trifecta** that belongs in every AI tool
statusline:

<!-- prettier-ignore -->
```
 Opus 4 │ 42K/200K │ ● IDLE        ← healthy, plenty of context
 Opus 4 │ 156K/200K │ ⟳ WORKING   ← running low, Claude is busy
```

---

### 4.3 Copilot CLI Status Sidebar Proposal (Issue #981)

This design proposal (January 2026) is the most comprehensive vision for AI
coding session status. It proposes a sidebar (not a bar) with four sections:

#### Proposed Layout

<!-- prettier-ignore -->
```
┌─ Context ──────────────────────┐
│ Tokens: 42,156 / 200,000       │
│ Usage:  ████████░░ 21%          │
│ Cost:   $1.23 this session      │
├─ MCP Servers ──────────────────┤
│ ● memory       connected        │
│ ● sonarcloud   connected        │
│ ○ slack         disconnected     │
├─ Modified Files ───────────────┤
│  src/app/page.tsx    +23 -5     │
│  lib/service.ts      +12 -0     │
│  3 files changed                │
├─ Agent Skills ─────────────────┤
│ ✓ Read/Write files              │
│ ✓ Execute bash                  │
│ ✓ Web search                    │
│ ○ GitHub (not connected)        │
└────────────────────────────────┘
```

#### What Makes It Effective

- **Everything in one glance:** Context metrics, tool connectivity, file
  changes, and agent capabilities — all visible without switching views.
- **Status icons per item:** Green dot for connected, hollow dot for
  disconnected. Immediate visual scan.
- **Resource-first ordering:** Token count and cost are at the TOP because
  they're the most decision-relevant metrics. File changes are secondary.

#### Design Principle: **Full Session Awareness**

An AI coding session has many dimensions that traditional IDE status bars don't
capture: token budget, model selection, tool connectivity, cost accrual. The
sidebar proposal acknowledges that these need dedicated space.

#### Translation to Claude Code

While Claude Code's statusline is a single line (not a sidebar), the
**information hierarchy** from this proposal is directly applicable:

1. Context/tokens (most urgent — drives session decisions)
2. Cost (financial awareness)
3. State/connectivity (is everything working?)
4. Changed files (what has the AI touched?)

The statusline should prioritize in this same order. When width forces
truncation, cost and context survive; file changes are dropped first.

---

### 4.4 Warp Terminal AI Status

#### Key Design Decisions

- **Agent status persists while commands run.** Before this change, the status
  indicator disappeared during command execution, leaving users wondering if the
  agent was still active. Persistence solved this.
- **"Warping..." with stop button:** During agent operations, Warp shows a
  "Warping..." label with a stop button inline. The stop affordance is adjacent
  to the status, not in a separate location.
- **Agent tips under indicator:** Contextual help text appears below the status
  indicator during agent work, teaching users what the agent is doing.
- **Block-based output grouping:** Commands and outputs are grouped into atomic
  "blocks" with metadata (exit code, directory, branch, timestamp). The block
  header IS a micro-statusline for each command.

#### Design Principle: **Status Persistence During Long Operations**

For AI-directed workflows where operations can take minutes, status must NEVER
disappear. The status should be the one thing that's always visible, even when
output is scrolling, even when commands are running.

#### Translation to Claude Code

Claude Code already handles this via the statusline's position (separate from
the scrolling output). But the "stop button adjacent to status" pattern is
interesting — if the statusline could show `⟳ WORKING [Ctrl+C to stop]` during
generation, it would provide both status AND affordance.

---

## 5. Terminal TUI Dashboards

### 5.1 btop (System Monitor)

#### ASCII Layout (simplified header region)

<!-- prettier-ignore -->
```
┌─ CPU ────────────────────────────────────────────────────────────────────────────────────┐
│ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                    Usage: 23% │ 3.4 GHz │
│ Core 0 ████████░░░░░░░░░░░░ 42%    Core 4 ██████░░░░░░░░░░░░░░░░ 31%                   │
│ Core 1 ████████████░░░░░░░░ 62%    Core 5 ██████████░░░░░░░░░░░░ 48%                   │
│ Core 2 ██░░░░░░░░░░░░░░░░░░  8%    Core 6 ████░░░░░░░░░░░░░░░░░░ 18%                   │
│ Core 3 ████████████████████ 98%    Core 7 ██████████████░░░░░░░░ 71%                   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Braille pattern sparklines (▁▂▃▄▅▆▇█):** Historical data in minimal vertical
  space. A 30-character sparkline shows the last 30 data points at a glance.
  This is far more informative than a single number.
- **Color-coded severity on bars:** Green (<50%), yellow (50-80%), red (>80%).
  Every progress bar uses the same color language, creating consistency.
- **Box model layout:** Each section (CPU, Memory, Network, Disk, Process) is in
  its own box with a labeled border. Boxes can be toggled on/off with keyboard
  shortcuts (1-5, d). This is the **section toggle** pattern.
- **Information density scaling:** btop renders completely differently at
  80-column vs 200-column widths. At narrow widths, sparklines shrink, per-core
  bars disappear, and only summary stats remain.

#### Design Principles

1. **Sparklines > single numbers** (show trend, not just current value)
2. **Consistent color language** (green/yellow/red means the same everywhere)
3. **Toggle-able sections** (user controls density)
4. **Responsive to terminal width** (graceful degradation)

#### Translation to Claude Code

Sparklines for context consumption over time would be extremely valuable:

<!-- prettier-ignore -->
```
Context: ▁▂▃▃▄▅▆▇ 62%    ← shows context growing over the session
Cost:    ▁▁▁▂▃▅▆▇ $4.23   ← shows cost acceleration (expensive messages)
```

A 10-character sparkline showing the last 10 context readings would tell the
user whether context is growing slowly (safe) or rapidly (danger). This is
dramatically more useful than a single percentage.

---

### 5.2 lazygit (Git TUI)

#### ASCII Layout (header bar)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Branches   Commits   Stash   │  Files ──────────────────────────  │  main ↑2 ↓0      │
│  ← navigation tabs              ← active panel label                ← branch + sync    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Tab metaphor for panels:** The header shows which panel is active by
  highlighting its tab. This is orientation in a multi-panel interface.
- **Sync status in one glance:** `↑2 ↓0` immediately tells you: 2 commits to
  push, 0 to pull. Two numbers replace what would be a sentence of text.
- **Contextual keybindings at bottom:** The bottom bar shows available keyboard
  shortcuts for the currently active panel. The bar content CHANGES based on
  context, showing only relevant actions.

#### Design Principle: **Contextual Action Hints**

The status bar should change based on what the user is DOING, not just show
static information. When you're in the files panel, you see file-related
shortcuts. When you're in commits, you see commit-related shortcuts.

#### Translation to Claude Code

The `↑2 ↓0` sync notation could map to uncommitted changes and deferred debt
items:

<!-- prettier-ignore -->
```
 main  ↑3 uncommitted │ ⚠2 deferred
```

The contextual action hints could manifest as the statusline showing different
information during different phases:

- During coding: branch + context + cost
- During review: review items remaining + pass count
- During commit: hook status + files staged + warnings

---

### 5.3 Yazi (File Manager)

#### ASCII Layout (status bar)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ~/projects/sonash-v0/src                      0/42 selected │ 156 items │ Sort: name ↑ │
│ ← current path (left)                          → selection + metadata (right)           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### What Makes It Effective

- **Path is king:** The most valuable information (where you are) gets the most
  space. Everything else is secondary.
- **Selection state is always visible:** `0/42 selected` tells you both how many
  are selected AND how many exist. The denominator provides context.
- **Minimal text, maximum meaning:** `Sort: name ↑` uses an arrow instead of
  "ascending." Every character carries meaning.

#### Design Principle: **Context = Location + Selection**

For navigation tools, the two questions users always have are "where am I?" and
"what do I have selected?" Both must always be visible.

#### Translation to Claude Code

The "where am I?" principle maps to **session orientation**:

- Current branch (where in the codebase)
- Current task/sprint (where in the work)
- Session number (where in the project history)

The "x/y selected" pattern maps to **progress framing**:

- `3/8 hooks passed` during pre-commit
- `$1.23/$10.00 budget` if a budget is set
- `42K/200K context` with fraction, not just percentage

---

## 6. tmux Status Bar Ecosystem

### 6.1 Architecture

tmux pioneered the three-zone status bar that every other tool now copies:

<!-- prettier-ignore -->
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [session:0]  0:bash* 1:vim  2:logs                             cpu:12% │ mem:4.2G │ Mar-23 14:30│
│ ← status-left          ← window-list (center, auto)                →     status-right →          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Catppuccin tmux Theme

**The most popular tmux theme (8k+ stars).** Uses pastel colors with high
contrast against dark backgrounds.

Key design decisions:

- **Module system:** Status segments are configurable modules: `application`,
  `cpu`, `session`, `battery`, `directory`, `date_time`
- **Window status styling:** Active window gets a distinct background color.
  Inactive windows are dimmed. This is the tab-highlight pattern.
- **Separator customization:** Choose between powerline arrows, rounded bubbles,
  or no separators.

### 6.3 Dracula tmux Theme

Uses a darker, higher-contrast palette. Key additions over Catppuccin:

- **Plugin system:** Includes `git`, `github`, `kubernetes`, `terraform`, `cpu`,
  `memory`, `datetime` as toggleable plugins.
- **GitHub integration:** Shows PR count and issue count directly in the status
  bar via API.
- **Kubernetes context:** Shows current k8s cluster/namespace. This is an
  example of showing "which environment am I targeting?"

### 6.4 tmux-powerkit

The most advanced tmux status framework:

- **Conditional display with `if-shell`:** Uses `#{client_width}` to show/hide
  segments based on terminal width. Below 120 columns, CPU is hidden. Below 80,
  only session name and clock remain.
- **Segment ordering:** `@tmux_status_format = "cwd|sysinfo|clock"` lets users
  define segment order declaratively.

#### Design Principle: **Width-Aware Conditional Segments**

tmux's `if-shell` with width checks is the original responsive design for
terminal status bars. Segments have explicit width thresholds.

#### Translation to Claude Code

The Claude Code statusline already has access to terminal width. A tiered
display system:

<!-- prettier-ignore -->
```
Width ≥ 120: ▊ ● main │ S#234 │ $1.23 │ ✓ hooks │ ████████░░ 62% ~22msgs │ 5h:42m
Width ≥ 100: ▊ ● main │ $1.23 │ ████████░░ 62% │ 5h:42m
Width ≥ 80:  ▊ ● main │ $1.23 │ 62% │ 5h:42m
Width ≥ 60:  ▊ ● main │ 62%
Width < 60:  ▊ 62%
```

---

## 7. Shell Prompts as Statuslines

### 7.1 Starship Prompt

**The conditional-module pioneer.** Starship only shows modules when they're
relevant:

<!-- prettier-ignore -->
```
# In a git repo with Node project, after a slow command:
  ~/.local/bin/sonash-v0 on  main via  v22.14.0 took 3s
❯

# In a plain directory:
  ~/Downloads
❯
```

#### What Makes It Effective

- **Conditional formatting:** `(@$region)` syntax — if `$region` is empty, the
  entire parenthetical group vanishes. No blank spaces, no empty separators.
- **Module detection:** Node version only shows when `package.json` exists.
  Python version only shows in a virtualenv. Git info only in a repo. The prompt
  ADAPTS to the project type.
- **Duration module:** `took 3s` only appears when a command takes >2 seconds.
  Fast commands show nothing. This is **anomaly-only surfacing** — information
  appears only when it's noteworthy.
- **No empty states:** When a module has nothing to show, it doesn't render a
  blank space or placeholder. It simply doesn't exist. The prompt is exactly as
  wide as its content.

#### Design Principle: **Anomaly-Driven Display**

The most important lesson from Starship: **healthy systems should be quiet.** A
module should earn its screen space by having something noteworthy to say. If
everything is normal, show nothing (or minimal).

#### Translation to Claude Code

Apply anomaly-only surfacing to Claude Code widgets:

| Widget        | Shows When                              | Hides When                    |
| ------------- | --------------------------------------- | ----------------------------- |
| Hook status   | Last hook had warnings/errors           | Last hook passed clean        |
| Cost          | Always (but color shifts at thresholds) | Never — always relevant       |
| Context       | Always (core metric)                    | Never — always relevant       |
| Session timer | After 30 min (long session awareness)   | First 30 min (not noteworthy) |
| Debt alerts   | New debt items since last check         | No new debt                   |
| Agent name    | Agent is running                        | No agent active               |
| Branch        | Always (orientation)                    | Never                         |

This means a perfectly healthy session shows only:

<!-- prettier-ignore -->
```
▊ ● main │ $0.42 │ ████░░░░░░ 28%
```

And a session with issues shows:

<!-- prettier-ignore -->
```
▊ ⚠ main │ ⚠3 hooks │ DEBT+2 │ $4.23 │ ████████████░░ 78% │ 3h:12m
```

The bar GROWS when there are problems. This is the inverse of most status bars
(which are always the same width). Growth itself becomes a signal.

---

## 8. Cross-Cutting Design Principles

### Principle 1: Color Language Consistency

Every tool studied uses the same color language:

| Color          | Meaning                           | Examples                                       |
| -------------- | --------------------------------- | ---------------------------------------------- |
| Green          | Healthy / ready / normal          | Copilot ready, btop <50%, lualine NORMAL       |
| Yellow/Orange  | Warning / caution / elevated      | VS Code debugging, btop 50-80%, context 65-80% |
| Red            | Error / critical / action needed  | Copilot error, btop >80%, context >80%         |
| Blue           | Active / working / information    | VS Code workspace, Copilot thinking            |
| Magenta/Purple | Special mode / elevated state     | VS Code no-folder, agent mode                  |
| Dim/Gray       | Inactive / secondary / background | Inactive windows, disabled modules             |

**Lesson:** Never violate this language. Users have deep conditioning from
decades of traffic lights, btop, VS Code, and every other tool.

### Principle 2: The 5-7 Widget Rule

Microsoft's status bar guidelines state: "Having more than five or six
indicators can overwhelm users and make it harder to focus."

Tools that violate this (JetBrains with 10+ widgets) compensate by making
widgets toggleable. Tools that follow this (Starship, minimal tmux) are praised
for clarity.

**Lesson:** Default to 5-7 widgets maximum. Allow power users to add more, but
the default should be focused.

### Principle 3: Healthy = Quiet, Unhealthy = Loud

Across ALL tools studied:

- JetBrains inspections: `✓` when clean, `⚠3 ✕2` when problems
- Copilot: nearly invisible when working, loud when broken
- Starship duration: hidden for fast commands, visible for slow ones
- btop colors: green fades into background, red demands attention

**Lesson:** The statusline should be almost ignorable when everything is fine.
Problems should make the bar visually LOUDER (more color, more text, more
contrast).

### Principle 4: Progressive Disclosure by Width

Tools handle narrow terminals differently:

| Tool     | Strategy                                                   |
| -------- | ---------------------------------------------------------- |
| tmux     | `if-shell #{client_width}` — conditional segments          |
| heirline | Priority-based flex — framework decides what fits          |
| lualine  | `always_divide_middle` — left/right don't overlap          |
| iTerm2   | Compression resistance — low-priority items collapse first |
| btop     | Complete layout reconfiguration at breakpoints             |

**Lesson:** Define a clear priority order. When space is limited, the MOST
important widget (context %) should be the LAST to disappear.

### Principle 5: Left = Identity, Right = Metrics

Across lualine, VS Code, tmux, lazygit, and Yazi:

- **Left side:** Identity, location, mode, branch — "who/what/where am I?"
- **Right side:** Numbers, metrics, timestamps — "what are the measurements?"

**Lesson:** Never put metrics on the left or identity on the right. The eye
scans left-to-right: orientation first, details second.

### Principle 6: One Character Can Do the Work of Ten

- lualine evil: `▊` colored bar = mode indicator (1 char)
- Copilot: `●` / `⟳` / `✕` = ready/working/error (1 char)
- lazygit: `↑2 ↓0` = sync status (5 chars replacing a sentence)
- btop sparkline: `▁▂▃▅▆▇` = trend history (6 chars replacing a graph)

**Lesson:** Invest in dense, symbolic representations. A well-chosen Unicode
character replaces words.

### Principle 7: Refresh on Events, Not Timers

- heirline: `update` events trigger re-evaluation of specific components
- VS Code: Status bar items update on specific VS Code events
- Claude Code: Refresh after assistant message, permission change, vim toggle

**Lesson:** Timer-based polling wastes resources and creates flicker.
Event-driven updates are smoother and more efficient.

---

## 9. Patterns Mapped to SoNash Needs

### SoNash Widget Requirements vs Design Inspiration Sources

| SoNash Need           | Best Inspiration                          | Pattern to Apply                                  |
| --------------------- | ----------------------------------------- | ------------------------------------------------- |
| **Session awareness** | Warp (persistent status)                  | Never disappear during operations                 |
| **Cost tracking**     | Cursor (token count)                      | Always visible, color-coded thresholds            |
| **Context usage**     | JetBrains memory widget + btop sparklines | Bar + trend sparkline                             |
| **Health monitoring** | JetBrains inspections + Starship anomaly  | Quiet when healthy, loud on problems              |
| **Agent status**      | Copilot state machine                     | 5-state icon: idle/working/agent/permission/error |
| **Hook results**      | JetBrains inspections                     | `✓` clean / `⚠N` warnings / `✕N` errors           |
| **Git branch**        | lualine section B                         | Left side, always visible                         |
| **Session timer**     | Starship duration                         | Only show after threshold (30 min)                |
| **Debt alerts**       | Starship conditional                      | Only show when new items exist                    |
| **Width handling**    | heirline flex + tmux width checks         | Priority-based progressive degradation            |

### Composite Design: SoNash "Best of All Worlds"

Taking the strongest pattern from each inspiration source:

#### Full Width (120+ chars)

<!-- prettier-ignore -->
```
▊ ● main │ S#234 │ $1.23 │ ✓ hooks │ ▂▃▄▅▆▇ 62% ~22 msgs │ 5h:42m
```

Breakdown:

- `▊` — evil_lualine single-char state indicator (green=healthy)
- `●` — Copilot-style session state (ready)
- `main` — lualine section B (branch)
- `S#234` — Yazi "where am I" (session number)
- `$1.23` — Cursor AI cost transparency
- `✓ hooks` — JetBrains inspections pattern (quiet when clean)
- `▂▃▄▅▆▇ 62%` — btop sparkline + percentage (trend + current)
- `~22 msgs` — Copilot CLI proposal context metric
- `5h:42m` — Starship duration (only after threshold)

#### Anomaly State (same width, problems present)

<!-- prettier-ignore -->
```
▊ ⟳ main │ ◆agent │ $4.23 │ ⚠3 hooks │ ▅▆▇█████ 82% ~6 msgs │ 3h:12m
```

Changes visible:

- `▊` — now yellow (warning threshold crossed)
- `⟳` — Copilot-style working indicator (Claude is generating)
- `◆agent` — agent name visible (Copilot state: special mode)
- `$4.23` — cost turns yellow (threshold crossed)
- `⚠3 hooks` — JetBrains pattern: quiet → loud
- Sparkline shows rapid growth (▅▆▇█████) — btop trend reading
- `82%` — red context (threshold)
- `~6 msgs` — urgency: few messages remaining

---

## 10. Recommended Design Language

### Color Palette (following universal conventions)

```
STATE COLORS (bar edge indicator):
  Green  (#50fa7b) — healthy, idle, ready
  Blue   (#8be9fd) — AI working, processing
  Yellow (#f1fa8c) — warning, elevated attention
  Red    (#ff5555) — critical, error, action needed
  Magenta(#ff79c6) — agent mode, special state

WIDGET COLORS (individual segments):
  Dim white (#f8f8f2 at 60%) — normal values
  Bright white (#f8f8f2) — emphasized values
  Cyan (#8be9fd) — branch names, identifiers
  Green (#50fa7b) — healthy indicators (✓)
  Yellow (#f1fa8c) — warning indicators (⚠)
  Red (#ff5555) — error indicators (✕)

SEPARATOR COLOR:
  Dark gray (#44475a) — pipe separators (│)
```

### Typography and Symbols

```
SEPARATORS:
  │  — thin pipe (standard, works in all fonts)
    — powerline arrow right (requires patched font)
    — powerline arrow left (requires patched font)

STATE INDICATORS:
  ●  — ready/idle (filled circle)
  ⟳  — working/spinning (cycle symbol)
  ◆  — agent active (filled diamond)
  ▲  — permission needed (triangle)
  ✕  — error (multiplication X)

HEALTH INDICATORS:
  ✓  — clean/passing (checkmark)
  ⚠  — warnings present (warning triangle)
  ✕  — errors present (X mark)

PROGRESS BAR:
  █  — filled block
  ░  — empty block
  ▏▎▍▌▋▊▉█ — eighth-width blocks for fine granularity

SPARKLINE:
  ▁▂▃▄▅▆▇█ — eighth-height blocks for trend display

DIRECTION:
  ↑  — upstream/push
  ↓  — downstream/pull
```

### Layout Rules

1. **Left-to-right priority:** State → Branch → Task → Cost → Health → Context →
   Timer
2. **Always visible (never drop):** State indicator, Context percentage
3. **Drop order (first dropped → last dropped):** Timer → Task → Health → Cost →
   Branch → Context → State
4. **Separator:** Thin pipe (`│`) between all segments (no powerline arrows by
   default — they require font support)
5. **Spacing:** Single space padding inside each segment
6. **Max segments:** 7 at full width, 2 at minimum width

---

## Sources

### Neovim Statuslines

- [lualine.nvim GitHub](https://github.com/nvim-lualine/lualine.nvim)
- [lualine Component Snippets Wiki](https://github.com/nvim-lualine/lualine.nvim/wiki/Component-snippets)
- [evil_lualine.lua Example](https://github.com/nvim-lualine/lualine.nvim/blob/master/examples/evil_lualine.lua)
- [heirline.nvim GitHub](https://github.com/rebelot/heirline.nvim)
- [heirline Cookbook](https://github.com/rebelot/heirline.nvim/blob/master/cookbook.md)
- [heirline-components.nvim](https://github.com/Zeioth/heirline-components.nvim)
- [galaxyline.nvim GitHub](https://github.com/nvimdev/galaxyline.nvim)
- [Customizing nvim lualine](https://yeripratama.com/blog/customizing-nvim-lualine/)
- [Lualine for Neovim (Medium)](https://medium.com/@shaikzahid0713/lualine-for-neovim-776b79861699)

### IDE Status Bars

- [VS Code Status Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/status-bar)
- [VS Code Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)
- [VS Code Status Bar Color Explained](https://iancarpenter.dev/2019/07/28/vs-code-status-bar-colour-why-purple-why-blue/)
- [JetBrains Status Bar Widgets SDK](https://plugins.jetbrains.com/docs/intellij/status-bar-widgets.html)
- [JetBrains Error Stripe and Status Indicator](https://www.jetbrains.com/help/rider/Code_Analysis__Status_Indicator.html)
- [JetBrains User Interface Guide](https://www.jetbrains.com/help/idea/guided-tour-around-the-user-interface.html)

### AI Tool Status Indicators

- [Copilot CLI Status Sidebar Proposal (Issue #981)](https://github.com/github/copilot-cli/issues/981)
- [Copilot CLI Token Visualization (Issue #7823)](https://github.com/microsoft/vscode-copilot-release/issues/7823)
- [Copilot CLI Context & Token Management](https://deepwiki.com/github/copilot-cli/3.7-context-and-token-management)
- [Cursor vs GitHub Copilot (DigitalOcean)](https://www.digitalocean.com/resources/articles/github-copilot-vs-cursor)

### Terminal TUI Dashboards

- [btop GitHub](https://github.com/aristocratos/btop)
- [lazygit GitHub](https://github.com/jesseduffield/lazygit)
- [Yazi GitHub](https://yazi-rs.github.io/)
- [awesome-tuis](https://github.com/rothgar/awesome-tuis)
- [Yazi Customizable Status Bar Discussion](https://github.com/sxyazi/yazi/discussions/686)

### tmux Themes and Status Bars

- [awesome-tmux](https://github.com/rothgar/awesome-tmux)
- [Catppuccin tmux Theme](https://github.com/catppuccin/tmux)
- [Dracula tmux Theme](https://github.com/dracula/tmux)
- [tmux-powerkit](https://github.com/fabioluciano/tmux-powerkit)
- [minimal-tmux-status](https://github.com/niksingh710/minimal-tmux-status)
- [Tao of tmux: Status Bar](https://tao-of-tmux.readthedocs.io/en/latest/manuscript/09-status-bar.html)
- [Baeldung: Customize tmux Status Bar](https://www.baeldung.com/linux/tmux-status-bar-customization)

### Shell Prompts

- [Starship Configuration](https://starship.rs/config/)
- [Starship GitHub](https://github.com/starship/starship)

### UX Design Principles

- [Microsoft Status Bars Design Basics](https://learn.microsoft.com/en-us/windows/win32/uxguide/ctrl-status-bars)
- [Apple Status Bars HIG](https://developer.apple.com/design/human-interface-guidelines/status-bars)
- [Carbon Design System: Status Indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/)
- [CLI UX Best Practices (Evil Martians)](https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays)
- [5 UX Best Practices for Status Indicators](https://www.koruux.com/blog/ux-best-practices-designing-status-indicators/)
- [AI UX Patterns for Design Systems](<https://thedesignsystem.guide/blog/ai-ux-patterns-for-design-systems-(part-1)>)
- [Slack AI Loading States UX](https://www.eesel.ai/blog/slack-ai-loading-states-ux)
- [Dashboard Information Architecture (GoodData)](https://www.gooddata.com/blog/six-principles-of-dashboard-information-architecture/)
- [Dashboard Design Best Practices (UXPin)](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Information Dashboard Design (Stephen Few)](https://www.amazon.com/Information-Dashboard-Design-At-Glance/dp/1938377001)

### Warp Terminal

- [Warp 2025 In Review](https://www.warp.dev/blog/2025-in-review)
- [Warp All Features](https://www.warp.dev/all-features)
- [Warp 2.0 Announcement](https://itsfoss.com/news/warp-terminal-2-0/)
- [Warp Terminal In-Depth (sparkco.ai)](https://sparkco.ai/blog/warp-terminal)
