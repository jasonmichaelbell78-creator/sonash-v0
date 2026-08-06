# Claude and Codex Dual-Workflow Guide

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Initial guide; expand as Codex parity work is completed.

## Choose a Workflow

Use Claude when a task depends on the existing `.claude/` agents, skills, hooks,
commands, MCP setup, or historical state. Use Codex for the reproducible
Codespaces workflow, explicit terminal operations, Codex MCP, focused reviews,
and new Codex equivalents. Both systems may be used for independent review or
parity validation.

Neither system may alter the other system's configuration unless the user
explicitly requests it.

## Key Locations

| Concern                         | Claude                    | Codex                                   |
| ------------------------------- | ------------------------- | --------------------------------------- |
| Durable repository instructions | `CLAUDE.md`               | `AGENTS.md`                             |
| Project configuration           | `.claude/settings.json`   | `.codex/config.toml`                    |
| Hooks                           | `.claude/hooks/`          | `.codex/hooks/` and `.codex/hooks.json` |
| Agents                          | `.claude/agents/`         | `.codex/agents/`                        |
| Skills                          | `.claude/skills/`         | `.codex/skills/`                        |
| MCP                             | Claude settings/templates | `.codex/config.toml`                    |
| Runtime state                   | `.claude/state/`          | local Codex state; do not commit        |

## Codex Command Cheat Sheet

| Task                         | Command                             |
| ---------------------------- | ----------------------------------- |
| Start an interactive session | `codex`                             |
| Start with a task            | `codex "review the auth flow"`      |
| Use another directory        | `codex -C path/to/dir`              |
| Resume the latest session    | `codex resume --last`               |
| Fork the latest session      | `codex fork --last`                 |
| Run non-interactively        | `codex exec "<task>"`               |
| Review changes               | `codex review`                      |
| Diagnose Codex               | `codex doctor`                      |
| List MCP servers             | `codex mcp list`                    |
| Add an MCP server            | `codex mcp add <name> -- <command>` |
| Authenticate an MCP server   | `codex mcp login <name>`            |

In an interactive Codex client, use `/mcp` to inspect MCP servers and `/agent`
to inspect active subagents. Use `/memories` only as a convenience layer; team
requirements belong in checked-in guidance.

## Operational Differences

- Codex reads layered `AGENTS.md` instructions; the closest file to the working
  directory has the strongest project-specific effect.
- Codex uses project configuration only in trusted repositories. If Codex
  ignores `.codex/`, verify project trust before changing files.
- Codex uses sandbox and approval policies for shell and tool actions. Treat an
  approval prompt as a chance to inspect scope rather than as an error.
- Claude's existing hook and plugin ecosystem is not automatically available to
  Codex. Codex equivalents must be separately configured and tested.
- Keep required facts in docs and `AGENTS.md`; do not rely exclusively on either
  agent's memory.

## Dependency-Branch Triage

Before merging a Dependabot PR, identify its group and risk, inspect overlap,
and run the validation tier in
[BRANCH_TRIAGE_PLAN.md](plans/BRANCH_TRIAGE_PLAN.md). Use a clean, isolated
branch or worktree for major updates. Do not mix dependency changes with agent
infrastructure changes.

## Secrets and GitHub

Use Codespaces secrets or ignored local files for credentials. Never commit a
token or place it in `.codex/config.toml`. `gh` prefers `GH_TOKEN` over
`GITHUB_TOKEN`; ensure both are valid when both are present.
