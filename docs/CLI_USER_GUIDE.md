# CLI User Guide

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-26
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Practical reference for the 14+1 CLI tools installed into the SoNash development
environment. Covers what each tool does, what it replaces, how to use it, and
how the environment ensures it actually gets used.

---

## Quick Reference

| Tool       | Version | Category     | Replaces       | Description                            |
| ---------- | ------- | ------------ | -------------- | -------------------------------------- |
| `fzf`      | 0.70.0  | Search       | —              | Fuzzy finder for files, history, lists |
| `bat`      | 0.26.1  | View         | `cat`          | Syntax-highlighted file viewer         |
| `fd`       | 10.4.2  | Search       | `find`         | Fast file finder with sane defaults    |
| `delta`    | 0.19.1  | Git          | git's built-in | Syntax-highlighted git diffs           |
| `zoxide`   | 0.9.9   | Navigation   | `cd`           | Frecency-based smart directory jumping |
| `eza`      | latest  | View         | `ls`           | Modern ls with color, icons, git info  |
| `rg`       | 14.1.1  | Search       | `grep`         | Fast recursive grep (ripgrep)          |
| `starship` | 1.24.2  | Prompt       | default prompt | Minimal shell prompt with context      |
| `yazi`     | 26.1.22 | File manager | —              | Terminal file manager (TUI)            |
| `lazygit`  | 0.60.0  | Git          | git CLI        | Visual git TUI                         |
| `yq`       | 4.52.5  | Data         | manual parsing | YAML/JSON/XML/CSV processor            |
| `gron`     | dev     | Data         | —              | Flatten JSON for grepping              |
| `htmlq`    | 0.4.0   | Data         | —              | CSS selector queries on HTML           |
| `difft`    | 0.68.0  | Git          | `diff`         | AST-aware structural code diffs        |
| `tsgo`     | npm     | TypeScript   | `tsc`          | Native TypeScript compiler (10x speed) |

---

## Tool Details

### bat — Syntax-Highlighted File Viewer

**What it is:** `cat` with syntax highlighting, line numbers, and git change
markers in the gutter.

**Replaces:** `cat` for any file viewing in the terminal.

**Examples:**

```bash
# View a TypeScript file with syntax highlighting
bat lib/firestore-service.ts

# View with line numbers starting at a specific line
bat -n --line-range 50:100 functions/src/schemas.ts

# View multiple files
bat components/auth/LoginForm.tsx components/auth/SignupForm.tsx

# Pipe output (disables decoration, plain text)
bat lib/firestore-service.ts | grep -i "journal"

# View a config file
bat .claude/tool-manifest.json
```

**How Claude uses it:** When Claude needs to display file contents in Bash
output (not via the Read tool), it uses `bat` instead of `cat` so you see
syntax-highlighted output. Availability is gated — if `bat` is missing, Claude
falls back to `cat`.

---

### fd — Fast File Finder

**What it is:** A `find` replacement that is faster, respects `.gitignore` by
default, and has a simpler syntax.

**Replaces:** `find . -name "..."` patterns.

**Examples:**

```bash
# Find all TypeScript files in the project
fd --type f --extension ts

# Find files by name pattern
fd "firestore" --type f

# Find files modified in the last day
fd --changed-within 1d --type f

# Find and pass to bat for viewing
fd "schema" functions/src | xargs bat

# Find directories only
fd --type d "components"
```

**How Claude uses it:** Claude prefers `fd` over `find` in generated Bash
commands. Faster and the `.gitignore` awareness means results are relevant (no
`node_modules` noise).

---

### fzf — Fuzzy Finder

**What it is:** An interactive fuzzy search tool. Reads a list from stdin, lets
you type to filter it, and returns your selection.

**Replaces:** Nothing directly — it enhances other tools by adding interactive
selection.

**Examples:**

```bash
# Interactive file open (pipe into bat)
fd --type f | fzf | xargs bat

# Fuzzy git branch checkout
git branch | fzf | xargs git checkout

# Search command history interactively (Ctrl+R is pre-wired)
# Just press Ctrl+R in your shell

# Pick a file to edit
code $(fd --type f --extension tsx | fzf)

# Fuzzy search git log
git log --oneline | fzf
```

**How Claude uses it:** Claude suggests `fzf` pipelines when you need to select
from a list (files, branches, commits). For automated tasks Claude does not use
`fzf` since it requires interactive input.

---

### delta — Git Diff Pager

**What it is:** A syntax-highlighted, side-by-side diff viewer that replaces
git's default pager for `git diff`, `git show`, `git log -p`, and `git add -p`.

**Replaces:** git's built-in diff output.

**Configured automatically:** delta is set as the global git pager by
`scripts/setup-cli-tools.sh`. You do not need to do anything — it activates
whenever you run a git diff command.

**Configuration** (`tool-configs/.gitconfig-delta`, deployed to `~/.gitconfig`):

```ini
[delta]
    navigate = true       # n/N to jump between diff sections
    side-by-side = true   # two-column layout
    line-numbers = true   # show line numbers
    syntax-theme = Dracula
```

**Examples:**

```bash
# Standard diff — delta activates automatically
git diff HEAD~1

# Show a specific commit
git show 33005e10

# Stage interactively (delta highlights changes in add -p)
git add -p

# Navigate sections: press n (next) / N (prev) while in delta
```

**How Claude uses it:** Delta is passive — it activates automatically. Claude
does not need to invoke it. The improved diff readability affects any git
command Claude runs that produces diff output.

---

### zoxide — Smart Directory Jumping

**What it is:** Tracks which directories you visit and assigns a frecency score
(frequency + recency). The `z` command jumps to the best match without requiring
the full path.

**Replaces:** `cd` for navigating to frequently-used directories.

**Configured automatically:** The init line is added to `~/.bashrc` by
`scripts/setup-cli-tools.sh`. Zoxide starts learning your directories
immediately after the first shell restart.

**Examples:**

```bash
# Jump to sonash-v0 from anywhere (after you've visited it once)
z sonash

# Jump to functions directory
z functions

# Fuzzy interactive jump (requires fzf)
zi

# Show zoxide's directory database
zoxide query --list

# Jump to the highest-scored match for "components"
z components
```

**How Claude uses it:** Claude does not use `z` directly (it uses absolute paths
in tool calls). The benefit is for you in the terminal — faster navigation
between the project directories you use most.

---

### eza — Modern ls

**What it is:** A `ls` replacement with color-coded output, file type icons
(requires Nerd Font), and built-in git status indicators.

**Replaces:** `ls`, `ls -la`, `ls -lh`.

**Note on icons:** Icons require JetBrains Mono NF (or another Nerd Font) to be
set as your terminal font. Without it, you see placeholder boxes instead of
icons. Use `eza --no-icons` to suppress them if you have not installed the font
yet.

**Examples:**

```bash
# Long listing with icons
eza --long --icons

# Show hidden files
eza --long --icons --all

# Tree view (useful for component directories)
eza --tree --level 2 app/

# With git status indicators (shows M/A/D markers)
eza --long --git

# Sort by modified time, newest first
eza --long --sort modified --reverse
```

**How Claude uses it:** Claude prefers `eza` over `ls` in Bash directory
listings. Falls back to `ls` if `eza` is unavailable.

---

### rg — Ripgrep

**What it is:** A fast recursive grep that respects `.gitignore`, supports
regex, and handles Unicode and binary files correctly.

**Replaces:** `grep -r`.

**Already in use:** The Claude Grep tool (`rg` under the hood) is what Claude
uses for all search operations. The standalone `rg` binary is also available for
Bash pipes and your own terminal searches.

**Examples:**

```bash
# Search for a function name across the codebase
rg "httpsCallable" --type ts

# Search with context (3 lines before/after)
rg -C 3 "journal" functions/src/

# Search only in certain file types
rg "useCallback" --type tsx

# Case-insensitive search
rg -i "firebase" lib/

# Find files that do NOT contain a pattern
rg --files-without-match "use client" app/

# Count matches per file
rg --count "console.log" --type ts
```

**How Claude uses it:** The Grep tool uses `rg` internally. For Bash commands
that need grep-style filtering, Claude uses `rg` instead of `grep`.

---

### starship — Shell Prompt

**What it is:** A minimal, fast shell prompt that shows the current directory,
git branch, git status, Node.js version, and command duration for long-running
commands.

**Replaces:** The default bash prompt.

**Configured automatically:** The init line is added to `~/.bashrc` by
`scripts/setup-cli-tools.sh`. The project config is at `~/.config/starship.toml`
(deployed from `tool-configs/starship.toml`).

**What the prompt shows** (based on `tool-configs/starship.toml`):

```
sonash-v0 plan-32526 [!2?1]  v22.1.0  2.3s
>
```

- Directory (truncated to 3 parts)
- Git branch + status markers (! modified, ? untracked, arrows for ahead/behind)
- Node.js version
- Command duration for commands that take over 2 seconds
- `>` prompt character (green on success, red on error)

**How Claude uses it:** Claude does not interact with starship. The prompt is
passive infrastructure — you always know what branch you are on and whether
there are uncommitted changes.

---

### yazi — Terminal File Manager

**What it is:** A TUI (terminal UI) file manager. Navigate directories, preview
files, and perform file operations without leaving the terminal. Requires Nerd
Font for full icon support.

**Replaces:** Explorer or GUI file managers for terminal-native browsing.

**How to launch:**

```bash
# Open in current directory
yazi

# Open in a specific directory
yazi app/components/
```

**Key bindings inside yazi:**

| Key     | Action                       |
| ------- | ---------------------------- |
| `h`/`l` | Navigate up/down directories |
| `j`/`k` | Move cursor                  |
| `Enter` | Open file or enter directory |
| `y`     | Yank (copy) selected file    |
| `p`     | Paste                        |
| `d`     | Delete                       |
| `/`     | Search                       |
| `q`     | Quit                         |

**How Claude uses it:** Claude suggests `yazi` when you need to browse a
directory structure visually or when exploring an unfamiliar area of the
codebase would benefit from a file tree view. Claude cannot operate yazi
interactively — it launches it for you.

---

### lazygit — Git TUI

**What it is:** A terminal UI for git that shows the working tree, staged files,
commit log, branches, and stashes all in one screen. Useful for complex staging,
rebasing, and reviewing changes before committing.

**Replaces:** The git CLI for interactive operations.

**How to launch:**

```bash
lazygit
```

**Key areas inside lazygit:**

| Panel    | What it shows                              |
| -------- | ------------------------------------------ |
| Files    | Staged, unstaged, and untracked files      |
| Branches | Local/remote branches with tracking status |
| Commits  | Log with diff preview                      |
| Stash    | Stashed changes                            |
| Reflog   | All recent HEAD movements                  |

**Common actions:**

| Key     | Action                  |
| ------- | ----------------------- |
| `Space` | Stage/unstage file      |
| `c`     | Commit (opens editor)   |
| `p`     | Push                    |
| `P`     | Pull                    |
| `b`     | Branch menu             |
| `?`     | Help (full keybindings) |

**How Claude uses it:** Claude suggests `lazygit` when you have a complex
staging situation, need to do an interactive rebase, or want a visual overview
before a PR. Claude does not operate lazygit — it is always user-driven.

---

### yq — YAML/JSON/XML/CSV Processor

**What it is:** `jq` for YAML, with full support for YAML, JSON, XML, CSV, and
TOML. Same expression syntax as `jq`.

**Replaces:** Manual parsing or `jq` when the input is not plain JSON.

**Examples:**

```bash
# Read a value from firebase.json
yq '.hosting.rewrites[0]' firebase.json

# Read from firestore.rules (YAML front matter)
yq '.rules' firestore.indexes.json

# Edit a value in place
yq -i '.functions.source = "functions"' firebase.json

# Convert YAML to JSON
yq -o=json tool-configs/starship.toml

# Query the tool manifest
yq '.tools.bat.category' .claude/tool-manifest.json

# Extract all tool names from the manifest
yq '.tools | keys' .claude/tool-manifest.json
```

**How Claude uses it:** Claude uses `yq` when processing config files (YAML,
TOML, XML) in Bash pipelines. Preferred over `jq` for non-JSON formats.

---

### gron — JSON Flattener

**What it is:** Converts JSON into flat `key = value` assignments that can be
grepped with standard tools. Reverse with `gron --ungron` to get JSON back.

**Replaces:** Complex `jq` paths when you need to explore an unknown JSON
structure.

**Examples:**

```bash
# Flatten a JSON file to see all paths
gron .claude/tool-manifest.json

# Grep for a specific path pattern
gron .claude/tool-manifest.json | grep "prefer_over"

# Explore the shape of a Cloud Function response
curl -s <url> | gron | grep "error"

# Edit and re-encode back to JSON
gron package.json | grep "scripts" | gron --ungron
```

**How Claude uses it:** Claude uses `gron` when exploring JSON structures where
the schema is unknown or when needing to grep across deeply nested JSON.
Particularly useful for API responses and large config files.

---

### htmlq — HTML CSS Selector Query

**What it is:** Runs CSS selector queries against HTML input, similar to how
`jq` works for JSON. Useful for extracting structured data from HTML output.

**Replaces:** `grep` patterns against HTML (fragile and error-prone).

**Examples:**

```bash
# Extract all links from a page
curl -s https://sonash.app | htmlq 'a[href]' --attribute href

# Get page title
curl -s https://sonash.app | htmlq 'title' --text

# Extract meta tags
curl -s https://sonash.app | htmlq 'meta[name]'

# Extract table data from a static export
cat .next/server/app/index.html | htmlq 'table td' --text
```

**How Claude uses it:** Claude uses `htmlq` when extracting data from HTML files
or web responses in Bash pipelines. Avoids fragile regex-based HTML parsing.

---

### difft — Difftastic (Structural Diffs)

**What it is:** An AST-aware diff tool that understands code structure. Where
`delta` shows you which lines changed, `difft` shows you which language
constructs changed (added function, renamed parameter, etc.).

**Replaces:** `diff` for code comparison. Complements `delta` (not a replacement
— they serve different purposes).

**Examples:**

```bash
# Diff two versions of a file structurally
difft lib/firestore-service.ts.bak lib/firestore-service.ts

# Use as git diff driver for a single comparison
GIT_EXTERNAL_DIFF=difft git diff HEAD~1 functions/src/schemas.ts

# Compare two branches on a specific file
difft <(git show main:lib/firestore-service.ts) lib/firestore-service.ts
```

**How Claude uses it:** Claude uses `difft` when understanding the structural
nature of a change matters — refactoring reviews, schema migrations, or
comparing two implementations. For everyday `git diff` output, delta handles it
automatically.

---

### tsgo — Native TypeScript Compiler

**What it is:** `@typescript/native-preview` — a native implementation of the
TypeScript compiler written in Go. Approximately 10x faster than `tsc` for
type-checking. Not a replacement for the full TypeScript compiler for complex
scenarios, but suitable for fast type-check runs.

**Replaces:** `tsc --noEmit` for fast type-checking.

**Install location:** `node_modules/.bin/tsgo` (installed as a dev dependency).

**Examples:**

```bash
# Fast type check (no emit)
npx tsgo --noEmit

# Type check with explicit config
npx tsgo --project tsconfig.json --noEmit

# Compare speed (approximate)
time tsc --noEmit
time tsgo --noEmit
```

**Caveats:** `tsgo` is a preview. Some advanced TypeScript features may produce
different diagnostics than `tsc`. The standard CI build still uses `tsc`. Use
`tsgo` for rapid feedback during development; treat `tsc` as authoritative.

**How Claude uses it:** Claude suggests `tsgo` for quick type-check feedback
during development when you want fast iteration. `tsc` remains the CI gate.

---

## Automatic Tools (No Action Required)

These three tools configure themselves and activate on their own. Once installed
and set up via `scripts/setup-cli-tools.sh`, you do not need to invoke them.

### delta

Configured as the global git pager (`core.pager = delta` in `~/.gitconfig`).
Every `git diff`, `git show`, `git log -p`, and `git add -p` automatically uses
delta's side-by-side view with syntax highlighting and line numbers.

### starship

Initialized in `~/.bashrc` via `eval "$(starship init bash)"`. Activates on
every new shell. Config is at `~/.config/starship.toml` (deployed from
`tool-configs/starship.toml`). Shows branch, status, Node.js version, and
command duration.

### zoxide

Initialized in `~/.bashrc` via `eval "$(zoxide init bash)"`. Starts tracking
visited directories immediately. Use `z <partial-name>` instead of
`cd <full-path>` once a directory has been visited at least once.

---

## Interactive Tools (How to Launch)

These tools require you to start them. They cannot be operated by Claude.

| Tool      | Launch Command          | When to Use                                         |
| --------- | ----------------------- | --------------------------------------------------- |
| `yazi`    | `yazi`                  | Visual directory browsing, bulk file operations     |
| `lazygit` | `lazygit`               | Interactive staging, rebase, visual commit log      |
| `fzf`     | Used in pipes or Ctrl+R | Fuzzy selection from any list; shell history search |

Claude will suggest these when the situation calls for them (complex staging
before a PR, exploring an unfamiliar directory structure, interactive
searching). The suggestion is a prompt — you decide when to act on it.

---

## How Enforcement Works

The tool set is enforced through three mechanisms:

### 1. CLAUDE.md Section 6 — CLI Tool Preferences

The project-level `CLAUDE.md` contains a preference table that Claude reads on
every session. It instructs Claude to prefer `bat` over `cat`, `fd` over `find`,
`eza` over `ls`, etc. — all gated on availability. If a tool is missing, Claude
falls back to the standard equivalent without failing.

The relevant section in `CLAUDE.md`:

```
| bat    | cat   | Displaying file contents in Bash
| fd     | find  | File finding
| eza    | ls    | Directory listings in Bash
| difft  | diff  | Structural code diffs
| yq     | —     | YAML/XML/CSV processing
| gron   | —     | Exploring unknown JSON structures
| htmlq  | —     | HTML content extraction in Bash pipes
```

### 2. Session-Start Hook — Manifest Check

Every session, `.claude/hooks/session-start.js` reads
`.claude/tool-manifest.json` and runs the `check` command for each tool. If any
tool is missing, the hook emits a warning:

```
   WARNING: CLI tools missing: bat, fd. Fix: bash scripts/install-cli-tools.sh
```

This appears in the session-start output before any work begins. Missing tools
are surfaced immediately so they can be fixed before Claude starts working.

The manifest at `.claude/tool-manifest.json` is the source of truth for which
tools are expected. Adding a tool to the manifest means the hook will warn if it
is absent on any locale.

### 3. Configured Automatically (delta, starship, zoxide)

`scripts/setup-cli-tools.sh` deploys configs and adds shell init lines to
`~/.bashrc`. These tools require no manual activation once the setup script has
run.

---

## Troubleshooting

### Tool Not Found

Run the verification script to see which tools are missing:

```bash
bash scripts/install-cli-tools.sh --verify
```

To reinstall missing tools:

```bash
bash scripts/install-cli-tools.sh
```

If a tool installs to `~/bin/` but is not found, confirm `~/bin/` is in your
`PATH`:

```bash
echo $PATH | tr ':' '\n' | grep bin
```

If it is missing, add it to `~/.bashrc`:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Icons Show as Boxes (eza, yazi, starship)

Icons require a Nerd Font to be installed and set as the terminal font.

1. Install JetBrains Mono NF: download the `.ttf` from
   [nerdfonts.com](https://www.nerdfonts.com/font-downloads) and double-click to
   install on Windows.
2. Set it as the font in your terminal emulator (Windows Terminal: Settings
   > Profiles > Appearance > Font face).
3. Restart the terminal.

To suppress icons without the font, use `eza --no-icons`.

### delta Not Activating in git diff

Confirm delta is configured as the pager:

```bash
git config --global core.pager
```

Should return `delta`. If not, run the setup script:

```bash
bash scripts/setup-cli-tools.sh
```

### starship Prompt Not Showing

Confirm the init line is in `~/.bashrc`:

```bash
grep starship ~/.bashrc
```

If missing, run the setup script or add it manually:

```bash
echo 'eval "$(starship init bash)"' >> ~/.bashrc
source ~/.bashrc
```

### zoxide Not Learning Directories

Confirm the init line is in `~/.bashrc`:

```bash
grep zoxide ~/.bashrc
```

Zoxide only learns directories you `cd` into — directories opened via file
managers or other methods are not tracked. Use `z` (not `cd`) for directories
you want frecency to apply to.

### tsgo Produces Different Errors Than tsc

Expected for a preview tool. Treat `tsc --noEmit` as authoritative. Use `tsgo`
only for fast iteration feedback during development, not as a diagnostic source.

---

## Work Locale Setup

The tool configs live in the repo and sync via git. After pulling on the work
locale:

```bash
# Pull latest (includes tool-configs/ updates)
git pull

# Re-run setup to deploy any updated configs
bash scripts/setup-cli-tools.sh

# Verify all tools are present
bash scripts/install-cli-tools.sh --verify
```

If any tools are missing on the work locale, the install script handles the work
locale's install method (GitHub release binaries to `~/bin/`, `go install` for
lazygit):

```bash
bash scripts/install-cli-tools.sh
```

The work locale does not have `winget` scoop/cargo. The install script detects
this and falls back to GitHub release downloads and `go install`. All binaries
land in `~/bin/`, which is already in PATH on the work locale.

Config files that sync via git:

| Config file                     | Deployed to                   |
| ------------------------------- | ----------------------------- |
| `tool-configs/starship.toml`    | `~/.config/starship.toml`     |
| `tool-configs/.gitconfig-delta` | Applied to `~/.gitconfig`     |
| `tool-configs/ntfy.conf`        | Reference only (topic config) |
| `.claude/tool-manifest.json`    | Read by session-start hook    |

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-03-26 | Initial release |
