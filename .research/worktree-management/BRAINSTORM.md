# Brainstorm: Worktree Management + Parallel Claude Code Instances

**Date:** 2026-04-02 **Last Updated:** 2026-04-05 **Status:** Paused (testing
Direction F) **Routing:** TBD — depends on `claude -w` test results

## Purpose

This brainstorm explores how to run two Claude Code sessions on different
branches simultaneously without state interference. It documents the problem
space, anti-goals, landscape analysis, candidate directions, and the chosen path
(Direction F, pending test results). Captures the discovery that
`claude --worktree` (native since v2.1.49) has not been exercised and may
obviate manual workarounds.

## AI Instructions

When working with worktree-related features in this codebase:

- Prefer `claude --worktree <name>` (native flag) over conversational
  `git worktree add` for parallel Claude Code instances
- Do NOT overwrite `.claude/state/*.jsonl` files from a worktree without
  checking for concurrent writes (shared state between main and worktree
  instances)
- Hook scripts that reference `scripts/` must use repo-relative paths, not
  `path.resolve(__dirname, "..")` style — worktrees may resolve those
  differently
- Check `process.env.CLAUDE_PROJECT_DIR` to determine whether the current
  session is in a worktree

## Problem Space

Running two Claude Code sessions on different branches without interference.
Currently, conversational worktree creation leaves Claude Code rooted in the
main repo directory — `git checkout` in one session ripples to the other. The
user wants daily R&D + implementation in parallel, both with full capabilities.

**Key discovery:** User has never used `claude --worktree` flag. All worktree
usage has been conversational (`git worktree add`), which doesn't give Claude
Code process-level isolation.

## Anti-Goals

- No cloning the entire repo (too heavy, ~500MB+)
- No "lite" second instance — both need full capabilities (hooks, skills,
  agents, statusline)
- No manual setup ceremony every session — should be one command or automatic
- No state corruption — parallel writes to shared JSONL must not lose data
- No over-engineering — simplest solution that works

## Landscape

### .claude/ Directory (858 files)

- 564 tracked (agents, skills, hooks, config) — travel with the branch
- 294 ignored (session state, GSD, temp files) — need copy or generation
- Hooks depend on `scripts/` directory (12+ external references)
- Session-ephemeral state (13 dot-files) vs persistent state (60+ JSONL/JSON)

### Claude Code Native Support

- `claude --worktree <name>` or `-w` — native since v2.1.49
- `WorktreeCreate` / `WorktreeRemove` hooks available
- `isolation: worktree` frontmatter for subagents
- Statusline receives `worktree.*` fields

### Known Bugs

1. **#31872** — Model behavior degrades in worktrees (ignores skills,
   CLAUDE.md). May or may not affect this setup.
2. **#28248** — Permission scoping shows main path, not worktree path
3. **#34437** — Each worktree fragments `~/.claude/projects/` auto-memory

### Core Tension

- **Copy** .claude/ → isolated but state diverges from main
- **Symlink** .claude/ → shared but write-collision risk
- **Neither** → worktree may lack skills/agents/hooks (but tracked files travel
  with branch)

### Existing Infrastructure

- GSD workspace system (`gsd:new-workspace --strategy worktree`) exists but
  doesn't solve .claude/ syncing
- `.worktrees/planning/` directory exists (gitignored)
- Community pattern: WorktreeCreate hook that copies .claude/ + dep install

## Directions Explored

### Direction F: Just Use `claude -w` (TESTING NOW)

**Vision:** Use Claude Code's built-in worktree flag. Zero engineering. Open
second terminal, run `claude -w research`, see if it works. Bug #31872 may not
affect this specific setup. **Strengths:** Zero effort, native support,
process-level isolation **Weaknesses:** Bug #31872 could degrade model behavior;
permission scoping bug; memory fragmentation **Assumptions:** The bugs are
either fixed or don't affect Opus on this codebase **Feasibility:** HIGH —
literally one command

### Direction G: Manual Worktree + Separate CWD

**Vision:** `git worktree add .worktrees/research`, cd into it, run plain
`claude` (no -w flag). .claude/ is tracked so skills/agents/hooks are present.
Two independent sessions in two directories. **Strengths:** No Claude Code flags
needed, .claude/ travels with branch **Weaknesses:** Ignored files (state, GSD,
session state) won't be present; dep install needed; scripts/ path references
may break **Assumptions:** Hooks can resolve scripts/ from worktree directory
**Feasibility:** MEDIUM — needs testing, may need path fixes

### Direction B: Parallel Launch Script

**Vision:** Create a `/parallel` skill that automates worktree creation,
.claude/ copy for ignored files, dep install, and launches claude in the
worktree. **Strengths:** One-command experience, handles all edge cases
**Weaknesses:** Engineering effort, maintenance burden, complex **Assumptions:**
F or G work but need polish **Feasibility:** MEDIUM — only worth building after
F/G validated

### Direction A: Native `-w` with Hardening Hook

**Vision:** Use `-w` but add WorktreeCreate hook that reinforces CLAUDE.md rules
to counter bug #31872. **Strengths:** Addresses known bug directly
**Weaknesses:** Workaround for a bug that may get fixed upstream
**Assumptions:** Bug #31872 is prompt-fixable **Feasibility:** MEDIUM

### Direction C: Symlinked .claude/ with Write Partitioning

**Vision:** Symlink read-only parts (agents, skills, hooks), copy write parts
(state, tmp). **Strengths:** Keeps skills/agents in sync, isolates writes
**Weaknesses:** Complex symlink management, Windows symlink issues
**Assumptions:** Windows symlinks work reliably in this context **Feasibility:**
LOW — Windows symlinks are fragile

### Direction D: Session-Aware Branch Pinning

**Vision:** No worktrees. Guard hook blocks cross-session branch switches.
**Strengths:** No directory duplication **Weaknesses:** Fragile, doesn't solve
concurrent file access, hooks would fight **Assumptions:** Can reliably detect
"other active session" **Feasibility:** LOW — fighting git's design

## Evaluation Summary

| Direction               | Strengths           | Weaknesses            | Feasibility        |
| ----------------------- | ------------------- | --------------------- | ------------------ |
| F: `claude -w`          | Zero effort, native | Bug #31872 risk       | HIGH               |
| G: Manual worktree + cd | Simple, no flags    | Missing ignored files | MEDIUM             |
| B: Launch script        | One command         | Engineering effort    | MEDIUM (after F/G) |
| A: -w + hardening hook  | Targets bug         | Workaround            | MEDIUM             |
| C: Symlink partition    | Sync + isolation    | Windows fragile       | LOW                |
| D: Branch pinning       | No duplication      | Fighting git          | LOW                |

## Current Status

**Testing Direction F** (`claude -w`). If it works with acceptable model
behavior, this is the answer. If #31872 manifests, fall back to G, then B.

## Open Questions

1. Does bug #31872 affect Opus 4.6 on this codebase?
2. Do tracked .claude/ files (skills, agents, hooks) work correctly in `-w`
   mode?
3. Does the statusline render properly in worktree mode?
4. Can both instances write to shared JSONL state files safely?
5. Do hooks resolve `scripts/` paths correctly from worktree directory?

## Version History

| Version | Date       | Changes                                                                                             |
| ------- | ---------- | --------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-05 | Added Purpose section, Last Updated metadata, and Version History (doc-lint compliance, PR #492 R2) |
| 1.0     | 2026-04-02 | Initial brainstorm: 6 directions (A-F), paused at Direction F for `claude -w` testing               |
