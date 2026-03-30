# Decisions: CLI Tools Implementation

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-23 **Task:** Install, configure, and integrate CLI tools into
dual-locale workflow **Discovery:** 34 questions, 30 decisions

---

## Decision Table

| #    | Decision                          | Choice                                                            | Rationale                                                                         |
| ---- | --------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| D-01 | Plan phase ordering               | Configure existing → test locale → install → integrate → document | Research insight: "install less, configure more" — zero-cost config changes first |
| D-02 | Tool selection approach           | Per-category Q&A with descriptions, pros/cons, recommendations    | User correction: no arbitrary tool count caps, nuanced selection                  |
| D-03 | Standalone binary location (work) | `~/bin/` (`/c/Users/jbell/bin/`)                                  | Already in PATH, proven pattern (jq, gitleaks, fnm, go already there)             |
| D-04 | Tool config sync strategy         | Hybrid — `tool-configs/` in repo with setup script                | Configs sync via git, setup script deploys to expected locations per locale       |
| D-05 | AI tool awareness                 | CLAUDE.md preferences + session-start hook detection              | CLAUDE.md says preferences, hook confirms runtime availability                    |
| D-06 | AI coding tools (Aider etc.)      | Deferred to separate plan                                         | Too much complexity for this plan (Python, Ollama, model downloads)               |
| D-07 | Work locale capability            | Tested — more capable than expected                               | winget, go, python/pip, curl, ~/bin/ all available. No cargo/scoop.               |
| D-08 | CLI User Guide format             | Single file: `docs/CLI_USER_GUIDE.md`                             | Non-developer friendly, full reference with examples and locale notes             |
| D-09 | Foundation tools — fzf            | Install                                                           | Fuzzy finder, Ctrl+R history. Human + Claude benefit. Binary → ~/bin/             |
| D-10 | Foundation tools — bat            | Install                                                           | Syntax-highlighted file viewing. Binary → ~/bin/                                  |
| D-11 | Foundation tools — fd             | Install                                                           | Fast file finding. Binary → ~/bin/                                                |
| D-12 | Foundation tools — delta          | Install                                                           | Git diff enhancement. Binary → ~/bin/ + .gitconfig                                |
| D-13 | Foundation tools — zoxide         | Install                                                           | Frecency directory jumper. Binary → ~/bin/ + shell init                           |
| D-14 | Foundation tools — eza            | Install                                                           | Rich directory listings. Binary → ~/bin/. Needs Nerd Font.                        |
| D-15 | Foundation tools — ripgrep        | Install (standalone)                                              | Enables Bash piping beyond Claude's internal Grep. Binary → ~/bin/                |
| D-16 | Nerd Fonts                        | Install JetBrains Mono NF                                         | Prerequisite for eza, Starship, Yazi icons. Font file install.                    |
| D-17 | Shell prompt                      | Starship only (not both)                                          | Faster, cross-shell, config syncs via repo. Binary → ~/bin/                       |
| D-18 | Terminal file manager — Yazi      | Install                                                           | Claude suggests and launches it for user when visual browsing is useful           |
| D-19 | Git TUI — lazygit                 | Install                                                           | Visual git for non-developer director. Go binary, `go install` at work            |
| D-20 | System monitor — bottom           | Skip                                                              | Low priority, user doesn't need it                                                |
| D-21 | Markdown viewer — glow            | Skip                                                              | Redundant — Claude reads and presents markdown                                    |
| D-22 | yq                                | Install                                                           | jq for YAML/XML/CSV/TOML. Binary → ~/bin/                                         |
| D-23 | gron                              | Install                                                           | Makes JSON greppable. Binary → ~/bin/                                             |
| D-24 | xh, hurl (HTTP tools)             | Skip both                                                         | curl + Claude's WebFetch sufficient                                               |
| D-25 | ntfy.sh                           | Install (free cloud, zero cost)                                   | Biggest productivity gap — push notifications when tasks complete                 |
| D-26 | slackcat                          | Skip                                                              | User is solo, doesn't use Slack                                                   |
| D-27 | croc                              | Skip                                                              | Git handles cross-locale file sync                                                |
| D-28 | jc (CLI output → JSON)            | Skip                                                              | No concrete use case identified in user's workflow                                |
| D-29 | htmlq                             | Install                                                           | CSS selector HTML extraction in Bash pipes. Binary → ~/bin/                       |
| D-30 | difftastic                        | Install                                                           | AST-aware diffs complement delta's line diffs. Binary → ~/bin/                    |
| D-31 | git-absorb                        | Skip                                                              | User prefers explicit fix commits (triggers PR re-review)                         |
| D-32 | git-cliff                         | Skip                                                              | Redundant with release-please CI workflow                                         |
| D-33 | tsgo                              | Install and try                                                   | 10x faster tsc. npm install. Low risk (not zero — crash bugs noted)               |
| D-34 | Unlighthouse                      | Install                                                           | Site-wide Lighthouse. npx (zero install). Extends existing setup                  |
| D-35 | oxlint type-aware mode            | Enable (config change)                                            | Already installed. 59/61 typescript-eslint rules, 20-40x faster                   |
| D-36 | Session-start tool detection      | Warn on missing only + offer to fix                               | Don't show "everything fine," only surface problems                               |
| D-37 | CLAUDE.md tool preferences        | Availability-gated                                                | "Use bat if available, fall back to cat." Works across both locales               |
| D-38 | Config sync approach              | `tool-configs/` dir + `scripts/setup-cli-tools.sh`                | delta .gitconfig, starship.toml, ntfy.conf, tool-manifest.json                    |
| D-39 | ntfy topic strategy               | Single topic to start                                             | Keep simple, split later if noisy                                                 |
| D-40 | ntfy event triggers               | Session-end + input needed                                        | Reliable, low noise. Long-task and error notifications deferred                   |
| D-41 | CLI User Guide detail level       | Full guide (B)                                                    | What, why, 5-10 examples, locale notes, config location per tool                  |

---

## Tool Install Summary

### Installing (16 tools + 1 font + 2 config changes)

| Tool              | Type         | Work Install                          | Home Install      |
| ----------------- | ------------ | ------------------------------------- | ----------------- |
| fzf               | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| bat               | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| fd                | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| delta             | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| zoxide            | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| eza               | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| ripgrep           | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| Starship          | Binary       | GitHub release → ~/bin/               | winget            |
| Yazi              | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| lazygit           | Go           | `go install`                          | winget/scoop      |
| yq                | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| gron              | Binary       | GitHub release → ~/bin/               | scoop             |
| htmlq             | Binary       | GitHub release → ~/bin/               | scoop             |
| difftastic        | Binary       | GitHub release → ~/bin/               | winget/scoop      |
| ntfy              | Zero-install | curl to ntfy.sh cloud                 | Same              |
| Nerd Font         | Font file    | Download + install .ttf               | Same              |
| tsgo              | npm          | `npm i -D @typescript/native-preview` | Same              |
| Unlighthouse      | npx          | `npx unlighthouse` (zero install)     | Same              |
| oxlint type-aware | Config       | Edit `.oxlintrc.json`                 | Same (git-synced) |

### Skipped (12 tools)

bottom, glow, xh, hurl, slackcat, croc, jc, git-absorb, git-cliff, Aider
(deferred), Oh-My-Posh (Starship chosen), WezTerm (refuted)

---

## Deliverables

1. Config changes to existing tools (oxlint, `next experimental-analyze`)
2. 16 CLI tools installed at work locale
3. 16 CLI tools installed at home locale
4. `tool-configs/` directory with synced configs
5. `scripts/setup-cli-tools.sh` setup script
6. `.claude/tool-manifest.json` for hook detection
7. CLAUDE.md updates (tool preferences, availability-gated)
8. Session-start hook update (tool detection, warn on missing)
9. ntfy.sh hook integration (session-end + input needed)
10. `docs/CLI_USER_GUIDE.md` — full reference guide
