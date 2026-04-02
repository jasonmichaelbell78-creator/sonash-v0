# Outside the Box: What the Research Didn't Ask

<!-- prettier-ignore -->
| Field | Value |
| ----- | ----- |
| Purpose | Lateral analysis of adjacent domains, second-order effects, and blind spots |
| Date | 2026-03-23 |
| Parent | .research/cli-tools/RESEARCH_OUTPUT.md |

---

## 1. The Tool Proliferation Paradox

**Rating: HIGH (decision-changing)**

The research recommends installing 30+ tools across 4 tiers. It never asks: what
happens _after_ you install them?

### The Management Overhead Problem

Every tool installed creates ongoing costs the research doesn't account for:

- **Config file sprawl**: Each tool drops a config file somewhere --
  `.config/bat/config`, `.config/starship.toml`, `delta` settings in
  `.gitconfig`, zoxide in its own database, fzf bindings in `.bashrc`.
  Installing the full Tier 1+2 set creates ~15 new config files across at least
  4 directories. On Windows, some tools use `%APPDATA%`, some use
  `%LOCALAPPDATA%`, some use `%USERPROFILE%`, and some use `~/.config/`. There
  is no XDG Base Directory standard on Windows -- tools do whatever they want.

- **Shell startup time**: A developer blog post documented achieving a 95%
  improvement in shell startup by auditing bloat. Adding fzf keybindings, zoxide
  init, starship init, and completions for multiple tools can push Git Bash
  startup from <100ms to 500ms+. Each `eval "$(tool init bash)"` line in
  `.bashrc` is a subprocess spawn. On Windows Git Bash, subprocess spawning is
  slower than Linux by 3-5x due to process creation overhead.

- **Update management**: Scoop, Winget, npm global, pip -- tools installed
  across 4+ package managers need 4 different update commands. Who remembers to
  run `scoop update *` AND `npm update -g` AND `pip install --upgrade X`
  regularly?

### The Meta-Tool Solution

**UniGetUI** (formerly WingetUI, 16k+ stars, now under Devolutions stewardship)
is a GUI that manages Scoop, Winget, Chocolatey, pip, npm, and .NET tools from a
single interface. It shows pending updates across all managers, supports batch
operations, and has reduced package loading times by 40% in 2026. For a
non-developer director, this is arguably more important than any individual CLI
tool -- it prevents the "I installed 30 things and now I can't maintain them"
scenario.

**chezmoi** (18.5k stars) manages dotfiles across machines with templates,
encryption, and cross-platform support. For a user working across two locales,
chezmoi solves the "my .gitconfig is different on each machine" problem. But it
adds its own complexity -- 2026 reports show users getting locked into
password-manager authentication loops on every sync.

### Actionable Recommendation

Before installing Tier 1, create a `~/.config/sonash-tools/` directory and a
manifest file listing every tool, its package manager, and its config location.
Install UniGetUI first. Set a monthly calendar reminder for `scoop update *`.
Consider lazy-loading shell integrations (only init a tool when first called,
not on every shell start).

---

## 2. MCP Will Eat Some of These Tools (But Not How You'd Expect)

**Rating: HIGH (decision-changing)**

The research identifies MCP as a future trend. But a March 2026 backlash has
changed the calculus dramatically.

### The Token Cost Reality

Benchmarks from Scalekit (75 head-to-head comparisons) show MCP costs **4-32x
more tokens than CLI** for identical operations. The GitHub MCP server alone
consumes ~55,000 tokens just for tool definitions -- over a quarter of Claude's
200k context window, before any actual work happens.

Perplexity's CTO publicly announced they are **moving away from MCP** toward
APIs and CLI tools. David Zhang (Duet) ripped out MCP integrations entirely. The
consensus emerging in March 2026 is that MCP is excellent for team-shared tools
with typed schemas but terrible for solo-developer workflows where a CLI does
the same thing at 50-200 tokens per step.

### What This Means for the Research Recommendations

The research recommends evaluating Firebase MCP Server and Firecrawl MCP. Given
the token cost data:

- **Firebase MCP**: The existing `firebase-tools` CLI is likely superior for a
  solo developer. MCP adds value only if Claude needs to discover Firebase
  operations dynamically (which it doesn't -- the SoNash project has established
  patterns).
- **Firecrawl MCP vs Firecrawl CLI**: Use the CLI. MCP's tool-definition
  overhead will consume thousands of tokens per session just to expose scraping
  capabilities that a simple `firecrawl` CLI call handles in 100 tokens.
- **SoNash already has 2 MCP servers** (memory, sonarcloud). Adding more
  increases the token tax on every conversation. Claude Code's ToolSearch
  auto-defers tools when definitions exceed 10% of context, but deferred tools
  still cost search tokens when discovered.

### The Counter-Trend: Dynamic Toolsets

Speakeasy demonstrated a **100x token reduction** using dynamic toolsets that
load tools on-demand rather than statically. This is the future of MCP -- not
"install an MCP server for everything" but "one smart MCP server that exposes
only what's needed per query." This hasn't been productized widely yet, but it
inverts the recommendation: in 12 months, a single dynamic MCP gateway may
replace 10 CLI tools efficiently.

---

## 3. Claude Code Is Already Subsuming Several Recommended Tools

**Rating: HIGH (decision-changing)**

The research was done on a snapshot of Claude Code's capabilities. But Claude
Code's feature velocity in early 2026 means several recommended tools are
partially or fully redundant.

### Already Built In or Arriving

- **ntfy-like notifications**: Claude Code's `Notification` hook event fires
  when Claude needs attention or has been idle 60+ seconds. Combined with the
  `Stop` event and HTTP hooks (new in 2026), Claude Code can POST to ntfy
  natively without any external tool -- just a curl command in
  `.claude/settings.json`. The research correctly identifies ntfy as highest
  value, but the integration mechanism is simpler than presented. It's a 3-line
  JSON config, not a "tool to install."

- **`/loop` for recurring tasks**: Claude Code now has built-in scheduled/
  recurring task execution. This partially obsoletes external cron-based
  monitoring scripts. Tasks fire while Claude is running, expire after 3 days,
  and support cron expressions.

- **`/context` for context management**: Provides actionable suggestions about
  token consumption, MCP bloat, and memory optimization -- partially replacing
  the need for external token-counting tools.

- **Voice mode (`/voice`)**: Push-to-talk interaction may change how the
  director interacts with Claude, reducing the need for some TUI tools that
  exist primarily to make CLI output human-readable.

### What This Changes

The ntfy recommendation shifts from "install ntfy" to "configure Claude Code's
built-in Notification hook to POST to ntfy.sh." The tool itself is still needed
as the notification server, but the integration is zero-code.

---

## 4. The Accessibility Blind Spot

**Rating: MEDIUM (worth noting)**

The research evaluated 140+ tools purely on functionality and star count. It
never asked: are these tools accessible?

### The Problem Nobody Mentions

A 2021 ACM study on CLI accessibility found that users with visual impairments
rely heavily on screen readers (NVDA, JAWS) that treat terminal output as
unstructured text. Modern TUI tools that use Ratatui/Bubble Tea create visually
rich interfaces that are **essentially invisible to screen readers**:

- **lazygit**: Entirely visual TUI -- unusable with screen readers
- **Yazi**: File browser that relies on icon rendering -- breaks with assistive
  technology
- **Starship/Oh-My-Posh**: Nerd Font icons render as empty boxes or speech loops
  with screen readers
- **bat**: Syntax highlighting via ANSI escape codes can create garbled speech
  output

This doesn't affect the current user directly. But it matters for two reasons:

1. **Future team members**: If SoNash ever has contributors who use assistive
   technology, a toolchain built on TUI-only tools creates barriers.
2. **The `--plain` / `--json` pattern**: Tools with `--json` output (jc, gron,
   yq, miller) are inherently more accessible because structured output is
   parseable by any technology. The research accidentally captured the right
   tools for accessibility in its data pipeline section, but never connected
   this to the accessibility advantage.

### Actionable Insight

Prefer tools with `--json` or `--plain` output modes. When Claude invokes tools
via Bash, it should use structured output anyway (JSON is easier to parse than
ANSI-colored text). This aligns accessibility with AI-agent effectiveness.

---

## 5. The DevOps Wisdom the Developer World Ignores

**Rating: MEDIUM (worth noting)**

The research searched "developer CLI tools." It never searched how sysadmins and
DevOps engineers -- who have been CLI-first for decades -- solve the exact same
problems.

### Patterns Worth Stealing

- **Infrastructure as Code for your workstation**: DevOps culture treats machine
  setup as code. The developer equivalent is a bootstrap script that
  idempotently installs and configures every tool. SoNash already has 124 npm
  scripts -- adding a `scripts/bootstrap-tools.sh` that runs
  `scoop install fzf bat fd zoxide delta` and configures `.gitconfig` and
  `.bashrc` means the entire Tier 1 setup is reproducible in one command, across
  both locales, forever.

- **Taskfile as a universal runner**: The research mentions npm scripts but not
  `Taskfile` (go-task, growing rapidly in 2026). Taskfile uses YAML and supports
  dependency-based execution with checksums. For a project with 124 npm scripts,
  some of which are bash wrappers, Taskfile could unify npm scripts and shell
  scripts into one interface. However -- this is a "someday" idea, not an urgent
  one. The 124 npm scripts already work.

- **"Golden paths" over "golden tools"**: Enterprise platform engineering has
  learned that giving developers 50 tools creates choice paralysis. The
  successful pattern is fewer tools with documented workflows connecting them.
  Backstage (Spotify's developer portal) exists because having great tools
  without workflows connecting them creates a discovery problem. For SoNash, the
  equivalent is: don't just install lazygit -- document when to use lazygit vs.
  when Claude handles git vs. when to use the command line directly.

---

## 6. The Non-Expert's Questions

**Rating: MEDIUM (worth noting)**

The user is described as a director, not a developer. A complete non-expert
looking at this research would ask questions the experts never think to ask.

### "Why am I learning commands at all?"

Warp Terminal's natural language interface lets you type `#` and describe what
you want in plain English. Claude Code already accepts natural language. The
real question for a non-developer director is not "which CLI tools should I
install?" but "how do I minimize the number of commands I need to memorize?"

**The answer the research doesn't give**: Almost none. Claude Code can operate
fzf, bat, fd, delta, lazygit, yq, jq, hurl, and every other recommended tool via
its Bash tool. The user's job is to install them and let Claude use them. The
tools that benefit the _user_ directly (not Claude) are a much shorter list:

1. **fzf** (Ctrl+R fuzzy history search -- the user will use this)
2. **zoxide** (z directory jumping -- the user will use this)
3. **lazygit** (visual git review -- the user will use this)
4. **ntfy** (phone notifications -- the user will receive these)
5. **Starship/Oh-My-Posh** (prompt context -- the user will see this)

Everything else is primarily for Claude's benefit. Reframing the recommendation
this way reduces cognitive load: "Install 5 things for you, 15 things for
Claude, ignore the rest until needed."

### "What if I break something?"

Scoop's design directly addresses this -- it installs to `~/scoop/` with no
admin rights and no PATH pollution. But the research doesn't mention that Scoop
has `scoop reset <tool>` (revert to a previous version) and that every
installation is a simple directory you can delete. For a non-developer, knowing
that uninstalling is `scoop uninstall bat` (not "find the registry entries and
hope") is reassuring.

### "Do I actually need a Nerd Font?"

The research lists Nerd Fonts as Tier 1. A non-expert would ask: what happens if
I don't install one? Answer: Starship shows `?` instead of git branch icons, eza
shows boxes instead of file-type icons. Everything still _works_. If the user
finds Nerd Font installation confusing (it requires changing the terminal's font
setting), skipping it and accepting plain text is a valid choice. The research
doesn't present this option.

---

## 7. Windows ARM Is Coming and Nobody's Ready

**Rating: MEDIUM (worth noting)**

The research confirms all tools are Windows x64 compatible. It doesn't ask about
ARM.

### The Landscape in 2026

Windows on ARM (Snapdragon X) is now a real development platform. WSL is
"exceptionally fast" on ARM, file I/O is faster than Intel ultrabook WSL, and
most dev tools work via x86/x64 emulation through Qualcomm's Prism emulator.

### What Breaks

- **Rust single-binary tools** (bat, fd, ripgrep, delta, zoxide, bottom,
  hyperfine, tokei): All compile to native ARM via Rust's cross-compilation.
  Most already have ARM builds in Scoop. **Low risk.**
- **Go single-binary tools** (lazygit, yq, gron, croc, gum, glow): Go also
  cross-compiles to ARM natively. **Low risk.**
- **Node.js/npm tools** (tsgo, tldr, concurrently): Node.js has native ARM
  builds. **Low risk.**
- **Python tools** (Aider, jc, PR-Agent, llm): Python runs natively on ARM.
  **Low risk.**
- **Docker Desktop**: Does NOT have native ARM support on Windows ARM.
  Workarounds exist but are fragile. **Medium risk** if using Firebase emulators
  via Docker.
- **Scoop itself**: Pure PowerShell, no binary to port. **No risk.**

### Actionable Insight

If the user is considering a Snapdragon laptop for the second locale, the Tier 1
toolkit is safe. The risk is in Docker-dependent workflows, not in CLI tools.

---

## 8. Analogies from Other Power-User Domains

**Rating: LOW (interesting but contextual)**

### Video Production CLI Culture

FFmpeg is the ur-example of a CLI tool that professionals build entire workflows
around. DaVinci Resolve now has an MCP server (!) for AI-driven editing
automation, and a headless `-nogui` mode for scripted rendering. The pattern:
professionals use GUIs for creative work and CLIs for automation and batch
processing. This mirrors the SoNash pattern exactly -- the user does creative
direction, Claude does the batch execution.

### Music Production

Ableton Live now has MCP integration (200+ tools), OSC control, and Scheme
scripting. The lesson: even the most GUI-centric domains are adding programmatic
interfaces because AI agents need them. The trajectory is clear -- every
creative tool will have a CLI or API layer within 2 years.

### Financial Terminals

OpenBB (open-source Bloomberg Terminal alternative) is an AI-powered financial
terminal with CLI access and LLM integration. It demonstrates that even
traditionally GUI-heavy domains (trading terminals) are moving to CLI-first
AI-augmented interfaces. The pattern: structured data + CLI + AI agent =
powerful analysis without expensive proprietary tools.

### The Meta-Lesson

Every domain's power users converge on the same pattern: structured data in,
human-readable summary out, automation for repetition, interactive UI only for
decision points. The SoNash CLI toolkit research is already aligned with this
pattern. The confirmation from other domains raises confidence in the approach.

---

## 9. The 6-12 Month Horizon the Research Underestimates

**Rating: MEDIUM (worth noting)**

### Claude Code's Subsumption Velocity

The February-March 2026 releases added: voice mode, /loop scheduling, /batch
processing, /simplify, remote control, HTTP hooks, plugin marketplace, model
overrides, and auto memory. At this velocity, by September 2026:

- Built-in file browsing could replace Yazi for Claude-directed work
- Built-in notification routing could replace ntfy for simple cases
- Built-in structured data handling (via tools) could reduce need for jq/yq for
  Claude-invoked pipelines
- The plugin marketplace could distribute tool integrations as plugins rather
  than standalone CLIs

### The MCP Correction Course

The March 2026 MCP backlash will produce a correction by Q3 2026. Dynamic
toolsets (Speakeasy's 100x reduction approach), tool-search-based deferred
loading, and leaner MCP server designs will emerge. The current "install an MCP
server for each service" model will shrink to "one gateway MCP server with
dynamic tool loading." This benefits SoNash because it already has 2 MCP servers
-- the pressure will be toward consolidation, not expansion.

### What to Do About It

**Don't over-invest in tooling that Claude Code will absorb.** The safe bets are
tools that provide value _outside_ Claude Code sessions: fzf (user's shell),
lazygit (user's git review), ntfy (notification infrastructure), zoxide (user's
navigation). The risky bets are tools whose primary consumer is Claude's Bash
tool -- those are the ones Claude Code is most likely to subsume or replace with
built-in features.

---

## 10. The Question Nobody Asked: "Install Less, Configure More"

**Rating: HIGH (decision-changing)**

The research frames the problem as "which tools to install." The more impactful
question is "which tools already installed can be configured better."

### What SoNash Already Has That's Underutilized

From the research itself:

- **oxlint**: Already installed at v1.56.0, but type-aware rules may not be
  enabled. Enabling them = 59/61 typescript-eslint rules at 20-40x speed. Zero
  install.
- **`next experimental-analyze`**: Already available in Next.js 16.1+. Zero
  install. Nobody seems to know about it.
- **Windows Terminal hidden features**: Session restoration, named layouts,
  extensions, Kitty keyboard protocol. Zero install.

### What This Means

The highest-ROI action is not "install fzf" (a new tool to learn). It is "enable
oxlint type-aware rules" (a config change to something already running). The
research buries this in Theme 7 but doesn't elevate it to the top of the action
list. Reordered by ROI:

1. Enable oxlint type-aware rules (0 minutes install, 15 minutes config)
2. Run `npx next experimental-analyze` (0 minutes install, 2 minutes run)
3. Configure Windows Terminal layouts/restoration (0 minutes install, 10 min)
4. Configure Claude Code Notification hook to POST to ntfy.sh (5 min total)
5. THEN install Tier 1 tools

This inverts the research's priority order. Configuration before installation.

---

## Summary Table

| #   | Insight                                               | Rating | Action                                                              |
| --- | ----------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| 1   | Tool proliferation creates its own management problem | HIGH   | Install UniGetUI first; create tool manifest; lazy-load shell inits |
| 2   | MCP token costs make CLI superior for solo dev        | HIGH   | Prefer CLI over MCP for Firecrawl, Firebase; limit MCP server count |
| 3   | Claude Code is subsuming recommended tools            | HIGH   | Use built-in hooks/loop/context before reaching for external tools  |
| 4   | TUI tools are invisible to screen readers             | MEDIUM | Prefer tools with --json/--plain modes; aligns with AI-agent usage  |
| 5   | DevOps culture has solved these problems before       | MEDIUM | Create reproducible bootstrap script; document tool workflows       |
| 6   | Most tools are for Claude, not the user               | MEDIUM | Reframe: 5 tools for you, 15 for Claude, rest deferred              |
| 7   | Windows ARM is safe for this toolkit                  | MEDIUM | Docker is the only risk area; CLI tools are fine                    |
| 8   | Other domains confirm the CLI+AI pattern              | LOW    | Confidence boost; no action needed                                  |
| 9   | Claude Code feature velocity may obsolete some recs   | MEDIUM | Don't over-invest in tools Claude will absorb                       |
| 10  | Configuration > installation for immediate ROI        | HIGH   | Reorder actions: oxlint, next-analyze, WT layouts, then new tools   |

---

## Sources

- [Accessible CLI Design - AFixt](https://afixt.com/accessible-by-design-improving-command-line-interfaces-for-all-users/)
- [ACM: Accessibility of Command Line Interfaces](https://dl.acm.org/doi/fullHtml/10.1145/3411764.3445544)
- [Building a More Accessible GitHub CLI](https://github.blog/engineering/user-experience/building-a-more-accessible-github-cli/)
- [Shell Startup Speed (95% improvement)](https://www.nickyt.co/blog/how-i-used-claude-code-to-speed-up-my-shell-startup-by-95-m0f/)
- [Lazy Load Completions for Faster Shell](https://willhbr.net/2025/01/06/lazy-load-command-completions-for-a-faster-shell-startup/)
- [Why CLI Tools Are Beating MCP](https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/)
- [MCP Is Dead; Long Live MCP](https://chrlschn.dev/blog/2026/03/mcp-is-dead-long-live-mcp/)
- [Your MCP Server Is Eating Your Context Window](https://www.apideck.com/blog/mcp-server-eating-context-window-cli-alternative)
- [MCP vs CLI Tools: When to Use Which](https://systemprompt.io/guides/mcp-vs-cli-tools)
- [Perplexity Drops MCP, Citing Context Waste](https://nevo.systems/blogs/news/perplexity-drops-mcp-protocol-72-percent-context-window-waste)
- [Reducing MCP Token Usage by 100x - Speakeasy](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2)
- [MCP Token Costs in Claude Code](https://www.jdhodges.com/blog/claude-code-mcp-server-token-costs/)
- [10 Strategies to Reduce MCP Token Bloat - New Stack](https://thenewstack.io/how-to-reduce-mcp-token-bloat/)
- [MCP Roadmap 2026 - New Stack](https://thenewstack.io/model-context-protocol-roadmap-2026/)
- [Windows on ARM Compatibility](https://windowsonarm.org)
- [Windows ARM Developer Guide](https://techitez.org/gadgets/snapdragon-x-arm-windows-devs/)
- [Snapdragon Compatibility Tier List 2026](https://www.witechpedia.com/windows-on-arm-app-compatibility/)
- [UniGetUI (Devolutions)](https://unigetui.com/)
- [UniGetUI 2026.1.3 Release](https://windowsnews.ai/article/unigetui-202613-released-under-devolutions-stewardship-what-windows-users-need-to-know.405712)
- [chezmoi Dotfiles Manager](https://www.chezmoi.io/)
- [chezmoi Secrets Overhead (2026)](https://www.mikekasberg.com/blog/2026/01/31/dotfiles-secrets-in-chezmoi.html)
- [Dotfiles + Claude Code Workshop](https://www.hsablonniere.com/dotfiles-claude-code-my-tiny-config-workshop--95d5fr/)
- [Claude Code Sandbox Security](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Claude Code Permissions Docs](https://code.claude.com/docs/en/permissions)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [ntfy + Claude Code Integration](https://tonydehnke.com/blog/claude-code-notifications-ntfy-hooks/)
- [ntfy + Tailscale Private Setup](https://felipeelias.github.io/2026/02/25/claude-code-notifications.html)
- [claude-notifier Multi-Channel](https://github.com/felipeelias/claude-notifier)
- [Claude Code March 2026 Updates](https://pasqualepillitteri.it/en/news/381/claude-code-march-2026-updates)
- [Claude Code /loop and /schedule](https://medium.com/@richardhightower/put-claude-on-autopilot-scheduled-tasks-with-loop-and-schedule-built-in-skills-43f3be5ac1ec)
- [Claude Code Scheduled Tasks Docs](https://code.claude.com/docs/en/scheduled-tasks)
- [Developer Productivity Trap](https://dev.to/leena_malhotra/the-developer-productivity-trap-why-more-tools-doesnt-mean-better-output-l7k)
- [Solo Builders Ship Faster](https://codecondo.com/solo-builders-shipping-faster-2026/)
- [Warp Terminal AI for Non-Technical Users](https://www.warp.dev/warp-ai)
- [Taskfile: Modern Makefile Alternative](https://marmelab.com/blog/2026/03/12/taskfile-alternative-makefile.html)
- [Just vs Make vs Taskfile](https://appliedgo.net/spotlight/just-make-a-task/)
- [Scoop vs Winget vs Chocolatey](https://www.xda-developers.com/chocolatey-vs-winget-vs-scoop/)
- [OpenBB Financial Terminal](https://github.com/OpenBB-finance/OpenBB)
- [DaVinci Resolve MCP Server](https://skywork.ai/skypage/en/automate-video-workflow-davinci-resolve/1977625731719958528)
- [Ableton Live MCP Integration (200+ tools)](https://github.com/jpoindexter/ableton-mcp)
- [Platform Engineering Tools 2026](https://platformengineering.org/blog/platform-engineering-tools-2026)
