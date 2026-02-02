# Cross-Platform Claude Code Setup

This guide explains how to set up Claude Code consistently across Windows CLI
and Claude Code Web (Linux).

## Quick Start

### On a New Environment

1. Clone the repository
2. Run the import script:

```bash
node scripts/sync-claude-settings.js --import
```

This will:

- Merge plugin settings into `~/.claude/settings.json`
- Copy global hooks to `~/.claude/hooks/`
- Copy GSD agents to `~/.claude/agents/`

### Exporting Changes

After making changes to your local Claude Code configuration:

```bash
node scripts/sync-claude-settings.js --export
```

Then commit the updated templates to the repo.

## Directory Structure

### Repository (`.claude/`)

```
.claude/
├── agents/
│   └── global/              # GSD agent definitions (11 files)
│       ├── gsd-codebase-mapper.md
│       ├── gsd-debugger.md
│       └── ...
├── hooks/
│   └── global/              # Cross-platform hooks (Node.js)
│       ├── gsd-check-update.js
│       └── statusline.js
├── settings.global-template.json   # Plugin/hook configuration
├── mcp.global-template.json        # MCP server configuration
├── REQUIRED_PLUGINS.md             # Plugin documentation
└── CROSS_PLATFORM_SETUP.md         # This file
```

### Local Environment (`~/.claude/`)

```
~/.claude/
├── settings.json            # Main settings (merged from template)
├── mcp.json                 # MCP servers (merged from template)
├── hooks/                   # Hook scripts
├── agents/                  # Agent definitions
├── plugins/                 # Installed plugins (per-environment)
├── cache/                   # Cached data
├── history.jsonl            # Conversation history (NOT synced)
├── .credentials.json        # Secrets (NOT synced)
└── get-shit-done/           # GSD package (installed via npm)
```

## Platform Differences

### Windows CLI vs Claude Code Web

| Feature          | Windows CLI       | Claude Code Web |
| ---------------- | ----------------- | --------------- |
| Shell            | PowerShell/bash   | bash            |
| Path separator   | `\` or `/`        | `/`             |
| Home directory   | `C:\Users\<name>` | `/home/<name>`  |
| Environment vars | `%VAR%` or `$VAR` | `$VAR`          |
| Line endings     | CRLF (converted)  | LF              |

### Cross-Platform Compatible Scripts

The hooks in `.claude/hooks/global/` are written in **Node.js** for
cross-platform compatibility:

- `gsd-check-update.js` - Works on both platforms
- `statusline.js` - Works on both platforms

### Bash-Only Scripts (Not Portable)

These scripts in the repo use bash features and won't work on Windows CMD:

| Script                                                        | Platform  | Alternative                  |
| ------------------------------------------------------------- | --------- | ---------------------------- |
| `.claude/hooks/analyze-user-request.sh`                       | Unix only | Use `.js` version            |
| `.claude/hooks/pattern-check.sh`                              | Unix only | Use `npm run patterns:check` |
| `.claude/skills/systematic-debugging/find-polluter.sh`        | Unix only | Manual or WSL                |
| `.claude/skills/artifacts-builder/scripts/bundle-artifact.sh` | Unix only | Manual or WSL                |

**On Windows:** Use Git Bash, WSL, or the Node.js alternatives.

## Sync Script Usage

### Export (Local → Repo)

```bash
node scripts/sync-claude-settings.js --export
```

Exports:

- Settings (excluding `env` and `permissions`)
- MCP configuration
- Global hooks
- GSD agents

### Import (Repo → Local)

```bash
node scripts/sync-claude-settings.js --import
```

Imports:

- Merges plugin settings (preserves local-only settings)
- Merges MCP servers
- Copies hooks
- Copies agents

### Diff (Compare)

```bash
node scripts/sync-claude-settings.js --diff
```

Shows:

- Settings differences
- Hook sync status
- Agent sync status

## What Gets Synced

### Synced (Portable)

| Item            | Location (Local)            | Location (Repo)                         |
| --------------- | --------------------------- | --------------------------------------- |
| Plugin settings | `~/.claude/settings.json`   | `.claude/settings.global-template.json` |
| MCP servers     | `~/.claude/mcp.json`        | `.claude/mcp.global-template.json`      |
| Global hooks    | `~/.claude/hooks/`          | `.claude/hooks/global/`                 |
| GSD agents      | `~/.claude/agents/gsd-*.md` | `.claude/agents/global/gsd-*.md`        |

### NOT Synced (Environment-Specific)

| Item                          | Reason                    |
| ----------------------------- | ------------------------- |
| `~/.claude/.credentials.json` | Contains secrets          |
| `~/.claude/history.jsonl`     | Large, personal           |
| `~/.claude/cache/`            | Generated data            |
| `~/.claude/plugins/`          | Installed per-environment |
| `~/.claude/todos/`            | Session-specific          |
| `~/.claude/tasks/`            | Session-specific          |
| `~/.claude/get-shit-done/`    | Installed via npm         |

## Environment Setup Checklist

### Windows CLI

- [ ] Install Node.js 18+
- [ ] Install Claude Code CLI
- [ ] Clone repo
- [ ] Run `node scripts/sync-claude-settings.js --import`
- [ ] Restart Claude Code

### Claude Code Web

- [ ] Access Claude Code Web
- [ ] Open repo in workspace
- [ ] Run `node scripts/sync-claude-settings.js --import`
- [ ] Restart session

## Troubleshooting

### Hooks Not Running

1. Check hook paths in settings.json use correct path separators
2. Verify Node.js is available in PATH
3. Check hook file exists at expected location

### Plugins Not Loading

1. Run `node scripts/sync-claude-settings.js --diff` to verify settings
2. Check Claude Code logs for plugin errors
3. Ensure plugin marketplace is accessible

### Agents Not Available

1. Verify agents are in `~/.claude/agents/`
2. Check agent file format (YAML frontmatter required)
3. Restart Claude Code to reload agents

### "Command not found" on Windows

Use Git Bash or WSL for bash-only scripts, or use the Node.js alternatives.

## Best Practices

1. **Always export before committing**: Run `--export` to capture local changes
2. **Use Node.js for hooks**: Ensures cross-platform compatibility
3. **Test on both platforms**: After changes, verify on Windows and Web
4. **Keep secrets local**: Never commit credentials or API keys
5. **Document platform-specific scripts**: Mark bash-only scripts clearly
