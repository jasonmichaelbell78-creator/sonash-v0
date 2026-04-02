# SQ-007: Terminal Enhancement Tools for Windows 11

**Research Date:** 2026-03-23 **Researcher:** Claude (deep-research agent)
**Scope:** Terminal emulators, shells, multiplexers, prompts, TUI frameworks,
recording tools **Platform Focus:** Windows 11 native compatibility

---

## Summary

Researched 25+ tools across 6 categories. Windows compatibility varies
dramatically: emulators and prompts have excellent native support; multiplexers
and some shells require WSL. The Charmbracelet ecosystem stands out as the most
cohesive CLI tooling suite with strong Windows support.

**Top Picks for Windows 11 CLI user:**

1. **WezTerm** — Best terminal emulator (native Windows, built-in multiplexer,
   Lua config)
2. **Nushell** — Best modern shell (first-class Windows, structured data)
3. **Starship** or **Oh-My-Posh** — Best prompt (both native Windows)
4. **Charmbracelet suite** — Best CLI tools ecosystem (gum, glow, mods, freeze,
   vhs)

---

## Category 1: Terminal Emulators

### WezTerm

- **What:** GPU-accelerated cross-platform terminal with built-in multiplexer
  and Lua scripting
- **URL:** https://github.com/wezterm/wezterm
- **Install:** `winget install wez.wezterm` or `scoop install wezterm`
- **Stars/Activity:** ~23.3k stars; active development
- **Windows:** Yes (native, first-class)
- **Category:** emulator
- **Key feature:** Built-in multiplexer (splits, tabs, workspaces) eliminates
  need for tmux; Lua config enables programmable terminal behavior with
  hot-reload
- **Confidence:** HIGH

### Alacritty

- **What:** Minimalist, GPU-accelerated OpenGL terminal focused on raw
  performance
- **URL:** https://github.com/alacritty/alacritty
- **Install:** `winget install Alacritty.Alacritty` or `scoop install alacritty`
- **Stars/Activity:** ~63.1k stars; latest v0.17.0-rc1 (March 2026)
- **Windows:** Yes (native since v0.3.0)
- **Category:** emulator
- **Key feature:** Fastest terminal emulator available; minimal feature set by
  design — pair with tmux/zellij for splits
- **Confidence:** HIGH

### Ghostty

- **What:** Fast, native, feature-complete terminal by Mitchell Hashimoto
  (HashiCorp founder), written in Zig
- **URL:** https://github.com/ghostty-org/ghostty
- **Install:** N/A for Windows
- **Stars/Activity:** Very high activity; v1.3.0 released March 2026
- **Windows:** No (macOS/Linux only; Windows planned but no timeline)
- **Category:** emulator
- **Key feature:** Balance of speed + features + native platform UI; open source
- **Confidence:** HIGH (tool quality) / N/A (Windows — not available)

### Windows Terminal

- **What:** Microsoft's built-in modern terminal with GPU acceleration, tabs,
  and profiles
- **URL:** https://github.com/microsoft/terminal
- **Install:** Pre-installed on Windows 11; also via Microsoft Store
- **Stars/Activity:** ~97k stars; maintained by Microsoft
- **Windows:** Yes (native, first-party)
- **Category:** emulator
- **Key feature:** Zero-friction default; supports multiple shell profiles
  (PowerShell, Git Bash, WSL), GPU rendering, JSON config
- **Confidence:** HIGH

### Warp

- **What:** AI-powered terminal with block-based UI, command suggestions, and
  agent workflows
- **URL:** https://www.warp.dev
- **Install:** Download from warp.dev/download (Windows installer available
  since Feb 2025)
- **Stars/Activity:** Closed source; well-funded company
- **Windows:** Yes (native since Feb 2025; supports PowerShell, WSL, Git Bash)
- **Category:** emulator
- **Key feature:** AI-native workflows — command search, error explanation,
  agent mode; block-based output grouping
- **Confidence:** HIGH

### Rio

- **What:** Hardware-accelerated GPU terminal using WebGPU/Rust with native
  splits and tabs
- **URL:** https://github.com/raphamorim/rio
- **Install:** Download from GitHub releases (Windows binaries available)
- **Stars/Activity:** Growing; active development toward v0.3.0
- **Windows:** Yes (native)
- **Category:** emulator
- **Key feature:** WebGPU rendering engine (Sugarloaf); native splits/tabs
  without tmux; smooth scrolling on heavy output
- **Confidence:** MEDIUM (still pre-1.0, main branch can be unstable)

---

## Category 2: Shells

### Nushell

- **What:** Modern shell treating CLI output as structured data (tables,
  records, lists) with pipeline-native operations
- **URL:** https://github.com/nushell/nushell
- **Install:** `winget install nushell` or `scoop install nu`
- **Stars/Activity:** ~38.8k stars; v0.111.0 latest; very active
- **Windows:** Yes (first-class native Windows support — one of very few shells
  designed for Windows)
- **Category:** shell
- **Key feature:** Structured data pipelines — every command returns typed data
  you can filter, sort, group, select columns on. Revolutionary for data work in
  the terminal
- **Confidence:** HIGH

### Fish Shell

- **What:** Smart, user-friendly shell with syntax highlighting,
  autosuggestions, and tab completions out of the box
- **URL:** https://github.com/fish-shell/fish-shell
- **Install:** Via WSL (`apt install fish`) or MSYS2
- **Stars/Activity:** Very popular; v4.5.0 latest (2026); rewritten in Rust
  (v4.0+)
- **Windows:** Partial (WSL or MSYS2 only — no native Windows)
- **Category:** shell
- **Key feature:** Zero-configuration usability — syntax highlighting,
  autosuggestions, and completions work immediately without dotfile setup
- **Confidence:** HIGH (tool quality) / MEDIUM (Windows — WSL only)

### PowerShell 7

- **What:** Microsoft's cross-platform, object-oriented shell and scripting
  language
- **URL:** https://github.com/PowerShell/PowerShell
- **Install:** `winget install Microsoft.PowerShell` or pre-installed
- **Stars/Activity:** ~48k stars; actively maintained by Microsoft
- **Windows:** Yes (native, first-party)
- **Category:** shell
- **Key feature:** Object pipeline (like nushell but more mature); deep
  Windows/Azure integration; .NET scripting
- **Confidence:** HIGH

### Zsh (via Git Bash/MSYS2)

- **What:** Extended Bourne shell with plugin ecosystem (oh-my-zsh) and powerful
  completions
- **URL:** https://www.zsh.org/
- **Install:** Via MSYS2 (`pacman -S zsh`) or Git for Windows includes it
  partially
- **Stars/Activity:** Mature, stable; default shell on macOS
- **Windows:** Partial (MSYS2/Git Bash — not native)
- **Category:** shell
- **Key feature:** Massive plugin ecosystem via oh-my-zsh/zinit; highly
  customizable
- **Confidence:** MEDIUM (Windows experience is second-class)

---

## Category 3: Multiplexers

### WezTerm (built-in)

- **What:** WezTerm's integrated multiplexer — splits, tabs, workspaces, session
  persistence
- **URL:** https://wezterm.com/
- **Install:** Included with WezTerm
- **Stars/Activity:** See WezTerm above
- **Windows:** Yes (native)
- **Category:** multiplexer
- **Key feature:** No separate tool needed; Lua-scriptable layouts; remote
  multiplexing support
- **Confidence:** HIGH

### Windows Terminal Tabs/Panes

- **What:** Built-in tab and split-pane support in Windows Terminal
- **URL:** https://github.com/microsoft/terminal
- **Install:** Pre-installed
- **Stars/Activity:** See Windows Terminal above
- **Windows:** Yes (native)
- **Category:** multiplexer
- **Key feature:** Zero setup; Alt+Shift+D for splits, Ctrl+Shift+T for tabs;
  JSON-configurable keybindings
- **Confidence:** HIGH

### Zellij

- **What:** Modern terminal workspace with batteries included — floating panes,
  stacked panes, WebAssembly plugins
- **URL:** https://github.com/zellij-org/zellij
- **Install:** WSL only currently; Windows native in active development (merging
  as of Feb 2026)
- **Stars/Activity:** ~24k stars; very active
- **Windows:** Partial (WSL only; native Windows support actively being merged
  as of early 2026 — expect bugs)
- **Category:** multiplexer
- **Key feature:** Discoverable UI with keybinding hints; plugin system
  (WebAssembly); floating/stacked panes
- **Confidence:** HIGH (tool quality) / LOW (Windows native — still
  experimental)

### tmux

- **What:** Classic terminal multiplexer with session persistence, splits, and
  extensive scripting
- **URL:** https://github.com/tmux/tmux
- **Install:** WSL only (`apt install tmux`); or psmux for PowerShell-native
  alternative
- **Stars/Activity:** ~37k stars; mature and stable
- **Windows:** No (WSL only)
- **Category:** multiplexer
- **Key feature:** Battle-tested; session survives disconnects; massive
  ecosystem of plugins (tpm)
- **Confidence:** HIGH (tool quality) / LOW (Windows — WSL only)

---

## Category 4: Prompts

### Starship

- **What:** Minimal, blazing-fast, cross-shell prompt written in Rust with
  intelligent context display
- **URL:** https://starship.rs / https://github.com/starship/starship
- **Install:** `winget install Starship.Starship` or `scoop install starship`
- **Stars/Activity:** ~48k stars; very active
- **Windows:** Yes (native; works with PowerShell, cmd, bash, nushell, and more)
- **Category:** prompt
- **Key feature:** Works with ANY shell; auto-detects context (git branch, node
  version, rust version, etc.); TOML config; extremely fast
- **Confidence:** HIGH

### Oh-My-Posh

- **What:** Cross-platform prompt theme engine with 100+ pre-built themes and
  deep Windows integration
- **URL:** https://github.com/JanDeDobbeleer/oh-my-posh
- **Install:** `winget install JanDeDobbeleer.OhMyPosh`
- **Stars/Activity:** ~18k stars; active development; created specifically for
  Windows/PowerShell originally
- **Windows:** Yes (native; originally built FOR Windows)
- **Category:** prompt
- **Key feature:** Easiest setup of any prompt; huge theme gallery; async git
  status updates (faster in large repos than Starship); Windows-first heritage
- **Confidence:** HIGH

---

## Category 5: TUI Frameworks

### Charmbracelet / BubbleTea (Go)

- **What:** TUI framework for Go using Elm-architecture (Model-View-Update)
  pattern
- **URL:** https://github.com/charmbracelet/bubbletea
- **Install:** `go install github.com/charmbracelet/bubbletea@latest`
- **Stars/Activity:** ~30k stars; v2 released; extremely active ecosystem
- **Windows:** Yes (cross-platform Go binaries)
- **Category:** TUI framework
- **Key feature:** Elm architecture makes complex TUIs maintainable; companion
  libraries: Bubbles (components), Lip Gloss (styling), Huh (forms)
- **Confidence:** HIGH

### Ratatui (Rust)

- **What:** TUI framework for Rust — actively maintained fork of tui-rs with
  rich widget set
- **URL:** https://github.com/ratatui/ratatui
- **Install:** `cargo add ratatui`
- **Stars/Activity:** ~14k stars; very active
- **Windows:** Yes (cross-platform via crossterm backend)
- **Category:** TUI framework
- **Key feature:** Granular rendering control; immediate-mode rendering; large
  widget ecosystem
- **Confidence:** HIGH

### Textual (Python)

- **What:** Rapid TUI application framework for Python inspired by modern web
  development
- **URL:** https://github.com/Textualize/textual
- **Install:** `pip install textual`
- **Stars/Activity:** ~27k stars; active development by Textualize.io
- **Windows:** Yes (native; works best in Windows Terminal)
- **Category:** TUI framework
- **Key feature:** CSS-like styling; responsive layouts; can run apps in browser
  OR terminal; async-native; lowest barrier to entry (Python)
- **Confidence:** HIGH

### Ink (JavaScript/React)

- **What:** React-based TUI framework — build CLI apps using JSX components
- **URL:** https://github.com/vadimdemedes/ink
- **Install:** `npm install ink`
- **Stars/Activity:** ~28k stars; mature
- **Windows:** Yes (Node.js cross-platform)
- **Category:** TUI framework
- **Key feature:** If you know React, you know Ink — same component model,
  hooks, JSX for terminal UIs
- **Confidence:** HIGH

---

## Category 6: CLI Companion Tools

### Gum (Charmbracelet)

- **What:** Tool for glamorous shell scripts — prompts, spinners, file pickers,
  styled text
- **URL:** https://github.com/charmbracelet/gum
- **Install:** `winget install charmbracelet.gum` or `scoop install charm-gum`
- **Stars/Activity:** ~19k stars
- **Windows:** Yes (native)
- **Category:** CLI tool
- **Key feature:** Turn plain shell scripts into interactive experiences with
  one-liners: `gum choose`, `gum input`, `gum spin`
- **Confidence:** HIGH

### Glow (Charmbracelet)

- **What:** Markdown renderer for the terminal with glamorous styling
- **URL:** https://github.com/charmbracelet/glow
- **Install:** `winget install charmbracelet.glow` or `scoop install glow`
- **Stars/Activity:** ~17k stars
- **Windows:** Yes (native)
- **Category:** CLI tool
- **Key feature:** Read and browse markdown files beautifully in the terminal;
  stash feature for bookmarking
- **Confidence:** HIGH

### Mods (Charmbracelet)

- **What:** AI for the command line — pipe any command output to LLMs
- **URL:** https://github.com/charmbracelet/mods
- **Install:** `winget install charmbracelet.mods`
- **Stars/Activity:** ~3k stars
- **Windows:** Yes (native)
- **Category:** CLI tool / AI
- **Key feature:** Pipe stdin to any LLM:
  `git diff | mods "write a commit message"`
- **Confidence:** HIGH

### Freeze (Charmbracelet)

- **What:** Generate images of code and terminal output — like Carbon but
  CLI-native
- **URL:** https://github.com/charmbracelet/freeze
- **Install:** `go install github.com/charmbracelet/freeze@latest`
- **Stars/Activity:** ~3k stars
- **Windows:** Yes (native)
- **Category:** CLI tool
- **Key feature:** Generate beautiful code screenshots from terminal:
  `freeze --language go main.go`
- **Confidence:** HIGH

---

## Category 7: Terminal Recording

### VHS (Charmbracelet)

- **What:** Declarative terminal session recorder — write .tape scripts, output
  GIF/MP4/WebM
- **URL:** https://github.com/charmbracelet/vhs
- **Install:** `scoop install vhs` (requires ffmpeg and ttyd)
- **Stars/Activity:** ~16k stars
- **Windows:** Partial (works but may need WSL for some features; requires
  ffmpeg)
- **Category:** recording
- **Key feature:** Recordings as code — reproducible, version-controlled,
  CI-friendly demo generation
- **Confidence:** MEDIUM (Windows support not fully documented)

### asciinema

- **What:** Terminal session recorder and player — text-based format, shareable
  via asciinema.org
- **URL:** https://github.com/asciinema/asciinema
- **Install:** Not available natively; use PowerSession-rs as Windows
  alternative
- **Stars/Activity:** ~15k stars; v3.x rewritten in Rust
- **Windows:** No (Linux/macOS only; third-party alternatives exist:
  PowerSession-rs, asciinema-windows)
- **Category:** recording
- **Key feature:** Text-based recordings (copy-pasteable output); self-hosted
  server option; lightweight
- **Confidence:** HIGH (tool quality) / LOW (Windows — not supported)

---

## Windows Compatibility Summary

| Tool               | Native Windows |    WSL Only     | Not Available |
| ------------------ | :------------: | :-------------: | :-----------: |
| WezTerm            |       X        |                 |               |
| Alacritty          |       X        |                 |               |
| Windows Terminal   |       X        |                 |               |
| Warp               |       X        |                 |               |
| Rio                |       X        |                 |               |
| Ghostty            |                |                 |  X (planned)  |
| Nushell            |       X        |                 |               |
| PowerShell 7       |       X        |                 |               |
| Fish               |                |        X        |               |
| Zsh                |                | Partial (MSYS2) |               |
| WezTerm mux        |       X        |                 |               |
| Win Terminal panes |       X        |                 |               |
| Zellij             |                | X (native WIP)  |               |
| tmux               |                |        X        |               |
| Starship           |       X        |                 |               |
| Oh-My-Posh         |       X        |                 |               |
| BubbleTea          |       X        |                 |               |
| Ratatui            |       X        |                 |               |
| Textual            |       X        |                 |               |
| Ink                |       X        |                 |               |
| Gum                |       X        |                 |               |
| Glow               |       X        |                 |               |
| Mods               |       X        |                 |               |
| Freeze             |       X        |                 |               |
| VHS                |    Partial     |                 |               |
| asciinema          |                |                 |       X       |

---

## Recommended Stack for Windows 11 CLI Power User

**Tier 1 — Install immediately:**

1. **WezTerm** — Terminal emulator + multiplexer in one (replaces Windows
   Terminal + tmux)
2. **Starship** OR **Oh-My-Posh** — Prompt enhancement (Oh-My-Posh if you want
   easy themes; Starship if you want speed + cross-shell)
3. **Nushell** — Try as secondary shell for data exploration tasks
4. **Gum + Glow + Mods** — Charmbracelet CLI essentials

**Tier 2 — Evaluate based on workflow:** 5. **Warp** — If AI-assisted terminal
workflow appeals (note: requires account) 6. **Alacritty** — If you want maximum
speed and use WezTerm's mux or Windows Terminal panes 7. **VHS** — If you create
demos or documentation

**Tier 3 — Watch list:** 8. **Ghostty** — Best overall emulator but no Windows
yet; watch for Windows build 9. **Zellij** — Windows native support actively
merging; could replace WezTerm mux 10. **Fish** — Excellent shell but WSL-only
on Windows

---

## Sources

- [Modern Terminal Emulators 2026 Comparison](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/)
- [Best Terminal Emulators for Developers 2026](https://scopir.com/posts/best-terminal-emulators-developers-2026/)
- [Warp Windows Launch](https://www.warp.dev/blog/launching-warp-on-windows)
- [Ghostty Windows Support Discussion](https://github.com/ghostty-org/ghostty/discussions/2563)
- [Rio Terminal GitHub](https://github.com/raphamorim/rio)
- [Nushell GitHub](https://github.com/nushell/nushell)
- [Fish Windows Support Issue](https://github.com/fish-shell/fish-shell/issues/10155)
- [Zellij Windows Support Issue](https://github.com/zellij-org/zellij/issues/4200)
- [tmux vs Zellij Comparison](https://tmuxai.dev/tmux-vs-zellij/)
- [Starship Official](https://starship.rs/)
- [Oh-My-Posh vs Starship](https://ohmyposh.net/oh-my-posh-vs-starship/)
- [BubbleTea GitHub](https://github.com/charmbracelet/bubbletea)
- [Textual GitHub](https://github.com/Textualize/textual)
- [Charmbracelet Gum GitHub](https://github.com/charmbracelet/gum)
- [VHS GitHub](https://github.com/charmbracelet/vhs)
- [asciinema Windows Issue](https://github.com/asciinema/asciinema/issues/150)
- [Alacritty GitHub](https://github.com/alacritty/alacritty)
- [WezTerm Official](https://wezterm.com/)
- [Sweet Shell 2026 Guide](https://www.bretfisher.com/blog/shell)
- [Terminal Trove](https://terminaltrove.com/terminals/)
