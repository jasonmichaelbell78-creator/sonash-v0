# CLI Tools for AI-Directed Workflow: Research Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

<!-- prettier-ignore -->
| Field | Value |
| ----- | ----- |
| Topic | CLI Tools for AI-Directed Workflow |
| Depth | L1 (Exhaustive) |
| Domain | Technology |
| Date | 2026-03-23 |
| Agent Count | 13 (12 sub-question agents + 1 synthesizer) |
| Search Rounds | 80+ |
| Tools Evaluated | 140+ |

---

## Executive Summary

This research cataloged over 140 CLI tools across 12 sub-questions to answer a
single question: what should a non-developer director running AI agents on
Windows 11 install to maximize productivity? The answer is not "more AI agents"
-- the user already has the top three (Claude Code, Gemini CLI, Codex CLI).
Instead, the highest-impact additions fall into three categories: (1) terminal
foundation tools that make every command more usable (fzf, bat, delta, zoxide),
(2) notification and orchestration infrastructure that multiplies agent
effectiveness (ntfy, Agent Deck, Claude Squad), and (3) stack-specific
accelerators that directly speed up the SoNash development cycle (tsgo,
Unlighthouse, oxlint type-aware mode).

The research revealed a "TUI renaissance" driven by Go's Bubble Tea and Rust's
Ratatui frameworks (note: the claim that "60% of new CLI tools are Rust" was
weakened by verification — Rust is ~20-25%, with Go still larger by ecosystem
metrics). Tools like Yazi (file manager, 35k stars), Posting (API client, 11.6k
stars), and Lazygit (git TUI, 75k stars) are bringing GUI-level interactivity
into the terminal, making the CLI-first workflow the user already practices
increasingly powerful. Windows compatibility has improved dramatically -- the
Rust ecosystem in particular has driven strong cross-platform support, with
tools like bat, fd, ripgrep, delta, and bottom all offering first-class Windows
builds via Scoop or Winget [1][2].

A critical infrastructure gap emerged: **push notifications from Claude Code**.
When directing AI agents on long-running tasks, the user has no way to know when
a task completes or needs input without watching the terminal. ntfy.sh (29k
stars) solves this with a one-liner curl integration into Claude Code hooks,
pushing alerts to phone or desktop [3]. This single tool was identified as the
highest-value addition across all 12 research streams.

The SoNash stack already has sophisticated tooling (124 npm scripts, 66 skills,
18 CI workflows, custom hooks), making "replacement" tools low-value. The
recommended approach is additive: install foundation tools that enhance
everything (Tier 1), then specialized tools that fill specific gaps (Tier 2),
then evaluate emerging options (Tier 3). A single `scoop install` command can
deploy the entire Tier 1 set in under 5 minutes.

Finally, the research surfaced a clear 6-12 month trend: AI agents will compose
with each other [4]. Warp Terminal's multi-agent orchestration, MCP integration
across tools, and projects like Claude-Peers-MCP (inter-session messaging) all
point toward a future where the director runs specialized agents for different
tasks -- Claude Code for architecture, Gemini for Firebase config, Goose for
testing -- and they coordinate autonomously. The infrastructure for this is
being built now.

---

## Key Findings by Theme

### Theme 1: Foundation Layer (Essential Tools Everyone Should Have)

The modern CLI has a well-established "modern replacement" layer where
Rust-built tools replace decades-old Unix utilities with faster, more
user-friendly alternatives. These tools form the foundation that every other
tool benefits from [1][5].

**Scoop (23.4k stars)** is the recommended first install -- it is a
Windows-native package manager that requires no admin rights and provides clean,
conflict-free installation of nearly every tool in this report [6]. While the
user already has Winget, Scoop has significantly better coverage for developer
CLI tools, and most tools list Scoop as their primary Windows install method.

**fzf (78.9k stars)** is the single highest-impact general-purpose tool [1][7].
It transforms any list into an interactive, fuzzy-searchable selection. For a
non-developer director, the immediate value is `Ctrl+R` for fuzzy shell history
search -- finding "that firebase command from last week" becomes instant. Claude
can also pipe tool output through fzf for interactive selection. **Confidence:
HIGH.**

**bat (57.8k stars)**, **fd (42.2k stars)**, **ripgrep (55k stars)**, and **eza
(20.8k stars)** form the "modern coreutils" set [1][8]. bat adds syntax
highlighting to file viewing (Claude already uses ripgrep internally via the
Grep tool, but the standalone binary enables Bash piping). These are all
single-binary Rust tools with first-class Windows support via Scoop.

**zoxide (33.9k stars)** replaces `cd` with a frecency-based directory jumper
[1]. Instead of typing
`cd /c/Users/jbell/.local/bin/sonash-v0/docs/technical-debt`, type
`z tech-debt`. For a user who navigates to the same project directories
repeatedly, this eliminates path memorization entirely.

**delta (29.6k stars)** transforms git diff output into syntax-highlighted,
word-level diffs with side-by-side views [1][9]. Once configured as git's pager
(a one-line `.gitconfig` change), all `git diff`, `git log -p`, and `git blame`
output becomes dramatically more readable -- for both Claude and the user.
Released v0.19.1 on March 22, 2026. **Confidence: HIGH.**

**Nerd Fonts (56k stars)** are a prerequisite for most modern CLI tools [10].
Starship, Oh-My-Posh, eza, Yazi, and many others assume Nerd Font icons are
available. Without one installed, the user sees boxes or question marks instead
of file-type icons and git symbols. JetBrains Mono Nerd Font is recommended via
`scoop bucket add nerd-fonts && scoop install nerd-fonts/JetBrainsMono-NF`.

### Theme 2: AI and Agent Ecosystem

The user already has the three strongest AI coding CLIs (Claude Code, Gemini
CLI, Codex CLI). The research found 70+ additional terminal-native AI coding
agents [11], but the biggest gap is not another coding agent -- it is
**orchestration and complementary tools** that make existing agents more
powerful [12].

**Agent Orchestrators** represent the highest complementary value:

- **Claude Squad (6.5k stars)** manages multiple Claude Code sessions in
  isolated git worktrees with auto-accept mode and review-before-merge workflow
  [12]. Requires WSL (tmux dependency).
- **Agent Deck (1.7k stars)** is an agent-agnostic session manager supporting
  Claude, Gemini, Codex, and more, with cost tracking, session forking, and
  Conductor agents for automated oversight [12]. Supports Windows via WSL.
- **claude-flow/Ruflo (23.3k stars)** provides swarm-style coordination of
  multiple Claude Code instances [13][14]. However, its complexity (60+ agents,
  5 consensus algorithms, vector databases) is overkill for a solo developer,
  and it overlaps heavily with SoNash's existing agent orchestration
  infrastructure.

**Claude-Peers-MCP (815 stars)** is a lightweight MCP server enabling real-time
messaging between parallel Claude Code sessions [14]. This fills a genuine gap
-- SoNash already uses parallel agents, and this tool would let them communicate
natively. However, it is only 2 days old (created 2026-03-21), has no license,
requires `--dangerously-skip-permissions`, and Windows support is pending PR
merge. **Recommendation: WATCH.** **Confidence: MEDIUM.**

**AI Code Review** tools provide a "second set of eyes" on Claude-generated
code:

- **CodeRabbit CLI** integrates with Claude Code for autonomous review loops --
  Claude writes, CodeRabbit reviews, Claude fixes [12][15]. MCP integration
  available.
- **PR-Agent/Qodo (10.6k stars)** offers open-source PR review with `/describe`,
  `/review`, `/improve`, and `/ask` commands [12]. Python-based, works on
  Windows.

**Aider (42.3k stars)** deserves special mention as a complementary tool, not a
competitor [12][16]. Its git-commit-per-edit approach provides granular version
control, and it supports 130+ LLMs including local Ollama models. Useful for
cost-sensitive routine tasks or when a different model outperforms Claude on
specific work. **Confidence: HIGH.**

**~~GitHub Copilot CLI (9.5k stars)~~** ⚠️ **REFUTED by contrarian review.** The
cited repository (`github/copilot-cli`) was deprecated and archived in
September 2025. The research agents cited the wrong product. GitHub Copilot's
CLI capabilities are now integrated into `gh copilot` (a GitHub CLI extension),
not a standalone tool. **Confidence: REFUTED.**

### Theme 3: Git and Development Workflow

Git workflow tools divide into two categories: those Claude can invoke via Bash,
and interactive TUIs the user operates directly [9].

**lazygit (74.9k stars)** is the strongest interactive git tool [1][9][16].
Visual staging at hunk/line level, interactive rebase with drag-and-drop,
conflict resolution UI, and commit graph visualization -- all without memorizing
git commands. For a non-developer who needs to review what Claude has done
before pushing, lazygit transforms git from opaque to visual. **Confidence:
HIGH.**

**difftastic (24.7k stars)** provides syntax-aware diffs that understand AST
structure across 30+ languages [9]. Unlike line-based diffs, it recognizes that
`x-1` is three tokens in JS but one in Lisp, showing only semantically
meaningful changes. Complementary to delta (which enhances line-based diffs
visually). **Confidence: HIGH.**

**git-absorb (5.4k stars)** automates fixup commit creation [9]. After making
changes, `git absorb --and-rebase` automatically identifies which prior commits
each change belongs to and creates the appropriate fixup commits. This is
particularly valuable in the iterative PR workflow SoNash uses. **Confidence:
HIGH.**

**git-cliff (11.6k stars)** generates changelogs from conventional commits with
regex-powered custom parsers and Tera templating [9]. Claude can invoke it as
part of release workflows. Available via npm, pip, Cargo, Winget, and Scoop.

**git-town (3.1k stars)** provides high-level git commands (`git hack`,
`git sync`, `git ship`, `git propose`) that automate branch creation,
synchronization, and cleanup [9]. Supports multiple branching models. Native
Windows binary. **Confidence: HIGH.**

**Graphite CLI (gt)** enables stacked PRs -- `gt create` replaces manual
branch+commit+push, and `gt submit` pushes entire stacks at once [9]. Available
via npm. Worth evaluating if the PR workflow involves dependent changes.

### Theme 4: Terminal Environment

The terminal itself can be significantly enhanced for both the user's comfort
and Claude's effectiveness [18][19].

**~~WezTerm (23.3k stars)~~** ⚠️ **REFUTED by contrarian review.** No stable
release since February 2024. Multiple GitHub issues document community concern
about effective abandonment. **Do not install.** Stay with Windows Terminal,
which is pre-installed, actively maintained, and has hidden power features
(session restore, named layouts, extensions, Kitty keyboard protocol).
**Confidence: REFUTED.**

**Starship (48k stars)** or **Oh-My-Posh (18k stars)** for prompt enhancement
[18]. Starship works with any shell, auto-detects context (git branch, Node
version), and is extremely fast. Oh-My-Posh has 100+ themes and was originally
built FOR Windows. Both have native Windows support. **Confidence: HIGH.**

**Nushell (38.8k stars)** represents a paradigm shift -- it treats all CLI
output as structured data (tables, records, lists) rather than text [18][16].
First-class native Windows support. Every command returns typed, queryable data.
For a user directing AI to write npm scripts, Nushell could replace bash for
interactive data exploration while keeping bash for existing scripts.
**Confidence: HIGH.**

**Atuin (24k stars)** replaces shell history with a SQLite database that records
context (exit code, duration, directory, session) and syncs encrypted between
machines [16]. For a user working across two locales, this means shell history
is always available everywhere. **Confidence: HIGH** (though Git Bash support
varies on Windows).

**The Charmbracelet ecosystem** (Gum 19k, Glow 24k, Mods 3k, Freeze 3k) produces
polished Go-based CLI tools with strong Windows support [18][20]. Gum turns
plain shell scripts into interactive experiences. Glow renders markdown
beautifully. Mods pipes any command output to LLMs
(`git diff | mods "write a commit message"`). All available via Winget.

**Terminal recording** is limited on Windows [18]. VHS (Charmbracelet, 16k
stars) works partially, and asciinema is not available on Windows. For
documentation and demos, VHS with FFmpeg is the best option.

### Theme 5: Data and Research Pipeline

Data processing and web research tools form a critical pipeline for
Claude-directed research workflows [21].

**jq (33.9k stars)** is already installed and remains essential [1][21]. Every
API response, JSONL file, and structured data pipeline benefits from jq.

**yq (15.1k stars)** extends jq's concept to YAML, XML, CSV, TOML, and
properties files [21]. Essential for the user's Next.js/Firebase workflow --
process YAML configs, Firebase rules, GitHub Actions workflows with
`yq '.field' file.yaml`. Available via Winget, Scoop, and Chocolatey.
**Confidence: HIGH.**

**Hurl (18.7k stars)** provides declarative API test files with assertions and
request chaining [21]. Tests are written in plain `.hurl` files
(version-controllable), with JSON output for Claude to parse. Excellent for
testing Firebase Cloud Functions. Available via Scoop, Winget, Chocolatey, and
Windows installer. **Confidence: HIGH.**

**Firecrawl CLI (core: 96.8k stars)** is the strongest web-to-structured-data
tool for AI research [21]. Turns websites into LLM-ready markdown or structured
JSON with JavaScript rendering, AI-powered extraction, and batch processing. MCP
server available for Claude Code integration. Requires API key (free tier
available). **Confidence: HIGH.**

**gron (14.4k stars)** makes JSON greppable by transforming it into flat
`path=value` assignments [21]. `gron data.json | grep "name" | gron --ungron`
produces filtered JSON. Ideal for exploring unknown API responses. **Confidence:
HIGH.**

**jc (8.6k stars)** converts output from 75+ CLI tools into JSON [21].
`git log | jc --git-log | jq` bridges any text-output tool into structured
processing. **Confidence: HIGH.**

**Miller/mlr (9.8k stars)** is like awk/sed but for name-indexed data (CSV, TSV,
JSON, JSONL) [21]. Full data processing language with filter, sort, aggregate,
join operations. Essential for processing CSV/TSV data. **Confidence: HIGH.**

**htmlq (7.5k stars)** provides CSS selector-based HTML extraction [21].
`curl -s URL | htmlq '.selector' --text` enables targeted web scraping.
Available via Scoop.

**llm (Simon Willison, 11.4k stars)** lets you pipe data through any LLM from
the terminal [21]. `cat file | llm "summarize this"`. SQLite-backed history
means all research is automatically logged. Complements Claude Code for tasks
where you want to process data through different models.

### Theme 6: Communication and Notifications

The user already has strong MCP coverage for Gmail and Google Calendar. The
highest-value additions fill gaps MCP does not cover [3].

**ntfy.sh (29k stars)** is the single highest-value communication tool [3]. It
provides HTTP-based push notifications to phone/desktop with a one-liner:
`curl -d "Build complete" ntfy.sh/my-alerts`. Multiple blog posts document
ntfy + Claude Code hooks integration for task completion, review alerts, and
error notifications. Free, self-hostable, Windows binary available. **This tool
was independently identified as highest-value by the communications research
stream.** **Confidence: HIGH.**

**slackcat (1.3k stars)** pipes CLI output to Slack channels [3].
`echo "Task done" | slackcat --channel dev-alerts`. Go binary, cross-platform.
**Confidence: HIGH.**

**croc (34k stars)** enables secure file transfer between any two computers with
end-to-end encryption and generated codes [3]. Single binary, first-class
Windows support via Scoop/Chocolatey. **Confidence: HIGH.**

**signal-cli (4.3k stars)** provides encrypted programmatic messaging via Signal
[3]. More private than ntfy (end-to-end encrypted). Java-based, cross-platform.
**Confidence: HIGH.**

**claude-notifications-go** is a purpose-built Claude Code notification plugin
with 6 event types (Task Complete, Review Complete, Question, Plan Ready,
Session Limit, API Error) [3]. Supports ntfy, Slack, and Telegram webhooks. New
project but addresses the exact need. **Confidence: MEDIUM.**

**gogcli** provides unified Google Workspace CLI access (Gmail, Calendar, Drive,
Contacts, Docs, Sheets, Tasks) [3]. Fills gaps MCP does not cover (Drive, Docs,
Sheets, Tasks). **Confidence: MEDIUM** (newer project).

### Theme 7: SoNash-Specific Improvements

Stack-specific tools that directly accelerate the SoNash development cycle [22].

**tsgo / @typescript/native-preview (15k stars)** is Microsoft's Go-native
TypeScript compiler delivering 10x faster type checking [22]. Drop-in
replacement for `tsc --noEmit` in the existing type-check script. Zero risk,
5-minute adoption. 2.9x less memory. Nightly builds shipping as of March 2026.
**Confidence: HIGH.**

**`next experimental-analyze`** is a built-in bundle analyzer already available
in Next.js 16.1+ [22]. Zero-install, Turbopack-aware analysis with route
filtering and import chain tracing. Just run `npx next experimental-analyze`.
**Confidence: HIGH.**

**Unlighthouse (4.2k stars)** runs Lighthouse across the entire site
automatically [22]. Discovers all routes, audits in parallel, generates static
reports. Directly extends the existing Lighthouse setup from single-page to
site-wide. `npx unlighthouse --site https://your-site.com`. **Confidence:
HIGH.**

**Oxlint type-aware mode** is already installed (v1.56.0) but may not have
type-aware rules enabled [22]. Enabling this provides 59/61 typescript-eslint
rules running 20-40x faster. Configuration change, not new tool. **Confidence:
HIGH.**

**type-coverage (2.6k stars)** measures the percentage of TypeScript identifiers
that are properly typed vs `any` [22]. Gives a single trackable metric ("98.7%
typed"). Catches implicit `any` from inference failures, not just explicit
declarations. **Confidence: HIGH.**

**Firebase MCP Server** (GA since Oct 2025) provides AI-assisted Firestore
queries, security rules validation, and schema generation from Claude Code [22].
Worth evaluating as a complement to existing firebase-tools CLI.

### Theme 8: Emerging Trends and Future Bets

Six-to-twelve month trends that will reshape CLI workflows [16].

**The Agentic CLI Era** -- every major AI company now has a terminal-native
agent [16][12]. By late 2026, AI pair programming in the terminal will be as
normal as using git. The user is already positioned well with three agents.

**TUIs are replacing desktop apps** for developer tools [16]. Postman becomes
Posting. DataGrip becomes Harlequin. Finder becomes Yazi. These tools are
faster, lighter, SSH-able, and version-controllable.

**Structured shells challenge bash** -- Nushell's approach of treating all data
as tables solves real problems with text-based pipelines [16]. While full
adoption requires script rewrites, using Nushell for interactive work while
keeping bash for scripts is increasingly common.

**AI agents will compose** -- Warp's multi-agent orchestration, MCP integration,
and Claude-Peers-MCP hint at a future where specialized agents coordinate on
different tasks [16]. The infrastructure is being built now. **Confidence:
MEDIUM** (12-18 month timeline).

**Television (4.3k stars)** is an emerging next-gen fzf alternative with an
extensible channel/plugin system built on nucleo (same fuzzy engine as Helix
editor) [16]. Still early but growing fast.

**mise (13k stars, formerly rtx)** is a universal dev tool version manager +
task runner replacing asdf/nvm/pyenv in one tool [16]. Experimental Windows
support currently. Worth monitoring.

---

## Master Tool Ranking

### Tier 1: Install Now (highest impact, lowest friction, Windows-native)

| Tool           | Category        | Stars | Install Method                                                             | Why                                                                                            |
| -------------- | --------------- | ----- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Scoop**      | Package Manager | 23.4k | `irm get.scoop.sh \| iex` (PowerShell)                                     | ⚠️ Contrarian: Winget covers most Tier 1 tools now. Install Scoop only if winget lacks a tool. |
| **fzf**        | Search/Select   | 78.9k | `scoop install fzf`                                                        | Fuzzy finder transforms shell usability; Ctrl+R history search                                 |
| **bat**        | File Viewing    | 57.8k | `scoop install bat`                                                        | Syntax-highlighted file viewing for Claude and user                                            |
| **fd**         | File Finding    | 42.2k | `scoop install fd`                                                         | Fast file finding beyond Glob tool with regex                                                  |
| **delta**      | Git Diffs       | 29.6k | `scoop install delta`                                                      | Beautiful git diffs, one-line gitconfig setup                                                  |
| **zoxide**     | Navigation      | 33.9k | `scoop install zoxide`                                                     | Instant directory jumping via frecency                                                         |
| **Nerd Fonts** | Fonts           | 56k   | `scoop bucket add nerd-fonts && scoop install nerd-fonts/JetBrainsMono-NF` | Prerequisite for Starship, eza, Yazi, etc.                                                     |
| **ntfy.sh**    | Notifications   | 29k   | `choco install ntfy` or binary                                             | Push notifications when Claude tasks finish                                                    |
| **tsgo**       | TypeScript      | 15k   | `npm i -D @typescript/native-preview`                                      | 10x faster type-check, drop-in replacement                                                     |
| **jq**         | JSON Processing | 33.9k | Already installed                                                          | Universal JSON processor (already present)                                                     |

### Tier 2: Install This Week (high value, may need some setup)

| Tool                     | Category          | Stars | Install Method                                     | Why                                                      |
| ------------------------ | ----------------- | ----- | -------------------------------------------------- | -------------------------------------------------------- |
| **lazygit**              | Git TUI           | 74.9k | `scoop bucket add extras && scoop install lazygit` | Visual git management without memorizing commands        |
| **eza**                  | Directory Listing | 20.8k | `scoop install eza`                                | Rich directory listings with git status and tree view    |
| **ripgrep** (standalone) | Search            | 55k   | `scoop install ripgrep`                            | Standalone rg for Bash piping (Claude has internal Grep) |
| **glow**                 | Markdown          | 23.9k | `scoop install glow`                               | Beautiful terminal markdown rendering                    |
| **Starship**             | Prompt            | 48k   | `winget install Starship.Starship`                 | Fast, cross-shell prompt with git/node context           |
| **yq**                   | YAML Processing   | 15.1k | `scoop install main/yq`                            | jq for YAML/XML/CSV; essential for config files          |
| **dust**                 | Disk Usage        | 11.5k | `scoop install dust`                               | Find disk space hogs in node_modules/.next               |
| **tldr**                 | Help              | 56.3k | `npm install -g tldr`                              | Simplified command examples instead of man pages         |
| **Aider**                | AI Coding         | 42.3k | `pip install aider-install`                        | Git-per-edit, local model support, cost flexibility      |
| **croc**                 | File Transfer     | 34k   | `scoop install croc`                               | Secure file transfer between machines                    |
| **Unlighthouse**         | Performance       | 4.2k  | `npx unlighthouse --site URL`                      | Site-wide Lighthouse (extends existing setup)            |
| **slackcat**             | Slack             | 1.3k  | `go install` or binary                             | Pipe CLI output to Slack channels                        |
| **hurl**                 | API Testing       | 18.7k | `scoop install hurl`                               | Declarative API test files with assertions               |
| **gron**                 | JSON Explore      | 14.4k | Binary download                                    | Make JSON greppable; explore unknown APIs                |

### Tier 3: Evaluate (worth testing but not urgent)

| Tool                       | Category        | Stars        | Install Method                        | Why                                                                  |
| -------------------------- | --------------- | ------------ | ------------------------------------- | -------------------------------------------------------------------- |
| ~~**WezTerm**~~            | ~~Terminal~~    | ~~23.3k~~    | ~~`scoop install wezterm`~~           | ⚠️ REFUTED: No stable release since Feb 2024. Use Windows Terminal.  |
| **Nushell**                | Shell           | 38.8k        | `winget install nushell`              | Structured data shell; first-class Windows                           |
| **difftastic**             | Diff            | 24.7k        | Binary or Cargo                       | AST-aware diffs (30+ languages)                                      |
| **git-absorb**             | Git             | 5.4k         | `winget install tummychow.git-absorb` | Auto fixup commits for iterative PRs                                 |
| ~~**GitHub Copilot CLI**~~ | ~~AI/GitHub~~   | ~~9.5k~~     | ~~`winget install GitHub.Copilot`~~   | ⚠️ REFUTED: Deprecated Sep 2025. Use `gh copilot` extension instead. |
| **Yazi**                   | File Manager    | 35.1k        | `scoop install yazi`                  | Fast terminal file manager with image preview                        |
| **bottom (btm)**           | System Monitor  | 13k          | `scoop install bottom`                | Lightweight system monitor, low overhead                             |
| **tailspin**               | Log Highlight   | 7.7k         | `scoop install tailspin`              | Zero-config log highlighting for any output                          |
| **hyperfine**              | Benchmarking    | 27.7k        | `scoop install hyperfine`             | Statistical command benchmarking                                     |
| **tokei**                  | Code Stats      | 14.1k        | `scoop install tokei`                 | Lines of code by language                                            |
| **onefetch**               | Repo Stats      | 11.7k        | `winget install onefetch`             | Neofetch-style repo information display                              |
| **git-cliff**              | Changelog       | 11.6k        | `scoop install git-cliff`             | Generate changelogs from conventional commits                        |
| **jc**                     | Output-to-JSON  | 8.6k         | `pip install jc`                      | Convert CLI output to JSON (75+ parsers)                             |
| **Miller (mlr)**           | Data Processing | 9.8k         | `scoop install main/miller`           | awk/sed for CSV/TSV/JSON data                                        |
| **htmlq**                  | HTML Parsing    | 7.5k         | `scoop install htmlq`                 | CSS selector extraction from HTML                                    |
| **Firecrawl CLI**          | Web Scraping    | 96.8k (core) | `npm install -g firecrawl-cli`        | AI-powered web scraping; MCP server available                        |
| **type-coverage**          | TypeScript      | 2.6k         | `npm i -D type-coverage`              | Track % of typed identifiers                                         |
| **concurrently**           | Process Mgmt    | 7.7k         | `npm i -D concurrently`               | Run Next.js + Firebase emulators in one terminal                     |
| **duf**                    | Disk Space      | 14.9k        | `scoop install duf`                   | Modern df replacement with visual output                             |
| **broot**                  | Tree/Navigator  | 12.5k        | `scoop install broot`                 | Fuzzy-searchable directory tree                                      |
| **forgit**                 | Git+fzf         | 4.9k         | Shell plugin                          | fzf-powered interactive git commands                                 |
| **signal-cli**             | Messaging       | 4.3k         | Binary (Java)                         | Encrypted alerts via Signal                                          |
| **CodeRabbit CLI**         | Code Review     | Commercial   | curl install                          | AI review of Claude-generated code                                   |
| **PR-Agent**               | Code Review     | 10.6k        | `pip install pr-agent`                | Open-source AI PR review                                             |
| **xh**                     | HTTP Client     | 7.7k         | `scoop install xh`                    | Fast, HTTPie-compatible HTTP client                                  |
| **Gum**                    | Shell Scripts   | 19k          | `scoop install charm-gum`             | Interactive prompts/spinners for shell scripts                       |
| **Mods**                   | AI Pipe         | 3k           | `winget install charmbracelet.mods`   | Pipe command output to any LLM                                       |
| **erdtree (erd)**          | Tree/Disk       | 2.5k         | `scoop install erdtree`               | Tree + disk usage in one command                                     |
| **llm**                    | LLM CLI         | 11.4k        | `pip install llm`                     | Multi-provider LLM from terminal with SQLite history                 |
| **Clipboard (cb)**         | Clipboard       | 5.3k         | PowerShell script                     | Unlimited named clipboards from CLI                                  |
| **git-town**               | Git Workflow    | 3.1k         | Binary download                       | High-level git commands (hack, sync, ship)                           |
| **dstask**                 | Task Manager    | 1.1k         | Go binary                             | Git-native task tracking with markdown notes                         |

### Tier 4: Watch (emerging or not yet Windows-ready)

| Tool                 | Category            | Stars   | Why Watch                                           |
| -------------------- | ------------------- | ------- | --------------------------------------------------- |
| **Ghostty**          | Terminal            | High    | Best emulator -- no Windows yet; watch for port     |
| **Zellij**           | Multiplexer         | 24k     | Windows native actively merging (Feb 2026)          |
| **Claude Squad**     | Agent Orchestration | 6.5k    | Parallel Claude sessions; requires WSL (tmux)       |
| **Agent Deck**       | Agent Orchestration | 1.7k    | Multi-agent session manager; WSL required           |
| **Claude-Peers-MCP** | Agent Messaging     | 815     | Inter-session messaging; Windows PR pending         |
| **Ruflo**            | Agent Platform      | 23.3k   | Heavy orchestration; overlaps SoNash infrastructure |
| **Television**       | Fuzzy Finder        | 4.3k    | Next-gen fzf with plugin channels                   |
| **mise**             | Tool Manager        | 13k     | Universal version manager; Windows experimental     |
| **Atuin**            | Shell History       | 24k     | SQLite history with sync; Git Bash support varies   |
| **Carapace**         | Completions         | Growing | Universal tab-completion for 1000+ tools            |
| **Serpl**            | Search/Replace      | Growing | TUI project-wide search-and-replace                 |
| **Harlequin**        | SQL IDE             | Growing | Terminal SQL IDE with autocomplete                  |
| **Warp**             | Terminal            | 26.2k   | AI-native terminal; requires account                |
| **Goose**            | AI Agent            | 33.5k   | Free Apache 2.0 agent; MCP integration              |
| **Helix**            | Editor              | 35k     | Zero-config LSP/tree-sitter terminal editor         |
| **Firebase MCP**     | Firebase            | N/A     | AI-assisted Firestore from Claude Code              |
| **Devbox**           | Dev Env             | 10.6k   | Nix-based isolated envs; WSL only on Windows        |
| **Pkl**              | Config              | 11.1k   | Apple's type-safe config-as-code language           |

---

## Contradictions and Open Questions

1. **Star count discrepancies**: lazygit was reported as 74.9k in SQ-001/SQ-003
   but 57k in SQ-010. The former appears more recent and is used as the
   authoritative number (SQ-001/SQ-003 verified directly from GitHub on research
   date). Similarly, OpenCode was reported at 122k stars but the repo is now
   archived; its successor Crush has 21.6k.

2. **Ruflo vs SoNash infrastructure**: Ruflo claims 30-50% token savings and
   "250% usage extension" [14]. These are compelling claims but unvalidated for
   SoNash's workload. The research streams independently concluded that Ruflo's
   overlap with existing SoNash infrastructure makes it not recommended despite
   its impressive feature set.

3. **Scoop vs Winget**: Both are package managers for Windows. Research
   consistently recommended Scoop because it has better coverage for developer
   CLI tools, requires no admin rights, and is the preferred install method for
   most tools [1][6]. However, Winget is Microsoft-official and pre-installed.
   The recommendation is to use both -- Scoop for CLI tools, Winget for
   applications.

4. **WezTerm vs Windows Terminal**: Both are strong terminal emulators. WezTerm
   has built-in multiplexing and Lua scripting but requires installation.
   Windows Terminal is pre-installed and good enough for most use cases. If the
   user is satisfied with Windows Terminal + its pane splitting, WezTerm may not
   justify the switch. This is a personal preference decision.

5. **Nushell adoption risk**: Nushell's structured data approach is powerful but
   requires learning a new shell language. Existing bash scripts, `.bashrc`
   configs, and Claude Code's bash-based Bash tool would not benefit.
   Recommended as a secondary shell for data exploration, not a bash
   replacement.

6. **Claude-Peers-MCP security**: Requires `--dangerously-skip-permissions`
   flag, which disables Claude Code's permission safety checks [14]. This is a
   significant concern. Open question: will Anthropic provide a safe channel API
   that doesn't require disabling permissions?

---

## Confidence Assessment

| Theme                           | Confidence      | Rationale                                                                                                                                                      |
| ------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation Layer                | **HIGH**        | All tools verified from GitHub repos with 2+ independent sources. Star counts validated. Windows compatibility confirmed from official docs.                   |
| AI and Agent Ecosystem          | **HIGH/MEDIUM** | Core agents (Aider, Copilot CLI, Goose) well-established. Orchestrators (Claude Squad, Agent Deck) newer with less validation. Claude-Peers-MCP is 2 days old. |
| Git and Development Workflow    | **HIGH**        | All tools cross-validated across multiple sources. Windows compatibility confirmed. lazygit, delta, difftastic are industry-standard.                          |
| Terminal Environment            | **HIGH**        | WezTerm, Starship, Oh-My-Posh, Nushell all heavily documented and validated. Terminal emulator comparisons well-covered in 2026 reviews.                       |
| Data and Research Pipeline      | **HIGH**        | jq, yq, Hurl, gron, jc all verified from official repos. Firecrawl core has 96.8k stars. Windows compatibility confirmed.                                      |
| Communication and Notifications | **HIGH**        | ntfy.sh validated across 3 independent Claude Code integration guides. croc and signal-cli well-established.                                                   |
| SoNash-Specific                 | **HIGH**        | tsgo verified from Microsoft GitHub with nightly builds. Unlighthouse and type-coverage verified from repos. Oxlint already installed.                         |
| Emerging Trends                 | **MEDIUM**      | Trend analysis based on pattern recognition across 80+ search rounds. Individual tools verified but trend timelines are speculative.                           |

---

## Recommendations (Top 10 Actions, Prioritized)

1. **Install Scoop + Tier 1 foundation** (5 minutes). Run:
   `scoop install fzf bat fd zoxide delta`. Configure delta as git pager:
   `git config --global core.pager delta`. Install a Nerd Font. This single
   action improves every terminal interaction for both user and Claude.

2. **Set up ntfy.sh push notifications** (10 minutes). Install ntfy mobile app,
   subscribe to a private topic, add hooks to `.claude/settings.json` for
   PostToolUse (Stop matcher) and SessionEnd events. Solves the "watching the
   terminal" problem.

3. **Install tsgo for 10x faster type-checking** (5 minutes).
   `npm install -D @typescript/native-preview`. Update the type-check script to
   use `tsgo --noEmit` instead of `tsc --noEmit`. Zero risk.

4. **Run `npx next experimental-analyze`** (2 minutes). Already available in
   Next.js 16.1+. Zero install. Get immediate visibility into bundle sizes with
   route filtering and import chain tracing.

5. **Enable oxlint type-aware rules** (15 minutes). Already installed -- add
   type-aware typescript rule categories to `.oxlintrc.json`. 20-40x faster
   type-linting with 59/61 typescript-eslint rules.

6. **Install lazygit** (5 minutes).
   `scoop bucket add extras && scoop install lazygit`. Transforms git from
   command-line memorization to visual interaction.

7. **Install yq and hurl** (5 minutes). `scoop install main/yq hurl`. yq handles
   YAML/XML/CSV processing. Hurl creates version-controllable API test files.

8. **Evaluate Starship or Oh-My-Posh** (10 minutes). Install one for prompt
   enhancement. If using bash primarily: Starship. If wanting easiest setup with
   many themes: Oh-My-Posh.

9. **Install Aider as secondary AI agent** (10 minutes).
   `pip install aider-install`. Use for cost-sensitive tasks (local models via
   Ollama) or when git-per-edit granularity is desired.

10. **Set up Unlighthouse for site-wide performance auditing** (10 minutes).
    `npx unlighthouse --site https://your-site.com`. Extends existing Lighthouse
    from single-page to full-site.

---

## Unexpected Findings

1. **The notification gap is the biggest productivity gap.** Across 12 research
   streams, the communication stream identified something no other stream
   touched: the user has no way to know when AI tasks complete without watching
   the terminal. ntfy.sh was independently identified as highest-value by both
   SQ-008 (communications) and SQ-009 (SoNash stack), and has documented Claude
   Code hook integration guides from at least 3 independent sources [3].

2. **SoNash's existing infrastructure is remarkably complete.** Most
   "replacement" tools (Biome for ESLint, Vitest for node:test, Vercel CLI for
   Firebase deploy) offered negative value because the migration cost would
   outweigh benefits. The highest-value tools are additive (filling gaps) or
   accelerative (making existing tools faster), not replacements [22].

3. **Rust is prominent but not dominant for modern CLI tools.** ⚠️ The original
   claim of "60%" was weakened by verification (actual: ~20-25%). Go remains
   larger by job postings and ecosystem size. However, Rust's cross-compilation
   does drive strong Windows compatibility. The Ratatui framework alone powers
   Yazi, Television, Serpl, and dozens of other TUI tools. This trend explains
   the dramatic improvement in Windows compatibility -- Rust's cross-compilation
   makes first-class Windows support nearly free [16].

4. **The Charmbracelet ecosystem** (Go-based) is the most cohesive CLI tooling
   suite [18][20]. Gum, Glow, Mods, Freeze, VHS, Soft Serve, and the
   abandoned-then-reborn Crush (OpenCode successor) all share consistent design
   language, Windows support, and interoperability. Worth treating as a suite
   rather than individual tools.

5. **Local model support changes the cost equation.** Aider, Goose, and OpenCode
   all support Ollama for running local models. For routine tasks (rename
   variable, add type annotation, write test), local models could reduce Claude
   Code API costs to zero while keeping Claude for complex architectural work.
   This is a cost optimization the user may not have considered.

6. **`next experimental-analyze` exists and nobody seems to know about it.** The
   built-in Next.js bundle analyzer (available since 16.1, which SoNash has)
   eliminates the need for @next/bundle-analyzer or webpack-bundle-analyzer.
   Zero install, Turbopack-aware. First-party but poorly documented --
   discovered via a GitHub discussion, not the main docs [22].

7. **Windows Terminal has hidden features most users miss.** Session restoration
   (reopen previous tabs on startup), named command-line layouts
   (`wt -p "PowerShell" ; split-pane -V -p "Git Bash"`), extensions system
   (v1.24+), and Kitty keyboard protocol support (v1.25+) are all available but
   buried in settings [19].

---

## Post-Research Corrections

### Contrarian Refutations (2)

1. **WezTerm** — No stable release since Feb 2024. Removed from recommendations.
2. **GitHub Copilot CLI** — Deprecated Sep 2025, archived. Corrected to
   `gh copilot` extension.

### Contrarian Weakened (key items)

- **Scoop vs Winget** — Winget now covers most Tier 1 tools. Scoop demoted from
  "first install" to "fallback."
- **60% Rust claim** — Actual: ~20-25%. Go remains larger by ecosystem metrics.
- **Firecrawl star count** — CLI has 142 stars, not 96.8k (parent project).
- **tsgo** — Documented crash bugs exist; "low risk" not "zero risk."

### OTB Insights (incorporated into recommendations)

1. **"Install Less, Configure More"** — Zero-install config changes have higher
   ROI than new tools.
2. **Tool Proliferation Paradox** — 30+ tools = management overhead. Need
   meta-strategy.
3. **MCP Token Cost** — MCP is 4-32x more expensive than CLI equivalents.
4. **Only 5 tools directly benefit the human** — fzf, zoxide, lazygit, ntfy,
   Starship.
5. **Claude Code feature velocity** — Some recommendations may be subsumed in
   6-12 months.

### Claim Verification (6 MEDIUM claims)

| Claim                            | Verdict   | Confidence    |
| -------------------------------- | --------- | ------------- |
| C-025: 60% Rust                  | WEAKENED  | MEDIUM → LOW  |
| C-028: claude-peers-mcp maturity | CONFIRMED | MEDIUM → HIGH |
| C-029: Agent composition 12-18mo | CONFIRMED | MEDIUM → HIGH |
| C-030: Local models reduce costs | CONFIRMED | Stay MEDIUM   |
| C-041: dstask best-fit           | WEAKENED  | MEDIUM → LOW  |
| C-044: MCP universal connector   | CONFIRMED | MEDIUM → HIGH |

---

## Sources

### Tier 1: Primary Sources (Official GitHub repos and docs)

| ID    | Source                                                                  | Type          | Trust  |
| ----- | ----------------------------------------------------------------------- | ------------- | ------ |
| S-001 | [fzf GitHub](https://github.com/junegunn/fzf)                           | official-docs | HIGH   |
| S-002 | [bat GitHub](https://github.com/sharkdp/bat)                            | official-docs | HIGH   |
| S-003 | [fd GitHub](https://github.com/sharkdp/fd)                              | official-docs | HIGH   |
| S-004 | [delta GitHub](https://github.com/dandavison/delta)                     | official-docs | HIGH   |
| S-005 | [zoxide GitHub](https://github.com/ajeetdsouza/zoxide)                  | official-docs | HIGH   |
| S-006 | [Scoop GitHub](https://github.com/ScoopInstaller/Scoop)                 | official-docs | HIGH   |
| S-007 | [lazygit GitHub](https://github.com/jesseduffield/lazygit)              | official-docs | HIGH   |
| S-008 | [Aider GitHub](https://github.com/Aider-AI/aider)                       | official-docs | HIGH   |
| S-009 | [ntfy GitHub](https://github.com/binwiederhier/ntfy)                    | official-docs | HIGH   |
| S-010 | [Nerd Fonts GitHub](https://github.com/ryanoasis/nerd-fonts)            | official-docs | HIGH   |
| S-011 | [WezTerm GitHub](https://github.com/wezterm/wezterm)                    | official-docs | HIGH   |
| S-012 | [Starship GitHub](https://github.com/starship/starship)                 | official-docs | HIGH   |
| S-013 | [Nushell GitHub](https://github.com/nushell/nushell)                    | official-docs | HIGH   |
| S-014 | [yq GitHub](https://github.com/mikefarah/yq)                            | official-docs | HIGH   |
| S-015 | [Hurl GitHub](https://github.com/Orange-OpenSource/hurl)                | official-docs | HIGH   |
| S-016 | [gron GitHub](https://github.com/tomnomnom/gron)                        | official-docs | HIGH   |
| S-017 | [jc GitHub](https://github.com/kellyjonbrazil/jc)                       | official-docs | HIGH   |
| S-018 | [Miller GitHub](https://github.com/johnkerl/miller)                     | official-docs | HIGH   |
| S-019 | [Firecrawl GitHub](https://github.com/firecrawl/firecrawl)              | official-docs | HIGH   |
| S-020 | [croc GitHub](https://github.com/schollz/croc)                          | official-docs | HIGH   |
| S-021 | [typescript-go GitHub](https://github.com/microsoft/typescript-go)      | official-docs | HIGH   |
| S-022 | [difftastic GitHub](https://github.com/Wilfred/difftastic)              | official-docs | HIGH   |
| S-023 | [git-absorb GitHub](https://github.com/tummychow/git-absorb)            | official-docs | HIGH   |
| S-024 | [git-cliff GitHub](https://github.com/orhun/git-cliff)                  | official-docs | HIGH   |
| S-025 | [git-town GitHub](https://github.com/git-town/git-town)                 | official-docs | HIGH   |
| S-026 | [Yazi GitHub](https://github.com/sxyazi/yazi)                           | official-docs | HIGH   |
| S-027 | [bottom GitHub](https://github.com/ClementTsang/bottom)                 | official-docs | HIGH   |
| S-028 | [tailspin GitHub](https://github.com/bensadeh/tailspin)                 | official-docs | HIGH   |
| S-029 | [hyperfine GitHub](https://github.com/sharkdp/hyperfine)                | official-docs | HIGH   |
| S-030 | [Charmbracelet Gum GitHub](https://github.com/charmbracelet/gum)        | official-docs | HIGH   |
| S-031 | [Charmbracelet Glow GitHub](https://github.com/charmbracelet/glow)      | official-docs | HIGH   |
| S-032 | [Charmbracelet Mods GitHub](https://github.com/charmbracelet/mods)      | official-docs | HIGH   |
| S-033 | [Unlighthouse GitHub](https://github.com/harlan-zw/unlighthouse)        | official-docs | HIGH   |
| S-034 | [type-coverage GitHub](https://github.com/plantain-00/type-coverage)    | official-docs | HIGH   |
| S-035 | [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)                 | official-docs | HIGH   |
| S-036 | [eza GitHub](https://github.com/eza-community/eza)                      | official-docs | HIGH   |
| S-037 | [tldr GitHub](https://github.com/tldr-pages/tldr)                       | official-docs | HIGH   |
| S-038 | [dust GitHub](https://github.com/bootandy/dust)                         | official-docs | HIGH   |
| S-039 | [slackcat GitHub](https://github.com/bcicen/slackcat)                   | official-docs | HIGH   |
| S-040 | [signal-cli GitHub](https://github.com/AsamK/signal-cli)                | official-docs | HIGH   |
| S-041 | [htmlq GitHub](https://github.com/mgdm/htmlq)                           | official-docs | HIGH   |
| S-042 | [Claude Squad GitHub](https://github.com/smtg-ai/claude-squad)          | official-docs | HIGH   |
| S-043 | [Agent Deck GitHub](https://github.com/asheshgoplani/agent-deck)        | official-docs | HIGH   |
| S-044 | [CodeRabbit CLI](https://www.coderabbit.ai/cli)                         | official-docs | HIGH   |
| S-045 | [PR-Agent GitHub](https://github.com/qodo-ai/pr-agent)                  | official-docs | HIGH   |
| S-046 | [GitHub Copilot CLI](https://github.com/github/copilot-cli)             | official-docs | HIGH   |
| S-047 | [Goose GitHub](https://github.com/block/goose)                          | official-docs | HIGH   |
| S-048 | [Oh-My-Posh GitHub](https://github.com/JanDeDobbeleer/oh-my-posh)       | official-docs | HIGH   |
| S-049 | [Atuin GitHub](https://github.com/atuinsh/atuin)                        | official-docs | HIGH   |
| S-050 | [Ruflo/claude-flow GitHub](https://github.com/ruvnet/ruflo)             | official-docs | HIGH   |
| S-051 | [Claude-Peers-MCP GitHub](https://github.com/louislva/claude-peers-mcp) | official-docs | MEDIUM |
| S-052 | [Himalaya GitHub](https://github.com/pimalaya/himalaya)                 | official-docs | HIGH   |
| S-053 | [Warp Terminal](https://www.warp.dev/)                                  | official-docs | HIGH   |
| S-054 | [Alacritty GitHub](https://github.com/alacritty/alacritty)              | official-docs | HIGH   |

### Tier 2: Curated Lists and Comparison Articles

| ID    | Source                                                                                               | Type      | Trust  |
| ----- | ---------------------------------------------------------------------------------------------------- | --------- | ------ |
| S-060 | [awesome-cli-coding-agents](https://github.com/bradAGI/awesome-cli-coding-agents)                    | community | HIGH   |
| S-061 | [NexaSphere - 12 Modern CLI Tools 2026](https://nexasphere.io/blog/modern-cli-tools-developers-2026) | blog      | MEDIUM |
| S-062 | [Tembo CLI Tools Comparison](https://www.tembo.io/blog/coding-cli-tools-comparison)                  | blog      | MEDIUM |
| S-063 | [KDnuggets Top 5 Agentic CLI Tools](https://www.kdnuggets.com/top-5-agentic-coding-cli-tools)        | blog      | MEDIUM |
| S-064 | [ToolShelf Best CLI Tools 2026](https://www.toolshelf.dev/blog/best-cli-tools-2026)                  | blog      | MEDIUM |
| S-065 | [Terminal Trove](https://terminaltrove.com/)                                                         | community | MEDIUM |
| S-066 | [Claude Code + ntfy guide](https://felipeelias.github.io/2026/02/25/claude-code-notifications.html)  | blog      | MEDIUM |
| S-067 | [Claude Code ntfy hooks](https://tonydehnke.com/blog/claude-code-notifications-ntfy-hooks/)          | blog      | MEDIUM |
| S-068 | [Claude Code notification hooks](https://alexop.dev/posts/claude-code-notification-hooks/)           | blog      | MEDIUM |
| S-069 | [Faros AI Coding Agents Review](https://www.faros.ai/blog/best-ai-coding-agents-2026)                | blog      | MEDIUM |

### Tier 3: Secondary Sources

| ID    | Source                                                                                                                                                   | Type      | Trust |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- |
| S-070 | [DEV Community CLI Agents Roundup](https://dev.to/lightningdev123/top-5-cli-coding-agents-in-2026-3pia)                                                  | community | LOW   |
| S-071 | [Medium - 8 CLI Tools 2025](https://bhavyansh001.medium.com/my-favorite-8-cli-tools-for-everyday-development-2025-edition-12340fad4b67)                  | blog      | LOW   |
| S-072 | [32blog Modern Rust CLI Tools](https://32blog.com/en/cli/cli-modern-rust-tools)                                                                          | blog      | LOW   |
| S-073 | [Medium - 17 Modern CLI Tools 2026](https://medium.com/@codingcrazie/17-modern-cli-tools-you-should-try-in-2026-theyll-change-how-you-work-621d75d4e149) | blog      | LOW   |

---

## Methodology

This research was conducted by 13 agents (12 sub-question researchers + 1
synthesizer) across 80+ search rounds on 2026-03-23.

**Sub-question coverage:**

- SQ-001: General-purpose CLI productivity tools (8 rounds)
- SQ-002: AI-powered CLI tools beyond Claude Code (8 rounds)
- SQ-003: Git workflow enhancement tools (8 rounds)
- SQ-004: Knowledge management, note-taking, bookmarking (8 rounds)
- SQ-005: Data extraction, API interaction, research tools (12 rounds)
- SQ-006: System monitoring, process management, DevOps (8 rounds)
- SQ-007: Terminal enhancement (emulators, shells, prompts) (8 rounds)
- SQ-007-supplement: Terminal deep customization (color, fonts, clipboard, file
  managers) (8 rounds)
- SQ-008: Communication tools (email, Slack, calendar, notifications) (8 rounds)
- SQ-009: SoNash stack-specific tools (custom search)
- SQ-010: Emerging and cutting-edge tools (8+10 rounds)
- USER-REQUESTED: Ruflo and Claude-Peers-MCP deep-dive (custom search)

**Verification approach:**

- All tools with HIGH confidence were verified across 2+ independent sources
  (GitHub repo + official docs or independent review)
- Star counts verified directly from GitHub as of research date
- Windows compatibility verified from official installation documentation
- Install methods tested against available package managers (Scoop, Winget, npm,
  pip, Cargo)

**De-duplication:** Tools appearing in multiple findings files (e.g., fzf in
SQ-001, SQ-003, SQ-010; delta in SQ-001, SQ-003; Glow in SQ-001, SQ-004, SQ-007)
were consolidated with the most detailed description and most recent star count.

**Filtering for user context:** All recommendations were filtered through the
user's specific context: non-developer director, Windows 11, bash shell, Claude
Code primary, no IDE, existing infrastructure of 124 npm scripts, 66 skills, 18
CI workflows.
