# Codex and Claude Dual-System Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-08-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Approval:** Approved

**Decision:** Keep Claude and Codex as permanent, independent development
systems.

## Non-Negotiable Constraints

- Never delete, move, rename, or overwrite `CLAUDE.md` or `.claude/`.
- Codex is additive: its repository assets live in `AGENTS.md` and `.codex/`.
- Neither system may require the other to operate.
- Do not copy secrets, transcripts, caches, or session logs into Codex.
- Retain existing `.claude/` scripts and package commands until a separately
  tested Codex equivalent exists.

## Target Layout

```text
CLAUDE.md                         # Existing Claude instructions; preserved
.claude/                          # Existing Claude ecosystem; preserved

AGENTS.md                         # Codex repository guidance
.codex/
  README.md                       # Codex setup and operating guide
  config.toml                     # Project-scoped Codex settings and MCP
  hooks.json                      # Codex lifecycle configuration
  hooks/                          # Codex-only hook implementations
  agents/                         # Codex subagent roles
  skills/                         # Codex-compatible workflows
  migration/                      # Inventory and parity records
  tests/                          # Codex smoke tests
```

## Execution Phases

### 1. Protect and inventory Claude

Create a complete, read-only inventory of `CLAUDE.md`, `.claude/settings.json`,
hooks, agents, skills, commands, MCP templates, protocols, memory, state, and
scripts that reference `.claude/`. Every asset receives a disposition:
`Codex equivalent added`, `Claude-only`, `shared neutral implementation`,
`not applicable`, or `deferred`.

### 2. Reproducible Codespaces baseline

Add a devcontainer that uses Node 22 and installs the root and Functions
dependencies. Verify Codex, GitHub CLI, Firebase CLI, gitleaks, ripgrep, and
browser-testing requirements. Keep encrypted secrets encrypted and inject
credentials only through Codespaces secrets or local ignored files.

### 2A. Branch and dependency backlog stabilization

Run the approved branch-triage workflow in
[BRANCH_TRIAGE_PLAN.md](./BRANCH_TRIAGE_PLAN.md) before encoding dependency
assumptions into the development environment.

### 3. Codex foundation

Create a concise `AGENTS.md`, `.codex/config.toml`, `.codex/hooks.json`, and
`.codex/README.md`. Port durable project rules, not Claude-specific tool syntax
or session mechanics.

### 3A. Dual-workflow guide

Create and maintain
[CODEX_CLAUDE_DUAL_WORKFLOW_GUIDE.md](../CODEX_CLAUDE_DUAL_WORKFLOW_GUIDE.md)
before migrating skills or agents. It documents commands, navigation,
permissions, hooks, skills, agents, MCP, memory, and safe operation of both
systems.

### 4. Safety, hooks, and MCP

Create separate Codex equivalents for validated safety controls: protected
secrets, Firestore rule changes, deployment safeguards, direct-main protection,
and post-write validation. Put universal enforcement in Git hooks or CI where
appropriate, without removing Claude hooks. Configure Codex MCP servers with
environment-variable forwarding and per-tool approval policies.

### 5. Codex roles and skills

Port high-value daily workflows first: SoNash context, planning, debugging,
review, testing, security, documentation, and session workflows. Create a
compact Codex role set rather than duplicating all Claude agents one-for-one.
Preserve every Claude source definition.

### 6. Shared assets, validation, and maintenance

Copy—not move—candidate shared scripts and protocols to neutral locations.
Validate Claude and Codex independently. Maintain a parity matrix and recurring
drift review; there is no cutover, decommissioning, archival, or deletion phase.

## Completion Criteria

- A fresh Codespace supports either workflow.
- Claude files and Claude-only workflows are unchanged and still functional.
- Codex has documented, tested configuration, safety hooks, roles, skills, and
  MCP integrations.
- Required project knowledge is checked in rather than relying on runtime
  memory.
- Every legacy Claude asset has an explicit recorded disposition.
