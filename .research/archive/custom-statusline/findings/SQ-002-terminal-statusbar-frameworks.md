# SQ-002: Terminal Statusline/Status-Bar Frameworks Outside Claude Code

**Researched:** 2026-03-23 **Scope:** All general-purpose terminal status bar
tools, libraries, and approaches outside the Claude Code ecosystem

---

## Executive Summary

Terminal status bar solutions fall into 5 distinct categories: (1) standalone
status bar tools that ARE status bars, (2) terminal multiplexers that INCLUDE
status bars, (3) shell prompt frameworks that could serve as status-like
displays, (4) TUI frameworks that provide status bar COMPONENTS for building
custom apps, and (5) CLI dashboard tools that could be ADAPTED. The most
directly relevant for a "persistent bottom bar showing live data" use case are
**shox**, **bottombar**, and the multiplexer-based approaches (tmux/zellij). TUI
frameworks (bubbletea, ratatui, textual, ink) are overkill for a simple status
bar but offer maximum flexibility.

---

## Category 1: Standalone Terminal Status Bar Tools

These tools ARE status bars -- their primary purpose is showing a persistent
status line.

### 1.1 Shox

| Field            | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| **Name**         | shox                                                                 |
| **URL**          | https://github.com/liamg/shox                                        |
| **Language**     | Go                                                                   |
| **GitHub Stars** | ~723                                                                 |
| **Windows**      | No (Mac/Linux only)                                                  |
| **Status**       | Experimental, appears unmaintained (last significant activity ~2020) |

**What it does:** A customizable, universally compatible terminal status bar.
Sits between the terminal and your shell as a proxy, intercepting all data and
adjusting ANSI coordinates so the status bar can be drawn without interfering
with the shell or its child programs.

**How it works:** Wraps your shell session. You run `shox` instead of running
your shell directly. It creates a PTY, proxies I/O, and reserves the bottom
line(s) for the status bar.

**Configuration:** Simple string format with helpers in braces (e.g., `{time}`),
pipe-delimited alignment (left|center|right), color support (16 named colors).

**Relevance to statusline:** This is the closest "pure status bar" tool.
However, the proxy approach means it must wrap the entire shell session, which
could conflict with Claude Code's own terminal management. Windows
incompatibility is a blocker for SoNash.

### 1.2 bottombar (Python)

| Field            | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| **Name**         | bottombar                                                                  |
| **URL**          | https://github.com/evalf/bottombar / https://pypi.org/project/bottombar/   |
| **Language**     | Python                                                                     |
| **GitHub Stars** | Small project (exact count not indexed)                                    |
| **Windows**      | Yes -- Windows Terminal recommended. Uses thread-based polling on non-Unix |
| **Status**       | Active, maintained                                                         |

**What it does:** A Python context manager that prints a status line at the
bottom of a terminal window. Functions as a state machine allowing multiple
individually submitted status items displayed simultaneously.

**How it works:** Uses VT100 escape sequences to set a scroll region that
excludes the bottom line. Regular output scrolls above the status bar without
interference. On Unix, uses SIGWINCH/SIGALRM signals. On Windows, spawns a
polling thread (1-second interval).

**Requirements:** VT100-capable terminal, Python 3.3+. No other dependencies.

**Relevance to statusline:** Lightweight, cross-platform, Python-native. Could
be adapted for a Node.js equivalent. The VT100 scroll-region technique is the
key insight -- it is the same approach that could be implemented in any
language. However, being Python-only limits direct integration with a
Node.js/TypeScript project.

### 1.3 DynamicTitle (PowerShell)

| Field            | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **Name**         | DynamicTitle                                                                   |
| **URL**          | https://mdgrs.hashnode.dev/building-your-own-terminal-status-bar-in-powershell |
| **Language**     | PowerShell                                                                     |
| **GitHub Stars** | N/A (PowerShell module)                                                        |
| **Windows**      | Yes (primary platform)                                                         |
| **Status**       | Blog post / module concept                                                     |

**What it does:** Uses the terminal title bar as a status display area. A
ScriptBlock runs on a background thread periodically, updating the terminal
window title with live data (git branch, CPU usage, network bandwidth).

**Relevance to statusline:** Clever hack but limited -- the title bar has
minimal space and is not always visible. Not a real bottom-bar solution.

---

## Category 2: Terminal Multiplexers with Built-in Status Bars

These tools INCLUDE status bars as part of a larger terminal multiplexing
system.

### 2.1 tmux

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Name**         | tmux                                   |
| **URL**          | https://github.com/tmux/tmux           |
| **Language**     | C                                      |
| **GitHub Stars** | ~37k                                   |
| **Windows**      | No native support (WSL/Cygwin only)    |
| **Status**       | Actively maintained, industry standard |

**What it does:** Terminal multiplexer with a built-in customizable status bar
at the bottom. The status bar is configurable via `.tmux.conf` and can display
arbitrary data through shell commands.

**Status bar plugins ecosystem:**

| Plugin                  | Stars | Description                                                                                                                     |
| ----------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| **tmux-powerline**      | ~3.4k | Hackable powerline segments in pure bash. Easily extensible with custom segments and themes.                                    |
| **tmux-powerkit**       | New   | "Ultimate" framework: 43 themes, 71 variants, 45 plugins, SWR caching, multi-layer performance optimization. Most feature-rich. |
| **tmux2k**              | ~380  | Highly customizable, easy to expand. Left/right plugin sections, per-plugin colors, 5-second refresh.                           |
| **limeline**            | Small | Minimalist, client/daemon architecture (no redraw wait). 5 built-in plugins. Written in Go.                                     |
| **tmuxline.vim**        | ~3.6k | Generates tmux statusline from vim/airline/lightline themes.                                                                    |
| **minimal-tmux-status** | ~200  | Shows only prefix key press status. Ultra-minimal.                                                                              |
| **tmux-dotbar**         | New   | Simple minimalist dot-style theme.                                                                                              |

**Relevance to statusline:** tmux is the gold standard for terminal status bars.
However, it requires running inside tmux, which means the entire terminal
session must be wrapped. It does NOT work natively on Windows. For SoNash on
Windows, this is not viable without WSL.

### 2.2 Zellij

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Name**         | Zellij                               |
| **URL**          | https://github.com/zellij-org/zellij |
| **Language**     | Rust                                 |
| **GitHub Stars** | ~23k                                 |
| **Windows**      | No native support (Linux/macOS only) |
| **Status**       | Actively maintained, growing fast    |

**What it does:** Modern terminal multiplexer with context-aware status bars.
Default UI has a top bar (session/tabs) and bottom bar (key bindings and
status). Status bar updates based on current mode (Pane, Tab, Resize, Scroll,
Session).

**Plugin system:** WebAssembly-based plugins written in Rust (or any language
compiling to WASM). Status bar itself is a plugin that can be replaced or
extended. Notable community status bar plugins:

- Configurable statusbar plugin (~898 stars)
- Compact bar variants (~35-39 stars)

**Relevance to statusline:** Modern, plugin-extensible, but same problem as tmux
-- requires wrapping the session, no Windows support. The WASM plugin
architecture is innovative but heavy for a simple status bar.

### 2.3 GNU Screen

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **Name**         | GNU Screen                                  |
| **URL**          | https://www.gnu.org/software/screen/        |
| **Language**     | C                                           |
| **GitHub Stars** | N/A (GNU project)                           |
| **Windows**      | No (Unix/Linux only)                        |
| **Status**       | Legacy, still maintained but feature-frozen |

**What it does:** Older terminal multiplexer with a `hardstatus` line
configurable at the bottom. Less flexible than tmux but simpler.

**Relevance to statusline:** Legacy option. Largely superseded by tmux and
Zellij for status bar use cases.

---

## Category 3: Shell Prompt Frameworks

These are NOT status bars but provide rich prompt displays that could serve
similar purposes.

### 3.1 Starship

| Field            | Value                                                             |
| ---------------- | ----------------------------------------------------------------- |
| **Name**         | Starship                                                          |
| **URL**          | https://github.com/starship/starship                              |
| **Language**     | Rust                                                              |
| **GitHub Stars** | ~48k                                                              |
| **Windows**      | Yes (full cross-platform: Bash, Fish, Zsh, PowerShell, Cmd, etc.) |
| **Status**       | Actively maintained, very popular                                 |

**What it does:** Minimal, blazing-fast, infinitely customizable prompt for any
shell. Modular architecture where each module (git status, language version,
battery, etc.) functions independently.

**Custom commands:** Can execute arbitrary shell commands and display output in
the prompt via `[custom.{name}]` sections in `starship.toml`.

**Relevance to statusline:** Starship is a PROMPT, not a status bar -- it only
updates when a new prompt is drawn (after each command). It cannot show
live-updating data between commands. However, for showing contextual info AT the
prompt line, it is the best cross-platform option. Could be used as a complement
to a status bar.

### 3.2 Powerlevel10k (p10k)

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Name**         | Powerlevel10k                                           |
| **URL**          | https://github.com/romkatv/powerlevel10k                |
| **Language**     | Zsh                                                     |
| **GitHub Stars** | ~53k                                                    |
| **Windows**      | Zsh only (not native Windows)                           |
| **Status**       | Maintenance mode ("life support" per community reports) |

**What it does:** Zsh theme with instant prompt, transient prompt, and "show on
command" segments that appear only when relevant to the command being typed.
Extremely fast.

**Relevance to statusline:** Zsh-only, prompt-based (same limitations as
Starship for live updates). Not cross-platform. Included for completeness as the
most-starred prompt project.

### 3.3 Oh My Posh

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Name**         | Oh My Posh                                   |
| **URL**          | https://github.com/JanDeDobbeleer/oh-my-posh |
| **Language**     | Go                                           |
| **GitHub Stars** | ~21k+                                        |
| **Windows**      | Yes (primary platform, full cross-platform)  |
| **Status**       | Actively maintained                          |

**What it does:** Cross-platform/cross-shell prompt renderer. Recently added
Claude Code integration for showing AI context in prompts.

**Notable:** Oh My Posh has a specific Claude Code integration (announced on
dev.to and ohmyposh.dev). This means it can show Claude Code session info in the
shell prompt. However, it is still a prompt renderer, not a persistent status
bar.

**Relevance to statusline:** The Claude Code integration makes this interesting
as a complement. It updates at prompt time only, not live. Windows-native.

### 3.4 Powerline

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Name**         | Powerline                              |
| **URL**          | https://github.com/powerline/powerline |
| **Language**     | Python                                 |
| **GitHub Stars** | ~14k                                   |
| **Windows**      | Partial (Python-based)                 |
| **Status**       | Maintained but slow development        |

**What it does:** Extensible statusline plugin originally for vim, expanded to
provide statuslines for tmux, shells (bash/zsh), and window managers (Awesome,
Qtile). Segment-based architecture.

**Relevance to statusline:** The OG statusline framework. Works across multiple
contexts (vim, tmux, shell). However, Python dependency and cross-application
approach make it heavy for a single-purpose status bar.

---

## Category 4: TUI Frameworks with Status Bar Components

These frameworks INCLUDE status bar widgets/components for building custom
terminal applications.

### 4.1 Bubble Tea + Bubbles (Go)

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Name**         | Bubble Tea / Bubbles                       |
| **URL**          | https://github.com/charmbracelet/bubbletea |
| **Language**     | Go                                         |
| **GitHub Stars** | ~30k (bubbletea)                           |
| **Windows**      | Yes                                        |
| **Status**       | Very actively maintained (Charmbracelet)   |

**What it does:** Elm Architecture-based TUI framework for Go. Bubbles library
provides reusable components (spinners, text inputs, lists, tables, progress
bars). Third-party statusbar bubble exists (e.g., `jqp/tui/bubbles/statusbar`).

**Relevance to statusline:** Would require writing a full Go application.
Overkill for a status bar, but the ecosystem (Lip Gloss for styling, Bubbles for
components) is excellent. 18,000+ apps built with it.

### 4.2 Gum (Go - Charmbracelet)

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Name**         | Gum                                  |
| **URL**          | https://github.com/charmbracelet/gum |
| **Language**     | Go                                   |
| **GitHub Stars** | ~19k                                 |
| **Windows**      | Yes                                  |
| **Status**       | Actively maintained                  |

**What it does:** Shell-scriptable TUI components. Provides formatters,
spinners, inputs, confirms, and other interactive widgets usable from shell
scripts without writing Go code.

**Relevance to statusline:** Could be used for one-shot formatted output in a
status context, but not designed for persistent live-updating status bars.

### 4.3 Ratatui (Rust)

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| **Name**         | Ratatui                            |
| **URL**          | https://github.com/ratatui/ratatui |
| **Language**     | Rust                               |
| **GitHub Stars** | ~19.1k                             |
| **Windows**      | Yes (via crossterm backend)        |
| **Status**       | Very actively maintained           |

**What it does:** Rust TUI framework (successor to tui-rs). Status bar available
via third-party `rat-widget` crate. Layout system allows arbitrary widget
composition.

**Relevance to statusline:** Would require writing a Rust application. The
crossterm backend provides Windows compatibility. Most performant option but
highest development cost.

### 4.4 Textual (Python)

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Name**         | Textual                               |
| **URL**          | https://github.com/Textualize/textual |
| **Language**     | Python                                |
| **GitHub Stars** | ~34.6k                                |
| **Windows**      | Yes                                   |
| **Status**       | Very actively maintained (Textualize) |

**What it does:** Modern Python TUI framework inspired by web development.
Built-in Footer widget for key bindings and status display. CSS-like styling.
Can also serve apps in a browser.

**Relevance to statusline:** Python-only. The Footer widget is close to what a
status bar needs. Heavy framework for just a status line.

### 4.5 Rich (Python)

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| **Name**         | Rich                                       |
| **URL**          | https://github.com/Textualize/rich         |
| **Language**     | Python                                     |
| **GitHub Stars** | ~50k+                                      |
| **Windows**      | Yes                                        |
| **Status**       | Actively maintained (same team as Textual) |

**What it does:** Rich text formatting and live display for terminals. The
`Live` class enables persistent updating displays. Status spinner/indicator
built-in.

**Relevance to statusline:** The `Live` class could power a status bar, but Rich
takes over the terminal output while live. Not designed for coexistence with
interactive shells.

### 4.6 Ink (Node.js)

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Name**         | Ink                                 |
| **URL**          | https://github.com/vadimdemedes/ink |
| **Language**     | TypeScript/JavaScript               |
| **GitHub Stars** | ~27k                                |
| **Windows**      | Yes                                 |
| **Status**       | Actively maintained                 |

**What it does:** React for interactive CLI apps. Uses Yoga for Flexbox layouts
in the terminal. Component-based with JSX. Ink UI provides additional widgets.

**Used by:** Gatsby, GitHub Copilot CLI, Prisma, Shopify CLI.

**Relevance to statusline:** The most relevant TUI framework for a
Node.js/TypeScript project like SoNash. Could build a custom status bar as a
React component. However, Ink takes over terminal rendering -- it is designed
for full CLI apps, not for injecting a status bar into an existing shell
session.

### 4.7 Blessed / Neo-Blessed (Node.js)

| Field            | Value                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| **Name**         | Blessed / Neo-Blessed                                                       |
| **URL**          | https://github.com/chjj/blessed / https://github.com/embarklabs/neo-blessed |
| **Language**     | JavaScript                                                                  |
| **GitHub Stars** | ~11k (blessed)                                                              |
| **Windows**      | Partial (terminal compatibility varies)                                     |
| **Status**       | blessed is unmaintained; neo-blessed has sporadic updates                   |

**What it does:** ncurses reimplementation in pure JavaScript. High-level widget
API with optimized rendering (painter's algorithm, damage buffer).
blessed-contrib adds dashboard widgets (graphs, ASCII art).

**Relevance to statusline:** Could build a status bar, but the library is
effectively abandoned. Unblessed (~27 widgets, React/JSX support) is a more
modern fork but less proven.

---

## Category 5: CLI Dashboard Tools (Adaptable)

These are full dashboard tools that COULD BE ADAPTED but are not status bars per
se.

### 5.1 WTFutil

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Name**         | WTFutil (wtf)                  |
| **URL**          | https://github.com/wtfutil/wtf |
| **Language**     | Go                             |
| **GitHub Stars** | ~16k                           |
| **Windows**      | Via WSL                        |
| **Status**       | Maintained                     |

**What it does:** Personal information dashboard for the terminal. 60+ modular
widgets (OpsGenie, Google Calendar, GitHub, Jira, etc.). YAML configured.
Full-screen dashboard.

**Relevance to statusline:** Full-screen dashboard, not a status bar. Could
theoretically be configured for a single-line layout but that is fighting the
tool's design.

### 5.2 Sampler

| Field            | Value                            |
| ---------------- | -------------------------------- |
| **Name**         | Sampler                          |
| **URL**          | https://github.com/sqshq/sampler |
| **Language**     | Go                               |
| **GitHub Stars** | ~12k                             |
| **Windows**      | Partial                          |
| **Status**       | Appears less active recently     |

**What it does:** Shell command execution, visualization, and alerting.
YAML-configured. Can visualize any metric obtainable via shell command. Supports
triggers and notifications.

**Relevance to statusline:** Full dashboard, not a status bar. The
YAML-to-shell-command pipeline is a useful pattern to borrow.

---

## Category 6: Terminal Emulator Built-in Status Bars

### 6.1 iTerm2 Status Bar

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| **Name**     | iTerm2 Status Bar                                |
| **URL**      | https://iterm2.com/documentation-status-bar.html |
| **Language** | Objective-C + Python API                         |
| **Windows**  | No (macOS only)                                  |
| **Status**   | Built-in feature of iTerm2                       |

**What it does:** Built-in configurable status bar with drag-and-drop
components: Battery, CPU, Memory, Network, Current Directory, Host Name, User
Name, Job Name, git state, Clock, Custom Action. Custom components writable in
Python.

**Relevance to statusline:** Best native implementation but macOS-only. The
component architecture (drag-drop, priority-based removal on space constraint)
is a good design reference.

### 6.2 Windows Terminal Status Bar (Proposed)

| Field      | Value                                             |
| ---------- | ------------------------------------------------- |
| **Name**   | Windows Terminal Status Bar                       |
| **URL**    | https://github.com/microsoft/terminal/issues/3459 |
| **Status** | Feature request since 2019, still in backlog      |

**What it does:** Proposed but never implemented. Optional bottom status bar for
Windows Terminal. Still an open issue.

**Relevance to statusline:** Confirms there is no native Windows Terminal status
bar. Any solution for Windows must be implemented at the application/shell
level, not the terminal emulator level.

---

## Comparative Analysis

### Tools That ARE Status Bars (most relevant)

| Tool            | Language | Windows    | Live Update | Shell Independence   | Maturity     |
| --------------- | -------- | ---------- | ----------- | -------------------- | ------------ |
| shox            | Go       | No         | Yes         | No (wraps shell)     | Experimental |
| bottombar       | Python   | Yes        | Yes         | Yes (library)        | Stable       |
| tmux status bar | C        | No (WSL)   | Yes         | No (requires tmux)   | Mature       |
| Zellij bar      | Rust     | No         | Yes         | No (requires zellij) | Growing      |
| iTerm2 bar      | ObjC     | No (macOS) | Yes         | Yes (native)         | Mature       |

### Tools That Could BUILD a Status Bar (framework approach)

| Framework  | Language | Windows | SoNash Stack Fit  | Effort |
| ---------- | -------- | ------- | ----------------- | ------ |
| Ink        | JS/TS    | Yes     | High (React/Node) | Medium |
| Bubble Tea | Go       | Yes     | Low (Go)          | Medium |
| Ratatui    | Rust     | Yes     | Low (Rust)        | High   |
| Textual    | Python   | Yes     | Low (Python)      | Medium |
| blessed    | JS       | Partial | Medium (Node)     | Medium |

### Key Technical Approaches

1. **PTY Proxy (shox):** Wrap shell in a pseudo-terminal, intercept I/O, reserve
   bottom lines. Most transparent but complex and fragile.

2. **VT100 Scroll Region (bottombar):** Set terminal scroll region to exclude
   bottom line(s). Simple, portable, but can conflict with programs that
   manipulate scroll regions.

3. **Terminal Multiplexer (tmux/zellij):** Full terminal windowing with
   dedicated status area. Most robust but requires running inside the
   multiplexer.

4. **Terminal Emulator Native (iTerm2):** Status bar is part of the terminal
   emulator itself. Best UX but platform-locked.

5. **Prompt Integration (Starship/p10k/OMP):** Show info at prompt time. No live
   updates but zero interference with shell.

6. **ANSI Cursor Positioning:** Direct cursor manipulation to draw at specific
   terminal positions. Fragile, conflicts with most interactive programs.

---

## Windows Compatibility Summary

For SoNash running on Windows, the options narrow significantly:

| Viable on Windows | Tool/Approach                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Yes               | bottombar (Python), Ink (Node.js), Starship (prompt), Oh My Posh (prompt), Ratatui (Rust) |
| Via WSL only      | tmux, shox, Zellij, WTFutil                                                               |
| No                | iTerm2, GNU Screen (effectively)                                                          |

---

## Recommendations for SoNash Context

1. **For a simple persistent status bar:** The VT100 scroll-region technique (as
   used by bottombar) is the most portable and least invasive approach. A
   Node.js implementation of this technique would integrate well with SoNash's
   stack.

2. **For a rich interactive status bar:** Ink (React for CLI) is the best
   Node.js/TypeScript option, but it takes over terminal rendering, making it
   unsuitable for injecting into an existing Claude Code session.

3. **For prompt-based info display:** Starship or Oh My Posh (with its Claude
   Code integration) can show contextual info at each prompt without any
   live-update requirement.

4. **The gap:** There is no mature, cross-platform, Node.js-native tool that
   provides a persistent, live-updating status bar that coexists cleanly with an
   interactive shell session. This is the niche a custom solution would fill.

---

## Sources

- [shox - GitHub](https://github.com/liamg/shox)
- [bottombar - PyPI](https://pypi.org/project/bottombar/)
- [bottombar - GitHub](https://github.com/evalf/bottombar)
- [tmux-powerline - GitHub](https://github.com/erikw/tmux-powerline)
- [tmux-powerkit - GitHub](https://github.com/fabioluciano/tmux-powerkit)
- [tmux2k - GitHub](https://github.com/2KAbhishek/tmux2k)
- [limeline - GitHub](https://github.com/mcartmell/limeline)
- [Zellij - GitHub](https://github.com/zellij-org/zellij)
- [Starship - GitHub](https://github.com/starship/starship)
- [Powerlevel10k - GitHub](https://github.com/romkatv/powerlevel10k)
- [Oh My Posh - GitHub](https://github.com/JanDeDobbeleer/oh-my-posh)
- [Oh My Posh Claude Code Integration](https://ohmyposh.dev/blog/oh-my-posh-claude-code-integration)
- [Powerline - GitHub](https://github.com/powerline/powerline)
- [Bubble Tea - GitHub](https://github.com/charmbracelet/bubbletea)
- [Gum - GitHub](https://github.com/charmbracelet/gum)
- [Ratatui - GitHub](https://github.com/ratatui/ratatui)
- [Textual - GitHub](https://github.com/Textualize/textual)
- [Rich - GitHub](https://github.com/Textualize/rich)
- [Ink - GitHub](https://github.com/vadimdemedes/ink)
- [Blessed - GitHub](https://github.com/chjj/blessed)
- [Neo-Blessed - GitHub](https://github.com/embarklabs/neo-blessed)
- [WTFutil - GitHub](https://github.com/wtfutil/wtf)
- [Sampler - GitHub](https://github.com/sqshq/sampler)
- [iTerm2 Status Bar Documentation](https://iterm2.com/documentation-status-bar.html)
- [Windows Terminal Status Bar Feature Request](https://github.com/microsoft/terminal/issues/3459)
- [PowerShell Status Bar (DynamicTitle)](https://mdgrs.hashnode.dev/building-your-own-terminal-status-bar-in-powershell)
- [Awesome Tmux](https://github.com/rothgar/awesome-tmux)
- [Awesome TUIs](https://github.com/rothgar/awesome-tuis)
