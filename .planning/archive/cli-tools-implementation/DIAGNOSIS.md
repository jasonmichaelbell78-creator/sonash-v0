# Diagnosis: CLI Tools Implementation

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-23 **Task:** Install, configure, and integrate CLI tools from
/deep-research into dual-locale workflow with AI awareness and produce a CLI
User Guide.

---

## ROADMAP Alignment

**New Direction** — No existing ROADMAP item covers CLI tool ecosystem
expansion. However, this aligns with:

- **Tooling & Infrastructure (P0, 0%)** — 30 decisions pending. CLI tools
  directly improve the tooling layer.
- **Operational Visibility** — Tools like ntfy.sh, btm, and lazygit improve
  visibility into system state.
- **General project velocity** — Foundation tools (fzf, bat, delta, zoxide)
  improve every session's efficiency.

Not misaligned — this is infrastructure investment that accelerates all other
work.

---

## Research Context

**Source:** `.research/cli-tools/RESEARCH_OUTPUT.md` (Session #234) **Depth:**
L1 Exhaustive | **Agents:** 15 | **Tools evaluated:** 140+ **Claims:** 45 (41
HIGH, 2 MEDIUM, 2 LOW)

### Key Research Findings (corrected)

1. **"Install Less, Configure More"** — Zero-install config changes (oxlint
   type-aware, `next experimental-analyze`, Windows Terminal features) have
   higher ROI than any new tool.
2. **ntfy.sh is the biggest productivity gap** — No way to know when AI tasks
   complete without watching the terminal.
3. **Foundation tools** (fzf, bat, fd, delta, zoxide) improve every terminal
   interaction for both user and AI.
4. **Only 5 tools directly benefit the human** — fzf, zoxide, lazygit, ntfy,
   Starship. Everything else primarily helps Claude's Bash tool.
5. **WezTerm REFUTED** — abandoned (no release since Feb 2024). Stay with
   Windows Terminal.
6. **GitHub Copilot CLI REFUTED** — deprecated Sep 2025. Use `gh copilot`
   extension.
7. **Scoop WEAKENED** — winget covers most Tier 1 tools now. Use winget as
   default.
8. **Tool Proliferation Paradox** — 30+ tools creates management overhead. Need
   meta-strategy, not just a shopping list.
9. **MCP costs 4-32x more tokens than CLI** — Don't add MCP servers when CLI
   equivalents exist.
10. **Claude Code feature velocity** — Some tools may be subsumed in 6-12
    months. Don't over-invest.

### Contrarian Structural Biases (acknowledged)

- GitHub stars ≠ quality (6M fake stars documented)
- Research framed as "what to install" — never asked "what to remove"
- Recency/hype bias from search-date-dependent methodology

---

## Relevant Existing Systems

| System                | Relationship            | Pattern to Follow                     |
| --------------------- | ----------------------- | ------------------------------------- |
| npm scripts (124)     | Primary tool invocation | Add new tools as npm scripts          |
| .claude/hooks/        | Tool-aware automation   | `ensure-fnm.sh node <script>` wrapper |
| session-start.js      | Environment validation  | Lockfile hash caching, dep detection  |
| lint-staged           | Pre-commit tool chain   | Add tool to lint-staged config        |
| .claude/settings.json | Hook registration       | JSON array args format                |
| CLAUDE.md Section 6   | Tool documentation      | Add preferences/standards             |
| .nvmrc + fnm          | Version management      | Use fnm for Node, manual for others   |
| package.json devDeps  | npm-available tools     | Prefer npm install for Node tools     |

### Tool Integration Pattern (existing)

New tools follow this path:

1. Install as devDependency or standalone binary
2. Create npm script wrapper
3. Add config file at repo root
4. Document in CLAUDE.md if it's a coding standard
5. Add to lint-staged if pre-commit needed
6. NO custom hook needed — npm scripts handle PATH via fnm

### Dual-Locale Constraints

| Constraint       | Home (`C:\Users\jason\`)     | Work (`C:\Users\jbell\`)      |
| ---------------- | ---------------------------- | ----------------------------- |
| Admin access     | Yes                          | No (user-level only)          |
| Package managers | Scoop, winget, cargo         | None (can't install)          |
| PATH             | Can modify                   | Cannot add — repo IS the PATH |
| Shell            | Any (bash, PowerShell, etc.) | bash (user-level install)     |
| npm/npx          | Yes                          | Yes                           |
| Binary downloads | Unrestricted                 | Usually fine via CLI          |
| Config locations | `~/.config/`, `~/.gitconfig` | Same, user-level              |

**Key implication:** Standalone binaries must live IN the repo (or a directory
already in PATH) at work. At home, standard package manager installs work.

### Work Locale Capability Assessment (tested 2026-03-23)

| Capability         | Status | Notes                                                            |
| ------------------ | ------ | ---------------------------------------------------------------- |
| Repo in PATH       | YES    | `/c/Users/jbell/.local/bin/sonash-v0`                            |
| ~/bin in PATH      | YES    | `/c/Users/jbell/bin` — jq, gitleaks, fnm, go, make already there |
| Drop .exe in ~/bin | YES    | Proven pattern (fnm.exe, gitleaks.exe, jq.exe, make.exe)         |
| winget             | YES    | v1.28.220                                                        |
| npm/npx            | YES    | v10.9.4                                                          |
| python/pip         | YES    | Python 3.13.12, pip 25.3, `--user` works                         |
| go                 | YES    | go1.23.6, `go install` viable                                    |
| curl               | YES    | curl 8.17.0, GitHub downloads work                               |
| bash               | YES    | 5.2.37 (Git Bash/MSYS2)                                          |
| jq                 | YES    | Already installed (1.7.1)                                        |
| cargo/rust         | NO     | Not available — Rust tools need pre-built binaries               |
| scoop              | NO     | Not installed                                                    |
| git config         | YES    | `~/.gitconfig` writable                                          |
| ~/.config/         | YES    | Exists, writable                                                 |
| GitHub downloads   | YES    | HTTP 302 redirects work                                          |

**Install paths available at work:**

1. **Binary download → ~/bin/** (proven: jq, gitleaks, fnm, make)
2. **winget install** (v1.28.220 available)
3. **npm install / npx** (Node tools)
4. **pip install --user** (Python tools)
5. **go install** (Go tools → ~/gopath/bin/ which is in PATH)
6. **curl from GitHub releases** (download pre-built binaries)

**NOT available at work:** cargo/rust compilation, scoop, admin-level installs

---

## Reframe Check

The task appears to be "install a bunch of CLI tools." But the research's
strongest finding is **"install less, configure more."** The real task is:

1. **Configure what's already installed** (zero-cost, immediate ROI)
2. **Test work locale capabilities** (before assuming anything)
3. **Install a curated subset** (not the full 140-tool catalog)
4. **Integrate with AI** (so Claude actually uses the tools)
5. **Document for the user** (CLI User Guide)

This is an **infrastructure and integration project**, not a shopping spree.

---

## Claims Requiring Verification

| Claim                                          | Verify Command               | Status                              |
| ---------------------------------------------- | ---------------------------- | ----------------------------------- |
| oxlint is installed at v1.56.0                 | `npx oxlint --version`       | [VERIFIED: session-start confirmed] |
| jq is already installed                        | `jq --version`               | [UNVERIFIED]                        |
| fnm manages Node versions                      | `command -v fnm`             | [VERIFIED: ensure-fnm.sh]           |
| Next.js 16.2.0 supports `experimental-analyze` | `npx next --help`            | [UNVERIFIED]                        |
| `.gitconfig` is user-writable at work          | `git config --global --list` | [UNVERIFIED — needs testing]        |
| Repo directory is in PATH at work              | `echo $PATH`                 | [UNVERIFIED — needs testing]        |
