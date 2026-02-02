# Claude Hooks Documentation

**Last Updated:** 2026-02-02 **Configuration:** `.claude/settings.json`

---

## Overview

Claude hooks are Node.js scripts that run automatically in response to Claude
Code events. They enforce project standards, run quality checks, and provide
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

### session-start.js

**Purpose:** Prepare development environment for new session

**What it does:**

1. Check MCP secrets status (encrypted tokens)
2. Install npm dependencies (root and functions) - uses lockfile hash caching
3. Build Firebase Functions
4. Compile test files
5. Run pattern compliance check
6. Check consolidation status (reviews/archiving thresholds)
7. Check backlog health
8. Display session checklist

**Timing:** ~10-20 seconds (5-10s if dependencies cached)

**Conditions:**

- Only runs if `CLAUDE_CODE_REMOTE=true` (web sessions)
- Skips on local CLI (dependencies already exist)
- Uses lockfile hash caching to skip npm install if unchanged

### check-mcp-servers.js

**Purpose:** Check MCP server availability

**What it does:**

1. Read `.mcp.json` configuration
2. Report available MCP servers by name
3. Does NOT expose tokens or sensitive config

---

## PostToolUse Hooks

**When:** After Write, Edit, or MultiEdit tools are used

### check-write-requirements.js

**Trigger:** Write tool **Purpose:** Verify agent requirements for file creation

**What it checks:**

- Whether appropriate agent/skill should have been used
- File type-specific requirements

### check-edit-requirements.js

**Trigger:** Edit, MultiEdit tools **Purpose:** Verify agent requirements for
file modifications

**What it checks:**

- Whether appropriate agent/skill should have been used
- File type-specific requirements

### pattern-check.js

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

### analyze-user-request.js

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
| `session-start.js`            | SessionStart                       | Environment setup  |
| `check-mcp-servers.js`        | SessionStart                       | MCP availability   |
| `check-write-requirements.js` | PostToolUse (Write)                | Agent requirements |
| `check-edit-requirements.js`  | PostToolUse (Edit/MultiEdit)       | Agent requirements |
| `pattern-check.js`            | PostToolUse (Write/Edit/MultiEdit) | Pattern compliance |
| `analyze-user-request.js`     | UserPromptSubmit                   | PRE-TASK triggers  |

**Note:** Shell script wrappers (`.sh` files) also exist for compatibility but
the main logic is in the Node.js (`.js`) files.

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

1. Create Node.js script in `.claude/hooks/`
2. Add to `.claude/settings.json`
3. Document in this file

**Template:**

```javascript
#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

// Use process.cwd() for project root
const PROJECT_ROOT = process.cwd();

// Your hook logic here

console.log("Hook result message");
```

---

## Debugging Hooks

**Check if hook ran:**

- Look for status message in Claude output
- Run hook script directly: `node .claude/hooks/script.js`

**Common issues:**

- Syntax errors in script
- Wrong path in settings.json
- Missing dependencies in script
- Environment variable not available

---

## Global Hooks (Cross-Platform)

**Location:** `.claude/hooks/global/`

Cross-platform Node.js hooks that can be synced between Windows CLI and Claude
Code Web environments.

| File                  | Event        | Purpose                                    |
| --------------------- | ------------ | ------------------------------------------ |
| `gsd-check-update.js` | SessionStart | Check for GSD package updates              |
| `statusline.js`       | StatusLine   | Custom status showing model, task, context |

**Sync with local environment:**

```bash
# Import from repo to local (~/.claude/)
node scripts/sync-claude-settings.js --import

# Export from local to repo
node scripts/sync-claude-settings.js --export

# Compare differences
node scripts/sync-claude-settings.js --diff
```

**See:** [CROSS_PLATFORM_SETUP.md](./CROSS_PLATFORM_SETUP.md) for full setup
guide.

---

## Related Documentation

- [AI_WORKFLOW.md](../AI_WORKFLOW.md) - Session workflows
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Git hooks
- [COMMAND_REFERENCE.md](./COMMAND_REFERENCE.md) - Full command reference
- [CROSS_PLATFORM_SETUP.md](./CROSS_PLATFORM_SETUP.md) - Cross-platform setup
- [REQUIRED_PLUGINS.md](./REQUIRED_PLUGINS.md) - Plugin configuration
