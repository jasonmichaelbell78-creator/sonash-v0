# Findings: Claude Code Worktrees, Parallel Instances, and Shared State

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-02 **Sub-Questions:** SQ-1 through SQ-6 (worktree support, hooks/agents
in worktrees, parallel instance issues, path resolution, isolation mechanisms,
community workflows)

---

## Key Findings

### 1. Built-in Worktree Support Exists and Is Mature [CONFIDENCE: HIGH]

Claude Code added native worktree support in v2.1.49 (released February 19,
2026), extended in v2.1.50+. It is first-class, not a workaround.

**CLI flag:** `claude --worktree <name>` (shorthand `-w`) creates a worktree at
`<repo>/.claude/worktrees/<name>/` on branch `worktree-<name>`, branching from
`origin/HEAD`.

**Desktop app:** Has had built-in worktree support even earlier; "+ New session"
creates an isolated worktree per session automatically.

**Auto-naming:** `claude --worktree` with no name generates a random name (e.g.,
`bright-running-fox`).

**Subagent isolation:** Adding `isolation: worktree` to a custom agent's
frontmatter gives each spawned subagent its own worktree. Worktrees with no
changes are auto-cleaned at subagent exit.

**Cleanup behavior:** On session exit — if no changes, the worktree and branch
are removed automatically. If changes exist, Claude prompts to keep or remove.

**`.worktreeinclude` pattern:** A `.worktreeinclude` file in the project root
(using `.gitignore` syntax) specifies gitignored files (e.g., `.env`,
`.env.local`) to copy into new worktrees at creation time.

Sources:
[Official Claude Code Docs — Common Workflows](https://code.claude.com/docs/en/common-workflows)
[1],
[Boris Cherny announcement thread](https://www.threads.com/@boris_cherny/post/DVAAnexgRUj/introducing-built-in-git-worktree-support-for-claude-code-now-agents-can-run-in)
[2]

---

### 2. `.claude/` Subdirectories (Skills, Agents, Rules) Are NOT Automatically Copied to Worktrees [CONFIDENCE: HIGH]

This is the most immediately relevant finding for this codebase.

When `claude --worktree` creates a worktree, the generated `.claude/` directory
in the worktree contains **only** `settings.local.json`. The following are
absent:

- `skills/`
- `agents/`
- `rules/`
- `docs/`
- `settings.json`
- `state/` (project-level state files)

**Root cause:** Worktree creation does not copy `.claude/` contents from the
main repo. It is a fresh checkout, not a copy.

**Consequence for this repo:** Any worktree session would have access to none of
the 34+ agents, 50+ skills, or hook infrastructure. Skills like `/session-end`,
`/deep-research`, `/pr-review` etc. would be unavailable. Hook-based pre-commit
checks would not fire.

**Official workaround (recommended):** Use a `WorktreeCreate` hook to copy
`.claude/` contents:

```json
// .claude/settings.json
"hooks": {
  "WorktreeCreate": [{
    "hooks": [{
      "type": "command",
      "command": "bash $HOME/.claude/hooks/setup-worktree.sh"
    }]
  }]
}
```

The hook script copies all `.claude/` contents except `worktrees/` to prevent
recursion:

```bash
for f in "$CWD/.claude"/*; do
  base=$(basename "$f")
  [ "$base" = "worktrees" ] && continue
  cp -r "$f" "$WORKTREE_PATH/.claude/" 2>/dev/null || true
done
```

**Alternative workaround:** Symlink `.claude/` from the worktree back to the
main repo (may have edge cases with Claude searching in the base repo path).

**Status:** GitHub issue #28041 is OPEN as of the research date. Native
copy/symlink support is a requested feature, not yet shipped.

Sources:
[GitHub Issue #28041](https://github.com/anthropics/claude-code/issues/28041)
[3],
[Matt Brailsford's hook implementation](https://mattbrailsford.dev/replacing-my-custom-git-worktree-skill-with-claude-code-hooks)
[4]

---

### 3. Model Behavior Degrades Systematically in Worktree Sessions [CONFIDENCE: HIGH]

This is a confirmed active bug (Issue #31872, filed March 7, 2026) affecting
users with complex automation setups.

**Symptoms:**

- Claude skips sub-agent dispatch defined in workflows
- Never calls the Skill tool even when skills are present and hooks inject them
- Goes straight to implementation, ignoring multi-step workflow structure
- Ignores CLAUDE.md rules (e.g., "2+ independent tasks → TeamCreate")
- Skips `AskUserQuestion` nodes in workflows

**Root cause analysis from the issue:** All configuration files are correctly
present and loaded. Hooks fire 3x successfully. The system prompt in worktree
sessions contains the line:
`"This is a git worktree — an isolated copy of the repository."` — this framing
appears to cause the model to treat the session as "lighter" or less rigorous.

**Scope:** Affects Claude Code v2.1.69, Claude Opus model. Confirmed across
multiple users with 50+ skills setups.

**Reported workaround:** Disabling Thinking mode (`/config`) reportedly improves
compliance, but is not a true fix.

**Relation to this codebase:** This repo has 34+ agents, 50+ skills, and complex
hooks including pre-commit, session-start/end, and WorktreeCreate. If worktrees
were used, the behavioral degradation would likely cause the AI to bypass the
very guardrail infrastructure that makes the system safe to use autonomously.

Sources:
[GitHub Issue #31872](https://github.com/anthropics/claude-code/issues/31872)
[5]

---

### 4. Project Directory Fragmentation: Each Worktree Gets Its Own `~/.claude/projects/` Entry [CONFIDENCE: HIGH]

When using git worktrees, Claude Code creates separate project directories under
`~/.claude/projects/` for each unique worktree path:

```
~/.claude/projects/-home-user-project/              # main repo
~/.claude/projects/-home-user-project-worktrees-feat/  # worktree (separate)
```

This means worktrees have **isolated**:

- Auto-memory (MEMORY.md and its referenced files)
- Conversation history (`/resume` picker shows sessions from the same git repo
  including worktrees, but memory context is not shared)
- Project-level settings

**Documentation discrepancy:** The official memory docs state that "all
worktrees and subdirectories within the same repo share one auto memory
directory." In practice, this does NOT match observed behavior — each worktree
gets its own directory.

**Available partial workaround (Windows/Linux):** Set `autoMemoryDirectory` in
`~/.claude/settings.local.json`:

```json
{ "autoMemoryDirectory": "~/.claude/projects/<main-project-key>/memory" }
```

This fixes memory sharing only; sessions and project settings still isolate per
worktree.

**Requested fix:** A `"projectDirectoryStrategy": "git-root"` setting in
`settings.json` that would resolve all worktrees to the main repo's project
directory. Issue #34437 is OPEN with 9 upvotes (March 2026).

**For this codebase:** MEMORY.md and all user memory files would be invisible to
a worktree session. The AI would have no access to the user expertise profile,
decision authority rules, or feedback memory. This is a significant safety
concern.

Sources:
[GitHub Issue #34437](https://github.com/anthropics/claude-code/issues/34437)
[6]

---

### 5. Hook Path Resolution: `$CLAUDE_PROJECT_DIR` Points to the Worktree, Not the Main Repo [CONFIDENCE: HIGH]

This is the critical detail for hook behavior in worktrees.

**WorktreeCreate hook input schema:**

```json
{
  "session_id": "abc123",
  "cwd": "/Users/my-project", // main repo at creation time
  "hook_event_name": "WorktreeCreate",
  "worktree_path": "/Users/my-project/.git/worktrees/branch-name",
  "branch_name": "feature-branch"
}
```

**Once inside a worktree session**, all subsequent hooks fire with `cwd` set to
the worktree directory. `$CLAUDE_PROJECT_DIR` resolves to the worktree root, not
the main repo.

**Permission scoping bug (Issue #28248, OPEN):** The
`git rev-parse --git-common-dir` call Claude Code uses for project root
resolution always returns the main worktree's `.git` directory. This causes
permission prompts to display the main repo path instead of the current worktree
path when accepting "don't ask again" permissions. Permissions granted in a
worktree may scope to the main repo or vice versa — behavior is inconsistent.

**For `.claude/state/` files in this repo:** If worktrees copied `.claude/` (via
the hook workaround), hook scripts writing to `.claude/state/` would write to
the worktree's copy of that directory, NOT the main repo's. State files like
`hook-runs.jsonl`, `review-metrics.jsonl`, `commit-log.jsonl` would be in the
worktree. However, if `.claude/` is symlinked instead of copied, writes would go
to the main repo's state files — creating potential write collision between
parallel sessions.

**WorktreeRemove:** Cannot block removal (non-zero exit code only logs, does not
prevent). Used for cleanup side effects only.

**Environment variables available in hooks:**

- `$CLAUDE_PROJECT_DIR` — project root (= worktree root when inside worktree)
- `$CLAUDE_ENV_FILE` — path for persisting env vars (available in SessionStart,
  CwdChanged, FileChanged)
- `session_id` — unique per session (use this to scope per-session state files)
- `agent_id` — unique per subagent (for parallel subagent isolation)

Sources:
[Official Claude Code Hooks Docs](https://code.claude.com/docs/en/hooks) [7],
[GitHub Issue #28248](https://github.com/anthropics/claude-code/issues/28248)
[8]

---

### 6. Isolation Mechanisms: What Is and Isn't Isolated [CONFIDENCE: HIGH]

**What IS isolated by worktrees:**

- Working directory files (each worktree is a separate checkout with its own
  branch)
- Uncommitted changes (cannot affect other sessions)
- Session transcript (stored under the worktree's `~/.claude/projects/` entry)
- The `session_id` (unique per session, available in all hook inputs)

**What is NOT isolated (shared across all worktrees):**

- The main `.git` object store (shared, by git design)
- `~/.claude/settings.json` (global user settings apply everywhere)
- `~/.claude/settings.local.json` (global local settings)
- `origin/HEAD` remote state
- Rate limits (5-hour and 7-day windows are account-wide)

**What has INCONSISTENT isolation (depends on copy vs. symlink strategy):**

- `.claude/settings.json` — in the worktree's own copy if copied, OR shared if
  symlinked
- `.claude/state/*.jsonl` — isolated per worktree if copied (main repo doesn't
  see them), OR write-collision risk if symlinked
- `.claude/agents/` and `.claude/skills/` — absent unless copied via hook

**Parallel session write collision risk:** If two worktrees both symlink to the
same `.claude/state/`, hooks from parallel sessions can write to the same JSONL
files simultaneously with no locking mechanism. This would corrupt
`hook-runs.jsonl`, `review-metrics.jsonl`, and `commit-log.jsonl`.

**The `session_id` pattern for collision avoidance:** The recommended pattern
for custom hook scripts is to use `session_id` (from hook JSON input) to scope
any state files written by hooks:

```bash
STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/state/hook-runs-${SESSION_ID}.jsonl"
```

This prevents collision but requires merging session files later.

Sources:
[Official Claude Code Hooks Docs](https://code.claude.com/docs/en/hooks) [7],
[Claude Code Worktrees Guide](https://claudefa.st/blog/guide/development/worktree-guide)
[9]

---

### 7. Statusline Behavior in Worktree Sessions [CONFIDENCE: HIGH]

The statusline JSON payload includes worktree-specific fields when running in a
`--worktree` session:

```json
"worktree": {
  "name": "my-feature",
  "path": "/path/to/.claude/worktrees/my-feature",
  "branch": "worktree-my-feature",
  "original_cwd": "/path/to/project",
  "original_branch": "main"
}
```

**Key caveats:**

- The `worktree` object is **absent** when not in a `--worktree` session
  (including manually created worktrees entered via `cd`)
- `branch` and `original_branch` may be absent for hook-based worktrees
- The statusline command path must be absolute (tilde `~` may not resolve
  correctly)
- The statusline is disabled if `disableAllHooks: true` is set in settings
  (hooks and statusline share the same trust/execution gate)
- Only runs in trusted workspaces

**For this repo's statusline (Go binary):** The statusline binary receives the
full JSON payload including `worktree.*` fields. The binary would need to handle
`worktree` being absent gracefully when in a non-worktree session. The
`worktree.path` field would show the worktree directory, not the main repo —
meaning `workspace.project_dir` and `worktree.path` will differ in worktree
sessions.

Sources:
[Official Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline)
[10]

---

### 8. Community Parallel Development Patterns [CONFIDENCE: MEDIUM]

**Pattern 1: Native `--worktree` + WorktreeCreate hook (dominant
pattern, 2026)** Most teams use `claude -w <name>` and implement a
WorktreeCreate hook to copy `.claude/` contents, `.env` files, and run
dependency setup (e.g., `npm install`). The `tfriedel/claude-worktree-hooks`
project on GitHub uses deterministic port hashing
(`MD5(branch_name) → port 3100-9999`) to prevent dev server collisions.

**Pattern 2: GitButler integration (no-worktree alternative)** GitButler's
approach avoids worktrees entirely. Claude Code hooks (PostToolUse/Stop) notify
GitButler of file changes via `session_id`, which auto-creates a branch per
session. Eliminates the bootstrapping cost (`npm install` per worktree), but
operates in a single directory — meaning parallel Claude sessions must
coordinate on file access through branch-level isolation in GitButler's virtual
filesystem rather than physical directory isolation.

**Pattern 3: Tmux + worktree** `claude --worktree <name> --tmux` creates both a
worktree and a dedicated tmux session. Used for long-running parallel tasks
where you want terminal isolation alongside filesystem isolation.

**Pattern 4: Manual worktree with explicit agent scope** Advanced teams place
worktrees outside the main repo
(`git worktree add ../project-feature-a -b feature-a`) to avoid nested
`.gitignore` pollution, then start Claude with
`cd ../project-feature-a && claude`. This requires manual `.claude/` setup.

**incident.io pattern:** A custom bash function `w <project> <branch> claude`
wraps worktree creation + Claude launch. They rely on Plan Mode as a safeguard
before execution in parallel sessions.

Sources:
[incident.io blog](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees)
[11], [GitButler blog](https://blog.gitbutler.com/parallel-claude-code) [12],
[claude-worktree-hooks GitHub](https://github.com/tfriedel/claude-worktree-hooks)
[13],
[Boris Cherny threads](https://www.threads.com/@boris_cherny/post/DWfjtLTFBhu/use-git-worktrees-claude-code-ships-with-deep-support-for-git-worktrees)
[14]

---

## Sources

| #   | URL                                                                                      | Title                                                          | Type                   | Trust  | CRAAP (avg) | Date     |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- | ------ | ----------- | -------- |
| 1   | https://code.claude.com/docs/en/common-workflows                                         | Common Workflows — Claude Code Docs                            | Official docs          | HIGH   | 4.8         | 2026     |
| 2   | https://www.threads.com/@boris_cherny/post/DVAAnexgRUj/                                  | Boris Cherny — built-in worktree support announcement          | Vendor announcement    | HIGH   | 4.4         | Feb 2026 |
| 3   | https://github.com/anthropics/claude-code/issues/28041                                   | .claude/ subdirectories not copied to worktree                 | Official issue tracker | HIGH   | 4.6         | Mar 2026 |
| 4   | https://mattbrailsford.dev/replacing-my-custom-git-worktree-skill-with-claude-code-hooks | Replacing Custom Worktree Skill with Hooks                     | Community blog         | MEDIUM | 3.8         | 2026     |
| 5   | https://github.com/anthropics/claude-code/issues/31872                                   | Model behavior degradation in git worktree sessions            | Official issue tracker | HIGH   | 4.6         | Mar 2026 |
| 6   | https://github.com/anthropics/claude-code/issues/34437                                   | Worktrees should share same project directory                  | Official issue tracker | HIGH   | 4.6         | Mar 2026 |
| 7   | https://code.claude.com/docs/en/hooks                                                    | Hooks — Claude Code Docs                                       | Official docs          | HIGH   | 4.8         | 2026     |
| 8   | https://github.com/anthropics/claude-code/issues/28248                                   | Permission scoping shows main worktree path                    | Official issue tracker | HIGH   | 4.6         | Mar 2026 |
| 9   | https://claudefa.st/blog/guide/development/worktree-guide                                | Claude Code Worktrees: Run Parallel Sessions Without Conflicts | Community guide        | MEDIUM | 3.5         | 2026     |
| 10  | https://code.claude.com/docs/en/statusline                                               | Customize your status line — Claude Code Docs                  | Official docs          | HIGH   | 4.8         | 2026     |
| 11  | https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees              | Shipping Faster with Claude Code and Git Worktrees             | Company blog           | MEDIUM | 3.9         | 2026     |
| 12  | https://blog.gitbutler.com/parallel-claude-code                                          | Managing Multiple Claude Code Sessions Without Worktrees       | Company blog           | MEDIUM | 4.0         | 2026     |
| 13  | https://github.com/tfriedel/claude-worktree-hooks                                        | claude-worktree-hooks: Auto-setup hooks                        | OSS project            | MEDIUM | 3.8         | 2026     |
| 14  | https://www.threads.com/@boris_cherny/post/DWfjtLTFBhu/                                  | Boris Cherny — worktree deep support tips                      | Vendor post            | HIGH   | 4.2         | 2026     |

---

## Contradictions

**Memory isolation vs. official docs claim:** The official memory documentation
states "all worktrees and subdirectories within the same repo share one auto
memory directory." Issue #34437 (with 9 upvotes) directly contradicts this — in
practice, each worktree gets an isolated `~/.claude/projects/` entry. The
documentation appears aspirational or reflects an incomplete implementation.
Confidence on the "isolation" behavior is HIGH (multiple issue reports confirm
it); confidence on the docs claim being accurate is LOW.

**`$CLAUDE_PROJECT_DIR` inside vs. outside a worktree:** The hooks docs say
`$CLAUDE_PROJECT_DIR` provides "Project root directory" for all hooks. In a
worktree session, this resolves to the worktree root (confirmed by issue
#28248), not the main repo. This is not well-documented as a distinction and
represents a behavioral difference developers may not anticipate.

---

## Gaps

1. **`.claude/state/` write collision testing:** No public documentation or
   issue specifically addresses whether two parallel worktrees using a symlinked
   `.claude/` directory cause observable JSONL corruption. The risk is inferred
   from first principles (no file locking) rather than confirmed by a reported
   incident.

2. **Pre-commit hook behavior in worktrees:** Whether `npm run patterns:check`
   and other pre-commit hooks fire correctly from worktrees was not directly
   confirmed. The WorktreeCreate hook approach would need to copy
   `package.json`, `node_modules/` links or re-run `npm install`, which is a
   non-trivial setup cost.

3. **Windows path behavior in worktrees:** Issue #28248 and Matt Brailsford's
   article both note that on Windows, Claude Code sends Windows-style paths
   (`D:\Work\...`) in hook JSON, but Git Bash needs Unix-style paths. The
   codebase runs on Windows (confirmed from system prompt). This means any
   WorktreeCreate/Remove hook scripts written for this repo would need explicit
   `cygpath` conversion at boundaries.

4. **Statusline Go binary in worktree context:** Whether the existing Go
   statusline binary gracefully handles the absent `worktree` JSON key (null
   safety) was not confirmed without reading the binary source. It is an open
   question whether the statusline would show incorrect or empty data in a
   worktree session.

5. **Agent behavioral degradation scope:** Issue #31872 is filed against Claude
   Opus on the Anthropic API tier. It is unclear if the same degradation occurs
   with Sonnet models or on Pro/Max plans. The issue is open with no Anthropic
   response yet.

---

## Serendipity

**WorktreeCreate completely replaces git behavior:** When a `WorktreeCreate`
hook is configured, it replaces Claude Code's default `git worktree` logic
entirely. This means `.worktreeinclude` file processing is skipped when using
custom hooks — the hook must handle all file copying itself. This is
counterintuitive and could lead to `.env` files not being copied if someone adds
a `WorktreeCreate` hook without accounting for this.

**`--tmux` flag:** `claude --worktree <name> --tmux` creates both a worktree and
a tmux session simultaneously. This is undocumented in the main common-workflows
page but mentioned in the Boris Cherny thread.

**Session picker cross-worktree visibility:** The `/resume` session picker shows
sessions from the same git repository including worktrees. This means you can
resume a worktree session from a non-worktree Claude instance — useful for
recovery if a worktree session crashes.

**Port hashing pattern for parallel dev servers:** The deterministic port
hashing approach (`MD5(branch_name) → port in 3100-9999 range`) from
`tfriedel/claude-worktree-hooks` is a clean pattern applicable to any project
running local dev servers. Same branch always gets same port, eliminating
`EADDRINUSE` conflicts across parallel worktrees without a central port
registry.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All HIGH-confidence claims are sourced from either official Claude Code
documentation or the official GitHub issue tracker (anthropics/claude-code). The
two MEDIUM-confidence findings are sourced from community blogs cross-referenced
against official docs. No claims rely solely on training data.

---

## Summary for Worktree Decision-Making in This Repo

**Verdict: Worktrees are viable but require significant infrastructure work
before use.**

**Pre-requisites before using `claude --worktree` in this repo:**

1. Implement a `WorktreeCreate` hook that copies `.claude/` contents (excluding
   `worktrees/` and `state/`) to the new worktree. Must handle Windows `cygpath`
   path conversion.
2. Decide on `.claude/state/` strategy: copy (isolated, safe from collisions,
   but state invisible to main repo) vs. symlink (shared, collision risk, but
   hook data visible to `/alerts` and `/pr-retro`). Copy is safer.
3. Verify the Go statusline binary handles absent `worktree.*` JSON keys
   gracefully (null-safe).
4. Accept that model behavioral compliance may degrade in worktree sessions
   (Issue #31872 is unresolved). Monitor for CLAUDE.md rule violations.
5. Test pre-commit hooks in a worktree context: `npm install` may need to run in
   the worktree, or `node_modules/` needs to be symlinked.
6. Set `autoMemoryDirectory` in `~/.claude/settings.local.json` to point to the
   main repo's memory directory, so MEMORY.md is accessible in worktree
   sessions.
