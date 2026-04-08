# Diagnosis: T28 Intelligence Graph V1

**Date:** 2026-04-08 **Task:** Implement T28 Content Intelligence Graph V1 —
SQLite + better-sqlite3 + FTS5 + graphology + custom MCP server

## ROADMAP Alignment

**Aligned.** T28 appears in SESSION_CONTEXT.md as a P1 item ("RESEARCH DONE —
`/deep-plan` next"). It supports the ROADMAP vision of Evidence-Based practices
by providing structured knowledge retrieval across the `.research/` corpus.
Currently in Meta tooling phase (Tooling & Infrastructure bucket).

## Research Context

Extensive prior research exists at
`.research/t28-intelligence-graph-data-layer/`:

- **RESEARCH_OUTPUT.md** (v1.2) — 57 agents, 73 claims, 55 sources. Primary
  recommendation: SQLite + better-sqlite3 v12.8.0 + FTS5 + graphology + custom
  TypeScript MCP server (5-8 tools). HIGH confidence.
- **query-pattern-audit.md** (Session #268) — 85% of real queries are filtered
  lookups/FTS5. **V1 simplified**: 1 edge type (LINKS_TO), inline confidence, no
  temporal query API. Typed edges deferred to V2.
- **source-slug-map.json** — authored this session. 18/18 mappings verified.

### Key V1 Simplifications (Post-Audit)

The query audit materially changed the V1 scope:

| Original Proposal (RESEARCH_OUTPUT)   | Post-Audit V1 Scope                     |
| ------------------------------------- | --------------------------------------- |
| 7 edge types (4 core + 3 inferred)    | 1 edge type (LINKS_TO)                  |
| node_metadata confidence table        | Confidence as column on KnowledgeNode   |
| Bi-temporal query infrastructure      | `invalid_at` column only (no query API) |
| CITES/EXTRACTED_FROM/RELATED_TO edges | Deferred to V2                          |
| 28 source types                       | All via `source_type` discriminator     |

## Relevant Existing Systems

| System                     | Relationship                 | Pattern to Follow                                   |
| -------------------------- | ---------------------------- | --------------------------------------------------- |
| `scripts/mcp/`             | Existing MCP server location | `sonarcloud-server.js` — SDK v1.26, stdio transport |
| `scripts/debt/intake-*.js` | Migration script pattern     | CLI flags, helpers, JSONL output                    |
| `scripts/lib/`             | Shared helpers               | `sanitize-error.js`, `generate-content-hash.js`     |
| `.research/`               | Data source for migration    | analysis.json, extraction-journal.jsonl             |
| `.gitignore`               | Must add `*.db`/`*.db-wal`   | Pattern: regenerable artifacts excluded             |

## Prior Extraction Context

From extraction-journal.jsonl, several candidates inform T28's design:

- **Three-layer architecture** (karpathy gist) — raw sources / wiki / schema
  maps to .research/ / docs+MEMORY / CLAUDE.md+skills
- **Answers-compound-into-wiki** (karpathy gist) — gap: research outputs archive
  but don't feed back to active knowledge layer. T28 closes this.
- **Agent-Native Software Methodology** (CLI-Anything) — MCP tools are the
  agent-native interface for graph access

## Verified Claims

| Claim                                          | Verification                                                  |
| ---------------------------------------------- | ------------------------------------------------------------- |
| better-sqlite3 latest is v12.8.0               | `npm view better-sqlite3 version` → 12.8.0 ✓                  |
| graphology latest is v0.26.0                   | `npm view graphology version` → 0.26.0 ✓                      |
| SonarCloud MCP uses @modelcontextprotocol/sdk  | Read `scripts/mcp/sonarcloud-server.js:15` ✓                  |
| MCP SDK version in project is ^1.26.0          | Read `scripts/mcp/package.json:15` ✓                          |
| `scripts/lib/sanitize-error.js` exists         | Grep found 31+ references ✓                                   |
| `scripts/lib/generate-content-hash.js` exists  | Used in `intake-manual.js:37` ✓                               |
| source-slug-map.json has 18 mappings, 0 misses | Verified this session — node script confirmed 18 OK, 0 MISS ✓ |
| `scripts/t28/` does not yet exist              | Glob returned no files ✓                                      |
| `.research/*.db` not in .gitignore             | Per RESEARCH_OUTPUT C-048, needs to be added ✓                |

## Reframe Check

The task is what it appears to be — a new subsystem build. No reframe needed.

The only open question is **OQ-16 (Neuromcp audit)** which could flip the
build-vs-adopt decision for the MCP layer. However, the research rated custom
build as MEDIUM-HIGH confidence even with OQ-16 open, and the query audit's V1
simplification makes a custom 5-7 tool server very lightweight (days, not
weeks).

**Recommendation:** Proceed as stated. Neuromcp audit can happen during or after
V1 — if it proves sufficient, the MCP layer is the easiest part to swap.
