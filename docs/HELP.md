# Claude Code CLI Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

> Complete reference for `claude` CLI v2.1.92. Includes flags not shown in
> `--help` (verified by probing the binary directly).

---

## Table of Contents

- [Top-Level Usage](#top-level-usage)
- [Session Management](#session-management)
- [Workspace & Isolation](#workspace--isolation)
- [Model & Behavior](#model--behavior)
- [System Prompt](#system-prompt)
- [Tools & Permissions](#tools--permissions)
- [MCP Configuration](#mcp-configuration)
- [Non-Interactive / Piping](#non-interactive--piping)
- [Plugins & Skills](#plugins--skills)
- [Channels](#channels)
- [Remote & Web](#remote--web)
- [Config & Settings](#config--settings)
- [Browser Integration](#browser-integration)
- [Debug & Diagnostics](#debug--diagnostics)
- [Meta](#meta)
- [Subcommands](#subcommands)
  - [auth](#claude-auth)
  - [mcp](#claude-mcp)
  - [plugin](#claude-plugin)
  - [agents](#claude-agents)
  - [auto-mode](#claude-auto-mode)
  - [remote](#claude-remote)
  - [doctor](#claude-doctor)
  - [install](#claude-install)
  - [setup-token](#claude-setup-token)
  - [update](#claude-update)

---

## Top-Level Usage

```
claude [options] [command] [prompt]
```

Starts an interactive session by default. Use `-p`/`--print` for non-interactive
output.

---

## Session Management

| Flag                       | Description                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `-c, --continue`           | Resume the most recent conversation in the current directory                                                        |
| `-r, --resume [value]`     | Resume by session ID, or open interactive picker with optional search term                                          |
| `--fork-session`           | When resuming, create a new session ID instead of reusing the original (use with `--resume` or `--continue`)        |
| `--from-pr [value]`        | Resume a session linked to a PR by PR number/URL, or open interactive picker with optional search term              |
| `--session-id <uuid>`      | Use a specific session ID for the conversation (must be a valid UUID)                                               |
| `-n, --name <name>`        | Set a display name for this session (shown in `/resume` and terminal title)                                         |
| `--no-session-persistence` | Disable session persistence -- sessions will not be saved to disk and cannot be resumed (only works with `--print`) |

---

## Workspace & Isolation

| Flag                         | Description                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-w, --worktree [name]`      | Create a new git worktree for this session (optionally specify a name)                                                                             |
| `--tmux`                     | Create a tmux session for the worktree (requires `--worktree`). Uses iTerm2 native panes when available; use `--tmux=classic` for traditional tmux |
| `--add-dir <directories...>` | Additional directories to allow tool access to                                                                                                     |

---

## Model & Behavior

| Flag               | Description                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `--model <model>`  | Model for the current session. Aliases: `sonnet`, `opus`, `haiku`. Full names: `claude-sonnet-4-6`, `claude-opus-4-6`, etc.      |
| `--effort <level>` | Effort level for the current session. Choices: `low`, `medium`, `high`, `max`                                                    |
| `--agent <agent>`  | Agent for the current session. Overrides the `agent` setting                                                                     |
| `--agents <json>`  | JSON object defining custom agents (e.g. `'{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}'`) |
| `--verbose`        | Override verbose mode setting from config                                                                                        |
| `--brief`          | Enable `SendUserMessage` tool for agent-to-user communication                                                                    |

---

## System Prompt

| Flag                                 | Description                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `--system-prompt <prompt>`           | Replace the default system prompt entirely                                    |
| `--system-prompt-file <file>`        | Replace the default system prompt with contents of a file **(not in --help)** |
| `--append-system-prompt <prompt>`    | Append to the default system prompt                                           |
| `--append-system-prompt-file <file>` | Append file contents to the default system prompt **(not in --help)**         |

---

## Tools & Permissions

| Flag                                               | Description                                                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--tools <tools...>`                               | Specify available built-in tools. `""` disables all, `"default"` enables all, or list names (e.g. `"Bash,Edit,Read"`) |
| `--allowedTools, --allowed-tools <tools...>`       | Comma or space-separated allow list (e.g. `"Bash(git:*) Edit"`)                                                       |
| `--disallowedTools, --disallowed-tools <tools...>` | Comma or space-separated deny list                                                                                    |
| `--permission-mode <mode>`                         | Permission mode. Choices: `acceptEdits`, `auto`, `bypassPermissions`, `default`, `dontAsk`, `plan`                    |
| `--permission-prompt-tool <tool>`                  | Specify MCP tool for permission handling in non-interactive mode **(not in --help)**                                  |
| `--dangerously-skip-permissions`                   | Bypass ALL permission checks. Recommended only for sandboxes with no internet access                                  |
| `--allow-dangerously-skip-permissions`             | Enable bypassing as an option without enabling by default. Recommended only for sandboxes with no internet access     |

---

## MCP Configuration

| Flag                        | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| `--mcp-config <configs...>` | Load MCP servers from JSON files or strings (space-separated)                     |
| `--strict-mcp-config`       | Only use MCP servers from `--mcp-config`, ignoring all other MCP configurations   |
| `--mcp-debug`               | **(Deprecated -- use `--debug`)** Enable MCP debug mode (shows MCP server errors) |

---

## Non-Interactive / Piping

These flags are designed for scripting, CI/CD, and pipe workflows. Most require
`-p`/`--print`.

| Flag                         | Description                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `-p, --print`                | Print response and exit (useful for pipes). Workspace trust dialog is skipped -- only use in trusted directories                        |
| `--output-format <format>`   | Output format. Choices: `text` (default), `json` (single result), `stream-json` (realtime streaming)                                    |
| `--input-format <format>`    | Input format. Choices: `text` (default), `stream-json` (realtime streaming input)                                                       |
| `--json-schema <schema>`     | JSON Schema for structured output validation. Example: `{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}`  |
| `--max-budget-usd <amount>`  | Maximum dollar amount to spend on API calls                                                                                             |
| `--max-turns <turns>`        | Maximum number of agentic turns **(not in --help)**                                                                                     |
| `--fallback-model <model>`   | Automatic fallback model when default is overloaded                                                                                     |
| `--include-partial-messages` | Include partial message chunks as they arrive (requires `--output-format=stream-json`)                                                  |
| `--include-hook-events`      | Include all hook lifecycle events in output stream (requires `--output-format=stream-json`)                                             |
| `--replay-user-messages`     | Re-emit user messages from stdin on stdout for acknowledgment (requires `--input-format=stream-json` and `--output-format=stream-json`) |

---

## Plugins & Skills

| Flag                       | Description                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `--plugin-dir <path>`      | Load plugins from a directory for this session only (repeatable: `--plugin-dir A --plugin-dir B`) |
| `--disable-slash-commands` | Disable all skills                                                                                |

---

## Channels

Channel plugins enable event streaming from external services.

| Flag                                                   | Description                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `--channels <servers...>`                              | Enable channel plugins (e.g. Telegram, Discord, iMessage, fakechat). Requires Bun and claude.ai login **(not in --help)** |
| `--dangerously-load-development-channels <servers...>` | Load custom development channel plugins **(not in --help)**                                                               |

---

## Remote & Web

| Flag                                            | Description                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `--remote`                                      | Create a web session on claude.ai **(not in --help)**                                  |
| `--remote-control, --rc`                        | Enable Remote Control server mode. Requires full-scope login token **(not in --help)** |
| `--remote-control-session-name-prefix <prefix>` | Prefix for auto-generated Remote Control session names (default: hostname)             |
| `--teleport`                                    | Resume a web session in local terminal **(not in --help)**                             |

---

## Config & Settings

| Flag                          | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bare`                      | Minimal mode: skip hooks, LSP, plugin sync, attribution, auto-memory, background prefetches, keychain reads, CLAUDE.md auto-discovery. Sets `CLAUDE_CODE_SIMPLE=1`. Auth is strictly `ANTHROPIC_API_KEY` or `apiKeyHelper` via `--settings`. Provide context explicitly via `--system-prompt[-file]`, `--append-system-prompt[-file]`, `--add-dir`, `--mcp-config`, `--settings`, `--agents`, `--plugin-dir` |
| `--settings <file-or-json>`   | Path to a settings JSON file or a JSON string to load additional settings                                                                                                                                                                                                                                                                                                                                    |
| `--setting-sources <sources>` | Comma-separated list of setting sources to load: `user`, `project`, `local`                                                                                                                                                                                                                                                                                                                                  |
| `--betas <betas...>`          | Beta headers to include in API requests (API key users only)                                                                                                                                                                                                                                                                                                                                                 |
| `--file <specs...>`           | File resources to download at startup. Format: `file_id:relative_path` (e.g. `--file file_abc:doc.txt file_def:img.png`)                                                                                                                                                                                                                                                                                     |
| `--init`                      | Run initialization hooks **(not in --help)**                                                                                                                                                                                                                                                                                                                                                                 |
| `--init-only`                 | Run initialization hooks and exit **(not in --help)**                                                                                                                                                                                                                                                                                                                                                        |
| `--maintenance`               | Run maintenance hooks **(not in --help)**                                                                                                                                                                                                                                                                                                                                                                    |

---

## Browser Integration

| Flag          | Description                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| `--chrome`    | Enable Claude in Chrome integration                                           |
| `--no-chrome` | Disable Claude in Chrome integration                                          |
| `--ide`       | Automatically connect to IDE on startup if exactly one valid IDE is available |

---

## Debug & Diagnostics

| Flag                   | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `-d, --debug [filter]` | Enable debug mode with optional category filtering (e.g. `"api,hooks"` or `"!1p,!file"`) |
| `--debug-file <path>`  | Write debug logs to a specific file path (implicitly enables debug mode)                 |
| `--mcp-debug`          | **(Deprecated)** Use `--debug` instead                                                   |

---

## Meta

| Flag            | Description               |
| --------------- | ------------------------- |
| `-v, --version` | Output the version number |
| `-h, --help`    | Display help for command  |

---

## Subcommands

### `claude auth`

Manage authentication.

#### `claude auth login`

Sign in to your Anthropic account.

| Flag              | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `--claudeai`      | Use Claude subscription (default)                                        |
| `--console`       | Use Anthropic Console (API usage billing) instead of Claude subscription |
| `--email <email>` | Pre-populate email address on the login page                             |
| `--sso`           | Force SSO login flow                                                     |

#### `claude auth logout`

Log out from your Anthropic account. No additional flags.

#### `claude auth status`

Show authentication status.

| Flag     | Description                   |
| -------- | ----------------------------- |
| `--json` | Output as JSON (default)      |
| `--text` | Output as human-readable text |

---

### `claude mcp`

Configure and manage MCP servers.

#### `claude mcp add <name> <commandOrUrl> [args...]`

Add an MCP server.

| Flag                          | Description                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `-t, --transport <transport>` | Transport type: `stdio`, `sse`, `http`. Defaults to `stdio`                        |
| `-e, --env <env...>`          | Set environment variables (e.g. `-e KEY=value`)                                    |
| `-H, --header <header...>`    | Set WebSocket headers (e.g. `-H "X-Api-Key: abc123"`)                              |
| `-s, --scope <scope>`         | Configuration scope: `local`, `user`, or `project` (default: `local`)              |
| `--callback-port <port>`      | Fixed port for OAuth callback (for servers requiring pre-registered redirect URIs) |
| `--client-id <clientId>`      | OAuth client ID for HTTP/SSE servers                                               |
| `--client-secret`             | Prompt for OAuth client secret (or set `MCP_CLIENT_SECRET` env var)                |

**Examples:**

```bash
# Add HTTP server:
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Add HTTP server with headers:
claude mcp add --transport http corridor https://app.corridor.dev/api/mcp \
  --header "Authorization: Bearer ..."

# Add stdio server with environment variables:
claude mcp add -e API_KEY=xxx my-server -- npx my-mcp-server

# Add stdio server with subprocess flags:
claude mcp add my-server -- my-command --some-flag arg1
```

#### `claude mcp add-json <name> <json>`

Add an MCP server from a JSON string.

| Flag                  | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `-s, --scope <scope>` | Configuration scope: `local`, `user`, or `project` (default: `local`) |
| `--client-secret`     | Prompt for OAuth client secret (or set `MCP_CLIENT_SECRET` env var)   |

#### `claude mcp add-from-claude-desktop`

Import MCP servers from Claude Desktop (Mac and WSL only).

| Flag                  | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `-s, --scope <scope>` | Configuration scope: `local`, `user`, or `project` (default: `local`) |

#### `claude mcp get <name>`

Get details about an MCP server. Workspace trust dialog is skipped and stdio
servers from `.mcp.json` are spawned for health checks.

#### `claude mcp list`

List configured MCP servers. Workspace trust dialog is skipped and stdio servers
from `.mcp.json` are spawned for health checks.

#### `claude mcp remove <name>`

Remove an MCP server.

| Flag                  | Description                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `-s, --scope <scope>` | Configuration scope: `local`, `user`, or `project`. If not specified, removes from whichever scope it exists in |

#### `claude mcp reset-project-choices`

Reset all approved and rejected project-scoped (`.mcp.json`) servers within this
project.

#### `claude mcp serve`

Start the Claude Code MCP server (expose Claude Code itself as an MCP server).

| Flag          | Description                               |
| ------------- | ----------------------------------------- |
| `-d, --debug` | Enable debug mode                         |
| `--verbose`   | Override verbose mode setting from config |

---

### `claude plugin`

Manage Claude Code plugins. Alias: `claude plugins`.

#### `claude plugin install <plugin>`

Install from available marketplaces. Use `plugin@marketplace` for a specific
marketplace. Alias: `claude plugin i`.

| Flag                  | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `-s, --scope <scope>` | Installation scope: `user`, `project`, or `local` (default: `user`) |

#### `claude plugin uninstall <plugin>`

Uninstall an installed plugin. Alias: `claude plugin remove`.

| Flag                  | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `-s, --scope <scope>` | Uninstall from scope: `user`, `project`, or `local` (default: `user`)            |
| `--keep-data`         | Preserve the plugin's persistent data directory (`~/.claude/plugins/data/{id}/`) |

#### `claude plugin update <plugin>`

Update a plugin to the latest version (restart required to apply).

| Flag                  | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `-s, --scope <scope>` | Installation scope: `user`, `project`, `local`, `managed` (default: `user`) |

#### `claude plugin list`

List installed plugins.

| Flag          | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `--json`      | Output as JSON                                                  |
| `--available` | Include available plugins from marketplaces (requires `--json`) |

#### `claude plugin enable <plugin>`

Enable a disabled plugin.

| Flag                  | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `-s, --scope <scope>` | Installation scope: `user`, `project`, `local` (default: auto-detect) |

#### `claude plugin disable [plugin]`

Disable an enabled plugin.

| Flag                  | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `-a, --all`           | Disable all enabled plugins                                           |
| `-s, --scope <scope>` | Installation scope: `user`, `project`, `local` (default: auto-detect) |

#### `claude plugin validate <path>`

Validate a plugin or marketplace manifest. No additional flags.

#### `claude plugin marketplace`

Manage Claude Code marketplaces.

##### `claude plugin marketplace add <source>`

Add a marketplace from a URL, path, or GitHub repo.

| Flag                  | Description                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--scope <scope>`     | Where to declare the marketplace: `user` (default), `project`, or `local`                                                  |
| `--sparse <paths...>` | Limit checkout to specific directories via git sparse-checkout (for monorepos). Example: `--sparse .claude-plugin plugins` |

##### `claude plugin marketplace list`

List all configured marketplaces.

| Flag     | Description    |
| -------- | -------------- |
| `--json` | Output as JSON |

##### `claude plugin marketplace remove <name>`

Remove a configured marketplace. Alias: `rm`.

##### `claude plugin marketplace update [name]`

Update marketplace(s) from their source. Updates all if no name specified.

---

### `claude agents`

List configured agents.

| Flag                          | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `--setting-sources <sources>` | Comma-separated list of setting sources to load: `user`, `project`, `local` |

---

### `claude auto-mode`

Inspect auto mode classifier configuration.

#### `claude auto-mode config`

Print the effective auto mode config as JSON (your settings where set, defaults
otherwise).

#### `claude auto-mode defaults`

Print the default auto mode environment, allow, and deny rules as JSON.

#### `claude auto-mode critique`

Get AI feedback on your custom auto mode rules.

| Flag              | Description                                   |
| ----------------- | --------------------------------------------- |
| `--model <model>` | Override which model is used for the critique |

---

### `claude remote`

Remote Control server mode. Requires a full-scope login token (not long-lived
tokens from `setup-token`). See also `--remote-control` / `--rc` top-level
flags.

---

### `claude doctor`

Check the health of your Claude Code auto-updater. Workspace trust dialog is
skipped and stdio servers from `.mcp.json` are spawned for health checks. Only
use in trusted directories.

---

### `claude install [target]`

Install Claude Code native build. Target can be `stable`, `latest`, or a
specific version number.

| Flag      | Description                                  |
| --------- | -------------------------------------------- |
| `--force` | Force installation even if already installed |

---

### `claude setup-token`

Set up a long-lived authentication token (requires Claude subscription). These
tokens are inference-only and cannot be used with Remote Control.

---

### `claude update`

Check for updates and install if available. Alias: `claude upgrade`.

---

## Hidden Flags Summary

These flags exist and are accepted by the CLI but do not appear in
`claude --help`:

| Flag                                                   | Category        |
| ------------------------------------------------------ | --------------- |
| `--system-prompt-file <file>`                          | System Prompt   |
| `--append-system-prompt-file <file>`                   | System Prompt   |
| `--max-turns <turns>`                                  | Non-Interactive |
| `--permission-prompt-tool <tool>`                      | Permissions     |
| `--remote`                                             | Remote & Web    |
| `--remote-control, --rc`                               | Remote & Web    |
| `--teleport`                                           | Remote & Web    |
| `--channels <servers...>`                              | Channels        |
| `--dangerously-load-development-channels <servers...>` | Channels        |
| `--init`                                               | Config          |
| `--init-only`                                          | Config          |
| `--maintenance`                                        | Config          |

---

_Generated from `claude` v2.1.92 on 2026-04-06. Flags verified by direct CLI
probing._
