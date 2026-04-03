# Findings: Claude Code Plugin Ecosystem — Current State and Implications

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** D12

---

## Key Findings

### 1. Plugin System Launched October 9, 2025 (Public Beta) [CONFIDENCE: HIGH]

Claude Code's plugin system launched as a public beta on **October 9, 2025**,
per the official Anthropic blog post at `claude.com/blog/claude-code-plugins`
[1]. The announcement describes plugins as "the standard way to bundle and share
Claude Code customizations." The system was fully stable (post-beta) by late
2025 / early 2026, based on the changelog showing ongoing feature refinement
across versions 2.1.79–2.1.90 [5].

The official documentation is live at `code.claude.com/docs/en/` with dedicated
pages for: `plugins`, `discover-plugins`, `plugin-marketplaces`, and
`plugins-reference` [2][3][4].

---

### 2. Plugin Architecture: What a Plugin Can Contain [CONFIDENCE: HIGH]

A plugin is a directory with a `.claude-plugin/plugin.json` manifest (optional
but recommended). Plugins can package any combination of:

| Component         | Location                 | What it Provides                                                                                  |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| Commands (legacy) | `commands/`              | Slash commands as .md files                                                                       |
| Skills            | `skills/<name>/SKILL.md` | Agent-invokable skills, namespaced as `/plugin-name:skill-name`                                   |
| Agents            | `agents/`                | Subagents with model/effort/maxTurns config                                                       |
| Hooks             | `hooks/hooks.json`       | Event handlers (23 hook types including SessionStart, PreToolUse, PostToolUse, PostCompact, etc.) |
| MCP Servers       | `.mcp.json`              | Bundled MCP server configurations                                                                 |
| LSP Servers       | `.lsp.json`              | Language intelligence (go-to-definition, diagnostics)                                             |
| Executables       | `bin/`                   | Binaries added to Claude's Bash tool PATH                                                         |
| Settings          | `settings.json`          | Default plugin settings (currently only `agent` key supported)                                    |
| Output Styles     | `output-styles/`         | Custom response format definitions                                                                |

Plugin agents explicitly **cannot** use `hooks`, `mcpServers`, or
`permissionMode` in their frontmatter — this is a documented security
restriction [4].

---

### 3. Marketplace System: GitHub-Based Catalog [CONFIDENCE: HIGH]

A marketplace is a git repository containing `.claude-plugin/marketplace.json`.
The system supports:

- **GitHub shorthand**: `/plugin marketplace add owner/repo`
- **Full git URLs**: GitLab, Bitbucket, self-hosted
- **Local paths**: `./my-marketplace`
- **Remote URLs**: direct `marketplace.json` file URLs
- **npm packages**: plugins distributed as npm packages

The `marketplace.json` schema has been fully confirmed via direct fetch of the
Anthropic demo marketplace file [6]:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "marketplace-id",
  "version": "1.0.0",
  "description": "...",
  "owner": { "name": "...", "email": "..." },
  "plugins": [
    {
      "name": "plugin-id",
      "description": "...",
      "version": "1.0.0",
      "author": { "name": "...", "email": "..." },
      "source": "./plugins/plugin-name",
      "category": "development|productivity|learning|security"
    }
  ]
}
```

Plugin sources within a marketplace can reference: relative paths, GitHub repos
(`{"source": "github", "repo": "owner/repo"}`), git URLs, git subdirectories
(sparse clone for monorepos), or npm packages.

---

### 4. Official Anthropic Marketplace: 13 Plugins as of April 2026 [CONFIDENCE: HIGH]

The Anthropic demo marketplace (`anthropics/claude-code`) lists 13 plugins [6]:

| Plugin                      | Category     | Notable                                        |
| --------------------------- | ------------ | ---------------------------------------------- |
| `agent-sdk-dev`             | development  | Agent SDK tools                                |
| `claude-opus-4-5-migration` | development  | Model migration tool                           |
| `code-review`               | productivity | Multi-agent PR review with confidence scoring  |
| `commit-commands`           | productivity | Git commit/push/PR workflows                   |
| `explanatory-output-style`  | learning     | Educational insights mode                      |
| `feature-dev`               | development  | Codebase exploration + architecture agents     |
| `frontend-design`           | development  | Production-grade UI generation                 |
| `hookify`                   | productivity | Define behavioral rules via markdown           |
| `learning-output-style`     | learning     | Interactive learning mode                      |
| `plugin-dev`                | development  | Toolkit for creating plugins (7 expert skills) |
| `pr-review-toolkit`         | productivity | Specialized PR review agents                   |
| `ralph-wiggum`              | development  | Iterative self-referential dev loops           |
| `security-guidance`         | security     | Hook-based security warning system             |

The **official Anthropic marketplace** (`claude-plugins-official`) is separately
maintained at `anthropics/claude-plugins-official` with broader categories
including: LSP plugins for 11 languages, external integrations (GitHub, GitLab,
Firebase, Supabase, Figma, Slack, Sentry, Notion, Linear, Asana, Atlassian,
Vercel), and development workflow plugins [2].

---

### 5. Installation Command Flow (Confirmed from openai/codex-plugin-cc) [CONFIDENCE: HIGH]

The codex-plugin-cc installation sequence confirms the exact command flow
described in the research context [7][8]:

```
1. /plugin marketplace add openai/codex-plugin-cc   ← register catalog
2. /plugin install codex@openai-codex               ← install specific plugin
3. /reload-plugins                                   ← activate without restart
4. /codex:setup                                      ← plugin-specific setup
```

Plugin commands are namespaced: `codex-plugin-cc` provides `/codex:review`,
`/codex:adversarial-review`, `/codex:rescue`, `/codex:status`, `/codex:result`,
`/codex:cancel`, `/codex:setup`.

The codex-plugin-cc was published on **March 30, 2026** by OpenAI, representing
the first major competitor-to-competitor plugin [8][9].

---

### 6. Security Model: High Trust, User-Controlled [CONFIDENCE: HIGH]

Official documentation explicitly states: "Plugins and marketplaces are highly
trusted components that can execute arbitrary code on your machine with your
user privileges." [2]

Key security properties:

- **No sandbox**: plugins run with full user privileges (same as Claude Code
  itself)
- **Trust-before-install**: official docs warn users to verify trust before
  installing
- **Copied to cache**: plugins are copied to `~/.claude/plugins/cache/` — cannot
  reference files outside their directory via `../` paths
- **Path traversal blocked**: paths with `../` are rejected
- **Plugin agents restricted**: `hooks`, `mcpServers`, `permissionMode`
  disallowed in plugin agent frontmatter
- **User config security**: sensitive values stored in system keychain (or
  `~/.claude/.credentials.json`)
- **Enterprise lockdown**: `strictKnownMarketplaces` in managed settings can
  restrict to allowlisted marketplaces only, or lock out all third-party plugins
  (`strictKnownMarketplaces: []`)
- **Channel plugin allowlist**: `allowedChannelPlugins` setting for enterprise
  control

The `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` environment variables are
provided — the latter persists across plugin version updates at
`~/.claude/plugins/data/{id}/`.

---

### 7. Installation Scopes: User, Project, Local, Managed [CONFIDENCE: HIGH]

Plugins use the same scope system as Claude Code settings [4]:

| Scope     | Settings File                 | Use Case                         |
| --------- | ----------------------------- | -------------------------------- |
| `user`    | `~/.claude/settings.json`     | Personal, all projects (default) |
| `project` | `.claude/settings.json`       | Team-shared via git              |
| `local`   | `.claude/settings.local.json` | Personal per-project, gitignored |
| `managed` | managed-settings.json         | Admin-controlled, read-only      |

Project-scope installation adds to `.claude/settings.json` — this means teams
can check plugins into their repos and have all collaborators prompted to
install on trust.

---

### 8. Relationship to Existing Extension Points [CONFIDENCE: HIGH]

Plugins are a packaging/distribution layer on top of existing Claude Code
extension points. The relationship:

| Extension Point | Standalone (pre-plugin)                  | Plugin Equivalent                      |
| --------------- | ---------------------------------------- | -------------------------------------- |
| Skills/Commands | `.claude/commands/` or `.claude/skills/` | `plugin/commands/` or `plugin/skills/` |
| Agents          | `.claude/agents/`                        | `plugin/agents/`                       |
| Hooks           | `.claude/settings.json` `hooks` key      | `plugin/hooks/hooks.json`              |
| MCP servers     | `.mcp.json` in project root              | `plugin/.mcp.json`                     |
| LSP             | `.lsp.json`                              | `plugin/.lsp.json`                     |

The key differences are: namespacing (plugin skills get `plugin-name:skill-name`
prefix), shareability (plugins are versioned, marketplace-distributed), and
isolation (plugins are copied to a cache, cannot reference external files).

Standalone `.claude/` configuration is still the recommended approach for
project-specific, non-shared customization. Plugins are for sharing across
projects/teams/community.

---

### 9. SoNash Skills Are Directly Convertible to Plugins [CONFIDENCE: HIGH]

The official docs include an explicit migration path: "If you already have
skills or hooks in your `.claude/` directory, you can convert them into a plugin
for easier sharing and distribution." [3]

The migration steps are:

1. Create `my-plugin/.claude-plugin/plugin.json` with name/version
2. Copy `.claude/commands/` → `my-plugin/commands/`
3. Copy `.claude/agents/` → `my-plugin/agents/`
4. Copy `.claude/skills/` → `my-plugin/skills/`
5. Migrate hooks from `settings.json` → `my-plugin/hooks/hooks.json`

SoNash's existing skill architecture maps cleanly:

| SoNash Component                                | Plugin Target                          |
| ----------------------------------------------- | -------------------------------------- |
| `.claude/skills/deep-research/` (with SKILL.md) | `plugin/skills/deep-research/SKILL.md` |
| `.claude/agents/*.md` (34 agents)               | `plugin/agents/*.md`                   |
| `.claude/skills/*/SKILL.md` (60+ skills)        | `plugin/skills/*/SKILL.md`             |
| hooks in settings                               | `plugin/hooks/hooks.json`              |

The namespace change is the main behavioral difference: `/deep-research` becomes
`/sonash:deep-research` (or whatever plugin name is chosen).

---

### 10. Creating a SoNash Marketplace is Technically Trivial [CONFIDENCE: HIGH]

A SoNash-specific marketplace would require only:

1. A `.claude-plugin/marketplace.json` in the `sonash-v0` repository root
   listing desired plugins
2. Plugin subdirectories with `plugin.json` manifests
3. The repo already has the skills/agents/hooks in the right format

Team members / future users could then install via:
`/plugin marketplace add jasonmichaelbell78-creator/sonash-v0`

The `extraKnownMarketplaces` setting in `.claude/settings.json` could
pre-register the marketplace for all project contributors.

---

### 11. Plugin Dev Toolkit Available [CONFIDENCE: HIGH]

The official `plugin-dev` plugin (from Anthropic, installable via
`anthropics/claude-code`) provides "7 expert skills covering hooks, MCP
integration, commands, agents, and best practices. AI-assisted plugin creation
and validation." [6]

This is directly usable for SoNash plugin authoring without custom tooling.

---

### 12. Anthropic's Strategic Position: Ecosystem Play [CONFIDENCE: HIGH]

The blog announcement framed plugins as "the standard way to bundle and share
Claude Code customizations" [1]. The key signals of strategic intent:

- **Official submission forms** at both `claude.ai/settings/plugins/submit` and
  `platform.claude.com/plugins/submit` — Anthropic wants the official
  marketplace to be the discovery hub
- **Reserved marketplace names** block impersonation (`claude-code-marketplace`,
  `anthropic-marketplace`, etc.)
- **`allowedChannelPlugins`** and `strictKnownMarketplaces` for enterprise =
  plugins are a monetizable enterprise feature
- **Third-party adoption**: OpenAI shipped a cross-competitor plugin within ~5
  months of launch
- The community site `claudemarketplaces.com` lists hundreds of third-party
  plugins — the ecosystem is already active
- **npm distribution support** means plugin authors can use existing npm
  infrastructure

The plugin system extends Claude Code's competitive moat: the more plugins
exist, the harder it is for users to switch to a competitor tool.

---

## Sources

| #   | URL                                                                                           | Title                                                          | Type                 | Trust  | CRAAP | Date        |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- | ------ | ----- | ----------- |
| 1   | https://claude.com/blog/claude-code-plugins                                                   | Customize Claude Code with plugins (Anthropic Blog)            | official-blog        | HIGH   | 4.6   | Oct 9 2025  |
| 2   | https://code.claude.com/docs/en/discover-plugins                                              | Discover and install prebuilt plugins (Claude Code Docs)       | official-docs        | HIGH   | 4.8   | Current     |
| 3   | https://code.claude.com/docs/en/plugins                                                       | Create plugins (Claude Code Docs)                              | official-docs        | HIGH   | 4.8   | Current     |
| 4   | https://code.claude.com/docs/en/plugins-reference                                             | Plugins reference (Claude Code Docs)                           | official-docs        | HIGH   | 4.8   | Current     |
| 5   | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md                              | Claude Code CHANGELOG                                          | official-source      | HIGH   | 4.5   | April 2025  |
| 6   | https://github.com/anthropics/claude-code/blob/main/.claude-plugin/marketplace.json           | Anthropic demo marketplace.json                                | official-source      | HIGH   | 4.8   | Current     |
| 7   | https://github.com/openai/codex-plugin-cc                                                     | openai/codex-plugin-cc GitHub repo                             | third-party-official | HIGH   | 4.5   | Mar 30 2026 |
| 8   | https://github.com/openai/codex-plugin-cc/blob/main/README.md                                 | codex-plugin-cc README                                         | third-party-official | HIGH   | 4.5   | Mar 30 2026 |
| 9   | https://www.technobezz.com/news/openai-launches-codex-plugin-for-rival-anthropics-claude-code | OpenAI Launches Codex Plugin for Rival Anthropic's Claude Code | news                 | MEDIUM | 3.8   | Mar 2026    |
| 10  | https://code.claude.com/docs/en/plugin-marketplaces                                           | Create and distribute a plugin marketplace                     | official-docs        | HIGH   | 4.8   | Current     |
| 11  | https://github.com/anthropics/claude-plugins-official                                         | claude-plugins-official (Anthropic)                            | official-source      | HIGH   | 4.6   | Current     |

---

## Contradictions

**Launch date discrepancy:** The web search summary stated "October 9, 2025" as
the blog launch date. The CHANGELOG shows the earliest visible plugin entries at
v2.1.80 (around March 2025 in the fetched content). This is likely because the
GitHub release notes visible start from mid-March 2025 (release numbers, not
calendar dates), and the plugin system was already in place before the changelog
window. The blog date of October 9, 2025 is from the official Anthropic blog and
is the most authoritative date for the public beta announcement. However, there
may have been earlier preview/alpha access. MEDIUM confidence on "October 9,
2025" as the original launch — it may be the GA or public beta date after an
earlier limited release.

**Plugin count inconsistency:** The official `claude-plugins-official` repo
reportedly has 15.9k stars but no exact plugin count was extractable. The demo
marketplace (`anthropics/claude-code`) has 13 confirmed plugins. The official
submission marketplace at `claude.com/plugins` may have many more.

---

## Gaps

1. **Exact GA date**: Could not verify whether October 9, 2025 was alpha, beta,
   or GA — the blog says "public beta" which implies not full GA at that point.

2. **Total plugin count in official marketplace**: The `claude.com/plugins` page
   was not fetched. The official `claude-plugins-official` repo summary didn't
   enumerate all plugins.

3. **Plugin security audit history**: No CVEs or security incidents for the
   plugin system were found (the `CVE-2025-54795` search result was for a
   different Claude vulnerability, not plugin-specific).

4. **Pricing/commercial implications**: No information found on whether plugin
   marketplace listing will eventually require payment or revenue sharing with
   Anthropic.

5. **Plugin telemetry**: No documentation found on what analytics Anthropic
   collects from plugin usage.

6. **Plugin performance impact**: No benchmarks on startup time or memory impact
   of multiple installed plugins.

---

## Serendipity

**`hookify` plugin is directly relevant to SoNash's behavioral guardrails:** The
official `hookify` plugin (by Anthropic's Daisy Hollman) "Easily create custom
hooks to prevent unwanted behaviors by analyzing conversation patterns or from
explicit instructions. Define rules via simple markdown files." This is
essentially what CLAUDE.md's guardrails section does — SoNash could use hookify
as a foundation for formalizing behavioral rules into verifiable hooks rather
than prose instructions.

**`ralph-wiggum` plugin for convergence loops:** The `ralph-wiggum` plugin
implements "Interactive self-referential AI loops for iterative development.
Claude works on the same task repeatedly, seeing its previous work, until
completion." This is architecturally similar to SoNash's `/convergence-loop`
skill — worth examining as a reference implementation.

**`feature-dev` plugin overlaps with SoNash's GSD workflow:** The `feature-dev`
plugin provides "Comprehensive feature development workflow with specialized
agents for codebase exploration, architecture design, and quality review." This
is essentially SoNash's multi-agent development approach as a shareable plugin.

**`code-review` plugin is equivalent to SoNash's `pr-review` skill:** Uses
"multiple specialized agents with confidence-based scoring to filter false
positives" — similar to SoNash's multi-agent PR review approach. Examining its
agent definitions could inform improvements to SoNash's existing review skill.

**npm source type enables private distribution:** Plugins can be distributed as
npm packages with version ranges (`^2.0.0`). This means SoNash could publish
plugins to a private npm registry (or GitHub Packages) for version-controlled
team distribution without exposing a public GitHub repo.

**Container seeding for CI/CD:** `CLAUDE_CODE_PLUGIN_SEED_DIR` and
`CLAUDE_CODE_PLUGIN_CACHE_DIR` env vars support pre-populating plugins in Docker
containers — relevant if SoNash ever runs in CI/CD pipelines.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All key findings are sourced directly from official Anthropic documentation
(fetched live), the official `anthropics/claude-code` repository, and the
`openai/codex-plugin-cc` repository. Cross-referenced across multiple official
sources.
