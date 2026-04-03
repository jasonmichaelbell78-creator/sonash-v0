# Findings: CLI Tools Implementation Plan Inventory

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-24
**Sub-Question IDs:** S-03

## 1. Step Inventory Table

### Phase 1: Configure Existing Tools (zero-install, immediate ROI)

| Step ID                 | Description                                     | Files Touched                      | Effort     | Dependencies (within plan) | Can Parallelize? |
| ----------------------- | ----------------------------------------------- | ---------------------------------- | ---------- | -------------------------- | ---------------- |
| Step 1                  | Enable oxlint type-aware rules                  | `.oxlintrc.json` (MODIFY existing) | S (10 min) | None                       | Yes (with 2, 3)  |
| Step 2                  | Verify `next experimental-analyze` availability | None (command probe + docs only)   | S (5 min)  | None                       | Yes (with 1, 3)  |
| Step 3                  | Explore Windows Terminal hidden features        | None (information gathering only)  | S (5 min)  | None                       | Yes (with 1, 2)  |
| **Audit Checkpoint P1** | Run lint:fast, build, test                      | None                               | S (5 min)  | Steps 1-3                  | No               |

### Phase 2: Infrastructure Setup (repo scaffolding)

| Step ID | Description                   | Files Touched                                                                                                                  | Effort     | Dependencies (within plan)                                | Can Parallelize?                      |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------- | ------------------------------------- |
| Step 4  | Create tool-configs directory | CREATE: `tool-configs/.gitconfig-delta`, `tool-configs/starship.toml`, `tool-configs/ntfy.conf`, `tool-configs/zoxide-init.sh` | S (10 min) | None                                                      | Yes (with 5)                          |
| Step 5  | Create tool manifest          | CREATE: `.claude/tool-manifest.json`                                                                                           | S (10 min) | None                                                      | Yes (with 4)                          |
| Step 6  | Create setup script           | CREATE: `scripts/setup-cli-tools.sh`                                                                                           | M (15 min) | Steps 4, 5 (needs configs to deploy and manifest to read) | No                                    |
| Step 7  | Create download helper script | CREATE: `scripts/install-cli-tools.sh`                                                                                         | M (20 min) | Step 5 (reads manifest)                                   | No (after 5, but can parallel with 6) |

### Phase 3: Install Tools -- Current Locale

| Step ID                 | Description                                                             | Files Touched                                                     | Effort     | Dependencies (within plan)            | Can Parallelize?           |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------------------------------- | -------------------------- |
| Step 8                  | Install Nerd Font (JetBrains Mono NF)                                   | None (external font install, user action)                         | S (5 min)  | None                                  | Yes (with 9-14)            |
| Step 9                  | Install foundation binaries (fzf, bat, fd, delta, zoxide, eza, ripgrep) | External: 7 binaries to `~/bin/`                                  | M (15 min) | Step 7 (uses install script)          | Yes (with 8, 10-14)        |
| Step 10                 | Configure delta as git pager                                            | MODIFY: `~/.gitconfig` (external, not in repo)                    | S (5 min)  | Step 9 (delta must be installed)      | No (after 9)               |
| Step 11                 | Configure zoxide shell init                                             | MODIFY: `~/.bashrc` or `~/.bash_profile` (external)               | S (3 min)  | Step 9 (zoxide must be installed)     | No (after 9)               |
| Step 12                 | Configure Starship prompt                                               | MODIFY: `~/.bashrc` (external), symlink `~/.config/starship.toml` | S (5 min)  | Step 4 (config file), binary download | No (after 9-level install) |
| Step 13                 | Install interactive tools (Yazi, lazygit)                               | External: 2 binaries to `~/bin/` or `~/gopath/bin/`               | S (5 min)  | Step 7 (uses install script)          | Yes (with 9, 14)           |
| Step 14                 | Install data tools (yq, gron, htmlq, difftastic)                        | External: 4 binaries to `~/bin/`                                  | S (5 min)  | Step 7 (uses install script)          | Yes (with 9, 13)           |
| Step 15                 | Install tsgo                                                            | MODIFY: `package.json` (devDependency), `package-lock.json`       | S (5 min)  | None (npm install, independent)       | Yes (with 8-14)            |
| **Audit Checkpoint P3** | Verify all tools, run lint:fast + test                                  | None                                                              | S (5 min)  | Steps 8-15                            | No                         |

### Phase 4: Install Tools -- Other Locale

| Step ID | Description               | Files Touched                                     | Effort     | Dependencies (within plan)                        | Can Parallelize?          |
| ------- | ------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------- | ------------------------- |
| Step 16 | Run setup at other locale | External: same as Steps 8-15 at different machine | M (15 min) | Steps 4-7 (infra), Steps 8-15 (proves tools work) | Separate session entirely |

### Phase 5: AI Integration Layer

| Step ID | Description                                  | Files Touched                                                                         | Effort     | Dependencies (within plan)        | Can Parallelize?                     |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------------- | ---------- | --------------------------------- | ------------------------------------ |
| Step 17 | Update CLAUDE.md with tool preferences       | MODIFY: `CLAUDE.md` (add Section 6b)                                                  | S (10 min) | None                              | Yes (with 18)                        |
| Step 18 | Update session-start hook for tool detection | MODIFY: `.claude/hooks/session-start.js` (1077 lines, existing)                       | M (20 min) | Step 5 (reads tool-manifest.json) | Yes (with 17)                        |
| Step 19 | Add ntfy.sh notification hook                | MODIFY: `.claude/settings.json` (174 lines, existing); reads `tool-configs/ntfy.conf` | M (20 min) | Step 4 (ntfy.conf must exist)     | No (sequential after 17-18 per plan) |

### Phase 6: Verification & Documentation

| Step ID | Description                       | Files Touched                 | Effort     | Dependencies (within plan) | Can Parallelize? |
| ------- | --------------------------------- | ----------------------------- | ---------- | -------------------------- | ---------------- |
| Step 20 | Full verification pass            | None (read-only verification) | S (10 min) | Steps 1-19                 | No               |
| Step 21 | Code review (code-reviewer agent) | None (review-only)            | S (10 min) | Step 20                    | No               |

### Phase 7: CLI User Guide

| Step ID | Description                  | Files Touched                    | Effort     | Dependencies (within plan)                        | Can Parallelize?          |
| ------- | ---------------------------- | -------------------------------- | ---------- | ------------------------------------------------- | ------------------------- |
| Step 22 | Write docs/CLI_USER_GUIDE.md | CREATE: `docs/CLI_USER_GUIDE.md` | M (30 min) | Steps 1-15 (needs to document what was installed) | Can parallel with Phase 6 |

### Phase 8: Commit, Push & Home Locale Sync

| Step ID | Description                                  | Files Touched          | Effort     | Dependencies (within plan) | Can Parallelize? |
| ------- | -------------------------------------------- | ---------------------- | ---------- | -------------------------- | ---------------- |
| Step 23 | Commit all artifacts                         | All new/modified files | S (5 min)  | Steps 1-22                 | No               |
| Step 24 | Push and create PR                           | None (git operation)   | S (5 min)  | Step 23                    | No               |
| Step 25 | Other locale installation (separate session) | External only          | M (15 min) | Step 24 (needs PR merged)  | Separate session |

**Total steps: 25** (plus 3 audit checkpoints)

---

## 2. External Touchpoints

### Files CREATED by this plan (do not exist yet -- verified via filesystem)

| File/Directory                  | Created In Step | Purpose                                              |
| ------------------------------- | --------------- | ---------------------------------------------------- |
| `tool-configs/` (directory)     | Step 4          | Config file directory for synced tool configs        |
| `tool-configs/.gitconfig-delta` | Step 4          | Delta pager config snippet                           |
| `tool-configs/starship.toml`    | Step 4          | Starship prompt configuration                        |
| `tool-configs/ntfy.conf`        | Step 4          | ntfy topic name and preferences                      |
| `tool-configs/zoxide-init.sh`   | Step 4          | Zoxide shell initialization snippet                  |
| `.claude/tool-manifest.json`    | Step 5          | Tool registry for session-start detection (16 tools) |
| `scripts/setup-cli-tools.sh`    | Step 6          | Deploys configs to expected OS locations per locale  |
| `scripts/install-cli-tools.sh`  | Step 7          | Downloads and installs binary tools                  |
| `docs/CLI_USER_GUIDE.md`        | Step 22         | Full user-facing reference guide                     |

### Files MODIFIED by this plan (exist now -- verified)

| File                                 | Modified In Step | Current Size | Nature of Change                                     |
| ------------------------------------ | ---------------- | ------------ | ---------------------------------------------------- |
| `.oxlintrc.json`                     | Step 1           | exists       | Add type-aware typescript rule categories            |
| `CLAUDE.md`                          | Step 17          | ~200 lines   | Add Section 6b (CLI Tool Preferences table)          |
| `.claude/hooks/session-start.js`     | Step 18          | 1077 lines   | Add tool-manifest reading + availability check logic |
| `.claude/settings.json`              | Step 19          | 174 lines    | Add ntfy PostToolUse/session-end hook configuration  |
| `package.json` / `package-lock.json` | Step 15          | exists       | Add `@typescript/native-preview` devDependency       |

### External (non-repo) files modified

| File                             | Modified In Step | Notes                                   |
| -------------------------------- | ---------------- | --------------------------------------- |
| `~/.gitconfig`                   | Step 10          | Delta pager config appended             |
| `~/.bashrc` or `~/.bash_profile` | Steps 11, 12     | zoxide init + Starship init eval lines  |
| `~/.config/starship.toml`        | Step 12          | Symlink to `tool-configs/starship.toml` |
| `~/bin/`                         | Steps 9, 12-14   | 14 binary executables installed         |
| Font directory                   | Step 8           | JetBrains Mono Nerd Font .ttf installed |

### Skills, hooks, or agent definitions affected

| Artifact                         | Step    | Change Type                                |
| -------------------------------- | ------- | ------------------------------------------ |
| `.claude/hooks/session-start.js` | Step 18 | MODIFY -- add tool detection logic         |
| `.claude/settings.json`          | Step 19 | MODIFY -- add ntfy notification hook entry |
| CLAUDE.md agent instructions     | Step 17 | MODIFY -- add tool preference section      |

### External tools installed (complete list)

| Tool              | Install Method (Work)                       | Install Method (Home) | Step            |
| ----------------- | ------------------------------------------- | --------------------- | --------------- |
| fzf               | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| bat               | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| fd                | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| delta             | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| zoxide            | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| eza               | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| ripgrep           | GitHub release binary -> ~/bin/             | winget/scoop          | Step 9          |
| Starship          | GitHub release binary -> ~/bin/             | winget                | Step 12         |
| Yazi              | GitHub release binary -> ~/bin/             | winget/scoop          | Step 13         |
| lazygit           | `go install` (-> ~/gopath/bin/)             | winget/scoop          | Step 13         |
| yq                | GitHub release binary -> ~/bin/             | winget/scoop          | Step 14         |
| gron              | GitHub release binary -> ~/bin/             | scoop                 | Step 14         |
| htmlq             | GitHub release binary -> ~/bin/             | scoop                 | Step 14         |
| difftastic        | GitHub release binary -> ~/bin/             | winget/scoop          | Step 14         |
| tsgo              | `npm install -D @typescript/native-preview` | Same (npm)            | Step 15         |
| Unlighthouse      | `npx unlighthouse` (zero install)           | Same (npx)            | Documented only |
| JetBrains Mono NF | GitHub release .ttf download                | Same                  | Step 8          |
| ntfy.sh           | Zero-install (curl to cloud service)        | Same                  | Step 19         |

---

## 3. Effort Summary

### Per-phase effort (from plan's own estimates, verified against step detail)

| Phase                       | Steps | Plan Estimate | My Assessment   | Notes                                                                                                                 |
| --------------------------- | ----- | ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Phase 1: Configure existing | 1-3   | S (15 min)    | S (15 min)      | Accurate -- config tweaks + command probing                                                                           |
| Phase 2: Infrastructure     | 4-7   | M (30 min)    | M-L (30-45 min) | Script writing (Steps 6-7) could take longer; install script has locale detection, platform detection, fallback logic |
| Phase 3: Install (current)  | 8-15  | M (30 min)    | M (20-40 min)   | Highly variable -- depends on network speed and GitHub rate limits. Binary downloads are parallel-eligible.           |
| Phase 4: Install (other)    | 16    | S (15 min)    | S (15 min)      | Just running existing scripts at other locale                                                                         |
| Phase 5: AI integration     | 17-19 | M (30 min)    | M (30-40 min)   | Hook modification (Step 18) touches a 1077-line file; ntfy hook (Step 19) is novel integration                        |
| Phase 6: Verification       | 20-21 | S (15 min)    | S (15-20 min)   | Straightforward but depends on everything else passing                                                                |
| Phase 7: User guide         | 22    | M (30 min)    | M-L (30-45 min) | 10-section guide covering 16+ tools with examples                                                                     |
| Phase 8: Ship               | 23-25 | S (10 min)    | S (10 min)      | Standard git operations                                                                                               |

**Total plan estimate:** ~3 hours across 2 sessions **My assessment:** ~3-4
hours across 2 sessions (plan estimate is slightly optimistic on Phases 2, 5, 7)

### Complexity Assessment

| Aspect                   | Rating      | Rationale                                                                                                            |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Code complexity          | LOW-MEDIUM  | Shell scripts + JSON configs + JS hook modifications. No application code.                                           |
| Integration complexity   | MEDIUM      | Modifying session-start.js (1077 lines), settings.json, CLAUDE.md -- all critical agent infra                        |
| Platform complexity      | MEDIUM-HIGH | Windows binary downloads, path handling, shell init files, font installation, two-locale variance                    |
| External dependency risk | MEDIUM      | GitHub release downloads (network), `go install` (Go toolchain), font install (user action), ntfy.sh (cloud service) |

### Risk level per step

| Step(s) | Risk       | Rationale                                                                                              |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| 1       | LOW        | Config change with immediate test verification                                                         |
| 2       | LOW        | Probe only, no changes if unavailable                                                                  |
| 3       | LOW        | Information gathering, no changes                                                                      |
| 4-5     | LOW        | Creating new files, no conflicts                                                                       |
| 6-7     | MEDIUM     | Script correctness -- locale detection, platform detection, error handling must be robust              |
| 8       | LOW        | Font install is user-manual action, low risk                                                           |
| 9       | MEDIUM     | 7 binary downloads -- GitHub rate limits, archive format variance, Windows binary naming inconsistency |
| 10-12   | LOW-MEDIUM | Modifying shell dotfiles -- risk of breaking existing shell config if not careful with append logic    |
| 13      | MEDIUM     | lazygit via `go install` depends on Go toolchain availability and version                              |
| 14      | LOW        | Standard binary downloads                                                                              |
| 15      | MEDIUM     | tsgo is explicitly noted as potentially crash-prone; plan accounts for this with fallback              |
| 16      | LOW        | Re-running proven scripts at second locale                                                             |
| 17      | LOW        | Adding a section to CLAUDE.md                                                                          |
| 18      | MEDIUM     | Modifying a 1077-line session-start hook -- must not break existing functionality                      |
| 19      | MEDIUM     | Novel ntfy integration; idle-timeout detection (2-min) is non-trivial for hooks                        |
| 20-21   | LOW        | Verification and review only                                                                           |
| 22      | LOW        | Documentation writing                                                                                  |
| 23-25   | LOW        | Standard git/PR workflow                                                                               |

### External dependency risks

| Dependency                            | Risk   | Mitigation in Plan                                                          |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| GitHub release API (rate limits)      | MEDIUM | Install script has fallback methods; can use authenticated requests         |
| Network access at work locale         | MEDIUM | Plan relies on curl/GitHub downloads; blocked ports could prevent downloads |
| Go toolchain (for lazygit)            | LOW    | D-07 confirms `go install` works at work locale                             |
| ntfy.sh cloud service                 | LOW    | Free tier, well-established (29k stars), but external dependency            |
| User action (font install, phone app) | LOW    | Clearly marked as user-action steps; not blocking for other steps           |
| npm registry (for tsgo)               | LOW    | Standard npm install, same as any dev dependency                            |
| Windows binary compatibility          | LOW    | All tools explicitly offer Windows x86_64 builds per research               |

---

## 4. Pre/Post Conditions

### Pre-conditions (what must be true before this plan starts)

1. **`~/bin/` exists and is in PATH** -- Plan assumes this (D-03 notes "already
   in PATH, proven pattern"). Verified by DECISIONS.md.
2. **Go toolchain available** -- Required for lazygit `go install` (D-07
   confirms this at work locale).
3. **Git Bash shell available** -- Plan uses bash syntax throughout. Platform is
   Windows 11 with Git Bash.
4. **curl available** -- Required for GitHub release downloads and ntfy.sh
   integration.
5. **npm/npx available** -- Required for tsgo install and Unlighthouse.
6. **Network access** -- Steps 8-15 download binaries from GitHub; Step 19 uses
   ntfy.sh cloud.
7. **`.claude/hooks/session-start.js` exists** -- Confirmed (1077 lines). Step
   18 modifies it.
8. **`.claude/settings.json` exists** -- Confirmed (174 lines). Step 19 modifies
   it.
9. **`.oxlintrc.json` exists** -- Confirmed. Step 1 modifies it.
10. **No other plan is simultaneously modifying CLAUDE.md, session-start.js, or
    settings.json** -- These are shared files that multiple plans could touch.

### Post-conditions (what will be true after this plan completes)

1. **16 CLI tools installed and verified** at current locale (all respond to
   `--version`)
2. **JetBrains Mono Nerd Font installed** -- terminal shows icons correctly
3. **Tool configs synced via git** -- `tool-configs/` directory with delta,
   Starship, zoxide, ntfy configs
4. **Install/setup scripts available** -- `scripts/install-cli-tools.sh` and
   `scripts/setup-cli-tools.sh` for repeatable setup
5. **Tool manifest exists** -- `.claude/tool-manifest.json` with 16 tool
   definitions
6. **Session-start detects tool availability** -- warns on missing tools, silent
   when all present
7. **CLAUDE.md includes tool preferences** -- availability-gated preference
   table (Section 6b)
8. **ntfy.sh notifications working** -- push notifications on session-end and
   2-min idle
9. **oxlint type-aware rules enabled** -- broader lint coverage at ~20-40x speed
10. **CLI User Guide written** -- `docs/CLI_USER_GUIDE.md` with per-tool
    documentation
11. **tsgo evaluated** -- either working as type-check replacement or documented
    as crash-prone with tsc retained
12. **Other locale has same tools** (after Step 25 in separate session)

### What other plans benefit from this plan completing first?

| Benefiting Plan                   | How It Benefits                                                                                                                               | Strength of Dependency                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **custom-statusline**             | Starship prompt (Step 12) could conflict with or complement custom statusline; tool-manifest.json pattern could be reused                     | WEAK -- statusline is a Go binary, largely independent. But Starship in bashrc and a custom statusline could interfere. |
| **passive-surfacing-remediation** | ntfy.sh integration (Step 19) adds a new surfacing channel; session-start hook changes (Step 18) are in same file passive-surfacing may touch | MEDIUM -- if passive-surfacing also modifies session-start.js or settings.json, coordination needed                     |
| **agent-environment-analysis**    | Tool-manifest.json and session-start hook detection establish a pattern for environment capability detection                                  | WEAK -- useful pattern but not blocking                                                                                 |
| **system-wide-standardization**   | CLAUDE.md modifications (Step 17) must conform to SWS standards; tool-manifest.json is a new artifact SWS may want to govern                  | WEAK -- SWS is far out; cli-tools changes will be in place long before                                                  |
| **repo-cleanup**                  | No direct benefit. But if repo-cleanup runs first, it removes cruft that cli-tools would otherwise work around                                | REVERSE dependency -- repo-cleanup benefits cli-tools, not the other way around                                         |
| **propagation-research**          | No meaningful dependency                                                                                                                      | NONE                                                                                                                    |

---

## 5. Platform Observations (Windows 11 + Git Bash)

### Linux-only assumptions in the plan (potential issues)

1. **Symlink in Step 12**:
   `symlink tool-configs/starship.toml to ~/.config/starship.toml` -- Windows
   symlinks require elevated privileges or Developer Mode enabled. The plan
   should use `cp` as fallback or verify symlink capability. The setup script
   (Step 6) should handle this.

2. **Shell init files**: Plan references both `~/.bashrc` and `~/.bash_profile`.
   On Windows/Git Bash, `~/.bash_profile` is more commonly sourced. The setup
   script should detect which file is active.

3. **`eval "$(zoxide init bash)"`** and **`eval "$(starship init bash)"`**:
   These work in Git Bash. No issue.

4. **Font installation**: Plan correctly notes this as a user-action step
   (right-click -> Install). Windows-appropriate.

5. **`go install`**: Works on Windows if Go is in PATH. D-07 confirms
   availability at work locale.

6. **GitHub release binary naming**: Windows binaries are often
   `*-x86_64-pc-windows-msvc.zip` or `*-windows-amd64.exe`. The install script
   (Step 7) must handle Windows-specific archive formats (.zip, not .tar.gz).

---

## 6. Shared File Conflict Analysis

These files are modified by cli-tools AND potentially by other active plans:

| File                             | cli-tools Step           | Other Plans That May Touch It     | Conflict Risk                                                                |
| -------------------------------- | ------------------------ | --------------------------------- | ---------------------------------------------------------------------------- |
| `CLAUDE.md`                      | Step 17 (add Section 6b) | SWS, passive-surfacing, agent-env | MEDIUM -- additive change, low merge conflict risk if sections don't overlap |
| `.claude/hooks/session-start.js` | Step 18                  | passive-surfacing, agent-env      | HIGH -- same file, complex logic, concurrent modifications could conflict    |
| `.claude/settings.json`          | Step 19                  | Any plan adding hooks             | MEDIUM -- JSON structure, additive entries                                   |
| `package.json`                   | Step 15                  | Any plan adding npm deps          | LOW -- devDependency addition, standard merge                                |

---

## Sources

| #   | Path/URL                                          | Title                          | Type            | Trust   | Date       |
| --- | ------------------------------------------------- | ------------------------------ | --------------- | ------- | ---------- |
| 1   | `.planning/cli-tools-implementation/PLAN.md`      | CLI Tools Implementation Plan  | Plan document   | HIGH    | 2026-03-23 |
| 2   | `.planning/cli-tools-implementation/DECISIONS.md` | CLI Tools Decisions            | Decision log    | HIGH    | 2026-03-23 |
| 3   | `.planning/plan-orchestration/DIAGNOSIS.md`       | Plan Orchestration Diagnosis   | Context doc     | HIGH    | 2026-03-23 |
| 4   | `.research/cli-tools/RESEARCH_OUTPUT.md`          | CLI Tools Research Report      | Research output | HIGH    | 2026-03-23 |
| 5   | Filesystem verification                           | ls/wc checks on existing files | Ground truth    | HIGHEST | 2026-03-24 |

## Contradictions

1. **Plan says Steps 4-5 parallel, 6-7 sequential (Phase 2 summary table)**. But
   Step 7 only depends on Step 5 (reads manifest), not Step 6. Steps 6 and 7
   could be parallelized since they are independent scripts that both read from
   the manifest but do not depend on each other. The plan's summary table may be
   slightly conservative.

2. **Plan says "16 tools" but manifest has 14 entries**. The plan header says
   "16 tools + 1 font + 2 config changes" in DECISIONS.md (line 64). The
   tool-manifest.json in Step 5 lists exactly 14 tools (fzf, bat, fd, delta,
   zoxide, eza, rg, starship, yazi, lazygit, yq, gron, htmlq, difftastic). The
   missing 2 are tsgo (npm, not a binary -- not in manifest) and ntfy
   (curl-based, not a binary -- not in manifest). Unlighthouse is npx-only and
   also not in the manifest. The "16 tools" count is correct at the plan level
   but the manifest covers 14.

## Gaps

1. **Unlighthouse is mentioned in DECISIONS.md (D-34) but has NO step in the
   plan**. It is listed as "npx (zero install)" in the decision table and
   appears in the CLI User Guide outline (Step 22, section 8), but there is no
   installation or verification step. This is likely intentional (npx = zero
   install) but it means there is no verification that `npx unlighthouse`
   actually works.

2. **No rollback plan**. If tool installation breaks the shell environment
   (e.g., bad .bashrc modification), there is no documented rollback procedure.

3. **ntfy idle-timeout detection (Step 19)** is described as "send notification
   after 2-minute idle timeout" but the implementation mechanism is unclear.
   Claude Code hooks have specific trigger patterns (PreToolUse, PostToolUse,
   etc.) -- how an idle timeout would be implemented within hook constraints is
   not detailed.

4. **Phase 1 status**: DIAGNOSIS.md says "Phase 1 done" for cli-tools, but the
   plan shows Phase 1 as Steps 1-3 (configure existing tools). It is unclear if
   this means Steps 1-3 are already completed or if "Phase 1" in DIAGNOSIS.md
   refers to something else (possibly the research/planning phase).

## Serendipity

1. **Session-start.js is a critical shared resource** (1077 lines). Three plans
   may need to modify it (cli-tools, passive-surfacing, potentially agent-env).
   The orchestrator should sequence these modifications or establish a merge
   protocol.

2. **The install script (Step 7) is the most reusable artifact**. Once built, it
   serves both locales and can be extended for future tool additions without
   plan-level changes.

3. **tsgo (Step 15) has a built-in escape hatch**. The plan explicitly accounts
   for crash scenarios ("If crashes: document the issue, keep tsc as primary").
   This is good defensive planning that other steps lack.

## Convergence Loop Verification

1. **Step count verification**: Plan has 25 numbered steps across 8 phases. My
   inventory has 25 steps. MATCH.

2. **File path verification**: Checked filesystem -- confirmed `.oxlintrc.json`,
   `.claude/hooks/session-start.js`, `.claude/settings.json` exist. Confirmed
   `tool-configs/`, `.claude/tool-manifest.json`, `scripts/setup-cli-tools.sh`,
   `scripts/install-cli-tools.sh`, `docs/CLI_USER_GUIDE.md` do NOT exist (will
   be created). VERIFIED.

3. **Platform verification**: Install commands use `~/bin/`, curl for GitHub
   releases, `go install` -- all Windows/Git Bash compatible. Symlink in Step 12
   flagged as potential issue. VERIFIED with caveat noted.

4. **Effort estimates**: Plan's own summary table totals ~3 hours. My assessment
   is ~3-4 hours, with Phases 2, 5, and 7 slightly underestimated. GROUNDED in
   plan text and file size analysis.

5. **Sub-steps and conditional branches**: Step 2 has an if/else (available vs
   unavailable). Step 15 has an if/else (tsgo works vs crashes). Step 1 has a
   conditional (new violations -> triage). All captured. COMPLETE.

**Corrections made during convergence loop:**

- Added Unlighthouse gap (D-34 exists but no plan step)
- Clarified the "16 tools" vs "14 manifest entries" discrepancy
- Added Phase 1 status ambiguity from DIAGNOSIS.md

## Confidence Assessment

- HIGH claims: 18 (file existence, step inventory, tool lists, effort structure)
- MEDIUM claims: 6 (effort estimates, conflict risks, platform caveats)
- LOW claims: 1 (ntfy idle-timeout implementation feasibility)
- UNVERIFIED claims: 0
- Overall confidence: HIGH
