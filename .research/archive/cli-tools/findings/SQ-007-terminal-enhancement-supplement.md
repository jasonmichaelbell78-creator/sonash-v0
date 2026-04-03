# SQ-007: Terminal Enhancement Supplement — Deep & Wide Coverage

**Research Date:** 2026-03-23 **Agent:** Deep-research searcher (SQ-007)
**Scope:** 8 terminal enhancement categories that a quick pass would miss
**Focus:** Windows 11 native compatibility is CRITICAL for every tool

---

## Category 1: Terminal Color Tools & Theme Management

Tools for managing color schemes, creating palettes, and theming terminals.

### 1.1 iTerm2-Color-Schemes

- **Description:** Largest collection of terminal color schemes — 450+ themes
  with ports to 20+ terminal emulators
- **GitHub:** https://github.com/mbadolato/iTerm2-Color-Schemes
- **Stars:** ~25k+
- **Install:** Download JSON files from `windowsterminal/` directory in repo;
  paste into Windows Terminal `settings.json` under `schemes`
- **Windows:** Native — includes pre-built Windows Terminal JSON files in
  dedicated directory
- **Category:** Color Schemes / Themes
- **Why it matters:** One-stop shop for terminal aesthetics. Instead of
  hand-crafting color values, pick from 450+ battle-tested schemes. The Windows
  Terminal directory means zero conversion needed.

### 1.2 Gogh

- **Description:** Interactive color scheme installer for terminal emulators —
  250+ themes with live preview
- **GitHub:** https://github.com/Gogh-Co/Gogh
- **Stars:** ~9.9k
- **Install:** Bash script (`bash -c "$(wget -qO- https://git.io/vQgMr)"`)
- **Windows:** WSL only — the installer targets Linux terminal emulators (GNOME
  Terminal, Tilix, etc.)
- **Category:** Color Schemes / Themes
- **Why it matters:** Great for WSL users who want to quickly apply curated
  themes to their Linux terminal sessions inside Windows.

### 1.3 terminal.sexy

- **Description:** Web-based terminal color scheme designer with visual editor
  and export to 15+ formats
- **URL:** https://terminal.sexy
- **GitHub:** https://github.com/stayradiated/terminal.sexy
- **Stars:** ~3k+
- **Install:** Web app — no install needed
- **Windows:** Works in any browser; does NOT natively export Windows Terminal
  format (need manual conversion or use windowsterminalthemes.dev instead)
- **Category:** Color Scheme Designer
- **Why it matters:** Visual WYSIWYG editor for creating custom color schemes
  from scratch. Use RRGGBB color pickers instead of memorizing ANSI codes.

### 1.4 Windows Terminal Themes (windowsterminalthemes.dev)

- **Description:** Dedicated website with 200+ browsable themes specifically for
  Windows Terminal — one-click copy
- **URL:** https://windowsterminalthemes.dev
- **Install:** Web — browse, preview, copy JSON to clipboard
- **Windows:** Native — built specifically for Windows Terminal
- **Category:** Color Schemes / Themes
- **Why it matters:** The fastest path from "I want a new theme" to "it's
  applied." Preview themes visually, copy the JSON block, paste into
  settings.json.

### 1.5 TerminalSplash

- **Description:** Another curated collection of Windows Terminal themes with
  previews
- **URL:** https://terminalsplash.com
- **Install:** Web — browse and copy theme JSON
- **Windows:** Native — Windows Terminal specific
- **Category:** Color Schemes / Themes
- **Why it matters:** Alternative to windowsterminalthemes.dev with different
  curation and UX.

### 1.6 pastel

- **Description:** CLI tool to generate, analyze, convert, and manipulate colors
  — supports RGB, HSL, CIELAB, CIELCh, ANSI 8-bit/24-bit
- **GitHub:** https://github.com/sharkdp/pastel
- **Stars:** ~5k+
- **Install:** `cargo install pastel` or download binary from releases
- **Windows:** Native — Rust binary, cross-platform
- **Category:** Color Utility
- **Why it matters:** When you need to inspect, convert, or manipulate specific
  colors from the command line. Useful for creating consistent color palettes
  across tools — convert hex to HSL, mix colors, check contrast ratios.

### 1.7 vivid

- **Description:** Themeable LS_COLORS generator with YAML config — makes `ls`,
  `tree`, `fd`, `eza` output colorful and consistent
- **GitHub:** https://github.com/sharkdp/vivid
- **Stars:** ~1.5k+
- **Install:** `cargo install vivid` or package managers; usage:
  `export LS_COLORS="$(vivid generate molokai)"`
- **Windows:** Partial — LS_COLORS is a Unix concept; works in WSL, Git Bash,
  and tools that respect LS_COLORS on Windows
- **Category:** Color Configuration
- **Why it matters:** Instead of hand-writing cryptic LS_COLORS escape codes,
  use human-readable YAML themes. Separate theme files from filetype definitions
  — switch themes without reconfiguring file associations.

---

## Category 2: CLI File Managers

Terminal-based file managers for navigating, previewing, and managing files
without leaving the shell.

### 2.1 Yazi

- **Description:** Blazing fast terminal file manager written in Rust with async
  I/O, image previews, multi-tab, fuzzy search
- **GitHub:** https://github.com/sxyazi/yazi
- **Stars:** ~33k
- **Install:** `scoop install yazi` (Windows); optional deps:
  `scoop install ffmpeg 7zip jq poppler fd ripgrep fzf zoxide resvg imagemagick`
- **Windows:** Native — first-class Windows support via Scoop, dedicated Windows
  installation guide in wiki
- **Category:** File Manager
- **Why it matters:** The modern successor to ranger. Non-blocking async I/O
  means it never freezes on large directories. Image/video previews, tabs, and a
  plugin system. The 33k stars reflect explosive growth — this is the
  community's current favorite.

### 2.2 superfile

- **Description:** Modern, visually appealing terminal file manager with Nerd
  Font icons, multi-panel layout, keyboard-driven navigation
- **GitHub:** https://github.com/yorukot/superfile
- **Stars:** ~16.9k
- **Install:** PowerShell install script for Windows; `brew install superfile`
  on macOS
- **Windows:** Partial — Windows support exists but noted as partial compared to
  Linux/macOS
- **Category:** File Manager
- **Why it matters:** The "pretty" option. If you want a file manager that looks
  good out of the box with minimal configuration, superfile delivers. Dual-panel
  layout feels familiar to anyone who used Midnight Commander or Total
  Commander.

### 2.3 broot

- **Description:** Directory tree navigator with fuzzy search, file preview, and
  directory jumping — "a new way to see and navigate directory trees"
- **GitHub:** https://github.com/Canop/broot
- **Stars:** ~11k+
- **Install:** `scoop install broot` (Windows); also available via cargo, brew,
  or direct binary download
- **Windows:** Native — works on Windows 10+, available via Scoop
- **Category:** File Manager / Tree Navigator
- **Why it matters:** Unique approach — instead of a traditional file manager,
  broot shows a condensed, searchable tree. Type to fuzzy-filter the entire
  directory tree. Great for exploring unfamiliar codebases. The `br` shell
  function lets you `cd` to any directory you navigate to.

### 2.4 lf

- **Description:** Terminal file manager written in Go, inspired by ranger —
  lightweight single binary with no dependencies
- **GitHub:** https://github.com/gokcehan/lf
- **Stars:** ~8.1k
- **Install:** `scoop install lf` (Windows); also via Go install, brew, or
  releases page
- **Windows:** Native — cross-platform Go binary, Scoop package available
- **Category:** File Manager
- **Why it matters:** If you want ranger's keybindings and workflow but faster
  and with no Python dependency. Single binary, no dependencies, starts
  instantly. Highly customizable keybindings and file previewer integration.

### 2.5 nnn

- **Description:** Ultra-lightweight, blazing fast terminal file manager —
  minimal resource usage, plugin ecosystem
- **GitHub:** https://github.com/jarun/nnn
- **Stars:** ~19k+
- **Install:** WSL only on Windows; native on Linux/macOS/BSD
- **Windows:** WSL only — no native Windows build; requires Linux subsystem
- **Category:** File Manager
- **Why it matters:** The minimalist's choice. Tiny binary, almost zero resource
  usage, yet extensible via plugins. If you're on WSL, it's the fastest file
  manager you can run. Latest v5.1 (March 2025) added custom trash commands and
  command history.

### 2.6 xplr

- **Description:** Hackable, minimal, fast TUI file explorer written in Rust —
  dashboard-style layout with Lua scripting
- **GitHub:** https://github.com/sayanarijit/xplr
- **Stars:** ~4.4k
- **Install:** `cargo install xplr` or download binary from releases
- **Windows:** Limited — primarily Unix/macOS focused; may work under WSL
- **Category:** File Manager
- **Why it matters:** Different philosophy — more of a "file exploration
  dashboard" than a traditional file manager. Fully scriptable via Lua. If you
  want total control over every keybinding, mode, and behavior, xplr is the most
  customizable option.

### 2.7 clifm

- **Description:** Shell-like, POSIX-compliant terminal file manager — uses
  shell commands directly, CLI-first design
- **GitHub:** https://github.com/leo-arch/clifm
- **Stars:** ~1.5k+
- **Install:** Build from source; available in some Linux package managers
- **Windows:** WSL only — POSIX-focused
- **Category:** File Manager
- **Why it matters:** For users who think in shell commands. Instead of learning
  a new TUI, clifm integrates file management into your existing shell workflow.
  Type shell commands directly within the file manager.

---

## Category 3: Terminal Clipboard Managers

Tools for managing clipboard history and operations from the command line.

### 3.1 Clipboard Project (cb)

- **Description:** Modern, feature-rich clipboard manager for the terminal —
  unlimited history, unlimited named clipboards, smart paste
- **GitHub:** https://github.com/Slackadays/Clipboard
- **Stars:** ~5.3k
- **Install:** Windows:
  `(Invoke-WebRequest -UseBasicParsing https://github.com/Slackadays/Clipboard/raw/main/install.ps1).Content | powershell`
- **Windows:** Native — PowerShell installer, Windows first-class support
- **Category:** Clipboard Manager
- **Why it matters:** The `cb` command replaces ad-hoc clipboard workflows.
  `cb copy file.txt` copies a file, `cb paste` puts it somewhere else, `cb show`
  previews clipboard contents. Named clipboards let you maintain multiple
  independent clipboards (e.g., `cb copy code_snippet -c snippets`). This is
  what the built-in `clip` command should have been.

### 3.2 CopyQ

- **Description:** Advanced clipboard manager with GUI + powerful CLI scripting
  interface — clipboard history, editing, automation
- **GitHub:** https://github.com/hluk/CopyQ
- **Stars:** ~8.4k
- **Install:** `scoop install copyq` (Scoop extras bucket); also available via
  Chocolatey, WinGet, or direct download
- **Windows:** Native — full Windows support with system tray integration and
  CLI interface
- **Category:** Clipboard Manager
- **Why it matters:** CopyQ runs as a system tray app but exposes a full CLI
  (`copyq`). Script clipboard operations, create custom commands, search
  clipboard history from terminal. The scripting API supports JavaScript-like
  syntax for automation. Bridges GUI and CLI clipboard workflows.

### 3.3 Windows Built-in: clip & Win+V

- **Description:** Native Windows clipboard tools — `clip` pipes stdout to
  clipboard; Win+V opens clipboard history panel
- **Install:** Pre-installed on Windows 10/11; enable clipboard history in
  Settings > System > Clipboard
- **Windows:** Native — built into OS
- **Category:** Clipboard (Built-in)
- **Why it matters:** Zero-install baseline. `echo "hello" | clip` or
  `cat file.txt | clip` sends anything to clipboard. Win+V gives visual
  clipboard history with pinning. Not a CLI manager per se, but the foundation
  that other tools build on.

---

## Category 4: Terminal Fonts & Icon Support

Fonts and glyph management for terminal icon rendering and visual enhancement.

### 4.1 Nerd Fonts

- **Description:** Patches 50+ developer fonts with 3,600+ icons from Font
  Awesome, Material Design, Octicons, Devicons, Powerline
- **GitHub:** https://github.com/ryanoasis/nerd-fonts
- **Stars:** ~56k+
- **Install:** Windows: download from https://www.nerdfonts.com/font-downloads
  or `scoop bucket add nerd-fonts && scoop install nerd-fonts/JetBrainsMono-NF`
- **Windows:** Native — install TTF/OTF files system-wide, set in Windows
  Terminal settings
- **Category:** Fonts / Icons
- **Why it matters:** REQUIRED by most modern CLI tools. Starship, Oh My Posh,
  eza, yazi, superfile, and many others assume Nerd Font icons are available.
  Without a Nerd Font, you see missing glyphs (boxes/question marks) instead of
  file-type icons, git symbols, and UI decorations. Top font choices: JetBrains
  Mono Nerd Font, FiraCode Nerd Font, CaskaydiaCove Nerd Font (Cascadia Code
  patched).

### 4.2 Oh My Posh Font Installer

- **Description:** Built-in font installer within Oh My Posh — installs Nerd
  Fonts with one command
- **URL:** https://ohmyposh.dev/docs/installation/fonts
- **Install:** `oh-my-posh font install` (interactive menu to choose font); or
  `oh-my-posh font install JetBrainsMono`
- **Windows:** Native — designed for Windows
- **Category:** Font Installer
- **Why it matters:** Simplest path to getting a Nerd Font installed if you
  already have Oh My Posh. Handles downloading, extracting, and installing the
  font system-wide.

---

## Category 5: Terminal Image Viewers

Tools for rendering images, GIFs, and video directly in the terminal.

### 5.1 chafa

- **Description:** Terminal graphics tool — converts images/GIFs to character
  art or uses Sixel/Kitty/iTerm2 protocols for full-resolution display
- **GitHub:** https://github.com/hpjansson/chafa
- **Stars:** ~4.5k
- **Install:** Linux: package managers; Windows: build from source (requires
  GCC, make, Autoconf, GLib dev package)
- **Windows:** Difficult — requires building from source with MinGW/MSYS2
  toolchain; no pre-built Windows binaries
- **Category:** Image Viewer
- **Why it matters:** The most versatile terminal image tool. Automatically
  detects terminal capabilities and chooses the best output method (Sixel >
  Kitty > Unicode blocks > ASCII). Excellent for CI/CD pipelines, READMEs, and
  quick image inspection.

### 5.2 viu

- **Description:** Terminal image viewer written in Rust with native Kitty and
  iTerm2 graphics protocol support
- **GitHub:** https://github.com/atanunq/viu
- **Stars:** ~2.8k
- **Install:** `cargo install viu`; or download from releases page
- **Windows:** Limited — primarily Unix/macOS focused; may work on Windows with
  Kitty-compatible terminals like WezTerm
- **Category:** Image Viewer
- **Why it matters:** Clean and simple — `viu image.png` just works. Supports
  Kitty graphics protocol for full-resolution rendering on compatible terminals
  (WezTerm, Kitty). Falls back to Unicode block characters on unsupported
  terminals.

### 5.3 timg

- **Description:** Terminal image AND video viewer — plays animations, scrolls
  static images, supports Sixel/Kitty/iTerm2
- **GitHub:** https://github.com/hzeller/timg
- **Stars:** ~2.3k
- **Install:** Linux: package managers, AppImage; build from source on other
  platforms
- **Windows:** WSL only — no native Windows build; primarily Linux-focused
- **Category:** Image/Video Viewer
- **Why it matters:** The only terminal tool that handles video playback. Plays
  animated GIFs natively, can display video frames from video files. Grid mode
  shows multiple images in a tiled layout for quick visual browsing.

### 5.4 TerminalImageViewer (tiv)

- **Description:** C++ program that displays images using RGB ANSI codes and
  Unicode block graphics characters
- **GitHub:** https://github.com/stefanhaustein/TerminalImageViewer
- **Stars:** ~1.5k+
- **Install:** Build from source; Windows port at
  https://github.com/crouvpony47/tiv-win
- **Windows:** Partial — native Win32 port exists (tiv-win), requires Windows 10
  build 1803+
- **Category:** Image Viewer
- **Why it matters:** Works without Sixel or Kitty support — uses pure ANSI
  color codes and Unicode blocks. This means it works on virtually any modern
  terminal including Windows Terminal without special protocol support.

### 5.5 lsix

- **Description:** Like `ls`, but for images — shows thumbnails in terminal
  using Sixel graphics
- **GitHub:** https://github.com/hackerb9/lsix
- **Stars:** ~4k+
- **Install:** Bash script; requires ImageMagick and a Sixel-capable terminal
- **Windows:** WSL only — Bash script, needs Sixel terminal support
- **Category:** Image Browser
- **Why it matters:** `ls` for your image directories. Instead of opening a GUI
  file manager to browse photos, `lsix` shows thumbnails right in the terminal.
  Natural workflow for photographers, designers, or anyone with lots of images.

---

## Category 6: Terminal Session Managers

Tools for saving, restoring, and managing terminal sessions and layouts.

### 6.1 tmux + tmux-resurrect + tmux-continuum

- **Description:** tmux-resurrect saves/restores tmux sessions across reboots;
  tmux-continuum adds automatic background saving
- **GitHub (resurrect):** https://github.com/tmux-plugins/tmux-resurrect
- **GitHub (continuum):** https://github.com/tmux-plugins/tmux-continuum
- **Stars:** resurrect ~12k+, continuum ~4k+
- **Install:** Via tmux plugin manager (TPM):
  `set -g @plugin 'tmux-plugins/tmux-resurrect'`
- **Windows:** WSL only — tmux is Unix-only; works perfectly inside WSL sessions
- **Category:** Session Manager
- **Why it matters:** The gold standard for terminal session persistence. Saves
  window/pane layouts, working directories, running programs, and even
  vim/neovim sessions. `prefix + Ctrl-s` to save, `prefix + Ctrl-r` to restore.
  Combined with tmux-continuum, sessions auto-save every 15 minutes. After a
  reboot, your entire terminal workspace is exactly as you left it.

### 6.2 sesh

- **Description:** Smart terminal session manager that integrates with tmux and
  zoxide for fuzzy session switching
- **GitHub:** https://github.com/joshmedeski/sesh
- **Stars:** ~3k+
- **Install:** `brew install joshmedeski/tap/sesh` (macOS); Go install or binary
  download for other platforms
- **Windows:** Limited — depends on tmux, which is WSL-only on Windows
- **Category:** Session Manager
- **Why it matters:** Adds intelligent session management on top of tmux.
  Instead of remembering session names, fuzzy-search across all sessions with
  `sesh connect`. Integrates with zoxide so your most-visited directories become
  quick-launch sessions. Best paired with fzf for the session picker.

### 6.3 Warp Session Restoration

- **Description:** Built-in session restoration in Warp terminal — restores
  windows, tabs, panes, and recent command blocks
- **URL:** https://docs.warp.dev/terminal/sessions/session-restoration
- **Install:** Built into Warp terminal
- **Windows:** Not available — Warp is macOS/Linux only (as of March 2026)
- **Category:** Session Manager (Built-in)
- **Why it matters:** Zero-config session restoration if you use Warp.
  Automatically saves and restores your complete terminal state including recent
  command output.

### 6.4 Windows Terminal Native Session Restore

- **Description:** Windows Terminal can restore previous session tabs and panes
  on startup
- **Install:** Built into Windows Terminal; enable in Settings > Startup > "When
  Terminal starts" > "Open windows from a previous session"
- **Windows:** Native — built into Windows Terminal
- **Category:** Session Manager (Built-in)
- **Why it matters:** Many users don't know this exists. Windows Terminal can
  reopen all your tabs and panes from the previous session automatically. No
  plugins needed — just a settings toggle. Combined with named profiles, you can
  have consistent workspace layouts.

---

## Category 7: Directory Tree Visualization

Alternatives to `tree` for visualizing directory structures with enhanced
features.

### 7.1 erdtree (erd)

- **Description:** Multi-threaded file tree visualizer + disk usage analyzer —
  respects .gitignore and hidden file rules
- **GitHub:** https://github.com/solidiquis/erdtree
- **Stars:** ~2.5k+
- **Install:** `scoop install erdtree` (Windows); also `cargo install erdtree`,
  brew, or binary download
- **Windows:** Native — cross-platform Rust binary, Scoop package available
- **Category:** Tree / Disk Usage
- **Why it matters:** `tree` meets `du`. Shows directory structure AND file
  sizes in one command. Multi-threaded for fast scanning. Respects `.gitignore`
  so you don't see `node_modules` in the output. The binary is called `erd`
  (renamed from `et` to avoid collisions).

### 7.2 broot (tree mode)

- **Description:** Beyond just a file manager — broot's tree view shows an
  optimized, searchable, collapsible directory tree
- **GitHub:** https://github.com/Canop/broot
- **Stars:** ~11k+
- **Install:** `scoop install broot` (Windows)
- **Windows:** Native — Windows 10+ support
- **Category:** Tree / Navigator
- **Why it matters:** Unlike `tree` which dumps everything, broot shows a
  condensed tree that fits your terminal. Deep directories are collapsed
  automatically. Type to fuzzy-filter. Press Enter to `cd` into the selected
  directory. It's `tree` + `find` + `cd` combined.

### 7.3 gdu

- **Description:** Fast disk usage analyzer with ncurses-like TUI, written in Go
  — designed for SSD parallel scanning
- **GitHub:** https://github.com/dundee/gdu
- **Stars:** ~4k+
- **Install:** Download binary from releases page; available via package
  managers on Linux
- **Windows:** Native — Go binary with Windows builds available on releases page
- **Category:** Disk Usage / Tree
- **Why it matters:** Interactive `du`. Navigate directory trees visually, see
  what's eating disk space, delete large files on the spot. Optimized for SSDs
  with parallel scanning. Three modes: interactive TUI, non-interactive (for
  scripts), and JSON export.

### 7.4 file-tree-cli

- **Description:** Modern CLI tool for visualizing directory structures with
  advanced filtering, display options, and multiple output formats
- **GitHub:** https://github.com/devxprite/file-tree-cli
- **Stars:** ~200+
- **Install:** `npm install -g file-tree-cli`
- **Windows:** Native — Node.js, cross-platform
- **Category:** Tree Visualization
- **Why it matters:** If you want `tree` output with more control — filter by
  extension, depth, gitignore awareness, and multiple output formats (ASCII,
  markdown, JSON). Being a Node.js tool, it works anywhere Node runs.

### 7.5 llmdirtree

- **Description:** Directory tree + code context generator optimized for LLM
  workflows — creates directory maps for pasting into AI conversations
- **GitHub:** https://github.com/arun477/llmdirtree (referenced from blog post)
- **Install:** Python CLI tool
- **Windows:** Native — Python, cross-platform
- **Category:** Tree / LLM Context
- **Why it matters:** Purpose-built for the AI-assisted development workflow.
  Generates directory trees and code summaries in a format optimized for pasting
  into LLM conversations. If you regularly paste project structure into Claude
  or ChatGPT, this saves manual curation.

---

## Category 8: Windows Terminal Deep Customization

Lesser-known features, advanced configuration, and power-user tips.

### 8.1 Kitty Keyboard Protocol Support (v1.25+)

- **Description:** Windows Terminal Preview 1.25 adds Kitty keyboard protocol —
  unambiguous key reporting for distinct key presses and modifier combinations
- **Source:**
  https://devblogs.microsoft.com/commandline/windows-terminal-preview-1-25-release/
- **Why it matters:** Applications like Neovim can now distinguish between
  `Ctrl+I` and `Tab`, `Ctrl+M` and `Enter`, etc. This was a long-standing
  limitation. Opt-in per-profile with `"experimental.input.forceVT": true`.

### 8.2 Extensions System (v1.24+)

- **Description:** Windows Terminal now has a dedicated Extensions settings page
  — extensions can add profiles, color schemes, and actions
- **Source:**
  https://www.techzine.eu/news/applications/139337/windows-terminal-1-24-focuses-on-extensions-and-search/
- **Why it matters:** Third-party extensions can now augment Windows Terminal
  behavior. The Extensions page in Settings shows what profiles, color schemes,
  and actions have been added by extensions. This is the beginning of a plugin
  ecosystem.

### 8.3 Settings Search (v1.25+)

- **Description:** Search across settings, profiles, actions, and extensions
  from within the Settings UI
- **Source:**
  https://devblogs.microsoft.com/commandline/windows-terminal-preview-1-25-release/
- **Why it matters:** No more scrolling through JSON or clicking through tabs.
  Type what you're looking for and jump directly to it. Especially useful as
  your settings grow with multiple profiles and custom keybindings.

### 8.4 Advanced Keybinding Configuration

- **Description:** The `keybindings` property in `settings.json` supports
  complex action configurations including sendInput, splitPane with specific
  profiles, and command palette customization
- **Source:**
  https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions
- **Key tips:**
  - `sendInput` action lets you bind a key to type arbitrary text/commands
  - `splitPane` can specify profile, size ratio, and direction in one keybinding
  - `wt` command-line can launch complex layouts:
    `wt -p "PowerShell" ; split-pane -p "Ubuntu" ; split-pane -H -p "Git Bash"`
  - Named command palette entries: add `"name"` to any action to make it
    searchable in `Ctrl+Shift+P`
- **Windows:** Native
- **Why it matters:** Most users only know `Ctrl+T` for new tab. But you can
  bind keys to open specific profiles in specific pane configurations, send
  common commands, or create workflow-specific layouts.

### 8.5 Startup Command-Line Layouts

- **Description:** Launch Windows Terminal with pre-configured pane layouts
  using the `wt` command
- **Example:**
  `wt -p "PowerShell" ; split-pane -V -p "Ubuntu" ; split-pane -H -p "Git Bash" ; focus-tab -t 0`
- **Windows:** Native
- **Why it matters:** Create batch files or shell aliases for workspace
  configurations. "Start my dev environment" = one command that opens
  PowerShell, WSL Ubuntu, and Git Bash in a split layout. Can be pinned to Start
  or Taskbar.

### 8.6 Background Images & Acrylic/Mica

- **Description:** Per-profile background images (with opacity), acrylic blur,
  and Mica material (Windows 11 system theme-aware transparency)
- **Config:** In profile settings: `"backgroundImage"`,
  `"backgroundImageOpacity"`, `"useAcrylic"`, or set `"opacity"` with Mica
- **Windows:** Native — Mica requires Windows 11
- **Why it matters:** Aesthetic customization beyond color schemes. Mica gives
  your terminal a modern, theme-aware transparency that matches Windows 11's
  design language. Background images can show project logos, system info, or
  personal artwork.

### 8.7 Multiple Profile Configurations

- **Description:** Create separate profiles for different workflows — each with
  its own shell, font, color scheme, starting directory, icon, and tab title
- **Windows:** Native
- **Key tips:**
  - SSH profiles: `"commandline": "ssh user@server"` — one-click SSH connections
  - Project profiles: Set `"startingDirectory"` to your project root
  - Visual profiles: Different color schemes for different contexts (production
    = red theme, dev = blue)
  - Tab colors: `"tabColor": "#ff0000"` to visually distinguish contexts
- **Why it matters:** Visual context switching. When you SSH into production, it
  should LOOK different from your local dev environment. Color-coded tabs
  prevent catastrophic mistakes (running `rm -rf` in the wrong terminal).

---

## Quick Reference: Windows Compatibility Matrix

| Tool                      | Windows Native | WSL           | Install Method     |
| ------------------------- | -------------- | ------------- | ------------------ |
| iTerm2-Color-Schemes      | Yes            | N/A           | Download JSON      |
| windowsterminalthemes.dev | Yes            | N/A           | Web (copy JSON)    |
| pastel                    | Yes            | Yes           | cargo / binary     |
| vivid                     | Partial        | Yes           | cargo              |
| Yazi                      | Yes            | Yes           | scoop              |
| superfile                 | Partial        | Yes           | PowerShell script  |
| broot                     | Yes            | Yes           | scoop              |
| lf                        | Yes            | Yes           | scoop              |
| nnn                       | No             | Yes           | apt/pacman         |
| xplr                      | No             | Yes (limited) | cargo              |
| Clipboard Project (cb)    | Yes            | Yes           | PowerShell script  |
| CopyQ                     | Yes            | N/A           | scoop / chocolatey |
| Nerd Fonts                | Yes            | Yes           | scoop / download   |
| chafa                     | No             | Yes           | apt/pacman         |
| viu                       | Limited        | Yes           | cargo              |
| timg                      | No             | Yes           | apt                |
| tiv / tiv-win             | Yes            | Yes           | build from source  |
| erdtree (erd)             | Yes            | Yes           | scoop / cargo      |
| gdu                       | Yes            | Yes           | binary download    |
| file-tree-cli             | Yes            | Yes           | npm                |
| tmux + plugins            | No             | Yes           | apt/pacman         |
| sesh                      | No             | Yes           | brew / go install  |

---

## Top Recommendations for Windows 11 Power Users

### Must-Install (immediate productivity gain)

1. **Nerd Fonts** (JetBrains Mono NF) — prerequisite for everything else
2. **Yazi** — terminal file manager, replaces GUI file explorer for dev work
3. **Clipboard Project (cb)** — transforms clipboard from one-slot to unlimited
4. **erdtree (erd)** — `tree` + `du` in one fast command
5. **broot** — fuzzy-searchable directory navigation

### Nice-to-Have (polish and aesthetics)

6. **windowsterminalthemes.dev** — quick theme browsing
7. **pastel** — color manipulation from CLI
8. **CopyQ** — if you want scriptable clipboard automation
9. **Windows Terminal startup layouts** — pre-configured workspace via `wt`
   command
10. **lf** — lightweight ranger alternative if yazi feels heavy

### WSL Users Should Also Get

11. **tmux + resurrect + continuum** — session persistence across reboots
12. **chafa** — terminal image viewing
13. **nnn** — ultra-fast lightweight file manager
14. **timg** — video playback in terminal

---

## Methodology

Research conducted via 16 targeted web searches across 8 categories. Each tool
verified for:

- Active maintenance (commits in 2024-2026)
- Windows 11 compatibility (native, WSL, or not supported)
- Install method availability (scoop, cargo, npm, binary, etc.)
- Community adoption (GitHub stars as proxy)
- Practical value for terminal-heavy developers
