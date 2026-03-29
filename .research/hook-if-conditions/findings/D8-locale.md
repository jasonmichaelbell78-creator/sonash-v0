# Findings: Cross-Locale Constraints and Hook `if` Proposals

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-29
**Sub-Question IDs:** D8 (locale constraints)

---

## Summary

This project operates from two Windows locales: HOME (jason, unrestricted, winget/cargo/go)
and WORK (jbell, no admin, tools installed to ~/bin via GitHub releases). Hooks are shared
via `.claude/settings.json` in git. The locale constraint analysis reveals three key findings:

1. The `if` conditions already in settings.json are locale-safe (they use `Bash(git *)`
   patterns that work identically on both locales).
2. The primary cross-locale risk is `ensure-fnm.sh` failing if fnm is absent at work,
   which affects ALL hooks (not the `if` conditions themselves).
3. `settings.local.json` contains zero hooks — it is permissions-only — so there is no
   existing mechanism for locale-specific hook behavior.

---

## Key Findings

### 1. Hooks Are Project-Level and Shared — No Locale-Specific Hooks Exist [CONFIDENCE: HIGH]

All 17 hooks in `.claude/settings.json` are project-level and committed to git, meaning
they run identically at both HOME and WORK locales. The file contains:

- 3 hooks with `if` conditions (P6, P7, P14 — all `Bash(git *)` patterns)
- 14 hooks without `if` conditions
- 5 hooks with `continueOnError: true` (SessionStart helpers + commit-tracker)
- 12 hooks with `continueOnError` absent/false — failures are hard failures

`.claude/settings.local.json` contains **no hooks at all** — it is permissions-only
(Go binary path allows + `cargo install` allow). It has no mechanism for locale-specific
hook behavior.

User-level hooks (`~/.claude/settings.json`) are locale-specific by definition (different
home directories). The HOME locale has 4 user hooks (gsd-check-update, gsd-context-monitor,
ccstatusline PreToolUse, ccstatusline UserPromptSubmit). The WORK locale user hooks are
unknown — the file at `C:\Users\jbell\.claude\settings.json` is not accessible from this
machine.

**Source:** `.claude/settings.json` (direct read), `.claude/settings.local.json` (direct
read), `~/.claude/settings.json` (direct read), canonical memory
`project_cross_locale_config.md`.

---

### 2. The Three Existing `if` Conditions Are Locale-Safe [CONFIDENCE: HIGH]

The three `if` conditions currently in `settings.json` are:

| Hook | `if` condition |
|------|----------------|
| `block-push-to-main.js` | `Bash(git push *)` |
| `pre-commit-agent-compliance.js` | `Bash(git commit *)` |
| `commit-tracker.js` | `Bash(git commit *)\|Bash(git cherry-pick *)\|Bash(git merge *)\|Bash(git revert *)` |

All three match against the Bash command string (not file paths). `git` is in Git Bash's
built-in PATH at both locales — it does not require winget, cargo, go, or admin access.
The word "git" is typed literally in commands, so there are no PATH-expansion differences
between locales.

**Path separator risk:** Zero. These conditions use `Bash(...)` matching against command
strings, not `Edit(...)` or `Write(...)` matching against file paths. Path separator
issues (Windows backslash vs POSIX slash) only affect file-path `if` conditions.

**Tool availability risk:** Zero for the `if` pattern evaluation itself. The `if` field
is evaluated by Claude Code's internal pattern engine before any subprocess spawns —
it requires no external tool.

**Source:** Direct inspection of `.claude/settings.json` lines 74, 80, 154. Cross-
referenced with D1-spec.md finding #5 (path separator normalization only affects
Edit/Write/Read patterns).

---

### 3. The Real Cross-Locale Risk Is `ensure-fnm.sh`, Not `if` Conditions [CONFIDENCE: HIGH]

Every single project-level hook invokes the `ensure-fnm.sh` wrapper:
```
bash .claude/hooks/ensure-fnm.sh node .claude/hooks/<script>.js
```

`ensure-fnm.sh` requires `fnm` to be installed and on PATH. If fnm is absent, it exits
with code 1 (`exit 1` — a hard error). At the WORK locale (jbell, no admin, no winget),
fnm must be installed manually to `~/bin` or equivalent. If it is not, **all 17 project
hooks fail at the wrapper stage before any `if` condition or hook script is even reached**.

Risk by hook:

| Hook Category | `continueOnError` | Failure Consequence |
|---------------|-------------------|---------------------|
| `session-start.js` | **false** | Session start BLOCKED |
| `compact-restore.js` | **false** | Post-compaction recovery fails silently |
| `block-push-to-main.js` | **false** | Push NOT blocked — safety gate fails open |
| `pre-commit-agent-compliance.js` | **false** | Compliance check skipped — commits unguarded |
| `pre-compaction-save.js` | **false** | State not saved before compaction |
| `post-write-validator.js` (Write/Edit/MultiEdit) | **false** | All write validation fails |
| `post-read-handler.js` | **false** | Context tracking fails |
| `decision-save-prompt.js` | **false** | Decision capture skipped |
| `track-agent-invocation.js` | **false** | Agent log incomplete |
| `user-prompt-handler.js` | **false** | Guardrail injection fails |
| `check-mcp-servers.js` | true | Soft fail, session continues |
| `check-remote-session-context.js` | true | Soft fail, session continues |
| `global/gsd-check-update.js` | true | Soft fail |
| `commit-tracker.js` | true | Soft fail |
| Notification curl | N/A | Not affected (no fnm needed) |

The critical hooks (`session-start`, `block-push-to-main`, `pre-commit-agent-compliance`,
`post-write-validator`) have no `continueOnError` and will hard-fail at work if fnm is
absent.

**fnm install path at work:** `install-cli-tools.sh` does NOT install fnm — it only
covers the tools in `tool-manifest.json` (fzf, bat, fd, delta, zoxide, eza, rg, etc.).
fnm is not in the tool manifest. At HOME, fnm is installed via winget
(`/c/Users/jason/AppData/Local/Microsoft/WinGet/Links/fnm`). At WORK (no winget), fnm
must be installed separately — the codebase has no automated path for this.

**Source:** `.claude/hooks/ensure-fnm.sh` (direct read, lines 10–13 show exit 1 on
missing fnm), `node` mapping output of all hooks with `continueOnError` status,
`scripts/install-cli-tools.sh` (direct read — fnm absent from WINGET_IDS and GITHUB_REPOS).

---

### 4. PATH Differences Do Not Affect `Bash(...)` `if` Conditions [CONFIDENCE: HIGH]

The `if` condition `Bash(git push *)` is matched by Claude Code's internal pattern engine
against the literal command string submitted to the Bash tool, before any subprocess
spawns. This is a string comparison, not a shell execution. PATH differences between
locales (HOME has `C:\Program Files\Go\bin`, `~/.cargo/bin` in PATH; WORK may not) are
irrelevant to the `if` pattern evaluation.

PATH differences would only matter if:
1. A proposed `if` condition tried to match a tool that is only on PATH at one locale
   (e.g., `Bash(cargo *)` — cargo is HOME only via `~/.cargo/bin`)
2. A hook script itself invokes a tool that is locale-specific

For the existing `if` conditions (`git push`, `git commit`), git is in Git Bash at both
locales.

**Proposed `if` conditions from other agents (D3-optimization.md) reviewed:**
- No proposed `if` conditions from D3 use locale-specific commands. The D3 proposals
  for `post-write-validator` were SKIP (no viable narrowing), meaning no new `if`
  conditions were proposed for tools with locale-specific availability.

**Source:** D3-optimization.md, D9-risks.md finding #6 (Windows path issues affect only
file path `if` patterns), direct PATH inspection at HOME locale.

---

### 5. File Path `if` Conditions Would Have Windows Path Separator Issues at Both Locales [CONFIDENCE: HIGH]

If any future `if` condition uses `Edit(...)`, `Write(...)`, or `Read(...)` patterns with
file paths, both locales face the same Windows path separator issue documented in D9-risks
finding #6: Claude generates Windows-style backslash paths, but the glob matcher treats
`\` as escape characters.

For example, `if: "Edit(src/**/*.ts)"` may not match `src\components\Dashboard.tsx`
passed by Claude Code on Windows. This is not a locale-specific issue — it affects both
HOME and WORK equally. The workaround (POSIX-normalized `//c/**/*.ts` patterns) applies
at both locales.

**Current hooks:** None of the existing 17 project hooks use file path `if` conditions.
All existing `if` conditions are `Bash(...)` patterns. This risk is theoretical for
future proposals.

**Source:** D9-risks.md finding #6, cross-confirmed with D1-spec.md finding #5.

---

### 6. The Notification Hook Has a Locale-Specific Concern — Not `if` Related [CONFIDENCE: MEDIUM]

The Notification hook runs:
```
curl -s -d "Claude Code needs your attention" ntfy.sh/sonash-claude
```
This does not use `ensure-fnm.sh`, so fnm absence at work does not affect it. `curl`
is available in Git Bash's mingw environment at both locales
(`/mingw64/bin/curl` confirmed at HOME). The notification itself fires to a shared
`ntfy.sh/sonash-claude` channel regardless of locale — meaning both HOME and WORK
locales send to the same channel. This is not an `if` condition concern but is a
locale-awareness gap: there is no per-locale notification routing.

**Source:** `.claude/settings.json` line 188–192, `which curl` output.

---

### 7. `settings.local.json` Cannot Override or Extend Hooks — Permissions Only [CONFIDENCE: HIGH]

The Claude Code settings layering is: user-level (`~/.claude/settings.json`) + project
(`.claude/settings.json`) + project-local (`.claude/settings.local.json`). Based on
inspection of `.claude/settings.local.json`, it contains only a `permissions.allow`
array (Go binary path permissions for statusline build at HOME locale). It has no
`hooks` key.

Even if Claude Code supports hook merging/override in `settings.local.json` (not
confirmed in docs — the feature may exist), this project does not use it. Adding
locale-specific hooks would require:
- Adding a `hooks` key to `.claude/settings.local.json` (which is gitignored or
  locale-specific) — but `.claude/settings.local.json` **is currently committed to git**,
  which means it is shared across locales. It would need to become a truly local file
  (or a separate `.claude/settings.work.json`) to host locale-specific hooks.

**The settings.local.json is committed to the repo.** It is not locale-specific in
practice because it is tracked by git. Both locales would receive the same file on
`git pull`. It cannot currently serve as a work-vs-home differentiator.

**Source:** `.claude/settings.local.json` (direct read), `git status` showing the file
is modified (tracked), canonical memory `project_cross_locale_config.md`.

---

### 8. Could `if` Enable Locale-Aware Behavior? — Limited and Indirect [CONFIDENCE: MEDIUM]

The `if` field evaluates tool call arguments (for tool events). It cannot directly
detect locale — there is no `if: "LOCALE=work"` syntax. However, indirect locale
detection is theoretically possible in hook scripts via:
- `process.env.USERNAME` — `jason` at HOME, `jbell` at WORK
- `process.env.USERPROFILE` — different paths per locale
- The presence/absence of specific tools (cargo, go, winget)

But these detections would be inside hook scripts, not in `if` conditions. The `if`
field cannot express environment variables or tool availability checks — it is limited
to `ToolName(argument_pattern)` syntax.

**Practical conclusion:** `if` conditions are the wrong layer for locale-aware behavior.
Locale awareness must live inside hook scripts (branching on `process.env.USERNAME`) or
in a separate `settings.local.json` that is genuinely not shared across locales.

**Source:** D1-spec.md finding #2 (complete syntax format), no official documentation
for env-var-based `if` conditions found.

---

### 9. The statusline Binary Is Committed to the Repo — No Locale Build Required [CONFIDENCE: HIGH]

`.claude/settings.json` statusLine references `./tools/statusline/sonash-statusline.exe`.
This binary is committed to the repository
(`tools/statusline/sonash-statusline.exe` confirmed in git-tracked tree). Since Go
cross-compilation can produce Windows executables, the binary at HOME (Go installed via
winget) is usable at WORK without requiring a local Go build. The WORK locale (no admin,
no Go) would use the pre-built binary from git rather than running `build.sh`.

This is not an `if` condition concern, but it is relevant to cross-locale hook
infrastructure — the statusline hook works at both locales without locale-specific setup
provided the repo has a current binary.

**Caveat:** `settings.local.json` contains permissions for `go build` and binary paths
at HOME (`Bash(go build:*)`, `Bash("C:/Program Files/Go/bin/go.exe" version)`). These
permissions have no effect at WORK (no Go installed), but their absence would not break
anything — the binary is pre-built.

**Source:** `tools/statusline/` directory listing, `settings.local.json` content,
`build.sh` content.

---

## Practical Impact Matrix for Proposed `if` Conditions

| `if` Pattern Type | Works at HOME | Works at WORK | Notes |
|-------------------|---------------|---------------|-------|
| `Bash(git push *)` | YES | YES | Already in use; git in PATH everywhere |
| `Bash(git commit *)` | YES | YES | Already in use |
| `Bash(cargo *)` | YES | RISK | cargo only at HOME via `~/.cargo/bin` |
| `Bash(go *)` | YES | RISK | Go only at HOME via `C:\Program Files\Go\bin` |
| `Bash(winget *)` | YES | NO | winget is HOME-only |
| `Edit(*.ts)` | RISK | RISK | Windows path separator issue — both locales |
| `Edit(src/**/*.ts)` | RISK | RISK | Same issue |
| `Bash(npm *)` | YES | YES | npm via fnm — same availability as node |
| `Bash(npx *)` | YES | YES | Same as npm |
| Any locale detection | NOT SUPPORTED | NOT SUPPORTED | `if` cannot read env vars |

---

## What Works at Both Locales Without Issue

1. All existing `if` conditions (`Bash(git push *)`, `Bash(git commit *)`, commit
   multi-pattern) — these are locale-safe.
2. Any new `Bash(...)` pattern for commands that are in git or npm — universal.
3. The pattern engine evaluation itself — no external tools required.

## What Needs Locale-Specific Handling (Not Via `if`)

1. **fnm availability** — must be present at WORK for any hook to function. This is a
   setup requirement, not an `if` problem. Consider adding fnm to the GitHub releases
   install path or documenting work-locale setup.
2. **Locale-specific permissions** in `settings.local.json` — the current file is
   committed to git (shared) and thus cannot hold work-only or home-only settings
   without a restructure.
3. **Tool manifest warnings** — at WORK, tools installed via cargo or go (gron, htmlq)
   will not be present. `session-start.js` tool check will emit warnings. These are
   cosmetic but expected.

## What Breaks at WORK (Regardless of `if` Conditions)

If fnm is not installed at WORK:
- `session-start.js` (cOE=false) — hard failure, session start blocked
- `block-push-to-main.js` (cOE=false) — safety gate fails open
- `pre-commit-agent-compliance.js` (cOE=false) — compliance gate bypassed
- `post-write-validator.js` x3 (cOE=false) — all write validation fails
- `post-read-handler.js` (cOE=false) — context tracking fails
- `user-prompt-handler.js` (cOE=false) — guardrail injection fails

This is a blocker-severity cross-locale infrastructure gap independent of `if` conditions.

---

## Sources

| # | Source | Title | Type | Trust | CRAAP | Date |
|---|--------|-------|------|-------|-------|------|
| 1 | `.claude/settings.json` | Project hook config (17 hooks) | codebase | HIGH | 5.0 | 2026-03-29 |
| 2 | `.claude/settings.local.json` | Locale-specific permissions | codebase | HIGH | 5.0 | 2026-03-29 |
| 3 | `~/.claude/settings.json` | User-level hooks (HOME locale) | codebase | HIGH | 5.0 | 2026-03-29 |
| 4 | `.claude/tool-manifest.json` | Tool definitions and check commands | codebase | HIGH | 5.0 | 2026-03-29 |
| 5 | `.claude/hooks/ensure-fnm.sh` | fnm wrapper — locale risk source | codebase | HIGH | 5.0 | 2026-03-29 |
| 6 | `scripts/install-cli-tools.sh` | Tool installer (winget + GitHub releases) | codebase | HIGH | 5.0 | 2026-03-29 |
| 7 | `tools/statusline/build.sh` | Statusline build (Go required) | codebase | HIGH | 5.0 | 2026-03-29 |
| 8 | `.claude/canonical-memory/project_cross_locale_config.md` | Locale config canon | codebase | HIGH | 5.0 | 2026-03-29 |
| 9 | `~/.claude/projects/.../memory/` cross-locale entries | Extended locale detail | codebase | HIGH | 5.0 | 2026-03-22 |
| 10 | D1-spec.md | `if` field specification (path separator analysis) | peer-findings | HIGH | 4.5 | 2026-03-29 |
| 11 | D9-risks.md | Risks including Windows path separator failures | peer-findings | HIGH | 4.5 | 2026-03-29 |
| 12 | D3-optimization.md | Proposed `if` conditions (tool-availability review) | peer-findings | HIGH | 4.5 | 2026-03-29 |
| 13 | `which curl`, PATH inspection, tool location checks | Shell verification | direct-measurement | HIGH | 5.0 | 2026-03-29 |

---

## Contradictions

**settings.local.json described as locale-specific but is committed to git:** The canonical
memory file `project_cross_locale_config.md` describes `.claude/settings.local.json` as
potentially locale-specific, but `git status` shows the file is tracked (modified but
committed). The file contains HOME-only permissions (Go binary paths), meaning these
permissions silently fail at WORK (no Go). The file IS in the git repo, visible to both
locales. The naming suggests locale-specificity that the implementation does not support.

---

## Gaps

1. **WORK locale `~/.claude/settings.json` not accessible.** The user-level hooks at
   WORK (jbell) are unknown. They may differ from HOME locale in ways that compound
   or mitigate the project-level hook failures.

2. **fnm installation status at WORK not verified.** If fnm is already in `~/bin` at
   WORK via a GitHub release download, the ensure-fnm.sh risk is mitigated. This cannot
   be confirmed from the HOME machine.

3. **Whether Claude Code merges `hooks` across settings layers.** The official docs
   confirm permissions are merged, but explicit confirmation that `hooks` keys in
   `settings.local.json` would merge with `settings.json` hooks is not in the D1-spec.
   If hook merging is supported, `settings.local.json` could host work-specific hook
   overrides if it were excluded from git.

4. **Exact winget PATH at WORK.** WORK has no winget, so `%LOCALAPPDATA%\Microsoft\WinGet\Links`
   would not contain tools. But the WORK user may have shell profile entries that put
   `~/bin` on PATH early. The actual PATH at WORK is not verifiable from this machine.

---

## Serendipity

**`settings.local.json` is committed to git but contains HOME-only permissions.** The
file includes `Bash("C:/Program Files/Go/bin/go.exe" version)` — this path only exists
at HOME. At WORK, these permissions are present but inert (Go is not installed). The file
is not causing failures at WORK, but its presence creates a misleading impression that
Go-related operations are permitted when Go is not available. A future locale-aware
approach might use gitignore + locale-specific files rather than a shared committed file.

**install-cli-tools.sh explicitly falls back to GitHub releases** when winget is absent
(`if $HAS_WINGET ... else download_github_release ...`). This means the tool installer
would work at WORK for all 13 manifest tools. Only fnm (required by ALL hooks) is
absent from the installer. Adding fnm to the installer's GitHub releases fallback would
resolve the single largest cross-locale hook risk.

**The three `if`-conditioned hooks are already the most locale-safe hooks in the system.**
They require only git (universal) and node (via fnm). Their `if` conditions use command
string matching (not path matching), making them immune to all known locale differences.
Any new `if` proposals should follow this pattern: `Bash(...)` not `Edit(...)/Write(...)`.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

The core findings rest on direct filesystem evidence (settings files, scripts, PATH
inspection). The two MEDIUM findings relate to unknown WORK locale state that cannot be
verified from the HOME machine.
