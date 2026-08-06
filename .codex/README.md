# SoNash Codex Configuration

This directory contains the repository-scoped Codex foundation. It is additive:
Claude Code remains supported through `CLAUDE.md` and `.claude/`, and neither
system depends on the other.

## Files

- `config.toml` contains only safe project defaults. Authentication, provider
  selection, personal model preferences, and machine-specific paths belong in
  the user's Codex home configuration, not this repository.
- `hooks.json` registers independently reviewed Codex lifecycle hooks. The
  current direct-main guard is implemented in
  `hooks/pre-tool-use-direct-main.js`.
- `../AGENTS.md` contains durable repository instructions loaded by Codex.

## Starting Codex

Run Codex from the repository root or use `codex -C /workspaces/sonash-v0`.
Project configuration is used only when the repository is trusted. After
changing `AGENTS.md` or `.codex/`, start a new Codex run so instruction and
configuration discovery is refreshed.

Useful checks:

```bash
codex doctor
codex exec "Summarize the active repository instructions and current worktree."
```

Use `/hooks` in an interactive session to inspect and review project hooks
before enabling any non-managed command hook.

The direct-main guard can be tested with:

```bash
node --test .codex/tests/*.test.js
```

## Continuity and state

Put durable project status, decisions, and next steps in checked-in documents.
Do not commit transcripts, caches, credentials, or local Codex runtime state.
When a task spans environments, leave a concise handoff in the relevant plan or
session-context document rather than relying on conversation history.

## Claude boundary

Do not modify `.claude/` or `CLAUDE.md` as part of Codex setup. Existing Claude
hooks and skills are not automatically equivalent to Codex hooks and skills;
port only explicitly selected behavior after separate validation.
