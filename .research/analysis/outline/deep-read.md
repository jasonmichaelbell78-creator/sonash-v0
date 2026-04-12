# Deep Read: outline/outline

## Artifact Discovery Summary

| Category          | Count | Key Finds                                                                      |
| ----------------- | ----- | ------------------------------------------------------------------------------ |
| Architecture docs | 2     | ARCHITECTURE.md (detailed), SERVICES.md (service decomposition)                |
| AI workflow docs  | 2     | CLAUDE.md (197 lines, comprehensive), AGENTS.md (1 line stub)                  |
| Security docs     | 1     | SECURITY.md (vulnerability reporting only)                                     |
| Translation/i18n  | 2     | TRANSLATION.md, CrowdIn integration guide                                      |
| Onboarding docs   | 4     | server/onboarding/ — user-facing getting-started content                       |
| Internal READMEs  | 4     | server/tools/, shared/editor/commands/, shared/i18n/, shared/utils/rfc6902/    |
| Plugin system     | 22    | plugins/ — no per-plugin README, but consistent client/server/shared structure |
| MCP tools         | 7     | server/tools/\*.ts — production MCP server with @modelcontextprotocol/sdk      |
| CI workflows      | 8     | .github/workflows/ — ci, docker, codeql, stale, image optimization             |

## Key Knowledge Not Visible From Code Alone

### 1. Production MCP Server (HIGH relevance)

Outline ships a **production MCP server** using `@modelcontextprotocol/sdk`. The
`server/tools/` directory contains 7 tool modules (documents, collections,
comments, attachments, users, fetch, util). The MCP tools:

- Use Zod for input validation (same as SoNash)
- Implement OAuth scope-based tool registration (tools filtered by granted
  scopes)
- Bridge MCP context to Koa-style API context via `buildAPIContext()`
- Include tracing instrumentation via `withTracing()` wrapper
- Follow a presenter pattern for response formatting

This is one of the more mature production MCP implementations in a real
application.

### 2. Command Pattern (HIGH relevance)

The `server/commands/` directory (8,719 lines total) implements a **command
pattern** for multi-model operations. Commands like `documentCreator`,
`documentMover`, `documentUpdater` encapsulate complex business logic that spans
multiple Sequelize models. This separates business logic from both API routes
AND MCP tools — both delegate to the same commands. This is a clean abstraction
that avoids duplicating logic between API and MCP surfaces.

### 3. Plugin Architecture (MEDIUM relevance)

22 plugins follow a consistent structure: `client/` (React components),
`server/` (Koa routes, processors), `shared/` (types). No plugin manifest or
registration file found — likely auto-discovered via directory convention.
Plugins include auth providers (Azure, Google, OIDC, passkeys), integrations
(Slack, Discord, Linear, GitHub, GitLab, Notion, Figma), and features
(search-postgres, storage, webhooks, zapier).

### 4. CLAUDE.md Quality (MEDIUM relevance)

At 197 lines, Outline's CLAUDE.md is comprehensive and well-structured. Covers:
monorepo structure, coding guidelines, TypeScript rules, class organization,
React/MobX patterns, database/ORM patterns, API design, auth/authorization,
real-time collaboration, testing, code quality, error handling, performance, and
security. Notable: includes ProseMirror-specific security guidance
(`sanitizeUrl()` for `toDOM` methods). AGENTS.md is a 1-line stub pointing to
ARCHITECTURE.md.

### 5. Model Infrastructure (MEDIUM relevance)

64 Sequelize models with sophisticated base classes: `Model`, `IdModel`,
`ParanoidModel`, `ArchivableModel`. Custom decorators: `@Changeset`,
`@CounterCache`, `@Deprecated`, `@Encrypted`, `@Fix`. 281 migrations over the
project's 10-year history.

### 6. Queue/Event System (MEDIUM relevance)

Bull-based queue system with specialized processors for every domain event
(document archived, moved, subscriptions, emails, file operations, imports,
integrations). HealthMonitor for queue health. Processors follow `BaseProcessor`
pattern.

### 7. Vendored Dependencies

rfc6902 (JSON Patch) vendorized in `shared/utils/rfc6902/` with a specific
performance fix for large array diffs. Documents the upstream PR and fork — good
vendor practice.

### 8. Onboarding Content

4 markdown templates in `server/onboarding/` provide user-facing content that
gets inserted into new team workspaces. Shows how Outline bootstraps new users.

## External Resources Cataloged for Phase 4b

- getoutline.com/developers — API documentation
- translate.getoutline.com — CrowdIn translation platform
- docs.getoutline.com/s/hosting/ — Self-hosting documentation
- docs.getoutline.com/s/guide — User guide
- prosemirror.net/docs — ProseMirror editor docs
- github.com/chbrown/rfc6902/pull/88 — Vendored performance fix
- github.com/outline/outline/security/advisories — Security reporting
