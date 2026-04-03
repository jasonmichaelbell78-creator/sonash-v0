# SQ-001: General-Purpose CLI Productivity Tools

**Research Date:** 2026-03-23 **Search Rounds:** 8 (web search + GitHub page
fetches) **Scope:** File management, search, system info, navigation, text
processing tools for Windows 11 + bash shell **User Profile:** Non-developer
director who works via Claude Code CLI, directing AI to code

---

## Environment Baseline

**Already installed:** jq, git, node/npm, go, python, winget, gh (GitHub CLI)
**Not installed:** scoop, cargo (Rust) **Available via Claude Code internally:**
ripgrep (via Grep tool), file reading (via Read tool) **Primary install methods
available:** winget (installed), npm (installed), go install (installed), direct
binary download

---

## Category 1: File Viewing & Display

### bat

- **What:** A `cat` clone with syntax highlighting, line numbers, and Git
  integration
- **URL:** https://github.com/sharkdp/bat
- **Install:** `winget install sharkdp.bat` / `scoop install bat`
- **Stars/Activity:** 57.8k stars; actively maintained
- **Windows:** Yes (requires Visual C++ Redistributable)
- **Workflow fit:** Claude can invoke `bat` instead of `cat` to show files with
  syntax highlighting and line numbers. Makes code review output much more
  readable when Claude displays file contents. Also useful as a pager for other
  tools (delta, git, etc.)
- **Confidence:** HIGH (official GitHub, multiple independent sources, massive
  adoption)

### glow

- **What:** Render Markdown beautifully in the terminal
- **URL:** https://github.com/charmbracelet/glow
- **Install:** `winget install charmbracelet.glow` / `scoop install glow`
- **Stars/Activity:** 23.9k stars; v2.1.1 released May 2025; actively maintained
- **Windows:** Yes (full support via winget/scoop/choco)
- **Workflow fit:** Perfect for reading project docs (CLAUDE.md, ROADMAP.md,
  SESSION_CONTEXT.md) in a formatted view. Claude can invoke
  `glow docs/README.md` to render markdown. Also useful for browsing GitHub
  README files from the terminal.
- **Confidence:** HIGH (Charmbracelet is a well-known org, multiple sources)

---

## Category 2: File Finding & Search

### fd

- **What:** A simple, fast, user-friendly alternative to `find`
- **URL:** https://github.com/sharkdp/fd
- **Install:** `winget install sharkdp.fd` / `scoop install fd`
- **Stars/Activity:** 42.2k stars; actively maintained
- **Windows:** Yes (first-class support)
- **Workflow fit:** Claude already uses the Glob tool for file finding, but `fd`
  offers regex-based search, respects .gitignore, and handles complex queries
  that Glob cannot (e.g., find files by size, modification time, type). Useful
  when Claude needs to find files matching complex criteria. The user could also
  run `fd .tsx` directly to quickly find files.
- **Confidence:** HIGH (same author as bat, massive adoption, multiple sources)

### ripgrep (rg)

- **What:** Blazingly fast regex search tool, modern `grep` replacement
- **URL:** https://github.com/BurntSushi/ripgrep
- **Install:** `winget install BurntSushi.ripgrep` / `scoop install ripgrep`
- **Stars/Activity:** 55k+ stars; actively maintained
- **Windows:** Yes (first-class support)
- **Workflow fit:** **Already available internally** -- Claude Code uses ripgrep
  via its built-in Grep tool. However, installing the standalone binary would
  let the user run `rg` directly and let Claude invoke it in Bash for more
  advanced use cases (e.g., piping output, combining with other tools like fzf).
  Currently, Claude cannot chain the internal Grep tool with other Unix tools.
- **Confidence:** HIGH (industry standard, used by VS Code internally)

### fzf

- **What:** General-purpose fuzzy finder for the command line -- searches files,
  history, branches, any text
- **URL:** https://github.com/junegunn/fzf
- **Install:** `winget install fzf` / `scoop install fzf`
- **Stars/Activity:** 78.9k stars; actively maintained (one of the most starred
  CLI tools)
- **Windows:** Yes (works in bash via Git Bash / MSYS2)
- **Workflow fit:** HIGHEST IMPACT TOOL. Claude can pipe anything into fzf for
  interactive selection: `git branch | fzf`, `fd | fzf`, `rg -l pattern | fzf`.
  Shell integration adds Ctrl+R for fuzzy history search and Ctrl+T for file
  finding. Even for a non-developer, fzf transforms shell history recall from
  impossible to instant. Note: requires bash integration setup (source fzf.bash
  in .bashrc).
- **Confidence:** HIGH (most starred tool in this list, universal
  recommendation)

---

## Category 3: Navigation & Directory Management

### zoxide

- **What:** Smarter `cd` command that learns your most-used directories via
  frecency (frequency + recency)
- **URL:** https://github.com/ajeetdsouza/zoxide
- **Install:** `winget install ajeetdsouza.zoxide` / `scoop install zoxide`
- **Stars/Activity:** 33.9k stars; v0.9.9 released Jan 2026; actively maintained
- **Windows:** Yes (full support, works in bash)
- **Workflow fit:** Instead of typing
  `cd /c/Users/jbell/.local/bin/sonash-v0/docs/technical-debt`, just type
  `z tech-debt`. Zoxide learns from usage. For a director who always navigates
  to the same project dirs, this eliminates path memorization entirely. Claude
  can also invoke `z` to jump to known dirs faster.
- **Confidence:** HIGH (multiple sources, active development, explicit Windows
  docs)

### broot

- **What:** Interactive directory tree with fuzzy search, file preview, and
  built-in file operations
- **URL:** https://github.com/Canop/broot
- **Install:** `scoop install broot` / `cargo install broot` / direct binary
- **Stars/Activity:** 12.5k stars; v1.56.1 released March 20, 2026; 217
  releases; very actively maintained
- **Windows:** Yes (cross-platform, Windows mentioned explicitly)
- **Workflow fit:** When you need to understand a directory structure visually.
  `broot` shows a collapsed tree that you can fuzzy-search through, preview
  files, and perform operations. Good for a director who wants a visual overview
  of the project. Claude could invoke `broot --sizes` to show disk usage by
  directory.
- **Confidence:** HIGH (long-maintained project, 217 releases, active in
  March 2026)

### yazi

- **What:** Blazing-fast terminal file manager with async I/O, image preview,
  and vim-like keybindings
- **URL:** https://github.com/sxyazi/yazi
- **Install:** `winget install sxyazi.yazi` / `scoop install yazi`
- **Stars/Activity:** 35.1k stars; v26.1.22 released Jan 2026; actively
  maintained
- **Windows:** Yes (cross-platform, Windows topic tag)
- **Workflow fit:** Full terminal file manager -- browse, copy, move, delete
  files visually. For a non-developer, yazi provides a file explorer experience
  inside the terminal. The vim-like keybindings have a learning curve, but basic
  navigation (arrows, enter, backspace) works intuitively. Claude would not
  typically invoke this (it's interactive), but the user could use it directly.
- **Confidence:** HIGH (massive star count, active development, documented
  Windows support)

---

## Category 4: File Listing & Directory Display

### eza

- **What:** Modern `ls` replacement with colors, icons, Git status indicators,
  and tree view
- **URL:** https://github.com/eza-community/eza
- **Install:** `scoop install eza` / `cargo install eza` / winget (check
  availability)
- **Stars/Activity:** 20.8k stars; v0.23.4 released Oct 2025; actively
  maintained (community fork of exa)
- **Windows:** Yes (explicitly listed: "available for Windows, macOS and Linux")
- **Workflow fit:** Claude can invoke `eza -la --git --tree --level=2` for rich
  directory listings that show Git status, permissions, and tree structure in
  one command. Replaces multiple commands (`ls -la` + `tree` + `git status`)
  with a single, beautiful output. Useful for quick project structure overviews.
- **Confidence:** HIGH (large community, active fork, multiple sources)

---

## Category 5: Git Workflow

### delta

- **What:** Syntax-highlighting pager for git diff, grep, and blame output
- **URL:** https://github.com/dandavison/delta
- **Install:** `scoop install delta` / `winget install dandavison.delta`
- **Stars/Activity:** 29.6k stars; v0.19.1 released March 22, 2026; actively
  maintained
- **Windows:** Yes (prebuilt binaries available, works as git pager)
- **Workflow fit:** Once configured as git's pager
  (`git config --global core.pager delta`), all `git diff`, `git log -p`, and
  `git blame` output gets syntax highlighting and side-by-side views
  automatically. Claude frequently runs git commands -- delta makes the output
  much more readable. Configuration goes in `.gitconfig`.
- **Confidence:** HIGH (30k stars, release literally yesterday, active
  development)

### lazygit

- **What:** Terminal UI for Git -- stage, commit, rebase, merge with keyboard
  shortcuts
- **URL:** https://github.com/jesseduffield/lazygit
- **Install:** `scoop bucket add extras && scoop install lazygit` /
  `winget install lazygit`
- **Stars/Activity:** 74.9k stars; actively maintained
- **Windows:** Yes (full support via scoop/winget)
- **Workflow fit:** Interactive tool -- the user would use this directly rather
  than Claude invoking it. Provides a visual Git interface where you can stage
  individual hunks, see diff previews, manage branches, and squash commits
  without memorizing git syntax. Extremely useful for a non-developer who wants
  to understand what Claude has done before pushing.
- **Confidence:** HIGH (nearly 75k stars, one of most popular dev tools,
  multiple sources)

---

## Category 6: Data Processing

### jq

- **What:** Lightweight command-line JSON processor
- **URL:** https://github.com/jqlang/jq
- **Install:** **ALREADY INSTALLED** at `/c/Users/jbell/bin/jq`
- **Stars/Activity:** 33.9k stars; v1.8.1 released July 2025; actively
  maintained
- **Windows:** Yes (already working)
- **Workflow fit:** Already installed and usable. Claude can use `jq` to
  parse/query JSON files (package.json, Firebase configs, JSONL state files).
  Essential for the project's `.jsonl` state files.
- **Confidence:** HIGH (already installed, industry standard)

---

## Category 7: System Information & Disk Usage

### duf

- **What:** Modern `df` replacement -- disk usage/free utility with colorful,
  table-formatted output
- **URL:** https://github.com/muesli/duf
- **Install:** `scoop install duf` / `choco install duf`
- **Stars/Activity:** 14.9k stars; v0.9.1 released Sep 2025; maintained
- **Windows:** Yes (full support via scoop/choco)
- **Workflow fit:** Quick disk space check. Claude can run `duf` to show all
  mounted drives with usage bars. Useful when diagnosing "disk full" build
  failures or checking available space before large operations.
- **Confidence:** HIGH (15k stars, cross-platform, multiple sources)

### dust

- **What:** Modern `du` replacement -- shows disk usage in a tree with colored
  bars
- **URL:** https://github.com/bootandy/dust
- **Install:** `scoop install dust` / `cargo install du-dust`
- **Stars/Activity:** 11.5k stars; v1.2.4 released Jan 2026; actively maintained
- **Windows:** Yes (Windows GNU version works; MSVC version requires
  VCRUNTIME140.dll)
- **Workflow fit:** When `node_modules` balloons or `.next` cache grows, Claude
  can run `dust -n 20` to show the 20 biggest space consumers. Tree
  visualization makes it instantly clear what's eating disk space. Very useful
  for project maintenance.
- **Confidence:** HIGH (12k stars, recent release, documented Windows binaries)

### btop

- **What:** Beautiful terminal resource monitor (CPU, memory, disks, network,
  processes)
- **URL:** https://github.com/aristocratos/btop (Windows:
  https://github.com/aristocratos/btop4win)
- **Install:** Direct download from btop4win releases / `scoop install btop`
- **Stars/Activity:** 30.9k stars (main repo); Windows version available as
  btop4win
- **Windows:** Yes (btop4win, requires Win10 Anniversary Update+)
- **Workflow fit:** Interactive system monitor -- the user would run this
  directly to see CPU/memory usage during builds or when the machine feels slow.
  Claude would not typically invoke this (it's interactive), but could check
  resource usage via simpler commands.
- **Confidence:** MEDIUM (main btop is Linux-focused; Windows port is separate
  repo with less activity)

### procs

- **What:** Modern `ps` replacement with colored output, tree view, and keyword
  search
- **URL:** https://github.com/dalance/procs
- **Install:** `scoop install procs` / `winget install procs`
- **Stars/Activity:** 6k stars; v0.14.11; maintained
- **Windows:** Yes (full support, Windows-specific config documented)
- **Workflow fit:** Claude can run `procs node` to find all Node.js processes,
  or `procs --tree` to see process hierarchy. Useful for debugging port
  conflicts or killing hung dev servers. Simpler than parsing `tasklist` output.
- **Confidence:** MEDIUM (smaller project, Windows support labeled "full" but
  less community validation)

---

## Category 8: Text Processing & Find-Replace

### sd

- **What:** Intuitive find & replace CLI -- modern `sed` alternative with
  familiar regex syntax
- **URL:** https://github.com/chmln/sd
- **Install:** `scoop install sd` / `cargo install sd`
- **Stars/Activity:** 7k stars; v1.1.0 released Feb 2026; maintained
- **Windows:** Yes (Rust binary, PowerShell-aware)
- **Workflow fit:** Claude can use `sd` for bulk text replacements across files:
  `sd 'old_pattern' 'new_pattern' file.ts`. Uses JavaScript/Python-style regex
  (not sed's arcane syntax). Simpler than sed for one-off replacements Claude
  needs to do via Bash. However, Claude's Edit tool handles most single-file
  edits already.
- **Confidence:** MEDIUM (smaller community, but actively maintained, Feb 2026
  release)

---

## Category 9: Documentation & Help

### tldr

- **What:** Simplified, community-driven command examples (alternative to `man`
  pages)
- **URL:** https://github.com/tldr-pages/tldr
- **Install:** `npm install -g tldr` (easiest since npm is installed) /
  `winget install tldr`
- **Stars/Activity:** 56.3k stars; 150+ language pages; massive community
- **Windows:** Yes (Node.js client works everywhere; Rust client via winget)
- **Workflow fit:** When the user needs to quickly understand a command,
  `tldr tar` shows practical examples instead of a 500-line man page. Claude can
  also consult tldr for unfamiliar commands. Since npm is already installed,
  `npm install -g tldr` is a one-liner setup.
- **Confidence:** HIGH (56k stars, massive community, multiple clients)

---

## Category 10: Benchmarking & Code Statistics

### hyperfine

- **What:** Command-line benchmarking tool with statistical analysis
- **URL:** https://github.com/sharkdp/hyperfine
- **Install:** `winget install hyperfine` / `scoop install hyperfine`
- **Stars/Activity:** 27.7k stars; v1.20.0; actively maintained
- **Windows:** Yes (full support, Windows-specific shell handling)
- **Workflow fit:** Claude can use
  `hyperfine 'npm run build' 'npm run build:turbo'` to benchmark build
  performance before/after optimizations. Useful for validating that changes
  actually improve performance. Less frequent use but very valuable when needed.
- **Confidence:** HIGH (same author as bat/fd, massive adoption)

### tokei

- **What:** Count lines of code by language, fast and accurate
- **URL:** https://github.com/XAMPPRocky/tokei
- **Install:** `winget install XAMPPRocky.tokei` / `scoop install tokei`
- **Stars/Activity:** 14.1k stars; 150+ language support; maintained
- **Windows:** Yes (winget and scoop support)
- **Workflow fit:** Claude can run `tokei` to get a quick project size overview
  -- total lines of code, comments, blanks by language. Useful for roadmap
  planning, understanding codebase growth, and sprint retrospectives. One
  command gives a full project health snapshot.
- **Confidence:** HIGH (well-established, multiple sources, explicit Windows
  support)

---

## Category 11: HTTP Client

### xh

- **What:** Fast, user-friendly HTTP client (HTTPie-compatible, written in Rust)
- **URL:** https://github.com/ducaale/xh
- **Install:** `winget install ducaale.xh` / `scoop install xh`
- **Stars/Activity:** 7.7k stars; v0.25.3 released Dec 2025; maintained
- **Windows:** Yes (winget/scoop/choco, PowerShell install script)
- **Workflow fit:** Claude can use `xh GET https://api.example.com/status` for
  quick API testing with colored, formatted output. Simpler syntax than curl for
  JSON APIs. Useful for testing Firebase endpoints or checking external service
  availability.
- **Confidence:** MEDIUM (smaller community, but active development, clear
  Windows support)

---

## Category 12: Package Manager (Meta-Tool)

### Scoop

- **What:** Command-line package manager for Windows -- no admin rights needed,
  clean installs
- **URL:** https://github.com/ScoopInstaller/Scoop / https://scoop.sh
- **Install:** `irm get.scoop.sh | iex` (PowerShell one-liner)
- **Stars/Activity:** 23.4k stars; actively maintained
- **Windows:** Yes (Windows-only, that's its purpose)
- **Workflow fit:** **RECOMMENDED AS FIRST INSTALL.** Most tools above can be
  installed via scoop in one line. Scoop installs to user directory (no admin),
  doesn't pollute PATH, and handles updates cleanly. The user already has
  winget, but scoop has better coverage for developer/CLI tools. Many tools
  above list scoop as their primary Windows install method.
- **Confidence:** HIGH (industry standard for Windows CLI tool management)

---

## Installation Priority Recommendation

Based on the user's workflow (directing Claude in CLI, Windows 11, bash shell):

### Tier 1 -- Install Immediately (highest impact)

| Tool       | Why                                     | Install                                |
| ---------- | --------------------------------------- | -------------------------------------- |
| **Scoop**  | Meta-installer for everything else      | `irm get.scoop.sh \| iex` (PowerShell) |
| **fzf**    | Fuzzy finder transforms shell usability | `scoop install fzf`                    |
| **bat**    | Better file viewing for Claude and user | `scoop install bat`                    |
| **fd**     | Fast file finding beyond Glob tool      | `scoop install fd`                     |
| **zoxide** | Instant directory jumping               | `scoop install zoxide`                 |
| **delta**  | Beautiful git diffs                     | `scoop install delta`                  |

### Tier 2 -- Install Soon (strong value)

| Tool        | Why                                     | Install                                            |
| ----------- | --------------------------------------- | -------------------------------------------------- |
| **eza**     | Rich directory listings with git status | `scoop install eza`                                |
| **ripgrep** | Standalone rg for Bash piping           | `scoop install ripgrep`                            |
| **tldr**    | Quick command help                      | `npm install -g tldr`                              |
| **dust**    | Find disk space hogs                    | `scoop install dust`                               |
| **glow**    | Read markdown docs beautifully          | `scoop install glow`                               |
| **lazygit** | Visual git management                   | `scoop bucket add extras && scoop install lazygit` |

### Tier 3 -- Install When Needed (situational value)

| Tool          | Why                            | Install                   |
| ------------- | ------------------------------ | ------------------------- |
| **tokei**     | Code statistics for planning   | `scoop install tokei`     |
| **duf**       | Disk space overview            | `scoop install duf`       |
| **hyperfine** | Benchmark commands             | `scoop install hyperfine` |
| **sd**        | Bulk find-replace              | `scoop install sd`        |
| **procs**     | Process management             | `scoop install procs`     |
| **xh**        | HTTP client for API testing    | `scoop install xh`        |
| **broot**     | Interactive directory explorer | `scoop install broot`     |
| **yazi**      | Terminal file manager          | `scoop install yazi`      |
| **btop**      | System resource monitor        | `scoop install btop`      |

---

## One-Liner Bulk Install (after Scoop is installed)

```bash
# Tier 1 (do this first)
scoop install fzf bat fd zoxide delta

# Tier 2
scoop install eza ripgrep dust glow
scoop bucket add extras && scoop install lazygit
npm install -g tldr

# Tier 3 (as needed)
scoop install tokei duf hyperfine sd procs xh broot yazi btop
```

---

## Notes on Claude Code Integration

1. **Tools Claude can invoke via Bash:** bat, fd, rg, eza, dust, duf, tokei,
   hyperfine, sd, xh, glow, jq, procs, delta (via git)
2. **Tools the user runs interactively:** fzf (with Ctrl+R/Ctrl+T), zoxide (via
   `z` alias), lazygit, yazi, broot, btop
3. **Tools that enhance existing commands passively:** delta (auto-applied to
   git diff), bat (can alias to cat), eza (can alias to ls), zoxide (replaces
   cd)
4. **Already available internally in Claude Code:** ripgrep (Grep tool), file
   glob (Glob tool), file reading (Read tool)

---

## Sources

- [fzf - GitHub](https://github.com/junegunn/fzf) -- 78.9k stars
- [bat - GitHub](https://github.com/sharkdp/bat) -- 57.8k stars
- [tldr-pages - GitHub](https://github.com/tldr-pages/tldr) -- 56.3k stars
- [fd - GitHub](https://github.com/sharkdp/fd) -- 42.2k stars
- [lazygit - GitHub](https://github.com/jesseduffield/lazygit) -- 74.9k stars
- [yazi - GitHub](https://github.com/sxyazi/yazi) -- 35.1k stars
- [zoxide - GitHub](https://github.com/ajeetdsouza/zoxide) -- 33.9k stars
- [jq - GitHub](https://github.com/jqlang/jq) -- 33.9k stars
- [btop - GitHub](https://github.com/aristocratos/btop) -- 30.9k stars
- [delta - GitHub](https://github.com/dandavison/delta) -- 29.6k stars
- [hyperfine - GitHub](https://github.com/sharkdp/hyperfine) -- 27.7k stars
- [glow - GitHub](https://github.com/charmbracelet/glow) -- 23.9k stars
- [Scoop - GitHub](https://github.com/ScoopInstaller/Scoop) -- 23.4k stars
- [eza - GitHub](https://github.com/eza-community/eza) -- 20.8k stars
- [duf - GitHub](https://github.com/muesli/duf) -- 14.9k stars
- [tokei - GitHub](https://github.com/XAMPPRocky/tokei) -- 14.1k stars
- [broot - GitHub](https://github.com/Canop/broot) -- 12.5k stars
- [dust - GitHub](https://github.com/bootandy/dust) -- 11.5k stars
- [xh - GitHub](https://github.com/ducaale/xh) -- 7.7k stars
- [sd - GitHub](https://github.com/chmln/sd) -- 7k stars
- [procs - GitHub](https://github.com/dalance/procs) -- 6k stars
- [NexaSphere - 12 Modern CLI Tools 2026](https://nexasphere.io/blog/modern-cli-tools-developers-2026)
- [Medium - 8 CLI Tools 2025 Edition](https://bhavyansh001.medium.com/my-favorite-8-cli-tools-for-everyday-development-2025-edition-12340fad4b67)
- [32blog - Modern Rust CLI Tools](https://32blog.com/en/cli/cli-modern-rust-tools)
- [ToolShelf - Best CLI Tools 2026](https://www.toolshelf.dev/blog/best-cli-tools-2026)
- [Scoop official site](https://scoop.sh/)
