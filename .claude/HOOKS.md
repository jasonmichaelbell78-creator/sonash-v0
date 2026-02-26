# Claude Hooks Documentation

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Documents all Claude Code hooks configured in `.claude/settings.json`. Hooks are
Node.js scripts that run automatically in response to Claude Code events.

---

## Hook Configuration

**File:** `.claude/settings.json`

Four event types are configured:

| Event              | When It Fires                            |
| ------------------ | ---------------------------------------- |
| `SessionStart`     | New session begins (or after compaction) |
| `PreCompact`       | Before conversation compaction           |
| `PostToolUse`      | After specific tools are used            |
| `UserPromptSubmit` | When user submits a prompt               |

---

## SessionStart Hooks

### Default (all sessions)

| Hook                              | Purpose                                   |
| --------------------------------- | ----------------------------------------- |
| `session-start.js`                | Environment setup (deps, build, checks)   |
| `check-mcp-servers.js`            | Report available MCP servers              |
| `check-remote-session-context.js` | Check remote branches for session context |

### Compact (after compaction)

| Hook                 | Purpose                          |
| -------------------- | -------------------------------- |
| `compact-restore.js` | Restore context after compaction |

---

## PreCompact Hooks

| Hook                     | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `pre-compaction-save.js` | Save full state snapshot before compaction |

---

## PostToolUse Hooks

| Matcher         | Hook                        | Purpose                             |
| --------------- | --------------------------- | ----------------------------------- |
| Write           | `post-write-validator.js`   | Validate write operations           |
| Edit            | `post-write-validator.js`   | Validate edit operations            |
| MultiEdit       | `post-write-validator.js`   | Validate multiedit operations       |
| Read            | `post-read-handler.js`      | Process read operations             |
| AskUserQuestion | `decision-save-prompt.js`   | Check decision documentation        |
| Bash            | `commit-tracker.js`         | Track git commits + report failures |
| Task            | `track-agent-invocation.js` | Track agent/subagent invocations    |

---

## UserPromptSubmit Hooks

| Hook                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `user-prompt-handler.js` | Process user prompt (skill triggers, context) |

---

## All Hook Files

**Location:** `.claude/hooks/`

| File                              | Event(s)             | Purpose                                    |
| --------------------------------- | -------------------- | ------------------------------------------ |
| `session-start.js`                | SessionStart         | Environment setup (deps, build, patterns)  |
| `check-mcp-servers.js`            | SessionStart         | MCP server availability check              |
| `check-remote-session-context.js` | SessionStart         | Remote branch context check                |
| `compact-restore.js`              | SessionStart:compact | Restore context after compaction           |
| `pre-compaction-save.js`          | PreCompact           | Save state snapshot before compaction      |
| `post-write-validator.js`         | PostToolUse          | Validate Write/Edit/MultiEdit operations   |
| `post-read-handler.js`            | PostToolUse          | Process Read operations                    |
| `decision-save-prompt.js`         | PostToolUse          | Decision documentation on AskUserQuestion  |
| `commit-tracker.js`               | PostToolUse          | Track commits + report failures            |
| `track-agent-invocation.js`       | PostToolUse          | Track Task/agent invocations               |
| `user-prompt-handler.js`          | UserPromptSubmit     | Process user prompts (triggers, context)   |
| `state-utils.js`                  | (shared lib)         | Shared utilities for hook state management |
| `stop-serena-dashboard.js`        | (utility)            | Stop Serena dashboard process              |

### Global Hooks

**Location:** `.claude/hooks/global/`

| File                  | Event        | Purpose                                    |
| --------------------- | ------------ | ------------------------------------------ |
| `gsd-check-update.js` | SessionStart | Check for GSD package updates              |
| `statusline.js`       | StatusLine   | Custom status showing model, task, context |

---

## Hook Behavior

All Claude hooks are **advisory** — they output guidance but do not block
operations (exit codes are ignored).

| Aspect     | Claude Hooks      | Git Hooks         |
| ---------- | ----------------- | ----------------- |
| Blocking   | No                | Yes               |
| Purpose    | Guidance          | Enforcement       |
| Runs on    | Claude operations | Git operations    |
| Exit codes | Ignored           | Block if non-zero |

---

## Adding New Hooks

1. Create Node.js script in `.claude/hooks/`
2. Add configuration to `.claude/settings.json`
3. Update this document

---

## Related Documentation

- [AI_WORKFLOW.md](../AI_WORKFLOW.md) — Session workflows
- [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md) — Full command reference
- [CROSS_PLATFORM_SETUP.md](./CROSS_PLATFORM_SETUP.md) — Cross-platform setup
- [CONTEXT_PRESERVATION.md](../docs/agent_docs/CONTEXT_PRESERVATION.md) —
  Compaction safety layers

## Version History

| Version | Date       | Changes                                            |
| ------- | ---------- | -------------------------------------------------- |
| 2.0     | 2026-02-23 | Complete rewrite: 18 actual hooks, accurate config |
| 1.0     | 2026-02-02 | Initial version (now outdated)                     |
