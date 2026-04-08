# Findings: Logseq Data Storage and Graph Capabilities

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D2a-2

---

## Summary

Logseq uses a dual-layer architecture: markdown files on disk parsed into
DataScript (in-memory Datalog DB) at runtime. The DB version (in
beta/near-production as of 2026) replaces markdown with SQLite (WASM via OPFS)
as the persistence layer. Block-level granularity (not page-level) is the
fundamental difference from Obsidian. Datalog is the query language. An official
CLI (`@logseq/cli`) shipped in early 2026 for offline headless queries. Multiple
community MCP servers exist but all require the desktop app running. Seven
architectural lessons extracted for T28.

---

## Key Findings

### 1. Data Storage Model: Dual-Layer Architecture [CONFIDENCE: HIGH]

Original Logseq (OG/Markdown mode) stores pages as `.md` files. At runtime:
markdown → mldoc AST → Datom entities (triples) → DataScript (in-memory graph DB
with Datalog). On save, serialized back to markdown. Every bullet point is a
discrete **block** with a UUID (`id:: <uuid>`).

Key schema attributes in DataScript:

- `:block/uuid` — stable identity
- `:block/content` — raw text
- `:block/parent` — parent block reference
- `:block/left` — sibling ordering
- `:block/page` — owning page
- `:block/refs` — outgoing link references

**Block-centric, not page-centric.** Pages are containers, not independent
entities.

### 2. DB Version: SQLite Backend, Near-Production 2026 [CONFIDENCE: HIGH]

DB version replaces markdown with SQLite as persistence:

- **DataScript** (in-memory, reactive) — unchanged from OG
- **SQLite WASM via OPFS** — persistence layer
- WAL mode + exclusive locking for performance
- Database worker runs in dedicated web worker thread

**Status (Jan-March 2026 changelog):** Shipped E2E encrypted sync (Cloudflare D1
metadata + R2 storage), official CLI with offline Datascript queries,
bi-directional properties, legacy code removal (org-mode, tldraw, slides).
Production-quality feature delivery, but officially recommended for "testing
purposes" only. Late-beta, not stable.

### 3. DB Version Data Model: Properties as First-Class Entities [CONFIDENCE: HIGH]

Major structural changes:

- **Unified Nodes:** Pages and blocks merged into single "Node" concept
- **Typed properties:** 7 user-facing types (Text, Number, Date, Datetime,
  Checkbox, URL, Node ref)
- **Schema attributes:** type, cardinality (single/many), view-context,
  closed-value sets
- **~90 built-in properties** managing core behavior
- **Class-based inheritance:** tags act as classes; blocks tagged with a class
  inherit property schema
- **Timestamps:** All blocks/pages now have `created-at` and `updated-at`
- **Malli schema validation** at runtime before transactions

### 4. Graph Queries: Datalog [CONFIDENCE: HIGH]

Two tiers:

- **Simple queries:** `{{query <filter>}}` macro for tag, task, date filtering
- **Advanced queries (Datalog):** Full Clojure-style syntax. Can filter by
  content, properties, page, tags, dates; follow reference chains; use recursive
  rules; apply result transformations

**Limitation:** Queries only work within running Logseq context — DataScript is
in-memory, cannot query cold SQLite without Logseq or CLI.

**DB version changes:** `{{query}}` replaced by `/Query` command. Visual DB
Query Builder UI introduced.

### 5. Programmatic Access: CLI, HTTP API, MCP [CONFIDENCE: HIGH]

**Path A — `@logseq/cli` (official, 2026):** Works offline against local DB
graphs. Commands: list graphs, search, Datalog queries, export markdown, import,
append. **Headless-first.**

**Path B — HTTP API (localhost:12315):** Built into desktop app. JSON-RPC,
Bearer token auth. Full CRUD + query execution. **Requires GUI running.**

**Path C — `logseq-query` / `lq` (third-party):** CLI for Datalog queries
against markdown graphs. Named queries, reusable rules, multiple output formats.
**Markdown-only, not DB version compatible.**

### 6. MCP Integration [CONFIDENCE: HIGH]

4 community MCP servers exist, all requiring HTTP API (desktop app running):

- `saichaitanyam/LogseqMCP` — search, DSL query, Datascript query
- `eugeneyvt/logseq-mcp-server` — multi-modal search, CRUD
- `ergut/mcp-logseq` — full CRUD + API architecture
- `mcp-pkm-logseq` (PyPI) — Python-based

No official MCP server. No MCP server wrapping the CLI.

### 7. Logseq vs Obsidian Comparison [CONFIDENCE: HIGH]

| Dimension        | Logseq                            | Obsidian                 |
| ---------------- | --------------------------------- | ------------------------ |
| Atomic unit      | Block (bullet point)              | Page (document)          |
| Link granularity | Block-level `((uuid))`            | Page-level `[[page]]`    |
| Query model      | Datalog on EAV triples            | No native query language |
| Storage          | Markdown + DataScript (in-memory) | Markdown only            |
| Structure        | Outliner-first                    | Document-first           |

### 8. Architectural Lessons for T28 [CONFIDENCE: MEDIUM]

**A — Start with DB, not files.** Logseq spent years on markdown-as-storage, now
doing painful migration. T28 should use a database from day one.

**B — Dual-layer architecture works.** In-memory for reactive queries +
persistent storage for durability. For T28 on Node.js, native SQLite is cleaner
than WASM.

**C — Block-level granularity is powerful but complex.** UUID stability was a
persistent bug in file era. T28 should use database-assigned UUIDs from the
start.

**D — Typed properties as first-class entities.** OG's `key:: value` syntax was
fragile. DB version's typed entities with Malli validation are far more robust.
T28 should model metadata as typed entities.

**E — Datalog is expressive but steep learning curve.** Community struggles with
advanced queries. Consider whether simpler SQL abstraction better serves
solo-developer context.

**F — Format lock-in cost is real.** DB version data lives in proprietary SQLite
schema. Export loses timestamps, UUIDs, structured properties. T28 should define
an open, documentable schema.

**G — CLI-first access from day one.** Logseq only shipped CLI in 2026, years
after initial release. T28 should design programmatic access as first-class.

---

## Sources

| #     | Title                                                | Type           | Trust       |
| ----- | ---------------------------------------------------- | -------------- | ----------- |
| 1     | Logseq Architecture Overview (DeepWiki)              | Community-docs | MEDIUM-HIGH |
| 2     | Property System (DeepWiki)                           | Community-docs | MEDIUM-HIGH |
| 3     | How to Install Logseq DB Version (blog, Oct 2025)    | Blog           | MEDIUM      |
| 4     | Logseq DB Changelog Jan-Mar 2026 (official forum)    | Official       | HIGH        |
| 5     | Why the Database Version (official announcement)     | Official       | HIGH        |
| 6     | Logseq DB Unofficial FAQ                             | Community      | MEDIUM      |
| 7     | Logseq DB Version Official Docs (GitHub)             | Official       | HIGH        |
| 8     | DB Version Changes (GitHub)                          | Official       | HIGH        |
| 9     | Getting Started with Advanced Queries (official hub) | Official       | HIGH        |
| 10    | How Advanced Queries Work (forum explainer)          | Community      | MEDIUM      |
| 11    | Logseq DB and Advanced Queries (forum)               | Community      | MEDIUM      |
| 12    | @logseq/cli npm package                              | Official       | HIGH        |
| 13    | logseq-query (lq) GitHub                             | Community      | MEDIUM      |
| 14    | Headless Logseq via API (forum)                      | Community      | MEDIUM      |
| 15    | Docker Logseq (headless) GitHub                      | Community      | MEDIUM      |
| 16-18 | MCP server repos (3 community implementations)       | Community      | MEDIUM      |
| 19-20 | Obsidian vs Logseq comparisons (blog)                | Blog           | MEDIUM      |

---

## Contradictions

1. **DB version stability:** Official changelogs show production-quality
   features shipping. Community reports say crashy with data loss.
   **Resolution:** Late-beta — functional but not stable for primary use.

2. **Org-mode support:** DB version removes it. Team says they'll "support MD
   mode going forward." Different things (DB vs OG). Org-mode is dead in DB
   trajectory.

3. **CLI headless vs MCP requiring GUI:** CLI works offline. All MCP servers use
   HTTP API (requires desktop app). Not contradictory — parallel access paths —
   but AI-agent integration currently needs the GUI.

---

## Gaps

1. SQLite schema not publicly documented in detail
2. @logseq/cli npm page returned 403 — full command reference reconstructed from
   changelog
3. No Datalog query performance benchmarks found
4. MCP server maintenance status not verified

---

## Serendipity

1. **@logseq/cli offline pattern** — demonstrates local-first offline Datalog
   queries against SQLite graph in Node.js package. Directly reusable pattern
   for T28.
2. **Cloudflare D1 + R2 sync** — viable cloud sync blueprint if T28 ever needs
   it. D1 is edge-hosted SQLite.
3. **"Node" unification** — pages + blocks as single entity type. Elegant schema
   simplification T28 should consider.
