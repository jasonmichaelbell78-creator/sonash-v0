# Plan: CLI Tools Implementation

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-03-26
**Status:** EXECUTING (home locale complete)
<!-- prettier-ignore-end -->

**Effort:** XL (multi-session) **Decisions:** [DECISIONS.md](./DECISIONS.md) (41
decisions) **Research:**
[.research/cli-tools/RESEARCH_OUTPUT.md](../../.research/cli-tools/RESEARCH_OUTPUT.md)

## Progress (Session #242)

| Phase                 | Steps | Status                                                              |
| --------------------- | ----- | ------------------------------------------------------------------- |
| 1: Configure existing | 1-3   | DONE — oxlint type-aware rules, next experimental-analyze confirmed |
| 2: Infrastructure     | 4-7   | DONE — tool-configs/, manifest, install + setup scripts             |
| 3: Install (home)     | 8-15  | DONE — all 14 tools + tsgo installed via winget/cargo/go            |
| 4: Install (work)     | 16    | NOT YET — separate session at work locale                           |
| 5: AI integration     | 17-19 | DONE — CLAUDE.md prefs, session-start hook, ntfy hook               |
| 6: Verification       | 20-21 | DONE — 3548 tests pass, code-reviewer ran, all tools verified       |
| 7: User guide         | 22    | DONE — docs/CLI_USER_GUIDE.md (850 lines)                           |
| 8: Ship               | 23-24 | DONE — committed c921e019 + a99ec213, pushed                        |
| 8: Other locale       | 25    | NOT YET — after work locale install                                 |

---

## Phase 1: Configure Existing Tools (zero-install, immediate ROI)

_Per Decision D-01: configure before installing._

### Step 1: Enable oxlint type-aware rules

**Per Decision D-35.**

1. Read current `.oxlintrc.json`
2. Add type-aware typescript rule categories
3. Test: `npm run lint:fast` passes without new false positives
4. If new violations surface, triage: fix now or add to known-debt baseline

**Done when:** `npm run lint:fast` runs with type-aware rules enabled, no
regressions vs current baseline.

### Step 2: Verify `next experimental-analyze` availability

1. Run `npx next experimental-analyze --help` or `npx next --help` to confirm
   the subcommand exists in Next.js 16.2.0
2. If available: run it against the SoNash build, capture output
3. Document the command in CLI User Guide (Step 28)
4. If NOT available: mark as [UNAVAILABLE] in DECISIONS.md, skip

**Done when:** Command confirmed available or unavailable. If available, one
successful run with output captured.

### Step 3: Explore Windows Terminal hidden features

1. Check current Windows Terminal settings for session restore, split panes,
   named profiles
2. Document any useful features found in CLI User Guide (Step 28)
3. No code changes — information gathering only

**Done when:** Windows Terminal capabilities documented for user reference.

**AUDIT CHECKPOINT — Phase 1:** Verify config changes don't break existing
lint/build pipelines. Run `npm run lint:fast`, `npm run build`, `npm run test`
to confirm.

---

## Phase 2: Infrastructure Setup (repo scaffolding)

### Step 4: Create tool-configs directory

**Per Decisions D-04, D-38.**

```
tool-configs/
  .gitconfig-delta        # delta pager config (appended to ~/.gitconfig)
  starship.toml           # Starship prompt config
  ntfy.conf               # ntfy topic name and preferences
  zoxide-init.sh          # zoxide shell initialization snippet
```

**Done when:** Directory exists with template configs committed to git.

### Step 5: Create tool manifest

**Per Decision D-05.**

Create `.claude/tool-manifest.json`:

```json
{
  "version": 1,
  "tools": {
    "fzf": {
      "check": "fzf --version",
      "prefer_over": null,
      "category": "search"
    },
    "bat": {
      "check": "bat --version",
      "prefer_over": "cat",
      "category": "view"
    },
    "fd": {
      "check": "fd --version",
      "prefer_over": "find",
      "category": "search"
    },
    "delta": {
      "check": "delta --version",
      "prefer_over": null,
      "category": "git"
    },
    "zoxide": {
      "check": "zoxide --version",
      "prefer_over": "cd",
      "category": "nav"
    },
    "eza": {
      "check": "eza --version",
      "prefer_over": "ls",
      "category": "view"
    },
    "rg": {
      "check": "rg --version",
      "prefer_over": "grep",
      "category": "search"
    },
    "starship": {
      "check": "starship --version",
      "prefer_over": null,
      "category": "prompt"
    },
    "yazi": {
      "check": "yazi --version",
      "prefer_over": null,
      "category": "filemanager"
    },
    "lazygit": {
      "check": "lazygit --version",
      "prefer_over": null,
      "category": "git"
    },
    "yq": { "check": "yq --version", "prefer_over": null, "category": "data" },
    "gron": {
      "check": "gron --version",
      "prefer_over": null,
      "category": "data"
    },
    "htmlq": {
      "check": "htmlq --version",
      "prefer_over": null,
      "category": "data"
    },
    "difftastic": {
      "check": "difft --version",
      "prefer_over": null,
      "category": "git"
    }
  }
}
```

**Done when:** Manifest committed, schema covers all 16 tools.

### Step 6: Create setup script

**Per Decision D-38.**

Create `scripts/setup-cli-tools.sh`:

1. Detect locale (home vs work) by checking username or path
2. For each config in `tool-configs/`:
   - delta: append to `~/.gitconfig` if not already present
   - Starship: symlink `starship.toml` to `~/.config/starship.toml`
   - zoxide: source init snippet from `.bashrc` or `.bash_profile`
   - ntfy: read topic from `ntfy.conf`
3. Report what was configured

**Done when:** Script runs successfully at current locale, configs deployed to
expected locations.

### Step 7: Create download helper script

Create `scripts/install-cli-tools.sh`:

1. Read tool-manifest.json for tool list
2. Detect platform (Windows x86_64)
3. Detect available install methods at current locale:
   - Check for: winget, scoop, cargo, go, pip, npm/npx, curl
   - Build a capability profile (matches DIAGNOSIS.md locale assessment)
4. For each tool not already installed:
   - Choose best install method from what's available: Priority: winget/scoop →
     go install → pip → binary download → ~/bin/
   - Fall back to GitHub release binary download if no package manager has it
5. Verify each install with the `check` command from manifest
6. Report results: installed, already-present, failed

**Done when:** Script can install all 14 binary tools (Nerd Font and npm tools
handled separately).

---

## Phase 3: Install Tools — Current Locale

_Locale-agnostic: install script detects available package managers and chooses
the best method. Works at either home or work locale._

_Steps 8-14 can run in parallel (independent binary downloads)._

### Step 8: Install Nerd Font

**Per Decision D-16.**

1. Download JetBrains Mono Nerd Font from GitHub releases
2. Guide user to install the .ttf file (right-click → Install for current user)
3. Configure terminal to use the font

**Done when:** Font installed, terminal shows icons correctly (test with
`echo "  "` — should show file/folder icons, not boxes).

**Note:** This is a user-action step — Claude downloads, user installs the font.

### Step 9: Install foundation binaries (fzf, bat, fd, delta, zoxide, eza, ripgrep)

**Per Decisions D-09 through D-15.**

For each tool:

1. Download Windows x86_64 binary from GitHub releases via curl
2. Extract and copy .exe to `~/bin/`
3. Verify: run `<tool> --version`

**Done when:** All 7 tools respond to `--version` from any directory.

### Step 10: Configure delta as git pager

**Per Decision D-12.**

1. Run setup script or manually append to `~/.gitconfig`:
   ```
   [core]
       pager = delta
   [interactive]
       diffFilter = delta --color-only
   [delta]
       navigate = true
       side-by-side = true
       line-numbers = true
   ```
2. Test: `git diff` shows syntax-highlighted output

**Done when:** `git diff` and `git log -p` use delta automatically.

### Step 11: Configure zoxide shell init

**Per Decision D-13.**

1. Add to `~/.bashrc` or `~/.bash_profile`:
   ```bash
   eval "$(zoxide init bash)"
   ```
2. Test: `z` command available in new shell

**Done when:** `z <partial-path>` navigates to matching directory.

### Step 12: Configure Starship prompt

**Per Decision D-17.**

1. Download Starship binary → ~/bin/
2. Symlink or copy `tool-configs/starship.toml` to `~/.config/starship.toml`
3. Add to `~/.bashrc`:
   ```bash
   eval "$(starship init bash)"
   ```
4. Test: new terminal shows Starship prompt with git/node context

**Done when:** Terminal prompt shows branch name, Node version, and directory.

### Step 13: Install interactive tools (Yazi, lazygit)

**Per Decisions D-18, D-19.**

1. **Yazi:** Download Windows binary → ~/bin/
2. **lazygit:** `go install github.com/jesseduffield/lazygit@latest` (goes to
   ~/gopath/bin/ which is in PATH)
3. Verify both: `yazi --version`, `lazygit --version`

**Done when:** Both tools launch and display their TUI interfaces.

### Step 14: Install data tools (yq, gron, htmlq, difftastic)

**Per Decisions D-22, D-23, D-29, D-30.**

For each:

1. Download Windows binary from GitHub releases → ~/bin/
2. Verify: `<tool> --version`

**Done when:** All 4 tools respond to `--version`.

### Step 15: Install tsgo

**Per Decision D-33.**

1. `npm install -D @typescript/native-preview`
2. Test: `npx tsgo --noEmit` completes without crashes
3. If crashes: document the issue, keep `tsc` as primary, revisit later
4. If succeeds: update `type-check` npm script to use tsgo

**Done when:** tsgo runs successfully on SoNash codebase OR crash is documented
and tsc retained.

**AUDIT CHECKPOINT — Phase 3:** Run `scripts/install-cli-tools.sh --verify` or
manually confirm all tools respond to version checks at current locale. Run
`npm run lint:fast && npm run test` to confirm no regressions.

---

## Phase 4: Install Tools — Other Locale

_Executed at whichever locale was NOT used in Phase 3. Same steps, different
environment. The install script auto-detects and adapts._

### Step 16: Run setup at other locale

1. `git pull` to get tool-configs/, manifests, and scripts
2. Run `scripts/install-cli-tools.sh` — script detects locale capabilities and
   chooses best install method per tool (winget/scoop if available, go install,
   binary download, etc.)
3. Run `scripts/setup-cli-tools.sh` — deploys configs (delta, Starship, zoxide)
4. Install Nerd Font (same process as Step 8 — user action)
5. Verify all tools with manifest checks

**Done when:** All tools available at other locale, configs deployed, verified.

**Depends on:** Steps 4-7 (infrastructure), Steps 8-15 (first locale proves the
tools work).

---

## Phase 5: AI Integration Layer

### Step 17: Update CLAUDE.md with tool preferences

**Per Decisions D-05, D-37.**

Add a new section to CLAUDE.md (after Section 6):

```markdown
## 6b. CLI Tool Preferences

When the following tools are available (verified by session-start), prefer them:

| Available Tool    | Use Instead Of | When                                                                    |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `bat`             | `cat`          | Displaying file contents in Bash                                        |
| `fd`              | `find`         | File finding in Bash (Glob still preferred for simple patterns)         |
| `eza`             | `ls`           | Directory listings in Bash                                              |
| `rg` (standalone) | `grep`         | Text search in Bash pipes (Grep tool still preferred for direct search) |
| `delta`           | —              | Configured as git pager (automatic)                                     |
| `difft`           | `diff`         | Structural code diffs when semantic comparison needed                   |
| `yq`              | manual parsing | YAML/XML/CSV processing                                                 |
| `gron`            | —              | Exploring unknown JSON structures                                       |
| `htmlq`           | manual parsing | HTML content extraction in Bash pipes                                   |

Interactive tools (suggest to user when appropriate):

- `lazygit` — when user needs to review git state visually
- `yazi` — when user needs to browse files visually
- `fzf` — when interactive selection from a list would help
```

**Done when:** CLAUDE.md updated, preferences are availability-gated.

### Step 18: Update session-start hook for tool detection

**Per Decision D-36.**

Modify `.claude/hooks/session-start.js`:

1. Read `.claude/tool-manifest.json`
2. For each tool, run the `check` command
3. Build available/missing lists
4. If missing tools: output "⚠️ N CLI tools not found: [list]. Fix now?"
5. If all present: silent (no output)
6. Store available tools in a session variable for CLAUDE.md preference gating

**Done when:** Session-start reports missing tools (if any) and offers to fix.
Silent when all tools are present.

### Step 19: Add ntfy.sh notification hook

**Per Decisions D-25, D-39, D-40.**

1. Read ntfy topic from `tool-configs/ntfy.conf`
2. Add PostToolUse hook (Stop matcher) or session-end event:
   ```bash
   curl -s -d "Claude Code: Session ended" ntfy.sh/<topic>
   ```
3. Add "input needed" detection — when Claude asks a question and waits, send
   notification after 2-minute idle timeout
4. Test: trigger session-end, verify notification arrives on phone

**Done when:** Phone receives push notification on session-end. Input-needed
notification fires after 2-minute idle.

**Depends on:** User installs ntfy app on phone and subscribes to topic.
**Note:** This is a user-action step — Claude configures the hook, user sets up
the phone app.

---

## Phase 6: Verification & Documentation

### Step 20: Full verification pass

1. Run `scripts/install-cli-tools.sh --verify` to check all tools
2. Run `scripts/setup-cli-tools.sh --verify` to check all configs
3. Run `npm run lint:fast` (with type-aware rules)
4. Run `npm run test`
5. Run `npm run build`
6. Test ntfy notification
7. Test session-start hook tool detection

**Done when:** All checks pass, no regressions, notifications working.

### Step 21: Code review

Run code-reviewer agent on all new/modified files:

- `.claude/tool-manifest.json`
- `tool-configs/*`
- `scripts/setup-cli-tools.sh`
- `scripts/install-cli-tools.sh`
- `.claude/hooks/session-start.js` (modified)
- `.claude/settings.json` (modified for ntfy hook)
- `CLAUDE.md` (modified)
- `.oxlintrc.json` (modified)

**Done when:** Code review passes with no S0/S1 findings.

**AUDIT CHECKPOINT — Phase 5+6:** Full pipeline verification. All tools
installed, configs deployed, hooks updated, notifications working, tests pass.

---

## Phase 7: CLI User Guide

### Step 22: Write docs/CLI_USER_GUIDE.md

**Per Decisions D-08, D-41.**

Full reference guide covering every installed tool:

For each tool:

- **What it is** (one paragraph, non-developer friendly)
- **Why it's installed** (what problem it solves for you)
- **How to use it** (5-10 example commands with explanations)
- **How Claude uses it** (what Claude does with it automatically)
- **Configuration** (where config lives, how to customize)
- **Locale notes** (any differences between home and work)

Sections:

1. Overview & quick reference table
2. Foundation tools (fzf, bat, fd, delta, zoxide, eza, ripgrep)
3. Shell prompt (Starship)
4. Interactive tools (lazygit, Yazi)
5. Data tools (yq, gron, htmlq)
6. Git enhancement (delta, difftastic)
7. Notifications (ntfy.sh)
8. SoNash-specific (tsgo, Unlighthouse, oxlint type-aware)
9. Troubleshooting (tool not found, font issues, config problems)
10. Locale setup instructions

**Done when:** Guide written, reviewed, committed. User can reference any tool
and understand how to use it.

---

## Phase 8: Commit, Push & Home Locale Sync

### Step 23: Commit all artifacts

```
feat: CLI tools ecosystem — 16 tools + AI integration + user guide
```

Files:

- tool-configs/\*, scripts/setup-cli-tools.sh, scripts/install-cli-tools.sh
- .claude/tool-manifest.json, .claude/hooks/session-start.js (modified)
- .claude/settings.json (ntfy hook), CLAUDE.md (tool preferences)
- .oxlintrc.json (type-aware), docs/CLI_USER_GUIDE.md
- .planning/cli-tools-implementation/\*

### Step 24: Push and create PR

Push branch, create PR for review.

### Step 25: Other locale installation (separate session)

Execute Step 16 at the other locale after PR merge.

**Done when:** Both locales have all tools installed, configured, and verified.

---

## Execution Summary

| Phase                       | Steps | Parallelizable                      | Est. Effort |
| --------------------------- | ----- | ----------------------------------- | ----------- |
| 1: Configure existing       | 1-3   | No (sequential)                     | S (15 min)  |
| 2: Infrastructure           | 4-7   | Steps 4-5 parallel, 6-7 sequential  | M (30 min)  |
| 3: Install (current locale) | 8-15  | Steps 9-14 parallel                 | M (30 min)  |
| 4: Install (other locale)   | 16    | Separate session                    | S (15 min)  |
| 5: AI integration           | 17-19 | Steps 17-18 parallel, 19 sequential | M (30 min)  |
| 6: Verification             | 20-21 | Sequential                          | S (15 min)  |
| 7: User guide               | 22    | Independent                         | M (30 min)  |
| 8: Ship                     | 23-25 | Sequential                          | S (10 min)  |

**Total estimated effort:** ~3 hours across 2 sessions (work + home)

**Parallelization opportunities:**

- Steps 9-14 (binary downloads) can all run in parallel
- Steps 17-18 (CLAUDE.md + hook) can run in parallel
- Step 22 (user guide) can run in parallel with Phase 6 verification
