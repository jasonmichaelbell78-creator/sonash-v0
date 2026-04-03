# Findings: Claude Code Plugin System — Internal Architecture Deep Dive

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-03T00:00:00Z **Sub-Question:** How does the plugin architecture work
internally, and what does it reveal about Claude Code's plugin system?

---

## Key Findings

### 1. Plugin System Launched October 2025 — Now Stable [CONFIDENCE: HIGH]

The Claude Code plugin system launched in public beta on October 9, 2025,
announced via `claude.com/blog/claude-code-plugins`. It is now a stable, fully
documented feature. The `/plugin` command was introduced at that time as the
management interface [1][2]. This is a relatively young system (under 6 months
old at time of research), which explains why available documentation skews
toward tutorials rather than deep internals.

### 2. `.claude-plugin/` Directory Is Metadata-Only — Components Live at Plugin Root [CONFIDENCE: HIGH]

A critical architectural constraint: the `.claude-plugin/` directory contains
**only** `plugin.json`. All functional components (`commands/`, `agents/`,
`skills/`, `hooks/`, `bin/`, `.mcp.json`, `.lsp.json`) must be at the plugin
root, not inside `.claude-plugin/`. This is documented as the single most common
structural mistake. The manifest itself is optional — Claude Code auto-discovers
components in default locations and derives the plugin name from the directory
name if no `plugin.json` exists [3].

**Complete standard plugin layout:**

```
plugin-root/
├── .claude-plugin/plugin.json      # Metadata only (optional)
├── commands/                       # Legacy slash commands (simple .md files)
├── skills/                         # New-style skills (subdir/SKILL.md structure)
├── agents/                         # Subagent markdown definitions
├── hooks/hooks.json                # Hook event handlers
├── bin/                            # Executables added to Bash tool's PATH
├── output-styles/                  # Output style definitions
├── settings.json                   # Default settings when plugin enabled
├── .mcp.json                       # MCP server definitions
├── .lsp.json                       # Language Server Protocol configs
└── scripts/                        # Shell/node scripts for hooks and MCP
```

### 3. `plugin.json` Schema — Comprehensive With Notable Security Restrictions [CONFIDENCE: HIGH]

The `plugin.json` manifest supports the following fields (all optional except
`name` if manifest is present) [3]:

| Field          | Type                | Purpose                                                      |
| -------------- | ------------------- | ------------------------------------------------------------ |
| `name`         | string              | Unique kebab-case identifier; becomes skill namespace prefix |
| `version`      | semver string       | Version tracking; determines update detection                |
| `description`  | string              | User-facing description                                      |
| `author`       | object              | `{name, email, url}`                                         |
| `homepage`     | string              | Documentation URL                                            |
| `repository`   | string              | Source code URL                                              |
| `license`      | string              | SPDX identifier                                              |
| `keywords`     | array               | Discovery tags                                               |
| `commands`     | string/array        | Custom command paths (replaces default `commands/`)          |
| `agents`       | string/array        | Custom agent paths                                           |
| `skills`       | string/array        | Custom skill paths                                           |
| `hooks`        | string/array/object | Hook config path or inline config                            |
| `mcpServers`   | string/array/object | MCP server config path or inline                             |
| `outputStyles` | string/array        | Output style paths                                           |
| `lspServers`   | string/array/object | LSP server configs                                           |
| `userConfig`   | object              | User-configurable values prompted at install                 |
| `channels`     | array               | Message channel bindings (Telegram, Slack, Discord)          |

**Critical security restriction documented in official reference:**
Plugin-shipped agents explicitly **do not support** `hooks`, `mcpServers`, or
`permissionMode` frontmatter fields. The only valid `isolation` value for plugin
agents is `"worktree"`. This is a deliberate sandboxing constraint — agents
spawned by plugins cannot further expand their own permissions or attach
additional hooks [3].

### 4. Plugin Caching Security Model — Copy-Based Isolation [CONFIDENCE: HIGH]

When plugins are installed via marketplace (not `--plugin-dir`), Claude Code
copies the entire plugin directory to the local plugin cache at
`~/.claude/plugins/cache/` rather than using files in-place. This has direct
security implications [3]:

- Plugins **cannot reference files outside their directory** — path traversal
  via `../` is blocked
- Symlinks within the plugin directory are followed during copy (intentional
  escape hatch for shared dependencies)
- `${CLAUDE_PLUGIN_ROOT}` resolves to the cached copy's path (changes on plugin
  update)
- `${CLAUDE_PLUGIN_DATA}` resolves to `~/.claude/plugins/data/{id}/` (persists
  across updates)
- Sensitive `userConfig` values go to the system keychain, not to
  `settings.json`
- Non-sensitive `userConfig` values are stored in `settings.json` under
  `pluginConfigs[<plugin-id>].options`

**Trust dialog:** Plugins from all scopes (marketplace, user, project) require
explicit user approval via a trust dialog before loading. Anthropic explicitly
disclaims that they "do not manage or audit" any MCP servers bundled in plugins
[4].

### 5. Hook System — Additive Merging With Parallel Execution [CONFIDENCE: HIGH]

Plugin hooks merge additively with user and project hooks — they do not replace
them. Key architectural properties [5]:

- **All matching hooks execute in parallel** (not sequentially) — identical
  handlers are deduplicated by command string (for `command` type) or URL (for
  `http` type)
- **`PreToolUse` decision precedence:** `deny > defer > ask > allow` — if one
  hook denies, denial wins regardless of other hooks
- **Permission source labeling:** When a hook returns `"ask"`, the UI labels the
  source: `[User]`, `[Project]`, `[Plugin]`, or `[Local]`
- **Enterprise override:** `allowManagedHooksOnly` in managed settings blocks
  ALL user, project, and plugin hooks — only administrator-defined managed hooks
  execute
- **`continue: false`** in a hook output is the ultimate override, taking
  precedence over any `"decision": "block"` output

**Codex plugin hook example** (from `openai/codex-plugin-cc`) [6]:

```json
{
  "SessionStart": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-lifecycle-hook.mjs\" SessionStart",
      "timeout": 5
    }
  ],
  "SessionEnd": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-lifecycle-hook.mjs\" SessionEnd",
      "timeout": 5
    }
  ],
  "Stop": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/stop-review-gate-hook.mjs\"",
      "timeout": 900
    }
  ]
}
```

The full hook event surface available to plugins is extensive (22 events in
total): `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`,
`PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `Notification`,
`SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`,
`StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`,
`CwdChanged`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`,
`PostCompact`, `Elicitation`, `ElicitationResult`, `SessionEnd` [3].

**Note:** Hook hook types supported by plugins: `command` (shell), `http` (POST
to URL), `prompt` (LLM evaluation), `agent` (agentic verifier with tools).

### 6. The App-Server Broker Pattern (Codex Plugin) [CONFIDENCE: MEDIUM]

The Codex plugin (`openai/codex-plugin-cc`) implements what reviewers describe
as an **app-server broker pattern**: slash commands trigger Node.js scripts via
`node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs"`, which acts as a thin
forwarder communicating with the Codex app server via JSON-RPC-style messages
over a Unix socket [7][8].

Architectural chain:
`Claude Code slash command → markdown command file → node codex-companion.mjs (subprocess) → Unix socket → Codex app server → local codex CLI binary`

The plugin does NOT spin up a separate runtime — it rides the existing local
Codex CLI login and configuration (`~/.codex/config.toml` and
`.codex/config.toml`). This is explicitly described as "closer to a sharp CLI
wrapper than a native co-reasoning tool" [7].

Commands defined: `/codex:review`, `/codex:adversarial-review`, `/codex:rescue`,
`/codex:status`, `/codex:result`, `/codex:cancel`, `/codex:setup` (7 total).

The Stop hook (`stop-review-gate-hook.mjs`) runs an optional quality gate with a
900-second timeout — intentionally long to allow Codex to complete a full review
before Claude Code finalizes output.

**Confidence note:** The article describing Unix socket details [7] is a single
DEV Community post without corroborating technical source. The hooks.json
contents [6] are directly from the repository and HIGH confidence. The "Unix
socket" claim is MEDIUM — plausible but unverified from official source.

### 7. Plugin Installation Scopes — Four Tiers [CONFIDENCE: HIGH]

Plugins install into one of four scopes [3]:

| Scope            | Settings file                 | Shareable                   | Use case                     |
| ---------------- | ----------------------------- | --------------------------- | ---------------------------- |
| `user` (default) | `~/.claude/settings.json`     | No                          | Personal across all projects |
| `project`        | `.claude/settings.json`       | Yes (git)                   | Team shared                  |
| `local`          | `.claude/settings.local.json` | No (gitignored)             | Project-specific, private    |
| `managed`        | `managed-settings.json`       | Yes (admin-only, read-only) | Org enforcement              |

Plugin state file is `~/.claude/plugins/known_marketplaces.json` (per-user, not
per-project). The `enabledPlugins` key in settings records installed plugins as
`"plugin-name@marketplace-name": true`.

### 8. Marketplace Architecture — Git-Native With Four Source Types [CONFIDENCE: HIGH]

Marketplace files live at `.claude-plugin/marketplace.json` in any git
repository. The format supports four plugin source types [2]:

1. **Relative path** (`"./plugins/my-plugin"`) — local directory in same repo
2. **GitHub shorthand**
   (`{"source": "github", "repo": "owner/repo", "ref": "v1.0", "sha": "abc123"}`)
3. **Git URL** (`{"source": "url", "url": "https://gitlab.example.com/..."}`)
4. **Git subdirectory**
   (`{"source": "git-subdir", "url": "...", "path": "tools/claude-plugin"}`) —
   uses sparse checkout
5. **npm**
   (`{"source": "npm", "package": "@acme/plugin", "version": "2.1.0", "registry": "..."}`)

The Anthropic bundled marketplace (`anthropics/claude-code` main repo) contains
**13 plugins**. The official Anthropic-managed marketplace
(`anthropics/claude-plugins-official`) contains **200+ plugins** spanning
development, productivity, database, security, deployment, design, monitoring,
and more categories [9][10].

**Enterprise restriction:** `strictKnownMarketplaces` in managed settings can:
allow any marketplace (default), lock down completely (`[]`), or specify an
allowlist with `hostPattern`/`pathPattern` regex support for org-managed git
servers [2].

**Seed directory support:** `CLAUDE_CODE_PLUGIN_SEED_DIR` env var pre-populates
plugins for container/CI environments without network access at runtime [2].

### 9. Plugin vs MCP: Relationship and Distinction [CONFIDENCE: HIGH]

Plugins and MCP servers are **different abstraction levels** [11]:

- **MCP (Model Context Protocol)** is the protocol layer — an open standard for
  AI-to-tool communication. Claude Code is an MCP client; MCP servers expose
  capabilities.
- **Plugins** are the distribution/packaging layer — they can bundle MCP servers
  (`.mcp.json`), enabling automatic setup without manual MCP configuration.

When a plugin bundles an MCP server, the server starts automatically when the
plugin is enabled. Plugin MCP tools appear alongside manually-configured MCP
tools in Claude's toolkit. Plugin MCP servers use `${CLAUDE_PLUGIN_ROOT}` and
`${CLAUDE_PLUGIN_DATA}` for path references.

**Key difference:** MCP servers require manual configuration per-environment;
plugins with bundled MCP servers enable one-command team consistency. Plugins
also add skills, agents, hooks, and LSP servers — capabilities MCP protocol does
not cover.

### 10. LSP Server Support — First-Class Plugin Component [CONFIDENCE: HIGH]

Plugins can bundle Language Server Protocol servers (undocumented prior to
official plugin docs). Official LSP plugins available in marketplace [3]:

- `pyright-lsp` (Python), `typescript-lsp` (TypeScript/JS), `rust-analyzer-lsp`
  (Rust), `gopls-lsp` (Go), `clangd-lsp` (C/C++), and 9 more language servers

LSP plugins configure the connection; the binary must be installed separately.
Configuration via `.lsp.json` or inline in `plugin.json`. This gives Claude
real-time diagnostics and code navigation (go-to-definition, find-references,
hover) while editing.

### 11. `bin/` Directory — Executables Injected Into Bash Tool PATH [CONFIDENCE: HIGH]

Plugins can place executables in a `bin/` directory at the plugin root. These
are added to the `PATH` of the Bash tool while the plugin is enabled. This
allows plugin-provided binaries to be invoked as bare commands in any Bash tool
call — a significant capability that extends beyond just slash commands [3].

### 12. `channels` Field — Messaging Bridge to Conversation [CONFIDENCE: HIGH]

The `plugin.json` `channels` field enables plugins to inject content into the
conversation from external messaging systems (Telegram, Slack, Discord). Each
channel binds to a plugin-provided MCP server and can declare its own
`userConfig` for bot tokens. This is how messaging bridge plugins work — the MCP
server receives messages and injects them as conversation context [3].

### 13. `strict` Mode in Marketplace — Authority Control [CONFIDENCE: HIGH]

Marketplace entries support a `strict` boolean field controlling which
definition wins for component configuration [2]:

- `strict: true` (default): `plugin.json` is authoritative; marketplace entry
  can supplement with extra components
- `strict: false`: Marketplace entry is the entire definition; if plugin also
  has `plugin.json` declaring components, this is a conflict and the plugin
  fails to load

This allows marketplace operators to curate or restructure a plugin's exposed
components differently than the plugin author intended.

---

## Sources

| #   | URL                                                                                              | Title                                      | Type               | Trust  | CRAAP | Date      |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------ | ------ | ----- | --------- |
| 1   | https://claude.com/blog/claude-code-plugins                                                      | Claude Code Plugins Launch Announcement    | Official blog      | HIGH   | 4.8   | Oct 2025  |
| 2   | https://code.claude.com/docs/en/plugin-marketplaces                                              | Create and Distribute a Plugin Marketplace | Official docs      | HIGH   | 5.0   | 2025-2026 |
| 3   | https://code.claude.com/docs/en/plugins-reference                                                | Plugins Reference                          | Official docs      | HIGH   | 5.0   | 2025-2026 |
| 4   | https://code.claude.com/docs/en/security                                                         | Claude Code Security                       | Official docs      | HIGH   | 5.0   | 2025-2026 |
| 5   | https://code.claude.com/docs/en/hooks                                                            | Claude Code Hooks Reference                | Official docs      | HIGH   | 5.0   | 2025-2026 |
| 6   | https://github.com/openai/codex-plugin-cc/blob/main/plugins/codex/hooks/hooks.json               | Codex Plugin hooks.json                    | Source code        | HIGH   | 4.6   | 2025      |
| 7   | https://dev.to/oldeucryptoboi/openai-just-shipped-a-plugin-so-codex-runs-inside-claude-code-51oa | DEV.to Architecture Analysis               | Community blog     | MEDIUM | 3.2   | 2025      |
| 8   | https://github.com/openai/codex-plugin-cc                                                        | OpenAI Codex Plugin for Claude Code        | Source code/README | HIGH   | 4.5   | 2025      |
| 9   | https://github.com/anthropics/claude-code/blob/main/.claude-plugin/marketplace.json              | Anthropic Bundled Marketplace              | Source code        | HIGH   | 4.8   | 2025-2026 |
| 10  | https://github.com/anthropics/claude-plugins-official                                            | Claude Plugins Official Repository         | Source code        | HIGH   | 4.8   | 2025-2026 |
| 11  | https://code.claude.com/docs/en/mcp                                                              | Connect Claude Code to Tools via MCP       | Official docs      | HIGH   | 5.0   | 2025-2026 |

---

## Contradictions

**Hook execution order across scopes:** The official docs state all matching
hooks run in parallel and do not define a global cross-scope execution order.
However, a secondary source (deepwiki.com DeepWiki analysis) implies a priority
hierarchy (managed > plugin > project > local > user). The official docs only
define event-level decision precedence (`deny > defer > ask > allow` for
`PreToolUse`), not a global execution order. **Verdict:** Parallel execution
with decision-precedence resolution is authoritative; the implied hierarchy from
secondary sources is not confirmed.

**"Unix socket" for Codex broker:** The DEV.to article claims JSON-RPC over a
Unix socket between `codex-companion.mjs` and the Codex app server. The actual
`hooks.json` and `plugin.json` are confirmed, but the Unix socket claim comes
from a single community article without corroborating source. Possible — Codex's
own app-server protocol may use stdio or local IPC — but unverified at primary
source level.

---

## Gaps

1. **No official documentation on plugin hook execution order across scopes** —
   the docs confirm parallel execution and decision precedence for `PreToolUse`,
   but do not specify whether plugin hooks run before or after user/project
   hooks when all return `allow`.

2. **Codex app-server protocol internals** — the actual wire format and
   transport (stdio vs Unix socket vs named pipe) between `codex-companion.mjs`
   and the Codex app server is not documented in the Codex plugin README or any
   accessible source. The plugin's `scripts/` directory would need inspection to
   confirm.

3. **Plugin trust dialog mechanics** — the docs mention a trust dialog is
   required before loading, but do not detail what information is shown, whether
   the plugin's contents are scanned, or how trust grants are stored.

4. **Managed settings schema for plugin-specific restrictions** —
   `strictKnownMarketplaces` is well-documented, but the mechanism for blocking
   individual plugins (rather than whole marketplaces) is less detailed.

5. **Plugin agent `isolation: "worktree"` behavior** — what specifically happens
   when a plugin agent uses worktree isolation is not fully documented in the
   sources reviewed.

6. **`userConfig` keychain limits** — docs state "approximately 2 KB total
   limit" for the system keychain, shared with OAuth tokens. Exact behavior when
   limit is exceeded is not documented.

7. **Auto-update timing** — background auto-updates run at startup; the exact
   mechanism (git pull frequency, version comparison) is mentioned but not fully
   detailed.

---

## Serendipity

- **The Anthropic bundled marketplace (`anthropics/claude-code` repo) is itself
  a plugin** — the main Claude Code repository includes a
  `.claude-plugin/marketplace.json` that registers 13 bundled plugins including
  `plugin-dev` (a toolkit for building plugins), `hookify` (a meta-plugin for
  creating hooks via markdown), and `security-guidance` (a hook-based security
  reminder system). This reveals that Claude Code's own built-in commands are
  partially migrating to the plugin architecture.

- **`ralph-wiggum` plugin** — one of the 13 bundled Anthropic plugins is named
  after a Simpsons character and described as "Interactive self-referential AI
  loops for iterative development." This appears to be an experimental/creative
  plugin, suggesting Anthropic uses the bundled marketplace for internal
  experiments.

- **LSP as first-class plugin component** — the addition of LSP server support
  in plugins is architecturally significant. It means a plugin can provide not
  just commands and agents but real-time code intelligence, effectively making
  plugins a mechanism for extending Claude Code into a language-aware IDE.

- **`CLAUDE_CODE_PLUGIN_SEED_DIR`** — the seed directory feature for containers
  reveals that Claude Code is being designed for large-scale enterprise and
  CI/CD deployment, not just individual developer use. The ability to pre-bake a
  plugin environment into a Docker image layer is a significant enterprise
  pattern.

- **`channels` field** — the ability for plugins to inject messages from
  external messaging systems (Telegram, Slack, Discord) into Claude Code
  conversations is not widely discussed in community resources but is documented
  in official schema. This enables real-time notification channels and
  "message-driven" agent workflows.

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 1 (Codex Unix socket broker details)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The plugin system architecture is well-documented in official Anthropic sources.
The primary uncertainty is around internal implementation details of the Codex
plugin's broker pattern (transport layer) that are only described in community
sources.
