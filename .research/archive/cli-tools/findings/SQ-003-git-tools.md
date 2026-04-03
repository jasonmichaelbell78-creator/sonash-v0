# SQ-003: Git Workflow Enhancement CLI Tools

**Research Date:** 2026-03-23 **Search Rounds:** 8 (exhaustive L1) **Sources
Consulted:** 30+ GitHub repos, official docs, dev blogs, HN threads **Confidence
Floor:** Tools with < 2 independent sources noted

---

## Table of Contents

1. [TUI Git Clients](#1-tui-git-clients)
2. [Diff Viewers & Syntax-Aware Diff](#2-diff-viewers--syntax-aware-diff)
3. [Commit Message & Conventional Commits](#3-commit-message--conventional-commits)
4. [Changelog & Release Automation](#4-changelog--release-automation)
5. [Interactive History & Rebase Tools](#5-interactive-history--rebase-tools)
6. [Fuzzy-Finder Git Integration](#6-fuzzy-finder-git-integration)
7. [Branch Management & Workflow Automation](#7-branch-management--workflow-automation)
8. [Stacked PRs / Stacked Diffs](#8-stacked-prs--stacked-diffs)
9. [Git Hooks Management](#9-git-hooks-management)
10. [Repository Analytics & Stats](#10-repository-analytics--stats)
11. [Repository Maintenance & Cleanup](#11-repository-maintenance--cleanup)
12. [Git Worktree Management](#12-git-worktree-management)
13. [Integration Summary Matrix](#13-integration-summary-matrix)

---

## 1. TUI Git Clients

### lazygit

- **What:** Full-featured terminal UI for git commands with keyboard-driven
  navigation, staging, rebasing, conflict resolution, and cherry-picking
- **URL:** https://github.com/jesseduffield/lazygit
- **Install:** `scoop install lazygit` / `choco install lazygit` /
  `winget install lazygit` / binary download
- **Stars/Activity:** 74.9k stars; actively maintained, frequent releases
- **Windows:** Yes (native binary, Scoop, Chocolatey, Winget)
- **Beyond git+gh:** Visual staging at hunk/line level, interactive rebase with
  drag-and-drop, conflict resolution UI, commit graph visualization, undo/redo,
  all without leaving terminal. Replaces dozens of git commands with single-key
  shortcuts.
- **Invocation:** User-direct (interactive TUI, not scriptable by Claude)
- **Confidence:** HIGH (2+ sources: GitHub, dev blogs, HN discussion, NexaSphere
  2026 list)

### gitui

- **What:** Blazing fast terminal UI for git written in Rust, keyboard-only
  control with context-based help
- **URL:** https://github.com/gitui-org/gitui
- **Install:** `winget install gitui` / `scoop install gitui` /
  `choco install gitui` / MSI installer
- **Stars/Activity:** 21.6k stars; last commit Jan 2025, active releases
- **Windows:** Yes (Winget, Scoop, Chocolatey, MSI installer, binary)
- **Beyond git+gh:** Processes Linux kernel repo (900k+ commits) in 24 seconds
  using 0.17GB RAM. Async git API prevents UI freezes. Stage/unstage at
  file/hunk/line level. GPG signing support. Lower memory footprint than
  lazygit.
- **Invocation:** User-direct (interactive TUI)
- **Confidence:** HIGH (2+ sources: GitHub, StackShare comparison, dev blogs)

### tig

- **What:** ncurses-based text-mode interface for git — repository browser,
  staging helper, and pager for git output
- **URL:** https://github.com/jonas/tig
- **Install:** Available via package managers; Windows builds via AppVeyor CI
- **Stars/Activity:** 13.2k stars; latest release tig-2.6.0 (Sep 2025)
- **Windows:** Yes (CI-tested on Windows via AppVeyor)
- **Beyond git+gh:** Dedicated views for log, diff, blame, tree, refs, stash,
  grep, and status. Scriptable via `.tigrc` configuration. Can act as a pager
  for `git log`, `git diff`, etc. Lighter than lazygit/gitui — focused on
  browsing rather than full workflow.
- **Invocation:** User-direct (interactive TUI) or piped from git commands
- **Confidence:** HIGH (2+ sources: GitHub, official manual, long-established
  tool)

---

## 2. Diff Viewers & Syntax-Aware Diff

### delta

- **What:** Syntax-highlighting pager for git diff, grep, and blame output with
  side-by-side views and word-level diff detection
- **URL:** https://github.com/dandavison/delta
- **Install:** Available as `git-delta` in most package managers; configure via
  `.gitconfig` (`core.pager = delta`)
- **Stars/Activity:** 29.6k stars; latest release 0.19.1 (Mar 2026), actively
  maintained
- **Windows:** Yes (binary releases available; works with any terminal)
- **Beyond git+gh:** Transforms plain `git diff` output into syntax-highlighted,
  word-level diffs with line numbers. Side-by-side mode. Merge conflict
  visualization. Enhanced `git blame` with hyperlinks. Uses bat-compatible
  themes. Zero workflow change — just set as pager.
- **Invocation:** Both — Claude sees better diffs automatically when configured
  as pager; user benefits visually
- **Confidence:** HIGH (2+ sources: GitHub, official docs, multiple dev blogs)

### difftastic

- **What:** Structural diff tool that understands syntax — compares files based
  on AST rather than lines
- **URL:** https://github.com/Wilfred/difftastic
- **Install:** `cargo install difftastic` / binary releases; configure as
  `git difftool`
- **Stars/Activity:** 24.7k stars; latest release 0.68.0 (Mar 2026), actively
  maintained
- **Windows:** Yes (pre-built binaries available)
- **Beyond git+gh:** Understands 30+ programming languages at the syntax level.
  Ignores meaningless whitespace changes. Recognizes that `x-1` is three tokens
  in JS but one in Lisp. Shows only semantically meaningful changes,
  dramatically reducing noise in code reviews. Falls back to line-oriented diff
  for unparseable files.
- **Invocation:** Both — can be configured as default difftool for Claude and
  user
- **Confidence:** HIGH (2+ sources: GitHub, official docs, HN discussion)

---

## 3. Commit Message & Conventional Commits

### commitizen (cz-cli, Node.js)

- **What:** Interactive CLI that prompts for conventional commit message fields,
  ensuring consistent commit format
- **URL:** https://github.com/commitizen/cz-cli
- **Install:** `npm install -g commitizen` or `npx cz`
- **Stars/Activity:** 17.4k stars; actively maintained
- **Windows:** Yes (via npm, cross-platform)
- **Beyond git+gh:** Guided prompts prevent malformed commit messages.
  Adapter-based architecture supports custom commit conventions. Integrates with
  git hooks. Retry functionality for failed commits. Could complement existing
  pre-commit hooks.
- **Invocation:** User-direct (interactive prompts); Claude could invoke `cz`
  non-interactively with flags
- **Confidence:** HIGH (2+ sources: GitHub, npm, official docs, multiple
  tutorials)

### cocogitto (cog)

- **What:** Conventional Commits toolbox written in Rust — commit verification,
  auto-versioning, changelog generation, monorepo support
- **URL:** https://github.com/cocogitto/cocogitto
- **Install:** `cargo install --locked cocogitto` / `brew install cocogitto` /
  Docker
- **Stars/Activity:** 1.1k stars; latest release 7.0.0 (Mar 2026), actively
  maintained
- **Windows:** Partial (no native installer listed; Cargo or Docker work on
  Windows)
- **Beyond git+gh:** All-in-one: verifies commit format, auto-bumps versions,
  generates changelogs, supports monorepos. Single binary with libgit2
  dependency. GitHub Actions integration. More opinionated and integrated than
  commitizen — replaces multiple tools.
- **Invocation:** Both — Claude can run `cog check` for verification; user runs
  `cog commit` interactively
- **Confidence:** MEDIUM (2 sources: GitHub, official docs; smaller community)

---

## 4. Changelog & Release Automation

### git-cliff

- **What:** Highly customizable changelog generator following Conventional
  Commit specifications, written in Rust
- **URL:** https://github.com/orhun/git-cliff
- **Install:** `cargo install git-cliff` / npm / pip / winget / scoop / binary
  releases
- **Stars/Activity:** 11.6k stars; latest release v2.12.0 (Jan 2026), actively
  maintained
- **Windows:** Yes (Cargo, npm, scoop, winget, binary releases)
- **Beyond git+gh:** Regex-powered custom parsers. Templating via Tera
  (Jinja2-like). Include/exclude paths. Release statistics. Auto-discovers git
  repo from subdirectories. Integrates with Node.js, Python, and Rust
  ecosystems. GitHub/GitLab integration for release notes.
- **Invocation:** Both — Claude can generate changelogs via `git-cliff`; user
  configures templates
- **Confidence:** HIGH (2+ sources: GitHub, official site, dev blogs, crates.io)

---

## 5. Interactive History & Rebase Tools

### git-interactive-rebase-tool

- **What:** Native cross-platform terminal-based sequence editor that replaces
  the default text editor during `git rebase -i`
- **URL:** https://github.com/MitMaro/git-interactive-rebase-tool
- **Install:** `cargo install git-interactive-rebase-tool` then
  `git config --global sequence.editor interactive-rebase-tool`
- **Stars/Activity:** 1.9k stars; 1,164 commits, maintained
- **Windows:** Yes (Windows 10/11 tested, works with Git Bash via winpty,
  Windows Terminal, PowerShell)
- **Beyond git+gh:** Visual interface for reordering, squashing, editing, and
  dropping commits during interactive rebase. Keyboard shortcuts instead of
  editing a text file. Shows commit details inline. Much faster and less
  error-prone than editing the rebase todo list manually.
- **Invocation:** User-direct (interactive TUI triggered by `git rebase -i`)
- **Confidence:** HIGH (2+ sources: GitHub, DEV Community article, official
  site)

### git-absorb

- **What:** Automatic fixup commit creation — stages changes and automatically
  identifies which prior commits they belong to
- **URL:** https://github.com/tummychow/git-absorb
- **Install:** `winget install tummychow.git-absorb` / `brew install git-absorb`
  / `cargo install git-absorb` / apt / pacman
- **Stars/Activity:** 5.4k stars; latest release 0.9.0 (Feb 2026), actively
  maintained
- **Windows:** Yes (Winget, binary releases)
- **Beyond git+gh:** Port of Facebook's hg absorb. After staging changes,
  `git absorb` automatically creates fixup! commits targeting the correct parent
  commits. With `--and-rebase`, fixups are auto-squashed. Eliminates manual
  `git commit --fixup=<hash>` + `git rebase -i --autosquash` workflow.
  Mathematically determines correct targets via patch commutativity.
- **Invocation:** Both — Claude can run `git absorb --and-rebase` as part of
  cleanup; user can run interactively
- **Confidence:** HIGH (2+ sources: GitHub, HN discussion, dev blog tutorials)

---

## 6. Fuzzy-Finder Git Integration

### fzf

- **What:** General-purpose command-line fuzzy finder — foundation for
  interactive selection of files, branches, commits, and more
- **URL:** https://github.com/junegunn/fzf
- **Install:** `scoop install fzf` / `choco install fzf` / `winget install fzf`
- **Stars/Activity:** 78.9k stars; actively maintained, one of the most popular
  CLI tools
- **Windows:** Yes (Scoop, Chocolatey, Winget, MSYS2)
- **Beyond git+gh:** Not git-specific, but transforms any git command into
  interactive selection. `git log | fzf` for commit picking, `git branch | fzf`
  for branch switching. Foundation for forgit and other git-fzf integrations.
  Supports preview windows showing diffs inline.
- **Invocation:** Both — Claude can pipe to fzf for selection; user gets
  interactive picker
- **Confidence:** HIGH (2+ sources: GitHub, official docs, universal adoption)

### forgit

- **What:** Shell plugin that wraps git commands with fzf-powered interactive
  selection and live previews
- **URL:** https://github.com/wfxr/forgit
- **Install:** `brew install forgit` / shell plugin managers (zplug, zinit,
  oh-my-zsh, fisher)
- **Stars/Activity:** 4.9k stars; actively maintained
- **Windows:** Partial (works in Git Bash/WSL; depends on bash/zsh/fish shell)
- **Beyond git+gh:** Interactive `git add` with diff preview, `git log` with
  commit preview, `git stash` browser, `git cherry-pick` with preview,
  `git checkout` with file preview. Vim keybindings. Makes every git operation
  explorable. Much faster than memorizing git flags.
- **Invocation:** User-direct (interactive shell integration)
- **Confidence:** HIGH (2+ sources: GitHub, Terminal Trove, Linux Uprising blog)

---

## 7. Branch Management & Workflow Automation

### git-town

- **What:** High-level git commands that automate branch creation,
  synchronization, shipping, and cleanup across any branching model
- **URL:** https://github.com/git-town/git-town
- **Install:** Native binary, no dependencies (available for all platforms); see
  git-town.com/install
- **Stars/Activity:** 3.1k stars; latest release v22.7.0 (Mar 2026), very
  actively maintained
- **Windows:** Yes (native binary, CI-tested on Windows)
- **Beyond git+gh:** Commands like `git hack` (create feature branch),
  `git sync` (update branches), `git ship` (merge and cleanup), `git propose`
  (create PR). Supports Git Flow, GitHub Flow, GitLab Flow, trunk-based dev.
  Stacked changes support. Built-in undo for all operations. Reduces multi-step
  git workflows to single commands.
- **Invocation:** Both — Claude can use `git town sync`, `git town ship`; user
  benefits from interactive `git town switch`
- **Confidence:** HIGH (2+ sources: GitHub, official site, HN discussion, Go
  packages)

### git-clean

- **What:** CLI tool for bulk deletion of merged branches (local and remote)
- **URL:** https://github.com/mcasper/git-clean
- **Install:** Cargo install or binary download
- **Stars/Activity:** ~200 stars; smaller tool
- **Windows:** Partial (Rust binary, should compile on Windows)
- **Beyond git+gh:** Deletes all branches even with remote, handles errors
  gracefully when remote already deleted. Simple single-purpose tool for branch
  hygiene.
- **Invocation:** Both — Claude can run for automated cleanup
- **Confidence:** MEDIUM (2 sources: GitHub, dev blog mentions)

---

## 8. Stacked PRs / Stacked Diffs

### Graphite CLI (gt)

- **What:** CLI for creating and managing stacked PRs — automates dependency
  management, rebasing, and submission of PR chains
- **URL:** https://graphite.dev / https://github.com/withgraphite/graphite-cli
- **Install:** `npm install -g @withgraphite/graphite-cli` or
  `brew install graphite`
- **Stars/Activity:** Popular in the stacked-PR ecosystem; backed by company
  (Graphite)
- **Windows:** Yes (via npm, cross-platform)
- **Beyond git+gh:** `gt create` replaces manual branch+commit+push. `gt submit`
  pushes entire stack at once. Auto-rebases dependent PRs when parent merges.
  Web UI for reviewing stacks. Replaces `gh pr create` for stacked workflows.
  Git commands pass through if unrecognized.
- **Invocation:** Both — Claude can use `gt` commands; user benefits from web
  dashboard
- **Confidence:** HIGH (2+ sources: official site, multiple dev blogs, DEV
  Community)

### git-branchless

- **What:** Suite of tools for high-velocity, monorepo-scale workflow — smartlog
  visualization, undo, patch-stack workflows
- **URL:** https://github.com/arxanas/git-branchless
- **Install:** `cargo install --locked git-branchless` then
  `git branchless init`
- **Stars/Activity:** 4k stars; latest release v0.10.0 (Oct 2024); alpha status
- **Windows:** Yes (Cargo install, cross-platform Rust binary)
- **Beyond git+gh:** General-purpose undo for any git operation. `git sl`
  (smartlog) shows commit graph with your branches highlighted. Commit graph
  manipulation. Patch-stack workflows (Facebook/Google style).
  Performance-optimized for large repos. Ambitious scope — aims to fix git's
  fundamental UX problems.
- **Invocation:** Both — Claude can use `git undo`, `git sl`; user benefits from
  visualization
- **Confidence:** MEDIUM (2+ sources: GitHub, stacking.dev, dev blogs; alpha
  status is a risk)

---

## 9. Git Hooks Management

### lefthook

- **What:** Fast, dependency-free git hooks manager written in Go with parallel
  execution and powerful file filtering
- **URL:** https://github.com/evilmartians/lefthook
- **Install:** `winget install lefthook` / `npm install lefthook --save-dev` /
  `brew install lefthook`
- **Stars/Activity:** 7.8k stars; latest release v2.1.4 (Mar 2026), very
  actively maintained
- **Windows:** Yes (Winget, npm, binary)
- **Beyond git+gh:** Single YAML config for all hooks. Parallel execution by
  default (Go-powered). No runtime dependencies. Glob-based file filtering.
  Supports pre-commit, commit-msg, pre-push, and all other hook types. Used by
  10.6k dependent projects. Could complement or replace the project's custom
  hook scripts.
- **Invocation:** Both — runs automatically on git operations; Claude can invoke
  `lefthook run pre-commit`
- **Confidence:** HIGH (2+ sources: GitHub, multiple comparison articles, Evil
  Martians blog)
- **Hook Integration Note:** Could potentially wrap existing custom
  pre-commit/pre-push hooks, adding parallel execution and better failure
  reporting. The project already has 18 GitHub Actions workflows — lefthook
  would handle the local side.

### husky

- **What:** Git hooks manager for the Node.js ecosystem — configures hooks via
  package.json or `.husky/` directory
- **URL:** https://github.com/typicode/husky
- **Install:** `npm install husky --save-dev`
- **Stars/Activity:** 33k+ stars; 7M+ weekly npm downloads; actively maintained
- **Windows:** Yes (via npm, cross-platform)
- **Beyond git+gh:** De facto standard in JS/TS projects. Simple
  `.husky/pre-commit` shell scripts. Integrates with lint-staged, commitlint.
  Lightweight — just shell scripts in a directory.
- **Invocation:** Runs automatically on git operations
- **Confidence:** HIGH (2+ sources: GitHub, npm, official docs)
- **Hook Integration Note:** The project already has custom hooks. Husky is
  JS-ecosystem focused — less relevant if hooks are already managed manually.
  Lefthook is the stronger choice for polyglot/custom setups.

### pre-commit (Python framework)

- **What:** Language-agnostic framework for managing multi-language pre-commit
  hooks with a large community hook catalog
- **URL:** https://pre-commit.com / https://github.com/pre-commit/pre-commit
- **Install:** `pip install pre-commit` or `brew install pre-commit`
- **Stars/Activity:** 13k+ stars; widely adopted
- **Windows:** Yes (via pip, cross-platform Python)
- **Beyond git+gh:** Huge catalog of community hooks (linters, formatters,
  security scanners). Auto-installs hook dependencies. Language-agnostic
  (supports Python, Node, Go, Rust, etc.). `.pre-commit-config.yaml` is
  declarative and version-pinned.
- **Invocation:** Runs automatically on git operations; Claude can run
  `pre-commit run --all-files`
- **Confidence:** HIGH (2+ sources: GitHub, official docs, widespread adoption)
- **Hook Integration Note:** Could formalize the project's existing hook scripts
  into a standardized framework with version pinning and community hooks.

---

## 10. Repository Analytics & Stats

### onefetch

- **What:** Command-line Git information tool displaying project info, language
  breakdown, and code statistics with ASCII art
- **URL:** https://github.com/o2sh/onefetch
- **Install:** `winget install onefetch`
- **Stars/Activity:** 11.7k stars; latest release 2.27.1 (Mar 2026), actively
  maintained
- **Windows:** Yes (Winget)
- **Beyond git+gh:** Neofetch-style display for git repos. Shows language
  breakdown, contributors, license, repo age, LOC, commit count. Supports 100+
  languages. Completely offline. Great for quick project orientation.
- **Invocation:** Both — Claude can run for project summaries; user gets visual
  display
- **Confidence:** HIGH (2+ sources: GitHub, How-To Geek, Medium articles)

### git-quick-stats

- **What:** Simple CLI for accessing repository statistics — contributor
  rankings, commit frequencies, file change patterns
- **URL:** https://github.com/git-quick-stats/git-quick-stats
- **Install:** apt / brew / make install / Docker / Cygwin (Windows)
- **Stars/Activity:** 7k stars; actively maintained
- **Windows:** Partial (via Cygwin or WSL)
- **Beyond git+gh:** Interactive menu for 20+ statistics queries. Top
  contributors, commits per day/month, most modified files, commit streaks.
  Useful for retrospectives, sprint reviews, and understanding codebase
  evolution.
- **Invocation:** Both — Claude can run specific stat queries; user can browse
  interactively
- **Confidence:** HIGH (2+ sources: GitHub, official site, Fig documentation)

### git-sizer

- **What:** Analyzes Git repository size metrics and flags potential performance
  issues (large files, deep trees, excessive refs)
- **URL:** https://github.com/github/git-sizer
- **Install:** Download binary from releases; add to PATH
- **Stars/Activity:** 4k+ stars; latest release v1.5.0; maintained by GitHub org
- **Windows:** Yes (Windows executable available from releases)
- **Beyond git+gh:** Identifies repos growing too large, oversized blobs,
  problematic directory structures. Helps diagnose slow git operations. Official
  GitHub tool.
- **Invocation:** Both — Claude can run diagnostics; user reviews output
- **Confidence:** HIGH (2+ sources: GitHub official org, release page, docs)

---

## 11. Repository Maintenance & Cleanup

### git-filter-repo

- **What:** Fast, safe tool for rewriting git history — officially recommended
  replacement for `git filter-branch`
- **URL:** https://github.com/newren/git-filter-repo
- **Install:** Single Python script placed in PATH; requires Python 3.6+ and Git
  2.36+
- **Stars/Activity:** 12k stars; actively maintained
- **Windows:** Yes (Python-based, cross-platform)
- **Beyond git+gh:** Remove sensitive data from history, extract subdirectories
  into new repos, rename files across history, rewrite author info. 10-720x
  faster than git-filter-branch. Officially recommended by the Git project.
- **Invocation:** Both — Claude can run for automated history cleanup; user
  confirms destructive operations
- **Confidence:** HIGH (2+ sources: GitHub, Git project official recommendation,
  dev blogs)

### BFG Repo-Cleaner

- **What:** Faster alternative to git-filter-branch specifically for removing
  large files and sensitive data from git history
- **URL:** https://github.com/rtyley/bfg-repo-cleaner
- **Install:** Download JAR file; requires Java 11+
- **Stars/Activity:** 12k+ stars; established tool
- **Windows:** Yes (Java-based, cross-platform)
- **Beyond git+gh:** Multi-core processing by default. 10-720x faster than
  filter-branch. Simple CLI: `bfg --strip-blobs-bigger-than 100M`. Protects HEAD
  commit by default. However, git-filter-repo is now the recommended successor
  for most use cases.
- **Invocation:** Both — Claude can run; user confirms
- **Confidence:** HIGH (2+ sources: GitHub, official site, Git project mentions)

---

## 12. Git Worktree Management

### worktrunk

- **What:** CLI for Git worktree management designed for parallel AI agent
  workflows — simplifies worktree creation and switching
- **URL:** https://github.com/max-sixty/worktrunk
- **Install:** See releases page
- **Stars/Activity:** Newer tool, growing adoption (AI-workflow focused)
- **Windows:** Likely (Rust-based binary)
- **Beyond git+gh:** Three core commands make worktrees as easy as branches.
  Designed specifically for running AI agents in parallel — each agent gets its
  own worktree. Relevant for Claude Code multi-agent workflows.
- **Invocation:** Both — Claude agents could use worktrees for parallel work
- **Confidence:** MEDIUM (2 sources: GitHub, Nx blog, worktrunk.dev; newer tool)

### gwq

- **What:** Git worktree manager with fuzzy finder integration for creating,
  switching, and deleting worktrees
- **URL:** https://github.com/d-kuro/gwq
- **Install:** See GitHub releases
- **Stars/Activity:** Newer tool
- **Windows:** Likely (Go-based binary)
- **Beyond git+gh:** ghq-style management for worktrees instead of clones. Fuzzy
  finder for worktree navigation. Intuitive create/switch/delete operations.
- **Invocation:** User-direct (interactive fuzzy finder)
- **Confidence:** LOW (1 primary source: GitHub; newer/smaller tool)

---

## 13. Integration Summary Matrix

### Recommended for This Project (SoNash)

| Tool               | Priority | Reason                                                                                | Effort                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| **delta**          | HIGH     | Zero-friction install, improves every `git diff`/`git blame` for both Claude and user | 5 min (set pager in .gitconfig)         |
| **lazygit**        | HIGH     | Best TUI for visual git exploration, conflict resolution, interactive rebase          | 5 min (scoop/winget install)            |
| **git-absorb**     | HIGH     | Automates fixup commits — perfect for iterative PR workflows                          | 5 min (winget install)                  |
| **fzf**            | HIGH     | Foundation tool, improves branch/commit/file selection everywhere                     | 5 min (scoop/winget install)            |
| **git-cliff**      | MEDIUM   | Automates changelog generation from conventional commits                              | 15 min (install + configure)            |
| **difftastic**     | MEDIUM   | Syntax-aware diffs for code review — complementary to delta                           | 5 min (install + configure as difftool) |
| **onefetch**       | MEDIUM   | Quick project stats, useful for session-start context                                 | 5 min (winget install)                  |
| **lefthook**       | MEDIUM   | Could formalize existing hook scripts with parallel execution                         | 30 min (migrate hooks)                  |
| **git-town**       | LOW      | Powerful but overlaps with existing gh + git workflow                                 | 15 min (install + init)                 |
| **git-branchless** | LOW      | Ambitious but alpha status; monitor for stability                                     | N/A (wait)                              |

### Claude-Invocable vs User-Direct

| Category        | Claude Can Invoke                        | User-Direct Only                 |
| --------------- | ---------------------------------------- | -------------------------------- |
| Diff/Review     | delta (as pager), difftastic, git-absorb | -                                |
| Stats           | onefetch, git-quick-stats, git-sizer     | -                                |
| Changelog       | git-cliff                                | -                                |
| Hooks           | lefthook run, pre-commit run             | -                                |
| History         | git-filter-repo, BFG                     | -                                |
| Branch Mgmt     | git-town sync/ship                       | git-town switch (interactive)    |
| TUI Clients     | -                                        | lazygit, gitui, tig              |
| Fuzzy Selection | fzf (piped)                              | forgit (interactive)             |
| Commits         | -                                        | commitizen (interactive prompts) |
| Stacked PRs     | gt submit                                | gt create (interactive)          |

### Hook Ecosystem Integration

The project has custom pre-commit/pre-push hooks and 18 GitHub Actions
workflows. Tools that could integrate:

1. **lefthook** — Could wrap existing hooks in `lefthook.yml` for parallel
   execution, better error reporting, and glob-based file filtering. Most
   natural fit.
2. **pre-commit framework** — Could formalize hooks with version-pinned
   community linters. Heavier migration.
3. **git-absorb** — Complements hook workflow by automating fixup commits when
   hooks catch issues.
4. **commitizen/cocogitto** — Could integrate with existing `commit-msg` hooks
   for message validation.

---

## Source URLs

- https://github.com/jesseduffield/lazygit
- https://github.com/gitui-org/gitui
- https://github.com/jonas/tig
- https://github.com/dandavison/delta
- https://github.com/Wilfred/difftastic
- https://github.com/commitizen/cz-cli
- https://github.com/cocogitto/cocogitto
- https://github.com/orhun/git-cliff
- https://github.com/MitMaro/git-interactive-rebase-tool
- https://github.com/tummychow/git-absorb
- https://github.com/junegunn/fzf
- https://github.com/wfxr/forgit
- https://github.com/git-town/git-town
- https://github.com/arxanas/git-branchless
- https://graphite.dev
- https://github.com/evilmartians/lefthook
- https://typicode.github.io/husky/
- https://pre-commit.com
- https://github.com/o2sh/onefetch
- https://github.com/git-quick-stats/git-quick-stats
- https://github.com/github/git-sizer
- https://github.com/newren/git-filter-repo
- https://github.com/rtyley/bfg-repo-cleaner
- https://github.com/max-sixty/worktrunk
- https://github.com/d-kuro/gwq
- https://github.com/mcasper/git-clean
- https://www.bwplotka.dev/2025/lazygit/
- https://nexasphere.io/blog/modern-cli-tools-developers-2026
- https://dandavison.github.io/delta/introduction.html
- https://difftastic.wilfred.me.uk/
- https://git-cliff.org/
- https://www.git-town.com/
