# SQ-004: CLI Tools for Project/Task Management, Note-Taking, Bookmarking & Knowledge Management

**Research Date:** 2026-03-23 **Depth:** L1 (Exhaustive) **Search Rounds:** 8
**Sources Consulted:** 40+ (GitHub repos, official docs, developer blogs,
comparison articles)

---

## Executive Summary

There is a rich ecosystem of CLI tools for managing tasks, notes, knowledge, and
bookmarks from the terminal. The strongest candidates for a markdown-heavy,
git-tracked workflow like SoNash are **nb** (all-in-one), **dstask** (git-native
tasks), **jrnl** (journaling), and **glow** (markdown rendering). Tools that
store data in plain text/markdown/JSON are inherently git-friendly and align
with the existing JSONL + markdown workflow.

---

## Category 1: Task/Todo Managers

### Taskwarrior

- **What:** The most feature-rich CLI task manager; GTD-style with priorities,
  tags, due dates, dependencies, and recurrence
- **URL:** https://github.com/GothenburgBitFactory/taskwarrior
- **Install:** WSL required on Windows (no native Windows binary);
  `apt install taskwarrior` on WSL/Linux; Homebrew on macOS
- **Stars/Activity:** ~5,700 stars; last release v3.4.2 (October 2025); actively
  maintained since 2006
- **Windows:** Partial -- requires WSL (Cygwin no longer supported). No native
  Windows binary.
- **Data format:** JSON-based task storage; custom sync protocol (Taskserver)
- **Git-friendly:** Partial -- JSON files can be tracked but sync is designed
  for Taskserver, not git
- **Workflow fit:** Heavyweight for a solo developer already using markdown. The
  JSON format doesn't align with existing JSONL/markdown workflow. WSL
  requirement adds friction.
- **Confidence:** HIGH (well-documented, massive community)

### dstask

- **What:** Git-powered terminal task manager with markdown notes per task;
  single Go binary
- **URL:** https://github.com/naggie/dstask
- **Install:** `go install` or download binary; Windows binary available; stores
  data at `%USERPROFILE%\.dstask`
- **Stars/Activity:** ~1,100 stars; actively maintained
- **Windows:** Yes -- native Windows support including PowerShell completion
- **Data format:** YAML frontmatter + markdown notes per task, stored in a git
  repo
- **Git-friendly:** Yes -- designed specifically for git-based sync. All data is
  git-committed automatically.
- **Workflow fit:** EXCELLENT. Git-native, markdown-based, single binary,
  Windows support. The YAML+markdown format mirrors how SoNash already stores
  session context. Could complement ROADMAP.md for granular task tracking.
  Supports priorities (P0-P3), tags, projects, and due dates.
- **Confidence:** HIGH

### Ultralist

- **What:** Simple GTD-style task management for tech folks; due dates,
  projects, contexts, recurrence
- **URL:** https://github.com/gammons/ultralist
- **Install:** Go binary; Homebrew on macOS; `go install` elsewhere
- **Stars/Activity:** ~950 stars; last release v1.7.0 (November 2020) -- appears
  unmaintained
- **Windows:** Partial -- no explicit Windows install method; Go binary may work
- **Data format:** `.todos.json` (JSON file per project directory)
- **Git-friendly:** Yes -- JSON file can be committed
- **Workflow fit:** Simple and lightweight but appears unmaintained since 2020.
  JSON format is git-friendly but not markdown-aligned.
- **Confidence:** MEDIUM (unmaintained since 2020)

### todo.txt-cli

- **What:** The original plain-text task manager; one task per line in a simple
  text file with priority/project/context syntax
- **URL:** https://github.com/todotxt/todo.txt-cli
- **Install:** Bash script; Homebrew on macOS; manual install on Windows
  (requires bash)
- **Stars/Activity:** ~6,000 stars; last release v2.13.0 (December 2024); 575
  commits, 70 contributors
- **Windows:** Partial -- requires bash (Git Bash/MSYS should work since it's a
  shell script)
- **Data format:** Plain text `todo.txt` file; one line per task; human-readable
  syntax: `(A) Call Mom +Family @Phone`
- **Git-friendly:** Yes -- plain text is perfectly diffable and mergeable
- **Workflow fit:** Very simple; could work alongside existing workflow. The
  format is ultra-lightweight but lacks the structure of JSONL. Good for quick
  capture, but no markdown notes per task.
- **Confidence:** HIGH (huge ecosystem, stable format)

---

## Category 2: Note-Taking

### nb

- **What:** All-in-one CLI for plain text note-taking, bookmarking, archiving,
  and knowledge base with git versioning, search, encryption, and Pandoc
  conversion
- **URL:** https://github.com/xwmx/nb
- **Install:** Homebrew, npm (`npm install -g nb.sh`), or manual; on Windows via
  WSL, MSYS, or Cygwin (socat recommended)
- **Stars/Activity:** ~8,100 stars; last commit January 2025
- **Windows:** Partial -- works via WSL, MSYS, Cygwin. Not native Windows but
  Git Bash may work with socat.
- **Data format:** Markdown (default), also supports Org, LaTeX, AsciiDoc.
  Stored in `~/.nb/` directory structure.
- **Git-friendly:** Yes -- git-backed by design with automatic versioning and
  syncing
- **Workflow fit:** STRONG. The most feature-complete CLI tool in this space.
  Combines notes + bookmarks + todos + wiki-style linking + search in one tool.
  Markdown-native with git sync. Could serve as a unified knowledge base
  alongside existing session files. The wiki-linking feature (`[[links]]`)
  enables knowledge graph building. Concern: may overlap with existing workflow
  and add complexity.
- **Confidence:** HIGH

### jrnl

- **What:** Command-line journal/note-taking app with timestamps, tags, search,
  and optional AES encryption
- **URL:** https://github.com/jrnl-org/jrnl
- **Install:** `pip install jrnl` (Python); cross-platform
- **Stars/Activity:** ~7,200 stars; last release v4.2 (November 2024); 97
  contributors
- **Windows:** Yes -- Python-based, cross-platform. Works on Windows natively.
- **Data format:** Plain text with structured timestamps; human-readable journal
  format
- **Git-friendly:** Yes -- plain text files
- **Workflow fit:** GOOD for session logging. Could replace or complement the
  manual SESSION_CONTEXT.md updates. Quick entry from command line
  (`jrnl Today I fixed the auth bug @security`). Tags map to project concepts.
  Could feed into session-end workflows.
- **Confidence:** HIGH

### notes-cli

- **What:** Small markdown note-taking CLI that plays nicely with your editor
  and other CLI tools
- **URL:** https://github.com/rhysd/notes-cli
- **Install:** Go binary; `go install`; supports Windows via `$APPLOCALDATA`
- **Stars/Activity:** ~255 stars; last commit April 2020
- **Windows:** Yes -- explicitly supports Windows
- **Data format:** Markdown files with embedded metadata (category, tags,
  timestamp)
- **Git-friendly:** Yes -- markdown files with optional auto-commit
- **Workflow fit:** Lightweight alternative to nb. Good for quick notes
  organized by category. Auto-git-save is nice. But low activity suggests
  limited maintenance.
- **Confidence:** LOW (small project, last commit 2020)

### Journalot

- **What:** Minimal journaling CLI for developers with quick capture, natural
  language dates, and Git version control
- **URL:** https://journalot.dev/
- **Install:** Via package manager or binary
- **Stars/Activity:** New project (2025)
- **Windows:** Unknown -- likely cross-platform
- **Data format:** Markdown files, one per day
- **Git-friendly:** Yes -- designed with git in mind
- **Workflow fit:** Purpose-built for developer daily journaling. Quick append
  without opening editor (`journal "Had a breakthrough"`). Could complement
  session-end workflows for capturing daily progress.
- **Confidence:** LOW (new, limited track record)

---

## Category 3: Knowledge Management / Zettelkasten

### zk (zk-org)

- **What:** Plain text note-taking assistant for maintaining a Zettelkasten or
  personal wiki; template-based, LSP-compatible
- **URL:** https://github.com/zk-org/zk
- **Install:** Go binary; Homebrew; pre-built binaries for macOS/Linux
- **Stars/Activity:** ~2,500 stars; last release v0.15.2 (December 2025);
  actively maintained
- **Windows:** No -- "zk was not tested on Windows." No Windows binaries
  provided.
- **Data format:** Plain markdown files with YAML frontmatter; supports
  wikilinks, hashtags, colon-separated tags
- **Git-friendly:** Yes -- plain markdown files
- **Workflow fit:** STRONG for building a knowledge base, but NO WINDOWS SUPPORT
  is a dealbreaker. The LSP integration is elegant (works with VS Code, Neovim).
  Template system and link graph features are powerful. If Windows support is
  added or WSL is acceptable, this would be a top pick.
- **Confidence:** HIGH (well-maintained, but Windows incompatibility lowers
  practical confidence)

### Obsidian CLI (Official)

- **What:** Official command-line interface for Obsidian; remote-controls a
  running Obsidian app for opening notes, searching, appending content
- **URL:** https://obsidian.md/cli
- **Install:** Built into Obsidian 1.12+ (GA in v1.12.4, February 2026); no
  separate install
- **Stars/Activity:** Part of Obsidian (massive user base)
- **Windows:** Yes -- full Windows support (Obsidian is cross-platform)
- **Data format:** Markdown files in Obsidian vault
- **Git-friendly:** Yes -- Obsidian vaults are just folders of markdown files
- **Workflow fit:** GOOD if already using Obsidian. The CLI is a "remote
  control" for the running app, not a standalone headless tool. Could enable
  quick note capture from terminal that flows into a full knowledge management
  system. Wikilink rewriting on file moves is powerful. However, requires
  Obsidian running.
- **Confidence:** HIGH (official tool, backed by large company)

---

## Category 4: Bookmark/Link Managers

### Buku

- **What:** Powerful command-line bookmark manager with search, tagging,
  encryption, and browser import/export
- **URL:** https://github.com/jarun/buku
- **Install:** `pip install buku`; package managers on Linux; Windows via pip
- **Stars/Activity:** ~7,100 stars; last commit December 2024; actively
  maintained
- **Windows:** Yes -- Python-based, uses `clip` for clipboard on Windows
- **Data format:** SQLite database; import/export to HTML, Markdown, JSON, Org,
  RSS/Atom
- **Git-friendly:** Partial -- SQLite is binary (not diffable), but can export
  to markdown/JSON for git tracking
- **Workflow fit:** GOOD for managing reference links and documentation URLs.
  The markdown export could feed into existing docs. Privacy-focused (no
  tracking/analytics). Import from Firefox/Chrome is useful. However, SQLite
  storage isn't inherently git-friendly; would need export workflow.
- **Confidence:** HIGH

### nb (bookmarking feature)

- **What:** nb includes a built-in bookmark manager alongside notes (see nb
  entry above)
- **URL:** https://github.com/xwmx/nb
- **Data format:** Markdown bookmark files with Internet Archive integration
- **Git-friendly:** Yes
- **Workflow fit:** If using nb for notes, bookmarks come free. Avoids another
  tool.
- **Confidence:** HIGH

---

## Category 5: Time Tracking

### Watson

- **What:** CLI time tracker; start/stop timers on projects with tags; generate
  reports in text/CSV/JSON
- **URL:** https://github.com/jazzband/Watson
- **Install:** `pip install td-watson`; Homebrew on macOS
- **Stars/Activity:** ~2,500 stars; MIT license; maintained by Jazzband
  collective
- **Windows:** Yes -- Python-based, cross-platform
- **Data format:** JSON frames file
- **Git-friendly:** Yes -- JSON file can be committed
- **Workflow fit:** GOOD for tracking time on SoNash sessions, debugging,
  feature work. The project+tag model maps well to existing workflow concepts.
  Reports could feed into session-end metrics. Simple start/stop model is
  low-friction.
- **Confidence:** HIGH

### Timetrap

- **What:** Simple command-line time tracker with natural language time parsing
  and multiple export formats
- **URL:** https://github.com/samg/timetrap
- **Install:** `gem install timetrap` (Ruby)
- **Stars/Activity:** ~1,500 stars; last commit January 2025; MIT license
- **Windows:** Partial -- Ruby-based, may work but not explicitly supported
- **Data format:** SQLite database; export to CSV, iCal, JSON, text
- **Git-friendly:** No -- SQLite is binary
- **Workflow fit:** Less suitable than Watson due to SQLite storage and Ruby
  dependency. Natural language time parsing is nice but not critical.
- **Confidence:** MEDIUM

---

## Category 6: Markdown Tools (Rendering/Reading)

### Glow

- **What:** Terminal-based markdown reader with syntax highlighting, TUI mode
  for browsing, and stash/collection features
- **URL:** https://github.com/charmbracelet/glow
- **Install:** `scoop install glow`, `winget install charmbracelet.glow`,
  Chocolatey, or Go install
- **Stars/Activity:** ~23,900 stars; last release v2.1.1 (May 2025); MIT license
- **Windows:** Yes -- full support via Scoop, Winget, Chocolatey
- **Data format:** Reads standard markdown files
- **Git-friendly:** N/A (reader, not a data store)
- **Workflow fit:** EXCELLENT complement to existing workflow. Renders
  ROADMAP.md, SESSION_CONTEXT.md, and any markdown docs beautifully in terminal.
  TUI mode lets you browse all project markdown files interactively. Could
  improve how session context and planning docs are reviewed. Zero data format
  concerns since it just reads existing files.
- **Confidence:** HIGH

---

## Category 7: Snippet Managers

### Pet

- **What:** Simple CLI snippet manager; store, search, tag, and execute command
  snippets with fuzzy finding
- **URL:** https://github.com/knqyf263/pet
- **Install:** Go binary; Homebrew on macOS; binary releases
- **Stars/Activity:** ~5,200 stars; last commit December 2024; MIT license
- **Windows:** Partial -- Go binary available but no explicit Windows docs
- **Data format:** TOML file (`snippet.toml`)
- **Git-friendly:** Yes -- TOML is plain text
- **Workflow fit:** USEFUL for storing frequently-used git commands, Firebase
  CLI commands, deployment scripts, and complex npm run commands. Sync via
  GitHub Gists. Parameter support (`<param=default>`) is handy for templated
  commands. Complements rather than replaces existing workflow.
- **Confidence:** MEDIUM

---

## Category 8: CLI Kanban Boards

### Cainban

- **What:** CLI kanban board with TUI and MCP protocol support for AI assistants
  (Claude Desktop, Amazon Q)
- **URL:** https://cainban.com/
- **Install:** Via package manager or binary
- **Stars/Activity:** New project (2025)
- **Windows:** Unknown
- **Data format:** Unknown (likely JSON or SQLite)
- **Git-friendly:** Unknown
- **Workflow fit:** INTERESTING due to MCP integration -- could theoretically
  integrate with Claude Code's MCP servers. But too new and unproven to
  recommend.
- **Confidence:** LOW

### kanban.bash

- **What:** Commandline ASCII kanban board; CSV-based, scriptable, with
  statistics
- **URL:** https://github.com/coderofsalvation/kanban.bash
- **Install:** Bash script (single file)
- **Stars/Activity:** Small project
- **Windows:** Yes -- bash script works in Git Bash
- **Data format:** CSV files
- **Git-friendly:** Yes -- CSV is plain text
- **Workflow fit:** Lightweight kanban that stores data in CSV. Could visualize
  ROADMAP.md items as a board. But the existing markdown-based tracking may
  already be sufficient.
- **Confidence:** LOW

---

## Recommendations: Best Fit for SoNash Workflow

### Tier 1: Strong Recommend (high value, low friction)

| Tool       | Why                                                                              | Install Effort       |
| ---------- | -------------------------------------------------------------------------------- | -------------------- |
| **Glow**   | Render existing markdown docs beautifully in terminal; zero data migration       | `scoop install glow` |
| **dstask** | Git-native task tracking with markdown notes; mirrors existing workflow patterns | Download Go binary   |
| **jrnl**   | Quick session logging from CLI; plain text, git-friendly                         | `pip install jrnl`   |

### Tier 2: Worth Evaluating

| Tool       | Why                                          | Caveat                                                            |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------- |
| **nb**     | All-in-one notes + bookmarks + wiki + search | Windows support via MSYS only; may overlap with existing workflow |
| **Watson** | Time tracking for sessions and tasks         | Another dependency; value depends on whether time data is useful  |
| **Pet**    | Store complex/frequent CLI commands          | Niche use case; Git Bash compat unclear                           |
| **Buku**   | Reference link management                    | SQLite storage requires export for git tracking                   |

### Tier 3: Watch / Niche

| Tool             | Why                                         | Caveat                               |
| ---------------- | ------------------------------------------- | ------------------------------------ |
| **Obsidian CLI** | Full knowledge management if using Obsidian | Requires running Obsidian app        |
| **zk**           | Best-in-class Zettelkasten CLI              | No Windows support                   |
| **todo.txt**     | Ultra-simple plain text tasks               | May be too simple for existing needs |
| **Cainban**      | MCP-integrated kanban                       | Too new, unproven                    |

---

## Key Patterns Observed

1. **Git-friendly storage is the norm** in modern CLI tools. Most new tools
   store data as markdown, JSON, or plain text specifically because developers
   want to version-control everything.

2. **The Charmbracelet ecosystem** (Glow, Glamour, VHS, Mods) produces
   exceptionally polished Go-based CLI tools with first-class Windows support.
   Worth watching.

3. **Python-based tools** (jrnl, Watson, Buku) have the best cross-platform
   compatibility since Python works everywhere. Go-based tools (dstask, Glow,
   Pet) are a close second with single-binary distribution.

4. **nb is the Swiss Army knife** -- it does notes, bookmarks, todos,
   wiki-linking, search, and encryption in one tool. But this breadth may be
   more than needed and adds complexity.

5. **The gap** in the ecosystem is a tool that natively understands JSONL as a
   data format (most use JSON, TOML, YAML, or plain text). The existing SoNash
   JSONL workflow is somewhat unique.

---

## Sources

- [Taskwarrior](https://taskwarrior.org/) |
  [GitHub](https://github.com/GothenburgBitFactory/taskwarrior)
- [dstask](https://github.com/naggie/dstask)
- [Ultralist](https://github.com/gammons/ultralist)
- [todo.txt-cli](https://github.com/todotxt/todo.txt-cli) |
  [Official site](http://todotxt.org/)
- [nb](https://github.com/xwmx/nb) | [Official site](https://xwmx.github.io/nb/)
- [jrnl](https://github.com/jrnl-org/jrnl) | [Official site](https://jrnl.sh/)
- [notes-cli](https://github.com/rhysd/notes-cli)
- [zk](https://github.com/zk-org/zk)
- [Obsidian CLI](https://obsidian.md/cli)
- [Buku](https://github.com/jarun/buku)
- [Watson](https://github.com/jazzband/Watson)
- [Timetrap](https://github.com/samg/timetrap)
- [Glow](https://github.com/charmbracelet/glow)
- [Pet](https://github.com/knqyf263/pet)
- [Cainban](https://cainban.com/)
- [kanban.bash](https://github.com/coderofsalvation/kanban.bash)
- [Taskell](https://github.com/smallhadroncollider/taskell)
- [Journalot](https://journalot.dev/)
- [Medevel: 27 CLI Task Management Apps](https://medevel.com/tasks-cli-279/)
- [Slant: Best CLI Todo Managers 2026](https://www.slant.co/topics/1783/~best-command-line-to-do-list-manager)
- [Terminal Trove: Markdown Tools](https://terminaltrove.com/categories/markdown/)
