# Claude Hooks Documentation

**Last Updated:** 2026-01-13 **Configuration:** `.claude/settings.json`

---

## Overview

Claude hooks are shell scripts that run automatically in response to Claude Code
events. They enforce project standards, run quality checks, and provide
contextual guidance.

---

## Hook Configuration

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [...],
    "PostToolUse": [...],
    "UserPromptSubmit": [...]
  }
}
```

---

## SessionStart Hooks

**When:** Claude Code starts a new session (web/remote environments only)

### session-start.sh

**Purpose:** Prepare development environment for new session

**What it does:**

1. Install npm dependencies (root and functions) - uses lockfile hash caching
2. Build Firebase Functions
3. Compile test files
4. Run pattern compliance check
5. Check consolidation status (reviews/archiving thresholds)
6. Surface relevant past learnings from AI_REVIEW_LEARNINGS_LOG.md
7. Check document sync status (template instances)
8. Display session checklist

**Timing:** ~10-20 seconds (5-10s if dependencies cached)

**Conditions:**

- Only runs if `CLAUDE_CODE_REMOTE=true` (web sessions)
- Skips on local CLI (dependencies already exist)
- Uses lockfile hash caching to skip npm install if unchanged

### check-mcp-servers.sh

**Purpose:** Check MCP server availability

**What it does:**

1. Verify configured MCP servers are accessible
2. Report available tools

---

## PostToolUse Hooks

**When:** After Write, Edit, or MultiEdit tools are used

### check-write-requirements.sh

**Trigger:** Write tool **Purpose:** Verify agent requirements for file creation

**What it checks:**

- Whether appropriate agent/skill should have been used
- File type-specific requirements

### check-edit-requirements.sh

**Trigger:** Edit, MultiEdit tools **Purpose:** Verify agent requirements for
file modifications

**What it checks:**

- Whether appropriate agent/skill should have been used
- File type-specific requirements

### pattern-check.sh

**Trigger:** Write, Edit, MultiEdit tools **Purpose:** Check pattern compliance
on modified files

**What it checks:**

- Anti-patterns from CODE_PATTERNS.md
- Security patterns
- Project-specific patterns

**Output:** Warns if patterns violated (does not block)

---

## UserPromptSubmit Hooks

**When:** User submits a prompt

### analyze-user-request.sh

**Purpose:** Check PRE-TASK triggers

**What it checks:**

- Whether task matches a skill trigger
- Whether appropriate agent should be used
- Pre-task requirements

---

## Hook Files

**Location:** `.claude/hooks/`

| File                          | Event                              | Purpose            |
| ----------------------------- | ---------------------------------- | ------------------ |
| `session-start.sh`            | SessionStart                       | Environment setup  |
| `check-mcp-servers.sh`        | SessionStart                       | MCP availability   |
| `check-write-requirements.sh` | PostToolUse (Write)                | Agent requirements |
| `check-edit-requirements.sh`  | PostToolUse (Edit/MultiEdit)       | Agent requirements |
| `pattern-check.sh`            | PostToolUse (Write/Edit/MultiEdit) | Pattern compliance |
| `analyze-user-request.sh`     | UserPromptSubmit                   | PRE-TASK triggers  |

---

## Hook Behavior

### Non-Blocking

All Claude hooks are **advisory** - they warn but don't block operations:

- Hooks output to status message
- Claude sees the feedback
- User sees the feedback
- Operations proceed regardless

### Comparison with Git Hooks

| Aspect     | Claude Hooks      | Git Hooks         |
| ---------- | ----------------- | ----------------- |
| Blocking   | NO                | YES               |
| Purpose    | Guidance          | Enforcement       |
| Runs on    | Claude operations | Git operations    |
| Exit codes | Ignored           | Block if non-zero |

---

## Adding New Hooks

1. Create shell script in `.claude/hooks/`
2. Make executable: `chmod +x .claude/hooks/your-hook.sh`
3. Add to `.claude/settings.json`
4. Document in this file

**Template:**

```bash
#!/bin/bash
set -euo pipefail

# Your hook logic here

echo "Hook result message"
```

---

## Debugging Hooks

**Check if hook ran:**

- Look for status message in Claude output
- Check hook script directly: `.claude/hooks/script.sh`

**Common issues:**

- Script not executable (`chmod +x`)
- Syntax errors in script
- Wrong path in settings.json
- Missing dependencies in script

---

## Related Documentation

- [AI_WORKFLOW.md](../AI_WORKFLOW.md) - Session workflows
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Git hooks
- [docs/SLASH_COMMANDS_REFERENCE.md](../docs/SLASH_COMMANDS_REFERENCE.md) -
  Slash commands
